/**
 * Day 5: fetches the full colleges table from Supabase and shapes it into
 * the types matching.ts expects, plus the extra display fields Day 6's
 * results UI will want (city, ownership, raw test bands, tags). Uses the
 * public anon client — the colleges table has a public-read RLS policy
 * (supabase/schema.sql), so no service role key is needed here.
 */
import collegesData from "../../data/colleges.json";
import { getSupabaseClient } from "./supabaseClient";
import type { CollegeForMatching } from "./matching";

export interface College extends CollegeForMatching {
  city: string | null;
  ownership: string | null;
  sat_reading_25: number | null;
  sat_reading_75: number | null;
  sat_math_25: number | null;
  sat_math_75: number | null;
  act_25: number | null;
  act_75: number | null;
  avg_net_price: number | null;
  retention_rate: number | null;
  completion_rate: number | null;
  academic_index_source: string | null;
  selectivity_index: number | null;
  affordability_tier: string | null;
  admission_band: string | null;
  test_optional: boolean | null;
}

const COLUMNS = [
  "id", "name", "city", "state", "ownership", "size",
  "admission_rate", "sat_reading_25", "sat_reading_75", "sat_math_25", "sat_math_75",
  "act_25", "act_75", "cost_of_attendance", "avg_net_price", "retention_rate",
  "completion_rate", "test_optional", "admission_band",
  "academic_index_25", "academic_index_75", "academic_index_source",
  "selectivity_index", "net_price_used", "affordability_tier",
].join(",");

const FALLBACK_COLLEGES = collegesData as College[];

/** Loads every school in the colleges table. If Supabase is misconfigured, fall back to the bundled local dataset. */
export async function getColleges(): Promise<College[]> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from("colleges").select(COLUMNS);
    if (error) {
      throw new Error(error.message);
    }
    return (data ?? []) as unknown as College[];
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[getColleges] Falling back to bundled data because Supabase failed: ${message}`);
    return FALLBACK_COLLEGES;
  }
}
