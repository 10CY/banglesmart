"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import Link from "next/link";

import { useParams, useRouter } from "next/navigation";

import { ArrowLeft, Heart, Minus, Plus, ShoppingBag, Star } from "lucide-react";

import { storeApiFetch } from "@/lib/storeApi";
import { customerApiFetch } from "@/lib/customerApi";

import ProductGallery from "@/components/product/ProductGallery";
import ProductDescription from "@/components/product/ProductDescription";
import ProductVariants from "@/components/product/ProductVariants";
import DesignSelector from "@/components/product/DesignSelector";
import RecommendedProducts from "@/components/product/RecommendedProducts";
import ProductBadges from "@/components/product/ProductBadges";

import ProductReviews from "@/components/store/reviews/ProductReviews";

import { addCartItem } from "@/features/cart/cart.api";

import {
  addWishlistItem,
  checkWishlist,
  removeWishlistItem,
} from "@/features/wishlist/wishlist.api";

import { useCommerce } from "@/features/commerce/CommerceProvider";

import type { MyReview } from "@/components/store/reviews/ReviewForm";

import type { ProductReview } from "@/components/store/reviews/ReviewList";

import type {
  Color,
  Product,
  ProductImage,
  Size,
  Variant,
} from "@/components/product/product.types";

/*
|--------------------------------------------------------------------------
| Money
|--------------------------------------------------------------------------
*/

function money(value: string | number | null | undefined) {
  const amount = Number(value || 0);

  return amount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
}

/*
|--------------------------------------------------------------------------
| Sort Images
|--------------------------------------------------------------------------
*/

function sortImages(images: ProductImage[]) {
  return [...images].sort((a, b) => {
    const primaryA = a.is_primary ? 1 : 0;

    const primaryB = b.is_primary ? 1 : 0;

    if (primaryA !== primaryB) {
      return primaryB - primaryA;
    }

    const orderA = Number(a.sort_order || 0);

    const orderB = Number(b.sort_order || 0);

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    return Number(a.id || 0) - Number(b.id || 0);
  });
}

/*
|--------------------------------------------------------------------------
| Product Detail Page
|--------------------------------------------------------------------------
*/

