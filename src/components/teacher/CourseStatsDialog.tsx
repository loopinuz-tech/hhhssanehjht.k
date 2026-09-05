import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, CreditCard, CalendarDays, Clock, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useTranslation } from "react-i18next";
import { rewriteStorageUrl } from "@/lib/storage";

interface CourseStatsDialogProps {
  course: any;
  onClose: () => void;
}

export function CourseStatsDialog({ course, onClose }: CourseStatsDialogProps) {
  const { t, i18n } = useTranslation();
  const { data: stats, isLoading } = useQuery({
    queryKey: ["course-stats", course?.id],
    queryFn: async () => {
      if (!course?.id) return null;

      // 1. Fetch enrollments
      const { data: enrollments, error: enrollError } = await supabase
        .from("course_enrollments")
        .select("*, profile:profiles!course_enrollments_user_id_fkey(full_name, phone, avatar_url)")
        .eq("course_id", course.id)
        .order("purchased_at", { ascending: false });

      if (enrollError) {
          // fallback if relation name is different
          const { data: basicEnrolls } = await supabase
            .from("course_enrollments")
            .select("*")
            .eq("course_id", course.id)
            .order("purchased_at", { ascending: false });
          
          if (!basicEnrolls) return { enrollments: [], totalRevenue: 0 };
          
          // fetch profiles manually
          const userIds = basicEnrolls.map(e => e.user_id);
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, full_name, phone, avatar_url")
            .in("user_id", userIds);

          const fullEnrolls = basicEnrolls.map(e => ({
              ...e,
              profile: profiles?.find(p => p.user_id === e.user_id) || null
          }));

          const totalRevenue = fullEnrolls.reduce((sum, curr) => sum + (Number(curr.price_paid) || 0), 0);
          return { enrollments: fullEnrolls, totalRevenue };
      }

      const totalRevenue = enrollments.reduce((sum, curr) => sum + (Number(curr.price_paid) || 0), 0);
      return { enrollments, totalRevenue };
    },
    enabled: !!course?.id
  });

  return (
    <Dialog open={!!course} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800 rounded-3xl p-0 overflow-hidden shadow-2xl">
        <VisuallyHidden>
          <DialogTitle>{t('teacher_dashboard.my_courses.stats')}</DialogTitle>
          <DialogDescription>{t('teacher_dashboard.my_students.title')}</DialogDescription>
        </VisuallyHidden>

        {/* Header */}
        <div className="px-6 py-5 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/60 sticky top-0 z-10 font-sans">
          <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">{t('teacher_dashboard.my_courses.stats')}: {course?.title}</h2>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">{t('teacher_dashboard.my_students.title')}</p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh] font-sans bg-white dark:bg-slate-950">
          {isLoading ? (
            <div className="py-12 flex flex-col justify-center items-center gap-3">
               <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
               <p className="text-[10px] font-black tracking-widest uppercase text-slate-400">{t('common.loading')}</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Stat cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                   <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6" />
                   </div>
                   <div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{t('teacher_dashboard.stats.students')}</p>
                     <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{stats?.enrollments?.length || 0}</p>
                   </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                   <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center">
                      <CreditCard className="w-6 h-6" />
                   </div>
                   <div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{t('teacher_dashboard.stats.total_revenue')}</p>
                     <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {stats?.totalRevenue ? `${stats.totalRevenue.toLocaleString()} ${t('common.currency')}` : `0 ${t('common.currency')}`}
                     </p>
                   </div>
                </div>
              </div>

              {/* Student list */}
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">{t('teacher_dashboard.my_students.title')}</h3>
                
                {stats?.enrollments?.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] font-black uppercase tracking-widest">{t('teacher_dashboard.my_students.no_students')}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {stats?.enrollments?.map((enroll: any) => (
                      <div key={enroll.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-emerald-500/30 transition-colors">
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden">
                               {enroll.profile?.avatar_url ? (
                                 <img src={rewriteStorageUrl(enroll.profile.avatar_url)} className="w-full h-full object-cover" />
                               ) : (
                                 <User className="w-4 h-4 text-slate-400" />
                               )}
                            </div>
                            <div>
                               <p className="text-xs font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tight">{enroll.profile?.full_name || t('teacher_dashboard.my_students.unknown')}</p>
                               <div className="flex items-center gap-2 mt-1">
                                 <span className="text-[9px] font-bold text-slate-400 tabular-nums">{enroll.profile?.phone || "Tel raqam yo'q"}</span>
                               </div>
                            </div>
                         </div>
                         <div className="text-right flex flex-col items-end">
                            <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase rounded tabular-nums">
                              {enroll.price_paid ? `${Number(enroll.price_paid).toLocaleString()} ${t('common.currency')}` : t('courses.card.free')}
                            </span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1 tabular-nums">
                              {new Date(enroll.purchased_at).toLocaleDateString(i18n.language === 'uz' ? 'uz-UZ' : 'en-US')}
                            </span>
                         </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
