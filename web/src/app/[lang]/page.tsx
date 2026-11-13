import Link from "next/link";
import { href, tx } from "@/lib/i18n";
import { getLang } from "@/lib/meta";
import { getContent } from "@/lib/cms";
import { SectionTag, SponsorLogo } from "@/components/bits";
import { Countdown } from "@/components/client";

const section = "mx-auto mt-24 max-w-7xl px-4 md:mt-32 md:px-8";
const h2 = "display mt-6 text-[clamp(3rem,9vw,7rem)]";
const card = "rounded-2xl p-6 md:p-10";

function Arrow() {
  return (
    <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-current transition-colors group-hover:border-kj group-hover:bg-kj group-hover:text-ink">
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
    </span>
  );
}

export default async function Home({ params }: PageProps<"/[lang]">) {
  const lang = await getLang(params);
  const c = await getContent();
  const { settings: s, home: h, ui } = c;
  const x = (v: Parameters<typeof tx>[0]) => tx(v, lang);
  const days = c.event.days;
  const homeLogos = c.sponsors.tiers.filter((t) => t.showOnHome).flatMap((t) => t.logos);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: "Kalcer Jam 2027",
    startDate: s.startDate,
    endDate: s.endDate,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: { "@type": "Place", name: s.venueName, address: { "@type": "PostalAddress", addressLocality: "Semarang", addressCountry: "ID" } },
    organizer: { "@type": "Organization", name: "Anak Kalcer", url: "https://kalcerjam.site" },
    isAccessibleForFree: true,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      {/* ───── HERO: event banner. Steps left, logo over the year, info panel along the bottom. ───── */}
      <section className="overflow-hidden bg-kj pt-24 md:pt-28">
        <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 pb-6 md:px-8 md:pb-10 lg:block">
          <div className="contents lg:grid lg:grid-cols-[16rem_1fr] lg:gap-12">
            <div className="lg:col-start-2 lg:row-start-1">
              <div className="flex items-center justify-end gap-3">
                <p className="label text-right">{x(ui.presents)}<br />× 6Kamenz</p>
                <span aria-hidden className="h-9 w-[4.5rem] [background:repeating-conic-gradient(var(--color-ink)_0_25%,transparent_0_50%)_0_0/18px_18px]" />
              </div>
              <p aria-hidden className="display mt-2 select-none text-center text-[clamp(8rem,34vw,26rem)] leading-[.82] text-white">2027</p>
              <h1 className="relative -mt-[20%]">
                <span className="sr-only">Kalcer Jam 2027</span>
                {/* eslint-disable-next-line @next/next/no-img-element -- transparent art, already sized */}
                <img src="/brand/kj-letters.webp" alt="" width={900} height={375} fetchPriority="high" className="block h-auto w-full brightness-0 [mask-image:linear-gradient(#000_78%,transparent)]" />
              </h1>
            </div>

            <div className="order-3 lg:col-start-1 lg:row-start-1 lg:pt-2">
              <p className="label">{x(h.howToEnter)}</p>
              <ol className="mt-3 space-y-2 border-l-2 border-ink/25 pl-4">
                {h.steps.map((st, i) => (
                  <li key={i} className="relative">
                    <span aria-hidden className="absolute -left-[1.4rem] top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-ink" />
                    <span className="label block rounded-md bg-white px-3 py-2.5">{x(st)}</span>
                  </li>
                ))}
              </ol>
              <p className="label mt-8">{x(h.numbersTitle)}</p>
              <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
                {h.numbers.map((n, i) => (
                  <div key={i} className="flex flex-col-reverse rounded-lg bg-ink/10 p-3">
                    <dt className="label mt-1 text-[.72rem]">{x(n.label)}</dt>
                    <dd className="display text-3xl">{n.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <div className="paper relative order-2 grid gap-6 p-5 sm:grid-cols-2 lg:-mt-6 md:p-7 lg:grid-cols-[auto_auto_1fr_auto] lg:items-center lg:gap-10">
            <div>
              <p className="label">{x(h.datesLabel)}</p>
              <p className="display mt-2 inline-block rounded-lg bg-ink px-4 pb-2 pt-3 text-3xl text-white md:text-5xl">{s.dates}</p>
            </div>
            <div>
              <p className="label">{x(h.cityLabel)}</p>
              <p className="mt-2 flex flex-wrap items-end gap-x-3 gap-y-1">
                <span className="display text-4xl md:text-6xl">{s.city}</span>
                <span className="label rounded bg-ink px-2 py-1 text-white">{x(ui.free)}</span>
              </p>
            </div>
            <ul className="space-y-1 text-sm text-ink/70">
              {h.infoLines.map((l, i) => <li key={i}>{x(l)}</li>)}
            </ul>
            <div className="flex flex-wrap gap-2 lg:flex-col">
              <Link href={href(lang, "/register")} className="btn btn-ink">{x(ui.register)}</Link>
              <Link href={href(lang, "/register#rsvp")} className="btn btn-ghost">{x(ui.rsvp)}</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ───── COUNTDOWN ───── */}
      <section className={section}>
        <div className="paper grid gap-8 p-6 md:grid-cols-[1fr_1.4fr] md:items-center md:p-12">
          <div>
            <p className="label">{x(ui.countdown)}</p>
            <p className="display mt-3 text-6xl md:text-8xl">{h.countdownDate}</p>
            <p className="mt-3 text-ink/70">{x(h.countdownNote)}</p>
          </div>
          <Countdown to={s.start} units={[x(ui.unitDays), x(ui.unitHours), x(ui.unitMinutes), x(ui.unitSeconds)]} />
        </div>
      </section>

      {/* ───── FIGHT CARD: two days ───── */}
      <section className={section}>
        <SectionTag>{x(h.fightTag)}</SectionTag>
        <h2 className={h2}>{x(h.fightTitle1)}<br />{x(h.fightTitle2)}</h2>

        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          {days.map((d, di) => {
            const dark = di % 2 === 0;
            return (
              <article key={d.n} className={`${card} ${dark ? "bg-ink text-white" : "bg-kj"}`}>
                <p className={`label ${dark ? "text-kj" : ""}`}>{x(ui.day)} {d.n}, {d.date}</p>
                <h3 className="display mt-2 text-5xl md:text-6xl">{x(d.title)}</h3>
                <ul className="mt-8">
                  {c.categories.list.filter((cat) => cat.day === d.n).map((cat) => (
                    <li key={cat.slug} className={`flex items-baseline justify-between gap-3 border-t py-3.5 ${dark ? "border-white/20" : "border-ink/25"}`}>
                      <span className="display text-2xl md:text-3xl">{cat.name}</span>
                      <span className="label shrink-0 text-right opacity-70">{x(cat.unit)}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
        <Link href={href(lang, "/2027/categories")} className="btn btn-ghost mt-8">{x(ui.allCategories)}</Link>
      </section>

      {/* ───── ROAD TO BANGKOK: boarding pass ───── */}
      <section className={section}>
        <SectionTag>{x(h.bangkokTag)}</SectionTag>
        <div className="mt-10 grid overflow-hidden rounded-2xl bg-ink text-white md:grid-cols-[1fr_auto_18rem]">
          <div className="p-6 md:p-12">
            <p className="label text-white/70">{x(h.bangkokKicker)}</p>
            <div className="mt-5 flex items-center gap-4 text-kj md:gap-8">
              <div><p className="display text-6xl sm:text-7xl md:text-9xl">{h.bangkokFrom.code}</p><p className="label mt-1 text-white">{h.bangkokFrom.city}</p></div>
              <svg viewBox="0 0 64 24" className="h-8 w-16 shrink-0 md:h-12 md:w-28" aria-hidden><path d="M0 12h52M44 4l10 8-10 8" stroke="currentColor" strokeWidth="3" fill="none" /></svg>
              <div><p className="display text-6xl sm:text-7xl md:text-9xl">{h.bangkokTo.code}</p><p className="label mt-1 text-white">{h.bangkokTo.city}</p></div>
            </div>
            <p className="mt-8 max-w-xl text-lg text-white/80">{x(h.bangkokBody)}</p>
          </div>
          <div className="hidden border-l-2 border-dashed border-white/30 md:block" aria-hidden />
          <dl className="grid grid-cols-2 border-t-2 border-dashed border-white/30 md:grid-cols-1 md:border-t-0">
            {h.bangkokStats.map((st, i) => (
              <div key={i} className="px-6 py-4 md:border-t md:border-white/15 md:first:border-t-0"><dt className="label text-white/60">{x(st.label)}</dt><dd className="display mt-1 text-3xl">{st.value}</dd></div>
            ))}
          </dl>
        </div>
      </section>

      {/* ───── 7 TO SMOKE ───── */}
      <section className={`${section} grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16`}>
        <div>
          <SectionTag>{x(h.smokeTag)}</SectionTag>
          <h2 className={h2}>{x(h.smokeTitle)}</h2>
          <p className="mt-6 max-w-lg text-lg text-ink/75">{x(h.smokeBody)}</p>
        </div>
        <div>
          <div aria-hidden className="grid grid-cols-7 gap-1.5 md:gap-2">
            {Array.from({ length: 7 }, (_, i) => (
              <div key={i} className={`display grid aspect-square place-items-center rounded-lg text-3xl md:text-5xl ${i === 6 ? "bg-gold" : i < 4 ? "bg-ink text-kj" : "border border-ink/25 text-ink/35"}`}>{i + 1}</div>
            ))}
          </div>
          <p className="label mt-4 text-right text-ink/60">{x(h.smokeCaption)}</p>
        </div>
      </section>

      {/* ───── FEE ───── */}
      <section className={section}>
        <div className={`${card} grid gap-10 bg-kj md:grid-cols-2 md:items-end md:gap-20 md:p-14`}>
          <div>
            <p className="label">{x(h.feeKicker)}</p>
            <p className="display mt-4 text-[clamp(4rem,15vw,10rem)]">{s.feeShort}</p>
            <p className="label mt-2">{s.feeUsd} {x(h.feeUsdNote)}</p>
          </div>
          <div>
            <dl className="border-b-2 border-ink">
              {h.feeRows.map((r, i) => (
                <div key={i} className="flex items-baseline justify-between gap-4 border-t-2 border-ink py-3"><dt className="label">{x(r.label)}</dt><dd className="display text-3xl">{x(r.value)}</dd></div>
              ))}
            </dl>
            <Link href={href(lang, "/register")} className="btn btn-ink mt-8 w-full sm:w-auto">{x(h.feeCta)}</Link>
          </div>
        </div>
      </section>

      {/* ───── NEWS ───── */}
      <section className={section}>
        <SectionTag>{x(h.newsTag)}</SectionTag>
        <ul className="mt-8 border-b border-ink/15">
          {c.news.posts.slice(0, 3).map((n, i) => (
            <li key={i} className="border-t border-ink/15 py-2">
              <Link href={href(lang, "/news")} className="group grid items-center gap-x-8 gap-y-2 rounded-2xl px-4 py-5 transition-colors hover:bg-ink hover:text-white md:grid-cols-[16rem_1fr_auto] md:px-6">
                <h3 className="display text-2xl md:text-3xl">{x(n.title)}</h3>
                <p className="max-w-xl text-sm opacity-70">{x(n.body)}</p>
                <span className="flex items-center gap-4"><time dateTime={n.date} className="label opacity-60">{n.date}</time><Arrow /></span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ───── SPONSORS ───── */}
      <section className={section}>
        <SectionTag>{x(h.sponsorsTag)}</SectionTag>
        <div className="mt-10 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {homeLogos.map((l, i) => (
            <SponsorLogo key={i} {...l} className="aspect-[3/2] rounded-lg" />
          ))}
        </div>
        <Link href={href(lang, "/sponsors")} className="btn btn-ghost mt-8">{x(h.sponsorsCta)}</Link>
      </section>
    </>
  );
}
