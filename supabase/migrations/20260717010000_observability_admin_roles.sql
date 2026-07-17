-- Operational observability, server-authoritative administrator roles, and hot-path indexes.

create table if not exists public.admin_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role text not null default 'admin' check (role in ('owner', 'admin', 'moderator')),
  is_active boolean not null default true,
  granted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists admin_roles_email_lower_idx
on public.admin_roles (lower(email));

alter table public.admin_roles enable row level security;
revoke all on public.admin_roles from anon, authenticated;

create table if not exists public.app_events (
  id bigint generated always as identity primary key,
  source text not null check (source in ('web', 'mobile', 'server')),
  severity text not null default 'info' check (severity in ('info', 'warning', 'error', 'fatal')),
  name text not null,
  message text,
  release text,
  route text,
  fingerprint text,
  user_id uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists app_events_created_idx
on public.app_events (created_at desc);

create index if not exists app_events_severity_created_idx
on public.app_events (severity, created_at desc);

create index if not exists app_events_name_created_idx
on public.app_events (name, created_at desc);

alter table public.app_events enable row level security;
revoke all on public.app_events from anon, authenticated;

create index if not exists posts_board_status_created_idx
on public.posts (board, status, created_at desc);

create index if not exists comments_post_status_created_idx
on public.comments (post_id, status, created_at asc);

create index if not exists reports_status_created_idx
on public.reports (status, created_at desc);

