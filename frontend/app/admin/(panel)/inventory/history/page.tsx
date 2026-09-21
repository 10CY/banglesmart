"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CalendarDays,
  History,
  Package,
  Search,
} from "lucide-react";

import {
  apiFetch,
  BACKEND_URL,
} from "@/lib/api";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type ProductImage = {
  id: number;
  image: string;
};

type Product = {
  id: number;
  name: string;
  sku: string | null;

  primary_image:
    | ProductImage
    | null;
};

type Size = {
  id: number;
  name: string;
  display_name:
    | string
    | null;
};

type Color = {
  id: number;
  name: string;
  display_name:
    | string
    | null;

  hex_code:
    | string
    | null;
};

type Variant = {
  id: number;
  sku: string;

  product:
    | Product
    | null;

  size:
    | Size
    | null;

  color:
    | Color
    | null;
};

type User = {
  id: number;
  name: string;
  email: string;
};

type InventoryMovement = {
  id: number;

  product_variant_id: number;

  user_id:
    | number
    | null;

  type: string;

  quantity: number;

  before_quantity: number;
  after_quantity: number;

  reference_type:
    | string
    | null;

  reference_id:
    | number
    | null;

  notes:
    | string
    | null;

  created_at: string;
  updated_at: string;

  variant:
    | Variant
    | null;

  user:
    | User
    | null;
};

