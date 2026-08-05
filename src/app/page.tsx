"use client";

import { useMemo, useState, useTransition } from "react";
import { getRankedColleges, type RankResponse, type OnboardingInput } from "./actions";
import { US_STATES } from "@/lib/states";
import type { SizePreference } from "@/lib/matching";
import { ResultsView } from "@/components/ResultsView";

export default function Home() {
  const [gpa, setGpa] = useState("");
  const [satTotal, setSatTotal] = useState("");
  const [actComposite, setActComposite] = useState("");
  const [preferredStates, setPreferredStates] = useState<string[]>([]);
  const [sizePreference, setSizePreference] = useState<SizePreference>("no_preference");
  const [costCeiling, setCostCeiling] = useState("");
  const [priorityLocation, setPriorityLocation] = useState(5);
  const [prioritySize, setPrioritySize] = useState(5);
  const [priorityCost, setPriorityCost] = useState(5);

  const [formError, setFormError] = useState<string | null>(null);
  const [result, setResult] = useState<RankResponse | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedStateLabels = useMemo(
    () => preferredStates.map((code) => US_STATES.find((s) => s.code === code)?.name ?? code).join(", "),
    [preferredStates]
  );

  function handleStateToggle(code: string) {
    setPreferredStates((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const gpaNum = parseFloat(gpa);
    if (Number.isNaN(gpaNum)) {
      setFormError("Please enter your GPA.");
      return;
    }

    const input: OnboardingInput = {
      gpa: gpaNum,
      satTotal: satTotal.trim() ? Number(satTotal) : null,
      actComposite: actComposite.trim() ? Number(actComposite) : null,
      preferredStates,
      sizePreference,
      costCeiling: costCeiling.trim() ? Number(costCeiling) : null,
      priorityWeights: { location: priorityLocation, size: prioritySize, cost: priorityCost },
    };

    startTransition(async () => {
      const response = await getRankedColleges(input);
      setResult(response);
    });
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-slate-800">AI College Admissions Navigator</h1>
        <p className="mt-1 text-sm text-slate-500">
          Prototype — enter a profile below to see a match/reach/safety list. Estimates are heuristic, not a
          guarantee of admission.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          {/* Academic profile */}
          <section>
            <h2 className="text-sm font-semibold text-slate-700">Academic profile</h2>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <label className="block text-sm text-slate-600">
                GPA (0.0–4.0, unweighted)
                <input
                  type="number" step="0.01" min={0} max={4} required
                  value={gpa} onChange={(e) => setGpa(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  placeholder="3.7"
                />
              </label>
              <label className="block text-sm text-slate-600">
                SAT total (optional)
                <input
                  type="number" min={400} max={1600}
                  value={satTotal} onChange={(e) => setSatTotal(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  placeholder="1350"
                />
              </label>
              <label className="block text-sm text-slate-600">
                ACT composite (optional)
                <input
                  type="number" min={1} max={36}
                  value={actComposite} onChange={(e) => setActComposite(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  placeholder="28"
                />
              </label>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Leave both test fields blank if you&apos;re test-optional — you&apos;ll be scored on GPA alone, not penalized.
            </p>
          </section>

          {/* Preferences */}
          <section>
            <h2 className="text-sm font-semibold text-slate-700">Preferences</h2>

            <div className="mt-3">
              <span className="block text-sm text-slate-600">Preferred states (optional — leave empty for no preference)</span>
              <div className="mt-1 max-h-36 overflow-y-auto rounded-md border border-slate-300 p-2 grid grid-cols-3 sm:grid-cols-4 gap-1">
                {US_STATES.map((s) => (
                  <label key={s.code} className="flex items-center gap-1.5 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={preferredStates.includes(s.code)}
                      onChange={() => handleStateToggle(s.code)}
                    />
                    {s.code}
                  </label>
                ))}
              </div>
              {preferredStates.length > 0 && (
                <p className="mt-1 text-xs text-slate-400">Selected: {selectedStateLabels}</p>
              )}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <span className="block text-sm text-slate-600">Campus size preference</span>
                <div className="mt-1 flex flex-wrap gap-3">
                  {(["small", "medium", "large", "no_preference"] as SizePreference[]).map((opt) => (
                    <label key={opt} className="flex items-center gap-1.5 text-xs text-slate-600">
                      <input
                        type="radio" name="size" checked={sizePreference === opt}
                        onChange={() => setSizePreference(opt)}
                      />
                      {opt === "no_preference" ? "No preference" : opt[0].toUpperCase() + opt.slice(1)}
                    </label>
                  ))}
                </div>
              </div>

              <label className="block text-sm text-slate-600">
                Annual cost ceiling, $ (optional)
                <input
                  type="number" min={0} step={1000}
                  value={costCeiling} onChange={(e) => setCostCeiling(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  placeholder="25000"
                />
              </label>
            </div>
          </section>

          {/* Priorities */}
          <section>
            <h2 className="text-sm font-semibold text-slate-700">
              How much should each factor matter when ranking your list?
            </h2>
            <div className="mt-3 space-y-3">
              <SliderRow label="Location" value={priorityLocation} onChange={setPriorityLocation} />
              <SliderRow label="Campus size" value={prioritySize} onChange={setPrioritySize} />
              <SliderRow label="Affordability" value={priorityCost} onChange={setPriorityCost} />
            </div>
          </section>

          {formError && <p className="text-sm text-rose-600">{formError}</p>}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-md bg-slate-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {isPending ? "Finding your colleges…" : "Find my colleges"}
          </button>
        </form>

        {result && <ResultsView result={result} />}
      </div>
    </main>
  );
}

function SliderRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block text-sm text-slate-600">
      <div className="flex justify-between">
        <span>{label}</span>
        <span className="text-xs text-slate-400">{value}/10</span>
      </div>
      <input
        type="range" min={0} max={10} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full"
      />
    </label>
  );
}
