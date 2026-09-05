import type { LucideIcon } from "lucide-react";
import { Search } from "lucide-react";

type EmptyStateProps = {
  title?: string;
  description?: string;
  icon?: LucideIcon;
};

export function EmptyState({
  title = "Ma'lumot topilmadi",
  description,
  icon: Icon = Search,
}: EmptyStateProps) {
  return (
    <div className="platform-empty">
      <Icon className="mx-auto h-10 w-10 text-slate-300" />
      <p className="mt-3 text-[14px] font-medium text-slate-500">{title}</p>
      {description && (
        <p className="mt-1 text-[13px] text-slate-400">{description}</p>
      )}
    </div>
  );
}
