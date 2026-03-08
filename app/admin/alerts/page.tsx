"use client";
import React, { useEffect, useState } from "react";
type Alert = {
  id: string;
  type: string;
  message: string;
  data?: string;
  seen: boolean;
  createdAt: string;
  userId?: string;
  orderId?: string;
  productId?: string;
};
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ALERT_TYPES = [
  "stock",
  "print-queue",
  "customer-message",
  "business-event",
];

const SEEN_FILTERS = [
  { label: "Nuevas", value: "false" },
  { label: "Vistas", value: "true" },
  { label: "Todas", value: "all" },
];

function getTypeLabel(type: string) {
  switch (type) {
    case "stock":
      return "Stock";
    case "print-queue":
      return "Cola de impresión";
    case "customer-message":
      return "Mensaje cliente";
    case "business-event":
      return "Evento negocio";
    default:
      return type;
  }
}

export default function AdminAlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [type, setType] = useState<string>("");
  const [seen, setSeen] = useState<string>("false");
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (type) params.append("type", type);
    if (seen !== "all") params.append("seen", seen);
    params.append("page", String(page));
    params.append("limit", "20");
    fetch(`/api/admin/alerts?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setAlerts(data.alerts || []);
        setTotalPages(data.totalPages || 1);
        setLoading(false);
      });
  }, [type, seen, page]);

  const markAsSeen = async (id: string) => {
    await fetch(`/api/admin/alerts`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, seen: true }),
    });
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, seen: true } : a)));
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Alertas del sistema</h1>
      <div className="flex gap-4 mb-6">
        <div>
          <span className="mr-2">Tipo:</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="border rounded px-2 py-1"
          >
            <option value="">Todos</option>
            {ALERT_TYPES.map((t) => (
              <option key={t} value={t}>
                {getTypeLabel(t)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <span className="mr-2">Estado:</span>
          <select
            value={seen}
            onChange={(e) => setSeen(e.target.value)}
            className="border rounded px-2 py-1"
          >
            {SEEN_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {
        (() => {
          if (loading) {
            return <div>Cargando alertas...</div>;
          }
          if (alerts.length === 0) {
            return <div>No hay alertas para los filtros seleccionados.</div>;
          }
          return (
            <table className="w-full border">
              <thead>
                <tr>
                  <th className="p-2 border">Tipo</th>
                  <th className="p-2 border">Mensaje</th>
                  <th className="p-2 border">Fecha</th>
                  <th className="p-2 border">Estado</th>
                  <th className="p-2 border">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert) => (
                  <tr key={alert.id} className={alert.seen ? "bg-gray-100" : "bg-white"}>
                    <td className="p-2 border">
                      <Badge>{getTypeLabel(alert.type)}</Badge>
                    </td>
                    <td className="p-2 border">{alert.message}</td>
                    <td className="p-2 border">
                      {new Date(alert.createdAt).toLocaleString("es-ES")}
                    </td>
                    <td className="p-2 border">
                      {alert.seen ? <span className="text-green-600">Vista</span> : <span className="text-red-600">Nueva</span>}
                    </td>
                    <td className="p-2 border">
                      {!alert.seen && (
                        <Button size="sm" onClick={() => markAsSeen(alert.id)}>
                          Marcar como vista
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          );
        })()
      }
      <div className="flex justify-between mt-4">
        <Button
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Anterior
        </Button>
        <span>
          Página {page} de {totalPages}
        </span>
        <Button
          disabled={page >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}
