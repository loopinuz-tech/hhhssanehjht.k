import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEduCoin } from "@/hooks/useEduCoin";
import { useToast } from "@/hooks/use-toast";
import {
  Coins, Calculator, BookOpen, Zap, ShieldCheck
} from "lucide-react";
import { AltArrowLeftIcon } from "@solar-icons/react/bold-duotone/alt-arrow-left";
import { AltArrowRightIcon } from "@solar-icons/react/bold-duotone/alt-arrow-right";
import { DocumentTextIcon } from "@solar-icons/react/bold-duotone/document-text";
import { ClockCircleIcon } from "@solar-icons/react/bold-duotone/clock-circle";
import { UserIcon } from "@solar-icons/react/bold-duotone/user";
import { StarIcon } from "@solar-icons/react/bold-duotone/star";
import { CheckCircleIcon } from "@solar-icons/react/bold-duotone/check-circle";
import { DangerCircleIcon } from "@solar-icons/react/bold-duotone/danger-circle";
import { CalculatorMinimalisticIcon } from "@solar-icons/react/bold-duotone/calculator-minimalistic";
import { BookBookmarkIcon } from "@solar-icons/react/bold-duotone/book-bookmark";
import { AtomIcon } from "@solar-icons/react/bold-duotone/atom";
import { DnaIcon } from "@solar-icons/react/bold-duotone/dna";
import SEO from "@/components/SEO";
import { PaymentModal } from "@/components/PaymentModal";
import { buildMockTestSlug, slugify } from "@/lib/testRoutes";
import { RaschModelAnalysis } from "@/components/admin/RaschModelAnalysis";
import { api } from "@/lib/api";

const RED = "#E8192C";

const SUBJECT_INFO: Record<string, { color: string; bg: string; icon: any }> = {
  "Matematika": { color: "#0891b2", bg: "#ecfeff", icon: CalculatorMinimalisticIcon },
  "Ona tili": { color: "#7c3aed", bg: "#f5f3ff", icon: BookBookmarkIcon },
  "Fizika": { color: "#d97706", bg: "#fffbeb", icon: AtomIcon },
  "Biologiya": { color: "#10b981", bg: "#ecfdf5", icon: DnaIcon },
  "Tarix": { color: "#e11d48", bg: "#fff1f2", icon: BookBookmarkIcon },
  "Ingliz tili": { color: "#2563eb", bg: "#eff6ff", icon: BookBookmarkIcon },
  "Kimyo": { color: "#8b5cf6", bg: "#f5f3ff", icon: AtomIcon },
};

