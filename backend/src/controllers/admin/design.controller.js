import { query } from "../../db.js";
import { ok, fail } from "../../utils/http.js";
import { imageUrl } from "../../utils/serialize.js";
import { uploadedImageValue } from "../../utils/uploadPath.js";
import { getProductDesignOptions } from "../../services/product.service.js";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function toBool(value) {
  return value === true || value === 1 || value === "1" || value === "true";
}

function nullableString(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const text = String(value).trim();

  return text || null;
}

/*
|--------------------------------------------------------------------------
| GET DESIGN OPTIONS
|--------------------------------------------------------------------------
|
| GET /admin/products/:product/design-options
|
|--------------------------------------------------------------------------
*/

export async function index(req, res) {
  try {
    const productId = Number(req.params.product);

    if (!Number.isInteger(productId) || productId <= 0) {
      return fail(res, "Invalid product ID.", 422);
    }

    const rows = await getProductDesignOptions(productId);

    return ok(res, {
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Design index error:", error);

    return fail(res, "Unable to load design options.", 500);
  }
}

/*
|--------------------------------------------------------------------------
| CREATE DESIGN OPTION
|--------------------------------------------------------------------------
|
| POST /admin/products/:product/design-options
|
|--------------------------------------------------------------------------
*/

export async function store(req, res) {
  try {
    const productId = Number(req.params.product);

    const label = nullableString(req.body?.label);

    const sortOrder = Math.max(0, Number(req.body?.sort_order || 0));

    const status = nullableString(req.body?.status) || "active";

    /*
    |--------------------------------------------------------------------------
    | Validate Product
    |--------------------------------------------------------------------------
    */

    if (!Number.isInteger(productId) || productId <= 0) {
      return fail(res, "Invalid product ID.", 422);
    }

    const product = (
      await query(
        `
          SELECT id

          FROM products

          WHERE id = ?

          LIMIT 1
        `,
        [productId],
      )
    )[0];

    if (!product) {
      return fail(res, "Product not found.", 404);
    }

    /*
    |--------------------------------------------------------------------------
    | Create Design Option
    |--------------------------------------------------------------------------
    */

    const result = await query(
      `
          INSERT INTO product_design_options
          (
            product_id,
            label,
            sort_order,
            status,
            created_at,
            updated_at
          )

          VALUES
          (
            ?,
            ?,
            ?,
            ?,
            NOW(),
            NOW()
          )
        `,
      [productId, label, sortOrder, status],
    );

    /*
    |--------------------------------------------------------------------------
    | Return Complete Design Option
    |--------------------------------------------------------------------------
    */

    const rows = await getProductDesignOptions(productId);

    const created = rows.find(
      (row) => Number(row.id) === Number(result.insertId),
    );

    return ok(
      res,
      {
        success: true,

        message: "Design option created.",

        data: created || null,
      },
      201,
    );
  } catch (error) {
    console.error("Design store error:", error);

    return fail(res, error?.message || "Unable to create design option.", 500);
  }
}

/*
|--------------------------------------------------------------------------
| UPDATE DESIGN OPTION
|--------------------------------------------------------------------------
|
| PUT /admin/design-options/:id
|
|--------------------------------------------------------------------------
*/

export async function update(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return fail(res, "Invalid design option ID.", 422);
    }

    /*
    |--------------------------------------------------------------------------
    | Existing Design
    |--------------------------------------------------------------------------
    */

    const old = (
      await query(
        `
          SELECT *

          FROM product_design_options

          WHERE id = ?

          LIMIT 1
        `,
        [id],
      )
    )[0];

    if (!old) {
      return fail(res, "Design option not found.", 404);
    }

    /*
    |--------------------------------------------------------------------------
    | Build Values
    |--------------------------------------------------------------------------
    */

    const label =
      req.body?.label !== undefined
        ? nullableString(req.body.label)
        : old.label;

    const sortOrder =
      req.body?.sort_order !== undefined
        ? Math.max(0, Number(req.body.sort_order || 0))
        : Number(old.sort_order || 0);

    const status = nullableString(req.body?.status) || old.status || "active";

    /*
    |--------------------------------------------------------------------------
    | Update
    |--------------------------------------------------------------------------
    */

    await query(
      `
        UPDATE product_design_options

        SET
          label = ?,
          sort_order = ?,
          status = ?,
          updated_at = NOW()

        WHERE id = ?
      `,
      [label, sortOrder, status, id],
    );

    /*
    |--------------------------------------------------------------------------
    | Return Updated Design
    |--------------------------------------------------------------------------
    */

    const rows = await getProductDesignOptions(old.product_id);

    const updated = rows.find((row) => Number(row.id) === id);

    return ok(res, {
      success: true,

      message: "Design option updated.",

      data: updated || null,
    });
  } catch (error) {
    console.error("Design update error:", error);

    return fail(res, error?.message || "Unable to update design option.", 500);
  }
}

