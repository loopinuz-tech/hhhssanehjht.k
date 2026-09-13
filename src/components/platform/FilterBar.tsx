import type { ReactNode } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type FilterBadge = { key: string; label: string; onRemove: () => void };

type FilterBarProps = {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  sticky?: boolean;
  stickyTopClass?: string;
  children?: ReactNode;
  activeBadges?: FilterBadge[];
  onClearAll?: () => void;
  className?: string;
};

export function FilterBar({
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Qidirish...",
  sticky = true,
  stickyTopClass = "top-[72px] md:top-[80px]",
  children,
  activeBadges = [],
  onClearAll,
  className,
}: FilterBarProps) {
  return (
    <div
      className={cn(
        sticky && "sticky z-30 pb-3 pt-1",
        sticky && stickyTopClass,
        className
      )}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
        {(onSearchChange || children) && (
          <div className="flex flex-col gap-2 p-2 md:flex-row md:items-center">
            {onSearchChange && (
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <Search className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  type="search"
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-[13px] font-medium text-slate-800 placeholder:text-slate-400 focus:ring-0 dark:text-slate-100"
                />
              </div>
            )}
            {children && (
              <div className="flex flex-wrap items-center gap-1.5">{children}</div>
            )}
          </div>
        )}

        {activeBadges.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-3 py-2 dark:border-slate-800">
            <span className="text-[10px] font-medium tracking-wider text-slate-400">
              Filtrlar:
            </span>
            {activeBadges.map((b) => (
              <button
                key={b.key}
                type="button"
                onClick={b.onRemove}
                className="inline-flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 px-2 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                {b.label}
                <X className="h-3 w-3" />
              </button>
            ))}
            {onClearAll && (
              <button
                type="button"
                onClick={onClearAll}
                className="ml-auto text-[11px] font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                Hammasini tozalash
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
