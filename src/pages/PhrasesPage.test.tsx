import { render, screen } from "@testing-library/react";
import { PhrasesPage } from "./PhrasesPage";

vi.mock("../api/phrases", () => ({
  phrasesApi: {
    list: vi.fn().mockResolvedValue([
      {
        id: "1",
        text: "Hello",
        category: "greeting",
        createdAt: "2026-03-01T00:00:00Z",
      },
    ]),
    get: vi.fn().mockResolvedValue({
      id: "1",
      text: "Hello",
      category: "greeting",
      createdAt: "2026-03-01T00:00:00Z",
    }),
    create: vi.fn().mockResolvedValue({
      id: "2",
      text: "New phrase",
      category: "general",
      createdAt: "2026-03-01T00:00:00Z",
    }),
    update: vi.fn().mockResolvedValue({
      id: "1",
      text: "Updated",
      category: "greeting",
      createdAt: "2026-03-01T00:00:00Z",
    }),
    remove: vi.fn().mockResolvedValue(undefined),
  },
}));

test("renders phrases page and lists phrases", async () => {
  render(<PhrasesPage />);

  expect(await screen.findByText("Phrases")).toBeInTheDocument();
  expect(await screen.findByText("Hello")).toBeInTheDocument();
});