export default function ProductDetailPage() {
  const params = useParams();

  const router = useRouter();

  const {
    requireLogin: requireCustomerLogin,

    setCartCount,

    setWishlistCount,
  } = useCommerce();

  const slug = String(params.slug || "");

  /*
  |--------------------------------------------------------------------------
  | Product
  |--------------------------------------------------------------------------
  */

  const [product, setProduct] = useState<Product | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Variant Selection
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  |
  | Nothing is automatically selected.
  |
  */

  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);

  const [selectedSizeId, setSelectedSizeId] = useState<number | null>(null);

  const [selectedColorId, setSelectedColorId] = useState<number | null>(null);

  /*
  |--------------------------------------------------------------------------
  | Design Selection
  |--------------------------------------------------------------------------
  |
  | Also not selected automatically.
  |
  */

  const [selectedDesignId, setSelectedDesignId] = useState<number | null>(null);

  /*
  |--------------------------------------------------------------------------
  | Gallery
  |--------------------------------------------------------------------------
  */

  const [selectedImage, setSelectedImage] = useState(0);

  /*
  |--------------------------------------------------------------------------
  | Customer Gallery Interaction
  |--------------------------------------------------------------------------
  |
  | false:
  |
  | Page just opened.
  | General image gets priority.
  |
  | true:
  |
  | Customer selected size/color/design.
  |
  */

  const [gallerySelectionStarted, setGallerySelectionStarted] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Quantity / Cart
  |--------------------------------------------------------------------------
  */

  const [quantity, setQuantity] = useState(1);

  const [addingToCart, setAddingToCart] = useState(false);

  const [buyingNow, setBuyingNow] = useState(false);

  const [message, setMessage] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Wishlist
  |--------------------------------------------------------------------------
  */

  const [wishlist, setWishlist] = useState(false);

  const [wishlistItemId, setWishlistItemId] = useState<number | null>(null);

  const [wishlistLoading, setWishlistLoading] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Reviews
  |--------------------------------------------------------------------------
  */

  const [reviewRating, setReviewRating] = useState(0);

  const [reviewTitle, setReviewTitle] = useState("");

  const [reviewComment, setReviewComment] = useState("");

  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const [reviewMessage, setReviewMessage] = useState("");

  const [myReview, setMyReview] = useState<MyReview | null>(null);

  /*
  |--------------------------------------------------------------------------
  | Load Product
  |--------------------------------------------------------------------------
  */

  const loadProduct = useCallback(
    async (showLoader = true) => {
      if (!slug) {
        return;
      }

      try {
        if (showLoader) {
          setLoading(true);
        }

        setError("");

        const response = await storeApiFetch(
          `/store/products/${encodeURIComponent(slug)}`,
        );

        const json = await response.json();

        if (!response.ok) {
          throw new Error(json?.message || "Unable to load product.");
        }

        const loadedProduct: Product | null =
          json?.data || json?.product || null;

        if (!loadedProduct) {
          throw new Error("Product not found.");
        }

        setProduct(loadedProduct);

        /*
          |--------------------------------------------------------------------------
          | IMPORTANT
          |--------------------------------------------------------------------------
          |
          | Do NOT automatically select:
          |
          | Size
          | Color
          | Variant
          | Design
          |
          | This prevents Light Pink / first size appearing active.
          |
          */

        setSelectedVariant(null);

        setSelectedSizeId(null);

        setSelectedColorId(null);

        setSelectedDesignId(null);

        /*
          |--------------------------------------------------------------------------
          | Gallery Initial State
          |--------------------------------------------------------------------------
          */

        setSelectedImage(0);

        setGallerySelectionStarted(false);

        setQuantity(1);

        setMessage("");

        /*
          |--------------------------------------------------------------------------
          | My Review
          |--------------------------------------------------------------------------
          */

        if (json?.myReview) {
          setMyReview(json.myReview);
        } else if (json?.data?.myReview) {
          setMyReview(json.data.myReview);
        }
      } catch (err) {
        console.error("Product loading error:", err);

        setError(
          err instanceof Error ? err.message : "Unable to load product.",
        );
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    },
    [slug],
  );

  useEffect(() => {
    void loadProduct(true);
  }, [loadProduct]);

  /*
  |--------------------------------------------------------------------------
  | Wishlist Status
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!product?.id || typeof window === "undefined") {
      return;
    }

    const token = localStorage.getItem("customer_token");

    if (!token) {
      setWishlist(false);

      setWishlistItemId(null);

      return;
    }

    void checkWishlist(product.id)
      .then((data) => {
        setWishlist(Boolean(data.wishlisted));

        setWishlistItemId(
          data.wishlist_item_id ? Number(data.wishlist_item_id) : null,
        );
      })
      .catch(() => {
        /*
        | Wishlist check error should not
        | prevent product page rendering.
        */
      });
  }, [product?.id]);

  /*
  |--------------------------------------------------------------------------
  | Active Designs
  |--------------------------------------------------------------------------
  */

  const activeDesigns = useMemo(
    () =>
      (product?.design_options || [])
        .filter((design) => design.status !== "inactive")
        .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0)),
    [product],
  );

  /*
  |--------------------------------------------------------------------------
  | Selected Design
  |--------------------------------------------------------------------------
  */

  const selectedDesign = useMemo(
    () =>
      activeDesigns.find(
        (design) => Number(design.id) === Number(selectedDesignId),
      ) || null,
    [activeDesigns, selectedDesignId],
  );

  /*
  |--------------------------------------------------------------------------
  | Initial Fallback Variant
  |--------------------------------------------------------------------------
  |
  | This does NOT make the variant active.
  |
  | It is used only when:
  |
  | General images do not exist.
  |
  | Then we show images related to the first
  | available variant as a visual fallback.
  |
  */

  const initialFallbackVariant = useMemo(() => {
    if (!product) {
      return null;
    }

    const variants = product.variants || [];

    const inStock = variants.find((variant) => {
      if (variant.status !== "active") {
        return false;
      }

      const available =
        variant.inventory?.available_quantity ??
        Math.max(
          0,

          Number(variant.inventory?.quantity || 0) -
            Number(variant.inventory?.reserved_quantity || 0),
        );

      return available > 0;
    });

    if (inStock) {
      return inStock;
    }

    return (
      variants.find((variant) => variant.status === "active") ||
      variants[0] ||
      null
    );
  }, [product]);

  /*
  |--------------------------------------------------------------------------
  | Gallery Images
  |--------------------------------------------------------------------------
  |
  | PAGE OPEN:
  |
  | 1. General product images
  |
  | If General doesn't exist:
  |
  | 2. First available variant's color images
  | 3. Any product images
  | 4. Any design images
  |
  |--------------------------------------------------------------------------
  |
  | AFTER CUSTOMER SELECTION:
  |
  | 1. Selected Design + Selected Color
  | 2. Selected Color Product Images
  | 3. Selected Design General Images
  | 4. General Product Images
  | 5. Any Selected Design Images
  | 6. Any Product Images
  |
  */

  const galleryImages = useMemo<ProductImage[]>(() => {
    if (!product) {
      return [];
    }

    /*
      |--------------------------------------------------------------------------
      | Product Images
      |--------------------------------------------------------------------------
      */

    const productImages = Array.isArray(product.images) ? product.images : [];

    /*
      |--------------------------------------------------------------------------
      | Selected Design Images
      |--------------------------------------------------------------------------
      */

    const designImages = Array.isArray(selectedDesign?.images)
      ? selectedDesign.images
      : [];

    /*
      |--------------------------------------------------------------------------
      | General Images
      |--------------------------------------------------------------------------
      */

    const generalImages = (rows: ProductImage[]) =>
      rows.filter(
        (image) => image.color_id === null || image.color_id === undefined,
      );

    /*
      |--------------------------------------------------------------------------
      | Images For Color
      |--------------------------------------------------------------------------
      */

    const imagesForColor = (rows: ProductImage[], colorId: number | null) => {
      if (colorId === null) {
        return [];
      }

      return rows.filter(
        (image) =>
          image.color_id !== null &&
          image.color_id !== undefined &&
          Number(image.color_id) === Number(colorId),
      );
    };

    /*
      |--------------------------------------------------------------------------
      | General Groups
      |--------------------------------------------------------------------------
      */

    const productGeneral = sortImages(generalImages(productImages));

    const designGeneral = sortImages(generalImages(designImages));

    /*
      |--------------------------------------------------------------------------
      | Initial Page Load
      |--------------------------------------------------------------------------
      */

    if (!gallerySelectionStarted) {
      /*
        |--------------------------------------------------------------------------
        | 1. GENERAL PRODUCT IMAGES
        |--------------------------------------------------------------------------
        */

      if (productGeneral.length > 0) {
        return productGeneral;
      }

      /*
        |--------------------------------------------------------------------------
        | 2. FALLBACK VARIANT COLOR
        |--------------------------------------------------------------------------
        |
        | Example:
        |
        | No General image exists.
        |
        | First available variant:
        | Size 2.4 + Light Pink
        |
        | Show Light Pink images,
        | but DO NOT visually select Light Pink.
        |
        */

      const fallbackColorId = initialFallbackVariant?.color_id
        ? Number(initialFallbackVariant.color_id)
        : null;

      const fallbackColorImages = sortImages(
        imagesForColor(productImages, fallbackColorId),
      );

      if (fallbackColorImages.length > 0) {
        return fallbackColorImages;
      }

      /*
        |--------------------------------------------------------------------------
        | 3. ANY PRODUCT IMAGE
        |--------------------------------------------------------------------------
        */

      if (productImages.length > 0) {
        return sortImages(productImages);
      }

      /*
        |--------------------------------------------------------------------------
        | 4. ANY DESIGN IMAGE
        |--------------------------------------------------------------------------
        */

      const allDesignImages = activeDesigns.flatMap((design) =>
        Array.isArray(design.images) ? design.images : [],
      );

      return sortImages(allDesignImages);
    }

    /*
      |--------------------------------------------------------------------------
      | Customer Selection Mode
      |--------------------------------------------------------------------------
      */

    const selectedProductColor = sortImages(
      imagesForColor(productImages, selectedColorId),
    );

    const selectedDesignColor = sortImages(
      imagesForColor(designImages, selectedColorId),
    );

    /*
      |--------------------------------------------------------------------------
      | 1. DESIGN + COLOR
      |--------------------------------------------------------------------------
      */

    if (
      selectedDesign &&
      selectedColorId !== null &&
      selectedDesignColor.length > 0
    ) {
      return selectedDesignColor;
    }

    /*
      |--------------------------------------------------------------------------
      | 2. PRODUCT + COLOR
      |--------------------------------------------------------------------------
      */

    if (selectedColorId !== null && selectedProductColor.length > 0) {
      return selectedProductColor;
    }

    /*
      |--------------------------------------------------------------------------
      | 3. GENERAL DESIGN IMAGES
      |--------------------------------------------------------------------------
      */

    if (selectedDesign && designGeneral.length > 0) {
      return designGeneral;
    }

    /*
      |--------------------------------------------------------------------------
      | 4. GENERAL PRODUCT IMAGES
      |--------------------------------------------------------------------------
      */

    if (productGeneral.length > 0) {
      return productGeneral;
    }

    /*
      |--------------------------------------------------------------------------
      | 5. ANY SELECTED DESIGN IMAGE
      |--------------------------------------------------------------------------
      */

    if (selectedDesign && designImages.length > 0) {
      return sortImages(designImages);
    }

    /*
      |--------------------------------------------------------------------------
      | 6. ANY PRODUCT IMAGE
      |--------------------------------------------------------------------------
      */

    return sortImages(productImages);
  }, [
    product,
    activeDesigns,
    selectedDesign,
    selectedColorId,
    gallerySelectionStarted,
    initialFallbackVariant,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Reset Main Gallery Image
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    setSelectedImage(0);
  }, [selectedColorId, selectedDesignId, gallerySelectionStarted]);

  /*
  |--------------------------------------------------------------------------
  | Sizes
  |--------------------------------------------------------------------------
  */

  const sizes = useMemo<Size[]>(() => {
    if (!product) {
      return [];
    }

    const map = new Map<number, Size>();

    for (const variant of product.variants || []) {
      if (variant.size) {
        map.set(
          Number(variant.size.id),

          variant.size,
        );
      }
    }

    return Array.from(map.values());
  }, [product]);

  /*
  |--------------------------------------------------------------------------
  | Colors
  |--------------------------------------------------------------------------
  */

  const colors = useMemo<Color[]>(() => {
    if (!product) {
      return [];
    }

    const map = new Map<number, Color>();

    for (const variant of product.variants || []) {
      if (variant.color) {
        map.set(
          Number(variant.color.id),

          variant.color,
        );
      }
    }

    return Array.from(map.values());
  }, [product]);

  /*
  |--------------------------------------------------------------------------
  | Variant Stock
  |--------------------------------------------------------------------------
  */

  function variantStock(variant: Variant) {
    return (
      variant.inventory?.available_quantity ??
      Math.max(
        0,

        Number(variant.inventory?.quantity || 0) -
          Number(variant.inventory?.reserved_quantity || 0),
      )
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Size Has Stock
  |--------------------------------------------------------------------------
  */

  function sizeHasStock(sizeId: number) {
    if (!product) {
      return false;
    }

    return product.variants.some(
      (variant) =>
        variant.status === "active" &&
        Number(variant.size_id) === Number(sizeId) &&
        variantStock(variant) > 0,
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Color Has Stock
  |--------------------------------------------------------------------------
  */

  function colorHasStock(colorId: number) {
    if (!product) {
      return false;
    }

    return product.variants.some(
      (variant) =>
        variant.status === "active" &&
        Number(variant.color_id) === Number(colorId) &&
        variantStock(variant) > 0,
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Resolve Exact Variant
  |--------------------------------------------------------------------------
  |
  | Exact variant only exists when BOTH:
  |
  | Size
  | Color
  |
  | are selected.
  |
  */

  function findExactVariant(
    sizeId: number | null,

    colorId: number | null,
  ) {
    if (!product || sizeId === null || colorId === null) {
      return null;
    }

    return (
      product.variants.find(
        (variant) =>
          variant.status === "active" &&
          Number(variant.size_id) === Number(sizeId) &&
          Number(variant.color_id) === Number(colorId),
      ) || null
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Size Change
  |--------------------------------------------------------------------------
  |
  | Selecting size does NOT automatically
  | select a color.
  |
  */

  function onSizeChange(sizeId: number) {
    if (!product) {
      return;
    }

    setMessage("");

    setGallerySelectionStarted(true);

    setSelectedSizeId(sizeId);

    /*
    |--------------------------------------------------------------------------
    | Resolve only if color already selected
    |--------------------------------------------------------------------------
    */

    const variant = findExactVariant(sizeId, selectedColorId);

    setSelectedVariant(variant);

    setQuantity(1);

    /*
    |--------------------------------------------------------------------------
    | Invalid Existing Combination
    |--------------------------------------------------------------------------
    */

    if (selectedColorId !== null && !variant) {
      setMessage("This size is not available in the selected color.");
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Color Change
  |--------------------------------------------------------------------------
  |
  | Selecting color immediately changes gallery.
  |
  | But variant is only resolved when size is also selected.
  |
  */

  function onColorChange(colorId: number) {
    if (!product) {
      return;
    }

    setMessage("");

    setGallerySelectionStarted(true);

    /*
    |--------------------------------------------------------------------------
    | Change Gallery Color
    |--------------------------------------------------------------------------
    */

    setSelectedColorId(colorId);

    /*
    |--------------------------------------------------------------------------
    | Resolve Exact Variant If Size Selected
    |--------------------------------------------------------------------------
    */

    const variant = findExactVariant(selectedSizeId, colorId);

    setSelectedVariant(variant);

    setQuantity(1);

    /*
    |--------------------------------------------------------------------------
    | Invalid Combination
    |--------------------------------------------------------------------------
    */

    if (selectedSizeId !== null && !variant) {
      setMessage("This color is not available in the selected size.");
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Design Change
  |--------------------------------------------------------------------------
  */

  function onDesignChange(designId: number) {
    setMessage("");

    setGallerySelectionStarted(true);

    setSelectedDesignId(designId);

    setSelectedImage(0);
  }

  /*
  |--------------------------------------------------------------------------
  | Price
  |--------------------------------------------------------------------------
  |
  | Before Size + Color selection:
  |
  | Show base product price.
  |
  */

  const price = selectedVariant
    ? selectedVariant.selling_price
    : product?.selling_price || 0;

  const mrp = selectedVariant ? selectedVariant.mrp : product?.mrp || 0;

  const discount =
    Number(mrp) > 0
      ? Math.max(
          0,

          Math.round(((Number(mrp) - Number(price)) / Number(mrp)) * 100),
        )
      : 0;

  /*
  |--------------------------------------------------------------------------
  | Stock
  |--------------------------------------------------------------------------
  */

  const stock = selectedVariant ? variantStock(selectedVariant) : 0;

  const outOfStock = Boolean(selectedVariant && stock <= 0);

  /*
  |--------------------------------------------------------------------------
  | Require Customer Login
  |--------------------------------------------------------------------------
  */

  function requireLogin() {
    if (typeof window === "undefined") {
      return false;
    }

    const currentPath = window.location.pathname + window.location.search;

    return requireCustomerLogin(
      `/login?redirect=${encodeURIComponent(currentPath)}`,
    );
  }

  /*
|--------------------------------------------------------------------------
| Validate Current Selection
|--------------------------------------------------------------------------
*/

  function validateSelection() {
    if (!product) {
      return false;
    }

    if (selectedSizeId === null) {
      setMessage("Please select a size.");

      return false;
    }

    if (selectedColorId === null) {
      setMessage("Please select a color.");

      return false;
    }

    if (!selectedVariant) {
      setMessage("This size and color combination is not available.");

      return false;
    }

    if (activeDesigns.length > 0 && !selectedDesignId) {
      setMessage("Please select a design.");

      return false;
    }

    if (outOfStock) {
      setMessage("This product is currently out of stock.");

      return false;
    }

    if (quantity < 1 || quantity > stock) {
      setMessage(`Only ${stock} item(s) available.`);

      return false;
    }

    return true;
  }

  /*
|--------------------------------------------------------------------------
| ADD TO CART
|--------------------------------------------------------------------------
|
| Add To Cart:
|
| ✓ Adds to normal cart
| ✓ Updates cart count
| ✓ Stays on PDP
|
|--------------------------------------------------------------------------
*/

  async function addToCart() {
    if (!product || !validateSelection()) {
      return;
    }

    /*
  |--------------------------------------------------------------------------
  | Login
  |--------------------------------------------------------------------------
  */

    if (!requireLogin()) {
      return;
    }

    try {
      setAddingToCart(true);

      setMessage("");

      const cart = await addCartItem({
        product_variant_id: selectedVariant!.id,

        design_option_id: selectedDesignId,

        quantity,
      });

      setCartCount(Number(cart.item_count || 0));

      setMessage("Product added to bag successfully.");
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Unable to add product to cart.",
      );
    } finally {
      setAddingToCart(false);
    }
  }

  /*
|--------------------------------------------------------------------------
| BUY NOW
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| Buy Now does NOT call addCartItem().
|
| It stores a temporary checkout selection in sessionStorage.
|
| This does NOT modify customer's normal shopping cart.
|
|--------------------------------------------------------------------------
*/

  async function buyNow() {
    if (!product || !validateSelection()) {
      return;
    }

    /*
  |--------------------------------------------------------------------------
  | Login
  |--------------------------------------------------------------------------
  */

    if (!requireLogin()) {
      return;
    }

    try {
      setBuyingNow(true);

      setMessage("");

      /*
    |--------------------------------------------------------------------------
    | Temporary Buy Now Checkout Data
    |--------------------------------------------------------------------------
    |
    | Only IDs + quantity are important.
    |
    | Backend should still validate:
    |
    | product
    | variant
    | design
    | stock
    | price
    |
    | during checkout/order creation.
    |
    |--------------------------------------------------------------------------
    */

      const buyNowPayload = {
        product_id: product.id,

        product_variant_id: selectedVariant!.id,

        design_option_id: selectedDesignId,

        quantity,

        /*
      |--------------------------------------------------------------------------
      | Optional display information
      |--------------------------------------------------------------------------
      |
      | Checkout can use this while loading.
      |
      */

        product_name: product.name,

        product_slug: product.slug,

        size_id: selectedSizeId,

        color_id: selectedColorId,

        design_label: selectedDesign?.label || null,

        created_at: Date.now(),
      };

      /*
    |--------------------------------------------------------------------------
    | sessionStorage
    |--------------------------------------------------------------------------
    |
    | sessionStorage is better than localStorage here because Buy Now
    | is temporary checkout state.
    |
    |--------------------------------------------------------------------------
    */

      sessionStorage.setItem(
        "banglesmart_buy_now",
        JSON.stringify(buyNowPayload),
      );

      /*
    |--------------------------------------------------------------------------
    | Go Directly To Buy Now Checkout
    |--------------------------------------------------------------------------
    */

      router.push("/checkout?mode=buy-now");
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Unable to continue to checkout.",
      );

      setBuyingNow(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Wishlist
  |--------------------------------------------------------------------------
  */

  async function toggleWishlist() {
    if (!product || wishlistLoading) {
      return;
    }

    if (!requireLogin()) {
      return;
    }

    try {
      setWishlistLoading(true);

      /*
      |--------------------------------------------------------------------------
      | Remove Wishlist
      |--------------------------------------------------------------------------
      */

      if (wishlist && wishlistItemId) {
        const data = await removeWishlistItem(wishlistItemId);

        setWishlist(false);

        setWishlistItemId(null);

        setWishlistCount(Number(data.item_count || 0));

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | Add Wishlist
      |--------------------------------------------------------------------------
      */

      const data = await addWishlistItem(product.id);

      const check = await checkWishlist(product.id);

      setWishlist(Boolean(check.wishlisted));

      setWishlistItemId(
        check.wishlist_item_id ? Number(check.wishlist_item_id) : null,
      );

      setWishlistCount(Number(data.item_count || 0));
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Unable to update wishlist.",
      );
    } finally {
      setWishlistLoading(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Submit Review
  |--------------------------------------------------------------------------
  */

  async function submitReview() {
    if (!product) {
      return;
    }

    if (reviewRating < 1) {
      setReviewMessage("Please select a rating.");

      return;
    }

    if (!reviewTitle.trim()) {
      setReviewMessage("Please enter a review title.");

      return;
    }

    if (!reviewComment.trim()) {
      setReviewMessage("Please write a review.");

      return;
    }

    try {
      setReviewSubmitting(true);

      setReviewMessage("");

      const response = await customerApiFetch(
        `/customer/products/${product.id}/reviews`,
        {
          method: "POST",

          body: JSON.stringify({
            rating: reviewRating,

            title: reviewTitle.trim(),

            comment: reviewComment.trim(),
          }),
        },
      );

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.message || "Unable to submit review.");
      }

      setReviewRating(0);

      setReviewTitle("");

      setReviewComment("");

      setReviewMessage(
        json?.message ||
          "Review submitted successfully. It is pending approval.",
      );

      await loadProduct(false);
    } catch (err) {
      console.error("Review submission error:", err);

      setReviewMessage(
        err instanceof Error ? err.message : "Unable to submit review.",
      );
    } finally {
      setReviewSubmitting(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

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

  /*
  |--------------------------------------------------------------------------
  | Error
  |--------------------------------------------------------------------------
  */

  if (error || !product) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-10">
        <h1 className="font-[family-name:var(--font-playfair)] text-3xl text-gray-900">
          Product unavailable
        </h1>

        <p className="mt-3 text-sm text-gray-500">
          {error || "The requested product could not be found."}
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

  /*
  |--------------------------------------------------------------------------
  | Reviews
  |--------------------------------------------------------------------------
  */

  const approvedReviews = Array.isArray(product.reviews)
    ? product.reviews.filter((review) => review.status === "approved")
    : [];

  const reviewCount = approvedReviews.length;

  const reviewAverage =
    reviewCount > 0
      ? approvedReviews.reduce(
          (total, review) => total + Number(review.rating || 0),
          0,
        ) / reviewCount
      : 0;

  /*
  |--------------------------------------------------------------------------
  | Selected Color
  |--------------------------------------------------------------------------
  */

  const selectedColor =
    selectedColorId !== null
      ? colors.find((color) => Number(color.id) === Number(selectedColorId)) ||
        null
      : null;

  /*
  |--------------------------------------------------------------------------
  | Selected Size
  |--------------------------------------------------------------------------
  */

  const selectedSize =
    selectedSizeId !== null
      ? sizes.find((size) => Number(size.id) === Number(selectedSizeId)) || null
      : null;

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <main className="min-h-screen bg-white">
      {/* ================================================================
          BREADCRUMB
      ================================================================ */}

      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-10">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-sm text-gray-500 transition hover:text-gray-900"
        >
          <ArrowLeft size={16} />
          Back to Shop
        </Link>
      </div>

      {/* ================================================================
          PRODUCT
      ================================================================ */}

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* ============================================================
              GALLERY
          ============================================================ */}

          <div>
            <ProductGallery
              product={product}
              images={galleryImages}
              selectedImage={selectedImage}
              onImageChange={setSelectedImage}
            />
          </div>

          {/* ============================================================
              PRODUCT INFORMATION
          ============================================================ */}

          <div>
            {/* ----------------------------------------------------------
                CATEGORY
            ---------------------------------------------------------- */}

            {product.category && (
              <Link
                href={`/shop/${product.category.slug}`}
                className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#c9a227]"
              >
                {product.category.name}
              </Link>
            )}

            {/* ----------------------------------------------------------
                MATERIAL
            ---------------------------------------------------------- */}

            {product.material && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#faf7ef] px-3 py-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                  Material
                </span>

                <span className="text-xs font-semibold text-gray-800">
                  {product.material.name}
                </span>
              </div>
            )}

            {/* ----------------------------------------------------------
                NAME
            ---------------------------------------------------------- */}

            <h1 className="mt-3 font-[family-name:var(--font-playfair)] text-3xl leading-tight text-gray-900 sm:text-4xl">
              {product.name}
            </h1>

            {/* ----------------------------------------------------------
                BADGES
            ---------------------------------------------------------- */}

            <div className="mt-4">
              <ProductBadges product={product} />
            </div>

            {/* ----------------------------------------------------------
                RATING
            ---------------------------------------------------------- */}

            <div className="mt-4 flex items-center gap-3">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((item) => (
                  <Star
                    key={item}
                    size={16}
                    className={
                      item <= Math.round(reviewAverage)
                        ? "fill-[#c9a227] text-[#c9a227]"
                        : "text-gray-300"
                    }
                  />
                ))}
              </div>

              <span className="text-sm text-gray-500">
                {reviewAverage.toFixed(1)}
              </span>

              <span className="text-sm text-gray-400">
                ({reviewCount} reviews)
              </span>
            </div>

            {/* ----------------------------------------------------------
                DESCRIPTION
            ---------------------------------------------------------- */}

            {product.short_description && (
              <p className="mt-5 text-sm leading-7 text-gray-600">
                {product.short_description}
              </p>
            )}

            {/* ----------------------------------------------------------
                PRICE
            ---------------------------------------------------------- */}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="text-3xl font-semibold text-gray-900">
                {money(price)}
              </span>

              {Number(mrp) > Number(price) && (
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

            {/* ----------------------------------------------------------
                WISHLIST
            ---------------------------------------------------------- */}

            <button
              type="button"
              onClick={() => void toggleWishlist()}
              disabled={wishlistLoading}
              className="mt-5 inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:border-gray-500 disabled:opacity-50"
            >
              <Heart
                size={17}
                className={wishlist ? "fill-[#8f0828] text-[#8f0828]" : ""}
              />

              {wishlist ? "Added to Wishlist" : "Add to Wishlist"}
            </button>

            <div className="my-7 border-t border-gray-200" />

            {/* ============================================================
                DESIGN
            ============================================================ */}

            {activeDesigns.length > 0 && (
              <div className="mb-7">
                <DesignSelector
                  designs={activeDesigns}
                  selectedDesignId={selectedDesignId}
                  selectedColorId={selectedColorId}
                  onChange={onDesignChange}
                />
              </div>
            )}

            {/* ============================================================
                VARIANTS
            ============================================================ */}

            <ProductVariants
              product={product}
              sizes={sizes}
              colors={colors}
              selectedSizeId={selectedSizeId}
              selectedColorId={selectedColorId}
              selectedVariant={selectedVariant}
              sizeHasStock={sizeHasStock}
              colorHasStock={colorHasStock}
              onSizeChange={onSizeChange}
              onColorChange={onColorChange}
            />

            {/* ============================================================
                CURRENT SELECTION
            ============================================================ */}

            {(selectedSize || selectedColor || selectedDesign) && (
              <div className="mt-4 rounded-xl bg-[#faf8f5] px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-gray-400">
                  Your selection
                </p>

                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                  {selectedSize && (
                    <div>
                      <span className="text-gray-500">Size: </span>

                      <strong className="font-semibold text-gray-900">
                        {selectedSize.display_name || selectedSize.name}
                      </strong>
                    </div>
                  )}

                  {selectedColor && (
                    <div>
                      <span className="text-gray-500">Color: </span>

                      <strong className="font-semibold text-gray-900">
                        {selectedColor.display_name || selectedColor.name}
                      </strong>
                    </div>
                  )}

                  {selectedDesign && (
                    <div>
                      <span className="text-gray-500">Design: </span>

                      <strong className="font-semibold text-gray-900">
                        {selectedDesign.label || `Design ${selectedDesign.id}`}
                      </strong>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ============================================================
                STOCK
            ============================================================ */}

            <div className="mt-5">
              {selectedSizeId === null || selectedColorId === null ? (
                <p className="text-sm text-gray-500">
                  Please select size and color.
                </p>
              ) : !selectedVariant ? (
                <p className="text-sm font-medium text-red-600">
                  This size and color combination is unavailable.
                </p>
              ) : outOfStock ? (
                <p className="text-sm font-medium text-red-600">Out of Stock</p>
              ) : (
                <p className="text-sm font-medium text-green-700">
                  {stock <= 5 ? `Only ${stock} left in stock` : "In Stock"}
                </p>
              )}
            </div>

            {/* ============================================================
                QUANTITY + ACTIONS
            ============================================================ */}

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[auto_1fr_1fr]">
              {/* --------------------------------------------------------
                  QUANTITY
              -------------------------------------------------------- */}

              <div className="flex h-12 items-center rounded-lg border border-gray-300">
                <button
                  type="button"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                  className="flex h-full w-10 items-center justify-center text-gray-500 disabled:opacity-40"
                >
                  <Minus size={15} />
                </button>

                <span className="w-8 text-center text-sm font-medium">
                  {quantity}
                </span>

                <button
                  type="button"
                  disabled={!selectedVariant || outOfStock || quantity >= stock}
                  onClick={() =>
                    setQuantity((value) => Math.min(stock, value + 1))
                  }
                  className="flex h-full w-10 items-center justify-center text-gray-500 disabled:opacity-40"
                >
                  <Plus size={15} />
                </button>
              </div>

              {/* --------------------------------------------------------
                  ADD TO CART
              -------------------------------------------------------- */}

              <button
                type="button"
                disabled={addingToCart || buyingNow || outOfStock}
                onClick={() => void addToCart()}
                className="flex h-12 items-center justify-center gap-2 rounded-lg border border-[#111827] px-5 text-sm font-semibold text-[#111827] transition hover:bg-[#111827] hover:text-white disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
              >
                <ShoppingBag size={18} />

                {addingToCart
                  ? "Adding..."
                  : outOfStock
                    ? "Out of Stock"
                    : "Add to Cart"}
              </button>

              {/* --------------------------------------------------------
                  BUY NOW
              -------------------------------------------------------- */}

              <button
                type="button"
                disabled={buyingNow || addingToCart || outOfStock}
                onClick={() => void buyNow()}
                className="flex h-12 items-center justify-center gap-2 rounded-lg bg-[#8f0828] px-5 text-sm font-semibold text-white transition hover:bg-[#72061f] disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {buyingNow
                  ? "Opening Checkout..."
                  : outOfStock
                    ? "Out of Stock"
                    : "Buy Now"}
              </button>
            </div>

            {/* ----------------------------------------------------------
                MESSAGE
            ---------------------------------------------------------- */}

            {message && (
              <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                {message}
              </div>
            )}

            {/* ----------------------------------------------------------
                SKU
            ---------------------------------------------------------- */}

            {selectedVariant?.sku && (
              <p className="mt-5 text-xs text-gray-400">
                SKU: {selectedVariant.sku}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ================================================================
          DESCRIPTION
      ================================================================ */}

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <ProductDescription product={product} />
      </section>

      {/* ================================================================
          REVIEWS
      ================================================================ */}

      <ProductReviews
        reviews={(product.reviews || []) as ProductReview[]}
        myReview={myReview}
        reviewRating={reviewRating}
        reviewTitle={reviewTitle}
        reviewComment={reviewComment}
        reviewSubmitting={reviewSubmitting}
        reviewMessage={reviewMessage}
        onRatingChange={setReviewRating}
        onTitleChange={setReviewTitle}
        onCommentChange={setReviewComment}
        onSubmit={submitReview}
      />

      {/* ================================================================
          RECOMMENDED PRODUCTS
      ================================================================ */}

      <RecommendedProducts
        currentProductId={product.id}
        initialProducts={product.recommended || []}
        categorySlug={product.category?.slug || null}
      />
    </main>
  );
}
