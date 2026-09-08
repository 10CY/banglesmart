"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  Check,
  Loader2,
} from "lucide-react";

type Material = {
  id: number;
  name: string;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
};

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingMaterial, setEditingMaterial] =
    useState<Material | null>(null);

  const [name, setName] = useState("");
  const [status, setStatus] =
    useState<"active" | "inactive">("active");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ----------------------------------
  // Load Materials
  // ----------------------------------
  async function loadMaterials() {
    try {
      setLoading(true);
      setError("");

      const response = await apiFetch("/admin/materials");

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to load materials.",
        );
      }

      setMaterials(result.data || []);
    } catch (err: any) {
      setError(
        err.message || "Unable to load materials.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMaterials();
  }, []);

  // ----------------------------------
  // Open Add Modal
  // ----------------------------------
  function openAddModal() {
    setEditingMaterial(null);
    setName("");
    setStatus("active");
    setError("");
    setShowModal(true);
  }

  // ----------------------------------
  // Open Edit Modal
  // ----------------------------------
  function openEditModal(material: Material) {
    setEditingMaterial(material);
    setName(material.name);
    setStatus(material.status);
    setError("");
    setShowModal(true);
  }

  // ----------------------------------
  // Close Modal
  // ----------------------------------
  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setEditingMaterial(null);
    setName("");
    setStatus("active");
    setError("");
  }

  // ----------------------------------
  // Save Material
  // ----------------------------------
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      setError("Material name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const isEditing = !!editingMaterial;

      const endpoint = isEditing
        ? `/admin/materials/${editingMaterial.id}`
        : "/admin/materials";

      const response = await apiFetch(endpoint, {
        method: isEditing ? "PUT" : "POST",
        body: JSON.stringify({
          name: name.trim(),
          status,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Something went wrong.",
        );
      }

      setSuccess(
        isEditing
          ? "Material updated successfully."
          : "Material created successfully.",
      );

      closeModal();

      await loadMaterials();
    } catch (err: any) {
      setError(
        err.message || "Unable to save material.",
      );
    } finally {
      setSaving(false);
    }
  }

  // ----------------------------------
  // Delete Material
  // ----------------------------------
  async function deleteMaterial(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this material?",
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      const response = await apiFetch(
        `/admin/materials/${id}`,
        {
          method: "DELETE",
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to delete material.",
        );
      }

      setSuccess("Material deleted successfully.");

      await loadMaterials();
    } catch (err: any) {
      setError(
        err.message || "Unable to delete material.",
      );
    }
  }

  // ----------------------------------
  // Filter
  // ----------------------------------
  const filteredMaterials = materials.filter((material) =>
    material.name
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Materials
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage materials used for your products.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            <Plus size={18} />
            Add Material
          </button>
        </div>

        {/* Error */}
        {error && !showModal && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <Check size={17} />
            {success}
          </div>
        )}

        {/* Main Card */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          {/* Search */}
          <div className="border-b border-gray-100 p-4">
            <div className="relative max-w-md">

              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                placeholder="Search materials..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-black focus:bg-white"
              />

            </div>
          </div>

          {/* Loading */}
          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2
                  className="animate-spin"
                  size={20}
                />
                Loading materials...
              </div>
            </div>
          ) : filteredMaterials.length === 0 ? (

            /* Empty State */
            <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">

              <div className="mb-3 rounded-full bg-gray-100 p-4">
                <Plus
                  size={24}
                  className="text-gray-500"
                />
              </div>

              <h3 className="font-semibold text-gray-900">
                No materials found
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Add your first material to get started.
              </p>

              <button
                onClick={openAddModal}
                className="mt-4 rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white"
              >
                Add Material
              </button>

            </div>

          ) : (

            <>
              {/* Desktop Table */}
              <div className="hidden overflow-x-auto md:block">

                <table className="w-full">

                  <thead className="bg-gray-50">
                    <tr>

                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Material
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Status
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Created
                      </th>

                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Actions
                      </th>

                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">

                    {filteredMaterials.map(
                      (material) => (
                        <tr
                          key={material.id}
                          className="transition hover:bg-gray-50"
                        >

                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">
                              {material.name}
                            </div>

                            <div className="text-xs text-gray-400">
                              ID #{material.id}
                            </div>
                          </td>

                          <td className="px-6 py-4">

                            {material.status ===
                            "active" ? (

                              <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                Active
                              </span>

                            ) : (

                              <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                                Inactive
                              </span>

                            )}

                          </td>

                          <td className="px-6 py-4 text-sm text-gray-500">
                            {new Date(
                              material.created_at,
                            ).toLocaleDateString()}
                          </td>

                          <td className="px-6 py-4">

                            <div className="flex justify-end gap-2">

                              <button
                                onClick={() =>
                                  openEditModal(
                                    material,
                                  )
                                }
                                className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-black"
                                title="Edit"
                              >
                                <Pencil size={17} />
                              </button>

                              <button
                                onClick={() =>
                                  deleteMaterial(
                                    material.id,
                                  )
                                }
                                className="rounded-lg p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600"
                                title="Delete"
                              >
                                <Trash2 size={17} />
                              </button>

                            </div>

                          </td>

                        </tr>
                      ),
                    )}

                  </tbody>

                </table>

              </div>

              {/* Mobile Cards */}
              <div className="divide-y divide-gray-100 md:hidden">

                {filteredMaterials.map(
                  (material) => (

                    <div
                      key={material.id}
                      className="p-4"
                    >

                      <div className="flex items-start justify-between gap-4">

                        <div>

                          <h3 className="font-semibold text-gray-900">
                            {material.name}
                          </h3>

                          <p className="mt-1 text-xs text-gray-400">
                            ID #{material.id}
                          </p>

                        </div>

                        {material.status ===
                        "active" ? (

                          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                            Active
                          </span>

                        ) : (

                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                            Inactive
                          </span>

                        )}

                      </div>

                      <div className="mt-4 flex gap-2">

                        <button
                          onClick={() =>
                            openEditModal(material)
                          }
                          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 py-2 text-sm font-medium"
                        >
                          <Pencil size={15} />
                          Edit
                        </button>

                        <button
                          onClick={() =>
                            deleteMaterial(
                              material.id,
                            )
                          }
                          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-200 py-2 text-sm font-medium text-red-600"
                        >
                          <Trash2 size={15} />
                          Delete
                        </button>

                      </div>

                    </div>

                  ),
                )}

              </div>
            </>

          )}

        </div>
      </div>

      {/* Modal */}
      {showModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">

              <div>

                <h2 className="text-lg font-bold text-gray-900">
                  {editingMaterial
                    ? "Edit Material"
                    : "Add Material"}
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  {editingMaterial
                    ? "Update material details."
                    : "Create a new product material."}
                </p>

              </div>

              <button
                onClick={closeModal}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={20} />
              </button>

            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="p-6"
            >

              {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Name */}
              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Material Name
                </label>

                <input
                  type="text"
                  placeholder="e.g. Gold Plated"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  autoFocus
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-black"
                />

              </div>

              {/* Status */}
              <div className="mt-5">

                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Status
                </label>

                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(
                      e.target.value as
                        | "active"
                        | "inactive",
                    )
                  }
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black"
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
              <div className="mt-7 flex gap-3">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {saving && (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  )}

                  {editingMaterial
                    ? "Update Material"
                    : "Create Material"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}