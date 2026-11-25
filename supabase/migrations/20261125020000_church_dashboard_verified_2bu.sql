-- The legacy dashboard contains 2부 data, not a church-wide youth summary.
-- An administrator may verify the member's 2부 affiliation independently of
-- the optional self-reported department field in their UNBLIND profile.
alter table public.church_dashboard_access
  add column if not exists verified_department boolean not null default false;

create or replace function public.set_church_dashboard_access_v2(
  p_actor_user_id uuid,
  p_target_user_id uuid,
  p_action text,
  p_scope text default null,
  p_department text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_email text;
  v_target_email text;
  v_target_provider text;
  v_profile public.user_profiles%rowtype;
  v_department text;
  v_verified_department boolean := false;
begin
  select user_record.email into v_actor_email
  from auth.users as user_record
  join public.admin_roles as role on role.user_id = user_record.id
  where user_record.id = p_actor_user_id and role.is_active = true;
  if v_actor_email is null then raise exception 'active administrator required'; end if;

  select user_record.email, user_record.raw_app_meta_data ->> 'provider'
  into v_target_email, v_target_provider
  from auth.users as user_record
  where user_record.id = p_target_user_id;
  if v_target_email is null then raise exception 'target account not found'; end if;

  if p_action = 'grant' then
    if v_target_provider <> 'google' or v_target_provider is null then
      raise exception 'target Google account required';
    end if;
    if p_scope not in ('church', 'department', 'verified_2bu') or p_scope is null then
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

    if p_scope = 'department' then
      v_department := nullif(trim(v_profile.church_department), '');
      if v_department is null then raise exception 'target department is missing'; end if;
    elsif p_scope = 'verified_2bu' then
      -- Hard-bound to the known OpenStreetMap place selected during signup.
      -- No other church or arbitrary department can use this override.
      if v_profile.church_place_id <> 'way-465724410' or p_department <> '2부' then
        raise exception 'verified 2bu scope is limited to the target church';
      end if;
      v_department := '2부';
      v_verified_department := true;
    else
      v_department := null;
    end if;

    insert into public.church_dashboard_access
      (user_id, church_place_id, church_name, department, verified_department, is_active, granted_by, updated_at)
    values
      (p_target_user_id, trim(v_profile.church_place_id), trim(v_profile.church_name), v_department, v_verified_department, true, p_actor_user_id, now())
    on conflict (user_id) do update set
      church_place_id = excluded.church_place_id,
      church_name = excluded.church_name,
      department = excluded.department,
      verified_department = excluded.verified_department,
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

revoke all on function public.set_church_dashboard_access_v2(uuid, uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.set_church_dashboard_access_v2(uuid, uuid, text, text, text) to service_role;
