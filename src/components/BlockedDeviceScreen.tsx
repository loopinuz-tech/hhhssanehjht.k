import { motion } from "framer-motion";
import { ShieldCrossIcon } from "@solar-icons/react/bold-duotone/shield-cross";
import { LockKeyholeMinimalisticIcon } from "@solar-icons/react/bold-duotone/lock-keyhole-minimalistic";
import { PhoneCallingIcon } from "@solar-icons/react/bold-duotone/phone-calling";

const BlockedDeviceScreen = () => {
  return (
    <div className="fixed inset-0 z-[9999] bg-[#06080f] flex items-center justify-center p-4">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-rose-900/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-rose-800/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(220,38,38,0.05)_0%,_transparent_70%)]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 max-w-md w-full"
      >
        {/* Card */}
        <div className="bg-[#0c1018] border border-rose-900/40 rounded-2xl p-8 text-center shadow-2xl shadow-rose-900/20">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-6"
          >
            <ShieldCrossIcon className="w-10 h-10 text-rose-500" />
          </motion.div>

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 mb-4"
          >
            <LockKeyholeMinimalisticIcon className="w-3 h-3 text-rose-400" />
            <span className="text-[11px] font-bold text-rose-400 uppercase tracking-widest">
              Qurilma Bloklangan
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="text-2xl font-black text-white mb-3"
          >
            Kirishga Ruxsat Yo'q
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-[13px] text-slate-400 leading-relaxed mb-6"
          >
            Bu qurilma <span className="text-rose-400 font-semibold">EduContest platformasidan bloklangan</span>.
            Yangi hisob yaratish ham bu qurilmadan ishlamaydi.
            <br /><br />
            Agar bu xatolik deb hisoblasangiz, qo'llab-quvvatlash xizmati bilan bog'laning.
          </motion.p>

          {/* Divider */}
          <div className="border-t border-white/[0.06] mb-5" />

          {/* Contact */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
            <motion.a
              href="mailto:info@educontest.uz"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 border border-white/[0.08] text-slate-300 hover:text-white transition-all text-[12px] font-semibold"
            >
              <PhoneCallingIcon className="w-4 h-4 text-rose-400" />
              info@educontest.uz
            </motion.a>
            <motion.a
              href="https://t.me/educontest_support"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 hover:text-white transition-all text-[12px] font-semibold"
            >
              Telegram Yordam
            </motion.a>
          </div>

          {/* Footer */}
          <p className="text-[10px] text-slate-600 mt-5">
            EduContest © {new Date().getFullYear()} • Barcha huquqlar himoyalangan
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default BlockedDeviceScreen;
