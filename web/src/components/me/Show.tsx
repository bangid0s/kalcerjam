"use client";

import { useState } from "react";
import { roundLabel } from "@/lib/tournament";
import { entryName, must, sb, tallyFor, useLive, type Battle, type Category } from "./data";
import { battleTitle } from "./boards";
import {
  confirmed, decide, drawPrelims, extraRound, loadComp, lockPrelims, prelimStanding, putOnStage, readyQueue, startSmoke, type CompData,
} from "./Comp";
import { Notice, Pill, useAction } from "./ui";

const STEPS = ["Entries", "Prelims", "Battles", "Champion"] as const;
const stepOf = (c: Category) => (c.phase === "setup" ? 0 : c.phase === "prelims" ? 1 : c.phase === "finished" ? 3 : 2);

/** The one screen the team needs during the show: what's on stage, one tap to decide, one tap for what's next. */
export function Show({ openCategory }: { openCategory: (slug: string) => void }) {
  const { data: d, error, reload } = useLive(loadComp, ["kj_battles", "kj_smoke", "kj_categories", "kj_votes", "kj_scores", "kj_entries"], 6000);
  const { busy, run, note } = useAction();
  const [autoNext, setAutoNext] = useState(true);
  if (error) return <Notice kind="err">{error}</Notice>;
  if (!d) return <p>Loading…</p>;

  const live = d.board.battles.find((b) => b.status === "live") ?? null;
  const go = (fn: () => Promise<unknown>, ok?: string) => run(async () => { await fn(); await reload(); }, ok);

  /** After a result, call the next ready battle of the same category (if auto-next is on). */
  const thenNext = async (cat: string) => {
    if (!autoNext) return;
    const fresh = await loadComp();
    if (fresh.board.battles.some((b) => b.status === "live")) return; // smoke keeps its own exchange live
    const next = readyQueue(fresh, cat)[0];
    if (next) await putOnStage(next);
  };

  return (
    <div className="space-y-5 pb-10">
      {note}
      <OnStage d={d} live={live} busy={busy} autoNext={autoNext} setAutoNext={setAutoNext}
        onDecide={(b, w, wo) => go(async () => { await decide(d, b, w, wo); await thenNext(b.category); })}
        onExtra={(b) => go(() => extraRound(b))}
        onNextHeat={(b) => go(async () => { await must(sb().from("kj_battles").update({ status: "done" }).eq("id", b.id)); await thenNext(b.category); })}
        onOff={() => go(() => putOnStage(null))}
        onCall={(b) => go(() => putOnStage(b))} />

      <section>
        <h2 className="display mb-3 text-3xl">Categories</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {d.board.cats.map((c) => (
            <CategoryStep key={c.slug} d={d} cat={c} busy={busy} live={live} open={() => openCategory(c.slug)}
              act={(fn, ok) => go(fn, ok)} />
          ))}
        </div>
      </section>
    </div>
  );
}

