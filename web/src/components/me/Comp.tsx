"use client";

import { useState } from "react";
import {
  bracketSizeFor, firstRound, nextSlot, prelimPairs, propagate, rankPrelims, roundCount, roundLabel,
  smokeApply, smokeBattle, smokeLeaders, smokeStart, type Pairing, type Smoke,
} from "@/lib/tournament";
import { entryName, loadBoard, must, runOrder, sb, tallyFor, useLive, PHASES, type Battle, type Board, type Category, type Entry, type Payment, type ScoreRow, type Vote } from "./data";
import { BracketView, SmokeView } from "./boards";
import { Btn, Card, Notice, Pill, useAction } from "./ui";

export type CompData = { board: Board; entries: Entry[]; payments: Payment[]; scores: ScoreRow[]; votes: Vote[] };

export async function loadComp(): Promise<CompData> {
  const [board, entries, payments, scores, votes] = await Promise.all([
    loadBoard(),
    must(sb().from("kj_entries").select("*").order("id")),
    must(sb().from("kj_payments").select("*")),
    must(sb().from("kj_scores").select("*")),
    must(sb().from("kj_votes").select("*")),
  ]);
  // The panel is everyone with the judge role, and never fewer than the judges who actually scored or voted.
  const active = new Set([...(scores as ScoreRow[]).map((x) => x.judge_id), ...(votes as Vote[]).map((x) => x.judge_id)]);
  board.judges = Math.max(board.judges, active.size);
  return { board, entries: entries as Entry[], payments: payments as Payment[], scores: scores as ScoreRow[], votes: votes as Vote[] };
}

export const log = (action: string, detail: Record<string, unknown>) => sb().from("kj_log").insert({ action, detail }).then(() => undefined);

/** Entry added by the team by name (walk-in paid at the door, or demo data): no account, counts as paid. */
export const isManual = (e: Entry) => !e.dancer_id && !!e.guest_name;

/** Why an entry can or can't battle yet. */
export function entryState(d: CompData, cat: Category, e: Entry): "invited" | "walk-in" | "confirmed" | "unpaid" | "partner" {
  if (e.invited) return "invited";
  if (isManual(e)) return "walk-in";
  const paid = new Set(d.payments.filter((p) => p.status === "paid").map((p) => p.dancer_id));
  if (!e.dancer_id || !paid.has(e.dancer_id)) return "unpaid";
  if (cat.team && (!e.partner_id || e.partner_status !== "accepted")) return "partner";
  if (cat.team && !paid.has(e.partner_id!)) return "unpaid";
  return "confirmed";
}

/** Paid, invited or walk-in entries that can actually battle. 2vs2 needs an accepted, paid partner too. */
export function confirmed(d: CompData, cat: Category): Entry[] {
  return d.entries.filter((e) => e.category === cat.slug && e.status === "active" && entryState(d, cat, e) !== "unpaid" && entryState(d, cat, e) !== "partner");
}

/** Put one battle on stage (anything else live goes back to the queue). */
export async function putOnStage(b: Battle | null) {
  await must(sb().from("kj_battles").update({ status: "pending" }).eq("status", "live").neq("id", b?.id ?? -1));
  if (b) await must(sb().from("kj_battles").update({ status: "live" }).eq("id", b.id));
}

export function Comp({ isAdmin = false, initial = null }: { isAdmin?: boolean; initial?: string | null }) {
  const { data, error, reload } = useLive(loadComp, ["kj_battles", "kj_smoke", "kj_categories", "kj_votes", "kj_scores", "kj_entries"], 8000);
  const [slug, setSlug] = useState<string | null>(initial);
  if (error) return <Notice kind="err">{error}</Notice>;
  if (!data) return <p>Loading…</p>;
  const cat = data.board.cats.find((c) => c.slug === slug) ?? data.board.cats[0];
  const live = data.board.battles.find((b) => b.status === "live");
  if (!cat) return <Notice kind="info">No categories yet.</Notice>;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {data.board.cats.map((c) => (
          <button key={c.slug} onClick={() => setSlug(c.slug)} className={`rounded-full px-3 py-1.5 text-sm font-bold ${c.slug === cat.slug ? "bg-ink text-paper" : "bg-white"}`}>
            {c.name} <span className="ml-1 opacity-60">{PHASES[c.phase]}</span>
            {live?.category === c.slug && <span className="ml-1 inline-block h-2 w-2 rounded-full bg-stamp" />}
          </button>
        ))}
      </div>
      {live && (
        <Notice kind="info">
          On stage: <b>{data.board.cats.find((c) => c.slug === live.category)?.name}</b> — {entryName(data.board, live.a_entry)}{live.b_entry ? ` vs ${entryName(data.board, live.b_entry)}` : ""}{" "}
          <button className="underline" onClick={() => putOnStage(null).then(reload)}>Take off stage</button>
        </Notice>
      )}
      <CategoryPanel key={cat.slug} d={data} cat={cat} reload={reload} />
      <Roster d={data} cat={cat} />
      {isAdmin && <DemoData d={data} reload={reload} />}
    </div>
  );
}

