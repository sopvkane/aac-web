import { render, screen, waitFor } from "@testing-library/react";
import * as axe from "axe-core";
import { vi } from "vitest";
import App from "./App";
import { AuthProvider } from "./auth/AuthContext";
import { authApi } from "./api/auth";

vi.mock("./api/auth", () => ({
  authApi: {
    me: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
  },
}));

function renderApp() {
  return render(
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}

test("when authenticated, renders main navigation tabs", async () => {
  vi.mocked(authApi.me).mockResolvedValue({
    role: "PARENT",
    activeProfileId: null,
    profileIds: [],
    profiles: [],
  });

  renderApp();

  await waitFor(() => {
    expect(screen.getByText("Speak")).toBeInTheDocument();
  });

  expect(screen.getByText("Conversation")).toBeInTheDocument();
  expect(screen.getByText("Caregiver dashboard")).toBeInTheDocument();
  expect(screen.getByText("Settings")).toBeInTheDocument();
});

test("when unauthenticated, renders splash screen", async () => {
  vi.mocked(authApi.me).mockRejectedValue(new Error("Unauthorized"));

  renderApp();

  await waitFor(() => {
    expect(screen.getByText("Sign in with your account")).toBeInTheDocument();
  });

  expect(screen.getByText("Continue as guest")).toBeInTheDocument();
});

test("has no obvious accessibility violations on splash screen", async () => {
  vi.mocked(authApi.me).mockRejectedValue(new Error("Unauthorized"));

  renderApp();

  await waitFor(() => {
    expect(screen.getByText("Sign in with your account")).toBeInTheDocument();
  });

  const results = await axe.run(document.body, {
    rules: {
      "color-contrast": { enabled: false },
    },
  });
  expect(results.violations).toHaveLength(0);
});
