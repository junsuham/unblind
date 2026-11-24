-- A distinct, revocable church-operations role. It never inherits app-admin
-- access and is bound to the member's recorded church and optional department.
create table if not exists public.church_dashboard_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  church_place_id text not null check (char_length(trim(church_place_id)) between 3 and 255),
  church_name text not null check (char_length(trim(church_name)) between 2 and 120),
  department text check (department is null or char_length(trim(department)) between 1 and 80),
  is_active boolean not null default true,
  granted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists church_dashboard_access_active_scope_idx
on public.church_dashboard_access (church_place_id, department)
where is_active;

alter table public.church_dashboard_access enable row level security;
revoke all on public.church_dashboard_access from anon, authenticated;

-- These are pre-aggregated, non-identifying values. A trusted out-of-app
-- process using the service role can publish them after source authorization.
-- An empty department is the church-wide summary; a named department is a
-- strictly scoped summary. No member names, emails, or raw prayer text belong
-- in this table.
create table if not exists public.church_dashboard_snapshots (
  church_place_id text not null check (char_length(trim(church_place_id)) between 3 and 255),
  church_name text not null check (char_length(trim(church_name)) between 2 and 120),
  department text not null default '' check (char_length(department) <= 80),
  generated_at timestamptz not null,
  member_count integer check (member_count is null or member_count >= 0),
  attendance_count integer check (attendance_count is null or attendance_count >= 0),
  prayer_contributor_count integer check (prayer_contributor_count is null or prayer_contributor_count >= 0),
  prayer_minutes integer check (prayer_minutes is null or prayer_minutes >= 0),
  care_pending_count integer check (care_pending_count is null or care_pending_count >= 0),
  upcoming_event_count integer check (upcoming_event_count is null or upcoming_event_count >= 0),
  attendance_weeks jsonb not null default '[]'::jsonb check (jsonb_typeof(attendance_weeks) = 'array'),
  primary key (church_place_id, department)
);

alter table public.church_dashboard_snapshots enable row level security;
revoke all on public.church_dashboard_snapshots from anon, authenticated;

-- Keep the role change and its audit record in one database transaction.
-- Only the server's service role may execute this function; browser clients
-- cannot use it even if they know the function name.
create or replace function public.set_church_dashboard_access(
  p_actor_user_id uuid,
  p_target_user_id uuid,
  p_action text,
  p_scope text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_email text;
  v_target_email text;
  v_target_provider text;
  v_profile public.user_profiles%rowtype;
  v_department text;
begin
  select user_record.email into v_actor_email
  from auth.users as user_record
  join public.admin_roles as role on role.user_id = user_record.id
  where user_record.id = p_actor_user_id and role.is_active = true;

  if v_actor_email is null then
    raise exception 'active administrator required';
  end if;

  select user_record.email, user_record.raw_app_meta_data ->> 'provider'
  into v_target_email, v_target_provider
  from auth.users as user_record
  where user_record.id = p_target_user_id;

  if v_target_email is null then
    raise exception 'target account not found';
  end if;

  if p_action = 'grant' then
    if v_target_provider <> 'google' or v_target_provider is null then
      raise exception 'target Google account required';
    end if;
    if p_scope not in ('church', 'department') or p_scope is null then
      raise exception 'invalid dashboard scope';
    end if;

    select profile.* into v_profile
    from public.user_profiles as profile
    where profile.user_id = p_target_user_id;

    if v_profile.user_id is null
       or v_profile.completed_at is null
       or v_profile.church_info_consent_at is null
       or v_profile.reference_age is null
       or v_profile.reference_age not between 20 and 59
       or nullif(trim(v_profile.church_place_id), '') is null
       or nullif(trim(v_profile.church_name), '') is null
       or not exists (
         select 1 from public.allowed_users as allowed
         where lower(allowed.email) = lower(v_target_email)
           and allowed.status = 'active'
           and allowed.agreed_at is not null
       ) then
      raise exception 'target account is not approved for dashboard access';
    end if;

    v_department := case when p_scope = 'department' then nullif(trim(v_profile.church_department), '') else null end;
    if p_scope = 'department' and v_department is null then
      raise exception 'target department is missing';
    end if;

    insert into public.church_dashboard_access
      (user_id, church_place_id, church_name, department, is_active, granted_by, updated_at)
    values
      (p_target_user_id, trim(v_profile.church_place_id), trim(v_profile.church_name), v_department, true, p_actor_user_id, now())
    on conflict (user_id) do update set
      church_place_id = excluded.church_place_id,
      church_name = excluded.church_name,
      department = excluded.department,
      is_active = true,
      granted_by = excluded.granted_by,
      updated_at = now();
  elsif p_action = 'revoke' then
    update public.church_dashboard_access
    set is_active = false, updated_at = now()
    where user_id = p_target_user_id;
  else
    raise exception 'invalid dashboard action';
  end if;

  insert into public.admin_user_actions (action_type, email, memo, admin_email)
  values (
    case when p_action = 'grant' then 'church_dashboard_grant' else 'church_dashboard_revoke' end,
    lower(v_target_email),
    case when p_action = 'grant' then p_scope else null end,
    lower(v_actor_email)
  );
end;
$$;

revoke all on function public.set_church_dashboard_access(uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.set_church_dashboard_access(uuid, uuid, text, text) to service_role;
