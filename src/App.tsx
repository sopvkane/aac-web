import * as Tabs from "@radix-ui/react-tabs";
import { cn } from "./lib/cn";
import { useAuth } from "./auth/AuthContext";
import { SplashScreen } from "./pages/SplashScreen";
import { ConversationPage } from "./pages/ConversationPage";
import { SpeakPage } from "./pages/SpeakPage";
import { CaregiverDashboardPage } from "./pages/CaregiverDashboardPage";
import { SettingsPage } from "./pages/SettingsPage";
import { IconMappingSection } from "./components/IconMappingSection";
import { ProfileHeaderButton } from "./components/ProfileHeaderButton";

function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-2xl focus:bg-white focus:px-5 focus:py-3 focus:shadow-lg"
    >
      Skip to main content
    </a>
  );
}

function MainApp() {
  return (
    <Tabs.Root defaultValue="speak">
        <nav className="sticky top-0 z-40 border-b-2 border-indigo-200 bg-white/70 backdrop-blur">
          <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-4 px-3 py-4 sm:px-6">
            <Tabs.List className="flex flex-1 justify-center gap-3 rounded-3xl bg-indigo-50 p-2 border-2 border-indigo-100 shadow-sm">
              <Tabs.Trigger
                value="speak"
                className={cn(
                  "min-h-[56px] rounded-2xl px-8 text-lg font-extrabold transition",
                  "data-[state=active]:bg-indigo-600 data-[state=active]:text-white",
                  "data-[state=inactive]:bg-white data-[state=inactive]:text-zinc-900",
                  "border-2 border-transparent data-[state=inactive]:border-indigo-100",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                )}
              >
                Speak
              </Tabs.Trigger>

              <Tabs.Trigger
                value="conversation"
                className={cn(
                  "min-h-[56px] rounded-2xl px-8 text-lg font-extrabold transition",
                  "data-[state=active]:bg-indigo-600 data-[state=active]:text-white",
                  "data-[state=inactive]:bg-white data-[state=inactive]:text-zinc-900",
                  "border-2 border-transparent data-[state=inactive]:border-indigo-100",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                )}
              >
                Conversation
              </Tabs.Trigger>

              <Tabs.Trigger
                value="caregiver"
                className={cn(
                  "min-h-[56px] rounded-2xl px-8 text-lg font-extrabold transition",
                  "data-[state=active]:bg-indigo-600 data-[state=active]:text-white",
                  "data-[state=inactive]:bg-white data-[state=inactive]:text-zinc-900",
                  "border-2 border-transparent data-[state=inactive]:border-indigo-100",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                )}
              >
                Caregiver dashboard
              </Tabs.Trigger>

              <Tabs.Trigger
                value="settings"
                className={cn(
                  "min-h-[56px] rounded-2xl px-8 text-lg font-extrabold transition",
                  "data-[state=active]:bg-indigo-600 data-[state=active]:text-white",
                  "data-[state=inactive]:bg-white data-[state=inactive]:text-zinc-900",
                  "border-2 border-transparent data-[state=inactive]:border-indigo-100",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                )}
              >
                Settings
              </Tabs.Trigger>
            </Tabs.List>
            <ProfileHeaderButton />
          </div>
        </nav>

        <main id="main" className="mx-auto w-full max-w-[1400px] px-3 py-6 sm:px-6 sm:py-10">
          <Tabs.Content value="speak">
            <div className="rounded-[28px] border-2 border-indigo-100 bg-white/70 backdrop-blur p-6 sm:p-8 shadow-[var(--shadow)]">
              <SpeakPage />
            </div>
          </Tabs.Content>

          <Tabs.Content value="conversation">
            <div className="rounded-[28px] border-2 border-indigo-100 bg-white/70 backdrop-blur p-6 sm:p-8 shadow-[var(--shadow)]">
              <ConversationPage />
            </div>
          </Tabs.Content>

          <Tabs.Content value="caregiver">
            <div className="rounded-[28px] border-2 border-indigo-100 bg-white/70 backdrop-blur p-6 sm:p-8 shadow-[var(--shadow)]">
              <CaregiverDashboardPage />
            </div>
          </Tabs.Content>

          <Tabs.Content value="settings">
            <div className="space-y-6">
              <div className="rounded-[28px] border-2 border-indigo-100 bg-white/70 backdrop-blur p-6 sm:p-8 shadow-[var(--shadow)]">
                <SettingsPage />
              </div>
              <div className="rounded-[28px] border-2 border-indigo-100 bg-white/70 backdrop-blur p-6 sm:p-8 shadow-[var(--shadow)]">
                <IconMappingSection />
              </div>
            </div>
          </Tabs.Content>
        </main>
      </Tabs.Root>
  );
}

export default function App() {
  const auth = useAuth();

  if (auth.loading && auth.status === "unknown") {
    return (
      <>
        <SkipLink />
        <main id="main" className="mx-auto w-full max-w-[1400px] px-3 py-6 sm:px-6 sm:py-10">
          <div className="flex min-h-screen items-center justify-center" role="status" aria-label="Loading">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
          </div>
        </main>
      </>
    );
  }

  if (auth.status === "unauthenticated") {
    return (
      <>
        <SkipLink />
        <main id="main" className="mx-auto w-full max-w-[1400px] px-3 py-6 sm:px-6 sm:py-10">
          <SplashScreen />
        </main>
      </>
    );
  }

  return (
    <>
      <SkipLink />
      <MainApp />
    </>
  );
}
