import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { CheckCircleIcon } from "@solar-icons/react/bold-duotone/check-circle";
import { CloseCircleIcon } from "@solar-icons/react/bold-duotone/close-circle";
import { RefreshIcon } from "@solar-icons/react/bold-duotone/refresh";
import { MagnifierIcon } from "@solar-icons/react/bold-duotone/magnifier";
import { AltArrowDownIcon } from "@solar-icons/react/bold-duotone/alt-arrow-down";
import { AltArrowUpIcon } from "@solar-icons/react/bold-duotone/alt-arrow-up";
import { FileTextIcon } from "@solar-icons/react/bold-duotone/file-text";
import { UserCheckIcon } from "@solar-icons/react/bold-duotone/user-check";
import { CheckSquareIcon } from "@solar-icons/react/bold-duotone/check-square";
import { FolderOpenIcon } from "@solar-icons/react/bold-duotone/folder-open";
import { Square } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const AdminModeration = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [filter, setFilter] = useState<"pending" | "active" | "rejected" | "all">("pending");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedFolderId, setSelectedFolderId] = useState<string>("all");

  // Fetch questions with status
  const { data: questions = [], isLoading } = useQuery({
    queryKey: ["admin-moderation-questions", filter],
    queryFn: async () => {
      let query = supabase
        .from("questions")
        .select("*")
        .order("created_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data, error } = await query;
      if (error) {
        console.error("Fetch error:", error);
        throw error;
      }

      if (!data || data.length === 0) return [];

      // Get folder names
      const folderIds = [...new Set(data.map((q: any) => q.folder_id).filter(Boolean))];
      let folderMap = new Map();
      if (folderIds.length > 0) {
        const { data: folders } = await supabase
          .from("test_folders")
          .select("id, name, subject")
          .in("id", folderIds);
        folderMap = new Map((folders || []).map((f: any) => [f.id, f]));
      }

      // Get submitter names
      const submitterIds = [...new Set(data.map((q: any) => q.submitted_by).filter(Boolean))];
      let submitterMap = new Map();
      if (submitterIds.length > 0) {
        const { data: submitters } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", submitterIds);
        submitterMap = new Map((submitters || []).map((s: any) => [s.id, s]));
      }

      return data.map((q: any) => ({
        ...q,
        folder: folderMap.get(q.folder_id) || null,
        submitter: submitterMap.get(q.submitted_by) || null,
      }));
    },
  });

  // Approve single mutation
  const approveMutation = useMutation({
    mutationFn: async (questionId: string) => {
      console.log("Approving question:", questionId);
      const { data, error } = await (supabase
        .from("questions" as any) as any)
        .update({ status: "active" })
        .eq("id", questionId)
        .select("id, status");
      if (error) {
        console.error("Approve error:", error);
        throw error;
      }
      console.log("Approve result:", data);
      return data;
    },
    onSuccess: (data: any) => {
      const count = data?.length || 0;
      if (count > 0) {
        toast({ title: "Tasdiqlandi!", description: "Savol faol holatga o'tkazildi" });
      } else {
        toast({ title: "Xatolik", description: "Savol topilmadi yoki allaqachon faol", variant: "destructive" });
      }
      qc.invalidateQueries({ queryKey: ["admin-moderation-questions"] });
    },
    onError: (err: any) => {
      console.error("Approve onError:", err);
      toast({ title: "Xatolik", description: err.message || "Tasdiqlashda xatolik", variant: "destructive" });
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { data, error } = await (supabase
        .from("questions" as any) as any)
        .update({ status: "rejected" })
        .eq("id", id)
        .select("id");
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Rad etildi", description: "Savol rad etilgan holatga o'tkazildi" });
      qc.invalidateQueries({ queryKey: ["admin-moderation-questions"] });
    },
    onError: (err: any) => {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    },
  });

  // Bulk approve mutation
  const bulkApproveMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      console.log("Bulk approving:", ids);
      const { data, error } = await (supabase
        .from("questions" as any) as any)
        .update({ status: "active" })
        .in("id", ids)
        .select("id");
      if (error) {
        console.error("Bulk approve error:", error);
        throw error;
      }
      console.log("Bulk approve result:", data);
      return data;
    },
    onSuccess: (data: any) => {
      const count = data?.length || 0;
      toast({ title: "Tasdiqlandi!", description: `${count} ta savol faol holatga o'tkazildi` });
      setSelectedIds(new Set());
      qc.invalidateQueries({ queryKey: ["admin-moderation-questions"] });
    },
    onError: (err: any) => {
      console.error("Bulk approve onError:", err);
      toast({ title: "Xatolik", description: err.message || "Ommaviy tasdiqlashda xatolik", variant: "destructive" });
    },
  });

  // Bulk reject mutation
  const bulkRejectMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { data, error } = await (supabase
        .from("questions" as any) as any)
        .update({ status: "rejected" })
        .in("id", ids)
        .select("id");
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      toast({ title: "Rad etildi", description: `${data?.length || 0} ta savol rad etildi` });
      setSelectedIds(new Set());
      qc.invalidateQueries({ queryKey: ["admin-moderation-questions"] });
    },
  });

  const foldersWithQuestions = (() => {
    const map = new Map<string, { id: string; name: string; count: number }>();
    for (const q of questions) {
      if (q.folder_id && q.folder) {
        const existing = map.get(q.folder_id);
        if (existing) {
          existing.count++;
        } else {
          map.set(q.folder_id, { id: q.folder_id, name: q.folder.name, count: 1 });
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  })();

  const filteredQuestions = questions.filter((q: any) => {
    if (selectedFolderId !== "all" && q.folder_id !== selectedFolderId) return false;
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      q.question_text?.toLowerCase().includes(search) ||
      q.folder?.name?.toLowerCase().includes(search) ||
      q.submitter?.full_name?.toLowerCase().includes(search) ||
      q.submitter?.email?.toLowerCase().includes(search)
    );
  });

  const pendingCount = questions.filter((q: any) => q.status === "pending").length;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    const filteredPendingIds = filteredQuestions.filter((q: any) => q.status === "pending").map((q: any) => q.id);
    if (selectedIds.size === filteredPendingIds.length && filteredPendingIds.every((id) => selectedIds.has(id))) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredPendingIds));
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0a0f1a] p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <CheckCircleIcon className="w-5 h-5 text-green-500" />
          Savollarni tasdiqlash
        </h1>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
          Foydalanuvchilar tomonidan yuborilgan savollarni ko'rib chiqish
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-white dark:bg-[#0f1419] rounded-xl border border-slate-100 dark:border-white/[0.06] p-4">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Kutilmoqda</p>
          <p className="text-xl font-bold text-amber-500 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-white dark:bg-[#0f1419] rounded-xl border border-slate-100 dark:border-white/[0.06] p-4">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Jami</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{questions.length}</p>
        </div>
        <div className="bg-white dark:bg-[#0f1419] rounded-xl border border-slate-100 dark:border-white/[0.06] p-4">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Faol</p>
          <p className="text-xl font-bold text-green-500 mt-1">
            {questions.filter((q: any) => q.status === "active").length}
          </p>
        </div>
        <div className="bg-white dark:bg-[#0f1419] rounded-xl border border-slate-100 dark:border-white/[0.06] p-4">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Rad etilgan</p>
          <p className="text-xl font-bold text-red-500 mt-1">
            {questions.filter((q: any) => q.status === "rejected").length}
          </p>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <MagnifierIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Savol, papka yoki foydalanuvchi qidirish..."
            className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-[#0f1419] border border-slate-200 dark:border-white/[0.08] rounded-xl text-[12px] text-slate-900 dark:text-white placeholder:text-slate-400"
          />
        </div>
        <div className="flex gap-2">
          {(["pending", "active", "rejected", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap ${
                filter === f
                  ? f === "pending" ? "bg-amber-500 text-white"
                    : f === "active" ? "bg-green-500 text-white"
                    : f === "rejected" ? "bg-red-500 text-white"
                    : "bg-slate-500 text-white"
                  : "bg-white dark:bg-[#0f1419] border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-400 hover:bg-slate-50"
              }`}
            >
              {f === "pending" ? "Kutilmoqda" : f === "active" ? "Faol" : f === "rejected" ? "Rad etilgan" : "Barchasi"}
            </button>
          ))}
        </div>
      </div>

      {/* Folder/Topic filter */}
      {foldersWithQuestions.length > 0 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <FolderOpenIcon className="w-4 h-4 text-slate-400" />
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Mavzu bo'yicha:</span>
          <button
            onClick={() => { setSelectedFolderId("all"); setSelectedIds(new Set()); }}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
              selectedFolderId === "all"
                ? "bg-violet-500 text-white"
                : "bg-white dark:bg-[#0f1419] border border-slate-200 dark:border-white/[0.08] text-slate-500 dark:text-slate-400 hover:bg-slate-50"
            }`}
          >
            Barchasi ({questions.length})
          </button>
          {foldersWithQuestions.map((folder) => (
            <button
              key={folder.id}
              onClick={() => { setSelectedFolderId(folder.id); setSelectedIds(new Set()); }}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                selectedFolderId === folder.id
                  ? "bg-violet-500 text-white"
                  : "bg-white dark:bg-[#0f1419] border border-slate-200 dark:border-white/[0.08] text-slate-500 dark:text-slate-400 hover:bg-slate-50"
              }`}
            >
              {folder.name} ({folder.count})
            </button>
          ))}
        </div>
      )}

      {/* Bulk actions */}
      {filter === "pending" && filteredQuestions.length > 0 && (
        <div className="bg-white dark:bg-[#0f1419] rounded-xl border border-slate-100 dark:border-white/[0.06] p-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              {selectedIds.size === filteredQuestions.filter((q: any) => q.status === "pending").length && filteredQuestions.filter((q: any) => q.status === "pending").length > 0 ? (
                            <CheckSquareIcon className="w-4 h-4 text-purple-500" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              Hammasini tanlash
            </button>
            {selectedIds.size > 0 && (
              <span className="text-[10px] text-slate-400">{selectedIds.size} ta tanlangan</span>
            )}
          </div>
          {selectedIds.size > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => bulkApproveMutation.mutate([...selectedIds])}
                disabled={bulkApproveMutation.isPending}
                className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-[11px] font-bold hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                {bulkApproveMutation.isPending ? <RefreshIcon className="w-3 h-3 animate-spin" /> : <CheckCircleIcon className="w-3 h-3" />}
                Tasdiqlash ({selectedIds.size})
              </button>
              <button
                onClick={() => bulkRejectMutation.mutate([...selectedIds])}
                disabled={bulkRejectMutation.isPending}
                className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-[11px] font-bold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                {bulkRejectMutation.isPending ? <RefreshIcon className="w-3 h-3 animate-spin" /> : <CloseCircleIcon className="w-3 h-3" />}
                Rad etish ({selectedIds.size})
              </button>
            </div>
          )}
        </div>
      )}

      {/* Questions list */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-12">
            <RefreshIcon className="w-8 h-8 text-violet-600 animate-spin mx-auto" />
            <p className="text-[12px] text-slate-400 mt-2">Yuklanmoqda...</p>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-[#0f1419] rounded-xl border border-slate-100 dark:border-white/[0.06]">
            <CheckCircleIcon className="w-12 h-12 text-green-300 mx-auto mb-3" />
            <p className="text-[13px] text-slate-500 dark:text-slate-400">
              {filter === "pending" ? "Tasdiqlash kutayotgan savol yo'q" : "Savollar topilmadi"}
            </p>
          </div>
        ) : (
          filteredQuestions.map((q: any) => {
            const isExpanded = expandedId === q.id;
            const isPending = q.status === "pending";

            return (
              <motion.div
                key={q.id}
                layout
                className={`bg-white dark:bg-[#0f1419] rounded-xl border overflow-hidden ${
                  isPending
                    ? "border-amber-200 dark:border-amber-500/20"
                    : q.status === "active"
                    ? "border-green-200 dark:border-green-500/20"
                    : "border-red-200 dark:border-red-500/20"
                }`}
              >
                {/* Header */}
                <div
                  className="p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : q.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {isPending && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelect(q.id);
                          }}
                          className="mt-0.5"
                        >
                          {selectedIds.has(q.id) ? (
                <CheckSquareIcon className="w-4 h-4 text-purple-500" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300" />
                          )}
                        </button>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                            isPending ? "bg-amber-100 text-amber-600" : q.status === "active" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                          }`}>
                            {isPending ? "KUTILMOQDA" : q.status === "active" ? "FAOL" : "RAD ETILGAN"}
                          </span>
                          <span className="text-[9px] text-slate-400">
                            {new Date(q.created_at).toLocaleString("uz-UZ")}
                          </span>
                        </div>
                        <p className="text-[13px] font-bold text-slate-900 dark:text-white line-clamp-2">
                          {q.question_text}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400 dark:text-slate-500">
                          <span className="flex items-center gap-1">
                            <FileTextIcon className="w-3 h-3" />
                            {q.folder?.name || "Noma'lum papka"}
                          </span>
                          {q.submitter && (
                            <span className="flex items-center gap-1">
                              <UserCheckIcon className="w-3 h-3" />
                              {q.submitter.full_name || q.submitter.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isPending && (
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => approveMutation.mutate(q.id)}
                            disabled={approveMutation.isPending}
                            className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-500/10 flex items-center justify-center text-green-600 hover:bg-green-100 dark:hover:bg-green-500/20 transition-colors disabled:opacity-50"
                            title="Tasdiqlash"
                          >
                            {approveMutation.isPending ? <RefreshIcon className="w-4 h-4 animate-spin" /> : <CheckCircleIcon className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt("Rad etilgan sababini kiriting:");
                              if (reason !== null && reason.trim()) {
                                rejectMutation.mutate({ id: q.id, reason });
                              }
                            }}
                            disabled={rejectMutation.isPending}
                            className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-600 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors disabled:opacity-50"
                            title="Rad etish"
                          >
                            {rejectMutation.isPending ? <RefreshIcon className="w-4 h-4 animate-spin" /> : <CloseCircleIcon className="w-4 h-4" />}
                          </button>
                        </div>
                      )}
                      {isExpanded ? (
                        <AltArrowUpIcon className="w-4 h-4 text-slate-400" />
                      ) : (
                        <AltArrowDownIcon className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-100 dark:border-white/[0.06]"
                    >
                      <div className="p-4 space-y-3">
                        {/* Options */}
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Javob variantlari:</p>
                          {(q.options || []).map((opt: any, idx: number) => (
                            <div
                              key={idx}
                              className={`flex items-center gap-2 p-2 rounded-lg ${
                                idx === q.correct_option
                                  ? "bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20"
                                  : "bg-slate-50 dark:bg-white/[0.02]"
                              }`}
                            >
                              <span className={`w-6 h-6 rounded text-[10px] font-bold flex items-center justify-center ${
                                idx === q.correct_option
                                  ? "bg-green-500 text-white"
                                  : "bg-slate-200 dark:bg-white/[0.06] text-slate-500"
                              }`}>
                                {opt.label}
                              </span>
                              <span className={`text-[12px] ${idx === q.correct_option ? "font-bold text-green-700 dark:text-green-400" : "text-slate-700 dark:text-slate-300"}`}>
                                {opt.option_text}
                              </span>
                              {idx === q.correct_option && (
                                <CheckCircleIcon className="w-3.5 h-3.5 text-green-500 ml-auto" />
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Level + Rejection reason */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400">Qiyinlik:</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/[0.06] text-slate-500">
                            {q.level || "bilish"}
                          </span>
                        </div>

                        {q.rejection_reason && (
                          <div className="p-2 bg-red-50 dark:bg-red-500/10 rounded-lg">
                            <p className="text-[10px] font-bold text-red-600 dark:text-red-400">Rad etilgan sabab:</p>
                            <p className="text-[11px] text-red-600 dark:text-red-400">{q.rejection_reason}</p>
                          </div>
                        )}

                        {/* Action buttons for expanded view */}
                        {isPending && (
                          <div className="flex gap-2 pt-2">
                            <button
                              onClick={() => approveMutation.mutate(q.id)}
                              disabled={approveMutation.isPending}
                              className="flex-1 py-2.5 bg-green-500 text-white rounded-xl text-[12px] font-bold hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                            >
                              {approveMutation.isPending ? <RefreshIcon className="w-3.5 h-3.5 animate-spin" /> : <CheckCircleIcon className="w-3.5 h-3.5" />}
                              Tasdiqlash
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt("Rad etilgan sababini kiriting:");
                                if (reason !== null && reason.trim()) {
                                  rejectMutation.mutate({ id: q.id, reason });
                                }
                              }}
                              disabled={rejectMutation.isPending}
                              className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-[12px] font-bold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                            >
                              {rejectMutation.isPending ? <RefreshIcon className="w-3.5 h-3.5 animate-spin" /> : <CloseCircleIcon className="w-3.5 h-3.5" />}
                              Rad etish
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminModeration;
