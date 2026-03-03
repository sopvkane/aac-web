import type { TimeBucket } from "./suggestions";

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
  painByBodyArea: Record<string, number>;
};

