import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Lock, Sparkles, ArrowRight, Phone, UserCircle, Send, Loader2, GraduationCap, School } from "lucide-react";
import { PhoneIcon } from "@solar-icons/react/bold-duotone/phone";
import { UserCircleIcon } from "@solar-icons/react/bold-duotone/user-circle";
import { AltArrowRightIcon } from "@solar-icons/react/bold-duotone/alt-arrow-right";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import SEO from "@/components/SEO";
import { generateDeviceFingerprint, getClientIp } from "@/hooks/useDeviceFingerprint";

const API_BASE_URL = '';

const GoogleIcon = () => (
  <svg viewBox="0 0 48 48" className="w-5 h-5 shrink-0">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile } = useAuth();

  const [step, setStep] = useState<'info' | 'code'>('info');
  const [loading, setLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [botUsername, setBotUsername] = useState("educontesttbot");

  // Form state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("+998");
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [tgCode, setTgCode] = useState("");
  const [searchParams] = useSearchParams();
  const [hasRef, setHasRef] = useState(false);

  useEffect(() => {
    const refCode = searchParams.get("ref");
    if (refCode) {
      sessionStorage.setItem("pending_ref_code", refCode.toUpperCase());
      setHasRef(true);
    } else if (sessionStorage.getItem("pending_ref_code")) {
      setHasRef(true);
    }
  }, [searchParams]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/auth/telegram/bot-info`)
      .then(res => res.text())
      .then(text => (text ? JSON.parse(text) : {}))
      .then(data => {
        if (data.bot_username) setBotUsername(data.bot_username);
      })
      .catch(err => console.error("Failed to fetch bot info", err));

    if (user && profile) {
      if (!profile?.full_name || !profile?.phone) {
        navigate("/onboarding", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [user, profile, navigate]);

  const checkDeviceBlocked = async (): Promise<boolean> => {
    try {
      const [fp, ip] = await Promise.all([
        generateDeviceFingerprint(),
        getClientIp()
      ]);
      const res = await fetch(`${API_BASE_URL}/api/auth/check-device-block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fingerprint: fp, ip_address: ip })
      });
      const data = await res.json();
      if (data.blocked) {
        localStorage.setItem('ec_dev_blocked', '1');
        toast({
          title: "Kirishga Ruxsat Yo'q",
          description: data.reason || "Ushbu qurilma EduContest platformasidan bloklangan.",
          variant: "destructive"
        });
        window.location.reload();
        return true;
      }
    } catch (_) {}
    return false;
  };

  const handleGoogleLogin = async () => {
    if (await checkDeviceBlocked()) return;
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    }
  };

  const handleSendCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!fullName || fullName.length < 3) {
      toast({ title: "Ism sharif xatosi", description: "Iltimos, to'liq ism sharifingizni kiriting", variant: "destructive" });
      return;
    }

    if (!phone || phone.replace(/\D/g, '').length < 9) {
      toast({
        title: "Raqam noto'g'ri",
        description: "Iltimos, telefon raqamingizni to'liq kiriting",
        variant: "destructive"
      });
      return;
    }

    if (await checkDeviceBlocked()) return;

    setLoading(true);
    setIsSendingCode(true);
    setStep('code');
    try {
      const fp = await generateDeviceFingerprint();
      window.open(`https://t.me/${botUsername}?start=start`, '_blank');

      const response = await fetch(`${API_BASE_URL}/api/auth/register/send-otp`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, fingerprint: fp })
      });

      const resText = await response.text();
      const data = resText ? JSON.parse(resText) : {};

      if (!response.ok) {
        if (response.status === 403 || data.blocked) {
          localStorage.setItem('ec_dev_blocked', '1');
          toast({ title: "Bloklangan", description: data.error || "Ushbu qurilma bloklangan.", variant: "destructive" });
          window.location.reload();
          return;
        }
        if (response.status === 429) {
          toast({ title: "Cheklov", description: data.error, variant: "destructive" });
          return;
        }
        toast({
          title: "Telegram Bot",
          description: data.message || data.error || "Telegram botimizdan 6 xonali kodni oling."
        });
      } else {
        toast({
          title: "Kod yuborildi",
          description: "Telegram botimizdan 6 xonali kodni oling."
        });
      }
    } catch (err: any) {
      console.warn("register send-otp error:", err);
      toast({
        title: "Telegram Bot",
        description: "Telegram botimizdan 6 xonali kodni oling."
      });
    } finally {
      setLoading(false);
      setIsSendingCode(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await checkDeviceBlocked()) return;
    setLoading(true);
    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const fp = await generateDeviceFingerprint();

      const response = await fetch(`${API_BASE_URL}/api/auth/register/verify`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          code: tgCode.replace(/\D/g, '').trim(),
          full_name: fullName,
          role,
          fingerprint: fp
        })
      });

      const resText = await response.text();
      let resJson: any = {};
      try { resJson = resText ? JSON.parse(resText) : {}; } catch (_) { }

      if (!response.ok) {
        if (response.status === 403 || resJson.blocked) {
          localStorage.setItem('ec_dev_blocked', '1');
          toast({ title: "Bloklangan", description: resJson.error || "Ushbu qurilma bloklangan.", variant: "destructive" });
          window.location.reload();
          return;
        }
        throw new Error(resJson.error || resJson.message || `Ro'yxatdan o'tishda xatolik (${response.status})`);
      }

      toast({ title: "Muvaffaqiyatli!", description: "Xush kelibsiz!" });

      const pendingRef = sessionStorage.getItem("pending_ref_code");
      if (pendingRef) {
        try {
          await (supabase as any).rpc("apply_referral_code", { code: pendingRef });
        } catch (_) { /* silent */ } finally {
          sessionStorage.removeItem("pending_ref_code");
        }
      }

      window.location.href = "/onboarding";
    } catch (err: any) {
      toast({ title: "Xatolik", description: err.message || "Kod noto'g'ri", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO title="Ro'yxatdan o'tish" description="EduContest platformasida ro'yxatdan o'ting va attestatsiyaga tayyorlanishni boshlang. Bepul testlar, AI yordam va sertifikat olish imkoniyati." />
      <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col overflow-hidden">
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2">
          <div className="flex flex-col items-center justify-center p-8 lg:p-16 bg-white dark:bg-slate-950 relative overflow-y-auto">
            <div className="w-full max-w-[440px] space-y-8 py-8">
              <div className="flex items-center gap-3 mb-8">
                <img src="/logo.png" className="w-10 h-10 object-contain" alt="Eduly AI" />
                <span className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white uppercase">
                  Eduly <span className="text-[#E8192C]">AI</span>
                </span>
              </div>

              <div className="space-y-2">
                <h1 className="text-4xl font-semibold text-slate-900 dark:text-white tracking-tight">Ro'yxatdan o'tish</h1>
                <p className="text-[15px] text-slate-500 dark:text-slate-400 font-medium">Platformamizga xush kelibsiz!</p>

                {hasRef && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-slate-900 dark:text-white leading-none">Taklifnoma qo'llanildi!</p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium mt-1">Siz do'stingiz taklifi bilan ro'yxatdan o'tyapsiz.</p>
                    </div>
                  </motion.div>
                )}
              </div>

              {step === 'info' && (
                <div className="space-y-4">
                  <button onClick={handleGoogleLogin} className="w-full h-12 flex items-center justify-center gap-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all font-semibold text-slate-700 dark:text-slate-200 text-[14px] cursor-pointer">
                    <GoogleIcon /> Google orqali davom etish
                  </button>

                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-800"></div></div>
                    <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-white dark:bg-slate-950 px-6 text-slate-400 dark:text-slate-500 font-semibold tracking-wider">Yoki</span></div>
                  </div>
                </div>
              )}

              <form onSubmit={step === 'info' ? handleSendCode : handleVerify} className="space-y-5">
                {step === 'info' ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">To'liq ism sharif</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <UserCircle className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                        </div>
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full h-14 pl-12 pr-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:border-[#E8192C] transition-all font-semibold text-slate-900 dark:text-white"
                          placeholder="Ismingizni kiriting"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Telefon raqami</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Phone className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                        </div>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full h-14 pl-12 pr-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:border-[#E8192C] transition-all font-semibold text-slate-900 dark:text-white text-lg"
                          placeholder="+998"
                          required
                        />
                      </div>
                      <div className="flex items-start gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium ml-1 pt-1 leading-snug">
                        <Send className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" />
                        <span>
                          Tasdiqlash kodi Telegram botimiz (<a href={`https://t.me/${botUsername}?start=start`} target="_blank" rel="noreferrer" className="underline font-bold text-sky-600 dark:text-sky-400 hover:text-sky-800">@{botUsername}</a>) orqali yuboriladi.
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Siz kimsiz?</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setRole("student")}
                          className={`h-14 rounded-2xl border flex items-center justify-center gap-3 transition-all cursor-pointer ${role === "student"
                            ? "border-[#E8192C] bg-slate-50 dark:bg-slate-900 text-[#E8192C]"
                            : "border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
                            }`}
                        >
                          <GraduationCap className="w-5 h-5" />
                          <span className="font-semibold">O'quvchi</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setRole("teacher")}
                          className={`h-14 rounded-2xl border flex items-center justify-center gap-3 transition-all cursor-pointer ${role === "teacher"
                            ? "border-[#E8192C] bg-slate-50 dark:bg-slate-900 text-[#E8192C]"
                            : "border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
                            }`}
                        >
                          <School className="w-5 h-5" />
                          <span className="font-semibold">O'qituvchi</span>
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                    <div className="p-4 bg-sky-50/90 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-2xl flex items-start gap-3 shadow-xs">
                      <div className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                        <Send className="w-5 h-5 animate-pulse" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-sky-950 dark:text-sky-200 uppercase tracking-wider">✈️ Telegramga kod yuborildi!</p>
                        <p className="text-[13px] text-sky-900 dark:text-sky-300 leading-snug font-medium">
                          <b className="text-sky-950 dark:text-sky-100">{phone}</b> raqamingizga bog'langan <a href={`https://t.me/${botUsername}?start=start`} target="_blank" rel="noreferrer" className="underline font-bold text-sky-700 dark:text-sky-400 hover:text-sky-900">@{botUsername}</a> Telegram botidan 6 xonali tasdiqlash kodini kiriting.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Tasdiqlash kodi</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                        </div>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={tgCode}
                          onChange={(e) => setTgCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className="w-full h-14 pl-12 pr-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:border-[#E8192C] transition-all font-bold text-slate-900 dark:text-white tracking-[0.4em] text-xl text-center"
                          placeholder="123456"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setStep('info')}
                      className="text-xs font-semibold text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors uppercase tracking-wider underline underline-offset-4 cursor-pointer"
                    >
                      Ma'lumotlarni o'zgartirish
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 bg-[#E8192C] hover:bg-[#D41524] text-white rounded-2xl font-semibold text-[15px] transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-4 cursor-pointer"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      <span>{step === 'info' ? "Kodni yuborish" : "Kodni tasdiqlash"}</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>

              <div className="text-center pt-4">
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                  Tizimda profilingiz bormi?{" "}
                  <Link to="/login" className="text-slate-900 dark:text-white font-semibold uppercase tracking-tighter hover:underline">
                    Kirish
                  </Link>
                </p>
              </div>
            </div>
          </div>

          <div className="hidden lg:block bg-slate-50 dark:bg-slate-900 relative overflow-hidden border-l border-slate-200 dark:border-slate-800 h-full w-full">
            <img src="/loginimg.png" className="w-full h-full object-cover object-center transition-transform duration-700 hover:scale-[1.02]" alt="Illustration" />
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;
