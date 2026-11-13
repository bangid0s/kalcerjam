import { getLang, pageMeta } from "@/lib/meta";
import { photographers } from "@/lib/content";
import { PageHeader, Photo } from "@/components/bits";

export const generateMetadata = ({ params }: PageProps<"/[lang]/gallery">) =>
  pageMeta(params, "/gallery", { en: "Gallery", id: "Galeri" }, { en: "Photos and videos from every Kalcer Jam.", id: "Foto dan video dari setiap Kalcer Jam." });

// Masonry-ish spans; swap Photo src for real shots from the Drive "Photos" folder.
const spans = ["row-span-2", "", "", "col-span-2", "row-span-2", "", "", "", "col-span-2", ""];

export default async function Gallery({ params }: PageProps<"/[lang]/gallery">) {
  const lang = await getLang(params);
  const L = (en: string, id: string) => (lang === "en" ? en : id);
  return (
    <>
      <PageHeader kicker={L("2025 · 2026 · 2027", "2025 · 2026 · 2027")} title={L("Gallery", "Galeri")}>
        <p>{L("Shot by", "Difoto oleh")} {photographers.join(" & ")}</p>
      </PageHeader>
      <div className="mx-auto mt-12 flex max-w-7xl flex-wrap gap-6 px-4 md:px-8">
        {["2026", "2025"].map((y, i) => (
          <span key={y} className={`display text-3xl ${i === 0 ? "text-ink" : "text-ink/40"}`}>{y}</span>
        ))}
      </div>
      <section className="mx-auto mt-6 grid max-w-7xl auto-rows-[9rem] grid-cols-2 gap-2 px-4 sm:auto-rows-[12rem] md:grid-cols-4 md:px-8">
        {spans.map((s, i) => (
          <Photo key={i} alt={`Kalcer Jam 2026 #${i + 1}`} credit={photographers[i % 2]} className={`${s} h-full`} />
        ))}
      </section>
    </>
  );
}
