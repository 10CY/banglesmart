"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";
import {
  useRouter,
} from "next/navigation";

import {
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";

import {
  storeApiFetch,
} from "@/lib/storeApi";

import CategoryFilters, {
  type FilterCategory,
} from "@/components/store/CategoryFilters";

import ProductCard, {
  type StoreProductCardData,
} from "@/components/store/ProductCard";

/* =========================================================
   TYPES
========================================================= */

type CategoryInfo = {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  description?: string | null;
  image?: string | null;
};

type InitialFilters = {
  search: string;
  minPrice: string;
  maxPrice: string;
  sort: string;
  newArrival: boolean;
  bestSeller: boolean;
  featured: boolean;
  page: number;
};

type Product = StoreProductCardData & {
  category_id?: number;
  short_description?: string | null;
  description?: string | null;
};

type PaginationData = {
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
};

type CategoryPageClientProps = {
  categories: FilterCategory[];

  parent: CategoryInfo;

  selectedCategory: CategoryInfo;

  child: CategoryInfo | null;

  initialFilters: InitialFilters;
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
   COMPONENT
========================================================= */

export default function CategoryPageClient({
  categories,
  parent,
  selectedCategory,
  child,
  initialFilters,
}: CategoryPageClientProps) {
  const router =
    useRouter();

  /* =======================================================
     FILTER STATE
  ======================================================= */

  const [search, setSearch] =
    useState(
      initialFilters.search
    );

  const [minPrice, setMinPrice] =
    useState(
      initialFilters.minPrice
    );

  const [maxPrice, setMaxPrice] =
    useState(
      initialFilters.maxPrice
    );

  const [sort, setSort] =
    useState(
      initialFilters.sort
    );

  const [
    newArrival,
    setNewArrival,
  ] = useState(
    initialFilters.newArrival
  );

  const [
    bestSeller,
    setBestSeller,
  ] = useState(
    initialFilters.bestSeller
  );

  const [
    featured,
    setFeatured,
  ] = useState(
    initialFilters.featured
  );

  const [page, setPage] =
    useState(
      initialFilters.page
    );

  const [
    products,
    setProducts,
  ] = useState<Product[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    mobileFilters,
    setMobileFilters,
  ] = useState(false);

  const [
    pagination,
    setPagination,
  ] = useState<PaginationData>({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 24,
  });

  /* =======================================================
     CURRENT CATEGORY
  ======================================================= */

  const currentCategory =
    selectedCategory.slug;

  /* =======================================================
     LOAD PRODUCTS
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        setLoading(true);

        const params =
          new URLSearchParams();

        params.set(
          "category",
          currentCategory
        );

        params.set(
          "per_page",
          "24"
        );

        params.set(
          "page",
          String(page)
        );

        if (search.trim()) {
          params.set(
            "search",
            search.trim()
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

        if (sort) {
          params.set(
            "sort",
            sort
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

        const response =
          await storeApiFetch(
            `/store/products?${params.toString()}`
          );

        const json =
          await response.json();

        if (cancelled) {
          return;
        }

        const list =
          Array.isArray(
            json?.data?.data
          )
            ? json.data.data
            : Array.isArray(
                json?.data
              )
            ? json.data
            : [];

        setProducts(list);

        if (json?.data?.current_page) {
          setPagination({
            current_page:
              Number(
                json.data
                  .current_page
              ) || 1,

            last_page:
              Number(
                json.data
                  .last_page
              ) || 1,

            total:
              Number(
                json.data
                  .total
              ) || list.length,

            per_page:
              Number(
                json.data
                  .per_page
              ) || 24,
          });
        } else {
          setPagination({
            current_page: 1,
            last_page: 1,
            total:
              list.length,
            per_page: 24,
          });
        }
      } catch (error) {
        console.error(
          "Category products error:",
          error
        );

        if (!cancelled) {
          setProducts([]);

          setPagination({
            current_page: 1,
            last_page: 1,
            total: 0,
            per_page: 24,
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, [
    currentCategory,
    search,
    minPrice,
    maxPrice,
    sort,
    newArrival,
    bestSeller,
    featured,
    page,
  ]);

  /* =======================================================
     UPDATE URL FILTERS
  ======================================================= */

  useEffect(() => {
    const timeout =
      setTimeout(() => {
        const params =
          new URLSearchParams();

        if (search.trim()) {
          params.set(
            "search",
            search.trim()
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

        if (sort) {
          params.set(
            "sort",
            sort
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

        const query =
          params.toString();

        router.replace(
          `/shop/${parent.slug}${
            child
              ? `/${child.slug}`
              : ""
          }${
            query
              ? `?${query}`
              : ""
          }`,
          {
            scroll: false,
          }
        );
      }, 400);

    return () => {
      clearTimeout(timeout);
    };
  }, [
    search,
    minPrice,
    maxPrice,
    sort,
    newArrival,
    bestSeller,
    featured,
    page,
    parent.slug,
    child,
    router,
  ]);

  /* =======================================================
     RESET PAGE WHEN FILTER CHANGES
  ======================================================= */

  useEffect(() => {
    setPage(1);
  }, [
    search,
    minPrice,
    maxPrice,
    sort,
    newArrival,
    bestSeller,
    featured,
  ]);

  /* =======================================================
     CATEGORY NAVIGATION
  ======================================================= */

  function handleCategoryChange(
    slug: string
  ) {
    const selectedParent =
      categories.find(
        (item) =>
          item.slug === slug
      );

    if (selectedParent) {
      router.push(
        `/shop/${selectedParent.slug}`
      );

      return;
    }

    for (
      const category of categories
    ) {
      const selectedChild =
        category.children?.find(
          (item) =>
            item.slug === slug
        );

      if (selectedChild) {
        router.push(
          `/shop/${category.slug}/${selectedChild.slug}`
        );

        return;
      }
    }
  }

  /* =======================================================
     CLEAR FILTERS
  ======================================================= */

  function clearFilters() {
    setSearch("");

    setMinPrice("");

    setMaxPrice("");

    setSort("");

    setNewArrival(false);

    setBestSeller(false);

    setFeatured(false);

    setPage(1);
  }

  /* =======================================================
     PRODUCT COUNT
  ======================================================= */

  const productCount =
    useMemo(
      () => pagination.total,
      [pagination.total]
    );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="min-h-screen bg-white">

      {/* ===================================================
          HERO
      =================================================== */}

      <section className="border-b border-[#e9e1d7] bg-[#f7f1e8]">

        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 sm:py-16 lg:px-8">

          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#c9a227]">
            BanglesMart / Collection
          </p>

          <h1 className="mt-4 font-[family-name:var(--font-playfair)] text-4xl text-[#111] sm:text-5xl">
            {selectedCategory.name}
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#666]">
            {selectedCategory.description ||
              `Explore our beautiful collection of ${selectedCategory.name.toLowerCase()}.`}
          </p>

        </div>

      </section>

      {/* ===================================================
          BREADCRUMB
      =================================================== */}

      <section className="mx-auto max-w-7xl px-5 pt-6 sm:px-6 lg:px-8 lg:pt-8">

        <div className="flex flex-wrap items-center gap-2 text-sm">

          <Link
            href="/shop"
            className="text-[#777] transition hover:text-[#8f0828]"
          >
            Shop
          </Link>

          <span className="text-[#aaa]">
            ›
          </span>

          <Link
            href={`/shop/${parent.slug}`}
            className={
              child
                ? "text-[#777] transition hover:text-[#8f0828]"
                : "font-medium text-[#111]"
            }
          >
            {parent.name}
          </Link>

          {child && (
            <>
              <span className="text-[#aaa]">
                ›
              </span>

              <span className="font-medium text-[#111]">
                {child.name}
              </span>
            </>
          )}

        </div>

      </section>

      {/* ===================================================
          MOBILE FILTER BUTTON
      =================================================== */}

      <div className="mx-auto flex max-w-7xl px-5 pt-6 sm:px-6 lg:hidden">

        <button
          type="button"
          onClick={() =>
            setMobileFilters(true)
          }
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#ded5c9] bg-white py-3 text-sm font-semibold text-[#333] shadow-sm"
        >
          <SlidersHorizontal
            size={17}
          />

          Filter Products

        </button>

      </div>

      {/* ===================================================
          PRODUCTS
      =================================================== */}

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8 lg:py-10">

        <div className="grid gap-10 lg:grid-cols-[250px_minmax(0,1fr)] xl:grid-cols-[270px_minmax(0,1fr)]">

          {/* ===============================================
              DESKTOP FILTER
          =============================================== */}

          <aside className="hidden lg:block">

            <div className="sticky top-28 rounded-2xl border border-[#e7dfd4] bg-white p-5 shadow-[0_8px_30px_rgba(50,35,20,.035)]">

              <div className="mb-5">

                <h3 className="text-sm font-semibold text-[#191919]">
                  Refine
                </h3>

                <p className="mt-1 text-[10px] text-[#999]">
                  Find your perfect bangles
                </p>

              </div>

              <CategoryFilters
                categories={categories}
                category={currentCategory}
                setCategory={
                  handleCategoryChange
                }
                productCount={
                  productCount
                }
                search={search}
                setSearch={
                  setSearch
                }
                minPrice={minPrice}
                maxPrice={maxPrice}
                setMinPrice={
                  setMinPrice
                }
                setMaxPrice={
                  setMaxPrice
                }
                sort={sort}
                setSort={setSort}
                newArrival={
                  newArrival
                }
                bestSeller={
                  bestSeller
                }
                featured={featured}
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

          {/* ===============================================
              PRODUCTS AREA
          =============================================== */}

          <div className="min-w-0">

            <div className="mb-6 flex flex-col gap-3 border-b border-[#e9e1d7] pb-5 sm:flex-row sm:items-end sm:justify-between">

              <div>

                <p className="text-[10px] uppercase tracking-[0.2em] text-[#999]">
                  Curated for you
                </p>

                <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-2xl text-[#111] sm:text-3xl">
                  {selectedCategory.name}
                </h2>

                <p className="mt-1 text-sm text-[#777]">
                  {productCount}{" "}

                  {productCount === 1
                    ? "product"
                    : "products"}
                </p>

              </div>

            </div>

            {/* =============================================
                LOADING
            ============================================= */}

            {loading && (

              <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3">

                {Array.from({
                  length: 9,
                }).map(
                  (_, index) => (
                    <ProductSkeleton
                      key={index}
                    />
                  )
                )}

              </div>

            )}

            {/* =============================================
                PRODUCTS
            ============================================= */}

            {!loading &&
              products.length > 0 && (

                <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3">

                  {products.map(
                    (product) => (

                      <ProductCard
                        key={product.id}
                        product={product}
                      />

                    )
                  )}

                </div>

              )}

            {/* =============================================
                EMPTY
            ============================================= */}

            {!loading &&
              products.length === 0 && (

                <div className="py-20 text-center">

                  <Sparkles
                    size={30}
                    className="mx-auto text-[#c9a227]"
                  />

                  <h3 className="mt-4 font-[family-name:var(--font-playfair)] text-2xl text-[#222]">
                    No products found
                  </h3>

                  <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#999]">
                    Try changing your filters
                    or browse another
                    collection.
                  </p>

                  <button
                    type="button"
                    onClick={
                      clearFilters
                    }
                    className="mt-6 rounded-full bg-[#8f0828] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#6f061f]"
                  >
                    Clear Filters
                  </button>

                </div>

              )}

            {/* =============================================
                PAGINATION
            ============================================= */}

            {!loading &&
              pagination.last_page > 1 && (

                <div className="mt-12 flex flex-wrap items-center justify-center gap-4 border-t border-[#e9e2d8] pt-7">

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

      {/* ===================================================
          MOBILE FILTER DRAWER
      =================================================== */}

      {mobileFilters && (

        <div className="fixed inset-0 z-[100] lg:hidden">

          <button
            type="button"
            aria-label="Close filters"
            onClick={() =>
              setMobileFilters(false)
            }
            className="absolute inset-0 bg-black/45"
          />

          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-[30px] bg-white p-5 shadow-2xl">

            <div className="mb-6 flex items-center justify-between border-b border-[#eee8de] pb-4">

              <div>

                <h3 className="font-[family-name:var(--font-playfair)] text-2xl text-[#191919]">
                  Filters
                </h3>

                <p className="mt-1 text-xs text-[#888]">
                  Refine your collection
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setMobileFilters(false)
                }
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f7f3ed]"
              >
                <X size={18} />
              </button>

            </div>

            <CategoryFilters
              categories={categories}
              category={currentCategory}
              setCategory={
                handleCategoryChange
              }
              productCount={
                productCount
              }
              search={search}
              setSearch={
                setSearch
              }
              minPrice={minPrice}
              maxPrice={maxPrice}
              setMinPrice={
                setMinPrice
              }
              setMaxPrice={
                setMaxPrice
              }
              sort={sort}
              setSort={setSort}
              newArrival={
                newArrival
              }
              bestSeller={
                bestSeller
              }
              featured={featured}
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

        </div>

      )}

    </main>
  );
}