/**
 * Day 4: the probability-tier estimator and match-score function described
 * in Section 4 of the build plan. Both are deliberately transparent
 * heuristics — every number here should be explainable in one sentence,
 * per the project's own design principle — not a trained ML model. See
 * DAY4.md for the reasoning behind each formula and its limitations.
 */

export type Tier = "safety" | "match" | "reach" | "unknown";
export type ProbabilityBasis = "academic_index" | "admission_rate_only" | "insufficient_data";

export interface CollegeForMatching {
  id: number;
  name: string;
  state: string | null;
  size: number | null;
  admission_rate: number | null;
  academic_index_25: number | null;
  academic_index_75: number | null;
  net_price_used: number | null;
  cost_of_attendance: number | null;
}

export interface ProbabilityResult {
  probability: number | null; // 0-1
  tier: Tier;
  basis: ProbabilityBasis;
  explanation: string;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function tierFromProbability(probability: number): Tier {
  if (probability >= 0.7) return "safety";
  if (probability >= 0.4) return "match";
  return "reach";
}

/**
 * Estimates admission probability by comparing a student's academic index
 * to a school's admitted-student band, then adjusting the school's own
 * baseline admission rate up or down with a logistic curve centered on the
 * band's midpoint. At exactly the midpoint, the estimate equals the
 * school's published admit rate — the further above or below, the more the
 * estimate diverges from that baseline, capped so it never claims near-0%
 * or near-100% certainty.
 *
 * Falls back gracefully when data is missing:
 * - No academic index on either side (test-optional student or
 *   non-reporting school), but the school does publish an admit rate ->
 *   use that admit rate directly as the estimate ("admission_rate_only").
 * - Neither an index nor an admit rate is available -> honestly report
 *   that there isn't enough data, rather than guessing.
 */
export function probabilityEstimate(
  studentIndex: number | null,
  school: Pick<CollegeForMatching, "name" | "admission_rate" | "academic_index_25" | "academic_index_75">
): ProbabilityResult {
  const { admission_rate, academic_index_25, academic_index_75, name } = school;

  const hasAcademicComparison = studentIndex != null && academic_index_25 != null && academic_index_75 != null;

  if (hasAcademicComparison && admission_rate != null) {
    const mid = (academic_index_25! + academic_index_75!) / 2;
    const spread = Math.max(academic_index_75! - academic_index_25!, 5); // avoid divide-by-near-zero
    const z = (studentIndex! - mid) / spread;

    // Logistic multiplier centered at 1.0 when z = 0 (student at the school's
    // midpoint), ranging toward 0 (far below) or 2 (far above). k=1.5 is a
    // moderate steepness — chosen so a student a full band-width above or
    // below the midpoint moves the estimate substantially without being a
    // step function.
    const k = 1.5;
    const multiplier = 2 / (1 + Math.exp(-k * z));
    const probability = clamp(admission_rate * multiplier, 0.02, 0.98);
    const tier = tierFromProbability(probability);

    const diff = Math.round(studentIndex! - mid);
    const direction = diff >= 0 ? "above" : "below";
    const explanation =
      `Your academic index is ${Math.abs(diff)} points ${direction} the typical admitted student's index at ` +
      `${name}, adjusting its overall ${Math.round(admission_rate * 100)}% admit rate to an estimated ` +
      `${Math.round(probability * 100)}%.`;

    return { probability, tier, basis: "academic_index", explanation };
  }

  if (admission_rate != null) {
    const tier = tierFromProbability(admission_rate);
    return {
      probability: admission_rate,
      tier,
      basis: "admission_rate_only",
      explanation:
        `${name} doesn't publish enough test-score data to compare directly against your profile, ` +
        `so this is simply the school's overall reported admit rate (${Math.round(admission_rate * 100)}%).`,
    };
  }

  return {
    probability: null,
    tier: "unknown",
    basis: "insufficient_data",
    explanation: `${name} doesn't report enough admissions data to estimate a probability.`,
  };
}

// --- Match score (content-based filtering) -------------------------------
//
// Scoped deliberately narrow for the prototype: location, size, and
// affordability fit only. The full blueprint's content-based filtering also
// weighs intended major and program strength — we haven't ingested any
// program-level data yet (College Scorecard has it, but it's a separate,
// heavier integration), so major isn't scored here. See DAY4.md.

const STATE_REGIONS: Record<string, string> = {
  CT: "Northeast", ME: "Northeast", MA: "Northeast", NH: "Northeast", NJ: "Northeast",
  NY: "Northeast", PA: "Northeast", RI: "Northeast", VT: "Northeast",
  IL: "Midwest", IN: "Midwest", IA: "Midwest", KS: "Midwest", MI: "Midwest",
  MN: "Midwest", MO: "Midwest", NE: "Midwest", ND: "Midwest", OH: "Midwest",
  SD: "Midwest", WI: "Midwest",
  AL: "South", AR: "South", DE: "South", FL: "South", GA: "South", KY: "South",
  LA: "South", MD: "South", MS: "South", NC: "South", OK: "South", SC: "South",
  TN: "South", TX: "South", VA: "South", WV: "South", DC: "South",
  AK: "West", AZ: "West", CA: "West", CO: "West", HI: "West", ID: "West",
  MT: "West", NV: "West", NM: "West", OR: "West", UT: "West", WA: "West", WY: "West",
};

export type SizePreference = "small" | "medium" | "large" | "no_preference";

export interface StudentPreferences {
  /** e.g. ['CA', 'OR'] — omit or leave empty for "no preference". */
  preferredStates?: string[];
  sizePreference?: SizePreference;
  /** Annual out-of-pocket ceiling the family can pay. Omit for "no constraint". */
  costCeiling?: number | null;
  /** Weights for the three fit dimensions; missing entries default to equal weight. */
  priorityWeights?: { location?: number; size?: number; cost?: number };
}

export interface MatchScoreResult {
  score: number; // 0-100
  breakdown: { location: number; size: number; cost: number }; // each 0-1, pre-weighting
}

function sizeBucket(size: number): "small" | "medium" | "large" {
  if (size < 5000) return "small";
  if (size <= 15000) return "medium";
  return "large";
}

function locationScore(schoolState: string | null, preferredStates?: string[]): number {
  if (!preferredStates || preferredStates.length === 0) return 1; // no stated preference
  if (!schoolState) return 0.5; // unknown state, neutral rather than penalized
  if (preferredStates.includes(schoolState)) return 1;

  const preferredRegions = new Set(preferredStates.map((s) => STATE_REGIONS[s]).filter(Boolean));
  const schoolRegion = STATE_REGIONS[schoolState];
  if (schoolRegion && preferredRegions.has(schoolRegion)) return 0.5;

  return 0.15;
}

function sizeScoreFor(schoolSize: number | null, preference?: SizePreference): number {
  if (!preference || preference === "no_preference") return 1;
  if (schoolSize == null) return 0.5; // unknown size, neutral

  const bucket = sizeBucket(schoolSize);
  if (bucket === preference) return 1;

  const adjacent =
    (bucket === "small" && preference === "medium") ||
    (bucket === "medium" && (preference === "small" || preference === "large")) ||
    (bucket === "large" && preference === "medium");
  return adjacent ? 0.5 : 0.1;
}

function affordabilityScore(netPriceUsed: number | null, costCeiling?: number | null): number {
  if (costCeiling == null) return 1; // no stated constraint
  if (netPriceUsed == null) return 0.5; // unknown price, neutral
  if (netPriceUsed <= costCeiling) return 1;

  const overRatio = (netPriceUsed - costCeiling) / costCeiling;
  return clamp(1 - overRatio * 2, 0, 1); // 25% over ceiling -> 0.5, 50%+ over -> 0
}

/**
 * Weighted fit score across location, size, and affordability. Ordering
 * within a probability tier is driven by this, not by probability itself —
 * it's what makes the list feel personalized rather than just sorted by
 * admit chance.
 */
export function matchScore(
  school: Pick<CollegeForMatching, "state" | "size" | "net_price_used">,
  prefs: StudentPreferences
): MatchScoreResult {
  const location = locationScore(school.state, prefs.preferredStates);
  const size = sizeScoreFor(school.size, prefs.sizePreference);
  const cost = affordabilityScore(school.net_price_used, prefs.costCeiling);

  const w = prefs.priorityWeights ?? {};
  const wLocation = w.location ?? 1;
  const wSize = w.size ?? 1;
  const wCost = w.cost ?? 1;
  const totalWeight = wLocation + wSize + wCost || 1;

  const score = ((location * wLocation + size * wSize + cost * wCost) / totalWeight) * 100;

  return { score, breakdown: { location, size, cost } };
}

// --- Combining both into one ranked list ----------------------------------

export interface RankedCollege extends CollegeForMatching {
  probabilityResult: ProbabilityResult;
  matchResult: MatchScoreResult;
}

const TIER_ORDER: Record<Tier, number> = { safety: 0, match: 1, reach: 2, unknown: 3 };

/**
 * Tags every school with a probability estimate and a match score, then
 * sorts by tier (safety -> match -> reach -> unknown) and, within a tier,
 * by match score descending. This is the function the Day 5 results UI
 * calls directly with the student's profile and the full college list.
 */
export function rankColleges(
  studentIndex: number | null,
  prefs: StudentPreferences,
  schools: CollegeForMatching[]
): RankedCollege[] {
  const ranked: RankedCollege[] = schools.map((school) => ({
    ...school,
    probabilityResult: probabilityEstimate(studentIndex, school),
    matchResult: matchScore(school, prefs),
  }));

  return ranked.sort((a, b) => {
    const tierDiff = TIER_ORDER[a.probabilityResult.tier] - TIER_ORDER[b.probabilityResult.tier];
    if (tierDiff !== 0) return tierDiff;
    return b.matchResult.score - a.matchResult.score;
  });
}
