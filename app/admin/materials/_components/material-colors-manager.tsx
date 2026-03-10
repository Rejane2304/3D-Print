"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
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

interface MaterialColorType {
  id: string;
  color: ColorType;
  stock: number;
  image?: string;
}

export default function MaterialColorsManager({
  materialId,
}: {
  readonly materialId: string;
}) {
  const [materialColors, setMaterialColors] = useState<MaterialColorType[]>([]);
  const [allColors, setAllColors] = useState<ColorType[]>([]);
  // Eliminado: loading no se usa
  const [adding, setAdding] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [stock, setStock] = useState("0");
  const [image, setImage] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const loadMaterialColors = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/admin/material-colors?materialId=${materialId}`,
      );
      const data = await res.json();
      if (Array.isArray(data)) setMaterialColors(data);
    } catch (e) {
      console.error("Error al cargar colores del material", e);
    }
  }, [materialId]);
  // Eliminar color asociado
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/material-colors/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        notify("success", "Color eliminado");
        loadMaterialColors();
      } else {
        const err = await res.json();
        notify("error", err.error ?? "Error al eliminar color");
      }
    } catch (e) {
      console.error("Error de red al eliminar color", e);
      notify("error", "Error de red al eliminar color");
    }
  };

  const loadAllColors = async () => {
    const res = await fetch("/api/admin/colors");
    const data = await res.json();
    if (Array.isArray(data)) setAllColors(data);
  };

  useEffect(() => {
    loadMaterialColors();
    loadAllColors();
    
  }, [materialId, loadMaterialColors]);

  const notify = (type: "success" | "error", msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleAdd = async () => {
    setAdding(true);
    try {
      const res = await fetch("/api/admin/material-colors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materialId,
          colorId: selectedColor,
          stock: Number(stock),
          image: image || null,
        }),
      });
      if (res.ok) {
        notify("success", "Color asociado");
        setSelectedColor("");
        setStock("0");
        setImage("");
        loadMaterialColors();
      } else {
        const err = await res.json();
        notify("error", err.error ?? "Error al asociar color");
      }
    } finally {
      setAdding(false);
    }
  };

  // Eliminado: código fuera de función

  return (
    <div className="mt-8">
      <h3 className="font-semibold mb-2 flex items-center gap-2">
        <Palette className="w-5 h-5 text-cyan" /> Colores disponibles para este
        material
      </h3>
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
      <div className="mb-4 flex gap-2 items-end">
        <select
          value={selectedColor}
          onChange={(e) => setSelectedColor(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Selecciona color</option>
          {allColors
            .filter((c) => !materialColors.some((mc) => mc.color.id === c.id))
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code})
              </option>
            ))}
        </select>
        <input
          type="number"
          min="0"
          placeholder="Stock (g)"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          className="w-32 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm"
        />
        <input
          type="text"
          placeholder="Imagen (opcional)"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          className="w-48 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm"
        />
        <button
          onClick={handleAdd}
          disabled={adding || !selectedColor}
          className="px-4 py-2 bg-cyan text-black rounded-lg text-sm font-semibold hover:bg-cyan-dim transition disabled:opacity-50"
        >
          <Plus className="w-4 h-4" /> Asociar
        </button>
      </div>
      <div className="bg-bg-card border border-white/5 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-white/5">
            <tr className="text-zinc-400 text-xs uppercase tracking-wide">
              <th className="text-left px-4 py-3">Color</th>
              <th className="text-left px-4 py-3">Código</th>
              <th className="text-left px-4 py-3">Hex</th>
              <th className="text-right px-4 py-3">Stock (g)</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {materialColors.map((mc) => (
              <tr key={mc.id} className="hover:bg-white/[0.02] transition">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-5 h-5 rounded-full inline-block border border-white/20"
                      style={{ backgroundColor: mc.color.hex }}
                    />
                    <span className="font-semibold">{mc.color.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">{mc.color.code}</td>
                <td className="px-4 py-3 font-mono">{mc.color.hex}</td>
                <td className="px-4 py-3 text-right">{mc.stock}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDelete(mc.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 transition text-zinc-400 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {materialColors.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-zinc-500 text-sm"
                >
                  No hay colores asociados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

