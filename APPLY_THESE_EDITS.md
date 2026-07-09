# Manual edits for Day 3

## 1. Install tsx (new dev dependency)
```bash
npm install -D tsx
```
(Used to run the shared `.ts` academic-index utility directly from the
plain-JS compute script — single source of truth instead of duplicating the
scale-conversion math.)

## 2. package.json — add these entries inside "scripts":
"compute:derived": "tsx scripts/compute-derived-fields.mjs",
"validate:colleges": "node scripts/validate-colleges.mjs",
"data:refresh": "npm run fetch:colleges && npm run compute:derived && npm run validate:colleges && npm run seed:colleges"

## 3. Drop in the files from this zip
- src/lib/academicIndex.ts (new)
- supabase/migrations/002_derived_fields.sql (new)
- scripts/compute-derived-fields.mjs (new)
- scripts/validate-colleges.mjs (new)
- .github/workflows/refresh-colleges.yml (replace — now runs compute +
  validate between fetch and seed)
- DAY3.md (new, explains the design decisions)

## 4. Run the migration
Supabase SQL editor → paste supabase/migrations/002_derived_fields.sql → Run.

## 5. Commit, push, and either wait for the next scheduled run or trigger
"Refresh College Data" manually from the Actions tab.
