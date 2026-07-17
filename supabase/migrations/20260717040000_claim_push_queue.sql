-- Prevent concurrent cron/admin runs from dispatching the same notification.

alter table public.notifications
  add column if not exists push_claim_id uuid,
  add column if not exists push_claimed_at timestamptz;

create index if not exists notifications_push_claim_idx
on public.notifications (push_claimed_at, created_at)
where push_sent_at is null and push_attempts < 5;

create or replace function public.claim_pending_notifications(
  p_claim_id uuid,
  p_limit integer default 100
)
returns setof public.notifications
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_claim_id is null or p_limit < 1 or p_limit > 100 then
    raise exception 'invalid push claim configuration';
  end if;

  return query
  with candidates as (
    select notification.id
    from public.notifications as notification
    where notification.push_sent_at is null
      and notification.push_attempts < 5
      and (
        notification.push_claimed_at is null
        or notification.push_claimed_at < now() - interval '5 minutes'
      )
    order by notification.created_at
    for update skip locked
    limit p_limit
  ), claimed as (
    update public.notifications as notification
    set push_claim_id = p_claim_id,
        push_claimed_at = now()
    from candidates
    where notification.id = candidates.id
    returning notification.*
  )
  select claimed.*
  from claimed
  order by claimed.created_at;
end;
$$;

revoke all on function public.claim_pending_notifications(uuid, integer) from public;
grant execute on function public.claim_pending_notifications(uuid, integer) to service_role;
