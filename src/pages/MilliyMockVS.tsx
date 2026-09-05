import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight, Sparkles, Brain, Zap,
  Award, BookOpen, Gamepad2, ShieldCheck, Flame, Cpu,
  Bot, Camera, PenTool, Swords, Clock, ChevronRight
} from "lucide-react";
import { CheckCircleIcon } from "@solar-icons/react/bold-duotone/check-circle";
import { CloseCircleIcon } from "@solar-icons/react/bold-duotone/close-circle";
import { DangerTriangleIcon } from "@solar-icons/react/bold-duotone/danger-triangle";
import { Widget4Icon } from "@solar-icons/react/bold-duotone/widget-4";
import { StarsIcon } from "@solar-icons/react/bold-duotone/stars";
import { CpuIcon } from "@solar-icons/react/bold-duotone/cpu";
import { PenIcon } from "@solar-icons/react/bold-duotone/pen";
import { CameraIcon } from "@solar-icons/react/bold-duotone/camera";
import { GamepadIcon } from "@solar-icons/react/bold-duotone/gamepad";
import { GraphIcon } from "@solar-icons/react/bold-duotone/graph";
import { CupIcon } from "@solar-icons/react/bold-duotone/cup";
import { UsersGroupTwoRoundedIcon } from "@solar-icons/react/bold-duotone/users-group-two-rounded";
import { NotebookIcon } from "@solar-icons/react/bold-duotone/notebook";
import SEO from "@/components/SEO";
import { useTranslation } from "react-i18next";

const RED = "#E8192C";

interface FeatureRow {
  feature: string;
  educontestText: string;
  educontestType?: "check" | "star";
  milliymockText: string;
  milliymockType?: "cross" | "warning";
  desc: string;
}

