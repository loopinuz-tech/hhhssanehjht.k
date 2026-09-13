import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { slugify } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Trophy, Calendar, Clock, BookOpen,
  Target, Sparkles, ArrowLeft,
  Users, Timer, BarChart3,
  History, Info, Play, ShieldAlert, BadgeCheck,
  Medal, ChevronRight, CheckCircle2, XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { rewriteStorageUrl } from "@/lib/storage";
import SEO from "@/components/SEO";

function useCountdown(targetDate: string) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const calc = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      return {
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      };
    };
    setTimeLeft(calc());
    const timer = setInterval(() => setTimeLeft(calc()), 1000);
    return () => clearInterval(timer);
  }, [targetDate]);
  return timeLeft;
}

const OlympiadDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("about");

  const { data: ol, isLoading } = useQuery({
    queryKey: ["olympiad", id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("olympiads")
        .select(`*, subjects(*)`)
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: leaderboard } = useQuery({
    queryKey: ["olympiad-leaderboard", id],
    queryFn: async () => {
      try {
        const { data: regs, error } = await (supabase as any)
          .from("olympiad_registrations")
          .select("*")
          .eq("olympiad_id", id)
          .not("completed_at", "is", null)
          .order("score", { ascending: false });
        if (error) throw error;
        if (!regs?.length) return [];

        const filtered = regs.filter((r: any) => !r.is_disqualified);
        const userIds = [...new Set(filtered.map((r: any) => r.user_id))];
        if (!userIds.length) return [];

        const { data: profiles } = await (supabase as any)
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", userIds);
        const profilesMap: Record<string, any> = {};
        profiles?.forEach((p: any) => { profilesMap[p.user_id] = p; });

        return filtered.map((r: any) => ({ ...r, user: profilesMap[r.user_id] || null }));
      } catch {
        return [];
      }
    },
    enabled: !!id,
  });

  const { data: disqualifiedUsers } = useQuery({
    queryKey: ["olympiad-disqualified", id],
    queryFn: async () => {
      try {
        const { data: regs, error } = await (supabase as any)
          .from("olympiad_registrations")
          .select("*")
          .eq("olympiad_id", id)
          .order("updated_at", { ascending: false });
        if (error) throw error;
        if (!regs?.length) return [];

        const disqualified = regs.filter((r: any) => r.is_disqualified);
        if (!disqualified.length) return [];

        const userIds = [...new Set(disqualified.map((r: any) => r.user_id))];
        const { data: profiles } = await (supabase as any)
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", userIds);
        const profilesMap: Record<string, any> = {};
        profiles?.forEach((p: any) => { profilesMap[p.user_id] = p; });

        return disqualified.map((r: any) => ({ ...r, user: profilesMap[r.user_id] || null }));
      } catch {
        return [];
      }
    },
    enabled: !!id,
  });

  const { data: myStatus } = useQuery({
    queryKey: ["my-olympiad-status", id],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await (supabase as any)
        .from("olympiad_registrations")
        .select("*")
        .eq("olympiad_id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: myAttempts } = useQuery({
    queryKey: ["my-olympiad-attempts", id],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await (supabase as any)
        .from("olympiad_attempts")
        .select("*")
        .eq("olympiad_id", id)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  const { data: questions } = useQuery({
    queryKey: ["olympiad-questions-detail", id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("olympiad_questions")
        .select("*")
        .eq("olympiad_id", id)
        .order("order_number");
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  const { data: registrationCount } = useQuery({
    queryKey: ["olympiad-reg-count", id],
    queryFn: async () => {
      const { count, error } = await (supabase as any)
        .from("olympiad_registrations")
        .select("*", { count: "exact", head: true })
        .eq("olympiad_id", id);
      if (error) return 0;
      return count || 0;
    },
    enabled: !!id,
  });

  const registerMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Xatolik", description: "Avtorizatsiyadan o'ting", variant: "destructive" });
        return;
      }
      const { error } = await (supabase as any)
        .from("olympiad_registrations")
        .insert({
          olympiad_id: id,
          user_id: user.id,
          payment_status: "paid",
          payment_method: "educoin",
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Muvaffaqiyatli", description: "Olimpiadaga ro'yxatdan o'tdingiz!" });
      qc.invalidateQueries({ queryKey: ["olympiad-leaderboard", id] });
      qc.invalidateQueries({ queryKey: ["my-olympiad-status", id] });
      qc.invalidateQueries({ queryKey: ["olympiad-reg-count", id] });
    },
    onError: (err: any) => {
      if (err.message?.includes("unique")) {
        toast({ title: "Ma'lumot", description: "Siz allaqachon ro'yxatdan o'tgansiz" });
      } else {
        toast({ title: "Xatolik", description: err.message, variant: "destructive" });
      }
    },
  });

  const isRegistered = !!myStatus;
  const isCompleted = !!myStatus?.completed_at;
  const isDisqualified = !!myStatus?.is_disqualified;
  const isActive = ol?.status === "active";
  const isUpcoming = ol?.status === "upcoming";
  const now = new Date();
  const startTime = ol ? new Date(ol.start_time) : now;
  const endTime = ol ? new Date(ol.end_time) : now;
  const canStart = ol && isActive && now >= startTime && now <= endTime && isRegistered && !isCompleted && !isDisqualified;
  const countdown = useCountdown(ol?.start_time || new Date().toISOString());

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-[#E8192C] rounded-full animate-spin" />
      </div>
    );
  }
  if (!ol) {
    return (
      <div className="h-screen flex items-center justify-center text-[13px] font-medium text-slate-500">
        Olimpiada topilmadi
      </div>
    );
  }

  const tabs = [
    { id: "about", label: "Ma'lumot", icon: Info },
    ...(isCompleted ? [{ id: "questions", label: "Masalalar", icon: BookOpen }] : []),
    { id: "leaderboard", label: "Natijalar", icon: BarChart3 },
    { id: "attempts", label: "Urinishlar", icon: History },
  ];

  const statusColors: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-600",
    upcoming: "bg-blue-50 text-blue-600",
    completed: "bg-slate-100 text-slate-500",
    cancelled: "bg-red-50 text-red-600",
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      <SEO title={ol.title} description={ol.description || "Olimpiada haqida"} />

      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => navigate("/olympiads")}
            className="flex items-center gap-2 text-[13px] font-medium text-slate-400 hover:text-slate-600 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Orqaga
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold text-slate-900">{ol.title}</h1>
                <span className={`px-2 py-0.5 rounded-lg text-[11px] font-medium ${statusColors[ol.status] || "bg-slate-100 text-slate-500"}`}>
                  {ol.status === "active" ? "Faol" : ol.status === "upcoming" ? "Yaqinda" : ol.status === "completed" ? "Tugagan" : ol.status}
                </span>
              </div>
              <p className="text-[13px] text-slate-500 font-medium">
                {ol.olympiad_type === "test" ? "Test" : ol.olympiad_type === "written" ? "Yozma" : "Aralash"} • {ol.duration_minutes} daqiqa • {ol.questions_count} ta savol
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3">
              {isUpcoming && !isRegistered && (
                <Button
                  onClick={() => registerMutation.mutate()}
                  disabled={registerMutation.isPending}
                  className="bg-[#E8192C] hover:bg-[#d01725] text-white rounded-xl px-5 py-2.5 text-[13px] font-medium"
                >
                  {registerMutation.isPending ? "Kutilmoqda..." : "Ro'yxatdan o'tish"}
                </Button>
              )}
              {isRegistered && !isCompleted && !isDisqualified && isActive && (
                <Button
                  onClick={() => navigate(`/olympiads/${id}/${slugify(ol.title)}/exam`)}
                  className="bg-[#E8192C] hover:bg-[#d01725] text-white rounded-xl px-5 py-2.5 text-[13px] font-medium"
                >
                  <Play className="w-4 h-4 mr-2" /> Boshlash
                </Button>
              )}
              {isCompleted && (
                <span className="flex items-center gap-2 text-[13px] font-medium text-emerald-600 bg-emerald-50 rounded-xl px-4 py-2.5">
                  <CheckCircle2 className="w-4 h-4" /> Topshirilgan
                </span>
              )}
              {isDisqualified && (
                <span className="flex items-center gap-2 text-[13px] font-medium text-red-600 bg-red-50 rounded-xl px-4 py-2.5">
                  <XCircle className="w-4 h-4" /> Chetlatilgan
                </span>
              )}
              {isRegistered && !isActive && !isCompleted && (
                <span className="flex items-center gap-2 text-[13px] font-medium text-blue-600 bg-blue-50 rounded-xl px-4 py-2.5">
                  <Clock className="w-4 h-4" /> Ro'yxatdan o'tgan
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 sticky top-[60px] z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-[13px] font-medium border-b-2 transition-all ${
                activeTab === tab.id
                  ? "border-[#E8192C] text-slate-900"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AnimatePresence mode="wait">

          {/* ABOUT TAB */}
          {activeTab === "about" && (
            <motion.div
              key="about"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5"
            >
              {/* Left: Main info */}
              <div className="space-y-5">
                {/* Countdown for upcoming */}
                {isUpcoming && (countdown.days > 0 || countdown.hours > 0 || countdown.minutes > 0 || countdown.seconds > 0) && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-5">
                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-3">Boshlanishgacha qoldi</p>
                    <div className="flex items-center gap-4">
                      {[
                        { val: countdown.days, label: "Kun" },
                        { val: countdown.hours, label: "Soat" },
                        { val: countdown.minutes, label: "Daqiqa" },
                        { val: countdown.seconds, label: "Soniya" },
                      ].map((item, i) => (
                        <div key={i} className="text-center">
                          <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center">
                            <span className="text-2xl font-semibold text-slate-900 tabular-nums">{String(item.val).padStart(2, "0")}</span>
                          </div>
                          <p className="text-[11px] font-medium text-slate-400 mt-1">{item.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Info table */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-4">Olimpiada ma'lumotlari</p>
                  <div className="space-y-0 divide-y divide-slate-100">
                    {[
                      { label: "Boshlanish", value: new Date(ol.start_time).toLocaleString("uz-UZ") },
                      { label: "Tugash", value: new Date(ol.end_time).toLocaleString("uz-UZ") },
                      { label: "Davomiyligi", value: `${ol.duration_minutes} daqiqa` },
                      { label: "Savollar soni", value: `${ol.questions_count} ta` },
                      { label: "Olimpiada turi", value: ol.olympiad_type === "test" ? "Test" : ol.olympiad_type === "written" ? "Yozma" : "Aralash" },
                      { label: "Kirish to'lovi", value: ol.entry_fee_uzs > 0 ? `${ol.entry_fee_uzs.toLocaleString()} so'm` : "Bepul" },
                      { label: "Fan", value: ol.subjects?.name || "Umumiy" },
                    ].map((row, i) => (
                      <div key={i} className="flex items-center justify-between py-3">
                        <span className="text-[13px] font-medium text-slate-500">{row.label}</span>
                        <span className="text-[13px] font-medium text-slate-900">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Assessment criteria */}
                {ol.assessment_criteria && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="w-4 h-4 text-[#E8192C]" />
                      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Baholash mezonlari</p>
                    </div>
                    <p className="text-[13px] text-slate-600 font-medium leading-relaxed">{ol.assessment_criteria}</p>
                  </div>
                )}

                {/* Rules & Tasks */}
                {(ol.rules || ol.technical_tasks) && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Qoidalar va shartlar</p>
                    </div>
                    <div className="space-y-3 text-[13px] text-slate-600 font-medium leading-relaxed">
                      {ol.rules && <p>{ol.rules}</p>}
                      {ol.technical_tasks && <p>{ol.technical_tasks}</p>}
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Sidebar */}
              <div className="space-y-5">
                {/* Prize pool */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-3">Mukofotlar fondi</p>
                  <div className="text-center mb-4">
                    <p className="text-2xl font-semibold text-slate-900">{ol.prize_pool_uzs?.toLocaleString()} so'm</p>
                    {ol.prize_pool_educoins > 0 && (
                      <p className="text-[13px] font-medium text-emerald-600 mt-1">+{ol.prize_pool_educoins} EduCoin</p>
                    )}
                  </div>

                  {/* Prizes list */}
                  <div className="space-y-2">
                    {ol.prizes?.sort((a: any, b: any) => (a.rank || 0) - (b.rank || 0)).map((p: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[13px] font-semibold ${
                          p.rank === 1 ? "bg-amber-100 text-amber-700"
                          : p.rank === 2 ? "bg-slate-200 text-slate-600"
                          : p.rank === 3 ? "bg-amber-50 text-amber-600"
                          : "bg-slate-100 text-slate-500"
                        }`}>
                          {p.rank === 1 ? <Trophy className="w-4 h-4" /> : `#${p.rank}`}
                        </div>
                        <div>
                          <p className="text-[13px] font-medium text-slate-900">{p.reward}</p>
                          {p.item && <p className="text-[11px] font-medium text-slate-400">{p.item}</p>}
                        </div>
                      </div>
                    ))}
                    {!ol.prizes?.length && (
                      <p className="text-[13px] text-slate-400 font-medium text-center py-6">Sovrinlar belgilanmagan</p>
                    )}
                  </div>
                </div>

                {/* Participants & CTA */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Ishtirokchilar</p>
                      <p className="text-xl font-semibold text-slate-900">{registrationCount || 0}</p>
                    </div>
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-500" />
                    </div>
                  </div>

                  {isUpcoming && !isRegistered && (
                    <Button
                      onClick={() => registerMutation.mutate()}
                      disabled={registerMutation.isPending}
                      className="w-full bg-[#E8192C] hover:bg-[#d01725] text-white rounded-xl py-2.5 text-[13px] font-medium"
                    >
                      {registerMutation.isPending ? "Kutilmoqda..." : "Ro'yxatdan o'tish"}
                    </Button>
                  )}
                  {isRegistered && !isCompleted && isActive && (
                    <Button
                  onClick={() => navigate(`/olympiads/${id}/${slugify(ol.title)}/exam`)}
                      className="w-full bg-[#E8192C] hover:bg-[#d01725] text-white rounded-xl py-2.5 text-[13px] font-medium"
                    >
                      <Play className="w-4 h-4 mr-2" /> Imtihonni boshlash
                    </Button>
                  )}
                  {isCompleted && (
                    <div className="text-center py-2">
                      <p className="text-[13px] font-medium text-emerald-600">Siz allaqachon topshirdingiz</p>
                    </div>
                  )}
                  {isDisqualified && (
                    <div className="text-center py-2">
                      <p className="text-[13px] font-medium text-red-600">Siz chetlatilgansiz</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* LEADERBOARD TAB */}
          {activeTab === "leaderboard" && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left px-5 py-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider">O'rin</th>
                      <th className="text-left px-5 py-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider">Ishtirokchi</th>
                      <th className="text-left px-5 py-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider">Ball</th>
                      <th className="text-left px-5 py-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider">Vaqt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leaderboard?.map((reg: any, i: number) => (
                      <tr key={reg.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[13px] font-semibold ${
                            i === 0 ? "bg-amber-100 text-amber-700"
                            : i === 1 ? "bg-slate-200 text-slate-600"
                            : i === 2 ? "bg-amber-50 text-amber-600"
                            : "bg-slate-100 text-slate-500"
                          }`}>
                            {i < 3 ? (i === 0 ? <Trophy className="w-4 h-4" /> : `#${i + 1}`) : i + 1}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center text-[13px] font-medium text-slate-500">
                              {reg.user?.avatar_url ? (
                                <img src={rewriteStorageUrl(reg.user.avatar_url)} className="w-full h-full object-cover" alt="" />
                              ) : (
                                reg.user?.full_name?.substring(0, 1) || "U"
                              )}
                            </div>
                            <span className="text-[13px] font-medium text-slate-900">{reg.user?.full_name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-[13px] font-semibold text-slate-900">{reg.score || 0}</td>
                        <td className="px-5 py-3 text-[13px] font-medium text-slate-500">
                          {reg.completed_at ? new Date(reg.completed_at).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }) : "---"}
                        </td>
                      </tr>
                    ))}
                    {!leaderboard?.length && (
                      <tr>
                        <td colSpan={4} className="px-5 py-16 text-center text-[13px] font-medium text-slate-400">
                          Hozircha natijalar yo'q
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* ATTEMPTS TAB */}
          {activeTab === "attempts" && (
            <motion.div
              key="attempts"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              {myAttempts?.length ? (
                <div className="space-y-3">
                  {myAttempts.map((attempt: any) => (
                    <div key={attempt.id} className="bg-white border border-slate-200 rounded-2xl p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
                            <History className="w-5 h-5 text-slate-400" />
                          </div>
                          <div>
                            <p className="text-[13px] font-medium text-slate-900">
                              Urinish — {new Date(attempt.created_at).toLocaleDateString("uz-UZ")}
                            </p>
                            <p className="text-[11px] font-medium text-slate-400">
                              {new Date(attempt.created_at).toLocaleTimeString("uz-UZ")} • {attempt.total_questions} ta savol
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-slate-900">{attempt.score} ball</p>
                          <p className="text-[11px] font-medium text-slate-400">
                            <span className="text-emerald-600">{attempt.correct_answers} to'g'ri</span>
                            {" / "}
                            <span className="text-red-500">{attempt.wrong_answers} noto'g'ri</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <History className="w-6 h-6 text-slate-300" />
                  </div>
                  <p className="text-[13px] font-medium text-slate-500">Sizda hali urinishlar mavjud emas</p>
                </div>
              )}
            </motion.div>
          )}

          {/* QUESTIONS TAB — only after completion */}
          {activeTab === "questions" && isCompleted && (
            <motion.div
              key="questions"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              {/* Score summary */}
              {myAttempts?.[0] && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Sizning natijangiz</p>
                      <p className="text-2xl font-semibold text-slate-900 mt-1">{myAttempts[0].score} ball</p>
                    </div>
                    <div className="flex items-center gap-4 text-[13px] font-medium">
                      <span className="text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">{myAttempts[0].correct_answers} to'g'ri</span>
                      <span className="text-red-500 bg-red-50 px-3 py-1 rounded-lg">{myAttempts[0].wrong_answers} noto'g'ri</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Questions list */}
              {questions?.map((q: any, idx: number) => (
                <div key={q.id} className="bg-white border border-slate-200 rounded-2xl p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-[13px] font-medium text-slate-500 shrink-0">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-[13px] font-medium text-slate-900 leading-relaxed">{q.question_text}</p>
                      {q.image_url && (
                        <img src={rewriteStorageUrl(q.image_url)} alt="" className="mt-3 max-w-xs rounded-xl border border-slate-200" />
                      )}
                    </div>
                    {q.points > 1 && (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-lg text-[11px] font-medium shrink-0">
                        {q.points} ball
                      </span>
                    )}
                  </div>

                  {/* Options */}
                  <div className="space-y-2 ml-11">
                    {q.options?.map((opt: string, optIdx: number) => {
                      const isCorrect = optIdx === q.correct_option;
                      return (
                        <div
                          key={optIdx}
                          className={`flex items-center gap-3 p-3 rounded-xl border text-[13px] font-medium ${
                            isCorrect
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                              : "bg-slate-50 border-slate-100 text-slate-500"
                          }`}
                        >
                          <span className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-medium shrink-0 ${
                            isCorrect ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"
                          }`}>
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="flex-1">{opt}</span>
                          {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {!questions?.length && (
                <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center">
                  <p className="text-[13px] font-medium text-slate-400">Savollar yuklanmadi</p>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};

export default OlympiadDetails;
