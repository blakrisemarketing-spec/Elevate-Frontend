-- Multi-user admin accounts. Replaces the single shared ADMIN_PASSWORD with
-- per-user email + password login. Passwords are bcrypt hashes (PHP
-- password_hash); the plaintext is never stored. Service-key only (RLS deny-all
-- with no policies); the ADMIN_PASSWORD env var remains as a break-glass login.
create table if not exists public.ech_admin_users (
  id bigint generated always as identity primary key,
  email text not null unique,           -- stored lowercased
  password_hash text not null,
  name text not null default '',
  role text not null default 'admin' check (role in ('admin')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);

alter table public.ech_admin_users enable row level security;
