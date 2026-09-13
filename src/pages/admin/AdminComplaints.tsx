import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DangerTriangleIcon } from "@solar-icons/react/bold-duotone/danger-triangle";
import { CheckCircleIcon } from "@solar-icons/react/bold-duotone/check-circle";
import { ClockCircleIcon } from "@solar-icons/react/bold-duotone/clock-circle";
import { ChatDotsIcon } from "@solar-icons/react/bold-duotone/chat-dots";
import { EyeIcon } from "@solar-icons/react/bold-duotone/eye";
import { MagnifierIcon } from "@solar-icons/react/bold-duotone/magnifier";
import { ShieldWarningIcon } from "@solar-icons/react/bold-duotone/shield-warning";
import { CloseSquareIcon } from "@solar-icons/react/bold-duotone/close-square";
import { RefreshIcon } from "@solar-icons/react/bold-duotone/refresh";
import { CheckReadIcon } from "@solar-icons/react/bold-duotone/check-read";
import { UserIcon } from "@solar-icons/react/bold-duotone/user";
import { FileTextIcon } from "@solar-icons/react/bold-duotone/file-text";

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Kutilmoqda", color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20" },
  reviewed: { label: "Ko'rib chiqilmoqda", color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20" },
  resolved: { label: "Hal qilindi", color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" },
};

const statusFilters = [
  { key: "all", label: "Barchasi" },
  { key: "pending", label: "Kutilmoqda" },
  { key: "reviewed", label: "Ko'rib chiqilmoqda" },
  { key: "resolved", label: "Hal qilindi" },
];

const AdminComplaints = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedComplaint, setSelectedComplaint] = useState<any | null>(null);
  const [reply, setReply] = useState("");
  const [replyStatus, setReplyStatus] = useState<"pending" | "reviewed" | "resolved">("resolved");

  // Complaints data with 30s polling instead of continuous WebSocket subscription
  const { data: complaints = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-complaints"],
    queryFn: async () => {
      const { data: rawComplaints, error } = await (supabase as any)
        .from("complaints")
        .select("*")
        .order("created_at", { ascending: false });

      if (error || !rawComplaints) return [];

      const userIds = [...new Set(rawComplaints.map((c: any) => c.user_id).filter(Boolean))] as string[];
      const questionIds = [...new Set(rawComplaints.map((c: any) => c.question_id).filter(Boolean))] as string[];

      const profileMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await (supabase as any)
          .from("profiles")
          .select("id, user_id, full_name, phone, email")
          .in("user_id", userIds);

        profiles?.forEach((p: any) => {
          if (p.user_id) profileMap[p.user_id] = p;
          if (p.id) profileMap[p.id] = p;
        });

        const missingUserIds = userIds.filter((id: string) => !profileMap[id]);
        if (missingUserIds.length > 0) {
          const { data: profilesById } = await (supabase as any)
            .from("profiles")
            .select("id, user_id, full_name, phone, email")
            .in("id", missingUserIds);

          profilesById?.forEach((p: any) => {
            if (p.user_id) profileMap[p.user_id] = p;
            if (p.id) profileMap[p.id] = p;
          });
        }
      }

      const questionMap: Record<string, any> = {};
      if (questionIds.length > 0) {
        const { data: questionsData } = await (supabase as any)
          .from("questions")
          .select("id, question_text, folder_id")
          .in("id", questionIds);

        questionsData?.forEach((q: any) => {
          questionMap[q.id] = q;
        });
      }

      return rawComplaints.map((c: any) => {
        const prof = profileMap[c.user_id] || {};
        const qObj = questionMap[c.question_id];
        return {
          ...c,
          question: qObj || c.question || null,
          user_name: prof.full_name || prof.email || (c.user_id ? `Foydalanuvchi #${String(c.user_id).slice(0, 8)}` : "Noma'lum foydalanuvchi"),
          user_phone: prof.phone || prof.email || "",
        };
      });
    },
    refetchInterval: 30000,
  });

  const replyMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "pending" | "reviewed" | "resolved" }) => {
      const { data: complaint, error: updateError } = await (supabase as any)
        .from("complaints")
        .update({ admin_reply: reply, status })
        .eq("id", id)
        .select()
        .single();
      if (updateError) throw updateError;
      if (complaint) {
        await (supabase as any).from("notifications").insert({
          user_id: complaint.user_id,
          title: status === "resolved" ? "Shikoyatingiz hal qilindi" : "Shikoyatingiz ko'rib chiqildi",
          message: reply || "Siz yuborgan shikoyat bo'yicha masala hal qilindi.",
          type: status === "resolved" ? "success" : "info",
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-complaints"] });
      setSelectedComplaint(null);
      setReply("");
      toast({ title: "Javob va holat saqlandi!", className: "bg-emerald-600 text-white border-none rounded-xl" });
    },
    onError: (e: any) => {
      toast({ title: "Xatolik", description: e.message, variant: "destructive" });
    },
  });

  const stats = useMemo(() => {
    const total = complaints.length;
    const pending = complaints.filter((c: any) => c.status === "pending").length;
    const reviewed = complaints.filter((c: any) => c.status === "reviewed").length;
    const resolved = complaints.filter((c: any) => c.status === "resolved").length;
    return { total, pending, reviewed, resolved };
  }, [complaints]);

  const filtered = useMemo(() => {
    return complaints.filter((c: any) => {
      const matchFilter = filter === "all" ? true : c.status === filter;
      const matchSearch =
        !search ||
        (c.user_name && c.user_name.toLowerCase().includes(search.toLowerCase())) ||
        (c.message && c.message.toLowerCase().includes(search.toLowerCase())) ||
        (c.question?.question_text && c.question.question_text.toLowerCase().includes(search.toLowerCase()));
      return matchFilter && matchSearch;
    });
  }, [complaints, filter, search]);

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

  const handleOpenDetail = (complaint: any) => {
    setSelectedComplaint(complaint);
    setReply(complaint.admin_reply || "");
    setReplyStatus(complaint.status || "resolved");
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5 bg-white dark:bg-[#0A0F1A] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-4 lg:p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-500 shrink-0">
            <DangerTriangleIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">Shikoyatlar Boshqaruvi</h1>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">Testlar va savollar bo'yicha kelib tushgan shikoyatlarni ko'rish va hal etish</p>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-[#0A0F1A] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between min-h-[120px] sm:min-h-[130px]">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Jami Shikoyatlar
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-500/20">
              <DangerTriangleIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white leading-tight">
              {stats.total}
            </div>
            <p className="text-[10.5px] sm:text-[11.5px] font-semibold text-slate-500 dark:text-slate-400 mt-1 truncate">
              Barcha bildirilgan shikoyatlar
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0A0F1A] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between min-h-[120px] sm:min-h-[130px]">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[10px] sm:text-[11px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Kutilmoqda
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-500/20">
              <ClockCircleIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl sm:text-2xl lg:text-3xl font-black text-amber-600 dark:text-amber-400 leading-tight">
              {stats.pending}
            </div>
            <p className="text-[10.5px] sm:text-[11.5px] font-semibold text-amber-700 dark:text-amber-300 mt-1 truncate">
              Ko'rilishi kutilayotganlar
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0A0F1A] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between min-h-[120px] sm:min-h-[130px]">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[10px] sm:text-[11px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Ko'rib Chiqilmoqda
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-500/20">
              <EyeIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl sm:text-2xl lg:text-3xl font-black text-blue-600 dark:text-blue-400 leading-tight">
              {stats.reviewed}
            </div>
            <p className="text-[10.5px] sm:text-[11.5px] font-semibold text-slate-500 dark:text-slate-400 mt-1 truncate">
              Jarayondagi shikoyatlar
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0A0F1A] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between min-h-[120px] sm:min-h-[130px]">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[10px] sm:text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Hal Qilingan
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-500/20">
              <CheckCircleIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl sm:text-2xl lg:text-3xl font-black text-emerald-600 dark:text-emerald-400 leading-tight">
              {stats.resolved}
            </div>
            <p className="text-[10.5px] sm:text-[11.5px] font-semibold text-slate-500 dark:text-slate-400 mt-1 truncate">
              Muvaffaqiyatli hal etilgan
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs + Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex bg-slate-100 dark:bg-white/[0.04] p-1 rounded-xl overflow-x-auto w-full sm:w-auto">
          {statusFilters.map((sf) => (
            <button
              key={sf.key}
              onClick={() => setFilter(sf.key)}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-[11.5px] font-bold transition-all text-center whitespace-nowrap ${
                filter === sf.key
                  ? "bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {sf.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:max-w-xs">
          <MagnifierIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Shikoyat, ism yoki savol bo'yicha qidiruv..."
            className="w-full h-9 pl-9 pr-3 bg-white dark:bg-[#0A0F1A] border border-slate-200 dark:border-white/[0.06] rounded-xl text-[12px] font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 shadow-xs"
          />
        </div>
      </div>

      {/* Complaints Table */}
      <div className="bg-white dark:bg-[#0A0F1A] border border-slate-200 dark:border-white/[0.06] rounded-2xl overflow-x-auto shadow-xs">
        <table className="w-full text-left border-collapse min-w-[750px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-white/[0.06] bg-slate-50/80 dark:bg-white/[0.02]">
              <th className="px-5 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Foydalanuvchi</th>
              <th className="px-5 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Shikoyat Matni</th>
              <th className="px-5 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Tegishli Savol</th>
              <th className="px-5 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Holat</th>
              <th className="px-5 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Sana</th>
              <th className="px-5 py-4 text-right text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.03]">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="text-center py-16">
                  <RefreshIcon className="w-6 h-6 animate-spin text-amber-500 mx-auto" />
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-16">
                  <ShieldWarningIcon className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-400 font-medium">Shikoyatlar topilmadi</p>
                </td>
              </tr>
            ) : (
              filtered.map((c: any) => {
                const st = statusConfig[c.status] || statusConfig.pending;
                return (
                  <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors group">
                    <td className="px-5 py-4" style={{ paddingTop: "18px", paddingBottom: "18px" }}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center shrink-0 border border-slate-200/60 dark:border-white/[0.06] text-slate-500">
                          <UserIcon className="w-4.5 h-4.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-bold text-slate-900 dark:text-white truncate max-w-[180px]">
                            {c.user_name}
                          </p>
                          {c.user_phone && (
                            <p className="text-[10.5px] font-medium text-slate-400 truncate">
                              {c.user_phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4" style={{ paddingTop: "18px", paddingBottom: "18px" }}>
                      <div className="max-w-[260px]">
                        <p className="text-[12.5px] font-medium text-slate-800 dark:text-slate-200 line-clamp-2 leading-snug">
                          {c.message}
                        </p>
                        {c.admin_reply && (
                          <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckReadIcon className="w-3 h-3" /> Javob berilgan
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4" style={{ paddingTop: "18px", paddingBottom: "18px" }}>
                      <div className="max-w-[220px]">
                        {c.question?.question_text ? (
                          <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 line-clamp-2 italic">
                            "{c.question.question_text}"
                          </p>
                        ) : (
                          <span className="text-[11.5px] font-medium text-slate-400">—</span>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4" style={{ paddingTop: "18px", paddingBottom: "18px" }}>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10.5px] font-extrabold uppercase border transition-all ${st.color}`}>
                        {st.label}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-[11.5px] font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap" style={{ paddingTop: "18px", paddingBottom: "18px" }}>
                      {formatDate(c.created_at)}
                    </td>

                    <td className="px-5 py-4 text-right" style={{ paddingTop: "18px", paddingBottom: "18px" }}>
                      <button
                        onClick={() => handleOpenDetail(c)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-[11.5px] font-bold transition-all shadow-2xs cursor-pointer"
                      >
                        <ChatDotsIcon className="w-4 h-4 text-amber-500" /> Javob berish
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Complaint Detail & Reply Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#0A0F1A] border border-slate-200 dark:border-white/[0.08] rounded-3xl w-full max-w-2xl p-6 lg:p-7 space-y-5 shadow-2xl my-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                  <ChatDotsIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Shikoyatni Ko'rib Chiqish va Javob</h3>
                  <p className="text-xs text-slate-400">{selectedComplaint.user_name} yuborgan xabar</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
              >
                <CloseSquareIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Complaint Info Cards */}
            <div className="space-y-3.5">
              {/* Question preview if exists */}
              {selectedComplaint.question?.question_text && (
                <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/[0.06] rounded-2xl p-4 space-y-1">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileTextIcon className="w-3.5 h-3.5 text-amber-500" /> Shikoyat Qilingan Savol:
                  </p>
                  <p className="text-[13px] font-medium text-slate-800 dark:text-slate-200 italic">
                    "{selectedComplaint.question.question_text}"
                  </p>
                </div>
              )}

              {/* User message */}
              <div className="bg-amber-50/50 dark:bg-amber-500/[0.04] border border-amber-200/60 dark:border-amber-500/10 rounded-2xl p-4 space-y-1">
                <p className="text-[10px] font-extrabold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                  Foydalanuvchi shikoyati:
                </p>
                <p className="text-[13px] font-semibold text-slate-900 dark:text-white leading-relaxed">
                  {selectedComplaint.message}
                </p>
              </div>

              {/* Status selection */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Shikoyat Holatini O'zgartirish
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["pending", "reviewed", "resolved"] as const).map((st) => {
                    const cfg = statusConfig[st];
                    const active = replyStatus === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setReplyStatus(st)}
                        className={`py-2 px-3 rounded-xl text-[11.5px] font-extrabold transition-all border text-center cursor-pointer ${
                          active
                            ? cfg.color + " shadow-xs ring-2 ring-amber-500/20"
                            : "bg-slate-50 dark:bg-white/[0.03] text-slate-500 border-slate-200 dark:border-white/10"
                        }`}
                      >
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Template buttons */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tayyor Javob Shablonlari:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Xatolik tuzatildi. Bildirganingiz uchun rahmat!",
                    "Savol qayta tekshirildi, to'g'ri berilgan.",
                    "Tashakkur, taklif inobatga olindi.",
                  ].map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setReply(tmpl)}
                      className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 text-[11px] font-semibold transition-all cursor-pointer"
                    >
                      + {tmpl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Admin reply textarea */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Foydalanuvchiga Admin Javobi
                </label>
                <textarea
                  rows={4}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Foydalanuvchiga javobingizni shu yerga yozing..."
                  className="w-full p-3.5 bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.08] rounded-xl text-[13px] font-medium leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/20 shadow-inner"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
              <button
                type="button"
                onClick={() => setSelectedComplaint(null)}
                className="px-4 py-2 rounded-xl text-[12px] font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                disabled={replyMutation.isPending || !reply.trim()}
                onClick={() => replyMutation.mutate({ id: selectedComplaint.id, status: replyStatus })}
                className="flex items-center gap-2 px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[12.5px] font-extrabold shadow-md hover:shadow-amber-500/20 disabled:opacity-50 transition-all cursor-pointer"
              >
                {replyMutation.isPending ? <RefreshIcon className="w-4 h-4 animate-spin" /> : <CheckReadIcon className="w-4 h-4" />}
                Javobni Saqlash & Yuborish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminComplaints;
