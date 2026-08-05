"use client";

import { useState } from "react";
import type { RankedCollege } from "@/lib/matching";
import type { College } from "@/lib/getColleges";

const TIER_BADGE_STYLES: Record<string, string> = {
  safety: "bg-emerald-50 text-emerald-700 border-emerald-200",
  match: "bg-amber-50 text-amber-700 border-amber-200",
  reach: "bg-rose-50 text-rose-700 border-rose-200",
  unknown: "bg-slate-100 text-slate-600 border-slate-200",
};

function formatMoney(value: number | null): string {
  if (value == null) return "not reported";
  return `$${value.toLocaleString()}`;
}

function oneLineSummary(college: RankedCollege<College>): string {
  const { probabilityResult: p, matchResult: m } = college;
  const probText = p.probability != null ? `~${Math.round(p.probability * 100)}% estimated admit chance` : "admissions data limited";
  const fitText = m.score >= 70 ? "strong fit on your preferences" : m.score >= 40 ? "a reasonable fit" : "a stretch fit on your stated preferences";
  return `${probText}, ${fitText}.`;
}

export function CollegeCard({
  college,
  saved,
  onToggleSave,
}: {
  college: RankedCollege<College>;
  saved: boolean;
  onToggleSave: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { probabilityResult: p, matchResult: m } = college;

  return (
    <li className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-medium text-slate-800">{college.name}</h3>
          <p className="text-xs text-slate-400">
            {college.city ? `${college.city}, ` : ""}
            {college.state ?? "—"} · {college.size ? `${college.size.toLocaleString()} students` : "size unknown"}
          </p>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium uppercase ${TIER_BADGE_STYLES[p.tier]}`}>
          {p.tier}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
        <span>
          Probability: <strong className="text-slate-700">{p.probability != null ? `${Math.round(p.probability * 100)}%` : "n/a"}</strong>
        </span>
        <span>
          Match score: <strong className="text-slate-700">{m.score.toFixed(0)}/100</strong>
        </span>
        <span>
          Net price: <strong className="text-slate-700">{formatMoney(college.net_price_used)}</strong>
        </span>
      </div>

      <p className="mt-2 text-sm text-slate-600">{oneLineSummary(college)}</p>

      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-xs font-medium text-slate-500 underline underline-offset-2 hover:text-slate-700"
        >
          {expanded ? "Hide details" : "Why this estimate?"}
        </button>
        <button
          type="button"
          onClick={() => onToggleSave(college.id)}
          className={`rounded-md border px-2.5 py-1 text-xs font-medium ${
            saved ? "border-slate-800 bg-slate-800 text-white" : "border-slate-300 text-slate-600 hover:bg-slate-50"
          }`}
        >
          {saved ? "★ Saved" : "☆ Save"}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500 space-y-1">
          <p>{p.explanation}</p>
          <p className="text-slate-400">
            Fit breakdown — location: {(m.breakdown.location * 100).toFixed(0)}%, size: {(m.breakdown.size * 100).toFixed(0)}%,
            affordability: {(m.breakdown.cost * 100).toFixed(0)}%.
          </p>
        </div>
      )}
    </li>
  );
}
