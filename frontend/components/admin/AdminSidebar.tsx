"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gem, X } from "lucide-react";
import { ADMIN_NAVIGATION } from "@/lib/adminNavigation";

type Props = {
  mobileOpen?: boolean;
  onClose?: () => void;
};

export default function AdminSidebar({ mobileOpen = false, onClose }: Props) {
  const pathname = usePathname();

  return (
    <>
      <button
        type="button"
        aria-label="Close navigation"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/45 backdrop-blur-sm transition lg:hidden ${
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-white/10 bg-[linear-gradient(180deg,#1e0d11_0%,#15090c_54%,#100709_100%)] text-white shadow-[20px_0_70px_rgba(34,9,15,.18)] transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-[76px] items-center justify-between border-b border-white/10 px-5">
          <Link href="/admin" onClick={onClose} className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#d7b75c]/35 bg-[#d7b75c]/10 text-[#e0bf67] shadow-inner">
              <Gem size={20} strokeWidth={1.8} />
            </span>
            <span>
              <span className="block text-[17px] font-semibold tracking-[.01em] text-white">BanglesMart</span>
              <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[.24em] text-[#d7b75c]">Commerce Admin</span>
            </span>
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-white/60 transition hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5 [scrollbar-width:thin] [scrollbar-color:#5a333d_transparent]">
          <div className="space-y-6">
            {ADMIN_NAVIGATION.map((group) => (
              <div key={group.label}>
                <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[.22em] text-white/35">
                  {group.label}
                </p>

                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active =
                      pathname === item.href ||
                      (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                          active
                            ? "bg-white text-[#351118] shadow-[0_8px_24px_rgba(0,0,0,.18)]"
                            : "text-white/72 hover:bg-white/[.07] hover:text-white"
                        }`}
                      >
                        {active && (
                          <span className="absolute -left-0.5 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-[#caa84f]" />
                        )}

                        <Icon
                          size={18}
                          strokeWidth={1.8}
                          className={active ? "text-[#8f0828]" : "text-white/45 transition group-hover:text-[#d8b75f]"}
                        />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="rounded-2xl border border-[#d7b75c]/20 bg-[#d7b75c]/[.07] p-3.5">
            <p className="text-xs font-semibold text-white">BanglesMart Console</p>
            <p className="mt-1 text-[11px] leading-5 text-white/45">Products, customers, carts, wishlists and orders in one workspace.</p>
          </div>
        </div>
      </aside>
    </>
  );
}
