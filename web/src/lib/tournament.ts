// Pure competition logic: prelim pairing and ranking, bracket seeding and advancement,
// judge vote tallies and the 7 to Smoke state machine. No I/O here, so it is easy to test
// (see tournament.test.ts) and the team console just persists what these functions return.

export type Id = number;

// ---------- Prelims ----------

/** Random heats of two. With an odd count the last dancer gets a solo heat (b = null). */
export function prelimPairs(entries: Id[], rand: () => number = Math.random): { a: Id; b: Id | null }[] {
  const pool = [...entries];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const out: { a: Id; b: Id | null }[] = [];
  for (let i = 0; i < pool.length; i += 2) out.push({ a: pool[i], b: pool[i + 1] ?? null });
  return out;
}

export type Score = { entry_id: Id; judge_id: string; mind: number; body: number; soul: number };
export type Ranked = { entry: Id; total: number; mind: number; body: number; soul: number; judges: number; rank: number; tied: boolean };

/** Rank entries by total score across all judges. Ties break on Soul, then Mind, then Body;
 *  anything still level is flagged `tied` so the team can call an extra showcase. */
export function rankPrelims(entries: Id[], scores: Score[]): Ranked[] {
  const rows = entries.map((entry) => {
    const mine = scores.filter((s) => s.entry_id === entry);
    const sum = (k: "mind" | "body" | "soul") => mine.reduce((a, s) => a + s[k], 0);
    const [mind, body, soul] = [sum("mind"), sum("body"), sum("soul")];
    return { entry, mind, body, soul, total: mind + body + soul, judges: mine.length, rank: 0, tied: false };
  });
  const key = (r: (typeof rows)[number]) => [r.total, r.soul, r.mind, r.body];
  rows.sort((x, y) => {
    const a = key(x), b = key(y);
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return b[i] - a[i];
    return x.entry - y.entry;
  });
  rows.forEach((r, i) => {
    const prev = rows[i - 1];
    const same = (o?: typeof r) => !!o && key(o).every((v, k) => v === key(r)[k]);
    r.rank = same(prev) ? prev.rank : i + 1;
    r.tied = same(prev) || same(rows[i + 1]);
  });
  return rows;
}

// ---------- Bracket ----------

/** Standard seeding order for a bracket of `size` (power of two): 16 → 1,16,8,9,5,12,4,13,3,14,6,11,7,10,2,15. */
export function seedOrder(size: number): number[] {
  let order = [1];
  while (order.length < size) {
    const n = order.length * 2;
    order = order.flatMap((s) => [s, n + 1 - s]);
  }
  return order;
}

/** Smallest power of two that fits `count` dancers, capped at `max`. */
export function bracketSizeFor(count: number, max = 16): number {
  let size = 2;
  while (size < Math.min(count, max)) size *= 2;
  return Math.min(size, max);
}

export const roundCount = (size: number) => Math.log2(size);

/** "Top 16", "Top 8", "Semi", "Final" for round `r` (1-based) of a bracket of `size`. */
export function roundLabel(size: number, r: number): string {
  const left = size / 2 ** (r - 1);
  return left === 2 ? "Final" : left === 4 ? "Semi" : `Top ${left}`;
}

export type Pairing = { round: number; slot: number; a: Id | null; b: Id | null; winner: Id | null };

/** First round from entries listed best seed first. Missing seeds are byes: their opponent goes through. */
export function firstRound(seeded: Id[], size: number): Pairing[] {
  const order = seedOrder(size);
  const out: Pairing[] = [];
  for (let i = 0; i < size; i += 2) {
    const a = seeded[order[i] - 1] ?? null;
    const b = seeded[order[i + 1] - 1] ?? null;
    out.push({ round: 1, slot: i / 2, a, b, winner: a && !b ? a : b && !a ? b : null });
  }
  return out;
}

/** Where the winner of (round, slot) goes next, or null after the final. */
export function nextSlot(size: number, round: number, slot: number): { round: number; slot: number; side: "a" | "b" } | null {
  if (round >= roundCount(size)) return null;
  return { round: round + 1, slot: Math.floor(slot / 2), side: slot % 2 === 0 ? "a" : "b" };
}

/** Walk every decided battle forward and return the later-round pairings it implies
 *  (including byes that auto-advance). Existing pairings are updated, new ones created. */
