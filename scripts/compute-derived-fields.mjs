/**
 * Day 3: reads data/colleges.json (written by fetch-colleges.mjs) and adds
 * derived/engineered fields to each record — academic_index_25/75,
 * selectivity_index, net_price_used, and affordability_tier — writing the
 * enriched records back to the same file. Run this between fetch and seed:
 *
 *   node scripts/fetch-colleges.mjs
 *   npx tsx scripts/compute-derived-fields.mjs
 *   node --env-file=.env.local scripts/seed-colleges.mjs
 *
 * No env vars or network access needed — pure local computation.
 * Requires supabase/migrations/002_derived_fields.sql to have been run
 * first, so the new columns exist before seeding.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { schoolAcademicIndexFromPercentiles } from "../src/lib/academicIndex.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(__dirname, "..", "data", "colleges.json");

// Approximate, documented thresholds — not authoritative. See migration comment.
const AFFORDABILITY_THRESHOLDS = { low: 15000, moderate: 30000 };

function affordabilityTier(netPrice) {
  if (netPrice == null) return "unknown";
  if (netPrice < AFFORDABILITY_THRESHOLDS.low) return "low";
  if (netPrice < AFFORDABILITY_THRESHOLDS.moderate) return "moderate";
  return "high";
}

function selectivityIndex(admissionRate) {
  // Deliberately null (not estimated) when the school doesn't report an
  // admission rate, rather than fabricating a proxy from test scores —
  // keeps every number traceable to real reported data.
  if (admissionRate == null) return null;
  return Math.round((100 - admissionRate * 100) * 10) / 10;
}

function enrich(school) {
  const { academic_index_25, academic_index_75, source } = schoolAcademicIndexFromPercentiles({
    sat_reading_25: school.sat_reading_25,
    sat_reading_75: school.sat_reading_75,
    sat_math_25: school.sat_math_25,
    sat_math_75: school.sat_math_75,
    act_25: school.act_25,
    act_75: school.act_75,
  });

  const netPriceUsed = school.avg_net_price ?? school.cost_of_attendance ?? null;

  return {
    ...school,
    academic_index_25,
    academic_index_75,
    academic_index_source: source,
    selectivity_index: selectivityIndex(school.admission_rate),
    net_price_used: netPriceUsed,
    affordability_tier: affordabilityTier(netPriceUsed),
  };
}

function main() {
  if (!fs.existsSync(dataPath)) {
    console.error(`No data file at ${dataPath}. Run fetch-colleges.mjs first.`);
    process.exit(1);
  }

  const colleges = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  const enriched = colleges.map(enrich);

  const sourceCounts = {};
  const tierCounts = {};
  for (const s of enriched) {
    sourceCounts[s.academic_index_source] = (sourceCounts[s.academic_index_source] ?? 0) + 1;
    tierCounts[s.affordability_tier] = (tierCounts[s.affordability_tier] ?? 0) + 1;
  }

  console.log(`Enriched ${enriched.length} schools.`);
  console.log("Academic index source:", sourceCounts);
  console.log("Affordability tier:", tierCounts);

  fs.writeFileSync(dataPath, JSON.stringify(enriched, null, 2));
  console.log(`\n✓ Wrote enriched data back to ${path.relative(process.cwd(), dataPath) || dataPath}`);
  console.log("Next: node scripts/validate-colleges.mjs");
}

main();
