alter table public.posts
  add column if not exists view_count bigint not null default 0;

create or replace function public.increment_post_view(p_post_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.posts
  set view_count = view_count + 1
  where id = p_post_id
    and status = 'visible';
$$;

revoke all on function public.increment_post_view(uuid) from public;
grant execute on function public.increment_post_view(uuid) to authenticated;
