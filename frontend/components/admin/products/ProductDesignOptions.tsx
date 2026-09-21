"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";

import {
  ChevronDown,
  ChevronUp,
  ImagePlus,
  Plus,
  Save,
  Star,
  Trash2,
} from "lucide-react";

import { apiFetch, BACKEND_URL } from "@/lib/api";

import { useAdminFeedback } from "@/components/admin/ui/AdminFeedbackProvider";

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

type ProductVariant = {
  color_id: number | null;

  color_name?: string | null;

  color_display_name?: string | null;

  hex_code?: string | null;
};

type ProductResponse = {
  id: number;

  name: string;

  variants?: ProductVariant[];
};

type ColorOption = {
  id: number;

  name: string;

  hex_code?: string | null;
};

type DesignImage = {
  id: number;

  design_option_id: number;

  color_id: number | null;

  image: string;

  url?: string | null;

  alt_text?: string | null;

  sort_order: number;

  is_primary: boolean | number;
};

type DesignOption = {
  id: number;

  product_id: number;

  label: string | null;

  sort_order: number;

  status: string;

  images: DesignImage[];
};

type DesignDraft = {
  label: string;

  sort_order: string;

  status: string;
};

/*
|--------------------------------------------------------------------------
| Image URL
|--------------------------------------------------------------------------
*/

