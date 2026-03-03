import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders main navigation tabs", () => {
  render(<App />);

  expect(screen.getByText("Speak")).toBeInTheDocument();
  expect(screen.getByText("Conversation")).toBeInTheDocument();
  expect(screen.getByText("Caregiver dashboard")).toBeInTheDocument();
  expect(screen.getByText("Settings")).toBeInTheDocument();
});
