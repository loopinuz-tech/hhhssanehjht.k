import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, HelpCircle, ChevronDown } from "lucide-react";
import SEO from "@/components/SEO";

const faqs = [
  {
    q: "EduContest platformasidan foydalanish bepulmi?",
    a: "Ha! EduContest platformasida ro'yxatdan o'tish, asosiy mock testlar, diagnostika va o'quv qo'llanmalaridan foydalanish bepul taqdim etiladi. Qo'shimcha cheksiz AI tahlil va kengaytirilgan imkoniyatlar uchun Premium obuna mavjud."
  },
  {
    q: "Milliy Sertifikat mock testlari rasmiy standartlarga mos keladimi?",
    a: "Mutlaqo. Barcha test topshiriqlari O'zbekiston Respublikasi BMBA (sobiq DTM) spetsifikatsiyalari hamda Milliy Sertifikat imtihonlari talablariga 100% mos ravishda tajribali mutaxassislar va metodistlar tomonidan tuziladi."
  },
  {
    q: "Test natijalarimni qanday tahlil qilishim mumkin?",
    a: "Testni yakunlaganingizdan so'ng, tizim har bir savol bo'yicha me'yoriy vaqt, to'g'ri va noto'g'ri javoblar hamda EduAI yordamida har bir noto'g'ri javob uchun batafsil tushuntirish va diagnostik xulosani ko'rsatib beradi."
  },
  {
    q: "EduCoin nima va uni qanday to'plash mumkin?",
    a: "EduCoin — bu platforma ichidagi rag'batlantirish ballaridir. Kunlik platformaga kirish (daily login), testlarni a'lo bahoga yechish va do'stlarni taklif qilish orqali EduCoin to'plashingiz va ularni turli imtiyozlarga almashtirishingiz mumkin."
  },
  {
    q: "Saytdagi reklama va cookie fayllari qanday ishlaydi?",
    a: "EduContest sayt va xizmatlarini rivojlantirish uchun Google AdSense tizimi orqali reklamalarni ko'rsatishi mumkin. Reklamalar Google Publisher Policies va Maxfiylik Siyosatiga muvofiq ravishda tartibga solinadi. Maxfiylik sahifasidan batafsil ma'lumot olishingiz mumkin."
  },
  {
    q: "O'qituvchi sifatida test yoki kurs qo'sha olamanmi?",
    a: "Ha! EduContest platformasida Contributor (Muallif) bo'limi mavjud. O'qituvchilar o'z testlarini va kurslarini joylashtirib, o'quvchilarga taqdim etishlari hamda daromad olishlari mumkin."
  }
];

const Faq = () => {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <>
      <SEO
        title="Ko'p beriladigan savollar (FAQ) — EduContest.uz"
        description="EduContest platformasi bo'yicha ko'p beriladigan savollar va batafsil javoblar."
        canonical={`${window.location.origin}/faq`}
      />
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 font-sans">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-8">
          
          {/* Header */}
          <div className="flex flex-col items-center text-center space-y-4">
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 text-[11px] font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors uppercase tracking-wider cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Bosh sahifaga qaytish
            </button>
            <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-md">
              <HelpCircle className="w-8 h-8 text-[#E8192C]" />
            </div>
            <div className="max-w-xl">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight uppercase">
                Ko'p Beriladigan Savollar
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                EduContest platformasidan foydalanish bo'yicha eng muhim savollarga javoblar.
              </p>
            </div>
          </div>

          {/* Accordion List */}
          <div className="space-y-3">
            {faqs.map((faq, i) => {
              const isOpen = openIndex === i;
              return (
                <div
                  key={i}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs transition-all"
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-slate-900 dark:text-white cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180 text-[#E8192C]" : ""}`} />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Help Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center space-y-3 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Savolingizga javob topa olmadingizmi?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Bizning texnik yordam jamoamiz har doim yordam berishga tayyor.</p>
            <button
              onClick={() => navigate("/contact")}
              className="bg-[#E8192C] text-white font-bold px-6 py-2 rounded-xl text-xs uppercase tracking-wider hover:bg-[#D41524] transition-colors shadow-xs cursor-pointer inline-block"
            >
              Biz bilan bog'lanish
            </button>
          </div>

        </div>
      </div>
    </>
  );
};

export default Faq;
