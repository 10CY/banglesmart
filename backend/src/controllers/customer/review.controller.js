import { query } from '../../db.js';
import { ok, fail } from '../../utils/http.js';

export async function store(req,res){
  const rating=Number(req.body?.rating);
  const title=String(req.body?.title||'').trim() || null;
  const comment=String(req.body?.comment||'').trim() || null;
  const requestedOrderId=req.body?.order_id ? Number(req.body.order_id) : null;
  if(!Number.isInteger(rating)||rating<1||rating>5)return fail(res,'Rating must be between 1 and 5.',422);

  try {
    const delivered = await query(
      `SELECT o.id FROM orders o JOIN order_items oi ON oi.order_id=o.id WHERE o.user_id=? AND o.status='delivered' AND oi.product_id=? ${requestedOrderId ? 'AND o.id=?' : ''} LIMIT 1`,
      requestedOrderId ? [req.user.id,req.params.product,requestedOrderId] : [req.user.id,req.params.product],
    );
    if (!delivered.length) return fail(res,'You can review this product only after a delivered purchase.',422);
    const orderId = delivered[0].id;

    const existing = await query(`SELECT id FROM reviews WHERE product_id=? AND user_id=? LIMIT 1`,[req.params.product,req.user.id]);
    if (existing.length) {
      await query(`UPDATE reviews SET order_id=?,rating=?,title=?,comment=?,status='pending',updated_at=NOW() WHERE id=?`,[orderId,rating,title,comment,existing[0].id]);
      return ok(res,{success:true,message:'Review updated and sent for approval.',data:(await query(`SELECT * FROM reviews WHERE id=?`,[existing[0].id]))[0]});
    }
    const r=await query('INSERT INTO reviews (product_id,user_id,order_id,rating,title,comment,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,NOW(),NOW())',[req.params.product,req.user.id,orderId,rating,title,comment,'pending']);
    return ok(res,{success:true,message:'Review submitted for approval.',data:(await query('SELECT * FROM reviews WHERE id=?',[r.insertId]))[0]},201);
  } catch (error) {
    console.error('Review store error:',error);
    return fail(res,'Unable to submit review.',500);
  }
}
export async function mine(req,res){return ok(res,{success:true,data:await query('SELECT * FROM reviews WHERE product_id=? AND user_id=? ORDER BY id DESC',[req.params.product,req.user.id])})}
