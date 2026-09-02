"use client";

import { useEffect, useMemo, useState } from "react";
import { Sparkles, SlidersHorizontal, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { storeApiFetch } from "@/lib/storeApi";

import CategoryFilters, {
  FilterCategory,
} from "@/components/store/CategoryFilters";

import ProductCard, {
  StoreProductCardData,
} from "@/components/store/ProductCard";

import {
  useStoreCatalog,
  type StoreCategory,
} from "@/components/store/StoreCatalogProvider";

/* =========================================================
   TYPES
========================================================= */

type ShopCategory = StoreCategory & {
  children?: StoreCategory[];
};

type StoreProduct = StoreProductCardData & {
  category_id?: number;

  short_description?: string | null;

  description?: string | null;

  featured?: boolean;

  best_seller?: boolean;

  new_arrival?: boolean;

  category?: {
    id: number;
    name: string;
    slug: string;
    parent_id?: number | null;
  } | null;

  primary_image?: {
    id?: number;
    image?: string | null;
    alt_text?: string | null;
  } | null;
};

type PaginationData = {
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
};

/* =========================================================
   PRODUCT SKELETON
========================================================= */

function ProductSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[4/5] rounded-[22px] bg-[#eee8dc]" />

      <div className="px-1 pt-4">
        <div className="h-2.5 w-20 rounded bg-[#eee8dc]" />

        <div className="mt-3 h-5 w-4/5 rounded bg-[#eee8dc]" />

        <div className="mt-3 h-4 w-24 rounded bg-[#eee8dc]" />
      </div>
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

function ShopPageContent() {
  const searchParams = useSearchParams();

  /* =======================================================
     CATALOG
  ======================================================= */

  const catalog = useStoreCatalog();

  /*
   * Always guarantee an array.
   *
   * This prevents:
   *
   * Cannot read properties of undefined (reading 'map')
   */

  const categories: ShopCategory[] = Array.isArray(
    catalog?.categories
  )
    ? (catalog.categories as ShopCategory[])
    : [];

  /* =======================================================
     URL VALUES
  ======================================================= */

  const urlSearch =
    searchParams.get("search") || "";

  const urlCategory =
    searchParams.get("category") || "";

  const urlSort =
    searchParams.get("sort") || "";

  const urlMinPrice =
    searchParams.get("min_price") || "";

  const urlMaxPrice =
    searchParams.get("max_price") || "";

  const urlNewArrival =
    searchParams.get("new_arrival") === "1";

  const urlBestSeller =
    searchParams.get("best_seller") === "1";

  const urlFeatured =
    searchParams.get("featured") === "1";

  const urlPage = Math.max(
    1,
    Number(searchParams.get("page") || "1")
  );

  /* =======================================================
     FILTER STATE
  ======================================================= */

  const [search, setSearch] =
    useState(urlSearch);

  const [category, setCategory] =
    useState(urlCategory);

  const [sort, setSort] =
    useState(urlSort);

  const [minPrice, setMinPrice] =
    useState(urlMinPrice);

  const [maxPrice, setMaxPrice] =
    useState(urlMaxPrice);

  const [newArrival, setNewArrival] =
    useState(urlNewArrival);

  const [bestSeller, setBestSeller] =
    useState(urlBestSeller);

  const [featured, setFeatured] =
    useState(urlFeatured);

  const [page, setPage] =
    useState(urlPage);

  /* =======================================================
     SEARCH DEBOUNCE
  ======================================================= */

  const [
    appliedSearch,
    setAppliedSearch,
  ] = useState(urlSearch);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setAppliedSearch(search);
    }, 350);

    return () => {
      window.clearTimeout(timer);
    };
  }, [search]);

  /* =======================================================
     PRODUCTS
  ======================================================= */

  const [products, setProducts] =
    useState<StoreProduct[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [pagination, setPagination] =
    useState<PaginationData>({
      current_page: 1,
      last_page: 1,
      total: 0,
      per_page: 12,
    });

  /* =======================================================
     MOBILE FILTER
  ======================================================= */

  const [
    mobileFilters,
    setMobileFilters,
  ] = useState(false);

  /* =======================================================
     RESET PAGE WHEN FILTER CHANGES
  ======================================================= */

  useEffect(() => {
    setPage(1);
  }, [
    appliedSearch,
    category,
    sort,
    minPrice,
    maxPrice,
    newArrival,
    bestSeller,
    featured,
  ]);

  /* =======================================================
     SYNC URL
  ======================================================= */

  useEffect(() => {
    const params =
      new URLSearchParams();

    if (appliedSearch.trim()) {
      params.set(
        "search",
        appliedSearch.trim()
      );
    }

    if (category) {
      params.set(
        "category",
        category
      );
    }

    if (sort) {
      params.set(
        "sort",
        sort
      );
    }

    if (minPrice) {
      params.set(
        "min_price",
        minPrice
      );
    }

    if (maxPrice) {
      params.set(
        "max_price",
        maxPrice
      );
    }

    if (newArrival) {
      params.set(
        "new_arrival",
        "1"
      );
    }

    if (bestSeller) {
      params.set(
        "best_seller",
        "1"
      );
    }

    if (featured) {
      params.set(
        "featured",
        "1"
      );
    }

    if (page > 1) {
      params.set(
        "page",
        String(page)
      );
    }

    const nextQuery =
      params.toString();

    const currentQuery =
      searchParams.toString();

    if (nextQuery !== currentQuery) {
      window.history.replaceState(
        null,
        "",
        nextQuery
          ? `/shop?${nextQuery}`
          : "/shop"
      );
    }
  }, [
    appliedSearch,
    category,
    sort,
    minPrice,
    maxPrice,
    newArrival,
    bestSeller,
    featured,
    page,
    searchParams,
  ]);

  /* =======================================================
     LOAD PRODUCTS
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      setLoading(true);

      try {
        const params =
          new URLSearchParams();

        if (appliedSearch.trim()) {
          params.set(
            "search",
            appliedSearch.trim()
          );
        }

        if (category) {
          params.set(
            "category",
            category
          );
        }

        if (sort) {
          params.set(
            "sort",
            sort
          );
        }

        if (minPrice) {
          params.set(
            "min_price",
            minPrice
          );
        }

        if (maxPrice) {
          params.set(
            "max_price",
            maxPrice
          );
        }

        if (newArrival) {
          params.set(
            "new_arrival",
            "1"
          );
        }

        if (bestSeller) {
          params.set(
            "best_seller",
            "1"
          );
        }

        if (featured) {
          params.set(
            "featured",
            "1"
          );
        }

        params.set(
          "page",
          String(page)
        );

        params.set(
          "per_page",
          "12"
        );

        const response =
          await storeApiFetch(
            `/store/products?${params.toString()}`
          );

        const json =
          await response.json();

        if (cancelled) {
          return;
        }

        if (!response.ok) {
          throw new Error(
            json?.message ||
              "Unable to load products."
          );
        }

        /*
         * Laravel pagination:
         *
         * data:
         * {
         *   data: [...]
         * }
         */

        const paginator =
          json?.data;

        const productList =
          Array.isArray(
            paginator?.data
          )
            ? paginator.data
            : Array.isArray(
                paginator
              )
              ? paginator
              : [];

        setProducts(
          productList
        );

        setPagination({
          current_page:
            Number(
              paginator?.current_page ||
                page
            ),

          last_page:
            Number(
              paginator?.last_page ||
                1
            ),

          total:
            Number(
              paginator?.total ||
                productList.length
            ),

          per_page:
            Number(
              paginator?.per_page ||
                12
            ),
        });
      } catch (error) {
        console.error(
          "Shop products error:",
          error
        );

        if (!cancelled) {
          setProducts([]);

          setPagination({
            current_page: 1,
            last_page: 1,
            total: 0,
            per_page: 12,
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadProducts();

    return () => {
      cancelled = true;
    };
  }, [
    appliedSearch,
    category,
    sort,
    minPrice,
    maxPrice,
    newArrival,
    bestSeller,
    featured,
    page,
  ]);

  /* =======================================================
     CLEAR FILTERS
  ======================================================= */

  function clearFilters() {
    setSearch("");
    setAppliedSearch("");

    setCategory("");

    setSort("");

    setMinPrice("");
    setMaxPrice("");

    setNewArrival(false);
    setBestSeller(false);
    setFeatured(false);

    setPage(1);

    setMobileFilters(false);
  }

  /* =======================================================
     FILTER COUNT
  ======================================================= */

  const filterCount =
    useMemo(() => {
      return [
        category,
        sort,

        minPrice || maxPrice
          ? "price"
          : "",

        newArrival
          ? "new_arrival"
          : "",

        bestSeller
          ? "best_seller"
          : "",

        featured
          ? "featured"
          : "",
      ].filter(Boolean).length;
    }, [
      category,
      sort,
      minPrice,
      maxPrice,
      newArrival,
      bestSeller,
      featured,
    ]);

  /* =======================================================
     GLOBAL FILTER CATEGORIES
  ======================================================= */

  /*
   * IMPORTANT:
   *
   * Keep parent + children hierarchy.
   *
   * Example:
   *
   * Glass Bangles
   *   ├── Bridal Glass Bangles
   *   ├── Designer Glass Bangles
   *   └── Traditional Glass Bangles
   *
   * CategoryFilters can therefore show
   * parent and subcategory dropdowns.
   */

  const filterCategories =
    useMemo<FilterCategory[]>(() => {
      return categories
        .filter(Boolean)
        .map((parent) => ({
          id: Number(parent.id),

          name: parent.name,

          slug: parent.slug,

          parent_id:
            parent.parent_id ?? null,

          children:
            Array.isArray(
              parent.children
            )
              ? parent.children.map(
                  (child) => ({
                    id: Number(
                      child.id
                    ),

                    name:
                      child.name,

                    slug:
                      child.slug,

                    parent_id:
                      child.parent_id ??
                      parent.id,
                  })
                )
              : [],
        }));
    }, [categories]);

  /* =======================================================
     CURRENT CATEGORY NAME
  ======================================================= */

  const currentCategoryName =
    useMemo(() => {
      if (!category) {
        if (newArrival) {
          return "New Arrivals";
        }

        if (bestSeller) {
          return "Best Sellers";
        }

        if (featured) {
          return "Featured Collection";
        }

        if (appliedSearch) {
          return `Search: ${appliedSearch}`;
        }

        return "All Bangles";
      }

      /*
       * First check parent category.
       */

      for (
        const parent of filterCategories
      ) {
        if (
          parent.slug === category
        ) {
          return parent.name;
        }

        /*
         * Then check child category.
         */

        const child =
          parent.children?.find(
            (item) =>
              item.slug ===
              category
          );

        if (child) {
          return child.name;
        }
      }

      return "Shop";
    }, [
      category,
      filterCategories,
      newArrival,
      bestSeller,
      featured,
      appliedSearch,
    ]);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="min-h-screen bg-[#fbfaf7]">

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="border-b border-[#eee8de] bg-[#f5efe5]">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16">

          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#8f0828]">
            BanglesMart / Collection
          </p>

          <h1 className="mt-3 font-[family-name:var(--font-playfair)] text-4xl leading-tight text-[#191919] sm:text-5xl">
            Shop Bangles
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#6d675e]">
            Discover our curated
            collection of elegant
            bangles, bridal designs,
            traditional styles and
            contemporary pieces
            crafted for every occasion.
          </p>

        </div>
      </section>

      {/* =====================================================
          SHOP CONTENT
      ===================================================== */}

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8 lg:py-10">

        {/* ===================================================
            TOP HEADER
        =================================================== */}

        <div className="mb-8 flex flex-col gap-4 border-b border-[#e9e2d8] pb-5 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a08f73]">
              Curated for you
            </p>

            <h2 className="mt-1 font-[family-name:var(--font-playfair)] text-2xl text-[#191919]">
              {currentCategoryName}
            </h2>

            <p className="mt-1 text-xs text-[#8b847a]">
              {pagination.total}{" "}
              {pagination.total === 1
                ? "product"
                : "products"}
            </p>

          </div>

          {/* =================================================
              MOBILE FILTER BUTTON
          ================================================= */}

          <button
            type="button"
            onClick={() =>
              setMobileFilters(true)
            }
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[#ddd4c7] bg-white px-5 py-3 text-xs font-semibold text-[#333] shadow-sm transition hover:border-[#c9a227] hover:text-[#8f0828] lg:hidden"
          >
            <SlidersHorizontal
              size={15}
            />

            Filters

            {filterCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#8f0828] px-1.5 text-[9px] text-white">
                {filterCount}
              </span>
            )}
          </button>

        </div>

        {/* ===================================================
            SIDEBAR + PRODUCTS
        =================================================== */}

        <div className="grid gap-10 lg:grid-cols-[270px_minmax(0,1fr)]">

          {/* =================================================
              DESKTOP SIDEBAR
          ================================================= */}

          <aside className="hidden lg:block">

            <div className="sticky top-28 rounded-2xl border border-[#e7dfd4] bg-white p-5 shadow-[0_8px_30px_rgba(50,35,20,.035)]">

              <div className="mb-5 flex items-center justify-between">

                <div>

                  <h3 className="text-sm font-semibold text-[#191919]">
                    Refine
                  </h3>

                  <p className="mt-1 text-[10px] text-[#999]">
                    Find your perfect
                    bangles
                  </p>

                </div>

                {filterCount > 0 && (
                  <span className="rounded-full bg-[#f8f1e5] px-2 py-1 text-[9px] font-semibold text-[#8f0828]">
                    {filterCount} active
                  </span>
                )}

              </div>

              <CategoryFilters
                categories={
                  filterCategories
                }

                category={
                  category
                }

                setCategory={
                  setCategory
                }

                search={
                  search
                }

                setSearch={
                  setSearch
                }

                minPrice={
                  minPrice
                }

                maxPrice={
                  maxPrice
                }

                setMinPrice={
                  setMinPrice
                }

                setMaxPrice={
                  setMaxPrice
                }

                sort={
                  sort
                }

                setSort={
                  setSort
                }

                newArrival={
                  newArrival
                }

                bestSeller={
                  bestSeller
                }

                featured={
                  featured
                }

                setNewArrival={
                  setNewArrival
                }

                setBestSeller={
                  setBestSeller
                }

                setFeatured={
                  setFeatured
                }

                clearFilters={
                  clearFilters
                }
              />

            </div>

          </aside>

          {/* =================================================
              PRODUCT GRID
          ================================================= */}

          <div className="min-w-0">

            {/* =================================================
                LOADING
            ================================================= */}

            {loading && (
              <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 xl:grid-cols-3">

                {Array.from({
                  length: 8,
                }).map(
                  (_, index) => (
                    <ProductSkeleton
                      key={index}
                    />
                  )
                )}

              </div>
            )}

            {/* =================================================
                PRODUCTS
            ================================================= */}

            {!loading &&
              products.length > 0 && (
                <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 xl:grid-cols-3">

                  {products.map(
                    (product) => (
                      <ProductCard
                        key={
                          product.id
                        }
                        product={
                          product
                        }
                      />
                    )
                  )}

                </div>
              )}

            {/* =================================================
                EMPTY
            ================================================= */}

            {!loading &&
              products.length === 0 && (
                <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-dashed border-[#d9d0c2] bg-white px-6 text-center">

                  <div>

                    <Sparkles
                      size={28}
                      strokeWidth={1.3}
                      className="mx-auto text-[#c9a227]"
                    />

                    <h2 className="mt-4 font-[family-name:var(--font-playfair)] text-2xl text-[#191919]">
                      Nothing matched
                    </h2>

                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#777]">
                      Try another
                      keyword, adjust
                      the price range,
                      or clear your
                      filters to explore
                      the complete
                      collection.
                    </p>

                    <button
                      type="button"
                      onClick={
                        clearFilters
                      }
                      className="mt-6 rounded-full bg-[#111827] px-6 py-3 text-xs font-semibold text-white transition hover:bg-[#8f0828]"
                    >
                      View All Products
                    </button>

                  </div>

                </div>
              )}

            {/* =================================================
                PAGINATION
            ================================================= */}

            {!loading &&
              pagination.last_page >
                1 && (
                <div className="mt-12 flex items-center justify-center gap-4 border-t border-[#e9e2d8] pt-7">

                  <button
                    type="button"
                    disabled={
                      page <= 1
                    }
                    onClick={() =>
                      setPage(
                        (current) =>
                          Math.max(
                            1,
                            current - 1
                          )
                      )
                    }
                    className="rounded-full border border-[#ddd4c7] bg-white px-5 py-2.5 text-xs font-semibold transition hover:border-[#c9a227] disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    Previous
                  </button>

                  <span className="text-xs text-[#777]">
                    Page{" "}
                    {
                      pagination.current_page
                    }{" "}
                    of{" "}
                    {
                      pagination.last_page
                    }
                  </span>

                  <button
                    type="button"
                    disabled={
                      page >=
                      pagination.last_page
                    }
                    onClick={() =>
                      setPage(
                        (current) =>
                          Math.min(
                            pagination.last_page,
                            current + 1
                          )
                      )
                    }
                    className="rounded-full border border-[#ddd4c7] bg-white px-5 py-2.5 text-xs font-semibold transition hover:border-[#c9a227] disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    Next
                  </button>

                </div>
              )}

          </div>

        </div>

      </section>

      {/* =====================================================
          MOBILE FILTER DRAWER
      ===================================================== */}

      {mobileFilters && (
        <div className="fixed inset-0 z-[80] lg:hidden">

          {/* =================================================
              BACKDROP
          ================================================= */}

          <button
            type="button"
            aria-label="Close filters"
            onClick={() =>
              setMobileFilters(false)
            }
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
          />

          {/* =================================================
              DRAWER
          ================================================= */}

          <aside className="absolute bottom-0 left-0 right-0 max-h-[90vh] overflow-y-auto rounded-t-[28px] bg-white p-6 shadow-2xl">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a08f73]">
                  BanglesMart
                </p>

                <h2 className="mt-1 font-[family-name:var(--font-playfair)] text-2xl text-[#191919]">
                  Filters
                </h2>

              </div>

              <button
                type="button"
                onClick={() =>
                  setMobileFilters(
                    false
                  )
                }
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f7f2e9] text-[#333]"
              >
                <X size={18} />
              </button>

            </div>

            <div className="mt-6">

              <CategoryFilters
                categories={
                  filterCategories
                }

                category={
                  category
                }

                setCategory={
                  setCategory
                }

                search={
                  search
                }

                setSearch={
                  setSearch
                }

                minPrice={
                  minPrice
                }

                maxPrice={
                  maxPrice
                }

                setMinPrice={
                  setMinPrice
                }

                setMaxPrice={
                  setMaxPrice
                }

                sort={
                  sort
                }

                setSort={
                  setSort
                }

                newArrival={
                  newArrival
                }

                bestSeller={
                  bestSeller
                }

                featured={
                  featured
                }

                setNewArrival={
                  setNewArrival
                }

                setBestSeller={
                  setBestSeller
                }

                setFeatured={
                  setFeatured
                }

                clearFilters={
                  clearFilters
                }

                mobile
              />

            </div>

            <button
              type="button"
              onClick={() =>
                setMobileFilters(
                  false
                )
              }
              className="mt-6 w-full rounded-full bg-[#111827] py-3.5 text-sm font-semibold text-white transition hover:bg-[#8f0828]"
            >
              Show{" "}
              {pagination.total}{" "}
              Products
            </button>

          </aside>

        </div>
      )}

    </main>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={null}>
      <ShopPageContent />
    </Suspense>
  );
}