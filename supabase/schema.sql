-- Tambua ID registry tables. Run this in the Supabase SQL editor, then set
-- SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local (server-side only).
-- The app seeds example records on first start when the tables are empty.

create table if not exists residents     (key text primary key, data jsonb not null, updated_at timestamptz not null default now());
create table if not exists applications  (key text primary key, data jsonb not null, updated_at timestamptz not null default now());
create table if not exists payments      (key text primary key, data jsonb not null, updated_at timestamptz not null default now());
create table if not exists verify_events (key text primary key, data jsonb not null, updated_at timestamptz not null default now());

-- Lock the tables down. Only the service role key (used on the server) can read or write.
alter table residents     enable row level security;
alter table applications  enable row level security;
alter table payments      enable row level security;
alter table verify_events enable row level security;

create index if not exists applications_uin_idx on applications ((data->>'uin'));
create index if not exists verify_events_uin_idx on verify_events ((data->>'uin'));
