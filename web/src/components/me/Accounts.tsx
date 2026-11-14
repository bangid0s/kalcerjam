"use client";

import { useCallback, useEffect, useState } from "react";
import { errMsg, sb, type Role } from "./data";
import { Btn, Field, Notice, Pill, Stat, inputCls, useAction } from "./ui";

// Super admins only. All writes go through the kj-admin-users Edge Function, which holds the
// Supabase service-role key on the server and checks that the caller is a super admin.

type Account = {
  id: string; email: string; created_at: string; last_sign_in_at: string | null; banned: boolean;
  code: string | null; role: Role; name: string; stage_name: string; admin: boolean; super: boolean;
};

const ROLES: Role[] = ["spectator", "participant", "judge", "mc", "team"];
const ROLE_LABEL: Record<Role, string> = { spectator: "Spectator", participant: "Dancer", judge: "Judge", mc: "MC", team: "Team" };

async function call<T = { ok: true }>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await sb().functions.invoke("kj-admin-users", { body });
  if (error) {
    // Pull the function's own message out of the HTTP error when there is one.
    const ctx = (error as { context?: Response }).context;
    const msg = ctx && typeof ctx.json === "function" ? await ctx.json().then((j: { error?: string }) => j.error).catch(() => null) : null;
    throw new Error(msg || error.message);
  }
  if (data?.error) throw new Error(data.error);
  return data as T;
}

/** A readable random password: 12 characters, no look-alikes. */
function makePassword() {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const buf = new Uint32Array(12);
  crypto.getRandomValues(buf);
  return Array.from(buf, (n) => chars[n % chars.length]).join("");
}

