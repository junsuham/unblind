-- Keep growing feeds bounded: return only aggregate engagement numbers, never
-- the underlying reaction actor keys, for a small set of visible posts.
create or replace function public.get_visible_post_engagement(p_post_ids uuid[])
returns table (
  post_id uuid,
  comment_count bigint,
  pray_count bigint,
  empathize_count bigint
)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select
    p.id,
    (select count(*) from public.comments c
      where c.post_id = p.id and c.status = 'visible') as comment_count,
    (select count(*) from public.reactions r
      where r.post_id = p.id and r.type = 'pray') as pray_count,
    (select count(*) from public.reactions r
      where r.post_id = p.id and r.type = 'empathize') as empathize_count
  from public.posts p
  where p.id = any(p_post_ids)
    and p.status = 'visible'
    and coalesce(array_length(p_post_ids, 1), 0) between 1 and 50;
$$;

revoke all on function public.get_visible_post_engagement(uuid[]) from public, anon;
grant execute on function public.get_visible_post_engagement(uuid[]) to authenticated;

create index if not exists posts_visible_recent_idx
  on public.posts (created_at desc)
  where status = 'visible';

create index if not exists posts_visible_popular_idx
  on public.posts (view_count desc, created_at desc)
  where status = 'visible';

create index if not exists posts_board_visible_popular_idx
  on public.posts (board, view_count desc, created_at desc)
  where status = 'visible';

create index if not exists reactions_post_type_idx
  on public.reactions (post_id, type);
