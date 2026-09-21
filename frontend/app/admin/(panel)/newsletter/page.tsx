"use client";

import { useCallback, useEffect, useState } from "react";
import { Mail, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAdminFeedback } from "@/components/admin/ui/AdminFeedbackProvider";

type Subscriber = {
  id: number;
  email: string;
  status: string;
  source: string;
  subscribed_at: string | null;
};

export default function NewsletterAdminPage() {
  const { confirm, toast } = useAdminFeedback();
  const [rows, setRows] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await apiFetch("/admin/newsletter");
      const json = await response.json();
      if (!response.ok) throw new Error(json?.message || "Unable to load subscribers.");
      setRows(Array.isArray(json?.data) ? json.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load subscribers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function remove(subscriber: Subscriber) {
    const confirmed = await confirm({
      title: "Remove subscriber?",
      description: `Remove ${subscriber.email} from the BanglesMart newsletter list?`,
      confirmLabel: "Remove subscriber",
      tone: "danger",
    });
    if (!confirmed) return;

    try {
      const response = await apiFetch(`/admin/newsletter/${subscriber.id}`, { method: "DELETE" });
      const json = await response.json();
      if (!response.ok) throw new Error(json?.message || "Unable to remove subscriber.");
      toast("Subscriber removed.");
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to remove subscriber.";
      setError(message);
      toast(message, "error");
    }
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[.2em] text-[#b18a30]">Marketing</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Newsletter Subscribers</h1>
          <p className="mt-1 text-sm text-gray-500">Manage customers who opted in to collection updates.</p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-[#e8e1d8] bg-white px-4 py-3 text-sm font-semibold shadow-sm">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fbf4e6] text-[#a47f25]"><Mail size={17} /></span>
          <span>{rows.length} subscribers</span>
        </div>
      </div>

      {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="mt-6 overflow-hidden rounded-2xl border border-[#e6e0d9] bg-white shadow-[0_12px_38px_rgba(45,27,20,.04)]">
        {loading ? (
          <div className="p-8 text-sm text-gray-500">Loading subscribers...</div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500">No subscribers yet.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {rows.map((row) => (
              <div key={row.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 transition hover:bg-[#fdfbf8]">
                <div>
                  <p className="font-medium text-gray-900">{row.email}</p>
                  <p className="mt-1 text-xs capitalize text-gray-500">{row.status} · {row.source}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void remove(row)}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                >
                  <Trash2 size={14} /> Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
