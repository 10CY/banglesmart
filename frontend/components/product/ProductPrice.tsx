"use client";

import type {
  Product,
  Variant,
} from "./product.types";

type Props = {
  product: Product;

  selectedVariant?: Variant | null;
};

function numberValue(
  value: string | number | undefined | null
) {
  const number = Number(value ?? 0);

  return Number.isFinite(number)
    ? number
    : 0;
}

function formatPrice(
  value: string | number | undefined | null
) {
  return numberValue(value).toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 2,
    }
  );
}

export default function ProductPrice({
  product,
  selectedVariant = null,
}: Props) {
  const mrp = numberValue(
    selectedVariant?.mrp ??
      product.mrp
  );

  const sellingPrice =
    numberValue(
      selectedVariant?.selling_price ??
        product.selling_price
    );

  const discount =
    mrp > 0 &&
    sellingPrice > 0 &&
    sellingPrice < mrp
      ? Math.round(
          ((mrp - sellingPrice) /
            mrp) *
            100
        )
      : 0;

  return (
    <div className="mt-5">
      <div className="flex flex-wrap items-center gap-3">
        <span
          className="
            text-3xl
            font-semibold
            tracking-tight
            text-gray-900
          "
        >
          ₹{formatPrice(sellingPrice)}
        </span>

        {mrp > sellingPrice && (
          <>
            <span
              className="
                text-base
                text-gray-400
                line-through
              "
            >
              ₹{formatPrice(mrp)}
            </span>

            {discount > 0 && (
              <span
                className="
                  rounded-full
                  bg-green-50
                  px-3
                  py-1
                  text-xs
                  font-semibold
                  text-green-700
                "
              >
                {discount}% OFF
              </span>
            )}
          </>
        )}
      </div>

      {product.set_quantity > 1 && (
        <p className="mt-2 text-sm text-gray-500">
          Set of {product.set_quantity}
        </p>
      )}
    </div>
  );
}