import { tx } from "@/lib/i18n";
import { getLang, pageMeta } from "@/lib/meta";
import { getContent } from "@/lib/cms";
import { PageHeader } from "@/components/bits";

export const generateMetadata = ({ params }: PageProps<"/[lang]/contact">) => pageMeta(params, "/contact", "contact");

export default async function Contact({ params }: PageProps<"/[lang]/contact">) {
  const lang = await getLang(params);
  const { contact: k, settings: s } = await getContent();
  const x = (v: Parameters<typeof tx>[0]) => tx(v, lang);
  return (
    <>
      <PageHeader kicker={x(k.kicker)} title={x(k.title)} />
      <section className="mx-auto mt-16 grid max-w-7xl gap-12 px-4 md:grid-cols-2 md:px-8">
        <a href={`mailto:${s.email}`} className="border-t-2 border-ink pt-5 transition-colors hover:opacity-60">
          <p className="label opacity-60">{x(k.emailLabel)}</p>
          <p className="display mt-4 break-all text-[clamp(2rem,6vw,3.5rem)]">{s.email}</p>
          <p className="label mt-6">{x(k.emailCta)}</p>
        </a>
        <a href={`https://instagram.com/${s.instagram}`} target="_blank" rel="noreferrer" className="border-t-2 border-ink pt-5 transition-colors hover:opacity-60">
          <p className="label opacity-60">{x(k.instagramLabel)}</p>
          <p className="display mt-4 text-[clamp(2.5rem,8vw,5rem)]">@{s.instagram}</p>
          <p className="label mt-6">{x(k.instagramCta)}</p>
        </a>
      </section>
    </>
  );
}
