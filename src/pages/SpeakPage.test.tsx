import { render, screen } from "@testing-library/react";
import { SpeakPage } from "./SpeakPage";

vi.mock("../api/tts", () => ({
  speakText: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../api/preferences", () => ({
  preferencesApi: {
    list: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock("../api/wellbeing", () => ({
  wellbeingApi: {
    recordMood: vi.fn().mockResolvedValue(undefined),
    recordPain: vi.fn().mockResolvedValue(undefined),
  },
}));

test("renders quick speak section", async () => {
  render(<SpeakPage location="HOME" />);

  expect(await screen.findByText(/Tap to speak/i)).toBeInTheDocument();
  expect(screen.getByText(/Quick speak/i)).toBeInTheDocument();
});

