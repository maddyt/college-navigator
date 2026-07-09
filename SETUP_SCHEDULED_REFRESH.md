# Full Data + Scheduled Refresh — Setup

## What changed
- `scripts/fetch-colleges.mjs` (replace your existing copy) now pulls the
  entire pool of four-year, currently-operating institutions — about 2,600
  schools — instead of a 250-school stratified sample. Every school still
  gets an `admission_band` tag for reference, but nothing is downsampled.
- `.github/workflows/refresh-colleges.yml` (new file) runs the fetch + seed
  scripts automatically on the 1st of each month, and can be triggered
  manually any time from GitHub's Actions tab.

## 1. Drop in the files
Replace `scripts/fetch-colleges.mjs` and add
`.github/workflows/refresh-colleges.yml` in your repo (create the
`.github/workflows/` folder if it doesn't exist).

## 2. Add repo secrets
GitHub repo → Settings → Secrets and variables → Actions → New repository secret.
Add three:
- `COLLEGE_SCORECARD_API_KEY` — your key from https://api.data.gov/signup/
- `SUPABASE_URL` — same value as `NEXT_PUBLIC_SUPABASE_URL` in your `.env.local`
- `SUPABASE_SERVICE_ROLE_KEY` — same value as in your `.env.local`

## 3. Commit and push
```bash
git add scripts/fetch-colleges.mjs .github/workflows/refresh-colleges.yml
git commit -m "Full data pool + monthly scheduled refresh"
git push
```

## 4. Kick it off now
GitHub repo → Actions tab → "Refresh College Data" workflow → Run workflow
button. Watch the run — it should log ~27 pages fetched, then batch-by-batch
Supabase upserts. Takes a couple of minutes for the full pool.

After that, it repeats automatically on the 1st of every month — no action
needed. Since College Scorecard's underlying federal data only updates
annually, monthly is already more often than the source data actually
changes; it's there mainly so a corrected or newly-published record doesn't
sit stale for months.

## Using the table as source of truth
Once seeded, query `colleges` directly in the Supabase Table Editor (or SQL
Editor) for your own research — filter/sort by `admission_rate`,
`cost_of_attendance`, `state`, `ownership`, etc. The `admission_band` column
is precomputed so you can group by selectivity tier without recalculating it
yourself.
