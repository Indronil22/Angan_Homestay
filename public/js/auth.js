async function post(url, body) {
  const r = await fetch(url, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || "Something went wrong");
  return data;
}
function setupLogin() {
  document.getElementById("loginForm").addEventListener("submit", async e => {
    e.preventDefault();
    const error = document.getElementById("error");
    try {
      const data = await post("/api/login", {email:email.value,password:password.value});
      if (data.user.role === "admin") location.href="/admin-dashboard.html";
      else if (data.user.role === "host") location.href="/host-dashboard.html";
      else location.href="/";
    } catch(err) { error.textContent=err.message; }
  });
}
function setupRegister() {
  document.getElementById("registerForm").addEventListener("submit", async e => {
    e.preventDefault();

    const error = document.getElementById("error");

    const form = e.target;

    const name = form.elements["name"].value;
    const email = form.elements["email"].value;
    const password = form.elements["password"].value;
    const role = form.elements["role"].value;

    try {
  const data = await post("/api/register", {
    name,
    email,
    password
  });

  location.href = "/host-dashboard.html";

} catch (err) {
  error.textContent = err.message;
}
  });
}
function setupAdminLogin() {
  document.getElementById("adminLogin").addEventListener("submit", async e => {
    e.preventDefault();
    const error=document.getElementById("error");
    try {
      const data=await post("/api/login",{email:email.value,password:password.value});
      if(data.user.role!=="admin") throw new Error("This account is not an admin account.");
      location.href="/admin-dashboard.html";
    } catch(err){error.textContent=err.message;}
  });
}
async function logout(){await fetch("/api/logout",{method:"POST"});location.href="/";}

function togglePassword(inputId, button) {

    const input = document.getElementById(inputId);

    if (input.type === "password") {
        input.type = "text";
        button.setAttribute("aria-label", "Hide password");
        button.classList.add("password-visible");
    } else {
        input.type = "password";
        button.setAttribute("aria-label", "Show password");
        button.classList.remove("password-visible");
    }

}