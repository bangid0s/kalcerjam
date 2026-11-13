import type { Metadata } from "next";
import { href, isLang, type Lang, type T } from "./i18n";

/** Per-page title/description with EN/ID alternates (PRD §3 SEO). */
export async function pageMeta(params: Promise<{ lang: string }>, path: string, title: T, description: T): Promise<Metadata> {
  const { lang: raw } = await params;
  const lang: Lang = isLang(raw) ? raw : "en";
  return {
    title: title[lang],
    description: description[lang],
    alternates: { canonical: href(lang, path), languages: { en: href("en", path), id: href("id", path) } },
    openGraph: { title: `${title[lang]} — Kalcer Jam 2027`, description: description[lang], locale: lang === "en" ? "en_US" : "id_ID" },
  };
}

export async function getLang(params: Promise<{ lang: string }>): Promise<Lang> {
  const { lang } = await params;
  return isLang(lang) ? lang : "en";
}
