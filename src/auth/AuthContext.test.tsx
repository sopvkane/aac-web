import { renderHook, act, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "./AuthContext";

vi.mock("../api/auth", () => ({
  authApi: {
    me: vi.fn().mockRejectedValue(new Error("Not authenticated")),
    login: vi.fn().mockResolvedValue({
      role: "PARENT",
      activeProfileId: null,
      profileIds: [],
      profiles: [],
    }),
    register: vi.fn().mockResolvedValue({
      role: "PARENT",
      activeProfileId: null,
      profileIds: [],
      profiles: [],
    }),
    selectProfile: vi.fn().mockResolvedValue({
      role: "PARENT",
      activeProfileId: null,
      profileIds: [],
      profiles: [],
    }),
    logout: vi.fn().mockResolvedValue(undefined),
  },
}));

import { authApi } from "../api/auth";

function renderUseAuth() {
  return renderHook(() => useAuth(), {
    wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
  });
}

describe("AuthContext", () => {
  beforeEach(() => {
    vi.mocked(authApi.me).mockRejectedValue(new Error("Not authenticated"));
    vi.mocked(authApi.login).mockResolvedValue({
      role: "PARENT",
      activeProfileId: null,
      profileIds: [],
      profiles: [],
    });
    vi.mocked(authApi.logout).mockResolvedValue(undefined);
  });

  test("loginWithPin with correct PIN authenticates and sets role", async () => {
    const { result } = renderUseAuth();

    await waitFor(() => expect(result.current.status).not.toBe("unknown"));

    await act(async () => {
      await result.current.loginWithPin("1234");
    });

    expect(result.current.status).toBe("authenticated");
    expect(result.current.role).toBe("PARENT");
    expect(result.current.error).toBeNull();
  });

  test("loginWithPin with wrong PIN sets error", async () => {
    vi.mocked(authApi.login).mockRejectedValue(new Error("Invalid PIN"));
    const { result } = renderUseAuth();

    await waitFor(() => expect(result.current.status).not.toBe("unknown"));

    await act(async () => {
      await expect(result.current.loginWithPin("9999")).rejects.toThrow();
    });

    expect(result.current.status).toBe("unauthenticated");
    expect(result.current.role).toBeNull();
  });

  test("logout clears role and status", async () => {
    const { result } = renderUseAuth();

    await waitFor(() => expect(result.current.status).not.toBe("unknown"));

    await act(async () => {
      await result.current.loginWithPin("1234");
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.status).toBe("unauthenticated");
    expect(result.current.role).toBeNull();
  });

  test("continueAsGuest sets guest status", async () => {
    const { result } = renderUseAuth();

    await waitFor(() => expect(result.current.status).not.toBe("unknown"));
    expect(result.current.status).toBe("unauthenticated");

    act(() => {
      result.current.continueAsGuest();
    });

    expect(result.current.status).toBe("guest");
    expect(result.current.role).toBeNull();
  });
});

