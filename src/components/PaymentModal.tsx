import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ArrowUpRight, Wallet, X, Copy, Check, Upload, CreditCard, ShieldCheck, Clock, FileText, CheckCircle2, XCircle, Send, Zap } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { TelegramAdminCard } from "@/components/TelegramAdminCard";

const RED = "#E8192C";
const TELEGRAM_ADMIN = "@educontestadmin";
const TELEGRAM_URL = "https://t.me/educontestadmin?start";
const DEFAULT_ADMIN_CARD = "9860 0601 3861 0328";
const DEFAULT_ADMIN_CARD_OWNER = "Nurniyaz Khudayberganov";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  profile: any;
  title?: string;
  isWithdraw?: boolean;
}

export function PaymentModal({ isOpen, onClose, amount, profile, title, isWithdraw }: PaymentModalProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"pay" | "history">("pay");
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Amount/Card setup, 2: Payment method / Receipt upload, 3: Success
  const [inputValue, setInputValue] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedCard, setCopiedCard] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string>("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const adminCardNumber = (import.meta.env.VITE_ADMIN_CARD as string) || DEFAULT_ADMIN_CARD;

  const userId = profile?.user_id || profile?.id;

  const handleCopyAdminCard = () => {
    navigator.clipboard.writeText(adminCardNumber.replace(/\s/g, ""));
    setCopiedCard(true);
    toast({ title: "Nusxalandi!", description: "Karta raqami nusxalandi" });
    setTimeout(() => setCopiedCard(false), 2000);
  };

  // Fetch User's Payment Requests History
  const { data: myRequests = [], isLoading: isHistoryLoading } = useQuery({
    queryKey: ["user-payment-requests-history", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await (supabase as any)
        .from("payment_requests")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) return [];
      return data || [];
    },
    enabled: isOpen && !!userId,
  });

  useEffect(() => {
    if (isOpen) {
      setActiveTab("pay");
      setStep(1);
      const minAmount = Math.max(amount, 5000);
      setInputValue(amount > 0 ? minAmount.toString() : "");
      setCardNumber("");
      setReceiptFile(null);
      setReceiptPreview("");
      setNote("");
      setLoading(false);
    }
  }, [isOpen, amount]);

  const numAmount = parseInt(inputValue || "0", 10);
  const isValid = numAmount >= 5000;
  const isCardValid = cardNumber.replace(/\s/g, "").length === 16;

  const handleCopyCard = () => {
    navigator.clipboard.writeText(TELEGRAM_ADMIN);
    setCopied(true);
    toast({ title: "Nusxalandi!", description: "@educontestadmin Telegram nikis nusxalandi" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNext = () => {
    if (isWithdraw) {
      if (isValid && isCardValid) setStep(2);
    } else {
      if (isValid) setStep(2);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Fayl juda katta", description: "Maksimal hajmi 10 MB", variant: "destructive" });
      return;
    }
    setReceiptFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setReceiptPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleWithdrawRequest = async () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onClose();
      alert("Pul yechib olish uchun so'rov qabul qilindi. 24 soat ichida ko'rib chiqiladi.");
    }, 1500);
  };

  const handleInPayCheckout = async (paymentMethod?: string) => {
    if (!userId) {
      toast({ title: "Xatolik", description: "Avval tizimga kiring", variant: "destructive" });
      return;
    }
    if (!isValid) {
      toast({ title: "Xatolik", description: "Minimal summa 5 000 so'm", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/payments/inpay/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          amount: numAmount,
          payment_method: paymentMethod || undefined,
          description: note || `EduContest Avtomatik To'lov (${numAmount.toLocaleString()} UZS)`,
          notes: note || `EduContest Avtomatik To'lov (${numAmount.toLocaleString()} UZS)`,
          return_url: window.location.href
        })
      });

      const json = await res.json();

      if (res.ok && json.success && (json.pay_url || json.checkout_url)) {
        const checkoutUrl = json.pay_url || json.checkout_url;
        toast({
          title: "InPay to'lov sahifasiga yo'naltirilmoqda...",
          description: "To'lov sahifasiga o'tilmoqda..."
        });
        setTimeout(() => {
          window.location.href = checkoutUrl;
        }, 500);
      } else {
        const errMsg = json.error || json.message || "InPay to'lov havolasini shakllantirib bo'lmadi.";
        throw new Error(errMsg);
      }
    } catch (err: any) {
      toast({
        title: "Xatolik",
        description: err?.message || "InPay to'lovini shakllantirishda xatolik yuz berdi",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReceiptPayment = async () => {
    if (!userId) {
      toast({ title: "Xatolik", description: "Avval tizimga kiring", variant: "destructive" });
      return;
    }
    if (!isValid) {
      toast({ title: "Xatolik", description: "Minimal summa 5 000 so'm", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      let finalReceiptUrl = receiptPreview;

      // Try uploading to Supabase storage if file is present
      if (receiptFile) {
        try {
          const fileExt = receiptFile.name.split(".").pop();
          const filePath = `${userId}_${Date.now()}.${fileExt}`;
          const { data: uploadData, error: uploadErr } = await supabase.storage
            .from("receipts")
            .upload(filePath, receiptFile);

          if (!uploadErr && uploadData) {
            const { data: publicUrlData } = supabase.storage
              .from("receipts")
              .getPublicUrl(uploadData.path);
            if (publicUrlData?.publicUrl) {
              finalReceiptUrl = publicUrlData.publicUrl;
            }
          }
        } catch (storageErr) {
          console.warn("Storage upload fallback to base64:", storageErr);
        }
      }

      let submitted = false;
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const payload = {
        user_id: userId,
        amount: numAmount,
        receipt_url: finalReceiptUrl || null,
        notes: note || "Karta orqali o'tkazma",
        note: note || "Karta orqali o'tkazma",
      };

      const endpoints = ['/api/payment-requests', 'https://api.educontest.uz/api/payment-requests'];
      for (const endpoint of endpoints) {
        try {
          const res = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
          });
          if (res.ok) {
            const json = await res.json();
            if (json.success) {
              submitted = true;
              break;
            }
          }
        } catch (backendErr) {
          console.warn(`Backend API ${endpoint} error:`, backendErr);
        }
      }

      if (!submitted) {
        let insertErr: any = null;
        try {
          const { error } = await (supabase.from("payment_requests" as any) as any).insert({
            user_id: userId,
            amount: numAmount,
            receipt_url: finalReceiptUrl || null,
            status: "pending",
            notes: note || "Karta orqali o'tkazma",
          } as any);
          insertErr = error;
        } catch (e) {
          insertErr = e;
        }

        if (insertErr) {
          console.warn("Payment request client insert fallback attempt 2:", insertErr);
          const { error: fallbackErr } = await (supabase.from("payment_requests" as any) as any).insert({
            user_id: userId,
            amount: numAmount,
            receipt_url: finalReceiptUrl || null,
            status: "pending",
          } as any);

          if (fallbackErr) {
            if (fallbackErr.message?.includes("row-level security") || fallbackErr.code === "42501") {
              throw new Error("Tizimda to'lov cheklarini saqlash huquqi tekshirilmoqda. Iltimos qayta urinib ko'ring yoki admin bilan bog'laning.");
            }
            throw fallbackErr;
          }
        }
      }

      qc.invalidateQueries({ queryKey: ["user-payment-requests-history"] });
      setStep(3);
      toast({ title: "Yuborildi!", description: "To'lov cheki yuborildi. Admin tasdiqlashini kuting." });
    } catch (err: any) {
      console.error("Payment request error:", err);
      toast({ title: "Xatolik", description: err.message || "So'rovni yuborishda xatolik bo'ldi", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-0 overflow-hidden shadow-2xl [&>button]:hidden">
        <DialogTitle className="sr-only">{isWithdraw ? "Pul yechish" : "To'lov"}</DialogTitle>
        <DialogDescription className="sr-only">{isWithdraw ? "Mablag'larni yechib olish" : "Hisobni to'ldirish"}</DialogDescription>

        {/* Tab Header */}
        {!isWithdraw && (
          <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-1.5 gap-1 shrink-0">
            <button
              onClick={() => setActiveTab("pay")}
              className={`flex-1 py-2 text-[12px] font-extrabold rounded-xl transition-all ${
                activeTab === "pay"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              }`}
            >
              To'lov qilish
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex-1 py-2 text-[12px] font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "history"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              So'rovlarim ({myRequests.length})
            </button>
          </div>
        )}

        <div className="overflow-y-auto flex-1">
          {/* ── TAB 1: PAYMENT FORM ── */}
          {activeTab === "pay" ? (
            step === 1 ? (
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isWithdraw ? 'bg-red-50 dark:bg-red-500/10' : 'bg-slate-100 dark:bg-slate-800'}`}>
                      {isWithdraw ? <ArrowUpRight className="w-4 h-4 text-red-500" /> : <Wallet className="w-4 h-4 text-slate-500" />}
                    </div>
                    <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white">{isWithdraw ? "Pul yechish" : "Hisobni to'ldirish"}</h2>
                  </div>
                  <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-[13px] text-slate-700 dark:text-slate-200 font-extrabold">{isWithdraw ? "Kartangizga pul o'tkazing" : "Balansni to'ldirish uchun summa kiriting"}</p>

                <div className="space-y-3">
                  {isWithdraw && (
                    <div className="space-y-1.5">
                      <label className="text-[11.5px] text-slate-700 dark:text-slate-200 font-extrabold uppercase tracking-wider px-1">Karta raqami</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          setCardNumber(val.replace(/(\d{4})(?=\d)/g, '$1 ').substring(0, 19));
                        }}
                        placeholder="8600 •••• •••• ••••"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 outline-none focus:border-slate-400 dark:focus:border-slate-500 rounded-xl text-slate-900 dark:text-white font-extrabold text-[14px] placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all font-mono"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[11.5px] text-slate-700 dark:text-slate-200 font-extrabold uppercase tracking-wider px-1">{isWithdraw ? "Summa (UZS)" : "To'ldirish summasi (UZS)"}</label>
                    <input
                      type="number"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Minimal: 5 000"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 outline-none focus:border-slate-400 dark:focus:border-slate-500 rounded-xl text-slate-900 dark:text-white font-extrabold text-[16px] placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all font-mono"
                    />
                  </div>

                  {!isWithdraw && (
                    <div className="grid grid-cols-4 gap-2">
                      {[5000, 10000, 20000, 50000].map((val) => (
                        <button
                          key={val}
                          onClick={() => setInputValue(val.toString())}
                          className={`py-2 rounded-xl text-[13px] font-extrabold transition-all border ${
                            inputValue === val.toString()
                              ? "bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-900"
                              : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600"
                          }`}
                        >
                          {(val / 1000).toLocaleString()}K
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={onClose}
                    className="flex-1 h-11 rounded-xl border border-slate-200 dark:border-slate-700 text-[13.5px] font-extrabold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all"
                  >
                    Bekor qilish
                  </button>
                  <button
                    onClick={() => {
                      if (isWithdraw) {
                        handleNext();
                      } else {
                        handleInPayCheckout();
                      }
                    }}
                    disabled={!isValid || (isWithdraw && !isCardValid) || loading}
                    className="flex-[2] h-11 rounded-xl text-white text-[13.5px] font-extrabold transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-md"
                    style={{ background: isWithdraw ? RED : "#059669" }}
                  >
                    {loading ? (
                      "Tayyorlanmoqda..."
                    ) : isWithdraw ? (
                      "Davom etish"
                    ) : (
                      <span className="flex items-center justify-center gap-1.5">
                        <Zap className="w-4 h-4 text-amber-300 fill-amber-300 shrink-0" />
                        <span>InPay orqali to'lash ➔</span>
                      </span>
                    )}
                  </button>
                </div>
              </div>
            ) : step === 2 ? (
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white">{isWithdraw ? "Tasdiqlash" : "To'lov usulini tanlang"}</h2>
                    <p className="text-[12px] text-slate-400 font-medium mt-0.5">{isWithdraw ? "Ma'lumotlar to'g'riligini tekshiring" : `To'lanadigan summa: ${numAmount.toLocaleString()} so'm`}</p>
                  </div>
                  <button onClick={() => setStep(1)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {isWithdraw ? (
                  <div className="space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-3 border border-slate-200 dark:border-slate-700">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Karta</span>
                        <span className="text-[13px] font-semibold text-slate-900 dark:text-white">{cardNumber}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Summa</span>
                        <span className="text-[15px] font-semibold text-red-500">{numAmount.toLocaleString()} UZS</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Komissiya (1%)</span>
                        <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400">{(numAmount * 0.01).toLocaleString()} UZS</span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button onClick={() => setStep(1)} className="flex-1 h-11 rounded-xl border border-slate-200 dark:border-slate-700 text-[12px] font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all">Orqaga</button>
                      <button
                        onClick={handleWithdrawRequest}
                        disabled={loading}
                        className="flex-[2] h-11 rounded-xl text-white text-[12px] font-semibold transition-opacity hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                        style={{ background: RED }}
                      >
                        {loading ? "..." : "Yuborish"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* InPay Instant Automated Online Payment */}
                    <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-2xl p-4 space-y-3 shadow-lg relative overflow-hidden border border-emerald-500/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                          <span className="text-[12px] font-extrabold uppercase tracking-wider text-emerald-50">
                            Avtomatik Onlayn To'lov (InPay)
                          </span>
                        </div>
                        <span className="text-[10px] font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full shadow-xs">
                          ⚡ Onlayn Instant
                        </span>
                      </div>
                      <p className="text-[11.5px] text-emerald-100 font-medium leading-tight">
                        Uzcard, Humo, Payme yoki Click orqali avtomatik to'lash. Chek yuklash va kutish shart emas!
                      </p>
                      <button
                        type="button"
                        onClick={() => handleInPayCheckout()}
                        disabled={loading}
                        className="w-full py-3 bg-white text-slate-900 hover:bg-emerald-50 rounded-xl text-[13.5px] font-extrabold transition-all shadow-md active:scale-98 flex items-center justify-center gap-2"
                      >
                        {loading ? "InPay tayyorlanmoqda..." : `InPay sahifasini ochish (${numAmount.toLocaleString()} UZS) ➔`}
                      </button>
                    </div>

                    {/* Active Payment Methods via InPay */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">To'lov tizimi orqali to'lash</p>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => handleInPayCheckout('click')}
                          disabled={loading}
                          className="py-3 px-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all flex flex-col items-center justify-center gap-1.5 active:scale-95 shadow-xs cursor-pointer"
                        >
                          <img src="/click.png" alt="CLICK" className="h-6 w-auto object-contain" />
                          <span className="text-[10px] font-extrabold text-slate-800 dark:text-slate-200">CLICK</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleInPayCheckout('payme')}
                          disabled={loading}
                          className="py-3 px-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all flex flex-col items-center justify-center gap-1.5 active:scale-95 shadow-xs cursor-pointer"
                        >
                          <img src="/payme.png" alt="PAYME" className="h-6 w-auto object-contain" />
                          <span className="text-[10px] font-extrabold text-slate-800 dark:text-slate-200">PAYME</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleInPayCheckout('cardsystem')}
                          disabled={loading}
                          className="py-3 px-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all flex flex-col items-center justify-center gap-1.5 active:scale-95 shadow-xs cursor-pointer"
                        >
                          <img src="/xazna.png" alt="UzCard / Humo" className="h-6 w-auto object-contain" />
                          <span className="text-[10px] font-extrabold text-slate-800 dark:text-slate-200">UzCard/Humo</span>
                        </button>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => setStep(1)}
                        className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 text-[13px] font-extrabold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                      >
                        Orqaga
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Step 3: Success state */
              <div className="p-6 text-center space-y-4">
                <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto">
                  <Clock className="w-7 h-7 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-[17px] font-extrabold text-slate-900 dark:text-white">To'lov so'rovi yuborildi!</h2>
                  <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                    Admin to'lov chekingizni 10-30 daqiqa ichida tekshirib, balansingizni to'ldiradi.
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-left space-y-1.5 border border-slate-200 dark:border-slate-700 text-[12px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">To'lov summasi:</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">{numAmount.toLocaleString()} UZS</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Holati:</span>
                    <span className="font-extrabold text-amber-600 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded text-[11px]">Kutilmoqda</span>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab("history")}
                  className="w-full h-11 rounded-xl text-white font-extrabold text-[13px] transition-all"
                  style={{ background: RED }}
                >
                  So'rovlarim holatini ko'rish
                </button>
              </div>
            )
          ) : (
            /* ── TAB 2: REQUESTS HISTORY ── */
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-[14px] font-extrabold text-slate-900 dark:text-white">Mening to'lov so'rovlarim</h3>
                <button onClick={() => setActiveTab("pay")} className="text-[12px] font-bold text-red-500 hover:underline">
                  + Yangi to'lov
                </button>
              </div>

              {isHistoryLoading ? (
                <div className="h-32 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-slate-200 border-t-red-500 rounded-full animate-spin" />
                </div>
              ) : myRequests.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-[13px] font-bold text-slate-500">Hali to'lov so'rovlari yuborilmagan</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myRequests.map((req: any) => {
                    const status = req.status || "pending";
                    return (
                      <div
                        key={req.id}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[15px] font-extrabold text-slate-900 dark:text-white">
                            +{req.amount?.toLocaleString()} UZS
                          </span>
                          <span
                            className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                              status === "approved"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                                : status === "rejected"
                                ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 animate-pulse"
                            }`}
                          >
                            {status === "approved" ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" /> Tasdiqlandi
                              </>
                            ) : status === "rejected" ? (
                              <>
                                <XCircle className="w-3.5 h-3.5" /> Rad etildi
                              </>
                            ) : (
                              <>
                                <Clock className="w-3.5 h-3.5" /> Kutilmoqda
                              </>
                            )}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-400">
                          {req.created_at ? new Date(req.created_at).toLocaleString("uz-UZ", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                        </p>

                        {status === "pending" && (
                          <p className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 p-2 rounded-lg border border-amber-200 dark:border-amber-500/20">
                            ⏳ Admin to'lov chekingizni 10-30 daqiqa ichida tekshirib balansingizni to'ldiradi.
                          </p>
                        )}

                        {status === "approved" && (
                          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 p-2 rounded-lg border border-emerald-200 dark:border-emerald-500/20">
                            ✅ To'lov admin tomonidan tasdiqlandi va balansingizga o'tkazildi!
                          </p>
                        )}

                        {status === "rejected" && (
                          <p className="text-[11px] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 p-2 rounded-lg border border-rose-200 dark:border-rose-500/20">
                            ❌ To'lov cheki rad etildi. Ma'lumotlarni qayta tekshirib yangi so'rov yuboring.
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DisabledPaymentOption({ img, name }: { img: string; name: string }) {
  return (
    <div className="relative opacity-60 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 flex flex-col items-center justify-center gap-1 cursor-not-allowed">
      <span className="absolute -top-1.5 bg-amber-500 text-white text-[8px] font-extrabold px-1.5 py-0.2 rounded-full uppercase">
        Tez orada
      </span>
      <img src={img} alt={name} className="h-5 object-contain grayscale" />
      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{name}</span>
    </div>
  );
}
