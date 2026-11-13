import { tx } from "@/lib/i18n";
import { getLang, pageMeta } from "@/lib/meta";
import { guestCountries, lineup } from "@/lib/content";
import { PageHeader, Photo, SectionTag } from "@/components/bits";

export const generateMetadata = ({ params }: PageProps<"/[lang]/2027/lineup">) =>
  pageMeta(params, "/2027/lineup", { en: "Lineup", id: "Lineup" }, { en: "Judges, MC, DJ, invited dancers and international guests.", id: "Juri, MC, DJ, dancer undangan dan tamu internasional." });

export default async function Lineup({ params }: PageProps<"/[lang]/2027/lineup">) {
  const lang = await getLang(params);
  const L = (en: string, id: string) => (lang === "en" ? en : id);
  return (
    <>
      <PageHeader kicker={L("Revealed monthly on @kalcerjam", "Diumumkan tiap bulan di @kalcerjam")} title="Lineup" />

      {lineup.map((g, gi) => (
        <section key={gi} className="mx-auto mt-24 md:mt-32 max-w-7xl px-4 md:px-8">
          <SectionTag>{tx(g.group, lang)}</SectionTag>
          <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
            {g.people.map((p, i) => (
              <figure key={i}>
                  <Photo alt={`${tx(g.group, lang)} ${i + 1}`} className="aspect-[3/4]" />
                <figcaption className="flex items-baseline justify-between gap-2 pt-3">
                  <span className="display text-3xl">{p}</span>
                  <span className="label text-ink/50">{L("Soon", "Segera")}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      ))}

      <section className="mx-auto mt-24 md:mt-32 max-w-7xl px-4 md:px-8">
        <SectionTag>{L("International guests", "Tamu internasional")}</SectionTag>
        <ul className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4 lg:grid-cols-7">
          {guestCountries.map(([code, name]) => (
            <li key={code} className="border-t-2 border-ink pt-3">
              <p className="display text-5xl">{code}</p>
              <p className="label mt-1 text-ink/60">{name}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
