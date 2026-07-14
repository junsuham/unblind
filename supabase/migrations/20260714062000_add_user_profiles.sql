create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nickname text not null unique,
  birth_date date not null,
  reference_age integer not null check (reference_age between 0 and 130),
  church_place_id text not null,
  church_name text not null,
  church_address text not null,
  church_place_url text,
  occupation text not null check (occupation in ('student', 'worker', 'other')),
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

drop policy if exists "Users can read their own profile" on public.user_profiles;
create policy "Users can read their own profile"
on public.user_profiles
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create their own profile" on public.user_profiles;
create policy "Users can create their own profile"
on public.user_profiles
for insert
to authenticated
with check (
  auth.uid() = user_id
  and lower(email) = lower(auth.jwt() ->> 'email')
);

drop policy if exists "Users can update their own profile" on public.user_profiles;
create policy "Users can update their own profile"
on public.user_profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and lower(email) = lower(auth.jwt() ->> 'email')
);

grant select, insert, update on public.user_profiles to authenticated;

create index if not exists user_profiles_email_lower_idx
on public.user_profiles (lower(email));
