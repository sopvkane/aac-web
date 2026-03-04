import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SpeakPage } from "./SpeakPage";

const mockSpeakText = vi.fn().mockResolvedValue(undefined);
vi.mock("../api/tts", () => ({
  speakText: (...args: unknown[]) => mockSpeakText(...args),
}));

const { mockPrefList, mockPrefWhoToAsk } = vi.hoisted(() => ({
  mockPrefList: vi.fn().mockResolvedValue([]),
  mockPrefWhoToAsk: vi.fn().mockResolvedValue([]),
}));
vi.mock("../api/preferences", () => ({
  preferencesApi: {
    list: mockPrefList,
    whoToAsk: mockPrefWhoToAsk,
  },
}));

vi.mock("../api/wellbeing", () => ({
  wellbeingApi: {
    recordMood: vi.fn().mockResolvedValue(undefined),
    recordPain: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("../api/profile", () => ({
  profileApi: { get: vi.fn().mockResolvedValue({ maxOptions: 3 }) },
}));

beforeEach(() => {
  mockPrefList.mockResolvedValue([]);
});

test("renders quick speak section", async () => {
  render(<SpeakPage location="HOME" />);

  expect(await screen.findByText(/Tap to speak/i)).toBeInTheDocument();
  expect(screen.getByText(/Quick speak/i)).toBeInTheDocument();
});

test("option tap speaks text", async () => {
  const user = userEvent.setup();
  render(<SpeakPage location="HOME" />);

  const breakfastItems = await screen.findAllByTitle(/preview breakfast options/i);
  await user.click(breakfastItems[0]!);

  const option = await screen.findByRole("button", { name: /I'd like a drink/i });
  await user.click(option);

  await waitFor(() => expect(mockSpeakText).toHaveBeenCalled());
});

test("follow-up panel opens after option with followUp", async () => {
  const user = userEvent.setup();
  mockPrefList.mockResolvedValue([]);
  render(<SpeakPage location="HOME" />);

  const breakfastItems = await screen.findAllByTitle(/preview breakfast options/i);
  await user.click(breakfastItems[0]!);

  // Find an option that has followUp (e.g. "Drink" in BREAKFAST block)
  const drinkOption = await screen.findByRole("button", { name: /I'd like a drink/i });
  await user.click(drinkOption);

  await waitFor(() =>
    expect(screen.getByText(/What would you like to drink/i)).toBeInTheDocument()
  );

  const closeBtn = screen.getByRole("button", { name: /close/i });
  await user.click(closeBtn);
  expect(screen.queryByText(/What would you like to drink/i)).not.toBeInTheDocument();
});

test("timeline item tap previews block options", async () => {
  const user = userEvent.setup();
  render(<SpeakPage location="HOME" />);

  const breakfastItems = await screen.findAllByTitle(/preview breakfast options/i);
  await user.click(breakfastItems[0]!);

  await waitFor(() =>
    expect(screen.getByRole("heading", { name: /breakfast.*preview/i })).toBeInTheDocument()
  );

  const resetBtn = screen.getByRole("button", { name: /reset/i });
  await user.click(resetBtn);
  expect(screen.queryByRole("button", { name: /reset/i })).not.toBeInTheDocument();
});

test("pain modal opens and help now works", async () => {
  const user = userEvent.setup();
  render(<SpeakPage location="HOME" />);

  await user.click(screen.getByRole("button", { name: /I feel pain \/ help/i }));

  expect(screen.getByText(/Where does it hurt\?/i)).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /help now/i }));

  await waitFor(() => expect(mockSpeakText).toHaveBeenCalledWith("I need help now."));
  expect(screen.queryByText(/Where does it hurt\?/i)).not.toBeInTheDocument();
});

test("who to ask modal: just say it skips name", async () => {
  const user = userEvent.setup();
  mockPrefWhoToAsk.mockImplementation(async (location: string) => {
    if (location === "HOME") return [{ id: "1", label: "Mum", scope: "HOME", kind: "FAMILY_MEMBER" }];
    return [];
  });

  render(<SpeakPage location="HOME" />);

  await waitFor(() => expect(mockPrefWhoToAsk).toHaveBeenCalled());

  const breakfastItems = await screen.findAllByTitle(/preview breakfast options/i);
  await user.click(breakfastItems[0]!);

  const drinkOption = await screen.findByRole("button", { name: /I'd like a drink/i });
  await user.click(drinkOption);

  await waitFor(() => expect(screen.getByText(/Who do you want to ask\?/i)).toBeInTheDocument());

  await user.click(screen.getByRole("button", { name: /just say it \(no name\)/i }));

  await waitFor(() => expect(mockSpeakText).toHaveBeenCalledWith("I'd like a drink."));
});

test("who to ask modal when family members and askWho option", async () => {
  const user = userEvent.setup();
  mockPrefWhoToAsk.mockImplementation(async (location: string) => {
    if (location === "HOME") return [{ id: "1", label: "Mum", scope: "HOME", kind: "FAMILY_MEMBER" }];
    return [];
  });

  render(<SpeakPage location="HOME" />);

  await waitFor(() => expect(mockPrefWhoToAsk).toHaveBeenCalled());

  const breakfastItems = await screen.findAllByTitle(/preview breakfast options/i);
  await user.click(breakfastItems[0]!);

  const drinkOption = await screen.findByRole("button", { name: /I'd like a drink/i });
  await user.click(drinkOption);

  await waitFor(() =>
    expect(screen.getByText(/Who do you want to ask\?/i)).toBeInTheDocument()
  );

  const mumBtn = screen.getByRole("button", { name: /mum/i });
  await user.click(mumBtn);

  await waitFor(() =>
    expect(mockSpeakText).toHaveBeenLastCalledWith("Mum, i'd like a drink.")
  );
});

