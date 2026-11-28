"use client";

import { panelIssue } from "@/lib/tournament";
import { formatOf, must, needsPanel, panelOf, sb, FORMATS, PHASES, type Category } from "./data";
import { log, type CompData, type JudgeInfo } from "./Comp";
import { Card, Notice, Pill, useAction } from "./ui";

export const judgeName = (j: JudgeInfo) => j.stage_name || j.name || j.email || "Judge";

const ISSUE = {
  empty: ["No judges yet: this category can't be judged until you add some.", "err"],
  even: ["Even panel: votes can split more often (extra rounds). An odd number is safer.", "warn"],
} as const;

/** Turn judges on and off for one category. The team can change it during registration; admins any time, with a warning. */
export function PanelEditor({ d, cat, isAdmin, reload, compact = false }: { d: CompData; cat: Category; isAdmin: boolean; reload: () => Promise<void>; compact?: boolean }) {
  const { busy, run, note } = useAction();
  const panel = panelOf(d.board, cat.slug);
  const started = cat.phase !== "setup";
  const locked = started && !isAdmin;
  const issue = panelIssue(panel.length);

  if (!needsPanel(cat)) {
    return compact ? <p className="text-sm text-ink/60">No panel: the team taps the winner of every exchange.</p>
      : <Notice kind="info">{FORMATS[formatOf(cat)].name} has no judge panel. The team taps the winner of every exchange.</Notice>;
  }

  const toggle = (j: JudgeInfo) => {
    const on = panel.includes(j.id);
    if (started) {
      const what = on
        ? `Take ${judgeName(j)} off the ${cat.name} panel?\n\n${cat.name} has already started. Their scores and votes stay saved but stop counting, so totals and vote majorities change.`
        : `Add ${judgeName(j)} to the ${cat.name} panel?\n\n${cat.name} has already started. Every dancer will show as missing a score from them until they've scored, and the vote majority goes up.`;
      if (!confirm(what)) return;
    }
    run(async () => {
      if (on) await must(sb().from("kj_category_judges").delete().eq("category", cat.slug).eq("judge_id", j.id));
      else await must(sb().from("kj_category_judges").insert({ category: cat.slug, judge_id: j.id }));
      await log(on ? "panel.remove" : "panel.add", { category: cat.slug, judge: j.id, after_start: started });
      await reload();
    });
  };

  return (
    <div className="space-y-2">
      {d.judges.length === 0 ? (
        <p className="text-sm text-ink/60">No judge accounts yet. Give someone the judge role first (Crew or Accounts).</p>
      ) : (
        <div className="flex flex-wrap gap-1.5" role="group" aria-label={`Judges for ${cat.name}`}>
          {d.judges.map((j) => {
            const on = panel.includes(j.id);
            return (
              <button key={j.id} disabled={busy || locked} onClick={() => toggle(j)} aria-pressed={on}
                className={`rounded-full border-2 px-3 py-1.5 text-sm font-bold disabled:opacity-50 ${on ? "border-ink bg-ink text-paper" : "border-ink/20 bg-white text-ink/70 hover:border-ink"}`}>
                {on ? "✓ " : "+ "}{judgeName(j)}
              </button>
            );
          })}
        </div>
      )}
      {issue && d.judges.length > 0 && <p className={`text-sm font-semibold ${ISSUE[issue][1] === "err" ? "text-stamp" : "text-ink/70"}`}>{ISSUE[issue][0]}</p>}
      {started && <p className="text-xs text-ink/55">{locked ? `Locked: ${cat.name} has started. An admin can still change the panel.` : `${cat.name} has started: changes need a confirmation.`}</p>}
      {note}
    </div>
  );
}

