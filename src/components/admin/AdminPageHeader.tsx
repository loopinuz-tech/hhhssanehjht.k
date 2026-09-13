import { type LucideIcon } from "lucide-react";

interface AdminPageHeaderProps {
  icon: LucideIcon;
  label: string;
  title: string;
  description?: string;
  accent?: string;
  glow?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}

const AdminPageHeader = ({
  icon: Icon,
  label,
  title,
  description,
  badge,
  actions,
}: AdminPageHeaderProps) => {
  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl mb-5 overflow-hidden">
      <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="shrink-0 w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
            <Icon className="w-4 h-4 text-slate-500 dark:text-slate-400" strokeWidth={1.8} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{label}</p>
              {badge}
            </div>
            <h1 className="text-[15px] font-semibold text-slate-900 dark:text-white tracking-tight leading-tight">{title}</h1>
            {description && (
              <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{description}</p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-2.5 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPageHeader;
