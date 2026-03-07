"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, Package, ArrowRight } from "lucide-react";
import { useLanguage } from "@/lib/language-store";
import { useCartStore } from "@/lib/cart-store";

export function SuccessClient() {
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get("session_id") ?? "";
  const [mounted, setMounted] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const { language } = useLanguage();
  const { clearCart } = useCartStore();

  useEffect(() => {
    setMounted(true);
    clearCart();
    if (!sessionId) return;
    fetch(`/api/checkout/verify?session_id=${encodeURIComponent(sessionId)}`)
      .then(r => r.json())
      .then((d: { orderId?: string }) => { if (d?.orderId) setOrderId(d.orderId); })
      .catch(() => {});
  }, [clearCart, sessionId]);

  const t = {
    es: {
      title: "¡Pedido Confirmado!",
      subtitle: "Tu pago ha sido procesado correctamente.",
      orderRef: "Ref. de pedido:",
      myOrders: "Mis Pedidos",
      keepShopping: "Seguir Comprando",
    },
    en: {
      title: "Order Confirmed!",
      subtitle: "Your payment has been processed successfully.",
      orderRef: "Order ref:",
      myOrders: "My Orders",
      keepShopping: "Keep Shopping",
    },
  }[language];

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex items-center justify-center py-20 px-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-green-400/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-400" />
        </div>
        <h1 className="text-3xl font-bold mb-3">{t.title}</h1>
        <p className="text-zinc-400 mb-2">{t.subtitle}</p>
        {orderId && <p className="text-xs text-zinc-500 font-mono mb-8">{t.orderRef} #{orderId.slice(-8).toUpperCase()}</p>}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/orders" className="inline-flex items-center gap-2 px-6 py-3 bg-cyan text-black font-semibold rounded-lg hover:bg-cyan-dim transition text-sm">
            <Package className="w-4 h-4" /> {t.myOrders}
          </Link>
          <Link href="/catalog" className="inline-flex items-center gap-2 px-6 py-3 border border-white/10 rounded-lg hover:bg-white/5 transition text-sm">
            {t.keepShopping} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
