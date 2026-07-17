-- Durable serverless rate limits, search acceleration, and operational retention.

create extension if not exists pg_trgm;

create table if not exists public.request_rate_limits (
  bucket text not null,
  key_hash text not null,
  window_start timestamptz not null,
  request_count integer not null default 1 check (request_count > 0),
  updated_at timestamptz not null default now(),
  primary key (bucket, key_hash, window_start)
);

create index if not exists request_rate_limits_updated_idx
on public.request_rate_limits (updated_at);

alter table public.request_rate_limits enable row level security;
revoke all on public.request_rate_limits from anon, authenticated;

create or replace function public.consume_rate_limit(
  p_bucket text,
  p_key_hash text,
  p_window_seconds integer,
  p_limit integer
)
returns table (allowed boolean, remaining integer, retry_after integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window_start timestamptz;
  v_count integer;
begin
  if p_bucket !~ '^[a-z0-9_.-]{1,80}$'
    or p_key_hash !~ '^[a-f0-9]{64}$'
    or p_window_seconds < 1
    or p_window_seconds > 86400
    or p_limit < 1
    or p_limit > 10000 then
    raise exception 'invalid rate limit configuration';
  end if;

  v_window_start := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into public.request_rate_limits
    (bucket, key_hash, window_start, request_count, updated_at)
  values
    (p_bucket, p_key_hash, v_window_start, 1, now())
  on conflict (bucket, key_hash, window_start)
  do update set
    request_count = public.request_rate_limits.request_count + 1,
    updated_at = now()
  returning request_count into v_count;

  return query select
    v_count <= p_limit,
    greatest(p_limit - v_count, 0),
    greatest(
      ceil(extract(epoch from (v_window_start + make_interval(secs => p_window_seconds) - now())))::integer,
      1
    );
end;
$$;

create or replace function public.clear_rate_limit(
  p_bucket text,
  p_key_hash text
)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.request_rate_limits
  where bucket = p_bucket and key_hash = p_key_hash;
$$;

create or replace function public.prune_operational_data()
returns table (events_deleted bigint, rate_limits_deleted bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_events_deleted bigint;
  v_rate_limits_deleted bigint;
begin
  delete from public.app_events
  where created_at < now() - interval '90 days';
  get diagnostics v_events_deleted = row_count;

  delete from public.request_rate_limits
  where updated_at < now() - interval '2 days';
  get diagnostics v_rate_limits_deleted = row_count;

  return query select v_events_deleted, v_rate_limits_deleted;
end;
$$;

revoke all on function public.consume_rate_limit(text, text, integer, integer) from public;
revoke all on function public.clear_rate_limit(text, text) from public;
revoke all on function public.prune_operational_data() from public;
grant execute on function public.consume_rate_limit(text, text, integer, integer) to service_role;
grant execute on function public.clear_rate_limit(text, text) to service_role;
grant execute on function public.prune_operational_data() to service_role;

create index if not exists posts_title_trgm_idx
on public.posts using gin (title gin_trgm_ops);

create index if not exists posts_content_trgm_idx
on public.posts using gin (content gin_trgm_ops);
