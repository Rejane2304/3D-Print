"use client";
import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  Star,
  ChevronRight,
  Home,
  Minus,
  Plus,
  ChevronDown,
  ChevronUp,
  Layers,
  Info,
  TrendingDown,
} from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { useToast } from "@/components/toast-provider";
import { calculatePriceFromDimensions, MATERIAL_INFO } from "@/lib/price-calculator";
import type { ReviewType, MaterialType } from "@/lib/types";
import { useLanguage } from "@/lib/language-store";

interface ProductData {
  id: string;
  name: string;
  description: string;
  category: string;
  material: string;
  basePricePerGram: number;
  density: number;
  finishCost: number;
  printTimeMinutes: number;
  modelFillFactor: number;
  minDimX: number;
  minDimY: number;
  minDimZ: number;
  maxDimX: number;
  maxDimY: number;
  maxDimZ: number;
  defaultDimX: number;
  defaultDimY: number;
  defaultDimZ: number;
  images: string[];
  colors: string[];
  featured: boolean;
  stock: number;
  rating: number;
  reviewCount: number;
  reviews: ReviewType[];
}

const COLOR_MAP: Record<string, string> = {
  Blanco: "#FFFFFF",
  Negro: "#1a1a1a",
  Gris: "#808080",
  Rojo: "#EF4444",
  Azul: "#3B82F6",
  Verde: "#22C55E",
  Amarillo: "#EAB308",
  Naranja: "#F97316",
  Cyan: "#00FFFF",
  Transparente: "#d4d4d8",
  Ámbar: "#FFBF00",
};

const MAX_DIM_CM = 25;
const mmToCm = (mm: number) => mm / 10;
const cmToMm = (cm: number) => cm * 10;

