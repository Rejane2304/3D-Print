"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Palette, CheckCircle, AlertTriangle } from "lucide-react";
import { getBrightness } from "@/lib/color-utils";
import type { ColorSummary } from "@/lib/types";

interface MaterialColorType {
  id: string;
  color: ColorSummary;
  stock: number;
  image?: string;
}

export default function MaterialColorsManager({ materialId }: { readonly materialId: string }) {
  const [materialColors, setMaterialColors] = useState<MaterialColorType[]>([]);
  const [allColors, setAllColors] = useState<ColorSummary[]>([]);
  const [adding, setAdding] = useState(false);
  const [selectedColorId, setSelectedColorId] = useState("");
  const [stock, setStock] = useState("0");
  const [image, setImage] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const loadMaterialColors = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/material-colors?materialId=${materialId}`);
      const data = await res.json();
      if (Array.isArray(data)) setMaterialColors(data);
    } catch (error) {
      console.error("Error al cargar colores del material", error);
    }
  }, [materialId]);

  const loadAllColors = async () => {
    try {
      const res = await fetch("/api/admin/colors");
      const data = await res.json();
      if (Array.isArray(data)) setAllColors(data);
    } catch (error) {
      console.error("Error al cargar el catálogo de colores", error);
    }
  };

  useEffect(() => {
    loadMaterialColors();
    loadAllColors();
  }, [materialId, loadMaterialColors]);

  const notify = (type: "success" | "error", msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3500);
  };

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
    } catch (error) {
      console.error("Error de red al eliminar color", error);
      notify("error", "Error de red al eliminar color");
    }
  };

  const handleAdd = async () => {
    if (!selectedColorId) return;
    setAdding(true);
    try {
      const res = await fetch("/api/admin/material-colors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materialId,
          colorId: selectedColorId,
          stock: Number(stock),
          image: image || null,
        }),
      });
      if (res.ok) {
        notify("success", "Color asociado");
        setSelectedColorId("");
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

  const sortedCatalog = useMemo(() => {
    return [...allColors].sort((a, b) => {
      const codeDiff = a.code.localeCompare(b.code, undefined, {
        numeric: true,
      });
      if (codeDiff !== 0) return codeDiff;
      return a.name.localeCompare(b.name);
    });
  }, [allColors]);

  const availableCatalog = useMemo(
    () => sortedCatalog.filter((color) => !materialColors.some((mc) => mc.color.id === color.id)),
    [materialColors, sortedCatalog]
  );

  const selectedColorDetails = useMemo(
    () => allColors.find((color) => color.id === selectedColorId) ?? null,
    [allColors, selectedColorId]
  );

  useEffect(() => {
    if (selectedColorId) return;
    if (availableCatalog.length) {
      setSelectedColorId(availableCatalog[0].id);
    } else {
      setSelectedColorId("");
    }
  }, [selectedColorId, availableCatalog]);

  const previewHex = selectedColorDetails?.hex ?? "#00FFFF";
  const previewLabel = selectedColorDetails
    ? `${selectedColorDetails.code} · ${selectedColorDetails.name}`
    : "Selecciona un color";
  const previewBorder =
    getBrightness(previewHex) > 200 ? "1px solid #475569" : "1px solid transparent";

  return (
    <div className="mt-8 space-y-6">
      <h3 className="font-semibold mb-2 flex items-center gap-2">
        <Palette className="w-5 h-5 text-cyan" /> Colores disponibles para este material
      </h3>
      {feedback && (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg mb-4 text-sm ${
            feedback.type === "success"
              ? "bg-green-500/10 text-green-400"
              : "bg-red-500/10 text-red-400"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertTriangle className="w-4 h-4" />
          )}
          {feedback.msg}
        </div>
      )}
      <div className="space-y-4">
        <div className="rounded-2xl border border-white/5 bg-bg-card p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-4 border-b border-white/5 pb-4">
            <span
              className="h-16 w-16 rounded-2xl border shadow-inner"
              style={{ background: previewHex, border: previewBorder }}
            />
            <div>
              <p className="text-[0.6rem] uppercase tracking-[0.4em] text-muted">
                Color seleccionado
              </p>
              <p className="text-lg font-semibold text-white">{previewLabel}</p>
              <p className="text-[0.65rem] uppercase tracking-[0.3em] text-muted">
                HEX: {previewHex.toUpperCase()}
              </p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-[1.8fr,1fr]">
            <div className="grid gap-3">
              <select
                value={selectedColorId}
                onChange={(e) => setSelectedColorId(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-3 py-2 text-sm"
              >
                <option value="">Selecciona color</option>
                {availableCatalog.map((color) => (
                  <option key={color.id} value={color.id}>
                    {color.name} ({color.code})
                  </option>
                ))}
              </select>
              <div className="grid gap-2 md:grid-cols-2">
                <input
                  type="number"
                  min="0"
                  placeholder="Stock (g)"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  placeholder="Imagen (opcional)"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="flex items-end justify-end">
              <button
                onClick={handleAdd}
                disabled={adding || !selectedColorId}
                className="flex items-center gap-2 px-4 py-2 bg-cyan text-black rounded-2xl text-sm font-semibold hover:bg-cyan-dim transition disabled:opacity-50"
              >
                <Plus className="w-4 h-4" /> Asociar
              </button>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-white/5 bg-bg-secondary/30 p-4 space-y-3">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-muted">
            <span>Colores libres</span>
            <span>{availableCatalog.length} disponibles</span>
          </div>
          {availableCatalog.length ? (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {availableCatalog.map((color) => {
                const brightness = getBrightness(color.hex);
                return (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => setSelectedColorId(color.id)}
                    className={`aspect-square h-16 w-full rounded-2xl transition ${
                      color.id === selectedColorId
                        ? "scale-105 shadow-[0_0_0_2px_rgba(14,165,233,0.45)]"
                        : ""
                    }`}
                    style={{
                      background: color.hex,
                      border:
                        color.id === selectedColorId || brightness > 200
                          ? "1px solid #475569"
                          : "2px solid transparent",
                    }}
                  >
                    <span className="sr-only">{color.name}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-xs text-zinc-500">
              Todos los colores ya están asociados.
            </p>
          )}
        </div>
        <div className="rounded-2xl border border-white/5 bg-bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted">
              Catálogo completo
            </p>
            <span className="text-xs text-zinc-500">Total: {sortedCatalog.length}</span>
          </div>
          <div className="grid gap-3">
            {sortedCatalog.map((color) => {
              const isAssociated = materialColors.some((mc) => mc.color.id === color.id);
              const isActive = color.id === selectedColorId;
              const brightness = getBrightness(color.hex);
              return (
                <div
                  key={color.id}
                  className={`grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border border-white/5 bg-bg-main/60 p-3 transition ${
                    isActive ? "ring-2 ring-cyan/60" : ""
                  }`}
                >
                  <span
                    className="h-10 w-10 rounded-full border"
                    style={{
                      background: color.hex,
                      borderColor: brightness > 200 ? "#475569" : "rgba(255,255,255,0.25)",
                    }}
                  />
                  <div>
                    <p className="text-sm font-semibold text-white">{color.name}</p>
                    <p className="text-[0.65rem] uppercase tracking-[0.3em] text-muted">
                      Código: {color.code} · HEX: {color.hex.toUpperCase()}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {isAssociated ? (
                      <span className="text-[0.65rem] font-semibold text-emerald-300">
                        Asociado
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedColorId(color.id)}
                        className="rounded-full border border-cyan/60 px-3 py-1 text-[0.65rem] font-semibold text-cyan transition hover:bg-cyan/10"
                      >
                        Seleccionar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
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
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-500 text-sm">
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
