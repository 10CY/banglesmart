import { query } from "../../db.js";
import { ok, fail } from "../../utils/http.js";

/* ============================================================================
   INVENTORY LIST
   GET /admin/inventory
============================================================================ */

export async function index(req, res) {
  try {
    const search = String(req.query.search || "").trim();
    const stock = String(req.query.stock || "").trim();
    const status = String(req.query.status || "").trim();

    let where = `
      WHERE 1 = 1
    `;

    const params = [];

    /* ------------------------------------------------------------------------
       Search
    ------------------------------------------------------------------------ */

    if (search) {
      where += `
        AND (
          p.name LIKE ?
          OR p.sku LIKE ?
          OR pv.sku LIKE ?
        )
      `;

      const value = `%${search}%`;

      params.push(
        value,
        value,
        value
      );
    }

    /* ------------------------------------------------------------------------
       Status
    ------------------------------------------------------------------------ */

    if (status) {
      where += `
        AND pv.status = ?
      `;

      params.push(status);
    }

    /* ------------------------------------------------------------------------
       Inventory
    ------------------------------------------------------------------------ */

    let rows = await query(
      `
        SELECT

          i.id AS inventory_id,

          i.product_variant_id,

          i.quantity,

          i.reserved_quantity,

          i.low_stock_limit,

          i.created_at,

          i.updated_at,


          /* Variant */

          pv.id AS variant_id,

          pv.sku AS variant_sku,

          pv.mrp AS variant_mrp,

          pv.selling_price AS variant_selling_price,

          pv.size_id,

          pv.color_id,

          pv.status AS variant_status,


          /* Product */

          p.id AS product_id,

          p.name AS product_name,

          p.sku AS product_sku,

          p.status AS product_status,


          /* Category */

          cat.id AS category_id,

          cat.name AS category_name,


          /* Size */

          s.id AS size_id,

          s.name AS size_name,

          s.display_name AS size_display_name,


          /* Color */

          c.id AS color_id,

          c.name AS color_name,

          c.display_name AS color_display_name,

          c.hex_code


        FROM inventories i

        JOIN product_variants pv
          ON pv.id = i.product_variant_id

        JOIN products p
          ON p.id = pv.product_id

        LEFT JOIN categories cat
          ON cat.id = p.category_id

        LEFT JOIN sizes s
          ON s.id = pv.size_id

        LEFT JOIN colors c
          ON c.id = pv.color_id

        ${where}

        ORDER BY i.id DESC
      `,
      params
    );


    /* ------------------------------------------------------------------------
       Stock Filter
    ------------------------------------------------------------------------ */

    rows = rows.filter((row) => {
      const quantity =
        Number(row.quantity || 0);

      const reserved =
        Number(row.reserved_quantity || 0);

      const available =
        Math.max(
          0,
          quantity - reserved
        );

      const lowLimit =
        Number(
          row.low_stock_limit || 0
        );


      if (stock === "in_stock") {
        return available > lowLimit;
      }

      if (stock === "low_stock") {
        return (
          available > 0 &&
          available <= lowLimit
        );
      }

      if (stock === "out_of_stock") {
        return available <= 0;
      }

      return true;
    });


    /* ------------------------------------------------------------------------
       Shape Rows
    ------------------------------------------------------------------------ */

    const data = rows.map((row) => {
      const quantity =
        Number(row.quantity || 0);

      const reserved =
        Number(row.reserved_quantity || 0);

      const available =
        Math.max(
          0,
          quantity - reserved
        );

      const lowLimit =
        Number(
          row.low_stock_limit || 0
        );


      let stock_status =
        "in_stock";

      if (available <= 0) {
        stock_status = "out_of_stock";
      } else if (
        available <= lowLimit
      ) {
        stock_status = "low_stock";
      }


      return {
        id:
          Number(row.inventory_id),

        inventory_id:
          Number(row.inventory_id),

        product_variant_id:
          Number(row.product_variant_id),

        quantity,

        reserved_quantity:
          reserved,

        available_quantity:
          available,

        available,

        low_stock_limit:
          lowLimit,

        stock_status,

        created_at:
          row.created_at,

        updated_at:
          row.updated_at,


        /* Flat fields - useful for existing frontend */

        product_id:
          Number(row.product_id),

        product_name:
          row.product_name,

        product_sku:
          row.product_sku,

        variant_id:
          Number(row.variant_id),

        variant_sku:
          row.variant_sku,

        size_id:
          row.size_id !== null
            ? Number(row.size_id)
            : null,

        size_name:
          row.size_name,

        size_display_name:
          row.size_display_name,

        color_id:
          row.color_id !== null
            ? Number(row.color_id)
            : null,

        color_name:
          row.color_name,

        color_display_name:
          row.color_display_name,

        hex_code:
          row.hex_code,

        category_id:
          row.category_id !== null
            ? Number(row.category_id)
            : null,

        category_name:
          row.category_name,

        status:
          row.variant_status,


        /* Nested variant */

        variant: {
          id:
            Number(row.variant_id),

          sku:
            row.variant_sku,

          mrp:
            Number(
              row.variant_mrp || 0
            ),

          selling_price:
            Number(
              row.variant_selling_price || 0
            ),

          status:
            row.variant_status,

          product: {
            id:
              Number(row.product_id),

            name:
              row.product_name,

            sku:
              row.product_sku,

            category: {
              id:
                row.category_id !== null
                  ? Number(row.category_id)
                  : null,

              name:
                row.category_name,
            },
          },

          size:
            row.size_id !== null
              ? {
                  id:
                    Number(row.size_id),

                  name:
                    row.size_name || "",

                  display_name:
                    row.size_display_name ||
                    row.size_name ||
                    "",
                }
              : null,

          color:
            row.color_id !== null
              ? {
                  id:
                    Number(row.color_id),

                  name:
                    row.color_name || "",

                  display_name:
                    row.color_display_name ||
                    row.color_name ||
                    "",

                  hex_code:
                    row.hex_code || null,
                }
              : null,
        },
      };
    });


    /* ------------------------------------------------------------------------
       Summary
    ------------------------------------------------------------------------ */

    const summaryRows = await query(
      `
        SELECT

          COUNT(*) AS total_variants,

          COALESCE(
            SUM(
              GREATEST(
                0,
                i.quantity - i.reserved_quantity
              )
            ),
            0
          ) AS available_units,

          SUM(
            CASE
              WHEN
                GREATEST(
                  0,
                  i.quantity - i.reserved_quantity
                ) > 0
                AND
                GREATEST(
                  0,
                  i.quantity - i.reserved_quantity
                ) <= i.low_stock_limit
              THEN 1
              ELSE 0
            END
          ) AS low_stock,

          SUM(
            CASE
              WHEN
                GREATEST(
                  0,
                  i.quantity - i.reserved_quantity
                ) <= 0
              THEN 1
              ELSE 0
            END
          ) AS out_of_stock

        FROM inventories i

        JOIN product_variants pv
          ON pv.id = i.product_variant_id

        JOIN products p
          ON p.id = pv.product_id
      `
    );


    const summary =
      summaryRows[0] || {};


    return ok(res, {
      success: true,

      data,

      summary: {
        total_variants:
          Number(
            summary.total_variants || 0
          ),

        available_units:
          Number(
            summary.available_units || 0
          ),

        low_stock:
          Number(
            summary.low_stock || 0
          ),

        out_of_stock:
          Number(
            summary.out_of_stock || 0
          ),
      },
    });

  } catch (error) {
    console.error(
      "Inventory index error:",
      error
    );

    return fail(
      res,
      "Unable to load inventory.",
      500
    );
  }
}


