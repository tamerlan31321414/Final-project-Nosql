import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

function signToken(user) {
  return jwt.sign({ id: String(user._id), role: user.role, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d"
  });
}

export async function register(req, res, next) {
  try {
    const { name, email, password, role } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ error: "Missing fields" });

    const exists = await User.findOne({ email: String(email).toLowerCase() });
    if (exists) return res.status(409).json({ error: "Email already used" });

    const passwordHash = await bcrypt.hash(String(password), 10);
    const user = await User.create({
      name: String(name),
      email: String(email).toLowerCase(),
      passwordHash,
      role: role === "admin" ? "admin" : "student"
    });

    const token = signToken(user);
    res.json({ token, user: { id: String(user._id), name: user.name, email: user.email, role: user.role } });
  } catch (e) {
    next(e);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Missing fields" });

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(String(password), user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = signToken(user);
    res.json({ token, user: { id: String(user._id), name: user.name, email: user.email, role: user.role } });
  } catch (e) {
    next(e);
  }
}
