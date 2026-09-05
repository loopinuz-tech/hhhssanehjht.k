import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, Camera, Calendar, FileText, Check, Shield, AlertTriangle, Award, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import TeacherPortfolioSection from "@/components/profile/TeacherPortfolioSection";
import { Link } from "react-router-dom";
import { getStoragePublicUrl } from "@/lib/storage";

const ProfilePage = () => {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  // States for the form
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [pinfl, setPinfl] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [subject, setSubject] = useState("");
  const [qualificationCategory, setQualificationCategory] = useState("");

  // Sync state with profile data
  useEffect(() => {
    if (profile) {
      const names = profile.full_name?.split(" ") || [];
      setFirstName(names[0] || "");
      setLastName(names[1] || "");
      setMiddleName((profile as any).middle_name || "");
      setBirthDate((profile as any).birth_date || "");
      setPinfl((profile as any).pinfl || "");
      setAvatarUrl(profile.avatar_url || "");
      setSubject((profile as any).subject || "");
      setQualificationCategory((profile as any).qualification_category || "");
    }
  }, [profile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      // Important: Use user_id as folder name to match RLS policy
      const filePath = `${user.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const publicUrl = getStoragePublicUrl('avatars', filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      toast({ title: "Rasm yangilandi!", description: "Profil rasmingiz muvaffaqiyatli saqlandi." });
    } catch (error: any) {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const combinedName = `${firstName} ${lastName}`.trim();
      const updateData = {
        full_name: combinedName,
        middle_name: middleName,
        birth_date: birthDate || null,
        pinfl: pinfl,
        subject: subject,
        qualification_category: qualificationCategory
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData as any)
        .eq('user_id', user.id);

      if (error) throw error;
      toast({ title: "Ma'lumotlar saqlandi!", description: "Profil ma'lumotlaringiz yangilandi." });
    } catch (error: any) {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-8 pb-20 animate-fade-in pr-4 md:px-6">
      {/* Clean & Minimal Hero */}
      <div className="relative pt-8 pb-4 text-center space-y-6">
         <div className="flex items-center justify-center gap-3 flex-wrap">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">
               <User className="w-3.5 h-3.5" />
               <span>SHAXSIY PROFIL</span>
            </div>
            <Link 
               to="/settings" 
               className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
               <Settings className="w-3.5 h-3.5" />
               <span>Hisob sozlamalari</span>
            </Link>
         </div>
         
         <div className="space-y-3 max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white pb-1">
               Shaxsiy <span className="text-emerald-600 dark:text-emerald-500">ma'lumotlar</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base font-medium max-w-xl mx-auto">
               Ma'lumotlaringizni tahrirlang va profilingizni boshqaring.
            </p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Avatar Section */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-8 flex flex-col items-center text-center shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Profil rasmi</h2>
          <p className="text-[11px] text-slate-400 mb-8 uppercase font-bold tracking-wider">Maksimal hajmi 5 MB</p>

          <div className="relative mb-8">
            <div className="w-44 h-44 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center p-8">
                  <img src="/logo.png" alt="Default Avatar" className="w-full h-full object-contain opacity-40 grayscale" />
                </div>
              )}
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-2 right-2 w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center border-4 border-white dark:border-slate-900 shadow-lg hover:scale-110 transition-transform"
            >
              <Camera className="w-5 h-5" />
            </button>
          </div>

          <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/*" />

          <button 
            disabled={loading}
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-[#0F172A] text-white rounded-2xl py-4 text-[11px] font-black uppercase tracking-widest transition-all disabled:opacity-50 shadow-lg"
          >
            {loading ? "Yuklanmoqda..." : "Rasm yuklash"}
          </button>
        </div>

        {/* Right: Info Section */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
               <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center">
                 <User className="w-5 h-5 text-primary" />
               </div>
               <div>
                 <h2 className="text-lg font-bold text-slate-900 dark:text-white">Shaxsiy ma'lumotlar</h2>
                 <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Profilingizni to'ldiring</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Ism</label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Ismingizni kiriting" className="rounded-2xl h-14 bg-slate-50 dark:bg-slate-800 border-none px-6 text-sm font-medium" />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Familiya</label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Familiyangizni kiriting" className="rounded-2xl h-14 bg-slate-50 dark:bg-slate-800 border-none px-6 text-sm font-medium" />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Otasini ismi</label>
                <Input value={middleName} onChange={(e) => setMiddleName(e.target.value)} placeholder="Otasining ismini kiriting" className="rounded-2xl h-14 bg-slate-50 dark:bg-slate-800 border-none px-6 text-sm font-medium" />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Tug'ilgan sana</label>
                <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="rounded-2xl h-14 bg-slate-50 dark:bg-slate-800 border-none px-6 text-sm font-medium" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Input value={pinfl} onChange={(e) => setPinfl(e.target.value)} placeholder="JSHSHIR (14 ta raqam)" maxLength={14} className="rounded-2xl h-14 bg-slate-50 dark:bg-slate-800 border-none px-6 text-sm font-medium" />
              </div>

              {profile?.role === 'teacher' && (
                <>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Mutaxassislik fani</label>
                    <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Masalan: Matematika" className="rounded-2xl h-14 bg-slate-50 dark:bg-slate-800 border-none px-6 text-sm font-medium" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Malaka toifasi</label>
                    <select 
                      value={qualificationCategory} 
                      onChange={(e) => setQualificationCategory(e.target.value)}
                      className="w-full rounded-2xl h-14 bg-slate-50 dark:bg-slate-800 border-none px-6 text-sm font-medium outline-none appearance-none"
                    >
                      <option value="">Tanlang...</option>
                      <option value="mutaxassis">Mutaxassis</option>
                      <option value="ikkinchi_toifa">2-toifa</option>
                      <option value="birinchi_toifa">1-toifa</option>
                      <option value="oliy_toifa">Oliy toifa</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="mt-10 flex justify-end">
              <button disabled={loading} onClick={handleSaveProfile} className="bg-primary text-white rounded-2xl py-4 px-12 text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 transition-all hover:opacity-90 active:scale-[0.98]">
                {loading ? "SAQLANMOQDA..." : "Ma'lumotlarni saqlash"}
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Xavfsizlik (2FA)</h2>
              </div>
            </div>

            <div className="mb-8 p-5 rounded-3xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 flex gap-4">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-1" />
              <div className="text-[11px] text-amber-800 dark:text-amber-400 space-y-1">
                <p className="font-black uppercase tracking-wider">Xavfsizlik darajasini oshiring</p>
                <p className="leading-relaxed font-medium">Parol o'rnatganingizdan so'ng, tizimga kirishda ham parol, ham Telegram bot kodi talab qilinadi.</p>
              </div>
            </div>

            <PasswordSetup />
          </div>

          {profile?.role === 'teacher' && <TeacherPortfolioSection />}
        </div>
      </div>
    </div>
  );
};

const PasswordSetup = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

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
      const { error: authError } = await supabase.auth.updateUser({ password });
      if (authError) throw authError;

      const { error: profError } = await supabase
        .from("profiles")
        .update({ has_password: true } as any)
        .eq("user_id", user?.id);
      
      if (profError) throw profError;

      toast({ title: "Muvaffaqiyatli", description: "Parol yangilandi." });
      setPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleUpdatePassword} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Yangi parol</label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Kamida 6 belgi" className="rounded-2xl h-14 bg-slate-50 dark:bg-slate-800 border-none px-6 text-sm" required />
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Tasdiqlash</label>
          <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Qayta kiriting" className="rounded-2xl h-14 bg-slate-50 dark:bg-slate-800 border-none px-6 text-sm" required />
        </div>
      </div>
      <div className="flex items-center justify-between pt-2">
        {profile?.has_password ? (
          <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">
            <Check className="w-4 h-4" /> Parol o'rnatilgan
          </div>
        ) : <div />}
        <button type="submit" disabled={loading || !password} className="bg-primary text-white rounded-2xl py-4 px-10 text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-40">
          {loading ? "SAQLANMOQDA..." : "PAROLNI SAQLASH"}
        </button>
      </div>
    </form>
  );
};

export default ProfilePage;
