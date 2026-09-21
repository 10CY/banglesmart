"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

import Link from "next/link";

import { ArrowLeft, Save } from "lucide-react";

import { useParams } from "next/navigation";

import ProductVariants from "@/components/admin/products/ProductVariants";

import ProductDesignOptions from "@/components/admin/products/ProductDesignOptions";

import ProductImageManager from "@/components/admin/products/ProductImageManager";

import { useAdminFeedback } from "@/components/admin/ui/AdminFeedbackProvider";

import { apiFetch } from "@/lib/api";

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

type Category = {
  id: number;
  name: string;
  status: string;
};

type Material = {
  id: number;
  name: string;
  status: string;
};

type Product = {
  id: number;

  name: string;

  category_id: number | null;

  material_id: number | null;

  sku: string | null;

  short_description: string | null;

  description: string | null;

  mrp: number | string | null;

  selling_price: number | string | null;

  set_quantity: number | string | null;

  status: string;

  featured: boolean | number | string;

  best_seller: boolean | number | string;

  new_arrival: boolean | number | string;

  seo_title: string | null;

  seo_description: string | null;
};

/*
|--------------------------------------------------------------------------
| Boolean Helper
|--------------------------------------------------------------------------
*/

function toBoolean(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || value === "true";
}

/*
|--------------------------------------------------------------------------
| Edit Product Page
|--------------------------------------------------------------------------
*/

