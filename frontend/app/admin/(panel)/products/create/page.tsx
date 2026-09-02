"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  ArrowLeft,
  Save,
} from "lucide-react";

import { useRouter } from "next/navigation";

import { apiFetch } from "@/lib/api";

type Category = {
  id: number;
  name: string;
  status: string;
};

export default function CreateProductPage() {
  const router =
    useRouter();

  const [
    categories,
    setCategories,
  ] = useState<Category[]>([]);

  const [
    name,
    setName,
  ] = useState("");

  const [
    categoryId,
    setCategoryId,
  ] = useState("");

  const [
    sku,
    setSku,
  ] = useState("");

  const [
    shortDescription,
    setShortDescription,
  ] = useState("");

  const [
    description,
    setDescription,
  ] = useState("");

  const [
    mrp,
    setMrp,
  ] = useState("");

  const [
    sellingPrice,
    setSellingPrice,
  ] = useState("");

  const [
    setQuantity,
    setSetQuantity,
  ] = useState("1");

  const [
    status,
    setStatus,
  ] = useState("active");

  const [
    featured,
    setFeatured,
  ] = useState(false);

  const [
    bestSeller,
    setBestSeller,
  ] = useState(false);

  const [
    newArrival,
    setNewArrival,
  ] = useState(false);

  const [
    seoTitle,
    setSeoTitle,
  ] = useState("");

  const [
    seoDescription,
    setSeoDescription,
  ] = useState("");

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Load categories
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        const response =
          await apiFetch(
            "/admin/categories"
          );

        const data =
          await response.json();

        if (
          !cancelled &&
          response.ok
        ) {
          const rows =
            Array.isArray(
              data?.data
            )
              ? data.data
              : [];

          setCategories(
            rows.filter(
              (
                category: Category
              ) =>
                category.status ===
                "active"
            )
          );
        }
      } catch (error) {
        console.error(
          "Load categories error:",
          error
        );
      }
    }

    loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Submit
  |--------------------------------------------------------------------------
  */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSaving(true);

    try {
      const trimmedName =
        name.trim();

      if (!trimmedName) {
        setError(
          "Product name is required."
        );

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | IMPORTANT
      |
      | Never send undefined.
      | Empty optional fields become null.
      |--------------------------------------------------------------------------
      */

      const payload = {
        name: trimmedName,

        category_id:
          categoryId
            ? Number(categoryId)
            : null,

        sku:
          sku.trim()
            ? sku.trim()
            : null,

        short_description:
          shortDescription.trim()
            ? shortDescription.trim()
            : null,

        description:
          description.trim()
            ? description.trim()
            : null,

        mrp:
          mrp !== ""
            ? Number(mrp)
            : 0,

        selling_price:
          sellingPrice !== ""
            ? Number(sellingPrice)
            : 0,

        set_quantity:
          setQuantity !== ""
            ? Number(setQuantity)
            : 1,

        status:
          status || "active",

        featured:
          Boolean(featured),

        best_seller:
          Boolean(bestSeller),

        new_arrival:
          Boolean(newArrival),

        seo_title:
          seoTitle.trim()
            ? seoTitle.trim()
            : null,

        seo_description:
          seoDescription.trim()
            ? seoDescription.trim()
            : null,
      };

      const response =
        await apiFetch(
          "/admin/products",
          {
            method: "POST",

            body:
              JSON.stringify(
                payload
              ),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        const validationErrors =
          data?.errors as
            | Record<
                string,
                string[]
              >
            | undefined;

        const firstError =
          validationErrors
            ? Object.values(
                validationErrors
              )[0]?.[0]
            : undefined;

        setError(
          firstError ||
            data?.message ||
            "Unable to create product."
        );

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | Success
      |--------------------------------------------------------------------------
      */

      router.push(
        "/admin/products"
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Create product error:",
        error
      );

      setError(
        "Unable to connect to the server."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={
        handleSubmit
      }
    >
      {/* ------------------------------------------------------------------ */}
      {/* HEADER                                                             */}
      {/* ------------------------------------------------------------------ */}

      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/products"
            className="rounded-lg border border-gray-200 p-2 hover:bg-gray-100"
          >
            <ArrowLeft
              size={19}
            />
          </Link>

          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Add Product
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Add a new product to
              BanglesMart.
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-black disabled:opacity-50"
        >
          <Save
            size={18}
          />

          {saving
            ? "Saving..."
            : "Save product"}
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* ERROR                                                              */}
      {/* ------------------------------------------------------------------ */}

      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* LEFT */}

        <div className="space-y-6">
          {/* Product Information */}

          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-base font-semibold text-gray-900">
              Product Information
            </h2>

            <div className="mt-5 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Product Name *
                </label>

                <input
                  type="text"
                  required
                  value={name}
                  onChange={(
                    event
                  ) =>
                    setName(
                      event.target
                        .value
                    )
                  }
                  placeholder="Royal Kundan Bridal Bangle Set"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-gray-600"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Short Description
                </label>

                <textarea
                  rows={3}
                  value={
                    shortDescription
                  }
                  onChange={(
                    event
                  ) =>
                    setShortDescription(
                      event.target
                        .value
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Description
                </label>

                <textarea
                  rows={7}
                  value={
                    description
                  }
                  onChange={(
                    event
                  ) =>
                    setDescription(
                      event.target
                        .value
                    )
                  }
                  placeholder="Product details..."
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none"
                />
              </div>
            </div>
          </section>

          {/* Pricing */}

          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-base font-semibold text-gray-900">
              Pricing
            </h2>

            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  MRP *
                </label>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                    ₹
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={mrp}
                    onChange={(
                      event
                    ) =>
                      setMrp(
                        event.target
                          .value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-4 text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Selling Price *
                </label>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                    ₹
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={
                      sellingPrice
                    }
                    onChange={(
                      event
                    ) =>
                      setSellingPrice(
                        event.target
                          .value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-4 text-sm outline-none"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Product Details */}

          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-base font-semibold text-gray-900">
              Product Details
            </h2>

            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  SKU
                </label>

                <input
                  type="text"
                  value={sku}
                  onChange={(
                    event
                  ) =>
                    setSku(
                      event.target
                        .value
                    )
                  }
                  placeholder="RKB-001"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Set Quantity
                </label>

                <input
                  type="number"
                  min="1"
                  value={
                    setQuantity
                  }
                  onChange={(
                    event
                  ) =>
                    setSetQuantity(
                      event.target
                        .value
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none"
                />
              </div>
            </div>
          </section>

          {/* SEO */}

          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-base font-semibold text-gray-900">
              Search Engine Listing
            </h2>

            <div className="mt-5 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  SEO Title
                </label>

                <input
                  type="text"
                  value={
                    seoTitle
                  }
                  onChange={(
                    event
                  ) =>
                    setSeoTitle(
                      event.target
                        .value
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  SEO Description
                </label>

                <textarea
                  rows={4}
                  value={
                    seoDescription
                  }
                  onChange={(
                    event
                  ) =>
                    setSeoDescription(
                      event.target
                        .value
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none"
                />
              </div>
            </div>
          </section>
        </div>

        {/* RIGHT */}

        <div className="space-y-6">
          {/* Status */}

          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="font-semibold text-gray-900">
              Status
            </h2>

            <select
              value={status}
              onChange={(
                event
              ) =>
                setStatus(
                  event.target
                    .value
                )
              }
              className="mt-4 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm"
            >
              <option value="active">
                Active
              </option>

              <option value="inactive">
                Inactive
              </option>
            </select>
          </section>

          {/* Category */}

          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="font-semibold text-gray-900">
              Category
            </h2>

            <select
              value={
                categoryId
              }
              onChange={(
                event
              ) =>
                setCategoryId(
                  event.target
                    .value
                )
              }
              className="mt-4 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm"
            >
              <option value="">
                Select category
              </option>

              {categories.map(
                (
                  category
                ) => (
                  <option
                    key={
                      category.id
                    }
                    value={
                      category.id
                    }
                  >
                    {
                      category.name
                    }
                  </option>
                )
              )}
            </select>
          </section>

          {/* Product Labels */}

          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="font-semibold text-gray-900">
              Product Labels
            </h2>

            <div className="mt-4 space-y-4">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={
                    featured
                  }
                  onChange={(
                    event
                  ) =>
                    setFeatured(
                      event.target
                        .checked
                    )
                  }
                  className="h-4 w-4"
                />

                <span className="text-sm text-gray-700">
                  Featured Product
                </span>
              </label>

              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={
                    bestSeller
                  }
                  onChange={(
                    event
                  ) =>
                    setBestSeller(
                      event.target
                        .checked
                    )
                  }
                  className="h-4 w-4"
                />

                <span className="text-sm text-gray-700">
                  Best Seller
                </span>
              </label>

              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={
                    newArrival
                  }
                  onChange={(
                    event
                  ) =>
                    setNewArrival(
                      event.target
                        .checked
                    )
                  }
                  className="h-4 w-4"
                />

                <span className="text-sm text-gray-700">
                  New Arrival
                </span>
              </label>
            </div>
          </section>
        </div>
      </div>

      {/* Bottom Buttons */}

      <div className="mt-6 flex justify-end gap-3">
        <Link
          href="/admin/products"
          className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-black disabled:opacity-50"
        >
          <Save
            size={18}
          />

          {saving
            ? "Saving..."
            : "Save product"}
        </button>
      </div>
    </form>
  );
}