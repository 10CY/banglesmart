import { query } from "../../db.js";
import { ok, fail } from "../../utils/http.js";
const fields = [
  "full_name",
  "phone",
  "address_line_1",
  "address_line_2",
  "landmark",
  "city",
  "state",
  "postal_code",
  "country",
  "type",
  "is_default",
];
export async function index(req, res) {
  return ok(res, {
    success: true,
    data: await query(
      "SELECT * FROM addresses WHERE user_id=? ORDER BY is_default DESC,id DESC",
      [req.user.id],
    ),
  });
}
export async function store(req, res) {
  const x = req.body || {};
  if (
    !x.full_name ||
    !x.phone ||
    !x.address_line_1 ||
    !x.city ||
    !x.state ||
    !x.postal_code
  )
    return fail(res, "Required address fields are missing.", 422);
  if (x.is_default)
    await query("UPDATE addresses SET is_default=0 WHERE user_id=?", [
      req.user.id,
    ]);
  const r = await query(
    `INSERT INTO addresses (user_id,${fields.join(",")},created_at,updated_at) VALUES (?,${fields.map(() => "?").join(",")},NOW(),NOW())`,
    [
      req.user.id,
      ...fields.map(
        (f) =>
          x[f] ?? (f === "country" ? "India" : f === "type" ? "shipping" : 0),
      ),
    ],
  );
  return ok(
    res,
    {
      success: true,
      data: (
        await query("SELECT * FROM addresses WHERE id=?", [r.insertId])
      )[0],
    },
    201,
  );
}
export async function show(req, res) {
  const a = (
    await query("SELECT * FROM addresses WHERE id=? AND user_id=?", [
      req.params.id,
      req.user.id,
    ])
  )[0];
  return a
    ? ok(res, { success: true, data: a })
    : fail(res, "Address not found.", 404);
}
export async function update(req, res) {
  const a = (
    await query("SELECT * FROM addresses WHERE id=? AND user_id=?", [
      req.params.id,
      req.user.id,
    ])
  )[0];
  if (!a) return fail(res, "Address not found.", 404);
  const x = req.body || {};
  if (x.is_default)
    await query("UPDATE addresses SET is_default=0 WHERE user_id=?", [
      req.user.id,
    ]);
  await query(
    `UPDATE addresses SET ${fields.map((f) => `${f}=?`).join(",")},updated_at=NOW() WHERE id=? AND user_id=?`,
    [...fields.map((f) => x[f] ?? a[f]), req.params.id, req.user.id],
  );
  return ok(res, {
    success: true,
    data: (
      await query("SELECT * FROM addresses WHERE id=?", [req.params.id])
    )[0],
  });
}
export async function destroy(req, res) {
  await query("DELETE FROM addresses WHERE id=? AND user_id=?", [
    req.params.id,
    req.user.id,
  ]);
  return ok(res, { success: true, message: "Address deleted successfully." });
}
export async function setDefault(req, res) {
  await query("UPDATE addresses SET is_default=0 WHERE user_id=?", [
    req.user.id,
  ]);
  await query("UPDATE addresses SET is_default=1 WHERE id=? AND user_id=?", [
    req.params.id,
    req.user.id,
  ]);
  return ok(res, { success: true, message: "Default address updated." });
}