export function propagate(size: number, battles: Pairing[]): Pairing[] {
  const map = new Map(battles.map((b) => [`${b.round}:${b.slot}`, { ...b }]));
  for (let r = 1; r < roundCount(size); r++) {
    for (let s = 0; s < size / 2 ** r; s++) {
      const cur = map.get(`${r}:${s}`);
      if (!cur?.winner) continue;
      const n = nextSlot(size, r, s)!;
      const k = `${n.round}:${n.slot}`;
      const next = map.get(k) ?? { round: n.round, slot: n.slot, a: null, b: null, winner: null };
      if (next[n.side] !== cur.winner) {
        next[n.side] = cur.winner;
        next.winner = null; // an earlier result changed, so this one must be re-decided
      }
      map.set(k, next);
    }
  }
  return [...map.values()].sort((x, y) => x.round - y.round || x.slot - y.slot);
}

// ---------- Judge votes ----------

export type Pick = "a" | "b" | "tie";
export type Tally = { a: number; b: number; tie: number; cast: number; result: "a" | "b" | "split" | "waiting" };

/** Majority of the panel wins. Anything else once everyone has voted is a split (extra round). */
export function tally(picks: Pick[], panel: number): Tally {
  const a = picks.filter((p) => p === "a").length;
  const b = picks.filter((p) => p === "b").length;
  const tie = picks.length - a - b;
  const need = Math.floor(panel / 2) + 1;
  const result = a >= need ? "a" : b >= need ? "b" : picks.length >= panel ? "split" : "waiting";
  return { a, b, tie, cast: picks.length, result };
}

// ---------- 7 to Smoke ----------

export type Smoke = { onFloor: Id | null; queue: Id[]; points: Record<string, number>; champion: Id | null };

/** First dancer in the line holds the floor; the rest queue behind. */
export function smokeStart(order: Id[]): Smoke {
  return { onFloor: order[0] ?? null, queue: order.slice(1), points: Object.fromEntries(order.map((id) => [String(id), 0])), champion: null };
}

/** The exchange that is up now: whoever holds the floor vs the front of the line. */
export const smokeBattle = (s: Smoke): { a: Id; b: Id } | null =>
  s.champion || s.onFloor == null || !s.queue.length ? null : { a: s.onFloor, b: s.queue[0] };

/** Winner takes a point and holds the floor; loser goes to the back of the line. */
export function smokeApply(s: Smoke, winner: Id, target = 7): Smoke {
  const bt = smokeBattle(s);
  if (!bt || (winner !== bt.a && winner !== bt.b)) throw new Error("Winner is not in the current exchange");
  const loser = winner === bt.a ? bt.b : bt.a;
  const points: Record<string, number> = { ...s.points, [winner]: (s.points[String(winner)] ?? 0) + 1 };
  return { onFloor: winner, queue: [...s.queue.slice(1), loser], points, champion: points[String(winner)] >= target ? winner : null };
}

/** Time ran out: most points wins. Returns the leaders when it's level so the team can call a decider. */
export function smokeLeaders(s: Smoke): Id[] {
  const top = Math.max(0, ...Object.values(s.points));
  return Object.entries(s.points).filter(([, p]) => p === top).map(([id]) => Number(id));
}

// ---------- Eligibility (mirrors kj_entries_guard in the database) ----------

export type Rule = "open" | "bgirl" | "u12" | "o35";

export function ageOn(birth: string, on: string): number {
  const [by, bm, bd] = birth.split("-").map(Number);
  const [y, m, d] = on.split("-").map(Number);
  return y - by - (m < bm || (m === bm && d < bd) ? 1 : 0);
}

/** null if eligible, else the reason. */
export function ineligible(rule: Rule, p: { birth_date: string | null; gender: string | null; guardian_name: string }, refDate: string): "profile" | "gender" | "age" | "guardian" | null {
  if (!p.birth_date || !p.gender) return "profile";
  const age = ageOn(p.birth_date, refDate);
  if (rule === "bgirl" && p.gender !== "f") return "gender";
  if (rule === "u12" && age >= 12) return "age";
  if (rule === "u12" && !p.guardian_name) return "guardian";
  if (rule === "o35" && age < 35) return "age";
  return null;
}
