import * as React from "react";
import { cn } from "../../lib/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-lg border border-zinc-300 bg-white px-3 text-base " +
          "focus-visible:outline-offset-2 " +
          "min-h-11",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";