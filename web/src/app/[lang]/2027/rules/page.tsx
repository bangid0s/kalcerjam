import { tx } from "@/lib/i18n";
import { getLang, pageMeta } from "@/lib/meta";
import { criteria } from "@/lib/content";
import { PageHeader, SectionTag } from "@/components/bits";

export const generateMetadata = ({ params }: PageProps<"/[lang]/2027/rules">) =>
  pageMeta(params, "/2027/rules", { en: "Rules", id: "Aturan" }, { en: "Battle rules, Mind / Body / Soul judging, code of conduct and the no-refund policy.", id: "Aturan battle, penilaian Mind / Body / Soul, kode etik dan kebijakan tanpa refund." });

export default async function Rules({ params }: PageProps<"/[lang]/2027/rules">) {
  const lang = await getLang(params);
  const L = (en: string, id: string) => (lang === "en" ? en : id);
  const battle = [
    L("Prelims: random pairs, 1 round per side. Every judge scores both sides.", "Prelim: pasangan acak, 1 ronde per sisi. Setiap juri menilai kedua sisi."),
    L("Top 16 seeded by prelim rank: 1 vs 16, 8 vs 9 and so on.", "Top 16 diurutkan dari peringkat prelim: 1 vs 16, 8 vs 9, dan seterusnya."),
    L("From Top 16 to the final, judges call it by hand-raise.", "Dari Top 16 sampai final, juri memutuskan dengan angkat tangan."),
    L("A split call can go to an extra round.", "Keputusan seri bisa lanjut ke extra round."),
    L("Not there when your battle is called? Walkover.", "Tidak hadir saat battle dipanggil? Walkover."),
    L("7 to Smoke: win the exchange, stay on. First to 7 points. If time runs out, most points wins.", "7 to Smoke: menang exchange, tetap di lantai. Pertama dapat 7 poin. Jika waktu habis, poin terbanyak menang."),
  ];
  const conduct = [
    L("Respect the circle, the judges, the DJ and each other.", "Hormati lingkaran, juri, DJ dan satu sama lain."),
    L("No intentional contact. Burns yes, violence no.", "Tidak ada kontak sengaja. Burn boleh, kekerasan tidak."),
    L("Lorem ipsum dolor sit amet, consectetur adipiscing elit.", "Lorem ipsum dolor sit amet, consectetur adipiscing elit."),
  ];
  return (
    <>
      <PageHeader kicker={L("Read before you register", "Baca sebelum mendaftar")} title={L("The rules", "Aturan")} />

      <section className="mx-auto mt-24 md:mt-32 max-w-7xl px-4 md:px-8">
        <SectionTag>{L("Judging criteria", "Kriteria penilaian")}</SectionTag>
        <div className="mt-10 grid gap-10 md:grid-cols-3 md:gap-12">
          {criteria.map((c) => (
            <div key={c.k} className="border-t-2 border-ink pt-5">
              <p className="display text-7xl md:text-8xl">{c.k}</p>
              <p className="mt-2 text-lg">{tx(c.d, lang)}</p>
              <p className="label mt-4 text-ink/50">{L("Scored 1 to 10", "Nilai 1 sampai 10")}</p>
            </div>
          ))}
        </div>
        <p className="mt-10 max-w-2xl text-ink/60">{L("Equal weight. 3 judges × 30 = max 90 per dancer in prelims.", "Bobot sama. 3 juri × 30 = maksimal 90 per dancer di prelim.")}</p>
      </section>

      <section className="mx-auto mt-24 md:mt-32 grid max-w-7xl gap-16 px-4 md:px-8 lg:grid-cols-2">
        <div>
          <SectionTag>{L("Battle rules", "Aturan battle")}</SectionTag>
          <ol className="mt-8 border-t border-ink/20">
            {battle.map((b, i) => (
              <li key={i} className="grid grid-cols-[3rem_1fr] items-baseline gap-3 border-b border-ink/20 py-4">
                <span className="display text-3xl text-ink">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-lg">{b}</span>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <SectionTag>{L("Code of conduct", "Kode etik")}</SectionTag>
          <ul className="mt-8 border-t border-ink/20">
            {conduct.map((b, i) => (
              <li key={i} className="border-b border-ink/20 py-4 text-lg">{b}</li>
            ))}
          </ul>
          <div className="paper mt-10 p-6 md:p-8">
            <p className="display text-5xl">{L("No refunds", "Tanpa refund")}</p>
            <p className="mt-4">{L("Can't make it? Transfer your spot to another dancer through a registration admin before 10 July 2027. Every transfer is logged.", "Tidak bisa hadir? Alihkan slotmu ke dancer lain lewat admin pendaftaran sebelum 10 Juli 2027. Setiap pengalihan dicatat.")}</p>
          </div>
        </div>
      </section>
    </>
  );
}
