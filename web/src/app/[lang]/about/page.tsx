import { tx } from "@/lib/i18n";
import { getLang, pageMeta } from "@/lib/meta";
import { getContent } from "@/lib/cms";
import { AnakKalcer, PageHeader, Photo, SectionTag } from "@/components/bits";

export const generateMetadata = ({ params }: PageProps<"/[lang]/about">) => pageMeta(params, "/about", "about");

export default async function About({ params }: PageProps<"/[lang]/about">) {
  const lang = await getLang(params);
  const a = (await getContent()).about;
  const x = (v: Parameters<typeof tx>[0]) => tx(v, lang);
  return (
    <>
      <PageHeader kicker={x(a.kicker)} title={x(a.title)}>
        <p>{x(a.intro)}</p>
      </PageHeader>

      <section className="mx-auto mt-24 grid max-w-7xl gap-12 px-4 md:mt-32 md:px-8 lg:grid-cols-2">
        <div className="space-y-5 text-lg text-ink/85">
          <p className="display text-5xl text-ink md:text-6xl">{x(a.tagline)}</p>
          {a.paragraphs.map((p, i) => <p key={i}>{x(p)}</p>)}
        </div>
        <div className="relative">
          <Photo src={a.photo || undefined} alt={x(a.photoAlt)} credit={a.photoCredit} className="aspect-[4/3]" />
        </div>
      </section>

      <section className="mx-auto mt-24 max-w-7xl px-4 md:mt-32 md:px-8">
        <SectionTag>{x(a.crewTag)}</SectionTag>
        <AnakKalcer className="mt-10 w-40 md:w-52" />
        <div className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-3">
          {a.crew.map((m, i) => (
            <div key={i}>
              <Photo src={m.photo || undefined} alt={m.name} className="aspect-square" />
              <p className="display pt-3 text-4xl">{m.name}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-24 max-w-7xl px-4 md:mt-32 md:px-8">
        <SectionTag>{x(a.partnerTag)}</SectionTag>
        <div className="mt-8 grid gap-8 md:grid-cols-[auto_1fr] md:items-center">
          <p className="display text-[clamp(4rem,14vw,9rem)] text-ink">{a.partnerMark}</p>
          <p className="max-w-2xl text-lg text-ink/85">{x(a.partnerBody)}</p>
        </div>
      </section>

      <section className="mx-auto mt-24 max-w-7xl px-4 md:mt-32 md:px-8">
        <SectionTag>{x(a.timelineTag)}</SectionTag>
        <ol className="mt-10 border-l-2 border-ink/20">
          {a.history.map((h, i) => (
            <li key={i} className="relative pb-12 pl-8 md:pl-12">
              <span className="absolute -left-[7px] top-1 h-3 w-3 bg-kj" aria-hidden />
              <p className="label text-ink">{h.year}</p>
              <h3 className="display mt-2 text-4xl md:text-5xl">{x(h.title)}</h3>
              <p className="mt-2 max-w-xl text-ink/75">{x(h.body)}</p>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
