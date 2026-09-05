import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Wallet as WalletIcon, Plus, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, XCircle } from "lucide-react";
import { PaymentModal } from "@/components/PaymentModal";
import { format } from "date-fns";
import { uz } from "date-fns/locale";

const Wallet = () => {
  const { user, profile } = useAuth();
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  // Fetch transaction history (Combining deposits and test purchases)
  const { data: history, isLoading } = useQuery({
    queryKey: ["wallet-history", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // 1. Fetch real transactions
      const { data: deposits } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      // 2. Fetch test purchases (as expenses)
      const { data: sessions } = await supabase
        .from("test_sessions")
        .select("*, test_folders(name, price)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      // Combine and sort
      const combined = [
        ...(deposits || []).map(d => ({
          id: d.id,
          type: d.type === 'deposit' ? 'income' : 'expense' as const,
          amount: d.amount,
          title: d.type === 'deposit' ? "Hisob to'ldirildi" : "Mablag' yechildi",
          description: d.description || "To'lov tizimi",
          date: d.created_at,
          status: d.status || "success"
        })),
        ...(sessions || []).map(s => ({
          id: s.id,
          type: "expense" as const,
          amount: -((s as any).test_folders?.price || 0),
          title: (s as any).test_folders?.name || "Test to'lovi",
          description: "Test sotib olindi",
          date: s.created_at,
          status: "success"
        }))
      ]
      .filter(tx => tx.amount !== 0)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return combined;
    },
    enabled: !!user,
  });

  const handlePurchaseLifetime = async () => {
    const LIFETIME_PRICE = 200000;
    if ((profile?.balance || 0) < LIFETIME_PRICE) {
      setIsPaymentOpen(true);
      return;
    }

    try {
      const { error } = await (supabase
        .from("profiles") as any)
        .update({ 
          balance: profile.balance - LIFETIME_PRICE,
          is_lifetime: true 
        })
        .eq("id", profile.id);

      if (error) throw error;
      
      // Record transaction
      await (supabase.from("wallet_transactions") as any).insert({
        user_id: user?.id,
        amount: -LIFETIME_PRICE,
        type: "withdrawal",
        description: "Umrbod a'zolik xaridi",
        status: "success"
      });

      window.location.reload(); // Refresh to update state
    } catch (err) {
      console.error(err);
    }
  };

  const handlePaymentRedirect = async (method: 'click' | 'payme' | 'xazna', amount: number) => {
    if (amount < 5000) {
      setIsPaymentOpen(true);
      return;
    }
    const inPayMethod = method === 'xazna' ? 'cardsystem' : method;
    try {
      const res = await fetch('/api/payments/inpay/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: profile?.user_id || profile?.id,
          amount,
          payment_method: inPayMethod,
          description: `Hamyonni to'ldirish (${amount.toLocaleString()} UZS)`,
          notes: `Hamyonni to'ldirish (${amount.toLocaleString()} UZS)`,
          return_url: window.location.href
        })
      });
      const data = await res.json();
      const url = data?.pay_url || data?.checkout_url;
      if (url) {
        window.location.href = url;
      } else {
        setIsPaymentOpen(true);
      }
    } catch (e) {
      setIsPaymentOpen(true);
    }
  };

  return (
    <div className="w-full space-y-8 pb-20 animate-fade-in pr-4 md:pr-10">
      {/* Clean & Minimal Hero */}
      <div className="relative pt-8 pb-4 text-center space-y-6">
         <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">
            <WalletIcon className="w-3.5 h-3.5" />
            <span>Moliya Boshqaruvi</span>
         </div>
         
         <div className="space-y-3 max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white pb-1">
               Shaxsiy <span className="text-emerald-600 dark:text-emerald-500">hamyon</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base font-medium max-w-xl mx-auto">
               Hisobingizni to'ldiring va barcha imkoniyatlardan cheksiz foydalaning.
            </p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Balance Card */}
        <div className="md:col-span-2 bg-card dark:bg-slate-900 border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[180px]">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Joriy balans</p>
              <h2 className="text-4xl font-bold text-foreground tracking-tight">
                {(profile?.balance || 0).toLocaleString()} <span className="text-lg font-medium text-muted-foreground">so'm</span>
              </h2>
            </div>
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-muted-foreground border border-border">
              <WalletIcon className="w-6 h-6" />
            </div>
          </div>
          
          <div className="flex items-center gap-3 pt-6">
            <button 
              onClick={() => setIsPaymentOpen(true)}
              className="flex-1 bg-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition active:scale-95 shadow-sm"
            >
              Hisobni to'ldirish
            </button>
            <div className="px-4 py-3 bg-muted border border-border rounded-xl">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Sizning ID</p>
              <p className="text-sm font-mono font-bold text-foreground">{profile?.user_id?.slice(0, 8).toUpperCase()}</p>
            </div>
          </div>
        </div>

        {/* Premium Plan Card */}
        <div className={`rounded-2xl p-6 border flex flex-col justify-between min-h-[180px] transition-all ${
          profile?.is_lifetime 
          ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-800/20 text-emerald-900 dark:text-emerald-400' 
          : 'bg-card border-border'
        }`}>
          <div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
              profile?.is_lifetime ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'
            }`}>
              {profile?.is_lifetime ? <CheckCircle2 className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
            </div>
            <h3 className="text-lg font-bold text-foreground">Umrbod Premium</h3>
            <p className={`text-xs mt-1 ${profile?.is_lifetime ? 'text-emerald-700/70 dark:text-emerald-400/70' : 'text-muted-foreground'}`}>
              Barcha testlarga cheksiz kirish.
            </p>
          </div>
          
          <div className="pt-4">
            {profile?.is_lifetime ? (
              <div className="w-full py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-100/50 dark:bg-emerald-900/30 text-center text-xs font-bold uppercase tracking-wider">Faol</div>
            ) : (
              <button 
                onClick={handlePurchaseLifetime}
                className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white py-2.5 rounded-xl font-bold text-xs hover:opacity-90 transition shadow-sm"
              >
                200 000 so'm — Sotib olish
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">To'lov tizimlari</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { name: "Click", img: "/click.png", method: "click" },
            { name: "Payme", img: "/payme.png", method: "payme" },
            { name: "UzCard / Humo", img: "/xazna.png", method: "xazna" },
          ].map((m) => (
            <button 
              key={m.name}
              onClick={() => setIsPaymentOpen(true)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 hover:shadow-xl transition-all group relative h-40 overflow-hidden cursor-pointer"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
              
              <div className="w-full h-16 flex items-center justify-center relative z-10 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                <img 
                  src={m.img} 
                  alt={m.name} 
                  className="w-auto h-10 md:h-12 max-w-[85%] object-contain transition-transform duration-300 group-hover:scale-110" 
                />
              </div>
              <span className="relative z-10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{m.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Transaction History */}
      <div className="space-y-4 pt-4">
        <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Tranzaksiyalar tarixi</h3>
        <div className="bg-card dark:bg-slate-900 border border-border rounded-2xl overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-12 text-center text-sm text-muted-foreground italic">Yuklanmoqda...</div>
          ) : history && history.length > 0 ? (
            <div className="divide-y divide-border">
              {history.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-5 hover:bg-muted transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      tx.type === 'income' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500' : 'bg-muted text-muted-foreground'
                    }`}>
                      {tx.type === 'income' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{tx.title}</p>
                      <p className="text-[11px] text-muted-foreground">{format(new Date(tx.date), "d MMM, HH:mm", { locale: uz })}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${tx.type === 'income' ? 'text-emerald-500' : 'text-foreground'}`}>
                      {tx.type === 'income' ? '+' : ''}{tx.amount.toLocaleString()} <span className="text-[10px]">so'm</span>
                    </p>
                    <span className={`text-[10px] font-bold uppercase tracking-tighter ${
                      tx.status === 'success' ? 'text-emerald-500' : 'text-red-400'
                    }`}>
                      {tx.status === 'success' ? "Bajarildi" : "Xato"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-16 text-center">
              <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4 text-muted-foreground/30">
                <WalletIcon className="w-8 h-8" />
              </div>
              <p className="text-sm text-muted-foreground">Tranzaksiyalar mavjud emas</p>
            </div>
          )}
        </div>
      </div>

      <PaymentModal 
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        amount={0}
        profile={profile}
      />
    </div>
  );
};

export default Wallet;
