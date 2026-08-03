# Day 4 — Matching & Probability Algorithm

## What's new
- `src/lib/academicIndex.ts` — added `studentAcademicIndex()`. GPA and test
  score are weighted 50/50 when both are present (simple, explainable split
  — not a fitted weighting). Test-optional students are scored on GPA alone,
  never penalized or given a fabricated test estimate.
- `src/lib/matching.ts` (new) — the core algorithm:
  - `probabilityEstimate()` — compares the student's index to the school's
    `academic_index_25/75` band, then adjusts the school's own baseline
    admission rate up or down with a logistic curve centered on the band's
    midpoint. At the midpoint, the estimate equals the published admit
    rate; further above/below moves it, capped at 2%-98% so it never claims
    false certainty.
  - `matchScore()` — weighted fit across location (state/region), size, and
    affordability, with user-adjustable priority weights. Drives ordering
    *within* a tier — this is what makes the list feel personalized rather
    than just sorted by admit chance.
  - `rankColleges()` — ties both together: tags every school, sorts by tier
    (safety → match → reach → unknown), then by match score within tier.
    This is the function the Day 5 UI calls directly.
- `scripts/hand-test-matching.mjs` — a keepable sanity-check tool (not a
  pass/fail test suite) you can re-run any time you tweak the formulas:
  `npx tsx scripts/hand-test-matching.mjs`.

## Three scoping decisions worth knowing about
1. **Major/program-strength matching is deferred.** The blueprint's
   content-based filtering also weighs intended major against program
   strength data. We haven't ingested any program-level data (College
   Scorecard has it, but it's a separate, heavier integration), so
   `matchScore()` only covers location, size, and affordability for now.
2. **Graceful fallback ladder for missing data**, always erring toward
   honesty over a confident-looking guess:
   - Both student and school have test-score data → full academic-index
     comparison.
   - Either side is missing test data but the school reports an admit rate
     → show that admit rate directly, labeled `admission_rate_only`.
   - Neither is available → `insufficient_data`, probability is `null`,
     tier is `unknown`. Never fabricated.
3. **A sub-40%-baseline-admit-rate school is a Reach for most students by
   definition**, even ones near that school's own academic midpoint — this
   isn't a bug. A student needs to sit meaningfully above the midpoint
   (roughly a full band-width, for a ~20% admit-rate school) before the
   estimate crosses into Match territory. This matches how selective
   admissions actually work and was confirmed by hand-checking the
   arithmetic in the test output below.

## How this was tested
No live data involved — this is pure logic, hand-tested (not just unit
tested) against 5 fictional student profiles (strong, average,
below-average, test-optional, and a "weak GPA/strong test" outlier to check
the 50/50 blend) run against 8 schools spanning the full selectivity range
plus every missing-data edge case (test-optional school, no-admission-rate-
reported school, test-blind-but-rate-known school). I manually re-derived
the match-score arithmetic for several rows by hand and confirmed it matched
the printed output exactly, and spot-checked that tier/probability results
track intuition throughout (e.g., strong students land Safety at
high-baseline schools and Reach at sub-5%-admit schools; below-average
students land Reach almost everywhere except open-admission schools).

---
Next: Day 5 — the onboarding UI that collects a real student profile and
feeds it into `rankColleges()`.
