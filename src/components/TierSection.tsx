import type { RankedCollege, Tier } from "@/lib/matching";
import type { College } from "@/lib/getColleges";
import { CollegeCard } from "./CollegeCard";

const TIER_LABELS: Record<Tier, string> = {
  safety: "Safety",
  match: "Match",
  reach: "Reach",
  unknown: "Not enough data",
};

const TIER_DESCRIPTIONS: Record<Tier, string> = {
  safety: "Estimated admit chance 70% or higher.",
  match: "Estimated admit chance roughly 40–70%.",
  reach: "Estimated admit chance below 40%.",
  unknown: "This school doesn't report enough data to estimate a probability.",
};

const TIER_ACCENTS: Record<Tier, string> = {
  safety: "border-l-emerald-400",
  match: "border-l-amber-400",
  reach: "border-l-rose-400",
  unknown: "border-l-slate-300",
};

export function TierSection({
  tier,
  colleges,
  savedIds,
  onToggleSave,
}: {
  tier: Tier;
  colleges: RankedCollege<College>[];
  savedIds: Set<number>;
  onToggleSave: (id: number) => void;
}) {
  if (colleges.length === 0) return null;

  return (
    <section className={`border-l-4 pl-4 ${TIER_ACCENTS[tier]}`}>
      <div className="flex items-baseline gap-2">
        <h2 className="text-lg font-semibold text-slate-800">
          {TIER_LABELS[tier]} <span className="text-sm font-normal text-slate-400">({colleges.length})</span>
        </h2>
      </div>
      <p className="mt-0.5 text-xs text-slate-400">{TIER_DESCRIPTIONS[tier]}</p>

      <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {colleges.map((c) => (
          <CollegeCard key={c.id} college={c} saved={savedIds.has(c.id)} onToggleSave={onToggleSave} />
        ))}
      </ul>
    </section>
  );
}
