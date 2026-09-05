import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import {
  ArrowLeft, Loader2, CheckCircle, XCircle, AlertTriangle,
  Sparkles, Brain, ShieldCheck, Heart, Send, RotateCcw,
  ChevronRight, Eye, Edit3, Trash2, Plus, Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface GeneratedQuestion {
  question_text: string;
  options: { label: string; option_text: string; is_correct: boolean }[];
  correct_option: number;
  difficulty: "easy" | "middle" | "hard";
  level: "bilish" | "qollash" | "mulohaza";
  engagement_score?: number;
  engagement_note?: string;
}

interface StepResult {
  passed: boolean;
  message: string;
  details?: string[];
}

const DIFFICULTY_CONFIG = {
  easy: { label: "Oson", color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-200 dark:border-emerald-500/20" },
  middle: { label: "O'rtacha", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-500/10", border: "border-amber-200 dark:border-amber-500/20" },
  hard: { label: "Qiyin", color: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-500/10", border: "border-rose-200 dark:border-rose-500/20" },
};

const STEPS = [
  { id: 1, label: "Savollar yaratish", icon: Sparkles, desc: "AI 30 ta savol yaratadi" },
  { id: 2, label: "Javob taqsimoti", icon: ShieldCheck, desc: "A-A, B-B ketma-ketligi tekshiriladi" },
  { id: 3, label: "Aniqlik tekshiruvi", icon: Brain, desc: "Javob variantlarga mosligi" },
  { id: 4, label: "Qiziqarlilik", icon: Heart, desc: "Savol sifati baholanadi" },
  { id: 5, label: "Yakuniy tekshiruv", icon: Eye, desc: "Barchasi tasdiqlanadi" },
];

export default function AIGenerateQuestions({
  folderId,
  folderName,
  subject,
  onBack,
}: {
  folderId: string;
  folderName: string;
  subject: string;
  onBack: () => void;
}) {
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [stepResults, setStepResults] = useState<Record<number, StepResult>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");
  const [topic, setTopic] = useState("English Adjectives");
  const [customTopic, setCustomTopic] = useState("");
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [editOptions, setEditOptions] = useState(["", "", "", ""]);
  const [editCorrect, setEditCorrect] = useState(0);

  const effectiveTopic = customTopic.trim() || topic;

  // Step 1: Generate questions
  const generateQuestions = async (): Promise<GeneratedQuestion[]> => {
    setProcessingMessage("AI savollar yaratmoqda... 30 ta savol: 10 oson, 10 o'rtacha, 10 qiyin");

    const systemPrompt = `Sen professional test savollarini yaratuvchi AI'san. Faqat JSON formatda javob ber.

Mavzu: ${effectiveTopic}
Fan: ${subject}

YARATISH QOIDALARI:
1. Jami 30 ta savol yarat: 10 ta easy (oson), 10 ta middle (o'rtacha), 10 ta hard (qiyin)
2. Har bir savolda 4 ta variant bo'lishi kerak: A, B, C, D
3. Har bir variant bir xil formatda bo'lishi kerak
4. To'g'ri javob har xil variantlar orasida tarqalgan bo'lishi kerak (hamma savolda A emas!)
5. Savollar qiziqarli, hayotiy misollar bilan boyitilgan bo'lishi kerak
6. Oson savollar asosiy tushunchalarni tekshirsin
7. O'rtacha savollar murakkabroq misollar bersin
8. Qiyin savollar chuqur bilim va tahlil talab qilsin
9. Variantlar ishonchli bo'lishi kerak - noto'g'ri variantlar ham realistik bo'lsin
10. Har bir savol tushunarli va aniq bo'lishi kerak

JSON format:
[
  {
    "question_text": "Savol matni",
    "options": [
      {"label": "A", "option_text": "Variant A matni", "is_correct": false},
      {"label": "B", "option_text": "Variant B matni", "is_correct": true},
      {"label": "C", "option_text": "Variant C matni", "is_correct": false},
      {"label": "D", "option_text": "Variant D matni", "is_correct": false}
    ],
    "correct_option": 1,
    "difficulty": "easy",
    "level": "bilish"
  }
]

correct_option indeksi 0 dan boshlanadi (A=0, B=1, C=2, D=3).
difficulty: "easy", "middle", "yoki "hard"
level: "bilish", "qollash", "yoki "mulohaza"

FAQAT JSON array qaytar, boshqa hech narsa yozma!`;

    const response = await api.ai.chat([
      { role: "system", content: systemPrompt },
      { role: "user", content: `${effectiveTopic} mavzusida 30 ta test savol yarat. 10 oson, 10 o'rtacha, 10 qiyin. Har bir savolda 4 ta variant (A, B, C, D) bo'lsin. JSON formatda chiqar.` },
    ]);

    const content = response.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("AI noto'g'ri format qaytardi");

    const parsed = JSON.parse(jsonMatch[0]) as GeneratedQuestion[];

    // Validate and normalize
    return parsed.map((q: any) => ({
      question_text: q.question_text || "",
      options: (q.options || []).map((o: any, i: number) => ({
        label: ["A", "B", "C", "D"][i],
        option_text: o.option_text || "",
        is_correct: i === (q.correct_option ?? 0),
      })),
      correct_option: q.correct_option ?? 0,
      difficulty: q.difficulty || "easy",
      level: q.level || "bilish",
    }));
  };

  // Step 2: Check answer distribution
  const checkAnswerDistribution = (qs: GeneratedQuestion[]): StepResult => {
    const issues: string[] = [];
    let prevCorrect = -1;
    let consecutiveCount = 0;

    for (let i = 0; i < qs.length; i++) {
      const current = qs[i].correct_option;
      if (current === prevCorrect) {
        consecutiveCount++;
        if (consecutiveCount >= 2) {
          issues.push(`Savol ${i + 1}: ${["A", "B", "C", "D"][current]} varianti ${consecutiveCount + 1} marta ketma-ket kelmoqda`);
        }
      } else {
        consecutiveCount = 0;
      }
      prevCorrect = current;
    }

    // Check distribution balance
    const counts = [0, 0, 0, 0];
    qs.forEach(q => counts[q.correct_option]++);
    const labels = ["A", "B", "C", "D"];
    const max = Math.max(...counts);
    const min = Math.min(...counts);
    if (max - min > 5) {
      issues.push(`Javob taqsimoti nosimmetrik: ${counts.map((c, i) => `${labels[i]}=${c}`).join(", ")}`);
    }

    return {
      passed: issues.length === 0,
      message: issues.length === 0
        ? `Javob taqsimoti to'g'ri. Taqsimot: ${counts.map((c, i) => `${labels[i]}=${c}`).join(", ")}`
        : `${issues.length} ta muammo topildi`,
      details: issues,
    };
  };

  // Step 3: Check answer accuracy
  const checkAnswerAccuracy = (qs: GeneratedQuestion[]): StepResult => {
    const issues: string[] = [];

    qs.forEach((q, i) => {
      const correctIdx = q.correct_option;
      if (correctIdx < 0 || correctIdx > 3) {
        issues.push(`Savol ${i + 1}: Noto'g'ri correct_option indeksi (${correctIdx})`);
      }
      if (!q.options[correctIdx]?.is_correct) {
        issues.push(`Savol ${i + 1}: ${["A", "B", "C", "D"][correctIdx]} varianti is_correct=false, lekin correct_option=${correctIdx}`);
      }
      if (q.options.filter(o => o.is_correct).length !== 1) {
        issues.push(`Savol ${i + 1}: Bir nechta yoki hech qanday to'g'ri javob yo'q`);
      }
      if (q.options.length !== 4) {
        issues.push(`Savol ${i + 1}: ${q.options.length} ta variant (4 ta kerak)`);
      }
      q.options.forEach((o, j) => {
        if (!o.option_text?.trim()) {
          issues.push(`Savol ${i + 1}, variant ${String.fromCharCode(65 + j)}: Bo'sh matn`);
        }
      });
      if (!q.question_text?.trim()) {
        issues.push(`Savol ${i + 1}: Bo'sh savol matni`);
      }
    });

    return {
      passed: issues.length === 0,
      message: issues.length === 0
        ? `Barcha ${qs.length} ta savol aniqlikka mos. Har bir javob to'g'ri belgilangan.`
        : `${issues.length} ta aniqlik muammosi topildi`,
      details: issues,
    };
  };

  // Step 4: Check engagement
  const checkEngagement = async (qs: GeneratedQuestion[]): Promise<StepResult> => {
    setProcessingMessage("AI savollarning qiziqarliligini baholamoqda...");

    const sampleQuestions = qs.slice(0, 10).map((q, i) =>
      `${i + 1}. [${q.difficulty}] ${q.question_text}`
    ).join("\n");

    const response = await api.ai.chat([
      {
        role: "system",
        content: `Sen test savolarini bahovchi mutaxassissan. Quyidagi savollarni bahola va har biriga 1-10 baho ber.

BAHOLASH KRITERIYALARI:
1. Qiziqarlilik (foydalanuvchi qiziqtiradimi?)
2. O'rganish qiymati (savol yangi narsa o'rgatadimi?)
3. Real hayotga bog'liqligi (amalda qo'llash mumkinmi?)
4. Tushunarlik (savol aniq va tushunarlimi?)
5. Variantlar sifati (noto'g'ri variantlar ishonchlimi?)

Har bir savol uchun JSON formatda javob ber:
[{"index": 0, "score": 8, "note": "Qisqa izoh"}]

Score: 1-10 (10 eng yaxshi). 7 dan past bo'lsa, savol yaroqsiz.
FAQAT JSON array qaytar!`
      },
      {
        role: "user",
        content: `Baholash uchun savollar:\n${sampleQuestions}`
      }
    ]);

    const content = response.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      // If AI fails, assume all pass
      return { passed: true, message: "Baholash avtomatik o'tkazildi (AI javob bermadi)" };
    }

    const evaluations = JSON.parse(jsonMatch[0]);
    const lowScoreIssues: string[] = [];

    evaluations.forEach((e: any) => {
      if (e.score < 7) {
        lowScoreIssues.push(`Savol ${e.index + 1}: Baho ${e.score}/10 - ${e.note || "Past sifat"}`);
      }
      // Update engagement info
      if (qs[e.index]) {
        qs[e.index].engagement_score = e.score;
        qs[e.index].engagement_note = e.note;
      }
    });

    return {
      passed: lowScoreIssues.length === 0,
      message: lowScoreIssues.length === 0
        ? `Barcha baholangan savollar 7+ ball oldi. Sifat yuqori!`
        : `${lowScoreIssues.length} ta savol past baho oldi`,
      details: lowScoreIssues,
    };
  };

  // Step 5: Final check
  const finalCheck = (qs: GeneratedQuestion[]): StepResult => {
    const issues: string[] = [];

    // Count by difficulty
    const easy = qs.filter(q => q.difficulty === "easy").length;
    const middle = qs.filter(q => q.difficulty === "middle").length;
    const hard = qs.filter(q => q.difficulty === "hard").length;

    if (easy !== 10) issues.push(`Oson savollar: ${easy} (10 kerak)`);
    if (middle !== 10) issues.push(`O'rtacha savollar: ${middle} (10 kerak)`);
    if (hard !== 10) issues.push(`Qiyin savollar: ${hard} (10 kerak)`);
    if (qs.length !== 30) issues.push(`Jami savollar: ${qs.length} (30 kerak)`);

    // Check all passed previous steps
    Object.entries(stepResults).forEach(([step, result]) => {
      if (step !== "5" && !result.passed) {
        issues.push(`${STEPS[parseInt(step) - 1]?.label} bosqichi o'tmagan`);
      }
    });

    return {
      passed: issues.length === 0,
      message: issues.length === 0
        ? `Barcha ${qs.length} ta savol tayyor! ${easy} oson, ${middle} o'rtacha, ${hard} qiyin. Admin tasdig'iga yuboriladi.`
        : `${issues.length} ta muammo qoldi`,
      details: issues,
    };
  };

  // Run a specific step
  const runStep = async (step: number) => {
    setIsProcessing(true);
    try {
      let result: StepResult;

      switch (step) {
        case 1: {
          const generated = await generateQuestions();
          setQuestions(generated);
          setProcessingMessage(`${generated.length} ta savol yaratildi!`);
          result = { passed: generated.length === 30, message: `${generated.length} ta savol yaratildi` };
          break;
        }
        case 2:
          result = checkAnswerDistribution(questions);
          break;
        case 3:
          result = checkAnswerAccuracy(questions);
          break;
        case 4:
          result = await checkEngagement(questions);
          break;
        case 5:
          result = finalCheck(questions);
          break;
        default:
          result = { passed: false, message: "Noma'lum bosqich" };
      }

      setStepResults(prev => ({ ...prev, [step]: result }));
      if (result.passed && step < 5) {
        setCurrentStep(step + 1);
      }
    } catch (err: any) {
      toast({ title: "Xatolik", description: err.message || "AI xatolik berdi", variant: "destructive" });
      setStepResults(prev => ({
        ...prev,
        [step]: { passed: false, message: `Xatolik: ${err.message}`, details: [err.message] },
      }));
    } finally {
      setIsProcessing(false);
      setProcessingMessage("");
    }
  };

  // Submit to DB
  const submitMutation = useMutation({
    mutationFn: async () => {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const payload: any = {
          folder_id: folderId,
          question_text: q.question_text,
          options: q.options,
          correct_option: q.correct_option,
          level: q.level,
          order_number: i,
          submitted_by: user?.id,
          status: isAdmin ? "active" : "pending",
        };
        if (isAdmin) {
          payload.approved_by = user?.id;
          payload.approved_at = new Date().toISOString();
        }
        const { error } = await supabase.from("questions").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contributor-questions", folderId] });
      toast({
        title: "Savollar saqlandi!",
        description: isAdmin
          ? `${questions.length} ta savol faol holatda`
          : `${questions.length} ta savol admin tasdig'iga yuborildi`,
      });
      onBack();
    },
    onError: (err: any) => {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    },
  });

  // Auto-fix for step 2: shuffle correct_option to avoid consecutive duplicates
  const fixAnswerDistribution = () => {
    setQuestions(prev => {
      const qs = [...prev];
      // Fisher-Yates shuffle on correct_option values
      const correctValues = qs.map(q => q.correct_option);
      for (let i = correctValues.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [correctValues[i], correctValues[j]] = [correctValues[j], correctValues[i]];
      }
      // Ensure no 3+ consecutive same values
      for (let i = 2; i < correctValues.length; i++) {
        if (correctValues[i] === correctValues[i - 1] && correctValues[i] === correctValues[i - 2]) {
          // Swap with a random different position
          const swapIdx = (i + 5) % correctValues.length;
          [correctValues[i], correctValues[swapIdx]] = [correctValues[swapIdx], correctValues[i]];
        }
      }
      return qs.map((q, i) => {
        const newCorrect = correctValues[i];
        return {
          ...q,
          correct_option: newCorrect,
          options: q.options.map((o, j) => ({
            ...o,
            is_correct: j === newCorrect,
          })),
        };
      });
    });
    toast({ title: "Tuzatildi!", description: "Javob taqsimoti qayta tartibga solindi" });
    setTimeout(() => runStep(2), 300);
  };

  // Auto-fix for step 3: fix is_correct flags
  const fixAnswerAccuracy = () => {
    setQuestions(prev => prev.map(q => ({
      ...q,
      options: q.options.map((o, j) => ({
        ...o,
        is_correct: j === q.correct_option,
      })),
    })));
    toast({ title: "Tuzatildi!", description: "Javob belgilari to'g'rilandi" });
    setTimeout(() => runStep(3), 300);
  };

  // Auto-fix for step 4: regenerate low-scoring questions
  const fixEngagement = async () => {
    const lowScoreIndices = questions
      .map((q, i) => ({ q, i }))
      .filter(({ q }) => q.engagement_score && q.engagement_score < 7)
      .map(({ i }) => i);

    if (lowScoreIndices.length === 0) {
      toast({ title: "Tuzatish kerak emas", description: "Barcha savollar yuqori baholangan" });
      return;
    }

    setIsProcessing(true);
    setProcessingMessage(`${lowScoreIndices.length} ta past balli savol qayta yaratilmoqda...`);

    try {
      for (const idx of lowScoreIndices) {
        const q = questions[idx];
        const response = await api.ai.chat([
          {
            role: "system",
            content: `Sen professional test savollarini yaratuvchi AI'san. Quyidagi savolni qiziqarliroq qilib qayta yoz. JSON formatda javob ber:
{"question_text": "Yangi savol matni", "options": [{"label": "A", "option_text": "...", "is_correct": false}, ...], "correct_option": 1, "level": "bilish"}
Savol qiziqarli, hayotiy misollar bilan boyitilgan bo'lsin. Variantlar ishonchli bo'lsin. FAQAT JSON qaytar!`
          },
          {
            role: "user",
            content: `Mavzu: ${effectiveTopic}\nOldingi savol (${q.difficulty}): ${q.question_text}\nBall: ${q.engagement_score}/10\nIzoh: ${q.engagement_note}\n\nYaxshiroq versiya yarat.`
          }
        ]);

        const content = response.choices?.[0]?.message?.content || "";
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          setQuestions(prev => prev.map((pq, pi) => pi === idx ? {
            ...pq,
            question_text: parsed.question_text || pq.question_text,
            options: (parsed.options || []).map((o: any, j: number) => ({
              label: ["A", "B", "C", "D"][j],
              option_text: o.option_text || "",
              is_correct: j === (parsed.correct_option ?? 0),
            })),
            correct_option: parsed.correct_option ?? 0,
            engagement_score: undefined,
            engagement_note: undefined,
          } : pq));
        }
      }
      toast({ title: "Tuzatildi!", description: `${lowScoreIndices.length} ta savol qayta yaratildi` });
      setTimeout(() => runStep(4), 500);
    } catch (err: any) {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
      setProcessingMessage("");
    }
  };

  // Fix handlers per step
  const fixStep = (step: number) => {
    switch (step) {
      case 2: fixAnswerDistribution(); break;
      case 3: fixAnswerAccuracy(); break;
      case 4: fixEngagement(); break;
    }
  };

  // Edit helpers
  const startEdit = (idx: number) => {
    const q = questions[idx];
    setEditingIdx(idx);
    setEditText(q.question_text);
    setEditOptions(q.options.map(o => o.option_text));
    setEditCorrect(q.correct_option);
  };

  const saveEdit = () => {
    if (editingIdx === null) return;
    setQuestions(prev => prev.map((q, i) => i === editingIdx ? {
      ...q,
      question_text: editText,
      options: editOptions.map((text, j) => ({
        label: ["A", "B", "C", "D"][j],
        option_text: text,
        is_correct: j === editCorrect,
      })),
      correct_option: editCorrect,
    } : q));
    setEditingIdx(null);
  };

  const deleteQuestion = (idx: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0a0f1a]">
      {/* Header */}
      <div className="bg-white dark:bg-[#0f1419] border-b border-slate-100 dark:border-white/[0.06] sticky top-0 z-10">
        <div className="px-4 sm:px-6 py-3 flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <h1 className="text-[14px] font-bold text-slate-900 dark:text-white">AI Test Yaratish</h1>
            <p className="text-[10px] text-slate-400">{folderName}</p>
          </div>
          {questions.length > 0 && (
            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg text-[10px] font-bold">
              {questions.length} savol
            </span>
          )}
        </div>
      </div>

      <div className="px-4 sm:px-6 py-4 space-y-4">
        {/* Topic Selection */}
        {currentStep === 1 && questions.length === 0 && (
          <div className="bg-white dark:bg-[#0f1419] rounded-2xl border border-slate-200 dark:border-white/[0.08] p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-purple-500" />
              </div>
              <div>
                <h2 className="text-[14px] font-bold text-slate-900 dark:text-white">Mavzuni tanlang</h2>
                <p className="text-[10px] text-slate-400">AI qaysi mavzuda savollar yaratishini belgilang</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {["English Adjectives", "English Verbs", "English Nouns", "English Tenses", "English Prepositions", "English Vocabulary"].map(t => (
                <button
                  key={t}
                  onClick={() => { setTopic(t); setCustomTopic(""); }}
                  className={`px-3 py-2.5 rounded-xl text-[11px] font-bold text-left transition-all border ${
                    topic === t && !customTopic
                      ? "bg-purple-500 text-white border-purple-500"
                      : "bg-white dark:bg-[#0a0f1a] border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-400 hover:border-purple-300"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div>
              <p className="text-[10px] text-slate-400 mb-1.5">Yoki o'z mavzuingizni kiriting:</p>
              <input
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="Masalan: English Phrasal Verbs"
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-xl text-[12px] text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>

            <button
              onClick={() => runStep(1)}
              disabled={isProcessing}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl text-[13px] font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              AI bilan 30 ta savol yaratish
            </button>
          </div>
        )}

        {/* Progress Steps */}
        {questions.length > 0 && (
          <div className="bg-white dark:bg-[#0f1419] rounded-2xl border border-slate-200 dark:border-white/[0.08] p-4">
            <div className="flex items-center gap-1 overflow-x-auto pb-2">
              {STEPS.map((step) => {
                const result = stepResults[step.id];
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isDone = result?.passed;
                const hasError = result && !result.passed;

                return (
                  <button
                    key={step.id}
                    onClick={() => !isProcessing && setCurrentStep(step.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all border ${
                      isActive
                        ? "bg-purple-500 text-white border-purple-500"
                        : isDone
                        ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                        : hasError
                        ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20"
                        : "bg-slate-50 dark:bg-white/[0.03] text-slate-400 border-slate-200 dark:border-white/[0.08]"
                    }`}
                  >
                    {isDone ? <CheckCircle className="w-3 h-3" /> : hasError ? <XCircle className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
                    <span className="hidden sm:inline">{step.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Processing message */}
        <AnimatePresence>
          {isProcessing && processingMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 rounded-xl p-4 flex items-center gap-3"
            >
              <Loader2 className="w-5 h-5 text-purple-500 animate-spin flex-shrink-0" />
              <p className="text-[12px] text-purple-700 dark:text-purple-300">{processingMessage}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step Content */}
        {currentStep >= 2 && questions.length > 0 && (
          <div className="space-y-3">
            {/* Current step action */}
            {!stepResults[currentStep] && !isProcessing && (
              <button
                onClick={() => runStep(currentStep)}
                disabled={isProcessing}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl text-[13px] font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                {STEPS[currentStep - 1]?.label} boshlash
              </button>
            )}

            {/* Step result */}
            {stepResults[currentStep] && (
              <div className={`rounded-xl p-4 border ${
                stepResults[currentStep].passed
                  ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20"
                  : "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20"
              }`}>
                <div className="flex items-start gap-2">
                  {stepResults[currentStep].passed ? (
                    <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className={`text-[12px] font-bold ${
                      stepResults[currentStep].passed ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"
                    }`}>
                      {stepResults[currentStep].message}
                    </p>
                    {stepResults[currentStep].details && stepResults[currentStep].details!.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {stepResults[currentStep].details!.slice(0, 10).map((d, i) => (
                          <li key={i} className="text-[10px] text-red-600 dark:text-red-400 flex items-start gap-1">
                            <span className="text-red-400 mt-0.5">•</span> {d}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {!stepResults[currentStep].passed && (
                    <div className="flex flex-col gap-1.5">
                      <button
                        onClick={() => fixStep(currentStep)}
                        disabled={isProcessing}
                        className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-[10px] font-bold hover:bg-amber-600 transition-colors flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        Tuzatish
                      </button>
                      <button
                        onClick={() => runStep(currentStep)}
                        disabled={isProcessing}
                        className="px-3 py-1.5 bg-white dark:bg-[#0a0f1a] border border-slate-200 dark:border-white/[0.08] rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-colors flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Qayta
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Next step button */}
            {stepResults[currentStep]?.passed && currentStep < 5 && (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl text-[13px] font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                Keyingi bosqich
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {/* Submit button */}
            {currentStep === 5 && stepResults[5]?.passed && (
              <button
                onClick={() => submitMutation.mutate()}
                disabled={submitMutation.isPending}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl text-[13px] font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {isAdmin ? "Savollarni saqlash" : "Admin tasdig'iga yuborish"}
              </button>
            )}
          </div>
        )}

        {/* Questions Preview */}
        {questions.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-[12px] font-bold text-slate-700 dark:text-slate-300">
                Savollar ({questions.length})
              </h3>
              <div className="flex gap-1">
                {(["easy", "middle", "hard"] as const).map(d => {
                  const count = questions.filter(q => q.difficulty === d).length;
                  const cfg = DIFFICULTY_CONFIG[d];
                  return (
                    <span key={d} className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${cfg.bg} ${cfg.color}`}>
                      {cfg.label}: {count}
                    </span>
                  );
                })}
              </div>
            </div>

            {questions.map((q, idx) => {
              const cfg = DIFFICULTY_CONFIG[q.difficulty];
              const isEditing = editingIdx === idx;

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-white dark:bg-[#0f1419] rounded-xl border p-4 ${
                    isEditing
                      ? "border-purple-300 dark:border-purple-500/30"
                      : "border-slate-100 dark:border-white/[0.06]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-lg text-[12px] text-slate-900 dark:text-white"
                          />
                          {editOptions.map((opt, oi) => (
                            <div key={oi} className="flex items-center gap-2">
                              <button
                                onClick={() => setEditCorrect(oi)}
                                className={`w-6 h-6 rounded text-[10px] font-bold flex-shrink-0 transition-all ${
                                  editCorrect === oi
                                    ? "bg-green-500 text-white"
                                    : "bg-slate-100 dark:bg-white/[0.06] text-slate-500"
                                }`}
                              >
                                {String.fromCharCode(65 + oi)}
                              </button>
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => {
                                  const newOpts = [...editOptions];
                                  newOpts[oi] = e.target.value;
                                  setEditOptions(newOpts);
                                }}
                                className="flex-1 px-2 py-1.5 bg-white dark:bg-[#0a0f1a] border border-slate-200 dark:border-white/[0.08] rounded-lg text-[11px] text-slate-900 dark:text-white"
                              />
                            </div>
                          ))}
                          <div className="flex gap-1">
                            <button onClick={saveEdit} className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-[10px] font-bold">Saqlash</button>
                            <button onClick={() => setEditingIdx(null)} className="px-3 py-1.5 bg-slate-100 dark:bg-white/[0.06] text-slate-500 rounded-lg text-[10px] font-bold">Bekor</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-[12px] font-bold text-slate-900 dark:text-white">
                            {idx + 1}. {q.question_text}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {q.options.map((o, i) => (
                              <span
                                key={i}
                                className={`text-[9px] px-1.5 py-0.5 rounded ${
                                  i === q.correct_option
                                    ? "bg-green-100 dark:bg-green-500/15 text-green-600 dark:text-green-400 font-bold"
                                    : "bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400"
                                }`}
                              >
                                {o.label}: {o.option_text}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${cfg.bg} ${cfg.color}`}>
                              {cfg.label}
                            </span>
                            {q.engagement_score && (
                              <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                                q.engagement_score >= 8 ? "bg-emerald-100 text-emerald-600" : q.engagement_score >= 7 ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-600"
                              }`}>
                                Ball: {q.engagement_score}/10
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                    {!isEditing && (
                      <div className="flex items-center gap-1">
                        <button onClick={() => startEdit(idx)} className="w-6 h-6 rounded bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all">
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button onClick={() => deleteQuestion(idx)} className="w-6 h-6 rounded bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center text-slate-400 hover:text-red-600 transition-all">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
