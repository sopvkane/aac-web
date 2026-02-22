export type Phrase = {
  id: string;
  text: string;
  category: string;
};

export type CreatePhraseRequest = {
  text: string;
  category: string;
};

export type UpdatePhraseRequest = {
  text: string;
  category: string;
};