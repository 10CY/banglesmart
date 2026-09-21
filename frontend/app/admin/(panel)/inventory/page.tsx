"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Boxes,
  History,
  PackageCheck,
  PackageX,
  Pencil,
  Search,
  X,
} from "lucide-react";

import { apiFetch, BACKEND_URL } from "@/lib/api";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type InventoryRow = {
  id: number;
  product_variant_id: number;

  sku: string | null;
  product_id: number;

  product_name: string | null;
  size_name: string | null;
  color_name: string | null;

  quantity: number;
  reserved_quantity: number;

  low_stock_limit: number;

  status?: string | null;

  image?: string | null;
};

type ApiResponse = {
  success?: boolean;
  data?: InventoryRow[] | {
    data?: InventoryRow[];
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
  };
  message?: string;
};

type Summary = {
  total_variants: number;
  available_units: number;
  low_stock: number;
  out_of_stock: number;
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function getAvailable(item: InventoryRow) {
  return Math.max(
    0,
    Number(item.quantity || 0) -
      Number(item.reserved_quantity || 0),
  );
}

function getStockStatus(item: InventoryRow) {
  const available = getAvailable(item);
  const limit = Number(item.low_stock_limit || 0);

  if (available <= 0) {
    return {
      label: "Out of stock",
      className: "bg-red-50 text-red-700",
    };
  }

  if (available <= limit) {
    return {
      label: "Low stock",
      className: "bg-orange-50 text-orange-700",
    };
  }

  return {
    label: "In stock",
    className: "bg-green-50 text-green-700",
  };
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function InventoryPage() {
  const [inventories, setInventories] = useState<InventoryRow[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  /* Filters */

  const [search, setSearch] = useState("");

  const [stockStatus, setStockStatus] = useState("");

  const [variantStatus, setVariantStatus] = useState("");

  /* Edit */

  const [editing, setEditing] = useState<InventoryRow | null>(null);

  const [showEdit, setShowEdit] = useState(false);

  const [quantity, setQuantity] = useState("");

  const [lowStockLimit, setLowStockLimit] = useState("");

  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);

  /* ------------------------------------------------------------------------ */
  /* Load Inventory                                                           */
  /* ------------------------------------------------------------------------ */

  const loadInventory = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiFetch("/admin/inventory");

      const json: ApiResponse = await response.json();

      if (!response.ok) {
        setError(
          json.message || "Unable to load inventory.",
        );
        setInventories([]);
        return;
      }

      /*
       * Backend currently returns:
       *
       * {
       *   success: true,
       *   data: [...]
       * }
       *
       * Also support a paginated response just in case.
       */

      let rows: InventoryRow[] = [];

      if (Array.isArray(json.data)) {
        rows = json.data;
      } else if (
        json.data &&
        Array.isArray(json.data.data)
      ) {
        rows = json.data.data;
      }

      /*
       * Normalize numeric values because MySQL may return
       * DECIMAL / BIGINT values as strings depending on driver.
       */

      const normalized = rows.map((item) => ({
        ...item,

        id: Number(item.id),
        product_variant_id: Number(
          item.product_variant_id,
        ),
        product_id: Number(item.product_id),

        quantity: Number(item.quantity || 0),

        reserved_quantity: Number(
          item.reserved_quantity || 0,
        ),

        low_stock_limit: Number(
          item.low_stock_limit || 0,
        ),
      }));

      setInventories(normalized);
    } catch (err) {
      console.error("Inventory error:", err);

      setError("Unable to connect to server.");

      setInventories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  /* ------------------------------------------------------------------------ */
  /* Filtered Inventory                                                       */
  /* ------------------------------------------------------------------------ */

  const filteredInventories = useMemo(() => {
    return inventories.filter((item) => {
      /* Search */

      if (search.trim()) {
        const q = search.trim().toLowerCase();

        const matchesSearch =
          String(item.product_name || "")
            .toLowerCase()
            .includes(q) ||
          String(item.sku || "")
            .toLowerCase()
            .includes(q) ||
          String(item.size_name || "")
            .toLowerCase()
            .includes(q) ||
          String(item.color_name || "")
            .toLowerCase()
            .includes(q);

        if (!matchesSearch) {
          return false;
        }
      }

      /* Stock */

      if (stockStatus) {
        const available = getAvailable(item);

        if (
          stockStatus === "in_stock" &&
          available <= item.low_stock_limit
        ) {
          return false;
        }

        if (
          stockStatus === "low" &&
          (available <= 0 ||
            available > item.low_stock_limit)
        ) {
          return false;
        }

        if (
          stockStatus === "out" &&
          available > 0
        ) {
          return false;
        }
      }

      /* Variant status */

      if (
        variantStatus &&
        item.status &&
        item.status !== variantStatus
      ) {
        return false;
      }

      return true;
    });
  }, [
    inventories,
    search,
    stockStatus,
    variantStatus,
  ]);

  /* ------------------------------------------------------------------------ */
  /* Summary                                                                  */
  /* ------------------------------------------------------------------------ */

  const summary: Summary = useMemo(() => {
    let availableUnits = 0;
    let lowStock = 0;
    let outOfStock = 0;

    for (const item of inventories) {
      const available = getAvailable(item);

      availableUnits += available;

      if (available <= 0) {
        outOfStock += 1;
      } else if (
        available <= Number(item.low_stock_limit || 0)
      ) {
        lowStock += 1;
      }
    }

    return {
      total_variants: inventories.length,
      available_units: availableUnits,
      low_stock: lowStock,
      out_of_stock: outOfStock,
    };
  }, [inventories]);

  /* ------------------------------------------------------------------------ */
  /* Edit Inventory                                                           */
  /* ------------------------------------------------------------------------ */

  function openEdit(item: InventoryRow) {
    setEditing(item);

    setQuantity(String(item.quantity));

    setLowStockLimit(
      String(item.low_stock_limit || 0),
    );

    setNotes("");

    setError("");

    setShowEdit(true);
  }

  function closeEdit() {
    if (saving) {
      return;
    }

    setShowEdit(false);

    setEditing(null);

    setQuantity("");

    setLowStockLimit("");

    setNotes("");

    setError("");
  }

  /* ------------------------------------------------------------------------ */
  /* Update Inventory                                                         */
  /* ------------------------------------------------------------------------ */

  async function handleUpdate(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!editing) {
      return;
    }

    const newQuantity = Number(quantity);

    const newLimit = Number(lowStockLimit);

    if (
      !Number.isFinite(newQuantity) ||
      newQuantity < editing.reserved_quantity
    ) {
      setError(
        `Quantity cannot be less than reserved quantity (${editing.reserved_quantity}).`,
      );
      return;
    }

    if (
      !Number.isFinite(newLimit) ||
      newLimit < 0
    ) {
      setError(
        "Low stock limit must be 0 or greater.",
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await apiFetch(
        `/admin/inventory/${editing.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quantity: newQuantity,
            low_stock_limit: newLimit,
            notes: notes.trim() || null,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        const validationErrors =
          data?.errors as
            | Record<string, string[]>
            | undefined;

        const firstError = validationErrors
          ? Object.values(validationErrors)[0]?.[0]
          : undefined;

        setError(
          firstError ||
            data?.message ||
            "Unable to update inventory.",
        );

        return;
      }

      setShowEdit(false);

      setEditing(null);

      setQuantity("");

      setLowStockLimit("");

      setNotes("");

      await loadInventory();
    } catch (err) {
      console.error(err);

      setError("Unable to connect to server.");
    } finally {
      setSaving(false);
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Render                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="min-h-full">
      {/* Header */}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Inventory
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage stock across all product variants.
          </p>
        </div>

        <Link
          href="/admin/inventory/history"
          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          <History size={18} />

          Stock History
        </Link>
      </div>

      {/* Error */}

      {error && !showEdit && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Summary */}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Total */}

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Total Variants
              </p>

              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {summary.total_variants}
              </p>
            </div>

            <div className="rounded-lg bg-gray-100 p-3 text-gray-700">
              <Boxes size={22} />
            </div>
          </div>
        </div>

        {/* Available */}

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Available Units
              </p>

              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {summary.available_units}
              </p>
            </div>

            <div className="rounded-lg bg-green-50 p-3 text-green-700">
              <PackageCheck size={22} />
            </div>
          </div>
        </div>

        {/* Low */}

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Low Stock
              </p>

              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {summary.low_stock}
              </p>
            </div>

            <div className="rounded-lg bg-orange-50 p-3 text-orange-700">
              <AlertTriangle size={22} />
            </div>
          </div>
        </div>

        {/* Out */}

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Out of Stock
              </p>

              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {summary.out_of_stock}
              </p>
            </div>

            <div className="rounded-lg bg-red-50 p-3 text-red-700">
              <PackageX size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}

      <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_200px_180px]">
          {/* Search */}

          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search product or SKU..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition focus:border-gray-500"
            />
          </div>

          {/* Stock */}

          <select
            value={stockStatus}
            onChange={(event) =>
              setStockStatus(event.target.value)
            }
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none"
          >
            <option value="">All stock</option>

            <option value="in_stock">
              In stock
            </option>

            <option value="low">
              Low stock
            </option>

            <option value="out">
              Out of stock
            </option>
          </select>

          {/* Status */}

          <select
            value={variantStatus}
            onChange={(event) =>
              setVariantStatus(event.target.value)
            }
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none"
          >
            <option value="">All status</option>

            <option value="active">
              Active
            </option>

            <option value="inactive">
              Inactive
            </option>
          </select>
        </div>
      </div>

      {/* Table */}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px]">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Product
                </th>

                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Variant
                </th>

                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  SKU
                </th>

                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Total
                </th>

                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Reserved
                </th>

                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Available
                </th>

                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Stock Status
                </th>

                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {/* Loading */}

              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-14 text-center text-sm text-gray-500"
                  >
                    Loading inventory...
                  </td>
                </tr>
              ) : filteredInventories.length === 0 ? (
                /* Empty */

                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-14 text-center"
                  >
                    <Boxes
                      size={36}
                      className="mx-auto text-gray-300"
                    />

                    <p className="mt-3 text-sm font-medium text-gray-700">
                      {inventories.length === 0
                        ? "No inventory found"
                        : "No matching inventory"}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {inventories.length === 0
                        ? "Add product variants to create inventory."
                        : "Try changing your search or filters."}
                    </p>
                  </td>
                </tr>
              ) : (
                /* Rows */

                filteredInventories.map(
                  (inventory) => {
                    const available =
                      getAvailable(inventory);

                    const stock =
                      getStockStatus(inventory);

                    return (
                      <tr
                        key={inventory.id}
                        className="transition hover:bg-gray-50"
                      >
                        {/* Product */}

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                              {inventory.image ? (
                                <img
                                  src={`${BACKEND_URL}/storage/${inventory.image}`}
                                  alt={
                                    inventory.product_name ||
                                    "Product"
                                  }
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <Boxes
                                  size={20}
                                  className="text-gray-300"
                                />
                              )}
                            </div>

                            <div>
                              <p className="font-medium text-gray-900">
                                {inventory.product_name ||
                                  "—"}
                              </p>

                              <p className="mt-1 text-xs text-gray-400">
                                Product ID:{" "}
                                {inventory.product_id}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Variant */}

                        <td className="px-5 py-4">
                          <div className="text-sm text-gray-700">
                            {inventory.size_name ||
                              "—"}

                            {" / "}

                            {inventory.color_name ||
                              "—"}
                          </div>
                        </td>

                        {/* SKU */}

                        <td className="px-5 py-4">
                          <span className="font-mono text-sm text-gray-600">
                            {inventory.sku || "—"}
                          </span>
                        </td>

                        {/* Total */}

                        <td className="px-5 py-4">
                          <span className="text-sm font-medium text-gray-900">
                            {inventory.quantity}
                          </span>
                        </td>

                        {/* Reserved */}

                        <td className="px-5 py-4">
                          <span className="text-sm text-gray-600">
                            {
                              inventory.reserved_quantity
                            }
                          </span>
                        </td>

                        {/* Available */}

                        <td className="px-5 py-4">
                          <span className="text-sm font-semibold text-gray-900">
                            {available}
                          </span>
                        </td>

                        {/* Status */}

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${stock.className}`}
                          >
                            {stock.label}
                          </span>
                        </td>

                        {/* Action */}

                        <td className="px-5 py-4">
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() =>
                                openEdit(inventory)
                              }
                              title="Update inventory"
                              className="rounded-lg border border-gray-200 p-2 text-gray-700 transition hover:bg-gray-100"
                            >
                              <Pencil size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  },
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Drawer */}

      {showEdit && editing && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
          <div className="h-full w-full max-w-md overflow-y-auto bg-white shadow-2xl">
            {/* Drawer Header */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Update Inventory
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {editing.product_name || "Product"}
                </p>
              </div>

              <button
                type="button"
                onClick={closeEdit}
                disabled={saving}
                className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}

            <form
              onSubmit={handleUpdate}
              className="space-y-6 p-6"
            >
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Variant */}

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Variant
                </p>

                <p className="mt-3 text-sm font-medium text-gray-900">
                  {editing.size_name || "—"}
                  {" / "}
                  {editing.color_name || "—"}
                </p>

                <p className="mt-3 font-mono text-xs text-gray-500">
                  SKU: {editing.sku || "—"}
                </p>
              </div>

              {/* Quantity */}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Total Quantity *
                </label>

                <input
                  type="number"
                  required
                  min={editing.reserved_quantity}
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(
                      event.target.value,
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-600"
                />

                <p className="mt-2 text-xs text-gray-500">
                  Minimum allowed:{" "}
                  {editing.reserved_quantity} because
                  this stock is currently reserved.
                </p>
              </div>

              {/* Low Stock */}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Low Stock Alert *
                </label>

                <input
                  type="number"
                  required
                  min="0"
                  value={lowStockLimit}
                  onChange={(event) =>
                    setLowStockLimit(
                      event.target.value,
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-600"
                />

                <p className="mt-2 text-xs text-gray-500">
                  Mark this variant as low stock when
                  available quantity reaches this
                  number.
                </p>
              </div>

              {/* Notes */}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Adjustment Notes
                </label>

                <textarea
                  rows={4}
                  value={notes}
                  onChange={(event) =>
                    setNotes(event.target.value)
                  }
                  placeholder="Example: Received 10 units from supplier"
                  className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-600"
                />

                <p className="mt-2 text-xs text-gray-500">
                  This note will appear in stock history
                  when quantity changes.
                </p>
              </div>

              {/* Summary */}

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <h3 className="mb-4 text-sm font-medium text-gray-900">
                  Stock Summary
                </h3>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Current Total
                  </span>

                  <span className="font-medium text-gray-900">
                    {editing.quantity}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Reserved
                  </span>

                  <span className="font-medium text-gray-900">
                    {editing.reserved_quantity}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3">
                  <span className="text-sm font-medium text-gray-700">
                    New Total
                  </span>

                  <span className="font-semibold text-gray-900">
                    {Number(quantity || 0)}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    New Available
                  </span>

                  <span className="font-semibold text-gray-900">
                    {Math.max(
                      0,
                      Number(quantity || 0) -
                        editing.reserved_quantity,
                    )}
                  </span>
                </div>

                {Number(quantity || 0) !==
                  editing.quantity && (
                  <div className="mt-4 rounded-lg border border-gray-200 bg-white p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Stock Change
                      </span>

                      <span
                        className={`font-semibold ${
                          Number(quantity || 0) -
                            editing.quantity >
                          0
                            ? "text-green-700"
                            : "text-red-600"
                        }`}
                      >
                        {Number(quantity || 0) -
                          editing.quantity >
                        0
                          ? "+"
                          : ""}
                        {Number(quantity || 0) -
                          editing.quantity}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Buttons */}

              <div className="flex justify-end gap-3 border-t border-gray-200 pt-6">
                <button
                  type="button"
                  onClick={closeEdit}
                  disabled={saving}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Updating..."
                    : "Update Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}