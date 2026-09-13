import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  FileText, Search, Plus, Check, ArrowLeft, Trash2,
  Calendar, Clock, Sparkles, Layers, BookOpen, Loader2,
  Eye, BarChart3, Settings, Info, Upload, Copy, X,
  ChevronDown, AlertTriangle, Image as ImageIcon, Bolt
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import SEO from "@/components/SEO";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { supabase } from "@/integrations/supabase/client";

const normalizeMath = (text: string) => {
  if (!text) return "";
  let formatted = String(text)
    .replace(/\\\(/g, "$")
    .replace(/\\\)/g, "$")
    .replace(/\\\[/g, "$$")
    .replace(/\\\]/g, "$$")
    .replace(/(\$[^$]+?)\s+\$/g, "$1$");
  return formatted.trim();
};

type QuestionType =
  | "multiple_choice" | "matching" | "written"
  | "multiple_select" | "true_false" | "yes_no"
  | "fill_blanks" | "short_answer" | "numerical"
  | "ordering" | "programming" | "reading_passage" | "essay";

interface Question {
  id?: string;
  question_number: number;
  question_text: string;
  question_subtext?: string;
  question_image?: string;
  image_url?: string;
  type: QuestionType;
  metadata?: any;
  correct_answer?: any;
  explanation?: string;
  points_a?: number | null;
  points_b?: number | null;
  difficulty?: number;
  sub_questions?: Question[];
}

interface GlobalMock {
  id: string;
  title: string;
  subject: string;
  duration_minutes: number;
  questions_count: number;
}

const SUBJECTS = ["Matematika", "Ona tili", "Ingliz tili", "Fizika", "Kimyo", "Biologiya", "Tarix", "SAT"];

const QUESTION_TYPES = [
  { value: "multiple_choice", label: "[MC] Bitta tanlov" },
  { value: "multiple_select", label: "[MS] Ko'p tanlov" },
  { value: "true_false", label: "[TF] To'g'ri / Yolg'on" },
  { value: "yes_no", label: "[YN] Ha / Yo'q" },
  { value: "fill_blanks", label: "[FB] Bo'sh joyni to'ldirish" },
  { value: "short_answer", label: "[SA] Qisqa javob" },
  { value: "numerical", label: "[NU] Raqamli javob" },
  { value: "essay", label: "[ES] Insho / Yozma" },
  { value: "matching", label: "[MA] Moslashtirish" },
  { value: "ordering", label: "[OR] Tartiblash" },
  { value: "programming", label: "[PR] Dasturlash" },
  { value: "reading_passage", label: "[RP] Matnli savol" },
];

const DEFAULT_BULK = `[MC]
O'zbekiston Respublikasi poytaxti qaysi shahar?
A) Samarqand
B) Buxoro
C) Toshkent *
D) Xiva
@points:10

---

[MS]
Quyidagilardan qaysi biri dasturlash tili hisoblanadi?
A) Python *
B) HTML
C) TypeScript *
D) CSS
@points:15

---

[MA]
Davlatlar va ularning poytaxtlarini moslashtiring:
1. O'zbekiston -> A. Toshkent
2. Fransiya -> B. Parij
3. Yaponiya -> C. Tokio
4. Germaniya -> D. Berlin
@points:20

---

[FB]
Amir Temur _ yilda tavallud topgan va uning davlati poytaxti _ shahri bo'lgan.
1336 | 1336-yil
Samarqand
@points:15

---

[ES]
Axborot texnologiyalarining zamonaviy ta'limdagi o'rni haqida o'z fikringizni bayon qiling (100-150 so'z).
@points:25

---

[PASSAGE]
Alisher Navoiy 1441-yil 9-fevralda Hirot shahrida tug'ilgan. U buyuk o'zbek shoiri, mutafakkiri va davlat arbobidir. Navoiy turkiy tilda birinchi bo'lib mashhur "Xamsa" asarini yaratgan.

[MC]
Alisher Navoiy qaysi shaharda tavallud topgan?
A) Samarqand
B) Hirot *
C) Mashhad
D) Buxoro
@points:10

[MC]
Navoiy turkiy tilda qaysi mashhur asarni yaratgan?
A) Boburnoma
B) Xamsa *
C) Qutadg'u bilig
D) Devoni hikmat
@points:10
[ENDPASSAGE]
`;

const TABS = [
  { key: "info", label: "Ma'lumotlar", icon: Info },
  { key: "source", label: "Test manbasi", icon: Layers },
  { key: "questions", label: "Savollar", icon: FileText },
  { key: "bulk", label: "Matnli yuklash", icon: Bolt },
  { key: "classes", label: "Sinflar", icon: BookOpen },
  { key: "exam", label: "Imtihon", icon: Clock },
  { key: "results", label: "Natija", icon: BarChart3 },
  { key: "preview", label: "Ko'rish", icon: Eye },
];

const getQuestionBlanks = (question: any): { key: string; label: string; alternatives: string[] }[] => {
  if (question.metadata?.blanks && Array.isArray(question.metadata.blanks)) {
    return question.metadata.blanks.map((b: any, idx: number) => {
      if (typeof b === "string") {
        let key = String.fromCharCode(97 + idx);
        const match = b.match(/^([a-zA-Z0-9]+)[\).\s]+(.*)/);
        if (match) { key = match[1].toLowerCase(); }
        const parts = b.split("|").map((s: string) => s.trim()).filter(Boolean);
        return { key, label: `${key.toUpperCase()})`, alternatives: parts };
      }
      const key = b.key || String.fromCharCode(97 + idx);
      const alternatives = Array.isArray(b.alternatives) ? b.alternatives : (b.text || "").split("|").map((s: string) => s.trim()).filter(Boolean);
      return { key, label: `${key.toUpperCase()})`, alternatives };
    });
  }
  if (Array.isArray(question.correct_answer)) {
    return question.correct_answer.map((ans: any, idx: number) => {
      let key = String.fromCharCode(97 + idx);
      let textPart = String(ans);
      const match = textPart.match(/^([a-zA-Z0-9]+)[\).\s]+(.*)/);
      if (match) key = match[1].toLowerCase();
      const parts = textPart.split("|").map((s: string) => s.trim()).filter(Boolean);
      return { key, label: `${key.toUpperCase()})`, alternatives: parts };
    });
  }
  if (typeof question.correct_answer === "object" && question.correct_answer !== null) {
    return Object.keys(question.correct_answer).map((key) => {
      const val = question.correct_answer[key];
      const parts = Array.isArray(val) ? val : String(val).split("|").map((s: string) => s.trim()).filter(Boolean);
      return { key: key.toLowerCase(), label: `${key.toUpperCase()})`, alternatives: parts };
    });
  }
  return [{ key: "a", label: "A)", alternatives: [] }];
};

