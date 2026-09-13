import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, RotateCcw, Trophy, Play } from 'lucide-react';

const OfflineGame = () => {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => Number(localStorage.getItem('fox_high_score') || 0));
  const [foxY, setFoxY] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [obstacles, setObstacles] = useState<{ id: number; x: number }[]>([]);
  
  const gameRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>();
  const lastTimeRef = useRef<number>();
  const obstacleIdRef = useRef(0);

  const GRAVITY = 0.6;
  const JUMP_FORCE = -12;
  const GROUND_Y = 0;
  const OBSTACLE_SPEED = 8;
  const SPAWN_RATE = 1500; // ms

  const jump = () => {
    if (gameState === 'playing' && !isJumping) {
      setIsJumping(true);
      let velocity = JUMP_FORCE;
      const jumpInterval = setInterval(() => {
        setFoxY(y => {
          const nextY = y + velocity;
          velocity += GRAVITY;
          if (nextY >= GROUND_Y) {
            clearInterval(jumpInterval);
            setIsJumping(false);
            return GROUND_Y;
          }
          return nextY;
        });
      }, 20);
    } else if (gameState !== 'playing') {
      startGame();
    }
  };

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setFoxY(0);
    setObstacles([]);
    obstacleIdRef.current = 0;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, isJumping]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    let lastSpawn = Date.now();
    const animate = (time: number) => {
      if (lastTimeRef.current !== undefined) {
        // Move obstacles
        setObstacles(prev => {
          const next = prev
            .map(o => ({ ...o, x: o.x - OBSTACLE_SPEED }))
            .filter(o => o.x > -50);
          
          // Collision Check
          const foxRect = { x: 50, y: GROUND_Y - foxY - 40, w: 40, h: 40 };
          for (const o of next) {
            if (o.x < 90 && o.x > 50 && foxY > -20) {
              setGameState('gameover');
              return prev;
            }
          }
          return next;
        });

        // Spawn obstacles
        if (Date.now() - lastSpawn > SPAWN_RATE + Math.random() * 1000) {
          setObstacles(prev => [...prev, { id: obstacleIdRef.current++, x: 800 }]);
          lastSpawn = Date.now();
        }

        setScore(s => s + 1);
      }
      lastTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState]);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('fox_high_score', score.toString());
    }
  }, [score, highScore]);

  return (
    <div className="fixed inset-0 z-[9999] bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-full text-sm font-black uppercase tracking-widest">
            <WifiOff className="w-4 h-4" /> Internet aloqasi yo'q
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Voy! Tarmoq uzildi.</h2>
          <p className="text-slate-500 font-medium">Internet qaytguncha Fox bilan bir oz o'ynab turing!</p>
        </div>

        <div 
          ref={gameRef}
          onClick={jump}
          className="relative w-full h-64 bg-slate-50 dark:bg-slate-900/50 rounded-[32px] border-b-4 border-slate-200 dark:border-slate-800 overflow-hidden cursor-pointer group"
        >
          {/* Background elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute bottom-0 w-full h-px bg-slate-900 dark:bg-white" />
          </div>

          {/* Fox Player */}
          <motion.div 
            className="absolute left-10 bottom-0 w-12 h-12 flex items-center justify-center"
            animate={{ y: foxY }}
            transition={{ type: 'spring', damping: 15, stiffness: 200 }}
          >
            <span className="text-4xl select-none" role="img" aria-label="Fox">🦊</span>
          </motion.div>

          {/* Obstacles */}
          {obstacles.map(o => (
            <div 
              key={o.id}
              className="absolute bottom-0 w-8 h-12 flex items-end justify-center"
              style={{ left: `${o.x}px` }}
            >
              <div className="w-4 h-8 bg-rose-500 rounded-t-lg" />
              <div className="absolute -top-4 w-6 h-6 bg-rose-400 rounded-full blur-lg opacity-20" />
            </div>
          ))}

          {/* UI Overlays */}
          <AnimatePresence>
            {gameState === 'idle' && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-white/40 dark:bg-black/40 backdrop-blur-sm"
              >
                <button className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xl shadow-emerald-500/30 hover:scale-110 active:scale-95 transition-all">
                  <Play className="w-8 h-8 fill-current" />
                </button>
                <p className="mt-4 text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Boshlash (Probeldan foydalaning)</p>
              </motion.div>
            )}

            {gameState === 'gameover' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-rose-500/10 backdrop-blur-md"
              >
                <h3 className="text-4xl font-black text-rose-500 mb-2">O'yin tugadi!</h3>
                <p className="text-slate-600 dark:text-slate-400 font-bold mb-6">Siz {score} ball to'pladingiz</p>
                <button 
                  onClick={(e) => { e.stopPropagation(); startGame(); }}
                  className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl"
                >
                  <RotateCcw className="w-4 h-4" /> Qayta urinish
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Score display */}
          <div className="absolute top-6 right-8 flex items-center gap-6">
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">High Score</p>
              <div className="flex items-center gap-1.5 justify-end">
                <Trophy className="w-3 h-3 text-amber-500" />
                <p className="text-lg font-black text-slate-400">{highScore}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Score</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white leading-none">{score}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-8 pt-4">
          <div className="text-center md:hidden">
            <kbd className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-black text-slate-500 border-b-4 border-slate-200 dark:border-slate-700">Tap</kbd>
            <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Sakrash</p>
          </div>
          <div className="text-center hidden md:block">
            <kbd className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-black text-slate-500 border-b-4 border-slate-200 dark:border-slate-700">Space</kbd>
            <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Sakrash</p>
          </div>
          <div className="text-center hidden md:block">
            <kbd className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-black text-slate-500 border-b-4 border-slate-200 dark:border-slate-700">Click</kbd>
            <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Boshlash</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfflineGame;
