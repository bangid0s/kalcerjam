import { tx } from "@/lib/i18n";
import { getLang, pageMeta } from "@/lib/meta";
import { getContent } from "@/lib/cms";
import { PageHeader, SponsorLogo } from "@/components/bits";

export const generateMetadata = ({ params }: PageProps<"/[lang]/sponsors">) => pageMeta(params, "/sponsors", "sponsors");

export default async function Sponsors({ params }: PageProps<"/[lang]/sponsors">) {
  const lang = await getLang(params);
  const c = await getContent();
  const p = c.sponsors;
  const x = (v: Parameters<typeof tx>[0]) => tx(v, lang);
  return (
    <>
      <PageHeader kicker={x(p.kicker)} title={x(p.title)} />
      <section className="mx-auto mt-16 max-w-7xl space-y-14 px-4 md:px-8">
        {p.tiers.map((t, i) => (
          <div key={i}>
            <h2 className="display border-b-2 border-ink pb-3 text-3xl md:text-4xl">{x(t.tier)}</h2>
            <div className={`mt-4 grid gap-px ${i === 0 ? "grid-cols-1" : i < 3 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"}`}>
              {t.logos.map((l, k) => (
                <SponsorLogo key={k} {...l} className={i === 0 ? "aspect-[5/1]" : "aspect-[3/2]"} />
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="mx-auto mt-24 max-w-7xl px-4 md:mt-32 md:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-kj p-8 text-ink md:p-12">
          <h2 className="display relative text-[clamp(3rem,9vw,6.5rem)]">{x(p.ctaTitle)}</h2>
          <p className="relative mt-4 max-w-xl text-lg">{x(p.ctaBody)}</p>
          <a href={`mailto:${c.settings.email}?subject=${encodeURIComponent(p.ctaEmailSubject)}`} className="btn btn-ink relative mt-8">{x(p.ctaButton)}</a>
        </div>
      </section>
    </>
  );
}
