import { tx } from "@/lib/i18n";
import { getLang, pageMeta } from "@/lib/meta";
import { getContent } from "@/lib/cms";
import { PageHeader, Photo } from "@/components/bits";

export const generateMetadata = ({ params }: PageProps<"/[lang]/news">) => pageMeta(params, "/news", "news");

export default async function News({ params }: PageProps<"/[lang]/news">) {
  const lang = await getLang(params);
  const n = (await getContent()).news;
  const x = (v: Parameters<typeof tx>[0]) => tx(v, lang);
  const [lead, ...rest] = n.posts; // newest first, as ordered in /admin
  return (
    <>
      <PageHeader kicker={x(n.kicker)} title={x(n.title)} />
      {lead && (
        <section className="mx-auto mt-16 max-w-7xl px-4 md:px-8">
          <article className="grid gap-8 md:grid-cols-2 md:gap-12">
            <Photo src={lead.image || undefined} alt={x(lead.title)} className="aspect-[4/3]" />
            <div className="self-center">
              <p className="label flex gap-3 text-ink"><span>{x(lead.tag)}</span><time dateTime={lead.date}>{lead.date}</time></p>
              <h2 className="display mt-3 text-5xl md:text-6xl">{x(lead.title)}</h2>
              <p className="mt-4 whitespace-pre-line text-lg text-ink/80">{x(lead.body)}</p>
            </div>
          </article>
          <div className="mt-16 grid gap-10 md:grid-cols-2 md:gap-12">
            {rest.map((p, i) => (
              <article key={i} className="border-t-2 border-ink pt-5">
                <p className="label flex justify-between text-ink/60"><span className="text-ink">{x(p.tag)}</span><time dateTime={p.date}>{p.date}</time></p>
                <h2 className="display mt-3 text-4xl">{x(p.title)}</h2>
                <p className="mt-3 whitespace-pre-line text-ink/70">{x(p.body)}</p>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
