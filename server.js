const express = require("express");
const session = require("cookie-session");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "data");
const UPLOAD_DIR = process.env.VERCEL
  ? path.join("/tmp", "uploads")
  : path.join(__dirname, "uploads");

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

if (!users.some(u => u.email === "admin@hsg.com")) {
  users.push({
    id: Date.now().toString(),
    name: "HSG Admin",
    email: "admin@hsg.com",
    password: bcrypt.hashSync("ChangeMe123!", 12),
    role: "admin"
  });
  writeJson(usersFile, users);
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  name: "session",
  keys: [
    process.env.SESSION_SECRET || "change-this-secret-before-production"
  ],
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 1000 * 60 * 60 * 8
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
  const { name, email, password } = req.body;
  const cleanEmail = String(email || "").trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!name || !cleanEmail || !password) {
    return res.status(400).json({ error: "Name, email and password are required." });
  }
  if (!emailRegex.test(cleanEmail)) {
    return res.status(400).json({ error: "Please enter a valid email address." });
  }
  if (password.length < 8) {
    return res.status(400).json({
      error: "Password must be at least 8 characters."
    });
  }
  // if (!["traveler", "host"].includes(requestedRole)) {
  //   return res.status(400).json({ error: "Invalid account type." });
  // }
  if (users.some(u => u.email === cleanEmail)) {
    return res.status(409).json({ error: "An account with this email already exists." });
  }

  const user = {
    id: Date.now().toString(),
    name: String(name).trim(),
    email: cleanEmail,
    password: await bcrypt.hash(password, 12),
    role: "host"
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

  req.session.user = {
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role
};

console.log("LOGIN SESSION:", req.session);

res.json({
  user: req.session.user
});

});

