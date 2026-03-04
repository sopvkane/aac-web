type IconSuggestionsResponse = {
  preferredSize: string;
  suggestions: Record<string, string>;
  categories: string[];
};

export const iconsApi = {
  async getSuggestions(): Promise<IconSuggestionsResponse> {
    const res = await fetch("/api/icons/suggestions");
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
  },

  async suggestForLabel(label: string): Promise<{ label: string; iconPath: string }> {
    const res = await fetch(`/api/icons/suggest?label=${encodeURIComponent(label)}`);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
  },
};
