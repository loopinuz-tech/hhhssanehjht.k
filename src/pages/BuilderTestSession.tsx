import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, Clock, ArrowLeft, List,
  X, AlertCircle, CheckCircle, XCircle, Maximize, Minimize,
  Shield
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";
import { DangerCircleIcon } from "@solar-icons/react/bold-duotone/danger-circle";
import { CheckCircleIcon } from "@solar-icons/react/bold-duotone/check-circle";
import { AltArrowLeftIcon } from "@solar-icons/react/bold-duotone/alt-arrow-left";
import { AltArrowRightIcon } from "@solar-icons/react/bold-duotone/alt-arrow-right";

const RED = "#E8192C";

const normalizeMathDelimiters = (text: string) =>
  text
    .replace(/\\\(/g, "$")
    .replace(/\\\)/g, "$")
    .replace(/\\\[/g, () => "$$")
    .replace(/\\\]/g, () => "$$");

const LatexText = ({ text, className }: { text: string; className?: string }) => (
  <div className={className}>
    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
      {normalizeMathDelimiters(text || "")}
    </ReactMarkdown>
  </div>
);

interface BuilderQuestion {
  id: string;
  test_id: string;
  order_index: number;
  question_text: string;
  question_image: string;
  answer_type: string;
  explanation: string;
  points: number;
  options: BuilderOption[];
}

interface BuilderOption {
  id: string;
  question_id: string;
  label: string;
  option_text: string;
  is_correct: boolean;
  order_index: number;
}

const TEST_RULES = [
  "Testni boshlashdan oldin barcha qoidalarni diqqat bilan o'qing.",
  "Test paytida boshqa tab, oyna yoki dasturga o'tish taqiqlanadi.",
  "F5 tugmasini bosish yoki brauzerni qayta yuklash taqiqlanadi.",
  "Test faqat to'liq ekran rejimida ishlatilishi kerak.",
  "Testni boshlash va tugatish vaqti belgilangan. Vaqt tugaganda test avtomatik yakunlanadi.",
  "Bir necha marta tab o'tgazilsa, test avtomatik bekor qilinadi.",
  "Test yakunlangandan keyin natijani ko'rishingiz mumkin.",
];

