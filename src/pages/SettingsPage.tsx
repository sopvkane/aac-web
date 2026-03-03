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
};

export function SettingsPage() {
  const auth = useAuth();
  const [role, setRole] = useState<Role>("PARENT");
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
  const [newSubjectLabel, setNewSubjectLabel] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setProfileError(null);
      setPrefsError(null);
      setProfileLoading(true);
      setPrefsLoading(true);
      try {
        const [p, foods, drinks, activities, family, peers, teachers, subjects] = await Promise.all([
          profileApi.get(),
          preferencesApi.list("FOOD"),
          preferencesApi.list("DRINK"),
          preferencesApi.list("ACTIVITY"),
          preferencesApi.list("FAMILY_MEMBER"),
          preferencesApi.list("SCHOOL_PEER"),
          preferencesApi.list("TEACHER"),
          preferencesApi.list("SUBJECT"),
        ]);
        if (!cancelled) {
          setProfile(p);
          setFoodItems(foods);
          setDrinkItems(drinks);
          setActivityItems(activities);
          setFamilyItems(family);
          setPeerItems(peers);
          setTeacherItems(teachers);
          setSubjectItems(subjects);
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
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    try {
      await auth.login(role, pin);
      setPin("");
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Login failed");
    }
  };

  const handleLogout = async () => {
    setLocalError(null);
    await auth.logout();
  };

  const effectiveError = localError ?? auth.error;

  const canEditAll =
    auth.role === "PARENT" || auth.role === "CLINICIAN";
  const canEditSchoolOnly = auth.role === "CARER";

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
      <header className="space-y-1">
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
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Role
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="mt-1 w-full aac-input px-3 py-2 text-base"
                >
                  <option value="PARENT">Parent</option>
                  <option value="CARER">Carer</option>
                  <option value="CLINICIAN">Clinician</option>
                </select>
              </label>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                PIN
                <input
                  type="password"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="mt-1 w-full aac-input px-3 py-2 text-base"
                  placeholder="Enter your 4-digit PIN"
                />
              </label>
              <p className="text-xs text-slate-500">
                Demo values (from your .env): Parent 1234, Carer 2345, Clinician 3456.
              </p>
            </div>

            <Button type="submit" disabled={auth.loading || !pin.trim()}>
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
            Sign in with a Parent, Carer, or Clinician PIN above to view and edit profile
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

        {/* Tabs for sections */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: "foods" as const, label: "Foods & drinks" },
            { id: "activities" as const, label: "Activities & interests" },
            { id: "family" as const, label: "Family" },
            { id: "school" as const, label: "School" },
          ].map((tab) => {
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
              disabled={!canEditAll}
              aria-disabled={!canEditAll}
            >
              {!canEditAll && (
                <p className="text-xs text-slate-500">
                  Read‑only for carers. Ask a parent or clinician to update this.
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
                          onChange={(e) => setNewFoodScope(e.target.value)}
                        >
                          <option value="HOME">Home only</option>
                          <option value="SCHOOL">School only</option>
                          <option value="BOTH">Both</option>
                        </select>
                        <Button
                          type="button"
                          size="sm"
                          disabled={!newFoodLabel.trim() || prefsLoading || !canEditAll}
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
                            if (!canEditAll) return;
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
                            // eslint-disable-next-line @next/next/no-img-element
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
                        {canEditAll && (
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
                        {canEditAll && (
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
                          onChange={(e) => setNewDrinkScope(e.target.value)}
                        >
                          <option value="HOME">Home only</option>
                          <option value="SCHOOL">School only</option>
                          <option value="BOTH">Both</option>
                        </select>
                        <Button
                          type="button"
                          size="sm"
                          disabled={!newDrinkLabel.trim() || prefsLoading || !canEditAll}
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
                              if (!canEditAll) return;
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
                              // eslint-disable-next-line @next/next/no-img-element
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
                          {canEditAll && (
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
                          {canEditAll && (
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
                        className="aak-input px-2 py-2 text-xs rounded-lg border border-indigo-100 bg-white"
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
                        onChange={(e) => setNewActivityScope(e.target.value)}
                      >
                        <option value="HOME">Home only</option>
                        <option value="SCHOOL">School only</option>
                        <option value="BOTH">Both</option>
                      </select>
                      <Button
                        type="button"
                        size="sm"
                        disabled={!newActivityLabel.trim() || prefsLoading || !canEditAll}
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
                            if (!canEditAll) return;
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
                            // eslint-disable-next-line @next/next/no-img-element
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
                        {canEditAll && (
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
                        {canEditAll && (
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
                disabled={!canEditAll}
                aria-disabled={!canEditAll}
              >
                {!canEditAll && (
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
                      disabled={!newFamilyLabel.trim() || prefsLoading || !canEditAll}
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
                          if (!canEditAll) return;
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
                          // eslint-disable-next-line @next/next/no-img-element
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
                      {canEditAll && (
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
                  disabled={!(canEditAll || canEditSchoolOnly)}
                  aria-disabled={!(canEditAll || canEditSchoolOnly)}
                >
                  {!(canEditAll || canEditSchoolOnly) && (
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
                          !newPeerLabel.trim() || prefsLoading || !(canEditAll || canEditSchoolOnly)
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
                        {(canEditAll || canEditSchoolOnly) && (
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
                          !newTeacherLabel.trim() || prefsLoading || !(canEditAll || canEditSchoolOnly)
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
                        {(canEditAll || canEditSchoolOnly) && (
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
                          !newSubjectLabel.trim() || prefsLoading || !(canEditAll || canEditSchoolOnly)
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
                        {(canEditAll || canEditSchoolOnly) && (
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
          <Button
            type="button"
            onClick={() => void saveProfile()}
            disabled={profileLoading || !profile}
          >
            {profileLoading ? "Saving…" : "Save profile"}
          </Button>
        </div>
      </div>
      )}
    </div>
  );
}

