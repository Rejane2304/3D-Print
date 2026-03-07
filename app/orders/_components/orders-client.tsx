"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Package, Clock, CheckCircle, XCircle, CreditCard, RefreshCw, Truck, Star } from "lucide-react";
import type { OrderType } from "@/lib/types";
import { useLanguage } from "@/lib/language-store";

const WORKFLOW_STEPS = ["paid", "processing", "ready", "shipped", "delivered"] as const;

export function OrdersClient() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const { language } = useLanguage();
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [loading, setLoading] = useState(true);

  const t = {
    es: {
      title: "Mis Pedidos",
      orders: (n: number) => `${n} pedido${n === 1 ? "" : "s"}`,
      empty: "Aún no tienes pedidos",
      total: "Total",
      status: {
        pending:    "Pago pendiente",
        paid:       "Pagado",
        processing: "En producción",
        ready:      "Listo para envío",
        shipped:    "Enviado",
        delivered:  "Entregado",
        cancelled:  "Cancelado",
      },
      locale: "es-ES",
    },
    en: {
      title: "My Orders",
      orders: (n: number) => `${n} order${n === 1 ? "" : "s"}`,
      empty: "You have no orders yet",
      total: "Total",
      status: {
        pending:    "Payment pending",
        paid:       "Paid",
        processing: "In production",
        ready:      "Ready to ship",
        shipped:    "Shipped",
        delivered:  "Delivered",
        cancelled:  "Cancelled",
      },
      locale: "en-GB",
    },
  }[language];

  const statusConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
    pending:    { icon: Clock,        color: "text-amber",       label: t.status.pending    },
    paid:       { icon: CheckCircle,  color: "text-green-400",   label: t.status.paid       },
    processing: { icon: RefreshCw,    color: "text-blue-400",    label: t.status.processing },
    ready:      { icon: Star,         color: "text-amber-400",   label: t.status.ready      },
    shipped:    { icon: Package,      color: "text-cyan",        label: t.status.shipped    },
    delivered:  { icon: Truck,        color: "text-emerald-400", label: t.status.delivered  },
    cancelled:  { icon: XCircle,      color: "text-red-400",     label: t.status.cancelled  },
  };

  useEffect(() => {
    const role = (session?.user as { role?: string })?.role;
    if (status === "unauthenticated") {
      router.replace("/login");
    } else if (status === "authenticated" && role === "admin") {
      router.replace("/admin");
    }
  }, [status, router, session]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/orders")
        .then(r => r?.json())
        .then(d => setOrders(d?.orders ?? []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-site mx-auto px-4">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Package className="w-7 h-7 text-cyan" /> {t.title}
        </h1>
        <p className="text-zinc-400 text-sm mb-8">{t.orders(orders?.length ?? 0)}</p>

        {(orders?.length ?? 0) === 0 ? (
          <div className="text-center py-20">
            <CreditCard className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400">{t.empty}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {(orders ?? []).map((order, i) => {
              const sc = statusConfig[order?.status ?? "pending"] ?? statusConfig.pending;
              const StatusIcon = sc.icon;
              const isCancelled = order?.status === "cancelled";
              const currentStepIdx = WORKFLOW_STEPS.indexOf(order?.status as typeof WORKFLOW_STEPS[number]);

              return (
                <motion.div key={order?.id ?? i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-bg-card rounded-xl p-5 border border-white/5">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <div>
                      <p className="text-xs text-zinc-500 font-mono">#{(order?.id ?? "").slice(-8).toUpperCase()}</p>
                      <p className="text-xs text-zinc-500">{order?.createdAt ? new Date(order.createdAt).toLocaleDateString(t.locale) : ""}</p>
                    </div>
                    <div className={`flex items-center gap-1 text-sm font-medium ${sc.color}`}>
                      <StatusIcon className="w-4 h-4" /> {sc.label}
                    </div>
                  </div>

                  {/* Progress timeline (only for active workflow orders) */}
                  {!isCancelled && order?.status !== "pending" && (
                    <div className="flex items-center gap-0 mb-4 overflow-x-auto pb-1">
                      {WORKFLOW_STEPS.map((step, idx) => {
                        const stepCfg = statusConfig[step];
                        const StepIcon = stepCfg.icon;
                        const isActive = order?.status === step;
                        const isDone = currentStepIdx > idx;
                        let circleClass = 'bg-white/5 text-zinc-600';
                        if (isActive) circleClass = 'bg-cyan text-black';
                        else if (isDone) circleClass = 'bg-white/10 text-zinc-300';
                        let textClass = 'text-zinc-600';
                        if (isActive) textClass = 'text-cyan font-medium';
                        else if (isDone) textClass = 'text-zinc-400';
                        return (
                          <React.Fragment key={step}>
                            <div className="flex flex-col items-center gap-1 flex-shrink-0">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${circleClass}`}>
                                <StepIcon className="w-3.5 h-3.5" />
                              </div>
                              <span className={`text-[10px] whitespace-nowrap ${textClass}`}>
                                {stepCfg.label}
                              </span>
                            </div>
                            {idx < WORKFLOW_STEPS.length - 1 && (
                              <div className={`flex-1 h-px min-w-4 mx-1 mb-4 ${isDone ? "bg-white/20" : "bg-white/5"}`} />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  )}

                  <div className="space-y-2">
                    {(order?.items ?? []).map((item, j) => (
                      <div key={item?.id ?? j} className="flex justify-between text-sm">
                        <span className="text-zinc-400">
                          {item?.name ?? ""} <span className="text-xs">({item?.material ?? ""}, {item?.color ?? ""}) x{item?.quantity ?? 1}</span>
                        </span>
                        <span className="font-mono">€{((item?.unitPrice ?? 0) * (item?.quantity ?? 1)).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/5 flex justify-between font-semibold">
                    <span>{t.total}</span>
                    <span className="font-mono text-cyan">€{(order?.total ?? 0).toFixed(2)}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
