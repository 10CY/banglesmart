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

type Color = {
  id: number;
  name: string;
  display_name: string | null;
  hex_code: string | null;
  sort_order: number;
  status: string;
};

export default function ColorsPage() {
  const [colors, setColors] = useState<Color[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Color | null>(null);

  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [hexCode, setHexCode] = useState("#000000");
  const [sortOrder, setSortOrder] = useState("0");
  const [status, setStatus] = useState("active");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Fetch Colors
  |--------------------------------------------------------------------------
  */

  const fetchColors = useCallback(async () => {
    try {
      setLoading(true);

      const response = await apiFetch("/admin/colors");

      const data = await response.json();

      if (!response.ok) {
        console.error("Failed to fetch colors:", data);
        return;
      }

      setColors(data.data || []);
    } catch (error) {
      console.error("Unable to load colors:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchColors();
  }, [fetchColors]);

  /*
  |--------------------------------------------------------------------------
  | Reset Form
  |--------------------------------------------------------------------------
  */

  function resetForm() {
    setName("");
    setDisplayName("");
    setHexCode("#000000");
    setSortOrder("0");
    setStatus("active");
    setEditing(null);
    setError("");
  }

  /*
  |--------------------------------------------------------------------------
  | Open Create
  |--------------------------------------------------------------------------
  */

  function openCreate() {
    resetForm();
    setShowForm(true);
  }

  /*
  |--------------------------------------------------------------------------
  | Open Edit
  |--------------------------------------------------------------------------
  */

  function openEdit(color: Color) {
    setEditing(color);

    setName(color.name);
    setDisplayName(color.display_name || "");
    setHexCode(color.hex_code || "#000000");
    setSortOrder(String(color.sort_order));
    setStatus(color.status);

    setError("");
    setShowForm(true);
  }

  /*
  |--------------------------------------------------------------------------
  | Close Form
  |--------------------------------------------------------------------------
  */

  function closeForm() {
    setShowForm(false);
    resetForm();
  }

  /*
  |--------------------------------------------------------------------------
  | Add / Update Color
  |--------------------------------------------------------------------------
  */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
      const endpoint = editing
        ? `/admin/colors/${editing.id}`
        : "/admin/colors";

      const response = await apiFetch(endpoint, {
        method: editing ? "PUT" : "POST",

        body: JSON.stringify({
          name,
          display_name: displayName,
          hex_code: hexCode,
          sort_order: Number(sortOrder),
          status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const validationErrors = data.errors as
          | Record<string, string[]>
          | undefined;

        const firstValidationError =
          validationErrors
            ? Object.values(validationErrors)[0]?.[0]
            : undefined;

        setError(
          firstValidationError ||
            data.message ||
            "Something went wrong."
        );

        return;
      }

      closeForm();

      await fetchColors();
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setSaving(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Delete Color
  |--------------------------------------------------------------------------
  */

  async function deleteColor(id: number) {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this color?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const response = await apiFetch(
        `/admin/colors/${id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        window.alert(
          data.message || "Unable to delete color."
        );

        return;
      }

      await fetchColors();
    } catch {
      window.alert(
        "Unable to connect to the server."
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Page
  |--------------------------------------------------------------------------
  */

  return (
    <div>
      {/* Header */}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Colors
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage product colors for BanglesMart.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-black"
        >
          <Plus size={18} />

          Add color
        </button>
      </div>

      {/* Table */}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Color
              </th>

              <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Display Name
              </th>

              <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Color Code
              </th>

              <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Status
              </th>

              <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Order
              </th>

              <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-12 text-center text-sm text-gray-500"
                >
                  Loading colors...
                </td>
              </tr>
            ) : colors.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-12 text-center"
                >
                  <p className="text-sm font-medium text-gray-700">
                    No colors added yet.
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Click "Add color" to create your
                    first product color.
                  </p>
                </td>
              </tr>
            ) : (
              colors.map((color) => (
                <tr
                  key={color.id}
                  className="transition hover:bg-gray-50"
                >
                  {/* Name */}

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span
                        className="h-8 w-8 shrink-0 rounded-full border border-gray-300 shadow-sm"
                        style={{
                          backgroundColor:
                            color.hex_code ||
                            "#ffffff",
                        }}
                      />

                      <span className="font-medium text-gray-900">
                        {color.name}
                      </span>
                    </div>
                  </td>

                  {/* Display Name */}

                  <td className="px-5 py-4 text-sm text-gray-600">
                    {color.display_name || "-"}
                  </td>

                  {/* HEX */}

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-5 w-5 rounded border border-gray-300"
                        style={{
                          backgroundColor:
                            color.hex_code ||
                            "#ffffff",
                        }}
                      />

                      <span className="font-mono text-sm text-gray-600">
                        {color.hex_code || "-"}
                      </span>
                    </div>
                  </td>

                  {/* Status */}

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                        color.status === "active"
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {color.status}
                    </span>
                  </td>

                  {/* Sort Order */}

                  <td className="px-5 py-4 text-sm text-gray-600">
                    {color.sort_order}
                  </td>

                  {/* Actions */}

                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          openEdit(color)
                        }
                        title="Edit"
                        className="rounded-lg border border-gray-200 p-2 text-gray-700 transition hover:bg-gray-100"
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          deleteColor(color.id)
                        }
                        title="Delete"
                        className="rounded-lg border border-gray-200 p-2 text-red-600 transition hover:border-red-200 hover:bg-red-50"
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

      {/* Drawer */}

      {showForm && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
          <div className="h-full w-full max-w-lg overflow-y-auto bg-white shadow-2xl">
            {/* Drawer Header */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {editing
                    ? "Edit color"
                    : "Add color"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {editing
                    ? "Update product color details."
                    : "Create a new product color."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}

            <form
              onSubmit={handleSubmit}
              className="space-y-6 p-6"
            >
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Name */}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Color Name
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Example: Maroon"
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-600 focus:ring-1 focus:ring-gray-600"
                />
              </div>

              {/* Display Name */}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Display Name
                </label>

                <input
                  type="text"
                  value={displayName}
                  onChange={(event) =>
                    setDisplayName(
                      event.target.value
                    )
                  }
                  placeholder="Example: Maroon"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-600 focus:ring-1 focus:ring-gray-600"
                />

                <p className="mt-1.5 text-xs text-gray-500">
                  Name shown to customers on the
                  website.
                </p>
              </div>

              {/* Color Picker */}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Color
                </label>

                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={hexCode}
                    onChange={(event) =>
                      setHexCode(
                        event.target.value
                      )
                    }
                    className="h-11 w-16 cursor-pointer rounded-lg border border-gray-300 bg-white p-1"
                  />

                  <input
                    type="text"
                    value={hexCode}
                    onChange={(event) =>
                      setHexCode(
                        event.target.value
                      )
                    }
                    placeholder="#800020"
                    maxLength={7}
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 font-mono text-sm uppercase text-gray-900 outline-none transition focus:border-gray-600 focus:ring-1 focus:ring-gray-600"
                  />
                </div>

                <div className="mt-3 flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <span
                    className="h-10 w-10 rounded-full border border-gray-300 shadow-sm"
                    style={{
                      backgroundColor: hexCode,
                    }}
                  />

                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      Color Preview
                    </p>

                    <p className="font-mono text-xs uppercase text-gray-500">
                      {hexCode}
                    </p>
                  </div>
                </div>
              </div>

              {/* Sort Order */}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Sort Order
                </label>

                <input
                  type="number"
                  min="0"
                  value={sortOrder}
                  onChange={(event) =>
                    setSortOrder(
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-600 focus:ring-1 focus:ring-gray-600"
                />

                <p className="mt-1.5 text-xs text-gray-500">
                  Lower numbers appear first.
                </p>
              </div>

              {/* Status */}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Status
                </label>

                <select
                  value={status}
                  onChange={(event) =>
                    setStatus(
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-600 focus:ring-1 focus:ring-gray-600"
                >
                  <option value="active">
                    Active
                  </option>

                  <option value="inactive">
                    Inactive
                  </option>
                </select>
              </div>

              {/* Actions */}

              <div className="flex justify-end gap-3 border-t border-gray-200 pt-6">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editing
                    ? "Update color"
                    : "Add color"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}