import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Lock, Mail, Sparkles, ArrowRight, Phone, Eye, EyeOff, CheckCircle2, UserCircle, Send, Loader2, Building2, GraduationCap } from "lucide-react";
import { PhoneIcon } from "@solar-icons/react/bold-duotone/phone";
import { LockIcon } from "@solar-icons/react/bold-duotone/lock";
import { EyeIcon } from "@solar-icons/react/bold-duotone/eye";
import { EyeClosedIcon } from "@solar-icons/react/bold-duotone/eye-closed";
import { CheckCircleIcon } from "@solar-icons/react/bold-duotone/check-circle";
import { AltArrowRightIcon } from "@solar-icons/react/bold-duotone/alt-arrow-right";
import { UserCircleIcon } from "@solar-icons/react/bold-duotone/user-circle";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";
import { useTranslation } from "react-i18next";
import { generateDeviceFingerprint, getClientIp } from "@/hooks/useDeviceFingerprint";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const API_BASE_URL = '';

const GoogleIcon = () => (
  <svg viewBox="0 0 48 48" className="w-5 h-5 shrink-0">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

const MicrosoftIcon = () => (
  <svg viewBox="0 0 23 23" className="w-5 h-5 text-slate-300 shrink-0">
    <path fill="#f3f3f3" d="M0 0h23v23H0z" /><path fill="#f35325" d="M1 1h10v10H1z" /><path fill="#81bc06" d="M12 1h10v10H12z" /><path fill="#05a6f0" d="M1 12h10v10H1z" /><path fill="#ffba08" d="M12 12h10v10H12z" />
  </svg>
);

const AppleIcon = () => (
  <svg viewBox="0 0 384 512" className="w-5 h-5 text-slate-300 shrink-0">
    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
  </svg>
);

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, profile, refreshProfile } = useAuth();
  const { t } = useTranslation();

  const [loginType, setLoginType] = useState<"user" | "center">(
    searchParams.get("type") === "center" || searchParams.get("role") === "center" ? "center" : "user"
  );
  const [authMode, setAuthMode] = useState<"login" | "register" | "reset">("login");
  const [loginStep, setLoginStep] = useState<'phone' | 'code'>('phone');
  const [loading, setLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [phone, setPhone] = useState("+998");
  const [tgCode, setTgCode] = useState("");
  const [botUsername, setBotUsername] = useState("educontesttbot");

  // Center login states
  const [centerLogin, setCenterLogin] = useState("");
  const [centerPassword, setCenterPassword] = useState("");
  const [showCenterPassword, setShowCenterPassword] = useState(false);
  const [centerSubmitting, setCenterSubmitting] = useState(false);

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
      toast({ title: t("auth.error"), description: err.message, variant: "destructive" });
    }
  };

  const handleSendCode = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();

    if (!phone || phone.replace(/\D/g, '').length < 9) {
      toast({
        title: t("auth.invalid_phone"),
        description: t("auth.enter_phone"),
        variant: "destructive"
      });
      return;
    }

    if (await checkDeviceBlocked()) return;

    setLoading(true);
    setIsSendingCode(true);
    setLoginStep('code');
    try {
      const fp = await generateDeviceFingerprint();
      window.open(`https://t.me/${botUsername}?start=start`, '_blank');

      const cleanPhone = phone.replace(/\D/g, '');
      const response = await fetch(`${API_BASE_URL}/api/auth/telegram/send-otp`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, fingerprint: fp })
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
      console.warn("send-otp error:", err);
      toast({
        title: "Telegram Bot",
        description: "Telegram botimizdan 6 xonali kodni oling."
      });
    } finally {
      setLoading(false);
      setIsSendingCode(false);
    }
  };

  const handleAuth = async (e?: React.FormEvent, customCode?: string) => {
    if (e) e.preventDefault();
    if (await checkDeviceBlocked()) return;
    setLoading(true);
    try {
      if (authMode === 'login') {
        if (loginStep === 'phone') {
          await handleSendCode();
          return;
        }

        const codeToVerify = (customCode || tgCode).replace(/\D/g, '').trim();
        if (!codeToVerify || codeToVerify.length < 6) {
          toast({ title: "Xatolik", description: "6 xonali tasdiqlash kodini kiriting", variant: "destructive" });
          setLoading(false);
          return;
        }

        const cleanPhone = phone.replace(/\D/g, '');
        const fp = await generateDeviceFingerprint();

        const response = await fetch(`${API_BASE_URL}/api/auth/telegram/verify-otp`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: cleanPhone, code: codeToVerify, fingerprint: fp })
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
          throw new Error(resJson.error || resJson.message || `Kod noto'g'ri yoki muddati o'tgan`);
        }

        toast({ title: "Muvaffaqiyatli!", description: "Xush kelibsiz!" });
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      toast({ title: "Xatolik", description: err.message || "Kod noto'g'ri", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCenterLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!centerLogin.trim() || !centerPassword) {
      toast({ title: "Xatolik", description: "Login va parolni kiriting", variant: "destructive" });
      return;
    }
    if (await checkDeviceBlocked()) return;

    setCenterSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/public/centers/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          login: centerLogin.trim(),
          password: centerPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login yoki parol noto'g'ri");
      }

      toast({
        title: "Muvaffaqiyatli!",
        description: `Xush kelibsiz! ${data.center?.name || "Markaz"} hisobingizga kirdingiz.`
      });

      await refreshProfile();

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        window.location.href = "/center";
      }
    } catch (err: any) {
      toast({ title: "Kirishda xatolik", description: err.message, variant: "destructive" });
    } finally {
      setCenterSubmitting(false);
    }
  };

  return (
    <>
      <SEO title="Kirish" description="EduContest platformasiga kiring va milliy sertifikatga tayyorlanishni boshlang. 10,000+ testlar, AI yordam va boshqa imkoniyatlar." />
      <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col overflow-hidden">
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2">
          <div className="flex flex-col items-center justify-center p-8 lg:p-16 bg-white dark:bg-slate-950 relative overflow-y-auto">
            <div className="w-full max-w-[400px] space-y-6 py-6">
              <div className="flex items-center gap-3 mb-8">
                <img src="/logo.png" className="w-10 h-10 object-contain" alt="Eduly AI" />
                <span className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white uppercase">
                  Eduly <span className="text-[#E8192C]">AI</span>
                </span>
              </div>

              <div className="space-y-1.5">
                <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900 dark:text-white tracking-tight">Xush kelibsiz</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                  {loginType === 'center' ? "O'quv markazi kabinetiga kiring" : "Telefon raqamingiz orqali kiring"}
                </p>
              </div>

              {/* Role selector tabs */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setLoginType("user")}
                  className={`h-10 rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    loginType === "user"
                      ? "border-[#E8192C] bg-red-50/50 dark:bg-red-950/20 text-[#E8192C] shadow-xs font-bold"
                      : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 font-semibold"
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span className="text-xs sm:text-[13px]">O'quvchi</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLoginType("center")}
                  className={`h-10 rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    loginType === "center"
                      ? "border-[#E8192C] bg-red-50/50 dark:bg-red-950/20 text-[#E8192C] shadow-xs font-bold"
                      : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 font-semibold"
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span className="text-xs sm:text-[13px]">O'quv markazi</span>
                </button>
              </div>

              {/* CENTER LOGIN FORM */}
              {loginType === "center" ? (
                <form onSubmit={handleCenterLogin} className="space-y-4 animate-in fade-in duration-300">
                  <div className="p-3.5 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/70 dark:border-rose-800/40 rounded-2xl flex items-start gap-3">
                    <Building2 className="w-4 h-4 text-[#E8192C] shrink-0 mt-0.5" />
                    <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      EduContest ta'lim markazlari portali. Arizangiz tasdiqlangach berilgan login va parolingizni kiriting.
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 ml-0.5 block">
                      Login / Username / Email / Telefon *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <UserCircle className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={centerLogin}
                        onChange={(e) => setCenterLogin(e.target.value)}
                        placeholder="masalan: testacademy yoki email@example.com"
                        className="w-full h-11 pl-10 pr-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#E8192C] focus:ring-2 focus:ring-[#E8192C]/10 transition-all outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 ml-0.5 block">
                      Parol *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showCenterPassword ? "text" : "password"}
                        value={centerPassword}
                        onChange={(e) => setCenterPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full h-11 pl-10 pr-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#E8192C] focus:ring-2 focus:ring-[#E8192C]/10 transition-all outline-none"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCenterPassword(!showCenterPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        {showCenterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={centerSubmitting}
                    className="w-full h-12 bg-[#E8192C] hover:bg-[#D41524] text-white rounded-xl font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-red-500/15 mt-2"
                  >
                    {centerSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <span>Markaz kabinetiga kirish</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="p-3 bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/70 dark:border-sky-800/40 rounded-xl flex items-center gap-2 text-xs text-sky-800 dark:text-sky-300">
                    <Send className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                    <span>Login ma'lumotlari Telegram botimiz (@{botUsername}) orqali yetkaziladi.</span>
                  </div>
                </form>
              ) : (
                /* USER (STUDENT) LOGIN */
                <>
                  <div className="space-y-3">
                    <button onClick={handleGoogleLogin} className="w-full h-11 flex items-center justify-center gap-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all font-semibold text-slate-700 dark:text-slate-200 text-sm cursor-pointer rounded-xl">
                      <GoogleIcon /> Google orqali davom etish
                    </button>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="relative group overflow-hidden rounded-xl">
                        <button disabled className="w-full h-11 flex items-center justify-center gap-2.5 border border-slate-200/80 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/70 text-slate-400 dark:text-slate-600 cursor-not-allowed filter blur-[1.5px] opacity-50 select-none pointer-events-none transition-all">
                          <MicrosoftIcon /> <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Microsoft</span>
                        </button>
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/5 dark:bg-slate-950/20 backdrop-blur-[2px] rounded-xl pointer-events-none">
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-800 shadow-xs">Tez kunda</span>
                        </div>
                      </div>

                      <div className="relative group overflow-hidden rounded-xl">
                        <button disabled className="w-full h-11 flex items-center justify-center gap-2.5 border border-slate-200/80 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/70 text-slate-400 dark:text-slate-600 cursor-not-allowed filter blur-[1.5px] opacity-50 select-none pointer-events-none transition-all">
                          <AppleIcon /> <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Apple ID</span>
                        </button>
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/5 dark:bg-slate-950/20 backdrop-blur-[2px] rounded-xl pointer-events-none">
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-800 shadow-xs">Tez kunda</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-800"></div></div>
                    <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-white dark:bg-slate-950 px-6 text-slate-400 dark:text-slate-500 font-semibold tracking-wider">Yoki</span></div>
                  </div>

                  <form onSubmit={handleAuth} className="space-y-4">
                    {loginStep === 'phone' ? (
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 ml-0.5 block">Telefon raqami</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Phone className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                          </div>
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full h-11 pl-10 pr-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-[#E8192C] focus:ring-2 focus:ring-[#E8192C]/10 transition-all font-semibold text-slate-900 dark:text-white text-base outline-none"
                            placeholder="+998"
                            required
                          />
                        </div>
                        <div className="flex items-start gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium ml-1 pt-0.5 leading-snug">
                          <Send className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" />
                          <span>
                            Tasdiqlash kodi Telegram botimiz (<a href={`https://t.me/${botUsername}?start=start`} target="_blank" rel="noreferrer" className="underline font-bold text-sky-600 dark:text-sky-400 hover:text-sky-800">@{botUsername}</a>) orqali yuboriladi.
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3.5 animate-in fade-in slide-in-from-bottom-3 duration-300">
                        <div className="p-3.5 bg-sky-50/90 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-2xl flex items-start gap-3 shadow-xs">
                          <div className="w-8 h-8 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                            <Send className="w-4 h-4 animate-pulse" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-sky-950 dark:text-sky-200 uppercase tracking-wider">✈️ Telegramga kod yuborildi!</p>
                            <p className="text-xs text-sky-900 dark:text-sky-300 leading-snug font-medium">
                              <b className="text-sky-950 dark:text-sky-100">{phone}</b> raqamingizga bog'langan <a href={`https://t.me/${botUsername}?start=start`} target="_blank" rel="noreferrer" className="underline font-bold text-sky-700 dark:text-sky-400 hover:text-sky-900">@{botUsername}</a> Telegram botidan 6 xonali tasdiqlash kodini kiriting.
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between ml-1">
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tasdiqlash kodi</label>
                            <button
                              type="button"
                              onClick={() => setLoginStep('phone')}
                              className="text-xs font-bold text-[#E8192C] hover:underline cursor-pointer"
                            >
                              Raqamni o'zgartirish
                            </button>
                          </div>
                          <div className="flex justify-center py-2">
                            <InputOTP
                              maxLength={6}
                              value={tgCode}
                              onChange={(val) => setTgCode(val.replace(/\D/g, '').slice(0, 6))}
                              onComplete={(code) => handleAuth(undefined, code)}
                              autoFocus
                            >
                              <InputOTPGroup className="gap-2 sm:gap-2.5">
                                <InputOTPSlot index={0} />
                                <InputOTPSlot index={1} />
                                <InputOTPSlot index={2} />
                                <InputOTPSlot index={3} />
                                <InputOTPSlot index={4} />
                                <InputOTPSlot index={5} />
                              </InputOTPGroup>
                            </InputOTP>
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading || (loginStep === 'code' && tgCode.length < 6)}
                      className="w-full h-12 bg-[#E8192C] hover:bg-[#D41524] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer mt-2"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                        <>
                          <span>{loginStep === 'phone' ? "Kodni yuborish" : "Kodni tasdiqlash"}</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}

              <div className="text-center pt-2">
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                  {loginType === 'center' ? (
                    <>
                      Markazingiz hali ro'yxatdan o'tmaganmi?{" "}
                      <Link to="/register" className="text-slate-900 dark:text-white font-semibold uppercase tracking-tighter hover:underline">
                        Ro'yxatdan o'tish
                      </Link>
                    </>
                  ) : (
                    <>
                      hali ro'yxatdan o'tmaganmisiz?{" "}
                      <Link to="/register" className="text-slate-900 dark:text-white font-semibold uppercase tracking-tighter hover:underline">
                        Ro'yxatdan o'tish
                      </Link>
                    </>
                  )}
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

export default Login;
