import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageShellProps = {
  children: ReactNode;
  className?: string;
  /** Full bleed (tests, messages) — no max-width */
  wide?: boolean;
};

/** Standard page wrapper — premium spacing & background */
export function PageShell({ children, className, wide }: PageShellProps) {
  return (
    <div
      className={cn(
        "platform-page mx-auto w-full animate-in fade-in duration-300",
        wide ? "max-w-none" : "max-w-[1400px]",
        className
      )}
    >
      {children}
    </div>
  );
}
