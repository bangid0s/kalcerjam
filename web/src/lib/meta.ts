import type { Metadata } from "next";
import { href, isLang, type Lang } from "./i18n";
import { getContent } from "./cms";
import type { PageMeta } from "./content";

type MetaKey = { [K in keyof Awaited<ReturnType<typeof getContent>>]: Awaited<ReturnType<typeof getContent>>[K] extends { meta: PageMeta } ? K : never }[keyof Awaited<ReturnType<typeof getContent>>];

/** Per-page title/description (editable in /admin) with EN/ID alternates. */
export async function pageMeta(params: Promise<{ lang: string }>, path: string, key: MetaKey): Promise<Metadata> {
  const lang = await getLang(params);
  const { title, description } = (await getContent())[key].meta;
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
