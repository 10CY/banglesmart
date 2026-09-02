"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import { apiFetch } from "@/lib/api";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type Size = {
  id: number;
  name: string;
  display_name: string | null;
  status: string;
};

type Color = {
  id: number;
  name: string;
  display_name: string | null;
  hex_code: string | null;
  status: string;
};

type Inventory = {
  id?: number;
  product_variant_id?: number;

  quantity: number;
  reserved_quantity: number;
  low_stock_limit: number;

  available_quantity?: number;
};

type Variant = {
  id: number;
  product_id: number;

  size_id: number;
  color_id: number;

  sku: string;

  mrp: string;
  selling_price: string;

  status: string;

  size: Size | null;
  color: Color | null;

  inventory: Inventory | null;
};

type Props = {
  productId: string;
};

/* -------------------------------------------------------------------------- */
/* API Variant Type                                                           */
/* -------------------------------------------------------------------------- */

/*
 * Backend may return variant information in either format:
 *
 * 1. Nested:
 *
 * size: {...}
 * color: {...}
 * inventory: {...}
 *
 * 2. Flat:
 *
 * size_name
 * size_display_name
 * color_name
 * color_display_name
 * color_hex_code
 * quantity
 * reserved_quantity
 * low_stock_limit
 * available_quantity
 *
 * This type supports both.
 */

type ApiVariant = {
  id: number;
  product_id: number;

  size_id: number;
  color_id: number;

  sku: string;

  mrp: string | number | null;
  selling_price: string | number | null;

  status: string;

  size?: Size | null;
  color?: Color | null;

  inventory?: Inventory | null;

  /* Flat size fields */
  size_name?: string | null;
  size_display_name?: string | null;

  /* Flat color fields */
  color_name?: string | null;
  color_display_name?: string | null;
  color_hex_code?: string | null;

  /* Flat inventory fields */
  quantity?: number | string | null;
  reserved_quantity?: number | string | null;
  low_stock_limit?: number | string | null;
  available_quantity?: number | string | null;
};

/* -------------------------------------------------------------------------- */
/* Normalize Variant                                                          */
/* -------------------------------------------------------------------------- */

function normalizeVariant(
  variant: ApiVariant
): Variant {

  /*
   * ------------------------------------------------------------------------
   * INVENTORY
   * ------------------------------------------------------------------------
   */

  const quantity = Math.max(
    0,
    Number(
      variant.quantity ??
        variant.inventory?.quantity ??
        0
    )
  );

  const reservedQuantity = Math.max(
    0,
    Number(
      variant.reserved_quantity ??
        variant.inventory?.reserved_quantity ??
        0
    )
  );

  const lowStockLimit = Math.max(
    0,
    Number(
      variant.low_stock_limit ??
        variant.inventory?.low_stock_limit ??
        5
    )
  );

  const availableQuantity = Math.max(
    0,
    Number(
      variant.available_quantity ??
        (
          quantity -
          reservedQuantity
        )
    )
  );

  const inventory: Inventory = {
    id:
      variant.inventory?.id,

    product_variant_id:
      variant.inventory
        ?.product_variant_id ??
      variant.id,

    quantity,

    reserved_quantity:
      reservedQuantity,

    low_stock_limit:
      lowStockLimit,

    available_quantity:
      availableQuantity,
  };


  /*
   * ------------------------------------------------------------------------
   * SIZE
   * ------------------------------------------------------------------------
   *
   * Supports both:
   *
   * variant.size
   *
   * and:
   *
   * variant.size_name
   * variant.size_display_name
   */

  const size: Size | null =
    variant.size ||
    variant.size_name ||
    variant.size_display_name
      ? {
          id: Number(
            variant.size?.id ??
              variant.size_id
          ),

          name:
            variant.size?.name ??
            variant.size_name ??
            "",

          display_name:
            variant.size?.display_name ??
            variant.size_display_name ??
            variant.size_name ??
            null,

          status:
            variant.size?.status ??
            "active",
        }
      : null;


  /*
   * ------------------------------------------------------------------------
   * COLOR
   * ------------------------------------------------------------------------
   *
   * Supports both:
   *
   * variant.color
   *
   * and:
   *
   * variant.color_name
   * variant.color_display_name
   * variant.color_hex_code
   */

  const color: Color | null =
    variant.color ||
    variant.color_name ||
    variant.color_display_name ||
    variant.color_hex_code
      ? {
          id: Number(
            variant.color?.id ??
              variant.color_id
          ),

          name:
            variant.color?.name ??
            variant.color_name ??
            "",

          display_name:
            variant.color?.display_name ??
            variant.color_display_name ??
            variant.color_name ??
            null,

          hex_code:
            variant.color?.hex_code ??
            variant.color_hex_code ??
            null,

          status:
            variant.color?.status ??
            "active",
        }
      : null;


  /*
   * ------------------------------------------------------------------------
   * FINAL VARIANT
   * ------------------------------------------------------------------------
   */

  return {
    id:
      Number(variant.id),

    product_id:
      Number(variant.product_id),

    size_id:
      Number(variant.size_id),

    color_id:
      Number(variant.color_id),

    sku:
      variant.sku || "",

    mrp:
      String(
        variant.mrp ?? "0"
      ),

    selling_price:
      String(
        variant.selling_price ?? "0"
      ),

    status:
      variant.status ||
      "active",

    size,

    color,

    inventory,
  };
}