app.post("/api/contact", (req, res) => {
  const { name, email, subject, message } = req.body;

  const cleanName = String(name || "").trim();
  const cleanEmail = String(email || "").trim().toLowerCase();
  const cleanSubject = String(subject || "").trim();
  const cleanMessage = String(message || "").trim();

  if (!cleanName || !cleanEmail || !cleanSubject || !cleanMessage) {
    return res.status(400).json({
      error: "Please complete all fields."
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(cleanEmail)) {
    return res.status(400).json({
      error: "Please enter a valid email address."
    });
  }

  if (cleanName.length > 100) {
    return res.status(400).json({
      error: "Name is too long."
    });
  }

  if (cleanSubject.length > 200) {
    return res.status(400).json({
      error: "Subject is too long."
    });
  }

  if (cleanMessage.length > 5000) {
    return res.status(400).json({
      error: "Message is too long."
    });
  }

  console.log("Contact request received:", {
    name: cleanName,
    email: cleanEmail,
    subject: cleanSubject,
    message: cleanMessage
  });

  res.json({
    message: "Your message has been received."
  });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get("/api/me", (req, res) => {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");

    console.log("SESSION:", req.session);

    res.json({
        user: req.session.user || null
    });
});

app.get("/api/host/properties", auth, role("host"), (req, res) => {

  const hostProperties = properties.filter(
    property => String(property.hostId) === String(req.session.user.id)
  );

  res.json(hostProperties);

});

// ----------- BLOG API -----------

app.get("/api/blogs", (req, res) => {
    try {
        const blogs = JSON.parse(
            fs.readFileSync(
                path.join(__dirname, "data", "blogs.json"),
                "utf8"
            )
        );

        res.json(
            blogs.filter(blog => blog.status === "published")
        );

    } catch (error) {
        console.error("Blog fetch error:", error);
        res.status(500).json({
            error: "Unable to load blogs."
        });
    }
});

app.get("/api/blogs/:id", (req, res) => {
    try {
        const blogs = JSON.parse(
            fs.readFileSync(
                path.join(__dirname, "data", "blogs.json"),
                "utf8"
            )
        );

        const blog = blogs.find(
            blog => blog.id === req.params.id &&
                    blog.status === "published"
        );

        if (!blog) {
            return res.status(404).json({
                error: "Blog post not found."
            });
        }

        res.json(blog);

    } catch (error) {
        console.error("Blog fetch error:", error);
        res.status(500).json({
            error: "Unable to load blog."
        });
    }
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
  const {
    propertyName,
    location,
    price,
    rooms,
    description,
    phone,
    whatsapp,
    instagram,
    offerEnabled,
    offerTitle,
    offerValue,
    offerStartDate,
    offerEndDate
  } = req.body;

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
    offerEnabled: offerEnabled === "on",
    offerTitle: offerTitle || "",
    offerValue: offerValue || "",
    offerStartDate: offerStartDate || "",
    offerEndDate: offerEndDate || "",
    images: photos,
    video,
    status: "pending",
    createdAt: new Date().toISOString()
  };

  properties.push(property);
  writeJson(propertiesFile, properties);
  res.json({ property });
});

app.put("/api/properties/:id", auth, role("host"), upload.fields([
  { name: "photos", maxCount: 12 },
  { name: "video", maxCount: 1 }
]), (req, res) => {
  const property = properties.find(
    p =>
      String(p.id) === String(req.params.id) &&
      String(p.hostId) === String(req.session.user.id)
  );

  if (!property) {
    return res.status(404).json({
      error: "Property not found."
    });
  }

  const previousVersion = {
    propertyName: property.propertyName,
    location: property.location,
    price: property.price,
    rooms: property.rooms,
    description: property.description,
    phone: property.phone,
    whatsapp: property.whatsapp,
    instagram: property.instagram,
    offerEnabled: property.offerEnabled,
    offerTitle: property.offerTitle,
    offerValue: property.offerValue,
    offerStartDate: property.offerStartDate,
    offerEndDate: property.offerEndDate,
    images: property.images,
    video: property.video
  };

  const {
    propertyName,
    location,
    price,
    rooms,
    description,
    phone,
    whatsapp,
    instagram,
    offerEnabled,
    offerTitle,
    offerValue,
    offerStartDate,
    offerEndDate
  } = req.body;

  if (!propertyName || !location || !price || !rooms || !description) {
    return res.status(400).json({
      error: "Please complete all required property fields."
    });
  }

  property.propertyName = propertyName;
  property.location = location;
  property.price = price;
  property.rooms = rooms;
  property.description = description;
  property.phone = phone || "";
  property.whatsapp = whatsapp || phone || "";
  property.instagram = instagram || "";

  property.offerEnabled = offerEnabled === "on";
  property.offerTitle = offerTitle || "";
  property.offerValue = offerValue || "";
  property.offerStartDate = offerStartDate || "";
  property.offerEndDate = offerEndDate || "";

  const newPhotos = (req.files?.photos || [])
    .map(f => `/uploads/photos/${f.filename}`);

  const newVideo = req.files?.video?.[0]
    ? `/uploads/videos/${req.files.video[0].filename}`
    : "";

  if (newPhotos.length) {
    property.images = newPhotos;
  }

  if (newVideo) {
    property.video = newVideo;
  }

  property.previousVersion = previousVersion;
  property.editPending = true;

  property.status = "pending";
  property.updatedAt = new Date().toISOString();

  writeJson(propertiesFile, properties);

  res.json({
    message: "Property updated and submitted for approval.",
    property
  });
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
  const property = properties.find(
    p => String(p.id) === String(propertyId)
  );

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

// ----------- BLOG IMAGE UPLOAD -----------

const blogUpload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {

            const blogDir = path.join(
                UPLOAD_DIR,
                "blog"
            );

            fs.mkdirSync(blogDir, {
                recursive: true
            });

            cb(null, blogDir);
        },

        filename: (req, file, cb) => {

            const extension =
                path.extname(file.originalname);

            const filename =
                `blog-${Date.now()}${extension}`;

            cb(null, filename);
        }
    }),

    fileFilter: (req, file, cb) => {

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!allowedTypes.includes(file.mimetype)) {
            return cb(
                new Error(
                    "Only JPG, PNG and WEBP images are allowed."
                )
            );
        }

        cb(null, true);
    },

    limits: {
        fileSize: 5 * 1024 * 1024
    }
});


app.post(
    "/api/admin/blogs/upload-image",
    auth,
    role("admin"),
    blogUpload.single("coverImage"),
    (req, res) => {

        try {

            if (!req.file) {
                return res.status(400).json({
                    error: "No image uploaded."
                });
            }

            res.json({
                success: true,
                imageUrl: `/uploads/blog/${req.file.filename}`
            });

        } catch (error) {

            console.error(
                "Blog image upload error:",
                error
            );

            res.status(500).json({
                error: "Unable to upload image."
            });
        }
    }
);

// ----------- ADMIN BLOG API -----------

app.post("/api/admin/blogs", auth, role("admin"), (req, res) => {
    try {
        const blogs = JSON.parse(
            fs.readFileSync(
                path.join(__dirname, "data", "blogs.json"),
                "utf8"
            )
        );

        const {
            title,
            summary,
            content,
            coverImage,
            category,
            status
        } = req.body;

        if (!title || !content) {
            return res.status(400).json({
                error: "Title and content are required."
            });
        }

        const newBlog = {
            id: `blog-${Date.now()}`,
            title,
            summary: summary || "",
            content,
            coverImage: coverImage || "",
            category: category || "Travel",
            status: status || "draft",
            author: "HomeStay Gallery",
            createdAt: new Date().toISOString()
        };

        blogs.push(newBlog);

        fs.writeFileSync(
            path.join(__dirname, "data", "blogs.json"),
            JSON.stringify(blogs, null, 2)
        );

        res.status(201).json(newBlog);

    } catch (error) {
        console.error("Blog creation error:", error);
        res.status(500).json({
            error: "Unable to create blog."
        });
    }
});


