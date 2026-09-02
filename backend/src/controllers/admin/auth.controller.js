import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query } from "../../db.js";
import { env } from "../../config/env.js";
import { fail, ok } from "../../utils/http.js";
const token = (u) =>
  jwt.sign({ sub: u.id, role: u.role, type: "admin" }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
export async function login(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password)
    return fail(res, "Email and password are required.", 422);
  const u = (
    await query("SELECT * FROM users WHERE email=? LIMIT 1", [
      String(email).toLowerCase(),
    ])
  )[0];
  if (!u || !(await bcrypt.compare(password, u.password)))
    return fail(res, "Invalid email or password.", 422);
  if (u.role !== "admin") return fail(res, "Admin access only.", 403);
  if (u.status !== "active") return fail(res, "Your account is inactive.", 403);
  return ok(res, {
    success: true,
    message: "Login successful.",
    token: token(u),
    user: { id: u.id, name: u.name, email: u.email, role: u.role },
  });
}
export async function me(req, res) {
  return ok(res, { success: true, user: req.user });
}
export async function logout(req, res) {
  return ok(res, { success: true, message: "Logout successful." });
}
