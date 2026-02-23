export type DialogueOptionGroup = { id: string; title: string; items: string[] };
export type DialogueReply = { id: string; label: string; text: string };

export type DialogueMemory = {
  lastIntent: string;
  lastQuestionText: string;
  lastOptionGroups: DialogueOptionGroup[];
};

export type DialogueResponse = {
  intent: string;
  topReplies: DialogueReply[];
  optionGroups: DialogueOptionGroup[];
  memory: DialogueMemory;
  debug?: Record<string, unknown>;
};

export async function getDialogueReplies(params: {
  userName: string;
  questionText: string;
  context?: Record<string, string>;
  memory?: DialogueMemory;
}): Promise<DialogueResponse> {
  const res = await fetch("/api/dialogue/replies", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}${msg ? ` - ${msg}` : ""}`);
  }

  return res.json();
}