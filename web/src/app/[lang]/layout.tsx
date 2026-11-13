import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Anton, Archivo } from "next/font/google";
import { isLang, locales } from "@/lib/i18n";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import "../globals.css";

const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--nf-anton" });
const archivo = Archivo({ subsets: ["latin"], variable: "--nf-archivo" });

export const metadata: Metadata = {
  metadataBase: new URL("https://kalcerjam.site"),
  title: { default: "Kalcer Jam 2027 — Semarang", template: "%s — Kalcer Jam 2027" },
  description: "Breaking & openstyle jam in Semarang, 26–27 July 2027. 7 to Smoke, 2vs2, Toprock, Footwork. Winners fly to the 6Kamenz Anniversary in Bangkok.",
  openGraph: { siteName: "Kalcer Jam", type: "website" },
};

export const viewport: Viewport = { themeColor: "#0a0a0a" };

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return (
    <html lang={lang} className={`${anton.variable} ${archivo.variable}`}>
      <body className="min-h-screen antialiased">
        <a href="#main" className="label sr-only z-[70] bg-kj px-3 py-2 text-ink focus:not-sr-only focus:fixed focus:left-2 focus:top-2">Skip to content</a>
        <Nav lang={lang} />
        <main id="main">{children}</main>
        <Footer lang={lang} />
      </body>
    </html>
  );
}
