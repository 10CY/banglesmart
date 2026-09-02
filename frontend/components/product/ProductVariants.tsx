"use client";

import { Check } from "lucide-react";

import type {
  Product,
  Size,
  Color,
  Variant,
} from "./product.types";


type Props = {
  product: Product;

  sizes: Size[];

  colors: Color[];

  selectedSizeId:
    | number
    | null;

  selectedColorId:
    | number
    | null;

  selectedVariant:
    | Variant
    | null;

  sizeHasStock: (
    id: number
  ) => boolean;

  colorHasStock: (
    id: number
  ) => boolean;

  onSizeChange: (
    id: number
  ) => void;

  onColorChange: (
    id: number
  ) => void;
};


export default function ProductVariants({
  sizes,
  colors,
  selectedSizeId,
  selectedColorId,
  selectedVariant,
  sizeHasStock,
  colorHasStock,
  onSizeChange,
  onColorChange,
}: Props) {

  return (
    <div className="mt-6 rounded-3xl border border-gray-200 bg-white p-6 sm:p-8">


      {/* SIZE */}

      <div>

        <div className="mb-3 flex items-center justify-between">

          <h2 className="text-sm font-semibold text-gray-900">
            Select Size
          </h2>

          {selectedVariant && (

            <span className="font-mono text-xs text-gray-400">
              SKU: {selectedVariant.sku}
            </span>

          )}

        </div>


        {sizes.length === 0 ? (

          <p className="text-sm text-gray-500">
            No sizes available.
          </p>

        ) : (

          <div className="flex flex-wrap gap-2">

            {sizes.map((size) => {

              const selected =
                selectedSizeId ===
                size.id;

              const stock =
                sizeHasStock(
                  size.id
                );


              return (

                <button
                  key={size.id}
                  type="button"
                  onClick={() =>
                    onSizeChange(
                      size.id
                    )
                  }
                  className={`
                    min-w-16
                    rounded-xl
                    border
                    px-4
                    py-2.5
                    text-sm
                    font-medium
                    transition
                    ${
                      selected
                        ? "border-gray-900 bg-gray-900 text-white"
                        : stock
                        ? "border-gray-300 bg-white text-gray-700 hover:border-gray-500"
                        : "border-gray-200 bg-gray-50 text-gray-400"
                    }
                  `}
                >
                  {size.display_name ||
                    size.name}
                </button>

              );
            })}

          </div>

        )}

      </div>


      {/* COLOR */}

      <div className="mt-7">

        <h2 className="mb-3 text-sm font-semibold text-gray-900">
          Select Color
        </h2>


        {colors.length === 0 ? (

          <p className="text-sm text-gray-500">
            Select a size to see available colors.
          </p>

        ) : (

          <div className="flex flex-wrap gap-3">

            {colors.map((color) => {

              const selected =
                selectedColorId ===
                color.id;

              const stock =
                colorHasStock(
                  color.id
                );


              return (

                <button
                  key={color.id}
                  type="button"
                  onClick={() =>
                    onColorChange(
                      color.id
                    )
                  }
                  className={`
                    flex
                    items-center
                    gap-2
                    rounded-xl
                    border
                    px-3
                    py-2
                    text-sm
                    transition
                    ${
                      selected
                        ? "border-gray-900 bg-gray-50"
                        : "border-gray-300 hover:border-gray-500"
                    }
                  `}
                >

                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-300"
                    style={{
                      backgroundColor:
                        color.hex_code ||
                        "#fff",
                    }}
                  >

                    {selected && (
                      <Check
                        size={14}
                        className="text-white drop-shadow"
                      />
                    )}

                  </span>


                  <span>
                    {color.display_name ||
                      color.name}

                    {!stock &&
                      " - Out"}
                  </span>

                </button>

              );
            })}

          </div>

        )}

      </div>

    </div>
  );
}