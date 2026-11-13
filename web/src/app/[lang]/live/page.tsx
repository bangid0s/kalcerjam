import { getLang, pageMeta } from "@/lib/meta";
import { PageHeader, SectionTag } from "@/components/bits";
import { Bracket, SmokeBoard } from "@/components/live";

export const generateMetadata = ({ params }: PageProps<"/[lang]/live">) =>
  pageMeta(params, "/live", { en: "Live", id: "Live" }, { en: "Now on stage, brackets, 7 to Smoke board and results.", id: "Sedang tampil, bracket, papan 7 to Smoke dan hasil." });

export default async function Live({ params }: PageProps<"/[lang]/live">) {
  const lang = await getLang(params);
  const L = (en: string, id: string) => (lang === "en" ? en : id);
  const rounds = ["Top 16", "Top 8", "Semi", "Final"];
  return (
    <>
      <PageHeader kicker={L("Preview — goes live 26.07.2027", "Pratinjau — live 26.07.2027")} title="Live" />

      <section className="mx-auto mt-16 max-w-7xl px-4 md:px-8">
        <div className="grid gap-px overflow-hidden rounded-2xl bg-ink text-paper md:grid-cols-[1.6fr_1fr]">
          <div className="bg-ink p-6">
            <p className="label flex items-center gap-2 text-stamp"><span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-stamp" />{L("Now on stage", "Sedang tampil")} · Toprock · Top 8</p>
            <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <p className="display text-[clamp(2.2rem,7vw,4.5rem)]">Dancer 01</p>
              <p className="display text-2xl text-kj">vs</p>
              <p className="display text-right text-[clamp(2.2rem,7vw,4.5rem)]">Dancer 09</p>
            </div>
          </div>
          <div className="bg-ink-2 p-6">
            <p className="label text-paper/50">{L("Up next", "Berikutnya")}</p>
            <p className="display mt-3 text-3xl">Dancer 05 <span className="text-kj">vs</span> Dancer 04</p>
            <p className="display mt-1 text-xl text-paper/50">Dancer 03 vs Dancer 11</p>
          </div>
        </div>
        {/* Stream embed slot (YouTube / Instagram), PRD §7 */}
        <div className="relative mt-6 grid aspect-video place-items-center overflow-hidden rounded-2xl bg-ink-2">
          <p className="label relative text-paper/50">{L("Stream embed goes here", "Embed stream di sini")}</p>
        </div>
      </section>

      <section className="mx-auto mt-24 md:mt-32 max-w-7xl space-y-6 px-4 md:px-8">
        <SectionTag>Brackets</SectionTag>
        <Bracket title="Toprock" rounds={rounds} />
        <Bracket title="Footwork" rounds={rounds} />
      </section>

      <section className="mx-auto mt-24 md:mt-32 grid max-w-7xl gap-8 px-4 md:px-8 lg:grid-cols-2">
        <div className="lg:col-span-2"><SectionTag>7 to Smoke</SectionTag></div>
        <SmokeBoard title="Breaking" />
        <SmokeBoard title="Openstyle" points={[6, 4, 3, 1, 1, 0, 0, 0]} onFloor={[0, 2]} />
      </section>

      <p className="label mx-auto mt-10 max-w-7xl px-4 text-ink/50 md:px-8">{L("Sample data. Winners only — no scores or vote splits are ever shown here.", "Data contoh. Hanya pemenang — skor dan pembagian suara tidak ditampilkan.")}</p>
    </>
  );
}
