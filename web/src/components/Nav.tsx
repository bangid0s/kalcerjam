"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { href, swapLang, tx, type Lang } from "@/lib/i18n";
import { nav, navMore, ui } from "@/lib/content";
import { Logo } from "./bits";

export function Nav({ lang }: { lang: Lang }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const other: Lang = lang === "en" ? "id" : "en";

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);

  const bare = pathname.replace(/^\/id(?=\/|$)/, "") || "/";

  return (
    <>
      <header className="fixed inset-x-3 top-3 z-50 mx-auto max-w-7xl rounded-2xl bg-ink text-paper">
        <div className="flex items-center justify-between gap-4 px-4 py-2.5 md:px-5">
          <Link href={href(lang, "/")} aria-label="Kalcer Jam home">
            <Logo className="w-28 md:w-32" />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
            {nav.map((n) => {
              const active = bare === n.path || (n.path !== "/2027" && bare.startsWith(n.path));
              return (
                <Link key={n.path} href={href(lang, n.path)}
                  className={`label px-3 py-2 transition-colors ${active ? "text-kj" : "text-paper/75 hover:text-paper"}`}>
                  {n.path === "/live" && <span className="mr-1.5 inline-block h-2 w-2 animate-pulse rounded-full bg-stamp align-middle" />}
                  {tx(n.label, lang)}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Link href={swapLang(pathname, other)} hrefLang={other} className="label grid h-10 w-10 place-items-center text-paper/75 hover:text-kj" aria-label={`Switch to ${other === "id" ? "Bahasa Indonesia" : "English"}`}>
              {other.toUpperCase()}
            </Link>
            <Link href={href(lang, "/register")} className="btn btn-kj hidden !px-4 !py-2.5 !text-base sm:inline-flex">{tx(ui.register, lang)}</Link>
            <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="mobile-menu"
              className="grid h-10 w-10 place-items-center text-xl text-paper lg:hidden">
              {open ? "✕" : "☰"}
              <span className="sr-only">{tx(open ? ui.close : ui.menu, lang)}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile: full-screen menu */}
      <div id="mobile-menu" hidden={!open} className="fixed inset-0 z-40 overflow-y-auto bg-ink pb-10 pt-28 text-paper lg:hidden">
        <nav className="relative px-4" aria-label="Mobile" onClick={() => setOpen(false)}>
          {[...nav, ...navMore].map((n) => (
            <Link key={n.path} href={href(lang, n.path)}
              className="display block border-b border-paper/15 py-3 text-[clamp(2.2rem,10vw,3.5rem)] hover:text-kj">
              {tx(n.label, lang)}
            </Link>
          ))}
          <Link href={href(lang, "/register")} className="btn btn-kj mt-8 w-full">{tx(ui.register, lang)}</Link>
        </nav>
      </div>
    </>
  );
}
