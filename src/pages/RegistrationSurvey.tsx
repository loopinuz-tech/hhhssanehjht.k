import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import Logo from "@/components/layout/Logo";
import { ModeToggle } from "@/components/ModeToggle";
import { PaymentModal } from "@/components/PaymentModal";
import { TargetIcon } from "@solar-icons/react/bold-duotone/target";
import { CheckCircleIcon } from "@solar-icons/react/bold-duotone/check-circle";
import { AltArrowLeftIcon } from "@solar-icons/react/bold-duotone/alt-arrow-left";
import { CalculatorMinimalisticIcon } from "@solar-icons/react/bold-duotone/calculator-minimalistic";
import { BoltIcon } from "@solar-icons/react/bold-duotone/bolt";
import { BookMinimalisticIcon } from "@solar-icons/react/bold-duotone/book-minimalistic";
import { DropperIcon } from "@solar-icons/react/bold-duotone/dropper";
import { DnaIcon as DNAIcon } from "@solar-icons/react/bold-duotone/dna";
import { BuildingsIcon } from "@solar-icons/react/bold-duotone/buildings";
import { SquareAcademicCapIcon } from "@solar-icons/react/bold-duotone/square-academic-cap";
import { CupIcon } from "@solar-icons/react/bold-duotone/cup";
import { PulseIcon as ActivityIcon } from "@solar-icons/react/bold-duotone/pulse";
import { AltArrowRightIcon } from "@solar-icons/react/bold-duotone/alt-arrow-right";
import { CrownIcon } from "@solar-icons/react/bold-duotone/crown";
import { CloseCircleIcon } from "@solar-icons/react/bold-duotone/close-circle";
import { StarsIcon } from "@solar-icons/react/bold-duotone/stars";
import { Book2Icon } from "@solar-icons/react/bold-duotone/book-2";
import { MedalStarIcon as AwardIcon } from "@solar-icons/react/bold-duotone/medal-star";
import { ClockCircleIcon } from "@solar-icons/react/bold-duotone/clock-circle";
import { FlameIcon } from "@solar-icons/react/bold-duotone/flame";
import { ShieldCheckIcon } from "@solar-icons/react/bold-duotone/shield-check";
import { GraphUpIcon as TrendingUpIcon } from "@solar-icons/react/bold-duotone/graph-up";
import { StarIcon } from "@solar-icons/react/bold-duotone/star";
import { CompassIcon } from "@solar-icons/react/bold-duotone/compass";
import { GlobeIcon } from "@solar-icons/react/bold-duotone/globe";
import { ScaleIcon } from "@solar-icons/react/bold-duotone/scale";
import { RocketIcon } from "@solar-icons/react/bold-duotone/rocket";
import { CupFirstIcon } from "@solar-icons/react/bold-duotone/cup-first";
import { CalendarIcon } from "@solar-icons/react/bold-duotone/calendar";

/* ── Background Component with Dark Mode Support ────────────────── */
function OrbBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-white dark:bg-[#0b0f19] transition-colors duration-300">
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-red-500/5 dark:bg-red-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
    </div>
  );
}

