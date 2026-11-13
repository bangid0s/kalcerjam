import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { defaults, type Content } from "./content";
import { mergeDeep } from "./merge";
import { CONTENT_TAG, SUPABASE_KEY, SUPABASE_URL, supabaseConfigured } from "./supabase-env";

/** All site copy: defaults with the admin's saved rows (kj_content) merged on top.
 *  Cached and tagged; saving in /admin expires the tag so pages pick up changes at once. */
export async function getContent(): Promise<Content> {
  "use cache";
  cacheTag(CONTENT_TAG);

  if (!supabaseConfigured) {
    cacheLife("max");
    return defaults;
  }
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/kj_content?select=key,value`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    if (!res.ok) throw new Error(`kj_content ${res.status}`);
    const rows = (await res.json()) as { key: string; value: unknown }[];
    const saved = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    cacheLife("hours");
    return mergeDeep(defaults, saved);
  } catch (err) {
    console.error("[cms] falling back to defaults:", err);
    cacheLife("minutes"); // retry soon rather than pinning the fallback
    return defaults;
  }
}
