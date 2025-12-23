import type { Metadata } from "next";
import { Inter } from "next/font/google"; // O la fuente que uses
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
// 👇 1. IMPORTAR EL PROVIDER
import { AuthProvider } from "@/context/auth-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Zaiko POS",
  description: "Sistema de Punto de Venta SaaS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        {/* 👇 2. ENVOLVER TODO EN AUTHPROVIDER */}
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}