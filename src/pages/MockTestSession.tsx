import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
   ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Clock, ArrowLeft, List,
   X, AlertCircle, Sparkles, Calculator, BookOpen, Send, CheckCircle2, XCircle,
   MoreVertical, Bookmark, PenTool, ShieldAlert, RotateCcw, HelpCircle, Pause, Eye, EyeOff, Sun, Moon, Wand2,
   Trash2, FileText
} from "lucide-react";
import { rewriteStorageUrl } from "@/lib/storage";
import { isMathAnswerCorrect, parseWrittenAnswer } from "@/lib/mathUtils";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import SEO from "@/components/SEO";
import { buildMockTestSlug, slugify } from "@/lib/testRoutes";
import "mathlive";
import { AltArrowLeftIcon } from "@solar-icons/react/bold-duotone/alt-arrow-left";
import { AltArrowRightIcon } from "@solar-icons/react/bold-duotone/alt-arrow-right";
import { AltArrowDownIcon } from "@solar-icons/react/bold-duotone/alt-arrow-down";
import { AltArrowUpIcon } from "@solar-icons/react/bold-duotone/alt-arrow-up";
import { ClockCircleIcon } from "@solar-icons/react/bold-duotone/clock-circle";
import { EyeIcon } from "@solar-icons/react/bold-duotone/eye";
import { EyeClosedIcon } from "@solar-icons/react/bold-duotone/eye-closed";
import { SunIcon } from "@solar-icons/react/bold-duotone/sun";
import { MoonIcon } from "@solar-icons/react/bold-duotone/moon";
import { Pen2Icon } from "@solar-icons/react/bold-duotone/pen-2";
import { MenuDotsIcon } from "@solar-icons/react/bold-duotone/menu-dots";
import { BookmarkIcon } from "@solar-icons/react/bold-duotone/bookmark";
import { DiplomaIcon } from "@solar-icons/react/bold-duotone/diploma";
import { QuestionCircleIcon } from "@solar-icons/react/bold-duotone/question-circle";
import { PauseCircleIcon } from "@solar-icons/react/bold-duotone/pause-circle";

const RED = "#E8192C";

const normalizeMath = (text: string, questionType?: string) => {
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

      // 1. Convert semicolons followed by whitespace/newlines into a single newline \n
      p = p.replace(/;[ \t\r\n]*/g, ";\n");

      // 2. Ensure sub-items like a), b), c), d), e) or 1., 2., 3. start on a single newline \n
      p = p.replace(/([^\n\*\_\>\s])\s*((?:\*\*|\*|<b>|<i>|<sub>|_)?\b[a-eA-E0-9]{1,2}[\)\.])\s*/g, "$1\n$2 ");

      // Convert HTML tags to Markdown
      p = p.replace(/<i>(.*?)<\/i>/gi, "*$1*");
      p = p.replace(/<b>(.*?)<\/b>/gi, "**$1**");
      p = p.replace(/<strong>(.*?)<\/strong>/gi, "**$1**");
      p = p.replace(/<br\s*\/?>/gi, "\n\n");
      p = p.replace(/<sub>(.*?)<\/sub>/gi, "$_{$1}$");
      p = p.replace(/<sup>(.*?)<\/sup>/gi, "$^{$1}$");

      // 3. Trim multiple empty newlines to max double-newline \n\n
      p = p.replace(/\n{3,}/g, "\n\n");

      return p;
   }).join("");

   return formatted.trim();
};

const cleanMatchingItem = (rawText: string): string => {
   if (!rawText) return "";
   let cleaned = rawText.trim();
   // Remove leading number, maybe with formatting like **, *, <b>, <i>, <sub>
   cleaned = cleaned.replace(/^(?:\*\*|\*|<b>|<i>|<sub>|_)?\d+[\).\s]+(?:\*\*|\*|<\/b>|<\/i>|<\/sub>|_)?/, "").trim();
   if (cleaned.includes(" - ")) {
      cleaned = cleaned.split(" - ")[0].trim();
   } else if (cleaned.includes(" : ")) {
      cleaned = cleaned.split(" : ")[0].trim();
   }
   return cleaned;
};

const getMatchingHeading = (text: string): string => {
   if (!text) return "Topshiriqlarni javob variantlari bilan moslashtiring:";
   const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
   const headingLines = lines.filter(l => !/^(?:\*\*|\*|<b>|<i>|<sub>|_)?\d+[\).\s]/.test(l) && !l.includes(" - ") && !l.includes(" : "));
   if (headingLines.length > 0) return headingLines.join("\n\n");
   return "Topshiriqlarni javob variantlari bilan moslashtiring:";
};

const getMatchingLeftItems = (question: any): string[] => {
   if (question.metadata?.left && Array.isArray(question.metadata.left) && question.metadata.left.length > 0) {
      return question.metadata.left.map((item: string) => cleanMatchingItem(item));
   }
   if (!question.question_text) return [];

   const lines = question.question_text.split("\n").map((l: string) => l.trim()).filter(Boolean);
   const itemLines = lines.filter((l: string) => /^(?:\*\*|\*|<b>|<i>|<sub>|_)?\d+[\).\s]/.test(l) || l.includes(" - ") || l.includes(" : "));
   
   if (itemLines.length > 0) {
      return itemLines.map((l: string) => cleanMatchingItem(l));
   }

   return [cleanMatchingItem(question.question_text)];
};

const cleanMathForSelectText = (mathText: string): string => {
   if (!mathText) return "";
   let str = String(mathText);

   // 1. Remove LaTeX math delimiters
   str = str
      .replace(/\\\(/g, "")
      .replace(/\\\)/g, "")
      .replace(/\\\[/g, "")
      .replace(/\\\]/g, "")
      .replace(/\$/g, "")
      .trim();

   // 2. Convert nth roots: \sqrt[n]{x} -> ⁿ√(x)
   const superscripts: Record<string, string> = {
      '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
      '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
   };

   str = str.replace(/\\sqrt\[([^\]]+)\]\{([^{}]+|\{[^{}]*\})\}/g, (_, rootIndex, body) => {
      const sup = rootIndex.split('').map((c: string) => superscripts[c] || c).join('');
      const cleanBody = body.replace(/[\{\}]/g, "").trim();
      return `${sup}√(${cleanBody})`;
   });

   // 3. Convert square roots \sqrt{x} -> √(x)
   str = str.replace(/\\sqrt\{([^{}]+|\{[^{}]*\})\}/g, (_, body) => {
      const cleanBody = body.replace(/[\{\}]/g, "").trim();
      return `√(${cleanBody})`;
   });
   str = str.replace(/\\sqrt\b/g, "√");

   // 4. Convert fractions \dfrac{A}{B} or \frac{A}{B} recursively
   for (let i = 0; i < 5; i++) {
      if (!/\\(?:d)?frac/.test(str)) break;
      str = str.replace(/\\(?:d)?frac\s*\{([^{}]+|\{[^{}]*\})\}\s*\{([^{}]+|\{[^{}]*\})\}/g, (_, num, den) => {
         const cleanNum = num.replace(/[\{\}]/g, "").trim();
         const cleanDen = den.replace(/[\{\}]/g, "").trim();
         return `${cleanNum}/${cleanDen}`;
      });
   }

   // 5. Clean LaTeX commands & symbols
   str = str
      .replace(/\\pi\b/g, "π")
      .replace(/\\alpha\b/g, "α")
      .replace(/\\beta\b/g, "β")
      .replace(/\\gamma\b/g, "γ")
      .replace(/\\theta\b/g, "θ")
      .replace(/\\cdot\b/g, "·")
      .replace(/\\times\b/g, "×")
      .replace(/\\div\b/g, "÷")
      .replace(/\\degree\b|\^\s*\\circ|\^\s*°/g, "°")
      .replace(/\\le\b|\\leq\b/g, "≤")
      .replace(/\\ge\b|\\geq\b/g, "≥")
      .replace(/\\neq\b/g, "≠")
      .replace(/\\pm\b/g, "±")
      .replace(/\\infty\b/g, "∞")
      .replace(/\\left\(|\\right\)/g, "")
      .replace(/\\left\[|\\right\]/g, "")
      .replace(/\\left\{|\\right\}/g, "")
      .replace(/\\left|\\right/g, "")
      .replace(/\\/g, "");

   // 6. Clean extra spaces and redundant outer parens
   str = str.replace(/\s+/g, " ").trim();
   str = str.replace(/^\(\s*\((.*)\)\s*\)$/, "($1)");

   return str.trim();
};

const getMatchingOptionsList = (question: any): { char: string; text: string }[] => {
   if (question.metadata?.options && Array.isArray(question.metadata.options) && question.metadata.options.length > 0) {
      return question.metadata.options.map((opt: string, i: number) => ({
         char: String.fromCharCode(65 + i),
         text: opt
      }));
   }
   if (question.metadata?.right && Array.isArray(question.metadata.right) && question.metadata.right.length > 0) {
      return question.metadata.right.map((opt: string, i: number) => ({
         char: String.fromCharCode(65 + i),
         text: opt
      }));
   }
   if (!question.question_text) {
      return ["A", "B", "C", "D", "E", "F"].map((c) => ({ char: c, text: "" }));
   }

   const lines = question.question_text.split("\n").map((l: string) => l.trim()).filter(Boolean);
   const optionLines = lines.filter((l: string) => /^[A-Fa-f][\).\s]/.test(l));
   if (optionLines.length > 0) {
      return optionLines.map((l: string) => {
         const char = l.charAt(0).toUpperCase();
         const textPart = l.replace(/^[A-Fa-f][\).\s]+/, "").trim();
         return { char, text: textPart };
      });
   }

   return ["A", "B", "C", "D", "E", "F"].map((c) => ({ char: c, text: "" }));
};

const getQuestionBlanks = (question: any): { key: string; label: string; alternatives: string[] }[] => {
   if (question.metadata?.blanks && Array.isArray(question.metadata.blanks) && question.metadata.blanks.length > 0) {
      return question.metadata.blanks.map((b: any, idx: number) => {
         if (typeof b === "string") {
            let key = String.fromCharCode(97 + idx);
            let textPart = b;
            const match = b.match(/^([a-zA-Z0-9]+)[\).\s]+(.*)/);
            if (match) {
               key = match[1].toLowerCase();
               textPart = match[2];
            }
            const parts = textPart.split("|").map((s) => s.trim()).filter(Boolean);
            return { key, label: `${key.toUpperCase()})`, alternatives: parts };
         }
         const key = (b.key || b.label || String.fromCharCode(97 + idx)).toLowerCase();
         const alternatives = Array.isArray(b.alternatives) ? b.alternatives : (b.text || "").split("|").map((s: string) => s.trim()).filter(Boolean);
         return { key, label: `${key.toUpperCase()})`, alternatives };
      });
   }

   const parsedCorr = parseWrittenAnswer(question.correct_answer);
   const text = String(question.question_text || "");
   const hasAInText = text.includes("a)") || text.includes("a.");
   const hasBInText = text.includes("b)") || text.includes("b.");

   const keys: string[] = [];
   if (parsedCorr.a || hasAInText || (!parsedCorr.b && !hasBInText)) {
      keys.push("a");
   }
   if (parsedCorr.b || hasBInText) {
      if (!keys.includes("a")) keys.unshift("a");
      if (!keys.includes("b")) keys.push("b");
   }

   if (keys.length > 0) {
      return keys.map((k) => {
         const val = k === "a" ? parsedCorr.a : parsedCorr.b;
         const parts = val ? val.split("|").map((s) => s.trim()).filter(Boolean) : [];
         return { key: k, label: `${k.toUpperCase()})`, alternatives: parts };
      });
   }

   return [{ key: "a", label: "A)", alternatives: [] }];
};

