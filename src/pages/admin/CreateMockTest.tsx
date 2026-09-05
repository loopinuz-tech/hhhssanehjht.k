import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { AltArrowLeftIcon } from "@solar-icons/react/bold-duotone/alt-arrow-left";
import { DisketteIcon } from "@solar-icons/react/bold-duotone/diskette";
import { RefreshIcon } from "@solar-icons/react/bold-duotone/refresh";
import { AddCircleIcon as PlusCircleIcon } from "@solar-icons/react/bold-duotone/add-circle";
import { TrashBinMinimalisticIcon } from "@solar-icons/react/bold-duotone/trash-bin-minimalistic";
import { CloseSquareIcon } from "@solar-icons/react/bold-duotone/close-square";
import { BoltIcon } from "@solar-icons/react/bold-duotone/bolt";
import { EyeIcon } from "@solar-icons/react/bold-duotone/eye";
import { FileTextIcon } from "@solar-icons/react/bold-duotone/file-text";
import { InfoCircleIcon } from "@solar-icons/react/bold-duotone/info-circle";
import { PinIcon } from "@solar-icons/react/bold-duotone/pin";
import { UploadMinimalisticIcon } from "@solar-icons/react/bold-duotone/upload-minimalistic";
import { MagicWandIcon } from "@solar-icons/react/bold-duotone/magic-wand";
import { CheckCircleIcon } from "@solar-icons/react/bold-duotone/check-circle";
import { FileCheckIcon } from "@solar-icons/react/bold-duotone/file-check";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { buildMockTestSlug, slugify } from "@/lib/testRoutes";
import Tesseract from "tesseract.js";
import { RaschModelAnalysis, computeRaschModel } from "@/components/admin/RaschModelAnalysis";

if (typeof window !== "undefined" && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
}

const parseKeyTextFromRaw = (rawText: string) => {
  const newKeys32: Record<number, string> = {};
  const newKeysMatching: Record<number, string> = {};
  const newKeysWritten: Record<number, { a: string; b: string }> = {};

  const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);

  // 1-32 Yopiq questions
  for (let i = 1; i <= 32; i++) {
    const reg = new RegExp(`(?:^|\\b)${i}[\\s\\.\\:\\|\\-]*([A-D])(?:\\b|$)`, "i");
    for (const line of lines) {
      const match = line.match(reg);
      if (match) {
        newKeys32[i] = match[1].toUpperCase();
        break;
      }
    }
  }

  // 33-35 Moslashtirish questions
  for (let i = 33; i <= 35; i++) {
    const reg = new RegExp(`(?:^|\\b)${i}[\\s\\.\\:\\|\\-]*([A-F])(?:\\b|$)`, "i");
    for (const line of lines) {
      const match = line.match(reg);
      if (match) {
        newKeysMatching[i] = match[1].toUpperCase();
        break;
      }
    }
  }

  // 36-45 Ochiq test questions (a and b)
  for (let i = 36; i <= 45; i++) {
    let aVal = "";
    let bVal = "";
    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx];
      if (line.includes(`${i}`)) {
        const remaining = lines.slice(idx, Math.min(idx + 5, lines.length)).join(" ");
        const mA = remaining.match(/a\)\s*([^\s\,b]+)/i) || remaining.match(/a[\.\:]\s*([^\s\,b]+)/i);
        const mB = remaining.match(/b\)\s*([^\s\,]+)/i) || remaining.match(/b[\.\:]\s*([^\s\,]+)/i);
        if (mA) aVal = mA[1].trim();
        if (mB) bVal = mB[1].trim();
        break;
      }
    }
    if (aVal || bVal) {
      newKeysWritten[i] = { a: aVal, b: bVal };
    }
  }

  return { newKeys32, newKeysMatching, newKeysWritten };
};


const extractPdfText = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(" ");
      fullText += `\n--- SAHIFA ${i} ---\n` + pageText;
    }
    return fullText;
  } catch (err: any) {
    console.error("PDF extraction error:", err);
    throw new Error("PDF matnini o'qishda xatolik yuz berdi: " + (err.message || String(err)));
  }
};


const normalizeMath = (text: string) => {
  if (!text) return "";
  let formatted = String(text)
    .replace(/\\\(/g, "$")
    .replace(/\\\)/g, "$")
    .replace(/\\\[/g, "$$")
    .replace(/\\\]/g, "$$")
    .replace(/(\$[^$]+?)\s+\$/g, "$1$");

  const parts = formatted.split(/(\$\$[\s\S]*?\$\$|\$[^$]+?\$)/g);
  formatted = parts.map((part) => {
    if (part.startsWith("$")) return part;
    let p = part;

    p = p.replace(/;[ \t\r\n]*/g, ";\n");
    p = p.replace(/([^\n])\s*(\b[a-eA-E0-9]{1,2}[\)\.])\s*/g, "$1\n$2 ");
    p = p.replace(/\n{3,}/g, "\n\n");

    return p;
  }).join("");

  return formatted.trim();
};

export const getQuestionBlanks = (question: any): { key: string; label: string; alternatives: string[] }[] => {
  if (question.metadata?.blanks && Array.isArray(question.metadata.blanks)) {
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
      const key = b.key || b.label || String.fromCharCode(97 + idx);
      const alternatives = Array.isArray(b.alternatives) ? b.alternatives : (b.text || "").split("|").map((s: string) => s.trim()).filter(Boolean);
      return { key, label: `${key.toUpperCase()})`, alternatives };
    });
  }

  if (Array.isArray(question.correct_answer)) {
    return question.correct_answer.map((ans: any, idx: number) => {
      let key = String.fromCharCode(97 + idx);
      let textPart = String(ans);
      const match = textPart.match(/^([a-zA-Z0-9]+)[\).\s]+(.*)/);
      if (match) {
        key = match[1].toLowerCase();
        textPart = match[2];
      }
      const parts = textPart.split("|").map((s) => s.trim()).filter(Boolean);
      return { key, label: `${key.toUpperCase()})`, alternatives: parts };
    });
  }

  if (typeof question.correct_answer === "object" && question.correct_answer !== null) {
    return Object.keys(question.correct_answer).map((key) => {
      const val = question.correct_answer[key];
      const parts = Array.isArray(val) ? val : String(val).split("|").map((s) => s.trim()).filter(Boolean);
      return { key: key.toLowerCase(), label: `${key.toUpperCase()})`, alternatives: parts };
    });
  }

  return [{ key: "a", label: "A)", alternatives: [] }];
};

type QuestionType =
  | "multiple_choice"
  | "matching"
  | "written"
  | "multiple_select"
  | "true_false"
  | "yes_no"
  | "fill_blanks"
  | "short_answer"
  | "numerical"
  | "ordering"
  | "programming"
  | "reading_passage"
  | "essay";

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

interface TestData {
  title: string;
  description: string;
  subject: string;
  type: string;
  price_cash: number;
  price_educoin: number;
  is_free: boolean;
  duration_minutes: number;
  questions_count: number;
  is_active: boolean;
  enable_warnings?: boolean;
  available_from?: string | null;
  available_until?: string | null;
  max_attempts?: number;
}

const SUBJECTS = [
  "Matematika",
  "Ona tili",
  "Ingliz tili",
  "Tarix",
  "Kimyo",
  "Biologiya",
  "Fizika",
];

const TEST_TYPES = [
  { value: "milliy_sertifikat", label: "Milliy sertifikat" },
  { value: "full_test", label: "To'liq test" },
  { value: "predicted_test", label: "Bashorat test" },
];

const QUESTION_TYPES = [
  { value: "multiple_choice", label: "[MC] Bitta tanlov (Single)" },
  { value: "multiple_select", label: "[MS] Ko'p tanlov (Multiple)" },
  { value: "true_false", label: "[TF] To'g'ri / Yolg'on" },
  { value: "yes_no", label: "[YN] Ha / Yo'q" },
  { value: "fill_blanks", label: "[FB] Bo'sh joyni to'ldirish" },
  { value: "short_answer", label: "[SA] Qisqa javob" },
  { value: "numerical", label: "[NU] Raqamli javob" },
  { value: "essay", label: "[ES] Insho / Yozma" },
  { value: "matching", label: "[MA] Moslashtirish" },
  { value: "ordering", label: "[OR] Tartiblash" },
  { value: "programming", label: "[PR] Dasturlash / Kod" },
  { value: "reading_passage", label: "[RP] Matnli savol (Reading Passage)" },
];

