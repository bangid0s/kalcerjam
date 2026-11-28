-- Pick a judge's categories at the moment they get the judge role.
--
-- kj_set_judge(judge, cats) gives the account the judge role (admins only, as before) and sets
-- exactly which category panels they sit on, in one step: it all saves or nothing does.
-- At least one category is required, and 7 to Smoke can't be picked (it has no panel).
-- Panels of categories that have started can still only be changed by an admin.
--
-- When someone stops being a judge, they leave every panel of a category still in
-- registration. Seats in started categories stay for the record (they no longer count).

create or replace function public.kj_set_judge(judge uuid, cats text[])
returns void language plpgsql security definer set search_path = '' as $$
declare
  cur text[];
  c text;
begin
  if not public.kj_is_staff() then
    raise exception 'Only the team can assign judges';
  end if;
  cats := coalesce(cats, '{}');
  if cardinality(cats) = 0 then
    raise exception 'Pick at least one category for this judge';
  end if;
  if exists (select 1 from unnest(cats) x left join public.kj_categories k on k.slug = x
             where k.slug is null or k.format = 'smoke') then
    raise exception 'Unknown category, or 7 to Smoke (it has no judge panel)';
  end if;
  if not exists (select 1 from public.kj_profiles p where p.id = judge) then
    raise exception 'No such account';
  end if;

  -- The profile guard still allows only admins to hand out the judge role.
  update public.kj_profiles set role = 'judge' where id = judge and role <> 'judge';

  select coalesce(array_agg(j.category), '{}') into cur from public.kj_category_judges j where j.judge_id = judge;

  for c in select unnest(cats) except select unnest(cur) loop
    if not public.kj_panel_editable(c) then
      raise exception '% has started: only an admin can change its panel', (select k.name from public.kj_categories k where k.slug = c);
    end if;
    insert into public.kj_category_judges (category, judge_id) values (c, judge);
  end loop;

  for c in select unnest(cur) except select unnest(cats) loop
    if not public.kj_panel_editable(c) then
      raise exception '% has started: only an admin can change its panel', (select k.name from public.kj_categories k where k.slug = c);
    end if;
    delete from public.kj_category_judges where category = c and judge_id = judge;
  end loop;

  insert into public.kj_log (action, detail)
  values ('judge.set', jsonb_build_object('judge', judge, 'categories', to_jsonb(cats)));
end;
$$;
revoke all on function public.kj_set_judge(uuid, text[]) from public;
grant execute on function public.kj_set_judge(uuid, text[]) to authenticated;

-- No longer a judge: leave the panels of categories that haven't started.
create or replace function public.kj_profiles_left_judging()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.role = 'judge' and new.role <> 'judge' then
    delete from public.kj_category_judges j
    using public.kj_categories c
    where j.judge_id = new.id and c.slug = j.category and c.phase = 'setup';
  end if;
  return new;
end;
$$;
create trigger kj_profiles_left_judging after update of role on public.kj_profiles
  for each row execute function public.kj_profiles_left_judging();
