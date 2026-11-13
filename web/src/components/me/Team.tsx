"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { errMsg, must, sb, type Category, type Entry, type Payment, type Profile, type Role } from "./data";
import { Comp, log } from "./Comp";
import type { Site } from "./MeApp";
import { Btn, Card, Field, Notice, Pill, Stat, inputCls, useAction } from "./ui";

type Tab = "run" | "checkin" | "payments" | "dancers" | "people" | "log";

export function Team({ isAdmin }: { isAdmin: boolean; site: Site }) {
  const [tab, setTab] = useState<Tab>("run");
  const tabs: [Tab, string][] = [["run", "Competition"], ["checkin", "Check-in"], ["payments", "Payments"], ["dancers", "Dancers"], ...(isAdmin ? [["people", "Roles"] as [Tab, string]] : []), ["log", "Log"]];
  return (
    <div className="space-y-5">
      <nav className="flex flex-wrap gap-1 rounded-full bg-white p-1" aria-label="Team tools">
        {tabs.map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className={`rounded-full px-4 py-2 text-sm font-bold ${tab === k ? "bg-ink text-paper" : "hover:bg-ink/10"}`}>{label}</button>
        ))}
      </nav>
      {tab === "run" && <Comp isAdmin={isAdmin} />}
      {tab === "checkin" && <CheckIn />}
      {tab === "payments" && <Payments />}
      {tab === "dancers" && <Dancers />}
      {tab === "people" && isAdmin && <People />}
      {tab === "log" && <Log />}
    </div>
  );
}

// ---------------- Check-in ----------------

type CheckResult =
  | { kind: "none" }
  | { kind: "dancer"; first: boolean; code: string; name: string; stage_name: string; role: Role; crew: string; city: string; checked_in_at: string | null; paid: boolean; categories: string[] }
  | { kind: "spectator"; first: boolean; name: string; city: string; party: number; checked_in_at: string | null };

