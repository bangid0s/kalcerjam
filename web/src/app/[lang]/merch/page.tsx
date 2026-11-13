import { tx } from "@/lib/i18n";
import { getLang, pageMeta } from "@/lib/meta";
import { getContent } from "@/lib/cms";
import { PageHeader, Photo } from "@/components/bits";

export const generateMetadata = ({ params }: PageProps<"/[lang]/merch">) => pageMeta(params, "/merch", "merch");

export default async function Merch({ params }: PageProps<"/[lang]/merch">) {
  const lang = await getLang(params);
  const m = (await getContent()).merch;
  const x = (v: Parameters<typeof tx>[0]) => tx(v, lang);
  return (
    <>
      <PageHeader kicker={x(m.kicker)} title={x(m.title)}>
        <p>{x(m.intro)}</p>
      </PageHeader>
      <section className="mx-auto mt-16 grid max-w-7xl grid-cols-2 gap-x-6 gap-y-10 px-4 md:grid-cols-4 md:px-8">
        {m.items.map((it, i) => {
          const body = (
            <>
              <Photo src={it.image || undefined} alt={it.name} className="aspect-square" />
              <div className="flex items-baseline justify-between pt-3">
                <h2 className="display text-3xl">{it.name}</h2>
                <span className="label">{it.price}</span>
              </div>
              {x(it.badge) && <span className="label absolute left-2 top-2 bg-kj px-2 py-1 text-ink">{x(it.badge)}</span>}
            </>
          );
          return it.url ? (
            <a key={i} href={it.url} target="_blank" rel="noreferrer" className="relative block hover:opacity-80">{body}</a>
          ) : (
            <article key={i} className="relative">{body}</article>
          );
        })}
      </section>
    </>
  );
}
