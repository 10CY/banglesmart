"use client";

import {
  Minus,
  Plus,
  ShoppingBag,
} from "lucide-react";

import Link from "next/link";

import type {
  Product,
  Variant,
} from "./product.types";


type Props = {
  product: Product;

  selectedVariant:
    | Variant
    | null;

  quantity: number;

  availableQuantity: number;

  adding: boolean;

  cartMessage: string;

  onQuantityChange: (
    quantity: number
  ) => void;

  onAddToCart: () => void;
};


export default function ProductPurchase({
  selectedVariant,
  quantity,
  availableQuantity,
  adding,
  cartMessage,
  onQuantityChange,
  onAddToCart,
}: Props) {

  const hasStock =
    Boolean(
      selectedVariant &&
      selectedVariant.status ===
        "active" &&
      availableQuantity > 0
    );


  return (
    <div className="mt-6 rounded-3xl border border-gray-200 bg-white p-6 sm:p-8">


      {/* STOCK */}

      {!selectedVariant ? (

        <div className="rounded-xl bg-gray-50 px-4 py-3">
          <p className="text-sm text-gray-500">
            Select a size and color to continue.
          </p>
        </div>

      ) : hasStock ? (

        <div className="flex items-center justify-between">

          <div>

            <p className="text-sm font-semibold text-green-700">
              In Stock
            </p>

            <p className="mt-1 text-xs text-gray-500">
              {availableQuantity} available
            </p>

          </div>

          {availableQuantity <= 5 && (
            <span className="text-xs font-medium text-orange-600">
              Limited stock
            </span>
          )}

        </div>

      ) : (

        <p className="text-sm font-semibold text-red-600">
          Out of Stock
        </p>

      )}


      {/* ACTIONS */}

      <div className="mt-6 flex gap-3">


        {/* QUANTITY */}

        <div className="flex h-13 items-center rounded-xl border border-gray-300">

          <button
            type="button"
            disabled={
              quantity <= 1
            }
            onClick={() =>
              onQuantityChange(
                Math.max(
                  1,
                  quantity - 1
                )
              )
            }
            className="
              flex
              h-full
              w-11
              items-center
              justify-center
              text-gray-600
              hover:bg-gray-50
              disabled:opacity-30
            "
          >
            <Minus size={16} />
          </button>


          <span className="min-w-10 text-center text-sm font-semibold">
            {quantity}
          </span>


          <button
            type="button"
            disabled={
              !hasStock ||
              quantity >=
                availableQuantity
            }
            onClick={() =>
              onQuantityChange(
                Math.min(
                  availableQuantity,
                  quantity + 1
                )
              )
            }
            className="
              flex
              h-full
              w-11
              items-center
              justify-center
              text-gray-600
              hover:bg-gray-50
              disabled:opacity-30
            "
          >
            <Plus size={16} />
          </button>

        </div>


        {/* CART */}

        <button
          type="button"
          disabled={
            adding ||
            !hasStock
          }
          onClick={
            onAddToCart
          }
          className="
            flex
            h-13
            flex-1
            items-center
            justify-center
            gap-2
            rounded-xl
            bg-gray-950
            px-6
            text-sm
            font-semibold
            text-white
            transition
            hover:bg-black
            disabled:cursor-not-allowed
            disabled:opacity-40
          "
        >

          <ShoppingBag size={18} />

          {adding
            ? "Adding..."
            : "Add to Cart"}

        </button>

      </div>


      {/* SUCCESS */}

      {cartMessage && (

        <div className="
          mt-4
          flex
          items-center
          justify-between
          gap-3
          rounded-xl
          border
          border-green-200
          bg-green-50
          px-4
          py-3
        ">

          <span className="text-sm font-medium text-green-700">
            {cartMessage}
          </span>

          <Link
            href="/cart"
            className="text-sm font-semibold text-green-800 underline"
          >
            View Cart
          </Link>

        </div>

      )}


      {/* TRUST */}

      <div className="
        mt-7
        grid
        grid-cols-3
        gap-3
        border-t
        border-gray-100
        pt-6
      ">

        <div className="text-center">
          <p className="text-xs font-semibold text-gray-900">
            Original
          </p>
          <p className="mt-1 text-[10px] text-gray-500">
            Authentic products
          </p>
        </div>

        <div className="text-center">
          <p className="text-xs font-semibold text-gray-900">
            Secure
          </p>
          <p className="mt-1 text-[10px] text-gray-500">
            Safe checkout
          </p>
        </div>

        <div className="text-center">
          <p className="text-xs font-semibold text-gray-900">
            Delivery
          </p>
          <p className="mt-1 text-[10px] text-gray-500">
            Across India
          </p>
        </div>

      </div>

    </div>
  );
}