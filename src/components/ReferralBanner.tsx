/**
 * ReferralBanner – Dashboard tepasida chiqadigan qizil reklama banneri.
 * Compact Educational Style Version.
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Gift, Copy, ChevronRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const DISMISS_KEY = "referral_banner_dismissed_v2";

export default function ReferralBanner() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [referralCode, setReferralCode] = useState<string>("");
  const [friendCount, setFriendCount] = useState(0);

  useEffect(() => {
    const dismissed = sessionStorage.getItem(DISMISS_KEY);
    if (dismissed) return;
    const tier = profile?.subscription_tier;
    if (tier === "premium" || tier === "pro" || profile?.is_lifetime) return;
    setVisible(true);
  }, [profile]);

  useEffect(() => {
    if (!user || !visible) return;
    (async () => {
      try {
        const { data } = await (supabase as any).rpc("get_my_referrals");
        if (data) {
          setReferralCode(data.referral_code || "");
          setFriendCount(data.total_count || 0);
        }
      } catch (_) {
        const { data: p } = await (supabase as any)
          .from("profiles")
          .select("referral_code")
          .eq("user_id", user.id)
          .single();
        if (p?.referral_code) setReferralCode(p.referral_code);
      }
    })();
  }, [user, visible]);

  const copyCode = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = `${window.location.origin}/register?ref=${referralCode}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const dismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    sessionStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          className="w-full mb-6"
        >
          <div
            onClick={() => navigate("/settings/referal")}
            className="group relative cursor-pointer overflow-hidden rounded-2xl bg-[#CC0022] p-4 sm:p-5 text-white shadow-lg active:scale-[0.99] transition-all"
          >
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                 <path d="M0 0 L100 100 M100 0 L0 100" stroke="currentColor" strokeWidth="0.5" fill="none" />
              </svg>
            </div>
            
            <div className="relative z-10 flex items-center gap-4 sm:gap-6">
              {/* Left Icon Area */}
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
                <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>

              {/* Text Area */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                   <h3 className="text-base sm:text-lg font-bold truncate leading-tight">Do'stlarni taklif qiling!</h3>
                   <span className="px-1.5 py-0.5 rounded bg-yellow-400 text-[#CC0022] text-[9px] font-black uppercase tracking-wider">Premium Gift</span>
                </div>
                <p className="text-xs sm:text-sm text-white/90 font-medium">
                  5 do'st → 7 kun <span className="font-bold underline">Premium</span> tekinga oling!
                </p>
              </div>

              {/* Right Side Info */}
              <div className="flex items-center gap-3">
                 <div className="hidden md:flex flex-col items-center">
                    <span className="text-xl font-black leading-none">{friendCount}</span>
                    <span className="text-[8px] font-black uppercase opacity-60">Takliflar</span>
                 </div>
                 
                 <div className="flex items-center gap-2">
                    <button 
                      onClick={copyCode}
                      className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl border border-white/10 transition-colors"
                    >
                      {copied ? <Sparkles className="w-4 h-4 text-yellow-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button 
                      onClick={dismiss}
                      className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl border border-white/10 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                 </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