export function Accounts() {
  const [rows, setRows] = useState<Account[] | null>(null);
  const [me, setMe] = useState("");
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "crew" | Role>("all");
  const [editing, setEditing] = useState<Account | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await call<{ me: string; users: Account[] }>({ action: "list" });
      setRows(r.users);
      setMe(r.me);
      setErr("");
    } catch (e) { setErr(errMsg(e)); }
  }, []);
  useEffect(() => { const f = setTimeout(load, 0); return () => clearTimeout(f); }, [load]);

  if (err) return <Notice kind="err">{err}</Notice>;
  if (!rows) return <p>Loading accounts…</p>;

  const needle = q.trim().toLowerCase();
  const shown = rows.filter((a) =>
    (filter === "all" || (filter === "crew" ? a.admin || ["judge", "mc", "team"].includes(a.role) : a.role === filter)) &&
    (!needle || [a.email, a.name, a.stage_name, a.code ?? ""].join(" ").toLowerCase().includes(needle)));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Accounts" value={rows.length} />
        <Stat label="Admins" value={rows.filter((a) => a.admin).length} />
        <Stat label="Judges" value={rows.filter((a) => a.role === "judge").length} />
        <Stat label="Dancers" value={rows.filter((a) => a.role === "participant").length} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Btn kind="kj" onClick={() => setCreating(true)} className="!py-3 !text-base">+ New account</Btn>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search email, name or dancer ID" className={`${inputCls} max-w-sm flex-1`} />
      </div>
      <div className="-mx-4 flex gap-1 overflow-x-auto px-4">
        {(["all", "crew", ...ROLES] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-bold ${filter === f ? "bg-ink text-paper" : "bg-white"}`}>
            {f === "all" ? "All" : f === "crew" ? "Crew & admins" : ROLE_LABEL[f]}
          </button>
        ))}
      </div>

      <ul className="space-y-2">
        {shown.map((a) => (
          <li key={a.id}>
            <button onClick={() => setEditing(a)} className={`flex w-full items-center justify-between gap-3 rounded-2xl bg-white p-4 text-left hover:ring-2 hover:ring-ink ${a.banned ? "opacity-50" : ""}`}>
              <span className="min-w-0">
                <span className="block truncate font-bold">{a.email}{a.id === me && <span className="ml-1 text-ink/50">(you)</span>}</span>
                <span className="block truncate text-sm text-ink/60">{[a.code, a.stage_name || a.name].filter(Boolean).join(" · ") || "—"} · last sign-in {a.last_sign_in_at ? new Date(a.last_sign_in_at).toLocaleDateString() : "never"}</span>
              </span>
              <span className="flex shrink-0 flex-wrap justify-end gap-1">
                {a.super ? <Pill tone="ink">Super admin</Pill> : a.admin ? <Pill tone="ink">Admin</Pill> : null}
                <Pill tone={a.role === "spectator" ? "muted" : "ok"}>{ROLE_LABEL[a.role]}</Pill>
                {a.banned && <Pill tone="live">Blocked</Pill>}
              </span>
            </button>
          </li>
        ))}
        {!shown.length && <li className="rounded-2xl bg-white p-6 text-center text-ink/55">No accounts match.</li>}
      </ul>

      {creating && <CreateDialog onClose={() => setCreating(false)} onDone={async () => { setCreating(false); await load(); }} />}
      {editing && <EditDialog acc={editing} isMe={editing.id === me} onClose={() => setEditing(null)} onDone={async () => { setEditing(null); await load(); }} />}
    </div>
  );
}

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 sm:items-center sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-paper p-5 sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="display text-3xl">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="grid h-10 w-10 place-items-center rounded-full bg-white text-xl">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function RolePicker({ value, onChange }: { value: Role; onChange: (r: Role) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
      {ROLES.map((r) => (
        <button key={r} type="button" onClick={() => onChange(r)} aria-pressed={value === r}
          className={`min-h-11 rounded-xl px-2 text-sm font-bold ${value === r ? "bg-ink text-paper" : "bg-white"}`}>{ROLE_LABEL[r]}</button>
      ))}
    </div>
  );
}

function PasswordField({ value, onChange, label, placeholder }: { value: string; onChange: (v: string) => void; label: string; placeholder?: string }) {
  const [show, setShow] = useState(true);
  return (
    <Field label={label} hint="At least 8 characters. Share it with the person privately (e.g. WhatsApp).">
      <div className="flex gap-2">
        <input type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoComplete="new-password" className={`${inputCls} flex-1 font-mono`} />
        <button type="button" onClick={() => setShow(!show)} className="rounded-md bg-white px-3 text-sm font-bold">{show ? "Hide" : "Show"}</button>
        <button type="button" onClick={() => { onChange(makePassword()); setShow(true); }} className="rounded-md bg-white px-3 text-sm font-bold">Generate</button>
      </div>
    </Field>
  );
}

function CreateDialog({ onClose, onDone }: { onClose: () => void; onDone: () => Promise<void> }) {
  const [f, setF] = useState({ email: "", password: makePassword(), name: "", role: "judge" as Role, admin: false });
  const { busy, run, note } = useAction();
  const [made, setMade] = useState<{ email: string; password: string } | null>(null);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      await call({ action: "create", ...f });
      setMade({ email: f.email.trim().toLowerCase(), password: f.password });
    });
  };
  if (made) {
    const text = `Kalcer Jam login\n${location.origin}/dashboard\nEmail: ${made.email}\nPassword: ${made.password}`;
    return (
      <Dialog title="Account created" onClose={onDone}>
        <p className="text-ink/70">Send these to the person. They sign in at <b>/dashboard</b> → <b>Password</b>.</p>
        <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-white p-4 font-mono text-sm">{text}</pre>
        <div className="mt-4 flex gap-2">
          <Btn onClick={() => navigator.clipboard?.writeText(text)} className="!py-3">Copy</Btn>
          <Btn kind="ghost" onClick={onDone} className="!py-3">Done</Btn>
        </div>
      </Dialog>
    );
  }
  return (
    <Dialog title="New account" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email"><input required type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className={inputCls} autoComplete="off" /></Field>
        <PasswordField label="Password" value={f.password} onChange={(password) => setF({ ...f, password })} />
        <Field label="Name (optional)"><input value={f.name} maxLength={120} onChange={(e) => setF({ ...f, name: e.target.value })} className={inputCls} /></Field>
        <div><span className="mb-1 block text-sm font-semibold">Role</span><RolePicker value={f.role} onChange={(role) => setF({ ...f, role })} /></div>
        <label className="flex items-center gap-3 rounded-xl bg-white p-3">
          <input type="checkbox" checked={f.admin} onChange={(e) => setF({ ...f, admin: e.target.checked })} className="h-5 w-5 accent-ink" />
          <span><b>Admin</b><span className="block text-sm text-ink/60">Runs the event and competition, check-in, payments and roles. Can&apos;t edit the website.</span></span>
        </label>
        {note}
        <Btn type="submit" disabled={busy || f.password.length < 8} className="w-full !py-4 !text-base">{busy ? "Creating…" : "Create account"}</Btn>
      </form>
    </Dialog>
  );
}

function EditDialog({ acc, isMe, onClose, onDone }: { acc: Account; isMe: boolean; onClose: () => void; onDone: () => Promise<void> }) {
  const [f, setF] = useState({ email: acc.email, password: "", name: acc.name, role: acc.role, admin: acc.admin, super: acc.super, banned: acc.banned });
  const { busy, run, note } = useAction();
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      const body: Record<string, unknown> = { action: "update", id: acc.id };
      if (f.email.trim().toLowerCase() !== acc.email) body.email = f.email;
      if (f.password) body.password = f.password;
      if (f.name !== acc.name) body.name = f.name;
      if (f.role !== acc.role) body.role = f.role;
      if (f.admin !== acc.admin) body.admin = f.admin;
      if (f.super !== acc.super) body.super = f.super;
      if (f.banned !== acc.banned) body.banned = f.banned;
      await call(body);
      await onDone();
    });
  };
  const remove = () => {
    if (!confirm(`Delete ${acc.email}? This removes the login, the profile, their entries, payments and scores. It can't be undone.`)) return;
    if (prompt(`Type DELETE to confirm deleting ${acc.email}`) !== "DELETE") return;
    run(async () => { await call({ action: "delete", id: acc.id }); await onDone(); });
  };
  return (
    <Dialog title="Edit account" onClose={onClose}>
      <form onSubmit={save} className="space-y-4">
        <p className="text-sm text-ink/60">{acc.code ?? ""} · created {new Date(acc.created_at).toLocaleDateString()}{isMe ? " · this is you" : ""}</p>
        <Field label="Email"><input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className={inputCls} /></Field>
        <PasswordField label="New password (leave empty to keep)" value={f.password} placeholder="unchanged" onChange={(password) => setF({ ...f, password })} />
        <Field label="Name"><input value={f.name} maxLength={120} onChange={(e) => setF({ ...f, name: e.target.value })} className={inputCls} /></Field>
        <div><span className="mb-1 block text-sm font-semibold">Role</span><RolePicker value={f.role} onChange={(role) => setF({ ...f, role })} /></div>
        <div className="space-y-2 rounded-xl bg-white p-3">
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={f.admin} disabled={isMe} onChange={(e) => setF({ ...f, admin: e.target.checked, super: e.target.checked && f.super })} className="h-5 w-5 accent-ink" />
            <span><b>Admin</b> <span className="text-sm text-ink/60">run the event &amp; competition</span></span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={f.super} disabled={isMe || !f.admin} onChange={(e) => setF({ ...f, super: e.target.checked })} className="h-5 w-5 accent-ink" />
            <span><b>Super admin</b> <span className="text-sm text-ink/60">also edit the website &amp; manage accounts</span></span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={f.banned} disabled={isMe} onChange={(e) => setF({ ...f, banned: e.target.checked })} className="h-5 w-5 accent-ink" />
            <span><b>Blocked</b> <span className="text-sm text-ink/60">can&apos;t sign in</span></span>
          </label>
        </div>
        {note}
        <Btn type="submit" disabled={busy || (!!f.password && f.password.length < 8)} className="w-full !py-4 !text-base">{busy ? "Saving…" : "Save changes"}</Btn>
        {!isMe && <button type="button" onClick={remove} disabled={busy} className="w-full rounded-full py-3 font-bold text-stamp hover:bg-stamp hover:text-white">Delete account</button>}
      </form>
    </Dialog>
  );
}
