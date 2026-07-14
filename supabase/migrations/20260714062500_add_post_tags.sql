alter table public.posts
add column if not exists tags text[] not null default '{}'::text[];

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'posts_tags_limit'
      and conrelid = 'public.posts'::regclass
  ) then
    alter table public.posts
    add constraint posts_tags_limit
    check (cardinality(tags) <= 5) not valid;
  end if;
end
$$;

alter table public.posts
validate constraint posts_tags_limit;
