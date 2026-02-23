import type { TimeBucket } from "../types/suggestions";

/**
 * Simple, deterministic mapping:
 * MORNING: 05:00–11:59
 * AFTERNOON: 12:00–16:59
 * EVENING: 17:00–20:59
 * NIGHT: 21:00–04:59
 */
export function getLocalTimeBucket(date = new Date()): TimeBucket {
  const h = date.getHours();
  if (h >= 5 && h <= 11) return "MORNING";
  if (h >= 12 && h <= 16) return "AFTERNOON";
  if (h >= 17 && h <= 20) return "EVENING";
  return "NIGHT";
}