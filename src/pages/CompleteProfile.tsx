import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, User, GraduationCap, UserCheck, CheckCircle2, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { supabase as studentSupabase } from "@/integrations/studentSupabase";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import Logo from "@/components/layout/Logo";

const CompleteProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile } = useAuth();

  const [fullName, setFullName] = useState(profile?.full_name || user?.user_metadata?.full_name || "");
  const [phone, setPhone] = useState("+998");
  const [role, setRole] = useState<"teacher" | "student">("student");
  const [qualificationCategory, setQualificationCategory] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const cleanPhone = phone.replace(/\s/g, "");
    if (cleanPhone.length < 13) {
      toast({ title: "Xatolik", description: "Telefon raqamini to'liq kiriting (+998...)", variant: "destructive" });
      return;
    }
    if (!fullName.trim()) {
      toast({ title: "Xatolik", description: "Ism-familiyangizni kiriting", variant: "destructive" });
      return;
    }
    if (role === "teacher" && !qualificationCategory) {
      toast({ title: "Xatolik", description: "Malaka toifangizni tanlang", variant: "destructive" });
      return;
    }

    const categoryMap: Record<string, string> = {
      "OLIY": "oliy_toifa",
      "1-TOIFA": "birinchi_toifa",
      "2-TOIFA": "ikkinchi_toifa",
      "Mutaxassis": "mutaxassis"
    };

    setLoading(true);
    try {
      // Update profile in database
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          phone: cleanPhone,
          role,
          qualification_category: role === "teacher" ? categoryMap[qualificationCategory] : null,
          subject: role === "teacher" ? subject : null,
        } as any)
        .eq("user_id", user.id);

      if (error) throw error;

      // SYNC TO STUDENT DATABASE IF ROLE IS STUDENT
      if (role === "student") {
        try {
          // Attempt to update profile in student database
          // Note: This relies on the user existing in studentSupabase (signed up via Login.tsx)
          // or having an open registration policy.
          await studentSupabase
            .from("profiles")
            .upsert({
              user_id: user.id,
              full_name: fullName.trim(),
              phone: cleanPhone,
            } as any);
        } catch (syncErr) {
          console.error("Student profile sync error:", syncErr);
          // Non-blocking
        }
      }

      // Also update user metadata
      await supabase.auth.updateUser({
        data: { full_name: fullName.trim(), phone: cleanPhone }
      });

      toast({ title: "Muvaffaqiyatli!", description: "Profilingiz to'ldirildi. Xush kelibsiz!" });
      
      // Force page reload to refresh profile data
      window.location.href = "/dashboard";
    } catch (err: any) {
      console.error("Profile update error:", err);
      toast({ title: "Xatolik", description: err.message || "Profilni yangilashda xatolik", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4 md:p-6 font-sans">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#E5E7EB]">
        <div className="p-8 md:p-10 space-y-6">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
              <UserCheck className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Profilni to'ldiring
            </h1>
            <p className="text-sm text-slate-500">
              Platformadan foydalanish uchun quyidagi ma'lumotlarni kiriting
            </p>
          </div>

          {/* Google account info */}
          {user?.email && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100">
              <div className="w-8 h-8 rounded-lg bg-white border border-blue-200 flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" className="w-4 h-4">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Google akkaunt</p>
                <p className="text-sm font-semibold text-slate-700 truncate">{user.email}</p>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto flex-shrink-0" />
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 ml-1">Men...</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole("teacher")}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-[11px] font-black uppercase tracking-wider transition-all ${
                    role === "teacher"
                      ? "bg-primary border-primary text-white shadow-md shadow-primary/20"
                      : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
                  }`}
                >
                  <User className="w-4 h-4" />
                  O'qituvchi
                </button>
                <button
                  type="button"
                  onClick={() => setRole("student")}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-[11px] font-black uppercase tracking-wider transition-all ${
                    role === "student"
                      ? "bg-primary border-primary text-white shadow-md shadow-primary/20"
                      : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  O'quvchi
                </button>
              </div>
            </div>

            {/* Qualification Category selection (Visible only for teachers) */}
            {role === "teacher" && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="text-xs font-semibold text-slate-700 ml-1">Malaka toifangiz</label>
                <div className="grid grid-cols-2 gap-2">
                  {["OLIY", "1-TOIFA", "2-TOIFA", "Mutaxassis"].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setQualificationCategory(cat)}
                      className={`py-2.5 px-3 rounded-xl border text-[10px] font-bold uppercase transition-all ${
                        qualificationCategory === cat
                          ? "bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/20"
                          : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Subject selection (Visible only for teachers) */}
            {role === "teacher" && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="text-xs font-semibold text-slate-700 ml-1">Mutaxassislik faningiz</label>
                <div className="relative group">
                  <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                  <input
                    type="text"
                    placeholder="Masalan: Matematika, Ona tili..."
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 border border-[#E5E7EB] rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white text-slate-900"
                    required={role === "teacher"}
                  />
                </div>
              </div>
            )}

            {/* Full name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 ml-1">Ism-familiya</label>
              <div className="relative group">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="Ism va familiyangiz"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 border border-[#E5E7EB] rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white text-slate-900"
                  required
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 ml-1">Telefon raqami</label>
              <div className="relative group">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                <input
                  type="tel"
                  placeholder="+998"
                  value={phone}
                  onChange={(e) => {
                    let val = e.target.value;
                    if (!val.startsWith("+998")) val = "+998" + val.replace(/\D/g, "");
                    const numbers = val.replace(/\D/g, "").substring(0, 12);
                    let formatted = "+998";
                    if (numbers.length > 3) formatted += " " + numbers.substring(3, 5);
                    if (numbers.length > 5) formatted += " " + numbers.substring(5, 8);
                    if (numbers.length > 8) formatted += " " + numbers.substring(8, 10);
                    if (numbers.length > 10) formatted += " " + numbers.substring(10, 12);
                    setPhone(formatted);
                  }}
                  className="w-full h-11 pl-10 pr-4 border border-[#E5E7EB] rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white text-slate-900 placeholder:text-slate-400"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-primary hover:bg-primary/95 text-white text-sm font-bold rounded-xl transition-all active:scale-[0.98] shadow-md shadow-primary/20 disabled:opacity-50 mt-2"
            >
              {loading ? "Saqlanmoqda..." : "Davom etish"}
            </button>
          </form>

          <div className="pt-4 border-t border-[#F3F4F6] text-center">
            <p className="text-[10px] text-slate-400 leading-relaxed uppercase tracking-wider font-semibold">
              © 2026 EduContest Platform
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfile;
