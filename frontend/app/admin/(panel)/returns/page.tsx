"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type ReturnRow = {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  reason: string;
  status: string;
  refund_status: string;
  refund_amount: string;
  created_at: string;
};

const statuses = ["requested", "approved", "rejected", "received", "completed", "cancelled"];
const refundStatuses = ["not_requested", "pending", "processed", "failed"];

export default function AdminReturnsPage() {
  const [rows, setRows] = useState<ReturnRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      setLoading(true);
      const response = await apiFetch("/admin/returns");
      const json = await response.json();
      if (!response.ok) throw new Error(json?.message || "Unable to load returns.");
      setRows(Array.isArray(json?.data) ? json.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load returns.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function update(id: number, status: string, refund_status: string) {
    const response = await apiFetch(`/admin/returns/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status, refund_status }),
    });
    const json = await response.json();
    if (!response.ok) {
      setError(json?.message || "Unable to update return.");
      return;
    }
    void load();
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[.2em] text-[#c9a227]">Customer Care</p>
      <h1 className="mt-2 text-3xl font-semibold">Returns & Refunds</h1>
      <p className="mt-1 text-sm text-gray-500">Review return requests and move them through fulfilment.</p>

      {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white">
        {loading ? (
          <div className="p-8 text-sm text-gray-500">Loading returns...</div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500">No return requests.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {rows.map((row) => (
              <article key={row.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-gray-900">Return #{row.id} · {row.order_number}</p>
                    <p className="mt-1 text-sm text-gray-600">{row.customer_name} · {row.customer_email}</p>
                    <p className="mt-2 text-xs uppercase tracking-wider text-gray-400">
                      {row.reason.replaceAll("_", " ")} · Refund ₹{Number(row.refund_amount || 0).toFixed(2)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <select
                      value={row.status}
                      onChange={(event) => void update(row.id, event.target.value, row.refund_status)}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                    >
                      {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>

                    <select
                      value={row.refund_status}
                      onChange={(event) => void update(row.id, row.status, event.target.value)}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                    >
                      {refundStatuses.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}
                    </select>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
