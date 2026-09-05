import React, { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { UploadMinimalisticIcon } from "@solar-icons/react/bold-duotone/upload-minimalistic";
import { FileTextIcon } from "@solar-icons/react/bold-duotone/file-text";
import { CheckCircleIcon } from "@solar-icons/react/bold-duotone/check-circle";
import { CloseCircleIcon } from "@solar-icons/react/bold-duotone/close-circle";
import { DangerTriangleIcon } from "@solar-icons/react/bold-duotone/danger-triangle";
import { AltArrowLeftIcon } from "@solar-icons/react/bold-duotone/alt-arrow-left";
import { AltArrowRightIcon } from "@solar-icons/react/bold-duotone/alt-arrow-right";
import { RefreshIcon } from "@solar-icons/react/bold-duotone/refresh";
import { TrashBinMinimalisticIcon } from "@solar-icons/react/bold-duotone/trash-bin-minimalistic";
import { AddCircleIcon as PlusCircleIcon } from "@solar-icons/react/bold-duotone/add-circle";
import { DisketteIcon } from "@solar-icons/react/bold-duotone/diskette";
import { CloseSquareIcon } from "@solar-icons/react/bold-duotone/close-square";
import { AltArrowDownIcon } from "@solar-icons/react/bold-duotone/alt-arrow-down";
import { AltArrowUpIcon } from "@solar-icons/react/bold-duotone/alt-arrow-up";
import { api } from "@/lib/api";

type AnswerType = "variants" | "truefalse" | "written" | "matching" | "reading" | "fillblank";

interface ParsedQuestion {
  id: string;
  question_text: string;
  answer_type: AnswerType;
  options: { text: string; is_correct: boolean }[];
  points: number;
  explanation: string;
  match_left: string[];
  match_right: string[];
  match_correct: Record<string, number>;
  reading_passage: string;
  reading_sub_questions: any[];
  blank_sentence: string;
  blank_answers: string[];
  status: "pending" | "accepted" | "rejected";
  order_number: number;
}

export default function PdfImport() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<"upload" | "processing" | "review" | "importing">("upload");
  const [rawText, setRawText] = useState("");
  const [questions, setQuestions] = useState<ParsedQuestion[]>([]);
  const [progress, setProgress] = useState("");
  const [progressPercent, setProgressPercent] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const { data: tests } = useQuery({
    queryKey: ["builder-tests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("builder_tests" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const importMutation = useMutation({
    mutationFn: async ({ testId, questions: qs }: { testId: string; questions: ParsedQuestion[] }) => {
      for (const q of qs) {
        if (q.status !== "accepted") continue;

        const { data: questionData, error: qError } = await (supabase
          .from("builder_questions" as any) as any)
          .insert({
            test_id: testId,
            question_text: q.question_text,
            answer_type: q.answer_type,
            options: q.options,
            points: q.points,
            explanation: q.explanation,
            order_number: q.order_number,
          } as any)
          .select()
          .single();

        if (qError) throw qError;

        if (q.answer_type === "matching" || q.answer_type === "reading" || q.answer_type === "fillblank") {
          const extraData = {
            match_left: q.match_left,
            match_right: q.match_right,
            match_correct: q.match_correct,
            reading_passage: q.reading_passage,
            reading_sub_questions: q.reading_sub_questions,
            blank_sentence: q.blank_sentence,
            blank_answers: q.blank_answers,
          };
          await (supabase
            .from("builder_questions" as any) as any)
            .update({ explanation: JSON.stringify(extraData) } as any)
            .eq("id", (questionData as any).id);
        }
      }
    },
    onSuccess: () => {
      toast({ title: "Savollar muvaffaqiyatli import qilindi!" });
      queryClient.invalidateQueries({ queryKey: ["builder-tests"] });
      setStep("upload");
      setQuestions([]);
      setRawText("");
    },
    onError: (err: any) => {
      toast({ title: "Import xatosi", description: err.message, variant: "destructive" });
    },
  });

  const parseWithAi = async (text: string, customPrompt?: string) => {
    setProcessing(true);
    try {
      const systemPrompt = customPrompt || `Sen milliy sertifikat test savollarini tahlil qiluvchi ekspertisan. Berilgan matndagi BARCHA test savollarini aniqlab, JSON array formatida chiqar.

SAVOL TURLARI (har birini diqqat bilan aniqla):
1. "variants" — Oddiy variantli savol (A/B/C/D yoki A/B/C/D/E). Har bir javob varianti alohida options ichida.
2. "truefalse" — To'g'ri/Noto'g'ri. options: [{"text":"To'g'ri","is_correct":true},{"text":"Noto'g'ri","is_correct":false}]
3. "matching" — Moslashtirish. 2 ustunli: chap ustun elementlari va o'ng ustun javoblari. Masalan: "Gaplar va sintaktik tahlil izohlarini (A-F) ni o'zaro to'g'ri moslashtiring" yoki "Har uchala parchada ham ishtirok etgan fe'l shakllarini aniqlang".
4. "reading" — 1 ta uzun matn (passage) + uning asosida 2-5 ta savol. Matn "Matnni o'qing" yoki "quyidagi matnni o'qing" deb boshlansa.
5. "fillblank" — Bo'sh joy to'ldirish. Gapda ___ belgilari bor.
6. "written" — Yozma javob (ese, tahlil, tushuntirish).

QOIDALAR:
1. Har bir savolni chiqar — hech birini o'tkazib yuborma!
2. To'g'ri javobni albatta belgilagin.
3. Ball: har bir savol uchun 5.
4. Agar matnda "Matnni o'qing" deb boshlanuvchi blok va undan keyin bir nechta savol bo'lsa — "reading" turini ishlating.
5. Agar matn parchalari (I, II, III raqamlangan) berilgan va ularni moslashtirish so'ralsa — "matching" turini ishlating.
6. Savol raqamini (1., 2., 3....) saqlab qol.

FAQAT JSON array chiqar, boshqa hech narsa yozma.

JSON formatlari:

"variants" uchun:
{"question_text":"Savol","answer_type":"variants","options":[{"text":"A","is_correct":false},{"text":"B","is_correct":true},{"text":"C","is_correct":false},{"text":"D","is_correct":false}],"points":5}

"truefalse" uchun:
{"question_text":"Savol","answer_type":"truefalse","options":[{"text":"To'g'ri","is_correct":true},{"text":"Noto'g'ri","is_correct":false}],"points":5}

"reading" uchun:
{"question_text":"Matn asosida savollar","answer_type":"reading","reading_passage":"Butun matn to'liq...","reading_sub_questions":[{"question_text":"1-savol","options":[{"text":"A","is_correct":true}]},{"question_text":"2-savol","options":[{"text":"B","is_correct":true}]}],"options":[],"points":5}

"matching" uchun:
{"question_text":"Moslashtirish topshirig'i to'liq","answer_type":"matching","match_left":["1-element","2-element","3-element"],"match_right":["A","B","C"],"match_correct":{"0":0,"1":1,"2":2},"options":[],"points":5}

"fillblank" uchun:
{"question_text":"Bo'sh joylarni to'ldiring","answer_type":"fillblank","blank_sentence":"___ da ___ joylashgan.","blank_answers":["O'zbekiston","Toshkent"],"options":[],"points":5}

"written" uchun:
{"question_text":"Yozma savol","answer_type":"written","options":[],"points":5}`;

      // Bo'laklarga bo'lish — 10000 belgi, 3000 belgi overlay (ustma-ust)
      const CHUNK_SIZE = 10000;
      const OVERLAP = 3000;
      const chunks: string[] = [];
      for (let i = 0; i < text.length; i += CHUNK_SIZE - OVERLAP) {
        chunks.push(text.substring(i, Math.min(i + CHUNK_SIZE, text.length)));
      }

      setProgress(`Matn ${chunks.length} bo'lakka bo'lindi. Tahlil qilinmoqda...`);
      setProgressPercent(0);

      const allQuestions: any[] = [];
      const seenQuestionTexts = new Set<string>();

      for (let ci = 0; ci < chunks.length; ci++) {
        setProgress(`Bo'lak ${ci + 1}/${chunks.length} tahlil qilinmoqda... (${allQuestions.length} ta savol topildi)`);
        setProgressPercent(Math.round(((ci) / chunks.length) * 100));

        const response = await api.ai.chat([
          { role: "system", content: systemPrompt },
          { role: "user", content: `Bu PDF dan olingan matnning ${ci + 1}/${chunks.length} qismi. BARCHA savollarni top va JSON array formatida chiqar. Hech qanday savolni o'tkazib yuborma!\n\n--- MATN ---\n${chunks[ci]}\n--- MATN TUGADI ---` }
        ]);

        const content = response.choices?.[0]?.message?.content || "[]";
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            for (const item of parsed) {
              const qText = (item.question_text || "").trim();
              // Deduplikatsiya: bir xil savol matnini qayta qo'shmaslik
              if (qText && !seenQuestionTexts.has(qText.substring(0, 80))) {
                seenQuestionTexts.add(qText.substring(0, 80));
                allQuestions.push(item);
              }
            }
          } catch (e) {
            console.warn(`Bo'lak ${ci + 1} JSON parse xatosi:`, e);
          }
        }
      }

      setProgressPercent(100);

      if (allQuestions.length === 0) {
        toast({ title: "Hech qanday savol topilmadi", variant: "destructive" });
        setStep("upload");
        setProcessing(false);
        return;
      }

      const validTypes = ["variants", "truefalse", "written", "matching", "reading", "fillblank"];
      const mapped: ParsedQuestion[] = allQuestions.map((item: any, idx: number) => {
        const qType = validTypes.includes(item.answer_type) ? item.answer_type : "variants";
        return {
          id: `parsed_${Date.now()}_${idx}`,
          question_text: item.question_text || item.question || "",
          answer_type: qType as AnswerType,
          options: (item.options || []).map((opt: any) => ({
            text: opt.text || String(opt),
            is_correct: !!opt.is_correct,
          })),
          points: item.points || 5,
          explanation: typeof item.explanation === "object" ? JSON.stringify(item.explanation) : (item.explanation || ""),
          match_left: item.match_left || [],
          match_right: item.match_right || [],
          match_correct: item.match_correct || {},
          reading_passage: item.reading_passage || "",
          reading_sub_questions: item.reading_sub_questions || [],
          blank_sentence: item.blank_sentence || "",
          blank_answers: item.blank_answers || [],
          status: "pending" as const,
          order_number: idx + 1,
        };
      });

      setQuestions(mapped);
      setStep("review");
      setProgress(`${mapped.length} ta savol aniqlandi!`);
    } catch (err: any) {
      toast({ title: "AI xatosi", description: err.message, variant: "destructive" });
      setStep("upload");
    } finally {
      setProcessing(false);
    }
  };

  const handleReparse = async () => {
    if (!rawText) return;
    setStep("processing");
    await parseWithAi(rawText);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast({ title: "Faqat PDF fayllar qabul qilinadi", variant: "destructive" });
      return;
    }

    setStep("processing");
    setProgress("PDF fayl o'qilmoqda...");

    try {
      // PDF text extraction via API
      const formData = new FormData();
      formData.append("pdf", file);

      const response = await fetch("/api/pdf/extract", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("PDF matnini olishda xatolik");
      }

      const data = await response.json();
      const text = data.text || "";

      if (!text.trim()) {
        toast({ title: "PDF dan matn olinmadi", variant: "destructive" });
        setStep("upload");
        return;
      }

      setRawText(text);
      setProgressPercent(10);
      await parseWithAi(text);
    } catch (err: any) {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
      setStep("upload");
    }
  };

  const toggleAccept = (id: string) => {
    setQuestions(prev => prev.map(q =>
      q.id === id ? { ...q, status: q.status === "accepted" ? "rejected" : "accepted" } : q
    ));
  };

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const startEdit = (q: ParsedQuestion) => {
    setEditingId(q.id);
    setEditForm({ ...q });
  };

  const saveEdit = () => {
    setQuestions(prev => prev.map(q => q.id === editingId ? { ...editForm, id: editingId } : q));
    setEditingId(null);
  };

  const deleteQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const acceptAll = () => {
    setQuestions(prev => prev.map(q => ({ ...q, status: "accepted" as const })));
  };

  const getTypeLabel = (type: AnswerType) => {
    const labels: Record<AnswerType, string> = {
      variants: "Variantli",
      truefalse: "To'g'ri/Noto'g'ri",
      matching: "Moslashtirish",
      reading: "Matn asosida",
      fillblank: "Bo'sh joy",
      written: "Yozma",
    };
    return labels[type] || type;
  };

  const getTypeBadgeColor = (type: AnswerType) => {
    const colors: Record<AnswerType, string> = {
      variants: "bg-blue-100 text-blue-800",
      truefalse: "bg-green-100 text-green-800",
      matching: "bg-purple-100 text-purple-800",
      reading: "bg-orange-100 text-orange-800",
      fillblank: "bg-yellow-100 text-yellow-800",
      written: "bg-red-100 text-red-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  const acceptedCount = questions.filter(q => q.status === "accepted").length;
  const rejectedCount = questions.filter(q => q.status === "rejected").length;

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/tests")}>
          <AltArrowLeftIcon className="h-4 w-4 mr-1" />
          Orqaga
        </Button>
        <h1 className="text-2xl font-bold">PDF Import — Savollar</h1>
      </div>

      {/* Upload Step */}
      {step === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UploadMinimalisticIcon className="h-5 w-5" />
              PDF faylni yuklang
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileTextIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">PDF faylni bu yerga tashlang yoki bosing</p>
              <p className="text-sm text-muted-foreground mt-2">
                Milliy sertifikat, DTM va boshqa test PDFlari
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleFileUpload}
            />
          </CardContent>
        </Card>
      )}

      {/* Processing Step */}
      {step === "processing" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshIcon className="h-5 w-5 animate-spin" />
              AI tahlil qilmoqda...
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={progressPercent} className="h-3" />
            <p className="text-sm text-muted-foreground text-center">{progress}</p>
          </CardContent>
        </Card>
      )}

      {/* Review Step */}
      {step === "review" && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="flex flex-wrap gap-3">
            <Badge variant="outline" className="text-sm px-3 py-1">
              Jami: {questions.length}
            </Badge>
            <Badge className="bg-green-100 text-green-800 text-sm px-3 py-1">
              <CheckCircleIcon className="h-3.5 w-3.5 mr-1" />
              Qabul: {acceptedCount}
            </Badge>
            <Badge className="bg-red-100 text-red-800 text-sm px-3 py-1">
              <CloseCircleIcon className="h-3.5 w-3.5 mr-1" />
              Rad: {rejectedCount}
            </Badge>
            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm" onClick={acceptAll}>
                <CheckCircleIcon className="h-3.5 w-3.5 mr-1" />
                Barchasini qabul qilish
              </Button>
              <Button variant="outline" size="sm" onClick={handleReparse}>
                <RefreshIcon className="h-3.5 w-3.5 mr-1" />
                Qayta tahlil
              </Button>
            </div>
          </div>

          {/* Question List */}
          {questions.map((q, idx) => (
            <Card key={q.id} className={
              q.status === "accepted" ? "border-green-300 bg-green-50/30" :
              q.status === "rejected" ? "border-red-300 bg-red-50/30 opacity-60" : ""
            }>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Number */}
                  <span className="text-sm font-mono text-muted-foreground mt-1 shrink-0">
                    {idx + 1}.
                  </span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge className={`text-xs ${getTypeBadgeColor(q.answer_type)}`}>
                        {getTypeLabel(q.answer_type)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{q.points} ball</span>
                    </div>

                    <p className="font-medium text-sm mb-2 whitespace-pre-wrap">{q.question_text}</p>

                    {/* Options */}
                    {q.answer_type === "variants" && q.options.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-2">
                        {q.options.map((opt, oi) => (
                          <div key={oi} className={`text-xs px-2 py-1 rounded ${opt.is_correct ? "bg-green-100 font-semibold" : "bg-muted"}`}>
                            {String.fromCharCode(65 + oi)}. {opt.text}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* True/False */}
                    {q.answer_type === "truefalse" && (
                      <div className="flex gap-2 mt-2">
                        {q.options.map((opt, oi) => (
                          <Badge key={oi} variant={opt.is_correct ? "default" : "outline"} className="text-xs">
                            {opt.text}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Matching */}
                    {q.answer_type === "matching" && (
                      <div className="mt-2 text-xs space-y-1">
                        {q.match_left.map((left, li) => (
                          <div key={li} className="flex items-center gap-2">
                            <span className="bg-muted px-2 py-0.5 rounded">{left}</span>
                            <span>→</span>
                            <span className="bg-green-100 px-2 py-0.5 rounded">{q.match_right[q.match_correct[String(li)] || li]}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reading */}
                    {q.answer_type === "reading" && (
                      <div className="mt-2 space-y-2">
                        {q.reading_passage && (
                          <div className="bg-muted p-2 rounded text-xs max-h-32 overflow-y-auto">
                            <strong>Matn:</strong> {q.reading_passage.substring(0, 300)}...
                          </div>
                        )}
                        {q.reading_sub_questions?.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {q.reading_sub_questions.length} ta savol
                          </div>
                        )}
                      </div>
                    )}

                    {/* Fill Blank */}
                    {q.answer_type === "fillblank" && (
                      <div className="mt-2 text-xs bg-muted p-2 rounded">
                        <strong>Javoblar:</strong> {q.blank_answers.join(", ")}
                      </div>
                    )}

                    {/* Expand/Collapse for details */}
                    {(q.reading_passage || q.explanation) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-6 text-xs"
                        onClick={() => toggleExpand(q.id)}
                      >
                        {expandedIds.has(q.id) ? <AltArrowUpIcon className="h-3 w-3 mr-1" /> : <AltArrowDownIcon className="h-3 w-3 mr-1" />}
                        {expandedIds.has(q.id) ? "Yig'ish" : "Batafsil"}
                      </Button>
                    )}

                    {expandedIds.has(q.id) && (
                      <div className="mt-2 text-xs space-y-1 bg-muted/50 p-2 rounded">
                        {q.reading_passage && (
                          <div><strong>To'liq matn:</strong> {q.reading_passage}</div>
                        )}
                        {q.explanation && (
                          <div><strong>Tushuntirish:</strong> {q.explanation}</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1 shrink-0">
                    <Button
                      variant={q.status === "accepted" ? "default" : "outline"}
                      size="sm"
                      className="h-7"
                      onClick={() => toggleAccept(q.id)}
                    >
                      {q.status === "accepted" ? <CheckCircleIcon className="h-3.5 w-3.5" /> : <CheckCircleIcon className="h-3.5 w-3.5 opacity-30" />}
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7" onClick={() => startEdit(q)}>
                      ✏️
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 text-destructive" onClick={() => deleteQuestion(q.id)}>
                      <TrashBinMinimalisticIcon className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Import Button */}
          <div className="flex justify-end gap-3 pt-4 pb-8">
            <Button variant="outline" onClick={() => setStep("upload")}>
              Bekor qilish
            </Button>
            <Button
              onClick={() => setStep("importing")}
              disabled={acceptedCount === 0}
              className="min-w-[200px]"
            >
              <AltArrowRightIcon className="h-4 w-4 mr-2" />
              Import qilish ({acceptedCount} ta savol)
            </Button>
          </div>
        </div>
      )}

      {/* Import Step */}
      {step === "importing" && (
        <Card>
          <CardHeader>
            <CardTitle>Testni tanlang</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {acceptedCount} ta qabul qilingan savol import qilinadi
            </p>
            <div className="grid gap-2">
              {tests?.map((test: any) => (
                <div
                  key={test.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => importMutation.mutate({ testId: test.id, questions })}
                >
                  <div>
                    <p className="font-medium">{test.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {test.question_count || 0} savol
                    </p>
                  </div>
                  <AltArrowRightIcon className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
            <Button variant="outline" onClick={() => setStep("review")}>
              <AltArrowLeftIcon className="h-4 w-4 mr-2" />
              Orqaga
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingId} onOpenChange={() => setEditingId(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Savolni tahrirlash</DialogTitle>
          </DialogHeader>
          {editingId && editForm && (
            <div className="space-y-4">
              <div>
                <Label>Savol matni</Label>
                <Textarea
                  value={editForm.question_text}
                  onChange={(e) => setEditForm({ ...editForm, question_text: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Label>Savol turi</Label>
                <Select value={editForm.answer_type} onValueChange={(v) => setEditForm({ ...editForm, answer_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="variants">Variantli</SelectItem>
                    <SelectItem value="truefalse">To'g'ri/Noto'g'ri</SelectItem>
                    <SelectItem value="matching">Moslashtirish</SelectItem>
                    <SelectItem value="reading">Matn asosida</SelectItem>
                    <SelectItem value="fillblank">Bo'sh joy</SelectItem>
                    <SelectItem value="written">Yozma</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Options editor for variants */}
              {editForm.answer_type === "variants" && (
                <div className="space-y-2">
                  <Label>Javob variantlari</Label>
                  {editForm.options?.map((opt: any, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correct"
                        checked={opt.is_correct}
                        onChange={() => {
                          const newOpts = editForm.options.map((o: any, j: number) => ({ ...o, is_correct: j === i }));
                          setEditForm({ ...editForm, options: newOpts });
                        }}
                      />
                      <Input
                        value={opt.text}
                        onChange={(e) => {
                          const newOpts = [...editForm.options];
                          newOpts[i] = { ...newOpts[i], text: e.target.value };
                          setEditForm({ ...editForm, options: newOpts });
                        }}
                        placeholder={`Variant ${String.fromCharCode(65 + i)}`}
                      />
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditForm({ ...editForm, options: [...editForm.options, { text: "", is_correct: false }] })}
                  >
                    <PlusCircleIcon className="h-3.5 w-3.5 mr-1" /> Variant qo'shish
                  </Button>
                </div>
              )}

              {/* Matching editor */}
              {editForm.answer_type === "matching" && (
                <div className="space-y-3">
                  <div>
                    <Label>Chap ustun (elementlar)</Label>
                    {editForm.match_left?.map((_: string, i: number) => (
                      <Input
                        key={i}
                        value={editForm.match_left[i]}
                        onChange={(e) => {
                          const newLeft = [...editForm.match_left];
                          newLeft[i] = e.target.value;
                          setEditForm({ ...editForm, match_left: newLeft });
                        }}
                        className="mt-1"
                      />
                    ))}
                  </div>
                  <div>
                    <Label>O'ng ustun (javoblar)</Label>
                    {editForm.match_right?.map((_: string, i: number) => (
                      <Input
                        key={i}
                        value={editForm.match_right[i]}
                        onChange={(e) => {
                          const newRight = [...editForm.match_right];
                          newRight[i] = e.target.value;
                          setEditForm({ ...editForm, match_right: newRight });
                        }}
                        className="mt-1"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Reading editor */}
              {editForm.answer_type === "reading" && (
                <div className="space-y-3">
                  <div>
                    <Label>Matn (passage)</Label>
                    <Textarea
                      value={editForm.reading_passage}
                      onChange={(e) => setEditForm({ ...editForm, reading_passage: e.target.value })}
                      rows={6}
                    />
                  </div>
                  <div>
                    <Label>Ichki savollar ({editForm.reading_sub_questions?.length || 0} ta)</Label>
                    {editForm.reading_sub_questions?.map((sub: any, i: number) => (
                      <div key={i} className="bg-muted/50 p-2 rounded mt-1 text-sm">
                        {sub.question_text}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fillblank editor */}
              {editForm.answer_type === "fillblank" && (
                <div className="space-y-2">
                  <div>
                    <Label>Jumlalar (bo'sh joy bilan)</Label>
                    <Textarea
                      value={editForm.blank_sentence}
                      onChange={(e) => setEditForm({ ...editForm, blank_sentence: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>Javoblar (vergul bilan ajratilgan)</Label>
                    <Input
                      value={editForm.blank_answers?.join(", ")}
                      onChange={(e) => setEditForm({ ...editForm, blank_answers: e.target.value.split(",").map((s: string) => s.trim()) })}
                    />
                  </div>
                </div>
              )}

              <div>
                <Label>Ball</Label>
                <Input
                  type="number"
                  value={editForm.points}
                  onChange={(e) => setEditForm({ ...editForm, points: parseInt(e.target.value) || 5 })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingId(null)}>Bekor</Button>
            <Button onClick={saveEdit}>
              <DisketteIcon className="h-4 w-4 mr-2" />
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
