"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronDown, LogOut, Menu, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { ADMIN_NAV_ITEMS } from "@/lib/adminNavigation";

type AdminUser = {
  name?: string;
  email?: string;
};

type Props = {
  onMenuClick?: () => void;
};

export default function AdminTopbar({ onMenuClick }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchWrapRef = useRef<HTMLDivElement | null>(null);
  const [user, setUser] = useState<AdminUser>({});
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("admin_user");
    if (!storedUser) return;

    try {
      setUser(JSON.parse(storedUser));
    } catch {
      localStorage.removeItem("admin_user");
    }
  }, []);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const searchResults = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return ADMIN_NAV_ITEMS.slice(0, 6);

    return ADMIN_NAV_ITEMS.filter((item) => {
      const haystack = [item.label, item.href, ...(item.keywords || [])].join(" ").toLowerCase();
      return haystack.includes(normalized);
    }).slice(0, 8);
  }, [query]);

  const currentItem = ADMIN_NAV_ITEMS.find(
    (item) => pathname === item.href || (item.href !== "/admin" && pathname.startsWith(`${item.href}/`)),
  );

  const initials = (user.name || "BanglesMart Admin")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  async function handleLogout() {
    try {
      await apiFetch("/admin/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_user");
      router.replace("/admin/login");
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[#e7e1da] bg-[#fbfaf8]/90 backdrop-blur-xl">
      <div className="flex h-[76px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-xl border border-[#e5ddd4] bg-white p-2.5 text-gray-700 shadow-sm transition hover:border-[#d4c7bb] lg:hidden"
          aria-label="Open admin navigation"
        >
          <Menu size={19} />
        </button>

        <div className="hidden min-w-0 sm:block lg:w-[220px]">
          <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#a8822b]">Workspace</p>
          <p className="mt-1 truncate text-sm font-semibold text-[#2d2224]">{currentItem?.label || "Admin"}</p>
        </div>

        <div ref={searchWrapRef} className="relative min-w-0 flex-1 lg:max-w-xl">
          <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={query}
            onFocus={() => setSearchOpen(true)}
            onChange={(event) => {
              setQuery(event.target.value);
              setSearchOpen(true);
            }}
            placeholder="Search admin pages…"
            className="w-full rounded-2xl border border-[#e3ddd6] bg-white py-2.5 pl-10 pr-10 text-sm text-gray-800 outline-none shadow-[0_2px_8px_rgba(53,32,23,.03)] transition placeholder:text-gray-400 focus:border-[#b79036] focus:ring-4 focus:ring-[#cba94f]/10"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            >
              <X size={14} />
            </button>
          )}

          {searchOpen && (
            <div className="absolute left-0 right-0 top-[calc(100%+10px)] overflow-hidden rounded-2xl border border-[#e5ddd5] bg-white shadow-[0_24px_70px_rgba(45,27,20,.16)]">
              <div className="border-b border-gray-100 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-gray-400">
                  {query ? "Search results" : "Quick navigation"}
                </p>
              </div>

              {searchResults.length ? (
                <div className="p-2">
                  {searchResults.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => {
                          setSearchOpen(false);
                          setQuery("");
                        }}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-700 transition hover:bg-[#faf6ef] hover:text-[#650b12]"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f7f2e9] text-[#9b7418]">
                          <Icon size={16} />
                        </span>
                        <span className="font-medium">{item.label}</span>
                        <span className="ml-auto text-[11px] text-gray-400">{item.href}</span>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="px-4 py-8 text-center text-sm text-gray-500">No admin page matches “{query}”.</div>
              )}
            </div>
          )}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            href="/admin/notifications"
            aria-label="Admin notifications"
            className="relative rounded-xl border border-[#e5ddd4] bg-white p-2.5 text-gray-600 shadow-sm transition hover:border-[#d5c5b8] hover:text-[#650b12]"
          >
            <Bell size={18} />
          </Link>

          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((value) => !value)}
              className="flex items-center gap-2 rounded-2xl border border-[#e5ddd4] bg-white p-1.5 pr-2.5 shadow-sm transition hover:border-[#d4c5b7]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#650b12] text-xs font-bold tracking-wide text-white">
                {initials || "BA"}
              </span>
              <span className="hidden max-w-[150px] text-left md:block">
                <span className="block truncate text-xs font-semibold text-gray-900">{user.name || "BanglesMart Admin"}</span>
                <span className="mt-0.5 block truncate text-[10px] text-gray-500">{user.email || "Administrator"}</span>
              </span>
              <ChevronDown size={14} className="hidden text-gray-400 sm:block" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-[calc(100%+10px)] w-60 overflow-hidden rounded-2xl border border-[#e4ddd5] bg-white shadow-[0_20px_60px_rgba(45,27,20,.16)]">
                <div className="border-b border-gray-100 px-4 py-3">
                  <p className="truncate text-sm font-semibold text-gray-900">{user.name || "BanglesMart Admin"}</p>
                  <p className="mt-0.5 truncate text-xs text-gray-500">{user.email || "Administrator"}</p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
