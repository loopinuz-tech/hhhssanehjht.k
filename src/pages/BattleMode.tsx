import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Swords, Zap, Users, Trophy, Star, Crown, Flame, Shield,
  Clock, Target, TrendingUp, ChevronRight, Play, Lock,
  Award, Medal, Sparkles, Globe, Heart, BarChart3,
  ArrowRight, Timer, Hash, Radio
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_LEADERBOARD = [
  { rank: 1, name: "Azizbek Karimov", wins: 142, elo: 2340, badge: "🏆", avatar: "AK", color: "from-amber-400 to-orange-500" },
  { rank: 2, name: "Malika Yusupova", wins: 128, elo: 2198, badge: "🥈", avatar: "MY", color: "from-slate-400 to-slate-500" },
  { rank: 3, name: "Bobur Toshmatov", wins: 115, elo: 2071, badge: "🥉", avatar: "BT", color: "from-orange-400 to-amber-600" },
  { rank: 4, name: "Zulfiya Abdullayeva", wins: 98, elo: 1965, badge: "4", avatar: "ZA", color: "from-indigo-400 to-purple-500" },
  { rank: 5, name: "Jasurbek Normatov", wins: 87, elo: 1843, badge: "5", avatar: "JN", color: "from-emerald-400 to-teal-500" },
];

const MOCK_ACHIEVEMENTS = [
  { id: 1, icon: "⚔️", title: "Birinchi g'alaba", desc: "Birinchi jangni yuting", done: true, progress: 1, total: 1 },
  { id: 2, icon: "🔥", title: "10 ta g'alaba", desc: "10 ta jang yuting", done: true, progress: 10, total: 10 },
  { id: 3, icon: "👑", title: "50 ta g'alaba", desc: "50 ta jang yuting", done: false, progress: 23, total: 50 },
  { id: 4, icon: "🏆", title: "Battle Afsonasi", desc: "100 ta jang yuting", done: false, progress: 23, total: 100 },
  { id: 5, icon: "⚡", title: "Tez o'q", desc: "30 soniyada javob bering", done: false, progress: 0, total: 1 },
  { id: 6, icon: "🎯", title: "Aniqlik ©", desc: "100% aniqlik bilan yuting", done: false, progress: 0, total: 1 },
];

const BATTLE_TYPES = [
  {
    id: "quick",
    icon: Zap,
    title: "Quick Battle",
    subtitle: "Tasodifiy raqib vs 10 savol",
    desc: "Darhol boshlang. Tasodifiy raqib bilan 10 ta savolda bellashing. 5 daqiqa vaqt.",
    color: "from-yellow-400 to-orange-500",
    shadow: "shadow-orange-500/30",
    glow: "rgba(249,115,22,0.3)",
    badge: "OMMABOP",
    badgeColor: "bg-orange-500",
    time: "5 daqiqa",
    questions: 10,
    route: "/battle/quick",
    online: 47,
  },
  {
    id: "friend",
    icon: Users,
    title: "Do'st Battle",
    subtitle: "Kod bilan do'stni taklif qiling",
    desc: "Maxsus kod yarating va do'stingizni taklif qiling. Istalgan fan va mavzuni tanlang.",
    color: "from-emerald-400 to-teal-500",
    shadow: "shadow-emerald-500/30",
    glow: "rgba(16,185,129,0.3)",
    badge: "YANGI",
    badgeColor: "bg-emerald-500",
    time: "Erkin",
    questions: "10-30",
    route: "/battle/friend",
    online: 23,
  },
  {
    id: "ranked",
    icon: Trophy,
    title: "Ranked Battle",
    subtitle: "Reyting uchun janging",
    desc: "Elo tizimi bo'yicha raqib topiladi. G'alaba — reyting oshadi, mag'lubiyat — tushadi.",
    color: "from-indigo-500 to-purple-600",
    shadow: "shadow-purple-500/30",
    glow: "rgba(99,102,241,0.3)",
    badge: "REYTING",
    badgeColor: "bg-indigo-500",
    time: "7 daqiqa",
    questions: 15,
    route: "/battle/ranked",
    online: 31,
  },
  {
    id: "tournament",
    icon: Crown,
    title: "Tournament",
    subtitle: "8/16/32 ishtirokchi playoff",
    desc: "Chorak final, yarim final, final. Faqat eng kuchlilar g'olib chiqadi. Har shanba.",
    color: "from-rose-500 to-pink-600",
    shadow: "shadow-pink-500/30",
    glow: "rgba(236,72,153,0.3)",
    badge: "HAFTALIK",
    badgeColor: "bg-rose-500",
    time: "1 soat",
    questions: "Playoff",
    route: "/battle/tournament",
    online: 128,
  },
];

