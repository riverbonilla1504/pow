import type { Metadata } from "next";
import { Poppins, IBM_Plex_Mono } from "next/font/google";
import ThemeProvider from "@/components/theme/ThemeProvider";
import ThemeScript from "@/components/theme/ThemeScript";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-sans",
});
const plexMono = IBM_Plex_Mono({ weight: ["400", "500"], subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "freck.lat — Notificaciones E-Commerce",
  description: "Sistema de notificaciones en tiempo real para órdenes de e-commerce",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning className={`${poppins.variable} ${plexMono.variable} h-full`}>
      <body className={`${poppins.className} min-h-full`}>
        <ThemeScript />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