const MockTestInfo = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const { spendCoin } = useEduCoin();
  const { toast } = useToast();
  const [agreed, setAgreed] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'results'>('info');

  const { data: test, isLoading } = useQuery({
    queryKey: ["mock-test-info", id],
    queryFn: async () => {
      if (!id) return null;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      if (isUuid) {
        const { data } = await supabase.from("mock_tests" as any).select("*").eq("id", id).maybeSingle();
        if (data) return data as any;
      }
      const { data: bySlug } = await supabase.from("mock_tests" as any).select("*").eq("slug", id).maybeSingle();
      if (bySlug) return bySlug as any;

      // Targeted title lookup
      const normalizedTitle = id.replace(/-/g, ' ');
      const { data: byTitle } = await supabase.from("mock_tests" as any).select("*").ilike("title", normalizedTitle).maybeSingle();
      if (byTitle) return byTitle as any;

      const { data: byIdFallback } = await supabase.from("mock_tests" as any).select("*").eq("id", id).maybeSingle();
      if (byIdFallback) return byIdFallback as any;

      // Bounded fallback
      const { data: allMockTests } = await supabase.from("mock_tests" as any).select("*").limit(100);
      if (allMockTests && allMockTests.length > 0) {
        const matched = (allMockTests as any[]).find((t) => {
          const generated = buildMockTestSlug(t);
          const simpleTitleSlug = t.title ? slugify(t.title) : "";
          return generated === id || simpleTitleSlug === id || t.slug === id;
        });
        if (matched) {
          if (!matched.slug) {
            (supabase.from("mock_tests" as any) as any).update({ slug: id }).eq("id", matched.id).then();
          }
          return matched as any;
        }
      }

      return null;
    },
    enabled: !!id,
  });

  const { data: participantsCount = 0 } = useQuery({
    queryKey: ["mock-test-participants-count", test?.id],
    queryFn: async () => {
      if (!test?.id) return 0;
      const { data, error } = await supabase
        .from("mock_test_submissions" as any)
        .select("user_id")
        .eq("test_id", test.id);
      if (error || !data) return 0;
      const uniqueUsers = new Set((data as any[]).map(d => d.user_id || Math.random().toString()));
      return uniqueUsers.size;
    },
    enabled: !!test?.id,
  });

  const { data: testResultsData } = useQuery({
    queryKey: ["mock-test-public-results", test?.id],
    queryFn: async () => {
      const targetId = test?.id;
      if (!targetId) return { submissions: [], questions: [] };

      try {
        const res = await api.get(`/mock-tests/${targetId}/public-results`);
        if (res && Array.isArray(res.submissions)) return res;
      } catch (e) {
        console.warn("[MockTestInfo] Public results API fallback:", e);
      }

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);
      if (!isUuid) return { submissions: [], questions: [] };

      // Fallback client query with valid UUID
      const { data: questions } = await supabase
        .from("mock_test_questions" as any)
        .select("id, question_number, correct_answer, type, metadata")
        .eq("test_id", targetId)
        .order("question_number", { ascending: true });

      const { data: submissions } = await supabase
        .from("mock_test_submissions" as any)
        .select("id, user_id, score, answers, raw_results, created_at")
        .eq("test_id", targetId)
        .order("created_at", { ascending: false });

      if (!submissions || submissions.length === 0) {
        return { submissions: [], questions: questions || [] };
      }

      const userIds = [...new Set(submissions.map((s: any) => s.user_id))].filter(Boolean);
      let profilesMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, email, avatar_url")
          .in("user_id", userIds);
        if (profiles) {
          profiles.forEach((p: any) => {
            profilesMap[p.user_id] = p;
          });
        }
      }

      const enrichedSubmissions = submissions.map((sub: any) => {
        const p = profilesMap[sub.user_id] || {};
        const rawRes = sub.raw_results || {};
        return {
          ...sub,
          total_questions: rawRes.total_questions || (sub.answers ? Object.keys(sub.answers).length : 0),
          correct_answers: rawRes.correct_answers || 0,
          user_name: p.full_name || (p.email ? p.email.split("@")[0] : "Foydalanuvchi"),
          user_email: p.email || "",
          avatar_url: p.avatar_url || "",
        };
      });

      return {
        submissions: enrichedSubmissions,
        questions: questions || []
      };
    },
    enabled: !!test?.id,
  });

  const { data: isAlreadyPurchased = false } = useQuery({
    queryKey: ["is-mock-test-purchased", test?.id, user?.id, (profile as any)?.user_id, (profile as any)?.id],
    queryFn: async () => {
      const uIds = [...new Set([user?.id, (profile as any)?.user_id, (profile as any)?.id].filter(Boolean))];
      if (!test?.id || uIds.length === 0) return false;

      const { data: subData } = await (supabase as any)
        .from("mock_test_submissions")
        .select("id")
        .in("user_id", uIds)
        .eq("test_id", test.id)
        .limit(1);
      if (subData && subData.length > 0) return true;

      const { data: purData } = await (supabase as any)
        .from("test_purchases")
        .select("id")
        .in("user_id", uIds)
        .eq("test_id", test.id)
        .limit(1);
      if (purData && purData.length > 0) return true;

      const { data: eduData } = await (supabase as any)
        .from("educoin_transactions")
        .select("id")
        .in("user_id", uIds)
        .eq("reference_id", test.id)
        .limit(1);
      if (eduData && eduData.length > 0) return true;

      return false;
    },
    enabled: !!(test?.id && (user?.id || (profile as any)?.user_id || (profile as any)?.id)),
  });

  const getTestSlug = (t: any) => t?.slug || buildMockTestSlug(t) || t?.id;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0A0A0A] flex flex-col items-center justify-center gap-4">
        <p className="text-slate-500 font-extrabold">Test topilmadi</p>
        <button
          onClick={() => navigate("/tests")}
          className="px-5 py-2.5 text-sm font-extrabold text-white rounded-xl shadow-md"
          style={{ background: RED }}
        >
          Orqaga qaytish
        </button>
      </div>
    );
  }

  const sub = SUBJECT_INFO[test.subject] || SUBJECT_INFO["Matematika"];
  const Icon = sub.icon;

  const handleStart = async () => {
    if (!user) {
      toast({ title: "Kirish lozim", description: "Test boshlash uchun tizimga kiring." });
      return;
    }

    const testSlug = getTestSlug(test);
    if (test.id) {
      localStorage.removeItem(`mock_expiry_${test.id}`);
      localStorage.removeItem(`mock_answers_${test.id}`);
    }

    const isPremium = (profile as any)?.subscription_tier && (profile as any)?.subscription_tier !== "standart";
    if (test.is_free || isAlreadyPurchased || (profile as any)?.is_lifetime || isPremium) {
      navigate(`/mock-tests/${testSlug}`);
      return;
    }

    const { data: existing } = await supabase
      .from("mock_test_submissions" as any)
      .select("id")
      .eq("user_id", user.id)
      .eq("test_id", test.id)
      .limit(1);

    if (existing && existing.length > 0) {
      navigate(`/mock-tests/${testSlug}`);
      return;
    }

    setIsPurchasing(true);
    try {
      const price = Number(test.price_educoin) || 0;
      const currentBalance = Number((profile as any)?.educoin_balance) || 0;
      
      if (currentBalance < price) {
        setIsPaymentModalOpen(true);
        toast({
          title: "Mablag' kam",
          description: `Sizda ${currentBalance} EC bor, test esa ${price} EC turadi. Iltimos, hisobni to'ldiring.`,
          variant: "destructive"
        });
        setIsPurchasing(false);
        return;
      }

      const success = await spendCoin(price, "mock_test", `Mock test: ${test.title}`, test.id);
      if (success) {
        try {
          await (supabase.from("mock_test_submissions" as any) as any).insert({
            user_id: user.id,
            test_id: test.id,
            score: 0,
            answers: {},
          });
        } catch (subErr) {
          console.warn("Could not insert initial purchase submission record:", subErr);
        }
        await refreshProfile();
        toast({ title: "Sotib olindi", description: "Test muvaffaqiyatli sotib olindi." });
        navigate(`/mock-tests/${testSlug}`);
      } else {
        toast({
          title: "Xatolik",
          description: "Tranzaksiyani amalga oshirib bo'lmadi.",
          variant: "destructive"
        });
      }
    } catch (err) {
      toast({
        title: "Xatolik",
        description: "Tizimda xatolik yuz berdi.",
        variant: "destructive"
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0A0A] pb-24 md:pb-8">
      <SEO title={`${test.title} | EduContest`} description={test.description || "Mock test haqida batafsil ma'lumot"} />

      <div className={`w-full mx-auto px-4 py-6 transition-all duration-300 ${activeTab === 'results' ? 'max-w-7xl' : 'max-w-3xl'}`}>
        {/* Header & Navigation Pills */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/tests")}
              className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="Orqaga"
            >
              <AltArrowLeftIcon size={20} className="text-[#E8192C] shrink-0" />
            </button>
            <h1 className="text-lg font-extrabold text-slate-900 dark:text-white">
              {activeTab === 'results' ? "Natijalar va Reyting (BMBA)" : "Test haqida"}
            </h1>
          </div>

          {/* Navigation Pill Switcher */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <button
              onClick={() => setActiveTab('info')}
              className={`py-2 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                activeTab === 'info'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <BookBookmarkIcon size={16} className={activeTab === 'info' ? 'text-[#E8192C]' : ''} />
              Test Haqida
            </button>

            <button
              onClick={() => setActiveTab('results')}
              className={`py-2 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                activeTab === 'results'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <StarIcon size={16} className={activeTab === 'results' ? 'text-amber-500' : ''} />
              Natijalar (BMBA)
              {testResultsData?.submissions && testResultsData.submissions.length > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  {testResultsData.submissions.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Content Tabs */}
        {activeTab === 'info' ? (
          <div>
            {/* Main Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              {/* Subject Header */}
              <div className="p-6 pb-5 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xs border border-transparent dark:border-white/5" style={{ backgroundColor: `${sub.color}1c` }}>
                    <Icon size={30} style={{ color: sub.color }} />
                  </div>
                  <div className="flex-1">
                    <span className={`text-[11.5px] font-extrabold px-3 py-1 rounded-md ${test.is_free
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                        : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      }`}>
                      {test.is_free ? "BEPUL" : "PRO"}
                    </span>
                  </div>
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white leading-tight">
                  {test.title}
                </h2>
              </div>

              {/* Content */}
              <div className="p-6 space-y-5">
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <div className="flex items-center gap-2.5 p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                      <DocumentTextIcon size={22} className="text-blue-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 uppercase font-extrabold tracking-wider truncate">Savollar</p>
                      <p className="text-lg font-extrabold text-slate-900 dark:text-white">{test.questions_count}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
                      <ClockCircleIcon size={22} className="text-amber-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 uppercase font-extrabold tracking-wider truncate">Vaqt</p>
                      <p className="text-lg font-extrabold text-slate-900 dark:text-white">{test.duration_minutes ?? test.time_limit_minutes ?? test.time_limit_min ?? 60}m</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <UserIcon size={22} className="text-emerald-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 uppercase font-extrabold tracking-wider truncate">Ishlaganlar</p>
                      <p className="text-lg font-extrabold text-slate-900 dark:text-white">{testResultsData?.submissions?.length ?? test.participants_count ?? 0}</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {test.description && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <p className="text-[11px] font-extrabold uppercase text-slate-600 dark:text-slate-300 mb-1">Tavsif</p>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{test.description}</p>
                  </div>
                )}

                {/* Features */}
                <div className="space-y-3">
                  <p className="text-[11px] font-extrabold uppercase text-slate-600 dark:text-slate-300">Xususiyatlar</p>
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
                        <StarIcon size={16} className="text-amber-500" />
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">Milliy sertifikat standartlari asosida tayyorlangan</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                        <UserIcon size={16} className="text-blue-500" />
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">Barcha savollarga javob berish shart</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <CheckCircleIcon size={16} className="text-emerald-500" />
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">Natijalar avtomatik tekshiriladi</span>
                    </div>
                  </div>
                </div>

                {/* Rules */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center gap-2">
                    <DocumentTextIcon size={20} className="text-slate-700 dark:text-slate-300" />
                    <h3 className="text-xs font-extrabold uppercase text-slate-900 dark:text-white">Yo'riqnoma</h3>
                  </div>

                  <ol className="space-y-2.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">1</span>
                      <span>Test ajratilgan vaqt tugashi bilan avtomatik tarzda yakunlanadi.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">2</span>
                      <span>Test oynasidan boshqa oynaga <strong className="text-slate-900 dark:text-white">3 marta</strong> o'tsangiz, test avtomatik yakunlanadi.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">3</span>
                      <span>Barcha savollarga javob berish majburiy emas.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">4</span>
                      <span>Matematik formulalarni kiritish uchun <strong className="text-slate-900 dark:text-white">LiveMath</strong> klaviaturasidan foydalanishingiz mumkin.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">5</span>
                      <span>Testni yakunlaganingizdan so'ng natija va batafsil tahlilni ko'rishingiz mumkin.</span>
                    </li>
                  </ol>

                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 flex items-center gap-2 text-rose-600 dark:text-rose-400">
                    <DangerCircleIcon size={18} className="shrink-0" />
                    <p className="text-[11.5px] font-bold">Test davomida sahifadan chiqish yoki boshqa dasturlarga o'tish qat'iyan taqiqlanadi.</p>
                  </div>
                </div>

                {/* Checkbox Agreement */}
                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#E8192C] focus:ring-[#E8192C]"
                  />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Yuqoridagi <strong className="text-slate-900 dark:text-white">yo'riqnoma</strong> bilan tanishib chiqdim. Test jarayonida barcha qoidalarga to'liq amal qilishni zimmamga olaman.
                  </span>
                </label>

                {/* Price / Purchase Button */}
                {(() => {
                  const isPremium = (profile as any)?.subscription_tier && (profile as any)?.subscription_tier !== "standart";
                  const hasAccess = isAlreadyPurchased || test.is_free || (profile as any)?.is_lifetime || isPremium;
                  return (
                    <button
                      onClick={handleStart}
                      disabled={!agreed || isPurchasing}
                      className="w-full h-12 rounded-xl text-[15px] font-extrabold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 shadow-md"
                      style={{
                        background: hasAccess ? "#10b981" : RED,
                        boxShadow: agreed && !isPurchasing ? `0 4px 14px ${hasAccess ? "#10b98144" : RED + "44"}` : "none",
                      }}
                    >
                      {isPurchasing
                        ? "Jarayonda..."
                        : isAlreadyPurchased || (profile as any)?.is_lifetime
                        ? "Sotib olingan · Testni boshlash"
                        : isPremium
                        ? "Premium a'zolik · Testni boshlash"
                        : test.is_free
                        ? "Testni boshlash"
                        : "Sotib olish va boshlash"}
                      <AltArrowRightIcon size={20} />
                    </button>
                  );
                })()}

                {/* Full Width Results Shortcut Button */}
                {testResultsData?.submissions && testResultsData.submissions.length > 0 && (
                  <button
                    onClick={() => setActiveTab('results')}
                    className="w-full py-3.5 px-4 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all border border-amber-500/30 shadow-xs"
                  >
                    <StarIcon size={18} className="text-amber-500 shrink-0" />
                    <span>Natijalar va Rasch Modeli Reytingini Ko'rish (Full Width)</span>
                    <AltArrowRightIcon size={16} className="shrink-0" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Public Rasch / BMBA Results & Leaderboard (Full Width Tab) */
          <div className="w-full">
            {testResultsData?.submissions && testResultsData.submissions.length > 0 ? (
              <RaschModelAnalysis
                questions={testResultsData.questions}
                submissions={testResultsData.submissions}
              />
            ) : (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                <p className="text-sm font-bold text-slate-500">Hali hech kim ushbu testni topshirmagan.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        amount={test.price_educoin || 0}
        profile={profile}
      />
    </div>
  );
};

export default MockTestInfo;
