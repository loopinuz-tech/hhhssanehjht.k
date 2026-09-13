import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen, Users, FileText, CheckCircle2, TrendingUp,
  UserCheck, Plus, ArrowUpRight, Sparkles
} from "lucide-react";
import SEO from "@/components/SEO";

interface DashboardData {
  classesCount: number;
  studentsCount: number;
  staffCount: number;
  mocksCount: number;
  completedAttemptsCount: number;
  pendingRequestsCount?: number;
  averageScore: number;
  recentExams: Array<{
    id: string;
    title: string;
    subject?: string;
    mode: string;
    status: string;
    created_at: string;
  }>;
  center: {
    id: string;
    name: string;
    username: string;
    status: string;
    logo_url?: string;
  };
}

const CenterDashboard = () => {
  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ["center-dashboard-stats"],
    queryFn: async () => {
      const res = await fetch("/api/center/dashboard", { credentials: "include" });
      if (!res.ok) throw new Error("Dashboard ma'lumotlarini yuklab bo'lmadi");
      return res.json();
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
        <p className="text-sm text-rose-500 font-semibold">Ma'lumotlarni yuklashda xatolik yuz berdi</p>
      </div>
    );
  }

  const stats = [
    { label: "Sinflar", value: data.classesCount, icon: BookOpen, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "O'quvchilar", value: data.studentsCount, icon: Users, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Hodimlar", value: data.staffCount, icon: UserCheck, color: "text-violet-500", bg: "bg-violet-500/10" },
    { label: "Mock testlar", value: data.mocksCount, icon: FileText, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Topshirilgan", value: data.completedAttemptsCount, icon: CheckCircle2, color: "text-rose-500", bg: "bg-rose-500/10" },
    { label: "O'rtacha ball", value: `${data.averageScore}`, icon: TrendingUp, color: "text-sky-500", bg: "bg-sky-500/10" },
  ];

  return (
    <>
      <SEO title={`${data.center.name} — Boshqaruv`} />
      <div className="space-y-8">
        {/* WELCOME BANNER */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-3xl relative overflow-hidden shadow-lg shadow-red-500/15 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 relative z-10">
            {data.center.logo_url && (
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md p-1 border border-white/30 shrink-0 overflow-hidden shadow-sm">
                <img src={data.center.logo_url} alt={data.center.name} className="w-full h-full object-cover rounded-xl" />
              </div>
            )}
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>EduContest Markazlar Tizimi</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{data.center.name}</h2>
              <p className="text-white/80 text-sm font-medium">
                Sinflarni tashkil eting, EduContest mock testlarini biriktiring va natijalarni tahlil qiling.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 relative z-10">
            <Link
              to="/center/tests/create"
              className="px-4 py-2.5 bg-white text-[#E8192C] hover:bg-slate-100 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Mock yaratish</span>
            </Link>
            <Link
              to="/center/classes"
              className="px-4 py-2.5 bg-white/15 hover:bg-white/20 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all backdrop-blur-md"
            >
              <Plus className="w-4 h-4" />
              <span>Sinf ochish</span>
            </Link>
          </div>
        </div>

        {/* PENDING JOIN REQUESTS ALERT BANNER */}
        {Boolean(data.pendingRequestsCount && data.pendingRequestsCount > 0) && (
          <div className="p-4 sm:p-5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20 font-black text-base">
                🔔
              </div>
              <div>
                <h4 className="text-sm font-black text-amber-950 dark:text-amber-200">
                  {data.pendingRequestsCount} ta yangi o'quvchi sinfga qo'shilishni kutmoqda!
                </h4>
                <p className="text-xs text-amber-800 dark:text-amber-400 font-medium">
                  O'quvchilar sinf kodi orqali a'zo bo'lish so'rovini yuborgan. Tasdiqlangach ular testlarni topshira oladi.
                </p>
              </div>
            </div>
            <Link
              to="/center/students?tab=requests"
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 inline-flex items-center gap-1.5"
            >
              <span>Arizalarni tasdiqlash</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* METRICS CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2 shadow-xs"
              >
                <div className={`w-8 h-8 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {stat.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* RECENT EXAMS & QUICK ACCESS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* RECENT EXAMS */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Oxirgi mock testlar</h3>
                <p className="text-xs text-slate-400 font-medium">Markazingiz uchun yaratilgan so'nggi testlar</p>
              </div>
              <Link
                to="/center/tests"
                className="text-xs font-bold text-[#E8192C] hover:underline flex items-center gap-1"
              >
                <span>Barchasi</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {data.recentExams && data.recentExams.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.recentExams.map((exam) => (
                  <div key={exam.id} className="py-3.5 flex items-center justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{exam.title}</h4>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        {exam.subject && <span>{exam.subject}</span>}
                        <span>•</span>
                        <span className="capitalize">{exam.mode === 'exam' ? 'Imtihon' : 'Oddiy'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        exam.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                      }`}>
                        {exam.status}
                      </span>
                      <Link
                        to={`/center/results/${exam.id}`}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors"
                      >
                        Natijalar
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-500">Hozircha mock testlar mavjud emas.</p>
                <Link
                  to="/center/tests/create"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#E8192C] text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Birinchi mockni yaratish</span>
                </Link>
              </div>
            )}
          </div>

          {/* QUICK LINKS / SUMMARY */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-5 shadow-xs flex flex-col justify-between">
            <div className="space-y-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Tezkor amallar</h3>
              <div className="space-y-2">
                <Link
                  to="/center/classes"
                  className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 flex items-center gap-3 transition-colors group cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#E8192C] transition-colors">Sinflarni boshqarish</div>
                    <div className="text-[11px] text-slate-400">Kodni o'quvchilarga taqdim eting</div>
                  </div>
                </Link>

                <Link
                  to="/center/students"
                  className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 flex items-center gap-3 transition-colors group cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#E8192C] transition-colors">O'quvchi qo'shish</div>
                    <div className="text-[11px] text-slate-400">Yangi akkaunt yoki mavjudini ulash</div>
                  </div>
                </Link>

                <Link
                  to="/center/results"
                  className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 flex items-center gap-3 transition-colors group cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#E8192C] transition-colors">Rasch Tahlili</div>
                    <div className="text-[11px] text-slate-400">BMBA standartidagi baholash</div>
                  </div>
                </Link>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs space-y-1">
              <div className="font-bold text-slate-900 dark:text-white">EduContest Yordam</div>
              <p className="text-slate-400">Savollaringiz yoki takliflaringiz bo'lsa, Telegram orqali murojaat qiling.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CenterDashboard;
