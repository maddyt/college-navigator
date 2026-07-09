/**
 * Day 2: reads data/colleges.json and upserts it into the Supabase `colleges`
 * table using the service role key (bypasses RLS — never expose this key to
 * the browser or commit it).
 *
 * Run locally:
 *   node --env-file=.env.local scripts/seed-colleges.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  try {
    const dotenv = await import("dotenv");
    dotenv.config({ path: ".env.local" });
  } catch {
    // ignore
  }
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local.\n" +
    "Get the service role key from Supabase: Project Settings > API > service_role secret.\n" +
    "(This key is server-only — it must never be prefixed NEXT_PUBLIC_ and never committed.)"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
  const dataPath = path.join(__dirname, "..", "data", "colleges.json");
  if (!fs.existsSync(dataPath)) {
    console.error(`No data file at ${dataPath}. Run fetch-colleges.mjs first.`);
    process.exit(1);
  }

  const colleges = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  console.log(`Seeding ${colleges.length} colleges into Supabase...`);

  const BATCH_SIZE = 100;
  let inserted = 0;
  for (let i = 0; i < colleges.length; i += BATCH_SIZE) {
    const batch = colleges.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("colleges").upsert(batch, { onConflict: "id" });
    if (error) {
      console.error(`Batch starting at ${i} failed:`, error.message);
      process.exit(1);
    }
    inserted += batch.length;
    console.log(`  upserted ${inserted}/${colleges.length}`);
  }

  console.log(`\n✓ Seed complete. ${inserted} colleges are live in Supabase.`);
}

main().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
