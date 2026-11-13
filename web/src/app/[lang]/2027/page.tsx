import Link from "next/link";
import { href, tx } from "@/lib/i18n";
import { getLang, pageMeta } from "@/lib/meta";
import { getContent } from "@/lib/cms";
import { PageHeader, SectionTag } from "@/components/bits";

export const generateMetadata = ({ params }: PageProps<"/[lang]/2027">) => pageMeta(params, "/2027", "event");

export default async function Event({ params }: PageProps<"/[lang]/2027">) {
  const lang = await getLang(params);
  const c = await getContent();
  const e = c.event;
  const x = (v: Parameters<typeof tx>[0]) => tx(v, lang);
  return (
    <>
      <PageHeader kicker={x(e.kicker)} title={x(e.title)}>
        <p>{x(e.intro)}</p>
      </PageHeader>

      <section className="mx-auto mt-16 grid max-w-7xl gap-x-12 gap-y-14 px-4 md:mt-20 md:px-8 lg:grid-cols-2">
        {e.days.map((d) => (
          <article key={d.n}>
            <div className="flex items-end justify-between gap-4 border-b-2 border-ink pb-4">
              <div>
                <p className="label text-ink">{x(c.ui.day)} {d.n}</p>
                <h2 className="display text-5xl md:text-6xl">{x(d.title)}</h2>
              </div>
              <p className="display text-4xl">{d.date}</p>
            </div>
            <ol>
              {d.rundown.map((r, i) => (
                <li key={i} className="grid grid-cols-[5rem_1fr] items-baseline border-b border-ink/20 py-3.5 md:grid-cols-[6rem_1fr]">
                  <span className="display text-2xl text-ink">{r.time}</span>
                  <span className="text-lg">{x(r.what)}</span>
                </li>
              ))}
            </ol>
            {x(e.rundownNote) && <p className="label mt-4 text-ink/40">{x(e.rundownNote)}</p>}
          </article>
        ))}
      </section>

      <section className="mx-auto mt-24 max-w-7xl px-4 md:mt-32 md:px-8">
        <SectionTag>{x(e.venueTag)}</SectionTag>
        <div className="mt-8 grid gap-6 md:grid-cols-[1fr_1.3fr]">
          <div className="paper p-6 md:p-10">
            <p className="label flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-stamp" aria-hidden />{x(c.ui.venueSoon)}</p>
            <p className="display mt-4 text-6xl md:text-7xl">{x(e.venueCity)}</p>
            <p className="mt-2 text-ink/70">{x(e.venueBody)}</p>
            <Link href={href(lang, "/travel")} className="btn btn-ink mt-8">{x(e.travelCta)}</Link>
          </div>
          {e.venueMapUrl ? (
            <iframe src={e.venueMapUrl} title="Venue map" className="aspect-[4/3] w-full rounded-xl border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          ) : (
            /* Map placeholder: drawn street grid until the venue map URL is set in /admin */
            <div className="relative aspect-[4/3] overflow-hidden bg-paper-2" role="img" aria-label="Map placeholder">
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
          )}
        </div>
      </section>

      <section className="mx-auto mt-24 max-w-7xl px-4 md:mt-32 md:px-8">
        <SectionTag>{x(e.categoriesTag)}</SectionTag>
        <div className="mt-8 flex flex-wrap gap-3">
          {c.categories.list.map((cat) => (
            <Link key={cat.slug} href={href(lang, `/2027/categories#${cat.slug}`)} className="display border border-ink/30 px-4 py-2.5 text-2xl hover:border-kj hover:bg-kj hover:text-ink">{cat.name}</Link>
          ))}
        </div>
      </section>
    </>
  );
}
