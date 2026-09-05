import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { MedalStarCircleIcon } from "@solar-icons/react/bold-duotone/medal-star-circle";
import { AddCircleIcon as PlusCircleIcon } from "@solar-icons/react/bold-duotone/add-circle";
import { MagnifierIcon } from "@solar-icons/react/bold-duotone/magnifier";
import { Pen2Icon } from "@solar-icons/react/bold-duotone/pen-2";
import { TrashBinMinimalisticIcon } from "@solar-icons/react/bold-duotone/trash-bin-minimalistic";
import { EyeIcon } from "@solar-icons/react/bold-duotone/eye";
import { RefreshIcon } from "@solar-icons/react/bold-duotone/refresh";
import { DangerCircleIcon } from "@solar-icons/react/bold-duotone/danger-circle";
import { AltArrowLeftIcon } from "@solar-icons/react/bold-duotone/alt-arrow-left";
import { AltArrowRightIcon } from "@solar-icons/react/bold-duotone/alt-arrow-right";
import { UsersGroupTwoRoundedIcon } from "@solar-icons/react/bold-duotone/users-group-two-rounded";
import { WalletIcon } from "@solar-icons/react/bold-duotone/wallet";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import MockTestUsersModal from "@/components/admin/MockTestUsersModal";

type MockTest = {
  id: string;
  title: string;
  description: string;
  subject: string;
  type: string;
  price_cash: number;
  price_educoin: number;
  is_free: boolean;
  duration_minutes: number;
  questions_count: number;
  is_active: boolean;
  created_at: string;
};

const TYPE_LABELS: Record<string, string> = {
  milliy_sertifikat: "Milliy sertifikat",
  full_test: "To'liq test",
  predicted_test: "Bashorat test",
};

const TYPE_BADGE: Record<string, string> = {
  milliy_sertifikat: "bg-blue-50 text-blue-600",
  full_test: "bg-violet-50 text-violet-600",
  predicted_test: "bg-amber-50 text-amber-600",
};

