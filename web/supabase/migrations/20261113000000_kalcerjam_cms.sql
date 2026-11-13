-- Kalcer Jam CMS: editable site content, spectator RSVPs, admin allowlist and media bucket.

-- Admins: only emails listed here can edit content (add yours after creating the auth user).
create table public.kj_admins (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);
alter table public.kj_admins enable row level security;

create or replace function public.is_kj_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.kj_admins a
    where a.email = lower(coalesce((select auth.jwt() ->> 'email'), ''))
  );
$$;
revoke all on function public.is_kj_admin() from public;
grant execute on function public.is_kj_admin() to anon, authenticated;

create policy "admins read admin list" on public.kj_admins
  for select to authenticated using ((select public.is_kj_admin()));

-- Content: one row per section key (settings, home, rules, ...). value is merged over the
-- defaults in web/src/lib/content.ts, so rows only need to exist for edited sections.
create table public.kj_content (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by text
);
alter table public.kj_content enable row level security;

create policy "content is public" on public.kj_content
  for select to anon, authenticated using (true);
create policy "admins insert content" on public.kj_content
  for insert to authenticated with check ((select public.is_kj_admin()));
create policy "admins update content" on public.kj_content
  for update to authenticated using ((select public.is_kj_admin())) with check ((select public.is_kj_admin()));
create policy "admins delete content" on public.kj_content
  for delete to authenticated using ((select public.is_kj_admin()));

create or replace function public.kj_touch_content()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.updated_by := (select auth.jwt() ->> 'email');
  return new;
end;
$$;
create trigger kj_content_touch before insert or update on public.kj_content
  for each row execute function public.kj_touch_content();

-- Spectator RSVPs: anyone can submit, only admins can read or delete.
create table public.kj_rsvp (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (char_length(email) between 3 and 254 and email like '%@%'),
  city text not null check (char_length(city) between 1 and 120),
  party int not null default 1 check (party between 1 and 10),
  news boolean not null default false,
  lang text not null default 'en' check (lang in ('en', 'id')),
  created_at timestamptz not null default now()
);
alter table public.kj_rsvp enable row level security;

create policy "anyone can rsvp" on public.kj_rsvp
  for insert to anon, authenticated with check (true);
create policy "admins read rsvps" on public.kj_rsvp
  for select to authenticated using ((select public.is_kj_admin()));
create policy "admins delete rsvps" on public.kj_rsvp
  for delete to authenticated using ((select public.is_kj_admin()));

-- Media: public images (photos, logos, merch) uploaded from /admin.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('kj-media', 'kj-media', true, 10485760, array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml', 'image/avif'])
on conflict (id) do nothing;

create policy "admins upload media" on storage.objects
  for insert to authenticated with check (bucket_id = 'kj-media' and (select public.is_kj_admin()));
create policy "admins update media" on storage.objects
  for update to authenticated using (bucket_id = 'kj-media' and (select public.is_kj_admin()));
create policy "admins delete media" on storage.objects
  for delete to authenticated using (bucket_id = 'kj-media' and (select public.is_kj_admin()));
create policy "admins list media" on storage.objects
  for select to authenticated using (bucket_id = 'kj-media' and (select public.is_kj_admin()));
