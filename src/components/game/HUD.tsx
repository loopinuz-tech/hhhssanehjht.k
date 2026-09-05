import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, RotateCcw, Volume2, VolumeX, Magnet, 
  Trophy, ChevronLeft, Coins, Heart, Flame,
  Sun, Moon, Sunset, RefreshCw, Eye, EyeOff
} from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { useSwipeControls } from '@/hooks/useSwipeControls';
import { useEduCoin } from '@/hooks/useEduCoin';

interface Props {
  onBack: () => void;
}

export default function HUD({ onBack }: Props) {
  useSwipeControls();
  const { addEduCoins } = useEduCoin();
  const [eduCoinClaimed, setEduCoinClaimed] = useState(false);

  const currentWord = useGameStore(s => s.currentWord);
  const lives = useGameStore(s => s.lives);
  const streak = useGameStore(s => s.streak);
  const distance = useGameStore(s => s.distance);
  const coins = useGameStore(s => s.coins);
  const status = useGameStore(s => s.status);
  const speedMultiplier = useGameStore(s => s.speedMultiplier);
  const correctCount = useGameStore(s => s.correctCount);
  const totalAnswered = useGameStore(s => s.totalAnswered);
  const soundEnabled = useGameStore(s => s.soundEnabled);
  const heartDamaged = useGameStore(s => s.heartDamaged);

  const magnetCount = useGameStore(s => s.magnetCount);
  const isMagnetActive = useGameStore(s => s.isMagnetActive);
  const magnetTimeRemaining = useGameStore(s => s.magnetTimeRemaining);
  const streakBonusAlert = useGameStore(s => s.streakBonusAlert);

  const timeOfDayMode = useGameStore(s => s.timeOfDayMode);
  const toggleTimeOfDayMode = useGameStore(s => s.toggleTimeOfDayMode);
  const isFocusMode = useGameStore(s => s.isFocusMode);
  const toggleFocusMode = useGameStore(s => s.toggleFocusMode);

  const setSpeedMultiplier = useGameStore(s => s.setSpeedMultiplier);
  const togglePause = useGameStore(s => s.togglePause);
  const toggleSound = useGameStore(s => s.toggleSound);
  const activateMagnet = useGameStore(s => s.activateMagnet);
  const restart = useGameStore(s => s.restart);

  const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;

  const speak = (word: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(word);
      u.lang = 'en-US';
      u.rate = 0.85;
      window.speechSynthesis.speak(u);
    }
  };

  const earnedEduCoins = Math.floor(coins / 100);

  useEffect(() => {
    if (status === 'gameover' && coins >= 100 && !eduCoinClaimed) {
      const reward = Math.floor(coins / 100);
      if (reward > 0) {
        addEduCoins(reward, 'vocab_runner', `Vocab Runner 3D: ${coins} ta tanga mukofoti`);
      }
      setEduCoinClaimed(true);
    }
  }, [status, coins, eduCoinClaimed, addEduCoins]);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-2 sm:p-4 z-30 select-none font-sans text-slate-900 overflow-hidden">
      
      {/* Active Magnet Glow Screen Aura */}
      {isMagnetActive && (
        <div className="fixed inset-0 z-20 pointer-events-none border-4 border-purple-500/60 shadow-[inset_0_0_90px_rgba(168,85,247,0.4)] animate-pulse" />
      )}

      {/* Heart Damaged Flash Banner */}
      <AnimatePresence>
        {heartDamaged && (
          <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none p-4">
            <motion.div 
              initial={{ scale: 0.5, opacity: 0, y: 20 }}
              animate={{ scale: [0.9, 1.25, 1], opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: -20 }}
              transition={{ duration: 0.35 }}
              className="bg-rose-600/95 border-4 border-white text-white px-8 py-5 rounded-3xl shadow-2xl backdrop-blur-xl flex items-center gap-4 text-center"
            >
              <Heart className="w-12 h-12 fill-white text-white animate-ping" />
              <div>
                <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-wider flex items-center gap-2">
                  <Heart className="w-8 h-8 fill-white text-white animate-pulse" />
                  <span>-1 JON KAMAYDI!</span>
                </h3>
                <p className="text-xs font-bold text-rose-100 mt-0.5">Noto'g'ri darvoza yoki to'siq!</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Streak Milestone Bonus Alert */}
      <AnimatePresence>
        {streakBonusAlert && (
          <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none p-4">
            <motion.div 
              initial={{ scale: 0.5, opacity: 0, y: -20 }}
              animate={{ scale: [0.9, 1.2, 1], opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ duration: 0.35 }}
              className="bg-purple-700/95 border-4 border-amber-300 text-white px-8 py-6 rounded-3xl shadow-2xl backdrop-blur-xl flex items-center gap-4 text-center"
            >
              <Magnet className="w-14 h-14 text-amber-300 animate-bounce" />
              <div>
                <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-amber-300 flex items-center justify-center gap-2">
                  <Magnet className="w-8 h-8 text-amber-300 animate-spin" />
                  <span>{streakBonusAlert}</span>
                </h3>
                <p className="text-xs font-black text-purple-100 mt-1">Tangalar 10s davomida avtomatik yopishib keladi!</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── TOP HUD HEADER BAR ── */}
      <div className="pointer-events-auto flex flex-col gap-1.5 sm:gap-2 p-2 sm:p-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl border border-white/80 dark:border-slate-800 shadow-xl max-w-5xl mx-auto w-full">
        <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button 
              onClick={onBack}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all active:scale-95 border border-slate-200 dark:border-slate-700"
              title="Orqaga"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button 
              onClick={togglePause}
              className="p-1.5 sm:p-2 rounded-xl bg-amber-100 dark:bg-amber-500/20 hover:bg-amber-200 dark:hover:bg-amber-500/30 text-amber-800 dark:text-amber-300 transition-all active:scale-95 border border-amber-200 dark:border-amber-500/30"
              title={status === 'playing' ? "Pauza" : "Davom etish"}
            >
              {status === 'playing' ? <Pause className="w-4 h-4 sm:w-5 sm:h-5" /> : <Play className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
            <button 
              onClick={toggleSound}
              className={`p-1.5 sm:p-2 rounded-xl border transition-all active:scale-95 ${soundEnabled ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700'}`}
              title={soundEnabled ? "Ovoz o'chiq" : "Ovoz yoqiq"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
            
            {/* Day / Night Cycle Button */}
            <button
              onClick={toggleTimeOfDayMode}
              className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl border bg-slate-800 dark:bg-slate-950 text-amber-300 hover:bg-slate-900 transition-all active:scale-95 flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-black shadow-xs border-slate-700"
              title="Kun va Tun rejimini almashtirish"
            >
              {timeOfDayMode === 'day' && <Sun className="w-4 h-4 text-amber-400" />}
              {timeOfDayMode === 'sunset' && <Sunset className="w-4 h-4 text-pink-400" />}
              {timeOfDayMode === 'night' && <Moon className="w-4 h-4 text-sky-400" />}
              {timeOfDayMode === 'auto' && <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />}
              <span className="capitalize hidden xs:inline">{timeOfDayMode}</span>
            </button>

            {/* 1-Click Focus Mode Toggle */}
            <button
              onClick={toggleFocusMode}
              className={`px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl border transition-all active:scale-95 flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-black shadow-xs ${
                isFocusMode
                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title="Fokus rejim: yo'ldan tashqari bino va daraxtlarni yashirish/ko'rsatish"
            >
              {isFocusMode ? <EyeOff className="w-4 h-4 text-amber-300" /> : <Eye className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
              <span className="hidden xs:inline">{isFocusMode ? "Fokus Rejim" : "To'liq Shahar"}</span>
            </button>
          </div>

          {/* Speed Multiplier selector */}
          <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-100 dark:bg-slate-800 px-1.5 py-1 sm:px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[10px] sm:text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-bold hidden sm:inline">Tezlik:</span>
            <button 
              onClick={() => setSpeedMultiplier(0.7)} 
              className={`px-2 py-0.5 rounded-lg font-bold transition-all ${speedMultiplier === 0.7 ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
            >
              Sekin
            </button>
            <button 
              onClick={() => setSpeedMultiplier(1.0)} 
              className={`px-2 py-0.5 rounded-lg font-bold transition-all ${speedMultiplier === 1.0 ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
            >
              O'rta
            </button>
            <button 
              onClick={() => setSpeedMultiplier(1.5)} 
              className={`px-2 py-0.5 rounded-lg font-bold transition-all ${speedMultiplier === 1.5 ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
            >
              Tez
            </button>
          </div>

          {/* Player Stats */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <motion.div 
              animate={heartDamaged ? { scale: [1, 1.35, 1], x: [-6, 6, -4, 4, 0] } : {}}
              transition={{ duration: 0.4 }}
              className={`flex items-center gap-0.5 sm:gap-1 px-1.5 py-1 sm:px-2.5 rounded-xl border text-[10px] sm:text-xs font-black transition-colors ${heartDamaged ? 'bg-rose-500 text-white border-rose-600 shadow-lg' : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400'}`}
            >
              {[...Array(3)].map((_, i) => (
                <Heart key={i} className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${i < lives ? 'fill-rose-500 text-rose-500' : 'text-slate-300 dark:text-slate-600'}`} />
              ))}
            </motion.div>

            <div className="flex items-center gap-1 px-1.5 py-1 sm:px-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] sm:text-xs font-black">
              <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-emerald-500 text-emerald-500 animate-bounce" />
              <span>x{1 + Math.floor(streak / 3)}</span>
            </div>

            <button
              onClick={activateMagnet}
              disabled={magnetCount <= 0 || isMagnetActive}
              className={`flex items-center gap-1 px-1.5 py-1 sm:px-2.5 rounded-xl border text-[10px] sm:text-xs font-black transition-all active:scale-95 cursor-pointer ${
                isMagnetActive 
                  ? 'bg-purple-600 text-white border-purple-700 shadow-md animate-pulse'
                  : magnetCount > 0
                  ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-500/30 hover:bg-purple-200'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-60'
              }`}
            >
              <Magnet className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isMagnetActive ? 'animate-spin' : ''}`} />
              <span>{isMagnetActive ? `${Math.ceil(magnetTimeRemaining)}s` : magnetCount}</span>
            </button>
          </div>
        </div>

        {/* Current Target Word Bar */}
        {currentWord && (
          <div className="flex items-center justify-between bg-gradient-to-r from-indigo-950 via-purple-900 to-slate-900 text-white p-2 sm:p-3 rounded-xl shadow-lg border border-purple-500/40">
            <div className="flex items-center gap-2 sm:gap-3">
              <button 
                onClick={() => speak(currentWord.word)}
                className="p-1.5 sm:p-2 rounded-lg bg-white/15 hover:bg-white/25 transition-all text-amber-300"
                title="Talaffuz qilish"
              >
                <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <div>
                <p className="text-[9px] sm:text-[10px] font-extrabold uppercase text-purple-300 tracking-wider">Topiladigan So'z:</p>
                <h2 className="text-lg sm:text-2xl font-black text-amber-300 tracking-wide font-mono">
                  {currentWord.word}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 text-right">
              <div className="hidden xs:block">
                <p className="text-[9px] sm:text-[10px] font-extrabold uppercase text-purple-300 tracking-wider">Masofa:</p>
                <p className="text-sm sm:text-base font-black font-mono">{Math.floor(distance)}m</p>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5 bg-white/10 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-white/20">
                <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                <span className="font-black text-sm sm:text-lg text-amber-400 font-mono">{coins}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── OVERLAY SCREENS ── */}
      <div className="pointer-events-auto flex flex-col items-center gap-3 max-w-xl mx-auto w-full">
        {/* Game Over Modal */}
        <AnimatePresence>
          {status === 'gameover' && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 pointer-events-auto">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl border border-slate-100 dark:border-slate-800"
              >
                <div className="w-20 h-20 bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-rose-200 dark:border-rose-500/30">
                  <Trophy className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-1">O'YIN TUGADI!</h2>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6">Barakalla! Yaxshi harakat qildingiz.</p>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/60">
                    <p className="text-xs text-slate-400 font-bold uppercase">Bosib o'tilgan</p>
                    <p className="text-xl font-black text-indigo-600 dark:text-indigo-400">{Math.floor(distance)}m</p>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-500/10 p-3 rounded-2xl border border-amber-100 dark:border-amber-500/20">
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-bold uppercase">Yig'ilgan tanga</p>
                    <p className="text-xl font-black text-amber-600 dark:text-amber-400">{coins}</p>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-500/10 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-500/20">
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase">To'g'ri javoblar</p>
                    <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{correctCount} / {totalAnswered}</p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-500/10 p-3 rounded-2xl border border-purple-100 dark:border-purple-500/20">
                    <p className="text-xs text-purple-600 dark:text-purple-400 font-bold uppercase">Aniqlik</p>
                    <p className="text-xl font-black text-purple-600 dark:text-purple-400">{accuracy}%</p>
                  </div>
                </div>

                {earnedEduCoins > 0 && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-amber-500 to-yellow-400 rounded-2xl text-slate-900 font-bold shadow-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Coins className="w-6 h-6 text-slate-900 fill-slate-900" />
                      <span>EduCoins Mukofoti:</span>
                    </div>
                    <span className="text-2xl font-black">+{earnedEduCoins} EduCoin</span>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <button
                    onClick={onBack}
                    className="flex-1 py-3.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-slate-700 dark:text-slate-300 transition-all flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    <span>Menyu</span>
                  </button>
                  <button
                    onClick={restart}
                    className="flex-1 py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-black text-white transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-5 h-5" />
                    <span>Qayta boshlash</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Pause Modal */}
        <AnimatePresence>
          {status === 'paused' && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 pointer-events-auto">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl border border-slate-100 dark:border-slate-800"
              >
                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-200 dark:border-amber-500/30">
                  <Pause className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6">O'YIN PAUZADA</h2>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={togglePause}
                    className="py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-black text-white transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
                  >
                    <Play className="w-5 h-5" />
                    <span>Davom ettirish</span>
                  </button>
                  <button
                    onClick={restart}
                    className="py-3.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-slate-700 dark:text-slate-300 transition-all flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700"
                  >
                    <RotateCcw className="w-5 h-5" />
                    <span>Qayta boshlash</span>
                  </button>
                  <button
                    onClick={onBack}
                    className="py-3.5 px-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 font-bold text-rose-600 dark:text-rose-400 transition-all flex items-center justify-center gap-2 border border-rose-200 dark:border-rose-500/20"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    <span>Chiqish</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
