"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { sb } from "@/components/admin/supabase";
import { tally, type Pick } from "@/lib/tournament";

export { sb };

export type Role = "spectator" | "participant" | "judge" | "mc" | "team";
export type Phase = "setup" | "prelims" | "bracket" | "smoke" | "finished";

export type Profile = {
  id: string; email: string | null; role: Role; code: string; name: string; stage_name: string; crew: string; city: string;
  country: string; birth_date: string | null; gender: "f" | "m" | "x" | null; phone: string; instagram: string;
  guardian_name: string; lang: "en" | "id"; pass_token: string; checked_in_at: string | null;
};
export type Category = {
  slug: string; name: string; sort: number; rule: "open" | "bgirl" | "u12" | "o35"; team: boolean; smoke: boolean;
  registration_open: boolean; phase: Phase; bracket_size: number; smoke_qualifiers: number; smoke_target: number;
  age_ref_date: string; results_published: boolean;
};
export type Entry = {
  id: number; category: string; dancer_id: string | null; partner_id: string | null; partner_status: "pending" | "accepted" | "declined" | null;
  guest_name: string | null; invited: boolean; team_name: string; seed: number | null; status: "active" | "withdrawn" | "disqualified"; created_at: string;
};
export type PublicEntry = { id: number; category: string; seed: number | null; status: string; invited: boolean; label: string; code: string | null; crew: string; city: string; country: string };
export type Battle = {
  id: number; category: string; kind: "prelim" | "bracket" | "smoke"; round: number; slot: number; a_entry: number | null; b_entry: number | null;
  winner_entry: number | null; status: "pending" | "live" | "done"; walkover: boolean; vote_round: number; decided_at: string | null;
};
export type SmokeRow = { category: string; lineup: number[]; on_floor: number | null; queue: number[]; points: Record<string, number>; champion: number | null; started_at: string | null };
export type Payment = { dancer_id: string; status: "pending" | "paid" | "rejected"; method: string; amount: string; reference: string; proof_path: string | null; note: string; submitted_at: string; verified_at: string | null; verified_by: string | null };
export type Vote = { battle_id: number; judge_id: string; vote_round: number; pick: Pick };
export type ScoreRow = { entry_id: number; judge_id: string; battle_id: number | null; mind: number; body: number; soul: number };

export const errMsg = (e: unknown) => (e && typeof e === "object" && "message" in e ? String((e as { message: unknown }).message) : String(e));

/** Throw on Supabase errors so callers can use try/catch. */
export async function must<T>(q: PromiseLike<{ data: T; error: { message: string } | null }>): Promise<T> {
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data;
}

/** Re-run `load` whenever one of `tables` changes (Supabase Realtime), with a slow poll as a fallback. */
export function useLive<T>(load: () => Promise<T>, tables: string[], pollMs = 15000) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const loadRef = useRef(load);
  useEffect(() => { loadRef.current = load; });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reload = useCallback(async () => {
    try { setData(await loadRef.current()); setError(""); } catch (e) { setError(errMsg(e)); }
  }, []);

  const key = tables.join(",");
  useEffect(() => {
    const first = setTimeout(reload, 0);
    const soon = () => { if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(reload, 250); };
    const ch = sb().channel(`kj-live-${key}-${Math.random().toString(36).slice(2)}`);
    for (const t of key.split(",")) ch.on("postgres_changes", { event: "*", schema: "public", table: t }, soon);
    ch.subscribe();
    const poll = setInterval(reload, pollMs);
    const onFocus = () => reload();
    window.addEventListener("focus", onFocus);
    return () => { clearTimeout(first); clearInterval(poll); window.removeEventListener("focus", onFocus); sb().removeChannel(ch); };
  }, [key, pollMs, reload]);

  return { data, error, reload };
}

export type Board = {
  cats: Category[];
  battles: Battle[];
  entries: Map<number, PublicEntry>;
  smoke: Map<string, SmokeRow>;
  judges: number;
};

/** Everything the live views need: categories, battles, entry names, smoke boards and the panel size. */
export async function loadBoard(): Promise<Board> {
  const [cats, battles, entries, smoke, judges] = await Promise.all([
    must(sb().from("kj_categories").select("*").order("sort")),
    must(sb().from("kj_battles").select("*").order("id")),
    must(sb().from("kj_public_entries").select("*")),
    must(sb().from("kj_smoke").select("*")),
    sb().from("kj_people").select("id", { count: "exact", head: true }).eq("role", "judge"),
  ]);
  return {
    cats: cats as Category[],
    battles: battles as Battle[],
    entries: new Map((entries as PublicEntry[]).map((e) => [e.id, e])),
    smoke: new Map((smoke as SmokeRow[]).map((s) => [s.category, s])),
    judges: judges.count ?? 0,
  };
}
export const BOARD_TABLES = ["kj_battles", "kj_smoke", "kj_categories"];

export const entryName = (b: Board | null, id: number | null | undefined) => (id == null ? "TBA" : b?.entries.get(id)?.label ?? `#${id}`);

/** Order battles the way they are called: by category order, prelims → bracket → smoke, then round and slot. */
export function runOrder(b: Board): Battle[] {
  const sort = new Map(b.cats.map((c) => [c.slug, c.sort]));
  const kind = { prelim: 0, bracket: 1, smoke: 2 };
  return [...b.battles].sort((x, y) => (sort.get(x.category) ?? 0) - (sort.get(y.category) ?? 0) || kind[x.kind] - kind[y.kind] || x.round - y.round || x.slot - y.slot);
}

export function tallyFor(votes: Vote[], battle: Battle, panel: number) {
  const picks = votes.filter((v) => v.battle_id === battle.id && v.vote_round === battle.vote_round).map((v) => v.pick);
  return tally(picks, Math.max(panel, 1));
}

export const PHASES: Record<Phase, string> = { setup: "Registration", prelims: "Prelims", bracket: "Bracket", smoke: "7 to Smoke", finished: "Finished" };
