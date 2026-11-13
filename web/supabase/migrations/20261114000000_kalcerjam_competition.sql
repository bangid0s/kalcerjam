-- Kalcer Jam competition: accounts with roles, dancer registration, payments, judging,
-- brackets, 7 to Smoke and check-in.
--
-- Roles (kj_profiles.role):
--   spectator   default for every new account; free RSVP pass
--   participant a dancer; can enter categories and pay the fee
--   judge       scores prelims and votes on battles
--   mc          read-only run sheet (now on stage, up next, results)
--   team        event crew: check-in, payments, running the competition
-- Admins (kj_admins, from the CMS migration) can do everything the team can, and are the only
-- ones who can hand out the judge / mc / team roles.
--
-- Privacy rule from the PRD: the public sees pairings and winners only. Scores and votes are
-- visible to the crew, and each dancer sees their own scores once a category is published.

-- ---------------------------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------------------------
create table public.kj_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  role text not null default 'spectator' check (role in ('spectator', 'participant', 'judge', 'mc', 'team')),
  dancer_no integer generated always as identity unique,
  code text generated always as ('KJ-' || lpad(dancer_no::text, 4, '0')) stored,
  name text not null default '' check (char_length(name) <= 120),
  stage_name text not null default '' check (char_length(stage_name) <= 60),
  crew text not null default '' check (char_length(crew) <= 80),
  city text not null default '' check (char_length(city) <= 80),
  country text not null default 'ID' check (char_length(country) <= 2),
  birth_date date,
  gender text check (gender in ('f', 'm', 'x')),
  phone text not null default '' check (char_length(phone) <= 30),
  instagram text not null default '' check (char_length(instagram) <= 60),
  guardian_name text not null default '' check (char_length(guardian_name) <= 120),
  lang text not null default 'id' check (lang in ('en', 'id')),
  pass_token uuid not null default gen_random_uuid() unique,
  checked_in_at timestamptz,
  checked_in_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.kj_profiles enable row level security;

-- Role helpers. security definer so policies on kj_profiles can call them without recursion.
create or replace function public.kj_role()
returns text language sql stable security definer set search_path = '' as $$
  select coalesce((select p.role from public.kj_profiles p where p.id = (select auth.uid())), '');
$$;

create or replace function public.kj_is_staff()
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_kj_admin() or public.kj_role() = 'team';
$$;

create or replace function public.kj_is_judge()
returns boolean language sql stable security definer set search_path = '' as $$
  select public.kj_role() = 'judge';
$$;

create or replace function public.kj_is_crew()
returns boolean language sql stable security definer set search_path = '' as $$
  select public.kj_is_staff() or public.kj_role() in ('judge', 'mc');
$$;

revoke all on function public.kj_role(), public.kj_is_staff(), public.kj_is_judge(), public.kj_is_crew() from public;
grant execute on function public.kj_role(), public.kj_is_staff(), public.kj_is_judge(), public.kj_is_crew() to anon, authenticated;

create policy "read own profile, staff read all" on public.kj_profiles
  for select to authenticated using (id = (select auth.uid()) or (select public.kj_is_staff()));
create policy "create own profile" on public.kj_profiles
  for insert to authenticated with check (id = (select auth.uid()) and role in ('spectator', 'participant'));
create policy "edit own profile, staff edit all" on public.kj_profiles
  for update to authenticated
  using (id = (select auth.uid()) or (select public.kj_is_staff()))
  with check (id = (select auth.uid()) or (select public.kj_is_staff()));

-- Dancers may switch themselves between spectator and participant. Crew roles are admin-only,
-- and nobody but staff can touch the pass token or check-in fields.
create or replace function public.kj_profiles_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.updated_at := now();
  new.email := old.email;
  if new.role is distinct from old.role then
    if not (public.is_kj_admin()
            or (new.role in ('spectator', 'participant') and old.role in ('spectator', 'participant')
                and (old.id = (select auth.uid()) or public.kj_is_staff()))) then
      raise exception 'Only an admin can give or remove the judge, mc and team roles';
    end if;
  end if;
  if not public.kj_is_staff() then
    new.pass_token := old.pass_token;
    new.checked_in_at := old.checked_in_at;
    new.checked_in_by := old.checked_in_by;
  end if;
  return new;
