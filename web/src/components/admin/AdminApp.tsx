"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { contentKeys, defaults, type ContentKey } from "@/lib/content";
import { mergeDeep } from "@/lib/merge";
import { refreshSiteContent } from "@/app/admin/actions";
import { Editor, type Json } from "./Editor";
import { sb } from "./supabase";

const SECTIONS: Record<ContentKey, { label: string; group: string; preview: string; hint?: string }> = {
  settings: { label: "Event settings", group: "Site", preview: "/", hint: "Dates, city, fees, contacts, RSVP switch, footer and SEO defaults." },
  nav: { label: "Navigation", group: "Site", preview: "/", hint: "Top menu (main) and the extra links in the mobile menu and footer (more)." },
  ui: { label: "Shared labels", group: "Site", preview: "/", hint: "Small bits of copy reused across pages: buttons, countdown units, footer line." },
  home: { label: "Home", group: "Pages", preview: "/" },
  event: { label: "Event · schedule & venue", group: "Pages", preview: "/2027", hint: "Days here also group the categories (match each category's Day number)." },
  categories: { label: "Categories", group: "Pages", preview: "/2027/categories" },
  lineup: { label: "Lineup", group: "Pages", preview: "/2027/lineup" },
  rules: { label: "Rules", group: "Pages", preview: "/2027/rules" },
  live: { label: "Live", group: "Pages", preview: "/live" },
  about: { label: "About", group: "Pages", preview: "/about" },
  sponsors: { label: "Sponsors", group: "Pages", preview: "/sponsors" },
  gallery: { label: "Gallery", group: "Pages", preview: "/gallery" },
  news: { label: "News", group: "Pages", preview: "/news", hint: "Newest first. The top three also show on the home page." },
  travel: { label: "Travel", group: "Pages", preview: "/travel" },
  merch: { label: "Merch", group: "Pages", preview: "/merch" },
  faq: { label: "FAQ", group: "Pages", preview: "/faq" },
  contact: { label: "Contact", group: "Pages", preview: "/contact" },
  register: { label: "Register & RSVP", group: "Pages", preview: "/register" },
};

type Saved = Partial<Record<ContentKey, { value: Json; updated_at: string; updated_by: string | null }>>;
type View = ContentKey | "rsvp";

export function AdminApp() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [adminCheck, setAdminCheck] = useState<{ email: string; ok: boolean } | null>(null);
  const email = (session?.user.email ?? "").toLowerCase();
  const isAdmin = adminCheck && adminCheck.email === email ? adminCheck.ok : null;

  useEffect(() => {
    sb().auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = sb().auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!email) return;
    sb().from("kj_admins").select("email,super").eq("email", email).then(({ data }) => setAdminCheck({ email, ok: !!data?.[0]?.super }));
  }, [email]);

  if (session === undefined) return <Center>Loading…</Center>;
  if (!session) return <Login />;
  if (isAdmin === null) return <Center>Checking access…</Center>;
  if (!isAdmin) {
    return (
      <Center>
        <p className="display text-4xl">Super admins only</p>
        <p className="mt-3 max-w-md text-ink/70"><b>{session.user.email}</b> is signed in, but only super admins can edit the website. Admins run the event from the dashboard.</p>
        <Link href="/dashboard" className="btn btn-kj mt-6">Go to dashboard</Link>
        <button onClick={() => sb().auth.signOut()} className="btn btn-ink mt-6">Sign out</button>
      </Center>
    );
  }
  return <Dashboard session={session} />;
}

function Center({ children }: { children: React.ReactNode }) {
  return <div className="grid min-h-screen place-items-center p-6 text-center"><div>{children}</div></div>;
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const { error } = await sb().auth.signInWithPassword({ email: email.trim(), password });
    if (error) setErr(error.message);
    setBusy(false);
  };
  return (
    <div className="grid min-h-screen place-items-center bg-kj p-4">
      <form onSubmit={submit} className="paper w-full max-w-sm space-y-4 p-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/kj-letters.webp" alt="Kalcer Jam" className="w-32 brightness-0" />
        <h1 className="display text-4xl">Admin</h1>
        <label className="block"><span className="mb-1 block text-sm font-semibold">Email</span>
          <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-md border-2 border-ink px-3 py-2.5" /></label>
        <label className="block"><span className="mb-1 block text-sm font-semibold">Password</span>
          <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-md border-2 border-ink px-3 py-2.5" /></label>
        {err && <p role="alert" className="text-sm text-stamp">{err}</p>}
        <button disabled={busy} className="btn btn-ink w-full disabled:opacity-50">{busy ? "Signing in…" : "Sign in"}</button>
      </form>
    </div>
  );
}