function CategoryPanel({ d, cat, reload }: { d: CompData; cat: Category; reload: () => Promise<void> }) {
  const { busy, run, note } = useAction();
  const conf = confirmed(d, cat);
  const all = d.entries.filter((e) => e.category === cat.slug && e.status === "active");
  const battles = d.board.battles.filter((b) => b.category === cat.slug);
  const go = (fn: () => Promise<unknown>, ok?: string) => run(async () => { await fn(); await reload(); }, ok);
  const setCat = (patch: Partial<Category>) => go(async () => {
    await must(sb().from("kj_categories").update(patch).eq("slug", cat.slug));
    await log("category.update", { category: cat.slug, ...patch });
  });

  const reset = () => {
    if (!confirm(`Reset ${cat.name}? This deletes its heats, scores, votes, bracket and 7 to Smoke board, and puts it back to registration. Entries and payments stay.`)) return;
    go(async () => {
      const ids = all.map((e) => e.id);
      await must(sb().from("kj_battles").delete().eq("category", cat.slug));
      await must(sb().from("kj_smoke").delete().eq("category", cat.slug));
      if (ids.length) {
        await must(sb().from("kj_scores").delete().in("entry_id", ids));
        await must(sb().from("kj_entries").update({ seed: null }).in("id", ids));
      }
      await must(sb().from("kj_categories").update({ phase: "setup", results_published: false }).eq("slug", cat.slug));
      await log("category.reset", { category: cat.slug });
    }, "Category reset.");
  };

  const startPrelims = () => go(() => drawPrelims(d, cat), "Prelim heats drawn.");

  return (
    <div className="space-y-5">
      <Card title={cat.name} aside={<Pill tone="ink">{PHASES[cat.phase]}</Pill>}>
        {note && <div className="mb-3">{note}</div>}
        <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <Toggle label="Registration open" on={cat.registration_open} onClick={() => setCat({ registration_open: !cat.registration_open })} disabled={busy} />
          <Toggle label="Dancers can see their scores" on={cat.results_published} onClick={() => setCat({ results_published: !cat.results_published })} disabled={busy} />
          {cat.smoke ? (
            <>
              <NumberSetting label="Prelim qualifiers" value={cat.smoke_qualifiers} min={0} max={16} disabled={busy || cat.phase !== "setup" && cat.phase !== "prelims"} onSave={(v) => setCat({ smoke_qualifiers: v })} />
              <NumberSetting label="Points to win" value={cat.smoke_target} min={1} max={20} disabled={busy || cat.phase === "smoke"} onSave={(v) => setCat({ smoke_target: v })} />
            </>
          ) : (
            <label className="flex items-center gap-2"><span className="font-semibold">Max bracket</span>
              <select disabled={busy || cat.phase === "bracket" || cat.phase === "finished"} value={cat.bracket_size} onChange={(e) => setCat({ bracket_size: Number(e.target.value) })} className="rounded border-2 border-ink px-2 py-1">
                {[4, 8, 16, 32].map((n) => <option key={n} value={n}>Top {n}</option>)}
              </select>
            </label>
          )}
        </div>
        <p className="mt-4 text-sm text-ink/70">
          <b>{conf.length}</b> confirmed of <b>{all.length}</b> entries{cat.team ? " (teams)" : ""}.{" "}
          {all.length > conf.length && <>Unpaid or incomplete entries don&apos;t get drawn — check the Payments tab.</>}
          {conf.some((e) => e.invited) && <> Includes {conf.filter((e) => e.invited).length} invited.</>}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {cat.phase === "setup" && (
            <>
              <Btn disabled={busy} onClick={startPrelims}>Draw prelim heats</Btn>
              {cat.smoke ? <SmokeLineup d={d} cat={cat} pool={conf.map((e) => e.id)} reload={reload} label="Skip prelims → 7 to Smoke" /> : <Btn kind="ghost" disabled={busy} onClick={() => go(() => buildBracket(cat, shuffle(conf.map((e) => e.id))), "Bracket built with a random draw.")}>Skip prelims → random bracket</Btn>}
            </>
          )}
          <Btn kind="danger" disabled={busy || cat.phase === "setup" && !battles.length} onClick={reset}>Reset category</Btn>
        </div>
      </Card>

      {cat.phase === "prelims" && <Prelims d={d} cat={cat} reload={reload} />}
      {(cat.phase === "bracket" || (cat.phase === "finished" && !cat.smoke)) && <BracketRun d={d} cat={cat} reload={reload} />}
      {(cat.phase === "smoke" || (cat.phase === "finished" && cat.smoke)) && <SmokeRun d={d} cat={cat} reload={reload} />}
    </div>
  );
}

function Toggle({ label, on, onClick, disabled }: { label: string; on: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} className="flex items-center gap-2 text-left disabled:opacity-40" role="switch" aria-checked={on}>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-ink" : "bg-ink/20"}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? "left-[1.4rem]" : "left-0.5"}`} /></span>
      <span className="font-semibold">{label}</span>
    </button>
  );
}

function NumberSetting({ label, value, min, max, onSave, disabled }: { label: string; value: number; min: number; max: number; onSave: (v: number) => void; disabled?: boolean }) {
  const [v, setV] = useState(value);
  return (
    <label className="flex items-center gap-2"><span className="font-semibold">{label}</span>
      <input type="number" min={min} max={max} value={v} disabled={disabled} onChange={(e) => setV(Number(e.target.value))} onBlur={() => v !== value && v >= min && v <= max && onSave(v)} className="w-16 rounded border-2 border-ink px-2 py-1" />
    </label>
  );
}

