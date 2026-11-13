"use client";

import { roundCount, roundLabel } from "@/lib/tournament";
import { entryName, type Battle, type Board, type Category } from "./data";

/** Bracket for one category from live data. Winners only — no scores or votes. */
export function BracketView({ board, cat }: { board: Board; cat: Category }) {
  const size = cat.bracket_size;
  const rounds = Array.from({ length: roundCount(size) }, (_, i) => i + 1);
  const byKey = new Map(board.battles.filter((b) => b.category === cat.slug && b.kind === "bracket").map((b) => [`${b.round}:${b.slot}`, b]));
  const seed = (id: number | null) => (id ? board.entries.get(id)?.seed : null);
  return (
    <div className="rounded-2xl bg-ink-2 p-4 text-paper md:p-6">
      <p className="display mb-5 text-3xl">{cat.name}</p>
      <div className="-mx-4 overflow-x-auto px-4 pb-2">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${rounds.length}, minmax(10rem, 1fr))`, minWidth: rounds.length * 180 }}>
          {rounds.map((r) => (
            <div key={r} className="flex flex-col">
              <p className="label mb-2 text-paper/50">{roundLabel(size, r)}</p>
              <div className="flex flex-1 flex-col justify-around gap-2">
                {Array.from({ length: size / 2 ** r }, (_, s) => {
                  const m = byKey.get(`${r}:${s}`);
                  return (
                    <div key={s} className={`border-l-2 ${m?.status === "live" ? "border-stamp" : m?.winner_entry ? "border-kj" : "border-paper/20"} bg-ink`}>
                      {[m?.a_entry ?? null, m?.b_entry ?? null].map((id, si) => {
                        const won = m?.winner_entry && m.winner_entry === id;
                        const lost = m?.winner_entry && id && m.winner_entry !== id;
                        return (
                          <div key={si} className={`flex items-center justify-between gap-2 px-2 py-1.5 text-sm ${si === 0 ? "border-b border-paper/10" : ""} ${won ? "bg-kj font-bold text-ink" : lost ? "text-paper/40 line-through" : "text-paper"}`}>
                            <span className="truncate">{id ? entryName(board, id) : m?.winner_entry && r === 1 ? "bye" : "TBA"}</span>
                            {seed(id) ? <span className="label text-[.6rem] opacity-60">#{seed(id)}</span> : null}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** 7 to Smoke board: holder of the floor, the line and points out of the target. */
export function SmokeView({ board, cat }: { board: Board; cat: Category }) {
  const s = board.smoke.get(cat.slug);
  const target = cat.smoke_target;
  if (!s) return null;
  const order = [s.on_floor, ...s.queue].filter((x): x is number => x != null);
  const live = board.battles.find((b) => b.category === cat.slug && b.kind === "smoke" && b.status === "live");
  const onFloor = new Set(live ? [live.a_entry, live.b_entry] : []);
  return (
    <div className="paper p-4 md:p-6">
      <div className="mb-4 flex items-end justify-between gap-3">
        <p className="display text-3xl">{cat.name}</p>
        <p className="label">Race to {target}</p>
      </div>
      {s.champion && <p className="mb-3 rounded-md bg-gold px-3 py-2 font-bold">👑 {entryName(board, s.champion)}</p>}
      <ol className="border-b border-ink/20">
        {order.map((id) => {
          const p = s.points[String(id)] ?? 0;
          const hot = onFloor.has(id);
          return (
            <li key={id} className={`grid grid-cols-[1fr_auto] items-center gap-3 border-t border-ink/20 px-2 py-2 ${hot ? "bg-ink text-paper" : ""}`}>
              <span className="flex items-center gap-2 truncate font-bold">
                {hot && <span className="label bg-kj px-1.5 text-[.65rem] text-ink">On floor</span>}
                {id === s.on_floor && !hot && <span className="label bg-ink/10 px-1.5 text-[.65rem]">Holds floor</span>}
                {entryName(board, id)}
              </span>
              <span className="flex gap-1" aria-label={`${p} of ${target} points`}>
                {Array.from({ length: target }, (_, b) => (
                  <span key={b} className={`h-4 w-4 border sm:h-5 sm:w-5 ${hot ? "border-paper" : "border-ink"} ${b < p ? (b === target - 1 ? "bg-gold" : "bg-kj") : b === target - 1 ? "bg-gold/25" : ""}`} />
                ))}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function battleTitle(board: Board, b: Battle) {
  const cat = board.cats.find((c) => c.slug === b.category);
  const what = b.kind === "prelim" ? `Prelims · heat ${b.slot}` : b.kind === "smoke" ? `7 to Smoke · exchange ${b.slot}` : roundLabel(cat?.bracket_size ?? 16, b.round);
  return `${cat?.name ?? b.category} · ${what}`;
}