// ─── Live Activity Feed ───────────────────────────────────────────────────────
const LIVE_FEED_DATA = [
  "Azizbek Matematikada g'alaba qozondi! 🏆",
  "Yangi rekord: Malika 2340 Elo!",
  "Tournament boshlanmoqda: 16 ishtirokchi",
  "Bobur 10 ta ketma-ket g'alaba!",
  "Zulfiya Biologiyada Quick Battle g'olibi!",
];

const LiveFeed = () => {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % LIVE_FEED_DATA.length), 3000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex items-center gap-2 overflow-hidden">
      <span className="flex items-center gap-1.5 shrink-0">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[11px] font-black text-emerald-600 uppercase tracking-widest">Live</span>
      </span>
      <AnimatePresence mode="wait">
        <motion.span
          key={idx}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="text-[12px] font-bold text-slate-600 dark:text-slate-300 truncate"
        >
          {LIVE_FEED_DATA[idx]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color, sub }: any) => (
  <div className="relative overflow-hidden rounded-3xl p-5 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-lg transition-all group">
    <div className={`absolute -right-6 -top-6 w-20 h-20 rounded-full opacity-10 group-hover:opacity-20 transition-opacity`} style={{ background: color }} />
    <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3 shadow-sm" style={{ background: color }}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div className="text-[24px] font-black text-slate-900 dark:text-white leading-none">{value}</div>
    <div className="text-[11px] font-black text-slate-500 uppercase tracking-widest mt-1">{label}</div>
    {sub && <div className="text-[11px] font-bold text-emerald-600 mt-0.5">{sub}</div>}
  </div>
);

