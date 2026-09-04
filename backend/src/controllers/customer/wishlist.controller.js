import { query } from "../../db.js";
import { ok, fail } from "../../utils/http.js";
import { imageUrl } from "../../utils/serialize.js";

async function list(uid) {
  const wishlist = (
    await query(
      `
        SELECT *
        FROM wishlists
        WHERE user_id = ?
        LIMIT 1
      `,
      [uid],
    )
  )[0];

  if (!wishlist) {
    return {
      id: null,
      items: [],
      item_count: 0,
    };
  }

  const items = await query(
    `
      SELECT
        wi.id,
        wi.wishlist_id,
        wi.product_id,
        wi.created_at,
        wi.updated_at,

        p.name AS product_name,
        p.slug AS product_slug,
        p.mrp AS product_mrp,
        p.selling_price AS product_selling_price,
        p.short_description AS product_short_description,
        p.status AS product_status,

        c.id AS category_id,
        c.name AS category_name,
        c.slug AS category_slug,

        pi.id AS image_id,
        pi.image AS product_image

      FROM wishlist_items wi

      JOIN products p
        ON p.id = wi.product_id

      LEFT JOIN categories c
        ON c.id = p.category_id

      LEFT JOIN product_images pi
        ON pi.product_id = p.id
        AND pi.is_primary = 1

      WHERE wi.wishlist_id = ?

      ORDER BY wi.id DESC
    `,
    [wishlist.id],
  );

  const formattedItems = items.map((item) => ({
    id: item.id,
    wishlist_id: item.wishlist_id,
    product_id: item.product_id,
    created_at: item.created_at,
    updated_at: item.updated_at,

    product: {
      id: item.product_id,
      name: item.product_name,
      slug: item.product_slug,
      mrp: String(item.product_mrp),
      selling_price: String(item.product_selling_price),
      short_description: item.product_short_description,
      status: item.product_status,

      category: item.category_id
        ? {
            id: item.category_id,
            name: item.category_name,
            slug: item.category_slug,
          }
        : null,

      primary_image: item.product_image
        ? {
            id: item.image_id,
            image: item.product_image,
          }
        : null,
    },
  }));

  return {
    id: wishlist.id,
    items: formattedItems,
    item_count: formattedItems.length,
  };
}

export async function index(req, res) {
  try {
    const data = await list(req.user.id);

    return ok(res, {
      success: true,
      data,
    });
  } catch (error) {
    console.error("Wishlist index error:", error);

    return fail(res, "Unable to load wishlist.", 500);
  }
}

export async function store(req, res) {
  try {
    const { product_id } = req.body || {};

    if (!product_id) {
      return fail(res, "Product is required.", 422);
    }

    const product = (
      await query(
        `
          SELECT id
          FROM products
          WHERE id = ?
            AND status = 'active'
          LIMIT 1
        `,
        [product_id],
      )
    )[0];

    if (!product) {
      return fail(res, "Product not found.", 404);
    }

    let wishlist = (
      await query(
        `
          SELECT *
          FROM wishlists
          WHERE user_id = ?
          LIMIT 1
        `,
        [req.user.id],
      )
    )[0];

    if (!wishlist) {
      const result = await query(
        `
          INSERT INTO wishlists
          (
            user_id,
            created_at,
            updated_at
          )
          VALUES
          (
            ?,
            NOW(),
            NOW()
          )
        `,
        [req.user.id],
      );

      wishlist = {
        id: result.insertId,
      };
    }

    const existing = (
      await query(
        `
          SELECT id
          FROM wishlist_items
          WHERE wishlist_id = ?
            AND product_id = ?
          LIMIT 1
        `,
        [wishlist.id, product_id],
      )
    )[0];

    if (!existing) {
      await query(
        `
          INSERT INTO wishlist_items
          (
            wishlist_id,
            product_id,
            created_at,
            updated_at
          )
          VALUES
          (
            ?,
            ?,
            NOW(),
            NOW()
          )
        `,
        [wishlist.id, product_id],
      );
    }

    const data = await list(req.user.id);

    return ok(
      res,
      {
        success: true,
        data,
      },
      201,
    );
  } catch (error) {
    console.error("Wishlist store error:", error);

    return fail(res, "Unable to add product to wishlist.", 500);
  }
}

export async function destroy(req, res) {
  try {
    const result = await query(
      `
        DELETE wi
        FROM wishlist_items wi
        JOIN wishlists w
          ON w.id = wi.wishlist_id
        WHERE wi.id = ?
          AND w.user_id = ?
      `,
      [req.params.id, req.user.id],
    );

    const data = await list(req.user.id);

    return ok(res, {
      success: true,
      data,
    });
  } catch (error) {
    console.error("Wishlist destroy error:", error);

    return fail(res, "Unable to remove product from wishlist.", 500);
  }
}

export async function check(req, res) {
  try {
    const wishlist = (
      await query(
        `
          SELECT id
          FROM wishlists
          WHERE user_id = ?
          LIMIT 1
        `,
        [req.user.id],
      )
    )[0];

    const found = wishlist
      ? (
          await query(
            `
              SELECT id
              FROM wishlist_items
              WHERE wishlist_id = ?
                AND product_id = ?
              LIMIT 1
            `,
            [wishlist.id, req.params.product],
          )
        )[0]
      : null;

    return ok(res, {
      success: true,
      data: {
        in_wishlist: !!found,
        wishlist_item_id: found?.id || null,
      },
    });
  } catch (error) {
    console.error("Wishlist check error:", error);

    return fail(res, "Unable to check wishlist.", 500);
  }
}
