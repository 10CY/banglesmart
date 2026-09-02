"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { storeApiFetch } from "@/lib/storeApi";
import ProductCard, {
  StoreProductCardData,
} from "@/components/store/ProductCard";

export default function BestSellerSection() {
  const [products, setProducts] = useState<StoreProductCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const response = await storeApiFetch(
          "/store/products?best_seller=1&per_page=4"
        );

        const json = await response.json();

        if (!cancelled && response.ok) {
          const productList = Array.isArray(json?.data)
            ? json.data
            : Array.isArray(json?.data?.data)
              ? json.data.data
              : [];

          setProducts(productList);
        }
      } catch (error) {
        console.error("Best sellers fetch failed:", error);

        if (!cancelled) {
          setProducts([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="bg-[#faf6ee] px-5 py-16 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center justify-between gap-5 text-center md:flex-row md:text-left">
          <div>
            <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[.25em] text-[#c9a227] md:justify-start">
              <Sparkles size={15} />
              Customer Favorites
            </div>

            <h2 className="mt-3 font-[family-name:var(--font-playfair)] text-4xl text-[#191919]">
              Best Sellers
            </h2>

            <p className="mt-2 text-sm text-[#777]">
              Our most loved jewellery pieces.
            </p>
          </div>

          <Link
            href="/shop?best_seller=1"
            className="text-sm font-semibold text-[#8f0828]"
          >
            View all best sellers →
          </Link>
        </div>

        {loading ? (
          <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="aspect-[4/5] animate-pulse rounded-2xl bg-white"
              />
            ))}
          </div>
        ) : products.length ? (
          <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-2xl border border-dashed border-[#d8cfbf] bg-white p-10 text-center text-sm text-[#777]">
            No best sellers are marked yet.
          </div>
        )}
      </div>
    </section>
  );
}