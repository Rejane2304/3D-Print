"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Trash2,
  Minus,
  Plus,
  ArrowRight,
  ShoppingBag,
  ArrowLeft,
} from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { useToast } from "@/components/toast-provider";
import { useLanguage } from "@/lib/language-store";

export function CartClient() {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const { items, removeItem, updateQuantity, getSubtotal } = useCartStore();
  const { showToast } = useToast();
  const { language } = useLanguage();
  const subtotal = getSubtotal?.() ?? 0;
  const tax = subtotal * 0.21;
  const shipping = subtotal > 50 ? 0 : 5.99;
  const total = subtotal + tax + shipping;

  const t = {
    es: {
      emptyTitle: "Tu carrito está vacío",
      emptyDesc: "Explora nuestro catálogo y encuentra piezas únicas",
      toCatalog: "Ir al Catálogo",
      title: "Carrito de Compras",
      back: "Volver",
      items: (n: number) => `${n} producto${n === 1 ? "" : "s"} en tu carrito`,
      summary: "Resumen del Pedido",
      subtotal: "Subtotal",
      tax: "IVA (21%)",
      shipping: "Envío",
      free: "Gratis",
      freeShipping: "¡Envío gratis en pedidos +€50!",
      total: "Total",
      checkout: "Proceder al Checkout",
      loginToBuy: "Inicia sesión para comprar",
      removed: "Producto eliminado",
      reduceQty: "Reducir",
      increaseQty: "Aumentar",
      removeItem: "Eliminar",
      productAlt: "Producto",
    },
    en: {
      emptyTitle: "Your cart is empty",
      emptyDesc: "Explore our catalog and find unique pieces",
      toCatalog: "Go to Catalog",
      title: "Shopping Cart",
      back: "Back",
      items: (n: number) => `${n} item${n === 1 ? "" : "s"} in your cart`,
      summary: "Order Summary",
      subtotal: "Subtotal",
      tax: "VAT (21%)",
      shipping: "Shipping",
      free: "Free",
      freeShipping: "Free shipping on orders over €50!",
      total: "Total",
      checkout: "Proceed to Checkout",
      loginToBuy: "Sign in to purchase",
      removed: "Item removed",
      reduceQty: "Reduce",
      increaseQty: "Increase",
      removeItem: "Remove",
      productAlt: "Product",
    },
  }[language];

  if ((items?.length ?? 0) === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <ShoppingBag className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">{t.emptyTitle}</h2>
          <p className="text-zinc-400 mb-6">{t.emptyDesc}</p>
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 px-6 py-3 bg-cyan text-black font-semibold rounded-lg hover:bg-cyan-dim transition text-sm"
          >
            {t.toCatalog} <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-site mx-auto px-4">
        <div className="flex items-center justify-between gap-4 mb-2">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ShoppingCart className="w-7 h-7 text-cyan" /> {t.title}
          </h1>
          <button
            type="button"
            onClick={() => router.push("/catalog")}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-white/10 hover:bg-white/5 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.back}
          </button>
        </div>
        <p className="text-zinc-400 text-sm mb-8">{t.items(items?.length ?? 0)}</p>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {(items ?? []).map((item, i) => (
              <motion.div
                key={item?.id ?? i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-bg-card rounded-xl p-4 border border-white/5 flex gap-4"
              >
                <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                  <Image
                    src={item?.image ?? "/og-image.png"}
                    alt={item?.name ?? t.productAlt}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm mb-1 truncate">{item?.name ?? ""}</h3>
                  <div className="flex flex-wrap gap-2 text-xs text-zinc-400 mb-2">
                    <span
                      className={`px-2 py-0.5 rounded-full ${item?.material === "PLA" ? "bg-cyan/10 text-cyan" : "bg-amber/10 text-amber"}`}
                    >
                      {item?.material ?? ""}
                    </span>
                    <span>{item?.color ?? ""}</span>
                    <span className="font-mono">
                      {((item?.dimX ?? 0) / 10).toFixed(1)}×{((item?.dimY ?? 0) / 10).toFixed(1)}×
                      {((item?.dimZ ?? 0) / 10).toFixed(1)} cm
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity?.(item?.id ?? "", (item?.quantity ?? 1) - 1)}
                        className="w-7 h-7 rounded bg-white/5 flex items-center justify-center hover:bg-white/10 transition"
                        aria-label={t.reduceQty}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-mono text-sm w-6 text-center">
                        {item?.quantity ?? 1}
                      </span>
                      <button
                        onClick={() => updateQuantity?.(item?.id ?? "", (item?.quantity ?? 1) + 1)}
                        className="w-7 h-7 rounded bg-white/5 flex items-center justify-center hover:bg-white/10 transition"
                        aria-label={t.increaseQty}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm text-cyan">
                        €{((item?.unitPrice ?? 0) * (item?.quantity ?? 1)).toFixed(2)}
                      </span>
                      <button
                        onClick={() => {
                          removeItem?.(item?.id ?? "");
                          showToast("info", t.removed);
                        }}
                        className="p-1.5 rounded hover:bg-red-400/10 text-zinc-400 hover:text-red-400 transition"
                        aria-label={t.removeItem}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-bg-card rounded-xl p-6 border border-white/5 card-shadow sticky top-24">
              <h3 className="font-semibold mb-4">{t.summary}</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-400">{t.subtotal}</span>
                  <span className="font-mono">€{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">{t.tax}</span>
                  <span className="font-mono">€{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">{t.shipping}</span>
                  <span className="font-mono">
                    {shipping === 0 ? t.free : `€${shipping.toFixed(2)}`}
                  </span>
                </div>
                {subtotal <= 50 && <p className="text-xs text-zinc-500">{t.freeShipping}</p>}
                <div className="border-t border-white/10 pt-3 flex justify-between font-semibold">
                  <span>{t.total}</span>
                  <span className="font-mono text-lg text-cyan">€{total.toFixed(2)}</span>
                </div>
              </div>
              {session?.user ? (
                <Link
                  href="/checkout"
                  className="block w-full mt-6 py-3 bg-cyan text-black font-semibold rounded-lg hover:bg-cyan-dim transition text-sm text-center"
                >
                  {t.checkout}
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="block w-full mt-6 py-3 bg-cyan text-black font-semibold rounded-lg hover:bg-cyan-dim transition text-sm text-center"
                >
                  {t.loginToBuy}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
