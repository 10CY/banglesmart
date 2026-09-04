import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query } from "../../db.js";
import { env } from "../../config/env.js";
import { fail, ok } from "../../utils/http.js";
const token = (u) =>
  jwt.sign({ sub: u.id, role: "customer", type: "customer" }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
const pub = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  phone: u.phone,
  role: u.role,
  status: u.status,
  created_at: u.created_at,
});
export async function register(req, res) {
  const { name, email, password, password_confirmation } = req.body || {};
  if (!name || !email || !password)
    return fail(res, "Name, email and password are required.", 422);
  if (password.length < 8)
    return fail(res, "Password must be at least 8 characters.", 422);
  if (password_confirmation !== undefined && password !== password_confirmation)
    return fail(res, "Passwords do not match.", 422);
  if (
    (
      await query("SELECT id FROM users WHERE email=? LIMIT 1", [
        String(email).toLowerCase(),
      ])
    ).length
  )
    return fail(res, "The email has already been taken.", 422);
  const hash = await bcrypt.hash(password, 12);
  const r = await query(
    "INSERT INTO users (name,email,password,role,status,created_at,updated_at) VALUES (?,?,?,?,?,NOW(),NOW())",
    [name, String(email).toLowerCase(), hash, "customer", "active"],
  );
  const u = (await query("SELECT * FROM users WHERE id=?", [r.insertId]))[0];
  return ok(
    res,
    {
      success: true,
      message: "Account created successfully.",
      token: token(u),
      user: pub(u),
    },
    201,
  );
}
export async function login(req, res) {
  const { email, password } = req.body || {};
  const u = (
    await query("SELECT * FROM users WHERE email=? LIMIT 1", [
      String(email || "").toLowerCase(),
    ])
  )[0];
  if (!u || !(await bcrypt.compare(password || "", u.password)))
    return fail(res, "Invalid email or password.", 422);
  if (u.role !== "customer")
    return fail(res, "This account cannot use customer login.", 403);
  if (u.status !== "active")
    return fail(res, "Your account is currently inactive.", 403);
  return ok(res, {
    success: true,
    message: "Login successful.",
    token: token(u),
    user: pub(u),
  });
}
export async function me(req, res) {
  if (req.user.role !== "customer")
    return fail(res, "Customer not found.", 403);
  return ok(res, { success: true, data: pub(req.user) });
}
export async function logout(req, res) {
  return ok(res, { success: true, message: "Logged out successfully." });
}
