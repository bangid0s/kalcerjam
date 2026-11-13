"use client";

import { useCallback, useEffect, useState } from "react";
import { tx, type Lang } from "@/lib/i18n";
import { ineligible, roundLabel } from "@/lib/tournament";
import { errMsg, loadBoard, must, sb, useLive, BOARD_TABLES, entryName, type Category, type Entry, type Payment, type Profile, type ScoreRow } from "./data";
import { tr, type Key } from "./i18n";
import type { Site } from "./MeApp";
import { Btn, Card, Field, Notice, Pill, Qr, inputCls, useAction } from "./ui";

type Mine = { cats: Category[]; entries: Entry[]; payment: Payment | null; names: Map<string, { code: string; stage_name: string }>; scores: ScoreRow[] };

export function Dancer({ profile, reloadProfile, site, lang, onSpectator }: { profile: Profile; reloadProfile: () => Promise<void>; site: Site; lang: Lang; onSpectator: () => void }) {
  const t = tr(lang);
  const [mine, setMine] = useState<Mine | null>(null);
  const [err, setErr] = useState("");

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
  if (!mine) return <p>{t("loading")}</p>;

  const myEntries = mine.entries.filter((e) => e.status === "active" && (e.dancer_id === profile.id || e.partner_status === "accepted"));
  const invites = mine.entries.filter((e) => e.partner_id === profile.id && e.partner_status === "pending");
  const profileDone = !!(profile.stage_name && profile.birth_date && profile.gender);
  const paid = mine.payment?.status === "paid";
  const steps: [Key, boolean][] = [["stepProfile", profileDone], ["stepCategories", myEntries.length > 0], ["stepPayment", paid], ["stepPass", !!profile.checked_in_at]];

  return (
    <div className="space-y-6">
      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {steps.map(([k, done], i) => (
          <li key={k} className={`rounded-xl px-4 py-3 ${done ? "bg-kj" : "bg-white"}`}>
            <span className="label text-ink/60">{i + 1}</span>
            <p className="display text-2xl">{t(k)} {done && "✓"}</p>
          </li>
        ))}
      </ol>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="min-w-0 space-y-6">
          <MyBattles entryIds={myEntries.map((e) => e.id)} lang={lang} />
          <ProfileForm profile={profile} reload={reloadProfile} lang={lang} />
          {invites.length > 0 && <Invites invites={invites} mine={mine} reload={load} lang={lang} />}
          <Categories profile={profile} mine={mine} site={site} reload={load} lang={lang} />
          <PaymentCard profile={profile} mine={mine} site={site} reload={load} lang={lang} hasEntries={myEntries.length > 0} />
          <Scores mine={mine} lang={lang} />
        </div>
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card dark title={t("pass")}>
            <p className="label text-paper/60">{t("dancerId")}</p>
            <p className="display text-6xl text-kj">{profile.code}</p>
            <p className="mt-1 text-lg font-bold">{profile.stage_name || "—"}</p>
            {profile.crew && <p className="text-paper/60">{profile.crew}{profile.city ? ` · ${profile.city}` : ""}</p>}
            <div className="mt-5">
              {paid ? (
                <>
                  <Qr value={profile.pass_token} label={`QR pass ${profile.code}`} />
                  <p className="mt-3 text-sm text-paper/70">{t("passHint")}</p>
                </>
              ) : (
                <p className="rounded-md bg-ink-2 p-4 text-sm text-paper/70">{t("passLocked")}</p>
              )}
              {profile.checked_in_at && <p className="mt-3"><Pill tone="ok">✓ {t("checkedIn")}</Pill></p>}
            </div>
          </Card>
          <button onClick={onSpectator} className="text-sm text-ink/50 underline hover:text-ink">{t("switchToSpectator")}</button>
        </aside>
      </div>
    </div>
  );
}

