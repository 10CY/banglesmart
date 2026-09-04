"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Dashboard = {
  summary: {
    total_revenue: number;
    total_orders: number;
    total_customers: number;
    today_revenue: number;
    today_orders: number;
  };
  sales_chart: { label: string; revenue: number; orders: number }[];
};
export default function AnalyticsPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  useEffect(() => {
    apiFetch("/admin/dashboard")
      .then((r) => r.json())
      .then((j) => setData(j.data))
      .catch(() => null);
  }, []);
  return (
    <div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[.2em] text-[#c9a227]">
          Performance
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Analytics</h1>
      </div>
      {data && (
        <>
          <div className="mt-7 grid gap-4 md:grid-cols-4">
            {[
              [
                "Revenue",
                `₹${data.summary.total_revenue.toLocaleString("en-IN")}`,
              ],
              ["Orders", data.summary.total_orders],
              ["Customers", data.summary.total_customers],
              [
                "Today",
                `₹${data.summary.today_revenue.toLocaleString("en-IN")}`,
              ],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                className="rounded-2xl border border-gray-200 bg-white p-5"
              >
                <p className="text-xs text-gray-500">{label}</p>
                <p className="mt-2 text-2xl font-semibold">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="font-semibold">Last 7 Days</h2>
            <div
              className="mt-7 grid grid-cols-7 items-end gap-3"
              style={{ height: 220 }}
            >
              {data.sales_chart.map((item) => {
                const max = Math.max(
                  ...data.sales_chart.map((x) => x.revenue),
                  1,
                );
                return (
                  <div
                    key={item.label}
                    className="flex h-full flex-col items-center justify-end gap-2"
                  >
                    <div
                      className="w-full max-w-10 rounded-t-lg bg-[#8f0828]"
                      style={{
                        height: `${Math.max(4, (item.revenue / max) * 170)}px`,
                      }}
                      title={`₹${item.revenue.toLocaleString("en-IN")}`}
                    />
                    <span className="text-[10px] text-gray-500">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
