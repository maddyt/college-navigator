"use client";

import { useEffect } from "react";
import type { RankedCollege } from "@/lib/matching";
import type { College } from "@/lib/getColleges";

const TIER_BADGE_STYLES: Record<string, string> = {
  safety: "bg-emerald-50 text-emerald-700 border-emerald-200",
  match: "bg-amber-50 text-amber-700 border-amber-200",
  reach: "bg-rose-50 text-rose-700 border-rose-200",
  unknown: "bg-slate-100 text-slate-600 border-slate-200",
};

function pct(value: number | null): string {
  return value == null ? "not reported" : `${Math.round(value * 100)}%`;
}

function money(value: number | null): string {
  return value == null ? "not reported" : `$${value.toLocaleString()}`;
}

function num(value: number | null, unit = ""): string {
  return value == null ? "not reported" : `${value.toLocaleString()}${unit}`;
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-slate-100 py-1.5 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-700">{value}</span>
    </div>
  );
}

export function CollegeDetailModal({
  college,
  onClose,
}: {
  college: RankedCollege<College>;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const { probabilityResult: p, matchResult: m } = college;
  const hasSat = college.sat_reading_25 != null && college.sat_math_25 != null;
  const hasAct = college.act_25 != null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`${college.name} details`}
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">{college.name}</h2>
            <p className="text-sm text-slate-400">
              {college.city ? `${college.city}, ` : ""}
              {college.state ?? "—"} · {college.ownership ?? "ownership unknown"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-500 hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        <section className="mt-4 rounded-md bg-slate-50 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600">Your estimate</span>
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium uppercase ${TIER_BADGE_STYLES[p.tier]}`}>
              {p.tier}
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-600">{p.explanation}</p>
          <p className="mt-2 text-xs text-slate-400">
            Match score {m.score.toFixed(0)}/100 — location {(m.breakdown.location * 100).toFixed(0)}%, size{" "}
            {(m.breakdown.size * 100).toFixed(0)}%, affordability {(m.breakdown.cost * 100).toFixed(0)}%.
          </p>
        </section>

        <section className="mt-4">
          <h3 className="text-sm font-semibold text-slate-700">Admissions</h3>
          <StatRow label="Overall admit rate" value={pct(college.admission_rate)} />
          {hasSat && (
            <StatRow
              label="SAT range (25th–75th)"
              value={`${(college.sat_reading_25! + college.sat_math_25!)}–${(college.sat_reading_75! + college.sat_math_75!)}`}
            />
          )}
          {hasAct && <StatRow label="ACT range (25th–75th)" value={`${college.act_25}–${college.act_75}`} />}
          {!hasSat && !hasAct && <StatRow label="Test scores" value="Test-optional / not reported" />}
          <StatRow
            label="Academic index band (0–100 scale)"
            value={
              college.academic_index_25 != null
                ? `${college.academic_index_25.toFixed(0)}–${college.academic_index_75!.toFixed(0)}`
                : "not available"
            }
          />
        </section>

        <section className="mt-4">
          <h3 className="text-sm font-semibold text-slate-700">Cost</h3>
          <StatRow label="Sticker price (cost of attendance)" value={money(college.cost_of_attendance)} />
          <StatRow label="Average net price" value={money(college.avg_net_price)} />
          <StatRow label="Affordability tier" value={college.affordability_tier ?? "unknown"} />
        </section>

        <section className="mt-4">
          <h3 className="text-sm font-semibold text-slate-700">Outcomes</h3>
          <StatRow label="Enrollment size" value={num(college.size, " students")} />
          <StatRow label="Retention rate" value={pct(college.retention_rate)} />
          <StatRow label="Completion rate" value={pct(college.completion_rate)} />
        </section>

        <p className="mt-4 text-xs text-slate-400">
          Data from the College Scorecard API. Estimates are heuristic, not a guarantee of admission — see the
          explanation above for how this number was derived.
        </p>
      </div>
    </div>
  );
}
