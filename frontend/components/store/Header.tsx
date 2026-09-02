"use client";
import { Suspense } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  ArrowRight,
  ChevronDown,
  Heart,
  LogOut,
  MapPin,
  Menu,
  Package,
  Search,
  Settings,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";

import { customerApiFetch } from "@/lib/customerApi";
import { useStoreCatalog } from "@/components/store/StoreCatalogProvider";

type Customer = {
  id?: number;
  name?: string;
  email?: string;
  phone?: string | null;
};

type CountResponse = {
  data?: {
    items?: unknown[];
    item_count?: number;
  } | unknown[];
};

type RefreshDetail = {
  cartCount?: number;
  wishlistDelta?: number;
};

const mainNavigation = [
  {
    label: "Home",
    href: "/",
  },

  {
    label: "Shop",
    href: "/shop",
  },

  {
    label: "Bangles",
    href: "/shop",
    mega: true,
  },

  {
    label: "Bridal",
    href: "/shop/bridal-bangles",
  },

  {
    label: "New Arrivals",
    href: "/shop/new-arrivals",
  },

  {
    label: "Best Sellers",
    href: "/shop/best-sellers",
  },

  {
    label: "Offers",
    href: "/offers",
    highlight: true,
  },
];

 function HeaderContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const searchRef = useRef<HTMLInputElement>(null);

  const { categories } = useStoreCatalog();
  /*
   * IMPORTANT:
   *
   * Only categories with parent_id === null
   * are treated as top-level categories.
   */
  const parentCategories = categories.filter(
    (category) => category.parent_id === null
  );

  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileClosing, setMobileClosing] = useState(false);

  const [mobileBanglesOpen, setMobileBanglesOpen] =
    useState(false);

  const [mobileBanglesClosing, setMobileBanglesClosing] =
    useState(false);

  const [megaOpen, setMegaOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const [search, setSearch] = useState("");

  const [customer, setCustomer] =
    useState<Customer | null>(null);

  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  const [loadingCustomer, setLoadingCustomer] =
    useState(true);

  /*
   * ----------------------------------------------------
   * CUSTOMER / CART / WISHLIST
   * ----------------------------------------------------
   */

  const loadCustomerData = useCallback(async () => {
    const token = localStorage.getItem(
      "customer_token"
    );

    if (!token) {
      setCustomer(null);
      setCartCount(0);
      setWishlistCount(0);
      setLoadingCustomer(false);
      return;
    }

    try {
      const stored =
        localStorage.getItem("customer_user");

      if (stored) {
        try {
          setCustomer(JSON.parse(stored));
        } catch {
          localStorage.removeItem("customer_user");
        }
      }

      const [
        meResponse,
        cartResponse,
        wishlistResponse,
      ] = await Promise.allSettled([
        customerApiFetch("/customer/me"),
        customerApiFetch("/customer/cart"),
        customerApiFetch("/customer/wishlist"),
      ]);

      /*
       * CUSTOMER
       */

      if (
        meResponse.status === "fulfilled" &&
        meResponse.value.ok
      ) {
        const json =
          await meResponse.value.json();

        const data =
          json?.data ||
          json?.user ||
          json;

        setCustomer(data);

        localStorage.setItem(
          "customer_user",
          JSON.stringify(data)
        );
      }

      /*
       * CART
       */

      if (
        cartResponse.status === "fulfilled" &&
        cartResponse.value.ok
      ) {
        const json =
          (await cartResponse.value.json()) as CountResponse;

        const data = json?.data as
          | {
              items?: unknown[];
              item_count?: number;
            }
          | undefined;

        setCartCount(
          typeof data?.item_count === "number"
            ? data.item_count
            : Array.isArray(data?.items)
            ? data.items.length
            : 0
        );
      }

      /*
       * WISHLIST
       */

      if (
        wishlistResponse.status === "fulfilled" &&
        wishlistResponse.value.ok
      ) {
        const json =
          (await wishlistResponse.value.json()) as CountResponse;

        const data = json?.data as
          | {
              items?: unknown[];
              item_count?: number;
            }
          | unknown[]
          | undefined;

        if (Array.isArray(data)) {
          setWishlistCount(data.length);
        } else {
          setWishlistCount(
            typeof data?.item_count === "number"
              ? data.item_count
              : Array.isArray(data?.items)
              ? data.items.length
              : 0
          );
        }
      }
    } finally {
      setLoadingCustomer(false);
    }
  }, []);

  useEffect(() => {
    void loadCustomerData();

    const refresh = (event: Event) => {
      const detail =
        (event as CustomEvent<RefreshDetail>).detail;

      if (detail?.cartCount !== undefined) {
        setCartCount(
          Math.max(0, detail.cartCount)
        );
      }

      if (
        detail?.wishlistDelta !== undefined
      ) {
        setWishlistCount((current) =>
          Math.max(
            0,
            current + detail.wishlistDelta!
          )
        );
      }

      void loadCustomerData();
    };

    const storageRefresh = () =>
      void loadCustomerData();

    window.addEventListener(
      "banglesmart:customer-refresh",
      refresh
    );

    window.addEventListener(
      "storage",
      storageRefresh
    );

    return () => {
      window.removeEventListener(
        "banglesmart:customer-refresh",
        refresh
      );

      window.removeEventListener(
        "storage",
        storageRefresh
      );
    };
  }, [loadCustomerData]);

  /*
   * ----------------------------------------------------
   * CLOSE MENUS WHEN ROUTE CHANGES
   * ----------------------------------------------------
   */

  useEffect(() => {
    setAccountOpen(false);
    setSearchOpen(false);
    setMegaOpen(false);
  }, [pathname]);

  /*
   * ----------------------------------------------------
   * MOBILE BODY LOCK
   * ----------------------------------------------------
   */

  useEffect(() => {
    document.body.style.overflow =
      mobileOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  /*
   * ----------------------------------------------------
   * KEYBOARD SEARCH
   * ----------------------------------------------------
   */

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (
        event.key === "/" &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        const target =
          event.target as HTMLElement;

        if (
          target.tagName !== "INPUT" &&
          target.tagName !== "TEXTAREA"
        ) {
          event.preventDefault();

          setSearchOpen(true);

          setTimeout(() => {
            searchRef.current?.focus();
          }, 50);
        }
      }

      if (event.key === "Escape") {
        setAccountOpen(false);
        setSearchOpen(false);
        setMegaOpen(false);

        if (mobileOpen) {
          closeMobileMenu();
        }
      }
    }

    window.addEventListener(
      "keydown",
      onKeyDown
    );

    return () =>
      window.removeEventListener(
        "keydown",
        onKeyDown
      );
  }, [mobileOpen]);

  /*
   * ----------------------------------------------------
   * ACTIVE NAVIGATION
   * ----------------------------------------------------
   */

  function activeNavigationLabel() {
  if (pathname === "/") {
    return "Home";
  }


  if (pathname === "/offers") {
    return "Offers";
  }


  // New Arrival page
  if (
    pathname === "/shop/new-arrivals" ||
    (
      pathname === "/shop" &&
      searchParams.get("new_arrival") === "1"
    )
  ) {
    return "New Arrivals";
  }


  // Best Seller page
  if (
    pathname === "/shop/best-sellers" ||
    (
      pathname === "/shop" &&
      searchParams.get("best_seller") === "1"
    )
  ) {
    return "Best Sellers";
  }


  // Bridal category
  if (
    pathname.startsWith("/shop/bridal-bangles")
  ) {
    return "Bridal";
  }


  // All category pages
  // Example:
  // /shop/glass-bangles
  // /shop/glass-bangles/bridal-glass-bangles

  if (pathname.startsWith("/shop/")) {
    return "Bangles";
  }


  if (pathname === "/shop") {
    return "Shop";
  }


  return "";
}

  function isActive(label: string) {
    return (
      activeNavigationLabel() === label
    );
  }

  /*
   * ----------------------------------------------------
   * SEARCH
   * ----------------------------------------------------
   */

  function submitSearch(
    event?: React.FormEvent
  ) {
    event?.preventDefault();

    const query = search.trim();

    if (!query) return;

    setSearchOpen(false);
    closeMobileMenu();

    router.push(
      `/shop?search=${encodeURIComponent(query)}`
    );
  }

  /*
   * ----------------------------------------------------
   * MOBILE MENU
   * ----------------------------------------------------
   */

  function openMobileMenu() {
    setMobileClosing(false);
    setMobileOpen(true);
    setAccountOpen(false);
  }

  function closeMobileMenu() {
    if (
      !mobileOpen ||
      mobileClosing
    ) {
      return;
    }

    setMobileClosing(true);

    setTimeout(() => {
      setMobileOpen(false);
      setMobileClosing(false);

      setMobileBanglesOpen(false);
      setMobileBanglesClosing(false);
    }, 550);
  }

  function toggleMobileBangles() {
    if (mobileBanglesOpen) {
      setMobileBanglesClosing(true);

      setTimeout(() => {
        setMobileBanglesOpen(false);
        setMobileBanglesClosing(false);
      }, 300);
    } else {
      setMobileBanglesClosing(false);
      setMobileBanglesOpen(true);
    }
  }

  /*
   * ----------------------------------------------------
   * LOGOUT
   * ----------------------------------------------------
   */

  function handleLogout() {
    localStorage.removeItem(
      "customer_token"
    );

    localStorage.removeItem(
      "customer_user"
    );

    setCustomer(null);
    setAccountOpen(false);

    closeMobileMenu();

    window.dispatchEvent(
      new Event(
        "banglesmart:customer-refresh"
      )
    );

    router.push("/login");
  }

  const firstName =
    customer?.name
      ?.trim()
      ?.split(" ")[0] ||
    "Account";

  /*
   * ----------------------------------------------------
   * RENDER
   * ----------------------------------------------------
   */

  return (
    <>
      <header className="sticky top-0 z-50 bg-white">

        {/* TOP ANNOUNCEMENT BAR */}

        <div className="bg-[#650b12] text-white">
          <div className="mx-auto flex h-7 max-w-[1600px] items-center justify-between px-4 text-[8px] font-medium uppercase tracking-[0.08em] sm:px-6 lg:px-8">
            <p>✧ Free Shipping on Orders Above ₹999</p>

            <p className="hidden sm:block">
              ✦ 100% Original Products
            </p>
          </div>
        </div>

        {/* ================= MOBILE HEADER ================= */}

        <div className="border-b border-[#ece7df] bg-white lg:hidden">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">

            <div className="flex h-[76px] items-center justify-between gap-3">

              {/* MOBILE MENU BUTTON */}

              <button
                type="button"
                aria-label={
                  mobileOpen && !mobileClosing
                    ? "Close menu"
                    : "Open menu"
                }
                onClick={() =>
                  mobileOpen
                    ? closeMobileMenu()
                    : openMobileMenu()
                }
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#222] transition hover:bg-[#f8f4ed]"
              >
                {mobileOpen && !mobileClosing ? (
                  <X size={22} />
                ) : (
                  <Menu size={22} />
                )}
              </button>

              {/* LOGO */}

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

              {/* RIGHT ACTIONS */}

              <div className="flex items-center gap-1">

                {/* MOBILE SEARCH */}

                <button
                  type="button"
                  aria-label="Search"
                  onClick={() =>
                    setSearchOpen((value) => !value)
                  }
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

                  {wishlistCount > 0 && (
                    <Badge count={wishlistCount} />
                  )}
                </Link>

                {/* CART */}

                <Link
                  href="/cart"
                  aria-label="Cart"
                  className="relative flex h-10 w-10 items-center justify-center rounded-full text-[#333] transition hover:bg-[#f8f4ed]"
                >
                  <ShoppingBag size={21} strokeWidth={1.8} />

                  {cartCount > 0 && (
                    <Badge count={cartCount} />
                  )}
                </Link>

              </div>

            </div>

            {/* MOBILE SEARCH */}

            {searchOpen && (
              <form
                onSubmit={submitSearch}
                className="pb-4"
              >
                <div className="flex h-11 items-center rounded-full border border-[#ded8ce] bg-[#fcfbf9] px-4">

                  <Search
                    size={18}
                    className="text-[#777]"
                  />

                  <input
                    ref={searchRef}
                    autoFocus
                    value={search}
                    onChange={(e) =>
                      setSearch(e.target.value)
                    }
                    placeholder="Search bangles, bridal sets..."
                    className="ml-3 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#999]"
                  />

                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                    >
                      <X size={17} />
                    </button>
                  )}

                </div>
              </form>
            )}

          </div>
        </div>

        {/* ================= DESKTOP HEADER ================= */}

        <div className="hidden border-b border-[#ece7df] bg-white lg:block">
          <div className="mx-auto flex h-[72px] max-w-[1600px] items-center justify-between px-8 xl:px-12">

            {/* LOGO */}

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

            {/* DESKTOP NAVIGATION */}

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
                    onMouseLeave={() =>
                      setMegaOpen(false)
                    }
                  >

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

                      <span
                        className={`absolute bottom-0 left-0 h-[2px] bg-[#8f0828] transition-all duration-300 ${
                          isActive(item.label)
                            ? "w-full"
                            : "w-0"
                        }`}
                      />
                    </Link>

                    {/* MEGA MENU */}

                    <div
                      className={`desktop-mega-menu absolute left-1/2 top-full z-50 w-[880px] ${
                        megaOpen
                          ? "desktop-mega-menu-open"
                          : ""
                      }`}
                    >
                      <div className="overflow-hidden rounded-b-2xl border border-t-0 border-[#eee9e2] bg-white shadow-[0_22px_55px_rgba(0,0,0,.14)]">

                        <div className="desktop-mega-content grid grid-cols-4 gap-x-8 gap-y-8 px-8 py-8">

                          {parentCategories.map(
                            (category) => {
                              const children = Array.from(
                                new Map(
                                  categories
                                    .filter(
                                      (child) =>
                                        child.parent_id !== null &&
                                        Number(child.parent_id) === Number(category.id)
                                    )
                                    .map((child) => [child.id, child])
                                ).values()
                              );

                              return (
                                <div
                                  key={category.id}
                                  className="min-w-0"
                                >
                                  <Link
                                    href={`/shop/${category.slug}`}
                                    className="mb-3 flex items-center gap-1 text-sm font-semibold text-[#222] transition hover:text-[#8f0828]"
                                  >
                                    {category.name}

                                    <ArrowRight size={13} />
                                  </Link>

                                  <div className="space-y-2">
                                    {children.length > 0 ? (
                                      children.map(
                                        (child) => (
                                          <Link
                                            key={child.id}
                                            href={`/shop/${category.slug}/${child.slug}`}
                                            className="block text-sm text-[#666] transition hover:translate-x-0.5 hover:text-[#8f0828]"
                                          >
                                            {child.name}
                                          </Link>
                                        )
                                      )
                                    ) : (
                                      <p className="text-xs leading-5 text-[#999]">
                                        Explore the{" "}
                                        {category.name.toLowerCase()}{" "}
                                        collection.
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            }
                          )}

                        </div>

                        {/* MEGA FOOTER */}

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

                    {item.highlight && (
                      <span className="ml-1.5 rounded-full bg-[#8f0828] px-1.5 py-0.5 text-[7px] font-semibold uppercase tracking-wide text-white">
                        Sale
                      </span>
                    )}

                    <span
                      className={`absolute bottom-0 left-0 h-[2px] bg-[#8f0828] transition-all duration-300 ${
                        isActive(item.label)
                          ? "w-full"
                          : "w-0"
                      }`}
                    />
                  </Link>
                )
              )}

            </nav>

            {/* DESKTOP ACTIONS */}

            <div className="flex w-[190px] shrink-0 items-center justify-end gap-1 xl:w-[220px]">

              {/* WISHLIST */}

              <Link
                href="/account/wishlist"
                aria-label="Wishlist"
                className="relative flex h-9 w-9 items-center justify-center rounded-full text-[#333] transition hover:bg-[#f8f4ed]"
              >
                <Heart size={19} strokeWidth={1.8} />

                {wishlistCount > 0 && (
                  <Badge count={wishlistCount} />
                )}
              </Link>

              {/* CART */}

              <Link
                href="/cart"
                aria-label="Cart"
                className="relative flex h-9 w-9 items-center justify-center rounded-full text-[#333] transition hover:bg-[#f8f4ed]"
              >
                <ShoppingBag
                  size={19}
                  strokeWidth={1.8}
                />

                {cartCount > 0 && (
                  <Badge count={cartCount} />
                )}
              </Link>

              {/* ACCOUNT */}

              <div className="relative">

                <button
                  
                  type="button"
                  onClick={() => {
                    setAccountOpen(
                      (value) => !value
                    );

                    setMegaOpen(false);
                  }}
                  className="flex h-9 items-center gap-1.5 rounded-full px-2 text-[#333] transition  hover:cursor-pointer hover:bg-[#f8f4ed]"
                >
                  <UserRound
                    size={19}
                    strokeWidth={1.8}
                  />

                  <span className="hidden max-w-[80px] truncate text-sm font-medium xl:block">
                    {loadingCustomer
                      ? "Account"
                      : firstName}
                  </span>

                  <ChevronDown
                    size={13}
                    className={`transition ${
                      accountOpen
                        ? "rotate-180"
                        : ""
                    }`}
                  />
                </button>

                {accountOpen && (
                  <AccountMenu
                    customer={customer}
                    onLogout={handleLogout}
                  />
                )}

              </div>

            </div>

          </div>
        </div>

      </header>

      {/* MOBILE DRAWER */}

      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">

          <button
            type="button"
            aria-label="Close menu"
            onClick={closeMobileMenu}
            className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] ${
              mobileClosing
                ? "mobile-overlay-close"
                : "mobile-overlay-open"
            }`}
          />

          <aside
            className={`relative flex h-full w-[88%] max-w-sm flex-col bg-white shadow-2xl ${
              mobileClosing
                ? "mobile-drawer-close"
                : "mobile-drawer-open"
            }`}
          >

            {/* MOBILE HEADER */}

            <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-[#eee9e2] px-5">

              <Link
                href="/"
                onClick={closeMobileMenu}
              >
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
                onClick={closeMobileMenu}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f8f4ed]"
              >
                <X size={21} />
              </button>

            </div>

            {/* CUSTOMER */}

            <div className="shrink-0 border-b border-[#eee9e2] bg-[#fcfaf6] px-5 py-5">

              {customer ? (
                <div className="flex items-center gap-3">

                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#8f0828] text-white">
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

            {/* MOBILE NAV */}

            <div className="flex-1 overflow-y-auto px-4 py-4">

              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[.2em] text-[#999]">
                Shop
              </p>

              <div className="space-y-1">

                {mainNavigation.map((item) =>
                  item.mega ? (
                    <div key={item.label}>

                      <button
                        type="button"
                        onClick={
                          toggleMobileBangles
                        }
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-3.5 text-sm font-medium ${
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
                            mobileBanglesOpen
                              ? "rotate-180"
                              : ""
                          }`}
                        />

                      </button>

                      {mobileBanglesOpen && (
                        <div
                          className={`${
                            mobileBanglesClosing
                              ? "mobile-bangles-close"
                              : "mobile-bangles-open"
                          } mb-2 mt-1 rounded-xl bg-[#fcfaf6] p-3`}
                        >

                          <div className="space-y-2">

                            {parentCategories.map(
                              (category) => {

                                const children = Array.from(
                                  new Map(
                                    categories
                                      .filter(
                                        (child) =>
                                          child.parent_id !== null &&
                                          Number(child.parent_id) === Number(category.id)
                                      )
                                      .map((child) => [child.id, child])
                                  ).values()
                                );

                                return (
                                  <div
                                    key={
                                      category.id
                                    }
                                    className="rounded-xl bg-white/70 p-2"
                                  >

                                    {/* PARENT */}

                                    <Link
                                      href={`/shop/${category.slug}`}
                                      onClick={
                                        closeMobileMenu
                                      }
                                      className="flex items-center justify-between rounded-lg px-2 py-2.5 text-xs font-semibold text-[#333] hover:text-[#8f0828]"
                                    >

                                      {
                                        category.name
                                      }

                                      <ArrowRight
                                        size={13}
                                      />

                                    </Link>

                                    {/* CHILDREN */}

                                    {children.length >
                                      0 && (
                                      <div className="grid grid-cols-2 gap-1 border-t border-[#eee9e2] px-2 pt-1">

                                        {children.map(
                                          (
                                            child
                                          ) => (
                                            <Link
                                              key={
                                                child.id
                                              }
                                              href={`/shop/${category.slug}/${child.slug}`}
                                              onClick={
                                                closeMobileMenu
                                              }
                                              className="rounded-lg px-2 py-2.5 text-[12px] text-[#666] hover:bg-white hover:text-[#8f0828]"
                                            >
                                              {
                                                child.name
                                              }
                                            </Link>
                                          )
                                        )}

                                      </div>
                                    )}

                                  </div>
                                );
                              }
                            )}

                          </div>

                          <Link
                            href="/shop"
                            onClick={
                              closeMobileMenu
                            }
                            className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-[#111827] px-4 py-3 text-xs font-medium text-white"
                          >
                            View All Bangles

                            <ArrowRight
                              size={14}
                            />
                          </Link>

                        </div>
                      )}

                    </div>
                  ) : (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={
                        closeMobileMenu
                      }
                      className={`flex items-center justify-between rounded-xl px-3 py-3.5 text-sm font-medium ${
                        isActive(item.label)
                          ? "bg-[#f8f4ed] text-[#8f0828]"
                          : "text-[#333] hover:bg-[#faf8f4]"
                      }`}
                    >

                      <span>
                        {item.label}
                      </span>

                      {item.highlight && (
                        <span className="rounded-full bg-[#8f0828] px-1.5 py-0.5 text-[8px] text-white">
                          SALE
                        </span>
                      )}

                    </Link>
                  )
                )}

              </div>

              <div className="my-5 border-t border-[#eee9e2]" />

              {/* ACCOUNT */}

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

            {/* LOGOUT */}

            {customer && (
              <div className="shrink-0 border-t border-[#eee9e2] p-4">

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 py-3 text-sm font-medium text-red-600 hover:bg-red-50"
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

/*
 * ----------------------------------------------------
 * BADGE
 * ----------------------------------------------------
 */

function Badge({
  count,
}: {
  count: number;
}) {
  return (
    <span className="absolute right-0.5 top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[#8f0828] px-1 text-[9px] font-semibold text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

/*
 * ----------------------------------------------------
 * ACCOUNT MENU
 * ----------------------------------------------------
 */

function AccountMenu({
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
              {customer.name ||
                "Customer"}
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
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
            >
              <LogOut size={17} />

              Logout
            </button>

          </div>
        </>
      ) : (
        <div className="p-5">

          <h3 className="text-sm font-semibold">
            Welcome to BanglesMart
          </h3>

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

/*
 * ----------------------------------------------------
 * ACCOUNT LINK
 * ----------------------------------------------------
 */

function AccountLink({
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
      <span className="text-[#777]">
        {icon}
      </span>

      {label}
    </Link>
  );
}

/*
 * ----------------------------------------------------
 * MOBILE LINK
 * ----------------------------------------------------
 */

function MobileLink({
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

        <span className="text-[#777]">
          {icon}
        </span>

        {label}

      </span>

      {count ? (
        <span className="rounded-full bg-[#8f0828] px-2 py-0.5 text-[10px] font-semibold text-white">
          {count > 99
            ? "99+"
            : count}
        </span>
      ) : null}

    </Link>
  );
}

export default function Header() {
  return (
    <Suspense fallback={null}>
      <HeaderContent />
    </Suspense>
  );
}