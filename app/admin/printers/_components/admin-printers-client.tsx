"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { useToast } from "@/components/toast-provider";
import type { PrinterType } from "@/lib/types";

const PRINTER_STATUS_OPTIONS = [
  { key: "available", label: "Disponible" },
  { key: "busy", label: "En uso" },
  { key: "maintenance", label: "Mantenimiento" },
] as const;

type PrinterStatusKey = (typeof PRINTER_STATUS_OPTIONS)[number]["key"];

const emptyForm = {
  name: "",
  location: "",
  status: "available" as PrinterStatusKey,
};

export default function AdminPrintersClient() {
  const { showToast } = useToast();
  const [printers, setPrinters] = useState<PrinterType[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadPrinters = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/printers", {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("No se pudieron cargar las impresoras");
      }
      const data = await response.json();
      setPrinters(data?.printers ?? []);
    } catch (error) {
      console.error(error);
      showToast?.("error", "Error al cargar las impresoras");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadPrinters();
  }, [loadPrinters]);

  const statusCounts = useMemo(() => {
    const counts: Record<PrinterStatusKey, number> = {
      available: 0,
      busy: 0,
      maintenance: 0,
    };
    printers.forEach((printer) => {
      if (printer.status in counts) {
        counts[printer.status as PrinterStatusKey] += 1;
      }
    });
    return counts;
  }, [printers]);

  const handleEdit = (printer: PrinterType) => {
    setMode("edit");
    setEditingId(printer.id);
    const statusMatch =
      PRINTER_STATUS_OPTIONS.find((option) => option.key === printer.status)
        ?.key ?? "available";
    setForm({
      name: printer.name,
      location: printer.location ?? "",
      status: statusMatch,
    });
  };

  const resetForm = () => {
    setMode("create");
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (event?: FormEvent<HTMLFormElement>) => {
    if (event) event.preventDefault();
    if (!form.name.trim()) {
      showToast?.("error", "El nombre es obligatorio");
      return;
    }
    setSubmitting(true);
    try {
      const isEditing = mode === "edit" && editingId;
      const response = await fetch(
        isEditing
          ? `/api/admin/printers/manage/${editingId}`
          : "/api/admin/printers/manage",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim(),
            location: form.location.trim() || null,
            status: form.status,
          }),
        },
      );
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error ?? "No se pudo guardar");
      }
      showToast?.(
        "success",
        isEditing ? "Impresora actualizada" : "Impresora creada",
      );
      resetForm();
      loadPrinters();
    } catch (error) {
      console.error(error);
      showToast?.("error", "Error guardando la impresora");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm("¿Eliminar esta impresora? Esta acción no se puede deshacer.")
    ) {
      return;
    }
    setDeletingId(id);
    try {
      const response = await fetch(`/api/admin/printers/manage/${id}`, {
        method: "DELETE",
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error ?? "No se pudo eliminar");
      }
      showToast?.("success", "Impresora eliminada");
      loadPrinters();
    } catch (error) {
      console.error(error);
      showToast?.("error", "Error eliminando la impresora");
    } finally {
      setDeletingId(null);
    }
  };

  const headerStats = [
    {
      label: "Impresoras totales",
      value: printers.length,
      helper: "Fuentes físicas conectadas",
    },
    {
      label: "Disponibles",
      value: statusCounts.available,
      helper: "Lista para producción",
    },
    {
      label: "En uso",
      value: statusCounts.busy,
      helper: "Pedidos activos",
    },
    {
      label: "Mantenimiento",
      value: statusCounts.maintenance,
      helper: "Por revisar",
    },
  ];

  const statusBadge = (status: string) => {
    const option = PRINTER_STATUS_OPTIONS.find((item) => item.key === status);
    const baseStyles =
      "inline-flex items-center gap-1 px-3 py-0.5 text-[0.7rem] font-semibold rounded-full";
    if (!option) {
      return (
        <span className={`${baseStyles} bg-white/5 text-white`}>{status}</span>
      );
    }
    const colorMap: Record<PrinterStatusKey, string> = {
      available:
        "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20",
      busy: "bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/20",
      maintenance: "bg-rose-500/10 text-rose-300 ring-1 ring-rose-500/20",
    };
    return (
      <span className={`${baseStyles} ${colorMap[option.key] ?? ""}`}>
        {option.label}
      </span>
    );
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-muted">
          <Plus className="w-4 h-4 text-cyan" />
          Panel de impresoras
        </div>
        <h1 className="text-3xl font-semibold">Gestiona las impresoras</h1>
        <p className="text-sm text-muted">
          Crea, edita y elimina impresoras sin tocar la tienda pública.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {headerStats.map((item) => (
          <article
            key={item.label}
            className="rounded-2xl border border-border bg-bg-secondary/30 p-4 shadow-sm"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-muted">
              {item.label}
            </p>
            <p className="text-3xl font-bold">{item.value}</p>
            <p className="text-xs text-muted">{item.helper}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.25fr]">
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-3xl border border-border bg-bg-secondary/40 p-6 shadow-base"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted">
                Formulario
              </p>
              <h2 className="text-lg font-semibold">
                {mode === "edit" ? "Editar impresora" : "Nueva impresora"}
              </h2>
            </div>
            <button
              type="button"
              onClick={resetForm}
              disabled={submitting}
              className="text-xs text-muted hover:text-white transition"
            >
              Limpiar
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-xs text-muted">
              <span className="block text-[0.7rem] uppercase tracking-[0.3em]">
                Nombre
              </span>
              <input
                type="text"
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
                className="mt-1 w-full rounded-2xl border border-border bg-bg-main px-3 py-2 text-sm"
                placeholder="Ej. Form 4+"
              />
            </label>
            <label className="text-xs text-muted">
              <span className="block text-[0.7rem] uppercase tracking-[0.3em]">
                Ubicación
              </span>
              <input
                type="text"
                value={form.location}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    location: event.target.value,
                  }))
                }
                className="mt-1 w-full rounded-2xl border border-border bg-bg-main px-3 py-2 text-sm"
                placeholder="Taller central, Hangar 2, ..."
              />
            </label>
          </div>
          <label className="text-xs text-muted">
            <span className="block text-[0.7rem] uppercase tracking-[0.3em]">
              Estado
            </span>
            <select
              value={form.status}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  status: event.target.value as PrinterStatusKey,
                }))
              }
              className="mt-1 w-full rounded-2xl border border-border bg-bg-main px-3 py-2 text-sm"
            >
              {PRINTER_STATUS_OPTIONS.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-2xl border border-cyan bg-cyan/10 px-4 py-3 text-sm font-semibold text-cyan transition hover:bg-cyan/20 disabled:opacity-60"
            >
              {submitting
                ? mode === "edit"
                  ? "Actualizando..."
                  : "Creando..."
                : mode === "edit"
                  ? "Guardar cambios"
                  : "Crear impresora"}
            </button>
            {mode === "edit" && (
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 rounded-2xl border border-border bg-bg-main px-4 py-3 text-sm font-semibold text-muted transition hover:border-cyan"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

        <div className="flex h-full flex-col gap-4">
          <div className="rounded-3xl border border-border bg-bg-secondary/40 p-6 shadow-base">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Listado de impresoras</h2>
              <button
                type="button"
                onClick={loadPrinters}
                disabled={loading}
                className="flex items-center gap-2 rounded-2xl border border-border px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-muted hover:border-cyan transition disabled:opacity-40"
              >
                <RefreshCw className="w-4 h-4" />
                Actualizar
              </button>
            </div>
            <div className="mt-4 space-y-3 text-sm text-muted">
              {loading ? (
                <p>Cargando impresoras...</p>
              ) : printers.length === 0 ? (
                <p>No hay impresoras registradas aún.</p>
              ) : (
                printers.map((printer) => (
                  <div
                    key={printer.id}
                    className="flex items-center justify-between rounded-2xl border border-border/80 bg-bg-main/40 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold">{printer.name}</p>
                      <p className="text-xs text-muted">
                        {printer.location ?? "Ubicación no definida"}
                      </p>
                      <div className="mt-2">{statusBadge(printer.status)}</div>
                      <p className="text-[0.65rem] text-muted">
                        Actualizado{" "}
                        {new Date(printer.updatedAt).toLocaleDateString(
                          "es-ES",
                        )}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(printer)}
                        className="rounded-2xl border border-border px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-cyan transition hover:border-cyan"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(printer.id)}
                        disabled={deletingId === printer.id}
                        className="rounded-2xl border border-rose-500/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-rose-300 transition hover:border-rose-400 disabled:opacity-40"
                      >
                        {deletingId === printer.id
                          ? "Eliminando..."
                          : "Eliminar"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
