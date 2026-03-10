"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Edit, Trash2, X, Package } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/components/toast-provider";
const initialFormData = {
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
};
export default function AdminProductsClient() {
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const categories = [
    "Accesorios",
    "Decoracion",
    "Figuras",
    "Funcional",
    "Articulados",
  ];
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
  const handleEdit = (product) => {
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
    });
    setShowModal(true);
  };
  const handleCreate = () => {
    setEditingProduct(null);
    setFormData(initialFormData);
    setShowModal(true);
  };
  const handleSubmit = async (e) => {
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
        showToast(
          "success",
          editingProduct ? "Producto actualizado" : "Producto creado",
        );
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
  const handleDelete = async (id) => {
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
          <h1 className="text-3xl font-bold mb-2">Productos</h1>
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
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted">
                    Producto
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted">
                    Categoría
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted">
                    Material
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted">
                    Precio/g
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted">
                    Stock
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="border-t border-border hover:bg-bg-tertiary/50"
                  >
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
                    <td className="px-4 py-3">
                      €{product.basePricePerGram.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={product.stock < 10 ? "text-red-400" : ""}
                      >
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

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="admin-name"
                      className="block text-sm font-medium mb-1"
                    >
                      Nombre
                    </label>
                    <input
                      id="admin-name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="admin-desc"
                      className="block text-sm font-medium mb-1"
                    >
                      Descripción
                    </label>
                    <textarea
                      id="admin-desc"
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
                    <label
                      htmlFor="admin-category"
                      className="block text-sm font-medium mb-1"
                    >
                      Categoría
                    </label>
                    <select
                      id="admin-category"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="admin-material"
                      className="block text-sm font-medium mb-1"
                    >
                      Material
                    </label>
                    <select
                      id="admin-material"
                      value={formData.material}
                      onChange={(e) => {
                        const material = e.target.value;
                        setFormData({
                          ...formData,
                          material,
                          density: material === "PLA" ? "1.24" : "1.27",
                          basePricePerGram:
                            material === "PLA" ? "0.02" : "0.025",
                        });
                      }}
                      className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan"
                    >
                      <option value="PLA">PLA</option>
                      <option value="PETG">PETG</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="admin-price"
                      className="block text-sm font-medium mb-1"
                    >
                      Precio por Gramo (€)
                    </label>
                    <input
                      id="admin-price"
                      type="number"
                      step="0.001"
                      required
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
                    <label
                      htmlFor="admin-density"
                      className="block text-sm font-medium mb-1"
                    >
                      Densidad (g/cm³)
                    </label>
                    <input
                      id="admin-density"
                      type="number"
                      step="0.01"
                      required
                      value={formData.density}
                      onChange={(e) =>
                        setFormData({ ...formData, density: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="admin-stock"
                      className="block text-sm font-medium mb-1"
                    >
                      Stock
                    </label>
                    <input
                      id="admin-stock"
                      type="number"
                      required
                      value={formData.stock}
                      onChange={(e) =>
                        setFormData({ ...formData, stock: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="admin-finish"
                      className="block text-sm font-medium mb-1"
                    >
                      Costo de Acabado (€)
                    </label>
                    <input
                      id="admin-finish"
                      type="number"
                      step="0.01"
                      required
                      value={formData.finishCost}
                      onChange={(e) =>
                        setFormData({ ...formData, finishCost: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan"
                    />
                  </div>

                  {/* Calibración desde Bambu Slicer */}
                  <div className="sm:col-span-2">
                    <p className="text-xs font-semibold text-amber uppercase tracking-wide mb-3">
                      Calibración desde Bambu Slicer
                    </p>
                    <p className="text-xs text-muted mb-3">
                      Introduce el tamaño y resultados del laminador para el
                      modelo tal como está diseñado (dimensiones de referencia).
                      La fórmula de precios escalará a partir de estos valores.
                    </p>
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div>
                        <label
                          htmlFor="admin-defX"
                          className="block text-xs text-muted mb-1"
                        >
                          Ref. X (mm)
                        </label>
                        <input
                          id="admin-defX"
                          type="number"
                          step="1"
                          min="1"
                          required
                          value={formData.defaultDimX}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              defaultDimX: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan text-sm"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="admin-defY"
                          className="block text-xs text-muted mb-1"
                        >
                          Ref. Y (mm)
                        </label>
                        <input
                          id="admin-defY"
                          type="number"
                          step="1"
                          min="1"
                          required
                          value={formData.defaultDimY}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              defaultDimY: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan text-sm"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="admin-defZ"
                          className="block text-xs text-muted mb-1"
                        >
                          Ref. Z (mm)
                        </label>
                        <input
                          id="admin-defZ"
                          type="number"
                          step="1"
                          min="1"
                          required
                          value={formData.defaultDimZ}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              defaultDimZ: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor="admin-printtime"
                          className="block text-xs text-muted mb-1"
                        >
                          Tiempo impresión (min)
                        </label>
                        <input
                          id="admin-printtime"
                          type="number"
                          step="1"
                          min="1"
                          required
                          value={formData.printTimeMinutes}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              printTimeMinutes: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan text-sm"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="admin-fillfactor"
                          className="block text-xs text-muted mb-1"
                        >
                          Factor de relleno
                        </label>
                        <input
                          id="admin-fillfactor"
                          type="number"
                          step="0.001"
                          min="0.01"
                          max="1"
                          required
                          value={formData.modelFillFactor}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              modelFillFactor: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan text-sm"
                        />
                        <p className="text-xs text-muted mt-1">
                          peso_g ÷ (X×Y×Z/1000 × dens.)
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.featured}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            featured: e.target.checked,
                          })
                        }
                        className="w-4 h-4 rounded border-border bg-bg-tertiary text-cyan focus:ring-cyan"
                      />
                      <span className="text-sm">Producto destacado</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
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
                ¿Estás seguro de que quieres eliminar este producto? Esta acción
                no se puede deshacer.
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