/*
|--------------------------------------------------------------------------
| DELETE DESIGN OPTION
|--------------------------------------------------------------------------
|
| DELETE /admin/design-options/:id
|
|--------------------------------------------------------------------------
*/

export async function destroy(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return fail(res, "Invalid design option ID.", 422);
    }

    /*
    |--------------------------------------------------------------------------
    | Check Design Exists
    |--------------------------------------------------------------------------
    */

    const design = (
      await query(
        `
          SELECT id

          FROM product_design_options

          WHERE id = ?

          LIMIT 1
        `,
        [id],
      )
    )[0];

    if (!design) {
      return fail(res, "Design option not found.", 404);
    }

    /*
    |--------------------------------------------------------------------------
    | Delete
    |--------------------------------------------------------------------------
    |
    | product_design_images should be deleted automatically if your
    | foreign key uses ON DELETE CASCADE.
    |
    |--------------------------------------------------------------------------
    */

    await query(
      `
        DELETE FROM product_design_options

        WHERE id = ?
      `,
      [id],
    );

    return ok(res, {
      success: true,

      message: "Design option deleted.",
    });
  } catch (error) {
    console.error("Design delete error:", error);

    return fail(res, error?.message || "Unable to delete design option.", 500);
  }
}

/*
|--------------------------------------------------------------------------
| UPLOAD DESIGN IMAGE
|--------------------------------------------------------------------------
|
| POST /admin/design-options/:id/images
|
| Body:
|
| image
| color_id
| alt_text
| is_primary
| sort_order
|
| color_id:
|
| NULL / empty = General Design image
| Number       = Specific Color Design image
|
| Examples:
|
| Square + General
| Square + Pink
| Square + Black
| Square + Deep Maroon
|
|--------------------------------------------------------------------------
*/

