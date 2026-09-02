"use client";

import {
  Heart,
  Star,
} from "lucide-react";

import type {
  Product,
  Variant,
} from "./product.types";


type Props = {
  product: Product;

  selectedVariant:
    | Variant
    | null;

  wishlisted: boolean;

  wishlistLoading: boolean;

  onWishlist: () => void;
};


export default function ProductInfo({
  product,
  selectedVariant,
  wishlisted,
  wishlistLoading,
  onWishlist,
}: Props) {

  const price =
    selectedVariant?.selling_price ||
    product.selling_price;

  const mrp =
    selectedVariant?.mrp ||
    product.mrp;


  const discount =
    Number(mrp) > Number(price)
      ? Math.round(
          ((Number(mrp) -
            Number(price)) /
            Number(mrp)) *
            100
        )
      : 0;


  const rating =
    Number(
      product.review_average || 0
    );


  const reviewCount =
    Number(
      product.review_count || 0
    );


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


  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8">


      {/* CATEGORY */}

      {product.category && (

        <p className="
          text-xs
          font-semibold
          uppercase
          tracking-[0.18em]
          text-[#9b7a17]
        ">
          {product.category.name}
        </p>

      )}


      {/* TITLE */}

      <h1 className="
        mt-3
        font-[family-name:var(--font-playfair)]
        text-3xl
        leading-tight
        text-gray-950
        sm:text-4xl
      ">
        {product.name}
      </h1>


      {/* RATING */}

      {reviewCount > 0 && (

        <div className="mt-4 flex items-center gap-3">

          <div className="flex items-center gap-1">

            {[1, 2, 3, 4, 5].map(
              (star) => (

                <Star
                  key={star}
                  size={15}
                  fill={
                    star <=
                    Math.round(rating)
                      ? "currentColor"
                      : "none"
                  }
                  className="
                    text-[#c99b28]
                  "
                />

              )
            )}

          </div>

          <span className="text-sm text-gray-500">
            {rating.toFixed(1)}
          </span>

          <span className="text-sm text-gray-400">
            ({reviewCount} reviews)
          </span>

        </div>

      )}


      {/* BADGES */}

      <div className="mt-5 flex flex-wrap gap-2">

        {product.new_arrival && (
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
            New Arrival
          </span>
        )}

        {product.best_seller && (
          <span className="rounded-full bg-yellow-50 px-3 py-1 text-xs font-medium text-yellow-700">
            Best Seller
          </span>
        )}

        {product.featured && (
          <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
            Featured
          </span>
        )}

      </div>


      {/* DESCRIPTION */}

      {product.short_description && (

        <p className="
          mt-5
          text-sm
          leading-7
          text-gray-600
        ">
          {product.short_description}
        </p>

      )}


      {/* PRICE */}

      <div className="mt-7 flex flex-wrap items-center gap-3">

        <span className="text-3xl font-semibold text-gray-950">
          {formatPrice(price)}
        </span>


        {Number(mrp) >
          Number(price) && (

          <span className="
            text-lg
            text-gray-400
            line-through
          ">
            {formatPrice(mrp)}
          </span>

        )}


        {discount > 0 && (

          <span className="
            rounded-full
            bg-green-50
            px-3
            py-1
            text-xs
            font-semibold
            text-green-700
          ">
            {discount}% OFF
          </span>

        )}

      </div>


      {/* WISHLIST */}

      <button
        type="button"
        disabled={wishlistLoading}
        onClick={onWishlist}
        className={`
          mt-6
          flex
          items-center
          gap-2
          rounded-xl
          border
          px-5
          py-3
          text-sm
          font-medium
          transition
          ${
            wishlisted
              ? "border-red-200 bg-red-50 text-red-600"
              : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          }
        `}
      >

        <Heart
          size={18}
          fill={
            wishlisted
              ? "currentColor"
              : "none"
          }
        />

        {wishlistLoading
          ? "Please wait..."
          : wishlisted
          ? "Saved to Wishlist"
          : "Add to Wishlist"}

      </button>

    </div>
  );
}