export default function MilliyMockVS() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"table" | "features">("features");

  const comparisonFeatures: FeatureRow[] = [
    {
      feature: "Test ishlash va Natijalar paneli",
      educontestText: "To'liq bazasi + Rasch Modeli Theta tahlili",
      educontestType: "check",
      milliymockText: "Oddiy to'g'ri/xato foizi va ro'yxat",
      milliymockType: "warning",
      desc: "EduContest BMBA va Milliy sertifikat kabi murakkab Rasch statistikasi va item-response tahlilini beradi."
    },
    {
      feature: "Eduly AI & Ovozli AI Mentor",
      educontestText: "24/7 Ovozli va matnli AI murabbiy",
      educontestType: "check",
      milliymockText: "Mavjud emas",
      milliymockType: "cross",
      desc: "Har bir savol bo'yicha tushunmagan joyingizni AI ustoz bilan muloqot qilib o'rganishingiz mumkin."
    },
    {
      feature: "AI Essey Tekshirish (12 mezon)",
      educontestText: "Imlo, grammatika va 12 Rubric mezonli tahlil",
      educontestType: "check",
      milliymockText: "Faqat oddiy essey yuklash",
      milliymockType: "warning",
      desc: "Insholarni 12 xil mezon (Rubric) bo'yicha daftardagidek avtomatik tekshiradi."
    },
    {
      feature: "Vision AI / Math Scan (Formulalar skaneri)",
      educontestText: "Masala va tenglamalarni rasm orqali yechish",
      educontestType: "check",
      milliymockText: "Mavjud emas",
      milliymockType: "cross",
      desc: "Qiyin matematik masalalarni rasmini olib darhol yechim va tushuntirish olasiz."
    },
    {
      feature: "Interaktiv Lug'at va O'yinlar (Vocab Runner)",
      educontestText: "Vocab Runner o'yini, Memory Trainer, Lug'at",
      educontestType: "check",
      milliymockText: "Mavjud emas",
      milliymockType: "cross",
      desc: "Ingliz tili lug'at boyligini interaktiv runner o'yini va kartochkalar orqali oshirish."
    },
    {
      feature: "Daraxt Taymeri (Forest Focus Timer)",
      educontestText: "Diqqat va taym-menejment taymeri",
      educontestType: "check",
      milliymockText: "Mavjud emas",
      milliymockType: "cross",
      desc: "Dars qilish vaqtida diqqatni jamlash uchun maxsus gamifikatsiya taymeri."
    },
    {
      feature: "PvP Battle Mode (Jonli bellashuv)",
      educontestText: "Real-vaqtli PvP bilim janglari",
      educontestType: "check",
      milliymockText: "Mavjud emas",
      milliymockType: "cross",
      desc: "Boshqa o'quvchilar bilan jonli efirda test topshirib reyting oshirish."
    },
    {
      feature: "Kurs Yaratish va Sotish (O'qituvchilar uchun)",
      educontestText: "O'z kurslaringizni yaratib daromad olish",
      educontestType: "check",
      milliymockText: "Faqat tayyor kurslarni ko'rish",
      milliymockType: "warning",
      desc: "Pedagoglar platformamizda o'z video dars va kurslarini joylab pul ishlashlari mumkin."
    },
    {
      feature: "QR-Kodli Rasmiy Sertifikatlar",
      educontestText: "Rasmiy Sertifikatlar + QR Tekshiruv",
      educontestType: "check",
      milliymockText: "Faqat test natija sahifasi",
      milliymockType: "warning",
      desc: "Har bir muvaffaqiyat uchun rasmiy sertifikatlar yutib oling."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-white transition-colors" style={{ fontFamily: "'Inter', sans-serif" }}>
      <SEO
        title="EduContest vs Milliy Mock — Platformalar Taqqoslamasi"
        description="Milliy Mock va EduContest platformalarining imkoniyatlarini solishtiring: AI Mentor, Essey Checker, Math Scan, Vocab Runner va Rasch Modeli statistikasi."
      />

      {/* ── TOP HERO SECTION ── */}
      <section className="relative pt-12 pb-16 overflow-hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
        <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 via-transparent to-transparent pointer-events-none" />

        <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 relative z-10 text-center space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-extrabold tracking-wider uppercase text-slate-600 dark:text-slate-300">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            Avgust 2026 • Platforma Taqqoslamasi
          </div>

          {/* VS Logos Badge (Milliy Mock logo container is larger as requested: w-20 h-20 sm:w-24 sm:h-24) */}
          <div className="flex items-center justify-center gap-4 sm:gap-6 pt-2">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white dark:bg-slate-800 p-2.5 shadow-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
              <img src="/logo.png" alt="EduContest" className="w-full h-full object-contain" />
            </div>

            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-extrabold text-xs sm:text-sm flex items-center justify-center shadow-lg uppercase tracking-wider shrink-0">
              VS
            </div>

            {/* Larger logo container for Milliy Mock */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white dark:bg-slate-800 p-3 shadow-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
              <img src="/milliymock" alt="Milliy Mock" className="w-full h-full object-contain" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-3xl mx-auto leading-tight">
            Milliy Mock vs <span className="text-[#E8192C]">EduContest</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            <strong>Milliy Mock</strong> va <strong>EduContest</strong> o'rtasidagi asosiy farqlar: Milliy Mock standart test natijalari va tangalar tizimiga ega platforma. <strong>EduContest</strong> esa 24/7 AI Mentor (Eduly AI), 12 mezonli AI Essey Checker, Vision AI Math Scan, Vocab Runner gamifikatsiyasi va BMBA Rasch Modeli statistikasiga ega to'liq ekotizimdir.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/register"
              className="px-6 py-3.5 rounded-xl text-white font-extrabold text-sm transition-all hover:opacity-90 active:scale-95 shadow-lg shadow-red-500/25 flex items-center gap-2"
              style={{ background: RED }}
            >
              EduContest'da Bepul Boshlash <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/tests"
              className="px-6 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-extrabold text-sm transition-all"
            >
              Testlar Bazasini Ko'rish
            </Link>
          </div>
        </div>
      </section>

      {/* ── MAIN COMPARISON SECTION ── */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-12 space-y-10">

        {/* Tab Selector */}
        <div className="flex justify-center">
          <div className="bg-slate-200/80 dark:bg-slate-800/80 p-1 rounded-2xl flex gap-1 border border-slate-300 dark:border-slate-700">
            <button
              onClick={() => setActiveTab("features")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${
                activeTab === "features"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <StarsIcon size={18} className="text-amber-500" />
              EduContest Afzalliklari (To'liq)
            </button>
            <button
              onClick={() => setActiveTab("table")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${
                activeTab === "table"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Widget4Icon size={18} className="text-[#E8192C]" />
              Taqqoslash Jadvali
            </button>
          </div>
        </div>

        {/* TABLE VIEW */}
        {activeTab === "table" ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            {/* Table Header */}
            <div className="grid grid-cols-12 bg-slate-100 dark:bg-slate-800/80 p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 font-extrabold text-xs sm:text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <div className="col-span-5 sm:col-span-4">Funksiya / Imkoniyat</div>
              <div className="col-span-4 sm:col-span-4 text-center flex items-center justify-center gap-1.5 text-red-600 dark:text-red-400">
                <img src="/logo.png" className="w-5 h-5 object-contain" alt="" />
                <span>EduContest</span>
              </div>
              <div className="col-span-3 sm:col-span-4 text-center flex items-center justify-center gap-1.5 text-slate-700 dark:text-slate-300">
                <img src="/milliymock" className="w-5 h-5 object-contain" alt="" />
                <span>Milliy Mock</span>
              </div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs sm:text-sm font-medium">
              {comparisonFeatures.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 p-4 sm:p-6 items-center hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <div className="col-span-5 sm:col-span-4 pr-2">
                    <p className="font-extrabold text-slate-900 dark:text-white leading-snug">{item.feature}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">{item.desc}</p>
                  </div>
                  
                  {/* EduContest cell with Solar Icon */}
                  <div className="col-span-4 sm:col-span-4 text-center flex items-center justify-center gap-1.5 font-extrabold px-2.5 py-1.5 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-2xl border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[11px] sm:text-xs">
                    <CheckCircleIcon size={18} className="text-emerald-500 shrink-0" />
                    <span>{item.educontestText}</span>
                  </div>

                  {/* Milliy Mock cell with Solar Icon */}
                  <div className="col-span-3 sm:col-span-4 text-center flex items-center justify-center gap-1.5 font-bold px-2.5 py-1.5 rounded-2xl text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                    {item.milliymockType === "warning" ? (
                      <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-1 rounded-xl border border-amber-500/20">
                        <DangerTriangleIcon size={16} className="text-amber-500 shrink-0" />
                        <span>{item.milliymockText}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-1 rounded-xl border border-rose-500/20">
                        <CloseCircleIcon size={16} className="text-rose-500 shrink-0" />
                        <span>{item.milliymockText}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* FULL DETAILED FEATURES VIEW WITH SOLAR ICONS */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SolarFeatureCard
              icon={CpuIcon}
              title="Eduly AI & Ovozli Ustoz (24/7)"
              desc="Milliy Mock da sun'iy intellekt repetitori mavjud emas. EduContest da esa Eduly AI har bir savol bo'yicha tushunmagan masalangizni xuddi jonli repetitor singari 24/7 ovozli va matnli muloqot qilgan holda bosqichma-bosqich yechishingizga yordam beradi."
              badge="Sun'iy Intellekt"
              accent="#E8192C"
              highlights={["24/7 Ovozli Muloqot", "Har bir variant tahlili", "Shaxsiy O'quv Rejasi"]}
            />

            <SolarFeatureCard
              icon={PenIcon}
              title="AI Essey Tahlilchisi (Essay Checker)"
              desc="EduContest AI Essay Checker orqali Ona tili va adabiyot hamda ingliz tili insholaringizni 12 xil mezon (Rubric) bo'yicha imlo, grammatika va uslubiy xatolarni avtomatik tekshirib ballaydi."
              badge="Essey Tekshirish"
              accent="#7c3aed"
              highlights={["12 ta Rubric Mezoni", "Imlo & Grammatika", "Daftardagidek Tahlil"]}
            />

            <SolarFeatureCard
              icon={CameraIcon}
              title="Vision AI (Math Scan & OCR)"
              desc="Qog'ozdagi yoki kitobdagi murakkab matematik va fizik Masalalar hamda formulalar rasmini yuklab, sun'iy intellektdan bir necha sekundda to'liq bosqichma-bosqich yechim olasiz."
              badge="Rasm Skaner"
              accent="#0891b2"
              highlights={["Math Live Solver", "Integral & Geometriya", "Lahzali Rasm Tahlili"]}
            />

            <SolarFeatureCard
              icon={GamepadIcon}
              title="Vocab Runner & Gamifikatsiya"
              desc="Zukkolik va lug'at boyligini oshirish uchun Vocab Runner runner o'yini, Memory Trainer kartochkalari, Daraxt Taymeri (Forest Timer) va real-vaqtli PvP Battle Mode janglari mavjud."
              badge="O'yinlar & Gamifikatsiya"
              accent="#10b981"
              highlights={["Vocab Runner O'yini", "Daraxt Taymeri", "EduCoin Mukofotlari"]}
            />

            <SolarFeatureCard
              icon={GraphIcon}
              title="BMBA Rasch Modeli Statistikasi"
              desc="Milliy Mock faqat oddiy to'g'ri/xato foizini va o'rtacha natijani beradi. EduContest esa BMBA va Milliy sertifikat darajasidagi murakkab Rasch Item-Response tahlilida o'quvchining haqiqiy bilim qobiliyat darajasini (Theta) aniqlaydi."
              badge="Rasch Modeli"
              accent="#f59e0b"
              highlights={["BMBA Rasch Standarti", "Item Difficulty Matrix", "Theta Qobiliyat Indeksi"]}
            />

            <SolarFeatureCard
              icon={NotebookIcon}
              title="O'qituvchilar Portali (Kurs Yaratish & Sotish)"
              desc="EduContest pedagog va repetitorlar uchun ham to'liq platformadir. O'qituvchilar o'z mualliflik video darslari va kurslarini yaratib sotishlari hamda daromad olishlari mumkin."
              badge="O'qituvchilar Portali"
              accent="#6366f1"
              highlights={["Video Darslar Yuklash", "Mualliflik Kurslari", "Avtomatik Daromad Tizimi"]}
            />
          </div>
        )}

        {/* ── CALL TO ACTION BANNER ── */}
        <div className="bg-gradient-to-r from-[#E8192C] via-red-600 to-rose-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 rounded-3xl p-8 sm:p-14 text-white text-center space-y-6 relative overflow-hidden shadow-2xl border border-red-500/30 dark:border-slate-800">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 dark:bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight max-w-2xl mx-auto leading-tight">
            Bugunoq EduContest bilan <span className="text-yellow-300 dark:text-[#E8192C] font-black">100% tayyorgarlikni</span> boshlang!
          </h2>

          <p className="text-xs sm:text-sm text-red-100 dark:text-slate-300 max-w-xl mx-auto font-medium">
            Platformaga bepul ro'yxatdan o'ting va sun'iy intellekt kuchi bilan imtihonlarda eng yuqori ballga erishing.
          </p>

          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <Link
              to="/register"
              className="px-8 py-4 rounded-2xl bg-white text-slate-900 dark:bg-[#E8192C] dark:text-white font-extrabold text-sm transition-all hover:bg-slate-100 dark:hover:opacity-90 active:scale-95 shadow-xl hover:scale-105"
            >
              HOZIROQ BOSHLASH (BEPUL)
            </Link>
          </div>
        </div>

      </section>
    </div>
  );
}

function SolarFeatureCard({ icon: Icon, title, desc, badge, accent, highlights }: any) {
  return (
    <div className="p-6 sm:p-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs" style={{ background: `${accent}15`, color: accent }}>
            <Icon size={26} />
          </div>
          <span className="text-[10px] uppercase font-extrabold tracking-wider px-3 py-1 rounded-full border" style={{ background: `${accent}10`, color: accent, borderColor: `${accent}30` }}>
            {badge}
          </span>
        </div>
        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-snug">{title}</h3>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">{desc}</p>
      </div>

      {highlights && highlights.length > 0 && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-1.5">
          {highlights.map((h: string, i: number) => (
            <span key={i} className="text-[10.5px] font-bold px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
              {h}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
