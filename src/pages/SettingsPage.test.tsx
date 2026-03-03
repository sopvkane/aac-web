import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SettingsPage } from "./SettingsPage";
import { AuthProvider } from "../auth/AuthContext";

vi.mock("../api/profile", () => {
  const mockProfile = {
    id: "profile-1",
    displayName: "Sophie",
    wakeName: "Sophie",
    detailsDefault: true,
    voiceDefault: true,
    aiEnabled: true,
    memoryEnabled: true,
    analyticsEnabled: true,
    defaultLocation: "HOME",
    allowHome: true,
    allowSchool: true,
    allowWork: false,
    allowOther: true,
    maxOptions: 3,
    favFood: "Pizza",
    favDrink: "Juice",
    favShow: "Bluey",
    favTopic: "Animals",
    aboutUser: "About",
    schoolDays: "Mon-Fri",
    lunchTime: "12:00",
    dinnerTime: "18:00",
    bedTime: "20:00",
    familyNotes: "",
    classmates: [],
    teachers: [],
    schoolActivities: [],
    updatedAt: new Date().toISOString(),
  };

  return {
    profileApi: {
      get: vi.fn().mockResolvedValue(mockProfile),
      update: vi.fn().mockResolvedValue(mockProfile),
    },
  };
});

vi.mock("../api/preferences", () => ({
  preferencesApi: {
    list: vi.fn().mockResolvedValue([]),
  },
}));

test("renders settings header and sign-in form", async () => {
  render(
    <AuthProvider>
      <SettingsPage />
    </AuthProvider>
  );

  expect(
    await screen.findByText(/Caregiver & profile settings/i)
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Sign in/i })).toBeInTheDocument();
});

test("successful sign-in shows signed-in state", async () => {
  render(
    <AuthProvider>
      <SettingsPage />
    </AuthProvider>
  );

  const pinInput = await screen.findByPlaceholderText(/Enter your 4-digit PIN/i);
  const submit = screen.getByRole("button", { name: /Sign in/i });

  // Default role is PARENT, PIN 1234 is valid per AuthContext
  await screen.findByText(/Demo values/);

  fireEvent.change(pinInput, { target: { value: "1234" } });
  fireEvent.click(submit);

  await waitFor(() => {
    expect(screen.getByText(/Signed in as/i)).toBeInTheDocument();
  });
});

