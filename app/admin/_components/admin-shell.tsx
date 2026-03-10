"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

import AdminSidebar from "./admin-sidebar";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import type { UserType } from "@/lib/types";

export default function AdminShell({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const { data: session, status } = useSession();
  const router = useRouter();
  const userRole = (session?.user as UserType)?.role;
  useEffect(() => {
    if (
      status === "unauthenticated" ||
      (status === "authenticated" && userRole !== "admin")
    ) {
      router.replace("/login");
    }
  }, [status, userRole, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Cargando...
      </div>
    );
  }
  if (
    status === "unauthenticated" ||
    (status === "authenticated" && userRole !== "admin")
  ) {
    return null;
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Top bar siempre visible */}
      <div className="sticky top-16 z-40 flex items-center gap-3 px-4 py-3 bg-bg-secondary border-b border-border">
        <button
          onClick={() => setIsOpen((v) => !v)}
          className="p-2 rounded-lg hover:bg-bg-tertiary transition-colors"
          aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <span className="font-semibold text-cyan text-sm">Panel Admin</span>
      </div>

      <div className="flex">
        <AdminSidebar isOpen={isOpen} setIsOpen={setIsOpen} />
        <main className="flex-1 p-6 ml-0">{children}</main>
      </div>
    </div>
  );
}
