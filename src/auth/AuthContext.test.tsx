import { renderHook, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "./AuthContext";

function renderUseAuth() {
  return renderHook(() => useAuth(), {
    wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
  });
}

describe("AuthContext", () => {
  test("login with correct PIN authenticates and sets role", async () => {
    const { result } = renderUseAuth();

    expect(result.current.status).toBe("unauthenticated");

    await act(async () => {
      await result.current.login("PARENT", "1234");
    });

    expect(result.current.status).toBe("authenticated");
    expect(result.current.role).toBe("PARENT");
    expect(result.current.error).toBeNull();
  });

  test("login with wrong PIN sets error", async () => {
    const { result } = renderUseAuth();

    await act(async () => {
      await expect(result.current.login("PARENT", "9999")).rejects.toThrow();
    });

    expect(result.current.status).toBe("unauthenticated");
    expect(result.current.role).toBeNull();
    expect(result.current.error).toBe("Invalid PIN for selected role");
  });

  test("logout clears role and status", async () => {
    const { result } = renderUseAuth();

    await act(async () => {
      await result.current.login("PARENT", "1234");
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.status).toBe("unauthenticated");
    expect(result.current.role).toBeNull();
  });
});