end;
$$;
create trigger kj_profiles_guard before update on public.kj_profiles
  for each row execute function public.kj_profiles_guard();

-- Every new auth user gets a profile.
create or replace function public.kj_handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.kj_profiles (id, email) values (new.id, lower(new.email)) on conflict (id) do nothing;
  return new;
end;
$$;
create trigger kj_on_auth_user_created after insert on auth.users
  for each row execute function public.kj_handle_new_user();

insert into public.kj_profiles (id, email)
select u.id, lower(u.email) from auth.users u
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------------------------
-- Categories (competition settings; display copy stays in the CMS under the same slug)
-- ---------------------------------------------------------------------------------------------
create table public.kj_categories (
  slug text primary key,
  name text not null,
  sort integer not null default 0,
  rule text not null default 'open' check (rule in ('open', 'bgirl', 'u12', 'o35')),
  team boolean not null default false,          -- 2vs2
  smoke boolean not null default false,         -- 7 to Smoke final instead of a bracket
  registration_open boolean not null default false,
  phase text not null default 'setup' check (phase in ('setup', 'prelims', 'bracket', 'smoke', 'finished')),
  bracket_size integer not null default 16 check (bracket_size in (2, 4, 8, 16, 32)),
  smoke_qualifiers integer not null default 4 check (smoke_qualifiers between 0 and 16),
  smoke_target integer not null default 7 check (smoke_target between 1 and 20),
  age_ref_date date not null default '2027-07-26',
  results_published boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.kj_categories enable row level security;

create policy "categories are public" on public.kj_categories for select to anon, authenticated using (true);
create policy "staff edit categories" on public.kj_categories for update to authenticated
  using ((select public.kj_is_staff())) with check ((select public.kj_is_staff()));
create policy "admins add categories" on public.kj_categories for insert to authenticated
  with check ((select public.is_kj_admin()));
create policy "admins remove categories" on public.kj_categories for delete to authenticated
  using ((select public.is_kj_admin()));

insert into public.kj_categories (slug, name, sort, rule, team, smoke) values
  ('7-to-smoke-breaking', '7 to Smoke — Breaking', 1, 'open', false, true),
  ('7-to-smoke-openstyle', '7 to Smoke — Openstyle', 2, 'open', false, true),
  ('bgirl', 'Bgirl', 3, 'bgirl', false, false),
  ('kids-u12', 'Kids U-12', 4, 'u12', false, false),
  ('over-35', 'Over 35', 5, 'o35', false, false),
  ('2vs2-breaking', '2vs2 Breaking', 6, 'open', true, false),
  ('toprock', 'Toprock', 7, 'open', false, false),
  ('footwork', 'Footwork', 8, 'open', false, false)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------------------------
-- Entries: one row per dancer (or 2vs2 team) per category
-- ---------------------------------------------------------------------------------------------
create table public.kj_entries (
  id bigint generated always as identity primary key,
  category text not null references public.kj_categories (slug) on update cascade on delete cascade,
  dancer_id uuid references public.kj_profiles (id) on delete cascade,
  partner_id uuid references public.kj_profiles (id) on delete set null,
  partner_status text check (partner_status in ('pending', 'accepted', 'declined')),
  guest_name text check (char_length(guest_name) <= 120),   -- invited dancers without an account
  invited boolean not null default false,
  team_name text not null default '' check (char_length(team_name) <= 60),
  seed integer,
  status text not null default 'active' check (status in ('active', 'withdrawn', 'disqualified')),
  created_at timestamptz not null default now(),
  unique (category, dancer_id),
  check (dancer_id is not null or guest_name is not null),
  check (partner_id is null or partner_id <> dancer_id)
);
alter table public.kj_entries enable row level security;
create index kj_entries_dancer on public.kj_entries (dancer_id);
create index kj_entries_partner on public.kj_entries (partner_id);

create policy "read own entries, staff read all" on public.kj_entries for select to authenticated
  using (dancer_id = (select auth.uid()) or partner_id = (select auth.uid()) or (select public.kj_is_staff()));
create policy "enter yourself, staff enter anyone" on public.kj_entries for insert to authenticated
  with check (dancer_id = (select auth.uid()) or (select public.kj_is_staff()));
create policy "edit own entries, staff edit all" on public.kj_entries for update to authenticated
  using (dancer_id = (select auth.uid()) or partner_id = (select auth.uid()) or (select public.kj_is_staff()))
  with check (dancer_id = (select auth.uid()) or partner_id = (select auth.uid()) or (select public.kj_is_staff()));
create policy "leave while registration is open, staff remove any" on public.kj_entries for delete to authenticated
  using ((select public.kj_is_staff())
         or (dancer_id = (select auth.uid())
             and exists (select 1 from public.kj_categories c where c.slug = category and c.registration_open and c.phase = 'setup')));

-- Eligibility and edit rules for dancers (staff bypass them).
create or replace function public.kj_entries_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  cat public.kj_categories;
  me public.kj_profiles;
  mate public.kj_profiles;
  age integer;
  uid uuid := (select auth.uid());
begin
  if public.kj_is_staff() then
    if new.partner_id is not null and new.partner_status is null then new.partner_status := 'accepted'; end if;
    return new;
  end if;

  select * into cat from public.kj_categories where slug = new.category;

  if tg_op = 'UPDATE' then
    -- The invited partner may only answer the invite.
    if uid = old.partner_id and uid is distinct from old.dancer_id then
      if new.partner_status not in ('accepted', 'declined')
         or (to_jsonb(new) - 'partner_status') <> (to_jsonb(old) - 'partner_status') then
        raise exception 'You can only accept or decline this invite';
      end if;
      if new.partner_status = 'declined' then new.partner_id := null; end if;
      return new;
    end if;
    -- The dancer may rename the team or change a partner who hasn't accepted yet.
    if new.category <> old.category or new.dancer_id is distinct from old.dancer_id or new.seed is distinct from old.seed
       or new.status <> old.status or new.invited <> old.invited or new.guest_name is distinct from old.guest_name then
      raise exception 'Ask the registration team to change this entry';
    end if;
    if new.partner_id is distinct from old.partner_id then
      if old.partner_status = 'accepted' then raise exception 'Your partner already accepted. Ask the registration team to change teams'; end if;
      new.partner_status := case when new.partner_id is null then null else 'pending' end;
    elsif new.partner_status is distinct from old.partner_status then
      raise exception 'Only your partner can answer the invite';
    end if;
  else
    if new.dancer_id is distinct from uid or new.invited or new.seed is not null or new.status <> 'active' or new.guest_name is not null then
      raise exception 'Not allowed';
    end if;
    if cat.slug is null or not cat.registration_open or cat.phase <> 'setup' then
      raise exception 'Registration for this category is closed';
    end if;
    new.partner_status := case when new.partner_id is null then null else 'pending' end;
  end if;

  select * into me from public.kj_profiles where id = new.dancer_id;
  if me.role <> 'participant' then raise exception 'Switch your account to dancer first'; end if;
  if me.stage_name = '' or me.birth_date is null or me.gender is null then
    raise exception 'Finish your profile (dancer name, birth date, gender) first';
  end if;
  age := extract(year from age(cat.age_ref_date, me.birth_date));
  if cat.rule = 'bgirl' and me.gender <> 'f' then raise exception 'Bgirl is for bgirls only'; end if;
  if cat.rule = 'u12' and age >= 12 then raise exception 'Kids U-12 is for dancers under 12 on %', cat.age_ref_date; end if;
  if cat.rule = 'u12' and me.guardian_name = '' then raise exception 'Kids need a guardian name on their profile'; end if;
  if cat.rule = 'o35' and age < 35 then raise exception 'Over 35 is for dancers aged 35 or older on %', cat.age_ref_date; end if;

  if new.partner_id is not null then
    if not cat.team then raise exception 'This category is solo'; end if;
    select * into mate from public.kj_profiles where id = new.partner_id;
    if mate.id is null or mate.role <> 'participant' then raise exception 'Partner must have a dancer account'; end if;
    if exists (select 1 from public.kj_entries e
               where e.category = new.category and e.id is distinct from new.id and e.status = 'active'
                 and (e.dancer_id in (new.dancer_id, new.partner_id) or (e.partner_id in (new.dancer_id, new.partner_id) and e.partner_status = 'accepted'))) then
      raise exception 'One of you is already on a team in this category';
    end if;
  elsif exists (select 1 from public.kj_entries e
                where e.category = new.category and e.id is distinct from new.id and e.status = 'active'
                  and e.partner_id = new.dancer_id and e.partner_status = 'accepted') then
    raise exception 'You are already on a team in this category';
  end if;
  return new;
end;
$$;
create trigger kj_entries_guard before insert or update on public.kj_entries
  for each row execute function public.kj_entries_guard();

-- ---------------------------------------------------------------------------------------------
-- Payments: one flat fee per dancer covers every category
-- ---------------------------------------------------------------------------------------------
create table public.kj_payments (
  dancer_id uuid primary key references public.kj_profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'paid', 'rejected')),
  method text not null default '' check (char_length(method) <= 30),
  amount text not null default '' check (char_length(amount) <= 30),
  reference text not null default '' check (char_length(reference) <= 120),
  proof_path text,
  note text not null default '' check (char_length(note) <= 300),
  submitted_at timestamptz not null default now(),
  verified_at timestamptz,
  verified_by text
);
alter table public.kj_payments enable row level security;

