import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  XCircle, Sparkles, Filter, ChevronRight, 
  Search, Lock, Crown, Calendar, BookOpen,
  AlertCircle, Play, Info, MessageSquareCode
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

/* РІвЂќР‚РІвЂќР‚ AI Advice Sidebar / Content РІвЂќР‚РІвЂќР‚ */
const EduFoxAdvice = ({ question, onClose }: { question: any; onClose: () => void }) => {
  const [advice, setAdvice] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchAdvice = async () => {
    setLoading(true);
    try {
      const prompt = `Savol: ${question.question_text}\nNoto'g'ri javoblar soni: ${question.wrong_attempts}\n\nFoydalanuvchi bu savolda ko'p xato qilyapti. EduFox (AI o'qituvchi) sifatida unga nega xato qilayotgani haqida maslahat bering va qayta xato qilmaslik uchun taktikani tushuntiring. Javobni qisqa, motivatsion va tushunarli qiling.`;
      
      const resp = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "mistral-tiny",
          messages: [
            { role: "system", content: "Siz EduFox o'qituvchi yordamchisisiz. Faqat o'zbek tilida, do'stona va professional tushuntirish berasiz." },
            { role: "user", content: prompt }
          ],
        })
      });
      const result = await resp.json();
      if (result.choices?.[0]) setAdvice(result.choices[0].message.content);
      else throw new Error("Unexpected API response");
    } catch (err) {
      console.error("Advice Fetch error:", err);
      setAdvice("Xatolik yuz berdi. Iltimos keyinroq urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  };

  useMemo(() => {
    if (question) fetchAdvice();
  }, [question?.id]);

  return (
    <motion.div 
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 sticky top-4 h-fit"
    >
      <div className="flex items-center gap-3">
         <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center border border-amber-100 dark:border-amber-800/50">
            <Sparkles className="w-5 h-5 text-amber-500" />
         </div>
         <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">EduFox Maslahati</h3>
            <p className="text-[9px] text-emerald-500 font-black uppercase tracking-widest">AI Tahlil</p>
         </div>
         <button onClick={onClose} className="ml-auto text-slate-400 hover:text-slate-600 transition-colors">X</button>
      </div>

      <div className="prose prose-sm dark:prose-invert max-w-none">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tahlil qilinmoqda...</p>
          </div>
        ) : (
          <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
            {advice || "Savolni tanlang..."}
          </ReactMarkdown>
        )}
      </div>

      <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/50 rounded-2xl flex items-start gap-3">
         <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
         <p className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium leading-relaxed">
            Eslab qoling: Xatolar РІР‚вЂќ bu o'sish uchun imkoniyatdir. Har bir noto'g'ri javob sizni muvaffaqiyatga bir qadam yaqinlashtiradi.
         </p>
      </div>
    </motion.div>
  );
};

