import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import SEO from "@/components/SEO";
import { AltArrowLeftIcon } from "@solar-icons/react/bold-duotone/alt-arrow-left";
import { HomeSmileIcon } from "@solar-icons/react/bold-duotone/home-smile";

const NotFound = () => {
  const { t } = useTranslation();

  return (
    <>
      <SEO title="Sahifa topilmadi" description="Kechirasiz, qidirilayotgan sahifa topilmadi. EduContest platformasiga qayting." />
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-slate-950 px-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="max-w-md w-full text-center"
        >
          {/* 404 number */}
          <div className="mb-6">
            <span className="text-[80px] sm:text-[100px] font-semibold text-slate-100 dark:text-slate-800 leading-none select-none">
              404
            </span>
          </div>

          {/* Content */}
          <div className="space-y-2 mb-8">
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">
              {t('not_found_page.title')}
            </h1>
            <p className="text-[13px] text-slate-500 max-w-xs mx-auto">
              {t('not_found_page.desc')}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
            <button
              onClick={() => window.history.back()}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[13px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <AltArrowLeftIcon size={18} />
              {t('not_found_page.btn_back')}
            </button>
            <Link
              to="/tests"
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#E8192C] text-white text-[13px] font-medium hover:bg-red-700 transition-colors active:scale-[0.98]"
            >
              <HomeSmileIcon size={18} />
              {t('not_found_page.btn_home')}
            </Link>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default NotFound;