create policy "read own payment, staff read all" on public.kj_payments for select to authenticated
  using (dancer_id = (select auth.uid()) or (select public.kj_is_staff()));
create policy "submit own payment" on public.kj_payments for insert to authenticated
  with check (dancer_id = (select auth.uid()) or (select public.kj_is_staff()));
create policy "update own payment, staff verify" on public.kj_payments for update to authenticated
  using (dancer_id = (select auth.uid()) or (select public.kj_is_staff()))
  with check (dancer_id = (select auth.uid()) or (select public.kj_is_staff()));

create or replace function public.kj_payments_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if public.kj_is_staff() then
    if new.status is distinct from (case when tg_op = 'UPDATE' then old.status end) and new.status in ('paid', 'rejected') then
      new.verified_at := now();
      new.verified_by := (select auth.jwt() ->> 'email');
    end if;
    return new;
  end if;
  if tg_op = 'UPDATE' and old.status = 'paid' then raise exception 'This payment is already confirmed'; end if;
  new.status := 'pending';
  new.verified_at := null;
  new.verified_by := null;
  new.submitted_at := now();
  return new;
end;
$$;
create trigger kj_payments_guard before insert or update on public.kj_payments
  for each row execute function public.kj_payments_guard();

-- Payment proofs: private bucket, one folder per user.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('kj-proofs', 'kj-proofs', false, 5242880, array['image/png', 'image/jpeg', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;

create policy "dancers upload own proof" on storage.objects for insert to authenticated
  with check (bucket_id = 'kj-proofs' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "dancers replace own proof" on storage.objects for update to authenticated
  using (bucket_id = 'kj-proofs' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "read own proof, staff read all" on storage.objects for select to authenticated
  using (bucket_id = 'kj-proofs' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.kj_is_staff())));

-- ---------------------------------------------------------------------------------------------
-- Battles: prelim heats, bracket battles and 7 to Smoke exchanges
-- ---------------------------------------------------------------------------------------------
create table public.kj_battles (
  id bigint generated always as identity primary key,
  category text not null references public.kj_categories (slug) on update cascade on delete cascade,
  kind text not null check (kind in ('prelim', 'bracket', 'smoke')),
  round integer not null default 1,     -- bracket: 1 = first round; prelim/smoke: 1
  slot integer not null default 0,      -- position in the round (prelim heat no., smoke exchange no.)
  a_entry bigint references public.kj_entries (id) on delete set null,
  b_entry bigint references public.kj_entries (id) on delete set null,
  winner_entry bigint references public.kj_entries (id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'live', 'done')),
  walkover boolean not null default false,
  vote_round integer not null default 1,  -- goes up with every extra round
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  unique (category, kind, round, slot)
);
alter table public.kj_battles enable row level security;
create unique index kj_battles_one_live on public.kj_battles ((true)) where status = 'live';

create policy "battles are public" on public.kj_battles for select to anon, authenticated using (true);
create policy "staff run battles" on public.kj_battles for all to authenticated
  using ((select public.kj_is_staff())) with check ((select public.kj_is_staff()));

-- ---------------------------------------------------------------------------------------------
-- Prelim scores: every judge scores Mind, Body and Soul from 1 to 10 for every dancer
-- ---------------------------------------------------------------------------------------------
create table public.kj_scores (
  entry_id bigint not null references public.kj_entries (id) on delete cascade,
  judge_id uuid not null references public.kj_profiles (id) on delete cascade,
  battle_id bigint references public.kj_battles (id) on delete set null,
  mind smallint not null check (mind between 1 and 10),
  body smallint not null check (body between 1 and 10),
  soul smallint not null check (soul between 1 and 10),
  updated_at timestamptz not null default now(),
  primary key (entry_id, judge_id)
);
alter table public.kj_scores enable row level security;

create or replace function public.kj_entry_in_prelims(e bigint)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.kj_entries x join public.kj_categories c on c.slug = x.category
                 where x.id = e and c.phase = 'prelims');
