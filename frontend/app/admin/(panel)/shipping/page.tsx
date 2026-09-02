"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  Check,
  CheckCircle2,
  RotateCcw,
  Save,
  Truck,
  Zap,
} from "lucide-react";

import {
  apiFetch,
} from "@/lib/api";


type ShippingSetting = {
  id: number | null;

  flat_shipping_amount:
    | string
    | number;

  free_shipping_minimum:
    | string
    | number
    | null;

  shipping_enabled:
    | boolean
    | number
    | string;
};


const DEFAULT_FLAT_AMOUNT = "99";

const DEFAULT_FREE_MINIMUM = "2000";


export default function AdminShippingPage() {

  const [
    setting,
    setSetting,
  ] = useState<ShippingSetting | null>(
    null
  );


  const [
    flatAmount,
    setFlatAmount,
  ] = useState(
    DEFAULT_FLAT_AMOUNT
  );


  const [
    freeMinimum,
    setFreeMinimum,
  ] = useState(
    DEFAULT_FREE_MINIMUM
  );


  const [
    enabled,
    setEnabled,
  ] = useState(true);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    saving,
    setSaving,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  const [
    success,
    setSuccess,
  ] = useState("");


  const [
    dirty,
    setDirty,
  ] = useState(false);


  /*
  |--------------------------------------------------------------------------
  | Load Settings
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    async function load() {

      try {

        setLoading(true);

        setError("");

        const response =
          await apiFetch(
            "/admin/shipping-settings"
          );


        const data =
          await response.json();


        if (!response.ok) {

          setError(
            data.message ||
              "Unable to load shipping settings."
          );

          return;
        }


        const current:
          ShippingSetting =
          data.data;


        setSetting(current);


        setFlatAmount(
          String(
            current.flat_shipping_amount ??
              ""
          )
        );


        /*
        |--------------------------------------------------------------------------
        | IMPORTANT
        |--------------------------------------------------------------------------
        | null means no free-shipping threshold.
        */

        setFreeMinimum(
          current.free_shipping_minimum ===
            null ||
          current.free_shipping_minimum ===
            undefined
            ? ""
            : String(
                current.free_shipping_minimum
              )
        );


        setEnabled(
          Boolean(
            Number(
              current.shipping_enabled
            )
          )
        );


        setDirty(false);

      } catch {

        setError(
          "Unable to connect to server."
        );

      } finally {

        setLoading(false);

      }
    }


    load();

  }, []);


  /*
  |--------------------------------------------------------------------------
  | Mark Dirty
  |--------------------------------------------------------------------------
  */

  function markDirty() {

    setDirty(true);

    setSuccess("");

    setError("");

  }


  /*
  |--------------------------------------------------------------------------
  | Number Helpers
  |--------------------------------------------------------------------------
  */

  const flatValue =
    Number(
      flatAmount || 0
    );


  const minimumValue =
    freeMinimum === ""
      ? null
      : Number(
          freeMinimum
        );


  /*
  |--------------------------------------------------------------------------
  | Validation
  |--------------------------------------------------------------------------
  */

  const validationError =
    useMemo(() => {

      if (
        flatValue < 0
      ) {
        return "Flat shipping charge cannot be negative.";
      }


      if (
        minimumValue !== null &&
        minimumValue < 0
      ) {
        return "Free shipping minimum cannot be negative.";
      }


      if (
        enabled &&
        minimumValue !== null &&
        minimumValue > 0 &&
        flatValue >= minimumValue
      ) {
        return "Free shipping minimum should be greater than the flat shipping charge.";
      }


      return "";

    }, [
      flatValue,
      minimumValue,
      enabled,
    ]);


  /*
  |--------------------------------------------------------------------------
  | Save
  |--------------------------------------------------------------------------
  */

  async function save(
    event: FormEvent
  ) {

    event.preventDefault();


    setError("");

    setSuccess("");


    if (validationError) {

      setError(
        validationError
      );

      return;

    }


    try {

      setSaving(true);


      const response =
        await apiFetch(
          "/admin/shipping-settings",
          {

            method: "PUT",

            body:
              JSON.stringify({

                flat_shipping_amount:
                  flatValue,

                /*
                |--------------------------------------------------------------------------
                | Send NULL when blank
                |--------------------------------------------------------------------------
                */

                free_shipping_minimum:
                  minimumValue,

                shipping_enabled:
                  enabled,

              }),

          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        const validationMessages =
          Object.values(
            data.errors || {}
          )
            .flat()
            .filter(Boolean)
            .join(" ");


        setError(
          data.message ||
            validationMessages ||
            "Unable to save shipping settings."
        );

        return;

      }


      setSetting(
        data.data
      );


      setFlatAmount(
        String(
          data.data
            .flat_shipping_amount ??
            ""
        )
      );


      setFreeMinimum(
        data.data
          .free_shipping_minimum ===
          null
          ? ""
          : String(
              data.data
                .free_shipping_minimum
            )
      );


      setEnabled(
        Boolean(
          Number(
            data.data
              .shipping_enabled
          )
        )
      );


      setDirty(false);


      setSuccess(
        "Shipping settings saved successfully."
      );

    } catch {

      setError(
        "Unable to connect to server."
      );

    } finally {

      setSaving(false);

    }

  }


  /*
  |--------------------------------------------------------------------------
  | Reset
  |--------------------------------------------------------------------------
  */

  function resetChanges() {

    if (!setting) {

      setFlatAmount(
        DEFAULT_FLAT_AMOUNT
      );

      setFreeMinimum(
        DEFAULT_FREE_MINIMUM
      );

      setEnabled(true);

      setDirty(false);

      return;

    }


    setFlatAmount(
      String(
        setting.flat_shipping_amount ??
          ""
      )
    );


    setFreeMinimum(
      setting.free_shipping_minimum ===
        null ||
      setting.free_shipping_minimum ===
        undefined
        ? ""
        : String(
            setting.free_shipping_minimum
          )
    );


    setEnabled(
      Boolean(
        Number(
          setting.shipping_enabled
        )
      )
    );


    setDirty(false);

    setError("");

    setSuccess("");

  }


  /*
  |--------------------------------------------------------------------------
  | Quick Presets
  |--------------------------------------------------------------------------
  */

  function applyPreset(
    amount: string,
    minimum: string
  ) {

    setFlatAmount(amount);

    setFreeMinimum(minimum);

    setEnabled(true);

    markDirty();

  }


  /*
  |--------------------------------------------------------------------------
  | Format Currency
  |--------------------------------------------------------------------------
  */

  function money(
    value: number
  ) {

    return `₹${value.toLocaleString(
      "en-IN",
      {
        maximumFractionDigits: 2,
      }
    )}`;

  }


  /*
  |--------------------------------------------------------------------------
  | Calculate Example Orders
  |--------------------------------------------------------------------------
  */

  function calculateShipping(
    orderAmount: number
  ) {

    if (!enabled) {

      return 0;

    }


    if (
      minimumValue !== null &&
      minimumValue > 0 &&
      orderAmount >= minimumValue
    ) {

      return 0;

    }


    return flatValue;

  }


  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (loading) {

    return (

      <div className="max-w-5xl">

        <div className="mb-6">

          <div className="h-8 w-56 animate-pulse rounded bg-gray-200" />

          <div className="mt-2 h-4 w-80 animate-pulse rounded bg-gray-100" />

        </div>


        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">

          <div className="h-[600px] animate-pulse rounded-2xl bg-gray-100" />

          <div className="h-[400px] animate-pulse rounded-2xl bg-gray-100" />

        </div>

      </div>

    );

  }


  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  return (

    <div className="max-w-6xl">

      {/* ------------------------------------------------------------------ */}
      {/* HEADER                                                             */}
      {/* ------------------------------------------------------------------ */}

      <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">

        <div>

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900">

              <Truck
                size={20}
                className="text-white"
              />

            </div>


            <div>

              <h1 className="text-2xl font-semibold text-gray-900">

                Shipping Settings

              </h1>


              <p className="mt-1 text-sm text-gray-500">

                Configure delivery charges and free shipping rules.

              </p>

            </div>

          </div>

        </div>


        {dirty && (

          <div className="inline-flex items-center gap-2 self-start rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 md:self-auto">

            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />

            Unsaved changes

          </div>

        )}

      </div>


      {/* ------------------------------------------------------------------ */}
      {/* MESSAGES                                                           */}
      {/* ------------------------------------------------------------------ */}

      {error && (

        <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

          <AlertCircle
            size={18}
            className="mt-0.5 shrink-0"
          />

          <div>

            <p className="font-medium">
              Unable to save changes
            </p>

            <p className="mt-1">
              {error}
            </p>

          </div>

        </div>

      )}


      {success && (

        <div className="mb-5 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">

          <CheckCircle2
            size={18}
          />

          {success}

        </div>

      )}


      {/* ------------------------------------------------------------------ */}
      {/* MAIN GRID                                                          */}
      {/* ------------------------------------------------------------------ */}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">


        {/* ================================================================ */}
        {/* SETTINGS CARD                                                    */}
        {/* ================================================================ */}

        <form
          onSubmit={save}
          className="rounded-2xl border border-gray-200 bg-white"
        >

          {/* Header */}

          <div className="border-b border-gray-200 px-6 py-5">

            <div className="flex items-start gap-4">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100">

                <Truck
                  size={21}
                  className="text-gray-700"
                />

              </div>


              <div>

                <h2 className="font-semibold text-gray-900">

                  Delivery Charges

                </h2>


                <p className="mt-1 text-sm leading-6 text-gray-500">

                  Define how customers are charged for delivery and when free shipping applies.

                </p>

              </div>

            </div>

          </div>


          <div className="p-6">


            {/* ============================================================ */}
            {/* ENABLE SHIPPING                                               */}
            {/* ============================================================ */}

            <div
              className={`rounded-xl border p-4 transition ${
                enabled
                  ? "border-gray-200 bg-white"
                  : "border-gray-200 bg-gray-50"
              }`}
            >

              <div className="flex items-center justify-between gap-5">

                <div>

                  <div className="flex items-center gap-2">

                    <p className="font-medium text-gray-900">

                      Enable Shipping Charges

                    </p>


                    {enabled && (

                      <span className="rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">

                        Active

                      </span>

                    )}

                  </div>


                  <p className="mt-1 text-sm text-gray-500">

                    {enabled
                      ? "Customers will be charged according to the rule below."
                      : "Every order will have free shipping."
                    }

                  </p>

                </div>


                <button
                  type="button"
                  role="switch"
                  aria-checked={enabled}
                  onClick={() => {

                    setEnabled(
                      !enabled
                    );

                    markDirty();

                  }}
                  className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                    enabled
                      ? "bg-gray-900"
                      : "bg-gray-300"
                  }`}
                >

                  <span
                    className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                      enabled
                        ? "left-6"
                        : "left-1"
                    }`}
                  />

                </button>

              </div>

            </div>


            {/* ============================================================ */}
            {/* QUICK PRESETS                                                 */}
            {/* ============================================================ */}

            {enabled && (

              <div className="mt-6">

                <div className="mb-3 flex items-center gap-2">

                  <Zap
                    size={16}
                    className="text-gray-500"
                  />

                  <p className="text-sm font-medium text-gray-800">

                    Quick presets

                  </p>

                </div>


                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">

                  <button
                    type="button"
                    onClick={() =>
                      applyPreset(
                        "49",
                        "999"
                      )
                    }
                    className="rounded-lg border border-gray-200 px-3 py-2.5 text-left text-sm transition hover:border-gray-400 hover:bg-gray-50"
                  >

                    <span className="block font-medium text-gray-900">
                      ₹49 / ₹999
                    </span>

                    <span className="mt-0.5 block text-xs text-gray-400">
                      Budget shipping
                    </span>

                  </button>


                  <button
                    type="button"
                    onClick={() =>
                      applyPreset(
                        "99",
                        "2000"
                      )
                    }
                    className="rounded-lg border border-gray-200 px-3 py-2.5 text-left text-sm transition hover:border-gray-400 hover:bg-gray-50"
                  >

                    <span className="block font-medium text-gray-900">
                      ₹99 / ₹2,000
                    </span>

                    <span className="mt-0.5 block text-xs text-gray-400">
                      Standard
                    </span>

                  </button>


                  <button
                    type="button"
                    onClick={() =>
                      applyPreset(
                        "149",
                        "2999"
                      )
                    }
                    className="rounded-lg border border-gray-200 px-3 py-2.5 text-left text-sm transition hover:border-gray-400 hover:bg-gray-50"
                  >

                    <span className="block font-medium text-gray-900">
                      ₹149 / ₹2,999
                    </span>

                    <span className="mt-0.5 block text-xs text-gray-400">
                      Premium
                    </span>

                  </button>

                </div>

              </div>

            )}


            {/* ============================================================ */}
            {/* FORM FIELDS                                                   */}
            {/* ============================================================ */}

            <div className="mt-6 grid gap-5 md:grid-cols-2">


              {/* Flat Charge */}

              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700">

                  Flat Shipping Charge

                </label>


                <div className="relative">

                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">

                    ₹

                  </span>


                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    disabled={!enabled}
                    value={flatAmount}
                    onChange={(event) => {

                      setFlatAmount(
                        event.target.value
                      );

                      markDirty();

                    }}
                    placeholder="99"
                    className="w-full rounded-lg border border-gray-300 py-3 pl-8 pr-4 text-sm outline-none transition focus:border-gray-700 focus:ring-2 focus:ring-gray-100 disabled:bg-gray-100 disabled:text-gray-400"
                  />

                </div>


                <p className="mt-2 text-xs text-gray-400">

                  Amount charged when an order does not qualify for free shipping.

                </p>

              </div>


              {/* Free Shipping */}

              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700">

                  Free Shipping Minimum

                </label>


                <div className="relative">

                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">

                    ₹

                  </span>


                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    disabled={!enabled}
                    value={freeMinimum}
                    onChange={(event) => {

                      setFreeMinimum(
                        event.target.value
                      );

                      markDirty();

                    }}
                    placeholder="2000"
                    className="w-full rounded-lg border border-gray-300 py-3 pl-8 pr-4 text-sm outline-none transition focus:border-gray-700 focus:ring-2 focus:ring-gray-100 disabled:bg-gray-100 disabled:text-gray-400"
                  />

                </div>


                <p className="mt-2 text-xs text-gray-400">

                  Leave blank to disable automatic free shipping.

                </p>

              </div>

            </div>


            {/* ============================================================ */}
            {/* VALIDATION                                                     */}
            {/* ============================================================ */}

            {validationError && (

              <div className="mt-5 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">

                <AlertCircle
                  size={17}
                  className="mt-0.5 shrink-0"
                />

                <span>
                  {validationError}
                </span>

              </div>

            )}


            {/* ============================================================ */}
            {/* RULE SUMMARY                                                   */}
            {/* ============================================================ */}

            <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-5">

              <div className="flex items-center justify-between">

                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">

                  Active Shipping Rule

                </p>


                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    enabled
                      ? "bg-green-50 text-green-700"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >

                  {enabled
                    ? "Enabled"
                    : "Free Shipping"
                  }

                </span>

              </div>


              <div className="mt-4">

                {!enabled ? (

                  <div>

                    <p className="text-lg font-semibold text-gray-900">

                      Free shipping on all orders

                    </p>

                    <p className="mt-1 text-sm text-gray-500">

                      Customers will not be charged delivery fees.

                    </p>

                  </div>

                ) : (

                  <div>

                    <p className="text-lg font-semibold text-gray-900">

                      {money(flatValue)} delivery

                    </p>


                    {minimumValue !== null &&
                    minimumValue > 0 ? (

                      <p className="mt-1 text-sm text-gray-500">

                        Free delivery on orders of{" "}

                        <strong className="font-medium text-gray-700">

                          {money(
                            minimumValue
                          )}

                        </strong>

                        {" "}or more.

                      </p>

                    ) : (

                      <p className="mt-1 text-sm text-gray-500">

                        No automatic free-shipping threshold is configured.

                      </p>

                    )}

                  </div>

                )}

              </div>

            </div>


            {/* ============================================================ */}
            {/* ACTIONS                                                        */}
            {/* ============================================================ */}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-5">


              <button
                type="button"
                disabled={
                  saving ||
                  !dirty
                }
                onClick={
                  resetChanges
                }
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >

                <RotateCcw
                  size={16}
                />

                Reset

              </button>


              <button
                type="submit"
                disabled={
                  saving ||
                  Boolean(
                    validationError
                  ) ||
                  !dirty
                }
                className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
              >

                {saving ? (

                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />

                    Saving...

                  </>

                ) : (

                  <>
                    <Save
                      size={17}
                    />

                    Save Changes

                  </>

                )}

              </button>

            </div>

          </div>

        </form>


        {/* ================================================================ */}
        {/* RIGHT SIDE                                                       */}
        {/* ================================================================ */}

        <div className="space-y-5">


          {/* ============================================================ */}
          {/* SHIPPING CALCULATOR                                           */}
          {/* ============================================================ */}

          <div className="rounded-2xl border border-gray-200 bg-white p-5">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">

                <Truck
                  size={19}
                  className="text-gray-700"
                />

              </div>


              <div>

                <h2 className="font-semibold text-gray-900">

                  Shipping Calculator

                </h2>


                <p className="mt-1 text-xs text-gray-500">

                  Preview what customers pay.

                </p>

              </div>

            </div>


            <div className="mt-5 space-y-3">


              {/* ₹500 */}

              <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">

                <span className="text-sm text-gray-600">

                  Order ₹500

                </span>


                <span className="text-sm font-semibold text-gray-900">

                  {calculateShipping(
                    500
                  ) === 0
                    ? "FREE"
                    : money(
                        calculateShipping(
                          500
                        )
                      )}

                </span>

              </div>


              {/* ₹1,500 */}

              <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">

                <span className="text-sm text-gray-600">

                  Order ₹1,500

                </span>


                <span className="text-sm font-semibold text-gray-900">

                  {calculateShipping(
                    1500
                  ) === 0
                    ? "FREE"
                    : money(
                        calculateShipping(
                          1500
                        )
                      )}

                </span>

              </div>


              {/* ₹2,000 */}

              <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">

                <span className="text-sm text-gray-600">

                  Order ₹2,000

                </span>


                <span className="text-sm font-semibold text-gray-900">

                  {calculateShipping(
                    2000
                  ) === 0
                    ? "FREE"
                    : money(
                        calculateShipping(
                          2000
                        )
                      )}

                </span>

              </div>


              {/* ₹5,000 */}

              <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">

                <span className="text-sm text-gray-600">

                  Order ₹5,000

                </span>


                <span className="text-sm font-semibold text-green-700">

                  {calculateShipping(
                    5000
                  ) === 0
                    ? "FREE"
                    : money(
                        calculateShipping(
                          5000
                        )
                      )}

                </span>

              </div>

            </div>

          </div>


          {/* ============================================================ */}
          {/* RULE CHECK                                                    */}
          {/* ============================================================ */}

          <div className="rounded-2xl border border-gray-200 bg-white p-5">

            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">

              Rule Check

            </p>


            <div className="mt-4 space-y-3">


              <div className="flex items-center gap-3">

                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-50">

                  <Check
                    size={15}
                    className="text-green-600"
                  />

                </div>


                <div>

                  <p className="text-sm font-medium text-gray-800">

                    Shipping configuration

                  </p>

                  <p className="text-xs text-gray-400">

                    Valid

                  </p>

                </div>

              </div>


              <div className="flex items-center gap-3">

                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full ${
                    flatValue >= 0
                      ? "bg-green-50"
                      : "bg-red-50"
                  }`}
                >

                  <Check
                    size={15}
                    className={
                      flatValue >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  />

                </div>


                <div>

                  <p className="text-sm font-medium text-gray-800">

                    Delivery charge

                  </p>

                  <p className="text-xs text-gray-400">

                    {money(
                      flatValue
                    )}

                  </p>

                </div>

              </div>


              <div className="flex items-center gap-3">

                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full ${
                    minimumValue === null ||
                    minimumValue > flatValue
                      ? "bg-green-50"
                      : "bg-red-50"
                  }`}
                >

                  <Check
                    size={15}
                    className={
                      minimumValue === null ||
                      minimumValue > flatValue
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  />

                </div>


                <div>

                  <p className="text-sm font-medium text-gray-800">

                    Free shipping threshold

                  </p>

                  <p className="text-xs text-gray-400">

                    {minimumValue === null
                      ? "Not configured"
                      : money(
                          minimumValue
                        )}

                  </p>

                </div>

              </div>

            </div>

          </div>


          {/* ============================================================ */}
          {/* CURRENT STATUS                                               */}
          {/* ============================================================ */}

          <div className="rounded-2xl bg-gray-900 p-5 text-white">

            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">

              Current Status

            </p>


            <p className="mt-3 text-lg font-semibold">

              {enabled
                ? "Shipping charges active"
                : "Free shipping active"
              }

            </p>


            <p className="mt-2 text-sm leading-6 text-gray-400">

              {enabled
                ? minimumValue !== null &&
                  minimumValue > 0
                  ? `Customers pay ${money(
                      flatValue
                    )} below ${money(
                      minimumValue
                    )}.`
                  : `Customers pay ${money(
                      flatValue
                    )} on every order.`
                : "Customers receive free shipping on every order."
              }

            </p>

          </div>


        </div>

      </div>

    </div>

  );
}