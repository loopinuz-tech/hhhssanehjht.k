import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Clock, Zap, Calculator, BookOpen, ArrowRight,
  Wallet, Coins, ShieldCheck, Sparkles, Info, CheckCircle2,
  Send, Users
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEduCoin } from "@/hooks/useEduCoin";
import { useSubject } from "@/hooks/useSubject";
import SEO from "@/components/SEO";
import { PaymentModal } from "@/components/PaymentModal";
import { buildMockTestSlug } from "@/lib/testRoutes";
import { CompassBigIcon } from "@solar-icons/react/bold-duotone/compass-big";
import { Book2Icon } from "@solar-icons/react/bold-duotone/book-2";
import { AtomIcon } from "@solar-icons/react/bold-duotone/atom";
import { DnaIcon } from "@solar-icons/react/bold-duotone/dna";
import { MagnifierIcon } from "@solar-icons/react/bold-duotone/magnifier";
import { ClockCircleIcon } from "@solar-icons/react/bold-duotone/clock-circle";

const RED = "#E8192C";

const SUBJECT_INFO: Record<string, { color: string; bg: string; icon: any }> = {
  "Matematika": { color: "#0891b2", bg: "#ecfeff", icon: CompassBigIcon },
  "Ona tili": { color: "#7c3aed", bg: "#f5f3ff", icon: Book2Icon },
  "Fizika": { color: "#d97706", bg: "#fffbeb", icon: AtomIcon },
  "Biologiya": { color: "#10b981", bg: "#ecfdf5", icon: DnaIcon },
  "Tarix": { color: "#e11d48", bg: "#fff1f2", icon: Book2Icon },
  "Ingliz tili": { color: "#2563eb", bg: "#eff6ff", icon: Book2Icon },
  "Kimyo": { color: "#8b5cf6", bg: "#f5f3ff", icon: AtomIcon },
};

