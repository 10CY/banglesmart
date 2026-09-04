"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Package,
  RotateCcw,
} from "lucide-react";

import { customerApiFetch } from "@/lib/customerApi";

type ReturnRow = {
  id: number;
  order_number: string;
  reason: string;
  status: string;
  refund_status: string;
  refund_amount: string;
  created_at: string;
};

function formatReason(reason: string) {
  return reason
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(date: string) {
  if (!date) return "";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatusStyle(status: string) {
  const value = status.toLowerCase();

  if (value === "approved" || value === "completed" || value === "accepted") {
    return {
      dot: "bg-emerald-500",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-100",
    };
  }

  if (value === "rejected" || value === "cancelled") {
    return {
      dot: "bg-red-500",
      bg: "bg-red-50",
      text: "text-red-700",
      border: "border-red-100",
    };
  }

  return {
    dot: "bg-amber-500",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-100",
  };
}

export default function AccountReturnsPage() {
  const [rows, setRows] = useState<ReturnRow[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    async function loadReturns() {
      try {
        setLoading(true);

        setError("");

        const response = await customerApiFetch("/customer/returns");

        const json = await response.json();

        if (response.status === 401) {
          window.location.href = "/login";

          return;
        }

        if (!response.ok) {
          throw new Error(json?.message || "Unable to load returns.");
        }

        setRows(Array.isArray(json?.data) ? json.data : []);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Unable to load returns.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadReturns();
  }, []);

  return (
    <main className="min-h-screen bg-[#faf9f7] px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* ================================================ */}
        {/* BACK BUTTON */}
        {/* ================================================ */}

        <Link
          href="/account"
          className="inline-flex items-center gap-2 rounded-lg text-sm font-medium text-gray-600 transition hover:text-[#8f0828]"
        >
          <ArrowLeft size={17} />
          My Account
        </Link>

        {/* ================================================ */}
        {/* PAGE HEADER */}
        {/* ================================================ */}

        <div className="mt-5 overflow-hidden rounded-2xl border border-[#ece7df] bg-white shadow-sm">
          <div className="relative px-5 py-6 sm:px-8 sm:py-8">
            {/* DECORATION */}

            <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-[#f8f1e5] blur-2xl" />

            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
              {/* ICON */}

              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#8f0828] text-white shadow-lg shadow-[#8f0828]/20">
                <RotateCcw size={25} />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8f0828]">
                  Customer Support
                </p>

                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
                  Returns & Refunds
                </h1>

                <p className="mt-2 max-w-xl text-sm leading-6 text-gray-500">
                  Track your return requests and stay updated on the status of
                  your refunds.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================ */}
        {/* ERROR */}
        {/* ================================================ */}

        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-4 text-sm text-red-700">
            <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-red-500" />

            <p>{error}</p>
          </div>
        )}

        {/* ================================================ */}
        {/* RETURNS LIST */}
        {/* ================================================ */}

        <div className="mt-6">
          {/* SECTION TITLE */}

          {!loading && rows.length > 0 && (
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Your Requests
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {rows.length}{" "}
                  {rows.length === 1 ? "return request" : "return requests"}
                </p>
              </div>
            </div>
          )}

          {/* ============================================== */}
          {/* LOADING */}
          {/* ============================================== */}

          {loading ? (
            <div className="overflow-hidden rounded-2xl border border-[#ece7df] bg-white">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="animate-pulse border-b border-gray-100 p-6 last:border-0"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-3">
                      <div className="h-4 w-48 rounded bg-gray-100" />

                      <div className="h-3 w-64 rounded bg-gray-100" />
                    </div>

                    <div className="h-8 w-20 rounded-full bg-gray-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : rows.length === 0 ? (
            /* ============================================ */
            /* EMPTY STATE */
            /* ============================================ */

            <div className="rounded-2xl border border-[#ece7df] bg-white px-6 py-16 text-center sm:px-10">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f8f1e5] text-[#8f0828]">
                <Package size={28} />
              </div>

              <h2 className="mt-5 text-lg font-semibold text-gray-900">
                No return requests yet
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                When you request a return for an eligible order, its status will
                appear here.
              </p>

              <Link
                href="/account/orders"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#8f0828] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#73061f]"
              >
                View My Orders
                <ChevronRight size={16} />
              </Link>
            </div>
          ) : (
            /* ============================================ */
            /* RETURN CARDS */
            /* ============================================ */

            <div className="space-y-4">
              {rows.map((item) => {
                const statusStyle = getStatusStyle(item.status);

                return (
                  <div
                    key={item.id}
                    className="group overflow-hidden rounded-2xl border border-[#ece7df] bg-white transition duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/[0.04]"
                  >
                    <div className="p-5 sm:p-6">
                      {/* ================================= */}
                      {/* TOP */}
                      {/* ================================= */}

                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                            <h3 className="font-semibold text-gray-900">
                              Return #{item.id}
                            </h3>

                            <span className="text-gray-300">•</span>

                            <Link
                              href={`/account/orders/${item.order_number}`}
                              className="text-sm font-medium text-[#8f0828] hover:underline"
                            >
                              Order {item.order_number}
                            </Link>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-500">
                            {/* DATE */}

                            <div className="flex items-center gap-2">
                              <CalendarDays size={15} />

                              {formatDate(item.created_at)}
                            </div>

                            {/* REASON */}

                            <div className="flex items-center gap-2">
                              <RotateCcw size={15} />

                              {formatReason(item.reason)}
                            </div>
                          </div>
                        </div>

                        {/* STATUS */}

                        <span
                          className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`}
                          />

                          {item.status}
                        </span>
                      </div>

                      {/* ================================= */}
                      {/* REFUND INFO */}
                      {/* ================================= */}

                      <div className="mt-5 grid gap-3 border-t border-[#f0ede8] pt-5 sm:grid-cols-2">
                        {/* REFUND AMOUNT */}

                        <div className="rounded-xl bg-[#faf9f7] p-4">
                          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                            <CircleDollarSign size={15} />
                            Refund Amount
                          </div>

                          <p className="mt-2 text-lg font-semibold text-gray-900">
                            ₹{Number(item.refund_amount || 0).toFixed(2)}
                          </p>
                        </div>

                        {/* REFUND STATUS */}

                        <div className="rounded-xl bg-[#faf9f7] p-4">
                          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                            <Clock3 size={15} />
                            Refund Status
                          </div>

                          <p className="mt-2 text-sm font-semibold capitalize text-gray-800">
                            {item.refund_status?.replaceAll("_", " ") ||
                              "Pending"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* ================================= */}
                    {/* FOOTER */}
                    {/* ================================= */}

                    <div className="flex items-center justify-between border-t border-[#f0ede8] bg-[#fcfbf9] px-5 py-3 sm:px-6">
                      <p className="text-xs text-gray-400">
                        Return request ID: {item.id}
                      </p>

                      <Link
                        href={`/account/returns/${item.id}`}
                        className="flex items-center gap-1 text-xs font-semibold text-[#8f0828] transition hover:gap-2"
                      >
                        View Details
                        <ChevronRight size={15} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
