import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import type { Role } from "../types/auth";
import { Button } from "../components/ui/button";
import { profileApi } from "../api/profile";
import type { UpdateUserProfileRequest, UserProfile } from "../types/profile";
import { preferencesApi } from "../api/preferences";
import type { PreferenceItem } from "../types/preferences";

const ROLE_LABELS: Record<Role, string> = {
  PARENT: "Parent",
  CARER: "Carer",
  CLINICIAN: "Clinician",
  SCHOOL_ADMIN: "School Admin",
  SCHOOL_TEACHER: "School Teacher",
};

export function SettingsPage() {
  const auth = useAuth();
  const [signInMode, setSignInMode] = useState<"email" | "pin">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"foods" | "activities" | "family" | "school">(
    "foods"
  );
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [foodItems, setFoodItems] = useState<PreferenceItem[]>([]);
  const [drinkItems, setDrinkItems] = useState<PreferenceItem[]>([]);
  const [activityItems, setActivityItems] = useState<PreferenceItem[]>([]);
  const [familyItems, setFamilyItems] = useState<PreferenceItem[]>([]);
  const [peerItems, setPeerItems] = useState<PreferenceItem[]>([]);
  const [teacherItems, setTeacherItems] = useState<PreferenceItem[]>([]);
  const [busStaffItems, setBusStaffItems] = useState<PreferenceItem[]>([]);
  const [subjectItems, setSubjectItems] = useState<PreferenceItem[]>([]);
  const [prefsLoading, setPrefsLoading] = useState(false);
  const [prefsError, setPrefsError] = useState<string | null>(null);
  const [newFoodLabel, setNewFoodLabel] = useState("");
  const [newFoodScope, setNewFoodScope] = useState<"HOME" | "SCHOOL" | "BOTH">("HOME");
  const [newDrinkLabel, setNewDrinkLabel] = useState("");
  const [newDrinkScope, setNewDrinkScope] = useState<"HOME" | "SCHOOL" | "BOTH">("HOME");
  const [newActivityLabel, setNewActivityLabel] = useState("");
  const [newActivityCategory, setNewActivityCategory] = useState("TV_SHOW");
  const [newActivityScope, setNewActivityScope] = useState<"HOME" | "SCHOOL" | "BOTH">("HOME");
  const [newFamilyLabel, setNewFamilyLabel] = useState("");
  const [newPeerLabel, setNewPeerLabel] = useState("");
  const [newTeacherLabel, setNewTeacherLabel] = useState("");
  const [newBusStaffLabel, setNewBusStaffLabel] = useState("");
  const [newSubjectLabel, setNewSubjectLabel] = useState("");

  useEffect(() => {
    if (auth.status !== "authenticated") return;
    const r = auth.role;
    const loadFoodsAndActivities =
      r === "PARENT" || r === "CLINICIAN" || r === "CARER";
    const loadFamily = r === "PARENT" || r === "CLINICIAN";
    const loadSchool =
      r === "PARENT" ||
      r === "CLINICIAN" ||
      r === "SCHOOL_ADMIN" ||
      r === "SCHOOL_TEACHER";

    let cancelled = false;
    const load = async () => {
      setProfileError(null);
      setPrefsError(null);
      setProfileLoading(true);
      setPrefsLoading(true);
      try {
        const fetches: Promise<unknown>[] = [profileApi.get()];
        if (loadFoodsAndActivities) {
          fetches.push(
            preferencesApi.list("FOOD"),
            preferencesApi.list("DRINK"),
            preferencesApi.list("ACTIVITY")
          );
        }
        if (loadFamily) {
          fetches.push(preferencesApi.list("FAMILY_MEMBER"));
        }
        if (loadSchool) {
          fetches.push(
            preferencesApi.list("SCHOOL_PEER"),
            preferencesApi.list("TEACHER"),
            preferencesApi.list("BUS_STAFF"),
            preferencesApi.list("SUBJECT")
          );
        }

        const results = await Promise.all(fetches);
        let idx = 0;
        const p = results[idx++] as Awaited<ReturnType<typeof profileApi.get>>;
        if (!cancelled) setProfile(p);

        if (loadFoodsAndActivities) {
          if (!cancelled) {
            setFoodItems(results[idx++] as PreferenceItem[]);
            setDrinkItems(results[idx++] as PreferenceItem[]);
            setActivityItems(results[idx++] as PreferenceItem[]);
          } else idx += 3;
        }
        if (loadFamily) {
          if (!cancelled) setFamilyItems(results[idx++] as PreferenceItem[]);
          else idx++;
        }
        if (loadSchool) {
          if (!cancelled) {
            setPeerItems(results[idx++] as PreferenceItem[]);
            setTeacherItems(results[idx++] as PreferenceItem[]);
            setBusStaffItems(results[idx++] as PreferenceItem[]);
            setSubjectItems(results[idx++] as PreferenceItem[]);
          } else idx += 4;
        }
        if (!loadFoodsAndActivities) {
          if (!cancelled) {
            setFoodItems([]);
            setDrinkItems([]);
            setActivityItems([]);
          }
        }
        if (!loadFamily && !cancelled) setFamilyItems([]);
        if (!loadSchool && !cancelled) {
          setPeerItems([]);
          setTeacherItems([]);
          setBusStaffItems([]);
          setSubjectItems([]);
        }
      } catch (err) {
        if (!cancelled) {
          setProfileError(
            err instanceof Error ? err.message : "Failed to load profile"
          );
          setPrefsError(
            err instanceof Error ? err.message : "Failed to load preferences"
          );
        }
      } finally {
        if (!cancelled) {
          setProfileLoading(false);
          setPrefsLoading(false);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [auth.status, auth.role]);

  const canEditProfile = auth.role === "PARENT" || auth.role === "CLINICIAN";
  const canEditFoodsAndActivities =
    auth.role === "PARENT" || auth.role === "CLINICIAN" || auth.role === "CARER";
  const canEditFamily = auth.role === "PARENT" || auth.role === "CLINICIAN";
  const canEditSchool =
    auth.role === "PARENT" ||
    auth.role === "CLINICIAN" ||
    auth.role === "SCHOOL_ADMIN" ||
    auth.role === "SCHOOL_TEACHER";

  const visibleTabs = [
    ...(canEditFoodsAndActivities ? (["foods", "activities"] as const) : []),
    ...(canEditFamily ? (["family"] as const) : []),
    ...(canEditSchool ? (["school"] as const) : []),
  ];
  useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.includes(activeTab)) {
      setActiveTab(visibleTabs[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only run when role changes
  }, [auth.role]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    try {
      if (signInMode === "email") {
        await auth.loginWithEmail(email, password);
        setPassword("");
      } else {
        await auth.loginWithPin(pin);
        setPin("");
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Login failed");
    }
  };

  const handleLogout = async () => {
    setLocalError(null);
    await auth.logout();
  };

  const effectiveError = localError ?? auth.error;

  const makeUpdatePayload = (): UpdateUserProfileRequest | null => {
    if (!profile) return null;
    return {
      displayName: profile.displayName,
      wakeName: profile.wakeName,
      detailsDefault: profile.detailsDefault,
      voiceDefault: profile.voiceDefault,
      aiEnabled: profile.aiEnabled,
      memoryEnabled: profile.memoryEnabled,
      analyticsEnabled: profile.analyticsEnabled,
      defaultLocation: profile.defaultLocation,
      allowHome: profile.allowHome,
      allowSchool: profile.allowSchool,
      allowWork: profile.allowWork,
      allowOther: profile.allowOther,
      maxOptions: profile.maxOptions,
      favFood: profile.favFood,
      favDrink: profile.favDrink,
      favShow: profile.favShow,
      favTopic: profile.favTopic,
      aboutUser: profile.aboutUser,
      schoolDays: profile.schoolDays,
      lunchTime: profile.lunchTime,
      dinnerTime: profile.dinnerTime,
      bedTime: profile.bedTime,
      familyNotes: profile.familyNotes,
      classmates: profile.classmates,
      teachers: profile.teachers,
      schoolActivities: profile.schoolActivities,
    };
  };

  const saveProfile = async () => {
    const body = makeUpdatePayload();
    if (!body) return;
    setProfileError(null);
    setProfileLoading(true);
    try {
      const updated = await profileApi.update(body);
      setProfile(updated);
    } catch (err) {
      setProfileError(
        err instanceof Error ? err.message : "Failed to save profile"
      );
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <header
        className="space-y-1"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <p className="text-sm font-semibold tracking-wide text-indigo-600 uppercase">
          Settings
        </p>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Caregiver & profile settings
        </h1>
      </header>

      <div className="aac-panel rounded-[28px] border-2 border-indigo-100 bg-white/70 backdrop-blur p-6 sm:p-8 shadow-[var(--shadow)] space-y-5">
        <h2 className="text-lg font-bold">Sign in</h2>

        {auth.status === "authenticated" ? (
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
            <span>
              Signed in as{" "}
              <span className="font-semibold">
                {auth.role ? ROLE_LABELS[auth.role] : "Unknown role"}
              </span>
              .
            </span>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void handleLogout()}
              disabled={auth.loading}
            >
              Log out
            </Button>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4 max-w-md">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSignInMode("email")}
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                  signInMode === "email" ? "bg-indigo-600 text-white" : "bg-indigo-50 text-slate-700"
                }`}
              >
                Email
              </button>
              <button
                type="button"
                onClick={() => setSignInMode("pin")}
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                  signInMode === "pin" ? "bg-indigo-600 text-white" : "bg-indigo-50 text-slate-700"
                }`}
              >
                PIN
              </button>
            </div>

            {signInMode === "email" ? (
              <>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Email</label>
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full aac-input px-3 py-2 text-base"
                    placeholder="you@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Password</label>
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full aac-input px-3 py-2 text-base"
                    placeholder="••••••••"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full aac-input px-3 py-2 text-base"
                  placeholder="Enter PIN"
                />
                <p className="text-xs text-slate-500">
                  PIN shared with you for this device (by parent or clinician).
                </p>
              </div>
            )}

            <Button
              type="submit"
              disabled={
                auth.loading ||
                (signInMode === "email" ? !email.trim() || !password : !pin.trim())
              }
            >
              {auth.loading ? "Signing in…" : "Sign in"}
            </Button>

            {effectiveError && (
              <div
                role="alert"
                className="mt-3 rounded-[18px] border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
              >
                {effectiveError}
              </div>
            )}
          </form>
        )}

      </div>

      {/* Only show profile editor once someone is signed in */}
      {auth.status !== "authenticated" ? (
        <div className="aac-panel rounded-[28px] border-2 border-indigo-100 bg-white/70 backdrop-blur p-6 sm:p-8 shadow-[var(--shadow)] space-y-4">
          <h2 className="text-lg font-bold">Profile details</h2>
          <p className="text-sm text-slate-600 max-w-2xl">
            Sign in above to view and edit profile (access varies by role)
            information. Access is granted on a need-to-know basis.
          </p>
        </div>
      ) : (
        <div className="aac-panel rounded-[28px] border-2 border-indigo-100 bg-white/70 backdrop-blur p-6 sm:p-8 shadow-[var(--shadow)] space-y-6">
        <h2 className="text-lg font-bold">Profile details</h2>

        {(profileError || prefsError) && (
          <div
            role="alert"
            className="rounded-[18px] border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
          >
            {profileError ?? prefsError}
          </div>
        )}

        {/* Tabs for sections - visible based on role */}
        <div className="flex flex-wrap gap-2">
          {[
            {
              id: "foods" as const,
              label: "Foods & drinks",
              visible: canEditFoodsAndActivities,
            },
            {
              id: "activities" as const,
              label: "Activities & interests",
              visible: canEditFoodsAndActivities,
            },
            { id: "family" as const, label: "Family", visible: canEditFamily },
            { id: "school" as const, label: "School", visible: canEditSchool },
          ]
            .filter((t) => t.visible)
            .map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={[
                    "rounded-full px-4 py-2 text-sm font-semibold border transition-colors",
                    active
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white/80 text-slate-800 border-indigo-100 hover:bg-indigo-50",
                  ].join(" ")}
                >
                  {tab.label}
                </button>
              );
            })}
        </div>

        <div>
          <section className="space-y-3">
            {activeTab === "foods" && (
              <>
                <h3 className="text-sm font-semibold text-slate-800">Foods & drinks</h3>
                <p className="text-xs text-slate-500">
                  Everyday favourites and things to avoid. Used to tune suggestions and prompts.
                </p>
              </>
            )}
            {activeTab === "activities" && (
              <>
                <h3 className="text-sm font-semibold text-slate-800">Activities & interests</h3>
                <p className="text-xs text-slate-500">
                  Shows, games, and hobbies that matter most to the communicator.
                </p>
              </>
            )}

            <fieldset
              className="space-y-3"
              disabled={
                (activeTab === "foods" || activeTab === "activities")
                  ? !canEditFoodsAndActivities
                  : activeTab === "family"
                    ? !canEditFamily
                    : activeTab === "school"
                      ? !canEditSchool
                      : true
              }
              aria-disabled={
                (activeTab === "foods" || activeTab === "activities")
                  ? !canEditFoodsAndActivities
                  : activeTab === "family"
                    ? !canEditFamily
                    : activeTab === "school"
                      ? !canEditSchool
                      : true
              }
            >
              {(activeTab === "foods" || activeTab === "activities") &&
                !canEditFoodsAndActivities && (
                  <p className="text-xs text-slate-500">
                    Read‑only. Ask a parent or clinician to update.
                  </p>
                )}
              {activeTab === "family" && !canEditFamily && (
                <p className="text-xs text-slate-500">
                  Family is only available to parents and clinicians.
                </p>
              )}
              {activeTab === "school" && !canEditSchool && (
                <p className="text-xs text-slate-500">
                  School is only available to parents, clinicians, and school staff.
                </p>
              )}

              {activeTab === "foods" && (
                <>
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-700">
                      Add a favourite food
                      <div className="mt-1 flex flex-wrap gap-2">
                        <input
                          className="flex-1 min-w-[120px] aac-input px-3 py-2 text-sm"
                          placeholder="e.g. banana"
                          value={newFoodLabel}
                          onChange={(e) => setNewFoodLabel(e.target.value)}
                        />
                        <select
                          className="aac-input px-2 py-2 text-xs rounded-lg border border-indigo-100 bg-white"
                          value={newFoodScope}
                          onChange={(e) => setNewFoodScope(e.target.value as "HOME" | "SCHOOL" | "BOTH")}
                        >
                          <option value="HOME">Home only</option>
                          <option value="SCHOOL">School only</option>
                          <option value="BOTH">Both</option>
                        </select>
                        <Button
                          type="button"
                          size="sm"
                          disabled={!newFoodLabel.trim() || prefsLoading || !canEditFoodsAndActivities}
                          onClick={async () => {
                            const label = newFoodLabel.trim();
                            if (!label) return;
                            try {
                              const created = await preferencesApi.create({
                                kind: "FOOD",
                                label,
                                scope: newFoodScope,
                              });
                              setFoodItems((items) => [created, ...items]);
                              setNewFoodLabel("");
                            } catch (err) {
                              setPrefsError(
                                err instanceof Error
                                  ? err.message
                                  : "Failed to add food"
                              );
                            }
                          }}
                        >
                          Add
                        </Button>
                      </div>
                    </label>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {foodItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 rounded-2xl border border-indigo-100 bg-white/80 px-3 py-2"
                      >
                        <button
                          type="button"
                          className="h-9 w-9 rounded-xl bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-700 overflow-hidden"
                          title={item.imageUrl ? "Change icon" : "Add icon"}
                          onClick={async () => {
                            if (!canEditFoodsAndActivities) return;
                            const current = item.imageUrl ?? "";
                            const next = window.prompt("Image URL for this food", current);
                            if (next === null) return;
                            try {
                              const updated = await preferencesApi.update(item.id, {
                                kind: item.kind,
                                label: item.label,
                                scope: item.scope,
                                category: item.category,
                                tags: item.tags,
                                imageUrl: next.trim() || null,
                              });
                              setFoodItems((items) =>
                                items.map((x) => (x.id === item.id ? updated : x))
                              );
                            } catch (err) {
                              setPrefsError(
                                err instanceof Error
                                  ? err.message
                                  : "Failed to update icon"
                              );
                            }
                          }}
                        >
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.label}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            item.label.charAt(0).toUpperCase()
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate">
                            {item.label}
                          </div>
                          {item.category && (
                            <div className="text-[11px] text-slate-500">
                              {item.category}
                            </div>
                          )}
                        </div>
                        {canEditFoodsAndActivities && (
                          <select
                            className="aac-input px-2 py-1 text-xs rounded-lg border border-indigo-100 bg-white"
                            value={item.scope}
                            onChange={async (e) => {
                              const scope = e.target.value as "HOME" | "SCHOOL" | "BOTH";
                              try {
                                const updated = await preferencesApi.update(item.id, {
                                  kind: item.kind,
                                  label: item.label,
                                  scope,
                                  category: item.category,
                                  tags: item.tags,
                                  imageUrl: item.imageUrl ?? null,
                                });
                                setFoodItems((items) =>
                                  items.map((x) => (x.id === item.id ? updated : x))
                                );
                              } catch (err) {
                                setPrefsError(err instanceof Error ? err.message : "Failed to update");
                              }
                            }}
                          >
                            <option value="HOME">Home</option>
                            <option value="SCHOOL">School</option>
                            <option value="BOTH">Both</option>
                          </select>
                        )}
                        {canEditFoodsAndActivities && (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await preferencesApi.remove(item.id);
                                setFoodItems((items) =>
                                  items.filter((x) => x.id !== item.id)
                                );
                              } catch (err) {
                                setPrefsError(
                                  err instanceof Error
                                    ? err.message
                                    : "Failed to delete food"
                                );
                              }
                            }}
                            className="text-xs text-rose-600 hover:text-rose-700"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    ))}
                    {!foodItems.length && (
                      <p className="text-xs text-slate-500 col-span-full">
                        No saved foods yet. Add a few favourites to make suggestions more personal.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 pt-4 border-t border-slate-100">
                    <label className="block text-xs font-semibold text-slate-700">
                      Add a favourite drink
                      <div className="mt-1 flex flex-wrap gap-2">
                        <input
                          className="flex-1 min-w-[120px] aac-input px-3 py-2 text-sm"
                          placeholder="e.g. apple juice"
                          value={newDrinkLabel}
                          onChange={(e) => setNewDrinkLabel(e.target.value)}
                        />
                        <select
                          className="aac-input px-2 py-2 text-xs rounded-lg border border-indigo-100 bg-white"
                          value={newDrinkScope}
                          onChange={(e) => setNewDrinkScope(e.target.value as "HOME" | "SCHOOL" | "BOTH")}
                        >
                          <option value="HOME">Home only</option>
                          <option value="SCHOOL">School only</option>
                          <option value="BOTH">Both</option>
                        </select>
                        <Button
                          type="button"
                          size="sm"
                          disabled={!newDrinkLabel.trim() || prefsLoading || !canEditFoodsAndActivities}
                          onClick={async () => {
                            const label = newDrinkLabel.trim();
                            if (!label) return;
                            try {
                              const created = await preferencesApi.create({
                                kind: "DRINK",
                                label,
                                scope: newDrinkScope,
                              });
                              setDrinkItems((items) => [created, ...items]);
                              setNewDrinkLabel("");
                            } catch (err) {
                              setPrefsError(
                                err instanceof Error
                                  ? err.message
                                  : "Failed to add drink"
                              );
                            }
                          }}
                        >
                          Add
                        </Button>
                      </div>
                    </label>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {drinkItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 rounded-2xl border border-indigo-100 bg-white/80 px-3 py-2"
                        >
                          <button
                            type="button"
                            className="h-9 w-9 rounded-xl bg-sky-100 flex items-center justify-center text-sm font-bold text-sky-700 overflow-hidden"
                            title={item.imageUrl ? "Change icon" : "Add icon"}
                            onClick={async () => {
                              if (!canEditFoodsAndActivities) return;
                              const current = item.imageUrl ?? "";
                              const next = window.prompt("Image URL for this drink", current);
                              if (next === null) return;
                              try {
                                const updated = await preferencesApi.update(item.id, {
                                  kind: item.kind,
                                  label: item.label,
                                  scope: item.scope,
                                  category: item.category,
                                  tags: item.tags,
                                  imageUrl: next.trim() || null,
                                });
                                setDrinkItems((items) =>
                                  items.map((x) => (x.id === item.id ? updated : x))
                                );
                              } catch (err) {
                                setPrefsError(
                                  err instanceof Error
                                    ? err.message
                                    : "Failed to update icon"
                                );
                              }
                            }}
                          >
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.label}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              item.label.charAt(0).toUpperCase()
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold truncate">
                              {item.label}
                            </div>
                            {item.category && (
                              <div className="text-[11px] text-slate-500">
                                {item.category}
                              </div>
                            )}
                          </div>
                          {canEditFoodsAndActivities && (
                            <select
                              className="aac-input px-2 py-1 text-xs rounded-lg border border-indigo-100 bg-white"
                              value={item.scope}
                              onChange={async (e) => {
                                const scope = e.target.value as "HOME" | "SCHOOL" | "BOTH";
                                try {
                                  const updated = await preferencesApi.update(item.id, {
                                    kind: item.kind,
                                    label: item.label,
                                    scope,
                                    category: item.category,
                                    tags: item.tags,
                                    imageUrl: item.imageUrl ?? null,
                                  });
                                  setDrinkItems((items) =>
                                    items.map((x) => (x.id === item.id ? updated : x))
                                  );
                                } catch (err) {
                                  setPrefsError(err instanceof Error ? err.message : "Failed to update");
                                }
                              }}
                            >
                              <option value="HOME">Home</option>
                              <option value="SCHOOL">School</option>
                              <option value="BOTH">Both</option>
                            </select>
                          )}
                          {canEditFoodsAndActivities && (
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await preferencesApi.remove(item.id);
                                  setDrinkItems((items) =>
                                    items.filter((x) => x.id !== item.id)
                                  );
                                } catch (err) {
                                  setPrefsError(
                                    err instanceof Error
                                      ? err.message
                                      : "Failed to delete drink"
                                  );
                                }
                              }}
                              className="text-xs text-rose-600 hover:text-rose-700"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      ))}
                      {!drinkItems.length && (
                        <p className="text-xs text-slate-500 col-span-full">
                          No saved drinks yet. Add a few favourites so they are easy to request.
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {activeTab === "activities" && (
                <>
                  <label className="block text-xs font-semibold text-slate-700">
                    Add an activity
                    <div className="mt-1 flex gap-2">
                      <input
                        className="flex-1 aac-input px-3 py-2 text-sm"
                        placeholder="e.g. football, drawing"
                        value={newActivityLabel}
                        onChange={(e) => setNewActivityLabel(e.target.value)}
                      />
                      <select
                        className="aac-input px-2 py-2 text-xs rounded-lg border border-indigo-100 bg-white"
                        value={newActivityCategory}
                        onChange={(e) => setNewActivityCategory(e.target.value)}
                      >
                        <option value="TV_SHOW">TV show</option>
                        <option value="MOVIE">Movie</option>
                        <option value="BOOK">Book</option>
                        <option value="GAME">Game</option>
                        <option value="HOLIDAY">Holiday</option>
                        <option value="OTHER">Other</option>
                      </select>
                      <select
                        className="aac-input px-2 py-2 text-xs rounded-lg border border-indigo-100 bg-white"
                        value={newActivityScope}
                        onChange={(e) => setNewActivityScope(e.target.value as "HOME" | "SCHOOL" | "BOTH")}
                      >
                        <option value="HOME">Home only</option>
                        <option value="SCHOOL">School only</option>
                        <option value="BOTH">Both</option>
                      </select>
                      <Button
                        type="button"
                        size="sm"
                        disabled={!newActivityLabel.trim() || prefsLoading || !canEditFoodsAndActivities}
                        onClick={async () => {
                          const label = newActivityLabel.trim();
                          if (!label) return;
                          try {
                            const created = await preferencesApi.create({
                              kind: "ACTIVITY",
                              label,
                              scope: newActivityScope,
                              category: newActivityCategory,
                            });
                            setActivityItems((items) => [created, ...items]);
                            setNewActivityLabel("");
                          } catch (err) {
                            setPrefsError(
                              err instanceof Error
                                ? err.message
                                : "Failed to add activity"
                            );
                          }
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  </label>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {activityItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 rounded-2xl border border-indigo-100 bg-white/80 px-3 py-2"
                      >
                        <button
                          type="button"
                          className="h-9 w-9 rounded-xl bg-emerald-100 flex items-center justify-center text-sm font-bold text-emerald-700 overflow-hidden"
                          title={item.imageUrl ? "Change icon" : "Add icon"}
                          onClick={async () => {
                            if (!canEditFoodsAndActivities) return;
                            const current = item.imageUrl ?? "";
                            const next = window.prompt("Image URL for this activity", current);
                            if (next === null) return;
                            try {
                              const updated = await preferencesApi.update(item.id, {
                                kind: item.kind,
                                label: item.label,
                                scope: item.scope,
                                category: item.category,
                                tags: item.tags,
                                imageUrl: next.trim() || null,
                              });
                              setActivityItems((items) =>
                                items.map((x) => (x.id === item.id ? updated : x))
                              );
                            } catch (err) {
                              setPrefsError(
                                err instanceof Error
                                  ? err.message
                                  : "Failed to update icon"
                              );
                            }
                          }}
                        >
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.label}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            item.label.charAt(0).toUpperCase()
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate">
                            {item.label}
                          </div>
                          {item.category && (
                            <div className="text-[11px] text-slate-500">
                              {item.category}
                            </div>
                          )}
                        </div>
                        {canEditFoodsAndActivities && (
                          <select
                            className="aac-input px-2 py-1 text-xs rounded-lg border border-indigo-100 bg-white"
                            value={item.scope}
                            onChange={async (e) => {
                              const scope = e.target.value as "HOME" | "SCHOOL" | "BOTH";
                              try {
                                const updated = await preferencesApi.update(item.id, {
                                  kind: item.kind,
                                  label: item.label,
                                  scope,
                                  category: item.category,
                                  tags: item.tags,
                                  imageUrl: item.imageUrl ?? null,
                                });
                                setActivityItems((items) =>
                                  items.map((x) => (x.id === item.id ? updated : x))
                                );
                              } catch (err) {
                                setPrefsError(err instanceof Error ? err.message : "Failed to update");
                              }
                            }}
                          >
                            <option value="HOME">Home</option>
                            <option value="SCHOOL">School</option>
                            <option value="BOTH">Both</option>
                          </select>
                        )}
                        {canEditFoodsAndActivities && (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await preferencesApi.remove(item.id);
                                setActivityItems((items) =>
                                  items.filter((x) => x.id !== item.id)
                                );
                              } catch (err) {
                                setPrefsError(
                                  err instanceof Error
                                    ? err.message
                                    : "Failed to delete activity"
                                );
                              }
                            }}
                            className="text-xs text-rose-600 hover:text-rose-700"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    ))}
                    {!activityItems.length && (
                      <p className="text-xs text-slate-500 col-span-full">
                        No saved activities yet. Add a few to make social options feel familiar.
                      </p>
                    )}
                  </div>
                </>
              )}
            </fieldset>
          </section>
        </div>

        <div className="grid gap-4">
          <section className="space-y-3">
            {activeTab === "family" && (
              <>
                <h3 className="text-sm font-semibold text-slate-800">
                  Family & important people
                </h3>
                <p className="text-xs text-slate-500">
                  Names and relationships the communicator uses most often (parents, siblings, carers).
                </p>
              </>
            )}

            {activeTab === "family" && (
              <fieldset
                className="space-y-3"
                disabled={!canEditFamily}
                aria-disabled={!canEditFamily}
              >
                {!canEditFamily && (
                  <p className="text-xs text-slate-500">
                    Read‑only for carers. Ask a parent or clinician to update this.
                  </p>
                )}

                <label className="block text-xs font-semibold text-slate-700">
                  Add a family member
                  <div className="mt-1 flex gap-2">
                    <input
                      className="flex-1 aac-input px-3 py-2 text-sm"
                      placeholder="e.g. Mum (Anna)"
                      value={newFamilyLabel}
                      onChange={(e) => setNewFamilyLabel(e.target.value)}
                    />
                    <Button
                      type="button"
                      size="sm"
                      disabled={!newFamilyLabel.trim() || prefsLoading || !canEditFamily}
                      onClick={async () => {
                        const label = newFamilyLabel.trim();
                        if (!label) return;
                        try {
                          const created = await preferencesApi.create({
                            kind: "FAMILY_MEMBER",
                            label,
                            scope: "HOME",
                          });
                          setFamilyItems((items) => [created, ...items]);
                          setNewFamilyLabel("");
                        } catch (err) {
                          setPrefsError(
                            err instanceof Error
                              ? err.message
                              : "Failed to add family member"
                          );
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </label>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {familyItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-2xl border border-indigo-100 bg-white/80 px-3 py-2"
                    >
                      <button
                        type="button"
                        className="h-9 w-9 rounded-xl bg-pink-100 flex items-center justify-center text-sm font-bold text-pink-700 overflow-hidden"
                        title={item.imageUrl ? "Change photo" : "Add photo"}
                        onClick={async () => {
                          if (!canEditFamily) return;
                          const current = item.imageUrl ?? "";
                          const next = window.prompt("Image URL for this person", current);
                          if (next === null) return;
                          try {
                            const updated = await preferencesApi.update(item.id, {
                              kind: item.kind,
                              label: item.label,
                              scope: item.scope,
                              category: item.category,
                              tags: item.tags,
                              imageUrl: next.trim() || null,
                            });
                            setFamilyItems((items) =>
                              items.map((x) => (x.id === item.id ? updated : x))
                            );
                          } catch (err) {
                            setPrefsError(
                              err instanceof Error
                                ? err.message
                                : "Failed to update photo"
                            );
                          }
                        }}
                      >
                          {item.imageUrl ? (
                            <img
                            src={item.imageUrl}
                            alt={item.label}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          item.label.charAt(0).toUpperCase()
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate">
                          {item.label}
                        </div>
                        {item.category && (
                          <div className="text-[11px] text-slate-500">
                            {item.category}
                          </div>
                        )}
                      </div>
                      {canEditFamily && (
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await preferencesApi.remove(item.id);
                              setFamilyItems((items) =>
                                items.filter((x) => x.id !== item.id)
                              );
                            } catch (err) {
                              setPrefsError(
                                err instanceof Error
                                  ? err.message
                                  : "Failed to delete family member"
                              );
                            }
                          }}
                          className="text-xs text-rose-600 hover:text-rose-700"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  ))}
                  {!familyItems.length && (
                    <p className="text-xs text-slate-500 col-span-full">
                      No family members saved yet. Add important people so they are easy to talk about.
                    </p>
                  )}
                </div>
              </fieldset>
            )}
          </section>

          <section className="space-y-3">
            {activeTab === "school" && (
              <>
                <h3 className="text-sm font-semibold text-slate-800">School & class</h3>
                <p className="text-xs text-slate-500">
                  Carers and teachers can keep this up to date so school conversations feel familiar.
                </p>

                <fieldset
                  className="space-y-3"
                  disabled={!(canEditSchool)}
                  aria-disabled={!(canEditSchool)}
                >
                  {!(canEditSchool) && (
                    <p className="text-xs text-slate-500">
                      Sign in with a Parent, Carer, or Clinician PIN to edit school details.
                    </p>
                  )}

                  <label className="block text-xs font-semibold text-slate-700">
                    Classmates & friends
                    <div className="mt-1 flex gap-2">
                      <input
                        className="flex-1 aac-input px-3 py-2 text-sm"
                        placeholder="e.g. Sam"
                        value={newPeerLabel}
                        onChange={(e) => setNewPeerLabel(e.target.value)}
                      />
                      <Button
                        type="button"
                        size="sm"
                        disabled={
                          !newPeerLabel.trim() || prefsLoading || !(canEditSchool)
                        }
                        onClick={async () => {
                          const label = newPeerLabel.trim();
                          if (!label) return;
                          try {
                            const created = await preferencesApi.create({
                              kind: "SCHOOL_PEER",
                              label,
                              scope: "SCHOOL",
                            });
                            setPeerItems((items) => [created, ...items]);
                            setNewPeerLabel("");
                          } catch (err) {
                            setPrefsError(
                              err instanceof Error
                                ? err.message
                                : "Failed to add classmate"
                            );
                          }
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  </label>

                  <div className="mt-2 grid gap-2">
                    {peerItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 rounded-xl border border-indigo-100 bg-white/80 px-3 py-2"
                      >
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-700">
                          {item.label.charAt(0).toUpperCase()}
                        </span>
                        <span className="flex-1 truncate text-sm">{item.label}</span>
                        {(canEditSchool) && (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await preferencesApi.remove(item.id);
                                setPeerItems((items) =>
                                  items.filter((x) => x.id !== item.id)
                                );
                              } catch (err) {
                                setPrefsError(
                                  err instanceof Error
                                    ? err.message
                                    : "Failed to delete classmate"
                                );
                              }
                            }}
                            className="text-[11px] text-rose-600 hover:text-rose-700"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    ))}
                    {!peerItems.length && (
                      <p className="text-xs text-slate-500">
                        No classmates saved yet. Carers and teachers can keep this list up to date.
                      </p>
                    )}
                  </div>

                  <label className="block text-xs font-semibold text-slate-700">
                    Teachers & staff
                    <div className="mt-1 flex gap-2">
                      <input
                        className="flex-1 aac-input px-3 py-2 text-sm"
                        placeholder="e.g. Mrs Patel"
                        value={newTeacherLabel}
                        onChange={(e) => setNewTeacherLabel(e.target.value)}
                      />
                      <Button
                        type="button"
                        size="sm"
                        disabled={
                          !newTeacherLabel.trim() || prefsLoading || !(canEditSchool)
                        }
                        onClick={async () => {
                          const label = newTeacherLabel.trim();
                          if (!label) return;
                          try {
                            const created = await preferencesApi.create({
                              kind: "TEACHER",
                              label,
                              scope: "SCHOOL",
                            });
                            setTeacherItems((items) => [created, ...items]);
                            setNewTeacherLabel("");
                          } catch (err) {
                            setPrefsError(
                              err instanceof Error
                                ? err.message
                                : "Failed to add teacher"
                            );
                          }
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  </label>

                  <div className="mt-2 grid gap-2">
                    {teacherItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 rounded-xl border border-indigo-100 bg-white/80 px-3 py-2"
                      >
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-sky-50 text-xs font-bold text-sky-700">
                          {item.label.charAt(0).toUpperCase()}
                        </span>
                        <span className="flex-1 truncate text-sm">{item.label}</span>
                        {(canEditSchool) && (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await preferencesApi.remove(item.id);
                                setTeacherItems((items) =>
                                  items.filter((x) => x.id !== item.id)
                                );
                              } catch (err) {
                                setPrefsError(
                                  err instanceof Error
                                    ? err.message
                                    : "Failed to delete teacher"
                                );
                              }
                            }}
                            className="text-[11px] text-rose-600 hover:text-rose-700"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    ))}
                    {!teacherItems.length && (
                      <p className="text-xs text-slate-500">
                        No teachers saved yet. Add key staff so they are easy to refer to.
                      </p>
                    )}
                  </div>

                  <label className="block text-xs font-semibold text-slate-700">
                    Bus driver / assistant
                    <div className="mt-1 flex gap-2">
                      <input
                        className="flex-1 aac-input px-3 py-2 text-sm"
                        placeholder="e.g. Dave (driver), Sarah (assistant)"
                        value={newBusStaffLabel}
                        onChange={(e) => setNewBusStaffLabel(e.target.value)}
                      />
                      <Button
                        type="button"
                        size="sm"
                        disabled={
                          !newBusStaffLabel.trim() || prefsLoading || !(canEditSchool)
                        }
                        onClick={async () => {
                          const label = newBusStaffLabel.trim();
                          if (!label) return;
                          try {
                            const created = await preferencesApi.create({
                              kind: "BUS_STAFF",
                              label,
                              scope: "SCHOOL",
                            });
                            setBusStaffItems((items) => [created, ...items]);
                            setNewBusStaffLabel("");
                          } catch (err) {
                            setPrefsError(
                              err instanceof Error
                                ? err.message
                                : "Failed to add bus staff"
                            );
                          }
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  </label>

                  <p className="text-[11px] text-slate-500 -mt-1">
                    Shown when the communicator is on the bus (morning and afternoon commute).
                  </p>

                  <div className="mt-2 grid gap-2">
                    {busStaffItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 rounded-xl border border-indigo-100 bg-white/80 px-3 py-2"
                      >
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-50 text-xs font-bold text-amber-700">
                          {item.label.charAt(0).toUpperCase()}
                        </span>
                        <span className="flex-1 truncate text-sm">{item.label}</span>
                        {(canEditSchool) && (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await preferencesApi.remove(item.id);
                                setBusStaffItems((items) =>
                                  items.filter((x) => x.id !== item.id)
                                );
                              } catch (err) {
                                setPrefsError(
                                  err instanceof Error
                                    ? err.message
                                    : "Failed to delete bus staff"
                                );
                              }
                            }}
                            className="text-[11px] text-rose-600 hover:text-rose-700"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    ))}
                    {!busStaffItems.length && (
                      <p className="text-xs text-slate-500">
                        No bus staff saved yet. Add driver or assistant for bus-time conversations.
                      </p>
                    )}
                  </div>

                  <label className="block text-xs font-semibold text-slate-700">
                    Subjects & school activities
                    <div className="mt-1 flex gap-2">
                      <input
                        className="flex-1 aac-input px-3 py-2 text-sm"
                        placeholder="e.g. maths, football club"
                        value={newSubjectLabel}
                        onChange={(e) => setNewSubjectLabel(e.target.value)}
                      />
                      <Button
                        type="button"
                        size="sm"
                        disabled={
                          !newSubjectLabel.trim() || prefsLoading || !(canEditSchool)
                        }
                        onClick={async () => {
                          const label = newSubjectLabel.trim();
                          if (!label) return;
                          try {
                            const created = await preferencesApi.create({
                              kind: "SUBJECT",
                              label,
                              scope: "SCHOOL",
                            });
                            setSubjectItems((items) => [created, ...items]);
                            setNewSubjectLabel("");
                          } catch (err) {
                            setPrefsError(
                              err instanceof Error
                                ? err.message
                                : "Failed to add subject/activity"
                            );
                          }
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  </label>

                  <div className="mt-2 grid gap-2">
                    {subjectItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 rounded-xl border border-indigo-100 bg-white/80 px-3 py-2"
                      >
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-700">
                          {item.label.charAt(0).toUpperCase()}
                        </span>
                        <span className="flex-1 truncate text-sm">{item.label}</span>
                        {(canEditSchool) && (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await preferencesApi.remove(item.id);
                                setSubjectItems((items) =>
                                  items.filter((x) => x.id !== item.id)
                                );
                              } catch (err) {
                                setPrefsError(
                                  err instanceof Error
                                    ? err.message
                                    : "Failed to delete subject/activity"
                                );
                              }
                            }}
                            className="text-[11px] text-rose-600 hover:text-rose-700"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    ))}
                    {!subjectItems.length && (
                      <p className="text-xs text-slate-500">
                        No subjects or activities saved yet. Add classroom topics and clubs here.
                      </p>
                    )}
                  </div>
                </fieldset>
              </>
            )}
          </section>
        </div>

        <div className="flex justify-end">
          {!canEditProfile && (
            <p className="text-xs text-slate-500 mr-4 self-center">
              Only parents and clinicians can edit profile details.
            </p>
          )}
          <Button
            type="button"
            onClick={() => void saveProfile()}
            disabled={profileLoading || !profile || !canEditProfile}
          >
            {profileLoading ? "Saving…" : "Save profile"}
          </Button>
        </div>
      </div>
      )}
    </div>
  );
}

