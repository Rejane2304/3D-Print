"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Layers, Zap, Shield, Palette, Star } from "lucide-react";
import { ProductType } from "@/lib/types";
import { MATERIAL_INFO, calculatePriceFromDimensions } from "@/lib/price-calculator";
import { useLanguage } from "@/lib/language-store";

function CountUp({ target, suffix = "" }: Readonly<{ target: number; suffix?: string }>) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let frame: number;
    const duration = 2000;
    const start = Date.now();
    const animate = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      setVal(Math.floor(target * progress));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [target]);
  return <span className="font-mono font-bold text-3xl text-cyan">{val}{suffix}</span>;
}

export function HomeClient() {
  const { language } = useLanguage();
  const tHero = {
    es: {
      badge: "Fabricación bajo demanda",
      title: <>Productos <span className="text-gradient-cyan">impresos en 3D</span> a tu medida</>,
      subtitle:
        "Personaliza cada pieza eligiendo material, color y dimensiones. Tecnología de impresión 3D de alta calidad con materiales PLA y PETG.",
      cta: "Explorar catálogo",
    },
    en: {
      badge: "Made-to-order manufacturing",
      title: <>3D printed <span className="text-gradient-cyan">products</span> tailor‑made for you</>,
      subtitle:
        "Customize each part by choosing material, color and dimensions. High‑quality 3D printing with PLA and PETG materials.",
      cta: "Browse catalog",
    },
  }[language];

  const tStats = {
    es: { products: "Productos", customers: "Clientes", materials: "Materiales" },
    en: { products: "Products", customers: "Customers", materials: "Materials" },
  }[language];

  const tFeatured = {
    es: {
      title: <>Productos <span className="text-gradient-cyan">Destacados</span></>,
      subtitle: "Nuestras piezas más populares, listas para personalizar",
      viewAll: "Ver todo el catálogo",
      product: "Producto",
      from: "Desde",
    },
    en: {
      title: <>Featured <span className="text-gradient-cyan">Products</span></>,
      subtitle: "Our most popular pieces, ready to be customized.",
      viewAll: "View full catalog",
      product: "Product",
      from: "From",
    },
  }[language];

  const tMaterials = {
    es: {
      title: <>Materiales <span className="text-gradient-amber">Premium</span></>,
      subtitle: "Dos materiales, infinitas posibilidades",
      plaUse: "piezas decorativas y prototipos",
      petgUse: "piezas funcionales y de uso diario",
      plaDesc:
        "Material rígido, con buen detalle y acabado visual. Perfecto para macetas, figuras y accesorios ligeros.",
      petgDesc:
        "Material más resistente y flexible, ideal para soportes, piezas sometidas a uso frecuente y exteriores.",
      seeProducts: (mat: string) => `Ver productos ${mat}`,
      idealFor: "Ideal para",
    },
    en: {
      title: <>Premium <span className="text-gradient-amber">Materials</span></>,
      subtitle: "Two materials, endless possibilities",
      plaUse: "decorative pieces and prototypes",
      petgUse: "functional and everyday-use parts",
      plaDesc:
        "Rigid material with good detail and visual finish. Perfect for pots, figures and light accessories.",
      petgDesc:
        "Stronger and more flexible material, ideal for mounts, parts under frequent use and outdoor pieces.",
      seeProducts: (mat: string) => `View ${mat} products`,
      idealFor: "Ideal for",
    },
  }[language];

  const tBenefits = {
    es: [
      { icon: Zap, title: "Rápido", desc: "Producción en 24-48h con tecnología de última generación" },
      { icon: Palette, title: "Personalizable", desc: "Elige material, color y dimensiones exactas" },
      { icon: Shield, title: "Calidad", desc: "Materiales premium con acabados profesionales" },
      { icon: Layers, title: "Precisión", desc: "Tolerancia de ±0.1mm en todas las piezas" },
    ],
    en: [
      { icon: Zap, title: "Fast", desc: "Production in 24–48h with state-of-the-art technology" },
      { icon: Palette, title: "Customizable", desc: "Choose material, color and exact dimensions" },
      { icon: Shield, title: "Quality", desc: "Premium materials with professional finishes" },
      { icon: Layers, title: "Precision", desc: "±0.1mm tolerance on all parts" },
    ],
  }[language];

  const tCTA = {
    es: {
      title: <>¿Listo para crear algo <span className="text-gradient-amber">único</span>?</>,
      subtitle: "Explora nuestro catálogo, personaliza tu pieza y recíbela en tu puerta.",
      button: "Comenzar Ahora",
    },
    en: {
      title: <>Ready to create something <span className="text-gradient-amber">unique</span>?</>,
      subtitle: "Browse the catalog, customize your part and receive it at home.",
      button: "Start now",
    },
  }[language];
  const [featured, setFeatured] = useState<ProductType[]>([]);
  const [productCount, setProductCount] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);
  const [materialCount, setMaterialCount] = useState(0);

  useEffect(() => {
    fetch("/api/products?featured=true&limit=4")
      .then(r => r?.json())
      .then(d => setFeatured(d?.products ?? []))
      .catch(() => {});

    // Obtener métricas públicas (productos, clientes)
    fetch("/api/public/stats")
      .then(r => r?.json())
      .then(d => {
        setProductCount(d?.totalProducts ?? 0);
        setCustomerCount(d?.totalCustomers ?? 0);
        setMaterialCount(d?.totalMaterials ?? 0);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative min-h-[80vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#121212] via-[#0a1628] to-[#121212]" />
        <div className="absolute top-20 right-10 w-96 h-96 bg-cyan/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-80 h-80 bg-amber/5 rounded-full blur-3xl" />
        <div className="max-w-site mx-auto px-4 relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-2xl">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-cyan/10 text-cyan border border-cyan/20 mb-6">
              {tHero.badge}
            </span>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              {tHero.title}
            </h1>
            <p className="text-lg text-zinc-400 mb-8 leading-relaxed">
              {tHero.subtitle}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/catalog" className="inline-flex items-center gap-2 px-6 py-3 bg-cyan text-black font-semibold rounded-lg hover:bg-cyan-dim transition text-sm">
                {tHero.cta} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-y border-white/5 bg-[#0d0d0d]">
        <div className="max-w-site mx-auto px-4 grid grid-cols-2 md:grid-cols-3 gap-8 text-center">
          {[
            { key: "products", label: tStats.products, target: productCount || 0, suffix: "" },
            { key: "customers", label: tStats.customers, target: customerCount || 0, suffix: "" },
            { key: "materials", label: tStats.materials, target: materialCount || 0, suffix: "" },
          ].map((s) => (
            <div key={s.key}>
              <CountUp target={s.target} suffix={s.suffix} />
              <p className="text-sm text-zinc-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20">
        <div className="max-w-site mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">{tFeatured.title}</h2>
            <p className="text-zinc-400">{tFeatured.subtitle}</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(featured ?? []).map((p, i) => (
              <motion.div key={p?.id ?? i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Link href={`/product/${p?.id}`} className="block group">
                  <div className="bg-bg-card rounded-lg overflow-hidden card-shadow card-shadow-hover transition-all duration-300">
                    <div className="relative aspect-video bg-zinc-800">
                      <Image src={p?.images?.[0] ?? "/og-image.png"} alt={p?.name ?? tFeatured.product} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p?.material === "PLA" ? "bg-cyan/10 text-cyan" : "bg-amber/10 text-amber"}`}>{p?.material ?? ""}</span>
                        {(p?.rating ?? 0) > 0 && <span className="flex items-center gap-1 text-xs text-zinc-400"><Star className="w-3 h-3 fill-amber text-amber" />{(p?.rating ?? 0).toFixed(1)}</span>}
                      </div>
                      <h3 className="font-semibold text-sm mb-1 group-hover:text-cyan transition-colors">{p?.name ?? ""}</h3>
                      <p className="font-mono text-sm text-cyan">
                        {tFeatured.from} €{
                          (() => {
                        const mat = p?.material ?? "PLA";
                            const matInfo = MATERIAL_INFO[mat] ?? MATERIAL_INFO.PLA;
                            const price = calculatePriceFromDimensions(
                              p?.defaultDimX ?? 50,
                              p?.defaultDimY ?? 50,
                              p?.defaultDimZ ?? 50,
                              p?.printTimeMinutes ?? 60,
                              matInfo,
                              1,
                              p?.finishCost ?? 0,
                            );
                            return price.finalPrice.toFixed(2);
                          })()
                        }
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/catalog" className="inline-flex items-center gap-2 px-6 py-3 border border-cyan/30 text-cyan rounded-lg hover:bg-cyan/10 transition text-sm font-medium">
              {tFeatured.viewAll} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Materials */}
      <section className="py-20 bg-[#0d0d0d]">
        <div className="max-w-site mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">{tMaterials.title}</h2>
            <p className="text-zinc-400">{tMaterials.subtitle}</p>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-8">
            {(["PLA", "PETG"] as const).map((mat, i) => {
              const info = MATERIAL_INFO[mat];
              return (
                <motion.div key={mat} initial={{ opacity: 0, x: i === 0 ? -30 : 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                  className="bg-bg-card rounded-xl p-6 card-shadow hover:shadow-lg transition-all duration-300 border border-white/5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${info.color}15` }}>
                      <Layers className="w-6 h-6" style={{ color: info.color }} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold" style={{ color: info.color }}>{info.label}</h3>
                      <p className="text-xs text-zinc-400">
                        {tMaterials.idealFor}{" "}
                        {mat === "PLA" ? tMaterials.plaUse : tMaterials.petgUse}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-400 mb-4">
                    {mat === "PLA" ? tMaterials.plaDesc : tMaterials.petgDesc}
                  </p>
                  <Link href={`/catalog?material=${mat}`} className="inline-flex items-center gap-1 text-sm font-medium transition" style={{ color: info.color }}>
                    {tMaterials.seeProducts(mat)} <ArrowRight className="w-4 h-4" />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="max-w-site mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">
              {language === "es" ? (
                <>¿Por qué <span className="text-gradient-cyan">3D Print</span>?</>
              ) : (
                <>Why <span className="text-gradient-cyan">3D Print</span>?</>
              )}
            </h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {tBenefits.map((b) => (
              <motion.div key={b.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: tBenefits.indexOf(b) * 0.1 }}
                className="bg-bg-card rounded-xl p-6 card-shadow hover:shadow-lg transition-all duration-300 border border-white/5 text-center">
                <div className="w-12 h-12 rounded-lg bg-cyan/10 flex items-center justify-center mx-auto mb-4">
                  <b.icon className="w-6 h-6 text-cyan" />
                </div>
                <h3 className="font-semibold mb-2">{b.title}</h3>
                <p className="text-sm text-zinc-400">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#0d0d0d]">
        <div className="max-w-site mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl font-bold mb-4">{tCTA.title}</h2>
            <p className="text-zinc-400 mb-8 max-w-lg mx-auto">{tCTA.subtitle}</p>
            <Link href="/catalog" className="inline-flex items-center gap-2 px-8 py-3 bg-amber text-black font-semibold rounded-lg hover:bg-amber-dim transition text-sm">
              {tCTA.button} <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
