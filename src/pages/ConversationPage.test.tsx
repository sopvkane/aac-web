import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConversationPage } from "./ConversationPage";

const mockStart = vi.fn();
const mockStop = vi.fn();
let mockFinalText = "";

vi.mock("../hooks/useSpeechToText", () => ({
  useSpeechToText: () => ({
    listening: false,
    interimText: "",
    get finalText() {
      return mockFinalText;
    },
    error: null,
    start: mockStart,
    stop: mockStop,
  }),
}));

const mockGetReplies = vi.fn().mockResolvedValue({
  intent: "small_talk",
  topReplies: [
    { id: "1", label: "Hi there", text: "Hi there!" },
    { id: "2", label: "Yes please", text: "Yes please." },
    { id: "3", label: "No thanks", text: "No thanks." },
  ],
  optionGroups: [],
  memory: { lastIntent: "", lastQuestionText: "", lastOptionGroups: [] },
});

vi.mock("../api/dialogue", () => ({
  getDialogueReplies: (...args: unknown[]) => mockGetReplies(...args),
}));

const mockSpeakText = vi.fn().mockResolvedValue(undefined);
vi.mock("../api/tts", () => ({
  speakText: (...args: unknown[]) => mockSpeakText(...args),
}));

beforeEach(() => {
  mockFinalText = "";
  mockGetReplies.mockResolvedValue({
    intent: "small_talk",
    topReplies: [
      { id: "1", label: "Hi there", text: "Hi there!" },
      { id: "2", label: "Yes please", text: "Yes please." },
      { id: "3", label: "No thanks", text: "No thanks." },
    ],
    optionGroups: [],
    memory: { lastIntent: "", lastQuestionText: "", lastOptionGroups: [] },
  });
});

test("shows onboarding when no stored name", () => {
  window.localStorage.removeItem("aac_name");
  render(<ConversationPage />);
  expect(screen.getByText(/What should I call you\?/i)).toBeInTheDocument();
});

test("onboarding: submit name and speak welcome", async () => {
  const user = userEvent.setup();
  window.localStorage.removeItem("aac_name");
  render(<ConversationPage />);

  const input = screen.getByPlaceholderText(/e\.g\. Sophie/i);
  await user.type(input, "Alex");
  const continueBtn = screen.getByRole("button", { name: /continue/i });
  await user.click(continueBtn);

  await waitFor(() => expect(mockSpeakText).toHaveBeenCalledWith("Hi Alex."));
  expect(window.localStorage.getItem("aac_name")).toBe("Alex");
});

test("onboarding: test voice button speaks", async () => {
  const user = userEvent.setup();
  window.localStorage.removeItem("aac_name");
  render(<ConversationPage />);

  const testBtn = screen.getByRole("button", { name: /test voice/i });
  await user.click(testBtn);

  await waitFor(() =>
    expect(mockSpeakText).toHaveBeenCalledWith("Hello. This is your AAC device.")
  );
});

test("onboarding: continue disabled when name empty", () => {
  window.localStorage.removeItem("aac_name");
  render(<ConversationPage />);
  const continueBtn = screen.getByRole("button", { name: /continue/i });
  expect(continueBtn).toBeDisabled();
});

test("renders main conversation UI when name stored", () => {
  window.localStorage.setItem("aac_name", "Sophie");
  render(<ConversationPage />);
  expect(screen.queryByText(/What should I call you\?/i)).not.toBeInTheDocument();
});

test("location pills toggle HOME/SCHOOL/OUT", async () => {
  const user = userEvent.setup();
  window.localStorage.setItem("aac_name", "Sophie");
  render(<ConversationPage />);

  const schoolBtn = screen.getByRole("button", { name: /school/i });
  await user.click(schoolBtn);
  expect(schoolBtn).toHaveAttribute("aria-pressed", "true");

  const outBtn = screen.getByRole("button", { name: /out/i });
  await user.click(outBtn);
  expect(outBtn).toHaveAttribute("aria-pressed", "true");
});

test("clear button resets question and AI state", async () => {
  const user = userEvent.setup();
  window.localStorage.setItem("aac_name", "Sophie");
  mockFinalText = "I want water";
  mockGetReplies.mockResolvedValueOnce({
    intent: "drink",
    topReplies: [
      { id: "1", label: "Water", text: "Water please." },
      { id: "2", label: "Juice", text: "Juice please." },
      { id: "3", label: "Milk", text: "Milk please." },
    ],
    optionGroups: [{ id: "g1", title: "Drinks", items: ["water", "juice"] }],
    memory: { lastIntent: "", lastQuestionText: "", lastOptionGroups: [] },
  });

  render(<ConversationPage />);
  await waitFor(() => expect(mockGetReplies).toHaveBeenCalled(), { timeout: 500 });

  const clearBtn = screen.getByRole("button", { name: /clear/i });
  await user.click(clearBtn);
  expect(screen.getByText(/Ask a question to see choices/i)).toBeInTheDocument();
});

test("reply tile click speaks text", async () => {
  const user = userEvent.setup();
  window.localStorage.setItem("aac_name", "Sophie");
  mockFinalText = "hello";
  mockGetReplies.mockResolvedValueOnce({
    intent: "small_talk",
    topReplies: [
      { id: "1", label: "Hi there", text: "Hi there!" },
      { id: "2", label: "Yes", text: "Yes please." },
      { id: "3", label: "No", text: "No thanks." },
    ],
    optionGroups: [],
    memory: { lastIntent: "", lastQuestionText: "", lastOptionGroups: [] },
  });

  render(<ConversationPage />);
  await waitFor(() => expect(mockGetReplies).toHaveBeenCalled(), { timeout: 500 });

  const tile = await screen.findByRole("button", { name: /Hi there!/i });
  await user.click(tile);
  await waitFor(() => expect(mockSpeakText).toHaveBeenCalledWith("Hi there!"));
});

test("change name button returns to onboarding", async () => {
  const user = userEvent.setup();
  window.localStorage.setItem("aac_name", "Sophie");
  render(<ConversationPage />);

  const nameBtn = screen.getByRole("button", { name: /change name/i });
  await user.click(nameBtn);

  expect(screen.getByText(/What should I call you\?/i)).toBeInTheDocument();
  expect(window.localStorage.getItem("aac_name")).toBeNull();
});

