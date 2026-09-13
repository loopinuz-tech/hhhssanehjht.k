import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./useAuth";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";

interface EduCoinContextType {
  balance: number;
  streak: number;
  loading: boolean;
  showDailyModal: boolean;
  dailyResult: any;
  showFeedbackModal: boolean;
  setShowFeedbackModal: (show: boolean) => void;
  refresh: () => Promise<void>;
  processDailyLogin: () => Promise<void>;
  addEduCoins: (amount: number, type: string, description: string, reference_id?: string) => Promise<boolean>;
  spendCoin: (amount: number, type: string, description: string, reference_id?: string) => Promise<boolean>;
  closeDailyModal: () => void;
  closeFeedbackModal: () => void;
  submitFeedback: (type: string, category: string, message: string, reference_id?: string, image_url?: string) => Promise<void>;
}

export const EduCoinContext = createContext<EduCoinContextType | undefined>(undefined);

export const EduCoinProvider = ({ children }: { children: ReactNode }) => {
  const [balance, setBalance] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [showDailyModal, setShowDailyModal] = useState(false);
  const [dailyResult, setDailyResult] = useState<any>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchBalance = async () => {
    if (!user) return;
    try {
      const data = await api.educoin.getBalance();
      if (data) {
        setBalance(data.educoin_balance || 0);
        setStreak(data.login_streak || 0);
        
        // Agar balansi 0 bo'lsa va hali ko'rsatilmagan bo'lsa feedback modalni ochish
        if (data.educoin_balance === 0 && !sessionStorage.getItem('feedback_shown')) {
          setShowFeedbackModal(true);
          sessionStorage.setItem('feedback_shown', 'true');
        }
      }
    } catch (err) {
      console.error("Balance fetch error:", err);
    }
  };

  const processDailyLogin = async () => {
    if (!user) return;
    const todayStr = new Date().toISOString().slice(0, 10);
    const cacheKey = `daily_checked_${user.id}_${todayStr}`;
    if (sessionStorage.getItem(cacheKey)) {
      return; // Already checked today for this user
    }

    try {
      sessionStorage.setItem(cacheKey, 'true');
      const data = await api.educoin.dailyLogin();
      if (data?.success) {
        setDailyResult({
          coins_earned: data.reward,
          streak: data.streak,
          streak_bonus: data.streak_bonus || 0,
          milestone: data.milestone
        });
        setShowDailyModal(true);
        fetchBalance();
      }
    } catch (err) {
      console.error("Daily login error:", err);
    }
  };

  const submitFeedback = async (type: string, category: string, message: string, reference_id?: string, image_url?: string) => {
    if (!user) return;
    try {
      const { error } = await (supabase as any).from('platform_feedback').insert({
        user_id: user.id,
        feedback_type: type,
        category,
        message,
        image_url
      });

      if (!error) {
        toast({
          title: "Rahmat!",
          description: "Fikringiz qabul qilindi.",
        });
        setShowFeedbackModal(false);
      } else {
        throw error;
      }
    } catch (err) {
      console.error("Feedback submission error:", err);
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Fikr yuborishda xatolik yuz berdi.",
      });
    }
  };

  const addEduCoins = async (amount: number, type: string, description: string, reference_id?: string) => {
    const numAmount = Number(amount) || 0;
    setBalance((prev) => Math.max(0, Number(prev) + numAmount));
    if (!user) return true;
    setLoading(true);
    try {
      const data = await api.educoin.add({ amount: numAmount, type, description, reference_id });
      if (data && data.balance !== undefined) {
        setBalance(Number(data.balance));
        return true;
      }
      const { data: prof } = await (supabase as any).from("profiles").select("educoin_balance").eq("user_id", user.id).single();
      const updated = Math.max(0, Number((prof as any)?.educoin_balance || 0) + numAmount);
      await (supabase as any).from("profiles").update({ educoin_balance: updated }).eq("user_id", user.id);
      setBalance(updated);
      return true;
    } catch (err) {
      try {
        const { data: prof } = await (supabase as any).from("profiles").select("educoin_balance").eq("user_id", user.id).single();
        const updated = Math.max(0, Number((prof as any)?.educoin_balance || 0) + numAmount);
        await (supabase as any).from("profiles").update({ educoin_balance: updated }).eq("user_id", user.id);
        setBalance(updated);
        return true;
      } catch (sbErr) {
        console.warn("Educoin balance update fallback note:", sbErr);
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const spendCoin = async (amount: number, type: string, description: string, reference_id?: string) => {
    const numAmount = Number(amount) || 0;
    const numBalance = Number(balance) || 0;
    if (numBalance < numAmount) return false;
    return addEduCoins(-numAmount, type, description, reference_id);
  };

  const closeDailyModal = () => setShowDailyModal(false);
  const closeFeedbackModal = () => setShowFeedbackModal(false);

  useEffect(() => {
    if (user?.id) {
      fetchBalance();
      processDailyLogin();
    }
  }, [user?.id]);

  return (
    <EduCoinContext.Provider value={{
      balance,
      streak,
      loading,
      showDailyModal,
      dailyResult,
      showFeedbackModal,
      setShowFeedbackModal,
      refresh: fetchBalance,
      processDailyLogin,
      addEduCoins,
      spendCoin,
      closeDailyModal,
      closeFeedbackModal,
      submitFeedback
    }}>
      {children}
    </EduCoinContext.Provider>
  );
};

export const useEduCoin = () => {
  const context = useContext(EduCoinContext);
  if (context === undefined) {
    throw new Error("useEduCoin must be used within an EduCoinProvider");
  }
  return context;
};


