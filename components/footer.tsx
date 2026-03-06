"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Package, Mail, MapPin, Phone } from "lucide-react";
import { useToast } from "@/components/toast-provider";

export function Footer() {
  const [email, setEmail] = useState("");
  const { showToast } = useToast();

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email?.trim()) return;
    try {
      const res = await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      if (res?.ok) { showToast("success", "¡Suscrito al newsletter!"); setEmail(""); }
      else { const d = await res?.json().catch(() => ({})); showToast("error", d?.error ?? "Error al suscribirse"); }
    } catch { showToast("error", "Error de conexión"); }
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
            <p className="text-sm text-zinc-400 leading-relaxed">Productos impresos en 3D de alta calidad con materiales PLA y PETG. Personaliza cada pieza a tu medida.</p>
          </div>

          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4 text-zinc-300">Contacto</h4>
            <div className="space-y-3 text-sm text-zinc-400">
              <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-cyan" /> info@3dprint.com</div>
              <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-cyan" /> +34 612 345 678</div>
              <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-cyan" /> Barcelona, España</div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4 text-zinc-300">Newsletter</h4>
            <p className="text-sm text-zinc-400 mb-3">Recibe novedades y ofertas exclusivas.</p>
            <form onSubmit={handleNewsletter} className="flex gap-2">
              <input type="email" value={email} onChange={e => setEmail(e?.target?.value ?? "")} placeholder="tu@email.com" className="flex-1 bg-white/5 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-cyan placeholder-zinc-500" />
              <button type="submit" className="px-4 py-2 bg-cyan text-black rounded-lg text-sm font-semibold hover:bg-cyan-dim transition">Enviar</button>
            </form>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-500">© 2026 3D Print. Todos los derechos reservados.</p>
          <div className="flex gap-4">
            <Link href="/" className="text-xs text-zinc-500 hover:text-cyan transition">Inicio</Link>
            <Link href="/catalog" className="text-xs text-zinc-500 hover:text-cyan transition">Catálogo</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