/** Every category's panel at a glance, plus judges who aren't on any panel. */
export function PanelsOverview({ d, isAdmin, reload }: { d: CompData; isAdmin: boolean; reload: () => Promise<void> }) {
  const judged = d.board.cats.filter(needsPanel);
  const seated = new Set(judged.flatMap((c) => panelOf(d.board, c.slug)));
  const idle = d.judges.filter((j) => !seated.has(j.id));
  const empty = judged.filter((c) => panelOf(d.board, c.slug).length === 0 && c.phase !== "finished");
  return (
    <Card title="Judge panels" aside={<span className="text-sm text-ink/60">Who judges what</span>}>
      <p className="mb-3 text-sm text-ink/65">Only judges on a category&apos;s panel can score or vote in it. 7 to Smoke has no panel: the team decides each exchange.</p>
      {empty.length > 0 && <div className="mb-3"><Notice kind="err">No panel yet: {empty.map((c) => c.name).join(", ")}. These can&apos;t be started until you add judges.</Notice></div>}
      <ul className="divide-y divide-ink/10">
        {d.board.cats.map((c) => (
          <li key={c.slug} className="grid gap-2 py-3 sm:grid-cols-[12rem_1fr]">
            <div>
              <p className="font-bold">{c.name}</p>
              <span className="flex flex-wrap gap-1"><Pill>{FORMATS[formatOf(c)].short}</Pill><Pill tone="muted">{PHASES[c.phase]}</Pill>{needsPanel(c) && <Pill tone="ink">{panelOf(d.board, c.slug).length} judge{panelOf(d.board, c.slug).length === 1 ? "" : "s"}</Pill>}</span>
            </div>
            <PanelEditor d={d} cat={c} isAdmin={isAdmin} reload={reload} compact />
          </li>
        ))}
      </ul>
      {idle.length > 0 && <p className="mt-3 text-sm text-ink/60">Not on any panel: {idle.map(judgeName).join(", ")}.</p>}
    </Card>
  );
}

// ---------------- Picking a judge's categories when giving the judge role ----------------

export type JudgeSetup = { cats: Category[]; seats: Map<string, string[]> };

/** Categories a judge can sit on (not 7 to Smoke) and every judge's current seats. */
export async function loadJudgeSetup(): Promise<JudgeSetup> {
  const [cats, seats] = await Promise.all([
    must(sb().from("kj_categories").select("*").order("sort")),
    must(sb().from("kj_category_judges").select("category, judge_id")),
  ]);
  const map = new Map<string, string[]>();
  for (const s of seats as { category: string; judge_id: string }[]) map.set(s.judge_id, [...(map.get(s.judge_id) ?? []), s.category]);
  return { cats: (cats as Category[]).filter(needsPanel), seats: map };
}

/** Give the judge role (admins) and set exactly which panels they sit on, in one step. */
export const setJudge = (id: string, cats: string[]) => must(sb().rpc("kj_set_judge", { judge: id, cats }));

/** Tick the categories this judge will judge. Started categories are locked for non-admins. */
export function JudgeCategoryPicker({ cats, value, onChange, isAdmin, initial = [] }: { cats: Category[]; value: string[]; onChange: (v: string[]) => void; isAdmin: boolean; initial?: string[] }) {
  if (!cats.length) return <p className="text-sm text-ink/60">No categories with judging yet. Add a Prelims → Bracket or Bracket category first.</p>;
  return (
    <div>
      <span className="mb-1 block text-sm font-semibold">Judges these categories <span className="font-normal text-ink/55">(pick at least one)</span></span>
      <div className="grid gap-1.5 sm:grid-cols-2">
        {cats.map((c) => {
          const on = value.includes(c.slug);
          const locked = c.phase !== "setup" && !isAdmin;
          return (
            <label key={c.slug} className={`flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 ${on ? "bg-ink text-paper" : "bg-white"} ${locked ? "opacity-50" : "cursor-pointer"}`}>
              <input type="checkbox" checked={on} disabled={locked} className="h-5 w-5 accent-kj"
                onChange={() => {
                  if (c.phase !== "setup" && initial.includes(c.slug) !== !on && !confirm(`${c.name} has already started. Changing its panel changes totals and vote majorities. Continue?`)) return;
                  onChange(on ? value.filter((s) => s !== c.slug) : [...value, c.slug]);
                }} />
              <span className="min-w-0 flex-1 font-bold">{c.name}</span>
              {c.phase !== "setup" && <span className="text-xs opacity-70">{PHASES[c.phase]}</span>}
            </label>
          );
        })}
      </div>
      <p className="mt-1 text-xs text-ink/55">7 to Smoke isn&apos;t listed: the team decides those exchanges.</p>
    </div>
  );
}
