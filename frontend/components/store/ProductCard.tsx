"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  ShoppingBag,
  Star,
  Check,
} from "lucide-react";

import { BACKEND_URL } from "@/lib/api";
import { customerApiFetch } from "@/lib/customerApi";

export type StoreProductCardData = {
  id: number;
  name: string;
  slug: string;
  selling_price: number | string;
  mrp?: number | string | null;
  image?: string | null;
  primary_image?: {
    image?: string | null;
  } | null;
  review_average?: number;
  review_count?: number;
  featured?: boolean;
  best_seller?: boolean;
  new_arrival?: boolean;
  status?: string;
};

/* -----------------------------------------
   IMAGE URL
----------------------------------------- */

function resolveImage(product: StoreProductCardData) {
  const raw = product.image || product.primary_image?.image;

  if (!raw) {
    return "/logo.png";
  }

  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  if (raw.startsWith("/storage/")) {
    return `${BACKEND_URL}${raw}`;
  }

  return `${BACKEND_URL}/storage/${raw.replace(/^\//, "")}`;
}

/* -----------------------------------------
   CUSTOMER REFRESH EVENT
----------------------------------------- */

function dispatchRefresh(detail: Record<string, number>) {
  window.dispatchEvent(
    new CustomEvent("banglesmart:customer-refresh", {
      detail,
    })
  );
}

/* -----------------------------------------
   PRODUCT CARD
----------------------------------------- */

