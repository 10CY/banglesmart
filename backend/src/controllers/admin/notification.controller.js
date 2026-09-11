import { query } from "../../db.js";
import { ok, fail } from "../../utils/http.js";

/*
|--------------------------------------------------------------------------
| ADMIN NOTIFICATIONS
|--------------------------------------------------------------------------
*/

/**
 * Get latest notifications for admin
 */
export async function index(req, res) {
  try {
    const rows = await query(
      `
      SELECT
        id,
        type,
        title,
        message,
        data,
        read_at,
        created_at
      FROM notifications
      WHERE user_id = ?
      ORDER BY id DESC
      LIMIT 50
      `,
      [req.user.id],
    );

    const unread = await query(
      `
      SELECT COUNT(*) AS count
      FROM notifications
      WHERE user_id = ?
        AND read_at IS NULL
      `,
      [req.user.id],
    );

    return ok(res, {
      success: true,
      data: rows,
      unread_count: Number(unread[0]?.count || 0),
    });
  } catch (error) {
    console.error("Admin notification index error:", error);

    return fail(
      res,
      "Unable to load notifications.",
      500,
    );
  }
}

/**
 * Mark one notification as read
 */
export async function read(req, res) {
  try {
    const result = await query(
      `
      UPDATE notifications
      SET
        read_at = COALESCE(read_at, NOW()),
        updated_at = NOW()
      WHERE id = ?
        AND user_id = ?
      `,
      [req.params.id, req.user.id],
    );

    return ok(res, {
      success: true,
      message: "Notification marked as read.",
    });
  } catch (error) {
    console.error("Admin notification read error:", error);

    return fail(
      res,
      "Unable to mark notification as read.",
      500,
    );
  }
}

/**
 * Mark all admin notifications as read
 */
export async function readAll(req, res) {
  try {
    await query(
      `
      UPDATE notifications
      SET
        read_at = NOW(),
        updated_at = NOW()
      WHERE user_id = ?
        AND read_at IS NULL
      `,
      [req.user.id],
    );

    return ok(res, {
      success: true,
      message: "Notifications marked as read.",
    });
  } catch (error) {
    console.error("Admin notification read-all error:", error);

    return fail(
      res,
      "Unable to mark notifications as read.",
      500,
    );
  }
}