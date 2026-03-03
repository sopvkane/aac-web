export type Role = "PARENT" | "CARER" | "CLINICIAN";

export type MeResponse = {
  role: Role;
};

export type LoginRequest = {
  role: Role;
  pin: string;
};

export type LoginResponse = {
  role: Role;
};

