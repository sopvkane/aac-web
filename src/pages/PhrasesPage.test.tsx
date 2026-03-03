import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PhrasesPage } from "./PhrasesPage";

const mockList = vi.fn().mockResolvedValue([
  { id: "1", text: "Hello", category: "greeting", createdAt: "2026-03-01T00:00:00Z" },
]);
const mockGet = vi.fn().mockResolvedValue({
  id: "1",
  text: "Hello",
  category: "greeting",
  createdAt: "2026-03-01T00:00:00Z",
});
const mockCreate = vi.fn().mockResolvedValue({
  id: "2",
  text: "New phrase",
  category: "general",
  createdAt: "2026-03-01T00:00:00Z",
});
const mockUpdate = vi.fn().mockResolvedValue({
  id: "1",
  text: "Updated",
  category: "greeting",
  createdAt: "2026-03-01T00:00:00Z",
});
const mockRemove = vi.fn().mockResolvedValue(undefined);

vi.mock("../api/phrases", () => ({
  phrasesApi: {
    list: (...args: unknown[]) => mockList(...args),
    get: (...args: unknown[]) => mockGet(...args),
    create: (...args: unknown[]) => mockCreate(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
    remove: (...args: unknown[]) => mockRemove(...args),
  },
}));

beforeEach(() => {
  mockList.mockResolvedValue([
    { id: "1", text: "Hello", category: "greeting", createdAt: "2026-03-01T00:00:00Z" },
  ]);
});

test("renders phrases page and lists phrases", async () => {
  render(<PhrasesPage />);

  expect(await screen.findByText("Phrases")).toBeInTheDocument();
  expect(await screen.findByText("Hello")).toBeInTheDocument();
});

test("create phrase flow", async () => {
  const user = userEvent.setup();
  render(<PhrasesPage />);

  await screen.findByText("Hello");

  const createSection = screen.getByRole("heading", { name: /create phrase/i }).closest("section")!;
  await user.type(within(createSection).getByLabelText(/^text$/i), "New phrase");
  await user.type(within(createSection).getByLabelText(/^category$/i), "general");
  await user.click(screen.getByRole("button", { name: /create/i }));

  await waitFor(() => expect(mockCreate).toHaveBeenCalledWith({ text: "New phrase", category: "general" }));
  expect(screen.getByText(/phrase created/i)).toBeInTheDocument();
});

test("edit phrase flow", async () => {
  const user = userEvent.setup();
  render(<PhrasesPage />);

  const editBtn = await screen.findByRole("button", { name: /edit/i });
  await user.click(editBtn);

  const textInput = await screen.findByLabelText(/^text$/i, {}, { timeout: 1000 });
  await waitFor(() => expect(textInput).toHaveValue("Hello"));

  await user.clear(textInput);
  await user.type(textInput, "Updated");
  await user.click(screen.getByRole("button", { name: /save changes/i }));

  await waitFor(() => expect(mockUpdate).toHaveBeenCalledWith("1", { text: "Updated", category: "greeting" }));
  expect(screen.getByText(/phrase updated/i)).toBeInTheDocument();
});

test("delete phrase with confirm", async () => {
  const user = userEvent.setup();
  vi.stubGlobal("confirm", vi.fn(() => true));
  render(<PhrasesPage />);

  const deleteBtn = await screen.findByRole("button", { name: /delete phrase hello/i });
  await user.click(deleteBtn);

  expect(mockRemove).toHaveBeenCalledWith("1");
  expect(screen.getByText(/phrase deleted/i)).toBeInTheDocument();
});

test("delete phrase cancel does nothing", async () => {
  const user = userEvent.setup();
  const confirmFn = vi.fn().mockReturnValue(false);
  vi.stubGlobal("confirm", confirmFn);
  render(<PhrasesPage />);

  const deleteBtn = await screen.findByRole("button", { name: /delete phrase hello/i });
  mockRemove.mockClear();
  await user.click(deleteBtn);

  expect(confirmFn).toHaveBeenCalled();
  expect(mockRemove).not.toHaveBeenCalled();
});

test("refresh button reloads list", async () => {
  const user = userEvent.setup();
  render(<PhrasesPage />);

  await screen.findByText("Hello");
  const countBefore = mockList.mock.calls.length;
  await user.click(screen.getByRole("button", { name: /refresh/i }));

  await waitFor(() => expect(mockList.mock.calls.length).toBeGreaterThan(countBefore));
});

