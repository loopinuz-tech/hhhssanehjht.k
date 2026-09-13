import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CloseSquareIcon } from "@solar-icons/react/bold-duotone/close-square";
import { UsersGroupTwoRoundedIcon } from "@solar-icons/react/bold-duotone/users-group-two-rounded";
import { WalletIcon } from "@solar-icons/react/bold-duotone/wallet";

type MockTestUsersModalProps = {
  isOpen: boolean;
  onClose: () => void;
  testId: string;
  testName: string;
};

const MockTestUsersModal = ({ isOpen, onClose, testId, testName }: MockTestUsersModalProps) => {
  const [activeTab, setActiveTab] = useState<"submissions" | "purchases">("submissions");

  const { data: submissions = [], isLoading: isLoadingSubmissions } = useQuery({
    queryKey: ["admin-mock-test-submissions", testId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mock_test_submissions" as any)
        .select("*")
        .eq("test_id", testId);
      if (error) throw error;
      return data || [];
    },
    enabled: isOpen && activeTab === "submissions",
  });

  const { data: purchases = [], isLoading: isLoadingPurchases } = useQuery({
    queryKey: ["admin-mock-test-purchases", testId],
    queryFn: async () => {
      const { data: walletData, error: walletError } = await supabase
        .from("wallet_transactions" as any)
        .select("*")
        .eq("reference_id", testId);
      
      const { data: eduData, error: eduError } = await supabase
        .from("educoin_transactions" as any)
        .select("*")
        .eq("reference_id", testId);

      const combined = [
        ...(walletData || []).map((t: any) => ({ ...t, _currency: "UZS" })),
        ...(eduData || []).map((t: any) => ({ ...t, _currency: "EC" }))
      ];
      
      return combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
    enabled: isOpen && activeTab === "purchases",
  });

  // Collect all unique user IDs from current tab to fetch profiles
  const { data: profilesMap = {}, isLoading: isLoadingProfiles } = useQuery({
    queryKey: ["admin-mock-test-profiles", testId, activeTab, submissions, purchases],
    queryFn: async () => {
      const userIds = new Set<string>();
      if (activeTab === "submissions") {
        submissions.forEach((s: any) => userIds.add(s.user_id));
      } else {
        purchases.forEach((p: any) => userIds.add(p.user_id));
      }

      if (userIds.size === 0) return {};

      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, phone")
        .in("user_id", Array.from(userIds));

      if (error) throw error;

      const map: Record<string, any> = {};
      data?.forEach((p: any) => {
        map[p.user_id] = p;
      });
      return map;
    },
    enabled: isOpen && (submissions.length > 0 || purchases.length > 0),
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-white/[0.06]">
          <div>
            <h2 className="text-[16px] sm:text-[18px] font-bold text-slate-900 dark:text-white line-clamp-1">
              {testName}
            </h2>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
              Foydalanuvchilar statistikasi
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0"
          >
            <CloseSquareIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 p-4 border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02]">
          <button
            onClick={() => setActiveTab("submissions")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all ${
              activeTab === "submissions"
                ? "bg-blue-500 text-white shadow-md"
                : "bg-white dark:bg-[#0A0A0A] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/[0.06] hover:border-blue-300 dark:hover:border-blue-500/30"
            }`}
          >
            <UsersGroupTwoRoundedIcon className="w-4 h-4" />
            Ishlaganlar ({submissions.length})
          </button>
          <button
            onClick={() => setActiveTab("purchases")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all ${
              activeTab === "purchases"
                ? "bg-emerald-500 text-white shadow-md"
                : "bg-white dark:bg-[#0A0A0A] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/[0.06] hover:border-emerald-300 dark:hover:border-emerald-500/30"
            }`}
          >
            <WalletIcon className="w-4 h-4" />
            Sotib olganlar ({purchases.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {activeTab === "submissions" ? (
            <div className="space-y-3">
              {isLoadingSubmissions || isLoadingProfiles ? (
                <div className="py-8 text-center text-slate-500 text-[13px]">Yuklanmoqda...</div>
              ) : submissions.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-[13px]">Hali hech kim ushbu testni ishlamagan</div>
              ) : (
                submissions.map((sub: any) => {
                  const profile = profilesMap[sub.user_id];
                  return (
                    <div key={sub.id} className="p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#0A0A0A] flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-[14px] font-bold text-slate-900 dark:text-white">
                          {profile?.full_name || "Noma'lum foydalanuvchi"}
                        </p>
                        <p className="text-[12px] text-slate-500 font-medium">
                          {profile?.phone_number || profile?.phone || "Raqam yo'q"}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <p className="text-[11px] text-slate-500 font-medium">Natija</p>
                          <p className="text-[14px] font-bold text-blue-600 dark:text-blue-400">
                            {sub.correct_answers || 0} / {sub.total_questions || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-slate-500 font-medium">Sana</p>
                          <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-300">
                            {new Date(sub.created_at).toLocaleDateString("uz-UZ")}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {isLoadingPurchases || isLoadingProfiles ? (
                <div className="py-8 text-center text-slate-500 text-[13px]">Yuklanmoqda...</div>
              ) : purchases.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-[13px]">Hali hech kim ushbu testni sotib olmagan</div>
              ) : (
                purchases.map((pur: any) => {
                  const profile = profilesMap[pur.user_id];
                  return (
                    <div key={pur.id} className="p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#0A0A0A] flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-[14px] font-bold text-slate-900 dark:text-white">
                          {profile?.full_name || "Noma'lum foydalanuvchi"}
                        </p>
                        <p className="text-[12px] text-slate-500 font-medium">
                          {profile?.phone_number || profile?.phone || "Raqam yo'q"}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <p className="text-[11px] text-slate-500 font-medium">To'lov</p>
                          <p className="text-[14px] font-bold text-emerald-600 dark:text-emerald-400">
                            {pur.amount} {pur._currency}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-slate-500 font-medium">Sana</p>
                          <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-300">
                            {new Date(pur.created_at).toLocaleDateString("uz-UZ")}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MockTestUsersModal;
