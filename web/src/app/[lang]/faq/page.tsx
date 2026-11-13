import { getLang, pageMeta } from "@/lib/meta";
import { faq } from "@/lib/content";
import { PageHeader } from "@/components/bits";
import { FaqSearch } from "@/components/client";

export const generateMetadata = ({ params }: PageProps<"/[lang]/faq">) =>
  pageMeta(params, "/faq", { en: "FAQ", id: "FAQ" }, { en: "Registration, fees, judging and spectator questions answered.", id: "Jawaban soal pendaftaran, biaya, penjurian dan penonton." });

export default async function Faq({ params }: PageProps<"/[lang]/faq">) {
  const lang = await getLang(params);
  const L = (en: string, id: string) => (lang === "en" ? en : id);
  return (
    <>
      <PageHeader kicker={L("Ask before you battle", "Tanya sebelum battle")} title="FAQ" />
      <section className="mx-auto mt-16 max-w-4xl px-4 md:px-8">
        <FaqSearch lang={lang} groups={faq} placeholder={L("Search questions…", "Cari pertanyaan…")} empty={L("Nothing found. DM us @kalcerjam.", "Tidak ketemu. DM kami @kalcerjam.")} />
      </section>
    </>
  );
}