type Pagination = {
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
};

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function InventoryHistoryPage() {
  const [
    movements,
    setMovements,
  ] = useState<
    InventoryMovement[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  /* ------------------------------------------------------------------------ */
  /* Filters                                                                  */
  /* ------------------------------------------------------------------------ */

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    type,
    setType,
  ] = useState("");

  const [
    dateFrom,
    setDateFrom,
  ] = useState("");

  const [
    dateTo,
    setDateTo,
  ] = useState("");

  const [
    page,
    setPage,
  ] = useState(1);

  const [
    pagination,
    setPagination,
  ] = useState<Pagination>({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 30,
  });

  /* ------------------------------------------------------------------------ */
  /* Load History                                                             */
  /* ------------------------------------------------------------------------ */

  const loadMovements =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const params =
          new URLSearchParams();

        if (search.trim()) {
          params.set(
            "search",
            search.trim()
          );
        }

        if (type) {
          params.set(
            "type",
            type
          );
        }

        if (dateFrom) {
          params.set(
            "date_from",
            dateFrom
          );
        }

        if (dateTo) {
          params.set(
            "date_to",
            dateTo
          );
        }

        params.set(
          "page",
          String(page)
        );

        const response =
          await apiFetch(
            `/admin/inventory-movements?${params.toString()}`
          );

        const data =
          await response.json();

        if (!response.ok) {
          setError(
            data.message ||
              "Unable to load stock history."
          );

          return;
        }

        /*
        |--------------------------------------------------------------------------
        | Expected Laravel paginator:
        |
        | {
        |   success: true,
        |   data: {
        |     data: [...],
        |     current_page: 1,
        |     last_page: 1,
        |     total: 10,
        |     per_page: 30
        |   }
        | }
        |--------------------------------------------------------------------------
        */

        const paginator =
          data.data;

        setMovements(
          paginator?.data || []
        );

        setPagination({
          current_page:
            paginator?.current_page ||
            1,

          last_page:
            paginator?.last_page ||
            1,

          total:
            paginator?.total ||
            0,

          per_page:
            paginator?.per_page ||
            30,
        });
      } catch {
        setError(
          "Unable to connect to server."
        );
      } finally {
        setLoading(false);
      }
    }, [
      search,
      type,
      dateFrom,
      dateTo,
      page,
    ]);

  /* ------------------------------------------------------------------------ */
  /* Debounced Load                                                           */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        loadMovements();
      }, 300);

    return () =>
      window.clearTimeout(timer);
  }, [loadMovements]);

  /* ------------------------------------------------------------------------ */
  /* Reset Page On Filters                                                    */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    setPage(1);
  }, [
    search,
    type,
    dateFrom,
    dateTo,
  ]);

  /* ------------------------------------------------------------------------ */
  /* Helpers                                                                  */
  /* ------------------------------------------------------------------------ */

  function movementLabel(
    movementType: string
  ) {
    switch (movementType) {
      case "adjustment":
        return "Manual Adjustment";

      case "stock_in":
        return "Stock In";

      case "stock_out":
        return "Stock Out";

      case "order":
        return "Order";

      case "order_reserved":
        return "Order Reserved";

      case "order_cancelled":
        return "Order Cancelled";

      case "order_delivered":
        return "Order Delivered";

      case "cancel":
        return "Order Cancelled";

      case "return":
        return "Return";

      default:
        return movementType
          .replaceAll(
            "_",
            " "
          )
          .replace(
            /\b\w/g,
            (character) =>
              character.toUpperCase()
          );
    }
  }

  function movementClasses(
    movementType: string
  ) {
    switch (movementType) {
      case "stock_in":
      case "return":
      case "order_cancelled":
      case "cancel":
        return "bg-green-50 text-green-700";

      case "stock_out":
      case "order":
      case "order_reserved":
      case "order_delivered":
        return "bg-red-50 text-red-700";

      case "adjustment":
        return "bg-blue-50 text-blue-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  }

  function formatDate(
    value: string
  ) {
    return new Intl.DateTimeFormat(
      "en-IN",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    ).format(
      new Date(value)
    );
  }

  function getProductName(
    movement: InventoryMovement
  ) {
    return (
      movement.variant
        ?.product
        ?.name ||
      "Product unavailable"
    );
  }

  function getImage(
    movement: InventoryMovement
  ) {
    return movement.variant
      ?.product
      ?.primary_image
      ?.image;
  }

  function getSizeName(
    movement: InventoryMovement
  ) {
    const size =
      movement.variant
        ?.size;

    if (!size) {
      return "-";
    }

    return (
      size.display_name ||
      size.name
    );
  }

  function getColorName(
    movement: InventoryMovement
  ) {
    const color =
      movement.variant
        ?.color;

    if (!color) {
      return "-";
    }

    return (
      color.display_name ||
      color.name
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Clear Filters                                                            */
  /* ------------------------------------------------------------------------ */

  function clearFilters() {
    setSearch("");
    setType("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }

  const hasFilters =
    Boolean(
      search ||
        type ||
        dateFrom ||
        dateTo
    );

  /* ------------------------------------------------------------------------ */
  /* UI                                                                       */
  /* ------------------------------------------------------------------------ */

  return (
    <div>

      {/* -------------------------------------------------------------------- */}
      {/* Header                                                               */}
      {/* -------------------------------------------------------------------- */}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">

        <div>

          <Link
            href="/admin/inventory"
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-gray-900"
          >
            <ArrowLeft
              size={17}
            />

            Back to Inventory
          </Link>

          <h1 className="text-2xl font-semibold text-gray-900">
            Stock History
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            View inventory adjustments,
            order reservations,
            cancellations and deliveries.
          </p>

        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-900 text-white">

          <History
            size={21}
          />

        </div>

      </div>

      {/* -------------------------------------------------------------------- */}
      {/* Filters                                                              */}
      {/* -------------------------------------------------------------------- */}

      <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4">

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_220px_190px_190px]">

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
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search product name or SKU..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition focus:border-gray-600"
            />

          </div>

          {/* Movement Type */}

          <select
            value={type}
            onChange={(event) =>
              setType(
                event.target.value
              )
            }
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-600"
          >
            <option value="">
              All Movements
            </option>

            <option value="adjustment">
              Manual Adjustment
            </option>

            <option value="stock_in">
              Stock In
            </option>

            <option value="stock_out">
              Stock Out
            </option>

            <option value="order_reserved">
              Order Reserved
            </option>

            <option value="order_cancelled">
              Order Cancelled
            </option>

            <option value="order_delivered">
              Order Delivered
            </option>

            <option value="return">
              Return
            </option>
          </select>

          {/* From */}

          <div className="relative">

            <CalendarDays
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="date"
              value={dateFrom}
              onChange={(event) =>
                setDateFrom(
                  event.target.value
                )
              }
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm text-gray-900 outline-none focus:border-gray-600"
            />

          </div>

          {/* To */}

          <div className="relative">

            <CalendarDays
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="date"
              value={dateTo}
              onChange={(event) =>
                setDateTo(
                  event.target.value
                )
              }
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm text-gray-900 outline-none focus:border-gray-600"
            />

          </div>

        </div>

        {/* Clear Filters */}

        {hasFilters && (

          <div className="mt-4 flex justify-end border-t border-gray-100 pt-4">

            <button
              type="button"
              onClick={
                clearFilters
              }
              className="text-sm font-medium text-gray-600 transition hover:text-gray-900"
            >
              Clear Filters
            </button>

          </div>

        )}

      </div>

      {/* -------------------------------------------------------------------- */}
      {/* Error                                                                */}
      {/* -------------------------------------------------------------------- */}

      {error && (

        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>

      )}

      {/* -------------------------------------------------------------------- */}
      {/* Table                                                                */}
      {/* -------------------------------------------------------------------- */}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1250px]">

            {/* Header */}

            <thead className="border-b border-gray-200 bg-gray-50">

              <tr>

                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Product
                </th>

                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Variant
                </th>

                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Type
                </th>

                <th className="px-5 py-3 text-center text-xs font-medium uppercase tracking-wide text-gray-500">
                  Change
                </th>

                <th className="px-5 py-3 text-center text-xs font-medium uppercase tracking-wide text-gray-500">
                  Before
                </th>

                <th className="px-5 py-3 text-center text-xs font-medium uppercase tracking-wide text-gray-500">
                  After
                </th>

                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Reference
                </th>

                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Notes
                </th>

                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Updated By
                </th>

                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Date
                </th>

              </tr>

            </thead>

            {/* Body */}

            <tbody className="divide-y divide-gray-200">

              {/* Loading */}

              {loading ? (

                <tr>

                  <td
                    colSpan={10}
                    className="px-5 py-16 text-center text-sm text-gray-500"
                  >
                    Loading stock history...
                  </td>

                </tr>

              ) : movements.length ===
                0 ? (

                /* Empty */

                <tr>

                  <td
                    colSpan={10}
                    className="px-5 py-16 text-center"
                  >

                    <History
                      size={38}
                      className="mx-auto text-gray-300"
                    />

                    <p className="mt-4 font-medium text-gray-700">
                      No stock movements found
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      Inventory changes will appear here.
                    </p>

                  </td>

                </tr>

              ) : (

                movements.map(
                  (movement) => {

                    const image =
                      getImage(
                        movement
                      );

                    const productName =
                      getProductName(
                        movement
                      );

                    const variant =
                      movement.variant;

                    const color =
                      variant?.color;

                    const isPositive =
                      movement.quantity >
                      0;

                    const isNegative =
                      movement.quantity <
                      0;

                    return (

                      <tr
                        key={movement.id}
                        className="transition hover:bg-gray-50"
                      >

                        {/* -------------------------------------------------- */}
                        {/* Product                                            */}
                        {/* -------------------------------------------------- */}

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-3">

                            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50">

                              {image ? (

                                <img
                                  src={`${BACKEND_URL}/storage/${image}`}
                                  alt={
                                    productName
                                  }
                                  className="h-full w-full object-cover"
                                />

                              ) : (

                                <Package
                                  size={21}
                                  className="text-gray-300"
                                />

                              )}

                            </div>

                            <div className="min-w-0">

                              <p className="max-w-[230px] truncate text-sm font-medium text-gray-900">
                                {
                                  productName
                                }
                              </p>

                              {movement.variant
                                ?.product
                                ?.sku && (

                                <p className="mt-1 font-mono text-xs text-gray-400">
                                  {
                                    movement
                                      .variant
                                      .product
                                      .sku
                                  }
                                </p>

                              )}

                            </div>

                          </div>

                        </td>

                        {/* -------------------------------------------------- */}
                        {/* Variant                                            */}
                        {/* -------------------------------------------------- */}

                        <td className="px-5 py-4">

                          {variant ? (

                            <div>

                              <p className="font-mono text-xs font-medium text-gray-700">
                                {
                                  variant.sku
                                }
                              </p>

                              <div className="mt-2 flex items-center gap-2">

                                {/* Color */}

                                {color && (

                                  <span
                                    className="h-4 w-4 shrink-0 rounded-full border border-gray-300"
                                    style={{
                                      backgroundColor:
                                        color.hex_code ||
                                        "#ffffff",
                                    }}
                                  />

                                )}

                                <span className="text-xs text-gray-500">

                                  {getSizeName(
                                    movement
                                  )}

                                  {" / "}

                                  {getColorName(
                                    movement
                                  )}

                                </span>

                              </div>

                            </div>

                          ) : (

                            <span className="text-sm text-gray-400">
                              Variant unavailable
                            </span>

                          )}

                        </td>

                        {/* -------------------------------------------------- */}
                        {/* Type                                               */}
                        {/* -------------------------------------------------- */}

                        <td className="px-5 py-4">

                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${movementClasses(
                              movement.type
                            )}`}
                          >
                            {movementLabel(
                              movement.type
                            )}
                          </span>

                        </td>

                        {/* -------------------------------------------------- */}
                        {/* Change                                             */}
                        {/* -------------------------------------------------- */}

                        <td className="px-5 py-4">

                          <div className="flex justify-center">

                            <span
                              className={`inline-flex min-w-[70px] items-center justify-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-semibold ${
                                isPositive
                                  ? "bg-green-50 text-green-700"
                                  : isNegative
                                  ? "bg-red-50 text-red-700"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >

                              {isPositive && (
                                <ArrowUp
                                  size={14}
                                />
                              )}

                              {isNegative && (
                                <ArrowDown
                                  size={14}
                                />
                              )}

                              {movement.quantity >
                              0
                                ? "+"
                                : ""}

                              {
                                movement.quantity
                              }

                            </span>

                          </div>

                        </td>

                        {/* -------------------------------------------------- */}
                        {/* Before                                             */}
                        {/* -------------------------------------------------- */}

                        <td className="px-5 py-4 text-center">

                          <span className="text-sm font-medium text-gray-700">
                            {
                              movement.before_quantity
                            }
                          </span>

                        </td>

                        {/* -------------------------------------------------- */}
                        {/* After                                              */}
                        {/* -------------------------------------------------- */}

                        <td className="px-5 py-4 text-center">

                          <span className="text-sm font-semibold text-gray-900">
                            {
                              movement.after_quantity
                            }
                          </span>

                        </td>

                        {/* -------------------------------------------------- */}
                        {/* Reference                                          */}
                        {/* -------------------------------------------------- */}

                        <td className="px-5 py-4">

                          {movement.reference_type ||
                          movement.reference_id ? (

                            <div>

                              <p className="text-sm font-medium capitalize text-gray-700">
                                {movement.reference_type ||
                                  "Reference"}
                              </p>

                              {movement.reference_id && (

                                <p className="mt-1 text-xs text-gray-400">
                                  #
                                  {
                                    movement.reference_id
                                  }
                                </p>

                              )}

                            </div>

                          ) : (

                            <span className="text-sm text-gray-400">
                              -
                            </span>

                          )}

                        </td>

                        {/* -------------------------------------------------- */}
                        {/* Notes                                              */}
                        {/* -------------------------------------------------- */}

                        <td className="px-5 py-4">

                          <p
                            className="max-w-[260px] truncate text-sm text-gray-600"
                            title={
                              movement.notes ||
                              ""
                            }
                          >
                            {movement.notes ||
                              "-"}
                          </p>

                        </td>

                        {/* -------------------------------------------------- */}
                        {/* User                                               */}
                        {/* -------------------------------------------------- */}

                        <td className="px-5 py-4">

                          {movement.user ? (

                            <div>

                              <p className="text-sm font-medium text-gray-800">
                                {
                                  movement.user
                                    .name
                                }
                              </p>

                              <p className="mt-1 max-w-[180px] truncate text-xs text-gray-400">
                                {
                                  movement.user
                                    .email
                                }
                              </p>

                            </div>

                          ) : (

                            <span className="text-sm text-gray-400">
                              System
                            </span>

                          )}

                        </td>

                        {/* -------------------------------------------------- */}
                        {/* Date                                               */}
                        {/* -------------------------------------------------- */}

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-500">
                          {formatDate(
                            movement.created_at
                          )}
                        </td>

                      </tr>

                    );
                  }
                )

              )}

            </tbody>

          </table>

        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Footer / Pagination                                                */}
        {/* ------------------------------------------------------------------ */}

        {!loading &&
          pagination.total > 0 && (

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 px-5 py-4">

            <div>

              <p className="text-sm text-gray-500">

                {
                  pagination.total
                }{" "}
                movement
                {pagination.total ===
                1
                  ? ""
                  : "s"}

              </p>

              <p className="mt-1 text-xs text-gray-400">

                Page{" "}
                {
                  pagination.current_page
                }{" "}
                of{" "}
                {
                  pagination.last_page
                }

              </p>

            </div>

            <div className="flex gap-2">

              <button
                type="button"
                disabled={
                  page <= 1
                }
                onClick={() =>
                  setPage(
                    Math.max(
                      1,
                      page - 1
                    )
                  )
                }
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <button
                type="button"
                disabled={
                  page >=
                  pagination.last_page
                }
                onClick={() =>
                  setPage(
                    page + 1
                  )
                }
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>

            </div>

          </div>

        )}

      </div>

    </div>
  );
}