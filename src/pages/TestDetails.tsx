import { useState, useCallback, useRef, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Share2, Star, Users, MessageSquare, BookOpen, Globe, Clock, AlertTriangle, Target, Zap, ArrowRight, Hash, Send, Play, FileText, TrendingUp, Award, GraduationCap, CheckCircle, Brain, BarChart3 } from "lucide-react";
import { PaymentModal } from "@/components/PaymentModal";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { TestsActiveBlock } from "./TestsActiveBlock";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import SEO from "@/components/SEO";
import StructuredData, { QuizSchema, FAQSchema, BreadcrumbSchema } from "@/components/seo/StructuredData";
import FAQSection from "@/components/seo/FAQSection";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import EducationalContent from "@/components/seo/EducationalContent";
import RelatedTopics from "@/components/seo/RelatedTopics";

import { useEduCoin } from "@/hooks/useEduCoin";
import { slugify } from "@/lib/utils";
import { TargetIcon } from "@solar-icons/react/bold-duotone/target";
import { BoltIcon } from "@solar-icons/react/bold-duotone/bolt";
import { BookBookmarkIcon } from "@solar-icons/react/bold-duotone/book-bookmark";
import { ClockCircleIcon } from "@solar-icons/react/bold-duotone/clock-circle";
import { CompassBigIcon } from "@solar-icons/react/bold-duotone/compass-big";
import { GraphNewUpIcon } from "@solar-icons/react/bold-duotone/graph-new-up";
import { ChatSquareCodeIcon } from "@solar-icons/react/bold-duotone/chat-square-code";
import { DiplomaIcon } from "@solar-icons/react/bold-duotone/diploma";
import { DocumentTextIcon } from "@solar-icons/react/bold-duotone/document-text";
import { GlobalIcon } from "@solar-icons/react/bold-duotone/global";
import { AltArrowRightIcon } from "@solar-icons/react/bold-duotone/alt-arrow-right";

const TestDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { profile, user, refreshProfile } = useAuth();
  const { balance: eduBalance, spendCoin } = useEduCoin();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  const [activeSession, setActiveSession] = useState<any>(null);
  const [activeFolder, setActiveFolder] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<{ correct: number; wrong: number; total: number } | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<"all" | "correct" | "wrong">("all");
  const [submitting, setSubmitting] = useState(false);
  const [feedbackVideo, setFeedbackVideo] = useState<"correct" | "incorrect" | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [isAiPinned, setIsAiPinned] = useState(false);
  const [aiExplanation, setAiExplanation] = useState("");
  const [isExplaining, setIsExplaining] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportQuestionId, setReportQuestionId] = useState<string | null>(null);
  const [reportMessage, setReportMessage] = useState("");
  const [isReporting, setIsReporting] = useState(false);
  const [checkedQuestions, setCheckedQuestions] = useState<Set<string>>(new Set());
  const [correctAttempts, setCorrectAttempts] = useState<Record<string, number>>({});
  const [questionAttempts, setQuestionAttempts] = useState<Record<string, number>>({});
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; message: string }>({ isOpen: false, message: "" });
  const [modeModalOpen, setModeModalOpen] = useState(false);
  const [showStudyView, setShowStudyView] = useState(false);
  const [studyContent, setStudyContent] = useState("");
  const [isStudyLoading, setIsStudyLoading] = useState(false);
  const [studyQuestions, setStudyQuestions] = useState<any[]>([]);
  const [studyCurrentQ, setStudyCurrentQ] = useState(0);
  const [studyInput, setStudyInput] = useState("");

  const handleSubmitRef = useRef<() => void>(() => {});

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const { data: folder, isLoading } = useQuery<any>({
    queryKey: ["test-folder", id],
    queryFn: async () => {
      if (!id) return null;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(id)) {
        const { data, error } = await supabase.from("test_folders").select("*").eq("id", id).maybeSingle();
        if (data) return data;
      }

      // Targeted name match first to avoid downloading all folders
      const normalizedSearch = id.replace(/-/g, ' ');
      const { data: matchedByName } = await supabase.from("test_folders").select("*").ilike("name", normalizedSearch).maybeSingle();
      if (matchedByName) return matchedByName;

      const { data: allFolders, error: allErr } = await supabase.from("test_folders").select("*").limit(200);
      if (allErr) throw allErr;
      return (allFolders as any[])?.find((f: any) => slugify(f.name) === id || f.id === id) || null;
    },
  });

  const rawMode = searchParams.get("mode");
  const isAttestatsiyaOrPedagogik = folder?.category === "attestatsiya" || folder?.category === "pedagogik";
  const mode = (isAttestatsiyaOrPedagogik && rawMode === "organish")
    ? "mashq"
    : (rawMode || "imtixon");
  const testMode: "imtixon" | "mashq" | null = mode === "organish" ? null : (mode as "imtixon" | "mashq");

  const { data: realQuestionCount } = useQuery({
    queryKey: ["question-count", folder?.id],
    queryFn: async () => {
      if (!folder?.id) return 0;
      const { count } = await supabase
        .from("questions")
        .select("*", { count: "exact", head: true })
        .eq("folder_id", folder.id);
      return count || 0;
    },
    enabled: !!folder?.id,
  });

  const { data: alreadyPurchased } = useQuery({
    queryKey: ["is-purchased", folder?.id, user?.id],
    queryFn: async () => {
      if (!user || !folder?.id) return false;
      const { data } = await (supabase.from("test_purchases" as any) as any).select("id").eq("folder_id", folder.id).eq("user_id", user.id).limit(1);
      return (data?.length || 0) > 0;
    },
    enabled: !!user && !!folder?.id,
  });

  const handleSubmit = useCallback(async () => {
    if (submitting || !activeSession) return;
    if (!user) {
      toast({ title: "Tizimga kiring", description: "Natijalarni saqlash uchun avval tizimga kiring.", variant: "destructive" });
      navigate("/auth");
      return;
    }
    setSubmitting(true);
    try {
      let correct = 0; let wrong = 0;
      const answerRows = questions.map((q) => {
        const selected = answers[q.id] ?? null;
        const isCorrect = selected === q.correct_option;
        if (selected !== null) { if (isCorrect) correct++; else wrong++; } else { wrong++; }
        return { session_id: activeSession.id, question_id: q.id, selected_option: selected, is_correct: isCorrect };
      });
      await (supabase.from("test_answers" as any) as any).insert(answerRows as any);
      const score = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
      await (supabase.from("test_sessions" as any) as any).update({ finished_at: new Date().toISOString(), correct_answers: correct, wrong_answers: wrong, score } as any).eq("id", activeSession.id);
      setResults({ correct, wrong, total: questions.length });
      setShowResults(true);
      if (folder) {
        const storageKey = `active_test_session_${folder.id}_${testMode || "default"}`;
        localStorage.removeItem(storageKey);
      }
      qc.invalidateQueries({ queryKey: ["sessions-count"] });
      qc.invalidateQueries({ queryKey: ["avg-score"] });
    } catch (err: any) { toast({ title: "Xatolik", description: err.message, variant: "destructive" }); }
    finally { setSubmitting(false); }
  }, [submitting, activeSession, questions, answers, qc, toast, user, navigate, folder, testMode]);

  handleSubmitRef.current = handleSubmit;

  useEffect(() => {
    if (!activeSession || showResults) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(timer); handleSubmitRef.current(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeSession, showResults]);

  const handleStart = async () => {
    if (!folder) return;
    if (!rawMode) {
      setModeModalOpen(true);
      return;
    }

    const storageKey = `active_test_session_${folder.id}_${testMode || "default"}`;
    const savedSessionStr = localStorage.getItem(storageKey);

    if (savedSessionStr) {
      try {
        const savedData = JSON.parse(savedSessionStr);
        if (savedData && savedData.questions && savedData.questions.length > 0) {
          setActiveSession(savedData.activeSession);
          setActiveFolder(folder);
          setQuestions(savedData.questions);
          setAnswers(savedData.answers || {});
          setCheckedQuestions(new Set(savedData.checkedQuestions || []));
          setCorrectAttempts(savedData.correctAttempts || {});
          setQuestionAttempts(savedData.questionAttempts || {});
          setTimeLeft(savedData.timeLeft ?? (folder.duration_minutes * 60));

          const qParam = searchParams.get("q");
          const restoredQ = qParam
            ? Math.min(Math.max(0, parseInt(qParam, 10) - 1), savedData.questions.length - 1)
            : (savedData.currentQ || 0);
          setCurrentQ(restoredQ);
          setShowResults(false);
          setResults(null);
          return;
        }
      } catch (e) {
        console.error("Failed to restore test session:", e);
      }
    }

    const testPrice = folder?.price || 0;
    const isFree = testPrice <= 0;
    let isPurchased = alreadyPurchased;
    if (isPurchased === undefined && user && folder?.id) {
      const { data: pCheck } = await supabase.from("test_purchases" as any).select("id").eq("folder_id", folder.id).eq("user_id", user.id).limit(1);
      isPurchased = (pCheck?.length || 0) > 0;
    }

    const hasPaidAccess = isFree || isPurchased || profile?.is_lifetime;

    if (!hasPaidAccess) {
      setIsPaymentOpen(true);
      return;
    }

    try {
      const { data, error: qErr } = await supabase.from("questions" as any).select("*").eq("folder_id", folder.id);
      if (qErr) throw qErr;
      if (!data || (data as any[]).length === 0) {
        toast({ title: "Savollar topilmadi", variant: "destructive" });
        return;
      }

      let filteredQuestions = [...(data as any[])];
      filteredQuestions.sort(() => Math.random() - 0.5);

      let sessionData = null;
      if (user && profile) {
        const { data: session, error: sesErr } = await (supabase.from("test_sessions" as any) as any).insert({
          user_id: user.id, folder_id: folder.id, category: folder.category, total_questions: filteredQuestions.length
        } as any).select().single();
        if (sesErr) throw sesErr;
        sessionData = session;
      } else {
        sessionData = { id: crypto.randomUUID(), folder_id: folder.id };
      }

      const qParam = searchParams.get("q");
      const targetQ = qParam ? Math.min(Math.max(0, parseInt(qParam, 10) - 1), filteredQuestions.length - 1) : 0;

      setActiveSession(sessionData);
      setActiveFolder(folder);
      setQuestions(filteredQuestions);
      setCurrentQ(targetQ);
      setAnswers({});
      setCheckedQuestions(new Set());
      setCorrectAttempts({});
      setQuestionAttempts({});
      setTimeLeft(folder.duration_minutes * 60);
      setShowResults(false);
      setResults(null);
    } catch (err: any) {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    }
  };

  const exitTest = () => {
    if (folder) {
      const storageKey = `active_test_session_${folder.id}_${testMode || "default"}`;
      localStorage.removeItem(storageKey);
    }
    setActiveSession(null);
    setActiveFolder(null);
    setQuestions([]);
    setShowResults(false);
    setResults(null);
    setFeedbackVideo(null);
    navigate("/tests", { replace: true });
  };

  // Auto-start test session if testMode is in URL and session not initialized
  useEffect(() => {
    if (folder && testMode && !activeSession && !showResults) {
      void handleStart();
    }
  }, [folder, testMode, activeSession, showResults]);

  // Auto-save active test session to localStorage for F5 page reload resilience
  useEffect(() => {
    if (activeSession && folder && questions.length > 0 && !showResults) {
      const storageKey = `active_test_session_${folder.id}_${testMode || "default"}`;
      const payload = {
        activeSession,
        questions,
        answers,
        checkedQuestions: Array.from(checkedQuestions),
        correctAttempts,
        questionAttempts,
        currentQ,
        timeLeft,
      };
      localStorage.setItem(storageKey, JSON.stringify(payload));
    }
  }, [activeSession, folder, questions, answers, checkedQuestions, correctAttempts, questionAttempts, currentQ, timeLeft, showResults, testMode]);

  const handleStartStudy = async () => {
    if (!folder) return;
    setShowStudyView(true);
    setIsStudyLoading(true);
    setStudyContent("");
    try {
      const { data } = await supabase.from("questions" as any).select("*").eq("folder_id", folder.id);
      const qs = (data as any[]) || [];
      setStudyQuestions(qs);
      setStudyCurrentQ(0);
      if (qs.length > 0) {
        const prompt = `"${folder.name}" mavzusiga tegishli asosiy tushunchalar, qoidalar va formulalarni qisqa va tushunarli tarzda o'zbek tilida tushuntirib bering. Mavzu: ${folder.subject || "Umumiy"}. Savollar soni: ${qs.length}`;
        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model: "mistral-tiny", messages: [{ role: "system", content: "Siz Eduly AI o'qituvchi yordamchisisiz. O'zbek tilida javob bering. Markdown format ishlating." }, { role: "user", content: prompt }] }),
        });
        const result = await response.json();
        if (result.choices?.[0]) setStudyContent(result.choices[0].message.content);
        else setStudyContent("Ma'lumot tayyorlanmoqda...");
      }
    } catch {
      setStudyContent("Xatolik yuz berdi.");
    } finally {
      setIsStudyLoading(false);
    }
  };

  const handleStudyQuestion = async (message: string) => {
    if (!message.trim() || studyQuestions.length === 0) return;
    setIsStudyLoading(true);
    try {
      const q = studyQuestions[studyCurrentQ];
      const prompt = `Savol: ${q.question_text}\nVariantlar: ${getOptionsTexts(q.options).join(", ")}\n\nFoydalanuvchi savoli: ${message}\n\nJavobni o'zbek tilida qisqa va tushunarli bering.`;
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "mistral-tiny", messages: [{ role: "system", content: "Siz Eduly AI o'qituvchi yordamchisisiz." }, { role: "user", content: prompt }] }),
      });
      const data = await response.json();
      if (data.choices?.[0]) setStudyContent((prev) => prev + "\n\n---\n\n" + data.choices[0].message.content);
    } catch {
      setStudyContent((prev) => prev + "\n\nXatolik yuz berdi.");
    } finally {
      setIsStudyLoading(false);
    }
  };

  const explainQuestion = async () => {
    const q = questions[currentQ];
    if (!q) return;
    setAiOpen(true);
    if (aiExplanation && aiExplanation.includes(q.question_text)) return;

    if (eduBalance < 1) {
      toast({
        variant: "destructive",
        title: "EduCoin yetarli emas",
        description: "AI Tahlildan foydalanish uchun balansingizda kamida 1 EduCoin bo'lishi kerak.",
      });
      setAiExplanation("⚠️ **AI Tahlildan foydalanish uchun 1 EduCoin kerak.**\n\nBalansingizda EduCoin etarli emas. Kunlik mukofotlar yoki topshiriqlarni bajarib EduCoin to'plashingiz mumkin!");
      return;
    }

    // Deduct 1 EduCoin
    await spendCoin(1, "ai_tahlil", `Savol #${currentQ + 1} AI Tahlili uchun`);

    setIsExplaining(true);
    setAiExplanation("");
    try {
      const options = getOptionsTexts(q.options);
      const correctText = typeof q.correct_option === "number" && options[q.correct_option] ? options[q.correct_option] : "";
      const selectedIndex = answers[q.id];
      const userSelectedText = typeof selectedIndex === "number" && options[selectedIndex] ? `${String.fromCharCode(65 + selectedIndex)}) ${options[selectedIndex]}` : "";

      const textPrompt = `Savol: ${q.question_text}
Variantlar:
${options.map((o: string, i: number) => `${String.fromCharCode(65 + i)}) ${o}`).join("\n")}
${correctText ? `To'g'ri javob: ${String.fromCharCode(65 + q.correct_option)}) ${correctText}` : ""}
${userSelectedText ? `Foydalanuvchi tanlagan (NOTO'G'RI) javob: ${userSelectedText}` : ""}

TALAB:
1. Kirish yoki ortiqcha matnlarsiz darhol step-by-step (1-Qadam, 2-Qadam...) qilib yozing.
2. ${userSelectedText ? `Ayniqsa, foydalanuvchi tanlagan ${userSelectedText} javob nega noto'g'ri ekanligini va qayerda xatolik ketganini aniq ko'rsating.` : ""}
3. Matematik hisoblarni 100% to'g'ri bajaring.
Format:
**1-Qadam:** [Amal va formula]
**2-Qadam:** [Hisoblash va foydalanuvchi xatosining sababi]
**Natija:** To'g'ri variant ${String.fromCharCode(65 + q.correct_option)}) ${correctText}`;

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "mistral-large-latest",
          messages: [
            {
              role: "system",
              content: "Siz o'ta qisqa va londa step-by-step tahlil beruvchi o'qituvchisiz. Ortqicha so'z, kirish va xulosa taqiqlanadi. Faqat 1-Qadam, 2-Qadam va Natija ko'rsatiladi."
            },
            { role: "user", content: textPrompt }
          ],
        }),
      });
      const data = await response.json();
      if (data.choices?.[0]) setAiExplanation(data.choices[0].message.content);
    } catch (err) { setAiExplanation("Xatolik yuz berdi. Qayta urinib ko'ring."); }
    finally { setIsExplaining(false); }
  };

  const askAiQuestion = async (message: string) => {
    const q = questions[currentQ];
    if (!q) return;
    if (!message.trim()) return;
    setAiOpen(true);
    setIsExplaining(true);
    try {
      const options = getOptionsTexts(q.options);
      const correctText = typeof q.correct_option === "number" && options[q.correct_option] ? options[q.correct_option] : "";
      const textPrompt = `Savol: ${q.question_text}
