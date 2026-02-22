import * as React from "react";
import * as Select from "@radix-ui/react-select";
import { cn } from "../../lib/cn";

export function SelectRoot(props: Select.SelectProps) {
  return <Select.Root {...props} />;
}

export const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  Select.SelectTriggerProps
>(({ className, children, ...props }, ref) => (
  <Select.Trigger
    ref={ref}
    className={cn(
      "inline-flex w-full items-center justify-between gap-2 rounded-lg border border-zinc-300 bg-white px-3 text-base " +
        "focus-visible:outline-offset-2 min-h-11",
      className
    )}
    {...props}
  >
    {/* Children rendered inside the Trigger */}
    <span className="truncate">{children}</span>
    <Select.Icon aria-hidden className="opacity-70">
      ▾
    </Select.Icon>
  </Select.Trigger>
));
SelectTrigger.displayName = "SelectTrigger";

export const SelectContent = React.forwardRef<
  HTMLDivElement,
  Select.SelectContentProps
>(({ className, ...props }, ref) => (
  <Select.Portal>
    <Select.Content
      ref={ref}
      className={cn(
        "z-50 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-md",
        className
      )}
      {...props}
    >
      <Select.Viewport className="p-1" />
    </Select.Content>
  </Select.Portal>
));
SelectContent.displayName = "SelectContent";

export const SelectItem = React.forwardRef<
  HTMLDivElement,
  Select.SelectItemProps
>(({ className, children, ...props }, ref) => (
  <Select.Item
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center rounded-md px-3 py-2 text-base outline-none " +
        "focus:bg-zinc-100 data-disabled:pointer-events-none data-disabled:opacity-50",
      className
    )}
    {...props}
  >
    <Select.ItemText>{children}</Select.ItemText>
  </Select.Item>
));
SelectItem.displayName = "SelectItem";