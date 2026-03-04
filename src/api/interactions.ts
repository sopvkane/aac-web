/**
 * Records interaction events for the caregiver dashboard (conversations stats).
 * Fire-and-forget - we don't block the UI on this.
 */
export type LocationKey = "HOME" | "SCHOOL" | "OUT" | "BUS";

export const interactionsApi = {
  async record(params: {
    eventType?: string;
    location: LocationKey;
    promptType?: string;
    selectedText?: string;
  }): Promise<void> {
    try {
      await fetch("/api/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          eventType: params.eventType ?? "OPTION_SELECTED",
          location: params.location,
          promptType: params.promptType ?? null,
          selectedText: params.selectedText ?? null,
        }),
      });
    } catch {
      // Fire-and-forget; don't break the UX
    }
  },
};