function Dashboard({ session }: { session: Session }) {
  const [view, setView] = useState<View>("home");
  const [saved, setSaved] = useState<Saved>({});
  const [drafts, setDrafts] = useState<Partial<Record<ContentKey, Json>>>({});
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<{ kind: "ok" | "err" | "info"; msg: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const fetchSaved = () => sb().from("kj_content").select("key,value,updated_at,updated_by");
  const apply = useCallback(({ data, error }: Awaited<ReturnType<typeof fetchSaved>>) => {
    if (error) setStatus({ kind: "err", msg: `Couldn't load content: ${error.message}` });
    else setSaved(Object.fromEntries((data ?? []).map((r) => [r.key, r])) as Saved);
    setLoading(false);
  }, []);
  const load = async () => apply(await fetchSaved());
  useEffect(() => { fetchSaved().then(apply); }, [apply]);

  const dirtyKeys = useMemo(() => contentKeys.filter((k) => drafts[k] !== undefined), [drafts]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirtyKeys.length) e.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirtyKeys.length]);

  const current = (k: ContentKey): Json => drafts[k] ?? (mergeDeep(defaults[k], saved[k]?.value) as unknown as Json);

  const save = async (k: ContentKey) => {
    const value = drafts[k];
    if (value === undefined) return;
    setStatus({ kind: "info", msg: "Saving…" });
    const { error } = await sb().from("kj_content").upsert({ key: k, value });
    if (error) { setStatus({ kind: "err", msg: `Save failed: ${error.message}` }); return; }
    const res = await refreshSiteContent(session.access_token).catch(() => ({ ok: false }));
    setDrafts((d) => { const n = { ...d }; delete n[k]; return n; });
    await load();
    setStatus(res.ok ? { kind: "ok", msg: "Saved. The live site is updated." } : { kind: "ok", msg: "Saved. The live site may take a few minutes to refresh." });
  };

  const discard = (k: ContentKey) => setDrafts((d) => { const n = { ...d }; delete n[k]; return n; });

  const reset = async (k: ContentKey) => {
    if (!confirm(`Reset "${SECTIONS[k].label}" to the original built-in content? Your saved edits for this section will be deleted.`)) return;
    const { error } = await sb().from("kj_content").delete().eq("key", k);
    if (error) { setStatus({ kind: "err", msg: `Reset failed: ${error.message}` }); return; }
    await refreshSiteContent(session.access_token).catch(() => null);
    discard(k);
    await load();
    setStatus({ kind: "ok", msg: "Section reset to defaults." });
  };

  const go = (v: View) => { setView(v); setStatus(null); setMenuOpen(false); window.scrollTo(0, 0); };
  const groups = ["Site", "Pages"];

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[17rem_1fr]">
      <aside className={`${menuOpen ? "block" : "hidden"} fixed inset-0 z-40 overflow-y-auto bg-ink p-5 text-paper lg:sticky lg:top-0 lg:block lg:h-screen`}>
        <div className="flex items-center justify-between">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/kj-letters.webp" alt="Kalcer Jam" className="w-28" />
          <button className="text-2xl lg:hidden" onClick={() => setMenuOpen(false)} aria-label="Close menu">✕</button>
        </div>
        <p className="label mt-1 text-paper/50">Admin dashboard</p>
        {groups.map((g) => (
          <nav key={g} className="mt-6">
            <p className="label mb-1 text-paper/40">{g}</p>
            {contentKeys.filter((k) => SECTIONS[k].group === g).map((k) => (
              <button key={k} onClick={() => go(k)} className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm font-semibold ${view === k ? "bg-kj text-ink" : "text-paper/80 hover:bg-paper/10"}`}>
                {SECTIONS[k].label}
                {drafts[k] !== undefined && <span className="h-2 w-2 rounded-full bg-gold" title="Unsaved changes" />}
              </button>
            ))}
          </nav>
        ))}
        <nav className="mt-6">
          <p className="label mb-1 text-paper/40">Data</p>
          <button onClick={() => go("rsvp")} className={`w-full rounded-md px-3 py-2 text-left text-sm font-semibold ${view === "rsvp" ? "bg-kj text-ink" : "text-paper/80 hover:bg-paper/10"}`}>Spectator RSVPs</button>
        </nav>
        <div className="mt-8 border-t border-paper/15 pt-4 text-sm">
          <p className="truncate text-paper/60">{session.user.email}</p>
          <div className="mt-2 flex gap-3">
            <a href="/" target="_blank" className="font-semibold text-kj hover:underline">View site ↗</a>
            <button onClick={() => sb().auth.signOut()} className="font-semibold text-paper/80 hover:text-paper">Sign out</button>
          </div>
        </div>
      </aside>

      <main className="min-w-0">
        <header className="sticky top-0 z-30 flex flex-wrap items-center gap-3 border-b border-ink/15 bg-paper/95 px-4 py-3 backdrop-blur md:px-8">
          <button className="rounded-md bg-ink px-3 py-1.5 text-sm font-semibold text-paper lg:hidden" onClick={() => setMenuOpen(true)}>☰ Sections</button>
          <h1 className="display mr-auto text-3xl">{view === "rsvp" ? "Spectator RSVPs" : SECTIONS[view].label}</h1>
          {view !== "rsvp" && (
            <>
              <a href={SECTIONS[view].preview} target="_blank" className="rounded-md px-3 py-2 text-sm font-semibold hover:bg-ink/10">Preview ↗</a>
              {drafts[view] !== undefined && <button onClick={() => discard(view)} className="rounded-md px-3 py-2 text-sm font-semibold hover:bg-ink/10">Discard</button>}
              <button onClick={() => save(view)} disabled={drafts[view] === undefined} className="rounded-md bg-ink px-4 py-2 text-sm font-bold text-paper hover:bg-kj hover:text-ink disabled:opacity-30">Save changes</button>
            </>
          )}
        </header>

        <div className="mx-auto max-w-4xl px-4 py-6 md:px-8">
          {status && (
            <p role="status" className={`mb-5 rounded-md px-4 py-3 text-sm font-semibold ${status.kind === "err" ? "bg-stamp text-white" : status.kind === "ok" ? "bg-kj" : "bg-ink/10"}`}>{status.msg}</p>
          )}
          {view === "rsvp" ? (
            <Rsvps />
          ) : loading ? (
            <p>Loading…</p>
          ) : (
            <>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-2 text-sm text-ink/60">
                <span>{SECTIONS[view].hint ?? "Edit the fields below, then press Save changes. EN = English, ID = Bahasa Indonesia."}</span>
                <span>
                  {saved[view] ? <>Last saved {new Date(saved[view]!.updated_at).toLocaleString()}{saved[view]!.updated_by ? ` by ${saved[view]!.updated_by}` : ""} · <button onClick={() => reset(view)} className="underline hover:text-stamp">Reset to default</button></> : "Using built-in default content"}
                </span>
              </div>
              <div className="paper p-5 md:p-7">
                <Editor key={view} value={current(view)} defaults={defaults[view] as unknown as Json} onChange={(v) => setDrafts((d) => ({ ...d, [view]: v }))} />
              </div>
              {drafts[view] !== undefined && (
                <div className="sticky bottom-4 mt-6 flex justify-end">
                  <button onClick={() => save(view)} className="rounded-full bg-ink px-6 py-3 font-bold text-paper shadow-lg hover:bg-kj hover:text-ink">Save changes</button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

type RsvpRow = { id: number; name: string; email: string; city: string; party: number; news: boolean; lang: string; created_at: string };

function Rsvps() {
  const [rows, setRows] = useState<RsvpRow[] | null>(null);
  const [err, setErr] = useState("");
  const fetchRows = () => sb().from("kj_rsvp").select("*").order("created_at", { ascending: false }).limit(5000);
  const apply = useCallback(({ data, error }: Awaited<ReturnType<typeof fetchRows>>) => {
    if (error) setErr(error.message);
    else setRows(data as RsvpRow[]);
  }, []);
  const load = async () => apply(await fetchRows());
  useEffect(() => { fetchRows().then(apply); }, [apply]);

  const remove = async (id: number) => {
    if (!confirm("Delete this RSVP?")) return;
    const { error } = await sb().from("kj_rsvp").delete().eq("id", id);
    if (error) setErr(error.message);
    else load();
  };

  const csv = () => {
    if (!rows) return;
    const head = ["created_at", "name", "email", "city", "party", "news", "lang"] as const;
    const esc = (v: unknown) => `"${String(v).replace(/"/g, '""')}"`;
    const body = [head.join(","), ...rows.map((r) => head.map((h) => esc(r[h])).join(","))].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([body], { type: "text/csv" }));
    a.download = `kalcerjam-rsvp-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  if (err) return <p className="rounded-md bg-stamp px-4 py-3 text-white">{err}</p>;
  if (!rows) return <p>Loading…</p>;
  const people = rows.reduce((a, r) => a + r.party, 0);
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-4">
        <div className="paper px-5 py-3"><p className="label text-ink/60">RSVPs</p><p className="display text-4xl">{rows.length}</p></div>
        <div className="paper px-5 py-3"><p className="label text-ink/60">People</p><p className="display text-4xl">{people}</p></div>
        <div className="paper px-5 py-3"><p className="label text-ink/60">Want news</p><p className="display text-4xl">{rows.filter((r) => r.news).length}</p></div>
        <button onClick={csv} disabled={!rows.length} className="ml-auto rounded-md bg-ink px-4 py-2 text-sm font-bold text-paper disabled:opacity-30">Download CSV</button>
      </div>
      <p className="mb-4 text-sm text-ink/60">The form only saves while <b>Event settings → Rsvp open</b> is switched on.</p>
      {rows.length === 0 ? (
        <p className="paper p-6 text-ink/60">No RSVPs yet.</p>
      ) : (
        <div className="paper overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink/15 text-ink/60"><tr>{["Date", "Name", "Email", "City", "People", "News", ""].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-ink/10 last:border-0">
                  <td className="whitespace-nowrap px-4 py-2.5">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-2.5 font-semibold">{r.name}</td>
                  <td className="px-4 py-2.5">{r.email}</td>
                  <td className="px-4 py-2.5">{r.city}</td>
                  <td className="px-4 py-2.5">{r.party}</td>
                  <td className="px-4 py-2.5">{r.news ? "Yes" : "—"}</td>
                  <td className="px-4 py-2.5 text-right"><button onClick={() => remove(r.id)} className="text-ink/50 hover:text-stamp" aria-label="Delete">✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
