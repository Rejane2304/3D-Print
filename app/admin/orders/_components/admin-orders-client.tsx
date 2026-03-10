"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Eye,
  X,
  ShoppingCart,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  ArrowRight,
} from "lucide-react";
import { useToast } from "@/components/toast-provider";
import type { OrderType } from "@/lib/types";

const statusConfig: Record<
  string,
  { label: string; color: string; icon: React.ElementType }
> = {
  pending: {
    label: "Pendiente",
    color: "bg-yellow-500/20 text-yellow-400",
    icon: Clock,
  },
  paid: {
    label: "Pagado",
    color: "bg-green-500/20 text-green-400",
    icon: CheckCircle,
  },
  processing: {
    label: "En producción",
    color: "bg-blue-500/20 text-blue-400",
    icon: Package,
  },
  ready: {
    label: "Listo para envío",
    color: "bg-amber-500/20 text-amber-400",
    icon: Star,
  },
  shipped: {
    label: "Enviado",
    color: "bg-purple-500/20 text-purple-400",
    icon: Truck,
  },
  delivered: {
    label: "Entregado",
    color: "bg-cyan/20 text-cyan",
    icon: CheckCircle,
  },
  cancelled: {
    label: "Cancelado",
    color: "bg-red-500/20 text-red-400",
    icon: XCircle,
  },
};

const workflowNext: Record<string, { status: string; label: string }> = {
  paid: { status: "processing", label: "Iniciar Producción" },
  processing: { status: "ready", label: "Listo para Envío" },
  ready: { status: "shipped", label: "Marcar como Enviado" },
  shipped: { status: "delivered", label: "Marcar como Entregado" },
};

const WORKFLOW_STEPS = [
  "paid",
  "processing",
  "ready",
  "shipped",
  "delivered",
] as const;

function stepBadgeClass(
  isActive: boolean,
  isDone: boolean,
  activeColor: string,
): string {
  if (isActive) return activeColor;
  if (isDone) return "bg-white/5 text-zinc-400";
  return "bg-white/5 text-zinc-600";
}

