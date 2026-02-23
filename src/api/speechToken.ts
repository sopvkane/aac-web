export type SpeechTokenResponse = {
  token: string;
  region: string;
  expiresInSeconds: number;
};

export async function getSpeechToken(): Promise<SpeechTokenResponse> {
  const res = await fetch("/api/speech/token");
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}${msg ? ` - ${msg}` : ""}`);
  }
  return res.json();
}