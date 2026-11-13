import { getLang, pageMeta } from "@/lib/meta";
import { PageHeader } from "@/components/bits";

export const generateMetadata = ({ params }: PageProps<"/[lang]/travel">) =>
  pageMeta(params, "/travel", { en: "Travel guide", id: "Panduan perjalanan" }, { en: "Getting to Semarang, where to stay, local transport and visa notes.", id: "Menuju Semarang, penginapan, transportasi lokal dan info visa." });

export default async function Travel({ params }: PageProps<"/[lang]/travel">) {
  const lang = await getLang(params);
  const L = (en: string, id: string) => (lang === "en" ? en : id);
  const blocks = [
    ["✈", L("By air", "Pesawat"), L("Jenderal Ahmad Yani International Airport (SRG). Lorem ipsum dolor sit amet, consectetur adipiscing elit.", "Bandara Internasional Jenderal Ahmad Yani (SRG). Lorem ipsum dolor sit amet, consectetur adipiscing elit.")],
    ["🚆", L("By train", "Kereta"), L("Semarang Tawang and Semarang Poncol stations. Lorem ipsum dolor sit amet.", "Stasiun Semarang Tawang dan Semarang Poncol. Lorem ipsum dolor sit amet.")],
    ["🛏", L("Where to stay", "Penginapan"), L("Recommended stays near the venue — list coming once the venue is set.", "Rekomendasi penginapan dekat venue — menyusul setelah venue ditetapkan.")],
    ["🛵", L("Getting around", "Transportasi lokal"), L("Ride-hailing apps work across the city. Lorem ipsum dolor sit amet.", "Ojek online tersedia di seluruh kota. Lorem ipsum dolor sit amet.")],
    ["🛂", L("Visa note", "Info visa"), L("International dancers: check Indonesia's visa rules for your passport before booking. Lorem ipsum.", "Dancer internasional: cek aturan visa Indonesia untuk paspormu sebelum memesan. Lorem ipsum.")],
  ];
  return (
    <>
      <PageHeader kicker="Semarang, Jawa Tengah" title={L("Get here", "Ke sini")} />
      <section className="mx-auto mt-16 grid max-w-7xl gap-12 px-4 md:grid-cols-2 md:px-8">
        {blocks.map(([, t, d], i) => (
          <article key={t} className={`border-t-2 border-ink pt-5 ${i === 0 ? "md:col-span-2" : ""}`}>
            <div>
              <h2 className="display text-4xl">{t}</h2>
              <p className="mt-3 max-w-2xl text-ink/75 md:text-lg">{d}</p>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
