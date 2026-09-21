"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import VariantMatrixEditor, {
  type AdminColor,
  type AdminSize,
  type VariantDraft,
} from "@/components/admin/products/VariantMatrixEditor";
import DesignOptionDrafts, {
  type DesignDraft,
} from "@/components/admin/products/DesignOptionDrafts";

type Category = { id: number; name: string; status: string };
type Material = { id: number; name: string; status: string };

export default function CreateProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [sizes, setSizes] = useState<AdminSize[]>([]);
  const [colors, setColors] = useState<AdminColor[]>([]);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [materialId, setMaterialId] = useState("");
  const [sku, setSku] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [mrp, setMrp] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [setQuantity, setSetQuantity] = useState("1");
  const [status, setStatus] = useState("active");
  const [featured, setFeatured] = useState(false);
  const [bestSeller, setBestSeller] = useState(false);
  const [newArrival, setNewArrival] = useState(false);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [selectedSizeIds, setSelectedSizeIds] = useState<number[]>([]);
  const [selectedColorIds, setSelectedColorIds] = useState<number[]>([]);
  const [variants, setVariants] = useState<VariantDraft[]>([]);
  const [designs, setDesigns] = useState<DesignDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const rs = await Promise.all([
          apiFetch("/admin/categories"),
          apiFetch("/admin/materials"),
          apiFetch("/admin/sizes"),
          apiFetch("/admin/colors"),
        ]);
        const js = await Promise.all(rs.map((r) => r.json()));
        if (cancelled) return;
        setCategories(
          (js[0]?.data || []).filter((x: Category) => x.status === "active"),
        );
        setMaterials(
          (js[1]?.data || []).filter((x: Material) => x.status === "active"),
        );
        setSizes(
          (js[2]?.data || []).filter(
            (x: { status: string }) => x.status === "active",
          ),
        );
        setColors(
          (js[3]?.data || []).filter(
            (x: { status: string }) => x.status === "active",
          ),
        );
      } catch (e) {
        console.error(e);
        setError("Unable to load product options.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedSizeIds.length || !selectedColorIds.length) {
      setVariants([]);
      return;
    }
    setVariants((current) => {
      const existing = new Map(
        current.map((v) => [`${v.size_id}:${v.color_id}`, v]),
      );
      return selectedSizeIds.flatMap((size_id) =>
        selectedColorIds.map(
          (color_id) =>
            existing.get(`${size_id}:${color_id}`) || {
              size_id,
              color_id,
              sku: "",
              mrp: mrp || "",
              selling_price: sellingPrice || "",
              quantity: "0",
              low_stock_limit: "5",
              status: "active",
            },
        ),
      );
    });
  }, [selectedSizeIds, selectedColorIds, mrp, sellingPrice]);
  const toggleSize = (id: number) =>
    setSelectedSizeIds((x) =>
      x.includes(id) ? x.filter((v) => v !== id) : [...x, id],
    );
  const toggleColor = (id: number) =>
    setSelectedColorIds((x) =>
      x.includes(id) ? x.filter((v) => v !== id) : [...x, id],
    );
  const updateVariant = (
    index: number,
    field: keyof VariantDraft,
    value: string,
  ) =>
    setVariants((x) =>
      x.map((v, i) => (i === index ? { ...v, [field]: value } : v)),
    );
  const variantSkus = useMemo(
    () => variants.map((v) => v.sku.trim().toLowerCase()).filter(Boolean),
    [variants],
  );

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const trimmed = name.trim();
    if (!trimmed) return setError("Product name is required.");
    if (!selectedSizeIds.length) return setError("Select at least one size.");
    if (!selectedColorIds.length) return setError("Select at least one color.");
    if (!variants.length) return setError("At least one variant is required.");
    if (variantSkus.length !== variants.length)
      return setError("Every variant needs a SKU.");
    if (new Set(variantSkus).size !== variantSkus.length)
      return setError("Variant SKUs must be unique.");
    for (const [i, v] of variants.entries()) {
      if (v.mrp === "" || Number(v.mrp) < 0)
        return setError(`Valid MRP is required for variant ${i + 1}.`);
      if (v.selling_price === "" || Number(v.selling_price) < 0)
        return setError(
          `Valid selling price is required for variant ${i + 1}.`,
        );
      if (Number(v.mrp) > 0 && Number(v.selling_price) > Number(v.mrp))
        return setError(
          `Selling price cannot exceed MRP for variant ${i + 1}.`,
        );
    }
    try {
      setSaving(true);
      const payload = {
        name: trimmed,
        category_id: categoryId ? Number(categoryId) : null,
        material_id: materialId ? Number(materialId) : null,
        sku: sku.trim() || null,
        short_description: shortDescription.trim() || null,
        description: description.trim() || null,
        mrp: mrp !== "" ? Number(mrp) : 0,
        selling_price: sellingPrice !== "" ? Number(sellingPrice) : 0,
        set_quantity: setQuantity !== "" ? Number(setQuantity) : 1,
        status,
        featured,
        best_seller: bestSeller,
        new_arrival: newArrival,
        seo_title: seoTitle.trim() || null,
        seo_description: seoDescription.trim() || null,
        variants: variants.map((v) => ({
          ...v,
          mrp: Number(v.mrp),
          selling_price: Number(v.selling_price),
          quantity: Math.max(0, Number(v.quantity || 0)),
          low_stock_limit: Math.max(0, Number(v.low_stock_limit || 5)),
        })),
        design_options: designs
          .filter((d) => d.label.trim())
          .map((d, i) => ({ ...d, label: d.label.trim(), sort_order: i })),
      };
      const r = await apiFetch("/admin/products", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.message || "Unable to create product.");
      const id = j?.data?.id;
      if (id) router.push(`/admin/products/${id}/edit`);
      else router.push("/admin/products");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to create product.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/products"
            className="rounded-lg border border-gray-200 p-2 hover:bg-gray-100"
          >
            <ArrowLeft size={19} />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Add Product
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Create the product, all size/color variants and inventory in one
              save.
            </p>
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-black disabled:opacity-50"
        >
          <Save size={18} />
          {saving ? "Saving product..." : "Save product"}
        </button>
      </div>
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="font-semibold">Product Information</h2>
            <div className="mt-5 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Product Name *
                </label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Royal Kundan Bridal Bangle Set"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-gray-600"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Short Description
                </label>
                <textarea
                  rows={3}
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Description
                </label>
                <textarea
                  rows={7}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none"
                />
              </div>
            </div>
          </section>
          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="font-semibold">Base Pricing</h2>
            <p className="mt-1 text-sm text-gray-500">
              Used as the default when new variant rows are generated.
            </p>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <label className="text-sm font-medium">
                MRP *
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={mrp}
                  onChange={(e) => setMrp(e.target.value)}
                  className="mt-2 w-full rounded-lg border px-4 py-2.5"
                />
              </label>
              <label className="text-sm font-medium">
                Selling Price *
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  className="mt-2 w-full rounded-lg border px-4 py-2.5"
                />
              </label>
            </div>
          </section>
          <VariantMatrixEditor
            sizes={sizes}
            colors={colors}
            selectedSizeIds={selectedSizeIds}
            selectedColorIds={selectedColorIds}
            variants={variants}
            onToggleSize={toggleSize}
            onToggleColor={toggleColor}
            onVariantChange={updateVariant}
          />
          <DesignOptionDrafts designs={designs} onChange={setDesigns} />
          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="font-semibold">SEO</h2>
            <div className="mt-5 space-y-4">
              <input
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="SEO title"
                className="w-full rounded-lg border px-4 py-2.5 text-sm"
              />
              <textarea
                rows={4}
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                placeholder="SEO description"
                className="w-full rounded-lg border px-4 py-2.5 text-sm"
              />
            </div>
          </section>
        </div>
        <aside className="space-y-6">
          <section className="rounded-xl border bg-white p-5">
            <h2 className="font-semibold">Status</h2>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-4 w-full rounded-lg border bg-white px-4 py-2.5 text-sm"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </section>
          <section className="rounded-xl border bg-white p-5">
            <h2 className="font-semibold">Classification</h2>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="mt-4 w-full rounded-lg border bg-white px-4 py-2.5 text-sm"
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value={materialId}
              onChange={(e) => setMaterialId(e.target.value)}
              className="mt-3 w-full rounded-lg border bg-white px-4 py-2.5 text-sm"
            >
              <option value="">Select material</option>
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </section>
          <section className="rounded-xl border bg-white p-5">
            <h2 className="font-semibold">Product Details</h2>
            <label className="mt-4 block text-sm">
              Base SKU
              <input
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="mt-2 w-full rounded-lg border px-3 py-2.5"
              />
            </label>
            <label className="mt-4 block text-sm">
              Set Quantity
              <input
                type="number"
                min="1"
                value={setQuantity}
                onChange={(e) => setSetQuantity(e.target.value)}
                className="mt-2 w-full rounded-lg border px-3 py-2.5"
              />
            </label>
          </section>
          <section className="rounded-xl border bg-white p-5">
            <h2 className="font-semibold">Product Labels</h2>
            <div className="mt-4 space-y-3">
              {[
                ["Featured Product", featured, setFeatured],
                ["Best Seller", bestSeller, setBestSeller],
                ["New Arrival", newArrival, setNewArrival],
              ].map(([label, value, setter]) => (
                <label
                  key={String(label)}
                  className="flex items-center gap-3 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(value)}
                    onChange={(e) =>
                      (setter as (v: boolean) => void)(e.target.checked)
                    }
                  />
                  {String(label)}
                </label>
              ))}
            </div>
          </section>
        </aside>
      </div>
      <div className="flex justify-end gap-3">
        <Link
          href="/admin/products"
          className="rounded-lg border px-5 py-2.5 text-sm font-medium"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          <Save size={18} />
          {saving ? "Saving..." : "Save product"}
        </button>
      </div>
    </form>
  );
}
