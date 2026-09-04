"use client";

import Image from "next/image";
import Link from "next/link";

import {
  ArrowRight,
  ChevronDown,
  Heart,
  ShoppingBag,
  UserRound,
} from "lucide-react";

import { AccountMenu, Badge, type Customer } from "./HeaderShared";

type Category = {
  id: number | string;
  name: string;
  slug: string;
  parent_id: number | string | null;
};

type NavigationItem = {
  label: string;
  href: string;
  mega?: boolean;
  highlight?: boolean;
};

type DesktopHeaderProps = {
  categories: Category[];

  parentCategories: Category[];

  mainNavigation: NavigationItem[];

  pathname: string;

  isActive: (label: string) => boolean;

  megaOpen: boolean;

  setMegaOpen: React.Dispatch<React.SetStateAction<boolean>>;

  accountOpen: boolean;

  setAccountOpen: React.Dispatch<React.SetStateAction<boolean>>;

  customer: Customer | null;

  cartCount: number;

  wishlistCount: number;

  loadingCustomer: boolean;

  firstName: string;

  handleLogout: () => void;
};

export default function DesktopHeader({
  categories,
  parentCategories,
  mainNavigation,
  isActive,
  megaOpen,
  setMegaOpen,
  accountOpen,
  setAccountOpen,
  customer,
  cartCount,
  wishlistCount,
  loadingCustomer,
  firstName,
  handleLogout,
}: DesktopHeaderProps) {
  return (
    <div className="hidden border-b border-[#ece7df] bg-white lg:block">
      <div className="mx-auto flex h-[72px] max-w-[1600px] items-center justify-between px-8 xl:px-12">
        {/* ===================================================== */}
        {/* LOGO */}
        {/* ===================================================== */}

        <Link
          href="/"
          aria-label="BanglesMart Home"
          className="flex w-[190px] shrink-0 items-center xl:w-[220px]"
        >
          <Image
            src="/logo.png"
            alt="BanglesMart"
            width={190}
            height={80}
            priority
            className="h-16 w-auto object-contain"
          />
        </Link>

        {/* ===================================================== */}
        {/* DESKTOP NAVIGATION */}
        {/* ===================================================== */}

        <nav className="flex h-full items-center justify-center gap-5 xl:gap-7">
          {mainNavigation.map((item) =>
            item.mega ? (
              <div
                key={item.label}
                className="relative h-full"
                onMouseEnter={() => {
                  setMegaOpen(true);
                  setAccountOpen(false);
                }}
                onMouseLeave={() => setMegaOpen(false)}
              >
                {/* BANGLES NAVIGATION */}

                <Link
                  href="/shop"
                  className={`relative flex h-full items-center whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.06em] transition xl:text-[12px] ${
                    isActive(item.label)
                      ? "text-[#650b12]"
                      : "text-[#333] hover:text-[#8f0828]"
                  }`}
                >
                  Bangles
                  <ChevronDown
                    size={13}
                    className={`ml-1 transition-transform duration-300 ${
                      megaOpen ? "rotate-180" : ""
                    }`}
                  />
                  {/* ACTIVE LINE */}
                  <span
                    className={`absolute bottom-0 left-0 h-[2px] bg-[#8f0828] transition-all duration-300 ${
                      isActive(item.label) ? "w-full" : "w-0"
                    }`}
                  />
                </Link>

                {/* ================================================= */}
                {/* MEGA MENU */}
                {/* ================================================= */}

                <div
                  className={`desktop-mega-menu absolute left-1/2 top-full z-50 w-[880px] ${
                    megaOpen ? "desktop-mega-menu-open" : ""
                  }`}
                >
                  <div className="overflow-hidden rounded-b-2xl border border-t-0 border-[#eee9e2] bg-white shadow-[0_22px_55px_rgba(0,0,0,.14)]">
                    {/* CATEGORY GRID */}

                    <div className="desktop-mega-content grid grid-cols-4 gap-x-8 gap-y-8 px-8 py-8">
                      {parentCategories.map((category) => {
                        const children = Array.from(
                          new Map(
                            categories
                              .filter(
                                (child) =>
                                  child.parent_id !== null &&
                                  Number(child.parent_id) ===
                                    Number(category.id),
                              )
                              .map((child) => [child.id, child]),
                          ).values(),
                        );

                        return (
                          <div key={category.id} className="min-w-0">
                            {/* PARENT CATEGORY */}

                            <Link
                              href={`/shop/${category.slug}`}
                              className="mb-3 flex items-center gap-1 text-sm font-semibold text-[#222] transition hover:text-[#8f0828]"
                            >
                              {category.name}

                              <ArrowRight size={13} />
                            </Link>

                            {/* CHILD CATEGORIES */}

                            <div className="space-y-2">
                              {children.length > 0 ? (
                                children.map((child) => (
                                  <Link
                                    key={child.id}
                                    href={`/shop/${category.slug}/${child.slug}`}
                                    className="block text-sm text-[#666] transition hover:translate-x-0.5 hover:text-[#8f0828]"
                                  >
                                    {child.name}
                                  </Link>
                                ))
                              ) : (
                                <p className="text-xs leading-5 text-[#999]">
                                  Explore the {category.name.toLowerCase()}{" "}
                                  collection.
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* ================================================= */}
                    {/* MEGA MENU FOOTER */}
                    {/* ================================================= */}

                    <div className="flex items-center justify-between border-t border-[#eee9e2] bg-[#fcfaf6] px-8 py-4">
                      <div>
                        <p className="text-sm font-semibold">
                          Find Your Perfect Bangles
                        </p>

                        <p className="mt-1 text-xs text-[#777]">
                          Explore categories managed from your store.
                        </p>
                      </div>

                      <Link
                        href="/shop"
                        className="flex items-center gap-2 text-sm font-medium text-[#8f0828]"
                      >
                        View All
                        <ArrowRight size={16} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ================================================= */
              /* NORMAL NAVIGATION ITEM */
              /* ================================================= */

              <Link
                key={item.label}
                href={item.href}
                className={`relative flex h-full items-center whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.06em] transition xl:text-[12px] ${
                  item.highlight
                    ? "text-[#8f0828]"
                    : isActive(item.label)
                      ? "text-[#650b12]"
                      : "text-[#333] hover:text-[#8f0828]"
                }`}
              >
                {item.label}

                {/* SALE BADGE */}

                {item.highlight && (
                  <span className="ml-1.5 rounded-full bg-[#8f0828] px-1.5 py-0.5 text-[7px] font-semibold uppercase tracking-wide text-white">
                    Sale
                  </span>
                )}

                {/* ACTIVE LINE */}

                <span
                  className={`absolute bottom-0 left-0 h-[2px] bg-[#8f0828] transition-all duration-300 ${
                    isActive(item.label) ? "w-full" : "w-0"
                  }`}
                />
              </Link>
            ),
          )}
        </nav>

        {/* ===================================================== */}
        {/* DESKTOP ACTIONS */}
        {/* ===================================================== */}

        <div className="flex w-[190px] shrink-0 items-center justify-end gap-1 xl:w-[220px]">
          {/* WISHLIST */}

          <Link
            href="/account/wishlist"
            aria-label="Wishlist"
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-[#333] transition hover:bg-[#f8f4ed]"
          >
            <Heart size={19} strokeWidth={1.8} />

            {wishlistCount > 0 && <Badge count={wishlistCount} />}
          </Link>

          {/* CART */}

          <Link
            href="/cart"
            aria-label="Cart"
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-[#333] transition hover:bg-[#f8f4ed]"
          >
            <ShoppingBag size={19} strokeWidth={1.8} />

            {cartCount > 0 && <Badge count={cartCount} />}
          </Link>

          {/* ================================================= */}
          {/* ACCOUNT */}
          {/* ================================================= */}

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setAccountOpen((value) => !value);

                setMegaOpen(false);
              }}
              className="flex h-9 cursor-pointer items-center gap-1.5 rounded-full px-2 text-[#333] transition hover:bg-[#f8f4ed]"
            >
              <UserRound size={19} strokeWidth={1.8} />

              <span className="hidden max-w-[80px] truncate text-sm font-medium xl:block">
                {loadingCustomer ? "Account" : firstName}
              </span>

              <ChevronDown
                size={13}
                className={`transition ${accountOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* ACCOUNT DROPDOWN */}

            {accountOpen && (
              <AccountMenu customer={customer} onLogout={handleLogout} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
