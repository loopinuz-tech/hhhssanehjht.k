import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  ChevronLeft, ChevronRight, Timer, 
  CheckCircle2, AlertCircle, Bookmark,
  LayoutGrid, List, ArrowLeft, Trophy
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { rewriteStorageUrl } from "@/lib/storage";

const CourseTest = () => {
  const { category, courseSlug, testId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [results, setResults] = useState<any>(null);

  // Fetch Test with Questions
  const { data: test, isLoading } = useQuery({
    queryKey: ["course-test", testId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_tests")
        .select(`
          *,
          questions:course_test_questions (*)
        `)
        .eq("id", testId)
        .single();
      if (error) throw error;
      return data;
    }
  });

  // Timer logic
  useEffect(() => {
    if (test && timeLeft === null) {
      setTimeLeft(test.duration_minutes * 60);
    }
    
    if (timeLeft === 0 && !isFinished) {
      finishTest();
    }

    if (timeLeft !== null && timeLeft > 0 && !isFinished) {
      const timer = setInterval(() => setTimeLeft(prev => (prev !== null ? prev - 1 : null)), 1000);
      return () => clearInterval(timer);
    }
  }, [test, timeLeft, isFinished]);

  // Submit Mutation
  const submitMutation = useMutation({
    mutationFn: async (resultsData: any) => {
      const { data, error } = await supabase
        .from("course_test_results")
        .insert({
          test_id: testId,
          user_id: user?.id,
          score: resultsData.score,
          correct_answers: resultsData.correct,
          total_questions: resultsData.total
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  });

  const finishTest = () => {
    if (!test || isFinished) return;

    let correct = 0;
    test.questions.forEach((q: any) => {
      if (answers[q.id] === q.correct_option) {
        correct++;
      }
    });

    const score = Math.round((correct / test.questions.length) * 100);
    const resultsData = { score, correct, total: test.questions.length };
    
    setResults(resultsData);
    setIsFinished(true);
    submitMutation.mutate(resultsData);
    
    toast({
      title: t('course_test.success_finish'),
      description: t('course_test.success_finish_desc', { total: test?.questions?.length || 0, correct }),
    });
  };

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  if (isLoading) return (
    <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center">
       <div className="w-10 h-10 border-2 border-slate-200 border-t-[#E8192C] rounded-full animate-spin" />
    </div>
  );
  if (!test) return <div className="p-10 text-center dark:text-slate-400">{t('course_test.not_found')}</div>;

  if (isFinished) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center p-6">
        <div className="max-w-xl w-full text-center space-y-10 animate-in fade-in zoom-in-95 duration-700">
          <div className="relative">
            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-[32px] flex items-center justify-center mx-auto border-4 border-white dark:border-slate-900 relative z-10">
               <Trophy className="w-10 h-10 text-[#E8192C]" />
            </div>
          </div>

          <div className="space-y-3">
             <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">{t('course_test.results_title')}</h1>
             <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{test.title}</p>
          </div>

          <div className="grid grid-cols-3 gap-1 bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-white/5">
             <div className="space-y-1">
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{t('course_test.score_correct')}</p>
                <p className="text-3xl font-semibold text-[#E8192C] tabular-nums">{results?.correct}</p>
             </div>
             <div className="space-y-1 border-x border-slate-200 dark:border-white/5">
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{t('course_test.score_total')}</p>
                <p className="text-3xl font-semibold text-slate-900 dark:text-white tabular-nums">{results?.total}</p>
             </div>
             <div className="space-y-1">
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{t('course_test.score_percent')}</p>
                <p className="text-3xl font-semibold text-[#E8192C] tabular-nums">{results?.score}%</p>
             </div>
          </div>

          <div className="flex flex-col gap-4 max-w-xs mx-auto">
             <Button 
               onClick={() => navigate(`/courses/${category}/${courseSlug}`)}
               className="w-full px-5 py-2.5 rounded-xl text-[13px] font-medium text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
               style={{ background: "#E8192C" }}
             >
               {t('course_test.btn_back_to_course')}
             </Button>
             <button 
               onClick={() => {
                 setIsFinished(false);
                 setAnswers({});
                 setCurrentIdx(0);
                 setTimeLeft(test.duration_minutes * 60);
               }}
               className="text-[11px] font-medium text-slate-400 uppercase tracking-wider hover:text-[#E8192C] transition-colors"
             >
               {t('course_test.btn_retry')}
             </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = test.questions[currentIdx];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-500">
       {/* Compact Header */}
       <header className="px-6 py-3 border-b border-slate-200 dark:border-white/5 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-30">
          <div className="flex items-center gap-4">
             <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 hover:text-[#E8192C] transition-all active:scale-90 border border-slate-200 dark:border-white/5">
                <ArrowLeft className="w-4 h-4" />
             </button>
             <div className="hidden sm:block">
                <h1 className="text-[11px] font-semibold text-slate-800 dark:text-white uppercase tracking-tight truncate max-w-[250px]">{test.title}</h1>
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{currentIdx + 1} / {test.questions.length}</p>
             </div>
          </div>

          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600">
                <Timer className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-medium tabular-nums">{timeLeft !== null ? formatTime(timeLeft) : "--:--"}</span>
             </div>
             <Button 
               onClick={finishTest}
               className="px-5 py-2.5 rounded-xl text-[13px] font-medium text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
               style={{ background: "#E8192C" }}
             >
                {t('course_test.finish_btn')}
             </Button>
          </div>
       </header>

       {/* Compact Body */}
       <main className="flex-1 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 lg:p-8 relative">
          
          {/* Question Area */}
          <div className="lg:col-span-8 space-y-8">
             <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-3xl p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex items-start gap-4">
                   <div className="w-10 h-10 rounded-xl bg-[#E8192C] text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                      {currentIdx + 1}
                   </div>
                   <h2 className="text-lg md:text-xl font-semibold text-slate-800 dark:text-white leading-snug pt-1">
                      {currentQuestion.question_text}
                   </h2>
                </div>

                {currentQuestion.image_url && (
                  <div className="mt-6 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/5 max-w-lg mx-auto">
                     <img src={rewriteStorageUrl(currentQuestion.image_url)} alt="Question" className="w-full h-auto" />
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3 mt-10">
                   {(currentQuestion.options as string[]).map((opt: string, idx: number) => (
                      <button
                       key={idx}
                       onClick={() => setAnswers(prev => ({ ...prev, [currentQuestion.id]: idx }))}
                       className={`p-4 rounded-2xl border text-left flex items-center gap-4 transition-all group relative overflow-hidden ${
                         answers[currentQuestion.id] === idx 
                           ? "bg-slate-100 border-[#E8192C]" 
                           : "bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 hover:border-[#E8192C]/30"
                       }`}
                     >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-medium transition-all duration-300 ${
                          answers[currentQuestion.id] === idx ? "bg-[#E8192C] text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                        }`}>
                           {String.fromCharCode(65 + idx)}
                        </div>
                        <span className={`text-[14px] font-semibold transition-all ${
                          answers[currentQuestion.id] === idx ? "text-[#E8192C]" : "text-slate-600 dark:text-slate-400"
                        }`}>{opt}</span>
                        
                        {answers[currentQuestion.id] === idx && (
                           <div className="absolute top-0 right-0 p-2">
                              <CheckCircle2 className="w-4 h-4 text-[#E8192C]" />
                           </div>
                        )}
                     </button>
                   ))}
                </div>
             </div>

             <div className="flex items-center justify-between">
                <button
                  onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                  disabled={currentIdx === 0}
                  className="flex items-center gap-2 text-[11px] font-medium text-slate-400 uppercase tracking-wider hover:text-[#E8192C] disabled:opacity-30 transition-all group"
                >
                   <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> {t('course_test.prev_btn')}
                </button>
                <div className="hidden sm:flex items-center gap-1.5">
                   {test.questions.map((_: any, idx: number) => (
                     <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
                       idx === currentIdx ? "w-5 bg-[#E8192C]" : answers[test.questions[idx].id] !== undefined ? "bg-[#E8192C]/30" : "bg-slate-200 dark:bg-white/10"
                     }`} />
                   ))}
                </div>
                <button
                  onClick={() => setCurrentIdx(prev => Math.min(test.questions.length - 1, prev + 1))}
                  disabled={currentIdx === test.questions.length - 1}
                  className="flex items-center gap-2 text-[11px] font-medium text-[#E8192C] uppercase tracking-wider hover:text-[#E8192C] disabled:opacity-30 transition-all group"
                >
                   {t('course_test.next_btn')} <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
             </div>
          </div>

          {/* Academic Navigation Sidebar */}
          <div className="lg:col-span-4 hidden lg:block">
             <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-3xl p-6 sticky top-24">
                <div className="flex items-center justify-between mb-6">
                   <h3 className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{t('course_test.sidebar_stats')}</h3>
                   <LayoutGrid className="w-4 h-4 text-slate-300" />
                </div>

                <div className="grid grid-cols-5 gap-2">
                   {test.questions.map((q: any, idx: number) => (
                     <button
                       key={q.id}
                       onClick={() => setCurrentIdx(idx)}
                       className={`w-full aspect-square rounded-xl border flex items-center justify-center text-[11px] font-medium transition-all ${
                         idx === currentIdx 
                           ? "bg-slate-900 dark:bg-[#E8192C] text-white border-slate-900" 
                           : answers[q.id] !== undefined 
                             ? "bg-[#E8192C]/10 text-[#E8192C] border-[#E8192C]/20" 
                             : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-400 hover:border-[#E8192C]/30"
                       }`}
                     >
                        {idx + 1}
                     </button>
                   ))}
                </div>

                <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/5 space-y-4">
                   <div className="flex justify-between items-end">
                      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{t('course_test.progress_label')}:</span>
                      <span className="text-xs font-semibold text-slate-900 dark:text-white tabular-nums">{Object.keys(answers).length} / {test?.questions?.length || 0}</span>
                   </div>
                   <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#E8192C] rounded-full transition-all duration-1000" 
                        style={{ width: `${(Object.keys(answers).length / (test?.questions?.length || 1)) * 100}%` }}
                      />
                   </div>
                   <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl flex items-start gap-3">
                       <AlertCircle className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                       <p className="text-[11px] font-medium text-slate-500 leading-normal italic">{t('course_test.disclaimer')}</p>
                   </div>
                </div>
             </div>
          </div>
       </main>
    </div>
  );
};

export default CourseTest;
