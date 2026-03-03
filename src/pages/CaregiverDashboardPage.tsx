import { useEffect, useState } from "react";
import { caregiverApi } from "../api/caregiver";
import type { CaregiverDashboard } from "../types/caregiverDashboard";
import type { TimeBucket } from "../types/suggestions";

const BUCKET_LABELS: Record<TimeBucket, string> = {
  MORNING: "Morning",
  AFTERNOON: "Afternoon",
  EVENING: "Evening",
  NIGHT: "Night",
};

const PERIOD_OPTIONS = [
  { value: "DAY", label: "Day" },
  { value: "WEEK", label: "Week" },
  { value: "MONTH", label: "Month" },
  { value: "3_MONTHS", label: "3 months" },
  { value: "6_MONTHS", label: "6 months" },
  { value: "9_MONTHS", label: "9 months" },
  { value: "YEAR", label: "Year" },
] as const;

const PAIN_IMAGE_URL =
  "https://media.istockphoto.com/id/1331743543/vector/cute-beautiful-little-girl-is-standing-and-smiling-funny-child-with-pigtails-in-shorts-and-a.jpg?s=612x612&w=0&k=20&c=9jAF0jgISBhsdEOQsIOyhNr2jugxHCfGXNI8VZPc6cQ=";

function BodyHeatmap({ counts }: { counts: Record<string, number> | undefined }) {
  const entries = Object.entries(counts || {});
  const max = entries.reduce((m, [, v]) => (v > m ? v : m), 0);

  const intensity = (value: number) => {
    if (max <= 0) return 0;
    return Math.max(0.15, Math.min(1, value / max));
  };

  const points: Array<{ key: string; x: number; y: number; r: number; label: string }> = [
    { key: "HEAD", x: 50, y: 13, r: 18, label: "Head" },
    { key: "CHEST", x: 50, y: 32, r: 20, label: "Chest" },
    { key: "TUMMY", x: 50, y: 45, r: 22, label: "Tummy" },
    { key: "LEFT_ARM", x: 20, y: 36, r: 18, label: "Left arm" },
    { key: "RIGHT_ARM", x: 80, y: 36, r: 18, label: "Right arm" },
    { key: "ARM", x: 20, y: 36, r: 18, label: "Arm" },
    { key: "LEFT_ELBOW", x: 18, y: 49, r: 16, label: "Left elbow" },
    { key: "RIGHT_ELBOW", x: 82, y: 49, r: 16, label: "Right elbow" },
    { key: "LEFT_HAND", x: 16, y: 62, r: 14, label: "Left hand" },
    { key: "RIGHT_HAND", x: 84, y: 62, r: 14, label: "Right hand" },
    { key: "LEFT_KNEE", x: 45, y: 78, r: 16, label: "Left knee" },
    { key: "RIGHT_KNEE", x: 55, y: 78, r: 16, label: "Right knee" },
    { key: "LEFT_LEG", x: 42, y: 76, r: 20, label: "Left leg" },
    { key: "RIGHT_LEG", x: 58, y: 76, r: 20, label: "Right leg" },
    { key: "LEG", x: 50, y: 76, r: 22, label: "Leg" },
    { key: "UNKNOWN", x: 50, y: 92, r: 16, label: "Unknown" },
  ];

  const getCount = (k: string) => (counts && counts[k] ? counts[k] : 0);

  return (
    <div className="relative mx-auto w-full max-w-[280px] overflow-hidden rounded-3xl border border-slate-200 bg-white">
      <img src={PAIN_IMAGE_URL} alt="Body map" className="block w-full select-none" />
      {points
        .filter((p) => getCount(p.key) > 0)
        .map((p) => {
          const value = getCount(p.key);
          const a = intensity(value);
          return (
            <div
              key={p.key}
              title={`${p.label}: ${value}`}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: `${p.r * 2}px`,
                height: `${p.r * 2}px`,
                background: `rgba(244, 63, 94, ${0.12 + 0.35 * a})`,
                border: `2px solid rgba(244, 63, 94, ${0.35 + 0.45 * a})`,
                boxShadow: `0 0 0 6px rgba(244, 63, 94, ${0.06 + 0.08 * a})`,
              }}
            />
          );
        })}
      {max <= 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 px-4 text-center text-xs font-semibold text-slate-600">
          No pain taps recorded in this period yet
        </div>
      )}
    </div>
  );
}

