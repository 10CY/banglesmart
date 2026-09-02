"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  ArrowLeft,
  ImagePlus,
  Save,
  Star,
  Trash2,
} from "lucide-react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import ProductVariants from "@/components/admin/products/ProductVariants";

import {
  apiFetch,
  BACKEND_URL,
} from "@/lib/api";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type Category = {
  id: number;
  name: string;
  status: string;
};

type ProductImage = {
  id: number;
  product_id: number;
  image: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean | number;
  url?: string;
};

type Product = {
  id: number;
  name: string;
  category_id: number | null;
  sku: string | null;
  short_description: string | null;
  description: string | null;
  mrp: number | string | null;
  selling_price: number | string | null;
  set_quantity: number | string | null;
  status: string;
  featured: boolean | number | string;
  best_seller: boolean | number | string;
  new_arrival: boolean | number | string;
  seo_title: string | null;
  seo_description: string | null;
  images?: ProductImage[];
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function toBoolean(value: unknown): boolean {
  return (
    value === true ||
    value === 1 ||
    value === "1" ||
    value === "true"
  );
}

function getImageUrl(image: ProductImage) {
  if (image.url) {
    return image.url;
  }

  if (!image.image) {
    return "";
  }

  if (
    image.image.startsWith("http://") ||
    image.image.startsWith("https://")
  ) {
    return image.image;
  }

  return `${BACKEND_URL}/storage/${image.image}`;
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();

  const productId = String(params.id);

  /* ------------------------------------------------------------------------ */
  /* Product State                                                             */
  /* ------------------------------------------------------------------------ */

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [name, setName] =
    useState("");

  const [categoryId, setCategoryId] =
    useState("");

  const [sku, setSku] =
    useState("");

  const [shortDescription, setShortDescription] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [mrp, setMrp] =
    useState("");

  const [sellingPrice, setSellingPrice] =
    useState("");

  const [setQuantity, setSetQuantity] =
    useState("1");

  const [status, setStatus] =
    useState("active");

  const [featured, setFeatured] =
    useState(false);

  const [bestSeller, setBestSeller] =
    useState(false);

  const [newArrival, setNewArrival] =
    useState(false);

  const [seoTitle, setSeoTitle] =
    useState("");

  const [seoDescription, setSeoDescription] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  /* ------------------------------------------------------------------------ */
  /* Image State                                                               */
  /* ------------------------------------------------------------------------ */

  const [images, setImages] =
    useState<ProductImage[]>([]);

  const [uploadingImages, setUploadingImages] =
    useState(false);

  const [imageError, setImageError] =
    useState("");

  /* ------------------------------------------------------------------------ */
  /* Load Product + Categories                                                 */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [
          productResponse,
          categoryResponse,
        ] = await Promise.all([
          apiFetch(
            `/admin/products/${productId}`
          ),

          apiFetch(
            "/admin/categories"
          ),
        ]);

        const productData =
          await productResponse.json();

        const categoryData =
          await categoryResponse.json();

        if (cancelled) {
          return;
        }

        if (!productResponse.ok) {
          setError(
            productData?.message ||
              "Unable to load product."
          );

          return;
        }

        const product =
          productData?.data as Product;

        if (!product) {
          setError(
            "Product data not found."
          );

          return;
        }

        /* ------------------------------------------------------------------ */
        /* Product                                                             */
        /* ------------------------------------------------------------------ */

        setName(
          product.name || ""
        );

        setCategoryId(
          product.category_id !== null &&
          product.category_id !== undefined
            ? String(
                product.category_id
              )
            : ""
        );

        setSku(
          product.sku || ""
        );

        setShortDescription(
          product.short_description || ""
        );

        setDescription(
          product.description || ""
        );

        setMrp(
          String(
            product.mrp ?? ""
          )
        );

        setSellingPrice(
          String(
            product.selling_price ?? ""
          )
        );

        setSetQuantity(
          String(
            product.set_quantity ?? 1
          )
        );

        setStatus(
          product.status || "active"
        );

        /*
         * IMPORTANT:
         * Do not use Boolean("0").
         * Boolean("0") === true.
         */
        setFeatured(
          toBoolean(
            product.featured
          )
        );

        setBestSeller(
          toBoolean(
            product.best_seller
          )
        );

        setNewArrival(
          toBoolean(
            product.new_arrival
          )
        );

        setSeoTitle(
          product.seo_title || ""
        );

        setSeoDescription(
          product.seo_description || ""
        );

        setImages(
          Array.isArray(
            product.images
          )
            ? product.images
            : []
        );

        /* ------------------------------------------------------------------ */
        /* Categories                                                          */
        /* ------------------------------------------------------------------ */

        if (
          categoryResponse.ok
        ) {
          const categoryRows =
            Array.isArray(
              categoryData?.data
            )
              ? categoryData.data
              : [];

          setCategories(
            categoryRows.filter(
              (
                category: Category
              ) =>
                category.status ===
                "active"
            )
          );
        }
      } catch (err) {
        console.error(
          "Load product error:",
          err
        );

        if (!cancelled) {
          setError(
            "Unable to connect to server."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (productId) {
      loadData();
    }

    return () => {
      cancelled = true;
    };
  }, [productId]);

  /* ------------------------------------------------------------------------ */
  /* Reload Product                                                           */
  /* ------------------------------------------------------------------------ */

  async function reloadProduct() {
  try {
    const response =
      await apiFetch(
        `/admin/products/${productId}`
      );

    const data =
      await response.json();

    if (!response.ok) {
      console.error(
        data?.message ||
          "Unable to reload product."
      );

      return;
    }

    const product =
      data?.data;

    if (!product) {
      return;
    }

    setName(
      product.name || ""
    );

    setCategoryId(
      product.category_id !== null &&
      product.category_id !== undefined
        ? String(
            product.category_id
          )
        : ""
    );

    setSku(
      product.sku || ""
    );

    setShortDescription(
      product.short_description ||
        ""
    );

    setDescription(
      product.description ||
        ""
    );

    setMrp(
      String(
        product.mrp ?? ""
      )
    );

    setSellingPrice(
      String(
        product.selling_price ??
          ""
      )
    );

    setSetQuantity(
      String(
        product.set_quantity ??
          1
      )
    );

    setStatus(
      product.status ||
        "active"
    );

    setFeatured(
      toBoolean(
        product.featured
      )
    );

    setBestSeller(
      toBoolean(
        product.best_seller
      )
    );

    setNewArrival(
      toBoolean(
        product.new_arrival
      )
    );

    setSeoTitle(
      product.seo_title ||
        ""
    );

    setSeoDescription(
      product.seo_description ||
        ""
    );

    setImages(
      Array.isArray(
        product.images
      )
        ? product.images
        : []
    );
  } catch (error) {
    console.error(
      "Unable to reload product:",
      error
    );
  }
}

  /* ------------------------------------------------------------------------ */
  /* Upload Images                                                             */
  /* ------------------------------------------------------------------------ */

  async function handleImageUpload(
  event: ChangeEvent<HTMLInputElement>
) {
  const selectedFiles =
    event.target.files;

  if (
    !selectedFiles ||
    selectedFiles.length === 0
  ) {
    return;
  }

  setUploadingImages(true);
  setImageError("");

  try {
    const files =
      Array.from(
        selectedFiles
      );

    /*
    |--------------------------------------------------------------------------
    | Upload files individually
    |--------------------------------------------------------------------------
    |
    | Backend expects:
    |
    | req.file
    |
    | Therefore:
    |
    | image
    |
    | NOT:
    |
    | images[]
    |
    |--------------------------------------------------------------------------
    */

    for (
      let index = 0;
      index < files.length;
      index++
    ) {
      const file =
        files[index];

      const formData =
        new FormData();

      /*
      |--------------------------------------------------------------------------
      | THIS IS THE IMPORTANT FIX
      |--------------------------------------------------------------------------
      */

      formData.append(
        "image",
        file
      );

      /*
      |--------------------------------------------------------------------------
      | Alt text
      |--------------------------------------------------------------------------
      */

      formData.append(
        "alt_text",
        name.trim() ||
          "Product image"
      );

      /*
      |--------------------------------------------------------------------------
      | Sort order
      |--------------------------------------------------------------------------
      */

      formData.append(
        "sort_order",
        String(
          images.length +
            index
        )
      );

      /*
      |--------------------------------------------------------------------------
      | Primary image
      |--------------------------------------------------------------------------
      */

      if (
        images.length === 0 &&
        index === 0
      ) {
        formData.append(
          "is_primary",
          "1"
        );
      } else {
        formData.append(
          "is_primary",
          "0"
        );
      }

      const response =
        await apiFetch(
          `/admin/products/${productId}/images`,
          {
            method: "POST",
            body: formData,
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        const validationErrors =
          data?.errors as
            | Record<
                string,
                string[]
              >
            | undefined;

        const firstError =
          validationErrors
            ? Object.values(
                validationErrors
              )[0]?.[0]
            : undefined;

        throw new Error(
          firstError ||
            data?.message ||
            `Unable to upload ${file.name}.`
        );
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Refresh images
    |--------------------------------------------------------------------------
    */

    await reloadProduct();
  } catch (error) {
    console.error(
      "Image upload error:",
      error
    );

    setImageError(
      error instanceof Error
        ? error.message
        : "Unable to upload image."
    );
  } finally {
    setUploadingImages(false);

    /*
    |--------------------------------------------------------------------------
    | Allows selecting same file again
    |--------------------------------------------------------------------------
    */

    event.target.value = "";
  }
}

  /* ------------------------------------------------------------------------ */
  /* Delete Image                                                              */
  /* ------------------------------------------------------------------------ */

  async function deleteImage(
    imageId: number
  ) {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this image?"
      );

    if (!confirmed) {
      return;
    }

    try {
      const response =
        await apiFetch(
          `/admin/product-images/${imageId}`,
          {
            method: "DELETE",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        window.alert(
          data?.message ||
            "Unable to delete image."
        );

        return;
      }

      await reloadProduct();
    } catch (err) {
      console.error(
        "Delete image error:",
        err
      );

      window.alert(
        "Unable to connect to server."
      );
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Set Primary Image                                                        */
  /* ------------------------------------------------------------------------ */

  async function setPrimaryImage(
    imageId: number
  ) {
    try {
      const response =
        await apiFetch(
          `/admin/product-images/${imageId}/primary`,
          {
            method: "PUT",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        window.alert(
          data?.message ||
            "Unable to set primary image."
        );

        return;
      }

      await reloadProduct();
    } catch (err) {
      console.error(
        "Primary image error:",
        err
      );

      window.alert(
        "Unable to connect to server."
      );
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Update Product                                                            */
  /* ------------------------------------------------------------------------ */

  async function handleSubmit(
  event: FormEvent<HTMLFormElement>
) {
  event.preventDefault();

  setSaving(true);
  setError("");

  try {
    const payload = {
      name:
        name.trim(),

      category_id:
        categoryId
          ? Number(categoryId)
          : null,

      sku:
        sku.trim()
          ? sku.trim()
          : null,

      short_description:
        shortDescription.trim()
          ? shortDescription.trim()
          : null,

      description:
        description.trim()
          ? description.trim()
          : null,

      mrp:
        mrp !== ""
          ? Number(mrp)
          : 0,

      selling_price:
        sellingPrice !== ""
          ? Number(sellingPrice)
          : 0,

      set_quantity:
        setQuantity !== ""
          ? Number(
              setQuantity
            )
          : 1,

      status:
        status || "active",

      featured:
        Boolean(featured),

      best_seller:
        Boolean(bestSeller),

      new_arrival:
        Boolean(newArrival),

      seo_title:
        seoTitle.trim()
          ? seoTitle.trim()
          : null,

      seo_description:
        seoDescription.trim()
          ? seoDescription.trim()
          : null,
    };

    const response =
      await apiFetch(
        `/admin/products/${productId}`,
        {
          method: "PUT",

          body:
            JSON.stringify(
              payload
            ),
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      const validationErrors =
        data?.errors as
          | Record<
              string,
              string[]
            >
          | undefined;

      const firstError =
        validationErrors
          ? Object.values(
              validationErrors
            )[0]?.[0]
          : undefined;

      setError(
        firstError ||
          data?.message ||
          "Unable to update product."
      );

      return;
    }

    await reloadProduct();

    window.alert(
      "Product updated successfully."
    );
  } catch (error) {
    console.error(
      "Update product error:",
      error
    );

    setError(
      "Unable to connect to server."
    );
  } finally {
    setSaving(false);
  }
}

  /* ------------------------------------------------------------------------ */
  /* Loading                                                                   */
  /* ------------------------------------------------------------------------ */

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-gray-500">
          Loading product...
        </p>
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Render                                                                    */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="pb-10">

      {/* ==================================================================== */}
      {/* HEADER                                                               */}
      {/* ==================================================================== */}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">

        <div className="flex items-center gap-4">

          <Link
            href="/admin/products"
            className="rounded-lg border border-gray-200 bg-white p-2 text-gray-700 transition hover:bg-gray-100"
          >
            <ArrowLeft
              size={19}
            />
          </Link>

          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Edit Product
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Update product information,
              images, variants and inventory.
            </p>
          </div>

        </div>

        <button
          type="submit"
          form="edit-product-form"
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save
            size={18}
          />

          {saving
            ? "Updating..."
            : "Update product"}
        </button>

      </div>

      {/* ==================================================================== */}
      {/* ERROR                                                                */}
      {/* ==================================================================== */}

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ==================================================================== */}
      {/* PRODUCT FORM                                                         */}
      {/* ==================================================================== */}

      <form
        id="edit-product-form"
        onSubmit={handleSubmit}
      >

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">

          {/* ================================================================= */}
          {/* LEFT COLUMN                                                       */}
          {/* ================================================================= */}

          <div className="space-y-6">

            {/* ---------------------------------------------------------------- */}
            {/* PRODUCT INFORMATION                                              */}
            {/* ---------------------------------------------------------------- */}

            <section className="rounded-xl border border-gray-200 bg-white p-6">

              <h2 className="font-semibold text-gray-900">
                Product Information
              </h2>

              <div className="mt-5 space-y-5">

                {/* Product Name */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Product Name *
                  </label>

                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(event) =>
                      setName(
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-gray-600"
                  />

                </div>

                {/* Short Description */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Short Description
                  </label>

                  <textarea
                    rows={3}
                    value={
                      shortDescription
                    }
                    onChange={(event) =>
                      setShortDescription(
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-gray-600"
                  />

                </div>

                {/* Description */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Description
                  </label>

                  <textarea
                    rows={7}
                    value={
                      description
                    }
                    onChange={(event) =>
                      setDescription(
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-gray-600"
                  />

                </div>

              </div>

            </section>

            {/* ---------------------------------------------------------------- */}
            {/* PRODUCT IMAGES                                                    */}
            {/* ---------------------------------------------------------------- */}

            <section className="rounded-xl border border-gray-200 bg-white p-6">

              <div className="flex flex-wrap items-center justify-between gap-4">

                <div>

                  <h2 className="font-semibold text-gray-900">
                    Product Images
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Upload JPG, PNG or WebP
                    product images.
                  </p>

                </div>

                <label
                  className={`flex cursor-pointer items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-black ${
                    uploadingImages
                      ? "pointer-events-none opacity-50"
                      : ""
                  }`}
                >

                  <ImagePlus
                    size={18}
                  />

                  {uploadingImages
                    ? "Uploading..."
                    : "Upload Images"}

                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    onChange={
                      handleImageUpload
                    }
                    disabled={
                      uploadingImages
                    }
                    className="hidden"
                  />

                </label>

              </div>

              {imageError && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {imageError}
                </div>
              )}

              {/* No Images */}

              {images.length === 0 ? (

                <div className="mt-6 flex min-h-52 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50">

                  <div className="text-center">

                    <ImagePlus
                      size={35}
                      className="mx-auto text-gray-300"
                    />

                    <p className="mt-3 text-sm font-medium text-gray-700">
                      No product images
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Upload one or more
                      product images.
                    </p>

                  </div>

                </div>

              ) : (

                <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">

                  {images.map(
                    (image) => {

                      const imageSrc =
                        getImageUrl(
                          image
                        );

                      const primary =
                        image.is_primary === true ||
                        Number(image.is_primary) === 1;

                      return (
                        <div
                          key={
                            image.id
                          }
                          className="overflow-hidden rounded-xl border border-gray-200 bg-white"
                        >

                          {/* Image */}

                          <div className="relative aspect-square overflow-hidden bg-gray-100">

                            {imageSrc ? (
                              <img
                                src={
                                  imageSrc
                                }
                                alt={
                                  image.alt_text ||
                                  name ||
                                  "Product image"
                                }
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-xs text-gray-400">
                                Image unavailable
                              </div>
                            )}

                            {primary && (
                              <span className="absolute left-2 top-2 rounded-full bg-gray-900 px-2.5 py-1 text-xs font-medium text-white">
                                Primary
                              </span>
                            )}

                          </div>

                          {/* Actions */}

                          <div className="space-y-2 p-3">

                            {!primary && (
                              <button
                                type="button"
                                onClick={() =>
                                  setPrimaryImage(
                                    image.id
                                  )
                                }
                                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                              >
                                <Star
                                  size={14}
                                />

                                Set Primary
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                deleteImage(
                                  image.id
                                )
                              }
                              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50"
                            >
                              <Trash2
                                size={14}
                              />

                              Delete
                            </button>

                          </div>

                        </div>
                      );
                    }
                  )}

                </div>

              )}

            </section>

            {/* ---------------------------------------------------------------- */}
            {/* PRICING                                                          */}
            {/* ---------------------------------------------------------------- */}

            <section className="rounded-xl border border-gray-200 bg-white p-6">

              <h2 className="font-semibold text-gray-900">
                Base Pricing
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Default product price.
                Individual variants can have
                their own price.
              </p>

              <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">

                {/* MRP */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    MRP *
                  </label>

                  <div className="relative">

                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                      ₹
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={mrp}
                      onChange={(event) =>
                        setMrp(
                          event.target.value
                        )
                      }
                      className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-gray-600"
                    />

                  </div>

                </div>

                {/* Selling Price */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Selling Price *
                  </label>

                  <div className="relative">

                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                      ₹
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={
                        sellingPrice
                      }
                      onChange={(event) =>
                        setSellingPrice(
                          event.target.value
                        )
                      }
                      className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-gray-600"
                    />

                  </div>

                </div>

              </div>

            </section>

            {/* ---------------------------------------------------------------- */}
            {/* PRODUCT DETAILS                                                  */}
            {/* ---------------------------------------------------------------- */}

            <section className="rounded-xl border border-gray-200 bg-white p-6">

              <h2 className="font-semibold text-gray-900">
                Product Details
              </h2>

              <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Base SKU
                  </label>

                  <input
                    type="text"
                    value={sku}
                    onChange={(event) =>
                      setSku(
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-gray-600"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Set Quantity
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={
                      setQuantity
                    }
                    onChange={(event) =>
                      setSetQuantity(
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-gray-600"
                  />

                </div>

              </div>

            </section>

            {/* ---------------------------------------------------------------- */}
            {/* SEO                                                              */}
            {/* ---------------------------------------------------------------- */}

            <section className="rounded-xl border border-gray-200 bg-white p-6">

              <h2 className="font-semibold text-gray-900">
                Search Engine Listing
              </h2>

              <div className="mt-5 space-y-5">

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    SEO Title
                  </label>

                  <input
                    type="text"
                    value={
                      seoTitle
                    }
                    onChange={(event) =>
                      setSeoTitle(
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-gray-600"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    SEO Description
                  </label>

                  <textarea
                    rows={4}
                    value={
                      seoDescription
                    }
                    onChange={(event) =>
                      setSeoDescription(
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-gray-600"
                  />

                </div>

              </div>

            </section>

          </div>

          {/* ================================================================= */}
          {/* RIGHT COLUMN                                                      */}
          {/* ================================================================= */}

          <div className="space-y-6">

            {/* ---------------------------------------------------------------- */}
            {/* STATUS                                                           */}
            {/* ---------------------------------------------------------------- */}

            <section className="rounded-xl border border-gray-200 bg-white p-5">

              <h2 className="font-semibold text-gray-900">
                Status
              </h2>

              <select
                value={
                  status
                }
                onChange={(event) =>
                  setStatus(
                    event.target.value
                  )
                }
                className="mt-4 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-gray-600"
              >

                <option value="active">
                  Active
                </option>

                <option value="inactive">
                  Inactive
                </option>

              </select>

            </section>

            {/* ---------------------------------------------------------------- */}
            {/* CATEGORY                                                         */}
            {/* ---------------------------------------------------------------- */}

            <section className="rounded-xl border border-gray-200 bg-white p-5">

              <h2 className="font-semibold text-gray-900">
                Category
              </h2>

              <select
                value={
                  categoryId
                }
                onChange={(event) =>
                  setCategoryId(
                    event.target.value
                  )
                }
                className="mt-4 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-gray-600"
              >

                <option value="">
                  Select category
                </option>

                {categories.map(
                  (
                    category
                  ) => (
                    <option
                      key={
                        category.id
                      }
                      value={
                        category.id
                      }
                    >
                      {
                        category.name
                      }
                    </option>
                  )
                )}

              </select>

            </section>

            {/* ---------------------------------------------------------------- */}
            {/* PRODUCT LABELS                                                   */}
            {/* ---------------------------------------------------------------- */}

            <section className="rounded-xl border border-gray-200 bg-white p-5">

              <h2 className="font-semibold text-gray-900">
                Product Labels
              </h2>

              <div className="mt-4 space-y-4">

                {/* Featured */}

                <label className="flex cursor-pointer items-center gap-3">

                  <input
                    type="checkbox"
                    checked={
                      featured
                    }
                    onChange={(event) =>
                      setFeatured(
                        event.target.checked
                      )
                    }
                    className="h-4 w-4"
                  />

                  <span className="text-sm text-gray-700">
                    Featured Product
                  </span>

                </label>

                {/* Best Seller */}

                <label className="flex cursor-pointer items-center gap-3">

                  <input
                    type="checkbox"
                    checked={
                      bestSeller
                    }
                    onChange={(event) =>
                      setBestSeller(
                        event.target.checked
                      )
                    }
                    className="h-4 w-4"
                  />

                  <span className="text-sm text-gray-700">
                    Best Seller
                  </span>

                </label>

                {/* New Arrival */}

                <label className="flex cursor-pointer items-center gap-3">

                  <input
                    type="checkbox"
                    checked={
                      newArrival
                    }
                    onChange={(event) =>
                      setNewArrival(
                        event.target.checked
                      )
                    }
                    className="h-4 w-4"
                  />

                  <span className="text-sm text-gray-700">
                    New Arrival
                  </span>

                </label>

              </div>

            </section>

            {/* ---------------------------------------------------------------- */}
            {/* MEDIA                                                            */}
            {/* ---------------------------------------------------------------- */}

            <section className="rounded-xl border border-gray-200 bg-white p-5">

              <h2 className="font-semibold text-gray-900">
                Media
              </h2>

              <div className="mt-4">

                <p className="text-3xl font-semibold text-gray-900">
                  {images.length}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Product images uploaded
                </p>

              </div>

            </section>

          </div>

        </div>

        {/* ==================================================================== */}
        {/* PRODUCT SAVE ACTIONS                                                 */}
        {/* ==================================================================== */}

        <div className="mt-6 flex justify-end gap-3">

          <Link
            href="/admin/products"
            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
          >

            <Save
              size={18}
            />

            {saving
              ? "Updating..."
              : "Update product"}

          </button>

        </div>

      </form>

      {/* ==================================================================== */}
      {/* VARIANTS                                                             */}
      {/* ==================================================================== */}

      <div className="mt-6">

        <ProductVariants
          productId={
            productId
          }
        />

      </div>

    </div>
  );
}