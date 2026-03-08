"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Filter, Star, ChevronLeft, ChevronRight, SlidersHorizontal, X as XIcon } from "lucide-react";
import { ProductType } from "@/lib/types";
import { calculatePriceFromDimensions, MATERIAL_INFO } from "@/lib/price-calculator";
import { useLanguage } from "@/lib/language-store";

const CATEGORIES = ["Todos", "Accesorios", "Decoracion", "Figuras", "Funcional", "Articulados"] as const;

// Map color names to hex values for display
const COLOR_MAP: Record<string, string> = {
  "Blanco": "#FFFFFF", "Negro": "#1a1a1a", "Gris": "#6B7280", "Rojo": "#EF4444", "Azul": "#3B82F6",
  "Verde": "#22C55E", "Amarillo": "#FACC15", "Naranja": "#F97316", "Rosa": "#EC4899", "Morado": "#A855F7",
  "Cyan": "#00FFFF", "Amber": "#FFBF00", "Terracota": "#E07B4C", "Dorado": "#D4AF37", "Plata": "#C0C0C0",
  "Cobre": "#B87333", "Bronce": "#CD7F32", "Transparente": "#E8E8E8", "Verde Salvia": "#9CAF88",
  "Blanco Mate": "#F5F5F5", "Gris Piedra": "#8B8680", "Rosa Pálido": "#FADADD", "Azul Cielo": "#87CEEB",
  "Rojo Metálico": "#B22222", "Verde Esmeralda": "#50C878", "Azul Medianoche": "#191970",
  "Negro Mate": "#28282B", "Gris Espacial": "#4A4A4A", "Verde Militar": "#4B5320", "Beige": "#F5F5DC",
  "Roble": "#806517", "Nogal": "#5D432C", "Madera Clara": "#DEB887", "Roble Natural": "#C4A35A",
  "Marmol": "#E8E8E8", "Blanco Mármol": "#FAFAFA", "Pastel Mix": "#FFB6C1", "Multicolor": "#FF6B6B",
  "Dorado Antiguo": "#CFB53B", "RGB (con LEDs)": "#FF00FF", "Azul Transparente": "#ADD8E6",
  "Rosa Transparente": "#FFB6C1", "Negro/Dorado": "#1a1a1a", "Gris/Rojo": "#6B7280",
  "Transparente/Naranja": "#FFA500", "Negro/Rojo": "#1a1a1a", "Gris Metálico": "#71797E",
  "Azul Océano": "#0077BE", "Madera": "#966F33", "Blanco (Obligatorio)": "#FFFFFF"
};

function getColorHex(colorName: string): string {
  return COLOR_MAP[colorName] || "#6B7280";
}

const MATERIAL_ACTIVE_CLASSES: Record<string, string> = {
  PLA: "bg-cyan/20 text-cyan border border-cyan/30",
  PETG: "bg-amber/20 text-amber border border-amber/30",
  "": "bg-white/10 text-white border border-white/20",
};

const SORTS: Record<"es" | "en", { value: string; label: string }[]> = {
  es: [
    { value: "newest", label: "Más recientes" },
    { value: "price_asc", label: "Precio: menor" },
    { value: "price_desc", label: "Precio: mayor" },
    { value: "rating", label: "Mejor valorados" },
  ],
  en: [
    { value: "newest", label: "Newest" },
    { value: "price_asc", label: "Price: low to high" },
    { value: "price_desc", label: "Price: high to low" },
    { value: "rating", label: "Best rated" },
  ],
};

const CATEGORY_LABELS: Record<"es" | "en", Record<(typeof CATEGORIES)[number], string>> = {
  es: {
    Todos: "Todos",
    Accesorios: "Accesorios",
    Decoracion: "Decoracion",
    Figuras: "Figuras",
    Funcional: "Funcional",
    Articulados: "Articulados",
  },
  en: {
    Todos: "All",
    Accesorios: "Accessories",
    Decoracion: "Decoration",
    Figuras: "Figures",
    Funcional: "Functional",
    Articulados: "Articulated",
  },
};

