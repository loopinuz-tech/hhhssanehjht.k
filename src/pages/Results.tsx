import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isMathAnswerCorrect, parseWrittenAnswer } from "@/lib/mathUtils";
import { useAuth } from "@/hooks/useAuth";
import {
  FileText as FileIcon, CheckCircle2, XCircle, Loader2,
  History, Layout, Clock, Calendar, ChevronRight, Menu,
  TrendingUp, Target, Award, BarChart3, ArrowLeft, Filter,
  Check, X, Minus, Sparkles, Search, RefreshCw, LogIn, ChevronDown
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import SEO from "@/components/SEO";
import { useSubject } from "@/hooks/useSubject";
import { MagnifierIcon } from "@solar-icons/react/bold-duotone/magnifier";
import { HistoryIcon } from "@solar-icons/react/bold-duotone/history";
import { GraphIcon } from "@solar-icons/react/bold-duotone/graph";
import { CupIcon } from "@solar-icons/react/bold-duotone/cup";
import { CheckCircleIcon } from "@solar-icons/react/bold-duotone/check-circle";
import { DangerCircleIcon } from "@solar-icons/react/bold-duotone/danger-circle";
import { AltArrowLeftIcon } from "@solar-icons/react/bold-duotone/alt-arrow-left";
import { FilterIcon } from "@solar-icons/react/bold-duotone/filter";
import { ChecklistIcon } from "@solar-icons/react/bold-duotone/checklist";

const GRADE_TABLE = [
  { minRaw: 70, grade: "A+", color: "#059669", bg: "#d1fae5", label: "Maksimal ball" },
  { minRaw: 65, grade: "A", color: "#0284c7", bg: "#e0f2fe", label: "Yuqori ball" },
  { minRaw: 60, grade: "B+", color: "#7c3aed", bg: "#ede9fe", label: "Yaxshi natija" },
  { minRaw: 55, grade: "B", color: "#b45309", bg: "#fef3c7", label: "O'rtacha natija" },
  { minRaw: 50, grade: "C+", color: "#dc2626", bg: "#fee2e2", label: "Past natija" },
  { minRaw: 46, grade: "C", color: "#6b7280", bg: "#f3f4f6", label: "Minimal ball" },
];

function getGrade(rawScore: number) {
  const num = typeof rawScore === "number" ? rawScore : parseFloat(String(rawScore)) || 0;
  for (const g of GRADE_TABLE) {
    if (num >= g.minRaw) return g;
  }
  return GRADE_TABLE[GRADE_TABLE.length - 1];
}

const formatDateUz = (dateStr: string) => {
  if (!dateStr) return "Noma'lum";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const months = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
  return `${d.getDate()}-${months[d.getMonth()]}, ${d.getFullYear()}`;
};

const normalizeMath = (text: string) => {
  if (!text) return "";
  let formatted = String(text)
    .replace(/\\\(/g, "$")
    .replace(/\\\)/g, "$")
    .replace(/\\\[/g, () => "$$")
    .replace(/\\\]/g, () => "$$");

  const parts = formatted.split(/(\$\$[\s\S]*?\$\$|\$[^$]+?\$)/g);
  formatted = parts.map((part) => {
    if (part.startsWith("$")) return part;
    let p = part;

    p = p.replace(/;[ \t\r\n]*/g, ";\n");
    p = p.replace(/([^\n\*\_\>\s])\s*((?:\*\*|\*|<b>|<i>|<sub>|_)?\b[a-eA-E0-9]{1,2}[\)\.])\s*/g, "$1\n$2 ");

    // Convert HTML tags to Markdown
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

/* ─── Stats Card ────────────────────────────────────────────────── */
const StatCard = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) => {
  const IconComponent = Icon;
  return (
    <div className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-700 shadow-xs">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}15` }}>
        {IconComponent && (
          React.isValidElement(IconComponent) ? (
            IconComponent
          ) : (
            <IconComponent size={20} style={{ color }} />
          )
        )}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest truncate">{label}</p>
        <p className="text-base font-bold text-slate-900 dark:text-white truncate">{value}</p>
      </div>
    </div>
  );
};

/* ─── Session Detail Analysis ──────────────────────────────────── */
const SessionAnalysis = ({ session, details, isLoading, onToggleHistory, onReevaluate }: any) => {
  const [filter, setFilter] = useState<"all" | "correct" | "wrong" | "unanswered">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(true);
  const [isReevaluating, setIsReevaluating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleReevaluateSession = async () => {
    if (!session) return;
    setIsReevaluating(true);
    try {
      if (session.is_mock) {
        const testId = session.raw_data?.test_id;
        if (!testId) throw new Error("Mock test ID topilmadi");

        const { data: questions, error: qErr } = await supabase
          .from("mock_test_questions" as any)
          .select("*")
          .eq("test_id", testId)
          .order("question_number", { ascending: true });

        if (qErr || !questions) throw qErr || new Error("Savollar yuklanmadi");

        const userAnswers = session.raw_data?.answers || {};
        let totalScore = 0;
        let maxPossibleScore = 0;
        let correctCount = 0;

        questions.forEach((q: any) => {
          const userAns = userAnswers[q.question_number];
          let earned = 0;
          const available = q.points_a || 10;

          if (q.type === "multiple_choice") {
            const correctChar = (q.correct_answer || "").trim().toUpperCase();
            const userChar = typeof userAns === "string" ? userAns.trim().toUpperCase() : "";
            if (userChar === correctChar && userChar !== "") {
              earned = available;
              correctCount++;
            }
          } else if (q.type === "matching") {
            const corrAns = typeof q.correct_answer === "object" && q.correct_answer ? q.correct_answer : (q.metadata?.correct_matching || {});
            const uAns = typeof userAns === "object" && userAns ? userAns : {};
            const pairs = q.metadata?.matching_pairs || q.metadata?.items || q.metadata?.left || [1, 2, 3];
            let correctSub = 0;
            pairs.forEach((pair: any, i: number) => {
              const key = String(pair.id || (i + 1));
              const uVal = String(uAns[key] || uAns[i + 1] || uAns[String(32 + i + 1)] || "").trim().toUpperCase();
              const cVal = String(corrAns[key] || corrAns[i + 1] || corrAns[String(32 + i + 1)] || "").trim().toUpperCase();
              if (uVal && cVal && uVal === cVal) correctSub++;
            });
            const subFraction = pairs.length > 0 ? correctSub / pairs.length : 0;
            earned = available * subFraction;
            if (correctSub === pairs.length && pairs.length > 0) {
              correctCount++;
            } else if (correctSub > 0) {
              correctCount += subFraction;
            }
          } else if (q.type === "fill_blanks" || q.type === "written") {
            const parsedCorr = parseWrittenAnswer(q.correct_answer);
            const parsedUser = parseWrittenAnswer(userAns);

            const corrAnsA = parsedCorr.a;
            const corrAnsB = parsedCorr.b;
            const userAnsA = parsedUser.a;
            const userAnsB = parsedUser.b;

            const hasPartA = Boolean(corrAnsA) || Boolean(userAnsA);
            const hasPartB = Boolean(corrAnsB) || Boolean(userAnsB) || (q.question_text && String(q.question_text).includes("b)"));
            const totalParts = (hasPartA && hasPartB) ? 2 : 1;

            let isACorrect = hasPartA && Boolean(corrAnsA) && (isMathAnswerCorrect(userAnsA, corrAnsA) || isMathAnswerCorrect(userAnsB, corrAnsA));
            let isBCorrect = hasPartB && Boolean(corrAnsB) && (isMathAnswerCorrect(userAnsB, corrAnsB) || isMathAnswerCorrect(userAnsA, corrAnsB));

            let correctParts = 0;
            if (hasPartA && isACorrect) correctParts++;
            if (hasPartB && isBCorrect) correctParts++;

            const writtenFraction = totalParts > 0 ? correctParts / totalParts : 0;
            earned = available * writtenFraction;
            if (correctParts === totalParts && totalParts > 0) {
              correctCount++;
            } else if (correctParts > 0) {
              correctCount += writtenFraction;
            }
          } else {
            const corrAns = q.correct_answer;
            if (isMathAnswerCorrect(userAns, corrAns)) {
              earned = available;
              correctCount++;
            }
          }

          totalScore += Math.round(earned * 100) / 100;
          maxPossibleScore += available;
        });

        const scorePercentage = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;

        let { error: updateErr } = await (supabase as any)
          .from("mock_test_submissions")
          .update({
            score: scorePercentage,
            correct_answers: correctCount,
            raw_results: {
              total_questions: questions.length,
              correct_answers: correctCount
            }
          })
          .eq("id", session.id);

        if (updateErr) {
          console.warn("Update with correct_answers failed, attempting fallback update:", updateErr.message);
          const fallbackRes = await (supabase as any)
            .from("mock_test_submissions")
            .update({
              score: scorePercentage,
              raw_results: {
                total_questions: questions.length,
                correct_answers: correctCount
              }
            })
            .eq("id", session.id);
          updateErr = fallbackRes.error;
        }

        if (updateErr) throw updateErr;

        queryClient.invalidateQueries({ queryKey: ["my-sessions-final"] });
        onReevaluate?.();

        const displayCorrect = Math.round(correctCount * 10) / 10;
        toast({
          title: "Qayta tekshirildi!",
          description: `Natija yangilandi: ${scorePercentage}% (${displayCorrect}/${questions.length} to'g'ri)`,
        });
      }
    } catch (err: any) {
      toast({
        title: "Xatolik",
        description: err.message || "Qayta tekshirishda xatolik yuz berdi",
        variant: "destructive"
      });
    } finally {
      setIsReevaluating(false);
    }
  };

  if (isLoading) return (
    <div className="h-full flex flex-col items-center justify-center p-12 gap-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-slate-100 dark:border-slate-800 border-t-emerald-500 animate-spin" />
        <Sparkles className="w-6 h-6 text-emerald-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-slate-900 dark:text-white">Tahlil yuklanmoqda</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Savollar va javoblar tahlil qilinmoqda...</p>
      </div>
    </div>
  );

  if (!session) return (
    <div className="h-full flex flex-col items-center justify-center p-12 text-center">
      <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/60 rounded-3xl flex items-center justify-center mb-5 border border-slate-100 dark:border-slate-800">
        <Layout className="w-10 h-10 text-slate-300 dark:text-slate-600" />
      </div>
      <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">Test natijasini tanlang</h3>
      <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs leading-relaxed">Natijalar tahlili va to'g'ri javoblarni ko'rish uchun tarixdan testni tanlang</p>
    </div>
  );

  const grade = getGrade(session.score);

  const safeDetails = Array.isArray(details) ? details : [];

  const totalCorrect = safeDetails.filter((d: any) => d.is_correct).length;
  const totalWrong = safeDetails.filter((d: any) => !d.is_correct && d.selected_option !== null && d.selected_option !== undefined).length;
  const totalUnanswered = safeDetails.filter((d: any) => d.selected_option === null || d.selected_option === undefined).length;

  const filtered = safeDetails.filter((item: any) => {
    const isUnanswered = item.selected_option === null || item.selected_option === undefined;
    if (filter === "correct" && !item.is_correct) return false;
    if (filter === "wrong" && (item.is_correct || isUnanswered)) return false;
    if (filter === "unanswered" && !isUnanswered) return false;

    if (searchQuery.trim()) {
      const qText = item.questions?.question_text || "";
      const qNum = String(item.questions?.question_number || "");
      const qLower = (qText + " " + qNum).toLowerCase();
      if (!qLower.includes(searchQuery.toLowerCase().trim())) return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      {/* Header Info */}
      <div className="p-3 sm:p-4 md:p-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="flex items-center justify-between gap-2.5 sm:gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-xs sm:text-base md:text-lg font-bold text-slate-900 dark:text-white leading-snug truncate">
              {session.test_folders?.name || (session.is_mock ? "Mock Imtihon" : "Mavzuli Test")}
            </h2>
            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 font-medium truncate">
              <span>{formatDateUz(session.finished_at)}</span>
              <span>·</span>
              <span>{session.finished_at ? new Date(session.finished_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Score & Grade pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl">
              <span className="text-xs sm:text-base font-bold" style={{ color: grade.color }}>{session.score}%</span>
              <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-md flex items-center justify-center text-[10px] sm:text-xs font-bold shrink-0" style={{ backgroundColor: grade.bg, color: grade.color }}>
                {grade.grade}
              </span>
            </div>

            {/* Qayta tekshirish Button */}
            {session.is_mock && (
              <button
                onClick={handleReevaluateSession}
                disabled={isReevaluating}
                className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 border border-emerald-200/60 dark:border-emerald-500/30 transition-all flex items-center gap-1.5 text-xs font-bold disabled:opacity-50"
                title="Test natijasini qayta tekshirish va baholash"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isReevaluating ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Qayta tekshirish</span>
              </button>
            )}

            {/* Tarix Icon Button on Mobile */}
            <button
              onClick={onToggleHistory}
              className="lg:hidden p-1.5 sm:p-2 rounded-xl bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-100 transition-colors flex items-center gap-1 text-xs font-semibold"
              title="Tarix"
            >
              <History className="w-4 h-4 text-sky-500" />
              <span className="hidden sm:inline">Tarix</span>
            </button>

            {/* Collapsible Chevron Button */}
            <button
              onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center justify-center"
              title={isHeaderCollapsed ? "Batafsil ko'rsatish" : "Yig'ish"}
            >
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isHeaderCollapsed ? '' : 'rotate-180'}`} />
            </button>
          </div>
        </div>

        {/* Breakdown Stats Row - Collapsible */}
        {!isHeaderCollapsed && (
          <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 mt-3 sm:mt-5 animate-in fade-in duration-200">
            <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-emerald-50/80 dark:bg-emerald-500/10 border border-emerald-200/80 dark:border-emerald-500/20 text-center shadow-xs">
              <div className="text-lg sm:text-2xl md:text-3xl font-bold text-emerald-600 dark:text-emerald-400">{totalCorrect}</div>
              <div className="text-[10px] sm:text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider mt-0.5 sm:mt-1">To'g'ri</div>
            </div>
            <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-rose-50/80 dark:bg-rose-500/10 border border-rose-200/80 dark:border-rose-500/20 text-center shadow-xs">
              <div className="text-lg sm:text-2xl md:text-3xl font-bold text-rose-600 dark:text-rose-400">{totalWrong}</div>
              <div className="text-[10px] sm:text-xs font-semibold text-rose-700 dark:text-rose-300 uppercase tracking-wider mt-0.5 sm:mt-1">Xato</div>
            </div>
            <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-amber-50/80 dark:bg-amber-500/10 border border-amber-200/80 dark:border-amber-500/20 text-center shadow-xs">
              <div className="text-lg sm:text-2xl md:text-3xl font-bold text-amber-600 dark:text-amber-400">{totalUnanswered}</div>
              <div className="text-[10px] sm:text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider mt-0.5 sm:mt-1">Bo'sh</div>
            </div>
          </div>
        )}
      </div>

      {/* Filter Chips & Search Bar */}
      <div className="p-2.5 sm:p-3.5 md:p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
          {[
            { id: "all", label: "Barchasi", count: safeDetails.length, activeClass: "bg-slate-900 dark:bg-white text-white dark:text-slate-900" },
            { id: "correct", label: "To'g'ri", count: totalCorrect, activeClass: "bg-emerald-600 text-white" },
            { id: "wrong", label: "Xato", count: totalWrong, activeClass: "bg-rose-600 text-white" },
            { id: "unanswered", label: "Bo'sh", count: totalUnanswered, activeClass: "bg-amber-500 text-white" }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs md:text-sm font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
                filter === f.id ? f.activeClass : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <span>{f.label}</span>
              <span className={`px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-md text-[10px] sm:text-xs font-bold ${
                filter === f.id ? 'bg-white/20 text-current' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
              }`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative shrink-0 sm:w-56">
          <Search className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Savolni izlash..."
            className="w-full pl-8 sm:pl-9 pr-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          />
        </div>
      </div>

      {/* Questions List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <FileIcon className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Savollar topilmadi</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Tanlangan filtr bo'yicha hech narsa mos kelmadi</p>
          </div>
        ) : (
          filtered.map((qItem: any, idx: number) => {
            const quest = qItem.questions || {};
            const qNum = quest.question_number || idx + 1;
            const isUnanswered = qItem.selected_option === null || qItem.selected_option === undefined || qItem.selected_option === "";

            // Extract options array safely
            let optionsList: string[] = [];
            if (Array.isArray(quest.options) && quest.options.length > 0) {
              optionsList = quest.options.map((o: any) => typeof o === "string" ? o : (o?.option_text || o?.text || String(o)));
            } else if (typeof quest.options === "string" && quest.options.trim().length > 0) {
              try {
                const parsed = JSON.parse(quest.options);
                if (Array.isArray(parsed)) optionsList = parsed.map((o: any) => typeof o === "string" ? o : (o?.option_text || o?.text || String(o)));
              } catch {}
            } else if (quest.metadata?.options && Array.isArray(quest.metadata.options)) {
              optionsList = quest.metadata.options.map((o: any) => typeof o === "string" ? o : (o?.option_text || o?.text || String(o)));
            }

            const isMatching = quest.type === 'matching';
            const isMultipleChoice = (quest.type === 'multiple_choice' || optionsList.length > 0) && !isMatching;
            const hasABText = typeof quest.question_text === 'string' && (quest.question_text.includes("a)") || quest.question_text.includes("a."));
            const isWritten = !isMatching && !isMultipleChoice && (
              quest.type === 'written' ||
              quest.type === 'short_answer' ||
              quest.type === 'fill_blanks' ||
              (typeof quest.correct_answer === 'object' && quest.correct_answer !== null && ('a' in quest.correct_answer || 'b' in quest.correct_answer)) ||
              (typeof qItem.selected_option === 'object' && qItem.selected_option !== null && ('a' in qItem.selected_option || 'b' in qItem.selected_option)) ||
              hasABText
            );

            // Cluster logic (Only if metadata.is_cluster and shared_context exist and question is multiple choice)
            const isClusterQuestion = Boolean(quest.metadata?.is_cluster) && Boolean(quest.metadata?.shared_context) && isMultipleChoice;
            if (isClusterQuestion) {
              if (qNum !== 33) return null; // Only render container on first cluster question

              const clusterItems = filtered.filter((item: any) => {
                return Boolean(item.questions?.metadata?.is_cluster);
              });

              const q33 = clusterItems.find(item => item.questions?.question_number === 33)?.questions || quest;
              const sharedContext = q33?.metadata?.shared_context;
              const sharedOptions = Array.isArray(q33?.options) ? q33.options : optionsList;

              return (
                <div key="cluster-33-35" className="space-y-3 animate-in fade-in duration-300">
                  <div className="p-5 bg-gradient-to-r from-sky-50/50 to-white dark:from-slate-900 dark:to-slate-900/60 border border-sky-100 dark:border-slate-800 rounded-2xl">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1.5 h-4 bg-sky-500 rounded-full" />
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-sky-600 dark:text-sky-400">Savollar guruhi (33-35)</span>
                    </div>
                    <div className="prose prose-slate dark:prose-invert max-w-none text-xs leading-relaxed font-medium text-slate-700 dark:text-slate-300">
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {normalizeMath(sharedContext || "Ushbu savollar guruhi uchun umumiy matn kiritilgan.")}
                      </ReactMarkdown>
                    </div>
                  </div>

                  {clusterItems.map((cItem: any) => {
                    const cIsUnanswered = cItem.selected_option === null || cItem.selected_option === undefined;
                    const cNum = cItem.questions?.question_number || 33;
                    return (
                      <div key={cItem.id || cNum} className="p-4 md:p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-3 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase ${
                            cIsUnanswered ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200/50' :
                            cItem.is_correct ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200/50'
                          }`}>
                            #{cNum}-savol
                          </span>
                          {cIsUnanswered ? (
                            <span className="text-[10px] font-bold text-amber-500">Bo'sh</span>
                          ) : cItem.is_correct ? (
                            <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> To'g'ri</span>
                          ) : (
                            <span className="text-[10px] font-bold text-rose-500 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Xato</span>
                          )}
                        </div>

                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                          <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {normalizeMath(cItem.questions?.question_text)}
                          </ReactMarkdown>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {sharedOptions.map((opt: any, optIdx: number) => {
                            const optText = typeof opt === "string" ? opt : (opt?.text || String(opt));
                            const isSelected = cItem.selected_option === optIdx;
                            const isQuestionCorrect = cItem.is_correct === true;
                            const isCorrect = (cItem.questions?.correct_option ?? -1) === optIdx || (isQuestionCorrect && isSelected);
                            const style = isCorrect ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-200 font-bold'
                              : isSelected ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-200 font-bold'
                              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400';
                            return (
                              <div key={optIdx} className={`p-2.5 rounded-xl border text-[11px] flex items-center justify-between ${style}`}>
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[9.5px] font-black shrink-0 ${
                                    isCorrect ? 'bg-emerald-500 text-white' :
                                    isSelected ? 'bg-rose-500 text-white' :
                                    'bg-white dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'
                                  }`}>{String.fromCharCode(65 + optIdx)}</span>
                                  <div className="truncate">
                                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{normalizeMath(optText)}</ReactMarkdown>
                                  </div>
                                </div>
                                {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                                {isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-500 shrink-0" />}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            }

            // Written Question (Yozma savol: a va b shartlar)
            if (isWritten) {
              const rawUserAns = qItem.selected_option !== undefined && qItem.selected_option !== null ? qItem.selected_option : qItem.user_answer;
              const rawCorrAns = quest.correct_answer;
              const pointsAvailable = quest.points_a || 10;

              const parsedUser = parseWrittenAnswer(rawUserAns);
              const parsedCorr = parseWrittenAnswer(rawCorrAns);

              let userAnsA = parsedUser.a;
              let userAnsB = parsedUser.b;

              let corrAnsA = parsedCorr.a;
              let corrAnsB = parsedCorr.b;

              const hasPartB = Boolean(corrAnsB) || Boolean(userAnsB) || (quest.question_text && String(quest.question_text).includes("b)"));
              const hasPartA = Boolean(corrAnsA) || Boolean(userAnsA) || !hasPartB;

              const isAEmpty = !userAnsA;
              const isBEmpty = hasPartB && !userAnsB;

              let isACorrect = !isAEmpty && Boolean(corrAnsA) && isMathAnswerCorrect(userAnsA, corrAnsA);
              let isBCorrect = hasPartB ? (!isBEmpty && Boolean(corrAnsB) && isMathAnswerCorrect(userAnsB, corrAnsB)) : true;

              if (hasPartB && !isBCorrect && Boolean(corrAnsB)) {
                if (isMathAnswerCorrect(userAnsB, corrAnsB) || isMathAnswerCorrect(userAnsA, corrAnsB)) {
                  isBCorrect = true;
                }
              }
              if (!isACorrect && Boolean(corrAnsA)) {
                if (isMathAnswerCorrect(userAnsA, corrAnsA) || isMathAnswerCorrect(userAnsB, corrAnsA)) {
                  isACorrect = true;
                }
              }

              const totalParts = hasPartB ? 2 : 1;
              let earnedParts = 0;
              if (isACorrect) earnedParts++;
              if (hasPartB && isBCorrect) earnedParts++;

              const earnedPoints = Math.round((pointsAvailable * (earnedParts / totalParts)) * 10) / 10;
              const isWrittenUnanswered = isAEmpty && (!hasPartB || isBEmpty);
              const isWrittenAllCorrect = isACorrect && (!hasPartB || isBCorrect);

              const renderFormattedAnswer = (ansVal: any) => {
                if (ansVal === undefined || ansVal === null || ansVal === "") return <span className="text-amber-600 italic font-semibold text-xs md:text-sm">Kiritilmadi</span>;
                const str = String(ansVal).trim();
                if (!str) return <span className="text-amber-600 italic font-semibold text-xs md:text-sm">Kiritilmadi</span>;

                const parts = str.split(',').map(p => p.trim());
                return (
                  <span className="inline-flex items-center gap-1.5 flex-wrap">
                    {parts.map((part, pIdx) => {
                      let text = part;
                      if ((text.includes('\\') || text.includes('^') || text.includes('_') || (text.includes('/') && !text.includes(' '))) && !text.includes('$')) {
                        text = `$${text}$`;
                      }
                      return (
                        <span key={pIdx} className="inline-flex items-center gap-1 font-extrabold text-slate-900 dark:text-white text-xs md:text-sm">
                          {pIdx > 0 && <span className="text-[10px] text-slate-400 font-bold uppercase px-1">yoki</span>}
                          <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {normalizeMath(text)}
                          </ReactMarkdown>
                        </span>
                      );
                    })}
                  </span>
                );
              };

              return (
                <div key={qItem.id || idx} className="p-4 md:p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-3.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase border ${
                        isWrittenUnanswered ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-500/30' :
                        isWrittenAllCorrect ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-500/30' :
                        earnedParts > 0 ? 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-200/60 dark:border-sky-500/30' :
                        'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-500/30'
                      }`}>
                        #{qNum} · Yozma javob
                      </span>
                      <span className="text-[11px] font-extrabold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        {earnedPoints} / {pointsAvailable} ball
                      </span>
                    </div>

                    {isWrittenUnanswered ? (
                      <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1"><Minus className="w-3.5 h-3.5" /> Bo'sh (Belgilanmagan)</span>
                    ) : isWrittenAllCorrect ? (
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> To'liq to'g'ri</span>
                    ) : earnedParts > 0 ? (
                      <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-sky-600" /> Qismon to'g'ri (1/2)</span>
                    ) : (
                      <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1"><XCircle className="w-3.5 h-3.5 text-rose-600" /> Xato</span>
                    )}
                  </div>

                  <div className="text-sm md:text-base font-bold text-slate-900 dark:text-white leading-relaxed md:leading-loose">
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{normalizeMath(quest.question_text)}</ReactMarkdown>
                  </div>

                  <div className={`grid grid-cols-1 ${hasPartB ? 'sm:grid-cols-2' : 'sm:grid-cols-1'} gap-3.5 pt-1`}>
                    {/* Part A */}
                    <div className={`p-4 rounded-xl border ${
                      isAEmpty ? 'bg-amber-50/70 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30' :
                      isACorrect ? 'bg-emerald-50/70 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/40' :
                      'bg-rose-50/70 dark:bg-rose-500/10 border-rose-300 dark:border-rose-500/40'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                          {hasPartB ? "a) sharti:" : "Yozma javobingiz:"}
                        </span>
                        {isACorrect ? (
                          <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> To'g'ri (+{pointsAvailable / totalParts} ball)</span>
                        ) : isAEmpty ? (
                          <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400 flex items-center gap-1"><Minus className="w-4 h-4" /> Kiritilmadi (0 ball)</span>
                        ) : (
                          <span className="text-xs font-extrabold text-rose-600 dark:text-rose-400 flex items-center gap-1"><XCircle className="w-4 h-4" /> Xato (0 ball)</span>
                        )}
                      </div>

                      <div className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-2">
                        <span className="text-slate-500">Kiritgan javobingiz:</span> {renderFormattedAnswer(userAnsA)}
                      </div>

                      <div className="text-xs md:text-sm font-extrabold text-emerald-700 dark:text-emerald-300 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 mt-2 flex items-center gap-2">
                        <span className="text-emerald-800 dark:text-emerald-400">{hasPartB ? "a) shartiga to'g'ri javob:" : "To'g'ri javob:"}</span> {renderFormattedAnswer(corrAnsA)}
                      </div>
                    </div>

                    {/* Part B (if exists) */}
                    {hasPartB && (
                      <div className={`p-4 rounded-xl border ${
                        isBEmpty ? 'bg-amber-50/70 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30' :
                        isBCorrect ? 'bg-emerald-50/70 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/40' :
                        'bg-rose-50/70 dark:bg-rose-500/10 border-rose-300 dark:border-rose-500/40'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">b) sharti:</span>
                          {isBCorrect ? (
                            <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> To'g'ri (+{pointsAvailable / 2} ball)</span>
                          ) : isBEmpty ? (
                            <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400 flex items-center gap-1"><Minus className="w-4 h-4" /> Kiritilmadi (0 ball)</span>
                          ) : (
                            <span className="text-xs font-extrabold text-rose-600 dark:text-rose-400 flex items-center gap-1"><XCircle className="w-4 h-4" /> Xato (0 ball)</span>
                          )}
                        </div>

                        <div className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-2">
                          <span className="text-slate-500">Kiritgan javobingiz:</span> {renderFormattedAnswer(userAnsB)}
                        </div>

                        <div className="text-xs md:text-sm font-extrabold text-emerald-700 dark:text-emerald-300 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 mt-2 flex items-center gap-2">
                          <span className="text-emerald-800 dark:text-emerald-400">b) shartiga to'g'ri javob:</span> {renderFormattedAnswer(corrAnsB)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            // Matching Question (Moslashtirish)
            if (quest.type === 'matching') {
              const userAns = typeof qItem.selected_option === 'object' && qItem.selected_option ? qItem.selected_option : {};
              let corrAns: Record<string, string> = {};

              if (typeof quest.correct_answer === 'object' && quest.correct_answer !== null) {
                corrAns = quest.correct_answer;
              } else if (typeof quest.correct_answer === 'string' && quest.correct_answer.trim().startsWith('{')) {
                try { corrAns = JSON.parse(quest.correct_answer); } catch {}
              } else if (typeof quest.correct_answer === 'string' && quest.correct_answer.trim().length > 0) {
                const str = quest.correct_answer.trim();
                const matches = Array.from(str.matchAll(/(\d+)\s*[-:]\s*([A-Z])/gi));
                if (matches.length > 0) {
                  matches.forEach(m => { corrAns[m[1]] = m[2].toUpperCase(); });
                } else {
                  const letters = str.match(/[A-Z]/g);
                  if (letters && letters.length > 0) {
                    letters.forEach((lettr, lIdx) => { corrAns[String(lIdx + 1)] = lettr.toUpperCase(); });
                  }
                }
              }

              if (Object.keys(corrAns).length === 0 && quest.metadata?.correct_matching) {
                corrAns = typeof quest.metadata.correct_matching === 'object' ? quest.metadata.correct_matching : {};
              }

              if (Object.keys(corrAns).length === 0 && quest.metadata?.matching_pairs && Array.isArray(quest.metadata.matching_pairs)) {
                quest.metadata.matching_pairs.forEach((pair: any, i: number) => {
                  const key = String(pair.id || (i + 1));
                  const val = pair.correct_letter || pair.correct_answer || pair.answer || pair.target || pair.right || pair.correct || '';
                  if (val) corrAns[key] = String(val).trim().toUpperCase();
                });
              }

              const matchingPairs = quest.metadata?.matching_pairs || quest.metadata?.items || quest.metadata?.left || [1, 2, 3];
              const pointsAvailable = quest.points_a || 30;

              const totalSub = matchingPairs.length;
              let correctSubCount = 0;
              let answeredSubCount = 0;

              matchingPairs.forEach((pair: any, i: number) => {
                const key = String(pair.id || (i + 1));
                const uVal = String(userAns[key] || userAns[i + 1] || userAns[String(32 + i + 1)] || '').trim().toUpperCase();
                const cVal = String(corrAns[key] || corrAns[i + 1] || corrAns[String(32 + i + 1)] || '').trim().toUpperCase();
                if (uVal) answeredSubCount++;
                if (uVal && cVal && uVal === cVal) correctSubCount++;
              });

              const subFraction = totalSub > 0 ? correctSubCount / totalSub : 0;
              const earnedPoints = Math.round((pointsAvailable * subFraction) * 10) / 10;
              const pointsPerItem = Math.round((pointsAvailable / (totalSub || 1)) * 10) / 10;

              const isMatchUnanswered = answeredSubCount === 0;
              const isMatchAllCorrect = correctSubCount === totalSub;

              return (
                <div key={qItem.id || idx} className="p-4 md:p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-3.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase border ${
                        isMatchUnanswered ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-500/30' :
                        isMatchAllCorrect ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-500/30' :
                        correctSubCount > 0 ? 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-200/60 dark:border-sky-500/30' :
                        'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-500/30'
                      }`}>
                        #{qNum} · Moslashtirish
                      </span>
                      <span className="text-[11px] font-extrabold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        {earnedPoints} / {pointsAvailable} ball
                      </span>
                    </div>

                    {isMatchUnanswered ? (
                      <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1"><Minus className="w-3.5 h-3.5" /> Bo'sh (Belgilanmagan)</span>
                    ) : isMatchAllCorrect ? (
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> To'liq to'g'ri ({correctSubCount}/{totalSub})</span>
                    ) : correctSubCount > 0 ? (
                      <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-sky-600" /> Qismon to'g'ri ({correctSubCount}/{totalSub})</span>
                    ) : (
                      <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Xato (0/{totalSub})</span>
                    )}
                  </div>

                  <div className="text-base md:text-lg font-medium text-slate-800 dark:text-slate-100 leading-relaxed md:leading-loose">
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{normalizeMath(quest.question_text || "")}</ReactMarkdown>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    {matchingPairs.map((pair: any, pIdx: number) => {
                      const key = String(pair.id || (pIdx + 1));
                      const uVal = String(userAns[key] || userAns[pIdx + 1] || '').trim().toUpperCase();
                      const cVal = String(corrAns[key] || corrAns[pIdx + 1] || '').trim().toUpperCase();
                      const isItemCorrect = uVal && cVal && uVal === cVal;
                      const isItemEmpty = !uVal;

                      const itemStyle = isItemEmpty
                        ? 'bg-amber-50/70 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-900 dark:text-amber-200'
                        : isItemCorrect
                        ? 'bg-emerald-50/80 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/40 text-emerald-900 dark:text-emerald-200'
                        : 'bg-rose-50/80 dark:bg-rose-500/10 border-rose-300 dark:border-rose-500/40 text-rose-900 dark:text-rose-200';

                      return (
                        <div key={pIdx} className={`p-3.5 rounded-xl border space-y-2 ${itemStyle}`}>
                          <div className="flex items-center justify-between font-semibold text-xs md:text-sm">
                            <span>{pIdx + 1}-topshiriq:</span>
                            {isItemEmpty ? (
                              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Kiritilmadi (0 ball)</span>
                            ) : isItemCorrect ? (
                              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> +{pointsPerItem} ball</span>
                            ) : (
                              <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> 0 ball</span>
                            )}
                          </div>
                      <div className="text-sm md:text-base font-normal">
                            Javobingiz: <span className={isItemEmpty ? "text-amber-600 italic font-normal" : "underline font-semibold"}>{uVal || "Kiritilmadi"}</span>
                          </div>
                          <div className="text-sm md:text-base font-medium text-emerald-700 dark:text-emerald-300 pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60">
                            To'g'ri moslik: <span className="font-bold underline">{cVal || "—"}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }

            // Essay Question
            if (quest.type === 'essay') {
              let uVal = "";
              let aiScore = 0;
              const ansVal = qItem?.selected_option;
              if (ansVal) {
                if (typeof ansVal === "object") {
                  uVal = ansVal.text || "";
                  aiScore = ansVal.ai_score || 0;
                } else {
                  uVal = String(ansVal);
                }
              }
              const isItemEmpty = !uVal.trim();
              
              return (
                <div key={qItem.id || idx} className={`p-4 md:p-5 rounded-2xl space-y-3.5 shadow-xs border transition-all ${
                  isItemEmpty ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-400 dark:border-amber-700/60' :
                  'bg-slate-50/60 dark:bg-slate-900/20 border-slate-300 dark:border-slate-700/60'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase border bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700">
                      #{qNum}-savol (Essey)
                    </span>
                    {isItemEmpty ? (
                      <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1"><Minus className="w-3.5 h-3.5 text-amber-500" /> Kiritilmadi</span>
                    ) : (
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">Yozilgan (AI baho: {aiScore || 0} ball)</span>
                    )}
                  </div>
                  <div className="text-base md:text-lg font-medium text-slate-900 dark:text-slate-100 leading-relaxed md:leading-loose">
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {normalizeMath(quest.question_text || "")}
                    </ReactMarkdown>
                  </div>
                  <div className="pt-2">
                    <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">Sizning inshoingiz:</div>
                    <div className="p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-[100px] whitespace-pre-wrap font-medium text-[15px]" style={{ fontFamily: "'Caveat', cursive", fontSize: "20px" }}>
                      {uVal || <span className="text-slate-400 italic font-sans text-sm">Javob kiritilmadi</span>}
                    </div>
                  </div>
                </div>
              );
            }

            // Standard Multiple Choice Question
            let correctOptIdx = -1;

            if (typeof quest.correct_option === "number" && quest.correct_option >= 0 && quest.correct_option < optionsList.length) {
              correctOptIdx = quest.correct_option;
            }

            const rawCorr = quest.correct_answer !== undefined && quest.correct_answer !== null && quest.correct_answer !== ""
              ? quest.correct_answer
              : (quest.correct_option !== undefined && quest.correct_option !== null ? quest.correct_option : quest.answer);

            if (typeof rawCorr === "string") {
              const trimmed = rawCorr.trim();
              const upper = trimmed.toUpperCase();

              if (upper.length === 1 && upper >= 'A' && upper <= 'Z') {
                const letterIdx = upper.charCodeAt(0) - 65;
                if (letterIdx < optionsList.length) {
                  correctOptIdx = letterIdx;
                }
              }

              if (correctOptIdx === -1 && optionsList.length > 0) {
                const idx = optionsList.findIndex((opt: string) => {
                  const cleanOpt = opt.trim().toLowerCase();
                  const cleanCorr = trimmed.toLowerCase();
                  return cleanOpt === cleanCorr || cleanOpt.replace(/\s+/g, '') === cleanCorr.replace(/\s+/g, '');
                });
                if (idx !== -1) correctOptIdx = idx;
              }

              if (correctOptIdx === -1 && !isNaN(Number(trimmed))) {
                const num = Number(trimmed);
                if (num >= 0 && num < optionsList.length) {
                  correctOptIdx = num;
                }
              }
            } else if (typeof rawCorr === "number" && rawCorr >= 0 && rawCorr < optionsList.length) {
              correctOptIdx = rawCorr;
            }

            let selectedOptIdx: number | null = null;
            const rawSelected = qItem.selected_option !== undefined && qItem.selected_option !== null && qItem.selected_option !== ""
              ? qItem.selected_option
              : qItem.user_answer;

            if (typeof rawSelected === "number" && rawSelected >= 0 && rawSelected < optionsList.length) {
              selectedOptIdx = rawSelected;
            } else if (typeof rawSelected === "string") {
              const trimmed = rawSelected.trim();
              const upper = trimmed.toUpperCase();

              if (upper.length === 1 && upper >= 'A' && upper <= 'Z') {
                const letterIdx = upper.charCodeAt(0) - 65;
                if (letterIdx < optionsList.length) selectedOptIdx = letterIdx;
              }

              if (selectedOptIdx === null && optionsList.length > 0) {
                const idx = optionsList.findIndex((opt: string) => {
                  const cleanOpt = opt.trim().toLowerCase();
                  const cleanCorr = trimmed.toLowerCase();
                  return cleanOpt === cleanCorr || cleanOpt.replace(/\s+/g, '') === cleanCorr.replace(/\s+/g, '');
                });
                if (idx !== -1) selectedOptIdx = idx;
              }

              if (selectedOptIdx === null && !isNaN(Number(trimmed))) {
                const num = Number(trimmed);
                if (num >= 0 && num < optionsList.length) {
                  selectedOptIdx = num;
                }
              }
            }

            const isQuestionUnanswered = selectedOptIdx === null || selectedOptIdx === undefined;

            let isQuestionCorrect = (filter === "correct") || 
              Boolean(qItem.is_correct) || 
              qItem.is_correct === 1 || 
              qItem.is_correct === "1" || 
              qItem.is_correct === "true" || 
              Number(qItem.earned_points || 0) > 0 || 
              (!isQuestionUnanswered && (
                (correctOptIdx !== -1 && selectedOptIdx === correctOptIdx) ||
                (quest.correct_option !== undefined && quest.correct_option !== null && Number(quest.correct_option) === Number(selectedOptIdx)) ||
                (typeof quest.correct_answer === "string" && typeof qItem.selected_option === "string" && quest.correct_answer.trim().toLowerCase() === qItem.selected_option.trim().toLowerCase())
              ));

            if (!isQuestionCorrect && selectedOptIdx !== null && selectedOptIdx !== undefined && optionsList[selectedOptIdx]) {
              const selText = String(optionsList[selectedOptIdx]).trim().toLowerCase();
              const corrText = String(quest.correct_answer || "").trim().toLowerCase();
              if (corrText && (selText === corrText || selText.replace(/\s+/g, '') === corrText.replace(/\s+/g, ''))) {
                isQuestionCorrect = true;
              }
            }

            if (isQuestionCorrect && selectedOptIdx !== null && selectedOptIdx !== undefined) {
              correctOptIdx = selectedOptIdx;
            }

            return (
              <div key={qItem.id || idx} className={`p-4 md:p-5 rounded-2xl space-y-3.5 shadow-xs border transition-all ${
                isQuestionUnanswered ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-400 dark:border-amber-700/60' :
                isQuestionCorrect ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-400 dark:border-emerald-700/60' :
                'bg-rose-50/60 dark:bg-rose-950/20 border-rose-400 dark:border-rose-700/60'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase border ${
                    isQuestionUnanswered ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/40' :
                    isQuestionCorrect ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40' :
                    'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-500/40'
                  }`}>
                    #{qNum}-savol
                  </span>
                  {isQuestionUnanswered ? (
                    <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1"><Minus className="w-3.5 h-3.5 text-amber-500" /> Bo'sh (Belgilanmagan)</span>
                  ) : isQuestionCorrect ? (
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> To'liq to'g'ri</span>
                  ) : (
                    <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1"><XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" /> Xato</span>
                  )}
                </div>

                <div className="text-base md:text-lg font-medium text-slate-900 dark:text-slate-100 leading-relaxed md:leading-loose">
                  <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {normalizeMath(quest.question_text || "")}
                  </ReactMarkdown>
                </div>

                <div className="space-y-2.5 pt-1">
                  {optionsList.map((opt: string, optIdx: number) => {
                    const isSelected = selectedOptIdx === optIdx;
                    const isCorrectOption = isQuestionCorrect ? isSelected : (correctOptIdx === optIdx);

                    let style = "bg-white dark:bg-slate-800/60 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300";
                    let badgeStyle = "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold border border-slate-300 dark:border-slate-600";

                    if (isCorrectOption) {
                      // Correct option -> GREEN!
                      style = "bg-emerald-50 dark:bg-emerald-500/15 border-2 border-emerald-500 text-emerald-950 dark:text-emerald-100 font-semibold shadow-xs";
                      badgeStyle = "bg-emerald-600 text-white font-bold border-emerald-600";
                    } else if (isSelected) {
                      // User selected wrong option -> RED!
                      style = "bg-rose-50 dark:bg-rose-500/15 border-2 border-rose-500 text-rose-950 dark:text-rose-100 font-semibold shadow-xs";
                      badgeStyle = "bg-rose-600 text-white font-bold border-rose-600";
                    }

                    return (
                      <div key={optIdx} className={`p-3.5 px-4 rounded-xl border text-sm md:text-base font-normal flex items-center justify-between transition-all ${style}`}>
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs md:text-sm font-bold shrink-0 ${badgeStyle}`}>
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                              {normalizeMath(opt)}
                            </ReactMarkdown>
                          </div>
                        </div>
                        {isCorrectOption && <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 ml-2" />}
                        {isSelected && !isCorrectOption && <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 ml-2" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

/* ─── Main Results Page ────────────────────────────────────────── */
const Results = () => {
  const { user, loading: authLoading } = useAuth();
  const { activeSubject } = useSubject();
  const { tab } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [details, setDetails] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isOverviewCollapsed, setIsOverviewCollapsed] = useState(true);
  const [showHistoryOnMobile, setShowHistoryOnMobile] = useState(false);
  // Mobile: 'list' shows sessions list, 'detail' shows selected session analysis
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');
  const [sessionSearch, setSessionSearch] = useState("");
  const [detailsRefreshTrigger, setDetailsRefreshTrigger] = useState(0);
  const activeTab = tab === 'mock' ? 'mock' : 'standard';

  const [touchStart, setTouchStart] = useState<{x: number, y: number} | null>(null);
  const [touchEnd, setTouchEnd] = useState<{x: number, y: number} | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    setTouchEnd(null);
    setTouchStart({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    setTouchEnd({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (!touchStart || !touchEnd) return;
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = Math.abs(touchStart.y - touchEnd.y);
    if (distanceY > 50) return;
    if (distanceX > 60) {
      if (activeTab === 'standard') { navigate('/results/mock'); setSelectedSessionId(null); }
    } else if (distanceX < -60) {
      if (activeTab === 'mock') { navigate('/results/standard'); setSelectedSessionId(null); }
    }
  };

  const { data: sessions = [], isLoading: sessionsLoading, error: sessionsError, refetch } = useQuery({
    queryKey: ["my-sessions-final", user?.id, activeTab],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        if (activeTab === 'standard') {
          const { data, error } = await (supabase as any)
            .from("test_sessions")
            .select("*")
            .eq("user_id", user.id)
            .not("finished_at", "is", null)
            .order("finished_at", { ascending: false });

          if (error) {
            console.error("Sessions query error:", error);
            return [];
          }

          if (!data || data.length === 0) return [];

          const folderIds = [...new Set(data.map((s: any) => s.folder_id).filter(Boolean))];
          let folderMap: Record<string, any> = {};

          if (folderIds.length > 0) {
            const { data: folders } = await supabase
              .from("test_folders")
              .select("id, name, subject")
              .in("id", folderIds);

            if (folders) {
              folders.forEach((f: any) => { folderMap[f.id] = f; });
            }
          }

          return data.map((s: any) => ({
            ...s,
            test_folders: folderMap[s.folder_id] || null,
          }));
        } else {
          const { data: subData, error: subErr } = await supabase
            .from("mock_test_submissions" as any)
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

          if (subErr) {
            console.error("Mock submissions query error:", subErr);
            return [];
          }

          if (!subData || subData.length === 0) return [];

          const testIds = [...new Set((subData as any[]).map((s: any) => s.test_id).filter(Boolean))];
          let mockTestsMap: Record<string, any> = {};

          if (testIds.length > 0) {
            const { data: mockTestsData } = await supabase
              .from("mock_tests" as any)
              .select("id, title, subject")
              .in("id", testIds);

            if (mockTestsData) {
              mockTestsData.forEach((t: any) => { mockTestsMap[t.id] = t; });
            }
          }

          return (subData as any[]).map(s => {
            const mTest = mockTestsMap[s.test_id];
            return {
              id: s.id,
              test_folders: { name: mTest?.title || "Mock Imtihon" },
              finished_at: s.created_at,
              score: s.score || 0,
              correct_answers: s.correct_answers ?? s.raw_results?.correct_answers ?? 0,
              total_questions: s.total_questions ?? s.raw_results?.total_questions ?? 0,
              is_mock: true,
              raw_data: s
            };
          });
        }
      } catch (err) {
        console.error("Sessions fetch error:", err);
        return [];
      }
    },
    enabled: !!user?.id,
    retry: 1,
    staleTime: 15000,
  });

  // Filtered sessions search
  const filteredSessions = useMemo(() => {
    if (!sessionSearch.trim()) return sessions;
    const q = sessionSearch.toLowerCase().trim();
    return sessions.filter((s: any) => {
      const name = s.test_folders?.name || "";
      return name.toLowerCase().includes(q);
    });
  }, [sessions, sessionSearch]);

  // Stable primitive key for sessions list
  const sessionsKey = useMemo(() => (sessions || []).map((s: any) => s.id).join(","), [sessions]);

  // Auto select first session when sessions list changes — DESKTOP ONLY
  useEffect(() => {
    if (sessions && sessions.length > 0) {
      const exists = sessions.some((s: any) => s.id === selectedSessionId);
      if (!selectedSessionId || !exists) {
        // On mobile, don't auto-select — show list first
        const isMobile = window.innerWidth < 1024;
        if (!isMobile) {
          setSelectedSessionId(sessions[0].id);
        }
      }
    } else if (selectedSessionId !== null) {
      setSelectedSessionId(null);
    }
  }, [sessionsKey]);

  // Fetch details for selected session independently
  useEffect(() => {
    if (!selectedSessionId) {
      setDetails([]);
      setLoadingDetails(false);
      return;
    }

    let isMounted = true;
    const loadDetails = async () => {
      setLoadingDetails(true);
      try {
        const session = sessions?.find((s: any) => s.id === selectedSessionId);
        if (!session) {
          if (isMounted) setDetails([]);
          return;
        }

        if ((session as any).is_mock) {
          const { data: qData } = await supabase
            .from("mock_test_questions" as any)
            .select("*")
            .eq("test_id", (session as any).raw_data.test_id)
            .order("question_number", { ascending: true });

          const answers = (session as any).raw_data.answers || {};
          const mappedDetails = (qData || []).map((q: any) => {
            const options = q.metadata?.options || [];
            const userAns = answers[q.question_number];

            let isCorrect = false;
            let selectedOption: any = userAns;
            let correctOptionIndex: number | null = null;

            if (q.type === 'multiple_choice') {
              const corrStr = (q.correct_answer || '').trim().toUpperCase();
              if (corrStr.length === 1 && corrStr >= 'A' && corrStr <= 'Z') {
                correctOptionIndex = corrStr.charCodeAt(0) - 65;
              }
              let selectedOptionIndex: number | null = null;
              if (typeof userAns === 'string' && userAns.trim().length === 1 && userAns.trim().toUpperCase() >= 'A' && userAns.trim().toUpperCase() <= 'Z') {
                selectedOptionIndex = userAns.trim().toUpperCase().charCodeAt(0) - 65;
              } else if (typeof userAns === 'number') {
                selectedOptionIndex = userAns;
              } else if (options.length > 0) {
                const idx = options.indexOf(userAns);
                if (idx !== -1) selectedOptionIndex = idx;
              }
              isCorrect = selectedOptionIndex !== null && selectedOptionIndex !== -1 && selectedOptionIndex === correctOptionIndex;
              selectedOption = selectedOptionIndex !== null && selectedOptionIndex !== -1 ? selectedOptionIndex : userAns;
            } else if (q.type === 'written' || q.type === 'short_answer' || q.type === 'fill_blanks') {
              const corrAns = parseWrittenAnswer(q.correct_answer);
              const uAns = parseWrittenAnswer(userAns);

              const hasPartB = Boolean(corrAns.b) || Boolean(uAns.b) || (q.question_text && String(q.question_text).includes("b)"));
              const isACorrect = Boolean(corrAns.a) && isMathAnswerCorrect(uAns.a, corrAns.a);
              const isBCorrect = hasPartB ? (Boolean(corrAns.b) && isMathAnswerCorrect(uAns.b, corrAns.b)) : true;

              isCorrect = isACorrect && isBCorrect;
              selectedOption = userAns;
            } else if (q.type === 'matching') {
              const corrAns = typeof q.correct_answer === 'object' && q.correct_answer ? q.correct_answer : (q.metadata?.correct_matching || {});
              const uAns = typeof userAns === 'object' && userAns ? userAns : {};
              const pairs = q.metadata?.matching_pairs || q.metadata?.items || q.metadata?.left || [1, 2, 3];
              let correctSub = 0;
              let answeredSub = 0;
              pairs.forEach((pair: any, i: number) => {
                const key = String(pair.id || (i + 1));
                const uVal = String(uAns[key] || uAns[i + 1] || uAns[String(32 + i + 1)] || '').trim().toUpperCase();
                const cVal = String(corrAns[key] || corrAns[i + 1] || corrAns[String(32 + i + 1)] || '').trim().toUpperCase();
                if (uVal) answeredSub++;
                if (uVal && cVal && uVal === cVal) correctSub++;
              });
              isCorrect = answeredSub > 0 && correctSub === pairs.length;
              selectedOption = userAns;
            } else if (q.type === 'essay') {
              isCorrect = Number(q.earned_points || 0) > 0 || (typeof userAns === "object" && Number(userAns?.ai_score) > 0);
              selectedOption = userAns;
            } else {
              isCorrect = isMathAnswerCorrect(userAns, q.correct_answer);
              selectedOption = userAns;
            }

            return {
              id: q.id,
              questions: {
                ...q,
                options: options,
                correct_option: correctOptionIndex
              },
              selected_option: selectedOption,
              is_correct: isCorrect
            };
          });
          if (isMounted) setDetails(mappedDetails);
        } else {
          const { data, error } = await supabase
            .from("test_answers" as any)
            .select("*, questions (*)")
            .eq("session_id", selectedSessionId);

          if (error) throw error;
          if (isMounted) setDetails(data || []);
        }
      } catch (e: any) {
        console.error("Error loading session details:", e);
        if (isMounted) {
          toast({ title: "Xatolik", description: e.message || "Tahlilni yuklashda xatolik yuz berdi", variant: "destructive" });
        }
      } finally {
        if (isMounted) setLoadingDetails(false);
      }
    };

    void loadDetails();

    return () => {
      isMounted = false;
    };
  }, [selectedSessionId, sessionsKey, detailsRefreshTrigger]);

  const handleSelectSession = (id: string) => {
    setSelectedSessionId(id);
    setShowHistoryOnMobile(false);
    // On mobile: switch to detail view after selecting a session
    setMobileView('detail');
  };

  const activeSession = useMemo(() => {
    if (!sessions || sessions.length === 0) return null;
    return sessions.find((s: any) => s.id === selectedSessionId) || sessions[0];
  }, [sessions, selectedSessionId]);

  // Calculate summary stats
  const totalTests = sessions?.length || 0;
  const avgScore = useMemo(() => {
    if (totalTests === 0) return 0;
    const sum = sessions.reduce((acc: number, s: any) => acc + (s.score || 0), 0);
    return Math.round(sum / totalTests);
  }, [sessions, totalTests]);
  const bestScore = useMemo(() => {
    if (totalTests === 0) return 0;
    return Math.max(...sessions.map((s: any) => s.score || 0));
  }, [sessions, totalTests]);

  // Render Guest Prompt if not logged in
  if (!authLoading && !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-6 bg-slate-50 dark:bg-slate-950 text-center">
        <SEO title="Natijalar" description="Test tahlili va natijalari" />
        <div className="w-20 h-20 bg-rose-50 dark:bg-rose-500/10 rounded-3xl flex items-center justify-center mb-6 border border-rose-100 dark:border-rose-500/20 shadow-xs">
          <LogIn className="w-10 h-10 text-[#E8192C]" />
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">Tizimga kiring</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-6 leading-relaxed">
          Test natijalari va chuqur AI tahlillarini ko'rish uchun avval o'z hisobingizga kirishingiz lozim.
        </p>
        <button
          onClick={() => navigate("/login")}
          className="px-6 py-3 rounded-2xl bg-[#E8192C] text-white text-xs font-bold shadow-lg hover:bg-red-700 transition-all flex items-center gap-2"
        >
          <LogIn className="w-4 h-4" />
          <span>Tizimga kirish</span>
        </button>
      </div>
    );
  }

  if (sessionsLoading || authLoading) {
    return (
      <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-950 overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center p-12 gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-[#E8192C] animate-spin" />
            <Sparkles className="w-6 h-6 text-[#E8192C] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-slate-900 dark:text-white">Natijalar yuklanmoqda</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Sessiyalar ro'yxati olinmoqda...</p>
          </div>
        </div>
      </div>
    );
  }

  if (sessionsError) {
    return (
      <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-950 overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center p-12 gap-4">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-100 dark:border-red-500/20">
            <XCircle className="w-8 h-8 text-rose-500" />
          </div>
          <div className="text-center max-w-sm">
            <p className="text-sm font-bold text-slate-900 dark:text-white">Xatolik yuz berdi</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 mb-4">Natijalarni yuklashda server bilan bog'lanishda xatolik bo'ldi.</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Qayta urinish</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
      <SEO title="Natijalar" description="Test tahlili va tarixi" />

      {/* ── MOBILE: List View (shown first on small screens) ── */}
      <div 
        className={`lg:hidden flex flex-col bg-white dark:bg-slate-950 h-full overflow-hidden ${
          mobileView === 'list' ? 'flex' : 'hidden'
        }`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Mobile Header */}
        <div className="px-4 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
              <HistoryIcon size={18} className="text-slate-600 dark:text-slate-300" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Natijalar tarixi</h3>
              <p className="text-xs font-medium text-slate-500">{totalTests} ta yakunlangan test</p>
            </div>
          </div>
        </div>

        {/* Mobile Tab Switcher */}
        <div className="px-4 pt-3 pb-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-2.5">
          <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700">
            <button
              onClick={() => { navigate('/results/standard'); setSelectedSessionId(null); }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === 'standard' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700' : 'text-slate-600 dark:text-slate-400'}`}
            >
              Mavzulashtirilgan
            </button>
            <button
              onClick={() => { navigate('/results/mock'); setSelectedSessionId(null); }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === 'mock' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700' : 'text-slate-600 dark:text-slate-400'}`}
            >
              Mock Imtihon
            </button>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={sessionSearch}
              onChange={(e) => setSessionSearch(e.target.value)}
              placeholder="Test nomini izlash..."
              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#E8192C] transition-all"
            />
          </div>
        </div>

        {/* Mobile Sessions List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredSessions.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-slate-300 dark:border-slate-700">
                <FileIcon className="w-7 h-7 text-slate-400 dark:text-slate-600" />
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Testlar topilmadi</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[200px] mx-auto font-normal">
                {sessionSearch ? "Izlov bo'yicha test topilmadi" : "Hali hech qanday test yechilmagan"}
              </p>
            </div>
          ) : (
            filteredSessions.map((s: any) => {
              const isActive = selectedSessionId === s.id;
              const grade = getGrade(s.score);
              const testTitle = s.test_folders?.name || (s.is_mock ? "Mock Imtihon" : "Test Topshiriq");
              return (
                <button
                  key={s.id}
                  onClick={() => handleSelectSession(s.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all relative group ${
                    isActive
                      ? 'bg-white dark:bg-slate-900 border-[#E8192C] dark:border-[#E8192C] shadow-md ring-1 ring-[#E8192C]/20'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-7 bg-[#E8192C] rounded-r-full" />
                  )}
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold leading-snug truncate ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-800 dark:text-slate-200'}`}>
                        {testTitle}
                      </p>
                      <p className="text-xs font-medium text-slate-500 mt-1">
                        {formatDateUz(s.finished_at)} · {s.finished_at ? new Date(s.finished_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-base font-bold" style={{ color: grade.color }}>{s.score}%</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{grade.grade}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${s.score}%`, backgroundColor: grade.color }} />
                    </div>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{s.correct_answers || 0}/{s.total_questions || 0}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── MOBILE: Detail View ── */}
      <div className={`lg:hidden flex flex-col bg-white dark:bg-slate-950 h-full overflow-hidden ${
        mobileView === 'detail' ? 'flex' : 'hidden'
      }`}>
        {/* Mobile Back Header */}
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center gap-3">
          <button
            onClick={() => setMobileView('list')}
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 active:scale-95 transition-all"
          >
            <AltArrowLeftIcon size={20} className="text-slate-700 dark:text-slate-200" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {activeSession?.test_folders?.name || (activeSession?.is_mock ? "Mock Imtihon" : "Test natijasi")}
            </p>
            <p className="text-xs text-slate-400">{formatDateUz(activeSession?.finished_at || '')}</p>
          </div>
          {activeSession && (() => {
            const g = getGrade(activeSession.score);
            return (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shrink-0">
                <span className="text-sm font-bold" style={{ color: g.color }}>{activeSession.score}%</span>
                <span className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: g.bg, color: g.color }}>{g.grade}</span>
              </div>
            );
          })()}
        </div>
        <div className="flex-1 overflow-y-auto">
          <SessionAnalysis
            session={activeSession}
            details={details}
            isLoading={loadingDetails}
            onToggleHistory={() => setMobileView('list')}
            onReevaluate={() => setDetailsRefreshTrigger(p => p + 1)}
          />
        </div>
      </div>

      {/* ── DESKTOP LAYOUT ── */}
      <div className="hidden lg:flex flex-1 flex-col bg-white dark:bg-slate-950 lg:border-r border-slate-200 dark:border-slate-800 overflow-y-auto relative z-10">
        {/* Desktop: Summary Stats Bar (Collapsible) */}
        <div className="hidden lg:block border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 transition-all">
          <div className="px-6 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                <GraphIcon size={18} className="text-[#E8192C]" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white">Umumiy statistika</span>
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 ml-2">({totalTests} ta test yechilgan)</span>
              </div>
            </div>
            <button
              onClick={() => setIsOverviewCollapsed(!isOverviewCollapsed)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all text-[11px] font-semibold flex items-center gap-1.5"
            >
              <span>{isOverviewCollapsed ? "Ko'rsatish" : "Yig'ish"}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOverviewCollapsed ? '' : 'rotate-180'}`} />
            </button>
          </div>

          {!isOverviewCollapsed && (
            <div className="grid grid-cols-3 gap-4 px-6 pb-5 pt-1 animate-in fade-in duration-200">
              <StatCard icon={GraphIcon} label="O'rtacha ball" value={`${avgScore}%`} color="#E8192C" />
              <StatCard icon={ChecklistIcon} label="Jami testlar" value={totalTests} color="#7c3aed" />
              <StatCard icon={CupIcon} label="Eng yuqori ball" value={`${bestScore}%`} color="#059669" />
            </div>
          )}
        </div>

        <SessionAnalysis
          session={activeSession}
          details={details}
          isLoading={loadingDetails}
          onToggleHistory={() => setShowHistoryOnMobile(!showHistoryOnMobile)}
          onReevaluate={() => setDetailsRefreshTrigger(p => p + 1)}
        />
      </div>

      {/* Sidebar (Session History List) */}
      <div className={`
        fixed lg:relative inset-0 lg:inset-auto z-40 lg:z-20
        w-full lg:w-[340px] xl:w-[380px]
        bg-white dark:bg-slate-950
        transition-transform duration-300 ease-in-out
        flex flex-col border-l border-slate-200 dark:border-slate-800
        ${showHistoryOnMobile ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `}>
        {/* Sidebar Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
              <HistoryIcon size={18} className="text-slate-600 dark:text-slate-300" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-bold text-slate-900 dark:text-white">Sessiya tarixi</h3>
              <p className="text-xs font-medium text-slate-500 mt-0.5">{totalTests} ta yakunlangan test</p>
            </div>
          </div>
          <button onClick={() => setShowHistoryOnMobile(false)} className="lg:hidden p-2 text-slate-400 hover:text-slate-600">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-2.5">
          <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700">
            <button
              onClick={() => { navigate('/results/standard'); setSelectedSessionId(null); }}
              className={`flex-1 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all ${activeTab === 'standard' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700' : 'text-slate-600 dark:text-slate-400'}`}
            >
              Mavzulashtirilgan
            </button>
            <button
              onClick={() => { navigate('/results/mock'); setSelectedSessionId(null); }}
              className={`flex-1 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all ${activeTab === 'mock' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700' : 'text-slate-600 dark:text-slate-400'}`}
            >
              Mock Imtihon
            </button>
          </div>

          {/* Session Search */}
          <div className="relative">
            <MagnifierIcon size={16} className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={sessionSearch}
              onChange={(e) => setSessionSearch(e.target.value)}
              placeholder="Test nomini izlash..."
              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs md:text-sm font-medium bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#E8192C] transition-all"
            />
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {filteredSessions.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-slate-300 dark:border-slate-700">
                <FileIcon className="w-7 h-7 text-slate-400 dark:text-slate-600" />
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Testlar topilmadi</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[200px] mx-auto font-normal">
                {sessionSearch ? "Izlov bo'yicha test topilmadi" : "Hali hech qanday test yechilmagan"}
              </p>
            </div>
          ) : (
            filteredSessions.map((s: any) => {
              const isActive = selectedSessionId === s.id;
              const grade = getGrade(s.score);
              const testTitle = s.test_folders?.name || (s.is_mock ? "Mock Imtihon" : "Test Topshiriq");
              return (
                <button
                  key={s.id}
                  onClick={() => handleSelectSession(s.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all relative group ${
                    isActive
                      ? 'bg-white dark:bg-slate-900 border-[#E8192C] dark:border-[#E8192C] shadow-md ring-1 ring-[#E8192C]/20'
                      : 'bg-white/80 dark:bg-slate-900/80 border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-900 hover:border-slate-400'
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-7 bg-[#E8192C] rounded-r-full" />
                  )}

                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs md:text-sm font-semibold leading-snug truncate ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-800 dark:text-slate-200'}`}>
                        {testTitle}
                      </p>
                      <p className="text-xs font-medium text-slate-500 mt-1">
                        {formatDateUz(s.finished_at)} · {s.finished_at ? new Date(s.finished_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm md:text-base font-bold" style={{ color: grade.color }}>{s.score}%</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{grade.grade}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
                      <div className="h-full rounded-full transition-all" style={{ width: `${s.score}%`, backgroundColor: grade.color }} />
                    </div>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{s.correct_answers || 0}/{s.total_questions || 0}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Mobile Backdrop */}
      {showHistoryOnMobile && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 lg:hidden"
          onClick={() => setShowHistoryOnMobile(false)}
        />
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
      `}</style>
    </div>
  );
};

export default Results;