$$;
revoke all on function public.kj_entry_in_prelims(bigint) from public;
grant execute on function public.kj_entry_in_prelims(bigint) to authenticated;

create policy "judges read own scores, staff read all, dancers read published" on public.kj_scores for select to authenticated
  using (judge_id = (select auth.uid())
         or (select public.kj_is_staff())
         or exists (select 1 from public.kj_entries e join public.kj_categories c on c.slug = e.category
                    where e.id = entry_id and c.results_published
                      and (e.dancer_id = (select auth.uid()) or e.partner_id = (select auth.uid()))));
create policy "judges score during prelims" on public.kj_scores for insert to authenticated
  with check (judge_id = (select auth.uid()) and (select public.kj_is_judge()) and public.kj_entry_in_prelims(entry_id));
create policy "judges rescore during prelims" on public.kj_scores for update to authenticated
  using (judge_id = (select auth.uid()) and (select public.kj_is_judge()) and public.kj_entry_in_prelims(entry_id))
  with check (judge_id = (select auth.uid()) and public.kj_entry_in_prelims(entry_id));
create policy "staff remove scores" on public.kj_scores for delete to authenticated
  using ((select public.kj_is_staff()));

create or replace function public.kj_touch_updated()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end;
$$;
create trigger kj_scores_touch before update on public.kj_scores
  for each row execute function public.kj_touch_updated();
