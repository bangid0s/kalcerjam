"use client";

import { useState } from "react";
import { FORMATS, PHASES, RULES, formatOf, must, sb, type Category, type Format } from "./data";
import { confirmed, log, type CompData } from "./Comp";
import { Btn, Field, Notice, Pill, inputCls, useAction } from "./ui";

/** Settings an admin can change. `smoke` is derived from `format` in the database, so it is never written. */
type Draft = { name: string; format: Format; rule: Category["rule"]; team: boolean; bracket_size: number; smoke_target: number; age_ref_date: string };

const blank: Draft = { name: "", format: "prelims_bracket", rule: "open", team: false, bracket_size: 16, smoke_target: 7, age_ref_date: "2027-07-26" };
const draftOf = (c: Category): Draft => ({ name: c.name, format: formatOf(c), rule: c.rule, team: c.team, bracket_size: c.bracket_size, smoke_target: c.smoke_target, age_ref_date: c.age_ref_date });

const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 40) || "category";

const migrationHint = (e: unknown) => {
  const m = e instanceof Error ? e.message : String(e);
  return /format/.test(m) && /column/.test(m) ? `${m} — apply migration 20261118000000_kalcerjam_category_formats.sql in Supabase first.` : m;
};

/** All categories as modules: open one to run it; admins can add, duplicate, edit, reorder and delete. */
export function Categories({ d, isAdmin, reload, open }: { d: CompData; isAdmin: boolean; reload: () => Promise<void>; open: (slug: string) => void }) {
  const cats = d.board.cats;
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [seed, setSeed] = useState<Draft>(blank);
  const { busy, run, note, setMsg } = useAction();
  const live = d.board.battles.find((b) => b.status === "live");
  const go = (fn: () => Promise<unknown>, ok?: string) => run(async () => { try { await fn(); } catch (e) { throw new Error(migrationHint(e)); } await reload(); }, ok);

  const uniqueSlug = (name: string) => {
    const base = slugify(name);
    let s = base, i = 2;
    while (cats.some((c) => c.slug === s)) s = `${base}-${i++}`;
    return s;
  };

  const create = (x: Draft) => go(async () => {
    const slug = uniqueSlug(x.name);
    await must(sb().from("kj_categories").insert({ slug, ...x, sort: Math.max(0, ...cats.map((c) => c.sort)) + 1 }));
    await log("category.create", { category: slug, ...x });
    setEditing(null);
  }, `“${x.name}” added. Turn on Registration open when you're ready.`);

  const save = (c: Category, x: Draft) => go(async () => {
    await must(sb().from("kj_categories").update(x).eq("slug", c.slug));
    await log("category.update", { category: c.slug, ...x });
    setEditing(null);
  }, "Saved.");

  const duplicate = (c: Category) => { setSeed({ ...draftOf(c), name: `${c.name} (copy)` }); setEditing("new"); setMsg(null); };

  const remove = (c: Category) => {
    const n = d.entries.filter((e) => e.category === c.slug).length;
    if (n > 0) {
      const typed = prompt(`${c.name} has ${n} entr${n === 1 ? "y" : "ies"}. Deleting it also deletes those entries, heats, scores, votes and results.\n\nType the category name to delete it:`);
      if (typed?.trim() !== c.name) return;
    } else if (!confirm(`Delete ${c.name}?`)) return;
    go(async () => {
      await must(sb().from("kj_categories").delete().eq("slug", c.slug));
      await log("category.delete", { category: c.slug, entries: n });
    }, `${c.name} deleted.`);
  };

  const move = (i: number, dir: -1 | 1) => {
    if (!cats[i + dir]) return;
    const order = [...cats];
    [order[i], order[i + dir]] = [order[i + dir], order[i]];
    go(async () => {
      // Renumber 1..n so equal sort values can't get stuck.
      for (const [k, c] of order.entries()) if (c.sort !== k + 1) await must(sb().from("kj_categories").update({ sort: k + 1 }).eq("slug", c.slug));
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="display text-3xl">Categories</h2>
          <p className="text-sm text-ink/60">Each category is a module with its own format. Tap one to run it.</p>
        </div>
        {isAdmin && editing !== "new" && <Btn onClick={() => { setSeed(blank); setEditing("new"); setMsg(null); }}>+ New category</Btn>}
      </div>
      {note}

      {editing === "new" && (
        <Editor title="New category" initial={seed} busy={busy} onCancel={() => setEditing(null)} onSave={create} />
      )}

      <ul className="grid gap-3 md:grid-cols-2">
        {cats.map((c, i) => {
          const f = formatOf(c);
          const conf = confirmed(d, c).length;
          const all = d.entries.filter((e) => e.category === c.slug && e.status === "active").length;
          if (editing === c.slug) {
            return (
              <li key={c.slug} className="md:col-span-2">
                <Editor title={`Edit ${c.name}`} initial={draftOf(c)} busy={busy} formatLocked={c.phase !== "setup"} onCancel={() => setEditing(null)} onSave={(x) => save(c, x)} />
              </li>
            );
          }
          return (
            <li key={c.slug} className={`flex flex-col rounded-2xl bg-white ${live?.category === c.slug ? "ring-4 ring-stamp" : ""}`}>
              <button onClick={() => open(c.slug)} className="flex-1 p-4 text-left hover:bg-kj/20">
                <span className="flex items-start justify-between gap-2">
                  <span className="display text-2xl leading-tight">{c.name}</span>
                  <span className="text-xl">›</span>
                </span>
                <span className="mt-2 flex flex-wrap gap-1">
                  <Pill tone="ink">{FORMATS[f].short}</Pill>
                  <Pill tone={c.phase === "setup" ? "muted" : c.phase === "finished" ? "ok" : "warn"}>{c.phase === "smoke" ? "Running" : PHASES[c.phase]}</Pill>
                  {c.team && <Pill>2vs2</Pill>}
                  {c.rule !== "open" && <Pill>{RULES[c.rule]}</Pill>}
                  {c.registration_open && c.phase === "setup" && <Pill tone="ok">Registration open</Pill>}
                  {live?.category === c.slug && <Pill tone="live">LIVE</Pill>}
                </span>
                <span className="mt-2 block text-sm text-ink/60">{conf} ready to battle · {all} entered</span>
              </button>
              {isAdmin && (
                <div className="flex flex-wrap items-center gap-1 border-t border-ink/10 px-3 py-2 text-sm font-semibold">
                  <button disabled={busy} onClick={() => { setEditing(c.slug); setMsg(null); }} className="rounded-full px-3 py-1.5 hover:bg-ink/10">Edit</button>
                  <button disabled={busy} onClick={() => duplicate(c)} className="rounded-full px-3 py-1.5 hover:bg-ink/10">Duplicate</button>
                  <button disabled={busy} onClick={() => remove(c)} className="rounded-full px-3 py-1.5 text-stamp hover:bg-stamp/10">Delete</button>
                  <span className="ml-auto flex">
                    <button disabled={busy || i === 0} onClick={() => move(i, -1)} className="rounded-full px-2.5 py-1.5 hover:bg-ink/10 disabled:opacity-20" aria-label={`Move ${c.name} up`}>↑</button>
                    <button disabled={busy || i === cats.length - 1} onClick={() => move(i, 1)} className="rounded-full px-2.5 py-1.5 hover:bg-ink/10 disabled:opacity-20" aria-label={`Move ${c.name} down`}>↓</button>
                  </span>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {!cats.length && <Notice kind="info">No categories yet.{isAdmin ? " Press + New category." : ""}</Notice>}
      {isAdmin && <p className="text-xs text-ink/50">The public website text for a category (prize, day, description) is edited in the Site editor under the same name.</p>}
    </div>
  );
}

function Editor({ title, initial, busy, formatLocked = false, onSave, onCancel }: {
  title: string; initial: Draft; busy: boolean; formatLocked?: boolean; onSave: (x: Draft) => void; onCancel: () => void;
}) {
  const [x, setX] = useState<Draft>(initial);
  const set = (p: Partial<Draft>) => setX({ ...x, ...p });
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (x.name.trim()) onSave({ ...x, name: x.name.trim() }); }} className="space-y-4 rounded-2xl border-2 border-ink bg-white p-4 md:p-5">
      <p className="display text-2xl">{title}</p>
      <Field label="Name"><input required value={x.name} onChange={(e) => set({ name: e.target.value })} className={inputCls} placeholder="e.g. Popping 1vs1" /></Field>

      <fieldset>
        <legend className="mb-1 text-sm font-semibold">Format</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {(Object.keys(FORMATS) as Format[]).map((f) => (
            <label key={f} className={`cursor-pointer rounded-xl border-2 p-3 ${x.format === f ? "border-ink bg-kj" : "border-ink/15"} ${formatLocked ? "cursor-not-allowed opacity-60" : ""}`}>
              <input type="radio" name="format" className="sr-only" disabled={formatLocked} checked={x.format === f} onChange={() => set({ format: f })} />
              <span className="block font-black">{FORMATS[f].name}</span>
              <span className="mt-1 block text-xs text-ink/70">{FORMATS[f].about}</span>
            </label>
          ))}
        </div>
        {formatLocked && <p className="mt-1 text-xs text-ink/55">The format is locked once the category has started. Reset the category to change it.</p>}
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Who can enter">
          <select value={x.rule} onChange={(e) => set({ rule: e.target.value as Draft["rule"] })} className={inputCls}>
            {(Object.keys(RULES) as Draft["rule"][]).map((r) => <option key={r} value={r}>{RULES[r]}</option>)}
          </select>
        </Field>
        <Field label="Battle type">
          <select value={x.team ? "team" : "solo"} onChange={(e) => set({ team: e.target.value === "team" })} className={inputCls}>
            <option value="solo">Solo (1vs1)</option>
            <option value="team">Team (2vs2)</option>
          </select>
        </Field>
        {x.format === "smoke" ? (
          <Field label="Points to win" hint="First to this many points is King.">
            <input type="number" min={1} max={20} value={x.smoke_target} onChange={(e) => set({ smoke_target: Number(e.target.value) })} className={inputCls} />
          </Field>
        ) : (
          <Field label="Biggest bracket" hint="Smaller fields get the next size down automatically.">
            <select value={x.bracket_size} onChange={(e) => set({ bracket_size: Number(e.target.value) })} className={inputCls}>
              {[4, 8, 16, 32].map((n) => <option key={n} value={n}>Top {n}</option>)}
            </select>
          </Field>
        )}
        {(x.rule === "u12" || x.rule === "o35") && (
          <Field label="Age counted on" hint="Dancers' age is checked on this date.">
            <input type="date" value={x.age_ref_date} onChange={(e) => set({ age_ref_date: e.target.value })} className={inputCls} />
          </Field>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Btn type="submit" disabled={busy || !x.name.trim()}>{busy ? "Saving…" : "Save"}</Btn>
        <Btn kind="ghost" onClick={onCancel}>Cancel</Btn>
      </div>
    </form>
  );
}
