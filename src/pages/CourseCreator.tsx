import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Plus, FileText, Layout, Save, Send,
  Trash2, Image as ImageIcon, DollarSign,
  ChevronRight, ArrowLeft, CheckCircle2, AlertCircle, Upload, X,
  Sparkles, Rocket, List, Wallet, Clock, HelpCircle, Link,
  Video, Film, FileType, GripVertical
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { AltArrowLeftIcon } from "@solar-icons/react/bold-duotone/alt-arrow-left";
import { DocumentTextIcon } from "@solar-icons/react/bold-duotone/document-text";
import { ChecklistIcon } from "@solar-icons/react/bold-duotone/checklist";
import { CheckCircleIcon } from "@solar-icons/react/bold-duotone/check-circle";
import { RocketIcon } from "@solar-icons/react/bold-duotone/rocket";
import { StarsIcon } from "@solar-icons/react/bold-duotone/stars";
import { GalleryIcon } from "@solar-icons/react/bold-duotone/gallery";
import { WalletIcon } from "@solar-icons/react/bold-duotone/wallet";
import { Widget4Icon } from "@solar-icons/react/bold-duotone/widget-4";
import { AddCircleIcon } from "@solar-icons/react/bold-duotone/add-circle";
import { TrashBinTrashIcon } from "@solar-icons/react/bold-duotone/trash-bin-trash";
import { DisketteIcon } from "@solar-icons/react/bold-duotone/diskette";

const CATEGORIES = ["Matematika", "Ona tili", "Fizika", "Kimyo", "Biologiya", "Tarix", "Chet tili", "Informatika", "Adabiyot"];

const initLesson = () => ({ id: crypto.randomUUID(), title: "", video_url: "", content: "", duration: "", material_url: "", material_name: "", videoFile: null as File | null, materialFile: null as File | null });
const initTest = () => ({ id: crypto.randomUUID(), title: "", duration_minutes: 30, passing_score: 70, questions: [] as any[] });
const initQuestion = () => ({ id: crypto.randomUUID(), question_text: "", options: ["", "", "", ""], correct_option: 0 });

