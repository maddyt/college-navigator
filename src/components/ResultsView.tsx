"use client";

import { useMemo, useState } from "react";
import type { RankResponse } from "@/app/actions";
import type { Tier } from "@/lib/matching";
import { TierSection } from "./TierSection";

const ALL_TIERS: Tier[] = ["safety", "match", "reach", "unknown"];

type SortMode = "default" | "probability" | "match";

export function ResultsView({ result }: { result: RankResponse }) {
  const [visibleTiers, setVisibleTiers] = useState<Set<Tier>>(new Set(ALL_TIERS));
  const [sortMode, setSortMode] = useState<SortMode>("default");
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());

  const toggleTier = (tier: Tier) => {
    setVisibleTiers((prev) => {
      const next = new Set(prev);
      if (next.has(tier)) next.delete(tier);
      else next.add(tier);
      return next;
    });
  };

  const toggleSave = (id: number) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const grouped = useMemo(() => {
    if (!result.ok) return null;

    let list = result.colleges;
    if (showSavedOnly) list = list.filter((c) => savedIds.has(c.id));

    const byTier: Record<Tier, typeof list> = { safety: [], match: [], reach: [], unknown: [] };
    for (const c of list) byTier[c.probabilityResult.tier].push(c);

    if (sortMode !== "default") {
      for (const tier of ALL_TIERS) {
        byTier[tier] = [...byTier[tier]].sort((a, b) =>
          sortMode === "probability"
            ? (b.probabilityResult.probability ?? -1) - (a.probabilityResult.probability ?? -1)
            : b.matchResult.score - a.matchResult.score
        );
      }
    }

    return byTier;
  }, [result, sortMode, showSavedOnly, savedIds]);

  if (!result.ok) {
    return (
      <div className="mt-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{result.error}</div>
    );
  }

  const { academic, colleges } = result;
  const totalShown = grouped ? ALL_TIERS.reduce((sum, t) => sum + grouped[t].length, 0) : 0;

  return (
    <div className="mt-8 space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
        Your academic index:{" "}
        <span className="font-semibold text-slate-800">{academic.index?.toFixed(1) ?? "n/a"}</span>{" "}
        <span className="text-xs text-slate-400">
          (
          {academic.source === "gpa_and_test"
            ? "GPA + test score"
            : academic.source === "gpa_only"
            ? "GPA only (test-optional)"
            : "insufficient data"}
          )
        </span>
        <span className="ml-2 text-xs text-slate-400">· {colleges.length} schools total</span>
      </div>

      {/* Filter + sort controls */}
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-slate-200 bg-white p-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-500">Show:</span>
          {ALL_TIERS.map((tier) => (
            <label key={tier} className="flex items-center gap-1 text-slate-600">
              <input type="checkbox" checked={visibleTiers.has(tier)} onChange={() => toggleTier(tier)} />
              {tier}
            </label>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-500">Sort within tier:</span>
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="rounded border border-slate-300 px-1.5 py-0.5"
          >
            <option value="default">Best match (default)</option>
            <option value="probability">Highest probability</option>
            <option value="match">Highest match score</option>
          </select>
        </div>

        <label className="ml-auto flex items-center gap-1 text-slate-600">
          <input type="checkbox" checked={showSavedOnly} onChange={(e) => setShowSavedOnly(e.target.checked)} />
          Saved only ({savedIds.size})
        </label>
      </div>

      {totalShown === 0 && (
        <p className="text-sm text-slate-500">
          {showSavedOnly ? "No saved schools yet — click ☆ Save on a card." : "No schools match the selected filters."}
        </p>
      )}

      {grouped &&
        ALL_TIERS.filter((t) => visibleTiers.has(t)).map((tier) => (
          <TierSection key={tier} tier={tier} colleges={grouped[tier]} savedIds={savedIds} onToggleSave={toggleSave} />
        ))}
    </div>
  );
}
