export type Role = "PARENT" | "CARER" | "CLINICIAN" | "SCHOOL_ADMIN" | "SCHOOL_TEACHER";

export type ProfileSummary = { id: string; displayName: string };

export type MeResponse = {
  role: Role;
  activeProfileId: string | null;
  profileIds: string[];
  profiles: ProfileSummary[];
};

export type LoginRequest =
  | { email: string; password: string }
  | { pin: string };

export type LoginResponse = {
  role: Role;
  activeProfileId: string | null;
  profileIds: string[];
  profiles: ProfileSummary[];
};

export type RegisterRequest = {
  displayName: string;
  email: string;
  password: string;
  role: "PARENT_CARER" | "CLINICIAN";
  joiningCode: string;
};

