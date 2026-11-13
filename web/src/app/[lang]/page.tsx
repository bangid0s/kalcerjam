import Link from "next/link";
import { href, tx } from "@/lib/i18n";
import { getLang } from "@/lib/meta";
import { categories, criteria, days, EVENT, news, sponsorTiers, ui } from "@/lib/content";
import { SectionTag, Ticker } from "@/components/bits";
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
  const L = (en: string, id: string) => (lang === "en" ? en : id);
  const fee = EVENT.feeIdr.replace(".000", "K");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: "Kalcer Jam 2027",
    startDate: "2027-07-26",
    endDate: "2027-07-27",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: { "@type": "Place", name: "TBA", address: { "@type": "PostalAddress", addressLocality: "Semarang", addressCountry: "ID" } },
    organizer: { "@type": "Organization", name: "Anak Kalcer", url: "https://kalcerjam.site" },
    isAccessibleForFree: true,
  };

  const steps = [L("Sign up", "Daftar akun"), L("Build your profile", "Isi profil"), L("Pick categories", "Pilih kategori"), L("Pay once", "Bayar sekali"), L("Get your QR pass", "Dapat QR pass")];
  const numbers = [["8", L("Categories", "Kategori")], ["2", L("Days", "Hari")], ["4", L("Seats to Bangkok", "Kursi ke Bangkok")], [fee, L("One fee", "Satu biaya")]];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      {/* ───── HERO: event banner. Steps left, logo over the year, info panel along the bottom. ───── */}
      <section className="overflow-hidden bg-kj pt-24 md:pt-28">
        <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 pb-6 md:px-8 md:pb-10 lg:block">
          <div className="contents lg:grid lg:grid-cols-[16rem_1fr] lg:gap-12">
            <div className="lg:col-start-2 lg:row-start-1">
              <div className="flex items-center justify-end gap-3">
                <p className="label text-right">{tx(ui.presents, lang)}<br />× 6Kamenz</p>
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
              <p className="label">{L("How to enter", "Cara ikut")}</p>
              <ol className="mt-3 space-y-2 border-l-2 border-ink/25 pl-4">
                {steps.map((s) => (
                  <li key={s} className="relative">
                    <span aria-hidden className="absolute -left-[1.4rem] top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-ink" />
                    <span className="label block rounded-md bg-white px-3 py-2.5">{s}</span>
                  </li>
                ))}
              </ol>
              <p className="label mt-8">{L("Two days in numbers", "Dua hari dalam angka")}</p>
              <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
                {numbers.map(([n, k]) => (
                  <div key={k} className="flex flex-col-reverse rounded-lg bg-ink/10 p-3">
                    <dt className="label mt-1 text-[.72rem]">{k}</dt>
                    <dd className="display text-3xl">{n}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <div className="paper relative order-2 grid gap-6 p-5 sm:grid-cols-2 lg:-mt-6 md:p-7 lg:grid-cols-[auto_auto_1fr_auto] lg:items-center lg:gap-10">
            <div>
              <p className="label">{L("Dates", "Tanggal")}</p>
              <p className="display mt-2 inline-block rounded-lg bg-ink px-4 pb-2 pt-3 text-3xl text-white md:text-5xl">{EVENT.dates}</p>
            </div>
            <div>
              <p className="label">{L("City", "Kota")}</p>
              <p className="mt-2 flex flex-wrap items-end gap-x-3 gap-y-1">
                <span className="display text-4xl md:text-6xl">{EVENT.city}</span>
                <span className="label rounded bg-ink px-2 py-1 text-white">{tx(ui.free, lang)}</span>
              </p>
            </div>
            <ul className="space-y-1 text-sm text-ink/70">
              <li>{tx(ui.venueSoon, lang)}.</li>
              <li>{L("Registration runs 1 April to 10 July 2027.", "Pendaftaran 1 April sampai 10 Juli 2027.")}</li>
              <li>{L(`One fee covers every category: ${EVENT.feeIdr}, or ${EVENT.feeUsd} by PayPal.`, `Satu biaya untuk semua kategori: ${EVENT.feeIdr}, atau ${EVENT.feeUsd} via PayPal.`)}</li>
            </ul>
            <div className="flex flex-wrap gap-2 lg:flex-col">
              <Link href={href(lang, "/register")} className="btn btn-ink">{tx(ui.register, lang)}</Link>
              <Link href={href(lang, "/register#rsvp")} className="btn btn-ghost">{tx(ui.rsvp, lang)}</Link>
            </div>
          </div>
        </div>
      </section>

      <Ticker className="bg-ink py-3 text-2xl text-kj md:text-4xl" items={categories.map((c) => c.name)} />

      {/* ───── COUNTDOWN ───── */}
      <section className={section}>
        <div className="paper grid gap-8 p-6 md:grid-cols-[1fr_1.4fr] md:items-center md:p-12">
          <div>
            <p className="label">{tx(ui.countdown, lang)}</p>
            <p className="display mt-3 text-6xl md:text-8xl">26.07.27</p>
            <p className="mt-3 text-ink/70">{L("Doors 10:00 WIB · placeholder", "Pintu dibuka 10:00 WIB · placeholder")}</p>
          </div>
          <Countdown to={EVENT.start} units={ui.units[lang]} />
        </div>
      </section>

      {/* ───── FIGHT CARD: two days ───── */}
      <section className={section}>
        <SectionTag>{L("The fight card", "Susunan battle")}</SectionTag>
        <h2 className={h2}>{L("Two days.", "Dua hari.")}<br />{L("Eight floors.", "Delapan kategori.")}</h2>

        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          {days.map((d) => {
            const dark = d.n === 1;
            return (
              <article key={d.n} className={`${card} ${dark ? "bg-ink text-white" : "bg-kj"}`}>
                <p className={`label ${dark ? "text-kj" : ""}`}>{L("Day", "Hari")} {d.n}, {d.date}</p>
                <h3 className="display mt-2 text-5xl md:text-6xl">{tx(d.title, lang)}</h3>
                <ul className="mt-8">
                  {categories.filter((c) => c.day === d.n).map((c) => (
                    <li key={c.slug} className={`flex items-baseline justify-between gap-3 border-t py-3.5 ${dark ? "border-white/20" : "border-ink/25"}`}>
                      <span className="display text-2xl md:text-3xl">{c.name}</span>
                      <span className="label shrink-0 text-right opacity-70">{tx(c.unit, lang)}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
        <Link href={href(lang, "/2027/categories")} className="btn btn-ghost mt-8">{tx(ui.allCategories, lang)}</Link>
      </section>

      {/* ───── ROAD TO BANGKOK: boarding pass ───── */}
      <section className={section}>
        <SectionTag>Road to Bangkok</SectionTag>
        <div className="mt-10 grid overflow-hidden rounded-2xl bg-ink text-white md:grid-cols-[1fr_auto_18rem]">
          <div className="p-6 md:p-12">
            <p className="label text-white/70">{L("Boarding pass for the Main Event winners", "Boarding pass untuk pemenang Main Event")}</p>
            <div className="mt-5 flex items-center gap-4 text-kj md:gap-8">
              <div><p className="display text-6xl sm:text-7xl md:text-9xl">SRG</p><p className="label mt-1 text-white">Semarang</p></div>
              <svg viewBox="0 0 64 24" className="h-8 w-16 shrink-0 md:h-12 md:w-28" aria-hidden><path d="M0 12h52M44 4l10 8-10 8" stroke="currentColor" strokeWidth="3" fill="none" /></svg>
              <div><p className="display text-6xl sm:text-7xl md:text-9xl">BKK</p><p className="label mt-1 text-white">Bangkok</p></div>
            </div>
            <p className="mt-8 max-w-xl text-lg text-white/80">
              {L("Win 2vs2 Breaking, Toprock or Footwork and you fly to the 6Kamenz Anniversary in Bangkok. Four dancers. Four seats.",
                 "Juara 2vs2 Breaking, Toprock atau Footwork terbang ke 6Kamenz Anniversary di Bangkok. Empat dancer. Empat kursi.")}
            </p>
          </div>
          <div className="hidden border-l-2 border-dashed border-white/30 md:block" aria-hidden />
          <dl className="grid grid-cols-2 border-t-2 border-dashed border-white/30 md:grid-cols-1 md:border-t-0">
            {[[L("Seats", "Kursi"), "04"], ["Gate", "6K"], [L("Class", "Kelas"), "Champ"], [L("Date", "Tgl"), "27.07"]].map(([k, v]) => (
              <div key={k} className="px-6 py-4 md:border-t md:border-white/15 md:first:border-t-0"><dt className="label text-white/60">{k}</dt><dd className="display mt-1 text-3xl">{v}</dd></div>
            ))}
          </dl>
        </div>
      </section>

      {/* ───── 7 TO SMOKE ───── */}
      <section className={`${section} grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16`}>
        <div>
          <SectionTag>7 to Smoke</SectionTag>
          <h2 className={h2}>{L("First to seven wins.", "Siapa dulu tujuh menang.")}</h2>
          <p className="mt-6 max-w-lg text-lg text-ink/75">
            {L("Four invited, four from prelims. Win the exchange and you stay on the floor. Lose and you go to the back of the line. Breaking and Openstyle. Cash for the King.",
               "Empat undangan, empat dari prelim. Menang exchange, tetap di lantai. Kalah, kembali ke antrean. Breaking dan Openstyle. Hadiah uang untuk sang King.")}
          </p>
        </div>
        <div>
          <div aria-hidden className="grid grid-cols-7 gap-1.5 md:gap-2">
            {Array.from({ length: 7 }, (_, i) => (
              <div key={i} className={`display grid aspect-square place-items-center rounded-lg text-3xl md:text-5xl ${i === 6 ? "bg-gold" : i < 4 ? "bg-ink text-kj" : "border border-ink/25 text-ink/35"}`}>{i + 1}</div>
            ))}
          </div>
          <p className="label mt-4 text-right text-ink/60">{L("Four wins in. The seventh takes the crown.", "Empat kemenangan. Yang ketujuh jadi King.")}</p>
        </div>
      </section>

      {/* ───── JUDGING ───── */}
      <section className={section}>
        <SectionTag>{L("How it's judged", "Cara penilaian")}</SectionTag>
        <dl className="mt-10 border-b border-ink/15">
          {criteria.map((c) => (
            <div key={c.k} className="grid items-baseline gap-2 border-t border-ink/15 py-6 md:grid-cols-[1fr_2fr] md:gap-10">
              <dt className="display text-6xl md:text-7xl">{c.k}</dt>
              <dd className="text-lg text-ink/75">{tx(c.d, lang)}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-8 max-w-2xl text-ink/60">
          {L("Prelims are scored digitally by each judge. From the Top 16 on, battles are called by hand-raise, the way it's always been.",
             "Prelim dinilai digital oleh tiap juri. Mulai Top 16, battle diputuskan dengan angkat tangan, seperti biasa.")}
        </p>
      </section>

      {/* ───── FEE ───── */}
      <section className={section}>
        <div className={`${card} grid gap-10 bg-kj md:grid-cols-2 md:items-end md:gap-20 md:p-14`}>
          <div>
            <p className="label">{L("One fee. Every category.", "Satu biaya. Semua kategori.")}</p>
            <p className="display mt-4 text-[clamp(4rem,15vw,10rem)]">{fee}</p>
            <p className="label mt-2">{EVENT.feeUsd} {L("by PayPal for international dancers", "via PayPal untuk dancer internasional")}</p>
          </div>
          <div>
            <dl className="border-b-2 border-ink">
              {[[L("Registration opens", "Pendaftaran dibuka"), "01.04.27"], [L("Registration closes", "Pendaftaran ditutup"), "10.07.27"], [L("Spectators", "Penonton"), tx(ui.free, lang)]].map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-4 border-t-2 border-ink py-3"><dt className="label">{k}</dt><dd className="display text-3xl">{v}</dd></div>
              ))}
            </dl>
            <Link href={href(lang, "/register")} className="btn btn-ink mt-8 w-full sm:w-auto">{L("Create your profile", "Buat profilmu")}</Link>
          </div>
        </div>
      </section>

      {/* ───── NEWS ───── */}
      <section className={section}>
        <SectionTag>{L("Latest", "Terbaru")}</SectionTag>
        <ul className="mt-8 border-b border-ink/15">
          {news.map((n) => (
            <li key={n.date} className="border-t border-ink/15 py-2">
              <Link href={href(lang, "/news")} className="group grid items-center gap-x-8 gap-y-2 rounded-2xl px-4 py-5 transition-colors hover:bg-ink hover:text-white md:grid-cols-[16rem_1fr_auto] md:px-6">
                <h3 className="display text-2xl md:text-3xl">{tx(n.title, lang)}</h3>
                <p className="max-w-xl text-sm opacity-70">{tx(n.body, lang)}</p>
                <span className="flex items-center gap-4"><time dateTime={n.date} className="label opacity-60">{n.date}</time><Arrow /></span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ───── SPONSORS ───── */}
      <section className={section}>
        <SectionTag>{L("Backed by", "Didukung oleh")}</SectionTag>
        <div className="mt-10 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: sponsorTiers.slice(0, 4).reduce((a, t) => a + t.count, 0) }, (_, i) => (
            <div key={i} className="label grid aspect-[3/2] place-items-center rounded-lg bg-paper-2 text-ink/40">Logo</div>
          ))}
        </div>
        <Link href={href(lang, "/sponsors")} className="btn btn-ghost mt-8">{L("Become a sponsor", "Jadi sponsor")}</Link>
      </section>
    </>
  );
}
