import { tx } from "@/lib/i18n";
import { getLang, pageMeta } from "@/lib/meta";
import { news } from "@/lib/content";
import { PageHeader, Photo } from "@/components/bits";

export const generateMetadata = ({ params }: PageProps<"/[lang]/news">) =>
  pageMeta(params, "/news", { en: "News", id: "Berita" }, { en: "Announcements, lineup reveals and sponsor news.", id: "Pengumuman, reveal lineup dan kabar sponsor." });

export default async function News({ params }: PageProps<"/[lang]/news">) {
  const lang = await getLang(params);
  const L = (en: string, id: string) => (lang === "en" ? en : id);
  const [lead, ...rest] = [...news].reverse();
  return (
    <>
      <PageHeader kicker={L("From the crew", "Dari kru")} title={L("News", "Berita")} />
      <section className="mx-auto mt-16 max-w-7xl px-4 md:px-8">
        <article className="grid gap-8 md:grid-cols-2 md:gap-12">
          <Photo alt={tx(lead.title, lang)} className="aspect-[4/3]" />
          <div className="self-center">
            <p className="label flex gap-3 text-ink"><span>{tx(lead.tag, lang)}</span><time dateTime={lead.date}>{lead.date}</time></p>
            <h2 className="display mt-3 text-5xl md:text-6xl">{tx(lead.title, lang)}</h2>
            <p className="mt-4 text-lg text-ink/80">{tx(lead.body, lang)}</p>
          </div>
        </article>
        <div className="mt-16 grid gap-10 md:grid-cols-2 md:gap-12">
          {rest.map((n) => (
            <article key={n.date} className="border-t-2 border-ink pt-5">
              <p className="label flex justify-between text-ink/60"><span className="text-ink">{tx(n.tag, lang)}</span><time dateTime={n.date}>{n.date}</time></p>
              <h2 className="display mt-3 text-4xl">{tx(n.title, lang)}</h2>
              <p className="mt-3 text-ink/70">{tx(n.body, lang)}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