const parseBulkQuestions = (rawText: string): any[] => {
  if (!rawText || !rawText.trim()) return [];
  let normalizedText = rawText.replace(/(?:^|\n)\s*#+\s*(\[(?:MC|MS|TF|YN|FB|SA|NU|ES|MA|OR|PR|RP|SINGLE|MULTIPLE|PASSAGE|ENDPASSAGE)\])/gi, "\n$1");
  let rawBlocks = normalizedText
    .split(/(?:^|\n)(?=[\s]*\[(?:MC|MS|TF|YN|FB|SA|NU|ES|MA|OR|PR|RP|SINGLE|MULTIPLE|PASSAGE|ENDPASSAGE)\])/i)
    .map((b) => b.trim()).filter(Boolean);
  if (rawBlocks.length <= 1) {
    rawBlocks = normalizedText.split(/---/).map((b) => b.trim()).filter(Boolean);
  }
  const parsed: any[] = [];
  let currentPassageId: string | null = null;
  let currentPassageText = "";

  rawBlocks.forEach((block) => {
    const blockUpper = block.toUpperCase();
    if (blockUpper.startsWith("[PASSAGE]")) {
      currentPassageText = block.replace(/^\[PASSAGE\]\s*/i, "").trim();
      currentPassageId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
      return;
    }
    if (blockUpper.startsWith("[ENDPASSAGE]")) { currentPassageId = null; currentPassageText = ""; return; }

    let type: QuestionType = "multiple_choice";
    if (blockUpper.startsWith("[MC]") || blockUpper.startsWith("[SINGLE]")) type = "multiple_choice";
    else if (blockUpper.startsWith("[MS]") || blockUpper.startsWith("[MULTIPLE]")) type = "multiple_select";
    else if (blockUpper.startsWith("[TF]")) type = "true_false";
    else if (blockUpper.startsWith("[YN]")) type = "yes_no";
    else if (blockUpper.startsWith("[FB]")) type = "fill_blanks";
    else if (blockUpper.startsWith("[SA]")) type = "short_answer";
    else if (blockUpper.startsWith("[NU]")) type = "numerical";
    else if (blockUpper.startsWith("[ES]")) type = "essay";
    else if (blockUpper.startsWith("[MA]")) type = "matching";
    else if (blockUpper.startsWith("[OR]")) type = "ordering";
    else if (blockUpper.startsWith("[PR]")) type = "programming";
    else if (blockUpper.startsWith("[RP]")) type = "reading_passage";
    else return;

    const body = block.replace(/^\[(?:MC|MS|TF|YN|FB|SA|NU|ES|MA|OR|PR|RP|SINGLE|MULTIPLE)\]\s*/i, "").trim();
    const lines = body.split("\n").map((l) => l.trim()).filter(Boolean);

    let question_text = "";
    const options: string[] = [];
    let correct_answer: any = type === "multiple_select" ? [] : "A";
    let explanation = "";
    let points_a: number | null = null;
    let difficulty: number | undefined;

    // Matching structures
    const leftItems: string[] = [];
    const rightItems: string[] = [];
    const matchingPairs: Record<string, string> = {};

    // Blanks structures
    const blanksList: Array<{ key: string; label: string; alternatives: string[] }> = [];
    const blanksAnswerObj: Record<string, string[]> = {};

    for (const line of lines) {
      if (line.startsWith("@exp:")) { explanation = line.slice(5).trim(); continue; }
      if (line.startsWith("@points:")) { points_a = parseInt(line.slice(8)) || null; continue; }
      if (line.startsWith("@diff:")) { difficulty = parseInt(line.slice(6)) || undefined; continue; }

      // 1. Multiple Choice Option parsing: "A) Text *"
      const optMatch = line.match(/^([A-F])\)\s*(.+)/i);
      if (optMatch && (type === "multiple_choice" || type === "multiple_select" || type === "reading_passage")) {
        const letter = optMatch[1].toUpperCase();
        const text = optMatch[2].trim();
        const isCorrect = text.includes("*");
        options.push(text.replace(/\*$/, "").trim());
        if (isCorrect) {
          if (type === "multiple_select") {
            (correct_answer as string[]).push(letter);
          } else {
            correct_answer = letter;
          }
        }
        continue;
      }

      // First non-metadata line is question_text
      if (!question_text) {
        question_text = line;
        continue;
      }

      // 2. Matching line parsing: "1. Uzbekistan -> A. Tashkent" or "1 -> A"
      if (type === "matching") {
        const arrowMatch = line.match(/^(?:([0-9]+)[\.\)\s]*)?(.*?)\s*(?:->|=>|→)\s*(?:([A-Za-z])[\.\)\s]*)?(.*)$/);
        if (arrowMatch) {
          const lNum = arrowMatch[1] || String(leftItems.length + 1);
          const lText = (arrowMatch[2] || "").trim() || `${lNum}-topshiriq`;
          const rLetter = (arrowMatch[3] || String.fromCharCode(65 + rightItems.length)).toUpperCase();
          const rText = (arrowMatch[4] || "").trim() || `${rLetter} varianti`;

          leftItems.push(lText);
          rightItems.push(rText);
          matchingPairs[lNum] = rLetter;
          continue;
        }
      }

      // 3. Fill Blanks line parsing: "Chirchiq | Sirdaryo"
      if (type === "fill_blanks") {
        const bKey = String.fromCharCode(97 + blanksList.length);
        const alts = line.split("|").map((s) => s.trim()).filter(Boolean);
        blanksList.push({
          key: bKey,
          label: `${bKey.toUpperCase()})`,
          alternatives: alts
        });
        blanksAnswerObj[bKey] = alts;
        continue;
      }

      // 4. Other types
      if (type === "true_false") {
        correct_answer = line;
      } else if (type === "yes_no") {
        correct_answer = line;
      } else if (type === "short_answer" || type === "numerical") {
        correct_answer = line.split(",").map((s: string) => s.trim()).filter(Boolean);
      }
    }

    if (type === "multiple_choice" && options.length === 0) {
      correct_answer = lines.find((l) => l.includes("*"))?.replace(/\*$/, "").trim() || "";
    }

    let meta: any = {};
    if (options.length > 0) meta.options = options;
    if (type === "matching" && leftItems.length > 0) {
      meta.left = leftItems;
      meta.right = rightItems;
      correct_answer = matchingPairs;
    }
    if (type === "fill_blanks" && blanksList.length > 0) {
      meta.blanks = blanksList;
      correct_answer = blanksAnswerObj;
    }

    const q: any = {
      question_number: parsed.length + 1,
      question_text,
      type,
      metadata: meta,
      correct_answer,
      explanation,
      points_a,
      difficulty,
    };
    if (currentPassageId) {
      q.metadata = { ...q.metadata, passage_id: currentPassageId, passage_text: currentPassageText };
    }
    parsed.push(q);
  });
  return parsed;
};

const TASHKENT_OFFSET = "+05:00";

const toLocalDatetimeValue = (date: Date): string => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const getDefaultStartAt = (): string => {
  const now = new Date();
  now.setHours(now.getHours() + 1, 0, 0, 0);
  return toLocalDatetimeValue(now);
};

const getDefaultEndAt = (): string => {
  const now = new Date();
  now.setHours(now.getHours() + 5, 0, 0, 0);
  return toLocalDatetimeValue(now);
};

