import React, { useMemo } from 'react';
import { Award, CheckCircle2, TrendingUp } from 'lucide-react';

export interface RaschQuestionStats {
  qNum: number;
  totalAttempts: number;
  correctCount: number;
  successRate: number; // 0..1
  weight: number; // 0.5 .. 2.5
  difficultyLabel: 'O\'ta Qiyin' | 'Qiyin' | 'O\'rta' | 'Oson' | 'Juda Oson';
}

export interface RaschParticipantResult {
  subId: string;
  userName: string;
  userEmail: string;
  rawCorrect: number;
  totalQuestions: number;
  rawPercentage: number;
  raschScore: number;
  maxRaschScore: number;
  relativeRaschPercentage: number;
  raschGrade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D';
  raschGradeTitle: string;
  gradeBadgeColor: string;
  rank: number;
}

interface RaschModelAnalysisProps {
  questions: any[];
  submissions: any[];
  searchQuery?: string;
}

export function computeRaschModel(questions: any[], submissions: any[]) {
  if (!questions || questions.length === 0 || !submissions || submissions.length === 0) {
    return {
      qStatsMap: {},
      maxRaschScore: 1,
      topRaschScore: 0,
      participantResults: [],
      hardestQuestions: [],
      easiestQuestions: []
    };
  }

  const qStatsMap: Record<number, RaschQuestionStats> = {};

  // 1. Per-question item difficulty & Rasch weight calculation
  questions.forEach((q, idx) => {
    const qNum = q.question_number || (idx + 1);
    let correctCount = 0;
    let attemptedCount = 0;

    submissions.forEach((sub) => {
      const userAns = sub.answers?.[qNum] ?? sub.answers?.[String(qNum)];
      if (userAns !== undefined && userAns !== null && userAns !== "") {
        attemptedCount++;
        let isCorrect = false;
        if (typeof userAns === "object") {
          isCorrect = Boolean(userAns.is_correct || userAns.isCorrect);
        } else {
          const corr = q.correct_answer;
          if (typeof corr === "string") {
            isCorrect = String(userAns).trim().toUpperCase() === String(corr).trim().toUpperCase();
          } else if (typeof corr === "object") {
            isCorrect = JSON.stringify(userAns) === JSON.stringify(corr);
          }
        }
        if (isCorrect) correctCount++;
      }
    });

    const successRate = attemptedCount > 0 ? correctCount / attemptedCount : 0.5;

    // Structural difficulty weighting rule:
    // 1-20: Oson (0.6x to 1.4x)
    // 21-33: O'rtacha (1.1x to 2.0x)
    // 34-43: Qiyin / Hard (1.8x to 2.8x)
    let baseMinWeight = 0.6;
    let baseMultiplier = 0.8;
    let categoryLabel: 'O\'ta Qiyin' | 'Qiyin' | 'O\'rta' | 'Oson' | 'Juda Oson' = 'Oson';

    if (qNum >= 34) {
      baseMinWeight = 1.8;
      baseMultiplier = 1.0;
      categoryLabel = 'Qiyin';
    } else if (qNum >= 21) {
      baseMinWeight = 1.1;
      baseMultiplier = 0.9;
      categoryLabel = 'O\'rta';
    } else {
      baseMinWeight = 0.6;
      baseMultiplier = 0.8;
      categoryLabel = 'Oson';
    }

    const weight = Number((baseMinWeight + (1 - successRate) * baseMultiplier).toFixed(2));

    qStatsMap[qNum] = {
      qNum,
      totalAttempts: attemptedCount,
      correctCount,
      successRate,
      weight,
      difficultyLabel: categoryLabel
    };
  });

  const maxRaschScore = Number(Object.values(qStatsMap).reduce((sum, q) => sum + q.weight, 0).toFixed(1)) || 1;
  const statsList = Object.values(qStatsMap);
  const hardestQuestions = [...statsList].sort((a, b) => b.weight - a.weight).slice(0, 5);
  const easiestQuestions = [...statsList].sort((a, b) => a.weight - b.weight).slice(0, 5);

  // 2. Calculate Rasch Score for each participant
  const rawParticipantList = submissions.map((sub) => {
    let raschScore = 0;
    let rawCorrect = Number(sub.correct_answers) || 0;
    const totalQuestions = questions.length || sub.total_questions || 1;

    questions.forEach((q, idx) => {
      const qNum = q.question_number || (idx + 1);
      const userAns = sub.answers?.[qNum] ?? sub.answers?.[String(qNum)];
      if (userAns !== undefined && userAns !== null && userAns !== "") {
        let isCorrect = false;
        if (typeof userAns === "object") {
          isCorrect = Boolean(userAns.is_correct || userAns.isCorrect);
        } else {
          const corr = q.correct_answer;
          if (typeof corr === "string") {
            isCorrect = String(userAns).trim().toUpperCase() === String(corr).trim().toUpperCase();
          } else if (typeof corr === "object") {
            isCorrect = JSON.stringify(userAns) === JSON.stringify(corr);
          }
        }
        if (isCorrect) {
          raschScore += (qStatsMap[qNum]?.weight || 1.0);
        }
      }
    });

    raschScore = Number(raschScore.toFixed(1));

    return {
      subId: sub.id || Math.random().toString(),
      userName: sub.user_name || "Foydalanuvchi",
      userEmail: sub.user_email || "",
      rawCorrect,
      totalQuestions,
      rawPercentage: Math.round((rawCorrect / totalQuestions) * 100),
      raschScore
    };
  });

  // Sort participants from MAX score to MIN score
  rawParticipantList.sort((a, b) => b.raschScore - a.raschScore);

  const topRaschScore = Math.max(...rawParticipantList.map((p) => p.raschScore), 0.1);

  // 3. Norm-referenced / Relative Rasch Grading (A+ to D)
  const participantResults: RaschParticipantResult[] = rawParticipantList.map((p, idx) => {
    const rank = idx + 1;
    // Relative percentage compared to top score achieved in group
    const relativeRaschPct = Math.min(100, Math.round((p.raschScore / topRaschScore) * 100));

    let raschGrade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' = 'C';
    let raschGradeTitle = 'Qoniqarli';
    let gradeBadgeColor = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';

    if (p.rawCorrect === 0 || p.raschScore === 0) {
      raschGrade = 'D';
      raschGradeTitle = 'Qo\'shimcha tayyorgarlik talab etiladi';
      gradeBadgeColor = 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30';
    } else if (relativeRaschPct >= 90 || rank === 1) {
      raschGrade = 'A+';
      raschGradeTitle = 'O\'ta Yuqori (Sertifikat A+)';
      gradeBadgeColor = 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 font-black';
    } else if (relativeRaschPct >= 78) {
      raschGrade = 'A';
      raschGradeTitle = 'A\'lo (Sertifikat A)';
      gradeBadgeColor = 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-bold';
    } else if (relativeRaschPct >= 66) {
      raschGrade = 'B+';
      raschGradeTitle = 'Yaxshi Plus (Sertifikat B+)';
      gradeBadgeColor = 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30 font-bold';
    } else if (relativeRaschPct >= 54) {
      raschGrade = 'B';
      raschGradeTitle = 'Yaxshi (Sertifikat B)';
      gradeBadgeColor = 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 font-semibold';
    } else if (relativeRaschPct >= 42) {
      raschGrade = 'C+';
      raschGradeTitle = 'Qoniqarli Plus (Sertifikat C+)';
      gradeBadgeColor = 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 border border-yellow-500/30 font-semibold';
    } else if (relativeRaschPct >= 30) {
      raschGrade = 'C';
      raschGradeTitle = 'Qoniqarli (Sertifikat C)';
      gradeBadgeColor = 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border border-orange-500/30';
    } else {
      raschGrade = 'D';
      raschGradeTitle = 'Qo\'shimcha tayyorgarlik talab etiladi';
      gradeBadgeColor = 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30';
    }

    return {
      ...p,
      maxRaschScore,
      relativeRaschPercentage: relativeRaschPct,
      raschGrade,
      raschGradeTitle,
      gradeBadgeColor,
      rank
    };
  });

  return {
    qStatsMap,
    maxRaschScore,
    topRaschScore,
    participantResults,
    hardestQuestions,
    easiestQuestions
  };
}

