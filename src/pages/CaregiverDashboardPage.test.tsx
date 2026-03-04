import { render, screen } from "@testing-library/react";
import { CaregiverDashboardPage } from "./CaregiverDashboardPage";

vi.mock("../api/caregiver", () => ({
  caregiverApi: {
    getDashboard: vi.fn().mockResolvedValue({
      displayName: "Sophie",
      since: new Date().toISOString(),
      todayInteractions: 3,
      totalInteractionsLast7Days: 10,
      wellbeingEntriesLast7Days: 2,
      painEventsLast7Days: 1,
      averagePainSeverityLast7Days: 3.5,
      painEventsToday: 0,
      averagePainSeverityToday: null,
      interactionsByTimeBucket: {
        MORNING: 2,
        AFTERNOON: 1,
        EVENING: 0,
        NIGHT: 0,
      },
      painByBodyArea: {},
      moodDistribution: { "5": 3, "2": 1, "3": 2 },
      painSeverityTimeSeries: [],
    }),
  },
}));

test("renders caregiver dashboard summary", async () => {
  render(<CaregiverDashboardPage />);

  expect(await screen.findByText(/Caregiver dashboard/i)).toBeInTheDocument();
  expect(screen.getByText(/Today with Sophie/i)).toBeInTheDocument();
});

