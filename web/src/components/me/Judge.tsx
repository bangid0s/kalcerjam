"use client";

import { useState } from "react";
import { roundLabel } from "@/lib/tournament";
import { entryName, loadBoard, must, sb, useLive, type Battle, type Board, type ScoreRow, type Vote } from "./data";
import { Btn, Card, Notice, Pill, useAction } from "./ui";

type JudgeData = { board: Board; votes: Vote[]; scores: ScoreRow[] };

export function Judge({ uid, preview }: { uid: string; preview: boolean }) {
  const { data, error, reload } = useLive<JudgeData>(async () => {
    const [board, votes, scores] = await Promise.all([
      loadBoard(),
      must(sb().from("kj_votes").select("*").eq("judge_id", uid)),
      must(sb().from("kj_scores").select("*").eq("judge_id", uid)),
    ]);
    return { board, votes: votes as Vote[], scores: scores as ScoreRow[] };
  }, ["kj_battles", "kj_smoke", "kj_categories"], 10000);
  const [cat, setCat] = useState<string | null>(null);

  if (error) return <Notice kind="err">{error}</Notice>;
  if (!data) return <p>Loading…</p>;
  const { board } = data;
  const live = board.battles.find((b) => b.status === "live");
  const prelimCats = board.cats.filter((c) => c.phase === "prelims");
  const activeCat = cat ?? prelimCats.find((c) => c.slug === live?.category)?.slug ?? prelimCats[0]?.slug ?? null;
  const heats = board.battles.filter((b) => b.kind === "prelim" && b.category === activeCat).sort((x, y) => x.slot - y.slot);
  const scored = new Set(data.scores.map((s) => s.entry_id));

  return (
    <div className="space-y-6">
      {preview && <Notice kind="info">Preview: you don&apos;t have the judge role, so scores and votes won&apos;t save.</Notice>}
      <Card dark title={live ? "On stage" : "Waiting for the next battle"} aside={live && <Pill tone="live">LIVE</Pill>}>
        {live ? <LiveBattle battle={live} data={data} uid={uid} reload={reload} /> : <p className="text-paper/60">The team puts each battle on stage. It appears here automatically.</p>}
      </Card>

      {prelimCats.length > 0 && (
        <Card title="Prelim score sheets" aside={
          <div className="flex flex-wrap gap-1">
            {prelimCats.map((c) => (
              <button key={c.slug} onClick={() => setCat(c.slug)} className={`rounded-full px-3 py-1 text-sm font-bold ${activeCat === c.slug ? "bg-ink text-paper" : "bg-ink/10"}`}>{c.name}</button>
            ))}
          </div>
        }>
          <p className="mb-3 text-sm text-ink/60">Score any heat here if you missed it live. Scores lock when the team builds the bracket.</p>
          <ul className="divide-y divide-ink/10">
            {heats.map((h) => {
              const ids = [h.a_entry, h.b_entry].filter((x): x is number => !!x);
              const done = ids.every((id) => scored.has(id));
              return (
                <li key={h.id}>
                  <details className="py-2">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-1">
                      <span><span className="text-sm text-ink/55">Heat {h.slot}</span> <b>{ids.map((id) => entryName(board, id)).join(" vs ")}</b></span>
                      {done ? <Pill tone="ok">✓ Scored</Pill> : <Pill tone="warn">To score</Pill>}
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
      )}
    </div>
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

  return (
    <div className={`rounded-xl p-4 ${dark ? "bg-ink-2" : "bg-paper"}`}>
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
        <Btn kind={dark ? "kj" : "ink"} disabled={!complete || !changed || busy} onClick={save}>{saved ? (changed ? "Update" : "Saved ✓") : "Save"}</Btn>
      </div>
      {note && <div className="mt-2">{note}</div>}
    </div>
  );
}
