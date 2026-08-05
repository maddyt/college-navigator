# Day 6 — no new dependencies, no schema changes, no secrets

Drop in / replace:
- src/lib/matching.ts (replace — rankColleges is now generic, see DAY6.md)
- src/app/actions.ts (replace — updated RankedCollege<College> typing)
- src/app/page.tsx (replace — now uses the new ResultsView)
- src/components/CollegeCard.tsx (new)
- src/components/TierSection.tsx (new)
- src/components/ResultsView.tsx (new)
- DAY6.md (new)

Then:
  npm run build   # confirm it still compiles in your real environment
  npm run dev     # click through it — try the tier filters, sort dropdown,
                   # save toggle, and the "why this estimate?" expand
