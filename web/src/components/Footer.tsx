import Link from "next/link";
import { href, tx, type Lang } from "@/lib/i18n";
import type { Content } from "@/lib/content";
import { AnakKalcer, Logo } from "./bits";

export function Footer({ lang, c }: { lang: Lang; c: Content }) {
  const s = c.settings;
  return (
    <footer className="mt-24 bg-ink text-paper md:mt-32">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
        <p className="display max-w-5xl text-[clamp(2.75rem,8vw,7rem)]">{tx(c.ui.footerLine, lang)}</p>
        <div className="mt-14 grid gap-12 border-t border-paper/15 pt-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo className="w-48" />
            <AnakKalcer className="mt-6 w-14" />
          </div>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-2.5">
            {[...c.nav.main, ...c.nav.more].map((n) => (
              <li key={n.path}>
                <Link href={href(lang, n.path)} className="label text-paper/75 transition-colors hover:text-kj">{tx(n.label, lang)}</Link>
              </li>
            ))}
          </ul>
          <div className="space-y-3">
            <a href={`https://instagram.com/${s.instagram}`} target="_blank" rel="noreferrer" className="display block text-3xl transition-colors hover:text-kj">@{s.instagram}</a>
            <a href={`mailto:${s.email}`} className="label block text-paper/75 transition-colors hover:text-kj">{s.email}</a>
            <p className="label text-paper/60">{s.footerCrew}</p>
          </div>
        </div>
        <div className="label mt-12 flex flex-wrap justify-between gap-2 text-paper/50">
          <span>{s.footerCopyright}</span>
          <span>{s.footerRight}</span>
        </div>
      </div>
    </footer>
  );
}
