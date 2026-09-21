"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Download, FileText, Search } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { downloadAdminFile } from "@/lib/download";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { useAdminFeedback } from "@/components/admin/ui/AdminFeedbackProvider";

type OrderRow = {
  id: number;
  order_number: string;
  customer_name?: string | null;
  customer_email?: string | null;
  total_amount: string | number;
  status: string;
  payment_status: string;
  created_at: string;
};

export default function AdminInvoicesPage() {
  const { toast } = useAdminFeedback();
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await apiFetch("/admin/orders");
      const json = await response.json();
      if (!response.ok) throw new Error(json?.message || "Unable to load invoices.");
      setRows(Array.isArray(json?.data) ? json.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load invoices.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      [row.order_number, row.customer_name, row.customer_email]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q)),
    );
  }, [rows, search]);

  async function downloadInvoice(order: OrderRow) {
    try {
      setDownloadingId(order.id);
      await downloadAdminFile(`/admin/orders/${order.id}/invoice`, `${order.order_number}.pdf`);
      toast("Invoice downloaded.");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Unable to download invoice.", "error");
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[.2em] text-[#b18a30]">Commerce</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Invoices</h1>
          <p className="mt-1 text-sm text-gray-500">Download customer invoices generated from completed and active orders.</p>
        </div>
        <div className="rounded-2xl border border-[#e6dfd7] bg-white px-4 py-3 text-sm font-semibold shadow-sm">
          {rows.length} invoice{rows.length === 1 ? "" : "s"}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-[#e6e0d9] bg-white p-4 shadow-[0_10px_32px_rgba(45,27,20,.04)]">
        <div className="relative max-w-lg">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search order, customer or email…"
            className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[#a8822b]"
          />
        </div>
      </div>

      {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="mt-5 overflow-hidden rounded-2xl border border-[#e6e0d9] bg-white shadow-[0_12px_38px_rgba(45,27,20,.04)]">
        {loading ? (
          <div className="p-10 text-center text-sm text-gray-500">Loading invoices…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <FileText size={34} className="mx-auto text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-700">No invoices found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="border-b border-gray-100 bg-[#faf8f5] text-left text-[11px] font-semibold uppercase tracking-[.14em] text-gray-500">
                <tr>
                  <th className="px-5 py-3.5">Invoice / Order</th>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((order) => (
                  <tr key={order.id} className="transition hover:bg-[#fdfbf8]">
                    <td className="px-5 py-4">
                      <Link href={`/admin/orders/${order.id}`} className="font-semibold text-[#650b12] hover:underline">
                        {order.order_number}
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-gray-900">{order.customer_name || "Customer"}</p>
                      <p className="mt-0.5 text-xs text-gray-500">{order.customer_email || "—"}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{formatDateTime(order.created_at)}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-gray-900">{formatCurrency(order.total_amount)}</td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium capitalize text-gray-700">{order.status}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        disabled={downloadingId === order.id}
                        onClick={() => void downloadInvoice(order)}
                        className="inline-flex items-center gap-2 rounded-xl border border-[#ded5cb] bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-[#bfa86d] hover:bg-[#fffaf0] disabled:opacity-50"
                      >
                        <Download size={14} />
                        {downloadingId === order.id ? "Downloading…" : "PDF"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