function OnStage({ d, live, busy, autoNext, setAutoNext, onDecide, onExtra, onNextHeat, onOff, onCall }: {
  d: CompData; live: Battle | null; busy: boolean; autoNext: boolean; setAutoNext: (v: boolean) => void;
  onDecide: (b: Battle, w: number, walkover?: boolean) => void; onExtra: (b: Battle) => void; onNextHeat: (b: Battle) => void; onOff: () => void; onCall: (b: Battle) => void;
}) {
  const name = (id: number | null) => entryName(d.board, id);
  const queue = readyQueue(d);
  const nextUp = queue[0];

  if (!live) {
    return (
      <section className="rounded-2xl bg-ink p-5 text-paper">
        <p className="label text-paper/50">On stage</p>
        <p className="display mt-1 text-4xl text-paper/40">Nothing yet</p>
        {nextUp ? (
          <button disabled={busy} onClick={() => onCall(nextUp)} className="mt-4 w-full rounded-2xl bg-kj p-4 text-left text-ink disabled:opacity-50">
            <span className="label">Call next · {battleTitle(d.board, nextUp)}</span>
            <span className="display mt-1 block text-3xl">{name(nextUp.a_entry)}{nextUp.b_entry ? ` vs ${name(nextUp.b_entry)}` : " (solo)"}</span>
          </button>
        ) : <p className="mt-3 text-paper/60">No battles ready. Start a category below.</p>}
      </section>
    );
  }

  const cat = d.board.cats.find((c) => c.slug === live.category);
  const title = battleTitle(d.board, live);
  const ids = [live.a_entry, live.b_entry].filter((x): x is number => !!x);
  const panel = Math.max(d.board.judges, 1);

  return (
    <section className="rounded-2xl bg-ink p-5 text-paper">
      <div className="flex items-center justify-between gap-2">
        <p className="label flex items-center gap-2 text-stamp"><span className="h-2.5 w-2.5 animate-pulse rounded-full bg-stamp" />On stage · {title}{live.vote_round > 1 ? ` · extra round ${live.vote_round - 1}` : ""}</p>
        <button onClick={onOff} disabled={busy} className="text-xs text-paper/50 underline">Take off</button>
      </div>

      {live.kind === "prelim" ? (
        <>
          <div className="mt-3 grid gap-2">
            {ids.map((id) => {
              const n = d.scores.filter((s) => s.entry_id === id).length;
              return (
                <div key={id} className="flex items-center justify-between gap-3 rounded-xl bg-ink-2 p-3">
                  <span className="display text-3xl">{name(id)}</span>
                  <Pill tone={n >= panel ? "ok" : "warn"}>{n}/{panel} judges scored</Pill>
                </div>
              );
            })}
          </div>
          <button disabled={busy} onClick={() => onNextHeat(live)} className="mt-4 h-16 w-full rounded-2xl bg-kj text-lg font-black text-ink disabled:opacity-50">
            Heat done → next heat ▶
          </button>
        </>
      ) : (
        <Decision d={d} b={live} busy={busy} onDecide={onDecide} onExtra={onExtra} />
      )}

      <label className="mt-4 flex items-center gap-2 text-sm text-paper/70">
        <input type="checkbox" checked={autoNext} onChange={(e) => setAutoNext(e.target.checked)} className="h-5 w-5 accent-kj" />
        Call the next {cat?.name ?? ""} battle automatically after each result
      </label>
    </section>
  );
}

function Decision({ d, b, busy, onDecide, onExtra }: { d: CompData; b: Battle; busy: boolean; onDecide: (b: Battle, w: number, walkover?: boolean) => void; onExtra: (b: Battle) => void }) {
  const t = tallyFor(d.votes, b, d.board.judges);
  const panel = Math.max(d.board.judges, 1);
  const name = (id: number | null) => entryName(d.board, id);
  const side = (id: number, votes: number, hot: boolean) => (
    <button disabled={busy} onClick={() => confirm(`Confirm: ${name(id)} wins?`) && onDecide(b, id)}
      className={`flex min-h-24 flex-col justify-between rounded-2xl p-4 text-left disabled:opacity-50 ${hot ? "bg-kj text-ink" : "bg-ink-2 text-paper"}`}>
      <span className="display break-words text-[clamp(1.6rem,6vw,2.6rem)]">{name(id)}</span>
      <span className="text-sm font-bold">{votes} vote{votes === 1 ? "" : "s"}{hot ? " · majority — tap to confirm" : " · tap to confirm"}</span>
    </button>
  );
  return (
    <>
      <div className="mt-3">
        <div className="flex h-2 overflow-hidden rounded-full bg-ink-2" aria-label={`${t.cast} of ${panel} judges voted`}>
          <span className="bg-paper/70" style={{ width: `${(t.cast / panel) * 100}%` }} />
        </div>
        <p className="mt-1 text-sm text-paper/60">{t.cast}/{panel} judges voted{t.tie ? ` · ${t.tie} asked for extra` : ""}{t.result === "split" ? " · split — call an extra round" : ""}</p>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {side(b.a_entry!, t.a, t.result === "a")}
        {side(b.b_entry!, t.b, t.result === "b")}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button disabled={busy} onClick={() => onExtra(b)} className={`h-12 rounded-xl font-bold disabled:opacity-50 ${t.result === "split" ? "bg-gold text-ink" : "bg-ink-2 text-paper"}`}>Extra round</button>
        <select disabled={busy} value="" onChange={(e) => e.target.value && confirm("Walkover — the other dancer is out?") && onDecide(b, Number(e.target.value), true)} className="h-12 rounded-xl bg-ink-2 px-3 font-bold text-paper">
          <option value="">Walkover…</option>
          <option value={b.a_entry!}>{name(b.a_entry)} goes through</option>
          <option value={b.b_entry!}>{name(b.b_entry)} goes through</option>
        </select>
      </div>
    </>
  );
}

