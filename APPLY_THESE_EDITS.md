# Day 7 — no new dependencies, no schema changes, no secrets

Drop in / replace:
- src/components/CollegeDetailModal.tsx (new)
- src/components/CompareModal.tsx (new)
- src/components/CollegeCard.tsx (replace — adds "Full details" button)
- src/components/TierSection.tsx (replace — passes onViewDetails through)
- src/components/ResultsView.tsx (replace — owns modal state + compare trigger)
- DAY7.md (new)

Then:
  npm run build   # confirm it still compiles in your real environment
  npm run dev     # save 2+ schools, try "Compare saved", open "Full details"
                   # on a card, and confirm Escape/backdrop-click close both
