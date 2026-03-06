"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { CreditCard, RefreshCw } from "lucide-react";
import type { OrderType } from "@/lib/types";
import { useToast } from "@/components/toast-provider";

export default function AdminPaymentsClient() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders?status=paid&limit=50");
      const data = await res.json();
      setOrders(data.orders || []);
    } catch {
      showToast("error", "Error al cargar pagos");
    }
    setLoading(false);
  }, [showToast]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const totalPaid = orders.reduce((sum, o) => sum + (o.total || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestión de pagos</h1>
          <p className="text-muted text-sm">
            Visión general de pedidos pagados y liquidaciones.
          </p>
        </div>
        <button
          onClick={fetchPayments}
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
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-cyan" />
            <span className="text-sm font-medium">Pagos completados</span>
          </div>
          <div className="text-sm text-muted">
            Total: <span className="font-mono text-cyan">€{totalPaid.toFixed(2)}</span>
          </div>
        </div>
        <div className="max-h-[480px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-bg-tertiary text-xs text-muted uppercase tracking-wide">
              <tr>
                <th className="px-4 py-2 text-left">Pedido</th>
                <th className="px-4 py-2 text-left">Cliente</th>
                <th className="px-4 py-2 text-left">Fecha</th>
                <th className="px-4 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted">
                    Cargando pagos...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted">
                    No hay pagos registrados.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="border-t border-border/60">
                    <td className="px-4 py-2 font-mono text-xs">
                      #{o.id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-4 py-2 text-muted">
                      {o.user?.name || o.user?.email || "Cliente"}
                    </td>
                    <td className="px-4 py-2 text-muted">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-right font-mono">
                      €{o.total.toFixed(2)}
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