export default function ProductCard({
  product,
  compact = false,
}: {
  product: StoreProductCardData;
  compact?: boolean;
}) {
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistItemId, setWishlistItemId] = useState<number | null>(null);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [cartAdded, setCartAdded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const image = useMemo(() => resolveImage(product), [product]);

  const price = Number(product.selling_price || 0);
  const mrp = Number(product.mrp || 0);

  const discount =
    mrp > price
      ? Math.round(((mrp - price) / mrp) * 100)
      : 0;

  const rating = Number(product.review_average || 0);
  const reviewCount = Number(product.review_count || 0);

  /* -----------------------------------------
     CHECK WISHLIST
  ----------------------------------------- */

  useEffect(() => {
    const token = localStorage.getItem("customer_token");

    if (!token) return;

    let cancelled = false;

    void (async () => {
      try {
        const response = await customerApiFetch(
          `/customer/wishlist/check/${product.id}`
        );

        if (!response.ok || cancelled) {
          return;
        }

        const json = await response.json();

        setWishlisted(Boolean(json?.data?.wishlisted));

        setWishlistItemId(
          json?.data?.wishlist_item_id
            ? Number(json.data.wishlist_item_id)
            : null
        );
      } catch {
        // Wishlist status is non-blocking.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [product.id]);

  /* -----------------------------------------
     TOGGLE WISHLIST
  ----------------------------------------- */

  async function toggleWishlist(
    event: React.MouseEvent<HTMLButtonElement>
  ) {
    event.preventDefault();
    event.stopPropagation();

    const token = localStorage.getItem("customer_token");

    if (!token) {
      window.location.href = `/login?redirect=${encodeURIComponent(
        window.location.pathname
      )}`;

      return;
    }

    if (wishlistLoading) {
      return;
    }

    setWishlistLoading(true);
    setMessage("");

    try {
      if (wishlisted && wishlistItemId) {
        const response = await customerApiFetch(
          `/customer/wishlist/${wishlistItemId}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          throw new Error("Unable to remove from wishlist.");
        }

        setWishlisted(false);
        setWishlistItemId(null);

        dispatchRefresh({
          wishlistDelta: -1,
        });
      } else {
        const response = await customerApiFetch(
          "/customer/wishlist",
          {
            method: "POST",
            body: JSON.stringify({
              product_id: product.id,
            }),
          }
        );

        const json = await response.json();

        if (!response.ok) {
          throw new Error(
            json?.message || "Unable to add to wishlist."
          );
        }

        setWishlisted(true);

        setWishlistItemId(
          json?.data?.id
            ? Number(json.data.id)
            : null
        );

        dispatchRefresh({
          wishlistDelta: 1,
        });
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Wishlist update failed."
      );
    } finally {
      setWishlistLoading(false);
    }
  }

  /* -----------------------------------------
     ADD TO CART
  ----------------------------------------- */

  async function addToCart(
  event: React.MouseEvent<HTMLButtonElement>
) {
  event.preventDefault();
  event.stopPropagation();

  const token =
    localStorage.getItem("customer_token");

  if (!token) {
    window.location.href =
      `/login?redirect=${encodeURIComponent(
        window.location.pathname
      )}`;

    return;
  }

  if (cartLoading) {
    return;
  }

  setCartLoading(true);
  setMessage("");

  try {
    const response =
      await customerApiFetch(
        "/customer/cart/items",
        {
          method: "POST",
          body: JSON.stringify({
            product_id: product.id,
            quantity: 1,
          }),
        }
      );

    const json =
      await response.json();

    if (!response.ok) {
      throw new Error(
        json?.message ||
          "Unable to add to cart."
      );
    }

    const itemCount =
      Number(
        json?.data?.item_count || 0
      );

    dispatchRefresh({
      cartCount: itemCount,
    });

    setCartAdded(true);
    setMessage("Added to cart");

    window.setTimeout(() => {
      setCartAdded(false);
    }, 1800);
  } catch (error) {
    setMessage(
      error instanceof Error
        ? error.message
        : "Unable to add to cart."
    );
  } finally {
    setCartLoading(false);

    window.setTimeout(() => {
      setMessage("");
    }, 2200);
  }
}

  /* -----------------------------------------
     CARD
  ----------------------------------------- */

  return (
    <article
      className="
        group overflow-hidden rounded-[26px]
        border border-[#eadfce]
        bg-[#fffdf9]
        transition-all duration-500
        hover:-translate-y-2
        hover:shadow-[0_25px_60px_rgba(80,50,20,.14)]
      "
    >
      {/* IMAGE */}

      <div
        className="
          relative h-[230px]
          overflow-hidden
          bg-[#faf5ec]
          sm:h-[260px]
        "
      >
        <Link
          href={`/product/${product.slug}`}
          className="relative block h-full w-full"
        >
          {!imageLoaded && (
            <div className="absolute inset-0 animate-pulse bg-[#eee7dc]" />
          )}

          <Image
            src={image}
            alt={product.name}
            fill
            sizes="(max-width:640px) 50vw, 25vw"
            className={[
              "object-cover",
              "transition duration-700",
              "group-hover:scale-105",
              imageLoaded
                ? "opacity-100"
                : "opacity-0",
            ].join(" ")}
            onLoad={() => setImageLoaded(true)}
            unoptimized
          />
        </Link>

        {/* BADGES */}

        <div className="absolute left-4 top-4 flex flex-col gap-2">
          {product.new_arrival && (
            <span
              className="
                rounded-full
                bg-[#8f0828]
                px-3 py-1.5
                text-[9px]
                font-bold
                uppercase
                tracking-[0.2em]
                text-white
              "
            >
              New
            </span>
          )}

          {product.best_seller &&
            !product.new_arrival && (
              <span
                className="
                  rounded-full
                  bg-[#c9a227]
                  px-3 py-1.5
                  text-[9px]
                  font-bold
                  uppercase
                  tracking-[0.2em]
                  text-white
                "
              >
                Bestseller
              </span>
            )}

          {discount > 0 && (
            <span
              className="
                rounded-full
                bg-white
                px-3 py-1.5
                text-[9px]
                font-bold
                uppercase
                tracking-wide
                text-[#8f0828]
                shadow
              "
            >
              {discount}% OFF
            </span>
          )}
        </div>

        {/* WISHLIST */}

        <button
          type="button"
          onClick={toggleWishlist}
          disabled={wishlistLoading}
          className="
            absolute right-4 top-4
            flex h-11 w-11
            items-center justify-center
            rounded-full
            bg-white/95
            shadow-[0_8px_25px_rgba(0,0,0,.12)]
            transition
            hover:scale-110
          "
        >
          <Heart
            size={19}
            strokeWidth={1.6}
            fill={
              wishlisted
                ? "#8f0828"
                : "none"
            }
            className={
              wishlisted
                ? "text-[#8f0828]"
                : "text-[#222]"
            }
          />
        </button>
      </div>

      {/* DETAILS */}

      <div className="p-5">
        {/* COLLECTION */}

        <p
          className="
            mb-2
            text-[10px]
            uppercase
            tracking-[0.25em]
            text-[#b18a45]
          "
        >
          Premium Collection
        </p>

        {/* NAME */}

        <Link href={`/product/${product.slug}`}>
          <h3
            className="
              min-h-[50px]
              line-clamp-2
              font-[family-name:var(--font-playfair)]
              text-[17px]
              leading-6
              text-[#171717]
              transition
              group-hover:text-[#8f0828]
            "
          >
            {product.name}
          </h3>
        </Link>

        {/* RATING */}

        <div className="mt-3 flex items-center gap-2">
          <span
            className="
              flex items-center gap-1
              rounded-full
              bg-[#faf3e6]
              px-3 py-1
              text-xs
              text-[#555]
            "
          >
            <Star
              size={12}
              fill="#c9a227"
              className="text-[#c9a227]"
            />

            {rating > 0
              ? rating.toFixed(1)
              : "New"}
          </span>

          {reviewCount > 0 && (
            <span className="text-xs text-[#999]">
              {reviewCount} Reviews
            </span>
          )}
        </div>

        {/* PRICE */}

        <div className="mt-4 flex items-center gap-3">
          <span
            className="
              text-xl
              font-semibold
              text-[#8f0828]
            "
          >
            ₹{price.toLocaleString("en-IN")}
          </span>

          {mrp > price && (
            <span
              className="
                text-sm
                text-[#999]
                line-through
              "
            >
              ₹{mrp.toLocaleString("en-IN")}
            </span>
          )}
        </div>

        {/* ADD BAG */}

        <button
          type="button"
          onClick={addToCart}
          disabled={cartLoading}
          className="
            mt-5
            flex w-full
            items-center justify-center
            gap-2
            rounded-full
            bg-[#8f0828]
            py-3
            text-sm
            font-semibold
            tracking-wide
            text-white
            transition
            hover:cursor-pointer
            hover:bg-[#6d061f]
            hover:shadow-lg
          "
        >
          {cartLoading ? (
            "Adding..."
          ) : cartAdded ? (
            <>
              <Check size={16} />
              Added
            </>
          ) : (
            <>
              <ShoppingBag size={16} />
              Add to Bag
            </>
          )}
        </button>

        {message && (
          <p
            className="
              mt-3
              text-center
              text-xs
              text-[#8f0828]
            "
          >
            {message}
          </p>
        )}
      </div>
    </article>
  );
}