import Link from "next/link";

import {
  Heart,
  LogOut,
  MapPin,
  Package,
  Settings,
  ShoppingBag,
  UserRound,
} from "lucide-react";

export type Customer = {
  id?: number;
  name?: string;
  email?: string;
  phone?: string | null;
};

export function Badge({ count }: { count: number }) {
  return (
    <span className="absolute right-0.5 top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[#8f0828] px-1 text-[9px] font-semibold text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function AccountMenu({
  customer,
  onLogout,
}: {
  customer: Customer | null;
  onLogout: () => void;
}) {
  return (
    <div className="absolute right-0 top-[calc(100%+12px)] w-72 overflow-hidden rounded-2xl border border-[#e8e1d7] bg-white shadow-[0_18px_50px_rgba(0,0,0,.12)]">
      {customer ? (
        <>
          <div className="border-b border-[#eee9e2] bg-[#fcfaf6] px-5 py-4">
            <p className="text-sm font-semibold">
              {customer.name || "Customer"}
            </p>

            <p className="mt-1 truncate text-xs text-[#777]">
              {customer.email}
            </p>
          </div>

          <div className="p-2">
            <AccountLink
              href="/account"
              icon={<UserRound size={17} />}
              label="My Account"
            />

            <AccountLink
              href="/account/orders"
              icon={<Package size={17} />}
              label="My Orders"
            />

            <AccountLink
              href="/account/addresses"
              icon={<MapPin size={17} />}
              label="My Addresses"
            />

            <AccountLink
              href="/account/wishlist"
              icon={<Heart size={17} />}
              label="My Wishlist"
            />

            <AccountLink
              href="/account/profile"
              icon={<Settings size={17} />}
              label="Profile Settings"
            />
          </div>

          <div className="border-t border-[#eee9e2] p-2">
            <button
              type="button"
              onClick={onLogout}
              className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut size={17} />
              Logout
            </button>
          </div>
        </>
      ) : (
        <div className="p-5">
          <h3 className="text-sm font-semibold">Welcome to BanglesMart</h3>

          <p className="mt-1 text-xs leading-5 text-[#777]">
            Sign in to manage your orders and wishlist.
          </p>

          <Link
            href="/login"
            className="mt-4 flex h-10 items-center justify-center rounded-full bg-[#111827] text-sm font-medium text-white"
          >
            Login / Register
          </Link>
        </div>
      )}
    </div>
  );
}

export function AccountLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#333] hover:bg-[#f8f4ed]"
    >
      <span className="text-[#777]">{icon}</span>

      {label}
    </Link>
  );
}

export function MobileLink({
  href,
  icon,
  label,
  count,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  count?: number;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center justify-between rounded-xl px-3 py-3 text-sm text-[#333] hover:bg-[#faf8f4]"
    >
      <span className="flex items-center gap-3">
        <span className="text-[#777]">{icon}</span>

        {label}
      </span>

      {count ? (
        <span className="rounded-full bg-[#8f0828] px-2 py-0.5 text-[10px] font-semibold text-white">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
