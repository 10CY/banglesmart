import { query, transaction } from "../../db.js";
import { ok, fail } from "../../utils/http.js";

const ALLOWED_REASONS = ["damaged", "wrong_item", "size_issue", "quality_issue", "other"];

export async function index(req, res) {
  const rows = await query(
    `SELECT rr.*,o.order_number FROM return_requests rr JOIN orders o ON o.id=rr.order_id WHERE rr.user_id=? ORDER BY rr.id DESC`,
    [req.user.id],
  );
  return ok(res, { success: true, data: rows });
}

export async function show(req, res) {
  const row = (await query(`SELECT rr.*,o.order_number,o.total_amount FROM return_requests rr JOIN orders o ON o.id=rr.order_id WHERE rr.id=? AND rr.user_id=?`, [req.params.id, req.user.id]))[0];
  if (!row) return fail(res, "Return request not found.", 404);
  row.items = await query(`SELECT ri.*,oi.product_name,oi.variant_sku,oi.price,oi.image FROM return_items ri JOIN order_items oi ON oi.id=ri.order_item_id WHERE ri.return_request_id=?`, [row.id]);
  return ok(res, { success: true, data: row });
}

export async function store(req, res) {
  const orderId = Number(req.body?.order_id);
  const reason = String(req.body?.reason || "").trim();
  const notes = String(req.body?.notes || "").trim() || null;
  const requestedItems = Array.isArray(req.body?.items) ? req.body.items : [];
  if (!Number.isInteger(orderId) || orderId <= 0) return fail(res, "Valid order is required.", 422);
  if (!ALLOWED_REASONS.includes(reason)) return fail(res, "Please select a valid return reason.", 422);
  if (!requestedItems.length) return fail(res, "Select at least one item to return.", 422);

  try {
    return await transaction(async (c) => {
      const [orders] = await c.execute(`SELECT * FROM orders WHERE id=? AND user_id=? FOR UPDATE`, [orderId, req.user.id]);
      const order = orders[0];
      if (!order) throw Object.assign(new Error("Order not found."), { status: 404 });
      if (order.status !== "delivered") throw Object.assign(new Error("Returns are available only for delivered orders."), { status: 422 });
      const deliveredAt = order.delivered_at || order.updated_at || order.created_at;
      if (deliveredAt && (Date.now() - new Date(deliveredAt).getTime()) > 7 * 24 * 60 * 60 * 1000) {
        throw Object.assign(new Error("The 7-day return window for this order has expired."), { status: 422 });
      }

      const [existing] = await c.execute(`SELECT id FROM return_requests WHERE order_id=? AND user_id=? AND status NOT IN ('rejected','cancelled') LIMIT 1`, [orderId, req.user.id]);
      if (existing[0]) throw Object.assign(new Error("A return request already exists for this order."), { status: 422 });

      const [items] = await c.execute(`SELECT id,quantity,price FROM order_items WHERE order_id=?`, [orderId]);
      const itemMap = new Map(items.map((item) => [Number(item.id), item]));
      let refundAmount = 0;
      const cleanItems = [];
      for (const raw of requestedItems) {
        const id = Number(raw?.order_item_id);
        const quantity = Number(raw?.quantity || 0);
        const item = itemMap.get(id);
        if (!item || !Number.isInteger(quantity) || quantity < 1 || quantity > Number(item.quantity)) continue;
        refundAmount += Number(item.price) * quantity;
        cleanItems.push({ id, quantity });
      }
      if (!cleanItems.length) throw Object.assign(new Error("No valid return items were selected."), { status: 422 });

      const [result] = await c.execute(`INSERT INTO return_requests (order_id,user_id,reason,notes,status,refund_status,refund_amount,created_at,updated_at) VALUES (?,?,?,?,'requested','pending',?,NOW(),NOW())`, [orderId, req.user.id, reason, notes, refundAmount]);
      for (const item of cleanItems) {
        await c.execute(`INSERT INTO return_items (return_request_id,order_item_id,quantity) VALUES (?,?,?)`, [result.insertId, item.id, item.quantity]);
      }
      return ok(res, { success: true, message: "Return request submitted.", data: { id: result.insertId } }, 201);
    });
  } catch (error) {
    console.error("Return store error:", error);
    return fail(res, error?.message || "Unable to submit return request.", error?.status || 500);
  }
}
