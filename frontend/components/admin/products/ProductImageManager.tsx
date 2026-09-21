"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ImagePlus, Star, Trash2 } from "lucide-react";
import { apiFetch, BACKEND_URL } from "@/lib/api";
import { useAdminFeedback } from "@/components/admin/ui/AdminFeedbackProvider";

type ProductImage = {
  id: number;
  product_id: number;
  color_id: number | null;
  image: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean | number;
  url?: string | null;
};

type ProductVariant = {
  color_id: number | null;
  color_name?: string | null;
  color_display_name?: string | null;
  hex_code?: string | null;
};

type ProductResponse = {
  id: number;
  name: string;
  images?: ProductImage[];
  variants?: ProductVariant[];
};

type ColorOption = {
  id: number;
  name: string;
  hex_code?: string | null;
};

/*
|--------------------------------------------------------------------------
| Image Source
|--------------------------------------------------------------------------
*/

function imageSrc(image: ProductImage) {
  if (image.url) {
    return image.url;
  }

  if (/^(https?:)?\/\//.test(image.image)) {
    return image.image;
  }

  return `${BACKEND_URL}/storage/${image.image}`;
}

/*
|--------------------------------------------------------------------------
| Product Image Manager
|--------------------------------------------------------------------------
*/

export default function ProductImageManager({
  productId,
}: {
  productId: number;
}) {
  const { confirm, toast } = useAdminFeedback();

  const [productName, setProductName] = useState("");

  const [images, setImages] = useState<ProductImage[]>([]);

  const [colors, setColors] = useState<ColorOption[]>([]);

  /*
  |--------------------------------------------------------------------------
  | Upload Group
  |--------------------------------------------------------------------------
  |
  | Empty = General / all colors
  |
  */

  const [selectedColorId, setSelectedColorId] = useState<string>("");

  /*
  |--------------------------------------------------------------------------
  | Gallery Filter
  |--------------------------------------------------------------------------
  */

  const [filterColorId, setFilterColorId] = useState<string>("all");

  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Load Product
  |--------------------------------------------------------------------------
  */

  const load = useCallback(async () => {
    try {
      setError("");

      const response = await apiFetch(`/admin/products/${productId}`);

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.message || "Unable to load product images.");
      }

      const product: ProductResponse | null = json?.data || null;

      if (!product) {
        throw new Error("Product not found.");
      }

      setProductName(product.name || "");

      setImages(Array.isArray(product.images) ? product.images : []);

      /*
          |--------------------------------------------------------------------------
          | Build Unique Product Colors From Variants
          |--------------------------------------------------------------------------
          |
          | If product has:
          |
          | 2.4 + Pink
          | 2.6 + Pink
          | 2.8 + Pink
          |
          | Pink should appear only once.
          |
          |--------------------------------------------------------------------------
          */

      const map = new Map<number, ColorOption>();

      for (const variant of product.variants || []) {
        const id = Number(variant.color_id || 0);

        if (!id) {
          continue;
        }

        map.set(id, {
          id,

          name:
            variant.color_display_name || variant.color_name || `Color ${id}`,

          hex_code: variant.hex_code || null,
        });
      }

      setColors(Array.from(map.values()));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load product images.",
      );
    }
  }, [productId]);

  useEffect(() => {
    void load();
  }, [load]);

  /*
  |--------------------------------------------------------------------------
  | Filter Images
  |--------------------------------------------------------------------------
  */

  const filteredImages = useMemo(() => {
    /*
      |--------------------------------------------------------------------------
      | All Images
      |--------------------------------------------------------------------------
      */

    if (filterColorId === "all") {
      return images;
    }

    /*
      |--------------------------------------------------------------------------
      | General Images
      |--------------------------------------------------------------------------
      */

    if (filterColorId === "general") {
      return images.filter(
        (image) => image.color_id === null || image.color_id === undefined,
      );
    }

    /*
      |--------------------------------------------------------------------------
      | Selected Color
      |--------------------------------------------------------------------------
      */

    return images.filter(
      (image) => Number(image.color_id) === Number(filterColorId),
    );
  }, [images, filterColorId]);

  /*
  |--------------------------------------------------------------------------
  | Color Name
  |--------------------------------------------------------------------------
  */

  function colorName(colorId: number | null | undefined) {
    if (!colorId) {
      return "General";
    }

    return (
      colors.find((color) => Number(color.id) === Number(colorId))?.name ||
      `Color ${colorId}`
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Upload Images
  |--------------------------------------------------------------------------
  */

  async function uploadImages(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);

    if (!files.length) {
      return;
    }

    try {
      setUploading(true);

      setError("");

      /*
      |--------------------------------------------------------------------------
      | Upload Every Selected File
      |--------------------------------------------------------------------------
      */

      for (let index = 0; index < files.length; index += 1) {
        const formData = new FormData();

        formData.append("image", files[index]);

        /*
        |--------------------------------------------------------------------------
        | Add Color ID
        |--------------------------------------------------------------------------
        |
        | No color_id means General image.
        |
        */

        if (selectedColorId) {
          formData.append("color_id", selectedColorId);
        }

        /*
        |--------------------------------------------------------------------------
        | Existing Images in This Color Group
        |--------------------------------------------------------------------------
        */

        const groupImages = images.filter((image) =>
          selectedColorId
            ? Number(image.color_id) === Number(selectedColorId)
            : image.color_id === null || image.color_id === undefined,
        );

        /*
        |--------------------------------------------------------------------------
        | First Image Becomes Primary
        |--------------------------------------------------------------------------
        */

        if (groupImages.length === 0 && index === 0) {
          formData.append("is_primary", "1");
        }

        /*
        |--------------------------------------------------------------------------
        | Upload
        |--------------------------------------------------------------------------
        */

        const response = await apiFetch(`/admin/products/${productId}/images`, {
          method: "POST",

          body: formData,
        });

        const json = await response.json();

        if (!response.ok) {
          throw new Error(
            json?.message || `Unable to upload image: ${files[index].name}`,
          );
        }
      }

      /*
      |--------------------------------------------------------------------------
      | Success
      |--------------------------------------------------------------------------
      */

      toast(
        files.length === 1
          ? "Product image uploaded."
          : `${files.length} product images uploaded.`,
      );

      await load();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to upload images.";

      setError(message);

      toast(message, "error");
    } finally {
      setUploading(false);

      /*
      |--------------------------------------------------------------------------
      | Reset File Input
      |--------------------------------------------------------------------------
      */

      event.target.value = "";
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Delete Image
  |--------------------------------------------------------------------------
  */

  async function deleteImage(image: ProductImage) {
    const confirmed = await confirm({
      title: "Delete product image?",

      description: `Delete this ${colorName(
        image.color_id,
      )} image permanently?`,

      confirmLabel: "Delete image",

      tone: "danger",
    });

    if (!confirmed) {
      return;
    }

    const response = await apiFetch(`/admin/product-images/${image.id}`, {
      method: "DELETE",
    });

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      toast(json?.message || "Unable to delete image.", "error");

      return;
    }

    toast("Product image deleted.");

    await load();
  }

  /*
  |--------------------------------------------------------------------------
  | Set Primary Image
  |--------------------------------------------------------------------------
  |
  | Backend makes it Primary only for that color group.
  |
  */

  async function setPrimary(image: ProductImage) {
    const response = await apiFetch(
      `/admin/product-images/${image.id}/primary`,
      {
        method: "PUT",
      },
    );

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      toast(json?.message || "Unable to set primary image.", "error");

      return;
    }

    toast(`Primary image updated for ${colorName(image.color_id)}.`);

    await load();
  }

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <section
      className="
        rounded-2xl
        border
        border-[#e5dfd8]
        bg-white
        p-5
        shadow-[0_10px_35px_rgba(45,27,20,.04)]
        sm:p-6
      "
    >
      {/* ================================================================
          HEADER
      ================================================================ */}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#aa852e]">
            Color-aware gallery
          </p>

          <h2 className="mt-2 text-lg font-semibold text-gray-900">
            Product Images
          </h2>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
            Upload general images or images for a specific product color. When a
            customer changes color, the storefront gallery, cart and checkout
            will use the matching images.
          </p>
        </div>

        {/* ================================================================
            UPLOAD CONTROLS
        ================================================================ */}

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          {/* --------------------------------------------------------------
              COLOR FOR UPLOAD
          -------------------------------------------------------------- */}

          <select
            value={selectedColorId}
            onChange={(event) => setSelectedColorId(event.target.value)}
            className="
              rounded-xl
              border
              border-gray-300
              bg-white
              px-3
              py-2.5
              text-sm
              outline-none
              focus:border-[#a8822b]
            "
          >
            <option value="">General / all colors</option>

            {colors.map((color) => (
              <option key={color.id} value={color.id}>
                {color.name}
              </option>
            ))}
          </select>

          {/* --------------------------------------------------------------
              UPLOAD BUTTON
          -------------------------------------------------------------- */}

          <label
            className={`
              inline-flex
              cursor-pointer
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-[#650b12]
              px-4
              py-2.5
              text-sm
              font-semibold
              text-white
              transition
              hover:bg-[#7b0d17]

              ${uploading ? "pointer-events-none opacity-50" : ""}
            `}
          >
            <ImagePlus size={16} />

            {uploading ? "Uploading..." : "Upload images"}

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              disabled={uploading}
              onChange={uploadImages}
            />
          </label>
        </div>
      </div>

      {/* ================================================================
          IMAGE FILTER
      ================================================================ */}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-semibold uppercase tracking-[.12em] text-gray-400">
          View
        </span>

        {/* --------------------------------------------------------------
            ALL
        -------------------------------------------------------------- */}

        <button
          type="button"
          onClick={() => setFilterColorId("all")}
          className={`
            rounded-full
            border
            px-3
            py-1.5
            text-xs
            font-medium

            ${
              filterColorId === "all"
                ? "border-[#650b12] bg-[#650b12] text-white"
                : "border-gray-200 bg-white text-gray-600"
            }
          `}
        >
          All ({images.length})
        </button>

        {/* --------------------------------------------------------------
            GENERAL
        -------------------------------------------------------------- */}

        <button
          type="button"
          onClick={() => setFilterColorId("general")}
          className={`
            rounded-full
            border
            px-3
            py-1.5
            text-xs
            font-medium

            ${
              filterColorId === "general"
                ? "border-[#650b12] bg-[#650b12] text-white"
                : "border-gray-200 bg-white text-gray-600"
            }
          `}
        >
          General
        </button>

        {/* --------------------------------------------------------------
            COLOR FILTERS
        -------------------------------------------------------------- */}

        {colors.map((color) => (
          <button
            type="button"
            key={color.id}
            onClick={() => setFilterColorId(String(color.id))}
            className={`
                inline-flex
                items-center
                gap-2
                rounded-full
                border
                px-3
                py-1.5
                text-xs
                font-medium

                ${
                  filterColorId === String(color.id)
                    ? "border-[#650b12] bg-[#650b12] text-white"
                    : "border-gray-200 bg-white text-gray-600"
                }
              `}
          >
            {color.hex_code && (
              <span
                className="h-3 w-3 rounded-full border border-black/10"
                style={{
                  backgroundColor: color.hex_code,
                }}
              />
            )}

            {color.name}
          </button>
        ))}
      </div>

      {/* ================================================================
          ERROR
      ================================================================ */}

      {error && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* ================================================================
          EMPTY STATE
      ================================================================ */}

      {filteredImages.length === 0 ? (
        <div className="mt-6 flex min-h-52 items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/60">
          <div className="text-center">
            <ImagePlus size={34} className="mx-auto text-gray-300" />

            <p className="mt-3 text-sm font-semibold text-gray-700">
              No images in this group
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Choose a color above and upload the matching{" "}
              {productName || "product"} images.
            </p>
          </div>
        </div>
      ) : (
        /* ================================================================
            IMAGE GRID
        ================================================================ */

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filteredImages.map((image) => {
            const primary = Boolean(Number(image.is_primary));

            const label = colorName(image.color_id);

            return (
              <div
                key={image.id}
                className="
                    group
                    overflow-hidden
                    rounded-2xl
                    border
                    border-gray-200
                    bg-white
                  "
              >
                {/* ------------------------------------------------------
                      IMAGE
                  ------------------------------------------------------ */}

                <div className="relative aspect-square overflow-hidden bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}

                  <img
                    src={imageSrc(image)}
                    alt={image.alt_text || `${productName} ${label}`}
                    className="h-full w-full object-cover"
                  />

                  {/* ----------------------------------------------------
                        BADGES
                    ---------------------------------------------------- */}

                  <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
                    <span className="rounded-full bg-white/95 px-2 py-1 text-[10px] font-semibold text-gray-700 shadow">
                      {label}
                    </span>

                    {primary && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#650b12] px-2 py-1 text-[10px] font-semibold text-white shadow">
                        <Star size={10} fill="currentColor" />
                        Primary
                      </span>
                    )}
                  </div>
                </div>

                {/* ------------------------------------------------------
                      ACTIONS
                  ------------------------------------------------------ */}

                <div className="flex items-center justify-center gap-2 p-3">
                  {/* ----------------------------------------------------
                        PRIMARY
                    ---------------------------------------------------- */}

                  <button
                    type="button"
                    title={primary ? "Primary image" : "Set as primary"}
                    aria-label={primary ? "Primary image" : "Set as primary"}
                    disabled={primary}
                    onClick={() => void setPrimary(image)}
                    className={`
                      inline-flex
                      h-9
                      w-9
                      items-center
                      justify-center
                      rounded-lg
                      border
                      transition

                      ${
                        primary
                          ? "border-[#650b12] bg-[#650b12] text-white"
                          : "border-gray-200 bg-white text-gray-500 hover:border-[#650b12] hover:bg-[#fff7f8] hover:text-[#650b12]"
                      }

                      disabled:cursor-default
                    `}
                  >
                    <Star size={16} fill={primary ? "currentColor" : "none"} />
                  </button>

                  {/* ----------------------------------------------------
                        DELETE
                    ---------------------------------------------------- */}

                  <button
                    type="button"
                    title="Delete image"
                    aria-label="Delete image"
                    onClick={() => void deleteImage(image)}
                    className="
                      inline-flex
                      h-9
                      w-9
                      items-center
                      justify-center
                      rounded-lg
                      border
                      border-red-200
                      bg-white
                      text-red-500
                      transition
                      hover:border-red-500
                      hover:bg-red-50
                      hover:text-red-600
                    "
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
