import * as Tabs from "@radix-ui/react-tabs";
import { cn } from "./lib/cn";
import { ConversationPage } from "./pages/ConversationPage";
import { PhrasesPage } from "./pages/PhrasesPage";

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

export default function App() {
  return (
    <>
      <SkipLink />

      <Tabs.Root defaultValue="conversation">
        <nav className="sticky top-0 z-40 border-b-2 border-indigo-200 bg-white/70 backdrop-blur">
          <div className="mx-auto flex max-w-[1100px] items-center justify-center p-4">
            <Tabs.List className="flex gap-3 rounded-3xl bg-indigo-50 p-2 border-2 border-indigo-100 shadow-sm">
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
                Caregiver tools
              </Tabs.Trigger>
            </Tabs.List>
          </div>
        </nav>

        <main id="main" className="mx-auto max-w-[1100px] p-6 sm:p-10">
          <Tabs.Content value="conversation">
            <div className="rounded-[28px] border-2 border-indigo-100 bg-white/70 backdrop-blur p-6 sm:p-8 shadow-[var(--shadow)]">
              <ConversationPage />
            </div>
          </Tabs.Content>

          <Tabs.Content value="caregiver">
            <div className="rounded-[28px] border-2 border-indigo-100 bg-white/70 backdrop-blur p-6 sm:p-8 shadow-[var(--shadow)]">
              <PhrasesPage />
            </div>
          </Tabs.Content>
        </main>
      </Tabs.Root>
    </>
  );
}