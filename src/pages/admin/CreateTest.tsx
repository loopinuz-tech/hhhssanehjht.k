import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AltArrowLeftIcon } from "@solar-icons/react/bold-duotone/alt-arrow-left";
import { AddCircleIcon as PlusCircleIcon } from "@solar-icons/react/bold-duotone/add-circle";
import { TrashBinMinimalisticIcon } from "@solar-icons/react/bold-duotone/trash-bin-minimalistic";
import { AltArrowUpIcon } from "@solar-icons/react/bold-duotone/alt-arrow-up";
import { AltArrowDownIcon } from "@solar-icons/react/bold-duotone/alt-arrow-down";
import { DisketteIcon } from "@solar-icons/react/bold-duotone/diskette";
import { RefreshIcon } from "@solar-icons/react/bold-duotone/refresh";
import { FileTextIcon } from "@solar-icons/react/bold-duotone/file-text";
import { InfoCircleIcon } from "@solar-icons/react/bold-duotone/info-circle";
import { UploadMinimalisticIcon } from "@solar-icons/react/bold-duotone/upload-minimalistic";
import { CloseSquareIcon } from "@solar-icons/react/bold-duotone/close-square";
import { GripVertical, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import TeX from '@matejmazur/react-katex';
import 'katex/dist/katex.min.css';

interface QuestionData {
  id?: string;
  folder_id?: string;
  question_text: string;
  image_url: string;
  options: string[];
  correct_option: number;
  order_number: number;
  level: string;
  created_at?: string;
  updated_at?: string;
}

interface FolderData {
  id?: string;
  name: string;
  description: string;
  category: string;
  subject: string;
  price: number;
  duration_minutes: number;
  questions_count: number;
  is_active: boolean;
  educoin_price: number;
  payment_type: string;
  meta_title: string;
  meta_description: string;
}

const defaultFolder: FolderData = {
  name: "",
  description: "",
  category: "mavzulashtirilgan",
  subject: "",
  price: 2000,
  duration_minutes: 60,
  questions_count: 30,
  is_active: true,
  educoin_price: 0,
  payment_type: "free",
  meta_title: "",
  meta_description: "",
};

const defaultQuestion: QuestionData = {
  question_text: "",
  image_url: "",
  options: ["", ""],
  correct_option: 0,
  order_number: 1,
  level: "bilish",
};

const inputCls =
  "w-full h-10 px-4 bg-white dark:bg-[#0A0F1A] border border-slate-200 dark:border-white/[0.06] rounded-xl text-[13px] font-medium transition-all outline-none focus:border-emerald-500 shadow-sm";
const labelCls =
  "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1";

const renderLatex = (text: string) => {
  if (!text) return null;
  const normalized = text
    .replace(/\\\(/g, "$")
    .replace(/\\\)/g, "$")
    .replace(/\\\[/g, "$$")
    .replace(/\\\]/g, "$$");

  const parts = normalized.split(/(\$\$[\s\S]*?\$\$|\$[^$\n]+?\$)/g);
  return parts.map((part, i) => {
    if (part.startsWith('$$') && part.endsWith('$$')) {
      return <TeX key={i} math={part.slice(2, -2)} block />;
    }
    if (part.startsWith('$') && part.endsWith('$')) {
      return <TeX key={i} math={part.slice(1, -1)} />;
    }
    return <span key={i} className="whitespace-pre-wrap">{part}</span>;
  });
};

const parseBulkTextQuestions = (text: string): QuestionData[] => {
  const normalizedText = text.replace(/\r\n/g, "\n");
  const rawBlocks = normalizedText
    .split(/(?:^|\n)+(?=---|\[[A-Z]{2}\]|\s*\d+[\.\)]\s+)/gi)
    .map((b) => b.trim())
    .filter((b) => b && b !== "---");

  const parsed: QuestionData[] = [];

  for (const block of rawBlocks) {
    const rawLines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    if (rawLines.length === 0) continue;

    let tag = "MC";
    let firstLineIdx = 0;

    const tagMatch = rawLines[0].match(/^\[([A-Z]{2})\]/i);
    if (tagMatch) {
      tag = tagMatch[1].toUpperCase();
      firstLineIdx = 1;
    }

    let questionText = "";
    const options: string[] = [];
    let correctIndex = 0;
    let explanation = "";
    let difficulty = "bilish";

    for (let i = firstLineIdx; i < rawLines.length; i++) {
      const line = rawLines[i];

      if (line.startsWith("@exp:")) {
        explanation = line.replace(/^@exp:\s*/i, "");
        continue;
      }
      if (line.startsWith("@diff:")) {
        const diffVal = line.replace(/^@diff:\s*/i, "").trim();
        if (diffVal === "2") difficulty = "qollash";
        else if (diffVal === "3") difficulty = "mulohaza";
        else difficulty = "bilish";
        continue;
      }
      if (line.startsWith("@code:")) {
        questionText += "\n```\n" + line.replace(/^@code:\s*/i, "") + "\n```";
        continue;
      }
      if (line.startsWith("@lang:") || line.startsWith("@points:")) {
        continue;
      }

      const optMatch = line.match(/^(\*?\s*[A-H|a-h]\s*\*?[\)\.:]\s*\*?)\s*(.*)/);
      const ansMatch = line.match(/^(?:JAVOB|Javob|ANSWER|Answer|Correct|TO'G'RI|To'g'ri)\s*[:=]\s*([A-H|a-h]|1|2|3|4)/i);

      if (tag === "TF" || tag === "YN") {
        if (!questionText) {
          questionText = line.replace(/^\d+[\.\)]\s*/, "");
        } else if (line.match(/^(To'g'ri|True|Ha|Yes)/i)) {
          correctIndex = 0;
        } else if (line.match(/^(Yolg'on|False|Yo'q|No)/i)) {
          correctIndex = 1;
        }
      } else if (tag === "SA" || tag === "NU" || tag === "ES" || tag === "FB" || tag === "MA" || tag === "OR") {
        if (!questionText) {
          questionText = line.replace(/^\d+[\.\)]\s*/, "");
        } else {
          options.push(line);
        }
      } else {
        if (ansMatch) {
          const val = ansMatch[1].toUpperCase();
          if (val === "A" || val === "1") correctIndex = 0;
          else if (val === "B" || val === "2") correctIndex = 1;
          else if (val === "C" || val === "3") correctIndex = 2;
          else if (val === "D" || val === "4") correctIndex = 3;
        } else if (optMatch && (questionText !== "" || options.length > 0)) {
          const prefix = optMatch[1];
          let optText = optMatch[2].trim();
          let isCorrect = false;

          if (prefix.includes("*") || prefix.includes("+")) {
            isCorrect = true;
          }

          if (/^\*(?!\*)\s*/.test(optText)) {
            isCorrect = true;
            optText = optText.replace(/^\*(?!\*)\s*/, "");
          } else if (/^\+\s*/.test(optText)) {
            isCorrect = true;
            optText = optText.replace(/^\+\s*/, "");
          }

          if (/\s*(?<!\*)\*$/.test(optText)) {
            isCorrect = true;
            optText = optText.replace(/\s*(?<!\*)\*$/, "");
          } else if (/\s*\+$/.test(optText)) {
            isCorrect = true;
            optText = optText.replace(/\s*\+$/, "");
          }

          if (/^\*([^\*]+)\*$/.test(optText)) {
            isCorrect = true;
            optText = optText.replace(/^\*([^\*]+)\*$/, "$1");
          }

          if (isCorrect) {
            correctIndex = options.length;
          }
          options.push(optText.trim());
        } else {
          if (options.length === 0) {
            if (questionText === "") {
              questionText = line.replace(/^\d+[\.\)]\s*/, "");
            } else {
              questionText += "\n" + line;
            }
          }
        }
      }
    }

    if (tag === "TF") {
      if (options.length === 0) options.push("To'g'ri", "Yolg'on");
    } else if (tag === "YN") {
      if (options.length === 0) options.push("Ha", "Yo'q");
    }

    if (explanation) {
      questionText += `\n\n*Izoh:* ${explanation}`;
    }

    if (questionText.trim()) {
      parsed.push({
        question_text: questionText.trim(),
        image_url: "",
        options: options.length >= 2 ? options : (options.length > 0 ? [...options, ""] : ["", "", "", ""]),
        correct_option: correctIndex,
        order_number: parsed.length + 1,
        level: difficulty,
      });
    }
  }

  return parsed;
};

