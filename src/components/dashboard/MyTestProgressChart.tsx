import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { ChevronDown, TrendingUp, Sparkles, Rocket, FileBadge } from "lucide-react";

interface TestAttempt {
  id: string;
  index: string;
  percentage: number;
  testName: string;
  date: string;
}

export const MyTestProgressChart: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [filterLimit, setFilterLimit] = useState<number>(10);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  const userId = user?.id || profile?.user_id || profile?.id;

  // Fetch real test sessions & mock test submissions from Supabase
  const { data: realSessions = [], isLoading } = useQuery({
    queryKey: ["my-test-progress-sessions-all-unified", userId],
    queryFn: async () => {
      if (!userId) return [];
      try {
        // 1. Fetch practice test sessions
        const { data: standardSessions = [], error: stdErr } = await (supabase as any)
          .from("test_sessions")
          .select(`
            id,
            created_at,
            finished_at,
            score,
            total_questions,
            correct_answers,
            wrong_answers,
            test_folders ( name, subject )
          `)
          .eq("user_id", userId)
          .order("created_at", { ascending: true });

        if (stdErr) console.error("Fetch standard sessions error:", stdErr);

        // 2. Fetch mock test submissions
        const { data: mockSubs = [], error: mockErr } = await (supabase as any)
          .from("mock_test_submissions")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: true });

        if (mockErr) console.error("Fetch mock submissions error:", mockErr);

        // Map mock tests titles if mockSubs exist
        let mockTestsMap: Record<string, string> = {};
        if (mockSubs && mockSubs.length > 0) {
          const testIds = [...new Set(mockSubs.map((m: any) => m.test_id).filter(Boolean))];
          if (testIds.length > 0) {
            const { data: mockTestsData } = await (supabase as any)
              .from("mock_tests")
              .select("id, title")
              .in("id", testIds);
            if (mockTestsData) {
              mockTestsData.forEach((m: any) => {
                mockTestsMap[m.id] = m.title;
              });
            }
          }
        }

        // Format standard sessions
        const stdList = (standardSessions || [])
          .filter((s: any) => s.finished_at != null || (s.correct_answers || 0) > 0 || (s.wrong_answers || 0) > 0 || (s.score || 0) > 0)
          .map((s: any) => ({
            id: s.id,
            created_at: s.finished_at || s.created_at,
            score: s.score,
            total_questions: s.total_questions || ((s.correct_answers || 0) + (s.wrong_answers || 0)),
            correct_answers: s.correct_answers || 0,
            testName: s.test_folders?.name || s.test_folders?.title || "Mavzulashtirilgan Test",
          }));

        // Format mock test submissions
        const mockList = (mockSubs || []).map((m: any) => {
          const total = m.total_questions || m.raw_results?.total_questions || 0;
          const correct = m.correct_answers || m.raw_results?.correct_answers || 0;
          const name = mockTestsMap[m.test_id] || "Mock Test";
          return {
            id: m.id,
            created_at: m.created_at,
            score: m.score,
            total_questions: total,
            correct_answers: correct,
            testName: name,
          };
        });

        // Combine and sort by date ascending
        const combined = [...stdList, ...mockList].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

        return combined;
      } catch (e) {
        console.error("Query error:", e);
        return [];
      }
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  // Process ONLY real data for the chart (No demo/fake mockups)
  const chartData: TestAttempt[] = useMemo(() => {
    if (!realSessions || realSessions.length === 0) return [];

    let rawList: TestAttempt[] = realSessions.map((s: any, idx: number) => {
      const total = s.total_questions || 1;
      const correct = s.correct_answers || 0;
      const pct = s.score != null && s.score > 0
        ? Math.min(100, Math.max(0, Math.round(s.score)))
        : (total > 0 ? Math.min(100, Math.max(0, Math.round((correct / total) * 100))) : 0);

      const dateStr = s.created_at
        ? new Date(s.created_at).toLocaleDateString("uz-UZ", { day: "2-digit", month: "short" })
        : `Test ${idx + 1}`;

      return {
        id: s.id || `session-${idx}`,
        index: (idx + 1).toString().padStart(2, "0"),
        percentage: pct,
        testName: s.testName || "Sinov Testi",
        date: dateStr,
      };
    });

    // Apply filter limit (e.g., last 5, last 10, last 20, or all)
    if (filterLimit > 0 && rawList.length > filterLimit) {
      rawList = rawList.slice(rawList.length - filterLimit);
    }

    // Re-index for display (01, 02, 03...)
    return rawList.map((item, idx) => ({
      ...item,
      index: (idx + 1).toString().padStart(2, "0"),
    }));
  }, [realSessions, filterLimit]);

  // Calculate percentage growth from first attempt to latest attempt in real dataset
  const growthPercent = useMemo(() => {
    if (chartData.length < 2) return 0;
    const first = chartData[0].percentage;
    const last = chartData[chartData.length - 1].percentage;
    return last - first;
  }, [chartData]);

  const filterOptions = [
    { label: "Oxirgi 5 ta test", value: 5 },
    { label: "Oxirgi 10 ta test", value: 10 },
    { label: "Oxirgi 20 ta test", value: 20 },
    { label: "Barcha testlar", value: 0 },
  ];

  const activeFilterLabel = filterOptions.find((o) => o.value === filterLimit)?.label || "Oxirgi 10 ta test";

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-6 transition-all">
      {/* Header: Title & Dropdown Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Mening natijalarim
          </h2>
        </div>

        {/* Filter Dropdown (only show when there is data) */}
        {chartData.length > 0 && (
          <div className="relative self-start sm:self-auto">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-2xs active:scale-95 cursor-pointer"
            >
              <span>{activeFilterLabel}</span>
              <ChevronDown size={16} className={`text-slate-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95">
                {filterOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setFilterLimit(opt.value);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition-colors flex items-center justify-between ${
                      filterLimit === opt.value
                        ? "text-[#E8192C] bg-red-50 dark:bg-red-500/10 font-bold"
                        : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    }`}
                  >
                    <span>{opt.label}</span>
                    {filterLimit === opt.value && <span className="w-1.5 h-1.5 rounded-full bg-[#E8192C]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Real Data View OR Real Empty State */}
      {chartData.length > 0 ? (
        <div className="flex flex-col lg:flex-row items-stretch gap-6">
          {/* Recharts Area Container with Red/Black Branding */}
          <div className="flex-1 w-full h-[260px] sm:h-[300px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 15, right: 10, left: -20, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="scoreRedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E8192C" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#E8192C" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#E2E8F0" opacity={0.5} />

                <XAxis
                  dataKey="index"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94A3B8", fontSize: 11, fontWeight: 600 }}
                  dy={10}
                />

                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `${val}%`}
                  tick={{ fill: "#94A3B8", fontSize: 11, fontWeight: 500 }}
                />

                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data: TestAttempt = payload[0].payload;
                      return (
                        <div className="bg-slate-950 text-white p-3.5 rounded-2xl shadow-2xl border border-slate-800 text-xs space-y-1 z-50">
                          <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-1.5">
                            <span className="font-bold text-[#E8192C]">Test #{data.index}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{data.date}</span>
                          </div>
                          <p className="font-extrabold text-sm text-white">{data.testName}</p>
                          <div className="flex items-center gap-1.5 text-emerald-400 font-extrabold pt-0.5">
                            <TrendingUp size={14} />
                            <span>Natija: {data.percentage}%</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="percentage"
                  stroke="#E8192C"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#scoreRedGradient)"
                  dot={{
                    r: 5,
                    fill: "#E8192C",
                    stroke: "#FFFFFF",
                    strokeWidth: 2,
                  }}
                  activeDot={{
                    r: 7,
                    fill: "#090D16",
                    stroke: "#E8192C",
                    strokeWidth: 2.5,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Growth Card with Red Accent */}
          <div className="w-full lg:w-44 bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/60 flex flex-col items-center justify-center text-center shrink-0 shadow-2xs">
            <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              {growthPercent >= 0 ? `+${growthPercent}%` : `${growthPercent}%`}
            </div>
            <div className="text-xs font-extrabold text-[#E8192C] mt-1 flex items-center gap-1">
              <TrendingUp size={14} className={growthPercent >= 0 ? "text-emerald-500" : "text-rose-500"} />
              <span>o'sish</span>
            </div>
          </div>
        </div>
      ) : (
        /* Real Empty State when User Has No Test Sessions Yet */
        <div className="py-12 px-4 text-center space-y-4 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-[#E8192C] flex items-center justify-center mx-auto border border-red-500/20">
            <FileBadge size={28} />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Hali yechilgan testlar mavjud emas
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Test ishlashni boshlang va har bir topshirgan imtihoningiz bo'yicha o'sish dinamikangiz real vaqtda shu grafikda aks etadi!
            </p>
          </div>
          <button
            onClick={() => navigate("/tests")}
            className="px-6 py-3 rounded-2xl bg-[#E8192C] hover:bg-[#C8001A] text-white text-xs font-bold transition-all shadow-md active:scale-95 inline-flex items-center gap-2 cursor-pointer"
          >
            <Rocket size={16} />
            <span>Hoziroq Test Ishlash</span>
          </button>
        </div>
      )}

      {/* Subtitle Footer Note */}
      <div className="pt-1 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 font-medium">
        <p>Har bir nuqta — bitta yechilgan test, eskisidan yangisiga qarab.</p>
        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-[#E8192C] dark:text-red-400 font-bold bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-500/20">
          <Sparkles size={12} />
          Real Tahlil
        </span>
      </div>
    </div>
  );
};