const CourseCreator = () => {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadFileName, setUploadFileName] = useState("");
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  const [courseData, setCourseData] = useState({
    title: "",
    description: "",
    category: "Matematika",
    price: 0,
    level: "beginner" as string,
    cover_image: "",
    meta_title: "",
    meta_description: ""
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [modules, setModules] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    if (id) { fetchCourseData(); return; }
    setModules([{
      id: crypto.randomUUID(),
      title: "Kirish",
      sort_order: 0,
      lessons: [{ ...initLesson(), title: "Kursga kirish" }],
      tests: []
    }]);
  }, [id, user]);

  const fetchCourseData = async () => {
    try {
      const { data: course, error } = await (supabase as any)
        .from("courses")
        .select("*, modules:course_modules(*, lessons:course_lessons(*), tests:course_tests(*, questions:course_test_questions(*)))")
        .eq("id", id).single();
      if (error) throw error;
      setCourseData({
        title: course.title, description: course.description || "",
        category: course.category, price: course.price,
        level: course.level || "beginner", cover_image: course.cover_image || "",
        meta_title: course.meta_title || "", meta_description: course.meta_description || ""
      });
      if (course.cover_image) setCoverPreview(course.cover_image);
      if (course.modules) {
        setModules(course.modules.sort((a: any, b: any) => a.sort_order - b.sort_order).map((m: any) => ({
          ...m,
          lessons: (m.lessons || []).sort((a: any, b: any) => a.sort_order - b.sort_order),
          tests: (m.tests || []).sort((a: any, b: any) => a.sort_order - b.sort_order).map((t: any) => ({
            ...t,
            questions: (t.questions || []).sort((a: any, b: any) => a.sort_order - b.sort_order)
          }))
        })));
      }
    } catch (err: any) {
      toast({ title: "Xatolik", description: "Kurs ma'lumotlarini yuklab bo'lmadi", variant: "destructive" });
    }
  };

  const handleAiDescription = () => {
    if (!courseData.title) {
      toast({ title: "Sarlavha kerak", description: "AI tavsif yaratishi uchun avval kurs nomini kiriting." });
      return;
    }
    setIsAiGenerating(true);
    setTimeout(() => {
      setCourseData({ ...courseData, description: `Ushbu "${courseData.title}" kursi orqali siz fanning eng murakkab mavzularini sodda va tushunarli tilda o'rganasiz. Kurs davomida nazariy bilimlar real misollar va interaktiv testlar bilan boyitilgan. O'quv jarayoni bosqichma-bosqich tuzilgan bo'lib, har bir o'quvchi o'z bilimini mustahkamlashi uchun barcha imkoniyatlar yaratilgan.` });
      setIsAiGenerating(false);
      toast({ title: "AI Yordamchi", description: "Kurs tavsifi yaratildi!" });
    }, 1500);
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const uploadFile = async (file: File, bucket: string, path: string): Promise<string | null> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${path}/${crypto.randomUUID()}.${fileExt}`;
    setUploadFileName(file.name);
    setUploadProgress(0);

    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `/api/storage/upload/${bucket}`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const res = JSON.parse(xhr.responseText);
            setUploadProgress(100);
            setTimeout(() => { setUploadProgress(0); setUploadFileName(""); }, 1000);
            resolve(res.url || null);
          } catch {
            toast({ title: "Yuklash xatoligi", description: "Javobni tushunib bo'lmadi", variant: "destructive" });
            setUploadProgress(0);
            setUploadFileName("");
            resolve(null);
          }
        } else {
          let errMsg = "Faylni yuklab bo'lmadi";
          try {
            const res = JSON.parse(xhr.responseText);
            errMsg = res.error || errMsg;
          } catch {}
          toast({ title: "Yuklash xatoligi", description: errMsg, variant: "destructive" });
          setUploadProgress(0);
          setUploadFileName("");
          resolve(null);
        }
      };

      xhr.onerror = () => {
        toast({ title: "Yuklash xatoligi", description: "Tarmoq xatoligi", variant: "destructive" });
        setUploadProgress(0);
        setUploadFileName("");
        resolve(null);
      };

      const formData = new FormData();
      formData.append('file', file);
      xhr.send(formData);
    });
  };

  const handleLessonChange = (moduleId: string, lessonId: string, field: string, value: any) => {
    setModules(modules.map(m => m.id === moduleId ? {
      ...m, lessons: m.lessons.map((l: any) => l.id === lessonId ? { ...l, [field]: value } : l)
    } : m));
  };

  const handleLessonFileUpload = async (moduleId: string, lessonId: string, file: File, type: "video" | "material") => {
    if (!id) { toast({ title: "Avval kursni saqlang", variant: "destructive" }); return; }
    setUploading(true);
    const bucket = type === "video" ? "course-videos" : "course-covers";
    const url = await uploadFile(file, bucket, `${id}/lessons`);
    if (url) {
      handleLessonChange(moduleId, lessonId, type === "video" ? "video_url" : "material_url", url);
    }
    setUploading(false);
  };

  const addModule = () => setModules([...modules, { id: crypto.randomUUID(), title: "Yangi bo'lim", sort_order: modules.length, lessons: [], tests: [] }]);
  const addLesson = (moduleId: string) => setModules(modules.map(m => m.id === moduleId ? { ...m, lessons: [...m.lessons, initLesson()] } : m));
  const removeLesson = (moduleId: string, lessonId: string) => setModules(modules.map(m => m.id === moduleId ? { ...m, lessons: m.lessons.filter((l: any) => l.id !== lessonId) } : m));
  const updateModule = (id: string, title: string) => setModules(modules.map(m => m.id === id ? { ...m, title } : m));
  const removeModule = (id: string) => setModules(modules.filter(m => m.id !== id));

  const addTest = (moduleId: string) => setModules(modules.map(m => m.id === moduleId ? { ...m, tests: [...(m.tests || []), initTest()] } : m));
  const removeTest = (moduleId: string, testId: string) => setModules(modules.map(m => m.id === moduleId ? { ...m, tests: (m.tests || []).filter((t: any) => t.id !== testId) } : m));
  const handleTestChange = (moduleId: string, testId: string, field: string, value: any) => {
    setModules(modules.map(m => m.id === moduleId ? {
      ...m, tests: (m.tests || []).map((t: any) => t.id === testId ? { ...t, [field]: value } : t)
    } : m));
  };

  const addQuestion = (moduleId: string, testId: string) => setModules(modules.map(m => m.id === moduleId ? {
    ...m, tests: (m.tests || []).map((t: any) => t.id === testId ? { ...t, questions: [...(t.questions || []), initQuestion()] } : t)
  } : m));
  const removeQuestion = (moduleId: string, testId: string, qId: string) => setModules(modules.map(m => m.id === moduleId ? {
    ...m, tests: (m.tests || []).map((t: any) => t.id === testId ? { ...t, questions: (t.questions || []).filter((q: any) => q.id !== qId) } : t)
  } : m));
  const handleQuestionChange = (moduleId: string, testId: string, qId: string, field: string, value: any) => {
    setModules(modules.map(m => m.id === moduleId ? {
      ...m, tests: (m.tests || []).map((t: any) => t.id === testId ? {
        ...t, questions: (t.questions || []).map((q: any) => q.id === qId ? { ...q, [field]: value } : q)
      } : t)
    } : m));
  };
  const handleOptionChange = (moduleId: string, testId: string, qId: string, optIdx: number, value: string) => {
    setModules(modules.map(m => m.id === moduleId ? {
      ...m, tests: (m.tests || []).map((t: any) => t.id === testId ? {
        ...t, questions: (t.questions || []).map((q: any) => q.id === qId ? {
          ...q, options: q.options.map((o: string, i: number) => i === optIdx ? value : o)
        } : q)
      } : t)
    } : m));
  };

  const handleSubmit = async (status: "draft" | "pending") => {
    if (!courseData.title) return toast({ title: "Xatolik", description: "Kurs sarlavhasini kiriting", variant: "destructive" });
    setLoading(true);
    try {
      let coverImageUrl = courseData.cover_image;
      if (coverFile) {
        const url = await uploadFile(coverFile, "course-covers", `${user?.id}`);
        if (url) coverImageUrl = url;
      }

      if (id) {
        const { error } = await supabase.from("courses").update({
          title: courseData.title, description: courseData.description,
          category: courseData.category, price: courseData.price,
          level: courseData.level, cover_image: coverImageUrl, status,
          meta_title: courseData.meta_title, meta_description: courseData.meta_description
        } as any).eq("id", id);
        if (error) throw error;
        await saveModules(id);
        toast({ title: "Yangilandi", description: "Kurs muvaffaqiyatli yangilandi" });
      } else {
        const { data: newCourse, error } = await supabase.from("courses").insert({
          teacher_id: user?.id, title: courseData.title, description: courseData.description,
          category: courseData.category, price: courseData.price,
          level: courseData.level, cover_image: coverImageUrl, status,
          meta_title: courseData.meta_title, meta_description: courseData.meta_description
        } as any).select().single();
        if (error) throw error;
        if (newCourse) {
          await saveModules(newCourse.id);
          toast({ title: "Muvaffaqiyatli", description: "Kurs saqlandi" });
        }
      }
      navigate("/courses");
    } catch (err: any) {
      toast({ title: "Xatolik", description: err.message || "Kursni saqlashda xatolik", variant: "destructive" });
    }
    setLoading(false);
  };

  const saveModules = async (courseId: string) => {
    for (let mi = 0; mi < modules.length; mi++) {
      const mod = modules[mi];
      let moduleId = mod.id;

      if (mod.id && mod.id.length === 36 && mod.id.includes("-")) {
        const { data: existing } = await supabase.from("course_modules").select("id").eq("id", mod.id).maybeSingle();
        if (existing) {
          await supabase.from("course_modules").update({ title: mod.title, sort_order: mi } as any).eq("id", mod.id);
        } else {
          const { data: newMod } = await supabase.from("course_modules").insert({ id: mod.id, course_id: courseId, title: mod.title, sort_order: mi } as any).select().single();
          if (newMod) moduleId = newMod.id;
        }
      } else {
        const { data: newMod } = await supabase.from("course_modules").insert({ course_id: courseId, title: mod.title, sort_order: mi } as any).select().single();
        if (newMod) moduleId = newMod.id;
      }

      for (let li = 0; li < (mod.lessons || []).length; li++) {
        const lesson = mod.lessons[li];
        const lessonData = { module_id: moduleId, title: lesson.title, video_url: lesson.video_url, content: lesson.content, duration: lesson.duration, material_url: lesson.material_url, sort_order: li };
        if (lesson.id && lesson.id.length === 36 && lesson.id.includes("-")) {
          const { data: exists } = await supabase.from("course_lessons").select("id").eq("id", lesson.id).maybeSingle();
          if (exists) {
            await supabase.from("course_lessons").update(lessonData as any).eq("id", lesson.id);
          } else {
            await supabase.from("course_lessons").insert({ ...lessonData, id: lesson.id } as any);
          }
        } else {
          await supabase.from("course_lessons").insert(lessonData as any);
        }
      }

      for (let ti = 0; ti < (mod.tests || []).length; ti++) {
        const test = mod.tests[ti];
        const testData = { course_id: courseId, module_id: moduleId, title: test.title, duration_minutes: test.duration_minutes, passing_score: test.passing_score, sort_order: ti };
        let testId = test.id;
        if (test.id && test.id.length === 36 && test.id.includes("-")) {
          const { data: exists } = await supabase.from("course_tests").select("id").eq("id", test.id).maybeSingle();
          if (exists) {
            await supabase.from("course_tests").update(testData as any).eq("id", test.id);
          } else {
            const { data: newTest } = await supabase.from("course_tests").insert({ ...testData, id: test.id } as any).select().single();
            if (newTest) testId = newTest.id;
          }
        } else {
          const { data: newTest } = await supabase.from("course_tests").insert(testData as any).select().single();
          if (newTest) testId = newTest.id;
        }

        for (let qi = 0; qi < (test.questions || []).length; qi++) {
          const q = test.questions[qi];
          const qData = { test_id: testId, question_text: q.question_text, options: JSON.stringify(q.options), correct_option: q.correct_option, sort_order: qi };
          if (q.id && q.id.length === 36 && q.id.includes("-")) {
            const { data: exists } = await supabase.from("course_test_questions").select("id").eq("id", q.id).maybeSingle();
            if (exists) {
              await supabase.from("course_test_questions").update(qData as any).eq("id", q.id);
            } else {
              await supabase.from("course_test_questions").insert({ ...qData, id: q.id } as any);
            }
          } else {
            await supabase.from("course_test_questions").insert(qData as any);
          }
        }
      }
    }
  };

  const totalLessons = modules.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0);
  const totalTests = modules.reduce((acc: number, m: any) => acc + (m.tests?.length || 0), 0);

  return (
    <div className="w-full bg-white dark:bg-slate-900 min-h-screen pb-24">
      <div className="max-w-[1100px] mx-auto pt-4 px-4 md:px-6">

        {/* TOP BAR */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="space-y-3">
            <button onClick={() => navigate("/courses")} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors font-medium text-[11px] uppercase tracking-wider">
              <AltArrowLeftIcon size={16} /> Kurslar
            </button>
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-[#E8192C] flex items-center justify-center text-white shadow-md">
                <Widget4Icon size={22} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {id ? "Kurs Tahrirlash" : "Yangi Kurs Yaratish"}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-[13px] font-medium">Kurs ma'lumotlarini to'ldiring</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => handleSubmit("draft")} disabled={loading}
              className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-[13px] font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-2">
              <DisketteIcon size={16} /> Qoralama
            </button>
            <button onClick={() => handleSubmit("pending")} disabled={loading}
              className="px-5 py-2.5 rounded-xl text-[13px] font-medium text-white transition-opacity hover:opacity-90 active:scale-[0.98] flex items-center gap-2 shadow-md"
              style={{ background: "#E8192C" }}>
              <RocketIcon size={16} /> {loading ? "Saqlanmoqda..." : id ? "Yangilash" : "Nashr Qilish"}
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-10 items-start">

          {/* SIDEBAR */}
          <div className="w-full lg:w-60 sticky top-24 space-y-2">
            {[
              { s: 1, l: "Asosiy Ma'lumotlar", icon: DocumentTextIcon },
              { s: 2, l: "O'quv Dasturi", icon: ChecklistIcon },
              { s: 3, l: "Yakuniy Ko'rik", icon: CheckCircleIcon }
            ].map((item) => {
              const IconComponent = item.icon;
              return (
                <button key={item.s} onClick={() => setStep(item.s)}
                  className={`w-full p-3.5 rounded-2xl flex items-center gap-3 transition-all border ${step === item.s ? "bg-white dark:bg-slate-900 border-[#E8192C] text-[#E8192C] shadow-xs" : "bg-white dark:bg-slate-900/50 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400"}`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${step === item.s ? "bg-[#E8192C] text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
                    <IconComponent size={18} />
                  </div>
                  <span className="text-[11.5px] font-semibold uppercase tracking-wider">{item.l}</span>
                </button>
              );
            })}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 mt-6 space-y-3">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                <StarsIcon size={18} className="text-[#E8192C]" />
                <span className="text-[11px] font-semibold uppercase tracking-wider">AI Yordamchi</span>
              </div>
              <p className="text-[11.5px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed">Kontent yaratishda AI dan foydalaning.</p>
              <button onClick={handleAiDescription}
                className="w-full py-2.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-[11px] font-semibold uppercase tracking-wider transition-all shadow-2xs">
                Tavsif yaratish
              </button>
            </div>
          </div>

          {/* MAIN CONTENT */}
          <div className="flex-1 w-full">
            <AnimatePresence mode="wait">

              {/* STEP 1: ASOSIY MA'LUMOTLAR */}
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-300 dark:border-slate-700 shadow-sm space-y-8">
                  <div className="space-y-6">
                    {/* Title */}
                    <div className="space-y-2.5">
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider ml-1">Kurs sarlavhasi</label>
                      <input value={courseData.title} onChange={e => setCourseData({ ...courseData, title: e.target.value })}
                        className="w-full h-11 px-5 bg-slate-50/50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-[14px] font-semibold text-slate-900 dark:text-white focus:border-[#E8192C] focus:ring-1 focus:ring-[#E8192C] outline-none transition-all placeholder:text-slate-400"
                        placeholder="Masalan: Akademik Ona tili kurslari" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2.5">
                        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider ml-1">Kategoriya</label>
                        <select value={courseData.category} onChange={e => setCourseData({ ...courseData, category: e.target.value })}
                          className="w-full h-11 px-4 bg-slate-50/50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-[13px] font-semibold text-slate-900 dark:text-white outline-none focus:border-[#E8192C]">
                          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2.5">
                        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider ml-1">Daraja</label>
                        <select value={courseData.level} onChange={e => setCourseData({ ...courseData, level: e.target.value })}
                          className="w-full h-11 px-4 bg-slate-50/50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-[13px] font-semibold text-slate-900 dark:text-white outline-none focus:border-[#E8192C]">
                          <option value="beginner">Boshlang'ich</option>
                          <option value="intermediate">O'rtacha</option>
                          <option value="advanced">Murakkab</option>
                        </select>
                      </div>
                      <div className="space-y-2.5">
                        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider ml-1">Narxi (UZS)</label>
                        <div className="relative">
                          <WalletIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                          <input type="number" value={courseData.price} onChange={e => setCourseData({ ...courseData, price: Number(e.target.value) })}
                            className="w-full h-11 pl-11 pr-4 bg-slate-50/50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-[13px] font-semibold text-slate-900 dark:text-white outline-none focus:border-[#E8192C]" />
                        </div>
                      </div>
                    </div>

                    {/* Cover image */}
                    <div className="space-y-2.5">
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider ml-1">Kurs rasmi</label>
                      <label className="flex items-center gap-3 px-5 py-4 bg-slate-50/50 dark:bg-slate-950 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl cursor-pointer hover:border-[#E8192C] transition-colors">
                        <GalleryIcon size={20} className="text-slate-500" />
                        <span className="text-[13px] text-slate-700 dark:text-slate-300 font-semibold">Rasm tanlash</span>
                        <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                      </label>
                      {coverPreview && (
                        <div className="relative w-full h-36 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
                          <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                          <button onClick={() => { setCoverFile(null); setCoverPreview(""); }}
                            className="absolute top-2 right-2 w-8 h-8 bg-white/90 dark:bg-slate-900/90 rounded-xl flex items-center justify-center text-slate-700 hover:text-[#E8192C] shadow-sm">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <div className="space-y-3 relative">
                      <div className="flex items-center justify-between ml-1">
                        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Kurs tavsifi</label>
                        <button onClick={handleAiDescription} className="text-[#E8192C] text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5 hover:opacity-80">
                          <StarsIcon size={16} /> AI generator
                        </button>
                      </div>
                      <textarea rows={5} value={courseData.description} onChange={e => setCourseData({ ...courseData, description: e.target.value })}
                        className="w-full p-4 bg-slate-50/50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-2xl text-[13.5px] font-medium text-slate-800 dark:text-slate-200 leading-relaxed outline-none resize-none focus:border-[#E8192C] transition-all placeholder:text-slate-400"
                        placeholder="Kurs haqida qisqacha ma'lumot..." />
                      {isAiGenerating && <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 rounded-2xl flex items-center justify-center font-bold text-[#E8192C] animate-pulse text-xs uppercase tracking-wider">AI ishlamoqda...</div>}
                    </div>

                    {/* SEO fields */}
                    <div className="border-t border-slate-300 dark:border-slate-700 pt-6">
                      <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-4">SEO</p>
                      <div className="space-y-4">
                        <div className="space-y-2.5">
                          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider ml-1">Meta sarlavha</label>
                          <input value={courseData.meta_title} onChange={e => setCourseData({ ...courseData, meta_title: e.target.value })}
                            className="w-full h-11 px-5 bg-slate-50/50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-[14px] font-semibold text-slate-900 dark:text-white focus:border-[#E8192C] outline-none transition-all placeholder:text-slate-400"
                            placeholder="Google'da ko'rinadigan sarlavha" />
                        </div>
                        <div className="space-y-2.5">
                          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider ml-1">Meta tavsif</label>
                          <textarea rows={3} value={courseData.meta_description} onChange={e => setCourseData({ ...courseData, meta_description: e.target.value })}
                            className="w-full p-4 bg-slate-50/50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-2xl text-[13.5px] font-medium text-slate-800 dark:text-slate-200 leading-relaxed outline-none resize-none focus:border-[#E8192C] transition-all placeholder:text-slate-400"
                            placeholder="Google'da ko'rinadigan qisqa tavsif" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-6 border-t border-slate-300 dark:border-slate-700">
                    <button onClick={() => setStep(2)} className="px-6 py-3 rounded-xl text-[13.5px] font-bold text-white transition-opacity hover:opacity-90 active:scale-[0.98] flex items-center gap-1 shadow-md" style={{ background: "#E8192C" }}>
                      Keyingi bosqich <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: O'QUV DASTURI */}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                  <div className="flex items-center justify-between px-1">
                    <div>
                      <h2 className="text-lg font-bold text-slate-800 dark:text-white uppercase tracking-wider">O'quv dasturi</h2>
                      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-1">{totalLessons} ta dars · {totalTests} ta test</p>
                    </div>
                    <button onClick={addModule} className="px-5 py-2.5 rounded-xl text-[13px] font-medium text-white transition-opacity hover:opacity-90 active:scale-[0.98] flex items-center gap-1.5" style={{ background: "#E8192C" }}>
                      <Plus className="w-3.5 h-3.5" /> Bo'lim qo'shish
                    </button>
                  </div>

                  <div className="space-y-6">
                    {modules.map((m, mIdx) => (
                      <div key={m.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-300 dark:border-slate-700 p-6 space-y-6 shadow-xs">
                        {/* Module header */}
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-300 dark:border-slate-700">{mIdx + 1}</div>
                          <input value={m.title} onChange={e => updateModule(m.id, e.target.value)}
                            className="flex-1 bg-transparent text-lg font-bold text-slate-900 dark:text-white outline-none tracking-tight border-b border-transparent focus:border-[#E8192C]"
                            placeholder="Bo'lim sarlavhasi" />
                          <button onClick={() => removeModule(m.id)} className="p-2 text-slate-400 hover:text-[#E8192C] transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>

                        <div className="pl-0 md:pl-14 space-y-4">
                          {/* Lessons */}
                          {m.lessons.map((l: any, lIdx: number) => (
                            <div key={l.id} className="p-5 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl border border-slate-300 dark:border-slate-700 space-y-4">
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center text-[10px] font-semibold border border-slate-300 dark:border-slate-700 flex-shrink-0">
                                    {lIdx + 1}
                                  </div>
                                  <input value={l.title} onChange={e => handleLessonChange(m.id, l.id, "title", e.target.value)}
                                    className="bg-transparent font-semibold text-[14px] text-slate-900 dark:text-white outline-none min-w-0 flex-1"
                                    placeholder="Dars mavzusi" />
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <button onClick={() => removeLesson(m.id, l.id)} className="p-2 text-slate-400 hover:text-[#E8192C] transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Video URL */}
                                <div className="relative">
                                  <Video className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                  <input value={l.video_url} onChange={e => handleLessonChange(m.id, l.id, "video_url", e.target.value)}
                                    placeholder="YouTube video linki"
                                    className="w-full h-10 pl-10 pr-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-[12px] font-medium text-slate-800 dark:text-slate-200 outline-none focus:border-[#E8192C] transition-all placeholder:text-slate-400" />
                                </div>
                                {/* Duration */}
                                <div className="relative">
                                  <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                  <input value={l.duration} onChange={e => handleLessonChange(m.id, l.id, "duration", e.target.value)}
                                    placeholder="Davomiyligi (daqiqa)"
                                    className="w-full h-10 pl-10 pr-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-[12px] font-medium text-slate-800 dark:text-slate-200 outline-none focus:border-[#E8192C] transition-all placeholder:text-slate-400" />
                                </div>
                              </div>

                              {/* Content */}
                              <textarea value={l.content} onChange={e => handleLessonChange(m.id, l.id, "content", e.target.value)}
                                rows={3} placeholder="Dars matni yoki tavsifi..."
                                className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-[12px] font-medium text-slate-800 dark:text-slate-200 outline-none resize-none focus:border-[#E8192C] transition-all placeholder:text-slate-400" />

                              {/* Material upload */}
                              <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                  <label className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer hover:border-[#E8192C] transition-colors text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                                    <Film className="w-3.5 h-3.5" /> Fayl biriktirish
                                    <input type="file" accept="video/*,audio/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx" onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleLessonFileUpload(m.id, l.id, file, "material");
                                    }} className="hidden" />
                                  </label>
                                  {l.material_url && (
                                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                                      <CheckCircle2 className="w-3 h-3" /> Biriktirildi
                                    </span>
                                  )}
                                </div>
                                {uploading && (
                                  <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] text-slate-500 truncate max-w-[150px]">{uploadFileName}</span>
                                      <span className="text-[10px] font-semibold text-[#E8192C]">{uploadProgress}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-[#E8192C] rounded-full transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}

                          {/* Add lesson button */}
                          <button onClick={() => addLesson(m.id)}
                            className="w-full py-3.5 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-slate-400 transition-all flex items-center justify-center gap-2">
                            <Plus className="w-3.5 h-3.5" /> Dars qo'shish
                          </button>

                          {/* Module Tests */}
                          <div className="pt-2 border-t border-slate-300 dark:border-slate-700">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Testlar</span>
                              <button onClick={() => addTest(m.id)}
                                className="text-[11px] font-semibold text-[#E8192C] hover:opacity-80 flex items-center gap-1">
                                <Plus className="w-3 h-3" /> Test qo'shish
                              </button>
                            </div>

                            {(m.tests || []).map((test: any, tIdx: number) => (
                              <div key={test.id} className="mb-4 p-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl space-y-4">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <HelpCircle className="w-4 h-4 text-[#E8192C] flex-shrink-0" />
                                    <input value={test.title} onChange={e => handleTestChange(m.id, test.id, "title", e.target.value)}
                                      placeholder="Test nomi" className="bg-transparent font-semibold text-[13px] text-slate-900 dark:text-white outline-none flex-1 min-w-0" />
                                  </div>
                                  <button onClick={() => removeTest(m.id, test.id)}
                                    className="p-1.5 text-slate-400 hover:text-[#E8192C] transition-colors">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Vaqt:</span>
                                    <input type="number" value={test.duration_minutes} onChange={e => handleTestChange(m.id, test.id, "duration_minutes", Number(e.target.value))}
                                      className="w-16 h-8 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-[12px] font-semibold text-slate-900 dark:text-white outline-none text-center" />
                                    <span className="text-[11px] text-slate-400">daq</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[11px] text-slate-500">O'tish %:</span>
                                    <input type="number" value={test.passing_score} onChange={e => handleTestChange(m.id, test.id, "passing_score", Number(e.target.value))}
                                      className="w-16 h-8 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[12px] font-medium text-slate-700 outline-none text-center" />
                                  </div>
                                  <span className="text-[11px] text-slate-400">{(test.questions || []).length} ta savol</span>
                                </div>

                                {/* Questions */}
                                <div className="space-y-3 pl-4 border-l border-slate-200 dark:border-slate-700">
                                  {(test.questions || []).map((q: any, qIdx: number) => (
                                    <div key={q.id} className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800/60 space-y-3">
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="text-[11px] font-medium text-slate-400">{qIdx + 1}-savol</span>
                                        <button onClick={() => removeQuestion(m.id, test.id, q.id)}
                                          className="p-1 text-slate-400 hover:text-[#E8192C] transition-colors">
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                      <input value={q.question_text} onChange={e => handleQuestionChange(m.id, test.id, q.id, "question_text", e.target.value)}
                                        placeholder="Savol matni"
                                        className="w-full h-9 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[12px] font-medium text-slate-700 outline-none focus:border-[#E8192C] transition-all" />
                                      {q.options.map((opt: string, oIdx: number) => (
                                        <div key={oIdx} className="flex items-center gap-2">
                                          <button onClick={() => handleQuestionChange(m.id, test.id, q.id, "correct_option", oIdx)}
                                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${q.correct_option === oIdx ? "border-[#E8192C] bg-[#E8192C]" : "border-slate-300 dark:border-slate-600"}`}>
                                            {q.correct_option === oIdx && <div className="w-2 h-2 rounded-full bg-white" />}
                                          </button>
                                          <input value={opt} onChange={e => handleOptionChange(m.id, test.id, q.id, oIdx, e.target.value)}
                                            placeholder={`Variant ${oIdx + 1}`}
                                            className="flex-1 h-9 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[12px] font-medium text-slate-600 outline-none focus:border-[#E8192C] transition-all" />
                                        </div>
                                      ))}
                                    </div>
                                  ))}
                                  <button onClick={() => addQuestion(m.id, test.id)}
                                    className="w-full py-3 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-medium text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all flex items-center justify-center gap-1.5">
                                    <Plus className="w-3 h-3" /> Savol qo'shish
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between px-1 pt-6">
                    <button onClick={() => setStep(1)}
                      className="text-[13px] font-medium text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors flex items-center gap-1">
                      <ArrowLeft className="w-4 h-4" /> Orqaga
                    </button>
                    <button onClick={() => setStep(3)}
                      className="px-5 py-2.5 rounded-xl text-[13px] font-medium text-white transition-opacity hover:opacity-90 active:scale-[0.98] flex items-center gap-1.5"
                      style={{ background: "#E8192C" }}>
                      Yakuniy ko'rik <CheckCircle2 className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: YAKUNIY KO'RIK */}
              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="space-y-6">
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white">Yakuniy ko'rik</h2>
                  <p className="text-[13px] text-slate-500">Kurs ma'lumotlarini tekshirib, nashr qiling.</p>

                  {/* Course info summary */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
                    <h3 className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Kurs haqida</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div><span className="text-[11px] text-slate-400">Nomi</span><p className="text-[13px] font-semibold text-slate-900 dark:text-white truncate">{courseData.title || "—"}</p></div>
                      <div><span className="text-[11px] text-slate-400">Kategoriya</span><p className="text-[13px] font-semibold text-slate-900 dark:text-white">{courseData.category}</p></div>
                      <div><span className="text-[11px] text-slate-400">Daraja</span><p className="text-[13px] font-semibold text-slate-900 dark:text-white">{courseData.level === "beginner" ? "Boshlang'ich" : courseData.level === "intermediate" ? "O'rtacha" : "Murakkab"}</p></div>
                      <div><span className="text-[11px] text-slate-400">Narx</span><p className="text-[13px] font-semibold text-slate-900 dark:text-white">{courseData.price > 0 ? `${courseData.price.toLocaleString()} so'm` : "Bepul"}</p></div>
                    </div>
                    {courseData.description && (
                      <div><span className="text-[11px] text-slate-400">Tavsif</span><p className="text-[13px] text-slate-600 mt-1">{courseData.description.substring(0, 200)}{courseData.description.length > 200 ? "..." : ""}</p></div>
                    )}
                  </div>

                  {/* Modules summary */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">O'quv dasturi</h3>
                      <span className="text-[13px] text-slate-500">{modules.length} ta bo'lim · {totalLessons} ta dars · {totalTests} ta test</span>
                    </div>
                    <div className="space-y-3">
                      {modules.map((m, mi) => (
                        <div key={m.id} className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-lg bg-[#E8192C] text-white flex items-center justify-center text-[10px] font-medium">{mi + 1}</div>
                            <span className="text-[13px] font-semibold text-slate-900 dark:text-white">{m.title}</span>
                          </div>
                          <div className="flex items-center gap-3 text-[12px] text-slate-500 ml-8">
                            <span>{m.lessons?.length || 0} ta dars</span>
                            {(m.tests?.length || 0) > 0 && <span>· {m.tests.length} ta test</span>}
                          </div>
                          {m.lessons?.length > 0 && (
                            <div className="mt-2 ml-8 space-y-1">
                              {m.lessons.map((l: any, li: number) => (
                                <div key={l.id} className="flex items-center gap-2 text-[12px] text-slate-500">
                                  <CheckCircle2 className="w-3 h-3 text-slate-300" />
                                  <span className={l.title ? "text-slate-700 dark:text-slate-300" : "text-slate-400 italic"}>
                                    {l.title || `Dars ${li + 1}`}
                                  </span>
                                  {l.video_url && <Video className="w-3 h-3 text-slate-400" />}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <button onClick={() => setStep(2)}
                      className="text-[13px] font-medium text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors flex items-center gap-1">
                      <ArrowLeft className="w-4 h-4" /> Orqaga
                    </button>
                    <div className="flex items-center gap-3">
                      <button onClick={() => handleSubmit("draft")} disabled={loading}
                        className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 rounded-xl text-[13px] font-medium">
                        Qoralama
                      </button>
                      <button onClick={() => handleSubmit("pending")} disabled={loading}
                        className="px-5 py-2.5 rounded-xl text-[13px] font-medium text-white transition-opacity hover:opacity-90 active:scale-[0.98] flex items-center gap-2"
                        style={{ background: "#E8192C" }}>
                        <Rocket className="w-4 h-4" /> {loading ? "Saqlanmoqda..." : "Nashr qilish"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCreator;
