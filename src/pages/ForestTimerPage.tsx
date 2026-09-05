import { useState, useEffect, useRef } from "react";
import { TreePine, Sprout, TreeDeciduous, CloudRain, Wind, Waves } from "lucide-react";
import { ClockCircleIcon } from "@solar-icons/react/bold-duotone/clock-circle";
import { PlayCircleIcon } from "@solar-icons/react/bold-duotone/play-circle";
import { PauseCircleIcon } from "@solar-icons/react/bold-duotone/pause-circle";
import { VolumeLoudIcon } from "@solar-icons/react/bold-duotone/volume-loud";
import { VolumeCrossIcon } from "@solar-icons/react/bold-duotone/volume-cross";
import { StarsIcon } from "@solar-icons/react/bold-duotone/stars";
import { FlameIcon } from "@solar-icons/react/bold-duotone/flame";
import { CupIcon } from "@solar-icons/react/bold-duotone/cup";
import { GraphIcon } from "@solar-icons/react/bold-duotone/graph";
import { SettingsIcon } from "@solar-icons/react/bold-duotone/settings";
import { RestartIcon } from "@solar-icons/react/bold-duotone/restart";
import { BoltIcon } from "@solar-icons/react/bold-duotone/bolt";
import { CloseCircleIcon } from "@solar-icons/react/bold-duotone/close-circle";
import { TrashBinTrashIcon } from "@solar-icons/react/bold-duotone/trash-bin-trash";
import { FilterIcon } from "@solar-icons/react/bold-duotone/filter";
import { CompassBigIcon } from "@solar-icons/react/bold-duotone/compass-big";
import { Book2Icon } from "@solar-icons/react/bold-duotone/book-2";
import { GlobalIcon } from "@solar-icons/react/bold-duotone/global";
import { AtomIcon } from "@solar-icons/react/bold-duotone/atom";
import { BookMinimalisticIcon } from "@solar-icons/react/bold-duotone/book-minimalistic";
import { Pen2Icon } from "@solar-icons/react/bold-duotone/pen-2";
import { TargetIcon } from "@solar-icons/react/bold-duotone/target";
import ForestTree3D from "@/components/ForestTree3D";
import SEO from "@/components/SEO";
import { motion } from "framer-motion";

type TimerMode = "focus" | "short" | "long";
type AmbientType = "none" | "rain" | "wind" | "waves";

const MODES: Record<TimerMode, { label: string; defaultMins: number; color: string }> = {
  focus: {
    label: "Diqqat jamlash",
    defaultMins: 25,
    color: "#10b981",
  },
  short: {
    label: "Qisqa tanaffus",
    defaultMins: 5,
    color: "#0ea5e9",
  },
  long: {
    label: "Uzoq tanaffus",
    defaultMins: 15,
    color: "#8b5cf6",
  },
};

