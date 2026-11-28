-- Judge panels: each category has its own panel of judges, picked for the styles they know.
--
--   * Only judges on a category's panel can score its prelims or vote on its bracket battles.
--     A category with no panel can't be judged at all (strict: the team must assign one).
--   * 7 to Smoke has no panel and no judge votes. The team taps the winner of every exchange.
--   * A panel is locked once its category leaves registration (setup). Admins can still change
--     it; the app asks them to confirm. Scores and votes from judges taken off a panel are kept
--     for the record but no longer count.

create table public.kj_category_judges (
  category text not null references public.kj_categories (slug) on update cascade on delete cascade,
  judge_id uuid not null references public.kj_profiles (id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (category, judge_id)
);
alter table public.kj_category_judges enable row level security;

-- Is this account a judge on the category's panel right now?
create or replace function public.kj_on_panel(cat text)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.kj_role() = 'judge'
     and exists (select 1 from public.kj_category_judges j where j.category = cat and j.judge_id = (select auth.uid()));
$$;

-- Can this panel still be changed by this account? Team during registration, admins always.
create or replace function public.kj_panel_editable(cat text)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_kj_admin()
      or (public.kj_is_staff() and exists (select 1 from public.kj_categories c where c.slug = cat and c.phase = 'setup'));
$$;

revoke all on function public.kj_on_panel(text), public.kj_panel_editable(text) from public;
grant execute on function public.kj_on_panel(text), public.kj_panel_editable(text) to authenticated;

create policy "crew read panels" on public.kj_category_judges for select to authenticated
  using ((select public.kj_is_crew()));
create policy "staff add to panels" on public.kj_category_judges for insert to authenticated
  with check (public.kj_panel_editable(category));
create policy "staff remove from panels" on public.kj_category_judges for delete to authenticated
  using (public.kj_panel_editable(category));

-- Only accounts with the judge role can sit on a panel, and never on a 7 to Smoke category.
create or replace function public.kj_category_judges_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.kj_profiles p where p.id = new.judge_id and p.role = 'judge') then
    raise exception 'Only accounts with the judge role can sit on a panel';
  end if;
  if exists (select 1 from public.kj_categories c where c.slug = new.category and c.format = 'smoke') then
    raise exception '7 to Smoke has no judge panel: the team decides every exchange';
  end if;
  return new;
end;
$$;
create trigger kj_category_judges_guard before insert on public.kj_category_judges
  for each row execute function public.kj_category_judges_guard();

-- ---------------------------------------------------------------------------------------------
-- Scores: only the category's panel, only during prelims
-- ---------------------------------------------------------------------------------------------
create or replace function public.kj_can_score(e bigint)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.kj_entries x join public.kj_categories c on c.slug = x.category
                 where x.id = e and c.phase = 'prelims' and public.kj_on_panel(c.slug));
$$;
revoke all on function public.kj_can_score(bigint) from public;
grant execute on function public.kj_can_score(bigint) to authenticated;

drop policy "judges score during prelims" on public.kj_scores;
drop policy "judges rescore during prelims" on public.kj_scores;
create policy "panel judges score during prelims" on public.kj_scores for insert to authenticated
  with check (judge_id = (select auth.uid()) and public.kj_can_score(entry_id));
create policy "panel judges rescore during prelims" on public.kj_scores for update to authenticated
  using (judge_id = (select auth.uid()) and public.kj_can_score(entry_id))
  with check (judge_id = (select auth.uid()) and public.kj_can_score(entry_id));

-- ---------------------------------------------------------------------------------------------
-- Votes: only bracket battles (7 to Smoke is decided by the team), only the category's panel
-- ---------------------------------------------------------------------------------------------
create or replace function public.kj_battle_votable(b bigint, r integer)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.kj_battles x
                 where x.id = b and x.kind = 'bracket' and x.status = 'live' and x.vote_round = r
                   and public.kj_on_panel(x.category));
$$;

drop policy "judges vote on the live battle" on public.kj_votes;
drop policy "judges change vote on the live battle" on public.kj_votes;
create policy "panel judges vote on the live battle" on public.kj_votes for insert to authenticated
  with check (judge_id = (select auth.uid()) and public.kj_battle_votable(battle_id, vote_round));
create policy "panel judges change vote on the live battle" on public.kj_votes for update to authenticated
  using (judge_id = (select auth.uid()) and public.kj_battle_votable(battle_id, vote_round))
  with check (judge_id = (select auth.uid()) and public.kj_battle_votable(battle_id, vote_round));

-- Votes cast on 7 to Smoke exchanges before this change no longer mean anything.
delete from public.kj_votes v using public.kj_battles b where b.id = v.battle_id and b.kind = 'smoke';

-- Live updates for the judges' phones and the team screens.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'kj_category_judges') then
    alter publication supabase_realtime add table public.kj_category_judges;
  end if;
end;
$$;
