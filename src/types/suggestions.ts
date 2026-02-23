export type TimeBucket = "MORNING" | "AFTERNOON" | "EVENING" | "NIGHT";
export type LocationCategory = "HOME" | "SCHOOL" | "WORK" | "OTHER";

export type SuggestionsRequest = {
  prefix: string;
  timeBucket: TimeBucket;
  locationCategory: LocationCategory;
};

export type SuggestionItem = {
  phrase: {
    // treat as string in web; API may return UUID as string
    id: string;
    text: string;
    category: string;
  };
  score: number;
};

export type SuggestionsResponse = {
  suggestions: SuggestionItem[];
  meta: {
    prefix: string;
    timeBucket: TimeBucket;
    locationCategory: LocationCategory;
    limit: number;
  };
};