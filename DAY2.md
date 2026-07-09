# Day 2 — Real College Data

Schema and scripts are written and logic-tested (see note below on how, since I
couldn't hit the live API from my sandbox). These steps run on your machine.

## 1. Create the table
Supabase dashboard → SQL Editor → New query → paste the contents of
`supabase/schema.sql` → Run.

## 2. Get a real College Scorecard API key
Free, instant: https://api.data.gov/signup/. Add it to `.env.local`:
```
COLLEGE_SCORECARD_API_KEY=your-real-key
```
(Without this it silently falls back to `DEMO_KEY`, which is capped at ~30
requests/hour — the fetch script needs about 4, so DEMO_KEY will actually work
for a single run, but get a real key if you plan to re-run it.)

## 3. Get your Supabase service role key
Project Settings → API → `service_role` secret. Add it to `.env.local`:
```
SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret
```
This key bypasses row-level security — it's used only by the seed script,
never by the app, and is already gitignored.

## 4. Pull and seed the data
```bash
npm install
npm run fetch:colleges   # writes data/colleges.json (~250 schools)
npm run seed:colleges    # upserts them into Supabase
```
You should see batch-by-batch progress and a final "Seed complete" line.
Spot-check in Supabase: Table Editor → colleges → should show ~250 rows.

## What's in the data
~250 four-year, public/private-nonprofit institutions, stratified across
admission-rate bands (under 10% up to over 80%, plus a bucket for schools that
don't report admission stats) so any student profile gets a plausible
safety/match/reach spread instead of a random or lopsided sample. Fields:
admission rate, SAT/ACT 25th–75th percentiles, cost of attendance, average net
price, size, retention rate, completion rate, and a `test_optional` flag for
schools with no reported test-score data.

## How this was tested without live network access
My sandbox's network allowlist blocks `api.data.gov` (and most non-package-registry
domains), so I couldn't run the real API call here. Instead I validated the
actual logic — pagination, field normalization, band bucketing, stratified
sampling, and the Supabase upsert batching — against a mocked API response
covering all seven admission-rate bands, confirming: exact target counts per
band (250 total), no duplicate IDs, correct `test_optional` detection, and
clean batch-by-batch upserts. The code paths are exercised end to end; only
the live HTTP call to the real API is untested until you run it.

---
Once seeded, Day 3 moves to derived features (academic index bands,
affordability tier) and the matching/probability algorithm itself.