export default function EditProductPage() {
  const params = useParams();

  const { toast } = useAdminFeedback();

  const productId = String(params.id || "");

  /*
  |--------------------------------------------------------------------------
  | Master Data
  |--------------------------------------------------------------------------
  */

  const [categories, setCategories] = useState<Category[]>([]);

  const [materials, setMaterials] = useState<Material[]>([]);

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Product Information
  |--------------------------------------------------------------------------
  */

  const [name, setName] = useState("");

  const [categoryId, setCategoryId] = useState("");

  const [materialId, setMaterialId] = useState("");

  const [sku, setSku] = useState("");

  const [shortDescription, setShortDescription] = useState("");

  const [description, setDescription] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Pricing
  |--------------------------------------------------------------------------
  */

  const [mrp, setMrp] = useState("");

  const [sellingPrice, setSellingPrice] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Other Product Data
  |--------------------------------------------------------------------------
  */

  const [setQuantity, setSetQuantity] = useState("1");

  const [status, setStatus] = useState("active");

  const [featured, setFeatured] = useState(false);

  const [bestSeller, setBestSeller] = useState(false);

  const [newArrival, setNewArrival] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | SEO
  |--------------------------------------------------------------------------
  */

  const [seoTitle, setSeoTitle] = useState("");

  const [seoDescription, setSeoDescription] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Populate Product State
  |--------------------------------------------------------------------------
  */

  const populateProduct = useCallback((product: Product) => {
    setName(product.name || "");

    setCategoryId(
      product.category_id !== null && product.category_id !== undefined
        ? String(product.category_id)
        : "",
    );

    setMaterialId(
      product.material_id !== null && product.material_id !== undefined
        ? String(product.material_id)
        : "",
    );

    setSku(product.sku || "");

    setShortDescription(product.short_description || "");

    setDescription(product.description || "");

    setMrp(
      product.mrp !== null && product.mrp !== undefined
        ? String(product.mrp)
        : "",
    );

    setSellingPrice(
      product.selling_price !== null && product.selling_price !== undefined
        ? String(product.selling_price)
        : "",
    );

    setSetQuantity(
      product.set_quantity !== null && product.set_quantity !== undefined
        ? String(product.set_quantity)
        : "1",
    );

    setStatus(product.status || "active");

    /*
        |--------------------------------------------------------------------------
        | IMPORTANT
        |--------------------------------------------------------------------------
        |
        | Boolean("0") is true.
        |
        | So always use our helper.
        |
        */

    setFeatured(toBoolean(product.featured));

    setBestSeller(toBoolean(product.best_seller));

    setNewArrival(toBoolean(product.new_arrival));

    setSeoTitle(product.seo_title || "");

    setSeoDescription(product.seo_description || "");
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Load Product + Categories + Materials
  |--------------------------------------------------------------------------
  */

  const loadData = useCallback(async () => {
    if (!productId) {
      return;
    }

    try {
      setLoading(true);

      setError("");

      const [productResponse, categoryResponse, materialResponse] =
        await Promise.all([
          apiFetch(`/admin/products/${productId}`),

          apiFetch("/admin/categories"),

          apiFetch("/admin/materials"),
        ]);

      const productData = await productResponse.json();

      const categoryData = await categoryResponse.json();

      const materialData = await materialResponse.json();

      /*
          |--------------------------------------------------------------------------
          | Product
          |--------------------------------------------------------------------------
          */

      if (!productResponse.ok) {
        throw new Error(productData?.message || "Unable to load product.");
      }

      const product = productData?.data as Product | undefined;

      if (!product) {
        throw new Error("Product data not found.");
      }

      populateProduct(product);

      /*
          |--------------------------------------------------------------------------
          | Categories
          |--------------------------------------------------------------------------
          */

      if (categoryResponse.ok) {
        const rows = Array.isArray(categoryData?.data) ? categoryData.data : [];

        setCategories(
          rows.filter((category: Category) => category.status === "active"),
        );
      } else {
        console.error("Unable to load categories:", categoryData);
      }

      /*
          |--------------------------------------------------------------------------
          | Materials
          |--------------------------------------------------------------------------
          */

      if (materialResponse.ok) {
        const rows = Array.isArray(materialData?.data) ? materialData.data : [];

        setMaterials(
          rows.filter((material: Material) => material.status === "active"),
        );
      } else {
        console.error("Unable to load materials:", materialData);
      }
    } catch (err) {
      console.error("Load product error:", err);

      setError(
        err instanceof Error ? err.message : "Unable to connect to server.",
      );
    } finally {
      setLoading(false);
    }
  }, [productId, populateProduct]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  /*
  |--------------------------------------------------------------------------
  | Reload Product Only
  |--------------------------------------------------------------------------
  */

  async function reloadProduct() {
    try {
      const response = await apiFetch(`/admin/products/${productId}`);

      const data = await response.json();

      if (!response.ok) {
        console.error(data?.message || "Unable to reload product.");

        return;
      }

      const product = data?.data as Product | undefined;

      if (!product) {
        return;
      }

      populateProduct(product);
    } catch (err) {
      console.error("Unable to reload product:", err);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Update Product
  |--------------------------------------------------------------------------
  */

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSaving(true);

      setError("");

      /*
      |--------------------------------------------------------------------------
      | Validation
      |--------------------------------------------------------------------------
      */

      const trimmedName = name.trim();

      if (!trimmedName) {
        setError("Product name is required.");

        return;
      }

      if (mrp === "" || Number(mrp) < 0) {
        setError("Please enter a valid MRP.");

        return;
      }

      if (sellingPrice === "" || Number(sellingPrice) < 0) {
        setError("Please enter a valid selling price.");

        return;
      }

      if (Number(sellingPrice) > Number(mrp)) {
        setError("Selling price cannot be greater than MRP.");

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | Payload
      |--------------------------------------------------------------------------
      */

      const payload = {
        name: trimmedName,

        category_id: categoryId ? Number(categoryId) : null,

        material_id: materialId ? Number(materialId) : null,

        sku: sku.trim() ? sku.trim() : null,

        short_description: shortDescription.trim()
          ? shortDescription.trim()
          : null,

        description: description.trim() ? description.trim() : null,

        mrp: Number(mrp),

        selling_price: Number(sellingPrice),

        set_quantity: setQuantity !== "" ? Math.max(1, Number(setQuantity)) : 1,

        status: status || "active",

        featured: Boolean(featured),

        best_seller: Boolean(bestSeller),

        new_arrival: Boolean(newArrival),

        seo_title: seoTitle.trim() ? seoTitle.trim() : null,

        seo_description: seoDescription.trim() ? seoDescription.trim() : null,
      };

      /*
      |--------------------------------------------------------------------------
      | API
      |--------------------------------------------------------------------------
      */

      const response = await apiFetch(`/admin/products/${productId}`, {
        method: "PUT",

        body: JSON.stringify(payload),
      });

      const data = await response.json();

      /*
      |--------------------------------------------------------------------------
      | API Error
      |--------------------------------------------------------------------------
      */

      if (!response.ok) {
        const validationErrors = data?.errors as
          | Record<string, string[]>
          | undefined;

        const firstError = validationErrors
          ? Object.values(validationErrors)[0]?.[0]
          : undefined;

        setError(firstError || data?.message || "Unable to update product.");

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | Success
      |--------------------------------------------------------------------------
      */

      await reloadProduct();

      toast("Product updated successfully.", "success");
    } catch (err) {
      console.error("Update product error:", err);

      setError(
        err instanceof Error ? err.message : "Unable to connect to server.",
      );
    } finally {
      setSaving(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Loading State
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="space-y-6 pb-10">
        <div className="h-20 animate-pulse rounded-2xl bg-white" />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <div className="h-80 animate-pulse rounded-2xl bg-white" />

            <div className="h-80 animate-pulse rounded-2xl bg-white" />
          </div>

          <div className="space-y-6">
            <div className="h-40 animate-pulse rounded-2xl bg-white" />

            <div className="h-40 animate-pulse rounded-2xl bg-white" />
          </div>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="pb-12">
      {/* ================================================================
          HEADER
      ================================================================ */}

      <div className="mb-6 rounded-2xl border border-[#e8e1da] bg-white p-5 shadow-[0_10px_35px_rgba(45,27,20,.04)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/products"
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                border
                border-gray-200
                bg-white
                text-gray-700
                transition
                hover:bg-gray-50
              "
            >
              <ArrowLeft size={18} />
            </Link>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#aa852e]">
                Catalogue Management
              </p>

              <h1 className="mt-1 text-2xl font-semibold text-gray-900">
                Edit Product
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Manage product information, color-aware images, variants,
                inventory and optional designs.
              </p>
            </div>
          </div>

          <button
            type="submit"
            form="edit-product-form"
            disabled={saving}
            className="
              inline-flex
              items-center
              gap-2
              rounded-xl
              bg-[#650b12]
              px-5
              py-2.5
              text-sm
              font-semibold
              text-white
              transition
              hover:bg-[#7b0d17]
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            <Save size={17} />

            {saving ? "Updating..." : "Update product"}
          </button>
        </div>
      </div>

      {/* ================================================================
          ERROR
      ================================================================ */}

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ================================================================
          PRODUCT FORM
      ================================================================ */}

      <form id="edit-product-form" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          {/* ============================================================
              LEFT COLUMN
          ============================================================ */}

          <div className="space-y-6">
            {/* ==========================================================
                PRODUCT INFORMATION
            ========================================================== */}

            <section className="rounded-2xl border border-[#e8e1da] bg-white p-5 shadow-[0_10px_35px_rgba(45,27,20,.04)] sm:p-6">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#aa852e]">
                  Basic information
                </p>

                <h2 className="mt-2 text-lg font-semibold text-gray-900">
                  Product Information
                </h2>
              </div>

              <div className="mt-5 space-y-5">
                {/* Product Name */}

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Product Name *
                  </label>

                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="
                      w-full
                      rounded-xl
                      border
                      border-gray-300
                      px-4
                      py-2.5
                      text-sm
                      outline-none
                      transition
                      focus:border-[#a8822b]
                      focus:ring-2
                      focus:ring-[#a8822b]/10
                    "
                  />
                </div>

                {/* Short Description */}

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Short Description
                  </label>

                  <textarea
                    rows={3}
                    value={shortDescription}
                    onChange={(event) =>
                      setShortDescription(event.target.value)
                    }
                    className="
                      w-full
                      rounded-xl
                      border
                      border-gray-300
                      px-4
                      py-2.5
                      text-sm
                      outline-none
                      transition
                      focus:border-[#a8822b]
                      focus:ring-2
                      focus:ring-[#a8822b]/10
                    "
                  />
                </div>

                {/* Description */}

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Description
                  </label>

                  <textarea
                    rows={7}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    className="
                      w-full
                      rounded-xl
                      border
                      border-gray-300
                      px-4
                      py-2.5
                      text-sm
                      outline-none
                      transition
                      focus:border-[#a8822b]
                      focus:ring-2
                      focus:ring-[#a8822b]/10
                    "
                  />
                </div>
              </div>
            </section>

            {/* ==========================================================
                COLOR-AWARE PRODUCT IMAGES
            ========================================================== */}

            <ProductImageManager productId={Number(productId)} />

            {/* ==========================================================
                BASE PRICING
            ========================================================== */}

            <section className="rounded-2xl border border-[#e8e1da] bg-white p-5 shadow-[0_10px_35px_rgba(45,27,20,.04)] sm:p-6">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#aa852e]">
                  Default pricing
                </p>

                <h2 className="mt-2 text-lg font-semibold text-gray-900">
                  Base Pricing
                </h2>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Variant-level pricing can still be managed in the Variants
                  section below.
                </p>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                {/* MRP */}

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    MRP *
                  </label>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                      ₹
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={mrp}
                      onChange={(event) => setMrp(event.target.value)}
                      className="
                        w-full
                        rounded-xl
                        border
                        border-gray-300
                        py-2.5
                        pl-9
                        pr-4
                        text-sm
                        outline-none
                        focus:border-[#a8822b]
                      "
                    />
                  </div>
                </div>

                {/* Selling Price */}

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Selling Price *
                  </label>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                      ₹
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={sellingPrice}
                      onChange={(event) => setSellingPrice(event.target.value)}
                      className="
                        w-full
                        rounded-xl
                        border
                        border-gray-300
                        py-2.5
                        pl-9
                        pr-4
                        text-sm
                        outline-none
                        focus:border-[#a8822b]
                      "
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* ==========================================================
                PRODUCT DETAILS
            ========================================================== */}

            <section className="rounded-2xl border border-[#e8e1da] bg-white p-5 shadow-[0_10px_35px_rgba(45,27,20,.04)] sm:p-6">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#aa852e]">
                  Identification
                </p>

                <h2 className="mt-2 text-lg font-semibold text-gray-900">
                  Product Details
                </h2>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                {/* Base SKU */}

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Base SKU
                  </label>

                  <input
                    type="text"
                    value={sku}
                    onChange={(event) => setSku(event.target.value)}
                    className="
                      w-full
                      rounded-xl
                      border
                      border-gray-300
                      px-4
                      py-2.5
                      text-sm
                      outline-none
                      focus:border-[#a8822b]
                    "
                  />
                </div>

                {/* Set Quantity */}

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Set Quantity
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={setQuantity}
                    onChange={(event) => setSetQuantity(event.target.value)}
                    className="
                      w-full
                      rounded-xl
                      border
                      border-gray-300
                      px-4
                      py-2.5
                      text-sm
                      outline-none
                      focus:border-[#a8822b]
                    "
                  />
                </div>
              </div>
            </section>

            {/* ==========================================================
                SEO
            ========================================================== */}

            <section className="rounded-2xl border border-[#e8e1da] bg-white p-5 shadow-[0_10px_35px_rgba(45,27,20,.04)] sm:p-6">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#aa852e]">
                  Search visibility
                </p>

                <h2 className="mt-2 text-lg font-semibold text-gray-900">
                  Search Engine Listing
                </h2>
              </div>

              <div className="mt-5 space-y-5">
                {/* SEO Title */}

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    SEO Title
                  </label>

                  <input
                    type="text"
                    value={seoTitle}
                    onChange={(event) => setSeoTitle(event.target.value)}
                    className="
                      w-full
                      rounded-xl
                      border
                      border-gray-300
                      px-4
                      py-2.5
                      text-sm
                      outline-none
                      focus:border-[#a8822b]
                    "
                  />
                </div>

                {/* SEO Description */}

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    SEO Description
                  </label>

                  <textarea
                    rows={4}
                    value={seoDescription}
                    onChange={(event) => setSeoDescription(event.target.value)}
                    className="
                      w-full
                      rounded-xl
                      border
                      border-gray-300
                      px-4
                      py-2.5
                      text-sm
                      outline-none
                      focus:border-[#a8822b]
                    "
                  />
                </div>
              </div>
            </section>
          </div>

          {/* ============================================================
              RIGHT COLUMN
          ============================================================ */}

          <div className="space-y-6">
            {/* ==========================================================
                STATUS
            ========================================================== */}

            <section className="rounded-2xl border border-[#e8e1da] bg-white p-5 shadow-[0_10px_35px_rgba(45,27,20,.04)]">
              <h2 className="font-semibold text-gray-900">Status</h2>

              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="
                  mt-4
                  w-full
                  rounded-xl
                  border
                  border-gray-300
                  bg-white
                  px-4
                  py-2.5
                  text-sm
                  outline-none
                  focus:border-[#a8822b]
                "
              >
                <option value="active">Active</option>

                <option value="inactive">Inactive</option>
              </select>
            </section>

            {/* ==========================================================
                CATEGORY
            ========================================================== */}

            <section className="rounded-2xl border border-[#e8e1da] bg-white p-5 shadow-[0_10px_35px_rgba(45,27,20,.04)]">
              <h2 className="font-semibold text-gray-900">Category</h2>

              <select
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                className="
                  mt-4
                  w-full
                  rounded-xl
                  border
                  border-gray-300
                  bg-white
                  px-4
                  py-2.5
                  text-sm
                  outline-none
                  focus:border-[#a8822b]
                "
              >
                <option value="">Select category</option>

                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </section>

            {/* ==========================================================
                MATERIAL
            ========================================================== */}

            <section className="rounded-2xl border border-[#e8e1da] bg-white p-5 shadow-[0_10px_35px_rgba(45,27,20,.04)]">
              <h2 className="font-semibold text-gray-900">Material</h2>

              <select
                value={materialId}
                onChange={(event) => setMaterialId(event.target.value)}
                className="
                  mt-4
                  w-full
                  rounded-xl
                  border
                  border-gray-300
                  bg-white
                  px-4
                  py-2.5
                  text-sm
                  outline-none
                  focus:border-[#a8822b]
                "
              >
                <option value="">Select material</option>

                {materials.map((material) => (
                  <option key={material.id} value={material.id}>
                    {material.name}
                  </option>
                ))}
              </select>

              {materials.length === 0 && (
                <p className="mt-2 text-xs text-gray-500">
                  No active materials available.
                </p>
              )}
            </section>

            {/* ==========================================================
                PRODUCT LABELS
            ========================================================== */}

            <section className="rounded-2xl border border-[#e8e1da] bg-white p-5 shadow-[0_10px_35px_rgba(45,27,20,.04)]">
              <h2 className="font-semibold text-gray-900">Product Labels</h2>

              <div className="mt-4 space-y-4">
                {/* Featured */}

                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-100 px-3 py-3 transition hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(event) => setFeatured(event.target.checked)}
                    className="h-4 w-4 accent-[#650b12]"
                  />

                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Featured Product
                    </p>

                    <p className="mt-0.5 text-xs text-gray-400">
                      Highlight this product in featured sections.
                    </p>
                  </div>
                </label>

                {/* Best Seller */}

                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-100 px-3 py-3 transition hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={bestSeller}
                    onChange={(event) => setBestSeller(event.target.checked)}
                    className="h-4 w-4 accent-[#650b12]"
                  />

                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Best Seller
                    </p>

                    <p className="mt-0.5 text-xs text-gray-400">
                      Show in bestseller collections.
                    </p>
                  </div>
                </label>

                {/* New Arrival */}

                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-100 px-3 py-3 transition hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={newArrival}
                    onChange={(event) => setNewArrival(event.target.checked)}
                    className="h-4 w-4 accent-[#650b12]"
                  />

                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      New Arrival
                    </p>

                    <p className="mt-0.5 text-xs text-gray-400">
                      Display in new arrival sections.
                    </p>
                  </div>
                </label>
              </div>
            </section>

            {/* ==========================================================
                IMAGE EXPLANATION
            ========================================================== */}

            <section className="rounded-2xl border border-[#eadcb7] bg-[#fffaf0] p-5">
              <p className="text-xs font-semibold uppercase tracking-[.14em] text-[#9b7825]">
                Image Setup
              </p>

              <p className="mt-3 text-sm leading-6 text-gray-600">
                Upload normal color images under Product Images. If the product
                also has Design Options, upload design-specific color images
                inside each design below.
              </p>

              <div className="mt-4 space-y-2 text-xs text-gray-500">
                <p>• Pink → Pink photos</p>

                <p>• Black → Black photos</p>

                <p>• Deep Maroon → Maroon photos</p>

                <p>• Square + Maroon → upload inside Square design</p>
              </div>
            </section>
          </div>
        </div>

        {/* ================================================================
            FORM ACTIONS
        ================================================================ */}

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Link
            href="/admin/products"
            className="
              rounded-xl
              border
              border-gray-300
              bg-white
              px-5
              py-2.5
              text-sm
              font-medium
              text-gray-700
              transition
              hover:bg-gray-50
            "
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="
              inline-flex
              items-center
              gap-2
              rounded-xl
              bg-[#650b12]
              px-5
              py-2.5
              text-sm
              font-semibold
              text-white
              transition
              hover:bg-[#7b0d17]
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            <Save size={17} />

            {saving ? "Updating..." : "Update product"}
          </button>
        </div>
      </form>

      {/* ================================================================
          VARIANTS
      ================================================================
      
          Your existing centralized Variant manager stays separate from
          the basic product form.

          It manages:
          
          Size
          Color
          SKU
          MRP
          Selling Price
          Quantity
          Low Stock Limit
      
      ================================================================ */}

      <div className="mt-8">
        <ProductVariants productId={productId} />
      </div>

      {/* ================================================================
          OPTIONAL DESIGN OPTIONS
      ================================================================
      
          Design Options are product-specific and optional.

          Each design can now contain:
          
          General images
          Pink images
          Black images
          Deep Maroon images
      
      ================================================================ */}

      <div className="mt-8">
        <ProductDesignOptions productId={Number(productId)} />
      </div>
    </div>
  );
}
