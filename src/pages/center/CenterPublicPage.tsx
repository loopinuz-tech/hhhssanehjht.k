import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Lock, User, Loader2, AlertCircle, Building2, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import SEO from "@/components/SEO";

interface CenterData {
  id: string;
  name: string;
  username: string;
  logo_url?: string;
  description?: string;
  subjects?: string[];
  branding?: {
    primary_color?: string;
    accent_color?: string;
  };
  status: string;
}

const CenterPublicPage = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [center, setCenter] = useState<CenterData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isSuspended, setIsSuspended] = useState(false);

  // Login form state
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!username) return;

    const fetchCenter = async () => {
      setLoading(true);
      setNotFound(false);
      setIsSuspended(false);
      try {
        const res = await fetch(`/api/public/centers/${encodeURIComponent(username.toLowerCase())}`);
        const data = await res.json();

        if (res.status === 404 || !data.center) {
          setNotFound(true);
          return;
        }

        if (res.status === 403 || data.center?.status === "SUSPENDED") {
          setIsSuspended(true);
          setCenter(data.center);
          return;
        }

        setCenter(data.center);
      } catch (err) {
        console.error("Failed to load center:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchCenter();
  }, [username]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!login.trim() || !password) {
      toast({ title: "Xatolik", description: "Login va parolni kiriting", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/public/centers/${encodeURIComponent(username || '')}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          login: login.trim(),
          password
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login yoki parol noto'g'ri");
      }

      toast({ title: "Muvaffaqiyatli!", description: `Xush kelibsiz, ${center?.name} portaliga kirdingiz!` });
      await refreshProfile();

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else if (data.role === "CENTER_OWNER" || data.role === "CENTER_STAFF") {
        window.location.href = "/center";
      } else {
        window.location.href = "/myclass";
      }
    } catch (err: any) {
      toast({ title: "Kirishda xatolik", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const primaryColor = center?.branding?.primary_color || "#E8192C";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          <p className="text-sm font-medium text-slate-500">O'quv markazi yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-center">
        <SEO title="Markaz topilmadi" />
        <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/30 text-rose-500 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">404 — O'quv markazi topilmadi</h1>
        <p className="text-sm text-slate-500 max-w-md mt-2">
          "<b>{username}</b>" nomli o'quv markazi mavjud emas yoki manzili noto'g'ri kiritilgan.
        </p>
        <Link
          to="/"
          className="mt-6 px-6 py-2.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl font-semibold text-sm hover:opacity-90 transition-all"
        >
          Bosh sahifaga qaytish
        </Link>
      </div>
    );
  }

  if (isSuspended) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-center">
        <SEO title="Kirish to'xtatilgan" />
        <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/30 text-amber-500 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{center?.name || "O'quv markazi"}</h1>
        <p className="text-base text-amber-700 dark:text-amber-400 max-w-lg mt-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-2xl font-medium">
          Bu o'quv markazining EduContest hisobiga kirish vaqtincha to'xtatilgan.
        </p>
        <p className="text-xs text-slate-400 mt-4">
          Qo'shimcha ma'lumot olish uchun o'quv markazingiz ma'muriyatiga murojaat qiling.
        </p>
        <Link
          to="/"
          className="mt-6 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline font-medium"
        >
          EduContest bosh sahifasi
        </Link>
      </div>
    );
  }

  return (
    <>
      <SEO title={`${center?.name || 'O\'quv markazi'} — Kirish`} description={`${center?.name} o'quv markazining EduContest portali.`} />
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
        {/* TOP BRANDING BAR */}
        <div className="max-w-md w-full mx-auto flex items-center justify-between pt-4">
          <Link to="/" className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <img src="/logo.png" className="w-5 h-5 object-contain" alt="EduContest" />
            <span>EduContest</span>
          </Link>
          <span className="text-[11px] font-medium text-slate-400 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-800">
            Markaziy Portal
          </span>
        </div>

        {/* CENTER LOGIN CARD */}
        <div className="max-w-md w-full mx-auto my-8">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-6">
            {/* Center Logo & Name */}
            <div className="text-center space-y-3">
              <div className="w-18 h-18 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shadow-inner">
                {center?.logo_url ? (
                  <img src={center.logo_url} alt={center.name} className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-9 h-9 text-slate-500" />
                )}
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {center?.name}
                </h1>
                {center?.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-2 mt-1 px-4">
                    {center.description}
                  </p>
                )}
              </div>

              {center?.subjects && center.subjects.length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                  {center.subjects.slice(0, 4).map((sub, i) => (
                    <span key={i} className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-0.5 rounded-full">
                      {sub}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800" />

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">
                  Login / Telefon / Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    placeholder="Login yoki telefon raqamingiz"
                    className="w-full h-12 pl-10 pr-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:border-[#E8192C] transition-all text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Parol
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-12 pl-10 pr-10 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:border-[#E8192C] transition-all text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{ backgroundColor: primaryColor }}
                className="w-full h-12 hover:opacity-90 active:scale-[0.98] text-white rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-red-500/20"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>Kirish</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="text-center pt-2">
              <p className="text-xs text-slate-400 font-medium">
                Hisobingiz ma'lumotlarini o'quv markazingizdan oling.
              </p>
            </div>
          </div>
        </div>

        {/* BOTTOM ATTRIBUTION */}
        <div className="text-center pb-4">
          <div className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <span>Powered by</span>
            <Link to="/" className="font-bold text-slate-700 dark:text-slate-300 hover:text-[#E8192C] transition-colors">
              EduContest.uz
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default CenterPublicPage;
