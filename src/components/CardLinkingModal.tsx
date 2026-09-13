import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCard, ShieldCheck, Landmark, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface CardLinkingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CardLinkingModal({ isOpen, onClose }: CardLinkingModalProps) {
  const { user, profile } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [loading, setLoading] = useState(false);

  const handleNext = () => {
    if (cardNumber.replace(/\s/g, "").length === 16 && expiry.length === 5) {
      setStep(2);
    }
  };

  const handleConfirm = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const cleanNum = cardNumber.replace(/\s/g, "");
      const cardType = cleanNum.startsWith("9860") ? "Humo" : "Uzcard";
      const masked = `${cleanNum.substring(0, 4)} **** **** ${cleanNum.substring(12)}`;
      const lastFour = cleanNum.substring(12);

      const { error } = await supabase.from("user_cards" as any).insert({
        user_id: user.id,
        card_number: masked,
        last_four: lastFour,
        expiry: expiry,
        card_type: cardType,
        card_holder: profile?.full_name || "Mening kartam"
      });

      if (error) throw error;

      onClose();
    } catch (err: any) {
      alert("Xatolik: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 rounded-[32px] border-none shadow-2xl p-8 [&>button]:hidden">
        <DialogTitle className="sr-only">Kartani ulash</DialogTitle>
        <DialogDescription className="sr-only">Bank kartasini hisobga ulash</DialogDescription>

        {step === 1 ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center space-y-2">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                <CreditCard className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Kartani ulash</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">To'lovlarni osonroq amalga oshirish uchun</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-2">Karta raqami</label>
                <input 
                  type="text" 
                  value={cardNumber}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setCardNumber(val.replace(/(\d{4})(?=\d)/g, '$1 ').substring(0, 19));
                  }}
                  placeholder="8600 •••• •••• ••••" 
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 rounded-2xl text-slate-900 dark:text-white font-bold text-lg placeholder:text-slate-300 dark:placeholder:text-slate-600 transition-all font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-2">Amal qilish muddati</label>
                  <input 
                    type="text" 
                    value={expiry}
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, "");
                      if (val.length > 2) val = val.substring(0, 2) + "/" + val.substring(2, 4);
                      setExpiry(val.substring(0, 5));
                    }}
                    placeholder="MM/YY" 
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 rounded-2xl text-slate-900 dark:text-white font-bold text-lg placeholder:text-slate-300 dark:placeholder:text-slate-600 transition-all font-mono text-center"
                  />
                </div>
                <div className="flex items-center justify-center pt-6">
                   <div className="flex items-center gap-2 text-emerald-500 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
                     <ShieldCheck className="w-4 h-4" />
                     <span className="text-[10px] font-black uppercase">Xavfsiz</span>
                   </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button variant="ghost" onClick={onClose} className="flex-1 h-14 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-black text-[10px] uppercase tracking-widest rounded-2xl">Bekor qilish</Button>
              <Button 
                onClick={handleNext}
                disabled={cardNumber.replace(/\s/g, "").length !== 16 || expiry.length !== 5}
                className="flex-[2] h-14 bg-slate-900 dark:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-slate-900/20 dark:shadow-emerald-500/20 hover:bg-slate-800 dark:hover:bg-emerald-600 disabled:opacity-50"
              >
                Davom etish
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in slide-in-from-right-4">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Tasdiqlash</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Telefoningizga yuborilgan SMS kodni kiriting</p>
            </div>

            <div className="flex justify-center gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <input 
                  key={i}
                  type="text" 
                  maxLength={1}
                  className="w-10 h-14 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 rounded-xl text-center font-black text-xl text-slate-900 dark:text-white outline-none transition-all"
                />
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                onClick={handleConfirm}
                disabled={loading}
                className="h-14 bg-blue-600 dark:bg-blue-500 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl hover:bg-blue-700 dark:hover:bg-blue-600"
              >
                {loading ? "..." : "Tasdiqlash"}
              </Button>
              <Button variant="ghost" onClick={() => setStep(1)} className="h-14 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-black text-[10px] uppercase tracking-widest rounded-2xl">Orqaga</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
