"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { tx, type Lang } from "@/lib/i18n";
import { errMsg, must, sb, type Profile } from "./data";
import { tr } from "./i18n";
import type { Site } from "./MeApp";
import { Btn, Card, Field, Notice, Pill, Qr, inputCls, useAction } from "./ui";

type Rsvp = { id: number; name: string; city: string; party: number; pass_token: string; checked_in_at: string | null };

export function Spectator({ profile, site, lang, onDancer }: { profile: Profile; site: Site; lang: Lang; onDancer: () => void }) {
  const t = tr(lang);
  const [rsvp, setRsvp] = useState<Rsvp | null | undefined>(undefined);
  const [err, setErr] = useState("");
  const { busy, run, note } = useAction();
  const [f, setF] = useState({ name: profile.name, city: profile.city, party: 1, news: false });

  const load = useCallback(async () => {
    try {
      const rows = (await must(sb().from("kj_rsvp").select("id,name,city,party,pass_token,checked_in_at").eq("user_id", profile.id))) as Rsvp[];
      setRsvp(rows[0] ?? null);
    } catch (e) {
      setErr(errMsg(e));
    }
  }, [profile.id]);
  useEffect(() => { const f0 = setTimeout(load, 0); return () => clearTimeout(f0); }, [load]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      await must(sb().from("kj_rsvp").insert({
        user_id: profile.id, email: profile.email ?? "", name: f.name.trim(), city: f.city.trim(),
        party: Math.min(10, Math.max(1, f.party)), news: f.news, lang,
      }));
      await load();
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div className="min-w-0 space-y-6">
        {err && <Notice kind="err">{err}</Notice>}
        <Card title={t("rsvpTitle")}>
          {rsvp === undefined ? (
            <p>{t("loading")}</p>
          ) : rsvp ? (
            <div className="flex flex-wrap items-center gap-6">
              <Qr value={rsvp.pass_token} label="Spectator QR pass" />
              <div>
                <p className="display text-4xl">{rsvp.name}</p>
                <p className="text-ink/60">{rsvp.city}</p>
                <p className="mt-2">{t("forPeople")} <b>{rsvp.party}</b> {t("persons")}</p>
                {rsvp.checked_in_at && <p className="mt-2"><Pill tone="ok">✓ {t("checkedIn")}</Pill></p>}
                <p className="mt-3 max-w-xs text-sm text-ink/60">{t("passHint")}</p>
              </div>
            </div>
          ) : site.rsvpOpen ? (
            <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
              <p className="text-ink/70 sm:col-span-2">{t("rsvpBody")}</p>
              <Field label={t("fullName")}><input required maxLength={120} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={inputCls} /></Field>
              <Field label={t("city")}><input required maxLength={120} value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} className={inputCls} /></Field>
              <Field label={t("people")}><input type="number" min={1} max={10} value={f.party} onChange={(e) => setF({ ...f, party: Number(e.target.value) })} className={inputCls} /></Field>
              <label className="flex items-center gap-3 self-end pb-3"><input type="checkbox" checked={f.news} onChange={(e) => setF({ ...f, news: e.target.checked })} className="h-5 w-5 accent-ink" /><span className="text-sm">{t("news")}</span></label>
              <div className="flex flex-wrap items-center gap-3 sm:col-span-2"><Btn type="submit" disabled={busy}>{t("getPass")}</Btn><div className="flex-1">{note}</div></div>
            </form>
          ) : (
            <p className="text-ink/70">{t("rsvpClosed")}</p>
          )}
        </Card>

        <Card title={t("schedule")} aside={<Link href="/live" className="btn btn-ink !px-4 !py-2 !text-base">🔴 {t("watchLive")}</Link>}>
          <div className="grid gap-6 md:grid-cols-2">
            {site.days.map((d) => (
              <div key={d.n}>
                <p className="display text-2xl">{d.date} · {tx(d.title, lang)}</p>
                <ul className="mt-2 divide-y divide-ink/10 text-sm">
                  {d.rundown.map((r) => <li key={r.time} className="flex gap-3 py-1.5"><span className="w-12 font-bold">{r.time}</span><span>{tx(r.what, lang)}</span></li>)}
                </ul>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <aside className="space-y-4">
        <Card dark title={t("imDancing")}>
          <p className="text-paper/70">{t("imDancingBody")}</p>
          <Btn kind="kj" className="mt-4" onClick={onDancer}>{t("switchToDancer")}</Btn>
        </Card>
      </aside>
    </div>
  );
}
