alter table public.posts
  add column if not exists author_user_id uuid
  references auth.users(id) on delete set null
  default auth.uid();

alter table public.comments
  add column if not exists author_user_id uuid
  references auth.users(id) on delete set null
  default auth.uid();

create index if not exists posts_author_user_id_idx
on public.posts (author_user_id);

create index if not exists comments_author_user_id_idx
on public.comments (author_user_id);
