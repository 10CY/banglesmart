import crypto from "crypto";
import bcrypt from "bcryptjs";
import { query } from "../../db.js";
import { env } from "../../config/env.js";
import { ok, fail } from "../../utils/http.js";

async function sendResetEmail(email, token) {
  const resetUrl = `${env.CORS_ORIGINS[0] || "http://localhost:3000"}/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
  if (!env.RESEND_API_KEY) {
    console.warn(`Password reset email not sent: RESEND_API_KEY is not configured. Development reset URL: ${resetUrl}`);
    return false;
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: env.MAIL_FROM,
      to: [email],
      subject: "Reset your BanglesMart password",
      html: `<p>We received a request to reset your BanglesMart password.</p><p><a href="${resetUrl}">Reset your password</a></p><p>This link expires in 30 minutes.</p>`,
    }),
  });
  if (!response.ok) throw new Error("Unable to send reset email.");
  return true;
}

export async function forgot(req,res){
  const email=String(req.body?.email||'').trim().toLowerCase();
  if(!/^\S+@\S+\.\S+$/.test(email)) return fail(res,'A valid email address is required.',422);
  try {
    const user=(await query(`SELECT id,email FROM users WHERE email=? AND role='customer' LIMIT 1`,[email]))[0];
    // Always return a generic response to avoid account enumeration.
    if(user){
      const token=crypto.randomBytes(32).toString('hex');
      const hashed=crypto.createHash('sha256').update(token).digest('hex');
      await query(`DELETE FROM password_reset_tokens WHERE email=?`,[email]);
      await query(`INSERT INTO password_reset_tokens (email,token,created_at) VALUES (?,?,NOW())`,[email,hashed]);
      await sendResetEmail(email,token);
    }
    return ok(res,{success:true,message:'If an account exists for that email, a password reset link has been sent.'});
  } catch(error){console.error('Forgot password error:',error);return fail(res,'Unable to process password reset request.',500);}
}

export async function reset(req,res){
  const email=String(req.body?.email||'').trim().toLowerCase();
  const token=String(req.body?.token||'').trim();
  const password=String(req.body?.password||'');
  const confirmation=String(req.body?.password_confirmation||'');
  if(!email||!token)return fail(res,'Reset token is required.',422);
  if(password.length<8)return fail(res,'Password must be at least 8 characters.',422);
  if(password!==confirmation)return fail(res,'Passwords do not match.',422);
  try {
    const hashed=crypto.createHash('sha256').update(token).digest('hex');
    const row=(await query(`SELECT * FROM password_reset_tokens WHERE email=? AND token=? AND created_at >= DATE_SUB(NOW(),INTERVAL 30 MINUTE) LIMIT 1`,[email,hashed]))[0];
    if(!row)return fail(res,'This reset link is invalid or has expired.',422);
    const hash=await bcrypt.hash(password,12);
    await query(`UPDATE users SET password=?,updated_at=NOW() WHERE email=? AND role='customer'`,[hash,email]);
    await query(`DELETE FROM password_reset_tokens WHERE email=?`,[email]);
    return ok(res,{success:true,message:'Password reset successfully.'});
  } catch(error){console.error('Reset password error:',error);return fail(res,'Unable to reset password.',500);}
}
