import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { caregiverApi } from "../api/caregiver";
import type { CaregiverDashboard } from "../types/caregiverDashboard";
import type { TimeBucket } from "../types/suggestions";

const BUCKET_LABELS: Record<TimeBucket, string> = {
  MORNING: "Morning",
  AFTERNOON: "Afternoon",
  EVENING: "Evening",
  NIGHT: "Night",
};

const MOOD_CONFIG: Record<number, { label: string; icon: string; color: string }> = {
  5: { label: "Happy", icon: "🙂", color: "#22c55e" },
  2: { label: "Sad", icon: "🙁", color: "#3b82f6" },
  3: { label: "Not sure", icon: "🤔", color: "#a855f7" },
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

const PAIN_CHART_PERIODS = [
  { value: "WEEK", label: "Week" },
  { value: "MONTH", label: "Month" },
  { value: "YEAR", label: "Year" },
] as const;

type DashboardTab = "conversations" | "wellbeing" | "pain";

const PAIN_IMAGE_URL =
  "https://media.istockphoto.com/id/1331743543/vector/cute-beautiful-little-girl-is-standing-and-smiling-funny-child-with-pigtails-in-shorts-and-a.jpg?s=612x612&w=0&k=20&c=9jAF0jgISBhsdEOQsIOyhNr2jugxHCfGXNI8VZPc6cQ=";

function BodyHeatmap({ counts }: { counts: Record<string, number> | undefined }) {
  const entries = Object.entries(counts || {});
  const max = entries.reduce((m, [, v]) => (v > m ? v : m), 0);

  const intensity = (value: number) => {
    if (max <= 0) return 0;
    return Math.max(0.15, Math.min(1, value / max));
  };

  // Figure occupies ~30% width (35–65%) and ~60% height (20–80%) of image. Coords in image %.
  const points: Array<{ key: string; x: number; y: number; r: number; label: string }> = [
    { key: "HEAD", x: 50, y: 26, r: 14, label: "Head" },
    { key: "CHEST", x: 50, y: 38, r: 14, label: "Chest" },
    { key: "TUMMY", x: 50, y: 49, r: 16, label: "Tummy" },
    { key: "LEFT_ARM", x: 40, y: 41, r: 12, label: "Left arm" },
    { key: "RIGHT_ARM", x: 60, y: 41, r: 12, label: "Right arm" },
    { key: "LEFT_ELBOW", x: 39, y: 51, r: 11, label: "Left elbow" },
    { key: "RIGHT_ELBOW", x: 61, y: 51, r: 11, label: "Right elbow" },
    { key: "LEFT_HAND", x: 38, y: 59, r: 10, label: "Left hand" },
    { key: "RIGHT_HAND", x: 62, y: 59, r: 10, label: "Right hand" },
    { key: "LEFT_KNEE", x: 47, y: 69, r: 12, label: "Left knee" },
    { key: "RIGHT_KNEE", x: 53, y: 69, r: 12, label: "Right knee" },
    { key: "LEFT_LEG", x: 46, y: 75, r: 14, label: "Left leg" },
    { key: "RIGHT_LEG", x: 54, y: 75, r: 14, label: "Right leg" },
    { key: "UNKNOWN", x: 50, y: 80, r: 12, label: "Unknown" },
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

const ALL_TABS: { id: DashboardTab; label: string }[] = [
  { id: "conversations", label: "Conversations" },
  { id: "wellbeing", label: "Wellbeing check‑ins" },
  { id: "pain", label: "Pain severity" },
];

export function CaregiverDashboardPage() {
  const auth = useAuth();
  const showPainTab =
    auth.role === "PARENT" || auth.role === "CLINICIAN";
  const tabs = ALL_TABS.filter((t) => t.id !== "pain" || showPainTab);

  const [data, setData] = useState<CaregiverDashboard | null>(null);
  const [period, setPeriod] = useState<(typeof PERIOD_OPTIONS)[number]["value"]>("WEEK");
  const [activeTab, setActiveTab] = useState<DashboardTab>("conversations");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") setRefreshKey((k) => k + 1);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

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
  }, [period, refreshKey]);

  useEffect(() => {
    if (!showPainTab && activeTab === "pain") {
      setActiveTab("conversations");
    }
  }, [showPainTab, activeTab]);

  const isForbidden = error?.includes("403");
  const displayName = data?.displayName || "your communicator";
  const periodLabel = PERIOD_OPTIONS.find((p) => p.value === period)?.label || "Week";
  const sinceLabel = data?.since ? new Date(data.since).toLocaleDateString() : null;

  const bucketEntries = data
    ? (Object.entries(data.interactionsByTimeBucket) as [TimeBucket, number][])
    : [];
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
              You don&apos;t have access to this dashboard yet. Please sign in on the{" "}
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

      <nav
        className="flex gap-1 rounded-2xl border border-slate-200 bg-slate-50/80 p-1 sm:w-fit"
        aria-label="Dashboard sections"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === tab.id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <section className="grid gap-4 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => setActiveTab("conversations")}
          className={`aac-tile aac-tone-a text-left transition-opacity hover:opacity-90 ${activeTab === "conversations" ? "ring-2 ring-indigo-400 ring-offset-2" : ""}`}
        >
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
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("wellbeing")}
          className={`aac-tile aac-tone-b text-left transition-opacity hover:opacity-90 ${activeTab === "wellbeing" ? "ring-2 ring-indigo-400 ring-offset-2" : ""}`}
        >
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
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("pain")}
          className={`aac-tile aac-tone-c text-left transition-opacity hover:opacity-90 ${activeTab === "pain" ? "ring-2 ring-indigo-400 ring-offset-2" : ""}`}
        >
          <div className="aac-tile-top">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Pain severity
              </div>
              <div className="text-xl font-extrabold mt-2">
                {formatSeverity(
                  data?.painEventsToday != null && data.painEventsToday > 0 && data.averagePainSeverityToday != null
                    ? data.averagePainSeverityToday
                    : data?.averagePainSeverityLast7Days ?? null
                )}
              </div>
            </div>
            <div className="aac-letter">P</div>
          </div>
          <p className="aac-tile-hint mt-3 text-sm">
            {data?.painEventsToday != null && data.painEventsToday > 0 ? (
              <>Today: {data.painEventsToday} recording{(data.painEventsToday ?? 0) === 1 ? "" : "s"}</>
            ) : (
              <>Use this to spot quieter days or spikes in discomfort.</>
            )}
          </p>
        </button>
      </section>

      {/* Conversations tab: bar chart only */}
      {activeTab === "conversations" && (
        <section>
          <div className="aac-panel rounded-3xl p-5 sm:p-6">
            <h2 className="text-lg font-bold mb-2">When they tend to talk</h2>
            <p className="text-sm text-slate-600 mb-4">
              Each bar shows how often the AAC tool has been used in each part of the day over the
              selected period.
            </p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bucketEntries.map(([bucket, count]) => ({ bucket: BUCKET_LABELS[bucket], count }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="bucket" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      )}

      {/* Wellbeing tab: 3 pie charts with emoji */}
      {activeTab === "wellbeing" && (
        <section>
          <div className="aac-panel rounded-3xl p-5 sm:p-6">
            <h2 className="text-lg font-bold mb-2">Mood check-in distribution</h2>
            <p className="text-sm text-slate-600 mb-4">
              How often each mood was selected in the last {periodLabel.toLowerCase()}.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {([5, 2, 3] as const).map((score) => {
                const config = MOOD_CONFIG[score];
                const count = data?.moodDistribution?.[String(score)] ?? 0;
                const total = Object.values(data?.moodDistribution ?? {}).reduce((a, b) => a + b, 0);
                const pct = total > 0 ? (count / total) * 100 : 0;
                // Each pie needs two slices: this mood (colored) + remainder (gray) so the proportion shows correctly
                const remainder = total > 0 ? total - count : 1;
                const pieData =
                  total > 0
                    ? [
                        { name: config.label, value: count, fill: config.color },
                        { name: "Other", value: remainder, fill: "#e2e8f0" },
                      ].filter((d) => d.value > 0)
                    : [{ name: "None", value: 1, fill: "#f1f5f9" }];
                return (
                  <div key={score} className="flex flex-col items-center">
                    <div className="relative w-44 h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius="35%"
                            outerRadius="50%"
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {pieData.map((entry, i) => (
                              <Cell key={i} fill={entry.fill} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div
                        className="absolute inset-0 flex items-center justify-center text-4xl pointer-events-none"
                        aria-hidden
                      >
                        {config.icon}
                      </div>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-slate-800">{config.label}</p>
                    <p className="text-xs text-slate-500">{count} ({pct.toFixed(0)}%)</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Pain tab: line graph + period toggle + heatmap */}
      {activeTab === "pain" && (
        <section className="space-y-6">
          <div className="aac-panel rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">Pain severity over time</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Numerical pain ratings (1–10) over the selected period.
                </p>
              </div>
              <nav className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50/80 p-1" aria-label="Chart range">
                {PAIN_CHART_PERIODS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPeriod(opt.value)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                      period === opt.value ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-800"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </nav>
            </div>
            <div className="h-56">
              {data?.painSeverityTimeSeries?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.painSeverityTimeSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(v) => v != null ? [`${Number(v).toFixed(1)} / 10`, "Severity"] : null}
                      labelFormatter={(d) => new Date(d).toLocaleDateString()}
                    />
                    <Line type="monotone" dataKey="severity" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Severity" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-slate-500 rounded-xl bg-slate-50">
                  No pain severity data in this period
                </div>
              )}
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
              Where pain was tapped most often. Severity is recorded on a 1–10 scale.
            </p>
            <BodyHeatmap counts={data?.painByBodyArea} />
          </div>
        </section>
      )}

      {activeTab === "conversations" && (
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
      )}
    </div>
  );
}