const parseBulkQuestions = (rawText: string): any[] => {
  if (!rawText || !rawText.trim()) return [];

  // Normalize markdown hashes like ## [MC], # [MC], ## [FB] to start cleanly with [TAG]
  let normalizedText = rawText.replace(/(?:^|\n)\s*#+\s*(\[(?:MC|MS|TF|YN|FB|SA|NU|ES|MA|OR|PR|SINGLE|MULTIPLE|PASSAGE|ENDPASSAGE)\])/gi, "\n$1");

  // Split into raw blocks by question type tags
  let rawBlocks = normalizedText
    .split(/(?:^|\n)(?=[\s]*\[(?:MC|MS|TF|YN|FB|SA|NU|ES|MA|OR|PR|SINGLE|MULTIPLE|PASSAGE|ENDPASSAGE)\])/i)
    .map((b) => b.trim())
    .filter(Boolean);

  if (rawBlocks.length <= 1) {
    rawBlocks = normalizedText.split(/---/).map((b) => b.trim()).filter(Boolean);
  }

  const parsed: any[] = [];
  
  let currentPassageId: string | null = null;
  let currentPassageText: string = "";

  rawBlocks.forEach((block) => {
    const blockUpper = block.toUpperCase();
    if (blockUpper.startsWith("[PASSAGE]")) {
      currentPassageText = block.replace(/^\[PASSAGE\]\s*/i, "").trim();
      currentPassageId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
      return;
    }
    if (blockUpper.startsWith("[ENDPASSAGE]")) {
      currentPassageId = null;
      currentPassageText = "";
      return;
    }

    // ── Pre-process entire block to handle multi-line HTML tags ──
    // Collapse multi-line <i>, <b>, <br> to single lines before splitting
    let blockText = block
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<i>([\s\S]*?)<\/i>/gi, (_, content) => `*${content.replace(/\n/g, " ")}*`)
      .replace(/<b>([\s\S]*?)<\/b>/gi, (_, content) => `**${content.replace(/\n/g, " ")}**`)
      .replace(/<strong>([\s\S]*?)<\/strong>/gi, (_, content) => `**${content.replace(/\n/g, " ")}**`)
      .replace(/<sub>([\s\S]*?)<\/sub>/gi, (_, content) => `$_{${content}}$`)
      .replace(/<sup>([\s\S]*?)<\/sup>/gi, (_, content) => `$^{${content}}$`);

    const lines = blockText.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    let typeTag = "[MC]";
    if (lines[0].replace(/^#+\s*/, "").startsWith("[")) {
      typeTag = lines[0].replace(/^#+\s*/, "").trim().toUpperCase();
      lines.shift();
    }

    let explanation = "";
    let questionSubtext = "";
    let questionImage = "";
    let points = 1;
    let difficulty = 1;
    let lang = "";
    let code = "";
    let correctAnswerTag: any = null;

    const processFormat = (str: string) => {
      if (!str) return str;
      return str
        .replace(/<i>([\s\S]*?)<\/i>/gi, "*$1*")
        .replace(/<b>([\s\S]*?)<\/b>/gi, "**$1**")
        .replace(/<strong>([\s\S]*?)<\/strong>/gi, "**$1**")
        .replace(/<sub>([\s\S]*?)<\/sub>/gi, "$_{$1}$")
        .replace(/<sup>([\s\S]*?)<\/sup>/gi, "$^{$1}$");
    };

    const contentLines: string[] = [];

    lines.forEach((line) => {
      if (line.toLowerCase().startsWith("@exp:")) {
        explanation = processFormat(line.slice(5).trim());
      } else if (line.toLowerCase().startsWith("@subtext:") || line.toLowerCase().startsWith("@context:") || line.toLowerCase().startsWith("@passage:")) {
        questionSubtext = processFormat(line.slice(line.indexOf(":") + 1).trim());
      } else if (line.toLowerCase().startsWith("@img:") || line.toLowerCase().startsWith("@image:")) {
        questionImage = line.slice(line.indexOf(":") + 1).trim();
      } else if (line.toLowerCase().startsWith("@points:")) {
        points = parseFloat(line.slice(8).trim()) || 1;
      } else if (line.toLowerCase().startsWith("@diff:")) {
        difficulty = parseInt(line.slice(6).trim(), 10) || 1;
      } else if (line.toLowerCase().startsWith("@lang:")) {
        lang = line.slice(6).trim();
      } else if (line.toLowerCase().startsWith("@code:")) {
        code = line.slice(6).trim();
      } else if (line.toLowerCase().startsWith("@correct_answer:") || line.toLowerCase().startsWith("@answer:")) {
        const val = line.slice(line.indexOf(":") + 1).trim();
        try {
          correctAnswerTag = JSON.parse(val);
        } catch (e) {
          correctAnswerTag = processFormat(val);
        }
      } else {
        contentLines.push(processFormat(line));
      }
    });

    if (contentLines.length === 0) return;

    let typeName: QuestionType = "multiple_choice";
    let questionText = contentLines.join("\n");
    let metadata: any = {};
    let correctAnswer: any = correctAnswerTag || "";

    if (typeTag === "[MC]" || typeTag === "[SINGLE]") {
      typeName = "multiple_choice";

      // Find where option lines start (e.g., A), B), C), D) or A., B., C., D.) - UPPERCASE ONLY!
      let firstOptIdx = contentLines.findIndex((l) => /^[A-D][\)\.\:\-\s]/.test(l));
      if (firstOptIdx === -1) firstOptIdx = contentLines.findIndex((l) => /^[A-D][\)\.\:]/.test(l));

      let textLines: string[] = [];
      let optionLines: string[] = [];

      if (firstOptIdx > 0) {
        textLines = contentLines.slice(0, firstOptIdx);
        optionLines = contentLines.slice(firstOptIdx);
      } else if (firstOptIdx === 0) {
        textLines = [contentLines[0]];
        optionLines = contentLines.slice(1);
      } else {
        textLines = contentLines;
        optionLines = [];
      }

      questionText = textLines.join("\n").replace(/^#+\s*/, "").replace(/^\[(?:MC|MS|TF|YN|FB|SA|NU|ES|MA|OR|PR)\]\s*/i, "").trim();

      const options: string[] = [];
      let correctChar = "A";

      optionLines.forEach((optLine) => {
        if (!/^[A-Z][\)\.\:\-\s]/.test(optLine) && options.length > 0) return;
        const isCorrect = optLine.includes("*");
        const cleanOpt = optLine
          .replace(/^[A-Za-z0-9][\)\.\:\-\s]+/, "")
          .replace(/\*/g, "")
          .trim();
        options.push(cleanOpt);
        if (isCorrect) correctChar = String.fromCharCode(65 + options.length - 1);
      });

      metadata = { options };
      correctAnswer = correctAnswerTag || correctChar;
    } else if (typeTag === "[MS]" || typeTag === "[MULTIPLE]") {
      typeName = "multiple_select";
      let firstOptIdx = contentLines.findIndex((l) => /^[A-D][\)\.\:\-\s]/.test(l));
      let textLines = firstOptIdx > 0 ? contentLines.slice(0, firstOptIdx) : [contentLines[0]];
      let optionLines = firstOptIdx > 0 ? contentLines.slice(firstOptIdx) : contentLines.slice(1);

      questionText = textLines.join("\n").replace(/^#+\s*/, "").replace(/^\[(?:MC|MS|TF|YN|FB|SA|NU|ES|MA|OR|PR)\]\s*/i, "").trim();
      const options: string[] = [];
      const correctChars: string[] = [];

      optionLines.forEach((optLine) => {
        if (!/^[A-Z][\)\.\:\-\s]/.test(optLine) && options.length > 0) return;
        const isCorrect = optLine.includes("*");
        const cleanOpt = optLine
          .replace(/^[A-Za-z0-9][\)\.\:\-\s]+/, "")
          .replace(/\*/g, "")
          .trim();
        options.push(cleanOpt);
        if (isCorrect) correctChars.push(String.fromCharCode(65 + options.length - 1));
      });
      metadata = { options };
      correctAnswer = correctAnswerTag || correctChars;
    } else if (typeTag === "[TF]") {
      typeName = "true_false";
      questionText = contentLines[0].replace(/^#+\s*/, "").trim();
      const val = (contentLines[1] || "To'g'ri").trim();
      correctAnswer = correctAnswerTag || val;
      metadata = { options: ["To'g'ri", "Yolg'on"] };
    } else if (typeTag === "[YN]") {
      typeName = "yes_no";
      questionText = contentLines[0].replace(/^#+\s*/, "").trim();
      const val = (contentLines[1] || "Ha").trim();
      correctAnswer = correctAnswerTag || val;
      metadata = { options: ["Ha", "Yo'q"] };
    } else if (typeTag === "[FB]") {
      typeName = "fill_blanks";
      questionText = contentLines.join("\n").replace(/^#+\s*/, "").replace(/^\[(?:MC|MS|TF|YN|FB|SA|NU|ES|MA|OR|PR)\]\s*/i, "").trim();

      if (correctAnswerTag && typeof correctAnswerTag === "object") {
        const blanks = Object.keys(correctAnswerTag).map((key) => {
          const alternatives = Array.isArray(correctAnswerTag[key])
            ? correctAnswerTag[key]
            : [String(correctAnswerTag[key])];
          return { key: key.toLowerCase(), label: `${key.toUpperCase()})`, alternatives };
        });
        metadata = { blanks };
        correctAnswer = correctAnswerTag;
      } else {
        const textLines: string[] = [];
        const answerLines: string[] = [];

        // Find answer lines: lines that follow the pattern "a) xxx | yyy" or "a) xxx"
        // and the last line containing "_" marks the end of question text
        const answerLinePattern = /^[a-zA-Z0-9]+[\)\.\:][\s\S]+/;
        const hasAnswerLines = contentLines.some(line => 
          line.includes("|") && answerLinePattern.test(line)
        );

        let lastUnderscoreIdx = -1;
        contentLines.forEach((line, idx) => {
          if (line.includes("_")) lastUnderscoreIdx = idx;
        });

        if (lastUnderscoreIdx !== -1) {
          textLines.push(...contentLines.slice(0, lastUnderscoreIdx + 1));
          const remaining = contentLines.slice(lastUnderscoreIdx + 1);
          // Only add lines that look like answer definitions (have | or match letter-prefix pattern)
          remaining.forEach(line => {
            if (line.trim() && (line.includes("|") || /^[a-zA-Z][\)\.\:].+/.test(line))) {
              answerLines.push(line);
            }
          });
        } else if (hasAnswerLines) {
          let foundAnswers = false;
          contentLines.forEach((line) => {
            if (line.includes("|") && /^[a-zA-Z0-9]+[\)\.\:\-\s]/.test(line)) {
              answerLines.push(line);
              foundAnswers = true;
              return;
            }
            if (!foundAnswers && (textLines.length === 0 || /^[a-zA-Z0-9]+\s*[\)\.\:\-\s]/.test(line) || line.endsWith("?"))) {
              textLines.push(line);
            } else {
              foundAnswers = true;
              answerLines.push(line);
            }
          });
        } else {
          textLines.push(...contentLines);
        }

        questionText = textLines.join("\n").replace(/^#+\s*/, "").trim();
        const blanks: { key: string; label: string; alternatives: string[] }[] = [];
        const answersObj: Record<string, string[]> = {};

        answerLines.forEach((line, idx) => {
          let key = String.fromCharCode(97 + idx);
          let textPart = line;
          const match = line.match(/^([a-zA-Z0-9]+)[\)\.\:\-\s]+(.*)/);
          if (match) {
            key = match[1].toLowerCase();
            textPart = match[2];
          }
          const alternatives = textPart.split("|").map((s) => s.trim()).filter(Boolean);
          blanks.push({ key, label: `${key.toUpperCase()})`, alternatives });
          answersObj[key] = alternatives;
        });

        metadata = { blanks };
        correctAnswer = answersObj;
      }
    } else if (typeTag === "[SA]") {
      typeName = "short_answer";
      let ansText = contentLines[1] || contentLines[0] || "";
      if (contentLines.length >= 3) {
        questionText = `${contentLines[0]}\n${contentLines[1]}`;
        ansText = contentLines[2];
      } else {
        questionText = contentLines[0];
      }
      questionText = questionText.replace(/^#+\s*/, "").trim();
      const answers = ansText.split(",").map((s) => s.trim()).filter(Boolean);
      correctAnswer = correctAnswerTag || answers;
      metadata = { acceptable: answers };
    } else if (typeTag === "[NU]") {
      typeName = "numerical";
      questionText = contentLines[0].replace(/^#+\s*/, "").trim();
      const parts = (contentLines[1] || contentLines[0] || "").split("|").map((s) => s.trim());
      const val = parseFloat(parts[0]) || 0;
      correctAnswer = correctAnswerTag || val;
      metadata = {
        value: val,
        tolerance: parseFloat(parts[1]) || 0,
        unit: parts[2] || "",
      };
    } else if (typeTag === "[ES]") {
      typeName = "essay";
      questionText = contentLines.join("\n").replace(/^#+\s*/, "").trim();
      correctAnswer = correctAnswerTag || "";
    } else if (typeTag === "[MA]") {
      typeName = "matching";

      const left: string[] = [];
      const right: string[] = [];
      const options: string[] = [];
      const headerLines: string[] = [];

      contentLines.forEach((line) => {
        if (/^\d+[\)\.\:\-\s]/.test(line) && (line.includes(" - ") || line.includes(" : ") || line.includes("?"))) {
          let cleanLeft = line;
          if (line.includes(" - ")) cleanLeft = line.split(" - ")[0];
          else if (line.includes(" : ")) cleanLeft = line.split(" : ")[0];
          left.push(cleanLeft.trim());
        } else if (/^barcha variantlar/i.test(line) || /^variantlar/i.test(line) || /^[A-F][\)\.\:\-\s]/.test(line)) {
          const optChunks = line.split(/(?:\s|^)(?=[A-F][\)\.\:\-])/).map((c) => c.trim()).filter((c) => /^[A-F][\)\.\:\-]/.test(c));
          if (optChunks.length > 0) {
            optChunks.forEach((cleaned) => {
              if (!right.includes(cleaned)) right.push(cleaned);
              const optVal = cleaned.replace(/^[A-F][\)\.\:\-\s]+/i, "").trim();
              if (optVal && !options.includes(optVal)) options.push(optVal);
            });
          } else {
            const cleaned = line.replace(/^barcha variantlar\s*:\s*/i, "").trim();
            if (cleaned) right.push(cleaned);
          }
        } else if (line.includes(" - ") && !line.startsWith("@")) {
          const parts = line.split(" - ").map(s => s.trim());
          if (parts.length >= 2 && !/^\d+[\)\.\:\-\s]/.test(parts[0])) {
            left.push(parts[0]);
            const rightText = parts.slice(1).join(" - ").trim();
            right.push(rightText);
            if (!options.includes(rightText)) options.push(rightText);
          }
        } else {
          headerLines.push(line);
        }
      });

      questionText = headerLines.join("\n").replace(/^#+\s*/, "").trim() || "Topshiriqlarni javob variantlari bilan moslashtiring:";

      if (options.length === 0 && right.length > 0) {
        right.forEach((r) => {
          const optVal = r.replace(/^[A-F][\)\.\:\-\s]+/i, "").trim();
          options.push(optVal || r);
        });
      }

      let corrMap: Record<string, string> = {};
      if (correctAnswerTag && typeof correctAnswerTag === "object") {
        corrMap = { ...correctAnswerTag };
        Object.keys(correctAnswerTag).forEach(k => {
          const numKey = parseInt(k, 10);
          if (!isNaN(numKey) && numKey <= 5) {
            corrMap[String(32 + numKey)] = correctAnswerTag[k];
          }
        });
      }

      metadata = { left, right, options };
      correctAnswer = Object.keys(corrMap).length > 0 ? corrMap : correctAnswerTag || {};
    } else if (typeTag === "[OR]") {
      typeName = "ordering";
      questionText = contentLines[0].replace(/^#+\s*/, "").trim();
      const items = contentLines.slice(1).map((l) => l.replace(/^[0-9]+[\)\.\:\-\s]+/, "").trim());
      metadata = { items };
      correctAnswer = correctAnswerTag || items;
    } else if (typeTag === "[PR]") {
      typeName = "programming";
      questionText = contentLines[0].replace(/^#+\s*/, "").trim();
      metadata = { lang: lang || "javascript", code: code || contentLines.slice(1).join("\n") };
      correctAnswer = correctAnswerTag || code || contentLines.slice(1).join("\n");
    }

    if (currentPassageId) {
      metadata = {
        ...metadata,
        passage_id: currentPassageId,
        passage_text: currentPassageText,
      };
    }

    parsed.push({
      question_number: parsed.length + 1,
      question_text: questionText,
      question_subtext: questionSubtext,
      question_image: questionImage,
      type: typeName,
      metadata,
      correct_answer: correctAnswer,
      explanation,
      points_a: points,
      points_b: 0,
      difficulty,
    });
  });

  // Post-process: merge ONLY if consecutive blocks are separate a) and b) fragments of the exact same question
  const merged: any[] = [];
  let i = 0;

  while (i < parsed.length) {
    const cur = parsed[i];
    const next = parsed[i + 1];

    if (next && (cur.type === "short_answer" || cur.type === "fill_blanks" || cur.type === "written") && (next.type === "short_answer" || next.type === "fill_blanks" || next.type === "written")) {
      const curText = cur.question_text || "";
      const nextText = next.question_text || "";

      const curIsComplete = (cur.metadata?.blanks && cur.metadata.blanks.length > 1) || (typeof cur.correct_answer === "object" && Object.keys(cur.correct_answer || {}).length > 1) || (curText.includes("a)") && curText.includes("b)"));

      if (!curIsComplete) {
        const curHasOnlyA = /\ba[\)\.\:\-\s]/i.test(curText) && !/\bb[\)\.\:\-\s]/i.test(curText);
        const nextHasOnlyB = /\bb[\)\.\:\-\s]/i.test(nextText) && !/\ba[\)\.\:\-\s]/i.test(nextText);

        const curBase = curText.split(/\ba[\)\.\:\-\s]/i)[0].trim();
        const nextBase = nextText.split(/\bb[\)\.\:\-\s]/i)[0].trim();

        const isSameProblem = (curBase.length > 5 && nextBase.length > 5 && (curBase === nextBase || curBase.slice(0, 20) === nextBase.slice(0, 20))) || (curHasOnlyA && nextHasOnlyB);

        if (isSameProblem) {
          const partAText = curText.includes("a)") ? "a)" + curText.split("a)")[1] : curText;
          const partBText = nextText.includes("b)") ? "b)" + nextText.split("b)")[1] : nextText;

          const combinedText = `${curBase}\n${partAText}\n${partBText}`.trim();

          const ansA = Array.isArray(cur.correct_answer) ? cur.correct_answer : [String(cur.correct_answer || "")];
          const ansB = Array.isArray(next.correct_answer) ? next.correct_answer : [String(next.correct_answer || "")];

          const combinedBlanks = [
            { key: "a", label: "A)", alternatives: ansA },
            { key: "b", label: "B)", alternatives: ansB },
          ];

          const combinedAnswers = {
            a: ansA,
            b: ansB,
          };

          merged.push({
            question_number: merged.length + 1,
            question_text: combinedText,
            question_subtext: cur.question_subtext || next.question_subtext || "",
            question_image: cur.question_image || next.question_image || "",
            type: "fill_blanks",
            metadata: { blanks: combinedBlanks },
            correct_answer: combinedAnswers,
            explanation: [cur.explanation, next.explanation].filter(Boolean).join("\n"),
            points_a: (cur.points_a || 10) + (next.points_a || 10),
            points_b: 0,
            difficulty: Math.max(cur.difficulty || 1, next.difficulty || 1),
          });

          i += 2;
          continue;
        }
      }
    }

    cur.question_number = merged.length + 1;
    merged.push(cur);
    i++;
  }

  return merged;
};

