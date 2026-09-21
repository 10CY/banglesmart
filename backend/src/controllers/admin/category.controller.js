import { query } from "../../db.js";
import { ok, fail } from "../../utils/http.js";
import { imageUrl } from "../../utils/serialize.js";
import { uniqueSlug } from "../../utils/slug.js";

function normalizeCategory(category) {
  if (!category) return null;

  return {
    id: Number(category.id),
    name: category.name,
    slug: category.slug,
    description: category.description ?? null,
    image: category.image ?? null,
    image_url: category.image
      ? imageUrl(category.image)
      : null,
    status: category.status,
    sort_order: Number(category.sort_order || 0),
    parent_id:
      category.parent_id === null ||
      category.parent_id === undefined
        ? null
        : Number(category.parent_id),

    parent: category.parent
      ? {
          id: Number(category.parent.id),
          name: category.parent.name,
        }
      : null,

    children_count: Number(
      category.children_count || 0,
    ),

    created_at: category.created_at,
    updated_at: category.updated_at,
  };
}

/*
|--------------------------------------------------------------------------
| GET /api/admin/categories
|--------------------------------------------------------------------------
*/

export async function index(req, res) {
  try {
    const categories = await query(`
      SELECT
        c.*,
        p.id AS parent_id_value,
        p.name AS parent_name,

        (
          SELECT COUNT(*)
          FROM categories child
          WHERE child.parent_id = c.id
        ) AS children_count

      FROM categories c

      LEFT JOIN categories p
        ON p.id = c.parent_id

      ORDER BY
        c.sort_order ASC,
        c.id DESC
    `);

    const data = categories.map((category) => {
      return normalizeCategory({
        ...category,

        parent:
          category.parent_id_value
            ? {
                id: category.parent_id_value,
                name: category.parent_name,
              }
            : null,

        children_count:
          category.children_count,
      });
    });

    return ok(res, {
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "CATEGORY INDEX ERROR:",
      error,
    );

    return fail(
      res,
      "Unable to load categories.",
      500,
    );
  }
}

/*
|--------------------------------------------------------------------------
| GET /api/admin/categories/:id
|--------------------------------------------------------------------------
*/

export async function show(req, res) {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return fail(
        res,
        "Invalid category ID.",
        422,
      );
    }

    const category = (
      await query(
        `
        SELECT
          c.*,
          p.id AS parent_id_value,
          p.name AS parent_name,

          (
            SELECT COUNT(*)
            FROM categories child
            WHERE child.parent_id = c.id
          ) AS children_count

        FROM categories c

        LEFT JOIN categories p
          ON p.id = c.parent_id

        WHERE c.id = ?
        LIMIT 1
        `,
        [id],
      )
    )[0];

    if (!category) {
      return fail(
        res,
        "Category not found.",
        404,
      );
    }

    return ok(res, {
      success: true,
      data: normalizeCategory({
        ...category,

        parent:
          category.parent_id_value
            ? {
                id: category.parent_id_value,
                name: category.parent_name,
              }
            : null,

        children_count:
          category.children_count,
      }),
    });
  } catch (error) {
    console.error(
      "CATEGORY SHOW ERROR:",
      error,
    );

    return fail(
      res,
      "Unable to load category.",
      500,
    );
  }
}

/*
|--------------------------------------------------------------------------
| POST /api/admin/categories
|--------------------------------------------------------------------------
*/

