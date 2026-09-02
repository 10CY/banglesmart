"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

import ProductCard, {
  StoreProductCardData,
} from "@/components/store/ProductCard";

import { storeApiFetch } from "@/lib/storeApi";

type OfferProduct = StoreProductCardData & {
  mrp?: number | string;
  selling_price?: number | string;
};

function ProductSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[4/5] rounded-[22px] bg-[#eee8dc]" />

      <div className="px-1 pt-4">
        <div className="h-2.5 w-20 rounded bg-[#eee8dc]" />

        <div className="mt-3 h-5 w-4/5 rounded bg-[#eee8dc]" />
      </div>
    </div>
  );
}

export default function OffersPage() {
  const [products, setProducts] = useState<OfferProduct[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadOffers() {
    try {
      setLoading(true);

      const response = await storeApiFetch("/store/products");
      const json = await response.json();

      const list = Array.isArray(json?.data?.data)
        ? json.data.data
        : Array.isArray(json?.data)
          ? json.data
          : [];

      const offers = list.filter(
        (product: OfferProduct) =>
          Number(product.mrp) > Number(product.selling_price)
      );

      setProducts(offers);
    } catch (error) {
      console.log("Offers loading error", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOffers();
  }, []);

  return (
    <main className="min-h-screen bg-[#fbfaf7]">
      {/* HERO */}
      <section className="border-b border-[#eee8de] bg-[#f5efe5]">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16">
          {/* BREADCRUMB */}
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#8f0828]">
            BanglesMart / Offers
          </p>

          <h1 className="mt-3 font-[family-name:var(--font-playfair)] text-4xl leading-tight text-[#191919] sm:text-5xl">
            Special Offers
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#6d675e]">
            Discover exclusive jewellery deals, limited offers and beautiful
            bangles crafted for every celebration.
          </p>
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 border-b border-[#e9e2d8] pb-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a08f73]">
            Curated Deals
          </p>

          <h2 className="mt-1 font-[family-name:var(--font-playfair)] text-2xl text-[#191919]">
            Exclusive Offers
          </h2>

          <p className="mt-1 text-xs text-[#8b847a]">
            {products.length} Products
          </p>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <ProductSkeleton key={index} />
            ))}
          </div>
        )}

        {/* PRODUCTS */}
        {!loading && products.length > 0 && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && products.length === 0 && (
          <div className="flex min-h-[400px] items-center justify-center rounded-3xl border border-dashed border-[#d9d0c2] bg-white text-center">
            <div>
              <Sparkles
                size={30}
                className="mx-auto text-[#c9a227]"
              />

              <h2 className="mt-4 font-[family-name:var(--font-playfair)] text-2xl">
                No Offers Available
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Check back soon for new collections.
              </p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}