create trigger kj_categories_touch before update on public.kj_categories
  for each row execute function public.kj_touch_updated();

-- ---------------------------------------------------------------------------------------------
-- Votes: the digital hand-raise for bracket battles and 7 to Smoke exchanges
-- ---------------------------------------------------------------------------------------------
create table public.kj_votes (
  battle_id bigint not null references public.kj_battles (id) on delete cascade,
  judge_id uuid not null references public.kj_profiles (id) on delete cascade,
  vote_round integer not null default 1,
  pick text not null check (pick in ('a', 'b', 'tie')),
  created_at timestamptz not null default now(),
  primary key (battle_id, judge_id, vote_round)
);
alter table public.kj_votes enable row level security;

create or replace function public.kj_battle_votable(b bigint, r integer)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.kj_battles x
                 where x.id = b and x.kind in ('bracket', 'smoke') and x.status = 'live' and x.vote_round = r);
$$;
revoke all on function public.kj_battle_votable(bigint, integer) from public;
grant execute on function public.kj_battle_votable(bigint, integer) to authenticated;

create policy "judges read own votes, staff read all" on public.kj_votes for select to authenticated
  using (judge_id = (select auth.uid()) or (select public.kj_is_staff()));
create policy "judges vote on the live battle" on public.kj_votes for insert to authenticated
  with check (judge_id = (select auth.uid()) and (select public.kj_is_judge()) and public.kj_battle_votable(battle_id, vote_round));
