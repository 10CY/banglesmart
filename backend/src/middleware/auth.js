import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { query } from "../db.js";
import { fail } from "../utils/http.js";
export function auth(requiredRole = null) {
  return async (req, res, next) => {
    try {
      const h = req.headers.authorization || "";
      if (!h.startsWith("Bearer ")) return fail(res, "Unauthenticated.", 401);
      const token = h.slice(7);
      const p = jwt.verify(token, env.JWT_SECRET);
      const rows = await query(
        "SELECT id,name,email,phone,role,status,created_at FROM users WHERE id=? LIMIT 1",
        [p.sub],
      );
      const user = rows[0];
      if (!user) return fail(res, "User not found.", 401);
      if (user.status !== "active")
        return fail(res, "Your account is inactive.", 403);
      if (requiredRole && user.role !== requiredRole)
        return fail(res, "Forbidden.", 403);
      req.user = user;
      req.token = token;
      next();
    } catch (e) {
      return fail(
        res,
        e.name === "TokenExpiredError" ? "Token expired." : "Invalid token.",
        401,
      );
    }
  };
}
