import { getLocalTimeBucket } from "./timeBucket";

describe("getLocalTimeBucket", () => {
  test("returns MORNING for 5–11", () => {
    expect(getLocalTimeBucket(new Date(2025, 0, 1, 5, 0))).toBe("MORNING");
    expect(getLocalTimeBucket(new Date(2025, 0, 1, 11, 59))).toBe("MORNING");
    expect(getLocalTimeBucket(new Date(2025, 0, 1, 8, 30))).toBe("MORNING");
  });

  test("returns AFTERNOON for 12–16", () => {
    expect(getLocalTimeBucket(new Date(2025, 0, 1, 12, 0))).toBe("AFTERNOON");
    expect(getLocalTimeBucket(new Date(2025, 0, 1, 16, 59))).toBe("AFTERNOON");
    expect(getLocalTimeBucket(new Date(2025, 0, 1, 14, 0))).toBe("AFTERNOON");
  });

  test("returns EVENING for 17–20", () => {
    expect(getLocalTimeBucket(new Date(2025, 0, 1, 17, 0))).toBe("EVENING");
    expect(getLocalTimeBucket(new Date(2025, 0, 1, 20, 59))).toBe("EVENING");
    expect(getLocalTimeBucket(new Date(2025, 0, 1, 19, 0))).toBe("EVENING");
  });

  test("returns NIGHT for 21–04", () => {
    expect(getLocalTimeBucket(new Date(2025, 0, 1, 21, 0))).toBe("NIGHT");
    expect(getLocalTimeBucket(new Date(2025, 0, 1, 4, 59))).toBe("NIGHT");
    expect(getLocalTimeBucket(new Date(2025, 0, 1, 0, 0))).toBe("NIGHT");
  });
});
