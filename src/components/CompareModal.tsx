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

const MAX_COMPARE = 4;

function pct(value: number | null): string {
  return value == null ? "—" : `${Math.round(value * 100)}%`;
}

function money(value: number | null): string {
  return value == null ? "—" : `$${value.toLocaleString()}`;
}

function testRange(c: College): string {
  const hasSat = c.sat_reading_25 != null && c.sat_math_25 != null;
  if (hasSat) return `${c.sat_reading_25! + c.sat_math_25!}–${c.sat_reading_75! + c.sat_math_75!} SAT`;
  if (c.act_25 != null) return `${c.act_25}–${c.act_75} ACT`;
  return "test-optional";
}

interface CompareRow {
  label: string;
  render: (c: RankedCollege<College>) => React.ReactNode;
}

const ROWS: CompareRow[] = [
  {
    label: "Tier",
    render: (c) => (
      <span className={`rounded-full border px-2 py-0.5 text-xs font-medium uppercase ${TIER_BADGE_STYLES[c.probabilityResult.tier]}`}>
        {c.probabilityResult.tier}
      </span>
    ),
  },
  { label: "Probability", render: (c) => pct(c.probabilityResult.probability) },
  { label: "Match score", render: (c) => `${c.matchResult.score.toFixed(0)}/100` },
  { label: "Location", render: (c) => `${c.city ? c.city + ", " : ""}${c.state ?? "—"}` },
  { label: "Size", render: (c) => (c.size ? `${c.size.toLocaleString()} students` : "unknown") },
  { label: "Admit rate", render: (c) => pct(c.admission_rate) },
  { label: "Test range", render: (c) => testRange(c) },
  { label: "Sticker price", render: (c) => money(c.cost_of_attendance) },
  { label: "Avg net price", render: (c) => money(c.net_price_used) },
  { label: "Retention", render: (c) => pct(c.retention_rate) },
  { label: "Completion", render: (c) => pct(c.completion_rate) },
];

export function CompareModal({
  colleges,
  onClose,
}: {
  colleges: RankedCollege<College>[];
  onClose: () => void;
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const shown = colleges.slice(0, MAX_COMPARE);
  const overflow = colleges.length - shown.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Compare saved schools"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-4xl overflow-auto rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-800">Compare saved schools</h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-500 hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        {overflow > 0 && (
          <p className="mt-2 text-xs text-amber-600">
            Showing your first {MAX_COMPARE} saved schools. Unsave one to compare {overflow > 1 ? "others" : "another"}.
          </p>
        )}

        {shown.length < 2 ? (
          <p className="mt-4 text-sm text-slate-500">Save at least 2 schools to compare them side by side.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[500px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="w-32 pb-2 text-left text-xs font-medium uppercase text-slate-400">Factor</th>
                  {shown.map((c) => (
                    <th key={c.id} className="border-b border-slate-200 pb-2 pl-4 text-left font-semibold text-slate-800">
                      {c.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr key={row.label}>
                    <td className="py-1.5 pr-2 text-xs text-slate-400">{row.label}</td>
                    {shown.map((c) => (
                      <td key={c.id} className="border-b border-slate-100 py-1.5 pl-4 text-slate-700">
                        {row.render(c)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
