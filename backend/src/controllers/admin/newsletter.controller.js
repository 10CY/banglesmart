import { query } from "../../db.js";
import { ok, fail } from "../../utils/http.js";
import { audit } from "../../utils/audit.js";

export async function index(req, res) {
  try {
    const rows = await query(`SELECT * FROM newsletter_subscribers ORDER BY id DESC`);
    return ok(res, { success: true, data: rows });
  } catch (error) {
    console.error("Newsletter admin error:", error);
    return fail(res, "Unable to load subscribers.", 500);
  }
}

export async function destroy(req, res) {
  await query(`DELETE FROM newsletter_subscribers WHERE id=?`, [req.params.id]);
  await audit(req, "newsletter_subscriber_removed", "newsletter_subscriber", Number(req.params.id));
  return ok(res, { success: true, message: "Subscriber removed." });
}
