import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { CpuIcon } from '@solar-icons/react/bold-duotone/cpu';
import { BoltIcon } from '@solar-icons/react/bold-duotone/bolt';
import { TargetIcon } from '@solar-icons/react/bold-duotone/target';
import { CupIcon } from '@solar-icons/react/bold-duotone/cup';
import { VolumeLoudIcon } from '@solar-icons/react/bold-duotone/volume-loud';
import { ClockCircleIcon } from '@solar-icons/react/bold-duotone/clock-circle';
import { StarsIcon } from '@solar-icons/react/bold-duotone/stars';
import { CodeSquareIcon } from '@solar-icons/react/bold-duotone/code-square';
import { DangerTriangleIcon } from '@solar-icons/react/bold-duotone/danger-triangle';
import { CheckCircleIcon } from '@solar-icons/react/bold-duotone/check-circle';
import { CloseCircleIcon } from '@solar-icons/react/bold-duotone/close-circle';
import { StarIcon } from '@solar-icons/react/bold-duotone/star';
import { Book2Icon } from '@solar-icons/react/bold-duotone/book-2';
import { CalendarIcon } from '@solar-icons/react/bold-duotone/calendar';
import { ChecklistIcon } from '@solar-icons/react/bold-duotone/checklist';
import { UserIcon } from '@solar-icons/react/bold-duotone/user';
import { AltArrowLeftIcon } from '@solar-icons/react/bold-duotone/alt-arrow-left';
import { RefreshCircleIcon } from '@solar-icons/react/bold-duotone/refresh-circle';
import { RocketIcon } from '@solar-icons/react/bold-duotone/rocket';
import { useAuth } from '@/hooks/useAuth';

interface Word {
  id: string;
  word: string;
  meaning: string;
  memory_level: number;
  next_review: string;
  correct_streak: number;
  total_reviews: number;
  learned: boolean;
  memory_trick?: string;
}

import { Hash } from 'lucide-react';
import VocabRunnerGame from '@/components/student/VocabRunnerGame';
import { useNavigate } from 'react-router-dom';

type GameMode = 'menu' | 'spaced' | 'match' | 'speed' | 'spelling' | 'hangman' | 'fillin' | 'audioquiz' | 'memorize' | 'truefalse' | 'challenge' | 'runner';

// Leitner intervals in hours
const LEITNER_INTERVALS = [0, 1, 8, 24, 72, 168]; // box 0=now, 1=1h, 2=8h, 3=1day, 4=3days, 5=7days

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const speakWord = (word: string) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(word);
    u.lang = 'en-US';
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
  }
};

// Memory level to color/label
function TrainerHeader({ title, onBack, onClose }: { title: string; onBack: () => void; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <button onClick={onBack}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <AltArrowLeftIcon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
        </button>
        <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white">{title}</h3>
      </div>
      <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
        <CloseCircleIcon className="w-4 h-4 text-slate-400" />
      </button>
    </div>
  );
}

