import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import SEO from '@/components/SEO';

import { AddCircleIcon } from "@solar-icons/react/bold-duotone/add-circle";
import { TargetIcon } from "@solar-icons/react/bold-duotone/target";
import { DocumentTextIcon } from "@solar-icons/react/bold-duotone/document-text";
import { BookBookmarkIcon } from "@solar-icons/react/bold-duotone/book-bookmark";
import { CpuIcon as BrainIcon } from "@solar-icons/react/bold-duotone/cpu";
import { ClockCircleIcon } from "@solar-icons/react/bold-duotone/clock-circle";
import { CalendarIcon } from "@solar-icons/react/bold-duotone/calendar";
import { TrashBinTrashIcon } from "@solar-icons/react/bold-duotone/trash-bin-trash";
import { CheckSquareIcon } from "@solar-icons/react/bold-duotone/check-square";
import { AltArrowLeftIcon } from "@solar-icons/react/bold-duotone/alt-arrow-left";
import { AltArrowRightIcon } from "@solar-icons/react/bold-duotone/alt-arrow-right";

const DAYS = [
  { key: "Dushanba", short: "Du", iso: 1 },
  { key: "Seshanba", short: "Se", iso: 2 },
  { key: "Chorshanba", short: "Ch", iso: 3 },
  { key: "Payshanba", short: "Pa", iso: 4 },
  { key: "Juma", short: "Ju", iso: 5 },
  { key: "Shanba", short: "Sh", iso: 6 },
  { key: "Yakshanba", short: "Ya", iso: 0 },
];

const UZ_MONTHS = [
  "Yanvar","Fevral","Mart","Aprel","May","Iyun",
  "Iyul","Avgust","Sentabr","Oktabr","Noyabr","Dekabr"
];

const TEMPLATES = [
  {
    category: "Matematika",
    icon: <TargetIcon className="w-4 h-4" />,
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    options: [
      { label: "15 ta misol", title: "Matematika: 15 ta misol", duration: "15 ta", type: "practice" },
      { label: "30 ta misol", title: "Matematika: 30 ta misol", duration: "30 ta", type: "practice" },
      { label: "60 ta misol", title: "Matematika: 60 ta misol", duration: "60 ta", type: "practice" },
    ]
  },
  {
    category: "Mock Imtihon",
    icon: <DocumentTextIcon className="w-4 h-4" />,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    options: [
      { label: "1 ta mock", title: "1 ta Mock imtihon", duration: "1 ta mock", type: "exam" },
      { label: "2 ta mock", title: "2 ta Mock imtihon", duration: "2 ta mock", type: "exam" },
      { label: "Tahlil", title: "Mock natijalarini tahlil", duration: "30 min", type: "study" },
    ]
  },
  {
    category: "Lugat",
    icon: <BookBookmarkIcon className="w-4 h-4" />,
    color: "text-sky-500",
    bg: "bg-sky-500/10",
    options: [
      { label: "15 min", title: "Yangi sozlarni yodlash", duration: "15 min", type: "study" },
      { label: "30 min", title: "Yangi sozlarni yodlash", duration: "30 min", type: "study" },
      { label: "45 min", title: "Yangi sozlarni yodlash", duration: "45 min", type: "study" },
    ]
  },
  {
    category: "Grammatika",
    icon: <BrainIcon className="w-4 h-4" />,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    options: [
      { label: "20 min", title: "Grammatika qoidalari", duration: "20 min", type: "study" },
      { label: "40 min", title: "Grammatika qoidalari", duration: "40 min", type: "study" },
      { label: "60 min", title: "Grammatika qoidalari", duration: "60 min", type: "study" },
    ]
  },
];

const TYPE_COLORS: Record<string, string> = {
  practice: "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400",
  exam: "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400",
  study: "bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400",
};

// Get Monday-based week label for a date
function getDayKey(date: Date): string {
  const day = date.getDay(); // 0=Sun
  const idx = day === 0 ? 6 : day - 1; // Mon=0...Sun=6
  return DAYS[idx].key;
}

