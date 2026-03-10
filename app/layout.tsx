import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Toaster } from "@/components/toast-provider";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "3D Print — Productos Impresos en 3D",
  description:
    "Ecommerce de productos personalizados impresos en 3D con materiales PLA y PETG de alta calidad.",
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Detecta si es la página de inicio usando pathname de Next.js
  const isHome =
    globalThis.window === undefined
      ? require("next/navigation").usePathname?.() === "/"
      : globalThis.window.location.pathname === "/";
  return (
    <html lang="es">
      <head></head>
      <body
        className={
          `min-h-screen flex flex-col` +
          (isHome
            ? " bg-gradient-to-br from-[#050712] via-[#181a24] to-[#00FFFF]"
            : "")
        }
      >
        <Providers>
          <Header />
          <main className="flex-1 pt-16">{children}</main>
          <Footer />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
