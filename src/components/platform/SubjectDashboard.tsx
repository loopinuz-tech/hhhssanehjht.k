import {
   ChevronRight, ArrowRight, BookOpen, Zap, CheckCircle2,
   Brain, Binary, Compass, History, FlaskConical, Layers,
   Award, BarChart2, RotateCcw, Lightbulb, TrendingUp, Plus
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

import { CompassBigIcon } from "@solar-icons/react/bold-duotone/compass-big";
import { CodeSquareIcon } from "@solar-icons/react/bold-duotone/code-square";
import { DnaIcon } from "@solar-icons/react/bold-duotone/dna";
import { Book2Icon } from "@solar-icons/react/bold-duotone/book-2";
import { HistoryIcon } from "@solar-icons/react/bold-duotone/history";
import { AtomIcon } from "@solar-icons/react/bold-duotone/atom";
import { BookBookmarkIcon } from "@solar-icons/react/bold-duotone/book-bookmark";

interface SubjectDashboardProps {
   onSelectSubject: (subject: string) => void;
}

const RED = "#E8192C";

const subjectMeta: Record<string, { icon: any; accent: string; bg: string }> = {
   "Matematika": { icon: CompassBigIcon, accent: "#0891b2", bg: "#ecfeff" },
   "Informatika": { icon: CodeSquareIcon, accent: "#7c3aed", bg: "#f5f3ff" },
   "Biologiya": { icon: DnaIcon, accent: "#10b981", bg: "#ecfdf5" },
   "Ona tili": { icon: Book2Icon, accent: "#d97706", bg: "#fffbeb" },
   "Tarix": { icon: HistoryIcon, accent: "#dc2626", bg: "#fef2f2" },
   "Fizika": { icon: AtomIcon, accent: "#0891b2", bg: "#ecfeff" },
   "Adabiyot": { icon: BookBookmarkIcon, accent: "#9333ea", bg: "#faf5ff" },
};

const subjectImageMap: Record<string, string> = {
   "Matematika": "/testmath.png",
   "Informatika": "/testinfo.png",
   "Biologiya": "/testbio.png",
   "Ona tili": "/testona.png",
   "Tarix": "/testhis.png",
   "Fizika": "/testphy.png",
   "Adabiyot": "/testadab.png",
};

const SubjectDashboard = ({ onSelectSubject }: SubjectDashboardProps) => {
   const { t } = useTranslation();
   const { user } = useAuth();
   const navigate = useNavigate();

   const { data: dbSubjects } = useQuery({
      queryKey: ["active-subjects"],
      queryFn: async () => {
         const { data, error } = await supabase
            .from("subjects" as any)
            .select("*")
            .eq("is_active", true)
            .order("order_number");
      return data || [];
   },
   });

const { data: subjectStats } = useQuery({
   queryKey: ["subject-stats-dashboard-minimal"],
   queryFn: async () => {
      const { data } = await supabase
         .from("test_folders")
         .select("subject, questions_count, id")
         .eq("is_active", true);
      const stats: Record<string, { totalQuestions: number; folderIds: string[]; folderCount: number }> = {};
      data?.forEach((f: any) => {
         const sub = f.subject || "Informatika";
         if (!stats[sub]) stats[sub] = { totalQuestions: 0, folderIds: [], folderCount: 0 };
         stats[sub].totalQuestions += (f.questions_count || 0);
         stats[sub].folderIds.push(f.id);
         stats[sub].folderCount += 1;
      });
      return stats;
   },
});

const { data: userProgress } = useQuery({
   queryKey: ["user-subject-progress", user?.id],
   queryFn: async () => {
      if (!user) return {};
      const { data } = await supabase
         .from("test_sessions")
         .select("folder_id, score")
         .eq("user_id", user.id)
         .not("finished_at", "is", null);
      const progress: Record<string, { solved: number; maxScore: number }> = {};
      (data || []).forEach((s: any) => {
         if (!progress[s.folder_id]) progress[s.folder_id] = { solved: 1, maxScore: s.score || 0 };
         else {
            progress[s.folder_id].solved++;
            progress[s.folder_id].maxScore = Math.max(progress[s.folder_id].maxScore, s.score || 0);
         }
      });
      return progress;
   },
   enabled: !!user,
});

const { data: globalStats } = useQuery({
   queryKey: ["user-global-stats-minimal-v4", user?.id],
   queryFn: async () => {
      if (!user) return {
         totalSolved: 0, totalCorrect: 0, totalIncorrect: 0,
         accuracy: 0, activeDays: 0, purchasedCount: 0,
         recentSessions: [], avgScore: 0, bestSubject: "", platformTotal: 0,
      };
      const sessionsRes = await supabase
         .from("test_sessions")
         .select("score, total_questions, correct_answers, finished_at, folder_id, test_folders(name, subject)")
         .eq("user_id", user.id)
         .not("finished_at", "is", null)
         .order("finished_at", { ascending: false });
      const { count: platformTotal } = await supabase
         .from("test_folders")
         .select("*", { count: "exact", head: true })
         .eq("is_active", true);
      const data = sessionsRes.data || [];
      const totalSolved = data.length;
      const totalCorrect = data.reduce((acc, s) => acc + (s.correct_answers || 0), 0);
      const totalQs = data.reduce((acc, s) => acc + (s.total_questions || 0), 0);
      const totalIncorrect = totalQs - totalCorrect;
      const accuracy = totalQs > 0 ? Math.round((totalCorrect / totalQs) * 100) : 0;
      const uniqueDays = new Set(data.map(s => new Date(s.finished_at!).toLocaleDateString())).size;
      const avgScore = totalSolved > 0 ? Math.round(data.reduce((acc, s) => acc + (s.score || 0), 0) / totalSolved) : 0;
      const subAcc: Record<string, { total: number; count: number }> = {};
      data.forEach(s => {
         const sub = (s.test_folders as any)?.subject || "Boshqa";
         if (!subAcc[sub]) subAcc[sub] = { total: 0, count: 0 };
         subAcc[sub].total += s.score || 0;
         subAcc[sub].count += 1;
      });
      let bestSub = "", bestVal = -1;
      Object.entries(subAcc).forEach(([sub, val]) => {
         const avg = val.total / val.count;
         if (avg > bestVal) { bestVal = avg; bestSub = sub; }
      });
      return {
         totalSolved, totalCorrect, totalIncorrect, accuracy,
         activeDays: uniqueDays, purchasedCount: new Set(data.map(s => s.folder_id)).size,
         recentSessions: data.slice(0, 5), avgScore, bestSubject: bestSub,
         platformTotal: platformTotal || 0,
      };
   },
   enabled: !!user,
});

const { data: weakPoints } = useQuery({
   queryKey: ["weak-points-minimal-v2", user?.id],
   queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
         .from("test_sessions")
         .select("folder_id, score, test_folders(name, subject)")
         .eq("user_id", user.id)
         .not("finished_at", "is", null)
         .lt("score", 60)
         .order("score", { ascending: true })
         .limit(4);
      return data || [];
   },
   enabled: !!user,
});

const getSubjectQuestions = (name: string) => subjectStats?.[name]?.totalQuestions || 0;
const getSubjectFolderCount = (name: string) => subjectStats?.[name]?.folderCount || 0;
const getSubjectProgress = (name: string) => {
   if (!subjectStats?.[name] || !userProgress) return 0;
   const ids = subjectStats[name].folderIds;
   if (!ids.length) return 0;
   return Math.round((ids.filter(id => userProgress[id]).length / ids.length) * 100);
};

const mainSubject = "Matematika";
const mathQuestions = getSubjectQuestions(mainSubject);
const mathProgress = getSubjectProgress(mainSubject);
const accuracy = globalStats?.accuracy || 0;
const totalAnswers = (globalStats?.totalCorrect || 0) + (globalStats?.totalIncorrect || 0);
const correctPct = totalAnswers > 0 ? Math.round(((globalStats?.totalCorrect || 0) / totalAnswers) * 100) : 0;

return (
   <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 sm:pb-8 space-y-5">

      {/* ── ROW 1: Hero + Stats ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_240px] gap-4">

         {/* Hero */}
         <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden min-h-[180px]">
            {/* Decorative image */}
            <div
               className="absolute right-0 top-0 bottom-0 w-48 bg-no-repeat bg-right-center opacity-10 sm:opacity-40 pointer-events-none"
               style={{ backgroundImage: "url('/testbg.png')", backgroundSize: "contain", backgroundPosition: "right center" }}
            />
            <div className="relative z-10 flex flex-col justify-center h-full px-6 py-6 sm:py-7">
               <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium mb-3 w-fit" style={{ background: "#fff0f0", color: RED }}>
                  <Zap className="w-3 h-3" /> Tavsiya
               </span>
               <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white mb-1.5">{mainSubject}</h2>
               <p className="text-[12px] text-slate-500 mb-5 max-w-xs">Bilimingizni tizimlash uchun eng yaxshi fan</p>
               <div className="flex flex-wrap items-center gap-5 sm:gap-7">
                  <div className="flex items-center gap-5">
                     <div>
                        <p className="text-[10px] text-slate-400 mb-0.5">Savollar</p>
                        <p className="text-[15px] font-semibold text-slate-900 dark:text-white">{mathQuestions.toLocaleString()}</p>
                     </div>
                     <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />
                     <div>
                        <p className="text-[10px] text-slate-400 mb-0.5">Progress</p>
                        <p className="text-[15px] font-semibold text-slate-900 dark:text-white">
                           {mathProgress}%
                        </p>
                     </div>
                  </div>
                  <button
                     onClick={() => navigate("/tests/builder")}
                     className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-medium text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
                     style={{ background: RED }}
                  >
                     <Plus className="w-3.5 h-3.5" /> Test yaratish
                  </button>
               </div>
            </div>
         </div>

         {/* Stats chip */}
         <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
               <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-slate-400" /> Muvaffaqiyat
               </p>
               <span className="text-[11px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                  {globalStats?.activeDays || 0} kun
               </span>
            </div>
            <div className="flex items-center gap-4">
               {/* Accuracy ring */}
               <div className="relative w-12 h-12 shrink-0">
                  <svg viewBox="0 0 48 48" className="w-full h-full -rotate-90">
                     <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="none" className="text-slate-100 dark:text-slate-800" />
                     <circle
                        cx="24" cy="24" r="20" stroke={RED} strokeWidth="4" fill="none"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 20}`}
                        strokeDashoffset={`${2 * Math.PI * 20 * (1 - accuracy / 100)}`}
                     />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-slate-900 dark:text-white">
                     {accuracy}%
                  </div>
               </div>
               <div>
                  <p className="text-[10px] text-slate-400 mb-0.5">Jami testlar</p>
                  <p className="text-2xl font-semibold text-slate-900 dark:text-white leading-none">{globalStats?.totalSolved || 0}</p>
               </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
               <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                  <p className="text-[10px] text-slate-400 mb-0.5">To'g'ri</p>
                  <p className="text-[14px] font-semibold text-green-600">{globalStats?.totalCorrect || 0}</p>
               </div>
               <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                  <p className="text-[10px] text-slate-400 mb-0.5">Xato</p>
                  <p className="text-[14px] font-semibold" style={{ color: RED }}>{globalStats?.totalIncorrect || 0}</p>
               </div>
            </div>
         </div>
      </div>

      {/* ── ROW 2: Subject Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
         {(dbSubjects as any[] || []).map((sub: any) => {
            const meta = subjectMeta[sub.name] || { icon: BookOpen, accent: "#94a3b8", bg: "#f8fafc" };
            const Icon = meta.icon;
            const questions = getSubjectQuestions(sub.name);
            const folderCount = getSubjectFolderCount(sub.name);
            const progress = getSubjectProgress(sub.name);
            const imgUrl = subjectImageMap[sub.name];

            return (
               <div
                  key={sub.name}
                  onClick={() => onSelectSubject(sub.name)}
                  className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors overflow-hidden"
                  style={{ minHeight: 160 }}
               >
                  {/* Subject image — decorative */}
                  {imgUrl && (
                     <div className="absolute right-0 bottom-0 w-24 h-24 pointer-events-none opacity-20 dark:opacity-10">
                        <img src={imgUrl} alt="" className="w-full h-full object-contain" />
                     </div>
                  )}

                  <div className="relative z-10 flex flex-col h-full">
                     <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 shrink-0"
                        style={{ background: meta.bg }}
                     >
                        <Icon className="w-4 h-4" style={{ color: meta.accent }} />
                     </div>

                     <p className="text-[14px] font-semibold text-slate-900 dark:text-white mb-1">{sub.name}</p>
                     <p className="text-[11px] text-slate-400 mb-4">
                        {folderCount} test · {questions} savol
                     </p>

                     {/* Progress bar */}
                     <div className="mt-auto space-y-1.5">
                        <div className="flex items-center justify-between">
                           <span className="text-[11px] text-slate-400">Progress</span>
                           <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">{progress}%</span>
                        </div>
                        <div className="h-[3px] bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                           <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${progress}%`, background: progress > 0 ? meta.accent : "transparent" }}
                           />
                        </div>
                     </div>
                  </div>
               </div>
            );
         })}
      </div>

      {/* ── ROW 3: Analytics + Recommendations ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

         {/* Analytics */}
         <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-5">
               <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <BarChart2 className="w-4 h-4 text-slate-500" />
               </div>
               <div>
                  <p className="text-[13px] font-medium text-slate-800 dark:text-white">Natijalar tahlili</p>
                  <p className="text-[11px] text-slate-400">Haqiqiy vaqtdagi faollik</p>
               </div>
            </div>

            {/* Stat chips */}
            <div className="grid grid-cols-4 gap-2 mb-5">
               {[
                  { label: "Jami", value: globalStats?.platformTotal || 0, color: "#64748b" },
                  { label: "Yechilgan", value: globalStats?.totalSolved || 0, color: "#64748b" },
                  { label: "To'g'ri", value: globalStats?.totalCorrect || 0, color: "#16a34a" },
                  { label: "Xato", value: globalStats?.totalIncorrect || 0, color: RED },
               ].map((s) => (
                  <div key={s.label} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center">
                     <p className="text-[14px] font-semibold leading-none mb-1" style={{ color: s.color }}>{s.value}</p>
                     <p className="text-[10px] text-slate-400">{s.label}</p>
                  </div>
               ))}
            </div>

            {/* Progress bars */}
            <div className="space-y-4">
               {[
                  { label: "To'g'ri javoblar", pct: correctPct, color: "#16a34a" },
                  { label: "O'rtacha ball", pct: globalStats?.avgScore || 0, color: "#64748b" },
               ].map((bar) => (
                  <div key={bar.label}>
                     <div className="flex items-center justify-between mb-2">
                        <span className="text-[12px] text-slate-600 dark:text-slate-400">{bar.label}</span>
                        <span className="text-[12px] font-medium" style={{ color: bar.color }}>{bar.pct}%</span>
                     </div>
                     <div className="h-[3px] bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                           className="h-full rounded-full transition-all duration-700"
                           style={{ width: `${bar.pct}%`, background: bar.color }}
                        />
                     </div>
                  </div>
               ))}
            </div>
         </div>

         {/* Smart recommendations */}
         <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col">
            <div className="flex items-center gap-3 mb-5">
               <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Lightbulb className="w-4 h-4 text-slate-500" />
               </div>
               <div>
                  <p className="text-[13px] font-medium text-slate-800 dark:text-white">Smart tavsiyalar</p>
                  <p className="text-[11px] text-slate-400">EduFox AI diagnostikasi</p>
               </div>
            </div>

            {(!weakPoints || weakPoints.length === 0) ? (
               <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                  <CheckCircle2 className="w-8 h-8 text-green-500 mb-3 opacity-30" />
                  <p className="text-[12px] text-slate-400">Hozircha tavsiyalar yo'q</p>
               </div>
            ) : (
               <div className="space-y-2.5">
                  {weakPoints.map((item: any, i: number) => (
                     <div
                        key={i}
                        className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700"
                     >
                        <div>
                           <p className="text-[13px] font-medium text-slate-800 dark:text-white mb-0.5">
                              {(item.test_folders as any)?.name}
                           </p>
                           <p className="text-[11px] font-medium" style={{ color: RED }}>{item.score}% natija</p>
                        </div>
                        <button
                           onClick={() => onSelectSubject((item.test_folders as any)?.subject)}
                           className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:border-slate-300 transition-colors"
                        >
                           <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                     </div>
                  ))}
               </div>
            )}
         </div>
      </div>
   </div>
);
};

export default SubjectDashboard;