export const cleanMathAnswer = (str: string): string => {
   if (!str) return "";
   return String(str)
      .replace(/\$/g, "")
      .replace(/\\text\{.*?\}/g, "")
      .replace(/\\mathrm\{.*?\}/g, "")
      .replace(/\\dfrac/g, "\\frac")
      .replace(/(?:cm³|cm²|cm|m\/s²|m\/s|m|km|kg|g|soat|minut|min|sekund|metr|so'm|som|°|gradus|ta|yechim|ildiz)/gi, "")
      .replace(/\s+/g, "")
      .toLowerCase();
};

export const parseNumberOrMath = (str: string): number | null => {
   const cleaned = cleanMathAnswer(str);
   if (!cleaned) return null;

   const directNum = parseFloat(cleaned);
   if (!isNaN(directNum) && String(directNum) === cleaned) return directNum;

   const fracMatch = cleaned.match(/^(-?\d+)\/(-?\d+)$/) || cleaned.match(/\\frac\{(-?\d+)\}\{(-?\d+)\}/);
   if (fracMatch) {
      const num = parseFloat(fracMatch[1]);
      const den = parseFloat(fracMatch[2]);
      if (den !== 0) return num / den;
   }

   const sqrtMatch = cleaned.match(/^(-?\d*)?\\sqrt\{(\d+)\}$/);
   if (sqrtMatch) {
      const mult = sqrtMatch[1] === "" || sqrtMatch[1] === "-" ? (sqrtMatch[1] === "-" ? -1 : 1) : parseFloat(sqrtMatch[1]);
      const val = parseFloat(sqrtMatch[2]);
      return mult * Math.sqrt(val);
   }

   return isNaN(directNum) ? null : directNum;
};

export const isAnswerCorrect = (userAnsRaw: any, targetAlternativesRaw: any): boolean => {
   if (userAnsRaw === null || userAnsRaw === undefined) return false;

   const userStr = String(userAnsRaw).trim();
   if (!userStr) return false;

   const userCleaned = cleanMathAnswer(userStr);
   const userNum = parseNumberOrMath(userStr);

   const targets: string[] = Array.isArray(targetAlternativesRaw)
      ? targetAlternativesRaw.map((t) => String(t))
      : typeof targetAlternativesRaw === "object"
      ? Object.values(targetAlternativesRaw).flat().map((t) => String(t))
      : [String(targetAlternativesRaw || "")];

   for (const target of targets) {
      const targetCleaned = cleanMathAnswer(target);
      if (!targetCleaned) continue;

      if (userCleaned === targetCleaned) return true;

      const targetNum = parseNumberOrMath(target);
      if (userNum !== null && targetNum !== null && !isNaN(userNum) && !isNaN(targetNum)) {
         if (userNum === targetNum) return true;
         const diff = Math.abs(userNum - targetNum);
         const base = Math.abs(targetNum) || 1;
         if (diff / base <= 0.10 || diff <= 0.05) return true;
      }
   }

   return false;
};

const MathPreview = ({ text }: { text: string }) => {
   if (!text) return null;
   let display = text.trim();
   if (!display.startsWith("$") && !display.endsWith("$")) display = `$${display}$`;
   return (
      <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col items-center">
         <p className="text-[10px] font-medium text-slate-400 mb-2 uppercase tracking-wider">Ko'rinish</p>
         <div className="text-xl text-slate-900 dark:text-white flex items-center">
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
               {normalizeMath(display)}
            </ReactMarkdown>
         </div>
      </div>
   );
};



const WhiteboardModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
   const canvasRef = useRef<HTMLCanvasElement | null>(null);
   const [isDrawing, setIsDrawing] = useState(false);
   const [color, setColor] = useState("#E8192C");

   useEffect(() => {
      if (isOpen && canvasRef.current) {
         const canvas = canvasRef.current;
         canvas.width = canvas.parentElement?.clientWidth || 700;
         canvas.height = canvas.parentElement?.clientHeight || 400;
         const ctx = canvas.getContext("2d");
         if (ctx) {
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.lineWidth = 3;
         }
      }
   }, [isOpen]);

   if (!isOpen) return null;

   const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      setIsDrawing(true);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const rect = canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      ctx?.beginPath();
      ctx?.moveTo(clientX - rect.left, clientY - rect.top);
   };

   const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (!isDrawing || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const rect = canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      if (ctx) {
         ctx.strokeStyle = color;
         ctx.lineTo(clientX - rect.left, clientY - rect.top);
         ctx.stroke();
      }
   };

   const stopDrawing = () => setIsDrawing(false);

   const clearCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
   };

   return (
      <div className="fixed inset-0 z-[120] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
         <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 w-full max-w-3xl shadow-2xl space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
               <span className="text-[13px] font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <PenTool className="w-4 h-4 text-[#E8192C]" /> Qoralama taxtasi (Whiteboard)
               </span>
               <div className="flex items-center gap-2">
                  {["#E8192C", "#2563eb", "#16a34a", "#000000"].map((c) => (
                     <button
                        key={c}
                        onClick={() => setColor(c)}
                        className={`w-5 h-5 rounded-full border-2 ${color === c ? "border-slate-900 dark:border-white scale-110" : "border-transparent"}`}
                        style={{ background: c }}
                     />
                  ))}
                  <button onClick={clearCanvas} className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 flex items-center gap-1">
                     <RotateCcw className="w-3 h-3" /> Tozalash
                  </button>
                  <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg ml-2">
                     <X className="w-4 h-4 text-slate-400" />
                  </button>
               </div>
            </div>
            <div className="w-full h-[380px] bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden relative cursor-crosshair">
               <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-full"
               />
            </div>
         </div>
      </div>
   );
};

