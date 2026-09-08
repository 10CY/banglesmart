"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Pencil, Trash2, Package } from "lucide-react";
import { apiFetch } from "@/lib/api";

type Category = {
  id: number;
  name: string;
};

type Product = {
  id: number;
  name: string;
  slug: string;
  sku: string | null;

  mrp: number | string;
  selling_price: number | string;

  status: string;

  featured: boolean;
  best_seller: boolean;
  new_arrival: boolean;

  category_id?: number | null;
  category_name?: string | null;

  material_id?: number | null;
  material_name?: string | null;

  category?: Category | null;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Categories
  |--------------------------------------------------------------------------
  */

  const fetchCategories = useCallback(async () => {
    try {
      const response = await apiFetch("/admin/categories");

      const data = await response.json();

      if (!response.ok) {
        console.error(data?.message || "Unable to load categories.");

        return;
      }

      const rows = Array.isArray(data?.data) ? data.data : [];

      setCategories(rows);
    } catch (error) {
      console.error("Category loading error:", error);
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Products
  |--------------------------------------------------------------------------
  */

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (categoryId) {
        params.set("category_id", categoryId);
      }

      if (status) {
        params.set("status", status);
      }

      const query = params.toString();

      const response = await apiFetch(
        `/admin/products${query ? `?${query}` : ""}`,
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(data?.message || "Unable to load products.");

        setProducts([]);

        return;
      }

      const rows = Array.isArray(data?.data) ? data.data : [];

      setProducts(rows);
    } catch (error) {
      console.error("Unable to load products:", error);

      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [search, categoryId, status]);

  /*
  |--------------------------------------------------------------------------
  | Initial loading
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  /*
  |--------------------------------------------------------------------------
  | Product search/filter
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 300);

    return () => clearTimeout(timer);
  }, [fetchProducts]);

  /*
  |--------------------------------------------------------------------------
  | Delete
  |--------------------------------------------------------------------------
  */

  async function deleteProduct(id: number) {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this product?",
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const response = await apiFetch(`/admin/products/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        window.alert(data?.message || "Unable to delete product.");

        return;
      }

      await fetchProducts();
    } catch (error) {
      console.error(error);

      window.alert("Unable to connect to server.");
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Price
  |--------------------------------------------------------------------------
  */

  function formatPrice(value: number | string) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  }

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div>
      {/* ================================================================
          HEADER
      ================================================================ */}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Products</h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage your BanglesMart product catalogue.
          </p>
        </div>

        <Link
          href="/admin/products/create"
          className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-black"
        >
          <Plus size={18} />
          Add product
        </Link>
      </div>

      {/* ================================================================
          FILTERS
      ================================================================ */}

      <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_220px_180px]">
          {/* Search */}

          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products or SKU..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
            />
          </div>

          {/* Category */}

          <select
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-gray-500"
          >
            <option value="">All categories</option>

            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          {/* Status */}

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-gray-500"
          >
            <option value="">All status</option>

            <option value="active">Active</option>

            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* ================================================================
          PRODUCT TABLE
      ================================================================ */}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px]">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                {/* Product */}

                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Product
                </th>

                {/* Category */}

                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Category
                </th>

                {/* Material */}

                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Material
                </th>

                {/* SKU */}

                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  SKU
                </th>

                {/* Price */}

                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Price
                </th>

                {/* Status */}

                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Status
                </th>

                {/* Actions */}

                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {/* ======================================================
                  LOADING
              ====================================================== */}

              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-sm text-gray-500"
                  >
                    Loading products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                /* ======================================================
                   EMPTY
                ====================================================== */

                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center">
                    <Package size={35} className="mx-auto text-gray-300" />

                    <p className="mt-3 text-sm font-medium text-gray-700">
                      No products found
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      Add your first BanglesMart product.
                    </p>
                  </td>
                </tr>
              ) : (
                /* ======================================================
                   PRODUCTS
                ====================================================== */

                products.map((product) => (
                  <tr key={product.id} className="transition hover:bg-gray-50">
                    {/* ==================================================
                        PRODUCT
                    ================================================== */}

                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900">
                        {product.name}
                      </p>

                      <div className="mt-1 flex flex-wrap gap-2">
                        {Boolean(product.featured) && (
                          <span className="rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-600">
                            Featured
                          </span>
                        )}

                        {Boolean(product.best_seller) && (
                          <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-600">
                            Best Seller
                          </span>
                        )}

                        {Boolean(product.new_arrival) && (
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
                            New
                          </span>
                        )}
                      </div>
                    </td>

                    {/* ==================================================
                        CATEGORY
                    ================================================== */}

                    <td className="px-5 py-4 text-sm text-gray-600">
                      {product.category?.name || product.category_name || "—"}
                    </td>

                    {/* ==================================================
                        MATERIAL
                    ================================================== */}

                    <td className="px-5 py-4">
                      {product.material_name ? (
                        <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                          {product.material_name}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>

                    {/* ==================================================
                        SKU
                    ================================================== */}

                    <td className="px-5 py-4 text-sm text-gray-600">
                      {product.sku || "—"}
                    </td>

                    {/* ==================================================
                        PRICE
                    ================================================== */}

                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900">
                        {formatPrice(product.selling_price)}
                      </p>

                      {Number(product.mrp) > Number(product.selling_price) && (
                        <p className="text-xs text-gray-400 line-through">
                          {formatPrice(product.mrp)}
                        </p>
                      )}
                    </td>

                    {/* ==================================================
                        STATUS
                    ================================================== */}

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                          product.status === "active"
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {product.status}
                      </span>
                    </td>

                    {/* ==================================================
                        ACTIONS
                    ================================================== */}

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        {/* Edit */}

                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          title="Edit product"
                          className="rounded-lg border border-gray-200 p-2 text-gray-700 transition hover:bg-gray-100"
                        >
                          <Pencil size={16} />
                        </Link>

                        {/* Delete */}

                        <button
                          type="button"
                          title="Delete product"
                          onClick={() => deleteProduct(product.id)}
                          className="rounded-lg border border-gray-200 p-2 text-red-600 transition hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
