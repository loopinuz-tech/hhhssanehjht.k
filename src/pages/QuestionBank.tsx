import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStudentAuth } from '@/hooks/useStudentAuth';
import { supabase } from '@/integrations/studentSupabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Filter, BookOpen,
  ArrowLeft, ChevronRight, Brain,
  Check, Clock, XCircle, Search,
  Target, Zap, Timer, Layout as LayoutIcon, Maximize2, Minimize2,
  Pencil, MoreVertical, Flag, ChevronDown, Eraser, AlignLeft, BarChart2, Lightbulb,
  Underline as UnderlineIcon, StickyNote, Trash2 as TrashIcon, AlertTriangle, Loader2, Calculator, TreePine
} from 'lucide-react';
import ForestTimer from '@/components/student/ForestTimer';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import MockTestsSection from '@/components/student/MockTestsSection';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MessageSquare, Trash2, Gamepad2 } from 'lucide-react';
import QuestionChallengeTrainer from '@/components/student/QuestionChallengeTrainer';
import SATCalculator from '@/components/student/SATCalculator';
// @ts-ignore
import TeX from '@matejmazur/react-katex';
import 'katex/dist/katex.min.css';



type Question = {
  id: string;
  question_text: string;
  passage?: string;
  section: string; // 'Reading', 'Writing', 'Math'
  domain?: string;
  category: string;
  sub_category?: string;
  difficulty: string;
  options: any;
  correct_option: string;
  explanation: string;
};

type Highlight = {
  id: string;
  selected_text: string;
  note?: string;
  color?: string;
  is_underline?: boolean;
};

type ProgressItem = {
  question_id: string;
  status: 'correct' | 'incorrect' | 'saved';
};

