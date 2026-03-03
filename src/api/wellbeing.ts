const handleVoid = async (res: Response): Promise<void> => {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`);
  }
};

export const wellbeingApi = {
  async recordMood(moodScore: number): Promise<void> {
    const res = await fetch("/api/wellbeing/mood", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moodScore }),
    });
    await handleVoid(res);
  },

  async recordPain(bodyArea: string, severity: number, notes?: string): Promise<void> {
    const res = await fetch("/api/wellbeing/pain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bodyArea, severity, notes }),
    });
    await handleVoid(res);
  },
};

