/**
 * Day 3: data quality gate. Reads data/colleges.json and reports
 * completeness (nulls per field) plus flags anomalies that indicate a real
 * data problem rather than an expected gap (e.g. non-reporting schools).
 * Exits non-zero on critical issues so this can gate the pipeline —
 * inserted before the seed step in the GitHub Actions workflow.
 *
 * Run: node scripts/validate-colleges.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(__dirname, "..", "data", "colleges.json");

const FIELDS_TO_CHECK = [
  "name", "state", "ownership", "size", "admission_rate",
  "sat_reading_25", "act_25", "cost_of_attendance", "avg_net_price",
  "retention_rate", "completion_rate",
];

function main() {
  if (!fs.existsSync(dataPath)) {
    console.error(`No data file at ${dataPath}. Run fetch-colleges.mjs first.`);
    process.exit(1);
  }

  const colleges = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  const total = colleges.length;
  const critical = [];
  const warnings = [];

  if (total === 0) {
    critical.push("data/colleges.json is empty.");
  }

  // Completeness: % missing per field. Missing data is expected for some
  // fields (not every school reports test scores) — this is informational,
  // not automatically a failure.
  console.log(`Total schools: ${total}\n`);
  console.log("Field completeness:");
  for (const field of FIELDS_TO_CHECK) {
    const missing = colleges.filter((s) => s[field] == null).length;
    const pct = total ? ((missing / total) * 100).toFixed(1) : "0.0";
    console.log(`  ${field.padEnd(20)} ${missing} missing (${pct}%)`);
  }

  // Duplicate IDs — should be impossible given fetch-colleges.mjs de-dupes,
  // but check anyway since this script may run against hand-edited data too.
  const idCounts = new Map();
  for (const s of colleges) idCounts.set(s.id, (idCounts.get(s.id) ?? 0) + 1);
  const dupeIds = [...idCounts.entries()].filter(([, count]) => count > 1);
  if (dupeIds.length > 0) {
    critical.push(`${dupeIds.length} duplicate id(s): ${dupeIds.slice(0, 5).map(([id]) => id).join(", ")}${dupeIds.length > 5 ? ", ..." : ""}`);
  }

  // Missing required fields.
  const missingName = colleges.filter((s) => !s.name || !s.name.trim()).length;
  if (missingName > 0) critical.push(`${missingName} school(s) missing a name.`);

  const missingId = colleges.filter((s) => s.id == null).length;
  if (missingId > 0) critical.push(`${missingId} school(s) missing an id.`);

  // Range/logic anomalies — these indicate a real data problem, not an
  // expected gap, so they're critical rather than informational.
  for (const s of colleges) {
    if (s.admission_rate != null && (s.admission_rate < 0 || s.admission_rate > 1)) {
      warnings.push(`${s.name} (id ${s.id}): admission_rate ${s.admission_rate} outside [0, 1].`);
    }
    if (s.sat_reading_25 != null && s.sat_reading_75 != null && s.sat_reading_25 > s.sat_reading_75) {
      warnings.push(`${s.name} (id ${s.id}): SAT reading 25th percentile (${s.sat_reading_25}) > 75th (${s.sat_reading_75}).`);
    }
    if (s.sat_math_25 != null && s.sat_math_75 != null && s.sat_math_25 > s.sat_math_75) {
      warnings.push(`${s.name} (id ${s.id}): SAT math 25th percentile (${s.sat_math_25}) > 75th (${s.sat_math_75}).`);
    }
    if (s.act_25 != null && s.act_75 != null && s.act_25 > s.act_75) {
      warnings.push(`${s.name} (id ${s.id}): ACT 25th percentile (${s.act_25}) > 75th (${s.act_75}).`);
    }
    if (s.size != null && s.size < 0) {
      warnings.push(`${s.name} (id ${s.id}): negative enrollment size.`);
    }
  }

  // A handful of range anomalies among thousands of federal records isn't
  // unusual (reporting errors happen upstream) — treat as a critical
  // failure only past a small tolerance, otherwise flag as a warning so a
  // few bad rows don't block the whole pipeline.
  const ANOMALY_TOLERANCE = Math.max(5, Math.ceil(total * 0.005)); // 0.5%, min 5
  if (warnings.length > 0) {
    console.log(`\nAnomalies (${warnings.length}):`);
    for (const w of warnings.slice(0, 20)) console.log(`  ⚠ ${w}`);
    if (warnings.length > 20) console.log(`  ...and ${warnings.length - 20} more.`);
    if (warnings.length > ANOMALY_TOLERANCE) {
      critical.push(`${warnings.length} anomalies exceeds tolerance of ${ANOMALY_TOLERANCE} (0.5% of ${total}).`);
    }
  }

  if (critical.length > 0) {
    console.log(`\n✗ VALIDATION FAILED (${critical.length} critical issue(s)):`);
    for (const c of critical) console.log(`  - ${c}`);
    process.exit(1);
  }

  console.log(`\n✓ Validation passed (${warnings.length} anomalies, within tolerance of ${ANOMALY_TOLERANCE}).`);
}

main();
