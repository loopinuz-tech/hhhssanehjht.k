import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ChatDotsIcon } from "@solar-icons/react/bold-duotone/chat-dots";
import { StarIcon } from "@solar-icons/react/bold-duotone/star";
import { CloseSquareIcon } from "@solar-icons/react/bold-duotone/close-square";
import { MagnifierIcon } from "@solar-icons/react/bold-duotone/magnifier";
import { UserIcon } from "@solar-icons/react/bold-duotone/user";
import { RefreshIcon } from "@solar-icons/react/bold-duotone/refresh";
import { CheckReadIcon } from "@solar-icons/react/bold-duotone/check-read";
import { EyeIcon } from "@solar-icons/react/bold-duotone/eye";
import { rewriteStorageUrl } from "@/lib/storage";

const typeConfig: Record<string, { label: string; color: string }> = {
  positive: { label: "Ijobiy", color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" },
  negative: { label: "Salbiy", color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20" },
  bug_report: { label: "Xatolik (Bug)", color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20" },
  feature_request: { label: "Taklif", color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20" },
  general: { label: "Umumiy", color: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-white/10 dark:text-slate-300 dark:border-white/10" },
};

const typeFilters = [
  { key: "all", label: "Barchasi" },
  { key: "positive", label: "Ijobiy" },
  { key: "negative", label: "Salbiy" },
  { key: "bug_report", label: "Xatoliklar" },
  { key: "feature_request", label: "Takliflar" },
];

const AdminFeedback = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedFeedback, setSelectedFeedback] = useState<any | null>(null);
  const [reply, setReply] = useState("");

  const { data: feedbacks = [], isLoading } = useQuery({
    queryKey: ["admin-platform-feedback"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("platform_feedback")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map((f: any) => f.user_id))];
        const { data: profiles } = await (supabase as any)
          .from("profiles")
          .select("user_id, full_name, phone")
          .in("user_id", userIds);
        const profileMap: Record<string, any> = {};
        profiles?.forEach((p: any) => {
          profileMap[p.user_id] = p;
        });
        return data.map((f: any) => ({
          ...f,
          user_name: profileMap[f.user_id]?.full_name || "Noma'lum foydalanuvchi",
          user_phone: profileMap[f.user_id]?.phone || "",
        }));
      }
      return data || [];
    },
    refetchInterval: 60000,
  });

  const replyMutation = useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      if (!userId) return;
      const { error: notifError } = await (supabase as any).from("notifications").insert({
        user_id: userId,
        title: "Fikr-mulohazangiz bo'yicha javob",
        message: reply || "Siz qoldirgan fikr-mulohaza ma'muriyat tomonidan o'rganib chiqildi.",
        type: "info",
      });
      if (notifError) throw notifError;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-platform-feedback"] });
      setSelectedFeedback(null);
      setReply("");
      toast({ title: "Javob foydalanuvchiga yuborildi!", className: "bg-emerald-600 text-white border-none rounded-xl" });
    },
    onError: (e: any) => {
      toast({ title: "Xatolik", description: e.message, variant: "destructive" });
    },
  });

  const stats = useMemo(() => {
    const total = feedbacks.length;
    const positive = feedbacks.filter((f: any) => f.feedback_type === "positive").length;
    const negative = feedbacks.filter((f: any) => f.feedback_type === "negative").length;
    const avgRating = total > 0
      ? (feedbacks.reduce((sum: number, f: any) => sum + (f.rating || 0), 0) / total).toFixed(1)
      : "0";
    return { total, positive, negative, avgRating };
  }, [feedbacks]);

  // ---- Exit Survey Data ----
  const { data: exitSurveys = [], isLoading: exitLoading } = useQuery({
    queryKey: ["admin-exit-surveys"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("feedback_exit_survey")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map((r: any) => r.user_id))];
        const { data: profiles } = await (supabase as any)
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds);
        const pm: Record<string, string> = {};
        profiles?.forEach((p: any) => { pm[p.user_id] = p.full_name || "Noma'lum"; });
        return data.map((r: any) => ({ ...r, user_name: pm[r.user_id] || "Noma'lum" }));
      }
      return data || [];
    },
  });

  const EXIT_REASON_LABELS: Record<string, string> = {
    price_too_high:   "Narxi qimmat",
    question_quality: "Savollar sifati",
    ui_confusing:     "Interfeys chalkash",
    subject_missing:  "Kerakli fan yo'q",
    no_time:          "Vaqt yo'q",
    other:            "Boshqa sabab",
    skipped:          "O'tkazib yubordi",
  };

  const exitStats = useMemo(() => {
    const counts: Record<string, number> = {};
    exitSurveys.forEach((r: any) => {
      counts[r.reason_category] = (counts[r.reason_category] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([key, count]) => ({ key, label: EXIT_REASON_LABELS[key] || key, count }))
      .sort((a, b) => b.count - a.count);
  }, [exitSurveys]);

  const exitTotal = exitSurveys.length;
  const exitReal  = exitSurveys.filter((r: any) => r.reason_category !== "skipped").length;

  const filtered = useMemo(() => {
    return feedbacks.filter((f: any) => {
      const matchFilter = filter === "all" ? true : f.feedback_type === filter;
      const matchSearch =
        !search ||
        (f.user_name && f.user_name.toLowerCase().includes(search.toLowerCase())) ||
        (f.message && f.message.toLowerCase().includes(search.toLowerCase())) ||
        (f.category && f.category.toLowerCase().includes(search.toLowerCase()));
      return matchFilter && matchSearch;
    });
  }, [feedbacks, filter, search]);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <StarIcon
        key={i}
        className={`w-3.5 h-3.5 ${i < rating ? "text-amber-400 fill-amber-400" : "text-slate-200 dark:text-slate-700"}`}
      />
    ));
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");
    return `${day}.${month}.${year} ${hours}:${mins}`;
  };

  const handleOpenDetail = (item: any) => {
    setSelectedFeedback(item);
    setReply(item.admin_reply || "");
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5 bg-white dark:bg-[#0A0F1A] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-4 lg:p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20 text-violet-500 shrink-0">
            <ChatDotsIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">Fikr-Mulohazalar Boshqaruvi</h1>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">Foydalanuvchilar tomonidan platformaga qoldirilgan fikr va baholar</p>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-[#0A0F1A] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between min-h-[120px] sm:min-h-[130px]">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Jami Fikrlar
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-500/20">
              <ChatDotsIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white leading-tight">
              {stats.total}
            </div>
            <p className="text-[10.5px] sm:text-[11.5px] font-semibold text-slate-500 dark:text-slate-400 mt-1 truncate">
              Qoldirilgan barcha izohlar
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0A0F1A] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between min-h-[120px] sm:min-h-[130px]">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[10px] sm:text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Ijobiy Baholar
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-500/20">
              <StarIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-emerald-500 fill-emerald-500" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl sm:text-2xl lg:text-3xl font-black text-emerald-600 dark:text-emerald-400 leading-tight">
              {stats.positive}
            </div>
            <p className="text-[10.5px] sm:text-[11.5px] font-semibold text-emerald-700 dark:text-emerald-300 mt-1 truncate">
              Mamnun foydalanuvchilar
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0A0F1A] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between min-h-[120px] sm:min-h-[130px]">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[10px] sm:text-[11px] font-extrabold text-red-600 dark:text-red-400 uppercase tracking-wider">
              Salbiy / Xatolar
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 flex items-center justify-center shrink-0 border border-red-100 dark:border-red-500/20">
              <StarIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-red-500" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl sm:text-2xl lg:text-3xl font-black text-red-600 dark:text-red-400 leading-tight">
              {stats.negative}
            </div>
            <p className="text-[10.5px] sm:text-[11.5px] font-semibold text-slate-500 dark:text-slate-400 mt-1 truncate">
              Tuzatilishi kerak bo'lganlar
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0A0F1A] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between min-h-[120px] sm:min-h-[130px]">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[10px] sm:text-[11px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              O'rtacha Baho
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-500/20">
              <StarIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-500 fill-amber-500" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl sm:text-2xl lg:text-3xl font-black text-amber-600 dark:text-amber-400 leading-tight flex items-center gap-1.5">
              {stats.avgRating} <span className="text-sm font-bold text-slate-400 dark:text-slate-500">/ 5.0</span>
            </div>
            <p className="text-[10.5px] sm:text-[11.5px] font-semibold text-slate-500 dark:text-slate-400 mt-1 truncate">
              Platformaning umumiy reytingi
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs + Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex bg-slate-100 dark:bg-white/[0.04] p-1 rounded-xl overflow-x-auto w-full sm:w-auto">
          {typeFilters.map((tf) => (
            <button
              key={tf.key}
              onClick={() => setFilter(tf.key)}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-[11.5px] font-bold transition-all text-center whitespace-nowrap ${
                filter === tf.key
                  ? "bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:max-w-xs">
          <MagnifierIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Fikr, ism yoki kategoriya bo'yicha..."
            className="w-full h-9 pl-9 pr-3 bg-white dark:bg-[#0A0F1A] border border-slate-200 dark:border-white/[0.06] rounded-xl text-[12px] font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 shadow-xs"
          />
        </div>
      </div>

      {/* Feedbacks Table */}
      <div className="bg-white dark:bg-[#0A0F1A] border border-slate-200 dark:border-white/[0.06] rounded-2xl overflow-x-auto shadow-xs">
        <table className="w-full text-left border-collapse min-w-[750px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-white/[0.06] bg-slate-50/80 dark:bg-white/[0.02]">
              <th className="px-5 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Foydalanuvchi</th>
              <th className="px-5 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Fikr Turi</th>
              <th className="px-5 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Matn va Baho</th>
              <th className="px-5 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Kategoriya</th>
              <th className="px-5 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Sana</th>
              <th className="px-5 py-4 text-right text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.03]">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="text-center py-16">
                  <RefreshIcon className="w-6 h-6 animate-spin text-violet-500 mx-auto" />
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-16">
                  <ChatDotsIcon className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-400 font-medium">Fikrlar topilmadi</p>
                </td>
              </tr>
            ) : (
              filtered.map((f: any) => {
                const tc = typeConfig[f.feedback_type] || typeConfig.general;
                return (
                  <tr key={f.id} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors group">
                    <td className="px-5 py-4" style={{ paddingTop: "18px", paddingBottom: "18px" }}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center shrink-0 border border-slate-200/60 dark:border-white/[0.06] text-slate-500">
                          <UserIcon className="w-4.5 h-4.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-bold text-slate-900 dark:text-white truncate max-w-[180px]">
                            {f.user_name}
                          </p>
                          {f.user_phone && (
                            <p className="text-[10.5px] font-medium text-slate-400 truncate">
                              {f.user_phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4" style={{ paddingTop: "18px", paddingBottom: "18px" }}>
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-[10.5px] font-extrabold uppercase border transition-all ${tc.color}`}>
                        {tc.label}
                      </span>
                    </td>

                    <td className="px-5 py-4" style={{ paddingTop: "18px", paddingBottom: "18px" }}>
                      <div className="max-w-[280px] space-y-1">
                        <div className="flex items-center gap-1">
                          {renderStars(f.rating || 0)}
                        </div>
                        <p className="text-[12.5px] font-medium text-slate-800 dark:text-slate-200 line-clamp-2 leading-snug">
                          {f.message}
                        </p>
                        {f.admin_reply && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckReadIcon className="w-3 h-3" /> Javob berilgan
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-[12px] font-medium text-slate-500 dark:text-slate-400" style={{ paddingTop: "18px", paddingBottom: "18px" }}>
                      {f.category ? (
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 font-semibold text-[11px]">
                          {f.category}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td className="px-5 py-4 text-[11.5px] font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap" style={{ paddingTop: "18px", paddingBottom: "18px" }}>
                      {formatDate(f.created_at)}
                    </td>

                    <td className="px-5 py-4 text-right" style={{ paddingTop: "18px", paddingBottom: "18px" }}>
                      <button
                        onClick={() => handleOpenDetail(f)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-[11.5px] font-bold transition-all shadow-2xs cursor-pointer"
                      >
                        <EyeIcon className="w-4 h-4 text-violet-500" /> Ko'rish & Javob
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Feedback Detail & Reply Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#0A0F1A] border border-slate-200 dark:border-white/[0.08] rounded-3xl w-full max-w-2xl p-6 lg:p-7 space-y-5 shadow-2xl my-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center font-bold">
                  <ChatDotsIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Fikr-Mulohaza Tafsilotlari</h3>
                  <p className="text-xs text-slate-400">{selectedFeedback.user_name} qoldirgan izoh</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedFeedback(null)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
              >
                <CloseSquareIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Content Details */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 dark:bg-white/[0.02] p-4 rounded-2xl border border-slate-200/70 dark:border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-xl text-[10.5px] font-extrabold uppercase border ${(typeConfig[selectedFeedback.feedback_type] || typeConfig.general).color}`}>
                    {(typeConfig[selectedFeedback.feedback_type] || typeConfig.general).label}
                  </span>
                  {selectedFeedback.category && (
                    <span className="px-3 py-1 rounded-xl bg-slate-200/70 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                      {selectedFeedback.category}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-500">Baho:</span>
                  <div className="flex items-center gap-1">
                    {renderStars(selectedFeedback.rating || 0)}
                  </div>
                </div>
              </div>

              {/* Message quote */}
              <div className="p-4.5 bg-violet-50/40 dark:bg-violet-500/[0.03] border border-violet-200/60 dark:border-violet-500/10 rounded-2xl space-y-1">
                <p className="text-[10.5px] font-extrabold text-violet-700 dark:text-violet-400 uppercase tracking-wider">
                  Foydalanuvchi Xabari:
                </p>
                <p className="text-[13px] font-medium text-slate-900 dark:text-white leading-relaxed">
                  "{selectedFeedback.message}"
                </p>
              </div>

              {/* Attached Image if exists */}
              {selectedFeedback.image_url && (
                <div>
                  <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">Biriktirilgan Rasm:</p>
                  <a href={selectedFeedback.image_url} target="_blank" rel="noopener noreferrer" className="inline-block group">
                    <img
                      src={rewriteStorageUrl(selectedFeedback.image_url)}
                      className="h-40 rounded-2xl object-cover border border-slate-200 dark:border-white/10 shadow-2xs group-hover:opacity-90 transition-opacity"
                      alt="Attachment"
                    />
                  </a>
                </div>
              )}

              {/* Admin reply area */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Foydalanuvchiga Admin Javobi (Ixtiyoriy)
                </label>
                <textarea
                  rows={4}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Foydalanuvchiga fikr-mulohaza bo'yicha minnatdorchilik yoki javob yozing..."
                  className="w-full p-3.5 bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.08] rounded-xl text-[13px] font-medium leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/20 shadow-inner"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
              <button
                type="button"
                onClick={() => setSelectedFeedback(null)}
                className="px-4 py-2 rounded-xl text-[12px] font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
              >
                Yopish
              </button>
              <button
                type="button"
                disabled={replyMutation.isPending || !reply.trim()}
                onClick={() => replyMutation.mutate({ userId: selectedFeedback.user_id })}
                className="flex items-center gap-2 px-6 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-[12.5px] font-extrabold shadow-md hover:shadow-violet-500/20 disabled:opacity-50 transition-all cursor-pointer"
              >
                {replyMutation.isPending ? <RefreshIcon className="w-4 h-4 animate-spin" /> : <CheckReadIcon className="w-4 h-4" />}
                Javobni Yuborish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          EXIT SURVEY SECTION
      ============================================================ */}
      <div className="bg-white dark:bg-[#0A0F1A] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 shadow-xs space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-base font-extrabold text-slate-900 dark:text-white">Chiqish So'rovnomasi</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#FEE2E2", color: "#C8001A" }}>EXIT INTENT</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Foydalanuvchilar platformadan chiqishda bildirgan sabablar</p>
          </div>
          <div className="flex gap-4 text-center">
            <div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">{exitTotal}</div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Jami</div>
            </div>
            <div>
              <div className="text-2xl font-black" style={{ color: "#C8001A" }}>{exitReal}</div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Javob berdi</div>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {exitSurveys.filter((r: any) => r.reason_category === "skipped").length}
              </div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Skip qildi</div>
            </div>
          </div>
        </div>

        {exitLoading ? (
          <div className="flex items-center justify-center h-24">
            <RefreshIcon className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : exitTotal === 0 ? (
          <div className="text-center py-10 text-slate-400 dark:text-slate-600 text-sm font-medium">
            Hali hech qanday ma'lumot yo'q
          </div>
        ) : (
          <>
            {/* Bar Chart by Reason */}
            <div className="space-y-2.5">
              {exitStats.map(({ key, label, count }) => {
                const pct = exitTotal > 0 ? Math.round((count / exitTotal) * 100) : 0;
                const isSkipped = key === "skipped";
                return (
                  <div key={key} className="flex items-center gap-3">
                    <div className="w-36 text-xs font-semibold text-slate-600 dark:text-slate-300 truncate flex-shrink-0">{label}</div>
                    <div className="flex-1 h-5 bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          background: isSkipped ? "#94a3b8" : "#C8001A",
                        }}
                      />
                    </div>
                    <div className="w-14 text-right text-xs font-bold text-slate-700 dark:text-slate-200">
                      {count} <span className="text-slate-400 font-medium">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Recent 50 entries table */}
            <div>
              <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Oxirgi yozuvlar</p>
              <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-white/[0.06]">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-white/[0.03] text-slate-500 dark:text-slate-400">
                      <th className="text-left px-3 py-2.5 font-bold">Foydalanuvchi</th>
                      <th className="text-left px-3 py-2.5 font-bold">Sabab</th>
                      <th className="text-left px-3 py-2.5 font-bold hidden md:table-cell">Izoh</th>
                      <th className="text-left px-3 py-2.5 font-bold">Sana</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                    {exitSurveys.slice(0, 50).map((r: any) => (
                      <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="px-3 py-2 font-medium text-slate-700 dark:text-slate-300">{r.user_name}</td>
                        <td className="px-3 py-2">
                          <span
                            className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold"
                            style={{
                              background: r.reason_category === "skipped" ? "#f1f5f9" : "#FEE2E2",
                              color: r.reason_category === "skipped" ? "#64748b" : "#C8001A",
                            }}
                          >
                            {EXIT_REASON_LABELS[r.reason_category] || r.reason_category}
                          </span>
                        </td>
                        <td className="px-3 py-2 hidden md:table-cell text-slate-500 dark:text-slate-400 max-w-[200px] truncate">
                          {r.free_text || <span className="text-slate-300 dark:text-slate-600">—</span>}
                        </td>
                        <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{formatDate(r.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

    </div>
  );
};

export default AdminFeedback;
