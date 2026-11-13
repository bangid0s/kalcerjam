"use client";

import { useState } from "react";
import { rankPrelims, roundLabel } from "@/lib/tournament";
import { BOARD_TABLES, PHASES, entryName, loadBoard, must, sb, useLive, type Battle, type Board, type ScoreRow, type Vote } from "./data";
import { BracketView, SmokeView } from "./boards";
import { Btn, Card, Notice, Pill, useAction } from "./ui";

type JudgeData = { board: Board; votes: Vote[]; scores: ScoreRow[] };
type Tab = "judge" | "participants" | "brackets" | "rules";

export function Judge({ uid, preview, onBecomeJudge }: { uid: string; preview: boolean; onBecomeJudge?: () => void }) {
  const { data, error, reload } = useLive<JudgeData>(async () => {
    const [board, votes, scores] = await Promise.all([
      loadBoard(),
      must(sb().from("kj_votes").select("*").eq("judge_id", uid)),
      must(sb().from("kj_scores").select("*").eq("judge_id", uid)),
    ]);
    return { board, votes: votes as Vote[], scores: scores as ScoreRow[] };
  }, BOARD_TABLES, 10000);
  const [tab, setTab] = useState<Tab>("judge");

  if (error) return <Notice kind="err">{error}</Notice>;
  if (!data) return <p>Loading…</p>;
  const tabs: [Tab, string][] = [["judge", "Judge"], ["participants", "Participants"], ["brackets", "Brackets"], ["rules", "How judging works"]];

  return (
    <div className="space-y-6">
      {preview && (
        <Notice kind="info">
          Preview only: this account doesn&apos;t have the judge role, so scores and votes won&apos;t save.{" "}
          {onBecomeJudge && <button onClick={onBecomeJudge} className="underline">Make me a judge</button>}
        </Notice>
      )}
      <nav className="flex flex-wrap gap-1 rounded-full bg-white p-1" aria-label="Judge tools">
        {tabs.map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className={`rounded-full px-4 py-2 text-sm font-bold ${tab === k ? "bg-ink text-paper" : "hover:bg-ink/10"}`}>{label}</button>
        ))}
      </nav>
      {tab === "judge" && <JudgeNow data={data} uid={uid} reload={reload} />}
      {tab === "participants" && <Participants board={data.board} />}
      {tab === "brackets" && <Brackets board={data.board} />}
      {tab === "rules" && <Rules />}
    </div>
  );
}

