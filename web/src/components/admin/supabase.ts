"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/supabase-env";

let client: SupabaseClient | null = null;

/** Browser client for /admin. Writes are allowed only for emails in kj_admins (RLS). */
export function sb() {
  client ??= createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true } });
  return client;
}