function imageSrc(image: DesignImage) {
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
| Component
|--------------------------------------------------------------------------
*/

export default function ProductDesignOptions({
  productId,
}: {
  productId: number;
}) {
  const { confirm, toast } = useAdminFeedback();

  /*
  |--------------------------------------------------------------------------
  | Data
  |--------------------------------------------------------------------------
  */

  const [productName, setProductName] = useState("");

  const [designs, setDesigns] = useState<DesignOption[]>([]);

  const [colors, setColors] = useState<ColorOption[]>([]);

  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [creating, setCreating] = useState(false);

  const [expandedDesignIds, setExpandedDesignIds] = useState<number[]>([]);

  /*
  |--------------------------------------------------------------------------
  | New Design
  |--------------------------------------------------------------------------
  */

  const [newDesignLabel, setNewDesignLabel] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Drafts
  |--------------------------------------------------------------------------
  */

  const [drafts, setDrafts] = useState<Record<number, DesignDraft>>({});

  const [savingDesignId, setSavingDesignId] = useState<number | null>(null);

  /*
  |--------------------------------------------------------------------------
  | Per Design Upload Color
  |--------------------------------------------------------------------------
  |
  | Example:
  |
  | {
  |   4: "12",
  |   5: ""
  | }
  |
  | "" = General image
  |
  */

  const [uploadColorIds, setUploadColorIds] = useState<Record<number, string>>(
    {},
  );

  /*
  |--------------------------------------------------------------------------
  | Per Design Image Filter
  |--------------------------------------------------------------------------
  */

  const [imageFilters, setImageFilters] = useState<Record<number, string>>({});

  /*
  |--------------------------------------------------------------------------
  | Uploading
  |--------------------------------------------------------------------------
  */

  const [uploadingDesignId, setUploadingDesignId] = useState<number | null>(
    null,
  );

  /*
  |--------------------------------------------------------------------------
  | Load Product + Design Options
  |--------------------------------------------------------------------------
  */

  const load = useCallback(async () => {
    try {
      setLoading(true);

      setError("");

      const [productResponse, designResponse] = await Promise.all([
        apiFetch(`/admin/products/${productId}`),

        apiFetch(`/admin/products/${productId}/design-options`),
      ]);

      const productJson = await productResponse.json();

      const designJson = await designResponse.json();

      /*
          |--------------------------------------------------------------------------
          | Product
          |--------------------------------------------------------------------------
          */

      if (!productResponse.ok) {
        throw new Error(productJson?.message || "Unable to load product.");
      }

      const product: ProductResponse | null = productJson?.data || null;

      if (!product) {
        throw new Error("Product not found.");
      }

      setProductName(product.name || "");

      /*
          |--------------------------------------------------------------------------
          | Unique Product Colors
          |--------------------------------------------------------------------------
          |
          | A color may appear in many size variants.
          |
          | Example:
          |
          | 2.4 + Pink
          | 2.6 + Pink
          | 2.8 + Pink
          |
          | We only show Pink once.
          |
          |--------------------------------------------------------------------------
          */

      const colorMap = new Map<number, ColorOption>();

      for (const variant of product.variants || []) {
        const colorId = Number(variant.color_id || 0);

        if (!colorId) {
          continue;
        }

        colorMap.set(colorId, {
          id: colorId,

          name:
            variant.color_display_name ||
            variant.color_name ||
            `Color ${colorId}`,

          hex_code: variant.hex_code || null,
        });
      }

      setColors(Array.from(colorMap.values()));

      /*
          |--------------------------------------------------------------------------
          | Design Options
          |--------------------------------------------------------------------------
          */

      if (!designResponse.ok) {
        throw new Error(
          designJson?.message || "Unable to load design options.",
        );
      }

      const rows = Array.isArray(designJson?.data) ? designJson.data : [];

      setDesigns(rows);

      /*
          |--------------------------------------------------------------------------
          | Build Editable Drafts
          |--------------------------------------------------------------------------
          */

      const nextDrafts: Record<number, DesignDraft> = {};

      for (const design of rows) {
        nextDrafts[design.id] = {
          label: design.label || "",

          sort_order: String(design.sort_order || 0),

          status: design.status || "active",
        };
      }

      setDrafts(nextDrafts);

      /*
          |--------------------------------------------------------------------------
          | Initialize Filters
          |--------------------------------------------------------------------------
          */

      setImageFilters((current) => {
        const next = {
          ...current,
        };

        for (const design of rows) {
          if (!next[design.id]) {
            next[design.id] = "all";
          }
        }

        return next;
      });

      setUploadColorIds((current) => {
        const next = {
          ...current,
        };

        for (const design of rows) {
          if (next[design.id] === undefined) {
            next[design.id] = "";
          }
        }

        return next;
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load design options.",
      );
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    void load();
  }, [load]);

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
  | Toggle Expand
  |--------------------------------------------------------------------------
  */

  function toggleExpanded(designId: number) {
    setExpandedDesignIds((current) =>
      current.includes(designId)
        ? current.filter((id) => id !== designId)
        : [...current, designId],
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Create Design
  |--------------------------------------------------------------------------
  */

  async function createDesign() {
    const label = newDesignLabel.trim();

    if (!label) {
      toast("Enter a design name first.", "error");

      return;
    }

    try {
      setCreating(true);

      const response = await apiFetch(
        `/admin/products/${productId}/design-options`,
        {
          method: "POST",

          body: JSON.stringify({
            label,

            status: "active",

            sort_order: designs.length,
          }),
        },
      );

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.message || "Unable to create design option.");
      }

      setNewDesignLabel("");

      toast("Design option created.");

      await load();

      /*
      |--------------------------------------------------------------------------
      | Expand New Design
      |--------------------------------------------------------------------------
      */

      const createdId = Number(json?.data?.id || 0);

      if (createdId) {
        setExpandedDesignIds((current) => [
          ...current.filter((id) => id !== createdId),

          createdId,
        ]);
      }
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Unable to create design option.",
        "error",
      );
    } finally {
      setCreating(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Update Draft
  |--------------------------------------------------------------------------
  */

  function updateDraft(
    designId: number,
    field: keyof DesignDraft,
    value: string,
  ) {
    setDrafts((current) => ({
      ...current,

      [designId]: {
        ...(current[designId] || {
          label: "",
          sort_order: "0",
          status: "active",
        }),

        [field]: value,
      },
    }));
  }

  /*
  |--------------------------------------------------------------------------
  | Save Design
  |--------------------------------------------------------------------------
  */

  async function saveDesign(designId: number) {
    const draft = drafts[designId];

    if (!draft) {
      return;
    }

    if (!draft.label.trim()) {
      toast("Design name is required.", "error");

      return;
    }

    try {
      setSavingDesignId(designId);

      const response = await apiFetch(`/admin/design-options/${designId}`, {
        method: "PUT",

        body: JSON.stringify({
          label: draft.label.trim(),

          sort_order: Number(draft.sort_order || 0),

          status: draft.status || "active",
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.message || "Unable to update design option.");
      }

      toast("Design option updated.");

      await load();
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Unable to update design option.",
        "error",
      );
    } finally {
      setSavingDesignId(null);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Delete Design
  |--------------------------------------------------------------------------
  */

  async function deleteDesign(design: DesignOption) {
    const confirmed = await confirm({
      title: "Delete design option?",

      description: `Delete "${
        design.label || `Design ${design.id}`
      }" and all its images? This cannot be undone.`,

      confirmLabel: "Delete design",

      tone: "danger",
    });

    if (!confirmed) {
      return;
    }

    try {
      const response = await apiFetch(`/admin/design-options/${design.id}`, {
        method: "DELETE",
      });

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(json?.message || "Unable to delete design option.");
      }

      toast("Design option deleted.");

      await load();
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Unable to delete design option.",
        "error",
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Upload Design Images
  |--------------------------------------------------------------------------
  |
  | Exact relationship:
  |
  | design_option_id
  | +
  | color_id
  |
  | Example:
  |
  | Square + Pink
  | Square + Black
  | Square + Deep Maroon
  |
  |--------------------------------------------------------------------------
  */

  async function uploadImages(
    design: DesignOption,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const files = Array.from(event.target.files || []);

    if (!files.length) {
      return;
    }

    const selectedColorId = uploadColorIds[design.id] || "";

    try {
      setUploadingDesignId(design.id);

      /*
      |--------------------------------------------------------------------------
      | Current Images in Same Group
      |--------------------------------------------------------------------------
      */

      const groupImages = (design.images || []).filter((image) =>
        selectedColorId
          ? Number(image.color_id) === Number(selectedColorId)
          : image.color_id === null || image.color_id === undefined,
      );

      /*
      |--------------------------------------------------------------------------
      | Upload Every File
      |--------------------------------------------------------------------------
      */

      for (let index = 0; index < files.length; index += 1) {
        const formData = new FormData();

        formData.append("image", files[index]);

        /*
        |--------------------------------------------------------------------------
        | Selected Color
        |--------------------------------------------------------------------------
        */

        if (selectedColorId) {
          formData.append("color_id", selectedColorId);
        }

        /*
        |--------------------------------------------------------------------------
        | First Image in Group = Primary
        |--------------------------------------------------------------------------
        */

        if (groupImages.length === 0 && index === 0) {
          formData.append("is_primary", "1");
        }

        /*
        |--------------------------------------------------------------------------
        | Sort Order
        |--------------------------------------------------------------------------
        */

        formData.append("sort_order", String(groupImages.length + index));

        /*
        |--------------------------------------------------------------------------
        | Upload
        |--------------------------------------------------------------------------
        */

        const response = await apiFetch(
          `/admin/design-options/${design.id}/images`,
          {
            method: "POST",

            body: formData,
          },
        );

        const json = await response.json();

        if (!response.ok) {
          throw new Error(
            json?.message || `Unable to upload ${files[index].name}.`,
          );
        }
      }

      toast(
        files.length === 1
          ? `Image uploaded to ${design.label || `Design ${design.id}`}.`
          : `${files.length} images uploaded to ${
              design.label || `Design ${design.id}`
            }.`,
      );

      await load();
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Unable to upload design images.",
        "error",
      );
    } finally {
      setUploadingDesignId(null);

      event.target.value = "";
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Delete Design Image
  |--------------------------------------------------------------------------
  */

  async function deleteImage(image: DesignImage) {
    const confirmed = await confirm({
      title: "Delete design image?",

      description: `Delete this ${colorName(
        image.color_id,
      )} design image permanently?`,

      confirmLabel: "Delete image",

      tone: "danger",
    });

    if (!confirmed) {
      return;
    }

    try {
      const response = await apiFetch(`/admin/design-images/${image.id}`, {
        method: "DELETE",
      });

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(json?.message || "Unable to delete design image.");
      }

      toast("Design image deleted.");

      await load();
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Unable to delete design image.",
        "error",
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Set Primary Design Image
  |--------------------------------------------------------------------------
  |
  | Primary is scoped to:
  |
  | design_id + color_id
  |
  */

  async function setPrimary(image: DesignImage) {
    try {
      const response = await apiFetch(
        `/admin/design-images/${image.id}/primary`,
        {
          method: "PUT",
        },
      );

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(json?.message || "Unable to set primary design image.");
      }

      toast(`Primary ${colorName(image.color_id)} image updated.`);

      await load();
    } catch (err) {
      toast(
        err instanceof Error
          ? err.message
          : "Unable to set primary design image.",
        "error",
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Filter Images
  |--------------------------------------------------------------------------
  */

  function filteredImages(design: DesignOption) {
    const filter = imageFilters[design.id] || "all";

    const images = Array.isArray(design.images) ? design.images : [];

    /*
    |--------------------------------------------------------------------------
    | All
    |--------------------------------------------------------------------------
    */

    if (filter === "all") {
      return images;
    }

    /*
    |--------------------------------------------------------------------------
    | General
    |--------------------------------------------------------------------------
    */

    if (filter === "general") {
      return images.filter(
        (image) => image.color_id === null || image.color_id === undefined,
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Color
    |--------------------------------------------------------------------------
    */

    return images.filter((image) => Number(image.color_id) === Number(filter));
  }

  /*
  |--------------------------------------------------------------------------
  | Design Counts
  |--------------------------------------------------------------------------
  */

  const totalImages = useMemo(
    () =>
      designs.reduce(
        (total, design) => total + (design.images || []).length,
        0,
      ),
    [designs],
  );

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <section className="rounded-2xl border border-[#e5dfd8] bg-white p-6 shadow-[0_10px_35px_rgba(45,27,20,.04)]">
        <div className="h-5 w-40 animate-pulse rounded bg-gray-100" />

        <div className="mt-3 h-4 w-72 animate-pulse rounded bg-gray-100" />

        <div className="mt-6 h-36 animate-pulse rounded-2xl bg-gray-50" />
      </section>
    );
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
            Optional visual variations
          </p>

          <h2 className="mt-2 text-lg font-semibold text-gray-900">
            Design Options
          </h2>

          <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-500">
            Add optional product-specific designs such as Square, Diamond or
            Floral. Each design can have separate images for every product
            color.
          </p>

          <p className="mt-2 text-xs text-gray-400">
            {designs.length} design
            {designs.length === 1 ? "" : "s"} · {totalImages} image
            {totalImages === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {/* ================================================================
          ERROR
      ================================================================ */}

      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ================================================================
          ADD DESIGN
      ================================================================ */}

      <div className="mt-6 rounded-2xl border border-dashed border-[#d8cfc7] bg-[#fffdf9] p-4">
        <p className="text-xs font-semibold uppercase tracking-[.12em] text-gray-400">
          Add new design
        </p>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={newDesignLabel}
            onChange={(event) => setNewDesignLabel(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();

                void createDesign();
              }
            }}
            placeholder="e.g. Square"
            className="
              flex-1
              rounded-xl
              border
              border-gray-300
              bg-white
              px-4
              py-2.5
              text-sm
              outline-none
              focus:border-[#a8822b]
              focus:ring-2
              focus:ring-[#a8822b]/10
            "
          />

          <button
            type="button"
            disabled={creating}
            onClick={() => void createDesign()}
            className="
              inline-flex
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
              disabled:opacity-50
            "
          >
            <Plus size={16} />

            {creating ? "Adding..." : "Add design"}
          </button>
        </div>
      </div>

      {/* ================================================================
          EMPTY
      ================================================================ */}

      {designs.length === 0 ? (
        <div className="mt-6 flex min-h-48 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50/60">
          <div className="max-w-sm text-center">
            <ImagePlus size={36} className="mx-auto text-gray-300" />

            <p className="mt-3 text-sm font-semibold text-gray-700">
              No design options
            </p>

            <p className="mt-1 text-xs leading-5 text-gray-500">
              {productName || "This product"} currently uses only its normal
              Size + Color variants. Designs are completely optional.
            </p>
          </div>
        </div>
      ) : (
        /* ================================================================
            DESIGNS
        ================================================================ */

        <div className="mt-6 space-y-4">
          {designs
            .slice()
            .sort(
              (a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0),
            )
            .map((design) => {
              const expanded = expandedDesignIds.includes(design.id);

              const draft = drafts[design.id] || {
                label: design.label || "",

                sort_order: String(design.sort_order || 0),

                status: design.status || "active",
              };

              const images = filteredImages(design);

              const uploadColorId = uploadColorIds[design.id] || "";

              const filter = imageFilters[design.id] || "all";

              const active = design.status === "active";

              return (
                <div
                  key={design.id}
                  className="
                      overflow-hidden
                      rounded-2xl
                      border
                      border-gray-200
                      bg-white
                    "
                >
                  {/* ====================================================
                        DESIGN HEADER
                    ==================================================== */}

                  <div className="flex flex-wrap items-center justify-between gap-3 bg-[#fffdf9] px-4 py-4 sm:px-5">
                    <button
                      type="button"
                      onClick={() => toggleExpanded(design.id)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <div
                        className={`
                            flex
                            h-10
                            w-10
                            shrink-0
                            items-center
                            justify-center
                            rounded-xl
                            text-sm
                            font-bold

                            ${
                              active
                                ? "bg-[#f6ead0] text-[#89681d]"
                                : "bg-gray-100 text-gray-500"
                            }
                          `}
                      >
                        {design.label?.trim().charAt(0).toUpperCase() || "D"}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-sm font-semibold text-gray-900">
                            {design.label || `Design ${design.id}`}
                          </h3>

                          <span
                            className={`
                                rounded-full
                                px-2
                                py-0.5
                                text-[10px]
                                font-semibold
                                uppercase

                                ${
                                  active
                                    ? "bg-green-50 text-green-700"
                                    : "bg-gray-100 text-gray-500"
                                }
                              `}
                          >
                            {design.status}
                          </span>
                        </div>

                        <p className="mt-0.5 text-xs text-gray-500">
                          {(design.images || []).length} image
                          {(design.images || []).length === 1 ? "" : "s"}
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleExpanded(design.id)}
                      className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:bg-white"
                    >
                      {expanded ? (
                        <ChevronUp size={17} />
                      ) : (
                        <ChevronDown size={17} />
                      )}
                    </button>
                  </div>

                  {/* ====================================================
                        EXPANDED CONTENT
                    ==================================================== */}

                  {expanded && (
                    <div className="border-t border-gray-100 p-4 sm:p-5">
                      {/* ================================================
                            DESIGN DETAILS
                        ================================================ */}

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_130px_160px_auto]">
                        {/* ----------------------------------------------
                              LABEL
                          ---------------------------------------------- */}

                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                            Design Name
                          </label>

                          <input
                            type="text"
                            value={draft.label}
                            onChange={(event) =>
                              updateDraft(
                                design.id,

                                "label",

                                event.target.value,
                              )
                            }
                            className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#a8822b]"
                          />
                        </div>

                        {/* ----------------------------------------------
                              SORT ORDER
                          ---------------------------------------------- */}

                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                            Sort Order
                          </label>

                          <input
                            type="number"
                            min="0"
                            value={draft.sort_order}
                            onChange={(event) =>
                              updateDraft(
                                design.id,

                                "sort_order",

                                event.target.value,
                              )
                            }
                            className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#a8822b]"
                          />
                        </div>

                        {/* ----------------------------------------------
                              STATUS
                          ---------------------------------------------- */}

                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                            Status
                          </label>

                          <select
                            value={draft.status}
                            onChange={(event) =>
                              updateDraft(
                                design.id,

                                "status",

                                event.target.value,
                              )
                            }
                            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#a8822b]"
                          >
                            <option value="active">Active</option>

                            <option value="inactive">Inactive</option>
                          </select>
                        </div>

                        {/* ----------------------------------------------
                              SAVE + DELETE
                          ---------------------------------------------- */}

                        <div className="flex items-end gap-2">
                          <button
                            type="button"
                            disabled={savingDesignId === design.id}
                            onClick={() => void saveDesign(design.id)}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-900 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-50"
                          >
                            <Save size={15} />

                            {savingDesignId === design.id
                              ? "Saving..."
                              : "Save"}
                          </button>

                          <button
                            type="button"
                            title="Delete design"
                            onClick={() => void deleteDesign(design)}
                            className="inline-flex items-center justify-center rounded-xl border border-red-200 p-2.5 text-red-600 transition hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {/* ================================================
                            DESIGN IMAGES
                        ================================================ */}

                      <div className="mt-7 border-t border-gray-100 pt-6">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900">
                              Design Images
                            </h4>

                            <p className="mt-1 text-xs leading-5 text-gray-500">
                              Upload general images or color-specific images for{" "}
                              <strong>
                                {design.label || `Design ${design.id}`}
                              </strong>
                              .
                            </p>
                          </div>

                          {/* ============================================
                                UPLOAD
                            ============================================ */}

                          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                            {/* ------------------------------------------
                                  UPLOAD COLOR
                              ------------------------------------------ */}

                            <select
                              value={uploadColorId}
                              onChange={(event) =>
                                setUploadColorIds((current) => ({
                                  ...current,

                                  [design.id]: event.target.value,
                                }))
                              }
                              className="rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#a8822b]"
                            >
                              <option value="">General / all colors</option>

                              {colors.map((color) => (
                                <option key={color.id} value={color.id}>
                                  {color.name}
                                </option>
                              ))}
                            </select>

                            {/* ------------------------------------------
                                  UPLOAD FILE
                              ------------------------------------------ */}

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

                                  ${
                                    uploadingDesignId === design.id
                                      ? "pointer-events-none opacity-50"
                                      : ""
                                  }
                                `}
                            >
                              <ImagePlus size={16} />

                              {uploadingDesignId === design.id
                                ? "Uploading..."
                                : "Upload images"}

                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                multiple
                                disabled={uploadingDesignId === design.id}
                                onChange={(event) =>
                                  void uploadImages(
                                    design,

                                    event,
                                  )
                                }
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>

                        {/* ================================================
                              IMAGE FILTERS
                          ================================================ */}

                        <div className="mt-5 flex flex-wrap items-center gap-2">
                          <span className="mr-1 text-[10px] font-semibold uppercase tracking-[.12em] text-gray-400">
                            View
                          </span>

                          {/* ----------------------------------------------
                                ALL
                            ---------------------------------------------- */}

                          <button
                            type="button"
                            onClick={() =>
                              setImageFilters((current) => ({
                                ...current,

                                [design.id]: "all",
                              }))
                            }
                            className={`
                                rounded-full
                                border
                                px-3
                                py-1.5
                                text-xs
                                font-medium

                                ${
                                  filter === "all"
                                    ? "border-[#650b12] bg-[#650b12] text-white"
                                    : "border-gray-200 bg-white text-gray-600"
                                }
                              `}
                          >
                            All ({(design.images || []).length})
                          </button>

                          {/* ----------------------------------------------
                                GENERAL
                            ---------------------------------------------- */}

                          <button
                            type="button"
                            onClick={() =>
                              setImageFilters((current) => ({
                                ...current,

                                [design.id]: "general",
                              }))
                            }
                            className={`
                                rounded-full
                                border
                                px-3
                                py-1.5
                                text-xs
                                font-medium

                                ${
                                  filter === "general"
                                    ? "border-[#650b12] bg-[#650b12] text-white"
                                    : "border-gray-200 bg-white text-gray-600"
                                }
                              `}
                          >
                            General
                          </button>

                          {/* ----------------------------------------------
                                COLORS
                            ---------------------------------------------- */}

                          {colors.map((color) => (
                            <button
                              type="button"
                              key={color.id}
                              onClick={() =>
                                setImageFilters((current) => ({
                                  ...current,

                                  [design.id]: String(color.id),
                                }))
                              }
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
                                      filter === String(color.id)
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

                        {/* ================================================
                              EMPTY IMAGE GROUP
                          ================================================ */}

                        {images.length === 0 ? (
                          <div className="mt-5 flex min-h-36 items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/60">
                            <div className="text-center">
                              <ImagePlus
                                size={30}
                                className="mx-auto text-gray-300"
                              />

                              <p className="mt-2 text-xs font-semibold text-gray-600">
                                No images in this group
                              </p>
                            </div>
                          </div>
                        ) : (
                          /* ==============================================
                                IMAGES GRID
                            ============================================== */

                          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                            {images.map((image) => {
                              const primary = Boolean(Number(image.is_primary));

                              const label = colorName(image.color_id);

                              return (
                                <div
                                  key={image.id}
                                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
                                >
                                  {/* ----------------------------------
                                          IMAGE
                                      ---------------------------------- */}

                                  <div className="relative aspect-square overflow-hidden bg-gray-100">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}

                                    <img
                                      src={imageSrc(image)}
                                      alt={
                                        image.alt_text ||
                                        `${design.label || "Design"} ${label}`
                                      }
                                      className="h-full w-full object-cover"
                                    />

                                    {/* --------------------------------
                                            BADGES
                                        -------------------------------- */}

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

                                  {/* ----------------------------------
                                          ACTIONS
                                      ---------------------------------- */}

                                  <div className="grid grid-cols-2 gap-2 p-3">
                                    <button
                                      type="button"
                                      disabled={primary}
                                      onClick={() => void setPrimary(image)}
                                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-2 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-40"
                                    >
                                      <Star size={13} />
                                      Primary
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => void deleteImage(image)}
                                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 px-2 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                                    >
                                      <Trash2 size={13} />
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </section>
  );
}
