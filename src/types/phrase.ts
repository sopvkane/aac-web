export type Phrase = {
  id: string;
  text: string;
  category: string;
  iconUrl?: string | null;
};

export type CreatePhraseRequest = {
  text: string;
  category: string;
  iconUrl?: string | null;
};

export type UpdatePhraseRequest = {
  text: string;
  category: string;
  iconUrl?: string | null;
};