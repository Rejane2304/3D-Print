'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingCart, Trash2, Package } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from '@/components/toast-provider';
import { useCartStore } from '@/lib/cart-store';
import type { WishlistItemType } from '@/lib/types';

export default function WishlistClient() {
  const { status } = useSession() || {};
  const router = useRouter();
  const { showToast } = useToast();
  const { addItem } = useCartStore();

  const [wishlist, setWishlist] = useState<WishlistItemType[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = useCallback(async () => {
    try {
      const res = await fetch('/api/wishlist');
      const data = await res.json();
      setWishlist(data);
    } catch {
      showToast('error', 'Error al cargar favoritos');
    }
    setLoading(false);
  }, [showToast]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchWishlist();
    }
  }, [status, router, fetchWishlist]);

  const removeFromWishlist = async (productId: string) => {
    try {
      const res = await fetch('/api/wishlist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      if (res.ok) {
        setWishlist(wishlist.filter((item) => item.productId !== productId));
        showToast('success', 'Eliminado de favoritos');
      }
    } catch {
      showToast('error', 'Error al eliminar');
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
      image: product.images[0] || '',
      material: product.material,
      color: product.colors[0] || '#FFFFFF',
      quantity: 1,
      dimensions: {
        x: product.defaultDimX,
        y: product.defaultDimY,
        z: product.defaultDimZ,
      },
      unitPrice: price,
    });

    removeFromWishlist(item.productId);
    showToast('success', 'Movido al carrito');
  };

  if (status === 'loading' || loading) {
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
            <h1 className="text-3xl font-bold">Mi Lista de Deseos</h1>
            <p className="text-muted">{wishlist.length} productos guardados</p>
          </div>
        </div>

        {wishlist.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <Package className="w-16 h-16 text-muted mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Tu lista de deseos está vacía</h2>
            <p className="text-muted mb-6">Guarda tus productos favoritos para comprarlos más tarde</p>
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 px-6 py-3 bg-cyan text-black font-medium rounded-lg hover:bg-cyan-dark transition-colors"
            >
              Explorar Catálogo
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
                        className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${item.product.material === 'PLA' ? 'bg-cyan/90 text-black' : 'bg-amber/90 text-black'}`}
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
                    <p className="text-lg font-bold text-cyan mb-4">
                      desde €{
                        (() => {
                          const product = item.product;
                          const material = product.material ?? "PLA";
                          const basePricePerGram = product.basePricePerGram ?? 0;
                          const density = product.density ?? (material === "PETG" ? 1.27 : 1.24);
                          const volumeCm3 = ((product.defaultDimX ?? 50) * (product.defaultDimY ?? 50) * (product.defaultDimZ ?? 50)) / 1000;
                          const weight = volumeCm3 * density * 0.2;
                          const materialCost = basePricePerGram * weight;
                          const subtotal = materialCost + (product.finishCost ?? 0);
                          return subtotal.toFixed(2);
                        })()
                      }
                    </p>

                    <div className="flex gap-2">
                      <button
                        onClick={() => moveToCart(item)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-cyan text-black font-medium rounded-lg hover:bg-cyan-dark transition-colors"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Carrito
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
