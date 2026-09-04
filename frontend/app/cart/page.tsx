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
  ShieldCheck,
  Truck,
  LockKeyhole,
  Sparkles,
  ChevronRight,
  X,
  AlertTriangle,
} from "lucide-react";

import { useRouter } from "next/navigation";

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
  primary_image: ProductImage | null;
};

type Size = {
  id: number;
  name: string;
  display_name: string | null;
};

type Color = {
  id: number;
  name: string;
  display_name: string | null;
  hex_code: string | null;
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

type ModalType =
  | "remove"
  | "clear"
  | null;

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function CartPage() {
  const router = useRouter();

  const [cart, setCart] =
    useState<Cart | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [updatingId, setUpdatingId] =
    useState<number | null>(null);

  const [error, setError] =
    useState("");

  /* ------------------------------------------------------------------------ */
  /* Premium Modal States                                                     */
  /* ------------------------------------------------------------------------ */

  const [modalType, setModalType] =
    useState<ModalType>(null);

  const [
    selectedItemId,
    setSelectedItemId,
  ] = useState<number | null>(null);

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
        router.replace("/login");
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

          router.replace("/login");

          return;
        }

        if (!response.ok) {
          setError(
            data.message ||
              "Unable to load cart."
          );

          return;
        }

        setCart(data.data);

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
  /* Modal Functions                                                          */
  /* ------------------------------------------------------------------------ */

  function openRemoveModal(
    itemId: number
  ) {
    setSelectedItemId(itemId);

    setModalType("remove");
  }

  function openClearModal() {
    setSelectedItemId(null);

    setModalType("clear");
  }

  function closeModal() {
    if (updatingId !== null) {
      return;
    }

    setModalType(null);

    setSelectedItemId(null);
  }

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
      item.variant.available_quantity
    ) {
      window.alert(
        `Only ${item.variant.available_quantity} item(s) available.`
      );

      return;
    }

    try {
      setUpdatingId(item.id);

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

      setCart(data.data);

      window.dispatchEvent(
        new Event(
          "banglesmart:customer-refresh"
        )
      );

    } catch {
      window.alert(
        "Unable to connect to server."
      );

    } finally {
      setUpdatingId(null);
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Remove Item                                                              */
  /* ------------------------------------------------------------------------ */

  async function removeItem(
    itemId: number
  ) {
    try {
      setUpdatingId(itemId);

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

      setCart(data.data);

      window.dispatchEvent(
        new Event(
          "banglesmart:customer-refresh"
        )
      );

      setModalType(null);
      setSelectedItemId(null);

    } catch {
      window.alert(
        "Unable to connect to server."
      );

    } finally {
      setUpdatingId(null);
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Clear Cart                                                               */
  /* ------------------------------------------------------------------------ */

  async function clearCart() {
    try {
      setUpdatingId(-1);

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

      setCart(data.data);

      window.dispatchEvent(
        new Event(
          "banglesmart:customer-refresh"
        )
      );

      setModalType(null);

    } catch {
      window.alert(
        "Unable to connect to server."
      );

    } finally {
      setUpdatingId(null);
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

  function getDiscount(
    mrp: number,
    sellingPrice: number
  ) {
    if (
      !mrp ||
      mrp <= sellingPrice
    ) {
      return 0;
    }

    return Math.round(
      (
        (mrp - sellingPrice) /
        mrp
      ) * 100
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Image URL                                                                */
  /* ------------------------------------------------------------------------ */

  function getImageUrl(
    image?: string | null
  ) {
    if (!image) {
      return null;
    }

    if (
      image.startsWith("http://") ||
      image.startsWith("https://")
    ) {
      return image;
    }

    return `${BACKEND_URL}/storage/${image.replace(
      /^\/+/,
      ""
    )}`;
  }

  /* ------------------------------------------------------------------------ */
  /* Loading                                                                  */
  /* ------------------------------------------------------------------------ */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#faf7f5] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

        <div className="mx-auto max-w-7xl">

          <div className="mb-6 h-20 animate-pulse rounded-2xl bg-white sm:mb-8" />

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">

            <div className="space-y-4 sm:space-y-5">

              {[1, 2].map(
                (item) => (
                  <div
                    key={item}
                    className="flex flex-col gap-4 rounded-2xl border border-[#eadfda] bg-white p-4 sm:flex-row sm:p-5"
                  >

                    <div className="h-48 w-full animate-pulse rounded-xl bg-[#f1ebe8] sm:h-36 sm:w-36" />

                    <div className="flex-1 space-y-4">

                      <div className="h-5 w-2/3 animate-pulse rounded bg-gray-200" />

                      <div className="h-4 w-1/3 animate-pulse rounded bg-gray-100" />

                      <div className="h-8 w-32 animate-pulse rounded bg-gray-200" />

                    </div>

                  </div>
                )
              )}

            </div>

            <div className="h-80 animate-pulse rounded-2xl bg-white" />

          </div>

        </div>

      </main>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* UI                                                                       */
  /* ------------------------------------------------------------------------ */

  return (
    <main className="min-h-screen bg-[#faf7f5] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

      <div className="mx-auto max-w-7xl">

        {/* Header */}

        <div className="relative mb-6 overflow-hidden rounded-2xl border border-[#eadfda] bg-white shadow-sm sm:mb-8">

          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#fff1ed]" />

          <div className="absolute -bottom-16 right-24 h-40 w-40 rounded-full bg-[#fff8e8]" />

          <div className="relative flex flex-col gap-5 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-6">

            <div className="flex items-center gap-3 sm:gap-4">

              <Link
                href="/"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#eadfda] bg-[#fffaf8] text-[#5c1527] transition hover:bg-[#5c1527] hover:text-white sm:h-11 sm:w-11"
              >
                <ArrowLeft size={19} />
              </Link>

              <div>

                <div className="flex items-center gap-2">

                  <Sparkles
                    size={14}
                    className="text-[#b68b3a]"
                  />

                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a07425] sm:text-xs sm:tracking-[0.22em]">
                    Your Selection
                  </span>

                </div>

                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#3b101b] sm:text-3xl">
                  Shopping Bag
                </h1>

                <p className="mt-1 text-xs text-gray-500 sm:text-sm">

                  {cart?.item_count || 0}{" "}

                  {cart?.item_count === 1
                    ? "beautiful item"
                    : "beautiful items"}{" "}

                  waiting for you

                </p>

              </div>

            </div>

            {cart &&
              cart.items.length > 0 && (

                <button
                  type="button"
                  onClick={openClearModal}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100 sm:w-auto"
                >

                  <Trash2 size={16} />

                  Clear Bag

                </button>

              )}

          </div>

        </div>

        {/* Error */}

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:mb-6 sm:px-5 sm:py-4">
            {error}
          </div>
        )}

        {/* Empty Cart */}

        {!cart ||
        cart.items.length === 0 ? (

          <div className="overflow-hidden rounded-3xl border border-[#eadfda] bg-white">

            <div className="px-5 py-14 text-center sm:px-6 sm:py-24">

              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#fff4f1] text-[#8f0828]">

                <ShoppingBag size={40} />

              </div>

              <div className="mt-7 flex items-center justify-center gap-2">

                <Sparkles
                  size={14}
                  className="text-[#b68b3a]"
                />

                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a07425] sm:text-xs sm:tracking-[0.25em]">
                  Your Bag Is Waiting
                </p>

              </div>

              <h2 className="mt-3 text-2xl font-semibold text-[#3b101b] sm:text-3xl">
                Your shopping bag is empty
              </h2>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-500">
                Discover beautiful bangles and add
                your favourites to your collection.
              </p>

              <Link
                href="/shop"
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#8f0828] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#8f0828]/20 transition hover:bg-[#6f061f] sm:mt-8 sm:px-7"
              >

                Explore Collection

                <ChevronRight size={17} />

              </Link>

            </div>

          </div>

        ) : (

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">

            {/* Cart Items */}

            <section className="space-y-4 sm:space-y-5">

              {cart.items.map(
                (item) => {
                  const product =
                    item.variant.product;

                  const size =
                    item.variant.size;

                  const color =
                    item.variant.color;

                  const image =
                    product?.primary_image
                      ?.image;

                  const disabled =
                    updatingId ===
                    item.id;

                  const discount =
                    getDiscount(
                      item.variant.mrp,
                      item.variant
                        .selling_price
                    );

                  const imageUrl =
                    getImageUrl(
                      image
                    );

                  return (

                    <article
                      key={item.id}
                      className="group relative overflow-hidden rounded-2xl border border-[#eadfda] bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md sm:p-5"
                    >

                      {discount > 0 && (

                        <div className="absolute right-0 top-0 z-10 rounded-bl-xl bg-[#8f0828] px-3 py-1.5 text-[10px] font-semibold text-white sm:text-xs">

                          {discount}% OFF

                        </div>

                      )}

                      <div className="flex flex-col gap-4 sm:flex-row sm:gap-5">

                        {/* Image */}

                        <Link
                          href={`/product/${product.slug}`}
                          className="relative flex h-52 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#fffaf8] sm:h-36 sm:w-36"
                        >

                          {imageUrl ? (

                            <img
                              src={imageUrl}
                              alt={product.name}
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                            />

                          ) : (

                            <ShoppingBag
                              size={34}
                              className="text-[#d8c5bf]"
                            />

                          )}

                        </Link>

                        {/* Details */}

                        <div className="min-w-0 flex flex-1 flex-col">

                          <div className="flex items-start justify-between gap-3">

                            <div className="min-w-0">

                              <Link
                                href={`/product/${product.slug}`}
                              >

                                <h2 className="line-clamp-2 pr-2 text-base font-semibold leading-6 text-[#351019] transition hover:text-[#8f0828] sm:text-lg">

                                  {product.name}

                                </h2>

                              </Link>

                              <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-gray-400 sm:text-[11px]">

                                SKU:{" "}

                                {
                                  item.variant
                                    .sku
                                }

                              </p>

                            </div>

                            {/* Remove */}

                            <button
                              type="button"
                              disabled={disabled}
                              onClick={() =>
                                openRemoveModal(
                                  item.id
                                )
                              }
                              aria-label="Remove item"
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#eadfda] bg-white text-[#8f0828] shadow-sm transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                            >

                              <Trash2 size={18} />

                            </button>

                          </div>

                          {/* Variant */}

                          <div className="mt-4 flex flex-wrap gap-2">

                            <div className="rounded-full bg-[#f8f5f3] px-3 py-1.5 text-xs text-gray-600">

                              Size:{" "}

                              <span className="font-semibold text-gray-900">

                                {
                                  size
                                    ?.display_name ||
                                  size
                                    ?.name
                                }

                              </span>

                            </div>

                            <div className="flex items-center gap-2 rounded-full bg-[#f8f5f3] px-3 py-1.5 text-xs text-gray-600">

                              <span
                                className="h-3.5 w-3.5 rounded-full border border-gray-300"
                                style={{
                                  backgroundColor:
                                    color
                                      ?.hex_code ||
                                    "#ffffff",
                                }}
                              />

                              <span className="font-semibold text-gray-900">

                                {
                                  color
                                    ?.display_name ||
                                  color
                                    ?.name
                                }

                              </span>

                            </div>

                          </div>

                          {/* Bottom */}

                          <div className="mt-5 flex flex-col gap-4 border-t border-[#f1e9e5] pt-4 sm:flex-row sm:items-end sm:justify-between">

                            {/* Price */}

                            <div>

                              <div className="flex flex-wrap items-center gap-2">

                                <span className="text-xl font-bold text-[#3b101b]">

                                  {
                                    formatPrice(
                                      item.variant
                                        .selling_price
                                    )
                                  }

                                </span>

                                {item.variant.mrp >
                                  item.variant
                                    .selling_price && (

                                    <span className="text-sm text-gray-400 line-through">

                                      {
                                        formatPrice(
                                          item.variant
                                            .mrp
                                        )
                                      }

                                    </span>

                                  )}

                              </div>

                              <p className="mt-1 text-xs text-gray-400">

                                Item total:{" "}

                                <span className="font-semibold text-gray-700">

                                  {
                                    formatPrice(
                                      item.line_total
                                    )
                                  }

                                </span>

                              </p>

                            </div>

                            {/* Quantity */}

                            <div>

                              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                                Quantity
                              </p>

                              <div className="flex items-center overflow-hidden rounded-xl border border-[#ded1cc] bg-white shadow-sm">

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
                                  className="flex h-10 w-10 items-center justify-center text-[#5c1527] transition hover:bg-[#fff4f1] disabled:cursor-not-allowed disabled:opacity-30"
                                >

                                  <Minus size={16} />

                                </button>

                                <span className="flex h-10 min-w-11 items-center justify-center border-x border-[#eadfda] text-sm font-semibold text-[#351019]">

                                  {item.quantity}

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
                                  className="flex h-10 w-10 items-center justify-center text-[#5c1527] transition hover:bg-[#fff4f1] disabled:cursor-not-allowed disabled:opacity-30"
                                >

                                  <Plus size={16} />

                                </button>

                              </div>

                            </div>

                          </div>

                          {/* Stock */}

                          <div className="mt-3 flex items-center gap-2 text-xs">

                            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />

                            <span className="text-gray-500">

                              {
                                item.variant
                                  .available_quantity
                              }{" "}

                              available

                            </span>

                          </div>

                        </div>

                      </div>

                    </article>

                  );
                }
              )}

              {/* Continue Shopping */}

              <Link
                href="/shop"
                className="inline-flex items-center gap-2 py-2 text-sm font-semibold text-[#8f0828] transition hover:gap-3"
              >

                <ArrowLeft size={16} />

                Continue Shopping

              </Link>

            </section>

            {/* Order Summary */}

            <aside className="lg:sticky lg:top-6 lg:h-fit">

              <div className="overflow-hidden rounded-2xl border border-[#eadfda] bg-white shadow-sm">

                {/* Summary Header */}

                <div className="border-b border-[#eadfda] bg-[#fffaf8] px-5 py-5 sm:px-6">

                  <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#8f0828] text-white">

                      <ShoppingBag size={18} />

                    </div>

                    <div>

                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a07425] sm:text-xs">

                        Almost There

                      </p>

                      <h2 className="mt-0.5 text-lg font-semibold text-[#3b101b]">

                        Order Summary

                      </h2>

                    </div>

                  </div>

                </div>

                {/* Price Details */}

                <div className="space-y-4 px-5 py-5 sm:px-6">

                  <div className="flex items-center justify-between text-sm">

                    <span className="text-gray-500">

                      Items ({cart.item_count})

                    </span>

                    <span className="font-medium text-gray-900">

                      {
                        formatPrice(
                          cart.subtotal
                        )
                      }

                    </span>

                  </div>

                  <div className="flex items-center justify-between text-sm">

                    <span className="text-gray-500">
                      Shipping
                    </span>

                    <span className="font-medium text-[#8f0828]">
                      At checkout
                    </span>

                  </div>

                  <div className="border-t border-dashed border-[#ded1cc]" />

                  <div className="flex items-end justify-between">

                    <div>

                      <p className="text-sm font-semibold text-[#3b101b]">
                        Total Amount
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        Inclusive of applicable taxes
                      </p>

                    </div>

                    <span className="text-xl font-bold text-[#8f0828] sm:text-2xl">

                      {
                        formatPrice(
                          cart.subtotal
                        )
                      }

                    </span>

                  </div>

                </div>

                {/* Checkout */}

                <div className="px-5 pb-6 sm:px-6">

                  <Link
                    href="/checkout"
                    className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#8f0828] px-5 py-4 text-sm font-semibold text-white shadow-lg shadow-[#8f0828]/20 transition hover:bg-[#70061f]"
                  >

                    Proceed to Checkout

                    <ChevronRight
                      size={17}
                      className="transition group-hover:translate-x-1"
                    />

                  </Link>

                  <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">

                    <LockKeyhole size={13} />

                    Secure checkout

                  </div>

                </div>

              </div>

              {/* Benefits */}

              <div className="mt-5 space-y-3 rounded-2xl border border-[#eadfda] bg-white p-5">

                <div className="flex gap-3">

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fff4f1] text-[#8f0828]">

                    <Truck size={17} />

                  </div>

                  <div>

                    <p className="text-sm font-semibold text-gray-900">
                      Safe Delivery
                    </p>

                    <p className="mt-0.5 text-xs leading-5 text-gray-500">
                      Your order is carefully packed
                      and delivered safely.
                    </p>

                  </div>

                </div>

                <div className="border-t border-[#f1e9e5]" />

                <div className="flex gap-3">

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fff4f1] text-[#8f0828]">

                    <ShieldCheck size={17} />

                  </div>

                  <div>

                    <p className="text-sm font-semibold text-gray-900">
                      Secure Shopping
                    </p>

                    <p className="mt-0.5 text-xs leading-5 text-gray-500">
                      Your personal information is
                      protected with secure systems.
                    </p>

                  </div>

                </div>

              </div>

            </aside>

          </div>

        )}

      </div>

      {/* ================================================================== */}
      {/* PREMIUM CONFIRMATION MODAL                                          */}
      {/* ================================================================== */}

      {modalType && (

        <div
          className="fixed inset-0 z-[100] flex items-end bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4"
          onClick={closeModal}
        >

          <div
            className="relative w-full overflow-hidden rounded-t-[28px] border border-[#eadfda] bg-white shadow-2xl sm:max-w-md sm:rounded-[28px]"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* Mobile Drag Handle */}

            <div className="flex justify-center pt-3 sm:hidden">

              <div className="h-1.5 w-12 rounded-full bg-gray-200" />

            </div>

            {/* Decorative Background */}

            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#fff1ed]" />

            <div className="pointer-events-none absolute -left-16 -bottom-16 h-40 w-40 rounded-full bg-[#fff8e8]" />

            {/* Close */}

            <button
              type="button"
              disabled={updatingId !== null}
              onClick={closeModal}
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40 sm:h-10 sm:w-10"
              aria-label="Close"
            >

              <X size={19} />

            </button>

            <div className="relative px-5 pb-6 pt-7 text-center sm:px-7 sm:pb-7 sm:pt-10">

              {/* Icon */}

              <div className="mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#fff1ed] shadow-lg shadow-[#8f0828]/10 sm:h-20 sm:w-20">

                <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#8f0828] text-white sm:h-14 sm:w-14">

                  <Trash2 size={23} />

                </div>

              </div>

              {/* Label */}

              <div className="mt-5 flex items-center justify-center gap-2 sm:mt-6">

                <Sparkles
                  size={14}
                  className="text-[#b68b3a]"
                />

                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a07425] sm:text-xs sm:tracking-[0.2em]">

                  {modalType === "remove"
                    ? "Shopping Bag"
                    : "Clear Shopping Bag"}

                </span>

              </div>

              {/* Title */}

              <h2 className="mt-3 text-xl font-semibold text-[#3b101b] sm:text-2xl">

                {modalType === "remove"
                  ? "Remove this item?"
                  : "Clear your shopping bag?"}

              </h2>

              {/* Description */}

              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-gray-500">

                {modalType === "remove"
                  ? "Are you sure you want to remove this beautiful piece from your shopping bag?"
                  : "Are you sure you want to remove all items from your shopping bag? This action cannot be undone."}

              </p>

              {/* Warning */}

              <div className="mt-5 flex items-start gap-3 rounded-xl border border-[#f3e4c8] bg-[#fffaf0] p-3.5 text-left sm:mt-6 sm:p-4">

                <AlertTriangle
                  size={18}
                  className="mt-0.5 shrink-0 text-[#b68b3a]"
                />

                <p className="text-xs leading-5 text-[#80672c]">

                  {modalType === "remove"
                    ? "You can always add this product back to your shopping bag later."
                    : "All items in your shopping bag will be removed. You can add them again later."}

                </p>

              </div>

              {/* Actions */}

              <div className="mt-6 grid grid-cols-1 gap-3 sm:mt-7 sm:grid-cols-2">

                {/* Cancel */}

                <button
                  type="button"
                  disabled={updatingId !== null}
                  onClick={closeModal}
                  className="order-2 rounded-xl border border-[#ded1cc] bg-white px-5 py-3.5 text-sm font-semibold text-[#5c1527] transition hover:bg-[#fff8f6] disabled:opacity-50 sm:order-1"
                >

                  Keep Items

                </button>

                {/* Confirm */}

                <button
                  type="button"
                  disabled={updatingId !== null}
                  onClick={() => {

                    if (
                      modalType === "remove" &&
                      selectedItemId !== null
                    ) {
                      removeItem(
                        selectedItemId
                      );
                    }

                    if (
                      modalType === "clear"
                    ) {
                      clearCart();
                    }

                  }}
                  className="order-1 flex items-center justify-center gap-2 rounded-xl bg-[#8f0828] px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#8f0828]/20 transition hover:bg-[#6f061f] disabled:opacity-50 sm:order-2"
                >

                  {updatingId !== null ? (

                    <>

                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />

                      {modalType === "remove"
                        ? "Removing..."
                        : "Clearing..."}

                    </>

                  ) : (

                    <>

                      <Trash2 size={16} />

                      {modalType === "remove"
                        ? "Yes, Remove"
                        : "Yes, Clear Bag"}

                    </>

                  )}

                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </main>
  );
}