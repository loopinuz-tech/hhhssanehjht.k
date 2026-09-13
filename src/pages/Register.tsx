import { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import {
  Lock, Sparkles, ArrowRight, Phone, UserCircle, Send, Loader2,
  GraduationCap, School, Building2, Check, X, CreditCard, ShieldCheck,
  Image as ImageIcon, ExternalLink, RefreshCw, UploadCloud
} from "lucide-react";
import { StarsIcon } from "@solar-icons/react/bold-duotone/stars";
import { GiftIcon } from "@solar-icons/react/bold-duotone/gift";
import { RocketIcon } from "@solar-icons/react/bold-duotone/rocket";
import { CrownIcon } from "@solar-icons/react/bold-duotone/crown";
import { CupFirstIcon } from "@solar-icons/react/bold-duotone/cup-first";
import { CardIcon } from "@solar-icons/react/bold-duotone/card";
import { CheckCircleIcon as SolarCheckCircleIcon } from "@solar-icons/react/bold-duotone/check-circle";
import { VerifiedCheckIcon } from "@solar-icons/react/bold-duotone/verified-check";
import { AltArrowRightIcon } from "@solar-icons/react/bold-duotone/alt-arrow-right";
import { SendSquareIcon } from "@solar-icons/react/bold-duotone/send-square";
import { SquareAcademicCapIcon } from "@solar-icons/react/bold-duotone/square-academic-cap";
import { UserRoundedIcon } from "@solar-icons/react/bold-duotone/user-rounded";
import { BuildingsIcon } from "@solar-icons/react/bold-duotone/buildings";
import { InfoCircleIcon } from "@solar-icons/react/bold-duotone/info-circle";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import SEO from "@/components/SEO";
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

const REGIONS = [
  "Toshkent shahri", "Toshkent viloyati", "Samarqand viloyati", "Farg'ona viloyati",
  "Andijon viloyati", "Namangan viloyati", "Buxoro viloyati", "Xorazm viloyati",
  "Qashqadaryo viloyati", "Surxondaryo viloyati", "Jizzax viloyati", "Sirdaryo viloyati",
  "Navoiy viloyati", "Qoraqalpog'iston Respublikasi"
];

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile } = useAuth();

  const [step, setStep] = useState<'info' | 'code'>('info');
  const [loading, setLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [botUsername, setBotUsername] = useState("educontesttbot");

  // Registration role type: student, teacher, or center
  const [regType, setRegType] = useState<"student" | "teacher" | "center">("student");

  // Regular user form state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("+998");
  const [tgCode, setTgCode] = useState("");
  const [searchParams] = useSearchParams();
  const [hasRef, setHasRef] = useState(false);

  // Center registration form state
  const [centerName, setCenterName] = useState("");
  const [centerUsername, setCenterUsername] = useState("");
  const [usernameCheck, setUsernameCheck] = useState<{
    checking: boolean;
    available: boolean | null;
    message: string;
  }>({ checking: false, available: null, message: "" });
  const [legalName, setLegalName] = useState("");
  const [ownerFullName, setOwnerFullName] = useState("");
  const [centerPhone, setCenterPhone] = useState("+998");
  const [centerEmail, setCenterEmail] = useState("");
  const [centerTg, setCenterTg] = useState("");
  const [region, setRegion] = useState(REGIONS[0]);
  const [district, setDistrict] = useState("");
  const [address, setAddress] = useState("");
  const [subjects, setSubjects] = useState("Matematika, Ingliz tili, SAT");
  const [studentCount, setStudentCount] = useState("50-100");
  const [branchCount, setBranchCount] = useState(1);
  const [description, setDescription] = useState("");
  const [planName, setPlanName] = useState("14 kunlik bepul sinov (Trial)");
  const [planPrice, setPlanPrice] = useState(0);

  // Center logo & Telegram link states
  const [centerLogoUrl, setCenterLogoUrl] = useState("");
  const [tgSessionToken, setTgSessionToken] = useState("");
  const [tgSessionLink, setTgSessionLink] = useState("");
  const [isTgLinked, setIsTgLinked] = useState(false);
  const [linkedChatId, setLinkedChatId] = useState<number | null>(null);
  const [linkedTgUser, setLinkedTgUser] = useState<string | null>(null);
  const [manualChatId, setManualChatId] = useState("");
  const [checkingTgLink, setCheckingTgLink] = useState(false);
  const [showManualTg, setShowManualTg] = useState(false);
  const checkTgStatusRef = useRef<() => void>(() => {});

  // Logo file upload state
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);

  // Success modal and payment for center registration
  const [createdCenter, setCreatedCenter] = useState<any>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [inPayLoading, setInPayLoading] = useState(false);

  // Debounced Center Username Check
  useEffect(() => {
    if (regType !== "center" || !centerUsername || centerUsername.length < 3) {
      setUsernameCheck({ checking: false, available: null, message: "" });
      return;
    }

    const handler = setTimeout(async () => {
      setUsernameCheck({ checking: true, available: null, message: "Tekshirilmoqda..." });
      try {
        const res = await fetch(`/api/public/centers/check-username/${encodeURIComponent(centerUsername.trim().toLowerCase())}`);
        const data = await res.json();
        setUsernameCheck({
          checking: false,
          available: data.available,
          message: data.message || (data.available ? "Username band emas" : "Bu username band")
        });
      } catch {
        setUsernameCheck({ checking: false, available: null, message: "" });
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [centerUsername, regType]);

  // Telegram session token & polling for Center Registration
  useEffect(() => {
    if (regType !== "center" || isTgLinked) return;

    let isSubscribed = true;
    let pollInterval: any = null;

    const checkStatus = async (tokenToCheck: string) => {
      if (!tokenToCheck || !isSubscribed) return;
      try {
        const sRes = await fetch(`/api/public/centers/telegram-session/status/${tokenToCheck}`);
        const sJson = await sRes.json();
        if (sJson.linked && isSubscribed) {
          setIsTgLinked(true);
          setLinkedChatId(sJson.chat_id);
          if (sJson.telegram_username) {
            setLinkedTgUser(sJson.telegram_username);
            setCenterTg(sJson.telegram_username);
          }
          toast({
            title: "Telegram bot muvaffaqiyatli ulandi! 🎉",
            description: "Arizangiz tasdiqlangach login va parol ushbu bot orqali yuboriladi."
          });
          if (pollInterval) clearInterval(pollInterval);
        }
      } catch (_) {}
    };

    checkTgStatusRef.current = () => {
      if (tgSessionToken) checkStatus(tgSessionToken);
    };

    const initTgSession = async () => {
      try {
        const res = await fetch("/api/public/centers/telegram-session/token");
        const json = await res.json();
        if (json.token && isSubscribed) {
          setTgSessionToken(json.token);
          setTgSessionLink(json.link);

          checkStatus(json.token);

          // Fast interval: 1500ms
          pollInterval = setInterval(() => {
            checkStatus(json.token);
          }, 1500);
        }
      } catch (e) {
        console.error("Failed to init TG session", e);
      }
    };

    if (!tgSessionToken) {
      initTgSession();
    } else {
      pollInterval = setInterval(() => {
        checkStatus(tgSessionToken);
      }, 1500);
    }

    // Auto check when user switches back from Telegram app to browser tab
    const onVisibilityOrFocus = () => {
      if (tgSessionToken && isSubscribed && !isTgLinked) {
        checkStatus(tgSessionToken);
      }
    };
    window.addEventListener("focus", onVisibilityOrFocus);
    document.addEventListener("visibilitychange", onVisibilityOrFocus);

    return () => {
      isSubscribed = false;
      if (pollInterval) clearInterval(pollInterval);
      window.removeEventListener("focus", onVisibilityOrFocus);
      document.removeEventListener("visibilitychange", onVisibilityOrFocus);
    };
  }, [regType, isTgLinked, tgSessionToken]);

  const handleManualTgLink = async (customVal?: string) => {
    const val = (customVal || manualChatId).trim();
    if (!val) {
      toast({ title: "Xatolik", description: "Telegram botdan olingan 6 xonali kod yoki Chat ID ni kiriting", variant: "destructive" });
      return;
    }
    setCheckingTgLink(true);
    try {
      const res = await fetch("/api/public/centers/telegram-session/manual-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: tgSessionToken,
          code: val,
          chat_id: val,
          telegram_username: centerTg || null
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Kodni tasdiqlashda xatolik");

      setIsTgLinked(true);
      setLinkedChatId(json.chat_id);
      if (json.first_name) {
        setLinkedTgUser(json.first_name);
      }
      toast({
        title: "Telegram hisob muvaffaqiyatli bog'landi! 🎉",
        description: `Ulangan hisob: ${json.first_name || 'Tasdiqlandi'} (Chat ID: ${json.chat_id})`
      });
    } catch (err: any) {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    } finally {
      setCheckingTgLink(false);
    }
  };

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

    if (user && profile && regType !== "center") {
      if (!profile?.full_name || !profile?.phone) {
        navigate("/onboarding", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [user, profile, navigate, regType]);

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

  const handleVerify = async (e?: React.FormEvent, customCode?: string) => {
    if (e) e.preventDefault();
    if (await checkDeviceBlocked()) return;
    setLoading(true);
    try {
      const codeToVerify = (customCode || tgCode).replace(/\D/g, '').trim();
      if (!codeToVerify || codeToVerify.length < 6) {
        toast({ title: "Xatolik", description: "6 xonali tasdiqlash kodini to'liq kiriting", variant: "destructive" });
        setLoading(false);
        return;
      }

      const cleanPhone = phone.replace(/\D/g, '');
      const fp = await generateDeviceFingerprint();

      const response = await fetch(`${API_BASE_URL}/api/auth/register/verify`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          code: codeToVerify,
          full_name: fullName,
          role: regType === "teacher" ? "teacher" : "student",
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

  // Handle direct file upload from computer for center logo
  const handleLogoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Fayl formati noto'g'ri",
        description: "Faqat rasm fayllari (PNG, JPG, SVG, WebP) yuklanishi mumkin",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Fayl hajmi katta",
        description: "Logotip hajmi 5MB dan oshmasligi kerak",
        variant: "destructive"
      });
      return;
    }

    setLogoUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_BASE_URL}/api/public/upload/center-logo`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Logotipni yuklab bo'lmadi");
      }

      setCenterLogoUrl(data.url);
      toast({ title: "Logotip yuklandi! ✅", description: "Markaz logotipi muvaffaqiyatli saqlandi" });
    } catch (err: any) {
      toast({ title: "Yuklashda xatolik", description: err.message, variant: "destructive" });
    } finally {
      setLogoUploading(false);
      if (logoFileInputRef.current) logoFileInputRef.current.value = "";
    }
  };

  // Center registration submission
  const handleCenterRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!centerName || !centerUsername || !ownerFullName) {
      toast({ title: "Xatolik", description: "Markaz nomi, username va egasining ismini kiriting", variant: "destructive" });
      return;
    }

    if (usernameCheck.available === false) {
      toast({ title: "Username band", description: "Iltimos, boshqa username tanlang", variant: "destructive" });
      return;
    }

    if (!isTgLinked && !linkedChatId) {
      toast({
        title: "Telegram botga ulanish shart!",
        description: "Arizangiz tasdiqlangach login va parolingiz Telegram bot orqali avtomatik yuboriladi. Iltimos, oldin Telegram botimizga ulaning.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const subjectArray = subjects.split(',').map(s => s.trim()).filter(Boolean);

      const response = await fetch(`${API_BASE_URL}/api/centers/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: centerName,
          username: centerUsername.trim().toLowerCase(),
          legal_name: legalName || null,
          owner_full_name: ownerFullName,
          phone: centerPhone,
          email: centerEmail || null,
          telegram_username: linkedTgUser || centerTg || null,
          telegram_chat_id: linkedChatId,
          region,
          district: district || null,
          address: address || null,
          logo_url: centerLogoUrl.trim() || null,
          subjects: subjectArray,
          student_count_range: studentCount,
          branch_count: branchCount,
          description: description || null,
          plan_name: planName,
          plan_price: planPrice,
          is_trial: planPrice === 0
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Markazni ro'yxatdan o'tkazishda xatolik yuz berdi");
      }

      setCreatedCenter(data.center);
      if (data.checkout_url && planPrice > 0) {
        setCheckoutUrl(data.checkout_url);
        toast({
          title: "Ariza qabul qilindi! 🎉",
          description: "InPay to'lov tizimiga yo'naltirilmoqdasiz..."
        });
        setTimeout(() => {
          window.location.href = data.checkout_url;
        }, 800);
      } else {
        toast({
          title: "Arizangiz qabul qilindi! 🎉",
          description: planPrice === 0
            ? "14 kunlik bepul sinov arizangiz ma'muriyatga yuborildi. Tasdiqlangach login va parol Telegram botingizga yuboriladi."
            : "O'quv markazi muvaffaqiyatli ro'yxatga olindi!"
        });
      }
    } catch (err: any) {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleInPayCheckout = async () => {
    if (checkoutUrl) {
      window.location.href = checkoutUrl;
      return;
    }
    if (!createdCenter) return;
    setInPayLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/centers/subscription/inpay-create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          center_id: createdCenter.id,
          plan_name: planName,
          amount: planPrice,
          return_url: `https://educontest.uz/c/${createdCenter.username}`
        })
      });
      const data = await res.json();
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        toast({ title: "To'lov xatoligi", description: data.error || "InPay havolasini olib bo'lmadi", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    } finally {
      setInPayLoading(false);
    }
  };

  return (
    <>
      <SEO title="Ro'yxatdan o'tish" description="EduContest platformasida o'quvchi, o'qituvchi yoki o'quv markazi sifatida ro'yxatdan o'ting." />
      <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col overflow-x-hidden">
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2">
          <div className="flex flex-col items-center justify-center p-4 sm:p-6 lg:p-12 bg-white dark:bg-slate-950 relative overflow-y-auto">
            <div className={`w-full ${regType === 'center' ? 'max-w-[560px]' : 'max-w-[440px]'} space-y-5 sm:space-y-6 py-4 sm:py-8 transition-all duration-300`}>
              <div className="flex items-center gap-3 mb-4">
                <img src="/logo.png" className="w-10 h-10 object-contain" alt="EduContest" />
                <span className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white uppercase">
                  Edu<span className="text-[#E8192C]">Contest</span>
                </span>
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl lg:text-4xl font-semibold text-slate-900 dark:text-white tracking-tight">Ro'yxatdan o'tish</h1>
                <p className="text-[15px] text-slate-500 dark:text-slate-400 font-medium">Platformamizga xush kelibsiz!</p>

                {hasRef && regType !== "center" && (
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

              {/* RO'YXATDAN O'TISH TURI */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Ro'yxatdan o'tish turi</label>
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => { setRegType("student"); setStep('info'); }}
                    className={`h-11 px-1 sm:px-2 rounded-xl border flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${regType === "student"
                      ? "border-[#E8192C] bg-red-50/50 dark:bg-red-950/20 text-[#E8192C] shadow-xs font-bold"
                      : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 font-semibold"
                      }`}
                  >
                    <SquareAcademicCapIcon size={16} className="shrink-0" />
                    <span className="text-xs sm:text-[13px] truncate">O'quvchi</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setRegType("teacher"); setStep('info'); }}
                    className={`h-11 px-1 sm:px-2 rounded-xl border flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${regType === "teacher"
                      ? "border-[#E8192C] bg-red-50/50 dark:bg-red-950/20 text-[#E8192C] shadow-xs font-bold"
                      : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 font-semibold"
                      }`}
                  >
                    <UserRoundedIcon size={16} className="shrink-0" />
                    <span className="text-xs sm:text-[13px] truncate">O'qituvchi</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegType("center")}
                    className={`h-11 px-1 sm:px-2 rounded-xl border flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${regType === "center"
                      ? "border-[#E8192C] bg-red-50/50 dark:bg-red-950/20 text-[#E8192C] shadow-xs font-bold"
                      : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 font-semibold"
                      }`}
                  >
                    <BuildingsIcon size={16} className="shrink-0" />
                    <span className="text-xs sm:text-[13px] truncate">O'quv markazi</span>
                  </button>
                </div>
              </div>

              {/* ========================================================= */}
              {/* O'QUVCHI YOKI O'QITUVCHI RO'YXATDAN O'TISH FORMASI */}
              {/* ========================================================= */}
              {regType !== "center" && (
                <>
                  {step === 'info' && (
                    <div className="space-y-4">
                      <button onClick={handleGoogleLogin} className="w-full h-12 flex items-center justify-center gap-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all font-semibold text-slate-700 dark:text-slate-200 text-[14px] cursor-pointer rounded-2xl">
                        <GoogleIcon /> Google orqali davom etish
                      </button>

                      <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-800"></div></div>
                        <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-white dark:bg-slate-950 px-6 text-slate-400 dark:text-slate-500 font-semibold tracking-wider">Yoki</span></div>
                      </div>
                    </div>
                  )}

                  <form onSubmit={step === 'info' ? handleSendCode : handleVerify} className="space-y-4">
                    {step === 'info' ? (
                      <>
                        <div className="space-y-1.5">
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

                        <div className="space-y-1.5">
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
                          <div className="flex items-center justify-between ml-1">
                            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Tasdiqlash kodi</label>
                            <button
                              type="button"
                              onClick={() => setStep('info')}
                              className="text-xs font-bold text-[#E8192C] hover:underline cursor-pointer"
                            >
                              Ma'lumotlarni o'zgartirish
                            </button>
                          </div>
                          <div className="flex justify-center py-2">
                            <InputOTP
                              maxLength={6}
                              value={tgCode}
                              onChange={(val) => setTgCode(val.replace(/\D/g, '').slice(0, 6))}
                              onComplete={(code) => handleVerify(undefined, code)}
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
                      disabled={loading || (step === 'code' && tgCode.length < 6)}
                      className="w-full h-14 bg-[#E8192C] hover:bg-[#D41524] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-semibold text-[15px] transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-4 cursor-pointer"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                        <>
                          <span>{step === 'info' ? "Kodni yuborish" : "Kodni tasdiqlash"}</span>
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}

              {/* ========================================================= */}
              {/* O'QUV MARKAZI RO'YXATDAN O'TISH FORMASI */}
              {/* ========================================================= */}
              {regType === "center" && !createdCenter && (
                <form onSubmit={handleCenterRegister} className="space-y-4 animate-in fade-in duration-300">
                  {/* Markaz Logotipi (Kompyuterdan yuklash yoki URL) */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl">
                    <input
                      type="file"
                      ref={logoFileInputRef}
                      onChange={handleLogoFileSelect}
                      accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                      className="hidden"
                    />

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <div
                        onClick={() => logoFileInputRef.current?.click()}
                        className="w-16 h-16 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 flex items-center justify-center overflow-hidden shrink-0 shadow-xs cursor-pointer hover:border-[#E8192C] transition-colors group relative"
                        title="Kompyuterdan rasm tanlash"
                      >
                        {logoUploading ? (
                          <Loader2 className="w-6 h-6 animate-spin text-[#E8192C]" />
                        ) : centerLogoUrl.trim() ? (
                          <img
                            src={centerLogoUrl.trim()}
                            alt="Logo preview"
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                          />
                        ) : (
                          <div className="text-center p-1">
                            <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-[#E8192C] mx-auto transition-colors" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                          Markaz logotipi
                        </label>
                        <p className="text-[11.5px] text-slate-500 mt-0.5">
                          {centerLogoUrl ? "Logotip muvaffaqiyatli tanlandi." : "Kompyuteringizdan logotip rasmini yuklang (PNG, JPG, SVG, maks 5MB)."}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <button
                            type="button"
                            disabled={logoUploading}
                            onClick={() => logoFileInputRef.current?.click()}
                            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                          >
                            <UploadCloud className="w-3.5 h-3.5 text-slate-500" />
                            <span>{logoUploading ? "Yuklanmoqda..." : centerLogoUrl ? "Almashtirish" : "Kompyuterdan yuklash"}</span>
                          </button>

                          {centerLogoUrl && (
                            <button
                              type="button"
                              onClick={() => setCenterLogoUrl("")}
                              className="px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-100 transition-all cursor-pointer"
                            >
                              O'chirish
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setShowUrlInput(!showUrlInput)}
                            className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline cursor-pointer"
                          >
                            {showUrlInput ? "Yashirish" : "URL orqali kiritish"}
                          </button>
                        </div>

                        {showUrlInput && (
                          <div className="mt-2.5">
                            <input
                              type="url"
                              value={centerLogoUrl}
                              onChange={(e) => setCenterLogoUrl(e.target.value)}
                              placeholder="https://example.com/logo.png"
                              className="w-full h-9 px-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#E8192C] outline-none"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {/* Markaz Nomi */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 ml-0.5 block">Markaz nomi *</label>
                      <input
                        type="text"
                        value={centerName}
                        onChange={(e) => setCenterName(e.target.value)}
                        placeholder="Foxford Academy"
                        className="w-full h-11 px-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#E8192C] focus:ring-2 focus:ring-[#E8192C]/10 transition-all outline-none"
                        required
                      />
                    </div>

                    {/* Markaz Username / Slug */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 ml-0.5 block">Markaz Username (Slug) *</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={centerUsername}
                          onChange={(e) => setCenterUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                          placeholder="foxford"
                          className={`w-full h-11 px-3.5 pr-9 bg-white dark:bg-slate-900 border rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 transition-all outline-none ${
                            usernameCheck.available === true
                              ? "border-emerald-500 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10"
                              : usernameCheck.available === false
                              ? "border-rose-500 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/10"
                              : "border-slate-200 dark:border-slate-800 focus:border-[#E8192C] focus:ring-2 focus:ring-[#E8192C]/10"
                          }`}
                          required
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          {usernameCheck.checking && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
                          {!usernameCheck.checking && usernameCheck.available === true && <Check className="w-4 h-4 text-emerald-500 stroke-[2.5]" />}
                          {!usernameCheck.checking && usernameCheck.available === false && <X className="w-4 h-4 text-rose-500 stroke-[2.5]" />}
                        </div>
                      </div>
                      <div className="space-y-0.5 pt-0.5 text-[11.5px]">
                        <div className="text-slate-500 dark:text-slate-400 truncate">
                          Havola: <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">educontest.uz/c/{centerUsername || 'username'}</span>
                        </div>
                        {usernameCheck.message && (
                          <div className={`font-semibold flex items-center gap-1 ${usernameCheck.available ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                            {usernameCheck.available ? <Check className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" /> : <X className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />}
                            <span>{usernameCheck.message}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Yuridik nomi & Egasi ismi */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 ml-0.5 block">Yuridik nomi (MChJ / YaTT)</label>
                      <input
                        type="text"
                        value={legalName}
                        onChange={(e) => setLegalName(e.target.value)}
                        placeholder="Foxford Education MChJ"
                        className="w-full h-11 px-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#E8192C] focus:ring-2 focus:ring-[#E8192C]/10 transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 ml-0.5 block">Egasi to'liq ismi (F.I.Sh.) *</label>
                      <input
                        type="text"
                        value={ownerFullName}
                        onChange={(e) => setOwnerFullName(e.target.value)}
                        placeholder="Ali Valiyev"
                        className="w-full h-11 px-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#E8192C] focus:ring-2 focus:ring-[#E8192C]/10 transition-all outline-none"
                        required
                      />
                    </div>
                  </div>

                  {/* Telefon & Email */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 ml-0.5 block">Telefon raqam *</label>
                      <input
                        type="tel"
                        value={centerPhone}
                        onChange={(e) => setCenterPhone(e.target.value)}
                        placeholder="+998901234567"
                        className="w-full h-11 px-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#E8192C] focus:ring-2 focus:ring-[#E8192C]/10 transition-all outline-none"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 ml-0.5 block">Email (ixtiyoriy)</label>
                      <input
                        type="email"
                        value={centerEmail}
                        onChange={(e) => setCenterEmail(e.target.value)}
                        placeholder="info@foxford.uz"
                        className="w-full h-11 px-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#E8192C] focus:ring-2 focus:ring-[#E8192C]/10 transition-all outline-none"
                      />
                    </div>
                  </div>

                  {/* Viloyat & Tuman */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 ml-0.5 block">Viloyat / Hudud *</label>
                      <select
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        className="w-full h-11 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:border-[#E8192C] focus:ring-2 focus:ring-[#E8192C]/10 transition-all outline-none cursor-pointer"
                      >
                        {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 ml-0.5 block">Tuman / Shahar</label>
                      <input
                        type="text"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        placeholder="Yunusobod tumani"
                        className="w-full h-11 px-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#E8192C] focus:ring-2 focus:ring-[#E8192C]/10 transition-all outline-none"
                      />
                    </div>
                  </div>

                  {/* Manzil */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 ml-0.5 block">To'liq manzil</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Amir Temur ko'chasi, 45-uy"
                      className="w-full h-11 px-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#E8192C] focus:ring-2 focus:ring-[#E8192C]/10 transition-all outline-none"
                    />
                  </div>

                  {/* Fanlar & O'quvchilar soni */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 ml-0.5 block">O'qitiladigan fanlar</label>
                      <input
                        type="text"
                        value={subjects}
                        onChange={(e) => setSubjects(e.target.value)}
                        placeholder="Matematika, SAT, Ingliz tili"
                        className="w-full h-11 px-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#E8192C] focus:ring-2 focus:ring-[#E8192C]/10 transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 ml-0.5 block">O'quvchilar soni</label>
                      <select
                        value={studentCount}
                        onChange={(e) => setStudentCount(e.target.value)}
                        className="w-full h-11 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:border-[#E8192C] focus:ring-2 focus:ring-[#E8192C]/10 transition-all outline-none cursor-pointer"
                      >
                        <option value="50 tagacha">50 tagacha</option>
                        <option value="50-100">50 - 100 nafar</option>
                        <option value="100-300">100 - 300 nafar</option>
                        <option value="300-500">300 - 500 nafar</option>
                        <option value="500+">500 nafardan ko'p</option>
                      </select>
                    </div>
                  </div>

                  {/* ========================================================= */}
                  {/* MAJBURIY TELEGRAM BOT ULASH KARTASI */}
                  {/* ========================================================= */}
                  <div className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                    isTgLinked 
                      ? "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/70" 
                      : "bg-sky-50/80 dark:bg-sky-950/30 border-sky-300 dark:border-sky-800/70 shadow-xs"
                  }`}>
                    <div className="flex items-start gap-2.5 sm:gap-3">
                      <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isTgLinked ? "bg-emerald-500 text-white shadow-xs" : "bg-sky-500 text-white shadow-xs animate-pulse"
                      }`}>
                        {isTgLinked ? <SolarCheckCircleIcon size={20} className="text-white" /> : <SendSquareIcon size={20} className="text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white truncate">
                            {isTgLinked ? "✓ Telegram bot muvaffaqiyatli ulandi!" : "Telegram botga ulanish (Majburiy)"}
                          </h4>
                          {isTgLinked ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded-full shrink-0">
                              <SolarCheckCircleIcon size={12} className="text-emerald-700 dark:text-emerald-300" />
                              <span>Ulangan</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 rounded-full shrink-0">
                              Kutilmoqda
                            </span>
                          )}
                        </div>

                        <p className="text-[11.5px] sm:text-[12px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                          {isTgLinked 
                            ? `Arizangiz Super Admin tasdiqlashi bilan markaz boshqaruv panelining login va paroli ushbu bot (@${linkedTgUser || 'hisobingiz'}) ga avtomatik tarzda yuboriladi.`
                            : `Arizangiz tasdiqlangach login va parolingiz Telegram bot orqali yuboriladi. Quyidagi tugma orqali botga /start bosing:`
                          }
                        </p>

                        {!isTgLinked && (
                          <div className="mt-3 space-y-2">
                            <a
                              href={tgSessionLink || `https://t.me/${botUsername || 'educontesttbot'}?start=center_${tgSessionToken}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => {
                                setTimeout(() => {
                                  checkTgStatusRef.current?.();
                                }, 1500);
                              }}
                              className="w-full min-h-[44px] h-auto py-2.5 px-3 inline-flex items-center justify-center gap-2 bg-[#229ED9] hover:bg-[#1e8cc0] text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs text-center leading-tight"
                            >
                              <SendSquareIcon size={18} className="text-white shrink-0" />
                              <span className="break-words sm:truncate">Telegram botga ulanish (@{botUsername || 'educontesttbot'})</span>
                              <ExternalLink className="w-3.5 h-3.5 opacity-75 shrink-0" />
                            </a>

                            <div className="flex items-center justify-between pt-1 text-[11px] gap-2">
                              <span className="text-slate-500 flex items-center gap-1.5 font-medium truncate">
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-500 shrink-0" />
                                <span className="truncate">Botga /start bosishingiz kutilmoqda...</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setCheckingTgLink(true);
                                  checkTgStatusRef.current?.();
                                  setTimeout(() => setCheckingTgLink(false), 800);
                                }}
                                className="text-sky-600 hover:text-sky-700 dark:text-sky-400 font-bold inline-flex items-center gap-1 cursor-pointer shrink-0"
                              >
                                <RefreshCw className={`w-3 h-3 ${checkingTgLink ? 'animate-spin' : ''}`} />
                                <span>Tekshirish</span>
                              </button>
                            </div>

                            {/* Manual 6-digit code or Chat ID verification */}
                            <div className="pt-2 border-t border-sky-200/60 dark:border-sky-800/60 mt-1.5">
                              <label className="text-[11px] sm:text-[11.5px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                                Yoki botdan yuborilgan 6 xonali kod / Chat ID ni kiriting:
                              </label>
                              <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                  type="text"
                                  value={manualChatId}
                                  onChange={(e) => {
                                    const val = e.target.value.trim();
                                    setManualChatId(val);
                                    if (val.length === 6 && /^\d{6}$/.test(val)) {
                                      handleManualTgLink(val);
                                    }
                                  }}
                                  placeholder="Masalan: 588301 yoki Chat ID"
                                  className="w-full sm:flex-1 h-9 px-3 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-medium focus:border-sky-500 outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleManualTgLink()}
                                  disabled={checkingTgLink}
                                  className="w-full sm:w-auto h-9 px-3.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shrink-0 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                                >
                                  {checkingTgLink ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <SolarCheckCircleIcon size={16} className="text-white" />}
                                  <span>Tasdiqlash</span>
                                </button>
                              </div>
                              <p className="text-[10.5px] text-slate-400 mt-1">
                                Telegram botdan berilgan 6 xonali tasdiqlash kodini kiritsangiz ham hisobingiz darhol bog'lanadi.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tarif tanlash */}
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 ml-0.5 block">
                        Obuna tarifi
                      </label>
                      <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5">
                        <GiftIcon size={14} className="text-purple-600 dark:text-purple-400" />
                        <span>14 kun bepul test sinov</span>
                      </span>
                    </div>

                    {/* 14-day Free Trial Prominent Card */}
                    <div
                      onClick={() => {
                        setPlanName("14 kunlik bepul sinov (Trial)");
                        setPlanPrice(0);
                      }}
                      className={`p-3 sm:p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        planPrice === 0
                          ? "border-purple-500 bg-purple-50/80 dark:bg-purple-950/30 ring-2 ring-purple-500/20 shadow-xs"
                          : "border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-800/60 bg-white dark:bg-slate-900"
                      }`}
                    >
                      <div className="flex items-start sm:items-center gap-2.5 sm:gap-3">
                        <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                          planPrice === 0 ? "bg-purple-600 text-white shadow-md shadow-purple-600/30" : "bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400"
                        }`}>
                          <StarsIcon size={24} className={planPrice === 0 ? "text-white" : "text-purple-600 dark:text-purple-400"} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <span className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white">14 kunlik bepul test sinov rejimi</span>
                            <span className="px-1.5 py-0.5 bg-purple-600 text-white text-[9px] font-black rounded-full uppercase tracking-wider shrink-0">
                              Tavsiya etiladi
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                            Karta talab etilmaydi. Barcha imkoniyatlar 14 kun mutlaqo bepul.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:flex-col sm:items-end sm:text-right pt-2 sm:pt-0 border-t sm:border-t-0 border-purple-200/60 dark:border-purple-900/60 shrink-0">
                        <div className="text-base sm:text-lg font-black text-purple-600 dark:text-purple-400">0 so'm</div>
                        <div className="text-[10px] sm:text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400">14 kun bepul</div>
                      </div>
                    </div>

                    {/* Paid Plans Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5 pt-0.5">
                      <div
                        onClick={() => { setPlanName("EduCenter Basic"); setPlanPrice(290000); }}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          planName === "EduCenter Basic" ? "border-[#E8192C] bg-red-50/50 dark:bg-red-950/20 ring-1 ring-[#E8192C]" : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex sm:flex-col items-center sm:items-stretch justify-between gap-2">
                          <div className="flex items-center gap-2.5 sm:w-full sm:justify-between">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                              <RocketIcon size={18} className={planName === "EduCenter Basic" ? "text-[#E8192C]" : "text-slate-400"} />
                            </div>
                            <div className="sm:hidden">
                              <div className="text-xs font-bold text-slate-900 dark:text-white">Basic</div>
                              <div className="text-[10.5px] text-slate-500 leading-tight">100 o'quvchi, 10 sinf</div>
                            </div>
                            <div className="hidden sm:block text-xs font-bold text-slate-900 dark:text-white">Basic</div>
                          </div>
                          <div className="text-right sm:text-left sm:mt-1">
                            <div className="text-sm font-black text-[#E8192C]">290,000 <span className="text-[10px] font-normal">so'm</span></div>
                            <div className="hidden sm:block text-[10.5px] text-slate-500 mt-0.5 leading-tight">100 o'quvchi, 10 sinf</div>
                          </div>
                        </div>
                      </div>

                      <div
                        onClick={() => { setPlanName("EduCenter Pro"); setPlanPrice(490000); }}
                        className={`p-3 rounded-xl border cursor-pointer transition-all relative ${
                          planName === "EduCenter Pro" ? "border-[#E8192C] bg-red-50/50 dark:bg-red-950/20 ring-1 ring-[#E8192C]" : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                        }`}
                      >
                        <div className="absolute top-2.5 right-2 sm:-top-1.5 sm:right-1.5 px-1.5 py-0.2 bg-[#E8192C] text-white text-[9px] font-bold rounded-full shadow-xs">Pro</div>
                        <div className="flex sm:flex-col items-center sm:items-stretch justify-between gap-2 pr-8 sm:pr-0">
                          <div className="flex items-center gap-2.5 sm:w-full sm:justify-between">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                              <CrownIcon size={18} className={planName === "EduCenter Pro" ? "text-[#E8192C]" : "text-slate-400"} />
                            </div>
                            <div className="sm:hidden">
                              <div className="text-xs font-bold text-slate-900 dark:text-white">Pro</div>
                              <div className="text-[10.5px] text-slate-500 leading-tight">500 o'quvchi, 30 sinf</div>
                            </div>
                            <div className="hidden sm:block text-xs font-bold text-slate-900 dark:text-white">Pro</div>
                          </div>
                          <div className="text-right sm:text-left sm:mt-1">
                            <div className="text-sm font-black text-[#E8192C]">490,000 <span className="text-[10px] font-normal">so'm</span></div>
                            <div className="hidden sm:block text-[10.5px] text-slate-500 mt-0.5 leading-tight">500 o'quvchi, 30 sinf</div>
                          </div>
                        </div>
                      </div>

                      <div
                        onClick={() => { setPlanName("EduCenter Premium"); setPlanPrice(890000); }}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          planName === "EduCenter Premium" ? "border-[#E8192C] bg-red-50/50 dark:bg-red-950/20 ring-1 ring-[#E8192C]" : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex sm:flex-col items-center sm:items-stretch justify-between gap-2">
                          <div className="flex items-center gap-2.5 sm:w-full sm:justify-between">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                              <CupFirstIcon size={18} className={planName === "EduCenter Premium" ? "text-[#E8192C]" : "text-slate-400"} />
                            </div>
                            <div className="sm:hidden">
                              <div className="text-xs font-bold text-slate-900 dark:text-white">Premium</div>
                              <div className="text-[10.5px] text-slate-500 leading-tight">Cheksiz imkoniyat</div>
                            </div>
                            <div className="hidden sm:block text-xs font-bold text-slate-900 dark:text-white">Premium</div>
                          </div>
                          <div className="text-right sm:text-left sm:mt-1">
                            <div className="text-sm font-black text-[#E8192C]">890,000 <span className="text-[10px] font-normal">so'm</span></div>
                            <div className="hidden sm:block text-[10.5px] text-slate-500 mt-0.5 leading-tight">Cheksiz imkoniyat</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || usernameCheck.available === false || (!isTgLinked && !linkedChatId)}
                    className={`w-full min-h-[48px] h-auto py-3 px-4 text-white rounded-xl font-bold text-xs sm:text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-4 cursor-pointer shadow-md text-center leading-tight ${
                      planPrice === 0
                        ? "bg-purple-600 hover:bg-purple-700 shadow-purple-600/20"
                        : "bg-[#E8192C] hover:bg-[#D41524] shadow-red-500/20"
                    } disabled:opacity-50`}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                        <span>{planPrice === 0 ? "Ariza yuborilmoqda..." : "Arizani yuborish va InPay to'loviga o'tish..."}</span>
                      </>
                    ) : (
                      <>
                        {planPrice === 0 ? (
                          <>
                            <StarsIcon size={20} className="text-amber-300 shrink-0" />
                            <span className="break-words">14 kunlik bepul sinovni boshlash (0 so'm)</span>
                            <AltArrowRightIcon size={18} className="text-white shrink-0" />
                          </>
                        ) : (
                          <>
                            <CardIcon size={20} className="text-white shrink-0" />
                            <span className="break-words">Arizani topshirish va InPay to'loviga o'tish ({planPrice.toLocaleString()} so'm)</span>
                            <AltArrowRightIcon size={18} className="text-white shrink-0" />
                          </>
                        )}
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* SUCCESS MODAL FOR CENTER */}
              {createdCenter && (
                <div className="space-y-4 p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl animate-in zoom-in-95">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                      planPrice === 0 ? "bg-purple-600 text-white shadow-md shadow-purple-600/30" : "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                    }`}>
                      <VerifiedCheckIcon size={26} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {planPrice === 0 ? "14 kunlik bepul sinov arizasi qabul qilindi!" : "Arizangiz qabul qilindi!"}
                      </h3>
                      <p className="text-xs text-slate-500">
                        <b>{createdCenter.name}</b> o'quv markazi muvaffaqiyatli ro'yxatga olindi.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Markaz portali:</span>
                      <span className="font-semibold text-slate-900 dark:text-white font-mono">educontest.uz/c/{createdCenter.username}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tanlangan tarif:</span>
                      <span className={`font-bold ${planPrice === 0 ? "text-purple-600 dark:text-purple-400" : "text-[#E8192C]"}`}>
                        {planPrice === 0 ? "14 kunlik bepul sinov (0 so'm)" : `${planName} (${planPrice.toLocaleString()} so'm)`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">Telegram hisob:</span>
                      <span className="font-bold text-emerald-600 inline-flex items-center gap-1.5">
                        <SolarCheckCircleIcon size={14} className="text-emerald-600" /> Ulangan (ID: {linkedChatId || createdCenter.telegram_chat_id || 'Mavjud'})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3 bg-sky-50/80 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 rounded-xl text-[11px] text-sky-900 dark:text-sky-300 leading-snug">
                    <InfoCircleIcon size={18} className="text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                    <div>
                      <b>Login va parol ma'lumoti:</b> EduContest ma'muriyati arizangizni tasdiqlashi bilan markaz boshqaruv panelining <b>login va paroli</b> to'g'ridan-to'g'ri ulangan Telegram botingizga yuboriladi!
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    {planPrice > 0 && checkoutUrl && (
                      <button
                        type="button"
                        onClick={handleInPayCheckout}
                        disabled={inPayLoading}
                        className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-emerald-600/20"
                      >
                        {inPayLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                          <>
                            <CardIcon size={20} className="text-white" />
                            <span>InPay orqali to'lash ({planPrice.toLocaleString()} so'm)</span>
                          </>
                        )}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => navigate(`/c/${createdCenter.username}`)}
                      className={`w-full h-11 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs ${
                        planPrice === 0 ? "bg-purple-600 hover:bg-purple-700 shadow-purple-600/20" : "bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900"
                      }`}
                    >
                      <span>Markaz portaliga o'tish</span>
                      <AltArrowRightIcon size={18} className="text-white" />
                    </button>
                  </div>
                </div>
              )}

              <div className="text-center pt-2">
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
            <img src="/loginimg.png" className="w-full h-full object-cover object-center transition-transform duration-700 hover:scale-[1.02]" alt="EduContest" />
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;
