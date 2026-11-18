"use client";

import { useEffect, useState } from "react";
import { rankPrelims, roundLabel } from "@/lib/tournament";
import { BOARD_TABLES, PHASES, entryName, loadBoard, must, sb, useLive, type Battle, type Board, type Category, type ScoreRow, type Vote } from "./data";
import { BracketView, SmokeView } from "./boards";
import { Card, Notice, Pill, useAction } from "./ui";

type JudgeData = { board: Board; votes: Vote[]; scores: ScoreRow[] };
type Tab = "judge" | "participants" | "brackets" | "rules";

const buzz = (ms = 12) => { try { navigator.vibrate?.(ms); } catch {} };

/** Keep the phone screen on while judging. */
function useWakeLock() {
  useEffect(() => {
    type Sentinel = { release: () => Promise<void> };
    const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<Sentinel> } };
    let lock: Sentinel | null = null;
    const get = () => { if (document.visibilityState === "visible") nav.wakeLock?.request("screen").then((l) => { lock = l; }).catch(() => {}); };
    get();
    document.addEventListener("visibilitychange", get);
    return () => { document.removeEventListener("visibilitychange", get); lock?.release().catch(() => {}); };
  }, []);
}

export function Judge({ uid, preview, onBecomeJudge }: { uid: string; preview: boolean; onBecomeJudge?: () => void }) {
  useWakeLock();
  const { data, error, reload } = useLive<JudgeData>(async () => {
    const [board, votes, scores] = await Promise.all([
      loadBoard(),
      must(sb().from("kj_votes").select("*").eq("judge_id", uid)),
      must(sb().from("kj_scores").select("*").eq("judge_id", uid)),
    ]);
    return { board, votes: votes as Vote[], scores: scores as ScoreRow[] };
  }, BOARD_TABLES, 8000);
  const [tab, setTab] = useState<Tab>("judge");
  const [home, setHome] = useState(0); // bumps when Judge is tapped again: back to step 1

  if (error) return <Notice kind="err">{error}</Notice>;
  if (!data) return <p className="py-20 text-center text-lg">Loading…</p>;
  const live = data.board.battles.find((b) => b.status === "live");
  const tabs: [Tab, string, string][] = [["judge", "Judge", "●"], ["participants", "Dancers", "☰"], ["brackets", "Brackets", "▦"], ["rules", "Rules", "?"]];

  return (
    <div className="-mx-4 min-h-[80vh] px-3 pb-28 sm:mx-0 sm:px-0">
      {preview && (
        <div className="mb-3">
          <Notice kind="info">
            Preview only — this account isn&apos;t a judge, so taps won&apos;t save.{" "}
            {onBecomeJudge && <button onClick={onBecomeJudge} className="underline">Make me a judge</button>}
          </Notice>
        </div>
      )}
      {tab === "judge" && <JudgeNow data={data} uid={uid} reload={reload} home={home} />}
      {tab === "participants" && <Participants board={data.board} />}
      {tab === "brackets" && <Brackets board={data.board} />}
      {tab === "rules" && <Rules />}

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-paper/10 bg-ink pb-[env(safe-area-inset-bottom)] text-paper" aria-label="Judge">
        <div className="mx-auto grid max-w-xl grid-cols-4">
          {tabs.map(([k, label, icon]) => (
            <button key={k} onClick={() => { buzz(8); if (k === tab && k === "judge") setHome((h) => h + 1); setTab(k); window.scrollTo(0, 0); }} aria-current={tab === k}
              className={`flex h-16 flex-col items-center justify-center gap-0.5 text-xs font-bold ${tab === k ? "text-kj" : "text-paper/60"}`}>
              <span className={`text-lg leading-none ${k === "judge" && live ? "animate-pulse text-stamp" : ""}`}>{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

/** A battle the judge can score or vote on, in the order it runs. */
const judgeable = (b: Battle) => !!b.a_entry && (b.kind === "prelim" || !!b.b_entry);

/** Battles of one category in running order. Byes and empty future slots are left out. */
function orderFor(board: Board, slug: string) {
  return board.battles
    .filter((b) => b.category === slug && judgeable(b))
    .sort((x, y) => ({ prelim: 0, bracket: 1, smoke: 2 })[x.kind] - ({ prelim: 0, bracket: 1, smoke: 2 })[y.kind] || x.round - y.round || x.slot - y.slot);
}

/** Has this judge finished their part of the battle? Prelims: both dancers scored. Battles: voted in the current round. */
function doneByMe(data: JudgeData, b: Battle) {
  if (b.kind === "prelim") {
    const mine = new Set(data.scores.map((s) => s.entry_id));
    return [b.a_entry, b.b_entry].every((id) => !id || mine.has(id));
  }
  return b.status === "done" || data.votes.some((v) => v.battle_id === b.id && v.vote_round === b.vote_round);
}

const itemLabel = (cat: Category | undefined, b: Battle, n?: number) =>
  b.kind === "prelim" ? `Heat ${b.slot}${n ? ` of ${n}` : ""}` : b.kind === "smoke" ? `Exchange ${b.slot}` : roundLabel(cat?.bracket_size ?? 16, b.round);

/** Judging in three steps: pick a category → pick a battle from the running order → score it → next. */
function JudgeNow({ data, uid, reload, home }: { data: JudgeData; uid: string; reload: () => Promise<void>; home: number }) {
  const { board } = data;
  const [slug, setSlug] = useState<string | null>(null);
  const [item, setItem] = useState<number | null>(null);
  const [follow, setFollow] = useState(false); // keep jumping to the live battle (7 to Smoke exchanges, bracket rounds)
  const [lastHome, setLastHome] = useState(home);
  if (home !== lastHome) { setLastHome(home); setSlug(null); setItem(null); setFollow(false); }

  const live = board.battles.find((b) => b.status === "live") ?? null;
  const cat = board.cats.find((c) => c.slug === slug);
  const list = cat ? orderFor(board, cat.slug) : [];
  let current = item != null ? board.battles.find((b) => b.id === item) ?? null : null;
  // Following the stage: when the battle you voted on is decided and the next one in this category goes live, move to it.
  if (follow && live && cat && live.category === cat.slug && live.kind !== "prelim" && current?.id !== live.id && current?.status !== "live") current = live;

  const open = (s: string, b: Battle | null, followLive = false) => { buzz(); setSlug(s); setItem(b?.id ?? null); setFollow(followLive); window.scrollTo(0, 0); };
  const toList = () => { buzz(); setItem(null); setFollow(false); window.scrollTo(0, 0); };
  const toCats = () => { buzz(); setSlug(null); setItem(null); setFollow(false); window.scrollTo(0, 0); };

  const step = !cat ? 1 : !current ? 2 : 3;
  const crumbs = (
    <ol className="mb-3 flex items-center gap-1 text-xs font-bold" aria-label="Steps">
      {[["1", "Category", toCats], ["2", "Battle", toList], ["3", "Score", null]].map(([n, label, fn], i) => (
        <li key={n as string} className="flex items-center gap-1">
          {i > 0 && <span className="text-ink/30">›</span>}
          <button disabled={!fn || step <= i + 1} onClick={fn as () => void}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 ${step === i + 1 ? "bg-ink text-paper" : step > i + 1 ? "bg-white text-ink underline" : "text-ink/40"}`}>
            <span>{n as string}</span>{label as string}
          </button>
        </li>
      ))}
    </ol>
  );

  // ---------- Step 1: categories ----------
  if (!cat) {
    const active = board.cats.filter((c) => c.phase === "prelims" || c.phase === "bracket" || c.phase === "smoke");
    const rest = board.cats.filter((c) => !active.includes(c));
    return (
      <div className="space-y-3">
        {crumbs}
        {live && judgeable(live) && (
          <button onClick={() => open(live.category, live, live.kind !== "prelim")} className="flex w-full items-center gap-3 rounded-3xl bg-stamp p-4 text-left text-white active:scale-[.99]">
            <span className="h-3 w-3 shrink-0 animate-pulse rounded-full bg-white" />
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-bold uppercase tracking-wide">On stage now · {board.cats.find((c) => c.slug === live.category)?.name} · {itemLabel(board.cats.find((c) => c.slug === live.category), live)}</span>
              <span className="display block truncate text-3xl">{entryName(board, live.a_entry)}{live.b_entry ? ` vs ${entryName(board, live.b_entry)}` : ""}</span>
            </span>
            <span className="shrink-0 rounded-full bg-white px-3 py-2 text-sm font-black text-stamp">Judge ›</span>
          </button>
        )}
        <p className="display pt-2 text-3xl">Choose a category</p>
        {active.length === 0 && (
          <div className="rounded-3xl bg-ink px-5 py-10 text-center text-paper">
            <span className="mx-auto block h-3 w-3 animate-pulse rounded-full bg-kj" />
            <p className="display mt-4 text-3xl">Nothing to judge yet</p>
            <p className="mt-2 text-paper/60">Categories appear here as soon as the team starts them.</p>
          </div>
        )}
        <ul className="space-y-2">
          {active.map((c) => {
            const items = orderFor(board, c.slug);
            const done = items.filter((b) => doneByMe(data, b)).length;
            const isLive = live?.category === c.slug;
            const sub = c.phase === "prelims" ? `Prelims · you scored ${done}/${items.length} heats` : c.phase === "smoke" ? `7 to Smoke · exchange ${items.length}` : `Bracket · ${items.filter((b) => b.status === "done").length}/${items.length} battles decided`;
            return (
              <li key={c.slug}>
                <button onClick={() => open(c.slug, null)} className={`flex min-h-20 w-full items-center gap-3 rounded-3xl p-4 text-left active:bg-kj ${isLive ? "bg-white ring-4 ring-stamp" : "bg-white"}`}>
                  <span className="min-w-0 flex-1">
                    <span className="display block text-3xl leading-tight">{c.name}</span>
                    <span className="block text-sm text-ink/60">{sub}</span>
                  </span>
                  {isLive && <Pill tone="live">LIVE</Pill>}
                  {c.phase === "prelims" && items.length > 0 && done === items.length && <Pill tone="ok">✓ All scored</Pill>}
                  <span className="text-2xl">›</span>
                </button>
              </li>
            );
          })}
        </ul>
        {rest.length > 0 && (
          <details className="rounded-3xl bg-white/60 p-4">
            <summary className="cursor-pointer text-sm font-bold text-ink/60">Not started or finished ({rest.length})</summary>
            <ul className="mt-2 text-sm">
              {rest.map((c) => <li key={c.slug} className="flex justify-between border-t border-ink/10 py-2"><span>{c.name}</span><span className="text-ink/55">{PHASES[c.phase]}</span></li>)}
            </ul>
          </details>
        )}
        {board.cats.filter((c) => c.phase === "prelims").map((c) => <MyOrder key={c.slug} data={data} slug={c.slug} name={c.name} />)}
      </div>
    );
  }

  // ---------- Step 3: score / vote ----------
  if (current) {
    const idx = list.findIndex((b) => b.id === current!.id);
    const nextOpen = list.slice(idx + 1).find((b) => !doneByMe(data, b) && (b.kind === "prelim" || b.status !== "done")) ?? list.find((b) => !doneByMe(data, b) && b.id !== current!.id && (b.kind === "prelim" || b.status !== "done"));
    const prev = list[idx - 1];
    const next = list[idx + 1];
    const go = (b: Battle | undefined) => b && open(cat.slug, b, b.kind !== "prelim" && b.status === "live");
    const heats = list.filter((b) => b.kind === "prelim").length;
    return (
      <div className="space-y-3">
        {crumbs}
        <div className="flex items-center justify-between gap-2">
          <button onClick={toList} className="h-11 rounded-full bg-white px-4 font-bold">‹ {cat.name}</button>
          <p className="text-right text-sm font-semibold text-ink/60">{itemLabel(cat, current, current.kind === "prelim" ? heats : undefined)}</p>
        </div>
        {current.kind === "prelim"
          ? <PrelimScorer key={current.id} heat={current} data={data} uid={uid} reload={reload} isLive={current.status === "live"} />
          : current.status === "live"
            ? <VotePad key={`${current.id}-${current.vote_round}`} battle={current} data={data} uid={uid} reload={reload} />
            : <BattleWaiting battle={current} data={data} />}

        <div className="grid grid-cols-[auto_1fr_auto] gap-2 pt-1">
          <button disabled={!prev} onClick={() => go(prev)} className="h-14 rounded-2xl bg-white px-4 font-bold disabled:opacity-30" aria-label="Previous">‹</button>
          {nextOpen ? (
            <button onClick={() => go(nextOpen)} className={`h-14 rounded-2xl px-4 font-black ${doneByMe(data, current) ? "bg-kj text-ink" : "bg-white text-ink"}`}>
              Next to {nextOpen.kind === "prelim" ? "score" : "vote"}: {itemLabel(cat, nextOpen)} ›
            </button>
          ) : (
            <button onClick={toList} className="h-14 rounded-2xl bg-kj px-4 font-black text-ink">{current.kind === "prelim" ? "✓ All heats scored · back to list" : "Back to the battle list"}</button>
          )}
          <button disabled={!next} onClick={() => go(next)} className="h-14 rounded-2xl bg-white px-4 font-bold disabled:opacity-30" aria-label="Next">›</button>
        </div>
      </div>
    );
  }

  // ---------- Step 2: battle order ----------
  const first = list.find((b) => b.status === "live") ?? list.find((b) => !doneByMe(data, b) && (b.kind === "prelim" || b.status !== "done"));
  const rounds = [...new Set(list.map((b) => `${b.kind}:${b.round}`))];
  return (
    <div className="space-y-3">
      {crumbs}
      <div className="flex items-center justify-between gap-2">
        <button onClick={toCats} className="h-11 rounded-full bg-white px-4 font-bold">‹ Categories</button>
        <Pill tone="ink">{PHASES[cat.phase]}</Pill>
      </div>
      <p className="display text-4xl leading-none">{cat.name}</p>
      {first ? (
        <button onClick={() => open(cat.slug, first, first.kind !== "prelim")} className="flex h-16 w-full items-center justify-between rounded-2xl bg-ink px-5 text-paper active:scale-[.99]">
          <span className="text-left text-sm font-bold text-paper/70">{first.status === "live" ? "On stage now" : "Start with"}<span className="display block text-2xl text-paper">{itemLabel(cat, first)}</span></span>
          <span className="text-lg font-black text-kj">{first.kind === "prelim" ? "Score" : "Vote"} ›</span>
        </button>
      ) : (
        <Notice kind="ok">{cat.phase === "prelims" ? "You've scored every heat. You can still tap one to change a score." : "Nothing to vote on right now. The next battle appears here when the team calls it."}</Notice>
      )}
      {list.length === 0 && <p className="text-ink/60">No battles drawn yet.</p>}
      {rounds.map((r) => {
        const [kind, round] = r.split(":");
        const rows = list.filter((b) => b.kind === kind && String(b.round) === round);
        return (
          <section key={r}>
            {kind === "bracket" && <p className="label mb-1 mt-3 px-1 text-ink/55">{roundLabel(cat.bracket_size, Number(round))}</p>}
            <ol className="space-y-2">
              {rows.map((b) => {
                const mine = doneByMe(data, b);
                const status = b.status === "live" ? <Pill tone="live">LIVE{b.kind !== "prelim" ? " · vote" : ""}</Pill>
                  : b.kind === "prelim" ? (mine ? <Pill tone="ok">✓ Scored</Pill> : <Pill tone="warn">To score</Pill>)
                  : b.status === "done" ? <Pill>Done</Pill> : <Pill>Upcoming</Pill>;
                const winner = b.kind !== "prelim" && b.winner_entry ? entryName(board, b.winner_entry) : null;
                return (
                  <li key={b.id}>
                    <button onClick={() => open(cat.slug, b, b.kind !== "prelim" && b.status === "live")}
                      className={`flex min-h-16 w-full items-center gap-3 rounded-2xl px-4 py-3 text-left active:bg-kj ${b.status === "live" ? "bg-white ring-2 ring-stamp" : mine && b.kind === "prelim" ? "bg-white/60" : "bg-white"}`}>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs text-ink/55">{itemLabel(cat, b)}</span>
                        <b className="block truncate">{entryName(board, b.a_entry)}{b.b_entry ? ` vs ${entryName(board, b.b_entry)}` : " (solo)"}</b>
                        {winner && <span className="block text-xs text-ink/60">Winner: {winner}</span>}
                      </span>
                      {status}
                      <span className="text-xl">›</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </div>
  );
}

/** A bracket battle or 7 to Smoke exchange that isn't on stage: votes only open while it is live. */
function BattleWaiting({ battle, data }: { battle: Battle; data: JudgeData }) {
  const { board } = data;
  const mine = data.votes.filter((v) => v.battle_id === battle.id).sort((a, b) => b.vote_round - a.vote_round)[0];
  const said = mine ? (mine.pick === "tie" ? "Extra round" : entryName(board, mine.pick === "a" ? battle.a_entry : battle.b_entry)) : null;
  return (
    <div className="rounded-3xl bg-ink p-5 text-paper">
      <p className="display text-4xl leading-tight">{entryName(board, battle.a_entry)} <span className="text-paper/40">vs</span> {entryName(board, battle.b_entry)}</p>
      {battle.status === "done" ? (
        <p className="mt-3 text-lg">Winner: <b className="text-kj">{entryName(board, battle.winner_entry)}</b>{battle.walkover ? " (walkover)" : ""}{said ? <span className="block text-sm text-paper/60">Your vote: {said}</span> : null}</p>
      ) : (
        <p className="mt-3 text-paper/70">Not on stage yet. Voting opens when the team calls this battle; this screen switches on by itself.</p>
      )}
    </div>
  );
}

function MyOrder({ data, slug, name }: { data: JudgeData; slug: string; name: string }) {
  const ids = [...new Set(data.board.battles.filter((b) => b.kind === "prelim" && b.category === slug).flatMap((h) => [h.a_entry, h.b_entry]).filter((x): x is number => !!x))];
  const mine = data.scores.filter((s) => ids.includes(s.entry_id));
  if (!mine.length) return null;
  const ranked = rankPrelims([...new Set(mine.map((s) => s.entry_id))], mine);
  return (
    <details className="rounded-3xl bg-white p-4">
      <summary className="flex cursor-pointer list-none items-center justify-between">
        <span><span className="display text-2xl">Your order · {name}</span><span className="block text-xs text-ink/55">{mine.length}/{ids.length} scored · from your scores only</span></span>
        <span className="text-xl">▾</span>
      </summary>
      <ol className="mt-2 text-sm">
        {ranked.map((r) => <li key={r.entry} className="flex justify-between border-t border-ink/10 py-2"><span><b>{r.rank}.</b> {entryName(data.board, r.entry)}</span><b>{r.total}</b></li>)}
      </ol>
    </details>
  );
}

/** Prelim heat: pick a dancer, tap Mind, Body and Soul on big pads, save. Switches to the other dancer after saving. */
function PrelimScorer({ heat, data, uid, reload, isLive = false }: { heat: Battle; data: JudgeData; uid: string; reload: () => Promise<void>; isLive?: boolean }) {
  const { board } = data;
  const ids = [heat.a_entry, heat.b_entry].filter((x): x is number => !!x);
  const savedFor = (id: number) => data.scores.find((s) => s.entry_id === id);
  const firstOpen = ids.find((id) => !savedFor(id)) ?? ids[0];
  const [who, setWho] = useState(firstOpen);
  const saved = savedFor(who);
  const [vals, setVals] = useState<Record<number, { mind: number; body: number; soul: number }>>(() =>
    Object.fromEntries(ids.map((id) => { const s = savedFor(id); return [id, { mind: s?.mind ?? 0, body: s?.body ?? 0, soul: s?.soul ?? 0 }]; })));
  const v = vals[who];
  const { busy, run, note } = useAction();
  const cat = board.cats.find((c) => c.slug === heat.category);
  const locked = cat?.phase !== "prelims";
  const complete = v.mind > 0 && v.body > 0 && v.soul > 0;
  const changed = !saved || saved.mind !== v.mind || saved.body !== v.body || saved.soul !== v.soul;

  const set = (k: "mind" | "body" | "soul", n: number) => { buzz(); setVals({ ...vals, [who]: { ...v, [k]: n } }); };
  const save = () => run(async () => {
    await must(sb().from("kj_scores").upsert({ entry_id: who, judge_id: uid, battle_id: heat.id, ...v }));
    buzz(30);
    await reload();
    const other = ids.find((id) => id !== who && !savedFor(id));
    if (other) setWho(other);
  });

  return (
    <div className="space-y-3">
      {isLive && <p className="flex items-center gap-2 text-sm font-bold text-stamp"><span className="h-2.5 w-2.5 animate-pulse rounded-full bg-stamp" />On stage now</p>}

      {ids.length > 1 && (
        <div className="grid grid-cols-2 gap-2" role="tablist">
          {ids.map((id) => {
            const ok = !!savedFor(id);
            return (
              <button key={id} role="tab" aria-selected={who === id} onClick={() => { buzz(); setWho(id); }}
                className={`min-h-16 rounded-2xl px-3 py-2 text-left ${who === id ? "bg-ink text-paper" : "bg-white"}`}>
                <span className="display block truncate text-2xl">{entryName(board, id)}</span>
                <span className={`text-xs font-bold ${ok ? (who === id ? "text-kj" : "text-ink") : "opacity-60"}`}>{ok ? `✓ Saved · ${savedFor(id)!.mind + savedFor(id)!.body + savedFor(id)!.soul}` : "Not scored"}</span>
              </button>
            );
          })}
        </div>
      )}
      {ids.length === 1 && <p className="display rounded-2xl bg-ink px-4 py-3 text-3xl text-paper">{entryName(board, who)}</p>}

      {locked && <Notice kind="err">Scores are locked for this category.</Notice>}

      {(["mind", "body", "soul"] as const).map((k) => (
        <section key={k} className="rounded-3xl bg-white p-3">
          <div className="mb-2 flex items-baseline justify-between px-1">
            <p className="display text-2xl capitalize">{k}</p>
            <p className="display text-3xl">{v[k] || "–"}<span className="text-base text-ink/40">/10</span></p>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <button key={n} disabled={locked} onClick={() => set(k, n)} aria-pressed={v[k] === n} aria-label={`${k} ${n}`}
                className={`h-14 rounded-xl text-xl font-black transition-transform active:scale-95 disabled:opacity-40 ${v[k] === n ? "bg-kj text-ink ring-2 ring-ink" : "bg-paper text-ink"}`}>{n}</button>
            ))}
          </div>
        </section>
      ))}
      {note}

      <div className="sticky bottom-20 z-30">
        <button disabled={locked || !complete || !changed || busy} onClick={save}
          className="flex h-16 w-full items-center justify-between rounded-2xl bg-ink px-5 text-paper shadow-xl disabled:bg-ink/40">
          <span className="display text-3xl">{v.mind + v.body + v.soul}<span className="text-base text-paper/50">/30</span></span>
          <span className="text-lg font-black">{busy ? "Saving…" : !complete ? "Tap all three" : saved && !changed ? "Saved ✓" : saved ? "Update score" : `Save ${entryName(board, who)}`}</span>
        </button>
      </div>
    </div>
  );
}

/** Battle vote: two huge buttons and an extra-round button between them. */
function VotePad({ battle, data, uid, reload }: { battle: Battle; data: JudgeData; uid: string; reload: () => Promise<void> }) {
  const { board } = data;
  const cat = board.cats.find((c) => c.slug === battle.category);
  const mine = data.votes.find((v) => v.battle_id === battle.id && v.vote_round === battle.vote_round)?.pick;
  const [pending, setPending] = useState<"a" | "b" | "tie" | null>(null);
  const { run, note } = useAction();
  const shown = pending ?? mine;
  const vote = (pick: "a" | "b" | "tie") => {
    buzz(25);
    setPending(pick);
    // Keep the tap lit while saving and after; it only resets if the save fails (or the battle changes, via key).
    run(async () => {
      await must(sb().from("kj_votes").upsert({ battle_id: battle.id, judge_id: uid, vote_round: battle.vote_round, pick }));
      await reload();
    }).then((ok) => { if (!ok) setPending(null); });
  };
  const title = `${cat?.name ?? ""} · ${battle.kind === "smoke" ? `7 to Smoke · exchange ${battle.slot}` : roundLabel(cat?.bracket_size ?? 16, battle.round)}`;
  const side = (pick: "a" | "b", id: number | null) => (
    <button onClick={() => vote(pick)} aria-pressed={shown === pick}
      className={`relative flex min-h-[26vh] w-full flex-col justify-end rounded-3xl p-5 text-left transition-transform active:scale-[.98] ${shown === pick ? "bg-kj text-ink" : "bg-ink text-paper"}`}>
      {shown === pick && <span className="absolute right-4 top-4 rounded-full bg-ink px-3 py-1 text-sm font-black text-kj">✓ YOUR VOTE</span>}
      <span className="display break-words text-[clamp(2.4rem,11vw,4.5rem)] leading-none">{entryName(board, id)}</span>
    </button>
  );
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Pill tone="live">LIVE</Pill>
        <p className="text-right text-sm font-semibold text-ink/60">{title}{battle.vote_round > 1 ? ` · Extra round ${battle.vote_round - 1}` : ""}</p>
      </div>
      {battle.vote_round > 1 && <p className="rounded-2xl bg-gold px-4 py-2 text-center font-black">Extra round — vote again</p>}
      {side("a", battle.a_entry)}
      <button onClick={() => vote("tie")} aria-pressed={shown === "tie"}
        className={`h-16 w-full rounded-2xl text-lg font-black ${shown === "tie" ? "bg-gold text-ink" : "bg-white text-ink"}`}>
        {shown === "tie" ? "✓ Extra round" : "Too close — extra round"}
      </button>
      {side("b", battle.b_entry)}
      <p className="pt-1 text-center text-sm text-ink/60">{shown ? "Vote sent. You can change it until the team confirms." : "Tap who won. Your vote is private."}</p>
      {note}
    </div>
  );
}

function Participants({ board }: { board: Board }) {
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  return (
    <div className="space-y-4">
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search dancer, crew or city" className="w-full max-w-md rounded-md border-2 border-ink bg-white px-3 py-2.5" />
      <div className="grid gap-4 md:grid-cols-2">
        {board.cats.map((c) => {
          const list = [...board.entries.values()]
            .filter((e) => e.category === c.slug && e.status === "active")
            .filter((e) => !needle || [e.label, e.crew, e.city, e.code ?? ""].join(" ").toLowerCase().includes(needle))
            .sort((a, b) => (a.seed ?? 999) - (b.seed ?? 999) || a.label.localeCompare(b.label));
          return (
            <Card key={c.slug} title={c.name} aside={<span className="flex gap-1"><Pill tone="ink">{PHASES[c.phase]}</Pill><Pill>{list.length}</Pill></span>}>
              {list.length ? (
                <ol className="text-sm">
                  {list.map((e) => (
                    <li key={e.id} className="flex justify-between gap-2 border-t border-ink/10 py-1.5">
                      <span><b>{e.label}</b>{e.invited && <span className="ml-1 text-xs text-ink/50">invited</span>}<br /><span className="text-ink/55">{[e.code, e.crew, e.city].filter(Boolean).join(" · ")}</span></span>
                      {e.seed ? <span className="font-bold">#{e.seed}</span> : null}
                    </li>
                  ))}
                </ol>
              ) : <p className="text-sm text-ink/50">No dancers yet.</p>}
            </Card>
          );
        })}
      </div>
      <p className="text-sm text-ink/55">Updates live as dancers register, partners accept and seeds are set.</p>
    </div>
  );
}

function Brackets({ board }: { board: Board }) {
  const smoke = board.cats.filter((c) => c.smoke && board.smoke.has(c.slug));
  const brackets = board.cats.filter((c) => !c.smoke && (c.phase === "bracket" || c.phase === "finished"));
  if (!smoke.length && !brackets.length) return <Card title="No brackets yet"><p className="text-ink/60">Brackets appear here once the team locks prelim scores.</p></Card>;
  return (
    <div className="space-y-6">
      {smoke.map((c) => <SmokeView key={c.slug} board={board} cat={c} />)}
      {brackets.map((c) => <BracketView key={c.slug} board={board} cat={c} />)}
    </div>
  );
}

function Rules() {
  const rows: [string, string][] = [
    ["How to judge", "Tap Judge → choose a category → choose the heat or battle from the list (it's in running order) → score → Next. The live battle is always at the top."],
    ["Prelims", "Only in Prelims → Bracket categories. Dancers are drawn into random pairs; each dances one round. Every judge scores every dancer on Mind, Body and Soul, 1 to 10 each (max 30 per judge)."],
    ["Ranking", "A dancer's prelim total is the sum of all judges' scores. Ties break on Soul, then Mind, then Body. Anything still level is flagged for the team to settle."],
    ["Top 16", "The best 16 (or fewer, by category size) are seeded 1 vs 16, 8 vs 9 and so on, so the top seeds can only meet late. Missing seeds become byes."],
    ["Battles", "From Top 16 to the final, judges vote A or B on their phones, the digital hand-raise. A majority of the panel wins."],
    ["Split", "If no side has a majority once everyone has voted (or you vote Extra round), the team calls an extra round and you vote again."],
    ["7 to Smoke", "No prelims: every dancer goes straight into the line. Every exchange is a vote. The winner stays on the floor and gets a point; the loser goes to the back of the line. First to 7 is King. If time runs out, most points wins."],
    ["Privacy", "Your scores and votes are only seen by the event team. The public sees winners only. Dancers see their own prelim scores after the event, without judge names."],
    ["Final call", "The team confirms every result on stage. They can override for walkovers, injuries or a manual hand-raise if phones fail."],
  ];
  return (
    <Card title="How judging works">
      <dl>
        {rows.map(([k, v]) => (
          <div key={k} className="grid gap-1 border-t border-ink/10 py-3 sm:grid-cols-[9rem_1fr]">
            <dt className="display text-xl">{k}</dt>
            <dd className="text-ink/80">{v}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

