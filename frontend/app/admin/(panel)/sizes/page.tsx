"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { apiFetch } from "@/lib/api";

type Size = {
  id: number;
  name: string;
  display_name: string | null;
  sort_order: number;
  status: string;
};

export default function SizesPage() {
  const [sizes, setSizes] = useState<Size[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Size | null>(null);

  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [status, setStatus] = useState("active");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchSizes = useCallback(async () => {
    try {
      const response = await apiFetch("/admin/sizes");

      const data = await response.json();

      if (response.ok) {
        setSizes(data.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSizes();
  }, [fetchSizes]);

  function resetForm() {
    setName("");
    setDisplayName("");
    setSortOrder("0");
    setStatus("active");
    setEditing(null);
    setError("");
  }

  function openCreate() {
    resetForm();
    setShowForm(true);
  }

  function openEdit(size: Size) {
    setEditing(size);

    setName(size.name);
    setDisplayName(size.display_name || "");
    setSortOrder(String(size.sort_order));
    setStatus(size.status);

    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    resetForm();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    setSaving(true);
    setError("");

    try {
      const endpoint = editing
        ? `/admin/sizes/${editing.id}`
        : "/admin/sizes";

      const response = await apiFetch(endpoint, {
        method: editing ? "PUT" : "POST",

        body: JSON.stringify({
          name,
          display_name: displayName,
          sort_order: Number(sortOrder),
          status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errors = data.errors as
          | Record<string, string[]>
          | undefined;

        const firstError =
          errors &&
          Object.values(errors)[0]?.[0];

        setError(
          firstError ||
            data.message ||
            "Something went wrong."
        );

        return;
      }

      closeForm();

      await fetchSizes();

    } catch {
      setError("Unable to connect to server.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteSize(id: number) {
    if (!window.confirm("Delete this size?")) {
      return;
    }

    await apiFetch(`/admin/sizes/${id}`, {
      method: "DELETE",
    });

    await fetchSizes();
  }

  return (
    <div>

      <div className="mb-6 flex items-center justify-between">

        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Sizes
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage available bangle sizes.
          </p>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white"
        >
          <Plus size={18} />

          Add size
        </button>

      </div>


      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">

        <table className="w-full">

          <thead className="border-b border-gray-200 bg-gray-50">

            <tr>

              <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Size
              </th>

              <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Display Name
              </th>

              <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Status
              </th>

              <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Order
              </th>

              <th className="px-5 py-3 text-right text-xs font-medium uppercase text-gray-500">
                Actions
              </th>

            </tr>

          </thead>


          <tbody className="divide-y divide-gray-200">

            {loading ? (

              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-10 text-center text-sm text-gray-500"
                >
                  Loading sizes...
                </td>
              </tr>

            ) : sizes.length === 0 ? (

              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-12 text-center text-sm text-gray-500"
                >
                  No sizes added yet.
                </td>
              </tr>

            ) : (

              sizes.map((size) => (

                <tr
                  key={size.id}
                  className="hover:bg-gray-50"
                >

                  <td className="px-5 py-4 font-medium text-gray-900">
                    {size.name}
                  </td>

                  <td className="px-5 py-4 text-sm text-gray-600">
                    {size.display_name}
                  </td>

                  <td className="px-5 py-4">

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        size.status === "active"
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {size.status}
                    </span>

                  </td>

                  <td className="px-5 py-4 text-sm text-gray-600">
                    {size.sort_order}
                  </td>

                  <td className="px-5 py-4">

                    <div className="flex justify-end gap-2">

                      <button
                        onClick={() => openEdit(size)}
                        className="rounded-lg border p-2 hover:bg-gray-100"
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        onClick={() =>
                          deleteSize(size.id)
                        }
                        className="rounded-lg border p-2 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                      </button>

                    </div>

                  </td>

                </tr>

              ))
            )}

          </tbody>

        </table>

      </div>


      {showForm && (

        <div className="fixed inset-0 z-50 flex justify-end bg-black/30">

          <div className="h-full w-full max-w-md overflow-y-auto bg-white shadow-xl">

            <div className="flex items-center justify-between border-b px-6 py-5">

              <h2 className="text-lg font-semibold">
                {editing ? "Edit size" : "Add size"}
              </h2>

              <button
                onClick={closeForm}
                className="rounded-lg p-2 hover:bg-gray-100"
              >
                <X size={20} />
              </button>

            </div>


            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >

              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}


              <div>

                <label className="mb-2 block text-sm font-medium">
                  Size
                </label>

                <input
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  placeholder="2.6"
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none"
                />

              </div>


              <div>

                <label className="mb-2 block text-sm font-medium">
                  Display Name
                </label>

                <input
                  value={displayName}
                  onChange={(e) =>
                    setDisplayName(e.target.value)
                  }
                  placeholder='2.6"'
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none"
                />

              </div>


              <div>

                <label className="mb-2 block text-sm font-medium">
                  Sort Order
                </label>

                <input
                  type="number"
                  min="0"
                  value={sortOrder}
                  onChange={(e) =>
                    setSortOrder(e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5"
                />

              </div>


              <div>

                <label className="mb-2 block text-sm font-medium">
                  Status
                </label>

                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5"
                >

                  <option value="active">
                    Active
                  </option>

                  <option value="inactive">
                    Inactive
                  </option>

                </select>

              </div>


              <div className="flex justify-end gap-3 border-t pt-5">

                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-lg border px-4 py-2.5 text-sm"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editing
                    ? "Update size"
                    : "Add size"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}