// ─── Battle Mode Page ─────────────────────────────────────────────────────────
const BattleMode = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<"leaderboard" | "achievements">("leaderboard");
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const firstName = profile?.full_name?.split(" ")[0] || "O'quvchi";

  return (
    <div className="w-full px-3 sm:px-5 lg:px-6 pt-4 pb-24 sm:pb-8 space-y-5 overflow-y-auto">

      {/* ── HERO ── */}
      <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200/80"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)" }}>
        {/* Animated particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div key={i}
              className="absolute w-1 h-1 rounded-full bg-white/20"
              style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
              animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
              transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 3 }}
            />
          ))}
        </div>

        {/* Glow orbs */}
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl" />

        <div className="relative z-10 px-6 py-8 md:py-10">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[11px] font-black text-white/90 uppercase tracking-widest">
                  🎮 Battle Mode
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-[11px] font-black text-emerald-300 uppercase tracking-widest">
                  ● ONLINE
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter leading-tight mb-3">
                Bilimlar Jangi, <br />
                <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  {firstName}!
                </span>
              </h1>
              <p className="text-white/60 text-[14px] font-medium max-w-md mb-5">
                Real vaqt rejimida raqiblaringiz bilan bellashing. Reytingni oshiring va afsonaga aylaning.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate("/battle/quick")}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-2xl font-black text-[13px] shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-105 active:scale-95 transition-all"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  Quick Battle
                </button>
                <button
                  onClick={() => navigate("/battle/ranked")}
                  className="flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-2xl font-black text-[13px] hover:bg-white/20 active:scale-95 transition-all"
                >
                  <Trophy className="w-4 h-4" />
                  Ranked
                </button>
              </div>
            </div>

            {/* ELO Display */}
            <div className="flex flex-col items-center justify-center bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 text-center shrink-0 hidden sm:flex">
              <div className="text-[11px] font-black text-white/60 uppercase tracking-widest mb-1">Sizning ELO</div>
              <div className="text-[40px] font-black text-white leading-none">1200</div>
              <div className="text-[11px] font-black text-emerald-400 mt-1">▲ 54 bu hafta</div>
              <div className="mt-3 flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-3 h-3 ${i < 2 ? "text-yellow-400 fill-yellow-400" : "text-white/20"}`} />
                ))}
              </div>
              <div className="text-[11px] font-bold text-white/50 mt-1">Boshlang'ich daraja</div>
            </div>
          </div>

          {/* Live Activity */}
          <div className="mt-5 flex items-center gap-3 bg-white/5 backdrop-blur-md rounded-2xl px-4 py-2.5 border border-white/10">
            <Radio className="w-4 h-4 text-emerald-400 shrink-0" />
            <LiveFeed />
          </div>
        </div>
      </div>

      {/* ── QUICK STATS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={Swords} label="Jami Janglar" value="23" color="#6366f1" sub="+3 bu hafta" />
        <StatCard icon={Trophy} label="G'alabalar" value="15" color="#f59e0b" sub="65% win rate" />
        <StatCard icon={Flame} label="Seriya" value="4" color="#f97316" sub="Personal best: 7" />
        <StatCard icon={Shield} label="ELO Reyting" value="1200" color="#10b981" sub="▲ +54" />
      </div>

      {/* ── BATTLE TYPES GRID ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
            <Swords className="w-5 h-5 text-indigo-600" />
            Battle Turlari
          </h2>
          <span className="text-[11px] font-black text-slate-500">4 tur mavjud</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {BATTLE_TYPES.map((bt, i) => {
            const Icon = bt.icon;
            return (
              <motion.div
                key={bt.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                onHoverStart={() => setHoveredCard(bt.id)}
                onHoverEnd={() => setHoveredCard(null)}
                onClick={() => navigate(bt.route)}
                className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm cursor-pointer group"
                style={{ boxShadow: hoveredCard === bt.id ? `0 20px 60px -10px ${bt.glow}` : undefined }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.98 }}
              >
                {/* BG Gradient on hover */}
                <motion.div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: `linear-gradient(135deg, ${bt.color.replace("from-", "").replace(" to-", ", ")} 0%, transparent 60%)`.replace("from-", "").replace("to-", "") }}
                />
                <div className={`absolute inset-0 bg-gradient-to-br ${bt.color} opacity-0 group-hover:opacity-5 transition-opacity`} />

                <div className="relative z-10 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${bt.color} flex items-center justify-center shadow-lg ${bt.shadow}`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-lg">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {bt.online} online
                      </span>
                      <span className={`text-[10px] font-black text-white px-2.5 py-1 rounded-lg ${bt.badgeColor}`}>
                        {bt.badge}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-[17px] font-black text-slate-900 dark:text-white mb-1">{bt.title}</h3>
                  <p className="text-[12px] font-bold text-slate-500 mb-3">{bt.subtitle}</p>
                  <p className="text-[13px] text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">{bt.desc}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1.5 text-[12px] font-bold text-slate-500">
                        <Clock className="w-3.5 h-3.5" />
                        {bt.time}
                      </span>
                      <span className="flex items-center gap-1.5 text-[12px] font-bold text-slate-500">
                        <Hash className="w-3.5 h-3.5" />
                        {bt.questions} savol
                      </span>
                    </div>
                    <div className={`flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r ${bt.color} text-white text-[12px] font-black shadow-md group-hover:shadow-xl transition-all`}>
                      O'ynash
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── LEADERBOARD & ACHIEVEMENTS ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-4">

        {/* Leaderboard / Achievements Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          {/* Tabs */}
          <div className="flex items-center gap-0 border-b border-slate-100 dark:border-slate-800">
            {[
              { id: "leaderboard", label: "Global Reyting", icon: Globe },
              { id: "achievements", label: "Yutuqlar", icon: Award },
            ].map(tab => (
              <button key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-[13px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-slate-500 hover:text-slate-700"}`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-5">
            <AnimatePresence mode="wait">
              {activeTab === "leaderboard" ? (
                <motion.div key="lb" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-2">
                  {MOCK_LEADERBOARD.map((entry, i) => (
                    <motion.div key={entry.rank}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${i === 0 ? "bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50" : i === 1 ? "bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50" : i === 2 ? "bg-orange-50 dark:bg-orange-900/20 border border-orange-200/50" : "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800"}`}
                    >
                      <div className="text-[18px] font-black w-8 text-center shrink-0">{entry.badge}</div>
                      <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${entry.color} flex items-center justify-center text-white font-black text-[13px] shrink-0 shadow-md`}>
                        {entry.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-black text-slate-900 dark:text-white truncate">{entry.name}</p>
                        <p className="text-[11px] font-bold text-slate-500">{entry.wins} g'alaba</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[15px] font-black text-indigo-600">{entry.elo}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">ELO</div>
                      </div>
                    </motion.div>
                  ))}
                  <button onClick={() => navigate("/leaderboard")} className="w-full mt-3 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-[12px] font-black text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                    Barchasini ko'rish <ChevronRight className="w-4 h-4" />
                  </button>
                </motion.div>
              ) : (
                <motion.div key="ach" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {MOCK_ACHIEVEMENTS.map((ach, i) => (
                    <motion.div key={ach.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.04 }}
                      className={`relative overflow-hidden p-4 rounded-2xl border transition-all ${ach.done
                        ? "bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-200/60"
                        : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800"}`}
                    >
                      {ach.done && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center">
                          <span className="text-[10px] text-white">✓</span>
                        </div>
                      )}
                      <div className="text-[24px] mb-2">{ach.icon}</div>
                      <div className="text-[13px] font-black text-slate-900 dark:text-white">{ach.title}</div>
                      <div className="text-[11px] text-slate-500 mb-2">{ach.desc}</div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                          style={{ width: `${Math.min(100, (ach.progress / ach.total) * 100)}%` }}
                        />
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 mt-1">{ach.progress}/{ach.total}</div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: My Stats + Upcoming Tournament */}
        <div className="space-y-4">
          {/* My Battle Stats */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <h3 className="text-[13px] font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2 mb-5">
              <BarChart3 className="w-4 h-4 text-indigo-500" />
              Mening Statistikam
            </h3>
            <div className="space-y-4">
              {[
                { label: "Win Rate", value: 65, color: "#10b981" },
                { label: "Aniqlik (Accuracy)", value: 78, color: "#6366f1" },
                { label: "Tezlik (Avg)", value: 45, color: "#f59e0b", unit: "sek" },
              ].map(stat => (
                <div key={stat.label}>
                  <div className="flex justify-between text-[12px] font-black mb-1.5">
                    <span className="text-slate-700 dark:text-slate-300">{stat.label}</span>
                    <span style={{ color: stat.color }}>{stat.value}{stat.unit ?? "%"}</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${stat.value}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ background: stat.color }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              {[
                { label: "Umumiy", value: "23" },
                { label: "G'alaba", value: "15" },
                { label: "Mag'lubiyat", value: "8" },
              ].map(s => (
                <div key={s.label} className="bg-slate-50 dark:bg-slate-800 rounded-2xl py-3">
                  <div className="text-[18px] font-black text-slate-900 dark:text-white">{s.value}</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Next Tournament */}
          <div className="relative overflow-hidden rounded-3xl p-6 text-white"
            style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-8 -mt-8" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <Crown className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                <span className="text-[11px] font-black uppercase tracking-widest text-white/80">Keyingi Tournament</span>
              </div>
              <h3 className="text-[18px] font-black mb-2">Haftalik Grand Prix</h3>
              <p className="text-white/70 text-[12px] mb-4">16 ishtirokchi · Shanba 14:00 · Matematika</p>

              <div className="flex items-center gap-3 mb-4">
                <div className="bg-white/15 rounded-2xl px-4 py-2 text-center">
                  <div className="text-[20px] font-black">02</div>
                  <div className="text-[9px] text-white/60 uppercase">Kun</div>
                </div>
                <div className="text-white/40 font-black">:</div>
                <div className="bg-white/15 rounded-2xl px-4 py-2 text-center">
                  <div className="text-[20px] font-black">14</div>
                  <div className="text-[9px] text-white/60 uppercase">Soat</div>
                </div>
                <div className="text-white/40 font-black">:</div>
                <div className="bg-white/15 rounded-2xl px-4 py-2 text-center">
                  <div className="text-[20px] font-black">30</div>
                  <div className="text-[9px] text-white/60 uppercase">Daq</div>
                </div>
              </div>

              <button
                onClick={() => navigate("/battle/tournament")}
                className="w-full py-3 bg-white text-indigo-700 rounded-2xl font-black text-[13px] hover:bg-white/90 transition-all shadow-xl"
              >
                Ro'yxatdan o'tish →
              </button>
            </div>
          </div>

          {/* Recent Battles */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <h3 className="text-[13px] font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2 mb-4">
              <Timer className="w-4 h-4 text-rose-500" />
              So'nggi Janglar
            </h3>
            <div className="space-y-2.5">
              {[
                { opp: "Azizbek K.", result: "G'alaba", score: "8/10 vs 6/10", elo: "+18", win: true },
                { opp: "Malika Y.", result: "Mag'lubiyat", score: "5/10 vs 9/10", elo: "-12", win: false },
                { opp: "Bobur T.", result: "G'alaba", score: "10/10 vs 7/10", elo: "+22", win: true },
              ].map((battle, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-2xl border ${battle.win ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/30" : "bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800/30"}`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-[14px] ${battle.win ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"}`}>
                    {battle.win ? "W" : "L"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-black text-slate-900 dark:text-white">{battle.opp}</p>
                    <p className="text-[11px] text-slate-500 font-bold">{battle.score}</p>
                  </div>
                  <span className={`text-[13px] font-black ${battle.win ? "text-emerald-600" : "text-rose-600"}`}>
                    {battle.elo}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BattleMode;