function JudgeNow({ data, uid, reload }: { data: JudgeData; uid: string; reload: () => Promise<void> }) {
  const { board } = data;
  const [cat, setCat] = useState<string | null>(null);
  const live = board.battles.find((b) => b.status === "live");
  const prelimCats = board.cats.filter((c) => c.phase === "prelims");
  const activeCat = cat ?? prelimCats.find((c) => c.slug === live?.category)?.slug ?? prelimCats[0]?.slug ?? null;
  const heats = board.battles.filter((b) => b.kind === "prelim" && b.category === activeCat).sort((x, y) => x.slot - y.slot);
  const scored = new Set(data.scores.map((s) => s.entry_id));
  const heatIds = [...new Set(heats.flatMap((h) => [h.a_entry, h.b_entry]).filter((x): x is number => !!x))];
  const mine = rankPrelims(heatIds.filter((id) => scored.has(id)), data.scores);
  const done = heatIds.filter((id) => scored.has(id)).length;

  return (
    <>
      <Card dark title={live ? "On stage" : "Waiting for the next battle"} aside={live && <Pill tone="live">LIVE</Pill>}>
        {live ? <LiveBattle battle={live} data={data} uid={uid} reload={reload} /> : <p className="text-paper/60">The team puts each battle on stage. It appears here by itself — no need to refresh.</p>}
      </Card>

      {prelimCats.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
          <Card title="Prelim score sheets" aside={
            <div className="flex flex-wrap gap-1">
              {prelimCats.map((c) => (
                <button key={c.slug} onClick={() => setCat(c.slug)} className={`rounded-full px-3 py-1 text-sm font-bold ${activeCat === c.slug ? "bg-ink text-paper" : "bg-ink/10"}`}>{c.name}</button>
              ))}
            </div>
          }>
            <p className="mb-3 text-sm text-ink/60">You&apos;ve scored <b>{done}/{heatIds.length}</b> dancers. Score any heat here if you missed it live. Scores lock when the team builds the bracket.</p>
            <ul className="divide-y divide-ink/10">
              {heats.map((h) => {
                const ids = [h.a_entry, h.b_entry].filter((x): x is number => !!x);
                const ok = ids.every((id) => scored.has(id));
                return (
                  <li key={h.id}>
                    <details className="py-2" open={h.status === "live"}>
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-1">
                        <span><span className="text-sm text-ink/55">Heat {h.slot}</span> <b>{ids.map((id) => entryName(board, id)).join(" vs ")}</b></span>
                        <span className="flex gap-1">{h.status === "live" && <Pill tone="live">LIVE</Pill>}{ok ? <Pill tone="ok">✓ Scored</Pill> : <Pill tone="warn">To score</Pill>}</span>
                      </summary>
                      <div className="grid gap-4 pt-3 md:grid-cols-2">
                        {ids.map((id) => <ScoreSheet key={id} entry={id} battle={h} data={data} uid={uid} reload={reload} />)}
                      </div>
                    </details>
                  </li>
                );
              })}
            </ul>
          </Card>
          <Card title="Your order">
            <p className="mb-2 text-sm text-ink/60">From your scores only, to keep you consistent. The real ranking adds up every judge.</p>
            {mine.length ? (
              <ol className="text-sm">
                {mine.map((r) => (
                  <li key={r.entry} className="flex justify-between border-t border-ink/10 py-1"><span><b>{r.rank}.</b> {entryName(board, r.entry)}</span><span className="font-bold">{r.total}</span></li>
                ))}
              </ol>
            ) : <p className="text-sm text-ink/50">Nothing scored yet.</p>}
          </Card>
        </div>
      ) : (
        <Card title="No prelims running">
          <p className="text-ink/60">Score sheets show up here when the team draws prelim heats for a category. Brackets and 7 to Smoke battles come to the On stage card above.</p>
        </Card>
      )}
    </>
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
    ["Prelims", "Dancers are drawn into random pairs; each dances one round. Every judge scores every dancer on Mind, Body and Soul, 1 to 10 each (max 30 per judge)."],
    ["Ranking", "A dancer's prelim total is the sum of all judges' scores. Ties break on Soul, then Mind, then Body. Anything still level is flagged for the team to settle."],
    ["Top 16", "The best 16 (or fewer, by category size) are seeded 1 vs 16, 8 vs 9 and so on, so the top seeds can only meet late. Missing seeds become byes."],
    ["Battles", "From Top 16 to the final, judges vote A or B on their phones, the digital hand-raise. A majority of the panel wins."],
    ["Split", "If no side has a majority once everyone has voted (or you vote Extra round), the team calls an extra round and you vote again."],
    ["7 to Smoke", "Every exchange is a vote. The winner stays on the floor and gets a point; the loser goes to the back of the line. First to 7 is King. If time runs out, most points wins."],
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

function LiveBattle({ battle, data, uid, reload }: { battle: Battle; data: JudgeData; uid: string; reload: () => Promise<void> }) {
  const { board } = data;
  const cat = board.cats.find((c) => c.slug === battle.category);
  const title = `${cat?.name ?? battle.category} · ${battle.kind === "prelim" ? `Prelim heat ${battle.slot}` : battle.kind === "smoke" ? `Exchange ${battle.slot}` : roundLabel(cat?.bracket_size ?? 16, battle.round)}`;

  if (battle.kind === "prelim") {
    const ids = [battle.a_entry, battle.b_entry].filter((x): x is number => !!x);
    return (
      <div>
        <p className="label text-paper/60">{title}</p>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          {ids.map((id) => <ScoreSheet key={id} entry={id} battle={battle} data={data} uid={uid} reload={reload} dark />)}
        </div>
      </div>
    );
  }
  return <VotePad battle={battle} title={title} data={data} uid={uid} reload={reload} />;
}

function VotePad({ battle, title, data, uid, reload }: { battle: Battle; title: string; data: JudgeData; uid: string; reload: () => Promise<void> }) {
  const { board } = data;
  const mine = data.votes.find((v) => v.battle_id === battle.id && v.vote_round === battle.vote_round)?.pick;
  const { busy, run, note } = useAction();
  const vote = (pick: "a" | "b" | "tie") => run(async () => {
    await must(sb().from("kj_votes").upsert({ battle_id: battle.id, judge_id: uid, vote_round: battle.vote_round, pick }));
    await reload();
  });
  const btn = (pick: "a" | "b" | "tie", label: string, cls: string) => (
    <button disabled={busy} onClick={() => vote(pick)} aria-pressed={mine === pick}
      className={`min-h-28 rounded-2xl border-4 p-4 text-left transition-colors disabled:opacity-60 ${mine === pick ? "border-kj bg-kj text-ink" : `border-paper/20 ${cls}`}`}>
      <span className="display block break-words text-[clamp(1.8rem,5vw,3rem)]">{label}</span>
      {mine === pick && <span className="label">Your vote ✓</span>}
    </button>
  );
  return (
    <div>
      <p className="label text-paper/60">{title}{battle.vote_round > 1 ? ` · Extra round ${battle.vote_round - 1}` : ""}</p>
      <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto_1fr]">
        {btn("a", entryName(board, battle.a_entry), "bg-ink-2 hover:border-paper")}
        {btn("tie", "Extra round", "bg-ink-2 text-paper/70 hover:border-paper md:w-40")}
        {btn("b", entryName(board, battle.b_entry), "bg-ink-2 hover:border-paper")}
      </div>
      <p className="mt-3 text-sm text-paper/60">Your vote is private. You can change it until the team confirms the result.</p>
      {note && <div className="mt-3">{note}</div>}
    </div>
  );
}

