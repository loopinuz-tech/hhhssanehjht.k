import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { SquareAcademicCapIcon } from "@solar-icons/react/bold-duotone/square-academic-cap";
import { TargetIcon } from "@solar-icons/react/bold-duotone/target";
import { MedalRibbonStarIcon } from "@solar-icons/react/bold-duotone/medal-ribbon-star";
import { CalendarMarkIcon } from "@solar-icons/react/bold-duotone/calendar-mark";
import { MapPointIcon } from "@solar-icons/react/bold-duotone/map-point";
import { StarsIcon } from "@solar-icons/react/bold-duotone/stars";
import { AltArrowRightIcon } from "@solar-icons/react/bold-duotone/alt-arrow-right";
import { CheckCircleIcon } from "@solar-icons/react/bold-duotone/check-circle";
import { FireIcon } from "@solar-icons/react/bold-duotone/fire";
import { BookBookmarkIcon } from "@solar-icons/react/bold-duotone/book-bookmark";
import { CupIcon } from "@solar-icons/react/bold-duotone/cup";
import universitiesData from "@/pages/universitetlar.json";

export default function DreamUniversityLandingSection() {
  const allUnis = universitiesData as any[];

  // Selected preset filter category
  const [activeCategory, setActiveCategory] = useState<"top" | "grant" | "local" | "tech">("top");
  const [selectedUniSlug, setSelectedUniSlug] = useState<string>("mit");
  const [activeCardTab, setActiveCardTab] = useState<"requirements" | "grant" | "majors">("requirements");

  // Filtered universities based on preset category
  const categoryUnis = useMemo(() => {
    if (activeCategory === "top") {
      return allUnis.filter((u) => u.qs_rank && parseInt(u.qs_rank.replace("#", "")) <= 20).slice(0, 7);
    }
    if (activeCategory === "grant") {
      return allUnis.filter((u) => u.grant_type?.toLowerCase().includes("100%") || u.grant_type?.toLowerCase().includes("full")).slice(0, 7);
    }
    if (activeCategory === "local") {
      return allUnis.filter((u) => u.manzil?.includes("O'zbekiston") || u.qs_rank?.includes("Mahalliy")).slice(0, 7);
    }
    return allUnis.filter((u) => u.name.includes("Technology") || u.name.includes("Tech") || u.name.includes("Polytechnic") || u.name.includes("INHA") || u.name.includes("IIT")).slice(0, 7);
  }, [activeCategory, allUnis]);

  // Selected University Details
  const currentUni = useMemo(() => {
    return allUnis.find((u) => u.slug === selectedUniSlug) || categoryUnis[0] || allUnis[0];
  }, [selectedUniSlug, categoryUnis, allUnis]);

  return (
    <section className="w-full py-16 sm:py-24 relative overflow-hidden bg-slate-50/70 dark:bg-[#070b14]/90 text-slate-900 dark:text-white transition-colors border-y border-slate-200/80 dark:border-slate-800/80">
      {/* Background Cyber Mesh Glows */}
      <div className="absolute top-0 left-1/4 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-purple-500/10 dark:bg-purple-600/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-rose-500/10 dark:bg-[#E8192C]/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 dark:opacity-25 pointer-events-none" />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/20 dark:border-purple-500/30 text-xs font-black uppercase tracking-wider mb-4 shadow-xs"
          >
            <StarsIcon size={16} className="text-amber-500 dark:text-amber-400 animate-spin-slow" /> OTM Radar & Grant Navigator
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white"
          >
            Orzuingizdagi OTM va 100% Grant Radari
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xs sm:text-base text-slate-600 dark:text-slate-400 mt-3 font-medium max-w-2xl mx-auto leading-relaxed"
          >
            248 ta nufuzli OTMning qabul mezoni, minimal IELTS/SAT/DTM ballari hamda 100% bepul grant shartlarini bitta interaktiv kartada sinxronlang.
          </motion.p>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch w-full">
          
          {/* LEFT COLUMN: Category Selector & Interactive University List (5 cols) */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900/60 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-6 flex flex-col justify-between shadow-xl dark:shadow-2xl relative">
            <div>
              {/* Category Filter Chips */}
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <TargetIcon size={15} className="text-purple-600 dark:text-purple-400" /> Yo'nalish toifasini tanlang:
              </div>

              <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mb-4 sm:mb-5">
                <button
                  onClick={() => setActiveCategory("top")}
                  className={`py-2 px-1.5 sm:px-3 rounded-xl text-[11px] sm:text-xs font-extrabold transition-all flex items-center justify-center gap-1 sm:gap-1.5 border min-w-0 ${
                    activeCategory === "top"
                      ? "bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/30"
                      : "bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-400 border-slate-200/80 dark:border-slate-700/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800"
                  }`}
                >
                  <CupIcon size={14} className="shrink-0" />
                  <span className="truncate">Top 20 Global</span>
                </button>

                <button
                  onClick={() => setActiveCategory("grant")}
                  className={`py-2 px-1.5 sm:px-3 rounded-xl text-[11px] sm:text-xs font-extrabold transition-all flex items-center justify-center gap-1 sm:gap-1.5 border min-w-0 ${
                    activeCategory === "grant"
                      ? "bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30"
                      : "bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-400 border-slate-200/80 dark:border-slate-700/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800"
                  }`}
                >
                  <MedalRibbonStarIcon size={14} className="shrink-0" />
                  <span className="truncate">100% BEPUL Grant</span>
                </button>

                <button
                  onClick={() => setActiveCategory("tech")}
                  className={`py-2 px-1.5 sm:px-3 rounded-xl text-[11px] sm:text-xs font-extrabold transition-all flex items-center justify-center gap-1 sm:gap-1.5 border min-w-0 ${
                    activeCategory === "tech"
                      ? "bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/30"
                      : "bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-400 border-slate-200/80 dark:border-slate-700/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800"
                  }`}
                >
                  <FireIcon size={14} className="shrink-0" />
                  <span className="truncate">IT & Engineering</span>
                </button>

                <button
                  onClick={() => setActiveCategory("local")}
                  className={`py-2 px-1.5 sm:px-3 rounded-xl text-[11px] sm:text-xs font-extrabold transition-all flex items-center justify-center gap-1 sm:gap-1.5 border min-w-0 ${
                    activeCategory === "local"
                      ? "bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600/30"
                      : "bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-400 border-slate-200/80 dark:border-slate-700/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800"
                  }`}
                >
                  <SquareAcademicCapIcon size={14} className="shrink-0" />
                  <span className="truncate">Mahalliy OTMlar</span>
                </button>
              </div>

              {/* Interactive List of Universities in Category */}
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Universitetlar ({categoryUnis.length})</span>
                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-extrabold">Birini tanlang ↓</span>
              </div>

              <div className="space-y-2 max-h-[260px] sm:max-h-[310px] overflow-y-auto pr-1">
                {categoryUnis.map((u) => {
                  const isSelected = selectedUniSlug === u.slug;
                  return (
                    <motion.div
                      key={u.slug}
                      whileHover={{ x: 3 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedUniSlug(u.slug)}
                      className={`p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                        isSelected
                          ? "bg-purple-50 dark:bg-gradient-to-r dark:from-purple-900/60 dark:to-slate-900 border-purple-500 text-purple-950 dark:text-white shadow-md shadow-purple-500/10"
                          : "bg-slate-50 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 flex items-center justify-center shrink-0 shadow-xs">
                          <img src={u.logo_url} alt={u.name} className="w-full h-full object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/logo.png'; }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className={`text-xs font-extrabold truncate ${isSelected ? "text-purple-950 dark:text-white" : "text-slate-900 dark:text-slate-300"}`}>
                            {u.name}
                          </h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium mt-0.5 truncate">
                            <MapPointIcon size={11} className="text-amber-500 shrink-0" /> {u.manzil}
                          </p>
                        </div>
                      </div>

                      {isSelected ? (
                        <CheckCircleIcon size={20} className="text-purple-600 dark:text-purple-400 shrink-0" />
                      ) : (
                        <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 bg-slate-200/80 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-300/60 dark:border-slate-700 shrink-0">
                          {u.qs_rank || "OTM"}
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Counter Note */}
            <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
              <span className="flex items-center gap-1">
                <StarsIcon size={14} className="text-amber-500 dark:text-amber-400 shrink-0" /> Baza: 248 ta rasmiy OTM
              </span>
              <Link to="/universitetlar" className="text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-0.5 font-bold shrink-0">
                Barchasi <AltArrowRightIcon size={12} />
              </Link>
            </div>
          </div>

          {/* RIGHT COLUMN: Holographic Cyber University Card (7 cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-gradient-to-b dark:from-slate-900 dark:to-slate-950 border border-slate-200/80 dark:border-purple-500/30 rounded-3xl p-4 sm:p-6 flex flex-col justify-between shadow-xl dark:shadow-2xl relative overflow-hidden group">
            {/* Holographic Glowing Top Border */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-rose-500 to-amber-400" />
            <div className="absolute -right-16 -top-16 w-56 h-56 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

            <div>
              {/* Top Passport Badge */}
              <div className="flex items-center justify-between gap-2 mb-4 sm:mb-5 flex-wrap">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-300 bg-purple-500/10 dark:bg-purple-500/20 px-2 sm:px-2.5 py-1 rounded-lg border border-purple-500/20 dark:border-purple-500/30 flex items-center gap-1">
                    <StarsIcon size={12} className="text-purple-600 dark:text-purple-400 shrink-0" /> {currentUni.qs_rank ? `QS: ${currentUni.qs_rank}` : "Mahalliy OTM"}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 dark:bg-emerald-500/20 px-2 sm:px-2.5 py-1 rounded-lg border border-emerald-500/20 dark:border-emerald-500/30">
                    Sinxronlangan
                  </span>
                </div>

                <div className="text-[10px] sm:text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 sm:px-2.5 py-1 rounded-lg border border-amber-500/20 flex items-center gap-1">
                  <FireIcon size={14} className="shrink-0" /> Match: 98%
                </div>
              </div>

              {/* Main Uni Header */}
              <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-slate-100 dark:bg-white/10 backdrop-blur-md border border-slate-200 dark:border-white/20 p-1.5 sm:p-2 flex items-center justify-center shrink-0 shadow-md relative group-hover:scale-105 transition-transform">
                  <img src={currentUni.logo_url} alt={currentUni.name} className="w-full h-full object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/logo.png'; }} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-2xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                    {currentUni.name}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1 font-medium truncate">
                    <MapPointIcon size={14} className="text-amber-500 shrink-0" /> {currentUni.manzil}
                  </p>
                </div>
              </div>

              {/* Tabs Inside Card */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 mb-4 sm:mb-5 gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none pb-1">
                <button
                  onClick={() => setActiveCardTab("requirements")}
                  className={`pb-2 text-[11px] sm:text-xs font-extrabold transition-all border-b-2 flex items-center gap-1 sm:gap-1.5 shrink-0 whitespace-nowrap ${
                    activeCardTab === "requirements"
                      ? "text-purple-600 dark:text-purple-400 border-purple-500"
                      : "text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <TargetIcon size={14} className="shrink-0" /> Qabul Talablari
                </button>
                <button
                  onClick={() => setActiveCardTab("grant")}
                  className={`pb-2 text-[11px] sm:text-xs font-extrabold transition-all border-b-2 flex items-center gap-1 sm:gap-1.5 shrink-0 whitespace-nowrap ${
                    activeCardTab === "grant"
                      ? "text-emerald-600 dark:text-emerald-400 border-emerald-500"
                      : "text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <MedalRibbonStarIcon size={14} className="shrink-0" /> Grant va Moliyalashtirish
                </button>
                <button
                  onClick={() => setActiveCardTab("majors")}
                  className={`pb-2 text-[11px] sm:text-xs font-extrabold transition-all border-b-2 flex items-center gap-1 sm:gap-1.5 shrink-0 whitespace-nowrap ${
                    activeCardTab === "majors"
                      ? "text-rose-600 dark:text-rose-400 border-rose-500"
                      : "text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <BookBookmarkIcon size={14} className="shrink-0" /> Mashhur Yo'nalishlar
                </button>
              </div>

              {/* Dynamic Tab Content */}
              <AnimatePresence mode="wait">
                {activeCardTab === "requirements" && (
                  <motion.div
                    key="req"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-3"
                  >
                    <div className="bg-slate-50 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-2.5 sm:gap-3">
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                          <TargetIcon size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Minimal Target Ball</div>
                          <div className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate">
                            {currentUni.yonalishlar?.[0]?.otish_bali || "GPA: 3.5+ / IELTS 7.0+"}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 shrink-0">
                        Zaruriy
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-2.5 sm:gap-3">
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                          <CalendarMarkIcon size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Arizalar Qabul Deadline</div>
                          <div className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate">
                            {currentUni.qabul || "2027-01-01 (Regular Decision)"}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-purple-700 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 shrink-0">
                        Vaqt cheklangan
                      </span>
                    </div>
                  </motion.div>
                )}

                {activeCardTab === "grant" && (
                  <motion.div
                    key="grant"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-3"
                  >
                    <div className="bg-slate-50 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                        <MedalRibbonStarIcon size={16} /> Grant Imkoniyati:
                      </div>
                      <p className="text-xs text-slate-800 dark:text-slate-200 font-semibold leading-relaxed">
                        {currentUni.grant_type || "Need-Based Aid / Full Need Met Scholarship"}
                      </p>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/80 dark:border-slate-800">
                        Kontrakt narxi: <span className="text-slate-900 dark:text-white font-bold">{currentUni.kontrakt}</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeCardTab === "majors" && (
                  <motion.div
                    key="majors"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-2 max-h-40 overflow-y-auto"
                  >
                    {currentUni.yonalishlar?.map((m: any, idx: number) => (
                      <div key={idx} className="bg-slate-50 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-xl p-2.5 flex items-center justify-between text-xs gap-2">
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{m.nomi}</span>
                        <span className="text-[10px] text-purple-600 dark:text-purple-400 font-extrabold shrink-0">{m.shakl}</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom CTA Button */}
            <div className="mt-5 sm:mt-6 pt-4 border-t border-slate-200/80 dark:border-slate-800">
              <Link
                to="/universitetlar"
                className="w-full py-3 sm:py-3.5 px-3 sm:px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-[#E8192C] to-amber-500 hover:from-purple-500 hover:to-rose-600 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25 transition-all active:scale-[0.99] text-center"
              >
                <StarsIcon size={18} className="text-amber-300 animate-pulse shrink-0" />
                <span className="hidden sm:inline">OTMni Orzuyingizga Qo'shish va Tayyorgarlikni Boshlash</span>
                <span className="sm:hidden">OTMni Tanlash va Tayyorlanish</span>
                <AltArrowRightIcon size={16} className="shrink-0" />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
