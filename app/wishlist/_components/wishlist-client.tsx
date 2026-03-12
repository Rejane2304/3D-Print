"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ShoppingCart, Trash2, Package } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useToast } from "@/components/toast-provider";
import { useCartStore } from "@/lib/cart-store";
import { useLanguage } from "@/lib/language-store";
import type { WishlistItemType } from "@/lib/types";

export default function WishlistClient() {
  const { status } = useSession() || {};
  const router = useRouter();
  const { showToast } = useToast();
  const { addItem } = useCartStore();
  const { language } = useLanguage();

  const [wishlist, setWishlist] = useState<WishlistItemType[]>([]);
  const [loading, setLoading] = useState(true);

  const t = {
    es: {
      title: "Mi Lista de Deseos",
      saved: (n: number) => `${n} producto${n === 1 ? "" : "s"} guardado${n === 1 ? "" : "s"}`,
      emptyTitle: "Tu lista de deseos está vacía",
      emptyDesc: "Guarda tus productos favoritos para comprarlos más tarde",
      exploreCatalog: "Explorar Catálogo",
      addToCart: "Carrito",
      from: "desde",
      errorLoad: "Error al cargar favoritos",
      removed: "Eliminado de favoritos",
      errorRemove: "Error al eliminar",
      movedToCart: "Movido al carrito",
    },
    en: {
      title: "My Wishlist",
      saved: (n: number) => `${n} saved product${n === 1 ? "" : "s"}`,
      emptyTitle: "Your wishlist is empty",
      emptyDesc: "Save your favourite products to buy them later",
      exploreCatalog: "Explore Catalog",
      addToCart: "Add to Cart",
      from: "from",
      errorLoad: "Error loading wishlist",
      removed: "Removed from wishlist",
      errorRemove: "Error removing item",
      movedToCart: "Moved to cart",
    },
  }[language];

  const fetchWishlist = useCallback(async () => {
    try {
      const res = await fetch("/api/wishlist");
      const data = await res.json();
      setWishlist(data);
    } catch {
      showToast("error", t.errorLoad);
    }
    setLoading(false);
  }, [showToast, t.errorLoad]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchWishlist();
    }
  }, [status, router, fetchWishlist]);

  const removeFromWishlist = async (productId: string) => {
    try {
      const res = await fetch("/api/wishlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (res.ok) {
        setWishlist(wishlist.filter((item) => item.productId !== productId));
        showToast("success", t.removed);
      }
    } catch {
      showToast("error", t.errorRemove);
    }
  };

  const moveToCart = (item: WishlistItemType) => {
    const product = item.product;
    const weight =
      ((product.defaultDimX * product.defaultDimY * product.defaultDimZ) / 1000) *
      product.density *
      0.2;
    const price = weight * product.basePricePerGram + product.finishCost;

    addItem({
      id: `${product.id}-${Date.now()}`,
      productId: product.id,
      name: product.name,
      image: product.images[0] || "",
      material: product.material,
      color: product.colors[0] || "#FFFFFF",
      quantity: 1,
      dimensions: {
        x: product.defaultDimX,
        y: product.defaultDimY,
        z: product.defaultDimZ,
      },
      unitPrice: price,
    });

    removeFromWishlist(item.productId);
    showToast("success", t.movedToCart);
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="w-8 h-8 text-red-400 fill-red-400" />
          <div>
            <h1 className="text-3xl font-bold">{t.title}</h1>
            <p className="text-muted">{t.saved(wishlist.length)}</p>
          </div>
        </div>

        {wishlist.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <Package className="w-16 h-16 text-muted mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">{t.emptyTitle}</h2>
            <p className="text-muted mb-6">{t.emptyDesc}</p>
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 px-6 py-3 bg-cyan text-black font-medium rounded-lg hover:bg-cyan-dark transition-colors"
            >
              {t.exploreCatalog}
            </Link>
          </motion.div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {wishlist.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-bg-secondary border border-border rounded-xl overflow-hidden group"
                >
                  <Link href={`/product/${item.product.id}`} className="block">
                    <div className="relative aspect-square bg-bg-tertiary">
                      {item.product.images[0] && (
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      )}
                      <div
                        className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${item.product.material === "PLA" ? "bg-cyan/90 text-black" : "bg-amber/90 text-black"}`}
                      >
                        {item.product.material}
                      </div>
                    </div>
                  </Link>

                  <div className="p-4">
                    <Link href={`/product/${item.product.id}`}>
                      <h3 className="font-bold mb-1 hover:text-cyan transition-colors">
                        {item.product.name}
                      </h3>
                    </Link>
                    <p className="text-sm text-muted mb-3">{item.product.category}</p>
                    <p className="font-mono text-sm text-cyan mb-4">
                      {`${((item.product.defaultDimX ?? 0) / 10).toFixed(2)} x ${((item.product.defaultDimY ?? 0) / 10).toFixed(2)} x ${((item.product.defaultDimZ ?? 0) / 10).toFixed(2)} cm`}
                    </p>

                    <div className="flex gap-2">
                      <button
                        onClick={() => moveToCart(item)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-cyan text-black font-medium rounded-lg hover:bg-cyan-dark transition-colors"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        {t.addToCart}
                      </button>
                      <button
                        onClick={() => removeFromWishlist(item.productId)}
                        className="p-2 border border-border rounded-lg hover:bg-red-500/20 hover:border-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
