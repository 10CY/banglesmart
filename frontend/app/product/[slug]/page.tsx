"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";
import { useParams } from "next/navigation";

import {
  ArrowLeft,
  Heart,
  Minus,
  Plus,
  ShoppingBag,
  Star,
} from "lucide-react";

import { customerApiFetch } from "@/lib/customerApi";
import { storeApiFetch } from "@/lib/storeApi";

import ProductGallery from "@/components/product/ProductGallery";
import ProductDescription from "@/components/product/ProductDescription";
import ProductVariants from "@/components/product/ProductVariants";
import RecommendedProducts from "@/components/product/RecommendedProducts";
import ProductBadges from "@/components/product/ProductBadges";
import ProductReviews from "@/components/store/reviews/ProductReviews";

import type {
  MyReview,
} from "@/components/store/reviews/ReviewForm";

import type {
  Product,
  Size,
  Color,
  Variant,
} from "@/components/product/product.types";

import type {
  ProductReview,
} from "@/components/store/reviews/ReviewList";

/* ==========================================================================
   HELPERS
========================================================================== */

function money(
  value: string | number | null | undefined
) {
  const amount = Number(value || 0);

  return amount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
}

/* ==========================================================================
   PAGE
========================================================================== */

export default function ProductDetailPage() {
  const params = useParams();

  const slug = String(params.slug || "");

  /* -----------------------------------------------------------------------
     PRODUCT
  ----------------------------------------------------------------------- */

  const [product, setProduct] =
    useState<Product | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /* -----------------------------------------------------------------------
     VARIANT
  ----------------------------------------------------------------------- */

  const [selectedVariant, setSelectedVariant] =
    useState<Variant | null>(null);

  const [selectedSizeId, setSelectedSizeId] =
    useState<number | null>(null);

  const [selectedColorId, setSelectedColorId] =
    useState<number | null>(null);

  const [selectedImage, setSelectedImage] =
    useState(0);

  /* -----------------------------------------------------------------------
     CART
  ----------------------------------------------------------------------- */

  const [quantity, setQuantity] =
    useState(1);

  const [adding, setAdding] =
    useState(false);

  const [message, setMessage] =
    useState("");

  /* -----------------------------------------------------------------------
     WISHLIST
  ----------------------------------------------------------------------- */

  const [wishlist, setWishlist] =
    useState(false);

  /* -----------------------------------------------------------------------
     REVIEWS
  ----------------------------------------------------------------------- */

  const [reviewRating, setReviewRating] =
    useState(0);

  const [reviewTitle, setReviewTitle] =
    useState("");

  const [reviewComment, setReviewComment] =
    useState("");

  const [reviewSubmitting, setReviewSubmitting] =
    useState(false);

  const [reviewMessage, setReviewMessage] =
    useState("");

  const [myReview, setMyReview] =
    useState<MyReview | null>(null);

  /* ==========================================================================
     LOAD PRODUCT
  ========================================================================== */

  const loadProduct = useCallback(
    async (showLoader = true) => {
      if (!slug) return;

      try {
        if (showLoader) {
          setLoading(true);
        }

        setError("");

        const response =
          await storeApiFetch(
            `/store/products/${encodeURIComponent(
              slug
            )}`
          );

        const json =
          await response.json();

        if (!response.ok) {
          throw new Error(
            json?.message ||
              "Unable to load product."
          );
        }

        const loadedProduct =
          json?.data ||
          json?.product ||
          null;

        if (!loadedProduct) {
          throw new Error(
            "Product not found."
          );
        }

        setProduct(
          loadedProduct as Product
        );

        /* ---------------------------------------------------------------
           VARIANTS
        --------------------------------------------------------------- */

        const variants: Variant[] =
          Array.isArray(
            loadedProduct.variants
          )
            ? loadedProduct.variants
            : [];

        const firstVariant =
          variants.find(
            (variant: Variant) =>
              variant.status ===
              "active"
          ) ||
          variants[0] ||
          null;

        setSelectedVariant(
          firstVariant
        );

        if (firstVariant) {
          setSelectedSizeId(
            firstVariant.size_id ||
              null
          );

          setSelectedColorId(
            firstVariant.color_id ||
              null
          );
        } else {
          setSelectedSizeId(null);
          setSelectedColorId(null);
        }

        /* ---------------------------------------------------------------
           REVIEWS
        --------------------------------------------------------------- */

        /*
         * If the API sends the user's own review separately,
         * preserve it.
         */
        if (json?.myReview) {
          setMyReview(
            json.myReview as MyReview
          );
        } else if (
          json?.data?.myReview
        ) {
          setMyReview(
            json.data.myReview as MyReview
          );
        }
      } catch (err) {
        console.error(
          "Product loading error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load product."
        );
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    },
    [slug]
  );

  useEffect(() => {
    void loadProduct(true);
  }, [loadProduct]);

  /* ==========================================================================
     PRODUCT VALUES
  ========================================================================== */

  const price =
    selectedVariant
      ? selectedVariant.selling_price
      : product?.selling_price || "0";

  const mrp =
    selectedVariant
      ? selectedVariant.mrp
      : product?.mrp || "0";

  const discount =
    Number(mrp) > 0
      ? Math.max(
          0,
          Math.round(
            ((Number(mrp) -
              Number(price)) /
              Number(mrp)) *
              100
          )
        )
      : 0;

  /* ==========================================================================
     STOCK
  ========================================================================== */

  const stock =
    selectedVariant?.inventory
      ?.quantity ?? 0;

  const outOfStock =
    Boolean(
      selectedVariant &&
        stock <= 0
    );

  /* ==========================================================================
     IMAGES
  ========================================================================== */

  const images = useMemo(() => {
    if (!product) return [];

    return Array.isArray(
      product.images
    )
      ? product.images
      : [];
  }, [product]);

  /* ==========================================================================
     SIZES
  ========================================================================== */

  const sizes =
    useMemo<Size[]>(() => {
      if (!product) return [];

      const map =
        new Map<number, Size>();

      for (const variant of
        product.variants || []) {
        if (variant.size) {
          map.set(
            Number(
              variant.size.id
            ),
            variant.size
          );
        }
      }

      return Array.from(
        map.values()
      );
    }, [product]);

  /* ==========================================================================
     COLORS
  ========================================================================== */

  const colors =
    useMemo<Color[]>(() => {
      if (!product) return [];

      const map =
        new Map<number, Color>();

      for (const variant of
        product.variants || []) {
        if (variant.color) {
          map.set(
            Number(
              variant.color.id
            ),
            variant.color
          );
        }
      }

      return Array.from(
        map.values()
      );
    }, [product]);

  /* ==========================================================================
     SIZE STOCK
  ========================================================================== */

  const sizeHasStock = (
    sizeId: number
  ) => {
    if (!product) {
      return false;
    }

    return product.variants.some(
      (variant) =>
        Number(
          variant.size_id
        ) === Number(sizeId) &&
        Number(
          variant.inventory
            ?.quantity || 0
        ) > 0
    );
  };

  /* ==========================================================================
     COLOR STOCK
  ========================================================================== */

  const colorHasStock = (
    colorId: number
  ) => {
    if (!product) {
      return false;
    }

    return product.variants.some(
      (variant) =>
        Number(
          variant.color_id
        ) === Number(colorId) &&
        Number(
          variant.inventory
            ?.quantity || 0
        ) > 0
    );
  };

  /* ==========================================================================
     SIZE CHANGE
  ========================================================================== */

  function onSizeChange(
    sizeId: number
  ) {
    if (!product) return;

    setSelectedSizeId(
      sizeId
    );

    let matchingVariant =
      product.variants.find(
        (variant) =>
          Number(
            variant.size_id
          ) === Number(sizeId) &&
          (
            selectedColorId === null ||
            Number(
              variant.color_id
            ) ===
              Number(
                selectedColorId
              )
          )
      );

    /*
     * If the selected size does not
     * exist with the current color,
     * select any variant for that size.
     */
    if (!matchingVariant) {
      matchingVariant =
        product.variants.find(
          (variant) =>
            Number(
              variant.size_id
            ) === Number(sizeId)
        );
    }

    if (matchingVariant) {
      setSelectedVariant(
        matchingVariant
      );

      if (
        matchingVariant.color_id
      ) {
        setSelectedColorId(
          matchingVariant.color_id
        );
      }
    }
  }

  /* ==========================================================================
     COLOR CHANGE
  ========================================================================== */

  function onColorChange(
    colorId: number
  ) {
    if (!product) return;

    setSelectedColorId(
      colorId
    );

    let matchingVariant =
      product.variants.find(
        (variant) =>
          Number(
            variant.color_id
          ) === Number(colorId) &&
          (
            selectedSizeId === null ||
            Number(
              variant.size_id
            ) ===
              Number(
                selectedSizeId
              )
          )
      );

    /*
     * If the selected color does not
     * exist with the current size,
     * select any variant for that color.
     */
    if (!matchingVariant) {
      matchingVariant =
        product.variants.find(
          (variant) =>
            Number(
              variant.color_id
            ) === Number(colorId)
        );
    }

    if (matchingVariant) {
      setSelectedVariant(
        matchingVariant
      );

      if (
        matchingVariant.size_id
      ) {
        setSelectedSizeId(
          matchingVariant.size_id
        );
      }
    }
  }

  /* ==========================================================================
     SUBMIT REVIEW
  ========================================================================== */

  async function submitReview() {
    if (!product) {
      return;
    }

    if (reviewRating < 1) {
      setReviewMessage(
        "Please select a rating."
      );
      return;
    }

    if (!reviewTitle.trim()) {
      setReviewMessage(
        "Please enter a review title."
      );
      return;
    }

    if (!reviewComment.trim()) {
      setReviewMessage(
        "Please write a review."
      );
      return;
    }

    try {
      setReviewSubmitting(true);
      setReviewMessage("");

      /*
       * Review endpoint.
       *
       * This uses the product slug because your
       * product route itself uses /products/:slug.
       */
      const response =
        await storeApiFetch(
          `/store/products/${encodeURIComponent(
            product.slug
          )}/reviews`,
          {
            method: "POST",
            body: JSON.stringify({
              rating: reviewRating,
              title:
                reviewTitle.trim(),
              comment:
                reviewComment.trim(),
            }),
          }
        );

      const json =
        await response.json();

      if (!response.ok) {
        throw new Error(
          json?.message ||
            "Unable to submit review."
        );
      }

      /*
       * Clear form.
       */
      setReviewRating(0);
      setReviewTitle("");
      setReviewComment("");

      /*
       * Show server message.
       */
      setReviewMessage(
        json?.message ||
          "Review submitted successfully. It is pending approval."
      );

      /*
       * IMPORTANT:
       *
       * Reload product so the page gets the
       * latest review data from backend.
       *
       * Do not show a pending review as an
       * approved public review.
       */
      await loadProduct(false);
    } catch (err) {
      console.error(
        "Review submission error:",
        err
      );

      setReviewMessage(
        err instanceof Error
          ? err.message
          : "Unable to submit review."
      );
    } finally {
      setReviewSubmitting(
        false
      );
    }
  }

  /* ==========================================================================
     ADD TO CART
  ========================================================================== */

  async function addToCart() {
    if (!product) return;

    if (!selectedVariant) {
      setMessage("Please select a product variant.");
      return;
    }

    if (outOfStock) {
      setMessage("This product is currently out of stock.");
      return;
    }

    if (quantity < 1) {
      setMessage("Please select a valid quantity.");
      return;
    }

    if (quantity > stock) {
      setMessage(`Only ${stock} item(s) available.`);
      return;
    }

    try {
      setAdding(true);
      setMessage("");

      const response = await customerApiFetch(
        "/customer/cart/items",
        {
          method: "POST",
          body: JSON.stringify({
            product_variant_id: selectedVariant.id,
            quantity,
          }),
        }
      );

      const json = await response.json();

      if (!response.ok) {
        throw new Error(
          json?.message || "Unable to add product to cart."
        );
      }

      setMessage("Product added to cart successfully.");

      window.dispatchEvent(
        new Event("banglesmart:customer-refresh")
      );
    } catch (err) {
      console.error("Add to cart error:", err);

      setMessage(
        err instanceof Error
          ? err.message
          : "Unable to add product to cart."
      );
    } finally {
      setAdding(false);
    }
  }

  async function buyNow() {
    if (!product) return;

    if (!selectedVariant) {
      setMessage("Please select a product variant.");
      return;
    }

    if (outOfStock) {
      setMessage("This product is currently out of stock.");
      return;
    }

    if (quantity < 1) {
      setMessage("Please select a valid quantity.");
      return;
    }

    if (quantity > stock) {
      setMessage(`Only ${stock} item(s) available.`);
      return;
    }

    try {
      setAdding(true);
      setMessage("");

      const response = await customerApiFetch(
        "/customer/cart/items",
        {
          method: "POST",
          body: JSON.stringify({
            product_variant_id: selectedVariant.id,
            quantity,
          }),
        }
      );

      const json = await response.json();

      if (!response.ok) {
        throw new Error(
          json?.message || "Unable to proceed to checkout."
        );
      }

      window.dispatchEvent(
        new Event("banglesmart:customer-refresh")
      );

      window.location.href = "/checkout";
    } catch (err) {
      console.error("Buy now error:", err);

      setMessage(
        err instanceof Error
          ? err.message
          : "Unable to proceed to checkout."
      );
    } finally {
      setAdding(false);
    }
  }

  /* ==========================================================================
     LOADING
  ========================================================================== */

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-3xl bg-[#f5f0e8]" />

          <div className="space-y-5">
            <div className="h-10 animate-pulse rounded bg-[#f5f0e8]" />
            <div className="h-6 w-2/3 animate-pulse rounded bg-[#f5f0e8]" />
            <div className="h-20 animate-pulse rounded bg-[#f5f0e8]" />
            <div className="h-12 animate-pulse rounded bg-[#f5f0e8]" />
            <div className="h-32 animate-pulse rounded bg-[#f5f0e8]" />
          </div>
        </div>
      </main>
    );
  }

  /* ==========================================================================
     ERROR
  ========================================================================== */

  if (error || !product) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-10">
        <h1 className="font-[family-name:var(--font-playfair)] text-3xl text-gray-900">
          Product unavailable
        </h1>

        <p className="mt-3 text-sm text-gray-500">
          {error ||
            "The requested product could not be found."}
        </p>

        <Link
          href="/shop"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#111827] px-5 py-3 text-sm font-semibold text-white"
        >
          <ArrowLeft size={16} />
          Back to Shop
        </Link>
      </main>
    );
  }

  /* ==========================================================================
     APPROVED REVIEW RATING
  ========================================================================== */

  const approvedReviews =
    Array.isArray(product.reviews)
      ? product.reviews.filter(
          (review) =>
            review.status ===
            "approved"
        )
      : [];

  const reviewCount =
    approvedReviews.length;

  const reviewAverage =
    reviewCount > 0
      ? approvedReviews.reduce(
          (total, review) =>
            total +
            Number(
              review.rating || 0
            ),
          0
        ) / reviewCount
      : 0;

  /* ==========================================================================
     RECOMMENDED PRODUCTS
     
     IMPORTANT:
     Do not use product.recommended here because
     your Product type currently does not define it.
  ========================================================================== */

  return (
    <main className="min-h-screen bg-white">

      {/* =====================================================================
          BREADCRUMB
      ===================================================================== */}

      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-10">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-sm text-gray-500 transition hover:text-gray-900"
        >
          <ArrowLeft size={16} />
          Back to Shop
        </Link>
      </div>

      {/* =====================================================================
          PRODUCT
      ===================================================================== */}

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-2">

          {/* -----------------------------------------------------------------
              GALLERY
          ----------------------------------------------------------------- */}

          <div>
            <ProductGallery
              product={product}
              selectedImage={
                selectedImage
              }
              onImageChange={
                setSelectedImage
              }
            />
          </div>

          {/* -----------------------------------------------------------------
              PRODUCT INFO
          ----------------------------------------------------------------- */}

          <div>

            {/* CATEGORY */}

            {product.category && (
              <Link
                href={`/shop/${product.category.slug}`}
                className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#c9a227]"
              >
                {product.category.name}
              </Link>
            )}

            {/* NAME */}

            <h1 className="mt-3 font-[family-name:var(--font-playfair)] text-3xl leading-tight text-gray-900 sm:text-4xl">
              {product.name}
            </h1>

            {/* BADGES */}

            <div className="mt-4">
              <ProductBadges
                product={product}
              />
            </div>

            {/* RATING */}

            <div className="mt-4 flex items-center gap-3">

              <div className="flex">
                {[1, 2, 3, 4, 5].map(
                  (item) => (
                    <Star
                      key={item}
                      size={16}
                      className={
                        item <=
                        Math.round(
                          reviewAverage
                        )
                          ? "fill-[#c9a227] text-[#c9a227]"
                          : "text-gray-300"
                      }
                    />
                  )
                )}
              </div>

              <span className="text-sm text-gray-500">
                {reviewAverage.toFixed(
                  1
                )}
              </span>

              <span className="text-sm text-gray-400">
                ({reviewCount}{" "}
                reviews)
              </span>
            </div>

            {/* DESCRIPTION */}

            {product.short_description && (
              <p className="mt-5 text-sm leading-7 text-gray-600">
                {
                  product.short_description
                }
              </p>
            )}

            {/* PRICE */}

            <div className="mt-6 flex flex-wrap items-center gap-3">

              <span className="text-3xl font-semibold text-gray-900">
                {money(price)}
              </span>

              {Number(mrp) >
                Number(price) && (
                <span className="text-lg text-gray-400 line-through">
                  {money(mrp)}
                </span>
              )}

              {discount > 0 && (
                <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                  {discount}% OFF
                </span>
              )}
            </div>

            {/* WISHLIST */}

            <button
              type="button"
              onClick={() =>
                setWishlist(
                  (value) =>
                    !value
                )
              }
              className="mt-5 inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:border-gray-500"
            >
              <Heart
                size={17}
                className={
                  wishlist
                    ? "fill-[#8f0828] text-[#8f0828]"
                    : ""
                }
              />

              {wishlist
                ? "Added to Wishlist"
                : "Add to Wishlist"}
            </button>

            <div className="my-7 border-t border-gray-200" />

            {/* VARIANTS */}

            <ProductVariants
              product={product}
              sizes={sizes}
              colors={colors}
              selectedSizeId={
                selectedSizeId
              }
              selectedColorId={
                selectedColorId
              }
              selectedVariant={
                selectedVariant
              }
              sizeHasStock={
                sizeHasStock
              }
              colorHasStock={
                colorHasStock
              }
              onSizeChange={
                onSizeChange
              }
              onColorChange={
                onColorChange
              }
            />

            {/* STOCK */}

            <div className="mt-6">

              {!selectedVariant ? (
                <p className="text-sm text-gray-500">
                  Select an option
                  to continue.
                </p>
              ) : outOfStock ? (
                <p className="text-sm font-medium text-red-600">
                  Out of Stock
                </p>
              ) : (
                <p className="text-sm font-medium text-green-700">
                  {stock <= 5
                    ? `Only ${stock} left in stock`
                    : "In Stock"}
                </p>
              )}

            </div>

            {/* QUANTITY + CART */}

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[auto_1fr_1fr]">

              <div className="flex h-12 items-center rounded-lg border border-gray-300">

                <button
                  type="button"
                  disabled={
                    quantity <= 1
                  }
                  onClick={() =>
                    setQuantity(
                      (value) =>
                        Math.max(
                          1,
                          value - 1
                        )
                    )
                  }
                  className="flex h-full w-10 items-center justify-center text-gray-500 disabled:opacity-40"
                >
                  <Minus size={15} />
                </button>

                <span className="w-8 text-center text-sm font-medium">
                  {quantity}
                </span>

                <button
                  type="button"
                  disabled={
                    outOfStock ||
                    quantity >= stock
                  }
                  onClick={() =>
                    setQuantity((value) =>
                      Math.min(stock, value + 1)
                    )
                  }
                  className="flex h-full w-10 items-center justify-center text-gray-500 disabled:opacity-40"
                >
                  <Plus size={15} />
                </button>

              </div>

              <button
                type="button"
                disabled={
                  adding ||
                  outOfStock ||
                  !selectedVariant
                }
                onClick={addToCart}
                className="flex h-12 items-center justify-center gap-2 rounded-lg border border-[#111827] px-5 text-sm font-semibold text-[#111827] transition hover:bg-[#111827] hover:text-white disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
              >
                <ShoppingBag size={18} />

                {adding
                  ? "Adding..."
                  : outOfStock
                    ? "Out of Stock"
                    : "Add to Cart"}
              </button>

              <button
                type="button"
                disabled={
                  adding ||
                  outOfStock ||
                  !selectedVariant
                }
                onClick={buyNow}
                className="flex h-12 items-center justify-center gap-2 rounded-lg bg-[#8f0828] px-5 text-sm font-semibold text-white transition hover:bg-[#72061f] disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {adding
                  ? "Processing..."
                  : outOfStock
                    ? "Out of Stock"
                    : "Buy Now"}
              </button>

            </div>

            {/* CART MESSAGE */}

            {message && (
              <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                {message}
              </div>
            )}

            {/* SKU */}

            {selectedVariant?.sku && (
              <p className="mt-5 text-xs text-gray-400">
                SKU:{" "}
                {
                  selectedVariant.sku
                }
              </p>
            )}

          </div>
        </div>
      </section>

      {/* =====================================================================
          DESCRIPTION
      ===================================================================== */}

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <ProductDescription
          product={product}
        />
      </section>

      {/* =====================================================================
          REVIEWS
      ===================================================================== */}

      <ProductReviews
        reviews={
          (product.reviews ||
            []) as ProductReview[]
        }

        myReview={
          myReview
        }

        reviewRating={
          reviewRating
        }

        reviewTitle={
          reviewTitle
        }

        reviewComment={
          reviewComment
        }

        reviewSubmitting={
          reviewSubmitting
        }

        reviewMessage={
          reviewMessage
        }

        onRatingChange={
          setReviewRating
        }

        onTitleChange={
          setReviewTitle
        }

        onCommentChange={
          setReviewComment
        }

        onSubmit={
          submitReview
        }
      />

      {/* =====================================================================
          RECOMMENDED PRODUCTS

          We intentionally do NOT use:

          product.recommended

          because your Product type does not currently define that property.
      ===================================================================== */}

      <RecommendedProducts
        currentProductId={product.id}
        initialProducts={product.recommended ?? []}
        categorySlug={product.category?.slug ?? null}
      />
    </main>
  );
}