const fallbackMilliyParser = (
  pdfText: string,
  k32: Record<number, string>,
  kMatch: Record<number, string>,
  kWrit: Record<number, { a: string; b: string }>,
  subject?: string
) => {
  const result: any[] = [];
  const lines = pdfText.split("\n").map((l) => l.trim()).filter(Boolean);
  const isTarix = subject === "Tarix" || pdfText.toLowerCase().includes("tarix") || pdfText.toLowerCase().includes("hukmdor");

  // 1-32 Yopiq questions
  for (let i = 1; i <= 32; i++) {
    let qText = `Savol ${i}`;
    const targetHeader = `${i}.`;
    const foundIdx = lines.findIndex((l) => l.startsWith(targetHeader) || l.includes(` ${targetHeader} `));
    if (foundIdx !== -1) {
      const nextHeader = `${i + 1}.`;
      let endIdx = lines.findIndex((l, idx) => idx > foundIdx && (l.startsWith(nextHeader) || l.includes(` ${nextHeader} `)));
      if (endIdx === -1) endIdx = Math.min(foundIdx + 14, lines.length);
      const extracted = lines.slice(foundIdx, endIdx).join("\n");
      if (extracted.length > 5) qText = extracted;
    }

    const optMatchA = qText.match(/A\)\s*([^\n]+)/);
    const optMatchB = qText.match(/B\)\s*([^\n]+)/);
    const optMatchC = qText.match(/C\)\s*([^\n]+)/);
    const optMatchD = qText.match(/D\)\s*([^\n]+)/);

    const options = [
      optMatchA ? optMatchA[1].trim() : "A varianti",
      optMatchB ? optMatchB[1].trim() : "B varianti",
      optMatchC ? optMatchC[1].trim() : "C varianti",
      optMatchD ? optMatchD[1].trim() : "D varianti",
    ];

    result.push({
      question_number: i,
      question_text: qText || `${i}. Savol matni`,
      type: "multiple_choice",
      metadata: { options },
      correct_answer: k32[i] || "A",
      points_a: 1.5,
    });
  }

  // Question 33 (Matching set for 33, 34, 35)
  const q33Idx = lines.findIndex((l) => l.includes("33."));
  let matchText = isTarix
    ? "Voqealar va ularning natijalarini moslashtiring.\n\n33. Qaysi voqea natijasida Buxarest shartnomasiga kelindi?\n34. Eritreya, Efiopiya, Somalini Italiya qaysi voqeadan keyin qo'lga kiritgan?\n35. Dunyoni qayta bo'lib olish uchun boshlangan birinchi urushni aniqlang."
    : "Prizma va silindr hajmlari teng. Prizmaning asosi trapetsiyadan iborat. Trapetsiyaning kichik asosi trapetsiyaning balandligiga teng, kichik asosi katta asosidan 2 marta kichik. (\\pi = 3 deb oling)\n\n33. Prizmaning balandligi bilan silindrning balandligi teng. Trapetsiyaning kichik asosi silindrning radiusidan necha marta katta?\n\n34. Trapetsiyaning kichik asosi silindrning radiusidan 2 marta katta. Silindrning balandligi prizmaning balandligiga nisbatini toping.\n\n35. Trapetsiyaning kichik asosi silindrning radiusidan 2 marta katta. Prizma asosining yuzi 6 ga teng. Silindrning asosining yuzini toping.";

  let leftItems = isTarix
    ? [
        "33. Qaysi voqea natijasida Buxarest shartnomasiga kelindi?",
        "34. Eritreya, Efiopiya, Somalini Italiya qaysi voqeadan keyin qo'lga kiritgan?",
        "35. Dunyoni qayta bo'lib olish uchun boshlangan birinchi urushni aniqlang."
      ]
    : [
        "33. Prizmaning balandligi bilan silindrning balandligi teng. Trapetsiyaning kichik asosi silindrning radiusidan necha marta katta?",
        "34. Trapetsiyaning kichik asosi silindrning radiusidan 2 marta katta. Silindrning balandligi prizmaning balandligiga nisbatini toping.",
        "35. Trapetsiyaning kichik asosi silindrning radiusidan 2 marta katta. Prizma asosining yuzi 6 ga teng. Silindrning asosining yuzini toping."
      ];

  let rightItems = isTarix
    ? ["A) Rossiya – Yaponiya urushi", "B) Italiya – Efiopiya urushi", "C) Usmonli – Rossiya urushi", "D) AQSh – Ispaniya urushi", "E) Ikkinchi Bolqon urushi", "F) Italiya – Usmonli urushi"]
    : ["A) √3", "B) √2", "C) 3", "D) 4", "E) 5", "F) 2"];

  let optionsList = isTarix
    ? ["Rossiya – Yaponiya urushi", "Italiya – Efiopiya urushi", "Usmonli – Rossiya urushi", "AQSh – Ispaniya urushi", "Ikkinchi Bolqon urushi", "Italiya – Usmonli urushi"]
    : ["√3", "√2", "3", "4", "5", "2"];

  if (q33Idx !== -1) {
    const q36Idx = lines.findIndex((l) => l.includes("36."));
    const endIdx = q36Idx !== -1 ? q36Idx : Math.min(q33Idx + 25, lines.length);
    const extracted = lines.slice(Math.max(0, q33Idx - 3), endIdx).join("\n");
    if (extracted.length > 30) {
      matchText = extracted;
    }
  }

  result.push({
    question_number: 33,
    question_text: matchText,
    type: "matching",
    metadata: {
      left: leftItems,
      right: rightItems,
      options: optionsList
    },
    correct_answer: { "33": kMatch[33] || (isTarix ? "E" : "B"), "34": kMatch[34] || (isTarix ? "B" : "F"), "35": kMatch[35] || (isTarix ? "D" : "C") },
    points_a: 4.5,
  });

  // 34..43 (PDF Questions 36..45)
  for (let qNum = 36; qNum <= 45; qNum++) {
    const cardNum = qNum - 2;
    const wAns = kWrit[qNum] || { a: "", b: "" };
    const qHeader = `${qNum}.`;
    const foundIdx = lines.findIndex((l) => l.startsWith(qHeader) || l.includes(` ${qHeader} `));
    let qText = `${qNum}. Topshiriqni yeching / tahlil qiling:\na) Birinchi shart bo'yicha javobni toping.\nJavob: a)\nb) Ikkinchi shart bo'yicha javobni toping.\nJavob: b)`;

    if (foundIdx !== -1) {
      let nextHeader = `${qNum + 1}.`;
      let endIdx = lines.findIndex((l, idx) => idx > foundIdx && (l.startsWith(nextHeader) || l.includes(` ${nextHeader} `)));
      if (endIdx === -1) endIdx = Math.min(foundIdx + 20, lines.length);
      const extracted = lines.slice(foundIdx, endIdx).join("\n");
      if (extracted.length > 10) {
        qText = extracted;
      }
    }

    result.push({
      question_number: cardNum,
      question_text: qText,
      type: "fill_blanks",
      metadata: {
        blanks: [
          { key: "a", label: "A)", alternatives: [wAns.a || ""] },
          { key: "b", label: "B)", alternatives: [wAns.b || ""] }
        ]
      },
      correct_answer: { a: [wAns.a || ""], b: [wAns.b || ""] },
      points_a: 3.5,
    });
  }

  return result;
};

