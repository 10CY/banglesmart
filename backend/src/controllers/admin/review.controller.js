import { query } from "../../db.js";
import { ok, fail } from "../../utils/http.js";

const ALLOWED_STATUS = [
  "pending",
  "approved",
  "rejected",
];

function normalizeStatus(status) {
  return ALLOWED_STATUS.includes(status)
    ? status
    : null;
}

function normalizeRating(rating) {
  if (
    rating === undefined ||
    rating === null ||
    rating === ""
  ) {
    return null;
  }

  const value = Number(rating);

  if (
    !Number.isInteger(value) ||
    value < 1 ||
    value > 5
  ) {
    return null;
  }

  return value;
}


/*
|--------------------------------------------------------------------------
| GET /admin/reviews
|--------------------------------------------------------------------------
*/

export async function index(req, res) {
  try {
    let page = Number.parseInt(req.query.page, 10);
let limit = Number.parseInt(req.query.limit, 10);

if (!Number.isFinite(page) || page < 1) {
  page = 1;
}

if (!Number.isFinite(limit) || limit < 1) {
  limit = 10;
}

limit = Math.min(limit, 50);


    const offset =
      (page - 1) * limit;

    const search =
      String(
        req.query.search || ""
      ).trim();

    const status =
      normalizeStatus(
        req.query.status
      );

    const rating =
      normalizeRating(
        req.query.rating
      );


    /*
    |--------------------------------------------------------------------------
    | WHERE
    |--------------------------------------------------------------------------
    */

    let where = "WHERE 1=1";

    const params = [];


    if (search) {
      where += `
        AND (
          r.title LIKE ?
          OR r.comment LIKE ?
          OR p.name LIKE ?
          OR u.name LIKE ?
          OR u.email LIKE ?
        )
      `;

      const s = `%${search}%`;

      params.push(
        s,
        s,
        s,
        s,
        s
      );
    }


    if (status) {
      where +=
        " AND r.status=?";

      params.push(status);
    }


    if (rating) {
      where +=
        " AND r.rating=?";

      params.push(rating);
    }


    /*
    |--------------------------------------------------------------------------
    | TOTAL
    |--------------------------------------------------------------------------
    */

    const totalResult =
      await query(
        `
        SELECT COUNT(*) AS total

        FROM reviews r

        JOIN products p
          ON p.id=r.product_id

        JOIN users u
          ON u.id=r.user_id

        ${where}
        `,
        params
      );

    const total =
      Number(
        totalResult[0]?.total || 0
      );


    /*
    |--------------------------------------------------------------------------
    | REVIEWS
    |--------------------------------------------------------------------------
    */

    const rows =
      await query(
        `
        SELECT
          r.*,

          p.id AS product_id,
          p.name AS product_name,
          p.slug AS product_slug,

          u.id AS user_id,
          u.name AS user_name,
          u.email AS user_email

        FROM reviews r

        JOIN products p
          ON p.id=r.product_id

        JOIN users u
          ON u.id=r.user_id

        ${where}

        ORDER BY r.id DESC

        LIMIT ${limit} OFFSET ${offset}
        `,
        params
      );


    /*
    |--------------------------------------------------------------------------
    | Shape response
    |--------------------------------------------------------------------------
    */

    const reviews =
      rows.map((review) => ({
        id: review.id,

        rating: Number(
          review.rating || 0
        ),

        title:
          review.title || null,

        comment:
          review.comment || null,

        status:
          review.status || "pending",

        created_at:
          review.created_at,

        updated_at:
          review.updated_at,

        product: {
          id:
            review.product_id,

          name:
            review.product_name,

          slug:
            review.product_slug,
        },

        user: {
          id:
            review.user_id,

          name:
            review.user_name,

          email:
            review.user_email,
        },
      }));


    /*
    |--------------------------------------------------------------------------
    | Statistics
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    | Average rating is calculated ONLY from approved reviews.
    |
    */

    const statsResult =
      await query(
        `
        SELECT

          COUNT(*) AS total,

          SUM(
            CASE
              WHEN status='pending'
              THEN 1
              ELSE 0
            END
          ) AS pending,

          SUM(
            CASE
              WHEN status='approved'
              THEN 1
              ELSE 0
            END
          ) AS approved,

          SUM(
            CASE
              WHEN status='rejected'
              THEN 1
              ELSE 0
            END
          ) AS rejected,

          COALESCE(
            AVG(
              CASE
                WHEN status='approved'
                THEN rating
              END
            ),
            0
          ) AS average_rating

        FROM reviews
        `
      );


    const stats =
      statsResult[0] || {};


    const lastPage =
      total === 0
        ? 1
        : Math.ceil(
            total / limit
          );


    return ok(res, {
      success: true,

      data: {
        data: reviews,

        current_page: page,

        last_page: lastPage,

        per_page: limit,

        total,

        stats: {
          total:
            Number(
              stats.total || 0
            ),

          pending:
            Number(
              stats.pending || 0
            ),

          approved:
            Number(
              stats.approved || 0
            ),

          rejected:
            Number(
              stats.rejected || 0
            ),

          average_rating:
            Number(
              stats.average_rating || 0
            ),
        },
      },
    });

  } catch (error) {

    console.error(
      "Reviews index error:",
      error
    );

    return fail(
      res,
      "Unable to load reviews.",
      500
    );
  }
}


