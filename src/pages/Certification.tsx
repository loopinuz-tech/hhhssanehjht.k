import { GraduationCap, Award, ClipboardCheck, History, ArrowRight, Star, BookOpen, UserCheck, ShieldCheck, FileText, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

const Certification = () => {
  const { profile, user } = useAuth();

  // Fetch certification application
  const { data: application } = useQuery({
    queryKey: ["certification-application", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("certification_applications" as any)
        .select("*")
        .eq("user_id", user?.id)
        .order("applied_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as any;
    },
    enabled: !!user,
  });

  // Fetch portfolio stats (mocking points for now until we have real data integration)
  const portfolioStats = [
    { label: "Ochiq darslar", points: 3, max: 3, icon: BookOpen, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "O'quvchilar yutug'i", points: 2, max: 3, icon: Star, color: "text-amber-500", bg: "bg-amber-50" },
    { label: "Ilmiy maqolalar", points: 1, max: 3, icon: FileText, color: "text-purple-500", bg: "bg-purple-50" },
    { label: "AKT foydalanish", points: 3, max: 3, icon: ShieldCheck, color: "text-emerald-500", bg: "bg-emerald-50" },
    { label: "Tanlovlar", points: 2, max: 3, icon: Award, color: "text-rose-500", bg: "bg-rose-50" },
  ];

  const totalPedagogicalScore = portfolioStats.reduce((acc, curr) => acc + curr.points, 0);

  return (
    <div className="w-full space-y-10 pb-10 pr-4 md:pr-10 animate-fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0F172A] to-[#1E293B] rounded-[40px] p-10 md:p-14 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full -mr-48 -mt-48 blur-[120px]" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest">
              <ShieldCheck className="w-4 h-4" />
              Rasmiy Attestatsiya Moduli
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[0.9]">
              Malaka toifangizni <br />
              <span className="text-blue-400">tasdiqlang va oshiring</span>
            </h1>
            <p className="text-slate-400 text-lg max-w-lg font-medium leading-relaxed">
              Lex.uz 572-sonli qaror asosida yaratilgan platformada attestatsiyadan o'ting va joriy toifangizni yangilang.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Button asChild size="lg" className="h-14 px-8 rounded-full bg-blue-500 hover:bg-blue-600 text-white font-bold transition-all hover:scale-105 active:scale-95">
                <Link to="/certification/apply">
                  So'rovnoma topshirish
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="h-14 px-8 rounded-full bg-white/5 border-white/10 text-white hover:bg-white/10 font-bold backdrop-blur-md">
                Nizomni o'rganish
              </Button>
            </div>
          </div>
          <div className="relative w-full md:w-1/3 flex justify-center">
            <div className="w-64 h-64 md:w-80 md:h-80 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-[60px] rotate-6 flex items-center justify-center shadow-2xl group transition-transform hover:rotate-0 duration-500">
               <GraduationCap className="w-32 h-32 md:w-40 md:h-40 text-white animate-pulse" />
            </div>
            {/* Floatings */}
            <div className="absolute -top-4 -left-4 w-20 h-20 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 flex items-center justify-center animate-bounce-slow">
              <Award className="w-10 h-10 text-amber-400" />
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 flex items-center justify-center animate-bounce-slow delay-700">
              <ClipboardCheck className="w-12 h-12 text-emerald-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Current Status Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-8 shadow-sm">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6">Joriy Holat</p>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <UserCheck className="w-8 h-8 text-blue-500" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white capitalize">
                  {profile?.qualification_category?.replace('_', ' ') || "Mutaxassis"}
                </h3>
                <p className="text-sm text-slate-500 font-medium">{profile?.subject || "Fan biriktirilmagan"}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <History className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Oxirgi attestatsiya</span>
                </div>
                <span className="text-sm font-black text-slate-900 dark:text-white">Noma'lum</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <GraduationCap className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Keyingi muddat</span>
                </div>
                <span className="text-sm font-black text-blue-500">2026-yil</span>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 rounded-[32px] p-8">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <h4 className="text-sm font-black text-amber-900 dark:text-amber-400 uppercase tracking-widest">Eslatma</h4>
            </div>
            <p className="text-sm text-amber-800 dark:text-amber-500 leading-relaxed font-medium">
              Majburiy attestatsiya har 5 yilda bir marta o'tkaziladi. Navbatdan tashqari attestatsiya uchun ariza berish ixtiyoriy.
            </p>
          </div>
        </div>

        {/* Portfolio Progress Card */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
            <div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Pedagogik Mahorat (Portfolio)</p>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white">
                {totalPedagogicalScore} <span className="text-slate-400">/ 15 ball</span>
              </h2>
            </div>
            <Button asChild variant="outline" className="rounded-full px-6 font-bold">
              <Link to="/certification/portfolio">
                Portfolio boshqaruvi
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {portfolioStats.map((stat) => (
              <div key={stat.label} className="p-5 rounded-3xl border border-slate-50 dark:border-slate-800/50 hover:border-blue-100 dark:hover:border-blue-900/50 transition-colors group">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center transition-transform group-hover:scale-110`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    {stat.points} / {stat.max} ball
                  </span>
                </div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-3">{stat.label}</h4>
                <Progress value={(stat.points / stat.max) * 100} className="h-1.5" />
              </div>
            ))}
          </div>

          <div className="mt-10 p-6 rounded-[24px] bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-black">
                 {Math.round((totalPedagogicalScore / 15) * 100)}%
               </div>
               <div>
                 <p className="text-sm font-bold text-slate-900 dark:text-white">Tayyorgarlik darajasi</p>
                 <p className="text-xs text-slate-500 font-medium">Portfolioning umumiy to'ldirilganlik ko'rsatkichi</p>
               </div>
            </div>
            <ArrowRight className="w-5 h-5 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Certification Stages */}
      <div className="space-y-6">
         <h2 className="text-2xl font-black text-slate-900 dark:text-white px-4">Attestatsiya Bosqichlari</h2>
         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           {[
             { step: "1", title: "Hujjat topshirish", desc: "So'rovnoma va majburiy hujjatlarni yuklash", active: !application },
             { step: "2", title: "Saralash", desc: "Portfolio ballarini tasdiqlash (15 ball)", active: (application as any)?.status === 'tekshirilmoqda' },
             { step: "3", title: "Test Sinovi", desc: "Mutaxassislik bo'yicha test (80 ball)", active: (application as any)?.status === 'tasdiqlangan' },
             { step: "4", title: "Natija", desc: "Sertifikat generatsiyasi va yakuniy qaror", active: (application as any)?.status === 'yakunlangan' },
           ].map((item, idx) => (
             <div key={idx} className={`p-6 rounded-[32px] border transition-all ${item.active ? "bg-white dark:bg-slate-900 border-blue-200 dark:border-blue-900 shadow-xl shadow-blue-500/5 ring-1 ring-blue-500/20" : "bg-slate-50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800 opacity-60"}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black mb-4 ${item.active ? "bg-blue-500 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-500"}`}>
                  {item.step}
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-2">{item.title}</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">{item.desc}</p>
             </div>
           ))}
         </div>
      </div>
    </div>
  );
};

export default Certification;
