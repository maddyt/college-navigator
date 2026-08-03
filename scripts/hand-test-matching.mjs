/**
 * Day 4 hand-test: runs a handful of fictional student profiles against a
 * representative set of schools spanning selectivity tiers and data-
 * completeness edge cases, and prints the resulting tier/probability/match
 * score so the output can be sanity-checked by eye. Not an automated
 * pass/fail test — a tool to re-run whenever the algorithm changes.
 *
 * Run: npx tsx scripts/hand-test-matching.mjs
 */
import { studentAcademicIndex } from "../src/lib/academicIndex.ts";
import { rankColleges } from "../src/lib/matching.ts";

const SCHOOLS = [
  { id: 1, name: "Highly Selective Tech Institute", state: "CA", size: 7000,
    admission_rate: 0.04, academic_index_25: 93, academic_index_75: 99, net_price_used: 20000, cost_of_attendance: 82000 },
  { id: 2, name: "Elite Liberal Arts College", state: "MA", size: 1500,
    admission_rate: 0.06, academic_index_25: 91, academic_index_75: 97, net_price_used: 22000, cost_of_attendance: 79000 },
  { id: 3, name: "Selective State Flagship", state: "MI", size: 30000,
    admission_rate: 0.22, academic_index_25: 79, academic_index_75: 90, net_price_used: 18000, cost_of_attendance: 31000 },
  { id: 4, name: "Mid-Tier Private University", state: "OH", size: 4000,
    admission_rate: 0.55, academic_index_25: 62, academic_index_75: 77, net_price_used: 28000, cost_of_attendance: 52000 },
  { id: 5, name: "Regional State University", state: "TX", size: 12000,
    admission_rate: 0.75, academic_index_25: 51, academic_index_75: 69, net_price_used: 15000, cost_of_attendance: 24000 },
  { id: 6, name: "Open-Admission Regional College", state: "FL", size: 3000,
    admission_rate: 0.92, academic_index_25: null, academic_index_75: null, net_price_used: 10000, cost_of_attendance: 16000 },
  { id: 7, name: "Data-Sparse Small College", state: "NY", size: 2000,
    admission_rate: null, academic_index_25: 55, academic_index_75: 72, net_price_used: 26000, cost_of_attendance: 48000 },
  { id: 8, name: "Test-Blind Selective College", state: "VT", size: 2500,
    admission_rate: 0.35, academic_index_25: null, academic_index_75: null, net_price_used: 35000, cost_of_attendance: 68000 },
];

const PROFILES = [
  {
    label: "Strong student (3.9 GPA, 1500 SAT) — CA preference, medium size, $25k ceiling",
    academic: studentAcademicIndex({ gpa: 3.9, satTotal: 1500 }),
    prefs: { preferredStates: ["CA"], sizePreference: "medium", costCeiling: 25000 },
  },
  {
    label: "Average student (3.3 GPA, 1150 SAT) — no location pref, large size, $20k ceiling",
    academic: studentAcademicIndex({ gpa: 3.3, satTotal: 1150 }),
    prefs: { sizePreference: "large", costCeiling: 20000 },
  },
  {
    label: "Below-average student (2.8 GPA, ACT 19) — South region, no size pref, $18k ceiling",
    academic: studentAcademicIndex({ gpa: 2.8, actComposite: 19 }),
    prefs: { preferredStates: ["TX", "FL"], costCeiling: 18000 },
  },
  {
    label: "Test-optional student (3.6 GPA, no scores submitted) — small size, no cost limit",
    academic: studentAcademicIndex({ gpa: 3.6 }),
    prefs: { sizePreference: "small" },
  },
  {
    label: "Weak GPA, strong test (2.9 GPA, 1480 SAT) — no preferences stated",
    academic: studentAcademicIndex({ gpa: 2.9, satTotal: 1480 }),
    prefs: {},
  },
];

for (const profile of PROFILES) {
  console.log("=".repeat(100));
  console.log(profile.label);
  console.log(
    `  academic index: ${profile.academic.index?.toFixed(1) ?? "null"} (source: ${profile.academic.source}, gpaIndex: ${profile.academic.gpaIndex?.toFixed(1)}, testIndex: ${profile.academic.testIndex?.toFixed(1) ?? "null"})`
  );
  console.log("-".repeat(100));

  const ranked = rankColleges(profile.academic.index, profile.prefs, SCHOOLS);
  for (const r of ranked) {
    const p = r.probabilityResult;
    const m = r.matchResult;
    console.log(
      `  [${p.tier.toUpperCase().padEnd(7)}] ${r.name.padEnd(32)} ` +
      `prob=${p.probability != null ? Math.round(p.probability * 100) + "%" : "n/a"}`.padEnd(12) +
      `match=${m.score.toFixed(0).padStart(3)}  (${p.basis})`
    );
    console.log(`            ${p.explanation}`);
  }
  console.log();
}
