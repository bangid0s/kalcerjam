import Link from "next/link";
import { tx } from "@/lib/i18n";
import { getLang, pageMeta } from "@/lib/meta";
import { getContent } from "@/lib/cms";
import { PageHeader, SectionTag } from "@/components/bits";
import { RsvpForm } from "@/components/client";

export const generateMetadata = ({ params }: PageProps<"/[lang]/register">) => pageMeta(params, "/register", "register");

export default async function Register({ params }: PageProps<"/[lang]/register">) {
  const lang = await getLang(params);
  const { register: r, settings: s } = await getContent();
  const x = (v: Parameters<typeof tx>[0]) => tx(v, lang);
  return (
    <>
      <PageHeader kicker={x(r.kicker)} title={x(r.title)}>
        <p>{x(r.intro)}</p>
      </PageHeader>

      <section className="mx-auto mt-24 grid max-w-7xl gap-12 px-4 md:mt-32 md:px-8 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <SectionTag>{x(r.dancersTag)}</SectionTag>
          <ol className="mt-8 border-t border-ink/20">
            {r.steps.map((st, i) => (
              <li key={i} className="grid grid-cols-[3rem_1fr] items-baseline gap-3 border-b border-ink/20 py-5">
                <span className="display text-3xl text-ink">{i + 1}</span>
                <span><span className="display block text-2xl md:text-3xl">{x(st.title)}</span><span className="text-ink/70">{x(st.body)}</span></span>
              </li>
            ))}
          </ol>
        </div>

        <div className="self-start">
          <div className="paper p-6 md:p-10">
            <p className="label">{x(r.statusLabel)}</p>
            <p className="display mt-2 text-5xl md:text-6xl">{x(r.statusTitle)}</p>
            <p className="mt-4 text-ink/70">{x(r.statusBody)}</p>
            {r.statusButtonUrl ? (
              <Link href={r.statusButtonUrl} className="btn btn-ink mt-8 w-full">{x(r.statusButton)}</Link>
            ) : (
              <button disabled className="btn btn-ink mt-8 w-full cursor-not-allowed opacity-50">{x(r.statusButton)}</button>
            )}
            <p className="label mt-4 text-ink/60">{x(r.statusNote)}</p>
          </div>
        </div>
      </section>

      <section id="rsvp" className="mx-auto mt-24 max-w-7xl scroll-mt-24 px-4 md:mt-32 md:px-8">
        <SectionTag>{x(r.spectatorsTag)}</SectionTag>
        <div className="mt-10 grid gap-10 rounded-2xl bg-kj p-6 text-ink md:grid-cols-[1fr_1.4fr] md:gap-16 md:p-12">
          <div>
            <h2 className="display text-[clamp(3rem,9vw,6rem)]">{x(r.rsvpTitle)}</h2>
            <p className="mt-4 text-lg">{x(r.rsvpBody)}</p>
          </div>
          <RsvpForm lang={lang} open={s.rsvpOpen} copy={r.form} />
        </div>
      </section>
    </>
  );
}
