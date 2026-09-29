-- Client-generated request keys make service-worker retries safe.
alter table public.posts
add column if not exists client_request_key uuid;

alter table public.comments
add column if not exists client_request_key uuid;

create unique index if not exists posts_author_client_request_key_idx
on public.posts (author_user_id, client_request_key)
where client_request_key is not null;

create unique index if not exists comments_author_client_request_key_idx
on public.comments (author_user_id, client_request_key)
where client_request_key is not null;
