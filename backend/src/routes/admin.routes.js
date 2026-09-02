import { Router } from "express";

import * as auth from "../controllers/admin/auth.controller.js";
import * as cat from "../controllers/admin/basic.controller.js";
import * as prod from "../controllers/admin/product.controller.js";
import * as cust from "../controllers/admin/customer.controller.js";
import * as ord from "../controllers/admin/order.controller.js";
import * as inv from "../controllers/admin/inventory.controller.js";
import * as variant from "../controllers/admin/variant.controller.js";
import * as review from "../controllers/admin/review.controller.js";
import * as coupon from "../controllers/admin/coupon.controller.js";
import * as ship from "../controllers/admin/shipping.controller.js";
import * as dash from "../controllers/admin/dashboard.controller.js";
import * as material from "../controllers/admin/material.controller.js";
import * as invoice from "../controllers/admin/invoice.controller.js";
import * as returns from "../controllers/admin/return.controller.js";
import * as newsletter from "../controllers/admin/newsletter.controller.js";
import * as audit from "../controllers/admin/audit.controller.js";

import { auth as guard } from "../middleware/auth.js";
import { imageUpload } from "../middleware/upload.js";

const r = Router();

/*
|--------------------------------------------------------------------------
| ADMIN AUTH
|--------------------------------------------------------------------------
*/

const A = guard("admin");

/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
|
| Login must remain outside the auth guard.
|
*/

r.post("/login", auth.login);

/*
|--------------------------------------------------------------------------
| ALL ROUTES BELOW REQUIRE ADMIN AUTH
|--------------------------------------------------------------------------
*/

r.use(A);

/*
|--------------------------------------------------------------------------
| AUTH / ACCOUNT
|--------------------------------------------------------------------------
*/

r.get("/me", auth.me);
r.post("/logout", auth.logout);

/*
|--------------------------------------------------------------------------
| DASHBOARD
|--------------------------------------------------------------------------
*/

r.get("/dashboard", dash.index);

/*
|--------------------------------------------------------------------------
| MATERIALS
|--------------------------------------------------------------------------
*/

r.get("/materials", material.index);
r.post("/materials", material.store);
r.put("/materials/:id", material.update);
r.delete("/materials/:id", material.destroy);

/*
|--------------------------------------------------------------------------
| CATEGORIES
|--------------------------------------------------------------------------
*/

/*
 * Get all categories
 */
r.get(
  "/categories",
  cat.categoryIndex,
);

r.get("/categories/:id", cat.categoryShow);

/*
 * Create category
 *
 * FormData field:
 * image
 */
r.post(
  "/categories",
  imageUpload("categories").single("image"),
  cat.categoryStore,
);

/*
 * Update category
 *
 * FormData field:
 * image
 *
 * IMPORTANT:
 * This is a real PUT request.
 * Do not use _method=PUT.
 */
r.put(
  "/categories/:id",
  imageUpload("categories").single("image"),
  cat.categoryUpdate,
);

/*
 * Delete category
 */
r.delete(
  "/categories/:id",
  cat.categoryDestroy,
);

/*
|--------------------------------------------------------------------------
| SIZES / COLORS
|--------------------------------------------------------------------------
*/

for (const [path, kind] of [
  ["sizes", "sizes"],
  ["colors", "colors"],
]) {
  const c = cat.makeBasic(kind);

  r.get(
    `/${path}`,
    c.index,
  );

  r.post(
    `/${path}`,
    c.store,
  );

  r.put(
    `/${path}/:id`,
    c.update,
  );

  r.delete(
    `/${path}/:id`,
    c.destroy,
  );
}

/*
|--------------------------------------------------------------------------
| PRODUCTS
|--------------------------------------------------------------------------
*/

r.get(
  "/products",
  prod.index,
);

r.post(
  "/products",
  prod.store,
);

r.get(
  "/products/:id",
  prod.show,
);

r.put(
  "/products/:id",
  prod.update,
);

r.delete(
  "/products/:id",
  prod.destroy,
);

/*
|--------------------------------------------------------------------------
| PRODUCT IMAGES
|--------------------------------------------------------------------------
*/

r.post(
  "/products/:id/images",
  imageUpload("products").single("image"),
  prod.images,
);

r.delete(
  "/product-images/:id",
  prod.deleteImage,
);

r.put(
  "/product-images/:id/primary",
  prod.primaryImage,
);

/*
|--------------------------------------------------------------------------
| PRODUCT VARIANTS
|--------------------------------------------------------------------------
*/

r.get(
  "/products/:product/variants",
  variant.index,
);

r.post(
  "/products/:product/variants",
  variant.store,
);

r.put(
  "/product-variants/:id",
  variant.update,
);

r.delete(
  "/product-variants/:id",
  variant.destroy,
);

/*
|--------------------------------------------------------------------------
| INVENTORY
|--------------------------------------------------------------------------
*/

r.get(
  "/inventory",
  inv.index,
);

r.put(
  "/inventory/:id",
  inv.update,
);

r.get(
  "/inventory-movements",
  inv.movements,
);

/*
|--------------------------------------------------------------------------
| CUSTOMERS
|--------------------------------------------------------------------------
*/

r.get(
  "/customers",
  cust.index,
);

r.get(
  "/customers/:id",
  cust.show,
);

r.put(
  "/customers/:id",
  cust.update,
);

r.put(
  "/customers/:id/status",
  cust.updateStatus,
);

/*
|--------------------------------------------------------------------------
| ORDERS
|--------------------------------------------------------------------------
*/

r.get(
  "/orders",
  ord.index,
);

r.get(
  "/orders/:id",
  ord.show,
);

r.put(
  "/orders/:id/status",
  ord.updateStatus,
);

r.put(
  "/orders/:id/shipping",
  ord.updateShipping,
);
r.put("/orders/:id/payment", ord.updatePaymentStatus);

r.get(
  "/orders/:id/invoice",
  invoice.download,
);

/*
|--------------------------------------------------------------------------
| REVIEWS
|--------------------------------------------------------------------------
*/

r.get(
  "/reviews",
  review.index,
);

r.put(
  "/reviews/:id",
  review.update,
);

r.delete(
  "/reviews/:id",
  review.destroy,
);

/* RETURNS */
r.get("/returns", returns.index);
r.get("/returns/:id", returns.show);
r.put("/returns/:id", returns.update);

/* NEWSLETTER */
r.get("/newsletter", newsletter.index);
r.delete("/newsletter/:id", newsletter.destroy);

/* AUDIT LOGS */
r.get("/audit-logs", audit.index);

/*
|--------------------------------------------------------------------------
| COUPONS
|--------------------------------------------------------------------------
*/

r.get(
  "/coupons",
  coupon.index,
);

r.post(
  "/coupons",
  coupon.store,
);

r.get(
  "/coupons/:id",
  coupon.show,
);

r.put(
  "/coupons/:id",
  coupon.update,
);

r.delete(
  "/coupons/:id",
  coupon.destroy,
);

/*
|--------------------------------------------------------------------------
| SHIPPING SETTINGS
|--------------------------------------------------------------------------
*/

r.get(
  "/shipping-settings",
  ship.show,
);

r.put(
  "/shipping-settings",
  ship.update,
);

export default r;