create policy "judges change vote on the live battle" on public.kj_votes for update to authenticated
  using (judge_id = (select auth.uid()) and public.kj_battle_votable(battle_id, vote_round))
  with check (judge_id = (select auth.uid()) and public.kj_battle_votable(battle_id, vote_round));
create policy "staff clear votes" on public.kj_votes for delete to authenticated
  using ((select public.kj_is_staff()));

-- ---------------------------------------------------------------------------------------------
-- 7 to Smoke state: who holds the floor, the line behind them and everyone's points
-- ---------------------------------------------------------------------------------------------
create table public.kj_smoke (
  category text primary key references public.kj_categories (slug) on update cascade on delete cascade,
  lineup bigint[] not null default '{}',  -- starting order, used to replay the board on undo
  on_floor bigint references public.kj_entries (id) on delete set null,
  queue bigint[] not null default '{}',
  points jsonb not null default '{}',     -- { "<entry id>": points }
  champion bigint references public.kj_entries (id) on delete set null,
  started_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.kj_smoke enable row level security;

create policy "smoke boards are public" on public.kj_smoke for select to anon, authenticated using (true);
create policy "staff run smoke" on public.kj_smoke for all to authenticated
  using ((select public.kj_is_staff())) with check ((select public.kj_is_staff()));
create trigger kj_smoke_touch before update on public.kj_smoke
  for each row execute function public.kj_touch_updated();

-- ---------------------------------------------------------------------------------------------
-- Spectator passes: RSVPs can now belong to an account and be checked in
-- ---------------------------------------------------------------------------------------------
alter table public.kj_rsvp
  add column user_id uuid references auth.users (id) on delete set null,
  add column pass_token uuid not null default gen_random_uuid() unique,
  add column checked_in_at timestamptz,
  add column checked_in_by text;
create unique index kj_rsvp_one_per_user on public.kj_rsvp (user_id) where user_id is not null;

drop policy "anyone can rsvp" on public.kj_rsvp;
create policy "anyone can rsvp" on public.kj_rsvp for insert to anon, authenticated
  with check (user_id is null or user_id = (select auth.uid()));
create policy "read own rsvp, staff read all" on public.kj_rsvp for select to authenticated
  using (user_id = (select auth.uid()) or (select public.kj_is_staff()));
create policy "staff check in rsvps" on public.kj_rsvp for update to authenticated
  using ((select public.kj_is_staff())) with check ((select public.kj_is_staff()));

-- ---------------------------------------------------------------------------------------------
-- Audit log for transfers, payment decisions and competition changes
-- ---------------------------------------------------------------------------------------------
create table public.kj_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor text default (auth.jwt() ->> 'email'),
  action text not null check (char_length(action) <= 60),
  detail jsonb not null default '{}'
);
alter table public.kj_log enable row level security;
create policy "staff write log" on public.kj_log for insert to authenticated with check ((select public.kj_is_staff()));
create policy "staff read log" on public.kj_log for select to authenticated using ((select public.kj_is_staff()));

