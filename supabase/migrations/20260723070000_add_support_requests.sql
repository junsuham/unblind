-- Private customer-support queue for account, privacy, safety, and technical requests.

create table if not exists public.support_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  category text not null check (
    category in ('account', 'approval', 'privacy', 'safety', 'technical', 'other')
  ),
  message text not null check (
    char_length(message) between 20 and 2000
  ),
  source text not null default 'web' check (source in ('web', 'mobile')),
  status text not null default 'open' check (
    status in ('open', 'in_progress', 'resolved', 'closed')
  ),
  resolution_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists support_requests_status_created_idx
on public.support_requests (status, created_at desc);

create index if not exists support_requests_user_created_idx
on public.support_requests (user_id, created_at desc);

alter table public.support_requests enable row level security;
revoke all on public.support_requests from anon, authenticated;

create or replace function public.prune_support_requests()
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted bigint;
begin
  delete from public.support_requests
  where status in ('resolved', 'closed')
    and coalesce(resolved_at, updated_at) < now() - interval '1 year';

  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke all on function public.prune_support_requests() from public;
grant execute on function public.prune_support_requests() to service_role;

create or replace function public.update_support_request(
  p_id uuid,
  p_status text,
  p_resolution_note text,
  p_admin_email text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_status not in ('open', 'in_progress', 'resolved', 'closed') then
    raise exception 'invalid support request status';
  end if;

  if char_length(btrim(coalesce(p_resolution_note, ''))) < 3 then
    raise exception 'resolution note is required';
  end if;

  update public.support_requests
  set status = p_status,
      resolution_note = btrim(p_resolution_note),
      updated_at = now(),
      resolved_at = case
        when p_status in ('resolved', 'closed') then now()
        else null
      end
  where id = p_id;

  if not found then
    raise exception 'support request not found';
  end if;

  insert into public.admin_actions
    (action_type, target_type, target_id, memo, admin_email)
  values
    ('support_' || p_status, 'support', p_id, btrim(p_resolution_note), p_admin_email);
end;
$$;

revoke all on function public.update_support_request(uuid, text, text, text) from public;
grant execute on function public.update_support_request(uuid, text, text, text) to service_role;
