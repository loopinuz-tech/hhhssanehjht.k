import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const PageLoader = ({ isVisible }: { isVisible: boolean }) => {
  const { t } = useTranslation();
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] bg-white dark:bg-[#020617] flex flex-col items-center justify-center space-y-12"
        >
          <div className="relative flex items-center justify-center">
            {/* Circular Progress Ring */}
            <svg className="w-56 h-56 -rotate-90">
              <circle
                cx="112"
                cy="112"
                r="60"
                stroke="currentColor"
                strokeWidth="2"
                fill="transparent"
                className="text-slate-100 dark:text-slate-800"
              />
              <motion.circle
                cx="112"
                cy="112"
                r="60"
                stroke="currentColor"
                strokeWidth="3"
                fill="transparent"
                strokeDasharray="377"
                initial={{ strokeDashoffset: 377 }}
                animate={{ strokeDashoffset: 0 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="text-primary"
              />
            </svg>

            {/* Logo Wrapper */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="w-24 h-24 bg-white dark:bg-slate-800 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.08)] dark:shadow-none flex items-center justify-center border border-slate-50 dark:border-slate-700 relative z-10"
              >
                <img src="/logo.png" alt="EduContest" className="w-14 h-14 object-contain" />
              </motion.div>
            </div>

            {/* Subtle pulse background */}
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute w-40 h-40 bg-primary rounded-full blur-3xl pointer-events-none"
            />
          </div>

          <div className="text-center space-y-6 relative z-10">
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-3xl font-black text-slate-800 dark:text-white tracking-[0.6em] uppercase ml-[0.6em]"
            >
              EDUCONTEST.UZ
            </motion.h2>

            <div className="flex gap-2 justify-center">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 1, 0.3]
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                  className="w-1.5 h-1.5 bg-primary rounded-full"
                />
              ))}
            </div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-[11px] font-medium text-slate-400 dark:text-slate-500 tracking-wider"
            >
              {t("common.loading")}
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PageLoader;