export async function store(req, res) {
  try {
    const x = req.body || {};

    const name = String(
      x.name || "",
    ).trim();

    if (!name) {
      return fail(
        res,
        "Category name is required.",
        422,
      );
    }

    const status =
      x.status === "inactive"
        ? "inactive"
        : "active";

    const sortOrder = Math.max(
      0,
      Number(x.sort_order || 0),
    );

    let parentId = null;

    if (
      x.parent_id !== undefined &&
      x.parent_id !== null &&
      String(x.parent_id).trim() !== ""
    ) {
      parentId = Number(x.parent_id);

      if (!Number.isInteger(parentId)) {
        return fail(
          res,
          "Invalid parent category.",
          422,
        );
      }

      const parent = (
        await query(
          "SELECT id FROM categories WHERE id=? LIMIT 1",
          [parentId],
        )
      )[0];

      if (!parent) {
        return fail(
          res,
          "Parent category not found.",
          422,
        );
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Slug
    |--------------------------------------------------------------------------
    */

    const slug = await uniqueSlug(
      name,
      "categories",
    );

    /*
    |--------------------------------------------------------------------------
    | Image
    |--------------------------------------------------------------------------
    */

    let imagePath = null;

    if (req.file) {
      imagePath =
        `categories/${req.file.filename}`;
    }

    /*
    |--------------------------------------------------------------------------
    | Insert
    |--------------------------------------------------------------------------
    */

    const result = await query(
      `
      INSERT INTO categories
      (
        name,
        slug,
        description,
        image,
        status,
        sort_order,
        parent_id,
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
        ?,
        NOW(),
        NOW()
      )
      `,
      [
        name,
        slug,
        x.description
          ? String(x.description).trim()
          : null,
        imagePath,
        status,
        sortOrder,
        parentId,
      ],
    );

    const created = (
      await query(
        `
        SELECT *
        FROM categories
        WHERE id=?
        LIMIT 1
        `,
        [result.insertId],
      )
    )[0];

    return ok(
      res,
      {
        success: true,
        message:
          "Category created successfully.",
        data: normalizeCategory(
          created,
        ),
      },
      201,
    );
  } catch (error) {
    console.error(
      "CATEGORY STORE ERROR:",
      error,
    );

    return fail(
      res,
      error?.message ||
        "Unable to create category.",
      500,
    );
  }
}

/*
|--------------------------------------------------------------------------
| PUT /api/admin/categories/:id
|--------------------------------------------------------------------------
*/

export async function update(req, res) {
  try {
    const id = Number(
      req.params.id,
    );

    if (!id) {
      return fail(
        res,
        "Invalid category ID.",
        422,
      );
    }

    const category = (
      await query(
        "SELECT * FROM categories WHERE id=? LIMIT 1",
        [id],
      )
    )[0];

    if (!category) {
      return fail(
        res,
        "Category not found.",
        404,
      );
    }

    const x = req.body || {};

    const name =
      x.name !== undefined
        ? String(x.name).trim()
        : category.name;

    if (!name) {
      return fail(
        res,
        "Category name is required.",
        422,
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Parent category
    |--------------------------------------------------------------------------
    */

    let parentId = null;

    if (
      x.parent_id !== undefined &&
      x.parent_id !== null &&
      String(x.parent_id).trim() !== ""
    ) {
      parentId = Number(x.parent_id);

      if (!Number.isInteger(parentId)) {
        return fail(
          res,
          "Invalid parent category.",
          422,
        );
      }

      if (parentId === id) {
        return fail(
          res,
          "A category cannot be its own parent.",
          422,
        );
      }

      const parent = (
        await query(
          "SELECT id,parent_id FROM categories WHERE id=? LIMIT 1",
          [parentId],
        )
      )[0];

      if (!parent) {
        return fail(
          res,
          "Parent category not found.",
          422,
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Prevent circular category tree
      |--------------------------------------------------------------------------
      */

      let cursorId = parentId;

      while (cursorId) {
        if (Number(cursorId) === id) {
          return fail(
            res,
            "A category cannot be placed inside itself or its own child category.",
            422,
          );
        }

        const cursor = (
          await query(
            "SELECT parent_id FROM categories WHERE id=? LIMIT 1",
            [cursorId],
          )
        )[0];

        if (!cursor) {
          break;
        }

        cursorId = cursor.parent_id
          ? Number(cursor.parent_id)
          : null;
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Slug
    |--------------------------------------------------------------------------
    */

    let slug = category.slug;

    if (name !== category.name) {
      slug = await uniqueSlug(
        name,
        "categories",
        id,
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Image
    |--------------------------------------------------------------------------
    |
    | Important:
    | If no new image is uploaded,
    | keep the old image.
    |
    */

    let imagePath =
      category.image || null;

    if (req.file) {
      imagePath =
        `categories/${req.file.filename}`;
    }

    /*
    |--------------------------------------------------------------------------
    | Update
    |--------------------------------------------------------------------------
    */

    await query(
      `
      UPDATE categories
      SET
        name=?,
        slug=?,
        description=?,
        image=?,
        status=?,
        sort_order=?,
        parent_id=?,
        updated_at=NOW()
      WHERE id=?
      `,
      [
        name,
        slug,
        x.description !== undefined
          ? String(x.description).trim() ||
            null
          : category.description,

        imagePath,

        x.status === "inactive"
          ? "inactive"
          : x.status === "active"
            ? "active"
            : category.status,

        x.sort_order !== undefined
          ? Math.max(
              0,
              Number(x.sort_order || 0),
            )
          : category.sort_order,

        parentId,

        id,
      ],
    );

    const updated = (
      await query(
        `
        SELECT *
        FROM categories
        WHERE id=?
        LIMIT 1
        `,
        [id],
      )
    )[0];

    return ok(res, {
      success: true,
      message:
        "Category updated successfully.",
      data: normalizeCategory(
        updated,
      ),
    });
  } catch (error) {
    console.error(
      "CATEGORY UPDATE ERROR:",
      error,
    );

    return fail(
      res,
      error?.message ||
        "Unable to update category.",
      500,
    );
  }
}

/*
|--------------------------------------------------------------------------
| DELETE /api/admin/categories/:id
|--------------------------------------------------------------------------
*/

export async function destroy(req, res) {
  try {
    const id = Number(
      req.params.id,
    );

    if (!id) {
      return fail(
        res,
        "Invalid category ID.",
        422,
      );
    }

    const category = (
      await query(
        "SELECT * FROM categories WHERE id=? LIMIT 1",
        [id],
      )
    )[0];

    if (!category) {
      return fail(
        res,
        "Category not found.",
        404,
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Move children to top-level
    |--------------------------------------------------------------------------
    |
    | This matches the intended safe behavior
    | instead of accidentally deleting children.
    |
    */

    await query(
      "UPDATE categories SET parent_id=NULL,updated_at=NOW() WHERE parent_id=?",
      [id],
    );

    await query(
      "DELETE FROM categories WHERE id=?",
      [id],
    );

    return ok(res, {
      success: true,
      message:
        "Category deleted successfully.",
    });
  } catch (error) {
    console.error(
      "CATEGORY DELETE ERROR:",
      error,
    );

    return fail(
      res,
      error?.message ||
        "Unable to delete category.",
      500,
    );
  }
}