import PDFDocument from "pdfkit";
import { query } from "../../db.js";
export async function download(req, res) {
  const o = (
    await query(
      "SELECT o.*,u.name customer_name,u.email customer_email FROM orders o JOIN users u ON u.id=o.user_id WHERE o.id=?",
      [req.params.id],
    )
  )[0];
  if (!o)
    return res
      .status(404)
      .json({ success: false, message: "Order not found." });
  const items = await query("SELECT * FROM order_items WHERE order_id=?", [
    o.id,
  ]);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=${o.order_number}.pdf`,
  );
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);
  doc.fontSize(22).text("BanglesMart", { align: "center" });
  doc.moveDown();
  doc.fontSize(12).text(`Invoice / Order: ${o.order_number}`);
  doc.text(`Customer: ${o.customer_name} (${o.customer_email})`);
  doc.moveDown();
  items.forEach((i) =>
    doc.text(`${i.product_name} x ${i.quantity} — ₹${i.line_total}`),
  );
  doc.moveDown();
  doc.fontSize(14).text(`Total: ₹${o.total_amount}`);
  doc.end();
}
