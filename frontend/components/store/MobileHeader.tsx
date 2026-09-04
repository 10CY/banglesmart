"use client";

import Image from "next/image";
import Link from "next/link";

import {
  ArrowRight,
  ChevronDown,
  Heart,
  LogOut,
  MapPin,
  Menu,
  Package,
  Search,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";

import { Badge, MobileLink, type Customer } from "./HeaderShared";

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

type MobileHeaderProps = {
  categories: Category[];

  parentCategories: Category[];

  mainNavigation: NavigationItem[];

  isActive: (label: string) => boolean;

  mobileOpen: boolean;

  mobileClosing: boolean;

  mobileBanglesOpen: boolean;

  mobileBanglesClosing: boolean;

  searchOpen: boolean;

  search: string;

  searchRef: React.RefObject<HTMLInputElement | null>;

  customer: Customer | null;

  cartCount: number;

  wishlistCount: number;

  firstName: string;

  setSearchOpen: React.Dispatch<React.SetStateAction<boolean>>;

  setSearch: React.Dispatch<React.SetStateAction<string>>;

  openMobileMenu: () => void;

  closeMobileMenu: () => void;

  toggleMobileBangles: () => void;

  submitSearch: (event?: React.FormEvent) => void;

  handleLogout: () => void;
};

export default function MobileHeader({
  categories,
  parentCategories,
  mainNavigation,
  isActive,

  mobileOpen,
  mobileClosing,

  mobileBanglesOpen,
  mobileBanglesClosing,

  searchOpen,
  search,
  searchRef,

  customer,

  cartCount,
  wishlistCount,

  firstName,

  setSearchOpen,
  setSearch,

  openMobileMenu,
  closeMobileMenu,
  toggleMobileBangles,

  submitSearch,

  handleLogout,
}: MobileHeaderProps) {
  return (
    <>
      {/* ===================================================== */}
      {/* MOBILE HEADER */}
      {/* ===================================================== */}

      <div className="border-b border-[#ece7df] bg-white lg:hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-[76px] items-center justify-between gap-3">
            {/* ================================================= */}
            {/* MOBILE MENU BUTTON */}
            {/* ================================================= */}

            <button
              type="button"
              aria-label={
                mobileOpen && !mobileClosing ? "Close menu" : "Open menu"
              }
              onClick={() =>
                mobileOpen ? closeMobileMenu() : openMobileMenu()
              }
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#222] transition hover:bg-[#f8f4ed]"
            >
              {mobileOpen && !mobileClosing ? (
                <X size={22} />
              ) : (
                <Menu size={22} />
              )}
            </button>

            {/* ================================================= */}
            {/* LOGO */}
            {/* ================================================= */}

            <Link
              href="/"
              aria-label="BanglesMart Home"
              className="flex shrink-0 items-center"
            >
              <Image
                src="/logo.png"
                alt="BanglesMart"
                width={190}
                height={80}
                priority
                className="h-12 w-auto object-contain sm:h-14"
              />
            </Link>

            {/* ================================================= */}
            {/* RIGHT ACTIONS */}
            {/* ================================================= */}

            <div className="flex items-center gap-1">
              {/* SEARCH */}

              <button
                type="button"
                aria-label="Search"
                onClick={() => setSearchOpen((value) => !value)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-[#333] transition hover:bg-[#f8f4ed]"
              >
                <Search size={21} />
              </button>

              {/* WISHLIST */}

              <Link
                href="/account/wishlist"
                aria-label="Wishlist"
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-[#333] transition hover:bg-[#f8f4ed]"
              >
                <Heart size={21} strokeWidth={1.8} />

                {wishlistCount > 0 && <Badge count={wishlistCount} />}
              </Link>

              {/* CART */}

              <Link
                href="/cart"
                aria-label="Cart"
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-[#333] transition hover:bg-[#f8f4ed]"
              >
                <ShoppingBag size={21} strokeWidth={1.8} />

                {cartCount > 0 && <Badge count={cartCount} />}
              </Link>
            </div>
          </div>

          {/* ================================================= */}
          {/* MOBILE SEARCH */}
          {/* ================================================= */}

          {searchOpen && (
            <form onSubmit={submitSearch} className="pb-4">
              <div className="flex h-11 items-center rounded-full border border-[#ded8ce] bg-[#fcfbf9] px-4">
                <Search size={18} className="text-[#777]" />

                <input
                  ref={searchRef}
                  autoFocus
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search bangles, bridal sets..."
                  className="ml-3 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#999]"
                />

                {search && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setSearch("")}
                    className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#f1ece5]"
                  >
                    <X size={17} />
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>

      {/* ===================================================== */}
      {/* MOBILE DRAWER */}
      {/* ===================================================== */}

      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          {/* ================================================= */}
          {/* OVERLAY */}
          {/* ================================================= */}

          <button
            type="button"
            aria-label="Close menu"
            onClick={closeMobileMenu}
            className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] ${
              mobileClosing ? "mobile-overlay-close" : "mobile-overlay-open"
            }`}
          />

          {/* ================================================= */}
          {/* DRAWER */}
          {/* ================================================= */}

          <aside
            className={`relative flex h-full w-[88%] max-w-sm flex-col bg-white shadow-2xl ${
              mobileClosing ? "mobile-drawer-close" : "mobile-drawer-open"
            }`}
          >
            {/* =============================================== */}
            {/* DRAWER HEADER */}
            {/* =============================================== */}

            <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-[#eee9e2] px-5">
              <Link href="/" onClick={closeMobileMenu}>
                <Image
                  src="/logo.png"
                  alt="BanglesMart"
                  width={170}
                  height={70}
                  className="h-12 w-auto object-contain"
                />
              </Link>

              <button
                type="button"
                aria-label="Close menu"
                onClick={closeMobileMenu}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f8f4ed] transition hover:bg-[#eee7dd]"
              >
                <X size={21} />
              </button>
            </div>

            {/* =============================================== */}
            {/* CUSTOMER */}
            {/* =============================================== */}

            <div className="shrink-0 border-b border-[#eee9e2] bg-[#fcfaf6] px-5 py-5">
              {customer ? (
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#8f0828] text-white">
                    <UserRound size={19} />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      Hello, {firstName}
                    </p>

                    <p className="truncate text-xs text-[#777]">
                      {customer.email}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm font-semibold">
                    Welcome to BanglesMart
                  </p>

                  <Link
                    href="/login"
                    onClick={closeMobileMenu}
                    className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-[#8f0828]"
                  >
                    Login / Register
                    <ArrowRight size={15} />
                  </Link>
                </>
              )}
            </div>

            {/* =============================================== */}
            {/* MOBILE NAVIGATION */}
            {/* =============================================== */}

            <div className="flex-1 overflow-y-auto px-4 py-4">
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[.2em] text-[#999]">
                Shop
              </p>

              <div className="space-y-1">
                {mainNavigation.map((item) =>
                  item.mega ? (
                    <div key={item.label}>
                      {/* BANGLES BUTTON */}

                      <button
                        type="button"
                        onClick={toggleMobileBangles}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-3.5 text-sm font-medium transition ${
                          isActive(item.label)
                            ? "bg-[#f8f4ed] text-[#8f0828]"
                            : "text-[#333] hover:bg-[#faf8f4]"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          Bangles
                          <span className="rounded-full bg-[#f3eee5] px-2 py-0.5 text-[9px] text-[#777]">
                            Explore
                          </span>
                        </span>

                        <ChevronDown
                          size={17}
                          className={`transition-transform ${
                            mobileBanglesOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {/* ===================================== */}
                      {/* BANGLES CATEGORIES */}
                      {/* ===================================== */}

                      {mobileBanglesOpen && (
                        <div
                          className={`${
                            mobileBanglesClosing
                              ? "mobile-bangles-close"
                              : "mobile-bangles-open"
                          } mb-2 mt-1 rounded-xl bg-[#fcfaf6] p-3`}
                        >
                          <div className="space-y-2">
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
                                <div
                                  key={category.id}
                                  className="rounded-xl bg-white/70 p-2"
                                >
                                  {/* PARENT CATEGORY */}

                                  <Link
                                    href={`/shop/${category.slug}`}
                                    onClick={closeMobileMenu}
                                    className="flex items-center justify-between rounded-lg px-2 py-2.5 text-xs font-semibold text-[#333] transition hover:text-[#8f0828]"
                                  >
                                    {category.name}

                                    <ArrowRight size={13} />
                                  </Link>

                                  {/* CHILD CATEGORIES */}

                                  {children.length > 0 && (
                                    <div className="grid grid-cols-2 gap-1 border-t border-[#eee9e2] px-2 pt-1">
                                      {children.map((child) => (
                                        <Link
                                          key={child.id}
                                          href={`/shop/${category.slug}/${child.slug}`}
                                          onClick={closeMobileMenu}
                                          className="rounded-lg px-2 py-2.5 text-[12px] text-[#666] transition hover:bg-white hover:text-[#8f0828]"
                                        >
                                          {child.name}
                                        </Link>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* VIEW ALL */}

                          <Link
                            href="/shop"
                            onClick={closeMobileMenu}
                            className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-[#111827] px-4 py-3 text-xs font-medium text-white transition hover:bg-black"
                          >
                            View All Bangles
                            <ArrowRight size={14} />
                          </Link>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* ===================================== */
                    /* NORMAL NAVIGATION */
                    /* ===================================== */

                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={closeMobileMenu}
                      className={`flex items-center justify-between rounded-xl px-3 py-3.5 text-sm font-medium transition ${
                        isActive(item.label)
                          ? "bg-[#f8f4ed] text-[#8f0828]"
                          : "text-[#333] hover:bg-[#faf8f4]"
                      }`}
                    >
                      <span>{item.label}</span>

                      {item.highlight && (
                        <span className="rounded-full bg-[#8f0828] px-1.5 py-0.5 text-[8px] font-semibold text-white">
                          SALE
                        </span>
                      )}
                    </Link>
                  ),
                )}
              </div>

              {/* ============================================= */}
              {/* DIVIDER */}
              {/* ============================================= */}

              <div className="my-5 border-t border-[#eee9e2]" />

              {/* ============================================= */}
              {/* MY ACCOUNT */}
              {/* ============================================= */}

              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[.2em] text-[#999]">
                My Account
              </p>

              <div className="space-y-1">
                <MobileLink
                  href="/account"
                  icon={<UserRound size={18} />}
                  label="My Account"
                  onClick={closeMobileMenu}
                />

                <MobileLink
                  href="/account/orders"
                  icon={<Package size={18} />}
                  label="My Orders"
                  onClick={closeMobileMenu}
                />

                <MobileLink
                  href="/account/addresses"
                  icon={<MapPin size={18} />}
                  label="My Addresses"
                  onClick={closeMobileMenu}
                />

                <MobileLink
                  href="/account/wishlist"
                  icon={<Heart size={18} />}
                  label="Wishlist"
                  count={wishlistCount}
                  onClick={closeMobileMenu}
                />

                <MobileLink
                  href="/cart"
                  icon={<ShoppingBag size={18} />}
                  label="Cart"
                  count={cartCount}
                  onClick={closeMobileMenu}
                />
              </div>
            </div>

            {/* =============================================== */}
            {/* LOGOUT */}
            {/* =============================================== */}

            {customer && (
              <div className="shrink-0 border-t border-[#eee9e2] p-4">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-200 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
                >
                  <LogOut size={17} />
                  Logout
                </button>
              </div>
            )}
          </aside>
        </div>
      )}
    </>
  );
}
