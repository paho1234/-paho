import type { Metadata } from "next";
import "@fontsource/fraunces/400.css";
import "@fontsource/fraunces/500.css";
import "@fontsource/fraunces/600.css";
import "@fontsource/fraunces/700.css";
import "@fontsource/fraunces/900.css";
import "@fontsource/fraunces/600-italic.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/700.css";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthProvider";

export const metadata: Metadata = {
  title: "Todo Regalado — Outlet de devoluciones",
  description:
    "Devoluciones, reacondicionados y liquidaciones de marcas reales, hasta 70% menos. Condición declarada, sin sorpresas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-AR">
      <body className="font-body bg-paper text-charcoal antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