function getLevelInfo(level: number) {
  const levels = [
    { color: 'text-rose-500', bg: 'bg-rose-500/10', label: 'Yangi', icon: '●' },
    { color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'Zaif', icon: '●' },
    { color: 'text-amber-500', bg: 'bg-amber-500/10', label: "O'rta", icon: '●' },
    { color: 'text-sky-500', bg: 'bg-sky-500/10', label: 'Yaxshi', icon: '●' },
    { color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Mustahkam', icon: '●' },
    { color: 'text-[#E8192C]', bg: 'bg-[#E8192C]/10', label: 'Mukammal', icon: '★' },
  ];
  return levels[Math.min(level, 5)];
}

interface Props {
  words: Word[];
  onClose: () => void;
}

function WordRain({ words }: { words: string[] }) {
  const [items, setItems] = useState<{ id: number; text: string; left: number; duration: number; size: number }[]>([]);

  useEffect(() => {
    if (!words || words.length === 0) return;

    // Pre-fill some items so it starts immediately
    const initial = Array.from({ length: 6 }).map(() => ({
      id: Math.random(),
      text: words[Math.floor(Math.random() * words.length)],
      left: Math.random() * 100,
      duration: 6 + Math.random() * 8,
      size: 0.8 + Math.random() * 0.8
    }));
    setItems(initial);

    const interval = setInterval(() => {
      setItems(prev => [
        ...prev.slice(-40),
        {
          id: Date.now() + Math.random(),
          text: words[Math.floor(Math.random() * words.length)],
          left: Math.random() * 100,
          duration: 8 + Math.random() * 12,
          size: 0.8 + Math.random() * 0.8
        }
      ]);
    }, 800);
    return () => clearInterval(interval);
  }, [words]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
      <AnimatePresence>
        {items.map(item => (
          <motion.div
            key={item.id}
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 1200, opacity: 0.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: item.duration, ease: "linear" }}
            style={{
              left: `${item.left}%`,
              fontSize: `${item.size}rem`,
            }}
            className="absolute font-bold whitespace-nowrap text-[#E8192C]/40"
          >
            {item.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default function VocabMemoryTrainer({ 
  words: initialWords, 
  onClose,
  onModeChange,
  initialMode = 'menu'
}: { 
  words?: Word[]; 
  onClose: () => void;
  onModeChange?: (mode: string) => void;
  initialMode?: GameMode;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [internalWords, setInternalWords] = useState<Word[]>(initialWords || []);
  const [loading, setLoading] = useState(!initialWords);

  useEffect(() => {
    if (!initialWords && user) {
      const fetchWords = async () => {
        const { data } = await supabase
          .from('vocabulary')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(500);
        if (data) setInternalWords(data as any);
        setLoading(false);
      };
      fetchWords();
    }
  }, [initialWords, user]);

  const words = internalWords;
  const allWords = words; // Alias for backward compatibility in the file

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [modeState, setModeState] = useState<GameMode>(initialMode || 'menu');
  const setMode = (m: GameMode) => {
    setModeState(m);
    onModeChange?.(m);
  };
  const mode = modeState;
  const [activePool, setActivePool] = useState<Word[]>(allWords);

  useEffect(() => {
    if (initialMode === 'runner' && modeState !== 'runner') {
      setModeState('runner');
      if (allWords.length > 0) {
        setRunnerWords(allWords);
        setActivePool(allWords);
      }
    }
  }, [initialMode, allWords]);

  useEffect(() => {
    if (allWords.length > 0 && activePool.length === 0) {
      setActivePool(allWords);
    }
  }, [allWords]);

  const [showFilterModal, setShowFilterModal] = useState<GameMode | null>(null);

  const [shownCounts, setShownCounts] = useState<Record<string, number>>({});
  const [isSelectingWords, setIsSelectingWords] = useState(false);
  const [selectedWordIds, setSelectedWordIds] = useState<Set<string>>(new Set());

  // ---- Challenge Mode ----
  const [challengeStage, setChallengeStage] = useState<number | null>(null);
  const [challengeScores, setChallengeScores] = useState<{ stage: string; score: number; total: number }[]>([]);
  const [challengeWords, setChallengeWords] = useState<Word[]>([]);
  const [selectedFilterDate, setSelectedFilterDate] = useState<string>(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (mode === 'menu') {
      setChallengeStage(null);
      setChallengeScores([]);
    }
  }, [mode]);

  // Escape key closes the trainer
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Leaderboard statistics (all users) via secure RPC
  const { data: leaderboardData = [] } = useQuery({
    queryKey: ['vocab-leaderboard'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('get_vocab_leaderboard');
      if (error) {
        console.error('Leaderboard error:', error);
        return [];
      }
      return (data as any[]) || [];
    }
  });

  const leaderboard = useMemo(() => {
    return (leaderboardData as any[]).map((item: any) => ({
      uid: item.u_id,
      name: item.d_name || 'Student',
      count: item.learned_count
    }));
  }, [leaderboardData]);

  // ---- Spaced Repetition ----
  const [srQueue, setSrQueue] = useState<Word[]>([]);
  const [srIndex, setSrIndex] = useState(0);
  const [srFlipped, setSrFlipped] = useState(false);
  const [srStats, setSrStats] = useState({ correct: 0, wrong: 0 });

  // ---- Match Game ----
  const [matchPairs, setMatchPairs] = useState<{ id: string; text: string; type: 'word' | 'meaning'; pairId: string }[]>([]);
  const [matchSelected, setMatchSelected] = useState<string | null>(null);
  const [matchMatched, setMatchMatched] = useState<Set<string>>(new Set());
  const [matchWrong, setMatchWrong] = useState<string | null>(null);
  const [matchScore, setMatchScore] = useState(0);
  const [matchStartTime, setMatchStartTime] = useState(0);
  const [matchTime, setMatchTime] = useState(0);

  // ---- Speed Quiz ----
  const [speedWords, setSpeedWords] = useState<Word[]>([]);
  const [speedIndex, setSpeedIndex] = useState(0);
  const [speedOptions, setSpeedOptions] = useState<string[]>([]);
  const [speedAnswer, setSpeedAnswer] = useState<string | null>(null);
  const [speedScore, setSpeedScore] = useState(0);
  const [speedTimer, setSpeedTimer] = useState(10);
  const [speedActive, setSpeedActive] = useState(false);
  const speedTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ---- Spelling Bee ----
  const [spellWords, setSpellWords] = useState<Word[]>([]);
  const [spellIndex, setSpellIndex] = useState(0);
  const [spellInput, setSpellInput] = useState('');
  const [spellResult, setSpellResult] = useState<null | 'correct' | 'wrong'>(null);
  const [spellScore, setSpellScore] = useState(0);
  const [spellHint, setSpellHint] = useState(false);

  // ---- Hangman ----
  const [hangWord, setHangWord] = useState<Word | null>(null);
  const [hangGuessed, setHangGuessed] = useState<Set<string>>(new Set());
  const [hangWrong, setHangWrong] = useState(0);
  const [hangScore, setHangScore] = useState(0);
  const [hangTotal, setHangTotal] = useState(0);
  const [hangFinished, setHangFinished] = useState(false);
  const MAX_WRONG = 6;

  // Keyboard support for hangman
  useEffect(() => {
    if (mode !== 'hangman') return;
    const handleKey = (e: KeyboardEvent) => {
      const letter = e.key.toLowerCase();
      if (/^[a-z]$/.test(letter)) {
        guessLetter(letter);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [mode, hangWord, hangGuessed, hangFinished]);

  // ---- Fill-in-blank ----
  const [fillWords, setFillWords] = useState<Word[]>([]);
  const [fillIndex, setFillIndex] = useState(0);
  const [fillInput, setFillInput] = useState('');
  const [fillResult, setFillResult] = useState<null | 'correct' | 'wrong'>(null);
  const [fillScore, setFillScore] = useState(0);
  const [fillSentence, setFillSentence] = useState('');

  // ---- Audio Quiz ----
  const [audioWords, setAudioWords] = useState<Word[]>([]);
  const [audioIndex, setAudioIndex] = useState(0);
  const [audioOptions, setAudioOptions] = useState<string[]>([]);
  const [audioAnswer, setAudioAnswer] = useState<string | null>(null);
  const [audioScore, setAudioScore] = useState(0);
  const [audioPlayed, setAudioPlayed] = useState(false);

  // ---- Memorize Mode (Intensive) ----
  const [memoQueue, setMemoQueue] = useState<{ word: Word, mastery: number }[]>([]);
  const [memoIndex, setMemoIndex] = useState(0);
  const [memoFlipped, setMemoFlipped] = useState(false);
  const [memoResult, setMemoResult] = useState<'correct' | 'wrong' | null>(null);
  const [memoTyped, setMemoTyped] = useState('');
  const [memoPhase, setMemoPhase] = useState<'study' | 'test'>('study');

  // ---- True/False ----
  const [tfQueue, setTfQueue] = useState<{ word: string, meaning: string, isCorrect: boolean, realMeaning: string, id: string }[]>([]);
  const [tfIndex, setTfIndex] = useState(0);
  const [tfScore, setTfScore] = useState(0);
  const [tfResult, setTfResult] = useState<null | 'correct' | 'wrong'>(null);
  const [tfLastChoice, setTfLastChoice] = useState<boolean | null>(null);

  // ---- Vocab Runner ----
  const [runnerWords, setRunnerWords] = useState<Word[]>([]);

  const startRunner = (pool: Word[] = activePool) => {
    navigate('/lugat/game');
  };

  const updateWordMemory = useCallback(async (wordId: string, correct: boolean, currentLevel: number) => {
    const word = allWords.find(w => w.id === wordId);
    const currentStreak = word?.correct_streak || 0;
    const newStreak = correct ? currentStreak + 1 : 0;
    const newLevel = correct ? Math.min(currentLevel + 1, 5) : Math.max(currentLevel - 1, 0);
    const hoursUntilNext = LEITNER_INTERVALS[newLevel];
    const nextReview = new Date(Date.now() + hoursUntilNext * 3600000).toISOString();
    const totalReviews = (word?.total_reviews || 0) + 1;
    // Auto-learned after 5 correct streak, but NEVER go back to unlearned if already learned
    const isLearned = word?.learned || newStreak >= 5 || newLevel >= 4;

    await (supabase.from('vocabulary') as any).update({
      memory_level: newLevel,
      next_review: nextReview,
      correct_streak: newStreak,
      total_reviews: totalReviews,
      last_reviewed: new Date().toISOString(),
      learned: isLearned,
    }).eq('id', wordId);

    if (newStreak === 5 && !word?.learned) {
      toast({ title: `"${word?.word}" o'rganildi! 🎉`, description: '5 marta ketma-ket to\'g\'ri javob berdingiz' });
    }

    queryClient.invalidateQueries({ queryKey: ['vocabulary'] });
  }, [allWords, queryClient]);

  // ===== MATCH LOGIC =====
  useEffect(() => {
    if (mode === 'match' && matchMatched.size < matchPairs.length / 2) {
      const interval = setInterval(() => setMatchTime(Date.now() - matchStartTime), 100);
      return () => clearInterval(interval);
    }
  }, [mode, matchMatched.size, matchPairs.length, matchStartTime]);

  useEffect(() => {
    if (mode !== 'speed' || !speedActive) return;
    speedTimerRef.current = setInterval(() => {
      setSpeedTimer(t => {
        if (t <= 1) {
          // Time's up
          handleSpeedAnswer(null);
          return 10;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (speedTimerRef.current) clearInterval(speedTimerRef.current); };
  }, [mode, speedActive, speedIndex]);

  // ===== MEMORY STATS =====
  const memoryDistribution = useMemo(() => {
    const dist = [0, 0, 0, 0, 0, 0];
    allWords.forEach(w => { dist[Math.min(w.memory_level || 0, 5)]++; });
    return dist;
  }, [allWords]);

  const dueCount = useMemo(() => allWords.filter(w => !w.next_review || w.next_review <= new Date().toISOString()).length, [allWords]);
  const avgLevel = useMemo(() => allWords.length > 0 ? (allWords.reduce((s, w) => s + (w.memory_level || 0), 0) / allWords.length).toFixed(1) : '0', [allWords]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[200] bg-white dark:bg-slate-900 flex flex-col items-center justify-center">
        <RefreshCircleIcon className="w-12 h-12 text-[#E8192C] animate-spin" />
        <p className="mt-4 text-sm font-medium text-slate-500">Yuklanmoqda...</p>
      </div>
    );
  }


  const pickWords = (count: number, pool: Word[] = activePool) => {
    // Filter words that have been shown less than 2 times
    let available = pool.filter(w => (shownCounts[w.id] || 0) < 2);

    // If not enough available, use all words but still prioritize less shown ones
    if (available.length < count) {
      available = [...pool].sort((a, b) => (shownCounts[a.id] || 0) - (shownCounts[b.id] || 0));
    }

    const selected = shuffleArray(available).slice(0, count);

    // Update counts
    setShownCounts(prev => {
      const next = { ...prev };
      selected.forEach(w => next[w.id] = (next[w.id] || 0) + 1);
      return next;
    });

    return selected;
  };





  // ===== START MODES =====
  const startSpaced = (pool: Word[] = activePool) => {
    const now = new Date().toISOString();
    let due = pool.filter(w => !w.next_review || w.next_review <= now);
    if (due.length === 0) due = pool.filter(w => w.memory_level < 5);
    if (due.length === 0) { toast({ title: "Barcha so'zlar mustahkam!" }); return; }

    // Use pickWords to respect the repetition limit
    const selected = pickWords(Math.min(20, due.length), pool);

    setActivePool(pool);
    setSrQueue(selected);
    setSrIndex(0);
    setSrFlipped(false);
    setSrStats({ correct: 0, wrong: 0 });
    setMode('spaced');
  };

  const startMatch = (pool: Word[] = activePool) => {
    if (pool.length < 4) { toast({ title: "Kamida 4 ta so'z kerak", variant: 'destructive' }); return; }
    const selected = pickWords(Math.min(6, pool.length), pool);
    const pairs: typeof matchPairs = [];
    selected.forEach(w => {
      pairs.push({ id: w.id + '-w', text: w.word, type: 'word', pairId: w.id });
      pairs.push({ id: w.id + '-m', text: w.meaning.split('—')[0].trim().slice(0, 40), type: 'meaning', pairId: w.id });
    });
    setActivePool(pool);
    setMatchPairs(shuffleArray(pairs));
    setMatchSelected(null);
    setMatchMatched(new Set());
    setMatchWrong(null);
    setMatchScore(0);
    setMatchStartTime(Date.now());
    setMatchTime(0);
    setMode('match');
  };

  const startSpeed = (pool: Word[] = activePool) => {
    if (pool.length < 4) { toast({ title: "Kamida 4 ta so'z kerak", variant: 'destructive' }); return; }
    const sw = pickWords(Math.min(15, pool.length), pool);
    setActivePool(pool);
    setSpeedWords(sw);
    setSpeedIndex(0);
    setSpeedScore(0);
    setSpeedAnswer(null);
    setSpeedActive(true);
    setSpeedTimer(10);
    generateSpeedOptions(sw, 0, pool);
    setMode('speed');
  };

  const startSpelling = (pool: Word[] = activePool) => {
    if (pool.length < 2) { toast({ title: "Kamida 2 ta so'z kerak", variant: 'destructive' }); return; }
    const sw = pickWords(Math.min(10, pool.length), pool);
    setActivePool(pool);
    setSpellWords(sw);
    setSpellIndex(0);
    setSpellInput('');
    setSpellResult(null);
    setSpellScore(0);
    setSpellHint(false);
    setMode('spelling');
  };

  // ===== MATCH LOGIC =====


  const handleMatchClick = (item: typeof matchPairs[0]) => {
    if (matchMatched.has(item.pairId)) return;
    if (matchWrong) return;

    if (!matchSelected) {
      setMatchSelected(item.id);
    } else {
      const selectedItem = matchPairs.find(p => p.id === matchSelected)!;
      if (selectedItem.id === item.id) { setMatchSelected(null); return; }

      if (selectedItem.pairId === item.pairId && selectedItem.type !== item.type) {
        // Correct match
        setMatchMatched(prev => {
          const newSet = new Set(Array.from(prev));
          newSet.add(item.pairId);
          return newSet;
        });
        updateWordMemory(item.pairId, true, allWords.find(w => w.id === item.pairId)?.memory_level || 0);
        setMatchSelected(null);
      } else {
        // Wrong
        setMatchWrong(item.id);
        setTimeout(() => { setMatchWrong(null); setMatchSelected(null); }, 600);
      }
    }
  };

  // ===== SPEED QUIZ LOGIC =====
  const generateSpeedOptions = (sw: Word[], idx: number, pool: Word[] = activePool) => {
    const correct = sw[idx];
    const others = pool.filter(w => w.id !== correct.id);
    const optionsPool = others.length >= 3 ? others : allWords.filter(w => w.id !== correct.id);
    const wrongOptions = shuffleArray(optionsPool).slice(0, 3).map((w: Word) => w.meaning.split('—')[0].trim().slice(0, 50));
    const correctMeaning = correct.meaning.split('—')[0].trim().slice(0, 50);
    setSpeedOptions(shuffleArray([correctMeaning, ...wrongOptions]));
  };



  const handleSpeedAnswer = (answer: string | null) => {
    if (speedTimerRef.current) clearInterval(speedTimerRef.current);
    const correct = speedWords[speedIndex];
    const correctMeaning = correct.meaning.split('—')[0].trim().slice(0, 50);
    const isCorrect = answer === correctMeaning;

    setSpeedAnswer(answer);
    if (isCorrect) setSpeedScore(s => s + 1);
    updateWordMemory(correct.id, isCorrect, correct.memory_level || 0);

    setTimeout(() => {
      if (speedIndex + 1 < speedWords.length) {
        setSpeedIndex(i => i + 1);
        setSpeedAnswer(null);
        setSpeedTimer(10);
        setSpeedActive(true);
        generateSpeedOptions(speedWords, speedIndex + 1, activePool);
      } else {
        if (challengeStage === 4) {
          const stats = { stage: 'Tezkor Viktorina', score: speedScore + (isCorrect ? 1 : 0), total: speedWords.length };
          setChallengeScores(prev => [...prev, stats]);
          setChallengeStage(5);
          setMode('challenge');
        } else {
          setSpeedActive(false);
        }
      }
    }, 1200);
  };

  // ===== SPELLING LOGIC =====
  const checkSpelling = () => {
    const correct = spellWords[spellIndex].word.toLowerCase().trim();
    const input = spellInput.toLowerCase().trim();
    const isCorrect = input === correct;
    setSpellResult(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) setSpellScore(s => s + 1);
    updateWordMemory(spellWords[spellIndex].id, isCorrect, spellWords[spellIndex].memory_level || 0);
  };

  const nextSpelling = () => {
    if (spellIndex + 1 < spellWords.length) {
      setSpellIndex(i => i + 1);
      setSpellInput('');
      setSpellResult(null);
      setSpellHint(false);
    }
  };

  // ===== SPACED REPETITION HANDLER =====
  const handleSrAnswer = (correct: boolean) => {
    const word = srQueue[srIndex];
    setSrStats(s => correct ? { ...s, correct: s.correct + 1 } : { ...s, wrong: s.wrong + 1 });
    updateWordMemory(word.id, correct, word.memory_level || 0);

    if (srIndex + 1 < srQueue.length) {
      setSrIndex(i => i + 1);
      setSrFlipped(false);
    } else {
      toast({ title: `Takrorlash tugadi! ${srStats.correct + (correct ? 1 : 0)}/${srQueue.length}` });
    }
  };

  // ===== HANGMAN LOGIC =====
  const startHangman = (pool: Word[] = activePool) => {
    if (pool.length < 2) { toast({ title: "Kamida 2 ta so'z kerak", variant: 'destructive' }); return; }
    const w = pool[Math.floor(Math.random() * pool.length)];
    setActivePool(pool);
    setHangWord(w);
    setHangGuessed(new Set());
    setHangWrong(0);
    setHangScore(0);
    setHangTotal(0);
    setHangFinished(false);
    setMode('hangman');
  };

  const nextHangman = (won: boolean) => {
    const w = activePool[Math.floor(Math.random() * activePool.length)];
    setHangWord(w);
    setHangGuessed(new Set());
    setHangWrong(0);
    setHangFinished(false);
  };

  const guessLetter = (letter: string) => {
    if (!hangWord || hangFinished) return;
    const newGuessed = new Set(Array.from(hangGuessed));
    newGuessed.add(letter);
    setHangGuessed(newGuessed);

    const wordLower = hangWord.word.toLowerCase();
    if (!wordLower.includes(letter)) {
      const newWrong = hangWrong + 1;
      setHangWrong(newWrong);
      if (newWrong >= MAX_WRONG) {
        setHangFinished(true);
        setHangTotal(t => t + 1);
        updateWordMemory(hangWord.id, false, hangWord.memory_level || 0);
      }
    } else {
      const allGuessed = wordLower.split('').every(ch => ch === ' ' || ch === '-' || newGuessed.has(ch));
      if (allGuessed) {
        setHangFinished(true);
        setHangScore(s => s + 1);
        setHangTotal(t => t + 1);
        updateWordMemory(hangWord.id, true, hangWord.memory_level || 0);
      }
    }
  };

  // ===== FILL-IN-BLANK LOGIC =====
  const startFillIn = (pool: Word[] = activePool) => {
    if (pool.length < 2) { toast({ title: "Kamida 2 ta so'z kerak", variant: 'destructive' }); return; }
    const sw = pickWords(Math.min(10, pool.length), pool);
    setActivePool(pool);
    setFillWords(sw);
    setFillIndex(0);
    setFillInput('');
    setFillResult(null);
    setFillScore(0);
    generateFillSentence(sw[0]);
    setMode('fillin');
  };

  const generateFillSentence = (w: Word) => {
    const templates = [
      `The word "___" means: ${w.meaning.split('—')[0].trim()}`,
      `Complete: I need to use ___ in my daily life. (${w.meaning.split('—')[0].trim()})`,
      `Fill in the blank: The ___ approach worked well. (${w.meaning.split('—')[0].trim()})`,
    ];
    setFillSentence(templates[Math.floor(Math.random() * templates.length)]);
  };

  const checkFillIn = () => {
    const correct = fillWords[fillIndex].word.toLowerCase().trim();
    const input = fillInput.toLowerCase().trim();
    const isCorrect = input === correct;
    setFillResult(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) setFillScore(s => s + 1);
    updateWordMemory(fillWords[fillIndex].id, isCorrect, fillWords[fillIndex].memory_level || 0);
  };

  const nextFillIn = () => {
    if (fillIndex + 1 < fillWords.length) {
      setFillIndex(i => i + 1);
      setFillInput('');
      setFillResult(null);
      generateFillSentence(fillWords[fillIndex + 1]);
    }
  };

  // ===== AUDIO QUIZ LOGIC =====
  const startAudioQuiz = (pool: Word[] = activePool) => {
    if (pool.length < 4) { toast({ title: "Kamida 4 ta so'z kerak", variant: 'destructive' }); return; }
    const sw = pickWords(Math.min(10, pool.length), pool);
    setActivePool(pool);
    setAudioWords(sw);
    setAudioIndex(0);
    setAudioOptions([]);
    setAudioAnswer(null);
    setAudioScore(0);
    setAudioPlayed(false);
    generateAudioOptions(sw, 0, pool);
    setMode('audioquiz');
  };

  const generateAudioOptions = (sw: Word[], idx: number, pool: Word[] = activePool) => {
    const correct = sw[idx];
    const others = pool.filter(w => w.id !== correct.id);
    const optionsPool = others.length >= 3 ? others : allWords.filter(w => w.id !== correct.id);
    const wrongOptions = shuffleArray(optionsPool).slice(0, 3).map((w: Word) => w.meaning.split('—')[0].trim().slice(0, 50));
    const correctMeaning = correct.meaning.split('—')[0].trim().slice(0, 50);
    setAudioOptions(shuffleArray([correctMeaning, ...wrongOptions]));
  };

  const handleAudioAnswer = (answer: string) => {
    const correct = audioWords[audioIndex];
    const correctMeaning = correct.meaning.split('—')[0].trim().slice(0, 50);
    const isCorrect = answer === correctMeaning;
    setAudioAnswer(answer);
    if (isCorrect) setAudioScore(s => s + 1);
    updateWordMemory(correct.id, isCorrect, correct.memory_level || 0);
  };

  const nextAudioQuestion = () => {
    if (audioIndex + 1 < audioWords.length) {
      setAudioIndex(i => i + 1);
      setAudioAnswer(null);
      setAudioPlayed(false);
      generateAudioOptions(audioWords, audioIndex + 1, activePool);
    }
  };

  // ===== MEMORIZE LOGIC =====
  const startMemorize = (pool: Word[] = activePool) => {
    if (pool.length < 1) { toast({ title: "Lug'at bo'sh", variant: 'destructive' }); return; }
    const selected = pickWords(Math.min(5, pool.length), pool);
    setActivePool(pool);
    setMemoQueue(selected.map(w => ({ word: w, mastery: 0 })));
    setMemoIndex(0);
    setMemoPhase('study');
    setMemoFlipped(false);
    setMemoTyped('');
    setMemoResult(null);
    setMode('memorize');
  };

  const handleMemoCorrect = async () => {
    const current = memoQueue[memoIndex];
    const newMastery = current.mastery + 1;

    if (newMastery >= 3) {
      toast({ title: "So'z yodlandi!", description: current.word.word });
      const newQueue = memoQueue.filter((_, i) => i !== memoIndex);
      await (supabase.from('vocabulary') as any).update({ learned: true, last_reviewed: new Date().toISOString() }).eq('id', current.word.id);

      if (newQueue.length === 0) {
        if (challengeStage === 1) {
          const stats = { stage: 'Intensiv Yodlash', score: 5, total: 5 }; // They finished all 5
          setChallengeScores(prev => [...prev, stats]);
          setChallengeStage(2);
          startMatch(challengeWords);
        } else {
          setMode('menu');
          queryClient.invalidateQueries({ queryKey: ['vocabulary'] });
        }
      } else {
        setMemoQueue(newQueue);
        setMemoIndex(i => i % newQueue.length);
        setMemoPhase('study');
        setMemoFlipped(false);
        setMemoResult(null);
        setMemoTyped('');
      }
    } else {
      const newQueue = [...memoQueue];
      newQueue[memoIndex].mastery = newMastery;
      setMemoQueue(newQueue);
      setMemoIndex((memoIndex + 1) % newQueue.length);
      setMemoPhase('study');
      setMemoFlipped(false);
      setMemoResult(null);
      setMemoTyped('');
    }
  };

  const handleMemoWrong = () => {
    const newQueue = [...memoQueue];
    newQueue[memoIndex].mastery = Math.max(0, newQueue[memoIndex].mastery - 1);
    setMemoQueue(newQueue);
    setMemoIndex((memoIndex + 1) % newQueue.length);
    setMemoPhase('study');
    setMemoFlipped(false);
    setMemoResult(null);
    setMemoTyped('');
  };

  const checkMemoTyped = () => {
    const correct = memoTyped.trim().toLowerCase() === memoQueue[memoIndex].word.word.toLowerCase();
    setMemoResult(correct ? 'correct' : 'wrong');
    if (correct) {
      speakWord(memoQueue[memoIndex].word.word);
    }
  };

  // ===== TRUE/FALSE LOGIC =====
  const startTrueFalse = (pool: Word[] = activePool) => {
    if (pool.length < 2) { toast({ title: "Kamida 2 ta so'z kerak", variant: 'destructive' }); return; }
    const selected = pickWords(Math.min(15, pool.length), pool);
    const queue = selected.map(w => {
      const isCorrect = Math.random() > 0.5;
      let displayMeaning = w.meaning;
      if (!isCorrect) {
        const others = pool.filter(o => o.id !== w.id);
        displayMeaning = others[Math.floor(Math.random() * others.length)].meaning;
      }
      return {
        word: w.word,
        meaning: displayMeaning.split('—')[0].trim(),
        isCorrect,
        realMeaning: w.meaning.split('—')[0].trim(),
        id: w.id
      };
    });
    setTfQueue(queue);
    setTfIndex(0);
    setTfScore(0);
    setTfResult(null);
    setTfLastChoice(null);
    setMode('truefalse');
  };

  const startChallenge = (pool: Word[]) => {
    if (pool.length < 5) {
      toast({ title: "Kamida 5 ta so'z kerak", variant: 'destructive' });
      return;
    }
    const cw = pickWords(Math.min(15, pool.length), pool);
    setChallengeWords(cw);
    setChallengeStage(1);
    setChallengeScores([]);

    // Stage 1: Intensive
    startMemorize(cw.slice(0, 5));
  };

  const handleTrueFalse = (choice: boolean) => {
    const current = tfQueue[tfIndex];
    const isCorrect = choice === current.isCorrect;

    setTfResult(isCorrect ? 'correct' : 'wrong');
    setTfLastChoice(choice);
    if (isCorrect) setTfScore(s => s + 1);

    updateWordMemory(current.id, isCorrect, allWords.find(w => w.id === current.id)?.memory_level || 0);

    setTimeout(() => {
      if (tfIndex + 1 < tfQueue.length) {
        setTfIndex(i => i + 1);
        setTfResult(null);
        setTfLastChoice(null);
      } else {
        if (challengeStage === 3) {
          const stats = { stage: 'True or False', score: tfScore + (isCorrect ? 1 : 0), total: tfQueue.length };
          setChallengeScores(prev => [...prev, stats]);
          setChallengeStage(4);
          startSpeed(challengeWords);
        } else {
          setTfIndex(tfQueue.length); // Trigger finish screen
        }
      }
    }, 1200);
  };



  const handleModeSelect = (m: GameMode) => {
    setShowFilterModal(m);
  };

  const finalizeStart = (type: 'all' | 'learned' | 'unlearned' | 'today' | 'manual') => {
    if (!showFilterModal) return;

    let pool = allWords;
    if (type === 'learned') pool = allWords.filter(w => w.learned);
    else if (type === 'unlearned') pool = allWords.filter(w => !w.learned);
    else if (type === 'today') {
      pool = allWords.filter((w: any) => w.date_added === selectedFilterDate || (w.created_at && w.created_at.startsWith(selectedFilterDate)));
    } else if (type === 'manual') {
      setIsSelectingWords(true);
      return;
    }

    if (pool.length === 0) {
      toast({ title: "So'zlar topilmadi", description: "Sizda hali bu turkumda so'zlar yo'q.", variant: 'destructive' });
      return;
    }

    const m = showFilterModal;
    setShowFilterModal(null);

    switch (m) {
      case 'spaced': startSpaced(pool); break;
      case 'match': startMatch(pool); break;
      case 'speed': startSpeed(pool); break;
      case 'spelling': startSpelling(pool); break;
      case 'hangman': startHangman(pool); break;
      case 'fillin': startFillIn(pool); break;
      case 'audioquiz': startAudioQuiz(pool); break;
      case 'memorize': startMemorize(pool); break;
      case 'truefalse': startTrueFalse(pool); break;
      case 'challenge': startChallenge(pool); break;
      case 'runner': startRunner(pool); break;
    }
  };

  const games: { id: GameMode; icon: React.ComponentType<any>; title: string; desc: string; color: string; isNew?: boolean; action: () => void }[] = [
    { id: 'runner', icon: RocketIcon, title: 'Vocab Runner 3D', desc: 'Subway Surfers uslubida 3D yugurish va so\'z yodlash', color: 'text-emerald-500', isNew: true, action: () => handleModeSelect('runner') },
    { id: 'memorize', icon: CpuIcon, title: 'Intensiv Yodlash', desc: 'So\'zlarni chuqur o\'zlashtirish', color: 'text-blue-500', action: () => handleModeSelect('memorize') },
    { id: 'spaced', icon: CpuIcon, title: 'Spaced Repetition', desc: `${dueCount} ta so'z takrorlash kutmoqda`, color: 'text-[#E8192C]', action: () => handleModeSelect('spaced') },
    { id: 'match', icon: TargetIcon, title: "So'z Juftlash", desc: "So'z va ma'noni juftlang", color: 'text-blue-500', action: () => handleModeSelect('match') },
    { id: 'truefalse', icon: CheckCircleIcon, title: "True or False", desc: "Ma'no to'g'riligini toping", color: 'text-emerald-600', action: () => handleModeSelect('truefalse') },
    { id: 'speed', icon: BoltIcon, title: 'Tezkor Viktorina', desc: '10 soniyada javob bering', color: 'text-amber-500', action: () => handleModeSelect('speed') },
    { id: 'fillin', icon: StarsIcon, title: "Gap To'ldirish", desc: "Bo'sh joyni to'g'ri so'z bilan to'ldiring", color: 'text-blue-500', action: () => handleModeSelect('fillin') },
    { id: 'audioquiz', icon: VolumeLoudIcon, title: "Audio Quiz", desc: "So'zni eshitib ma'nosini toping", color: 'text-purple-500', action: () => handleModeSelect('audioquiz') },
    { id: 'spelling', icon: CodeSquareIcon, title: "Imlo Sinovi", desc: "Eshiting va yozing", color: 'text-emerald-600', action: () => handleModeSelect('spelling') },
    { id: 'challenge', icon: CupIcon, title: "Marafon", desc: "5 bosqichli marafon o'yini", color: 'text-yellow-500', action: () => handleModeSelect('challenge') },
    { id: 'hangman', icon: DangerTriangleIcon, title: "Odam Osish", desc: "Harflarni topib so'zni aniqlang", color: 'text-red-500', action: () => handleModeSelect('hangman') },
  ];

  const headerActions = (
    <div className="flex items-center gap-2">
      <button onClick={onClose}
        className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
        Yopish
      </button>
    </div>
  );

  // ===== MENU =====
  if (mode === 'menu') {
    return (
      <div className="w-full h-full bg-[#F8FAFC] dark:bg-[#070b14] text-slate-900 dark:text-slate-100 px-4 sm:px-6 lg:px-8 py-6 space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CpuIcon className="w-6 h-6 text-[#E8192C]" />
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Xotira Trenajyori</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Leitner Spaced Repetition tizimi</p>
            </div>
          </div>
          {headerActions}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-center">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{allWords.length}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Jami so'zlar</p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-center">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{allWords.filter(w => w.learned).length}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Yodlangan</p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-center">
            <p className="text-2xl font-bold text-[#E8192C]">{dueCount}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Takrorlash</p>
          </div>
        </div>

        {/* Filter Selection Modal Overlay */}
        {showFilterModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="rounded-2xl p-6 w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 text-center">Qaysi so'zlar bilan?</h3>
              <div className="space-y-3">
                <button onClick={() => finalizeStart('all')}
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors">
                  <span className="font-medium">Barcha so'zlar</span>
                  <span className="text-xs text-slate-500">{allWords.length} ta</span>
                </button>
                <button onClick={() => finalizeStart('learned')}
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/20 transition-colors">
                  <div className="flex items-center gap-2">
                    <StarIcon className="w-4 h-4 text-emerald-600 fill-emerald-500" />
                    <span className="font-medium text-emerald-600">Yodlangan so'zlar</span>
                  </div>
                  <span className="text-xs text-emerald-600/60">{allWords.filter(w => w.learned).length} ta</span>
                </button>
                <button onClick={() => finalizeStart('unlearned')}
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/20 transition-colors">
                  <div className="flex items-center gap-2">
                    <Book2Icon className="w-4 h-4 text-amber-500" />
                    <span className="font-medium text-amber-500">Yodlanmagan so'zlar</span>
                  </div>
                  <span className="text-xs text-amber-500/60">{allWords.filter(w => !w.learned).length} ta</span>
                </button>
                <div
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-[#E8192C]/20 transition-colors overflow-hidden"
                >
                  <button onClick={() => finalizeStart('today')}
                    className="w-full flex items-center justify-between p-4 hover:bg-[#E8192C]/5 transition-colors text-[#E8192C]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#E8192C]/10 flex items-center justify-center">
                        <CalendarIcon className="w-4.5 h-4.5" />
                      </div>
                      <div className="text-left">
                        <span className="font-semibold text-sm block">Sana bo'yicha</span>
                        <span className="text-[10px] opacity-60">Tanlangan kunga oid so'zlar</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold bg-[#E8192C]/10 px-2.5 py-1 rounded-lg">
                        {allWords.filter((w: any) => {
                          return w.date_added === selectedFilterDate || (w.created_at && w.created_at.startsWith(selectedFilterDate));
                        }).length} ta
                      </span>
                    </div>
                  </button>
                  <div className="px-4 pb-3 pt-0">
                    <input
                      type="date"
                      value={selectedFilterDate}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setSelectedFilterDate(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-[#E8192C]/20 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#E8192C] transition-all cursor-pointer"
                    />
                  </div>
                </div>
                <button onClick={() => finalizeStart('manual')}
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/20 transition-colors text-blue-500">
                  <div className="flex items-center gap-2">
                    <ChecklistIcon className="w-4 h-4" />
                    <span className="font-medium">Jadvaldan tanlash</span>
                  </div>
                  <span className="text-xs opacity-60">Tanlab oling</span>
                </button>
                <button onClick={() => setShowFilterModal(null)}
                  className="w-full py-2 text-sm text-slate-500 hover:text-slate-900 dark:text-white">Bekor qilish</button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Manual Word Selection Modal */}
        {isSelectingWords && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="rounded-2xl p-6 w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">So'zlarni tanlang</h3>
                <span className="text-xs text-slate-500">{selectedWordIds.size} ta tanlandi</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-2 mb-4 scrollbar-thin">
                {allWords.map(w => (
                  <label key={w.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
                    <input type="checkbox" checked={selectedWordIds.has(w.id)}
                      onChange={() => {
                        const newSet = new Set(Array.from(selectedWordIds));
                        if (newSet.has(w.id)) newSet.delete(w.id);
                        else newSet.add(w.id);
                        setSelectedWordIds(newSet);
                      }}
                      className="w-4 h-4 rounded border-[#E8192C] text-[#E8192C]" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{w.word}</p>
                      <p className="text-[10px] text-slate-500 truncate">{w.meaning}</p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex gap-2">
                <button onClick={() => { setIsSelectingWords(false); setSelectedWordIds(new Set()); }}
                  className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-medium hover:bg-slate-100 dark:bg-slate-800">
                  Bekor qilish
                </button>
                <button onClick={() => {
                  const pool = allWords.filter(w => selectedWordIds.has(w.id));
                  if (pool.length === 0) {
                    toast({ title: "Hech bo'lmaganda 1 ta so'z tanlang", variant: 'destructive' });
                    return;
                  }
                  const m = showFilterModal;
                  setIsSelectingWords(false);
                  setShowFilterModal(null);
                  setSelectedWordIds(new Set());

                  // Now start the game with this pool
                  if (!m) return;
                  switch (m) {
                    case 'spaced': startSpaced(pool); break;
                    case 'match': startMatch(pool); break;
                    case 'speed': startSpeed(pool); break;
                    case 'spelling': startSpelling(pool); break;
                    case 'hangman': startHangman(pool); break;
                    case 'fillin': startFillIn(pool); break;
                    case 'audioquiz': startAudioQuiz(pool); break;
                    case 'memorize': startMemorize(pool); break;
                    case 'truefalse': startTrueFalse(pool); break;
                    case 'runner': startRunner(pool); break;
                  }
                }} className="flex-1 py-3 rounded-xl bg-[#E8192C] text-white text-sm font-bold ">
                  Boshlash
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Game Modes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {games.map((game) => (
            <button key={game.id}
              onClick={game.action}
              className={`relative bg-white dark:bg-slate-900 border rounded-2xl p-5 text-left transition-all hover:shadow-lg active:scale-[0.99] flex flex-col justify-between ${game.isNew
                  ? 'border-emerald-500/40 ring-2 ring-emerald-500/20 bg-gradient-to-br from-white to-emerald-50/30 dark:from-slate-900 dark:to-emerald-950/20'
                  : 'border-slate-200/80 dark:border-slate-800 hover:border-indigo-400/50'
                }`}>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-3 rounded-2xl ${game.isNew ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800'} w-fit`}>
                    <game.icon className={`w-6 h-6 ${game.color}`} />
                  </div>
                  {game.isNew && (
                    <span className="px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-full bg-gradient-to-r from-emerald-500 to-indigo-600 text-white shadow-md animate-pulse">
                      NEW ⚡
                    </span>
                  )}
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">{game.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{game.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Word Memory Levels */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 ">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">So'zlar xotira darajasi</h3>
          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {[...allWords].sort((a, b) => (a.memory_level || 0) - (b.memory_level || 0)).map(w => {
              const info = getLevelInfo(w.memory_level || 0);
              return (
                <div key={w.id} className="flex items-center gap-2 text-xs py-1">
                  <span className="w-5 text-center">{info.icon}</span>
                  <span className="font-medium text-slate-900 dark:text-white flex-1 truncate">{w.word}</span>
                  <div className="flex gap-0.5">
                    {[0, 1, 2, 3, 4].map(i => (
                      <div key={i} className={`w-2 h-2 rounded-full ${i < (w.memory_level || 0) ? 'bg-[#E8192C]' : 'bg-slate-100 dark:bg-slate-800'}`} />
                    ))}
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${info.bg} ${info.color}`}>{info.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ===== SPACED REPETITION MODE =====
  if (mode === 'spaced') {
    if (srIndex >= srQueue.length) {
      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <TrainerHeader title="Spaced Repetition" onBack={() => setMode('menu')} onClose={onClose} />
          <div className="space-y-6 text-center py-12">
            <CupIcon className="w-16 h-16 text-amber-500 mx-auto" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Takrorlash tugadi!</h2>
            <div className="flex justify-center gap-6">
              <div><p className="text-3xl font-bold text-emerald-600">{srStats.correct}</p><p className="text-xs text-slate-500">To'g'ri</p></div>
              <div><p className="text-3xl font-bold text-red-500">{srStats.wrong}</p><p className="text-xs text-slate-500">Noto'g'ri</p></div>
            </div>
            <button onClick={() => setMode('menu')} className="px-6 py-3 rounded-xl bg-[#E8192C] text-white text-sm font-medium">Menyuga qaytish</button>
          </div>
        </div>
      );
    }

    const card = srQueue[srIndex];
    const info = getLevelInfo(card.memory_level || 0);

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <TrainerHeader title="Spaced Repetition" onBack={() => setMode('menu')} onClose={onClose} />

        <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
          <div className="h-full rounded-full bg-[#E8192C] transition-all" style={{ width: `${((srIndex + 1) / srQueue.length) * 100}%` }} />
        </div>

        <div className="flex justify-center">
          <span className={`text-xs px-2 py-1 rounded ${info.bg} ${info.color}`}>{info.icon} {info.label} (daraja {card.memory_level || 0})</span>
        </div>

        <div className="relative w-full max-w-sm mx-auto perspective-1000 mt-4">
          <motion.div key={card.id + (srFlipped ? 'flipped' : 'front')}
            drag={srFlipped ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            whileDrag={{ scale: 1.05, rotate: srFlipped ? undefined : 0, cursor: "grabbing" }}
            onDragEnd={(e, { offset }) => {
              if (srFlipped) {
                if (offset.x > 100) handleSrAnswer(true);
                else if (offset.x < -100) handleSrAnswer(false);
              }
            }}
            initial={{ rotateY: srFlipped ? -180 : 180, opacity: 0, scale: 0.8 }}
            animate={{ rotateY: 0, opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            onClick={() => !srFlipped && setSrFlipped(true)}
            className={`rounded-2xl p-10  cursor-pointer text-center min-h-[340px] flex flex-col items-center justify-center border-2 transition-all relative overflow-hidden select-none ${srFlipped ? 'border-[#E8192C]/30 bg-white dark:bg-slate-900' : 'border-slate-200 dark:border-slate-800/50 bg-white dark:bg-slate-900 hover:border-[#E8192C]/20'
              }`}
          >
            {/* Background Hint Icons on Drag */}
            {srFlipped && (
              <>
                <div className="absolute inset-y-0 left-0 w-24 bg-[#E8192C]/5 opacity-0 group-active:opacity-100 pointer-events-none" />
                <div className="absolute inset-y-0 right-0 w-24 bg-emerald-500/5 opacity-0 group-active:opacity-100 pointer-events-none" />
              </>
            )}

            {!srFlipped ? (
              <>
                <p className="text-4xl font-bold text-slate-900 dark:text-white mb-4 drop-">{card.word}</p>
                <button onClick={e => { e.stopPropagation(); speakWord(card.word); }}
                  className="px-4 py-2 rounded-xl bg-[#E8192C]/10 text-[#E8192C] text-sm font-bold hover:bg-[#E8192C]/20 transition-colors">
                  <VolumeLoudIcon className="w-4 h-4 inline mr-2" /> Talaffuzi
                </button>
                <div className="absolute bottom-6 inset-x-0 w-full text-center">
                  <p className="text-xs text-slate-500  font-medium tracking-wide uppercase">Bosib ma'nosini ko'ring</p>
                </div>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">{card.meaning}</p>

                <div className="absolute bottom-6 inset-x-0 px-6">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                    <span className="text-red-500/70 flex items-center gap-1">← Eslamadim</span>
                    <span className="text-slate-500 opacity-50 text-[10px]">Surib tanlang</span>
                    <span className="text-emerald-600/70 flex items-center gap-1">Esladim →</span>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </div>

        {srFlipped && (
          <div className="flex justify-center gap-4 mt-6">
            <button onClick={() => handleSrAnswer(false)} className="w-[140px] py-4 rounded-2xl bg-red-500/10 text-red-500 text-sm font-bold border-2 border-red-500/20 hover:bg-red-500/20 transition-colors">
              <CloseCircleIcon className="w-5 h-5 mx-auto mb-1" /> Uzr, topolmadim
            </button>
            <button onClick={() => handleSrAnswer(true)} className="w-[140px] py-4 rounded-2xl bg-emerald-500/10 text-emerald-600 text-sm font-bold border-2 border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">
              <CheckCircleIcon className="w-5 h-5 mx-auto mb-1" /> Esladim!
            </button>
          </div>
        )}
      </div>
    );
  }

  // ===== MATCH GAME =====
  if (mode === 'match') {
    const allMatched = matchMatched.size === matchPairs.length / 2;
    if (allMatched) {
      const seconds = (matchTime / 1000).toFixed(1);
      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <TrainerHeader title="So'z Juftlash" onBack={() => setMode('menu')} onClose={onClose} />
          <div className="space-y-6 text-center py-12">
            <CupIcon className="w-16 h-16 text-amber-500 mx-auto" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Ajoyib!</h2>
            <p className="text-slate-500">{matchScore} ta juft, {seconds} soniyada</p>
            <div className="flex gap-3 justify-center">
              {challengeStage === 2 ? (
                <button
                  onClick={() => {
                    const stats = { stage: "So'z Juftlash", score: matchPairs.length / 2, total: matchPairs.length / 2 };
                    setChallengeScores(prev => [...prev, stats]);
                    setChallengeStage(3);
                    startTrueFalse(challengeWords);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#E8192C] text-white text-sm font-medium "
                >
                  Keyingi bosqich: True/False →
                </button>
              ) : (
                <>
                  <button onClick={() => startMatch(activePool)} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-medium hover:bg-slate-100 dark:bg-slate-800">Qayta o'ynash</button>
                  <button onClick={() => setMode('menu')} className="px-5 py-2.5 rounded-xl bg-[#E8192C] text-white text-sm font-medium">Menyuga</button>
                </>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        <TrainerHeader title="So'z Juftlash" onBack={() => setMode('menu')} onClose={onClose} />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white text-center">So'z va ma'nosini juftlang</h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {matchPairs.map(item => {
            const isMatched = matchMatched.has(item.pairId);
            const isSelected = matchSelected === item.id;
            const isWrong = matchWrong === item.id;
            const isWord = item.type === 'word';
            return (
              <motion.button key={item.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => !isMatched && handleMatchClick(item)}
                className={`p-3 rounded-xl text-xs font-medium min-h-[70px] transition-all border-2 ${isMatched ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 opacity-60' :
                    isWrong ? 'bg-red-500/15 border-red-500/30 text-red-500 animate-shake' :
                      isSelected ? 'bg-[#E8192C]/15 border-[#E8192C]/40 text-[#E8192C]' :
                        isWord
                          ? 'bg-[#E8192C]/5 border-[#E8192C]/20 text-slate-900 dark:text-white font-bold hover:border-[#E8192C]/40 hover:bg-[#E8192C]/10'
                          : 'bg-blue-500/5 border-blue-500/20 text-slate-500 italic hover:border-blue-500/40 hover:bg-blue-500/10'
                  }`}>
                {isWord && <span className="block text-[9px] text-[#E8192C]/60 mb-0.5 not-italic font-normal">so'z</span>}
                {!isWord && <span className="block text-[9px] text-blue-500/60 mb-0.5 not-italic font-normal">ma'no</span>}
                {item.text}
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  }

  // ===== SPEED QUIZ =====
  if (mode === 'speed') {
    if (!speedActive && speedAnswer !== null) {
      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <TrainerHeader title="Tezkor Viktorina" onBack={() => setMode('menu')} onClose={onClose} />
          <div className="space-y-6 text-center py-12">
            <BoltIcon className="w-16 h-16 text-amber-500 mx-auto" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Natija</h2>
            <p className="text-4xl font-bold text-[#E8192C]">{speedScore}/{speedWords.length}</p>
            <p className="text-sm text-slate-500">{Math.round((speedScore / speedWords.length) * 100)}% to'g'ri</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => startSpeed(activePool)} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-medium hover:bg-slate-100 dark:bg-slate-800">Qayta o'ynash</button>
              <button onClick={() => setMode('menu')} className="px-5 py-2.5 rounded-xl bg-[#E8192C] text-white text-sm font-medium">Menyuga</button>
            </div>
          </div>
        </div>
      );
    }

    if (speedIndex >= speedWords.length) {
      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <TrainerHeader title="Tezkor Viktorina" onBack={() => setMode('menu')} onClose={onClose} />
          <div className="space-y-6 text-center py-12">
            <BoltIcon className="w-16 h-16 text-amber-500 mx-auto" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Natija</h2>
            <p className="text-4xl font-bold text-[#E8192C]">{speedScore}/{speedWords.length}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => startSpeed(activePool)} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-medium hover:bg-slate-100 dark:bg-slate-800">Qayta</button>
              <button onClick={() => setMode('menu')} className="px-5 py-2.5 rounded-xl bg-[#E8192C] text-white text-sm font-medium">Menyuga</button>
            </div>
          </div>
        </div>
      );
    }

    const currentWord = speedWords[speedIndex];
    const correctMeaning = currentWord.meaning.split('—')[0].trim().slice(0, 50);

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        <TrainerHeader title="Tezkor Viktorina" onBack={() => setMode('menu')} onClose={onClose} />

        {/* Timer bar */}
        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <motion.div key={speedIndex} initial={{ width: '100%' }} animate={{ width: '0%' }}
            transition={{ duration: 10, ease: 'linear' }}
            className={`h-full rounded-full ${speedTimer > 5 ? 'bg-[#E8192C]' : speedTimer > 2 ? 'bg-amber-500' : 'bg-red-500'}`} />
        </div>
        <p className={`text-center text-lg font-bold ${speedTimer <= 3 ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>{speedTimer}s</p>

        <div className="text-center py-4">
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{currentWord.word}</p>
          <button onClick={() => speakWord(currentWord.word)} className="mt-2 text-xs text-[#E8192C] hover:underline">
            <VolumeLoudIcon className="w-3 h-3 inline mr-1" /> Tinglash
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {speedOptions.map((opt, i) => {
            const isCorrect = opt === correctMeaning;
            const isSelected = speedAnswer === opt;
            return (
              <button key={i} onClick={() => !speedAnswer && handleSpeedAnswer(opt)}
                disabled={!!speedAnswer}
                className={`p-4 rounded-xl text-sm text-left border transition-all ${speedAnswer
                    ? isCorrect ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600' :
                      isSelected ? 'bg-red-500/15 border-red-500/30 text-red-500' :
                        'border-slate-200 dark:border-slate-800 text-slate-500 opacity-50'
                    : 'border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white hover:border-[#E8192C]/30'
                  }`}>
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ===== SPELLING BEE =====
  if (mode === 'spelling') {
    if (spellIndex >= spellWords.length) {
      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <TrainerHeader title="Imlo Sinovi" onBack={() => setMode('menu')} onClose={onClose} />
          <div className="space-y-6 text-center py-12">
            <Hash className="w-16 h-16 text-emerald-600 mx-auto" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Imlo sinovi tugadi!</h2>
            <p className="text-4xl font-bold text-[#E8192C]">{spellScore}/{spellWords.length}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => startSpelling(activePool)} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-medium hover:bg-slate-100 dark:bg-slate-800">Qayta</button>
              <button onClick={() => setMode('menu')} className="px-5 py-2.5 rounded-xl bg-[#E8192C] text-white text-sm font-medium">Menyuga</button>
            </div>
          </div>
        </div>
      );
    }

    const currentSpell = spellWords[spellIndex];
    const hintText = currentSpell.word.slice(0, 2) + '_ '.repeat(currentSpell.word.length - 2);

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        <TrainerHeader title="Imlo Sinovi" onBack={() => setMode('menu')} onClose={onClose} />

        <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${((spellIndex + 1) / spellWords.length) * 100}%` }} />
        </div>

        <div className="rounded-2xl p-8  text-center space-y-4">
          <p className="text-xs text-slate-500">Bu so'zni eshitib yozing</p>
          <button onClick={() => speakWord(currentSpell.word)}
            className="w-16 h-16 rounded-full bg-[#E8192C]/10 text-[#E8192C] mx-auto flex items-center justify-center hover:bg-[#E8192C]/20 transition-colors">
            <VolumeLoudIcon className="w-8 h-8" />
          </button>
          <p className="text-sm text-slate-500">{currentSpell.meaning.split('—')[0].trim()}</p>
          {spellHint && <p className="text-xs text-blue-500 font-mono">{hintText}</p>}

          {spellResult === null ? (
            <div className="space-y-3">
              <input type="text" value={spellInput} onChange={e => setSpellInput(e.target.value)}
                placeholder="So'zni yozing..."
                onKeyDown={e => e.key === 'Enter' && spellInput.trim() && checkSpelling()}
                autoFocus
                className="w-full bg-slate-100 dark:bg-slate-800 rounded-lg px-4 py-3 text-center text-lg font-mono text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:border-[#E8192C] focus:outline-none" />
              <div className="flex gap-2 justify-center">
                <button onClick={() => setSpellHint(true)} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-500 hover:bg-slate-100 dark:bg-slate-800">
                  Maslahat
                </button>
                <button onClick={checkSpelling} disabled={!spellInput.trim()}
                  className="px-6 py-2 rounded-lg bg-[#E8192C] text-white text-sm font-medium disabled:opacity-50">
                  Tekshirish
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className={`rounded-lg p-4 ${spellResult === 'correct' ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                <p className={`font-medium ${spellResult === 'correct' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {spellResult === 'correct' ? '🎉 To\'g\'ri!' : '😔 Noto\'g\'ri'}
                </p>
                {spellResult === 'wrong' && (
                  <p className="text-sm text-slate-900 dark:text-white mt-1">To'g'ri javob: <strong>{currentSpell.word}</strong></p>
                )}
              </div>

              {spellResult === 'wrong' && currentSpell.memory_trick && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 text-left mb-3">
                  <p className="text-[10px] font-semibold text-blue-500 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                    <CpuIcon className="w-3.5 h-3.5" /> Eslab qolish usuli
                  </p>
                  <p className="text-xs text-slate-900 dark:text-white leading-relaxed italic">"{currentSpell.memory_trick}"</p>
                </motion.div>
              )}

              <button onClick={spellIndex + 1 < spellWords.length ? nextSpelling : () => setMode('menu')}
                className="px-6 py-2.5 rounded-lg bg-[#E8192C] text-white text-sm font-medium">
                {spellIndex + 1 < spellWords.length ? 'Keyingi' : 'Tugatish'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===== HANGMAN =====
  if (mode === 'hangman' && hangWord) {
    const wordLower = hangWord.word.toLowerCase();
    const won = wordLower.split('').every(ch => ch === ' ' || ch === '-' || hangGuessed.has(ch));
    const lost = hangWrong >= MAX_WRONG;
    const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');

    // Hangman figure parts
    const parts = [
      <circle key="head" cx="150" cy="60" r="15" className="stroke-foreground fill-none" strokeWidth="2" />,
      <line key="body" x1="150" y1="75" x2="150" y2="120" className="stroke-foreground" strokeWidth="2" />,
      <line key="larm" x1="150" y1="85" x2="125" y2="105" className="stroke-foreground" strokeWidth="2" />,
      <line key="rarm" x1="150" y1="85" x2="175" y2="105" className="stroke-foreground" strokeWidth="2" />,
      <line key="lleg" x1="150" y1="120" x2="130" y2="150" className="stroke-foreground" strokeWidth="2" />,
      <line key="rleg" x1="150" y1="120" x2="170" y2="150" className="stroke-foreground" strokeWidth="2" />,
    ];

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        <div className="flex items-center justify-between">
          <button onClick={() => setMode('menu')} className="text-sm text-slate-500 hover:text-slate-900 dark:text-white">← Orqaga</button>
          <span className="text-xs text-slate-500">Score: {hangScore}/{hangTotal}</span>
        </div>

        <div className="rounded-2xl p-6 ">
          {/* Hangman SVG */}
          <div className="flex justify-center mb-4">
            <svg width="200" height="170" viewBox="0 0 200 170">
              {/* Gallows */}
              <line x1="40" y1="160" x2="160" y2="160" className="stroke-muted-foreground" strokeWidth="2" />
              <line x1="60" y1="160" x2="60" y2="20" className="stroke-muted-foreground" strokeWidth="2" />
              <line x1="60" y1="20" x2="150" y2="20" className="stroke-muted-foreground" strokeWidth="2" />
              <line x1="150" y1="20" x2="150" y2="45" className="stroke-muted-foreground" strokeWidth="2" />
              {/* Body parts */}
              {parts.slice(0, hangWrong)}
            </svg>
          </div>

          {/* Hint: meaning */}
          <p className="text-center text-sm text-slate-500 mb-4">
            <span className="text-xs">Maslahat:</span> {hangWord.meaning.split('—')[0].trim()}
          </p>

          {/* Word display */}
          <div className="flex justify-center gap-2 mb-6 flex-wrap">
            {hangWord.word.split('').map((ch, i) => {
              const isSpace = ch === ' ' || ch === '-';
              const guessed = hangGuessed.has(ch.toLowerCase());
              const show = isSpace || guessed || lost;
              return (
                <span key={i} className={`w-8 h-10 flex items-center justify-center text-lg font-bold border-b-2 ${isSpace ? 'border-transparent' : lost && !guessed ? 'border-red-500/50 text-red-500' : 'border-[#E8192C]/50 text-slate-900 dark:text-white'
                  }`}>
                  {show ? ch : ''}
                </span>
              );
            })}
          </div>

          {/* Result */}
          {(won || lost) && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className={`rounded-xl p-4 text-center mb-4 ${won ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
              <p className={`font-bold text-lg ${won ? 'text-emerald-600' : 'text-red-500'}`}>
                {won ? '🎉 Topdingiz!' : '💀 Yutqazdingiz!'}
              </p>
              <p className="text-sm text-slate-900 dark:text-white mt-1">{hangWord.word}</p>
              <button onClick={() => nextHangman(won)}
                className="mt-3 px-5 py-2 rounded-lg bg-[#E8192C] text-white text-sm font-medium">
                Keyingi so'z
              </button>
            </motion.div>
          )}

          {/* Keyboard */}
          {!won && !lost && (
            <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 max-w-md mx-auto">
              {alphabet.map(letter => {
                const used = hangGuessed.has(letter);
                const inWord = wordLower.includes(letter);
                return (
                  <button key={letter} onClick={() => !used && guessLetter(letter)}
                    disabled={used}
                    className={`w-10 h-10 sm:w-9 sm:h-9 rounded-lg text-sm font-semibold uppercase transition-all touch-manipulation ${used
                        ? inWord ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30' : 'bg-red-500/20 text-red-500/50 border border-red-500/20'
                        : 'border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white hover:border-[#E8192C]/40 hover:bg-[#E8192C]/10 active:bg-[#E8192C]/20'
                      }`}>
                    {letter}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-center gap-2 text-xs text-slate-500">
          <span>{MAX_WRONG - hangWrong} ta xato qoldi</span>
        </div>
      </div>
    );
  }

  // ===== FILL-IN-BLANK =====
  if (mode === 'fillin') {
    if (fillIndex >= fillWords.length) {
      return (
        <div className="space-y-6 text-center py-12">
          <StarsIcon className="w-16 h-16 text-blue-500 mx-auto" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Gap to'ldirish tugadi!</h2>
          <p className="text-4xl font-bold text-[#E8192C]">{fillScore}/{fillWords.length}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => startFillIn(activePool)} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-medium hover:bg-slate-100 dark:bg-slate-800">Qayta</button>
            <button onClick={() => setMode('menu')} className="px-5 py-2.5 rounded-xl bg-[#E8192C] text-white text-sm font-medium">Menyuga</button>
          </div>
        </div>
      );
    }

    const currentFill = fillWords[fillIndex];
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <button onClick={() => setMode('menu')} className="text-sm text-slate-500 hover:text-slate-900 dark:text-white">← Orqaga</button>
          <span className="text-xs text-slate-500">{fillIndex + 1}/{fillWords.length} | Score: {fillScore}</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
          <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${((fillIndex + 1) / fillWords.length) * 100}%` }} />
        </div>
        <div className="rounded-2xl p-8  text-center space-y-4">
          <p className="text-xs text-slate-500">Bo'sh joyni to'g'ri so'z bilan to'ldiring</p>
          <p className="text-lg text-slate-900 dark:text-white leading-relaxed">{fillSentence}</p>
          {fillResult === null ? (
            <div className="space-y-3">
              <input type="text" value={fillInput} onChange={e => setFillInput(e.target.value)}
                placeholder="So'zni yozing..."
                onKeyDown={e => e.key === 'Enter' && fillInput.trim() && checkFillIn()}
                autoFocus
                className="w-full bg-slate-100 dark:bg-slate-800 rounded-lg px-4 py-3 text-center text-lg font-mono text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:border-[#E8192C] focus:outline-none" />
              <button onClick={checkFillIn} disabled={!fillInput.trim()}
                className="px-6 py-2 rounded-lg bg-[#E8192C] text-white text-sm font-medium disabled:opacity-50">
                Tekshirish
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className={`rounded-lg p-4 ${fillResult === 'correct' ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                <p className={`font-medium ${fillResult === 'correct' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {fillResult === 'correct' ? '🎉 To\'g\'ri!' : '😔 Noto\'g\'ri'}
                </p>
                {fillResult === 'wrong' && <p className="text-sm text-slate-900 dark:text-white mt-1">To'g'ri javob: <strong>{currentFill.word}</strong></p>}
              </div>

              {fillResult === 'wrong' && currentFill.memory_trick && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 text-left mb-3">
                  <p className="text-[10px] font-semibold text-blue-500 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                    <CpuIcon className="w-3.5 h-3.5" /> Eslab qolish usuli
                  </p>
                  <p className="text-xs text-slate-900 dark:text-white leading-relaxed italic">"{currentFill.memory_trick}"</p>
                </motion.div>
              )}

              <button onClick={fillIndex + 1 < fillWords.length ? nextFillIn : () => setMode('menu')}
                className="px-6 py-2.5 rounded-lg bg-[#E8192C] text-white text-sm font-medium">
                {fillIndex + 1 < fillWords.length ? 'Keyingi' : 'Tugatish'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===== INTENSIVE MEMORIZE =====
  if (mode === 'memorize') {
    const currentMemo = memoQueue[memoIndex];
    if (!currentMemo) return null;

    return (
      <div className="w-full h-full bg-[#F8FAFC] text-slate-900 p-6 sm:p-8 space-y-6 overflow-y-auto scrollbar-thin">
        <div className="flex items-center justify-between">
          <button onClick={() => setMode('menu')} className="text-sm font-semibold text-slate-600 hover:text-slate-900">← Orqaga</button>
          <div className="flex gap-1.5">
            {memoQueue.map((item, i) => (
              <div key={i} className={`w-2 h-2 rounded-full ${i === memoIndex ? 'bg-[#E8192C]' : 'bg-slate-200'}`} />
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-8 text-center space-y-8 max-w-xl mx-auto">
          {memoPhase === 'study' ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-wide text-slate-500 font-bold">O'rganing</span>
                <h2 className="text-4xl font-bold text-[#E8192C]">{currentMemo.word.word}</h2>
                <p className="text-xl text-slate-900 dark:text-white font-medium">{currentMemo.word.meaning}</p>
              </div>

              <div className="flex justify-center gap-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className={`w-8 h-1.5 rounded-full ${i < currentMemo.mastery ? 'bg-emerald-500' : 'bg-slate-100 dark:bg-slate-800'}`} />
                ))}
              </div>

              <div className="flex flex-col gap-3">
                <button onClick={() => speakWord(currentMemo.word.word)} className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors flex items-center justify-center gap-2 text-sm font-medium">
                  <VolumeLoudIcon className="w-4 h-4" /> Talaffuzni eshitish
                </button>
                <button onClick={() => setMemoPhase('test')} className="p-4 rounded-xl bg-[#E8192C] text-white text-sm font-bold   transition-all">
                  Yodladim, tekshiramiz!
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-wide text-slate-500 font-bold">So'zni yozing</span>
                <p className="text-lg text-slate-900 dark:text-white font-medium">{currentMemo.word.meaning}</p>
              </div>

              {memoResult === null ? (
                <div className="space-y-4">
                  <input type="text" value={memoTyped} onChange={e => setMemoTyped(e.target.value)}
                    autoFocus
                    placeholder="So'zni kiriting..."
                    onKeyDown={e => e.key === 'Enter' && memoTyped.trim() && checkMemoTyped()}
                    className="w-full bg-slate-100 dark:bg-slate-800 text-2xl font-bold text-center p-4 rounded-2xl border-2 border-transparent focus:border-[#E8192C] focus:outline-none transition-all" />
                  <button onClick={checkMemoTyped} disabled={!memoTyped.trim()}
                    className="w-full p-4 rounded-xl bg-[#E8192C] text-white font-bold disabled:opacity-50">Tekshirish</button>
                </div>
              ) : (
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-6">
                  <div className={`p-6 rounded-2xl border-2 ${memoResult === 'correct' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                    <p className={`text-xl font-bold ${memoResult === 'correct' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {memoResult === 'correct' ? 'To\'g\'ri! 🎉' : 'Xato! 😔'}
                    </p>
                    <p className="text-lg font-bold mt-1">{currentMemo.word.word}</p>
                  </div>

                  {memoResult === 'wrong' && currentMemo.word.memory_trick && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ scale: 1, opacity: 1 }}
                      className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 text-left">
                      <p className="text-[10px] font-semibold text-blue-500 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                        <CpuIcon className="w-3.5 h-3.5" /> Eslab qolish usuli
                      </p>
                      <p className="text-xs text-slate-900 dark:text-white leading-relaxed italic">"{currentMemo.word.memory_trick}"</p>
                    </motion.div>
                  )}

                  <button onClick={memoResult === 'correct' ? handleMemoCorrect : handleMemoWrong}
                    className="w-full p-4 rounded-xl bg-foreground text-background font-bold">
                    Davom etish
                  </button>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===== AUDIO QUIZ =====
  if (mode === 'audioquiz') {
    if (audioIndex >= audioWords.length) {
      return (
        <div className="w-full h-full bg-[#F8FAFC] text-slate-900 p-6 sm:p-8 space-y-6 text-center py-12 overflow-y-auto scrollbar-thin">
          <VolumeLoudIcon className="w-16 h-16 text-purple-500 mx-auto" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Audio Quiz tugadi!</h2>
          <p className="text-4xl font-bold text-[#E8192C]">{audioScore}/{audioWords.length}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => startAudioQuiz(activePool)} className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium hover:bg-slate-100">Qayta</button>
            <button onClick={() => setMode('menu')} className="px-5 py-2.5 rounded-xl bg-[#E8192C] text-white text-sm font-medium">Menyuga</button>
          </div>
        </div>
      );
    }

    const currentAudio = audioWords[audioIndex];
    const correctMeaning = currentAudio.meaning.split('—')[0].trim().slice(0, 50);

    return (
      <div className="w-full h-full bg-[#F8FAFC] text-slate-900 p-6 sm:p-8 space-y-5 overflow-y-auto scrollbar-thin">
        <div className="flex items-center justify-between">
          <button onClick={() => setMode('menu')} className="text-sm font-semibold text-slate-600 hover:text-slate-900">← Orqaga</button>
          <span className="text-xs text-slate-500">{audioIndex + 1}/{audioWords.length} | Score: {audioScore}</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-purple-500 transition-all" style={{ width: `${((audioIndex + 1) / audioWords.length) * 100}%` }} />
        </div>
        <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-8 text-center space-y-6 max-w-xl mx-auto">
          <p className="text-xs text-slate-500">So'zni eshiting va to'g'ri ma'nosini tanlang</p>
          <button onClick={() => { speakWord(currentAudio.word); setAudioPlayed(true); }}
            className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center transition-all ${audioPlayed ? 'bg-[#E8192C]/20 text-[#E8192C]' : 'bg-[#E8192C] text-white '
              }`}>
            <VolumeLoudIcon className="w-10 h-10" />
          </button>
          {!audioPlayed && <p className="text-xs text-slate-500">Eshitish uchun bosing ↑</p>}
          {audioPlayed && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {audioOptions.map((opt, i) => {
                const isCorrect = opt === correctMeaning;
                const isSelected = audioAnswer === opt;
                return (
                  <button key={i} onClick={() => !audioAnswer && handleAudioAnswer(opt)}
                    disabled={!!audioAnswer}
                    className={`p-4 rounded-xl text-sm text-left border transition-all ${audioAnswer
                        ? isCorrect ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600' :
                          isSelected ? 'bg-red-500/15 border-red-500/30 text-red-500' :
                            'border-slate-200 dark:border-slate-800 text-slate-500 opacity-50'
                        : 'border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white hover:border-[#E8192C]/30'
                      }`}>
                    {opt}
                  </button>
                );
              })}
            </div>
          )}
          {audioAnswer && (
            <button onClick={audioIndex + 1 < audioWords.length ? nextAudioQuestion : () => setMode('menu')}
              className="px-6 py-2.5 rounded-lg bg-[#E8192C] text-white text-sm font-medium">
              {audioIndex + 1 < audioWords.length ? 'Keyingi' : 'Tugatish'}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ===== TRUE/FALSE GAME UI =====
  if (mode === 'truefalse') {
    if (tfIndex >= tfQueue.length && tfResult === null) {
      return (
        <div className="w-full h-full bg-[#F8FAFC] text-slate-900 p-6 sm:p-8 space-y-6 text-center py-12 overflow-y-auto scrollbar-thin">
          <CupIcon className="w-16 h-16 text-amber-500 mx-auto" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">O'yin tugadi!</h2>
          <p className="text-4xl font-bold text-[#E8192C]">{tfScore}/{tfQueue.length}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => startTrueFalse(activePool)} className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium hover:bg-slate-100">Qayta</button>
            <button onClick={() => setMode('menu')} className="px-5 py-2.5 rounded-xl bg-[#E8192C] text-white text-sm font-medium">Menyuga</button>
          </div>
        </div>
      );
    }

    const current = tfQueue[tfIndex];
    return (
      <div className="w-full h-full bg-[#F8FAFC] text-slate-900 p-6 sm:p-8 space-y-6 overflow-y-auto scrollbar-thin">
        <div className="flex items-center justify-between">
          <button onClick={() => setMode('menu')} className="text-sm font-semibold text-slate-600 hover:text-slate-900">← Orqaga</button>
          <span className="text-xs text-slate-500">{tfIndex + 1}/{tfQueue.length} | Score: {tfScore}</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${((tfIndex + 1) / tfQueue.length) * 100}%` }} />
        </div>

        <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-10 text-center space-y-8 relative overflow-hidden max-w-xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div key={tfIndex} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
              <div className="space-y-2 mb-8">
                <h3 className="text-4xl font-bold text-slate-900 dark:text-white">{current?.word}</h3>
                <div className="w-12 h-1 bg-[#E8192C]/20 mx-auto rounded-full" />
              </div>

              <div className="py-6 border-y border-slate-200 dark:border-slate-800/50">
                <p className="text-xl text-slate-900 dark:text-white font-medium">{current?.meaning}</p>
              </div>

              <div className="pt-8 flex gap-4">
                <button
                  onClick={() => tfResult === null && handleTrueFalse(false)}
                  disabled={tfResult !== null}
                  className={`flex-1 flex flex-col items-center gap-2 p-6 rounded-2xl border-2 transition-all ${tfResult !== null && !current.isCorrect ? 'bg-emerald-500/15 border-emerald-500 border-emerald-500/40 scale-105 z-10' :
                      tfResult === 'wrong' && tfLastChoice === false ? 'bg-red-500/15 border-red-500 border-red-500/40 scale-105 z-10' :
                        tfResult !== null ? 'opacity-40 grayscale-[0.5]' :
                          'bg-slate-100 dark:bg-slate-800/30 border-transparent hover:border-red-500 hover:bg-red-500/5'
                    }`}>
                  <CloseCircleIcon className="w-10 h-10 text-red-500" />
                  <span className="font-bold text-slate-900 dark:text-white">NOTO'G'RI</span>
                </button>
                <button
                  onClick={() => tfResult === null && handleTrueFalse(true)}
                  disabled={tfResult !== null}
                  className={`flex-1 flex flex-col items-center gap-2 p-6 rounded-2xl border-2 transition-all ${tfResult !== null && current.isCorrect ? 'bg-emerald-500/15 border-emerald-500 border-emerald-500/40 scale-105 z-10' :
                      tfResult === 'wrong' && tfLastChoice === true ? 'bg-red-500/15 border-red-500 border-red-500/40 scale-105 z-10' :
                        tfResult !== null ? 'opacity-40 grayscale-[0.5]' :
                          'bg-slate-100 dark:bg-slate-800/30 border-transparent hover:border-emerald-500 hover:bg-emerald-500/5'
                    }`}>
                  <CheckCircleIcon className="w-10 h-10 text-emerald-600" />
                  <span className="font-bold text-slate-900 dark:text-white">TO'G'RI</span>
                </button>
              </div>
            </motion.div>
          </AnimatePresence>

          {tfResult && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              className={`absolute bottom-0 left-0 right-0 p-3 text-center font-bold text-white ${tfResult === 'correct' ? 'bg-emerald-500' : 'bg-red-500'}`}>
              {tfResult === 'correct' ? 'Barakalla! 🎉' : `Xato! To'g'ri javob: ${current.realMeaning}`}
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  // ===== CHALLENGE RESULTS =====
  if (mode === 'challenge' && challengeStage === 5) {
    const totalScore = challengeScores.reduce((acc, s) => acc + s.score, 0);
    const totalPossible = challengeScores.reduce((acc, s) => acc + s.total, 0);
    const totalPercent = Math.round((totalScore / totalPossible) * 100);

    return (
      <div className="space-y-8 py-4">
        <div className="text-center space-y-4">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto">
            <CupIcon className="w-10 h-10 text-amber-500" />
          </motion.div>
          <div className="space-y-1">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Ajoyib Natija!</h2>
            <p className="text-slate-500">Marafonni muvaffaqiyatli tamomladingiz</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {challengeScores.map((s, i) => (
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              key={i}
              className="rounded-2xl p-4 flex items-center justify-between border border-[#E8192C]/10"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#E8192C]/10 flex items-center justify-center font-bold text-[#E8192C]">
                  {i + 1}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{s.stage}</p>
                  <div className="w-32 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-[#E8192C]" style={{ width: `${(s.score / s.total) * 100}%` }} />
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-[#E8192C]">{Math.round((s.score / s.total) * 100)}%</p>
                <p className="text-[10px] text-slate-500">{s.score} / {s.total} to'g'ri</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="rounded-2xl p-8 border-2 border-[#E8192C]/20 text-center space-y-4">
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Umumiy Ko'rsatkich</p>
          <p className="text-6xl font-bold text-[#E8192C]">{totalPercent}%</p>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => {
                setChallengeStage(null);
                setMode('menu');
              }}
              className="flex-1 py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
            >
              Menyuga qaytish
            </button>
            <button
              onClick={() => startChallenge(allWords)}
              className="flex-1 py-4 rounded-2xl bg-[#E8192C] text-white font-bold   transition-all"
            >
              Qayta o'ynash
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== VOCAB RUNNER MODE =====
  if (mode === 'runner') {
    return (
      <div className="w-full h-full p-0">
        <VocabRunnerGame
          words={runnerWords.length > 0 ? runnerWords : allWords}
          onBack={() => setMode('menu')}
          onUpdateMemory={(id, correct, level) => updateWordMemory(id, correct, level)}
        />
      </div>
    );
  }

  return null;
}