const SUBJECT_TAGS = [
  { id: "math", name: "Matematika", icon: CompassBigIcon, color: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" },
  { id: "native", name: "Ona tili / Adabiyot", icon: Book2Icon, color: "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800" },
  { id: "english", name: "Ingliz tili / IELTS", icon: GlobalIcon, color: "bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800" },
  { id: "physics", name: "Fizika / Kimyo", icon: AtomIcon, color: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800" },
  { id: "reading", name: "Kitob mutolaasi", icon: BookMinimalisticIcon, color: "bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-800" },
  { id: "writing", name: "Yozma topshiriqlar", icon: Pen2Icon, color: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800" },
  { id: "general", name: "Boshqa mashg'ulot", icon: TargetIcon, color: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-700" },
];

const TREE_STAGES = [
  { minProgress: 0, label: "Urug' tuproqqa ekildi", emoji: "🌰", sub: "Diqqatni buzmay davom eting..." },
  { minProgress: 20, label: "Kichik yashil nihol", emoji: "🌱", sub: "Ildiz otmoqda..." },
  { minProgress: 45, label: "Yosh maysa va yaproqlar", emoji: "🌿", sub: "O'sish sur'ati a'lo!" },
  { minProgress: 75, label: "Barqurgan shoxli daraxt", emoji: "🌳", sub: "Daraxt deyarli tayyor!" },
  { minProgress: 100, label: "Bahaybat o'rmon daraxti", emoji: "🌲", sub: "Ajoyib natija! O'rmon boyidi 🎉" },
];

interface Session {
  id: string;
  mode: TimerMode;
  duration: number; // in minutes
  completed: boolean;
  timestamp: string;
  dateStr: string;
  treeStage: string;
  tag: string;
}

// Procedural Web Audio API Sound Generator
class AmbientSoundEngine {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private gainNode: GainNode | null = null;
  private currentType: AmbientType = "none";

  start(type: AmbientType, volume: number = 0.25) {
    this.stop();
    if (type === "none") return;

    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const bufferSize = 2 * this.ctx.sampleRate;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.11;
        b6 = white * 0.115926;
      }

      this.noiseNode = this.ctx.createBufferSource();
      this.noiseNode.buffer = noiseBuffer;
      this.noiseNode.loop = true;

      this.filterNode = this.ctx.createBiquadFilter();
      if (type === "rain") {
        this.filterNode.type = "lowpass";
        this.filterNode.frequency.value = 1100;
      } else if (type === "wind") {
        this.filterNode.type = "bandpass";
        this.filterNode.frequency.value = 450;
        this.filterNode.Q.value = 2.5;
      } else if (type === "waves") {
        this.filterNode.type = "lowpass";
        this.filterNode.frequency.value = 550;
      }

      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);

      this.noiseNode.connect(this.filterNode);
      this.filterNode.connect(this.gainNode);
      this.gainNode.connect(this.ctx.destination);

      this.noiseNode.start();
      this.currentType = type;
    } catch (e) {
      console.warn("Ambient sound engine error:", e);
    }
  }

  setVolume(volume: number) {
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);
    }
  }

  stop() {
    if (this.noiseNode) {
      try { this.noiseNode.stop(); } catch {}
      this.noiseNode.disconnect();
      this.noiseNode = null;
    }
    if (this.ctx) {
      try { this.ctx.close(); } catch {}
      this.ctx = null;
    }
    this.currentType = "none";
  }

  getType() {
    return this.currentType;
  }
}

const ambientAudio = new AmbientSoundEngine();

function playCompletionChime() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.18, ctx.currentTime + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.55);
    });
  } catch (e) {
    console.warn("Audio chime error:", e);
  }
}

