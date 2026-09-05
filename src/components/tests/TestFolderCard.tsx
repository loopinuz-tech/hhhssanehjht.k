import { motion } from "framer-motion";
import {
  Bookmark,
  BookmarkCheck,
  ChevronRight,
  Clock,
  FileText,
  Play,
  CheckCircle2,
  Trophy
} from "lucide-react";
import { parseFolderName } from "@/lib/testRoutes";
import { cn } from "@/lib/utils";

const DIFFICULTY_STYLES: Record<
  string,
  { label: string; dot: string; text: string; bg: string; border: string }
> = {
  oson: {
    label: "Oson",
    dot: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-500/10",
    border: "border-emerald-100 dark:border-emerald-500/10",
  },
  osrta: {
    label: "O'rtacha",
    dot: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-500/10",
    border: "border-amber-100 dark:border-amber-500/10",
  },
  qiyin: {
    label: "Qiyin",
    dot: "bg-rose-500",
    text: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-500/10",
    border: "border-rose-100 dark:border-rose-500/10",
  },
};

type TestFolderCardProps = {
  folder: {
    id: string;
    name: string;
    questions_count?: number;
    duration_minutes?: number;
    difficulty?: string;
  };
  progressPercent?: number;
  isBookmarked?: boolean;
  onStart: () => void;
  onViewResults?: () => void;
  onBookmark: (e: React.MouseEvent) => void;
};

export function TestFolderCard({
  folder,
  progressPercent = 0,
  isBookmarked = false,
  onStart,
  onViewResults,
  onBookmark,
}: TestFolderCardProps) {
  const { code, title } = parseFolderName(folder.name);
  const difficulty = DIFFICULTY_STYLES[folder.difficulty || "oson"] ?? DIFFICULTY_STYLES.oson;
  const questions = folder.questions_count ?? 0;
  const minutes = folder.duration_minutes ?? Math.max(5, Math.ceil(questions * 1.2));
  const isStarted = progressPercent > 0;
  const isCompleted = progressPercent >= 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col transition-colors hover:border-slate-300 dark:hover:border-slate-700 h-full"
    >
      {/* HEADER SECTION */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          {code && (
            <span 
               className="inline-block px-1.5 py-0.5 rounded text-[9px] font-medium text-white mb-1.5"
               style={{ background: "#E8192C" }}
            >
               {code}
            </span>
          )}
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white leading-snug line-clamp-2 min-h-[2.5rem]">
            {title}
          </h3>
        </div>
        <button
          onClick={onBookmark}
          className={cn(
            "p-2 rounded-xl transition-colors",
            isBookmarked 
              ? "bg-rose-50 dark:bg-rose-500/10 text-rose-500" 
              : "text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-600"
          )}
        >
          <Bookmark className={cn("w-4 h-4", isBookmarked && "fill-current")} />
        </button>
      </div>

      {/* METADATA GRID */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
           <FileText className="w-3 h-3 text-slate-400" />
           <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">{questions} ta savol</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
           <Clock className="w-3 h-3 text-slate-400" />
           <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">{minutes} daqiqa</span>
        </div>
        <div className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded-lg border", difficulty.bg, difficulty.text, difficulty.border)}>
           <div className={cn("w-1 h-1 rounded-full", difficulty.dot)} />
           <span className="text-[10px] font-medium">{difficulty.label}</span>
        </div>
      </div>

      {/* PROGRESS AREA */}
      <div className="mt-auto space-y-3">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-1">
              {isCompleted ? (
                 <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                 <span className="text-[10px] font-medium text-slate-400 tracking-wider">Progress</span>
              )}
           </div>
           <span className="text-[11px] font-semibold text-slate-900 dark:text-white tabular-nums">{progressPercent}%</span>
        </div>
        <div className="h-[3px] bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
           <motion.div 
             initial={{ width: 0 }}
             animate={{ width: `${progressPercent}%` }}
             transition={{ duration: 0.25 }}
             className="h-full rounded-full"
             style={{ background: progressPercent >= 100 ? '#10b981' : '#E8192C' }}
           />
        </div>

        <button 
          onClick={isCompleted ? onViewResults : onStart}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-medium transition-opacity active:scale-[0.98]",
            isCompleted 
              ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:opacity-90"
              : "text-white hover:opacity-90"
          )}
          style={!isCompleted ? { background: "#E8192C" } : undefined}
        >
          {isCompleted ? <Trophy className="w-3.5 h-3.5" /> : (isStarted ? <RotateCcw className="w-3.5 h-3.5 shrink-0" /> : <Play className="w-3.5 h-3.5 fill-current" />)}
          {isCompleted ? "Natijani ko'rish" : (isStarted ? "Qayta boshlash" : "Testni boshlash")}
          {!isCompleted && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
        </button>
      </div>
    </motion.div>
  );
}

function RotateCcw({ className }: { className: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}