function ProfileForm({ profile, reload, lang }: { profile: Profile; reload: () => Promise<void>; lang: Lang }) {
  const t = tr(lang);
  const [f, setF] = useState(profile);
  const { busy, run, note } = useAction();
  const set = (k: keyof Profile) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      const { name, stage_name, crew, city, country, birth_date, gender, phone, instagram, guardian_name } = f;
      await must(sb().from("kj_profiles").update({
        name: name.trim(), stage_name: stage_name.trim(), crew: crew.trim(), city: city.trim(), country: country.trim().toUpperCase().slice(0, 2),
        birth_date: birth_date || null, gender: gender || null, phone: phone.trim(), instagram: instagram.trim().replace(/^@/, ""), guardian_name: guardian_name.trim(), lang,
      }).eq("id", profile.id));
      await reload();
    }, t("saved"));
  };
  return (
    <Card title={t("profile")} aside={<span className="text-sm text-ink/55">{t("profileHint")}</span>}>
      <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
        <Field label={t("stageName")}><input required maxLength={60} value={f.stage_name} onChange={set("stage_name")} className={inputCls} /></Field>
        <Field label={t("fullName")}><input required maxLength={120} value={f.name} onChange={set("name")} className={inputCls} autoComplete="name" /></Field>
        <Field label={t("crew")}><input maxLength={80} value={f.crew} onChange={set("crew")} className={inputCls} /></Field>
        <Field label={t("city")}><input maxLength={80} value={f.city} onChange={set("city")} className={inputCls} /></Field>
        <Field label={t("birthDate")}><input required type="date" value={f.birth_date ?? ""} onChange={set("birth_date")} className={inputCls} /></Field>
        <Field label={t("gender")}>
          <select required value={f.gender ?? ""} onChange={set("gender")} className={inputCls}>
            <option value="" disabled>—</option>
            <option value="f">{t("gF")}</option>
            <option value="m">{t("gM")}</option>
            <option value="x">{t("gX")}</option>
          </select>
        </Field>
        <Field label={t("country")}><input maxLength={2} value={f.country} onChange={set("country")} className={inputCls} /></Field>
        <Field label={t("phone")}><input maxLength={30} value={f.phone} onChange={set("phone")} className={inputCls} inputMode="tel" /></Field>
        <Field label={t("instagram")}><input maxLength={60} value={f.instagram} onChange={set("instagram")} className={inputCls} placeholder="@" /></Field>
        <Field label={t("guardian")}><input maxLength={120} value={f.guardian_name} onChange={set("guardian_name")} className={inputCls} /></Field>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <Btn type="submit" disabled={busy}>{t("save")}</Btn>
          <div className="flex-1">{note}</div>
        </div>
      </form>
    </Card>
  );
}

