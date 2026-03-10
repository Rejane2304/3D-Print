"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Printer, RefreshCw } from "lucide-react";
import type { OrderType } from "@/lib/types";
import { useToast } from "@/components/toast-provider";

export default function AdminPrintQueueClient() {
  // Hooks deben ir dentro del componente
  const [filters, setFilters] = useState({
    status: "processing",
    client: "",
    printer: "",
  });
  const [printers, setPrinters] = useState<{ id: string; name: string }[]>([]);
  const printerModalOrder = useRef<OrderType | null>(null);
  const [showPrinterModal, setShowPrinterModal] = useState(false);

  useEffect(() => {
    fetch("/api/admin/printers")
      .then((res) => res.json())
      .then((data) => setPrinters(data.printers || []));
  }, []);
  const { showToast } = useToast();
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      if (filters.client) params.append("client", filters.client);
      if (filters.printer) params.append("printer", filters.printer);
      params.append("limit", "50");
      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      const data = await res.json();
      setOrders(data.orders || []);
    } catch {
      showToast("error", "Error al cargar cola de impresión");
    }
    setLoading(false);
  }, [showToast, filters]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);
  async function assignPrinter(
    orderId: string,
    printerId: string,
    orderItemId?: string,
  ) {
    try {
      const res = await fetch("/api/admin/printers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, printerId, orderItemId }),
      });
      if (!res.ok) throw new Error("Error asignando impresora");
      showToast("success", "Impresora asignada");
      await fetchQueue();
      setShowPrinterModal(false);
    } catch {
      showToast("error", "Error al asignar impresora");
    }
  }

  const [selectedOrder, setSelectedOrder] = useState<OrderType | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function updateOrderStatus(orderId: string, status: string) {
    setActionLoading(orderId + status);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Error actualizando pedido");
      showToast("success", "Pedido actualizado");
      await fetchQueue();
    } catch {
      showToast("error", "Error al actualizar pedido");
    }
    setActionLoading(null);
  }

  function renderRows() {
    if (loading) {
      return [
        <tr key="loading">
          <td colSpan={6} className="px-4 py-6 text-center text-muted">
            Cargando cola...
          </td>
        </tr>,
      ];
    }
    if (orders.length === 0) {
      return [
        <tr key="empty">
          <td colSpan={6} className="px-4 py-6 text-center text-muted">
            No hay pedidos en cola de impresión.
          </td>
        </tr>,
      ];
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
          {new Date(o.createdAt).toLocaleDateString("es-ES")}
        </td>
        <td className="px-4 py-2 text-right">
          {o.items?.reduce((sum, i) => sum + (i.quantity || 0), 0) ?? 0}
        </td>
        <td className="px-4 py-2 text-right">
          {o.printer?.name ? (
            <span className="text-cyan">{o.printer.name}</span>
          ) : (
            <button
              className="mr-2 text-cyan underline text-xs"
              onClick={() => {
                printerModalOrder.current = o;
                setShowPrinterModal(true);
              }}
            >
              Asignar impresora
            </button>
          )}
        </td>
        <td className="px-4 py-2 text-right">
          <button
            className="mr-2 text-cyan underline text-xs"
            onClick={() => setSelectedOrder(o)}
          >
            Detalles
          </button>
          <button
            className="mr-2 text-green-600 underline text-xs"
            disabled={actionLoading === o.id + "printed"}
            onClick={() => updateOrderStatus(o.id, "printed")}
          >
            {actionLoading === o.id + "printed"
              ? "Guardando..."
              : "Marcar impreso"}
          </button>
          <button
            className="text-red-600 underline text-xs"
            disabled={actionLoading === o.id + "cancelled"}
            onClick={() => updateOrderStatus(o.id, "cancelled")}
          >
            {actionLoading === o.id + "cancelled" ? "Guardando..." : "Cancelar"}
          </button>
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
            Pedidos en estado &quot;procesando&quot; listos para planificar en
            impresoras.
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
        {/* Filtros */}
        <div className="flex gap-4 mb-4 px-4 py-2">
          <div>
            <label htmlFor="filter-estado" className="mr-2 text-sm">
              Estado:
            </label>
            <select
              id="filter-estado"
              value={filters.status}
              onChange={(e) =>
                setFilters((f) => ({ ...f, status: e.target.value }))
              }
              className="border rounded px-2 py-1"
            >
              <option value="">Todos</option>
              <option value="processing">Procesando</option>
              <option value="printed">Impreso</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
          <div>
            <label htmlFor="filter-cliente" className="mr-2 text-sm">
              Cliente:
            </label>
            <input
              id="filter-cliente"
              type="text"
              value={filters.client}
              onChange={(e) =>
                setFilters((f) => ({ ...f, client: e.target.value }))
              }
              className="border rounded px-2 py-1"
              placeholder="Nombre o email"
            />
          </div>
          <div>
            <label htmlFor="filter-impresora" className="mr-2 text-sm">
              Impresora:
            </label>
            <select
              id="filter-impresora"
              value={filters.printer}
              onChange={(e) =>
                setFilters((f) => ({ ...f, printer: e.target.value }))
              }
              className="border rounded px-2 py-1"
            >
              <option value="">Todas</option>
              {printers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="max-h-[480px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-bg-tertiary text-xs text-muted uppercase tracking-wide">
              <tr>
                <th className="px-4 py-2 text-left">Pedido</th>
                <th className="px-4 py-2 text-left">Cliente</th>
                <th className="px-4 py-2 text-left">Fecha</th>
                <th className="px-4 py-2 text-right">Piezas</th>
                <th className="px-4 py-2 text-right">Impresora</th>
                <th className="px-4 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>{renderRows()}</tbody>
          </table>
        </div>
        {/* Modal asignar impresora */}
        {showPrinterModal && printerModalOrder.current && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
            <div className="bg-bg-secondary rounded-xl border border-border p-6 w-full max-w-md shadow-xl relative">
              <button
                className="absolute top-3 right-3 text-muted hover:text-white"
                onClick={() => setShowPrinterModal(false)}
              >
                ✕
              </button>
              <h2 className="text-xl font-bold mb-2">Asignar impresora</h2>
              <div className="mb-4">
                <div>
                  <b>Pedido:</b> #
                  {printerModalOrder.current.id.slice(-8).toUpperCase()}
                </div>
                <div>
                  <b>Cliente:</b>{" "}
                  {printerModalOrder.current.user?.name ||
                    printerModalOrder.current.user?.email ||
                    "Cliente"}
                </div>
              </div>
              <div>
                <label htmlFor="modal-impresora" className="mb-2 block">
                  Selecciona impresora:
                </label>
                <select
                  id="modal-impresora"
                  className="border rounded px-2 py-1 w-full"
                  onChange={(e) =>
                    assignPrinter(printerModalOrder.current!.id, e.target.value)
                  }
                  defaultValue=""
                >
                  <option value="">Selecciona...</option>
                  {printers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
        {/* Modal de detalles */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
            <div className="bg-bg-secondary rounded-xl border border-border p-6 w-full max-w-lg shadow-xl relative">
              <button
                className="absolute top-3 right-3 text-muted hover:text-white"
                onClick={() => setSelectedOrder(null)}
              >
                ✕
              </button>
              <h2 className="text-xl font-bold mb-2">Detalles del pedido</h2>
              <div className="mb-4">
                <div>
                  <b>ID:</b> #{selectedOrder.id.slice(-8).toUpperCase()}
                </div>
                <div>
                  <b>Cliente:</b>{" "}
                  {selectedOrder.user?.name ||
                    selectedOrder.user?.email ||
                    "Cliente"}
                </div>
                <div>
                  <b>Fecha:</b>{" "}
                  {new Date(selectedOrder.createdAt).toLocaleString("es-ES")}
                </div>
                <div>
                  <b>Piezas:</b>{" "}
                  {selectedOrder.items?.reduce(
                    (sum, i) => sum + (i.quantity || 0),
                    0,
                  ) ?? 0}
                </div>
                <div>
                  <b>Estado:</b> {selectedOrder.status}
                </div>
              </div>
              <div>
                <b>Items:</b>
                <ul className="mt-2">
                  {selectedOrder.items?.map((item) => (
                    <li key={item.id} className="mb-2 flex items-center gap-2">
                      <span>
                        {item.productName} x {item.quantity}
                      </span>
                      {item.printer?.name ? (
                        <span className="text-cyan text-xs">
                          {item.printer.name}
                        </span>
                      ) : (
                        <select
                          className="border rounded px-2 py-1 text-xs"
                          onChange={(e) =>
                            assignPrinter(
                              selectedOrder.id,
                              e.target.value,
                              item.id,
                            )
                          }
                          defaultValue=""
                        >
                          <option value="">Asignar impresora...</option>
                          {printers.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
