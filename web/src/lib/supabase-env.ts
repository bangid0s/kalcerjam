// Public Supabase settings. The publishable (anon) key is safe in the browser: every table is
// protected by row-level security (see supabase/migrations).
// Env vars override the defaults (e.g. to point a preview at another project).
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://yzbepoauvurnduocdsyk.supabase.co";
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_Sgi6BsqVDk4yxHEWr_Irpg_KpmY0zvR";
export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

export const CONTENT_TAG = "kj-content";
export const MEDIA_BUCKET = "kj-media";