function CategoryStep({ d, cat, busy, live, open, act }: {
  d: CompData; cat: Category; busy: boolean; live: Battle | null; open: () => void; act: (fn: () => Promise<unknown>, ok?: string) => void;
}) {
  const step = stepOf(cat);
  const conf = confirmed(d, cat);
  const pool = conf.filter((e) => !e.invited).length;
  const mine = d.board.battles.filter((b) => b.category === cat.slug);
  const queue = readyQueue(d, cat.slug);
  const call = () => act(() => putOnStage(queue[0]));
  const isLiveHere = live?.category === cat.slug;

  let status = "";
  let primary: { label: string; onClick: () => void; disabled?: boolean } | null = null;

  if (cat.phase === "setup") {
    status = `${conf.length} ready to battle${cat.team ? " (teams)" : ""}`;
    if (cat.smoke && pool < 2 && conf.length >= 2) primary = { label: `Start 7 to Smoke (${conf.length})`, onClick: () => confirm(`Start 7 to Smoke with ${conf.length} dancers, no prelims?`) && act(() => startSmoke(cat, conf.map((e) => e.id))) };
    else primary = pool >= 2
      ? { label: `Start prelims (${pool} dancers)`, onClick: () => confirm(`Draw random prelim heats for ${pool} dancers in ${cat.name}?`) && act(() => drawPrelims(d, cat), "Heats drawn. Tap Call next heat.") }
      : { label: "Waiting for dancers", onClick: () => {}, disabled: true };
  } else if (cat.phase === "prelims") {
    const { heats, missing, cut, cutTie, ranked } = prelimStanding(d, cat);
    const done = heats.filter((h) => h.status === "done").length;
    status = `Heats ${done}/${heats.length} · ${ranked.length - missing}/${ranked.length} fully scored`;
    primary = queue.length
      ? { label: isLiveHere ? "Heat on stage" : "Call next heat", onClick: call, disabled: isLiveHere }
      : {
          label: cat.smoke ? `Lock scores → 7 to Smoke` : `Lock scores → build Top ${Math.min(cut, ranked.length)}`,
          onClick: () => {
            const warn = [missing ? `${missing} dancer(s) are missing scores from some judges.` : "", cutTie ? "There's a tie on the cut line (lower entry goes through)." : ""].filter(Boolean).join(" ");
            if (confirm(`${warn ? warn + "\n\n" : ""}Lock prelim scores for ${cat.name}? Judges can't change them afterwards.`)) act(() => lockPrelims(d, cat), cat.smoke ? "7 to Smoke ready." : "Bracket built.");
          },
        };
  } else if (cat.phase === "bracket") {
    const br = mine.filter((b) => b.kind === "bracket");
    status = `${br.filter((b) => b.winner_entry).length}/${br.length} battles decided`;
    const nx = queue[0];
    primary = { label: isLiveHere ? "Battle on stage" : nx ? `Call next · ${roundLabel(cat.bracket_size, nx.round)}` : "Waiting for results", onClick: call, disabled: isLiveHere || !nx };
  } else if (cat.phase === "smoke") {
    const s = d.board.smoke.get(cat.slug);
    const top = s ? Math.max(0, ...Object.values(s.points)) : 0;
    status = `Leader on ${top}/${cat.smoke_target} points`;
    primary = { label: isLiveHere ? "Exchange on stage" : "Call next exchange", onClick: call, disabled: isLiveHere || !queue.length };
  } else {
    const champ = cat.smoke ? d.board.smoke.get(cat.slug)?.champion : mine.filter((b) => b.kind === "bracket").sort((x, y) => y.round - x.round)[0]?.winner_entry;
    status = `👑 ${entryName(d.board, champ ?? null)}`;
  }

  return (
    <div className={`rounded-2xl bg-white p-4 ${isLiveHere ? "ring-4 ring-stamp" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="display text-2xl">{cat.name}</p>
        <button onClick={open} className="shrink-0 text-sm font-semibold text-ink/50 underline">Details</button>
      </div>
      <ol className="mt-2 flex gap-1" aria-label="Progress">
        {STEPS.map((s, i) => (
          <li key={s} className="flex-1">
            <span className={`block h-1.5 rounded-full ${i < step ? "bg-ink" : i === step ? "bg-kj ring-1 ring-ink" : "bg-ink/10"}`} />
            <span className={`mt-1 block text-[.65rem] font-semibold ${i === step ? "text-ink" : "text-ink/40"}`}>{s}</span>
          </li>
        ))}
      </ol>
      <p className="mt-2 text-sm text-ink/70">{status}</p>
      {primary && (
        <button disabled={busy || primary.disabled} onClick={primary.onClick} className="mt-3 h-12 w-full rounded-xl bg-ink font-bold text-paper hover:bg-kj hover:text-ink disabled:bg-ink/15 disabled:text-ink/50">
          {primary.label}
        </button>
      )}
    </div>
  );
}