const CreateMockTest = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "questions" | "bulk" | "milliy_pdf" | "preview" | "results">(() => {
    const t = searchParams.get("tab");
    if (t === "questions" || t === "bulk" || t === "milliy_pdf" || t === "preview" || t === "results") return t;
    return "info";
  });
  const [activeQuestion, setActiveQuestion] = useState(0);

  // Results Matrix Tab State
  const [resultsData, setResultsData] = useState<{ submissions: any[]; questions: any[] }>({ submissions: [], questions: [] });
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [resultsSearchQuery, setResultsSearchQuery] = useState("");

  const fetchTestResults = async () => {
    if (!id) return;
    setIsLoadingResults(true);
    try {
      const res = await fetch(`/api/admin/mock-tests/${id}/results`, { credentials: "include" });
      if (res.ok) {
        const json = await res.json();
        setResultsData({
          submissions: json.submissions || [],
          questions: json.questions || [],
        });
      } else {
        const { data: qData } = await (supabase as any)
          .from("mock_test_questions")
          .select("id, question_number, correct_answer, type, metadata")
          .eq("test_id", id)
          .order("question_number", { ascending: true });

        const { data: subData } = await (supabase as any)
          .from("mock_test_submissions")
          .select("*")
          .eq("test_id", id)
          .order("created_at", { ascending: false });

        if (subData && subData.length > 0) {
          const userIds = [...new Set(subData.map((s: any) => s.user_id))].filter(Boolean);
          let pMap: Record<string, any> = {};
          if (userIds.length > 0) {
            const { data: profs } = await (supabase as any)
              .from("profiles")
              .select("user_id, full_name, email, avatar_url")
              .in("user_id", userIds);
            if (profs) {
              profs.forEach((p: any) => { pMap[p.user_id] = p; });
            }
          }

          const enriched = subData.map((s: any) => {
            const p = pMap[s.user_id] || {};
            return {
              ...s,
              user_name: p.full_name || (p.email ? p.email.split('@')[0] : "Foydalanuvchi"),
              user_email: p.email || "",
              avatar_url: p.avatar_url || "",
            };
          });

          setResultsData({ submissions: enriched, questions: qData || [] });
        } else {
          setResultsData({ submissions: [], questions: qData || [] });
        }
      }
    } catch (err) {
      console.error("Error fetching results:", err);
    } finally {
      setIsLoadingResults(false);
    }
  };

  useEffect(() => {
    if (activeTab === "results") {
      fetchTestResults();
    }
  }, [activeTab, id]);

  // Milliy Sertifikat Auto-Import State
  const [milliyPdfFile, setMilliyPdfFile] = useState<File | null>(null);
  const [milliyKeyFile, setMilliyKeyFile] = useState<File | null>(null);
  const [milliyPdfText, setMilliyPdfText] = useState<string>("");
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [isParsingKeys, setIsParsingKeys] = useState(false);
  const [isGeneratingMilliy, setIsGeneratingMilliy] = useState(false);
  const [milliyStatusMessage, setMilliyStatusMessage] = useState("");

  const [keys32, setKeys32] = useState<Record<number, string>>(() => {
    const defaults: Record<number, string> = {
      1: "B", 2: "A", 3: "C", 4: "C", 5: "C", 6: "B", 7: "D", 8: "A", 9: "C", 10: "D",
      11: "C", 12: "C", 13: "A", 14: "C", 15: "D", 16: "C", 17: "B", 18: "B", 19: "D", 20: "C",
      21: "B", 22: "B", 23: "D", 24: "C", 25: "A", 26: "B", 27: "C", 28: "A", 29: "C", 30: "C",
      31: "B", 32: "A"
    };
    return defaults;
  });

  const [keysMatching, setKeysMatching] = useState<Record<number, string>>({
    33: "B", 34: "F", 35: "C"
  });

  const [keysWritten, setKeysWritten] = useState<Record<number, { a: string; b: string }>>({
    36: { a: "4", b: "8/3" },
    37: { a: "4", b: "6\\pi" },
    38: { a: "32\\sqrt{3}", b: "9/(4\\sqrt{7})" },
    39: { a: "3/2", b: "3/2" },
    40: { a: "3/8", b: "27/2" },
    41: { a: "25/4", b: "1/2" },
    42: { a: "4", b: "7,4" },
    43: { a: "2\\sqrt{3}", b: "\\sqrt{35}" },
    44: { a: "\\sqrt{6}/3", b: "\\sqrt{3}" },
    45: { a: "11500000", b: "1800000" }
  });


  const [testData, setTestData] = useState<TestData>({
    title: "",
    description: "",
    subject: "Matematika",
    type: "milliy_sertifikat",
    price_cash: 0,
    price_educoin: 0,
    is_free: true,
    duration_minutes: 60,
    questions_count: 10,
    is_active: true,
    enable_warnings: false,
  });

  const [questions, setQuestions] = useState<Question[]>([]);

  const DEFAULT_BULK = `[MC]
O'zbekiston poytaxti qaysi shahar?
A) Samarqand
B) Toshkent *
C) Buxoro
D) Namangan
@exp:Savol poytaxt haqida
@points:10
@diff:2

---

[MC]
Quyidagi <b>qalin</b> va <i>qiya</i> matnlar, shuningdek, H<sub>2</sub>O kabi formulalar:
1. Birinchi qator
2. Ikkinchi qator
A) Variant 1
B) Variant 2 *
C) Variant 3
D) Variant 4

---

[PASSAGE]
Quyosh tizimidagi eng kichik sayyora – Merkuriy. Sayyora Rim xudosi Merkuriy nomi bilan atalgan.
[MC]
Merkuriy qaysi ma'buda nomi bilan atalgan?
A) Rim xudosi *
B) Yunon xudosi
C) Misr xudosi
D) Hind xudosi
@points:5

[TF]
Merkuriy eng katta sayyora.
Xato
@points:5
[ENDPASSAGE]

---

[MS]
O'zbekistondagi shaharlar?
A) Toshkent *
B) Samarqand *
C) Buxoro *
D) Qashqadaryo
@points:10

---

[TF]
Yer quyosh atrofida aylanadi.
To'g'ri
@points:5

---

[FB]
_ Toshkent _ O'zbekiston poytaxti.
Toshkent | Tashkent
Markaziy | poytaxt

---

[SA]
O'zbekiston poytaxti qaysi shahar?
Toshkent, Tashkent
@exp:Poytaxt Toshkent shahri

---

[NU]
Yer kuchlanishi tezligi necha m/s²?
9.8 | 0.1 | m/s²
@exp:9.8 m/s² atrofida

---

[ES]
O'zbekiston tarixi haqida insho yozing.
Kamida 100 so'z bo'lsin.
@diff:3

---

[MA]
Davlatlarni shaharlar bilan moslashtiring:
Toshkent - O'zbekiston
Moskva - Rossiya
Pekin - Xitoy

---

[OR]
Kichikdan kattaga tartiblang:
1-o'rin
2-o'rin
3-o'rin

---

[PR]
"Salom, dunyo!" dasturini yozing.
@lang:javascript
@code:console.log("Salom!")
@exp:Oddiy chiqarish`;

  const [bulkText, setBulkText] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [questionSearchQuery, setQuestionSearchQuery] = useState("");

  const compressImageFile = (rawFile: File, maxDim = 1000, quality = 0.75): Promise<File> => {
    return new Promise((resolve) => {
      if (!rawFile || !rawFile.type.startsWith("image/")) return resolve(rawFile);
      if (rawFile.size < 100 * 1024) return resolve(rawFile);

      const objectUrl = URL.createObjectURL(rawFile);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
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
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(rawFile);
      };
      img.src = objectUrl;
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

  const handleUploadFile = async (rawFile: File, qIndex: number) => {
    if (!rawFile || !rawFile.type.startsWith("image/")) {
      toast({ title: "Xatolik", description: "Faqat rasm fayllarini yuklash mumkin!", variant: "destructive" });
      return;
    }
    setIsUploadingImage(true);

    // Instant local preview for 0ms delay UI feedback
    const localPreviewUrl = URL.createObjectURL(rawFile);
    handleQuestionChange(qIndex, "question_image", localPreviewUrl);
    handleQuestionChange(qIndex, "image_url", localPreviewUrl);

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Yuklash vaqti cheklovi (Timeout)")), 8000)
    );

    try {
      // Compress client-side (<50ms)
      const file = await compressImageFile(rawFile);
      let finalUrl = "";

      // 1. Try Backend Proxy
      try {
        const formData = new FormData();
        formData.append("file", file);

        const uploadFetch = fetch("/api/storage/upload/question-images", {
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

      // 2. Try Direct Supabase Storage if Proxy didn't return URL
      if (!finalUrl) {
        try {
          const ext = file.name.split('.').pop() || 'png';
          const filePath = `mock_questions/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
          
          const sbUpload = supabase.storage
            .from('question-images')
            .upload(filePath, file, { upsert: true });

          const { data, error } = await Promise.race([sbUpload, timeoutPromise]);

          if (!error && data) {
            const { data: publicUrlData } = supabase.storage
              .from('question-images')
              .getPublicUrl(filePath);
            finalUrl = publicUrlData.publicUrl;
          }
        } catch (sbErr) {
          console.warn("Direct Supabase storage upload failed/skipped:", sbErr);
        }
      }

      // 3. Fallback to Base64 Data URL if network/storage upload fails or times out
      if (!finalUrl) {
        finalUrl = await readFileAsDataUrl(file);
      }

      handleQuestionChange(qIndex, "question_image", finalUrl);
      handleQuestionChange(qIndex, "image_url", finalUrl);
      toast({ title: "Muvaffaqiyatli", description: "Rasm muvaffaqiyatli saqlandi!" });
    } catch (err: any) {
      console.error("Image upload error:", err);
      toast({ title: "Xatolik", description: err.message || "Rasm yuklanmadi", variant: "destructive" });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handlePasteImage = async (e: React.ClipboardEvent, qIndex: number) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          await handleUploadFile(file, qIndex);
          toast({ title: "Ctrl+V Muvaffaqiyatli", description: "Rasm xotiradan (Ctrl+V) yuklandi!" });
          break;
        }
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent, qIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("image/")) {
        await handleUploadFile(file, qIndex);
        toast({ title: "Drag & Drop Muvaffaqiyatli", description: "Rasm sudrab kelib (Drag & Drop) yuklandi!" });
      } else {
        toast({ title: "Xatolik", description: "Faqat rasm fayllarini yuklash mumkin!", variant: "destructive" });
      }
    }
  };

  const handleApplyBulk = () => {
    try {
      const parsed = parseBulkQuestions(bulkText);
      if (parsed.length === 0) {
        toast({ title: "Xatolik", description: "Matnda savollar topilmadi", variant: "destructive" });
        return;
      }
      setQuestions(parsed);
      setTestData((prev) => ({ ...prev, questions_count: parsed.length }));
      setActiveTab("questions");
      toast({ title: "Muvaffaqiyatli", description: `${parsed.length} ta savol ajratildi va yuklandi!` });
    } catch (err: any) {
      toast({ title: "Xatolik", description: "Matn formatida xatolik yuz berdi", variant: "destructive" });
    }
  };

  const handleMilliyPdfUpload = async (file: File) => {
    if (!file) return;
    setMilliyPdfFile(file);
    setIsExtractingPdf(true);
    setMilliyStatusMessage("PDF fayldan matn o'qilmoqda...");
    try {
      const text = await extractPdfText(file);
      setMilliyPdfText(text);
      toast({ title: "Muvaffaqiyatli", description: "Savollar PDF-fayli matni o'qib olindi!" });
    } catch (err: any) {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    } finally {
      setIsExtractingPdf(false);
      setMilliyStatusMessage("");
    }
  };

  const handleMilliyKeyUpload = async (file: File) => {
    if (!file) return;
    setMilliyKeyFile(file);
    setIsParsingKeys(true);
    setMilliyStatusMessage("Javoblar kaliti tahlil qilinmoqda (OCR & AI)...");
    try {
      if (file.type === "application/pdf") {
        const text = await extractPdfText(file);
        const parsedRaw = parseKeyTextFromRaw(text);
        if (Object.keys(parsedRaw.newKeys32).length > 0) {
          setKeys32(prev => ({ ...prev, ...parsedRaw.newKeys32 }));
        }
        if (Object.keys(parsedRaw.newKeysMatching).length > 0) {
          setKeysMatching(prev => ({ ...prev, ...parsedRaw.newKeysMatching }));
        }
        if (Object.keys(parsedRaw.newKeysWritten).length > 0) {
          setKeysWritten(prev => ({ ...prev, ...parsedRaw.newKeysWritten }));
        }
        await parseKeyTextWithAi(text);
      } else if (file.type.startsWith("image/")) {
        // Run Client-side Tesseract OCR on the uploaded image
        setMilliyStatusMessage("Rasmdagi jadval va javoblar (OCR) o'qilmoqda...");
        const ocrRes = await Tesseract.recognize(file, 'eng', {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setMilliyStatusMessage(`Rasmdan matn ajratilmoqda (${Math.round((m.progress || 0) * 100)}%)...`);
            }
          }
        });
        const ocrText = ocrRes.data.text || "";
        console.log("OCR Extracted Text from Image:", ocrText);

        const parsedRaw = parseKeyTextFromRaw(ocrText);
        let extractedCount = Object.keys(parsedRaw.newKeys32).length + Object.keys(parsedRaw.newKeysMatching).length + Object.keys(parsedRaw.newKeysWritten).length;

        if (extractedCount > 0) {
          if (Object.keys(parsedRaw.newKeys32).length > 0) setKeys32(prev => ({ ...prev, ...parsedRaw.newKeys32 }));
          if (Object.keys(parsedRaw.newKeysMatching).length > 0) setKeysMatching(prev => ({ ...prev, ...parsedRaw.newKeysMatching }));
          if (Object.keys(parsedRaw.newKeysWritten).length > 0) setKeysWritten(prev => ({ ...prev, ...parsedRaw.newKeysWritten }));
          toast({ title: "Muvaffaqiyatli!", description: `Rasmdan ${extractedCount} ta kalit avtomatik ajratildi!` });
        }

        // Also pass OCR text to AI for precision parsing
        await parseKeyTextWithAi(ocrText);
      } else {
        toast({ title: "Xatolik", description: "Faqat PDF yoki JPG/PNG rasm yuklang", variant: "destructive" });
        setIsParsingKeys(false);
      }
    } catch (err: any) {
      console.error("Key upload processing error:", err);
      toast({ title: "Xatolik", description: "Kalitni o'qishda xatolik: " + err.message, variant: "destructive" });
      setIsParsingKeys(false);
    }
  };

  const parseKeyTextWithAi = async (text: string) => {
    try {
      const response = await api.ai.chat([
        {
          role: "system",
          content: `Sen Milliy Sertifikat javoblar kalitini tahlil qiluvchi AI ekspertisan.
Javoblarni JSON formatida qaytar:
{
  "keys32": { "1": "B", "2": "A", "3": "C", ..., "32": "A" },
  "keysMatching": { "33": "B", "34": "F", "35": "C" },
  "keysWritten": {
    "36": { "a": "4", "b": "8/3" },
    ...
    "45": { "a": "11500000", "b": "1800000" }
  }
}`
        },
        { role: "user", content: `Kalit matni:\n${text}` }
      ]);
      const content = response.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.keys32) setKeys32(prev => ({ ...prev, ...parsed.keys32 }));
        if (parsed.keysMatching) setKeysMatching(prev => ({ ...prev, ...parsed.keysMatching }));
        if (parsed.keysWritten) setKeysWritten(prev => ({ ...prev, ...parsed.keysWritten }));
        toast({ title: "Muvaffaqiyatli!", description: "Javoblar kaliti o'qib olindi!" });
      }
    } catch (err: any) {
      console.warn("AI Key parse note:", err);
    } finally {
      setIsParsingKeys(false);
      setMilliyStatusMessage("");
    }
  };

  const parseKeyImageWithAi = async (base64Url: string) => {
    try {
      const response = await api.ai.chat([
        {
          role: "system",
          content: `Sen Milliy Sertifikat javoblar kaliti rasm (table screenshot) ni tahlil qiluvchi AI ekspertisan.
Rasmda jadval bor: T/R 1..32 (Yopiq A,B,C,D), T/R 33..35 (Moslashtirish B,F,C), T/R 36..45 (Ochiq test a va b shartlar).
Javoblarni JSON formatida qaytar:
{
  "keys32": { "1": "B", "2": "A", ..., "32": "A" },
  "keysMatching": { "33": "B", "34": "F", "35": "C" },
  "keysWritten": {
    "36": { "a": "4", "b": "8/3" },
    "37": { "a": "4", "b": "6pi" },
    ...
    "45": { "a": "11500000", "b": "1800000" }
  }
}`
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Mana 2-variant kalitlari rasmi. Undagi BARCHA 45 ta savollar kalitini JSON formatda chiqar." },
            { type: "image_url", image_url: { url: base64Url } }
          ] as any
        }
      ]);
      const content = response.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.keys32) setKeys32(prev => ({ ...prev, ...parsed.keys32 }));
        if (parsed.keysMatching) setKeysMatching(prev => ({ ...prev, ...parsed.keysMatching }));
        if (parsed.keysWritten) setKeysWritten(prev => ({ ...prev, ...parsed.keysWritten }));
        toast({ title: "Muvaffaqiyatli", description: "Javoblar kaliti rasmdan aniqlandi!" });
      }
    } catch (err: any) {
      toast({ title: "Eslatma", description: "Kalit rasmini o'qishda namunaviy kalitlar saqlandi." });
    } finally {
      setIsParsingKeys(false);
      setMilliyStatusMessage("");
    }
  };

  const generateMilliyMockTest = async () => {
    if (!milliyPdfText.trim()) {
      toast({ title: "Xatolik", description: "Iltimos, avval Savollar PDF-faylini yuklang!", variant: "destructive" });
      return;
    }

    setIsGeneratingMilliy(true);
    setMilliyStatusMessage("AI 43 ta savol kartasini yaratmoqda va shakllantirmoqda...");

    try {
      const systemPrompt = `Sen Milliy Sertifikat test savollarini shakllantiruvchi AI ekspertisan.
Senga 45 ta topshiriqdan iborat PDF matni hamda 45 ta savolning javoblar kaliti beriladi.

SENING VAZIFANG: QAT'IY RAVISHDAGI EXACTLY 43 TA SAVOL KARTASINI JSON ARRAY FORMATIDA YARATISH.

SAVOL TURLARI VA RAQAMLASH STRUCTURESI:
1. Savollar 1 dan 32 gacha (32 TA YOPIQ TEST - single choice):
   - question_number: 1, 2, ..., 32
   - type: "multiple_choice"
   - question_text: PDF dagi savol matni va formulalari (LaTeX math $...$ yoki $$...$$ bilan)
   - metadata: { options: ["A varianti matni", "B varianti matni", "C varianti matni", "D varianti matni"] }
   - correct_answer: javoblar kalitidagi to'g'ri variant harfi (A, B, C, D)
   - points_a: 1.5

2. Savol 33 (1 TA MOSLASHTIRISH TEST - PDF dagi 33, 34 va 35 savollarni birlashtiradi):
   - question_number: 33
   - type: "matching"
   - question_text: Prizma va silindr yoki moslashtirish topshirig'ining umumiy sharti hamda 33, 34, 35 savollarining to'liq matnlari
   - metadata: {
       left: [
         "33. Prizmaning balandligi bilan silindrning balandligi teng. Trapetsiyaning kichik asosi silindrning radiusidan necha marta katta?",
         "34. Trapetsiyaning kichik asosi silindrning radiusidan 2 marta katta. Silindrning balandligi prizmaning balandligiga nisbatini toping.",
         "35. Trapetsiyaning kichik asosi silindrning radiusidan 2 marta katta. Prizma asosining yuzi 6 ga teng. Silindrning asosining yuzini toping."
       ],
       right: ["A) √3", "B) √2", "C) 3", "D) 4", "E) 5", "F) 2"],
       options: ["√3", "√2", "3", "4", "5", "2"]
     }
   - correct_answer: { "33": "${keysMatching[33] || 'B'}", "34": "${keysMatching[34] || 'F'}", "35": "${keysMatching[35] || 'C'}" }
   - points_a: 4.5

3. Savollar 34 dan 43 gacha (10 TA OCHIQ TEST - PDF dagi 36, 37, ..., 45 savollarga mos keladi):
   - question_number: 34, 35, ..., 43 (PDF dagi 36..45 savollar)
   - type: "fill_blanks"
   - question_text: PDF dagi savol matni, masalan:
     "36. Tenglamani yeching:\n$$\\begin{cases} \\frac{4}{x+y} + \\frac{4}{x-y} = 3 \\\\ (x+y)^2 + (x-y)^2 = 20 \\end{cases}$$\na) Tenglamalar sistemasining nechta juft (x; y) yechimi bor?\nJavob: a)\nb) Agar tenglamaning yechimlari (x1; y1), (x2; y2), ... bo'lsa, x1 + x2 + ... ni toping.\nJavob: b)"
   - metadata: {
       blanks: [
         { key: "a", label: "A)", alternatives: [ "a javobi" ] },
         { key: "b", label: "B)", alternatives: [ "b javobi" ] }
       ]
     }
   - correct_answer: { "a": [ "a javobi" ], "b": [ "b javobi" ] }
   - points_a: 3.5

JAMI QAT'IY 43 TA SAVOL KARTASI CHIQARILISHI SHART! Hech bir savolni tushirib qoldirma.
FAQAT JSON ARRAY CHIQAR.`;

      const userContent = `PDF MATNI:\n${milliyPdfText}\n\nJAVOBLAR KALITI:\n1-32 Yopiq: ${JSON.stringify(keys32)}\n33-35 Moslashtirish: ${JSON.stringify(keysMatching)}\n36-45 Ochiq: ${JSON.stringify(keysWritten)}`;

      const response = await api.ai.chat([
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent }
      ]);

      const content = response.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\[[\s\S]*\]/);

      let parsedQuestions: any[] = [];
      if (jsonMatch) {
        try {
          parsedQuestions = JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.warn("AI JSON parse error, fallback is being used", e);
        }
      }

      if (!parsedQuestions || parsedQuestions.length === 0) {
        parsedQuestions = fallbackMilliyParser(milliyPdfText, keys32, keysMatching, keysWritten, testData.subject);
      }

      const formatted = parsedQuestions.map((q: any, idx: number) => ({
        question_number: idx + 1,
        question_text: q.question_text || `Savol ${idx + 1}`,
        question_subtext: q.question_subtext || "",
        question_image: q.question_image || "",
        type: q.type || (idx < 32 ? "multiple_choice" : idx === 32 ? "matching" : "fill_blanks"),
        metadata: q.metadata || {},
        correct_answer: q.correct_answer || (idx < 32 ? (keys32[idx + 1] || "A") : idx === 32 ? keysMatching : keysWritten[idx + 2] || { a: [""], b: [""] }),
        explanation: q.explanation || "",
        points_a: q.points_a || (idx < 32 ? 1.5 : idx === 32 ? 4.5 : 3.5),
        points_b: 0,
        difficulty: q.difficulty || 1,
      }));

      setQuestions(formatted);
      setTestData(prev => ({ ...prev, questions_count: formatted.length, type: "milliy_sertifikat" }));
      setActiveTab("questions");
      toast({
        title: "Muvaffaqiyatli!",
        description: `${formatted.length} ta Milliy Sertifikat savollari muvaffaqiyatli shakllantirildi va yuklandi!`,
      });
    } catch (err: any) {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    } finally {
      setIsGeneratingMilliy(false);
      setMilliyStatusMessage("");
    }
  };


  useEffect(() => {
    if (id) {
      const fetchData = async () => {
        let { data: test } = await (supabase as any)
          .from("mock_tests")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (!test) {
          const { data: bySlug } = await (supabase as any)
            .from("mock_tests")
            .select("*")
            .eq("slug", id)
            .maybeSingle();
          test = bySlug;
        }

        if (!test) {
          const { data: allMockTests } = await (supabase as any)
            .from("mock_tests")
            .select("*");
          if (allMockTests && allMockTests.length > 0) {
            test = (allMockTests as any[]).find((t) => {
              const generated = buildMockTestSlug(t);
              const simpleTitleSlug = t.title ? slugify(t.title) : "";
              return generated === id || simpleTitleSlug === id || t.slug === id;
            }) || null;
          }
        }

        if (test) {
          setTestData(test);
          const actualId = test.id;
          const { data: qs } = await (supabase as any)
            .from("mock_test_questions")
            .select("*")
            .eq("test_id", actualId)
            .order("question_number", { ascending: true });
          if (qs && qs.length > 0) {
            let unflattened: any[] = [];
            let currentPassageGroup: any = null;
            
            qs.forEach((q: any) => {
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

            setQuestions(unflattened);
            setTestData((prev) => ({ ...prev, questions_count: qs.length }));
          }
        }
      };
      fetchData();
    }
  }, [id]);

  useEffect(() => {
    if (!id && questions.length === 0) {
      const count = testData.questions_count || 10;
      setQuestions(
        Array.from({ length: count }, (_, i) => ({
          question_number: i + 1,
          question_text: "",
          question_image: "",
          type: "multiple_choice" as QuestionType,
          metadata: { options: ["", "", "", ""] },
          correct_answer: "A",
          explanation: "",
          points_a: null,
          points_b: null,
        }))
      );
    }
  }, [testData.questions_count, id]);

  const handleTestChange = (field: keyof TestData, value: any) => {
    setTestData((prev) => ({ ...prev, [field]: value }));
  };

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
    setTestData((prev) => ({
      ...prev,
      questions_count: questions.length + 1,
    }));
    setActiveQuestion(questions.length);
  };

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) return;
    setQuestions((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      return updated.map((q, i) => ({ ...q, question_number: i + 1 }));
    });
    setTestData((prev) => ({
      ...prev,
      questions_count: questions.length - 1,
    }));
    if (activeQuestion >= questions.length - 1) {
      setActiveQuestion(Math.max(0, questions.length - 2));
    }
  };

  const handleQuestionsCountChange = (count: number) => {
    if (count < 1) return;
    setTestData((prev) => ({ ...prev, questions_count: count }));
    if (count > questions.length) {
      const newQuestions = Array.from(
        { length: count - questions.length },
        (_, i) => ({
          question_number: questions.length + i + 1,
          question_text: "",
          question_image: "",
          type: "multiple_choice" as QuestionType,
          metadata: { options: ["", "", "", ""] },
          correct_answer: "A",
          explanation: "",
          points_a: null,
          points_b: null,
        })
      );
      setQuestions((prev) => [...prev, ...newQuestions]);
    } else {
      setQuestions((prev) => prev.slice(0, count));
      if (activeQuestion >= count) setActiveQuestion(Math.max(0, count - 1));
    }
  };

  const saveTest = async () => {
    if (!testData.title.trim()) {
      toast({
        title: "Xatolik",
        description: "Test nomini kiriting",
        variant: "destructive",
      });
      return;
    }

    if (isUploadingImage) {
      toast({
        title: "Kuting",
        description: "Rasm yuklanmoqda, iltimos yuklanish tugashini kuting...",
        variant: "default",
      });
      return;
    }

    setIsSubmitting(true);

    const saveTimeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Saqlash vaqti tugadi (Timeout)")), 15000)
    );

    try {
      let savedId = id;

      const flattenedQuestions: any[] = [];
      let qNum = 1;
      questions.forEach((q) => {
        if (q.type === "reading_passage" && q.sub_questions && q.sub_questions.length > 0) {
          const passageId = q.id || (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString());
          q.sub_questions.forEach((sq) => {
            flattenedQuestions.push({
              ...sq,
              question_number: qNum++,
              metadata: {
                ...sq.metadata,
                passage_id: passageId,
                passage_text: q.question_text,
              },
            });
          });
        } else if (q.type !== "reading_passage") {
          flattenedQuestions.push({
            ...q,
            question_number: qNum++,
          });
        }
      });

      const actualQuestionsCount = flattenedQuestions.length;

      // 1. Try Backend Admin API Proxy (/api/admin/mock-tests/save)
      try {
        const generatedSlug = buildMockTestSlug({
          subject: testData.subject,
          title: testData.title,
          questions_count: actualQuestionsCount,
        });

        const fetchPromise = fetch("/api/admin/mock-tests/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id,
            testData: {
              ...testData,
              slug: generatedSlug,
              questions_count: actualQuestionsCount,
            },
            questions: flattenedQuestions,
          }),
          credentials: "include",
        }).then(async (res) => {
          const json = await res.json();
          if (!res.ok) throw new Error(json.error || `HTTP error ${res.status}`);
          return json;
        });

        const resData = await Promise.race([fetchPromise, saveTimeout]);
        if (resData && resData.success) {
          savedId = resData.id;
        }
      } catch (apiErr: any) {
        console.warn("Backend API save failed/skipped, trying client Supabase...", apiErr);

        // 2. Client Supabase fallback (Sanitized payload)
        const generatedSlug = buildMockTestSlug({
          subject: testData.subject,
          title: testData.title,
          questions_count: actualQuestionsCount,
        });

        const safePayload = {
          title: testData.title,
          description: testData.description || '',
          subject: testData.subject || 'Matematika',
          type: testData.type || 'milliy_sertifikat',
          price_cash: Number(testData.price_cash) || 0,
          price_educoin: Number(testData.price_educoin) || 0,
          is_free: Boolean(testData.is_free),
          duration_minutes: Number(testData.duration_minutes) || 60,
          questions_count: actualQuestionsCount,
          is_active: testData.is_active !== undefined ? Boolean(testData.is_active) : true,
          slug: generatedSlug,
        };

        if (id) {
          const { error } = await (supabase as any)
            .from("mock_tests")
            .update(safePayload)
            .eq("id", id);
          if (error) throw error;
        } else {
          const { data, error } = await (supabase as any)
            .from("mock_tests")
            .insert(safePayload)
            .select()
            .single();
          if (error) throw error;
          savedId = data.id;
        }

        if (savedId) {
          await (supabase as any)
            .from("mock_test_questions")
            .delete()
            .eq("test_id", savedId);

          const qsWithTestId = flattenedQuestions.map((q) => {
            let img = q.question_image || q.image_url || "";
            if (img.startsWith("blob:")) img = "";
            return {
              test_id: savedId,
              question_number: q.question_number,
              question_text: q.question_text || "",
              question_subtext: q.question_subtext || "",
              question_image: img,
              type: q.type,
              metadata: q.metadata,
              correct_answer: q.correct_answer,
              explanation: q.explanation || "",
              points_a: q.points_a,
              points_b: q.points_b,
              difficulty: q.difficulty || 1,
            };
          });

          const { error: qError } = await (supabase as any)
            .from("mock_test_questions")
            .insert(qsWithTestId);
          if (qError) throw qError;
        }
      }

      toast({
        title: "Muvaffaqiyatli",
        description: id ? "Mock test yangilandi va saqlandi" : "Mock test yaratildi va saqlandi",
      });
      navigate("/admin/mock-tests");
    } catch (err: any) {
      console.error("Save test error:", err);
      toast({
        title: "Xatolik",
        description: err.message || "Testni saqlashda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const curQ = questions[activeQuestion];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin/mock-tests")}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">
              {id ? "Mock testni tahrirlash" : "Yangi mock test"}
            </h1>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              {id ? "Test ma'lumotlarini va savollarini tahrirlang" : "Yangi mock test yarating"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/admin/mock-tests")}
            className="px-4 py-2 rounded-lg text-[12px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            Bekor qilish
          </button>
          <button
            onClick={saveTest}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[12px] font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {isSubmitting ? (
              <RefreshIcon className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-[16px]">save</span>
            )}
            Saqlash
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-white/5 rounded-lg w-fit overflow-x-auto">
        {[
          { key: "info", label: "Ma'lumotlar", icon: "description" },
          { key: "questions", label: `Savollar (${questions.length})`, icon: "quiz" },
          { key: "bulk", label: "Matnli yuklash", icon: "bolt" },
          { key: "milliy_pdf", label: "📄 Milliy Sertifikat (PDF + Kalit)", icon: "picture_as_pdf" },
          { key: "preview", label: "Ko'rib chiqish", icon: "visibility" },
          { key: "results", label: "📊 Natijalar", icon: "analytics" },
        ].map((tab) => {
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-[12px] font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-white dark:bg-[#080C14] shadow-sm text-slate-900 dark:text-white font-semibold"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <span className={`material-symbols-outlined text-[16px] ${activeTab === tab.key ? "text-slate-900 dark:text-white font-semibold" : "text-slate-400"}`}>
                {tab.icon}
              </span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === "info" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl p-5 space-y-4">
            <h3 className="text-[12px] font-semibold text-slate-900 dark:text-white">
              Asosiy ma'lumotlar
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Test nomi
                </label>
                <input
                  type="text"
                  value={testData.title}
                  onChange={(e) => handleTestChange("title", e.target.value)}
                  placeholder="Milliy Sertifikat Matematika - Iyun 2026"
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] text-[12px] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Tavsif
                </label>
                <textarea
                  value={testData.description || ""}
                  onChange={(e) =>
                    handleTestChange("description", e.target.value)
                  }
                  placeholder="Test haqida qisqa ma'lumot..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] text-[12px] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Fan
                  </label>
                  <select
                    value={testData.subject}
                    onChange={(e) =>
                      handleTestChange("subject", e.target.value)
                    }
                    className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] text-[12px] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10"
                  >
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Turi
                  </label>
                  <select
                    value={testData.type}
                    onChange={(e) => handleTestChange("type", e.target.value)}
                    className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] text-[12px] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10"
                  >
                    {TEST_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Davomiylik (daqiqa)
                  </label>
                  <input
                    type="number"
                    value={testData.duration_minutes}
                    onChange={(e) =>
                      handleTestChange(
                        "duration_minutes",
                        Number(e.target.value)
                      )
                    }
                    className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] text-[12px] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Savollar soni
                  </label>
                  <input
                    type="number"
                    value={testData.questions_count}
                    onChange={(e) =>
                      handleQuestionsCountChange(Number(e.target.value))
                    }
                    className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] text-[12px] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={testData.is_active}
                    onChange={(e) =>
                      handleTestChange("is_active", e.target.checked)
                    }
                    className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900/10"
                  />
                  <label
                    htmlFor="is_active"
                    className="text-[12px] font-medium text-slate-700 dark:text-slate-300"
                  >
                    Faol
                  </label>
                </div>

                <div className="flex items-start gap-2.5 p-3.5 bg-amber-50/70 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl mt-1">
                  <input
                    type="checkbox"
                    id="enable_warnings"
                    checked={testData.enable_warnings ?? false}
                    onChange={(e) =>
                      handleTestChange("enable_warnings", e.target.checked)
                    }
                    className="w-4 h-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500/10 mt-0.5"
                  />
                  <div>
                    <label
                      htmlFor="enable_warnings"
                      className="text-[12px] font-bold text-amber-900 dark:text-amber-300 block cursor-pointer"
                    >
                      Boshqa oynaga o'tganda ogohlantirishlar ko'rsatilsinmi?
                    </label>
                    <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-normal mt-0.5">
                      Agar yoqilsa, o'quvchi boshqa dasturga o'tganda 10 soniyalik taymer va ogohlantirish oynasi chiqadi. Agar o'chirilsa, hech qanday ogohlantirish chiqmaydi.
                    </p>
                  </div>
                </div>
              </div>

              {/* Time Window & Max Attempts Control */}
              <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] space-y-3">
                <h4 className="text-[12px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-sky-500">schedule</span>
                  Vaqt Oralig'i va Urinishlar Cheklovi
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Boshlanish vaqti (Ruxsat berilgan)
                    </label>
                    <input
                      type="datetime-local"
                      value={testData.available_from ? new Date(testData.available_from).toISOString().slice(0, 16) : ""}
                      onChange={(e) =>
                        handleTestChange("available_from", e.target.value ? new Date(e.target.value).toISOString() : null)
                      }
                      className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] text-[12px] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Tugash vaqti (Ruxsat berilgan)
                    </label>
                    <input
                      type="datetime-local"
                      value={testData.available_until ? new Date(testData.available_until).toISOString().slice(0, 16) : ""}
                      onChange={(e) =>
                        handleTestChange("available_until", e.target.value ? new Date(e.target.value).toISOString() : null)
                      }
                      className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] text-[12px] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Maksimal urinishlar soni (Har bir o'quvchi uchun)
                  </label>
                  <input
                    type="number"
                    placeholder="0 = Cheksiz"
                    value={testData.max_attempts ?? 0}
                    onChange={(e) =>
                      handleTestChange("max_attempts", Math.max(0, Number(e.target.value)))
                    }
                    className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] text-[12px] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Masalan: 3 kiritilsa, o'quvchi bu testni ko'pi bilan 3 marta ishlay oladi. 0 kiritilsa cheksiz.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[12px] font-semibold text-slate-900 dark:text-white">
                Narx va to'lov
              </h3>
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-white/5 rounded-lg">
                <button
                  onClick={() => handleTestChange("is_free", true)}
                  className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all ${
                    testData.is_free
                      ? "bg-white dark:bg-[#080C14] shadow-sm text-emerald-600"
                      : "text-slate-400"
                  }`}
                >
                  Bepul
                </button>
                <button
                  onClick={() => handleTestChange("is_free", false)}
                  className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all ${
                    !testData.is_free
                      ? "bg-white dark:bg-[#080C14] shadow-sm text-amber-600"
                      : "text-slate-400"
                  }`}
                >
                  Pullik
                </button>
              </div>
            </div>

            <div
              className={`space-y-3 transition-all ${
                testData.is_free
                  ? "opacity-30 pointer-events-none"
                  : "opacity-100"
              }`}
            >
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Narx (so'm)
                </label>
                <input
                  type="number"
                  value={testData.price_cash}
                  onChange={(e) =>
                    handleTestChange("price_cash", Number(e.target.value))
                  }
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] text-[12px] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Narx (educoin)
                </label>
                <input
                  type="number"
                  value={testData.price_educoin}
                  onChange={(e) =>
                    handleTestChange("price_educoin", Number(e.target.value))
                  }
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] text-[12px] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "questions" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          <div className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl overflow-hidden max-h-[calc(100vh-200px)] flex flex-col">
            <div className="p-3 border-b border-slate-100 dark:border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Savollar ({questions.length})
                </span>
                <button
                  onClick={addQuestion}
                  className="p-1 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors flex items-center justify-center"
                  title="Yangi savol qo'shish"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                </button>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined text-[16px] text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2">
                  search
                </span>
                <input
                  type="text"
                  value={questionSearchQuery}
                  onChange={(e) => setQuestionSearchQuery(e.target.value)}
                  placeholder="Savol № yoki matnidan izlash..."
                  className="w-full h-8 pl-8 pr-7 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] text-[11px] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                {questionSearchQuery && (
                  <button
                    onClick={() => setQuestionSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {questions
                .map((q, realIdx) => ({ q, realIdx }))
                .filter(({ q, realIdx }) => {
                  if (!questionSearchQuery.trim()) return true;
                  const query = questionSearchQuery.toLowerCase().trim();
                  const numStr = String(realIdx + 1);
                  const textStr = (q.question_text || "").toLowerCase();
                  const typeStr = (q.type || "").toLowerCase();
                  return numStr === query || numStr.includes(query) || textStr.includes(query) || typeStr.includes(query);
                })
                .map(({ q, realIdx }) => {
                  const isSelected = activeQuestion === realIdx;
                  return (
                    <button
                      key={realIdx}
                      onClick={() => setActiveQuestion(realIdx)}
                      className={`w-full p-2 rounded-lg border text-left transition-all flex items-center gap-2.5 ${
                        isSelected
                          ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm"
                          : q.question_text
                          ? "bg-emerald-50/60 dark:bg-emerald-500/10 border-emerald-300/60 dark:border-emerald-800/60 text-slate-800 dark:text-slate-200 hover:bg-emerald-100/50"
                          : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/[0.06] text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-md font-mono text-[11px] font-bold flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300"
                      }`}>
                        {realIdx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium truncate leading-tight">
                          {q.question_text || "Savol matni kiritilmagan"}
                        </p>
                        <span className="text-[9px] uppercase font-mono opacity-60">
                          {q.type}
                        </span>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>

          {curQ && (
            <div className="lg:col-span-3 space-y-4">
              <div className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center text-[11px] font-bold">
                      {activeQuestion + 1}
                    </span>
                    <span className="text-[12px] font-semibold text-slate-900 dark:text-white">
                      Savolni tahrirlash
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={curQ.type}
                      onChange={(e) =>
                        handleQuestionChange(activeQuestion, "type", e.target.value)
                      }
                      className="h-8 px-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] text-[11px] text-slate-700 dark:text-slate-300 focus:outline-none"
                    >
                      {QUESTION_TYPES.map((qt) => (
                        <option key={qt.value} value={qt.value}>
                          {qt.label}
                        </option>
                      ))}
                    </select>
                    {questions.length > 1 && (
                      <button
                        onClick={() => removeQuestion(activeQuestion)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex items-center justify-center"
                        title="Savolni o'chirish"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-5 space-y-5">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Savol matni
                    </label>
                    <textarea
                      value={curQ.question_text}
                      onChange={(e) =>
                        handleQuestionChange(
                          activeQuestion,
                          "question_text",
                          e.target.value
                        )
                      }
                      placeholder="Savol matnini kiriting..."
                      rows={6}
                      className="w-full px-3.5 py-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] text-[13px] leading-relaxed text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10 resize-y min-h-[140px]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Qo'shimcha matn / Kontekst (matnli parcha, topshiriq sharti) (ixtiyoriy)
                    </label>
                    <textarea
                      value={curQ.question_subtext || ""}
                      onChange={(e) =>
                        handleQuestionChange(
                          activeQuestion,
                          "question_subtext",
                          e.target.value
                        )
                      }
                      placeholder="Matnli parcha yoki qo'shimcha shartlar..."
                      rows={4}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] text-[12px] leading-relaxed text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10 resize-y min-h-[90px]"
                    />
                  </div>

                  <div
                    onPaste={(e) => handlePasteImage(e, activeQuestion)}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, activeQuestion)}
                  >
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center justify-between">
                      <span>Savol rasmi (Faylni sudrab tashlang, kompyuterdan tanlang yoki Ctrl+V bosing)</span>
                      <span className="text-[10px] text-emerald-600 font-mono flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">content_paste</span>
                        <span>Drag & Drop / Ctrl+V qo'llab-quvvatlanadi</span>
                      </span>
                    </label>

                    {(curQ.question_image || curQ.image_url) ? (
                      <div className="relative group rounded-xl border border-slate-200 dark:border-white/[0.06] p-3 bg-slate-50 dark:bg-white/5 flex items-center gap-4">
                        <img
                          src={curQ.question_image || curQ.image_url}
                          alt="Savol rasmi"
                          className="w-20 h-20 object-contain rounded-lg border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-slate-900"
                        />
                        <div className="flex-1 min-w-0 space-y-1">
                          <p className="text-[11px] font-medium text-slate-900 dark:text-white truncate">
                            {curQ.question_image || curQ.image_url}
                          </p>
                          <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">check_circle</span>
                            <span>Rasm yuklangan va saqlangan</span>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            handleQuestionChange(activeQuestion, "question_image", "");
                            handleQuestionChange(activeQuestion, "image_url", "");
                          }}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors shrink-0 flex items-center justify-center"
                          title="Rasmni o'chirish"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    ) : (
                      <div
                        className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                          isDragging
                            ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-500/10 scale-[1.01] shadow-lg"
                            : "border-slate-200 dark:border-white/[0.08] hover:border-emerald-500/50 bg-slate-50/50 dark:bg-white/[0.02]"
                        }`}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          id={`file-upload-${activeQuestion}`}
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUploadFile(file, activeQuestion);
                            e.target.value = "";
                          }}
                        />
                        <label
                          htmlFor={`file-upload-${activeQuestion}`}
                          className="cursor-pointer flex flex-col items-center justify-center gap-2"
                        >
                          {isUploadingImage ? (
                            <RefreshIcon className="w-7 h-7 animate-spin text-emerald-600" />
                          ) : (
                            <span className={`material-symbols-outlined text-[36px] transition-transform ${isDragging ? "text-emerald-600 scale-125" : "text-slate-400 hover:text-emerald-600"}`}>
                              {isDragging ? "download" : "cloud_upload"}
                            </span>
                          )}
                          <div className="text-[13px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[18px] text-emerald-500">upload_file</span>
                            <span>
                              {isDragging
                                ? "Rasmni shu yerga tashlang!"
                                : isUploadingImage
                                ? "Rasm yuklanmoqda..."
                                : "Rasmni ushbu oynaga sudrab kelib tashlang (Drag & Drop)"}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            yoki <strong>kompyuterdan tanlash uchun bosing</strong> / <strong>Ctrl + V</strong> ni bosing
                          </div>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Dynamic Question Type Editor Controls */}
                  {(curQ.type === "multiple_choice" || curQ.type === "multiple_select") && (
                    <div className="space-y-3">
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400">
                        {curQ.type === "multiple_choice" ? "Variantlar (bitta to'g'ri javobni tanlang)" : "Variantlar (ko'p to'g'ri javoblarni belgilang)"}
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {["A", "B", "C", "D"].map((char, i) => {
                          const isSelected = curQ.type === "multiple_choice"
                            ? curQ.correct_answer === char
                            : Array.isArray(curQ.correct_answer) && curQ.correct_answer.includes(char);
                          return (
                            <div
                              key={char}
                              className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                                isSelected
                                  ? "border-emerald-500/50 bg-emerald-500/5"
                                  : "border-slate-100 dark:border-white/[0.06]"
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  if (curQ.type === "multiple_choice") {
                                    handleQuestionChange(activeQuestion, "correct_answer", char);
                                  } else {
                                    const currentArr = Array.isArray(curQ.correct_answer) ? curQ.correct_answer : [];
                                    const nextArr = currentArr.includes(char)
                                      ? currentArr.filter((c: string) => c !== char)
                                      : [...currentArr, char];
                                    handleQuestionChange(activeQuestion, "correct_answer", nextArr);
                                  }
                                }}
                                className={`w-7 h-7 rounded-md border flex items-center justify-center font-bold text-[10px] flex-shrink-0 ${
                                  isSelected
                                    ? "bg-emerald-600 text-white border-emerald-600"
                                    : "bg-slate-100 dark:bg-white/5 text-slate-400 border-slate-200 dark:border-white/[0.06]"
                                }`}
                              >
                                {char}
                              </button>
                              <input
                                type="text"
                                value={curQ.metadata?.options?.[i] || ""}
                                onChange={(e) => {
                                  const opts = [...(curQ.metadata?.options || [])];
                                  opts[i] = e.target.value;
                                  handleQuestionChange(activeQuestion, "metadata", {
                                    ...curQ.metadata,
                                    options: opts,
                                  });
                                }}
                                placeholder={`${char} varianti...`}
                                className="flex-1 bg-transparent outline-none text-[12px] font-medium text-slate-900 dark:text-white"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {curQ.type === "true_false" && (
                    <div className="space-y-2">
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400">
                        To'g'ri javobni tanlang
                      </label>
                      <div className="flex items-center gap-3">
                        {["To'g'ri", "Yolg'on"].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => handleQuestionChange(activeQuestion, "correct_answer", val)}
                            className={`px-4 py-2 rounded-lg border text-[12px] font-bold transition-all ${
                              curQ.correct_answer === val
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                                : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/[0.06] text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {curQ.type === "yes_no" && (
                    <div className="space-y-2">
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400">
                        To'g'ri javobni tanlang
                      </label>
                      <div className="flex items-center gap-3">
                        {["Ha", "Yo'q"].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => handleQuestionChange(activeQuestion, "correct_answer", val)}
                            className={`px-4 py-2 rounded-lg border text-[12px] font-bold transition-all ${
                              curQ.correct_answer === val
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                                : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/[0.06] text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {curQ.type === "short_answer" && (
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Qabul qilinadigan javoblar (vergul bilan ajrating)
                      </label>
                      <input
                        type="text"
                        value={Array.isArray(curQ.correct_answer) ? curQ.correct_answer.join(", ") : curQ.correct_answer || ""}
                        onChange={(e) => {
                          const arr = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                          handleQuestionChange(activeQuestion, "correct_answer", arr);
                        }}
                        placeholder="Masalan: Toshkent, Tashkent, Tashkent city"
                        className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] text-[12px] text-slate-900 dark:text-white"
                      />
                    </div>
                  )}

                  {curQ.type === "fill_blanks" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400">
                          Bo'sh joylar javoblari (muqobil javoblarni | bilan ajrating)
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const currentBlanks = getQuestionBlanks(curQ);
                            const nextKey = String.fromCharCode(97 + currentBlanks.length);
                            const nextBlanks = [...currentBlanks, { key: nextKey, label: `${nextKey.toUpperCase()})`, alternatives: [""] }];
                            handleQuestionChange(activeQuestion, "metadata", { ...curQ.metadata, blanks: nextBlanks });
                          }}
                          className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700"
                        >
                          <span className="material-symbols-outlined text-[16px]">add</span>
                          <span>Bo'sh joy qo'shish</span>
                        </button>
                      </div>

                      <div className="space-y-2">
                        {getQuestionBlanks(curQ).map((blank, idx) => (
                          <div key={blank.key} className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/5">
                            <span className="w-6 h-6 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] flex items-center justify-center shrink-0">
                              {blank.key.toUpperCase()}
                            </span>
                            <input
                              type="text"
                              value={blank.alternatives.join(" | ")}
                              onChange={(e) => {
                                const currentBlanks = getQuestionBlanks(curQ);
                                const parts = e.target.value.split("|").map((s) => s.trim());
                                currentBlanks[idx] = { ...blank, alternatives: parts };
                                handleQuestionChange(activeQuestion, "metadata", { ...curQ.metadata, blanks: currentBlanks });

                                const answersObj: Record<string, string[]> = {};
                                currentBlanks.forEach((b) => { answersObj[b.key] = b.alternatives; });
                                handleQuestionChange(activeQuestion, "correct_answer", answersObj);
                              }}
                              placeholder="Masalan: Toshkent | Tashkent"
                              className="flex-1 h-8 px-3 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[12px] text-slate-900 dark:text-white"
                            />
                            {getQuestionBlanks(curQ).length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const currentBlanks = getQuestionBlanks(curQ).filter((_, i) => i !== idx);
                                  handleQuestionChange(activeQuestion, "metadata", { ...curQ.metadata, blanks: currentBlanks });
                                }}
                                className="p-1.5 text-slate-400 hover:text-red-600 rounded-md"
                              >
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {curQ.type === "numerical" && (
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Aniq qiymat
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={curQ.metadata?.value ?? curQ.correct_answer ?? ""}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            handleQuestionChange(activeQuestion, "correct_answer", val);
                            handleQuestionChange(activeQuestion, "metadata", { ...curQ.metadata, value: val });
                          }}
                          placeholder="9.8"
                          className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] text-[12px] text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Xatolik chegarasi (Tolerance)
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={curQ.metadata?.tolerance ?? 0}
                          onChange={(e) => {
                            const tol = parseFloat(e.target.value) || 0;
                            handleQuestionChange(activeQuestion, "metadata", { ...curQ.metadata, tolerance: tol });
                          }}
                          placeholder="0.1"
                          className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] text-[12px] text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Birlik (Unit)
                        </label>
                        <input
                          type="text"
                          value={curQ.metadata?.unit || ""}
                          onChange={(e) => {
                            handleQuestionChange(activeQuestion, "metadata", { ...curQ.metadata, unit: e.target.value });
                          }}
                          placeholder="m/s²"
                          className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] text-[12px] text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  )}

                  {curQ.type === "programming" && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Dasturlash tili
                        </label>
                        <select
                          value={curQ.metadata?.lang || "javascript"}
                          onChange={(e) => handleQuestionChange(activeQuestion, "metadata", { ...curQ.metadata, lang: e.target.value })}
                          className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] text-[12px] text-slate-900 dark:text-white"
                        >
                          <option value="javascript">JavaScript</option>
                          <option value="python">Python</option>
                          <option value="cpp">C++</option>
                          <option value="java">Java</option>
                          <option value="csharp">C#</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Boshlang'ich kod / Namuna
                        </label>
                        <textarea
                          value={curQ.metadata?.code || curQ.correct_answer || ""}
                          onChange={(e) => {
                            handleQuestionChange(activeQuestion, "correct_answer", e.target.value);
                            handleQuestionChange(activeQuestion, "metadata", { ...curQ.metadata, code: e.target.value });
                          }}
                          rows={4}
                          placeholder="console.log('Salom!');"
                          className="w-full p-3 font-mono text-[12px] bg-slate-900 text-slate-100 rounded-lg border border-slate-800"
                        />
                      </div>
                    </div>
                  )}

                  {curQ.type === "reading_passage" && (
                    <div className="space-y-3 p-4 border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/20 rounded-xl">
                      <div className="flex items-center justify-between">
                        <label className="block text-[12px] font-bold text-emerald-800 dark:text-emerald-300">
                          Matnga tegishli savollar
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const currentSubQs = curQ.sub_questions || [];
                            const newSubQ: Question = {
                              question_number: currentSubQs.length + 1,
                              question_text: "",
                              type: "multiple_choice",
                              metadata: { options: ["", "", "", ""] },
                              correct_answer: "A",
                              points_a: null,
                              points_b: null,
                            };
                            handleQuestionChange(activeQuestion, "sub_questions", [...currentSubQs, newSubQ]);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[11px] font-bold hover:bg-emerald-700 transition-colors"
                        >
                          <PlusCircleIcon size={16} />
                          <span>Savol qo'shish</span>
                        </button>
                      </div>

                      <div className="space-y-4">
                        {(curQ.sub_questions || []).map((sq: any, sIdx: number) => (
                          <div key={sIdx} className="bg-white dark:bg-[#0A0F1A] border border-slate-200 dark:border-white/[0.06] rounded-xl p-4 space-y-3 shadow-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[11px] bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-md">
                                Savol {sIdx + 1}
                              </span>
                              <div className="flex items-center gap-2">
                                <select
                                  value={sq.type}
                                  onChange={(e) => {
                                    const newSubQs = [...(curQ.sub_questions || [])];
                                    newSubQs[sIdx] = { ...newSubQs[sIdx], type: e.target.value as QuestionType };
                                    handleQuestionChange(activeQuestion, "sub_questions", newSubQs);
                                  }}
                                  className="h-8 px-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] text-[11px] focus:outline-none"
                                >
                                  {QUESTION_TYPES.filter(t => t.value !== "reading_passage").map((qt) => (
                                    <option key={qt.value} value={qt.value}>{qt.label}</option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newSubQs = (curQ.sub_questions || []).filter((_: any, i: number) => i !== sIdx);
                                    handleQuestionChange(activeQuestion, "sub_questions", newSubQs);
                                  }}
                                  className="text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 p-1.5 rounded-md transition-colors"
                                >
                                  <TrashBinMinimalisticIcon size={18} />
                                </button>
                              </div>
                            </div>
                            <textarea
                              value={sq.question_text}
                              onChange={(e) => {
                                const newSubQs = [...(curQ.sub_questions || [])];
                                newSubQs[sIdx] = { ...newSubQs[sIdx], question_text: e.target.value };
                                handleQuestionChange(activeQuestion, "sub_questions", newSubQs);
                              }}
                              placeholder="Savol matni..."
                              rows={3}
                              className="w-full text-[12px] p-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] focus:outline-none"
                            />
                            
                            {sq.type === "multiple_choice" && (
                              <div className="grid grid-cols-2 gap-3 mt-2">
                                {(sq.metadata?.options || ["", "", "", ""]).map((opt: string, optIdx: number) => {
                                  const char = String.fromCharCode(65 + optIdx);
                                  return (
                                    <div key={optIdx} className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newSubQs = [...(curQ.sub_questions || [])];
                                          newSubQs[sIdx] = { ...newSubQs[sIdx], correct_answer: char };
                                          handleQuestionChange(activeQuestion, "sub_questions", newSubQs);
                                        }}
                                        className={`w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-bold shrink-0 transition-colors ${
                                          sq.correct_answer === char 
                                            ? "bg-emerald-500 text-white" 
                                            : "bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-white/20"
                                        }`}
                                      >
                                        {char}
                                      </button>
                                      <input
                                        type="text"
                                        value={opt}
                                        onChange={(e) => {
                                          const newSubQs = [...(curQ.sub_questions || [])];
                                          const newOpts = [...(newSubQs[sIdx].metadata?.options || [])];
                                          newOpts[optIdx] = e.target.value;
                                          newSubQs[sIdx] = { ...newSubQs[sIdx], metadata: { ...newSubQs[sIdx].metadata, options: newOpts } };
                                          handleQuestionChange(activeQuestion, "sub_questions", newSubQs);
                                        }}
                                        className="flex-1 text-[12px] p-2 rounded-md bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] focus:outline-none"
                                        placeholder={`Variant ${char}`}
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {sq.type === "fill_blanks" && (
                              <div>
                                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                                  To'g'ri javob (agar bir nechta bo'lsa JSON formatda yozing)
                                </label>
                                <input
                                  type="text"
                                  value={typeof sq.correct_answer === 'object' ? JSON.stringify(sq.correct_answer) : sq.correct_answer || ""}
                                  onChange={(e) => {
                                    const newSubQs = [...(curQ.sub_questions || [])];
                                    let val: any = e.target.value;
                                    try { if (val.startsWith("{")) val = JSON.parse(val); } catch (err) {}
                                    newSubQs[sIdx] = { ...newSubQs[sIdx], correct_answer: val };
                                    handleQuestionChange(activeQuestion, "sub_questions", newSubQs);
                                  }}
                                  className="w-full h-9 px-3 rounded-md bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] text-[12px]"
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {curQ.type === "written" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                          A qismi javobi
                        </label>
                        <input
                          type="text"
                          value={typeof curQ.correct_answer === "object" ? curQ.correct_answer?.a || "" : curQ.correct_answer || ""}
                          onChange={(e) =>
                            handleQuestionChange(activeQuestion, "correct_answer", {
                              ...curQ.correct_answer,
                              a: e.target.value,
                            })
                          }
                          className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] text-[12px] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10"
                          placeholder="Javob..."
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                          B qismi javobi
                        </label>
                        <input
                          type="text"
                          value={typeof curQ.correct_answer === "object" ? curQ.correct_answer?.b || "" : ""}
                          onChange={(e) =>
                            handleQuestionChange(activeQuestion, "correct_answer", {
                              ...curQ.correct_answer,
                              b: e.target.value,
                            })
                          }
                          className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] text-[12px] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10"
                          placeholder="Javob..."
                        />
                      </div>
                    </div>
                  )}

                  {curQ.type === "matching" && (
                    <div className="space-y-4">
                      {/* Left-hand Items (Topshiriq shartlari) */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            Chap tomondagi topshiriq shartlari (Savollar)
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const left = [...(curQ.metadata?.left || [])];
                              left.push(`${left.length + 33}. Yangi topshiriq sharti...`);
                              handleQuestionChange(activeQuestion, "metadata", { ...curQ.metadata, left });
                            }}
                            className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700"
                          >
                            <span className="material-symbols-outlined text-[16px]">add</span>
                            <span>Chap topshiriq qo'shish</span>
                          </button>
                        </div>

                        {(curQ.metadata?.left || ["", "", ""]).map((leftText: string, i: number) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px] flex items-center justify-center shrink-0">
                              {i + 1}
                            </span>
                            <input
                              type="text"
                              value={leftText}
                              onChange={(e) => {
                                const left = [...(curQ.metadata?.left || [])];
                                left[i] = e.target.value;
                                handleQuestionChange(activeQuestion, "metadata", { ...curQ.metadata, left });
                              }}
                              placeholder={`${i + 1}-topshiriq matni...`}
                              className="flex-1 h-9 px-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] text-[12px] text-slate-900 dark:text-white"
                            />
                            {((curQ.metadata?.left || []).length > 1) && (
                              <button
                                type="button"
                                onClick={() => {
                                  const left = (curQ.metadata?.left || []).filter((_: any, idx: number) => idx !== i);
                                  handleQuestionChange(activeQuestion, "metadata", { ...curQ.metadata, left });
                                }}
                                className="p-1.5 text-slate-400 hover:text-red-600 rounded-md"
                              >
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Right-hand Choices / Distractors */}
                      <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                              O'ng tomondagi javob variantlari hamda chalgituvchilar (Distractors)
                            </label>
                            <span className="text-[10px] text-slate-500 block">
                              To'g'ri javoblar bilan birga qo'shimcha chalgituvchi variantlarni ham erkin qo'shishingiz mumkin
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const right = [...(curQ.metadata?.right || [])];
                              const nextChar = String.fromCharCode(65 + right.length);
                              right.push(`${nextChar}) Yangi chalgituvchi variant`);
                              handleQuestionChange(activeQuestion, "metadata", { ...curQ.metadata, right });
                            }}
                            className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700"
                          >
                            <span className="material-symbols-outlined text-[16px]">add</span>
                            <span>Chalgituvchi variant qo'shish</span>
                          </button>
                        </div>

                        {(curQ.metadata?.right || ["A) ...", "B) ...", "C) ...", "D) ..."]).map((rightText: string, i: number) => {
                          const char = String.fromCharCode(65 + i);
                          return (
                            <div key={i} className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 font-bold text-[11px] flex items-center justify-center shrink-0">
                                {char}
                              </span>
                              <input
                                type="text"
                                value={rightText}
                                onChange={(e) => {
                                  const right = [...(curQ.metadata?.right || [])];
                                  right[i] = e.target.value;
                                  handleQuestionChange(activeQuestion, "metadata", { ...curQ.metadata, right });
                                }}
                                placeholder={`Variant ${char}...`}
                                className="flex-1 h-9 px-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] text-[12px] text-slate-900 dark:text-white"
                              />
                              {((curQ.metadata?.right || []).length > 2) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const right = (curQ.metadata?.right || []).filter((_: any, idx: number) => idx !== i);
                                    handleQuestionChange(activeQuestion, "metadata", { ...curQ.metadata, right });
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-md"
                                >
                                  <span className="material-symbols-outlined text-[16px]">delete</span>
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {curQ.type === "ordering" && (
                    <div className="space-y-3">
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400">
                        Tartiblanadigan elementlar (to'g'ri ketma-ketlikda yozing)
                      </label>
                      <div className="grid grid-cols-1 gap-2">
                        {[0, 1, 2, 3].map((i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-slate-100 dark:bg-white/5 flex items-center justify-center text-[10px] font-bold text-slate-400">
                              {i + 1}
                            </span>
                            <input
                              type="text"
                              value={curQ.metadata?.items?.[i] || ""}
                              onChange={(e) => {
                                const items = [...(curQ.metadata?.items || [])];
                                items[i] = e.target.value;
                                handleQuestionChange(activeQuestion, "metadata", {
                                  ...curQ.metadata,
                                  items,
                                });
                              }}
                              placeholder={`${i + 1}-o'rin elementi...`}
                              className="flex-1 h-8 px-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] text-[12px] text-slate-900 dark:text-white"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Ball (Points)
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={curQ.points_a ?? 1}
                        onChange={(e) =>
                          handleQuestionChange(activeQuestion, "points_a", parseFloat(e.target.value) || 1)
                        }
                        className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] text-[12px] text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Qiyinlik darajasi (1-5)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={5}
                        value={curQ.difficulty ?? 1}
                        onChange={(e) =>
                          handleQuestionChange(activeQuestion, "difficulty", parseInt(e.target.value, 10) || 1)
                        }
                        className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] text-[12px] text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Tushuntirish (ixtiyoriy)
                    </label>
                    <textarea
                      value={curQ.explanation || ""}
                      onChange={(e) =>
                        handleQuestionChange(
                          activeQuestion,
                          "explanation",
                          e.target.value
                        )
                      }
                      placeholder="Javobning tushuntirishi..."
                      rows={3}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] text-[12px] leading-relaxed text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10 resize-y min-h-[70px]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "bulk" && (
        <div className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-emerald-500">bolt</span>
                Savollarni matn ko'rinishida ommaviy yuklash
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Quyidagi formatda savollarni matn sifatida kiriting va ajratib oling. Matn ichidagi <b>qalin</b>, <i>qiya</i>, <sub>indeks</sub>, <sup>daraja</sup> teglari va (1. yoki 1) ko'rinishidagi raqamlashlar) avtomatik formatlanadi.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBulkText(DEFAULT_BULK)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px] text-amber-500">push_pin</span>
                <span>Namunani tiklash</span>
              </button>
              <button
                onClick={handleApplyBulk}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700 transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">bolt</span>
                <span>Savollarga o'tkazish</span>
              </button>
            </div>
          </div>

          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={22}
            className="w-full font-mono text-[12px] p-4 bg-slate-900 text-slate-100 rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 leading-relaxed shadow-inner"
            placeholder="[MC]..."
          />
        </div>
      )}

      {activeTab === "milliy_pdf" && (
        <div className="space-y-6 max-w-5xl mx-auto">
          {/* Header Banner */}
          <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl border border-indigo-500/20 shadow-xl space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shrink-0">
                <span className="material-symbols-outlined text-[24px]">picture_as_pdf</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Milliy Sertifikat Formati Avtomatik Import (43 ta savol)
                </h3>
                <p className="text-[12px] text-slate-300">
                  Savollar PDF-fayli hamda Javoblar Kaliti (PDF yoki JPG/PNG rasm) yuklang. Tizim avtomatik ravishda 1-32 Yopiq test, 33 (33-35) Moslashtirish test va 34-43 (36-45) Ochiq test (a, b shartli) savollarni yaratadi.
                </p>
              </div>
            </div>
          </div>

          {/* Upload Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Card 1: PDF Upload */}
            <div className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold text-[12px] flex items-center justify-center">
                  1
                </span>
                <h4 className="text-[13px] font-bold text-slate-900 dark:text-white">
                  Savollar PDF-faylini yuklang
                </h4>
              </div>

              <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 rounded-xl p-6 text-center transition-all bg-slate-50/50 dark:bg-white/[0.02]">
                <input
                  type="file"
                  accept="application/pdf"
                  id="milliy-pdf-upload"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleMilliyPdfUpload(f);
                  }}
                />
                <label htmlFor="milliy-pdf-upload" className="cursor-pointer flex flex-col items-center justify-center gap-2">
                  {isExtractingPdf ? (
                    <RefreshIcon className="w-8 h-8 animate-spin text-indigo-600" />
                  ) : (
                    <span className="material-symbols-outlined text-[40px] text-indigo-500 hover:scale-110 transition-transform">
                      picture_as_pdf
                    </span>
                  )}
                  <div className="text-[13px] font-bold text-slate-800 dark:text-slate-200">
                    {milliyPdfFile ? milliyPdfFile.name : "Savollar PDF faylini tanlang"}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {milliyPdfText ? `✓ ${milliyPdfText.length} belgi o'qib olindi` : "PDF formatidagi rasmiy test varianti"}
                  </div>
                </label>
              </div>

              {milliyPdfText && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl flex items-center gap-2 text-[12px] font-medium text-emerald-700 dark:text-emerald-300">
                  <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>PDF matni muvaffaqiyatli yuklandi ({milliyPdfText.length} ta belgi).</span>
                </div>
              )}
            </div>

            {/* Card 2: Answer Key Upload */}
            <div className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-[12px] flex items-center justify-center">
                  2
                </span>
                <h4 className="text-[13px] font-bold text-slate-900 dark:text-white">
                  Javoblar Kaliti fayli / rasmini yuklang
                </h4>
              </div>

              <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 rounded-xl p-6 text-center transition-all bg-slate-50/50 dark:bg-white/[0.02]">
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  id="milliy-key-upload"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleMilliyKeyUpload(f);
                  }}
                />
                <label htmlFor="milliy-key-upload" className="cursor-pointer flex flex-col items-center justify-center gap-2">
                  {isParsingKeys ? (
                    <RefreshIcon className="w-8 h-8 animate-spin text-emerald-600" />
                  ) : (
                    <span className="material-symbols-outlined text-[40px] text-emerald-500 hover:scale-110 transition-transform">
                      image
                    </span>
                  )}
                  <div className="text-[13px] font-bold text-slate-800 dark:text-slate-200">
                    {milliyKeyFile ? milliyKeyFile.name : "Kalit rasmini (JPG/PNG) yoki PDF tanlang"}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Masalan: 2-variant kalitlari (T/R 1-32, 33-35, 36-45 a/b)
                  </div>
                </label>
              </div>

              {milliyKeyFile && (
                <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-xl flex items-center gap-2 text-[12px] font-medium text-indigo-700 dark:text-indigo-300">
                  <CheckCircleIcon className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Kalit fayli biriktirildi. Qat'iy va muqobil kalitlarni quyida tekshirishingiz mumkin.</span>
                </div>
              )}
            </div>
          </div>

          {milliyStatusMessage && (
            <div className="p-4 bg-indigo-600 text-white rounded-xl flex items-center justify-center gap-3 animate-pulse text-[13px] font-semibold">
              <RefreshIcon className="w-4 h-4 animate-spin" />
              <span>{milliyStatusMessage}</span>
            </div>
          )}

          {/* Key Inspection & Edit Grid */}
          <div className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h4 className="text-[13px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-amber-500">key</span>
                  Javoblar Kaliti Jadvali (Tekshirish va Tahrirlash)
                </h4>
                <p className="text-[11px] text-slate-500">
                  Yuklangan kalit jadvali. Zarur bo'lsa har bir savol to'g'ri javobini o'zingiz ham moslashingiz mumkin.
                </p>
              </div>
            </div>

            {/* 1-32 Yopiq test keys */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                1-32. Yopiq test javoblari (A, B, C, D)
              </span>
              <div className="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-16 gap-2">
                {Array.from({ length: 32 }, (_, i) => i + 1).map((qNum) => (
                  <div key={qNum} className="flex flex-col items-center p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    <span className="text-[10px] font-bold text-slate-400">{qNum}</span>
                    <select
                      value={keys32[qNum] || "A"}
                      onChange={(e) => setKeys32((prev) => ({ ...prev, [qNum]: e.target.value }))}
                      className="w-full text-center font-bold text-[12px] text-emerald-600 bg-transparent outline-none cursor-pointer"
                    >
                      {["A", "B", "C", "D"].map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* 33-35 Moslashtirish keys */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                33-35. Moslashtirish test kalitlari (A - F)
              </span>
              <div className="grid grid-cols-3 gap-3 max-w-md">
                {[33, 34, 35].map((num) => (
                  <div key={num} className="flex items-center gap-2 p-2 rounded-xl border border-purple-200 dark:border-purple-500/20 bg-purple-50/50 dark:bg-purple-500/10">
                    <span className="text-[12px] font-bold text-purple-700 dark:text-purple-300">{num}-savol:</span>
                    <select
                      value={keysMatching[num] || "A"}
                      onChange={(e) => setKeysMatching((prev) => ({ ...prev, [num]: e.target.value }))}
                      className="flex-1 font-bold text-[13px] text-purple-700 dark:text-purple-300 bg-transparent outline-none cursor-pointer"
                    >
                      {["A", "B", "C", "D", "E", "F"].map((char) => (
                        <option key={char} value={char}>
                          {char}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* 36-45 Ochiq test keys */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                36-45. Ochiq test (Yozma / Hisoblash) javoblari (a va b shartlar)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2">
                {Array.from({ length: 10 }, (_, i) => i + 36).map((qNum) => {
                  const val = keysWritten[qNum] || { a: "", b: "" };
                  return (
                    <div key={qNum} className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-1">
                      <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block">{qNum}-savol</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold text-emerald-600">a)</span>
                        <input
                          type="text"
                          value={val.a}
                          onChange={(e) => setKeysWritten((prev) => ({ ...prev, [qNum]: { ...val, a: e.target.value } }))}
                          className="w-full h-6 px-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-900 dark:text-white"
                          placeholder="a)"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold text-emerald-600">b)</span>
                        <input
                          type="text"
                          value={val.b}
                          onChange={(e) => setKeysWritten((prev) => ({ ...prev, [qNum]: { ...val, b: e.target.value } }))}
                          className="w-full h-6 px-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-900 dark:text-white"
                          placeholder="b)"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Submit Generator Button */}
          <div className="flex justify-end pt-2">
            <button
              onClick={generateMilliyMockTest}
              disabled={isGeneratingMilliy || isExtractingPdf || isParsingKeys}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-[13px] shadow-lg disabled:opacity-50 transition-all hover:scale-[1.01]"
            >
              {isGeneratingMilliy ? (
                <RefreshIcon className="w-5 h-5 animate-spin" />
              ) : (
                <MagicWandIcon className="w-5 h-5" />
              )}
              <span>🚀 43 ta Savolni Avtomatik Yaratish va Yuklash</span>
            </button>
          </div>
        </div>
      )}

      {activeTab === "preview" && (
        <div className="space-y-4 max-w-4xl mx-auto">
          <div className="flex items-center justify-between p-4 bg-slate-900 text-white rounded-xl">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-indigo-400">visibility</span>
              Imtihon ko'rinishida ko'rib chiqish ({questions.length} ta savol)
            </h3>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 font-semibold border border-red-500/30 uppercase">
              PREVIEW MODE
            </span>
          </div>

          {questions.map((q, idx) => (
            <div key={idx} className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[11px] font-bold rounded-md">
                  Savol {idx + 1}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-slate-500 font-semibold">
                    {q.type}
                  </span>
                  {q.points_a && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-500/10 text-amber-600 font-bold">
                      {q.points_a} ball
                    </span>
                  )}
                </div>
              </div>

              <div className="text-[15px] font-medium text-slate-900 dark:text-white leading-relaxed prose dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {normalizeMath(q.question_text || "Savol matni kiritilmagan")}
                </ReactMarkdown>
              </div>

              {q.question_subtext && (
                <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed prose dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {normalizeMath(q.question_subtext)}
                  </ReactMarkdown>
                </div>
              )}

              {(q.question_image || q.image_url) && (
                <div className="max-w-md my-3 overflow-hidden rounded-xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-slate-900 p-2 shadow-xs">
                  <img
                    src={q.question_image || q.image_url}
                    className="max-h-[280px] w-auto mx-auto object-contain rounded-lg"
                    alt="Savol rasmi"
                  />
                </div>
              )}

              {q.type === "matching" ? (
                <div className="space-y-3 pt-2">
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">Javob variantlari:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(q.metadata?.options || q.metadata?.right || []).map((opt: string, i: number) => {
                        const char = String.fromCharCode(65 + i);
                        return (
                          <div key={char} className="flex items-center gap-2 p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-[12px]">
                            <span className="w-5 h-5 rounded bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">{char}</span>
                            <span className="flex-1">
                              <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                {normalizeMath(opt)}
                              </ReactMarkdown>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {(q.metadata?.left || []).map((lItem: string, lIdx: number) => {
                      const corrVal = typeof q.correct_answer === "object" ? (q.correct_answer?.[String(lIdx + 33)] || q.correct_answer?.[String(lIdx + 1)] || "") : "";
                      return (
                        <div key={lIdx} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3 text-[13px]">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 font-bold text-[10px] flex items-center justify-center shrink-0">{lIdx + 1}</span>
                            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                              {normalizeMath(lItem)}
                            </ReactMarkdown>
                          </div>
                          {corrVal && (
                            <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-[11px]">
                              To'g'ri: {corrVal}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : q.metadata?.options && Array.isArray(q.metadata.options) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
                  {q.metadata.options.map((opt: string, optIdx: number) => {
                    const char = String.fromCharCode(65 + optIdx);
                    const isCorrect = q.correct_answer === char || (Array.isArray(q.correct_answer) && q.correct_answer.includes(char));
                    return (
                      <div
                        key={char}
                        className={`p-2.5 rounded-lg border text-[12px] flex items-center gap-2 font-medium ${
                          isCorrect
                            ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-bold"
                            : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/[0.06] text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0 ${isCorrect ? "bg-emerald-600 text-white" : "bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400"}`}>
                          {char}
                        </span>
                        <span className="flex-1">
                          <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {normalizeMath(opt)}
                          </ReactMarkdown>
                        </span>
                        {isCorrect && <span className="ml-auto text-[10px] text-emerald-600 font-bold uppercase shrink-0">To'g'ri</span>}
                      </div>
                    );
                  })}
                </div>
              )}

              {(q.type === "fill_blanks" || q.type === "written" || q.type === "short_answer") && (
                <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-white/[0.06] mt-3">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Topshiriq qismlari ({getQuestionBlanks(q).length} ta bo'sh joy):</span>
                    <span className="text-[10px] text-emerald-600 font-mono">✓ 90%+ aniqlik va birliksiz tekshirish</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {getQuestionBlanks(q).map((blank) => (
                      <div
                        key={blank.key}
                        className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-500/10 flex items-start gap-3"
                      >
                        <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold text-[12px] flex items-center justify-center shrink-0 shadow-sm">
                          {blank.key.toUpperCase()}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-semibold text-slate-900 dark:text-white mb-1">
                            {blank.label} qismi uchun to'g'ri javob variantlari:
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {blank.alternatives.map((alt: string, aIdx: number) => (
                              <span
                                key={aIdx}
                                className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 text-[12px] font-mono text-emerald-700 dark:text-emerald-300 font-bold shadow-2xs flex items-center gap-1"
                              >
                                <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                  {normalizeMath(alt)}
                                </ReactMarkdown>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {q.explanation && (
                <div className="p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-lg text-[11px] text-blue-700 dark:text-blue-300">
                  💡 <strong>Izoh:</strong> {q.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === "results" && (
        <div className="space-y-5">
          {/* Header Controls & Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl flex items-center gap-3 shadow-xs">
              <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-[20px]">groups</span>
              </div>
              <div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Jami qatnashchilar</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  {resultsData.submissions.length} ta o'quvchi
                </p>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl flex items-center gap-3 shadow-xs">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
              </div>
              <div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">O'rtacha to'g'ri savollar</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  {resultsData.submissions.length > 0
                    ? (
                        resultsData.submissions.reduce((acc, curr) => acc + (Number(curr.correct_answers) || 0), 0) /
                        resultsData.submissions.length
                      ).toFixed(1)
                    : 0}{" "}
                  / {questions.length}
                </p>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl flex items-center gap-3 shadow-xs">
              <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-[20px]">trophy</span>
              </div>
              <div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Eng yuqori natija</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  {resultsData.submissions.length > 0
                    ? Math.max(...resultsData.submissions.map((s) => Number(s.correct_answers) || 0))
                    : 0}{" "}
                  / {questions.length}
                </p>
              </div>
            </div>
          </div>

          {/* Search Toolbar */}
          <div className="p-4 bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-slate-400">
                search
              </span>
              <input
                type="text"
                placeholder="Foydalanuvchi ismi yoki email bo'yicha..."
                value={resultsSearchQuery}
                onChange={(e) => setResultsSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[12px] text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchTestResults}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 text-[12px] font-medium hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                Yangilash
              </button>
            </div>
          </div>

          {/* Matrix Table */}
          {isLoadingResults ? (
            <div className="p-12 text-center bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl">
              <RefreshIcon className="w-6 h-6 animate-spin mx-auto text-sky-500" />
              <p className="text-[13px] text-slate-500 mt-2">Natijalar yuklanmoqda...</p>
            </div>
          ) : resultsData.submissions.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[24px]">assignment_turned_in</span>
              </div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-white">Hali birorta o'quvchi ishlamagan</h4>
              <p className="text-[12px] text-slate-500 max-w-sm mx-auto">
                Ushbu mock test hali biror bir foydalanuvchi yoki o'quvchi tomonidan ishlanmagan.
              </p>
            </div>
          ) : (
            <>
              {(() => {
                const raschCalc = computeRaschModel(questions, resultsData.submissions);
                const raschMap: Record<string, any> = {};
                raschCalc.participantResults.forEach(r => {
                  raschMap[r.subId] = r;
                });

                return (
                  <div className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[12px]">
                        <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase text-[10px]">
                          <tr>
                            <th className="p-3 sticky left-0 z-20 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 min-w-[220px]">
                              Foydalanuvchi
                            </th>
                            {Array.from({ length: questions.length }, (_, i) => i + 1).map((qNum) => (
                              <th key={qNum} className="p-2 text-center min-w-[36px] border-r border-slate-200/60 dark:border-slate-800/60">
                                S{qNum}
                              </th>
                            ))}
                            <th className="p-3 text-center min-w-[120px] border-r border-slate-200 dark:border-slate-800">
                              BMBA (Rasch) Bahosi
                            </th>
                            <th className="p-3 text-center sticky right-0 z-20 bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 min-w-[140px]">
                              Natija (To'g'ri/Jami)
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                          {resultsData.submissions
                            .filter((s) =>
                              resultsSearchQuery
                                ? s.user_name.toLowerCase().includes(resultsSearchQuery.toLowerCase()) ||
                                  s.user_email.toLowerCase().includes(resultsSearchQuery.toLowerCase())
                                : true
                            )
                            .map((sub, idx) => {
                              const totalQs = questions.length || sub.total_questions || 1;
                              const correctCount = Number(sub.correct_answers) || 0;
                              const pct = Math.round((correctCount / totalQs) * 100);
                              const raschRes = raschMap[sub.id];

                              return (
                                <tr key={sub.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                                  {/* User column (Sticky left) */}
                                  <td className="p-3 sticky left-0 z-10 bg-white dark:bg-[#080C14] border-r border-slate-200 dark:border-slate-800 font-medium">
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-7 h-7 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold flex items-center justify-center text-[11px] shrink-0 border border-sky-500/20">
                                        {sub.user_name.charAt(0).toUpperCase()}
                                      </div>
                                      <div className="truncate max-w-[150px]">
                                        <p className="font-bold text-slate-900 dark:text-white truncate">{sub.user_name}</p>
                                        <p className="text-[10px] text-slate-400 truncate">{sub.user_email || "Email yo'q"}</p>
                                      </div>
                                    </div>
                                  </td>

                                  {/* Questions matrix cells (1 to N) */}
                                  {Array.from({ length: questions.length }, (_, i) => i + 1).map((qNum) => {
                                    const qObj = questions.find((q) => q.question_number === qNum);
                                    const userAns = sub.answers?.[qNum] || sub.answers?.[String(qNum)];
                                    
                                    let isCorrect = false;
                                    let isAnswered = userAns !== undefined && userAns !== null && userAns !== "";

                                    if (isAnswered) {
                                      if (typeof userAns === "object") {
                                        isCorrect = Boolean(userAns.is_correct || userAns.isCorrect);
                                      } else if (qObj) {
                                        const corr = qObj.correct_answer;
                                        if (typeof corr === "string") {
                                          isCorrect = String(userAns).trim().toUpperCase() === String(corr).trim().toUpperCase();
                                        } else if (typeof corr === "object") {
                                          isCorrect = JSON.stringify(userAns) === JSON.stringify(corr);
                                        }
                                      }
                                    }

                                    return (
                                      <td key={qNum} className="p-1.5 text-center border-r border-slate-100 dark:border-slate-800/40">
                                        {!isAnswered ? (
                                          <span className="text-slate-300 dark:text-slate-600 font-mono text-[11px]">-</span>
                                        ) : isCorrect ? (
                                          <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-[12px]">
                                            ✓
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold text-[11px]">
                                            ✕
                                          </span>
                                        )}
                                      </td>
                                    );
                                  })}

                                  {/* BMBA Rasch Grade column */}
                                  <td className="p-3 text-center border-r border-slate-200 dark:border-slate-800 font-bold">
                                    {raschRes ? (
                                      <div className="flex flex-col items-center gap-0.5">
                                        <span className={`px-2 py-0.5 rounded text-[11px] font-black ${raschRes.gradeBadgeColor}`}>
                                          {raschRes.raschGrade}
                                        </span>
                                        <span className="text-[9.5px] font-mono text-slate-400">
                                          ({raschRes.relativeRaschPercentage}%)
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-slate-400 font-mono text-[11px]">-</span>
                                    )}
                                  </td>

                                  {/* Score & percentage column (Sticky right) */}
                                  <td className="p-3 text-center sticky right-0 z-10 bg-white dark:bg-[#080C14] border-l border-slate-200 dark:border-slate-800 font-bold">
                                    <div className="flex flex-col items-center">
                                      <span className="text-[12px] text-slate-900 dark:text-white font-bold">
                                        {correctCount} / {totalQs}
                                      </span>
                                      <span
                                        className={`text-[10px] px-1.5 py-0.5 rounded font-semibold mt-0.5 ${
                                          pct >= 70
                                            ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                                            : pct >= 50
                                            ? "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300"
                                            : "bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300"
                                        }`}
                                      >
                                        {pct}%
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}

              {/* Rasch Model Analysis (Item Response Theory & Grading) */}
              <RaschModelAnalysis
                questions={questions}
                submissions={resultsData.submissions}
                searchQuery={resultsSearchQuery}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CreateMockTest;
