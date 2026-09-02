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

  short_description:
    | string
    | null;

  status: string;

  category:
    | Category
    | null;

  primary_image:
    | ProductImage
    | null;
};

type WishlistItem = {
  id: number;

  wishlist_id: number;
  product_id: number;

  created_at: string;

  product:
    | Product
    | null;
};

type WishlistData = {
  id: number;
  items: WishlistItem[];
  item_count: number;
};

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function WishlistPage() {
  const router =
    useRouter();

  const [
    wishlist,
    setWishlist,
  ] = useState<WishlistData | null>(
    null
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    removingId,
    setRemovingId,
  ] = useState<number | null>(
    null
  );

  const [
    error,
    setError,
  ] = useState("");

  /* ------------------------------------------------------------------------ */
  /* Load                                                                     */
  /* ------------------------------------------------------------------------ */

  const loadWishlist =
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

          router.replace(
            "/login"
          );

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
  /* Remove                                                                   */
  /* ------------------------------------------------------------------------ */

  async function removeItem(
    itemId: number
  ) {
    const confirmed =
      window.confirm(
        "Remove this product from your wishlist?"
      );

    if (!confirmed) {
      return;
    }

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

      await loadWishlist();
      window.dispatchEvent(new Event("banglesmart:customer-refresh"));
    } catch {
      window.alert(
        "Unable to connect to server."
      );
    } finally {
      setRemovingId(null);
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

  /* ------------------------------------------------------------------------ */
  /* Loading                                                                  */
  /* ------------------------------------------------------------------------ */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">

        <p className="text-sm text-gray-500">
          Loading wishlist...
        </p>

      </main>
    );
  }

  const items =
    wishlist?.items || [];

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
              href="/account"
              className="rounded-lg border border-gray-200 bg-white p-2 text-gray-700 transition hover:bg-gray-100"
            >
              <ArrowLeft
                size={19}
              />
            </Link>

            <div>

              <h1 className="text-3xl font-semibold text-gray-900">
                My Wishlist
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                {wishlist?.item_count ||
                  0}{" "}
                saved product(s)
              </p>

            </div>

          </div>

          <Link
            href="/shop"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Continue Shopping
          </Link>

        </div>

        {/* Error */}

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Empty */}

        {items.length === 0 ? (

          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center">

            <Heart
              size={44}
              className="mx-auto text-gray-300"
            />

            <h2 className="mt-5 text-xl font-semibold text-gray-900">
              Your wishlist is empty
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Save your favourite bangles
              and find them here later.
            </p>

            <Link
              href="/shop"
              className="mt-6 inline-flex rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-black"
            >
              Explore Bangles
            </Link>

          </div>

        ) : (

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

            {items.map(
              (item) => {

                const product =
                  item.product;

                if (!product) {
                  return null;
                }

                const image =
                  product
                    .primary_image
                    ?.image;

                return (

                  <div
                    key={item.id}
                    className="group overflow-hidden rounded-xl border border-gray-200 bg-white"
                  >

                    {/* Image */}

                    <Link
                      href={`/product/${product.slug}`}
                      className="relative block aspect-square overflow-hidden bg-gray-100"
                    >

                      {image ? (

                        <img
                          src={`${BACKEND_URL}/storage/${image}`}
                          alt={
                            product.name
                          }
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                        />

                      ) : (

                        <div className="flex h-full items-center justify-center">

                          <ShoppingBag
                            size={36}
                            className="text-gray-300"
                          />

                        </div>

                      )}

                      <div className="absolute right-3 top-3">

                        <button
                          type="button"
                          disabled={
                            removingId ===
                            item.id
                          }
                          onClick={(
                            event
                          ) => {
                            event.preventDefault();

                            removeItem(
                              item.id
                            );
                          }}
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-red-500 shadow-sm transition hover:bg-red-50 disabled:opacity-40"
                        >
                          <Trash2
                            size={16}
                          />
                        </button>

                      </div>

                    </Link>

                    {/* Content */}

                    <div className="p-4">

                      {product.category && (

                        <p className="text-xs text-gray-400">
                          {
                            product.category
                              .name
                          }
                        </p>

                      )}

                      <Link
                        href={`/product/${product.slug}`}
                      >

                        <h2 className="mt-1 line-clamp-2 min-h-12 font-medium text-gray-900 hover:underline">
                          {
                            product.name
                          }
                        </h2>

                      </Link>

                      {/* Price */}

                      <div className="mt-3 flex flex-wrap items-center gap-2">

                        <span className="font-semibold text-gray-900">
                          {formatPrice(
                            product
                              .selling_price
                          )}
                        </span>

                        {Number(
                          product.mrp
                        ) >
                          Number(
                            product
                              .selling_price
                          ) && (

                          <span className="text-xs text-gray-400 line-through">
                            {formatPrice(
                              product.mrp
                            )}
                          </span>

                        )}

                      </div>

                      {/* View Product */}

                      <Link
                        href={`/product/${product.slug}`}
                        className="mt-4 block rounded-lg bg-gray-900 px-4 py-2.5 text-center text-sm font-medium text-white transition hover:bg-black"
                      >
                        Select Size & Color
                      </Link>

                    </div>

                  </div>

                );

              }
            )}

          </div>

        )}

      </div>

    </main>
  );
}