import { useState, useRef, useEffect } from "react";
import { User } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { Button } from "./ui/button";
import { cn } from "../lib/cn";

const ROLE_LABELS: Record<string, string> = {
  PARENT: "Parent",
  CARER: "Carer",
  CLINICIAN: "Clinician",
  SCHOOL_ADMIN: "School Admin",
  SCHOOL_TEACHER: "School Teacher",
};

export function ProfileHeaderButton() {
  const auth = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  const isGuest = auth.status === "guest";
  const isAuthenticated = auth.status === "authenticated";

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => {
          if (isGuest) {
            auth.setToUnauthenticated();
          } else {
            setOpen((o) => !o);
          }
        }}
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-xl border-2 transition-colors",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
          isGuest && "border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100",
          isAuthenticated && "border-indigo-200 bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
        )}
        aria-label={isGuest ? "Sign in" : "Account menu"}
        title={isGuest ? "Sign in" : "Account"}
      >
        <User className="h-5 w-5" strokeWidth={2.5} />
      </button>

      {open && isAuthenticated && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-indigo-100 bg-white py-2 shadow-lg"
          role="menu"
        >
          <div className="px-4 py-2 text-sm text-slate-600">
            Signed in as{" "}
            <span className="font-semibold">
              {auth.role ? ROLE_LABELS[auth.role] ?? auth.role : "User"}
            </span>
          </div>
          <Button
            variant="outline"
            className="mx-2 w-[calc(100%-1rem)] justify-center"
            onClick={() => {
              void auth.logout();
              setOpen(false);
            }}
          >
            Log out
          </Button>
        </div>
      )}
    </div>
  );
}
