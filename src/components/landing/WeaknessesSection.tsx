import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function WeaknessesSection() {
  return (
    <section className="py-16 md:py-24 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

        {/* ── Top Header Row ────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start justify-between"
        >
          <div className="lg:col-span-7 space-y-5">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.15]">
              Imtihondan avval zaif tomonlaringizni kashf eting.
            </h2>
            <div>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 bg-[#E8192C] hover:bg-red-700 text-white font-bold text-xs sm:text-sm px-6 py-3.5 rounded-full shadow-lg shadow-red-500/20 hover:scale-105 active:scale-95 transition-all duration-300"
              >
                <span>Bepul boshlash</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 lg:pt-2">
            <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg font-medium leading-relaxed">
              Mavzu bo‘yicha aniqlik, boshqa o‘quvchilarga nisbatan sur'atingiz va vaqtni ko‘proq sarflayotgan qiyinlik darajalari — barchasi bir joyda.
            </p>
          </div>
        </motion.div>

        {/* ── Asymmetric 2-Column Split Grid ────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

          {/* ── LEFT COLUMN: Big Analytics Card (7 Cols) ──── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 bg-[#F8FAFC] dark:bg-slate-900/70 rounded-[32px] p-5 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-6"
          >
            
            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Zaif tomonlar.
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Haftalik faollik, mavzu bo‘yicha aniqlik va qiyinlik bo‘yicha vaqt taqsimoti.
              </p>
            </div>

            {/* Inner Mockup 1: Stacked Bar Chart with Smooth Scroll Animation */}
            <div className="bg-white dark:bg-slate-950 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-end justify-between h-36 pt-2 pl-6 pr-2 relative">
                {/* Y-axis gridlines & labels */}
                <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[9px] font-bold text-slate-400">
                  <span>80</span>
                  <span>60</span>
                  <span>40</span>
                  <span>20</span>
                  <span>0</span>
                </div>

                {/* Grid line dashes */}
                <div className="absolute left-6 right-0 top-1 border-b border-slate-100 dark:border-slate-800/60 pointer-events-none" />
                <div className="absolute left-6 right-0 top-1/4 border-b border-slate-100 dark:border-slate-800/60 pointer-events-none" />
                <div className="absolute left-6 right-0 top-2/4 border-b border-slate-100 dark:border-slate-800/60 pointer-events-none" />
                <div className="absolute left-6 right-0 top-3/4 border-b border-slate-100 dark:border-slate-800/60 pointer-events-none" />
                <div className="absolute left-6 right-0 bottom-0 border-b border-slate-200 dark:border-slate-700 pointer-events-none" />

                {/* 10 Stacked Bars (Bottom segment Red, Top segment Green) */}
                {[
                  { red: 40, green: 40 },
                  { red: 35, green: 30 },
                  { red: 45, green: 40 },
                  { red: 40, green: 50 },
                  { red: 38, green: 45 },
                  { red: 35, green: 65 },
                  { red: 38, green: 52 },
                  { red: 35, green: 72 },
                  { red: 32, green: 62 },
                  { red: 30, green: 82 },
                ].map((bar, idx) => (
                  <div key={idx} className="w-3.5 sm:w-4 flex flex-col items-center justify-end h-full z-10 gap-0.5">
                    {/* Green Top Segment */}
                    <motion.div
                      initial={{ height: "0%" }}
                      whileInView={{ height: `${bar.green}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.7, delay: 0.1 + idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
                      className="w-full bg-[#10B981] rounded-t-sm hover:brightness-110 transition-all cursor-pointer"
                    />
                    {/* Red Bottom Segment */}
                    <motion.div
                      initial={{ height: "0%" }}
                      whileInView={{ height: `${bar.red}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.7, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
                      className="w-full bg-[#E8192C] rounded-b-sm hover:brightness-110 transition-all cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Inner Mockup 2: Topic Accuracy & Time Breakdown Donut with Scroll Animations */}
            <div className="bg-white dark:bg-slate-950 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
              
              {/* Left: 3 Topic Accuracy Bars */}
              <div className="w-full md:w-3/5 space-y-3.5">
                {[
                  { name: "Ma'lumot va g'o...", count: "48 urinish", pct: "72%", red: "28%", green: "44%" },
                  { name: "Tuzilish", count: "41 urinish", pct: "58%", red: "42%", green: "16%" },
                  { name: "Grammatika", count: "36 urinish", pct: "81%", red: "19%", green: "62%" },
                ].map((topic, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-slate-900 dark:text-white truncate">{topic.name}</span>
                      <motion.span
                        initial={{ opacity: 0, scale: 0.5 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                        className="text-slate-900 dark:text-white font-extrabold"
                      >
                        {topic.pct}
                      </motion.span>
                    </div>
                    <p className="text-[9.5px] text-slate-400 font-medium -mt-0.5">{topic.count}</p>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                      <motion.div
                        initial={{ width: "0%" }}
                        whileInView={{ width: topic.red }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.2 + i * 0.1, ease: "easeOut" }}
                        className="h-full bg-[#E8192C]"
                      />
                      <motion.div
                        initial={{ width: "0%" }}
                        whileInView={{ width: topic.green }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.4 + i * 0.1, ease: "easeOut" }}
                        className="h-full bg-[#10B981]"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Right: Donut Chart & Legend */}
              <div className="w-full md:w-2/5 flex items-center justify-center gap-4 pl-0 md:pl-4 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 pt-4 md:pt-0">
                {/* SVG Donut with stroke animation */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="relative w-24 h-24 shrink-0 flex items-center justify-center"
                >
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="14.5" fill="none" stroke="#E2E8F0" strokeWidth="4" className="dark:stroke-slate-800" />
                    {/* Oson (Green) */}
                    <motion.circle
                      cx="18" cy="18" r="14.5" fill="none" stroke="#10B981" strokeWidth="4"
                      strokeDasharray="30 100"
                      initial={{ strokeDashoffset: 100 }}
                      whileInView={{ strokeDashoffset: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.4 }}
                    />
                    {/* O'rta (Amber) */}
                    <motion.circle
                      cx="18" cy="18" r="14.5" fill="none" stroke="#F59E0B" strokeWidth="4"
                      strokeDasharray="35 100"
                      initial={{ strokeDashoffset: 100 }}
                      whileInView={{ strokeDashoffset: -30 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.6 }}
                    />
                    {/* Qiyin (Red) */}
                    <motion.circle
                      cx="18" cy="18" r="14.5" fill="none" stroke="#E8192C" strokeWidth="4"
                      strokeDasharray="35 100"
                      initial={{ strokeDashoffset: 100 }}
                      whileInView={{ strokeDashoffset: -65 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.8 }}
                    />
                  </svg>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                    className="absolute text-center leading-none"
                  >
                    <p className="text-xs font-black text-slate-900 dark:text-white">2m 12s</p>
                    <p className="text-[8.5px] text-slate-400 font-bold mt-0.5">o'rtacha</p>
                  </motion.div>
                </motion.div>

                {/* Legend */}
                <div className="space-y-1.5 text-[10.5px] font-bold shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                    <span className="text-slate-500 dark:text-slate-400">Oson</span>
                    <span className="text-slate-900 dark:text-white font-extrabold ml-auto">46s</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                    <span className="text-slate-500 dark:text-slate-400">O'rta</span>
                    <span className="text-slate-900 dark:text-white font-extrabold ml-auto">1m 14s</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#E8192C]" />
                    <span className="text-slate-500 dark:text-slate-400">Qiyin</span>
                    <span className="text-slate-900 dark:text-white font-extrabold ml-auto">2m 52s</span>
                  </div>
                </div>
              </div>

            </div>

          </motion.div>

          {/* ── RIGHT COLUMN: 2 Stacked Cards (5 Cols) ────── */}
          <div className="lg:col-span-5 flex flex-col gap-6">

            {/* CARD 1 (Top Right): Sur'atingizni baholang */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="bg-[#F8FAFC] dark:bg-slate-900/70 rounded-[32px] p-5 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-5"
            >
              
              {/* Inner Mockup Box */}
              <div className="bg-white dark:bg-slate-950 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between h-36 relative pl-6 pr-2">
                  {/* Y-axis */}
                  <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[9px] font-bold text-slate-400">
                    <span>1:00</span>
                    <span>0:45</span>
                    <span>0:30</span>
                    <span>0:15</span>
                    <span>0:00</span>
                  </div>

                  {/* Horizontal grid lines */}
                  <div className="absolute left-6 right-0 top-1 border-b border-slate-100 dark:border-slate-800/60 pointer-events-none" />
                  <div className="absolute left-6 right-0 top-1/4 border-b border-slate-100 dark:border-slate-800/60 pointer-events-none" />
                  <div className="absolute left-6 right-0 top-2/4 border-b border-slate-100 dark:border-slate-800/60 pointer-events-none" />
                  <div className="absolute left-6 right-0 top-3/4 border-b border-slate-100 dark:border-slate-800/60 pointer-events-none" />

                  {/* Animated Range Pills & User Dots */}
                  {[
                    { rangeTop: '25%', rangeHeight: '40%', dotPos: '45%' },
                    { rangeTop: '30%', rangeHeight: '35%', dotPos: '50%' },
                    { rangeTop: '20%', rangeHeight: '50%', dotPos: '40%' },
                    { rangeTop: '15%', rangeHeight: '60%', dotPos: '30%' },
                    { rangeTop: '35%', rangeHeight: '30%', dotPos: '55%' },
                    { rangeTop: '20%', rangeHeight: '45%', dotPos: '42%' },
                    { rangeTop: '25%', rangeHeight: '40%', dotPos: '48%' },
                  ].map((item, idx) => (
                    <div key={idx} className="relative h-full w-2.5 flex items-center justify-center z-10">
                      <motion.div
                        initial={{ scaleY: 0 }}
                        whileInView={{ scaleY: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 + idx * 0.08 }}
                        style={{ top: item.rangeTop, height: item.rangeHeight, transformOrigin: "center" }}
                        className="absolute w-2 bg-[#E8192C]/20 dark:bg-[#E8192C]/30 rounded-full"
                      />
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.4 + idx * 0.08 }}
                        style={{ top: item.dotPos }}
                        className="absolute w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 bg-[#E8192C] shadow-sm"
                      />
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#E8192C]/30" />
                    <span>Platforma oralig'i</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full border-2 border-[#E8192C] bg-white dark:bg-slate-900" />
                    <span>Sizning vaqtingiz</span>
                  </div>
                </div>
              </div>

              {/* Bottom Info */}
              <div className="space-y-1">
                <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Sur'atingizni baholang.
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  Minglab o‘quvchilar bilan sur'atingizni taqqoslang.
                </p>
              </div>

            </motion.div>

            {/* CARD 2 (Bottom Right): Kunlik faoliyat */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="bg-[#F8FAFC] dark:bg-slate-900/70 rounded-[32px] p-5 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-5"
            >
              
              {/* Inner Mockup Box */}
              <div className="bg-white dark:bg-slate-950 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
                
                {/* Month headers */}
                <div className="flex justify-around text-[11px] font-extrabold text-slate-900 dark:text-white">
                  <span>Iyul</span>
                  <span>Avgust</span>
                </div>

                {/* Contribution Heatmap Grid with Staggered Tile Animations */}
                <div className="grid grid-cols-2 gap-4 justify-items-center">
                  {/* July grid */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      3, 4, 2, 4,
                      1, 4, 3, 2,
                      4, 2, 4, 4,
                      3, 4, 1, 4,
                    ].map((lvl, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: 0.1 + i * 0.03 }}
                        className={`w-3.5 h-3.5 rounded-[3px] transition-all hover:scale-125 cursor-pointer ${
                          lvl === 4
                            ? "bg-[#E8192C]"
                            : lvl === 3
                            ? "bg-[#E8192C]/70"
                            : lvl === 2
                            ? "bg-[#E8192C]/40"
                            : "bg-slate-100 dark:bg-slate-800"
                        }`}
                      />
                    ))}
                  </div>

                  {/* August grid */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      4, 3, 4, 4,
                      2, 4, 4, 3,
                      4, 1, 4, 4,
                      3, 4, 2, 1,
                    ].map((lvl, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: 0.3 + i * 0.03 }}
                        className={`w-3.5 h-3.5 rounded-[3px] transition-all hover:scale-125 cursor-pointer ${
                          lvl === 4
                            ? "bg-[#E8192C]"
                            : lvl === 3
                            ? "bg-[#E8192C]/70"
                            : lvl === 2
                            ? "bg-[#E8192C]/40"
                            : "bg-slate-100 dark:bg-slate-800"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Heatmap Legend */}
                <div className="flex items-center justify-end gap-1 text-[9.5px] font-bold text-slate-400 pt-1">
                  <span>Kam</span>
                  <span className="w-2.5 h-2.5 rounded-[2px] bg-slate-100 dark:bg-slate-800" />
                  <span className="w-2.5 h-2.5 rounded-[2px] bg-[#E8192C]/40" />
                  <span className="w-2.5 h-2.5 rounded-[2px] bg-[#E8192C]/70" />
                  <span className="w-2.5 h-2.5 rounded-[2px] bg-[#E8192C]" />
                  <span>Ko'p</span>
                </div>

              </div>

              {/* Bottom Info */}
              <div className="space-y-1">
                <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Kunlik faoliyat.
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  Har kunlik mashg‘ulotlaringiz vaqt o‘tishi bilan qanday o‘sishini kuzating.
                </p>
              </div>

            </motion.div>

            </div>

        </div>

      </div>
    </section>
  );
}
