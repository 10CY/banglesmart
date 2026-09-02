"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Pencil,
  Plus,
  Trash2,
  X,
  Image as ImageIcon,
  RefreshCw,
} from "lucide-react";

import { apiFetch } from "@/lib/api";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type Category = {
  id: number;
  parent_id?: number | null;

  name: string;
  slug: string;

  description?: string | null;

  image?: string | null;
  image_url?: string | null;

  status: string;
  sort_order: number;

  parent?: {
    id: number;
    name: string;
  } | null;

  children_count?: number;

  created_at?: string;
  updated_at?: string;
};

type ApiResponse = {
  success?: boolean;
  message?: string;

  data?: Category[] | {
    data?: Category[];
  };

  errors?: Record<string, string[]>;
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function getImageUrl(category: Category): string {
  if (category.image_url) {
    return category.image_url;
  }

  if (!category.image) {
    return "";
  }

  if (
    category.image.startsWith("http://") ||
    category.image.startsWith("https://")
  ) {
    return category.image;
  }

  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://127.0.0.1:8000";

  return `${backendUrl}/storage/${category.image.replace(/^\/+/, "")}`;
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function CategoriesPage() {
  /* ------------------------------------------------------------------------ */
  /* State                                                                    */
  /* ------------------------------------------------------------------------ */

  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [showForm, setShowForm] = useState(false);

  const [editing, setEditing] = useState<Category | null>(null);

  const [error, setError] = useState("");

  /* Form */

  const [name, setName] = useState("");

  const [description, setDescription] = useState("");

  const [status, setStatus] = useState("active");

  const [sortOrder, setSortOrder] = useState("0");

  const [parentId, setParentId] = useState("");

  const [image, setImage] = useState<File | null>(null);

  const [imagePreview, setImagePreview] = useState("");

  /* ------------------------------------------------------------------------ */
  /* Fetch categories                                                         */
  /* ------------------------------------------------------------------------ */

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiFetch("/admin/categories");

      const json: ApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(
          json?.message || "Unable to load categories.",
        );
      }

      let categoryData: Category[] = [];

      /*
       * Supports:
       *
       * {
       *   success: true,
       *   data: [...]
       * }
       *
       * and:
       *
       * {
       *   success: true,
       *   data: {
       *     data: [...]
       *   }
       * }
       */

      if (Array.isArray(json?.data)) {
        categoryData = json.data;
      } else if (
        json?.data &&
        !Array.isArray(json.data) &&
        Array.isArray(json.data.data)
      ) {
        categoryData = json.data.data;
      }

      setCategories(categoryData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load categories.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /* ------------------------------------------------------------------------ */
  /* Initial load                                                             */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  /* ------------------------------------------------------------------------ */
  /* Category map                                                             */
  /* ------------------------------------------------------------------------ */

  const categoryMap = useMemo(() => {
    return new Map(
      categories.map((category) => [
        Number(category.id),
        category,
      ]),
    );
  }, [categories]);

  /* ------------------------------------------------------------------------ */
  /* Parent options                                                           */
  /* ------------------------------------------------------------------------ */

  const parentOptions = useMemo(() => {
    return categories
      .filter((category) => {
        const isTopLevel =
          category.parent_id === null ||
          category.parent_id === undefined ||
          Number(category.parent_id) === 0;

        const isNotCurrent =
          editing === null ||
          Number(category.id) !== Number(editing.id);

        return isTopLevel && isNotCurrent;
      })
      .sort((a, b) => {
        const orderDifference =
          Number(a.sort_order || 0) -
          Number(b.sort_order || 0);

        if (orderDifference !== 0) {
          return orderDifference;
        }

        return a.name.localeCompare(b.name);
      });
  }, [categories, editing]);

  /* ------------------------------------------------------------------------ */
  /* Parent name                                                              */
  /* ------------------------------------------------------------------------ */

  function getParentName(category: Category) {
    if (
      category.parent_id === null ||
      category.parent_id === undefined ||
      Number(category.parent_id) === 0
    ) {
      return "Top level";
    }

    return (
      categoryMap.get(Number(category.parent_id))?.name ||
      category.parent?.name ||
      "Top level"
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Top level check                                                          */
  /* ------------------------------------------------------------------------ */

  function isTopLevel(category: Category) {
    return (
      category.parent_id === null ||
      category.parent_id === undefined ||
      Number(category.parent_id) === 0
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Reset form                                                               */
  /* ------------------------------------------------------------------------ */

  function resetForm() {
    setName("");
    setDescription("");
    setStatus("active");
    setSortOrder("0");
    setParentId("");

    setImage(null);
    setImagePreview("");

    setEditing(null);
    setError("");
  }

  /* ------------------------------------------------------------------------ */
  /* Open create                                                              */
  /* ------------------------------------------------------------------------ */

  function openCreate() {
    resetForm();
    setShowForm(true);
  }

  /* ------------------------------------------------------------------------ */
  /* Open edit                                                                */
  /* ------------------------------------------------------------------------ */

  function openEdit(category: Category) {
    setError("");

    setEditing(category);

    setName(category.name || "");

    setDescription(category.description || "");

    setStatus(category.status || "active");

    setSortOrder(
      String(category.sort_order ?? 0),
    );

    if (
      category.parent_id !== null &&
      category.parent_id !== undefined &&
      Number(category.parent_id) !== 0
    ) {
      setParentId(String(category.parent_id));
    } else {
      setParentId("");
    }

    setImage(null);

    const existingImage = getImageUrl(category);

    setImagePreview(existingImage);

    setShowForm(true);
  }

  /* ------------------------------------------------------------------------ */
  /* Close form                                                               */
  /* ------------------------------------------------------------------------ */

  function closeForm() {
    if (saving) {
      return;
    }

    setShowForm(false);
    resetForm();
  }

  /* ------------------------------------------------------------------------ */
  /* Image selection                                                          */
  /* ------------------------------------------------------------------------ */

  function handleImageChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    /*
     * Backend currently allows max 2 MB.
     */

    if (file.size > 2 * 1024 * 1024) {
      setError("Image size must be less than 2 MB.");
      return;
    }

    setError("");

    setImage(file);

    const previewUrl = URL.createObjectURL(file);

    setImagePreview(previewUrl);
  }

  /* ------------------------------------------------------------------------ */
  /* Submit                                                                   */
  /* ------------------------------------------------------------------------ */

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      setError("Category name is required.");
      return;
    }

    if (
      editing &&
      parentId &&
      Number(parentId) === Number(editing.id)
    ) {
      setError(
        "A category cannot be its own parent.",
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const endpoint = editing
        ? `/admin/categories/${editing.id}`
        : "/admin/categories";

      const formData = new FormData();

      formData.append(
        "name",
        name.trim(),
      );

      formData.append(
        "description",
        description.trim(),
      );

      formData.append(
        "status",
        status,
      );

      formData.append(
        "sort_order",
        String(Number(sortOrder) || 0),
      );

      /*
       * Send parent_id only when a parent is selected.
       *
       * If empty, backend receives no parent_id and will
       * keep/create it as top-level.
       */

      if (parentId) {
        formData.append(
          "parent_id",
          parentId,
        );
      }

      /*
       * IMPORTANT:
       *
       * Field name must be "image".
       *
       * This matches:
       *
       * imageUpload("categories").single("image")
       */

      if (image) {
        formData.append(
          "image",
          image,
        );
      }

      /*
       * IMPORTANT:
       *
       * This is a Node/Express backend.
       *
       * Do NOT use Laravel "_method=PUT".
       *
       * Use actual PUT for editing.
       */

      const response = await apiFetch(
        endpoint,
        {
          method: editing
            ? "PUT"
            : "POST",

          body: formData,
        },
      );

      const json = await response.json();

      if (!response.ok) {
        const validationErrors =
          json?.errors as
            | Record<string, string[]>
            | undefined;

        let firstValidationError = "";

        if (validationErrors) {
          const firstKey =
            Object.keys(validationErrors)[0];

          if (firstKey) {
            firstValidationError =
              validationErrors[firstKey]?.[0] || "";
          }
        }

        throw new Error(
          json?.message ||
            firstValidationError ||
            "Unable to save category.",
        );
      }

      /*
       * Close form only after successful save.
       */

      setShowForm(false);
      resetForm();

      /*
       * Reload categories.
       */

      await fetchCategories();

      /*
       * Notify other storefront components.
       */

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new Event(
            "banglesmart:catalog-refresh",
          ),
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save category.",
      );
    } finally {
      setSaving(false);
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Delete                                                                   */
  /* ------------------------------------------------------------------------ */

  async function deleteCategory(
    category: Category,
  ) {
    const confirmed = window.confirm(
      `Delete "${category.name}"?\n\nAre you sure you want to delete this category?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(category.id);
      setError("");

      const response = await apiFetch(
        `/admin/categories/${category.id}`,
        {
          method: "DELETE",
        },
      );

      const json = await response.json().catch(
        () => null,
      );

      if (!response.ok) {
        throw new Error(
          json?.message ||
            "Unable to delete category.",
        );
      }

      await fetchCategories();

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new Event(
            "banglesmart:catalog-refresh",
          ),
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete category.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Render                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="min-h-full">
      {/* ================================================================== */}
      {/* HEADER                                                             */}
      {/* ================================================================== */}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c9a227]">
            Store taxonomy
          </p>

          <h1 className="mt-2 text-3xl font-semibold text-gray-900">
            Categories
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Create parent categories and
            subcategories for the storefront
            mega menu.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void fetchCategories()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh
          </button>

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-black"
          >
            <Plus size={18} />

            Add category
          </button>
        </div>
      </div>

      {/* ================================================================== */}
      {/* ERROR                                                              */}
      {/* ================================================================== */}

      {error && !showForm && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ================================================================== */}
      {/* TABLE                                                              */}
      {/* ================================================================== */}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px]">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Category
                </th>

                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Parent
                </th>

                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Status
                </th>

                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Order
                </th>

                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {/* ======================================================== */}
              {/* LOADING                                                   */}
              {/* ======================================================== */}

              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-16 text-center text-sm text-gray-500"
                  >
                    Loading categories...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                /* ====================================================== */
                /* EMPTY                                                    */
                /* ====================================================== */

                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-16 text-center"
                  >
                    <div className="flex flex-col items-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-50">
                        <ImageIcon
                          size={25}
                          className="text-gray-300"
                        />
                      </div>

                      <p className="mt-4 text-sm font-medium text-gray-700">
                        No categories yet
                      </p>

                      <p className="mt-1 text-sm text-gray-400">
                        Create your first category.
                      </p>

                      <button
                        type="button"
                        onClick={openCreate}
                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-black"
                      >
                        <Plus size={16} />
                        Add category
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                /* ====================================================== */
                /* DATA                                                     */
                /* ====================================================== */

                categories
                  .slice()
                  .sort((a, b) => {
                    /*
                     * Parent categories first.
                     */

                    const aParent =
                      isTopLevel(a);

                    const bParent =
                      isTopLevel(b);

                    if (
                      aParent &&
                      !bParent
                    ) {
                      return -1;
                    }

                    if (
                      !aParent &&
                      bParent
                    ) {
                      return 1;
                    }

                    /*
                     * Then sort order.
                     */

                    const order =
                      Number(
                        a.sort_order || 0,
                      ) -
                      Number(
                        b.sort_order || 0,
                      );

                    if (order !== 0) {
                      return order;
                    }

                    /*
                     * Finally name.
                     */

                    return a.name.localeCompare(
                      b.name,
                    );
                  })
                  .map((category) => {
                    const topLevel =
                      isTopLevel(category);

                    const categoryImage =
                      getImageUrl(category);

                    return (
                      <tr
                        key={category.id}
                        className="transition hover:bg-gray-50"
                      >
                        {/* ================================================== */}
                        {/* CATEGORY                                           */}
                        {/* ================================================== */}

                        <td className="px-5 py-4">
                          <div
                            className={`flex items-start gap-3 ${
                              !topLevel
                                ? "pl-7"
                                : ""
                            }`}
                          >
                            {!topLevel ? (
                              <span className="mt-2 text-sm text-gray-300">
                                ↳
                              </span>
                            ) : (
                              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#c9a227]" />
                            )}

                            {/* IMAGE */}

                            {categoryImage ? (
                              <img
                                src={
                                  categoryImage
                                }
                                alt={
                                  category.name
                                }
                                className="h-11 w-11 shrink-0 rounded-lg border border-gray-200 object-cover"
                                onError={(
                                  event,
                                ) => {
                                  event.currentTarget.style.display =
                                    "none";
                                }}
                              />
                            ) : (
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
                                <ImageIcon
                                  size={18}
                                  className="text-gray-300"
                                />
                              </div>
                            )}

                            <div className="min-w-0">
                              <p
                                className={`${
                                  topLevel
                                    ? "font-semibold"
                                    : "font-medium"
                                } text-gray-900`}
                              >
                                {category.name}
                              </p>

                              <p className="mt-0.5 text-xs text-gray-400">
                                /{category.slug}
                              </p>

                              {category.description && (
                                <p className="mt-1 max-w-md truncate text-xs text-gray-500">
                                  {
                                    category.description
                                  }
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* ================================================== */}
                        {/* PARENT                                             */}
                        {/* ================================================== */}

                        <td className="px-5 py-4 text-sm text-gray-500">
                          {getParentName(
                            category,
                          )}
                        </td>

                        {/* ================================================== */}
                        {/* STATUS                                             */}
                        {/* ================================================== */}

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              category.status ===
                              "active"
                                ? "bg-green-50 text-green-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {category.status}
                          </span>
                        </td>

                        {/* ================================================== */}
                        {/* SORT                                               */}
                        {/* ================================================== */}

                        <td className="px-5 py-4 text-sm text-gray-600">
                          {category.sort_order}
                        </td>

                        {/* ================================================== */}
                        {/* ACTIONS                                             */}
                        {/* ================================================== */}

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                openEdit(
                                  category,
                                )
                              }
                              className="rounded-lg border border-gray-200 p-2 transition hover:bg-gray-100"
                              title="Edit category"
                              disabled={
                                deletingId !==
                                null
                              }
                            >
                              <Pencil
                                size={16}
                              />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                void deleteCategory(
                                  category,
                                )
                              }
                              disabled={
                                deletingId ===
                                category.id
                              }
                              className="rounded-lg border border-gray-200 p-2 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                              title="Delete category"
                            >
                              {deletingId ===
                              category.id ? (
                                <RefreshCw
                                  size={16}
                                  className="animate-spin"
                                />
                              ) : (
                                <Trash2
                                  size={16}
                                />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================================================================== */}
      {/* ADD / EDIT DRAWER                                                  */}
      {/* ================================================================== */}

      {showForm && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-[2px]">
          <div className="h-full w-full max-w-lg overflow-y-auto bg-white shadow-2xl">
            {/* ============================================================ */}
            {/* DRAWER HEADER                                                */}
            {/* ============================================================ */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c9a227]">
                  Store navigation
                </p>

                <h2 className="mt-1 text-lg font-semibold text-gray-900">
                  {editing
                    ? "Edit category"
                    : "Add category"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-lg p-2 transition hover:bg-gray-100 disabled:opacity-50"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* ============================================================ */}
            {/* FORM                                                         */}
            {/* ============================================================ */}

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >
              {/* ======================================================== */}
              {/* FORM ERROR                                               */}
              {/* ======================================================== */}

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* ======================================================== */}
              {/* NAME                                                      */}
              {/* ======================================================== */}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">
                  Category name
                </label>

                <input
                  required
                  value={name}
                  onChange={(event) =>
                    setName(
                      event.target.value,
                    )
                  }
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/10"
                  placeholder="e.g. Glass Bangles"
                />
              </div>

              {/* ======================================================== */}
              {/* IMAGE                                                     */}
              {/* ======================================================== */}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">
                  Category Image
                </label>

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={
                    handleImageChange
                  }
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                />

                <p className="mt-2 text-xs text-gray-500">
                  JPG, PNG or WebP. Maximum
                  2 MB.
                </p>

                {/* IMAGE PREVIEW */}

                {imagePreview && (
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-medium text-gray-500">
                      Preview
                    </p>

                    <div className="relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Category preview"
                        className="h-36 w-36 rounded-xl border border-gray-200 object-cover"
                      />

                      {image && (
                        <button
                          type="button"
                          onClick={() => {
                            setImage(null);

                            if (
                              editing
                            ) {
                              setImagePreview(
                                getImageUrl(
                                  editing,
                                ),
                              );
                            } else {
                              setImagePreview(
                                "",
                              );
                            }
                          }}
                          className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-gray-900 text-white shadow"
                          title="Remove selected image"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ======================================================== */}
              {/* PARENT                                                     */}
              {/* ======================================================== */}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">
                  Parent category
                </label>

                <select
                  value={parentId}
                  onChange={(event) =>
                    setParentId(
                      event.target.value,
                    )
                  }
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/10"
                >
                  <option value="">
                    Top-level category
                  </option>

                  {parentOptions.map(
                    (option) => (
                      <option
                        key={option.id}
                        value={
                          option.id
                        }
                      >
                        {option.name}
                      </option>
                    ),
                  )}
                </select>

                {parentOptions.length ===
                0 ? (
                  <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                    No other top-level
                    categories are
                    available. This
                    category will be
                    top-level.
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-gray-500">
                    Select a parent to
                    make this a
                    subcategory.
                  </p>
                )}
              </div>

              {/* ======================================================== */}
              {/* DESCRIPTION                                               */}
              {/* ======================================================== */}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(
                      event.target.value,
                    )
                  }
                  rows={4}
                  className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/10"
                  placeholder="Optional category description"
                />
              </div>

              {/* ======================================================== */}
              {/* STATUS + SORT ORDER                                       */}
              {/* ======================================================== */}

              <div className="grid gap-4 sm:grid-cols-2">
                {/* STATUS */}

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900">
                    Status
                  </label>

                  <select
                    value={status}
                    onChange={(event) =>
                      setStatus(
                        event.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#c9a227]"
                  >
                    <option value="active">
                      Active
                    </option>

                    <option value="inactive">
                      Inactive
                    </option>
                  </select>
                </div>

                {/* SORT */}

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900">
                    Sort order
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={sortOrder}
                    onChange={(event) =>
                      setSortOrder(
                        event.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#c9a227]"
                  />
                </div>
              </div>

              {/* ======================================================== */}
              {/* BUTTONS                                                    */}
              {/* ======================================================== */}

              <div className="flex gap-3 border-t border-gray-100 pt-5">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  disabled={saving}
                  type="submit"
                  className="flex-1 rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editing
                      ? "Save changes"
                      : "Create category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}