/* ============================================================================
   UPDATE INVENTORY
   PUT /admin/inventory/:id
============================================================================ */

export async function update(req, res) {
  try {
    const id =
      req.params.id;

    const body =
      req.body || {};


    /* ------------------------------------------------------------------------
       Existing Inventory
    ------------------------------------------------------------------------ */

    const oldRows =
      await query(
        `
          SELECT *
          FROM inventories
          WHERE id = ?
          LIMIT 1
        `,
        [id]
      );


    const old =
      oldRows[0];


    if (!old) {
      return fail(
        res,
        "Inventory not found.",
        404
      );
    }


    /* ------------------------------------------------------------------------
       New Values
    ------------------------------------------------------------------------ */

    const oldQuantity =
      Number(
        old.quantity || 0
      );

    const newQuantity =
      Math.max(
        0,
        Number(
          body.quantity ??
          old.quantity
        )
      );


    const newLowStockLimit =
      Math.max(
        0,
        Number(
          body.low_stock_limit ??
          old.low_stock_limit ??
          0
        )
      );


    /* ------------------------------------------------------------------------
       Update
    ------------------------------------------------------------------------ */

    await query(
      `
        UPDATE inventories

        SET
          quantity = ?,
          low_stock_limit = ?,
          updated_at = NOW()

        WHERE id = ?
      `,
      [
        newQuantity,
        newLowStockLimit,
        id,
      ]
    );


    /* ------------------------------------------------------------------------
       Movement Quantity
    ------------------------------------------------------------------------ */

    const difference =
      newQuantity -
      oldQuantity;


    /*
      Only create movement when
      quantity actually changes.
    */

    if (difference !== 0) {
      await query(
        `
          INSERT INTO inventory_movements (

            product_variant_id,

            user_id,

            type,

            quantity,

            before_quantity,

            after_quantity,

            notes,

            created_at,

            updated_at

          )

          VALUES (
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            NOW(),
            NOW()
          )
        `,
        [
          old.product_variant_id,

          req.user?.id ||
            null,

          "adjustment",

          difference,

          oldQuantity,

          newQuantity,

          body.notes ||
            "Manual inventory adjustment",
        ]
      );
    }


    /* ------------------------------------------------------------------------
       Return Updated Inventory
    ------------------------------------------------------------------------ */

    const updatedRows =
      await query(
        `
          SELECT *

          FROM inventories

          WHERE id = ?

          LIMIT 1
        `,
        [id]
      );


    return ok(res, {
      success: true,

      message:
        "Inventory updated successfully.",

      data:
        updatedRows[0],
    });

  } catch (error) {
    console.error(
      "Inventory update error:",
      error
    );

    return fail(
      res,
      "Unable to update inventory.",
      500
    );
  }
}