/*
|--------------------------------------------------------------------------
| PUT /admin/reviews/:id
|--------------------------------------------------------------------------
*/

export async function update(
  req,
  res
) {
  try {

    const status =
      normalizeStatus(
        req.body?.status
      );


    if (!status) {
      return fail(
        res,
        "Invalid review status.",
        422
      );
    }


    /*
    |--------------------------------------------------------------------------
    | Check review
    |--------------------------------------------------------------------------
    */

    const existing =
      (
        await query(
          `
          SELECT
            id,
            product_id,
            status
          FROM reviews
          WHERE id=?
          `,
          [req.params.id]
        )
      )[0];


    if (!existing) {
      return fail(
        res,
        "Review not found.",
        404
      );
    }


    /*
    |--------------------------------------------------------------------------
    | Update review status
    |--------------------------------------------------------------------------
    */

    await query(
      `
      UPDATE reviews

      SET
        status=?,
        updated_at=NOW()

      WHERE id=?
      `,
      [
        status,
        req.params.id,
      ]
    );


    /*
    |--------------------------------------------------------------------------
    | Return updated review
    |--------------------------------------------------------------------------
    */

    const review =
      (
        await query(
          `
          SELECT

            r.id,
            r.rating,
            r.title,
            r.comment,
            r.status,
            r.created_at,
            r.updated_at,

            p.id AS product_id,
            p.name AS product_name,
            p.slug AS product_slug,

            u.id AS user_id,
            u.name AS user_name,
            u.email AS user_email

          FROM reviews r

          JOIN products p
            ON p.id=r.product_id

          JOIN users u
            ON u.id=r.user_id

          WHERE r.id=?
          `,
          [req.params.id]
        )
      )[0];


    /*
    |--------------------------------------------------------------------------
    | Get updated product review statistics
    |--------------------------------------------------------------------------
    |
    | This is useful for the frontend/admin response.
    |
    */

    const productStats =
      (
        await query(
          `
          SELECT

            COUNT(*) AS review_count,

            COALESCE(
              AVG(rating),
              0
            ) AS review_average

          FROM reviews

          WHERE
            product_id=?
            AND status='approved'
          `,
          [existing.product_id]
        )
      )[0];


    return ok(res, {

      success: true,

      message:
        `Review ${status} successfully.`,

      data: {

        review,

        product_stats: {
          review_count:
            Number(
              productStats?.review_count || 0
            ),

          review_average:
            Number(
              productStats?.review_average || 0
            ),
        },

      },

    });

  } catch (error) {

    console.error(
      "Review update error:",
      error
    );

    return fail(
      res,
      "Unable to update review.",
      500
    );
  }
}


/*
|--------------------------------------------------------------------------
| DELETE /admin/reviews/:id
|--------------------------------------------------------------------------
*/

export async function destroy(
  req,
  res
) {
  try {

    const existing =
      (
        await query(
          `
          SELECT
            id,
            product_id
          FROM reviews
          WHERE id=?
          `,
          [req.params.id]
        )
      )[0];


    if (!existing) {
      return fail(
        res,
        "Review not found.",
        404
      );
    }


    await query(
      `
      DELETE FROM reviews
      WHERE id=?
      `,
      [req.params.id]
    );


    /*
    |--------------------------------------------------------------------------
    | Get remaining approved review stats
    |--------------------------------------------------------------------------
    */

    const productStats =
      (
        await query(
          `
          SELECT

            COUNT(*) AS review_count,

            COALESCE(
              AVG(rating),
              0
            ) AS review_average

          FROM reviews

          WHERE
            product_id=?
            AND status='approved'
          `,
          [existing.product_id]
        )
      )[0];


    return ok(res, {

      success: true,

      message:
        "Review deleted successfully.",

      data: {
        product_stats: {
          review_count:
            Number(
              productStats?.review_count || 0
            ),

          review_average:
            Number(
              productStats?.review_average || 0
            ),
        },
      },

    });

  } catch (error) {

    console.error(
      "Review delete error:",
      error
    );

    return fail(
      res,
      "Unable to delete review.",
      500
    );
  }
}