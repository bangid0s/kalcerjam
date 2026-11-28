"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { sb } from "@/components/admin/supabase";
import { fromPanel, tally, type Pick } from "@/lib/tournament";

export { sb };

export type Role = "spectator" | "participant" | "judge" | "mc" | "team";
export type Phase = "setup" | "prelims" | "bracket" | "smoke" | "finished";

export type Profile = {
  id: string; email: string | null; role: Role; code: string; name: string; stage_name: string; crew: string; city: string;
  country: string; birth_date: string | null; gender: "f" | "m" | "x" | null; phone: string; instagram: string;
  guardian_name: string; lang: "en" | "id"; pass_token: string; checked_in_at: string | null;
};
export type Format = "smoke" | "prelims_bracket" | "bracket";
export type Category = {
  slug: string; name: string; sort: number; rule: "open" | "bgirl" | "u12" | "o35"; team: boolean; smoke: boolean; format?: Format;
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
  /** Judge ids on each category's panel (accounts that still have the judge role). Crew only. */
  panels: Map<string, string[]>;
};

/** Everything the live views need: categories, battles, entry names, smoke boards and judge panels. */
export async function loadBoard(): Promise<Board> {
  const [cats, battles, entries, smoke, seats, judges] = await Promise.all([
    must(sb().from("kj_categories").select("*").order("sort")),
    must(sb().from("kj_battles").select("*").order("id")),
    must(sb().from("kj_public_entries").select("*")),
    must(sb().from("kj_smoke").select("*")),
    // Panels are crew-only; for anyone else these come back empty. Before the panels migration the table is missing: treat as empty.
    sb().from("kj_category_judges").select("category, judge_id"),
    sb().from("kj_people").select("id").eq("role", "judge"),
  ]);
  const isJudge = new Set(((judges.data ?? []) as { id: string }[]).map((j) => j.id));
  const panels = new Map<string, string[]>();
  for (const s of (seats.data ?? []) as PanelSeat[]) {
    if (!isJudge.has(s.judge_id)) continue;
    panels.set(s.category, [...(panels.get(s.category) ?? []), s.judge_id]);
  }
  return {
    cats: cats as Category[],
    battles: battles as Battle[],
    entries: new Map((entries as PublicEntry[]).map((e) => [e.id, e])),
    smoke: new Map((smoke as SmokeRow[]).map((s) => [s.category, s])),
    panels,
  };
}
export const BOARD_TABLES = ["kj_battles", "kj_smoke", "kj_categories", "kj_entries", "kj_category_judges"];

export type PanelSeat = { category: string; judge_id: string };

/** The judges on a category's panel. 7 to Smoke never has one: the team decides each exchange. */
export const panelOf = (b: Board, slug: string): string[] => b.panels.get(slug) ?? [];

/** Does this category need a judge panel? Only formats with prelim scores or bracket votes do. */
export const needsPanel = (c: Category) => formatOf(c) !== "smoke";

export const entryName = (b: Board | null, id: number | null | undefined) => (id == null ? "TBA" : b?.entries.get(id)?.label ?? `#${id}`);

/** Order battles the way they are called: by category order, prelims → bracket → smoke, then round and slot. */
export function runOrder(b: Board): Battle[] {
  const sort = new Map(b.cats.map((c) => [c.slug, c.sort]));
  const kind = { prelim: 0, bracket: 1, smoke: 2 };
  return [...b.battles].sort((x, y) => (sort.get(x.category) ?? 0) - (sort.get(y.category) ?? 0) || kind[x.kind] - kind[y.kind] || x.round - y.round || x.slot - y.slot);
}

/** Vote count for the battle's current round. Only judges on the panel count; the majority is of the panel. */
export function tallyFor(votes: Vote[], battle: Battle, panel: string[]) {
  const picks = fromPanel(votes.filter((v) => v.battle_id === battle.id && v.vote_round === battle.vote_round), panel).map((v) => v.pick);
  return tally(picks, Math.max(panel.length, 1));
}

/** The category's format (falls back to the old `smoke` flag if the format migration isn't applied yet). */
export const formatOf = (c: Category): Format => c.format ?? (c.smoke ? "smoke" : "prelims_bracket");

export const FORMATS: Record<Format, { name: string; short: string; about: string; steps: string[] }> = {
  smoke: { name: "7 to Smoke", short: "7 to Smoke", about: "No prelims and no judge panel. Every confirmed dancer goes straight into the line; the team taps the winner of each exchange. Winner stays on the floor and takes a point; first to 7 is King.", steps: ["Entries", "7 to Smoke", "Champion"] },
  prelims_bracket: { name: "Prelims → Bracket", short: "Prelims + Bracket", about: "The category's judge panel scores every dancer in prelim heats (Mind, Body, Soul). The best go into a seeded Top 16/8/4 bracket decided by the panel's votes.", steps: ["Entries", "Prelims", "Bracket", "Champion"] },
  bracket: { name: "Bracket only", short: "Bracket", about: "No prelims. Dancers are drawn at random into a bracket; every battle is decided by the panel's votes.", steps: ["Entries", "Bracket", "Champion"] },
};

export const RULES: Record<Category["rule"], string> = { open: "Open to everyone", bgirl: "Bgirls only", u12: "Kids under 12 (guardian needed)", o35: "35 and over" };

export const PHASES: Record<Phase, string> = { setup: "Registration", prelims: "Prelims", bracket: "Bracket", smoke: "7 to Smoke", finished: "Finished" };
