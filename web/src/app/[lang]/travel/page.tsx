import { tx } from "@/lib/i18n";
import { getLang, pageMeta } from "@/lib/meta";
import { getContent } from "@/lib/cms";
import { PageHeader } from "@/components/bits";

export const generateMetadata = ({ params }: PageProps<"/[lang]/travel">) => pageMeta(params, "/travel", "travel");

export default async function Travel({ params }: PageProps<"/[lang]/travel">) {
  const lang = await getLang(params);
  const t = (await getContent()).travel;
  const x = (v: Parameters<typeof tx>[0]) => tx(v, lang);
  return (
    <>
      <PageHeader kicker={x(t.kicker)} title={x(t.title)} />
      <section className="mx-auto mt-16 grid max-w-7xl gap-12 px-4 md:grid-cols-2 md:px-8">
        {t.blocks.map((b, i) => (
          <article key={i} className={`border-t-2 border-ink pt-5 ${i === 0 ? "md:col-span-2" : ""}`}>
            <h2 className="display text-4xl">{x(b.title)}</h2>
            <p className="mt-3 max-w-2xl whitespace-pre-line text-ink/75 md:text-lg">{x(b.body)}</p>
          </article>
        ))}
      </section>
    </>
  );
}
