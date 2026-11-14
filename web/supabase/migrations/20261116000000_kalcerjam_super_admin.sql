-- Super admins: admins who can also create, edit and delete login accounts (through the
-- kj-admin-users Edge Function, which holds the service-role key) and manage the admin list.

alter table public.kj_admins add column if not exists super boolean not null default false;

update public.kj_admins set super = true where email = 'info@mjfird.com';

create or replace function public.is_kj_super()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.kj_admins a
    where a.super and a.email = lower(coalesce((select auth.jwt() ->> 'email'), ''))
  );
$$;
revoke all on function public.is_kj_super() from public;
grant execute on function public.is_kj_super() to anon, authenticated;

-- Super admins add and remove admins (the function above, not this policy, guards the super flag
-- itself: only super admins can write rows at all).
create policy "super admins add admins" on public.kj_admins
  for insert to authenticated with check ((select public.is_kj_super()));
create policy "super admins edit admins" on public.kj_admins
  for update to authenticated using ((select public.is_kj_super())) with check ((select public.is_kj_super()));
create policy "super admins remove admins" on public.kj_admins
  for delete to authenticated using ((select public.is_kj_super()) and email <> lower(coalesce((select auth.jwt() ->> 'email'), '')));

-- The kj-admin-users Edge Function writes profiles with the service-role key. Let that bypass the
-- self-service guard (it is only reachable after the function has checked for a super admin).
create or replace function public.kj_profiles_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.updated_at := now();
  if (select auth.jwt() ->> 'role') = 'service_role' then
    return new;
  end if;
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
