import type { ReactNode } from "react";
import { ArrowLeft, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatItem = {
  icon?: LucideIcon;
  label: string;
  value: string | number;
};

export type TabPill = { id: string; label: string };

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  icon?: LucideIcon;
  accentColor?: string;
  stats?: StatItem[];
  tabs?: TabPill[];
  activeTab?: string;
  onTabChange?: (id: string) => void;
  onBack?: () => void;
  trailing?: ReactNode;
  compact?: boolean;
  className?: string;
};

export function PageHeader({
  title,
  subtitle,
  eyebrow,
  icon: Icon,
  accentColor,
  stats = [],
  tabs,
  activeTab,
  onTabChange,
  onBack,
  trailing,
  compact,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("relative overflow-hidden p-4 sm:p-5 rounded-2xl mb-4 sm:mb-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800", className)}>
      <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          {onBack && (
            <button 
              type="button" 
              onClick={onBack} 
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              aria-label="Orqaga"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          
          {(Icon || accentColor) && (
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold text-white"
              style={{ background: accentColor || "#E8192C" }}
            >
              {Icon ? <Icon className="h-5 w-5" /> : title.charAt(0)}
            </div>
          )}
          
          <div className="min-w-0">
            {eyebrow && (
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-0.5">
                {eyebrow}
              </p>
            )}
            <h1 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-0.5 text-[12px] text-slate-500 dark:text-slate-400">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {stats.length > 0 && (
          <div className="hidden flex-wrap gap-2 md:flex">
            {stats.map((s) => (
              <div 
                key={s.label} 
                className="flex items-center gap-2 rounded-xl bg-slate-50 dark:bg-slate-800 px-3 py-1.5"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700">
                  {s.icon && <s.icon className="h-3.5 w-3.5 text-slate-500" />}
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider leading-none mb-0.5">
                    {s.label}
                  </span>
                  <span className="text-[12px] font-semibold text-slate-900 dark:text-white leading-none">
                    {s.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {(tabs && tabs.length > 0) || trailing ? (
        <div className="mt-5 flex shrink-0 flex-wrap items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800 pt-4">
          {tabs && tabs.length > 0 && (
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => onTabChange?.(tab.id)}
                    className={cn(
                      "relative px-4 py-1.5 text-[12px] font-medium rounded-lg transition-colors",
                      isActive 
                        ? "text-white" 
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    )}
                    style={isActive ? { background: accentColor || "#E8192C" } : undefined}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}
          {trailing}
        </div>
      ) : null}

      {stats.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-2 md:hidden">
          {stats.slice(0, 2).map((s) => (
            <div key={s.label} className="flex flex-col gap-1 rounded-xl bg-slate-50 dark:bg-slate-800 p-3">
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider leading-none">
                {s.label}
              </span>
              <span className="text-[15px] font-semibold text-slate-900 dark:text-white">
                {s.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </header>
  );
}