export async function uploadImage(req, res) {
  try {
    const designId = Number(req.params.id);

    /*
    |--------------------------------------------------------------------------
    | Validate Design ID
    |--------------------------------------------------------------------------
    */

    if (!Number.isInteger(designId) || designId <= 0) {
      return fail(res, "Invalid design option ID.", 422);
    }

    /*
    |--------------------------------------------------------------------------
    | Image Required
    |--------------------------------------------------------------------------
    */

    if (!req.file) {
      return fail(res, "Image file is required.", 422);
    }

    /*
    |--------------------------------------------------------------------------
    | Design Exists
    |--------------------------------------------------------------------------
    */

    const design = (
      await query(
        `
          SELECT
            id,
            product_id

          FROM product_design_options

          WHERE id = ?

          LIMIT 1
        `,
        [designId],
      )
    )[0];

    if (!design) {
      return fail(res, "Design option not found.", 404);
    }

    /*
    |--------------------------------------------------------------------------
    | Optional Color
    |--------------------------------------------------------------------------
    */

    const rawColorId = req.body?.color_id;

    const colorId =
      rawColorId === undefined || rawColorId === null || rawColorId === ""
        ? null
        : Number(rawColorId);

    /*
    |--------------------------------------------------------------------------
    | Validate Color
    |--------------------------------------------------------------------------
    |
    | Color must exist as a variant color for this product.
    |
    |--------------------------------------------------------------------------
    */

    if (colorId !== null) {
      if (!Number.isInteger(colorId) || colorId <= 0) {
        return fail(res, "Invalid color.", 422);
      }

      const color = (
        await query(
          `
            SELECT DISTINCT
              c.id

            FROM product_variants pv

            INNER JOIN colors c
              ON c.id =
                 pv.color_id

            WHERE
              pv.product_id = ?

              AND pv.color_id = ?

              AND c.status =
                  'active'

            LIMIT 1
          `,
          [design.product_id, colorId],
        )
      )[0];

      if (!color) {
        return fail(
          res,
          "Selected color is not available for this product.",
          422,
        );
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Count Images in Same Design + Color Group
    |--------------------------------------------------------------------------
    |
    | Examples:
    |
    | Square + General
    | Square + Pink
    | Square + Black
    | Square + Maroon
    |
    | Each group gets its own Primary Image.
    |
    |--------------------------------------------------------------------------
    */

    const countRow = (
      await query(
        `
          SELECT
            COUNT(*) AS count

          FROM product_design_images

          WHERE
            design_option_id = ?

            AND color_id <=> ?
        `,
        [designId, colorId],
      )
    )[0];

    const count = Number(countRow?.count || 0);

    /*
    |--------------------------------------------------------------------------
    | Primary Image
    |--------------------------------------------------------------------------
    */

    const requestedPrimary = toBool(req.body?.is_primary);

    /*
    | First image in this Design + Color group automatically becomes primary.
    */

    const isPrimary = count === 0 || requestedPrimary ? 1 : 0;

    /*
    |--------------------------------------------------------------------------
    | Remove Existing Primary in Same Group
    |--------------------------------------------------------------------------
    */

    if (isPrimary) {
      await query(
        `
          UPDATE product_design_images

          SET
            is_primary = 0

          WHERE
            design_option_id = ?

            AND color_id <=> ?
        `,
        [designId, colorId],
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Sort Order
    |--------------------------------------------------------------------------
    */

    let sortOrder = Number(req.body?.sort_order);

    if (!Number.isFinite(sortOrder)) {
      sortOrder = count;
    }

    /*
    |--------------------------------------------------------------------------
    | Uploaded Image Path
    |--------------------------------------------------------------------------
    */

    const image = uploadedImageValue(req.file, "designs");

    if (!image) {
      return fail(res, "Unable to determine uploaded image path.", 500);
    }

    /*
    |--------------------------------------------------------------------------
    | Alt Text
    |--------------------------------------------------------------------------
    */

    const altText = nullableString(req.body?.alt_text);

    /*
    |--------------------------------------------------------------------------
    | Insert
    |--------------------------------------------------------------------------
    */

    const result = await query(
      `
          INSERT INTO product_design_images
          (
            design_option_id,
            color_id,
            image,
            alt_text,
            is_primary,
            sort_order,
            created_at,
            updated_at
          )

          VALUES
          (
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
      [designId, colorId, image, altText, isPrimary, sortOrder],
    );

    /*
    |--------------------------------------------------------------------------
    | Return Created Image
    |--------------------------------------------------------------------------
    */

    const row = (
      await query(
        `
          SELECT *

          FROM product_design_images

          WHERE id = ?

          LIMIT 1
        `,
        [result.insertId],
      )
    )[0];

    return ok(
      res,
      {
        success: true,

        message: "Design image uploaded.",

        data: {
          ...row,

          id: Number(row.id),

          design_option_id: Number(row.design_option_id),

          color_id:
            row.color_id !== null && row.color_id !== undefined
              ? Number(row.color_id)
              : null,

          is_primary: toBool(row.is_primary),

          sort_order: Number(row.sort_order || 0),

          url: imageUrl(row.image),
        },
      },
      201,
    );
  } catch (error) {
    console.error("Design image upload error:", error);

    return fail(res, error?.message || "Unable to upload design image.", 500);
  }
}

/*
|--------------------------------------------------------------------------
| DELETE DESIGN IMAGE
|--------------------------------------------------------------------------
*/

export async function deleteImage(req, res) {
  try {
    const id = Number(req.params.id);

    /*
    |--------------------------------------------------------------------------
    | Validate Image ID
    |--------------------------------------------------------------------------
    */

    if (!Number.isInteger(id) || id <= 0) {
      return fail(res, "Invalid image ID.", 422);
    }

    /*
    |--------------------------------------------------------------------------
    | Get Complete Image Before Deleting
    |--------------------------------------------------------------------------
    */

    const image = (
      await query(
        `
          SELECT *

          FROM product_design_images

          WHERE id = ?

          LIMIT 1
        `,
        [id],
      )
    )[0];

    if (!image) {
      return fail(res, "Design image not found.", 404);
    }

    /*
    |--------------------------------------------------------------------------
    | Delete
    |--------------------------------------------------------------------------
    */

    await query(
      `
        DELETE FROM product_design_images

        WHERE id = ?
      `,
      [id],
    );

    /*
    |--------------------------------------------------------------------------
    | Promote Replacement Primary if Needed
    |--------------------------------------------------------------------------
    |
    | Only promote an image from SAME Design + Color group.
    |
    |--------------------------------------------------------------------------
    */

    if (toBool(image.is_primary)) {
      const replacement = (
        await query(
          `
            SELECT id

            FROM product_design_images

            WHERE
              design_option_id = ?

              AND color_id <=> ?

            ORDER BY
              sort_order ASC,
              id ASC

            LIMIT 1
          `,
          [image.design_option_id, image.color_id ?? null],
        )
      )[0];

      if (replacement) {
        await query(
          `
            UPDATE product_design_images

            SET
              is_primary = 1,
              updated_at = NOW()

            WHERE id = ?
          `,
          [replacement.id],
        );
      }
    }

    return ok(res, {
      success: true,

      message: "Design image deleted.",
    });
  } catch (error) {
    console.error("Design image delete error:", error);

    return fail(res, error?.message || "Unable to delete design image.", 500);
  }
}

/*
|--------------------------------------------------------------------------
| SET PRIMARY DESIGN IMAGE
|--------------------------------------------------------------------------
|
| Primary is scoped by:
|
| design_option_id + color_id
|
| Example:
|
| Square + General → one primary
| Square + Pink    → one primary
| Square + Black   → one primary
| Square + Maroon  → one primary
|
|--------------------------------------------------------------------------
*/

export async function primaryImage(req, res) {
  try {
    const id = Number(req.params.id);

    /*
    |--------------------------------------------------------------------------
    | Validate Image ID
    |--------------------------------------------------------------------------
    */

    if (!Number.isInteger(id) || id <= 0) {
      return fail(res, "Invalid image ID.", 422);
    }

    /*
    |--------------------------------------------------------------------------
    | Image
    |--------------------------------------------------------------------------
    */

    const image = (
      await query(
        `
          SELECT *

          FROM product_design_images

          WHERE id = ?

          LIMIT 1
        `,
        [id],
      )
    )[0];

    if (!image) {
      return fail(res, "Design image not found.", 404);
    }

    /*
    |--------------------------------------------------------------------------
    | Remove Primary in Same Design + Color Group
    |--------------------------------------------------------------------------
    */

    await query(
      `
        UPDATE product_design_images

        SET
          is_primary = 0

        WHERE
          design_option_id = ?

          AND color_id <=> ?
      `,
      [image.design_option_id, image.color_id ?? null],
    );

    /*
    |--------------------------------------------------------------------------
    | Set New Primary
    |--------------------------------------------------------------------------
    */

    await query(
      `
        UPDATE product_design_images

        SET
          is_primary = 1,
          updated_at = NOW()

        WHERE id = ?
      `,
      [id],
    );

    return ok(res, {
      success: true,

      message: "Primary design image updated.",
    });
  } catch (error) {
    console.error("Design image primary error:", error);

    return fail(
      res,
      error?.message || "Unable to set primary design image.",
      500,
    );
  }
}
