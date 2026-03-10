"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Palette,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

interface ColorType {
  id: string;
  name: string;
  code: string;
  hex: string;
  image?: string;
}

const emptyForm: Omit<ColorType, "id"> = {
  name: "",
  code: "",
  hex: "#00FFFF",
  image: "",
};

export default function AdminColorsClient() {
  const [colors, setColors] = useState<ColorType[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const loadColors = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/colors");
      const data = await res.json();
      if (Array.isArray(data)) setColors(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadColors();
  }, []);

  const notify = (type: "success" | "error", msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = editing
        ? `/api/admin/colors/${editing}`
        : "/api/admin/colors";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        notify("success", editing ? "Color actualizado" : "Color creado");
        setShowForm(false);
        setEditing(null);
        setForm(emptyForm);
        loadColors();
      } else {
        const err = await res.json();
        notify("error", err.error ?? "Error al guardar");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (c: ColorType) => {
    setForm({
      name: c.name,
      code: c.code,
      hex: c.hex,
      image: c.image ?? "",
    });
    setEditing(c.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este color?")) return;
    const res = await fetch(`/api/admin/colors/${id}`, { method: "DELETE" });
    if (res.ok) {
      notify("success", "Color eliminado");
      loadColors();
    } else notify("error", "Error al eliminar");
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Palette className="w-6 h-6 text-cyan" /> Colores
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Gestiona el catálogo global de colores disponibles para materiales.
          </p>
        </div>
        <button
          onClick={() => {
            setForm(emptyForm);
            setEditing(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-3 py-2 bg-cyan text-black rounded-lg text-sm font-semibold hover:bg-cyan-dim transition"
        >
          <Plus className="w-4 h-4" /> Nuevo color
        </button>
      </div>
      {feedback && (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg mb-4 text-sm ${feedback.type === "success" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}
        >
          {feedback.type === "success" ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertTriangle className="w-4 h-4" />
          )}
          {feedback.msg}
        </div>
      )}
      {showForm && (
        <div className="bg-bg-card border border-white/10 rounded-xl p-6 mb-6">
          <h2 className="font-semibold mb-4">
            {editing ? "Editar color" : "Nuevo color"}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="color-name"
                className="text-xs text-zinc-400 block mb-1"
              >
                Nombre
              </label>
              <input
                type="text"
                placeholder="Bambu Green"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-cyan"
              />
            </div>
            <div>
              <label
                htmlFor="color-code"
                className="text-xs text-zinc-400 block mb-1"
              >
                Código
              </label>
              <input
                type="text"
                placeholder="Pantone 123C"
                value={form.code}
                onChange={(e) =>
                  setForm((f) => ({ ...f, code: e.target.value }))
                }
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-cyan"
              />
            </div>
            <div>
              <label
                htmlFor="color-hex"
                className="text-xs text-zinc-400 block mb-1"
              >
                Color (hex)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.hex}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, hex: e.target.value }))
                  }
                  className="w-10 h-9 rounded cursor-pointer bg-transparent border border-white/10"
                />
                <input
                  type="text"
                  value={form.hex}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, hex: e.target.value }))
                  }
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:ring-1 focus:ring-cyan"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="color-image"
                className="text-xs text-zinc-400 block mb-1"
              >
                Imagen (opcional)
              </label>
              <input
                type="text"
                placeholder="URL de imagen"
                value={form.image}
                onChange={(e) =>
                  setForm((f) => ({ ...f, image: e.target.value }))
                }
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-cyan"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-cyan text-black rounded-lg text-sm font-semibold hover:bg-cyan-dim transition disabled:opacity-50"
            >
              {editing ? "Actualizar" : "Crear"}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setEditing(null);
              }}
              className="px-4 py-2 bg-white/5 rounded-lg text-sm hover:bg-white/10 transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-bg-card border border-white/5 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-white/5">
              <tr className="text-zinc-400 text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-3">Color</th>
                <th className="text-left px-4 py-3">Código</th>
                <th className="text-left px-4 py-3">Hex</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {colors.map((c) => (
                <tr key={c.id} className="hover:bg-white/[0.02] transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-5 h-5 rounded-full inline-block border border-white/20"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span className="font-semibold">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{c.code}</td>
                  <td className="px-4 py-3 font-mono">{c.hex}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => handleEdit(c)}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition text-zinc-400 hover:text-white"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 transition text-zinc-400 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {colors.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-zinc-500 text-sm"
                  >
                    No hay colores. Crea el primero.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
