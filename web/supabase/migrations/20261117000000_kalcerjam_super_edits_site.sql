-- Website editing is for super admins only. Regular admins keep running the event and the
-- competition (kj_is_staff() still includes them), the RSVP list and role assignment.

drop policy if exists "admins insert content" on public.kj_content;
drop policy if exists "admins update content" on public.kj_content;
drop policy if exists "admins delete content" on public.kj_content;
create policy "super admins insert content" on public.kj_content
  for insert to authenticated with check ((select public.is_kj_super()));
create policy "super admins update content" on public.kj_content
  for update to authenticated using ((select public.is_kj_super())) with check ((select public.is_kj_super()));
create policy "super admins delete content" on public.kj_content
  for delete to authenticated using ((select public.is_kj_super()));

drop policy if exists "admins upload media" on storage.objects;
drop policy if exists "admins update media" on storage.objects;
drop policy if exists "admins delete media" on storage.objects;
drop policy if exists "admins list media" on storage.objects;
create policy "super admins upload media" on storage.objects
  for insert to authenticated with check (bucket_id = 'kj-media' and (select public.is_kj_super()));
create policy "super admins update media" on storage.objects
  for update to authenticated using (bucket_id = 'kj-media' and (select public.is_kj_super()));
create policy "super admins delete media" on storage.objects
  for delete to authenticated using (bucket_id = 'kj-media' and (select public.is_kj_super()));
create policy "super admins list media" on storage.objects
  for select to authenticated using (bucket_id = 'kj-media' and (select public.is_kj_super()));
