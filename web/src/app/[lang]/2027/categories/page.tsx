import Link from "next/link";
import { href, tx } from "@/lib/i18n";
import { getLang, pageMeta } from "@/lib/meta";
import { getContent } from "@/lib/cms";
import type { Category } from "@/lib/content";
import { PageHeader } from "@/components/bits";

export const generateMetadata = ({ params }: PageProps<"/[lang]/2027/categories">) => pageMeta(params, "/2027/categories", "categories");

export default async function Categories({ params }: PageProps<"/[lang]/2027/categories">) {
  const lang = await getLang(params);
  const c = await getContent();
  const p = c.categories;
  const x = (v: Parameters<typeof tx>[0]) => tx(v, lang);
  const rows: [string, (cat: Category) => string][] = [
    [x(p.labelFormat), (cat) => x(cat.format)],
    [x(p.labelUnit), (cat) => x(cat.unit)],
    [x(p.labelWho), (cat) => x(cat.eligibility)],
    [x(p.labelSlots), (cat) => x(cat.slots)],
    [x(p.labelPrize), (cat) => x(cat.prize)],
  ];
  return (
    <>
      <PageHeader kicker={x(p.kicker)} title={x(p.title)}>
        <p>{x(p.intro)}</p>
      </PageHeader>

      {c.event.days.map((d) => (
        <section key={d.n} className="mx-auto mt-24 max-w-7xl px-4 md:mt-32 md:px-8">
          <h2 className="display flex flex-col gap-3 text-5xl md:text-7xl">
            <span className="label normal-case text-ink">{x(c.ui.day)} {d.n}, {d.date}</span>
            {x(d.title)}
          </h2>
          <div className="mt-10 grid gap-x-12 gap-y-14 md:grid-cols-2 xl:grid-cols-3">
            {p.list.filter((cat) => cat.day === d.n).map((cat) => (
              <article id={cat.slug} key={cat.slug} className="scroll-mt-28 border-t-2 border-ink pt-5">
                <h3 className="display text-4xl">{cat.name}</h3>
                <p className="mt-3 text-ink/75">{x(cat.blurb)}</p>
                <dl className="mt-5">
                  {rows.map(([k, f]) => (
                    <div key={k} className="grid grid-cols-[5.5rem_1fr] gap-2 border-t border-ink/15 py-2.5 text-sm">
                      <dt className="label text-ink/50">{k}</dt>
                      <dd>{f(cat)}</dd>
                    </div>
                  ))}
                </dl>
                <div className="flex gap-6 border-t border-ink/15 pt-4">
                  <Link href={href(lang, "/2027/rules")} className="label text-ink/75 hover:text-ink">{x(p.labelRules)}</Link>
                  <Link href={href(lang, "/register")} className="label border-b-2 border-ink text-ink hover:opacity-60">{x(c.ui.register)}</Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
