# Day 5 — Onboarding UI

## What's new
- `src/lib/getColleges.ts` (new) — fetches the full `colleges` table via the
  public anon client (RLS already allows public read from Day 2's schema).
  Column list is cross-checked field-by-field against `schema.sql` and
  `002_derived_fields.sql` so nothing is silently missing.
- `src/lib/states.ts` (new) — static US state list for the preference picker.
- `src/app/actions.ts` (new) — a Next.js Server Action bridging the form to
  Day 4's algorithm: validates input, computes `studentAcademicIndex()`,
  loads colleges, calls `rankColleges()`, returns a typed
  `{ ok: true, ... } | { ok: false, error }` result. Runs entirely
  server-side — no Supabase logic ships to the browser bundle.
- `src/app/page.tsx` (replaced) — the actual onboarding form: GPA, optional
  SAT/ACT, preferred states (checkbox grid), campus size preference, cost
  ceiling, and three priority sliders (location/size/affordability). On
  submit it calls the server action and renders results inline.
- `src/lib/supabaseClient.ts` (replaced — see bug fix below).

## A real bug this caught
The original Day 1 `supabaseClient.ts` threw at **module import time** if
env vars were missing. That seemed fine in isolation, but when Day 5 wired
it into a server action, the crash happened during the `import` itself —
*before* the server action's try/catch ever ran. A misconfigured deploy
would have 500'd the whole page instead of showing a clean error message.
Fixed by making the client lazy (`getSupabaseClient()`, created and
validated only when actually called). Confirmed the fix with a direct test:
calling the server action with no env vars now returns
`{ ok: false, error: "Missing Supabase env vars..." }` instead of crashing
the process. This is exactly the kind of thing that's easy to miss until
something actually calls the code path — worth knowing about since it's a
one-line-look-innocent bug with a real production consequence.

## Scoping decisions
- **State preference is a checkbox grid over all 50 states**, not a fancier
  multi-select or map picker. Functional, not pretty — fine for testing the
  concept, and easy to upgrade later without touching the matching logic.
- **GPA is unweighted-only in the UI** (0.0–4.0). `studentAcademicIndex()`
  already supports a custom `gpaScale` for weighted GPAs, but exposing that
  choice in the form adds a decision point that doesn't matter for a first
  test session — deferred, not forgotten.
- **The results view here is intentionally plain** — a sorted list with a
  tier badge, probability, match score, and the one-sentence explanation.
  Day 6 replaces this with real card UI, filters, and a compare view. This
  version exists so the algorithm is actually reachable end to end before
  that polish work happens — useful in its own right for your own testing
  even before Day 6.

## How this was tested
No live Supabase project in my sandbox, same constraint as every prior day.
What I did verify directly:
- Full `npx tsc --noEmit` across the whole app — clean.
- Full `npm run build` (production build) — succeeds.
- Called the server action directly (bypassing the browser) with an invalid
  GPA → correctly rejected before touching Supabase.
- Called it again with valid input and no env vars configured → this is
  what surfaced the import-time-crash bug above, and confirms the fix
  produces a clean error instead of a crash.
- Cross-referenced every column name in `getColleges.ts`'s query against
  the exact columns added in Day 2's `schema.sql` and Day 3's
  `002_derived_fields.sql` migration.

What still needs your machine: the actual browser round trip (filling out
the form, submitting, seeing real ranked schools from your seeded Supabase
data) — I can't click through a UI or hit your live database from here.
Worth doing that check yourself before Day 6.

---
Next: Day 6 — real results UI (cards, filters, compare view) replacing the
plain list above.
