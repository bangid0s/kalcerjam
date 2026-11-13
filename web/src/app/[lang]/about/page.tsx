import { tx } from "@/lib/i18n";
import { getLang, pageMeta } from "@/lib/meta";
import { crew, history } from "@/lib/content";
import { AnakKalcer, PageHeader, Photo, SectionTag } from "@/components/bits";

export const generateMetadata = ({ params }: PageProps<"/[lang]/about">) =>
  pageMeta(params, "/about", { en: "About", id: "Tentang" }, { en: "The story of Kalcer Jam, Anak Kalcer and the 6Kamenz partnership.", id: "Cerita Kalcer Jam, Anak Kalcer dan kemitraan 6Kamenz." });

export default async function About({ params }: PageProps<"/[lang]/about">) {
  const lang = await getLang(params);
  const L = (en: string, id: string) => (lang === "en" ? en : id);
  return (
    <>
      <PageHeader kicker={L("Roots, not just competition", "Akar, bukan sekadar kompetisi")} title={L("Our story", "Cerita kami")}>
        <p>{L("Kalcer Jam is the yearly homecoming for breaking in Semarang — the day the whole scene comes back to the circle.", "Kalcer Jam adalah pulang kampung tahunan breaking di Semarang — hari ketika seluruh skena kembali ke lingkaran.")}</p>
      </PageHeader>

      <section className="mx-auto mt-24 md:mt-32 grid max-w-7xl gap-12 px-4 md:px-8 lg:grid-cols-2">
        <div className="space-y-5 text-lg text-ink/85">
          <p className="display text-5xl text-ink md:text-6xl">Lebaran-nya breaking.</p>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante venenatis dapibus posuere velit aliquet. Vestibulum id ligula porta felis euismod semper.</p>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras mattis consectetur purus sit amet fermentum. Maecenas faucibus mollis interdum.</p>
        </div>
        <div className="relative">
          <div>
            <Photo alt={L("The circle, 2026", "Lingkaran, 2026")} credit="@bonaventurafajar" className="aspect-[4/3]" />
          </div>
        </div>
      </section>

      <section className="mx-auto mt-24 md:mt-32 max-w-7xl px-4 md:px-8">
        <SectionTag>Anak Kalcer</SectionTag>
        <AnakKalcer className="mt-10 w-40 md:w-52" />
        <div className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-3">
          {crew.map((name) => (
            <div key={name}>
              <Photo alt={name} className="aspect-square" />
              <p className="display pt-3 text-4xl">{name}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-24 md:mt-32 max-w-7xl px-4 md:px-8">
        <SectionTag>× 6Kamenz</SectionTag>
        <div className="mt-8 grid gap-8 md:grid-cols-[auto_1fr] md:items-center">
          <p className="display text-[clamp(4rem,14vw,9rem)] text-ink">6K</p>
          <p className="max-w-2xl text-lg text-ink/85">{L("Our partnership with 6Kamenz connects Semarang to Bangkok. Main Event winners fly to the 6Kamenz Anniversary. Lorem ipsum dolor sit amet, consectetur adipiscing elit.", "Kemitraan dengan 6Kamenz menghubungkan Semarang dan Bangkok. Pemenang Main Event terbang ke 6Kamenz Anniversary. Lorem ipsum dolor sit amet, consectetur adipiscing elit.")}</p>
        </div>
      </section>

      <section className="mx-auto mt-24 md:mt-32 max-w-7xl px-4 md:px-8">
        <SectionTag>{L("Timeline", "Linimasa")}</SectionTag>
        <ol className="mt-10 border-l-2 border-ink/20">
          {history.map((h) => (
            <li key={h.year} className="relative pb-12 pl-8 md:pl-12">
              <span className="absolute -left-[7px] top-1 h-3 w-3 bg-kj" aria-hidden />
              <p className="label text-ink">{h.year}</p>
              <h3 className="display mt-2 text-4xl md:text-5xl">{tx(h.title, lang)}</h3>
              <p className="mt-2 max-w-xl text-ink/75">{tx(h.body, lang)}</p>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
