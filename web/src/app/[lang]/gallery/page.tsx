import { tx } from "@/lib/i18n";
import { getLang, pageMeta } from "@/lib/meta";
import { getContent } from "@/lib/cms";
import { PageHeader, Photo } from "@/components/bits";

export const generateMetadata = ({ params }: PageProps<"/[lang]/gallery">) => pageMeta(params, "/gallery", "gallery");

// Photo "size" in /admin: normal, tall (2 rows) or wide (2 columns).
const span: Record<string, string> = { tall: "row-span-2", wide: "col-span-2" };

export default async function Gallery({ params }: PageProps<"/[lang]/gallery">) {
  const lang = await getLang(params);
  const g = (await getContent()).gallery;
  const x = (v: Parameters<typeof tx>[0]) => tx(v, lang);
  const years = g.years.filter((y) => y.photos.length);
  return (
    <>
      <PageHeader kicker={x(g.kicker)} title={x(g.title)}>
        <p>{x(g.shotBy)}</p>
      </PageHeader>
      {years.map((y) => (
        <section key={y.year} id={`y${y.year}`} className="mx-auto mt-12 max-w-7xl scroll-mt-28 px-4 md:px-8">
          <h2 className="display text-3xl">{y.year}</h2>
          <div className="mt-6 grid auto-rows-[9rem] grid-cols-2 gap-2 sm:auto-rows-[12rem] md:grid-cols-4">
            {y.photos.map((p, i) => (
              <Photo key={i} src={p.image || undefined} alt={p.alt} credit={p.credit} className={`${span[p.size] ?? ""} h-full`} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