Foydalanuvchi savoli: ${message}
${correctText ? `To'g'ri javob: ${String.fromCharCode(65 + q.correct_option)}) ${correctText}` : ""}

Javobni o'ta qisqa va step-by-step formatda bering. Ortqicha gap yozmang.`;

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "mistral-large-latest",
          messages: [
            { role: "system", content: "Siz o'ta qisqa va londa javob beruvchi o'qituvchisisiz." },
            { role: "user", content: textPrompt }
          ],
        }),
      });
      const data = await response.json();
      if (data.choices?.[0]) setAiExplanation(data.choices[0].message.content);
    } catch (err) { setAiExplanation("Xatolik yuz berdi."); }
    finally { setIsExplaining(false); }
  };

  const getWrongAnswerHints = async (question: any, selectedOption: number): Promise<string[]> => {
    return ["Savoldagi shartlarni qayta o'qing.", "Har bir javob variantini tekshiring.", "To'g'ri javobni aniqlash uchun formulalarni qo'llang."];
  };

  const playFeedback = (isCorrect: boolean) => setFeedbackVideo(isCorrect ? "correct" : "incorrect");

  const submitReport = async () => {
    if (!user || !reportMessage.trim() || !reportQuestionId) return;
    setIsReporting(true);
    try {
      const { error } = await (supabase.from("complaints" as any) as any).insert({ question_id: reportQuestionId, user_id: user.id, message: reportMessage.trim(), status: 'pending' } as any);
      if (error) throw error;
      toast({ title: "Xabar yuborildi", description: "Rahmat!" });
      setReportOpen(false);
      setReportMessage("");
    } catch (err: any) { toast({ title: "Xatolik", description: err.message, variant: "destructive" }); }
    finally { setIsReporting(false); }
  };

  const normalizeMathDelimiters = (text: any) => {
    if (!text) return "";
    let str = text.toString();
    str = str.replace(/\\\\([a-zA-Z]+)/g, "\\$1");
    return str.replace(/\\\(/g, "$").replace(/\\\)/g, "$").replace(/\\\[/g, "$$").replace(/\\\]/g, "$$");
  };

  // options JSONB formatdan text olish: [{option_text: "..."}] yoki ["string"]
  const getOptionText = (opt: any): string => {
    if (typeof opt === "string") return opt;
    if (opt && typeof opt === "object") return opt.option_text || opt.text || String(opt);
    return String(opt || "");
  };

  const getOptionsTexts = (options: any): string[] => {
    if (!options || !Array.isArray(options)) return [];
    return options.map(getOptionText);
  };

  if (showStudyView && mode === "organish") {
    const studyQ = studyQuestions[studyCurrentQ];
    const progress = studyQuestions.length > 0 ? Math.round(((studyCurrentQ + 1) / studyQuestions.length) * 100) : 0;

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <SEO
          title={folder.meta_title || `${folder.name} — ${folder.subject || "Umumiy"} o'rganish`}
          description={folder.meta_description || `${folder.subject} fanidan "${folder.name}" mavzusini o'rganing. AI yordamchi bilan batafsil tushuntirishlar.`}
          canonical={`https://educontest.uz/tests/folder/${id}?mode=organish`}
          keywords={`${folder.name} o'rganish, ${folder.subject} dars, ${folder.name} tushuntirish, educontest AI`}
        />

        <Breadcrumbs items={[
          { label: 'Testlar', href: '/tests' },
          ...(folder.subject ? [{ label: folder.subject, href: `/tests/${encodeURIComponent(folder.subject.toLowerCase())}` }] : []),
          { label: folder.name, href: `/tests/folder/${id}` },
          { label: "O'rganish", isCurrent: true }
        ]} />

        {/* Creative Study Hero Header */}
        <div className="relative overflow-hidden rounded-2xl mb-6 p-6 sm:p-8" style={{ background: 'linear-gradient(135deg, #E8192C 0%, #b9151f 50%, #8b1017 100%)' }}>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="absolute top-1/2 left-1/2 w-20 h-20 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 opacity-30" />
          </div>

          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <button onClick={() => { setShowStudyView(false); setStudyContent(""); }} className="flex items-center gap-1 text-white/70 hover:text-white transition-colors text-[12px]">
                  <ChevronLeft className="w-4 h-4" /> Orqaga
                </button>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight">{folder.name}</h1>
              <p className="text-white/70 text-[13px]">{folder.subject || "Umumiy"} • {studyQuestions.length} ta savol • AI bilan o'rganing</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="relative w-16 h-16">
                  <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="4" />
                    <circle cx="32" cy="32" r="28" fill="none" stroke="white" strokeWidth="4" strokeDasharray={`${progress * 1.76} 176`} strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-white text-[13px] font-bold">{progress}%</span>
                </div>
                <p className="text-white/60 text-[10px] mt-1">Jarayon</p>
              </div>
              <button
                onClick={handleStart}
                className="px-5 py-2.5 rounded-xl bg-white text-[#E8192C] text-[13px] font-semibold hover:bg-white/90 transition-all active:scale-95 shadow-lg"
              >
                Testga o'tish →
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 items-start">
          {/* Left: AI Content + Current Question */}
          <div className="space-y-5">
            {/* AI Content Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#E8192C] to-[#b9151f] flex items-center justify-center">
                    <Brain className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-300">EduAI Qo'llanma</span>
                </div>
                {isStudyLoading && (
                  <span className="flex items-center gap-1.5 text-[11px] text-[#E8192C]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E8192C] animate-pulse" />
                    Tahlil qilmoqda...
                  </span>
                )}
              </div>
              <div className="min-h-[320px] max-h-[55vh] overflow-y-auto p-5">
                {!studyContent && !isStudyLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#E8192C]/10 to-[#E8192C]/5 flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-[#E8192C]" />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-[14px] font-semibold text-slate-700 dark:text-slate-300">Mavzuni o'rganishni boshlang</p>
                      <p className="text-[12px] text-slate-400">AI sizga mavzu bo'yicha batafsil ma'lumot beradi</p>
                    </div>
                    <button
                      onClick={handleStartStudy}
                      className="px-4 py-2 rounded-xl bg-[#E8192C] text-white text-[12px] font-medium hover:opacity-90 transition-all"
                    >
                      O'rganishni boshlash
                    </button>
                  </div>
                ) : isStudyLoading && !studyContent.includes('---') ? (
                  <div className="space-y-3">
                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg w-3/4 animate-pulse" />
                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg w-full animate-pulse" />
                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg w-5/6 animate-pulse" />
                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg w-2/3 animate-pulse" />
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none dark:prose-invert
                    [&_h1]:text-[18px] [&_h1]:font-semibold [&_h1]:text-slate-900 [&_h1]:dark:text-white [&_h1]:mt-6 [&_h1]:mb-3 [&_h1]:pb-2 [&_h1]:border-b [&_h1]:border-slate-100 [&_h1]:dark:border-slate-800
                    [&_h2]:text-[16px] [&_h2]:font-semibold [&_h2]:text-slate-900 [&_h2]:dark:text-white [&_h2]:mt-5 [&_h2]:mb-2
                    [&_h3]:text-[14px] [&_h3]:font-semibold [&_h3]:text-slate-800 [&_h3]:dark:text-slate-200 [&_h3]:mt-4 [&_h3]:mb-2
                    [&_p]:text-[13px] [&_p]:text-slate-600 [&_p]:dark:text-slate-400 [&_p]:leading-relaxed [&_p]:mb-2
                    [&_strong]:text-slate-900 [&_strong]:dark:text-white [&_strong]:font-semibold
                    [&_li]:text-[13px] [&_li]:text-slate-600 [&_li]:dark:text-slate-400 [&_li]:leading-relaxed
                    [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:mb-3
                    [&_ol]:list-decimal [&_ol]:ml-5 [&_ol]:mb-3
                    [&_hr]:my-4 [&_hr]:border-slate-100 [&_hr]:dark:border-slate-800
                    [&_code]:text-[12px] [&_code]:bg-slate-100 [&_code]:dark:bg-slate-800 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-[#E8192C]
                    [&_pre]:bg-slate-50 [&_pre]:dark:bg-slate-800/50 [&_pre]:border [&_pre]:border-slate-200 [&_pre]:dark:border-slate-700 [&_pre]:rounded-xl [&_pre]:p-4 [&_pre]:overflow-x-auto
                    [&_blockquote]:border-l-3 [&_blockquote]:border-[#E8192C] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-500">
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {normalizeMathDelimiters(studyContent)}
                    </ReactMarkdown>
                  </div>
                )}
              </div>

              {/* AI Input */}
              <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
                <div className="flex items-center gap-2">
                  <input
                    value={studyInput}
                    onChange={(e) => setStudyInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && studyInput.trim()) { handleStudyQuestion(studyInput); setStudyInput(""); } }}
                    placeholder="AI'dan savol bering... Masalan: Bu formulani tushuntirib bering"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[13px] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E8192C]/30 focus:border-[#E8192C]/50 transition-all"
                  />
                  <button
                    onClick={() => { if (studyInput.trim()) { handleStudyQuestion(studyInput); setStudyInput(""); } }}
                    disabled={!studyInput.trim() || isStudyLoading}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 shadow-md"
                    style={{ background: "#E8192C" }}
                    aria-label="Yuborish"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Current Question Flashcard */}
            {studyQ && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                      <FileText className="w-3 h-3 text-blue-500" />
                    </div>
                    <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-300">
                      Savol {studyCurrentQ + 1} / {studyQuestions.length}
                    </span>
                  </div>
                  <span className="text-[11px] px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">
                    {folder.subject || "Umumiy"}
                  </span>
                </div>

                <div className="p-5">
                  <div className="text-[14px] text-slate-800 dark:text-slate-200 leading-relaxed mb-5">
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {normalizeMathDelimiters(studyQ.question_text || "")}
                    </ReactMarkdown>
                  </div>

                  <div className="space-y-2">
                    {getOptionsTexts(studyQ.options)?.map((opt, i) => (
                      <div
                        key={i}
                        className={`flex items-start gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
                          i === studyQ.correct_option
                            ? "border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/10"
                            : "border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700"
                        }`}
                      >
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 ${
                          i === studyQ.correct_option
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                        }`}>
                          {String.fromCharCode(65 + i)}
                        </span>
                        <div className={`text-[13px] leading-relaxed pt-0.5 ${
                          i === studyQ.correct_option
                            ? "text-emerald-700 dark:text-emerald-300 font-medium"
                            : "text-slate-600 dark:text-slate-400"
                        }`}>
                          <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {normalizeMathDelimiters(opt)}
                          </ReactMarkdown>
                        </div>
                        {i === studyQ.correct_option && (
                          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 ml-auto" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
                  <button
                    onClick={() => setStudyCurrentQ(Math.max(0, studyCurrentQ - 1))}
                    disabled={studyCurrentQ === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-all"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Oldingi
                  </button>
                  <div className="flex gap-1">
                    {studyQuestions.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setStudyCurrentQ(idx)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          idx === studyCurrentQ ? "bg-[#E8192C] w-5" : "bg-slate-200 dark:bg-slate-700 hover:bg-slate-300"
                        }`}
                        aria-label={`Savol ${idx + 1}`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => setStudyCurrentQ(Math.min(studyQuestions.length - 1, studyCurrentQ + 1))}
                    disabled={studyCurrentQ === studyQuestions.length - 1}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-all"
                  >
                    Keyingi <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="lg:sticky lg:top-6 space-y-4">
            {/* Question Navigator */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#E8192C]/10 flex items-center justify-center">
                    <Hash className="w-3 h-3 text-[#E8192C]" />
                  </div>
                  <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-300">Savollar</span>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                  {studyCurrentQ + 1}/{studyQuestions.length}
                </span>
              </div>

              <div className="grid grid-cols-6 gap-1.5">
                {studyQuestions.map((sq, idx) => (
                  <button
                    key={sq.id || idx}
                    onClick={() => setStudyCurrentQ(idx)}
                    className={`aspect-square rounded-xl flex items-center justify-center text-[11px] font-semibold transition-all ${
                      idx === studyCurrentQ
                        ? "bg-[#E8192C] text-white shadow-lg shadow-[#E8192C]/20 scale-110"
                        : "bg-slate-50 dark:bg-slate-800/50 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-105"
                    }`}
                    aria-label={`Savol ${idx + 1}`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center">
                  <TrendingUp className="w-3 h-3 text-violet-500" />
                </div>
                <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-300">Statistika</span>
              </div>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-slate-400">Fan</span>
                  <span className="text-[12px] font-semibold text-slate-900 dark:text-white">{folder.subject || "Umumiy"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-slate-400">Savollar</span>
                  <span className="text-[12px] font-semibold text-slate-900 dark:text-white">{studyQuestions.length} ta</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-slate-400">Vaqt</span>
                  <span className="text-[12px] font-semibold text-slate-900 dark:text-white">{folder.duration_minutes || 60} daq</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                  <Zap className="w-3 h-3 text-amber-500" />
                </div>
                <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-300">Tezkor harakatlar</span>
              </div>
              <div className="space-y-2">
                <button
                  onClick={handleStartStudy}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-left group"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#E8192C]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Brain className="w-4 h-4 text-[#E8192C]" />
                  </div>
                  <div>
                    <p className="text-[12px] font-medium text-slate-700 dark:text-slate-300">AI bilan o'rganish</p>
                    <p className="text-[10px] text-slate-400">Mavzuni chuqur o'rganing</p>
                  </div>
                </button>
                <button
                  onClick={handleStart}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#E8192C]/5 hover:bg-[#E8192C]/10 transition-all text-left group border border-[#E8192C]/10"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#E8192C]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Target className="w-4 h-4 text-[#E8192C]" />
                  </div>
                  <div>
                    <p className="text-[12px] font-medium text-[#E8192C]">Testga o'tish</p>
                    <p className="text-[10px] text-[#E8192C]/60">Bilimlaringizni sinang</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeSession && activeFolder && !showResults) {
    return (
      <TestsActiveBlock
        activeFolder={activeFolder}
        questions={questions}
        currentQ={currentQ}
        setCurrentQ={setCurrentQ}
        answers={answers}
        setAnswers={setAnswers}
        timeLeft={timeLeft}
        submitting={submitting}
        handleSubmit={handleSubmit}
        setAiOpen={setAiOpen}
        aiOpen={aiOpen}
        isAiPinned={isAiPinned}
        setIsAiPinned={setIsAiPinned}
        aiExplanation={aiExplanation}
        isExplaining={isExplaining}
        setZoomedImage={setZoomedImage}
        setReportOpen={setReportOpen}
        setReportQuestionId={setReportQuestionId}
        reportOpen={reportOpen}
        reportMessage={reportMessage}
        setReportMessage={setReportMessage}
        submitReport={submitReport}
        isReporting={isReporting}
        reportQuestionId={reportQuestionId}
        checkedQuestions={checkedQuestions}
        setCheckedQuestions={setCheckedQuestions}
        correctAttempts={correctAttempts}
        setCorrectAttempts={setCorrectAttempts}
        questionAttempts={questionAttempts}
        setQuestionAttempts={setQuestionAttempts}
        formatTime={formatTime}
        exitTest={exitTest}
        explainQuestion={explainQuestion}
        askAiQuestion={askAiQuestion}
        getWrongAnswerHints={getWrongAnswerHints}
        playFeedback={playFeedback}
        testMode={testMode}
        zoomedImage={zoomedImage}
      />
    );
  }

  if (showResults && results) {
    const percentage = Math.round((results.correct / results.total) * 100);

    const answerDetails = questions.map((q, idx) => {
      const selected = answers[q.id] ?? null;
      const isCorrect = selected === q.correct_option;
      const isSkipped = selected === null;
      return { ...q, index: idx + 1, selected, isCorrect, isSkipped };
    });

    const filteredQuestions = reviewFilter === "all" ? answerDetails
      : reviewFilter === "correct" ? answerDetails.filter(q => q.isCorrect)
      : answerDetails.filter(q => !q.isCorrect);

    const options = ["A", "B", "C", "D"];

    if (showReview) {
      return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#050B10] p-4 sm:p-6">
          <div className="max-w-3xl mx-auto space-y-5">
            {/* Review Header */}
            <div className="flex items-center justify-between">
              <button onClick={() => setShowReview(false)}
                className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                <ChevronLeft className="w-4 h-4" /> Natijaga qaytish
              </button>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Javoblarni ko'rib chiqish</h2>
            </div>

            {/* Filter Chips */}
            <div className="flex gap-2">
              {(["all", "correct", "wrong"] as const).map(f => (
                <button key={f} onClick={() => setReviewFilter(f)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                    reviewFilter === f
                      ? f === "correct" ? "bg-emerald-500 text-white"
                        : f === "wrong" ? "bg-[#E8192C] text-white"
                        : "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}>
                  {f === "all" ? `Barchasi (${answerDetails.length})` : f === "correct" ? `To'g'ri (${results.correct})` : `Noto'g'ri (${results.wrong})`}
                </button>
              ))}
            </div>

            {/* Question List */}
            <div className="space-y-3">
              {filteredQuestions.map((q) => (
                <div key={q.id} className={`bg-white dark:bg-slate-900 rounded-2xl p-5 border transition-colors ${
                  q.isCorrect ? "border-emerald-200 dark:border-emerald-500/20" : "border-red-200 dark:border-red-500/20"
                }`}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                        q.isCorrect ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                      }`}>
                        {q.index}
                      </span>
                      {q.isSkipped && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/10 text-amber-600 text-[10px] font-bold">O'tkazib yuborilgan</span>
                      )}
                    </div>
                    {q.isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                    ) : (
                      <span className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                      </span>
                    )}
                  </div>

                  <div className="text-sm font-medium text-slate-900 dark:text-white mb-3 leading-relaxed prose prose-sm dark:prose-invert max-w-none prose-p:my-0">
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{q.question_text || q.text}</ReactMarkdown>
                  </div>

                  {q.image_url && (
                    <img src={q.image_url} alt="" className="mb-3 max-h-40 rounded-xl object-contain" />
                  )}

                  <div className="space-y-1.5">
                    {(q.options || []).map((opt: string, i: number) => {
                      const isUserChoice = q.selected === i;
                      const isCorrectOption = q.correct_option === i;
                      let optStyle = "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300";
                      if (isCorrectOption) optStyle = "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400";
                      if (isUserChoice && !isCorrectOption) optStyle = "bg-red-50 dark:bg-red-500/10 border-red-300 dark:border-red-500/30 text-red-700 dark:text-red-400";

                      return (
                        <div key={i} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border text-xs font-medium ${optStyle}`}>
                          <span className="w-5 h-5 rounded-md bg-white dark:bg-slate-900 border border-current/20 flex items-center justify-center text-[10px] font-black shrink-0">
                            {options[i]}
                          </span>
                          <span className="flex-1 prose prose-xs dark:prose-invert max-w-none prose-p:my-0"><ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{opt}</ReactMarkdown></span>
                          {isCorrectOption && <CheckCircle className="w-3.5 h-3.5 shrink-0" />}
                          {isUserChoice && !isCorrectOption && <span className="text-[10px] font-bold shrink-0">SIZNING JAVOBINGIZ</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#050B10] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[32px] p-8 text-center space-y-6 shadow-xl">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
            <span className="text-3xl">{results.correct > results.wrong ? "🎉" : results.correct === results.wrong ? "😐" : "😢"}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Test yakunlandi!</h1>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl p-4">
              <p className="text-2xl font-black text-emerald-600">{results.correct}</p>
              <p className="text-[10px] font-bold text-emerald-400 uppercase">To'g'ri</p>
            </div>
            <div className="bg-rose-50 dark:bg-rose-500/10 rounded-2xl p-4">
              <p className="text-2xl font-black text-rose-600">{results.wrong}</p>
              <p className="text-[10px] font-bold text-rose-400 uppercase">Noto'g'ri</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4">
              <p className="text-2xl font-black text-slate-900 dark:text-white">{results.total}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Jami</p>
            </div>
          </div>

          {/* Score Bar */}
          <div className="space-y-2">
            <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-1000"
                style={{ width: `${percentage}%` }} />
            </div>
            <p className="text-lg font-bold text-slate-600">Ball: <span className="text-primary">{percentage}%</span></p>
          </div>

          <div className="space-y-2.5">
            <Button onClick={() => setShowReview(true)}
              className="w-full py-5 rounded-2xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-700 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2">
              <BarChart3 className="w-4 h-4" /> Javoblarni ko'rish
            </Button>
            <Button onClick={exitTest}
              className="w-full py-5 rounded-2xl bg-gray-900 dark:bg-emerald-500 text-white font-black text-sm">
              Testlarga qaytish
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) return <div className="p-10 text-center text-gray-400">Yuklanmoqda...</div>;
  if (!folder) return <div className="p-10 text-center text-red-400">Test topilmadi.</div>;

  const modeConfig = {
    organish: { label: "Mavzuni o'rganish", icon: BookBookmarkIcon, bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400" },
    imtixon: { label: "Imtihon rejimi", icon: TargetIcon, bg: "bg-red-50 dark:bg-red-500/10", text: "text-[#E8192C]" },
    mashq: { label: "Mashq qilish", icon: BoltIcon, bg: "bg-blue-50 dark:bg-blue-500/10", text: "text-blue-600 dark:text-blue-400" },
  };
  const currentMode = modeConfig[mode] || modeConfig.organish;
  const ModeIcon = currentMode.icon;

  const seoTitle = folder.meta_title || `${folder.name} — ${folder.subject || "Umumiy"} mavzulashtirilgan test`;
  const seoDescription = folder.meta_description || `${folder.subject} fanidan "${folder.name}" mavzulashtirilgan test. Savollar soni: ${realQuestionCount ?? 0}, vaqt: ${folder.duration_minutes || 60} daqiqa. EduContest — Milliy Sertifikat tayyorlanish platformasi.`;
  const canonicalUrl = `https://educontest.uz/tests/folder/${id}`;
  const keywords = `${folder.name}, ${folder.subject} testlari, milliy sertifikat ${folder.subject?.toLowerCase()}, ${folder.subject?.toLowerCase()} mavzulashtirilgan test, educontest, online test, bepul test`;

  const breadcrumbItems = [
    { label: 'Testlar', href: '/tests' },
    ...(folder.subject ? [{ label: folder.subject, href: `/tests/${encodeURIComponent(folder.subject.toLowerCase())}` }] : []),
    { label: folder.name, isCurrent: true }
  ];

  const faqItems = [
    {
      question: `${folder.name} testi qancha vaqt davom etadi?`,
      answer: `Ushbu test ${folder.duration_minutes || 60} daqiqa davom etadi. Testda ${realQuestionCount ?? 0} ta savol mavjud. Har bir savolga o'rtacha ${Math.round((folder.duration_minutes || 60) / Math.max(realQuestionCount ?? 1, 1))} daqiqa vaqt ajratish tavsiya etiladi.`
    },
    {
      question: `${folder.name} testi qaysi darajada?`,
      answer: `Ushbu test "${folder.subject || "Umumiy"}" fanidan o'rta darajada tuzilgan. Milliy Sertifikat imtihonlariga tayyorlanish uchun mo'ljallangan.`
    },
    {
      question: `Testni qanday boshlash mumkin?`,
      answer: `"Testni boshlash" tugmasini bosganingizdan so'ng, sizga berilgan vaqt ichida barcha savollarga javob berishingiz kerak. Vaqt tugaganda test avtomatik yakunlanadi. 3 ta rejim mavjud: o'rganish, imtihon va mashq.`
    },
    {
      question: `Natijalarni qanday ko'rish mumkin?`,
      answer: `Testni tugatganingizdan so'ng, natijalaringiz ko'rsatiladi. To'g'ri va noto'g'ri javoblar soni, ball foiz va har bir savolning AI tushuntirishi ko'rsatiladi.`
    },
    {
      question: `AI tushuntirish nima?`,
      answer: `Har bir savol uchun EduAI yordamchisi tomonidan tayyorlangan batafsil tushuntirish mavjud. Bu tushuntirish to'g'ri javobning nega to'g'riligini va boshqa variantlarning nima uchun noto'g'riligini tushuntiradi.`
    },
    {
      question: `Bepul testlar mavjudmi?`,
      answer: `Ha, EduContest platformasida ko'plab bepul testlar mavjud. ${(folder.price || 0) === 0 ? "Ushbu test ham bepul." : "Ushbu test pullik, lekin boshqa bepul testlarni ham sinab ko'rishingiz mumkin."}`
    },
    {
      question: `Test natijalarini qanday yaxshilash mumkin?`,
      answer: `Muntazam ravishda mashq qiling, xatolaringizni tahlil qiling va AI tushuntirishlarini diqqat bilan o'qing. O'rganish rejimida mavzuni chuqur o'rganing.`
    }
  ];

  return (
    <>
      {/* Structured Data */}
      <StructuredData type="quiz" data={{ folder, questionCount: realQuestionCount ?? 0 }} />
      <StructuredData type="faq" data={{ items: faqItems }} />
      <StructuredData type="breadcrumb" data={{
        items: [
          { name: 'Bosh sahifa', url: 'https://educontest.uz' },
          { name: 'Testlar', url: 'https://educontest.uz/tests' },
          ...(folder.subject ? [{ name: folder.subject, url: `https://educontest.uz/tests/${encodeURIComponent(folder.subject.toLowerCase())}` }] : []),
          { name: folder.name, url: canonicalUrl }
        ]
      }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <SEO
          title={seoTitle}
          description={seoDescription}
          canonical={canonicalUrl}
          keywords={keywords}
          ogType="website"
        />

        {/* Breadcrumbs */}
        <Breadcrumbs items={breadcrumbItems} />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 items-start">
          {/* Left content */}
          <div className="space-y-5">
            {/* Mobile CTA — visible only on small screens */}
            <div className="lg:hidden">
              <button
                onClick={mode === "organish" ? handleStartStudy : handleStart}
                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-[14px] font-semibold text-white transition-opacity hover:opacity-90 active:scale-[0.98] shadow-lg shadow-red-200/40"
                style={{ background: "#E8192C" }}
              >
                {(folder.price || 0) === 0 || alreadyPurchased || profile?.is_lifetime
                  ? (mode === "organish" ? "O'rganishni boshlash" : "Testni boshlash")
                  : "Sotib olish"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-extrabold ${currentMode.bg} ${currentMode.text}`}>
                  <ModeIcon size={16} />
                  {currentMode.label}
                </span>
                {(folder.price || 0) === 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-extrabold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Award className="w-4 h-4" /> Bepul
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
                {folder.name}
              </h1>
              <p className="text-[14px] text-slate-800 dark:text-slate-200 leading-relaxed font-extrabold max-w-2xl">
                {folder.description || `${folder.subject || "Umumiy"} fanidan "${folder.name}" mavzusiga oid mavzulashtirilgan test. Milliy Sertifikat imtihonlariga tayyorlanish uchun mo'ljallangan.`}
              </p>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                    <BookBookmarkIcon size={22} className="text-blue-500" />
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{realQuestionCount ?? 0}</p>
                <p className="text-[11.5px] font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Savollar</p>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                    <ClockCircleIcon size={22} className="text-amber-500" />
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{folder.duration_minutes || 60}</p>
                <p className="text-[11.5px] font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Daqiqa</p>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center">
                    <CompassBigIcon size={22} className="text-violet-500" />
                  </div>
                </div>
                <p className="text-base font-extrabold text-slate-900 dark:text-white truncate">{folder.subject || "Umumiy"}</p>
                <p className="text-[11.5px] font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Fan</p>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                    <GraphNewUpIcon size={22} className="text-emerald-500" />
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {(folder.price || 0) === 0 ? "Bepul" : folder.price?.toLocaleString()}
                </p>
                <p className="text-[11.5px] font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                  {(folder.price || 0) === 0 ? "" : "So'm"}
                </p>
              </div>
            </div>

            {/* Features / description card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
              <p className="text-[12px] font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Xususiyatlar</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#E8192C]/10 flex items-center justify-center mt-0.5 shrink-0">
                    <BoltIcon size={20} className="text-[#E8192C]" />
                  </div>
                  <div>
                    <p className="text-[14px] font-extrabold text-slate-900 dark:text-white">Tezkor boshlash</p>
                    <p className="text-[12.5px] text-slate-700 dark:text-slate-200 font-extrabold">Bir bossa test boshlanadi</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#E8192C]/10 flex items-center justify-center mt-0.5 shrink-0">
                    <TargetIcon size={20} className="text-[#E8192C]" />
                  </div>
                  <div>
                    <p className="text-[14px] font-extrabold text-slate-900 dark:text-white">Aniq natija</p>
                    <p className="text-[12.5px] text-slate-700 dark:text-slate-200 font-extrabold">Har bir javob baholanadi</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#E8192C]/10 flex items-center justify-center mt-0.5 shrink-0">
                    <ChatSquareCodeIcon size={20} className="text-[#E8192C]" />
                  </div>
                  <div>
                    <p className="text-[14px] font-extrabold text-slate-900 dark:text-white">AI tushuntirish</p>
                    <p className="text-[12.5px] text-slate-700 dark:text-slate-200 font-extrabold">Har bir savolga tushuntirish</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#E8192C]/10 flex items-center justify-center mt-0.5 shrink-0">
                    <ClockCircleIcon size={20} className="text-[#E8192C]" />
                  </div>
                  <div>
                    <p className="text-[14px] font-extrabold text-slate-900 dark:text-white">Vaqt nazorati</p>
                    <p className="text-[12.5px] text-slate-700 dark:text-slate-200 font-extrabold">{folder.duration_minutes || 60} daqiqa vaqt cheklovi</p>
                  </div>
                </div>
              </div>
            </div>

            {/* After Test Section */}
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#E8192C]/10 flex items-center justify-center">
                  <DiplomaIcon size={20} className="text-[#E8192C]" />
                </div>
                <h2 className="text-[12px] font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                  Testdan keyin davom eting
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => navigate('/tests')}
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left border border-slate-100 dark:border-slate-800"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                    <BookBookmarkIcon size={22} className="text-blue-500" />
                  </div>
                  <div>
                    <p className="text-[13.5px] font-extrabold text-slate-900 dark:text-white">Boshqa testlar</p>
                    <p className="text-[12px] text-slate-700 dark:text-slate-200 font-extrabold">Barcha fanlar bo'yicha testlar</p>
                  </div>
                </button>
                <button
                  onClick={() => navigate('/courses')}
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left border border-slate-100 dark:border-slate-800"
                >
                  <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center shrink-0">
                    <DiplomaIcon size={22} className="text-violet-500" />
                  </div>
                  <div>
                    <p className="text-[13.5px] font-extrabold text-slate-900 dark:text-white">Kurslar</p>
                    <p className="text-[12px] text-slate-700 dark:text-slate-200 font-extrabold">Video darsliklar va kurslar</p>
                  </div>
                </button>
                <button
                  onClick={() => navigate('/qollanmalar')}
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left border border-slate-100 dark:border-slate-800"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
                    <DocumentTextIcon size={22} className="text-amber-500" />
                  </div>
                  <div>
                    <p className="text-[13.5px] font-extrabold text-slate-900 dark:text-white">Qo'llanmalar</p>
                    <p className="text-[12px] text-slate-700 dark:text-slate-200 font-extrabold">O'quv materiallari</p>
                  </div>
                </button>
              </div>
            </section>
          </div>

          {/* Right sidebar */}
          <div className="hidden lg:block lg:sticky lg:top-6 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-5">
              {/* Price — only show if price > 0 */}
              {(folder.price || 0) > 0 && (
                <div className="text-center pb-4 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-[11.5px] font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">Narxi</p>
                  <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
                    {folder.price?.toLocaleString()}
                    <span className="text-sm font-bold text-slate-500 ml-1">So'm</span>
                  </p>
                </div>
              )}

              {/* CTA Button */}
              <button
                onClick={mode === "organish" ? handleStartStudy : handleStart}
                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-[14px] font-extrabold text-white transition-opacity hover:opacity-90 active:scale-[0.98] shadow-md shadow-red-500/20"
                style={{ background: "#E8192C" }}
                aria-label={mode === "organish" ? "O'rganishni boshlash" : "Testni boshlash"}
              >
                {(folder.price || 0) === 0 || alreadyPurchased || profile?.is_lifetime
                  ? (mode === "organish" ? "O'rganishni boshlash" : "Testni boshlash")
                  : "Sotib olish"}
                <AltArrowRightIcon size={18} />
              </button>

              {/* Details */}
              <div className="space-y-3.5 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                    <DocumentTextIcon size={18} />
                    <span className="text-[13px] font-extrabold text-slate-700 dark:text-slate-200">Savollar soni</span>
                  </div>
                  <span className="text-[14px] font-extrabold text-slate-900 dark:text-white">{realQuestionCount ?? 0} ta</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                    <ClockCircleIcon size={18} />
                    <span className="text-[13px] font-extrabold text-slate-700 dark:text-slate-200">Vaqt</span>
                  </div>
                  <span className="text-[14px] font-extrabold text-slate-900 dark:text-white">{folder.duration_minutes || 60} daqiqa</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                    <GlobalIcon size={18} />
                    <span className="text-[13px] font-extrabold text-slate-700 dark:text-slate-200">Fan</span>
                  </div>
                  <span className="text-[14px] font-extrabold text-slate-900 dark:text-white">{folder.subject || "Umumiy"}</span>
                </div>
                <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-[12px] font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Test Rejimi</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(["imtixon", "mashq"] as const).map((m) => {
                      const cfg = modeConfig[m];
                      const CfgIcon = cfg.icon;
                      const isActive = mode === m;
                      return (
                        <button
                          key={m}
                          onClick={() => setSearchParams({ mode: m })}
                          className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-[13px] font-extrabold transition-all border ${
                            isActive
                              ? `${cfg.bg} ${cfg.text} border-current/30 shadow-sm ring-1 ring-current/20 scale-[1.02]`
                              : "bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                          aria-label={cfg.label}
                          aria-pressed={isActive}
                        >
                          <CfgIcon size={18} className="shrink-0" />
                          <span className="whitespace-nowrap">{cfg.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Related Topics */}
            <RelatedTopics
              currentSubject={folder.subject || "Matematika"}
              currentTopic={folder.name}
              relatedFolders={[]}
            />
          </div>
        </div>

        <PaymentModal isOpen={isPaymentOpen} onClose={() => setIsPaymentOpen(false)} amount={folder.price || 0} title={folder.name} profile={profile} />

        <Dialog open={modeModalOpen} onOpenChange={setModeModalOpen}>
          <DialogContent className="sm:max-w-md rounded-2xl p-6">
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
              Test rejimini tanlang
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mb-4">
              Testni qaysi rejimda ishlamoqchisiz?
            </DialogDescription>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setModeModalOpen(false);
                  setSearchParams({ mode: "imtixon" });
                  setTimeout(() => handleStart(), 100);
                }}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-red-100 dark:border-red-500/20 bg-red-50/50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all group text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center text-white shrink-0">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Imtihon rejimi</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Vaqt cheklovi bilan test ishlash</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setModeModalOpen(false);
                  setSearchParams({ mode: "mashq" });
                  setTimeout(() => handleStart(), 100);
                }}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-blue-100 dark:border-blue-500/20 bg-blue-50/50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all group text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Mashq qilish</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Vaqtsiz mashq qilish imkoniyati</p>
                </div>
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default TestDetails;
