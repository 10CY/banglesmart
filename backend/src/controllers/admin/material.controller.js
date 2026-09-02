import { query } from '../../db.js';
import { ok, fail } from '../../utils/http.js';
import { audit } from '../../utils/audit.js';

export async function index(req,res){
  try {
    const rows=await query(`SELECT id,name,status,created_at,updated_at FROM materials ORDER BY id DESC`);
    return ok(res,{success:true,data:rows});
  } catch(error) {
    console.error('Materials index error:',error);
    return fail(res,'Unable to load materials.',500);
  }
}

export async function store(req,res){
  const name=String(req.body?.name||'').trim();
  const status=String(req.body?.status||'active').trim();
  if(!name)return fail(res,'Name is required.',422);
  if(!['active','inactive'].includes(status))return fail(res,'Invalid material status.',422);
  try {
    const existing=(await query(`SELECT id FROM materials WHERE name=? LIMIT 1`,[name]))[0];
    if(existing)return fail(res,'A material with this name already exists.',422);
    const result=await query(`INSERT INTO materials (name,status,created_at,updated_at) VALUES (?,?,NOW(),NOW())`,[name,status]);
    await audit(req,'material_created','material',result.insertId,{name,status});
    return ok(res,{success:true,message:'Material created successfully.',data:(await query(`SELECT * FROM materials WHERE id=?`,[result.insertId]))[0]},201);
  } catch(error) {
    console.error('Materials store error:',error);
    return fail(res,'Unable to create material.',500);
  }
}

export async function update(req,res){
  const name=String(req.body?.name||'').trim();
  const status=String(req.body?.status||'active').trim();
  if(!name)return fail(res,'Name is required.',422);
  if(!['active','inactive'].includes(status))return fail(res,'Invalid material status.',422);
  try {
    const id=Number(req.params.id);
    const row=(await query(`SELECT id FROM materials WHERE id=?`,[id]))[0];
    if(!row)return fail(res,'Material not found.',404);
    const duplicate=(await query(`SELECT id FROM materials WHERE name=? AND id<>? LIMIT 1`,[name,id]))[0];
    if(duplicate)return fail(res,'A material with this name already exists.',422);
    await query(`UPDATE materials SET name=?,status=?,updated_at=NOW() WHERE id=?`,[name,status,id]);
    await audit(req,'material_updated','material',id,{name,status});
    return ok(res,{success:true,message:'Material updated successfully.',data:(await query(`SELECT * FROM materials WHERE id=?`,[id]))[0]});
  } catch(error) {
    console.error('Materials update error:',error);
    return fail(res,'Unable to update material.',500);
  }
}

export async function destroy(req,res){
  try {
    const id=Number(req.params.id);
    const row=(await query(`SELECT id FROM materials WHERE id=?`,[id]))[0];
    if(!row)return fail(res,'Material not found.',404);
    await query(`DELETE FROM materials WHERE id=?`,[id]);
    await audit(req,'material_deleted','material',id);
    return ok(res,{success:true,message:'Material deleted successfully.'});
  } catch(error) {
    console.error('Materials delete error:',error);
    return fail(res,'Unable to delete material.',500);
  }
}
