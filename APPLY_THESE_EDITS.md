# Day 5 — no new dependencies, no schema changes, no secrets

Just drop in:
- src/lib/getColleges.ts (new)
- src/lib/states.ts (new)
- src/lib/supabaseClient.ts (replace — lazy-init bug fix, see DAY5.md)
- src/app/actions.ts (new)
- src/app/page.tsx (replace — now the real onboarding form)
- DAY5.md (new)

Then run it for real:
  npm run dev
Open http://localhost:3000, fill out the form, and submit. This is the part
I couldn't test myself (no live Supabase project in my sandbox) — if
colleges were seeded correctly in Day 2/3, you should see a ranked list
appear below the form.