export default function QuestionBank() {
  const { user, displayName } = useStudentAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Navigation & View
  const [activeTab, setActiveTab] = useState<'reading' | 'math' | 'mock' | 'mistakes' | 'calculator' | 'forest'>('reading');
  const [selectedTopic, setSelectedTopic] = useState<{ cat: string, sub: string } | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [sessionAnswers, setSessionAnswers] = useState<Record<number, string>>({});

  const { data: featureFlags } = useQuery({
    queryKey: ['feature_flags'],
    queryFn: async () => {
      const { data, error } = await supabase.from('feature_flags' as any).select('*');
      if (error) return [];
      return data as any[];
    }
  });

  const isFeatureNew = (name: string) => {
    return featureFlags?.find((f: any) => f.feature_name === name)?.is_new || false;
  };
  const [checkedQuestions, setCheckedQuestions] = useState<Set<number>>(new Set());
  const [timerInSeconds, setTimerInSeconds] = useState(1919); // 31:59
  const [isTimerHidden, setIsTimerHidden] = useState(false);

  // Test State
  const [markedQuestions, setMarkedQuestions] = useState<Set<number>>(new Set());
  const [strikethroughOptions, setStrikethroughOptions] = useState<Set<string>>(new Set());
  const [selectionMenu, setSelectionMenu] = useState<{ x: number, y: number, text: string } | null>(null);
  const [showNotesPanel, setShowNotesPanel] = useState(false);

  // Filters
  const [filterDifficulty, setFilterDifficulty] = useState<string>('All');
  const [isTimedMode, setIsTimedMode] = useState(true);
  const [isShuffleMode, setIsShuffleMode] = useState(true);
  const [isChallengeMode, setIsChallengeMode] = useState(false);


  // Data
  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['question_bank'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('sat_questions').select('*').limit(500);
      if (error) return [];
      return (data || []) as unknown as Question[];
    },
    enabled: !!user,
  });

  const { data: progressData = [] } = useQuery({
    queryKey: ['sat_submissions', user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('sat_submissions').select('*').eq('user_id', user!.id);
      if (error) return [];
      return (data || []).map((d: any) => ({
        question_id: d.question_id,
        status: d.is_correct ? 'correct' : (d.status === 'saved' ? 'saved' : 'incorrect')
      })) as ProgressItem[];
    },
    enabled: !!user,
  });

  const recordProgress = useMutation({
    mutationFn: async (vars: { qId: string, status: 'correct' | 'incorrect' | 'saved' }) => {
      if (!user) return;
      await (supabase as any).from('sat_submissions').upsert({
        user_id: user.id,
        question_id: vars.qId,
        is_correct: vars.status === 'correct',
        status: vars.status === 'saved' ? 'saved' : 'answered',
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,question_id' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sat_submissions'] });
    }
  });

  const filteredQuestions = useMemo(() => {
    let qs = questions.filter(q => {
      const s = q.section?.toLowerCase() || '';
      const isReading = s.includes('reading') || s.includes('english') || s.includes('writing');
      return activeTab === 'reading' ? isReading : !isReading;
    });
    if (filterDifficulty !== 'All') {
      const diff = filterDifficulty.toLowerCase();
      qs = qs.filter(q => q.difficulty?.toLowerCase() === diff);
    }
    return qs;
  }, [questions, activeTab, filterDifficulty]);

  const topics = useMemo(() => {
    const list: { cat: string, sub: string, total: number, solved: number }[] = [];
    filteredQuestions.forEach(q => {
      const sub = q.category || 'General';
      let entry = list.find(l => l.cat === q.category && l.sub === sub);
      if (!entry) {
        entry = { cat: q.category, sub, total: 0, solved: 0 };
        list.push(entry);
      }
      entry.total++;
      if (progressData.some(p => p.question_id === q.id && p.status === 'correct')) {
        entry.solved++;
      }
    });
    return list;
  }, [filteredQuestions, progressData]);

  const sessionQuestions = useMemo(() => {
    if (!selectedTopic) return [];
    let qBase = filteredQuestions.filter(q => q.category === selectedTopic.cat);
    if (isShuffleMode) return [...qBase].sort(() => Math.random() - 0.5);
    return qBase;
  }, [selectedTopic, filteredQuestions, isShuffleMode]);

  // Timer Effect
  useEffect(() => {
    let interval: any;
    if (selectedTopic && timerInSeconds > 0) {
      interval = setInterval(() => setTimerInSeconds(s => s - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [selectedTopic, timerInSeconds]);

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const handleSelectTopic = (cat: string, sub: string) => {
    setSelectedTopic({ cat, sub });
    setCurrentQIndex(0);
    setSessionAnswers({});
    setCheckedQuestions(new Set());
    setStrikethroughOptions(new Set());
    setMarkedQuestions(new Set());
  };

  const handleAnswer = (key: string) => {
    if (checkedQuestions.has(currentQIndex)) return; // Do not allow changing answer after checking
    setSessionAnswers(prev => ({ ...prev, [currentQIndex]: key }));
  };

  const checkAnswer = () => {
    const key = sessionAnswers[currentQIndex];
    if (!key) return;
    setCheckedQuestions(prev => new Set(prev).add(currentQIndex));
    const q = sessionQuestions[currentQIndex];
    if (q) recordProgress.mutate({ qId: q.id, status: key === q.correct_option ? 'correct' : 'incorrect' });
  };

  const toggleStrikethrough = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSet = new Set(strikethroughOptions);
    if (newSet.has(key)) newSet.delete(key);
    else newSet.add(key);
    setStrikethroughOptions(newSet);
  };

  const toggleMark = () => {
    const newSet = new Set(markedQuestions);
    if (newSet.has(currentQIndex)) newSet.delete(currentQIndex);
    else newSet.add(currentQIndex);
    setMarkedQuestions(newSet);
  };

  const nextQuestion = () => {
    if (currentQIndex < sessionQuestions.length - 1) {
      setCurrentQIndex(c => c + 1);
      setStrikethroughOptions(new Set());
      setSelectionMenu(null);
    } else {
      setSelectedTopic(null);
    }
  };

  const handleTextSelection = (e: React.MouseEvent) => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();

    if (selectedText && selectedText.length > 0) {
      const range = selection?.getRangeAt(0);
      const rect = range?.getBoundingClientRect();

      if (rect) {
        // Viewport kordinatalarini hisoblaymiz
        setSelectionMenu({
          x: rect.left + rect.width / 2,
          y: rect.top - 10, // Menyu kursorning tepasida chiqishi uchun
          text: selectedText
        });
      }
    } else {
      setSelectionMenu(null);
    }
  };

  const currentQ = sessionQuestions[currentQIndex];

  const { data: questionHighlights = [], refetch: refetchHighlights } = useQuery({
    queryKey: ['sat_highlights', currentQ?.id, user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('sat_highlights').select('*').eq('question_id', currentQ?.id).eq('user_id', user!.id);
      if (error) return [];
      return data || [];
    },
    enabled: !!currentQ && !!user,
  });

  const saveHighlight = useMutation({
    mutationFn: async (vars: { text: string, note?: string, color?: string, is_underline?: boolean }) => {
      const { error } = await (supabase as any).from('sat_highlights').insert({
        user_id: user!.id,
        question_id: currentQ!.id,
        selected_text: vars.text,
        note: vars.note,
        color: vars.color || 'yellow',
        is_underline: vars.is_underline || false
      });
      if (error) throw error;
    },
    onSuccess: () => {
      refetchHighlights();
      setSelectionMenu(null);
    }
  });

  const deleteHighlight = useMutation({
    mutationFn: async (id: string) => {
      await (supabase as any).from('sat_highlights').delete().eq('id', id);
    },
    onSuccess: () => refetchHighlights()
  });

  // Highlighted Text Renderer (More robust with Regex)
  const HighlightedText = ({ text, highlights }: { text: string, highlights: any[] }) => {
    if (!text) return null;

    // First, split content by LaTeX markers ($...$)
    const mathSplit = text.split(/(\$[^\$]+\$)/g);

    return (
      <>
        {mathSplit.map((part, index) => {
          // If it's math part ($...$)
          if (part.startsWith('$') && part.endsWith('$')) {
            const math = part.slice(1, -1).replace(/\\\\/g, '\\');
            return <TeX key={`math-${index}`} math={math} />;
          }

          // If it's normal text, apply highlights
          if (!highlights || highlights.length === 0) return <span key={index}>{part}</span>;

          const sortedHighlights = [...highlights].sort((a, b) => b.selected_text.length - a.selected_text.length);
          let subParts: (string | JSX.Element)[] = [part];

          sortedHighlights.forEach(h => {
            const newSubParts: (string | JSX.Element)[] = [];
            subParts.forEach(subPart => {
              if (typeof subPart !== 'string') {
                newSubParts.push(subPart);
                return;
              }

              const escapedText = h.selected_text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const regex = new RegExp(`(${escapedText})`, 'g');
              const segments = subPart.split(regex);

              segments.forEach((seg, i) => {
                if (seg === h.selected_text) {
                  const colorMap: any = { yellow: 'bg-[#fef08a]', blue: 'bg-[#bfdbfe]', pink: 'bg-[#fbcfe8]' };
                  newSubParts.push(
                    <span
                      key={`${h.id}-${index}-${i}`}
                      className={`${h.color ? colorMap[h.color] : 'bg-[#fef08a]'} ${h.is_underline ? 'underline decoration-2 underline-offset-4' : ''} transition-colors px-0.5 rounded-sm inline`}
                    >
                      {seg}
                    </span>
                  );
                } else if (seg !== '') {
                  newSubParts.push(seg);
                }
              });
            });
            subParts = newSubParts;
          });

          return <span key={index}>{subParts}</span>;
        })}
      </>
    );
  };

  if (!selectedTopic || !currentQ) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-background text-foreground font-sans overflow-y-auto w-full transition-colors">
        <div className="w-full mx-auto p-4 sm:p-6 lg:p-8">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-border pb-6">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-primary" /> Question Bank
              </h1>
              <p className="text-sm text-muted-foreground font-medium">Focused SAT practice and skill mastery.</p>
            </div>

            <div className="flex w-full overflow-x-auto p-1.5 bg-slate-100 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 scrollbar-hide">
              <button
                onClick={() => setActiveTab('reading')}
                className={`whitespace-nowrap px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'reading' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
              >
                Reading & Writing
              </button>
              <button
                onClick={() => setActiveTab('math')}
                className={`whitespace-nowrap px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'math' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
              >
                Mathematics
              </button>
              <button
                onClick={() => setActiveTab('mistakes')}
                className={`whitespace-nowrap px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'mistakes' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
              >
                <AlertTriangle className="w-4 h-4" /> My Mistakes
              </button>
              <button
                onClick={() => setActiveTab('calculator')}
                className={`relative whitespace-nowrap px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'calculator' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
              >
                <Calculator className="w-4 h-4" /> Score Calculator
                {isFeatureNew('calculator') && (
                  <span className="absolute -top-1.5 -right-1 flex h-4 w-8 items-center justify-center rounded-full bg-blue-500 text-[8px] font-black italic text-white shadow-sm ring-2 ring-white dark:ring-slate-900 animate-pulse">
                    NEW
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('forest')}
                className={`relative whitespace-nowrap px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'forest' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
              >
                <TreePine className="w-4 h-4" /> Forest
                <span className="absolute -top-1.5 -right-1 flex h-4 w-8 items-center justify-center rounded-full bg-emerald-500 text-[8px] font-black italic text-white shadow-sm ring-2 ring-white dark:ring-slate-900 animate-pulse">
                  NEW
                </span>
              </button>
            </div>
          </header>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            {/* Sidebar / Filters */}
            <aside className="xl:col-span-1 space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-card border border-border rounded-xl flex flex-col items-center justify-center text-center shadow-sm">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1">Solved</p>
                    <p className="text-2xl font-bold text-foreground">{progressData.length}</p>
                  </div>
                  <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl flex flex-col items-center justify-center text-center shadow-sm">
                    <p className="text-xs font-medium text-primary uppercase tracking-widest mb-1">Accuracy</p>
                    <p className="text-2xl font-bold text-primary">{progressData.length > 0 ? Math.round((progressData.filter(p => p.status === 'correct').length / progressData.length) * 100) : 0}%</p>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-5 space-y-5 shadow-sm">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground">Practice Settings</h3>

                  <button
                    onClick={() => setIsChallengeMode(true)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all shadow-sm"
                  >
                    <Gamepad2 className="w-4 h-4" /> Challenge Mode
                  </button>

                  <div className="flex items-center justify-between text-sm group">
                    <span className="font-medium text-muted-foreground group-hover:text-foreground transition-colors">Shuffle Order</span>
                    <Switch className="scale-90" checked={isShuffleMode} onCheckedChange={setIsShuffleMode} />
                  </div>

                  <div className="flex items-center justify-between text-sm group">
                    <span className="font-medium text-muted-foreground group-hover:text-foreground transition-colors">Timed Mode</span>
                    <Switch className="scale-90" checked={isTimedMode} onCheckedChange={setIsTimedMode} />
                  </div>

                  <div className="pt-4 border-t border-border space-y-2">
                    <label className="text-xs font-medium uppercase text-muted-foreground">Difficulty Level</label>
                    <select
                      value={filterDifficulty}
                      onChange={(e) => setFilterDifficulty(e.target.value)}
                      className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 ring-primary/20 transition-all cursor-pointer"
                    >
                      <option value="All">All Levels</option>
                      <option value="Easy">Novice</option>
                      <option value="Medium">Proficient</option>
                      <option value="Hard">Advanced</option>
                    </select>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Practice Area Grid */}
            <main className="xl:col-span-3 space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  {activeTab === 'calculator' ? (
                    <><Calculator className="w-5 h-5 text-primary" /> Score Calculator</>
                  ) : activeTab === 'mock' ? (
                    <><Zap className="w-5 h-5 text-primary" /> Mock Tests</>
                  ) : activeTab === 'mistakes' ? (
                    <><AlertTriangle className="w-5 h-5 text-destructive" /> My Mistakes</>
                  ) : activeTab === 'forest' ? (
                    <><TreePine className="w-5 h-5 text-success" /> Daraxt Taymeri</>
                  ) : (
                    <><Target className="w-5 h-5 text-primary" /> Exercise Modules</>
                  )}
                </h2>
                {activeTab !== 'calculator' && activeTab !== 'mock' && activeTab !== 'mistakes' && activeTab !== 'forest' && (
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest bg-secondary px-2 py-1 rounded">{topics.length} Categories</span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeTab === 'mock' ? (
                  <div className="col-span-full space-y-6">
                    <MockTestsSection />
                  </div>
                ) : activeTab === 'calculator' ? (
                  <div className="col-span-full">
                    <SATCalculator />
                  </div>
                ) : activeTab === 'forest' ? (
                  <div className="col-span-full">
                    <ForestTimer />
                  </div>
                ) : activeTab === 'mistakes' ? (
                  <MyMistakesSection questions={questions} progressData={progressData} />
                ) : isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-40 rounded-xl bg-secondary animate-pulse border border-border" />
                  ))
                ) : (
                  topics.map((t, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectTopic(t.cat, t.sub)}
                      className="flex flex-col text-left p-5 rounded-xl border border-border bg-card hover:border-primary hover:shadow-md transition-all group relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="w-5 h-5 text-primary" />
                      </div>

                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${activeTab === 'reading' ? 'bg-primary/10 text-primary' : 'bg-emerald-500/10 text-emerald-500'}`}>
                          <BookOpen className="w-6 h-6" />
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-medium text-muted-foreground">{t.solved}/{t.total}</p>
                          <p className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-md mt-1">
                            {Math.round((t.solved / t.total) * 100)}% Complete
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1 mb-4 flex-1">
                        <h4 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">{t.sub}</h4>
                        <p className="text-xs font-medium text-muted-foreground">{t.cat}</p>
                      </div>

                      <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden mt-auto">
                        <div className="h-full bg-primary transition-all duration-700 ease-out" style={{ width: `${(t.solved / t.total) * 100}%` }} />
                      </div>
                    </button>
                  ))
                )}

                {!isLoading && topics.length === 0 && activeTab !== 'mock' && activeTab !== 'mistakes' && activeTab !== 'calculator' && activeTab !== 'forest' && (
                  <div className="col-span-full py-20 flex flex-col items-center justify-center bg-card border border-border rounded-2xl text-center shadow-sm">
                    <Filter className="w-12 h-12 text-muted-foreground/30 mb-4" />
                    <p className="text-base font-medium text-muted-foreground">No questions match your filters.</p>
                    <button onClick={() => { setFilterDifficulty('All'); }} className="mt-4 text-sm font-medium text-primary hover:underline">Clear Filters</button>
                  </div>
                )}
              </div>
            </main>
          </div>
        </div>

        {isChallengeMode && (
          <QuestionChallengeTrainer
            questions={filteredQuestions as any}
            title={activeTab === 'reading' ? 'Reading & Writing' : 'Math'}
            onClose={() => setIsChallengeMode(false)}
          />
        )}
      </div>
    );

  }

  return (
    <div className="fixed inset-0 bg-background text-foreground z-[100] flex flex-col font-sans overflow-hidden">
      {/* COMPACT BLUEBOOK HEADER (52px) */}
      <header className="h-[52px] bg-card flex items-center justify-between px-5 shrink-0 z-10 border-b border-border shadow-sm">
        <div className="flex flex-col justify-center">
          <h2 className="text-xs font-semibold text-muted-foreground leading-none mb-1">Section 1: {activeTab === 'reading' ? 'Reading and Writing' : 'Mathematics'}</h2>
          <div className="flex items-center gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1 text-primary font-medium text-xs hover:underline">
                  Directions <ChevronDown className="w-3 h-3" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-[400px] p-5 text-sm z-[200]">
                <h4 className="font-bold mb-2">Directions</h4>
                <p className="text-muted-foreground leading-relaxed">The questions in this section address a number of important skills. Each question includes one or more passages, which may include a table or graph. Read each passage and question carefully, and then choose the best answer to the question based on the passage(s).</p>
                <p className="text-muted-foreground leading-relaxed mt-2">All questions in this section are multiple-choice with four answer choices. Each question has a single best answer.</p>
              </PopoverContent>
            </Popover>

            {activeTab === 'math' && (
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-1 text-primary font-medium text-xs hover:underline">
                    <BookOpen className="w-3 h-3" /> References
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-[450px] p-5 z-[200]">
                  <h4 className="font-bold mb-4 text-sm border-b pb-2">Reference Sheet</h4>
                  <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 scrollbar-hide">
                    {/* Area & Circumference */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-secondary/50 rounded-lg border border-border flex flex-col items-center">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2 w-full">Circle</p>
                        <svg width="60" height="60" viewBox="0 0 60 60" className="mb-2 text-foreground/40">
                          <circle cx="30" cy="30" r="25" fill="none" stroke="currentColor" strokeWidth="1.5" />
                          <line x1="30" y1="30" x2="55" y2="30" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
                          <text x="40" y="25" fontSize="10" fill="currentColor" className="italic">r</text>
                        </svg>
                        <div className="space-y-1 flex flex-col items-center">
                          <TeX math="A = \pi r^2" />
                          <TeX math="C = 2\pi r" />
                        </div>
                      </div>
                      <div className="p-3 bg-secondary/50 rounded-lg border border-border flex flex-col items-center">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2 w-full">Rectangle</p>
                        <svg width="60" height="60" viewBox="0 0 60 60" className="mb-2 text-foreground/40">
                          <rect x="10" y="15" width="40" height="30" fill="none" stroke="currentColor" strokeWidth="1.5" />
                          <text x="30" y="12" fontSize="10" fill="currentColor" textAnchor="middle" className="italic">ℓ</text>
                          <text x="54" y="33" fontSize="10" fill="currentColor" className="italic">w</text>
                        </svg>
                        <TeX math="A = \ell w" />
                      </div>
                    </div>

                    {/* Triangles */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-secondary/50 rounded-lg border border-border flex flex-col items-center">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2 w-full">Triangle</p>
                        <svg width="60" height="60" viewBox="0 0 60 60" className="mb-2 text-foreground/40">
                          <path d="M10,45 L30,10 L50,45 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
                          <line x1="30" y1="10" x2="30" y2="45" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
                          <rect x="30" y="42" width="3" height="3" fill="none" stroke="currentColor" />
                          <text x="33" y="28" fontSize="10" fill="currentColor" className="italic">h</text>
                          <text x="30" y="55" fontSize="10" fill="currentColor" textAnchor="middle" className="italic">b</text>
                        </svg>
                        <TeX math="A = \frac{1}{2} bh" />
                      </div>
                      <div className="p-3 bg-secondary/50 rounded-lg border border-border flex flex-col items-center">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2 w-full">Pythagorean Theorem</p>
                        <svg width="60" height="60" viewBox="0 0 60 60" className="mb-2 text-foreground/40">
                          <path d="M15,10 L15,45 L45,45 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
                          <rect x="15" y="42" width="3" height="3" fill="none" stroke="currentColor" />
                          <text x="10" y="30" fontSize="10" fill="currentColor" className="italic">b</text>
                          <text x="30" y="55" fontSize="10" fill="currentColor" textAnchor="middle" className="italic">a</text>
                          <text x="32" y="25" fontSize="10" fill="currentColor" className="italic">c</text>
                        </svg>
                        <TeX math="c^2 = a^2 + b^2" />
                      </div>
                    </div>

                    {/* Special Right Triangles */}
                    <div className="p-3 bg-secondary/50 rounded-lg border border-border">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase mb-4">Special Right Triangles</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col items-center">
                          <svg width="70" height="50" viewBox="0 0 70 50" className="text-foreground/40 mb-2">
                            <path d="M10,40 L60,40 L60,10 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
                            <rect x="57" y="37" width="3" height="3" fill="none" stroke="currentColor" />
                            <text x="63" y="25" fontSize="8" fill="currentColor" className="italic">x</text>
                            <text x="35" y="48" fontSize="8" fill="currentColor" textAnchor="middle" className="italic">x√3</text>
                            <text x="30" y="22" fontSize="8" fill="currentColor" className="italic">2x</text>
                            <text x="50" y="38" fontSize="7" fill="currentColor">60°</text>
                            <text x="15" y="38" fontSize="7" fill="currentColor">30°</text>
                          </svg>
                          <div className="text-center">
                            <p className="text-[9px] text-muted-foreground mb-1">30°-60°-90°</p>
                            <TeX math="x, x\sqrt{3}, 2x" />
                          </div>
                        </div>
                        <div className="flex flex-col items-center">
                          <svg width="70" height="50" viewBox="0 0 70 50" className="text-foreground/40 mb-2">
                            <path d="M10,40 L40,40 L40,10 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
                            <rect x="37" y="37" width="3" height="3" fill="none" stroke="currentColor" />
                            <text x="43" y="25" fontSize="8" fill="currentColor" className="italic">s</text>
                            <text x="25" y="48" fontSize="8" fill="currentColor" textAnchor="middle" className="italic">s</text>
                            <text x="20" y="22" fontSize="8" fill="currentColor" className="italic">s√2</text>
                            <text x="32" y="38" fontSize="7" fill="currentColor">45°</text>
                            <text x="15" y="38" fontSize="7" fill="currentColor">45°</text>
                          </svg>
                          <div className="text-center">
                            <p className="text-[9px] text-muted-foreground mb-1">45°-45°-90°</p>
                            <TeX math="s, s, s\sqrt{2}" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Volumes */}
                    <div className="p-3 bg-secondary/50 rounded-lg border border-border">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase mb-4">Volume Formulas</p>
                      <div className="grid grid-cols-2 gap-y-6 gap-x-2">
                        <div className="flex flex-col items-center">
                          <svg width="50" height="40" viewBox="0 0 50 40" className="text-foreground/40 mb-1">
                            <rect x="5" y="15" width="30" height="20" fill="none" stroke="currentColor" />
                            <path d="M5,15 L15,5 L45,5 L45,25 L35,35" fill="none" stroke="currentColor" />
                            <line x1="35" y1="15" x2="45" y2="5" stroke="currentColor" />
                            <text x="20" y="38" fontSize="7" fill="currentColor">ℓ</text>
                            <text x="37" y="30" fontSize="7" fill="currentColor">w</text>
                            <text x="47" y="15" fontSize="7" fill="currentColor">h</text>
                          </svg>
                          <TeX math="V = \ell wh" />
                        </div>
                        <div className="flex flex-col items-center">
                          <svg width="50" height="40" viewBox="0 0 50 40" className="text-foreground/40 mb-1">
                            <ellipse cx="25" cy="10" rx="15" ry="5" fill="none" stroke="currentColor" />
                            <path d="M10,10 L10,30 A15,5 0 0,0 40,30 L40,10" fill="none" stroke="currentColor" />
                            <line x1="25" y1="10" x2="40" y2="10" stroke="currentColor" strokeDasharray="1 1" />
                            <text x="30" y="9" fontSize="7" fill="currentColor">r</text>
                            <text x="43" y="20" fontSize="7" fill="currentColor">h</text>
                          </svg>
                          <TeX math="V = \pi r^2 h" />
                        </div>
                        <div className="flex flex-col items-center">
                          <svg width="50" height="40" viewBox="0 0 50 40" className="text-foreground/40 mb-1">
                            <circle cx="25" cy="20" r="15" fill="none" stroke="currentColor" />
                            <ellipse cx="25" cy="20" rx="15" ry="5" fill="none" stroke="currentColor" strokeDasharray="2 2" />
                            <line x1="25" y1="20" x2="40" y2="20" stroke="currentColor" strokeDasharray="1 1" />
                            <text x="30" y="18" fontSize="7" fill="currentColor">r</text>
                          </svg>
                          <TeX math="V = \frac{4}{3} \pi r^3" />
                        </div>
                        <div className="flex flex-col items-center">
                          <svg width="50" height="40" viewBox="0 0 50 40" className="text-foreground/40 mb-1">
                            <ellipse cx="25" cy="30" rx="15" ry="5" fill="none" stroke="currentColor" />
                            <path d="M10,30 L25,5 L40,30" fill="none" stroke="currentColor" />
                            <line x1="25" y1="5" x2="25" y2="30" stroke="currentColor" strokeDasharray="1 1" />
                            <text x="27" y="15" fontSize="7" fill="currentColor">h</text>
                            <text x="30" y="36" fontSize="7" fill="currentColor">r</text>
                          </svg>
                          <TeX math="V = \frac{1}{3} \pi r^2 h" />
                        </div>
                      </div>
                    </div>

                    {/* Extra Facts */}
                    <div className="p-3 bg-primary/5 rounded-lg border border-primary/10 space-y-2">
                      <p className="text-[10px] font-bold text-primary uppercase mb-1">Additional Facts</p>
                      <ul className="text-[11px] space-y-1 text-muted-foreground list-disc pl-4">
                        <li>The number of degrees of arc in a circle is 360.</li>
                        <li>The number of radians of arc in a circle is $2\pi$.</li>
                        <li>The sum of the measures in degrees of the angles of a triangle is 180.</li>
                      </ul>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>

        {/* Precise Timer Module */}
        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
          <div className="bg-secondary px-6 py-1 rounded-t-lg border-x border-t border-border min-w-[90px] text-center shadow-sm">
            <span className={`text-xl font-bold text-foreground tracking-tight ${isTimerHidden ? 'opacity-0' : ''}`}>
              {formatTime(timerInSeconds)}
            </span>
          </div>
          <button
            onClick={() => setIsTimerHidden(!isTimerHidden)}
            className="w-full bg-card border border-border rounded-b-lg py-0.5 text-[10px] font-semibold text-muted-foreground hover:text-foreground uppercase flex items-center justify-center gap-1 shadow-sm transition-colors"
          >
            {isTimerHidden ? <ChevronDown className="w-3 h-3" /> : <Minimize2 className="w-3 h-3 rotate-45" />}
            {isTimerHidden ? 'Show' : 'Hide'}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNotesPanel(!showNotesPanel)}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-md border transition-all ${showNotesPanel ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-foreground border-border hover:bg-secondary/80'
              }`}
          >
            <Pencil className="w-4 h-4" /> Highlights & Notes
          </button>
          <button className="p-2 rounded-md bg-secondary text-foreground hover:bg-secondary/80 border border-border transition-colors">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* TEST BODY (Split 50/50) */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* LEFT: Passage */}
        <div className="w-1/2 h-full flex flex-col bg-card overflow-y-auto border-r border-border scrollbar-hide"
          onMouseUp={handleTextSelection}
        >
          {activeTab === 'math' ? (
            <div className="w-full h-full flex flex-col p-4">
              <div className="flex items-center gap-2 mb-4 px-2">
                <Calculator className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-foreground">Desmos Graphing Calculator</span>
              </div>
              <iframe
                src="https://www.desmos.com/calculator"
                className="w-full h-full rounded-xl border border-border shadow-inner bg-white dark:bg-slate-900"
                title="Desmos Graphing Calculator"
              />
            </div>
          ) : (
            <div className="p-8 lg:p-12">
              <div className="max-w-[560px] mx-auto w-full relative">
                <p className="text-base leading-relaxed text-foreground font-serif whitespace-pre-line selection:bg-primary/20">
                  <HighlightedText text={currentQ.passage || ''} highlights={questionHighlights} />
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Floating Selection Menu */}
        <AnimatePresence>
          {selectionMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed z-[999] bg-card rounded-md shadow-lg border border-border p-1.5 flex items-center gap-1.5 -translate-x-1/2 -translate-y-full mb-4"
              style={{ left: selectionMenu.x, top: selectionMenu.y }}
            >
              {/* Color Options */}
              <button
                onClick={() => saveHighlight.mutate({ text: selectionMenu.text, color: 'yellow' })}
                className="w-6 h-6 rounded-full bg-yellow-200 border border-transparent hover:border-black/10 transition-all"
              />
              <button
                onClick={() => saveHighlight.mutate({ text: selectionMenu.text, color: 'blue' })}
                className="w-6 h-6 rounded-full bg-blue-200 border border-transparent hover:border-black/10 transition-all"
              />
              <button
                onClick={() => saveHighlight.mutate({ text: selectionMenu.text, color: 'pink' })}
                className="w-6 h-6 rounded-full bg-pink-200 border border-transparent hover:border-black/10 transition-all"
              />

              <div className="w-px h-5 bg-border mx-1" />

              {/* Utility Icons */}
              <button
                onClick={() => saveHighlight.mutate({ text: selectionMenu.text, is_underline: true })}
                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-secondary text-foreground transition-colors"
                title="Underline"
              >
                <UnderlineIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  const n = prompt("Note:");
                  if (n) saveHighlight.mutate({ text: selectionMenu.text, note: n });
                }}
                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-secondary text-foreground transition-colors"
                title="Add Note"
              >
                <StickyNote className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSelectionMenu(null)}
                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-destructive/10 text-destructive transition-colors"
                title="Clear"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notes Side Panel */}
        <AnimatePresence>
          {showNotesPanel && (
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="absolute right-0 top-0 bottom-0 w-80 bg-card border-l border-border z-[150] shadow-2xl flex flex-col"
            >
              <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/50">
                <h3 className="text-sm font-semibold text-foreground">Notes & Highlights</h3>
                <button onClick={() => setShowNotesPanel(false)} className="p-1.5 hover:bg-secondary rounded-md text-muted-foreground transition-colors">
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {questionHighlights.length === 0 && (
                  <p className="text-sm text-center text-muted-foreground mt-10">No highlights added yet.</p>
                )}
                {questionHighlights.map((h: any) => (
                  <div key={h.id} className="p-3 bg-secondary rounded-lg border border-border space-y-2 group">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs italic text-muted-foreground line-clamp-3">"{h.selected_text}"</p>
                      <button onClick={() => deleteHighlight.mutate(h.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {h.note && (
                      <div className="flex items-start gap-2 bg-card p-2.5 rounded-md border border-border shadow-sm mt-2">
                        <MessageSquare className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                        <p className="text-xs font-medium text-foreground">{h.note}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* THIN SPLIT HANDLE */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-card border border-border rounded-md shadow-sm flex items-center justify-center z-10 cursor-col-resize hover:border-primary transition-all">
          <div className="w-1 h-3 bg-muted-foreground/30 rounded-full" />
        </div>

        {/* RIGHT: Question Area */}
        <div
          className="w-1/2 bg-background h-full flex flex-col overflow-y-auto p-8 lg:p-12 scrollbar-hide"
          onMouseUp={handleTextSelection}
        >
          <div className="max-w-[560px] mx-auto w-full space-y-8">
            {/* Question Banner */}
            <div className="flex items-center justify-between">
              <div className="flex items-center bg-secondary rounded-md overflow-hidden border border-border">
                <div className="w-8 h-8 bg-card text-foreground flex items-center justify-center font-bold text-sm border-r border-border">
                  {currentQIndex + 1}
                </div>
                <button
                  onClick={toggleMark}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold transition-all ${markedQuestions.has(currentQIndex) ? 'text-destructive bg-destructive/10' : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  <Flag className={`w-3.5 h-3.5 ${markedQuestions.has(currentQIndex) ? 'fill-current' : ''}`} />
                  Mark
                </button>
              </div>
            </div>

            {/* Question Text */}
            <h3 className="text-base font-semibold leading-relaxed text-foreground tracking-tight pr-4">
              <HighlightedText text={currentQ.question_text || ''} highlights={questionHighlights} />
            </h3>

            {/* Compact Options */}
            <div className="space-y-4">
              {(currentQ.options ? Object.entries(currentQ.options) : []).map(([key, value]: any) => {
                const isSelected = sessionAnswers[currentQIndex] === key;
                const isCrossed = strikethroughOptions.has(key);
                const isChecked = checkedQuestions.has(currentQIndex);
                const isCorrectAnswer = currentQ.correct_option === key;

                let optionStyle = 'border-border bg-card hover:bg-secondary/50 text-foreground';
                let indicatorStyle = 'bg-background text-muted-foreground border-border';

                if (isSelected && !isChecked) {
                  optionStyle = 'border-primary bg-primary/10 text-primary';
                  indicatorStyle = 'bg-primary text-primary-foreground border-primary';
                } else if (isChecked && isCorrectAnswer) {
                  optionStyle = 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
                  indicatorStyle = 'bg-emerald-500 text-white border-emerald-500';
                } else if (isChecked && isSelected && !isCorrectAnswer) {
                  optionStyle = 'border-destructive bg-destructive/10 text-destructive';
                  indicatorStyle = 'bg-destructive text-destructive-foreground border-destructive';
                }

                return (
                  <div key={key} className="flex items-center gap-3 group">
                    <button
                      onClick={() => handleAnswer(key)}
                      disabled={isChecked || isCrossed}
                      className={`flex-1 flex items-center p-3 rounded-lg border transition-all duration-200 ${optionStyle} ${isCrossed ? 'opacity-40' : ''}`}
                    >
                      <div className={`w-7 h-7 rounded-[4px] border flex items-center justify-center font-bold text-xs mr-4 transition-all ${indicatorStyle}`}>
                        {key}
                      </div>
                      <span className={`text-sm font-medium leading-relaxed ${isCrossed ? 'line-through text-muted-foreground' : ''}`}>
                        <HighlightedText text={value as string} highlights={[]} />
                      </span>
                    </button>
                    {!isChecked && (
                      <button
                        onClick={(e) => toggleStrikethrough(key, e)}
                        className={`w-8 h-8 rounded-[4px] border border-border flex items-center justify-center transition-all ${isCrossed ? 'bg-secondary text-primary border-primary/30' : 'text-muted-foreground hover:border-foreground opacity-0 group-hover:opacity-100'
                          }`}
                      >
                        <XCircle className="w-4 h-4 pointer-events-none" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={checkAnswer}
                disabled={!sessionAnswers[currentQIndex] || checkedQuestions.has(currentQIndex)}
                className="px-5 py-2.5 bg-secondary text-foreground text-sm font-semibold rounded-lg flex items-center gap-2 hover:bg-secondary/80 disabled:opacity-50 transition-colors"
              >
                <Check className="w-4 h-4" /> Check Answer
              </button>
            </div>

            {checkedQuestions.has(currentQIndex) && (
              <div className="p-5 bg-card border border-border rounded-xl mt-6 shadow-sm">
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-3">
                  <Lightbulb className="w-4 h-4" /> Explanation
                </div>
                <p className="text-sm leading-relaxed text-foreground font-medium">
                  {currentQ.explanation}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* SLIM FOOTER */}
      <footer className="h-[60px] bg-card border-t border-border flex items-center justify-between px-6 shrink-0 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="w-[150px] hidden sm:flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
            {displayName?.charAt(0) || 'U'}
          </div>
          <span className="text-sm font-semibold text-foreground truncate">{displayName || 'Student'}</span>
        </div>

        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <button className="px-5 py-2 text-sm font-semibold text-foreground bg-secondary hover:bg-secondary/80 rounded-lg transition-colors flex items-center gap-2 border border-border">
                Question {currentQIndex + 1} of {sessionQuestions.length} <ChevronDown className="w-4 h-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent side="top" align="center" className="w-[320px] p-4 z-[200]">
              <div className="grid grid-cols-5 gap-2">
                {sessionQuestions.map((_, idx) => {
                  const isCurrent = idx === currentQIndex;
                  const isMarked = markedQuestions.has(idx);
                  const isAnswered = !!sessionAnswers[idx];
                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentQIndex(idx)}
                      className={`relative h-10 rounded-md flex items-center justify-center text-xs font-bold border transition-colors ${isCurrent ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                        } ${isMarked ? 'bg-destructive/10 text-destructive' : isAnswered ? 'bg-primary/10 text-primary' : 'bg-background text-muted-foreground hover:bg-secondary'}`}
                    >
                      {idx + 1}
                      {isMarked && (
                        <Flag className="w-2.5 h-2.5 absolute top-1 right-1 fill-current" />
                      )}
                    </button>
                  )
                })}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="w-[150px] flex justify-end">
          <Button
            onClick={nextQuestion}
            className="w-full text-sm font-semibold h-10 shadow-sm"
          >
            {currentQIndex === sessionQuestions.length - 1 ? 'Finish' : 'Next'}
          </Button>
        </div>
      </footer>
    </div>
  );
}

function MyMistakesSection({ questions, progressData }: { questions: any[], progressData: any[] }) {
  const incorrectIds = progressData.filter(p => p.status === 'incorrect').map(p => p.question_id);
  const activeIncorrectQs = questions.filter(q => incorrectIds.includes(q.id));
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeMistakes = async () => {
    setIsAnalyzing(true);
    try {
      const qData = activeIncorrectQs.slice(0, 10).map(q => ({
        description: q.question_text,
        tags: [q.domain, q.category, q.sub_category].filter(Boolean)
      }));

      const { data, error } = await supabase.functions.invoke('mistake-ai', {
        body: { mistakes: qData, action: 'analyze' }
      });
      if (error) throw error;
      setAiAnalysis(data);
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="col-span-full space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-destructive" /> Note: Only your incorrect answers are saved here. ({activeIncorrectQs.length})
        </h2>
        <Button onClick={analyzeMistakes} disabled={isAnalyzing || activeIncorrectQs.length === 0} className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
          {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />} AI Tahlil
        </Button>
      </div>

      {aiAnalysis && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 bg-primary/5 border border-primary/20 rounded-xl space-y-4">
          <h3 className="font-bold text-lg text-primary flex items-center gap-2"><Brain className="w-5 h-5" /> AI Tahlili Natijasi</h3>
          <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{aiAnalysis.analysis}</p>
          {aiAnalysis.recommendations && (
            <ul className="list-disc pl-5 mt-2 space-y-2 text-sm text-muted-foreground mr-4">
              {aiAnalysis.recommendations.map((r: string, i: number) => <li key={i}>{r}</li>)}
            </ul>
          )}
        </motion.div>
      )}

      {activeIncorrectQs.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center opacity-50">
          <Target className="w-12 h-12 mb-4 text-muted-foreground" />
          <p>Tabriklaymiz, hozircha xatolaringiz yo'q!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeIncorrectQs.map((q, i) => (
            <div key={i} className="p-5 bg-card border border-border rounded-xl shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] uppercase tracking-widest font-bold text-destructive bg-destructive/10 px-2 py-1 rounded inline-block">{q.category}</span>
                <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground bg-secondary px-2 py-1 rounded inline-block">{q.domain}</span>
              </div>
              <p className="text-sm font-medium mb-4 text-foreground leading-relaxed">{q.question_text}</p>
              <div className="space-y-2">
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg text-sm text-emerald-700 dark:text-emerald-400">
                  <span className="font-bold mr-2">To'g'ri javob:</span> {q.options[q.correct_answer]}
                </div>
              </div>
              {q.explanation && (
                <div className="mt-4 pt-4 border-t border-border flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">{q.explanation}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