export function CaregiverDashboardPage() {
  const [data, setData] = useState<CaregiverDashboard | null>(null);
  const [period, setPeriod] = useState<(typeof PERIOD_OPTIONS)[number]["value"]>("WEEK");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setError(null);
      setLoading(true);
      try {
        const res = await caregiverApi.getDashboard(period);
        if (!cancelled) {
          setData(res);
        }
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "Failed to load caregiver dashboard";
          setError(msg);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [period]);

  const isForbidden = error?.includes("403");
  const displayName = data?.displayName || "your communicator";
  const periodLabel = PERIOD_OPTIONS.find((p) => p.value === period)?.label || "Week";
  const sinceLabel = data?.since ? new Date(data.since).toLocaleDateString() : null;

  const bucketEntries = data
    ? (Object.entries(data.interactionsByTimeBucket) as [TimeBucket, number][])
    : [];
  const maxBucketCount = bucketEntries.reduce((max, [, v]) => (v > max ? v : max), 0);

  const formatSeverity = (value: number | null) => {
    if (value == null) return "No pain events recorded";
    return `${value.toFixed(1)} / 10 (average)`;
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-semibold tracking-wide text-indigo-600 uppercase">
          Caregiver dashboard
        </p>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Today with {displayName}
          </h1>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600" htmlFor="dashboard-period">
              Range
            </label>
            <select
              id="dashboard-period"
              value={period}
              onChange={(e) =>
                setPeriod(e.target.value as (typeof PERIOD_OPTIONS)[number]["value"])
              }
              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 shadow-sm"
            >
              {PERIOD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-slate-600 max-w-2xl">
          A quick view of how the AAC tool is being used today, and how {displayName || "they"}{" "}
          have been feeling over the selected period{sinceLabel ? ` (since ${sinceLabel})` : ""}.
        </p>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-[18px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
        >
          {isForbidden ? (
            <>
              You don&apos;t have access to this dashboard yet. Please sign in as a{" "}
              <strong>Parent</strong> or <strong>Carer</strong> on the{" "}
              <span className="font-semibold">Settings</span> tab using your PIN.
            </>
          ) : (
            error
          )}
        </div>
      )}

      {loading && !data && <p className="text-sm text-slate-600">Loading dashboard…</p>}

      {!loading && !error && !data && (
        <p className="text-sm text-slate-600">No dashboard data available yet.</p>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="aac-tile aac-tone-a">
          <div className="aac-tile-top">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Conversations
              </div>
              <div className="text-3xl font-extrabold mt-2">
                {data ? data.todayInteractions : 0}
              </div>
              <div className="text-sm text-slate-600 mt-1">today</div>
            </div>
            <div className="aac-letter">C</div>
          </div>
          <p className="aac-tile-hint mt-3 text-sm">
            {data ? data.totalInteractionsLast7Days : 0} total in the last{" "}
            {periodLabel.toLowerCase()}
          </p>
        </div>

        <div className="aac-tile aac-tone-b">
          <div className="aac-tile-top">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Wellbeing check‑ins
              </div>
              <div className="text-3xl font-extrabold mt-2">
                {data ? data.wellbeingEntriesLast7Days : 0}
              </div>
              <div className="text-sm text-slate-600 mt-1">
                entries in the last {periodLabel.toLowerCase()}
              </div>
            </div>
            <div className="aac-letter">W</div>
          </div>
          <p className="aac-tile-hint mt-3 text-sm">
            {data ? data.painEventsLast7Days : 0} of these mentioned pain
          </p>
        </div>

        <div className="aac-tile aac-tone-c">
          <div className="aac-tile-top">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Pain severity
              </div>
              <div className="text-xl font-extrabold mt-2">
                {formatSeverity(data ? data.averagePainSeverityLast7Days : null)}
              </div>
            </div>
            <div className="aac-letter">P</div>
          </div>
          <p className="aac-tile-hint mt-3 text-sm">
            Use this to spot quieter days or spikes in discomfort.
          </p>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="aac-panel rounded-3xl p-5 sm:p-6">
          <h2 className="text-lg font-bold mb-2">When they tend to talk</h2>
          <p className="text-sm text-slate-600 mb-4">
            Each bar shows how often the AAC tool has been used in each part of the day over the
            selected period.
          </p>

          <div className="space-y-3">
            {bucketEntries.map(([bucket, count]) => {
              const widthPercent =
                maxBucketCount === 0 ? 0 : Math.max(12, (count / maxBucketCount) * 100);
              return (
                <div key={bucket}>
                  <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                    <span>{BUCKET_LABELS[bucket]}</span>
                    <span>{count}</span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-500"
                      style={{ width: `${widthPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="aac-panel rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-bold">Pain heatmap</h2>
            <span className="text-xs font-semibold text-slate-500">
              {periodLabel}
              {sinceLabel ? ` (since ${sinceLabel})` : ""}
            </span>
          </div>
          <p className="text-sm text-slate-600">
            This shows where pain was tapped most often in the selected period.
          </p>
          <BodyHeatmap counts={data?.painByBodyArea} />
        </div>
      </section>

      <section className="aac-panel rounded-3xl p-5 sm:p-6 space-y-4">
        <h2 className="text-lg font-bold">Favourites so far</h2>
        <p className="text-sm text-slate-600">
          These come from the profile and can be edited in the caregiver settings later.
        </p>

        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <div className="bg-white/70 border border-indigo-100 rounded-2xl px-4 py-3">
            <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Food</dt>
            <dd className="mt-1 font-bold text-slate-900">
              {data?.favFood || <span className="text-slate-400">Not set yet</span>}
            </dd>
          </div>
          <div className="bg-white/70 border border-indigo-100 rounded-2xl px-4 py-3">
            <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Drink</dt>
            <dd className="mt-1 font-bold text-slate-900">
              {data?.favDrink || <span className="text-slate-400">Not set yet</span>}
            </dd>
          </div>
          <div className="bg-white/70 border border-indigo-100 rounded-2xl px-4 py-3">
            <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Show</dt>
            <dd className="mt-1 font-bold text-slate-900">
              {data?.favShow || <span className="text-slate-400">Not set yet</span>}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

