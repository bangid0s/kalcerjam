/** Deep-merge a saved value over its default. Objects merge key by key; arrays and scalars from
 *  `saved` replace the default outright. A type mismatch keeps the default, so a malformed row
 *  can't break a page. */
export function mergeDeep<D>(def: D, saved: unknown): D {
  if (saved === undefined || saved === null) return def;
  if (Array.isArray(def)) return (Array.isArray(saved) ? saved : def) as D;
  if (def && typeof def === "object") {
    if (typeof saved !== "object" || Array.isArray(saved)) return def;
    const out: Record<string, unknown> = { ...(def as Record<string, unknown>) };
    for (const [k, v] of Object.entries(saved as Record<string, unknown>)) {
      out[k] = k in out ? mergeDeep(out[k], v) : v;
    }
    return out as D;
  }
  return (typeof saved === typeof def ? saved : def) as D;
}
