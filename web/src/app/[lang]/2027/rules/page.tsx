import { tx } from "@/lib/i18n";
import { getLang, pageMeta } from "@/lib/meta";
import { getContent } from "@/lib/cms";
import { PageHeader, SectionTag } from "@/components/bits";

export const generateMetadata = ({ params }: PageProps<"/[lang]/2027/rules">) => pageMeta(params, "/2027/rules", "rules");

export default async function Rules({ params }: PageProps<"/[lang]/2027/rules">) {
  const lang = await getLang(params);
  const r = (await getContent()).rules;
  const x = (v: Parameters<typeof tx>[0]) => tx(v, lang);
  return (
    <>
      <PageHeader kicker={x(r.kicker)} title={x(r.title)} />

      <section className="mx-auto mt-24 grid max-w-7xl gap-16 px-4 md:mt-32 md:px-8 lg:grid-cols-2">
        <div>
          <SectionTag>{x(r.battleTag)}</SectionTag>
          <ol className="mt-8 border-t border-ink/20">
            {r.battle.map((b, i) => (
              <li key={i} className="grid grid-cols-[3rem_1fr] items-baseline gap-3 border-b border-ink/20 py-4">
                <span className="display text-3xl text-ink">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-lg">{x(b)}</span>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <SectionTag>{x(r.conductTag)}</SectionTag>
          <ul className="mt-8 border-t border-ink/20">
            {r.conduct.map((b, i) => (
              <li key={i} className="border-b border-ink/20 py-4 text-lg">{x(b)}</li>
            ))}
          </ul>
          <div className="paper mt-10 p-6 md:p-8">
            <p className="display text-5xl">{x(r.refundTitle)}</p>
            <p className="mt-4">{x(r.refundBody)}</p>
          </div>
        </div>
      </section>
    </>
  );
}
