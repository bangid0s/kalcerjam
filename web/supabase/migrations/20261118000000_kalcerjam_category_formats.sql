-- Category formats: every category is a "module" that runs one of three formats.
--
--   smoke            7 to Smoke, straight away. No prelims: the line-up is every confirmed dancer.
--   prelims_bracket  Prelim heats (judges score Mind / Body / Soul), then a seeded Top 16/8/4 bracket.
--   bracket          Bracket only, no prelims: random draw.
--
-- `smoke` stays as a read-only column derived from the format so existing queries keep working.
-- Admins create, duplicate, edit and delete categories from /dashboard → Categories.

alter table public.kj_categories
  add column if not exists format text not null default 'prelims_bracket'
    check (format in ('smoke', 'prelims_bracket', 'bracket'));

update public.kj_categories set format = 'smoke' where smoke;

alter table public.kj_categories drop column smoke;
alter table public.kj_categories add column smoke boolean generated always as (format = 'smoke') stored;

-- 7 to Smoke no longer has prelim qualifiers. If a smoke category was halfway through prelims,
-- send it back to registration so the team can start the 7 to Smoke line directly.
update public.kj_categories c set phase = 'setup'
where c.format = 'smoke' and c.phase = 'prelims';
delete from public.kj_battles b using public.kj_categories c
where b.category = c.slug and c.format = 'smoke' and b.kind = 'prelim';
