import { tx } from "@/lib/i18n";
import { getLang, pageMeta } from "@/lib/meta";
import { EVENT, sponsorTiers } from "@/lib/content";
import { PageHeader } from "@/components/bits";

export const generateMetadata = ({ params }: PageProps<"/[lang]/sponsors">) =>
  pageMeta(params, "/sponsors", { en: "Sponsors", id: "Sponsor" }, { en: "The brands and communities behind Kalcer Jam 2027.", id: "Brand dan komunitas di balik Kalcer Jam 2027." });

export default async function Sponsors({ params }: PageProps<"/[lang]/sponsors">) {
  const lang = await getLang(params);
  const L = (en: string, id: string) => (lang === "en" ? en : id);
  return (
    <>
      <PageHeader kicker={L("Backing the scene", "Mendukung skena")} title="Sponsors" />
      <section className="mx-auto mt-16 max-w-7xl space-y-14 px-4 md:px-8">
        {sponsorTiers.map((t, i) => (
          <div key={i}>
            <h2 className="display border-b-2 border-ink pb-3 text-3xl md:text-4xl">
              {tx(t.tier, lang)}
            </h2>
            <div className={`mt-4 grid gap-px ${i === 0 ? "grid-cols-1" : i < 3 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"}`}>
              {Array.from({ length: t.count }, (_, k) => (
                <div key={k} className={`label grid place-items-center bg-paper-2 text-ink/30 ${i === 0 ? "aspect-[5/1]" : "aspect-[3/2]"}`}>Logo</div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="mx-auto mt-24 md:mt-32 max-w-7xl px-4 md:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-kj p-8 text-ink md:p-12">
          <h2 className="display relative text-[clamp(3rem,9vw,6.5rem)]">{L("Put your name on the floor.", "Taruh namamu di lantai.")}</h2>
          <p className="relative mt-4 max-w-xl text-lg">{L("Logos on the big screen between every battle, on the site and on the merch. Let's talk.", "Logo di layar besar setiap jeda battle, di website dan di merch. Mari bicara.")}</p>
          <a href={`mailto:${EVENT.email}?subject=${encodeURIComponent("Sponsorship — Kalcer Jam 2027")}`} className="btn btn-ink relative mt-8">{L("Become a sponsor", "Jadi sponsor")}</a>
        </div>
      </section>
    </>
  );
}
