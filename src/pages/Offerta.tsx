import { useNavigate } from "react-router-dom";
import { ChevronLeft, ShieldCheck, CreditCard, UserCheck, Scale } from "lucide-react";
import { useTranslation } from "react-i18next";
import SEO from "@/components/SEO";

const Offerta = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <>
      <SEO title="Oferta" description="EduContest ommaviy oferta — to'lov shartlari, obuna kelishuvi va xizmat ko'rsatish qoidalari." canonical={`${window.location.origin}/offerta`} />
      <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 animate-fade-in">
      <div className="w-full max-w-3xl space-y-10">
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-4">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-widest"
          >
            <ChevronLeft className="w-4 h-4" /> {t('offerta.back')}
          </button>
          <div className="w-16 h-16 bg-white rounded-3xl shadow-xl shadow-gray-200 flex items-center justify-center border border-gray-100">
             <Scale className="w-8 h-8 text-gray-900" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">{t('offerta.title')}</h1>
          <p className="text-[14px] text-gray-400 font-medium max-w-lg">
             {t('offerta.desc')}
          </p>
        </div>

        {/* Content */}
        <div className="bg-white border border-gray-200 rounded-[40px] p-8 md:p-12 shadow-sm space-y-12 text-sm leading-relaxed text-gray-600">
          
          <section className="space-y-4">
             <div className="flex items-center gap-3 text-gray-900">
                <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center">
                   <UserCheck className="w-4 h-4" />
                </div>
                <h2 className="font-bold uppercase tracking-wider text-xs">{t('offerta.section1_title')}</h2>
             </div>
             <p>
                {t('offerta.section1_text')}
             </p>
          </section>

          <section className="space-y-4">
             <div className="flex items-center gap-3 text-gray-900">
                <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center">
                   <CreditCard className="w-4 h-4" />
                </div>
                <h2 className="font-bold uppercase tracking-wider text-xs">{t('offerta.section2_title')}</h2>
             </div>
             <p>
                {t('offerta.section2_text')}
             </p>
          </section>

          <section className="space-y-4">
             <div className="flex items-center gap-3 text-gray-900">
                <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center">
                   <ShieldCheck className="w-4 h-4" />
                </div>
                <h2 className="font-bold uppercase tracking-wider text-xs">{t('offerta.section3_title')}</h2>
             </div>
             <p>
                {t('offerta.section3_text')}
             </p>
          </section>

          <section className="space-y-4">
             <div className="flex items-center gap-3 text-gray-900">
                <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-red-500">
                   <Scale className="w-4 h-4" />
                </div>
                <h2 className="font-bold uppercase tracking-wider text-xs">{t('offerta.section4_title')}</h2>
             </div>
             <p>
                {t('offerta.section4_text')}
             </p>
          </section>

          <div className="pt-10 border-t border-gray-50 flex flex-col items-center space-y-4 text-center">
             <p className="text-[11px] font-bold text-gray-300 uppercase tracking-widest italic">{t('offerta.updated_at')}</p>
             <button 
               onClick={() => navigate(-1)}
               className="bg-gray-900 text-white px-10 py-4 rounded-2xl font-bold text-sm hover:scale-105 transition-transform"
             >
                {t('offerta.accept_btn')}
             </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Offerta;