export function ProductDetailClient({ productId }: Readonly<{ productId: string }>) {
  const { data: session } = useSession() || {};
  const addItem = useCartStore((s) => s?.addItem);
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
      colorLabel: "Color",
      dimensionsLabel: "Dimensiones (cm)",
      dimXLabel: "X (Ancho)",
      dimYLabel: "Y (Prof.)",
      dimZLabel: "Z (Alto)",
      quantityLabel: "Cantidad",
      qtyDecreaseAria: "Reducir cantidad",
      qtyIncreaseAria: "Aumentar cantidad",
      summaryQtyLabel: "Cantidad",
      totalLabel: "Total",
      estimatedWeight: "Peso estimado",
      printTimeLabel: "Tiempo impresión",
      costBreakdownTitle: "Desglose de costos",
      materialCost: "Material",
      machineCost: "Amortización máquina",
      maintenanceCost: "Mantenimiento",
      operationCost: "Electricidad",
      consumablesCost: "Consumibles",
      finishCostLabel: "Acabado",
      baseCost: "Costo base",
      tieredTitle: "Precios por volumen",
      tieredUnit: "1–4 uds.",
      tieredMedium: "5–9 uds.",
      tieredBulk: "10+ uds.",
      priceHint:
        "Precio calculado según material, dimensiones y cantidad. Descuentos por volumen disponibles.",
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
      imageView: "vista",
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
      estimatedWeight: "Estimated weight",
      printTimeLabel: "Print time",
      costBreakdownTitle: "Cost breakdown",
      materialCost: "Material",
      machineCost: "Machine amortization",
      maintenanceCost: "Maintenance",
      operationCost: "Electricity",
      consumablesCost: "Consumables",
      finishCostLabel: "Finishing",
      baseCost: "Base cost",
      tieredTitle: "Volume pricing",
      tieredUnit: "1–4 units",
      tieredMedium: "5–9 units",
      tieredBulk: "10+ units",
      priceHint:
        "Price calculated by material, dimensions and quantity. Volume discounts available.",
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
      imageView: "view",
    },
  }[language];

  const [product, setProduct] = useState<ProductData | null>(null);
  const [materials, setMaterials] = useState<MaterialType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [dimX, setDimX] = useState(50); // en mm (interno)
  const [dimY, setDimY] = useState(50); // en mm (interno)
  const [dimZ, setDimZ] = useState(50); // en mm (interno)
  const [dimXStr, setDimXStr] = useState("5"); // cm como string (input)
  const [dimYStr, setDimYStr] = useState("5");
  const [dimZStr, setDimZStr] = useState("5");
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);

  // Cargar producto y materiales en paralelo
  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/products/${productId}`).then((r) => r.json()),
      fetch("/api/materials")
        .then((r) => r.json())
        .catch(() => []),
    ])
      .then(([productData, materialsData]) => {
        if (productData?.id) {
          setProduct(productData);
          setSelectedMaterial(productData.material ?? "PLA");
          setSelectedColor(productData.colors?.[0] ?? "Blanco");
          const clampedX = clampDim(
            productData.defaultDimX ?? 50,
            productData.minDimX ?? 10,
            productData.maxDimX ?? 300
          );
          const clampedY = clampDim(
            productData.defaultDimY ?? 50,
            productData.minDimY ?? 10,
            productData.maxDimY ?? 300
          );
          const clampedZ = clampDim(
            productData.defaultDimZ ?? 50,
            productData.minDimZ ?? 10,
            productData.maxDimZ ?? 300
          );
          setDimX(clampedX);
          setDimY(clampedY);
          setDimZ(clampedZ);
          setDimXStr(String(mmToCm(clampedX)));
          setDimYStr(String(mmToCm(clampedY)));
          setDimZStr(String(mmToCm(clampedZ)));
        }
        if (Array.isArray(materialsData) && materialsData.length > 0) {
          setMaterials(materialsData);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productId]);

  // Datos del material seleccionado: primero desde BD, luego desde MATERIAL_INFO
  const matConfig = useMemo(() => {
    const fromDB = materials.find((m) => m.code === selectedMaterial);
    if (fromDB)
      return {
        pricePerKg: fromDB.pricePerKg,
        density: fromDB.density,
        maintenanceFactor: fromDB.maintenanceFactor,
      };
    const fromStatic =
      MATERIAL_INFO[selectedMaterial as keyof typeof MATERIAL_INFO] ?? MATERIAL_INFO.PLA;
    return {
      pricePerKg: fromStatic.pricePerKg,
      density: fromStatic.density,
      maintenanceFactor: fromStatic.maintenanceFactor,
    };
  }, [materials, selectedMaterial]);

  const priceCalc = useMemo(() => {
    if (!product) return null;
    return calculatePriceFromDimensions(
      dimX,
      dimY,
      dimZ,
      product.printTimeMinutes ?? 60,
      matConfig,
      {
        quantity,
        finishCost: product.finishCost ?? 2.5,
        fillFactor: product.modelFillFactor ?? 0.15,
        refDimX: product.defaultDimX,
        refDimY: product.defaultDimY,
        refDimZ: product.defaultDimZ,
      }
    );
  }, [product, dimX, dimY, dimZ, quantity, matConfig]);

  const isAdmin = (session?.user as { role?: string })?.role === "admin";

  const handleAddToCart = () => {
    if (!product || !priceCalc) return;
    if (isAdmin) {
      showToast("warning", t.adminNoPurchase);
      return;
    }
    addItem?.({
      productId: product.id,
      name: product.name,
      image: product.images?.[0] ?? "/og-image.png",
      material: selectedMaterial,
      color: selectedColor,
      quantity,
      dimX,
      dimY,
      dimZ,
      unitPrice: priceCalc.priceUnit,
    });
    showToast("success", t.addedToCart(product.name));
  };

  const handleSubmitReview = async () => {
    if (!session?.user || !reviewText?.trim()) return;
    setSubmittingReview(true);
    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: reviewRating, comment: reviewText }),
      });
      if (res?.ok) {
        showToast("success", t.reviewPublished);
        setReviewText("");
        setReviewRating(5);
        const updated = await fetch(`/api/products/${productId}`).then((r) => r.json());
        if (updated?.id) setProduct(updated);
      } else {
        showToast("error", t.reviewError);
      }
    } catch {
      showToast("error", t.connectionError);
    }
    setSubmittingReview(false);
  };

  // Lista de materiales a mostrar (desde BD o desde MATERIAL_INFO si BD vacía)
  const materialList = useMemo(() => {
    if (materials.length > 0) return materials.map((m) => m.code);
    return Object.keys(MATERIAL_INFO);
  }, [materials]);

  const clampDim = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

  const getBadgeClass = (code: string) => {
    const colorMap: Record<string, string> = {
      PLA: "bg-cyan/10 text-cyan border-cyan",
      PETG: "bg-amber/10 text-amber border-amber",
      ASA: "bg-orange-500/10 text-orange-400 border-orange-500",
      TPU: "bg-purple-500/10 text-purple-400 border-purple-500",
    };
    return colorMap[code] ?? "bg-zinc-700/10 text-zinc-400 border-zinc-600";
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (!product)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">{t.productNotFound}</p>
          <Link href="/catalog" className="text-cyan hover:underline">
            {t.backToCatalog}
          </Link>
        </div>
      </div>
    );

  const faqs =
    language === "es"
      ? [
          {
            q: "¿Cuánto tarda la producción?",
            a: "El tiempo estándar es de 2–5 días laborables según el tamaño y complejidad de la pieza.",
          },
          {
            q: "¿Puedo solicitar dimensiones personalizadas?",
            a: "Sí, puedes configurar las dimensiones exactas usando el configurador. Las dimensiones se limitan por las capacidades de la impresora.",
          },
          {
            q: "¿Qué diferencia hay entre PLA y PETG?",
            a: "PLA es biodegradable y fácil de imprimir, ideal para decoración. PETG es más resistente y flexible, perfecto para piezas funcionales.",
          },
          {
            q: "¿Cómo se calcula el precio?",
            a: "El precio incluye material, amortización de máquina (P2S), mantenimiento y electricidad. Hay descuentos por volumen para pedidos de 5 o más unidades.",
          },
        ]
      : [
          {
            q: "How long does production take?",
            a: "Standard lead time is 2–5 business days depending on part size and complexity.",
          },
          {
            q: "Can I request custom dimensions?",
            a: "Yes, configure exact dimensions with the configurator. Dimensions are limited by the printer capabilities.",
          },
          {
            q: "What is the difference between PLA and PETG?",
            a: "PLA is easier to print and great for decoration. PETG is stronger and more flexible, ideal for functional parts.",
          },
          {
            q: "How is the price calculated?",
            a: "Price includes material, machine amortization (P2S), maintenance and electricity. Volume discounts apply for 5+ units.",
          },
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
          <Link href="/catalog" className="hover:text-cyan transition">
            {t.breadcrumbCatalog}
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-zinc-300">{product.name}</span>
        </nav>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-2 gap-10">
          {/* Image Gallery */}
          <div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative aspect-video rounded-xl overflow-hidden bg-zinc-800 mb-4"
            >
              <Image
                src={product.images?.[selectedImage] ?? product.images?.[0] ?? "/og-image.png"}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </motion.div>
            {product.images?.length > 1 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {product.images.map((img, i) => (
                  <button
                    key={img}
                    onClick={() => setSelectedImage(i)}
                    className={`relative w-20 h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 transition ${selectedImage === i ? "border-cyan" : "border-transparent opacity-60 hover:opacity-100"}`}
                  >
                    <Image
                      src={img ?? "/og-image.png"}
                      alt={`${product.name} ${t.imageView} ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Configuration Panel */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getBadgeClass(product.material)}`}
              >
                {product.material}
              </span>
              <span className="text-xs text-zinc-500">{product.category}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-3">{product.name}</h1>
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">{product.description}</p>

            {product.reviewCount > 0 && (
              <div className="flex items-center gap-2 mb-6">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={"star-" + i}
                      className={`w-4 h-4 ${i < Math.round(product.rating) ? "fill-amber text-amber" : "text-zinc-600"}`}
                    />
                  ))}
                </div>
                <span className="text-sm text-zinc-400">
                  {product.rating.toFixed(1)} ({t.ratingLabel(product.reviewCount)})
                </span>
              </div>
            )}

            {/* Configurator */}
            <div className="space-y-6 bg-bg-card rounded-xl p-6 border border-white/5">
              {/* Material Selector */}
              <div>
                <label className="text-sm font-medium text-zinc-300 mb-3 block">
                  {t.materialLabel}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {materialList.map((code) => {
                    const info = MATERIAL_INFO[code as keyof typeof MATERIAL_INFO];
                    const matColor = info?.color ?? "#9ca3af";
                    const isSelected = selectedMaterial === code;
                    const btnBorderClass = isSelected
                      ? `border-[${matColor}] bg-[${matColor}]/10`
                      : "border-white/10 hover:border-white/25";
                    return (
                      <button
                        key={code}
                        onClick={() => setSelectedMaterial(code)}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${btnBorderClass}`}
                        style={
                          isSelected
                            ? {
                                borderColor: matColor,
                                backgroundColor: `${matColor}18`,
                              }
                            : {}
                        }
                      >
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4" style={{ color: matColor }} />
                          <span className="font-semibold text-sm">{code}</span>
                        </div>
                        {info?.uses && (
                          <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{info.uses}</p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color Selector */}
              <div>
                <label className="text-sm font-medium text-zinc-300 mb-3 block">
                  {t.colorLabel}: <span className="text-zinc-400 font-normal">{selectedColor}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {(product.colors ?? []).slice(0, 8).map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-9 h-9 rounded-full border-2 transition-all ${selectedColor === color ? "scale-110 ring-2 ring-cyan/30 border-cyan" : "border-white/20 hover:border-white/40"}`}
                      style={{ backgroundColor: COLOR_MAP[color] ?? "#808080" }}
                      title={color}
                      aria-label={`${t.colorLabel} ${color}`}
                    />
                  ))}
                </div>
              </div>

              {/* Dimensions */}
              <div>
                <label className="text-sm font-medium text-zinc-300 mb-3 block">
                  {t.dimensionsLabel}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      label: t.dimXLabel,
                      val: dimXStr,
                      setVal: setDimXStr,
                      setMm: setDimX,
                      minMm: product.minDimX ?? 10,
                    },
                    {
                      label: t.dimYLabel,
                      val: dimYStr,
                      setVal: setDimYStr,
                      setMm: setDimY,
                      minMm: product.minDimY ?? 10,
                    },
                    {
                      label: t.dimZLabel,
                      val: dimZStr,
                      setVal: setDimZStr,
                      setMm: setDimZ,
                      minMm: product.minDimZ ?? 10,
                    },
                  ].map((d) => (
                    <div key={d.label}>
                      <span className="text-xs text-zinc-500 mb-1 block">
                        {d.label} (Máx. {MAX_DIM_CM} cm)
                      </span>
                      <input
                        type="number"
                        min={mmToCm(d.minMm)}
                        max={MAX_DIM_CM}
                        step={0.5}
                        value={Number(d.val).toFixed(2)}
                        onChange={(e) => d.setVal(e.target.value)}
                        onBlur={(e) => {
                          const raw = Number.parseFloat(e.target.value);
                          const clampedMm = clampDim(
                            cmToMm(Number.isNaN(raw) ? mmToCm(d.minMm) : raw),
                            d.minMm,
                            cmToMm(MAX_DIM_CM)
                          );
                          d.setMm(clampedMm);
                          d.setVal(String(mmToCm(clampedMm)));
                        }}
                        className="w-full bg-white/5 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:ring-1 focus:ring-cyan text-center"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="text-sm font-medium text-zinc-300 mb-3 block">
                  {t.quantityLabel}
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition"
                    aria-label={t.qtyDecreaseAria}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number.parseInt(e.target.value) || 1))}
                    className="w-16 text-center bg-white/5 rounded-lg py-2 font-mono text-sm outline-none focus:ring-1 focus:ring-cyan"
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition"
                    aria-label={t.qtyIncreaseAria}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  {quantity >= 10 && (
                    <span className="text-xs text-green-400 flex items-center gap-1">
                      <TrendingDown className="w-3 h-3" />
                      –40%
                    </span>
                  )}
                  {quantity >= 5 && quantity < 10 && (
                    <span className="text-xs text-green-400 flex items-center gap-1">
                      <TrendingDown className="w-3 h-3" />
                      –20%
                    </span>
                  )}
                </div>
              </div>

              {/* Tiered Pricing */}
              {priceCalc && (
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    {
                      label: t.tieredUnit,
                      price: priceCalc.priceUnit,
                      active: quantity < 5,
                    },
                    {
                      label: t.tieredMedium,
                      price: priceCalc.priceMedium,
                      active: quantity >= 5 && quantity < 10,
                    },
                    {
                      label: t.tieredBulk,
                      price: priceCalc.priceBulk,
                      active: quantity >= 10,
                    },
                  ].map(({ label, price, active }) => (
                    <div
                      key={label}
                      className={`rounded-lg p-2 border transition-all ${active ? "border-cyan bg-cyan/5" : "border-white/5 opacity-50"}`}
                    >
                      <p className="text-[10px] text-zinc-400 mb-0.5">{label}</p>
                      <p
                        className={`font-mono text-sm font-semibold ${active ? "text-cyan" : "text-zinc-300"}`}
                      >
                        €{price.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Price Summary */}
              {priceCalc && (
                <div className="bg-white/5 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-baseline font-semibold">
                    <span>{t.totalLabel}</span>
                    <span className="font-mono text-xl text-cyan">
                      €{(priceCalc.finalPrice * quantity).toFixed(2)}
                    </span>
                  </div>
                  {quantity > 1 && (
                    <p className="text-xs text-zinc-500 font-mono">
                      €{priceCalc.finalPrice.toFixed(2)} × {quantity}
                    </p>
                  )}

                  {/* Desglose de costos — solo admin */}
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => setShowBreakdown((v) => !v)}
                        className="flex items-center gap-1 text-xs text-amber hover:text-amber/80 transition mt-1"
                      >
                        <Info className="w-3.5 h-3.5" />
                        {t.costBreakdownTitle}
                        {showBreakdown ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>
                      <AnimatePresence>
                        {showBreakdown && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="space-y-1 pt-2 border-t border-white/5">
                              <div className="flex justify-between text-xs">
                                <span className="text-zinc-500">{t.estimatedWeight}</span>
                                <span className="font-mono text-zinc-300">
                                  {(() => {
                                    if (priceCalc.weight < 1) return priceCalc.weight.toFixed(2);
                                    if (priceCalc.weight < 10) return priceCalc.weight.toFixed(3);
                                    return Math.round(priceCalc.weight);
                                  })()}{" "}
                                  g
                                </span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-zinc-500">{t.printTimeLabel}</span>
                                <span className="font-mono text-zinc-300">
                                  {Math.round(priceCalc.printTimeMinutes)} min
                                </span>
                              </div>
                              {[
                                {
                                  label: t.materialCost,
                                  value: priceCalc.materialCost,
                                },
                                {
                                  label: t.machineCost,
                                  value: priceCalc.machineCost,
                                },
                                {
                                  label: t.maintenanceCost,
                                  value: priceCalc.maintenanceCost,
                                },
                                {
                                  label: t.operationCost,
                                  value: priceCalc.operationCost,
                                },
                                {
                                  label: t.consumablesCost,
                                  value: priceCalc.consumablesCost,
                                },
                                {
                                  label: t.finishCostLabel,
                                  value: priceCalc.finishCost,
                                },
                              ].map(({ label, value }) => (
                                <div key={label} className="flex justify-between text-xs">
                                  <span className="text-zinc-500">{label}</span>
                                  <span className="font-mono text-zinc-300">
                                    €{value.toFixed(2)}
                                  </span>
                                </div>
                              ))}
                              <div className="flex justify-between text-xs font-semibold border-t border-white/5 pt-1">
                                <span className="text-zinc-300">{t.baseCost}</span>
                                <span className="font-mono text-zinc-100">
                                  €{priceCalc.baseCost.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  )}

                  <p className="text-[11px] text-zinc-400">{t.priceHint}</p>
                </div>
              )}

              {/* Add to Cart */}
              <button
                onClick={handleAddToCart}
                className="w-full py-3 bg-cyan text-black font-semibold rounded-lg hover:bg-cyan-dim transition flex items-center justify-center gap-2 disabled:opacity-50"
                disabled={isAdmin}
                title={isAdmin ? t.adminNoPurchase : undefined}
              >
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
              <div
                key={faq.q}
                className="bg-bg-card rounded-xl border border-white/5 overflow-hidden"
              >
                <button
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-sm font-medium text-left hover:bg-bg-hover transition"
                >
                  {faq.q}
                  {faqOpen === i ? (
                    <ChevronUp className="w-4 h-4 text-zinc-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-zinc-400" />
                  )}
                </button>
                <AnimatePresence>
                  {faqOpen === i && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
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
            {t.reviewsTitle} ({product.reviewCount})
          </h2>
          {session?.user && (
            <div className="bg-bg-card rounded-xl p-6 border border-white/5 mb-6">
              <h3 className="font-semibold mb-3 text-sm">{t.writeReviewTitle}</h3>
              <div className="flex gap-1 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button
                    key={"wstar-" + i}
                    onClick={() => setReviewRating(i + 1)}
                    aria-label={t.starsAria(i + 1)}
                  >
                    <Star
                      className={`w-5 h-5 ${i < reviewRating ? "fill-amber text-amber" : "text-zinc-600"}`}
                    />
                  </button>
                ))}
              </div>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder={t.reviewPlaceholder}
                className="w-full bg-white/5 rounded-lg p-3 text-sm outline-none focus:ring-1 focus:ring-cyan placeholder-zinc-500 resize-none h-20"
              />
              <button
                onClick={handleSubmitReview}
                disabled={submittingReview || !reviewText.trim()}
                className="mt-3 px-4 py-2 bg-cyan text-black rounded-lg text-sm font-medium hover:bg-cyan-dim transition disabled:opacity-50"
              >
                {submittingReview ? t.publishing : t.publishReview}
              </button>
            </div>
          )}
          <div className="space-y-4">
            {product.reviews.map((r, i) => (
              <motion.div
                key={r?.id ?? i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-bg-card rounded-xl p-5 border border-white/5"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-cyan/20 flex items-center justify-center text-cyan text-sm font-bold">
                    {(r?.user?.name ?? r?.user?.email ?? "U")[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{r?.user?.name ?? t.anonymous}</p>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star
                          key={"rstar-" + j}
                          className={`w-3 h-3 ${j < (r?.rating ?? 0) ? "fill-amber text-amber" : "text-zinc-600"}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-zinc-400">{r?.comment ?? ""}</p>
              </motion.div>
            ))}
            {product.reviews.length === 0 && <p className="text-sm text-zinc-500">{t.noReviews}</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
