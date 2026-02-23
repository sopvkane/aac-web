import { phrasesApi } from "../api/phrases";

const SEED = [
  { text: "Can I have water?", category: "needs" },
  { text: "Can you help me?", category: "help" },
  { text: "I feel sore", category: "health" },
  { text: "I need the toilet", category: "needs" },
  { text: "I am hungry", category: "needs" },
  { text: "I am tired", category: "feelings" },
  { text: "Yes", category: "answers" },
  { text: "No", category: "answers" },
  { text: "Thank you", category: "social" },
  { text: "Please", category: "social" },
  { text: "I want to go home", category: "travel" },
  { text: "I want to play", category: "activity" },
];

export async function seedDemoPhrasesIfEmpty() {
  const existing = await phrasesApi.list();
  if (existing.length > 0) return;

  // Create sequentially to keep it simple and stable
  for (const p of SEED) {
    await phrasesApi.create(p);
  }
}