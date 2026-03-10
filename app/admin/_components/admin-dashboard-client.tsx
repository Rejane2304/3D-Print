"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import Link from "next/link";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import type { DashboardStatsType } from "@/lib/types";

export default function AdminDashboardClient() {
  const [stats, setStats] = useState<DashboardStatsType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    {
      label: "Ingresos Totales",
      value: `€${(stats?.totalRevenue || 0).toFixed(2)}`,
      icon: DollarSign,
      color: "cyan",
      change: "+12.5%",
      positive: true,
    },
    {
      label: "Pedidos Totales",
      value: stats?.totalOrders || 0,
      icon: ShoppingCart,
      color: "amber",
      change: "+8.2%",
      positive: true,
    },
    {
      label: "Productos",
      value: stats?.totalProducts || 0,
      icon: Package,
      color: "cyan",
      change: "+2",
      positive: true,
    },
    {
      label: "Usuarios",
      value: stats?.totalUsers || 0,
      icon: Users,
      color: "amber",
      change: "+15.3%",
      positive: true,
    },
  ];

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-400",
    paid: "bg-green-500/20 text-green-400",
    processing: "bg-blue-500/20 text-blue-400",
    shipped: "bg-purple-500/20 text-purple-400",
    delivered: "bg-cyan/20 text-cyan",
    cancelled: "bg-red-500/20 text-red-400",
  };

  const statusLabels: Record<string, { es: string; en: string }> = {
    pending: { es: "pendiente", en: "pending" },
    paid: { es: "pagado", en: "paid" },
    processing: { es: "en proceso", en: "processing" },
    shipped: { es: "enviado", en: "shipped" },
    delivered: { es: "entregado", en: "delivered" },
    cancelled: { es: "cancelado", en: "cancelled" },
  };

  const pieColors: Record<string, string> = {
    PLA: "#00FFFF",
    PETG: "#FFBF00",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Panel de control</h1>
        <p className="text-muted">
          Bienvenido al panel de administración de 3D Print
        </p>
        <div className="mt-6">
          <Link
            href="/admin/catalog"
            className="inline-flex items-center gap-2 px-4 py-2 bg-cyan text-black rounded-lg font-semibold hover:bg-cyan-dim transition"
          >
            Catálogo de impresión
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-bg-secondary border border-border rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`p-3 rounded-lg ${stat.color === "cyan" ? "bg-cyan/20" : "bg-amber/20"}`}
              >
                <stat.icon
                  className={`w-6 h-6 ${stat.color === "cyan" ? "text-cyan" : "text-amber"}`}
                />
              </div>
              <div
                className={`flex items-center gap-1 text-sm ${stat.positive ? "text-green-400" : "text-red-400"}`}
              >
                {stat.positive ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
                {stat.change}
              </div>
            </div>
            <div className="text-2xl font-bold mb-1">{stat.value}</div>
            <div className="text-sm text-muted">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-bg-secondary border border-border rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Pedidos Recientes</h2>
            <Link
              href="/admin/orders"
              className="text-cyan text-sm hover:underline"
            >
              Ver todos
            </Link>
          </div>
          <div className="space-y-4">
            {stats?.recentOrders?.length ? (
              stats.recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between py-3 border-b border-border last:border-0"
                >
                  <div>
                    <div className="font-medium">
                      #{order.id.slice(-8).toUpperCase()}
                    </div>
                    <div className="text-sm text-muted">
                      {order.user?.name || order.user?.email || "Usuario"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">€{order.total.toFixed(2)}</div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${statusColors[order.status] || "bg-gray-500/20"}`}
                    >
                      {statusLabels[order.status]?.es ?? order.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted text-center py-4">
                No hay pedidos recientes
              </p>
            )}
          </div>
        </motion.div>

        {/* Top Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-bg-secondary border border-border rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Productos Más Vendidos</h2>
            <Link
              href="/admin/products"
              className="text-cyan text-sm hover:underline"
            >
              Ver todos
            </Link>
          </div>
          <div className="space-y-4">
            {stats?.topProducts?.length ? (
              stats.topProducts.map((item, index) => (
                <div
                  key={item.product?.id || index}
                  className="flex items-center gap-4 py-3 border-b border-border last:border-0"
                >
                  <div className="w-8 h-8 bg-cyan/20 rounded-full flex items-center justify-center text-cyan font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">
                      {item.product?.name || "Producto"}
                    </div>
                    <div className="text-sm text-muted">
                      {item.product?.category}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-cyan" />
                      {item.totalSold} uds
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted text-center py-4">
                No hay datos de ventas
              </p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Coste por material & Distribución de tamaños */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost by Material */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="bg-bg-secondary border border-border rounded-xl p-6"
        >
          <h2 className="text-xl font-bold mb-6">Coste medio por material</h2>
          {stats?.costByMaterial && stats.costByMaterial.length > 0 ? (
            <>
              <div className="space-y-3 mb-6">
                {stats.costByMaterial.map((item) => (
                  <div
                    key={item.material}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center text-xs font-semibold">
                        {item.material}
                      </div>
                      <div className="text-sm text-muted">
                        {item.pieces} pieza{item.pieces === 1 ? "" : "s"} ·{" "}
                        {item.percentage.toFixed(1)}%
                      </div>
                    </div>
                    <div className="font-mono text-sm">
                      €{item.averageUnitPrice.toFixed(2)} / ud
                    </div>
                  </div>
                ))}
              </div>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.costByMaterial}
                      dataKey="percentage"
                      nameKey="material"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      label={(entry) =>
                        `${entry.material} ${entry.percentage.toFixed(0)}%`
                      }
                    >
                      {stats.costByMaterial.map((entry, index) => (
                        <Cell
                          key={entry.material}
                          fill={
                            pieColors[entry.material] ||
                            ["#00FFFF", "#FFBF00", "#22C55E", "#6366F1"][
                              index % 4
                            ]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => `${value.toFixed(1)}%`}
                      labelFormatter={(name: string) => name}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted">
              Sin datos suficientes de pedidos.
            </p>
          )}
        </motion.div>

        {/* Size distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-bg-secondary border border-border rounded-xl p-6"
        >
          <h2 className="text-xl font-bold mb-6">
            Distribución de tamaños (lado mayor)
          </h2>
          {stats?.sizeDistribution && stats.sizeDistribution.length > 0 ? (
            <div className="space-y-3">
              {stats.sizeDistribution.map((bucket) => (
                <div key={bucket.bucket}>
                  <div className="flex justify-between text-xs text-muted mb-1">
                    <span>{bucket.bucket}</span>
                    <span>
                      {bucket.count} pieza{bucket.count === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-bg-tertiary overflow-hidden">
                    <div
                      className="h-full bg-cyan"
                      style={{
                        width: `${Math.min(100, bucket.count * 10)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">
              Aún no hay datos de tamaños impresos.
            </p>
          )}
        </motion.div>
      </div>

      {/* Orders by Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-bg-secondary border border-border rounded-xl p-6"
      >
        <h2 className="text-xl font-bold mb-6">Pedidos por Estado</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {stats?.ordersByStatus?.map((item) => (
            <div
              key={item.status}
              className="text-center p-4 bg-bg-tertiary rounded-lg"
            >
              <div
                className={`inline-block px-3 py-1 rounded-full text-sm mb-2 ${statusColors[item.status] || "bg-gray-500/20"}`}
              >
                {statusLabels[item.status]?.es ?? item.status}
              </div>
              <div className="text-2xl font-bold">{item.count}</div>
            </div>
          )) || (
            <p className="col-span-full text-center text-muted">Sin datos</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
