"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import ProductCard, {
  StoreProductCardData,
} from "@/components/store/ProductCard";

import { storeApiFetch } from "@/lib/storeApi";

type RecommendedProductsProps = {
  currentProductId: number;

  /*
   * Products returned directly from:
   * GET /store/products/:slug
   */
  initialProducts?: StoreProductCardData[];

  /*
   * Used only as a fallback when the API does not
   * return recommended products.
   */
  categorySlug?: string | null;
};

export default function RecommendedProducts({
  currentProductId,
  initialProducts = [],
  categorySlug = null,
}: RecommendedProductsProps) {
  const [fallbackProducts, setFallbackProducts] =
    useState<StoreProductCardData[]>([]);

  const [loading, setLoading] =
    useState(false);

  /*
   * --------------------------------------------------------------------------
   * CLEAN INITIAL PRODUCTS
   * --------------------------------------------------------------------------
   */

  const cleanInitialProducts = useMemo(() => {
    const map = new Map<
      number,
      StoreProductCardData
    >();

    for (const product of initialProducts) {
      if (!product?.id) {
        continue;
      }

      const id = Number(product.id);

      /*
       * Never show current product.
       */
      if (id === Number(currentProductId)) {
        continue;
      }

      /*
       * Remove duplicates.
       */
      if (!map.has(id)) {
        map.set(id, product);
      }
    }

    return Array.from(map.values()).slice(0, 4);
  }, [
    initialProducts,
    currentProductId,
  ]);

  /*
   * --------------------------------------------------------------------------
   * FALLBACK LOAD
   * --------------------------------------------------------------------------
   *
   * Only fetch when the product API didn't provide recommendations.
   *
   * IMPORTANT:
   * The store products API expects `category` as a category slug,
   * not category ID.
   *
   */

  useEffect(() => {
  /*
   * If recommendations already came from the product API,
   * don't make another request.
   */
  if (cleanInitialProducts.length > 0) {
    setFallbackProducts([]);
    setLoading(false);
    return;
  }

  /*
   * No category slug = no fallback request.
   */
  if (!categorySlug) {
    setFallbackProducts([]);
    setLoading(false);
    return;
  }

  /*
   * Store a narrowed value.
   *
   * This is important because TypeScript now knows
   * that categorySlug is definitely a string.
   */
  const slug = categorySlug;

  let cancelled = false;

  async function loadFallbackProducts() {
    try {
      setLoading(true);

      const endpoint =
        `/store/products?category=${encodeURIComponent(slug)}`;

      const response =
        await storeApiFetch(endpoint);

      const json =
        await response.json();

      if (!response.ok) {
        throw new Error(
          json?.message ||
            "Unable to load recommended products."
        );
      }

      /*
       * Support:
       *
       * { data: [] }
       * { data: { data: [] } }
       * { products: [] }
       */

      let list: any[] = [];

      if (Array.isArray(json?.data)) {
        list = json.data;
      } else if (
        Array.isArray(json?.data?.data)
      ) {
        list = json.data.data;
      } else if (
        Array.isArray(json?.products)
      ) {
        list = json.products;
      }

      /*
       * Remove current product.
       */
      const filtered = list
        .filter(
          (item) =>
            Number(item?.id) !==
            Number(currentProductId)
        )
        .slice(0, 4);

      if (cancelled) {
        return;
      }

      setFallbackProducts(filtered);
    } catch (error) {
      if (cancelled) {
        return;
      }

      console.error(
        "Recommended products fallback error:",
        error
      );

      setFallbackProducts([]);
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  }

  void loadFallbackProducts();

  return () => {
    cancelled = true;
  };
}, [
  categorySlug,
  currentProductId,
  cleanInitialProducts.length,
]);

  /*
   * --------------------------------------------------------------------------
   * FINAL PRODUCTS
   * --------------------------------------------------------------------------
   */

  const products = useMemo(() => {
    if (cleanInitialProducts.length > 0) {
      return cleanInitialProducts;
    }

    const map = new Map<
      number,
      StoreProductCardData
    >();

    for (const product of fallbackProducts) {
      if (!product?.id) {
        continue;
      }

      const id = Number(product.id);

      if (id === Number(currentProductId)) {
        continue;
      }

      if (!map.has(id)) {
        map.set(id, product);
      }
    }

    return Array.from(map.values()).slice(0, 4);
  }, [
    cleanInitialProducts,
    fallbackProducts,
    currentProductId,
  ]);

  /*
   * --------------------------------------------------------------------------
   * NOTHING TO SHOW
   * --------------------------------------------------------------------------
   */

  if (
    !loading &&
    products.length === 0
  ) {
    return null;
  }

  /*
   * --------------------------------------------------------------------------
   * RENDER
   * --------------------------------------------------------------------------
   */

  return (
    <section
      className="
        mx-auto
        mt-16
        mb-20
        max-w-7xl
        border-t
        border-[#e9e2d8]
        px-4
        pt-12
        sm:px-6
        lg:px-10
      "
    >
      {/* HEADER */}

      <div
        className="
          flex
          flex-col
          items-center
          justify-between
          gap-4
          text-center
          sm:flex-row
          sm:text-left
        "
      >
        <div>
          <p
            className="
              text-[10px]
              font-semibold
              uppercase
              tracking-[0.22em]
              text-[#c9a227]
            "
          >
            You may also love
          </p>

          <h2
            className="
              mt-2
              font-[family-name:var(--font-playfair)]
              text-3xl
              leading-tight
              text-[#191919]
              sm:text-4xl
            "
          >
            Recommended for you
          </h2>

          <p
            className="
              mt-2
              text-sm
              leading-6
              text-[#777]
            "
          >
            More beautiful pieces you may like.
          </p>
        </div>

        <Link
          href="/shop"
          className="
            text-sm
            font-semibold
            text-[#8f0828]
            transition
            hover:opacity-70
          "
        >
          Explore the collection →
        </Link>
      </div>

      {/* LOADING */}

      {loading &&
        products.length === 0 && (
          <div
            className="
              mt-8
              grid
              grid-cols-2
              gap-4
              sm:gap-6
              lg:grid-cols-4
            "
          >
            {[1, 2, 3, 4].map(
              (item) => (
                <div
                  key={item}
                  className="
                    aspect-[3/4]
                    animate-pulse
                    rounded-2xl
                    bg-[#f5f0e8]
                  "
                />
              )
            )}
          </div>
        )}

      {/* PRODUCTS */}

      {products.length > 0 && (
        <div
          className="
            mt-8
            grid
            grid-cols-2
            gap-4
            sm:gap-6
            lg:grid-cols-4
          "
        >
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))}
        </div>
      )}
    </section>
  );
}