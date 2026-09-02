import { query } from "../../db.js";
import { ok, fail } from "../../utils/http.js";
import { uniqueSlug } from "../../utils/slug.js";
import { imageUrl } from "../../utils/serialize.js";

/*
|--------------------------------------------------------------------------
| BASIC RESOURCES
|--------------------------------------------------------------------------
*/

const defs = {
  sizes: {
    table: "sizes",
    fields: [
      "name",
      "display_name",
      "sort_order",
      "status",
    ],
  },

  colors: {
    table: "colors",
    fields: [
      "name",
      "display_name",
      "hex_code",
      "sort_order",
      "status",
    ],
  },
};

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function normalizeParentId(value) {
  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  ) {
    return null;
  }

  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

function categoryResponse(row) {
  if (!row) return null;

  return {
    id: Number(row.id),

    name: row.name,

    slug: row.slug,

    description:
      row.description ?? null,

    image:
      row.image ?? null,

    image_url: row.image
      ? imageUrl(row.image)
      : null,

    status:
      row.status || "active",

    sort_order: Number(
      row.sort_order || 0,
    ),

    parent_id:
      row.parent_id === null ||
      row.parent_id === undefined
        ? null
        : Number(row.parent_id),

    parent: row.parent_name
      ? {
          id: Number(row.parent_id),
          name: row.parent_name,
        }
      : null,

    children_count: Number(
      row.children_count || 0,
    ),

    created_at:
      row.created_at ?? null,

    updated_at:
      row.updated_at ?? null,
  };
}

/*
|--------------------------------------------------------------------------
| CIRCULAR CATEGORY CHECK
|--------------------------------------------------------------------------
*/

async function createsCircularTree(
  categoryId,
  parentId,
) {
  let currentId = parentId;

  while (currentId) {
    if (
      Number(currentId) ===
      Number(categoryId)
    ) {
      return true;
    }

    const parent = (
      await query(
        `
        SELECT parent_id
        FROM categories
        WHERE id=?
        LIMIT 1
        `,
        [currentId],
      )
    )[0];

    if (!parent) {
      break;
    }

    currentId =
      parent.parent_id
        ? Number(parent.parent_id)
        : null;
  }

  return false;
}

/*
|--------------------------------------------------------------------------
| SIZES / COLORS
|--------------------------------------------------------------------------
*/