/* ============================================================================
   INVENTORY MOVEMENTS / STOCK HISTORY
   GET /admin/inventory-movements
============================================================================ */

export async function movements(req, res) {
  try {
    const search =
      String(
        req.query.search || ""
      ).trim();

    const type =
      String(
        req.query.type || ""
      ).trim();

    const dateFrom =
      String(
        req.query.date_from || ""
      ).trim();

    const dateTo =
      String(
        req.query.date_to || ""
      ).trim();

    const page =
      Math.max(
        1,
        Number(
          req.query.page || 1
        )
      );

    const perPage = 30;

    const offset =
      (page - 1) *
      perPage;


    /* ------------------------------------------------------------------------
       WHERE
    ------------------------------------------------------------------------ */

    let where = `
      WHERE 1 = 1
    `;

    const params = [];


    /* ------------------------------------------------------------------------
       Search
    ------------------------------------------------------------------------ */

    if (search) {
      where += `
        AND (
          p.name LIKE ?
          OR p.sku LIKE ?
          OR pv.sku LIKE ?
        )
      `;

      const value =
        `%${search}%`;

      params.push(
        value,
        value,
        value
      );
    }


    /* ------------------------------------------------------------------------
       Movement Type
    ------------------------------------------------------------------------ */

    if (type) {
      where += `
        AND im.type = ?
      `;

      params.push(type);
    }


    /* ------------------------------------------------------------------------
       Date From
    ------------------------------------------------------------------------ */

    if (dateFrom) {
      where += `
        AND im.created_at >= ?
      `;

      params.push(
        `${dateFrom} 00:00:00`
      );
    }


    /* ------------------------------------------------------------------------
       Date To
    ------------------------------------------------------------------------ */

    if (dateTo) {
      where += `
        AND im.created_at <= ?
      `;

      params.push(
        `${dateTo} 23:59:59`
      );
    }


    /* ------------------------------------------------------------------------
       Total
    ------------------------------------------------------------------------ */

    const countRows =
      await query(
        `
          SELECT COUNT(*) AS total

          FROM inventory_movements im

          JOIN product_variants pv
            ON pv.id =
               im.product_variant_id

          JOIN products p
            ON p.id =
               pv.product_id

          ${where}
        `,
        params
      );


    const total =
      Number(
        countRows[0]?.total || 0
      );


    /* ------------------------------------------------------------------------
       Movement Rows
    ------------------------------------------------------------------------ */

    const rows =
      await query(
        `
          SELECT

            im.id,

            im.product_variant_id,

            im.user_id,

            im.type,

            im.quantity,

            im.before_quantity,

            im.after_quantity,

            im.reference_type,

            im.reference_id,

            im.notes,

            im.created_at,

            im.updated_at,


            /* Variant */

            pv.id AS variant_id,

            pv.sku AS variant_sku,

            pv.status AS variant_status,


            /* Product */

            p.id AS product_id,

            p.name AS product_name,

            p.sku AS product_sku,


            /* Primary Image */

            pi.id AS product_image_id,

            pi.image AS product_image,


            /* Size */

            s.id AS size_id,

            s.name AS size_name,

            s.display_name AS size_display_name,


            /* Color */

            c.id AS color_id,

            c.name AS color_name,

            c.display_name AS color_display_name,

            c.hex_code,


            /* User */

            u.id AS movement_user_id,

            u.name AS movement_user_name,

            u.email AS movement_user_email


          FROM inventory_movements im


          JOIN product_variants pv
            ON pv.id =
               im.product_variant_id


          JOIN products p
            ON p.id =
               pv.product_id


          LEFT JOIN sizes s
            ON s.id =
               pv.size_id


          LEFT JOIN colors c
            ON c.id =
               pv.color_id


          LEFT JOIN product_images pi
            ON pi.product_id =
               p.id

            AND pi.is_primary = 1


          LEFT JOIN users u
            ON u.id =
               im.user_id


          ${where}


          ORDER BY im.id DESC


          LIMIT ? OFFSET ?
        `,
        [
          ...params,
          perPage,
          offset,
        ]
      );


    /* ------------------------------------------------------------------------
       Shape Movement Response
    ------------------------------------------------------------------------ */

    const data =
      rows.map(
        (row) => ({
          id:
            Number(row.id),

          product_variant_id:
            Number(
              row.product_variant_id
            ),

          user_id:
            row.user_id !== null
              ? Number(row.user_id)
              : null,

          type:
            row.type,

          quantity:
            Number(
              row.quantity || 0
            ),

          before_quantity:
            Number(
              row.before_quantity || 0
            ),

          after_quantity:
            Number(
              row.after_quantity || 0
            ),

          reference_type:
            row.reference_type ||
            null,

          reference_id:
            row.reference_id !== null
              ? Number(
                  row.reference_id
                )
              : null,

          notes:
            row.notes || null,

          created_at:
            row.created_at,

          updated_at:
            row.updated_at,


          /* -------------------------------------------------------------- */
          /* Variant                                                        */
          /* -------------------------------------------------------------- */

          variant: {
            id:
              Number(
                row.variant_id
              ),

            sku:
              row.variant_sku,

            status:
              row.variant_status,


            product: {
              id:
                Number(
                  row.product_id
                ),

              name:
                row.product_name,

              sku:
                row.product_sku,

              primary_image:
                row.product_image
                  ? {
                      id:
                        Number(
                          row.product_image_id
                        ),

                      image:
                        row.product_image,
                    }
                  : null,
            },


            size:
              row.size_id !== null
                ? {
                    id:
                      Number(
                        row.size_id
                      ),

                    name:
                      row.size_name ||
                      "",

                    display_name:
                      row.size_display_name ||
                      row.size_name ||
                      "",
                  }
                : null,


            color:
              row.color_id !== null
                ? {
                    id:
                      Number(
                        row.color_id
                      ),

                    name:
                      row.color_name ||
                      "",

                    display_name:
                      row.color_display_name ||
                      row.color_name ||
                      "",

                    hex_code:
                      row.hex_code ||
                      null,
                  }
                : null,
          },


          /* -------------------------------------------------------------- */
          /* User                                                           */
          /* -------------------------------------------------------------- */

          user:
            row.movement_user_id !==
            null
              ? {
                  id:
                    Number(
                      row.movement_user_id
                    ),

                  name:
                    row.movement_user_name,

                  email:
                    row.movement_user_email,
                }
              : null,
        })
      );


    /* ------------------------------------------------------------------------
       Pagination
    ------------------------------------------------------------------------ */

    const lastPage =
      Math.max(
        1,
        Math.ceil(
          total / perPage
        )
      );


    /* ------------------------------------------------------------------------
       Response
    ------------------------------------------------------------------------ */

    return ok(res, {
      success: true,

      data: {
        data,

        current_page:
          page,

        last_page:
          lastPage,

        total,

        per_page:
          perPage,
      },
    });

  } catch (error) {
    console.error(
      "Inventory movements error:",
      error
    );

    return fail(
      res,
      "Unable to load stock history.",
      500
    );
  }
}