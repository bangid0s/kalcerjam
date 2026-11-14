// kj-admin-users: account management for super admins (kj_admins.super = true).
// Runs on Supabase with the service-role key, which never reaches the browser.
// Every request must carry the caller's own session token; the caller must be a super admin.
//
// POST { action: "list" }
// POST { action: "create", email, password, name?, role?, admin? }
// POST { action: "update", id, email?, password?, name?, role?, admin?, super?, banned? }
// POST { action: "delete", id }
import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const ROLES = ["spectator", "participant", "judge", "mc", "team"];
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const fail = (message: string, status = 400) => reply({ error: message }, status);

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const cleanEmail = (v: unknown) => String(v ?? "").trim().toLowerCase();
const validEmail = (e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e) && e.length <= 254;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return fail("POST only", 405);

  // Who is calling?
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return fail("Sign in first", 401);
  const { data: who, error: whoErr } = await db.auth.getUser(token);
  if (whoErr || !who.user?.email) return fail("Session expired, sign in again", 401);
  const me = who.user;
  const { data: adm } = await db.from("kj_admins").select("super").eq("email", me.email!.toLowerCase()).maybeSingle();
  if (!adm?.super) return fail("Super admins only", 403);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return fail("Bad JSON"); }

  try {
    switch (body.action) {
      case "list": {
        const users: { id: string; email?: string; created_at: string; last_sign_in_at?: string; banned_until?: string }[] = [];
        for (let page = 1; page < 50; page++) {
          const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
          if (error) throw error;
          users.push(...data.users);
          if (data.users.length < 1000) break;
        }
        const [{ data: profiles }, { data: admins }] = await Promise.all([
          db.from("kj_profiles").select("id,code,role,name,stage_name"),
          db.from("kj_admins").select("email,super"),
        ]);
        const prof = new Map((profiles ?? []).map((p) => [p.id, p]));
        const adm = new Map((admins ?? []).map((a) => [a.email, a.super]));
        return reply({
          me: me.id,
          users: users.map((u) => {
            const p = prof.get(u.id);
            const email = (u.email ?? "").toLowerCase();
            return {
              id: u.id, email, created_at: u.created_at, last_sign_in_at: u.last_sign_in_at ?? null,
              banned: !!u.banned_until && new Date(u.banned_until) > new Date(),
              code: p?.code ?? null, role: p?.role ?? "spectator", name: p?.name ?? "", stage_name: p?.stage_name ?? "",
              admin: adm.has(email), super: adm.get(email) === true,
            };
          }).sort((a, b) => a.email.localeCompare(b.email)),
        });
      }

      case "create": {
        const email = cleanEmail(body.email);
        const password = String(body.password ?? "");
        if (!validEmail(email)) return fail("Enter a valid email");
        if (password.length < 8) return fail("Password needs at least 8 characters");
        const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
        if (error) throw error;
        const id = data.user.id;
        const role = ROLES.includes(String(body.role)) ? String(body.role) : "spectator";
        await db.from("kj_profiles").upsert({ id, email, role, name: String(body.name ?? "").slice(0, 120) });
        if (body.admin) await db.from("kj_admins").upsert({ email, super: false });
        await db.from("kj_log").insert({ actor: me.email, action: "account.create", detail: { email, role, admin: !!body.admin } });
        return reply({ ok: true, id });
      }

      case "update": {
        const id = String(body.id ?? "");
        const { data: cur, error: curErr } = await db.auth.admin.getUserById(id);
        if (curErr || !cur.user) return fail("Account not found", 404);
        const oldEmail = (cur.user.email ?? "").toLowerCase();
        const patch: Record<string, unknown> = {};
        const email = body.email !== undefined ? cleanEmail(body.email) : oldEmail;
        if (email !== oldEmail) {
          if (!validEmail(email)) return fail("Enter a valid email");
          patch.email = email;
          patch.email_confirm = true;
        }
        if (body.password) {
          if (String(body.password).length < 8) return fail("Password needs at least 8 characters");
          patch.password = String(body.password);
        }
        if (body.banned !== undefined) {
          if (id === me.id && body.banned) return fail("You can't block your own account");
          patch.ban_duration = body.banned ? "876000h" : "none";
        }
        if (Object.keys(patch).length) {
          const { error } = await db.auth.admin.updateUserById(id, patch);
          if (error) throw error;
        }

        const prof: Record<string, unknown> = {};
        if (email !== oldEmail) prof.email = email;
        if (body.role !== undefined) {
          if (!ROLES.includes(String(body.role))) return fail("Unknown role");
          prof.role = body.role;
        }
        if (body.name !== undefined) prof.name = String(body.name).slice(0, 120);
        if (Object.keys(prof).length) {
          const { error } = await db.from("kj_profiles").update(prof).eq("id", id);
          if (error) throw error;
        }

        // Admin list follows the email; super can only be dropped while another super remains.
        const { data: row } = await db.from("kj_admins").select("email,super").eq("email", oldEmail).maybeSingle();
        const wantAdmin = body.admin !== undefined ? !!body.admin : !!row;
        const wantSuper = wantAdmin && (body.super !== undefined ? !!body.super : !!row?.super);
        if (row?.super && !wantSuper) {
          if (id === me.id) return fail("You can't remove your own super admin rights");
          const { count } = await db.from("kj_admins").select("email", { count: "exact", head: true }).eq("super", true);
          if ((count ?? 0) <= 1) return fail("Keep at least one super admin");
        }
        if (row) await db.from("kj_admins").delete().eq("email", oldEmail);
        if (wantAdmin) await db.from("kj_admins").upsert({ email, super: wantSuper });

        await db.from("kj_log").insert({ actor: me.email, action: "account.update", detail: { email, role: body.role, admin: wantAdmin, super: wantSuper, password: !!body.password, banned: body.banned } });
        return reply({ ok: true });
      }

      case "delete": {
        const id = String(body.id ?? "");
        if (id === me.id) return fail("You can't delete your own account");
        const { data: cur } = await db.auth.admin.getUserById(id);
        const email = (cur?.user?.email ?? "").toLowerCase();
        if (email) {
          const { data: row } = await db.from("kj_admins").select("super").eq("email", email).maybeSingle();
          if (row?.super) {
            const { count } = await db.from("kj_admins").select("email", { count: "exact", head: true }).eq("super", true);
            if ((count ?? 0) <= 1) return fail("Keep at least one super admin");
          }
          await db.from("kj_admins").delete().eq("email", email);
        }
        const { error } = await db.auth.admin.deleteUser(id);
        if (error) throw error;
        await db.from("kj_log").insert({ actor: me.email, action: "account.delete", detail: { email } });
        return reply({ ok: true });
      }

      default:
        return fail("Unknown action");
    }
  } catch (e) {
    return fail(e instanceof Error ? e.message : String(e), 500);
  }
});
