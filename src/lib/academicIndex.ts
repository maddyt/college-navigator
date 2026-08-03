/**
 * Shared academic-index scale: puts both students and schools onto the same
 * 0-100 number line so a probability estimate can compare them directly,
 * regardless of whether the underlying data is SAT, ACT, or GPA-only.
 *
 * This is intentionally a simple linear mapping, not a normed/statistical
 * scale — it's transparent and explainable (Section 4 of the build plan:
 * every number should be explainable in one sentence), which matters more
 * for a prototype than statistical precision.
 */

const SAT_MIN = 400; // lowest possible combined Reading+Math score
const SAT_MAX = 1600;
const ACT_MIN = 1;
const ACT_MAX = 36;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Combined SAT (Reading+Math, 400-1600) -> 0-100 scale. */
export function satToIndex(satTotal: number): number {
  return clamp(((satTotal - SAT_MIN) / (SAT_MAX - SAT_MIN)) * 100, 0, 100);
}

/** ACT composite (1-36) -> 0-100 scale. */
export function actToIndex(act: number): number {
  return clamp(((act - ACT_MIN) / (ACT_MAX - ACT_MIN)) * 100, 0, 100);
}

export interface SchoolTestBands {
  sat_reading_25: number | null;
  sat_reading_75: number | null;
  sat_math_25: number | null;
  sat_math_75: number | null;
  act_25: number | null;
  act_75: number | null;
}

export interface SchoolAcademicIndexResult {
  academic_index_25: number | null;
  academic_index_75: number | null;
  /** Which underlying data source produced the index, for transparency. */
  source: "sat" | "act" | "none";
}

/**
 * Derives a school's 25th/75th percentile band on the unified 0-100 scale.
 * Prefers SAT (more schools report combined Reading+Math cleanly); falls
 * back to ACT if SAT isn't available; returns nulls (not a guess) if the
 * school reports neither — those are genuinely test-optional/non-reporting
 * schools and should be handled as such downstream, not papered over.
 */
export function schoolAcademicIndexFromPercentiles(bands: SchoolTestBands): SchoolAcademicIndexResult {
  const hasSat =
    bands.sat_reading_25 != null &&
    bands.sat_reading_75 != null &&
    bands.sat_math_25 != null &&
    bands.sat_math_75 != null;

  if (hasSat) {
    return {
      academic_index_25: satToIndex(bands.sat_reading_25! + bands.sat_math_25!),
      academic_index_75: satToIndex(bands.sat_reading_75! + bands.sat_math_75!),
      source: "sat",
    };
  }

  const hasAct = bands.act_25 != null && bands.act_75 != null;
  if (hasAct) {
    return {
      academic_index_25: actToIndex(bands.act_25!),
      academic_index_75: actToIndex(bands.act_75!),
      source: "act",
    };
  }

  return { academic_index_25: null, academic_index_75: null, source: "none" };
}

export interface StudentTestInput {
  /** Unweighted GPA on a 0-4.0 scale by default; pass gpaScale for weighted GPAs (e.g. 5.0). */
  gpa: number | null;
  gpaScale?: number;
  /** Combined SAT (Reading+Math). Omit/null if not taken or not submitting. */
  satTotal?: number | null;
  /** ACT composite. Omit/null if not taken or not submitting. */
  actComposite?: number | null;
}

export interface StudentAcademicIndexResult {
  index: number | null;
  gpaIndex: number | null;
  testIndex: number | null;
  /** 'gpa_and_test' when both are available, 'gpa_only' for test-optional students, 'none' if GPA itself is missing. */
  source: "gpa_and_test" | "gpa_only" | "none";
}

/**
 * Derives a student's academic index on the same 0-100 scale as
 * schoolAcademicIndexFromPercentiles(), so the two can be compared directly.
 * Weights GPA and test score equally (50/50) when both are present — a
 * simple, explainable split rather than a fitted/statistical weighting,
 * consistent with this being a transparent heuristic, not a trained model.
 * Test-optional students (no SAT/ACT provided) are scored on GPA alone
 * rather than penalized or given a fabricated test estimate.
 */
export function studentAcademicIndex(input: StudentTestInput): StudentAcademicIndexResult {
  const { gpa, gpaScale = 4.0, satTotal, actComposite } = input;

  if (gpa == null) {
    return { index: null, gpaIndex: null, testIndex: null, source: "none" };
  }

  const gpaIndex = clamp((gpa / gpaScale) * 100, 0, 100);

  const testIndex =
    satTotal != null ? satToIndex(satTotal) : actComposite != null ? actToIndex(actComposite) : null;

  if (testIndex != null) {
    return {
      index: gpaIndex * 0.5 + testIndex * 0.5,
      gpaIndex,
      testIndex,
      source: "gpa_and_test",
    };
  }

  return { index: gpaIndex, gpaIndex, testIndex: null, source: "gpa_only" };
}