function CheckIn() {
  const [code, setCode] = useState("");
  const [res, setRes] = useState<{ token: string; r: CheckResult; confirmed: boolean } | null>(null);
  const [scan, setScan] = useState(false);
  const { busy, run, note } = useAction();
  const [counts, setCounts] = useState<{ dancers: number; dancersIn: number; rsvps: number; rsvpsIn: number } | null>(null);

  const loadCounts = useCallback(async () => {
    const c = (q: PromiseLike<{ count: number | null }>) => Promise.resolve(q).then((x) => x.count ?? 0);
    const [dancers, dancersIn, rsvps, rsvpsIn] = await Promise.all([
      c(sb().from("kj_payments").select("dancer_id", { count: "exact", head: true }).eq("status", "paid")),
      c(sb().from("kj_profiles").select("id", { count: "exact", head: true }).not("checked_in_at", "is", null)),
      c(sb().from("kj_rsvp").select("id", { count: "exact", head: true })),
      c(sb().from("kj_rsvp").select("id", { count: "exact", head: true }).not("checked_in_at", "is", null)),
    ]);
    setCounts({ dancers, dancersIn, rsvps, rsvpsIn });
  }, []);
  useEffect(() => { const f = setTimeout(loadCounts, 0); return () => clearTimeout(f); }, [loadCounts]);

  const lookup = (token: string) => run(async () => {
    const t = token.trim();
    if (!t) return;
    let r = (await must(sb().rpc("kj_check_in", { token: t, confirm: false }))) as CheckResult;
    let confirmed = false;
    // Paid dancers, crew and spectators go straight in; unpaid dancers need a human decision.
    if ((r.kind === "spectator" || (r.kind === "dancer" && (r.paid || r.role !== "participant"))) && r.first) {
      r = (await must(sb().rpc("kj_check_in", { token: t, confirm: true }))) as CheckResult;
      confirmed = true;
    }
    setRes({ token: t, r, confirmed });
    setCode("");
    await loadCounts();
  });
  const force = () => res && run(async () => {
    const r = (await must(sb().rpc("kj_check_in", { token: res.token, confirm: true }))) as CheckResult;
    setRes({ ...res, r, confirmed: true });
    await log("checkin.unpaid", { token: res.token });
    await loadCounts();
  });

  const r = res?.r;
  const tone = !r ? "" : r.kind === "none" ? "bg-stamp text-white" : !r.first ? "bg-gold" : r.kind === "dancer" && !r.paid && r.role === "participant" ? "bg-stamp text-white" : "bg-kj";

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-5">
        <Card title="Scan a pass">
          <form onSubmit={(e) => { e.preventDefault(); lookup(code); }} className="flex flex-wrap gap-2">
            <input autoFocus value={code} onChange={(e) => setCode(e.target.value)} placeholder="QR token or dancer ID (KJ-0042 or 42)" className={`${inputCls} flex-1`} />
            <Btn type="submit" disabled={busy}>Look up</Btn>
            <Btn kind="ghost" onClick={() => setScan((s) => !s)}>{scan ? "Stop camera" : "Use camera"}</Btn>
          </form>
          {scan && <Scanner onCode={(c) => { setScan(false); lookup(c); }} />}
          {note && <div className="mt-3">{note}</div>}
        </Card>
        {r && (
          <div className={`rounded-2xl p-6 ${tone}`}>
            {r.kind === "none" && <p className="display text-4xl">No pass found</p>}
            {r.kind === "dancer" && (
              <>
                <p className="label">{r.role === "participant" ? "Dancer" : r.role.toUpperCase()} · {r.code}</p>
                <p className="display text-5xl">{r.stage_name || r.name}</p>
                <p>{r.name}{r.crew ? ` · ${r.crew}` : ""}{r.city ? ` · ${r.city}` : ""}</p>
                {r.categories.length > 0 && <p className="mt-2 font-semibold">{r.categories.join(" · ")}</p>}
                <p className="mt-3 text-lg font-bold">
                  {!r.first ? `Already checked in ${r.checked_in_at ? new Date(r.checked_in_at).toLocaleTimeString() : ""}` : res.confirmed ? "✓ Checked in" : r.paid ? "" : "NOT PAID"}
                </p>
                {r.first && !res.confirmed && <Btn kind="ink" className="mt-3" onClick={force} disabled={busy}>Check in anyway</Btn>}
              </>
            )}
            {r.kind === "spectator" && (
              <>
                <p className="label">Spectator</p>
                <p className="display text-5xl">{r.name}</p>
                <p>{r.city} · {r.party} {r.party === 1 ? "person" : "people"}</p>
                <p className="mt-3 text-lg font-bold">{r.first ? "✓ Checked in" : `Already checked in ${r.checked_in_at ? new Date(r.checked_in_at).toLocaleTimeString() : ""}`}</p>
              </>
            )}
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 self-start lg:grid-cols-1">
        {counts && (
          <>
            <Stat label="Paid dancers" value={counts.dancers} />
            <Stat label="Dancers & crew in" value={counts.dancersIn} />
            <Stat label="Spectator passes" value={counts.rsvps} />
            <Stat label="Spectators in" value={counts.rsvpsIn} />
          </>
        )}
      </div>
    </div>
  );
}

type Detector = { detect: (v: HTMLVideoElement) => Promise<{ rawValue: string }[]> };

/** Camera QR scanner using the browser's BarcodeDetector (Chrome / Android). Others type the code. */
function Scanner({ onCode }: { onCode: (c: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [err, setErr] = useState("");
  const cb = useRef(onCode);
  useEffect(() => { cb.current = onCode; });
  useEffect(() => {
    const Ctor = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => Detector }).BarcodeDetector;
    if (!Ctor) { const f = setTimeout(() => setErr("This browser can't scan QR codes. Type the dancer ID instead, or use Chrome on Android."), 0); return () => clearTimeout(f); }
    const det = new Ctor({ formats: ["qr_code"] });
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setInterval> | null = null;
    let done = false;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then((s) => {
      stream = s;
      if (!video.current) return;
      video.current.srcObject = s;
      video.current.play();
      timer = setInterval(async () => {
        if (done || !video.current || video.current.readyState < 2) return;
        const found = await det.detect(video.current).catch(() => []);
        if (found[0]?.rawValue) { done = true; cb.current(found[0].rawValue); }
      }, 300);
    }).catch((e) => setErr(errMsg(e)));
    return () => { done = true; if (timer) clearInterval(timer); stream?.getTracks().forEach((t) => t.stop()); };
  }, []);
  return err ? <p className="mt-3 text-sm text-stamp">{err}</p> : <video ref={video} muted playsInline className="mt-3 aspect-square w-full max-w-sm rounded-xl bg-ink object-cover" />;
}

// ---------------- Payments ----------------

type PayRow = Payment & { profile?: Pick<Profile, "code" | "name" | "stage_name" | "email" | "phone"> };

function Payments() {
  const [rows, setRows] = useState<PayRow[] | null>(null);
  const [filter, setFilter] = useState<"pending" | "paid" | "rejected" | "all">("pending");
  const [err, setErr] = useState("");
  const { busy, run, note } = useAction();

  const load = useCallback(async () => {
    try {
      const pays = (await must(sb().from("kj_payments").select("*").order("submitted_at", { ascending: false }))) as Payment[];
      const ids = pays.map((p) => p.dancer_id);
      const profs = ids.length ? ((await must(sb().from("kj_profiles").select("id,code,name,stage_name,email,phone").in("id", ids))) as (Profile & { id: string })[]) : [];
      const by = new Map(profs.map((p) => [p.id, p]));
      setRows(pays.map((p) => ({ ...p, profile: by.get(p.dancer_id) })));
    } catch (e) { setErr(errMsg(e)); }
  }, []);
  useEffect(() => { const f = setTimeout(load, 0); return () => clearTimeout(f); }, [load]);

  const proof = (path: string) => run(async () => {
    const { data, error } = await sb().storage.from("kj-proofs").createSignedUrl(path, 300);
    if (error) throw new Error(error.message);
    window.open(data.signedUrl, "_blank", "noopener");
  });
  const decide = (p: PayRow, status: "paid" | "rejected" | "pending") => run(async () => {
    const note = status === "rejected" ? prompt("Reason (shown to the dancer's team only):", p.note) ?? p.note : p.note;
    await must(sb().from("kj_payments").update({ status, note }).eq("dancer_id", p.dancer_id));
    await log(`payment.${status}`, { dancer: p.profile?.code, reference: p.reference });
    await load();
  });

  if (err) return <Notice kind="err">{err}</Notice>;
  if (!rows) return <p>Loading…</p>;
  const shown = rows.filter((r) => filter === "all" || r.status === filter);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="To check" value={rows.filter((r) => r.status === "pending").length} />
        <Stat label="Paid" value={rows.filter((r) => r.status === "paid").length} />
        <Stat label="Rejected" value={rows.filter((r) => r.status === "rejected").length} />
      </div>
      <div className="flex flex-wrap gap-1">
        {(["pending", "paid", "rejected", "all"] as const).map((f) => <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1 text-sm font-bold capitalize ${filter === f ? "bg-ink text-paper" : "bg-white"}`}>{f}</button>)}
      </div>
      {note}
      <div className="paper overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink/15 text-ink/60"><tr>{["Dancer", "Method", "Reference", "Amount", "Sent", "Proof", ""].map((h) => <th key={h} className="px-3 py-2.5 font-semibold">{h}</th>)}</tr></thead>
          <tbody>
            {shown.map((p) => (
              <tr key={p.dancer_id} className="border-b border-ink/10 last:border-0">
                <td className="px-3 py-2"><b>{p.profile?.stage_name || p.profile?.name || "—"}</b><br /><span className="text-ink/55">{p.profile?.code} · {p.profile?.email}</span></td>
                <td className="px-3 py-2">{p.method}</td>
                <td className="px-3 py-2">{p.reference}{p.note && <><br /><span className="text-stamp">{p.note}</span></>}</td>
                <td className="px-3 py-2">{p.amount}</td>
                <td className="whitespace-nowrap px-3 py-2">{new Date(p.submitted_at).toLocaleString()}</td>
                <td className="px-3 py-2">{p.proof_path ? <button className="underline" onClick={() => proof(p.proof_path!)}>View</button> : "—"}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right">
                  {p.status === "pending" && <><Btn kind="kj" disabled={busy} onClick={() => decide(p, "paid")}>Confirm</Btn> <Btn kind="ghost" disabled={busy} onClick={() => decide(p, "rejected")}>Reject</Btn></>}
                  {p.status === "paid" && <span title={`by ${p.verified_by}`}><Pill tone="ok">Paid</Pill></span>}
                  {p.status === "rejected" && <Btn kind="ghost" disabled={busy} onClick={() => decide(p, "pending")}>Reopen</Btn>}
                </td>
              </tr>
            ))}
            {!shown.length && <tr><td colSpan={7} className="px-3 py-6 text-center text-ink/55">Nothing here.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------- Dancers ----------------

function Dancers() {
  const [data, setData] = useState<{ profiles: Profile[]; entries: Entry[]; payments: Payment[]; cats: Category[] } | null>(null);
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");
  const { busy, run, note } = useAction();
  const [guest, setGuest] = useState({ category: "", name: "", code: "", invited: false });

  const load = useCallback(async () => {
    try {
      const [profiles, entries, payments, cats] = await Promise.all([
        must(sb().from("kj_profiles").select("*").in("role", ["participant"]).order("dancer_no")),
        must(sb().from("kj_entries").select("*").order("id")),
        must(sb().from("kj_payments").select("*")),
        must(sb().from("kj_categories").select("*").order("sort")),
      ]);
      setData({ profiles: profiles as Profile[], entries: entries as Entry[], payments: payments as Payment[], cats: cats as Category[] });
    } catch (e) { setErr(errMsg(e)); }
  }, []);
  useEffect(() => { const f = setTimeout(load, 0); return () => clearTimeout(f); }, [load]);

  if (err) return <Notice kind="err">{err}</Notice>;
  if (!data) return <p>Loading…</p>;
  const pay = new Map(data.payments.map((p) => [p.dancer_id, p.status]));
  const catName = (s: string) => data.cats.find((c) => c.slug === s)?.name ?? s;
  const byCode = (code: string) => {
    const n = code.replace(/\D/g, "");
    return data.profiles.find((p) => p.code === `KJ-${n.padStart(4, "0")}`);
  };
  const needle = q.trim().toLowerCase();
  const shown = data.profiles.filter((p) => !needle || [p.code, p.name, p.stage_name, p.crew, p.city, p.email ?? ""].join(" ").toLowerCase().includes(needle));
  const entriesOf = (id: string) => data.entries.filter((e) => e.dancer_id === id || (e.partner_id === id && e.partner_status === "accepted"));

  const transfer = (e: Entry) => {
    const to = prompt(`Transfer ${catName(e.category)} entry to which dancer ID?`);
    if (!to) return;
    run(async () => {
      const target = byCode(to);
      if (!target) throw new Error("No dancer with that ID.");
      const from = data.profiles.find((p) => p.id === e.dancer_id);
      await must(sb().from("kj_entries").update({ dancer_id: target.id }).eq("id", e.id));
      await log("entry.transfer", { entry: e.id, category: e.category, from: from?.code ?? e.guest_name, to: target.code });
      await load();
    }, `Transferred to ${to}.`);
  };
  const setStatus = (e: Entry, status: Entry["status"]) => run(async () => {
    await must(sb().from("kj_entries").update({ status }).eq("id", e.id));
    await log(`entry.${status}`, { entry: e.id, category: e.category });
    await load();
  });
  const addGuest = (ev: React.FormEvent) => {
    ev.preventDefault();
    run(async () => {
      const target = guest.code ? byCode(guest.code) : null;
      if (guest.code && !target) throw new Error("No dancer with that ID.");
      if (!target && !guest.name.trim()) throw new Error("Give a name or a dancer ID.");
      await must(sb().from("kj_entries").insert({ category: guest.category, dancer_id: target?.id ?? null, guest_name: target ? null : guest.name.trim(), invited: guest.invited }));
      await log(guest.invited ? "entry.invited" : "entry.manual", { category: guest.category, dancer: target?.code ?? guest.name });
      setGuest({ ...guest, name: "", code: "" });
      await load();
    }, guest.invited ? "Invited dancer added." : "Dancer added.");
  };
  const csv = () => {
    const head = ["code", "stage_name", "name", "crew", "city", "country", "birth_date", "gender", "email", "phone", "instagram", "paid", "checked_in", "categories"];
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const body = [head.join(","), ...data.profiles.map((p) => [p.code, p.stage_name, p.name, p.crew, p.city, p.country, p.birth_date, p.gender, p.email, p.phone, p.instagram, pay.get(p.id) ?? "", p.checked_in_at ?? "", entriesOf(p.id).map((e) => catName(e.category)).join(" | ")].map(esc).join(","))].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([body], { type: "text/csv" }));
    a.download = `kalcerjam-dancers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };
  const guests = data.entries.filter((e) => e.invited || (!e.dancer_id && e.guest_name && !e.guest_name.startsWith("Demo · ")));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Dancers" value={data.profiles.length} />
        <Stat label="Paid" value={data.payments.filter((p) => p.status === "paid").length} />
        <Stat label="Entries" value={data.entries.filter((e) => e.status === "active").length} />
        <Stat label="Added by hand" value={guests.length} />
      </div>
      {note}
      <Card title="Add a dancer by hand" aside={<span className="text-sm text-ink/55">Walk-ins who paid at the door, or invited dancers. Counted as paid.</span>}>
        <form onSubmit={addGuest} className="grid gap-3 sm:grid-cols-4">
          <Field label="Category">
            <select required value={guest.category} onChange={(e) => setGuest({ ...guest, category: e.target.value })} className={inputCls}>
              <option value="" disabled>—</option>
              {data.cats.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Dancer ID (if they have an account)"><input value={guest.code} onChange={(e) => setGuest({ ...guest, code: e.target.value })} placeholder="KJ-0042" className={inputCls} /></Field>
          <Field label="…or name"><input value={guest.name} maxLength={120} onChange={(e) => setGuest({ ...guest, name: e.target.value })} className={inputCls} /></Field>
          <div className="flex flex-col gap-2 self-end"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={guest.invited} onChange={(e) => setGuest({ ...guest, invited: e.target.checked })} className="h-4 w-4 accent-ink" />Invited (skips prelims)</label><Btn type="submit" disabled={busy}>Add</Btn></div>
        </form>
        {guests.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2 text-sm">
            {guests.map((g) => <li key={g.id} className="rounded-full bg-paper px-3 py-1">{catName(g.category)}: <b>{g.guest_name ?? data.profiles.find((p) => p.id === g.dancer_id)?.stage_name}</b> {g.invited ? "· invited" : "· walk-in"} {g.status !== "active" && `(${g.status})`}</li>)}
          </ul>
        )}
      </Card>
      <div className="flex flex-wrap items-center gap-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, ID, crew, city, email" className={`${inputCls} max-w-md`} />
        <Btn kind="ghost" onClick={csv}>Download CSV</Btn>
      </div>
      <div className="paper overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink/15 text-ink/60"><tr>{["ID", "Dancer", "From", "Paid", "In", "Entries"].map((h) => <th key={h} className="px-3 py-2.5 font-semibold">{h}</th>)}</tr></thead>
          <tbody>
            {shown.map((p) => (
              <tr key={p.id} className="border-b border-ink/10 align-top last:border-0">
                <td className="px-3 py-2 font-bold">{p.code}</td>
                <td className="px-3 py-2"><b>{p.stage_name || "—"}</b><br /><span className="text-ink/55">{p.name}</span></td>
                <td className="px-3 py-2">{[p.crew, p.city, p.country].filter(Boolean).join(" · ")}</td>
                <td className="px-3 py-2">{pay.get(p.id) === "paid" ? <Pill tone="ok">Paid</Pill> : pay.get(p.id) ? <Pill tone="warn">{pay.get(p.id)}</Pill> : <Pill>—</Pill>}</td>
                <td className="px-3 py-2">{p.checked_in_at ? "✓" : ""}</td>
                <td className="px-3 py-2">
                  {entriesOf(p.id).map((e) => (
                    <div key={e.id} className="flex flex-wrap items-center gap-1.5 py-0.5">
                      <span className={e.status !== "active" ? "line-through opacity-50" : ""}>{catName(e.category)}{e.partner_id && e.partner_status !== "accepted" ? " (partner pending)" : ""}</span>
                      {e.dancer_id === p.id && e.status === "active" && <button disabled={busy} className="text-xs underline" onClick={() => transfer(e)}>transfer</button>}
                      {e.dancer_id === p.id && (e.status === "active"
                        ? <button disabled={busy} className="text-xs text-ink/50 underline hover:text-stamp" onClick={() => confirm("Withdraw this entry?") && setStatus(e, "withdrawn")}>withdraw</button>
                        : <button disabled={busy} className="text-xs underline" onClick={() => setStatus(e, "active")}>restore</button>)}
                    </div>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------- Roles (admins only) ----------------

const ROLES: Role[] = ["spectator", "participant", "judge", "mc", "team"];

function People() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Profile[] | null>(null);
  const { busy, run, note } = useAction();

  const search = useCallback(async (term: string) => {
    const t = term.trim().replace(/[%,()]/g, "");
    let query = sb().from("kj_profiles").select("*").order("dancer_no").limit(50);
    query = t ? query.or(`email.ilike.%${t}%,name.ilike.%${t}%,stage_name.ilike.%${t}%,code.ilike.%${t}%`) : query.in("role", ["judge", "mc", "team"]);
    setRows((await must(query)) as Profile[]);
  }, []);
  useEffect(() => { const f = setTimeout(() => search(""), 0); return () => clearTimeout(f); }, [search]);

  const setRole = (p: Profile, role: Role) => run(async () => {
    await must(sb().from("kj_profiles").update({ role }).eq("id", p.id));
    await log("role.set", { who: p.email, role });
    await search(q);
  }, `${p.email} is now ${role}.`);

  return (
    <div className="space-y-4">
      <Card title="Roles">
        <p className="mb-3 text-sm text-ink/65">Judges, MCs and team members sign in at <b>/dashboard</b> like anyone else, then you give them a role here. Leave the search empty to see the current crew.</p>
        <form onSubmit={(e) => { e.preventDefault(); run(() => search(q)); }} className="flex flex-wrap gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Email, name or dancer ID" className={`${inputCls} max-w-md`} />
          <Btn type="submit" disabled={busy}>Search</Btn>
        </form>
        {note && <div className="mt-3">{note}</div>}
      </Card>
      <div className="paper overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink/15 text-ink/60"><tr>{["ID", "Email", "Name", "Role"].map((h) => <th key={h} className="px-3 py-2.5 font-semibold">{h}</th>)}</tr></thead>
          <tbody>
            {(rows ?? []).map((p) => (
              <tr key={p.id} className="border-b border-ink/10 last:border-0">
                <td className="px-3 py-2 font-bold">{p.code}</td>
                <td className="px-3 py-2">{p.email}</td>
                <td className="px-3 py-2">{p.stage_name || p.name || "—"}</td>
                <td className="px-3 py-2">
                  <select disabled={busy} value={p.role} onChange={(e) => setRole(p, e.target.value as Role)} className="rounded border-2 border-ink px-2 py-1 font-semibold">
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
              </tr>
            ))}
            {rows && !rows.length && <tr><td colSpan={4} className="px-3 py-6 text-center text-ink/55">No one found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------- Log ----------------

function Log() {
  const [rows, setRows] = useState<{ id: number; at: string; actor: string | null; action: string; detail: Record<string, unknown> }[] | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    sb().from("kj_log").select("*").order("at", { ascending: false }).limit(300).then(({ data, error }) => (error ? setErr(error.message) : setRows(data)));
  }, []);
  if (err) return <Notice kind="err">{err}</Notice>;
  if (!rows) return <p>Loading…</p>;
  return (
    <div className="paper overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-ink/15 text-ink/60"><tr>{["When", "Who", "What", "Details"].map((h) => <th key={h} className="px-3 py-2.5 font-semibold">{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-ink/10 align-top last:border-0">
              <td className="whitespace-nowrap px-3 py-2">{new Date(r.at).toLocaleString()}</td>
              <td className="px-3 py-2">{r.actor}</td>
              <td className="px-3 py-2 font-semibold">{r.action}</td>
              <td className="px-3 py-2 font-mono text-xs">{JSON.stringify(r.detail)}</td>
            </tr>
          ))}
          {!rows.length && <tr><td colSpan={4} className="px-3 py-6 text-center text-ink/55">Nothing logged yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
