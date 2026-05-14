-- docs.velr.app schema
-- Custom auth (not using auth.users — this is a shared Supabase).
-- All access is via the service role from server-side Next.js.

create extension if not exists citext;
create extension if not exists pgcrypto;

create schema if not exists docs;

-- ─── Users ────────────────────────────────────────────────────────────────
create table if not exists docs.users (
  id            uuid primary key default gen_random_uuid(),
  email         citext unique not null,
  password_hash text not null,
  display_name  text not null,
  avatar_color  text not null default '#1a73e8',
  created_at    timestamptz not null default now(),
  last_seen_at  timestamptz
);

-- ─── Documents ────────────────────────────────────────────────────────────
create table if not exists docs.documents (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references docs.users(id) on delete cascade,
  title         text not null default 'Untitled document',
  storage_path  text not null,           -- key in the docs-files bucket
  mime_type     text not null default 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  size_bytes    bigint not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  opened_at     timestamptz not null default now()
);

create index if not exists documents_owner_idx     on docs.documents(owner_id);
create index if not exists documents_opened_at_idx on docs.documents(opened_at desc);

-- ─── Shares (per-doc access) ──────────────────────────────────────────────
create type docs.permission as enum ('read', 'write');

create table if not exists docs.shares (
  document_id uuid not null references docs.documents(id) on delete cascade,
  user_id     uuid not null references docs.users(id) on delete cascade,
  permission  docs.permission not null default 'read',
  granted_by  uuid references docs.users(id) on delete set null,
  granted_at  timestamptz not null default now(),
  primary key (document_id, user_id)
);

-- ─── WOPI access tokens (short-lived, server-issued) ──────────────────────
create table if not exists docs.wopi_tokens (
  token       text primary key,
  document_id uuid not null references docs.documents(id) on delete cascade,
  user_id     uuid not null references docs.users(id) on delete cascade,
  permission  docs.permission not null,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);

create index if not exists wopi_tokens_expires_idx on docs.wopi_tokens(expires_at);

-- ─── Locks (WOPI requires server-side lock support) ───────────────────────
create table if not exists docs.locks (
  document_id uuid primary key references docs.documents(id) on delete cascade,
  lock_value  text not null,
  user_id     uuid not null references docs.users(id) on delete cascade,
  expires_at  timestamptz not null
);

create index if not exists locks_expires_idx on docs.locks(expires_at);

-- ─── Sessions (iron-session cookies are stateless, but we also keep a last-seen) ──
create table if not exists docs.sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references docs.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null,
  user_agent  text
);

create index if not exists sessions_user_idx on docs.sessions(user_id);

-- ─── Auto-updated updated_at ──────────────────────────────────────────────
create or replace function docs.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

drop trigger if exists documents_touch on docs.documents;
create trigger documents_touch
before update on docs.documents
for each row execute function docs.touch_updated_at();

-- ─── Grants: service_role only ────────────────────────────────────────────
-- We do NOT expose the docs schema via PostgREST. All access is from
-- server-side Next.js using the service role.
grant usage on schema docs to service_role;
grant all on all tables in schema docs to service_role;
grant all on all sequences in schema docs to service_role;
alter default privileges in schema docs grant all on tables to service_role;
alter default privileges in schema docs grant all on sequences to service_role;

-- Explicitly revoke from anon and authenticated to keep the schema private.
revoke all on schema docs from anon, authenticated;
