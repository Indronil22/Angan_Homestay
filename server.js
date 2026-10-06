const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "data");
const UPLOAD_DIR = path.join(__dirname, "uploads");

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(path.join(UPLOAD_DIR, "photos"), { recursive: true });
fs.mkdirSync(path.join(UPLOAD_DIR, "videos"), { recursive: true });

const usersFile = path.join(DATA_DIR, "users.json");
const propertiesFile = path.join(DATA_DIR, "properties.json");
const requestsFile = path.join(DATA_DIR, "requests.json");

function readJson(file, fallback = []) {
  if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify(fallback, null, 2));
  return JSON.parse(fs.readFileSync(file, "utf8"));
}
function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

let users = readJson(usersFile);
let properties = readJson(propertiesFile);
let requests = readJson(requestsFile);

if (!users.some(u => u.email === "admin@angan.com")) {
  users.push({
    id: Date.now().toString(),
    name: "Angan Admin",
    email: "admin@angan.com",
    password: bcrypt.hashSync("ChangeMe123!", 12),
    role: "admin"
  });
  writeJson(usersFile, users);
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || "change-this-secret-before-production",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 1000 * 60 * 60 * 8
  }
}));

app.use("/uploads", express.static(UPLOAD_DIR));
app.use(express.static(path.join(__dirname, "public")));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, file.mimetype.startsWith("video/") ? path.join(UPLOAD_DIR, "videos") : path.join(UPLOAD_DIR, "photos"));
  },
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${safe}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }
});

function auth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: "Login required" });
  next();
}
function role(...roles) {
  return (req, res, next) => {
    if (!req.session.user || !roles.includes(req.session.user.role)) {
      return res.status(403).json({ error: "Access denied" });
    }
    next();
  };
}

// ---------- AUTH ----------
app.post("/api/register", async (req, res) => {
  const { name, email, password, role: requestedRole } = req.body;
  const cleanEmail = String(email || "").trim().toLowerCase();

  if (!name || !cleanEmail || !password) {
    return res.status(400).json({ error: "Name, email and password are required." });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters." });
  }
  if (!["traveler", "host"].includes(requestedRole)) {
    return res.status(400).json({ error: "Invalid account type." });
  }
  if (users.some(u => u.email === cleanEmail)) {
    return res.status(409).json({ error: "An account with this email already exists." });
  }

  const user = {
    id: Date.now().toString(),
    name: String(name).trim(),
    email: cleanEmail,
    password: await bcrypt.hash(password, 12),
    role: requestedRole
  };

  users.push(user);
  writeJson(usersFile, users);

  req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role };
  res.json({ user: req.session.user });
});

app.post("/api/login", async (req, res) => {
  const cleanEmail = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  const user = users.find(u => u.email === cleanEmail);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role };
  res.json({ user: req.session.user });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get("/api/me", (req, res) => {
  res.json({ user: req.session.user || null });
});

// ---------- PUBLIC PROPERTIES ----------
app.get("/api/properties", (req, res) => {
  res.json(properties.filter(p => p.status === "approved"));
});

app.get("/api/properties/:id", (req, res) => {
  const p = properties.find(p => p.id === req.params.id && p.status === "approved");
  if (!p) return res.status(404).json({ error: "Property not found." });
  res.json(p);
});

// ---------- HOST ----------
app.post("/api/properties", auth, role("host"), upload.fields([
  { name: "photos", maxCount: 12 },
  { name: "video", maxCount: 1 }
]), (req, res) => {
  const { propertyName, location, price, rooms, description, phone, whatsapp, instagram } = req.body;

  if (!propertyName || !location || !price || !rooms || !description) {
    return res.status(400).json({ error: "Please complete all required property fields." });
  }

  const photos = (req.files?.photos || []).map(f => `/uploads/photos/${f.filename}`);
  const video = req.files?.video?.[0] ? `/uploads/videos/${req.files.video[0].filename}` : "";

  const property = {
    id: Date.now().toString(),
    hostId: req.session.user.id,
    hostName: req.session.user.name,
    propertyName,
    location,
    price,
    rooms,
    description,
    phone: phone || "",
    whatsapp: whatsapp || phone || "",
    instagram: instagram || "",
    photos,
    video,
    status: "pending",
    createdAt: new Date().toISOString()
  };

  properties.push(property);
  writeJson(propertiesFile, properties);
  res.json({ property });
});

app.get("/api/host/properties", auth, role("host"), (req, res) => {
  res.json(properties.filter(p => p.hostId === req.session.user.id));
});

app.get("/api/host/requests", auth, role("host"), (req, res) => {
  const mine = requests.filter(r => r.hostId === req.session.user.id);
  res.json(mine);
});

app.patch("/api/host/requests/:id", auth, role("host"), (req, res) => {
  const request = requests.find(r => r.id === req.params.id && r.hostId === req.session.user.id);
  if (!request) return res.status(404).json({ error: "Request not found." });

  if (!["accepted", "declined"].includes(req.body.status)) {
    return res.status(400).json({ error: "Invalid status." });
  }

  request.status = req.body.status;
  writeJson(requestsFile, requests);
  res.json({ request });
});

// ---------- TRAVELER ----------
app.post("/api/requests", auth, role("traveler"), (req, res) => {
  const { propertyId, type, checkIn, checkOut, guests, preferredDate, preferredTime, message } = req.body;
  const property = properties.find(p => p.id === propertyId && p.status === "approved");

  if (!property) return res.status(404).json({ error: "Property not found." });
  if (!["booking", "tour", "inquiry"].includes(type)) {
    return res.status(400).json({ error: "Invalid request type." });
  }

  const request = {
    id: Date.now().toString(),
    travelerId: req.session.user.id,
    travelerName: req.session.user.name,
    travelerEmail: req.session.user.email,
    hostId: property.hostId,
    propertyId: property.id,
    propertyName: property.propertyName,
    type,
    checkIn: checkIn || "",
    checkOut: checkOut || "",
    guests: guests || "",
    preferredDate: preferredDate || "",
    preferredTime: preferredTime || "",
    message: message || "",
    status: "pending",
    createdAt: new Date().toISOString()
  };

  requests.push(request);
  writeJson(requestsFile, requests);
  res.json({ request });
});

app.get("/api/traveler/requests", auth, role("traveler"), (req, res) => {
  res.json(requests.filter(r => r.travelerId === req.session.user.id));
});

// ---------- ADMIN ----------
app.get("/api/admin/properties", auth, role("admin"), (req, res) => {
  res.json(properties);
});

app.patch("/api/admin/properties/:id", auth, role("admin"), (req, res) => {
  const property = properties.find(p => p.id === req.params.id);
  if (!property) return res.status(404).json({ error: "Property not found." });

  if (!["approved", "rejected", "pending"].includes(req.body.status)) {
    return res.status(400).json({ error: "Invalid status." });
  }

  property.status = req.body.status;
  property.reviewedAt = new Date().toISOString();
  writeJson(propertiesFile, properties);
  res.json({ property });
});

app.get("/api/admin/requests", auth, role("admin"), (req, res) => {
  res.json(requests);
});

app.listen(PORT, () => {
  console.log(`Angan running at http://localhost:${PORT}`);
  console.log("Admin: admin@angan.com / ChangeMe123!");
});