export function CatalogClient() {
  const { language } = useLanguage();
  const t = {
    es: {
      title: <>Catálogo de <span className="text-gradient-cyan">Productos</span></>,
      subtitle: "Explora nuestra colección de piezas impresas en 3D y personaliza cada una a tu medida.",
      searchPlaceholder: "Buscar productos...",
      searchButton: "Buscar",
      filters: "Filtros",
      clearFilters: "Limpiar filtros",
      materialLabel: "Material",
      categoryLabel: "Categoría",
      activeFiltersMaterial: (m: string) => m,
      activeFiltersCategory: (c: string) => CATEGORY_LABELS.es[c as (typeof CATEGORIES)[number]] ?? c,
      results: (total: number) =>
        `${total} producto${total === 1 ? "" : "s"} encontrado${total === 1 ? "" : "s"}`,
      noProducts: "No se encontraron productos",
      clearFiltersButton: "Limpiar filtros",
      from: "Desde",
      productAlt: "Producto",
      prevPageAria: "Página anterior",
      nextPageAria: "Página siguiente",
    },
    en: {
      title: <>Product <span className="text-gradient-cyan">Catalog</span></>,
      subtitle: "Browse our collection of 3D printed parts and customize each one to your needs.",
      searchPlaceholder: "Search products...",
      searchButton: "Search",
      filters: "Filters",
      clearFilters: "Clear filters",
      materialLabel: "Material",
      categoryLabel: "Category",
      activeFiltersMaterial: (m: string) => m,
      activeFiltersCategory: (c: string) => CATEGORY_LABELS.en[c as (typeof CATEGORIES)[number]] ?? c,
      results: (total: number) =>
        `${total} product${total === 1 ? "" : "s"} found`,
      noProducts: "No products found",
      clearFiltersButton: "Clear filters",
      from: "From",
      productAlt: "Product",
      prevPageAria: "Previous page",
      nextPageAria: "Next page",
    },
  }[language];

  const searchParams = useSearchParams();
  const [products, setProducts] = useState<ProductType[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [search, setSearch] = useState(searchParams?.get("search") ?? "");
  const [material, setMaterial] = useState(searchParams?.get("material") ?? "");
  const [category, setCategory] = useState(searchParams?.get("category") ?? "");
  const [sort, setSort] = useState(searchParams?.get("sort") ?? "newest");
  const [page, setPage] = useState(Number.parseInt(searchParams?.get("page") ?? "1", 10));

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (material) params.set("material", material);
      if (category && category !== "Todos") params.set("category", category);
      params.set("sort", sort);
      params.set("page", String(page));
      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res?.json();
      setProducts(data?.products ?? []);
      setTotal(data?.total ?? 0);
      setTotalPages(data?.totalPages ?? 1);
    } catch { setProducts([]); }
    setLoading(false);
  }, [search, material, category, sort, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-site mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t.title}</h1>
          <p className="text-zinc-400 text-sm">{t.subtitle}</p>
        </div>

        {/* Search & Filters Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e?.target?.value ?? "")}
                placeholder={t.searchPlaceholder}
                className="w-full bg-bg-card rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-cyan placeholder-zinc-500 border border-white/5"
              />
            </div>
            <button type="submit" className="px-4 py-2.5 bg-cyan text-black rounded-lg text-sm font-medium hover:bg-cyan-dim transition">
              {t.searchButton}
            </button>
          </form>
          <div className="flex gap-2">
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="flex items-center gap-2 px-4 py-2.5 bg-bg-card border border-white/5 rounded-lg text-sm hover:bg-bg-hover transition"
            >
              <SlidersHorizontal className="w-4 h-4" /> {t.filters}
            </button>
            <select value={sort} onChange={e => { setSort(e?.target?.value ?? "newest"); setPage(1); }} className="bg-bg-card border border-white/5 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-cyan">
              {SORTS[language].map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Filters Panel */}
        {filtersOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="mb-8 bg-bg-card rounded-xl p-6 border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Filter className="w-4 h-4" /> {t.filters}
              </h3>
              <button
                onClick={() => { setMaterial(""); setCategory(""); setPage(1); }}
                className="text-xs text-cyan hover:underline"
              >
                {t.clearFilters}
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm text-zinc-400 mb-2 block">{t.materialLabel}</label>
                <div className="flex gap-2">
                  {["", "PLA", "PETG"].map(m => (
                    <button key={m} onClick={() => { setMaterial(m); setPage(1); }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                        material === m ? MATERIAL_ACTIVE_CLASSES[m] : "bg-white/5 text-zinc-400 border border-transparent hover:bg-white/10"
                      }`}>{m || (language === "es" ? "Todos" : "All")}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-zinc-400 mb-2 block">{t.categoryLabel}</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(c => (
                    <button key={c} onClick={() => { setCategory(c === "Todos" ? "" : c); setPage(1); }}
                      className={`px-3 py-1.5 rounded-lg text-sm transition ${
                        (category || "Todos") === c ? "bg-cyan/20 text-cyan border border-cyan/30" : "bg-white/5 text-zinc-400 hover:bg-white/10"
                      }`}>{CATEGORY_LABELS[language][c]}</button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Active Filters */}
        {(material || category) && (
          <div className="flex flex-wrap gap-2 mb-6">
            {material && (
              <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-white/10">
                {t.activeFiltersMaterial(material)} <button onClick={() => setMaterial("")}><XIcon className="w-3 h-3" /></button>
              </span>
            )}
            {category && (
              <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-white/10">
                {t.activeFiltersCategory(category)} <button onClick={() => setCategory("")}><XIcon className="w-3 h-3" /></button>
              </span>
            )}
          </div>
        )}

        {/* Results count */}
        <p className="text-sm text-zinc-500 mb-6">{t.results(total)}</p>

        {/* Products Grid */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(['sk-0','sk-1','sk-2','sk-3','sk-4','sk-5']).map((sk) => (
              <div key={sk} className="bg-bg-card rounded-lg overflow-hidden animate-pulse">
                <div className="aspect-video bg-zinc-800" />
                <div className="p-4 space-y-2"><div className="h-4 bg-zinc-800 rounded w-3/4" /><div className="h-3 bg-zinc-800 rounded w-1/2" /></div>
              </div>
            ))}
          </div>
        )}
        {!loading && (products?.length ?? 0) === 0 && (
          <div className="text-center py-20">
            <p className="text-zinc-400 mb-4">{t.noProducts}</p>
            <button
              onClick={() => { setSearch(""); setMaterial(""); setCategory(""); setPage(1); }}
              className="px-4 py-2 bg-cyan/10 text-cyan rounded-lg text-sm hover:bg-cyan/20 transition"
            >
              {t.clearFiltersButton}
            </button>
          </div>
        )}
        {!loading && (products?.length ?? 0) > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(products ?? []).map((p, i) => (
              <motion.div key={p?.id ?? i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link href={`/product/${p?.id}`} className="block group">
                  <div className="bg-bg-card rounded-lg overflow-hidden card-shadow card-shadow-hover transition-all duration-300 border border-white/5">
                    <div className="relative aspect-video bg-zinc-800">
                      <Image src={p?.images?.[0] ?? "/og-image.png"} alt={p?.name ?? t.productAlt} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p?.material === "PLA" ? "bg-cyan/10 text-cyan" : "bg-amber/10 text-amber"}`}>{p?.material ?? ""}</span>
                        <span className="text-xs text-zinc-500">{p?.category ?? ""}</span>
                        {(p?.rating ?? 0) > 0 && <span className="flex items-center gap-1 text-xs text-zinc-400 ml-auto"><Star className="w-3 h-3 fill-amber text-amber" />{(p?.rating ?? 0).toFixed(1)}</span>}
                      </div>
                      <h3 className="font-semibold text-sm mb-1 group-hover:text-cyan transition-colors">{p?.name ?? ""}</h3>
                      {/* Color swatches */}
                      {(p?.colors?.length ?? 0) > 0 && (
                        <div className="flex items-center gap-1 mb-2">
                          {(p?.colors ?? []).slice(0, 3).map((color: string) => (
                            <span key={color} className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: getColorHex(color) }} title={color} />
                          ))}
                          {(p?.colors?.length ?? 0) > 3 && (
                            <span className="text-xs text-zinc-500">
                              +{(p?.colors?.length ?? 0) - 3}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-mono text-xs text-zinc-400">
                          ({((p?.defaultDimX ?? 0) / 10).toFixed(2)} x {((p?.defaultDimY ?? 0) / 10).toFixed(2)} x {((p?.defaultDimZ ?? 0) / 10).toFixed(2)} cm)
                        </span>
                        {(() => {
                          // Obtener info de material
                          const mat = MATERIAL_INFO[p?.material ?? "PLA"] ?? MATERIAL_INFO["PLA"];
                          // Calcular precio unitario (1 ud, dimensiones por defecto, coste de acabado si existe)
                          const price = calculatePriceFromDimensions(
                            p?.defaultDimX ?? 0,
                            p?.defaultDimY ?? 0,
                            p?.defaultDimZ ?? 0,
                            p?.printTimeMinutes ?? 60,
                            mat,
                            {
                              finishCost: p?.finishCost ?? 0,
                              fillFactor: p?.modelFillFactor ?? undefined,
                              refDimX: p?.defaultDimX ?? 0,
                              refDimY: p?.defaultDimY ?? 0,
                              refDimZ: p?.defaultDimZ ?? 0,
                            }
                          );
                          return (
                            <span className="font-mono text-cyan text-2xl font-bold">
                              €{price.finalPrice.toFixed(2)}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="p-2 rounded-lg bg-bg-card border border-white/5 disabled:opacity-30 hover:bg-bg-hover transition"
              aria-label={t.prevPageAria}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button key={i + 1} onClick={() => setPage(i + 1)} className={`w-9 h-9 rounded-lg text-sm font-medium transition ${page === i + 1 ? "bg-cyan text-black" : "bg-bg-card border border-white/5 hover:bg-bg-hover"}`}>{i + 1}</button>
            ))}
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="p-2 rounded-lg bg-bg-card border border-white/5 disabled:opacity-30 hover:bg-bg-hover transition"
              aria-label={t.nextPageAria}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
