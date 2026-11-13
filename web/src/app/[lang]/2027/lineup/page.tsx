import { tx } from "@/lib/i18n";
import { getLang, pageMeta } from "@/lib/meta";
import { getContent } from "@/lib/cms";
import { PageHeader, Photo, SectionTag } from "@/components/bits";

export const generateMetadata = ({ params }: PageProps<"/[lang]/2027/lineup">) => pageMeta(params, "/2027/lineup", "lineup");

export default async function Lineup({ params }: PageProps<"/[lang]/2027/lineup">) {
  const lang = await getLang(params);
  const l = (await getContent()).lineup;
  const x = (v: Parameters<typeof tx>[0]) => tx(v, lang);
  return (
    <>
      <PageHeader kicker={x(l.kicker)} title={x(l.title)} />

      {l.groups.map((g, gi) => (
        <section key={gi} className="mx-auto mt-24 max-w-7xl px-4 md:mt-32 md:px-8">
          <SectionTag>{x(g.group)}</SectionTag>
          <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
            {g.people.map((p, i) => (
              <figure key={i}>
                <Photo src={p.photo || undefined} alt={p.name !== "TBA" ? p.name : `${x(g.group)} ${i + 1}`} className="aspect-[3/4]" />
                <figcaption className="flex items-baseline justify-between gap-2 pt-3">
                  <span className="display text-3xl">{p.name}</span>
                  <span className="label text-ink/50">{x(p.note)}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      ))}

      <section className="mx-auto mt-24 max-w-7xl px-4 md:mt-32 md:px-8">
        <SectionTag>{x(l.guestsTag)}</SectionTag>
        <ul className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4 lg:grid-cols-7">
          {l.guests.map((g, i) => (
            <li key={i} className="border-t-2 border-ink pt-3">
              <p className="display text-5xl">{g.code}</p>
              <p className="label mt-1 text-ink/60">{g.name}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