export default function AdminOrdersClient() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<OrderType | null>(null);
  const [advancing, setAdvancing] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/orders?${params}`);
      const data = await res.json();
      setOrders(data.orders || []);
      setTotalPages(data.totalPages || 1);
    } catch {
      showToast("error", "Error al cargar pedidos");
    }
    setLoading(false);
  }, [page, search, statusFilter, showToast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        showToast("success", "Estado actualizado");
        fetchOrders();
        if (selectedOrder?.id === orderId) {
          const updatedOrder = await res.json();
          setSelectedOrder(updatedOrder);
        }
      }
    } catch {
      showToast("error", "Error al actualizar estado");
    }
  };

  const advanceWorkflow = async () => {
    if (!selectedOrder) return;
    const next = workflowNext[selectedOrder.status];
    if (!next) return;
    setAdvancing(true);
    await updateStatus(selectedOrder.id, next.status);
    setAdvancing(false);
  };

  // Extracted to avoid nested ternary in JSX (S3358)
  let orderListContent: React.ReactNode;
  if (loading) {
    orderListContent = (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  } else if (orders.length === 0) {
    orderListContent = (
      <div className="text-center py-12">
        <ShoppingCart className="w-12 h-12 text-muted mx-auto mb-4" />
        <p className="text-muted">No se encontraron pedidos</p>
      </div>
    );
  } else {
    orderListContent = (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-bg-tertiary">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted">
                Pedido
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted">
                Cliente
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted">
                Fecha
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted">
                Total
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted">
                Estado
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-muted">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const config = statusConfig[order.status] || statusConfig.pending;
              const StatusIcon = config.icon;
              return (
                <tr
                  key={order.id}
                  className="border-t border-border hover:bg-bg-tertiary/50"
                >
                  <td className="px-4 py-3">
                    <span className="font-mono font-medium">
                      #{order.id.slice(-8).toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">
                      {order.shippingName || order.user?.name || "N/A"}
                    </div>
                    <div className="text-sm text-muted">
                      {order.shippingEmail || order.user?.email}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {new Date(order.createdAt).toLocaleDateString("es-ES")}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    €{order.total.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${config.color}`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {config.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-2 hover:bg-cyan/20 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4 text-cyan" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  useEffect(() => {
    
    console.log("[AdminOrdersClient] render h1 Panel de control");
  }, []);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Panel de control</h1>
        <p className="text-muted">Gestiona los pedidos de tus clientes</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
          <input
            type="text"
            placeholder="Buscar por ID, email o nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:border-cyan"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:border-cyan"
        >
          <option value="">Todos los estados</option>
          {Object.entries(statusConfig).map(([key, { label }]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-bg-secondary border border-border rounded-xl overflow-hidden">
        {orderListContent}
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

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedOrder(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-bg-secondary border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div>
                  <h2 className="text-xl font-bold">
                    Pedido #{selectedOrder.id.slice(-8).toUpperCase()}
                  </h2>
                  <p className="text-sm text-muted">
                    {new Date(selectedOrder.createdAt).toLocaleString("es-ES")}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 hover:bg-bg-tertiary rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Production Workflow */}
                <div>
                  <p className="text-sm font-medium mb-3">
                    Flujo de Producción
                  </p>
                  <div className="flex items-center gap-1 flex-wrap mb-4">
                    {WORKFLOW_STEPS.map((s, i, arr) => {
                      const cfg = statusConfig[s];
                      const StepIcon = cfg.icon;
                      const isActive = selectedOrder.status === s;
                      const isDone =
                        arr.indexOf(selectedOrder.status as typeof s) > i;
                      const badgeClass = stepBadgeClass(
                        isActive,
                        isDone,
                        cfg.color,
                      );
                      return (
                        <div key={s} className="flex items-center gap-1">
                          <div
                            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${badgeClass}`}
                          >
                            <StepIcon className="w-3 h-3" />
                            {cfg.label}
                          </div>
                          {i < arr.length - 1 && (
                            <ArrowRight className="w-3 h-3 text-zinc-600 flex-shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {workflowNext[selectedOrder.status] && (
                    <button
                      onClick={advanceWorkflow}
                      disabled={advancing}
                      className="w-full py-2.5 bg-cyan text-black font-semibold rounded-lg hover:bg-cyan-dim transition text-sm disabled:opacity-50"
                    >
                      {advancing
                        ? "Actualizando..."
                        : workflowNext[selectedOrder.status].label}
                    </button>
                  )}
                </div>

                {/* Status override */}
                <div>
                  <label
                    htmlFor="status-select"
                    className="block text-sm font-medium mb-2"
                  >
                    Estado manual
                  </label>
                  <select
                    id="status-select"
                    value={selectedOrder.status}
                    onChange={(e) =>
                      updateStatus(selectedOrder.id, e.target.value)
                    }
                    className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-cyan"
                  >
                    {Object.entries(statusConfig).map(([key, { label }]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Customer Info */}
                <div>
                  <h3 className="font-bold mb-3">Información del Cliente</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted">Nombre:</span>
                      <p>{selectedOrder.shippingName || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-muted">Email:</span>
                      <p>{selectedOrder.shippingEmail || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-muted">Teléfono:</span>
                      <p>{selectedOrder.shippingPhone || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-muted">Dirección:</span>
                      <p>{selectedOrder.shippingAddress || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-muted">Ciudad:</span>
                      <p>{selectedOrder.shippingCity || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-muted">País:</span>
                      <p>{selectedOrder.shippingCountry || "N/A"}</p>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h3 className="font-bold mb-3">Productos</h3>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center py-2 border-b border-border last:border-0"
                      >
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted">
                            {item.material} • {item.color} •{" "}
                            {item.dimX.toFixed(2)}×{item.dimY.toFixed(2)}×
                            {item.dimZ.toFixed(2)} mm • x{item.quantity}
                          </div>
                        </div>
                        <div className="font-medium">
                          €{(item.unitPrice * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="bg-bg-tertiary rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Subtotal</span>
                    <span>€{selectedOrder.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">IVA (21%)</span>
                    <span>€{selectedOrder.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Envío</span>
                    <span>
                      {selectedOrder.shipping === 0
                        ? "Gratis"
                        : `€${selectedOrder.shipping.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold pt-2 border-t border-border">
                    <span>Total</span>
                    <span className="text-cyan">
                      €{selectedOrder.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
