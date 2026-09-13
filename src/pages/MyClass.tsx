import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Search, ArrowRight, Lock, AlertCircle,
  Loader2, Check, ExternalLink, Calendar, Sparkles,
  Clock, ShieldCheck
} from "lucide-react";
import { UsersGroupTwoRoundedIcon } from "@solar-icons/react/bold-duotone/users-group-two-rounded";
import { BookBookmarkIcon } from "@solar-icons/react/bold-duotone/book-bookmark";
import { CheckCircleIcon } from "@solar-icons/react/bold-duotone/check-circle";
import { ClockCircleIcon } from "@solar-icons/react/bold-duotone/clock-circle";
import { Buildings2Icon } from "@solar-icons/react/bold-duotone/buildings-2";
import { DiplomaIcon } from "@solar-icons/react/bold-duotone/diploma";
import { StarsIcon } from "@solar-icons/react/bold-duotone/stars";
import { DocumentTextIcon } from "@solar-icons/react/bold-duotone/document-text";
import { AltArrowRightIcon } from "@solar-icons/react/bold-duotone/alt-arrow-right";
import SEO from "@/components/SEO";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface MyClassData {
  classes: Array<{
    id: string;
    name: string;
    subject: string;
    class_code: string;
    enrolled_at: string;
    centers: {
      id: string;
      name: string;
      username: string;
      logo_url?: string;
    };
  }>;
  availableTests: Array<{
    id: string;
    title: string;
    subject: string;
    duration_minutes: number;
    mode: "simple" | "exam";
    exam_start_at?: string;
    exam_end_at?: string;
    attempt_limit?: number;
    centers: {
      id: string;
      name: string;
      username: string;
      logo_url?: string;
    };
  }>;
  completedAttempts: Array<{
    id: string;
    center_test_id: string;
    score: number | null;
    correct_answers: number | null;
    total_questions: number | null;
    rasch_score: number | null;
    rasch_grade: string | null;
    completed_at: string;
    is_locked: boolean;
    lock_message?: string;
    center_tests: {
      id: string;
      title: string;
      subject: string;
      exam_end_at?: string;
      centers: {
        name: string;
        username: string;
      };
    };
  }>;
  pendingRequests?: Array<{
    id: string;
    class_id: string;
    center_id: string;
    status: string;
    requested_at: string;
    center_classes?: {
      id: string;
      name: string;
      subject: string;
    };
    centers?: {
      id: string;
      name: string;
      username: string;
      logo_url?: string;
    };
  }>;
}

