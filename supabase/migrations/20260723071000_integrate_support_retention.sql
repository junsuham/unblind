-- Include completed support requests in the existing scheduled maintenance pass.

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
  delete from public.app_events where created_at < now() - interval '90 days';
  get diagnostics v_events_deleted = row_count;

  delete from public.request_rate_limits where updated_at < now() - interval '2 days';
  get diagnostics v_rate_limits_deleted = row_count;

  delete from public.notifications where read_at is not null and read_at < now() - interval '90 days';
  delete from public.push_tokens where is_active = false and updated_at < now() - interval '30 days';
  delete from public.web_push_subscriptions where is_active = false and updated_at < now() - interval '30 days';
  delete from public.account_deletion_audit where requested_at < now() - interval '1 year';
  delete from public.admin_actions where created_at < now() - interval '2 years';
  delete from public.admin_user_actions where created_at < now() - interval '2 years';
  perform public.prune_support_requests();

  update public.reports
  set reporter_user_id = null, reporter_email = null
  where resolved_at is not null
    and resolved_at < now() - interval '1 year'
    and (reporter_user_id is not null or reporter_email is not null);

  return query select v_events_deleted, v_rate_limits_deleted;
end;
$$;

revoke all on function public.prune_operational_data() from public;
grant execute on function public.prune_operational_data() to service_role;
