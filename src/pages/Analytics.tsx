import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, TrendingUp, Bookmark, Flame,
  Activity,
  ChevronDown, Filter, BarChart3, Target,
  Zap, BrainCircuit, Star, AlertCircle, Lightbulb
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid,
  AreaChart, Area
} from 'recharts';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSubject } from '@/hooks/useSubject';

const PremiumModal = ({ isOpen, onClose, onUpgrade }: { isOpen: boolean, onClose: () => void, onUpgrade: () => void }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/80"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        >
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center mx-auto">
              <Star className="w-6 h-6 text-slate-600 dark:text-slate-300" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white uppercase tracking-tight">Premium resurs</h2>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                USHBU MA'LUMOTNI KO'RISH UCHUN OBUNA KERAK
              </p>
            </div>
          </div>
          <div className="px-8 pb-8 space-y-6">
            <div className="space-y-3">
              {[
                "Barcha eksklyuziv qo'llanmalar",
                "Video darslar va mashqlar",
                "AI yordamchidan cheksiz foydalanish",
                "Olimpiada va sertifikatlar"
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#E8192C] shrink-0" />
                  <span className="text-[13px] font-medium text-slate-600 dark:text-slate-400">{text}</span>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <Button
                onClick={onUpgrade}
                className="w-full bg-[#E8192C] hover:bg-[#D41524] text-white h-11 rounded-xl font-medium text-[13px]"
              >
                Hozir obuna bo'lish
              </Button>
              <Button
                onClick={onClose}
                variant="ghost"
                className="w-full h-11 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-xl font-medium text-[13px]"
              >
                Keyinroq
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const PremiumOverlay = ({ title, onClick, topClass = "top-[76px]" }: { title: string; onClick?: () => void; topClass?: string }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={`${title} Pro obuna bilan ochiladi`}
    className={`group/prolock absolute inset-x-0 bottom-0 ${topClass} z-20 cursor-pointer rounded-b-2xl bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800`}
  >
    <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-900 dark:bg-slate-800 px-3 py-1.5 text-[11px] font-medium text-white">
      Pro-ga o'tib oching
    </span>
  </button>
);

const StatCard = ({ label, value, icon: Icon, extra }: any) => (
  <div className="p-5 rounded-2xl flex flex-col justify-between h-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
    <div className="flex justify-between items-start">
      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider leading-none">{label}</span>
      <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <Icon className="w-4 h-4 text-slate-400" />
      </div>
    </div>
    <div className="flex flex-col mt-auto">
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-slate-900 dark:text-white leading-none tracking-tighter">{value}</span>
        {extra && <span className="text-[11px] font-medium text-slate-500">{extra}</span>}
      </div>
    </div>
  </div>
);

const TopicVerticalBar = ({ accuracy }: { accuracy: number }) => (
  <div className="relative h-24 w-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex flex-col justify-end">
    <motion.div
      initial={{ height: 0 }}
      animate={{ height: `${accuracy}%` }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      className="w-full bg-[#E8192C] relative"
    />
  </div>
);

const DonutChart = ({ data, centerText = "avg", bigText = "0m 0s" }: { data: any[], centerText?: string, bigText?: string }) => (
  <div className="relative w-full h-[140px] flex items-center justify-center">
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={62} paddingAngle={5} dataKey="value" stroke="none" cornerRadius={6}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <RechartsTooltip />
      </PieChart>
    </ResponsiveContainer>
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none translate-y-1">
      <span className="text-sm font-medium text-slate-900 dark:text-white leading-none">{bigText}</span>
      <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase mt-1 tracking-wider">{centerText}</span>
    </div>
  </div>
);

export default function Analytics() {
  const { user } = useAuth();
  const { activeSubject, setActiveSubject } = useSubject();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCompare, setIsCompare] = useState(false);
  const [subjectA, setSubjectA] = useState<string | null>(null);
  const [subjectB, setSubjectB] = useState<string | null>(null);

  const openModal = () => setIsModalOpen(true);

  const { data: stats } = useQuery({
    queryKey: ['analytics_totals', user?.id, activeSubject],
    queryFn: async () => {
      if (!user) return null;

      const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
      const profAny = profile as any;
      const role = profAny?.role?.toLowerCase();
      const tier = profAny?.subscription_tier?.toLowerCase();
      const expiresAt = profAny?.subscription_expires_at;
      const isExpired = expiresAt ? new Date(expiresAt) < new Date() : false;

      const isPro = role === 'admin' || role === 'sub_admin' || role === 'teacher' ||
        ((tier === 'premium' || tier === 'pro') && !isExpired) ||
        profAny?.is_lifetime === true;

      const { data: ssRaw } = await supabase
        .from('test_sessions')
        .select(`id, created_at, finished_at, score, total_questions, correct_answers, wrong_answers, test_folders ( name, subject )`)
        .eq('user_id', user.id)
        .not('finished_at', 'is', null)
        .order('created_at', { ascending: true });

      const ssCurrent = activeSubject
        ? (ssRaw || []).filter((s: any) => s.test_folders?.subject === activeSubject)
        : (ssRaw || []);

      const sids = ssCurrent.map((s: any) => s.id);

      if (sids.length === 0) {
        return { total: 0, accuracy: 0, saved: 0, sessions: [], isPro, streak: 0 };
      }

      const fetchInChunks = async (ids: string[], selectStr: string, extraFilter?: (q: any) => any) => {
        const chunkSize = 50;
        let allData: any[] = [];
        for (let i = 0; i < ids.length; i += chunkSize) {
          const chunk = ids.slice(i, i + chunkSize);
          let query = supabase.from('test_answers').select(selectStr).in('session_id', chunk);
          if (extraFilter) query = extraFilter(query);
          const { data } = await query;
          if (data) allData = [...allData, ...data];
        }
        return allData;
      };

      const uniqueAnswers = await fetchInChunks(sids, 'question_id');
      const uniqueIds = new Set(uniqueAnswers?.map(a => (a as any).question_id));
      const realTotal = uniqueIds.size;

      const results = await fetchInChunks(sids, 'is_correct', q => q.eq('is_correct', true));
      const realCorrect = results.length;
      const accuracy = realTotal > 0 ? Math.round(((realCorrect || 0) / (uniqueAnswers?.length || 1)) * 100) : 0;
      const { count: saved } = await (supabase as any).from('bookmarks').select('*', { count: 'exact', head: true }).eq('user_id', user.id);

      const dates = Array.from(new Set((ssRaw || []).map((s: any) => new Date(s.created_at).toLocaleDateString('sv-SE')))).sort().reverse();
      let streak = 0;
      const today = new Date();
      for (let i = 0; i < 365; i++) {
        const dStr = today.toLocaleDateString('sv-SE');
        if (dates.includes(dStr)) streak++;
        else if (i > 0) break;
        today.setDate(today.getDate() - 1);
      }

      return { total: realTotal || 0, accuracy, saved: saved || 0, sessions: ssCurrent || [], isPro, streak };
    },
    enabled: !!user
  });

  const { data: insights } = useQuery({
    queryKey: ['analytics_insights', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data: sessions } = await supabase
        .from('test_sessions')
        .select('id')
        .eq('user_id', user.id)
        .not('finished_at', 'is', null)
        .order('finished_at', { ascending: false })
        .limit(50);
      const sids = (sessions || []).map(s => s.id);

      if (sids.length === 0) return null;

      const fetchInsightsInChunks = async (ids: string[]) => {
        const chunkSize = 40;
        let allData: any[] = [];
        for (let i = 0; i < ids.length; i += chunkSize) {
          const chunk = ids.slice(i, i + chunkSize);
          const { data } = await supabase
            .from('test_answers')
            .select('is_correct, created_at, questions(level, folder_id, test_folders(name, subject))')
            .in('session_id', chunk)
            .order('created_at', { ascending: false });
          if (data) allData = [...allData, ...data];
          if (allData.length >= 1500) break;
        }
        return allData.slice(0, 1000);
      };

      const ans = await fetchInsightsInChunks(sids);

      if (!ans || ans.length === 0) return null;

      const topics: Record<string, any> = {};
      const subjectStats: Record<string, any> = { total: 0, correct: 0, subjects: {} };
      const weeks: Record<string, any> = {};

      ans.forEach((a: any) => {
        const name = a.questions?.test_folders?.name || 'Nomaʼlum';
        const subj = a.questions?.test_folders?.subject || 'Boshqa';
        const date = new Date(a.created_at);

        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(new Date(date).setDate(diff));
        const wKey = monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        if (!weeks[wKey]) {
          weeks[wKey] = {
            name: wKey,
            sort: monday.getTime(),
            c_easy: 0, c_med: 0, c_hard: 0,
            w_easy: 0, w_med: 0, w_hard: 0,
            totalCorrect: 0, totalWrong: 0
          };
        }

        const lvl = a.questions?.level === 'qiyin' ? 'hard' : a.questions?.level === 'osrta' ? 'med' : 'easy';
        if (a.is_correct) {
          weeks[wKey][`c_${lvl}`]++;
          weeks[wKey].totalCorrect++;
        } else {
          weeks[wKey][`w_${lvl}`]++;
          weeks[wKey].totalWrong++;
        }

        if (!topics[name]) topics[name] = { correct: 0, total: 0, subject: subj };
        topics[name].total++;
        if (a.is_correct) topics[name].correct++;

        if (!subjectStats.subjects[subj]) subjectStats.subjects[subj] = { correct: 0, total: 0, levels: { easy: 0, med: 0, hard: 0, wrong: 0 } };
        subjectStats.subjects[subj].total++;
        if (a.is_correct) {
          subjectStats.subjects[subj].correct++;
          const l = a.questions?.level === 'qiyin' ? 'hard' : a.questions?.level === 'osrta' ? 'med' : 'easy';
          subjectStats.subjects[subj].levels[l]++;
        } else {
          subjectStats.subjects[subj].levels.wrong++;
        }
      });

      const trendData = Object.values(weeks).sort((a: any, b: any) => a.sort - b.sort);
      const totalCorrect = trendData.reduce((acc, curr) => acc + curr.totalCorrect, 0);
      const totalWrong = trendData.reduce((acc, curr) => acc + curr.totalWrong, 0);

      const totalMs = stats?.sessions?.reduce((acc: number, s: any) => acc + (s.duration_seconds || 0), 0) || 0;
      const totalQuestions = stats?.total || 1;
      const avgSeconds = Math.round(totalMs / totalQuestions);
      const avgTimeStr = `${Math.floor(avgSeconds / 60)}m ${avgSeconds % 60}s`;

      const heatmap: any[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dStr = d.toLocaleDateString('uz-UZ', { month: 'numeric', day: 'numeric' });
        const dayActions = ans.filter(a => new Date(a.created_at).toDateString() === d.toDateString()).length;
        heatmap.push({ date: dStr, count: dayActions });
      }

      const topicList = Object.entries(topics).map(([name, s]) => ({
        name,
        accuracy: Math.round((s.correct / s.total) * 100),
        attempts: s.total,
        subject: s.subject
      }));

      const availableSubjects = Object.keys(subjectStats.subjects);

      const sortedSubj = Object.entries(subjectStats.subjects)
        .map(([name, s]: [string, any]) => ({ name, acc: Math.round((s.correct / s.total) * 100), total: s.total }))
        .sort((a, b) => b.acc - a.acc);

      const best = sortedSubj[0];
      const worst = [...sortedSubj].reverse().find(s => s.total > 2) || sortedSubj[sortedSubj.length - 1];

      const aiSummary = {
        strengths: best ? `${best.name} fanidan aniqlik ${best.acc}% ni tashkil etmoqda. Bu sizning eng kuchli tomoningiz.` : "Hali ma'lumotlar yetarli emas.",
        weaknesses: worst ? `${worst.name} fanidan ko'p xatoliklar (aniqlik ${worst.acc}%) kuzatilmoqda. Mavzularni qayta ko'ring.` : "Hozircha zaif nuqtalar aniqlanmadi.",
        tips: worst ? `Keyingi 3 kun davomida faqat ${worst.name} mavzusidagi "qiyin" darajadagi testlarni ishlang.` : "Muntazamlikni saqlang va har kuni kamida 20 ta savol yeching."
      };

      return { topics: topicList, availableSubjects, subjectStats, aiSummary, trendData, totalCorrect, totalWrong, heatmapData: heatmap, avgTimeStr };
    },
    enabled: !!user
  });

  const onUpgrade = () => navigate('/settings/obuna');

  const progressData = (stats?.sessions || []).slice(-12).map((s: any, i: number) => {
    const total = s.total_questions || 0;
    const score = typeof s.score === 'number'
      ? Math.round(s.score)
      : total > 0
        ? Math.round(((s.correct_answers || 0) / total) * 100)
        : 0;

    return {
      name: new Date(s.finished_at || s.created_at).toLocaleDateString('uz-UZ', { month: 'short', day: 'numeric' }),
      order: i + 1,
      score,
      correct: s.correct_answers || 0,
      wrong: s.wrong_answers || Math.max(total - (s.correct_answers || 0), 0),
      subject: s.test_folders?.name || s.test_folders?.subject || 'Test'
    };
  });

  const latestScore = progressData[progressData.length - 1]?.score || 0;
  const averageScore = progressData.length
    ? Math.round(progressData.reduce((sum: number, item: any) => sum + item.score, 0) / progressData.length)
    : 0;
  const previousScore = progressData[progressData.length - 2]?.score;
  const scoreDelta = previousScore === undefined ? 0 : latestScore - previousScore;

  const SubjectComparisonCard = ({ sName }: { sName: string | null }) => {
    if (!sName || !insights?.subjectStats?.subjects[sName]) {
      return (
        <div className="h-full flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 opacity-50">
          <Filter className="w-8 h-8 mb-4 text-slate-300" />
          <p className="text-[13px] font-medium text-slate-400 uppercase tracking-wider text-center">Fanni tanlang</p>
        </div>
      );
    }
    const data = insights.subjectStats.subjects[sName];
    const acc = Math.round((data.correct / data.total) * 100);

    return (
      <div className="space-y-4 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white uppercase tracking-tight">{sName}</h3>
          <span className="text-[13px] font-medium px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">{acc}%</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <p className="text-[11px] font-medium text-slate-400 uppercase mb-1">Jami</p>
            <p className="text-lg font-medium text-slate-900 dark:text-white leading-none">{data.total}</p>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <p className="text-[11px] font-medium text-slate-400 uppercase mb-1">To'g'ri</p>
            <p className="text-lg font-medium text-slate-700 leading-none">{data.correct}</p>
          </div>
        </div>
        <div className="space-y-4 pt-2">
          <DonutChart data={[
            { name: 'Oson', value: Math.round((data.levels.easy / (data.total || 1)) * 100), color: '#94A3B8' },
            { name: "O'rta", value: Math.round((data.levels.med / (data.total || 1)) * 100), color: '#475569' },
            { name: 'Qiyin', value: Math.round((data.levels.hard / (data.total || 1)) * 100), color: '#E8192C' }
          ]} />
        </div>
        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 mt-2">
          <p className="text-[11px] font-medium text-[#E8192C] uppercase flex items-center gap-2 mb-2">Tavsiya</p>
          <p className="text-[13px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            {acc < 50 ? "Mavzuni boshidan takrorlashni maslahat beramiz." : "Natijangiz barqaror, ko'proq qiyin savollarga e'tibor bering."}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <SEO title="Analitika" description="Sizning o'quv natijalaringiz va shaxsiy tahlilingiz." />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">

        <PremiumModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onUpgrade={() => { setIsModalOpen(false); onUpgrade(); }}
        />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2 tracking-tight uppercase">
              <BarChart3 className="w-5 h-5 text-[#E8192C]" /> Analitika <span className="text-slate-300 dark:text-slate-700">/</span> {isCompare ? "Solishtirish" : (activeSubject || "Umumiy")}
            </h1>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Real vaqt rejimidagi analiz</p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={isCompare ? "default" : "outline"}
              onClick={() => !stats?.isPro ? openModal() : setIsCompare(!isCompare)}
              className={`h-9 px-4 rounded-xl font-medium text-[13px] gap-2 transition-all ${isCompare ? 'bg-[#E8192C] text-white hover:bg-[#D41524]' : ''}`}
            >
              <Activity className="w-3.5 h-3.5" />
              Solishtirish
            </Button>

            {!isCompare && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl font-medium h-9 px-4 text-[13px] gap-2">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    {activeSubject || "Fanlar"}
                    <ChevronDown className="w-3.5 h-3.5 opacity-40" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[180px] rounded-xl p-1 border-slate-200 dark:border-slate-800">
                  <DropdownMenuItem onClick={() => setActiveSubject(null)} className="rounded-lg font-medium text-[13px] cursor-pointer">Barcha fanlar</DropdownMenuItem>
                  {insights?.availableSubjects?.map((s: string) => (
                    <DropdownMenuItem key={s} onClick={() => setActiveSubject(s)} className="rounded-lg font-medium text-[13px] cursor-pointer">{s}</DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <div className="h-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 rounded-xl flex items-center gap-2">
              <Flame className="w-3.5 h-3.5 text-[#E8192C]" />
              <span className="text-[13px] font-medium text-slate-900 dark:text-white leading-none">{stats?.streak || 0}</span>
            </div>
          </div>
        </div>

        {isCompare ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-in slide-in-from-bottom duration-500">
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider px-2">Chap Tomon (Fan A)</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-7 text-[13px] font-medium text-[#E8192C] hover:bg-slate-100 dark:hover:bg-slate-800">Fan Tanlash</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="rounded-xl w-48">
                    {insights?.availableSubjects?.map((s: string) => (
                      <DropdownMenuItem key={s} onClick={() => setSubjectA(s)} className="text-[13px] font-medium">{s}</DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <SubjectComparisonCard sName={subjectA} />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider px-2">O'ng Tomon (Fan B)</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-7 text-[13px] font-medium text-[#E8192C] hover:bg-slate-100 dark:hover:bg-slate-800">Fan Tanlash</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="rounded-xl w-48">
                    {insights?.availableSubjects?.map((s: string) => (
                      <DropdownMenuItem key={s} onClick={() => setSubjectB(s)} className="text-[13px] font-medium">{s}</DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <SubjectComparisonCard sName={subjectB} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 animate-in fade-in duration-500">
            {/* Top Stats */}
            <div className="lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Jami urinishlar" value={stats?.total || 0} icon={Target} extra={`${stats?.sessions?.length || 0} sessiya`} />
              <StatCard label="O'rtacha aniqlik" value={`${stats?.accuracy || 0}%`} icon={TrendingUp} extra="Progress" />
              <StatCard label="Saqlanganlar" value={stats?.saved || 0} icon={Bookmark} />
              <StatCard label="Seriya" value={stats?.streak || 0} icon={Flame} extra="Kunlar" />
            </div>

            {/* Growth Chart */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl relative overflow-hidden">
              {!stats?.isPro && <PremiumOverlay title="O'zlashtirish Grafigi" onClick={openModal} topClass="top-[132px]" />}
              <div className="flex flex-col justify-between gap-6 p-6 xl:flex-row xl:items-start">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white uppercase tracking-tight">O'zlashtirish grafigi</h3>
                      <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Oxirgi {progressData.length || 0} ta test natijasi</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 w-full xl:w-auto">
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 min-w-0">
                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider truncate">Oxirgisi</p>
                    <p className="text-xl font-semibold text-slate-900 dark:text-white leading-none mt-1.5">{latestScore}%</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 min-w-0">
                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider truncate">O'rtacha</p>
                    <p className="text-xl font-semibold text-slate-900 dark:text-white leading-none mt-1.5">{averageScore}%</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 min-w-0">
                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider truncate">O'zgarish</p>
                    <p className="text-xl font-semibold text-slate-900 dark:text-white leading-none mt-1.5">
                      {scoreDelta > 0 ? '↑' : scoreDelta < 0 ? '↓' : ''}{Math.abs(scoreDelta)}%
                    </p>
                  </div>
                </div>
              </div>

              {progressData.length > 0 ? (
                <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_260px] gap-5 p-5 md:p-6">
                  <div className="h-[280px] rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={progressData} margin={{ top: 12, right: 12, left: -18, bottom: 0 }}>
                        <defs>
                          <linearGradient id="analyticsProgressGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#94A3B8" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="#e2e8f0" opacity={0.7} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 500, fill: '#94a3b8' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} domain={[0, 100]} tick={{ fontSize: 10, fontWeight: 500, fill: '#94a3b8' }} />
                        <RechartsTooltip
                          cursor={{ stroke: '#E8192C', strokeWidth: 1, strokeDasharray: '4 4' }}
                          contentStyle={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px', fontWeight: 500 }}
                          formatter={(value: any, name: string) => [`${value}${name === 'score' ? '%' : ''}`, name === 'score' ? "Natija" : name]}
                          labelFormatter={(_, payload) => payload?.[0]?.payload?.subject || 'Test'}
                        />
                        <Area
                          type="monotone"
                          dataKey="score"
                          stroke="#64748B"
                          strokeWidth={2}
                          fill="url(#analyticsProgressGradient)"
                          dot={{ r: 3, fill: '#64748B', stroke: '#fff', strokeWidth: 2 }}
                          activeDot={{ r: 5, fill: '#E8192C', stroke: '#fff', strokeWidth: 2 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[11px] font-medium text-slate-900 dark:text-white uppercase tracking-wider">Savollar kesimi</h4>
                      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">So'nggi testlar</span>
                    </div>
                    <div className="space-y-3 max-h-[226px] overflow-y-auto pr-1">
                      {progressData.slice(-6).reverse().map((item: any) => (
                        <div key={`${item.order}-${item.name}`} className="space-y-1.5">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-[13px] font-medium text-slate-700 dark:text-slate-200 truncate">{item.subject}</p>
                            <span className="text-[13px] font-medium text-[#E8192C]">{item.score}%</span>
                          </div>
                          <div className="grid grid-cols-[1fr_auto] items-center gap-3">
                            <div className="h-1.5 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 flex">
                              <div className="bg-[#E8192C]" style={{ width: `${item.correct + item.wrong > 0 ? (item.correct / (item.correct + item.wrong)) * 100 : 0}%` }} />
                            </div>
                            <p className="text-[11px] font-medium text-slate-400 tabular-nums">{item.correct}/{item.correct + item.wrong}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="m-5 h-[220px] rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center text-center px-6 md:m-6">
                  <BarChart3 className="w-8 h-8 text-slate-300 mb-3" />
                  <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hali grafik uchun natija yo'q</p>
                  <p className="text-[13px] text-slate-400 font-medium mt-1">Test topshirilgandan keyin o'zlashtirish dinamikasi shu yerda ko'rinadi.</p>
                </div>
              )}
            </div>

            {/* Weekly Activity */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl relative overflow-hidden">
              {!stats?.isPro && <PremiumOverlay title="Faollik Trendi" onClick={openModal} topClass="top-[84px]" />}
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white uppercase tracking-tight">Faollik tahlili (Haftalik)</h3>
                <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider mt-1">Xatolar qizil rangda, to'g'ri javoblar kul rangda.</p>
              </div>
              <div className="px-6 py-5 flex items-center gap-10 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-slate-900 dark:text-white leading-none">{insights?.totalCorrect || 0}</p>
                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mt-1">To'g'ri</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-700">
                    <AlertCircle className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-slate-900 dark:text-white leading-none">{insights?.totalWrong || 0}</p>
                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mt-1">Xato</p>
                  </div>
                </div>
              </div>
              <div className="mt-6 h-[260px] w-full px-6 pb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={insights?.trendData} barGap={0}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 500, fill: '#94a3b8' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 500, fill: '#94a3b8' }} />
                    <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', padding: '8px 12px' }} />
                    <Bar dataKey="w_hard" stackId="a" fill="#991B1B" barSize={32} />
                    <Bar dataKey="w_med" stackId="a" fill="#E8192C" />
                    <Bar dataKey="w_easy" stackId="a" fill="#FCA5A5" />
                    <Bar dataKey="c_hard" stackId="a" fill="#1E293B" />
                    <Bar dataKey="c_med" stackId="a" fill="#475569" />
                    <Bar dataKey="c_easy" stackId="a" fill="#94A3B8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Topic & Time Analysis */}
            <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl relative overflow-hidden">
                {!stats?.isPro && <PremiumOverlay title="Mavzular Diagnostikasi" onClick={openModal} topClass="top-[72px]" />}
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-slate-400" /> Mavzular tahlili
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium uppercase">Mavzular bo'yicha o'zlashtirish darajasi</p>
                </div>
                <div className="mt-6 flex items-end gap-10 overflow-x-auto px-6 pb-6 scrollbar-hide">
                  {insights?.topics?.slice(0, 7).map((t: any, i: number) => (
                    <div key={i} className="flex flex-col items-center gap-4 group flex-shrink-0">
                      <TopicVerticalBar accuracy={t.accuracy} />
                      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-tighter w-12 text-center truncate group-hover:text-[#E8192C] transition-colors">{t.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl relative overflow-hidden">
                {!stats?.isPro && <PremiumOverlay title="Tezlik Tahlili" onClick={openModal} topClass="top-[72px]" />}
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-slate-400" /> Vaqt tahlili
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium uppercase">Savolga sarflangan o'rtacha vaqt</p>
                </div>
                <div className="mt-4 h-[140px] px-6 pb-6">
                  <DonutChart
                    bigText={insights?.avgTimeStr || "0m 0s"}
                    centerText="o'rtacha"
                    data={[
                      { name: 'Tez', value: 35, color: '#94A3B8' },
                      { name: "O'rta", value: 45, color: '#475569' },
                      { name: 'Sekin', value: 20, color: '#E8192C' }
                    ]}
                  />
                </div>
              </div>
            </div>

            {/* AI Summary + Detailed Report */}
            <div className="lg:col-span-3 space-y-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 relative overflow-hidden group">
                {!stats?.isPro && (
                  <button
                    type="button"
                    onClick={openModal}
                    aria-label="EduFox Maslahati Pro obuna bilan ochiladi"
                    className="group/prolock absolute inset-0 z-20 cursor-pointer rounded-2xl bg-white dark:bg-slate-900"
                  >
                    <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-900 dark:bg-slate-800 px-3 py-1.5 text-[11px] font-medium text-white">
                      Pro-ga o'tib oching
                    </span>
                  </button>
                )}

                <div className={`relative z-10 space-y-8 transition-all duration-300 ${!stats?.isPro ? 'blur-lg opacity-70' : ''}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 p-2.5 border border-slate-200 dark:border-slate-700">
                      <img src="public/logo.png" className="w-full h-full object-contain" alt="EduFox" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white tracking-tight uppercase leading-none">EduFox Shaxsiy Tahlili</h3>
                      <div className="flex items-center gap-2">
                        <p className="text-[11px] text-[#E8192C] font-medium uppercase tracking-wider">AI Diagnostika</p>
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Haqiqiy vaqtda</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-3 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <h4 className="text-[11px] font-medium text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                        KUCHLI NUQTALAR
                      </h4>
                      <p className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">{insights?.aiSummary?.strengths}</p>
                    </div>
                    <div className="space-y-3 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <h4 className="text-[11px] font-medium text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                        ZAIF NUQTALAR
                      </h4>
                      <p className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">{insights?.aiSummary?.weaknesses}</p>
                    </div>
                    <div className="space-y-3 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <h4 className="text-[11px] font-medium text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <Lightbulb className="w-3.5 h-3.5 text-slate-400" />
                        AI TAVSIYA
                      </h4>
                      <p className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">{insights?.aiSummary?.tips}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Report */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl relative overflow-hidden">
                {!stats?.isPro && <PremiumOverlay title="Batafsil Hisobot" onClick={openModal} topClass="top-[88px]" />}
                <div className="flex flex-col justify-between gap-4 px-6 py-5 md:flex-row md:items-center border-b border-slate-100 dark:border-slate-800">
                  <div className="space-y-1">
                    <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">Mavzular bo'yicha hisobot</h3>
                    <p className="text-[11px] text-slate-400 font-medium uppercase">Har bir mavzu uchun alohida ko'rsatkichlar</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 uppercase"><div className="w-1.5 h-1.5 rounded-full bg-slate-400" /> ≥ 85%</div>
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 uppercase"><div className="w-1.5 h-1.5 rounded-full bg-slate-500" /> 60-84%</div>
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 uppercase"><div className="w-1.5 h-1.5 rounded-full bg-slate-600" /> &lt; 60%</div>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 px-6 pb-6">
                  {insights?.topics?.slice(0, 10).map((t: any, i: number) => (
                    <div key={i} className="space-y-2 group">
                      <div className="flex justify-between items-start">
                        <div className="space-y-0.5">
                          <p className="text-[13px] font-medium text-slate-900 dark:text-white uppercase tracking-tight group-hover:text-[#E8192C] transition-colors">{t.name}</p>
                          <p className="text-[11px] text-slate-400 font-medium uppercase">{t.attempts} URINISH</p>
                        </div>
                        <span className="text-xl font-medium text-slate-900 dark:text-white tabular-nums">{t.accuracy}<span className="text-[11px] opacity-30 ml-0.5">%</span></span>
                      </div>
                      <div className="relative h-2 flex gap-1 items-center">
                        <div className="flex-[60] bg-slate-200 dark:bg-slate-700 rounded-l-full h-1.5" />
                        <div className="flex-[25] bg-slate-200 dark:bg-slate-700 h-1.5" />
                        <div className="flex-[15] bg-slate-200 dark:bg-slate-700 rounded-r-full h-1.5" />
                        <motion.div animate={{ left: `${t.accuracy}%` }} className="absolute top-1/2 -translate-y-1/2 -ml-2" style={{ left: `${t.accuracy}%` }}>
                          <div className="w-4 h-4 bg-white dark:bg-slate-900 rounded-full border-2 border-[#E8192C] flex items-center justify-center"><div className="w-1.5 h-1.5 bg-[#E8192C] rounded-full" /></div>
                        </motion.div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Heatmap + History */}
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl relative overflow-hidden">
                {!stats?.isPro && <PremiumOverlay title="Faollik Taqvimi" onClick={openModal} topClass="top-[52px]" />}
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Faollik taqvimi</h3>
                </div>
                <div className="mt-4 space-y-3 px-5 pb-5">
                  <div className="flex flex-wrap gap-1.5">
                    {insights?.heatmapData?.map((day: any, i: number) => (
                      <div key={i} title={`${day.date}: ${day.count}`} className={`w-3 h-3 rounded-[2px] ${day.count === 0 ? 'bg-slate-100 dark:bg-slate-800' : 'bg-[#E8192C]'} ring-1 ring-inset ring-slate-200 dark:ring-slate-700`} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 relative overflow-hidden">
                {!stats?.isPro && (
                  <button
                    type="button"
                    onClick={openModal}
                    aria-label="Oxirgi mashqlar Pro obuna bilan ochiladi"
                    className="absolute inset-0 z-20 cursor-pointer rounded-2xl bg-white dark:bg-slate-900"
                  >
                    <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-900 dark:bg-slate-800 px-3 py-1.5 text-[11px] font-medium text-white">
                      Pro-ga o'tib oching
                    </span>
                  </button>
                )}

                <div className={`transition-all duration-300 ${!stats?.isPro ? 'blur-lg opacity-70' : ''}`}>
                  <h3 className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Oxirgi mashqlar</h3>
                  <div className="space-y-2 mt-3">
                    {stats?.sessions?.slice(0, 5).map((s: any) => (
                      <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all">
                        <div className="min-w-0 pr-2">
                          <p className="text-[13px] font-medium text-slate-900 dark:text-white truncate">{s.test_folders?.subject || 'Test'}</p>
                           <p className="text-[11px] text-slate-400 font-medium uppercase">{new Date(s.created_at).toLocaleDateString()}</p>
                        </div>
                        <span className="text-[13px] font-medium text-[#E8192C]">
                          {Math.round((s.correct_answers / s.total_questions) * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!stats?.isPro && (
          <div className="fixed inset-x-3 bottom-4 z-50 md:inset-x-auto md:left-1/2 md:w-[min(720px,calc(100vw-48px))] md:-translate-x-1/2">
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 md:flex-row md:items-center md:justify-between md:p-3.5 shadow-lg">
              <div className="flex items-center gap-3 min-w-0">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-slate-900 dark:text-white">
                    To'liq hisobotni Pro bilan oching.
                  </p>
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">
                    Kengaytirilgan analitika va solishtirish
                  </p>
                </div>
              </div>
              <Button
                onClick={openModal}
                size="sm"
                className="h-10 shrink-0 rounded-xl bg-[#E8192C] hover:bg-[#D41524] text-white px-5 text-[13px] font-medium"
              >
                Pro-ga o'tish
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
