-- Live participant lists: push entry changes (new entries, partners accepting, withdrawals,
-- seeds) to the dashboards and the public categories page through Supabase Realtime.
-- Realtime still applies row-level security, so each client only hears about rows it can read.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'kj_entries') then
    alter publication supabase_realtime add table public.kj_entries;
  end if;
end;
$$;
