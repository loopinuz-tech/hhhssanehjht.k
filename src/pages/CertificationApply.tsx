import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { CheckCircle2, ArrowRight, ArrowLeft, ShieldCheck, FileText, User, GraduationCap } from "lucide-react";

const CertificationApply = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    type: "majburiy",
    targetQualification: "",
    pinfl: profile?.pinfl || "",
    schoolName: profile?.school_name || "",
  });

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("certification_applications" as any).insert({
        user_id: user.id,
        type: formData.type,
        current_qualification: profile?.qualification_category,
        target_qualification: formData.targetQualification,
        status: "yuborilgan",
      } as any);

      if (error) throw error;

      // Update profile with PINFL and School if not present
      await supabase.from("profiles").update({
        pinfl: formData.pinfl,
        school_name: formData.schoolName,
      } as any).eq("user_id", user.id);

      toast({ title: "Muvaffaqiyatli!", description: "So'rovnomangiz qabul qilindi." });
      navigate("/certification");
    } catch (err: any) {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-20 animate-fade-in">
      {/* Progress Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Attestatsiya So'rovnomasi</h1>
          <span className="text-sm font-bold text-slate-400">Bosqich {step} / 3</span>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className={`h-2 flex-1 rounded-full transition-all duration-500 ${step >= i ? "bg-blue-500" : "bg-slate-200 dark:bg-slate-800"}`} />
          ))}
        </div>
      </div>

      {step === 1 && (
        <Card className="p-8 space-y-8 border-slate-100 dark:border-slate-800 shadow-xl rounded-[32px] animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-4">
               <User className="w-6 h-6 text-blue-500" />
            </div>
            <h2 className="text-xl font-bold">Shaxsiy ma'lumotlar</h2>
            <p className="text-sm text-slate-500">Nizomning 2-bobiga muvofiq kerakli ma'lumotlarni tasdiqlang.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">F.I.O.</Label>
              <Input value={profile?.full_name || ""} disabled className="h-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">JSHSHIR (PINFL)</Label>
              <Input 
                placeholder="14 ta raqam" 
                value={formData.pinfl} 
                onChange={e => setFormData({...formData, pinfl: e.target.value})}
                className="h-12 rounded-xl focus:ring-blue-500" 
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Ish joyi (Ta'lim muassasasi nomi)</Label>
              <Input 
                placeholder="Masalan: 12-umumiy o'rta ta'lim maktabi" 
                value={formData.schoolName} 
                onChange={e => setFormData({...formData, schoolName: e.target.value})}
                className="h-12 rounded-xl focus:ring-blue-500" 
              />
            </div>
          </div>

          <Button onClick={nextStep} className="w-full h-14 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-lg hover:scale-[1.02] active:scale-95 transition-all">
            Keyingi bosqich
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </Card>
      )}

      {step === 2 && (
        <Card className="p-8 space-y-8 border-slate-100 dark:border-slate-800 shadow-xl rounded-[32px] animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mb-4">
               <GraduationCap className="w-6 h-6 text-indigo-500" />
            </div>
            <h2 className="text-xl font-bold">Toifa va Yo'nalish</h2>
            <p className="text-sm text-slate-500">Attestatsiya turini va maqsadli toifangizni belgilang.</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Attestatsiya turi</Label>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: "majburiy", label: "Majburiy", desc: "Har 5 yilda bir marta" },
                  { id: "navbatdan_tashqari", label: "Ixtiyoriy", desc: "O'z xohishi bilan" }
                ].map(t => (
                  <button 
                    key={t.id}
                    onClick={() => setFormData({...formData, type: t.id})}
                    className={`p-4 rounded-2xl border text-left transition-all ${formData.type === t.id ? "border-blue-500 bg-blue-50 dark:bg-blue-900/10 ring-1 ring-blue-500" : "border-slate-100 dark:border-slate-800 hover:border-slate-200"}`}
                  >
                    <p className={`font-bold ${formData.type === t.id ? "text-blue-600 dark:text-blue-400" : "text-slate-900 dark:text-white"}`}>{t.label}</p>
                    <p className="text-[10px] text-slate-500 font-medium">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Maqsadli malaka toifasi</Label>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: "ikkinchi_toifa", label: "2-toifa" },
                  { id: "birinchi_toifa", label: "1-toifa" },
                  { id: "oliy_toifa", label: "Oliy toifa" }
                ].map(c => (
                  <button 
                    key={c.id}
                    onClick={() => setFormData({...formData, targetQualification: c.id})}
                    className={`p-4 rounded-2xl border text-left transition-all ${formData.targetQualification === c.id ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10 ring-1 ring-indigo-500" : "border-slate-100 dark:border-slate-800 hover:border-slate-200"}`}
                  >
                    <p className={`font-bold ${formData.targetQualification === c.id ? "text-indigo-600 dark:text-indigo-400" : "text-slate-900 dark:text-white"}`}>{c.label}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button variant="outline" onClick={prevStep} className="flex-1 h-14 rounded-2xl font-bold">
              <ArrowLeft className="mr-2 w-5 h-5" />
              Orqaga
            </Button>
            <Button onClick={nextStep} disabled={!formData.targetQualification} className="flex-[2] h-14 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-lg">
              Keyingi bosqich
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card className="p-8 space-y-8 border-slate-100 dark:border-slate-800 shadow-xl rounded-[32px] animate-in fade-in slide-in-from-right-4 duration-500 text-center">
          <div className="space-y-4">
            <div className="w-20 h-20 rounded-[32px] bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto mb-6">
               <ShieldCheck className="w-10 h-10 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Tasdiqlash va Yuborish</h2>
            <p className="text-slate-500 max-w-sm mx-auto font-medium">
              Barcha ma'lumotlar to'g'riligini tekshiring. Yuborilgandan so'ng ma'lumotlarni o'zgartirib bo'lmaydi.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[28px] p-6 text-left space-y-4 border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <span className="text-xs font-bold text-slate-400 uppercase">Toifa</span>
              <span className="text-sm font-black capitalize">{formData.targetQualification.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <span className="text-xs font-bold text-slate-400 uppercase">Tur</span>
              <span className="text-sm font-black capitalize">{formData.type.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">JSHSHIR</span>
              <span className="text-sm font-black">{formData.pinfl}</span>
            </div>
          </div>

          <div className="flex gap-4">
            <Button variant="outline" onClick={prevStep} className="flex-1 h-14 rounded-2xl font-bold">
              Orqaga
            </Button>
            <Button onClick={handleSubmit} disabled={loading} className="flex-[2] h-14 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-lg shadow-lg shadow-blue-500/20">
              {loading ? "Yuborilmoqda..." : "Tasdiqlayman va Yuboraman"}
              <CheckCircle2 className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default CertificationApply;
