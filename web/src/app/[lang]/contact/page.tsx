import { getLang, pageMeta } from "@/lib/meta";
import { EVENT } from "@/lib/content";
import { PageHeader } from "@/components/bits";

export const generateMetadata = ({ params }: PageProps<"/[lang]/contact">) =>
  pageMeta(params, "/contact", { en: "Contact", id: "Kontak" }, { en: "Get in touch with the Kalcer Jam crew.", id: "Hubungi kru Kalcer Jam." });

export default async function Contact({ params }: PageProps<"/[lang]/contact">) {
  const lang = await getLang(params);
  const L = (en: string, id: string) => (lang === "en" ? en : id);
  return (
    <>
      <PageHeader kicker={L("Holla at us", "Sapa kami")} title={L("Contact", "Kontak")} />
      <section className="mx-auto mt-16 grid max-w-7xl gap-12 px-4 md:grid-cols-2 md:px-8">
        <a href={`mailto:${EVENT.email}`} className="border-t-2 border-ink pt-5 transition-colors hover:opacity-60">
          <p className="label opacity-60">Email</p>
          <p className="display mt-4 break-all text-[clamp(2rem,6vw,3.5rem)]">{EVENT.email}</p>
          <p className="label mt-6">{L("Write us", "Kirim email")}</p>
        </a>
        <a href={`https://instagram.com/${EVENT.instagram}`} target="_blank" rel="noreferrer" className="border-t-2 border-ink pt-5 transition-colors hover:opacity-60">
          <p className="label opacity-60">Instagram</p>
          <p className="display mt-4 text-[clamp(2.5rem,8vw,5rem)]">@{EVENT.instagram}</p>
          <p className="label mt-6">DM</p>
        </a>
      </section>
    </>
  );
}
