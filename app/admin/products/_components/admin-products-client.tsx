"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Edit, Trash2, X, Package } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/components/toast-provider";
import { calculatePriceFromDimensions, calculateWeight } from "@/lib/price-calculator";
import type { ProductType } from "@/lib/types";
import { useAdminCatalog } from "@/app/admin/_hooks/use-admin-catalog";

interface ProductFormData {
  name: string;
  description: string;
  category: string;
  material: string;
  basePricePerGram: string;
  density: string;
  minDimX: string;
  minDimY: string;
  minDimZ: string;
  maxDimX: string;
  maxDimY: string;
  maxDimZ: string;
  defaultDimX: string;
  defaultDimY: string;
  defaultDimZ: string;
  printTimeMinutes: string;
  modelFillFactor: string;
  finishCost: string;
  images: string[];
  colors: string[];
  featured: boolean;
  stock: string;
  colorId: string;
  printerId: string;
  machineAmortizationPerHour: string;
  maintenanceCostPerHour: string;
  electricityRate: string;
  printerPowerKw: string;
  finishOption: string;
  postProcessMinutes: string;
  laborRate: string;
  wastePct: string;
  marginPct: string;
  customCost: string;
}

const initialFormData: ProductFormData = {
  name: "",
  description: "",
  category: "Decoracion",
  material: "PLA",
  basePricePerGram: "0.02",
  density: "1.24",
  minDimX: "10",
  minDimY: "10",
  minDimZ: "10",
  maxDimX: "300",
  maxDimY: "300",
  maxDimZ: "300",
  defaultDimX: "50",
  defaultDimY: "50",
  defaultDimZ: "50",
  printTimeMinutes: "60",
  modelFillFactor: "0.15",
  finishCost: "2.50",
  images: [],
  colors: ["#FFFFFF", "#000000"],
  featured: false,
  stock: "100",
  colorId: "",
  printerId: "",
  machineAmortizationPerHour: "0.12",
  maintenanceCostPerHour: "0.03",
  electricityRate: "0.27",
  printerPowerKw: "0.15",
  finishOption: "Lijado",
  postProcessMinutes: "10",
  laborRate: "25",
  wastePct: "5",
  marginPct: "30",
  customCost: "0",
};

