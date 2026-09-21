import { customerApiFetch } from "@/lib/customerApi";
import { API_ROUTES } from "@/lib/routes";
import type { CartData } from "@/types/ecommerce";
import { readApiJson } from "@/lib/http";

export async function getCart(): Promise<CartData> {
  const json = await readApiJson<{ data: CartData }>(await customerApiFetch(API_ROUTES.customer.cart));
  return json.data;
}

export async function addCartItem(payload: {
  product_variant_id?: number;
  product_id?: number;
  design_option_id?: number | null;
  quantity?: number;
}): Promise<CartData> {
  const json = await readApiJson<{ data: CartData }>(
    await customerApiFetch(API_ROUTES.customer.cartItems, {
      method: "POST",
      body: JSON.stringify({ ...payload, quantity: payload.quantity ?? 1 }),
    }),
  );
  return json.data;
}

export async function updateCartItem(itemId: number, quantity: number): Promise<CartData> {
  const json = await readApiJson<{ data: CartData }>(
    await customerApiFetch(`${API_ROUTES.customer.cartItems}/${itemId}`, {
      method: "PUT",
      body: JSON.stringify({ quantity }),
    }),
  );
  return json.data;
}

export async function removeCartItem(itemId: number): Promise<CartData> {
  const json = await readApiJson<{ data: CartData }>(
    await customerApiFetch(`${API_ROUTES.customer.cartItems}/${itemId}`, { method: "DELETE" }),
  );
  return json.data;
}

export async function clearCart(): Promise<CartData> {
  const json = await readApiJson<{ data: CartData }>(
    await customerApiFetch(API_ROUTES.customer.cart, { method: "DELETE" }),
  );
  return json.data;
}
