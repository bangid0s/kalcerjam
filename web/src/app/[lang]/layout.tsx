import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Anton, Archivo } from "next/font/google";
import { isLang, locales } from "@/lib/i18n";
import { getContent } from "@/lib/cms";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import "../globals.css";

const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--nf-anton" });
const archivo = Archivo({ subsets: ["latin"], variable: "--nf-archivo" });

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getContent();
  return {
    metadataBase: new URL("https://kalcerjam.site"),
    title: { default: settings.siteTitle, template: "%s — Kalcer Jam 2027" },
    description: settings.siteDescription,
    openGraph: { siteName: "Kalcer Jam", type: "website" },
  };
}

export const viewport: Viewport = { themeColor: "#0a0a0a" };

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const c = await getContent();
  return (
    <html lang={lang} className={`${anton.variable} ${archivo.variable}`}>
      <body className="min-h-screen antialiased">
        <a href="#main" className="label sr-only z-[70] bg-kj px-3 py-2 text-ink focus:not-sr-only focus:fixed focus:left-2 focus:top-2">Skip to content</a>
        <Nav lang={lang} nav={c.nav.main} navMore={c.nav.more} ui={c.ui} />
        <main id="main">{children}</main>
        <Footer lang={lang} c={c} />
      </body>
    </html>
  );
}
