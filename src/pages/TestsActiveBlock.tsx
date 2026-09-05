import { useState, useCallback } from "react";
import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowLeft, Clock, LayoutGrid, AlertTriangle, Bookmark, CheckCircle2, XCircle, Send, ArrowRight, X, PenLine, Eraser, Trash2, Database, Pen, RefreshCw, Maximize2, Minimize2, Bot, ListOrdered, Info, Sparkles, ChevronRight, ChevronUp, Plus, ArrowUp, Flag, TrendingUp, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import SEO from "@/components/SEO";
import { useTranslation } from "react-i18next";
import { useEduCoin } from "@/hooks/useEduCoin";
import { ModeToggle } from "@/components/ModeToggle";
import Logo from "@/components/layout/Logo";
import Whiteboard from "@/components/Whiteboard";
import { supabase } from "@/integrations/supabase/client";
import { rewriteStorageUrl } from "@/lib/storage";
import { ChatSquareCodeIcon } from "@solar-icons/react/bold-duotone/chat-square-code";
import { Pen2Icon } from "@solar-icons/react/bold-duotone/pen-2";
import { ClockCircleIcon } from "@solar-icons/react/bold-duotone/clock-circle";
import { AltArrowLeftIcon } from "@solar-icons/react/bold-duotone/alt-arrow-left";
import { DangerCircleIcon } from "@solar-icons/react/bold-duotone/danger-circle";
import { BookmarkIcon } from "@solar-icons/react/bold-duotone/bookmark";
import { InfoCircleIcon } from "@solar-icons/react/bold-duotone/info-circle";
import { MaximizeSquare3Icon } from "@solar-icons/react/bold-duotone/maximize-square-3";
import { DocumentTextIcon } from "@solar-icons/react/bold-duotone/document-text";
import { Widget4Icon } from "@solar-icons/react/bold-duotone/widget-4";

const RED = "#E8192C";

interface TestsActiveBlockProps {
  activeFolder: any;
  questions: any[];
  currentQ: number;
  setCurrentQ: (idx: number) => void;
  answers: Record<string, number | null>;
  setAnswers: (val: any) => void;
  timeLeft: number;
  formatTime: (t: number) => string;
  exitTest: () => void;
  aiOpen: boolean;
  setAiOpen: (val: boolean) => void;
  checkedQuestions: Set<string>;
  setCheckedQuestions: (val: Set<string>) => void;
  correctAttempts: Record<string, number>;
  setCorrectAttempts: (val: any) => void;
  questionAttempts: Record<string, number>;
  setQuestionAttempts: (val: any) => void;
  submitting: boolean;
  handleSubmit: () => void;
  zoomedImage: string | null;
  setZoomedImage: (img: string | null) => void;
  setReportOpen: (val: boolean) => void;
  setReportQuestionId: (id: string | null) => void;
  isExplaining: boolean;
  aiExplanation: string;
  explainQuestion: () => void;
  askAiQuestion: (message: string) => Promise<void>;
  getWrongAnswerHints: (question: any, selectedOption: number) => Promise<string[]>;
  playFeedback: (isCorrect: boolean) => void;
  isAiPinned: boolean;
  setIsAiPinned: (val: boolean) => void;
  testMode?: "imtixon" | "mashq" | null;
  reportOpen: boolean;
  setReportOpen: (val: boolean) => void;
  reportMessage: string;
  setReportMessage: (val: string) => void;
  submitReport: () => void;
  isReporting: boolean;
  reportQuestionId: string | null;
  setReportQuestionId: (id: string | null) => void;
}

export const TestsActiveBlock = ({
  activeFolder,
  questions,
  currentQ,
  setCurrentQ,
  answers,
  setAnswers,
  timeLeft,
  formatTime,
  exitTest,
  aiOpen,
  setAiOpen,
  checkedQuestions,
  setCheckedQuestions,
  correctAttempts,
  setCorrectAttempts,
  questionAttempts,
  setQuestionAttempts,
  submitting,
  handleSubmit,
  zoomedImage,
  setZoomedImage,
  isExplaining,
  aiExplanation,
  explainQuestion,
  askAiQuestion,
  getWrongAnswerHints,
  playFeedback,
  isAiPinned,
  setIsAiPinned,
  testMode,
  reportOpen,
  setReportOpen,
  reportMessage,
  setReportMessage,
  submitReport,
  isReporting,
  reportQuestionId,
  setReportQuestionId,
}: TestsActiveBlockProps) => {
  const { t } = useTranslation();
  const { balance: eduBalance, spendCoin } = useEduCoin();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isQuestionGridPopoverOpen, setIsQuestionGridPopoverOpen] = useState(false);
  const [userName, setUserName] = useState<string>(() => {
    try {
      const savedUser = localStorage.getItem("user") || localStorage.getItem("sb-profile");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed.full_name) return parsed.full_name;
        if (parsed.name) return parsed.name;
        if (parsed.first_name) return `${parsed.first_name} ${parsed.last_name || ""}`.trim();
      }
    } catch {}
    return "Foydalanuvchi";
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const metaName = user.user_metadata?.full_name || user.user_metadata?.name || (user.user_metadata?.first_name ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ""}`.trim() : null);
        if (metaName) {
          setUserName(metaName);
        }

        const { data: profData } = await (supabase
          .from("profiles") as any)
          .select("full_name, first_name, last_name, username")
          .or(`user_id.eq.${user.id},id.eq.${user.id}`)
          .maybeSingle();

        if (profData) {
          const fetchedName = profData.full_name || (profData.first_name ? `${profData.first_name} ${profData.last_name || ""}`.trim() : null) || profData.username;
          if (fetchedName) {
            setUserName(fetchedName);
          }
        }
      } catch (e) {
        console.error("Error fetching profile name:", e);
      }
    };

    void fetchUserProfile();
  }, []);
  const q = questions[currentQ];
  const getOptionText = (opt: any): string => {
    if (typeof opt === "string") return opt;
    if (opt && typeof opt === "object") return opt.option_text || opt.text || String(opt);
    return String(opt || "");
  };
  const options: string[] = (q?.options || []).map(getOptionText);
  const answeredCount = Object.keys(answers).length;
  const progressPercent = questions.length ? (answeredCount / questions.length) * 100 : 0;
  const roundedProgress = Math.round(progressPercent);
  const selectedOptionIndex = q ? answers[q.id] : undefined;
  const hasSelectedOption = typeof selectedOptionIndex === "number";
  const selectedOptionLabel = typeof selectedOptionIndex === "number" ? String.fromCharCode(65 + selectedOptionIndex) : null;
  const isCurrentChecked = q ? checkedQuestions.has(q.id) : false;
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Set<string>>(new Set());
  const toggleBookmark = (qId: string) => {
    setBookmarkedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  const [checkResultByQuestion, setCheckResultByQuestion] = useState<Record<string, "correct" | "wrong" | null>>({});
  const [wrongHintModal, setWrongHintModal] = useState<{
    questionId: string;
    optionIndex: number;
    steps: string[];
    currentStep: number;
    loading: boolean;
    isWhiteboardActive?: boolean;
    error?: string;
  } | null>(null);
  const [aiInput, setAiInput] = useState("");
  const [isPanelWhiteboardOpen, setIsPanelWhiteboardOpen] = useState(false);
  const [isGlobalWhiteboardOpen, setIsGlobalWhiteboardOpen] = useState(false);
  const [guidanceOpen, setGuidanceOpen] = useState(false);
  const [isGeneratingGuidance, setIsGeneratingGuidance] = useState(false);
  const [guidanceContent, setGuidanceContent] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);
  const [diagramSvg, setDiagramSvg] = useState("");
  const [isGeneratingDiagram, setIsGeneratingDiagram] = useState(false);
  const [diagramOpen, setDiagramOpen] = useState(false);
  const [aiPanelWidth, setAiPanelWidth] = useState<number>(450);
  const [isResizingAi, setIsResizingAi] = useState<boolean>(false);
  const [aiActiveTab, setAiActiveTab] = useState<"chat" | "explanation" | "info">("explanation");
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [isAskingAi, setIsAskingAi] = useState<boolean>(false);

  const STORAGE_KEY_HIGHLIGHTS = "test_highlights_session";
  const STORAGE_KEY_ELIMINATED = "test_eliminated_session";

  const [highlightsByQuestion, setHighlightsByQuestion] = useState<Record<string, Array<{ id: string; text: string; color: string; isUnderline?: boolean; note?: string }>>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HIGHLIGHTS);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [eliminatedOptions, setEliminatedOptions] = useState<Record<string, number[]>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ELIMINATED);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [isNotesDrawerOpen, setIsNotesDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HIGHLIGHTS, JSON.stringify(highlightsByQuestion));
    } catch (e) {
      console.error(e);
    }
  }, [highlightsByQuestion]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ELIMINATED, JSON.stringify(eliminatedOptions));
    } catch (e) {
      console.error(e);
    }
  }, [eliminatedOptions]);

  const toggleEliminateOption = (qId: string, optionIdx: number) => {
    setEliminatedOptions((prev) => {
      const currentList = prev[qId] || [];
      const exists = currentList.includes(optionIdx);
      const updated = exists ? currentList.filter((idx) => idx !== optionIdx) : [...currentList, optionIdx];
      return { ...prev, [qId]: updated };
    });
  };

  const totalNotesCount = Object.values(highlightsByQuestion).reduce((acc, list) => {
    return acc + list.filter((item) => item.note && item.note.trim().length > 0).length;
  }, 0);

  const [selectionMenu, setSelectionMenu] = useState<{ x: number; y: number; selectedText: string } | null>(null);
  const [activeNoteInput, setActiveNoteInput] = useState<{ selectedText: string; color: string; isUnderline?: boolean } | null>(null);
  const [noteText, setNoteText] = useState("");

  const addHighlight = (qId: string, text: string, color: string, isUnderline = false, note = "") => {
    if (!text || !text.trim()) return;
    setHighlightsByQuestion((prev) => {
      const currentList = prev[qId] || [];
      const filtered = currentList.filter((item) => item.text !== text.trim());
      return {
        ...prev,
        [qId]: [
          ...filtered,
          {
            id: String(Date.now()),
            text: text.trim(),
            color,
            isUnderline,
            note,
          },
        ],
      };
    });
    setSelectionMenu(null);
  };

  const removeHighlight = (qId: string, text: string) => {
    setHighlightsByQuestion((prev) => {
      const currentList = prev[qId] || [];
      return {
        ...prev,
        [qId]: currentList.filter((item) => item.text !== text),
      };
    });
    setSelectionMenu(null);
  };

  const renderHighlightedContent = (text: string, qId: string) => {
    const list = highlightsByQuestion[qId] || [];
    if (!list.length) {
      return (
        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
          {normalizeMathDelimiters(text)}
        </ReactMarkdown>
      );
    }

    const validHighlights = list.filter((h) => h.text && h.text.trim().length > 0);
    if (!validHighlights.length) {
      return (
        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
          {normalizeMathDelimiters(text)}
        </ReactMarkdown>
      );
    }

    const patterns = validHighlights.map((h) => h.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
    const regex = new RegExp(`(${patterns})`, "gi");
    const parts = text.split(regex);

    return (
      <span className="leading-relaxed">
        {parts.map((part, idx) => {
          const match = validHighlights.find((h) => h.text.toLowerCase() === part.toLowerCase());
          if (match) {
            if (match.isUnderline) {
              return (
                <u
                  key={idx}
                  className="decoration-sky-500 underline-offset-4 decoration-2 font-semibold cursor-pointer"
                  title={match.note || undefined}
                >
                  {part}
                </u>
              );
            }

            const bgStyle =
              match.color === "yellow"
                ? "bg-yellow-200 dark:bg-yellow-500/40 text-slate-900 dark:text-yellow-100 border-b-2 border-yellow-400"
                : match.color === "blue"
                ? "bg-sky-200 dark:bg-sky-500/40 text-slate-900 dark:text-sky-100 border-b-2 border-sky-400"
                : "bg-pink-200 dark:bg-pink-500/40 text-slate-900 dark:text-pink-100 border-b-2 border-pink-400";

            return (
              <mark
                key={idx}
                className={`${bgStyle} rounded px-1 py-0.5 font-medium cursor-pointer transition-all hover:brightness-95 inline-block mx-0.5`}
                title={match.note || undefined}
              >
                {part}
                {match.note ? " 📝" : ""}
              </mark>
            );
          }

          return (
            <ReactMarkdown key={idx} remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={{ p: "span" }}>
              {normalizeMathDelimiters(part)}
            </ReactMarkdown>
          );
        })}
      </span>
    );
  };

  const handleQuestionTextMouseUp = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const text = selection.toString().trim();
    if (text.length > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectionMenu({
        x: Math.max(20, rect.left + rect.width / 2),
        y: Math.max(10, rect.top - 55),
        selectedText: text,
      });
    }
  };

  const handleAskAi = async (customText?: string) => {
    const textToAsk = customText || aiInput;
    if (!textToAsk.trim() || isAskingAi) return;
    const userMsg = textToAsk.trim();
    if (!customText) setAiInput("");

    if (eduBalance >= 1) {
      void spendCoin(1, "ai_chat", "AI bilan muloqot uchun");
    }

    setChatMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setAiActiveTab("chat");
    setIsAskingAi(true);

    const lowerMsg = userMsg.toLowerCase();
    if (lowerMsg.includes("dosk") || lowerMsg.includes("canvas") || lowerMsg.includes("yechib ber")) {
      setIsGlobalWhiteboardOpen(true);
    }

    try {
      const systemInstruction = `Siz Eduly AI - o'quvchining aqlli, tajribali va do'stona virtual o'qituvchisisiz.
