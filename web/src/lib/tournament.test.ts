// Run: npm test   (node --experimental-strip-types --test)
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ageOn, bracketSizeFor, firstRound, ineligible, prelimPairs, propagate, rankPrelims, roundLabel, seedOrder,
  smokeApply, smokeBattle, smokeLeaders, smokeStart, tally, type Pairing, type Smoke,
} from "./tournament.ts";

test("seed order: 1 vs 16, 8 vs 9 … and top seeds meet as late as possible", () => {
  assert.deepEqual(seedOrder(16), [1, 16, 8, 9, 4, 13, 5, 12, 2, 15, 7, 10, 3, 14, 6, 11]);
  assert.deepEqual(seedOrder(8), [1, 8, 4, 5, 2, 7, 3, 6]); // semis: 1 v 4, 2 v 3
  assert.deepEqual(seedOrder(4), [1, 4, 2, 3]);
});

test("bracket size and round labels", () => {
  assert.equal(bracketSizeFor(31), 16);
  assert.equal(bracketSizeFor(11), 16);
  assert.equal(bracketSizeFor(5), 8);
  assert.equal(bracketSizeFor(2), 2);
  assert.deepEqual([1, 2, 3, 4].map((r) => roundLabel(16, r)), ["Top 16", "Top 8", "Semi", "Final"]);
});

test("prelim pairs cover everyone once, odd count gets a solo heat", () => {
  const ids = [1, 2, 3, 4, 5, 6, 7];
  const pairs = prelimPairs(ids, () => 0.42);
  assert.equal(pairs.length, 4);
  assert.deepEqual(pairs.flatMap((p) => [p.a, p.b]).filter((x) => x !== null).sort(), ids);
  assert.equal(pairs.filter((p) => p.b === null).length, 1);
});

test("prelim ranking: totals, tie-break on soul, flags real ties", () => {
  const s = (entry_id: number, judge_id: string, mind: number, body: number, soul: number) => ({ entry_id, judge_id, mind, body, soul });
  const ranked = rankPrelims([1, 2, 3, 4], [
    s(1, "j1", 8, 8, 8), s(1, "j2", 8, 8, 8),   // 48, soul 16
    s(2, "j1", 9, 9, 6), s(2, "j2", 9, 9, 6),   // 48, soul 12
    s(3, "j1", 5, 5, 5), s(3, "j2", 5, 5, 5),   // 30
    s(4, "j1", 5, 5, 5), s(4, "j2", 5, 5, 5),   // 30 (true tie with 3)
  ]);
  assert.deepEqual(ranked.map((r) => r.entry), [1, 2, 3, 4]);
  assert.deepEqual(ranked.map((r) => r.rank), [1, 2, 3, 3]);
  assert.deepEqual(ranked.map((r) => r.tied), [false, false, true, true]);
  assert.equal(ranked[0].judges, 2);
});

test("first round with byes: top seeds walk through", () => {
  const r1 = firstRound([10, 20, 30, 40, 50, 60], 8); // 6 dancers in an 8 bracket
  assert.deepEqual(r1[0], { round: 1, slot: 0, a: 10, b: null, winner: 10 }); // 1 vs (8) bye
  assert.deepEqual(r1[2], { round: 1, slot: 2, a: 20, b: null, winner: 20 }); // 2 vs (7) bye
  assert.deepEqual(r1[1], { round: 1, slot: 1, a: 40, b: 50, winner: null }); // 4 vs 5
  assert.deepEqual(r1[3], { round: 1, slot: 3, a: 30, b: 60, winner: null }); // 3 vs 6
});

test("propagate fills later rounds and resets a result when an earlier one changes", () => {
  let b: Pairing[] = firstRound([1, 2, 3, 4], 4);
  b[0].winner = 1;
  b = propagate(4, b);
  assert.deepEqual(b.find((x) => x.round === 2), { round: 2, slot: 0, a: 1, b: null, winner: null });
  b[1].winner = 3;
  b = propagate(4, b);
  const final = b.find((x) => x.round === 2)!;
  assert.deepEqual([final.a, final.b], [1, 3]);
  final.winner = 3;
  b[0].winner = 4; // correction in the semi
  b = propagate(4, b);
  assert.deepEqual(b.find((x) => x.round === 2), { round: 2, slot: 0, a: 4, b: 3, winner: null });
});

test("full 16 bracket plays down to one champion", () => {
  let b = firstRound(Array.from({ length: 16 }, (_, i) => i + 1), 16);
  for (let r = 1; r <= 4; r++) {
    b = b.map((x) => (x.round === r ? { ...x, winner: Math.min(x.a!, x.b!) } : x));
    b = propagate(16, b);
  }
  assert.equal(b.length, 15);
  assert.equal(b.find((x) => x.round === 4)!.winner, 1);
});

test("vote tally: majority wins, split asks for extra round", () => {
  assert.equal(tally(["a", "a"], 3).result, "a");
  assert.equal(tally(["a"], 3).result, "waiting");
  assert.equal(tally(["a", "b", "tie"], 3).result, "split");
  assert.equal(tally(["a", "b"], 2).result, "split");
  assert.equal(tally(["b", "b", "a", "a"], 4).result, "split");
  assert.equal(tally(["b", "b", "b", "a"], 4).result, "b");
});

test("7 to Smoke: winner stays, loser to the back, first to target wins", () => {
  let s: Smoke = smokeStart([1, 2, 3, 4]);
  assert.deepEqual(smokeBattle(s), { a: 1, b: 2 });
  s = smokeApply(s, 2, 3);
  assert.deepEqual([s.onFloor, s.queue], [2, [3, 4, 1]]);
  assert.equal(s.points["2"], 1);
  s = smokeApply(s, 2, 3);
  s = smokeApply(s, 2, 3);
  assert.equal(s.champion, 2);
  assert.equal(smokeBattle(s), null);
  assert.throws(() => smokeApply(smokeStart([1, 2, 3]), 3));
});

test("7 to Smoke: time-out leaders", () => {
  let s = smokeStart([1, 2, 3]);
  s = smokeApply(s, 1);
  s = smokeApply(s, 3);
  assert.deepEqual(smokeLeaders(s).sort(), [1, 3]);
  s = smokeApply(s, 3);
  assert.deepEqual(smokeLeaders(s), [3]);
});

test("eligibility mirrors the database rules", () => {
  const ref = "2027-07-26";
  assert.equal(ageOn("2015-07-27", ref), 11);
  assert.equal(ageOn("2015-07-26", ref), 12);
  assert.equal(ineligible("u12", { birth_date: "2016-01-01", gender: "m", guardian_name: "" }, ref), "guardian");
  assert.equal(ineligible("u12", { birth_date: "2016-01-01", gender: "m", guardian_name: "Ibu" }, ref), null);
  assert.equal(ineligible("o35", { birth_date: "1992-07-27", gender: "m", guardian_name: "" }, ref), "age");
  assert.equal(ineligible("o35", { birth_date: "1992-07-26", gender: "m", guardian_name: "" }, ref), null);
  assert.equal(ineligible("bgirl", { birth_date: "2000-01-01", gender: "m", guardian_name: "" }, ref), "gender");
  assert.equal(ineligible("open", { birth_date: null, gender: null, guardian_name: "" }, ref), "profile");
});