const MockTests = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { activeSubject } = useSubject();
  const { spendCoin, setShowFeedbackModal } = useEduCoin();
  const { toast } = useToast();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "my" | "results">("all");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const { data: tests, isLoading } = useQuery({
    queryKey: ["mock-tests", activeTab],
    queryFn: async () => {
      let query = supabase.from("mock_tests" as any).select("*").eq("is_active", true);
      if (activeTab === "my") {
        const { data: subData } = await supabase
          .from("mock_test_submissions" as any)
          .select("test_id")
          .eq("user_id", user?.id);
        const testIds = (subData as any[])?.map(s => s.test_id) || [];
        if (testIds.length === 0) return [];
        query = query.in("id", testIds);
      }
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: userPurchasedTestIds = new Set<string>() } = useQuery({
    queryKey: ["user-purchased-mock-test-ids", user?.id, (profile as any)?.user_id, (profile as any)?.id],
    queryFn: async () => {
      const uIds = [...new Set([user?.id, (profile as any)?.user_id, (profile as any)?.id].filter(Boolean))];
      if (uIds.length === 0) return new Set<string>();
      const set = new Set<string>();

      const [subRes, purRes, txRes, eduRes] = await Promise.all([
        (supabase as any).from("mock_test_submissions").select("test_id").in("user_id", uIds),
        (supabase as any).from("test_purchases").select("folder_id, test_id").in("user_id", uIds),
        (supabase as any).from("wallet_transactions").select("reference_id").in("user_id", uIds),
        (supabase as any).from("educoin_transactions").select("reference_id").in("user_id", uIds),
      ]);

      subRes.data?.forEach((s: any) => { if (s.test_id) set.add(s.test_id); });
      purRes.data?.forEach((p: any) => { if (p.test_id) set.add(p.test_id); if (p.folder_id) set.add(p.folder_id); });
      txRes.data?.forEach((t: any) => { if (t.reference_id) set.add(t.reference_id); });
      eduRes.data?.forEach((e: any) => { if (e.reference_id) set.add(e.reference_id); });
      return set;
    },
    enabled: !!(user?.id || (profile as any)?.user_id || (profile as any)?.id),
    staleTime: 1000 * 60 * 5,
  });

  const { data: submissionCounts = {} } = useQuery({
    queryKey: ["mock-test-submission-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mock_test_submissions" as any)
        .select("test_id, user_id");
      if (error || !data) return {};
      const map: Record<string, Set<string>> = {};
      (data as any[]).forEach((row: any) => {
        if (!row.test_id) return;
        if (!map[row.test_id]) map[row.test_id] = new Set();
        map[row.test_id].add(row.user_id || Math.random().toString());
      });
      const counts: Record<string, number> = {};
      Object.keys(map).forEach((tId) => {
        counts[tId] = map[tId].size;
      });
      return counts;
    },
  });

  const filteredTests = useMemo(() => {
    if (!tests) return [];
    const list = tests.filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSubject = !activeSubject || t.subject === activeSubject;
      return matchesSearch && matchesSubject;
    });

    return list.sort((a, b) => {
      const freeA = a.is_free || (!a.price_educoin || a.price_educoin === 0);
      const freeB = b.is_free || (!b.price_educoin || b.price_educoin === 0);
      if (freeA && !freeB) return -1;
      if (!freeA && freeB) return 1;

      const matchA = a.title.match(/#(\d+)/);
      const matchB = b.title.match(/#(\d+)/);
      if (matchA && matchB) {
        return parseInt(matchA[1]) - parseInt(matchB[1]);
      }
      return 0;
    });
  }, [tests, searchTerm, activeSubject]);

  const handleStartTest = async (test: any) => {
    if (!user) return;
    const mockSlug = test.slug || buildMockTestSlug(test) || test.id;
    if (test.is_free) { navigate(`/mock-tests/${mockSlug}`); return; }
    const { data: existing } = await supabase
      .from("mock_test_submissions" as any)
      .select("id")
      .eq("user_id", user.id)
      .eq("test_id", test.id)
      .limit(1);
    if (existing && existing.length > 0) { navigate(`/mock-tests/${mockSlug}`); return; }
    const success = await spendCoin(test.price_educoin, "mock_test", `Mock test: ${test.title}`, test.id);
    if (success) {
      try {
        await (supabase.from("mock_test_submissions" as any) as any).insert({
          user_id: user.id,
          test_id: test.id,
          score: 0,
          answers: {},
        } as any);
        await (supabase.from("test_purchases" as any) as any).insert({
          user_id: user.id,
          test_id: test.id,
        } as any);
      } catch (subErr) {
        console.warn("Could not insert initial purchase submission record:", subErr);
      }
      await refreshProfile();
      qc.invalidateQueries({ queryKey: ["user-purchased-mock-test-ids"] });
      toast({ title: "Sotib olindi", description: "Test muvaffaqiyatli sotib olindi." });
      navigate(`/mock-tests/${mockSlug}`);
    } else {
      const currentBalance = Number((profile as any)?.educoin_balance) || 0;
      const testPrice = Number(test.price_educoin) || 0;
      if (currentBalance < testPrice) {
        setIsPaymentModalOpen(true);
        toast({ title: "Mablag' kam", description: `Test ${testPrice} EC turadi. Iltimos, hisobingizni to'ldiring.`, variant: "destructive" });
      } else {
        toast({ title: "Xatolik", description: "Tranzaksiyani amalga oshirib bo'lmadi.", variant: "destructive" });
      }
    }
  };

  const tabs = [
    { key: "all", label: "Barchasi" },
    { key: "my", label: "Mening testlarim" },
  ] as const;

  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0A0A]">
      <SEO title="Milliy Sertifikat Mock Testlari — Matematika va barcha fanlardan online testlar" description="EduContest-da Matematika va barcha fanlar bo‘yicha Milliy sertifikat darajasidagi mock testlar to‘plami hamda imtihon simulyatsiyasi." />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* ── HEADER ── */}
      <div className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Mock testlar</h1>
            <p className="text-[12px] text-slate-400 mt-0.5">Milliy sertifikat · Imtihon simulyatsiyasi</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Wallet Info */}
            <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <div className="flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  {(profile?.balance || 0).toLocaleString()} UZS
                </span>
              </div>
              <div className="w-px h-3.5 bg-slate-200 dark:bg-slate-700" />
              <div className="flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  {(profile as any)?.educoin_balance || 0} EC
                </span>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(true)}
                className="px-3 py-1 rounded-md text-[11px] font-medium text-white transition-opacity hover:opacity-90"
                style={{ background: RED }}
              >
                To'ldirish
              </button>
            </div>

            {/* Telegram - faqat Barchasi tabida */}
            {activeTab === "all" && (
              <a
                href="https://t.me/khudayberganov_buisness"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[12px] font-medium hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                Telegram
              </a>
            )}

            <button
              onClick={() => setShowFeedbackModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-[12px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Info className="w-3.5 h-3.5" />
              Shikoyat
            </button>
          </div>
        </div>

        {/* Tabs + Search row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-0.5 h-10">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative h-full px-4 text-[13px] font-medium transition-colors ${activeTab === tab.key
                    ? "text-slate-900 dark:text-white"
                    : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
                    style={{ background: RED }}
                  />
                )}
              </button>
            ))}
            <button
              onClick={() => navigate("/results/mock")}
              className="relative h-full px-4 text-[13px] font-medium text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              Natijalarim
            </button>
          </div>

          {/* Search */}
          <div className="relative sm:ml-auto w-full sm:w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
            <input
              type="text"
              placeholder="Qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-9 pr-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-200 dark:focus:border-red-900 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 overflow-y-auto space-y-8">

        {/* Test Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-52 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : filteredTests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search className="w-8 h-8 text-slate-300 mb-3" />
            <p className="text-[13px] text-slate-400">Test topilmadi</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredTests.map((test, idx) => {
                const sub = SUBJECT_INFO[test.subject] || SUBJECT_INFO["Matematika"];
                const Icon = sub.icon;
                const isPurchased = userPurchasedTestIds.has(test.id) || (profile as any)?.is_lifetime;
                const isPaid = !test.is_free && test.price_educoin > 0 && !isPurchased;

                return (
                  <motion.div
                    key={test.id}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.2 }}
                    className={`group flex flex-col border rounded-2xl p-5 transition-all ${
                      isPurchased
                        ? "bg-gradient-to-br from-green-50/90 via-green-50/40 to-green-100/70 dark:from-green-950/40 dark:via-green-950/30 dark:to-green-900/40 border-green-300/80 dark:border-green-700/60 hover:border-green-400 dark:hover:border-green-500 shadow-xs hover:shadow-green-200/50"
                        : isPaid
                        ? "bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-amber-100/70 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-amber-900/40 border-amber-300/80 dark:border-amber-700/60 hover:border-amber-400 dark:hover:border-amber-500 shadow-xs hover:shadow-amber-200/50"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: isPurchased ? "#d1fae5" : isPaid ? "#fef3c7" : (sub?.bg || "#f1f5f9") }}
                      >
                        <Icon className="w-4 h-4" style={{ color: isPurchased ? "#059669" : isPaid ? "#d97706" : (sub?.color || "#475569") }} />
                      </div>
                      <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[10px] sm:text-[11px] font-bold ${
                          isPurchased
                            ? "bg-green-600 text-white shadow-xs"
                            : test.is_free
                            ? "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400 font-bold"
                            : (Number((profile as any)?.educoin_balance || 0) >= Number(test.price_educoin || 0))
                            ? "bg-amber-500 text-white shadow-xs"
                            : "bg-amber-600/90 text-white shadow-xs"
                        }`}>
                        {isPurchased
                          ? "Sotib olingan"
                          : test.is_free
                          ? "Bepul"
                          : `${test.price_educoin || 0} EC (${Number((profile as any)?.educoin_balance || 0) >= Number(test.price_educoin || 0) ? "Yetarli" : "Balans kam"})`}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-[14px] font-bold text-slate-900 dark:text-white line-clamp-2 mb-1 leading-snug">
                      {test.title}
                    </h3>
                    {test.description && (
                      <p className="text-[11px] text-slate-400 line-clamp-2 mb-2">{test.description}</p>
                    )}
                    <p className="text-[11px] text-slate-400 mb-3">{test.questions_count} savol</p>

                    {/* EduCoin Balance Hint for paid test */}
                    {isPaid && !isPurchased && (
                      <div className="text-[10.5px] font-medium mb-3 flex items-center justify-between px-2.5 py-1.5 bg-amber-500/10 dark:bg-amber-500/20 rounded-lg text-amber-800 dark:text-amber-200 border border-amber-200/60 dark:border-amber-700/60">
                        <span className="flex items-center gap-1.5">
                          <Coins className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>Balansingiz: <strong>{Number((profile as any)?.educoin_balance || 0)} EC</strong></span>
                        </span>
                        <span className={`font-bold ${
                          Number((profile as any)?.educoin_balance || 0) >= Number(test.price_educoin || 0)
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}>
                          {Number((profile as any)?.educoin_balance || 0) >= Number(test.price_educoin || 0)
                            ? "Olish mumkin ✓"
                            : `${Number(test.price_educoin || 0) - Number((profile as any)?.educoin_balance || 0)} EC yetmaydi`}
                        </span>
                      </div>
                    )}

                    {/* Meta */}
                    <div className="flex items-center justify-between mt-auto mb-4">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {test.duration_minutes} min
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        <Users className="w-3 h-3 text-emerald-500" />
                        <span>{submissionCounts[test.id] || 0} ishlagan</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button 
                        onClick={() => navigate(`/mock-tests/${test.slug || buildMockTestSlug(test) || test.id}/info`)}
                        className="flex-1 h-9 rounded-lg border border-slate-200 dark:border-slate-700 text-[12px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        Batafsil
                      </button>
                      <button
                        onClick={() => handleStartTest(test)}
                        className={`flex-1 h-9 rounded-lg text-[11.5px] font-extrabold text-white flex items-center justify-center gap-1 transition-all hover:opacity-90 active:scale-[0.98] ${
                          isPurchased
                            ? "bg-emerald-600"
                            : test.is_free
                            ? "bg-[#E8192C]"
                            : Number((profile as any)?.educoin_balance || 0) >= Number(test.price_educoin || 0)
                            ? "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-xs"
                            : "bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-xs"
                        }`}
                      >
                        {isPurchased ? (
                          <>Boshlash <ArrowRight className="w-3 h-3" /></>
                        ) : test.is_free ? (
                          <>Boshlash <ArrowRight className="w-3 h-3" /></>
                        ) : Number((profile as any)?.educoin_balance || 0) >= Number(test.price_educoin || 0) ? (
                          <>
                            <Coins className="w-3.5 h-3.5" />
                            <span>{test.price_educoin || 0} EC · Olish</span>
                          </>
                        ) : (
                          <>
                            <Coins className="w-3.5 h-3.5" />
                            <span>{test.price_educoin || 0} EC · To'ldirish</span>
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Info strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-100 dark:border-slate-800">
          {[
            { icon: ShieldCheck, color: "#0891b2", bg: "#ecfeff", title: "Milliy sertifikat", desc: "Testlar so'nggi standartlar asosida mutaxassislar tomonidan tayyorlangan." },
            { icon: Wallet, color: "#7c3aed", bg: "#f5f3ff", title: "To'lov turlari", desc: "EduCoin yoki hamyon orqali xavfsiz to'lov tizimi." },
            { icon: Sparkles, color: "#d97706", bg: "#fffbeb", title: "AI tekshiruvi", desc: "Yozma javoblar sun'iy intellekt tomonidan tahlil qilinadi." },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: item.bg }}>
                <item.icon className="w-4 h-4" style={{ color: item.color }} />
              </div>
              <div>
                <p className="text-[13px] font-medium text-slate-800 dark:text-white mb-0.5">{item.title}</p>
                <p className="text-[12px] text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
      </div>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        amount={0}
        profile={profile}
      />
    </div>
  );
};

export default MockTests;