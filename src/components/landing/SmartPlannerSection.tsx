import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckCircleIcon } from "@solar-icons/react/bold-duotone/check-circle";

export default function SmartPlannerSection() {
  const { t } = useTranslation();

  return (
    <section id="smart-planner" className="py-14 sm:py-20 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 relative overflow-hidden" data-anim-section>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-12">

        {/* ── Top Header Row ─────── */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 sm:gap-8">
          <div className="space-y-4 sm:space-y-5 max-w-xl">
            <h2 className="anim-reveal text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.18]">
              {t("landing.planner_feature.title")}
            </h2>
            <div className="anim-reveal">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-[#E8192C] text-white px-7 py-3.5 rounded-full font-bold text-sm transition-all duration-300 shadow-lg hover:shadow-red-500/20 hover:scale-105 active:scale-95 w-full sm:w-auto text-center"
              >
                {t("landing.planner_feature.cta")}
              </Link>
            </div>
          </div>

          <p className="anim-reveal text-slate-600 dark:text-slate-300 text-sm sm:text-lg max-w-lg font-medium leading-relaxed">
            {t("landing.planner_feature.desc")}
          </p>
        </div>

        {/* ── Asymmetric 2-Column Split Grid ─────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

          {/* LEFT COLUMN: Your Week At A Glance (7 Cols) */}
          <div className="anim-reveal lg:col-span-7 bg-slate-50/90 dark:bg-slate-900/70 rounded-[1.8rem] sm:rounded-[2.5rem] p-4 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-1.5">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                {t("landing.planner_feature.week_glance_title")}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                {t("landing.planner_feature.week_glance_desc")}
              </p>
            </div>

            {/* Inner Interactive Schedule Card */}
            <div className="bg-white dark:bg-slate-950 rounded-2xl p-3.5 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-md space-y-3.5 sm:space-y-4">

              {/* Item 1 - Completed */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 py-2.5 sm:py-3 border-b border-slate-100 dark:border-slate-800/60">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="text-center w-10 sm:w-12 shrink-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{t("landing.planner_feature.day_thu", "PAY")}</p>
                    <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-none">21</p>
                    <p className="text-[9px] text-slate-400 font-medium">{t("landing.planner_feature.month_may", "May")}</p>
                  </div>
                  <CheckCircleIcon size={20} className="text-emerald-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-400 line-through truncate">{t("landing.planner_feature.task1_title", "O'qish va tahlil mashqi")}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{t("landing.planner_feature.task1_sub", "O'qish / 30 daq / 10 savol")}</p>
                  </div>
                </div>
                <button disabled className="self-end sm:self-center text-[10px] sm:text-[11px] font-bold text-slate-300 dark:text-slate-700 px-3 py-1 rounded-lg bg-slate-50 dark:bg-slate-900 shrink-0">
                  {t("landing.planner_feature.start_btn", "Boshlash")} &gt;
                </button>
              </div>

              {/* Item 2 - Completed */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 py-2.5 sm:py-3 border-b border-slate-100 dark:border-slate-800/60">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="text-center w-10 sm:w-12 shrink-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{t("landing.planner_feature.day_thu", "PAY")}</p>
                    <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-none">21</p>
                    <p className="text-[9px] text-slate-400 font-medium">{t("landing.planner_feature.month_may", "May")}</p>
                  </div>
                  <CheckCircleIcon size={20} className="text-emerald-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-400 line-through truncate">{t("landing.planner_feature.task2_title", "Fikrni ifodalash tahlili")}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{t("landing.planner_feature.task2_sub", "Yozuv / 20 daq / 8 savol")}</p>
                  </div>
                </div>
                <button disabled className="self-end sm:self-center text-[10px] sm:text-[11px] font-bold text-slate-300 dark:text-slate-700 px-3 py-1 rounded-lg bg-slate-50 dark:bg-slate-900 shrink-0">
                  {t("landing.planner_feature.start_btn", "Boshlash")} &gt;
                </button>
              </div>

              {/* Item 3 - Active Highlighted Task */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 py-2.5 sm:py-3 border-b border-slate-100 dark:border-slate-800/60 bg-sky-50/40 dark:bg-sky-950/20 px-3 -mx-3 rounded-xl border-l-4 border-l-[#0284C7]">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="text-center w-10 sm:w-12 shrink-0">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">{t("landing.planner_feature.day_sat", "SHAN")}</p>
                    <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-none">23</p>
                    <p className="text-[9px] text-slate-400 font-medium">{t("landing.planner_feature.month_may", "May")}</p>
                  </div>
                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-[#0284C7] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">{t("landing.planner_feature.task3_title", "Aralash mavzular sinov to'plami")}</p>
                    <p className="text-[10px] text-slate-500 font-medium">{t("landing.planner_feature.task3_sub", "Aralash / 45 daq / 20 savol")}</p>
                  </div>
                </div>
                <Link
                  to="/tests"
                  className="self-end sm:self-center text-xs font-bold text-white px-4 py-1.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] shadow-md transition-all shrink-0 flex items-center justify-center gap-1"
                >
                  {t("landing.planner_feature.start_btn", "Boshlash")} &gt;
                </Link>
              </div>

              {/* Item 4 - Full Length Digital SAT */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 py-2.5 sm:py-3 border-b border-slate-100 dark:border-slate-800/60">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="text-center w-10 sm:w-12 shrink-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{t("landing.planner_feature.day_sun", "YAK")}</p>
                    <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-none">24</p>
                    <p className="text-[9px] text-slate-400 font-medium">{t("landing.planner_feature.month_may", "May")}</p>
                  </div>
                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border border-slate-300 dark:border-slate-700 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{t("landing.planner_feature.task4_title", "To'liq formatdagi Milliy Sertifikat / Attestatsiya sinov testi")}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{t("landing.planner_feature.task4_sub", "Sinov testi / 134 daq / 98 savol")}</p>
                  </div>
                </div>
                <button disabled className="self-end sm:self-center text-[10px] sm:text-[11px] font-bold text-slate-400 px-3 py-1 rounded-lg bg-slate-50 dark:bg-slate-900 shrink-0">
                  {t("landing.planner_feature.start_btn", "Boshlash")} &gt;
                </button>
              </div>

              {/* Item 5 - Mistakes Review */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 pt-2">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="text-center w-10 sm:w-12 shrink-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{t("landing.planner_feature.day_sun", "YAK")}</p>
                    <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-none">24</p>
                    <p className="text-[9px] text-slate-400 font-medium">{t("landing.planner_feature.month_may", "May")}</p>
                  </div>
                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border border-slate-300 dark:border-slate-700 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{t("landing.planner_feature.task5_title", "Xatolar ustida ishlash mashg'uloti")}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{t("landing.planner_feature.task5_sub", "Tahlil / 30 daq / Shaxsiy mashg'ulot")}</p>
                  </div>
                </div>
                <button disabled className="self-end sm:self-center text-[10px] sm:text-[11px] font-bold text-slate-400 px-3 py-1 rounded-lg bg-slate-50 dark:bg-slate-900 shrink-0">
                  {t("landing.planner_feature.start_btn", "Boshlash")} &gt;
                </button>
              </div>

            </div>
          </div>

          {/* RIGHT COLUMN: 2 Stacked Cards (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">

            {/* TOP RIGHT CARD: Countdown Timer Card */}
            <div className="anim-reveal bg-slate-50/90 dark:bg-slate-900/70 rounded-[1.8rem] sm:rounded-[2.5rem] p-4 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-5">
              
              {/* Inner Floating Countdown Pill Box */}
              <div className="bg-white dark:bg-slate-950 rounded-2xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800 text-center shadow-sm space-y-2">
                <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                  {t("landing.planner_feature.countdown_title")}
                </p>
                <div className="flex flex-wrap items-baseline justify-center gap-1 sm:gap-1.5 text-slate-900 dark:text-white">
                  <span className="text-2xl sm:text-3xl font-black">6</span>
                  <span className="text-xs font-bold text-slate-400">{t("landing.planner_feature.days")}</span>
                  <span className="text-2xl sm:text-3xl font-black ml-1">16</span>
                  <span className="text-xs font-bold text-slate-400">{t("landing.planner_feature.hrs")}</span>
                  <span className="text-2xl sm:text-3xl font-black ml-1">14</span>
                  <span className="text-xs font-bold text-slate-400">{t("landing.planner_feature.min")}</span>
                </div>
                <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  {t("landing.planner_feature.exam_date_sub")}
                </p>
              </div>

              {/* Card Footer Info */}
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 dark:text-white text-base">
                  {t("landing.planner_feature.never_lose_track")}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  {t("landing.planner_feature.never_lose_track_desc")}
                </p>
              </div>

            </div>

            {/* BOTTOM RIGHT CARD: Calendar Sync Integration Card */}
            <div className="anim-reveal bg-slate-50/90 dark:bg-slate-900/70 rounded-[1.8rem] sm:rounded-[2.5rem] p-4 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-5">

              {/* Inner Floating Calendar Icons */}
              <div className="bg-white dark:bg-slate-950 rounded-2xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800 flex items-center justify-center gap-5 sm:gap-6 shadow-sm">
                
                {/* Google Calendar Icon */}
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md flex items-center justify-center p-2 transform hover:scale-110 transition-transform">
                  <img src="/calendar1.png" alt="Google Calendar" className="w-full h-full object-contain" />
                </div>

                {/* Apple Calendar Icon */}
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md flex items-center justify-center p-2 transform hover:scale-110 transition-transform">
                  <img src="/calendar2.png" alt="Apple Calendar" className="w-full h-full object-contain" />
                </div>

              </div>

              {/* Card Footer Info */}
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 dark:text-white text-base">
                  {t("landing.planner_feature.calendar_title")}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  {t("landing.planner_feature.calendar_desc")}
                </p>
              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
