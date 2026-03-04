import { render, screen, waitFor } from "@testing-library/react";
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
