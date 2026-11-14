"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import type { Lang, T } from "@/lib/i18n";
import { errMsg, must, sb, type Profile, type Role } from "./data";
import { tr } from "./i18n";
import { Btn, Notice, inputCls } from "./ui";
import { Dancer } from "./Dancer";
import { Spectator } from "./Spectator";
import { Judge } from "./Judge";
import { Mc } from "./Mc";
import { Team } from "./Team";

/** Bits of CMS content the dashboards need, passed in from the server page. */
export type Site = {
  feeIdr: string;
  feeUsd: string;
  paymentInfo: T;
  rsvpOpen: boolean;
  googleLogin: boolean;
  categories: { slug: string; name: string; day: number; unit: T; prize: T; eligibility: T }[];
  days: { n: number; date: string; title: T; rundown: { time: string; what: T }[] }[];
};

type View = Role;
const VIEW_LABEL: Record<View, string> = { participant: "Dancer", spectator: "Spectator", judge: "Judge", mc: "MC", team: "Team" };

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem("kj-lang");
    if (saved === "en" || saved === "id") return saved;
  } catch {}
  return typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("id") ? "id" : "en";
}

export function MeApp({ site }: { site: Site }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    const t = setTimeout(() => setLangState(initialLang()), 0);
    sb().auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = sb().auth.onAuthStateChange((_e, s) => setSession(s));
    return () => { clearTimeout(t); data.subscription.unsubscribe(); };
  }, []);
  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem("kj-lang", l); } catch {}
  };
  const t = tr(lang);

  if (session === undefined) return <Center>{t("loading")}</Center>;
  if (!session) return <Login lang={lang} setLang={setLang} google={site.googleLogin} />;
  return <Signed key={session.user.id} session={session} site={site} lang={lang} setLang={setLang} />;
}

function Signed({ session, site, lang, setLang }: { session: Session; site: Site; lang: Lang; setLang: (l: Lang) => void }) {
  const t = tr(lang);
  const uid = session.user.id;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuper, setIsSuper] = useState(false);
  const [view, setView] = useState<View | null>(null);
  const [err, setErr] = useState("");

  const loadProfile = useCallback(async () => {
    try {
      let rows = (await must(sb().from("kj_profiles").select("*").eq("id", uid))) as Profile[];
      if (!rows.length) {
        // Accounts created before the competition migration: make the profile now.
        await must(sb().from("kj_profiles").insert({ id: uid, email: session.user.email?.toLowerCase() }));
        rows = (await must(sb().from("kj_profiles").select("*").eq("id", uid))) as Profile[];
      }
      setProfile(rows[0]);
    } catch (e) {
      setErr(errMsg(e));
    }
  }, [uid, session.user.email]);

  useEffect(() => {
    const first = setTimeout(loadProfile, 0);
    const email = (session.user.email ?? "").toLowerCase();
    sb().from("kj_admins").select("email,super").eq("email", email).then(({ data }) => { setIsAdmin(!!data?.length); setIsSuper(!!data?.[0]?.super); });
    return () => clearTimeout(first);
  }, [loadProfile, session.user.email]);

  if (err) return <Center><Notice kind="err">{err}</Notice><p className="mt-4 text-sm text-ink/60">If this says a table is missing, the competition migration hasn&apos;t been applied to Supabase yet.</p></Center>;
  if (!profile) return <Center>{t("loading")}</Center>;

  const current: View = view ?? (isAdmin && (profile.role === "spectator" || profile.role === "participant") ? "team" : profile.role);
  const views: View[] = isAdmin ? ["team", "judge", "mc", "participant", "spectator"] : [];

  const setRole = async (role: Role) => {
    try {
      await must(sb().from("kj_profiles").update({ role }).eq("id", uid));
      setView(null);
      await loadProfile();
    } catch (e) {
      setErr(errMsg(e));
    }
  };

  return (
    <div className="min-h-screen pb-16">
      <header className="sticky top-0 z-30 bg-ink text-paper">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <Link href="/" aria-label={t("backToSite")}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/kj-letters.webp" alt="Kalcer Jam" className="w-24" />
          </Link>
          <span className="rounded-full bg-kj px-2.5 py-0.5 text-xs font-bold text-ink">{VIEW_LABEL[current]}</span>
          {views.length > 0 && (
            <label className="flex items-center gap-2 text-xs text-paper/60">
              View as
              <select value={current} onChange={(e) => setView(e.target.value as View)} className="rounded bg-ink-2 px-2 py-1 text-sm text-paper">
                {views.map((v) => <option key={v} value={v}>{VIEW_LABEL[v]}</option>)}
              </select>
            </label>
          )}
          <div className="ml-auto flex items-center gap-3 text-sm">
            {isSuper && <Link href="/admin" className="font-semibold text-kj hover:underline">Site editor</Link>}
            <button onClick={() => setLang(lang === "en" ? "id" : "en")} className="font-semibold text-paper/75 hover:text-paper">{lang === "en" ? "ID" : "EN"}</button>
            <span className="hidden max-w-[14rem] truncate text-paper/50 sm:inline">{session.user.email}</span>
            <button onClick={() => sb().auth.signOut()} className="font-semibold text-paper/75 hover:text-paper">{t("signOut")}</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-6">
        {current === "participant" && <Dancer profile={profile} reloadProfile={loadProfile} site={site} lang={lang} onSpectator={() => setRole("spectator")} />}
        {current === "spectator" && <Spectator profile={profile} site={site} lang={lang} onDancer={() => setRole("participant")} />}
        {current === "judge" && <Judge uid={uid} preview={profile.role !== "judge"} onBecomeJudge={isAdmin ? () => setRole("judge") : undefined} />}
        {current === "mc" && <Mc />}
        {current === "team" && <Team isAdmin={isAdmin} isSuper={isSuper} site={site} />}
      </main>
    </div>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <div className="grid min-h-screen place-items-center p-6 text-center"><div className="max-w-md">{children}</div></div>;
}

