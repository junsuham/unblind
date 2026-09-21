-- Keep church affiliation consent separate from the general community terms.
-- The department is optional and remains private to the member and operators.

alter table public.user_profiles
add column if not exists church_department text;

alter table public.user_profiles
add column if not exists church_info_consent_at timestamptz;

alter table public.user_profiles
add column if not exists church_info_consent_version text;

alter table public.user_profiles
drop constraint if exists user_profiles_church_department_length_check;

alter table public.user_profiles
add constraint user_profiles_church_department_length_check
check (
  church_department is null
  or char_length(church_department) between 1 and 80
) not valid;
