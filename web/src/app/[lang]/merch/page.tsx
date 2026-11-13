import { getLang, pageMeta } from "@/lib/meta";
import { PageHeader, Photo } from "@/components/bits";

export const generateMetadata = ({ params }: PageProps<"/[lang]/merch">) =>
  pageMeta(params, "/merch", { en: "Merch", id: "Merch" }, { en: "Official Kalcer Jam tees, hoodies and accessories by pre-order.", id: "Kaos, hoodie dan aksesori resmi Kalcer Jam lewat pre-order." });

export default async function Merch({ params }: PageProps<"/[lang]/merch">) {
  const lang = await getLang(params);
  const L = (en: string, id: string) => (lang === "en" ? en : id);
  const items = [["Tee", "Rp—"], ["Hoodie", "Rp—"], ["Cap", "Rp—"], ["Tote", "Rp—"]];
  return (
    <>
      <PageHeader kicker={L("Pre-order · dates TBA", "Pre-order · tanggal menyusul")} title="Merch">
        <p>{L("Event-exclusive designs are only sold at the venue.", "Desain eksklusif event hanya dijual di venue.")}</p>
      </PageHeader>
      <section className="mx-auto mt-16 grid max-w-7xl grid-cols-2 gap-x-6 gap-y-10 px-4 md:grid-cols-4 md:px-8">
        {items.map(([n, p], i) => (
          <article key={n} className="relative">
            <Photo alt={n} className="aspect-square" />
            <div className="flex items-baseline justify-between pt-3">
              <h2 className="display text-3xl">{n}</h2>
              <span className="label">{p}</span>
            </div>
            {i === 0 && <span className="label absolute left-2 top-2 bg-kj px-2 py-1 text-ink">{L("Soon", "Segera")}</span>}
          </article>
        ))}
      </section>
    </>
  );
}
