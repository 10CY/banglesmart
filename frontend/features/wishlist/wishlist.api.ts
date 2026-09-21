import { customerApiFetch } from "@/lib/customerApi";
import { API_ROUTES } from "@/lib/routes";
import type { WishlistData } from "@/types/ecommerce";
import { readApiJson } from "@/lib/http";

export async function getWishlist(): Promise<WishlistData> {
  const json = await readApiJson<{ data: WishlistData }>(await customerApiFetch(API_ROUTES.customer.wishlist));
  return json.data;
}

export async function checkWishlist(productId: number) {
  const json = await readApiJson<{
    data: { wishlisted: boolean; wishlist_item_id: number | null };
  }>(
    await customerApiFetch(`${API_ROUTES.customer.wishlist}/check/${productId}`),
  );
  return json.data;
}

export async function addWishlistItem(productId: number): Promise<WishlistData> {
  const json = await readApiJson<{ data: WishlistData }>(
    await customerApiFetch(API_ROUTES.customer.wishlist, {
      method: "POST",
      body: JSON.stringify({ product_id: productId }),
    }),
  );
  return json.data;
}

export async function removeWishlistItem(itemId: number): Promise<WishlistData> {
  const json = await readApiJson<{ data: WishlistData }>(
    await customerApiFetch(`${API_ROUTES.customer.wishlist}/${itemId}`, { method: "DELETE" }),
  );
  return json.data;
}
