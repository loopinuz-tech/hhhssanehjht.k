import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  GraduationCap,
  Target,
  Users,
  Trophy,
  Sparkles,
  BookOpen,
  ShieldCheck,
} from "lucide-react";
import SEO from "@/components/SEO";

const stats = [
  { label: "Faol Foydalanuvchilar", value: "350,000+", icon: Users },
  { label: "Mavjud Testlar va Savollar", value: "50,000+", icon: BookOpen },
  { label: "Muvaffaqiyatli Bitiruvchilar", value: "98%", icon: Trophy },
  { label: "Sun'iy Intellekt Tahlillari", value: "1.2M+", icon: Sparkles },
];

const values = [
  {
    title: "Sifatli va Isbotlangan Kontent",
    desc: "Barcha testlar va o'quv materiallari O'zbekiston Respublikasi BMBA (DTM) va Milliy Sertifikat imtihonlari standartlariga to'liq mos keladi.",
    icon: ShieldCheck,
  },
  {
    title: "AI Yordamida Diagnostika",
    desc: "EduAI sun'iy intellekti har bir o'quvchining zaif nuqtalarini aniqlab, ularni bartaraf etish bo'yicha shaxsiy tayyorgarlik rejasini tuzib beradi.",
    icon: Sparkles,
  },
  {
    title: "Teng Imkoniyatlar",
    desc: "EduContest barcha hududlardagi abituriyentlar va o'quvchilar uchun sifatli ta'lim va mock testlarni bepul hamda hamyonbop sharoitda taqdim etadi.",
    icon: Target,
  },
];

const About = () => {
  const navigate = useNavigate();

  return (
    <>
      <SEO
        title="Biz haqimizda — EduContest.uz"
        description="EduContest.uz — Milliy Sertifikat va DTM imtihonlariga tayyorlanuvchilar uchun №1 sun'iy intellektga asoslangan ta'lim va mock test platformasi."
        canonical={`${window.location.origin}/about`}
      />
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 font-sans">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-10">
          
          {/* Header */}
          <div className="flex flex-col items-center text-center space-y-4">
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 text-[11px] font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors uppercase tracking-wider cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Bosh sahifaga qaytish
            </button>
            <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-md">
              <GraduationCap className="w-8 h-8 text-[#E8192C]" />
            </div>
            <div className="max-w-xl">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight uppercase">
                Biz Haqimizda
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed font-medium">
                EduContest.uz — O'zbekistondagi eng zamonaviy va innovatsion onlayn ta'lim hamda imtihon simulyatsiyasi platformasidir.
              </p>
            </div>
          </div>

          {/* Core Mission Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#E8192C]" />
                Bizning Maqsadimiz
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                EduContest loyihasi abituriyentlar, maktab o'quvchilari va o'qituvchilar uchun imtihonlarga tayyorlanish jarayonini adolatli, samarali va qiziqarli qilish maqsadida yaratilgan. Biz har bir o'quvchiga o'z bilim darajasini real vaqt rejimida baholash, xatolar ustida ishlash va yuqori milliy sertifikat hamda talabalik maqomiga erishishda ko'maklashamiz.
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                Platforma doirasida Matematika, Ona tili va Adabiyot, Fizika, Kimyo, Biologiya, Tarix hamda Chet tillari bo'yicha minglab standart va diagnostik testlar, mock simulyatsiyalar, video va matnli o'quv qo'llanmalari taqdim etiladi.
              </p>
            </div>

            {/* Founder Info */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#E8192C]/10 border border-[#E8192C]/20 flex items-center justify-center font-bold text-[#E8192C] text-lg shrink-0">
                IX
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Loyiha Asoschisi & Muallifi</h3>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Ilyos Xudayberganov</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">EduContest.uz asoschisi va yetakchi ta'lim metodisti</p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center space-y-2 shadow-xs">
                <stat.icon className="w-6 h-6 text-[#E8192C] mx-auto" />
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{stat.value}</div>
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Core Values */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white text-center uppercase tracking-wide">
              Afzalliklarimiz va Qadriyatlarimiz
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {values.map((v, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-slate-800 flex items-center justify-center">
                    <v.icon className="w-5 h-5 text-[#E8192C]" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{v.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Footer */}
          <div className="bg-gradient-to-r from-red-600 to-[#E8192C] rounded-3xl p-8 text-center text-white space-y-4 shadow-lg">
            <h2 className="text-xl font-extrabold tracking-tight">O'z Bilimingizni Bugun Sinab Ko'ring!</h2>
            <p className="text-xs sm:text-sm text-white/90 max-w-xl mx-auto leading-relaxed">
              Minglab abituriyentlar EduContest yordamida grant va sertifikatlarga ega bo'lishmoqda. Qatnashing va o'z marrangizga erishing.
            </p>
            <button
              onClick={() => navigate("/tests")}
              className="bg-white text-[#E8192C] font-bold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider hover:bg-slate-100 transition-colors shadow-md cursor-pointer"
            >
              Testlarni Boshlash
            </button>
          </div>

        </div>
      </div>
    </>
  );
};

export default About;
