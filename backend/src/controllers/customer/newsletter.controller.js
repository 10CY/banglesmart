import { query } from "../../db.js";
import { ok, fail } from "../../utils/http.js";

export async function subscribe(req, res) {
  const email = String(req.body?.email || "").trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) return fail(res, "A valid email address is required.", 422);
  try {
    await query(
      `INSERT INTO newsletter_subscribers (email,status,source,subscribed_at,created_at,updated_at) VALUES (?,'subscribed','website',NOW(),NOW(),NOW()) ON DUPLICATE KEY UPDATE status='subscribed',unsubscribed_at=NULL,updated_at=NOW()`,
      [email],
    );
    return ok(res, { success: true, message: "You are subscribed to BanglesMart updates." });
  } catch (error) {
    console.error("Newsletter subscribe error:", error);
    return fail(res, "Unable to subscribe right now.", 500);
  }
}
