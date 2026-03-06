"use client";
import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Star, ChevronRight, Home, Minus, Plus, ChevronDown, ChevronUp, Layers, Info } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { useToast } from "@/components/toast-provider";
import { calculatePrice, MATERIAL_INFO } from "@/lib/price-calculator";
import type { ReviewType } from "@/lib/types";
import { useLanguage } from "@/lib/language-store";

interface ProductData {
  id: string; name: string; description: string; category: string; material: string;
  basePricePerGram: number; density: number; finishCost: number;
  minDimX: number; minDimY: number; minDimZ: number;
  maxDimX: number; maxDimY: number; maxDimZ: number;
  defaultDimX: number; defaultDimY: number; defaultDimZ: number;
  images: string[]; colors: string[]; featured: boolean; stock: number;
  rating: number; reviewCount: number;
  reviews: ReviewType[];
}

const COLOR_MAP: Record<string, string> = {
  "Blanco": "#FFFFFF", "Negro": "#1a1a1a", "Gris": "#808080",
  "Rojo": "#EF4444", "Azul": "#3B82F6", "Verde": "#22C55E",
  "Amarillo": "#EAB308", "Naranja": "#F97316", "Cyan": "#00FFFF",
  "Transparente": "#d4d4d8", "Ámbar": "#FFBF00",
};

const MIN_DIM_CM = 1;
const MAX_DIM_CM = 25;

const mmToCm = (mm: number) => mm / 10;
const cmToMm = (cm: number) => cm * 10;

