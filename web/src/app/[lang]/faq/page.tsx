import { tx } from "@/lib/i18n";
import { getLang, pageMeta } from "@/lib/meta";
import { getContent } from "@/lib/cms";
import { PageHeader } from "@/components/bits";
import { FaqSearch } from "@/components/client";

export const generateMetadata = ({ params }: PageProps<"/[lang]/faq">) => pageMeta(params, "/faq", "faq");

export default async function Faq({ params }: PageProps<"/[lang]/faq">) {
  const lang = await getLang(params);
  const f = (await getContent()).faq;
  return (
    <>
      <PageHeader kicker={tx(f.kicker, lang)} title={tx(f.title, lang)} />
      <section className="mx-auto mt-16 max-w-4xl px-4 md:px-8">
        <FaqSearch lang={lang} groups={f.groups} placeholder={tx(f.searchPlaceholder, lang)} empty={tx(f.empty, lang)} />
      </section>
    </>
  );
}