/* ── AI Personal Plan Calculation Component ─────── */
function AiPlanGeneratorStep({ onComplete, fullName }: { onComplete: () => void; fullName?: string }) {
  const [stage, setStage] = useState(0);
  const firstName = fullName?.trim() ? fullName.trim().split(" ")[0] : "";

  const stages = [
    { title: "Bilim darajasi va tanlangan fan tahlil qilinmoqda...", desc: "Boshlang'ich natija hamda maqsadli ball solishtirildi" },
    { title: "DTM va Milliy sertifikat test bazasi saralanmoqda...", desc: "10,000+ real testlar orasidan eng moslari tanlandi" },
    { title: "Shaxsiy kunlik streak va intensivlik jadvali tuzilmoqda...", desc: "Optimal dars davomiyligi belgilandi" },
    { title: "AI-Repetitor tavsiyalari tayyor bo'ldi! ✨", desc: "O'quv rejangiz muvaffaqiyatli shakllantirildi" },
  ];

  useEffect(() => {
    const timer1 = setTimeout(() => setStage(1), 700);
    const timer2 = setTimeout(() => setStage(2), 1500);
    const timer3 = setTimeout(() => setStage(3), 2300);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <div className="space-y-8 text-center py-6">
      <div className="relative inline-flex items-center justify-center">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#E8192C] to-indigo-600 p-0.5 shadow-2xl shadow-red-500/20 animate-pulse">
          <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[22px] flex items-center justify-center">
            <StarsIcon className="w-12 h-12 text-[#E8192C] animate-spin" style={{ animationDuration: "6s" }} />
          </div>
        </div>
        <motion.div
          animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute -inset-4 rounded-full bg-red-500/20 blur-xl pointer-events-none"
        />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          {firstName ? `${firstName} uchun shaxsiy AI reja tuzilmoqda ✨` : "Siz uchun shaxsiy AI reja tuzilmoqda ✨"}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Sun'iy intellekt sizning maqsadingizga moslashtirilgan mukammal o'quv dasturini shakllantirmoqda
        </p>
      </div>

      <div className="max-w-md mx-auto space-y-3 text-left bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
        {stages.map((stg, i) => {
          const isDone = stage > i;
          const isCurrent = stage === i;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: stage >= i ? 1 : 0.4, x: 0 }}
              className="flex items-start gap-3.5 p-2.5 rounded-xl transition-all"
            >
              <div className="mt-0.5 shrink-0">
                {isDone ? (
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center">
                    <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                ) : isCurrent ? (
                  <div className="w-6 h-6 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center animate-spin">
                    <div className="w-2 h-2 rounded-full bg-[#E8192C]" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-400">
                    {i + 1}
                  </div>
                )}
              </div>
              <div className="space-y-0.5">
                <div className={`text-xs font-bold ${isDone ? "text-emerald-700 dark:text-emerald-400" : isCurrent ? "text-slate-900 dark:text-white" : "text-slate-400"}`}>
                  {stg.title}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  {stg.desc}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="pt-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={stage < 3}
          onClick={onComplete}
          className={`px-8 py-3.5 rounded-2xl text-sm font-bold transition-all shadow-xl cursor-pointer ${
            stage >= 3
              ? "bg-gradient-to-r from-[#E8192C] to-red-600 text-white shadow-red-500/30 hover:shadow-red-500/50"
              : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed"
          }`}
        >
          {stage >= 3 ? "Tayyor! Rejani ko'rish" : "AI hisoblamoqda..."}
        </motion.button>
      </div>
    </div>
  );
}

/* ── Mystery Box Discount Spinner Component (Step 9 - Magic 4-Tap Unboxing) ── */
function MysteryBoxStep({ onComplete }: { onComplete: () => void }) {
  const [gameState, setGameState] = useState<"idle" | "spinning" | "tapping" | "revealed">("idle");
  const [selectedBoxIndex, setSelectedBoxIndex] = useState<number>(1);
  const [tapCount, setTapCount] = useState<number>(0);

  const initialBoxes = [
    { id: "green", name: "Zümrad Quti", img: "/greenbox.png", color: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30", glow: "shadow-emerald-500/50" },
    { id: "red", name: "Qizil Quti", img: "/redbox.png", color: "from-red-500/20 to-rose-500/20 border-red-500/30", glow: "shadow-red-500/50" },
    { id: "blue", name: "Moviy Quti", img: "/bluebox.png", color: "from-blue-500/20 to-indigo-500/20 border-blue-500/30", glow: "shadow-indigo-500/50" },
  ];

  const [boxList, setBoxList] = useState(initialBoxes);

  // Start spinning animation with 3D slot position swapping (1 -> 2, 2 -> 3, 3 -> 1)
  const handleStartSpin = () => {
    if (gameState !== "idle") return;
    setGameState("spinning");

    let shiftCount = 0;
    const interval = setInterval(() => {
      shiftCount++;
      // Physical position swapping array shift
      setBoxList((prev) => [prev[2], prev[0], prev[1]]);

      if (shiftCount >= 14) {
        clearInterval(interval);
        setTimeout(() => {
          const chosen = Math.floor(Math.random() * 3);
          setSelectedBoxIndex(chosen);
          setGameState("tapping");
        }, 400);
      }
    }, 180);
  };

  // Tap handler for the floating winning box (requires 4 taps to open)
  const handleBoxTap = () => {
    if (gameState !== "tapping") return;

    const nextTap = tapCount + 1;
    setTapCount(nextTap);

    if (nextTap >= 4) {
      setTimeout(() => {
        setGameState("revealed");
      }, 500);
    }
  };

  const winningBox = initialBoxes[selectedBoxIndex];

  return (
    <div className="space-y-8 max-w-2xl mx-auto text-center py-4 relative">
      {/* Background Ambient Magic Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/15 dark:bg-amber-500/20 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Header */}
      <div className="space-y-3">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-black uppercase tracking-wider"
        >
          <StarsIcon className="w-4 h-4 text-amber-500" />
          <span>Faqat 1 ta imkoniyat!</span>
        </motion.div>

        <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight flex items-center justify-center gap-2">
          {gameState === "idle" && (
            <span>Omadingizni sinang! Qutilarni ilohiy aylantiring</span>
          )}
          {gameState === "spinning" && (
            <span>Qutilar o'rin almashtirib aylanmoqda...</span>
          )}
          {gameState === "tapping" && (
            <span>Qutining ustiga 4 marta bosing!</span>
          )}
          {gameState === "revealed" && (
            <span>Tabriklaymiz! 50% Chegirma Ochildi!</span>
          )}
          {gameState === "revealed" ? (
            <AwardIcon className="w-7 h-7 text-amber-500 shrink-0 inline-block ml-1" />
          ) : (
            <StarsIcon className="w-7 h-7 text-amber-500 shrink-0 inline-block ml-1" />
          )}
        </h2>

        <p className="text-xs sm:text-base text-slate-500 dark:text-slate-400 font-medium max-w-md mx-auto">
          {gameState === "idle" && "«Omadni sinash» tugmasini bosing, qutilar joy almashadi va quti 4 marta bosib ochiladi!"}
          {gameState === "spinning" && "1-quti 2-o'ringa, 2-quti 3-o'ringa o'tib aylanmoqda..."}
          {gameState === "tapping" && `Chegirmani ochish uchun quti ustiga yana ${4 - tapCount} marta bosing!`}
          {gameState === "revealed" && "Barcha obuna tariflari siz uchun 50% ga arzonlashtirildi!"}
        </p>
      </div>

      {/* PHASE 1 & 2: IDLE or SPINNING (3 Boxes Swapping Carousel) */}
      {(gameState === "idle" || gameState === "spinning") && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2 items-center">
            {boxList.map((box, idx) => (
              <motion.div
                key={box.id}
                layout
                transition={
                  gameState === "spinning"
                    ? { layout: { duration: 0.16, ease: "easeInOut" } }
                    : { layout: { duration: 0.3 } }
                }
                animate={
                  gameState === "spinning"
                    ? {
                        rotateY: [0, 180, 360],
                        scale: [1, 1.15, 0.92, 1],
                      }
                    : { y: [0, -8, 0] }
                }
                className={`p-6 rounded-3xl border bg-gradient-to-b ${box.color} bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-xl flex flex-col items-center justify-center gap-4`}
              >
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <img
                    src={box.img}
                    alt={box.name}
                    className={`w-full h-full object-contain drop-shadow-2xl ${
                      gameState === "spinning" ? "animate-pulse" : ""
                    }`}
                  />
                </div>
                <div className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <StarsIcon className="w-4 h-4 text-amber-500" />
                  <span>{box.name}</span>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={gameState === "spinning"}
            onClick={handleStartSpin}
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white text-base font-black shadow-xl shadow-amber-500/30 hover:shadow-amber-500/50 transition-all cursor-pointer uppercase tracking-wider flex items-center justify-center gap-2 mx-auto"
          >
            <StarsIcon className="w-5 h-5" />
            <span>{gameState === "spinning" ? "QUTILAR AYLANMOQDA..." : "OMADNI SINASH (QUTILARNI AYLANTIRISH)"}</span>
          </motion.button>
        </div>
      )}

      {/* PHASE 3: TAPPING (Selected Box Floats to Center Stage & Requires 4 Taps) */}
      {gameState === "tapping" && (
        <div className="space-y-6 pt-2">
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="flex flex-col items-center gap-4"
          >
            {/* Tap counter pill */}
            <div className="px-5 py-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-black uppercase tracking-widest shadow-lg flex items-center gap-2 animate-bounce">
              <StarsIcon className="w-4 h-4" />
              <span>BOSILDI: {tapCount} / 4</span>
            </div>

            {/* Floating Winning Box Button */}
            <motion.button
              type="button"
              onClick={handleBoxTap}
              whileTap={{ scale: 0.9, rotate: [-8, 8, -4, 4, 0] }}
              animate={
                tapCount > 0
                  ? {
                      scale: [1, 1.12, 1],
                      rotate: [-6, 6, -3, 3, 0],
                    }
                  : { y: [0, -10, 0] }
              }
              transition={tapCount > 0 ? { duration: 0.3 } : { repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              className={`p-6 sm:p-8 rounded-3xl border-2 bg-gradient-to-b ${winningBox.color} bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl shadow-2xl ${winningBox.glow} cursor-pointer relative overflow-hidden group flex flex-col items-center justify-center text-center mx-auto w-full max-w-xs sm:max-w-sm gap-4`}
            >
              {/* Outer pulsing ring */}
              <div className="absolute inset-0 bg-amber-400/20 rounded-3xl blur-xl animate-ping pointer-events-none -z-10" />

              <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center mx-auto shrink-0">
                <img
                  src={winningBox.img}
                  alt={winningBox.name}
                  className="w-full h-full object-contain drop-shadow-2xl transition-transform duration-300 group-hover:scale-105"
                />

                {/* Impact sparkle rings on tap */}
                {tapCount > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="w-36 h-36 bg-gradient-to-tr from-amber-400 to-red-500 rounded-full blur-xl opacity-60 animate-ping" />
                  </div>
                )}
              </div>

              <div className="w-full pt-3 border-t border-amber-500/20 flex items-center justify-center text-center">
                <div className="inline-flex items-center justify-center gap-2 text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  <StarsIcon className="w-5 h-5 text-amber-500 animate-spin shrink-0" />
                  <span>
                    {4 - tapCount === 4 && "USTIGA 4 MARTA BOSING!"}
                    {4 - tapCount === 3 && "USTIGA YANA 3 MARTA BOSING!"}
                    {4 - tapCount === 2 && "USTIGA YANA 2 MARTA BOSING!"}
                    {4 - tapCount === 1 && (
                      <span className="flex items-center gap-1">
                        SO'NGGI 1 MARTA BOSING! <FlameIcon className="w-4 h-4 text-amber-500 inline shrink-0" />
                      </span>
                    )}
                    {4 - tapCount <= 0 && (
                      <span className="flex items-center gap-1">
                        OCHILMOQDA... <AwardIcon className="w-4 h-4 text-amber-500 inline shrink-0" />
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </motion.button>

            <div className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1">
              {4 - tapCount === 1 ? (
                <>
                  <FlameIcon className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Deyarli ochildi! Oxirgi marta bosing!</span>
                </>
              ) : (
                <>
                  <BoltIcon className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Har safar bosganingizda quti ochilishga yaqinlashadi! (Yana {4 - tapCount} marta)</span>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* PHASE 4: REVEALED (Confetti & 50% Discount Unlocked) */}
      {gameState === "revealed" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white/95 dark:bg-slate-900/95 border-2 border-amber-500/40 p-8 rounded-3xl shadow-2xl space-y-6 max-w-md mx-auto relative overflow-hidden backdrop-blur-2xl"
        >
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-red-500 to-rose-500" />

          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-400 to-amber-200 border-4 border-white dark:border-slate-800 flex items-center justify-center mx-auto shadow-2xl animate-bounce">
            <AwardIcon className="w-12 h-12 text-amber-950" />
          </div>

          <div className="space-y-2">
            <span className="bg-red-500/10 text-[#E8192C] text-xs font-black uppercase px-3 py-1 rounded-full border border-red-500/20">
              50% MAXSUS CHEGIRMA!
            </span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              TABRIKLAYMIZ! YUTIB OLDINGIZ!
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
              Siz tanlagan <strong>{winningBox.name}</strong>dan <strong>50% maxsus chegirma</strong> chiqdi! Barcha tariflar siz uchun 2 barobar arzonlashtirildi.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-r from-red-500/10 to-amber-500/10 border border-red-500/20 flex items-center justify-between text-xs font-extrabold">
            <span className="text-slate-600 dark:text-slate-400">Yutib olingan mukofot:</span>
            <span className="text-[#E8192C] font-black text-sm bg-[#E8192C] text-white px-3 py-1 rounded-xl shadow-md">
              -50% CHEGIRMA
            </span>
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onComplete}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#E8192C] via-red-600 to-rose-600 text-white text-sm font-black shadow-xl shadow-red-500/30 hover:shadow-red-500/50 transition-all cursor-pointer uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <span>CHEGIRMANI ISHLATISH VA REJANI KO'RISH</span>
            <AltArrowRightIcon className="w-4 h-4" />
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}

/* ── Subscription Step Component (Step 10) ── */
function SubscriptionStep({
  onSelect,
  submitting,
  form,
}: {
  onSelect: (tier: string, amount?: number, title?: string) => void;
  submitting: boolean;
  form?: any;
}) {
  const [selectedTier, setSelectedTier] = useState<string>("premium");
  const [dbPrices, setDbPrices] = useState<{ standart: number; premium: number; pro: number }>({
    standart: 0,
    premium: 49000,
    pro: 99000,
  });

  useEffect(() => {
    async function fetchDbPricing() {
      try {
        const { data, error } = await (supabase as any).from("admin_settings").select("key, value");
        if (!error && data) {
          const map: Record<string, number> = {};
          data.forEach((item: { key: string; value: string }) => {
            if (item.key && item.value) {
              map[item.key] = Number(item.value);
            }
          });
          setDbPrices({
            standart: map["standart_price"] ?? 0,
            premium: map["premium_price"] ?? 49000,
            pro: map["pro_price"] ?? 99000,
          });
        }
      } catch (err) {
        console.error("Error fetching database pricing:", err);
      }
    }
    fetchDbPricing();
  }, []);

  const firstName = form?.full_name?.trim() ? form.full_name.trim().split(" ")[0] : "";
  const goalText = form?.main_goal === "Sertifikat olish" ? "Milliy sertifikat" : "DTM";

  const formatPrice = (amount: number) => {
    if (amount === 0) return "0 so'm (BEPUL)";
    return `${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} so'm`;
  };

  const plans = [
    {
      id: "standart",
      title: "1 OY (SINOV)",
      price: "10 000 so'm",
      oldPrice: "20 000 so'm", // 20 000 so'm ustidan chizilgan!
      dailyPrice: "330",
      badge: "SINOV TARIFI (50%)",
      badgeBg: "bg-gradient-to-r from-emerald-500 to-teal-600 shadow-emerald-500/30",
      activeCard: "bg-emerald-50/40 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500 shadow-xl shadow-emerald-500/20",
      radioActive: "border-emerald-500 bg-emerald-500",
      priceText: "text-emerald-600 dark:text-emerald-400",
      savingPill: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
      savingText: "20 000 so'm o'rniga 10 000 so'm — 50% chegirmali sinov",
    },
    {
      id: "premium",
      title: "PRO TARIF",
      price: formatPrice(dbPrices.premium),
      oldPrice: formatPrice(dbPrices.premium * 2), // Doubled crossed-out price!
      dailyPrice: Math.round(dbPrices.premium / 30).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " "),
      badge: "50% CHEGIRMA BILAN",
      badgeBg: "bg-gradient-to-r from-[#E8192C] to-rose-600 shadow-red-500/30",
      activeCard: "bg-red-50/40 dark:bg-red-950/40 border-[#E8192C] ring-2 ring-red-500 shadow-xl shadow-red-500/25",
      radioActive: "border-[#E8192C] bg-[#E8192C]",
      priceText: "text-[#E8192C] dark:text-red-400",
      savingPill: "bg-red-500/10 border-red-500/20 text-[#E8192C]",
      savingText: `50% chegirma qo'llanildi (asli ${formatPrice(dbPrices.premium * 2)})`,
    },
    {
      id: "pro",
      title: "PREMIUM TARIF",
      price: formatPrice(dbPrices.pro),
      oldPrice: formatPrice(dbPrices.pro * 2), // Doubled crossed-out price!
      dailyPrice: Math.round(dbPrices.pro / 30).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " "),
      badge: "MAKSIMAL (-50%)",
      badgeBg: "bg-gradient-to-r from-indigo-600 to-purple-600 shadow-indigo-500/30",
      activeCard: "bg-indigo-50/40 dark:bg-indigo-950/40 border-indigo-600 ring-2 ring-indigo-500 shadow-xl shadow-indigo-500/20",
      radioActive: "border-indigo-600 bg-indigo-600",
      priceText: "text-indigo-600 dark:text-indigo-400",
      savingPill: "bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400",
      savingText: `50% chegirma qo'llanildi (asli ${formatPrice(dbPrices.pro * 2)})`,
    },
  ];

  return (
    <div className="space-y-6 max-w-3xl mx-auto py-2">
      {/* Hero Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          {firstName ? `${firstName}, o'zingizga mos tarifni tanlang` : "O'zingizga mos tarifni tanlang"}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          AI yordamchi, mock testlar, olimpiadalar va EduCoin tizimi — barchasi bir joyda
        </p>
      </div>

      {/* Features summary list */}
      <div className="max-w-md mx-auto space-y-2.5 text-left bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        {[
          { icon: Book2Icon, text: "AI yordamchi bilan suhbat, masala yechish va insho tekshirish", color: "text-amber-500" },
          { icon: TargetIcon, text: "SAT, IELTS va Milliy sertifikat mock testlari — to'liq tayyorgarlik", color: "text-[#E8192C]" },
          { icon: SquareAcademicCapIcon, text: "Jonli olimpiadalar va naqd sovrinli musobaqalar", color: "text-blue-500" },
          { icon: CheckCircleIcon, text: "EduCoin yig'ing, do'st taklif qiling — bonus oling", color: "text-emerald-500" },
        ].map((feat, idx) => {
          const SolarFeatIcon = feat.icon;
          return (
            <div key={idx} className="flex items-center gap-3 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
              <SolarFeatIcon className={`w-4 h-4 ${feat.color} shrink-0`} />
              <span>{feat.text}</span>
            </div>
          );
        })}
      </div>

      {/* 3 Tariff Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {plans.map((plan) => (
          <motion.button
            key={plan.id}
            whileHover={{ y: -3 }}
            type="button"
            onClick={() => setSelectedTier(plan.id)}
            className={`p-5 rounded-3xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
              selectedTier === plan.id
                ? plan.activeCard
                : "bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-300 shadow-sm"
            }`}
          >
            {plan.badge && (
              <div className="absolute -top-3.5 left-0 right-0 flex justify-center pointer-events-none z-10">
                <span className={`text-white text-[9px] font-black uppercase px-3.5 py-1 rounded-full shadow-lg tracking-wider whitespace-nowrap ${plan.badgeBg}`}>
                  {plan.badge}
                </span>
              </div>
            )}

            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-400 tracking-wider">{plan.title}</span>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                  selectedTier === plan.id ? plan.radioActive : "border-slate-300 dark:border-slate-700"
                }`}>
                  {selectedTier === plan.id && <CheckCircleIcon className="w-4 h-4 text-white" />}
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="text-xs text-slate-400 line-through font-bold">{plan.oldPrice}</div>
                <div className={`text-xl font-black ${plan.priceText}`}>
                  {plan.price}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className={`text-2xl font-black ${plan.priceText}`}>
                  {plan.dailyPrice}
                </div>
                <div className="text-xs font-bold text-slate-400">so'm / kun</div>
              </div>

              {plan.savingText && (
                <div className={`p-2 rounded-xl border text-[10px] font-bold leading-tight ${plan.savingPill}`}>
                  {plan.savingText}
                </div>
              )}
            </div>
          </motion.button>
        ))}
      </div>

      {/* CTA Buttons */}
      <div className="space-y-3 pt-2 text-center max-w-sm sm:max-w-md mx-auto">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={submitting}
          onClick={() => {
            const selectedPlan = plans.find((p) => p.id === selectedTier);
            let amt = 0;
            if (selectedTier === "standart") amt = 10000;
            else if (selectedTier === "premium") amt = dbPrices.premium;
            else if (selectedTier === "pro") amt = dbPrices.pro;

            const titleStr = selectedPlan ? `${selectedPlan.title} obuna to'lovi` : "Obuna to'lovi";
            onSelect(selectedTier, amt, titleStr);
          }}
          className={`w-full py-4 rounded-2xl text-white text-xs sm:text-sm font-black shadow-lg transition-all cursor-pointer uppercase tracking-wider flex items-center justify-center gap-2 ${
            selectedTier === "standart"
              ? "bg-gradient-to-r from-emerald-500 to-teal-600 shadow-emerald-500/25 hover:shadow-emerald-500/40"
              : "bg-gradient-to-r from-[#E8192C] to-red-600 shadow-red-500/25 hover:shadow-red-500/40"
          }`}
        >
          <span>{submitting ? "Saqlanmoqda..." : "REJANI OLISH VA BOSHLASH"}</span>
          <AltArrowRightIcon className="w-4 h-4" />
        </motion.button>

        {/* Secondary Free Skip Button */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          type="button"
          disabled={submitting}
          onClick={() => onSelect("standart", 0, "Standart rejim")}
          className="w-full py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span>O'tkazib yuborish (Standart bepul rejim)</span>
          <AltArrowRightIcon className="w-3.5 h-3.5" />
        </motion.button>

        <div className="flex items-center justify-center gap-3 pt-1">
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
            <ShieldCheckIcon className="w-4 h-4 text-emerald-500" /> Xavfsiz to'lov
          </span>
          <img src="/click.png" alt="Click" className="h-6 w-auto object-contain" />
        </div>

        {/* 100% Money-back guarantee */}
        <div className="mt-3 flex items-center gap-3 bg-emerald-50 dark:bg-slate-800/80 border border-emerald-200 dark:border-slate-700 rounded-2xl px-4 py-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
            <ShieldCheckIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-left">
            <p className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Pulingiz 100% qaytariladi</p>
            <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium leading-tight mt-0.5">
              Birinchi 3 kun ichida mamnun bo'lmasangiz — to'liq qaytaramiz. Hech qanday savol yo'q.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main Registration / Onboarding Page ────────────────── */
export default function RegistrationSurvey() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [examMonthFilter, setExamMonthFilter] = useState<string>("all");
  const [showAllExams, setShowAllExams] = useState<boolean>(false);
  const [activeLevelTab, setActiveLevelTab] = useState<string>("");

  const [form, setForm] = useState<{
    full_name: string;
    avatar_url: string;
    main_goal: string;
    target_subject: string;
    target_subjects: string[];
    current_level: string;
    subject_levels: Record<string, string>;
    study_hours: string;
    study_days: string[];
    mock_test_day: string;
    target_date_label: string;
    target_date_labels: string[];
    target_score: number;
    exact_date: string;
  }>({
    full_name: "",
    avatar_url: "/1.png",
    main_goal: "",
    target_subject: "",
    target_subjects: [],
    current_level: "B",
    subject_levels: {},
    study_hours: "30 min/day",
    study_days: ["Du", "Se", "Cho", "Pay", "Ju", "Sha"],
    mock_test_day: "Yak",
    target_date_label: "3m",
    target_date_labels: [],
    target_score: 140,
    exact_date: "",
  });

  const { stepSlug } = useParams<{ stepSlug?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  // Helper to parse step number (0-indexed) from string like "step-1", "step1", "1"
  const parseStepFromParam = (val?: string | null): number | null => {
    if (!val) return null;
    const match = val.match(/(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num >= 1 && num <= 9) return num - 1;
    }
    return null;
  };

  // Sync initial step from URL param on mount
  useEffect(() => {
    const urlStep = parseStepFromParam(stepSlug) ?? parseStepFromParam(searchParams.get("step"));
    if (urlStep !== null) {
      setStep(urlStep);
    }
  }, []);

  // Update URL whenever step state changes
  useEffect(() => {
    const stepParam = `step-${step + 1}`;
    if (searchParams.get("step") !== stepParam) {
      setSearchParams({ step: stepParam }, { replace: true });
    }
  }, [step, setSearchParams, searchParams]);

  useEffect(() => {
    if (user) {
      const metaName = user.user_metadata?.full_name || user.user_metadata?.name || "";
      if (metaName && !form.full_name) {
        setForm((prev) => ({ ...prev, full_name: metaName }));
      }
    }
  }, [user]);

  const handleToggleSubject = (subValue: string) => {
    const current = form.target_subjects || [];
    let updated: string[];
    if (current.includes(subValue)) {
      updated = current.filter((s) => s !== subValue);
    } else {
      updated = [...current, subValue];
    }
    setForm({
      ...form,
      target_subjects: updated,
      target_subject: updated.join(", "),
    });
  };

  const handleToggleExamDate = (dateId: string) => {
    const current = form.target_date_labels || [];
    let updated: string[];
    if (current.includes(dateId)) {
      updated = current.filter((id) => id !== dateId);
    } else {
      updated = [...current, dateId];
    }
    setForm({
      ...form,
      target_date_labels: updated,
      target_date_label: updated.length > 0 ? updated[0] : dateId,
      exact_date: "",
    });
  };

  const steps = [
    { title: "Ismingiz", desc: "Shaxsiy ismingiz" },
    { title: "Profil rasmi", desc: "Avatar tanlang" },
    { title: "Maqsad", desc: "Yo'nalishingiz" },
    { title: "Asosiy fan", desc: "Fan tanlang" },
    {
      title: form.main_goal === "Universitetga kirish"
        ? "Maqsad ball"
        : (form.main_goal === "Sertifikat olish" ? "Imtihon sanasi" : "Maqsad ball"),
      desc: form.main_goal === "Universitetga kirish"
        ? "DTM maqsadli ball"
        : (form.main_goal === "Sertifikat olish" ? "Imtihon muddati" : "Maqsadli natija"),
    },
    { title: "Daraja", desc: "Bilim darajasi" },
    { title: "Rejim", desc: "Kunlik vaqt" },
    { title: "AI Reja", desc: "O'quv rejasi" },
    { title: "Chegirma", desc: "Sirli sovg'a qutisi" },
    { title: "Obuna", desc: "Rejani tanlang" },
  ];

  const avatarOptions = [
    { id: "1", url: "/1.png", label: "Mascot 1", desc: "Akademik Mascot" },
    { id: "2", url: "/2.png", label: "Mascot 2", desc: "Ekspert Mascot" },
    { id: "3", url: "/3.png", label: "Mascot 3", desc: "AQSH & Milliy Mascot" },
    { id: "5", url: "/5.png", label: "Mascot 4", desc: "Bitiruvchi Mascot" },
  ];

  const goals = [
    {
      value: "Universitetga kirish",
      title: "OTM Imtihonlariga tayyorgarlik",
      desc: "DTM kirish imtihonlari va blok testlarga tayyorlanish",
      dateBadge: "Iyul 2027 / Avgust 2027",
      icon: SquareAcademicCapIcon,
      color: "from-red-500 to-rose-600"
    },
    {
      value: "Sertifikat olish",
      title: "Milliy va Xalqaro Sertifikat",
      desc: "CEFR, IELTS yoki Milliy sertifikatdan yuqori ball olish",
      dateBadge: "Fan tanlangach BBA imtihon sanalari chiqadi",
      icon: TargetIcon,
      color: "from-blue-500 to-indigo-600"
    },
    {
      value: "Olimpiada",
      title: "Fan Olimpiadalari",
      desc: "Maktab, viloyat va respublika olimpiadalariga tayyorgarlik",
      dateBadge: "Noyabr – Mart oylari",
      icon: CupIcon,
      color: "from-amber-500 to-orange-600"
    },
    {
      value: "O'z ustimda ishlash",
      title: "Bilimni oshirish",
      desc: "Fanlar bo'yicha bilimlarni mustahkamlash va sinash",
      dateBadge: "Erkin intensiv jadval",
      icon: ActivityIcon,
      color: "from-emerald-500 to-teal-600"
    },
  ];

  const subjects = [
    { value: "Matematika", icon: CalculatorMinimalisticIcon, desc: "Mantiq, Algebra va Geometriya", color: "from-indigo-500 to-purple-600" },
    { value: "Ona tili", icon: BookMinimalisticIcon, desc: "Grammatika, Imlo va Adabiyot", color: "from-emerald-500 to-teal-600" },
    { value: "Fizika", icon: BoltIcon, desc: "Mexanika, Optika, Elektr va Kvant", color: "from-amber-500 to-orange-600" },
    { value: "Ingliz tili", icon: GlobeIcon, desc: "Grammar, Reading va Listening", color: "from-cyan-500 to-blue-600" },
    { value: "Kimyo", icon: DropperIcon, desc: "Anorganik va Organik kimyo", color: "from-rose-500 to-pink-600" },
    { value: "Biologiya", icon: DNAIcon, desc: "Botanika, Zologiya va Genetika", color: "from-green-500 to-emerald-600" },
    { value: "Tarix", icon: BuildingsIcon, desc: "O'zbekiston va Jahon tarixi", color: "from-yellow-500 to-amber-600" },
    { value: "Geografiya", icon: CompassIcon, desc: "Tabiiy va Iqtisodiy geografiya", color: "from-sky-500 to-indigo-600" },
    { value: "Huquq", icon: ScaleIcon, desc: "Konstitutsiya va Huquqshunoslik", color: "from-violet-500 to-purple-600" },
  ];

  const studyCommitments = [
    {
      value: "15 min/day",
      title: "Yengil rejim",
      icon: BoltIcon,
      time: "15 daqiqa / kun",
      desc: "Shoshmasdan, barqaror odat shakllantirish uchun",
      streak: "+10 XP kuniga",
    },
    {
      value: "30 min/day",
      title: "Balanslashgan",
      icon: FlameIcon,
      time: "30 daqiqa / kun",
      desc: "Tavsiya etiladi! Ideal muvozanat va dars samaradorligi",
      streak: "+25 XP kuniga",
      popular: true,
    },
    {
      value: "1 hour/day",
      title: "Intensiv rejim",
      icon: RocketIcon,
      time: "1 soat / kun",
      desc: "Qisqa muddatda maksimal natijaga erishish",
      streak: "+50 XP kuniga",
    },
    {
      value: "2+ hours/day",
      title: "Chempion rejim",
      icon: CupFirstIcon,
      time: "2+ soat / kun",
      desc: "Grant o'rinlari va top OTMlarga kirish uchun",
      streak: "+100 XP kuniga",
    },
  ];

  const targetHorizons = [
    { label: "1m", title: "1 Oy", desc: "Tezkor takrorlash va test mashqlari" },
    { label: "3m", title: "3 Oy", desc: "Intensiv tayyorgarlik kursi" },
    { label: "6m", title: "6 Oy", desc: "Tizimli va mukammal o'rganish" },
    { label: "12m", title: "1 Yil", desc: "Noldan bosqichma-bosqich o'rganish" },
  ];

  const milliySertifikatExamList = [
    // Sentabr 2026
    { id: "sen_musiqa", date: "25-sentabr 2026", subject: "Musiqa madaniyati", month: "Sentabr", reg: "21-avgust – 4-sentabr", type: "ELEKTRON" },
    { id: "sen_bio", date: "26-sentabr 2026", subject: "Biologiya", month: "Sentabr", reg: "21-avgust – 4-sentabr" },
    { id: "sen_chem", date: "27-sentabr 2026", subject: "Kimyo", month: "Sentabr", reg: "21-avgust – 4-sentabr" },
    { id: "sen_math", date: "28 – 29-sentabr 2026", subject: "Matematika", month: "Sentabr", reg: "21-avgust – 4-sentabr" },
    { id: "sen_phys", date: "29-sentabr 2026", subject: "Fizika", month: "Sentabr", reg: "21-avgust – 4-sentabr", type: "ELEKTRON" },

    // Oktabr 2026
    { id: "okt_geog", date: "23-oktabr 2026", subject: "Geografiya", month: "Oktabr", reg: "18-sentabr – 2-oktabr", type: "ELEKTRON" },
    { id: "okt_lang", date: "24 – 26-oktabr 2026", subject: "Ona tili va adabiyot", month: "Oktabr", reg: "18-sentabr – 2-oktabr" },
    { id: "okt_hist", date: "27-oktabr 2026", subject: "Tarix", month: "Oktabr", reg: "18-sentabr – 2-oktabr" },

    // Noyabr 2026
    { id: "noy_elem", date: "20-noyabr 2026", subject: "Boshlang'ich ta'lim o'qituvchilari", month: "Noyabr", reg: "22-oktabr – 5-noyabr", type: "ELEKTRON" },
    { id: "noy_bio", date: "21-noyabr 2026", subject: "Biologiya", month: "Noyabr", reg: "16-oktabr – 30-oktabr" },
    { id: "noy_chem", date: "22-noyabr 2026", subject: "Kimyo", month: "Noyabr", reg: "16-oktabr – 30-oktabr" },
    { id: "noy_math", date: "23 – 24-noyabr 2026", subject: "Matematika", month: "Noyabr", reg: "16-oktabr – 30-oktabr" },
    { id: "noy_phys", date: "24-noyabr 2026", subject: "Fizika", month: "Noyabr", reg: "16-oktabr – 30-oktabr" },
    { id: "noy_musiqa", date: "30-noyabr 2026", subject: "Musiqa madaniyati", month: "Noyabr", reg: "27-oktabr – 10-noyabr", type: "ELEKTRON" },

    // Dekabr 2026
    { id: "dek_law", date: "23-dekabr 2026", subject: "Huquqshunoslik", month: "Dekabr", reg: "17-noyabr – 4-dekabr", type: "ELEKTRON" },
    { id: "dek_geog", date: "25-dekabr 2026", subject: "Geografiya", month: "Dekabr", reg: "20-noyabr – 4-dekabr" },
    { id: "dek_lang", date: "26 – 28-dekabr 2026", subject: "Ona tili va adabiyot", month: "Dekabr", reg: "20-noyabr – 4-dekabr" },
    { id: "dek_hist", date: "29-dekabr 2026", subject: "Tarix", month: "Dekabr", reg: "20-noyabr – 4-dekabr" },
  ];

  const otmExamList = [
    { id: "otm_iyul_2027", date: "1 – 15 Iyul 2027", subject: "2027-yilgi OTM Kirish imtihonlari", month: "Iyul 2027", reg: "Qabul: 20-iyun – 20-iyul" },
    { id: "otm_avgust_2027", date: "1 – 15 Avgust 2027", subject: "2027-yilgi DTM test sinovlari & Mandat", month: "Avgust 2027", reg: "Yakuniy test & Mandat" },
  ];

  const levelProjections: Record<string, { label: string; range: string; target: string; desc: string }> = {
    "C": { label: "Boshlang'ich", range: "35% - 50%", target: "75%", desc: "Noldan fundament shakllantiramiz" },
    "C+": { label: "Poydevor", range: "50% - 65%", target: "82%", desc: "Asosiy mavzulardagi bo'shliqlarni to'ldiramiz" },
    "B": { label: "O'rta", range: "65% - 78%", target: "88%", desc: "Test yechish tezligi va aniqligini oshiramiz" },
    "B+": { label: "Yaxshi", range: "78% - 87%", target: "94%", desc: "Murakkab savollar va vaqt nazoratini kuchaytiramiz" },
    "A": { label: "Yuqori", range: "87% - 94%", target: "98%", desc: "Grant va top reyting uchun tayyorlanamiz" },
    "A+": { label: "A'lo", range: "94% - 100%", target: "100%", desc: "Respublika darajasida 1-o'rin uchun kurashamiz" },
  };

  const cefrLevelProjections: Record<string, { label: string; range: string; target: string; desc: string }> = {
    "A1": { label: "Beginner (A1)", range: "Boshlang'ich iboralar", target: "B2", desc: "A1 darajadan B2 darajagacha noldan rivojlanish" },
    "A2": { label: "Elementary (A2)", range: "Asosiy grammatika & muloqot", target: "B2 / C1", desc: "Grammatika va so'z boyligini tizimlashtiramiz" },
    "B1": { label: "Intermediate (B1)", range: "O'rta daraja (CEFR B1)", target: "C1", desc: "Murakkab matnlar va listening mashqlari" },
    "B2": { label: "Upper-Intermediate (B2)", range: "Yuqori o'rta (CEFR B2)", target: "C1 / C2", desc: "Milliy va xalqaro sertifikatdan yuqori ball" },
    "C1": { label: "Advanced (C1)", range: "Professional (CEFR C1)", target: "C2 / 8.0+", desc: "Akademik tahlil hamda insho yozish" },
    "C2": { label: "Proficient (C2)", range: "Maksimal daraja (CEFR C2)", target: "C2 (9.0)", desc: "Respublika bo'yicha top ekspertlik darajasi" },
  };

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep((s) => s - 1);
    }
  };

  async function saveProfileData() {
    if (!user) return null;

    let targetDate: Date = new Date();
    if (form.exact_date) {
      targetDate = new Date(form.exact_date);
    } else {
      const selectedLabels = (form.target_date_labels && form.target_date_labels.length > 0)
        ? form.target_date_labels
        : [form.target_date_label];

      const dates: Date[] = [];
      for (const lbl of selectedLabels) {
        if (!lbl) continue;
        if (lbl.includes("2026-07") || lbl.includes("iyul_2026") || lbl.includes("Iyul 2026")) dates.push(new Date("2026-07-15"));
        else if (lbl.includes("2026-08") || lbl.includes("avgust_2026") || lbl.includes("Avgust 2026")) dates.push(new Date("2026-08-15"));
        else if (lbl.includes("2027-07") || lbl.includes("iyul_2027") || lbl.includes("Iyul 2027")) dates.push(new Date("2027-07-15"));
        else if (lbl.includes("2027-08") || lbl.includes("avgust_2027") || lbl.includes("Avgust 2027")) dates.push(new Date("2027-08-15"));
        else if (lbl.includes("sen_") || lbl.includes("Sentabr")) dates.push(new Date("2026-09-25"));
        else if (lbl.includes("okt_") || lbl.includes("Oktabr")) dates.push(new Date("2026-10-25"));
        else if (lbl.includes("noy_") || lbl.includes("Noyabr")) dates.push(new Date("2026-11-25"));
        else if (lbl.includes("dek_") || lbl.includes("Dekabr")) dates.push(new Date("2026-12-25"));
      }

      if (dates.length > 0) {
        dates.sort((a, b) => a.getTime() - b.getTime());
        targetDate = dates[0];
      } else {
        if (form.main_goal === "Universitetga kirish") targetDate = new Date("2027-07-15");
        else targetDate.setMonth(targetDate.getMonth() + 3);
      }
    }

    const corePayload: any = {
      avatar_url: form.avatar_url,
      target_subject: form.target_subject,
      target_date: targetDate.toISOString(),
      current_level: form.current_level,
      main_goal: form.main_goal,
      study_hours: form.study_hours,
    };
    if (form.full_name?.trim()) {
      corePayload.full_name = form.full_name.trim();
    }

    const { error: fullErr } = await (supabase as any)
      .from("profiles")
      .update({
        ...corePayload,
        subject_levels: form.subject_levels || {},
        study_days: form.study_days || [],
        mock_test_day: form.mock_test_day || "Yak",
      })
      .eq("user_id", user.id);

    if (fullErr) {
      // Fallback if postgres schema cache hasn't synced extra JSONB columns yet
      const { error: coreErr } = await (supabase as any)
        .from("profiles")
        .update(corePayload)
        .eq("user_id", user.id);
      if (coreErr) throw coreErr;
    }
    return true;
  }

  const [paymentModalState, setPaymentModalState] = useState<{
    isOpen: boolean;
    amount: number;
    title: string;
    tier: string;
  }>({
    isOpen: false,
    amount: 0,
    title: "",
    tier: "premium",
  });

  const handleSubscriptionSelect = async (tier: string, amount: number = 0, title: string = "") => {
    if (!user) {
      toast({ title: "Diqqat", description: "Tizimga kirilmagan. Iltimos, qaytadan kiring.", variant: "destructive" });
      navigate("/login");
      return;
    }

    setSubmitting(true);
    try {
      await saveProfileData();

      const { error: subError } = await (supabase as any)
        .from("profiles")
        .update({ subscription_tier: tier })
        .eq("user_id", user.id);

      if (subError) throw subError;

      if (refreshProfile) {
        await refreshProfile();
      }

      if (tier === "standart") {
        toast({
          title: "Xush kelibsiz! 🎉",
          description: "O'quv profili muvaffaqiyatli yaratildi. Testlarni boshlashingiz mumkin!",
        });
        setTimeout(() => {
          navigate("/dashboard", { replace: true });
          window.location.reload();
        }, 400);
      } else {
        setPaymentModalState({
          isOpen: true,
          amount: amount || (tier === "pro" ? 99000 : 49000),
          title: title || `${tier.toUpperCase()} obuna to'lovi`,
          tier,
        });
      }
    } catch (e: any) {
      toast({ title: "Xatolik", description: e.message || "Profilni saqlashda xatolik yuz berdi", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const isNextDisabled = () => {
    if (step === 0 && !form.full_name.trim()) return true;
    if (step === 1 && !form.avatar_url) return true;
    if (step === 2 && !form.main_goal) return true;
    if (step === 3 && !form.target_subject) return true;
    if (step === 4 && form.main_goal === "Sertifikat olish" && (!form.target_date_labels || form.target_date_labels.length === 0) && !form.target_date_label && !form.exact_date) return true;
    return false;
  };

  const renderStepContent = () => {
    const firstName = form.full_name?.trim() ? form.full_name.trim().split(" ")[0] : "";

    switch (step) {
      /* ── Step 0: User Name Input ── */
      case 0:
        return (
          <div className="space-y-6 text-center max-w-lg mx-auto py-2">
            <div className="flex justify-center">
              <img
                src="/wlcm.png"
                alt="Welcome"
                className="w-44 sm:w-56 h-auto object-contain drop-shadow-md"
              />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Xush kelibsiz! <br /> Sizga qanday murojaat qilaylik?
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Ismingiz bilan sizga eng mos o'quv rejasini yaratamiz.
              </p>
            </div>

            <div className="max-w-md mx-auto pt-2">
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="Ismingizni kiriting..."
                className="w-full text-center text-base sm:text-lg font-bold px-6 py-4 rounded-2xl border-2 border-indigo-100 dark:border-slate-800 focus:border-[#E8192C] focus:ring-4 focus:ring-red-500/10 focus:outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm transition-all"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isNextDisabled()) {
                    handleNext();
                  }
                }}
              />
            </div>
          </div>
        );

      /* ── Step 1: Avatar Selection ── */
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {firstName ? `${firstName}, o'zingizga yoqqan avatarni tanlang` : "Profil rasmingizni tanlang"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Reyting va profilingizda aks etuvchi o'zingizga yoqqan avatarni belgilang
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto pt-2">
              {avatarOptions.map((av) => {
                const isSelected = form.avatar_url === av.url;
                return (
                  <motion.button
                    key={av.id}
                    whileHover={{ scale: 1.04, y: -3 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setForm({ ...form, avatar_url: av.url })}
                    className={`p-4 rounded-3xl border text-center transition-all flex flex-col items-center gap-3 relative cursor-pointer overflow-hidden ${
                      isSelected
                        ? "bg-white dark:bg-slate-900 border-[#E8192C] shadow-xl shadow-red-500/20 ring-2 ring-red-500/40"
                        : "bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-900/80 shadow-sm"
                    }`}
                  >
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 shadow-inner flex items-center justify-center p-1">
                      <img src={av.url} alt={av.label} className="w-full h-full object-contain" />
                    </div>

                    <div className="space-y-0.5">
                      <div className="text-xs font-black text-slate-900 dark:text-white">
                        {av.label}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        {av.desc}
                      </div>
                    </div>

                    {isSelected && (
                      <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#E8192C] text-white flex items-center justify-center shadow-md">
                        <CheckCircleIcon className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        );

      /* ── Step 2: Goal Selection ── */
      case 2:
        return (
          <div className="space-y-6">
            <div className="flex justify-center">
              <img
                src="/trgt.png"
                alt="Target Goal"
                className="w-44 sm:w-56 h-auto object-contain drop-shadow-md"
              />
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {firstName ? `${firstName}, asosiy maqsadingiz nimadan iborat?` : "Asosiy maqsadingiz nimadan iborat?"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Siz uchun eng mos dars jadvali va testlarni shakllantirishimiz uchun tanlang
              </p>
            </div>

            {/* Goal Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              {goals.map((goal) => {
                const isSelected = form.main_goal === goal.value;
                const Icon = goal.icon;

                return (
                  <motion.button
                    key={goal.value}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      let defaultDate = form.target_date_label;
                      if (goal.value === "Universitetga kirish" && !defaultDate.startsWith("otm_")) {
                        defaultDate = "otm_iyul_2027";
                      }
                      setForm({ ...form, main_goal: goal.value, target_date_label: defaultDate });
                    }}
                    className={`p-5 rounded-3xl text-left border transition-all flex items-start gap-4 relative overflow-hidden cursor-pointer ${
                      isSelected
                        ? "bg-white dark:bg-slate-900 border-[#E8192C] shadow-xl shadow-red-500/10 ring-2 ring-red-500/30"
                        : "bg-white/80 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-900/80 shadow-sm"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${goal.color} flex items-center justify-center shrink-0 shadow-lg text-white`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="space-y-1 flex-1 pr-4">
                      <div className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                        {goal.title}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                        {goal.desc}
                      </div>
                      {goal.dateBadge && (
                        <div className="pt-2 text-[11px] font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                          <CalendarIcon className="w-3.5 h-3.5 shrink-0 text-[#E8192C] dark:text-red-400" />
                          <span>{goal.dateBadge}</span>
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[#E8192C] flex items-center justify-center text-white shadow-md">
                        <CheckCircleIcon className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* OTM Date Selector directly inside Step 2 */}
            {form.main_goal === "Universitetga kirish" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="pt-4 border-t border-slate-200/80 dark:border-slate-800 space-y-4"
              >
                <div className="flex items-center justify-center text-center">
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center justify-center gap-2 text-center">
                    <ClockCircleIcon className="w-4 h-4 text-[#E8192C]" />
                    <span>Topshirmoqchi bo'lgan OTM imtihon sanangizni tanlang (2027-yil):</span>
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
                  {otmExamList.map((ex) => {
                    const isSelected = form.target_date_label === ex.id;
                    return (
                      <motion.button
                        key={ex.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setForm({ ...form, target_date_label: ex.id, exact_date: "" })}
                        className={`p-4 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? "bg-white dark:bg-slate-900 border-[#E8192C] shadow-lg shadow-red-500/15 ring-2 ring-red-500/30"
                            : "bg-white/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-black text-red-600 dark:text-red-400">{ex.month}</span>
                            {isSelected && <CheckCircleIcon className="w-4 h-4 text-[#E8192C]" />}
                          </div>
                          <div className="text-sm font-black text-slate-900 dark:text-white">{ex.date}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-tight">{ex.subject}</div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Sertifikat Banner inside Step 2 */}
            {form.main_goal === "Sertifikat olish" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center justify-center gap-2 max-w-xl mx-auto shadow-sm"
              >
                <StarsIcon className="w-4 h-4 text-blue-500 shrink-0" />
                <span>Asosiy faningizni tanlaganingizdan so'ng, shu fanga mos rasmiy BBA Milliy Sertifikat imtihon sanalari chiqadi</span>
              </motion.div>
            )}
          </div>
        );

      /* ── Step 4: Exam Date OR Target Score (Maqsad Ball) ── */
      case 4: {
        if (form.main_goal !== "Sertifikat olish") {
          const isOtm = form.main_goal === "Universitetga kirish";
          const minScore = isOtm ? 60 : 50;
          const maxScore = isOtm ? 189 : 100;
          const currentScore = form.target_score || (isOtm ? 140 : 85);
          const numBars = 14;

          const activeBarCount = Math.max(1, Math.round(((currentScore - minScore) / (maxScore - minScore)) * numBars));

          return (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {firstName ? `${firstName}, maqsad ballingiz qancha?` : "Maqsad ballingiz qancha?"}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Aniq bilmasangiz, taxminiy ham bo'ladi.
                </p>
              </div>

              <div className="max-w-xl mx-auto space-y-6 pt-2">
                {/* Visual Bar Chart (Equalizer Style) */}
                <div className="flex items-end justify-between gap-2 h-32 px-4 pt-4 bg-white/60 dark:bg-slate-900/40 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm">
                  {Array.from({ length: numBars }).map((_, i) => {
                    const isFilled = i < activeBarCount;
                    const barHeightPercent = Math.max(25, Math.round(((i + 1) / numBars) * 100));

                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          const calculatedScore = Math.round(minScore + (i / (numBars - 1)) * (maxScore - minScore));
                          setForm({ ...form, target_score: calculatedScore });
                        }}
                        style={{ height: `${barHeightPercent}%` }}
                        className={`flex-1 rounded-xl transition-all duration-200 cursor-pointer ${
                          isFilled
                            ? "bg-[#E8192C] shadow-md shadow-red-500/20"
                            : "bg-slate-200/80 dark:bg-slate-800/80 border border-dashed border-slate-300 dark:border-slate-700"
                        }`}
                      />
                    );
                  })}
                </div>

                {/* Min / Max Labels with Navigation Controls */}
                <div className="space-y-3 px-2">
                  <div className="flex items-center justify-between text-xs font-black text-slate-400 dark:text-slate-500">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">MIN</div>
                      <div className="text-2xl text-slate-900 dark:text-white font-black">{minScore}</div>
                    </div>

                    {/* Stepper Buttons */}
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, target_score: Math.max(minScore, currentScore - 5) })}
                        className="w-10 h-10 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:border-[#E8192C] transition-all cursor-pointer shadow-sm text-sm font-bold"
                      >
                        ◄
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, target_score: Math.min(maxScore, currentScore + 5) })}
                        className="w-10 h-10 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:border-[#E8192C] transition-all cursor-pointer shadow-sm text-sm font-bold"
                      >
                        ►
                      </button>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">MAX</div>
                      <div className="text-2xl text-slate-900 dark:text-white font-black">{maxScore}</div>
                    </div>
                  </div>

                  {/* Range Slider for smooth drag */}
                  <input
                    type="range"
                    min={minScore}
                    max={maxScore}
                    step={1}
                    value={currentScore}
                    onChange={(e) => setForm({ ...form, target_score: parseInt(e.target.value) })}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#E8192C]"
                  />
                </div>

                {/* Big Target Score Container */}
                <div className="bg-white/90 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl backdrop-blur-xl shadow-xl shadow-slate-200/50 dark:shadow-none text-center space-y-1.5 max-w-sm mx-auto">
                  <div className="text-[11px] font-extrabold tracking-wider text-slate-400 uppercase">
                    SIZNING MAQSADINGIZ
                  </div>
                  <div className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                    {currentScore} <span className="text-lg font-bold text-[#E8192C] dark:text-red-400">{isOtm ? "ball" : "%"}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        }
        const rawSubjects = (form.target_subjects && form.target_subjects.length > 0)
          ? form.target_subjects
          : (form.target_subject ? form.target_subject.split(",").map(s => s.trim()).filter(Boolean) : []);

        const selectedSubjects = Array.from(new Set(rawSubjects));

        const isSubjectMatch = (examSubject: string) => {
          if (selectedSubjects.length === 0) return false;

          const exSub = examSubject.toLowerCase().trim();
          return selectedSubjects.some((userSub) => {
            const uSub = userSub.toLowerCase().trim();
            if (!uSub) return false;

            if (exSub.includes(uSub) || uSub.includes(exSub)) return true;
            if ((uSub.includes("ona tili") || uSub.includes("adabiyot")) && (exSub.includes("ona tili") || exSub.includes("adabiyot"))) return true;
            if ((uSub.includes("huquq") || uSub.includes("huquqshunoslik")) && (exSub.includes("huquq") || exSub.includes("huquqshunoslik"))) return true;
            if ((uSub.includes("ingliz") || uSub.includes("chet tili")) && (exSub.includes("ingliz") || exSub.includes("chet tili"))) return true;
            if (uSub.includes("tarix") && exSub.includes("tarix")) return true;
            if (uSub.includes("matematika") && exSub.includes("matematika")) return true;
            if (uSub.includes("fizika") && exSub.includes("fizika")) return true;
            if (uSub.includes("kimyo") && exSub.includes("kimyo")) return true;
            if (uSub.includes("biologiya") && exSub.includes("biologiya")) return true;
            if (uSub.includes("geografiya") && exSub.includes("geografiya")) return true;

            return false;
          });
        };

        const matchingExams = milliySertifikatExamList.filter(e => isSubjectMatch(e.subject));
        const displayedExams = showAllExams
          ? (examMonthFilter === "all" ? milliySertifikatExamList : milliySertifikatExamList.filter(e => e.month.toLowerCase() === examMonthFilter.toLowerCase()))
          : (matchingExams.length > 0 ? matchingExams : milliySertifikatExamList);

        const selectedSubjectText = selectedSubjects.length > 0 ? selectedSubjects.join(", ") : form.target_subject;

        return (
          <div className="space-y-6">
            <div className="flex justify-center">
              <img
                src="/dte.png"
                alt="Exam Date Illustration"
                className="w-44 sm:w-56 h-auto object-contain drop-shadow-md"
              />
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {firstName ? `${firstName}, imtihon sanangizni tanlang` : "Imtihon sanangizni tanlang"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {form.main_goal === "Sertifikat olish" && selectedSubjectText
                  ? `Siz tanlagan "${selectedSubjectText}" fani bo'yicha rasmiy BBA Milliy sertifikat imtihon sanalari:`
                  : "Tayyorgarlik uchun topshirmoqchi bo'lgan aniq imtihon sanangizni belgilang"}
              </p>
            </div>

            {/* Sub-dates for Milliy Sertifikat */}
            {form.main_goal === "Sertifikat olish" && (
              <div className="space-y-4">
                {matchingExams.length > 0 && !showAllExams && (
                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-2 max-w-xl mx-auto shadow-sm">
                    <StarsIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Siz tanlagan "{selectedSubjectText}" bo'yicha imtihon sanalari ({matchingExams.length} ta imtihon):</span>
                  </div>
                )}

                {showAllExams && (
                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
                    {[
                      { id: "all", label: "Barcha oylar (18 ta imtihon)" },
                      { id: "sentabr", label: "Sentabr 2026" },
                      { id: "oktabr", label: "Oktabr 2026" },
                      { id: "noyabr", label: "Noyabr 2026" },
                      { id: "dekabr", label: "Dekabr 2026" },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setExamMonthFilter(tab.id)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                          examMonthFilter === tab.id
                            ? "bg-[#E8192C] text-white border-[#E8192C] shadow-sm"
                            : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
                  {displayedExams.map((ex) => {
                    const isSelected = (form.target_date_labels || []).includes(ex.id) || form.target_date_label === ex.id;
                    const isUserSubject = isSubjectMatch(ex.subject);

                    return (
                      <motion.button
                        key={ex.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleToggleExamDate(ex.id)}
                        className={`p-4 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between relative w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.67rem)] max-w-[340px] shrink-0 ${
                          isSelected
                            ? "bg-white dark:bg-slate-900 border-[#E8192C] shadow-lg shadow-red-500/15 ring-2 ring-red-500/30"
                            : "bg-white/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-black text-slate-900 dark:text-white truncate">{ex.subject}</span>
                            <div className="flex items-center gap-1 shrink-0">
                              {ex.type && (
                                <span className="bg-sky-500/15 text-sky-600 dark:text-sky-400 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                                  {ex.type}
                                </span>
                              )}
                              {isUserSubject && (
                                <span className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                  <StarsIcon className="w-2.5 h-2.5" /> Sizning faningiz
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="text-xs font-black text-[#E8192C] dark:text-red-400 flex items-center gap-1.5">
                            <ClockCircleIcon className="w-3.5 h-3.5" />
                            <span>{ex.date}</span>
                          </div>

                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                            <span className="font-semibold">Ro'yxatdan o'tish:</span> {ex.reg}
                          </div>
                        </div>

                        <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 mt-2">
                          <span className="text-[9px] uppercase font-bold text-slate-400">{ex.month} sessiyasi</span>
                          {isSelected && <CheckCircleIcon className="w-4 h-4 text-[#E8192C]" />}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {form.target_date_labels && form.target_date_labels.length > 0 && (
                  <div className="text-center pt-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                    Tanlangan imtihon sanalari: <span className="text-[#E8192C] font-extrabold">{form.target_date_labels.length} ta imtihon sanasi tanlandi</span>
                  </div>
                )}

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAllExams(!showAllExams)}
                    className="text-xs font-bold text-[#E8192C] hover:underline cursor-pointer"
                  >
                    {showAllExams ? "← Faqat tanlangan fanim sanalarini ko'rsat" : "Barcha 18 ta Milliy sertifikat imtihon sanalarini ko'rish →"}
                  </button>
                </div>
              </div>
            )}

            {/* Custom Date Input */}
            <div className="max-w-md mx-auto pt-2">
              <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5 shadow-sm text-center">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block text-center">Yoki boshqa aniq imtihon sanasini kiriting:</label>
                <input
                  type="date"
                  value={form.exact_date}
                  onChange={(e) => setForm({ ...form, exact_date: e.target.value, target_date_label: "" })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[#E8192C] text-center"
                />
              </div>
            </div>
          </div>
        );
      }
      /* ── Step 3: Target Subject (Multi-select) ── */
      case 3: {
        const selectedList = form.target_subjects || (form.target_subject ? form.target_subject.split(", ").filter(Boolean) : []);

        return (
          <div className="space-y-6">
            <div className="flex justify-center">
              <img
                src="/sbjct.png"
                alt="Subjects Illustration"
                className="w-44 sm:w-56 h-auto object-contain drop-shadow-md"
              />
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {firstName ? `${firstName}, qaysi fanlar bo'yicha tayyorlanmoqchisiz?` : "Qaysi fanlar bo'yicha tayyorlanmoqchisiz?"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Bir nechta fanni belgilashingiz mumkin (masalan: Matematika, Fizika, Ingliz tili)
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {subjects.map((sub) => {
                const isSelected = selectedList.includes(sub.value);
                const Icon = sub.icon;

                return (
                  <motion.button
                    key={sub.value}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleToggleSubject(sub.value)}
                    className={`p-4 rounded-2xl text-left border transition-all flex items-center gap-3.5 relative cursor-pointer ${
                      isSelected
                        ? "bg-white dark:bg-slate-900 border-[#E8192C] shadow-xl shadow-red-500/10 ring-2 ring-red-500/30"
                        : "bg-white/80 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-900/80 shadow-sm"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${sub.color} flex items-center justify-center shrink-0 text-white shadow-md`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5 flex-1 min-w-0 pr-3">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {sub.value}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {sub.desc}
                      </div>
                    </div>
                    {isSelected ? (
                      <div className="w-5 h-5 rounded-full bg-[#E8192C] flex items-center justify-center text-white shrink-0 shadow-sm">
                        <CheckCircleIcon className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-700 shrink-0" />
                    )}
                  </motion.button>
                );
              })}
            </div>

            {selectedList.length > 0 && (
              <div className="text-center pt-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                Tanlangan fanlar: <span className="text-[#E8192C] font-extrabold">{selectedList.join(", ")}</span> ({selectedList.length} ta fan)
              </div>
            )}
          </div>
        );
      }

      /* ── Step 5: Level (Tabbed Single Container) ── */
      case 5: {
        const rawSubjects = (form.target_subjects && form.target_subjects.length > 0)
          ? form.target_subjects
          : (form.target_subject ? form.target_subject.split(",").map(s => s.trim()).filter(Boolean) : ["Asosiy fan"]);

        const selectedSubjects = Array.from(new Set(rawSubjects));
        const activeSubj = activeLevelTab && selectedSubjects.includes(activeLevelTab) ? activeLevelTab : selectedSubjects[0];

        const isLang = activeSubj.toLowerCase().includes("ingliz") ||
          activeSubj.toLowerCase().includes("chet tili") ||
          activeSubj.toLowerCase().includes("nemis") ||
          activeSubj.toLowerCase().includes("fransuz");

        const isCefrMode = isLang;
        const currentSubjectLevel = form.subject_levels?.[activeSubj] || form.current_level || (isLang ? "B2" : "B");

        const activeProjections = isCefrMode ? cefrLevelProjections : levelProjections;
        const levels = isCefrMode ? ["A1", "A2", "B1", "B2", "C1", "C2"] : ["C", "C+", "B", "B+", "A", "A+"];

        const curLevelKey = levels.includes(currentSubjectLevel) ? currentSubjectLevel : (isCefrMode ? "B2" : "B");
        const curProj = activeProjections[curLevelKey] || activeProjections[levels[2]];
        const levelIdx = levels.indexOf(curLevelKey);

        const updateSubjectLevel = (newLevel: string, applyToAll = false) => {
          if (applyToAll) {
            const updatedSubjectLevels: Record<string, string> = {};
            selectedSubjects.forEach(s => { updatedSubjectLevels[s] = newLevel; });
            setForm({
              ...form,
              subject_levels: updatedSubjectLevels,
              current_level: newLevel,
            });
          } else {
            const updatedSubjectLevels = { ...(form.subject_levels || {}), [activeSubj]: newLevel };
            setForm({
              ...form,
              subject_levels: updatedSubjectLevels,
              current_level: newLevel,
            });
          }
        };

        return (
          <div className="space-y-6">
            <div className="flex justify-center">
              <img
                src="/drj.png"
                alt="Level Selection Illustration"
                className="w-44 sm:w-56 h-auto object-contain drop-shadow-md"
              />
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {firstName ? `${firstName}, hozirgi bilim darajangizni belgilang` : "Hozirgi bilim darajangizni belgilang"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Sizga mos murakkablikdagi savollarni taqdim etishimiz uchun zarur
              </p>
            </div>

            {/* SINGLE ELEGANT CONTAINER */}
            <div className="bg-white/90 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl backdrop-blur-xl space-y-6 max-w-xl mx-auto shadow-xl shadow-slate-200/50 dark:shadow-none relative">
              
              {/* Subject Tabs Bar if multiple subjects */}
              {selectedSubjects.length > 1 && (
                <div className="space-y-2 pb-2 border-b border-slate-100 dark:border-slate-800/80">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
                    Tanlangan fanlar bo'yicha darajalar:
                  </div>
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    {selectedSubjects.map((subj) => {
                      const isActive = activeSubj === subj;
                      const isSubjLang = subj.toLowerCase().includes("ingliz") || subj.toLowerCase().includes("chet tili") || subj.toLowerCase().includes("nemis") || subj.toLowerCase().includes("fransuz");
                      const lvlVal = form.subject_levels?.[subj] || (isSubjLang ? "B2" : "B");

                      return (
                        <button
                          key={subj}
                          type="button"
                          onClick={() => setActiveLevelTab(subj)}
                          className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-all border cursor-pointer flex items-center gap-2 ${
                            isActive
                              ? "bg-[#E8192C] text-white border-[#E8192C] shadow-md shadow-red-500/20 font-black scale-105"
                              : "bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                          }`}
                        >
                          <span>{subj}</span>
                          <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold ${isActive ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"}`}>
                            {lvlVal}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Automatic Domain-Specific Scale Badge */}
              <div className="flex items-center justify-between">
                <div className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E8192C]" />
                  <span>{activeSubj} bo'yicha daraja:</span>
                </div>

                <div className="px-3 py-1 rounded-xl text-xs font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1.5 shadow-sm">
                  {isCefrMode ? (
                    <>
                      <GlobeIcon className="w-3.5 h-3.5 text-amber-500" />
                      <span>CEFR (A1 – C2)</span>
                    </>
                  ) : (
                    <>
                      <TrendingUpIcon className="w-3.5 h-3.5 text-amber-500" />
                      <span>Standart (C – A+)</span>
                    </>
                  )}
                </div>
              </div>

              {/* Level Details */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{curLevelKey}</span>
                    <span className="text-sm font-black text-amber-500 dark:text-amber-400">{curProj.label}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{curProj.desc}</p>
                </div>
                <div className="text-right bg-slate-50 dark:bg-slate-950/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Taxminiy daraja</div>
                  <div className="text-base font-black text-amber-500 dark:text-amber-400">{curProj.range}</div>
                </div>
              </div>

              {/* Level Slider */}
              <div className="space-y-3">
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="1"
                  value={levelIdx >= 0 ? levelIdx : 2}
                  onChange={(e) => updateSubjectLevel(levels[parseInt(e.target.value)])}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />

                <div className="grid grid-cols-6 gap-1.5">
                  {levels.map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => updateSubjectLevel(lvl)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        curLevelKey === lvl
                          ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20 font-black"
                          : "bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Apply to all subjects shortcut button */}
              {selectedSubjects.length > 1 && (
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => updateSubjectLevel(curLevelKey, true)}
                    className="text-xs font-extrabold text-[#E8192C] hover:underline cursor-pointer flex items-center justify-center gap-1 mx-auto"
                  >
                    <span>Ushbu darajani barcha {selectedSubjects.length} ta fanga tatbiq etish ✨</span>
                  </button>
                </div>
              )}

              {/* Goal indicator */}
              <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500 dark:text-amber-400">
                    <TrendingUpIcon className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Maqsadli natija</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Tizim orqali erishilishi kutilayotgan daraja</div>
                  </div>
                </div>
                <div className="text-lg font-black text-amber-500 dark:text-amber-400">{curProj.target}</div>
              </div>

            </div>
          </div>
        );
      }

      /* ── Step 6: Daily Hours & Study Schedule ── */
      case 6: {
        const weekDays = [
          { id: "Du", full: "Dushanba" },
          { id: "Se", full: "Seshanba" },
          { id: "Cho", full: "Chorshanba" },
          { id: "Pay", full: "Payshanba" },
          { id: "Ju", full: "Juma" },
          { id: "Sha", full: "Shanba" },
          { id: "Yak", full: "Yakshanba" },
        ];

        const selectedDays = form.study_days || ["Du", "Se", "Cho", "Pay", "Ju", "Sha"];
        const selectedMockDay = form.mock_test_day || "Yak";

        const handleToggleStudyDay = (dayId: string) => {
          let updatedDays: string[];
          if (selectedDays.includes(dayId)) {
            if (selectedDays.length <= 1) return;
            updatedDays = selectedDays.filter((d) => d !== dayId);
          } else {
            updatedDays = [...selectedDays, dayId];
          }
          setForm({ ...form, study_days: updatedDays });
        };

        const handleSelectMockDay = (dayId: string) => {
          setForm({ ...form, mock_test_day: dayId });
        };

        return (
          <div className="space-y-8 max-w-2xl mx-auto">
            <div className="flex justify-center">
              <img
                src="/tme.png"
                alt="Study Time Illustration"
                className="w-44 sm:w-56 h-auto object-contain drop-shadow-md"
              />
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {firstName ? `${firstName}, o'quv rejimingiz va jadvalingizni belgilang` : "O'quv rejimingiz va jadvalingizni belgilang"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Kunlik tayyorgarlik vaqti, dars kunlari va haftalik Mock Test kunini belgilang
              </p>
            </div>

            {/* SECTION 1: Kunlik Tayyorgarlik Vaqti */}
            <div className="space-y-3">
              <div className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#E8192C]" />
                <span>1. Kuniga qancha vaqt ajratasiz?</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {studyCommitments.map((item) => {
                  const isSelected = form.study_hours === item.value;

                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setForm({ ...form, study_hours: item.value })}
                      className={`p-4 rounded-2xl text-left border transition-all relative flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? "bg-white dark:bg-slate-900 border-[#E8192C] shadow-lg shadow-red-500/10 ring-2 ring-red-500/30"
                          : "bg-white/80 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 hover:border-slate-300"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="text-xs font-black text-slate-900 dark:text-white flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            {item.icon && <item.icon size={16} className="text-[#E8192C]" />}
                            {item.title}
                          </span>
                          {isSelected && <CheckCircleIcon className="w-4 h-4 text-[#E8192C]" />}
                        </div>
                        <div className="text-[11px] font-bold text-[#E8192C]">{item.time}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{item.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SECTION 2: Haftalik Dars Kunlari */}
            <div className="bg-white/90 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 p-5 rounded-3xl backdrop-blur-xl space-y-3.5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-[#E8192C]" />
                  <span>2. Haftaning qaysi kunlari dars qilasiz?</span>
                </div>
                <div className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                  {selectedDays.length} kun tanlandi
                </div>
              </div>

              {/* Day Pills */}
              <div className="grid grid-cols-7 gap-1.5">
                {weekDays.map((day) => {
                  const isDaySelected = selectedDays.includes(day.id);
                  return (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => handleToggleStudyDay(day.id)}
                      className={`py-2.5 rounded-xl text-xs font-black transition-all border cursor-pointer flex flex-col items-center gap-0.5 ${
                        isDaySelected
                          ? "bg-[#E8192C] text-white border-[#E8192C] shadow-md shadow-red-500/20 scale-105"
                          : "bg-slate-100 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                      }`}
                    >
                      <span>{day.id}</span>
                      <span className="text-[9px] font-medium opacity-80 hidden sm:inline">{day.full.slice(0, 3)}</span>
                    </button>
                  );
                })}
              </div>

              {/* Presets */}
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, study_days: ["Du", "Se", "Cho", "Pay", "Ju", "Sha", "Yak"] })}
                  className="text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:text-[#E8192C] cursor-pointer"
                >
                  Har kuni (7 kun)
                </button>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, study_days: ["Du", "Se", "Cho", "Pay", "Ju"] })}
                  className="text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:text-[#E8192C] cursor-pointer"
                >
                  Ish kunlari (Du-Ju)
                </button>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, study_days: ["Sha", "Yak"] })}
                  className="text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:text-[#E8192C] cursor-pointer"
                >
                  Dam olish kunlari (Sha-Yak)
                </button>
              </div>
            </div>

            {/* SECTION 3: Asosiy Mock Test Kuni */}
            <div className="bg-white/90 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 p-5 rounded-3xl backdrop-blur-xl space-y-3.5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <CupIcon className="w-4 h-4 text-amber-500" />
                  <span>3. Qaysi kuni asosiy Mock Test topshirasiz?</span>
                </div>
                <div className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                  {weekDays.find((d) => d.id === selectedMockDay)?.full || selectedMockDay}
                </div>
              </div>

              {/* Single Day Selector for Mock Test */}
              <div className="grid grid-cols-7 gap-1.5">
                {weekDays.map((day) => {
                  const isMockSelected = selectedMockDay === day.id;
                  return (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => handleSelectMockDay(day.id)}
                      className={`py-2.5 rounded-xl text-xs font-black transition-all border cursor-pointer flex flex-col items-center gap-0.5 ${
                        isMockSelected
                          ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20 scale-105"
                          : "bg-slate-100 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                      }`}
                    >
                      <span>{day.id}</span>
                      <span className="text-[9px] font-medium opacity-80 hidden sm:inline">{day.full.slice(0, 3)}</span>
                    </button>
                  );
                })}
              </div>

              <div className="p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/20 text-center text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center justify-center gap-2">
                <StarsIcon className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Har <b>{weekDays.find((d) => d.id === selectedMockDay)?.full}</b> kuni siz uchun rasmiy Mock Test sinov kuni bo'ladi!</span>
              </div>
            </div>

          </div>
        );
      }

      /* ── Step 7: AI Generator Step ── */
      case 7:
        return <AiPlanGeneratorStep onComplete={handleNext} fullName={form.full_name} />;

      /* ── Step 8: 50% Mystery Box Spinner Step (Step 9) ── */
      case 8:
        return <MysteryBoxStep onComplete={handleNext} />;

      /* ── Step 9: Subscription Step (Step 10) ── */
      case 9:
        return <SubscriptionStep onSelect={handleSubscriptionSelect} submitting={submitting} form={form} />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-4 sm:p-6 lg:p-8 relative selection:bg-[#E8192C] selection:text-white">
      <OrbBackground />

      {/* ── Top Header ────────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-4xl flex items-center justify-between gap-2 py-2">
        {/* Official Brand Logo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center cursor-pointer shrink-0"
          onClick={() => navigate("/")}
        >
          <Logo hideTextOnMobile={false} />
        </motion.div>

        {/* Step Indicator Pill & Theme Switcher */}
        <div className="flex items-center gap-2 shrink-0">
          <ModeToggle />
          <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full backdrop-blur-md flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-slate-700 dark:text-slate-300 shadow-sm whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-[#E8192C] animate-ping shrink-0" />
            <span className="font-bold text-slate-900 dark:text-white">Bosqich {step + 1}</span>
            <span className="text-slate-400">/ {steps.length}</span>
          </div>
        </div>
      </div>



      {/* ── Main Step Container ───────────────────────────────── */}
      <div className="relative z-10 w-full max-w-4xl my-auto py-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 15, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.99 }}
            transition={{ duration: 0.3 }}
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Navigation Bottom Bar ────────────────────────────── */}
      <div className="relative z-10 w-full max-w-4xl flex items-center justify-between pt-6 border-t border-slate-200/80 dark:border-slate-800">
        <div>
          {step > 0 && step !== 7 && step !== 8 && step !== 9 && (
            <motion.button
              whileHover={{ scale: 1.02, x: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleBack}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <AltArrowLeftIcon className="w-4 h-4" /> Orqaga
            </motion.button>
          )}
        </div>

        <div>
          {step < steps.length - 3 && (
            <motion.button
              whileHover={{ scale: 1.02, x: 2 }}
              whileTap={{ scale: 0.98 }}
              disabled={isNextDisabled()}
              onClick={handleNext}
              className={`px-8 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-xl cursor-pointer ${
                isNextDisabled()
                  ? "bg-slate-200 dark:bg-slate-900 text-slate-400 dark:text-slate-600 border border-slate-300 dark:border-slate-800 cursor-not-allowed"
                  : "bg-gradient-to-r from-[#E8192C] to-red-600 text-white shadow-red-500/25 hover:shadow-red-500/40"
              }`}
            >
              <span>Davom etish</span>
              <AltArrowRightIcon className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Payment Modal Popup */}
      <PaymentModal
        isOpen={paymentModalState.isOpen}
        onClose={() => {
          setPaymentModalState((prev) => ({ ...prev, isOpen: false }));
          navigate("/dashboard", { replace: true });
        }}
        amount={paymentModalState.amount}
        profile={profile}
        title={paymentModalState.title}
      />
    </div>
  );
}
