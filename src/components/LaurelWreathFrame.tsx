import React from "react";
import { motion } from "framer-motion";
import { Star, CheckCircle, TrendingUp, Sparkles } from "lucide-react";

/* ── Mathematical C-Shaped Laurel Wreath SVG Component ───────
   - Base of every leaf touches the stem flush at (0,0)
   - Rotated along stem tangents (0 overlap, 0 floating detached leaves)
──────────────────────────────────────────────────────────── */
function LaurelBranch({ className = "w-32 h-80 text-amber-500/40" }: { className?: string }) {
  return (
    <svg viewBox="0 0 140 300" fill="currentColor" className={className}>
      <defs>
        {/* Leaf Pair Symbol - Base starts flush at (0,0) */}
        <g id="laurel-leaf-pair">
          {/* Left Leaf */}
          <path d="M 0 0 C -12 -8 -24 -22 -15 -32 C -4 -25 0 -12 0 0 Z" />
          {/* Right Leaf */}
          <path d="M 0 0 C 12 -8 24 -22 15 -32 C 4 -25 0 -12 0 0 Z" />
        </g>
        {/* Single Tip Leaf */}
        <path id="laurel-tip-leaf" d="M 0 0 C -6 -14 0 -28 0 -28 C 0 -28 6 -14 0 0 Z" />
      </defs>

      {/* Curved Central Stem */}
      <path
        d="M 82 275 C 15 215 15 70 72 15"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />

      {/* Leaf Pairs Rotated Along Stem Tangents */}
      <use href="#laurel-leaf-pair" transform="translate(82, 275) rotate(-46)" />
      <use href="#laurel-leaf-pair" transform="translate(62, 235) rotate(-35)" />
      <use href="#laurel-leaf-pair" transform="translate(42, 195) rotate(-22)" />
      <use href="#laurel-leaf-pair" transform="translate(28, 155) rotate(-8)" />
      <use href="#laurel-leaf-pair" transform="translate(27, 120) rotate(8)" />
      <use href="#laurel-leaf-pair" transform="translate(36, 82) rotate(24)" />
      <use href="#laurel-leaf-pair" transform="translate(52, 48) rotate(38)" />
      <use href="#laurel-leaf-pair" transform="translate(68, 24) rotate(48)" />

      {/* Top Stem Tip Leaf */}
      <use href="#laurel-tip-leaf" transform="translate(72, 15) rotate(52)" />
    </svg>
  );
}

export default function LaurelWreathFrame() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">

      {/* 1. Ambient Dual Soft Glow Blobs */}
      <div className="absolute top-[40%] left-8 -translate-y-1/2 w-[450px] h-[280px] bg-sky-400/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute top-[40%] right-8 -translate-y-1/2 w-[450px] h-[280px] bg-amber-500/10 blur-[100px] rounded-full pointer-events-none" />

      {/* 2. Left Gulchambar (C-Arc Branch) - Positioned closer to central text */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="absolute top-[10%] sm:top-[12%] md:top-[14%] left-[2%] sm:left-[6%] md:left-[10%] lg:left-[14%] xl:left-[17%] hidden sm:block z-0 opacity-75 dark:opacity-60"
      >
        <LaurelBranch className="w-20 h-56 sm:w-28 sm:h-72 lg:w-36 lg:h-96 text-amber-500/80 dark:text-amber-400/70" />
      </motion.div>

      {/* 3. Right Gulchambar (C-Arc Branch Flipped) - Positioned closer to central text */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="absolute top-[10%] sm:top-[12%] md:top-[14%] right-[2%] sm:right-[6%] md:right-[10%] lg:right-[14%] xl:right-[17%] hidden sm:block z-0 opacity-75 dark:opacity-60"
      >
        <LaurelBranch className="w-20 h-56 sm:w-28 sm:h-72 lg:w-36 lg:h-96 text-amber-500/80 dark:text-amber-400/70 transform scale-x-[-1]" />
      </motion.div>

      {/* 4. Top-Left Floating Badge */}
      <motion.div
        animate={{ y: [0, -8, 0], rotate: [-1.5, 1.5, -1.5] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-6 left-4 sm:left-8 lg:left-16 hidden md:flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-sky-100 dark:border-sky-900/40 shadow-xl backdrop-blur-md z-20 pointer-events-auto"
      >
        <div className="w-7 h-7 rounded-xl bg-sky-50 dark:bg-sky-950 flex items-center justify-center text-sky-600 shrink-0">
          <TrendingUp className="w-4 h-4" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-slate-900 dark:text-white leading-none">+23 Ball O'sish</p>
          <p className="text-[9px] text-slate-400 font-medium mt-0.5">3 oy ichida</p>
        </div>
      </motion.div>

      {/* 5. Bottom-Right Floating Badge */}
      <motion.div
        animate={{ y: [0, 8, 0], rotate: [1.5, -1.5, 1.5] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-6 right-4 sm:right-8 lg:right-16 hidden md:flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-emerald-100 dark:border-emerald-900/40 shadow-xl backdrop-blur-md z-20 pointer-events-auto"
      >
        <div className="w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 shrink-0">
          <CheckCircle className="w-4 h-4" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-slate-900 dark:text-white leading-none">Milliy Sertifikat</p>
          <p className="text-[9px] text-slate-400 font-medium mt-0.5">Muvaffaqiyatli topshirildi</p>
        </div>
      </motion.div>

      {/* 6. Floating Sparkles */}
      <motion.div
        animate={{ scale: [0.9, 1.2, 0.9], opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-6 right-1/3 hidden lg:block z-10"
      >
        <Sparkles className="w-5 h-5 text-amber-400/60" />
      </motion.div>
      <motion.div
        animate={{ scale: [1.1, 0.8, 1.1], opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        className="absolute bottom-6 left-1/3 hidden lg:block z-10"
      >
        <Star className="w-4 h-4 text-sky-400/50 fill-sky-400/20" />
      </motion.div>

    </div>
  );
}
