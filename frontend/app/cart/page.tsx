"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

import {
  customerApiFetch,
} from "@/lib/customerApi";

import {
  BACKEND_URL,
} from "@/lib/api";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type ProductImage = {
  id: number;
  image: string;
};

type Product = {
  id: number;
  name: string;
  slug: string;
  primary_image:
    | ProductImage
    | null;
};

type Size = {
  id: number;
  name: string;
  display_name:
    | string
    | null;
};

type Color = {
  id: number;
  name: string;
  display_name:
    | string
    | null;
  hex_code:
    | string
    | null;
};

type CartVariant = {
  id: number;
  sku: string;
  mrp: number;
  selling_price: number;
  status: string;
  available_quantity: number;

  product: Product;
  size: Size;
  color: Color;
};

type CartItem = {
  id: number;
  quantity: number;
  line_total: number;
  variant: CartVariant;
};

type Cart = {
  id: number;
  items: CartItem[];
  item_count: number;
  subtotal: number;
};

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function CartPage() {
  const router =
    useRouter();

  const [
    cart,
    setCart,
  ] = useState<Cart | null>(
    null
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    updatingId,
    setUpdatingId,
  ] = useState<number | null>(
    null
  );

  const [
    error,
    setError,
  ] = useState("");

  /* ------------------------------------------------------------------------ */
  /* Load Cart                                                                */
  /* ------------------------------------------------------------------------ */

  const loadCart =
    useCallback(async () => {
      const token =
        localStorage.getItem(
          "customer_token"
        );

      if (!token) {
        router.replace(
          "/login"
        );

        return;
      }

      try {
        setLoading(true);
        setError("");

        const response =
          await customerApiFetch(
            "/customer/cart"
          );

        const data =
          await response.json();

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          localStorage.removeItem(
            "customer_token"
          );

          localStorage.removeItem(
            "customer_user"
          );

          router.replace(
            "/login"
          );

          return;
        }

        if (!response.ok) {
          setError(
            data.message ||
              "Unable to load cart."
          );

          return;
        }

        setCart(
          data.data
        );
      } catch {
        setError(
          "Unable to connect to server."
        );
      } finally {
        setLoading(false);
      }
    }, [router]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  /* ------------------------------------------------------------------------ */
  /* Update Quantity                                                          */
  /* ------------------------------------------------------------------------ */

  async function updateQuantity(
    item: CartItem,
    quantity: number
  ) {
    if (quantity < 1) {
      return;
    }

    if (
      quantity >
      item.variant
        .available_quantity
    ) {
      window.alert(
        `Only ${item.variant.available_quantity} item(s) available.`
      );

      return;
    }

    try {
      setUpdatingId(
        item.id
      );

      const response =
        await customerApiFetch(
          `/customer/cart/items/${item.id}`,
          {
            method: "PUT",

            body: JSON.stringify({
              quantity,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        window.alert(
          data.message ||
            "Unable to update quantity."
        );

        return;
      }

      setCart(
        data.data
      );
      window.dispatchEvent(new Event("banglesmart:customer-refresh"));
    } catch {
      window.alert(
        "Unable to connect to server."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Remove                                                                   */
  /* ------------------------------------------------------------------------ */

  async function removeItem(
    itemId: number
  ) {
    if (
      !window.confirm(
        "Remove this item from cart?"
      )
    ) {
      return;
    }

    try {
      setUpdatingId(
        itemId
      );

      const response =
        await customerApiFetch(
          `/customer/cart/items/${itemId}`,
          {
            method: "DELETE",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        window.alert(
          data.message ||
            "Unable to remove item."
        );

        return;
      }

      setCart(
        data.data
      );
      window.dispatchEvent(new Event("banglesmart:customer-refresh"));
    } catch {
      window.alert(
        "Unable to connect to server."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Clear                                                                    */
  /* ------------------------------------------------------------------------ */

  async function clearCart() {
    if (
      !window.confirm(
        "Clear your entire cart?"
      )
    ) {
      return;
    }

    try {
      const response =
        await customerApiFetch(
          "/customer/cart",
          {
            method: "DELETE",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        window.alert(
          data.message ||
            "Unable to clear cart."
        );

        return;
      }

      setCart(
        data.data
      );
      window.dispatchEvent(new Event("banglesmart:customer-refresh"));
    } catch {
      window.alert(
        "Unable to connect to server."
      );
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Price                                                                    */
  /* ------------------------------------------------------------------------ */

  function formatPrice(
    amount: number
  ) {
    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }
    ).format(amount);
  }

  /* ------------------------------------------------------------------------ */
  /* Loading                                                                  */
  /* ------------------------------------------------------------------------ */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">

        <p className="text-sm text-gray-500">
          Loading cart...
        </p>

      </main>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* UI                                                                       */
  /* ------------------------------------------------------------------------ */

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">

      <div className="mx-auto max-w-6xl">

        {/* Header */}

        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">

          <div className="flex items-center gap-4">

            <Link
              href="/"
              className="rounded-lg border border-gray-200 bg-white p-2 text-gray-700 transition hover:bg-gray-100"
            >
              <ArrowLeft
                size={19}
              />
            </Link>

            <div>

              <h1 className="text-3xl font-semibold text-gray-900">
                Shopping Cart
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                {cart?.item_count || 0}{" "}
                item(s) in your cart.
              </p>

            </div>

          </div>

          {cart &&
            cart.items.length > 0 && (

            <button
              type="button"
              onClick={clearCart}
              className="text-sm font-medium text-red-600 hover:text-red-700"
            >
              Clear Cart
            </button>

          )}

        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!cart ||
        cart.items.length === 0 ? (

          /* Empty */

          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center">

            <ShoppingBag
              size={44}
              className="mx-auto text-gray-300"
            />

            <h2 className="mt-5 text-xl font-semibold text-gray-900">
              Your cart is empty
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Add some beautiful
              bangles to your cart.
            </p>

            <Link
              href="/shop"
              className="mt-6 inline-flex rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-black"
            >
              Continue Shopping
            </Link>

          </div>

        ) : (

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">

            {/* Items */}

            <div className="space-y-4">

              {cart.items.map(
                (item) => {

                  const product =
                    item.variant
                      .product;

                  const size =
                    item.variant
                      .size;

                  const color =
                    item.variant
                      .color;

                  const image =
                    product
                      ?.primary_image
                      ?.image;

                  const disabled =
                    updatingId ===
                    item.id;

                  return (

                    <div
                      key={item.id}
                      className="rounded-xl border border-gray-200 bg-white p-5"
                    >

                      <div className="flex gap-5">

                        {/* Image */}

                        <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50">

                          {image ? (

                            <img
                              src={`${BACKEND_URL}/storage/${image}`}
                              alt={
                                product.name
                              }
                              className="h-full w-full object-cover"
                            />

                          ) : (

                            <ShoppingBag
                              size={30}
                              className="text-gray-300"
                            />

                          )}

                        </div>

                        {/* Details */}

                        <div className="min-w-0 flex-1">

                          <div className="flex items-start justify-between gap-4">

                            <div>

                              <h2 className="font-semibold text-gray-900">
                                {
                                  product.name
                                }
                              </h2>

                              <p className="mt-1 font-mono text-xs text-gray-400">
                                {
                                  item.variant
                                    .sku
                                }
                              </p>

                            </div>

                            <button
                              type="button"
                              disabled={disabled}
                              onClick={() =>
                                removeItem(
                                  item.id
                                )
                              }
                              className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                            >
                              <Trash2
                                size={18}
                              />
                            </button>

                          </div>

                          {/* Variant */}

                          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-600">

                            <span>
                              Size:{" "}
                              <strong className="font-medium text-gray-900">
                                {size
                                  ?.display_name ||
                                  size?.name}
                              </strong>
                            </span>

                            <span className="text-gray-300">
                              |
                            </span>

                            <div className="flex items-center gap-1.5">

                              <span>
                                Color:
                              </span>

                              <span
                                className="h-4 w-4 rounded-full border border-gray-300"
                                style={{
                                  backgroundColor:
                                    color
                                      ?.hex_code ||
                                    "#ffffff",
                                }}
                              />

                              <strong className="font-medium text-gray-900">
                                {color
                                  ?.display_name ||
                                  color?.name}
                              </strong>

                            </div>

                          </div>

                          {/* Price */}

                          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">

                            <div>

                              <span className="text-lg font-semibold text-gray-900">
                                {formatPrice(
                                  item.variant
                                    .selling_price
                                )}
                              </span>

                              {item.variant
                                .mrp >
                                item.variant
                                  .selling_price && (

                                <span className="ml-2 text-sm text-gray-400 line-through">
                                  {formatPrice(
                                    item.variant
                                      .mrp
                                  )}
                                </span>

                              )}

                            </div>

                            {/* Quantity */}

                            <div className="flex items-center rounded-lg border border-gray-300">

                              <button
                                type="button"
                                disabled={
                                  disabled ||
                                  item.quantity <=
                                    1
                                }
                                onClick={() =>
                                  updateQuantity(
                                    item,
                                    item.quantity -
                                      1
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center text-gray-600 transition hover:bg-gray-50 disabled:opacity-30"
                              >
                                <Minus
                                  size={15}
                                />
                              </button>

                              <span className="min-w-10 text-center text-sm font-medium text-gray-900">
                                {
                                  item.quantity
                                }
                              </span>

                              <button
                                type="button"
                                disabled={
                                  disabled ||
                                  item.quantity >=
                                    item.variant
                                      .available_quantity
                                }
                                onClick={() =>
                                  updateQuantity(
                                    item,
                                    item.quantity +
                                      1
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center text-gray-600 transition hover:bg-gray-50 disabled:opacity-30"
                              >
                                <Plus
                                  size={15}
                                />
                              </button>

                            </div>

                          </div>

                          <div className="mt-3 flex items-center justify-between">

                            <p className="text-xs text-gray-400">
                              {
                                item.variant
                                  .available_quantity
                              }{" "}
                              available
                            </p>

                            <p className="text-sm font-semibold text-gray-900">
                              Total:{" "}
                              {formatPrice(
                                item.line_total
                              )}
                            </p>

                          </div>

                        </div>

                      </div>

                    </div>

                  );

                }
              )}

            </div>

            {/* Order Summary */}

            <aside className="h-fit rounded-xl border border-gray-200 bg-white p-6">

              <h2 className="text-lg font-semibold text-gray-900">
                Order Summary
              </h2>

              <div className="mt-6 space-y-4">

                <div className="flex items-center justify-between text-sm">

                  <span className="text-gray-500">
                    Items
                  </span>

                  <span className="font-medium text-gray-900">
                    {
                      cart.item_count
                    }
                  </span>

                </div>

                <div className="flex items-center justify-between text-sm">

                  <span className="text-gray-500">
                    Subtotal
                  </span>

                  <span className="font-medium text-gray-900">
                    {formatPrice(
                      cart.subtotal
                    )}
                  </span>

                </div>

                <div className="flex items-center justify-between text-sm">

                  <span className="text-gray-500">
                    Shipping
                  </span>

                  <span className="font-medium text-gray-500">
                    Calculated at checkout
                  </span>

                </div>

              </div>

              <div className="my-5 border-t border-gray-200" />

              <div className="flex items-center justify-between">

                <span className="font-semibold text-gray-900">
                  Total
                </span>

                <span className="text-xl font-semibold text-gray-900">
                  {formatPrice(
                    cart.subtotal
                  )}
                </span>

              </div>

              <Link
                href="/checkout"
                className="mt-6 block w-full rounded-lg bg-gray-900 px-5 py-3 text-center text-sm font-medium text-white transition hover:bg-black"
              >
                Proceed to Checkout
              </Link>

              <Link
                href="/shop"
                className="mt-3 block text-center text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Continue Shopping
              </Link>

            </aside>

          </div>

        )}

      </div>

    </main>
  );
}