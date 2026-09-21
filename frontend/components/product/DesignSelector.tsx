"use client";

import type { DesignOption, ProductImage } from "./product.types";

type DesignSelectorProps = {
  designs: DesignOption[];

  selectedDesignId: number | null;

  selectedColorId: number | null;

  onChange: (designId: number) => void;
};

/*
|--------------------------------------------------------------------------
| Image URL Helper
|--------------------------------------------------------------------------
*/

function getImageUrl(image: ProductImage | null | undefined) {
  if (!image) {
    return "";
  }

  /*
  |--------------------------------------------------------------------------
  | Prefer serialized URL from backend
  |--------------------------------------------------------------------------
  */

  if (image.url) {
    return image.url;
  }

  /*
  |--------------------------------------------------------------------------
  | Fallback to raw image value
  |--------------------------------------------------------------------------
  */

  return image.image || "";
}

/*
|--------------------------------------------------------------------------
| Resolve Design Thumbnail
|--------------------------------------------------------------------------
|
| Priority:
|
| 1. Selected Design + Selected Color primary image
| 2. Selected Design + Selected Color first image
| 3. Selected Design general primary image
| 4. Selected Design general first image
| 5. Any first design image
|
|--------------------------------------------------------------------------
*/

function getDesignThumbnail(
  design: DesignOption,
  selectedColorId: number | null,
) {
  const images = Array.isArray(design.images) ? design.images : [];

  if (images.length === 0) {
    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | Selected Color Images
  |--------------------------------------------------------------------------
  */

  if (selectedColorId !== null) {
    const colorImages = images.filter(
      (image) => Number(image.color_id) === Number(selectedColorId),
    );

    /*
    |--------------------------------------------------------------------------
    | Selected Color Primary
    |--------------------------------------------------------------------------
    */

    const colorPrimary = colorImages.find((image) => Boolean(image.is_primary));

    if (colorPrimary) {
      return colorPrimary;
    }

    /*
    |--------------------------------------------------------------------------
    | Selected Color First Image
    |--------------------------------------------------------------------------
    */

    if (colorImages.length > 0) {
      return (
        [...colorImages].sort(
          (a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0),
        )[0] || null
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | General Images
  |--------------------------------------------------------------------------
  |
  | General means:
  |
  | color_id = null
  |
  |--------------------------------------------------------------------------
  */

  const generalImages = images.filter(
    (image) => image.color_id === null || image.color_id === undefined,
  );

  /*
  |--------------------------------------------------------------------------
  | General Primary
  |--------------------------------------------------------------------------
  */

  const generalPrimary = generalImages.find((image) =>
    Boolean(image.is_primary),
  );

  if (generalPrimary) {
    return generalPrimary;
  }

  /*
  |--------------------------------------------------------------------------
  | General First Image
  |--------------------------------------------------------------------------
  */

  if (generalImages.length > 0) {
    return (
      [...generalImages].sort(
        (a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0),
      )[0] || null
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Last Fallback
  |--------------------------------------------------------------------------
  */

  return (
    [...images].sort(
      (a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0),
    )[0] || null
  );
}

/*
|--------------------------------------------------------------------------
| Design Selector
|--------------------------------------------------------------------------
*/

export default function DesignSelector({
  designs,

  selectedDesignId,

  selectedColorId,

  onChange,
}: DesignSelectorProps) {
  /*
  |--------------------------------------------------------------------------
  | No Designs
  |--------------------------------------------------------------------------
  */

  if (!Array.isArray(designs) || designs.length === 0) {
    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | Only Active Designs
  |--------------------------------------------------------------------------
  */

  const activeDesigns = designs
    .filter((design) => !design.status || design.status === "active")
    .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));

  if (activeDesigns.length === 0) {
    return null;
  }

  return (
    <div>
      {/* ---------------------------------------------------------------
          TITLE
      --------------------------------------------------------------- */}

      <div className="mb-3 flex items-center justify-between gap-4">
        <h3 className="text-sm font-medium text-gray-900">Design</h3>

        {selectedDesignId && (
          <span className="text-xs text-gray-500">
            {
              activeDesigns.find(
                (design) => Number(design.id) === Number(selectedDesignId),
              )?.label
            }
          </span>
        )}
      </div>

      {/* ---------------------------------------------------------------
          DESIGNS
      --------------------------------------------------------------- */}

      <div className="flex flex-wrap gap-3">
        {activeDesigns.map((design) => {
          const selected = Number(selectedDesignId) === Number(design.id);

          const thumbnail = getDesignThumbnail(design, selectedColorId);

          const imageUrl = getImageUrl(thumbnail);

          return (
            <button
              key={design.id}
              type="button"
              onClick={() => onChange(Number(design.id))}
              className={`
                  group
                  relative
                  overflow-hidden
                  rounded-xl
                  border
                  bg-white
                  text-left
                  transition-all

                  ${
                    selected
                      ? "border-gray-900 ring-2 ring-gray-900/10"
                      : "border-gray-200 hover:border-gray-400"
                  }
                `}
            >
              {/* -------------------------------------------------------
                    DESIGN IMAGE
                ------------------------------------------------------- */}

              <div className="h-20 w-20 overflow-hidden bg-gray-50">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={design.label || `Design ${design.id}`}
                    className="
                        h-full
                        w-full
                        object-cover
                        transition
                        duration-300
                        group-hover:scale-105
                      "
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center px-2 text-center text-[10px] text-gray-400">
                    No image
                  </div>
                )}
              </div>

              {/* -------------------------------------------------------
                    DESIGN LABEL
                ------------------------------------------------------- */}

              <div className="max-w-20 border-t border-gray-100 px-2 py-2">
                <p
                  className={`
                      truncate
                      text-center
                      text-xs
                      font-medium

                      ${selected ? "text-gray-950" : "text-gray-700"}
                    `}
                >
                  {design.label || `Design ${design.id}`}
                </p>
              </div>

              {/* -------------------------------------------------------
                    SELECTED INDICATOR
                ------------------------------------------------------- */}

              {selected && (
                <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900 text-[10px] text-white shadow-sm">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
