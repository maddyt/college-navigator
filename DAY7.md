# Day 7 — Detail View + Compare

## What's new
- `src/components/CollegeDetailModal.tsx` (new) — full stat deep-dive for
  one school: your personalized tier/probability/match (already computed,
  no refetch needed) plus admissions, cost, and outcome stats.
- `src/components/CompareModal.tsx` (new) — side-by-side table for up to 4
  saved schools at once: tier, probability, match score, location, size,
  admit rate, test range, cost, retention, completion.
- `CollegeCard.tsx` / `TierSection.tsx` — wired up a "Full details" button
  and pass-through props to open the detail modal.
- `ResultsView.tsx` — owns the modal state (`detailCollegeId`,
  `compareOpen`) and adds a "Compare saved (N)" button, disabled below 2
  saved schools.

## Scoping decision: modals, not routes
The blueprint describes a dedicated "College Detail Page" as its own
screen. I built it as a client-side modal instead of a real
`/colleges/[id]` route, for a concrete reason: saved schools and the
student's computed probability/match only exist as in-memory React state
right now — there's no session or account layer to carry that state across
a page navigation. A separate route would either need to re-fetch and
recompute everything from scratch (duplicating Day 5/6 logic) or pass the
whole profile through the URL. A modal reuses the data that's already
sitting in memory, which is the more honest solution for where the
prototype actually is architecturally. If Day 8+ adds real accounts/session
persistence, converting these to real routes becomes straightforward.

## Compare is capped at 4
Matches the original blueprint's own compare view spec ("side-by-side of up
to 4 saved schools"). Beyond 4, the table shows the first 4 saved (by save
order) and tells you how many are hidden, rather than silently truncating.

## How this was tested
- Full `npx tsc --noEmit` and `npm run build` — both clean.
- Server-rendered both modals directly (`react-dom/server`) against 10
  targeted cases, without a browser: a SAT-reporting school (verified the
  combined SAT range math is actually correct, not just present), an
  ACT-only school, and a school with every field null (the real edge case —
  confirmed it renders "Test-optional / not reported" instead of crashing
  on null arithmetic), the compare table's "fewer than 2 saved" prompt, a
  3-school compare with mixed SAT/ACT/no-data schools rendering correctly
  side by side, and the 5-saved overflow case — confirmed the cap message
  appears and the 5th school is actually excluded, not just visually
  truncated.

What still needs your machine: clicking through the actual modal
interactions (open, close via backdrop/Escape/button, save-then-compare
flow) in a real browser — the render tests confirm correctness of content,
not interactivity.

---
Next: Day 8 — polish pass (mobile responsiveness, loading/empty states,
disclaimers) before your own end-to-end test, per the build plan.
