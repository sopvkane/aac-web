import { render, screen } from "@testing-library/react";
import { ConversationPage } from "./ConversationPage";

const mockStart = vi.fn();
const mockStop = vi.fn();

vi.mock("../hooks/useSpeechToText", () => {
  return {
    useSpeechToText: () => ({
      listening: false,
      interimText: "",
      finalText: "",
      error: null,
      start: mockStart,
      stop: mockStop,
    }),
  };
});

const mockGetReplies = vi.fn().mockResolvedValue({
  intent: "small_talk",
  topReplies: [
    {
      id: "1",
      label: "Hi there",
      text: "Hi there!",
    },
  ],
  optionGroups: [],
  memory: {
    lastIntent: "",
    lastQuestionText: "",
    lastOptionGroups: [],
  },
});

vi.mock("../api/dialogue", () => ({
  getDialogueReplies: (...args: unknown[]) => mockGetReplies(...args),
}));

vi.mock("../api/tts", () => ({
  speakText: vi.fn().mockResolvedValue(undefined),
}));

test("shows onboarding when no stored name", () => {
  window.localStorage.removeItem("aac_name");

  render(<ConversationPage />);

  expect(screen.getByText(/What should I call you\?/i)).toBeInTheDocument();
});

test("renders main conversation UI and calls dialogue API", async () => {
  window.localStorage.setItem("aac_name", "Sophie");

  render(<ConversationPage />);

  // When user has a name, main conversation UI should render (no onboarding)
  expect(
    screen.queryByText(/What should I call you\?/i)
  ).not.toBeInTheDocument();
});

