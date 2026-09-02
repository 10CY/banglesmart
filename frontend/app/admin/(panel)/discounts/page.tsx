"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  CalendarDays,
  Edit3,
  Percent,
  Plus,
  Search,
  Tag,
  Trash2,
  X,
} from "lucide-react";

import {
  apiFetch,
} from "@/lib/api";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type CouponType =
  | "fixed"
  | "percentage";

type CouponStatus =
  | "active"
  | "inactive";

type Coupon = {
  id: number;

  code: string;

  type: CouponType;

  value: string;

  minimum_order_amount: string;

  maximum_discount_amount:
    | string
    | null;

  usage_limit:
    | number
    | null;

  per_user_limit: number;

  starts_at:
    | string
    | null;

  expires_at:
    | string
    | null;

  status: CouponStatus;

  usages_count?: number;

  created_at: string;
  updated_at: string;
};

type Pagination = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

type CouponForm = {
  code: string;

  type: CouponType;

  value: string;

  minimum_order_amount: string;

  maximum_discount_amount: string;

  usage_limit: string;

  per_user_limit: string;

  starts_at: string;

  expires_at: string;

  status: CouponStatus;
};

/* -------------------------------------------------------------------------- */
/* Default Form                                                               */
/* -------------------------------------------------------------------------- */

