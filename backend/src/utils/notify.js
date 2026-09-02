import { query } from "../db.js";

export async function createNotification(userId, type, title, message, data = null) {
  try {
    await query(
      `INSERT INTO notifications (user_id,type,title,message,data,created_at,updated_at) VALUES (?,?,?,?,?,NOW(),NOW())`,
      [userId, type, title, message, data ? JSON.stringify(data) : null],
    );
  } catch (error) {
    // Notifications must never break an order/status operation when the
    // optional upgrade migration has not been applied yet.
    console.error("Notification write skipped:", error.message);
  }
}
