"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { tx, type Lang } from "@/lib/i18n";
import { ageOn, ineligible, roundLabel } from "@/lib/tournament";
import { errMsg, loadBoard, must, sb, useLive, BOARD_TABLES, entryName, type Category, type Entry, type Payment, type Profile, type ScoreRow } from "./data";
import { tr, type Key } from "./i18n";
import type { Site } from "./MeApp";
import { Btn, Card, Notice, Pill, Qr, useAction } from "./ui";

type Mine = { cats: Category[]; entries: Entry[]; payment: Payment | null; names: Map<string, { code: string; stage_name: string }>; scores: ScoreRow[] };
type Step = "profile" | "categories" | "payment" | "home";

const EVENT_DAY = "2027-07-26";
const big = "w-full rounded-2xl border-2 border-ink/15 bg-white px-4 py-3.5 text-base text-ink placeholder:text-ink/35 focus:border-ink focus:outline-none";

export function Dancer({ profile, reloadProfile, site, lang, onSpectator }: { profile: Profile; reloadProfile: () => Promise<void>; site: Site; lang: Lang; onSpectator: () => void }) {
  const t = tr(lang);
  const [mine, setMine] = useState<Mine | null>(null);
  const [err, setErr] = useState("");
  const [step, setStep] = useState<Step | null>(null);

  const load = useCallback(async () => {
    try {
      const [cats, entries, pay] = await Promise.all([
        must(sb().from("kj_categories").select("*").order("sort")),
        must(sb().from("kj_entries").select("*").or(`dancer_id.eq.${profile.id},partner_id.eq.${profile.id}`)),
        must(sb().from("kj_payments").select("*").eq("dancer_id", profile.id)),
      ]);
      const es = entries as Entry[];
      const ids = [...new Set(es.flatMap((e) => [e.dancer_id, e.partner_id]).filter((x): x is string => !!x && x !== profile.id))];
      const people = ids.length ? ((await must(sb().from("kj_people").select("id,code,stage_name").in("id", ids))) as { id: string; code: string; stage_name: string }[]) : [];
      const scores = es.length ? ((await must(sb().from("kj_scores").select("*").in("entry_id", es.map((e) => e.id)))) as ScoreRow[]) : [];
      setMine({ cats: cats as Category[], entries: es, payment: (pay as Payment[])[0] ?? null, names: new Map(people.map((p) => [p.id, p])), scores });
    } catch (e) {
      setErr(errMsg(e));
    }
  }, [profile.id]);
  useEffect(() => { const f = setTimeout(load, 0); return () => clearTimeout(f); }, [load]);

  if (err) return <Notice kind="err">{err}</Notice>;
  if (!mine) return <p className="py-20 text-center">{t("loading")}</p>;

  const myEntries = mine.entries.filter((e) => e.status === "active" && (e.dancer_id === profile.id || e.partner_status === "accepted"));
  const invites = mine.entries.filter((e) => e.partner_id === profile.id && e.partner_status === "pending");
  const profileDone = !!(profile.stage_name && profile.name && profile.birth_date && profile.gender);
  const pay = mine.payment?.status;
  const auto: Step = !profileDone ? "profile" : !myEntries.length ? "categories" : !pay || pay === "rejected" ? "payment" : "home";
  const cur = step ?? auto;
  const go = (s: Step) => { setStep(s); window.scrollTo(0, 0); };

  const steps: [Step, Key, boolean][] = [["profile", "stepProfile", profileDone], ["categories", "stepCategories", myEntries.length > 0], ["payment", "stepPayment", pay === "paid" || pay === "pending"], ["home", "stepPass", pay === "paid"]];

  return (
    <div className="mx-auto max-w-xl pb-28">
      <ol className="mb-5 grid grid-cols-4 gap-1.5">
        {steps.map(([k, label, done], i) => (
          <li key={k}>
            <button onClick={() => go(k)} className="w-full text-left">
              <span className={`block h-2 rounded-full ${cur === k ? "bg-ink" : done ? "bg-kj" : "bg-ink/10"}`} />
              <span className={`mt-1 block text-xs font-bold ${cur === k ? "text-ink" : "text-ink/45"}`}>{i + 1}. {t(label)}{done ? " ✓" : ""}</span>
            </button>
          </li>
        ))}
      </ol>

      {invites.length > 0 && <div className="mb-4"><Invites invites={invites} mine={mine} reload={load} lang={lang} /></div>}

      {cur === "profile" && <ProfileStep profile={profile} lang={lang} onDone={async () => { await reloadProfile(); go(myEntries.length ? (pay ? "home" : "payment") : "categories"); }} />}
      {cur === "categories" && <CategoriesStep profile={profile} mine={mine} site={site} reload={load} lang={lang} onBack={() => go("profile")} onNext={() => go(pay && pay !== "rejected" ? "home" : "payment")} canNext={myEntries.length > 0} />}
      {cur === "payment" && <PaymentStep profile={profile} mine={mine} site={site} reload={load} lang={lang} onBack={() => go("categories")} onDone={() => go("home")} hasEntries={myEntries.length > 0} />}
      {cur === "home" && (
        <div className="space-y-4">
          <PassCard profile={profile} paid={pay === "paid"} lang={lang} />
          <MyBattles entryIds={myEntries.map((e) => e.id)} lang={lang} />
          <Card title={t("myEntries")} aside={<button onClick={() => go("categories")} className="font-bold underline">{t("edit")}</button>}>
            <ul className="space-y-1">{myEntries.map((e) => <li key={e.id} className="font-semibold">✓ {mine.cats.find((c) => c.slug === e.category)?.name}</li>)}</ul>
          </Card>
          <Scores mine={mine} lang={lang} />
          <div className="flex flex-wrap gap-4 text-sm">
            <button onClick={() => go("profile")} className="underline">{t("profile")}</button>
            <button onClick={() => go("payment")} className="underline">{t("payment")}</button>
            <button onClick={onSpectator} className="text-ink/50 underline">{t("switchToSpectator")}</button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Fixed bottom action bar: thumb-reachable on phones. */
function BottomBar({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-paper/95 px-4 pb-[calc(env(safe-area-inset-bottom)+.75rem)] pt-3 backdrop-blur">
      <div className="mx-auto flex max-w-xl gap-2">{children}</div>
    </div>
  );
}
const primaryBtn = "h-14 flex-1 rounded-2xl bg-ink text-lg font-black text-paper disabled:bg-ink/25";
const backBtn = "h-14 rounded-2xl border-2 border-ink px-5 font-bold";

function StepHead({ title, lead }: { title: string; lead: string }) {
  return (
    <div className="mb-4">
      <h1 className="display text-5xl">{title}</h1>
      <p className="mt-1 text-ink/65">{lead}</p>
    </div>
  );
}

function PassCard({ profile, paid, lang }: { profile: Profile; paid: boolean; lang: Lang }) {
  const t = tr(lang);
  return (
    <section className="rounded-3xl bg-ink p-5 text-paper">
      <p className="label text-paper/60">{paid ? t("doneTitle") : t("waitingTitle")}</p>
      <p className="display mt-1 text-6xl text-kj">{profile.code}</p>
      <p className="text-xl font-bold">{profile.stage_name}</p>
      {profile.crew && <p className="text-paper/60">{profile.crew}{profile.city ? ` · ${profile.city}` : ""}</p>}
      <div className="mt-4">
        {paid ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-4 text-ink">
            <Qr value={profile.pass_token} size={240} label={`QR pass ${profile.code}`} />
            <p className="text-center text-sm">{t("passHint")}</p>
            {profile.checked_in_at && <Pill tone="ok">✓ {t("checkedIn")}</Pill>}
          </div>
        ) : (
          <p className="rounded-2xl bg-ink-2 p-4 text-paper/75">{t("waitingBody")}</p>
        )}
      </div>
    </section>
  );
}

function ProfileStep({ profile, lang, onDone }: { profile: Profile; lang: Lang; onDone: () => Promise<void> }) {
  const t = tr(lang);
  const [f, setF] = useState(profile);
  const { busy, run, note } = useAction();
  const set = (k: keyof Profile) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const kid = !!f.birth_date && ageOn(f.birth_date, EVENT_DAY) < 12;
  const ready = !!(f.stage_name.trim() && f.name.trim() && f.birth_date && f.gender && f.city.trim() && (!kid || f.guardian_name.trim()));
  const save = () => run(async () => {
    const { name, stage_name, crew, city, country, birth_date, gender, phone, instagram, guardian_name } = f;
    await must(sb().from("kj_profiles").update({
      name: name.trim(), stage_name: stage_name.trim(), crew: crew.trim(), city: city.trim(), country: (country || "ID").trim().toUpperCase().slice(0, 2),
      birth_date: birth_date || null, gender: gender || null, phone: phone.trim(), instagram: instagram.trim().replace(/^@/, ""), guardian_name: guardian_name.trim(), lang,
    }).eq("id", profile.id));
    await onDone();
  });
  const field = (k: keyof Profile, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="block">
      <span className="mb-1 block text-sm font-bold">{label}</span>
      <input value={(f[k] as string) ?? ""} onChange={set(k)} className={big} {...props} />
    </label>
  );
  return (
    <div>
      <StepHead title={t("profileTitle")} lead={t("profileLead")} />
      <div className="space-y-4">
        {field("stage_name", t("stageName"), { maxLength: 60, placeholder: "Bboy …", autoCapitalize: "words" })}
        {field("name", t("fullName"), { maxLength: 120, autoComplete: "name" })}
        {field("birth_date", t("birthDate"), { type: "date" })}
        <div>
          <span className="mb-1 block text-sm font-bold">{t("gender")}</span>
          <div className="grid grid-cols-3 gap-2">
            {([["f", t("gF")], ["m", t("gM")], ["x", t("gX")]] as const).map(([g, label]) => (
              <button key={g} type="button" onClick={() => setF({ ...f, gender: g })} aria-pressed={f.gender === g}
                className={`min-h-14 rounded-2xl px-2 text-sm font-bold ${f.gender === g ? "bg-ink text-paper" : "border-2 border-ink/15 bg-white"}`}>{label}</button>
            ))}
          </div>
        </div>
        {field("city", t("city"), { maxLength: 80, autoComplete: "address-level2" })}
        {kid && (
          <div>
            {field("guardian_name", t("guardian"), { maxLength: 120 })}
            <p className="mt-1 text-sm text-stamp">{t("guardianNeeded")}</p>
          </div>
        )}
        <details className="rounded-2xl bg-white p-4">
          <summary className="cursor-pointer font-bold">{t("moreOptional")}</summary>
          <div className="mt-3 space-y-4">
            {field("crew", t("crew"), { maxLength: 80 })}
            {field("instagram", t("instagram"), { maxLength: 60, placeholder: "@", autoCapitalize: "none" })}
            {field("phone", t("phone"), { maxLength: 30, inputMode: "tel", autoComplete: "tel" })}
            {field("country", t("country"), { maxLength: 2, autoCapitalize: "characters" })}
          </div>
        </details>
        {note}
      </div>
      <BottomBar><button disabled={!ready || busy} onClick={save} className={primaryBtn}>{busy ? t("sending") : t("saveNext")} →</button></BottomBar>
    </div>
  );
}

function CategoriesStep({ profile, mine, site, reload, lang, onBack, onNext, canNext }: { profile: Profile; mine: Mine; site: Site; reload: () => Promise<void>; lang: Lang; onBack: () => void; onNext: () => void; canNext: boolean }) {
  const t = tr(lang);
  const { busy, run, note } = useAction();
  const [codes, setCodes] = useState<Record<string, string>>({});
  const cms = new Map(site.categories.map((c) => [c.slug, c]));
  const reason = { profile: "notEligibleProfile", gender: "notEligibleGender", age: "notEligibleAge", guardian: "notEligibleGuardian" } as const;

  const findPartner = async (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (!digits) throw new Error(t("partnerNotFound"));
    const rows = (await must(sb().from("kj_people").select("id").eq("code", `KJ-${digits.padStart(4, "0")}`).eq("role", "participant"))) as { id: string }[];
    if (!rows[0]) throw new Error(t("partnerNotFound"));
    return rows[0].id;
  };
  const toggle = (c: Category, entry: Entry | undefined) => run(async () => {
    if (entry) await must(sb().from("kj_entries").delete().eq("id", entry.id));
    else await must(sb().from("kj_entries").insert({ category: c.slug, dancer_id: profile.id }));
    try { navigator.vibrate?.(15); } catch {}
    await reload();
  });
  const invite = (e: Entry) => run(async () => {
    const partner = await findPartner(codes[e.category] ?? "");
    await must(sb().from("kj_entries").update({ partner_id: partner }).eq("id", e.id));
    await reload();
  });

  return (
    <div>
      <StepHead title={t("catTitle")} lead={t("catLead")} />
      {note && <div className="mb-3">{note}</div>}
      <ul className="space-y-3">
        {mine.cats.map((c) => {
          const info = cms.get(c.slug);
          const entry = mine.entries.find((e) => e.category === c.slug && e.status === "active" && (e.dancer_id === profile.id || (e.partner_id === profile.id && e.partner_status === "accepted")));
          const captain = entry?.dancer_id === profile.id;
          const why = ineligible(c.rule, profile, c.age_ref_date);
          const open = c.registration_open && c.phase === "setup";
          const canToggle = open && (!entry || captain) && (!!entry || !why);
          const mate = entry && (captain ? entry.partner_id : entry.dancer_id);
          const mateName = mate ? mine.names.get(mate) : null;
          return (
            <li key={c.slug} className={`overflow-hidden rounded-3xl ${entry ? "bg-ink text-paper" : "bg-white"} ${!entry && !canToggle ? "opacity-55" : ""}`}>
              <button disabled={!canToggle || busy} onClick={() => toggle(c, entry)} className="flex w-full items-center gap-4 p-4 text-left">
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 text-xl font-black ${entry ? "border-kj bg-kj text-ink" : "border-ink/25"}`}>{entry ? "✓" : ""}</span>
                <span className="min-w-0 flex-1">
                  <span className="display block text-2xl leading-tight">{info?.name ?? c.name}</span>
                  <span className={`block text-sm ${entry ? "text-paper/70" : "text-ink/60"}`}>
                    {info ? `Day ${info.day} · ${tx(info.unit, lang)} · ${tx(info.prize, lang)}` : ""}
                  </span>
                  <span className={`mt-1 block text-xs font-bold ${entry ? "text-kj" : "text-ink/70"}`}>
                    {!open ? t("closed") : entry ? (captain ? t("tapToLeave") : t("entered")) : why ? t(reason[why]) : t("tapToEnter")}
                  </span>
                </span>
              </button>
              {entry && c.team && (
                <div className="border-t border-paper/15 p-4">
                  {mate && <p className="mb-2 text-sm"><b>{mateName?.stage_name ?? "—"}</b> ({mateName?.code}) · {entry.partner_status === "accepted" ? t("partnerAccepted") : t("partnerPending")}</p>}
                  {captain && entry.partner_status !== "accepted" && (
                    <div className="flex gap-2">
                      <input value={codes[c.slug] ?? ""} onChange={(e) => setCodes({ ...codes, [c.slug]: e.target.value })} placeholder={t("partnerCode")} inputMode="numeric"
                        className="min-w-0 flex-1 rounded-2xl bg-white px-4 py-3 text-base text-ink" />
                      <button disabled={busy} onClick={() => invite(entry)} className="rounded-2xl bg-kj px-5 font-black text-ink">{t("invite")}</button>
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <BottomBar>
        <button onClick={onBack} className={backBtn}>‹</button>
        <button disabled={!canNext} onClick={onNext} className={primaryBtn}>{t("next")} →</button>
      </BottomBar>
    </div>
  );
}

const METHODS = ["QRIS", "E-wallet", "Virtual account", "Bank transfer", "PayPal"];

function PaymentStep({ profile, mine, site, reload, lang, onBack, onDone, hasEntries }: { profile: Profile; mine: Mine; site: Site; reload: () => Promise<void>; lang: Lang; onBack: () => void; onDone: () => void; hasEntries: boolean }) {
  const t = tr(lang);
  const p = mine.payment;
  const { busy, run, note } = useAction();
  const [method, setMethod] = useState(p?.method || METHODS[0]);
  const [reference, setReference] = useState(p?.reference ?? "");
  const [file, setFile] = useState<File | null>(null);
  const done = p?.status === "paid" || p?.status === "pending";

  const submit = () => run(async () => {
    let proof_path = p?.proof_path ?? null;
    if (file) {
      const path = `${profile.id}/${Date.now()}-${file.name.replace(/[^\w.-]+/g, "_").slice(-60)}`;
      const { error } = await sb().storage.from("kj-proofs").upload(path, file, { upsert: false, contentType: file.type });
      if (error) throw new Error(error.message);
      proof_path = path;
    }
    await must(sb().from("kj_payments").upsert({ dancer_id: profile.id, method, reference: reference.trim(), proof_path, amount: method === "PayPal" ? site.feeUsd : site.feeIdr }));
    await reload();
    onDone();
  });

  return (
    <div>
      <StepHead title={t("payTitle")} lead={t("payLead")} />
      <section className="rounded-3xl bg-ink p-5 text-paper">
        <p className="display text-5xl text-kj">{site.feeIdr}</p>
        <p className="text-paper/60">{site.feeUsd} · PayPal</p>
        <p className="mt-3 whitespace-pre-line text-paper/85">{tx(site.paymentInfo, lang)}</p>
      </section>

      {p?.status === "paid" && <p className="mt-4 rounded-2xl bg-kj p-4 font-bold">✓ {t("paymentPaid")}</p>}
      {p?.status === "pending" && <p className="mt-4 rounded-2xl bg-gold p-4 font-bold">{t("paymentPending")}</p>}
      {p?.status === "rejected" && <p className="mt-4 rounded-2xl bg-stamp p-4 font-bold text-white">{t("paymentRejected")}{p.note ? ` — ${p.note}` : ""}</p>}
      {!hasEntries && <p className="mt-4 text-ink/60">{t("paymentNeedsEntry")}</p>}

      {p?.status !== "paid" && hasEntries && (
        <div className="mt-5 space-y-4">
          <div>
            <span className="mb-1 block text-sm font-bold">{t("method")}</span>
            <div className="grid grid-cols-2 gap-2">
              {METHODS.map((m) => (
                <button key={m} onClick={() => setMethod(m)} aria-pressed={method === m}
                  className={`min-h-12 rounded-2xl px-3 text-sm font-bold ${method === m ? "bg-ink text-paper" : "border-2 border-ink/15 bg-white"}`}>{m}</button>
              ))}
            </div>
          </div>
          <label className="block">
            <span className="mb-1 block text-sm font-bold">{t("reference")}</span>
            <input value={reference} maxLength={120} onChange={(e) => setReference(e.target.value)} className={big} />
          </label>
          <label className={`flex min-h-16 cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 text-center font-bold ${file ? "border-ink bg-kj" : "border-ink/30 bg-white"}`}>
            <input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="sr-only" />
            {file ? `✓ ${t("fileChosen")}: ${file.name.slice(0, 28)}` : `📎 ${t("uploadProof")}`}
          </label>
          {note}
        </div>
      )}

      <BottomBar>
        <button onClick={onBack} className={backBtn}>‹</button>
        {done && !file && reference === (p?.reference ?? "")
          ? <button onClick={onDone} className={primaryBtn}>{t("next")} →</button>
          : <button disabled={busy || !hasEntries || !reference.trim()} onClick={submit} className={primaryBtn}>{busy ? t("sending") : t("submitPayment")} →</button>}
      </BottomBar>
    </div>
  );
}

function Invites({ invites, mine, reload, lang }: { invites: Entry[]; mine: Mine; reload: () => Promise<void>; lang: Lang }) {
  const t = tr(lang);
  const { busy, run, note } = useAction();
  const answer = (e: Entry, partner_status: "accepted" | "declined") => run(async () => {
    await must(sb().from("kj_entries").update({ partner_status }).eq("id", e.id));
    await reload();
  });
  return (
    <Card title={t("invites")} className="ring-4 ring-kj">
      {note}
      {invites.map((e) => {
        const from = e.dancer_id ? mine.names.get(e.dancer_id) : null;
        const cat = mine.cats.find((c) => c.slug === e.category);
        return (
          <div key={e.id} className="flex flex-wrap items-center justify-between gap-3 py-2">
            <p><b>{from?.stage_name ?? "—"}</b> ({from?.code}) {t("invitedYou")} <b>{cat?.name}</b></p>
            <div className="flex gap-2">
              <Btn kind="kj" disabled={busy} onClick={() => answer(e, "accepted")}>{t("accept")}</Btn>
              <Btn kind="ghost" disabled={busy} onClick={() => answer(e, "declined")}>{t("decline")}</Btn>
            </div>
          </div>
        );
      })}
    </Card>
  );
}

function MyBattles({ entryIds, lang }: { entryIds: number[]; lang: Lang }) {
  const t = tr(lang);
  const { data: board } = useLive(loadBoard, BOARD_TABLES);
  if (!board) return null;
  const set = new Set(entryIds);
  const mineB = board.battles.filter((b) => (b.a_entry && set.has(b.a_entry)) || (b.b_entry && set.has(b.b_entry)));
  const live = mineB.find((b) => b.status === "live");
  if (!mineB.length) return null;
  const catName = (slug: string) => board.cats.find((c) => c.slug === slug)?.name ?? slug;
  const label = (b: (typeof mineB)[number]) => {
    const c = board.cats.find((x) => x.slug === b.category);
    return b.kind === "prelim" ? `Prelim heat ${b.slot}` : b.kind === "smoke" ? `7 to Smoke · exchange ${b.slot}` : roundLabel(c?.bracket_size ?? 16, b.round);
  };
  return (
    <Card title={t("battles")} className={live ? "ring-4 ring-stamp" : ""}>
      {live && <p className="mb-3 rounded-md bg-stamp px-4 py-3 font-bold text-white">🔴 {t("onStageNow")} {entryName(board, live.a_entry)} vs {entryName(board, live.b_entry)}</p>}
      <ul className="divide-y divide-ink/10">
        {mineB.map((b) => {
          const me = b.a_entry && set.has(b.a_entry) ? b.a_entry : b.b_entry;
          const result = b.kind !== "prelim" && b.winner_entry ? (b.winner_entry === me ? <Pill tone="ok">{t("won")}</Pill> : <Pill>{t("lost")}</Pill>) : b.status === "live" ? <Pill tone="live">LIVE</Pill> : b.status === "pending" ? <Pill tone="warn">{t("upNext")}</Pill> : null;
          return (
            <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <span><span className="text-sm text-ink/55">{catName(b.category)} · {label(b)}</span><br /><b>{entryName(board, b.a_entry)}</b>{b.b_entry || b.kind !== "prelim" ? <> vs <b>{entryName(board, b.b_entry)}</b></> : null}</span>
              {result}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function Scores({ mine, lang }: { mine: Mine; lang: Lang }) {
  const t = tr(lang);
  if (!mine.scores.length) return null;
  const judges = [...new Set(mine.scores.map((s) => s.judge_id))];
  return (
    <Card title={t("scores")} aside={<span className="text-sm text-ink/55">{t("scoresHint")}</span>}>
      {mine.entries.filter((e) => mine.scores.some((s) => s.entry_id === e.id)).map((e) => {
        const rows = mine.scores.filter((s) => s.entry_id === e.id);
        const total = rows.reduce((a, s) => a + s.mind + s.body + s.soul, 0);
        return (
          <div key={e.id} className="mb-4 overflow-x-auto">
            <p className="font-bold">{mine.cats.find((c) => c.slug === e.category)?.name}</p>
            <table className="mt-1 w-full text-left text-sm">
              <thead className="text-ink/55"><tr><th className="py-1 pr-3">{t("judge")}</th><th className="pr-3">Mind</th><th className="pr-3">Body</th><th className="pr-3">Soul</th></tr></thead>
              <tbody>
                {rows.map((s) => <tr key={s.judge_id} className="border-t border-ink/10"><td className="py-1 pr-3">{t("judge")} {judges.indexOf(s.judge_id) + 1}</td><td>{s.mind}</td><td>{s.body}</td><td>{s.soul}</td></tr>)}
                <tr className="border-t-2 border-ink font-bold"><td className="py-1">{t("total")}</td><td colSpan={3}>{total}</td></tr>
              </tbody>
            </table>
          </div>
        );
      })}
    </Card>
  );
}
