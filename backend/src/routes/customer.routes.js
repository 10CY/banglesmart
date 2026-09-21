import { Router } from "express";

import * as auth from "../controllers/customer/auth.controller.js";
import * as profile from "../controllers/customer/profile.controller.js";
import * as address from "../controllers/customer/address.controller.js";
import * as cart from "../controllers/customer/cart.controller.js";
import * as wishlist from "../controllers/customer/wishlist.controller.js";
import * as order from "../controllers/customer/order.controller.js";
import * as coupon from "../controllers/customer/coupon.controller.js";
import * as shipping from "../controllers/customer/shipping.controller.js";
import * as review from "../controllers/customer/review.controller.js";
import {
  createPaymentOrder,
  verifyPayment,
} from "../controllers/customer/razorpay.controller.js";

import {
  auth as guard,
} from "../middleware/auth.js";

import {
  download as downloadInvoice,
} from "../controllers/customer/invoice.controller.js";

import * as notification from "../controllers/customer/notification.controller.js";
import * as password from "../controllers/customer/password.controller.js";
import * as returns from "../controllers/customer/return.controller.js";

const r = Router();

/* ==========================================================================
   PUBLIC
   ========================================================================== */

r.post(
  "/register",
  auth.register,
);

r.post(
  "/login",
  auth.login,
);

/*
|--------------------------------------------------------------------------
| NEW MSG91 WIDGET LOGIN
|--------------------------------------------------------------------------
|
| MUST be before guard("customer")
|
|--------------------------------------------------------------------------
*/

r.post(
  "/auth/phone/msg91-login",
  auth.msg91Login,
);

/*
|--------------------------------------------------------------------------
| Legacy Routes
|--------------------------------------------------------------------------
*/

r.post(
  "/auth/phone/request-otp",
  auth.requestOtp,
);

r.post(
  "/auth/phone/verify-otp",
  auth.verifyOtp,
);

r.post(
  "/forgot-password",
  password.forgot,
);

r.post(
  "/reset-password",
  password.reset,
);

/* ==========================================================================
   AUTHENTICATED CUSTOMER
   ========================================================================== */

r.use(
  guard("customer"),
);

r.get(
  "/me",
  auth.me,
);

r.post(
  "/logout",
  auth.logout,
);

/* ==========================================================================
   PROFILE
   ========================================================================== */

r.get(
  "/profile",
  profile.show,
);

r.put(
  "/profile",
  profile.update,
);

r.put(
  "/profile/password",
  profile.changePassword,
);

/* ==========================================================================
   ADDRESSES
   ========================================================================== */

r.get(
  "/addresses",
  address.index,
);

r.post(
  "/addresses",
  address.store,
);

r.get(
  "/addresses/:id",
  address.show,
);

r.put(
  "/addresses/:id",
  address.update,
);

r.delete(
  "/addresses/:id",
  address.destroy,
);

r.put(
  "/addresses/:id/default",
  address.setDefault,
);

/* ==========================================================================
   CART
   ========================================================================== */

r.get(
  "/cart",
  cart.index,
);

r.post(
  "/cart/items",
  cart.store,
);

r.put(
  "/cart/items/:id",
  cart.update,
);

r.delete(
  "/cart/items/:id",
  cart.destroy,
);

r.delete(
  "/cart",
  cart.clear,
);

/* ==========================================================================
   ORDERS
   ========================================================================== */

r.get(
  "/orders",
  order.index,
);

r.post(
  "/orders",
  order.store,
);

r.get(
  "/orders/:id",
  order.show,
);

r.post(
  "/orders/:id/cancel",
  order.cancel,
);

r.post(
  "/orders/:id/reorder",
  order.reorder,
);

/* ==========================================================================
   RETURNS
   ========================================================================== */

r.get(
  "/returns",
  returns.index,
);

r.post(
  "/returns",
  returns.store,
);

r.get(
  "/returns/:id",
  returns.show,
);

/* ==========================================================================
   NOTIFICATIONS
   ========================================================================== */

r.get(
  "/notifications",
  notification.index,
);

r.put(
  "/notifications/:id/read",
  notification.read,
);

r.put(
  "/notifications/read-all",
  notification.readAll,
);

/* ==========================================================================
   WISHLIST
   ========================================================================== */

r.get(
  "/wishlist",
  wishlist.index,
);

r.post(
  "/wishlist",
  wishlist.store,
);

r.get(
  "/wishlist/check/:product",
  wishlist.check,
);

r.delete(
  "/wishlist/:id",
  wishlist.destroy,
);

/* ==========================================================================
   COUPONS
   ========================================================================== */

r.post(
  "/coupons/validate",
  coupon.validateCoupon,
);

/* ==========================================================================
   SHIPPING
   ========================================================================== */

r.get(
  "/shipping/quote",
  shipping.quote,
);

/* ==========================================================================
   REVIEWS
   ========================================================================== */

r.post(
  "/products/:product/reviews",
  review.store,
);

r.get(
  "/products/:product/reviews/mine",
  review.mine,
);

/* ==========================================================================
   INVOICE
   ========================================================================== */

r.get(
  "/orders/:id/invoice",
  downloadInvoice,
);

r.post(
  "/payments/razorpay/order",
  createPaymentOrder,
);

r.post(
  "/payments/razorpay/verify",
  verifyPayment,
);

export default r;