function Login({ lang, setLang, google }: { lang: Lang; setLang: (l: Lang) => void; google: boolean }) {
  const t = tr(lang);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"link" | "password">("link");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [err, setErr] = useState("");
  const redirectTo = () => `${window.location.origin}/dashboard`;

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setState("sending");
    const { error } = await sb().auth.signInWithOtp({ email: email.trim().toLowerCase(), options: { emailRedirectTo: redirectTo() } });
    if (error) { setErr(error.message); setState("idle"); } else setState("sent");
  };
  const withPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setState("sending");
    const { error } = await sb().auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    setState("idle");
    if (error) setErr(error.message === "Invalid login credentials" ? t("wrongPassword") : error.message);
  };
  const withGoogle = async () => {
    const { error } = await sb().auth.signInWithOAuth({ provider: "google", options: { redirectTo: redirectTo() } });
    if (error) setErr(error.message);
  };

  return (
    <div className="grid min-h-screen place-items-center bg-kj p-4">
      <div className="paper w-full max-w-sm p-8">
        <div className="flex items-start justify-between">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <Link href="/"><img src="/brand/kj-letters.webp" alt="Kalcer Jam" className="w-32 brightness-0" /></Link>
          <button onClick={() => setLang(lang === "en" ? "id" : "en")} className="label rounded-full border-2 border-ink px-2.5 py-1">{lang === "en" ? "ID" : "EN"}</button>
        </div>
        <h1 className="display mt-6 text-5xl">{t("signInTitle")}</h1>
        <p className="mt-2 text-ink/70">{t("signInBody")}</p>
        {state === "sent" ? (
          <p role="status" className="mt-6 rounded-md bg-ink px-4 py-4 text-paper">{t("linkSent")}</p>
        ) : (
          <form onSubmit={mode === "link" ? send : withPassword} className="mt-6 space-y-3">
            <div className="grid grid-cols-2 gap-1 rounded-full bg-paper p-1" role="tablist">
              {(["link", "password"] as const).map((m) => (
                <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => { setMode(m); setErr(""); }}
                  className={`rounded-full py-2 text-sm font-bold ${mode === m ? "bg-ink text-paper" : ""}`}>{m === "link" ? t("modeLink") : t("modePassword")}</button>
              ))}
            </div>
            <label className="block">
              <span className="mb-1 block text-sm font-semibold">{t("email")}</span>
              <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
            </label>
            {mode === "password" && (
              <label className="block">
                <span className="mb-1 block text-sm font-semibold">{t("password")}</span>
                <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
              </label>
            )}
            <button disabled={state === "sending"} className="btn btn-ink w-full disabled:opacity-50">{state === "sending" ? t("sending") : mode === "link" ? t("sendLink") : t("signInTitle")}</button>
            {mode === "password" && <button type="button" onClick={() => setMode("link")} className="w-full text-center text-sm underline">{t("forgotPassword")}</button>}
            {google && (
              <>
                <p className="text-center text-sm text-ink/50">{t("or")}</p>
                <Btn kind="ghost" onClick={withGoogle} className="w-full py-3">{t("google")}</Btn>
              </>
            )}
          </form>
        )}
        {err && <p role="alert" className="mt-4 text-sm text-stamp">{err}</p>}
      </div>
    </div>
  );
}
