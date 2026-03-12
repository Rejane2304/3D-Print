import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Toaster } from "@/components/toast-provider";
import { BodyClassController } from "@/components/body-class-controller";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "3D Print — Productos Impresos en 3D",
    template: "%s | 3D Print",
  },
  description:
    "Ecommerce de productos personalizados impresos en 3D con materiales PLA y PETG de alta calidad.",
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
  keywords: [
    "impresión 3D",
    "productos personalizados",
    "PLA",
    "PETG",
    "ecommerce",
  ],
  authors: [{ name: "3D Print" }],
  robots: { index: true, follow: true },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: "3D Print",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <head />
      <body className="min-h-screen flex flex-col">
        <BodyClassController />
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
