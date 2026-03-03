import { phrasesApi } from "./phrases";
import { suggestionsApi } from "./suggestions";
import { fetchTtsAudio, speakText } from "./tts";
import { getSpeechToken } from "./speechToken";
import { authApi } from "./auth";
import { profileApi } from "./profile";
import { preferencesApi } from "./preferences";
import { caregiverApi } from "./caregiver";
import { wellbeingApi } from "./wellbeing";
import { getDialogueReplies } from "./dialogue";

const mockFetch = vi.fn();

describe("API modules", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    // @ts-expect-error override global
    global.fetch = mockFetch;
  });

  test("phrasesApi.list builds query string and parses JSON", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [{ id: "1", text: "Hi", category: "greeting", createdAt: "now" }],
    });

    const res = await phrasesApi.list({ q: "hi", category: "greeting" });

    expect(mockFetch).toHaveBeenCalledWith("/api/phrases?q=hi&category=greeting");
    expect(res[0].text).toBe("Hi");
  });

  test("authApi.login posts body and handles error", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ role: "PARENT" }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        text: async () => "bad",
      });

    const ok = await authApi.login({ role: "PARENT", pin: "1234" });
    expect(ok.role).toBe("PARENT");
    await expect(authApi.me()).rejects.toThrow(/401 Unauthorized/);
  });

  test("profileApi.get and update hit /api/carer/profile", async () => {
    const profile = { id: "p1" };
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => profile })
      .mockResolvedValueOnce({ ok: true, json: async () => profile });

    await profileApi.get();
    await profileApi.update({} as any);

    expect(mockFetch).toHaveBeenNthCalledWith(1, "/api/carer/profile");
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      "/api/carer/profile",
      expect.objectContaining({ method: "PUT" })
    );
  });

  test("preferencesApi list/create/update/remove serialise and normalise", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: 1,
            kind: "FOOD",
            label: "Apple",
            tags: "red,fruit",
            scope: "HOME",
            priority: 1,
          },
        ],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 2,
          kind: "FOOD",
          label: "Banana",
          tags: "yellow",
          scope: "HOME",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 2,
          kind: "FOOD",
          label: "Banana",
          tags: "yellow",
          scope: "HOME",
        }),
      })
      .mockResolvedValueOnce({ ok: true, text: async () => "" });

    const list = await preferencesApi.list("FOOD");
    expect(list[0].tags).toEqual(["red", "fruit"]);

    await preferencesApi.create({
      kind: "FOOD",
      label: "Banana",
      scope: "HOME",
    } as any);

    await preferencesApi.update("2", {
      kind: "FOOD",
      label: "Banana",
      scope: "HOME",
    } as any);

    await preferencesApi.remove("2");

    expect(mockFetch).toHaveBeenCalledTimes(4);
  });

  test("caregiverApi.getDashboard builds URL with period", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ since: "now" }),
    });

    await caregiverApi.getDashboard("WEEK");
    expect(mockFetch).toHaveBeenCalledWith("/api/carer/dashboard?period=WEEK");
  });

  test("wellbeingApi.recordMood and recordPain post JSON", async () => {
    mockFetch.mockResolvedValue({ ok: true, text: async () => "" });

    await wellbeingApi.recordMood(5);
    await wellbeingApi.recordPain("HEAD", 7, "note");

    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      "/api/wellbeing/mood",
      expect.objectContaining({ method: "POST" })
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      "/api/wellbeing/pain",
      expect.objectContaining({ method: "POST" })
    );
  });

  test("fetchTtsAudio and speakText call /api/tts", async () => {
    const blob = new Blob();
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () => "",
      blob: async () => blob,
    });

    const audio = await fetchTtsAudio("hi");
    expect(audio).toBe(blob);
  });

  test("getSpeechToken hits /api/speech/token", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () => "",
      json: async () => ({ token: "t", region: "r", expiresInSeconds: 10 }),
    });

    const res = await getSpeechToken();
    expect(mockFetch).toHaveBeenCalledWith("/api/speech/token");
    expect(res.token).toBe("t");
  });

  test("getDialogueReplies posts payload", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () => "",
      json: async () => ({
        intent: "test",
        topReplies: [],
        optionGroups: [],
        memory: {
          lastIntent: "",
          lastQuestionText: "",
          lastOptionGroups: [],
        },
      }),
    });

    await getDialogueReplies({
      userName: "Sophie",
      questionText: "Hello?",
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/dialogue/replies",
      expect.objectContaining({ method: "POST" })
    );
  });
});

