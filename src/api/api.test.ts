import { phrasesApi } from "./phrases";
import { suggestionsApi } from "./suggestions";
import { fetchTtsAudio, speakText } from "./tts";
import type { UpdateUserProfileRequest } from "../types/profile";
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
    (global as { fetch: typeof fetch }).fetch = mockFetch;
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

  test("phrasesApi.list with empty params hits base URL", async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => [] });
    await phrasesApi.list();
    expect(mockFetch).toHaveBeenCalledWith("/api/phrases");
  });

  test("phrasesApi.get, create, update, remove", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "1", text: "Hi", category: "g", createdAt: "x" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "2", text: "New", category: "g", createdAt: "x" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "1", text: "Updated", category: "g", createdAt: "x" }),
      })
      .mockResolvedValueOnce({ ok: true });

    const got = await phrasesApi.get("1");
    expect(got.text).toBe("Hi");
    expect(mockFetch).toHaveBeenLastCalledWith("/api/phrases/1");

    await phrasesApi.create({ text: "New", category: "g" });
    expect(mockFetch).toHaveBeenLastCalledWith(
      "/api/phrases",
      expect.objectContaining({ method: "POST" })
    );

    await phrasesApi.update("1", { text: "Updated", category: "g" });
    expect(mockFetch).toHaveBeenLastCalledWith(
      "/api/phrases/1",
      expect.objectContaining({ method: "PUT" })
    );

    await phrasesApi.remove("1");
    expect(mockFetch).toHaveBeenLastCalledWith(
      "/api/phrases/1",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  test("phrasesApi.remove throws on error", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404, statusText: "Not Found", text: async () => "" });
    await expect(phrasesApi.remove("x")).rejects.toThrow(/404 Not Found/);
  });

  test("authApi.login posts body and handles error", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          role: "PARENT",
          activeProfileId: null,
          profileIds: [],
          profiles: [],
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        text: async () => "bad",
      });

    const ok = await authApi.login({ pin: "1234" });
    expect(ok.role).toBe("PARENT");
    await expect(authApi.me()).rejects.toThrow(/401 Unauthorized/);
  });

  test("profileApi.get and update hit /api/carer/profile", async () => {
    const profile = { id: "p1" };
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => profile })
      .mockResolvedValueOnce({ ok: true, json: async () => profile });

    await profileApi.get();
    await profileApi.update({} as UpdateUserProfileRequest);

    expect(mockFetch).toHaveBeenNthCalledWith(1, "/api/carer/profile", {
      credentials: "include",
    });
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      "/api/carer/profile",
      expect.objectContaining({ method: "PUT", credentials: "include" })
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
    });

    await preferencesApi.update("2", {
      kind: "FOOD",
      label: "Banana",
      scope: "HOME",
    });

    await preferencesApi.remove("2");

    expect(mockFetch).toHaveBeenCalledTimes(4);
  });

  test("caregiverApi.getDashboard builds URL with period", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ since: "now" }),
    });

    await caregiverApi.getDashboard("WEEK");
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/carer/dashboard?period=WEEK",
      { credentials: "include" }
    );
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

  test("fetchTtsAudio returns blob and handles voice param", async () => {
    const blob = new Blob();
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      blob: async () => blob,
    });

    const audio = await fetchTtsAudio("hi");
    expect(audio).toBe(blob);
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/tts",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ text: "hi", voice: undefined }),
      })
    );

    await fetchTtsAudio("hello", "en-GB-SoniaNeural");
    expect(mockFetch).toHaveBeenLastCalledWith(
      "/api/tts",
      expect.objectContaining({
        body: JSON.stringify({ text: "hello", voice: "en-GB-SoniaNeural" }),
      })
    );
  });

  test("fetchTtsAudio throws on error response", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Server Error",
      text: async () => "Internal error",
    });

    await expect(fetchTtsAudio("hi")).rejects.toThrow(/500 Server Error/);
  });

  test("speakText fetches audio and plays it", async () => {
    const blob = new Blob();
    mockFetch.mockResolvedValue({ ok: true, blob: async () => blob });

    const mockPlay = vi.fn().mockResolvedValue(undefined);
    const createObjectURL = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock");
    const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

    const OriginalAudio = global.Audio;
    class MockAudio {
      _onended: (() => void) | null = null;
      _onerror: (() => void) | null = null;
      play = mockPlay;
      get onended() {
        return this._onended;
      }
      set onended(fn: (() => void) | null) {
        this._onended = fn;
        if (fn) setTimeout(() => fn(), 0);
      }
      get onerror() {
        return this._onerror;
      }
      set onerror(fn: (() => void) | null) {
        this._onerror = fn;
      }
    }
    (global as unknown as { Audio: typeof MockAudio }).Audio = MockAudio;

    await speakText("hello");

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/tts",
      expect.objectContaining({ method: "POST" })
    );
    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(mockPlay).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock");

    (global as unknown as { Audio: typeof Audio }).Audio = OriginalAudio;
    createObjectURL.mockRestore();
    revokeObjectURL.mockRestore();
  });

  test("getSpeechToken hits /api/speech/token and parses response", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ token: "t", region: "r", expiresInSeconds: 10 }),
    });

    const res = await getSpeechToken();
    expect(mockFetch).toHaveBeenCalledWith("/api/speech/token");
    expect(res.token).toBe("t");
    expect(res.region).toBe("r");
    expect(res.expiresInSeconds).toBe(10);
  });

  test("getSpeechToken throws on error response", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 403,
      statusText: "Forbidden",
      text: async () => "Unauthorized",
    });

    await expect(getSpeechToken()).rejects.toThrow(/403 Forbidden/);
  });

  test("getDialogueReplies posts payload and handles context/memory", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        intent: "test",
        topReplies: [],
        optionGroups: [],
        memory: { lastIntent: "", lastQuestionText: "", lastOptionGroups: [] },
      }),
    });

    await getDialogueReplies({
      userName: "Sophie",
      questionText: "Hello?",
      context: { location: "HOME" },
      memory: { lastIntent: "", lastQuestionText: "", lastOptionGroups: [] },
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/dialogue/replies",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          userName: "Sophie",
          questionText: "Hello?",
          context: { location: "HOME" },
          memory: { lastIntent: "", lastQuestionText: "", lastOptionGroups: [] },
        }),
      })
    );
  });

  test("getDialogueReplies throws on error response", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 502,
      statusText: "Bad Gateway",
      text: async () => "Upstream error",
    });

    await expect(
      getDialogueReplies({ userName: "S", questionText: "?" })
    ).rejects.toThrow(/502 Bad Gateway/);
  });

  test("suggestionsApi.suggest posts payload", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        suggestions: [
          { phrase: { id: "1", text: "apple", category: "FOOD" }, score: 1 },
          { phrase: { id: "2", text: "banana", category: "FOOD" }, score: 1 },
        ],
        meta: { prefix: "app", timeBucket: "MORNING", locationCategory: "HOME", limit: 10 },
      }),
    });

    const res = await suggestionsApi.suggest({
      prefix: "app",
      timeBucket: "MORNING",
      locationCategory: "HOME",
    });
    expect(res.suggestions).toHaveLength(2);
    expect(res.suggestions[0]!.phrase.text).toBe("apple");
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/suggestions",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ prefix: "app", timeBucket: "MORNING", locationCategory: "HOME" }),
      })
    );
  });
});