const CreateTest = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const isEditing = Boolean(id);

  const [activeTab, setActiveTab] = useState<"info" | "questions">("info");
  const [folder, setFolder] = useState<FolderData>({ ...defaultFolder });
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showTextImportModal, setShowTextImportModal] = useState(false);
  const [bulkImportText, setBulkImportText] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const compressImageFile = (rawFile: File, maxDim = 1200, quality = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      if (!rawFile || !rawFile.type.startsWith("image/")) return resolve(rawFile);
      if (rawFile.size < 150 * 1024) return resolve(rawFile);

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve(rawFile);

          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (!blob) return resolve(rawFile);
              const compressed = new File(
                [blob],
                (rawFile.name || "compressed").replace(/\.[^/.]+$/, "") + ".jpg",
                { type: "image/jpeg", lastModified: Date.now() }
              );
              resolve(compressed);
            },
            "image/jpeg",
            quality
          );
        };
        img.onerror = () => resolve(rawFile);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve(rawFile);
      reader.readAsDataURL(rawFile);
    });
  };

  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (rawFile: File) => {
    if (!rawFile || editingQuestionIndex === null) return;
    if (!rawFile.type.startsWith("image/")) {
      toast({ title: "Xatolik", description: "Faqat rasm fayllarini yuklashingiz mumkin.", variant: "destructive" });
      return;
    }
    setIsUploadingImage(true);

    // Instant local preview for 0ms delay
    const localPreviewUrl = URL.createObjectURL(rawFile);
    updateQuestion(editingQuestionIndex, { image_url: localPreviewUrl });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Yuklash vaqti cheklovi (Timeout)")), 8000)
    );

    try {
      const file = await compressImageFile(rawFile);
      let finalUrl = "";

      // 1. Backend Proxy
      try {
        const formData = new FormData();
        formData.append("file", file);

        const uploadFetch = fetch("/api/storage/upload/questions", {
          method: "POST",
          body: formData,
          credentials: "include",
        }).then(async (res) => {
          if (!res.ok) throw new Error(`HTTP error ${res.status}`);
          return res.json();
        });

        const resData = await Promise.race([uploadFetch, timeoutPromise]);
        if (resData && resData.url) {
          finalUrl = resData.url;
        }
      } catch (proxyErr) {
        console.warn("Backend proxy upload failed/skipped:", proxyErr);
      }

      // 2. Direct Supabase Storage
      if (!finalUrl) {
        try {
          const ext = file.name.split('.').pop() || 'png';
          const fileName = `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
          const sbUpload = supabase.storage.from("questions").upload(fileName, file, {
            cacheControl: "3600",
            upsert: true,
          });

          const { data, error } = await Promise.race([sbUpload, timeoutPromise]);
          if (!error && data) {
            const { data: pubData } = supabase.storage.from("questions").getPublicUrl(fileName);
            finalUrl = pubData.publicUrl;
          }
        } catch (sbErr) {
          console.warn("Direct Supabase storage upload failed/skipped:", sbErr);
        }
      }

      // 3. Base64 Data URL Fallback
      if (!finalUrl) {
        finalUrl = await readFileAsDataUrl(file);
      }

      updateQuestion(editingQuestionIndex, { image_url: finalUrl });
      toast({ title: "Rasm yuklandi", description: "Rasm muvaffaqiyatli saqlandi." });
    } catch (err: any) {
      toast({ title: "Xatolik", description: err.message || "Rasm yuklashda xatolik yuz berdi.", variant: "destructive" });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handlePasteImage = (e: React.ClipboardEvent) => {
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      const file = e.clipboardData.files[0];
      if (file.type.startsWith("image/")) {
        e.preventDefault();
        handleFileUpload(file);
      }
    }
  };

  const handleBulkImport = () => {
    if (!bulkImportText.trim()) {
      toast({ title: "Xatolik", description: "Matn kiritilmadi.", variant: "destructive" });
      return;
    }
    const parsed = parseBulkTextQuestions(bulkImportText);
    if (parsed.length === 0) {
      toast({ title: "Xatolik", description: "Matndan savollar topilmadi. Qolipni tekshiring.", variant: "destructive" });
      return;
    }
    setQuestions((prev) => {
      const updated = [...prev, ...parsed].map((q, idx) => ({
        ...q,
        order_number: idx + 1,
      }));
      return updated;
    });
    setShowTextImportModal(false);
    setBulkImportText("");
    toast({ title: "Muvaffaqiyatli", description: `${parsed.length} ta savol qo'shildi.` });
  };

  const { data: subjects } = useQuery({
    queryKey: ["admin-subjects"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("subjects")
        .select("*");
      if (error) throw error;
      return data;
    },
  });

  const allSubjectOptions = useMemo<string[]>(() => {
    const list: string[] = subjects?.map((s: any) => String(s.name || "")) || [];
    if (folder.subject && !list.includes(folder.subject)) {
      list.unshift(folder.subject);
    }
    return Array.from(new Set(list)).sort();
  }, [subjects, folder.subject]);

  const { data: existingFolder, isLoading: folderLoading } = useQuery({
    queryKey: ["admin-test-folder", id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("test_folders")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: isEditing,
  });

  const { data: existingQuestions } = useQuery({
    queryKey: ["admin-test-questions", id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("questions")
        .select("*")
        .eq("folder_id", id)
        .order("order_number", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (existingFolder) {
      setFolder({
        name: existingFolder.name || "",
        description: existingFolder.description || "",
        category: existingFolder.category || "mavzulashtirilgan",
        subject: existingFolder.subject || "",
        price: existingFolder.price ?? 2000,
        duration_minutes: existingFolder.duration_minutes ?? 60,
        questions_count: existingFolder.questions_count ?? 30,
        is_active: existingFolder.is_active ?? true,
        educoin_price: existingFolder.educoin_price ?? 0,
        payment_type: existingFolder.payment_type || "free",
        meta_title: existingFolder.meta_title || "",
        meta_description: existingFolder.meta_description || "",
      });
    }
  }, [existingFolder]);

  useEffect(() => {
    if (existingQuestions) {
      setQuestions(
        existingQuestions.map((q: any, i: number) => ({
          id: q.id,
          folder_id: q.folder_id,
          question_text: q.question_text || "",
          image_url: q.image_url || "",
          options: Array.isArray(q.options) ? q.options : JSON.parse(q.options || '["",""]'),
          correct_option: q.correct_option ?? 0,
          order_number: q.order_number ?? i + 1,
          level: q.level || "bilish",
          created_at: q.created_at,
          updated_at: q.updated_at,
        }))
      );
    }
  }, [existingQuestions]);

  const saveFolderMutation = useMutation({
    mutationFn: async (data: FolderData) => {
      const payload: Record<string, any> = {
        name: data.name,
        description: data.description,
        category: data.category,
        subject: data.subject,
        price: data.price,
        duration_minutes: data.duration_minutes,
        questions_count: questions.length,
        is_active: data.is_active,
        educoin_price: data.educoin_price,
        payment_type: data.payment_type,
        meta_title: data.meta_title,
        meta_description: data.meta_description,
      };

      const doSave = async (p: Record<string, any>) => {
        if (isEditing) {
          return await (supabase as any)
            .from("test_folders")
            .update(p)
            .eq("id", id)
            .select()
            .single();
        } else {
          return await (supabase as any)
            .from("test_folders")
            .insert(p)
            .select()
            .single();
        }
      };

      let { data: result, error } = await doSave(payload);

      if (error && (error.message?.includes("meta_description") || error.message?.includes("meta_title") || error.code === "PGRST204")) {
        delete payload.meta_title;
        delete payload.meta_description;
        const retry = await doSave(payload);
        result = retry.data;
        error = retry.error;
      }

      if (error) throw error;
      return result;
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["admin-test-folders"] });
      if (!isEditing && result?.id) {
        (window as any).__createdFolderId = result.id;
      }
    },
    onError: (err: any) => {
      toast({ title: "Xatolik", description: err.message || "Testni saqlashda xatolik yuz berdi.", variant: "destructive" });
    },
  });

  const saveQuestionsMutation = useMutation({
    mutationFn: async (data: { folderId: string; questions: QuestionData[] }) => {
      const existingIds = data.questions.filter((q) => q.id).map((q) => q.id);
      const { data: allExisting, error: fetchErr } = await (supabase as any)
        .from("questions")
        .select("id")
        .eq("folder_id", data.folderId);

      if (fetchErr) throw fetchErr;

      const allExistingIds = (allExisting || []).map((e: any) => e.id);
      const toDelete = allExistingIds.filter(
        (eid: string) => !existingIds?.includes(eid)
      );
      if (toDelete.length > 0) {
        const { error: delErr } = await (supabase as any).from("questions").delete().in("id", toDelete);
        if (delErr) throw delErr;
      }
      for (const [i, q] of data.questions.entries()) {
        const payload = {
          folder_id: data.folderId,
          question_text: q.question_text,
          image_url: q.image_url,
          options: q.options,
          correct_option: q.correct_option,
          order_number: i + 1,
          level: q.level,
        };
        if (q.id) {
          const { error: updErr } = await (supabase as any).from("questions").update(payload).eq("id", q.id);
          if (updErr) throw updErr;
        } else {
          const { error: insErr } = await (supabase as any).from("questions").insert(payload);
          if (insErr) throw insErr;
        }
      }

      await (supabase as any)
        .from("test_folders")
        .update({ questions_count: data.questions.length })
        .eq("id", data.folderId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-test-questions"] });
      qc.invalidateQueries({ queryKey: ["admin-test-folders"] });
    },
    onError: (err: any) => {
      toast({ title: "Xatolik", description: err.message || "Savollarni saqlashda xatolik yuz berdi.", variant: "destructive" });
    },
  });

  const handleSaveFolder = async () => {
    return handleSaveAll();
  };

  const handleSaveAll = async () => {
    if (!folder.name.trim()) {
      toast({ title: "Xatolik", description: "Test nomini kiriting.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      let folderId = id || (window as any).__createdFolderId;
      const result = await saveFolderMutation.mutateAsync(folder);
      if (result?.id) {
        folderId = result.id;
      }
      if (folderId) {
        await saveQuestionsMutation.mutateAsync({ folderId, questions });
      }
      toast({ title: "Muvaffaqiyatli", description: `Test va ${questions.length} ta savol saqlandi.` });
      if (!isEditing && folderId) {
        navigate(`/admin/tests/edit/${folderId}`, { replace: true });
      }
    } catch (err: any) {
      console.error("Save all error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const addQuestion = () => {
    const newQ: QuestionData = {
      ...defaultQuestion,
      order_number: questions.length + 1,
    };
    setQuestions((prev) => [...prev, newQ]);
    setEditingQuestionIndex(questions.length);
    setActiveTab("questions");
  };

  const updateQuestion = (index: number, data: Partial<QuestionData>) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, ...data } : q))
    );
  };

  const deleteQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
    if (editingQuestionIndex === index) {
      setEditingQuestionIndex(null);
    } else if (editingQuestionIndex !== null && editingQuestionIndex > index) {
      setEditingQuestionIndex(editingQuestionIndex - 1);
    }
  };

  const moveQuestion = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= questions.length) return;
    setQuestions((prev) => {
      const next = [...prev];
      [next[index], next[newIndex]] = [next[newIndex], next[index]];
      return next.map((q, i) => ({ ...q, order_number: i + 1 }));
    });
    if (editingQuestionIndex === index) {
      setEditingQuestionIndex(newIndex);
    } else if (editingQuestionIndex === newIndex) {
      setEditingQuestionIndex(index);
    }
  };

  const addOption = (qIndex: number) => {
    updateQuestion(qIndex, {
      options: [...questions[qIndex].options, ""],
    });
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    const q = questions[qIndex];
    if (q.options.length <= 2) return;
    const newOptions = q.options.filter((_, i) => i !== oIndex);
    const newCorrect =
      q.correct_option >= newOptions.length ? 0 : q.correct_option;
    updateQuestion(qIndex, { options: newOptions, correct_option: newCorrect });
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const newOptions = [...questions[qIndex].options];
    newOptions[oIndex] = value;
    updateQuestion(qIndex, { options: newOptions });
  };

  const canSwitchToQuestions = isEditing || Boolean((window as any).__createdFolderId);
  const canSaveQuestions = canSwitchToQuestions && questions.length > 0;

  if (folderLoading && isEditing) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#080C14] flex items-center justify-center">
        <RefreshIcon className="w-6 h-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-12">
      <div className="bg-white dark:bg-[#0A0F1A] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-4 lg:p-5 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin/tests")}
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/[0.04] flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-emerald-600 transition-colors shrink-0"
          >
            <AltArrowLeftIcon className="w-4.5 h-4.5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              {isEditing ? "Testni tahrirlash" : "Yangi test"}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Test ma'lumotlarini va savollarni boshqarish
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {canSaveQuestions && (
            <Button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="h-9.5 px-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest flex items-center gap-2 shadow-xs"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Saqlash hammasi
            </Button>
          )}
        </div>
      </div>

      <div className="w-full">
        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-white/[0.04] rounded-xl w-fit mb-6">
          <button
            onClick={() => setActiveTab("info")}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all ${
              activeTab === "info"
                ? "bg-white dark:bg-white/[0.08] shadow-sm text-emerald-600 dark:text-emerald-400"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <FileTextIcon className="w-3.5 h-3.5" />
            Ma'lumotlar
          </button>
          <button
            onClick={() => {
              if (canSwitchToQuestions) {
                setActiveTab("questions");
              } else {
                toast({
                  title: "Avval saqlang",
                  description: "Savollarni qo'shish uchun testni avval saqlang.",
                  variant: "destructive",
                });
              }
            }}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all ${
              activeTab === "questions" && canSwitchToQuestions
                ? "bg-white dark:bg-white/[0.08] shadow-sm text-emerald-600 dark:text-emerald-400"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <InfoCircleIcon className="w-3.5 h-3.5" />
            Savollar ({questions.length})
          </button>
        </div>

        {activeTab === "info" && (
          <div className="bg-white dark:bg-[#0A0F1A] border border-slate-200 dark:border-white/[0.06] rounded-xl p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-white/[0.06] pb-2">
                  Asosiy ma'lumotlar
                </h3>
                <div>
                  <label className={labelCls}>Test nomi *</label>
                  <input
                    className={inputCls}
                    placeholder="Test nomini kiriting..."
                    value={folder.name}
                    onChange={(e) =>
                      setFolder({ ...folder, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className={labelCls}>Tavsif</label>
                  <textarea
                    rows={3}
                    className={`${inputCls} h-auto py-3 resize-none`}
                    placeholder="Test haqida qisqacha..."
                    value={folder.description}
                    onChange={(e) =>
                      setFolder({ ...folder, description: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className={labelCls}>Kategoriya</label>
                  <select
                    className={inputCls}
                    value={folder.category}
                    onChange={(e) =>
                      setFolder({ ...folder, category: e.target.value })
                    }
                  >
                    <option value="mavzulashtirilgan">Mavzulashtirilgan</option>
                    <option value="mock-tests">Mock testlar</option>
                    <option value="attestatsiya">Attestatsiya</option>
                    <option value="pedagogik">Pedagogik</option>
                    <option value="user-tests">O'qituvchi testlari</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Fan</label>
                  <select
                    className={inputCls}
                    value={folder.subject}
                    onChange={(e) =>
                      setFolder({ ...folder, subject: e.target.value })
                    }
                  >
                    <option value="">Fanni tanlang...</option>
                    {allSubjectOptions.map((subjName: string) => (
                      <option key={subjName} value={subjName}>
                        {subjName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-white/[0.06] pb-2">
                  Sozlamalar
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Narx (UZS)</label>
                    <input
                      type="number"
                      className={inputCls}
                      value={folder.price}
                      onChange={(e) =>
                        setFolder({
                          ...folder,
                          price: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Educoin narxi</label>
                    <input
                      type="number"
                      className={inputCls}
                      value={folder.educoin_price}
                      onChange={(e) =>
                        setFolder({
                          ...folder,
                          educoin_price: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Vaqt (daqiqa)</label>
                    <input
                      type="number"
                      className={inputCls}
                      value={folder.duration_minutes}
                      onChange={(e) =>
                        setFolder({
                          ...folder,
                          duration_minutes: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Savollar soni</label>
                    <input
                      type="number"
                      className={inputCls}
                      value={folder.questions_count}
                      onChange={(e) =>
                        setFolder({
                          ...folder,
                          questions_count: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>To'lov turi</label>
                  <select
                    className={inputCls}
                    value={folder.payment_type}
                    onChange={(e) =>
                      setFolder({ ...folder, payment_type: e.target.value })
                    }
                  >
                    <option value="free">Bepul</option>
                    <option value="uzs">UZS</option>
                    <option value="educoin">Educoin</option>
                    <option value="both">Ikkalasi</option>
                  </select>
                </div>
                <div className="flex items-center justify-between py-2">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">
                    Faol
                  </label>
                  <button
                    onClick={() =>
                      setFolder({ ...folder, is_active: !folder.is_active })
                    }
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      folder.is_active ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        folder.is_active ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-white/[0.06] pt-6 space-y-4">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                SEO
              </h3>
              <div>
                <label className={labelCls}>Meta sarlavha</label>
                <input
                  className={inputCls}
                  placeholder="SEO uchun sarlavha..."
                  value={folder.meta_title}
                  onChange={(e) =>
                    setFolder({ ...folder, meta_title: e.target.value })
                  }
                />
              </div>
              <div>
                <label className={labelCls}>Meta tavsif</label>
                <textarea
                  rows={2}
                  className={`${inputCls} h-auto py-3 resize-none`}
                  placeholder="SEO uchun tavsif..."
                  value={folder.meta_description}
                  onChange={(e) =>
                    setFolder({ ...folder, meta_description: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={handleSaveFolder}
                disabled={isSaving}
                className="h-10 px-6 bg-slate-900 dark:bg-white/[0.08] hover:bg-emerald-600 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest flex items-center gap-2"
              >
                {isSaving ? (
                  <RefreshIcon className="w-4 h-4 animate-spin" />
                ) : (
                  <DisketteIcon className="w-4 h-4" />
                )}
                Saqlash
              </Button>
            </div>
          </div>
        )}

        {activeTab === "questions" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Savollar ({questions.length})
              </h2>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setShowTextImportModal(true)}
                  className="h-9 px-4 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest flex items-center gap-2 shadow-xs"
                >
                  <UploadMinimalisticIcon className="w-4 h-4" />
                  Matnli Import
                </Button>
                <Button
                  onClick={addQuestion}
                  className="h-9 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest flex items-center gap-2 shadow-xs"
                >
                  <PlusCircleIcon className="w-4 h-4" />
                  Savol qo'shish
                </Button>
              </div>
            </div>

            {editingQuestionIndex !== null && editingQuestionIndex < questions.length && (
              <div className="bg-white dark:bg-[#0A0F1A] border border-slate-200 dark:border-white/[0.06] rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-3">
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    Savol #{editingQuestionIndex + 1} tahrirlash
                  </h3>
                  <button
                    onClick={() => setEditingQuestionIndex(null)}
                    className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600"
                  >
                    Yopish
                  </button>
                </div>

                <div>
                  <label className={labelCls}>Savol matni *</label>
                  <textarea
                    rows={3}
                    className={`${inputCls} h-auto py-3 resize-none`}
                    placeholder="Savol matnini kiriting..."
                    value={questions[editingQuestionIndex].question_text}
                    onChange={(e) =>
                      updateQuestion(editingQuestionIndex, {
                        question_text: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className={labelCls}>Savol Rasmi (Fayldan yuklash, Ctrl+V yoki URL)</label>
                    {isUploadingImage && (
                      <span className="text-[11px] font-bold text-violet-500 flex items-center gap-1">
                        <RefreshIcon className="w-3.5 h-3.5 animate-spin" /> Rasm yuklanmoqda...
                      </span>
                    )}
                  </div>

                  <div
                    onPaste={handlePasteImage}
                    className="p-4 bg-slate-50 dark:bg-white/[0.02] border-2 border-dashed border-slate-200 dark:border-white/[0.08] rounded-xl space-y-3 transition-colors hover:border-violet-400"
                  >
                    {questions[editingQuestionIndex].image_url ? (
                      <div className="relative group w-fit">
                        <img
                          src={questions[editingQuestionIndex].image_url}
                          alt="Savol rasmi"
                          className="max-h-56 max-w-full rounded-lg border border-slate-200 dark:border-white/10 shadow-sm object-contain bg-white dark:bg-black/20"
                        />
                        <button
                          type="button"
                          onClick={() => updateQuestion(editingQuestionIndex, { image_url: "" })}
                          className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-transform group-hover:scale-105"
                          title="Rasmni o'chirish"
                        >
                          <TrashBinMinimalisticIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                          <UploadMinimalisticIcon className="w-6 h-6 text-violet-500 shrink-0" />
                          <div className="text-[11.5px]">
                            <p className="font-bold text-slate-700 dark:text-slate-200">
                              Rasmni fayldan tanlang yoki ushbu oynaga Ctrl+V bosing
                            </p>
                            <p className="text-[10.5px] text-slate-400">PNG, JPG, WEBP rasmlari Supabase saqlagichiga avtomatik yuklanadi</p>
                          </div>
                        </div>

                        <label className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-bold rounded-xl shadow-xs cursor-pointer shrink-0 transition-colors">
                          Fayldan tanlash
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleFileUpload(e.target.files[0]);
                              }
                            }}
                          />
                        </label>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-200/60 dark:border-white/[0.04] flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">URL:</span>
                      <input
                        className="w-full h-8 px-3 bg-white dark:bg-[#0A0F1A] border border-slate-200 dark:border-white/[0.06] rounded-lg text-[12px] text-slate-800 dark:text-slate-200 outline-none focus:border-violet-500"
                        placeholder="Yoki rasm havolasini kiriting (https://...)"
                        value={questions[editingQuestionIndex].image_url}
                        onChange={(e) =>
                          updateQuestion(editingQuestionIndex, {
                            image_url: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Daraja</label>
                    <select
                      className={inputCls}
                      value={questions[editingQuestionIndex].level}
                      onChange={(e) =>
                        updateQuestion(editingQuestionIndex, {
                          level: e.target.value,
                        })
                      }
                    >
                      <option value="bilish">Bilish</option>
                      <option value="qollash">Qo'llash</option>
                      <option value="mulohaza">Mulo-haza</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Tartib raqami</label>
                    <input
                      type="number"
                      className={inputCls}
                      value={questions[editingQuestionIndex].order_number}
                      onChange={(e) =>
                        updateQuestion(editingQuestionIndex, {
                          order_number: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className={labelCls}>Javoblar</label>
                    <button
                      onClick={() => addOption(editingQuestionIndex)}
                      className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1 hover:text-emerald-500"
                    >
                      <PlusCircleIcon className="w-3 h-3" />
                      Javob qo'shish
                    </button>
                  </div>
                  {questions[editingQuestionIndex].options.map((opt, oIndex) => (
                    <div key={oIndex} className="flex items-center gap-3">
                      <button
                        onClick={() =>
                          updateQuestion(editingQuestionIndex, {
                            correct_option: oIndex,
                          })
                        }
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                          questions[editingQuestionIndex].correct_option ===
                          oIndex
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-100 dark:bg-white/[0.04] text-slate-400"
                        }`}
                      >
                        {String.fromCharCode(65 + oIndex)}
                      </button>
                      <input
                        className={inputCls}
                        placeholder={`${String.fromCharCode(65 + oIndex)} javobi...`}
                        value={opt}
                        onChange={(e) =>
                          updateOption(editingQuestionIndex, oIndex, e.target.value)
                        }
                      />
                      {questions[editingQuestionIndex].options.length > 2 && (
                        <button
                          onClick={() => removeOption(editingQuestionIndex, oIndex)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all shrink-0"
                        >
                          <TrashBinMinimalisticIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    onClick={() => setEditingQuestionIndex(null)}
                    className="h-9 px-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest"
                  >
                    Tayyor
                  </Button>
                </div>
              </div>
            )}

            {questions.length === 0 && (
              <div className="py-16 border-2 border-dashed border-slate-200 dark:border-white/[0.06] rounded-xl text-center flex flex-col items-center justify-center p-6 bg-slate-50/50 dark:bg-white/[0.01]">
                <InfoCircleIcon className="w-10 h-10 text-slate-300 dark:text-white/20 mb-3" />
                <p className="text-[13px] text-slate-600 dark:text-slate-400 font-bold mb-4">
                  Hali savollar kiritilmagan
                </p>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => setShowTextImportModal(true)}
                    className="h-10 px-5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold text-[12px] shadow-md flex items-center gap-2"
                  >
                    <UploadMinimalisticIcon className="w-4 h-4" />
                    Matnli Import
                  </Button>
                  <Button
                    onClick={addQuestion}
                    className="h-10 px-5 bg-[#E8192C] hover:bg-red-700 text-white rounded-xl font-bold text-[12px] shadow-md flex items-center gap-2"
                  >
                    <PlusCircleIcon className="w-4 h-4" />
                    Yangi Savol Qo'shish
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {questions.map((q, index) => (
                <div
                  key={q.id || `new-${index}`}
                  className={`bg-white dark:bg-[#0A0F1A] border rounded-xl p-4 transition-all cursor-pointer hover:border-emerald-500/30 ${
                    editingQuestionIndex === index
                      ? "border-emerald-500 dark:border-emerald-500/30 ring-1 ring-emerald-500/10"
                      : "border-slate-200 dark:border-white/[0.06]"
                  }`}
                  onClick={() => setEditingQuestionIndex(index)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center gap-1 pt-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveQuestion(index, "up");
                        }}
                        disabled={index === 0}
                        className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-emerald-500 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                      >
                        <AltArrowUpIcon className="w-3.5 h-3.5" />
                      </button>
                      <GripVertical className="w-3.5 h-3.5 text-slate-300 dark:text-white/10" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveQuestion(index, "down");
                        }}
                        disabled={index === questions.length - 1}
                        className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-emerald-500 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                      >
                        <AltArrowDownIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-white/[0.04] flex items-center justify-center text-[10px] font-bold text-slate-400 shrink-0">
                      {q.order_number}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] leading-relaxed font-medium text-slate-800 dark:text-slate-200">
                        {renderLatex(q.question_text) || "Savol matni kiritilmagan"}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
                        {(Array.isArray(q.options) ? q.options : []).map((opt, oIdx) => (
                          <div
                            key={oIdx}
                            className={`p-2.5 rounded-lg border text-[13px] leading-snug ${
                              q.correct_option === oIdx
                                ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                                : "bg-slate-50 border-slate-200 dark:bg-white/[0.02] dark:border-white/[0.06] text-slate-600 dark:text-slate-300"
                            }`}
                          >
                            <span className="font-bold opacity-50 mr-1">{String.fromCharCode(65 + oIdx)}:</span>
                            {renderLatex(opt) || "..."}
                          </div>
                        ))}
                      </div>
                      <div className="mt-3">
                        <span className="text-[9px] font-bold text-slate-300 dark:text-white/10 uppercase px-2 py-0.5 bg-slate-50 dark:bg-white/[0.04] rounded-md">
                          {q.level}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteQuestion(index);
                      }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all shrink-0"
                    >
                      <TrashBinMinimalisticIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {questions.length > 0 && (
              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleSaveAll}
                  disabled={isSaving}
                  className="h-10 px-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest flex items-center gap-2"
                >
                  {isSaving ? (
                  <RefreshIcon className="w-4 h-4 animate-spin" />
                  ) : (
                  <DisketteIcon className="w-4 h-4" />
                  )}
                  Saqlash hammasi
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {showTextImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#0A0F1A] border border-slate-200 dark:border-white/[0.08] rounded-2xl w-full max-w-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <UploadMinimalisticIcon className="w-5 h-5 text-violet-500" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Matndan Savollarni Ommaviy Import Qilish
                </h2>
              </div>
              <button
                onClick={() => setShowTextImportModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                <CloseSquareIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="p-3.5 bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 rounded-xl text-[11.5px] text-slate-600 dark:text-slate-300 max-h-44 overflow-y-auto">
                <p className="font-bold text-violet-600 dark:text-violet-400 mb-1.5">Qo'llab-quvvatlanadigan barcha teg va qoliplar:</p>
                <pre className="font-mono text-[10.5px] text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
{`[MC] - Yagona tanlov (A, B*, C, D yoki JAVOB: B)
[MS] - Ko'p tanlovli savol
[TF] - To'g'ri / Yolg'on
[YN] - Ha / Yo'q
[FB] - Bo'sh joyni to'ldirish
[SA] - Qisqa javob
[NU] - Raqamli javob
[ES] - Insho / Ochiq savol
[MA] - Moslashtirish
[OR] - Tartiblash
[PR] - Dasturlash / Kod (@lang:, @code:)

Qo'shimcha teglar: @exp:Izoh, @diff:2 (daraja), @points:10, yulduzcha (*) bilan to'g'ri javobni belgilash.`}
                </pre>
              </div>

              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-3">
                Savollar Matni
              </label>
              <textarea
                rows={10}
                value={bulkImportText}
                onChange={(e) => setBulkImportText(e.target.value)}
                placeholder={`Savollarni shu yerga joylashtiring...\n\n1. Savol matni\nA) Variant 1\nB) Variant 2\nC) Variant 3\nD) Variant 4\nJAVOB: B`}
                className="w-full p-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-xl text-[12.5px] font-mono text-slate-900 dark:text-white outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 resize-y"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
              <button
                onClick={() => setShowTextImportModal(false)}
                className="px-4 py-2 rounded-xl text-[12px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                Bekor qilish
              </button>
              <Button
                onClick={handleBulkImport}
                className="h-10 px-5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold text-[12px] flex items-center gap-2 shadow-md"
              >
                <UploadMinimalisticIcon className="w-4 h-4" />
                Savollarni Import Qilish
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateTest;