const CenterMockWizard = () => {
  const { id: editId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState("info");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Basic info
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("Matematika");

  // Source
  const [sourceType, setSourceType] = useState<"library" | "custom">("library");
  const [selectedMock, setSelectedMock] = useState<GlobalMock | null>(null);
  const [librarySearch, setLibrarySearch] = useState("");

  // Questions
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [questionSearchQuery, setQuestionSearchQuery] = useState("");
  const [bulkText, setBulkText] = useState(DEFAULT_BULK);

  // Classes
  const [assignAllClasses, setAssignAllClasses] = useState(false);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);

  // Exam config
  const [mode, setMode] = useState<"simple" | "exam">("exam");
  const [durationMinutes, setDurationMinutes] = useState(240);
  const [attemptLimit, setAttemptLimit] = useState(1);
  const [examStartAt, setExamStartAt] = useState(getDefaultStartAt);
  const [examEndAt, setExamEndAt] = useState(getDefaultEndAt);
  const [autoSubmitAtEnd, setAutoSubmitAtEnd] = useState(true);
  const [enableWarnings, setEnableWarnings] = useState(false);

  // Result config
  const [resultReleasePolicy, setResultReleasePolicy] = useState<"immediate" | "after_window">("after_window");
  const [resultPolicy, setResultPolicy] = useState<"best" | "latest" | "first" | "average">("best");

  // Fetch classes
  const { data: classesData } = useQuery<{ classes: any[] }>({
    queryKey: ["center-classes"],
    queryFn: async () => {
      const res = await fetch("/api/center/classes", { credentials: "include" });
      if (!res.ok) return { classes: [] };
      return res.json();
    }
  });

  // Fetch library mocks
  const { data: libraryData, isLoading: libraryLoading } = useQuery<{ tests: GlobalMock[] }>({
    queryKey: ["center-library-mocks", subject, librarySearch],
    queryFn: async () => {
      const query = new URLSearchParams();
      if (subject) query.set("subject", subject);
      if (librarySearch) query.set("search", librarySearch);
      const res = await fetch(`/api/center/library/mocks?${query.toString()}`, { credentials: "include" });
      if (!res.ok) return { tests: [] };
      return res.json();
    }
  });

  // Load existing test for editing
  useEffect(() => {
    if (!editId) return;
    (async () => {
      try {
        const res = await fetch(`/api/center/tests/${editId}`, { credentials: "include" });
        if (!res.ok) return;
        const json = await res.json();
        const test = json.test;
        setTitle(test.title || "");
        setDescription(test.description || "");
        setSubject(test.subject || "Matematika");
        setMode(test.mode || "exam");
        setDurationMinutes(test.duration_minutes || 120);
        setAttemptLimit(test.attempt_limit || 1);
        setExamStartAt(test.exam_start_at ? toLocalDatetimeValue(new Date(test.exam_start_at)) : "");
        setExamEndAt(test.exam_end_at ? toLocalDatetimeValue(new Date(test.exam_end_at)) : "");
        setAutoSubmitAtEnd(test.auto_submit_at_exam_end !== false);
        setEnableWarnings(test.enable_warnings || false);
        setResultReleasePolicy(test.result_release_policy || "after_window");
        setResultPolicy(test.result_policy || "best");
        setAssignAllClasses(test.assign_all_classes || false);
        if (test.custom_questions && Array.isArray(test.custom_questions)) {
          setQuestions(test.custom_questions.map((q: any, i: number) => ({ ...q, question_number: i + 1 })));
          setSourceType("custom");
        }
        if (test.source_test_id) {
          setSourceType("library");
        }
        if (test.assigned_classes) {
          setSelectedClassIds(test.assigned_classes.map((c: any) => c.id));
        }
      } catch (err) {
        console.error("Failed to load test:", err);
      }
    })();
  }, [editId]);

  const curQ = questions[activeQuestion] || null;

  const handleQuestionChange = (index: number, field: string, value: any) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addQuestion = () => {
    const newQ: Question = {
      question_number: questions.length + 1,
      question_text: "",
      question_image: "",
      type: "multiple_choice",
      metadata: { options: ["", "", "", ""] },
      correct_answer: "A",
      explanation: "",
      points_a: null,
      points_b: null,
    };
    setQuestions((prev) => [...prev, newQ]);
    setActiveQuestion(questions.length);
  };

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) return;
    setQuestions((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      return updated.map((q, i) => ({ ...q, question_number: i + 1 }));
    });
    if (activeQuestion >= questions.length - 1) {
      setActiveQuestion(Math.max(0, questions.length - 2));
    }
  };

  const handleApplyBulk = () => {
    const parsed = parseBulkQuestions(bulkText);
    if (parsed.length === 0) {
      toast({ title: "Xatolik", description: "Savollar topilmadi. Formatni tekshiring.", variant: "destructive" });
      return;
    }
    setQuestions(parsed.map((q, i) => ({ ...q, question_number: i + 1 })));
    setActiveQuestion(0);
    toast({ title: "Yuklandi!", description: `${parsed.length} ta savol import qilindi` });
    setActiveTab("questions");
  };

  const handleImageUpload = async (file: File, qIndex: number) => {
    if (!file.type.startsWith("image/")) return;
    setIsUploadingImage(true);
    try {
      const compressed = await compressImageFile(file);
      const fileName = `questions/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const { data, error } = await supabase.storage.from("question-images").upload(fileName, compressed, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("question-images").getPublicUrl(data.path);
      handleQuestionChange(qIndex, "question_image", urlData.publicUrl);
      toast({ title: "Yuklandi!", description: "Rasm muvaffaqiyatli yuklandi" });
    } catch (err: any) {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const compressImageFile = (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const maxW = 1200;
          const ratio = Math.min(maxW / img.width, 1);
          canvas.width = img.width * ratio;
          canvas.height = img.height * ratio;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => resolve(blob || file), "image/jpeg", 0.85);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePasteImage = useCallback((e: React.ClipboardEvent, qIndex: number) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) handleImageUpload(file, qIndex);
        break;
      }
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, qIndex: number) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageUpload(file, qIndex);
  }, []);

  const handleSave = async (publish: boolean) => {
    if (!title.trim()) {
      toast({ title: "Xatolik", description: "Mock test nomini kiriting", variant: "destructive" });
      return;
    }
    if (sourceType === "custom" && questions.length === 0) {
      toast({ title: "Xatolik", description: "Kamida bitta savol qo'shing", variant: "destructive" });
      return;
    }
    if (!assignAllClasses && selectedClassIds.length === 0) {
      toast({ title: "Xatolik", description: "Kamida bitta sinfni tanlang", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const body: any = {
        title: title.trim(),
        description: description.trim() || null,
        subject,
        source_test_id: sourceType === "library" ? selectedMock?.id : null,
        custom_questions: sourceType === "custom" ? questions : null,
        mode,
        duration_minutes: durationMinutes,
        attempt_limit: attemptLimit,
        result_policy: resultPolicy,
        result_release_policy: resultReleasePolicy,
        exam_start_at: mode === "exam" ? examStartAt : null,
        exam_end_at: mode === "exam" ? examEndAt : null,
        auto_submit_at_exam_end: autoSubmitAtEnd,
        enable_warnings: enableWarnings,
        assign_all_classes: assignAllClasses,
        class_ids: selectedClassIds,
        publish_now: publish,
      };

      const url = editId ? `/api/center/tests/${editId}` : "/api/center/tests";
      const method = editId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body)
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Saqlashda xatolik");

      toast({
        title: "Muvaffaqiyatli!",
        description: publish ? "Mock test chop etildi!" : "Qoralama saqlandi."
      });
      queryClient.invalidateQueries({ queryKey: ["center-tests"] });
      navigate("/center/tests");
    } catch (err: any) {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const classes = classesData?.classes || [];
  const libraryTests = libraryData?.tests || [];

  return (
    <>
      <SEO title={`${editId ? "Tahrirlash" : "Yaratish"} — Mock test — Markaz boshqaruvi`} />
      <div className="space-y-4">
        {/* HEADER */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link to="/center/tests" className="p-2 rounded-lg border border-slate-200 dark:border-white/[0.06] text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-colors shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white truncate">{editId ? "Mock testni tahrirlash" : "Mock test yaratish"}</h1>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">{sourceType === "custom" ? `${questions.length} ta savol` : "EduContest mockini biriktirish"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button disabled={isSubmitting} onClick={() => handleSave(false)} className="px-3 sm:px-4 py-2 rounded-lg border border-slate-200 dark:border-white/[0.06] font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer transition-colors">
              Qoralama
            </button>
            <button disabled={isSubmitting} onClick={() => handleSave(true)} className="px-3.5 sm:px-5 py-2 bg-[#E8192C] hover:bg-[#D41524] text-white rounded-lg font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm shadow-red-500/20 transition-colors">
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>{editId ? "Saqlash" : "Chop etish"}</span>}
            </button>
          </div>
        </div>

        {/* TABS */}
        <div className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-2xl overflow-hidden shadow-xs">
          <div className="flex overflow-x-auto border-b border-slate-200 dark:border-white/[0.06] scrollbar-none">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-3.5 sm:px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors cursor-pointer shrink-0 ${
                    isActive ? "border-[#E8192C] text-[#E8192C] bg-red-50/30 dark:bg-red-950/10"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                  }`}>
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}{tab.key === "questions" ? ` (${questions.length})` : ""}</span>
                </button>
              );
            })}
          </div>

          <div className="p-4 sm:p-5 lg:p-6">

            {/* TAB: INFO */}
            {activeTab === "info" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-in fade-in duration-200">
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Asosiy ma'lumotlar</h3>
                  <div className="space-y-2">
                    <div>
                      <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1 block">Mock test nomi *</label>
                      <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="SAT Math Mock #12"
                        className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] text-[12px] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E8192C]/20 focus:border-[#E8192C]" />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1 block">Tavsif</label>
                      <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Test haqida qisqa ma'lumot..."
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] text-[12px] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E8192C]/20 resize-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1 block">Fan *</label>
                        <select value={subject} onChange={(e) => setSubject(e.target.value)}
                          className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] text-[12px] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E8192C]/20">
                          {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1 block">Davomiyligi (daqiqa)</label>
                        <input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))}
                          className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] text-[12px] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E8192C]/20" />
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5 p-3 bg-amber-50/70 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl">
                      <input type="checkbox" checked={enableWarnings} onChange={(e) => setEnableWarnings(e.target.checked)}
                        className="w-4 h-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500/10 mt-0.5" />
                      <div>
                        <label className="text-[12px] font-bold text-amber-900 dark:text-amber-300 block cursor-pointer">Oynalar o'zgarishida ogohlantirish</label>
                        <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-normal mt-0.5">O'quvchi boshqa dasturga o'tganda 10 soniyalik taymer chiqadi.</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Imtihon sozlamalari</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div onClick={() => setMode("exam")} className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${mode === "exam" ? "border-[#E8192C] bg-red-50/30 dark:bg-red-950/10" : "border-slate-200 dark:border-white/[0.06]"}`}>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Imtihon rejimi</div>
                      <p className="text-[10px] text-slate-500 mt-0.5">Aniq vaqt oynasi</p>
                    </div>
                    <div onClick={() => setMode("simple")} className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${mode === "simple" ? "border-[#E8192C] bg-red-50/30 dark:bg-red-950/10" : "border-slate-200 dark:border-white/[0.06]"}`}>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Oddiy rejim</div>
                      <p className="text-[10px] text-slate-500 mt-0.5">Istalgan vaqtda</p>
                    </div>
                  </div>
                  {mode === "exam" && (
                    <div className="grid grid-cols-2 gap-3 p-3 bg-white dark:bg-[#0B0F1A] border border-slate-200 dark:border-white/[0.06] rounded-lg">
                      <div><label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Boshlanish</label>
                        <input type="datetime-local" value={examStartAt} onChange={(e) => setExamStartAt(e.target.value)} className="w-full h-8 px-2 bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-lg text-[11px] text-slate-900 dark:text-white outline-none" /></div>
                      <div><label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tugash</label>
                        <input type="datetime-local" value={examEndAt} onChange={(e) => setExamEndAt(e.target.value)} className="w-full h-8 px-2 bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-lg text-[11px] text-slate-900 dark:text-white outline-none" /></div>
                      <div className="col-span-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked={autoSubmitAtEnd} onChange={(e) => setAutoSubmitAtEnd(e.target.checked)} className="w-3.5 h-3.5 rounded" />
                          <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">Tugashida avtomatik yakunlash</span>
                        </div>
                        <span className="text-[9px] text-slate-400 font-medium">Toshkent (UTC+5)</span>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Urinishlar</label>
                      <select value={attemptLimit} onChange={(e) => setAttemptLimit(Number(e.target.value))}
                        className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] text-[12px] focus:outline-none">
                        <option value={1}>1</option><option value={2}>2</option><option value={3}>3</option><option value={0}>Cheksiz</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Natija siyosati</label>
                      <select value={resultPolicy} onChange={(e) => setResultPolicy(e.target.value as any)}
                        className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] text-[12px] focus:outline-none">
                        <option value="best">Eng yaxshi</option><option value="latest">Oxirgi</option><option value="first">Birinchi</option><option value="average">O'rtacha</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div onClick={() => setResultReleasePolicy("after_window")} className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${resultReleasePolicy === "after_window" ? "border-[#E8192C] bg-red-50/30" : "border-slate-200 dark:border-white/[0.06]"}`}>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Oyna tugagach</div>
                    </div>
                    <div onClick={() => setResultReleasePolicy("immediate")} className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${resultReleasePolicy === "immediate" ? "border-[#E8192C] bg-red-50/30" : "border-slate-200 dark:border-white/[0.06]"}`}>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Darhol</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: SOURCE */}
            {activeTab === "source" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Test manbasini tanlang</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div onClick={() => setSourceType("library")} className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${sourceType === "library" ? "border-[#E8192C] bg-red-50/30 dark:bg-red-950/10" : "border-slate-200 dark:border-white/[0.06]"}`}>
                    <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white"><Sparkles className="w-4 h-4 text-[#E8192C]" /><span>EduContest mockini biriktirish</span></div>
                    <p className="text-[11px] text-slate-500 mt-1">Platformadagi rasmiy mocklardan foydalaning.</p>
                  </div>
                  <div onClick={() => setSourceType("custom")} className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${sourceType === "custom" ? "border-[#E8192C] bg-red-50/30 dark:bg-red-950/10" : "border-slate-200 dark:border-white/[0.06]"}`}>
                    <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white"><Plus className="w-4 h-4 text-slate-500" /><span>Custom test yaratish</span></div>
                    <p className="text-[11px] text-slate-500 mt-1">O'z savollaringizni yarating.</p>
                  </div>
                </div>
                {sourceType === "library" && (
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="text" value={librarySearch} onChange={(e) => setLibrarySearch(e.target.value)} placeholder="Mocklarini qidirish..."
                        className="w-full h-10 pl-9 pr-4 bg-white dark:bg-[#0B0F1A] border border-slate-200 dark:border-white/[0.06] rounded-lg text-xs font-semibold focus:border-[#E8192C] outline-none" />
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-white/[0.04] border border-slate-200 dark:border-white/[0.06] rounded-lg">
                      {libraryLoading ? <div className="p-6 text-center text-xs text-slate-400">Yuklanmoqda...</div>
                      : libraryTests.length > 0 ? libraryTests.map((t) => (
                        <div key={t.id} onClick={() => { setSelectedMock(t); if (!title) setTitle(t.title); }}
                          className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${selectedMock?.id === t.id ? "bg-red-50/50 dark:bg-red-950/20" : "hover:bg-slate-50 dark:hover:bg-white/[0.02]"}`}>
                          <div>
                            <div className="text-xs font-bold text-slate-900 dark:text-white">{t.title}</div>
                            <div className="text-[11px] text-slate-400">{t.subject} • {t.questions_count || 43} savol • {t.duration_minutes || 120} daqiqa</div>
                          </div>
                          <button className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all shrink-0 ${selectedMock?.id === t.id ? "bg-[#E8192C] text-white" : "bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300"}`}>
                            {selectedMock?.id === t.id ? "Tanlandi ✓" : "Tanlash"}
                          </button>
                        </div>
                      )) : <div className="p-6 text-center text-xs text-slate-400">Topilmadi.</div>}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: QUESTIONS */}
            {activeTab === "questions" && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 animate-in fade-in duration-200">
                {/* Sidebar */}
                <div className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl overflow-hidden max-h-[calc(100vh-200px)] flex flex-col">
                  <div className="p-3 border-b border-slate-100 dark:border-white/[0.06] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Savollar ({questions.length})</span>
                      <button onClick={addQuestion} className="p-1 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors" title="Qo'shish">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="text" value={questionSearchQuery} onChange={(e) => setQuestionSearchQuery(e.target.value)} placeholder="Qidirish..."
                        className="w-full h-8 pl-8 pr-7 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] text-[11px] focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {questions.map((q, realIdx) => ({ q, realIdx })).filter(({ q, realIdx }) => {
                      if (!questionSearchQuery.trim()) return true;
                      const query = questionSearchQuery.toLowerCase();
                      return String(realIdx + 1).includes(query) || (q.question_text || "").toLowerCase().includes(query) || (q.type || "").toLowerCase().includes(query);
                    }).map(({ q, realIdx }) => (
                      <button key={realIdx} onClick={() => setActiveQuestion(realIdx)}
                        className={`w-full p-2 rounded-lg border text-left transition-all flex items-center gap-2.5 ${
                          activeQuestion === realIdx ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm"
                          : q.question_text ? "bg-emerald-50/60 dark:bg-emerald-500/10 border-emerald-300/60 dark:border-emerald-800/60 text-slate-800 dark:text-slate-200 hover:bg-emerald-100/50"
                          : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/[0.06] text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"
                        }`}>
                        <span className={`w-6 h-6 rounded-md font-mono text-[11px] font-bold flex items-center justify-center shrink-0 ${activeQuestion === realIdx ? "bg-emerald-500 text-white" : "bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300"}`}>
                          {realIdx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-medium truncate leading-tight">{q.question_text || "Savol matni kiritilmagan"}</p>
                          <span className="text-[9px] uppercase font-mono opacity-60">{q.type}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Editor */}
                {curQ && (
                  <div className="lg:col-span-3 space-y-4">
                    <div className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl overflow-hidden">
                      <div className="p-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center text-[11px] font-bold">{activeQuestion + 1}</span>
                          <span className="text-[12px] font-semibold text-slate-900 dark:text-white">Savolni tahrirlash</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <select value={curQ.type} onChange={(e) => handleQuestionChange(activeQuestion, "type", e.target.value)}
                            className="h-8 px-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] text-[11px] focus:outline-none">
                            {QUESTION_TYPES.map((qt) => <option key={qt.value} value={qt.value}>{qt.label}</option>)}
                          </select>
                          {questions.length > 1 && (
                            <button onClick={() => removeQuestion(activeQuestion)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors" title="O'chirish">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="p-5 space-y-5">
                        <div>
                          <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1 block">Savol matni *</label>
                          <textarea value={curQ.question_text} onChange={(e) => handleQuestionChange(activeQuestion, "question_text", e.target.value)}
                            placeholder="Savol matnini kiriting..." rows={5}
                            className="w-full px-3.5 py-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] text-[13px] leading-relaxed text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E8192C]/20 resize-y min-h-[120px]" />
                        </div>

                        <div>
                          <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1 block">Qo'shimcha matn (ixtiyoriy)</label>
                          <textarea value={curQ.question_subtext || ""} onChange={(e) => handleQuestionChange(activeQuestion, "question_subtext", e.target.value)}
                            placeholder="Matnli parcha yoki shartlar..." rows={3}
                            className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] text-[12px] leading-relaxed text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E8192C]/20 resize-y min-h-[80px]" />
                        </div>

                        {/* Image Upload */}
                        <div onPaste={(e) => handlePasteImage(e, activeQuestion)} onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, activeQuestion)}>
                          <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1 block">Savol rasmi</label>
                          {(curQ.question_image || curQ.image_url) ? (
                            <div className="relative group rounded-xl border border-slate-200 dark:border-white/[0.06] p-3 bg-slate-50 dark:bg-white/5 flex items-center gap-4">
                              <img src={curQ.question_image || curQ.image_url} alt="Rasm" className="w-20 h-20 object-contain rounded-lg border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-slate-900" />
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-medium text-slate-900 dark:text-white truncate">Rasm yuklangan</p>
                                <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1"><Check className="w-3 h-3" /> Saqlangan</p>
                              </div>
                              <button onClick={() => handleQuestionChange(activeQuestion, "question_image", "")} className="p-1.5 text-slate-400 hover:text-red-600 rounded-md"><X className="w-4 h-4" /></button>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-slate-200 dark:border-white/[0.1] hover:border-[#E8192C]/50 rounded-xl bg-slate-50/50 dark:bg-white/[0.02] cursor-pointer transition-all">
                              <Upload className="w-6 h-6 text-slate-400" />
                              <span className="text-[11px] font-medium text-slate-500">Sudrab tashlang, bosing yoki Ctrl+V</span>
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, activeQuestion); }} />
                            </label>
                          )}
                        </div>

                        {/* Type-specific editors */}
                        {(curQ.type === "multiple_choice" || curQ.type === "multiple_select") && (
                          <div className="space-y-3">
                            <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block">
                              {curQ.type === "multiple_choice" ? "Variantlar (bitta to'g'ri)" : "Variantlar (ko'p to'g'ri)"}
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {["A", "B", "C", "D"].map((char, i) => {
                                const isSelected = curQ.type === "multiple_choice" ? curQ.correct_answer === char : Array.isArray(curQ.correct_answer) && curQ.correct_answer.includes(char);
                                return (
                                  <div key={char} className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${isSelected ? "border-emerald-500/50 bg-emerald-500/5" : "border-slate-100 dark:border-white/[0.06]"}`}>
                                    <button type="button" onClick={() => {
                                      if (curQ.type === "multiple_choice") handleQuestionChange(activeQuestion, "correct_answer", char);
                                      else { const arr = Array.isArray(curQ.correct_answer) ? curQ.correct_answer : []; handleQuestionChange(activeQuestion, "correct_answer", arr.includes(char) ? arr.filter((c: string) => c !== char) : [...arr, char]); }
                                    }} className={`w-7 h-7 rounded-md border flex items-center justify-center font-bold text-[10px] shrink-0 ${isSelected ? "bg-emerald-600 text-white border-emerald-600" : "bg-slate-100 dark:bg-white/5 text-slate-400 border-slate-200 dark:border-white/[0.06]"}`}>
                                      {char}
                                    </button>
                                    <input type="text" value={curQ.metadata?.options?.[i] || ""} onChange={(e) => {
                                      const opts = [...(curQ.metadata?.options || [])]; opts[i] = e.target.value;
                                      handleQuestionChange(activeQuestion, "metadata", { ...curQ.metadata, options: opts });
                                    }} placeholder={`${char} varianti...`} className="flex-1 bg-transparent outline-none text-[12px] font-medium text-slate-900 dark:text-white" />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {curQ.type === "true_false" && (
                          <div className="space-y-2">
                            <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block">To'g'ri javob</label>
                            <div className="flex items-center gap-3">
                              {["To'g'ri", "Yolg'on"].map((val) => (
                                <button key={val} type="button" onClick={() => handleQuestionChange(activeQuestion, "correct_answer", val)}
                                  className={`px-4 py-2 rounded-lg border text-[12px] font-bold transition-all ${curQ.correct_answer === val ? "bg-emerald-600 text-white border-emerald-600 shadow-sm" : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/[0.06] text-slate-700 dark:text-slate-300"}`}>
                                  {val}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {curQ.type === "yes_no" && (
                          <div className="space-y-2">
                            <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block">To'g'ri javob</label>
                            <div className="flex items-center gap-3">
                              {["Ha", "Yo'q"].map((val) => (
                                <button key={val} type="button" onClick={() => handleQuestionChange(activeQuestion, "correct_answer", val)}
                                  className={`px-4 py-2 rounded-lg border text-[12px] font-bold transition-all ${curQ.correct_answer === val ? "bg-emerald-600 text-white border-emerald-600 shadow-sm" : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/[0.06] text-slate-700 dark:text-slate-300"}`}>
                                  {val}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {curQ.type === "short_answer" && (
                          <div>
                            <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1 block">Qabul qilinadigan javoblar (vergul bilan)</label>
                            <input type="text" value={Array.isArray(curQ.correct_answer) ? curQ.correct_answer.join(", ") : curQ.correct_answer || ""}
                              onChange={(e) => handleQuestionChange(activeQuestion, "correct_answer", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                              placeholder="Javob1, Javob2" className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] text-[12px] focus:outline-none" />
                          </div>
                        )}

                        {curQ.type === "numerical" && (
                          <div>
                            <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1 block">Raqamli javob (muqobil)</label>
                            <input type="text" value={Array.isArray(curQ.correct_answer) ? curQ.correct_answer.join(" | ") : curQ.correct_answer || ""}
                              onChange={(e) => handleQuestionChange(activeQuestion, "correct_answer", e.target.value.split("|").map((s) => s.trim()).filter(Boolean))}
                              placeholder="9.8 | 0.1 | m/s²" className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] text-[12px] focus:outline-none" />
                          </div>
                        )}

                        {curQ.type === "fill_blanks" && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Bo'sh joylar javoblari</label>
                              <button type="button" onClick={() => {
                                const blanks = getQuestionBlanks(curQ);
                                const nextKey = String.fromCharCode(97 + blanks.length);
                                handleQuestionChange(activeQuestion, "metadata", { ...curQ.metadata, blanks: [...blanks, { key: nextKey, label: `${nextKey.toUpperCase()})`, alternatives: [""] }] });
                              }} className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700">
                                <Plus className="w-3.5 h-3.5" /> <span>Qo'shish</span>
                              </button>
                            </div>
                            {getQuestionBlanks(curQ).map((blank, idx) => (
                              <div key={blank.key} className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/5">
                                <span className="w-6 h-6 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] flex items-center justify-center shrink-0">{blank.key.toUpperCase()}</span>
                                <input type="text" value={blank.alternatives.join(" | ")}
                                  onChange={(e) => {
                                    const blanks = getQuestionBlanks(curQ);
                                    blanks[idx] = { ...blank, alternatives: e.target.value.split("|").map((s) => s.trim()) };
                                    handleQuestionChange(activeQuestion, "metadata", { ...curQ.metadata, blanks });
                                    const answersObj: Record<string, string[]> = {};
                                    blanks.forEach((b) => { answersObj[b.key] = b.alternatives; });
                                    handleQuestionChange(activeQuestion, "correct_answer", answersObj);
                                  }}
                                  placeholder="Javob | Muqobil" className="flex-1 h-8 px-3 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[12px] focus:outline-none" />
                                {getQuestionBlanks(curQ).length > 1 && (
                                  <button onClick={() => { const blanks = getQuestionBlanks(curQ).filter((_, i) => i !== idx); handleQuestionChange(activeQuestion, "metadata", { ...curQ.metadata, blanks }); }}
                                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-md"><Trash2 className="w-3.5 h-3.5" /></button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {curQ.type === "essay" && (
                          <div className="p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] rounded-xl space-y-2 text-[12px]">
                            <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                              <FileText className="w-4 h-4 text-indigo-500" />
                              <span>Insho / Ochiq yozma savol ko'rsatmalari</span>
                            </div>
                            <p className="text-slate-500 text-[11px] leading-relaxed">
                              O'quvchi imtihon davomida matn muharririga o'z javobini yozadi. Tizim so'zlar sonini avtomatik hisoblab boradi va brauzerda saqlaydi. Ushbu savol imtihon yakunlangach o'qituvchi tomonidan natijalar bo'limida baholanadi.
                            </p>
                          </div>
                        )}

                        {curQ.type === "matching" && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block">
                                Moslashtirish juftliklari (Chap topshiriq → O'ng variant)
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  const left = [...(curQ.metadata?.left || ["", ""]), ""];
                                  const right = [...(curQ.metadata?.right || ["", ""]), ""];
                                  handleQuestionChange(activeQuestion, "metadata", { ...curQ.metadata, left, right });
                                  const answerObj: Record<string, string> = {};
                                  right.forEach((_, idx) => {
                                    answerObj[String(idx + 1)] = String.fromCharCode(65 + idx);
                                  });
                                  handleQuestionChange(activeQuestion, "correct_answer", answerObj);
                                }}
                                className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" /> <span>Juftlik qo'shish</span>
                              </button>
                            </div>

                            <div className="space-y-2">
                              {(curQ.metadata?.left || ["", ""]).map((_: string, i: number) => {
                                const char = String.fromCharCode(65 + i);
                                return (
                                  <div key={i} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06]">
                                    <span className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-bold text-[11px] flex items-center justify-center shrink-0">
                                      {i + 1}
                                    </span>
                                    <input
                                      type="text"
                                      value={curQ.metadata?.left?.[i] || ""}
                                      onChange={(e) => {
                                        const left = [...(curQ.metadata?.left || ["", ""])];
                                        left[i] = e.target.value;
                                        handleQuestionChange(activeQuestion, "metadata", { ...curQ.metadata, left });
                                      }}
                                      placeholder={`${i + 1}-topshiriq matni...`}
                                      className="flex-1 h-8 px-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[12px] text-slate-900 dark:text-white focus:outline-none focus:border-[#E8192C]"
                                    />
                                    <span className="text-slate-400 font-bold text-xs">→</span>
                                    <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] flex items-center justify-center shrink-0">
                                      {char}
                                    </span>
                                    <input
                                      type="text"
                                      value={curQ.metadata?.right?.[i] || ""}
                                      onChange={(e) => {
                                        const right = [...(curQ.metadata?.right || ["", ""])];
                                        right[i] = e.target.value;
                                        handleQuestionChange(activeQuestion, "metadata", { ...curQ.metadata, right });
                                        const answerObj: Record<string, string> = {};
                                        right.forEach((_, idx) => {
                                          answerObj[String(idx + 1)] = String.fromCharCode(65 + idx);
                                        });
                                        handleQuestionChange(activeQuestion, "correct_answer", answerObj);
                                      }}
                                      placeholder={`${char} varianti matni...`}
                                      className="flex-1 h-8 px-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[12px] text-slate-900 dark:text-white focus:outline-none focus:border-[#E8192C]"
                                    />
                                    {(curQ.metadata?.left?.length || 2) > 2 && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const left = (curQ.metadata?.left || []).filter((_: any, idx: number) => idx !== i);
                                          const right = (curQ.metadata?.right || []).filter((_: any, idx: number) => idx !== i);
                                          handleQuestionChange(activeQuestion, "metadata", { ...curQ.metadata, left, right });
                                          const answerObj: Record<string, string> = {};
                                          right.forEach((_, idx) => {
                                            answerObj[String(idx + 1)] = String.fromCharCode(65 + idx);
                                          });
                                          handleQuestionChange(activeQuestion, "correct_answer", answerObj);
                                        }}
                                        className="p-1 text-slate-400 hover:text-red-600 rounded-md cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {curQ.type === "reading_passage" && (
                          <div className="space-y-4">
                            <div>
                              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center justify-between">
                                <span>Matn (Reading Passage) *</span>
                                <span className="text-[10px] text-slate-400">O'quvchilar ushbu matn asosida savollarga javob beradilar</span>
                              </label>
                              <textarea
                                rows={6}
                                value={curQ.metadata?.passage_text || curQ.question_text || ""}
                                onChange={(e) => {
                                  const text = e.target.value;
                                  handleQuestionChange(activeQuestion, "question_text", text);
                                  handleQuestionChange(activeQuestion, "metadata", { ...curQ.metadata, passage_text: text });
                                }}
                                placeholder="Asosiy matnni shu yerga kiriting..."
                                className="w-full px-3.5 py-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] text-[13px] leading-relaxed text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E8192C]/20 resize-y"
                              />
                            </div>

                            {/* Sub-questions list */}
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                  Ichki savollar ({curQ.sub_questions?.length || 0} ta)
                                </label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const subs = curQ.sub_questions || [];
                                    const newSub = {
                                      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
                                      question_number: Number(`${activeQuestion + 1}${subs.length + 1}`),
                                      question_text: "",
                                      type: "multiple_choice" as const,
                                      metadata: { options: ["", "", "", ""] },
                                      correct_answer: "A",
                                      points_a: 10
                                    };
                                    handleQuestionChange(activeQuestion, "sub_questions", [...subs, newSub]);
                                  }}
                                  className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" /> <span>Ichki savol qo'shish</span>
                                </button>
                              </div>

                              {(curQ.sub_questions || []).map((sq, sIdx) => (
                                <div key={sq.id || sIdx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                      {sIdx + 1}-ichki savol
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const subs = (curQ.sub_questions || []).filter((_, idx) => idx !== sIdx);
                                        handleQuestionChange(activeQuestion, "sub_questions", subs);
                                      }}
                                      className="p-1 text-slate-400 hover:text-red-600 rounded-md cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  <input
                                    type="text"
                                    value={sq.question_text || ""}
                                    onChange={(e) => {
                                      const subs = [...(curQ.sub_questions || [])];
                                      subs[sIdx] = { ...sq, question_text: e.target.value };
                                      handleQuestionChange(activeQuestion, "sub_questions", subs);
                                    }}
                                    placeholder="Ichki savol matni..."
                                    className="w-full h-8 px-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[12px] text-slate-900 dark:text-white focus:outline-none focus:border-[#E8192C]"
                                  />

                                  {/* Sub-question options */}
                                  <div className="grid grid-cols-2 gap-2">
                                    {["A", "B", "C", "D"].map((char, optIdx) => {
                                      const isSel = sq.correct_answer === char;
                                      return (
                                        <div key={char} className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-xs ${isSel ? "border-emerald-500/50 bg-emerald-500/5" : "border-slate-200 dark:border-slate-800"}`}>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const subs = [...(curQ.sub_questions || [])];
                                              subs[sIdx] = { ...sq, correct_answer: char };
                                              handleQuestionChange(activeQuestion, "sub_questions", subs);
                                            }}
                                            className={`w-6 h-6 rounded font-bold text-[10px] shrink-0 flex items-center justify-center ${isSel ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"}`}
                                          >
                                            {char}
                                          </button>
                                          <input
                                            type="text"
                                            value={sq.metadata?.options?.[optIdx] || ""}
                                            onChange={(e) => {
                                              const subs = [...(curQ.sub_questions || [])];
                                              const opts = [...(sq.metadata?.options || ["", "", "", ""])];
                                              opts[optIdx] = e.target.value;
                                              subs[sIdx] = { ...sq, metadata: { ...sq.metadata, options: opts } };
                                              handleQuestionChange(activeQuestion, "sub_questions", subs);
                                            }}
                                            placeholder={`${char} varianti...`}
                                            className="flex-1 bg-transparent text-[11px] outline-none"
                                          />
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Points & Difficulty */}
                        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Ball</label>
                            <input type="number" value={curQ.points_a || ""} onChange={(e) => handleQuestionChange(activeQuestion, "points_a", Number(e.target.value) || null)}
                              className="w-full h-8 px-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] text-[12px] focus:outline-none" />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Qiyinlik (1-5)</label>
                            <input type="number" min={1} max={5} value={curQ.difficulty || ""} onChange={(e) => handleQuestionChange(activeQuestion, "difficulty", Number(e.target.value) || undefined)}
                              className="w-full h-8 px-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] text-[12px] focus:outline-none" />
                          </div>
                          <div className="col-span-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Izoh</label>
                            <input type="text" value={curQ.explanation || ""} onChange={(e) => handleQuestionChange(activeQuestion, "explanation", e.target.value)}
                              placeholder="Izoh..." className="w-full h-8 px-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] text-[12px] focus:outline-none" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {!curQ && questions.length === 0 && (
                  <div className="lg:col-span-3 p-12 text-center border border-dashed border-slate-200 dark:border-white/[0.1] rounded-xl">
                    <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Hozircha savollar yo'q</p>
                    <p className="text-[11px] text-slate-400 mt-1">"Matnli yuklash" orqali ommaviy kiriting yoki "+" tugmasini bosing</p>
                    <button onClick={() => setActiveTab("bulk")} className="mt-3 px-4 py-2 bg-[#E8192C] text-white rounded-lg text-xs font-bold cursor-pointer">Matnli yuklash</button>
                  </div>
                )}
              </div>
            )}

            {/* TAB: BULK */}
            {activeTab === "bulk" && (
              <div className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl p-5 space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Bolt className="w-4 h-4 text-emerald-500" /> Ommaviy yuklash
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">[MC], [TF], [MS], [FB], [SA], [NU], [ES], [MA] teglaridan foydalaning.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setBulkText(DEFAULT_BULK)} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-colors">Namuna</button>
                    <button onClick={handleApplyBulk} className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-1.5">
                      <Bolt className="w-3.5 h-3.5" /> O'tkazish
                    </button>
                  </div>
                </div>
                <textarea value={bulkText} onChange={(e) => setBulkText(e.target.value)} rows={22}
                  className="w-full font-mono text-[12px] p-4 bg-slate-900 text-slate-100 rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 leading-relaxed shadow-inner" />
              </div>
            )}

            {/* TAB: CLASSES */}
            {activeTab === "classes" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Sinflarga biriktirish</h3>
                <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#0B0F1A] cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                  <input type="checkbox" checked={assignAllClasses} onChange={(e) => setAssignAllClasses(e.target.checked)} className="w-4 h-4 rounded text-[#E8192C] focus:ring-[#E8192C]" />
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Barcha sinflar uchun ochiq</div>
                    <div className="text-[11px] text-slate-400">Markazdagi barcha o'quvchilar ko'ra oladi</div>
                  </div>
                </label>
                {!assignAllClasses && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-72 overflow-y-auto">
                    {classes.map((cls) => {
                      const isChecked = selectedClassIds.includes(cls.id);
                      return (
                        <label key={cls.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${isChecked ? "border-[#E8192C] bg-red-50/30 dark:bg-red-950/10" : "border-slate-200 dark:border-white/[0.06] hover:bg-slate-50 dark:hover:bg-white/[0.02]"}`}>
                          <input type="checkbox" checked={isChecked} onChange={(e) => {
                            if (e.target.checked) setSelectedClassIds([...selectedClassIds, cls.id]);
                            else setSelectedClassIds(selectedClassIds.filter(id => id !== cls.id));
                          }} className="w-4 h-4 rounded text-[#E8192C] focus:ring-[#E8192C]" />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{cls.name}</div>
                            <div className="text-[10px] text-slate-400 truncate">{cls.subject} • {cls.class_code}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB: EXAM */}
            {activeTab === "exam" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Imtihon sozlamalari</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div onClick={() => setMode("exam")} className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${mode === "exam" ? "border-[#E8192C] bg-red-50/30" : "border-slate-200 dark:border-white/[0.06]"}`}>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Imtihon rejimi (Tavsiya)</div>
                    <p className="text-[11px] text-slate-500 mt-1">Aniq boshlanish va tugash vaqti.</p>
                  </div>
                  <div onClick={() => setMode("simple")} className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${mode === "simple" ? "border-[#E8192C] bg-red-50/30" : "border-slate-200 dark:border-white/[0.06]"}`}>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Oddiy rejim</div>
                    <p className="text-[11px] text-slate-500 mt-1">Istalgan vaqtda boshlay oladi.</p>
                  </div>
                </div>
                {mode === "exam" && (
                  <div className="grid grid-cols-2 gap-3 p-4 bg-white dark:bg-[#0B0F1A] border border-slate-200 dark:border-white/[0.06] rounded-lg">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Boshlanish *</label>
                      <input type="datetime-local" value={examStartAt} onChange={(e) => setExamStartAt(e.target.value)} className="w-full h-9 px-3 bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-lg text-[11px] outline-none" required />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Tugash *</label>
                      <input type="datetime-local" value={examEndAt} onChange={(e) => setExamEndAt(e.target.value)} className="w-full h-9 px-3 bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-lg text-[11px] outline-none" required />
                    </div>
                    <div className="col-span-2 flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={autoSubmitAtEnd} onChange={(e) => setAutoSubmitAtEnd(e.target.checked)} className="w-4 h-4 rounded" />
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">Tugashida avtomatik yakunlash</span>
                      </div>
                      <span className="text-[9px] text-slate-400 font-medium">Toshkent (UTC+5)</span>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Davomiyligi (daqiqa)</label>
                    <input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))} className="w-full h-9 px-3 bg-white dark:bg-[#0B0F1A] border border-slate-200 dark:border-white/[0.06] rounded-lg text-[12px] focus:outline-none focus:border-[#E8192C]" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Urinishlar soni</label>
                    <select value={attemptLimit} onChange={(e) => setAttemptLimit(Number(e.target.value))} className="w-full h-9 px-3 bg-white dark:bg-[#0B0F1A] border border-slate-200 dark:border-white/[0.06] rounded-lg text-[12px] focus:outline-none">
                      <option value={1}>1</option><option value={2}>2</option><option value={3}>3</option><option value={0}>Cheksiz</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: RESULTS */}
            {activeTab === "results" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Natija chiqarish tartibi</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div onClick={() => setResultReleasePolicy("after_window")} className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${resultReleasePolicy === "after_window" ? "border-[#E8192C] bg-red-50/30" : "border-slate-200 dark:border-white/[0.06]"}`}>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Imtihon oynasi tugagach</div>
                    <p className="text-[11px] text-slate-500 mt-1">Natija sir saqlanadi va so'ng e'lon qilinadi.</p>
                  </div>
                  <div onClick={() => setResultReleasePolicy("immediate")} className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${resultReleasePolicy === "immediate" ? "border-[#E8192C] bg-red-50/30" : "border-slate-200 dark:border-white/[0.06]"}`}>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Darhol</div>
                    <p className="text-[11px] text-slate-500 mt-1">Topshirishi bilanoq ball ko'radi.</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Yakuniy natija siyosati</label>
                  <select value={resultPolicy} onChange={(e) => setResultPolicy(e.target.value as any)} className="w-full h-9 px-3 bg-white dark:bg-[#0B0F1A] border border-slate-200 dark:border-white/[0.06] rounded-lg text-[12px] focus:outline-none">
                    <option value="best">Eng yaxshi natija</option><option value="latest">Oxirgi urinish</option><option value="first">Birinchi urinish</option><option value="average">O'rtacha ball</option>
                  </select>
                </div>
              </div>
            )}

            {/* TAB: PREVIEW */}
            {activeTab === "preview" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between p-4 bg-slate-900 text-white rounded-xl">
                  <h3 className="text-sm font-bold flex items-center gap-2"><Eye className="w-4 h-4 text-indigo-400" /> Ko'rinish ({questions.length} ta savol)</h3>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 font-semibold border border-red-500/30 uppercase">PREVIEW</span>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-3 bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-lg">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Nom</div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">{title || "—"}</div>
                  </div>
                  <div className="p-3 bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-lg">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Manba</div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">{sourceType === "library" ? selectedMock?.title || "Tanlanmagan" : `${questions.length} ta savol`}</div>
                  </div>
                  <div className="p-3 bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-lg">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Rejim</div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">{mode === "exam" ? "Imtihon" : "Oddiy"} • {durationMinutes} daq</div>
                  </div>
                  <div className="p-3 bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-lg">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Natija</div>
                    <div className="text-xs font-bold text-[#E8192C] mt-0.5">{resultReleasePolicy === "immediate" ? "Darhol" : "Oynadan keyin"}</div>
                  </div>
                </div>

                {sourceType === "custom" && questions.map((q, idx) => (
                  <div key={idx} className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[11px] font-bold rounded-md">Savol {idx + 1}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-slate-500 font-semibold">{q.type}</span>
                        {q.points_a && <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-500/10 text-amber-600 font-bold">{q.points_a} ball</span>}
                      </div>
                    </div>
                    <div className="text-[15px] font-medium text-slate-900 dark:text-white leading-relaxed prose dark:prose-invert max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{normalizeMath(q.question_text || "Savol matni kiritilmagan")}</ReactMarkdown>
                    </div>
                    {q.question_subtext && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[13px] prose dark:prose-invert max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{normalizeMath(q.question_subtext)}</ReactMarkdown>
                      </div>
                    )}
                    {(q.question_image || q.image_url) && (
                      <div className="max-w-md my-3 overflow-hidden rounded-xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-slate-900 p-2"><img src={q.question_image || q.image_url} className="max-h-[280px] w-auto mx-auto object-contain rounded-lg" alt="Rasm" /></div>
                    )}
                    {q.metadata?.options && Array.isArray(q.metadata.options) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
                        {q.metadata.options.map((opt: string, optIdx: number) => {
                          const char = String.fromCharCode(65 + optIdx);
                          const isCorrect = q.correct_answer === char || (Array.isArray(q.correct_answer) && q.correct_answer.includes(char));
                          return (
                            <div key={char} className={`p-2.5 rounded-lg border text-[12px] flex items-center gap-2 font-medium ${isCorrect ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-bold" : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/[0.06] text-slate-700 dark:text-slate-300"}`}>
                              <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0 ${isCorrect ? "bg-emerald-600 text-white" : "bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400"}`}>{char}</span>
                              <span className="flex-1"><ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{normalizeMath(opt)}</ReactMarkdown></span>
                              {isCorrect && <span className="ml-auto text-[10px] text-emerald-600 font-bold uppercase shrink-0">To'g'ri</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {q.explanation && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-lg text-[11px] text-blue-700 dark:text-blue-300">
                        💡 <strong>Izoh:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                ))}

                {sourceType === "library" && selectedMock && (
                  <div className="p-5 bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl space-y-2">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Biriktirilgan EduContest Test</div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{selectedMock.title}</h4>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>Fan: <b>{selectedMock.subject}</b></span>
                      <span>Savollar: <b>{selectedMock.questions_count || 43} ta</b></span>
                      <span>vaqt: <b>{selectedMock.duration_minutes || 120} daq</b></span>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
};

export default CenterMockWizard;