Foydalanuvchi sizga har qanday mavzuda (matematika, mantiq, fizika, dasturlash, umumiy bilimlar va savollar) murojaat qilishi mumkin.
Har bir savolga o'zbek tilida o'ta tushunarli, aniq va do'stona javob bering.
Matematik va ilmiy formulalarni KaTeX formatida ($...$ yoki $$...$$) ko'rsating.
Agar so'rov joriy test savoliga tegishli bo'lsa, uni tahlil qilishda yordam bering.`;

      const userPrompt = q?.question_text
        ? `[Joriy savol konteksi: "${q.question_text}"]\nFoydalanuvchi so'rovi: ${userMsg}`
        : userMsg;

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "mistral-small-latest",
          messages: [
            { role: "system", content: systemInstruction },
            ...chatMessages.map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: userPrompt },
          ],
        }),
      });
      const data = await response.json();
      if (data.choices?.[0]) {
        const aiReply = data.choices[0].message.content;
        setChatMessages((prev) => [...prev, { role: "assistant", content: aiReply }]);
      } else if (data.error) {
        const errMsg = typeof data.error === "string" ? data.error : (data.error.message || "Xatolik yuz berdi");
        setChatMessages((prev) => [...prev, { role: "assistant", content: `Xatolik: ${errMsg}` }]);
      } else {
        setChatMessages((prev) => [...prev, { role: "assistant", content: "AI javob bermadi. Qayta urinib ko'ring." }]);
      }
    } catch (err: any) {
      setChatMessages((prev) => [...prev, { role: "assistant", content: `Xatolik yuz berdi: ${err?.message || 'Qayta urinib ko\'ring.'}` }]);
    } finally {
      setIsAskingAi(false);
    }
  };

  const parseStepsFromExplanation = (text: string) => {
    if (!text) return [];
    const rawBlocks = text.split(/(?=\*\*\d+-(?:Qadam|step):\*\*|\*\*Qadam \d+:\*\*|\*\*Natija:\*\*|\n\d+-(?:Qadam|step):)/gi);
    const steps: Array<{ number: string | number; title: string; content: string }> = [];

    rawBlocks.forEach((block, idx) => {
      const trimmed = block.trim();
      if (!trimmed) return;

      const headerMatch = trimmed.match(/^(\*\*\d+-(?:Qadam|step):\*\*|\*\*Qadam \d+:\*\*|\*\*Natija:\*\*|\d+-(?:Qadam|step):)/i);

      if (headerMatch) {
        const headerText = headerMatch[0].replace(/\*/g, "").trim();
        const contentText = trimmed.slice(headerMatch[0].length).trim();
        const numMatch = headerText.match(/\d+/);
        const stepNum = numMatch ? parseInt(numMatch[0], 10) : (headerText.toLowerCase().includes("natija") ? "✓" : (idx + 1));
        
        steps.push({
          number: stepNum,
          title: headerText,
          content: contentText || trimmed,
        });
      } else if (trimmed.length > 5) {
        steps.push({
          number: idx + 1,
          title: `${idx + 1}-Qadam`,
          content: trimmed,
        });
      }
    });

    return steps;
  };

  const startResizingAi = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingAi(true);
    const startX = e.clientX;
    const startWidth = aiPanelWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = startX - moveEvent.clientX;
      const newWidth = Math.max(300, Math.min(850, startWidth + deltaX));
      setAiPanelWidth(newWidth);
    };

    const onMouseUp = () => {
      setIsResizingAi(false);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, [aiPanelWidth]);

  const normalizeMathDelimiters = (text: any) => {
    if (!text) return "";
    let str = text.toString();
    // Fix double-escaped LaTeX commands (e.g. \\dots -> \dots)
    str = str.replace(/\\\\([a-zA-Z]+)/g, "\\$1");
    return str
      .replace(/\\\(/g, "$")
      .replace(/\\\)/g, "$")
      .replace(/\\\[/g, "$$")
      .replace(/\\\]/g, "$$");
  };

  const rawQuestionText = q?.question_text || "";
  const questionCodeMatch = rawQuestionText.match(/^\s*\(([^)]+)\)\s*/);
  const questionCode = questionCodeMatch?.[1] || null;
  const questionTextBody = questionCodeMatch ? rawQuestionText.slice(questionCodeMatch[0].length).trimStart() : rawQuestionText;

  const qLabel = `${currentQ + 1}-${t("tests.savol")}`;
  const seoTitle = `${activeFolder?.name || "Test"} - ${qLabel}`;
  const seoDesc = `${activeFolder?.name || ""} ${t("tests.testining")} ${qLabel}i. ${t("tests.seo_desc")}`;
  const currentCheckResult = checkResultByQuestion[q?.id] ?? null;

  const handleCheckCurrentOption = async () => {
    if (!q || answers[q.id] === undefined) return;

    const selectedIndex = answers[q.id] as number;
    const isCorrect = q.correct_option === selectedIndex;
    const currentAttempts = (questionAttempts[q.id] || 0) + 1;

    setQuestionAttempts((prev: Record<string, number>) => ({ ...prev, [q.id]: currentAttempts }));

    if (isCorrect) {
      const newChecked = new Set(checkedQuestions);
      newChecked.add(q.id);
      setCheckedQuestions(newChecked);
      setCorrectAttempts((prev: Record<string, number>) => ({ ...prev, [q.id]: currentAttempts }));
    }

    setCheckResultByQuestion(prev => ({ ...prev, [q.id]: isCorrect ? "correct" : "wrong" }));
    playFeedback(isCorrect);

    if (isCorrect) {
      setWrongHintModal(null);
      return;
    }

    setWrongHintModal({
      questionId: q.id,
      optionIndex: selectedIndex,
      steps: [],
      currentStep: 0,
      loading: true,
    });

    try {
      const steps = await getWrongAnswerHints(q, selectedIndex);
      setWrongHintModal({
        questionId: q.id,
        optionIndex: selectedIndex,
        steps: steps.length ? steps : ["Avval ifodani kichik qismlarga bo'lib ko'ring."],
        currentStep: 0,
        loading: false,
      });
    } catch {
      setWrongHintModal({
        questionId: q.id,
        optionIndex: selectedIndex,
        steps: ["Bog'lanishda xatolik. Qayta urinib ko'ring."],
        currentStep: 0,
        loading: false,
        error: "fetch_error",
      });
    }
  };

  const handleGetGuidance = async () => {
    setGuidanceOpen(true);
    if (guidanceContent && !isGeneratingGuidance) return;
    
    setIsGeneratingGuidance(true);
    setGuidanceContent(""); 
    
    try {
      const q = questions[currentQ];
      const prompt = `Savol: ${q.question_text}\n\nUshbu savolni yechish uchun zarur bo'lgan faqat 1-2 ta asosiy formula va qoidani darhol o'ta qisqa ko'rsating. Ortiqcha matn, kirish va xulosalar yozmang.`;
      
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: "mistral-large-latest",
          messages: [
            { role: "system", content: "Siz faqat formulalar va qoidalarni o'ta qisqa va londa beruvchi yordamchisiz. Ortiqcha gap va xulosalar taqiqlanadi." },
            { role: "user", content: prompt }
          ],
        })
      });

      if (!response.ok) throw new Error('AI request failed');
      const data = await response.json();
      const content = data.choices[0].message.content;

      setGuidanceContent(content);
    } catch (err) {
      setGuidanceContent("Xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.");
    } finally {
      setIsGeneratingGuidance(false);
    }
  };

  useEffect(() => {
    if (aiOpen && !aiExplanation && !isExplaining) {
      void explainQuestion();
    }
  }, [aiOpen]);

  useEffect(() => {
    setGuidanceContent("");
    setGuidanceOpen(false);
    setDiagramOpen(false);
    setDiagramSvg("");
    const center = document.querySelector("section.flex-1.flex.flex-col");
    if (center) center.scrollTop = 0;
    setSearchParams((prev) => { prev.set("q", String(currentQ + 1)); return prev; }, { replace: true });
  }, [currentQ]);

  useEffect(() => {
    if (testMode === "imtixon" && !document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    }
  }, [testMode]);

  const exitTestWithFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
    exitTest();
  }, [exitTest]);

  const generateDiagram = async () => {
    if (!q) return;
    setIsGeneratingDiagram(true);
    setDiagramOpen(true);
    setDiagramSvg("");
    try {
      const questionText = q.question_text || "";
      const prompt = `Quyidagi savol va yechim uchun o'ta aniq, professional va mukammal SVG diagramma chizing.

Savol: ${questionText}

MUTLAQ QOIDALAR:
1. Faqat toza, valid <svg viewBox="0 0 700 500" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">...</svg> qaytaring.
2. SVG dagi BARCHA matnlar (<text> taglari) bir-biriga USTDAN USTDAN TUSHMAYDIGAN (overlap bo'lmaydigan) bo'lishi SHART!
3. Har bir matn va formula satri orasida kamida y-masofa: 35-45px bo'lishi shart! (Masalan: y="60", y="100", y="145", y="190", y="235", y="280", y="325", y="370", y="415").
4. Matnlar va sonlar o'lchami: font-size="15px" yoki "16px", font-family="system-ui, sans-serif".
5. Formula va natijalar uchun alohida ramkali to'rtburchaklar (<rect rx="10" fill="#f8fafc" stroke="#cbd5e1" />) ishlating.
6. Kirish, xulosa va markdown belgilari taqiqlanadi. Faqat toza <svg> kodi.`;

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "mistral-large-latest",
          messages: [
            { role: "system", content: "Siz mukammal SVG geometrik va matematik diagrammalar chizuvchi mutaxassissiz. Faqat toza SVG kodini qaytaring. Keraksiz matn va xulosalar taqiqlanadi." },
            { role: "user", content: prompt }
          ],
        }),
      });
      const data = await response.json();
      let content = data.choices?.[0]?.message?.content || "";
      content = content.replace(/```svg\s*/gi, "").replace(/```\s*/g, "").trim();
      const svgMatch = content.match(/<svg[\s\S]*?<\/svg>/i);
      setDiagramSvg(svgMatch ? svgMatch[0] : "");
    } catch {
      setDiagramSvg("");
    } finally {
      setIsGeneratingDiagram(false);
    }
  };

  const handleNextWrongHint = async () => {
    if (!q || !wrongHintModal || wrongHintModal.loading) return;

    if (wrongHintModal.currentStep < wrongHintModal.steps.length - 1) {
      setWrongHintModal(prev =>
        prev ? { ...prev, currentStep: prev.currentStep + 1 } : prev
      );
      return;
    }

    setWrongHintModal(prev => (prev ? { ...prev, loading: true } : prev));
    try {
      const extraSteps = await getWrongAnswerHints(q, wrongHintModal.optionIndex);
      setWrongHintModal(prev => {
        if (!prev) return prev;
        const merged = [...prev.steps, ...(extraSteps.length ? extraSteps : ["Yana bir bor oraliq hisoblarni tekshiring."])];
        return { ...prev, steps: merged, currentStep: prev.currentStep + 1, loading: false };
      });
    } catch {
      setWrongHintModal(prev => (prev ? { ...prev, loading: false } : prev));
    }
  };

  const aiPanelClass = aiOpen
    ? `fixed lg:relative right-0 top-14 lg:top-0 bottom-0 z-40 lg:z-20 w-full lg:w-[420px] xl:w-[460px] shrink-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col transition-all duration-300 animate-in slide-in-from-right duration-300 h-full`
    : `hidden`;

  if (!q) return null;

  return (
    <div className="fixed inset-0 z-[50] flex flex-col bg-white dark:bg-slate-950 overflow-hidden font-sans select-none animate-in fade-in duration-300">
      <SEO title={seoTitle} description={seoDesc} />

      {/* ═══════ HEADER ═══════ */}
      <header className="h-14 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-2 sm:px-4 md:px-6 flex items-center justify-between shrink-0 z-30 gap-1.5">
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
          <button onClick={exitTestWithFullscreen} className="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl text-[12px] font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0">
            <AltArrowLeftIcon size={18} className="shrink-0 text-[#E8192C]" />
            <span className="hidden sm:inline">Orqaga</span>
          </button>
          <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800 shrink-0" />
          <button 
             onClick={() => setShowSidebar(!showSidebar)}
             className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
             title={showSidebar ? "Savollar panelini berkitish" : "Savollar panelini ko'rsatish"}
          >
             <Widget4Icon size={20} className="text-[#E8192C]" />
          </button>
          <div className="hidden sm:block text-[13px] font-extrabold text-slate-900 dark:text-white uppercase tracking-wider truncate max-w-[160px] md:max-w-[320px]">
             {activeFolder?.name}
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className={`flex h-9 sm:h-10 items-center gap-2 px-3 sm:px-4 rounded-full border text-[13px] font-extrabold ${timeLeft < 45 ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400" : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"}`}>
            <ClockCircleIcon size={20} className="text-[#E8192C] shrink-0" />
            <span className="hidden md:inline text-[12px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200">Vaqt</span>
            <span className="font-mono text-[14px] font-extrabold">{formatTime(timeLeft)}</span>
          </div>

          <div className="flex h-9 sm:h-10 items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 sm:px-4">
            <img src="/educoin.png" alt="EduCoin" className="w-5 h-5 object-contain shrink-0" />
            <span className="text-[13px] sm:text-[14px] font-extrabold text-slate-900 dark:text-white tabular-nums">{eduBalance}</span>
          </div>

          {/* Notes Notebook Button */}
          <button
            onClick={() => setIsNotesDrawerOpen(true)}
            className="flex h-9 sm:h-10 items-center gap-2 px-3 sm:px-4 rounded-full border-2 border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/15 text-amber-950 dark:text-amber-100 hover:bg-amber-100 dark:hover:bg-amber-500/30 transition cursor-pointer shadow-sm"
            title="Mening eslatmalarim (Notes Notebook)"
          >
            <DocumentTextIcon size={20} className="text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="hidden md:inline text-[12.5px] font-extrabold">Eslatmalar</span>
            {totalNotesCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10.5px] font-extrabold shadow-sm">
                {totalNotesCount}
              </span>
            )}
          </button>

          <div className="rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-1">
            <ModeToggle />
          </div>
        </div>
      </header>

      {/* ═══════ TOP BAR SEGMENTED DASH STRIPE (SAT DIGITAL STYLE) ═══════ */}
      <div className="h-1.5 w-full flex items-center px-1 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 gap-[2px] shrink-0 z-30">
        {questions.map((qItem, idx) => {
          const isCurrent = idx === currentQ;
          const hasNote = (highlightsByQuestion[qItem.id] || []).length > 0;
          const isAnswered = typeof answers[qItem.id] === "number";

          let segColor = "bg-slate-300 dark:bg-slate-700";
          if (isCurrent) segColor = "bg-sky-500 shadow-sm scale-y-125 z-10";
          else if (hasNote) segColor = "bg-amber-400 dark:bg-amber-400";
          else if (isAnswered) segColor = "bg-slate-800 dark:bg-slate-200";

          return (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentQ(idx)}
              title={`${idx + 1}-savol${hasNote ? " (Eslatmasi bor)" : isAnswered ? " (Javob berilgan)" : ""}`}
              className={`h-1 flex-1 rounded-full transition-all duration-200 hover:opacity-80 ${segColor}`}
            />
          );
        })}
      </div>

      {/* ═══════ MAIN AREA ═══════ */}
      <main className="flex-1 overflow-hidden bg-white dark:bg-slate-950">
        <div className="flex h-full w-full overflow-hidden">

          {/* ═══════ LEFT SIDEBAR: QUESTION NAVIGATOR ═══════ */}
          <aside className={`
            fixed md:relative inset-y-0 left-0 z-40
            w-[260px] md:w-[228px] lg:w-[246px] 
            border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col shrink-0 
            transition-transform duration-300 ease-in-out
            ${showSidebar ? 'translate-x-0 w-[260px] md:w-[228px] lg:w-[246px]' : '-translate-x-full md:-translate-x-full w-0 hidden'}
          `}>
            <div className="p-4 md:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200/60 dark:border-red-500/20 flex items-center justify-center shrink-0">
                <Widget4Icon size={22} className="text-[#E8192C]" />
              </div>
              <div className="hidden md:block">
                <p className="text-[13px] font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Savollar</p>
                <p className="text-[11.5px] text-slate-600 dark:text-slate-300 font-extrabold uppercase tracking-wider">{questions.length} ta topshiriq</p>
              </div>
            </div>

            {/* Whiteboard Toggle */}
            <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 hidden md:block">
              <button 
                onClick={() => setIsGlobalWhiteboardOpen(!isGlobalWhiteboardOpen)}
                className={`w-full py-2.5 rounded-xl border flex items-center justify-center gap-2 text-[12px] font-extrabold uppercase tracking-wider transition-all ${isGlobalWhiteboardOpen ? 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-900 shadow-md' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white'}`}
              >
                <Pen2Icon size={18} />
                {isGlobalWhiteboardOpen ? "Doskani yopish" : "Doska chizish"}
              </button>
            </div>

            <div className="overflow-y-auto p-2.5 md:p-4 custom-scrollbar">
              <div className="grid grid-cols-4 md:grid-cols-4 gap-2">
                {questions.map((_, idx) => {
                  const quest = questions[idx];
                  const isAnswered = typeof answers[quest.id] === "number";
                  const isChecked = checkedQuestions.has(quest.id);
                  const attempts = correctAttempts[quest.id] || 0;
                  const isActive = idx === currentQ;

                  let cls = "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700";
                  if (isActive) cls = "text-white border-2";
                  else if (isChecked) {
                    if (attempts === 1) cls = "bg-emerald-500 text-white border-emerald-500";
                    else if (attempts === 2) cls = "bg-amber-500 text-white border-amber-500";
                    else cls = "bg-rose-500 text-white border-rose-500";
                  } else if (isAnswered) {
                    cls = "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white";
                  }

                  return (
                    <button 
                      key={idx} 
                      onClick={() => {
                        setCurrentQ(idx);
                        setShowSidebar(false);
                      }} 
                      style={isActive ? { background: RED, borderColor: RED } : undefined}
                      className={`aspect-square rounded-xl flex items-center justify-center font-bold text-[12px] md:text-[13px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/45 focus-visible:ring-offset-2 ${cls}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4 md:p-5 border-t border-slate-200 dark:border-slate-800 hidden md:block bg-white dark:bg-slate-950">
              <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 space-y-2.5 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-4 rounded-full" style={{ background: RED }} />
                    <p className="text-[11px] font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Progress</p>
                  </div>
                  <span className="text-[12px] font-extrabold" style={{ color: RED }}>{roundedProgress}%</span>
                </div>
                <div className="h-[4px] w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} className="h-full rounded-full transition-all duration-500" style={{ background: RED }} />
                </div>
                <div className="flex justify-between text-[10.5px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: RED }} />
                    {answeredCount} bajarildi
                  </span>
                  <span>{questions.length - answeredCount} qoldi</span>
                </div>
              </div>
            </div>
          </aside>

      {/* ═══════ MAIN ACTIVE WORKSPACE ═══════ */}
      <div className="flex-1 flex overflow-hidden relative">
        <AnimatePresence initial={false}>
          {/* ═══════ LEFT SIDEBAR: GLOBAL WHITEBOARD ═══════ */}
          {isGlobalWhiteboardOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 360, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="hidden lg:flex bg-white dark:bg-slate-950 flex-col shrink-0 overflow-hidden relative border-r border-slate-200 dark:border-slate-800"
            >
              <div className="p-2 px-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
                 <div className="flex items-center gap-2">
                   <PenLine className="w-4 h-4 text-slate-400" />
                   <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-900 dark:text-white">Ishchi Doska</span>
                 </div>
                 <button onClick={() => setIsGlobalWhiteboardOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-400">
                   <X className="w-4 h-4" />
                 </button>
              </div>
              <div className="flex-1 p-0">
                 <Whiteboard className="h-full border-none shadow-none rounded-none" />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* ═══════ CENTER: QUESTION + OPTIONS ═══════ */}
        <section className="flex-1 flex flex-col items-center bg-slate-50/50 dark:bg-slate-950 overflow-y-auto custom-scrollbar px-3 md:px-6 xl:px-8 pt-4 pb-24 transition-all duration-300">
          <div className="w-full max-w-3xl space-y-4">
            {/* Question Meta */}
            <div className="relative flex items-center justify-center">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-4 rounded-full flex-shrink-0" style={{ background: RED }} />
                <span className="text-[13px] font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Savol {currentQ + 1}</span>
                <span className="text-[13px] font-extrabold text-slate-400 dark:text-slate-500">—</span>
                <span className="text-[13px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{questions.length} tadan</span>
              </div>
              <div className="absolute right-0 flex items-center gap-1.5">
                 <button onClick={() => { setReportQuestionId(q.id); setReportOpen(!reportOpen); }} className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all" title="Shikoyat qilish">
                  <DangerCircleIcon size={20} />
                </button>
                <button
                  onClick={() => toggleBookmark(q.id)}
                  title={bookmarkedQuestions.has(q.id) ? "Belgini olib tashlash" : "Savolni belgilash (Bookmark)"}
                  className={`p-2 rounded-xl transition-all ${
                    bookmarkedQuestions.has(q.id)
                      ? "text-pink-500 bg-pink-50 dark:bg-pink-500/10"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <BookmarkIcon size={20} className={bookmarkedQuestions.has(q.id) ? "text-pink-500" : ""} />
                </button>
              </div>
            </div>

              {/* Progress Bar */}
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
                  className="h-full rounded-full transition-all duration-300"
                  style={{ background: RED }}
                />
              </div>

              {/* Answer Color Legend */}
              <div className="flex items-center justify-center gap-4 text-[11.5px] font-bold text-slate-700 dark:text-slate-300 py-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  Yashil - to'g'ri javob
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-900 dark:bg-white inline-block" />
                  Qora - javob belgilangan
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                  Qizil - xato javob
                </span>
                </div>

              {/* Question Box */}
              <div 
                onMouseUp={handleQuestionTextMouseUp}
                onTouchEnd={handleQuestionTextMouseUp}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 md:p-6 shadow-sm space-y-4 relative select-text"
              >
                <div className="prose prose-slate max-w-none dark:prose-invert text-[15px] md:text-[17px] font-medium leading-relaxed font-inter">
                  {renderHighlightedContent(questionTextBody, q.id)}
                </div>

                {/* Question Image */}
                {q.image_url && (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 max-h-[300px] flex justify-center">
                    <img
                      src={rewriteStorageUrl(q.image_url)}
                      alt="Savol rasmi"
                      className="object-contain cursor-pointer hover:scale-105 transition-transform duration-200 max-h-[300px]"
                      onClick={() => setZoomedImage(q.image_url)}
                    />
                  </div>
                )}

                {/* Options */}
                <div className="space-y-2.5 pt-2">
                  {options.map((opt, i) => {
                    const isSelected = answers[q.id] === i;
                    const isChecked = checkedQuestions.has(q.id);
                    const isCorrect = i === q.correct_option;
                    const isEliminated = (eliminatedOptions[q.id] || []).includes(i);

                    let optionCls = "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700";
                    let badgeCls = "bg-slate-100 dark:bg-slate-800 text-slate-500";

                    if (isEliminated) {
                      optionCls = "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200";
                      badgeCls = "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-full";
                    } else if (isChecked) {
                      if (isCorrect) {
                        optionCls = "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-900 dark:text-emerald-100";
                        badgeCls = "bg-emerald-500 text-white rounded-lg";
                      } else if (isSelected) {
                        optionCls = "border-rose-500 bg-rose-50 dark:bg-rose-500/10 text-rose-900 dark:text-rose-100";
                        badgeCls = "bg-rose-500 text-white rounded-lg";
                      }
                    } else if (isSelected) {
                      optionCls = "border-slate-900 dark:border-white bg-slate-900/5 dark:bg-white/5 text-slate-900 dark:text-white font-semibold";
                      badgeCls = "bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg";
                    }

                    return (
                      <div
                        key={i}
                        onClick={() => {
                          if (!isChecked && !isEliminated) {
                            setAnswers({ ...answers, [q.id]: i });
                            setCheckResultByQuestion(prev => ({ ...prev, [q.id]: null }));
                            setWrongHintModal(null);
                          }
                        }}
                        className={`relative w-full flex items-center justify-between gap-3 p-3.5 md:p-4 rounded-2xl border-2 text-left transition-all duration-200 ${isEliminated ? "cursor-not-allowed" : "cursor-pointer"} ${optionCls}`}
                      >
                        {/* Single continuous horizontal line from badge C to Undo word */}
                        {isEliminated && (
                          <span className="absolute left-3.5 sm:left-4 right-14 top-1/2 h-[1.8px] bg-slate-900 dark:bg-white -translate-y-1/2 z-10 rounded-full pointer-events-none" />
                        )}

                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Strikethrough Badge Button (Match SAT/GMAT circle design) */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleEliminateOption(q.id, i);
                            }}
                            title={isEliminated ? "Variantni tiklash" : "Variantni o'chirish (Inkor qilish)"}
                            className="relative group shrink-0"
                          >
                            <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-[13.5px] font-extrabold transition-all relative ${badgeCls}`}>
                              {String.fromCharCode(65 + i)}
                            </span>
                          </button>

                          <div className="pt-0.5 text-[15px] md:text-[16px] font-semibold leading-relaxed text-slate-900 dark:text-white">
                            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                              {normalizeMathDelimiters(opt)}
                            </ReactMarkdown>
                          </div>
                        </div>

                        {/* Strikethrough Action Toggle Button (Exact match to SAT/GMAT design) */}
                        {!isChecked && (
                          isEliminated ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleEliminateOption(q.id, i);
                              }}
                              title="Variantni qayta tiklash"
                              className="text-xs font-bold text-slate-700 dark:text-slate-300 underline underline-offset-2 hover:text-slate-900 dark:hover:text-white transition shrink-0 px-1 py-0.5"
                            >
                              Undo
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleEliminateOption(q.id, i);
                              }}
                              title={`${String.fromCharCode(65 + i)} variantini o'chirish`}
                              className="relative w-6 h-6 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center font-bold text-[11px] text-slate-700 dark:text-slate-300 hover:border-slate-600 dark:hover:border-slate-400 hover:scale-105 transition shrink-0"
                            >
                              <span>{String.fromCharCode(65 + i)}</span>
                              <span className="absolute inset-x-0 top-1/2 h-[1.8px] bg-slate-900 dark:bg-white -translate-y-1/2" />
                            </button>
                          )
                        )}

                        {!isChecked && isSelected && testMode !== "imtixon" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleCheckCurrentOption();
                            }}
                            className="h-9 px-4 rounded-xl text-white text-[11px] font-bold uppercase tracking-wider transition-all hover:opacity-90 active:scale-95 shadow-md shrink-0 ml-2"
                            style={{ background: RED }}
                          >
                            Tekshir
                          </button>
                        )}
                        {isChecked && isCorrect && (
                          <span className="px-3 py-1 rounded-lg bg-emerald-500 text-white text-[11px] font-bold uppercase tracking-wider shrink-0">
                            To'g'ri
                          </span>
                        )}
                        {isChecked && !isCorrect && isSelected && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="px-3 py-1 rounded-lg bg-rose-500 text-white text-[11px] font-bold uppercase tracking-wider">
                              Xato
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setAiOpen(true);
                                setAiActiveTab("explanation");
                                void explainQuestion();
                              }}
                              className="px-3 py-1 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 text-white text-[11px] font-bold flex items-center gap-1 hover:opacity-90 transition shadow-sm"
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>Nega xato? (AI Tahlil)</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Inline Guidance */}
              <AnimatePresence>
                {guidanceOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900"
                  >
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          <Database className="w-4 h-4 text-sky-500" />
                        </div>
                        <div>
                          <p className="text-[12px] font-semibold text-slate-900 dark:text-white uppercase tracking-wider">Mavzu Ko'rsatmasi</p>
                          <p className="text-[10px] font-medium text-slate-400">Nazariy ma'lumotlar</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setGuidanceOpen(false)}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="p-6">
                      {isGeneratingGuidance && !guidanceContent ? (
                        <div className="flex flex-col items-center justify-center py-8 gap-3">
                          <div className="w-7 h-7 border-2 border-slate-300 dark:border-slate-600 border-t-slate-900 dark:border-t-white rounded-full animate-spin" />
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Tayyorlanmoqda...</span>
                        </div>
                      ) : (
                        <div className="prose prose-slate max-w-none dark:prose-invert [&_p]:text-[16px] md:[&_p]:text-[17px] [&_p]:font-medium [&_p]:leading-relaxed [&_p]:font-inter">
                          <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {normalizeMathDelimiters(guidanceContent || "Ma'lumot topilmadi.")}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Inline AI Hint */}
              <AnimatePresence>
                {wrongHintModal && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900"
                  >
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src="/logo.png" className="w-8 h-8 object-contain" alt="AI" />
                        <div>
                          <p className="text-[13px] font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">AI Ko'rsatma</p>
                          <p className="text-[12px] font-extrabold text-slate-700 dark:text-slate-200">Harakatlantirish uchun ushlang</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[12px] font-extrabold text-slate-700 dark:text-slate-200 tabular-nums">
                          {wrongHintModal.loading ? "..." : `${wrongHintModal.currentStep + 1}/${Math.max(wrongHintModal.steps.length, 1)}`}
                        </span>
                        <button
                          onClick={() => setWrongHintModal(null)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="p-5">
                      {wrongHintModal.loading ? (
                        <div className="flex flex-col items-center justify-center py-6 gap-3">
                          <div className="w-6 h-6 border-2 border-slate-300 dark:border-slate-600 border-t-slate-900 dark:border-t-white rounded-full animate-spin" />
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 animate-pulse">Tayyorlanmoqda</span>
                        </div>
                      ) : (
                        <div className="prose prose-sm max-w-none dark:prose-invert [&_p]:m-0 [&_p]:text-[15px] [&_p]:leading-relaxed [&_p]:font-extrabold [&_p]:text-slate-900 dark:[&_p]:text-white [&_.katex]:font-sans">
                          <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {normalizeMathDelimiters(wrongHintModal.steps[wrongHintModal.currentStep] || "Avval savolni yana bir bor diqqat bilan o'qing.")}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>

                    <div className="px-5 pb-5 flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          setAiOpen(true);
                          setAiActiveTab("explanation");
                          void explainQuestion();
                        }}
                        className="h-10 px-4 rounded-xl border-2 border-red-200 dark:border-red-800/80 text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-950/40 text-[12.5px] font-extrabold flex items-center gap-1.5 hover:bg-red-100 dark:hover:bg-red-900/50 transition"
                      >
                        <ChatSquareCodeIcon size={18} />
                        <span>Nega bu javob xato? (AI Tahlil)</span>
                      </button>

                      <button
                        onClick={() => void handleNextWrongHint()}
                        disabled={wrongHintModal.loading}
                        className="h-10 px-6 rounded-xl text-white text-[12.5px] font-extrabold uppercase tracking-wider transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 shadow-md"
                        style={{ background: RED }}
                      >
                        {wrongHintModal.loading ? "Kuting" : "Keyingi"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Inline Report Form */}
              <AnimatePresence>
                {reportOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 border border-red-200 dark:border-red-500/20 rounded-2xl overflow-hidden bg-white dark:bg-slate-900"
                  >
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                          <DangerCircleIcon size={22} className="text-red-500" />
                        </div>
                        <div>
                          <p className="text-[13px] font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Shikoyat yozish</p>
                          <p className="text-[12px] font-extrabold text-slate-700 dark:text-slate-200">Savol haqida xabar bering</p>
                        </div>
                      </div>
                      <button
                        onClick={() => { setReportOpen(false); setReportMessage(""); }}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="p-5 space-y-4">
                      <textarea
                        value={reportMessage}
                        onChange={(e) => setReportMessage(e.target.value)}
                        placeholder="Muammoni batafsil yozing..."
                        rows={4}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-[14px] font-extrabold focus:outline-none focus:border-red-400 dark:focus:border-red-500/50 transition-all resize-none text-slate-900 dark:text-white placeholder:text-slate-500 placeholder:font-semibold"
                      />
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => { setReportOpen(false); setReportMessage(""); }}
                          className="h-10 px-5 rounded-xl border border-slate-300 dark:border-slate-700 text-[13px] font-extrabold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-all"
                        >
                          Bekor qilish
                        </button>
                        <button
                          onClick={submitReport}
                          disabled={!reportMessage.trim() || isReporting}
                          className="h-10 px-6 rounded-xl text-white text-[13px] font-extrabold transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 shadow-md"
                          style={{ background: RED }}
                        >
                          {isReporting ? "..." : "Yuborish"}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Inline AI Chizma */}
              <AnimatePresence>
                {diagramOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border border-violet-200 dark:border-violet-500/20 rounded-2xl overflow-hidden bg-white dark:bg-slate-900"
                  >
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center">
                          <Pen2Icon size={22} className="text-violet-500" />
                        </div>
                        <div>
                          <p className="text-[13px] font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">AI Chizma</p>
                          <p className="text-[12px] font-extrabold text-slate-700 dark:text-slate-200">Geometrik diagramma</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setDiagramOpen(false)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="p-5 flex items-center justify-center min-h-[200px]">
                      {isGeneratingDiagram ? (
                        <div className="flex flex-col items-center gap-3 text-slate-400">
                          <div className="w-8 h-8 border-2 border-slate-200 dark:border-slate-700 border-t-violet-500 rounded-full animate-spin" />
                          <span className="text-xs font-medium">Diagramma chizilmoqda...</span>
                        </div>
                      ) : diagramSvg ? (
                        <div dangerouslySetInnerHTML={{ __html: diagramSvg }} className="w-full flex justify-center" />
                      ) : (
                        <div className="text-center">
                          <p className="text-[15px] font-extrabold text-slate-900 dark:text-white mb-3">Diagramma yaratilmadi</p>
                          <button onClick={generateDiagram} className="h-10 px-5 rounded-xl text-[12.5px] font-extrabold text-white transition-all hover:opacity-90 shadow-md" style={{ background: RED }}>
                            <span className="inline-flex items-center gap-1.5"><RefreshCw className="w-4 h-4" /> Qayta urinish</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* Mobile Overlay Backdrop when AI Panel is open */}
          {aiOpen && testMode !== "imtixon" && (
            <div
              className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-xs z-35 animate-in fade-in duration-200"
              onClick={() => setAiOpen(false)}
            />
          )}

          {/* ═══════ RIGHT SIDEBAR: AI TAHLIL PANEL (PREPPY AI STYLE) ═══════ */}
          {testMode !== "imtixon" && (
            <aside 
              className={`relative w-full shrink-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col z-40 h-full ${aiPanelClass}`}
              style={{ width: typeof window !== "undefined" && window.innerWidth >= 1024 ? `${aiPanelWidth}px` : undefined }}
            >
              {/* Drag Handle to resize panel left & right */}
              <div 
                onMouseDown={startResizingAi}
                className="hidden lg:flex absolute -left-2 top-0 bottom-0 w-4 cursor-ew-resize items-center justify-center group z-50 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors"
                title="O'ng/Chapga surib kengaytirish yoki kichiklashtirish"
              >
                <div className="w-1.5 h-16 rounded-full bg-slate-300 dark:bg-slate-700 group-hover:bg-[#E8192C] group-active:bg-[#E8192C] transition-colors shadow-sm" />
              </div>

              {/* Top Control Bar: Unpin checkbox & Minimize & Close */}
              <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 shrink-0">
                <button
                  onClick={() => setIsAiPinned(!isAiPinned)}
                  className="flex items-center gap-2 text-[13px] font-extrabold text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={isAiPinned}
                    onChange={() => setIsAiPinned(!isAiPinned)}
                    className="w-4 h-4 rounded border-slate-300 text-[#E8192C] focus:ring-[#E8192C] cursor-pointer"
                  />
                  <span>{isAiPinned ? "Qadab qo'yilgan" : "Qadash"}</span>
                </button>

                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setAiPanelWidth(aiPanelWidth > 550 ? 450 : 720)} 
                    className="hidden lg:flex p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition text-slate-700 dark:text-slate-300 text-xs items-center gap-1 border border-slate-200/60 dark:border-slate-700/60"
                    title={aiPanelWidth > 550 ? "Kichiklashtirish" : "Kattalashtirish"}
                  >
                    <MaximizeSquare3Icon size={18} />
                  </button>
                  <button onClick={() => setAiOpen(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition text-slate-500 hover:text-slate-700 dark:hover:text-slate-200">
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>

              {/* 3 Main Tabs: AI Savol | Tahlil | Ma'lumot */}
              <div className="px-3 flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                <button
                  onClick={() => setAiActiveTab("chat")}
                  className={`flex-1 py-2.5 px-2 flex items-center justify-center gap-1.5 text-[13px] font-extrabold transition-all border-b-2 ${
                    aiActiveTab === "chat"
                      ? "border-[#E8192C] text-[#E8192C]"
                      : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  <ChatSquareCodeIcon size={18} />
                  <span>AI Savol</span>
                </button>

                <button
                  onClick={() => setAiActiveTab("explanation")}
                  className={`flex-1 py-2.5 px-2 flex items-center justify-center gap-1.5 text-[13px] font-extrabold transition-all border-b-2 ${
                    aiActiveTab === "explanation"
                      ? "border-[#E8192C] text-[#E8192C]"
                      : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  <ChatSquareCodeIcon size={18} />
                  <span>Tahlil</span>
                </button>

                <button
                  onClick={() => setAiActiveTab("info")}
                  className={`flex-1 py-2.5 px-2 flex items-center justify-center gap-1.5 text-[13px] font-extrabold transition-all border-b-2 ${
                    aiActiveTab === "info"
                      ? "border-[#E8192C] text-[#E8192C]"
                      : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  <InfoCircleIcon size={18} />
                  <span>Ma'lumot</span>
                </button>
              </div>

              {/* Content Body based on Active Tab */}
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {/* ────── TAB 1: AI SAVOL (CHAT) ────── */}
                {aiActiveTab === "chat" && (
                  <div className="h-full flex flex-col justify-between space-y-4">
                    {chatMessages.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center py-6 space-y-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-sky-400 to-teal-300 flex items-center justify-center p-3 shadow-lg shadow-sky-500/20 animate-bounce">
                          <img src="/logo.png" className="w-10 h-10 object-contain" alt="AI Mascot" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Qanday yordam bera olaman?</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">AI dan xohlagan savolingizni so'rang!</p>
                        </div>

                        <div className="w-full space-y-2.5 pt-2 max-w-sm">
                          <button
                            onClick={() => {
                              setIsGlobalWhiteboardOpen(true);
                              void handleAskAi("Ushbu savolni ishchi doskada qadamma-qadam yechib tushuntirib ber");
                            }}
                            className="w-full flex items-center justify-between px-4 py-2.5 rounded-full bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all text-xs font-medium text-slate-700 dark:text-slate-300"
                          >
                            <span className="flex items-center gap-2">
                              <span>Buni ishchi doskada yechib ber</span>
                              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-sky-500 text-white">YANGI</span>
                            </span>
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          </button>

                          <button
                            onClick={() => {
                              void handleAskAi("Ushbu savolning eng yaxshi yechish strategiyasi nima?");
                            }}
                            className="w-full flex items-center justify-between px-4 py-2.5 rounded-full bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all text-xs font-medium text-slate-700 dark:text-slate-300"
                          >
                            <span>Eng yaxshi yechish strategiyasi qanday?</span>
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          </button>

                          <button
                            onClick={() => {
                              setAiActiveTab("explanation");
                              void explainQuestion();
                            }}
                            className="w-full flex items-center justify-between px-4 py-2.5 rounded-full bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all text-xs font-medium text-slate-700 dark:text-slate-300"
                          >
                            <span>Buni qadamma-qadam tushuntir</span>
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          </button>
                        </div>

                        <div className="pt-4 text-center space-y-1">
                          <p className="text-[11px] text-slate-400">Har bir suhbat <img src="/educoin.png" className="w-3.5 h-3.5 inline object-contain" alt="EduCoin" /> 1 EduCoin</p>
                          <p className="text-xs font-bold text-sky-600 dark:text-sky-400 flex items-center justify-center gap-1">
                            <img src="/educoin.png" className="w-4 h-4 object-contain" alt="EduCoin" /> {eduBalance} EduCoin qoldi
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 space-y-3 pb-4">
                        {chatMessages.map((msg, i) => (
                          <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                            {msg.role === "assistant" && (
                              <div className="w-7 h-7 rounded-full bg-sky-500/10 flex items-center justify-center shrink-0">
                                <img src="/logo.png" className="w-4 h-4 object-contain" alt="AI" />
                              </div>
                            )}
                            <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs ${
                              msg.role === "user"
                                ? "bg-sky-500 text-white rounded-br-none"
                                : "bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-bl-none prose prose-xs dark:prose-invert"
                            }`}>
                              {msg.role === "assistant" ? (
                                <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                  {normalizeMathDelimiters(msg.content)}
                                </ReactMarkdown>
                              ) : (
                                msg.content
                              )}
                            </div>
                          </div>
                        ))}

                        {isAskingAi && (
                          <div className="flex gap-2.5 justify-start items-center animate-pulse pt-1">
                            <div className="w-7 h-7 rounded-full bg-sky-500/10 flex items-center justify-center shrink-0">
                              <img src="/logo.png" className="w-4 h-4 object-contain" alt="AI" />
                            </div>
                            <div className="bg-slate-100 dark:bg-slate-900 rounded-2xl px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 border border-slate-200/50 dark:border-slate-800">
                              <div className="flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                                <div className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                                <div className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                              </div>
                              <span className="text-[11px] font-semibold">AI javob yozmoqda...</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ────── TAB 2: TAHLIL (EXPLANATION) ────── */}
                {aiActiveTab === "explanation" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[15px] font-extrabold text-slate-900 dark:text-white">Qadamma-qadam tushuntirish</h4>
                      <button
                        onClick={() => {
                          setReportQuestionId(q?.id || null);
                          setReportOpen(true);
                        }}
                        className="flex items-center gap-1 text-[12px] font-extrabold text-slate-600 dark:text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <Flag className="w-3.5 h-3.5" /> Shikoyat
                      </button>
                    </div>

                    {/* Correct Answer Card */}
                    <div className="rounded-2xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/70 dark:bg-emerald-500/10 p-4 space-y-2">
                      <p className="text-[12px] font-extrabold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">To'g'ri Javob</p>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-extrabold text-sm shrink-0">
                          {typeof q?.correct_option === "number" ? String.fromCharCode(65 + q.correct_option) : "✓"}
                        </div>
                        <div className="text-[15px] font-extrabold text-slate-900 dark:text-white prose prose-sm dark:prose-invert max-w-none [&_p]:m-0 [&_.katex]:font-sans">
                          {typeof q?.correct_option === "number" ? (
                            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                              {normalizeMathDelimiters(options[q.correct_option] || "")}
                            </ReactMarkdown>
                          ) : (
                            "To'g'ri javob ko'rsatilgan"
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Walkthrough Methods */}
                    <div className="space-y-3 pt-1">
                      <h5 className="text-[13.5px] font-extrabold text-slate-900 dark:text-white">Yechish usullari va qadamlar</h5>

                      {isExplaining ? (
                        <div className="py-8 flex flex-col items-center justify-center gap-2">
                          <div className="w-7 h-7 border-2 border-slate-300 border-t-[#E8192C] rounded-full animate-spin" />
                          <p className="text-xs text-slate-400 font-medium">Tahlil tayyorlanmoqda...</p>
                        </div>
                      ) : aiExplanation ? (
                        (() => {
                          const steps = parseStepsFromExplanation(aiExplanation);
                          return (
                            <div className="relative pl-6 space-y-4 py-2 before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-[#E8192C] before:via-sky-500 before:to-emerald-500">
                              {steps.map((step, idx) => (
                                <div key={idx} className="relative flex items-start gap-3 group">
                                  {/* Step Badge Circle (1, 2, 3, 4) */}
                                  <div className={`absolute -left-6 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-md border-2 border-white dark:border-slate-900 transition-transform group-hover:scale-110 shrink-0 ${
                                    step.number === "✓"
                                      ? "bg-emerald-600 text-white"
                                      : "bg-gradient-to-tr from-[#E8192C] to-red-500 text-white"
                                  }`}>
                                    {step.number}
                                  </div>

                                  {/* Step Card Content */}
                                  <div className="flex-1 bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 shadow-sm hover:shadow-md transition-shadow">
                                    <h6 className="text-[12px] font-extrabold text-slate-900 dark:text-white uppercase tracking-wider mb-1 flex items-center justify-between">
                                      <span>{step.title}</span>
                                    </h6>
                                    <div className="prose prose-slate max-w-none dark:prose-invert text-[13px] font-semibold text-slate-800 dark:text-slate-200 leading-relaxed [&_p]:text-slate-800 dark:[&_p]:text-slate-200 [&_p]:font-semibold">
                                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                        {normalizeMathDelimiters(step.content)}
                                      </ReactMarkdown>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })()
                      ) : (
                        <div className="text-center py-6 space-y-3">
                          <p className="text-xs text-slate-400">Hali tahlil olinmagan.</p>
                          <button
                            onClick={explainQuestion}
                            className="px-5 py-2.5 rounded-xl text-white text-xs font-bold uppercase transition-all shadow-md inline-flex items-center gap-1.5"
                            style={{ background: RED }}
                          >
                            <span>Tahlilni olish</span>
                            <span className="inline-flex items-center gap-1 text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-md bg-white/20 text-white">
                              -1 <img src="/educoin.png" className="w-3 h-3 object-contain" alt="EduCoin" />
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ────── TAB 3: MA'LUMOT (INFO) ────── */}
                {aiActiveTab === "info" && (
                  <div className="space-y-5">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Savol ma'lumotlari</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                          <p className="text-[10px] text-slate-400 font-semibold uppercase">Bo'lim</p>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">{activeFolder?.subject || "Matematika"}</p>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                          <p className="text-[10px] text-slate-400 font-semibold uppercase">Qiyinchilik</p>
                          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{q?.difficulty || "O'rta"}</p>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                          <p className="text-[10px] text-slate-400 font-semibold uppercase">Soha</p>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">{activeFolder?.category || "Algebra"}</p>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                          <p className="text-[10px] text-slate-400 font-semibold uppercase">Mavzu</p>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">{activeFolder?.name || "Asosiy tushunchalar"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
                      <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-sky-500" /> Analitika
                      </h5>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">O'rtacha aniqlik:</span>
                          <span className="font-bold text-slate-900 dark:text-white">67%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full w-[67%]" />
                        </div>
                        <div className="flex items-center justify-between text-xs pt-1">
                          <span className="text-slate-400">O'rtacha sarflangan vaqt:</span>
                          <span className="font-bold text-slate-900 dark:text-white">1:26 daq</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Chat Input Area for Tab 1 / Chat */}
              {aiActiveTab === "chat" && (
                <div className="p-3 pb-16 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shrink-0">
                  <div className="bg-slate-100 dark:bg-slate-900 rounded-3xl p-2.5 space-y-2">
                    <textarea
                      placeholder="Savol bering..."
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          void handleAskAi();
                        }
                      }}
                      className="w-full bg-transparent text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none resize-none max-h-20 min-h-[36px] px-1"
                    />

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
                      <div className="flex items-center gap-1.5">
                        <button className="p-1.5 rounded-full text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition">
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setIsGlobalWhiteboardOpen(!isGlobalWhiteboardOpen)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 transition ${
                            isGlobalWhiteboardOpen ? "bg-[#E8192C] text-white shadow-sm" : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300"
                          }`}
                        >
                          <PenLine className="w-3 h-3" /> Doska
                        </button>
                      </div>

                      <button
                        onClick={() => void handleAskAi()}
                        disabled={!aiInput.trim()}
                        className="w-7 h-7 rounded-full bg-[#E8192C] text-white flex items-center justify-center hover:opacity-90 disabled:opacity-30 transition shadow-sm"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-center text-slate-400 mt-1.5">AI xatolik qilishi mumkin. Muhim ma'lumotlarni tekshiring.</p>
                </div>
              )}
            </aside>
          )}

          {showSidebar && (
            <div 
              className="fixed inset-0 bg-black/20 z-30 md:hidden animate-in fade-in duration-200"
              onClick={() => setShowSidebar(false)}
            />
          )}
        </div>
      </div>
    </main>

      {/* ═══════ FOOTER ACTION BAR (SAT / EDULY DIGITAL STYLE) ═══════ */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 flex flex-col bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 shadow-2xl">
        {/* Full-width segmented color dash stripe */}
        <div className="h-1.5 w-full flex items-center px-1 bg-slate-100 dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 gap-[2px] shrink-0">
          {questions.map((qItem, idx) => {
            const isCurrent = idx === currentQ;
            const isBookmarked = bookmarkedQuestions.has(qItem.id);
            const hasNote = (highlightsByQuestion[qItem.id] || []).length > 0;
            const isAnswered = typeof answers[qItem.id] === "number";

            let segColor = "bg-slate-200 dark:bg-slate-700"; // Oq / Kulrang (Javob berilmagan)
            if (isCurrent) segColor = "bg-sky-500 shadow-sm scale-y-125 z-10"; // Ko'k (Hozirgi)
            else if (isBookmarked) segColor = "bg-pink-500 dark:bg-pink-400"; // Pushti (Belgilangan)
            else if (hasNote) segColor = "bg-amber-400 dark:bg-amber-400"; // Sariq (Eslatmasi bor)
            else if (isAnswered) segColor = "bg-slate-900 dark:bg-slate-100"; // Qora (Javob berilgan)

            return (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentQ(idx)}
                title={`${idx + 1}-savol${isCurrent ? " (Hozirgi)" : isBookmarked ? " (Belgilangan)" : hasNote ? " (Eslatmasi bor)" : isAnswered ? " (Javob berilgan)" : " (Javob berilmagan)"}`}
                className={`h-1 flex-1 rounded-full transition-all duration-200 hover:opacity-80 ${segColor}`}
              />
            );
          })}
        </div>

        {/* Bottom Bar Content */}
        <div className="h-12 sm:h-14 px-2 sm:px-6 md:px-8 flex items-center justify-between gap-1.5 sm:gap-2 max-w-7xl mx-auto w-full">
          {/* Left: User Profile Name */}
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[12.5px] sm:text-sm font-extrabold text-slate-900 dark:text-white truncate max-w-[90px] xs:max-w-[140px] sm:max-w-[220px]">
              {userName}
            </span>
          </div>

          {/* Center: Question Navigator Pill (Savol 1 / 43 ^) */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsQuestionGridPopoverOpen((prev) => !prev);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-[#0F172A] dark:bg-slate-800 text-white text-[11.5px] sm:text-[13px] font-extrabold shadow-md hover:bg-slate-800 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              <span>Savol {currentQ + 1} / {questions.length}</span>
              <ChevronUp className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform ${isQuestionGridPopoverOpen ? "rotate-180" : ""}`} />
            </button>

            {testMode !== "imtixon" && (
              <div className="hidden lg:flex items-center gap-1.5">
                <button
                  onClick={explainQuestion}
                  title="AI Tahlil (-1 EduCoin)"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-extrabold text-[#E8192C] hover:bg-red-50 dark:hover:bg-red-500/10 transition"
                >
                  <ChatSquareCodeIcon size={18} className="text-[#E8192C]" />
                  <span>TAHLIL</span>
                </button>
                <button
                  onClick={generateDiagram}
                  title="AI Chizma"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-extrabold text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-500/10 transition"
                >
                  <Pen2Icon size={18} className="text-sky-600 dark:text-sky-400" />
                  <span>AI CHIZMA</span>
                </button>
              </div>
            )}
          </div>

          {/* Right: Orqaga & Keyingisi Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
              disabled={currentQ === 0}
              className="px-3.5 py-1.5 sm:px-5 sm:py-2.5 rounded-full border-2 border-sky-300 dark:border-sky-700 bg-sky-100/70 dark:bg-sky-950/40 text-sky-900 dark:text-sky-100 text-[11.5px] sm:text-[13px] font-extrabold hover:bg-sky-200 dark:hover:bg-sky-900/60 transition disabled:opacity-40"
            >
              Orqaga
            </button>

            {currentQ < questions.length - 1 ? (
              <button
                onClick={() => setCurrentQ(currentQ + 1)}
                className="px-4 py-1.5 sm:px-6 sm:py-2.5 rounded-full bg-[#0284C7] dark:bg-sky-500 text-white text-[11.5px] sm:text-[13px] font-extrabold shadow-md hover:bg-sky-700 dark:hover:bg-sky-600 transition"
              >
                Keyingisi
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-4 py-1.5 sm:px-6 sm:py-2.5 rounded-full text-white text-[11.5px] sm:text-[13px] font-extrabold shadow-md hover:opacity-90 transition"
                style={{ background: RED }}
              >
                {submitting ? "..." : "Yakunlash"}
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* ═══════ FLOATING QUESTION GRID POPOVER (SAT DIGITAL POPUP) ═══════ */}
      <AnimatePresence>
        {isQuestionGridPopoverOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-[90] bg-black/30 backdrop-blur-xs"
              onClick={() => setIsQuestionGridPopoverOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="fixed bottom-14 sm:bottom-16 inset-x-2 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-[100] w-auto sm:w-[440px] max-w-[calc(100vw-16px)] mx-auto max-h-[80vh] sm:max-h-[480px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-3.5 sm:p-4 flex flex-col gap-2.5 sm:gap-3 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-500/10 border border-sky-200/60 dark:border-sky-500/20 flex items-center justify-center shrink-0">
                    <Widget4Icon size={20} className="text-sky-500" />
                  </div>
                  <span className="text-[13px] font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                    Savollar xaritasi (1 - {questions.length})
                  </span>
                </div>
                <button
                  onClick={() => setIsQuestionGridPopoverOpen(false)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status Legend */}
              <div className="flex flex-wrap items-center justify-between text-[11px] font-extrabold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 gap-2">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block shrink-0" />
                  Hozirgi
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-pink-500 inline-block shrink-0" />
                  Belgilangan
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block shrink-0" />
                  Eslatmasi bor
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-900 dark:bg-white inline-block shrink-0" />
                  Javob berilgan
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full border border-slate-400 dark:border-slate-500 bg-white dark:bg-slate-900 inline-block shrink-0" />
                  Javob berilmagan
                </span>
              </div>

              {/* Question Buttons Grid */}
              <div className="overflow-y-auto max-h-[300px] pr-1 grid grid-cols-5 sm:grid-cols-6 gap-2 custom-scrollbar p-1">
                {questions.map((quest, idx) => {
                  const isAnswered = typeof answers[quest.id] === "number";
                  const isBookmarked = bookmarkedQuestions.has(quest.id);
                  const isChecked = checkedQuestions.has(quest.id);
                  const attempts = correctAttempts[quest.id] || 0;
                  const isActive = idx === currentQ;
                  const hasNote = (highlightsByQuestion[quest.id] || []).length > 0;

                  let cls = "bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-extrabold border border-slate-200 dark:border-slate-700 hover:border-slate-400";
                  if (isActive) {
                    cls = "bg-sky-500 text-white border-sky-500 font-extrabold ring-2 ring-sky-300 dark:ring-sky-700 shadow-md";
                  } else if (isBookmarked) {
                    cls = "bg-pink-500 text-white border-pink-500 font-extrabold";
                  } else if (isChecked) {
                    if (attempts === 1) cls = "bg-emerald-500 text-white border-emerald-500 font-extrabold";
                    else if (attempts === 2) cls = "bg-amber-500 text-white border-amber-500 font-extrabold";
                    else cls = "bg-rose-500 text-white border-rose-500 font-extrabold";
                  } else if (hasNote) {
                    cls = "bg-amber-400 text-slate-900 border-amber-400 font-extrabold";
                  } else if (isAnswered) {
                    cls = "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white font-extrabold";
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setCurrentQ(idx);
                        setIsQuestionGridPopoverOpen(false);
                      }}
                      className={`h-10 rounded-xl text-[13px] font-extrabold transition-all flex items-center justify-center relative hover:scale-105 active:scale-95 ${cls}`}
                    >
                      <span>{idx + 1}</span>
                      {hasNote && !isActive && (
                        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ═══════ FLOATING HIGHLIGHT MENU (EXACT MATCH TO REFERENCE DESIGN) ═══════ */}
      {selectionMenu && (
        <div
          id="highlight-popover-menu"
          style={{
            position: "fixed",
            top: `${selectionMenu.y}px`,
            left: `${selectionMenu.x}px`,
            transform: "translateX(-50%)",
          }}
          className="z-[999] flex items-center gap-1.5 p-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-400/30 dark:shadow-none animate-in zoom-in-95 duration-150"
        >
          {/* Yellow Circle */}
          <button
            onClick={() => addHighlight(q.id, selectionMenu.selectedText, "yellow")}
            title="Sariq ajratish"
            className="w-7 h-7 rounded-full bg-[#FEF08A] hover:scale-110 active:scale-95 transition-transform border border-amber-300 shadow-xs flex items-center justify-center cursor-pointer"
          />

          {/* Blue Circle */}
          <button
            onClick={() => addHighlight(q.id, selectionMenu.selectedText, "blue")}
            title="Ko'k ajratish"
            className="w-7 h-7 rounded-full bg-[#BAE6FD] hover:scale-110 active:scale-95 transition-transform border border-sky-300 shadow-xs flex items-center justify-center cursor-pointer"
          />

          {/* Pink Circle */}
          <button
            onClick={() => addHighlight(q.id, selectionMenu.selectedText, "pink")}
            title="Pushti ajratish"
            className="w-7 h-7 rounded-full bg-[#FBCFE8] hover:scale-110 active:scale-95 transition-transform border border-pink-300 shadow-xs flex items-center justify-center cursor-pointer"
          />

          <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-800 mx-0.5" />

          {/* Underline Button (U) */}
          <button
            onClick={() => addHighlight(q.id, selectionMenu.selectedText, "underline", true)}
            title="Ostiga chizish"
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition font-bold text-xs underline underline-offset-2 decoration-2 cursor-pointer"
          >
            U
          </button>

          {/* Note Button */}
          <button
            onClick={() => {
              setActiveNoteInput({
                selectedText: selectionMenu.selectedText,
                color: "yellow",
              });
              setNoteText("");
              setSelectionMenu(null);
            }}
            title="Eslatma (Note) qo'shish"
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
          </button>

          {/* Delete / Clear Button */}
          <button
            onClick={() => removeHighlight(q.id, selectionMenu.selectedText)}
            title="Belgilashni o'chirish"
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ═══════ STICKY NOTE MODAL ═══════ */}
      {activeNoteInput && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/30 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-500" />
                <span>Eslatma (Note) qo'shish</span>
              </span>
              <button
                onClick={() => setActiveNoteInput(null)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-[11px] text-slate-600 dark:text-slate-300 italic bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-2 rounded-lg truncate">
              "{activeNoteInput.selectedText}"
            </p>

            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Ushbu matn uchun eslatma yozing..."
              rows={3}
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs focus:outline-none focus:border-amber-400 text-slate-900 dark:text-white resize-none"
            />

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setActiveNoteInput(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Bekor qilish
              </button>
              <button
                onClick={() => {
                  addHighlight(q.id, activeNoteInput.selectedText, activeNoteInput.color, activeNoteInput.isUnderline, noteText);
                  setActiveNoteInput(null);
                }}
                className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-[#E8192C] hover:opacity-90 transition shadow-sm"
              >
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ NOTES NOTEBOOK DRAWER / MODAL ═══════ */}
      <AnimatePresence>
        {isNotesDrawerOpen && (
          <div className="fixed inset-0 z-[1000] flex justify-end bg-black/30 animate-in fade-in duration-200">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full sm:w-[420px] h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2.5">
                  <DocumentTextIcon size={24} className="text-amber-500 shrink-0" />
                  <div>
                    <h3 className="text-[15px] font-extrabold text-slate-900 dark:text-white">Mening eslatmalarim</h3>
                    <p className="text-[12px] font-extrabold text-slate-700 dark:text-slate-200">Test davomida yozilgan barcha eslatmalar</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsNotesDrawerOpen(false)}
                  className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {totalNotesCount === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                    <DocumentTextIcon size={52} className="text-amber-400 shrink-0" />
                    <p className="text-[15px] font-extrabold text-slate-900 dark:text-white">Hozircha eslatmalar yo'q</p>
                    <p className="text-[12.5px] font-extrabold text-slate-700 dark:text-slate-200 max-w-xs leading-relaxed">Savol matnidagi iboralarni ajratib, shaxsiy eslatma va qaydlaringizni biriktirishingiz mumkin.</p>
                  </div>
                ) : (
                  Object.entries(highlightsByQuestion).map(([qId, list]) => {
                    const notesInQ = list.filter((item) => item.note && item.note.trim().length > 0);
                    if (!notesInQ.length) return null;
                    const qIndex = questions.findIndex((item) => item.id === qId);

                    return (
                      <div key={qId} className="border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-2 bg-slate-50/50 dark:bg-slate-950/40">
                        <div className="flex items-center justify-between">
                          <span
                            onClick={() => {
                              if (qIndex >= 0) setCurrentQ(qIndex);
                              setIsNotesDrawerOpen(false);
                            }}
                            className="text-[13px] font-extrabold text-[#E8192C] hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <span>Savol {qIndex >= 0 ? qIndex + 1 : "?"}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>

                        {notesInQ.map((item) => (
                          <div key={item.id} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
                            <p className="text-[12px] font-extrabold text-slate-800 dark:text-slate-200 italic bg-amber-50 dark:bg-amber-500/10 p-2 rounded-lg border border-amber-200/60 dark:border-amber-500/20">
                              "{item.text}"
                            </p>
                            <p className="text-[13px] font-extrabold text-slate-900 dark:text-white pl-1">
                              📝 {item.note}
                            </p>
                            <div className="flex justify-end pt-1">
                              <button
                                onClick={() => removeHighlight(qId, item.text)}
                                className="text-[11px] font-extrabold text-red-500 hover:underline flex items-center gap-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> O'chirish
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