export function ProductDetailClient({ productId }: { productId: string }) {
  const { data: session } = useSession() || {};
  const addItem = useCartStore(s => s?.addItem);
  const { showToast } = useToast();
  const { language } = useLanguage();

  const t = {
    es: {
      adminNoPurchase: "Los administradores no pueden realizar compras",
      addedToCart: (name: string) => `${name} añadido al carrito`,
      productNotFound: "Producto no encontrado",
      backToCatalog: "Volver al catálogo",
      breadcrumbHome: "Inicio",
      breadcrumbCatalog: "Catálogo",
      ratingLabel: (count: number) => `${count} reseñas`,
      materialLabel: "Material",
      materialFallbackPLA: "Ideal para piezas decorativas y prototipos.",
      materialFallbackPETG: "Ideal para piezas funcionales y resistentes.",
      colorLabel: "Color",
      dimensionsLabel: "Dimensiones (cm)",
      dimXLabel: "X (Ancho)",
      dimYLabel: "Y (Profundidad)",
      dimZLabel: "Z (Altura)",
      quantityLabel: "Cantidad",
      qtyDecreaseAria: "Reducir cantidad",
      qtyIncreaseAria: "Aumentar cantidad",
      summaryQtyLabel: "Cantidad",
      totalLabel: "Total",
      priceHint:
        "El precio se calcula automáticamente según el material, las dimensiones y la cantidad seleccionada.",
      addToCart: "Añadir al Carrito",
      faqTitle: "Preguntas Frecuentes",
      reviewsTitle: "Reseñas",
      writeReviewTitle: "Escribe una reseña",
      reviewPlaceholder: "Comparte tu experiencia...",
      publishing: "Publicando...",
      publishReview: "Publicar reseña",
      noReviews: "Aún no hay reseñas. ¡Sé el primero!",
      anonymous: "Anónimo",
      starsAria: (n: number) => `${n} estrellas`,
      reviewPublished: "Reseña publicada",
      reviewError: "Error al publicar reseña",
      connectionError: "Error de conexión",
    },
    en: {
      adminNoPurchase: "Administrators cannot make purchases",
      addedToCart: (name: string) => `${name} added to cart`,
      productNotFound: "Product not found",
      backToCatalog: "Back to catalog",
      breadcrumbHome: "Home",
      breadcrumbCatalog: "Catalog",
      ratingLabel: (count: number) => `${count} reviews`,
      materialLabel: "Material",
      materialFallbackPLA: "Ideal for decorative parts and prototypes.",
      materialFallbackPETG: "Ideal for functional and durable parts.",
      colorLabel: "Color",
      dimensionsLabel: "Dimensions (cm)",
      dimXLabel: "X (Width)",
      dimYLabel: "Y (Depth)",
      dimZLabel: "Z (Height)",
      quantityLabel: "Quantity",
      qtyDecreaseAria: "Decrease quantity",
      qtyIncreaseAria: "Increase quantity",
      summaryQtyLabel: "Quantity",
      totalLabel: "Total",
      priceHint:
        "Price is calculated automatically based on material, dimensions and quantity.",
      addToCart: "Add to cart",
      faqTitle: "Frequently Asked Questions",
      reviewsTitle: "Reviews",
      writeReviewTitle: "Write a review",
      reviewPlaceholder: "Share your experience...",
      publishing: "Publishing...",
      publishReview: "Publish review",
      noReviews: "No reviews yet. Be the first!",
      anonymous: "Anonymous",
      starsAria: (n: number) => `${n} stars`,
      reviewPublished: "Review posted",
      reviewError: "Error while posting review",
      connectionError: "Connection error",
    },
  }[language];

  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [dimX, setDimX] = useState(50);
  const [dimY, setDimY] = useState(50);
  const [dimZ, setDimZ] = useState(50);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    fetch(`/api/products/${productId}`)
      .then(r => r?.json())
      .then(d => {
        if (d?.id) {
          setProduct(d);
          setSelectedMaterial(d?.material ?? "PLA");
          setSelectedColor(d?.colors?.[0] ?? "Blanco");
          const initialXcm = Math.max(MIN_DIM_CM, Math.min(MAX_DIM_CM, mmToCm(d?.defaultDimX ?? 50)));
          const initialYcm = Math.max(MIN_DIM_CM, Math.min(MAX_DIM_CM, mmToCm(d?.defaultDimY ?? 50)));
          const initialZcm = Math.max(MIN_DIM_CM, Math.min(MAX_DIM_CM, mmToCm(d?.defaultDimZ ?? 50)));
          setDimX(cmToMm(initialXcm));
          setDimY(cmToMm(initialYcm));
          setDimZ(cmToMm(initialZcm));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productId]);

  const matInfo = MATERIAL_INFO[selectedMaterial as keyof typeof MATERIAL_INFO] ?? MATERIAL_INFO.PLA;

  const priceCalc = useMemo(() => {
    if (!product) return { weight: 0, materialCost: 0, finishCost: 0, subtotal: 0, total: 0 };
    return calculatePrice({
      material: selectedMaterial,
      dimX, dimY, dimZ, quantity,
      // Parámetros técnicos vienen de BD (producto),
      // con fallback a la ficha de material.
      basePricePerGram: product?.basePricePerGram ?? (matInfo?.basePricePerGram ?? 0.02),
      density: product?.density ?? (matInfo?.density ?? 1.24),
      finishCost: product?.finishCost ?? 2.5,
    });
  }, [product, selectedMaterial, dimX, dimY, dimZ, quantity, matInfo]);

  const isAdmin = (session?.user as { role?: string })?.role === 'admin';

  const handleAddToCart = () => {
    if (!product) return;
    if (isAdmin) {
      showToast("warning", t.adminNoPurchase);
      return;
    }
    addItem?.({
      productId: product.id, name: product.name,
      image: product?.images?.[0] ?? "/og-image.png",
      material: selectedMaterial, color: selectedColor,
      quantity, dimX, dimY, dimZ,
      unitPrice: priceCalc?.subtotal ?? 0,
    });
    showToast("success", t.addedToCart(product.name));
  };

  const handleSubmitReview = async () => {
    if (!session?.user || !reviewText?.trim()) return;
    setSubmittingReview(true);
    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: reviewRating, comment: reviewText }),
      });
      if (res?.ok) {
        showToast("success", t.reviewPublished);
        setReviewText(""); setReviewRating(5);
        const updated = await fetch(`/api/products/${productId}`).then(r => r?.json());
        if (updated?.id) setProduct(updated);
      } else { showToast("error", t.reviewError); }
    } catch { showToast("error", t.connectionError); }
    setSubmittingReview(false);
  };

  const clampDim = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!product) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-zinc-400 mb-4">{t.productNotFound}</p>
        <Link href="/catalog" className="text-cyan hover:underline">{t.backToCatalog}</Link>
      </div>
    </div>
  );

  const faqs = [
    ...(language === "es"
      ? [
          { q: "¿Cuánto tarda la producción?", a: "El tiempo estándar es de 2-5 días laborables según el tamaño y complejidad de la pieza." },
          { q: "¿Puedo solicitar dimensiones personalizadas?", a: "Sí, puedes configurar las dimensiones exactas usando el configurador. Las dimensiones se limitan por las capacidades de la impresora." },
          { q: "¿Qué diferencia hay entre PLA y PETG?", a: "PLA es biodegradable y fácil de imprimir, ideal para decoración. PETG es más resistente y flexible, perfecto para piezas funcionales." },
          { q: "¿Cómo se calcula el precio?", a: "El precio se basa en el peso estimado de la pieza (según dimensiones y densidad del material), más un coste de acabado fijo." },
        ]
      : [
          { q: "How long does production take?", a: "Standard lead time is 2–5 business days depending on part size and complexity." },
          { q: "Can I request custom dimensions?", a: "Yes, you can configure exact dimensions with the configurator. Dimensions are limited by the printer capabilities." },
          { q: "What is the difference between PLA and PETG?", a: "PLA is easier to print and great for decoration. PETG is stronger and more flexible, ideal for functional parts." },
          { q: "How is the price calculated?", a: "Price is based on the estimated part weight (according to dimensions and material density) plus a fixed finishing cost." },
        ]),
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-site mx-auto px-4">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-cyan transition flex items-center gap-1">
            <Home className="w-3.5 h-3.5" /> {t.breadcrumbHome}
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/catalog" className="hover:text-cyan transition">{t.breadcrumbCatalog}</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-zinc-300">{product?.name ?? ""}</span>
        </nav>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-2 gap-10">
          {/* Image Gallery */}
          <div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative aspect-video rounded-xl overflow-hidden bg-zinc-800 mb-4">
              <Image src={product?.images?.[selectedImage] ?? product?.images?.[0] ?? "/og-image.png"} alt={product?.name ?? ""} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" priority />
            </motion.div>
            {(product?.images?.length ?? 0) > 1 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {(product?.images ?? []).map((img, i) => (
                  <button key={i} onClick={() => setSelectedImage(i)} className={`relative w-20 h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 transition ${selectedImage === i ? "border-cyan" : "border-transparent opacity-60 hover:opacity-100"}`}>
                    <Image src={img ?? "/og-image.png"} alt={`${product?.name} vista ${i + 1}`} fill className="object-cover" sizes="80px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Configuration Panel */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${product?.material === "PLA" ? "bg-cyan/10 text-cyan" : "bg-amber/10 text-amber"}`}>{product?.material ?? ""}</span>
              <span className="text-xs text-zinc-500">{product?.category ?? ""}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-3">{product?.name ?? ""}</h1>
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">{product?.description ?? ""}</p>

            {/* Rating */}
            {(product?.reviewCount ?? 0) > 0 && (
              <div className="flex items-center gap-2 mb-6">
                <div className="flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`w-4 h-4 ${i < Math.round(product?.rating ?? 0) ? "fill-amber text-amber" : "text-zinc-600"}`} />)}</div>
                <span className="text-sm text-zinc-400">
                  {(product?.rating ?? 0).toFixed(1)} ({t.ratingLabel(product?.reviewCount ?? 0)})
                </span>
              </div>
            )}

            {/* Configurator */}
            <div className="space-y-6 bg-bg-card rounded-xl p-6 border border-white/5">
              {/* Material Selector */}
              <div>
                <label className="text-sm font-medium text-zinc-300 mb-3 block">{t.materialLabel}</label>
                <div className="grid grid-cols-2 gap-3">
                  {(["PLA", "PETG"] as const).map(mat => (
                    <button
                      key={mat}
                      onClick={() => setSelectedMaterial(mat)}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        selectedMaterial === mat
                          ? mat === "PLA" ? "border-cyan bg-cyan/10" : "border-amber bg-amber/10"
                          : "border-white/10 hover:border-white/20"
                      }`}>
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4" style={{ color: MATERIAL_INFO[mat]?.color ?? "#fff" }} />
                        <span className="font-semibold text-sm">{mat}</span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                        {MATERIAL_INFO[mat]?.uses ??
                          (mat === "PLA"
                            ? t.materialFallbackPLA
                            : t.materialFallbackPETG)}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Selector */}
              <div>
                <label className="text-sm font-medium text-zinc-300 mb-3 block">
                  {t.colorLabel}: <span className="text-zinc-400 font-normal">{selectedColor}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {(product?.colors ?? []).slice(0, 3).map(color => (
                    <button key={color} onClick={() => setSelectedColor(color)}
                      className={`w-9 h-9 rounded-full border-2 transition-all flex items-center justify-center ${
                        selectedColor === color ? "border-cyan scale-110 ring-2 ring-cyan/30" : "border-white/20 hover:border-white/40"
                      }`}
                      style={{ backgroundColor: COLOR_MAP[color] ?? "#808080" }}
                      title={color} aria-label={`${t.colorLabel} ${color}`} />
                  ))}
                </div>
              </div>

              {/* Dimensions */}
              <div>
                <label className="text-sm font-medium text-zinc-300 mb-3 block">{t.dimensionsLabel}</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: t.dimXLabel, value: dimX, set: setDimX },
                    { label: t.dimYLabel, value: dimY, set: setDimY },
                    { label: t.dimZLabel, value: dimZ, set: setDimZ },
                  ].map(d => (
                    <div key={d.label}>
                      <span className="text-xs text-zinc-500 mb-1 block">
                        {d.label} ({MIN_DIM_CM}-{MAX_DIM_CM} cm)
                      </span>
                      <input
                        type="number"
                        min={MIN_DIM_CM}
                        max={MAX_DIM_CM}
                        step={0.5}
                        value={Number.isFinite(d.value) ? mmToCm(d.value).toFixed(1) : ""}
                        onChange={e => {
                          const raw = parseFloat(e?.target?.value ?? "");
                          if (Number.isNaN(raw)) {
                            d.set(cmToMm(MIN_DIM_CM));
                            return;
                          }
                          const clampedCm = clampDim(raw, MIN_DIM_CM, MAX_DIM_CM);
                          d.set(cmToMm(clampedCm));
                        }}
                        onBlur={e => {
                          const raw = parseFloat(e?.target?.value ?? "");
                          const valid = Number.isNaN(raw) ? MIN_DIM_CM : raw;
                          const clampedCm = clampDim(valid, MIN_DIM_CM, MAX_DIM_CM);
                          d.set(cmToMm(clampedCm));
                        }}
                        className="w-full bg-white/5 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:ring-1 focus:ring-cyan text-center"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="text-sm font-medium text-zinc-300 mb-3 block">{t.quantityLabel}</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition"
                    aria-label={t.qtyDecreaseAria}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input type="number" value={quantity} onChange={e => setQuantity(Math.max(1, parseInt(e?.target?.value ?? "1") || 1))} className="w-16 text-center bg-white/5 rounded-lg py-2 font-mono text-sm outline-none focus:ring-1 focus:ring-cyan" />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition"
                    aria-label={t.qtyIncreaseAria}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Price Summary (simplificado para clientes) */}
              <div className="bg-white/5 rounded-lg p-4 space-y-1">
                {quantity > 1 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">{t.summaryQtyLabel}</span>
                    <span className="font-mono">×{quantity}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline font-semibold">
                  <span>{t.totalLabel}</span>
                  <span className="font-mono text-xl text-cyan">
                    €{(priceCalc?.total ?? 0).toFixed(2)}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">
                  {t.priceHint}
                </p>
              </div>

              {/* Add to Cart */}
              <button onClick={handleAddToCart} className="w-full py-3 bg-cyan text-black font-semibold rounded-lg hover:bg-cyan-dim transition flex items-center justify-center gap-2">
                <ShoppingCart className="w-5 h-5" /> {t.addToCart}
              </button>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold mb-6">{t.faqTitle}</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-bg-card rounded-xl border border-white/5 overflow-hidden">
                <button onClick={() => setFaqOpen(faqOpen === i ? null : i)} className="w-full flex items-center justify-between p-4 text-sm font-medium text-left hover:bg-bg-hover transition">
                  {faq.q}
                  {faqOpen === i ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
                </button>
                <AnimatePresence>
                  {faqOpen === i && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                      <p className="px-4 pb-4 text-sm text-zinc-400">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </section>

        {/* Reviews */}
        <section className="mt-16 mb-16">
          <h2 className="text-2xl font-bold mb-6">
            {t.reviewsTitle} ({product?.reviewCount ?? 0})
          </h2>
          {session?.user && (
            <div className="bg-bg-card rounded-xl p-6 border border-white/5 mb-6">
              <h3 className="font-semibold mb-3 text-sm">{t.writeReviewTitle}</h3>
              <div className="flex gap-1 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setReviewRating(i + 1)}
                    aria-label={t.starsAria(i + 1)}
                  >
                    <Star className={`w-5 h-5 ${i < reviewRating ? "fill-amber text-amber" : "text-zinc-600"}`} />
                  </button>
                ))}
              </div>
              <textarea
                value={reviewText}
                onChange={e => setReviewText(e?.target?.value ?? "")}
                placeholder={t.reviewPlaceholder}
                className="w-full bg-white/5 rounded-lg p-3 text-sm outline-none focus:ring-1 focus:ring-cyan placeholder-zinc-500 resize-none h-20"
              />
              <button onClick={handleSubmitReview} disabled={submittingReview || !reviewText?.trim()} className="mt-3 px-4 py-2 bg-cyan text-black rounded-lg text-sm font-medium hover:bg-cyan-dim transition disabled:opacity-50">
                {submittingReview ? t.publishing : t.publishReview}
              </button>
            </div>
          )}
          <div className="space-y-4">
            {(product?.reviews ?? []).map((r, i) => (
              <motion.div key={r?.id ?? i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-bg-card rounded-xl p-5 border border-white/5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-cyan/20 flex items-center justify-center text-cyan text-sm font-bold">{(r?.user?.name ?? r?.user?.email ?? "U")?.[0]?.toUpperCase()}</div>
                  <div>
                    <p className="text-sm font-medium">{r?.user?.name ?? t.anonymous}</p>
                    <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, j) => <Star key={j} className={`w-3 h-3 ${j < (r?.rating ?? 0) ? "fill-amber text-amber" : "text-zinc-600"}`} />)}</div>
                  </div>
                </div>
                <p className="text-sm text-zinc-400">{r?.comment ?? ""}</p>
              </motion.div>
            ))}
            {(product?.reviews?.length ?? 0) === 0 && (
              <p className="text-sm text-zinc-500">{t.noReviews}</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