/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function ProductVariants({
  productId,
}: Props) {

  const [
    variants,
    setVariants,
  ] = useState<Variant[]>([]);

  const [
    sizes,
    setSizes,
  ] = useState<Size[]>([]);

  const [
    colors,
    setColors,
  ] = useState<Color[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    showForm,
    setShowForm,
  ] = useState(false);

  const [
    editing,
    setEditing,
  ] = useState<Variant | null>(
    null
  );


  /* ------------------------------------------------------------------------ */
  /* Form State                                                               */
  /* ------------------------------------------------------------------------ */

  const [
    sizeId,
    setSizeId,
  ] = useState("");

  const [
    colorId,
    setColorId,
  ] = useState("");

  const [
    sku,
    setSku,
  ] = useState("");

  const [
    mrp,
    setMrp,
  ] = useState("");

  const [
    sellingPrice,
    setSellingPrice,
  ] = useState("");

  const [
    quantity,
    setQuantity,
  ] = useState("0");

  const [
    lowStockLimit,
    setLowStockLimit,
  ] = useState("5");

  const [
    status,
    setStatus,
  ] = useState("active");

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");


  /* ------------------------------------------------------------------------ */
  /* Load Data                                                                */
  /* ------------------------------------------------------------------------ */

  const loadData =
    useCallback(
      async () => {

        try {

          setLoading(true);
          setError("");

          const [
            variantsResponse,
            sizesResponse,
            colorsResponse,
          ] = await Promise.all([
            apiFetch(
              `/admin/products/${productId}/variants`
            ),

            apiFetch(
              "/admin/sizes"
            ),

            apiFetch(
              "/admin/colors"
            ),
          ]);


          /* -------------------------------------------------------------- */
          /* Parse responses                                                 */
          /* -------------------------------------------------------------- */

          const variantsData =
            await variantsResponse.json();

          const sizesData =
            await sizesResponse.json();

          const colorsData =
            await colorsResponse.json();


          /* -------------------------------------------------------------- */
          /* Variants                                                        */
          /* -------------------------------------------------------------- */

          if (
            variantsResponse.ok
          ) {

            const rows =
              Array.isArray(
                variantsData?.data
              )
                ? variantsData.data
                : [];

            const normalized =
              rows.map(
                (
                  variant: ApiVariant
                ) =>
                  normalizeVariant(
                    variant
                  )
              );

            setVariants(
              normalized
            );

          } else {

            setVariants([]);

            setError(
              variantsData?.message ||
                "Unable to load variants."
            );
          }


          /* -------------------------------------------------------------- */
          /* Sizes                                                           */
          /* -------------------------------------------------------------- */

          if (
            sizesResponse.ok
          ) {

            const rows =
              Array.isArray(
                sizesData?.data
              )
                ? sizesData.data
                : [];

            setSizes(
              rows.filter(
                (
                  size: Size
                ) =>
                  size.status ===
                  "active"
              )
            );
          }


          /* -------------------------------------------------------------- */
          /* Colors                                                          */
          /* -------------------------------------------------------------- */

          if (
            colorsResponse.ok
          ) {

            const rows =
              Array.isArray(
                colorsData?.data
              )
                ? colorsData.data
                : [];

            setColors(
              rows.filter(
                (
                  color: Color
                ) =>
                  color.status ===
                  "active"
              )
            );
          }

        } catch (err) {

          console.error(
            "Load variant data error:",
            err
          );

          setError(
            "Unable to connect to server."
          );

        } finally {

          setLoading(false);
        }

      },
      [productId]
    );


  /* ------------------------------------------------------------------------ */
  /* Initial Load                                                             */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    void loadData();
  }, [loadData]);


  /* ------------------------------------------------------------------------ */
  /* Reset Form                                                               */
  /* ------------------------------------------------------------------------ */

  function resetForm() {

    setSizeId("");
    setColorId("");

    setSku("");
    setMrp("");
    setSellingPrice("");

    setQuantity("0");
    setLowStockLimit("5");

    setStatus("active");

    setEditing(null);
    setError("");
  }


  /* ------------------------------------------------------------------------ */
  /* Create                                                                   */
  /* ------------------------------------------------------------------------ */

  function openCreate() {

    resetForm();
    setShowForm(true);
  }


  /* ------------------------------------------------------------------------ */
  /* Edit                                                                     */
  /* ------------------------------------------------------------------------ */

  function openEdit(
    variant: Variant
  ) {

    setEditing(
      variant
    );

    setSizeId(
      String(
        variant.size_id
      )
    );

    setColorId(
      String(
        variant.color_id
      )
    );

    setSku(
      variant.sku || ""
    );

    setMrp(
      String(
        variant.mrp ?? ""
      )
    );

    setSellingPrice(
      String(
        variant.selling_price ??
          ""
      )
    );

    setQuantity(
      String(
        variant.inventory
          ?.quantity ?? 0
      )
    );

    setLowStockLimit(
      String(
        variant.inventory
          ?.low_stock_limit ?? 5
      )
    );

    setStatus(
      variant.status ||
        "active"
    );

    setError("");
    setShowForm(true);
  }


  /* ------------------------------------------------------------------------ */
  /* Close                                                                    */
  /* ------------------------------------------------------------------------ */

  function closeForm() {

    setShowForm(false);
    resetForm();
  }


  /* ------------------------------------------------------------------------ */
  /* Submit                                                                   */
  /* ------------------------------------------------------------------------ */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {

    event.preventDefault();

    setSaving(true);
    setError("");

    try {

      /* -------------------------------------------------------------- */
      /* Validation                                                     */
      /* -------------------------------------------------------------- */

      if (!sizeId) {

        setError(
          "Size is required."
        );

        return;
      }


      if (!colorId) {

        setError(
          "Color is required."
        );

        return;
      }


      if (!sku.trim()) {

        setError(
          "SKU is required."
        );

        return;
      }


      const numericMrp =
        Number(mrp);

      const numericSellingPrice =
        Number(
          sellingPrice
        );

      const numericQuantity =
        Math.max(
          0,
          Number(quantity)
        );

      const numericLowStockLimit =
        Math.max(
          0,
          Number(
            lowStockLimit
          )
        );


      if (
        !Number.isFinite(
          numericMrp
        )
      ) {

        setError(
          "Please enter a valid MRP."
        );

        return;
      }


      if (
        !Number.isFinite(
          numericSellingPrice
        )
      ) {

        setError(
          "Please enter a valid selling price."
        );

        return;
      }


      if (
        !Number.isFinite(
          numericQuantity
        )
      ) {

        setError(
          "Please enter a valid stock quantity."
        );

        return;
      }


      if (
        !Number.isFinite(
          numericLowStockLimit
        )
      ) {

        setError(
          "Please enter a valid low stock limit."
        );

        return;
      }


      /* -------------------------------------------------------------- */
      /* Endpoint                                                       */
      /* -------------------------------------------------------------- */

      const endpoint =
        editing
          ? `/admin/product-variants/${editing.id}`
          : `/admin/products/${productId}/variants`;

      const method =
        editing
          ? "PUT"
          : "POST";


      /* -------------------------------------------------------------- */
      /* Payload                                                        */
      /* -------------------------------------------------------------- */

      const payload = {

        size_id:
          Number(sizeId),

        color_id:
          Number(colorId),

        sku:
          sku.trim(),

        mrp:
          numericMrp,

        selling_price:
          numericSellingPrice,

        quantity:
          numericQuantity,

        low_stock_limit:
          numericLowStockLimit,

        status:
          status ||
          "active",
      };


      console.log(
        "Saving variant:",
        payload
      );


      /* -------------------------------------------------------------- */
      /* Request                                                        */
      /* -------------------------------------------------------------- */

      const response =
        await apiFetch(
          endpoint,
          {
            method,

            body:
              JSON.stringify(
                payload
              ),
          }
        );


      const data =
        await response.json();


      /* -------------------------------------------------------------- */
      /* Error                                                          */
      /* -------------------------------------------------------------- */

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
            "Unable to save variant."
        );

        return;
      }


      /* -------------------------------------------------------------- */
      /* Success                                                        */
      /* -------------------------------------------------------------- */

      closeForm();

      await loadData();

    } catch (err) {

      console.error(
        "Save variant error:",
        err
      );

      setError(
        "Unable to connect to server."
      );

    } finally {

      setSaving(false);
    }
  }


  /* ------------------------------------------------------------------------ */
  /* Delete                                                                   */
  /* ------------------------------------------------------------------------ */

  async function deleteVariant(
    id: number
  ) {

    const confirmed =
      window.confirm(
        "Delete this variant?"
      );

    if (!confirmed) {
      return;
    }

    try {

      const response =
        await apiFetch(
          `/admin/product-variants/${id}`,
          {
            method:
              "DELETE",
          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        window.alert(
          data?.message ||
            "Unable to delete variant."
        );

        return;
      }


      await loadData();

    } catch (err) {

      console.error(
        "Delete variant error:",
        err
      );

      window.alert(
        "Unable to connect to server."
      );
    }
  }


  /* ------------------------------------------------------------------------ */
  /* UI                                                                       */
  /* ------------------------------------------------------------------------ */

  return (
    <section
      className="
        rounded-xl
        border
        border-gray-200
        bg-white
        p-6
      "
    >

      {/* ------------------------------------------------------------------ */}
      {/* Header                                                             */}
      {/* ------------------------------------------------------------------ */}

      <div
        className="
          flex
          items-center
          justify-between
        "
      >

        <div>

          <h2
            className="
              font-semibold
              text-gray-900
            "
          >
            Product Variants
          </h2>

          <p
            className="
              mt-1
              text-sm
              text-gray-500
            "
          >
            Manage size, color,
            pricing and inventory.
          </p>

        </div>


        <button
          type="button"
          onClick={
            openCreate
          }
          className="
            flex
            items-center
            gap-2
            rounded-lg
            bg-gray-900
            px-4
            py-2.5
            text-sm
            font-medium
            text-white
            hover:bg-black
          "
        >

          <Plus
            size={18}
          />

          Add Variant

        </button>

      </div>


      {/* ------------------------------------------------------------------ */}
      {/* Error                                                              */}
      {/* ------------------------------------------------------------------ */}

      {error &&
        !showForm && (
          <div
            className="
              mt-5
              rounded-lg
              border
              border-red-200
              bg-red-50
              px-4
              py-3
              text-sm
              text-red-700
            "
          >
            {error}
          </div>
        )}


      {/* ------------------------------------------------------------------ */}
      {/* Table                                                              */}
      {/* ------------------------------------------------------------------ */}

      <div
        className="
          mt-6
          overflow-hidden
          rounded-xl
          border
          border-gray-200
        "
      >

        <div
          className="
            overflow-x-auto
          "
        >

          <table
            className="
              w-full
            "
          >

            <thead
              className="
                bg-gray-50
              "
            >

              <tr>

                <th
                  className="
                    px-4
                    py-3
                    text-left
                    text-xs
                    font-medium
                    uppercase
                    text-gray-500
                  "
                >
                  Variant
                </th>


                <th
                  className="
                    px-4
                    py-3
                    text-left
                    text-xs
                    font-medium
                    uppercase
                    text-gray-500
                  "
                >
                  SKU
                </th>


                <th
                  className="
                    px-4
                    py-3
                    text-left
                    text-xs
                    font-medium
                    uppercase
                    text-gray-500
                  "
                >
                  Price
                </th>


                <th
                  className="
                    px-4
                    py-3
                    text-left
                    text-xs
                    font-medium
                    uppercase
                    text-gray-500
                  "
                >
                  Stock
                </th>


                <th
                  className="
                    px-4
                    py-3
                    text-left
                    text-xs
                    font-medium
                    uppercase
                    text-gray-500
                  "
                >
                  Status
                </th>


                <th
                  className="
                    px-4
                    py-3
                    text-right
                    text-xs
                    font-medium
                    uppercase
                    text-gray-500
                  "
                >
                  Actions
                </th>

              </tr>

            </thead>


            <tbody
              className="
                divide-y
                divide-gray-200
              "
            >

              {loading ? (

                <tr>

                  <td
                    colSpan={6}
                    className="
                      px-4
                      py-10
                      text-center
                      text-sm
                      text-gray-500
                    "
                  >
                    Loading variants...
                  </td>

                </tr>

              ) : variants.length === 0 ? (

                <tr>

                  <td
                    colSpan={6}
                    className="
                      px-4
                      py-12
                      text-center
                      text-sm
                      text-gray-500
                    "
                  >
                    No variants added yet.
                  </td>

                </tr>

              ) : (

                variants.map(
                  (
                    variant
                  ) => {

                    const stock =
                      variant
                        .inventory
                        ?.quantity ??
                      0;

                    const lowStock =
                      variant
                        .inventory
                        ?.low_stock_limit ??
                      5;

                    const available =
                      variant
                        .inventory
                        ?.available_quantity ??
                      Math.max(
                        0,
                        stock -
                          (
                            variant
                              .inventory
                              ?.reserved_quantity ??
                            0
                          )
                      );


                    /*
                     * These fallbacks make sure
                     * the table still works even
                     * if backend returns flat data.
                     */

                    const sizeName =
                      variant
                        .size
                        ?.display_name ||
                      variant
                        .size
                        ?.name ||
                      "—";

                    const colorName =
                      variant
                        .color
                        ?.display_name ||
                      variant
                        .color
                        ?.name ||
                      "—";

                    const colorHex =
                      variant
                        .color
                        ?.hex_code ||
                      "#ffffff";


                    return (

                      <tr
                        key={
                          variant.id
                        }
                        className="
                          hover:bg-gray-50
                        "
                      >

                        {/* ------------------------------------------------ */}
                        {/* Variant                                          */}
                        {/* ------------------------------------------------ */}

                        <td
                          className="
                            px-4
                            py-4
                          "
                        >

                          <div
                            className="
                              flex
                              items-center
                              gap-3
                            "
                          >

                            {/* Color Circle */}

                            <span
                              className="
                                flex
                                h-8
                                w-8
                                shrink-0
                                items-center
                                justify-center
                                rounded-full
                                border
                                border-gray-300
                                shadow-sm
                              "
                              style={{
                                backgroundColor:
                                  colorHex,
                              }}
                              title={
                                colorName
                              }
                            />

                            <div>

                              <p
                                className="
                                  font-medium
                                  text-gray-900
                                "
                              >

                                {sizeName}

                                {" / "}

                                {colorName}

                              </p>

                              {/* Show color code if available */}

                              {variant
                                .color
                                ?.hex_code && (

                                <p
                                  className="
                                    mt-0.5
                                    font-mono
                                    text-[10px]
                                    uppercase
                                    text-gray-400
                                  "
                                >
                                  {
                                    variant
                                      .color
                                      .hex_code
                                  }
                                </p>

                              )}

                            </div>

                          </div>

                        </td>


                        {/* ------------------------------------------------ */}
                        {/* SKU                                              */}
                        {/* ------------------------------------------------ */}

                        <td
                          className="
                            px-4
                            py-4
                            text-sm
                            text-gray-600
                          "
                        >
                          {
                            variant.sku
                          }
                        </td>


                        {/* ------------------------------------------------ */}
                        {/* Price                                            */}
                        {/* ------------------------------------------------ */}

                        <td
                          className="
                            px-4
                            py-4
                          "
                        >

                          <p
                            className="
                              text-sm
                              font-medium
                              text-gray-900
                            "
                          >
                            ₹
                            {
                              variant
                                .selling_price
                            }
                          </p>


                          {Number(
                            variant.mrp
                          ) >
                            Number(
                              variant
                                .selling_price
                            ) && (

                            <p
                              className="
                                text-xs
                                text-gray-400
                                line-through
                              "
                            >
                              ₹
                              {
                                variant.mrp
                              }
                            </p>

                          )}

                        </td>


                        {/* ------------------------------------------------ */}
                        {/* Stock                                             */}
                        {/* ------------------------------------------------ */}

                        <td
                          className="
                            px-4
                            py-4
                          "
                        >

                          <div>

                            <span
                              className={`
                                text-sm
                                font-medium
                                ${
                                  available <=
                                  0
                                    ? "text-red-600"
                                    : available <=
                                      lowStock
                                    ? "text-orange-600"
                                    : "text-green-700"
                                }
                              `}
                            >
                              {stock}
                            </span>


                            <p
                              className="
                                mt-0.5
                                text-xs
                                text-gray-400
                              "
                            >
                              Available:{" "}
                              {
                                available
                              }
                            </p>

                          </div>

                        </td>


                        {/* ------------------------------------------------ */}
                        {/* Status                                            */}
                        {/* ------------------------------------------------ */}

                        <td
                          className="
                            px-4
                            py-4
                          "
                        >

                          <span
                            className={`
                              rounded-full
                              px-2.5
                              py-1
                              text-xs
                              font-medium
                              ${
                                variant.status ===
                                "active"
                                  ? "bg-green-50 text-green-700"
                                  : "bg-gray-100 text-gray-600"
                              }
                            `}
                          >
                            {
                              variant.status
                            }
                          </span>

                        </td>


                        {/* ------------------------------------------------ */}
                        {/* Actions                                           */}
                        {/* ------------------------------------------------ */}

                        <td
                          className="
                            px-4
                            py-4
                          "
                        >

                          <div
                            className="
                              flex
                              justify-end
                              gap-2
                            "
                          >

                            <button
                              type="button"
                              onClick={() =>
                                openEdit(
                                  variant
                                )
                              }
                              className="
                                rounded-lg
                                border
                                border-gray-200
                                p-2
                                hover:bg-gray-100
                              "
                              title="Edit variant"
                            >

                              <Pencil
                                size={16}
                              />

                            </button>


                            <button
                              type="button"
                              onClick={() =>
                                deleteVariant(
                                  variant.id
                                )
                              }
                              className="
                                rounded-lg
                                border
                                border-gray-200
                                p-2
                                text-red-600
                                hover:bg-red-50
                              "
                              title="Delete variant"
                            >

                              <Trash2
                                size={16}
                              />

                            </button>

                          </div>

                        </td>

                      </tr>

                    );
                  }
                )

              )}

            </tbody>

          </table>

        </div>

      </div>


      {/* ------------------------------------------------------------------ */}
      {/* Add/Edit Drawer                                                    */}
      {/* ------------------------------------------------------------------ */}

      {showForm && (

        <div
          className="
            fixed
            inset-0
            z-50
            flex
            justify-end
            bg-black/30
          "
        >

          <div
            className="
              h-full
              w-full
              max-w-lg
              overflow-y-auto
              bg-white
              shadow-xl
            "
          >

            {/* Drawer Header */}

            <div
              className="
                flex
                items-center
                justify-between
                border-b
                border-gray-200
                px-6
                py-5
              "
            >

              <div>

                <h2
                  className="
                    text-lg
                    font-semibold
                    text-gray-900
                  "
                >
                  {editing
                    ? "Edit Variant"
                    : "Add Variant"}
                </h2>

                <p
                  className="
                    mt-1
                    text-sm
                    text-gray-500
                  "
                >
                  Size, color,
                  pricing and stock.
                </p>

              </div>


              <button
                type="button"
                onClick={
                  closeForm
                }
                className="
                  rounded-lg
                  p-2
                  hover:bg-gray-100
                "
              >

                <X
                  size={20}
                />

              </button>

            </div>


            {/* Form */}

            <form
              onSubmit={
                handleSubmit
              }
              className="
                space-y-5
                p-6
              "
            >

              {/* Error */}

              {error && (

                <div
                  className="
                    rounded-lg
                    border
                    border-red-200
                    bg-red-50
                    p-3
                    text-sm
                    text-red-700
                  "
                >
                  {error}
                </div>

              )}


              {/* Size */}

              <div>

                <label
                  className="
                    mb-2
                    block
                    text-sm
                    font-medium
                    text-gray-700
                  "
                >
                  Size *
                </label>

                <select
                  required
                  value={
                    sizeId
                  }
                  onChange={(
                    event
                  ) =>
                    setSizeId(
                      event.target
                        .value
                    )
                  }
                  className="
                    w-full
                    rounded-lg
                    border
                    border-gray-300
                    px-4
                    py-2.5
                    text-sm
                    outline-none
                    focus:border-gray-600
                  "
                >

                  <option value="">
                    Select Size
                  </option>

                  {sizes.map(
                    (
                      size
                    ) => (

                      <option
                        key={
                          size.id
                        }
                        value={
                          size.id
                        }
                      >
                        {
                          size.display_name ||
                          size.name
                        }
                      </option>

                    )
                  )}

                </select>

              </div>


              {/* Color */}

              <div>

                <label
                  className="
                    mb-2
                    block
                    text-sm
                    font-medium
                    text-gray-700
                  "
                >
                  Color *
                </label>

                <div
                  className="
                    flex
                    items-center
                    gap-2
                  "
                >

                  {/* Color Preview */}

                  {colorId && (

                    <span
                      className="
                        h-9
                        w-9
                        shrink-0
                        rounded-full
                        border
                        border-gray-300
                        shadow-sm
                      "
                      style={{
                        backgroundColor:
                          colors.find(
                            (
                              color
                            ) =>
                              String(
                                color.id
                              ) ===
                              colorId
                          )
                            ?.hex_code ||
                          "#ffffff",
                      }}
                    />

                  )}


                  <select
                    required
                    value={
                      colorId
                    }
                    onChange={(
                      event
                    ) =>
                      setColorId(
                        event.target
                          .value
                      )
                    }
                    className="
                      w-full
                      rounded-lg
                      border
                      border-gray-300
                      px-4
                      py-2.5
                      text-sm
                      outline-none
                      focus:border-gray-600
                    "
                  >

                    <option value="">
                      Select Color
                    </option>

                    {colors.map(
                      (
                        color
                      ) => (

                        <option
                          key={
                            color.id
                          }
                          value={
                            color.id
                          }
                        >
                          {
                            color.display_name ||
                            color.name
                          }
                        </option>

                      )
                    )}

                  </select>

                </div>

              </div>


              {/* SKU */}

              <div>

                <label
                  className="
                    mb-2
                    block
                    text-sm
                    font-medium
                    text-gray-700
                  "
                >
                  SKU *
                </label>

                <input
                  required
                  value={
                    sku
                  }
                  onChange={(
                    event
                  ) =>
                    setSku(
                      event.target
                        .value
                    )
                  }
                  placeholder="RKB-R-24"
                  className="
                    w-full
                    rounded-lg
                    border
                    border-gray-300
                    px-4
                    py-2.5
                    text-sm
                    outline-none
                    focus:border-gray-600
                  "
                />

              </div>


              {/* Price */}

              <div
                className="
                  grid
                  grid-cols-2
                  gap-4
                "
              >

                <div>

                  <label
                    className="
                      mb-2
                      block
                      text-sm
                      font-medium
                      text-gray-700
                    "
                  >
                    MRP *
                  </label>

                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={
                      mrp
                    }
                    onChange={(
                      event
                    ) =>
                      setMrp(
                        event.target
                          .value
                      )
                    }
                    className="
                      w-full
                      rounded-lg
                      border
                      border-gray-300
                      px-4
                      py-2.5
                      text-sm
                      outline-none
                      focus:border-gray-600
                    "
                  />

                </div>


                <div>

                  <label
                    className="
                      mb-2
                      block
                      text-sm
                      font-medium
                      text-gray-700
                    "
                  >
                    Selling Price *
                  </label>

                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={
                      sellingPrice
                    }
                    onChange={(
                      event
                    ) =>
                      setSellingPrice(
                        event.target
                          .value
                      )
                    }
                    className="
                      w-full
                      rounded-lg
                      border
                      border-gray-300
                      px-4
                      py-2.5
                      text-sm
                      outline-none
                      focus:border-gray-600
                    "
                  />

                </div>

              </div>


              {/* Inventory */}

              <div
                className="
                  rounded-xl
                  border
                  border-gray-200
                  p-4
                "
              >

                <div
                  className="
                    mb-4
                  "
                >

                  <h3
                    className="
                      font-medium
                      text-gray-900
                    "
                  >
                    Inventory
                  </h3>

                  <p
                    className="
                      mt-1
                      text-xs
                      text-gray-500
                    "
                  >
                    Stock is stored
                    separately from
                    variant details.
                  </p>

                </div>


                <div
                  className="
                    grid
                    grid-cols-2
                    gap-4
                  "
                >

                  {/* Stock */}

                  <div>

                    <label
                      className="
                        mb-2
                        block
                        text-sm
                        font-medium
                        text-gray-700
                      "
                    >
                      Stock *
                    </label>

                    <input
                      type="number"
                      required
                      min="0"
                      value={
                        quantity
                      }
                      onChange={(
                        event
                      ) =>
                        setQuantity(
                          event.target
                            .value
                        )
                      }
                      className="
                        w-full
                        rounded-lg
                        border
                        border-gray-300
                        px-4
                        py-2.5
                        text-sm
                        outline-none
                        focus:border-gray-600
                      "
                    />

                  </div>


                  {/* Low Stock */}

                  <div>

                    <label
                      className="
                        mb-2
                        block
                        text-sm
                        font-medium
                        text-gray-700
                      "
                    >
                      Low Stock Alert
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={
                        lowStockLimit
                      }
                      onChange={(
                        event
                      ) =>
                        setLowStockLimit(
                          event.target
                            .value
                        )
                      }
                      className="
                        w-full
                        rounded-lg
                        border
                        border-gray-300
                        px-4
                        py-2.5
                        text-sm
                        outline-none
                        focus:border-gray-600
                      "
                    />

                  </div>

                </div>

              </div>


              {/* Status */}

              <div>

                <label
                  className="
                    mb-2
                    block
                    text-sm
                    font-medium
                    text-gray-700
                  "
                >
                  Status
                </label>

                <select
                  value={
                    status
                  }
                  onChange={(
                    event
                  ) =>
                    setStatus(
                      event.target
                        .value
                    )
                  }
                  className="
                    w-full
                    rounded-lg
                    border
                    border-gray-300
                    px-4
                    py-2.5
                    text-sm
                    outline-none
                    focus:border-gray-600
                  "
                >

                  <option value="active">
                    Active
                  </option>

                  <option value="inactive">
                    Inactive
                  </option>

                </select>

              </div>


              {/* Buttons */}

              <div
                className="
                  flex
                  justify-end
                  gap-3
                  border-t
                  border-gray-200
                  pt-5
                "
              >

                <button
                  type="button"
                  onClick={
                    closeForm
                  }
                  disabled={
                    saving
                  }
                  className="
                    rounded-lg
                    border
                    border-gray-300
                    px-4
                    py-2.5
                    text-sm
                    font-medium
                    text-gray-700
                    hover:bg-gray-50
                    disabled:opacity-50
                  "
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  disabled={
                    saving
                  }
                  className="
                    rounded-lg
                    bg-gray-900
                    px-5
                    py-2.5
                    text-sm
                    font-medium
                    text-white
                    hover:bg-black
                    disabled:opacity-50
                  "
                >

                  {saving
                    ? "Saving..."
                    : editing
                    ? "Update Variant"
                    : "Add Variant"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </section>
  );
}