const MyErrors = () => {
  const { user, profile } = useAuth();
  const { t } = useTranslation();
  const [filterType, setFilterType] = useState<"all" | "never" | "corrected_2nd">("all");
  const [selectedSubject, setSelectedSubject] = useState("Barcha fanlar");
  const [timeRange, setTimeRange] = useState("all"); // 7, 30, 90, all
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);

  const isPremium = !!(profile?.subscription_tier && profile.subscription_tier !== 'standart');

  // Fetch all user test answers to analyze patterns
  const { data: errorData, isLoading } = useQuery({
    queryKey: ["error-log-analytics", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("test_answers" as any)
        .select(`
          id, is_correct, created_at, session_id,
          questions (
            id, question_text, options, correct_option, difficulty, 
            test_folders (subject)
          )
        `)
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Analyze by question id
      const qMap = new Map();
      (data as any[])?.forEach(ans => {
        const qId = ans.questions.id;
        if (!qMap.has(qId)) {
          qMap.set(qId, {
            ...ans.questions,
            attempts: [],
            last_attempt: ans.created_at,
            subject: ans.questions.test_folders?.subject || "Noma'lum"
          });
        }
        qMap.get(qId).attempts.push(ans);
      });

      const processed = Array.from(qMap.values()).map(q => {
        const attempts = q.attempts.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        const wrongCount = attempts.filter((a: any) => !a.is_correct).length;
        const firstCorrectIdx = attempts.findIndex((a: any) => a.is_correct);
        
        let status = "never"; // default
        if (firstCorrectIdx !== -1) {
          if (firstCorrectIdx === 0) status = "correct_1st";
          else if (firstCorrectIdx === 1) status = "corrected_2nd";
          else status = "corrected_later";
        }

        return { ...q, wrong_attempts: wrongCount, status };
      });

      // We only want things that were wrong at least once
      return processed.filter(q => q.wrong_attempts > 0);
    },
    enabled: !!user
  });

  const subjects = useMemo(() => {
    if (!errorData) return ["Barcha fanlar"];
    const set = new Set<string>();
    errorData.forEach(q => set.add(q.subject));
    return ["Barcha fanlar", ...Array.from(set)];
  }, [errorData]);

  const filteredErrors = useMemo(() => {
    if (!errorData) return [];
    return errorData.filter(q => {
      // Type filter
      if (filterType === "never" && q.status !== "never") return false;
      if (filterType === "corrected_2nd" && q.status !== "corrected_2nd") return false;

      // Subject filter
      if (selectedSubject !== "Barcha fanlar" && q.subject !== selectedSubject) return false;

      // Time filter
      if (timeRange !== "all") {
         const days = parseInt(timeRange);
         const limit = new Date();
         limit.setDate(limit.getDate() - days);
         if (new Date(q.last_attempt) < limit) return false;
      }

      return true;
    });
  }, [errorData, filterType, selectedSubject, timeRange]);

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-10 h-10 border-4 border-slate-100 border-t-primary rounded-full animate-spin" />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Xatoliklar yuklanmoqda...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/20 rounded-2xl flex items-center justify-center border border-rose-100 dark:border-rose-900/30">
            <AlertCircle className="w-6 h-6 text-rose-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Error Log <span className="text-slate-400">({filteredErrors.length})</span>
            </h1>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Xatolar tahlili va tuzatish</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-6 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[1.2rem] font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-slate-200 dark:shadow-none">
          <Play className="w-4 h-4 fill-current" /> Practice All Mistakes ({filteredErrors.length})
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <select 
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as any)}
          className="h-10 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] font-black uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none min-w-[160px]"
        >
          <option value="all">Barchasi</option>
          <option value="never">Hech qachon tuzatilmagan</option>
          <option value="corrected_2nd">2-urinishda to'g'rilangan</option>
        </select>

        <select 
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="h-10 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] font-black uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-primary/20 min-w-[140px]"
        >
          {subjects.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select 
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="h-10 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] font-black uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-primary/20 min-w-[140px]"
        >
          <option value="all">Barcha vaqt</option>
          <option value="7">Oxirgi 7 kun</option>
          <option value="30">Oxirgi 30 kun</option>
          <option value="90">Oxirgi 90 kun</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Main Content (List) */}
        <div className={`space-y-6 ${selectedQuestion ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
          
          {/* AI Pattern Card (Premium) */}
          <div className="relative overflow-hidden p-8 rounded-[2.5rem] border border-rose-100 dark:border-rose-900/30 bg-rose-50/30 dark:bg-rose-950/10 mb-8">
             <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-sm">
                   <img src="/educoin.png" className="w-6 h-6" alt="EduFox" />
                </div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">EduFox found a pattern in your mistakes</h2>
             </div>
             
             <div className="relative">
                <p className={`text-sm text-slate-600 dark:text-slate-400 leading-relaxed ${!isPremium ? 'blur-md select-none' : ''}`}>
                   Siz asosan mantiqiy savollar va vaqtni boshqarishda qiynalayotganingiz ko'rinmoqda. Ayniqsa, o'zbek tili va tarix fanlari bo'yicha murakkab savollarda ko'proq xato qilgansiz. Biz sizga ushbu mavzular bo'yicha qo'shimcha materiallar va mantiqiy mashqlarni tavsiya qilamiz...
                </p>
                
                {!isPremium && (
                   <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                      <div className="bg-white/90 backdrop-blur-md px-6 py-8 rounded-[2rem] shadow-2xl border border-white flex flex-col items-center gap-4">
                         <div className="flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                            <Crown className="w-3 h-3" /> PRO
                         </div>
                         <h3 className="text-sm font-black text-slate-900 text-center">Unlock advanced analytics with PRO</h3>
                         <button 
                            onClick={() => window.location.href = '/settings/obuna'}
                            className="bg-slate-900 text-white px-10 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest"
                         >
                            Upgrade
                         </button>
                      </div>
                   </div>
                )}
             </div>
          </div>

          {/* Errors List */}
          <div className="space-y-4">
            {filteredErrors.length === 0 ? (
               <div className="py-20 text-center space-y-4 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
                  <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/20 rounded-full flex items-center justify-center mx-auto text-emerald-500">
                     <BookOpen className="w-8 h-8" />
                  </div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Hech qanday xatolik topilmadi</h3>
                  <p className="text-xs text-slate-400">Tanlangan filterlar bo'yicha ma'lumotlar mavjud emas.</p>
               </div>
            ) : (
               filteredErrors.map((error, idx) => (
                  <motion.div 
                     key={error.id}
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: idx * 0.05 }}
                     onClick={() => setSelectedQuestion(error)}
                     className={`group relative bg-white dark:bg-slate-900 border rounded-[2rem] p-6 cursor-pointer transition-all hover:shadow-xl hover:shadow-slate-200/20 dark:hover:shadow-none items-center flex gap-6 ${selectedQuestion?.id === error.id ? 'border-primary ring-2 ring-primary/10' : 'border-slate-100 dark:border-slate-800'}`}
                  >
                     {/* Left indicator */}
                     <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center border border-rose-100 dark:border-rose-900/50">
                           <XCircle className="w-5 h-5 text-rose-500" />
                        </div>
                     </div>

                     {/* Content */}
                     <div className="flex-1 min-w-0 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                           <span className="px-3 py-1 bg-slate-50 dark:bg-slate-800 rounded-full text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">
                              {error.subject}
                           </span>
                           <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              error.difficulty === 'hard' ? 'bg-rose-50 text-rose-600' :
                              error.difficulty === 'medium' ? 'bg-amber-50 text-amber-600' :
                              'bg-emerald-50 text-emerald-600'
                           }`}>
                              {error.difficulty?.toUpperCase() || 'EASY'}
                           </span>
                           <span className="px-3 py-1 bg-rose-500/10 text-rose-500 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-rose-500/20">
                              <XCircle className="w-3 h-3" /> {error.wrong_attempts} WRONG ATTEMPTS
                           </span>
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-auto">
                              <Calendar className="w-3 h-3" /> {new Date(error.last_attempt).toLocaleDateString()}
                           </span>
                        </div>
                        <h4 className="text-[15px] font-black text-slate-900 dark:text-white line-clamp-2 leading-snug tracking-tight">
                           {error.question_text}
                        </h4>
                     </div>

                     <div className="flex-shrink-0 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:text-primary group-hover:bg-primary/10 transition-all">
                        <ChevronRight className="w-5 h-5" />
                     </div>
                  </motion.div>
               ))
            )}
          </div>
        </div>

        {/* AI Sidebar (Conditional) */}
        <AnimatePresence>
           {selectedQuestion && (
              <div className="lg:col-span-4">
                 <EduFoxAdvice question={selectedQuestion} onClose={() => setSelectedQuestion(null)} />
              </div>
           )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default MyErrors;
