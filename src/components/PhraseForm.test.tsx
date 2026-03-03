import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PhraseForm } from "./PhraseForm";

test("renders form with initial values", () => {
  render(
    <PhraseForm
      initialText="Hello"
      initialCategory="greeting"
      submitLabel="Save"
      onSubmit={async () => {}}
    />
  );
  expect(screen.getByLabelText(/text/i)).toHaveValue("Hello");
  expect(screen.getByLabelText(/category/i)).toHaveValue("greeting");
});

test("submit calls onSubmit with trimmed values", async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  render(
    <PhraseForm submitLabel="Create" onSubmit={onSubmit} clearOnSuccess />
  );

  await user.type(screen.getByLabelText(/text/i), "  New phrase  ");
  await user.type(screen.getByLabelText(/category/i), "  general  ");
  await user.click(screen.getByRole("button", { name: /create/i }));

  await screen.findByRole("button", { name: /create/i });
  expect(onSubmit).toHaveBeenCalledWith({ text: "New phrase", category: "general" });
});

test("submit disabled when text or category empty", () => {
  render(<PhraseForm submitLabel="Save" onSubmit={async () => {}} />);
  expect(screen.getByRole("button", { name: /save/i })).toBeDisabled();
});

test("onCancel button calls onCancel", async () => {
  const user = userEvent.setup();
  const onCancel = vi.fn();
  render(
    <PhraseForm
      initialText="Hi"
      initialCategory="g"
      submitLabel="Save"
      onSubmit={async () => {}}
      onCancel={onCancel}
    />
  );
  await user.click(screen.getByRole("button", { name: /cancel/i }));
  expect(onCancel).toHaveBeenCalled();
});

test("shows error on submit failure", async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn().mockRejectedValue(new Error("Network error"));
  render(
    <PhraseForm initialText="Hi" initialCategory="g" submitLabel="Save" onSubmit={onSubmit} />
  );
  await user.click(screen.getByRole("button", { name: /save/i }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Network error");
});
