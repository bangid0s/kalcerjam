import { getLang, pageMeta } from "@/lib/meta";
import { EVENT } from "@/lib/content";
import { PageHeader, SectionTag } from "@/components/bits";
import { RsvpForm } from "@/components/client";

export const generateMetadata = ({ params }: PageProps<"/[lang]/register">) =>
  pageMeta(params, "/register", { en: "Register", id: "Daftar" }, { en: "Dancer registration opens 1 April 2027. Spectators RSVP free.", id: "Pendaftaran dancer dibuka 1 April 2027. Penonton RSVP gratis." });

export default async function Register({ params }: PageProps<"/[lang]/register">) {
  const lang = await getLang(params);
  const L = (en: string, id: string) => (lang === "en" ? en : id);
  const steps = [
    [L("Sign up", "Daftar akun"), L("Google or an email link. No passwords.", "Google atau link email. Tanpa password.")],
    [L("Build your profile", "Isi profil"), L("Once. Reused every year. You get a dancer ID like KJ-0042.", "Sekali saja. Dipakai tiap tahun. Kamu dapat ID dancer seperti KJ-0042.")],
    [L("Pick categories", "Pilih kategori"), L("Only the ones you're eligible for show up.", "Hanya kategori yang sesuai yang muncul.")],
    [L("2vs2? Invite your partner", "2vs2? Undang partner"), L("They accept from their own account.", "Partner menerima dari akunnya sendiri.")],
    [L("Pay once", "Bayar sekali"), L(`QRIS, e-wallet, virtual account or transfer — ${EVENT.feeIdr}. International: ${EVENT.feeUsd} via PayPal.`, `QRIS, e-wallet, virtual account atau transfer — ${EVENT.feeIdr}. Internasional: ${EVENT.feeUsd} via PayPal.`)],
    [L("Get your QR pass", "Dapat QR pass"), L("Show it at the door.", "Tunjukkan di pintu masuk.")],
  ];
  return (
    <>
      <PageHeader kicker={L("Dancers & spectators", "Dancer & penonton")} title={L("Get in", "Gabung")}>
        <p>{L("Registration runs 1 April — 10 July 2027.", "Pendaftaran 1 April — 10 Juli 2027.")}</p>
      </PageHeader>

      <section className="mx-auto mt-24 md:mt-32 grid max-w-7xl gap-12 px-4 md:px-8 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <SectionTag>{L("Dancers", "Dancer")}</SectionTag>
          <ol className="mt-8 border-t border-ink/20">
            {steps.map(([t, d], i) => (
              <li key={i} className="grid grid-cols-[3rem_1fr] items-baseline gap-3 border-b border-ink/20 py-5">
                <span className="display text-3xl text-ink">{i + 1}</span>
                <span><span className="display block text-2xl md:text-3xl">{t}</span><span className="text-ink/70">{d}</span></span>
              </li>
            ))}
          </ol>
        </div>

        <div className="self-start">
          <div className="paper p-6 md:p-10">
            <p className="label">{L("Status", "Status")}</p>
            <p className="display mt-2 text-5xl md:text-6xl">{L("Opens", "Dibuka")}<br />01.04.2027</p>
            <p className="mt-4 text-ink/70">{L("Sign-up and profiles go live soon, so you can get ready before registration opens.", "Akun dan profil segera aktif, jadi kamu bisa bersiap sebelum pendaftaran dibuka.")}</p>
            <button disabled className="btn btn-ink mt-8 w-full cursor-not-allowed opacity-50">{L("Create profile — soon", "Buat profil — segera")}</button>
            <p className="label mt-4 text-ink/60">{EVENT.feeIdr.replace(".000", "K")}. {L("One fee covers every category", "Satu biaya untuk semua kategori")}</p>
          </div>
        </div>
      </section>

      <section id="rsvp" className="mx-auto mt-24 md:mt-32 max-w-7xl scroll-mt-24 px-4 md:px-8">
        <SectionTag>{L("Spectators", "Penonton")}</SectionTag>
        <div className="mt-10 grid gap-10 rounded-2xl bg-kj p-6 text-ink md:grid-cols-[1fr_1.4fr] md:gap-16 md:p-12">
          <div>
            <h2 className="display text-[clamp(3rem,9vw,6rem)]">{L("Watch free.", "Nonton gratis.")}</h2>
            <p className="mt-4 text-lg">{L("Entry costs nothing. RSVP so we know how many of you are coming, and get a QR pass by email.", "Masuk gratis. RSVP supaya kami tahu berapa yang datang, dan dapatkan QR pass lewat email.")}</p>
          </div>
          <RsvpForm lang={lang} />
        </div>
      </section>
    </>
  );
}
