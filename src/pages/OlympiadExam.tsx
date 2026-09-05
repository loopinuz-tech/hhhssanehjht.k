import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { slugify } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Timer, ChevronLeft, ChevronRight,
  Send, Shield, AlertTriangle, Monitor,
  Activity, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { rewriteStorageUrl } from "@/lib/storage";

const OlympiadExam = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [warnings, setWarnings] = useState(0);
  const [fsViolationTimer, setFsViolationTimer] = useState<number | null>(null);
  const [step, setStep] = useState<"warning" | "exam">("warning");

  const { data: ol } = useQuery({
    queryKey: ["olympiad", id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("olympiads")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: questions } = useQuery({
    queryKey: ["olympiad-questions", id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("olympiad_questions")
        .select("*")
        .eq("olympiad_id", id)
        .order("order_number");
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: myStatus } = useQuery({
    queryKey: ["my-olympiad-status", id],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await (supabase as any)
        .from("olympiad_registrations")
        .select("*")
        .eq("olympiad_id", id)
        .eq("user_id", user.id)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (myStatus?.completed_at) {
      toast({ title: "Xatolik", description: "Siz bu olimpiadani topshirib bo'lgansiz.", variant: "destructive" });
      navigate(`/olympiads/${id}/${ol?.title ? slugify(ol.title) : ""}`);
    }
  }, [myStatus, navigate, id, toast]);

  // Security: Fullscreen
  const enterFullScreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) elem.requestFullscreen();
  };

  useEffect(() => {
    const handleFsChange = () => {
      const isFs = !!document.fullscreenElement;
      setIsFullScreen(isFs);
      if (step === "exam") {
        if (!isFs) {
          setFsViolationTimer(2);
          setWarnings((prev) => prev + 1);
        } else {
          setFsViolationTimer(null);
        }
      }
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, [step]);

  useEffect(() => {
    if (fsViolationTimer === null || fsViolationTimer < 0) return;
    if (fsViolationTimer === 0) {
      submitMutation.mutate({ reason: "To'liq ekrandan chiqish" });
      return;
    }
    const t = setInterval(() => setFsViolationTimer((p) => (p !== null ? p - 1 : null)), 1000);
    return () => clearInterval(t);
  }, [fsViolationTimer]);

  // Security: Key blocking
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isFKey = e.key.startsWith("F") && !isNaN(Number(e.key.substring(1)));
      if (
        isFKey ||
        e.key === "PrintScreen" ||
        (e.ctrlKey && ["c", "C", "v", "V", "u", "U", "p", "P"].includes(e.key)) ||
        (e.ctrlKey && e.shiftKey && ["I", "i", "J", "j", "C", "c"].includes(e.key)) ||
        (e.altKey && e.key === "Tab")
      ) {
        e.preventDefault();
        toast({ title: "Taqiqlangan!", description: "Ushbu tugmalardan foydalanish imtihon paytida cheklangan.", variant: "destructive" });
      }
    };
    const handleContextMenu = (e: Event) => e.preventDefault();
    const handleCopy = (e: ClipboardEvent) => e.preventDefault();
    const handleSelectStart = (e: Event) => e.preventDefault();
    const handleBlur = () => {
      setWarnings((prev) => prev + 1);
      toast({ title: "Ogohlantirish!", description: "Imtihon paytida boshqa oynaga o'tish taqiqlanadi!", variant: "destructive" });
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("copy", handleCopy);
    window.addEventListener("selectstart", handleSelectStart);
    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("copy", handleCopy);
      window.removeEventListener("selectstart", handleSelectStart);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  // Timer
  useEffect(() => {
    if (ol?.duration_minutes) setTimeLeft(ol.duration_minutes * 60);
  }, [ol]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const submitMutation = useMutation({
    mutationFn: async (disqualification?: { reason: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let score = 0;
      let correct = 0;
      let wrong = 0;
      questions?.forEach((q: any) => {
        if (answers[q.id] === q.correct_option) {
          score += q.points || 1;
          correct++;
        } else {
          wrong++;
        }
      });

      const updateData: any = { score, completed_at: new Date().toISOString() };
      if (disqualification) {
        updateData.is_disqualified = true;
        updateData.disqualification_reason = disqualification.reason;
      }

      // Save attempt
      await (supabase as any).from("olympiad_attempts").insert({
        olympiad_id: id,
        user_id: user.id,
        score,
        correct_answers: correct,
        wrong_answers: wrong,
        total_questions: questions?.length || 0,
        finished_at: new Date().toISOString(),
      });

      const { error } = await (supabase as any)
        .from("olympiad_registrations")
        .update(updateData)
        .eq("olympiad_id", id)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["olympiad-leaderboard", id] });
      qc.invalidateQueries({ queryKey: ["my-olympiad-status", id] });
      qc.invalidateQueries({ queryKey: ["my-olympiad-attempts", id] });
      if (variables?.reason) {
        toast({ title: "Chetlatildingiz!", description: "Qoidabuzarlik sababli imtihoningiz bekor qilindi.", variant: "destructive" });
      } else {
        toast({ title: "Yakunlandi!", description: "Olimpiada natijangiz saqlandi." });
      }
      navigate(`/olympiads/${id}/${ol?.title ? slugify(ol.title) : ""}`);
    },
  });

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = questions?.length || 0;

  // WARNING SCREEN
  if (step === "warning") {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
        <div className="max-w-lg w-full border border-slate-200 rounded-2xl p-8 md:p-10 space-y-8">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto">
            <Shield className="w-8 h-8 text-[#E8192C]" />
          </div>

          <div className="space-y-3">
            <h1 className="text-xl font-semibold text-slate-900">Xavfsizlik qoidalari</h1>
            <p className="text-[13px] text-slate-500 font-medium leading-relaxed">
              Imtihon boshlanishi bilan brauzer to'liq ekran rejimiga o'tadi va barcha tashqi amallar bloklanadi.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { title: "To'liq ekran", desc: "Avtomatik", icon: Monitor },
              { title: "Copy/Paste", desc: "Bloklangan", icon: Shield },
              { title: "Nazorat", desc: "Kuzatiladi", icon: Activity },
              { title: "Timer", desc: "Avto-yakun", icon: Timer },
            ].map((item, i) => (
              <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-left">
                <item.icon className="w-4 h-4 text-slate-400 mb-2" />
                <p className="text-[13px] font-medium text-slate-900">{item.title}</p>
                <p className="text-[11px] font-medium text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={() => navigate(`/olympiads/${id}/${ol?.title ? slugify(ol.title) : ""}`)}
              className="flex-1 border border-slate-200 bg-transparent text-slate-600 rounded-xl text-[13px] font-medium"
            >
              Orqaga
            </Button>
            <Button
              onClick={() => { enterFullScreen(); setStep("exam"); }}
              className="flex-1 bg-[#E8192C] hover:bg-[#d01725] text-white rounded-xl text-[13px] font-medium"
            >
              Boshlash
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // FULLSCREEN VIOLATION
  if (!isFullScreen && step === "exam") {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-red-600 text-white p-12 text-center space-y-8">
        <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center animate-pulse">
          <AlertTriangle className="w-12 h-12" />
        </div>
        <div className="space-y-3 max-w-lg">
          <h1 className="text-3xl font-semibold uppercase tracking-tight">To'liq ekran buzildi!</h1>
          <p className="text-[15px] font-medium text-red-100">
            Tezda to'liq ekran rejimiga qayting! Aks holda{" "}
            <span className="font-semibold underline decoration-2">{fsViolationTimer}</span> soniyadan so'ng bekor qilinadi.
          </p>
        </div>
        <Button
          onClick={enterFullScreen}
          className="bg-white text-red-600 hover:bg-red-50 h-14 px-12 rounded-xl font-medium text-[13px]"
        >
          To'liq ekranga qaytish
        </Button>
      </div>
    );
  }

  const currentQ = questions?.[activeQuestion];

  return (
    <div className="h-screen bg-white flex flex-col select-none">
      {/* Header */}
      <div className="h-14 bg-slate-900 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="text-[11px] font-medium text-slate-400">Xavfsiz rejim</span>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-medium ${
            timeLeft < 300 ? "bg-red-500/10 text-red-400" : "bg-white/5 text-white"
          }`}>
            <Timer className="w-3.5 h-3.5" />
            <span className="tabular-nums">{formatTime(timeLeft)}</span>
          </div>
          <div className="text-[11px] font-medium text-slate-500">
            {answeredCount}/{totalQuestions} javob
          </div>
        </div>

        <div className="flex items-center gap-4">
          {warnings > 0 && (
            <div className="flex items-center gap-2 text-red-400 bg-red-500/10 px-3 py-1.5 rounded-lg text-[11px] font-medium">
              <AlertTriangle className="w-3.5 h-3.5" /> Ogohlantirish: {warnings}
            </div>
          )}
          <Button
            onClick={() => { if (confirm("Haqiqatan ham yakunlamoqchimisiz?")) submitMutation.mutate(undefined); }}
            className="bg-[#E8192C] hover:bg-[#d01725] text-white h-9 px-5 rounded-lg text-[13px] font-medium"
          >
            Yakunlash <Send className="w-3.5 h-3.5 ml-2" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-72 border-r border-slate-200 bg-slate-50 p-5 overflow-y-auto hidden lg:block">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-4">Savollar</p>
          <div className="grid grid-cols-5 gap-2">
            {questions?.map((_: any, i: number) => (
              <button
                key={i}
                onClick={() => setActiveQuestion(i)}
                className={`h-10 rounded-lg text-[13px] font-medium transition-all ${
                  activeQuestion === i
                    ? "bg-[#E8192C] text-white"
                    : answers[questions[i].id] !== undefined
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                    : "bg-white border border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Question */}
        <div className="flex-1 overflow-y-auto p-8 lg:p-12">
          <AnimatePresence mode="wait">
            {currentQ && (
              <motion.div
                key={currentQ.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="max-w-2xl mx-auto space-y-8"
              >
                <div className="space-y-3">
                  <p className="text-[11px] font-medium text-[#E8192C] uppercase tracking-wider">
                    Savol {activeQuestion + 1} / {totalQuestions}
                    {currentQ.points > 1 && ` • ${currentQ.points} ball`}
                  </p>
                  <h2 className="text-lg font-medium text-slate-900 leading-relaxed">{currentQ.question_text}</h2>
                  {currentQ.image_url && (
                    <img
                      src={rewriteStorageUrl(currentQ.image_url)}
                      alt="Savol rasmi"
                      className="max-w-full rounded-xl border border-slate-200 mt-4"
                    />
                  )}
                </div>

                {currentQ.question_type === "test" ? (
                  <div className="space-y-3">
                    {currentQ.options?.map((opt: string, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setAnswers({ ...answers, [currentQ.id]: idx })}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                          answers[currentQ.id] === idx
                            ? "bg-[#E8192C] border-[#E8192C] text-white"
                            : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-[13px] font-medium shrink-0 ${
                            answers[currentQ.id] === idx ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <span className="text-[13px] font-medium">{opt}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Javobingizni yozing</p>
                    <textarea
                      className="w-full h-40 p-4 rounded-xl bg-white border border-slate-200 focus:border-slate-300 transition-all outline-none text-[13px] font-medium leading-relaxed resize-none"
                      placeholder="Javobni yozing..."
                      onChange={(e) => setAnswers({ ...answers, [currentQ.id]: e.target.value as any })}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between pt-4">
                  <Button
                    variant="ghost"
                    disabled={activeQuestion === 0}
                    onClick={() => setActiveQuestion((prev) => prev - 1)}
                    className="border border-slate-200 bg-transparent text-slate-600 rounded-xl text-[13px] font-medium px-5"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Oldingi
                  </Button>
                  <Button
                    onClick={() =>
                      activeQuestion < (questions?.length || 0) - 1
                        ? setActiveQuestion((prev) => prev + 1)
                        : submitMutation.mutate(undefined)
                    }
                    className="bg-[#E8192C] hover:bg-[#d01725] text-white rounded-xl text-[13px] font-medium px-5"
                  >
                    {activeQuestion < (questions?.length || 0) - 1 ? "Keyingi" : "Yakunlash"}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default OlympiadExam;
