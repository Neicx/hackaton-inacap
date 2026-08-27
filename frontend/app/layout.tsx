import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hackaton INACAP",
  description: "Sistema de gestión de tickets y máquinas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}

        <footer className="bg-white text-center text-sm text-slate-500 py-4">
          <p className="text-xs"> Desarrollado por <a href="https://github.com/Neicx">Neicx</a> y <a href="https://github.com/bvargasxd">LittleBoy</a> con ❤️
          </p>
        </footer>
      </body>
    </html>
  );
}