export default function MyClass() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<"classes" | "tests" | "results" | "requests">("classes");
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [classCode, setClassCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState<any | null>(null);

  // Read URL query params (?code=... or ?tab=...)
  useEffect(() => {
    const codeParam = searchParams.get("code");
    if (codeParam) {
      setClassCode(codeParam.trim().toUpperCase());
      setJoinModalOpen(true);
    }
    const tabParam = searchParams.get("tab");
    if (tabParam && ["classes", "tests", "results", "requests"].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [searchParams]);

  const { data, isLoading, error } = useQuery<MyClassData>({
    queryKey: ["myclass-overview"],
    queryFn: async () => {
      const res = await fetch("/api/myclass/overview", { credentials: "include" });
      if (!res.ok) throw new Error("Sinflar ma'lumotlarini yuklab bo'lmadi");
      return res.json();
    }
  });

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classCode.trim()) {
      toast({ title: "Xatolik", description: "Sinf kodini kiriting", variant: "destructive" });
      return;
    }

    setIsJoining(true);
    try {
      const res = await fetch("/api/myclass/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code: classCode.trim().toUpperCase() })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Sinfga qo'shilishda xatolik");

      toast({
        title: "So'rov yuborildi!",
        description: json.message || "Markaz ma'muriyati tasdiqlagach sinf ochiladi."
      });
      setJoinModalOpen(false);
      setClassCode("");
      queryClient.invalidateQueries({ queryKey: ["myclass-overview"] });
      // Switch tab to requests so student sees their pending item
      setActiveTab("requests");
    } catch (err: any) {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-[calc(100vh-56px)] bg-[#F5F5F7] dark:bg-[#050B10] py-6 px-4 sm:px-6 lg:px-8">
        <div className="w-full space-y-6 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-48" />
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-72" />
            </div>
            <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-36" />
          </div>
          <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-80" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-44 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const classes = data?.classes || [];
  const availableTests = data?.availableTests || [];
  const completedAttempts = data?.completedAttempts || [];
  const pendingRequests = data?.pendingRequests || [];

  const highestScore = completedAttempts.reduce((max, att) => {
    if (att.rasch_score && att.rasch_score > max) return att.rasch_score;
    return max;
  }, 0);

  return (
    <div className="w-full min-h-[calc(100vh-56px)] bg-[#F5F5F7] dark:bg-[#050B10] text-slate-900 dark:text-white transition-colors">
      <SEO title="Sinflarim | EduContest" description="O'quv markazlari sinflari, topshiriqlar va Rasch natijalari" />

      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* HEADER WITH SIDE BUTTON */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Sinflarim
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 dark:bg-red-500/10 text-[#E8192C] border border-red-200/60 dark:border-red-500/20">
                O'quvchi portali
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              O'quv markazingiz sinflari, topshiriqlar va Rasch modeli bo'yicha test natijalari.
            </p>
          </div>

          <button
            onClick={() => setJoinModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-2xl bg-[#E8192C] hover:bg-[#D41524] text-white font-bold text-xs sm:text-sm shadow-md shadow-red-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0 cursor-pointer w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Sinfga qo'shilish (Kod orqali)</span>
          </button>
        </div>

        {/* PENDING NOTIFICATION BANNER (IF ANY) */}
        {pendingRequests.length > 0 && (
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <ClockCircleIcon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {pendingRequests.length} ta sinfga qo'shilish arizangiz kutilmoqda
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Markaz ma'muri arizangizni tasdiqlashi bilan sinf materiallari va testlar sizga ochiladi.
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab("requests")}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer w-full sm:w-auto text-center"
            >
              Arizalarni ko'rish
            </button>
          </div>
        )}

        {/* NAVIGATION TABS */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            onClick={() => setActiveTab("classes")}
            className={`pb-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === "classes"
                ? "border-[#E8192C] text-[#E8192C]"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <BookBookmarkIcon className="w-4 h-4" />
            <span>Sinflarim ({classes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("tests")}
            className={`pb-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === "tests"
                ? "border-[#E8192C] text-[#E8192C]"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <DocumentTextIcon className="w-4 h-4" />
            <span>Mock Testlar ({availableTests.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("results")}
            className={`pb-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === "results"
                ? "border-[#E8192C] text-[#E8192C]"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <DiplomaIcon className="w-4 h-4" />
            <span>Mening natijalarim ({completedAttempts.length})</span>
          </button>

          {pendingRequests.length > 0 && (
            <button
              onClick={() => setActiveTab("requests")}
              className={`pb-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                activeTab === "requests"
                  ? "border-[#E8192C] text-[#E8192C]"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <ClockCircleIcon className="w-4 h-4" />
              <span>Kutilayotgan arizalar</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white animate-pulse">
                {pendingRequests.length}
              </span>
            </button>
          )}
        </div>

        {/* TAB 1: CLASSES */}
        {activeTab === "classes" && (
          <div className="space-y-4">
            {classes.length === 0 ? (
              <div className="p-10 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto">
                  <UsersGroupTwoRoundedIcon className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">
                  Hozircha hech qaysi sinfga qo'shilmagansiz
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  O'qituvchingiz yoki o'quv markazingizdan 6 xonali maxsus sinf kodini oling va guruhga a'zo bo'ling.
                </p>
                <button
                  onClick={() => setJoinModalOpen(true)}
                  className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E8192C] hover:bg-[#D41524] text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Sinf kodini kiritish</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {classes.map((cls) => (
                  <div
                    key={cls.id}
                    className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-sm flex items-center justify-center overflow-hidden border border-slate-200/60 dark:border-slate-700/60 shrink-0">
                          {cls.centers?.logo_url ? (
                            <img src={cls.centers.logo_url} alt="Logo" className="w-full h-full object-cover" />
                          ) : (
                            cls.centers?.name?.slice(0, 2).toUpperCase() || "EC"
                          )}
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                          {cls.subject || "Umumiy fan"}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-black text-slate-900 dark:text-white text-base leading-tight">
                          {cls.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <Buildings2Icon className="w-3.5 h-3.5 text-slate-400" />
                          <span>{cls.centers?.name}</span>
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="font-mono text-slate-400 font-bold">
                        Kod: <span className="text-slate-700 dark:text-slate-200">{cls.class_code}</span>
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        A'zo bo'lindi: {new Date(cls.enrolled_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MOCK TESTS */}
        {activeTab === "tests" && (
          <div className="space-y-4">
            {availableTests.length === 0 ? (
              <div className="p-10 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
                <DocumentTextIcon className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
                <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">
                  Faol testlar mavjud emas
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Siz a'zo bo'lgan sinflarga yangi mock testlar yoki topshiriqlar biriktirilganda bu yerda ko'rinadi.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {availableTests.map((t) => {
                  const isExam = t.mode === "exam";
                  const now = new Date();
                  const isNotStarted = t.exam_start_at && now < new Date(t.exam_start_at);
                  const isEnded = t.exam_end_at && now > new Date(t.exam_end_at);

                  const attemptsForTest = completedAttempts.filter((att) => att.center_test_id === t.id);
                  const attemptsCount = attemptsForTest.length;
                  const isLimitReached = Boolean(t.attempt_limit && t.attempt_limit > 0 && attemptsCount >= t.attempt_limit);

                  return (
                    <div
                      key={t.id}
                      className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-5"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                            {t.subject || "Mock Test"}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isExam
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          }`}>
                            {isExam ? "Imtihon rejimi" : "Oddiy mashq"}
                          </span>
                        </div>

                        <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                          {t.title}
                        </h3>

                        <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Buildings2Icon className="w-3.5 h-3.5 text-slate-400" />
                            {t.centers?.name}
                          </span>
                          <span className="flex items-center gap-1">
                            <ClockCircleIcon className="w-3.5 h-3.5 text-slate-400" />
                            {t.duration_minutes} daqiqa
                          </span>
                          {t.attempt_limit ? (
                            <span>Urinishlar: {attemptsCount}/{t.attempt_limit} ta</span>
                          ) : attemptsCount > 0 ? (
                            <span>Topshirildi: {attemptsCount} marta</span>
                          ) : null}
                        </div>

                        {isExam && t.exam_start_at && (
                          <div className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2.5 rounded-xl">
                            Vaqt oralig'i:{" "}
                            {new Date(t.exam_start_at).toLocaleString("uz-UZ", {
                              month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                            })}{" "}
                            -{" "}
                            {t.exam_end_at ? new Date(t.exam_end_at).toLocaleString("uz-UZ", {
                              month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                            }) : "Noma'lum"}
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-xs text-slate-400 font-medium">
                          {isLimitReached
                            ? "Urinishlar tugagan"
                            : isNotStarted
                            ? "Test hali boshlanmagan"
                            : isEnded
                            ? "Test vaqti tugagan"
                            : attemptsCount > 0
                            ? `${attemptsCount} ta urinish ishlatilgan`
                            : "Topshirishga tayyormisiz?"}
                        </span>
                        {isLimitReached ? (
                          <button
                            onClick={() => setActiveTab("results")}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer"
                          >
                            <span>Natijani ko'rish</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => navigate(`/myclass/test/${t.id}`)}
                            disabled={Boolean(isNotStarted || isEnded)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E8192C] hover:bg-[#D41524] disabled:opacity-40 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                          >
                            <span>{attemptsCount > 0 ? "Qayta topshirish" : "Boshlash"}</span>
                            <AltArrowRightIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: RESULTS */}
        {activeTab === "results" && (
          <div className="space-y-4">
            {completedAttempts.length === 0 ? (
              <div className="p-10 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
                <DiplomaIcon className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
                <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">
                  Siz hali test topshirmagansiz
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Biriktirilgan testlarni yechgach, barcha to'g'ri javoblar va Rasch sertifikatlari bu yerda saqlanadi.
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden">
                <div className="sm:hidden px-4 py-2 text-[11px] text-slate-400 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800">
                  ← To'liq ko'rish uchun jadvalni o'ngga suring →
                </div>
                <div className="overflow-x-auto scrollbar-thin">
                  <table className="w-full text-left text-sm min-w-[700px]">
                    <thead className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <tr>
                        <th className="py-3.5 px-6">Test nomi</th>
                        <th className="py-3.5 px-4">O'quv markaz</th>
                        <th className="py-3.5 px-4">Topshirilgan vaqt</th>
                        <th className="py-3.5 px-4">To'g'ri javoblar</th>
                        <th className="py-3.5 px-4">Rasch Bali</th>
                        <th className="py-3.5 px-4">Daraja</th>
                        <th className="py-3.5 px-6 text-right">Amal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {completedAttempts.map((att) => {
                        const test = att.center_tests;
                        return (
                          <tr key={att.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                              {test?.title || "Mock Test"}
                            </td>
                            <td className="py-4 px-4 text-xs text-slate-500 font-medium">
                              {test?.centers?.name}
                            </td>
                            <td className="py-4 px-4 text-xs text-slate-500">
                              {new Date(att.completed_at).toLocaleString("uz-UZ", {
                                month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                              })}
                            </td>
                            <td className="py-4 px-4">
                              {att.is_locked ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                  <Lock className="w-3 h-3" /> Natija yopiq
                                </span>
                              ) : (
                                <span className="font-bold text-slate-900 dark:text-white">
                                  {att.correct_answers} / {att.total_questions || "?"}
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              {att.is_locked ? (
                                <span className="text-xs text-slate-400">—</span>
                              ) : (
                                <span className="font-black text-indigo-600 dark:text-indigo-400">
                                  {att.rasch_score != null ? `${att.rasch_score.toFixed(1)} ball` : "Hali hisoblanmagan"}
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              {att.is_locked ? (
                                <span className="text-xs text-slate-400">—</span>
                              ) : att.rasch_grade ? (
                                <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                  {att.rasch_grade}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400">—</span>
                              )}
                            </td>
                            <td className="py-4 px-6 text-right">
                              {!att.is_locked ? (
                                <button
                                  type="button"
                                  onClick={() => setSelectedAttempt(att)}
                                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                                >
                                  Natija kartasi
                                </button>
                              ) : (
                                <span className="text-xs text-slate-400">Yopiq</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PENDING REQUESTS */}
        {activeTab === "requests" && (
          <div className="space-y-4">
            {pendingRequests.length === 0 ? (
              <div className="p-10 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
                <ClockCircleIcon className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
                <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">
                  Kutilayotgan arizalar yo'q
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Siz yuborgan yangi sinf so'rovlari tasdiqlangan yoki hali ariza topshirmagansiz.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-amber-500/30 dark:border-amber-500/20 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Kutilmoqda</span>
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(req.requested_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-black text-slate-900 dark:text-white text-base">
                        {req.center_classes?.name || "Sinf"}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Fan: <b>{req.center_classes?.subject || "Umumiy"}</b> • Markaz: <b>{req.centers?.name}</b>
                      </p>
                    </div>

                    <p className="text-[11px] text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl">
                      Markaz ma'muri arizani ko'rib chiqmoqda. Tasdiqlanganda Telegram orqali xabar keladi.
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* JOIN CLASS MODAL */}
      {joinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                <UsersGroupTwoRoundedIcon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Sinfga qo'shilish
              </h3>
              <p className="text-xs text-slate-500">
                O'qituvchingiz yoki o'quv markazingiz taqdim etgan 6 xonali maxsus kodni kiriting.
              </p>
            </div>

            <form onSubmit={handleJoinClass} className="space-y-4">
              <div>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  placeholder="7K4P91"
                  className="w-full text-center tracking-widest font-mono text-2xl font-black px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 uppercase focus:outline-none focus:border-[#E8192C] text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => { setJoinModalOpen(false); setClassCode(""); }}
                  className="flex-1 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isJoining || classCode.length < 4}
                  className="flex-1 py-3.5 rounded-2xl bg-[#E8192C] hover:bg-[#D41524] disabled:opacity-50 text-white font-black text-xs shadow-lg shadow-red-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  {isJoining ? <Loader2 className="w-4 h-4 animate-spin" /> : "Qo'shilish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ATTEMPT DETAILS MODAL */}
      {selectedAttempt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-950/40 text-[#E8192C] flex items-center justify-center">
                  <DiplomaIcon className="w-6 h-6" />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Test natijalari
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium">Batafsil ma'lumot</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedAttempt(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white leading-snug">
                  {selectedAttempt.center_tests?.title || "Mock Test"}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedAttempt.center_tests?.centers?.name} • {new Date(selectedAttempt.completed_at).toLocaleString("uz-UZ", {
                    year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
                  })}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">To'g'ri javoblar:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedAttempt.correct_answers} / {selectedAttempt.total_questions || "?"} ta
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Natija foizi:</span>
                  <span className="font-black text-sm text-slate-900 dark:text-white">
                    {selectedAttempt.total_questions
                      ? Math.round((Number(selectedAttempt.correct_answers || 0) / Number(selectedAttempt.total_questions)) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Rasch modeli bali:</span>
                  <span className="font-black text-base text-indigo-600 dark:text-indigo-400">
                    {selectedAttempt.rasch_score != null ? `${Number(selectedAttempt.rasch_score).toFixed(1)} ball` : "Hali hisoblanmagan"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Sertifikat darajasi:</span>
                  {selectedAttempt.rasch_grade ? (
                    <span className="px-3 py-1 rounded-xl text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Daraja: {selectedAttempt.rasch_grade}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedAttempt(null)}
              className="w-full py-3.5 rounded-2xl bg-[#E8192C] hover:bg-[#D41524] text-white font-bold text-xs cursor-pointer shadow-md shadow-red-500/20 transition-all"
            >
              Tushunarli
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

