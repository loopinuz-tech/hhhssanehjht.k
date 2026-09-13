import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import {
  Clock, ArrowLeft, ArrowRight, CheckCircle2, AlertTriangle,
  Lock, Send, HelpCircle, Check, Loader2, Award, ChevronLeft, ChevronRight,
  Sun, Moon, BookOpen, X, RefreshCw, Eye, Sparkles, FileText,
  CheckSquare, Square, ZoomIn, Info
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import SEO from "@/components/SEO";
import { useToast } from "@/hooks/use-toast";
import { rewriteStorageUrl } from "@/lib/storage";

interface ExamQuestion {
  id: string;
  question_number: number;
  question_text?: string;
  question_image?: string;
  image_url?: string;
  question_subtext?: string;
  type?: string;
  metadata?: {
    options?: any;
    blanks?: any[];
    left?: string[];
    right?: string[];
    matching_pairs?: any[];
    passage_text?: string;
    passage_id?: string;
    type?: string;
    [key: string]: any;
  };
  sub_questions?: ExamQuestion[];
  points_a?: number | null;
  points_b?: number | null;
  difficulty?: number;
}

interface ExamStartData {
  attempt_id: string;
  test: {
    id: string;
    title: string;
    subject?: string;
    duration_minutes: number;
    mode: string;
    exam_end_at?: string;
  };
  allowed_seconds: number;
  questions: ExamQuestion[];
}

interface SubmitResult {
  released: boolean;
  message?: string;
  score?: number;
  correct_answers?: number;
  total_questions?: number;
  percentage?: number;
  breakdown?: Array<{
    question_number: number;
    type: string;
    user_answer: any;
    is_correct: boolean;
    correct_answer?: any;
  }>;
}

interface ParsedOption {
  key: string;
  text: string;
}

const normalizeMath = (text?: string): string => {
  if (!text) return "";
  let formatted = String(text)
    .replace(/\\\(/g, "$")
    .replace(/\\\)/g, "$")
    .replace(/\\\[/g, "$$")
    .replace(/\\\]/g, "$$")
    .replace(/(\$[^$]+?)\s+\$/g, "$1$");

  if (!formatted.includes("$") && /\\[a-zA-Z]+/.test(formatted)) {
    formatted = `$${formatted.trim()}$`;
  }

  const parts = formatted.split(/(\$\$[\s\S]*?\$\$|\$[^$]+?\$)/g);
  formatted = parts.map((part) => {
    if (part.startsWith("$")) return part;
    let p = part;
    p = p.replace(/;[ \t\r\n]*/g, ";\n");
    p = p.replace(/([^\n\*\_\>\s])\s*((?:\*\*|\*|<b>|<i>|<sub>|_)?\b[a-fA-F0-9]{1,2}[\)\.])\s*/g, "$1\n$2 ");
    p = p.replace(/<i>(.*?)<\/i>/gi, "*$1*");
    p = p.replace(/<b>(.*?)<\/b>/gi, "**$1**");
    p = p.replace(/<strong>(.*?)<\/strong>/gi, "**$1**");
    p = p.replace(/<br\s*\/?>/gi, "\n\n");
    p = p.replace(/<sub>(.*?)<\/sub>/gi, "$_{$1}$");
    p = p.replace(/<sup>(.*?)<\/sup>/gi, "$^{$1}$");
    p = p.replace(/\n{3,}/g, "\n\n");
    return p;
  }).join("");

  return formatted.trim();
};

const parseQuestionOptions = (q: ExamQuestion): ParsedOption[] => {
  const rawOpts = q.metadata?.options || (q as any).options;
  if (Array.isArray(rawOpts) && rawOpts.length > 0) {
    return rawOpts.map((opt: any, idx: number) => {
      const defaultKey = String.fromCharCode(65 + idx);
      if (typeof opt === "string") {
        const m = opt.match(/^([A-Fa-f])[\)\.\s]+(.*)/s);
        if (m) {
          return { key: m[1].toUpperCase(), text: m[2].trim() };
        }
        return { key: defaultKey, text: opt };
      }
      if (typeof opt === "object" && opt !== null) {
        const key = String(opt.key || opt.letter || opt.label || defaultKey).toUpperCase();
        const text = String(opt.text ?? opt.value ?? opt.label ?? opt.content ?? "");
        return { key, text };
      }
      return { key: defaultKey, text: String(opt) };
    });
  }

  if (rawOpts && typeof rawOpts === "object" && !Array.isArray(rawOpts)) {
    return Object.entries(rawOpts).map(([k, v]) => ({
      key: k.toUpperCase(),
      text: String(v)
    }));
  }

  const qType = (q.type || "").toLowerCase();
  if (qType === "true_false" || qType === "yes_no") {
    return [
      { key: "true", text: qType === "yes_no" ? "Ha" : "To'g'ri" },
      { key: "false", text: qType === "yes_no" ? "Yo'q" : "Yolg'on" }
    ];
  }

  if (qType === "multiple_choice" || qType === "single" || !qType) {
    return [
      { key: "A", text: "Variant A" },
      { key: "B", text: "Variant B" },
      { key: "C", text: "Variant C" },
      { key: "D", text: "Variant D" },
    ];
  }

  return [];
};

