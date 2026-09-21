"use client";

import { useEffect, useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";

import CategoryFilters, {
  FilterCategory,
} from "@/components/store/CategoryFilters";

import ProductCard from "@/components/store/ProductCard";

import { storeApiFetch } from "@/lib/storeApi";

type Product = {
  id: number;
  name: string;
  slug: string;
  selling_price: number | string;
  mrp?: number | string;
  image?: string | null;
};

export default function CollectionPage({
  type,
  title,
}: {
  type: "new_arrival" | "best_seller";
  title: string;
}) {
  /* =========================================================
     DATA
  ========================================================= */

  const [categories, setCategories] = useState<FilterCategory[]>([]);

  const [products, setProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(true);

  /* =========================================================
     FILTERS
  ========================================================= */

  const [category, setCategory] = useState("");

  const [search, setSearch] = useState("");

  const [minPrice, setMinPrice] = useState("");

  const [maxPrice, setMaxPrice] = useState("");

  const [sort, setSort] = useState("");

  const [newArrival, setNewArrival] = useState(type === "new_arrival");

  const [bestSeller, setBestSeller] = useState(type === "best_seller");

  const [featured, setFeatured] = useState(false);

  /* =========================================================
     MOBILE FILTER
  ========================================================= */

  const [mobileFilters, setMobileFilters] = useState(false);

  /* =========================================================
     KEEP COLLECTION TYPE ACTIVE
  ========================================================= */

  useEffect(() => {
    if (type === "new_arrival") {
      setNewArrival(true);
    }

    if (type === "best_seller") {
      setBestSeller(true);
    }
  }, [type]);

  /* =========================================================
     GET CATEGORIES
  ========================================================= */

  useEffect(() => {
    let cancelled = false;

    async function getCategories() {
      try {
        const res = await storeApiFetch("/store/categories");

        const json = await res.json();

        if (cancelled) {
          return;
        }

        if (res.ok && Array.isArray(json?.data)) {
          setCategories(json.data);
        } else {
          setCategories([]);
        }
      } catch (error) {
        console.error("Categories fetch failed:", error);

        if (!cancelled) {
          setCategories([]);
        }
      }
    }

    void getCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =========================================================
     GET PRODUCTS
  ========================================================= */

  useEffect(() => {
    let cancelled = false;

    async function getProducts() {
      try {
        setLoading(true);

        const params = new URLSearchParams();

        /*
        |--------------------------------------------------------------------------
        | Collection Type
        |--------------------------------------------------------------------------
        */

        if (newArrival) {
          params.set("new_arrival", "1");
        }

        if (bestSeller) {
          params.set("best_seller", "1");
        }

        if (featured) {
          params.set("featured", "1");
        }

        /*
        |--------------------------------------------------------------------------
        | Category
        |--------------------------------------------------------------------------
        */

        if (category) {
          params.set("category", category);
        }

        /*
        |--------------------------------------------------------------------------
        | Search
        |--------------------------------------------------------------------------
        */

        if (search.trim()) {
          params.set("search", search.trim());
        }

        /*
        |--------------------------------------------------------------------------
        | Price
        |--------------------------------------------------------------------------
        */

        if (minPrice) {
          params.set("min_price", minPrice);
        }

        if (maxPrice) {
          params.set("max_price", maxPrice);
        }

        /*
        |--------------------------------------------------------------------------
        | Sort
        |--------------------------------------------------------------------------
        */

        if (sort) {
          params.set("sort", sort);
        }

        /*
        |--------------------------------------------------------------------------
        | Products
        |--------------------------------------------------------------------------
        */

        params.set("per_page", "24");

        const url = `/store/products?${params.toString()}`;

        const res = await storeApiFetch(url);

        const json = await res.json();

        if (cancelled) {
          return;
        }

        if (!res.ok) {
          setProducts([]);

          return;
        }

        /*
        |--------------------------------------------------------------------------
        | Node.js + Laravel Compatible Response
        |--------------------------------------------------------------------------
        */

        const productList = Array.isArray(json?.data)
          ? json.data
          : Array.isArray(json?.data?.data)
            ? json.data.data
            : [];

        setProducts(productList);
      } catch (error) {
        console.error(`${title} products fetch failed:`, error);

        if (!cancelled) {
          setProducts([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void getProducts();

    return () => {
      cancelled = true;
    };
  }, [
    title,
    category,
    search,
    minPrice,
    maxPrice,
    sort,
    newArrival,
    bestSeller,
    featured,
  ]);

  /* =========================================================
     CLEAR FILTERS
  ========================================================= */

  function clearFilters() {
    setCategory("");

    setSearch("");

    setMinPrice("");

    setMaxPrice("");

    setSort("");

    /*
    |--------------------------------------------------------------------------
    | Keep Current Collection Active
    |--------------------------------------------------------------------------
    */

    setNewArrival(type === "new_arrival");

    setBestSeller(type === "best_seller");

    setFeatured(false);
  }

  /* =========================================================
     LOCK COLLECTION FILTER
  ========================================================= */

  function handleNewArrival(value: boolean) {
    /*
     * New Arrivals page must always remain
     * a New Arrivals collection.
     */

    if (type === "new_arrival") {
      setNewArrival(true);

      return;
    }

    setNewArrival(value);
  }

  function handleBestSeller(value: boolean) {
    /*
     * Best Sellers page must always remain
     * a Best Sellers collection.
     */

    if (type === "best_seller") {
      setBestSeller(true);

      return;
    }

    setBestSeller(value);
  }

  /* =========================================================
     FILTER COUNT
  ========================================================= */

  const filterCount = useMemo(() => {
    return [
      category,

      search.trim(),

      minPrice || maxPrice ? "price" : "",

      sort,

      featured ? "featured" : "",

      /*
       * Don't count the mandatory collection filter.
       */

      type !== "new_arrival" && newArrival ? "new_arrival" : "",

      type !== "best_seller" && bestSeller ? "best_seller" : "",
    ].filter(Boolean).length;
  }, [
    category,
    search,
    minPrice,
    maxPrice,
    sort,
    featured,
    newArrival,
    bestSeller,
    type,
  ]);

  /* =========================================================
     RENDER
  ========================================================= */

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
            {title}
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#6d675e]">
            Explore our curated collection of premium bangles, traditional
            designs and latest trending jewellery crafted for every occasion.
          </p>
        </div>
      </section>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8 lg:py-10">
        {/* ===================================================
            COLLECTION HEADER
        =================================================== */}

        <div className="mb-8 flex flex-col gap-4 border-b border-[#e9e2d8] pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a08f73]">
              Curated for you
            </p>

            <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-2xl text-[#191919] sm:text-3xl">
              {title}
            </h2>

            <p className="mt-1 text-xs text-[#8b847a]">
              {products.length} {products.length === 1 ? "product" : "products"}
            </p>
          </div>

          {/* =================================================
              MOBILE FILTER BUTTON
          ================================================= */}

          <button
            type="button"
            onClick={() => setMobileFilters(true)}
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-full
              border
              border-[#ddd4c7]
              bg-white
              px-5
              py-3
              text-xs
              font-semibold
              text-[#333]
              shadow-sm
              transition
              hover:border-[#c9a227]
              hover:text-[#8f0828]
              lg:hidden
            "
          >
            <SlidersHorizontal size={15} />
            Filters
            {filterCount > 0 && (
              <span
                className="
                  flex
                  h-5
                  min-w-5
                  items-center
                  justify-center
                  rounded-full
                  bg-[#8f0828]
                  px-1.5
                  text-[9px]
                  text-white
                "
              >
                {filterCount}
              </span>
            )}
          </button>
        </div>

        {/* ===================================================
            FILTER + PRODUCTS
        =================================================== */}

        <div
          className="
            grid
            items-start
            gap-8
            lg:grid-cols-[240px_minmax(0,1fr)]
            xl:grid-cols-[255px_minmax(0,1fr)]
          "
        >
          {/* =================================================
              DESKTOP FILTER
          ================================================= */}

          <aside className="hidden lg:block">
            <div
              className="
                sticky
                top-24
                flex
                max-h-[calc(100vh-7rem)]
                flex-col
              "
            >
              {/* =============================================
                  FILTER HEADER
              ============================================= */}

              <div
                className="
                  shrink-0
                  border-b
                  border-[#e9e2d8]
                  bg-[#fbfaf7]
                  pb-4
                "
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-[#191919]">
                      Filters
                    </h3>

                    <p className="mt-1 text-[11px] text-[#8b847a]">
                      Refine your selection
                    </p>
                  </div>

                  {filterCount > 0 && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="
                        text-[11px]
                        font-semibold
                        uppercase
                        tracking-[0.08em]
                        text-[#8f0828]
                        transition
                        hover:opacity-70
                      "
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* =============================================
                  SCROLLABLE FILTER CONTENT
              ============================================= */}

              <div
                className="
                  min-h-0
                  flex-1
                  overflow-y-auto
                  overscroll-contain
                  py-5
                  pr-3

                  [&::-webkit-scrollbar]:w-[3px]
                  [&::-webkit-scrollbar-track]:bg-transparent

                  [&::-webkit-scrollbar-thumb]:rounded-full
                  [&::-webkit-scrollbar-thumb]:bg-[#d5cec4]
                "
              >
                <CategoryFilters
                  categories={categories}
                  category={category}
                  setCategory={setCategory}
                  search={search}
                  setSearch={setSearch}
                  minPrice={minPrice}
                  maxPrice={maxPrice}
                  setMinPrice={setMinPrice}
                  setMaxPrice={setMaxPrice}
                  sort={sort}
                  setSort={setSort}
                  newArrival={newArrival}
                  bestSeller={bestSeller}
                  featured={featured}
                  setNewArrival={handleNewArrival}
                  setBestSeller={handleBestSeller}
                  setFeatured={setFeatured}
                  clearFilters={clearFilters}
                  productCount={products.length}
                />
              </div>
            </div>
          </aside>

          {/* =================================================
              PRODUCTS
          ================================================= */}

          <div className="min-w-0">
            {/* ===============================================
                LOADING
            =============================================== */}

            {loading ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 xl:grid-cols-3">
                {Array.from({
                  length: 9,
                }).map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="aspect-[4/5] rounded-[22px] bg-[#eee8dc]" />

                    <div className="px-1 pt-4">
                      <div className="h-2.5 w-20 rounded bg-[#eee8dc]" />

                      <div className="mt-3 h-5 w-4/5 rounded bg-[#eee8dc]" />

                      <div className="mt-3 h-4 w-24 rounded bg-[#eee8dc]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              /* =============================================
                  EMPTY
              ============================================= */

              <div
                className="
                  flex
                  min-h-[420px]
                  items-center
                  justify-center
                  rounded-3xl
                  border
                  border-dashed
                  border-[#d9d0c2]
                  bg-white
                  px-6
                  text-center
                "
              >
                <div>
                  <h3 className="font-[family-name:var(--font-playfair)] text-2xl text-[#191919]">
                    No products found
                  </h3>

                  <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#888]">
                    Try changing your filters or clear them to explore more
                    products.
                  </p>

                  <button
                    type="button"
                    onClick={clearFilters}
                    className="
                      mt-6
                      rounded-full
                      bg-[#8f0828]
                      px-6
                      py-3
                      text-xs
                      font-semibold
                      text-white
                      transition
                      hover:bg-[#700620]
                    "
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            ) : (
              /* =============================================
                  PRODUCT GRID
              ============================================= */

              <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 xl:grid-cols-3">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =====================================================
          MOBILE FILTER DRAWER
      ===================================================== */}

      {mobileFilters && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          {/* ===============================================
              BACKDROP
          =============================================== */}

          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setMobileFilters(false)}
            className="
              absolute
              inset-0
              bg-black/45
              backdrop-blur-[2px]
            "
          />

          {/* ===============================================
              DRAWER
          =============================================== */}

          <aside
            className="
              absolute
              bottom-0
              left-0
              right-0
              max-h-[90vh]
              overflow-y-auto
              rounded-t-[30px]
              bg-white
              p-5
              shadow-2xl
            "
          >
            {/* =============================================
                MOBILE HEADER
            ============================================= */}

            <div className="flex items-center justify-between border-b border-[#eee8de] pb-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a08f73]">
                  BanglesMart
                </p>

                <h2 className="mt-1 font-[family-name:var(--font-playfair)] text-2xl text-[#191919]">
                  Filters
                </h2>

                {filterCount > 0 && (
                  <p className="mt-1 text-xs text-[#888]">
                    {filterCount}{" "}
                    {filterCount === 1 ? "filter active" : "filters active"}
                  </p>
                )}
              </div>

              <button
                type="button"
                aria-label="Close filters"
                onClick={() => setMobileFilters(false)}
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-full
                  bg-[#f7f2e9]
                  text-[#333]
                "
              >
                <X size={18} />
              </button>
            </div>

            {/* =============================================
                FILTERS
            ============================================= */}

            <div className="mt-6">
              <CategoryFilters
                categories={categories}
                category={category}
                setCategory={setCategory}
                search={search}
                setSearch={setSearch}
                minPrice={minPrice}
                maxPrice={maxPrice}
                setMinPrice={setMinPrice}
                setMaxPrice={setMaxPrice}
                sort={sort}
                setSort={setSort}
                newArrival={newArrival}
                bestSeller={bestSeller}
                featured={featured}
                setNewArrival={handleNewArrival}
                setBestSeller={handleBestSeller}
                setFeatured={setFeatured}
                clearFilters={clearFilters}
                productCount={products.length}
                mobile
              />
            </div>

            {/* =============================================
                SHOW PRODUCTS BUTTON
            ============================================= */}

            <button
              type="button"
              onClick={() => setMobileFilters(false)}
              className="
                mt-7
                w-full
                rounded-full
                bg-[#8f0828]
                py-3.5
                text-sm
                font-semibold
                text-white
                transition
                hover:bg-[#700620]
              "
            >
              Show {products.length}{" "}
              {products.length === 1 ? "Product" : "Products"}
            </button>
          </aside>
        </div>
      )}
    </main>
  );
}
