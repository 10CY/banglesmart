"use client";
import { apiFetch } from "@/lib/api";
import { Bell, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type AdminUser = {
  name?: string;
  email?: string;
};

export default function AdminTopbar() {
  const router = useRouter();

  const [user, setUser] = useState<AdminUser>({});

  useEffect(() => {
    const storedUser = localStorage.getItem("admin_user");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  async function handleLogout() {
  try {
    await apiFetch("/admin/logout", {
      method: "POST",
    });
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    // Remove local authentication data
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");

    // Redirect to login page
    router.replace("/admin/login");
  }
}

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-6 border-b border-gray-200 bg-white px-6">

      <div className="w-full max-w-md">

        <div className="relative">

          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            placeholder="Search"
            className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pl-10 pr-4 text-sm outline-none transition focus:border-gray-500 focus:bg-white"
          />

        </div>

      </div>

      <div className="flex shrink-0 items-center gap-4">

        <button className="rounded-lg p-2 text-gray-600 hover:bg-gray-100">
          <Bell size={20} />
        </button>

        <div className="text-right">

          <p className="text-sm font-medium text-gray-900">
            {user.name || "BanglesMart Admin"}
          </p>

          <p className="text-xs text-gray-500">
            {user.email}
          </p>

        </div>

        <button
          onClick={handleLogout}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          Logout
        </button>

      </div>

    </header>
  );
}