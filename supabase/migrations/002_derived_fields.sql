-- Day 3: derived/engineered fields on colleges, computed by
-- scripts/compute-derived-fields.mjs and written back before seeding.
-- Run this in the Supabase SQL editor (Project > SQL Editor > New query),
-- after supabase/schema.sql, before running the seed script again.

alter table colleges
  add column if not exists academic_index_25 numeric,   -- school's 25th percentile, unified 0-100 scale
  add column if not exists academic_index_75 numeric,    -- school's 75th percentile, unified 0-100 scale
  add column if not exists academic_index_source text,   -- 'sat' | 'act' | 'none' — which data produced the index
  add column if not exists selectivity_index numeric,    -- 0-100, derived from admission_rate; null if not reported
  add column if not exists net_price_used integer,        -- avg_net_price, falling back to cost_of_attendance
  add column if not exists affordability_tier text;       -- 'low' | 'moderate' | 'high' | 'unknown'

comment on column colleges.academic_index_25 is
  'School''s 25th-percentile admitted-student academic index (0-100), derived from SAT or ACT bands. Null if the school reports neither (test-optional/non-reporting).';
comment on column colleges.selectivity_index is
  'Derived as 100 - admission_rate*100. Null (not estimated) when the school does not report an admission rate — see DAY3.md for why we don''t fabricate a proxy.';
comment on column colleges.affordability_tier is
  'low: net_price_used < $15k. moderate: $15k-$30k. high: >$30k. unknown: no price data reported. Thresholds are prototype approximations, not authoritative.';
