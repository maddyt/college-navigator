# Day 4 — nothing to configure

No new dependencies, no schema changes, no secrets. Just drop in:
- src/lib/academicIndex.ts (replace — adds studentAcademicIndex())
- src/lib/matching.ts (new)
- scripts/hand-test-matching.mjs (new)
- DAY4.md (new)

Then try it:
npx tsx scripts/hand-test-matching.mjs
