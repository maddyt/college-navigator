/**
 * Pulls the full pool of four-year, currently-operating institutions from the
 * College Scorecard API (~2,600 schools) and writes them to data/colleges.json.
 * Each record is tagged with an admission_band (its admission-rate bucket) for
 * reference/analysis — no downsampling happens here anymore; every school the
 * API returns for the filter goes into the table.
 *
 * Run locally (needs real internet access + a free key from https://api.data.gov/signup/):
 *   node --env-file=.env.local scripts/fetch-colleges.mjs
 *
 * In CI (GitHub Actions), env vars are injected directly — see
 * .github/workflows/refresh-colleges.yml — so no .env.local is needed there.
 *
 * Output: data/colleges.json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Load .env.local if it hasn't been loaded already (e.g. via --env-file, or CI secrets)
if (!process.env.COLLEGE_SCORECARD_API_KEY) {
  try {
    const dotenv = await import("dotenv");
    dotenv.config({ path: ".env.local" });
  } catch {
    // dotenv not installed / not needed if env already set
  }
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_KEY = process.env.COLLEGE_SCORECARD_API_KEY || "DEMO_KEY";
const BASE_URL = "https://api.data.gov/ed/collegescorecard/v1/schools.json";

if (API_KEY === "DEMO_KEY") {
  console.warn(
    "⚠ No COLLEGE_SCORECARD_API_KEY set — falling back to DEMO_KEY, which is rate-limited " +
    "to ~30 requests/hour. Pulling the full ~2,600-school pool needs ~27 requests, which DEMO_KEY " +
    "can just barely do in one run, but get a free key at https://api.data.gov/signup/ for headroom " +
    "and for the scheduled monthly refresh."
  );
}

const FIELDS = [
  "id",
  "school.name",
  "school.city",
  "school.state",
  "school.ownership",
  "school.degrees_awarded.predominant",
  "school.operating",
  "latest.student.size",
  "latest.admissions.admission_rate.overall",
  "latest.admissions.sat_scores.25th_percentile.critical_reading",
  "latest.admissions.sat_scores.75th_percentile.critical_reading",
  "latest.admissions.sat_scores.25th_percentile.math",
  "latest.admissions.sat_scores.75th_percentile.math",
  "latest.admissions.act_scores.25th_percentile.cumulative",
  "latest.admissions.act_scores.75th_percentile.cumulative",
  "latest.cost.attendance.academic_year",
  "latest.cost.avgnetprice.overall",
  "latest.student.retention_rate.four_year.full_time",
  "latest.completion.completion_rate_4yr_150nt",
].join(",");

/** Pull one page of results from the API. */
async function fetchPage(page, perPage = 100) {
  const url = new URL(BASE_URL);
  url.searchParams.set("api_key", API_KEY);
  url.searchParams.set("fields", FIELDS);
  url.searchParams.set("per_page", String(perPage));
  url.searchParams.set("page", String(page));
  // Predominantly bachelor's-degree-granting, currently operating institutions.
  url.searchParams.set("school.degrees_awarded.predominant", "3");
  url.searchParams.set("school.operating", "1");

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`College Scorecard API error ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

/** Normalize one raw API record into our colleges table shape. */
function normalize(raw) {
  const ownershipMap = { 1: "public", 2: "private_nonprofit", 3: "private_forprofit" };
  const admissionRate = raw["latest.admissions.admission_rate.overall"] ?? null;
  const satR25 = raw["latest.admissions.sat_scores.25th_percentile.critical_reading"] ?? null;
  const satR75 = raw["latest.admissions.sat_scores.75th_percentile.critical_reading"] ?? null;
  const satM25 = raw["latest.admissions.sat_scores.25th_percentile.math"] ?? null;
  const satM75 = raw["latest.admissions.sat_scores.75th_percentile.math"] ?? null;
  const act25 = raw["latest.admissions.act_scores.25th_percentile.cumulative"] ?? null;
  const act75 = raw["latest.admissions.act_scores.75th_percentile.cumulative"] ?? null;

  return {
    id: raw.id,
    name: raw["school.name"],
    city: raw["school.city"] ?? null,
    state: raw["school.state"] ?? null,
    ownership: ownershipMap[raw["school.ownership"]] ?? null,
    size: raw["latest.student.size"] ?? null,
    admission_rate: admissionRate,
    sat_reading_25: satR25,
    sat_reading_75: satR75,
    sat_math_25: satM25,
    sat_math_75: satM75,
    act_25: act25,
    act_75: act75,
    cost_of_attendance: raw["latest.cost.attendance.academic_year"] ?? null,
    avg_net_price: raw["latest.cost.avgnetprice.overall"] ?? null,
    retention_rate: raw["latest.student.retention_rate.four_year.full_time"] ?? null,
    completion_rate: raw["latest.completion.completion_rate_4yr_150nt"] ?? null,
    test_optional: satR25 === null && satM25 === null && act25 === null,
  };
}

/** Which admission-rate band a school falls into (kept for reference/analysis). */
function bandFor(admissionRate) {
  if (admissionRate === null || admissionRate === undefined) return "unknown";
  if (admissionRate < 0.10) return "under_10";
  if (admissionRate < 0.25) return "10_25";
  if (admissionRate < 0.40) return "25_40";
  if (admissionRate < 0.60) return "40_60";
  if (admissionRate < 0.80) return "60_80";
  return "over_80";
}

async function main() {
  console.log(`Fetching full college pool from College Scorecard (key: ${API_KEY === "DEMO_KEY" ? "DEMO_KEY" : "custom"})...`);

  const pool = [];
  const seen = new Set();
  const MAX_PAGES = 40; // 40 * 100 = up to 4,000 — comfortably covers the ~2,600 four-year pool
  for (let page = 0; page < MAX_PAGES; page++) {
    const data = await fetchPage(page);
    const results = data.results ?? [];
    if (results.length === 0) break;

    for (const raw of results) {
      const school = normalize(raw);
      if (seen.has(school.id)) continue; // defensive de-dupe across pages
      seen.add(school.id);
      school.admission_band = bandFor(school.admission_rate);
      pool.push(school);
    }

    console.log(`  page ${page}: ${results.length} records (pool: ${pool.length})`);
    if (data.metadata?.total && pool.length >= data.metadata.total) break;
  }

  const bandCounts = {};
  for (const school of pool) bandCounts[school.admission_band] = (bandCounts[school.admission_band] ?? 0) + 1;
  console.log("\nFull pool by admission-rate band:");
  for (const [band, count] of Object.entries(bandCounts)) console.log(`  ${band}: ${count}`);

  const outPath = path.join(__dirname, "..", "data", "colleges.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(pool, null, 2));

  console.log(`\n✓ Wrote ${pool.length} schools to ${path.relative(process.cwd(), outPath) || outPath}`);
  console.log("Next: node --env-file=.env.local scripts/seed-colleges.mjs");
}

main().catch((err) => {
  console.error("Fetch failed:", err.message);
  process.exit(1);
});