// Get YYYY-MM-DD date string for a weekday in current week
function getDateForWeekday(dayKey: string, baseDate: Date = new Date()): string {
  const currentDay = baseDate.getDay(); // 0=Sun
  const currentIsoDay = currentDay === 0 ? 7 : currentDay; // 1=Mon...7=Sun
  
  const targetDayObj = DAYS.find(d => d.key === dayKey);
  const targetIsoDay = targetDayObj ? (targetDayObj.iso === 0 ? 7 : targetDayObj.iso) : 1;
  
  const diffDays = targetIsoDay - currentIsoDay;
  const targetDate = new Date(baseDate);
  targetDate.setDate(baseDate.getDate() + diffDays);

  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  const day = String(targetDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getMonthCalendar(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Convert to Mon-based: Mon=0
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  // pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function Planner() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newTitle, setNewTitle] = useState("");
  const [duration, setDuration] = useState("30 min");
  const [selectedDay, setSelectedDay] = useState(() => {
    const today = new Date().getDay();
    const map = [6, 0, 1, 2, 3, 4, 5];
    return DAYS[map[today]]?.key || DAYS[0].key;
  });
  const [showAddPanel, setShowAddPanel] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 1024 : false;
  });
  const [calMonth, setCalMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  // selectedDate for calendar: null means "all week" mode
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const today = new Date();
  const todayNum = today.getDate();
  const todayMonth = today.getMonth();
  const todayYear = today.getFullYear();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['planner_tasks', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await (supabase as any)
        .from('planner_tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      if (error?.code === '42P01') return [];
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  const addTask = useMutation({
    mutationFn: async ({ title, dur, type, day }: { title: string; dur: string; type: string; day: string }) => {
      const payload: any = {
        user_id: user!.id,
        role: 'student',
        title,
        duration: dur,
        type,
        day_of_week: day,
        completed: false,
      };
      if (selectedDate !== null) {
        const dateStr = `${calMonth.year}-${String(calMonth.month + 1).padStart(2,'0')}-${String(selectedDate).padStart(2,'0')}`;
        payload.task_date = dateStr;
      } else {
        payload.task_date = getDateForWeekday(day);
      }

      let res = await (supabase as any).from('planner_tasks').insert(payload).select().single();
      
      // Auto-fallback if DB table missing task_date or day_of_week column (PGRST204 / PGRST200)
      if (res.error && (res.error.code === 'PGRST204' || res.error.message?.includes('column') || res.error.code === '42703')) {
        console.warn('Planner: Retrying insert without task_date column');
        delete payload.task_date;
        res = await (supabase as any).from('planner_tasks').insert(payload).select().single();
        
        if (res.error && (res.error.code === 'PGRST204' || res.error.message?.includes('column') || res.error.code === '42703')) {
          console.warn('Planner: Retrying insert without day_of_week column');
          delete payload.day_of_week;
          res = await (supabase as any).from('planner_tasks').insert(payload).select().single();
        }
      }

      if (res.error) throw res.error;
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planner_tasks'] });
      setNewTitle("");
      setDuration("30 min");
    }
  });

  const toggleTask = useMutation({
    mutationFn: async ({ id, completed }: { id: number; completed: boolean }) => {
      const { error } = await (supabase as any).from('planner_tasks').update({ completed: !completed }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['planner_tasks'] }),
  });

  const deleteTask = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await (supabase as any).from('planner_tasks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['planner_tasks'] }),
  });

  const allTasks = tasks.length;
  const doneTasks = tasks.filter((t: any) => t.completed).length;

  // Tasks for current view (by exact date or day_of_week)
  const selectedDayDateStr = getDateForWeekday(selectedDay);
  const todayTasks = tasks.filter((t: any) => {
    if (selectedDate !== null) {
      const dateStr = `${calMonth.year}-${String(calMonth.month + 1).padStart(2,'0')}-${String(selectedDate).padStart(2,'0')}`;
      return t.task_date === dateStr || (!t.task_date && t.day_of_week === selectedDay);
    }
    if (t.task_date) {
      return t.task_date === selectedDayDateStr;
    }
    return t.day_of_week === selectedDay;
  });
  const todayDone = todayTasks.filter((t: any) => t.completed).length;

  // Tasks matching a calendar cell — prefers task_date, falls back to day_of_week
  function getTasksForDate(day: number) {
    const dateStr = `${calMonth.year}-${String(calMonth.month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const byDate = tasks.filter((t: any) => t.task_date === dateStr);
    if (byDate.length > 0) return byDate;
    const weekdayIdx = new Date(calMonth.year, calMonth.month, day).getDay();
    const dayKey = DAYS[weekdayIdx === 0 ? 6 : weekdayIdx - 1]?.key;
    return tasks.filter((t: any) => t.day_of_week === dayKey && !t.task_date);
  }

  const handleAddTask = (title: string, dur: string, type: string) => {
    if (!title.trim()) return;
    addTask.mutate({ title, dur, type, day: selectedDay });
    setShowAddPanel(false);
  };

  const calCells = getMonthCalendar(calMonth.year, calMonth.month);

  const prevMonth = () => {
    setCalMonth(prev => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 };
      return { year: prev.year, month: prev.month - 1 };
    });
    setSelectedDate(null);
  };
  const nextMonth = () => {
    setCalMonth(prev => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 };
      return { year: prev.year, month: prev.month + 1 };
    });
    setSelectedDate(null);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#050B10] text-slate-900 dark:text-white pb-28 lg:pb-6">
      <SEO title="Haftalik Reja | EduContest" description="Haftalik oquv rejangizni tuzing va vazifalarni kuzating." />

      {/* ── HEADER (full width, no side gaps) ── */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#E8192C]/10 flex items-center justify-center shrink-0">
            <CalendarIcon className="w-4.5 h-4.5 text-[#E8192C]" />
          </div>
          <div>
            <h1 className="text-[14px] font-black text-slate-900 dark:text-white leading-none">Haftalik Reja</h1>
            <p className="text-[11px] text-slate-400 mt-0.5">Oquv jadvalingizni belgilang</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {allTasks > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
              <CheckSquareIcon className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">{doneTasks}/{allTasks}</span>
            </div>
          )}
          <button
            onClick={() => { setShowAddPanel(v => !v); setTimeout(() => inputRef.current?.focus(), 80); }}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#E8192C] hover:bg-[#c81424] text-white rounded-xl text-[12px] font-bold transition-all active:scale-95 shrink-0"
          >
            <AddCircleIcon className="w-4 h-4" />
            <span>{showAddPanel ? "Yopish" : "Vazifa qoshish"}</span>
          </button>
        </div>
      </div>

      {/* ── ADD PANEL (collapsible on mobile, open by default on PC) ── */}
      <AnimatePresence>
        {showAddPanel && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800"
          >
            <div className="px-4 sm:px-5 py-4 space-y-3">
              {/* Day pills */}
              <div className="flex flex-wrap gap-1.5">
                {DAYS.map(d => (
                  <button
                    key={d.key}
                    onClick={() => setSelectedDay(d.key)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                      selectedDay === d.key
                        ? 'bg-[#E8192C] text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {d.key}
                  </button>
                ))}
              </div>
              {/* Input row */}
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  ref={inputRef}
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddTask(newTitle, duration, 'study')}
                  placeholder="Vazifa nomi..."
                  className="flex-1 h-9 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 text-[13px] font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#E8192C] transition-colors"
                />
                <div className="flex gap-2">
                  <input
                    value={duration}
                    onChange={e => setDuration(e.target.value)}
                    placeholder="30 min"
                    className="flex-1 sm:w-24 h-9 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 text-[13px] font-bold focus:outline-none focus:border-[#E8192C] transition-colors"
                  />
                  <button
                    onClick={() => handleAddTask(newTitle, duration, 'study')}
                    disabled={!newTitle.trim() || addTask.isPending}
                    className="h-9 px-4 bg-[#E8192C] hover:bg-[#c81424] disabled:opacity-40 text-white text-[12px] font-bold rounded-lg transition-all shrink-0"
                  >
                    Qoshish
                  </button>
                </div>
              </div>
              {/* Templates */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Tezkor shablonlar</p>
                <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-2">
                  {TEMPLATES.map((cat, i) => (
                    <div key={i} className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-100 dark:border-slate-700/50">
                      <div className={`flex items-center gap-1.5 mb-2 ${cat.color}`}>
                        <div className={`p-1 rounded-md ${cat.bg}`}>{cat.icon}</div>
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{cat.category}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {cat.options.map((opt, j) => (
                          <button
                            key={j}
                            onClick={() => handleAddTask(opt.title, opt.duration, opt.type)}
                            disabled={addTask.isPending}
                            className="px-2 py-1 rounded-md bg-white dark:bg-slate-900 hover:bg-[#E8192C] hover:text-white text-[10px] font-semibold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 transition-all"
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TWO-COLUMN LAYOUT ── */}
      <div className="flex flex-col lg:flex-row h-full">

        {/* LEFT: Weekly day tabs + task list */}
        <div className="flex-1 min-w-0 flex flex-col">

          {/* Day tabs bar */}
          <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-5 py-3">
            <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {DAYS.map(d => {
                const cnt = tasks.filter((t: any) => t.day_of_week === d.key).length;
                const done = tasks.filter((t: any) => t.day_of_week === d.key && t.completed).length;
                const isActive = selectedDay === d.key;
                return (
                  <button
                    key={d.key}
                    onClick={() => setSelectedDay(d.key)}
                    className={`shrink-0 flex flex-col items-center gap-0.5 min-w-[48px] px-2 py-2 rounded-xl transition-all ${
                      isActive
                        ? 'bg-[#E8192C] text-white shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-[9px] font-bold uppercase tracking-wide opacity-80">{d.short}</span>
                    <span className="text-[14px] font-black leading-none">{cnt}</span>
                    {cnt > 0 && (
                      <div className={`w-full h-[2px] rounded-full mt-0.5 ${isActive ? 'bg-white/30' : 'bg-slate-200 dark:bg-slate-700'}`}>
                        <div
                          className={`h-full rounded-full ${isActive ? 'bg-white' : 'bg-emerald-500'}`}
                          style={{ width: `${(done / cnt) * 100}%` }}
                        />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Task list area */}
          <div className="flex-1 px-5 py-4">
            {/* Day header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-black">{selectedDay}</span>
                <span className="text-[11px] text-slate-400">{todayDone}/{todayTasks.length} bajarildi</span>
              </div>
              {todayTasks.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-emerald-500 rounded-full"
                      animate={{ width: `${(todayDone / todayTasks.length) * 100}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-slate-400">
                    {Math.round((todayDone / todayTasks.length) * 100)}%
                  </span>
                </div>
              )}
            </div>

            {isLoading ? (
              <div className="flex justify-center py-10">
                <ClockCircleIcon className="w-6 h-6 text-[#E8192C] animate-spin" />
              </div>
            ) : todayTasks.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2">
                  <TargetIcon className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-[12px] font-semibold text-slate-400">Bu kun uchun vazifa yoq</p>
                <button
                  onClick={() => { setShowAddPanel(true); setTimeout(() => inputRef.current?.focus(), 100); }}
                  className="mt-2 px-3 py-1.5 bg-[#E8192C] text-white text-[11px] font-bold rounded-xl"
                >
                  + Qoshish
                </button>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                <div className="space-y-2">
                  {todayTasks.map((task: any) => (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: task.completed ? 0.5 : 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className={`group flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-900 border rounded-xl transition-all ${
                        task.completed
                          ? 'border-slate-100 dark:border-slate-800'
                          : 'border-slate-200 dark:border-slate-800 hover:border-[#E8192C]/30 hover:shadow-sm'
                      }`}
                    >
                      <button
                        onClick={() => toggleTask.mutate({ id: task.id, completed: task.completed })}
                        className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          task.completed
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-slate-300 dark:border-slate-600 hover:border-[#E8192C]'
                        }`}
                      >
                        {task.completed && (
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[13px] font-semibold truncate ${task.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-white'}`}>
                          {task.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {task.duration && (
                            <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
                              <ClockCircleIcon className="w-2.5 h-2.5" />
                              {task.duration}
                            </span>
                          )}
                          {task.type && (
                            <span className={`px-1.5 py-px rounded text-[9px] font-bold uppercase ${TYPE_COLORS[task.type] || 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
                              {task.type === 'practice' ? 'Mashq' : task.type === 'exam' ? 'Imtihon' : 'Oquv'}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteTask.mutate(task.id)}
                        className="shrink-0 opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                      >
                        <TrashBinTrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* RIGHT: Monthly Calendar */}
        <div className="lg:w-[360px] shrink-0 bg-white dark:bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-800">
          {/* Month nav */}
          <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
            <button
              onClick={prevMonth}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500"
            >
              <AltArrowLeftIcon className="w-4 h-4" />
            </button>
            <span className="text-[13px] font-black text-slate-900 dark:text-white">
              {UZ_MONTHS[calMonth.month]} {calMonth.year}
            </span>
            <button
              onClick={nextMonth}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500"
            >
              <AltArrowRightIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 px-4 pt-3 pb-1">
            {['Du','Se','Ch','Pa','Ju','Sh','Ya'].map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 px-4 pb-4 gap-y-1">
            {calCells.map((day, i) => {
              if (!day) return <div key={i} />;
              const isToday = day === todayNum && calMonth.month === todayMonth && calMonth.year === todayYear;
              const isSelected = day === selectedDate;
              const dayTasks = getTasksForDate(day);
              const doneCnt = dayTasks.filter((t: any) => t.completed).length;
              const hasTasks = dayTasks.length > 0;
              const weekdayJs = new Date(calMonth.year, calMonth.month, day).getDay();
              const dayKey = DAYS[weekdayJs === 0 ? 6 : weekdayJs - 1]?.key;

              return (
                <button
                  key={i}
                  onClick={() => {
                    setSelectedDate(day === selectedDate ? null : day);
                    if (dayKey) setSelectedDay(dayKey);
                  }}
                  className={`relative flex flex-col items-center justify-center aspect-square rounded-xl text-[12px] font-bold transition-all ${
                    isSelected
                      ? 'bg-[#E8192C] text-white shadow-sm'
                      : isToday
                      ? 'bg-[#E8192C]/10 text-[#E8192C] ring-1 ring-[#E8192C]'
                      : hasTasks
                      ? 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-500 dark:text-slate-500'
                  }`}
                >
                  <span>{day}</span>
                  {hasTasks && (
                    <div className="flex gap-0.5 mt-0.5">
                      {doneCnt > 0 && (
                        <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white/70' : 'bg-emerald-500'}`} />
                      )}
                      {dayTasks.length - doneCnt > 0 && (
                        <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white/40' : 'bg-slate-300 dark:bg-slate-600'}`} />
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-semibold text-slate-500">Bajarildi</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
              <span className="text-[10px] font-semibold text-slate-500">Bajarilmadi</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#E8192C]/70" />
              <span className="text-[10px] font-semibold text-slate-500">Bugun</span>
            </div>
          </div>

          {/* Weekly progress mini */}
          {allTasks > 0 && (
            <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Haftalik progress</p>
              <div className="grid grid-cols-7 gap-1">
                {DAYS.map(d => {
                  const cnt = tasks.filter((t: any) => t.day_of_week === d.key).length;
                  const done = tasks.filter((t: any) => t.day_of_week === d.key && t.completed).length;
                  const pct = cnt > 0 ? done / cnt : 0;
                  const isActive = selectedDay === d.key;
                  return (
                    <button
                      key={d.key}
                      onClick={() => setSelectedDay(d.key)}
                      className={`flex flex-col items-center gap-1 py-2 rounded-xl transition-all ${
                        isActive ? 'bg-[#E8192C]/10 ring-1 ring-[#E8192C]' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className={`text-[9px] font-bold uppercase ${isActive ? 'text-[#E8192C]' : 'text-slate-400'}`}>{d.short}</span>
                      <div className="w-full px-1 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${pct >= 1 ? 'bg-emerald-500' : pct > 0 ? 'bg-amber-400' : 'bg-transparent'}`}
                          style={{ width: `${pct * 100}%` }}
                        />
                      </div>
                      <span className={`text-[10px] font-black ${isActive ? 'text-[#E8192C]' : cnt > 0 ? 'text-slate-600 dark:text-slate-300' : 'text-slate-300 dark:text-slate-600'}`}>
                        {cnt}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
