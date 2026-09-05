import { motion, AnimatePresence } from "framer-motion";
import { useEduCoin } from "@/hooks/useEduCoin";
import { useState, useRef, useEffect } from "react";
import {
  Flame, Star, Gift, X, Coins, ImagePlus
} from "lucide-react";
import { LikeIcon } from "@solar-icons/react/bold-duotone/like";
import { BugIcon } from "@solar-icons/react/bold-duotone/bug";
import { LightbulbIcon } from "@solar-icons/react/bold-duotone/lightbulb";
import { ChatRoundIcon } from "@solar-icons/react/bold-duotone/chat-round";
import { DangerIcon } from "@solar-icons/react/bold-duotone/danger";
import { supabase } from "@/integrations/supabase/client";
import { getStoragePublicUrl } from "@/lib/storage";

// ─── Daily Login Modal ────────────────────────────────────────────
export const DailyLoginModal = () => {
  const { showDailyModal, closeDailyModal, dailyResult, streak } = useEduCoin();

  const milestoneColors: Record<string, string> = {
    "Haftalik Sabot": "from-amber-400 to-orange-500",
    "Ikki Haftali Qahramon": "from-blue-400 to-indigo-500",
    "Yigirma Kun Ustozi": "from-purple-400 to-pink-500",
    "Oylik Champion": "from-emerald-400 to-teal-500",
    "Chorak Yil Afsonasi": "from-yellow-400 to-amber-600",
  };

  const gradient = dailyResult?.milestone
    ? milestoneColors[dailyResult.milestone] ?? "from-emerald-400 to-teal-500"
    : "from-emerald-400 to-cyan-500";

  return (
    <AnimatePresence>
      {showDailyModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          onClick={closeDailyModal}
        >
          <motion.div
            initial={{ scale: 0.7, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="bg-white dark:bg-slate-900 rounded-[32px] p-8 max-w-sm w-full shadow-2xl text-center"
            onClick={e => e.stopPropagation()}
          >
            {/* Icon */}
            <div className={`w-20 h-20 rounded-[24px] bg-gradient-to-br ${gradient} flex items-center justify-center mx-auto mb-5 shadow-xl`}>
              {dailyResult?.milestone ? <Gift className="w-10 h-10 text-white" /> : <Flame className="w-10 h-10 text-white" />}
            </div>

            {/* Title */}
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">
              {dailyResult?.milestone ? "🎉 Milestone!" : "Kunlik Bonus!"}
            </h2>
            {dailyResult?.milestone && (
              <p className="text-sm font-bold text-amber-500 mb-2">{dailyResult.milestone}</p>
            )}
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              {dailyResult?.streak ?? streak} kunlik ketma-ket kirish 🔥
            </p>

            {/* Coins earned */}
            <div className={`bg-gradient-to-r ${gradient} rounded-2xl p-5 mb-6 text-white relative overflow-hidden`}>
              <div className="absolute inset-0 bg-white/10 rounded-2xl" />
              <div className="relative">
                <p className="text-[11px] font-black uppercase tracking-widest opacity-80 mb-1">Qo'shildi</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-5xl font-black">+{dailyResult?.coins_earned ?? 0}</span>
                  <div className="flex flex-col items-start">
                    <span className="text-lg font-black">EDU</span>
                    <span className="text-xs opacity-80">COIN</span>
                  </div>
                </div>
                {(dailyResult?.streak_bonus ?? 0) > 0 && (
                  <p className="text-xs opacity-80 mt-1">
                    (3 bazaviy + {dailyResult!.streak_bonus} milestone)
                  </p>
                )}
              </div>
            </div>

            {/* Streak progress dots */}
            <div className="flex justify-center gap-1.5 mb-6">
              {[7, 14, 20, 30, 90].map(day => (
                <div
                  key={day}
                  className={`flex flex-col items-center gap-1`}
                >
                  <div className={`w-2 h-2 rounded-full ${(dailyResult?.streak ?? 0) >= day ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
                  <span className="text-[8px] font-black text-slate-400">{day}</span>
                </div>
              ))}
            </div>

            <button
              onClick={closeDailyModal}
              className="w-full py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-sm hover:opacity-90 active:scale-95 transition-all"
            >
              Davom etish →
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ─── Feedback Modal (shows when EduCoin = 0) ─────────────────────
const FEEDBACK_TYPES = [
  { id: "positive", label: "Hammasi zo'r", icon: LikeIcon, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
  { id: "bug_report", label: "Xatolik topdim", icon: BugIcon, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-500/10" },
  { id: "feature_request", label: "Taklif bildiraman", icon: LightbulbIcon, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-500/10" },
  { id: "general", label: "Umumiy fikr", icon: ChatRoundIcon, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-500/10" },
];

const CATEGORIES = [
  { id: "ui_ux", label: "Design / UX" },
  { id: "content", label: "Kontent" },
  { id: "performance", label: "Tezlik / Ishlash" },
  { id: "bug", label: "Xato / Bug" },
  { id: "payment", label: "To'lov tizimi" },
  { id: "other", label: "Boshqa" },
];

export const FeedbackModal = () => {
  const { showFeedbackModal, closeFeedbackModal, submitFeedback } = useEduCoin();
  const [type, setType] = useState(FEEDBACK_TYPES[0].id);
  const [category, setCategory] = useState(CATEGORIES[0].id);
  const [message, setMessage] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!showFeedbackModal) return;
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            setImageFile(file);
            toast.success("Screenshot nusxalindi! 📸");
            break;
          }
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [showFeedbackModal]);

  const selectedType = FEEDBACK_TYPES.find(t => t.id === type);

  const handleSubmit = async () => {
    if (!type || !category || message.length < 5) return;
    setSubmitting(true);
    let imageUrl = "";
    if (imageFile) {
       const ext = imageFile.name.split('.').pop();
       const fileName = `${Date.now()}.${ext}`;
        const { data, error } = await supabase.storage.from("feedback_images").upload(fileName, imageFile);
        if (!error && data) {
          imageUrl = getStoragePublicUrl("feedback_images", fileName);
        }
    }
    await submitFeedback(type, category, message, undefined, imageUrl || undefined);
    setSubmitting(false);
    setType(FEEDBACK_TYPES[0].id); setCategory(""); setMessage(""); setImageFile(null);
  };

  return (
    <AnimatePresence>
      {showFeedbackModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="bg-white dark:bg-slate-900 rounded-[28px] max-w-[calc(100vw-24px)] sm:max-w-[420px] w-full shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10">
               <div>
                  <h2 className="font-black text-slate-900 dark:text-white text-base sm:text-lg flex items-center gap-2">
                     <DangerIcon className="w-5 h-5 text-rose-500" /> Fikr qoldirish
                  </h2>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">Batafsil ma'lumot bering, biz esa xatoni to'g'rilaymiz!</p>
               </div>
               <button onClick={closeFeedbackModal} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 transition-colors">
                 <X className="w-4 h-4" />
               </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6">
              {/* Type Selection */}
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Nima haqida yozmoqchisiz?</p>
                <div className="flex flex-wrap gap-2">
                  {FEEDBACK_TYPES.map(ft => (
                    <button
                      key={ft.id}
                      onClick={() => setType(ft.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${type === ft.id ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'}`}
                    >
                      <ft.icon className="w-3.5 h-3.5" />
                      {ft.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Selection */}
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Kategoriya</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setCategory(c.id)}
                      className={`px-3 py-2 rounded-xl text-[11px] font-bold border transition-all ${category === c.id ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'}`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                 <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Xabaringiz</p>
                 <textarea
                   value={message}
                   onChange={e => setMessage(e.target.value)}
                   placeholder="Muammoni yoki taklifni batafsil yozing..."
                   rows={4}
                   className="w-full text-sm font-medium border-2 border-slate-100 dark:border-slate-800 rounded-[16px] px-4 py-3 focus:ring-0 focus:border-violet-500 outline-none resize-none bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 transition-colors"
                 />
                 <p className="text-[10px] text-slate-400 mt-1.5">{message.length}/300 belgi (min: 5)</p>
              </div>

              {/* Image Upload */}
              <div>
                 <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Rasm (Ixtiyoriy)</p>
                 <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={e => { if (e.target.files?.[0]) setImageFile(e.target.files[0]); }} />
                 {imageFile ? (
                   <div className="relative inline-block">
                     <img src={URL.createObjectURL(imageFile)} className="h-20 w-auto rounded-xl object-cover border border-slate-200" alt="upload preview" />
                     <button onClick={() => setImageFile(null)} className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-full"><X className="w-3 h-3" /></button>
                   </div>
                 ) : (
                   <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-700 hover:border-slate-400 transition-colors text-xs font-bold">
                     <ImagePlus className="w-4 h-4" /> Screenshot yuklash
                   </button>
                 )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 pt-0 mt-auto">
               <button
                 onClick={handleSubmit}
                 disabled={!category || message.length < 5 || submitting}
                 className="w-full h-12 flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[14px] font-black text-sm disabled:opacity-40 hover:bg-slate-800 dark:hover:bg-slate-100 active:scale-95 transition-all"
               >
                 {submitting ? "Yuborilmoqda..." : "Yuborish"}
               </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