const AdminMockTests = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: tests = [], isLoading } = useQuery({
    queryKey: ["admin-mock-tests"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("mock_tests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as MockTest[];
    },
  });

  const { data: submissionsCount = 0 } = useQuery({
    queryKey: ["admin-mock-submissions-count"],
    queryFn: async () => {
      const { count, error } = await (supabase as any)
        .from("mock_test_submissions")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: allSubmissions = [] } = useQuery({
    queryKey: ["admin-all-mock-submissions"],
    queryFn: async () => {
      const { data } = await supabase.from("mock_test_submissions" as any).select("test_id").limit(2000);
      return data || [];
    }
  });

  const { data: allPurchases = [] } = useQuery({
    queryKey: ["admin-all-mock-purchases"],
    queryFn: async () => {
      const { data: walletData } = await supabase.from("wallet_transactions" as any).select("reference_id").limit(2000);
      const { data: eduData } = await supabase.from("educoin_transactions" as any).select("reference_id").limit(2000);
      return [...(walletData || []), ...(eduData || [])];
    }
  });

  const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false);
  const [selectedTestForAnalytics, setSelectedTestForAnalytics] = useState<{id: string, name: string} | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // 1. Fetch questions to get image/audio urls for storage cleanup
      const { data: questions } = await (supabase as any)
        .from("mock_test_questions")
        .select("image_url, audio_url")
        .eq("test_id", id);
      
      if (questions && questions.length > 0) {
        const filesToRemove: string[] = [];
        questions.forEach((q: any) => {
          if (q.image_url) {
            const parts = q.image_url.split('/');
            filesToRemove.push(parts[parts.length - 1]);
          }
          if (q.audio_url) {
            const parts = q.audio_url.split('/');
            filesToRemove.push(parts[parts.length - 1]);
          }
        });
        if (filesToRemove.length > 0) {
          // Assume bucket is "mock_questions" for mock tests (or fallback to questions)
          await supabase.storage.from("mock_questions").remove(filesToRemove);
          await supabase.storage.from("questions").remove(filesToRemove); // Safe fallback
        }
      }

      await (supabase as any)
        .from("mock_test_questions")
        .delete()
        .eq("test_id", id);
      const { error } = await (supabase as any)
        .from("mock_tests")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-mock-tests"] });
      queryClient.invalidateQueries({ queryKey: ["admin-mock-submissions-count"] });
      setShowDeleteModal(false);
      setDeleteId(null);
      toast({ title: "O'chirildi" });
    },
    onError: (e: any) => {
      toast({ title: "Xatolik", description: e.message, variant: "destructive" });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await (supabase as any)
        .from("mock_tests")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-mock-tests"] });
      toast({ title: "Holat yangilandi" });
    },
  });

  const filtered = useMemo(() => {
    return tests.filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.subject.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && t.is_active) ||
        (statusFilter === "inactive" && !t.is_active);
      const matchesType = typeFilter === "all" || t.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [tests, search, statusFilter, typeFilter]);

  const totalPages = Math.ceil(filtered.length / 20);
  const paginated = filtered.slice((page - 1) * 20, page * 20);

  const stats = useMemo(() => {
    const total = tests.length;
    const questions = tests.reduce((acc, t) => acc + (t.questions_count || 0), 0);
    return { total, questions, submissions: submissionsCount };
  }, [tests, submissionsCount]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("uz-UZ").format(price) + " so'm";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshIcon className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
            <MedalStarCircleIcon className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                Mock Testlar
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                {tests.length}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Milliy sertifikat va bashorat testlarni boshqarish
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate("/admin/mock-tests/create")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[12px] font-semibold hover:opacity-90 transition-opacity"
        >
          <PlusCircleIcon className="w-4 h-4" />
          Yangi mock test
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 p-1 bg-slate-100 dark:bg-white/5 rounded-lg w-fit">
        {[
          { key: "all", label: "Barchasi" },
          { key: "active", label: "Faol" },
          { key: "inactive", label: "Nofaol" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setStatusFilter(tab.key);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-all ${
              statusFilter === tab.key
                ? "bg-white dark:bg-[#080C14] shadow-sm text-slate-900 dark:text-white"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 p-1 bg-slate-100 dark:bg-white/5 rounded-lg w-fit">
        {[
          { key: "all", label: "Barchasi" },
          { key: "milliy_sertifikat", label: "Milliy sertifikat" },
          { key: "full_test", label: "To'liq test" },
          { key: "predicted_test", label: "Bashorat test" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setTypeFilter(tab.key);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-all ${
              typeFilter === tab.key
                ? "bg-white dark:bg-[#080C14] shadow-sm text-slate-900 dark:text-white"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <MagnifierIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Test nomi yoki fan bo'yicha qidirish..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full h-10 pl-10 pr-4 rounded-lg bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] text-[12px] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl p-4">
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
            Jami testlar
          </p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">
            {stats.total}
          </p>
        </div>
        <div className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl p-4">
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
            Savollar soni
          </p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">
            {stats.questions}
          </p>
        </div>
        <div className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl p-4">
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
            Jami topshirishlar
          </p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">
            {stats.submissions}
          </p>
        </div>
      </div>

      {paginated.length === 0 ? (
        <div className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl py-16 flex flex-col items-center justify-center">
          <MedalStarCircleIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
            Mock testlar topilmadi
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/[0.06]">
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Nomi
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Fan
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Turi
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Savollar
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Davomiylik
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Narx
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Statistika
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Holat
                  </th>
                  <th className="text-right px-4 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Amallar
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((test) => (
                  <tr
                    key={test.id}
                    className="border-b border-slate-50 dark:border-white/[0.03] hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-[12px] font-semibold text-slate-900 dark:text-white">
                          {test.title}
                        </span>
                        {test.is_free && (
                          <span className="text-[10px] text-emerald-600 font-medium mt-0.5">
                            Bepul
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[12px] text-slate-600 dark:text-slate-400">
                        {test.subject}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-medium ${
                          TYPE_BADGE[test.type] || "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {TYPE_LABELS[test.type] || test.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[12px] text-slate-600 dark:text-slate-400">
                        {test.questions_count}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[12px] text-slate-600 dark:text-slate-400">
                        {test.duration_minutes} daqiqa
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        {!test.is_free ? (
                          <>
                            <span className="text-[12px] text-slate-600 dark:text-slate-400">
                              {formatPrice(test.price_cash)}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {test.price_educoin} educoin
                            </span>
                          </>
                        ) : (
                          <span className="text-[12px] text-emerald-600">Bepul</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1.5 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => {
                        setSelectedTestForAnalytics({ id: test.id, name: test.title });
                        setAnalyticsModalOpen(true);
                      }}>
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md w-max">
                          <UsersGroupTwoRoundedIcon className="w-3.5 h-3.5" /> {allSubmissions.filter((s: any) => s.test_id === test.id).length} ishlagan
                        </span>
                        {!test.is_free && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md w-max">
                            <WalletIcon className="w-3.5 h-3.5" /> {allPurchases.filter((p: any) => p.reference_id === test.id).length} sotib olgan
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() =>
                          toggleActiveMutation.mutate({
                            id: test.id,
                            is_active: !test.is_active,
                          })
                        }
                        className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-medium cursor-pointer transition-colors ${
                          test.is_active
                            ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        {test.is_active ? "Faol" : "Nofaol"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() =>
                            navigate(`/admin/mock-tests/edit/${test.id}`)
                          }
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                          title="Tahrirlash"
                        >
                          <Pen2Icon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            navigate(`/admin/mock-tests/edit/${test.id}?tab=questions`)
                          }
                          className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors"
                          title="Savollar"
                        >
                          <EyeIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteId(test.id);
                            setShowDeleteModal(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                          title="O'chirish"
                        >
                          <TrashBinMinimalisticIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-white/[0.06]">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {filtered.length} tadan {(page - 1) * 20 + 1}-
                {Math.min(page * 20, filtered.length)}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <AltArrowLeftIcon className="w-4 h-4" />
                </button>
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 px-2">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <AltArrowRightIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                <DangerCircleIcon className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h2 className="text-[14px] font-bold text-slate-900 dark:text-white">
                  O'chirishni tasdiqlaysizmi?
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Bu amal qaytarib bo'lmaydi.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteId(null);
                }}
                className="px-4 py-2 rounded-lg text-[12px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                Bekor qilish
              </button>
              <button
                onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-[12px] font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleteMutation.isPending && (
                  <RefreshIcon className="w-3.5 h-3.5 animate-spin" />
                )}
                O'chirish
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedTestForAnalytics && (
        <MockTestUsersModal
          isOpen={analyticsModalOpen}
          onClose={() => setAnalyticsModalOpen(false)}
          testId={selectedTestForAnalytics.id}
          testName={selectedTestForAnalytics.name}
        />
      )}
    </div>
  );
};

export default AdminMockTests;
