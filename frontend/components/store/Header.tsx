"use client";

import { Suspense, useEffect, useRef, useState } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useStoreCatalog } from "@/components/store/StoreCatalogProvider";

import DesktopHeader from "./DesktopHeader";

import MobileHeader from "./MobileHeader";

import { useCommerce } from "@/features/commerce/CommerceProvider";

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

  /* ========================================================= */
  /* REFS */
  /* ========================================================= */

  const searchRef = useRef<HTMLInputElement>(null);

  /* ========================================================= */
  /* STORE CATEGORIES */
  /* ========================================================= */

  const { categories } = useStoreCatalog();

  const parentCategories = categories.filter(
    (category) => category.parent_id === null,
  );

  /* ========================================================= */
  /* MOBILE STATES */
  /* ========================================================= */

  const [mobileOpen, setMobileOpen] = useState(false);

  const [mobileClosing, setMobileClosing] = useState(false);

  const [mobileBanglesOpen, setMobileBanglesOpen] = useState(false);

  const [mobileBanglesClosing, setMobileBanglesClosing] = useState(false);

  /* ========================================================= */
  /* DESKTOP STATES */
  /* ========================================================= */

  const [megaOpen, setMegaOpen] = useState(false);

  const [accountOpen, setAccountOpen] = useState(false);

  /* ========================================================= */
  /* SEARCH */
  /* ========================================================= */

  const [searchOpen, setSearchOpen] = useState(false);

  const [search, setSearch] = useState("");

  /* ========================================================= */
  /* CENTRALIZED CUSTOMER COMMERCE STATE */
  /* ========================================================= */

  const {
    customer,
    cartCount,
    wishlistCount,
    loadingCustomer,
    signOut,
  } = useCommerce();

  /* ========================================================= */
  /* CLOSE DESKTOP MENUS ON ROUTE CHANGE */
  /* ========================================================= */

  useEffect(() => {
    setAccountOpen(false);

    setSearchOpen(false);

    setMegaOpen(false);
  }, [pathname]);

  /* ========================================================= */
  /* MOBILE BODY LOCK */
  /* ========================================================= */

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  /* ========================================================= */
  /* KEYBOARD SHORTCUTS */
  /* ========================================================= */

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      /*
      ---------------------------------------------------------
      PRESS "/" FOR SEARCH
      ---------------------------------------------------------
      */

      if (
        event.key === "/" &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        const target = event.target as HTMLElement;

        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          event.preventDefault();

          setSearchOpen(true);

          setTimeout(() => {
            searchRef.current?.focus();
          }, 50);
        }
      }

      /*
      ---------------------------------------------------------
      ESCAPE
      ---------------------------------------------------------
      */

      if (event.key === "Escape") {
        setAccountOpen(false);

        setSearchOpen(false);

        setMegaOpen(false);

        if (mobileOpen) {
          closeMobileMenu();
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileOpen]);

  /* ========================================================= */
  /* ACTIVE NAVIGATION */
  /* ========================================================= */

  function activeNavigationLabel() {
    /*
    -----------------------------------------------------------
    HOME
    -----------------------------------------------------------
    */

    if (pathname === "/") {
      return "Home";
    }

    /*
    -----------------------------------------------------------
    OFFERS
    -----------------------------------------------------------
    */

    if (pathname === "/offers") {
      return "Offers";
    }

    /*
    -----------------------------------------------------------
    NEW ARRIVALS
    -----------------------------------------------------------
    */

    if (
      pathname === "/shop/new-arrivals" ||
      (pathname === "/shop" && searchParams.get("new_arrival") === "1")
    ) {
      return "New Arrivals";
    }

    /*
    -----------------------------------------------------------
    BEST SELLERS
    -----------------------------------------------------------
    */

    if (
      pathname === "/shop/best-sellers" ||
      (pathname === "/shop" && searchParams.get("best_seller") === "1")
    ) {
      return "Best Sellers";
    }

    /*
    -----------------------------------------------------------
    BRIDAL
    -----------------------------------------------------------
    */

    if (pathname.startsWith("/shop/bridal-bangles")) {
      return "Bridal";
    }

    /*
    -----------------------------------------------------------
    CATEGORY PAGES
    -----------------------------------------------------------
    */

    if (pathname.startsWith("/shop/")) {
      return "Bangles";
    }

    /*
    -----------------------------------------------------------
    SHOP
    -----------------------------------------------------------
    */

    if (pathname === "/shop") {
      return "Shop";
    }

    return "";
  }

  function isActive(label: string) {
    return activeNavigationLabel() === label;
  }

  /* ========================================================= */
  /* SEARCH */
  /* ========================================================= */

  function submitSearch(event?: React.FormEvent) {
    event?.preventDefault();

    const query = search.trim();

    if (!query) {
      return;
    }

    setSearchOpen(false);

    closeMobileMenu();

    router.push(`/shop?search=${encodeURIComponent(query)}`);
  }

  /* ========================================================= */
  /* MOBILE MENU */
  /* ========================================================= */

  function openMobileMenu() {
    setMobileClosing(false);

    setMobileOpen(true);

    setAccountOpen(false);

    setMegaOpen(false);
  }

  function closeMobileMenu() {
    if (!mobileOpen || mobileClosing) {
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

  /* ========================================================= */
  /* MOBILE BANGLES ACCORDION */
  /* ========================================================= */

  function toggleMobileBangles() {
    if (mobileBanglesOpen) {
      setMobileBanglesClosing(true);

      setTimeout(() => {
        setMobileBanglesOpen(false);

        setMobileBanglesClosing(false);
      }, 300);

      return;
    }

    setMobileBanglesClosing(false);

    setMobileBanglesOpen(true);
  }

  /* ========================================================= */
  /* LOGOUT */
  /* ========================================================= */

  function handleLogout() {
    setAccountOpen(false);
    closeMobileMenu();
    signOut();
  }

  /* ========================================================= */
  /* CUSTOMER NAME */
  /* ========================================================= */

  const firstName = customer?.name?.trim()?.split(" ")[0] || "Account";

  /* ========================================================= */
  /* RENDER */
  /* ========================================================= */

  return (
    <>
      <header className="sticky top-0 z-50 bg-white">
        {/* ================================================ */}
        {/* TOP ANNOUNCEMENT BAR */}
        {/* ================================================ */}

        <div className="bg-[#650b12] text-white">
          <div className="mx-auto flex h-7 max-w-[1600px] items-center justify-between px-4 text-[8px] font-medium uppercase tracking-[0.08em] sm:px-6 lg:px-8">
            <p>✧ Free Shipping on Orders Above ₹999</p>

            <p className="hidden sm:block">✦ 100% Original Products</p>
          </div>
        </div>

        {/* ================================================ */}
        {/* DESKTOP HEADER */}
        {/* ================================================ */}

        <DesktopHeader
          categories={categories}
          parentCategories={parentCategories}
          mainNavigation={mainNavigation}
          pathname={pathname}
          isActive={isActive}
          megaOpen={megaOpen}
          setMegaOpen={setMegaOpen}
          accountOpen={accountOpen}
          setAccountOpen={setAccountOpen}
          customer={customer}
          cartCount={cartCount}
          wishlistCount={wishlistCount}
          loadingCustomer={loadingCustomer}
          firstName={firstName}
          handleLogout={handleLogout}
        />

        {/* ================================================ */}
        {/* MOBILE HEADER */}
        {/* ================================================ */}

        <MobileHeader
          categories={categories}
          parentCategories={parentCategories}
          mainNavigation={mainNavigation}
          isActive={isActive}
          /* MOBILE MENU */

          mobileOpen={mobileOpen}
          mobileClosing={mobileClosing}
          /* MOBILE BANGLES */

          mobileBanglesOpen={mobileBanglesOpen}
          mobileBanglesClosing={mobileBanglesClosing}
          /* SEARCH */

          searchOpen={searchOpen}
          search={search}
          searchRef={searchRef}
          /* CUSTOMER */

          customer={customer}
          cartCount={cartCount}
          wishlistCount={wishlistCount}
          firstName={firstName}
          /* FUNCTIONS */

          setSearchOpen={setSearchOpen}
          setSearch={setSearch}
          openMobileMenu={openMobileMenu}
          closeMobileMenu={closeMobileMenu}
          toggleMobileBangles={toggleMobileBangles}
          submitSearch={submitSearch}
          handleLogout={handleLogout}
        />
      </header>
    </>
  );
}

/* =========================================================== */
/* SUSPENSE WRAPPER */
/* =========================================================== */

export default function Header() {
  return (
    <Suspense fallback={null}>
      <HeaderContent />
    </Suspense>
  );
}