const SubmitConfirmModal = ({
   isOpen,
   onClose,
   onSubmit,
   totalQuestions,
   answeredCount,
   bookmarkedCount,
}: {
   isOpen: boolean;
   onClose: () => void;
   onSubmit: () => void;
   totalQuestions: number;
   answeredCount: number;
   bookmarkedCount: number;
}) => {
   if (!isOpen) return null;
   const unansweredCount = totalQuestions - answeredCount;

   return (
      <div className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4" onClick={onClose}>
         <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 w-full max-w-md shadow-2xl space-y-4 sm:space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 text-[#E8192C] flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5" />
               </div>
               <div>
                  <h3 className="text-[15px] sm:text-[16px] font-bold text-slate-900 dark:text-white">Imtihonni yakunlaysizmi?</h3>
                  <p className="text-[12px] text-slate-500 dark:text-slate-400">Natijalaringiz hisoblanadi va test yakunlanadi.</p>
               </div>
            </div>

            <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
               <div>
                  <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 uppercase tracking-wider block truncate">Javob berildi</span>
                  <span className="text-[16px] font-bold text-emerald-600 dark:text-emerald-400">{answeredCount}</span>
               </div>
               <div>
                  <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 uppercase tracking-wider block truncate">Javobsiz</span>
                  <span className="text-[16px] font-bold text-[#E8192C]">{unansweredCount}</span>
               </div>
               <div>
                  <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 uppercase tracking-wider block truncate">Belgilangan</span>
                  <span className="text-[16px] font-bold text-amber-500">{bookmarkedCount}</span>
               </div>
            </div>

            {unansweredCount > 0 && (
               <div className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl text-[12px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                  <span className="shrink-0 text-sm">⚠️</span>
                  <span>Sizda {unansweredCount} ta belgilanmagan savol bor. Testni yakunlashga ishonchingiz komilmi?</span>
               </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3 pt-2">
               <button
                  onClick={onClose}
                  className="w-full sm:flex-1 h-11 rounded-xl border border-slate-200 dark:border-slate-700 text-[13px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
               >
                  Davom ettirish
               </button>
               <button
                  onClick={() => { onClose(); onSubmit(); }}
                  className="w-full sm:flex-1 h-11 rounded-xl text-[13px] font-semibold text-white transition-opacity hover:opacity-90 shadow-sm"
                  style={{ background: RED }}
               >
                  Ha, yakunlash
               </button>
            </div>
         </div>
      </div>
   );
};

const TabAwayWarningModal = ({
   isOpen,
   secondsLeft,
   onReturn,
}: {
   isOpen: boolean;
   secondsLeft: number;
   onReturn: () => void;
}) => {
   if (!isOpen) return null;

   return (
      <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
         <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 border-2 border-red-500 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl space-y-6"
         >
            <div className="w-20 h-20 bg-red-100 dark:bg-red-500/20 text-[#E8192C] rounded-full flex items-center justify-center mx-auto animate-pulse">
               <ShieldAlert className="w-10 h-10" />
            </div>

            <div className="space-y-2">
               <h3 className="text-xl font-extrabold text-slate-900 dark:text-white uppercase tracking-wide">
                  ⚠️ DIQQAT! IMTIHON OYNASIDAN CHIQDINGIZ!
               </h3>
               <p className="text-[13px] text-slate-600 dark:text-slate-400">
                  Ushbu oynaga <span className="font-bold text-[#E8192C]">10 soniya</span> ichida qaytmasangiz, imtihoningiz avtomatik yakunlanadi!
               </p>
            </div>

            {/* Countdown Badge */}
            <div className="relative w-28 h-28 mx-auto flex items-center justify-center bg-red-50 dark:bg-red-500/10 rounded-full border-4 border-red-500 shadow-inner">
               <span className="text-5xl font-black font-mono text-[#E8192C] animate-bounce">
                  {secondsLeft}
               </span>
               <span className="absolute bottom-2 text-[10px] font-bold text-red-500 uppercase tracking-widest">
                  soniya
               </span>
            </div>

            <button
               onClick={onReturn}
               className="w-full h-12 rounded-2xl bg-[#E8192C] hover:bg-[#c81424] text-white text-[14px] font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
            >
               Davom etish
            </button>
         </motion.div>
      </div>
   );
};

const MockTestSession = () => {
   const { id } = useParams();
   const navigate = useNavigate();
   const [searchParams, setSearchParams] = useSearchParams();
   const { user, profile, isAdmin } = useAuth();
   const { toast } = useToast();

   const [test, setTest] = useState<any>(null);
   const [questions, setQuestions] = useState<any[]>([]);
   const [currentIdx, setCurrentIdx] = useState<number>(() => {
      if (typeof window === "undefined") return 0;
      const qParam = new URLSearchParams(window.location.search).get("q");
      const parsed = qParam ? parseInt(qParam, 10) : NaN;
      return !isNaN(parsed) && parsed > 0 ? parsed - 1 : 0;
   });
   const [answers, setAnswers] = useState<Record<number, any>>(() => {
      if (typeof window === "undefined" || !id) return {};
      const saved = localStorage.getItem(`mock_answers_${id}`);
      return saved ? JSON.parse(saved) : {};
   });

   const goToQuestion = useCallback((idx: number) => {
      if (!questions || questions.length === 0) {
         setCurrentIdx(idx);
         return;
      }
      const validIdx = Math.max(0, Math.min(questions.length - 1, idx));
      setCurrentIdx(validIdx);
      setSearchParams({ q: (validIdx + 1).toString() }, { replace: true });
   }, [questions, setSearchParams]);
   const [timeLeft, setTimeLeft] = useState(0);
   const [loading, setLoading] = useState(true);
   const [showExitConfirm, setShowExitConfirm] = useState(false);
   const [showInstructions, setShowInstructions] = useState(false);
   const [focusedInput, setFocusedInput] = useState<"a" | "b" | null>(null);
   const [showQuestionNav, setShowQuestionNav] = useState(false);
   const [navFilter, setNavFilter] = useState<"all" | "unanswered" | "bookmarked">("all");
   const [showBatafsilMenu, setShowBatafsilMenu] = useState(false);
   const [showPauseModal, setShowPauseModal] = useState(false);
   const [showTimer, setShowTimer] = useState(true);
   const [selectedImage, setSelectedImage] = useState<string | null>(null);
   const [isFullscreen, setIsFullscreen] = useState(false);
   const [showWhiteboard, setShowWhiteboard] = useState(false);
   const [showSubmitModal, setShowSubmitModal] = useState(false);
   const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Set<number>>(() => {
      if (typeof window === "undefined" || !id) return new Set<number>();
      try {
         const saved = localStorage.getItem(`mock_bookmarks_${id}`);
         return saved ? new Set<number>(JSON.parse(saved)) : new Set<number>();
      } catch {
         return new Set<number>();
      }
   });
   const [eliminatedOptions, setEliminatedOptions] = useState<Record<number, string[]>>({});
   const [leftPanelWidth, setLeftPanelWidth] = useState(38);
   const [isResizing, setIsResizing] = useState(false);
   const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));
   const [cleanImageBg, setCleanImageBg] = useState(true);

   const [highlightsByQuestion, setHighlightsByQuestion] = useState<Record<string, Array<{ id: string; text: string; color: string; isUnderline?: boolean; note?: string }>>>(() => {
      if (typeof window === "undefined" || !id) return {};
      try {
         const saved = localStorage.getItem(`mock_highlights_${id}`);
         return saved ? JSON.parse(saved) : {};
      } catch {
         return {};
      }
   });

   useEffect(() => {
      if (id) {
         try {
            localStorage.setItem(`mock_highlights_${id}`, JSON.stringify(highlightsByQuestion));
         } catch (e) {
            console.error(e);
         }
      }
   }, [highlightsByQuestion, id]);

   useEffect(() => {
      if (id) {
         try {
            localStorage.setItem(`mock_bookmarks_${id}`, JSON.stringify([...bookmarkedQuestions]));
         } catch (e) {
            console.error(e);
         }
      }
   }, [bookmarkedQuestions, id]);

   const [selectionMenu, setSelectionMenu] = useState<{ x: number; y: number; selectedText: string } | null>(null);
   const [activeNoteInput, setActiveNoteInput] = useState<{ selectedText: string; color: string; isUnderline?: boolean } | null>(null);
   const [noteText, setNoteText] = useState("");

   const addHighlight = (qId: string | number, text: string, color: string, isUnderline = false, note = "") => {
      if (!text || !text.trim()) return;
      const key = String(qId);
      setHighlightsByQuestion((prev) => {
         const currentList = prev[key] || [];
         const filtered = currentList.filter((item) => item.text !== text.trim());
         return {
            ...prev,
            [key]: [
               ...filtered,
               { id: String(Date.now()), text: text.trim(), color, isUnderline, note },
            ],
         };
      });
      setSelectionMenu(null);
   };

   const removeHighlight = (qId: string | number, text: string) => {
      const key = String(qId);
      setHighlightsByQuestion((prev) => {
         const currentList = prev[key] || [];
         return {
            ...prev,
            [key]: currentList.filter((item) => item.text !== text),
         };
      });
      setSelectionMenu(null);
   };

   const renderHighlightedContent = (text: string, qId: string | number, type: string) => {
      const list = highlightsByQuestion[String(qId)] || [];
      const normalized = normalizeMath(text, type);

      if (!list.length) {
         return (
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={{ p: "span" }}>
               {normalized}
            </ReactMarkdown>
         );
      }

      const validHighlights = list.filter((h) => h.text && h.text.trim().length > 0);
      if (!validHighlights.length) {
         return (
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={{ p: "span" }}>
               {normalized}
            </ReactMarkdown>
         );
      }

      let processedText = normalized;
      const sortedHighlights = [...validHighlights].sort((a, b) => b.text.length - a.text.length);

      sortedHighlights.forEach(h => {
         const pattern = h.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
         const regex = new RegExp(`(${pattern})`, "gi");
         
         const segments = processedText.split(/(\[[^\]]+\]\(#hl:[^)]+\))/g);
         
         processedText = segments.map(seg => {
            if (seg.startsWith("[") && seg.includes("](#hl:")) {
               return seg;
            }
            
            const notePart = h.note ? `:note=${encodeURIComponent(h.note)}` : "";
            const underlinePart = h.isUnderline ? ":underline" : "";
            const hlColor = h.color || "yellow";
            
            return seg.replace(regex, (match) => {
               const textPart = `:text=${encodeURIComponent(match)}`;
               return `[${match}](#hl:${hlColor}${underlinePart}${notePart}${textPart})`;
            });
         }).join("");
      });

      return (
         <span className="leading-relaxed">
            <ReactMarkdown 
               remarkPlugins={[remarkGfm, remarkMath]} 
               rehypePlugins={[rehypeKatex]}
               components={{
                  a: ({ href, children }) => {
                     if (href?.startsWith("#hl:")) {
                        const isUnderline = href.includes(":underline");
                        
                        const noteMatch = href.match(/:note=([^:]+)/);
                        const note = noteMatch ? decodeURIComponent(noteMatch[1]) : "";
                        
                        const textMatch = href.match(/:text=(.*)$/);
                        const originalText = textMatch ? decodeURIComponent(textMatch[1]) : "";

                        const colorMatch = href.match(/^#hl:([^:]+)/);
                        const color = colorMatch ? colorMatch[1] : "yellow";

                        const handleHighlightClick = (e: React.MouseEvent) => {
                           e.stopPropagation();
                           const rect = (e.target as HTMLElement).getBoundingClientRect();
                           setSelectionMenu({
                              x: Math.max(20, rect.left + rect.width / 2),
                              y: Math.max(10, rect.top - 55),
                              selectedText: originalText,
                           });
                        };

                        if (isUnderline) {
                           return (
                              <u
                                 className="decoration-emerald-500 underline-offset-4 decoration-2 font-semibold cursor-pointer"
                                 title={note || undefined}
                                 onClick={handleHighlightClick}
                              >
                                 {children}
                                 {note && " 📝"}
                              </u>
                           );
                        }

                        const bgStyle =
                           color === "yellow"
                              ? "bg-yellow-200 dark:bg-yellow-500/40 text-slate-900 dark:text-yellow-100 border-b-2 border-yellow-400"
                              : color === "blue"
                              ? "bg-sky-200 dark:bg-sky-500/40 text-slate-900 dark:text-sky-100 border-b-2 border-sky-400"
                              : "bg-pink-200 dark:bg-pink-500/40 text-slate-900 dark:text-pink-100 border-b-2 border-pink-400";

                        return (
                           <mark
                              className={`${bgStyle} font-medium cursor-pointer transition-all hover:brightness-95 rounded-sm px-0.5`}
                              title={note || undefined}
                              onClick={handleHighlightClick}
                           >
                              {children}
                              {note && " 📝"}
                           </mark>
                        );
                     }
                     return <a href={href}>{children}</a>;
                  },
                  p: "span"
               }}
            >
               {processedText}
            </ReactMarkdown>
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

   const toggleDarkMode = () => {
      const next = !isDark;
      setIsDark(next);
      if (next) {
         document.documentElement.classList.add("dark");
         localStorage.setItem("theme", "dark");
      } else {
         document.documentElement.classList.remove("dark");
         localStorage.setItem("theme", "light");
      }
   };

   const handleMouseDownResizer = (e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);
   };

   useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
         if (!isResizing) return;
         const pct = Math.max(20, Math.min(60, (e.clientX / window.innerWidth) * 100));
         setLeftPanelWidth(pct);
      };

      const handleMouseUp = () => {
         if (isResizing) setIsResizing(false);
      };

      if (isResizing) {
         window.addEventListener("mousemove", handleMouseMove);
         window.addEventListener("mouseup", handleMouseUp);
      }
      return () => {
         window.removeEventListener("mousemove", handleMouseMove);
         window.removeEventListener("mouseup", handleMouseUp);
      };
   }, [isResizing]);

   const toggleBookmark = (qNum: number) => {
      setBookmarkedQuestions(prev => {
         const next = new Set(prev);
         if (next.has(qNum)) next.delete(qNum);
         else next.add(qNum);
         return next;
      });
   };

   const toggleEliminateOption = (e: React.MouseEvent, qNum: number, char: string) => {
      e.stopPropagation();
      setEliminatedOptions(prev => {
         const currentList = prev[qNum] || [];
         const exists = currentList.includes(char);
         const nextList = exists ? currentList.filter(c => c !== char) : [...currentList, char];
         if (!exists && answers[qNum] === char) {
            setAnswers(ans => {
               const copy = { ...ans };
               delete copy[qNum];
               return copy;
            });
         }
         return {
            ...prev,
            [qNum]: nextList
         };
      });
   };
   const sessionRef = useRef<HTMLDivElement>(null);
   const mfARef = useRef<any>(null);
   const mfBRef = useRef<any>(null);
   const handleSubmitRef = useRef<() => void>(() => {});

   // ── FULLSCREEN ──
   useEffect(() => {
      if (!loading && sessionRef.current && !document.fullscreenElement && (navigator as any).userActivation?.isActive) {
         sessionRef.current.requestFullscreen?.().catch(() => {});
      }
   }, [loading]);

   useEffect(() => {
      const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
      document.addEventListener("fullscreenchange", handleFsChange);
      return () => document.removeEventListener("fullscreenchange", handleFsChange);
   }, []);

   const exitFullscreen = useCallback(() => {
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
   }, []);

   useEffect(() => {
      return () => exitFullscreen();
   }, [exitFullscreen]);

   // ── SECURITY: block keyboard, copy, paste, right-click, tab switch ──
   useEffect(() => {
      if (loading) return;
      const blockKey = (e: KeyboardEvent) => {
         if (e.key === "F12" || (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key.toUpperCase()))) {
            e.preventDefault(); e.stopPropagation();
         }
         if (e.ctrlKey && ["c", "v", "x", "a", "u"].includes(e.key.toLowerCase())) {
            e.preventDefault(); e.stopPropagation();
         }
      };
      const blockCtx = (e: Event) => { e.preventDefault(); };
      const blockCopy = (e: ClipboardEvent) => { e.preventDefault(); };
      const blockPaste = (e: ClipboardEvent) => { e.preventDefault(); };

      document.addEventListener("keydown", blockKey, true);
      document.addEventListener("contextmenu", blockCtx, true);
      document.addEventListener("copy", blockCopy, true);
      document.addEventListener("paste", blockPaste, true);
      document.addEventListener("cut", blockCopy, true);
      return () => {
         document.removeEventListener("keydown", blockKey, true);
         document.removeEventListener("contextmenu", blockCtx, true);
         document.removeEventListener("copy", blockCopy, true);
         document.removeEventListener("paste", blockPaste, true);
         document.removeEventListener("cut", blockCopy, true);
      };
   }, [loading]);

   // ── Tab switch 10s countdown logic ──
   const [tabAwaySeconds, setTabAwaySeconds] = useState(10);
   const [isTabAway, setIsTabAway] = useState(false);

   useEffect(() => {
      if (loading || !test?.enable_warnings) return;

      const handleVisibility = () => {
         if (document.hidden) {
            setIsTabAway(true);
         }
      };

      document.addEventListener("visibilitychange", handleVisibility);

      return () => {
         document.removeEventListener("visibilitychange", handleVisibility);
      };
   }, [loading, test?.enable_warnings]);

   useEffect(() => {
      if (!isTabAway) {
         setTabAwaySeconds(10);
         return;
      }

      const timer = setInterval(() => {
         setTabAwaySeconds((prev) => {
            if (prev <= 1) {
               clearInterval(timer);
               setTimeout(() => handleSubmitRef.current(), 100);
               return 0;
            }
            return prev - 1;
         });
      }, 1000);

      return () => clearInterval(timer);
   }, [isTabAway]);

   const handleResumeTest = () => {
      setIsTabAway(false);
      setTabAwaySeconds(10);
      toast({
         title: "Test davom etmoqda",
         description: "Davom etish tugmasi bosildi. Savollarga javob berishingiz mumkin.",
      });
   };

   useEffect(() => {
      const fetchData = async () => {
         if (!id) return;
         const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
         let testData: any = null;

         if (isUuid) {
            const { data } = await supabase.from("mock_tests" as any).select("*").eq("id", id).maybeSingle();
            testData = data;
         }
         if (!testData) {
            const { data: bySlug } = await supabase.from("mock_tests" as any).select("*").eq("slug", id).maybeSingle();
            testData = bySlug;
         }
         if (!testData) {
            const normalizedTitle = id.replace(/-/g, ' ');
            const { data: byTitle } = await supabase.from("mock_tests" as any).select("*").ilike("title", normalizedTitle).maybeSingle();
            testData = byTitle;
         }
         if (!testData) {
            const { data: fallback } = await supabase.from("mock_tests" as any).select("*").eq("id", id).maybeSingle();
            testData = fallback;
         }
         if (!testData) {
            const { data: allMockTests } = await supabase.from("mock_tests" as any).select("*").limit(100);
            if (allMockTests && allMockTests.length > 0) {
               testData = (allMockTests as any[]).find((t) => {
                  const generated = buildMockTestSlug(t);
                  const simpleTitleSlug = t.title ? slugify(t.title) : "";
                  return generated === id || simpleTitleSlug === id || t.slug === id;
               }) || null;
               if (testData && !testData.slug) {
                  (supabase.from("mock_tests" as any) as any).update({ slug: id } as any).eq("id", testData.id).then();
               }
            }
         }

         if (!testData) {
            setLoading(false);
            return;
         }

         const actualTestId = testData.id;
         const targetSlug = testData.slug || buildMockTestSlug(testData) || actualTestId;
         const isUserAdmin = isAdmin || (profile as any)?.role === 'admin' || user?.email === 'xudayberganovbackend@gmail.com';
         const testPrice = (testData as any)?.price_educoin || 0;

         // Time Window & Attempts Check
         const now = Date.now();
         if (testData.available_from && now < new Date(testData.available_from).getTime() && !isUserAdmin) {
            toast({
               title: "Test hali boshlanmagan",
               description: `Ushbu test ${new Date(testData.available_from).toLocaleString('uz-UZ')} da boshlanadi.`,
               variant: "destructive",
            });
            navigate(`/mock-tests/${targetSlug}/info`, { replace: true });
            return;
         }

         if (testData.available_until && now > new Date(testData.available_until).getTime() && !isUserAdmin) {
            toast({
               title: "Test topshirish vaqti tugagan",
               description: `Ushbu testni topshirish vaqti ${new Date(testData.available_until).toLocaleString('uz-UZ')} da tugagan.`,
               variant: "destructive",
            });
            navigate(`/mock-tests/${targetSlug}/info`, { replace: true });
            return;
         }

         if (testData.max_attempts && testData.max_attempts > 0 && !isUserAdmin && user?.id) {
            const { count } = await supabase
               .from("mock_test_submissions" as any)
               .select("id", { count: "exact", head: true })
               .eq("test_id", actualTestId)
               .eq("user_id", user.id);

            if (count && count >= testData.max_attempts) {
               toast({
                  title: "Urinishlar tugagan",
                  description: `Siz ajratilgan maksimal ${testData.max_attempts} ta urinishdan foydalanib bo'ldingiz!`,
                  variant: "destructive",
               });
               navigate(`/mock-tests/${targetSlug}/info`, { replace: true });
               return;
            }
         }

         if (!testData.is_free && testPrice > 0 && !isUserAdmin && user?.id) {
            const { data: subData } = await supabase
               .from("mock_test_submissions" as any)
               .select("id")
               .eq("user_id", user.id)
               .eq("test_id", actualTestId)
               .limit(1);

            let isPurchased = subData && subData.length > 0;

            if (!isPurchased) {
               const { data: txData } = await supabase
                  .from("wallet_transactions" as any)
                  .select("id")
                  .eq("user_id", user.id)
                  .eq("reference_id", actualTestId)
                  .limit(1);
               isPurchased = txData && txData.length > 0;
            }

            if (!isPurchased) {
               toast({
                  title: "Test sotib olinmagan",
                  description: "Ushbu testni boshlash uchun uni avval sotib olishingiz kerak.",
                  variant: "destructive",
               });
               navigate(`/mock-tests/${targetSlug}/info`, { replace: true });
               return;
            }
         }

         const { data: qData } = await supabase
            .from("mock_test_questions" as any)
            .select("*")
            .eq("test_id", actualTestId)
            .order("question_number", { ascending: true });

         if (testData && qData) {
            let unflattened: any[] = [];
            let currentPassageGroup: any = null;
            
            qData.forEach((q: any) => {
               if (q.metadata?.passage_id) {
                  if (!currentPassageGroup || currentPassageGroup.id !== q.metadata.passage_id) {
                     currentPassageGroup = {
                        id: q.metadata.passage_id,
                        type: "reading_passage",
                        question_text: q.metadata.passage_text || "",
                        question_number: unflattened.length + 1,
                        sub_questions: [],
                     };
                     unflattened.push(currentPassageGroup);
                  }
                  currentPassageGroup.sub_questions.push(q);
               } else {
                  currentPassageGroup = null;
                  unflattened.push(q);
               }
            });

            setTest(testData);
            setQuestions(unflattened);
            const savedExpiry = localStorage.getItem(`mock_expiry_${actualTestId}`);
            const durationSeconds = ((testData as any).duration_minutes || 60) * 60;
            if (savedExpiry) {
               const remaining = Math.floor((parseInt(savedExpiry) - Date.now()) / 1000);
               if (remaining > 5) {
                  setTimeLeft(remaining);
               } else {
                  const expiry = Date.now() + durationSeconds * 1000;
                  localStorage.setItem(`mock_expiry_${actualTestId}`, expiry.toString());
                  setTimeLeft(durationSeconds);
               }
            } else {
               const expiry = Date.now() + durationSeconds * 1000;
               localStorage.setItem(`mock_expiry_${actualTestId}`, expiry.toString());
               setTimeLeft(durationSeconds);
            }
         }
         setLoading(false);
      };
      fetchData();
   }, [id, user?.id]);

   useEffect(() => {
      if (loading || showPauseModal) return;

      if (timeLeft > 0) {
         const timer = setInterval(() => setTimeLeft(p => p - 1), 1000);
         return () => clearInterval(timer);
      } else if (timeLeft === 0 && questions.length > 0 && !showPauseModal) {
         handleSubmit();
       }
   }, [timeLeft, loading, showPauseModal, questions.length]);

   useEffect(() => {
      if (questions.length > 0) {
         const qParam = searchParams.get("q");
         const parsed = qParam ? parseInt(qParam, 10) : NaN;
         if (!isNaN(parsed) && parsed >= 1 && parsed <= questions.length) {
            const targetIdx = parsed - 1;
            if (currentIdx !== targetIdx) {
               setCurrentIdx(targetIdx);
            }
         } else {
            setSearchParams({ q: (currentIdx + 1).toString() }, { replace: true });
         }
      }
   }, [questions.length, searchParams]);

   useEffect(() => {
      if (id) {
         localStorage.setItem(`mock_answers_${id}`, JSON.stringify(answers));
      }
   }, [answers, id]);

   const handleAnswerChange = (qNum: number, value: any) =>
      setAnswers(prev => ({ ...prev, [qNum]: value }));

   const handleSubmit = async () => {
      if (!user) return;
      setLoading(true);
      let totalScore = 0, maxPossibleScore = 0, correctCount = 0;

      let flattenedQuestions: any[] = [];
      questions.forEach(q => {
         if (q.type === 'reading_passage' && q.sub_questions) {
            flattenedQuestions = [...flattenedQuestions, ...q.sub_questions];
         } else if (q.type !== 'reading_passage') {
            flattenedQuestions.push(q);
         }
      });

      let currentAnswers = { ...answers };

      for (const q of flattenedQuestions) {
         if (q.type === "essay") {
            const userAns = currentAnswers[q.question_number];
            const ansText = typeof userAns === "object" && userAns ? (userAns.text || "") : String(userAns || "");
            
            if (ansText && ansText.trim().length > 10) {
               try {
                  const available = q.points_a || 10;
                  const rubricItems = [
                     { id: "T1", cat: "Topshiriq", criteria: "Publisistik uslub va mavzuni to'liq yoritish", max: Math.round(available * 2 / 24) },
                     { id: "T2", cat: "Topshiriq", criteria: "Shaxsiy fikr va qarashlar", max: Math.round(available * 2 / 24) },
                     { id: "T3", cat: "Topshiriq", criteria: "Dalillar bilan asoslanganlik", max: Math.round(available * 2 / 24) },
                     { id: "M4", cat: "Matn", criteria: "Kompozitsiya (kirish, asosiy, xulosa)", max: Math.round(available * 2 / 24) },
                     { id: "M5", cat: "Matn", criteria: "Mantiqiy qurilish", max: Math.round(available * 2 / 24) },
                     { id: "M6", cat: "Matn", criteria: "Mantiqiy-mazmuniy izchillik", max: Math.round(available * 2 / 24) },
                     { id: "S7", cat: "Savodxonlik", criteria: "Imlo xatolari", max: Math.round(available * 2 / 24) },
                     { id: "S8", cat: "Savodxonlik", criteria: "Punktuatsiya", max: Math.round(available * 2 / 24) },
                     { id: "U9", cat: "Uslub", criteria: "Grammatik xatolar", max: Math.round(available * 2 / 24) },
                     { id: "U10", cat: "Uslub", criteria: "So'z qo'llash aniqligi", max: Math.round(available * 2 / 24) },
                     { id: "L11", cat: "Lug'at", criteria: "Nutq boyligi", max: Math.round(available * 2 / 24) },
                     { id: "L12", cat: "Lug'at", criteria: "Nutq sofliqi", max: Math.round(available * 2 / 24) },
                  ];
                  const rubricText = rubricItems.map(r => `- ${r.id} (${r.cat}): ${r.criteria} [0-${r.max}]`).join('\n');
                  const prompt = `Siz O'zbekiston Milliy Test tizimi bo'yicha insho baholovchi ekspertisiz. O'quvchining inshosini quyidagi mezonlar asosida baholang.

Savol/Mavzu: ${q.question_text || "Insho yozing"}
Umumiy ball: ${available}

Mezonlar:
${rubricText}

O'quvchi inshosi:
${ansText}

Quyidagi JSON formatda javob bering:
{"total_score":number,"breakdown":[{"id":"T1","score":number,"comment":"izoh"},{"id":"T2",...},...],"general_feedback":"umumiy xulosa"}`;

                  const res = await fetch('/api/ai/chat', {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({
                        model: 'mistral-large-latest',
                        messages: [
                           { role: "system", content: "Siz O'zbekiston Milliy Test tizimi bo'yicha insho baholovchi ekspertisiz. Faqat JSON formatda javob bering." },
                           { role: "user", content: prompt }
                        ]
                     })
                  });
                  if (res.ok) {
                     const data = await res.json();
                     const content = data?.choices?.[0]?.message?.content || '{"total_score":0}';
                     const jsonStart = content.indexOf('{');
                     const jsonEnd = content.lastIndexOf('}');
                     let aiScore = 0;
                     let aiBreakdown: any[] = [];
                     let aiFeedback = '';
                     if (jsonStart !== -1 && jsonEnd !== -1) {
                        try {
                           const parsed = JSON.parse(content.substring(jsonStart, jsonEnd + 1));
                           aiScore = Math.min(parseFloat(parsed.total_score) || 0, available);
                           aiBreakdown = parsed.breakdown || [];
                           aiFeedback = parsed.general_feedback || '';
                        } catch {
                           const match = content.match(/(\d+(\.\d+)?)/); 
                           aiScore = match ? Math.min(parseFloat(match[0]), available) : 0;
                        }
                     }
                     currentAnswers[q.question_number] = { text: ansText, ai_score: aiScore, ai_breakdown: aiBreakdown, ai_feedback: aiFeedback };
                  }
               } catch (err) {
                  console.error("AI grading failed", err);
                  currentAnswers[q.question_number] = { text: ansText, ai_score: 0, ai_breakdown: [], ai_feedback: '' };
               }
            } else if (ansText) {
               currentAnswers[q.question_number] = { text: ansText, ai_score: 0, ai_breakdown: [], ai_feedback: '' };
            }
         }
      }

      flattenedQuestions.forEach(q => {
         const userAns = currentAnswers[q.question_number];
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
            const corrAns = parseWrittenAnswer(q.correct_answer);
            const uAns = parseWrittenAnswer(userAns);
            let correctParts = 0;

            const hasPartA = Boolean(corrAns.a) || Boolean(uAns.a);
            const hasPartB = Boolean(corrAns.b) || Boolean(uAns.b) || (q.question_text && String(q.question_text).includes("b)"));
            const totalParts = (hasPartA && hasPartB) ? 2 : 1;

            const isACorrect = hasPartA && (isMathAnswerCorrect(uAns.a, corrAns.a) || isAnswerCorrect(uAns.a, corrAns.a));
            const isBCorrect = hasPartB && (isMathAnswerCorrect(uAns.b, corrAns.b) || isAnswerCorrect(uAns.b, corrAns.b));

            if (hasPartA && isACorrect) correctParts++;
            if (hasPartB && isBCorrect) correctParts++;

            const writtenFraction = totalParts > 0 ? correctParts / totalParts : 0;
            earned = available * writtenFraction;
            if (correctParts === totalParts && totalParts > 0) {
               correctCount++;
            } else if (correctParts > 0) {
               correctCount += writtenFraction;
            }
         } else if (q.type === "essay") {
            const uAnsObj = typeof userAns === "object" && userAns ? userAns : { text: String(userAns || ""), ai_score: 0 };
            if (uAnsObj.text && uAnsObj.text.trim().length > 5) {
               earned = uAnsObj.ai_score || 0;
               if (earned > 0) correctCount += (earned / available);
            }
            currentAnswers[q.question_number] = uAnsObj;
         } else {
            if (isAnswerCorrect(userAns, q.correct_answer)) {
               earned = available;
               correctCount++;
            }
         }

         totalScore += Math.round(earned * 100) / 100;
         maxPossibleScore += available;
      });

      const scorePercentage = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;

      try {
         const targetTestId = test?.id || id;
         
         // 1. Try Backend Proxy Submission (/api/mock-tests/submit) - Solves JWT expiration on 150-minute tests!
         let submittedSuccessfully = false;
         try {
            const apiRes = await fetch("/api/mock-tests/submit", {
               method: "POST",
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify({
                  test_id: targetTestId,
                  user_id: user.id,
                  score: scorePercentage,
                  answers: currentAnswers,
                  total_questions: flattenedQuestions.length,
                  correct_answers: correctCount,
               }),
               credentials: "include",
            });

            if (apiRes.ok) {
               const json = await apiRes.json();
               if (json.success) {
                  submittedSuccessfully = true;
               }
            }
         } catch (apiErr) {
            console.warn("Backend submit API failed or skipped, trying client Supabase...", apiErr);
         }

         // 2. Fallback to Client Supabase insert if Backend Proxy didn't respond
         if (!submittedSuccessfully) {
            const payload: any = {
               user_id: user.id,
               test_id: targetTestId,
               score: scorePercentage,
               answers: currentAnswers,
               total_questions: flattenedQuestions.length,
               correct_answers: correctCount,
               raw_results: {
                  total_questions: questions.length,
                  correct_answers: correctCount
               }
            };

            let { error } = await supabase.from("mock_test_submissions" as any).insert(payload);

            if (error) {
               console.warn("Insert failed, attempting fallback insert without optional columns:", error.message);
               const fallbackPayload = {
                  user_id: user.id,
                  test_id: targetTestId,
                  score: scorePercentage,
                  answers: currentAnswers,
                  raw_results: {
                     total_questions: questions.length,
                     correct_answers: correctCount
                  }
               };
               const fallbackRes = await (supabase.from("mock_test_submissions" as any) as any).insert(fallbackPayload as any);
               error = fallbackRes.error;
            }

            if (error) throw error;
         }

         localStorage.removeItem(`mock_answers_${id}`);
         localStorage.removeItem(`mock_expiry_${id}`);
         toast({ title: "Test yakunlandi!", description: `Natijangiz: ${totalScore} ball` });
         navigate("/results/mock");
      } catch (err: any) {
         toast({ title: "Xatolik", description: err.message || "Testni topshirishda xatolik yuz berdi", variant: "destructive" });
      } finally {
         setLoading(false);
      }
   };
    handleSubmitRef.current = handleSubmit;

   if (loading) return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-slate-950">
         <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-[#E8192C] rounded-full animate-spin" />
            <p className="text-[12px] text-slate-400">Yuklanmoqda...</p>
         </div>
      </div>
   );

    const currentQ = questions[currentIdx];
    if (!currentQ) {
       if (!loading && questions.length === 0) {
          return (
             <div className="h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-950 p-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center mb-4">
                   <AlertCircle className="w-8 h-8 text-amber-500" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Savollar topilmadi</h2>
                <p className="text-xs text-slate-500 max-w-sm mb-6">Ushbu mock test uchun savollar hali bazaga kiritilmagan bo'lishi mumkin.</p>
                <button
                   onClick={() => navigate("/tests")}
                   className="px-6 py-2.5 bg-[#E8192C] text-white font-bold text-xs rounded-xl hover:bg-[#C41420] transition-colors shadow-xs"
                >
                   Testlarga qaytish
                </button>
             </div>
          );
       }
       return (
          <div className="h-screen flex items-center justify-center bg-white dark:bg-slate-950">
             <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-slate-200 border-t-[#E8192C] rounded-full animate-spin" />
                <p className="text-[12px] text-slate-400">Savollar yuklanmoqda...</p>
             </div>
          </div>
       );
    }
    const isMc = currentQ.type === "multiple_choice";

   const formatTime = (s: number) => {
      const h = Math.floor(s / 3600);
      const m = Math.floor((s % 3600) / 60);
      const sec = s % 60;
      return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
   };
   const answeredCount = Object.keys(answers).length;

   // Build flat item list for Savollar Xaritasi - expands passage sub-questions
   const questionMapItems = (() => {
      const items: { label: number; qNum: number; navIdx: number }[] = [];
      let displayNum = 1;
      questions.forEach((q, idx) => {
         if (q.type === 'reading_passage' && q.sub_questions?.length) {
            q.sub_questions.forEach((sq: any) => {
               items.push({ label: displayNum++, qNum: sq.question_number, navIdx: idx });
            });
         } else {
            items.push({ label: displayNum++, qNum: q.question_number, navIdx: idx });
         }
      });
      return items;
   })();
   const totalAnswerableCount = questionMapItems.length;
   const totalAnsweredCount = questionMapItems.filter(item => !!answers[item.qNum]).length;


   return (
      <div ref={sessionRef} className="fixed inset-0 z-[100] flex flex-col bg-white dark:bg-slate-950 font-sans">
         <SEO title={`${test?.title || "Mock Test"} | EduContest`} description="Test ishlash" />

         {/* ── HEADER ── */}
         <header className="h-16 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 flex items-center justify-between shrink-0 z-50">
            {/* Left */}
            <div className="flex items-center gap-2 min-w-0">
               <div className="min-w-0">
                  <h1 className="text-[13px] sm:text-[14px] font-bold text-slate-900 dark:text-white flex items-center gap-2 truncate">
                     <span className="hidden sm:inline">1-Bo'lim: {test?.title || "Milliy Sertifikat Matematika Mock Test 2#"}</span>
                     <span className="sm:hidden text-[13px]">1-Bo'lim</span>
                  </h1>
                  <button
                     onClick={() => setShowInstructions(!showInstructions)}
                     className="text-[11px] sm:text-[12px] font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hidden sm:flex items-center gap-1 mt-0.5"
                  >
                     <span>Yo'riqnoma</span>
                     {showInstructions ? <AltArrowUpIcon size={16} /> : <AltArrowDownIcon size={16} />}
                  </button>
               </div>
            </div>

            {/* Center — Compact Dynamic Digital Timer Clock Badge */}
            <div className="flex flex-col items-center select-none shrink-0">
               <div className={`relative flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 rounded-xl transition-all ${
                  timeLeft < 600
                     ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 animate-pulse"
                     : "bg-slate-100/90 dark:bg-slate-900 text-slate-900 dark:text-white"
               }`}>
                  {/* Live Pulsing Status Dot (Hidden on small mobile) */}
                  <span className="hidden sm:flex relative h-1.5 w-1.5">
                     <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        timeLeft < 600 ? "bg-rose-500" : "bg-emerald-500 dark:bg-emerald-400"
                     }`} />
                     <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                        timeLeft < 600 ? "bg-rose-600" : "bg-emerald-600 dark:bg-emerald-500"
                     }`} />
                  </span>

                  {/* Clock Icon (Hidden on small mobile) */}
                  <ClockCircleIcon size={16} className="hidden sm:block text-sky-600 dark:text-sky-400 shrink-0" />

                  {/* Formatted Digit Blocks */}
                  {showTimer ? (
                     <div className="flex items-center gap-0.5 font-mono font-bold text-[12px] sm:text-[13.5px] tracking-wider text-slate-900 dark:text-white tabular-nums">
                        <span className="bg-white dark:bg-slate-800 px-1 py-0.2 rounded text-slate-900 dark:text-slate-100">
                           {formatTime(timeLeft).split(':')[0] || '00'}
                        </span>
                        <span className="text-sky-600 dark:text-sky-400 font-black animate-pulse flex items-center justify-center self-center text-[12px] sm:text-[13px] leading-none px-0.5">
                           :
                        </span>
                        <span className="bg-white dark:bg-slate-800 px-1 py-0.2 rounded text-slate-900 dark:text-slate-100">
                           {formatTime(timeLeft).split(':')[1] || '00'}
                        </span>
                        <span className="text-sky-600 dark:text-sky-400 font-black animate-pulse flex items-center justify-center self-center text-[12px] sm:text-[13px] leading-none px-0.5">
                           :
                        </span>
                        <span className="bg-white dark:bg-slate-800 px-1 py-0.2 rounded text-sky-600 dark:text-sky-300">
                           {formatTime(timeLeft).split(':')[2] || '00'}
                        </span>
                     </div>
                  ) : (
                     <span className="font-mono font-bold text-[12px] tracking-widest text-slate-400 dark:text-slate-500 px-1">
                        ••:••:••
                     </span>
                  )}

                  {/* Hide / Show Eye Toggle Button */}
                  <button
                     onClick={() => setShowTimer(!showTimer)}
                     className="ml-0.5 p-0.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                     title={showTimer ? "Vaqtni yashirish" : "Vaqtni ko'rsatish"}
                  >
                     {showTimer ? <EyeClosedIcon size={16} /> : <EyeIcon size={16} />}
                  </button>
               </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-2 sm:gap-3">
               {/* Dark/Light Mode Toggle */}
               <button
                  onClick={toggleDarkMode}
                  className="p-1.5 sm:p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
                  title={isDark ? "Light Mode" : "Dark Mode"}
               >
                  {isDark ? <SunIcon size={18} className="text-amber-400" /> : <MoonIcon size={18} className="text-slate-600 dark:text-slate-300" />}
               </button>

               <button
                  onClick={() => setShowWhiteboard(true)}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-200 dark:border-purple-500/20 bg-purple-50/80 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-500/20 transition-all font-semibold text-[12px]"
                  title="Qoralama taxtasi (Whiteboard)"
               >
                  <Pen2Icon size={16} className="text-purple-600 dark:text-purple-400 shrink-0" />
                  <span>Qoralama</span>
               </button>
               {/* Batafsil menu matching Screenshot */}
               <div className="relative">
                  <button
                     onClick={() => setShowBatafsilMenu(!showBatafsilMenu)}
                     className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-2xs"
                  >
                     <MenuDotsIcon size={16} className="shrink-0" />
                     <span className="hidden sm:inline">Batafsil</span>
                  </button>

                  <AnimatePresence>
                     {showBatafsilMenu && (
                        <>
                           <div className="fixed inset-0 z-40" onClick={() => setShowBatafsilMenu(false)} />
                           <motion.div
                              initial={{ opacity: 0, y: 8, scale: 0.96 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 8, scale: 0.96 }}
                              transition={{ duration: 0.15 }}
                              className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-2 shadow-2xl z-50 space-y-1"
                           >
                              <button
                                 onClick={() => {
                                    setShowInstructions(!showInstructions);
                                    setShowBatafsilMenu(false);
                                 }}
                                 className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-[13px] font-medium text-slate-700 dark:text-slate-200 transition-colors text-left group"
                              >
                                 <QuestionCircleIcon size={18} className="text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white shrink-0" />
                                 <span>Qoidalar va Yo'riqnoma</span>
                              </button>

                              <button
                                 onClick={() => {
                                    setShowPauseModal(true);
                                    setShowBatafsilMenu(false);
                                 }}
                                 className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-[13px] font-medium text-slate-700 dark:text-slate-200 transition-colors text-left group"
                              >
                                 <PauseCircleIcon size={18} className="text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white shrink-0" />
                                 <div className="leading-tight">
                                    <p>Imtihonni Vaqtincha</p>
                                    <p>To'xtatish</p>
                                 </div>
                              </button>
                           </motion.div>
                        </>
                     )}
                  </AnimatePresence>
               </div>
               <button
                  onClick={exitFullscreen}
                  className="hidden sm:flex px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors items-center gap-1"
               >
                  <span>100%</span>
                  <span className="material-symbols-outlined text-[17px] text-emerald-600 dark:text-emerald-400 leading-none">battery_full</span>
               </button>
            </div>
         </header>

         {/* Dashed line below header (Height 3px, wider dash width) */}
         <div className="w-full h-[3px] bg-[repeating-linear-gradient(90deg,#60a5fa_0_16px,transparent_16px_20px,#64748b_20px_36px,transparent_36px_40px,#f59e0b_40px_56px,transparent_56px_60px)] opacity-95 shrink-0 z-40" />

         {/* ── INLINE COLLAPSIBLE INSTRUCTIONS PANEL (Matching Screenshot) ── */}
         <AnimatePresence>
            {showInstructions && (
               <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="overflow-hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs shrink-0 z-30"
               >
                  <div className="w-full px-6 py-4 flex items-start justify-between">
                     <div className="space-y-2">
                        <h3 className="text-[14px] font-bold text-slate-900 dark:text-white">
                           Imtihon Yo'riqnomasi va Qoidalar
                        </h3>
                        <ul className="space-y-1.5 text-[12px] text-slate-600 dark:text-slate-300">
                           <li className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                              <span>Har bir savol uchun eng to'g'ri javobni tanlang. Javoblarni istalgan vaqt o'zgartirishingiz mumkin.</span>
                           </li>
                           <li className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                              <span>Keyinchalik qaytmoqchi bo'lgan savollarni <strong className="text-slate-900 dark:text-white font-semibold">Qayta ko'rib chiqish</strong> tugmasi orqali belgilang.</span>
                           </li>
                           <li className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                              <span>Noto'g'ri javob variantlarini <strong className="text-slate-900 dark:text-white font-semibold">[ABC] variantni o'chirish rejimi</strong> yordamida belgilab qo'yishingiz mumkin.</span>
                           </li>
                           <li className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                              <span>Imtihon davomida barcha kiritilgan javoblar real-vaqtda avtomatik saqlanadi.</span>
                           </li>
                        </ul>
                     </div>
                     <button
                        onClick={() => setShowInstructions(false)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all shrink-0"
                        title="Yopish"
                     >
                        <X className="w-4 h-4" />
                     </button>
                  </div>
               </motion.div>
            )}
         </AnimatePresence>

         {/* ── SUB-HEADER TOOLBAR ── */}
         <div className="h-12 bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between shrink-0">
            {/* Left */}
            <div className="flex items-center gap-3">
               <span className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[13px] font-bold flex items-center justify-center shadow-xs">
                  {currentQ.question_number}
               </span>
               <button
                  onClick={() => toggleBookmark(currentQ.question_number)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all border ${
                     bookmarkedQuestions.has(currentQ.question_number)
                        ? "bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30 text-amber-700 dark:text-amber-300"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                  }`}
               >
                  <BookmarkIcon size={16} className={bookmarkedQuestions.has(currentQ.question_number) ? "text-amber-500" : ""} />
                  <span>Qayta ko'rib chiqish</span>
               </button>
            </div>

            {/* Right */}
            <div className="flex items-center gap-2">
               <div className="px-3 py-1 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg text-[11px] font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                  <span>{currentQ.points_a || 10} ball</span>
               </div>
            </div>
         </div>

         {/* ── MAIN AREA ── */}
         <div className="flex-1 overflow-hidden flex flex-col">
            <main className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6 pb-28">
               <div className="w-full">
                  {currentQ.type === "reading_passage" ? (
                     <div className="flex flex-col lg:flex-row gap-6 items-stretch w-full min-h-[calc(100vh-220px)] relative">
                        {/* LEFT COLUMN: Passage Text */}
                        <div
                           style={{ 
                              width: typeof window !== "undefined" && window.innerWidth >= 1024 ? `${leftPanelWidth}%` : "100%",
                              maxHeight: 'calc(100vh - 220px)' 
                           }}
                           className="bg-slate-50/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs shrink-0 overflow-y-auto"
                        >
                           <h3 className="text-[14px] font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
                              <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                              <span>O'qish matni (Passage)</span>
                           </h3>
                           <div 
                              onMouseUp={handleQuestionTextMouseUp}
                              onTouchEnd={handleQuestionTextMouseUp}
                              className="prose prose-slate dark:prose-invert max-w-none text-[16px] leading-[1.8] text-slate-800 dark:text-slate-100 whitespace-pre-line select-text"
                           >
                              {renderHighlightedContent(currentQ.question_text, currentQ.question_number, currentQ.type)}
                           </div>
                        </div>

                        {/* RESIZABLE SURGICH HANDLE */}
                        <div
                           onMouseDown={handleMouseDownResizer}
                           className={`hidden lg:flex w-4 hover:w-5 mx-4 -mt-6 -mb-28 self-stretch cursor-col-resize items-center justify-center group z-10 transition-all select-none bg-slate-100/80 hover:bg-slate-200/80 dark:bg-slate-800/40 dark:hover:bg-slate-800/70 border-x border-slate-200/70 dark:border-slate-800 ${
                              isResizing ? "bg-slate-200 dark:bg-slate-700" : ""
                           }`}
                           title="Oynalar o'lchamini surib o'zgartirish (Surgich)"
                        >
                           <div className={`w-[2px] h-16 rounded-full transition-all ${
                              isResizing ? "bg-slate-700 dark:bg-slate-200 scale-y-110" : "bg-slate-400 dark:bg-slate-500 group-hover:bg-slate-600 dark:group-hover:bg-slate-300"
                           }`} />
                        </div>

                        {/* RIGHT COLUMN: Sub-Questions */}
                        <div
                           style={{ 
                              width: typeof window !== "undefined" && window.innerWidth >= 1024 ? `${100 - leftPanelWidth}%` : "100%",
                              maxHeight: 'calc(100vh - 220px)' 
                           }}
                           className="flex flex-col gap-6 overflow-y-auto pl-0 lg:pl-4 pr-2 pb-10"
                        >
                           {(currentQ.sub_questions || []).map((sq: any, sIdx: number) => {
                              const isMc = sq.type === "multiple_choice" || sq.type === "multiple_select" || sq.type === "true_false" || sq.type === "yes_no";
                              return (
                                 <div key={sIdx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
                                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                       <div className="flex items-center gap-3">
                                          <span className="w-7 h-7 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-[12px] flex items-center justify-center shrink-0 shadow-xs">
                                             {sq.question_number}
                                          </span>
                                          <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                                             Savol
                                          </span>
                                       </div>
                                       <span className="text-[12px] font-bold text-emerald-600 dark:text-emerald-400 px-2 py-1 bg-emerald-50 dark:bg-emerald-500/10 rounded-md">
                                          {sq.points_a || 10} ball
                                       </span>
                                    </div>
                                    
                                    <div className="prose prose-slate dark:prose-invert max-w-none text-[15px] leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-line">
                                       <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                          {normalizeMath(sq.question_text, sq.type)}
                                       </ReactMarkdown>
                                    </div>

                                    {/* Multiple choice rendering for sub-question */}
                                    {isMc && (
                                       <div className="grid grid-cols-1 gap-2.5 mt-4">
                                          {((sq.metadata?.options || []) as string[]).map((opt, i) => {
                                             const char = String.fromCharCode(65 + i);
                                             const isSelected = answers[sq.question_number] === char;
                                             return (
                                                <div
                                                   key={i}
                                                   onClick={() => handleAnswerChange(sq.question_number, char)}
                                                   className={`group relative flex items-center gap-3.5 p-3.5 sm:p-4 rounded-xl border text-left transition-all overflow-hidden cursor-pointer ${
                                                      isSelected
                                                         ? "border-slate-900 dark:border-white bg-slate-100/80 dark:bg-slate-800/60 shadow-2xs"
                                                         : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
                                                   }`}
                                                >
                                                   <div className={`w-8 h-8 rounded-lg border flex items-center justify-center text-[13px] font-semibold shrink-0 transition-all ${
                                                      isSelected
                                                         ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900"
                                                         : "border-slate-200 dark:border-slate-700 text-slate-500 bg-slate-50 dark:bg-slate-800/50"
                                                   }`}>
                                                      {char}
                                                   </div>
                                                   <div className={`flex-1 text-[14.5px] sm:text-[15px] ${isSelected ? "text-slate-900 dark:text-white font-medium" : "text-slate-700 dark:text-slate-300"}`}>
                                                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{normalizeMath(opt, sq.type)}</ReactMarkdown>
                                                   </div>
                                                </div>
                                             );
                                          })}
                                       </div>
                                    )}

                                    {/* Fill blanks rendering for sub-question */}
                                    {sq.type === "fill_blanks" && (
                                       <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                          <input
                                             type="text"
                                             value={answers[sq.question_number] || ""}
                                             onChange={(e) => handleAnswerChange(sq.question_number, e.target.value)}
                                             placeholder="Javobingizni kiriting..."
                                             className="w-full min-h-[52px] text-[15px] px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 dark:focus:border-slate-500 transition-all"
                                          />
                                       </div>
                                    )}
                                 </div>
                              );
                           })}
                        </div>
                     </div>
                  ) : currentQ.type === "essay" ? (
                     <div className="max-w-4xl mx-auto w-full space-y-6">
                        <div className="prose prose-slate dark:prose-invert max-w-none text-[18px] leading-[1.7] text-slate-800 dark:text-slate-100 mb-6 whitespace-pre-line">
                           <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                              {normalizeMath(currentQ.question_text, currentQ.type)}
                           </ReactMarkdown>
                        </div>
                        {currentQ.question_subtext && (
                           <div className="p-4 mb-6 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed prose dark:prose-invert max-w-none">
                              <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                 {normalizeMath(currentQ.question_subtext, currentQ.type)}
                              </ReactMarkdown>
                           </div>
                        )}
                        <div className="relative rounded-xl border border-slate-300 dark:border-slate-700 bg-yellow-50/50 dark:bg-slate-900/80 overflow-hidden shadow-inner">
                           <div className="absolute left-10 top-0 bottom-0 w-[2px] bg-red-400/50 dark:bg-red-500/30 z-0 pointer-events-none" />
                           <textarea
                              value={answers[currentQ.question_number] || ""}
                              onChange={(e) => handleAnswerChange(currentQ.question_number, e.target.value)}
                              placeholder="Inshoni shu yerga yozing..."
                              className="w-full min-h-[500px] resize-y pl-16 pr-6 pt-[8px] pb-6 text-[16px] sm:text-[17px] leading-[32px] text-slate-800 dark:text-slate-200 bg-transparent border-none outline-none font-serif relative z-10"
                              style={{
                                 backgroundImage: `repeating-linear-gradient(transparent, transparent 31px, rgba(148, 163, 184, 0.3) 31px, rgba(148, 163, 184, 0.3) 32px)`,
                                 backgroundAttachment: "local",
                                 fontFamily: "'Caveat', cursive",
                                 fontSize: "22px"
                              }}
                           />
                        </div>
                     </div>
                  ) : (currentQ.type === "fill_blanks" || currentQ.type === "written" || currentQ.type === "short_answer") ? (
                     <div className="flex flex-col lg:flex-row gap-4 lg:gap-0 items-stretch w-full min-h-[calc(100vh-220px)] relative">
                        
                        {/* LEFT COLUMN: Javob Kiritish va Baholash Qoidalari (Matching Image 2) */}
                        <div
                           style={{ width: typeof window !== "undefined" && window.innerWidth >= 1024 ? `${leftPanelWidth}%` : "100%" }}
                           className="bg-slate-50/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-4 shadow-xs shrink-0"
                        >
                           <h3 className="text-[14px] font-semibold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                              <BookOpen className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                              <span>Javob Kiritish va Baholash Qoidalari</span>
                           </h3>

                           <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-[12px] shadow-2xs">
                              <div className="grid grid-cols-2 divide-x divide-slate-200 dark:divide-slate-800 border-b border-slate-200 dark:border-slate-800">
                                 {/* Left Header */}
                                 <div className="p-3 bg-emerald-100/90 dark:bg-emerald-950/60 flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300">
                                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] shrink-0 font-bold shadow-xs">
                                       ✓
                                    </div>
                                    <span>To'g'ri qabul qilinadi</span>
                                 </div>
                  {/* Right Header */}
                                 <div className="p-3 bg-rose-100/90 dark:bg-rose-950/60 flex items-center gap-2 font-bold text-rose-800 dark:text-rose-300">
                                    <div className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[11px] shrink-0 font-bold shadow-xs">
                                       ✕
                                    </div>
                                    <span>Hisobga olinmaydi (Xato)</span>
                                 </div>
                              </div>

                              {((test?.subject === "Matematika" || test?.subject === "Fizika" || test?.subject === "Kimyo")) ? (
                                 <div className="grid grid-cols-2 divide-x divide-slate-200 dark:divide-slate-800 divide-y divide-slate-100 dark:divide-slate-900">
                                    {/* Row 1 */}
                                    <div className="p-3.5 space-y-1 bg-emerald-50/50 dark:bg-emerald-950/20">
                                       <p className="font-bold text-emerald-900 dark:text-emerald-200 text-[12px]">Oddiy va o'nlik kasrlar</p>
                                       <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                                          <code className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 rounded text-emerald-900 dark:text-emerald-100 font-mono text-[11px]">3.5</code> yoki <code className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 rounded text-emerald-900 dark:text-emerald-100 font-mono text-[11px]">7/2</code> ko'rinishida yozish mumkin (ikkala shakl ham bir xil to'g'ri baholanadi).
                                       </p>
                                    </div>
                                    <div className="p-3.5 space-y-1 bg-rose-50/50 dark:bg-rose-950/20">
                                       <p className="font-bold text-rose-900 dark:text-rose-300 text-[12px]">Probel (bo'sh joy) bilan yozilgan aralash kasr</p>
                                       <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                                          <code className="px-1.5 py-0.5 bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded text-rose-700 dark:text-rose-300 font-mono text-[11px]">3 1/2</code> deb yozmang! Tizim buni 31/2 (ya'ni 15.5) deb o'qib xato beradi.
                                       </p>
                                    </div>

                                    {/* Row 2 */}
                                    <div className="p-3.5 space-y-1 bg-emerald-50/50 dark:bg-emerald-950/20">
                                       <p className="font-bold text-emerald-900 dark:text-emerald-200 text-[12px]">O'lchov birliklari bilan</p>
                                       <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                                          Metr, kg, % kabi birliklarni birga yozish mumkin: <code className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 rounded text-emerald-900 dark:text-emerald-100 font-mono text-[11px]">25 m</code>, <code className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 rounded text-emerald-900 dark:text-emerald-100 font-mono text-[11px]">10 kg</code>, <code className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 rounded text-emerald-900 dark:text-emerald-100 font-mono text-[11px]">50%</code>, <code className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 rounded text-emerald-900 dark:text-emerald-100 font-mono text-[11px]">90°</code>.
                                       </p>
                                    </div>
                                    <div className="p-3.5 space-y-1 bg-rose-50/50 dark:bg-rose-950/20">
                                       <p className="font-bold text-rose-900 dark:text-rose-300 text-[12px]">Ortiqcha so'z va izohlar</p>
                                       <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                                          <code className="px-1.5 py-0.5 bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded text-rose-700 dark:text-rose-300 font-mono text-[11px]">javob 25</code> yoki <code className="px-1.5 py-0.5 bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded text-rose-700 dark:text-rose-300 font-mono text-[11px]">25 metr bo'ladi</code> deb so'zli izoh yozmang! Faqat son va birlik kiritiladi.
                                       </p>
                                    </div>

                                    {/* Row 3 */}
                                    <div className="p-3.5 space-y-1 bg-emerald-50/50 dark:bg-emerald-950/20">
                                       <p className="font-bold text-emerald-900 dark:text-emerald-200 text-[12px]">Manfiy va Butun sonlar</p>
                                       <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                                          Manfiy sonlar oldiga ishora qo'yiladi: <code className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 rounded text-emerald-900 dark:text-emerald-100 font-mono text-[11px]">-5</code>, <code className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 rounded text-emerald-900 dark:text-emerald-100 font-mono text-[11px]">-2.5</code>.
                                       </p>
                                    </div>
                                    <div className="p-3.5 space-y-1 bg-rose-50/50 dark:bg-rose-950/20">
                                       <p className="font-bold text-rose-900 dark:text-rose-300 text-[12px]">Bo'sh qoldirilgan kataklar</p>
                                       <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                                          Formula kiritilmagan bo'sh kataklarga ball berilmaydi.
                                       </p>
                                    </div>

                                    {/* Row 4 */}
                                    <div className="p-3.5 space-y-1 bg-emerald-50/50 dark:bg-emerald-950/20">
                                       <p className="font-bold text-emerald-900 dark:text-emerald-200 text-[12px]">Matematik Formulalar</p>
                                       <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                                          Darajali formulalarni klaviatura yoki ekrandagi formula tugmalaridan foydalanib yozing ( <code className="px-1 py-0.5 bg-white dark:bg-slate-800 rounded font-mono text-[11px]">x² + 5</code> ).
                                       </p>
                                    </div>
                                    <div className="p-3.5 space-y-1 bg-rose-50/50 dark:bg-rose-950/20">
                                       <p className="font-bold text-rose-900 dark:text-rose-300 text-[12px]">Bir nechta variantlar</p>
                                       <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                                          Agar savol bir nechta to'g'ri javobga ega bo'lsa, ulardan faqat <strong className="text-rose-950 dark:text-white font-bold">bitta</strong> javobni kiriting.
                                       </p>
                                    </div>
                                 </div>
                              ) : (
                                 <div className="grid grid-cols-2 divide-x divide-slate-200 dark:divide-slate-800 divide-y divide-slate-100 dark:divide-slate-900">
                                    <div className="p-3.5 space-y-1 bg-sky-50/50 dark:bg-sky-950/20">
                                       <p className="font-bold text-sky-900 dark:text-sky-200 text-[12px]">Matnli javoblar</p>
                                       <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                                          So'zlar va iboralarni aniq va toza ko'rinishda yozing (masalan: <code className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border rounded text-sky-900 dark:text-sky-100 font-mono text-[11px]">Gabsburglar</code>, <code className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border rounded text-sky-900 dark:text-sky-100 font-mono text-[11px]">Kesh</code>).
                                       </p>
                                    </div>
                                    <div className="p-3.5 space-y-1 bg-emerald-50/50 dark:bg-emerald-950/20">
                                       <p className="font-bold text-emerald-900 dark:text-emerald-200 text-[12px]">Katta va kichik harflar</p>
                                       <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                                          Imlo va katta-kichik harflar hamda bo'sh joylar tizim tomonidan avtomatik to'g'ri mezonlanadi va baholanadi.
                                       </p>
                                    </div>
                                 </div>
                              )}
                           </div>
                        </div>

                        {/* RESIZABLE SURGICH HANDLE (Touching top and bottom dashed lines) */}
                        <div
                           onMouseDown={handleMouseDownResizer}
                           className={`hidden lg:flex w-4 hover:w-5 mx-4 -mt-6 -mb-28 self-stretch cursor-col-resize items-center justify-center group z-10 transition-all select-none bg-slate-100/80 hover:bg-slate-200/80 dark:bg-slate-800/40 dark:hover:bg-slate-800/70 border-x border-slate-200/70 dark:border-slate-800 ${
                              isResizing ? "bg-slate-200 dark:bg-slate-700" : ""
                           }`}
                           title="Oynalar o'lchamini surib o'zgartirish (Surgich)"
                        >
                           <div className={`w-[2px] h-16 rounded-full transition-all ${
                              isResizing ? "bg-slate-700 dark:bg-slate-200 scale-y-110" : "bg-slate-400 dark:bg-slate-500 group-hover:bg-slate-600 dark:group-hover:bg-slate-300"
                           }`} />
                        </div>

                        {/* RIGHT COLUMN: Question Text & MathLive Cards */}
                        <div
                           style={{ width: typeof window !== "undefined" && window.innerWidth >= 1024 ? `${100 - leftPanelWidth}%` : "100%" }}
                           className="space-y-6 pl-0 lg:pl-4 flex-1 min-w-0"
                        >
                           <div className="prose prose-slate dark:prose-invert max-w-none text-[16px] leading-[1.8] text-slate-900 dark:text-slate-100 whitespace-pre-line">
                              <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                 {normalizeMath(currentQ.question_text, currentQ.type)}
                              </ReactMarkdown>
                           </div>

                           {currentQ.question_subtext && (
                              <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-[14px] text-slate-700 dark:text-slate-300 leading-relaxed prose dark:prose-invert max-w-none">
                                 <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                    {normalizeMath(currentQ.question_subtext, currentQ.type)}
                                 </ReactMarkdown>
                              </div>
                           )}

                           {(currentQ.question_image || currentQ.image_url) && (
                              <div className="max-w-md mx-auto my-4 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 shadow-xs">
                                 <img
                                    src={rewriteStorageUrl(currentQ.question_image || currentQ.image_url)}
                                    className="max-h-[350px] w-auto mx-auto object-contain rounded-xl cursor-pointer mix-blend-multiply contrast-[1.3] brightness-[1.04] saturate-0 dark:invert dark:hue-rotate-180 dark:mix-blend-normal"
                                    alt="Savol rasmi"
                                    onClick={() => setSelectedImage(rewriteStorageUrl(currentQ.question_image || currentQ.image_url))}
                                 />
                              </div>
                           )}

                           <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
                              <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                 JAVOB KIRITISH
                              </div>

                              {getQuestionBlanks(currentQ).map((blank, index) => {
                                 const currentValue = (typeof answers[currentQ.question_number] === "object"
                                    ? answers[currentQ.question_number]?.[blank.key]
                                    : answers[currentQ.question_number]) || "";

                                 const isMathSubject = test?.subject === "Matematika" || test?.subject === "Fizika" || test?.subject === "Kimyo";

                                 return (
                                    <div
                                       key={blank.key}
                                       className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                                    >
                                       <div className="flex items-center gap-2.5">
                                          <span className="w-6 h-6 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-[12px] flex items-center justify-center shrink-0">
                                             {index + 1}
                                          </span>
                                          <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                                             {getQuestionBlanks(currentQ).length > 1 ? `${index + 1}-Javob kiritish:` : "Javob kiritish:"}
                                          </span>
                                       </div>

                                       <div className="relative border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 p-2 focus-within:border-slate-400 dark:focus-within:border-slate-600 transition-all flex items-center">
                                          {isMathSubject ? (
                                             <>
                                                <math-field
                                                   id={`mf-${blank.key}`}
                                                   ref={(el) => {
                                                      if (el) {
                                                         try {
                                                            (el as any).menuToggleVisibility = "hidden";
                                                            (el as any).menuItems = [];
                                                         } catch (err) {}
                                                      }
                                                   }}
                                                   onInput={(e: any) => {
                                                      const prevAns = typeof answers[currentQ.question_number] === "object" ? answers[currentQ.question_number] : {};
                                                      handleAnswerChange(currentQ.question_number, {
                                                         ...prevAns,
                                                         [blank.key]: e.target.value,
                                                      });
                                                   }}
                                                   virtual-keyboard-mode="onfocus"
                                                   menu-toggle-visibility="hidden"
                                                   smart-fence
                                                   smart-superscript
                                                   style={{
                                                      width: "100%",
                                                      minHeight: "52px",
                                                      fontSize: "18px",
                                                      padding: "8px 40px 8px 12px",
                                                      borderRadius: "8px",
                                                      border: "none",
                                                      outline: "none",
                                                      fontFamily: '"Computer Modern", "Latin Modern", serif',
                                                   }}
                                                >
                                                   {currentValue}
                                                </math-field>

                                                <button
                                                   type="button"
                                                   onClick={() => {
                                                      const mf = document.getElementById(`mf-${blank.key}`) as any;
                                                      if (mf) {
                                                         mf.focus();
                                                         if ((window as any).mathVirtualKeyboard) {
                                                            (window as any).mathVirtualKeyboard.toggle();
                                                         }
                                                      }
                                                   }}
                                                   className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors cursor-pointer"
                                                   title="Matematik klaviaturani ochish"
                                                >
                                                   <span className="material-symbols-outlined text-[22px]">keyboard</span>
                                                </button>
                                             </>
                                          ) : (
                                             <input
                                                type="text"
                                                id={`input-${blank.key}`}
                                                value={currentValue}
                                                onChange={(e) => {
                                                   const prevAns = typeof answers[currentQ.question_number] === "object" ? answers[currentQ.question_number] : {};
                                                   handleAnswerChange(currentQ.question_number, {
                                                      ...prevAns,
                                                      [blank.key]: e.target.value,
                                                   });
                                                }}
                                                placeholder="Javobingizni matn shaklida kiriting..."
                                                className="w-full min-h-[52px] text-[16px] px-3.5 py-2.5 rounded-lg border-none outline-none bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-sans"
                                             />
                                          )}
                                       </div>
                                    </div>
                                 );
                              })}
                           </div>
                        </div>

                     </div>
                  ) : (
                     /* Standard 1-Column Layout for Multiple Choice, Matching, True/False */
                     <div className={`${(currentQ.question_image || currentQ.image_url) ? "max-w-[1200px]" : "max-w-3xl"} mx-auto w-full space-y-6`}>
                        <div className={`flex flex-col ${(currentQ.question_image || currentQ.image_url) ? "lg:flex-row" : ""} gap-10`}>
                           <div className={(currentQ.question_image || currentQ.image_url) ? "lg:w-1/2" : "w-full"}>
                              <div className="prose prose-slate dark:prose-invert max-w-none text-[18px] leading-[1.7] text-slate-800 dark:text-slate-100 mb-6 whitespace-pre-line">
                                 <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                    {currentQ.type === "matching"
                                       ? normalizeMath(getMatchingHeading(currentQ.question_text), currentQ.type)
                                       : normalizeMath(currentQ.question_text, currentQ.type)}
                                 </ReactMarkdown>
                              </div>

                              {currentQ.question_subtext && (
                                 <div className="p-4 mb-6 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed prose dark:prose-invert max-w-none">
                                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                       {normalizeMath(currentQ.question_subtext, currentQ.type)}
                                    </ReactMarkdown>
                                 </div>
                              )}

                              {/* Multiple choice */}
                              {isMc && (
                                 <div className="grid grid-cols-1 gap-2.5">
                                    {((currentQ.metadata?.options || []) as string[]).map((opt, i) => {
                                       const char = String.fromCharCode(65 + i);
                                       const isSelected = answers[currentQ.question_number] === char;
                                       const isEliminated = (eliminatedOptions[currentQ.question_number] || []).includes(char);
                                       return (
                                          <div
                                             key={i}
                                             onClick={() => !isEliminated && handleAnswerChange(currentQ.question_number, char)}
                                             className={`group relative flex items-center gap-3.5 p-3.5 sm:p-4 rounded-xl border text-left transition-all overflow-hidden ${
                                                isEliminated
                                                   ? "border-slate-200/60 dark:border-slate-800/40 bg-slate-100/60 dark:bg-slate-900/40 opacity-50 cursor-pointer"
                                                   : isSelected
                                                   ? "border-slate-900 dark:border-white bg-slate-100/80 dark:bg-slate-800/60 shadow-2xs cursor-pointer"
                                                   : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 cursor-pointer"
                                             }`}
                                          >
                                             {/* Visual Overlay Red Strike-through Line across text & math formulas when eliminated */}
                                             {isEliminated && (
                                                <div className="absolute inset-x-4 top-1/2 h-[2px] bg-rose-500/80 -translate-y-1/2 pointer-events-none rounded-full z-10" />
                                             )}

                                             <div className={`w-8 h-8 rounded-lg border flex items-center justify-center text-[13px] font-semibold shrink-0 transition-all ${
                                                isEliminated
                                                   ? "border-slate-300 dark:border-slate-700 text-slate-400 bg-slate-200/50 dark:bg-slate-800"
                                                   : isSelected
                                                   ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900"
                                                   : "border-slate-200 dark:border-slate-700 text-slate-500 bg-slate-50 dark:bg-slate-800/50"
                                             }`}>
                                                {char}
                                             </div>
                                             
                                             <div className={`flex-1 text-[14.5px] sm:text-[15px] ${isEliminated ? "text-slate-400 dark:text-slate-500" : isSelected ? "text-slate-900 dark:text-white font-medium" : "text-slate-700 dark:text-slate-300"}`}>
                                                <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{normalizeMath(opt, currentQ.type)}</ReactMarkdown>
                                             </div>

                                             <button
                                                onClick={(e) => toggleEliminateOption(e, currentQ.question_number, char)}
                                                className={`p-1.5 rounded-lg transition-all ml-auto shrink-0 z-20 ${
                                                   isEliminated
                                                      ? "bg-rose-100 dark:bg-rose-500/20 text-[#E8192C] hover:bg-rose-200 opacity-100"
                                                      : "opacity-60 sm:opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                                                }`}
                                                title={isEliminated ? "Variantni tiklash (Qaytarish)" : "Variantni o'chirish (Chizib tashlash)"}
                                             >
                                                <X className="w-4 h-4" />
                                             </button>
                                          </div>
                                       );
                                    })}
                                 </div>
                              )}

                              {/* Matching ([MA]) */}
                               {currentQ.type === "matching" && (() => {
                                  const optionsList = getMatchingOptionsList(currentQ);
                                  return (
                                     <div className="space-y-6 mt-4">
                                        <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 shadow-xs">
                                           <div className="text-[12px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                              <List className="w-4 h-4 text-sky-600" />
                                              <span>Variantlar (Javoblar ro'yxati):</span>
                                           </div>
                                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                              {optionsList.map((opt) => (
                                                 <div
                                                    key={opt.char}
                                                    className="flex items-center gap-2.5 px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-[13px] font-medium text-slate-800 dark:text-slate-200 shadow-2xs"
                                                 >
                                                    <span className="w-6 h-6 rounded-md bg-sky-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                                                       {opt.char}
                                                    </span>
                                                    <div className="flex-1 min-w-0">
                                                       {opt.text ? (
                                                          <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                                             {normalizeMath(opt.text, currentQ.type)}
                                                          </ReactMarkdown>
                                                       ) : (
                                                          <span className="text-slate-400 italic">Variant {opt.char}</span>
                                                       )}
                                                    </div>
                                                 </div>
                                              ))}
                                           </div>
                                        </div>

                                        <div className="space-y-3">
                                            {getMatchingLeftItems(currentQ).map((itemText: string, rIdx: number) => {
                                               const itemKey = String(rIdx + 1);
                                               const userSelection = typeof answers[currentQ.question_number] === "object"
                                                  ? answers[currentQ.question_number]?.[itemKey]
                                                  : answers[currentQ.question_number];

                                               return (
                                                  <div
                                                     key={rIdx}
                                                     className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                                                  >
                                                     <div className="flex items-start gap-3">
                                                        <span className="w-6 h-6 rounded-full bg-sky-600 text-white font-bold text-[12px] flex items-center justify-center shrink-0 mt-0.5">
                                                           {rIdx + 1}
                                                        </span>
                                                        <div className="flex-1 text-[14px] sm:text-[15px] font-medium text-slate-900 dark:text-white leading-relaxed">
                                                           <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                                              {normalizeMath(itemText, currentQ.type)}
                                                           </ReactMarkdown>
                                                        </div>
                                                     </div>

                                                     <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                                                        <span className="text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                                                           Mos variantni tanlang:
                                                        </span>
                                                        <select
                                                           value={userSelection || ""}
                                                           onChange={(e) => {
                                                              const prevObj = typeof answers[currentQ.question_number] === "object"
                                                                 ? answers[currentQ.question_number]
                                                                 : {};
                                                              handleAnswerChange(currentQ.question_number, {
                                                                 ...prevObj,
                                                                 [itemKey]: e.target.value,
                                                              });
                                                           }}
                                                           className="w-40 sm:w-48 h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[13.5px] font-bold text-slate-900 dark:text-white focus:border-sky-500 focus:outline-none cursor-pointer"
                                                        >
                                                           <option value="">— Variant —</option>
                                                           {optionsList.map((opt) => {
                                                              const cleanLabel = cleanMathForSelectText(opt.text);
                                                              return (
                                                                 <option key={opt.char} value={opt.char}>
                                                                    {opt.char} {cleanLabel ? `(${cleanLabel})` : ""}
                                                                 </option>
                                                              );
                                                           })}
                                                        </select>
                                                     </div>
                                                  </div>
                                               );
                                            })}
                                         </div>
                                     </div>
                                  );
                               })()}

                              {/* Numerical ([NU]) */}
                              {currentQ.type === "numerical" && (
                                 <div className="mt-6 space-y-3">
                                    <label className="block text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                                       Raqamli/matematik javobni kiriting {currentQ.metadata?.unit ? `(${currentQ.metadata.unit})` : ""}:
                                    </label>
                                    <div className="relative flex items-center gap-2 bg-white dark:bg-slate-900 rounded-xl border-2 border-slate-200 dark:border-slate-800 px-3 py-2 focus-within:border-[#E8192C]">
                                       <math-field
                                          ref={(el) => {
                                             if (el) {
                                                try {
                                                   (el as any).menuToggleVisibility = "hidden";
                                                   (el as any).menuItems = [];
                                                } catch (err) {}
                                             }
                                          }}
                                          onInput={(e: any) => handleAnswerChange(currentQ.question_number, e.target.value)}
                                          virtual-keyboard-mode="onfocus"
                                          menu-toggle-visibility="hidden"
                                          smart-fence
                                          smart-superscript
                                          style={{
                                             width: "100%",
                                             minHeight: "48px",
                                             fontSize: "16px",
                                             background: "transparent",
                                             outline: "none",
                                             border: "none",
                                             fontFamily: '"Computer Modern", "Latin Modern", serif',
                                          }}
                                       >
                                          {answers[currentQ.question_number] || ""}
                                       </math-field>
                                    </div>
                                    <MathPreview text={answers[currentQ.question_number]} />
                                 </div>
                              )}

                              {/* True/False ([TF]) & Yes/No ([YN]) */}
                              {(currentQ.type === "true_false" || currentQ.type === "yes_no") && (
                                 <div className="grid grid-cols-2 gap-4 mt-6">
                                    {(currentQ.type === "true_false" ? ["To'g'ri", "Yolg'on"] : ["Ha", "Yo'q"]).map((option) => {
                                       const isSelected = answers[currentQ.question_number] === option;
                                       return (
                                          <button
                                             key={option}
                                             onClick={() => handleAnswerChange(currentQ.question_number, option)}
                                             className={`p-4 rounded-xl border-2 text-[15px] font-bold transition-all flex items-center justify-center ${
                                                isSelected
                                                   ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white shadow-md"
                                                   : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700"
                                             }`}
                                          >
                                             {option}
                                          </button>
                                       );
                                    })}
                                 </div>
                              )}
                           </div>

                           {(currentQ.question_image || currentQ.image_url) && (
                              <div className="max-w-md mx-auto my-4 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 shadow-xs">
                                 <img
                                    src={rewriteStorageUrl(currentQ.question_image || currentQ.image_url)}
                                    className="max-h-[350px] w-auto mx-auto object-contain rounded-xl cursor-pointer mix-blend-multiply contrast-[1.3] brightness-[1.04] saturate-0 dark:invert dark:hue-rotate-180 dark:mix-blend-normal"
                                    alt="Savol rasmi"
                                    onClick={() => setSelectedImage(rewriteStorageUrl(currentQ.question_image || currentQ.image_url))}
                                 />
                              </div>
                           )}
                        </div>
                     </div>
                  )}
               </div>
            </main>

            {/* Dashed line above footer (Height 3px, wider dash width) */}
            <div className="w-full h-[3px] bg-[repeating-linear-gradient(90deg,#60a5fa_0_16px,transparent_16px_20px,#64748b_20px_36px,transparent_36px_40px,#f59e0b_40px_56px,transparent_56px_60px)] opacity-95 fixed bottom-16 left-0 right-0 z-40" />

            {/* ── FOOTER NAV ── */}
            <footer className="fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 px-3 sm:px-6 flex items-center justify-between z-50">
               {/* Left: User profile */}
               <div className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 hidden md:flex items-center gap-2 truncate max-w-[200px]">
                  <span className="truncate">{user?.user_metadata?.full_name || user?.email || "Ilyosbek Khudayberganov"}</span>
               </div>

               {/* Center: Question Navigation dropdown */}
               <button
                  onClick={() => setShowQuestionNav(!showQuestionNav)}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl transition-all hover:opacity-90 shadow-sm"
               >
                  <span className="text-[12px] sm:text-[13px] font-bold">
                     Savol {currentIdx + 1} / {totalAnswerableCount}
                  </span>
                  <AltArrowUpIcon size={16} className={`transition-transform ${showQuestionNav ? "rotate-180" : ""}`} />
               </button>

               {/* Right: Actions */}
               <div className="flex items-center gap-2 sm:gap-3">
                  <button
                     onClick={() => goToQuestion(currentIdx - 1)}
                     disabled={currentIdx === 0}
                     className="px-3 sm:px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-[12px] sm:text-[13px] font-bold transition-all disabled:opacity-40 flex items-center gap-1.5"
                  >
                     <AltArrowLeftIcon size={16} />
                     <span>Orqaga</span>
                  </button>

                  {currentIdx === questions.length - 1 ? (
                     <button
                        onClick={() => setShowSubmitModal(true)}
                        className="px-3 sm:px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-[12px] sm:text-[13px] font-bold transition-all flex items-center gap-1.5 sm:gap-2 shadow-sm"
                     >
                        <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>Topshirish</span>
                     </button>
                  ) : (
                     <button
                        onClick={() => goToQuestion(currentIdx + 1)}
                        className="px-3 sm:px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-[12px] sm:text-[13px] font-bold transition-all flex items-center gap-1.5 sm:gap-2 shadow-sm"
                     >
                        <span>Keyingi</span>
                        <AltArrowRightIcon size={16} />
                     </button>
                  )}
               </div>
            </footer>
         </div>

         {/* ── SAVOLLAR XARITASI MODAL (Wider max-w-2xl) ── */}
         <AnimatePresence>
            {showQuestionNav && (
               <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[100] flex items-center justify-center p-4" onClick={() => setShowQuestionNav(false)}>
                  <motion.div
                     initial={{ opacity: 0, scale: 0.96 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, scale: 0.96 }}
                     transition={{ duration: 0.15 }}
                     onClick={(e) => e.stopPropagation()}
                     className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl p-7 shadow-2xl border border-slate-100 dark:border-slate-800"
                  >
                     {/* Header */}
                     <div className="flex items-start justify-between mb-4">
                        <div>
                           <h3 className="text-[17px] font-bold text-slate-900 dark:text-white">Savollar Xaritasi</h3>
                           <p className="text-[12px] text-slate-500 dark:text-slate-400">Javob berilgan va belgilangan savollar ro'yxati</p>
                        </div>
                        <button
                           onClick={() => setShowQuestionNav(false)}
                           className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                        >
                           <X className="w-4 h-4" />
                        </button>
                     </div>

                     {/* Filter Tabs */}
                     <div className="flex items-center gap-2 mb-6 text-[12px] font-medium">
                        <button
                           onClick={() => setNavFilter("all")}
                           className={`px-3.5 py-1.5 rounded-xl transition-all ${
                              navFilter === "all"
                                 ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold shadow-xs"
                                 : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                           }`}
                        >
                           Barchasi ({totalAnswerableCount})
                        </button>
                        <button
                           onClick={() => setNavFilter("unanswered")}
                           className={`px-3.5 py-1.5 rounded-xl transition-all ${
                              navFilter === "unanswered"
                                 ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold shadow-xs"
                                 : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                           }`}
                        >
                           Javob berilmagan ({totalAnswerableCount - totalAnsweredCount})
                        </button>
                        <button
                           onClick={() => setNavFilter("bookmarked")}
                           className={`px-3.5 py-1.5 rounded-xl transition-all ${
                              navFilter === "bookmarked"
                                 ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold shadow-xs"
                                 : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                           }`}
                        >
                           Belgilangan ({bookmarkedQuestions.size})
                        </button>
                     </div>

                     {/* Responsive Grid for Savollar Xaritasi */}
                     <div className="grid grid-cols-5 xs:grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 sm:gap-2.5 max-h-[360px] overflow-y-auto p-1 custom-scrollbar">
                         {questionMapItems.map((item, mapIdx) => {
                            const isBk = bookmarkedQuestions.has(item.qNum);
                            const isAns = !!answers[item.qNum];
                            const isCurr = currentIdx === item.navIdx;

                            if (navFilter === "unanswered" && isAns) return null;
                            if (navFilter === "bookmarked" && !isBk) return null;

                            return (
                               <button
                                  key={mapIdx}
                                  onClick={() => {
                                     goToQuestion(item.navIdx);
                                     setShowQuestionNav(false);
                                  }}
                                  className={`relative aspect-square rounded-xl text-[13px] font-bold flex items-center justify-center transition-all ${
                                     isCurr
                                        ? "border-2 border-sky-500 bg-sky-50/80 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 shadow-xs scale-105"
                                        : isAns
                                        ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs hover:opacity-90"
                                        : "bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-400"
                                  }`}
                               >
                                  {item.label}
                                  {isBk && (
                                     <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-500 border-2 border-white dark:border-slate-900 shadow-xs" />
                                  )}
                               </button>
                            );
                         })}
                      </div>

                      {/* Legend Footer */}
                      <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] font-medium text-slate-500">
                         <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-900 dark:bg-white" />
                            <span>Javob berilgan</span>
                         </div>
                         <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full border border-slate-300 dark:border-slate-600 bg-white" />
                            <span>Javob berilmagan</span>
                         </div>
                         <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full border-2 border-sky-500 bg-sky-50" />
                            <span>Hozirgi savol</span>
                         </div>
                         <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                            <span>Belgilangan</span>
                         </div>
                      </div>
                   </motion.div>
                </div>
             )}
          </AnimatePresence>

         {/* ── IMAGE LIGHTBOX ── */}
         <AnimatePresence>
            {selectedImage && (
               <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 sm:p-6 backdrop-blur-xs"
                  onClick={() => setSelectedImage(null)}
               >
                  <motion.div
                     initial={{ scale: 0.95, opacity: 0 }}
                     animate={{ scale: 1, opacity: 1 }}
                     exit={{ scale: 0.95, opacity: 0 }}
                     className="relative max-w-[95vw] max-h-[90vh] p-3 sm:p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex items-center justify-center"
                     onClick={(e) => e.stopPropagation()}
                  >
                     <img
                        src={selectedImage}
                        className="max-w-full max-h-[82vh] object-contain rounded-xl mix-blend-multiply contrast-[1.3] brightness-[1.04] saturate-0 dark:invert dark:hue-rotate-180 dark:mix-blend-normal"
                        alt="Kattalashtirilgan rasm"
                     />
                  </motion.div>
                  <button
                     className="absolute top-5 right-5 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors cursor-pointer"
                     onClick={() => setSelectedImage(null)}
                  >
                     <X className="w-5 h-5" />
                  </button>
               </motion.div>
            )}
         </AnimatePresence>



         {/* ── EXIT CONFIRM ── */}
         <AnimatePresence>
            {showExitConfirm && (
               <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40">
                  <motion.div
                     initial={{ opacity: 0, scale: 0.96 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, scale: 0.96 }}
                     className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-8 text-center shadow-2xl border border-slate-100 dark:border-slate-800"
                  >
                     <div className="w-12 h-12 bg-red-50 dark:bg-red-500/10 rounded-xl flex items-center justify-center mx-auto mb-5">
                        <AlertCircle className="w-6 h-6" style={{ color: RED }} />
                     </div>
                     <h3 className="text-[17px] font-semibold text-slate-900 dark:text-white mb-2">
                        Chiqishni xohlaysizmi?
                     </h3>
                     <p className="text-[13px] text-slate-500 mb-6 leading-relaxed">
                        Test yakunlanmaydi va natijangiz saqlanmasligi mumkin.
                     </p>
                     <div className="flex flex-col gap-2.5">
                        <button
                            onClick={() => setShowExitConfirm(false)}
                            className="w-full h-11 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-[13px] font-medium"
                         >
                            Davom etish
                         </button>
                         <button
                            onClick={() => { exitFullscreen(); navigate("/tests"); }}
                            className="w-full h-11 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-xl text-[13px] font-medium hover:text-[#E8192C] transition-colors"
                         >
                            Chiqish
                         </button>
                      </div>
                   </motion.div>
                </div>
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
              <button
                onClick={() => addHighlight(currentQ.question_number, selectionMenu.selectedText, "yellow")}
                title="Sariq ajratish"
                className="w-7 h-7 rounded-full bg-[#FEF08A] hover:scale-110 active:scale-95 transition-transform border border-amber-300 shadow-xs flex items-center justify-center cursor-pointer"
              />
              <button
                onClick={() => addHighlight(currentQ.question_number, selectionMenu.selectedText, "blue")}
                title="Ko'k ajratish"
                className="w-7 h-7 rounded-full bg-[#BAE6FD] hover:scale-110 active:scale-95 transition-transform border border-sky-300 shadow-xs flex items-center justify-center cursor-pointer"
              />
              <button
                onClick={() => addHighlight(currentQ.question_number, selectionMenu.selectedText, "pink")}
                title="Pushti ajratish"
                className="w-7 h-7 rounded-full bg-[#FBCFE8] hover:scale-110 active:scale-95 transition-transform border border-pink-300 shadow-xs flex items-center justify-center cursor-pointer"
              />
              <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-800 mx-0.5" />
              <button
                onClick={() => addHighlight(currentQ.question_number, selectionMenu.selectedText, "underline", true)}
                title="Ostiga chizish"
                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition font-bold text-xs underline underline-offset-2 decoration-2 cursor-pointer"
              >
                U
              </button>
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
              <button
                onClick={() => removeHighlight(currentQ.question_number, selectionMenu.selectedText)}
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
                  className="w-full h-24 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-[12px] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
                />
                <button
                  onClick={() => {
                    addHighlight(currentQ.question_number, activeNoteInput.selectedText, activeNoteInput.color, activeNoteInput.isUnderline, noteText);
                    setActiveNoteInput(null);
                  }}
                  disabled={!noteText.trim()}
                  className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[13px] font-bold rounded-xl transition-colors"
                >
                  Saqlash
                </button>
              </div>
            </div>
          )}

          <style>{`
             .custom-scrollbar::-webkit-scrollbar { width: 3px; }
             .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
             .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; }
             
             /* Hide MathLive menu toggle icon & duplicate virtual keyboard toggle */
             math-field::part(menu-toggle),
             math-field::part(menu-toggle-button),
             math-field::part(virtual-keyboard-toggle),
             math-field::part(virtual-keyboard-toggle-button),
             math-field [part*="menu"],
             math-field [part*="keyboard"],
             math-field [data-sm-toggle="menu"],
             .ML__menu-toggle,
             .ML__virtual-keyboard-toggle {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                pointer-events: none !important;
                width: 0 !important;
                height: 0 !important;
             }
          `}</style>
         {/* ── EXAM MODE MODALS ── */}
         <WhiteboardModal isOpen={showWhiteboard} onClose={() => setShowWhiteboard(false)} />
         <SubmitConfirmModal
            isOpen={showSubmitModal}
            onClose={() => setShowSubmitModal(false)}
            onSubmit={handleSubmit}
            totalQuestions={totalAnswerableCount}
            answeredCount={totalAnsweredCount}
            bookmarkedCount={bookmarkedQuestions.size}
         />
         <TabAwayWarningModal
            isOpen={Boolean(test?.enable_warnings) && (isTabAway || tabAwaySeconds < 10)}
            secondsLeft={tabAwaySeconds}
            onReturn={handleResumeTest}
         />
         {/* ── PAUSE TEST MODAL ── */}
         <AnimatePresence>
            {showPauseModal && (
               <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
                  <motion.div
                     initial={{ opacity: 0, scale: 0.95 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, scale: 0.95 }}
                     className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 text-center shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4"
                  >
                     <div className="w-14 h-14 bg-amber-50 dark:bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto text-amber-500 border border-amber-200/60 dark:border-amber-500/20">
                        <PauseCircleIcon size={28} />
                     </div>
                     <div>
                        <h3 className="text-[17px] font-extrabold text-slate-900 dark:text-white">Imtihon Vaqtincha To'xtatildi</h3>
                        <p className="text-[13px] font-extrabold text-slate-700 dark:text-slate-200 mt-1">Timer to'xtatildi. Tayyor bo'lgach davom ettirishingiz mumkin.</p>
                     </div>
                     <button
                        onClick={() => setShowPauseModal(false)}
                        className="w-full h-11 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-extrabold text-[13.5px] shadow-md hover:opacity-90 transition-opacity"
                     >
                        Testni Davom Ettirish
                     </button>
                  </motion.div>
               </div>
            )}
         </AnimatePresence>
      </div>
   );
};

export default MockTestSession;
