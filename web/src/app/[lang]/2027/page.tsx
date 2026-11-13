import Link from "next/link";
import { href, tx } from "@/lib/i18n";
import { getLang, pageMeta } from "@/lib/meta";
import { categories, days, ui } from "@/lib/content";
import { PageHeader, SectionTag } from "@/components/bits";

export const generateMetadata = ({ params }: PageProps<"/[lang]/2027">) =>
  pageMeta(params, "/2027", { en: "Event", id: "Event" }, { en: "Two days in Semarang, 26–27 July 2027: schedule, venue and map.", id: "Dua hari di Semarang, 26–27 Juli 2027: jadwal, venue dan peta." });

// Placeholder rundown — real times come later from the CMS.
const rundown = {
  1: [["10:00", "Doors · cypher"], ["11:00", "Prelims"], ["15:00", "Bgirl · Kids U-12 · Over 35 — Top 16"], ["19:00", "7 to Smoke — Openstyle"], ["20:30", "7 to Smoke — Breaking"]],
  2: [["10:00", "Doors · cypher"], ["11:00", "Prelims"], ["15:00", "Top 16 → Semi"], ["19:00", "Finals"], ["21:00", "Road to Bangkok — winners announced"]],
} as const;

export default async function Event({ params }: PageProps<"/[lang]/2027">) {
  const lang = await getLang(params);
  const L = (en: string, id: string) => (lang === "en" ? en : id);
  return (
    <>
      <PageHeader kicker="26—27.07.2027 · Semarang" title={L("Two days", "Dua hari")}>
        <p>{L("Pre-Party on Saturday. Main Event on Sunday. Free for spectators.", "Pre-Party hari Sabtu. Main Event hari Minggu. Gratis untuk penonton.")}</p>
      </PageHeader>

      <section className="mx-auto mt-16 grid max-w-7xl gap-x-12 gap-y-14 px-4 md:mt-20 md:px-8 lg:grid-cols-2">
        {days.map((d) => (
          <article key={d.n}>
            <div className="flex items-end justify-between gap-4 border-b-2 border-ink pb-4">
              <div>
                <p className="label text-ink">{L("Day", "Hari")} {d.n}</p>
                <h2 className="display text-5xl md:text-6xl">{tx(d.title, lang)}</h2>
              </div>
              <p className="display text-4xl">{d.date}</p>
            </div>
            <ol>
              {rundown[d.n as 1 | 2].map(([time, what]) => (
                <li key={time} className="grid grid-cols-[5rem_1fr] items-baseline border-b border-ink/20 py-3.5 md:grid-cols-[6rem_1fr]">
                  <span className="display text-2xl text-ink">{time}</span>
                  <span className="text-lg">{what}</span>
                </li>
              ))}
            </ol>
            <p className="label mt-4 text-ink/40">{L("Rundown is a placeholder", "Rundown masih placeholder")}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto mt-24 md:mt-32 max-w-7xl px-4 md:px-8">
        <SectionTag>Venue</SectionTag>
        <div className="mt-8 grid gap-6 md:grid-cols-[1fr_1.3fr]">
          <div className="paper p-6 md:p-10">
            <p className="label flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-stamp" aria-hidden />{tx(ui.venueSoon, lang)}</p>
            <p className="display mt-4 text-6xl md:text-7xl">Semarang</p>
            <p className="mt-2 text-ink/70">{L("Address and capacity are being locked in now.", "Alamat dan kapasitas sedang difinalisasi.")}</p>
            <Link href={href(lang, "/travel")} className="btn btn-ink mt-8">{L("Travel guide", "Panduan perjalanan")}</Link>
          </div>
          {/* Map placeholder: drawn street grid until the venue pin exists */}
          <div className="relative aspect-[4/3] overflow-hidden bg-paper-2" role="img" aria-label={L("Map placeholder", "Placeholder peta")}>
            <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full text-ink/20" aria-hidden>
              {Array.from({ length: 12 }, (_, i) => <line key={`h${i}`} x1="0" x2="400" y1={i * 28 + 8} y2={i * 28 - 20} stroke="currentColor" strokeWidth={i % 4 ? 1 : 4} />)}
              {Array.from({ length: 14 }, (_, i) => <line key={`v${i}`} y1="0" y2="300" x1={i * 32} x2={i * 32 + 40} stroke="currentColor" strokeWidth={i % 5 ? 1 : 4} />)}
              <path d="M0 220 C120 180 220 260 400 150" stroke="var(--color-kj)" strokeWidth="8" fill="none" opacity=".5" />
            </svg>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full">
              <div className="display bg-kj px-3 py-1 text-xl text-ink">KJ27</div>
              <div className="mx-auto h-6 w-1 bg-kj" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-24 md:mt-32 max-w-7xl px-4 md:px-8">
        <SectionTag>{L("Categories", "Kategori")}</SectionTag>
        <div className="mt-8 flex flex-wrap gap-3">
          {categories.map((c) => (
            <Link key={c.slug} href={href(lang, `/2027/categories#${c.slug}`)} className="display border border-ink/30 px-4 py-2.5 text-2xl hover:border-kj hover:bg-kj hover:text-ink">{c.name}</Link>
          ))}
        </div>
      </section>
    </>
  );
}
