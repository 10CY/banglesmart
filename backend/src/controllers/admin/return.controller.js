import { query, transaction } from "../../db.js";
import { ok, fail } from "../../utils/http.js";
import { audit } from "../../utils/audit.js";

const STATUSES = ["requested", "approved", "rejected", "received", "completed", "cancelled"];
const REFUND_STATUSES = ["not_requested", "pending", "processed", "failed"];

export async function index(req, res) {
  const params = [];
  let where = "WHERE 1=1";
  if (req.query.status && STATUSES.includes(String(req.query.status))) { where += " AND rr.status=?"; params.push(req.query.status); }
  const rows = await query(`SELECT rr.*,o.order_number,u.name AS customer_name,u.email AS customer_email FROM return_requests rr JOIN orders o ON o.id=rr.order_id JOIN users u ON u.id=rr.user_id ${where} ORDER BY rr.id DESC`, params);
  return ok(res, { success: true, data: rows });
}

export async function show(req, res) {
  const row = (await query(`SELECT rr.*,o.order_number,u.name AS customer_name,u.email AS customer_email FROM return_requests rr JOIN orders o ON o.id=rr.order_id JOIN users u ON u.id=rr.user_id WHERE rr.id=?`, [req.params.id]))[0];
  if (!row) return fail(res, "Return request not found.", 404);
  row.items = await query(`SELECT ri.*,oi.product_name,oi.variant_sku,oi.price,oi.quantity AS ordered_quantity FROM return_items ri JOIN order_items oi ON oi.id=ri.order_item_id WHERE ri.return_request_id=?`, [row.id]);
  return ok(res, { success: true, data: row });
}

export async function update(req, res) {
  const status = String(req.body?.status || "").trim();
  const refundStatus = String(req.body?.refund_status || "").trim();
  if (status && !STATUSES.includes(status)) return fail(res, "Invalid return status.", 422);
  if (refundStatus && !REFUND_STATUSES.includes(refundStatus)) return fail(res, "Invalid refund status.", 422);
  const existing = (await query(`SELECT * FROM return_requests WHERE id=?`, [req.params.id]))[0];
  if (!existing) return fail(res, "Return request not found.", 404);
  await transaction(async (c) => {
    await c.execute(`UPDATE return_requests SET status=COALESCE(NULLIF(?,''),status),refund_status=COALESCE(NULLIF(?,''),refund_status),admin_note=COALESCE(?,admin_note),approved_at=IF(?='approved',COALESCE(approved_at,NOW()),approved_at),completed_at=IF(?='completed',COALESCE(completed_at,NOW()),completed_at),updated_at=NOW() WHERE id=?`, [status, refundStatus, req.body?.admin_note || null, status, status, existing.id]);
    if (status === "completed" && existing.status !== "completed") {
      const [items] = await c.execute(`SELECT ri.order_item_id,ri.quantity,oi.product_variant_id FROM return_items ri JOIN order_items oi ON oi.id=ri.order_item_id WHERE ri.return_request_id=?`, [existing.id]);
      for (const item of items) {
        if (item.product_variant_id) await c.execute(`UPDATE inventories SET quantity=quantity+?,updated_at=NOW() WHERE product_variant_id=?`, [item.quantity, item.product_variant_id]);
      }
    }
  });
  const updated = (await query(`SELECT * FROM return_requests WHERE id=?`, [existing.id]))[0];
  await audit(req, "return_updated", "return_request", existing.id, { status, refund_status: refundStatus });
  return ok(res, { success: true, message: "Return request updated.", data: updated });
}
