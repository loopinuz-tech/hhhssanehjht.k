import { useState } from "react";
import {
  X,
  Loader2,
  Banknote,
  BookOpen,
  LayoutGrid,
  Search,
  Clock,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useExitIntent } from "@/hooks/useExitIntent";
import { useAuth } from "@/hooks/useAuth";

// ----------- Types -----------
type ReasonCategory =
  | "price_too_high"
  | "question_quality"
  | "ui_confusing"
  | "subject_missing"
  | "no_time"
  | "other"
  | "skipped";

interface ReasonOption {
  id: ReasonCategory;
  label: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}

// ----------- Constants -----------
const REASONS: ReasonOption[] = [
  {
    id: "price_too_high",
    label: "Narxi qimmat",
    icon: Banknote,
    iconBg: "bg-emerald-50 dark:bg-emerald-500/10",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    id: "question_quality",
    label: "Savollar sifati / mos emas",
    icon: BookOpen,
    iconBg: "bg-blue-50 dark:bg-blue-500/10",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    id: "ui_confusing",
    label: "Interfeys chalkash / qulay emas",
    icon: LayoutGrid,
    iconBg: "bg-purple-50 dark:bg-purple-500/10",
    iconColor: "text-purple-600 dark:text-purple-400",
  },
  {
    id: "subject_missing",
    label: "Kerakli fan yo'q edi",
    icon: Search,
    iconBg: "bg-rose-50 dark:bg-rose-500/10",
    iconColor: "text-rose-600 dark:text-rose-400",
  },
  {
    id: "no_time",
    label: "Vaqtim yo'q, keyinroq qaytaman",
    icon: Clock,
    iconBg: "bg-amber-50 dark:bg-amber-500/10",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  {
    id: "other",
    label: "Boshqa sabab / Taklifim bor",
    icon: MessageSquare,
    iconBg: "bg-teal-50 dark:bg-teal-500/10",
    iconColor: "text-teal-600 dark:text-teal-400",
  },
];

// ----------- Inner Modal UI -----------
interface ExitIntentModalInnerProps {
  userId: string;
  onDone: () => void;
}

function ExitIntentModalInner({ userId, onDone }: ExitIntentModalInnerProps) {
  const [selected, setSelected] = useState<ReasonCategory | null>(null);
  const [freeText, setFreeText] = useState("");
  const [loading, setLoading] = useState(false);

  const submitSurvey = async (category: ReasonCategory) => {
    setLoading(true);
    try {
      const { error } = await (supabase as any).from("feedback_exit_survey").insert({
        user_id: userId,
        reason_category: category,
        free_text: freeText.trim() || null,
        page_url: window.location.href,
      });
      if (error) {
        console.error("Exit survey insert error:", error);
      } else if (category !== "skipped") {
        toast.success("Rahmat! Fikringiz bizga juda muhim 🙏", {
          duration: 3000,
          position: "bottom-center",
        });
      }
    } catch (err) {
      console.error("Exit survey unexpected error:", err);
    } finally {
      setLoading(false);
      onDone();
    }
  };

  const handleSubmit = () => {
    if (!selected) return;
    submitSurvey(selected);
  };

  const handleSkip = () => {
    submitSurvey("skipped");
  };

  return (
    <div
      id="exit-intent-overlay"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200"
      style={{ background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(6px)" }}
      onClick={(e) => {
        if ((e.target as HTMLElement).id === "exit-intent-overlay") handleSkip();
      }}
    >
      <div
        id="exit-intent-modal"
        className="relative w-full max-w-md bg-white dark:bg-[#111827] rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
        style={{ maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Red accent line */}
        <div className="h-1.5 w-full bg-[#C8001A]" />

        {/* Close button */}
        <button
          id="exit-intent-close"
          onClick={handleSkip}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Yopish"
          disabled={loading}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 pt-5">
          {/* Header */}
          <div className="mb-5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-[#C8001A] text-[11px] font-extrabold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Fikringiz biz uchun muhim</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
              Ketishdan oldin bir daqiqa...
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Platformani takomillashtirishda o'z taklifingizni bildiring.
            </p>
          </div>

          {/* Reasons */}
          <div className="space-y-2 mb-5">
            {REASONS.map((r) => {
              const isSelected = selected === r.id;
              const Icon = r.icon;
              return (
                <button
                  key={r.id}
                  id={`exit-reason-${r.id}`}
                  type="button"
                  onClick={() => setSelected(r.id)}
                  className={[
                    "w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl border-2 text-left transition-all duration-150 text-xs sm:text-sm font-semibold",
                    isSelected
                      ? "border-[#C8001A] bg-rose-50/50 dark:bg-rose-950/30 text-slate-900 dark:text-white shadow-xs"
                      : "border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-200 dark:hover:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40",
                  ].join(" ")}
                  disabled={loading}
                >
                  {/* Radio dot */}
                  <span
                    className={[
                      "w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors",
                      isSelected
                        ? "border-[#C8001A]"
                        : "border-slate-300 dark:border-slate-600",
                    ].join(" ")}
                  >
                    {isSelected && (
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: "#C8001A" }}
                      />
                    )}
                  </span>

                  {/* Icon Badge */}
                  <div
                    className={`w-7 h-7 rounded-xl ${r.iconBg} ${r.iconColor} flex items-center justify-center flex-shrink-0`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <span className="flex-1 truncate">{r.label}</span>
                </button>
              );
            })}
          </div>

          {/* Free text */}
          <div className="mb-5">
            <label
              htmlFor="exit-freetext"
              className="block text-[11px] font-extrabold text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-wider"
            >
              Batafsil aytib bersangiz (ixtiyoriy)
            </label>
            <textarea
              id="exit-freetext"
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs sm:text-sm text-slate-800 dark:text-slate-200 px-3.5 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-[#C8001A]/30 placeholder:text-slate-400 font-medium"
              placeholder="Bizga juda yordam beradi..."
              rows={3}
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              maxLength={500}
              disabled={loading}
            />
            <p className="text-[10px] text-slate-400 mt-1 text-right">{freeText.length}/500</p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <button
              id="exit-submit-btn"
              type="button"
              onClick={handleSubmit}
              disabled={!selected || loading}
              className={[
                "w-full h-11 sm:h-12 rounded-2xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all",
                selected && !loading
                  ? "text-white shadow-md hover:opacity-90 active:scale-[0.99]"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed",
              ].join(" ")}
              style={selected && !loading ? { background: "#C8001A" } : undefined}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Yuborilmoqda...</span>
                </>
              ) : (
                "Yuborish"
              )}
            </button>

            <button
              id="exit-skip-btn"
              type="button"
              onClick={handleSkip}
              disabled={loading}
              className="w-full text-center text-xs sm:text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 py-1.5 transition-colors font-semibold"
            >
              O'tkazib yuborish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------- Main exported wrapper -----------
export function ExitIntentModal() {
  const { user } = useAuth();
  const { isVisible, dismiss } = useExitIntent({ user });

  if (!isVisible || !user) return null;

  return (
    <ExitIntentModalInner
      userId={user.id}
      onDone={dismiss}
    />
  );
}