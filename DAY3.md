# Day 3 — Derived Fields & Data Quality Gate

## What's new
- `src/lib/academicIndex.ts` — shared conversion putting SAT/ACT onto one
  0-100 scale (used later by Day 4's matching algorithm too, so the school
  side and student side are always comparable on the same number line).
- `supabase/migrations/002_derived_fields.sql` — adds `academic_index_25`,
  `academic_index_75`, `academic_index_source`, `selectivity_index`,
  `net_price_used`, and `affordability_tier` columns to `colleges`.
- `scripts/compute-derived-fields.mjs` — reads `data/colleges.json` (from
  the fetch step), computes those derived fields, writes it back enriched.
  No network/keys needed — pure local computation.
- `scripts/validate-colleges.mjs` — data quality gate. Reports completeness
  per field and flags real anomalies (admission rate outside 0-1, SAT/ACT
  25th > 75th percentile, duplicate or missing IDs/names). A small number of
  anomalies (≤0.5% of records, min 5) is just noted; past that, it fails
  hard so bad data never reaches Supabase.
- Full pipeline is now one command: `npm run data:refresh` (fetch → compute
  → validate → seed), and the GitHub Actions workflow runs the same four
  steps in order.

## Two honesty calls worth knowing about
- **`selectivity_index` is `null`, not estimated, when a school doesn't
  report an admission rate.** I could have derived a proxy from test scores,
  but that would be fabricating a number for a school that didn't publish
  one — against the whole "every number should be explainable in one
  sentence" principle from the build plan. Better to show "not reported"
  than a confident-looking guess.
- **`affordability_tier` thresholds ($15k/$30k) are prototype
  approximations**, not a researched standard — flagged in the SQL comment
  so future-you doesn't mistake them for authoritative.

## Apply it
1. Run `supabase/migrations/002_derived_fields.sql` in the Supabase SQL
   editor (after `schema.sql`, before re-seeding).
2. `npm install` (adds `tsx`, used to run the `.ts` conversion utility
   directly from a plain script).
3. Add the two new repo secrets are already covered by Day 2 — nothing new
   needed there.
4. Push, then either wait for the next scheduled run or trigger "Refresh
   College Data" manually from the Actions tab — it now runs compute +
   validate automatically before seeding.

## Tested without live data
Same constraint as Day 2 — no live network/Supabase access from my sandbox.
I validated both scripts against a 5-school fixture covering every edge case
(SAT-only, ACT-only, test-optional, no reported admission rate, and a
deliberately corrupted record), confirming: correct index source selection,
null-not-fabricated selectivity for non-reporting schools, correct
affordability fallback to sticker price when net price is missing, and that
validation correctly passes small anomaly counts but hard-fails on
duplicate IDs and missing names. I also ran the actual `npm run
compute:derived` and `npm run validate:colleges` commands (not just the
fixture) against a realistic 2,637-school dataset shaped like the real
fetch output, end to end, inside the real project — both completed cleanly.

---
Next: Day 4 — the matching and probability-tier algorithm itself, which is
where a student's own academic index finally gets compared against these
per-school bands.
