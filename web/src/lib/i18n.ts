export const locales = ["en", "id"] as const;
export type Lang = (typeof locales)[number];
export type T = { en: string; id: string };

export const isLang = (v: string): v is Lang => (locales as readonly string[]).includes(v);

/** Pick the string for a locale; plain strings are the same in both. */
export const tx = (v: T | string, lang: Lang) => (typeof v === "string" ? v : v[lang]);

/** English lives at "/", Indonesian at "/id". */
export const href = (lang: Lang, path: string) => (lang === "en" ? path : `/id${path === "/" ? "" : path}`);

/** Same page in the other language. */
export const swapLang = (pathname: string, to: Lang) => {
  const bare = pathname.replace(/^\/id(?=\/|$)/, "") || "/";
  return href(to, bare);
};
