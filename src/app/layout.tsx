import type { Metadata, Viewport } from "next";
import "./globals.css";
import { brand } from "@/lib/brand";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: { default: `${brand.name} · Rastreo de envíos a Venezuela`, template: `%s · ${brand.name}` },
  description: "Rastrea tu paquete desde nuestro casillero internacional hasta la puerta de tu casa en Venezuela.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "ADUCARGA" },
};

export const viewport: Viewport = { themeColor: "#0C2C52", width: "device-width", initialScale: 1 };

const c = brand.colors;
const vars = `:root{--brand:${c.brand};--brand-dark:${c.brandDark};--brand-soft:${c.brandSoft};--accent:${c.accent};--accent-dark:${c.accentDark};--font-sans:"${brand.font.family}"}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={brand.font.googleHref} />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0C2C52" />
        <style dangerouslySetInnerHTML={{ __html: vars }} />
      </head>
      <body className="min-h-screen">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
