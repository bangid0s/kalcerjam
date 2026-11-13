"use server";

import { updateTag } from "next/cache";
import { CONTENT_TAG, SUPABASE_KEY, SUPABASE_URL } from "@/lib/supabase-env";

/** Called by /admin after a save: checks the caller is a listed admin, then expires the
 *  cached site content so the public pages show the change on the next request. */
export async function refreshSiteContent(accessToken: string): Promise<{ ok: boolean }> {
  const auth = { apikey: SUPABASE_KEY, Authorization: `Bearer ${accessToken}` };
  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: auth, cache: "no-store" });
  if (!userRes.ok) return { ok: false };
  const { email } = (await userRes.json()) as { email?: string };
  if (!email) return { ok: false };
  // RLS only returns kj_admins rows to admins, so a non-empty result proves admin rights.
  const adminRes = await fetch(`${SUPABASE_URL}/rest/v1/kj_admins?select=email&email=eq.${encodeURIComponent(email.toLowerCase())}`, { headers: auth, cache: "no-store" });
  if (!adminRes.ok || ((await adminRes.json()) as unknown[]).length === 0) return { ok: false };
  updateTag(CONTENT_TAG);
  return { ok: true };
}