function Categories({ profile, mine, site, reload, lang }: { profile: Profile; mine: Mine; site: Site; reload: () => Promise<void>; lang: Lang }) {
  const t = tr(lang);
  const { busy, run, note } = useAction();
  const [codes, setCodes] = useState<Record<string, string>>({});
  const cms = new Map(site.categories.map((c) => [c.slug, c]));

  const findPartner = async (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (!digits) throw new Error(t("partnerNotFound"));
    const code = `KJ-${digits.padStart(4, "0")}`;
    const rows = (await must(sb().from("kj_people").select("id").eq("code", code).eq("role", "participant"))) as { id: string }[];
    if (!rows[0]) throw new Error(t("partnerNotFound"));
    return rows[0].id;
  };
  const enter = (c: Category) => run(async () => {
    await must(sb().from("kj_entries").insert({ category: c.slug, dancer_id: profile.id }));
    await reload();
  });
  const leave = (e: Entry) => run(async () => {
    await must(sb().from("kj_entries").delete().eq("id", e.id));
    await reload();
  });
  const invite = (e: Entry) => run(async () => {
    const partner = await findPartner(codes[e.category] ?? "");
    await must(sb().from("kj_entries").update({ partner_id: partner }).eq("id", e.id));
    await reload();
  });
  const rename = (e: Entry, team_name: string) => run(async () => {
    await must(sb().from("kj_entries").update({ team_name: team_name.trim().slice(0, 60) }).eq("id", e.id));
    await reload();
  });

  const reason = { profile: "notEligibleProfile", gender: "notEligibleGender", age: "notEligibleAge", guardian: "notEligibleGuardian" } as const;

  return (
    <Card title={t("categories")} aside={<span className="text-sm text-ink/55">{t("categoriesHint")}</span>}>
      {note && <div className="mb-3">{note}</div>}
      <ul className="divide-y divide-ink/10">
        {mine.cats.map((c) => {
          const info = cms.get(c.slug);
          const entry = mine.entries.find((e) => e.category === c.slug && e.status === "active" && (e.dancer_id === profile.id || (e.partner_id === profile.id && e.partner_status === "accepted")));
          const why = ineligible(c.rule, profile, c.age_ref_date);
          const captain = entry?.dancer_id === profile.id;
          const mate = entry && (captain ? entry.partner_id : entry.dancer_id);
          const mateName = mate ? mine.names.get(mate) : null;
          return (
            <li key={c.slug} className="py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="display text-2xl">{info?.name ?? c.name}</p>
                  <p className="text-sm text-ink/60">
                    {info ? `${t("schedule")}: Day ${info.day} · ${tx(info.unit, lang)} · ${tx(info.prize, lang)}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {entry ? (
                    <>
                      <Pill tone="ok">✓ {t("entered")}</Pill>
                      {captain && c.registration_open && c.phase === "setup" && <Btn kind="ghost" disabled={busy} onClick={() => leave(entry)}>{t("leave")}</Btn>}
                    </>
                  ) : !c.registration_open || c.phase !== "setup" ? (
                    <Pill>{t("closed")}</Pill>
                  ) : why ? (
                    <Pill tone="warn">{t(reason[why])}</Pill>
                  ) : (
                    <Btn disabled={busy} onClick={() => enter(c)}>{t("enter")}</Btn>
                  )}
                </div>
              </div>
              {entry && c.team && (
                <div className="mt-3 rounded-lg bg-paper p-3">
                  {mate ? (
                    <p className="text-sm">
                      <b>{mateName?.stage_name ?? "—"}</b> ({mateName?.code}) · {entry.partner_status === "accepted" ? <Pill tone="ok">{t("partnerAccepted")}</Pill> : <Pill tone="warn">{t("partnerPending")}</Pill>}
                    </p>
                  ) : null}
                  {captain && entry.partner_status !== "accepted" && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <input value={codes[c.slug] ?? ""} onChange={(e) => setCodes({ ...codes, [c.slug]: e.target.value })} placeholder={t("partnerCode")} className={`${inputCls} max-w-xs`} />
                      <Btn disabled={busy} onClick={() => invite(entry)}>{t("invite")}</Btn>
                    </div>
                  )}
                  {captain && (
                    <form className="mt-2 flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); rename(entry, new FormData(e.currentTarget).get("team") as string); }}>
                      <input name="team" defaultValue={entry.team_name} maxLength={60} placeholder={t("teamName")} className={`${inputCls} max-w-xs`} />
                      <Btn kind="ghost" type="submit" disabled={busy}>{t("save")}</Btn>
                    </form>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
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

const METHODS = ["QRIS", "E-wallet", "Virtual account", "Bank transfer", "PayPal"];

function PaymentCard({ profile, mine, site, reload, lang, hasEntries }: { profile: Profile; mine: Mine; site: Site; reload: () => Promise<void>; lang: Lang; hasEntries: boolean }) {
  const t = tr(lang);
  const p = mine.payment;
  const { busy, run, note } = useAction();
  const [method, setMethod] = useState(p?.method || METHODS[0]);
  const [reference, setReference] = useState(p?.reference ?? "");
  const [file, setFile] = useState<File | null>(null);
  const status = p?.status === "paid" ? <Pill tone="ok">✓ {t("paymentPaid")}</Pill> : p?.status === "pending" ? <Pill tone="warn">{t("paymentPending")}</Pill> : p?.status === "rejected" ? <Pill tone="live">{t("paymentRejected")}</Pill> : <Pill>{t("paymentNone")}</Pill>;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      let proof_path = p?.proof_path ?? null;
      if (file) {
        const path = `${profile.id}/${Date.now()}-${file.name.replace(/[^\w.-]+/g, "_").slice(-60)}`;
        const { error } = await sb().storage.from("kj-proofs").upload(path, file, { upsert: false, contentType: file.type });
        if (error) throw new Error(error.message);
        proof_path = path;
      }
      const row = { dancer_id: profile.id, method, reference: reference.trim(), proof_path, amount: method === "PayPal" ? site.feeUsd : site.feeIdr };
      await must(sb().from("kj_payments").upsert(row));
      await reload();
    });
  };

  return (
    <Card title={t("payment")} aside={status}>
      <p className="display text-4xl">{site.feeIdr} <span className="text-xl text-ink/50">/ {site.feeUsd}</span></p>
      <p className="mt-2 whitespace-pre-line text-ink/75">{tx(site.paymentInfo, lang)}</p>
      {p?.status !== "paid" && (
        hasEntries ? (
          <form onSubmit={submit} className="mt-5 grid gap-3 sm:grid-cols-2">
            <Field label={t("method")}>
              <select value={method} onChange={(e) => setMethod(e.target.value)} className={inputCls}>{METHODS.map((m) => <option key={m}>{m}</option>)}</select>
            </Field>
            <Field label={t("reference")}><input required maxLength={120} value={reference} onChange={(e) => setReference(e.target.value)} className={inputCls} /></Field>
            <Field label={t("proof")} className="sm:col-span-2">
              <input type="file" accept="image/png,image/jpeg,image/webp,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="block text-sm" />
            </Field>
            <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
              <Btn type="submit" disabled={busy}>{t("submitPayment")}</Btn>
              <div className="flex-1">{note}</div>
            </div>
          </form>
        ) : (
          <p className="mt-4 text-sm text-ink/60">{t("paymentNeedsEntry")}</p>
        )
      )}
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
