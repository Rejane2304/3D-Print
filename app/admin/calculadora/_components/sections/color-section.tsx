"use client";

import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/toast-provider";
import { getBrightness } from "@/lib/color-utils";
import type { ColorSummary } from "@/lib/types";

interface ColorSectionProps {
  colors: ColorSummary[];
  selectedColorId: string | null;
  onSelectColor: (id: string | null) => void;
  onReload: () => Promise<void>;
}

const emptyForm = {
  name: "",
  code: "",
  hex: "#00FFFF",
};

type Mode = "create" | "edit";

export default function ColorSection({
  colors,
  selectedColorId,
  onSelectColor,
  onReload,
}: ColorSectionProps) {
  const { showToast } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [mode, setMode] = useState<Mode>("create");
  const [saving, setSaving] = useState(false);

  const selectedColor = useMemo(
    () => colors.find((color) => color.id === selectedColorId) ?? null,
    [colors, selectedColorId],
  );

  useEffect(() => {
    if (selectedColor) {
      setForm({
        name: selectedColor.name,
        code: selectedColor.code,
        hex: selectedColor.hex,
      });
      setMode("edit");
    } else {
      setForm(emptyForm);
      setMode("create");
    }
  }, [selectedColor]);

  const handleSave = async () => {
    const name = form.name.trim();
    const code = form.code.trim().toUpperCase();
    const hex =
      form.hex.startsWith("#") && form.hex.length > 1
        ? form.hex.toUpperCase()
        : `#${form.hex.toUpperCase()}`;
    if (!name || !code) {
      showToast("error", "Nombre y código son obligatorios");
      return;
    }
    setSaving(true);
    try {
      const payload = { name, code, hex };
      const response = await fetch(
        mode === "edit" && selectedColor
          ? `/api/admin/colors/${selectedColor.id}`
          : "/api/admin/colors",
        {
          method: mode === "edit" ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error ?? "Error guardando el color");
      }
      showToast(
        "success",
        mode === "edit" ? "Color actualizado" : "Color creado",
      );
      onSelectColor(json.id);
      await onReload();
      setMode("edit");
    } catch (error) {
      console.error(error);
      showToast("error", "No se pudo guardar el color");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (colorId: string) => {
    if (!confirm("¿Eliminar este color?")) return;
    try {
      const response = await fetch(`/api/admin/colors/${colorId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error ?? "Error eliminando color");
      }
      showToast("success", "Color eliminado");
      if (selectedColorId === colorId) {
        onSelectColor(colors[0]?.id ?? null);
      }
      await onReload();
    } catch (error) {
      console.error(error);
      showToast("error", "No se pudo eliminar el color");
    }
  };

  const handleReset = () => {
    onSelectColor(null);
    setForm(emptyForm);
    setMode("create");
  };

  return (
    <section className="border border-border bg-bg-secondary/40 rounded-3xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Color del navegador</h2>
        <span className="text-xs text-muted">Catálogo oficial</span>
      </div>
      <div className="rounded-2xl border border-border bg-bg-main/40 p-4 space-y-4">
        <div className="flex items-center gap-4">
          <div
            id="selected-color-preview"
            className="h-12 w-12 rounded-lg border shadow-inner"
            style={{
              background: form.hex,
              border:
                getBrightness(form.hex) > 200
                  ? "1px solid #475569"
                  : "1px solid transparent",
            }}
          />
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted">
              Color actual
            </p>
            <p className="text-lg font-semibold text-white">
              {selectedColor
                ? `${selectedColor.code} · ${selectedColor.name}`
                : form.name
                  ? `${form.code} · ${form.name}`
                  : "Nuevo color"}
            </p>
            <p className="text-xs uppercase tracking-[0.2em] text-muted">
              HEX: {form.hex.toUpperCase()}
            </p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="text-xs text-muted">
            <span className="block text-[0.6rem] uppercase tracking-[0.2em]">
              Nombre
            </span>
            <input
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
              className="mt-1 w-full rounded-2xl border border-border bg-bg-main px-3 py-2 text-sm"
              placeholder="Amarillo Basic"
            />
          </label>
          <label className="text-xs text-muted">
            <span className="block text-[0.6rem] uppercase tracking-[0.2em]">
              Código <span className="text-[0.6rem]">(Formato 001B)</span>
            </span>
            <input
              value={form.code}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  code: event.target.value.toUpperCase(),
                }))
              }
              className="mt-1 w-full rounded-2xl border border-border bg-bg-main px-3 py-2 text-sm"
              placeholder="004B"
            />
          </label>
          <label className="text-xs text-muted">
            <span className="block text-[0.6rem] uppercase tracking-[0.2em]">
              Color (HEX)
            </span>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="color"
                value={form.hex}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, hex: event.target.value }))
                }
                className="h-10 w-10 rounded-lg border border-border p-0"
              />
              <input
                value={form.hex}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, hex: event.target.value }))
                }
                className="flex-1 rounded-2xl border border-border bg-bg-main px-3 py-2 text-sm"
                placeholder="#00FFFF"
              />
            </div>
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-2xl border border-cyan bg-cyan/10 px-4 py-2 text-sm font-semibold text-cyan transition hover:bg-cyan/20 disabled:opacity-50"
          >
            Guardar color
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-2xl border border-border bg-bg-secondary/80 px-4 py-2 text-sm font-semibold text-muted transition hover:border-cyan"
          >
            Nuevo color
          </button>
        </div>
      </div>
      <div id="color-grid" className="grid grid-cols-4 sm:grid-cols-6 gap-3">
        {colors.map((color) => {
          const isActive = color.id === selectedColorId;
          return (
            <button
              key={color.id}
              type="button"
              onClick={() => onSelectColor(color.id)}
              className={`aspect-square h-16 w-full rounded-2xl transition ${
                isActive
                  ? "scale-105 shadow-[0_0_0_2px_rgba(14,165,233,0.45)]"
                  : ""
              }`}
              style={{
                background: color.hex,
                border:
                  isActive || getBrightness(color.hex) > 200
                    ? "1px solid #475569"
                    : "2px solid transparent",
              }}
            />
          );
        })}
      </div>
      <div className="space-y-3">
        {colors.map((color) => (
          <div
            key={color.id}
            className="grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-2xl border border-border bg-bg-main/60 p-3 text-sm"
          >
            <span
              className="h-10 w-10 rounded-full border border-white/20"
              style={{
                background: color.hex,
                borderColor:
                  getBrightness(color.hex) > 200 ? "#475569" : "#0f172a",
              }}
            />
            <div>
              <p className="font-semibold">{color.name}</p>
              <p className="text-xs text-muted">
                Código: {color.code} · HEX: {color.hex}
              </p>
            </div>
            <div className="flex flex-col gap-1 text-xs">
              <button
                type="button"
                onClick={() => onSelectColor(color.id)}
                className="rounded-full border border-border px-3 py-1 font-semibold text-cyan transition hover:bg-cyan/10"
              >
                Elegir
              </button>
              <button
                type="button"
                onClick={() => handleDelete(color.id)}
                className="rounded-full border border-border px-3 py-1 text-xs text-red-400 transition hover:border-red-400"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
