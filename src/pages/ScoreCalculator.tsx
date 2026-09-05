import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight, ChevronLeft, RotateCcw, CheckCircle2,
  XCircle, Award, Info, ArrowRight, Calculator,
  TrendingUp, FileText, Target, BookOpen, ChevronDown
} from "lucide-react";
import { PageHeader } from "@/components/platform/PageHeader";
import SEO from "@/components/SEO";

// ── Scoring config ───────────────────────────────────────────────────────────
const SCORE_1_3_IDS = new Set([1, 5, 6, 10, 12, 16, 18, 20, 24, 25]);
const SCORE_2_2_IDS = new Set([2, 3, 4, 7, 8, 9, 11, 13, 14, 15, 17, 19, 21, 22, 23, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35]);

function getTestQuestionScore(id: number): number {
  if (SCORE_1_3_IDS.has(id)) return 1.3;
  if (SCORE_2_2_IDS.has(id)) return 2.2;
  return 1.3;
}

const GRADE_TABLE = [
  { minRaw: 70, grade: "A+", color: "#059669", bg: "#d1fae5", label: "Maksimal ball" },
  { minRaw: 65, grade: "A", color: "#0284c7", bg: "#e0f2fe", label: "Yuqori ball" },
  { minRaw: 60, grade: "B+", color: "#7c3aed", bg: "#ede9fe", label: "Yaxshi natija" },
  { minRaw: 55, grade: "B", color: "#b45309", bg: "#fef3c7", label: "O'rtacha natija" },
  { minRaw: 50, grade: "C+", color: "#dc2626", bg: "#fee2e2", label: "Past natija" },
  { minRaw: 46, grade: "C", color: "#6b7280", bg: "#f3f4f6", label: "Minimal ball" },
];

function getGrade(rawScore: number) {
  for (const g of GRADE_TABLE) {
    if (rawScore >= g.minRaw) return g;
  }
  return GRADE_TABLE[GRADE_TABLE.length - 1];
}

type TestAnswer = boolean | null;
type WrittenAnswer = { a: boolean | null; b: boolean | null };
type Answers = {
  test: Record<number, TestAnswer>;
  written: Record<number, WrittenAnswer>;
};

const initAnswers = (): Answers => {
  const test: Record<number, TestAnswer> = {};
  for (let i = 1; i <= 35; i++) test[i] = null;
  const written: Record<number, WrittenAnswer> = {};
  for (let i = 36; i <= 45; i++) written[i] = { a: null, b: null };
  return { test, written };
};

function computeScore(answers: Answers) {
  let total = 0;
  for (let i = 1; i <= 35; i++) {
    if (answers.test[i] === true) total += getTestQuestionScore(i);
  }
  for (let i = 36; i <= 45; i++) {
    const w = answers.written[i];
    if (w.a === true) total += 1.5;
    if (w.b === true) total += 1.7;
  }
  return Math.round(total * 100) / 100;
}

