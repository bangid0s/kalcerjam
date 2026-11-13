import Link from "next/link";
import { href, tx } from "@/lib/i18n";
import { getLang, pageMeta } from "@/lib/meta";
import { categories, days, ui } from "@/lib/content";
import { PageHeader } from "@/components/bits";

export const generateMetadata = ({ params }: PageProps<"/[lang]/2027/categories">) =>
  pageMeta(params, "/2027/categories", { en: "Categories", id: "Kategori" }, { en: "Format, eligibility, prizes and slots for every Kalcer Jam 2027 category.", id: "Format, syarat, hadiah dan slot setiap kategori Kalcer Jam 2027." });

export default async function Categories({ params }: PageProps<"/[lang]/2027/categories">) {
  const lang = await getLang(params);
  const L = (en: string, id: string) => (lang === "en" ? en : id);
  const rows: [string, (c: (typeof categories)[number]) => string][] = [
    [L("Format", "Format"), (c) => tx(c.format, lang)],
    [L("Unit", "Unit"), (c) => tx(c.unit, lang)],
    [L("Who", "Siapa"), (c) => tx(c.eligibility, lang)],
    [L("Slots", "Slot"), (c) => tx(c.slots, lang)],
    [L("Prize", "Hadiah"), (c) => tx(c.prize, lang)],
  ];
  return (
    <>
      <PageHeader kicker={L("8 categories · 1 fee", "8 kategori · 1 biaya")} title={L("Categories", "Kategori")}>
        <p>{L("Enter as many as you're eligible for. One fee covers all of them.", "Ikut sebanyak yang kamu bisa. Satu biaya untuk semuanya.")}</p>
      </PageHeader>

      {days.map((d) => (
        <section key={d.n} className="mx-auto mt-24 md:mt-32 max-w-7xl px-4 md:px-8">
          <h2 className="display flex flex-col gap-3 text-5xl md:text-7xl">
            <span className="label normal-case text-ink">{L("Day", "Hari")} {d.n}, {d.date}</span>
            {tx(d.title, lang)}
          </h2>
          <div className="mt-10 grid gap-x-12 gap-y-14 md:grid-cols-2 xl:grid-cols-3">
            {categories.filter((c) => c.day === d.n).map((c) => (
              <article id={c.slug} key={c.slug} className="scroll-mt-28 border-t-2 border-ink pt-5">
                  <h3 className="display text-4xl">{c.name}</h3>
                <p className="mt-3 text-ink/75">{tx(c.blurb, lang)}</p>
                <dl className="mt-5">
                  {rows.map(([k, f]) => (
                    <div key={k} className="grid grid-cols-[5.5rem_1fr] gap-2 border-t border-ink/15 py-2.5 text-sm">
                      <dt className="label text-ink/50">{k}</dt>
                      <dd>{f(c)}</dd>
                    </div>
                  ))}
                </dl>
                <div className="flex gap-6 border-t border-ink/15 pt-4">
                  <Link href={href(lang, "/2027/rules")} className="label text-ink/75 hover:text-ink">{L("Rules", "Aturan")}</Link>
                  <Link href={href(lang, "/register")} className="label border-b-2 border-ink text-ink hover:opacity-60">{tx(ui.register, lang)}</Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