const defaultForm: CouponForm = {
  code: "",

  type: "fixed",

  value: "",

  minimum_order_amount: "0",

  maximum_discount_amount: "",

  usage_limit: "",

  per_user_limit: "1",

  starts_at: "",

  expires_at: "",

  status: "active",
};

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function DiscountsPage() {
  /* ------------------------------------------------------------------------ */
  /* Data                                                                     */
  /* ------------------------------------------------------------------------ */

  const [
    coupons,
    setCoupons,
  ] = useState<Coupon[]>([]);

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
    statusFilter,
    setStatusFilter,
  ] = useState("");

  const [
    typeFilter,
    setTypeFilter,
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
    per_page: 20,
    total: 0,
  });

  /* ------------------------------------------------------------------------ */
  /* Modal                                                                    */
  /* ------------------------------------------------------------------------ */

  const [
    modalOpen,
    setModalOpen,
  ] = useState(false);

  const [
    editingCoupon,
    setEditingCoupon,
  ] = useState<Coupon | null>(
    null
  );

  const [
    form,
    setForm,
  ] = useState<CouponForm>(
    defaultForm
  );

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    formError,
    setFormError,
  ] = useState("");

  /* ------------------------------------------------------------------------ */
  /* Load Coupons                                                             */
  /* ------------------------------------------------------------------------ */

  const loadCoupons = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (statusFilter) {
        params.set("status", statusFilter);
      }

      if (typeFilter) {
        params.set("type", typeFilter);
      }

      params.set("page", String(page));
      params.set("per_page", "20");

      const response = await apiFetch(
        `/admin/coupons?${params.toString()}`
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Unable to load coupons."
        );
        setCoupons([]);
        return;
      }

      /*
      * New Node API:
      *
      * data.data = {
      *   data: [],
      *   current_page: 1,
      *   last_page: 1,
      *   per_page: 20,
      *   total: 10
      * }
      */

      const paginator = data?.data;

      /*
      * Normal paginated response
      */
      if (
        paginator &&
        !Array.isArray(paginator) &&
        Array.isArray(paginator.data)
      ) {
        setCoupons(paginator.data);

        setPagination({
          current_page:
            Number(
              paginator.current_page
            ) || 1,

          last_page:
            Number(
              paginator.last_page
            ) || 1,

          per_page:
            Number(
              paginator.per_page
            ) || 20,

          total:
            Number(
              paginator.total
            ) || 0,
        });

        return;
      }

      /*
      * Fallback if backend returns:
      *
      * data: [...]
      */
      if (Array.isArray(paginator)) {
        setCoupons(paginator);

        setPagination({
          current_page: 1,
          last_page: 1,
          per_page: paginator.length || 20,
          total: paginator.length,
        });

        return;
      }

      setCoupons([]);

      setPagination({
        current_page: 1,
        last_page: 1,
        per_page: 20,
        total: 0,
      });
    } catch (error) {
      console.error(
        "Coupon loading error:",
        error
      );

      setError(
        "Unable to connect to server."
      );

      setCoupons([]);
    } finally {
      setLoading(false);
    }
  }, [
    search,
    statusFilter,
    typeFilter,
    page,
  ]);

  /* ------------------------------------------------------------------------ */
  /* Debounced Search                                                         */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    const timer =
      window.setTimeout(
        () => {
          loadCoupons();
        },
        300
      );

    return () =>
      window.clearTimeout(
        timer
      );
  }, [loadCoupons]);

  /* ------------------------------------------------------------------------ */
  /* Reset Page When Filter Changes                                           */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    setPage(1);
  }, [
    search,
    statusFilter,
    typeFilter,
  ]);

  /* ------------------------------------------------------------------------ */
  /* Helpers                                                                  */
  /* ------------------------------------------------------------------------ */

  function formatMoney(
    value:
      | string
      | number
      | null
  ) {
    if (
      value === null ||
      value === ""
    ) {
      return "-";
    }

    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }
    ).format(
      Number(value)
    );
  }

  function formatDate(
    value:
      | string
      | null
  ) {
    if (!value) {
      return "-";
    }

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

  function toInputDateTime(
    value:
      | string
      | null
  ) {
    if (!value) {
      return "";
    }

    const date =
      new Date(value);

    const pad = (
      number: number
    ) =>
      String(number).padStart(
        2,
        "0"
      );

    return `${date.getFullYear()}-${pad(
      date.getMonth() + 1
    )}-${pad(
      date.getDate()
    )}T${pad(
      date.getHours()
    )}:${pad(
      date.getMinutes()
    )}`;
  }

  function couponValueLabel(
    coupon: Coupon
  ) {
    if (
      coupon.type ===
      "percentage"
    ) {
      return `${Number(
        coupon.value
      )}%`;
    }

    return formatMoney(
      coupon.value
    );
  }

  function isExpired(
    coupon: Coupon
  ) {
    if (
      !coupon.expires_at
    ) {
      return false;
    }

    return (
      new Date(
        coupon.expires_at
      ).getTime() <
      Date.now()
    );
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("");
    setTypeFilter("");
    setPage(1);
  }

  /* ------------------------------------------------------------------------ */
  /* Open Create                                                              */
  /* ------------------------------------------------------------------------ */

  function openCreateModal() {
    setEditingCoupon(null);

    setForm({
      ...defaultForm,
    });

    setFormError("");

    setModalOpen(true);
  }

  /* ------------------------------------------------------------------------ */
  /* Open Edit                                                                */
  /* ------------------------------------------------------------------------ */

  function openEditModal(
    coupon: Coupon
  ) {
    setEditingCoupon(
      coupon
    );

    setForm({
      code:
        coupon.code,

      type:
        coupon.type,

      value:
        String(
          coupon.value
        ),

      minimum_order_amount:
        String(
          coupon.minimum_order_amount ??
            "0"
        ),

      maximum_discount_amount:
        coupon
          .maximum_discount_amount
          ? String(
              coupon
                .maximum_discount_amount
            )
          : "",

      usage_limit:
        coupon.usage_limit !==
        null
          ? String(
              coupon.usage_limit
            )
          : "",

      per_user_limit:
        String(
          coupon.per_user_limit
        ),

      starts_at:
        toInputDateTime(
          coupon.starts_at
        ),

      expires_at:
        toInputDateTime(
          coupon.expires_at
        ),

      status:
        coupon.status,
    });

    setFormError("");

    setModalOpen(true);
  }

  /* ------------------------------------------------------------------------ */
  /* Close Modal                                                              */
  /* ------------------------------------------------------------------------ */

  function closeModal() {
    if (saving) {
      return;
    }

    setModalOpen(false);
    setEditingCoupon(null);

    setForm({
      ...defaultForm,
    });

    setFormError("");
  }

  /* ------------------------------------------------------------------------ */
  /* Change Form                                                              */
  /* ------------------------------------------------------------------------ */

  function updateForm<
    K extends keyof CouponForm
  >(
    key: K,
    value: CouponForm[K]
  ) {
    setForm(
      (
        current
      ) => ({
        ...current,
        [key]:
          value,
      })
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Submit                                                                   */
  /* ------------------------------------------------------------------------ */

  async function submitForm(
    event: FormEvent
  ) {
    event.preventDefault();

    setFormError("");

    /*
    |--------------------------------------------------------------------------
    | Basic Client Validation
    |--------------------------------------------------------------------------
    */

    if (!form.code.trim()) {
      setFormError(
        "Coupon code is required."
      );

      return;
    }

    if (
      Number(
        form.value
      ) <= 0
    ) {
      setFormError(
        "Discount value must be greater than 0."
      );

      return;
    }

    if (
      form.type ===
        "percentage" &&
      Number(
        form.value
      ) > 100
    ) {
      setFormError(
        "Percentage discount cannot exceed 100%."
      );

      return;
    }

    try {
      setSaving(true);

      const payload = {
        code:
          form.code
            .trim()
            .toUpperCase(),

        type:
          form.type,

        value:
          Number(
            form.value
          ),

        minimum_order_amount:
          Number(
            form.minimum_order_amount ||
              0
          ),

        maximum_discount_amount:
          form.maximum_discount_amount
            ? Number(
                form.maximum_discount_amount
              )
            : null,

        usage_limit:
          form.usage_limit
            ? Number(
                form.usage_limit
              )
            : null,

        per_user_limit:
          Number(
            form.per_user_limit ||
              1
          ),

        starts_at:
          form.starts_at ||
          null,

        expires_at:
          form.expires_at ||
          null,

        status:
          form.status,
      };

      const endpoint =
        editingCoupon
          ? `/admin/coupons/${editingCoupon.id}`
          : "/admin/coupons";

      const response =
        await apiFetch(
          endpoint,
          {
            method:
              editingCoupon
                ? "PUT"
                : "POST",

            body:
              JSON.stringify(
                payload
              ),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        /*
        |--------------------------------------------------------------------------
        | Laravel Validation Errors
        |--------------------------------------------------------------------------
        */

        if (data.errors) {
          const firstError =
            Object.values(
              data.errors
            )
              .flat()
              .find(Boolean);

          setFormError(
            String(
              firstError ||
                data.message ||
                "Please check the form."
            )
          );

          return;
        }

        setFormError(
          data.message ||
            "Unable to save coupon."
        );

        return;
      }

      closeModal();

      await loadCoupons();
    } catch {
      setFormError(
        "Unable to connect to server."
      );
    } finally {
      setSaving(false);
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Delete                                                                   */
  /* ------------------------------------------------------------------------ */

  async function deleteCoupon(
    coupon: Coupon
  ) {
    const confirmed =
      window.confirm(
        `Delete coupon "${coupon.code}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      const response =
        await apiFetch(
          `/admin/coupons/${coupon.id}`,
          {
            method: "DELETE",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        window.alert(
          data.message ||
            "Unable to delete coupon."
        );

        return;
      }

      await loadCoupons();
    } catch {
      window.alert(
        "Unable to connect to server."
      );
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Quick Status Change                                                      */
  /* ------------------------------------------------------------------------ */

  async function toggleStatus(
    coupon: Coupon
  ) {
    const newStatus:
      CouponStatus =
      coupon.status ===
      "active"
        ? "inactive"
        : "active";

    try {
      const response =
        await apiFetch(
          `/admin/coupons/${coupon.id}`,
          {
            method: "PUT",

            body:
              JSON.stringify({
                code:
                  coupon.code,

                type:
                  coupon.type,

                value:
                  Number(
                    coupon.value
                  ),

                minimum_order_amount:
                  Number(
                    coupon.minimum_order_amount
                  ),

                maximum_discount_amount:
                  coupon
                    .maximum_discount_amount
                    ? Number(
                        coupon
                          .maximum_discount_amount
                      )
                    : null,

                usage_limit:
                  coupon.usage_limit,

                per_user_limit:
                  coupon.per_user_limit,

                starts_at:
                  coupon.starts_at,

                expires_at:
                  coupon.expires_at,

                status:
                  newStatus,
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        window.alert(
          data.message ||
            "Unable to update coupon."
        );

        return;
      }

      await loadCoupons();
    } catch {
      window.alert(
        "Unable to connect to server."
      );
    }
  }

  const hasFilters =
    Boolean(
      search ||
        statusFilter ||
        typeFilter
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

          <h1 className="text-2xl font-semibold text-gray-900">
            Discounts & Coupons
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Create and manage promotional coupon codes.
          </p>

        </div>

        <button
          type="button"
          onClick={
            openCreateModal
          }
          className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-black"
        >
          <Plus
            size={18}
          />

          Create Coupon
        </button>

      </div>

      {/* -------------------------------------------------------------------- */}
      {/* Summary                                                              */}
      {/* -------------------------------------------------------------------- */}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

        <div className="rounded-xl border border-gray-200 bg-white p-5">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-gray-500">
                Total Coupons
              </p>

              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {pagination.total}
              </p>

            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
              <Tag size={21} />
            </div>

          </div>

        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-gray-500">
                Active on This Page
              </p>

              <p className="mt-2 text-2xl font-semibold text-green-700">

                {
                  coupons.filter(
                    (
                      coupon
                    ) =>
                      coupon.status ===
                        "active" &&
                      !isExpired(
                        coupon
                      )
                  ).length
                }

              </p>

            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-green-50 text-green-700">
              <Percent size={21} />
            </div>

          </div>

        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-gray-500">
                Usage on This Page
              </p>

              <p className="mt-2 text-2xl font-semibold text-gray-900">

                {coupons.reduce(
                  (
                    total,
                    coupon
                  ) =>
                    total +
                    Number(
                      coupon.usages_count ||
                        0
                    ),
                  0
                )}

              </p>

            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
              <Tag size={21} />
            </div>

          </div>

        </div>

      </div>

      {/* -------------------------------------------------------------------- */}
      {/* Filters                                                              */}
      {/* -------------------------------------------------------------------- */}

      <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4">

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_200px_200px]">

          {/* Search */}

          <div className="relative">

            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={
                search
              }
              onChange={(
                event
              ) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search coupon code..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition focus:border-gray-600"
            />

          </div>

          {/* Type */}

          <select
            value={
              typeFilter
            }
            onChange={(
              event
            ) =>
              setTypeFilter(
                event.target.value
              )
            }
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-600"
          >

            <option value="">
              All Types
            </option>

            <option value="fixed">
              Fixed Amount
            </option>

            <option value="percentage">
              Percentage
            </option>

          </select>

          {/* Status */}

          <select
            value={
              statusFilter
            }
            onChange={(
              event
            ) =>
              setStatusFilter(
                event.target.value
              )
            }
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-600"
          >

            <option value="">
              All Statuses
            </option>

            <option value="active">
              Active
            </option>

            <option value="inactive">
              Inactive
            </option>

          </select>

        </div>

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

          <table className="w-full min-w-[1150px]">

            <thead className="border-b border-gray-200 bg-gray-50">

              <tr>

                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Coupon
                </th>

                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Discount
                </th>

                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Min Order
                </th>

                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Max Discount
                </th>

                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Usage
                </th>

                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Validity
                </th>

                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Status
                </th>

                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-gray-200">

              {loading ? (

                <tr>

                  <td
                    colSpan={8}
                    className="px-5 py-16 text-center text-sm text-gray-500"
                  >
                    Loading coupons...
                  </td>

                </tr>

              ) : coupons.length ===
                0 ? (

                <tr>

                  <td
                    colSpan={8}
                    className="px-5 py-16 text-center"
                  >

                    <Tag
                      size={40}
                      className="mx-auto text-gray-300"
                    />

                    <h2 className="mt-4 font-semibold text-gray-900">
                      No coupons found
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      Create your first promotional coupon.
                    </p>

                    <button
                      type="button"
                      onClick={
                        openCreateModal
                      }
                      className="mt-5 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white"
                    >
                      Create Coupon
                    </button>

                  </td>

                </tr>

              ) : (

                coupons.map(
                  (
                    coupon
                  ) => {

                    const expired =
                      isExpired(
                        coupon
                      );

                    return (

                      <tr
                        key={
                          coupon.id
                        }
                        className="transition hover:bg-gray-50"
                      >

                        {/* Coupon */}

                        <td className="px-5 py-4">

                          <div>

                            <span className="inline-flex rounded-md border border-dashed border-gray-300 bg-gray-50 px-3 py-1.5 font-mono text-sm font-semibold tracking-wide text-gray-900">
                              {
                                coupon.code
                              }
                            </span>

                            <p className="mt-2 text-xs capitalize text-gray-400">
                              {
                                coupon.type
                              }
                            </p>

                          </div>

                        </td>

                        {/* Discount */}

                        <td className="px-5 py-4">

                          <p className="font-semibold text-gray-900">
                            {couponValueLabel(
                              coupon
                            )}
                          </p>

                          <p className="mt-1 text-xs text-gray-400">
                            {coupon.type ===
                            "percentage"
                              ? "Percentage discount"
                              : "Fixed discount"}
                          </p>

                        </td>

                        {/* Minimum */}

                        <td className="px-5 py-4 text-sm text-gray-700">

                          {Number(
                            coupon.minimum_order_amount
                          ) > 0
                            ? formatMoney(
                                coupon.minimum_order_amount
                              )
                            : "No minimum"}

                        </td>

                        {/* Maximum */}

                        <td className="px-5 py-4 text-sm text-gray-700">

                          {coupon.type ===
                            "percentage" &&
                          coupon.maximum_discount_amount
                            ? formatMoney(
                                coupon.maximum_discount_amount
                              )
                            : "-"}

                        </td>

                        {/* Usage */}

                        <td className="px-5 py-4">

                          <p className="text-sm font-medium text-gray-800">

                            {
                              coupon.usages_count ||
                              0
                            }

                            {coupon.usage_limit !==
                            null
                              ? ` / ${coupon.usage_limit}`
                              : ""}

                          </p>

                          <p className="mt-1 text-xs text-gray-400">

                            {
                              coupon.per_user_limit
                            }{" "}
                            per customer

                          </p>

                        </td>

                        {/* Validity */}

                        <td className="px-5 py-4">

                          <div className="text-sm text-gray-600">

                            <p>
                              {coupon.starts_at
                                ? formatDate(
                                    coupon.starts_at
                                  )
                                : "Starts immediately"}
                            </p>

                            <p className="mt-1 text-xs text-gray-400">

                              {coupon.expires_at
                                ? `Ends ${formatDate(
                                    coupon.expires_at
                                  )}`
                                : "No expiry"}

                            </p>

                          </div>

                        </td>

                        {/* Status */}

                        <td className="px-5 py-4">

                          {expired ? (

                            <span className="inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                              Expired
                            </span>

                          ) : (

                            <button
                              type="button"
                              onClick={() =>
                                toggleStatus(
                                  coupon
                                )
                              }
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize transition ${
                                coupon.status ===
                                "active"
                                  ? "bg-green-50 text-green-700 hover:bg-green-100"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              }`}
                            >
                              {
                                coupon.status
                              }
                            </button>

                          )}

                        </td>

                        {/* Actions */}

                        <td className="px-5 py-4">

                          <div className="flex justify-end gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(
                                  coupon
                                )
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
                              title="Edit coupon"
                            >
                              <Edit3
                                size={16}
                              />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                deleteCoupon(
                                  coupon
                                )
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-white text-red-500 transition hover:bg-red-50"
                              title="Delete coupon"
                            >
                              <Trash2
                                size={16}
                              />
                            </button>

                          </div>

                        </td>

                      </tr>

                    );
                  }
                )

              )}

            </tbody>

          </table>

        </div>

        {/* Pagination */}

        {!loading &&
          pagination.total >
            0 && (

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 px-5 py-4">

            <div>

              <p className="text-sm text-gray-500">

                {
                  pagination.total
                }{" "}
                coupon
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

      {/* -------------------------------------------------------------------- */}
      {/* Create / Edit Modal                                                  */}
      {/* -------------------------------------------------------------------- */}

      {modalOpen && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl">

            {/* Modal Header */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">

              <div>

                <h2 className="text-lg font-semibold text-gray-900">

                  {editingCoupon
                    ? "Edit Coupon"
                    : "Create Coupon"}

                </h2>

                <p className="mt-1 text-sm text-gray-500">

                  {editingCoupon
                    ? "Update discount settings."
                    : "Create a new discount code for customers."}

                </p>

              </div>

              <button
                type="button"
                onClick={
                  closeModal
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100"
              >
                <X
                  size={19}
                />
              </button>

            </div>

            {/* Form */}

            <form
              onSubmit={
                submitForm
              }
              className="p-6"
            >

              {formError && (

                <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {
                    formError
                  }
                </div>

              )}

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                {/* Code */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Coupon Code *
                  </label>

                  <input
                    type="text"
                    value={
                      form.code
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        "code",
                        event.target.value
                          .toUpperCase()
                          .replace(
                            /\s+/g,
                            ""
                          )
                      )
                    }
                    placeholder="SAVE20"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 font-mono text-sm uppercase outline-none focus:border-gray-600"
                  />

                </div>

                {/* Type */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Discount Type *
                  </label>

                  <select
                    value={
                      form.type
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        "type",
                        event.target
                          .value as CouponType
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-gray-600"
                  >

                    <option value="fixed">
                      Fixed Amount
                    </option>

                    <option value="percentage">
                      Percentage
                    </option>

                  </select>

                </div>

                {/* Value */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">

                    {form.type ===
                    "percentage"
                      ? "Percentage (%) *"
                      : "Discount Amount (₹) *"}

                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    max={
                      form.type ===
                      "percentage"
                        ? "100"
                        : undefined
                    }
                    value={
                      form.value
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        "value",
                        event.target.value
                      )
                    }
                    placeholder={
                      form.type ===
                      "percentage"
                        ? "20"
                        : "100"
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-gray-600"
                  />

                </div>

                {/* Minimum Order */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Minimum Order Amount
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      form.minimum_order_amount
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        "minimum_order_amount",
                        event.target.value
                      )
                    }
                    placeholder="0"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-gray-600"
                  />

                </div>

                {/* Maximum Discount */}

                {form.type ===
                  "percentage" && (

                  <div>

                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Maximum Discount Amount
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        form.maximum_discount_amount
                      }
                      onChange={(
                        event
                      ) =>
                        updateForm(
                          "maximum_discount_amount",
                          event.target.value
                        )
                      }
                      placeholder="500"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-gray-600"
                    />

                    <p className="mt-1 text-xs text-gray-400">
                      Leave blank for no maximum.
                    </p>

                  </div>

                )}

                {/* Global Usage Limit */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Total Usage Limit
                  </label>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={
                      form.usage_limit
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        "usage_limit",
                        event.target.value
                      )
                    }
                    placeholder="Unlimited"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-gray-600"
                  />

                  <p className="mt-1 text-xs text-gray-400">
                    Leave blank for unlimited uses.
                  </p>

                </div>

                {/* Per User */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Usage Per Customer *
                  </label>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={
                      form.per_user_limit
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        "per_user_limit",
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-gray-600"
                  />

                </div>

                {/* Start Date */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Starts At
                  </label>

                  <div className="relative">

                    <CalendarDays
                      size={17}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      type="datetime-local"
                      value={
                        form.starts_at
                      }
                      onChange={(
                        event
                      ) =>
                        updateForm(
                          "starts_at",
                          event.target.value
                        )
                      }
                      className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-gray-600"
                    />

                  </div>

                </div>

                {/* Expiry */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Expires At
                  </label>

                  <div className="relative">

                    <CalendarDays
                      size={17}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      type="datetime-local"
                      value={
                        form.expires_at
                      }
                      onChange={(
                        event
                      ) =>
                        updateForm(
                          "expires_at",
                          event.target.value
                        )
                      }
                      className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-gray-600"
                    />

                  </div>

                </div>

                {/* Status */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Status *
                  </label>

                  <select
                    value={
                      form.status
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        "status",
                        event.target
                          .value as CouponStatus
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-gray-600"
                  >

                    <option value="active">
                      Active
                    </option>

                    <option value="inactive">
                      Inactive
                    </option>

                  </select>

                </div>

              </div>

              {/* Example */}

              <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4">

                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Coupon Preview
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-3">

                  <span className="rounded-md border border-dashed border-gray-300 bg-white px-3 py-1.5 font-mono text-sm font-semibold text-gray-900">
                    {form.code ||
                      "COUPON"}
                  </span>

                  <span className="text-sm font-medium text-gray-700">

                    {form.type ===
                    "percentage"
                      ? `${form.value || 0}% OFF`
                      : `${formatMoney(
                          form.value ||
                            0
                        )} OFF`}

                  </span>

                </div>

                {Number(
                  form.minimum_order_amount
                ) > 0 && (

                  <p className="mt-2 text-xs text-gray-500">

                    Valid on orders above{" "}

                    {formatMoney(
                      form.minimum_order_amount
                    )}

                  </p>

                )}

              </div>

              {/* Actions */}

              <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-gray-200 pt-5">

                <button
                  type="button"
                  disabled={
                    saving
                  }
                  onClick={
                    closeModal
                  }
                  className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving
                  }
                  className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                >

                  {saving
                    ? "Saving..."
                    : editingCoupon
                    ? "Update Coupon"
                    : "Create Coupon"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}