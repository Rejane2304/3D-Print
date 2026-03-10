import { Layers, Palette } from "lucide-react";
import Link from "next/link";

export default function AdminCatalogPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Layers className="w-6 h-6 text-cyan" /> Catálogo de impresión
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/admin/materials">
          <div className="bg-bg-card border border-white/10 rounded-xl p-6 flex flex-col gap-2 hover:bg-cyan/10 transition cursor-pointer">
            <Layers className="w-8 h-8 text-cyan mb-2" />
            <span className="font-semibold text-lg">Materiales</span>
            <span className="text-zinc-400 text-sm">
              Gestiona tipos, precios y parámetros de materiales.
            </span>
          </div>
        </Link>
        <Link href="/admin/colors">
          <div className="bg-bg-card border border-white/10 rounded-xl p-6 flex flex-col gap-2 hover:bg-cyan/10 transition cursor-pointer">
            <Palette className="w-8 h-8 text-cyan mb-2" />
            <span className="font-semibold text-lg">Colores</span>
            <span className="text-zinc-400 text-sm">
              Gestiona el catálogo global de colores disponibles.
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}