export function makeBasic(kind) {
  const d = defs[kind];

  if (!d) {
    throw new Error(
      `Unknown basic resource: ${kind}`,
    );
  }

  return {
    /*
    |--------------------------------------------------------------------------
    | INDEX
    |--------------------------------------------------------------------------
    */

    index: async (req, res) => {
      try {
        const rows = await query(
          `
          SELECT *
          FROM ${d.table}
          ORDER BY sort_order ASC, id DESC
          `,
        );

        return ok(res, {
          success: true,
          data: rows,
        });
      } catch (error) {
        console.error(
          `${kind} INDEX ERROR:`,
          error,
        );

        return fail(
          res,
          `Unable to load ${kind}.`,
          500,
        );
      }
    },

    /*
    |--------------------------------------------------------------------------
    | STORE
    |--------------------------------------------------------------------------
    */

    store: async (req, res) => {
      try {
        const x = req.body || {};

        const name = String(
          x.name || "",
        ).trim();

        if (!name) {
          return fail(
            res,
            "Name is required.",
            422,
          );
        }

        const values =
          d.fields.map((field) => {
            if (
              field === "status"
            ) {
              return (
                x[field] ||
                "active"
              );
            }

            if (
              field === "sort_order"
            ) {
              return Math.max(
                0,
                Number(
                  x[field] || 0,
                ),
              );
            }

            return (
              x[field] ?? null
            );
          });

        const result =
          await query(
            `
            INSERT INTO ${d.table}
            (
              ${d.fields.join(",")},
              created_at,
              updated_at
            )
            VALUES
            (
              ${d.fields
                .map(
                  () => "?",
                )
                .join(",")},
              NOW(),
              NOW()
            )
            `,
            values,
          );

        const created = (
          await query(
            `
            SELECT *
            FROM ${d.table}
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
            message: `${kind} created successfully.`,
            data: created,
          },
          201,
        );
      } catch (error) {
        console.error(
          `${kind} STORE ERROR:`,
          error,
        );

        return fail(
          res,
          error?.message ||
            `Unable to create ${kind}.`,
          500,
        );
      }
    },

    /*
    |--------------------------------------------------------------------------
    | UPDATE
    |--------------------------------------------------------------------------
    */

    update: async (req, res) => {
      try {
        const id = Number(
          req.params.id,
        );

        const old = (
          await query(
            `
            SELECT *
            FROM ${d.table}
            WHERE id=?
            LIMIT 1
            `,
            [id],
          )
        )[0];

        if (!old) {
          return fail(
            res,
            `${kind} not found.`,
            404,
          );
        }

        const x = req.body || {};

        const values =
          d.fields.map(
            (field) => {
              if (
                x[field] !==
                undefined
              ) {
                if (
                  field ===
                  "sort_order"
                ) {
                  return Math.max(
                    0,
                    Number(
                      x[field] || 0,
                    ),
                  );
                }

                return x[field];
              }

              return old[field];
            },
          );

        const sets =
          d.fields
            .map(
              (field) =>
                `${field}=?`,
            )
            .join(",");

        await query(
          `
          UPDATE ${d.table}
          SET
            ${sets},
            updated_at=NOW()
          WHERE id=?
          `,
          [
            ...values,
            id,
          ],
        );

        const updated = (
          await query(
            `
            SELECT *
            FROM ${d.table}
            WHERE id=?
            LIMIT 1
            `,
            [id],
          )
        )[0];

        return ok(res, {
          success: true,
          message: `${kind} updated successfully.`,
          data: updated,
        });
      } catch (error) {
        console.error(
          `${kind} UPDATE ERROR:`,
          error,
        );

        return fail(
          res,
          error?.message ||
            `Unable to update ${kind}.`,
          500,
        );
      }
    },

    /*
    |--------------------------------------------------------------------------
    | DELETE
    |--------------------------------------------------------------------------
    */

    destroy: async (
      req,
      res,
    ) => {
      try {
        const id = Number(
          req.params.id,
        );

        const old = (
          await query(
            `
            SELECT *
            FROM ${d.table}
            WHERE id=?
            LIMIT 1
            `,
            [id],
          )
        )[0];

        if (!old) {
          return fail(
            res,
            `${kind} not found.`,
            404,
          );
        }

        await query(
          `
          DELETE FROM ${d.table}
          WHERE id=?
          `,
          [id],
        );

        return ok(res, {
          success: true,
          message: `${kind} deleted successfully.`,
        });
      } catch (error) {
        console.error(
          `${kind} DELETE ERROR:`,
          error,
        );

        return fail(
          res,
          error?.message ||
            `Unable to delete ${kind}.`,
          500,
        );
      }
    },
  };
}

/*
|--------------------------------------------------------------------------
| CATEGORY TREE
|--------------------------------------------------------------------------
|
| Storefront categories
|--------------------------------------------------------------------------
*/

export async function categoryList(
  req,
  res,
) {
  try {
    const rows = await query(
      `
      SELECT *
      FROM categories
      WHERE status='active'
      ORDER BY
        sort_order ASC,
        name ASC
      `,
    );

    const map = new Map();

    for (const row of rows) {
      map.set(
        Number(row.id),
        {
          ...row,
          id: Number(row.id),

          parent_id:
            row.parent_id === null
              ? null
              : Number(
                  row.parent_id,
                ),

          children: [],

          image_url: row.image
            ? imageUrl(
                row.image,
              )
            : null,
        },
      );
    }

    const roots = [];

    for (const category of map.values()) {
      if (
        category.parent_id &&
        map.has(
          category.parent_id,
        )
      ) {
        map
          .get(
            category.parent_id,
          )
          .children.push(
            category,
          );
      } else {
        roots.push(category);
      }
    }

    return ok(res, {
      success: true,
      data: roots,
    });
  } catch (error) {
    console.error(
      "CATEGORY LIST ERROR:",
      error,
    );

    return fail(
      res,
      "Unable to load category tree.",
      500,
    );
  }
}

/*
|--------------------------------------------------------------------------
| CATEGORY INDEX
|--------------------------------------------------------------------------
|
| Admin category listing
|--------------------------------------------------------------------------
*/

export async function categoryIndex(
  req,
  res,
) {
  try {
    const rows = await query(
      `
      SELECT
        c.*,

        p.name AS parent_name,

        (
          SELECT COUNT(*)
          FROM categories child
          WHERE child.parent_id=c.id
        ) AS children_count

      FROM categories c

      LEFT JOIN categories p
        ON p.id=c.parent_id

      ORDER BY
        c.sort_order ASC,
        c.id DESC
      `,
    );

    return ok(res, {
      success: true,
      data: rows.map(
        categoryResponse,
      ),
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
| CATEGORY SHOW
|--------------------------------------------------------------------------
*/

export async function categoryShow(
  req,
  res,
) {
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

    const row = (
      await query(
        `
        SELECT
          c.*,
          p.name AS parent_name,

          (
            SELECT COUNT(*)
            FROM categories child
            WHERE child.parent_id=c.id
          ) AS children_count

        FROM categories c

        LEFT JOIN categories p
          ON p.id=c.parent_id

        WHERE c.id=?
        LIMIT 1
        `,
        [id],
      )
    )[0];

    if (!row) {
      return fail(
        res,
        "Category not found.",
        404,
      );
    }

    return ok(res, {
      success: true,
      data: categoryResponse(
        row,
      ),
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
| CATEGORY STORE
|--------------------------------------------------------------------------
*/

export async function categoryStore(
  req,
  res,
) {
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

    const parentId =
      normalizeParentId(
        x.parent_id,
      );

    /*
    |--------------------------------------------------------------------------
    | Parent validation
    |--------------------------------------------------------------------------
    */

    if (parentId) {
      const parent = (
        await query(
          `
          SELECT id
          FROM categories
          WHERE id=?
          LIMIT 1
          `,
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

    const slug =
      await uniqueSlug(
        name,
        "categories",
      );

    /*
    |--------------------------------------------------------------------------
    | Image
    |--------------------------------------------------------------------------
    */

    const image = req.file
      ? `categories/${req.file.filename}`
      : null;

    /*
    |--------------------------------------------------------------------------
    | Insert
    |--------------------------------------------------------------------------
    */

    const result =
      await query(
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
            ? String(
                x.description,
              ).trim()
            : null,

          image,

          x.status ===
          "inactive"
            ? "inactive"
            : "active",

          Math.max(
            0,
            Number(
              x.sort_order || 0,
            ),
          ),

          parentId,
        ],
      );

    const created = (
      await query(
        `
        SELECT
          c.*,
          p.name AS parent_name,

          (
            SELECT COUNT(*)
            FROM categories child
            WHERE child.parent_id=c.id
          ) AS children_count

        FROM categories c

        LEFT JOIN categories p
          ON p.id=c.parent_id

        WHERE c.id=?
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
        data: categoryResponse(
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
| CATEGORY UPDATE
|--------------------------------------------------------------------------
*/

export async function categoryUpdate(
  req,
  res,
) {
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

    const old = (
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

    if (!old) {
      return fail(
        res,
        "Category not found.",
        404,
      );
    }

    const x = req.body || {};

    /*
    |--------------------------------------------------------------------------
    | Name
    |--------------------------------------------------------------------------
    */

    const name =
      x.name !== undefined
        ? String(x.name).trim()
        : old.name;

    if (!name) {
      return fail(
        res,
        "Category name is required.",
        422,
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Parent
    |--------------------------------------------------------------------------
    */

    const parentId =
      normalizeParentId(
        x.parent_id,
      );

    /*
    |--------------------------------------------------------------------------
    | Cannot become itself
    |--------------------------------------------------------------------------
    */

    if (
      parentId &&
      Number(parentId) === id
    ) {
      return fail(
        res,
        "A category cannot be its own parent.",
        422,
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Parent must exist
    |--------------------------------------------------------------------------
    */

    if (parentId) {
      const parent = (
        await query(
          `
          SELECT id
          FROM categories
          WHERE id=?
          LIMIT 1
          `,
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
      | Circular tree protection
      |--------------------------------------------------------------------------
      */

      const circular =
        await createsCircularTree(
          id,
          parentId,
        );

      if (circular) {
        return fail(
          res,
          "A category cannot be placed inside itself or its own child category.",
          422,
        );
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Slug
    |--------------------------------------------------------------------------
    */

    let slug = old.slug;

    if (name !== old.name) {
      slug =
        await uniqueSlug(
          name,
          "categories",
          id,
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Description
    |--------------------------------------------------------------------------
    */

    const description =
      x.description !==
      undefined
        ? String(
            x.description || "",
          ).trim() || null
        : old.description;

    /*
    |--------------------------------------------------------------------------
    | Status
    |--------------------------------------------------------------------------
    */

    const status =
      x.status === "inactive"
        ? "inactive"
        : x.status === "active"
          ? "active"
          : old.status;

    /*
    |--------------------------------------------------------------------------
    | Sort order
    |--------------------------------------------------------------------------
    */

    const sortOrder =
      x.sort_order !==
      undefined
        ? Math.max(
            0,
            Number(
              x.sort_order || 0,
            ),
          )
        : Number(
            old.sort_order || 0,
          );

    /*
    |--------------------------------------------------------------------------
    | Image
    |--------------------------------------------------------------------------
    |
    | If new file exists:
    |     replace image
    |
    | If no new file:
    |     keep old image
    |
    */

    let image =
      old.image || null;

    if (req.file) {
      image =
        `categories/${req.file.filename}`;
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE
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
        description,
        image,
        status,
        sortOrder,
        parentId,
        id,
      ],
    );

    /*
    |--------------------------------------------------------------------------
    | Return updated category
    |--------------------------------------------------------------------------
    */

    const updated = (
      await query(
        `
        SELECT
          c.*,
          p.name AS parent_name,

          (
            SELECT COUNT(*)
            FROM categories child
            WHERE child.parent_id=c.id
          ) AS children_count

        FROM categories c

        LEFT JOIN categories p
          ON p.id=c.parent_id

        WHERE c.id=?
        LIMIT 1
        `,
        [id],
      )
    )[0];

    return ok(res, {
      success: true,
      message:
        "Category updated successfully.",
      data: categoryResponse(
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
| CATEGORY DELETE
|--------------------------------------------------------------------------
*/

export async function categoryDestroy(
  req,
  res,
) {
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
        `
        SELECT *
        FROM categories
        WHERE id=?
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

    /*
    |--------------------------------------------------------------------------
    | Move children to top level
    |--------------------------------------------------------------------------
    */

    await query(
      `
      UPDATE categories
      SET
        parent_id=NULL,
        updated_at=NOW()
      WHERE parent_id=?
      `,
      [id],
    );

    /*
    |--------------------------------------------------------------------------
    | Delete
    |--------------------------------------------------------------------------
    */

    await query(
      `
      DELETE FROM categories
      WHERE id=?
      `,
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