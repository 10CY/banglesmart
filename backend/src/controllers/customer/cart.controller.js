import { ok, fail } from "../../utils/http.js";
import {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "../../services/cart.service.js";

function handleError(res, error, fallback) {
  console.error(fallback, error);
  return fail(res, error?.message || fallback, error?.status || 500);
}

export async function index(req, res) {
  try {
    return ok(res, { success: true, data: await getCart(req.user.id) });
  } catch (error) {
    return handleError(res, error, "Unable to load cart.");
  }
}

export async function store(req, res) {
  try {
    const data = await addCartItem(req.user.id, req.body || {});
    return ok(res, { success: true, message: "Added to cart.", data }, 201);
  } catch (error) {
    return handleError(res, error, "Unable to add product to cart.");
  }
}

export async function update(req, res) {
  try {
    const data = await updateCartItem(req.user.id, req.params.id, req.body?.quantity);
    return ok(res, { success: true, data });
  } catch (error) {
    return handleError(res, error, "Unable to update cart.");
  }
}

export async function destroy(req, res) {
  try {
    const data = await removeCartItem(req.user.id, req.params.id);
    return ok(res, { success: true, data });
  } catch (error) {
    return handleError(res, error, "Unable to remove cart item.");
  }
}

export async function clear(req, res) {
  try {
    const data = await clearCart(req.user.id);
    return ok(res, { success: true, data });
  } catch (error) {
    return handleError(res, error, "Unable to clear cart.");
  }
}
