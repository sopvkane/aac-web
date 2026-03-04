import type { TimeBucket } from "./suggestions";

export type PainSeverityDataPoint = {
  date: string;
  severity: number;
};

export type CaregiverDashboard = {
  period: string;
  since: string;
  displayName: string;
  favFood: string | null;
  favDrink: string | null;
  favShow: string | null;
  interactionsByTimeBucket: Record<TimeBucket, number>;
  totalInteractionsLast7Days: number;
  todayInteractions: number;
  wellbeingEntriesLast7Days: number;
  painEventsLast7Days: number;
  averagePainSeverityLast7Days: number | null;
  painEventsToday: number;
  averagePainSeverityToday: number | null;
  painByBodyArea: Record<string, number>;
  moodDistribution: Record<string, number>;
  painSeverityTimeSeries: PainSeverityDataPoint[];
};