const getQuestionBlanks = (q: ExamQuestion): Array<{ key: string; label: string }> => {
  if (q.metadata?.blanks && Array.isArray(q.metadata.blanks) && q.metadata.blanks.length > 0) {
    return q.metadata.blanks.map((b: any, idx: number) => {
      const key = typeof b === "string" ? String.fromCharCode(97 + idx) : (b.key || String.fromCharCode(97 + idx));
      return { key, label: `${key.toUpperCase()})` };
    });
  }

  const text = q.question_text || "";
  const hasPartA = /a\)/i.test(text);
  const hasPartB = /b\)/i.test(text);

  if (hasPartA && hasPartB) {
    return [
      { key: "a", label: "A)" },
      { key: "b", label: "B)" }
    ];
  }

  return [{ key: "a", label: "Javob:" }];
};

export default function CenterExamSession() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [examData, setExamData] = useState<ExamStartData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [eliminatedOptions, setEliminatedOptions] = useState<Record<number, string[]>>({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [exitModalOpen, setExitModalOpen] = useState(false);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const timerRef = useRef<any>(null);
  const isAutoSubmitting = useRef(false);
  const storageKey = `center_exam_${assignmentId}_answers`;

  // 1. Start Exam Session on mount
  useEffect(() => {
    let isMounted = true;
    const startExam = async () => {
      try {
        const res = await fetch(`/api/myclass/test/${assignmentId}/start`, {
          method: "POST",
          credentials: "include"
        });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || "Imtihonni boshlashda xatolik yuz berdi");
        }

        if (isMounted) {
          setExamData(json);
          setSecondsLeft(json.allowed_seconds || 120 * 60);

          // Restore answers from localStorage if available
          try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
              const parsed = JSON.parse(saved);
              if (parsed && typeof parsed === "object") {
                setAnswers(parsed);
              }
            }
          } catch (e) {
            console.error("Failed to restore saved answers:", e);
          }

          setIsLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMessage(err.message);
          setIsLoading(false);
        }
      }
    };

    if (assignmentId) {
      startExam();
    }

    return () => {
      isMounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [assignmentId]);

  // 2. Countdown Timer & Auto-Submit
  useEffect(() => {
    if (!examData || secondsLeft <= 0 || submitResult) return;

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          if (!isAutoSubmitting.current) {
            isAutoSubmitting.current = true;
            handleAutoSubmit();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [examData, submitResult]);

  // 3. Save answers to localStorage on change
  useEffect(() => {
    if (Object.keys(answers).length > 0 && !submitResult) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(answers));
      } catch (e) {
        // ignore quota errors
      }
    }
  }, [answers, storageKey, submitResult]);

  // 4. Keyboard Shortcuts for Quick Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (confirmModalOpen || exitModalOpen || submitResult || !examData) return;
      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;

      if (e.key === "ArrowLeft") {
        setCurrentIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === "ArrowRight") {
        setCurrentIndex((prev) => Math.min((examData.questions || []).length - 1, prev + 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [confirmModalOpen, exitModalOpen, submitResult, examData]);

  const handleAutoSubmit = async () => {
    toast({
      title: "Vaqt tugadi!",
      description: "Imtihon vaqti yakunlandi, javoblaringiz avtomatik topshirilmoqda...",
      variant: "destructive"
    });
    await submitExam();
  };

  const handleSelectAnswer = (questionNum: number, choice: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionNum]: choice
    }));
  };

  const handleToggleMultiSelect = (questionNum: number, choice: string) => {
    setAnswers((prev) => {
      const current = prev[questionNum];
      let list: string[] = [];
      if (Array.isArray(current)) {
        list = [...current];
      } else if (typeof current === "string" && current.trim()) {
        list = current.split(",").map((s) => s.trim());
      }
      if (list.includes(choice)) {
        list = list.filter((item) => item !== choice);
      } else {
        list.push(choice);
      }
      return {
        ...prev,
        [questionNum]: list
      };
    });
  };

  const handleMatchingAnswer = (questionNum: number, leftKey: string, rightVal: string) => {
    setAnswers((prev) => {
      const current = typeof prev[questionNum] === "object" && prev[questionNum] !== null ? prev[questionNum] : {};
      return {
        ...prev,
        [questionNum]: {
          ...current,
          [leftKey]: rightVal
        }
      };
    });
  };

  const handleWrittenAnswer = (questionNum: number, partKey: string, val: string, isSingle: boolean) => {
    setAnswers((prev) => {
      if (isSingle) {
        return {
          ...prev,
          [questionNum]: val
        };
      }
      const current = typeof prev[questionNum] === "object" && prev[questionNum] !== null ? prev[questionNum] : {};
      return {
        ...prev,
        [questionNum]: {
          ...current,
          [partKey]: val
        }
      };
    });
  };

  const toggleEliminateOption = (questionNum: number, optKey: string) => {
    setEliminatedOptions((prev) => {
      const current = prev[questionNum] || [];
      if (current.includes(optKey)) {
        return { ...prev, [questionNum]: current.filter((k) => k !== optKey) };
      }
      return { ...prev, [questionNum]: [...current, optKey] };
    });
  };

  const clearAnswer = (questionNum: number) => {
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[questionNum];
      return next;
    });
  };

  const submitExam = async () => {
    if (!examData || isSubmitting) return;
    setIsSubmitting(true);
    setConfirmModalOpen(false);

    try {
      const res = await fetch(`/api/myclass/test/${assignmentId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          attempt_id: examData.attempt_id,
          answers
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Javoblarni yuborishda xatolik");

      setSubmitResult(json);
      if (timerRef.current) clearInterval(timerRef.current);
      try {
        localStorage.removeItem(storageKey);
      } catch (e) {}
    } catch (err: any) {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  // Error State
  if (errorMessage) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            Imtihonga kirish cheklangan
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed">{errorMessage}</p>
          <button
            onClick={() => navigate("/myclass")}
            className="w-full py-3.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm transition-all cursor-pointer"
          >
            Sinflar sahifasiga qaytish
          </button>
        </div>
      </div>
    );
  }

  // Loading State
  if (isLoading || !examData) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#E8192C] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-slate-500">Imtihon savollari yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  // Result Screen after submission
  if (submitResult) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-lg w-full bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-6 animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
            <Award className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              Test yakunlandi!
            </h2>
            <p className="text-sm text-slate-500 mt-1">{examData.test.title}</p>
          </div>

          {submitResult.released ? (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 font-medium">To'g'ri javoblar:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {submitResult.correct_answers} / {submitResult.total_questions}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 font-medium">Natija foizi:</span>
                  <span className="font-black text-2xl text-emerald-600 dark:text-emerald-400">
                    {submitResult.percentage}%
                  </span>
                </div>
              </div>

              {/* Questions Breakdown if available */}
              {Array.isArray(submitResult.breakdown) && submitResult.breakdown.length > 0 && (
                <div className="text-left space-y-2 max-h-64 overflow-y-auto pr-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Savollar tahlili:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {submitResult.breakdown.map((item) => (
                      <div
                        key={item.question_number}
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                          item.is_correct
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold"
                            : "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300 font-medium"
                        }`}
                      >
                        <span>{item.question_number}-savol</span>
                        <span className="text-[11px]">
                          {item.is_correct ? "✓ To'g'ri" : "✕ Noto'g'ri"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-left space-y-2">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
                <Lock className="w-4 h-4" />
                Natijalar kutilmoqda
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                {submitResult.message || "Markaz qoidalariga ko'ra natijalar barcha o'quvchilar imtihonni yakunlaganidan so'ng e'lon qilinadi."}
              </p>
            </div>
          )}

          <button
            onClick={() => navigate("/myclass")}
            className="w-full py-4 rounded-2xl bg-[#E8192C] hover:bg-red-600 text-white font-black text-sm shadow-lg shadow-red-500/25 transition-all cursor-pointer"
          >
            Mening sinflarimga qaytish
          </button>
        </div>
      </div>
    );
  }

  const questions = examData.questions || [];
  const currentQ = questions[currentIndex];
  const qNum = currentQ?.question_number || (currentIndex + 1);
  const currentAnswer = answers[qNum];

  const isQuestionAnswered = (num: number, q?: ExamQuestion) => {
    if (q && Array.isArray(q.sub_questions) && q.sub_questions.length > 0) {
      return q.sub_questions.every((sq) => {
        const sqNum = sq.question_number;
        const val = answers[sqNum];
        if (val === undefined || val === null || val === "") return false;
        if (Array.isArray(val)) return val.length > 0;
        if (typeof val === "object") return Object.keys(val).length > 0 && Object.values(val).some(v => Boolean(v));
        return true;
      });
    }
    const val = answers[num];
    if (val === undefined || val === null || val === "") return false;
    if (Array.isArray(val)) return val.length > 0;
    if (typeof val === "object") return Object.keys(val).length > 0 && Object.values(val).some(v => Boolean(v));
    return true;
  };

  const totalAnswerableCount = questions.reduce((acc, q) => acc + (q.sub_questions && q.sub_questions.length > 0 ? q.sub_questions.length : 1), 0);
  const answeredCount = Object.keys(answers).filter(k => {
    const val = answers[Number(k)];
    if (val === undefined || val === null || val === "") return false;
    if (Array.isArray(val)) return val.length > 0;
    if (typeof val === "object") return Object.keys(val).length > 0 && Object.values(val).some(v => Boolean(v));
    return true;
  }).length;
  const isTimeCritical = secondsLeft < 300; // less than 5 minutes

  const currentQAnswered = isQuestionAnswered(qNum, currentQ);
  const qType = (currentQ?.type || "multiple_choice").toLowerCase();
  const options = currentQ ? parseQuestionOptions(currentQ) : [];
  const eliminated = eliminatedOptions[qNum] || [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col justify-between select-none">
      <SEO title={`${examData.test.title} | EduContest`} description="Onlayn mock imtihon" />

      {/* Fixed Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 sm:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setExitModalOpen(true)}
            className="p-1.5 sm:p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="Chiqish"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xs sm:text-base font-black truncate max-w-[130px] sm:max-w-md">
              {examData.test.title}
            </h1>
            <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
              {currentIndex + 1} / {questions.length}-savol
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Theme Toggle */}
          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-1.5 sm:p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            title="Mavzuni almashtirish"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Countdown Timer */}
          <div className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl font-mono text-[11px] sm:text-sm font-bold border transition-colors ${
            isTimeCritical
              ? "bg-rose-500/10 border-rose-500/30 text-rose-600 animate-pulse"
              : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
          }`}>
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTimer(secondsLeft)}</span>
          </div>

          {/* Submit Button */}
          <button
            type="button"
            onClick={() => setConfirmModalOpen(true)}
            className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-[#E8192C] hover:bg-red-600 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden xs:inline sm:inline">Yakunlash</span>
          </button>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 sticky top-[49px] sm:top-[57px] z-30">
        <div
          className="h-full bg-[#E8192C] transition-all duration-300"
          style={{ width: `${Math.min(100, Math.round((answeredCount / (totalAnswerableCount || 1)) * 100))}%` }}
        />
      </div>

      {/* Main Examination Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-3 sm:p-6 flex flex-col justify-between gap-4 sm:gap-6">
        {currentQ ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            {/* Question Header & Points */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  {qNum}-savol
                </span>
                {currentQ.points_a && (
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                    {currentQ.points_a} ball
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {currentQAnswered && (
                  <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 stroke-[3]" /> Belgilandi
                  </span>
                )}
                {currentQAnswered && (
                  <button
                    type="button"
                    onClick={() => clearAnswer(qNum)}
                    className="text-[11px] font-semibold text-slate-400 hover:text-rose-500 px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                    title="Javobni o'chirish"
                  >
                    Tozalash
                  </button>
                )}
              </div>
            </div>

            {/* Reading Passage if attached */}
            {(currentQ.metadata?.passage_text || qType === "reading_passage") && (
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                  <BookOpen className="w-4 h-4 text-emerald-500" />
                  <span>Matnni o'qing va savolga javob bering:</span>
                </div>
                <div className="prose prose-slate dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-line select-text overflow-x-auto">
                  <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {normalizeMath(currentQ.metadata?.passage_text || currentQ.question_text || "")}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {/* Question Text */}
            {currentQ.question_text && qType !== "reading_passage" && (
              <div className="prose prose-slate dark:prose-invert max-w-none text-base sm:text-lg font-medium text-slate-900 dark:text-slate-100 leading-relaxed whitespace-pre-line select-text overflow-x-auto">
                <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {normalizeMath(currentQ.question_text)}
                </ReactMarkdown>
              </div>
            )}

            {/* Question Subtext */}
            {currentQ.question_subtext && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-600 dark:text-slate-300 italic prose dark:prose-invert max-w-none overflow-x-auto">
                <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {normalizeMath(currentQ.question_subtext)}
                </ReactMarkdown>
              </div>
            )}

            {/* Question Image if exists */}
            {(currentQ.question_image || currentQ.image_url) && (
              <div className="relative group rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-96 flex items-center justify-center bg-slate-50 dark:bg-slate-800 p-2">
                <img
                  src={rewriteStorageUrl(currentQ.question_image || currentQ.image_url)}
                  alt="Savol rasmi"
                  onClick={() => setPreviewImage(rewriteStorageUrl(currentQ.question_image || currentQ.image_url))}
                  className="max-h-80 object-contain w-auto rounded-xl cursor-zoom-in transition-transform hover:scale-[1.01]"
                />
                <button
                  type="button"
                  onClick={() => setPreviewImage(rewriteStorageUrl(currentQ.question_image || currentQ.image_url))}
                  className="absolute bottom-3 right-3 p-2 bg-slate-900/80 text-white rounded-xl text-xs flex items-center gap-1.5 opacity-80 hover:opacity-100 backdrop-blur-md cursor-pointer"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span>Kattalashtirish</span>
                </button>
              </div>
            )}

            {/* ANSWER INPUT SECTION BASED ON QUESTION TYPE */}

            {/* 1. Multiple Choice / Single Select */}
            {(qType === "multiple_choice" || qType === "single" || (!["multiple_select", "multi", "matching", "written", "fill_blanks", "short_answer", "numerical", "essay"].includes(qType) && options.length > 0)) && (
              <div className="space-y-3 pt-2">
                {options.map((opt) => {
                  const isSelected = Boolean(currentAnswer && String(currentAnswer).trim().toUpperCase() === opt.key.trim().toUpperCase());
                  const isEliminated = eliminated.includes(opt.key);

                  return (
                    <div
                      key={opt.key}
                      onClick={() => !isEliminated && handleSelectAnswer(qNum, opt.key)}
                      className={`group relative w-full text-left p-3.5 sm:p-4 rounded-2xl border-2 flex items-center gap-3 transition-all cursor-pointer ${
                        isEliminated
                          ? "border-slate-200/60 dark:border-slate-800/40 bg-slate-100/60 dark:bg-slate-900/40 opacity-50"
                          : isSelected
                          ? "border-[#E8192C] bg-red-500/[0.04] dark:bg-red-500/[0.08] shadow-xs"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
                      }`}
                    >
                      {/* Strike-through line when eliminated */}
                      {isEliminated && (
                        <div className="absolute inset-x-4 top-1/2 h-[2px] bg-rose-500/80 -translate-y-1/2 pointer-events-none rounded-full z-10" />
                      )}

                      <div className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 transition-all ${
                        isEliminated
                          ? "bg-slate-200 dark:bg-slate-800 text-slate-400"
                          : isSelected
                          ? "bg-[#E8192C] text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      }`}>
                        {opt.key}
                      </div>

                      <div className={`flex-1 text-sm font-medium ${
                        isEliminated
                          ? "text-slate-400 dark:text-slate-500"
                          : isSelected
                          ? "text-slate-900 dark:text-white font-semibold"
                          : "text-slate-700 dark:text-slate-200"
                      }`}>
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                          {normalizeMath(opt.text)}
                        </ReactMarkdown>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleEliminateOption(qNum, opt.key);
                        }}
                        className={`p-1.5 rounded-lg transition-all ml-auto shrink-0 z-20 ${
                          isEliminated
                            ? "bg-rose-100 dark:bg-rose-500/20 text-[#E8192C] opacity-100"
                            : "opacity-40 sm:opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                        title={isEliminated ? "Variantni qaytarish" : "Variantni o'chirish (chizib tashlash)"}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 2. Multiple Select (Multi Checkbox) */}
            {(qType === "multiple_select" || qType === "multi") && (
              <div className="space-y-3 pt-2">
                <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Bir nechta to'g'ri variantlarni tanlang:</span>
                </div>
                {options.map((opt) => {
                  const selectedList = Array.isArray(currentAnswer)
                    ? currentAnswer
                    : typeof currentAnswer === "string"
                    ? currentAnswer.split(",")
                    : [];
                  const isChecked = selectedList.includes(opt.key);

                  return (
                    <div
                      key={opt.key}
                      onClick={() => handleToggleMultiSelect(qNum, opt.key)}
                      className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border-2 flex items-center gap-3 transition-all cursor-pointer ${
                        isChecked
                          ? "border-[#E8192C] bg-red-500/[0.04] dark:bg-red-500/[0.08] shadow-xs"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 transition-all ${
                        isChecked
                          ? "bg-[#E8192C] text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      }`}>
                        {opt.key}
                      </div>

                      <div className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-200">
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                          {normalizeMath(opt.text)}
                        </ReactMarkdown>
                      </div>

                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                        isChecked ? "bg-[#E8192C] border-[#E8192C] text-white" : "border-slate-300 dark:border-slate-700"
                      }`}>
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 0. Sub-questions for reading passage / linked questions */}
            {currentQ.sub_questions && currentQ.sub_questions.length > 0 && (
              <div className="space-y-6 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <span>Matn bo'yicha savollar ({currentQ.sub_questions.length} ta):</span>
                  <span className="text-[11px] font-medium text-slate-400">Barchasiga javob bering</span>
                </div>

                <div className="space-y-6">
                  {currentQ.sub_questions.map((sq, sIdx) => {
                    const sqNum = sq.question_number || (sIdx + 1);
                    const sqAnswer = answers[sqNum];
                    const sqType = (sq.type || "multiple_choice").toLowerCase();
                    const sqOptions = parseQuestionOptions(sq);
                    const isSqAnswered = isQuestionAnswered(sqNum);

                    return (
                      <div
                        key={sq.id || sIdx}
                        className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-4 shadow-xs"
                      >
                        <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-700/60 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center shrink-0">
                              {sqNum}
                            </span>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              {sqNum}-savol
                            </span>
                            {sq.points_a && (
                              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full border border-amber-500/20">
                                {sq.points_a} ball
                              </span>
                            )}
                          </div>

                          {isSqAnswered && (
                            <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                              <Check className="w-3.5 h-3.5 stroke-[3]" /> Belgilandi
                            </span>
                          )}
                        </div>

                        {sq.question_text && (
                          <div className="prose prose-slate dark:prose-invert max-w-none text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line select-text">
                            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                              {normalizeMath(sq.question_text)}
                            </ReactMarkdown>
                          </div>
                        )}

                        {/* Multiple Choice for sub-question */}
                        {(sqType === "multiple_choice" || sqType === "single" || sqOptions.length > 0) && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {sqOptions.map((opt) => {
                              const isSelected = Boolean(sqAnswer && String(sqAnswer).trim().toUpperCase() === opt.key.trim().toUpperCase());
                              return (
                                <div
                                  key={opt.key}
                                  onClick={() => handleSelectAnswer(sqNum, opt.key)}
                                  className={`p-3 rounded-xl border-2 flex items-center gap-2.5 transition-all cursor-pointer ${
                                    isSelected
                                      ? "border-[#E8192C] bg-red-500/[0.04] dark:bg-red-500/[0.08]"
                                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900"
                                  }`}
                                >
                                  <div className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 ${
                                    isSelected ? "bg-[#E8192C] text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                                  }`}>
                                    {opt.key}
                                  </div>
                                  <div className="flex-1 text-xs font-medium text-slate-800 dark:text-slate-200">
                                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                      {normalizeMath(opt.text)}
                                    </ReactMarkdown>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Fill blanks for sub-question */}
                        {(sqType === "fill_blanks" || sqType === "written" || sqType === "short_answer") && (
                          <div className="space-y-2 pt-1">
                            <input
                              type="text"
                              value={typeof sqAnswer === "string" ? sqAnswer : ""}
                              onChange={(e) => handleSelectAnswer(sqNum, e.target.value)}
                              placeholder="Javobni kiriting..."
                              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-[#E8192C]"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. Matching (Moslashtirish) - Only when no sub_questions */}
            {(!currentQ.sub_questions || currentQ.sub_questions.length === 0) && qType === "matching" && (
              <div className="space-y-4 pt-2">
                {/* If options A, B, C, D are provided as pre-grouped variants */}
                {options.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Javob variantini tanlang:
                    </p>
                    {options.map((opt) => {
                      const isSelected = Boolean(currentAnswer && String(currentAnswer).trim().toUpperCase() === opt.key.trim().toUpperCase());
                      return (
                        <div
                          key={opt.key}
                          onClick={() => handleSelectAnswer(qNum, opt.key)}
                          className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border-2 flex items-center gap-3 transition-all cursor-pointer ${
                            isSelected
                              ? "border-[#E8192C] bg-red-500/[0.04] dark:bg-red-500/[0.08]"
                              : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 ${
                            isSelected ? "bg-[#E8192C] text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          }`}>
                            {opt.key}
                          </div>
                          <div className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-200">
                            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                              {normalizeMath(opt.text)}
                            </ReactMarkdown>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Interactive pair matching with Reference cards & buttons */
                  <div className="space-y-4">
                    {/* Right reference list if available */}
                    {((currentQ.metadata?.right && currentQ.metadata.right.length > 0) || (currentQ.metadata?.right_items && currentQ.metadata.right_items.length > 0)) && (
                      <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-800/40 space-y-2">
                        <div className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Moslashtirish uchun o'ng ustun variantlari:</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(currentQ.metadata?.right || currentQ.metadata?.right_items || []).map((rightText: string, rIdx: number) => {
                            const letter = String.fromCharCode(65 + rIdx);
                            return (
                              <div key={letter} className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/40 text-xs">
                                <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-black flex items-center justify-center shrink-0 text-[11px]">
                                  {letter}
                                </span>
                                <span className="text-slate-800 dark:text-slate-200 font-medium">
                                  {rightText}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Har bir topshiriq uchun to'g'ri variantni tanlang:
                    </div>

                    {/* Left items */}
                    {((currentQ.metadata?.left && currentQ.metadata.left.length > 0)
                      ? currentQ.metadata.left
                      : (currentQ.metadata?.left_items && currentQ.metadata.left_items.length > 0)
                      ? currentQ.metadata.left_items
                      : ["1-topshiriq", "2-topshiriq", "3-topshiriq", "4-topshiriq"]
                    ).map((leftItemText: string, lIdx: number) => {
                      const itemKey = String(lIdx + 1);
                      const curVal = (typeof currentAnswer === "object" && currentAnswer !== null) ? (currentAnswer[itemKey] || "") : "";
                      const rightCount = (currentQ.metadata?.right?.length || currentQ.metadata?.right_items?.length || 6);
                      const availableLetters = Array.from({ length: Math.max(4, Math.min(8, rightCount)) }, (_, i) => String.fromCharCode(65 + i));

                      return (
                        <div
                          key={itemKey}
                          className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-black text-xs flex items-center justify-center shrink-0">
                                {itemKey}
                              </span>
                              <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                                {leftItemText}
                              </span>
                            </div>
                            {curVal && (
                              <span className="text-xs font-bold text-[#E8192C] bg-red-50 dark:bg-red-950/30 px-2.5 py-0.5 rounded-full border border-red-200 dark:border-red-900/30">
                                Tanlandi: {curVal}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 flex-wrap pt-1">
                            {availableLetters.map((letter) => {
                              const isSelected = curVal === letter;
                              return (
                                <button
                                  key={letter}
                                  type="button"
                                  onClick={() => handleMatchingAnswer(qNum, itemKey, letter)}
                                  className={`w-10 h-10 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center ${
                                    isSelected
                                      ? "bg-[#E8192C] text-white shadow-md shadow-red-500/25 scale-105"
                                      : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400 hover:bg-slate-50"
                                  }`}
                                >
                                  {letter}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 4. Written / Fill in blanks / Short Answer / Numerical - Only when no sub_questions */}
            {(!currentQ.sub_questions || currentQ.sub_questions.length === 0) && (qType === "written" || qType === "fill_blanks" || qType === "short_answer" || qType === "numerical" || (options.length === 0 && qType !== "essay" && qType !== "matching")) && (
              <div className="space-y-4 pt-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Javobingizni kiriting:</span>
                  <span className="text-[11px] font-normal text-slate-400">Aniq va xatosiz yozing</span>
                </div>

                {getQuestionBlanks(currentQ).map((blank, bIdx, arr) => {
                  const isSingle = arr.length === 1;
                  const val = isSingle
                    ? (typeof currentAnswer === "string" ? currentAnswer : "")
                    : ((typeof currentAnswer === "object" && currentAnswer !== null ? currentAnswer[blank.key] : "") || "");

                  return (
                    <div key={blank.key} className="space-y-2">
                      {!isSingle && (
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[11px] font-black">
                            {blank.label}
                          </span>
                          <span>qism javobi:</span>
                        </label>
                      )}
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => handleWrittenAnswer(qNum, blank.key, e.target.value, isSingle)}
                        placeholder="Javobni kiriting (masalan: 12.5 yoki x^2)..."
                        className="w-full px-4 py-3.5 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 font-medium text-sm focus:outline-none focus:border-[#E8192C] focus:ring-4 focus:ring-red-500/10 transition-all"
                      />
                    </div>
                  );
                })}

                {/* Math symbols helper bar */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[11px] text-slate-400 font-medium mr-1">Belgilar:</span>
                  {["²", "³", "√", "π", "/", "±", "°", "(", ")"].map((symbol) => (
                    <button
                      key={symbol}
                      type="button"
                      onClick={() => {
                        const blanks = getQuestionBlanks(currentQ);
                        const targetKey = blanks[0].key;
                        const isSingle = blanks.length === 1;
                        const cur = isSingle
                          ? (typeof currentAnswer === "string" ? currentAnswer : "")
                          : ((typeof currentAnswer === "object" && currentAnswer !== null ? currentAnswer[targetKey] : "") || "");
                        handleWrittenAnswer(qNum, targetKey, cur + symbol, isSingle);
                      }}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      {symbol}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 5. Essay / Writing - Only when no sub_questions */}
            {(!currentQ.sub_questions || currentQ.sub_questions.length === 0) && qType === "essay" && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <span>Insho / Yozma topshiriq matni:</span>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Avtomatik saqlanmoqda
                    </span>
                    <span>{typeof currentAnswer === "string" ? currentAnswer.trim().split(/\s+/).filter(Boolean).length : 0} ta so'z</span>
                  </div>
                </div>
                <textarea
                  rows={10}
                  value={typeof currentAnswer === "string" ? currentAnswer : ""}
                  onChange={(e) => handleSelectAnswer(qNum, e.target.value)}
                  placeholder="Inshoni shu yerga yozing..."
                  className="w-full p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm leading-relaxed focus:outline-none focus:border-[#E8192C] focus:ring-4 focus:ring-red-500/10 transition-all font-serif"
                />
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-700 dark:text-amber-300 flex items-center gap-2">
                  <Info className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>Ushbu ochiq yozma savol imtihon yakunlangach o'qituvchi tomonidan qo'lda tekshiriladi va baholanadi.</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            Savol topilmadi
          </div>
        )}

        {/* Navigation Bar between questions */}
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <button
            type="button"
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-2xl border border-slate-200 dark:border-slate-800 disabled:opacity-40 text-xs font-bold flex items-center gap-1.5 sm:gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer shrink-0"
          >
            <ChevronLeft className="w-4 h-4" /> <span className="hidden xs:inline sm:inline">Oldingi</span>
          </button>

          <span className="text-[11px] sm:text-xs text-slate-400 font-medium text-center truncate">
            <strong className="text-slate-900 dark:text-white">{answeredCount}</strong> / {questions.length} belgilandi
          </span>

          <button
            type="button"
            onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
            disabled={currentIndex === questions.length - 1}
            className="px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 disabled:opacity-40 text-white dark:text-slate-900 text-xs font-bold flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer shrink-0"
          >
            <span className="hidden xs:inline sm:inline">Keyingi</span> <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Question Selector Dots/Grid */}
        <div className="p-3.5 sm:p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Barcha savollar ({questions.length}):
            </p>
            <div className="flex items-center gap-3 text-[10px] font-semibold text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Belgilangan
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full border border-slate-400" /> Qolgan
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-1 max-h-40 sm:max-h-56 overflow-y-auto pr-1">
            {questions.map((q, idx) => {
              const num = q.question_number || (idx + 1);
              const isAns = isQuestionAnswered(num);
              const isCur = idx === currentIndex;

              return (
                <button
                  key={q.id || idx}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                    isCur
                      ? "ring-2 ring-[#E8192C] font-black scale-105"
                      : ""
                  } ${
                    isAns
                      ? "bg-emerald-500 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {num}
                </button>
              );
            })}
          </div>
        </div>
      </main>

      {/* Confirmation Submit Modal */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Imtihonni yakunlamoqchimisiz?
              </h3>
              <p className="text-xs text-slate-500">
                Siz <strong>{answeredCount}</strong> ta savolga javob berdingiz (Jami: {questions.length} ta).
                {answeredCount < questions.length && (
                  <span className="block text-rose-500 font-bold mt-1">
                    Hali {questions.length - answeredCount} ta savol javobsiz qoldi!
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                className="flex-1 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Davom etish
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={submitExam}
                className="flex-1 py-3.5 rounded-2xl bg-[#E8192C] hover:bg-red-600 text-white font-black text-xs shadow-lg shadow-red-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ha, topshirish"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Exam Modal */}
      {exitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto">
                <Info className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Imtihondan chiqmoqchimisiz?
              </h3>
              <p className="text-xs text-slate-500">
                Sizning belgilagan javoblaringiz brauzerda avtomatik saqlangan. Vaqt tugashidan oldin qayta kirib davom ettirishingiz mumkin.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setExitModalOpen(false)}
                className="flex-1 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Imtihonda qolish
              </button>
              <button
                type="button"
                onClick={() => navigate("/myclass")}
                className="flex-1 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-black text-xs cursor-pointer transition-all"
              >
                Chiqish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl overflow-hidden p-2 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/60 text-white hover:bg-slate-900 cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewImage}
              alt="Kattalashtirilgan rasm"
              className="max-h-[85vh] w-auto mx-auto object-contain rounded-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
