import React, { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3, Award, TrendingUp, Download, Search,
  Filter, CheckCircle2, AlertCircle, ArrowLeft, Loader2, Sparkles
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";

interface RaschParticipant {
  subId: string;
  userId: string;
  userName: string;
  userEmail: string;
  rawCorrect: number;
  totalQuestions: number;
  rawPercentage: number;
  raschScore: number;
  relativeRaschPercentage: number;
  raschGrade: string;
  raschGradeTitle: string;
  rank: number;
  completedAt: string;
}

interface ResultsData {
  test: {
    id: string;
    title: string;
    subject?: string;
    mode: string;
  };
  questions: any[];
  submissions: any[];
  rasch: {
    qStatsMap: Record<number, any>;
    maxRaschScore: number;
    topRaschScore: number;
    participantResults: RaschParticipant[];
    hardestQuestions: any[];
    easiestQuestions: any[];
  };
}

const GRADE_COLORS: Record<string, string> = {
  "A+": "bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40 font-black",
  "A": "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-bold",
  "B+": "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30 font-bold",
  "B": "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 font-semibold",
  "C+": "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 border-yellow-500/30 font-semibold",
  "C": "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30",
  "D": "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30"
};

const CenterResults = () => {
  const { id, testId } = useParams<{ id?: string; testId?: string }>();
  const initialTestId = testId || id || "";
  const { toast } = useToast();

  const [selectedTestId, setSelectedTestId] = useState<string>(initialTestId);
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");

  // Keep selectedTestId synced with URL param if it changes
  React.useEffect(() => {
    if (initialTestId) {
      setSelectedTestId(initialTestId);
    }
  }, [initialTestId]);

  // Fetch all center tests for selector
  const { data: testsOverview } = useQuery<{ results: any[] }>({
    queryKey: ["center-results-overview"],
    queryFn: async () => {
      const res = await fetch("/api/center/results", { credentials: "include" });
      if (!res.ok) return { results: [] };
      return res.json();
    }
  });

  const testList = testsOverview?.results || [];

  // Auto-select first test if not specified
  React.useEffect(() => {
    if (!selectedTestId && testList.length > 0) {
      setSelectedTestId(testList[0].id);
    }
  }, [testList, selectedTestId]);

  // Fetch results for selected test
  const { data: testResults, isLoading } = useQuery<ResultsData>({
    queryKey: ["center-test-results", selectedTestId],
    queryFn: async () => {
      if (!selectedTestId) return null;
      const res = await fetch(`/api/center/results/${selectedTestId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Natijalarni yuklab bo'lmadi");
      return res.json();
    },
    enabled: Boolean(selectedTestId)
  });

  const participants = testResults?.rasch?.participantResults || [];

  const filteredParticipants = useMemo(() => {
    return participants.filter(p => {
      const name = p.userName.toLowerCase();
      const email = p.userEmail.toLowerCase();
      const matchesSearch = name.includes(search.toLowerCase()) || email.includes(search.toLowerCase());
      if (gradeFilter !== "all") {
        return matchesSearch && p.raschGrade === gradeFilter;
      }
      return matchesSearch;
    });
  }, [participants, search, gradeFilter]);

  const exportCSV = () => {
    if (participants.length === 0) {
      toast({ title: "Natijalar mavjud emas" });
      return;
    }

    const headers = ["O'rin", "F.I.Sh.", "Email", "To'g'ri javoblar", "Jami savollar", "Standart ball (%)", "Rasch ball", "Nisbiy Rasch (%)", "Rasch Bahosi", "Sertifikat darajasi", "Topshirilgan vaqt"];
    const rows = participants.map(p => [
      p.rank,
      `"${p.userName}"`,
      p.userEmail,
      p.rawCorrect,
      p.totalQuestions,
      `${p.rawPercentage}%`,
      p.raschScore,
      `${p.relativeRaschPercentage}%`,
      p.raschGrade,
      `"${p.raschGradeTitle}"`,
      p.completedAt ? new Date(p.completedAt).toLocaleString() : ""
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `EduContest_${testResults?.test?.title || 'mock'}_results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <SEO title="Natijalar va Rasch tahlili — Markaz boshqaruvi" />
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Natijalar va Reyting (BMBA Standarti)
            </h2>
            <p className="text-sm text-slate-500 font-medium">
              Rasch modeli asosida savollar qiyinligi va o'quvchilarning haqiqiy reytingi.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            {participants.length > 0 && (
              <button
                onClick={exportCSV}
                className="px-4 py-2.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl font-bold text-xs flex items-center gap-2 hover:opacity-90 transition-all cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV Eksport</span>
              </button>
            )}
          </div>
        </div>

        {/* TEST SELECTOR */}
        {testList.length > 0 ? (
          <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-x-auto scrollbar-none -mx-1 px-2">
            {testList.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTestId(t.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                  selectedTestId === t.id
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <span>{t.title}</span>
                <span className="ml-1.5 text-[10px] text-slate-400">({t.completed_count})</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
            <p className="text-sm text-slate-500">Markazda hali mock testlar yaratilmagan.</p>
          </div>
        )}

        {/* MAIN RESULTS DISPLAY */}
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
            <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          </div>
        ) : testResults && participants.length > 0 ? (
          <div className="space-y-6">
            {/* HARDEST & EASIEST QUESTIONS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3 shadow-xs">
                <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                  <TrendingUp className="w-4 h-4" />
                  <span>Eng qiyin savollar (Past foizli)</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {testResults.rasch.hardestQuestions.map((q: any) => (
                    <div key={q.qNum} className="px-3 py-2 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-xl text-xs space-y-0.5">
                      <div className="font-bold text-rose-700 dark:text-rose-300">Savol #{q.qNum}</div>
                      <div className="text-[11px] text-rose-600 dark:text-rose-400">
                        To'g'ri: {Math.round(q.successRate * 100)}% • Og'irlik: {q.weight}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3 shadow-xs">
                <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Eng oson savollar (Yuqori foizli)</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {testResults.rasch.easiestQuestions.map((q: any) => (
                    <div key={q.qNum} className="px-3 py-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 rounded-xl text-xs space-y-0.5">
                      <div className="font-bold text-emerald-700 dark:text-emerald-300">Savol #{q.qNum}</div>
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400">
                        To'g'ri: {Math.round(q.successRate * 100)}% • Og'irlik: {q.weight}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* PARTICIPANTS TABLE */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs space-y-4 p-4 sm:p-6">
              {/* FILTERS */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative flex-1 w-full max-w-sm">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="O'quvchini qidirish..."
                    className="w-full h-10 pl-10 pr-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold"
                  />
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-xs font-bold text-slate-400">Baho:</span>
                  <select
                    value={gradeFilter}
                    onChange={(e) => setGradeFilter(e.target.value)}
                    className="h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    <option value="all">Barchasi</option>
                    <option value="A+">A+</option>
                    <option value="A">A</option>
                    <option value="B+">B+</option>
                    <option value="B">B</option>
                    <option value="C+">C+</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>
              </div>

              {/* TABLE */}
              <div className="sm:hidden text-[11px] text-slate-400 px-1">
                ← To'liq natijalar uchun jadvalni o'ngga suring →
              </div>
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-left text-sm min-w-[760px]">
                  <thead className="border-b border-slate-100 dark:border-slate-800 text-[11px] uppercase tracking-wider font-bold text-slate-400">
                    <tr>
                      <th className="py-3 px-3">#</th>
                      <th className="py-3 px-4">O'quvchi</th>
                      <th className="py-3 px-4">Standart natija</th>
                      <th className="py-3 px-4">Rasch ball</th>
                      <th className="py-3 px-4">Nisbiy Rasch foizi</th>
                      <th className="py-3 px-4">Rasch Bahosi</th>
                      <th className="py-3 px-4">Sertifikat darajasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredParticipants.map((p) => {
                      const badgeStyle = GRADE_COLORS[p.raschGrade] || "bg-slate-100 text-slate-700";

                      return (
                        <tr key={p.subId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-3 font-bold text-slate-500">
                            {p.rank === 1 ? "🥇" : p.rank === 2 ? "🥈" : p.rank === 3 ? "🥉" : p.rank}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                            <div>{p.userName}</div>
                            <div className="text-[11px] text-slate-400 font-normal">{p.userEmail}</div>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                            {p.rawCorrect} / {p.totalQuestions} ({p.rawPercentage}%)
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                            {p.raschScore}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                            <div className="flex items-center gap-2">
                              <span>{p.relativeRaschPercentage}%</span>
                              <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-[#E8192C] rounded-full" style={{ width: `${p.relativeRaschPercentage}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`text-[11px] px-2.5 py-0.5 rounded-md border ${badgeStyle}`}>
                              {p.raschGrade}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
                            {p.raschGradeTitle}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-16 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
              <BarChart3 className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Hozircha natijalar mavjud emas</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              O'quvchilar testni ishlab bo'lgach, ularning Rasch ballari va umumiy reytingi shu yerda avtomatik hisoblanadi.
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default CenterResults;
