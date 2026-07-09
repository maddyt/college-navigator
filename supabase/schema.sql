-- Day 2: colleges table
-- Run this in the Supabase SQL editor (Project > SQL Editor > New query).

create table if not exists colleges (
  id                  bigint primary key,      -- College Scorecard UNITID
  name                text not null,
  city                text,
  state               text,
  ownership           text,                    -- 'public' | 'private_nonprofit'
  size                integer,                 -- undergraduate enrollment
  admission_rate      numeric,                 -- 0.0 - 1.0, null if not reported
  sat_reading_25      integer,
  sat_reading_75      integer,
  sat_math_25         integer,
  sat_math_75         integer,
  act_25              integer,
  act_75              integer,
  cost_of_attendance  integer,                 -- sticker price, academic year
  avg_net_price       integer,                 -- average net price after aid
  retention_rate      numeric,                 -- 0.0 - 1.0
  completion_rate     numeric,                 -- 0.0 - 1.0, 4yr/150% time
  test_optional       boolean default false,   -- true if no SAT/ACT data reported
  admission_band      text,                    -- stratification bucket, for reference only
  created_at          timestamptz default now()
);

-- The app only ever needs to read this table (matching runs client/server-side
-- against already-fetched rows). Writes only happen via the seed script using
-- the service role key, which bypasses RLS entirely.
alter table colleges enable row level security;

drop policy if exists "Public read access" on colleges;
create policy "Public read access"
  on colleges for select
  using (true);