const shuffle = <X,>(xs: X[]) => {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

// ---------------- Prelims ----------------

function Prelims({ d, cat, reload }: { d: CompData; cat: Category; reload: () => Promise<void> }) {
  const { busy, run, note } = useAction();
  const heats = d.board.battles.filter((b) => b.category === cat.slug && b.kind === "prelim").sort((x, y) => x.slot - y.slot);
  const ids = [...new Set(heats.flatMap((h) => [h.a_entry, h.b_entry]).filter((x): x is number => !!x))];
  const ranked = rankPrelims(ids, d.scores.filter((s) => ids.includes(s.entry_id)));
  const panel = Math.max(d.board.judges, 1);
  const go = (fn: () => Promise<unknown>, ok?: string) => run(async () => { await fn(); await reload(); }, ok);
  const invited = confirmed(d, cat).filter((e) => e.invited).map((e) => e.id);
  const cut = cat.smoke ? cat.smoke_qualifiers : bracketSizeFor(ranked.length, cat.bracket_size);
  const missing = ranked.filter((r) => r.judges < panel).length;

  const saveSeeds = () => go(async () => {
    const top = ranked.slice(0, cut).map((r) => r.entry);
    for (const [i, id] of top.entries()) await must(sb().from("kj_entries").update({ seed: i + 1 }).eq("id", id));
    await log("prelims.lock", { category: cat.slug, qualified: top });
  });

  const build = () => {
    if (missing && !confirm(`${missing} dancer(s) don't have scores from every judge yet. Build anyway?`)) return;
    const cutTie = ranked[cut - 1] && ranked[cut] && ranked[cut - 1].total === ranked[cut].total && ranked[cut - 1].rank === ranked[cut].rank;
    if (cutTie && !confirm("There's a tie on the cut line. Build anyway (lower entry id goes through)? You may prefer a tie-break showcase first.")) return;
    go(async () => {
      const top = ranked.slice(0, cut).map((r) => r.entry);
      for (const [i, id] of top.entries()) await must(sb().from("kj_entries").update({ seed: i + 1 }).eq("id", id));
      await log("prelims.lock", { category: cat.slug, qualified: top });
      if (!cat.smoke) await buildBracket(cat, top);
    }, cat.smoke ? "Seeds saved. Set the 7 to Smoke line below." : "Bracket built.");
  };

  return (
    <>
      <Card title="Prelim heats" aside={<span className="text-sm text-ink/60">Panel: {d.board.judges} judge{d.board.judges === 1 ? "" : "s"}</span>}>
        {note && <div className="mb-3">{note}</div>}
        <ul className="divide-y divide-ink/10">
          {heats.map((h) => {
            const hid = [h.a_entry, h.b_entry].filter((x): x is number => !!x);
            const got = Math.min(...hid.map((id) => d.scores.filter((s) => s.entry_id === id).length));
            return (
              <li key={h.id} className={`flex flex-wrap items-center justify-between gap-2 py-2 ${h.status === "live" ? "-mx-2 rounded bg-stamp/10 px-2" : ""}`}>
                <span><span className="text-sm text-ink/55">Heat {h.slot}</span> <b>{hid.map((id) => entryName(d.board, id)).join(" vs ")}</b>{hid.length === 1 && <span className="text-ink/55"> (solo)</span>}</span>
                <span className="flex flex-wrap items-center gap-2">
                  <Pill tone={got >= panel ? "ok" : "warn"}>{got}/{panel} scored</Pill>
                  {h.status === "live" ? <Pill tone="live">LIVE</Pill> : h.status === "done" ? <Pill>Done</Pill> : null}
                  {h.status !== "live" && <Btn kind="ghost" disabled={busy} onClick={() => go(() => putOnStage(h))}>On stage</Btn>}
                  {h.status !== "done" && <Btn disabled={busy} onClick={() => go(() => must(sb().from("kj_battles").update({ status: "done" }).eq("id", h.id)))}>Done</Btn>}
                  {h.status === "done" && <button className="text-sm underline" disabled={busy} onClick={() => go(() => must(sb().from("kj_battles").update({ status: "pending" }).eq("id", h.id)))}>Reopen</button>}
                </span>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card title="Prelim ranking" aside={<span className="text-sm text-ink/60">Crew only. Never shown publicly.</span>}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-ink/55"><tr><th className="py-1 pr-2">#</th><th className="pr-2">Dancer</th><th className="pr-2">Mind</th><th className="pr-2">Body</th><th className="pr-2">Soul</th><th className="pr-2">Total</th><th>Judges</th></tr></thead>
            <tbody>
              {ranked.map((r, i) => (
                <tr key={r.entry} className={`border-t border-ink/10 ${i < cut ? "bg-kj/30" : ""} ${i === cut - 1 ? "border-b-4 border-b-ink" : ""}`}>
                  <td className="py-1.5 pr-2 font-bold">{r.rank}{r.tied && <span className="text-stamp" title="Tied">*</span>}</td>
                  <td className="pr-2 font-semibold">{entryName(d.board, r.entry)}</td>
                  <td className="pr-2">{r.mind}</td><td className="pr-2">{r.body}</td><td className="pr-2">{r.soul}</td>
                  <td className="pr-2 font-bold">{r.total}</td>
                  <td className={r.judges < panel ? "text-stamp" : ""}>{r.judges}/{panel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-ink/60">Ties break on Soul, then Mind, then Body. <span className="text-stamp">*</span> = still level. Highlighted rows go through ({cut}{cat.smoke ? ` qualifiers + ${invited.length} invited` : ""}).</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {cat.smoke ? (
            <SmokeLineup d={d} cat={cat} pool={[...invited, ...ranked.slice(0, cut).map((r) => r.entry)]} reload={reload} label="Lock prelims → 7 to Smoke" before={saveSeeds} />
          ) : (
            <Btn disabled={busy || ranked.length < 2} onClick={build}>Lock scores → build {roundLabel(bracketSizeFor(ranked.length, cat.bracket_size), 1)} bracket</Btn>
          )}
        </div>
      </Card>
    </>
  );
}

// ---------------- Bracket ----------------

const toPairing = (b: Battle): Pairing => ({ round: b.round, slot: b.slot, a: b.a_entry, b: b.b_entry, winner: b.winner_entry });

export async function buildBracket(cat: Category, seeded: number[]) {
  if (seeded.length < 2) throw new Error("Need at least 2 dancers for a bracket.");
  const size = bracketSizeFor(seeded.length, cat.bracket_size);
  const top = seeded.slice(0, size);
  for (const [i, id] of top.entries()) await must(sb().from("kj_entries").update({ seed: i + 1 }).eq("id", id));
  const pairs = propagate(size, firstRound(top, size));
  await must(sb().from("kj_battles").delete().eq("category", cat.slug).eq("kind", "bracket"));
  await must(sb().from("kj_battles").insert(pairs.map((p) => ({
    category: cat.slug, kind: "bracket", round: p.round, slot: p.slot, a_entry: p.a, b_entry: p.b, winner_entry: p.winner,
    status: p.winner ? "done" : "pending", walkover: !!p.winner, decided_at: p.winner ? new Date().toISOString() : null,
  }))));
  await must(sb().from("kj_categories").update({ phase: "bracket", bracket_size: size }).eq("slug", cat.slug));
  await log("bracket.build", { category: cat.slug, size, seeds: top });
}

/** Save a result (or undo one) and push winners forward through the bracket. */
export async function decideBracket(d: CompData, cat: Category, battle: Battle, winner: number | null, walkover = false) {
  const size = cat.bracket_size;
  const mine = d.board.battles.filter((b) => b.category === cat.slug && b.kind === "bracket");
  const n = nextSlot(size, battle.round, battle.slot);
  const next = n && mine.find((b) => b.round === n.round && b.slot === n.slot);
  if (next?.winner_entry && battle.winner_entry !== winner) throw new Error("The next round is already decided. Undo that one first.");

  await must(sb().from("kj_battles").update({
    winner_entry: winner, walkover, status: winner ? "done" : "pending", decided_at: winner ? new Date().toISOString() : null,
  }).eq("id", battle.id));

  const updated = mine.map((b) => (b.id === battle.id ? { ...toPairing(b), winner } : toPairing(b)));
  if (!winner && n && next) {
    const u = updated.find((p) => p.round === n.round && p.slot === n.slot)!;
    u[n.side] = null;
  }
  const after = winner ? propagate(size, updated) : updated;
  for (const p of after) {
    const ex = mine.find((b) => b.round === p.round && b.slot === p.slot);
    if (!ex) await must(sb().from("kj_battles").insert({ category: cat.slug, kind: "bracket", round: p.round, slot: p.slot, a_entry: p.a, b_entry: p.b }));
    else if (ex.id !== battle.id && (ex.a_entry !== p.a || ex.b_entry !== p.b)) await must(sb().from("kj_battles").update({ a_entry: p.a, b_entry: p.b }).eq("id", ex.id));
  }
  const isFinal = battle.round === roundCount(size);
  if (isFinal) await must(sb().from("kj_categories").update({ phase: winner ? "finished" : "bracket" }).eq("slug", cat.slug));
  await log(winner ? "battle.decide" : "battle.undo", { category: cat.slug, battle: battle.id, winner, walkover });
}

function BracketRun({ d, cat, reload }: { d: CompData; cat: Category; reload: () => Promise<void> }) {
  const { busy, run, note } = useAction();
  const go = (fn: () => Promise<unknown>) => run(async () => { await fn(); await reload(); });
  const rounds = Array.from({ length: roundCount(cat.bracket_size) }, (_, i) => i + 1);
  const mine = d.board.battles.filter((b) => b.category === cat.slug && b.kind === "bracket");
  return (
    <>
      <BracketView board={d.board} cat={cat} />
      <Card title="Run the bracket">
        {note && <div className="mb-3">{note}</div>}
        {rounds.map((r) => (
          <div key={r} className="mb-5">
            <p className="label mb-1 text-ink/55">{roundLabel(cat.bracket_size, r)}</p>
            <ul className="divide-y divide-ink/10">
              {mine.filter((b) => b.round === r).sort((x, y) => x.slot - y.slot).map((b) => (
                <BattleRow key={b.id} d={d} b={b} busy={busy}
                  onStage={() => go(() => putOnStage(b))}
                  decide={(w, wo) => go(() => decideBracket(d, cat, b, w, wo))}
                  extra={() => go(() => must(sb().from("kj_battles").update({ vote_round: b.vote_round + 1 }).eq("id", b.id)))} />
              ))}
            </ul>
          </div>
        ))}
      </Card>
    </>
  );
}

function BattleRow({ d, b, busy, onStage, decide, extra }: { d: CompData; b: Battle; busy: boolean; onStage: () => void; decide: (w: number | null, walkover?: boolean) => void; extra: () => void }) {
  const t = tallyFor(d.votes, b, d.board.judges);
  const ready = !!b.a_entry && !!b.b_entry;
  const name = (id: number | null) => entryName(d.board, id);
  return (
    <li className={`py-2.5 ${b.status === "live" ? "-mx-2 rounded bg-stamp/10 px-2" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p>
          <span className={b.winner_entry === b.a_entry && b.a_entry ? "bg-kj px-1 font-bold" : "font-semibold"}>{name(b.a_entry)}</span>
          <span className="mx-1 text-ink/50">vs</span>
          <span className={b.winner_entry === b.b_entry && b.b_entry ? "bg-kj px-1 font-bold" : "font-semibold"}>{name(b.b_entry)}</span>
          {b.walkover && <span className="ml-2 text-xs text-ink/55">walkover</span>}
        </p>
        <span className="flex flex-wrap items-center gap-1.5">
          {b.status === "live" && <Pill tone="live">LIVE</Pill>}
          {ready && !b.winner_entry && (
            <Pill tone={t.result === "split" ? "warn" : t.result === "waiting" ? "muted" : "ok"}>
              Votes{b.vote_round > 1 ? ` (extra ${b.vote_round - 1})` : ""}: {t.a}–{t.b}{t.tie ? ` · ${t.tie} tie` : ""} · {t.cast}/{d.board.judges}
            </Pill>
          )}
          {ready && !b.winner_entry && b.status !== "live" && <Btn kind="ghost" disabled={busy} onClick={onStage}>On stage</Btn>}
        </span>
      </div>
      {ready && !b.winner_entry && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Btn kind={t.result === "a" ? "kj" : "ink"} disabled={busy} onClick={() => decide(b.a_entry)}>{name(b.a_entry)} wins</Btn>
          <Btn kind={t.result === "b" ? "kj" : "ink"} disabled={busy} onClick={() => decide(b.b_entry)}>{name(b.b_entry)} wins</Btn>
          <Btn kind={t.result === "split" ? "kj" : "ghost"} disabled={busy} onClick={extra}>Extra round</Btn>
          <select disabled={busy} value="" onChange={(e) => e.target.value && decide(Number(e.target.value), true)} className="rounded-full border-2 border-ink px-2 text-sm font-bold">
            <option value="">Walkover…</option>
            <option value={b.a_entry!}>{name(b.a_entry)} goes through</option>
            <option value={b.b_entry!}>{name(b.b_entry)} goes through</option>
          </select>
        </div>
      )}
      {b.winner_entry && ready && <button disabled={busy} onClick={() => decide(null)} className="mt-1 text-xs text-ink/50 underline hover:text-stamp">Undo result</button>}
    </li>
  );
}

// ---------------- 7 to Smoke ----------------

function SmokeLineup({ d, cat, pool, reload, label, before }: { d: CompData; cat: Category; pool: number[]; reload: () => Promise<void>; label: string; before?: () => void }) {
  const [open, setOpen] = useState(false);
  const [order, setOrder] = useState<number[]>(pool);
  const { busy, run, note } = useAction();
  const move = (i: number, dir: -1 | 1) => { const a = [...order]; [a[i], a[i + dir]] = [a[i + dir], a[i]]; setOrder(a); };
  const start = () => run(async () => {
    await startSmoke(cat, order);
    await reload();
  });
  if (!open) return <Btn kind="ink" onClick={() => { before?.(); setOrder(pool); setOpen(true); }}>{label}</Btn>;
  return (
    <div className="w-full rounded-xl bg-paper p-4">
      <p className="font-bold">7 to Smoke line-up</p>
      <p className="text-sm text-ink/60">First in line holds the floor; the second challenges. Reorder, then start.</p>
      <ol className="mt-2 space-y-1">
        {order.map((id, i) => (
          <li key={id} className="flex items-center gap-2 rounded bg-white px-2 py-1">
            <span className="w-6 font-bold">{i + 1}</span>
            <span className="flex-1">{entryName(d.board, id)}{d.board.entries.get(id)?.invited ? <span className="ml-2 text-xs text-ink/55">invited</span> : null}</span>
            <button disabled={i === 0} onClick={() => move(i, -1)} className="px-1 disabled:opacity-20" aria-label="Move up">↑</button>
            <button disabled={i === order.length - 1} onClick={() => move(i, 1)} className="px-1 disabled:opacity-20" aria-label="Move down">↓</button>
            <button onClick={() => setOrder(order.filter((x) => x !== id))} className="px-1 text-ink/40 hover:text-stamp" aria-label="Remove">✕</button>
          </li>
        ))}
      </ol>
      <div className="mt-3 flex flex-wrap gap-2">
        <Btn kind="ghost" onClick={() => setOrder(shuffle(order))}>Shuffle</Btn>
        <Btn disabled={busy} onClick={start}>Start 7 to Smoke</Btn>
        <Btn kind="ghost" onClick={() => setOpen(false)}>Cancel</Btn>
      </div>
      {note && <div className="mt-2">{note}</div>}
    </div>
  );
}

function SmokeRun({ d, cat, reload }: { d: CompData; cat: Category; reload: () => Promise<void> }) {
  const { busy, run, note } = useAction();
  const row = d.board.smoke.get(cat.slug);
  const exchanges = d.board.battles.filter((b) => b.category === cat.slug && b.kind === "smoke").sort((x, y) => x.slot - y.slot);
  const cur = exchanges.find((b) => b.status !== "done");
  if (!row) return <Notice kind="info">No 7 to Smoke board yet.</Notice>;
  const state: Smoke = { onFloor: row.on_floor, queue: row.queue, points: row.points, champion: row.champion };
  const t = cur ? tallyFor(d.votes, cur, d.board.judges) : null;
  const name = (id: number | null) => entryName(d.board, id);

  const crown = (champ: number) => smokeCrown(cat, champ);
  const win = (winner: number) => run(async () => {
    if (!cur) return;
    await smokeWin(d, cat, cur, winner);
    await reload();
  });
  const undo = () => run(async () => {
    const last = [...exchanges].reverse().find((b) => b.status === "done");
    if (!last?.winner_entry) throw new Error("Nothing to undo.");
    // Replay every exchange except the last one from the starting line.
    let s = smokeStart(row.lineup);
    for (const b of exchanges) if (b.id !== last.id && b.status === "done" && b.winner_entry) s = smokeApply(s, b.winner_entry, Number.MAX_SAFE_INTEGER);
    if (cur) await must(sb().from("kj_battles").delete().eq("id", cur.id));
    await must(sb().from("kj_battles").update({ winner_entry: null, status: cur?.status === "live" ? "live" : "pending", decided_at: null }).eq("id", last.id));
    await must(sb().from("kj_smoke").update({ on_floor: s.onFloor, queue: s.queue, points: s.points, champion: null }).eq("category", cat.slug));
    await must(sb().from("kj_categories").update({ phase: "smoke" }).eq("slug", cat.slug));
    await log("smoke.undo", { category: cat.slug, battle: last.id });
    await reload();
  });
  const timeUp = () => run(async () => {
    const leaders = smokeLeaders(state);
    if (leaders.length !== 1) throw new Error(`Time's up but it's level: ${leaders.map(name).join(", ")}. Run a decider, or crown one below.`);
    if (!confirm(`Time's up. Crown ${name(leaders[0])} with the most points?`)) return;
    if (cur) await must(sb().from("kj_battles").delete().eq("id", cur.id));
    await crown(leaders[0]);
    await reload();
  });

  return (
    <>
      <SmokeView board={d.board} cat={cat} />
      <Card title="Run 7 to Smoke">
        {note && <div className="mb-3">{note}</div>}
        {row.champion ? (
          <p className="display text-3xl">👑 {name(row.champion)}</p>
        ) : cur ? (
          <>
            <p className="text-sm text-ink/60">Exchange {cur.slot}{cur.vote_round > 1 ? ` · extra round ${cur.vote_round - 1}` : ""}</p>
            <p className="display text-3xl">{name(cur.a_entry)} <span className="text-ink/40">vs</span> {name(cur.b_entry)}</p>
            {t && <p className="mt-1"><Pill tone={t.result === "split" ? "warn" : t.result === "waiting" ? "muted" : "ok"}>Votes: {t.a}–{t.b}{t.tie ? ` · ${t.tie} tie` : ""} · {t.cast}/{d.board.judges}</Pill></p>}
            <div className="mt-3 flex flex-wrap gap-2">
              {cur.status !== "live" && <Btn kind="ghost" disabled={busy} onClick={() => run(async () => { await putOnStage(cur); await reload(); })}>On stage</Btn>}
              <Btn kind={t?.result === "a" ? "kj" : "ink"} disabled={busy} onClick={() => win(cur.a_entry!)}>{name(cur.a_entry)} wins</Btn>
              <Btn kind={t?.result === "b" ? "kj" : "ink"} disabled={busy} onClick={() => win(cur.b_entry!)}>{name(cur.b_entry)} wins</Btn>
              <Btn kind={t?.result === "split" ? "kj" : "ghost"} disabled={busy} onClick={() => run(async () => { await must(sb().from("kj_battles").update({ vote_round: cur.vote_round + 1 }).eq("id", cur.id)); await reload(); })}>Extra round</Btn>
            </div>
          </>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-2 border-t border-ink/10 pt-4">
          {!row.champion && <Btn kind="ghost" disabled={busy} onClick={timeUp}>Time&apos;s up</Btn>}
          <Btn kind="ghost" disabled={busy || !exchanges.some((b) => b.status === "done")} onClick={undo}>Undo last exchange</Btn>
          {!row.champion && smokeLeaders(state).length > 1 && Object.values(state.points).some((p) => p > 0) && (
            <select disabled={busy} value="" onChange={(e) => e.target.value && confirm("Crown this dancer?") && run(async () => { if (cur) await must(sb().from("kj_battles").delete().eq("id", cur.id)); await crown(Number(e.target.value)); await reload(); })} className="rounded-full border-2 border-ink px-2 text-sm font-bold">
              <option value="">Crown after decider…</option>
              {smokeLeaders(state).map((id) => <option key={id} value={id}>{name(id)}</option>)}
            </select>
          )}
        </div>
      </Card>
    </>
  );
}



// ---------------- Shared show operations (used by Run show and the category screens) ----------------

/** Draw random prelim heats from every confirmed, non-invited entry. */
export async function drawPrelims(d: CompData, cat: Category) {
  const pool = confirmed(d, cat).filter((e) => !e.invited).map((e) => e.id);
  if (pool.length < 2) throw new Error("Need at least 2 confirmed dancers for prelims.");
  const rows = prelimPairs(pool).map((p, i) => ({ category: cat.slug, kind: "prelim", round: 1, slot: i + 1, a_entry: p.a, b_entry: p.b }));
  await must(sb().from("kj_battles").insert(rows));
  await must(sb().from("kj_categories").update({ phase: "prelims" }).eq("slug", cat.slug));
  await log("prelims.start", { category: cat.slug, heats: rows.length });
}

/** Prelim ranking for a category plus where the cut falls. */
export function prelimStanding(d: CompData, cat: Category) {
  const heats = d.board.battles.filter((b) => b.category === cat.slug && b.kind === "prelim");
  const ids = [...new Set(heats.flatMap((h) => [h.a_entry, h.b_entry]).filter((x): x is number => !!x))];
  const ranked = rankPrelims(ids, d.scores.filter((s) => ids.includes(s.entry_id)));
  const cut = cat.smoke ? cat.smoke_qualifiers : bracketSizeFor(ranked.length, cat.bracket_size);
  const panel = Math.max(d.board.judges, 1);
  const missing = ranked.filter((r) => r.judges < panel).length;
  const cutTie = !!(ranked[cut - 1] && ranked[cut] && ranked[cut - 1].rank === ranked[cut].rank);
  return { heats, ranked, cut, panel, missing, cutTie };
}

/** Lock prelim scores: seed the qualifiers, then build the bracket or start 7 to Smoke (invited first, then by rank). */
export async function lockPrelims(d: CompData, cat: Category) {
  const { ranked, cut } = prelimStanding(d, cat);
  const top = ranked.slice(0, cut).map((r) => r.entry);
  for (const [i, id] of top.entries()) await must(sb().from("kj_entries").update({ seed: i + 1 }).eq("id", id));
  await must(sb().from("kj_battles").update({ status: "done" }).eq("category", cat.slug).eq("kind", "prelim"));
  await log("prelims.lock", { category: cat.slug, qualified: top });
  if (cat.smoke) await startSmoke(cat, [...confirmed(d, cat).filter((e) => e.invited).map((e) => e.id), ...top]);
  else await buildBracket(cat, top);
}

export async function startSmoke(cat: Category, order: number[]) {
  if (order.length < 2) throw new Error("Need at least 2 dancers.");
  const s = smokeStart(order);
  await must(sb().from("kj_battles").delete().eq("category", cat.slug).eq("kind", "smoke"));
  await must(sb().from("kj_smoke").upsert({ category: cat.slug, lineup: order, on_floor: s.onFloor, queue: s.queue, points: s.points, champion: null, started_at: new Date().toISOString() }));
  const bt = smokeBattle(s)!;
  await must(sb().from("kj_battles").insert({ category: cat.slug, kind: "smoke", round: 1, slot: 1, a_entry: bt.a, b_entry: bt.b }));
  await must(sb().from("kj_categories").update({ phase: "smoke" }).eq("slug", cat.slug));
  await log("smoke.start", { category: cat.slug, order });
}

export async function smokeCrown(cat: Category, champ: number) {
  await must(sb().from("kj_smoke").update({ champion: champ }).eq("category", cat.slug));
  await must(sb().from("kj_categories").update({ phase: "finished" }).eq("slug", cat.slug));
  await log("smoke.champion", { category: cat.slug, champion: champ });
}

/** Record a 7 to Smoke exchange; the next exchange is created (and kept on stage if this one was). */
export async function smokeWin(d: CompData, cat: Category, cur: Battle, winner: number) {
  const row = d.board.smoke.get(cat.slug);
  if (!row) throw new Error("No 7 to Smoke board.");
  const wasLive = cur.status === "live";
  const s = smokeApply({ onFloor: row.on_floor, queue: row.queue, points: row.points, champion: row.champion }, winner, cat.smoke_target);
  await must(sb().from("kj_battles").update({ winner_entry: winner, status: "done", decided_at: new Date().toISOString() }).eq("id", cur.id));
  await must(sb().from("kj_smoke").update({ on_floor: s.onFloor, queue: s.queue, points: s.points }).eq("category", cat.slug));
  await log("smoke.exchange", { category: cat.slug, battle: cur.id, winner });
  if (s.champion) await smokeCrown(cat, s.champion);
  else {
    const bt = smokeBattle(s)!;
    await must(sb().from("kj_battles").insert({ category: cat.slug, kind: "smoke", round: 1, slot: cur.slot + 1, a_entry: bt.a, b_entry: bt.b, status: wasLive ? "live" : "pending" }));
  }
  return s.champion;
}

/** Any battle result: bracket advances, smoke moves the line. */
export async function decide(d: CompData, b: Battle, winner: number, walkover = false) {
  const cat = d.board.cats.find((c) => c.slug === b.category)!;
  if (b.kind === "smoke") return smokeWin(d, cat, b, winner);
  await decideBracket(d, cat, b, winner, walkover);
}

export const extraRound = (b: Battle) => must(sb().from("kj_battles").update({ vote_round: b.vote_round + 1 }).eq("id", b.id));

/** Battles ready to call, in running order (both dancers known, or a solo prelim heat). */
export function readyQueue(d: CompData, only?: string): Battle[] {
  return runOrder(d.board).filter((b) => b.status === "pending" && (!only || b.category === only) && !!b.a_entry && (!!b.b_entry || b.kind === "prelim"));
}

// ---------------- Roster (synced live) ----------------

const STATE_LABEL = { invited: ["Invited", "ink"], "walk-in": ["Walk-in", "ok"], confirmed: ["Paid", "ok"], unpaid: ["Unpaid", "warn"], partner: ["Partner pending", "warn"] } as const;

function Roster({ d, cat }: { d: CompData; cat: Category }) {
  const rows = d.entries.filter((e) => e.category === cat.slug).sort((a, b) => (a.seed ?? 999) - (b.seed ?? 999) || a.id - b.id);
  return (
    <Card title={`Participants · ${cat.name}`} aside={<span className="text-sm text-ink/60">{confirmed(d, cat).length} can battle · {rows.filter((e) => e.status === "active").length} entered · updates live</span>}>
      {rows.length === 0 ? <p className="text-ink/60">No entries yet.</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-ink/55"><tr><th className="py-1 pr-3">Seed</th><th className="pr-3">Dancer</th><th className="pr-3">ID</th><th className="pr-3">From</th><th>Status</th></tr></thead>
            <tbody>
              {rows.map((e) => {
                const pub = d.board.entries.get(e.id);
                const st = entryState(d, cat, e);
                return (
                  <tr key={e.id} className={`border-t border-ink/10 ${e.status !== "active" ? "opacity-40" : ""}`}>
                    <td className="py-1.5 pr-3 font-bold">{e.seed ? `#${e.seed}` : "—"}</td>
                    <td className="pr-3 font-semibold">{pub?.label ?? e.guest_name ?? `#${e.id}`}</td>
                    <td className="pr-3">{pub?.code ?? "—"}</td>
                    <td className="pr-3">{[pub?.crew, pub?.city].filter(Boolean).join(" · ")}</td>
                    <td>{e.status !== "active" ? <Pill>{e.status}</Pill> : <Pill tone={STATE_LABEL[st][1]}>{STATE_LABEL[st][0]}</Pill>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

// ---------------- Demo data (admins) ----------------

const DEMO = ["Kilat", "Ucup", "Jaka", "Bimo", "Tono", "Gendhis", "Ratu", "Sari", "Dewi", "Lala", "Arya", "Bayu", "Citra", "Dimas", "Eka", "Fajar"];

/** Fill every category with made-up walk-in dancers so the team and judges can rehearse the whole flow. */
function DemoData({ d, reload }: { d: CompData; reload: () => Promise<void> }) {
  const { busy, run, note } = useAction();
  const demo = d.entries.filter((e) => e.guest_name?.startsWith("Demo · "));
  const load = () => run(async () => {
    const rows = d.board.cats.flatMap((c) => {
      const n = c.smoke ? 8 : c.team ? 8 : 12;
      const list = Array.from({ length: n }, (_, i) => ({
        category: c.slug, guest_name: `Demo · ${c.team ? `${DEMO[i]} & ${DEMO[(i + 8) % 16]}` : DEMO[i]}`,
        invited: c.smoke && i < 4, dancer_id: null,
      }));
      return list;
    });
    await must(sb().from("kj_entries").insert(rows));
    await log("demo.load", { entries: rows.length });
    await reload();
  }, "Demo dancers added. Pick a category above and press “Draw prelim heats”.");
  const clear = () => {
    if (!confirm("Remove all demo dancers and reset every category that used them (heats, scores, votes, brackets)?")) return;
    run(async () => {
      const cats = [...new Set(demo.map((e) => e.category))];
      for (const c of cats) {
        await must(sb().from("kj_battles").delete().eq("category", c));
        await must(sb().from("kj_smoke").delete().eq("category", c));
        await must(sb().from("kj_categories").update({ phase: "setup", results_published: false }).eq("slug", c));
      }
      await must(sb().from("kj_entries").delete().like("guest_name", "Demo · %"));
      await must(sb().from("kj_entries").update({ seed: null }).in("category", cats));
      await log("demo.clear", { categories: cats });
      await reload();
    }, "Demo data removed.");
  };
  return (
    <Card title="Rehearsal" aside={<span className="text-sm text-ink/55">Admins only</span>}>
      <p className="text-sm text-ink/70">Load made-up dancers into every category to rehearse: draw heats, judge on phones, build brackets and run 7 to Smoke. Their names start with “Demo ·”. Clear them before the real event.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Btn disabled={busy || demo.length > 0} onClick={load}>Load demo dancers</Btn>
        <Btn kind="danger" disabled={busy || demo.length === 0} onClick={clear}>Clear demo data ({demo.length})</Btn>
      </div>
      {note && <div className="mt-3">{note}</div>}
    </Card>
  );
}
