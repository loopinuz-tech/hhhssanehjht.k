import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStudentAuth } from "@/hooks/useStudentAuth";
import { supabase } from "@/integrations/studentSupabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Book2Icon } from "@solar-icons/react/bold-duotone/book-2";
import { StarsIcon } from "@solar-icons/react/bold-duotone/stars";
import { CpuIcon } from "@solar-icons/react/bold-duotone/cpu";
import { CupIcon } from "@solar-icons/react/bold-duotone/cup";
import { VolumeLoudIcon } from "@solar-icons/react/bold-duotone/volume-loud";
import { MagnifierIcon } from "@solar-icons/react/bold-duotone/magnifier";
import { AddSquareIcon } from "@solar-icons/react/bold-duotone/add-square";
import { StarIcon } from "@solar-icons/react/bold-duotone/star";
import { AddCircleIcon } from "@solar-icons/react/bold-duotone/add-circle";
import { CheckCircleIcon } from "@solar-icons/react/bold-duotone/check-circle";
import { TrashBinTrashIcon } from "@solar-icons/react/bold-duotone/trash-bin-trash";
import { RestartIcon } from "@solar-icons/react/bold-duotone/restart";
import { AltArrowLeftIcon } from "@solar-icons/react/bold-duotone/alt-arrow-left";
import { AltArrowRightIcon } from "@solar-icons/react/bold-duotone/alt-arrow-right";
import { Pen2Icon } from "@solar-icons/react/bold-duotone/pen-2";
import { CloseCircleIcon } from "@solar-icons/react/bold-duotone/close-circle";
import { PlayCircleIcon } from "@solar-icons/react/bold-duotone/play-circle";
import { RefreshCircleIcon } from "@solar-icons/react/bold-duotone/refresh-circle";
import { RocketIcon } from "@solar-icons/react/bold-duotone/rocket";
import { DisketteIcon } from "@solar-icons/react/bold-duotone/diskette";
import { FilterIcon } from "@solar-icons/react/bold-duotone/filter";
import { UserIcon } from "@solar-icons/react/bold-duotone/user";
import { CopyIcon } from "@solar-icons/react/bold-duotone/copy";
import { EyeIcon } from "@solar-icons/react/bold-duotone/eye";
import { CodeSquareIcon } from "@solar-icons/react/bold-duotone/code-square";
import { HamburgerMenuIcon } from "@solar-icons/react/bold-duotone/hamburger-menu";
import { AltArrowUpIcon } from "@solar-icons/react/bold-duotone/alt-arrow-up";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import VocabMemoryTrainer from "@/components/student/VocabMemoryTrainer";
import ReadingTrainer from "@/pages/ReadingTrainer";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

import { useLocation, useNavigate } from "react-router-dom";

interface AIResult {
  word: string;
  partOfSpeech: string;
  uzbekTranslation: string;
  definition: string;
  examples: string[];
  synonyms: string[];
  antonyms: string[];
  memoryTrick: string | any;
}

interface RealtimeSuggestion {
  word: string;
  uzbek: string;
  synonyms: string[];
}

const extractJSON = (text: string) => {
  const sanitize = (s: string) => s.replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim();
  try {
    return JSON.parse(sanitize(text));
  } catch {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      return JSON.parse(sanitize(match[1]));
    }
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end > start) {
      return JSON.parse(sanitize(text.slice(start, end + 1)));
    }
    throw new Error("Invalid JSON response");
  }
};

const normalizeMath = (text: string) => {
  if (typeof text !== "string") return text;
  return text.replace(/\\\[/g, "$$$$").replace(/\\\]/g, "$$$$").replace(/\\\(/g, "$$").replace(/\\\)/g, "$$");
};

const removeEmojis = (text: string) => {
  if (typeof text !== "string") return text;
  return text.replace(/[\u{1F000}-\u{1FFFF}]|[\u2600-\u27BF]|[\u{2700}-\u{27BF}]|[\u{FE00}-\u{FE0F}]|[\u{200D}]/gu, "");
};

const ensureString = (val: any): string => {
  if (val === null || val === undefined) return "";
  if (typeof val === "string") return val;
  if (typeof val === "object") {
    return Object.entries(val).map(([k, v]) => `${k}: ${ensureString(v)}`).join(" | ");
  }
  return String(val);
};

const speakWord = (word: string) => {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "en-US";
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  }
};

