"use server";

/**
 * Day 5: server action bridging the onboarding form to Day 4's algorithm.
 * Runs on the server so the Supabase query and ranking logic never ship to
 * the client bundle — the form just posts plain data and gets a ranked list
 * back.
 */
import { studentAcademicIndex, type StudentAcademicIndexResult } from "@/lib/academicIndex";
import { rankColleges, type RankedCollege, type SizePreference } from "@/lib/matching";
import { getColleges, type College } from "@/lib/getColleges";

export interface OnboardingInput {
  gpa: number;
  satTotal?: number | null;
  actComposite?: number | null;
  preferredStates: string[];
  sizePreference: SizePreference;
  costCeiling?: number | null;
  priorityWeights: { location: number; size: number; cost: number };
}

export interface RankSuccess {
  ok: true;
  academic: StudentAcademicIndexResult;
  colleges: RankedCollege<College>[];
}

export interface RankFailure {
  ok: false;
  error: string;
}

export type RankResponse = RankSuccess | RankFailure;

function validate(input: OnboardingInput): string | null {
  if (input.gpa == null || Number.isNaN(input.gpa)) return "GPA is required.";
  if (input.gpa < 0 || input.gpa > 4.0) return "GPA must be between 0.0 and 4.0.";
  if (input.satTotal != null && (input.satTotal < 400 || input.satTotal > 1600)) {
    return "SAT total must be between 400 and 1600.";
  }
  if (input.actComposite != null && (input.actComposite < 1 || input.actComposite > 36)) {
    return "ACT composite must be between 1 and 36.";
  }
  if (input.costCeiling != null && input.costCeiling < 0) {
    return "Cost ceiling can't be negative.";
  }
  return null;
}

export async function getRankedColleges(input: OnboardingInput): Promise<RankResponse> {
  const validationError = validate(input);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  try {
    const academic = studentAcademicIndex({
      gpa: input.gpa,
      satTotal: input.satTotal,
      actComposite: input.actComposite,
    });

    const colleges = await getColleges();

    const ranked = rankColleges(
      academic.index,
      {
        preferredStates: input.preferredStates,
        sizePreference: input.sizePreference,
        costCeiling: input.costCeiling,
        priorityWeights: input.priorityWeights,
      },
      colleges
    );

    return { ok: true, academic, colleges: ranked };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Something went wrong loading colleges.",
    };
  }
}
