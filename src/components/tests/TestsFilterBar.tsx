import { SlidersHorizontal, Sparkles, TrendingUp, LayoutGrid } from "lucide-react";
import { FilterBar } from "@/components/platform";
import type { TestsBrowseFilters } from "@/lib/testRoutes";

type ActiveBadge = { key: string; label: string; onRemove: () => void };

type TestsFilterBarProps = {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filters: TestsBrowseFilters;
  onDifficultyChange: (v: TestsBrowseFilters["difficulty"]) => void;
  onPaymentToggle: (id: "free" | "paid") => void;
  onRandomToggle: () => void;
  onAttemptsToggle: () => void;
  onViewToggle: () => void;
  onClearAll: () => void;
  activeBadges: ActiveBadge[];
};

function FilterToggle({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof Sparkles;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[11px] font-semibold transition-all ${
        active
          ? "bg-primary/10 text-primary"
          : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

export function TestsFilterBar({
  searchTerm,
  onSearchChange,
  filters,
  onDifficultyChange,
  onPaymentToggle,
  onRandomToggle,
  onAttemptsToggle,
  onViewToggle,
  onClearAll,
  activeBadges,
}: TestsFilterBarProps) {
  const payment = filters.payment ?? "all";

  return (
    <FilterBar
      searchValue={searchTerm}
      onSearchChange={onSearchChange}
      searchPlaceholder="Mavzu yoki kod bo'yicha qidiring..."
      activeBadges={activeBadges}
      onClearAll={onClearAll}
      className="-mx-1 px-1"
    >
      <div className="flex items-center gap-1 rounded-xl border border-slate-100 bg-white px-2 py-1 dark:border-slate-800 dark:bg-slate-900">
        <SlidersHorizontal className="ml-1 h-3.5 w-3.5 text-slate-400" />
        <select
          value={filters.difficulty ?? "all"}
          onChange={(e) =>
            onDifficultyChange(e.target.value as TestsBrowseFilters["difficulty"])
          }
          className="cursor-pointer border-0 bg-transparent py-1.5 pr-6 text-[11px] font-semibold uppercase tracking-wide text-slate-700 focus:ring-0 dark:text-slate-200"
        >
          <option value="all">Qiyinlik</option>
          <option value="oson">Oson</option>
          <option value="osrta">O'rtacha</option>
          <option value="qiyin">Qiyin</option>
        </select>
      </div>
      {[
        { id: "free" as const, label: "Bepul" },
        { id: "paid" as const, label: "Pullik" },
      ].map((pay) => (
        <button
          key={pay.id}
          type="button"
          onClick={() => onPaymentToggle(pay.id)}
          className={`rounded-lg px-3 py-2 text-[11px] font-semibold transition-all ${
            payment === pay.id
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
              : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
          }`}
        >
          {pay.label}
        </button>
      ))}
      <FilterToggle icon={Sparkles} label="Tasodifiy" active={!!filters.random} onClick={onRandomToggle} />
      <FilterToggle
        icon={TrendingUp}
        label="Natijalar"
        active={filters.attempts !== false}
        onClick={onAttemptsToggle}
      />
      <FilterToggle
        icon={LayoutGrid}
        label="Jadval"
        active={filters.view === "list"}
        onClick={onViewToggle}
      />
    </FilterBar>
  );
}