export default function AdminProductsClient() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductType | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const catalog = useAdminCatalog();

  const categories = ["Accesorios", "Decoracion", "Figuras", "Funcional", "Articulados"];

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/products?${params}`);
      const data = await res.json();
      setProducts(data.products || []);
      setTotalPages(data.totalPages || 1);
    } catch {
      showToast("error", "Error al cargar productos");
    }
    setLoading(false);
  }, [page, search, showToast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const selectedMaterial = useMemo(
    () => catalog.materials.find((m) => m.code === formData.material) ?? null,
    [catalog.materials, formData.material]
  );

  const selectedColor = useMemo(
    () =>
      catalog.colors.find((color) => color.id === formData.colorId) ??
      catalog.colors.find((color) => formData.colors.includes(color.hex)) ??
      null,
    [catalog.colors, formData.colorId, formData.colors]
  );

  const selectedPrinter = useMemo(
    () => catalog.printers.find((printer) => printer.id === formData.printerId) ?? null,
    [catalog.printers, formData.printerId]
  );

  const weightEstimate = useMemo(() => {
    if (!selectedMaterial) return 0;
    const dimX = Number.parseFloat(formData.defaultDimX) || 0;
    const dimY = Number.parseFloat(formData.defaultDimY) || 0;
    const dimZ = Number.parseFloat(formData.defaultDimZ) || 0;
    return calculateWeight(
      dimX,
      dimY,
      dimZ,
      Number.parseFloat(formData.density) || selectedMaterial.density,
      Number.parseFloat(formData.modelFillFactor) || 0.15
    );
  }, [formData, selectedMaterial]);

  const pricePreview = useMemo(() => {
    if (!selectedMaterial) return null;
    const dimX = Number.parseFloat(formData.defaultDimX) || 1;
    const dimY = Number.parseFloat(formData.defaultDimY) || 1;
    const dimZ = Number.parseFloat(formData.defaultDimZ) || 1;
    const basePrintTime = Number.parseFloat(formData.printTimeMinutes) || 60;
    const finish = Number.parseFloat(formData.finishCost) || 0;
    const custom = Number.parseFloat(formData.customCost) || 0;
    const qty = Number.parseInt(formData.stock) || 1;
    const fillFactor = Number.parseFloat(formData.modelFillFactor) || 0.15;
    const maintenanceFactor =
      Number.parseFloat(formData.maintenanceCostPerHour) || selectedMaterial.maintenanceFactor;
    const materialConfig = {
      pricePerKg: Number.parseFloat(formData.basePricePerGram) * 1000 || 0,
      density: Number.parseFloat(formData.density) || selectedMaterial.density,
      maintenanceFactor,
    };
    return calculatePriceFromDimensions(dimX, dimY, dimZ, basePrintTime, materialConfig, {
      quantity: qty,
      finishCost: finish + custom,
      fillFactor,
      refDimX: dimX,
      refDimY: dimY,
      refDimZ: dimZ,
    });
  }, [formData, selectedMaterial]);

  const handleEdit = (product: ProductType) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      category: product.category,
      material: product.material,
      basePricePerGram: String(product.basePricePerGram),
      density: String(product.density),
      minDimX: String(product.minDimX),
      minDimY: String(product.minDimY),
      minDimZ: String(product.minDimZ),
      maxDimX: String(product.maxDimX),
      maxDimY: String(product.maxDimY),
      maxDimZ: String(product.maxDimZ),
      defaultDimX: String(product.defaultDimX),
      defaultDimY: String(product.defaultDimY),
      defaultDimZ: String(product.defaultDimZ),
      printTimeMinutes: String(product.printTimeMinutes ?? 60),
      modelFillFactor: String(product.modelFillFactor ?? 0.15),
      finishCost: String(product.finishCost),
      images: product.images,
      colors: product.colors,
      featured: product.featured,
      stock: String(product.stock),
      colorId: formData.colorId,
      printerId: formData.printerId,
      machineAmortizationPerHour: formData.machineAmortizationPerHour,
      maintenanceCostPerHour: formData.maintenanceCostPerHour,
      electricityRate: formData.electricityRate,
      printerPowerKw: formData.printerPowerKw,
      finishOption: formData.finishOption,
      postProcessMinutes: formData.postProcessMinutes,
      laborRate: formData.laborRate,
      wastePct: formData.wastePct,
      marginPct: formData.marginPct,
      customCost: formData.customCost,
    });
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setFormData(initialFormData);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingProduct
        ? `/api/admin/products/${editingProduct.id}`
        : "/api/admin/products";
      const method = editingProduct ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        showToast("success", editingProduct ? "Producto actualizado" : "Producto creado");
        setShowModal(false);
        fetchProducts();
      } else {
        throw new Error("Error al guardar producto");
      }
    } catch {
      showToast("error", "Error al guardar producto");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToast("success", "Producto eliminado");
        fetchProducts();
      } else {
        throw new Error("Error al eliminar producto");
      }
    } catch {
      showToast("error", "Error al eliminar producto");
    }
    setDeleteConfirm(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Panel de control</h1>
          <p className="text-muted">Gestiona tu catálogo de productos</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-cyan text-black font-medium rounded-lg hover:bg-cyan-dark transition-colors"
        >
          <Plus className="w-5 h-5" />
          Añadir Producto
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
        <input
          type="text"
          placeholder="Buscar productos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:border-cyan"
        />
      </div>

      {/* Products Table */}
      <div className="bg-bg-secondary border border-border rounded-xl overflow-hidden">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!loading && products.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-muted mx-auto mb-4" />
            <p className="text-muted">No se encontraron productos</p>
          </div>
        )}
        {!loading && products.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-bg-tertiary">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted">Producto</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted">Categoría</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted">Material</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted">Precio/g</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted">Stock</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-t border-border hover:bg-bg-tertiary/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-bg-tertiary">
                          {product.images[0] && (
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          {product.featured && (
                            <span className="text-xs px-2 py-0.5 bg-amber/20 text-amber rounded-full">
                              Destacado
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">{product.category}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${product.material === "PLA" ? "bg-cyan/20 text-cyan" : "bg-amber/20 text-amber"}`}
                      >
                        {product.material}
                      </span>
                    </td>
                    <td className="px-4 py-3">€{product.basePricePerGram.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={product.stock < 10 ? "text-red-400" : ""}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-2 hover:bg-cyan/20 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4 text-cyan" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(product.id)}
                          className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-border">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${p === page ? "bg-cyan text-black" : "hover:bg-bg-tertiary"}`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-bg-secondary border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-xl font-bold">
                  {editingProduct ? "Editar Producto" : "Nuevo Producto"}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-bg-tertiary rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <section className="rounded-2xl border border-border bg-bg-card/60 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Datos principales</h3>
                    <span className="text-xs uppercase tracking-[0.3em] text-muted">Paso 1</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium mb-1 block">Nombre</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium mb-1 block">Descripción</label>
                      <textarea
                        required
                        rows={3}
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan resize-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Categoría</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan"
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.featured}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            featured: e.target.checked,
                          })
                        }
                        className="accent-cyan"
                      />
                      <span className="text-sm">Producto destacado</span>
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-border bg-bg-card/60 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Material y color</h3>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          colorId: catalog.colors[0]?.id ?? prev.colorId ?? "",
                        }));
                      }}
                      className="text-xs text-cyan hover:underline"
                    >
                      Recargar catálogo
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Material base</label>
                      <select
                        value={formData.material}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            material: e.target.value,
                          });
                        }}
                        className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan"
                      >
                        {catalog.materials.map((material) => (
                          <option key={material.id} value={material.code}>
                            {material.name} ({material.code})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Color principal</label>
                      <select
                        value={formData.colorId}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            colorId: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan"
                      >
                        <option value="">Seleccionar color</option>
                        {catalog.colors.map((color) => (
                          <option key={color.id} value={color.id}>
                            {color.code} · {color.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs uppercase text-muted">Preview</label>
                      <div
                        className="mt-2 h-12 rounded-2xl border border-border shadow-inner"
                        style={{
                          background: selectedColor?.hex ?? "#0f172a",
                          border: selectedColor ? "2px solid #0ea5e9" : undefined,
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-xs uppercase text-muted">HEX</label>
                      <p className="mt-2 text-sm font-mono text-white">
                        {selectedColor?.hex ?? formData.colors[0] ?? "#FFFFFF"}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Precio por gramo (€)</label>
                      <input
                        type="number"
                        step="0.001"
                        value={formData.basePricePerGram}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            basePricePerGram: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Densidad (g/cm³)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.density}
                        onChange={(e) => setFormData({ ...formData, density: e.target.value })}
                        className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan"
                      />
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-border bg-bg-card/60 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Dimensiones y tiempo</h3>
                    <span className="text-xs uppercase tracking-[0.3em] text-muted">Paso 2</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { label: "Min dimension X (mm)", field: "minDimX" },
                      { label: "Min dimension Y (mm)", field: "minDimY" },
                      { label: "Min dimension Z (mm)", field: "minDimZ" },
                    ].map(({ label, field }) => (
                      <div key={field}>
                        <label className="text-sm font-medium mb-1 block">{label}</label>
                        <input
                          type="number"
                          step="1"
                          min="1"
                          value={formData[field as keyof ProductFormData] as string}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              [field]: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan text-sm"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { label: "Max dimension X (mm)", field: "maxDimX" },
                      { label: "Max dimension Y (mm)", field: "maxDimY" },
                      { label: "Max dimension Z (mm)", field: "maxDimZ" },
                    ].map(({ label, field }) => (
                      <div key={field}>
                        <label className="text-sm font-medium mb-1 block">{label}</label>
                        <input
                          type="number"
                          step="1"
                          min="1"
                          value={formData[field as keyof ProductFormData] as string}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              [field]: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan text-sm"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium mb-1 block">
                        Dimensiones de referencia (X×Y×Z mm)
                      </label>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <input
                          type="number"
                          step="1"
                          min="1"
                          value={formData.defaultDimX}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              defaultDimX: e.target.value,
                            })
                          }
                          className="px-3 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan"
                        />
                        <input
                          type="number"
                          step="1"
                          min="1"
                          value={formData.defaultDimY}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              defaultDimY: e.target.value,
                            })
                          }
                          className="px-3 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan"
                        />
                        <input
                          type="number"
                          step="1"
                          min="1"
                          value={formData.defaultDimZ}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              defaultDimZ: e.target.value,
                            })
                          }
                          className="px-3 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Factor de relleno</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max="1"
                        value={formData.modelFillFactor}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            modelFillFactor: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Tiempo impresión (min)
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="1"
                        value={formData.printTimeMinutes}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            printTimeMinutes: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Stock inicial</label>
                      <input
                        type="number"
                        step="1"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                        className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Precio base (€)</label>
                      <input
                        type="number"
                        step="0.001"
                        value={formData.basePricePerGram}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            basePricePerGram: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan"
                      />
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-border bg-bg-card/60 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Impresora y operación</h3>
                    <button
                      type="button"
                      onClick={catalog.reloadPrinters}
                      className="text-xs text-cyan hover:underline"
                    >
                      Actualizar impresoras
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Selecciona impresora</label>
                      <select
                        value={formData.printerId}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            printerId: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan"
                      >
                        <option value="">Sin selección</option>
                        {catalog.printers.map((printer) => (
                          <option key={printer.id} value={printer.id}>
                            {printer.name} · {printer.status}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Amortización €/h</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.machineAmortizationPerHour}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            machineAmortizationPerHour: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Mantenimiento €/h</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.maintenanceCostPerHour}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maintenanceCostPerHour: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Electricidad €/kWh</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.electricityRate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            electricityRate: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan"
                      />
                    </div>
                  </div>
                  {selectedPrinter && (
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-muted">Estado</p>
                        <p className="text-white">{selectedPrinter.status}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-muted">Ubicación</p>
                        <p className="text-white">{selectedPrinter.location ?? "N/D"}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-muted">ID máquina</p>
                        <p className="text-xs text-white">{selectedPrinter.id}</p>
                      </div>
                    </div>
                  )}
                </section>

                <section className="rounded-2xl border border-border bg-bg-card/60 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Acabado & fuerza</h3>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          finishOption: "Lijado",
                        }))
                      }
                      className="text-xs text-cyan hover:underline"
                    >
                      Resetear acabados
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Finalización</label>
                      <select
                        value={formData.finishOption}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            finishOption: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan"
                      >
                        {["Lijado", "Pintura", "Pulido", "UV"].map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Costo acabado (€)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.finishCost}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            finishCost: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Mano de obra (minutos)
                      </label>
                      <input
                        type="number"
                        step="1"
                        value={formData.postProcessMinutes}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            postProcessMinutes: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Tarifa mano de obra (€)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.laborRate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            laborRate: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Desperdicio (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.wastePct}
                        onChange={(e) => setFormData({ ...formData, wastePct: e.target.value })}
                        className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Margen (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.marginPct}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            marginPct: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Costes extras (€)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.customCost}
                      onChange={(e) => setFormData({ ...formData, customCost: e.target.value })}
                      className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan"
                    />
                  </div>
                </section>

                {pricePreview && (
                  <section className="rounded-2xl border border-cyan/40 bg-bg-tertiary/60 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-cyan">Previsualización de coste</h3>
                      <span className="text-xs uppercase tracking-[0.3em] text-muted">
                        {catalog.pricingConfig ? "Configuración actual" : "Calculado"}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-white">
                      <div>
                        <p className="text-xs text-muted">Peso estimado (g)</p>
                        <p className="text-lg font-semibold">{weightEstimate.toFixed(1)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted">Tiempo impresión (min)</p>
                        <p className="text-lg font-semibold">{pricePreview.printTimeMinutes}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted">Coste base</p>
                        <p className="text-lg font-semibold">€{pricePreview.baseCost}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted">Precio sugerido</p>
                        <p className="text-lg font-semibold">€{pricePreview.finalPrice}</p>
                      </div>
                    </div>
                  </section>
                )}

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-border rounded-lg hover:bg-bg-tertiary transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-cyan text-black font-medium rounded-lg hover:bg-cyan-dark transition-colors disabled:opacity-50"
                  >
                    {saving ? "Guardando..." : "Guardar"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-bg-secondary border border-border rounded-xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-2">Confirmar Eliminación</h3>
              <p className="text-muted mb-6">
                ¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede
                deshacer.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-bg-tertiary transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="px-4 py-2 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
