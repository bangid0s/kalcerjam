"use client";

import type { ReactNode } from "react";
import { BOARD_TABLES, entryName, loadBoard, runOrder, useLive } from "@/components/me/data";
import { BracketView, SmokeView, battleTitle } from "@/components/me/boards";
import { SectionTag } from "./bits";

type Copy = { nowLabel: string; nextLabel: string; bracketsTag: string; smokeTag: string; footnote: string; stream: ReactNode };

/** Public live view from Supabase (Realtime). Shows the static `preview` until the first battle exists. */
export function LiveBoard({ copy, preview }: { copy: Copy; preview: ReactNode }) {
  const { data: board } = useLive(loadBoard, BOARD_TABLES, 20000);
  if (!board || board.battles.length === 0) return <>{preview}</>;

  const order = runOrder(board);
  const live = order.find((b) => b.status === "live");
  const next = order.filter((b) => b.status === "pending" && (b.a_entry || b.b_entry)).slice(0, 2);
  const brackets = board.cats.filter((c) => !c.smoke && (c.phase === "bracket" || c.phase === "finished"));
  const smokes = board.cats.filter((c) => c.smoke && board.smoke.has(c.slug));
  const vs = (a: number | null, b: number | null, solo: boolean) => (solo ? entryName(board, a) : `${entryName(board, a)} vs ${entryName(board, b)}`);

  return (
    <>
      <section className="mx-auto mt-16 max-w-7xl px-4 md:px-8">
        <div className="grid gap-px overflow-hidden rounded-2xl bg-ink text-paper md:grid-cols-[1.6fr_1fr]">
          <div className="bg-ink p-6">
            <p className="label flex items-center gap-2 text-stamp"><span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-stamp" />{copy.nowLabel}{live ? ` · ${battleTitle(board, live)}` : ""}</p>
            {live ? (
              <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <p className="display break-words text-[clamp(2.2rem,7vw,4.5rem)]">{entryName(board, live.a_entry)}</p>
                <p className="display text-2xl text-kj">{live.b_entry ? "vs" : ""}</p>
                <p className="display break-words text-right text-[clamp(2.2rem,7vw,4.5rem)]">{live.b_entry ? entryName(board, live.b_entry) : ""}</p>
              </div>
            ) : (
              <p className="display mt-4 text-4xl text-paper/40">Cypher</p>
            )}
          </div>
          <div className="bg-ink-2 p-6">
            <p className="label text-paper/50">{copy.nextLabel}</p>
            {next.map((m, i) => (
              <p key={m.id} className={i === 0 ? "display mt-3 text-3xl" : "display mt-1 text-xl text-paper/50"}>
                {vs(m.a_entry, m.b_entry, m.kind === "prelim" && !m.b_entry)}
              </p>
            ))}
          </div>
        </div>
        {copy.stream}
      </section>

      {brackets.length > 0 && (
        <section className="mx-auto mt-24 max-w-7xl space-y-6 px-4 md:mt-32 md:px-8">
          <SectionTag>{copy.bracketsTag}</SectionTag>
          {brackets.map((c) => <BracketView key={c.slug} board={board} cat={c} />)}
        </section>
      )}

      {smokes.length > 0 && (
        <section className="mx-auto mt-24 grid max-w-7xl gap-8 px-4 md:mt-32 md:px-8 lg:grid-cols-2">
          <div className="lg:col-span-2"><SectionTag>{copy.smokeTag}</SectionTag></div>
          {smokes.map((c) => <SmokeView key={c.slug} board={board} cat={c} />)}
        </section>
      )}

      <p className="label mx-auto mt-10 max-w-7xl px-4 text-ink/50 md:px-8">{copy.footnote}</p>
    </>
  );
}
