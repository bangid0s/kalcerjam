import type { Metadata } from "next";
import { Anton, Archivo } from "next/font/google";
import "../globals.css";

const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--nf-anton" });
const archivo = Archivo({ subsets: ["latin"], variable: "--nf-archivo" });

export const metadata: Metadata = {
  title: "Admin — Kalcer Jam",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${anton.variable} ${archivo.variable}`}>
      <body className="min-h-screen bg-paper antialiased">{children}</body>
    </html>
  );
}
