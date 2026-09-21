"use client";

import { useState, type ReactNode } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";
import { AdminFeedbackProvider } from "@/components/admin/ui/AdminFeedbackProvider";

export default function AdminShell({ children }: { children: ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <AdminFeedbackProvider>
      <div className="min-h-screen bg-[#f6f4f1] text-gray-900">
        <AdminSidebar
          mobileOpen={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
        />

        <div className="min-h-screen lg:pl-[280px]">
          <AdminTopbar onMenuClick={() => setMobileNavOpen(true)} />

          <main className="mx-auto w-full max-w-[1680px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>
      </div>
    </AdminFeedbackProvider>
  );
}
