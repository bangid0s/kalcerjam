import { tx } from "@/lib/i18n";
import { getLang, pageMeta } from "@/lib/meta";
import { getContent } from "@/lib/cms";
import { PageHeader, SectionTag } from "@/components/bits";
import { Bracket, SmokeBoard } from "@/components/live";

export const generateMetadata = ({ params }: PageProps<"/[lang]/live">) => pageMeta(params, "/live", "live");

export default async function Live({ params }: PageProps<"/[lang]/live">) {
  const lang = await getLang(params);
  const l = (await getContent()).live;
  const x = (v: Parameters<typeof tx>[0]) => tx(v, lang);
  return (
    <>
      <PageHeader kicker={x(l.kicker)} title={x(l.title)} />

      <section className="mx-auto mt-16 max-w-7xl px-4 md:px-8">
        <div className="grid gap-px overflow-hidden rounded-2xl bg-ink text-paper md:grid-cols-[1.6fr_1fr]">
          <div className="bg-ink p-6">
            <p className="label flex items-center gap-2 text-stamp"><span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-stamp" />{x(l.nowLabel)} · {l.nowRound}</p>
            <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <p className="display text-[clamp(2.2rem,7vw,4.5rem)]">{l.nowA}</p>
              <p className="display text-2xl text-kj">vs</p>
              <p className="display text-right text-[clamp(2.2rem,7vw,4.5rem)]">{l.nowB}</p>
            </div>
          </div>
          <div className="bg-ink-2 p-6">
            <p className="label text-paper/50">{x(l.nextLabel)}</p>
            {l.next.map((m, i) => (
              <p key={i} className={i === 0 ? "display mt-3 text-3xl" : "display mt-1 text-xl text-paper/50"}>
                {m.a} <span className={i === 0 ? "text-kj" : ""}>vs</span> {m.b}
              </p>
            ))}
          </div>
        </div>
        {l.streamUrl ? (
          <iframe src={l.streamUrl} title="Live stream" className="mt-6 aspect-video w-full rounded-2xl border-0 bg-ink-2" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
        ) : (
          <div className="relative mt-6 grid aspect-video place-items-center overflow-hidden rounded-2xl bg-ink-2">
            <p className="label relative text-paper/50">{x(l.streamPlaceholder)}</p>
          </div>
        )}
      </section>

      <section className="mx-auto mt-24 max-w-7xl space-y-6 px-4 md:mt-32 md:px-8">
        <SectionTag>{x(l.bracketsTag)}</SectionTag>
        {l.bracketTitles.map((t) => <Bracket key={t} title={t} rounds={l.rounds} />)}
      </section>

      <section className="mx-auto mt-24 grid max-w-7xl gap-8 px-4 md:mt-32 md:px-8 lg:grid-cols-2">
        <div className="lg:col-span-2"><SectionTag>{x(l.smokeTag)}</SectionTag></div>
        {l.smokeTitles.map((t, i) => (
          <SmokeBoard key={t} title={t} {...(i % 2 ? { points: [6, 4, 3, 1, 1, 0, 0, 0], onFloor: [0, 2] } : {})} />
        ))}
      </section>

      <p className="label mx-auto mt-10 max-w-7xl px-4 text-ink/50 md:px-8">{x(l.footnote)}</p>
    </>
  );
}
