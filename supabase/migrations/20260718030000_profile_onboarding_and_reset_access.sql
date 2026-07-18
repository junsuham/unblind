-- Store onboarding consent with the user's profile, then reset community
-- approvals without deleting accounts, profiles, posts, or comments.

alter table public.user_profiles
add column if not exists agreed_at timestamptz;

alter table public.user_profiles
add column if not exists agreed_version text;

-- Older production projects were created before the reproducible foundation
-- migration and may not have every lifecycle column on allowed_users.
alter table public.allowed_users
add column if not exists agreed_at timestamptz;

alter table public.allowed_users
add column if not exists agreed_version text;

alter table public.allowed_users
add column if not exists last_seen_at timestamptz;

alter table public.allowed_users
add column if not exists updated_at timestamptz not null default now();

update public.user_profiles as profile
set agreed_at = coalesce(profile.agreed_at, access.agreed_at),
    agreed_version = coalesce(profile.agreed_version, access.agreed_version),
    updated_at = now()
from public.allowed_users as access
where lower(profile.email) = lower(access.email)
  and access.agreed_at is not null;

create or replace function public.mark_beta_agreement(p_agreement_version text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or nullif(auth.jwt() ->> 'email', '') is null then
    raise exception '로그인이 필요합니다.';
  end if;

  update public.user_profiles
  set agreed_at = now(),
      agreed_version = p_agreement_version,
      updated_at = now()
  where user_id = auth.uid()
    and completed_at is not null;

  if not found then
    raise exception '가입 정보 입력을 먼저 완료해주세요.';
  end if;

  update public.allowed_users
  set agreed_at = now(),
      agreed_version = p_agreement_version,
      last_seen_at = now(),
      updated_at = now()
  where lower(email) = lower(auth.jwt() ->> 'email')
    and status = 'active';
end;
$$;

revoke all on function public.mark_beta_agreement(text) from public;
grant execute on function public.mark_beta_agreement(text) to authenticated;

insert into public.allowed_users (email, status, memo, updated_at)
values ('gkawnstn95@gmail.com', 'active', '관리자 계정', now())
on conflict (email) do update
set status = 'active',
    updated_at = now();

delete from public.allowed_users as access
where access.status = 'active'
  and lower(access.email) <> 'gkawnstn95@gmail.com'
  and not exists (
    select 1
    from public.admin_roles as role
    where role.is_active = true
      and lower(role.email) = lower(access.email)
  );
