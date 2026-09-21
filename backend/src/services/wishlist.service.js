import { query } from "../db.js";
import { appError } from "../utils/errors.js";

async function findOrCreateWishlist(userId) {
  let wishlist = (
    await query(`SELECT * FROM wishlists WHERE user_id=? LIMIT 1`, [userId])
  )[0];

  if (!wishlist) {
    const result = await query(
      `INSERT INTO wishlists (user_id,created_at,updated_at) VALUES (?,NOW(),NOW())`,
      [userId],
    );
    wishlist = { id: result.insertId, user_id: userId };
  }
  return wishlist;
}

export async function getWishlist(userId) {
  const wishlist = (
    await query(`SELECT * FROM wishlists WHERE user_id=? LIMIT 1`, [userId])
  )[0];
  if (!wishlist) return { id: null, items: [], item_count: 0 };

  const rows = await query(
    `
      SELECT wi.id,wi.wishlist_id,wi.product_id,wi.created_at,wi.updated_at,
        p.name AS product_name,p.slug AS product_slug,p.mrp AS product_mrp,
        p.selling_price AS product_selling_price,p.short_description AS product_short_description,
        p.status AS product_status,c.id AS category_id,c.name AS category_name,c.slug AS category_slug,
        pi.id AS image_id,pi.image AS product_image
      FROM wishlist_items wi
      JOIN products p ON p.id=wi.product_id
      LEFT JOIN categories c ON c.id=p.category_id
      LEFT JOIN product_images pi ON pi.product_id=p.id AND pi.is_primary=1
      WHERE wi.wishlist_id=? ORDER BY wi.id DESC
    `,
    [wishlist.id],
  );

  const items = rows.map((row) => ({
    id: Number(row.id),
    wishlist_id: Number(row.wishlist_id),
    product_id: Number(row.product_id),
    created_at: row.created_at,
    updated_at: row.updated_at,
    product: {
      id: Number(row.product_id),
      name: row.product_name,
      slug: row.product_slug,
      mrp: Number(row.product_mrp || 0),
      selling_price: Number(row.product_selling_price || 0),
      short_description: row.product_short_description,
      status: row.product_status,
      category: row.category_id
        ? { id: Number(row.category_id), name: row.category_name, slug: row.category_slug }
        : null,
      primary_image: row.product_image
        ? { id: Number(row.image_id), image: row.product_image }
        : null,
    },
  }));

  return { id: Number(wishlist.id), items, item_count: items.length };
}

export async function addWishlistItem(userId, productId) {
  const id = Number(productId);
  if (!Number.isInteger(id) || id <= 0) throw appError("Product is required.");
  const product = (
    await query(`SELECT id FROM products WHERE id=? AND status='active' LIMIT 1`, [id])
  )[0];
  if (!product) throw appError("Product not found.", 404);

  const wishlist = await findOrCreateWishlist(userId);
  const existing = (
    await query(
      `SELECT id FROM wishlist_items WHERE wishlist_id=? AND product_id=? LIMIT 1`,
      [wishlist.id, id],
    )
  )[0];

  if (!existing) {
    await query(
      `INSERT INTO wishlist_items (wishlist_id,product_id,created_at,updated_at) VALUES (?,?,NOW(),NOW())`,
      [wishlist.id, id],
    );
    await query(`UPDATE wishlists SET updated_at=NOW() WHERE id=?`, [wishlist.id]);
  }
  return getWishlist(userId);
}

export async function removeWishlistItem(userId, itemId) {
  await query(
    `DELETE wi FROM wishlist_items wi JOIN wishlists w ON w.id=wi.wishlist_id WHERE wi.id=? AND w.user_id=?`,
    [itemId, userId],
  );
  return getWishlist(userId);
}

export async function checkWishlist(userId, productId) {
  const wishlist = (
    await query(`SELECT id FROM wishlists WHERE user_id=? LIMIT 1`, [userId])
  )[0];
  const found = wishlist
    ? (
        await query(
          `SELECT id FROM wishlist_items WHERE wishlist_id=? AND product_id=? LIMIT 1`,
          [wishlist.id, productId],
        )
      )[0]
    : null;

  return {
    wishlisted: Boolean(found),
    in_wishlist: Boolean(found),
    wishlist_item_id: found?.id ? Number(found.id) : null,
  };
}
