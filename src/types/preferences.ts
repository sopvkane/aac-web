export type PreferenceKind =
  | "FOOD"
  | "DRINK"
  | "ACTIVITY"
  | "FAMILY_MEMBER"
  | "SCHOOL_PEER"
  | "TEACHER"
  | "BUS_STAFF"
  | "SUBJECT"
  | "SCHOOL_ACTIVITY";

export type PreferenceItem = {
  id: string;
  kind: PreferenceKind;
  label: string;
  category: string | null;
  tags: string[]; // parsed from comma-separated string
  imageUrl: string | null;
  scope: "HOME" | "SCHOOL" | "BOTH";
  priority: number;
};

export type PreferenceItemRequest = {
  kind: PreferenceKind;
  label: string;
  category?: string | null;
  tags?: string[]; // will be joined into a string for the API
  imageUrl?: string | null;
  scope: "HOME" | "SCHOOL" | "BOTH";
  priority?: number;
};

