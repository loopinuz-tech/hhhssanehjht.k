import { useState, useMemo } from "react";
import { Lock, Phone, User, Shield, CheckCircle2, AlertTriangle, Mail, Link2, Unlink2, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const GoogleIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const Profile = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Check if Google identity is linked
  const googleIdentity = useMemo(() => {
    if (!user) return null;
    return user.identities?.find((id: any) => id.provider === 'google') || null;
  }, [user]);

  const googleEmail = googleIdentity?.identity_data?.email || null;
  const isGoogleLinked = !!googleIdentity;

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Xatolik", description: "Parollar mos kelmadi", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Xatolik", description: "Parol kamida 6 belgidan iborat bo'lishi kerak", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Update Auth password
      const { error: authError } = await supabase.auth.updateUser({ password });
      if (authError) throw authError;

      // Update Profile has_password field
      const { error: profError } = await supabase
        .from("profiles")
        .update({ has_password: true } as any)
        .eq("user_id", user?.id);
      
      if (profError) throw profError;

      toast({ title: "Muvaffaqiyatli", description: "Parol yangilandi. Endi tizmga kirishda ushbu paroldan foydalanasiz." });
      setPassword("");
      setConfirmPassword("");
      qc.invalidateQueries({ queryKey: ["profile"] });
    } catch (err: any) {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleLinkGoogle = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.linkIdentity({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/profile`
        }
      });
      if (error) throw error;
    } catch (err: any) {
      console.error("Google link error:", err);
      toast({ title: "Xatolik", description: err.message || "Google akkauntni bog'lashda xatolik", variant: "destructive" });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleUnlinkGoogle = async () => {
    if (!googleIdentity) return;
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.unlinkIdentity(googleIdentity);
      if (error) throw error;
      toast({ title: "Muvaffaqiyatli", description: "Google akkaunt uzildi" });
      // Refresh the session to update identities
      const { data } = await supabase.auth.refreshSession();
      if (data?.session) {
        // The auth state change listener will update the user
      }
    } catch (err: any) {
      console.error("Google unlink error:", err);
      toast({ title: "Xatolik", description: err.message || "Google akkauntni uzishda xatolik", variant: "destructive" });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 animate-fade-in pr-4 md:pr-10">
      {/* Clean & Minimal Hero */}
      <div className="relative pt-8 pb-4 text-center space-y-6">
         <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">
            <User className="w-3.5 h-3.5" />
            <span>SHAXSIY PROFIL</span>
         </div>
         
         <div className="space-y-3 max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white pb-1">
               Shaxsiy <span className="text-emerald-600 dark:text-emerald-500">ma'lumotlar</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base font-medium max-w-xl mx-auto">
               Profilingizni sozlang, xavfsizlikni boshqaring va ijtimoiy tarmoqlarni bog'lang.
            </p>
         </div>
      </div>

      <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-3xl p-8 shadow-sm">

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase mb-1">
                <User className="w-3 h-3" /> F.I.SH
              </div>
              <p className="text-sm font-semibold text-foreground">{profile?.full_name}</p>
            </div>
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase mb-1">
                <Phone className="w-3 h-3" /> Telefon
              </div>
              <p className="text-sm font-semibold text-foreground">{profile?.phone}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Google Account Linking Section */}
      <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-3xl p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Mail className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Google akkaunt</h2>
            <p className="text-xs text-muted-foreground">Gmail akkauntingizni bog'lang</p>
          </div>
        </div>

        {isGoogleLinked ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center flex-shrink-0">
                <GoogleIcon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Bog'langan</span>
                </div>
                <p className="text-sm font-semibold text-foreground mt-0.5 truncate">{googleEmail}</p>
              </div>
            </div>

            <button
              onClick={handleUnlinkGoogle}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-2 h-11 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs font-black uppercase tracking-wider rounded-2xl border border-red-100 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-950/40 transition-all disabled:opacity-50"
            >
              {googleLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Unlink2 className="w-4 h-4" />
              )}
              Google akkauntni uzish
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 flex gap-3 items-start">
              <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                <p className="font-bold">Nima uchun kerak?</p>
                <p className="leading-relaxed opacity-80 text-xs">
                  Google akkauntingizni bog'lasangiz, keyingi safar tizimga Google orqali ham kirishingiz mumkin. Bu tez va qulay!
                </p>
              </div>
            </div>

            <button
              onClick={handleLinkGoogle}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-2 h-12 bg-white dark:bg-slate-800 text-foreground text-sm font-bold rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-primary hover:bg-primary/5 transition-all shadow-sm disabled:opacity-50"
            >
              {googleLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <GoogleIcon className="w-5 h-5" />
                  <Link2 className="w-4 h-4 text-muted-foreground" />
                </>
              )}
              Google akkauntni bog'lash
            </button>
          </div>
        )}
      </div>

      {/* Password Section */}
      <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-3xl p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-amber-500" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Xavfsizlik (2FA)</h2>
        </div>

        <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 flex gap-4">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800 dark:text-amber-400 space-y-1">
            <p className="font-bold">Xavfsizlik darajasini oshiring</p>
            <p className="leading-relaxed opacity-80 text-xs">
              Login va Parol o'rnatganingizdan so'ng, tizimga kirishda ham parol, ham Telegram bot kodi talab qilinadi.
            </p>
          </div>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Yangi parol</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                placeholder="Kamida 6 belgi"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 pl-11 pr-4 bg-muted/30 border border-border dark:border-slate-800 rounded-2xl text-sm focus:border-primary focus:outline-none transition-all font-medium"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Parolni tasdiqlash</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                placeholder="Parolni qayta kiriting"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-12 pl-11 pr-4 bg-muted/30 border border-border dark:border-slate-800 rounded-2xl text-sm focus:border-primary focus:outline-none transition-all font-medium"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full h-12 bg-primary text-primary-foreground text-sm font-black rounded-2xl shadow-lg shadow-primary/10 transition-all active:scale-[0.98] disabled:opacity-40"
          >
            {loading ? "SAQLANMOQDA..." : "PAROLNI SAQLASH"}
          </button>
        </form>

        {profile?.has_password && (
          <div className="mt-6 flex items-center justify-center gap-2 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 py-3 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Parol o'rnatilgan</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
