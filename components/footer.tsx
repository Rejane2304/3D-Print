"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Package, Mail, MapPin, Phone } from "lucide-react";
import { useToast } from "@/components/toast-provider";
import { useLanguage } from "@/lib/language-store";

export function Footer() {
  const [email, setEmail] = useState("");
  const { showToast } = useToast();
  const { language } = useLanguage();

  const t = {
    es: {
      about: "Productos impresos en 3D de alta calidad con materiales PLA y PETG. Personaliza cada pieza a tu medida.",
      contact: "Contacto",
      newsletter: "Newsletter",
      newsletterDesc: "Recibe novedades y ofertas exclusivas.",
      placeholder: "tu@email.com",
      send: "Enviar",
      rights: "© 2026 3D Print. Todos los derechos reservados.",
      home: "Inicio",
      catalog: "Catálogo",
      subscribed: "¡Suscrito al newsletter!",
      errorSubscribe: "Error al suscribirse",
      errorConnection: "Error de conexión",
      location: "Barcelona, España",
    },
    en: {
      about: "High-quality 3D printed products with PLA and PETG materials. Customize every piece to your needs.",
      contact: "Contact",
      newsletter: "Newsletter",
      newsletterDesc: "Receive news and exclusive offers.",
      placeholder: "your@email.com",
      send: "Subscribe",
      rights: "© 2026 3D Print. All rights reserved.",
      home: "Home",
      catalog: "Catalog",
      subscribed: "Subscribed to newsletter!",
      errorSubscribe: "Error subscribing",
      errorConnection: "Connection error",
      location: "Barcelona, Spain",
    },
  }[language];

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email?.trim()) return;
    try {
      const res = await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      if (res?.ok) { showToast("success", t.subscribed); setEmail(""); }
      else { const d = await res?.json().catch(() => ({})); showToast("error", d?.error ?? t.errorSubscribe); }
    } catch { showToast("error", t.errorConnection); }
  };

  return (
    <footer className="bg-[#0d0d0d] border-t border-white/5 mt-auto">
      <div className="max-w-site mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-6 h-6 text-cyan" />
              <span className="font-bold text-gradient-cyan">3D Print</span>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed">{t.about}</p>
          </div>

          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4 text-zinc-300">{t.contact}</h4>
            <div className="space-y-3 text-sm text-zinc-400">
              <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-cyan" /> info@3dprint.com</div>
              <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-cyan" /> +34 612 345 678</div>
              <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-cyan" /> {t.location}</div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4 text-zinc-300">{t.newsletter}</h4>
            <p className="text-sm text-zinc-400 mb-3">{t.newsletterDesc}</p>
            <form onSubmit={handleNewsletter} className="flex gap-2">
              <input type="email" value={email} onChange={e => setEmail(e?.target?.value ?? "")} placeholder={t.placeholder} className="flex-1 bg-white/5 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-cyan placeholder-zinc-500" />
              <button type="submit" className="px-4 py-2 bg-cyan text-black rounded-lg text-sm font-semibold hover:bg-cyan-dim transition">{t.send}</button>
            </form>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-500">{t.rights}</p>
          <div className="flex gap-4">
            <Link href="/" className="text-xs text-zinc-500 hover:text-cyan transition">{t.home}</Link>
            <Link href="/catalog" className="text-xs text-zinc-500 hover:text-cyan transition">{t.catalog}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
