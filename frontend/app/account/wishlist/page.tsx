"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  ArrowLeft,
  Heart,
  ShoppingBag,
  Trash2,
  Sparkles,
  ChevronRight,
  Gem,
  X,
  AlertTriangle,
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

type Category = {
  id: number;
  name: string;
  slug: string;
};

type Product = {
  id: number;
  name: string;
  slug: string;
  mrp: string;
  selling_price: string;
  short_description: string | null;
  status: string;
  category: Category | null;
  primary_image: ProductImage | null;
};

type WishlistItem = {
  id: number;
  wishlist_id: number;
  product_id: number;
  created_at: string;
  product: Product | null;
};

type WishlistData = {
  id: number;
  items: WishlistItem[];
  item_count: number;
};

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function WishlistPage() {
  const router = useRouter();

  const [wishlist, setWishlist] =
    useState<WishlistData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [removingId, setRemovingId] =
    useState<number | null>(null);

  const [error, setError] =
    useState("");

  /* Premium Remove Modal */

  const [
    removeModalOpen,
    setRemoveModalOpen,
  ] = useState(false);

  const [
    selectedItemId,
    setSelectedItemId,
  ] = useState<number | null>(null);

  /* ------------------------------------------------------------------------ */
  /* Load Wishlist                                                            */
  /* ------------------------------------------------------------------------ */

  const loadWishlist =
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
            "/customer/wishlist"
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
              "Unable to load wishlist."
          );

          return;
        }

        setWishlist(
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
    loadWishlist();
  }, [loadWishlist]);

  /* ------------------------------------------------------------------------ */
  /* Open Remove Modal                                                        */
  /* ------------------------------------------------------------------------ */

  function openRemoveModal(
    itemId: number
  ) {
    setSelectedItemId(
      itemId
    );

    setRemoveModalOpen(
      true
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Close Remove Modal                                                       */
  /* ------------------------------------------------------------------------ */

  function closeRemoveModal() {
    if (removingId) {
      return;
    }

    setRemoveModalOpen(
      false
    );

    setSelectedItemId(
      null
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Remove Item                                                              */
  /* ------------------------------------------------------------------------ */

  async function removeItem(
    itemId: number
  ) {
    try {
      setRemovingId(
        itemId
      );

      const response =
        await customerApiFetch(
          `/customer/wishlist/${itemId}`,
          {
            method: "DELETE",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        window.alert(
          data.message ||
            "Unable to remove product."
        );

        return;
      }

      /*
      |----------------------------------------------------------------------
      | Update Wishlist
      |----------------------------------------------------------------------
      */

      setWishlist(
        (previous) => {
          if (!previous) {
            return previous;
          }

          const items =
            previous.items.filter(
              (item) =>
                item.id !== itemId
            );

          return {
            ...previous,
            items,
            item_count:
              items.length,
          };
        }
      );

      /*
      |----------------------------------------------------------------------
      | Refresh Header Count
      |----------------------------------------------------------------------
      */

      window.dispatchEvent(
        new Event(
          "banglesmart:customer-refresh"
        )
      );

      /*
      |----------------------------------------------------------------------
      | Close Modal
      |----------------------------------------------------------------------
      */

      setRemoveModalOpen(
        false
      );

      setSelectedItemId(
        null
      );

    } catch {
      window.alert(
        "Unable to connect to server."
      );

    } finally {
      setRemovingId(
        null
      );
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Price                                                                    */
  /* ------------------------------------------------------------------------ */

  function formatPrice(
    value: string | number
  ) {
    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }
    ).format(
      Number(value)
    );
  }

  function getDiscount(
    mrp: string | number,
    sellingPrice: string | number
  ) {
    const original =
      Number(mrp);

    const selling =
      Number(
        sellingPrice
      );

    if (
      !original ||
      original <= selling
    ) {
      return 0;
    }

    return Math.round(
      (
        (original - selling) /
        original
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
      image.startsWith(
        "http://"
      ) ||
      image.startsWith(
        "https://"
      )
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

          <div className="mb-6 h-24 animate-pulse rounded-2xl bg-white sm:mb-8" />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">

            {[1, 2, 3, 4].map(
              (item) => (
                <div
                  key={item}
                  className="overflow-hidden rounded-2xl border border-[#eadfda] bg-white"
                >

                  <div className="aspect-square animate-pulse bg-[#f1ebe8]" />

                  <div className="space-y-3 p-4 sm:p-5">

                    <div className="h-3 w-20 animate-pulse rounded bg-gray-100" />

                    <div className="h-5 w-4/5 animate-pulse rounded bg-gray-200" />

                    <div className="h-5 w-2/5 animate-pulse rounded bg-gray-200" />

                    <div className="h-11 w-full animate-pulse rounded-xl bg-gray-100" />

                  </div>

                </div>
              )
            )}

          </div>

        </div>

      </main>
    );
  }

  const items =
    wishlist?.items || [];

  /* ------------------------------------------------------------------------ */
  /* UI                                                                       */
  /* ------------------------------------------------------------------------ */

  return (
    <main className="min-h-screen bg-[#faf7f5] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

      <div className="mx-auto max-w-7xl">

        {/* -------------------------------------------------------------- */}
        {/* Premium Header                                                 */}
        {/* -------------------------------------------------------------- */}

        <div className="relative mb-6 overflow-hidden rounded-2xl border border-[#eadfda] bg-white shadow-sm sm:mb-8">

          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#fff1ed]" />

          <div className="absolute -bottom-16 right-24 h-40 w-40 rounded-full bg-[#fff8e8]" />

          <div className="relative flex flex-col gap-5 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-6">

            <div className="flex items-start gap-3 sm:items-center sm:gap-4">

              <Link
                href="/account"
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
                    Your Favourites
                  </span>

                </div>

                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#3b101b] sm:text-3xl">
                  My Wishlist
                </h1>

                <p className="mt-1 text-xs text-gray-500 sm:text-sm">

                  {wishlist?.item_count || 0}{" "}

                  {wishlist?.item_count === 1
                    ? "beautiful piece"
                    : "beautiful pieces"}{" "}

                  saved for you

                </p>

              </div>

            </div>

            <Link
              href="/shop"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#ded1cc] bg-white px-5 py-3 text-sm font-semibold text-[#5c1527] transition hover:border-[#8f0828] hover:bg-[#fff8f6] sm:w-auto"
            >

              Explore Collection

              <ChevronRight
                size={17}
                className="transition group-hover:translate-x-1"
              />

            </Link>

          </div>

        </div>

        {/* -------------------------------------------------------------- */}
        {/* Error                                                          */}
        {/* -------------------------------------------------------------- */}

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:mb-6 sm:px-5 sm:py-4">

            {error}

          </div>
        )}

        {/* -------------------------------------------------------------- */}
        {/* Empty Wishlist                                                 */}
        {/* -------------------------------------------------------------- */}

        {items.length === 0 ? (

          <div className="overflow-hidden rounded-3xl border border-[#eadfda] bg-white">

            <div className="px-5 py-14 text-center sm:px-6 sm:py-24">

              <div className="relative mx-auto flex h-24 w-24 items-center justify-center sm:h-28 sm:w-28">

                <div className="absolute inset-0 rounded-full bg-[#fff1ed]" />

                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[#8f0828] text-white shadow-lg shadow-[#8f0828]/20 sm:h-20 sm:w-20">

                  <Heart
                    size={30}
                    fill="currentColor"
                  />

                </div>

              </div>

              <div className="mt-7 flex items-center justify-center gap-2">

                <Sparkles
                  size={14}
                  className="text-[#b68b3a]"
                />

                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a07425] sm:text-xs sm:tracking-[0.25em]">
                  Your Collection Awaits
                </p>

              </div>

              <h2 className="mt-3 text-2xl font-semibold text-[#3b101b] sm:text-3xl">
                Your wishlist is empty
              </h2>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-500">
                Save the bangles you love and
                keep them together in your
                personal collection.
              </p>

              <Link
                href="/shop"
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#8f0828] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#8f0828]/20 transition hover:bg-[#6f061f] sm:mt-8 sm:px-7"
              >

                <ShoppingBag
                  size={17}
                />

                Explore Bangles

                <ChevronRight
                  size={17}
                />

              </Link>

            </div>

          </div>

        ) : (

          <>

            {/* ---------------------------------------------------------- */}
            {/* Collection Intro                                           */}
            {/* ---------------------------------------------------------- */}

            <div className="mb-5 flex flex-col gap-4 rounded-2xl border border-[#eadfda] bg-white p-4 sm:mb-6 sm:flex-row sm:items-center sm:justify-between sm:p-5">

              <div className="flex items-start gap-3 sm:items-center sm:gap-4">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fff4f1] text-[#8f0828] sm:h-12 sm:w-12">

                  <Gem
                    size={20}
                  />

                </div>

                <div>

                  <h2 className="text-sm font-semibold text-[#3b101b] sm:text-base">
                    Your Curated Collection
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-gray-500 sm:text-sm">
                    Beautiful pieces you've saved
                    for a special moment.
                  </p>

                </div>

              </div>

              <div className="w-fit rounded-full bg-[#fff8f6] px-4 py-2 text-sm font-semibold text-[#8f0828]">

                {items.length}{" "}

                {items.length === 1
                  ? "Item"
                  : "Items"}

              </div>

            </div>

            {/* ---------------------------------------------------------- */}
            {/* Product Grid                                               */}
            {/* ---------------------------------------------------------- */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">

              {items.map(
                (item) => {
                  const product =
                    item.product;

                  if (!product) {
                    return null;
                  }

                  const imageUrl =
                    getImageUrl(
                      product
                        .primary_image
                        ?.image
                    );

                  const discount =
                    getDiscount(
                      product.mrp,
                      product.selling_price
                    );

                  return (

                    <article
                      key={item.id}
                      className="group relative overflow-hidden rounded-2xl border border-[#eadfda] bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                    >

                      {/* Product Image */}

                      <Link
                        href={`/product/${product.slug}`}
                        className="relative block aspect-square overflow-hidden bg-[#fffaf8]"
                      >

                        {imageUrl ? (

                          <img
                            src={imageUrl}
                            alt={product.name}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />

                        ) : (

                          <div className="flex h-full items-center justify-center">

                            <ShoppingBag
                              size={38}
                              className="text-[#d8c5bf]"
                            />

                          </div>

                        )}

                        {/* Gradient */}

                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/10 to-transparent" />

                        {/* Discount */}

                        {discount > 0 && (

                          <div className="absolute left-3 top-3 rounded-full bg-[#8f0828] px-3 py-1.5 text-[10px] font-bold tracking-wide text-white shadow-md sm:text-[11px]">

                            {discount}% OFF

                          </div>

                        )}

                      </Link>

                      {/* Remove Button */}

                      <button
                        type="button"
                        disabled={
                          removingId === item.id
                        }
                        onClick={() =>
                          openRemoveModal(
                            item.id
                          )
                        }
                        className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-[#8f0828] shadow-md backdrop-blur transition hover:scale-105 hover:bg-[#8f0828] hover:text-white disabled:opacity-40"
                        aria-label="Remove from wishlist"
                      >

                        {removingId ===
                        item.id ? (

                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />

                        ) : (

                          <Trash2
                            size={17}
                          />

                        )}

                      </button>

                      {/* Product Content */}

                      <div className="p-4 sm:p-5">

                        {/* Category */}

                        {product.category && (

                          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#a07425] sm:text-[11px] sm:tracking-[0.16em]">

                            {
                              product.category
                                .name
                            }

                          </p>

                        )}

                        {/* Product Name */}

                        <Link
                          href={`/product/${product.slug}`}
                        >

                          <h2 className="mt-2 min-h-[48px] line-clamp-2 text-[15px] font-semibold leading-6 text-[#351019] transition hover:text-[#8f0828] sm:min-h-[52px] sm:text-base">

                            {
                              product.name
                            }

                          </h2>

                        </Link>

                        {/* Description */}

                        {product.short_description && (

                          <p className="mt-2 line-clamp-2 text-xs leading-5 text-gray-500">

                            {
                              product.short_description
                            }

                          </p>

                        )}

                        {/* Price */}

                        <div className="mt-4 flex flex-wrap items-center gap-2">

                          <span className="text-lg font-bold text-[#3b101b]">

                            {
                              formatPrice(
                                product
                                  .selling_price
                              )
                            }

                          </span>

                          {Number(
                            product.mrp
                          ) >
                            Number(
                              product
                                .selling_price
                            ) && (

                            <span className="text-xs text-gray-400 line-through">

                              {
                                formatPrice(
                                  product.mrp
                                )
                              }

                            </span>

                          )}

                        </div>

                        {/* Savings */}

                        {discount > 0 && (

                          <p className="mt-1 text-xs font-semibold text-green-600">

                            You save{" "}

                            {
                              formatPrice(
                                Number(
                                  product.mrp
                                ) -
                                  Number(
                                    product
                                      .selling_price
                                  )
                              )
                            }

                          </p>

                        )}

                        {/* View Product */}

                        <Link
                          href={`/product/${product.slug}`}
                          className="group/button mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#8f0828] px-4 py-3 text-sm font-semibold text-white shadow-md shadow-[#8f0828]/15 transition hover:bg-[#6f061f]"
                        >

                          Select Size & Color

                          <ChevronRight
                            size={16}
                            className="transition group-hover/button:translate-x-1"
                          />

                        </Link>

                      </div>

                    </article>

                  );
                }
              )}

            </div>

            {/* ---------------------------------------------------------- */}
            {/* Bottom Explore                                             */}
            {/* ---------------------------------------------------------- */}

            <div className="mt-8 rounded-2xl border border-[#eadfda] bg-white px-5 py-7 text-center sm:mt-10 sm:px-6 sm:py-8">

              <Heart
                size={23}
                className="mx-auto text-[#8f0828]"
                fill="currentColor"
              />

              <h3 className="mt-3 text-base font-semibold text-[#3b101b] sm:text-lg">
                Found something else you love?
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Explore more designs and add them
                to your personal collection.
              </p>

              <Link
                href="/shop"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#8f0828] transition hover:gap-3"
              >

                Explore More Bangles

                <ChevronRight
                  size={17}
                />

              </Link>

            </div>

          </>

        )}

      </div>

      {/* ================================================================== */}
      {/* Premium Remove Confirmation Modal                                  */}
      {/* ================================================================== */}

      {removeModalOpen && (

        <div
          className="fixed inset-0 z-[100] flex items-end bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4"
          onClick={closeRemoveModal}
        >

          <div
            className="relative w-full overflow-hidden rounded-t-[28px] border border-[#eadfda] bg-white shadow-2xl sm:max-w-md sm:rounded-[28px]"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* Mobile Drag Indicator */}

            <div className="flex justify-center pt-3 sm:hidden">

              <div className="h-1.5 w-12 rounded-full bg-gray-200" />

            </div>

            {/* Decorative Background */}

            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#fff1ed]" />

            <div className="pointer-events-none absolute -left-16 -bottom-16 h-40 w-40 rounded-full bg-[#fff8e8]" />

            {/* Close Button */}

            <button
              type="button"
              disabled={
                Boolean(
                  removingId
                )
              }
              onClick={
                closeRemoveModal
              }
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40 sm:h-10 sm:w-10"
              aria-label="Close"
            >

              <X size={19} />

            </button>

            {/* Modal Content */}

            <div className="relative px-5 pb-6 pt-7 text-center sm:px-7 sm:pb-7 sm:pt-10">

              {/* Icon */}

              <div className="mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#fff1ed] text-[#8f0828] shadow-lg shadow-[#8f0828]/10 sm:h-20 sm:w-20">

                <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#8f0828] text-white sm:h-14 sm:w-14">

                  <Heart
                    size={23}
                    fill="currentColor"
                  />

                </div>

              </div>

              {/* Label */}

              <div className="mt-5 flex items-center justify-center gap-2 sm:mt-6">

                <Sparkles
                  size={14}
                  className="text-[#b68b3a]"
                />

                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a07425] sm:text-xs sm:tracking-[0.2em]">

                  Wishlist

                </span>

              </div>

              {/* Title */}

              <h2 className="mt-3 text-xl font-semibold text-[#3b101b] sm:text-2xl">

                Remove from wishlist?

              </h2>

              {/* Description */}

              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-gray-500">

                Are you sure you want to remove
                this beautiful piece from your
                personal collection?

              </p>

              {/* Warning */}

              <div className="mt-5 flex items-start gap-3 rounded-xl border border-[#f3e4c8] bg-[#fffaf0] p-3.5 text-left sm:mt-6 sm:p-4">

                <AlertTriangle
                  size={18}
                  className="mt-0.5 shrink-0 text-[#b68b3a]"
                />

                <p className="text-xs leading-5 text-[#80672c]">

                  Don't worry — you can always
                  add this product back to your
                  wishlist later.

                </p>

              </div>

              {/* Actions */}

              <div className="mt-6 grid grid-cols-1 gap-3 sm:mt-7 sm:grid-cols-2">

                {/* Keep */}

                <button
                  type="button"
                  disabled={
                    Boolean(
                      removingId
                    )
                  }
                  onClick={
                    closeRemoveModal
                  }
                  className="order-2 rounded-xl border border-[#ded1cc] bg-white px-5 py-3.5 text-sm font-semibold text-[#5c1527] transition hover:bg-[#fff8f6] disabled:opacity-50 sm:order-1"
                >

                  Keep Item

                </button>

                {/* Remove */}

                <button
                  type="button"
                  disabled={
                    selectedItemId ===
                      null ||
                    Boolean(
                      removingId
                    )
                  }
                  onClick={() => {
                    if (
                      selectedItemId !==
                      null
                    ) {
                      removeItem(
                        selectedItemId
                      );
                    }
                  }}
                  className="order-1 flex items-center justify-center gap-2 rounded-xl bg-[#8f0828] px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#8f0828]/20 transition hover:bg-[#6f061f] disabled:opacity-50 sm:order-2"
                >

                  {removingId ? (

                    <>

                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />

                      Removing...

                    </>

                  ) : (

                    <>

                      <Trash2
                        size={16}
                      />

                      Yes, Remove

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