export const RaschModelAnalysis: React.FC<RaschModelAnalysisProps> = ({ questions, submissions, searchQuery = '' }) => {
  const raschData = useMemo(() => computeRaschModel(questions, submissions), [questions, submissions]);

  if (!submissions || submissions.length === 0) return null;

  const filteredResults = raschData.participantResults.filter((p) =>
    searchQuery
      ? p.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.userEmail.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  return (
    <div className="mt-6 space-y-4">
      {/* Structural Difficulty Info Banner */}
      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-white">
          <span>📐 Savollar Qiyinchilik Tuzilmasi va Rasch Og'irligi:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-bold">
            1-20: Oson (0.6x - 1.4x)
          </span>
          <span className="px-2.5 py-1 rounded-md bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20 font-bold">
            21-33: O'rtacha (1.1x - 2.0x)
          </span>
          <span className="px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 font-bold">
            34-43: Qiyin (1.8x - 2.8x)
          </span>
        </div>
      </div>

      {/* Difficulty Insight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Hardest Questions */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-rose-500" /> Eng Qiyin Savollar (Yuqori Rasch Bal Og'irligi)
            </h4>
            <span className="text-[10px] text-slate-400">Kam ishlangan</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {raschData.hardestQuestions.map((q) => (
              <div
                key={q.qNum}
                className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2"
              >
                <span className="font-bold">S{q.qNum}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 font-bold">
                  {q.weight}x ball
                </span>
                <span className="text-[10px] text-slate-400">
                  ({Math.round(q.successRate * 100)}% to'g'ri)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Easiest Questions */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Eng Oson Savollar (Standart Koeffitsiyent)
            </h4>
            <span className="text-[10px] text-slate-400">Ko'p ishlangan</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {raschData.easiestQuestions.map((q) => (
              <div
                key={q.qNum}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-2"
              >
                <span className="font-bold">S{q.qNum}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 font-bold">
                  {q.weight}x ball
                </span>
                <span className="text-[10px] text-slate-400">
                  ({Math.round(q.successRate * 100)}% to'g'ri)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Rasch Participants Table */}
      <div className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              Rasch Modeli (BMBA / DTM) Bo'yicha Natijalar va Darajalash (Max ➔ Min Tartiblangan)
            </h4>
          </div>
          <span className="text-[11px] text-slate-400">
            Jami: {filteredResults.length} ta o'quvchi
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase text-[10px] font-semibold">
              <tr>
                <th className="p-3 w-12 text-center">O'rin</th>
                <th className="p-3">O'quvchi</th>
                <th className="p-3 text-center">Standart Natija</th>
                <th className="p-3 text-center">Rasch Bal Og'irligi</th>
                <th className="p-3 text-center">Nisbiy Rasch Foiz (%)</th>
                <th className="p-3 text-center">Rasch (BMBA) Bahosi</th>
                <th className="p-3 text-center">Sertifikat Darajasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {filteredResults.map((res) => (
                <tr key={res.subId} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                  <td className="p-3 text-center font-bold text-slate-400">
                    #{res.rank}
                  </td>

                  <td className="p-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-xs shrink-0 border border-indigo-500/20">
                        {res.userName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{res.userName}</p>
                        <p className="text-[10px] text-slate-400">{res.userEmail || "Email mavjud emas"}</p>
                      </div>
                    </div>
                  </td>

                  <td className="p-3 text-center font-mono">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {res.rawCorrect} / {res.totalQuestions}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1">({res.rawPercentage}%)</span>
                  </td>

                  <td className="p-3 text-center font-mono">
                    <span className="font-bold text-sky-600 dark:text-sky-400">
                      {res.raschScore} pt
                    </span>
                  </td>

                  <td className="p-3 text-center font-bold font-mono text-sm">
                    <span className={res.relativeRaschPercentage >= 75 ? 'text-emerald-600 dark:text-emerald-400' : res.relativeRaschPercentage >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}>
                      {res.relativeRaschPercentage}%
                    </span>
                  </td>

                  <td className="p-3 text-center">
                    <span className={`inline-flex items-center justify-center px-3 py-1 rounded-lg text-xs font-black shadow-xs ${res.gradeBadgeColor}`}>
                      {res.raschGrade}
                    </span>
                  </td>

                  <td className="p-3 text-center">
                    <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                      {res.raschGradeTitle}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
