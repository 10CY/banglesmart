import { query } from "../db.js";
export async function audit(req, action, entityType, entityId = null, details = null) {
  try {
    await query(`INSERT INTO admin_audit_logs (admin_user_id,action,entity_type,entity_id,details,ip_address,created_at) VALUES (?,?,?,?,?,?,NOW())`, [req.user?.id, action, entityType, entityId, details ? JSON.stringify(details) : null, req.ip || null]);
  } catch (error) {
    console.error("Audit log write skipped:", error.message);
  }
}
