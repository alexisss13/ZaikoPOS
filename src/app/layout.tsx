import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner"; // <--- IMPORTAR AQUÍ

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Zaiko POS",
  description: "Sistema de Punto de Venta",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        {children}
        <Toaster /> {/* <--- AGREGAR AQUÍ (Puede ir antes de cerrar body) */}
      </body>
    </html>
  );
}