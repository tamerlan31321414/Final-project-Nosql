const API = "http://localhost:5000/api/v1";

function getToken() {
  return localStorage.getItem("token") || "";
}

function getUser() {
  try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
}

function setAuth(token, user) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

async function request(path, method = "GET", body) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

function navHTML() {
  const u = getUser();
  const isAdmin = u?.role === "admin";
  return `
    <nav>
      <a href="./quizzes.html">Quizzes</a>
      ${u ? `<a href="./attempts.html">My Attempts</a>` : ""}
      ${isAdmin ? `<a href="./admin.html">Admin</a>` : ""}
      <div class="right">
        ${u ? `<span>${u.email}</span><button id="logoutBtn">Logout</button>` : `<a href="./login.html">Login</a><a href="./register.html">Register</a>`}
      </div>
    </nav>
  `;
}

function mountNav() {
  document.getElementById("nav").innerHTML = navHTML();
  const btn = document.getElementById("logoutBtn");
  if (btn) {
    btn.onclick = () => {
      clearAuth();
      location.href = "./login.html";
    };
  }
}

function requireAuth(role) {
  const token = getToken();
  const u = getUser();
  if (!token || !u) location.href = "./login.html";
  if (role && u.role !== role) location.href = "./quizzes.html";
}

function qs(name) {
  const url = new URL(location.href);
  return url.searchParams.get(name);
}
