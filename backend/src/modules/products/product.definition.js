/**
 * Single source of truth for fields persisted on the products table.
 * Controllers/services should import this instead of maintaining their own list.
 */
export const PRODUCT_FIELDS = Object.freeze([
  "category_id",
  "material_id",
  "name",
  "sku",
  "short_description",
  "description",
  "mrp",
  "selling_price",
  "set_quantity",
  "featured",
  "best_seller",
  "new_arrival",
  "status",
  "seo_title",
  "seo_description",
]);

export const PRODUCT_BOOLEAN_FIELDS = new Set([
  "featured",
  "best_seller",
  "new_arrival",
]);

export function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function toBool(value) {
  return value === true || value === 1 || value === "1" || value === "true";
}

export function nullableString(value) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text === "" ? null : text;
}

export function buildProductValues(input = {}) {
  return PRODUCT_FIELDS.map((field) => {
    if (PRODUCT_BOOLEAN_FIELDS.has(field)) return toBool(input[field]) ? 1 : 0;

    if (field === "mrp" || field === "selling_price") {
      return toNumber(input[field], 0);
    }

    if (field === "set_quantity") return Math.max(1, toNumber(input[field], 1));

    if (field === "status") return nullableString(input[field]) || "active";

    if (field === "category_id" || field === "material_id") {
      if (input[field] === undefined || input[field] === null || input[field] === "") {
        return null;
      }
      const id = Number(input[field]);
      return Number.isInteger(id) && id > 0 ? id : null;
    }

    return nullableString(input[field]);
  });
}
