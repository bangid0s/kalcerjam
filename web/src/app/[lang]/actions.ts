"use server";

import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/supabase-env";

export type RsvpState = { status: "idle" | "ok" | "error" };

/** Saves a spectator RSVP to kj_rsvp (insert-only for the public under RLS). */
export async function submitRsvp(_prev: RsvpState, form: FormData): Promise<RsvpState> {
  const str = (k: string) => String(form.get(k) ?? "").trim();
  const row = {
    name: str("name").slice(0, 120),
    email: str("email").slice(0, 254).toLowerCase(),
    city: str("city").slice(0, 120),
    party: Math.min(10, Math.max(1, Number(form.get("party")) || 1)),
    news: form.get("news") === "on",
    lang: str("lang") === "id" ? "id" : "en",
  };
  if (!row.name || !row.city || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(row.email)) return { status: "error" };
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/kj_rsvp`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify(row),
    });
    return { status: res.ok ? "ok" : "error" };
  } catch {
    return { status: "error" };
  }
}
