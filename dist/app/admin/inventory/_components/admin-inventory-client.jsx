"use client";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { PackageSearch, RefreshCw } from "lucide-react";
import { useToast } from "@/components/toast-provider";
export default function AdminInventoryClient() {
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/products?page=1&limit=100");
      const data = await res.json();
      setProducts(data.products || []);
    } catch {
      showToast("error", "Error al cargar inventario");
    }
    setLoading(false);
  }, [showToast]);
  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestión de inventario</h1>
          <p className="text-muted text-sm">
            Controla el stock de tus productos impresos en 3D.
          </p>
        </div>
        <button
          onClick={fetchInventory}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-bg-tertiary transition"
        >
          <RefreshCw className="w-4 h-4" /> Actualizar
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-bg-secondary border border-border rounded-xl overflow-hidden"
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <PackageSearch className="w-4 h-4 text-cyan" />
          <span className="text-sm font-medium">Estado de stock</span>
        </div>
        <div className="max-h-[480px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-bg-tertiary text-xs text-muted uppercase tracking-wide">
              <tr>
                <th className="px-4 py-2 text-left">Producto</th>
                <th className="px-4 py-2 text-left">Categoría</th>
                <th className="px-4 py-2 text-left">Material</th>
                <th className="px-4 py-2 text-right">Stock</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted">
                    Cargando inventario...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted">
                    No hay productos en inventario.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="border-t border-border/60">
                    <td className="px-4 py-2">{p.name}</td>
                    <td className="px-4 py-2 text-muted">{p.category}</td>
                    <td className="px-4 py-2 text-muted">{p.material}</td>
                    <td className="px-4 py-2 text-right">
                      <span className={p.stock < 10 ? "text-red-400" : ""}>
                        {p.stock}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