function ScoreSheet({ entry, battle, data, uid, reload, dark = false }: { entry: number; battle: Battle; data: JudgeData; uid: string; reload: () => Promise<void>; dark?: boolean }) {
  const saved = data.scores.find((s) => s.entry_id === entry);
  const [v, setV] = useState({ mind: saved?.mind ?? 0, body: saved?.body ?? 0, soul: saved?.soul ?? 0 });
  const { busy, run, note } = useAction();
  const complete = v.mind > 0 && v.body > 0 && v.soul > 0;
  const changed = !saved || saved.mind !== v.mind || saved.body !== v.body || saved.soul !== v.soul;
  const save = () => run(async () => {
    await must(sb().from("kj_scores").upsert({ entry_id: entry, judge_id: uid, battle_id: battle.id, ...v }));
    await reload();
  }, "Saved");

  const locked = data.board.cats.find((c) => c.slug === battle.category)?.phase !== "prelims";
  return (
    <div className={`rounded-xl p-4 ${dark ? "bg-ink-2" : "bg-paper"}`}>
      {locked && <p className="mb-2 text-xs font-bold text-stamp">Scores are locked for this category.</p>}
      <p className="display text-3xl">{entryName(data.board, entry)}</p>
      {(["mind", "body", "soul"] as const).map((k) => (
        <div key={k} className="mt-3">
          <p className="label mb-1 capitalize opacity-70">{k} <span className="float-right font-bold">{v[k] || "–"}</span></p>
          <div className="grid grid-cols-10 gap-1">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <button key={n} onClick={() => setV({ ...v, [k]: n })} aria-pressed={v[k] === n} aria-label={`${k} ${n}`}
                className={`rounded py-2 text-sm font-bold ${v[k] === n ? "bg-kj text-ink" : dark ? "bg-ink text-paper/80" : "bg-white"}`}>{n}</button>
            ))}
          </div>
        </div>
      ))}
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="display text-2xl">Total {v.mind + v.body + v.soul}</span>
        <Btn kind={dark ? "kj" : "ink"} disabled={locked || !complete || !changed || busy} onClick={save}>{saved ? (changed ? "Update" : "Saved ✓") : "Save"}</Btn>
      </div>
      {note && <div className="mt-2">{note}</div>}
    </div>
  );
}