export default function Vocabulary() {
  const { user } = useStudentAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const location = useLocation();
  const navigate = useNavigate();
  const isGameRoute = location.pathname.endsWith('/game');

  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ word: "", meaning: "" });
  const [aiSearch, setAiSearch] = useState("");
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiResult, setShowAiResult] = useState(false);
  const [realtimeSuggestions, setRealtimeSuggestions] = useState<RealtimeSuggestion[]>([]);
  const [realtimeLoading, setRealtimeLoading] = useState(false);
  const realtimeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [flashcardMode, setFlashcardMode] = useState(false);
  const [memoryTrainerMode, setMemoryTrainerMode] = useState(isGameRoute);
  const [trainerMode, setTrainerMode] = useState<string>(isGameRoute ? 'runner' : 'menu');
  const [readingTrainerMode, setReadingTrainerMode] = useState(false);

  useEffect(() => {
    if (isGameRoute) {
      setMemoryTrainerMode(true);
      setTrainerMode('runner');
    }
  }, [isGameRoute]);

  const handleCloseMemoryTrainer = () => {
    setMemoryTrainerMode(false);
    setTrainerMode('menu');
    if (location.pathname.endsWith('/game')) {
      navigate('/lugat');
    }
  };
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [flashcardFlipped, setFlashcardFlipped] = useState(false);
  const [sentenceInput, setSentenceInput] = useState("");
  const [sentenceChecking, setSentenceChecking] = useState(false);
  const [sentenceFeedback, setSentenceFeedback] = useState<{ correct: boolean; feedback: string; correctedSentence: string } | null>(null);
  const [dailyQuizActive, setDailyQuizActive] = useState(false);
  const [quizWord, setQuizWord] = useState<any>(null);
  const [quizAnswer, setQuizAnswer] = useState("");
  const [quizResult, setQuizResult] = useState<null | "correct" | "wrong">(null);
  const [quizDismissed, setQuizDismissed] = useState(false);
  const [editingWordId, setEditingWordId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ word: "", meaning: "" });
  const [sortBy, setSortBy] = useState<"newest" | "az" | "za" | "level">("newest");
  const [filterBy, setFilterBy] = useState<"all" | "learned" | "unlearned">("all");
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewWords, setReviewWords] = useState<any[]>([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [reviewFlipped, setReviewFlipped] = useState(false);
  const [reviewScore, setReviewScore] = useState({ correct: 0, wrong: 0 });
  const [showCheatCode, setShowCheatCode] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [studentWords, setStudentWords] = useState<any[]>([]);
  const [loadingStudentWords, setLoadingStudentWords] = useState(false);
  const [compareMode, setCompareMode] = useState(false);

  const { data: rankConfigs = [] } = useQuery({
    queryKey: ["ranks-config"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("ranks_config").select("*").order("min_words", { ascending: true });
      return data || [];
    },
  });

  const getRank = (wordCount: number) => {
    const rank = rankConfigs.find((r: any) => wordCount >= r.min_words && wordCount <= r.max_words);
    return rank?.name || "Beginner";
  };

  const getNextRankInfo = (wordCount: number) => {
    const currentRankIndex = rankConfigs.findIndex((r: any) => wordCount >= r.min_words && wordCount <= r.max_words);
    if (currentRankIndex === -1 || currentRankIndex === rankConfigs.length - 1) return null;
    const nextRank = rankConfigs[currentRankIndex + 1];
    return { name: nextRank.name, remaining: nextRank.min_words - wordCount };
  };

  const { data: topStudents = [], isLoading: loadingLeaderboard } = useQuery({
    queryKey: ["top-students"],
    queryFn: async () => {
      try {
        const { data, error } = await (supabase as any).rpc("get_vocab_leaderboard");
        if (error) throw error;
        if (!data || data.length === 0) return [];
        return (data as any[]).map((row: any) => ({
          user_id: row.u_id,
          display_name: row.d_name,
          wordCount: Number(row.learned_count),
          totalCount: Number(row.total_count),
          rank: getRank(Number(row.learned_count)),
        }));
      } catch (e: any) {
        console.error("Leaderboard error:", e);
        return [];
      }
    },
  });

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showAiResult) { setShowAiResult(false); setAiResult(null); }
        else if (showCheatCode) setShowCheatCode(false);
        else if (reviewMode) setReviewMode(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [showCheatCode, reviewMode]);

  const viewStudentWords = async (studentId: string) => {
    setLoadingStudentWords(true);
    try {
      const { data, error } = await supabase.from("vocabulary").select("*").eq("user_id", studentId).order("created_at", { ascending: false });
      if (error) throw error;
      setStudentWords(data || []);
    } catch (e: any) {
      toast({ title: "Xatolik", description: e.message, variant: "destructive" });
    } finally {
      setLoadingStudentWords(false);
    }
  };

  const { data: words = [] } = useQuery({
    queryKey: ["vocabulary", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("vocabulary").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  useEffect(() => {
    const unlearnedForQuiz = words.filter((w: any) => !w.learned);
    if (unlearnedForQuiz.length > 0 && !quizDismissed && !dailyQuizActive && !flashcardMode && !reviewMode) {
      setQuizWord(unlearnedForQuiz[Math.floor(Math.random() * unlearnedForQuiz.length)]);
      setDailyQuizActive(true);
    }
  }, [words, quizDismissed, flashcardMode, reviewMode]);

  const checkQuizAnswer = () => {
    if (!quizWord || !quizAnswer.trim()) return;
    const meaning = ensureString(quizWord.meaning).toLowerCase();
    const answer = quizAnswer.trim().toLowerCase();
    if (meaning.includes(answer) || answer.includes(meaning.split("—")[0].trim())) {
      setQuizResult("correct");
      toast({ title: "To'g'ri!" });
    } else {
      setQuizResult("wrong");
    }
  };

  const dismissQuiz = () => {
    setDailyQuizActive(false);
    setQuizDismissed(true);
    setQuizAnswer("");
    setQuizResult(null);
  };

  const nextQuizWord = () => {
    const unlearnedForQuiz = words.filter((w: any) => !w.learned);
    setQuizWord(unlearnedForQuiz[Math.floor(Math.random() * unlearnedForQuiz.length)]);
    setQuizAnswer("");
    setQuizResult(null);
  };

  const startReview = () => {
    const learnedWords = words.filter((w: any) => w.learned);
    if (learnedWords.length === 0) {
      toast({ title: "O'rganilgan so'zlar yo'q", variant: "destructive" });
      return;
    }
    const shuffled = [...learnedWords].sort(() => Math.random() - 0.5);
    setReviewWords(shuffled);
    setReviewIndex(0);
    setReviewFlipped(false);
    setReviewScore({ correct: 0, wrong: 0 });
    setMemoryTrainerMode(false);
    setShowCheatCode(false);
    setReviewMode(true);
  };

  const reviewAnswer = (knew: boolean) => {
    if (knew) setReviewScore((s) => ({ ...s, correct: s.correct + 1 }));
    else setReviewScore((s) => ({ ...s, wrong: s.wrong + 1 }));
    if (reviewIndex + 1 < reviewWords.length) {
      setReviewIndex((i) => i + 1);
      setReviewFlipped(false);
    } else {
      toast({ title: `Takrorlash tugadi! ${reviewScore.correct + (knew ? 1 : 0)}/${reviewWords.length} esda qolgan` });
      setReviewMode(false);
    }
  };

  const toggleLearned = useMutation({
    mutationFn: async ({ id, learned }: { id: string; learned: boolean }) => {
      const { error } = await (supabase as any).from("vocabulary").update({ learned, last_reviewed: learned ? new Date().toISOString() : null }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vocabulary"] }),
  });

  const addWord = useMutation({
    mutationFn: async (params?: { word: string; meaning: string; memory_trick?: string }) => {
      const w = params || form;
      const { error } = await (supabase.from("vocabulary") as any).insert({ user_id: user!.id, word: w.word, meaning: w.meaning, memory_trick: (w as any).memory_trick });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vocabulary"] });
      setForm({ word: "", meaning: "" });
      setShowForm(false);
      toast({ title: "So'z saqlandi!" });
    },
    onError: (e: any) => toast({ title: "Xatolik", description: e.message, variant: "destructive" }),
  });

  const deleteWord = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vocabulary").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vocabulary"] }),
  });

  const updateWord = useMutation({
    mutationFn: async ({ id, word, meaning }: { id: string; word: string; meaning: string }) => {
      const { error } = await (supabase.from("vocabulary") as any).update({ word, meaning }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vocabulary"] });
      setEditingWordId(null);
      toast({ title: "So'z yangilandi!" });
    },
    onError: (e: any) => toast({ title: "Xatolik", description: e.message, variant: "destructive" }),
  });

  const startEditWord = (w: any) => {
    setEditingWordId(w.id);
    setEditForm({ word: w.word, meaning: w.meaning });
  };

  const searchAI = async () => {
    if (!aiSearch.trim()) return;
    setAiLoading(true);
    setAiResult(null);
    setRealtimeSuggestions([]);
    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "mistral-tiny",
          messages: [
            { role: "system", content: "Vocabulary assistant. Return JSON only: { \"word\": \"...\", \"partOfSpeech\": \"noun/verb/adj/...\", \"uzbekTranslation\": \"tarjima\", \"definition\": \"2-3 qator ta'rif, oddiy tilda\", \"examples\": [\"2-3 ta real misol\"], \"synonyms\": [\"3-4 ta sinonim\"], \"antonyms\": [\"2-3 ta antonim\"], \"memoryTrick\": \"eslab qolish usuli, 2-3 jumlada, oddiy va tushunarli\" }. Markdown islatma, faqat oddiy matn yoz." },
            { role: "user", content: `Translate and explain the word: ${aiSearch.trim()}` },
          ],
          response_format: { type: "json_object" },
        }),
      });
      const data = await response.json();
      if (data.choices?.[0]) {
        setAiResult(extractJSON(data.choices[0].message.content));
        setShowAiResult(true);
        setMemoryTrainerMode(false);
        setReviewMode(false);
        setShowCheatCode(false);
      }
    } catch (e: any) {
      toast({ title: "AI xatolik", description: e.message, variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  const saveAIWord = () => {
    if (!aiResult) return;
    addWord.mutate({ word: aiResult.word, meaning: `${aiResult.uzbekTranslation} — ${aiResult.definition}`, memory_trick: aiResult.memoryTrick });
    setAiResult(null);
    setAiSearch("");
  };

  const checkSentence = async (word: string, sentence: string) => {
    setSentenceChecking(true);
    setSentenceFeedback(null);
    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "mistral-tiny",
          messages: [
            { role: "system", content: "You are an English teacher. Check if the user's sentence correctly uses the target word. Respond in JSON format: { \"correct\": boolean, \"feedback\": \"...\", \"correctedSentence\": \"...\" }" },
            { role: "user", content: `Target word: ${word}. User sentence: ${sentence}` },
          ],
          response_format: { type: "json_object" },
        }),
      });
      const data = await response.json();
      if (data.choices?.[0]) {
        setSentenceFeedback(extractJSON(data.choices[0].message.content));
      }
    } catch (e: any) {
      toast({ title: "AI xatolik", description: e.message, variant: "destructive" });
    } finally {
      setSentenceChecking(false);
    }
  };

  const filtered = words
    .filter((w: any) => {
      const matchSearch = ensureString(w.word).toLowerCase().includes(search.toLowerCase()) || ensureString(w.meaning).toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
      if (filterBy === "learned") return w.learned;
      if (filterBy === "unlearned") return !w.learned;
      return true;
    })
    .sort((a: any, b: any) => {
      if (sortBy === "az") return a.word.localeCompare(b.word);
      if (sortBy === "za") return b.word.localeCompare(a.word);
      if (sortBy === "level") return (b.memory_level || 0) - (a.memory_level || 0);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const unlearnedWords = words.filter((w: any) => !w.learned);
  const learnedWords = words.filter((w: any) => w.learned);
  const learnedCount = learnedWords.length;
  const todayCount = words.filter((w: any) => w.date_added === new Date().toISOString().slice(0, 10)).length;

  function renderMainLugatContent() {
    return (
      <div className="w-full bg-[#F8FAFC] dark:bg-[#0B0F1A] px-3.5 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Red Header Card - Clean Inline Layout */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#E8192C] via-[#C41420] to-[#8B0000] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-md text-white">
          <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20 shrink-0">
                <Book2Icon size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">Lug'at</h1>
                <p className="text-xs text-white/80 font-medium">So'z boyligingizni tizimli oshiring</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap text-xs font-bold w-full xl:w-auto">
              <button onClick={() => { setMemoryTrainerMode(true); setReviewMode(false); setShowCheatCode(false); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition-all active:scale-95">
                <CpuIcon size={16} /> Xotira
              </button>
              <button onClick={() => setReadingTrainerMode(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition-all active:scale-95">
                <Book2Icon size={16} /> Matn
              </button>
              {learnedCount > 0 && (
                <button onClick={startReview}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition-all active:scale-95">
                  <RefreshCircleIcon className="w-3.5 h-3.5" /> Takrorlash ({learnedCount})
                </button>
              )}
              {unlearnedWords.length > 0 && (
                <button onClick={() => { setFlashcardMode(true); setFlashcardIndex(0); setFlashcardFlipped(false); setMemoryTrainerMode(false); setReviewMode(false); setShowCheatCode(false); }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition-all active:scale-95">
                  <RestartIcon className="w-3.5 h-3.5" /> Flashcard
                </button>
              )}
              <button onClick={() => { setShowCheatCode(true); setMemoryTrainerMode(false); setReviewMode(false); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-400/30 text-white backdrop-blur-md transition-all active:scale-95">
                <CodeSquareIcon className="w-3.5 h-3.5" /> Cheat-code
              </button>
              <button onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-[#E8192C] font-black shadow-md hover:bg-slate-100 transition-all active:scale-95">
                <AddSquareIcon size={16} /> So'z Qo'shish
              </button>
            </div>
          </div>
        </div>

        <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Daily Quiz Modal */}
          <AnimatePresence>
            {dailyQuizActive && quizWord && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-800 space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CpuIcon className="w-5 h-5 text-[#E8192C]" />
                      <h3 className="font-semibold text-slate-900 dark:text-white">Kunlik Takrorlash</h3>
                    </div>
                    <button onClick={dismissQuiz} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <CloseCircleIcon className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                  <div className="text-center py-4">
                    <p className="text-xs text-slate-500 mb-2">Bu so'z nima ma'noni bildiradi?</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{quizWord.word}</p>
                    <button onClick={() => speakWord(quizWord.word)}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E8192C]/10 text-[#E8192C] text-xs font-medium transition-colors">
                      <VolumeLoudIcon className="w-3.5 h-3.5" /> Tinglash
                    </button>
                  </div>
                  {quizResult === null ? (
                    <div className="space-y-3">
                      <input type="text" value={quizAnswer} onChange={(e) => setQuizAnswer(e.target.value)}
                        placeholder="Ma'nosini yozing..."
                        onKeyDown={(e) => e.key === "Enter" && checkQuizAnswer()}
                        className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:border-[#E8192C] focus:outline-none transition-colors placeholder:text-slate-400" />
                      <button onClick={checkQuizAnswer} disabled={!quizAnswer.trim()}
                        className="w-full px-4 py-3 rounded-xl bg-[#E8192C] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
                        Tekshirish
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className={`rounded-xl p-4 text-center ${quizResult === "correct" ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}`}>
                        <p className={`font-medium ${quizResult === "correct" ? "text-emerald-600" : "text-red-600"}`}>
                          {quizResult === "correct" ? "✓ To'g'ri!" : "✗ Noto'g'ri"}
                        </p>
                        <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">Javob: {quizWord.meaning}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={nextQuizWord}
                          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                          Keyingi so'z
                        </button>
                        <button onClick={dismissQuiz}
                          className="flex-1 px-4 py-2.5 rounded-xl bg-[#E8192C] text-white text-sm font-medium hover:opacity-90 transition-opacity">
                          Davom etish
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-center">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{words.length}</p>
              <p className="text-xs text-slate-500 mt-1">Jami</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-center">
              <p className="text-2xl font-bold text-emerald-600">{learnedCount}</p>
              <p className="text-xs text-slate-500 mt-1">O'rganilgan</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-center">
              <p className="text-2xl font-bold text-amber-600">{unlearnedWords.length}</p>
              <p className="text-xs text-slate-500 mt-1">O'rganilmagan</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-center">
              <p className="text-2xl font-bold text-[#E8192C]">{todayCount}</p>
              <p className="text-xs text-slate-500 mt-1">Bugun</p>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <CupIcon className="w-5 h-5 text-amber-500" />
              <h3 className="font-semibold text-slate-900 dark:text-white">The Triumph of Effort</h3>
            </div>
            <div className="flex overflow-x-auto pb-2 gap-4">
              {topStudents.length > 0 ? topStudents.slice(0, 10).map((s: any) => (
                <div key={s.user_id} className="shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl min-w-[160px] text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#E8192C]/10 flex items-center justify-center mx-auto">
                    <UserIcon className="w-6 h-6 text-[#E8192C]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{s.display_name || "O'quvchi"}</p>
                    <Badge variant="outline" className="text-[10px] mt-1 text-[#E8192C] border-[#E8192C]/20">{s.rank}</Badge>
                  </div>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                    <p className="text-[11px] font-semibold text-[#E8192C]">{s.wordCount} ta</p>
                    <p className="text-[8px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">O'rganilgan</p>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-slate-500">Hali hech kim so'z yodlamagan.</p>
              )}
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 w-full">
              <MagnifierIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="So'z qidirish..."
                className="w-full pl-9 pr-3 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:border-[#E8192C] focus:outline-none transition-colors placeholder:text-slate-400" />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}
                className="h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-700 dark:text-slate-300 focus:border-[#E8192C] focus:outline-none transition-colors">
                <option value="newest">Eng yangi</option>
                <option value="az">A-Z</option>
                <option value="za">Z-A</option>
              </select>
              <select value={filterBy} onChange={(e) => setFilterBy(e.target.value as any)}
                className="h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-700 dark:text-slate-300 focus:border-[#E8192C] focus:outline-none transition-colors">
                <option value="all">Barchasi</option>
                <option value="learned">O'rganilgan</option>
                <option value="unlearned">O'rganilmagan</option>
              </select>
            </div>
          </div>

          {/* Add Word Form */}
          <AnimatePresence>
            {showForm && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Yangi so'z qo'shish</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input type="text" value={form.word} onChange={(e) => setForm({ ...form, word: e.target.value })}
                    placeholder="Inglizcha so'z"
                    className="h-10 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:border-[#E8192C] focus:outline-none transition-colors placeholder:text-slate-400" />
                  <input type="text" value={form.meaning} onChange={(e) => setForm({ ...form, meaning: e.target.value })}
                    placeholder="Ma'nosi (o'zbekcha)"
                    className="h-10 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:border-[#E8192C] focus:outline-none transition-colors placeholder:text-slate-400" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => addWord.mutate(undefined)} disabled={addWord.isPending || !form.word.trim() || !form.meaning.trim()}
                    className="px-5 py-2.5 rounded-xl bg-[#E8192C] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
                    {addWord.isPending ? "..." : "Saqlash"}
                  </button>
                  <button onClick={() => { setShowForm(false); setForm({ word: "", meaning: "" }); }}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    Bekor qilish
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* AI Search */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <StarsIcon className="w-4 h-4 text-[#E8192C]" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">AI yordamida izlash</h3>
            </div>
            <div className="flex gap-2">
              <input type="text" value={aiSearch} onChange={(e) => setAiSearch(e.target.value)}
                placeholder="So'zni kiriting..."
                onKeyDown={(e) => e.key === "Enter" && searchAI()}
                className="flex-1 h-10 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:border-[#E8192C] focus:outline-none transition-colors placeholder:text-slate-400" />
              <button onClick={searchAI} disabled={aiLoading || !aiSearch.trim()}
                className="px-5 py-2.5 rounded-xl bg-[#E8192C] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
                {aiLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Izlash"}
              </button>
            </div>
          </div>

          {/* Word List */}
          {filtered.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
              <Book2Icon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-500">
                {search ? "Hech narsa topilmadi" : "Hali so'zlar yo'q. Yuqoridagi form orqali qo'shing!"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.slice(0, 50).map((w: any) => (
                <motion.div key={w.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 transition-colors hover:border-slate-300 dark:hover:border-slate-700">
                  {editingWordId === w.id ? (
                    <div className="space-y-3">
                      <input type="text" value={editForm.word} onChange={(e) => setEditForm((f) => ({ ...f, word: e.target.value }))}
                        placeholder="So'z"
                        className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:border-[#E8192C] focus:outline-none transition-colors placeholder:text-slate-400" />
                      <input type="text" value={editForm.meaning} onChange={(e) => setEditForm((f) => ({ ...f, meaning: e.target.value }))}
                        placeholder="Ma'nosi"
                        className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:border-[#E8192C] focus:outline-none transition-colors placeholder:text-slate-400" />
                      <div className="flex gap-2">
                        <button onClick={() => updateWord.mutate({ id: w.id, word: editForm.word, meaning: editForm.meaning })}
                          disabled={updateWord.isPending || !editForm.word.trim() || !editForm.meaning.trim()}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E8192C] text-white text-xs font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
                          <DisketteIcon className="w-3 h-3" /> Saqlash
                        </button>
                        <button onClick={() => setEditingWordId(null)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                          <CloseCircleIcon className="w-3 h-3" /> Bekor
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">{ensureString(w.word)}</span>
                          {w.learned && <StarIcon className="w-3 h-3 text-emerald-600 fill-emerald-600" />}
                          <button onClick={() => speakWord(ensureString(w.word))}
                            className="p-1 rounded text-slate-400 hover:text-[#E8192C] transition-colors" title="Tinglash">
                            <VolumeLoudIcon className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{ensureString(w.meaning)}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        {!w.learned && (
                          <button onClick={() => toggleLearned.mutate({ id: w.id, learned: true })}
                            className="p-1.5 rounded-md text-slate-400 hover:text-emerald-600 transition-colors" title="O'rgandim">
                            <CheckCircleIcon className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => startEditWord(w)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-[#E8192C] transition-colors" title="Tahrirlash">
                          <Pen2Icon className="w-3.5 h-3.5" />
                        </button>
                        <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(w.word + " meaning and usage in English")}`}
                          target="_blank" rel="noopener noreferrer"
                          className="p-1.5 rounded-md text-slate-400 hover:text-red-500 transition-colors" title="YouTubeda qidirish">
                          <PlayCircleIcon className="w-3.5 h-3.5" />
                        </a>
                        <button onClick={() => deleteWord.mutate(w.id)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-red-600 transition-colors">
                          <TrashBinTrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (memoryTrainerMode) {
    if (trainerMode === 'runner') {
      return (
        <div className="w-full min-h-[calc(100vh-56px)] overflow-y-auto bg-[#F8FAFC] dark:bg-[#0B0F1A]">
          <VocabMemoryTrainer 
            words={words as any} 
            onClose={handleCloseMemoryTrainer} 
            onModeChange={(m) => setTrainerMode(m)}
            initialMode={trainerMode as any}
          />
        </div>
      );
    }

    return (
      <div className="h-[calc(100vh-56px)] w-full bg-[#F8FAFC] dark:bg-[#0B0F1A]">
        {/* Mobile View (< md): VocabMemoryTrainer Full Screen */}
        <div className="block md:hidden h-full overflow-y-auto">
          <VocabMemoryTrainer 
            words={words as any} 
            onClose={handleCloseMemoryTrainer} 
            onModeChange={(m) => setTrainerMode(m)}
            initialMode={trainerMode as any}
          />
        </div>

        {/* Desktop View (>= md): 50/50 Horizontal Split View */}
        <div className="hidden md:block h-full">
          <PanelGroup direction="horizontal" autoSaveId="vocab-trainer-split">
            <Panel defaultSize={50} minSize={30} maxSize={70} className="border-r border-slate-200 dark:border-slate-800">
              <div className="h-full overflow-y-auto">
                {renderMainLugatContent()}
              </div>
            </Panel>

            <PanelResizeHandle className="w-1 bg-slate-200 dark:bg-slate-800 hover:bg-emerald-500 transition-colors" />

            <Panel defaultSize={50} minSize={30} className="h-full overflow-y-auto">
              <VocabMemoryTrainer 
                words={words as any} 
                onClose={handleCloseMemoryTrainer} 
                onModeChange={(m) => setTrainerMode(m)}
                initialMode={trainerMode as any}
              />
            </Panel>
          </PanelGroup>
        </div>
      </div>
    );
  }

  const rightPanelMode: 'review' | 'cheatCode' | 'aiResult' | null = (reviewMode && reviewWords.length > 0) ? 'review' : showCheatCode ? 'cheatCode' : showAiResult ? 'aiResult' : null;

  if (rightPanelMode) {
    return (
      <div className="h-screen">
        <PanelGroup direction="horizontal" autoSaveId="vocab-split">
          <Panel defaultSize={50} minSize={25} maxSize={75} className="max-md:hidden">
            <div className="h-full overflow-y-auto border-r border-slate-200 dark:border-slate-800">
              <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                {/* Daily Quiz Modal */}
                <AnimatePresence>
                  {dailyQuizActive && quizWord && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-800 space-y-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CpuIcon className="w-5 h-5 text-[#E8192C]" />
                            <h3 className="font-semibold text-slate-900 dark:text-white">Kunlik Takrorlash</h3>
                          </div>
                          <button onClick={dismissQuiz} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            <CloseCircleIcon className="w-4 h-4 text-slate-400" />
                          </button>
                        </div>
                        <div className="text-center py-4">
                          <p className="text-xs text-slate-500 mb-2">Bu so'z nima ma'noni bildiradi?</p>
                          <p className="text-2xl font-bold text-slate-900 dark:text-white">{quizWord.word}</p>
                          <button onClick={() => speakWord(quizWord.word)}
                            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E8192C]/10 text-[#E8192C] text-xs font-medium transition-colors">
                            <VolumeLoudIcon className="w-3.5 h-3.5" /> Tinglash
                          </button>
                        </div>
                        {quizResult === null ? (
                          <div className="space-y-3">
                            <input type="text" value={quizAnswer} onChange={(e) => setQuizAnswer(e.target.value)}
                              placeholder="Ma'nosini yozing..."
                              onKeyDown={(e) => e.key === "Enter" && checkQuizAnswer()}
                              className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:border-[#E8192C] focus:outline-none transition-colors placeholder:text-slate-400" />
                            <button onClick={checkQuizAnswer} disabled={!quizAnswer.trim()}
                              className="w-full px-4 py-3 rounded-xl bg-[#E8192C] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
                              Tekshirish
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className={`rounded-xl p-4 text-center ${quizResult === "correct" ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}`}>
                              <p className={`font-medium ${quizResult === "correct" ? "text-emerald-600" : "text-red-600"}`}>
                                {quizResult === "correct" ? "To'g'ri!" : "Noto'g'ri"}
                              </p>
                              <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">Javob: {quizWord.meaning}</p>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={nextQuizWord}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                Keyingi so'z
                              </button>
                              <button onClick={dismissQuiz}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-[#E8192C] text-white text-sm font-medium hover:opacity-90 transition-opacity">
                                Davom etish
                              </button>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Header without the Xotira button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Lug'at</h1>
                    <p className="text-sm text-slate-500 mt-1">So'z boyligingizni tizimli oshiring</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={() => setReadingTrainerMode(true)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <Book2Icon className="w-4 h-4" /> Matn
                    </button>
                    {learnedCount > 0 && (
                      <button onClick={startReview}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <RefreshCircleIcon className="w-4 h-4" /> Takrorlash ({learnedCount})
                      </button>
                    )}
                    {unlearnedWords.length > 0 && (
                      <button onClick={() => { setFlashcardMode(true); setFlashcardIndex(0); setFlashcardFlipped(false); setMemoryTrainerMode(false); setReviewMode(false); setShowCheatCode(false); }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <RestartIcon className="w-4 h-4" /> Flashcard
                      </button>
                    )}
                    <button onClick={() => { setShowCheatCode(true); setMemoryTrainerMode(false); setReviewMode(false); }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 text-sm font-medium hover:bg-amber-100 transition-colors">
                      <CodeSquareIcon className="w-4 h-4" /> Cheat-code
                    </button>
                    <button onClick={() => setShowForm(!showForm)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E8192C] text-white text-sm font-medium hover:opacity-90 transition-opacity">
                      <AddCircleIcon className="w-4 h-4" /> So'z Qo'shish
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-center">
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{words.length}</p>
                    <p className="text-xs text-slate-500 mt-1">Jami</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-center">
                    <p className="text-2xl font-bold text-emerald-600">{learnedCount}</p>
                    <p className="text-xs text-slate-500 mt-1">O'rganilgan</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-center">
                    <p className="text-2xl font-bold text-amber-600">{unlearnedWords.length}</p>
                    <p className="text-xs text-slate-500 mt-1">O'rganilmagan</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-center">
                    <p className="text-2xl font-bold text-[#E8192C]">{todayCount}</p>
                    <p className="text-xs text-slate-500 mt-1">Bugun</p>
                  </div>
                </div>

                {/* Leaderboard */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <CupIcon className="w-5 h-5 text-amber-500" />
                    <h3 className="font-semibold text-slate-900 dark:text-white">The Triumph of Effort</h3>
                  </div>
                  <div className="flex overflow-x-auto pb-2 gap-4">
                    {topStudents.length > 0 ? topStudents.slice(0, 10).map((s: any) => (
                      <div key={s.user_id} className="shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl min-w-[160px] text-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-[#E8192C]/10 flex items-center justify-center mx-auto">
                          <UserIcon className="w-6 h-6 text-[#E8192C]" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{s.display_name || "O'quvchi"}</p>
                          <span className="inline-block text-[10px] mt-1 text-[#E8192C] border border-[#E8192C]/20 rounded-full px-2 py-0.5">{s.rank}</span>
                        </div>
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                          <p className="text-[11px] font-semibold text-[#E8192C]">{s.wordCount} ta</p>
                          <p className="text-[8px] font-medium text-slate-400 uppercase tracking-wide mt-0.5">O'rganilgan</p>
                        </div>
                      </div>
                    )) : (
                      <p className="text-sm text-slate-500">Hali hech kim so'z yodlamagan.</p>
                    )}
                  </div>
                </div>

                {/* Search & Filter Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="relative flex-1 w-full">
                    <MagnifierIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                      placeholder="So'z qidirish..."
                      className="w-full pl-9 pr-3 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:border-[#E8192C] focus:outline-none transition-colors placeholder:text-slate-400" />
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}
                      className="h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-700 dark:text-slate-300 focus:border-[#E8192C] focus:outline-none transition-colors">
                      <option value="newest">Eng yangi</option>
                      <option value="az">A-Z</option>
                      <option value="za">Z-A</option>
                    </select>
                    <select value={filterBy} onChange={(e) => setFilterBy(e.target.value as any)}
                      className="h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-700 dark:text-slate-300 focus:border-[#E8192C] focus:outline-none transition-colors">
                      <option value="all">Barchasi</option>
                      <option value="learned">O'rganilgan</option>
                      <option value="unlearned">O'rganilmagan</option>
                    </select>
                  </div>
                </div>

                {/* Add Word Form */}
                <AnimatePresence>
                  {showForm && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Yangi so'z qo'shish</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input type="text" value={form.word} onChange={(e) => setForm({ ...form, word: e.target.value })}
                          placeholder="Inglizcha so'z"
                          className="h-10 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:border-[#E8192C] focus:outline-none transition-colors placeholder:text-slate-400" />
                        <input type="text" value={form.meaning} onChange={(e) => setForm({ ...form, meaning: e.target.value })}
                          placeholder="Ma'nosi (o'zbekcha)"
                          className="h-10 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:border-[#E8192C] focus:outline-none transition-colors placeholder:text-slate-400" />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => addWord.mutate(undefined)} disabled={addWord.isPending || !form.word.trim() || !form.meaning.trim()}
                          className="px-5 py-2.5 rounded-xl bg-[#E8192C] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
                          {addWord.isPending ? "..." : "Saqlash"}
                        </button>
                        <button onClick={() => { setShowForm(false); setForm({ word: "", meaning: "" }); }}
                          className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                          Bekor qilish
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* AI Search */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <StarsIcon className="w-4 h-4 text-[#E8192C]" />
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">AI yordamida izlash</h3>
                  </div>
                  <div className="flex gap-2">
                    <input type="text" value={aiSearch} onChange={(e) => setAiSearch(e.target.value)}
                      placeholder="So'zni kiriting..."
                      onKeyDown={(e) => e.key === "Enter" && searchAI()}
                      className="flex-1 h-10 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:border-[#E8192C] focus:outline-none transition-colors placeholder:text-slate-400" />
                    <button onClick={searchAI} disabled={aiLoading || !aiSearch.trim()}
                      className="px-5 py-2.5 rounded-xl bg-[#E8192C] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
                      {aiLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Izlash"}
                    </button>
                  </div>
                </div>

                {/* Word list */}
                <div className="space-y-3">
                  {filtered.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      <Book2Icon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p className="text-sm font-medium">So'zlar topilmadi</p>
                      <p className="text-xs mt-1">Yangi so'z qo'shing yoki qidiruvni o'zgartiring</p>
                    </div>
                  ) : (
                    filtered.map((w: any, i: number) => (
                      <motion.div key={w.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-[#E8192C]/20 transition-all">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-base font-semibold text-slate-900 dark:text-white">{w.word}</p>
                              {w.learned && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 font-medium">O'rganilgan</span>
                              )}
                              {w.memory_level > 2 && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 font-medium">Daraja {w.memory_level}</span>
                              )}
                              <button onClick={() => speakWord(w.word)}
                                className="p-1 rounded text-slate-400 hover:text-[#E8192C] transition-colors">
                                <VolumeLoudIcon className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{w.meaning}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => toggleLearned.mutate({ id: w.id, learned: !w.learned })}
                              className={`p-1.5 rounded-md transition-colors ${w.learned ? "text-emerald-500" : "text-slate-300 hover:text-emerald-500"}`}>
                              <CheckCircleIcon className="w-4 h-4" />
                            </button>
                            <button onClick={() => startEditWord(w)}
                              className="p-1.5 rounded-md text-slate-400 hover:text-blue-500 transition-colors">
                              <Pen2Icon className="w-3.5 h-3.5" />
                            </button>
                            {editingWordId === w.id && (
                              <div className="flex items-center gap-1">
                                <input type="text" value={editForm.word} onChange={(e) => setEditForm({ ...editForm, word: e.target.value })}
                                  className="w-24 h-7 px-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-white" />
                                <input type="text" value={editForm.meaning} onChange={(e) => setEditForm({ ...editForm, meaning: e.target.value })}
                                  className="w-24 h-7 px-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-white" />
                                <button onClick={() => updateWord.mutate({ id: w.id, word: editForm.word, meaning: editForm.meaning })}
                                  className="p-1 rounded text-emerald-500 hover:text-emerald-600">
                                  <DisketteIcon className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                            <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(w.word + " meaning and usage in English")}`}
                              target="_blank" rel="noopener noreferrer"
                              className="p-1.5 rounded-md text-slate-400 hover:text-red-500 transition-colors" title="YouTubeda qidirish">
                              <PlayCircleIcon className="w-3.5 h-3.5" />
                            </a>
                            <button onClick={() => deleteWord.mutate(w.id)}
                              className="p-1.5 rounded-md text-slate-400 hover:text-red-600 transition-colors">
                              <TrashBinTrashIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </Panel>

          <PanelResizeHandle className="w-[5px] bg-slate-200 dark:bg-slate-800 hover:bg-[#E8192C]/30 transition-colors cursor-col-resize flex items-center justify-center group">
            <HamburgerMenuIcon className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#E8192C] transition-colors" />
          </PanelResizeHandle>

          <Panel defaultSize={50} minSize={25} maxSize={75}>
            <div className="h-full overflow-y-auto bg-white dark:bg-slate-900">
              {rightPanelMode === 'review' && reviewWords.length > 0 && (
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Takrorlash</h2>
                    <button onClick={() => setReviewMode(false)} className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">Yopish ×</button>
                  </div>
                  {(() => {
                    const card = reviewWords[reviewIndex];
                    const progress = reviewIndex + 1;
                    return (
                      <>
                        <div className="flex items-center justify-between text-sm text-slate-500">
                          <span>{progress} / {reviewWords.length}</span>
                          <span className="flex gap-3">
                            <span className="text-emerald-600">✓ {reviewScore.correct}</span>
                            <span className="text-red-600">✗ {reviewScore.wrong}</span>
                          </span>
                        </div>
                        <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full">
                          <div className="h-full rounded-full bg-[#E8192C] transition-all" style={{ width: `${(progress / reviewWords.length) * 100}%` }} />
                        </div>
                        <div className="flex items-center justify-center min-h-[200px]">
                          <motion.div
                            key={card.id + (reviewFlipped ? "-back" : "-front")}
                            initial={{ rotateY: 90, opacity: 0 }}
                            animate={{ rotateY: 0, opacity: 1 }}
                            transition={{ duration: 0.25 }}
                            onClick={() => setReviewFlipped(!reviewFlipped)}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 cursor-pointer w-full max-w-md text-center select-none"
                          >
                            {!reviewFlipped ? (
                              <>
                                <p className="text-3xl font-bold text-slate-900 dark:text-white mb-3">{card.word}</p>
                                <button onClick={(e) => { e.stopPropagation(); speakWord(card.word); }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E8192C]/10 text-[#E8192C] text-xs font-medium transition-colors mb-2">
                                  <VolumeLoudIcon className="w-3.5 h-3.5" /> Tinglash
                                </button>
                                <p className="text-xs text-slate-500">Ma'nosini bilasizmi? Bosing</p>
                              </>
                            ) : (
                              <>
                                <p className="text-lg text-slate-900 dark:text-white mb-2">{card.meaning}</p>
                                <p className="text-xs text-slate-500">Esladingizmi?</p>
                              </>
                            )}
                          </motion.div>
                        </div>
                        {reviewFlipped && (
                          <div className="flex items-center justify-center gap-4">
                            <button onClick={() => reviewAnswer(false)}
                              className="flex-1 max-w-[160px] py-3 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-200 transition-colors hover:bg-red-100">
                              ✗ Eslamadim
                            </button>
                            <button onClick={() => reviewAnswer(true)}
                              className="flex-1 max-w-[160px] py-3 rounded-xl bg-emerald-50 text-emerald-600 text-sm font-medium border border-emerald-200 transition-colors hover:bg-emerald-100">
                              ✓ Esladim
                            </button>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
              {rightPanelMode === 'cheatCode' && (
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-200">
                        <CodeSquareIcon className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Cheat-code Leaderboard</h3>
                        <p className="text-xs text-slate-500">Top Vocabulary Masters</p>
                      </div>
                    </div>
                    <button onClick={() => setShowCheatCode(false)}
                      className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <CloseCircleIcon className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>
                  <div className="flex flex-col gap-6">
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
                      <div className="p-4 border-b border-slate-200 dark:border-slate-800 font-medium text-[10px] uppercase tracking-wider text-slate-500 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                        <span>Talabalar Reytingi</span>
                        {loadingLeaderboard && <div className="w-3 h-3 border border-[#E8192C]/30 border-t-[#E8192C] rounded-full animate-spin" />}
                      </div>
                      <div className="max-h-60 overflow-y-auto p-2 space-y-1">
                        {topStudents.length === 0 ? (
                          <div className="p-8 text-center text-xs text-slate-400 italic">Hali talabalar yo'q</div>
                        ) : (
                          topStudents.map((s: any, i: number) => (
                            <motion.div key={s.user_id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                              onClick={() => { setSelectedStudent(s); viewStudentWords(s.user_id); }}
                              className={`p-3 rounded-xl cursor-pointer transition-all border ${selectedStudent?.user_id === s.user_id ? "bg-[#E8192C] text-white border-[#E8192C]" : "hover:bg-slate-50 dark:hover:bg-slate-800 border-transparent"}`}>
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs ${selectedStudent?.user_id === s.user_id ? "bg-white/20" : "bg-[#E8192C]/10 text-[#E8192C]"}`}>{i + 1}</div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold truncate">{s.display_name || "Talaba"}</p>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <Badge variant="outline" className={`text-[8px] h-3.5 px-1 ${selectedStudent?.user_id === s.user_id ? "bg-white/20 text-white border-white/30" : "text-[#E8192C] border-[#E8192C]/20"}`}>{s.rank}</Badge>
                                    <p className={`text-[10px] font-medium ${selectedStudent?.user_id === s.user_id ? "text-white/80" : "text-slate-400"}`}>{s.wordCount}/{s.totalCount} so'z</p>
                                  </div>
                                </div>
                                <AltArrowRightIcon className={`w-4 h-4 opacity-50 ${selectedStudent?.user_id === s.user_id ? "rotate-90" : ""}`} />
                              </div>
                            </motion.div>
                          ))
                        )}
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden min-h-[200px]">
                      {!selectedStudent ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-40">
                          <UserIcon className="w-12 h-12 mb-4 text-slate-400" />
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Foydalanuvchini tanlang</p>
                          <p className="text-xs text-slate-500">Uning so'zlarini ko'rish va o'zingizga nusxalash uchun</p>
                        </div>
                      ) : (
                        <>
                          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex items-center justify-between shrink-0 gap-4">
                            <div className="flex items-center gap-2 min-w-0">
                              <EyeIcon className="w-4 h-4 text-[#E8192C] shrink-0" />
                              <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">{selectedStudent.display_name} lug'ati</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => setCompareMode(!compareMode)}
                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all border ${compareMode ? "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700" : "bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-[#E8192C]/30"}`}>
                                <AltArrowUpIcon className="w-3 h-3" /> {compareMode ? "Solishtirildi" : "Solishtirish"}
                              </button>
                              <span className="text-[10px] font-medium text-slate-500 whitespace-nowrap">{studentWords.length} ta so'z</span>
                            </div>
                          </div>
                          <div className="max-h-80 overflow-y-auto p-4 space-y-3">
                            {loadingStudentWords ? (
                              <div className="flex items-center justify-center h-20">
                                <div className="w-6 h-6 border-2 border-[#E8192C]/30 border-t-[#E8192C] rounded-full animate-spin" />
                              </div>
                            ) : studentWords.filter((sw: any) => !compareMode || !words.some((uw: any) => ensureString(uw.word).toLowerCase() === ensureString(sw.word).toLowerCase())).length === 0 ? (
                              <div className="text-center py-12 text-slate-500">
                                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                                  {compareMode ? <CheckCircleIcon className="w-6 h-6 text-emerald-600" /> : <Book2Icon className="w-6 h-6 opacity-20" />}
                                </div>
                                <p className="text-xs font-medium">{compareMode ? "Barcha so'zlar sizda ham bor!" : "Bu foydalanuvchida hali so'zlar yo'q."}</p>
                              </div>
                            ) : (
                              studentWords
                                .filter((sw: any) => !compareMode || !words.some((uw: any) => ensureString(uw.word).toLowerCase() === ensureString(sw.word).toLowerCase()))
                                .map((w: any, i: number) => (
                                  <motion.div key={w.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                                    className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{w.word}</p>
                                        {w.learned && (
                                          <Badge className="h-4 px-1.5 text-[8px] bg-emerald-50 text-emerald-600 border-emerald-200">O'rganilgan</Badge>
                                        )}
                                      </div>
                                      <p className="text-xs text-slate-500 mt-0.5 truncate">{w.meaning}</p>
                                    </div>
                                    {compareMode && (
                                      <button onClick={() => addWord.mutate({ word: w.word, meaning: w.meaning })}
                                        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E8192C]/10 text-[#E8192C] text-[10px] font-medium hover:bg-[#E8192C] hover:text-white transition-colors">
                                        <CopyIcon className="w-3 h-3" /> Nusxalash
                                      </button>
                                    )}
                                  </motion.div>
                                ))
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {rightPanelMode === 'aiResult' && aiResult && (
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StarsIcon className="w-5 h-5 text-[#E8192C]" />
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">AI natijasi</h2>
                    </div>
                    <button onClick={() => { setShowAiResult(false); setAiResult(null); }}
                      className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <CloseCircleIcon className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-5 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{ensureString(aiResult.word)}</h3>
                        <button onClick={() => speakWord(ensureString(aiResult.word))}
                          className="w-10 h-10 rounded-full bg-[#E8192C]/10 flex items-center justify-center text-[#E8192C] hover:bg-[#E8192C]/20 transition-colors">
                          <VolumeLoudIcon className="w-5 h-5" />
                        </button>
                      </div>
                      <button onClick={saveAIWord}
                        className="px-4 py-2 rounded-xl bg-[#E8192C] text-white text-xs font-medium hover:opacity-90 transition-opacity">
                        <AddCircleIcon className="w-3 h-3 inline mr-1" /> Saqlash
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400">{ensureString(aiResult.partOfSpeech)}</span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-1">O'zbekcha</p>
                      <div className="text-sm text-slate-900 dark:text-white">
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{normalizeMath(ensureString(aiResult.uzbekTranslation))}</ReactMarkdown>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-1">Ta'rif</p>
                      <div className="text-sm text-slate-700 dark:text-slate-300">
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{normalizeMath(ensureString(aiResult.definition))}</ReactMarkdown>
                      </div>
                    </div>
                    {aiResult.examples && aiResult.examples.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-500 font-medium mb-1">Misollar</p>
                        <ul className="list-disc list-inside space-y-1">
                          {aiResult.examples.map((ex, i) => (
                            <li key={i} className="text-sm text-slate-700 dark:text-slate-300">
                              <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{normalizeMath(ex)}</ReactMarkdown>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {(aiResult.synonyms?.length > 0 || aiResult.antonyms?.length > 0) && (
                      <div className="flex gap-6">
                        {aiResult.synonyms?.length > 0 && (
                          <div>
                            <p className="text-xs text-slate-500 font-medium mb-1">Sinonimlar</p>
                            <div className="flex flex-wrap gap-1">
                              {aiResult.synonyms.map((syn, i) => (
                                <span key={i} className="text-xs px-2 py-1 rounded bg-emerald-50 text-emerald-700">
                                  <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{normalizeMath(syn)}</ReactMarkdown>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {aiResult.antonyms?.length > 0 && (
                          <div>
                            <p className="text-xs text-slate-500 font-medium mb-1">Antonimlar</p>
                            <div className="flex flex-wrap gap-1">
                              {aiResult.antonyms.map((ant, i) => (
                                <span key={i} className="text-xs px-2 py-1 rounded bg-red-50 text-red-700">
                                  <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{normalizeMath(ant)}</ReactMarkdown>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {aiResult.memoryTrick && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <p className="text-xs font-semibold text-amber-700 mb-1">Eslab qolish usuli</p>
                        <div className="text-xs text-amber-800 leading-relaxed">
                          <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{normalizeMath(removeEmojis(ensureString(aiResult.memoryTrick)))}</ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Panel>
        </PanelGroup>
      </div>
    );
  }

  if (readingTrainerMode) {
    return <ReadingTrainer onClose={() => setReadingTrainerMode(false)} />;
  }



  if (flashcardMode && unlearnedWords.length > 0) {
    const card = unlearnedWords[flashcardIndex % unlearnedWords.length];
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Flashcardlar</h2>
          <button onClick={() => { setFlashcardMode(false); setFlashcardFlipped(false); setSentenceInput(""); setSentenceFeedback(null); }}
            className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">← Orqaga</button>
        </div>
        <p className="text-sm text-slate-500">{flashcardIndex % unlearnedWords.length + 1} / {unlearnedWords.length} o'rganilmagan so'z</p>
        <div className="flex items-center justify-center min-h-[250px]">
          <motion.div
            key={card.id + (flashcardFlipped ? "-back" : "-front")}
            initial={{ rotateY: 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            transition={{ duration: 0.25 }}
            onClick={() => setFlashcardFlipped(!flashcardFlipped)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 cursor-pointer w-full max-w-lg text-center select-none"
          >
            {!flashcardFlipped ? (
              <>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mb-3">{card.word}</p>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <button onClick={(e) => { e.stopPropagation(); speakWord(card.word); }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E8192C]/10 text-[#E8192C] text-xs font-medium transition-colors">
                    <VolumeLoudIcon className="w-3.5 h-3.5" /> Tinglash
                  </button>
                  <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(card.word + " meaning and usage in English")}`}
                    target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium transition-colors">
                    <PlayCircleIcon className="w-3.5 h-3.5" /> YouTube
                  </a>
                </div>
                <p className="text-xs text-slate-500">Tarjimani ko'rish uchun bosing</p>
              </>
            ) : (
              <>
                <p className="text-lg text-slate-900 dark:text-white mb-2">{card.meaning}</p>
                <p className="text-xs text-slate-500">So'zni ko'rish uchun bosing</p>
              </>
            )}
          </motion.div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Pen2Icon className="w-4 h-4 text-[#E8192C]" />
            <p className="text-sm font-medium text-slate-900 dark:text-white">O'rgandim deyish uchun gap tuzing</p>
          </div>
          <p className="text-xs text-slate-500">"{card.word}" so'zini ishlatib inglizcha gap yozing. AI tekshiradi.</p>
          <div className="flex gap-2">
            <input type="text" value={sentenceInput} onChange={(e) => setSentenceInput(e.target.value)}
              placeholder={`"${card.word}" bilan gap yozing...`}
              onKeyDown={(e) => e.key === "Enter" && sentenceInput.trim() && checkSentence(card.word, sentenceInput)}
              className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:border-[#E8192C] focus:outline-none transition-colors placeholder:text-slate-400" />
            <button onClick={() => checkSentence(card.word, sentenceInput)} disabled={sentenceChecking || !sentenceInput.trim()}
              className="px-4 py-2.5 rounded-xl bg-[#E8192C] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
              {sentenceChecking ? "..." : "Tekshirish"}
            </button>
          </div>
          <AnimatePresence>
            {sentenceFeedback && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className={`rounded-xl p-4 text-sm ${sentenceFeedback.correct ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}`}>
                <p className={sentenceFeedback.correct ? "text-emerald-600 font-medium" : "text-red-600 font-medium"}>
                  {sentenceFeedback.correct ? "✓ To'g'ri!" : "✗ Noto'g'ri"}
                </p>
                <p className="text-slate-700 dark:text-slate-300 text-xs mt-1">{sentenceFeedback.feedback}</p>
                {sentenceFeedback.correctedSentence && (
                  <p className="text-xs text-slate-500 mt-1">To'g'ri variant: <em>{sentenceFeedback.correctedSentence}</em></p>
                )}
                {sentenceFeedback.correct && (
                  <button onClick={async () => {
                    await (supabase.from("vocabulary") as any).update({ learned: true, last_reviewed: new Date().toISOString() }).eq("id", card.id);
                    queryClient.invalidateQueries({ queryKey: ["vocabulary"] });
                    setSentenceInput("");
                    setSentenceFeedback(null);
                    setFlashcardFlipped(false);
                  }}
                    className="mt-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-medium hover:opacity-90 transition-opacity">
                    <CheckCircleIcon className="w-3 h-3 inline mr-1" /> O'rgandim deb belgilash
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="flex items-center justify-center gap-4">
          <button onClick={() => { setFlashcardIndex((i) => i - 1 < 0 ? unlearnedWords.length - 1 : i - 1); setFlashcardFlipped(false); setSentenceInput(""); setSentenceFeedback(null); }}
            className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <AltArrowLeftIcon className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          </button>
          <button onClick={() => { setFlashcardIndex((i) => i + 1); setFlashcardFlipped(false); setSentenceInput(""); setSentenceFeedback(null); }}
            className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <AltArrowRightIcon className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F1A]">
      {/* Premium Hero Header - Sticky */}
      <div className="sticky top-[56px] z-30 relative overflow-hidden bg-gradient-to-br from-[#E8192C] via-[#C41420] to-[#8B0000] shadow-md">
        <div className="absolute top-10 right-20 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-20 w-32 h-32 bg-amber-400/20 rounded-full blur-3xl" />
        <div className="relative w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-3.5 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20 shrink-0">
                <Book2Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-white leading-tight">Lug'at</h1>
                <p className="text-xs text-white/70 hidden sm:block">So'z boyligingizni tizimli oshiring</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none shrink-0">
              <button onClick={() => { setMemoryTrainerMode(true); setReviewMode(false); setShowCheatCode(false); }}
                className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 text-white text-xs sm:text-sm font-medium hover:bg-white/25 transition-colors whitespace-nowrap">
                <RocketIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-300" /> Xotira
              </button>
              <button onClick={() => setReadingTrainerMode(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 text-white text-xs sm:text-sm font-medium hover:bg-white/25 transition-colors whitespace-nowrap">
                <Book2Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Matn
              </button>
              {learnedCount > 0 && (
                <button onClick={startReview}
                  className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 text-white text-xs sm:text-sm font-medium hover:bg-white/25 transition-colors whitespace-nowrap">
                  <RefreshCircleIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Takrorlash ({learnedCount})
                </button>
              )}
              {unlearnedWords.length > 0 && (
                <button onClick={() => { setFlashcardMode(true); setFlashcardIndex(0); setFlashcardFlipped(false); setMemoryTrainerMode(false); setReviewMode(false); setShowCheatCode(false); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 text-white text-xs sm:text-sm font-medium hover:bg-white/25 transition-colors whitespace-nowrap">
                  <RestartIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Flashcard
                </button>
              )}
              <button onClick={() => { setShowCheatCode(true); setMemoryTrainerMode(false); setReviewMode(false); }}
                className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-xl bg-amber-400/25 backdrop-blur-sm border border-amber-400/35 text-white text-xs sm:text-sm font-medium hover:bg-amber-400/35 transition-colors whitespace-nowrap">
                <CodeSquareIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-200" /> Cheat-code
              </button>
              <button onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2.5 rounded-xl bg-white text-[#E8192C] text-xs sm:text-sm font-bold hover:bg-white/90 transition-colors shadow-md whitespace-nowrap">
                <AddCircleIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> So'z Qo'shish
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Daily Quiz Modal */}
        <AnimatePresence>
          {dailyQuizActive && quizWord && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-800 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CpuIcon className="w-5 h-5 text-[#E8192C]" />
                    <h3 className="font-semibold text-slate-900 dark:text-white">Kunlik Takrorlash</h3>
                  </div>
                  <button onClick={dismissQuiz} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <CloseCircleIcon className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
                <div className="text-center py-4">
                  <p className="text-xs text-slate-500 mb-2">Bu so'z nima ma'noni bildiradi?</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{quizWord.word}</p>
                  <button onClick={() => speakWord(quizWord.word)}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E8192C]/10 text-[#E8192C] text-xs font-medium transition-colors">
                    <VolumeLoudIcon className="w-3.5 h-3.5" /> Tinglash
                  </button>
                </div>
                {quizResult === null ? (
                  <div className="space-y-3">
                    <input type="text" value={quizAnswer} onChange={(e) => setQuizAnswer(e.target.value)}
                      placeholder="Ma'nosini yozing..."
                      onKeyDown={(e) => e.key === "Enter" && checkQuizAnswer()}
                      className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:border-[#E8192C] focus:outline-none transition-colors placeholder:text-slate-400" />
                    <button onClick={checkQuizAnswer} disabled={!quizAnswer.trim()}
                      className="w-full px-4 py-3 rounded-xl bg-[#E8192C] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
                      Tekshirish
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className={`rounded-xl p-4 text-center ${quizResult === "correct" ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}`}>
                      <p className={`font-medium ${quizResult === "correct" ? "text-emerald-600" : "text-red-600"}`}>
                        {quizResult === "correct" ? "✓ To'g'ri!" : "✗ Noto'g'ri"}
                      </p>
                      <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">Javob: {quizWord.meaning}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={nextQuizWord}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        Keyingi so'z
                      </button>
                      <button onClick={dismissQuiz}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-[#E8192C] text-white text-sm font-medium hover:opacity-90 transition-opacity">
                        Davom etish
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-center">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{words.length}</p>
            <p className="text-xs text-slate-500 mt-1">Jami</p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-center">
            <p className="text-2xl font-bold text-emerald-600">{learnedCount}</p>
            <p className="text-xs text-slate-500 mt-1">O'rganilgan</p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-center">
            <p className="text-2xl font-bold text-amber-600">{unlearnedWords.length}</p>
            <p className="text-xs text-slate-500 mt-1">O'rganilmagan</p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-center">
            <p className="text-2xl font-bold text-[#E8192C]">{todayCount}</p>
            <p className="text-xs text-slate-500 mt-1">Bugun</p>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <CupIcon className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-slate-900 dark:text-white">The Triumph of Effort</h3>
          </div>
          <div className="flex overflow-x-auto pb-2 gap-4">
            {topStudents.length > 0 ? topStudents.slice(0, 10).map((s: any) => (
              <div key={s.user_id} className="shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl min-w-[160px] text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#E8192C]/10 flex items-center justify-center mx-auto">
                  <UserIcon className="w-6 h-6 text-[#E8192C]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{s.display_name || "O'quvchi"}</p>
                  <Badge variant="outline" className="text-[10px] mt-1 text-[#E8192C] border-[#E8192C]/20">{s.rank}</Badge>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                  <p className="text-[11px] font-semibold text-[#E8192C]">{s.wordCount} ta</p>
                  <p className="text-[8px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">O'rganilgan</p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-slate-500">Hali hech kim so'z yodlamagan.</p>
            )}
          </div>
        </div>



        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full">
            <MagnifierIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="So'z qidirish..."
              className="w-full pl-9 pr-3 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:border-[#E8192C] focus:outline-none transition-colors placeholder:text-slate-400" />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}
              className="h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-700 dark:text-slate-300 focus:border-[#E8192C] focus:outline-none transition-colors">
              <option value="newest">Eng yangi</option>
              <option value="az">A-Z</option>
              <option value="za">Z-A</option>
            </select>
            <select value={filterBy} onChange={(e) => setFilterBy(e.target.value as any)}
              className="h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-700 dark:text-slate-300 focus:border-[#E8192C] focus:outline-none transition-colors">
              <option value="all">Barchasi</option>
              <option value="learned">O'rganilgan</option>
              <option value="unlearned">O'rganilmagan</option>
            </select>
          </div>
        </div>

        {/* Add Word Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Yangi so'z qo'shish</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input type="text" value={form.word} onChange={(e) => setForm({ ...form, word: e.target.value })}
                  placeholder="Inglizcha so'z"
                  className="h-10 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:border-[#E8192C] focus:outline-none transition-colors placeholder:text-slate-400" />
                <input type="text" value={form.meaning} onChange={(e) => setForm({ ...form, meaning: e.target.value })}
                  placeholder="Ma'nosi (o'zbekcha)"
                  className="h-10 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:border-[#E8192C] focus:outline-none transition-colors placeholder:text-slate-400" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => addWord.mutate(undefined)} disabled={addWord.isPending || !form.word.trim() || !form.meaning.trim()}
                  className="px-5 py-2.5 rounded-xl bg-[#E8192C] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
                  {addWord.isPending ? "..." : "Saqlash"}
                </button>
                <button onClick={() => { setShowForm(false); setForm({ word: "", meaning: "" }); }}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  Bekor qilish
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Search */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <StarsIcon className="w-4 h-4 text-[#E8192C]" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">AI yordamida izlash</h3>
          </div>
          <div className="flex gap-2">
            <input type="text" value={aiSearch} onChange={(e) => setAiSearch(e.target.value)}
              placeholder="So'zni kiriting..."
              onKeyDown={(e) => e.key === "Enter" && searchAI()}
              className="flex-1 h-10 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:border-[#E8192C] focus:outline-none transition-colors placeholder:text-slate-400" />
            <button onClick={searchAI} disabled={aiLoading || !aiSearch.trim()}
              className="px-5 py-2.5 rounded-xl bg-[#E8192C] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
              {aiLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Izlash"}
            </button>
          </div>
        </div>

        {/* Word List */}
        {filtered.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
            <Book2Icon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500">
              {search ? "Hech narsa topilmadi" : "Hali so'zlar yo'q. Yuqoridagi form orqali qo'shing!"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.slice(0, 50).map((w: any) => (
              <motion.div key={w.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 transition-colors hover:border-slate-300 dark:hover:border-slate-700">
                {editingWordId === w.id ? (
                  <div className="space-y-3">
                    <input type="text" value={editForm.word} onChange={(e) => setEditForm((f) => ({ ...f, word: e.target.value }))}
                      placeholder="So'z"
                      className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:border-[#E8192C] focus:outline-none transition-colors placeholder:text-slate-400" />
                    <input type="text" value={editForm.meaning} onChange={(e) => setEditForm((f) => ({ ...f, meaning: e.target.value }))}
                      placeholder="Ma'nosi"
                      className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:border-[#E8192C] focus:outline-none transition-colors placeholder:text-slate-400" />
                    <div className="flex gap-2">
                      <button onClick={() => updateWord.mutate({ id: w.id, word: editForm.word, meaning: editForm.meaning })}
                        disabled={updateWord.isPending || !editForm.word.trim() || !editForm.meaning.trim()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E8192C] text-white text-xs font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
                        <DisketteIcon className="w-3 h-3" /> Saqlash
                      </button>
                      <button onClick={() => setEditingWordId(null)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <CloseCircleIcon className="w-3 h-3" /> Bekor
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">{ensureString(w.word)}</span>
                        {w.learned && <StarIcon className="w-3 h-3 text-emerald-600 fill-emerald-600" />}
                        <button onClick={() => speakWord(ensureString(w.word))}
                          className="p-1 rounded text-slate-400 hover:text-[#E8192C] transition-colors" title="Tinglash">
                          <VolumeLoudIcon className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{ensureString(w.meaning)}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      {!w.learned && (
                        <button onClick={() => toggleLearned.mutate({ id: w.id, learned: true })}
                          className="p-1.5 rounded-md text-slate-400 hover:text-emerald-600 transition-colors" title="O'rgandim">
                          <CheckCircleIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button onClick={() => startEditWord(w)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-[#E8192C] transition-colors" title="Tahrirlash">
                        <Pen2Icon className="w-3.5 h-3.5" />
                      </button>
                      <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(w.word + " meaning and usage in English")}`}
                        target="_blank" rel="noopener noreferrer"
                        className="p-1.5 rounded-md text-slate-400 hover:text-red-500 transition-colors" title="YouTubeda qidirish">
                        <PlayCircleIcon className="w-3.5 h-3.5" />
                      </a>
                      <button onClick={() => deleteWord.mutate(w.id)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-red-600 transition-colors">
                        <TrashBinTrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
