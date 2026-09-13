import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";
import {
  TrendingUp, DollarSign, BookOpen, Star, Users,
  Wallet, MessageSquare, Plus, ChevronRight, Calendar,
  ArrowUpRight, Sparkles, BarChart3, Clock, CheckCircle, Edit3, Trash2
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { uz } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CourseStatsDialog } from "./CourseStatsDialog";
import { useTranslation, Trans } from "react-i18next";
import { rewriteStorageUrl } from "@/lib/storage";

export function CourseDashboard() {
  const { user, profile } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCourseForStats, setSelectedCourseForStats] = useState<any>(null);

  // Fetch teacher's courses
  const { data: courses } = useQuery({
    queryKey: ["teacher-courses-dash", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("courses")
        .select("*, course_enrollments(count)")
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch enrollments for revenue calculation
  const { data: enrollments } = useQuery({
    queryKey: ["teacher-enrollments-dash", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("course_enrollments")
        .select("id, purchased_at, courses!inner(price, teacher_id)")
        .eq("courses.teacher_id", user.id);
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch recent messages
  const { data: messages } = useQuery({
    queryKey: ["teacher-messages-dash", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("course_messages")
        .select(`
          *,
          course_chats!inner(
            course_id,
            teacher_id,
            courses(title)
          ),
          sender:sender_id(full_name, avatar_url)
        `)
        .eq("course_chats.teacher_id", user.id)
        .neq("sender_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch teacher's plans
  const { data: plans } = useQuery({
    queryKey: ["teacher-plans-dash", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("teacher_plans" as any)
        .select("*")
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: true });
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch teacher's students via enrollments and manual profile fetching
  const { data: students } = useQuery({
    queryKey: ["teacher-students-dash", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: enrolls, error } = await supabase
        .from("course_enrollments")
        .select("*, courses!inner(title, teacher_id, price)")
        .eq("courses.teacher_id", user.id)
        .order("purchased_at", { ascending: false });

      if (error) {
        console.error("Enrollments error:", error);
        return [];
      }
      
      const userIds = [...new Set((enrolls || []).map((e: any) => e.user_id))].filter(Boolean);
      let profileMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", userIds);
        
        profs?.forEach((p: any) => {
          profileMap[p.user_id] = p;
        });
      }

      return (enrolls || []).map((e: any) => ({
        ...e,
        profiles: profileMap[e.user_id] || null
      }));
    },
    enabled: !!user,
  });

  // Delete Course Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("courses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: t('dashboard.my_courses.deleted'), description: t('dashboard.my_courses.deleted_msg') });
      queryClient.invalidateQueries({ queryKey: ["teacher-courses-dash"] });
    },
    onError: (err: any) => {
      toast({ title: t('common.error'), description: err.message, variant: "destructive" });
    }
  });

  const handleDelete = (id: string) => {
    if (window.confirm(t('teacher_dashboard.delete_confirm'))) {
      deleteMutation.mutate(id);
    }
  };

  // Calculate stats using native courses fields
  const activeCourses = courses?.filter(c => c.status === "approved") || [];
  const totalEnrollments = courses?.reduce((sum: number, c: any) => sum + (c.student_count || 0), 0) || 0;
  const totalRevenue = courses?.reduce((sum: number, c: any) => sum + (c.total_revenue ? c.total_revenue : (c.price || 0) * (c.student_count || 0)), 0) || 0;

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthRevenue = enrollments?.filter((e: any) =>
    new Date(e.purchased_at) >= monthStart
  ).reduce((sum: number, e: any) => sum + (e.courses?.price || 0), 0) || 0;

  const avgRating = courses?.length
    ? (courses.reduce((s: number, c: any) => s + (c.average_rating || 0), 0) / courses.length).toFixed(1)
    : "—";

  // Build last 6 months data for mini chart using enrollments table
  const last6 = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(now, 5 - i);
    const start = startOfMonth(d);
    const end = endOfMonth(d);
    const rev = enrollments?.filter((e: any) => {
      const at = new Date(e.purchased_at);
      return at >= start && at <= end;
    }).reduce((s: number, e: any) => s + (e.courses?.price || 0), 0) || 0;
    return { month: format(d, "MMM", { locale: uz }), rev };
  });
  const maxRev = Math.max(...last6.map(m => m.rev), 1);

  const statCards = [
    { label: t('teacher_dashboard.stats.total_revenue'),    value: `${totalRevenue.toLocaleString()} ${t('common.currency')}`, icon: DollarSign,  bg: "bg-blue-500/10",    icon2: "text-blue-500" },
    { label: t('teacher_dashboard.stats.monthly_revenue'),   value: `${monthRevenue.toLocaleString()} ${t('common.currency')}`, icon: TrendingUp,  bg: "bg-emerald-500/10", icon2: "text-emerald-500" },
    { label: t('teacher_dashboard.stats.active_courses'),    value: activeCourses.length,                    icon: BookOpen,    bg: "bg-violet-500/10",  icon2: "text-violet-500" },
    { label: t('teacher_dashboard.stats.avg_rating'),value: avgRating,                               icon: Star,        bg: "bg-amber-500/10",   icon2: "text-amber-500" },
    { label: t('teacher_dashboard.stats.students'),     value: totalEnrollments,                        icon: Users,       bg: "bg-rose-500/10",    icon2: "text-rose-500" },
    { label: t('teacher_dashboard.stats.balance'),  value: `${(profile?.balance || 0).toLocaleString()} ${t('common.currency')}`, icon: Wallet, bg: "bg-slate-500/10", icon2: "text-slate-500" },
  ];

  const quickActions = [
    { label: t('teacher_dashboard.quick_actions.new_course'), icon: Plus,          path: "/courses/create",     color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30" },
    { label: t('teacher_dashboard.quick_actions.view_courses'), icon: BookOpen,      path: "/courses",            color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30" },
    { label: t('teacher_dashboard.quick_actions.wallet'),              icon: Wallet,         path: "/settings",           color: "text-violet-600 bg-violet-50 dark:bg-violet-950/30" },
    { label: t('teacher_dashboard.quick_actions.edit_profile'), icon: Sparkles,       path: "/settings",           color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Greeting ── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {format(now, "d MMMM, yyyy", { locale: uz })}
          </p>
          <h2 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
            {t('teacher_dashboard.title')}
          </h2>
        </div>
        <Link
          to="/courses/create"
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">{t('teacher_dashboard.new_course')}</span>
        </Link>
      </div>

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[20px] p-4 shadow-sm flex items-center gap-4">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${s.bg}`}>
              <s.icon className={`w-5 h-5 ${s.icon2}`} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{s.label}</p>
              <p className="text-base font-black text-slate-900 dark:text-white truncate">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main content grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Income chart (2/3) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-slate-400" />
              <h3 className="font-black text-sm text-slate-800 dark:text-white">{t('teacher_dashboard.income_chart')}</h3>
            </div>
            <p className="text-xs text-slate-400 font-medium">{t('teacher_dashboard.currency_label')}</p>
          </div>
          <div className="flex items-end gap-2 h-32">
            {last6.map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <p className="text-[8px] font-bold text-slate-400 tabular-nums">
                  {m.rev > 0 ? `${(m.rev / 1000).toFixed(0)}k` : "0"}
                </p>
                <div className="w-full rounded-t-xl overflow-hidden bg-slate-50 dark:bg-slate-800" style={{ height: "80px" }}>
                  <div
                    className="w-full rounded-t-xl bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all duration-700"
                    style={{ height: `${Math.max((m.rev / maxRev) * 100, m.rev > 0 ? 8 : 0)}%`, marginTop: "auto" }}
                  />
                </div>
                <p className="text-[9px] font-bold text-slate-400 capitalize">{m.month}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions (1/3) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] p-6 shadow-sm">
          <h3 className="font-black text-sm text-slate-800 dark:text-white mb-4">{t('teacher_dashboard.quick_actions.title')}</h3>
          <div className="space-y-2">
            {quickActions.map((a) => (
              <Link key={a.label} to={a.path}
                className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${a.color}`}>
                  <a.icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{a.label}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 ml-auto group-hover:translate-x-0.5 transition-transform" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom grid: Active Courses + Students + Messages ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Active courses */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-sm text-slate-800 dark:text-white">{t('teacher_dashboard.active_courses.title')}</h3>
            <Link to="/courses" className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:underline flex items-center gap-1">
              {t('teacher_dashboard.active_courses.all')} <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {activeCourses.length > 0 ? (
              activeCourses.slice(0, 4).map((course: any) => (
                <Link key={course.id} to={`/courses/${course.category ? course.category.toLowerCase().replace(/\s+/g, '-') : 'all'}/${course.slug}`}
                  className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0">
                    {course.cover_image
                      ? <img src={rewriteStorageUrl(course.cover_image)} alt={course.title} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-5 h-5 text-slate-400" /></div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 dark:text-white truncate group-hover:text-emerald-600 transition-colors">{course.title}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Users className="w-3 h-3" /> {course.enrollments_count || 0}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {course.rating?.toFixed(1) || "—"}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs font-black text-emerald-600 flex-shrink-0">
                    {(course.price || 0).toLocaleString()} {t('common.currency')}
                  </p>
                </Link>
              ))
            ) : (
              <div className="py-8 text-center">
                <BookOpen className="w-8 h-8 text-slate-200 dark:text-slate-700 mx-auto mb-2" />
                <p className="text-sm text-slate-400">{t('teacher_dashboard.active_courses.no_courses')}</p>
                <Link to="/courses/create" className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 mt-2 hover:underline">
                  <Plus className="w-3 h-3" /> {t('teacher_dashboard.active_courses.create')}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-sm text-slate-800 dark:text-white">{t('teacher_dashboard.messages.title')}</h3>
            <Link to="/courses" className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:underline flex items-center gap-1">
              {t('teacher_dashboard.messages.all')} <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {messages && messages.length > 0 ? (
              messages.map((msg: any) => (
                <div key={msg.id} className="flex items-start gap-3 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0">
                    {msg.sender?.avatar_url
                      ? <img src={rewriteStorageUrl(msg.sender.avatar_url)} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">
                          {msg.sender?.full_name?.[0] || "?"}
                        </div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{msg.sender?.full_name || t('teacher_dashboard.messages.unknown')}</p>
                      <p className="text-[9px] text-slate-400 flex-shrink-0">{format(new Date(msg.created_at), "HH:mm")}</p>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">{msg.message || "Fayl yuborildi"}</p>
                    <p className="text-[9px] text-blue-500 font-bold mt-0.5 truncate">{msg.course_chats?.courses?.title}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center">
                <MessageSquare className="w-8 h-8 text-slate-200 dark:text-slate-700 mx-auto mb-2" />
                <p className="text-sm text-slate-400">{t('teacher_dashboard.messages.no_messages')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Weekly schedule / plan ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <h3 className="font-black text-sm text-slate-800 dark:text-white">{t('teacher_dashboard.plan.title')}</h3>
          </div>
          <Link to="/planner" className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:underline flex items-center gap-1">
            {t('teacher_dashboard.plan.full')} <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {plans && plans.length > 0 ? (
            plans.map((item: any) => (
              <div key={item.id} className={`p-4 rounded-2xl border transition-colors ${
                item.is_done
                  ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-800/40"
                  : "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600"
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{item.day}</p>
                  {item.is_done && <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-white leading-tight">{item.title}</p>
                <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {item.time}
                </p>
              </div>
            ))
          ) : (
             <div className="col-span-full py-6 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
                 <Calendar className="w-6 h-6 text-slate-300" />
                 {t('teacher_dashboard.plan.no_plan')}
             </div>
          )}
        </div>
      </div>

      {/* ── My Students Table ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] p-6 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400" />
            <h3 className="font-black text-sm text-slate-800 dark:text-white">{t('teacher_dashboard.my_students.title')}</h3>
          </div>
        </div>
        
        {students && students.length > 0 ? (
          <div className="space-y-3">
            {students.map((enrollment: any) => (
              <div key={enrollment.id} className="flex flex-col md:flex-row items-center justify-between p-4 rounded-[1.25rem] bg-slate-50 dark:bg-[#111c30] border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-colors group">
                 <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 border-2 border-white dark:border-slate-700 overflow-hidden flex-shrink-0">
                       {enrollment.profiles?.avatar_url ? (
                          <img src={rewriteStorageUrl(enrollment.profiles.avatar_url)} alt="" className="w-full h-full object-cover" />
                       ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-xs text-slate-400">
                            {enrollment.profiles?.full_name?.[0] || "?"}
                          </div>
                       )}
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-slate-800 dark:text-white">
                        {enrollment.profiles?.full_name || t('teacher_dashboard.my_students.unknown')}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate max-w-[200px] mt-0.5">
                        {enrollment.courses?.title}
                      </p>
                    </div>
                 </div>

                 <div className="flex items-center justify-between w-full md:w-auto mt-4 md:mt-0 gap-6 md:gap-8">
                    <div className="flex flex-col gap-1 items-start md:items-end">
                       <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('teacher_dashboard.my_students.progress')}</p>
                       <div className="flex items-center gap-2">
                          <div className="w-24 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                             <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${enrollment.progress || 0}%` }} />
                          </div>
                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{enrollment.progress || 0}%</span>
                       </div>
                    </div>
                    
                    <div className="flex flex-col gap-1 items-start md:items-end">
                       <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('teacher_dashboard.my_students.avg_test')}</p>
                       <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400">{enrollment.average_score || 0}%</p>
                    </div>

                    <Link 
                       to={`/messages?user=${enrollment.user_id}&course=${enrollment.course_id}`}
                       className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 text-slate-500 hover:text-emerald-600 rounded-xl transition-all shadow-sm border border-slate-100 dark:border-slate-700 flex-shrink-0"
                       title={t('teacher_dashboard.my_students.chat_tooltip')}
                    >
                       <MessageSquare className="w-4 h-4" />
                    </Link>
                 </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center border-t border-slate-50 dark:border-slate-800">
             <p className="text-sm font-medium text-slate-400">{t('teacher_dashboard.my_students.no_students')}</p>
          </div>
        )}
      </div>

      {/* ── My Courses Table / List ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] p-6 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-slate-400" />
            <h3 className="font-black text-sm text-slate-800 dark:text-white">{t('teacher_dashboard.my_courses.title')}</h3>
          </div>
        </div>
        
        {courses && courses.length > 0 ? (
          <div className="space-y-3">
            {courses.map((course: any) => (
              <div key={course.id} className="flex items-center justify-between p-4 rounded-[1.25rem] bg-slate-50 dark:bg-[#111c30] border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-colors group">
                <div className="flex items-start md:items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow">
                     <BookOpen className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 md:gap-3 leading-tight">
                      <p className="text-[13px] font-bold text-slate-800 dark:text-white">
                        {course.title} <span className="text-slate-400 font-medium">| {profile?.full_name || t('teacher_dashboard.teacher_label')}</span>
                      </p>
                      <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-[0.15em] ${
                        course.status === 'approved' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : 
                        course.status === 'pending' ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' : 
                        'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {course.status === 'approved' ? t('teacher_dashboard.my_courses.active') : course.status === 'pending' ? t('teacher_dashboard.my_courses.waiting') : t('teacher_dashboard.my_courses.draft')}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" /> {(course.student_count || 0).toLocaleString()} {t('teacher_dashboard.my_courses.student_count_plural', { count: course.student_count || 0 })}
                      </span>
                      <span className="text-[11px] font-black text-emerald-600">
                        {(course.price || 0).toLocaleString()} <span className="font-bold">{t('common.currency')}</span>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <button 
                     onClick={() => setSelectedCourseForStats(course)} 
                     className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 rounded-xl transition-all shadow-sm border border-slate-100 dark:border-slate-700"
                     title={t('teacher_dashboard.my_courses.stats')}
                   >
                      <BarChart3 className="w-4 h-4" />
                   </button>
                   <Link 
                     to={`/courses/edit/${course.id}`} 
                     className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 rounded-xl transition-all shadow-sm border border-slate-100 dark:border-slate-700"
                     title={t('teacher_dashboard.my_courses.edit')}
                   >
                      <Edit3 className="w-4 h-4" />
                   </Link>
                   <button 
                     onClick={() => handleDelete(course.id)} 
                     className="w-10 h-10 flex items-center justify-center bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-500 rounded-xl transition-all shadow-sm border border-transparent"
                     title={t('teacher_dashboard.my_courses.delete')}
                   >
                      <Trash2 className="w-4 h-4" />
                   </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center border-t border-slate-50 dark:border-slate-800">
             <p className="text-sm font-medium text-slate-400 mb-4">{t('teacher_dashboard.my_courses.no_courses')}</p>
             <Link
               to="/courses/create"
               className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20 transition-all"
             >
               <Plus className="w-4 h-4" /> {t('teacher_dashboard.my_courses.prepare')}
             </Link>
          </div>
        )}
      </div>

      {selectedCourseForStats && (
        <CourseStatsDialog 
          course={selectedCourseForStats} 
          onClose={() => setSelectedCourseForStats(null)} 
        />
      )}
    </div>
  );
}
