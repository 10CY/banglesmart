import PDFDocument from 'pdfkit';
import { query } from '../../db.js';

export async function download(req,res){
  const order=(await query('SELECT * FROM orders WHERE id=? AND user_id=?',[req.params.id,req.user.id]))[0];
  if(!order) return res.status(404).json({success:false,message:'Order not found.'});
  const items=await query('SELECT * FROM order_items WHERE order_id=?',[order.id]);
  res.setHeader('Content-Type','application/pdf');
  res.setHeader('Content-Disposition',`attachment; filename=${order.order_number}.pdf`);
  const doc=new PDFDocument({margin:50}); doc.pipe(res);
  doc.fontSize(22).text('BanglesMart',{align:'center'}); doc.moveDown();
  doc.fontSize(12).text(`Invoice: ${order.order_number}`); doc.text(`Status: ${order.status}`); doc.moveDown();
  for(const i of items) doc.text(`${i.product_name} x ${i.quantity} — ₹${i.line_total}`);
  doc.moveDown(); doc.fontSize(14).text(`Subtotal: ₹${order.subtotal}`); doc.text(`Shipping: ₹${order.shipping_amount}`); doc.text(`Discount: ₹${order.discount_amount}`); doc.text(`Total: ₹${order.total_amount}`); doc.end();
}
