// Static previews of the live views. Phase 2 swaps the data for Supabase Realtime (PRD §7).

const SEED_ORDER = [1, 16, 8, 9, 5, 12, 4, 13, 3, 14, 6, 11, 7, 10, 2, 15];
const name = (seed: number) => `Dancer ${String(seed).padStart(2, "0")}`;

type Match = { a?: number; b?: number; w?: number };

/** rounds[0] = Top 16 pairs; later rounds filled from winners. `upsets` = seeds that win round 1 as underdogs. */
function buildBracket(upsets: number[]): Match[][] {
  const r1: Match[] = [];
  for (let i = 0; i < 16; i += 2) {
    const a = SEED_ORDER[i], b = SEED_ORDER[i + 1];
    r1.push({ a, b, w: upsets.includes(b) ? b : a });
  }
  const r2: Match[] = [];
  for (let i = 0; i < 8; i += 2) r2.push({ a: r1[i].w, b: r1[i + 1].w });
  return [r1, r2, [{}, {}], [{}]];
}

export function Bracket({ title, rounds }: { title: string; rounds: string[] }) {
  const data = buildBracket([9, 11]);
  return (
    <div className="rounded-2xl bg-ink-2 p-4 text-paper md:p-6">
      <p className="display mb-5 text-3xl">{title}</p>
      <div className="-mx-4 overflow-x-auto px-4 pb-2">
        <div className="grid min-w-[720px] grid-cols-4 gap-4">
          {data.map((round, ri) => (
            <div key={ri} className="flex flex-col">
              <p className="label mb-2 text-paper/50">{rounds[ri]}</p>
              <div className="flex flex-1 flex-col justify-around gap-2">
                {round.map((m, mi) => (
                  <div key={mi} className={`border-l-2 ${m.w ? "border-kj" : "border-paper/20"} bg-ink`}>
                    {[m.a, m.b].map((s, si) => (
                      <div key={si} className={`flex items-center justify-between gap-2 px-2 py-1.5 text-sm ${si === 0 ? "border-b border-paper/10" : ""} ${m.w && m.w === s ? "bg-kj font-bold text-ink" : m.w ? "text-paper/40 line-through" : "text-paper"}`}>
                        <span className="truncate">{s ? name(s) : "TBA"}</span>
                        {s && <span className="label text-[.6rem] opacity-60">#{s}</span>}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SmokeBoard({ title, points = [5, 3, 2, 2, 1, 1, 0, 0], onFloor = [0, 3] }: { title: string; points?: number[]; onFloor?: number[] }) {
  return (
    <div className="paper p-4 md:p-8">
      <div className="mb-4 flex items-end justify-between gap-3">
        <p className="display text-3xl md:text-4xl">{title}</p>
        <p className="label">Race to 7</p>
      </div>
      <ol className="border-b border-ink/20">
        {points.map((p, i) => (
          <li key={i} className={`grid grid-cols-[1fr_auto] items-center gap-3 border-t border-ink/20 px-2 py-2 ${onFloor.includes(i) ? "bg-ink text-paper" : ""}`}>
            <span className="flex items-center gap-2 truncate font-bold">
              {onFloor.includes(i) && <span className="label bg-kj px-1.5 text-[.65rem] text-ink">On floor</span>}
              {name(i + 1)}
            </span>
            <span className="flex gap-1" aria-label={`${p} of 7 points`}>
              {Array.from({ length: 7 }, (_, b) => (
                <span key={b} className={`h-4 w-4 border sm:h-5 sm:w-5 ${onFloor.includes(i) ? "border-paper" : "border-ink"} ${b < p ? (b === 6 ? "bg-gold" : "bg-kj") : b === 6 ? "bg-gold/25" : ""}`} />
              ))}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