const BuilderTestSession = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [test, setTest] = useState<any>(null);
  const [questions, setQuestions] = useState<BuilderQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    if (typeof window === "undefined" || !id) return {};
    const saved = localStorage.getItem(`builder_answers_${id}`);
    return saved ? JSON.parse(saved) : {};
  });
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showQuestionNav, setShowQuestionNav] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [attemptBlocked, setAttemptBlocked] = useState(false);
  const [wrongFlash, setWrongFlash] = useState<string | null>(null);
  const [isCreatorOrAdmin, setIsCreatorOrAdmin] = useState(false);
  const [attemptStats, setAttemptStats] = useState<any>(null);
  const [showRules, setShowRules] = useState(true);
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [acceptedRules, setAcceptedRules] = useState<Set<number>>(new Set());
  const [testStarted, setTestStarted] = useState(false);
  const [testExpired, setTestExpired] = useState(false);
  const sessionRef = useRef<HTMLDivElement>(null);

  // Shuffle helper
  const shuffleArray = <T,>(arr: T[]): T[] => {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      const { data: testData } = await supabase
        .from("builder_tests" as any)
        .select("*")
        .eq("id", id)
        .single();
      if (!testData) {
        toast({ title: "Test topilmadi", variant: "destructive" });
        navigate("/tests");
        return;
      }

      // Time window check
      const now = new Date();
      const opensAt = (testData as any).opens_at ? new Date((testData as any).opens_at) : null;
      const closesAt = (testData as any).closes_at ? new Date((testData as any).closes_at) : null;
      if (opensAt && now < opensAt) {
        setTestExpired(true);
        setLoading(false);
        return;
      }
      if (closesAt && now > closesAt) {
        setTestExpired(true);
        setLoading(false);
        return;
      }

      // Check if user is creator or admin
      if (user?.id && (testData as any).creator_id === user.id) {
        setIsCreatorOrAdmin(true);
        const { data: attempts } = await supabase
          .from("builder_test_attempts" as any)
          .select("*")
          .eq("test_id", id)
          .order("finished_at", { ascending: false });
        if (attempts && attempts.length > 0) {
          const avgScore = attempts.reduce((s: number, a: any) => s + (a.score_percent || 0), 0) / attempts.length;
          setAttemptStats({
            totalAttempts: attempts.length,
            avgScore: Math.round(avgScore),
            latestAttempt: attempts[0],
          });
        }
      }

      // Check attempt limits
      if (user?.id) {
        const { data: existingAttempts } = await supabase
          .from("builder_test_attempts" as any)
          .select("id")
          .eq("test_id", id)
          .eq("student_id", user.id);
        const maxAttempts = (testData as any).max_attempts || 1;
        if (existingAttempts && existingAttempts.length >= maxAttempts) {
          setAttemptBlocked(true);
          setLoading(false);
          return;
        }
      }

      const { data: qData } = await supabase
        .from("builder_questions" as any)
        .select("*")
        .eq("test_id", id)
        .order("order_index", { ascending: true });

      const questionsWithOpts = await Promise.all(
        (qData || []).map(async (q: any) => {
          const { data: opts } = await supabase
            .from("builder_answer_options" as any)
            .select("*")
            .eq("question_id", q.id)
            .order("order_index", { ascending: true });
          return { ...q, options: opts || [] };
        })
      );

      setTest(testData);

      // Shuffle if enabled
      if ((testData as any).shuffle_order) {
        setQuestions(shuffleArray(questionsWithOpts));
      } else {
        setQuestions(questionsWithOpts);
      }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0 || loading || submitted || !testStarted) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, loading, submitted, testStarted]);

  // Save answers
  useEffect(() => {
    if (id && !submitted && testStarted) {
      localStorage.setItem(`builder_answers_${id}`, JSON.stringify(answers));
    }
  }, [answers, id, submitted, testStarted]);

  // Tab switching / visibility detection — auto-submit immediately
  useEffect(() => {
    if (submitted || loading || !test || !testStarted) return;
    const handleVisibility = () => {
      if (document.hidden) {
        toast({
          title: "Test bekor qilindi!",
          description: "Tab o'tgazilgani uchun test avtomatik yakunlandi.",
          variant: "destructive",
        });
        setTimeout(() => handleSubmit(), 100);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [submitted, loading, test, testStarted]);

  // Fullscreen change detection — auto-submit if fullscreen exited
  useEffect(() => {
    const handleFsChange = () => {
      const inFs = !!document.fullscreenElement;
      setIsFullscreen(inFs);
      if (!inFs && test?.fullscreen_mode && testStarted && !submitted) {
        toast({
          title: "Test bekor qilindi!",
          description: "To'liq ekrandan chiqilgani uchun test yakunlandi.",
          variant: "destructive",
        });
        setTimeout(() => handleSubmit(), 100);
      }
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, [test, testStarted, submitted]);

  // Fullscreen enforcement — every 2 seconds
  useEffect(() => {
    if (!test?.fullscreen_mode || !testStarted || submitted) return;
    const interval = setInterval(async () => {
      if (!document.fullscreenElement && sessionRef.current && (navigator as any).userActivation?.isActive) {
        try {
          await sessionRef.current.requestFullscreen();
        } catch {
          // ignored
        }
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [test, testStarted, submitted]);

  // Security: block right-click, keyboard shortcuts, copy/paste
  useEffect(() => {
    if (!testStarted || submitted) return;
    const blockKey = (e: KeyboardEvent) => {
      // F5, Ctrl+R
      if (e.key === "F5" || (e.ctrlKey && (e.key === "r" || e.key === "R"))) {
        e.preventDefault(); e.stopPropagation();
        toast({ title: "Sahifani yangilash taqiqlangan!", variant: "destructive" });
      }
      // F12, Ctrl+Shift+I/J/C (dev tools)
      if (e.key === "F12" || (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key.toUpperCase()))) {
        e.preventDefault(); e.stopPropagation();
      }
      // Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+A, Ctrl+U
      if (e.ctrlKey && ["c", "v", "x", "a", "u"].includes(e.key.toLowerCase())) {
        e.preventDefault(); e.stopPropagation();
      }
    };
    const blockCtx = (e: Event) => { e.preventDefault(); };
    const blockCopy = (e: ClipboardEvent) => { e.preventDefault(); };
    const blockPaste = (e: ClipboardEvent) => { e.preventDefault(); };
    const beforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    document.addEventListener("keydown", blockKey, true);
    document.addEventListener("contextmenu", blockCtx, true);
    document.addEventListener("copy", blockCopy, true);
    document.addEventListener("paste", blockPaste, true);
    document.addEventListener("cut", blockCopy, true);
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      document.removeEventListener("keydown", blockKey, true);
      document.removeEventListener("contextmenu", blockCtx, true);
      document.removeEventListener("copy", blockCopy, true);
      document.removeEventListener("paste", blockPaste, true);
      document.removeEventListener("cut", blockCopy, true);
      window.removeEventListener("beforeunload", beforeUnload);
    };
  }, [testStarted, submitted]);

  const handleStartTest = async () => {
    if (!user?.id) {
      toast({ title: "Tizimga kirish kerak!", description: "Testni boshlash uchun tizimga kiring.", variant: "destructive" });
      navigate("/login");
      return;
    }
    setShowRules(false);
    setTestStarted(true);
    const durationSeconds = ((test?.time_limit_min || 30) * 60);
    const savedExpiry = localStorage.getItem(`builder_expiry_${id}`);
    if (savedExpiry) {
      const remaining = Math.max(0, Math.floor((parseInt(savedExpiry) - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        handleSubmit();
        return;
      }
    } else {
      setTimeLeft(durationSeconds);
      localStorage.setItem(`builder_expiry_${id}`, (Date.now() + durationSeconds * 1000).toString());
    }

    if (test?.fullscreen_mode && sessionRef.current) {
      try {
        await sessionRef.current.requestFullscreen();
        setIsFullscreen(true);
      } catch {
        // denied
      }
    }
  };

  const handleSelect = useCallback((questionId: string, optionId: string) => {
    if (submitted) return;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: prev[questionId] === optionId ? "" : optionId,
    }));
    if (test?.show_result === "immediate") {
      const q = questions.find((q) => q.id === questionId);
      if (q) {
        const selectedOpt = q.options.find((o) => o.id === optionId);
        if (selectedOpt && !selectedOpt.is_correct) {
          setWrongFlash(questionId);
          setTimeout(() => setWrongFlash(null), 600);
        }
      }
    }
  }, [submitted, test, questions]);

  const handleSubmit = useCallback(async () => {
    if (submitted || !test || !id) return;
    setSubmitted(true);
    localStorage.removeItem(`builder_expiry_${id}`);
    localStorage.removeItem(`builder_answers_${id}`);

    let correct = 0;
    let wrong = 0;
    let totalPoints = 0;
    let earnedPoints = 0;
    const answerRecords: any[] = [];

    for (const q of questions) {
      totalPoints += q.points || 5;
      const selectedId = answers[q.id];
      if (selectedId) {
        const selectedOpt = q.options.find((o) => o.id === selectedId);
        const isCorrect = selectedOpt?.is_correct || false;
        if (isCorrect) { correct++; earnedPoints += q.points || 5; } else { wrong++; }
        answerRecords.push({ question_id: q.id, selected_option_id: selectedId, is_correct: isCorrect, points_earned: isCorrect ? (q.points || 5) : 0 });
      } else {
        wrong++;
        answerRecords.push({ question_id: q.id, selected_option_id: null, is_correct: false, points_earned: 0 });
      }
    }

    const scorePercent = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

    const { data: attempt, error: attemptError } = await (supabase
      .from("builder_test_attempts" as any) as any)
      .insert({
        test_id: id,
        student_id: user?.id,
        finished_at: new Date().toISOString(),
        time_spent_sec: ((test.time_limit_min || 30) * 60) - timeLeft,
        score_percent: scorePercent,
        correct_count: correct,
        wrong_count: wrong,
        total_points: earnedPoints,
        mode: "normal",
      } as any)
      .select()
      .single();

    if (attemptError) {
      console.error("Attempt save error:", attemptError);
      toast({ title: "Natija serverga yuborilmadi! Qayta urinib ko'ring.", variant: "destructive" });
      setSubmitted(false);
      return;
    }

    if (attempt) {
      setAttemptId((attempt as any).id);
      const answersToInsert = answerRecords.map((a) => ({ ...a, attempt_id: (attempt as any).id }));
      if (answersToInsert.length > 0) {
        const { error: answersError } = await (supabase.from("builder_attempt_answers" as any) as any).insert(answersToInsert as any);
        if (answersError) {
          console.error("Answers save error:", answersError);
        }
      }
    }

    setResults({
      correct, wrong, total: questions.length, scorePercent, earnedPoints, totalPoints,
      details: questions.map((q, idx) => {
        const selectedId = answers[q.id];
        const selectedOpt = selectedId ? q.options.find((o) => o.id === selectedId) : null;
        const correctOpt = q.options.find((o) => o.is_correct);
        return {
          question_text: q.question_text,
          order_index: q.order_index || idx + 1,
          is_correct: selectedOpt?.is_correct || false,
          points_earned: selectedOpt?.is_correct ? (q.points || 5) : 0,
          max_points: q.points || 5,
          selected_label: selectedOpt?.label || "—",
          selected_text: selectedOpt?.option_text || "Javob berilmagan",
          correct_label: correctOpt?.label || "—",
          correct_text: correctOpt?.option_text || "",
          all_options: q.options,
        };
      }),
    });
  }, [submitted, test, id, questions, answers, user, timeLeft]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement && sessionRef.current) {
        await sessionRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else if (document.fullscreenElement) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {}
  };

  const answeredCount = Object.values(answers).filter(Boolean).length;
  const currentQ = questions[currentIdx];

  // Loading
  if (loading) {
    return (
      <div ref={sessionRef} className="flex items-center justify-center h-screen bg-slate-50 dark:bg-[#080C14]">
        <div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-[#E8192C] rounded-full" />
      </div>
    );
  }

  // Test expired / not in time window
  if (testExpired) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#080C14] flex flex-col items-center justify-center p-4">
        <div className="bg-white dark:bg-[#0a0f1a] rounded-2xl border border-slate-200 dark:border-white/[0.06] p-6 max-w-sm w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 mx-auto flex items-center justify-center">
            <Clock className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-[16px] font-bold text-slate-900 dark:text-white">Test hozircha mavjud emas</h2>
          <p className="text-[12px] text-slate-500">
            Test hozirgi vaqtda faol emas. Boshlanish va tugash vaqtini tekshiring.
          </p>
          <button
            onClick={() => navigate("/tests")}
            className="w-full py-2.5 rounded-xl bg-[#E8192C] text-white text-[13px] font-semibold hover:opacity-90 transition-opacity"
          >
            Testlarga qaytish
          </button>
        </div>
      </div>
    );
  }

  // Attempt blocked
  if (attemptBlocked) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#080C14] flex flex-col items-center justify-center p-4">
        <div className="bg-white dark:bg-[#0a0f1a] rounded-2xl border border-slate-200 dark:border-white/[0.06] p-6 max-w-sm w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-orange-100 mx-auto flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-orange-600" />
          </div>
          <h2 className="text-[16px] font-bold text-slate-900 dark:text-white">Urinishlar tugadi</h2>
          <p className="text-[12px] text-slate-500">
            Siz ushbu testni {test?.max_attempts || 1} marta urinib ko'rdingiz
          </p>
          <button
            onClick={() => navigate("/tests")}
            className="w-full py-2.5 rounded-xl bg-[#E8192C] text-white text-[13px] font-semibold hover:opacity-90 transition-opacity"
          >
            Testlarga qaytish
          </button>
        </div>
      </div>
    );
  }

  // No questions
  if (!test || questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 dark:bg-[#080C14]">
        <AlertCircle className="w-12 h-12 text-slate-300 mb-3" />
        <p className="text-[14px] text-slate-500">Savollar topilmadi</p>
        <button onClick={() => navigate("/tests")} className="mt-4 text-[13px] text-[#E8192C] font-medium">
          Testlarga qaytish
        </button>
      </div>
    );
  }

  // Not logged in - show login prompt
  if (!user?.id && !loading && !authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#080C14] flex flex-col items-center justify-center p-4">
        <div className="bg-white dark:bg-[#0a0f1a] rounded-2xl border border-slate-200 dark:border-white/[0.06] p-6 max-w-sm w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-orange-100 mx-auto flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-orange-600" />
          </div>
          <h2 className="text-[16px] font-bold text-slate-900 dark:text-white">Tizimga kirish kerak</h2>
          <p className="text-[12px] text-slate-500">
            Testni boshlash uchun tizimga kirishingiz kerak. Iltimos, tizimga kiring yoki ro'yxatdan o'ting.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/tests")}
              className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-[13px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
            >
              Orqaga
            </button>
            <button
              onClick={() => navigate("/login")}
              className="flex-1 py-2.5 rounded-xl bg-[#E8192C] text-white text-[13px] font-semibold hover:opacity-90 transition-opacity"
            >
              Tizimga kirish
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── RULES PAGE ───
  if (showRules && !testStarted) {
    return (
      <div ref={sessionRef} className="min-h-screen bg-slate-50 dark:bg-[#080C14] flex flex-col items-center justify-center p-4">
        <SEO title={`${test.title} - Qoidalar`} description="Test qoidalari va ko'rsatmalari" />
        <div className="bg-white dark:bg-[#0a0f1a] rounded-3xl border border-slate-200 dark:border-white/[0.08] p-5 sm:p-6 max-w-lg w-full space-y-4 shadow-xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center border border-red-200/60 dark:border-red-500/20">
              <DangerCircleIcon size={22} className="text-[#E8192C]" />
            </div>
            <div>
              <h2 className="text-[17px] font-extrabold text-slate-900 dark:text-white">Test qoidalari</h2>
              <p className="text-[12.5px] font-extrabold text-slate-700 dark:text-slate-200 mt-0.5">{test.title}</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {TEST_RULES.map((rule, idx) => (
              <label
                key={idx}
                onClick={() => {
                  setAcceptedRules((prev) => {
                    const next = new Set(prev);
                    if (next.has(idx)) next.delete(idx);
                    else next.add(idx);
                    return next;
                  });
                }}
                className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  acceptedRules.has(idx)
                    ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/10"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50"
                }`}
              >
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  acceptedRules.has(idx)
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}>
                  {acceptedRules.has(idx) ? <CheckCircleIcon size={16} /> : <span className="text-[11px] font-extrabold">{idx + 1}</span>}
                </div>
                <p className="text-[13px] font-medium text-slate-700 dark:text-slate-300 leading-relaxed">{rule}</p>
              </label>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => navigate("/tests")}
              className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-[13.5px] font-extrabold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Bekor qilish
            </button>
            <button
              onClick={handleStartTest}
              className="flex-1 py-3 rounded-xl bg-[#E8192C] text-white text-[13.5px] font-extrabold hover:bg-[#d01526] transition-all shadow-md active:scale-[0.98]"
            >
              Testni boshlash
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── RESULTS ───
  if (results) {
    const showDetails = test?.show_result === "immediate" || test?.show_result === "after_review";
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#080C14] flex flex-col items-center justify-center p-4">
        <SEO title={`${test.title} - Natija`} description="Test natijasi va tahlili" />
        <div className="bg-white dark:bg-[#0a0f1a] rounded-3xl border border-slate-200 dark:border-white/[0.08] p-5 sm:p-6 max-w-lg w-full space-y-4 shadow-xl">
          <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center border ${results.scorePercent >= 50 ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20" : "bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20"}`}>
            {results.scorePercent >= 50 ? <CheckCircleIcon size={32} className="text-emerald-500" /> : <DangerCircleIcon size={32} className="text-rose-500" />}
          </div>
          <h2 className="text-[18px] font-extrabold text-slate-900 dark:text-white text-center">{test.title}</h2>
          <div className="text-[36px] font-extrabold text-slate-900 dark:text-white text-center">{results.scorePercent}%</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl p-3.5 border border-emerald-200/60 dark:border-emerald-500/20 text-center">
              <p className="text-[22px] font-extrabold text-emerald-600 dark:text-emerald-400">{results.correct}</p>
              <p className="text-[12px] font-extrabold text-emerald-700 dark:text-emerald-300">To'g'ri</p>
            </div>
            <div className="bg-rose-50 dark:bg-rose-500/10 rounded-2xl p-3.5 border border-rose-200/60 dark:border-rose-500/20 text-center">
              <p className="text-[22px] font-extrabold text-rose-600 dark:text-rose-400">{results.wrong}</p>
              <p className="text-[12px] font-extrabold text-rose-700 dark:text-rose-300">Noto'g'ri</p>
            </div>
          </div>
          <p className="text-[13px] font-extrabold text-slate-700 dark:text-slate-200 text-center">{results.earnedPoints} / {results.totalPoints} ball</p>

          {/* Batafsil natijalar with custom scrollbar */}
          {showDetails && results.details && results.details.length > 0 && (
            <div className="text-left pt-2 border-t border-slate-200 dark:border-white/[0.06]">
              <p className="text-[12px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-2">Savollar bo'yicha natija</p>
              <div className="space-y-3 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
                {results.details.map((d: any, i: number) => (
                  <div
                    key={i}
                    className={`rounded-2xl border overflow-hidden ${
                      d.is_correct
                        ? "border-emerald-200 dark:border-emerald-500/20"
                        : "border-rose-200 dark:border-rose-500/20"
                    }`}
                  >
                    <div className={`flex items-center gap-2 px-3 py-2.5 ${
                      d.is_correct
                        ? "bg-emerald-50/70 dark:bg-emerald-500/10"
                        : "bg-rose-50/70 dark:bg-rose-500/10"
                    }`}>
                      <span className="w-6 text-center font-extrabold text-slate-800 dark:text-slate-200 text-[12px] shrink-0">{d.order_index}</span>
                      <span className="flex-1 truncate text-[13px] font-extrabold text-slate-900 dark:text-white">{d.question_text}</span>
                      <span className={`px-2 py-0.5 rounded-md font-extrabold text-[12px] shrink-0 ${d.is_correct ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" : "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300"}`}>
                        {d.is_correct ? "To'g'ri" : "Xato"}
                      </span>
                      <span className="w-12 text-right font-extrabold text-[12px] text-slate-700 dark:text-slate-300 shrink-0">
                        {d.points_earned}/{d.max_points}
                      </span>
                    </div>
                    <div className="px-3.5 py-2.5 bg-white dark:bg-slate-900/50 space-y-2">
                      <div className="flex items-center gap-2 text-[12px]">
                        <span className="font-extrabold text-slate-700 dark:text-slate-200 w-16 shrink-0">Sizning:</span>
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold ${
                          d.is_correct
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300"
                            : "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300"
                        }`}>
                          {d.selected_label || "- Javob berilmagan"}
                        </span>
                        <span className="text-slate-800 dark:text-slate-200 font-extrabold truncate">{d.selected_text}</span>
                      </div>
                      {!d.is_correct && (
                        <div className="flex items-center gap-2 text-[12px]">
                          <span className="font-extrabold text-slate-700 dark:text-slate-200 w-16 shrink-0">To'g'ri:</span>
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                            {d.correct_label}
                          </span>
                          <span className="text-slate-800 dark:text-slate-200 font-extrabold truncate">{d.correct_text}</span>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {d.all_options?.map((opt: any) => (
                          <span
                            key={opt.id}
                            className={`px-2 py-1 rounded-lg text-[11px] font-extrabold border ${
                              opt.is_correct
                                ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300"
                                : opt.id === (d.all_options?.find((o: any) => o.label === d.selected_label)?.id)
                                ? "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300"
                                : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300"
                            }`}
                          >
                            {opt.label}) {opt.option_text?.slice(0, 30)}{opt.option_text?.length > 30 ? "..." : ""}
                            {opt.is_correct ? " ✓" : ""}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isCreatorOrAdmin && attemptStats && (
            <div className="bg-blue-50 dark:bg-blue-500/10 rounded-2xl p-3.5 space-y-1 border border-blue-200/60 dark:border-blue-500/20">
              <p className="text-[12px] font-extrabold text-blue-700 dark:text-blue-300">Yaratuvchi ma'lumotlari</p>
              <p className="text-[12px] font-extrabold text-slate-700 dark:text-slate-300">
                Jami urinishlar: {attemptStats.totalAttempts} · O'rtacha: {attemptStats.avgScore}%
              </p>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => navigate("/tests")}
              className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-[13.5px] font-extrabold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Testlarga qaytish
            </button>
            <button
              onClick={() => navigate("/results/builder")}
              className="flex-1 py-3 rounded-xl bg-[#E8192C] text-white text-[13.5px] font-extrabold hover:bg-[#d01526] transition-all shadow-md active:scale-[0.98]"
            >
              Natijalar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── MAIN TEST UI ───
  return (
    <div ref={sessionRef} className="min-h-screen bg-slate-50 dark:bg-[#080C14] flex flex-col">
      <SEO title={test.title} description={test.description || test.title} />

      {/* Header */}
      <div className="sticky top-0 z-30 bg-white dark:bg-[#0a0f1a] border-b border-slate-200 dark:border-white/[0.06]">
        <div className="flex items-center justify-between px-3 sm:px-4 h-12">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setShowExitConfirm(true)}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </button>
            <div className="min-w-0">
              <h1 className="text-[13px] font-bold text-slate-900 dark:text-white line-clamp-1">{test.title}</h1>
              <p className="text-[10px] text-slate-400">{currentIdx + 1}/{questions.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <div className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-[12px] font-bold ${
              timeLeft < 60 ? "bg-red-50 text-red-600 animate-pulse" : "bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300"
            }`}>
              <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              {formatTime(timeLeft)}
            </div>
            <button
              onClick={toggleFullscreen}
              className="hidden sm:flex w-8 h-8 rounded-lg items-center justify-center hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
              title={isFullscreen ? "Chiqish" : "To'liq ekran"}
            >
              {isFullscreen ? <Minimize className="w-4 h-4 text-slate-600 dark:text-slate-400" /> : <Maximize className="w-4 h-4 text-slate-600 dark:text-slate-400" />}
            </button>
            <button
              onClick={() => setShowQuestionNav(!showQuestionNav)}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
            >
              <List className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-slate-100 dark:bg-white/[0.06]">
          <div
            className="h-full bg-[#E8192C] transition-all duration-300"
            style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
          />
        </div>

        {/* Horizontal Scrollable Question Numbers Bar */}
        <div className="px-3 py-2 bg-slate-50/80 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            {questions.map((q, i) => (
              <button
                key={q.id}
                onClick={() => setCurrentIdx(i)}
                className={`w-8 h-8 rounded-xl text-[11.5px] font-extrabold shrink-0 transition-all ${
                  i === currentIdx
                    ? "bg-[#E8192C] text-white shadow-sm scale-105"
                    : answers[q.id]
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Question Nav Panel */}
      <AnimatePresence>
        {showQuestionNav && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="sticky top-[85px] z-20 bg-white dark:bg-[#0a0f1a] border-b border-slate-200 dark:border-white/[0.06] p-3"
          >
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 custom-scrollbar">
              {questions.map((q, i) => (
                <button
                  key={q.id}
                  onClick={() => { setCurrentIdx(i); setShowQuestionNav(false); }}
                  className={`w-8 h-8 rounded-xl text-[11.5px] font-extrabold shrink-0 transition-all ${
                    i === currentIdx
                      ? "bg-[#E8192C] text-white shadow-sm scale-105"
                      : answers[q.id]
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300"
                      : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
              <span className="text-[12px] font-extrabold text-slate-700 dark:text-slate-200">{answeredCount}/{questions.length} javob berildi</span>
              <button
                onClick={handleSubmit}
                className="px-4 py-1.5 bg-[#E8192C] text-white text-[12px] font-extrabold rounded-xl hover:bg-[#d01526] transition-all shadow-md"
              >
                Yakunlash
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Question Content with Options */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4">
        {currentQ && (
          <motion.div
            key={currentQ.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="max-w-xl mx-auto space-y-4 sm:space-y-5"
          >
            <div className="flex items-start gap-3 sm:gap-4">
              <span className="flex-shrink-0 w-9 h-9 rounded-xl bg-[#E8192C] text-white text-[13px] font-bold flex items-center justify-center">
                {currentIdx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <LatexText
                  text={currentQ.question_text}
                  className="text-[15px] sm:text-[17px] text-slate-900 dark:text-white leading-relaxed [&_p]:m-0 [&_p]:text-[15px] sm:[&_p]:text-[17px]"
                />
                {currentQ.question_image && (
                  <img
                    src={currentQ.question_image}
                    alt=""
                    className="mt-3 max-w-full rounded-xl border border-slate-200 dark:border-white/[0.06]"
                  />
                )}
              </div>
            </div>

            {/* Options - inline with question */}
            {(currentQ.answer_type === "variants" || currentQ.answer_type === "truefalse") ? (
              <div className="space-y-2">
                {currentQ.options.map((opt) => {
                  const isSelected = answers[currentQ.id] === opt.id;
                  const isWrongFlash = wrongFlash === currentQ.id && isSelected && !opt.is_correct;
                  const showCorrectIndicator = test?.show_result === "immediate" && submitted;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelect(currentQ.id, opt.id)}
                      className={`w-full flex items-center gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-xl border text-left transition-all ${
                        isWrongFlash
                          ? "border-red-500 bg-red-100 dark:bg-red-500/20 animate-pulse"
                          : isSelected
                          ? "border-[#E8192C] bg-red-50 dark:bg-red-500/10"
                          : showCorrectIndicator && opt.is_correct
                          ? "border-green-500 bg-green-50 dark:bg-green-500/10"
                          : "border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#0a0f1a] hover:border-slate-300 dark:hover:border-white/[0.12]"
                      }`}
                    >
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-bold flex-shrink-0 ${
                        isWrongFlash
                          ? "bg-red-500 text-white"
                          : isSelected
                          ? "bg-[#E8192C] text-white"
                          : showCorrectIndicator && opt.is_correct
                          ? "bg-green-500 text-white"
                          : "bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400"
                      }`}>
                        {opt.label}
                      </span>
                      <span className="text-[14px] text-slate-700 dark:text-slate-300 flex-1">
                        <LatexText text={opt.option_text} className="[&_p]:m-0 [&_p]:text-[14px]" />
                      </span>
                      {isWrongFlash && <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
                      {showCorrectIndicator && opt.is_correct && <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            ) : currentQ ? (
              <textarea
                value={answers[currentQ.id] || ""}
                onChange={(e) => {
                  if (!submitted) {
                    setAnswers((prev) => ({ ...prev, [currentQ.id]: e.target.value }));
                  }
                }}
                placeholder="Javobingizni yozing..."
                rows={4}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white dark:bg-[#0a0f1a] border border-slate-200 dark:border-white/[0.06] rounded-xl text-[14px] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E8192C]/30 resize-none"
              />
            ) : null}

            {currentQ?.explanation && submitted && (
              <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-200 dark:border-blue-500/20">
                <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 mb-1">Izoh:</p>
                <p className="text-[12px] text-slate-700 dark:text-slate-300">{currentQ.explanation}</p>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="sticky bottom-0 z-40 bg-white dark:bg-[#0a0f1a] border-t border-slate-200 dark:border-white/[0.06]">
        <div className="flex items-center justify-between max-w-xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3">
          <button
            onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
            disabled={currentIdx === 0}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-2 rounded-xl text-[11px] sm:text-[12px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Oldingi</span>
          </button>

          <span className="text-[10px] text-slate-400 tabular-nums">
            {answeredCount}/{questions.length}
          </span>

          {currentIdx === questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              className="flex items-center gap-1 px-3 sm:px-4 py-2 rounded-xl bg-[#E8192C] text-white text-[11px] sm:text-[12px] font-bold hover:opacity-90 transition-opacity"
            >
              <CheckCircle className="w-4 h-4" />
              Yakunlash
            </button>
          ) : (
            <button
              onClick={() => setCurrentIdx((prev) => Math.min(questions.length - 1, prev + 1))}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-2 rounded-xl bg-[#E8192C] text-white text-[11px] sm:text-[12px] font-bold hover:opacity-90 transition-opacity"
            >
              <span className="hidden sm:inline">Keyingi</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Exit Confirm Modal */}
      <AnimatePresence>
        {showExitConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowExitConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white dark:bg-[#0a0f1a] rounded-2xl p-5 max-w-sm w-full space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="text-[14px] font-bold text-slate-900 dark:text-white">Testdan chiqishni xohlaysizmi?</h3>
                  <p className="text-[11px] text-slate-500">Javoblar saqlanmaydi</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-[13px] font-semibold text-slate-700 dark:text-slate-300"
                >
                  Davom etish
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem(`builder_expiry_${id}`);
                    localStorage.removeItem(`builder_answers_${id}`);
                    navigate("/tests");
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-[13px] font-semibold hover:bg-red-700 transition-colors"
                >
                  Chiqish
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BuilderTestSession;
