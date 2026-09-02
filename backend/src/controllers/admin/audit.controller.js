import { query } from "../../db.js";
import { ok, fail } from "../../utils/http.js";

export async function index(req,res){
  try {
    const rows=await query(`SELECT al.*,u.name AS admin_name,u.email AS admin_email FROM admin_audit_logs al JOIN users u ON u.id=al.admin_user_id ORDER BY al.id DESC LIMIT 200`);
    return ok(res,{success:true,data:rows});
  } catch(error){console.error('Audit log error:',error);return fail(res,'Unable to load audit logs.',500);}
}