export default function ForestTimerPage() {
  const [mode, setMode] = useState<TimerMode>("focus");
  const [selectedTag, setSelectedTag] = useState("math");
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem("forest_timer_settings");
      return saved ? JSON.parse(saved) : { focus: 25, short: 5, long: 15 };
    } catch {
      return { focus: 25, short: 5, long: 15 };
    }
  });

  const [totalSeconds, setTotalSeconds] = useState(settings.focus * 60);
  const [remaining, setRemaining] = useState(settings.focus * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [ambientType, setAmbientType] = useState<AmbientType>("none");
  const [ambientVolume, setAmbientVolume] = useState(0.3);

  const [showSettings, setShowSettings] = useState(false);
  const [showGiveUpModal, setShowGiveUpModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"timer" | "forest" | "stats">("timer");

  const [tempSettings, setTempSettings] = useState({ focus: 25, short: 5, long: 15 });

  const [sessions, setSessions] = useState<Session[]>(() => {
    try {
      const saved = localStorage.getItem("forest_timer_sessions");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [streak, setStreak] = useState<number>(() => {
    try {
      return Number(localStorage.getItem("forest_timer_streak") || "0");
    } catch {
      return 0;
    }
  });

  const intervalRef = useRef<any>(null);

  const progress = totalSeconds > 0 ? Math.min(100, Math.max(0, ((totalSeconds - remaining) / totalSeconds) * 100)) : 0;
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  const currentStage = [...TREE_STAGES].reverse().find((s) => progress >= s.minProgress) || TREE_STAGES[0];

  useEffect(() => {
    try {
      localStorage.setItem("forest_timer_sessions", JSON.stringify(sessions));
      localStorage.setItem("forest_timer_streak", String(streak));
      localStorage.setItem("forest_timer_settings", JSON.stringify(settings));
    } catch (e) {
      console.warn("LocalStorage save error:", e);
    }
  }, [sessions, streak, settings]);

  useEffect(() => {
    if (isRunning && ambientType !== "none") {
      ambientAudio.start(ambientType, ambientVolume);
    } else {
      ambientAudio.stop();
    }
    return () => ambientAudio.stop();
  }, [isRunning, ambientType]);

  useEffect(() => {
    ambientAudio.setVolume(ambientVolume);
  }, [ambientVolume]);

  const healthyTrees = sessions.filter((s) => s.completed && s.mode === "focus").length;
  const witheredTrees = sessions.filter((s) => !s.completed && s.mode === "focus").length;
  const totalFocusMinutes = sessions.filter((s) => s.mode === "focus" && s.completed).reduce((acc, s) => acc + s.duration, 0);

  useEffect(() => {
    if (isRunning && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining((r) => {
          if (r <= 1) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            handleSessionComplete();
            return 0;
          }
          return r - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, remaining]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space") {
        e.preventDefault();
        handleToggle();
      } else if (e.code === "KeyR" && !isRunning) {
        e.preventDefault();
        handleReset();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRunning, remaining, mode, settings]);

  const handleSessionComplete = () => {
    if (soundEnabled) playCompletionChime();
    const todayStr = new Date().toISOString().split("T")[0];
    const newSession: Session = {
      id: Date.now().toString(),
      mode,
      duration: Math.round(totalSeconds / 60),
      completed: true,
      timestamp: new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }),
      dateStr: todayStr,
      treeStage: currentStage.label,
      tag: selectedTag,
    };
    setSessions((prev) => [newSession, ...prev]);
    if (mode === "focus") setStreak((s) => s + 1);
  };

  const handleModeChange = (newMode: TimerMode) => {
    if (isRunning && mode === "focus") {
      setShowGiveUpModal(true);
      return;
    }
    clearInterval(intervalRef.current);
    setMode(newMode);
    const mins = settings[newMode];
    setTotalSeconds(mins * 60);
    setRemaining(mins * 60);
    setIsRunning(false);
  };

  const handleReset = () => {
    if (isRunning && mode === "focus") {
      setShowGiveUpModal(true);
      return;
    }
    clearInterval(intervalRef.current);
    setRemaining(totalSeconds);
    setIsRunning(false);
  };

  const confirmGiveUp = () => {
    clearInterval(intervalRef.current);
    const todayStr = new Date().toISOString().split("T")[0];
    const failedSession: Session = {
      id: Date.now().toString(),
      mode,
      duration: Math.round((totalSeconds - remaining) / 60),
      completed: false,
      timestamp: new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }),
      dateStr: todayStr,
      treeStage: "Qurigan daraxt 🥀",
      tag: selectedTag,
    };
    setSessions((prev) => [failedSession, ...prev]);
    setIsRunning(false);
    setRemaining(totalSeconds);
    setShowGiveUpModal(false);
  };

  const handleToggle = () => {
    if (!isRunning && remaining === 0) {
      const mins = settings[mode];
      setTotalSeconds(mins * 60);
      setRemaining(mins * 60);
    }
    setIsRunning(!isRunning);
  };

  const handleSaveSettings = () => {
    setSettings({ ...tempSettings });
    const mins = tempSettings[mode];
    setTotalSeconds(mins * 60);
    setRemaining(mins * 60);
    setIsRunning(false);
    setShowSettings(false);
  };

  const clearHistory = () => {
    if (window.confirm("Barcha saqlangan o'rmon va taymer tarixini o'chirmoqchimisiz?")) {
      setSessions([]);
      setStreak(0);
    }
  };

  // SVG ring dimensions
  const radius = 118;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const currentModeInfo = MODES[mode];
  const activeTagInfo = SUBJECT_TAGS.find((t) => t.id === selectedTag) || SUBJECT_TAGS[0];

  return (
    <>
      <SEO title="Daraxt Taymeri — EduContest Focus" description="Diqqatni jamlash va virtual o'rmon o'stirish taymeri" />

      <div className="w-full min-h-screen bg-white dark:bg-[#0a0f1a] text-slate-900 dark:text-slate-100 transition-colors pb-24 font-sans">

        <div className="w-full px-4 sm:px-8 pt-6 space-y-6">

          {/* HEADER BAR */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 p-2.5">
                <ClockCircleIcon size={24} />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight flex items-center gap-2.5 text-slate-900 dark:text-white">
                  Daraxt Taymeri
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1 shadow-2xs">
                    <StarsIcon size={12} className="text-emerald-500" /> FOCUS
                  </span>
                </h1>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Diqqatni jamlang, o'quv mashg'ulotingiz davomida o'rmoningizni gullating
                </p>
              </div>
            </div>

            {/* QUICK STATS & CONTROLS */}
            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
                <FlameIcon size={16} className="text-orange-500" />
                <span>{streak} kun</span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
                <ClockCircleIcon size={16} className="text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">{healthyTrees}</span>
                {witheredTrees > 0 && <span className="text-rose-500 text-[10px] ml-0.5">({witheredTrees})</span>}
              </div>

              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 text-slate-600 dark:text-slate-400 transition-all"
                title={soundEnabled ? "Ovoz yoniq" : "Ovoz o'chirilgan"}
              >
                {soundEnabled ? <VolumeLoudIcon size={16} className="text-emerald-500" /> : <VolumeCrossIcon size={16} className="text-slate-400" />}
              </button>

              <button
                onClick={() => { setTempSettings({ ...settings }); setShowSettings(true); }}
                className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 text-slate-600 dark:text-slate-400 transition-all"
                title="Sozlamalar"
              >
                <SettingsIcon size={16} />
              </button>
            </div>
          </div>

          {/* PAGE NAVIGATION TABS */}
          <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto">
            <button
              onClick={() => setActiveTab("timer")}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
                activeTab === "timer"
                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                  : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
              }`}
            >
              <BoltIcon size={16} /> Taymer
            </button>

            <button
              onClick={() => setActiveTab("forest")}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
                activeTab === "forest"
                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                  : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
              }`}
            >
              <TreeDeciduous className="w-4 h-4" /> O'rmon ({healthyTrees})
            </button>

            <button
              onClick={() => setActiveTab("stats")}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
                activeTab === "stats"
                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                  : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
              }`}
            >
              <GraphIcon size={16} /> Statistika
            </button>
          </div>

          {/* TAB CONTENT: 1. TIMER & GROWING */}
          {activeTab === "timer" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

              {/* MAIN CENTER TIMER CARD (8 COLS) */}
              <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-lg flex flex-col items-center justify-center space-y-6 relative overflow-hidden">
                
                {/* AMBIENT LIGHT DECORATION */}
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full blur-3xl opacity-10 transition-all duration-700 pointer-events-none"
                  style={{ backgroundColor: currentModeInfo.color }}
                />

                {/* MODE SELECTION SWITCHER */}
                <div className="w-full max-w-md p-1 rounded-xl bg-slate-100 dark:bg-slate-800 flex gap-1">
                  {(Object.keys(MODES) as TimerMode[]).map((m) => {
                    const active = mode === m;
                    const modeObj = MODES[m];
                    return (
                      <button
                        key={m}
                        onClick={() => handleModeChange(m)}
                        className={`flex-1 py-2 rounded-lg text-xs font-extrabold transition-all ${
                          active
                            ? "bg-emerald-500 text-white shadow-md"
                            : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        {modeObj.label}
                      </button>
                    );
                  })}
                </div>

                {/* SUBJECT/TASK SELECTION PILLS */}
                {mode === "focus" && (
                  <div className="w-full max-w-xl space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center flex items-center justify-center gap-1.5">
                      <FilterIcon size={14} />
                      <span>Mashg'ulot turini tanlang:</span>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {SUBJECT_TAGS.map((tag) => {
                        const isSelected = selectedTag === tag.id;
                        return (
                          <button
                            key={tag.id}
                            disabled={isRunning}
                            onClick={() => setSelectedTag(tag.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                              isSelected
                                ? "bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-500/40 shadow-xs"
                                : "bg-emerald-50/50 dark:bg-slate-950/40 text-slate-600 dark:text-slate-400 border-emerald-200/80 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-slate-700"
                            } ${isRunning ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                          >
                            <tag.icon size={14} className="shrink-0" />
                            <span>{tag.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* SLEEK SVG CIRCULAR TIMER & VISUAL STAGE DISPLAY */}
                <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center select-none my-2">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 280 280">
                    {/* Outer Track Ring */}
                    <circle
                      cx="140"
                      cy="140"
                      r={radius}
                      className="stroke-emerald-100 dark:stroke-slate-950"
                      strokeWidth="12"
                      fill="transparent"
                    />
                    {/* Inner Accent Ring */}
                    <circle
                      cx="140"
                      cy="140"
                      r={radius}
                      className="stroke-emerald-200/60 dark:stroke-slate-800/80"
                      strokeWidth="12"
                      fill="transparent"
                    />
                    {/* Animated Progress Ring */}
                    <circle
                      cx="140"
                      cy="140"
                      r={radius}
                      stroke={currentModeInfo.color}
                      strokeWidth="12"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-500"
                    />
                  </svg>

                  {/* CENTER CONTENT inside Ring */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-2 p-4">
                    
                    {/* 3D TREE ANIMATION */}
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 25 }}
                      className="relative w-28 h-28 sm:w-32 sm:h-32"
                    >
                      <ForestTree3D progress={progress} />
                      {isRunning && progress >= 75 && (
                        <StarsIcon size={18} className="text-emerald-500 dark:text-emerald-400 absolute -top-1 -right-1 animate-pulse" />
                      )}
                    </motion.div>

                    {/* TIMER DIGITAL DISPLAY */}
                    <span className="text-3xl sm:text-4xl font-black tracking-tight tabular-nums text-slate-900 dark:text-white drop-shadow-sm font-mono">
                      {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                    </span>
                    
                    {/* STAGE & TASK LABEL */}
                    <div className="space-y-0.5">
                      <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1 tracking-wide">
                        <span>{currentStage.label}</span>
                      </div>
                      <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 opacity-90">
                        <activeTagInfo.icon size={13} className="text-emerald-500 dark:text-emerald-400 shrink-0" />
                        <span>{activeTagInfo.name}</span>
                      </p>
                    </div>

                  </div>
                </div>

                {/* TIMER CONTROL BUTTONS */}
                <div className="flex items-center gap-4 pt-2">
                  <button
                    onClick={handleReset}
                    className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-all active:scale-95"
                    title="Qayta tiklash (R)"
                  >
                    <RestartIcon size={20} />
                  </button>

                  <button
                    onClick={handleToggle}
                    className={`px-8 h-12 rounded-xl text-white text-xs font-black transition-all shadow-lg active:scale-95 flex items-center gap-2.5 ${
                      isRunning
                        ? "bg-amber-500 hover:bg-amber-400 shadow-amber-500/25"
                        : "bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/25"
                    }`}
                  >
                    {isRunning ? <PauseCircleIcon size={18} /> : <PlayCircleIcon size={18} />}
                    <span className="uppercase tracking-wider">{isRunning ? "Pauza" : "Boshlash"}</span>
                  </button>
                </div>

                {/* HELPER TEXT & KEYBOARD TIP */}
                <div className="text-center space-y-1">
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-1.5">
                    {isRunning ? (
                      <>
                        <FlameIcon size={14} className="text-emerald-500" />
                        Diqqatni buzmay davom eting. Daraxtingiz rivojlanmoqda!
                      </>
                    ) : (
                      "Taymerni boshlang va topshiriqqa sho'ng'ing!"
                    )}
                  </p>
                  <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1">
                    <StarsIcon size={12} className="text-slate-400" />
                    <span>Klaviaturadagi</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-mono text-[9px]">SPACE</kbd>
                    <span>tugmasini bosib boshqaring</span>
                  </p>
                </div>

              </div>

              {/* RIGHT SIDEBAR: AMBIENT SOUNDS & TODAY SUMMARY (4 COLS) */}
              <div className="lg:col-span-4 space-y-5">

                {/* AMBIENT NATURE SOUND ENGINE CARD */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-lg space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-2">
                      <Wind className="w-4 h-4 text-emerald-500" /> Fon Ovozlari
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                      AUDIO
                    </span>
                  </div>

                  {/* SOUND OPTIONS */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { type: "none", label: "O'chirilgan", icon: VolumeCrossIcon },
                      { type: "rain", label: "Yomg'ir", icon: VolumeLoudIcon },
                      { type: "wind", label: "O'rmon", icon: VolumeLoudIcon },
                      { type: "waves", label: "Daryo", icon: VolumeLoudIcon },
                    ].map((item) => {
                      const isSelected = ambientType === item.type;
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.type}
                          onClick={() => setAmbientType(item.type as AmbientType)}
                          className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 ${
                            isSelected
                              ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700"
                              : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                          }`}
                        >
                          <Icon size={16} className="text-emerald-500" />
                          <span className="text-xs font-bold">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* VOLUME SLIDER */}
                  {ambientType !== "none" && (
                    <div className="pt-2 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        <span>Ovoz balandligi:</span>
                        <span>{Math.round(ambientVolume * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.05"
                        max="0.8"
                        step="0.05"
                        value={ambientVolume}
                        onChange={(e) => setAmbientVolume(Number(e.target.value))}
                        className="w-full h-1.5 bg-emerald-100 dark:bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                    </div>
                  )}
                </div>

                {/* TODAY QUICK STATS CARD */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-lg space-y-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-2">
                    <CupIcon size={16} className="text-amber-500" /> Bugungi Natija
                  </h3>

                  <div className="space-y-2 text-xs font-bold">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <ClockCircleIcon size={14} className="text-emerald-500" /> Diqqat Vaqti
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">{totalFocusMinutes} daq</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <StarsIcon size={14} className="text-emerald-500" /> Daraxtlar
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">{healthyTrees} ta</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <CloseCircleIcon size={14} className="text-rose-500" /> Quriaganlar
                      </span>
                      <span className="text-rose-500 dark:text-rose-400 font-bold">{witheredTrees} ta</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB CONTENT: 2. VIRTUAL FOREST GARDEN */}
          {activeTab === "forest" && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-lg space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <TreePine className="w-5 h-5 text-emerald-500" /> Virtual O'rmonim
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Diqqatingiz har bir to'g'ri jamlaganingizda yangi daraxt ekiladi
                  </p>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold">
                  {sessions.length} ta seans
                </div>
              </div>

              {sessions.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 space-y-3">
                  <TreePine className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Hali daraxtlar yo'q</p>
                  <p className="max-w-xs mx-auto text-slate-500 dark:text-slate-400">
                    Taymerni boshlang va oxirigacha yetkazing!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                  {sessions.map((s, idx) => {
                    const tagObj = SUBJECT_TAGS.find((t) => t.id === s.tag) || SUBJECT_TAGS[0];
                    return (
                      <motion.div
                        key={s.id || idx}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: idx * 0.03 }}
                        className={`p-3 rounded-2xl border flex flex-col items-center justify-center text-center space-y-1.5 transition-all hover:scale-105 ${
                          s.completed
                            ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-500/30 shadow-xs"
                            : "bg-rose-50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-500/20 opacity-70"
                        }`}
                      >
                        <span className="text-3xl select-none">{s.completed ? "🌲" : "🥀"}</span>
                        <div className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 line-clamp-1">
                          {s.duration} daqiqa
                        </div>
                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <tagObj.icon size={10} /> {s.timestamp}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT: 3. STATS & HISTORY */}
          {activeTab === "stats" && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-lg space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <GraphIcon size={20} className="text-emerald-500" /> Statistika
                </h2>
                {sessions.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <TrashBinTrashIcon size={14} /> Tozalash
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Diqqat Vaqti</span>
                  <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{totalFocusMinutes} min</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Ketma-ketlik</span>
                  <p className="text-xl font-black text-orange-500 dark:text-orange-400 font-mono">{streak} kun</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Muvaffaqiyat</span>
                  <p className="text-xl font-black text-teal-600 dark:text-teal-400 font-mono">
                    {sessions.length > 0 ? Math.round((healthyTrees / sessions.length) * 100) : 0}%
                  </p>
                </div>
              </div>

              {/* DETAILED HISTORY LOG TABLE */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Taymer Tarixi
                </h3>

                {sessions.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">Hali seans yo'q.</p>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {sessions.map((s) => {
                        const tagObj = SUBJECT_TAGS.find((t) => t.id === s.tag) || SUBJECT_TAGS[0];
                        return (
                          <div key={s.id} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{s.completed ? "🌲" : "🥀"}</span>
                              <div>
                                <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                                  <span>{MODES[s.mode]?.label || "Seans"}</span>
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] border flex items-center gap-1 ${tagObj.color}`}>
                                    <tagObj.icon size={10} /> {tagObj.name}
                                  </span>
                                </div>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                  {s.dateStr} — {s.timestamp}
                                </span>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{s.duration} daq</span>
                              <p className={`text-[10px] font-bold ${s.completed ? "text-emerald-500" : "text-rose-500"}`}>
                                {s.completed ? "Tugallandi" : "Qurigan"}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* GIVE UP WARNING MODAL */}
      {showGiveUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowGiveUpModal(false)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-sm p-5 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/30 text-rose-500 flex items-center justify-center mx-auto text-2xl">
              🥀
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900 dark:text-white">Daraxtingizni quritmoqchimisiz?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                Taymerni to'xtatsangiz, daraxtingiz quriydi. Davom eting!
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowGiveUpModal(false)}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-black transition-all shadow-md active:scale-95"
              >
                Davom etish 🌲
              </button>
              <button
                onClick={confirmGiveUp}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-bold transition-all"
              >
                Tashlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TIMER SETTINGS MODAL */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowSettings(false)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-sm p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <SettingsIcon size={16} className="text-emerald-500" />
                Sozlamalar
              </h3>
              <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                <CloseCircleIcon size={18} className="text-slate-400" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-bold">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Diqqat (daqiqa):</span>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={tempSettings.focus}
                  onChange={(e) => setTempSettings({ ...tempSettings, focus: Number(e.target.value) })}
                  className="w-16 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center font-bold text-slate-900 dark:text-white text-xs"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Qisqa tanaffus (daq):</span>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={tempSettings.short}
                  onChange={(e) => setTempSettings({ ...tempSettings, short: Number(e.target.value) })}
                  className="w-16 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center font-bold text-slate-900 dark:text-white text-xs"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Uzoq tanaffus (daq):</span>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={tempSettings.long}
                  onChange={(e) => setTempSettings({ ...tempSettings, long: Number(e.target.value) })}
                  className="w-16 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center font-bold text-slate-900 dark:text-white text-xs"
                />
              </div>
            </div>

            <button
              onClick={handleSaveSettings}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-black transition-all shadow-md active:scale-95"
            >
              Saqlash
            </button>
          </div>
        </div>
      )}
    </>
  );
}