export default function ScoreCalculator() {
  const [answers, setAnswers] = useState<Answers>(initAnswers());
  const [current, setCurrent] = useState(1);
  const rawScore = computeScore(answers);
  const grade = getGrade(rawScore);

  const toggleTest = (id: number) => {
    setAnswers(prev => ({
      ...prev,
      test: { ...prev.test, [id]: prev.test[id] === true ? false : prev.test[id] === false ? null : true },
    }));
  };

  const toggleWritten = (id: number, part: "a" | "b") => {
    setAnswers(prev => {
      const cur = prev.written[id][part];
      const next = cur === true ? false : cur === false ? null : true;
      return { ...prev, written: { ...prev.written, [id]: { ...prev.written[id], [part]: next } } };
    });
  };

  const reset = () => { setAnswers(initAnswers()); setCurrent(1); };

  const testAnswered = Object.values(answers.test).filter(v => v !== null).length;
  const writtenParts = Object.values(answers.written).reduce((s, w) => s + (w.a !== null ? 1 : 0) + (w.b !== null ? 1 : 0), 0);
  const progressPct = Math.round(((testAnswered + writtenParts) / 55) * 100);

  function answerColor(val: boolean | null) {
    if (val === true) return "bg-emerald-500 border-emerald-500 text-white";
    if (val === false) return "bg-rose-500 border-rose-500 text-white";
    return "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-400";
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#050B10]">
      <SEO title="Ball Hisoblagich" description="Maksimal darajada minimalist ball hisoblagich" />

      {/* Mini Title + Stats Strip */}
      <div className="bg-white dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-0 z-20">
         <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#E8192C]/10 rounded-lg flex items-center justify-center">
               <Calculator className="w-5 h-5 text-[#E8192C]" />
            </div>
            <div>
               <h1 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Ball Hisoblagich</h1>
               <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Milliy sertifikat natijalari</p>
            </div>
         </div>

         <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-3 border-r border-slate-100 dark:border-slate-800 pr-6">
               <div className="text-right">
                  <p className="text-[11px] font-black text-slate-400 uppercase leading-none">Jarayon</p>
                  <p className="text-xs font-black text-slate-900 dark:text-white mt-1">{progressPct}%</p>
               </div>
               <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-[#E8192C]" style={{ width: `${progressPct}%` }} />
               </div>
            </div>
            <button onClick={reset} className="px-4 py-2 bg-rose-50 dark:bg-rose-500/10 text-rose-600 rounded-lg text-[11px] font-black uppercase tracking-widest border border-rose-100 dark:border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all outline-none">
               Reset
            </button>
      </div>
      </div>

      {/* ── 50% / 50% Split Layout ──────────────────────────────────────── */}
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col xl:flex-row gap-6">

         {/* ══════════════════ KALKULYATOR — mobile'da oldinda ══════════════════ */}
         <div className="flex-1 xl:w-1/2 space-y-5 xl:h-[calc(100vh-100px)] xl:overflow-y-auto xl:sticky xl:top-[72px] custom-scrollbar order-2 xl:order-1">

            {/* Test (1-35) */}
            <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
               <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                  <h3 className="text-xs sm:text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Test topshiriqlari (1-35)</h3>
                  <div className="flex items-center gap-2">
                     <span className="text-[11px] sm:text-[9px] font-bold text-slate-400">{testAnswered}/35</span>
                  </div>
               </div>
                 <div className="p-3 sm:p-4 grid grid-cols-7 sm:grid-cols-7 md:grid-cols-7 lg:grid-cols-7 gap-1.5 sm:gap-2">
                  {Array.from({ length: 35 }, (_, i) => i + 1).map(id => {
                    const pts = getTestQuestionScore(id);
                    return (
                    <button
                      key={id}
                      onClick={() => toggleTest(id)}
                      className={`relative w-full aspect-square rounded-md border text-[10px] sm:text-[9px] font-black transition-all hover:scale-105 active:scale-95 flex flex-col items-center justify-center shrink-0 gap-0 min-h-[36px] sm:min-h-0 ${answerColor(answers.test[id])}`}
                    >
                      <span>{id}</span>
                      <span className="text-[7px] sm:text-[7px] opacity-60 leading-none">{pts}</span>
                    </button>
                  )})}
               </div>
            </div>

            {/* Written (36-45) */}
            <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
               <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                  <h3 className="text-xs sm:text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Yozma topshiriqlar (36-45)</h3>
                  <span className="text-[11px] sm:text-[9px] font-bold text-slate-400">{writtenParts}/20</span>
               </div>
               <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  {Array.from({ length: 10 }, (_, i) => i + 36).map(id => (
                    <div key={id} className="p-2.5 sm:p-3 bg-slate-50/30 dark:bg-slate-900/30 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                       <span className="text-[11px] sm:text-[10px] font-black text-slate-400 w-6">{id}</span>
                       <div className="flex gap-1.5 sm:gap-1.5 flex-1 justify-end">
                          <button onClick={() => toggleWritten(id, 'a')} className={`px-3 sm:px-3 py-2 sm:py-1.5 rounded-md border text-[11px] sm:text-[9px] font-black transition-all flex-1 max-w-[100px] sm:max-w-[90px] min-h-[36px] ${answerColor(answers.written[id].a)}`}>A 1.5</button>
                          <button onClick={() => toggleWritten(id, 'b')} className={`px-3 sm:px-3 py-2 sm:py-1.5 rounded-md border text-[11px] sm:text-[9px] font-black transition-all flex-1 max-w-[100px] sm:max-w-[90px] min-h-[36px] ${answerColor(answers.written[id].b)}`}>B 1.7</button>
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            {/* Natija */}
            <div className="bg-white dark:bg-[#080E16] border border-slate-200 dark:border-slate-800 p-6 rounded-xl">
               <div className="flex flex-col items-center text-center mb-6">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black mb-2" style={{ background: grade.bg, color: grade.color }}>
                     {grade.grade}
                  </div>
                  <div className="text-4xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">{rawScore}</div>
                   <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">Umumiy Ball</p>
               </div>

               <div className="space-y-1 mb-6">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2">Darajalar</p>
                  {GRADE_TABLE.slice().reverse().map(g => (
                     <div key={g.grade} className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all ${grade.grade === g.grade ? 'bg-[#E8192C]/5 ring-1 ring-primary/20 scale-[1.02]' : 'opacity-40'}`} style={{ color: g.color }}>
                        <span className="text-xs font-black">{g.grade}</span>
                        <span className="text-[11px] font-bold">{g.minRaw}+ ball</span>
                     </div>
                  ))}
               </div>

               <div className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-start gap-2">
                     <Info className="w-3.5 h-3.5 text-[#E8192C] shrink-0 mt-0.5" />
                     <p className="text-[11px] text-slate-600 dark:text-slate-400 font-bold leading-tight uppercase">
                        Tugmani har bir bosish: To'g'ri → Xato → Bo'sh
                     </p>
                  </div>
               </div>
            </div>

         </div>

         {/* ══════════════════ MA'LUMOTLAR — mobile'da keyin ══════════════════ */}
         <div className="flex-1 xl:w-1/2 space-y-5 overflow-y-auto xl:h-[calc(100vh-100px)] xl:pr-2 custom-scrollbar order-1 xl:order-2">

            {/* Formulalar */}
            <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
              <h2 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1">Standartlashtirish Formulalari</h2>
              <p className="text-[11px] text-slate-500 mb-5 leading-relaxed">Rasch metodi asosida baholanadi:</p>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="p-4 bg-gradient-to-br from-[#E8192C]/5 to-rose-50 dark:from-[#E8192C]/10 dark:to-slate-900 rounded-xl border border-[#E8192C]/10 dark:border-[#E8192C]/20 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#E8192C]/10 flex items-center justify-center"><span className="text-[10px] font-black text-[#E8192C]">Z</span></div>
                    <span className="text-[11px] sm:text-[9px] font-black text-[#E8192C] uppercase tracking-widest">Z – ball</span>
                  </div>
                  <div className="text-lg font-black text-slate-900 dark:text-white tracking-tight font-mono">Z = (θ − μ) / σ</div>
                  <div className="space-y-1 text-[11px] sm:text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    <p><strong className="text-slate-700 dark:text-slate-300">θ</strong> — qobiliyat</p>
                    <p><strong className="text-slate-700 dark:text-slate-300">μ</strong> — o'rta qiymat</p>
                    <p><strong className="text-slate-700 dark:text-slate-300">σ</strong> — standart tafovut</p>
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-br from-emerald-500/5 to-emerald-50 dark:from-emerald-500/10 dark:to-slate-900 rounded-xl border border-emerald-500/10 dark:border-emerald-500/20 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center"><span className="text-[10px] font-black text-emerald-600">T</span></div>
                    <span className="text-[11px] sm:text-[9px] font-black text-emerald-600 uppercase tracking-widest">T – standart ball</span>
                  </div>
                  <div className="text-lg font-black text-slate-900 dark:text-white tracking-tight font-mono">T = 50 + 10Z</div>
                  <div className="space-y-1 text-[11px] sm:text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    <p><strong className="text-slate-700 dark:text-slate-300">T</strong> — standart ball</p>
                    <p><strong className="text-slate-700 dark:text-slate-300">10</strong> — standart tafovut</p>
                    <p><strong className="text-slate-700 dark:text-slate-300">50</strong> — o'rta qiymat</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 1-fan */}
            <ScoreTable
              title="Mutaxassislik 1-Fan"
              formula="Ball × 93 / 65"
              formulaNote="93 — maksimal ball; 65 — A daraja uchun minimal chegara"
              rows={[
                { no: 1, raw: 93, calculated: "70–75+", note: "Maksimal ball", grade: "A+" },
                { no: 2, raw: 93, calculated: "65–69,9", note: "Maksimal ball", grade: "A" },
                { no: 3, raw: 92.86, calculated: "64,9", note: "Proporsional", grade: "B+" },
                { no: 4, raw: 85.85, calculated: "60", note: "Proporsional", grade: "B+" },
                { no: 5, raw: 85.70, calculated: "59,9", note: "Proporsional", grade: "B" },
                { no: 6, raw: 78.69, calculated: "55", note: "Proporsional", grade: "B" },
                { no: 7, raw: 78.55, calculated: "54,9", note: "Proporsional", grade: "C+" },
                { no: 8, raw: 71.54, calculated: "50", note: "Proporsional", grade: "C+" },
                { no: 9, raw: 71.40, calculated: "49,9", note: "Proporsional", grade: "C" },
                { no: 10, raw: 65.82, calculated: "46", note: "Proporsional", grade: "C" },
              ]}
            />

            {/* 2-fan */}
            <ScoreTable
              title="Mutaxassislik 2-Fan"
              formula="Ball × 63 / 65"
              formulaNote="63 — maksimal ball; 65 — A daraja uchun minimal chegara"
              rows={[
                { no: 1, raw: 63, calculated: "70–75+", note: "Maksimal ball", grade: "A+" },
                { no: 2, raw: 63, calculated: "65–69,9", note: "Maksimal ball", grade: "A" },
                { no: 3, raw: 62.90, calculated: "64,9", note: "Proporsional", grade: "B+" },
                { no: 4, raw: 58.15, calculated: "60", note: "Proporsional", grade: "B+" },
                { no: 5, raw: 58.06, calculated: "59,9", note: "Proporsional", grade: "B" },
                { no: 6, raw: 53.31, calculated: "55", note: "Proporsional", grade: "B" },
                { no: 7, raw: 53.21, calculated: "54,9", note: "Proporsional", grade: "C+" },
                { no: 8, raw: 48.46, calculated: "50", note: "Proporsional", grade: "C+" },
                { no: 9, raw: 48.36, calculated: "49,9", note: "Proporsional", grade: "C" },
                { no: 10, raw: 44.58, calculated: "46", note: "Proporsional", grade: "C" },
              ]}
            />

            {/* Yozma ish */}
            <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4">
              <div>
                <h2 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1">Yozma Ish — 75 Ballik Shkala</h2>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  O'zbek, rus va qoraqalpoq tillari fanlaridan yozma ish natijalari 75 ballik shkalaga keltiriladi.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1.5 text-[11px] sm:text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  <p>• Test birinchi, yozma ish ikkinchi bo'lim</p>
                  <p>• Yozma ish 24 ballik mezon bilan baholanadi</p>
                  <p>• Ekspertlar baholari o'rta arifmetik = yakuniy baho</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[11px] sm:text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">24 → 75</p>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] sm:text-[10px]">
                    {[[24,75],[23,73],[22,71],[21,69],[20,67],[19,65],[18,63],[17,61],[16,59],[15,57],[14,55],[13,53],[12,51],[11,49],[10,47],[9,45],[8,43],[7,41],[6,39],[5,37],[4,35],[3,33],[2,31],[1,29],[0,0]].map(([f,t],i)=>(
                      <div key={i} className="flex justify-between py-px border-b border-slate-100 dark:border-slate-800/50">
                        <span className="font-mono text-slate-600 dark:text-slate-400">{f}</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>

      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #1E293B; }
      `}</style>
    </div>
    </div>
  );
}

function ScoreTable({ title, formula, formulaNote, rows }: {
  title: string;
  formula: string;
  formulaNote: string;
  rows: { no: number; raw: number; calculated: string; note: string; grade: string }[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
        <div className="text-left">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{title}</h3>
          <p className="text-[11px] text-slate-500 mt-0.5 font-mono">{formula}</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-6 pb-5 space-y-4">
              <p className="text-[11px] sm:text-[10px] text-slate-400 font-medium leading-relaxed">{formulaNote}</p>
              <div className="overflow-x-auto">
                <table className="w-full text-[12px] sm:text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                      <th className="text-left py-2 pr-3 font-black text-slate-400 uppercase text-[11px] sm:text-[9px] tracking-widest">#</th>
                      <th className="text-left py-2 pr-3 font-black text-slate-400 uppercase text-[11px] sm:text-[9px] tracking-widest">Test Ball</th>
                      <th className="text-left py-2 pr-3 font-black text-slate-400 uppercase text-[11px] sm:text-[9px] tracking-widest">Rasch Hisoblash</th>
                      <th className="text-left py-2 pr-3 font-black text-slate-400 uppercase text-[11px] sm:text-[9px] tracking-widest">Ball Berish</th>
                      <th className="text-left py-2 font-black text-slate-400 uppercase text-[11px] sm:text-[9px] tracking-widest">Daraja</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(r => (
                      <tr key={r.no} className="border-b border-slate-50 dark:border-slate-900">
                        <td className="py-2 pr-3 font-bold text-slate-500">{r.no}</td>
                        <td className="py-2 pr-3 font-bold text-slate-900 dark:text-white">{r.raw}</td>
                        <td className="py-2 pr-3 font-mono text-slate-600 dark:text-slate-400">{r.calculated}</td>
                        <td className="py-2 pr-3 text-slate-500 dark:text-slate-400">{r.note}</td>
                        <td className="py-2"><span className="px-2 py-0.5 rounded-md text-[11px] sm:text-[9px] font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{r.grade}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

