"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Printer, RefreshCw } from "lucide-react";
import type { OrderType } from "@/lib/types";
import { useToast } from "@/components/toast-provider";

export default function AdminPrintQueueClient() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      // Cola = pedidos pagados o en proceso
      const res = await fetch("/api/admin/orders?status=processing&limit=50");
      const data = await res.json();
      setOrders(data.orders || []);
    } catch {
      showToast("error", "Error al cargar cola de impresión");
    }
    setLoading(false);
  }, [showToast]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  function renderRows() {
    if (loading) {
      return (
        <tr>
          <td colSpan={4} className="px-4 py-6 text-center text-muted">
            Cargando cola...
          </td>
        </tr>
      );
    }
    if (orders.length === 0) {
      return (
        <tr>
          <td colSpan={4} className="px-4 py-6 text-center text-muted">
            No hay pedidos en cola de impresión.
          </td>
        </tr>
      );
    }
    return orders.map((o) => (
      <tr key={o.id} className="border-t border-border/60">
        <td className="px-4 py-2 font-mono text-xs">
          #{o.id.slice(-8).toUpperCase()}
        </td>
        <td className="px-4 py-2 text-muted">
          {o.user?.name || o.user?.email || "Cliente"}
        </td>
        <td className="px-4 py-2 text-muted">
          {new Date(o.createdAt).toLocaleDateString('es-ES')}
        </td>
        <td className="px-4 py-2 text-right">
          {o.items?.reduce((sum, i) => sum + (i.quantity || 0), 0) ?? 0}
        </td>
      </tr>
    ));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cola de impresión</h1>
          <p className="text-muted text-sm">
            Pedidos en estado &quot;procesando&quot; listos para planificar en impresoras.
          </p>
        </div>
        <button
          onClick={fetchQueue}
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
          <Printer className="w-4 h-4 text-cyan" />
          <span className="text-sm font-medium">Trabajos en cola</span>
        </div>
        <div className="max-h-[480px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-bg-tertiary text-xs text-muted uppercase tracking-wide">
              <tr>
                <th className="px-4 py-2 text-left">Pedido</th>
                <th className="px-4 py-2 text-left">Cliente</th>
                <th className="px-4 py-2 text-left">Fecha</th>
                <th className="px-4 py-2 text-right">Piezas</th>
              </tr>
            </thead>
            <tbody>
              {renderRows()}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