-- ---------------------------------------------------------------------------------------------
-- Public views: only the fields the brackets, boards and partner search need
-- ---------------------------------------------------------------------------------------------
create view public.kj_people as
  select p.id, p.code, coalesce(nullif(p.stage_name, ''), 'Dancer ' || p.code) as stage_name, p.crew, p.city, p.country, p.role
  from public.kj_profiles p
  where p.role in ('participant', 'judge', 'mc');

create view public.kj_public_entries as
  select e.id, e.category, e.seed, e.status, e.invited,
         coalesce(nullif(e.team_name, ''),
                  nullif(concat_ws(' & ', coalesce(nullif(d.stage_name, ''), e.guest_name, d.code),
                                   case when e.partner_status = 'accepted' then coalesce(nullif(m.stage_name, ''), m.code) end), ''),
                  'TBA') as label,
         d.code, coalesce(d.crew, '') as crew, coalesce(d.city, '') as city, coalesce(d.country, '') as country
  from public.kj_entries e
  left join public.kj_profiles d on d.id = e.dancer_id
  left join public.kj_profiles m on m.id = e.partner_id;

grant select on public.kj_people, public.kj_public_entries to anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- Check-in desk: look up a QR pass token or dancer code and mark it as arrived
-- ---------------------------------------------------------------------------------------------
create or replace function public.kj_check_in(token text, confirm boolean default true)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  p public.kj_profiles;
  r public.kj_rsvp;
  t text := upper(trim(token));
  who text := (select auth.jwt() ->> 'email');
  first boolean;
begin
  if not public.kj_is_staff() then raise exception 'Staff only'; end if;

  select * into p from public.kj_profiles
  where code = t or pass_token::text = lower(t) or code = 'KJ-' || lpad(regexp_replace(t, '\D', '', 'g'), 4, '0')
  limit 1;
  if p.id is not null then
    first := p.checked_in_at is null;
    if confirm and first then
      update public.kj_profiles set checked_in_at = now(), checked_in_by = who where id = p.id returning * into p;
    end if;
    return jsonb_build_object(
      'kind', 'dancer', 'first', first, 'code', p.code, 'name', p.name, 'stage_name', p.stage_name, 'role', p.role,
      'crew', p.crew, 'city', p.city, 'checked_in_at', p.checked_in_at,
      'paid', coalesce((select y.status = 'paid' from public.kj_payments y where y.dancer_id = p.id), false),
      'categories', coalesce((select jsonb_agg(c.name order by c.sort) from public.kj_entries e join public.kj_categories c on c.slug = e.category
                              where (e.dancer_id = p.id or (e.partner_id = p.id and e.partner_status = 'accepted')) and e.status = 'active'), '[]'::jsonb));
  end if;

  select * into r from public.kj_rsvp where pass_token::text = lower(t) limit 1;
  if r.id is not null then
    first := r.checked_in_at is null;
    if confirm and first then
      update public.kj_rsvp set checked_in_at = now(), checked_in_by = who where id = r.id returning * into r;
    end if;
    return jsonb_build_object('kind', 'spectator', 'first', first, 'name', r.name, 'city', r.city, 'party', r.party, 'checked_in_at', r.checked_in_at);
  end if;

  return jsonb_build_object('kind', 'none');
end;
$$;
revoke all on function public.kj_check_in(text, boolean) from public;
grant execute on function public.kj_check_in(text, boolean) to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Realtime: push changes to the live page, judges and MC
-- ---------------------------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.kj_battles, public.kj_smoke, public.kj_categories, public.kj_votes, public.kj_scores;
  end if;
end;
$$;