app.get("/api/admin/blogs", auth, role("admin"), (req, res) => {
    try {
        const blogs = JSON.parse(
            fs.readFileSync(
                path.join(__dirname, "data", "blogs.json"),
                "utf8"
            )
        );

        res.json(blogs);

    } catch (error) {
        console.error("Admin blog fetch error:", error);
        res.status(500).json({
            error: "Unable to load blogs."
        });
    }
});


app.put("/api/admin/blogs/:id", auth, role("admin"), (req, res) => {
    try {
        const blogs = JSON.parse(
            fs.readFileSync(
                path.join(__dirname, "data", "blogs.json"),
                "utf8"
            )
        );

        const index = blogs.findIndex(
            blog => blog.id === req.params.id
        );

        if (index === -1) {
            return res.status(404).json({
                error: "Blog post not found."
            });
        }

        blogs[index] = {
            ...blogs[index],
            ...req.body,
            id: blogs[index].id
        };

        fs.writeFileSync(
            path.join(__dirname, "data", "blogs.json"),
            JSON.stringify(blogs, null, 2)
        );

        res.json(blogs[index]);

    } catch (error) {
        console.error("Blog update error:", error);
        res.status(500).json({
            error: "Unable to update blog."
        });
    }
});


app.delete("/api/admin/blogs/:id", auth, role("admin"), (req, res) => {
    try {
        const blogs = JSON.parse(
            fs.readFileSync(
                path.join(__dirname, "data", "blogs.json"),
                "utf8"
            )
        );

        const filteredBlogs = blogs.filter(
            blog => blog.id !== req.params.id
        );

        if (filteredBlogs.length === blogs.length) {
            return res.status(404).json({
                error: "Blog post not found."
            });
        }

        fs.writeFileSync(
            path.join(__dirname, "data", "blogs.json"),
            JSON.stringify(filteredBlogs, null, 2)
        );

        res.json({
            success: true
        });

    } catch (error) {
        console.error("Blog deletion error:", error);
        res.status(500).json({
            error: "Unable to delete blog."
        });
    }
});

app.patch("/api/admin/properties/:id", auth, role("admin"), (req, res) => {
  const property = properties.find(
    p => String(p.id) === String(req.params.id)
  );

  if (!property) {
    return res.status(404).json({
      error: "Property not found."
    });
  }

  const newStatus = req.body.status;

  if (!["approved", "rejected", "pending"].includes(newStatus)) {
    return res.status(400).json({
      error: "Invalid status."
    });
  }

  /*
   * If this is an edited version and the admin rejects it,
   * restore the previously approved version.
   */
  if (
    property.editPending === true &&
    newStatus === "rejected" &&
    property.previousVersion
  ) {
    const previousVersion = property.previousVersion;

    Object.assign(property, previousVersion);

    property.status = "approved";
    property.editPending = false;
    delete property.previousVersion;

    property.reviewedAt = new Date().toISOString();

    writeJson(propertiesFile, properties);

    return res.json({
      property,
      message: "Changes rejected. Previous approved version restored."
    });
  }

  /*
   * If an edited version is approved,
   * keep the edited data and remove the backup.
   */
  if (
    property.editPending === true &&
    newStatus === "approved"
  ) {
    property.status = "approved";
    property.editPending = false;
    delete property.previousVersion;

    property.reviewedAt = new Date().toISOString();

    writeJson(propertiesFile, properties);

    return res.json({
      property,
      message: "Property changes approved successfully."
    });
  }

  /*
   * Normal approval/rejection for new properties.
   */
  property.status = newStatus;
  property.reviewedAt = new Date().toISOString();

  writeJson(propertiesFile, properties);

  res.json({
    property
  });
});

app.delete("/api/admin/properties/:id", auth, role("admin"), (req, res) => {
  const index = properties.findIndex(
    p => String(p.id) === String(req.params.id)
  );

  if (index === -1) {
    return res.status(404).json({
      error: "Property not found."
    });
  }

  const deletedProperty = properties[index];

  properties.splice(index, 1);

  writeJson(propertiesFile, properties);

  res.json({
    message: "Property deleted successfully.",
    property: deletedProperty
  });
});

app.get("/api/admin/requests", auth, role("admin"), (req, res) => {
  res.json(requests);
});

app.listen(PORT, () => {
  console.log(`HSG running at http://localhost:${PORT}`);
  console.log("Admin: admin@hsg.com / ChangeMe123!");
});
