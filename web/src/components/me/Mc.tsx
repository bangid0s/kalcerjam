"use client";

import { BOARD_TABLES, entryName, loadBoard, runOrder, useLive, type Board } from "./data";
import { BracketView, SmokeView, battleTitle } from "./boards";
import { Card, Notice, Pill } from "./ui";

/** MC run sheet: big names for what's on stage, what's next, and results to announce. Read only. */
export function Mc() {
  const { data: board, error } = useLive(loadBoard, BOARD_TABLES, 8000);
  if (error) return <Notice kind="err">{error}</Notice>;
  if (!board) return <p>Loading…</p>;

  const order = runOrder(board);
  const live = order.find((b) => b.status === "live");
  const next = order.filter((b) => b.status === "pending" && b !== live && (b.a_entry || b.b_entry)).slice(0, 6);
  const recent = [...board.battles].filter((b) => b.winner_entry && b.kind !== "prelim" && b.decided_at).sort((x, y) => (y.decided_at ?? "").localeCompare(x.decided_at ?? "")).slice(0, 6);
  const champions = board.cats.filter((c) => c.phase === "finished");

  return (
    <div className="space-y-6">
      <Card dark title="On stage" aside={live && <Pill tone="live">LIVE</Pill>}>
        {live ? (
          <>
            <p className="label text-paper/60">{battleTitle(board, live)}{live.vote_round > 1 ? ` · extra round ${live.vote_round - 1}` : ""}</p>
            <div className="mt-4 grid items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
              <Cue board={board} id={live.a_entry} />
              <p className="display text-center text-4xl text-kj">vs</p>
              <Cue board={board} id={live.b_entry} right />
            </div>
          </>
        ) : (
          <p className="text-paper/60">Nothing on stage. Cypher time.</p>
        )}
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card title="Up next">
          {next.length ? (
            <ol className="divide-y divide-ink/10">
              {next.map((b, i) => (
                <li key={b.id} className="py-2">
                  <p className="text-xs text-ink/55">{battleTitle(board, b)}</p>
                  <p className={i === 0 ? "display text-2xl" : "font-bold"}>{entryName(board, b.a_entry)}{b.b_entry || b.kind !== "prelim" ? ` vs ${entryName(board, b.b_entry)}` : " (solo)"}</p>
                </li>
              ))}
            </ol>
          ) : <p className="text-ink/60">Nothing queued.</p>}
        </Card>
        <Card title="Results to announce">
          {recent.length ? (
            <ul className="divide-y divide-ink/10">
              {recent.map((b) => (
                <li key={b.id} className="py-2">
                  <p className="text-xs text-ink/55">{battleTitle(board, b)}{b.walkover ? " · walkover" : ""}</p>
                  <p><b className="bg-kj px-1">{entryName(board, b.winner_entry)}</b> beat {entryName(board, b.winner_entry === b.a_entry ? b.b_entry : b.a_entry)}</p>
                </li>
              ))}
            </ul>
          ) : <p className="text-ink/60">No results yet.</p>}
        </Card>
      </div>

      {champions.length > 0 && (
        <Card title="Champions">
          <ul className="grid gap-2 sm:grid-cols-2">
            {champions.map((c) => {
              const final = board.battles.filter((b) => b.category === c.slug && b.kind === "bracket").sort((x, y) => y.round - x.round)[0];
              const champ = c.smoke ? board.smoke.get(c.slug)?.champion : final?.winner_entry;
              return <li key={c.slug} className="rounded-lg bg-paper p-3"><p className="text-sm text-ink/55">{c.name}</p><p className="display text-2xl">👑 {entryName(board, champ)}</p></li>;
            })}
          </ul>
        </Card>
      )}

      {board.cats.filter((c) => c.phase === "smoke" || (c.smoke && c.phase === "finished")).map((c) => <SmokeView key={c.slug} board={board} cat={c} />)}
      {board.cats.filter((c) => !c.smoke && (c.phase === "bracket" || c.phase === "finished")).map((c) => <BracketView key={c.slug} board={board} cat={c} />)}
    </div>
  );
}

function Cue({ board, id, right = false }: { board: Board; id: number | null; right?: boolean }) {
  const e = id ? board.entries.get(id) : null;
  return (
    <div className={right ? "md:text-right" : ""}>
      <p className="display break-words text-[clamp(2.4rem,7vw,5rem)]">{e?.label ?? (id ? `#${id}` : "Solo")}</p>
      {e && <p className="text-paper/60">{[e.crew, e.city, e.country !== "ID" ? e.country : ""].filter(Boolean).join(" · ")}{e.seed ? ` · seed #${e.seed}` : ""}</p>}
    </div>
  );
}
