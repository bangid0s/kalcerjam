"use client";

import { useEffect, useMemo, useState } from "react";
import { tx, type Lang, type T } from "@/lib/i18n";

export function Countdown({ to, units }: { to: string; units: string[] }) {
  const target = useMemo(() => new Date(to).getTime(), [to]);
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0); // client-only time avoids hydration mismatch
    const id = setInterval(tick, 1000);
    return () => { clearTimeout(first); clearInterval(id); };
  }, []);
  const left = Math.max(0, target - (now ?? target));
  const parts = [Math.floor(left / 864e5), Math.floor(left / 36e5) % 24, Math.floor(left / 6e4) % 60, Math.floor(left / 1e3) % 60];
  return (
    <div className="grid grid-cols-4 gap-1.5 sm:gap-2" role="timer" aria-live="off">
      {parts.map((v, i) => (
        <div key={i} className="border-2 border-ink bg-ink text-center text-paper">
          <div className="display px-1 pb-1 pt-2 text-[clamp(2rem,7vw,3.75rem)] tabular-nums text-kj">
            {now === null ? "--" : String(v).padStart(i === 0 ? 3 : 2, "0")}
          </div>
          <div className="label bg-paper py-1 text-[.6rem] text-ink">{units[i]}</div>
        </div>
      ))}
    </div>
  );
}

export function FaqSearch({ lang, groups, placeholder, empty }: { lang: Lang; groups: { group: T; items: { q: T; a: T }[] }[]; placeholder: string; empty: string }) {
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const shown = groups
    .map((g) => ({ ...g, items: g.items.filter((it) => !needle || (tx(it.q, lang) + tx(it.a, lang)).toLowerCase().includes(needle)) }))
    .filter((g) => g.items.length);
  return (
    <div>
      <label className="relative block">
        <span className="sr-only">{placeholder}</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder}
          className="display w-full border-b-2 border-ink bg-transparent py-4 pr-10 text-2xl text-ink placeholder:text-ink/30 focus:border-ink focus:outline-none md:text-3xl" />
        <span aria-hidden className="display absolute right-0 top-1/2 -translate-y-1/2 text-3xl text-ink">⌕</span>
      </label>
      {shown.length === 0 && <p className="mt-10 text-xl text-ink/75">{empty}</p>}
      {shown.map((g) => (
        <section key={tx(g.group, lang)} className="mt-12">
          <h2 className="label mb-3 text-ink">{tx(g.group, lang)}</h2>
          {g.items.map((it) => (
            <details key={tx(it.q, lang)} className="group border-b border-ink/20 py-1">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 py-3 text-xl font-bold md:text-2xl">
                {tx(it.q, lang)}
                <span aria-hidden className="display text-3xl text-ink transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="max-w-3xl pb-5 text-ink/80 md:text-lg">{tx(it.a, lang)}</p>
            </details>
          ))}
        </section>
      ))}
    </div>
  );
}

/** Spectator RSVP. Not wired to a backend yet, so it says so instead of pretending to save. */
export function RsvpForm({ lang }: { lang: Lang }) {
  const [sent, setSent] = useState(false);
  const L = {
    name: { en: "Name", id: "Nama" }, email: { en: "Email", id: "Email" }, city: { en: "City", id: "Kota" },
    party: { en: "People", id: "Jumlah orang" }, news: { en: "Send me Kalcer Jam news", id: "Kirimi saya kabar Kalcer Jam" },
    go: { en: "Get my free pass", id: "Ambil pass gratis" },
    soon: { en: "RSVP opens with registration on 1 April 2027. Follow @kalcerjam so you don't miss it.", id: "RSVP dibuka bersama pendaftaran pada 1 April 2027. Follow @kalcerjam supaya tidak ketinggalan." },
  };
  const field = "w-full border-2 border-ink bg-transparent px-3 py-3 text-ink placeholder:text-ink/40 focus:bg-paper focus:outline-none";
  return (
    <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="grid gap-3 sm:grid-cols-2">
      <label className="sm:col-span-2"><span className="label mb-1 block">{tx(L.name, lang)}</span><input required name="name" autoComplete="name" className={field} /></label>
      <label><span className="label mb-1 block">{tx(L.email, lang)}</span><input required type="email" name="email" autoComplete="email" className={field} /></label>
      <label><span className="label mb-1 block">{tx(L.city, lang)}</span><input required name="city" autoComplete="address-level2" className={field} /></label>
      <label><span className="label mb-1 block">{tx(L.party, lang)}</span><input required type="number" min={1} max={10} defaultValue={1} name="party" className={field} /></label>
      <label className="flex items-center gap-3 self-end pb-3"><input type="checkbox" name="news" className="h-5 w-5 accent-ink" /><span className="text-sm">{tx(L.news, lang)}</span></label>
      <button className="btn btn-ink sm:col-span-2">{tx(L.go, lang)}</button>
      {sent && <p role="status" className="bg-ink px-4 py-3 text-paper sm:col-span-2">{tx(L.soon, lang)}</p>}
    </form>
  );
}
