import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
    Play, Pause, Maximize2, Volume2, Settings, ChevronLeft, ChevronRight,
    CheckCircle2, Lock, Circle, Sparkles, BookOpen, Download, MessageCircle,
    Lightbulb, Trophy, Zap, Clock, Users, Star, Award, FileText,
    Send, MoreVertical, SkipForward, SkipBack, RotateCcw, ExternalLink,
    Bot, ChevronDown, ChevronUp, Copy, ThumbsUp, RefreshCw,
    CheckCircle, AlertCircle, Info, Heart, Share2, Target, User
} from "lucide-react";
import SEO from "@/components/SEO";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { rewriteStorageUrl } from "@/lib/storage";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const MISTRAL_API_KEY = import.meta.env.VITE_MISTRAL_API_KEY || "";

const slugify = (text: string) => {
    if (!text) return '';
    return text.toString().toLowerCase()
        .trim()
        .replace(/[Р“В©'']/g, '')
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '').replace(/-+$/, '');
};

// Achievement Badge Component
const AchievementBadge = ({ icon: Icon, title, description, unlocked }: any) => (
    <motion.div
        className={`relative p-4 rounded-xl border transition-all duration-300 ${unlocked
            ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-50'
            }`}
    >
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${unlocked
            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400'
            : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
            }`}>
            <Icon className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">{title}</h4>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">{description}</p>
        {unlocked && (
            <div className="absolute top-3 right-3">
                <CheckCircle className="w-4 h-4 text-[#E8192C]" />
            </div>
        )}
    </motion.div>
);

// AI Assistant Floating Button
const AIAssistant = ({ isOpen, onToggle, onAskQuestion, isProcessing }: any) => (
    <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="fixed bottom-6 right-6 z-50"
    >
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    className="absolute bottom-16 right-0 w-80 md:w-96 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
                >
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center">
                                <Bot className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">AI Yordamchi</h4>
                                <p className="text-[10px] text-slate-500">Savollaringizga javob oling</p>
                            </div>
                        </div>
                        <button onClick={onToggle} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                        </button>
                    </div>

                    <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
                        <button
                            onClick={() => onAskQuestion('summary')}
                            className="w-full p-3 text-left rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-3"
                        >
                            <FileText className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Dars xulosasini yaratish</span>
                        </button>
                        <button
                            onClick={() => onAskQuestion('explain')}
                            className="w-full p-3 text-left rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-3"
                        >
                            <Lightbulb className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Qiyin tushunchalarni tushuntirish</span>
                        </button>
                        <button
                            onClick={() => onAskQuestion('quiz')}
                            className="w-full p-3 text-left rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-3"
                        >
                            <Zap className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Tez test yaratish</span>
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        <motion.button
            onClick={onToggle}
            className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all ${isProcessing
                ? 'bg-slate-800'
                : 'bg-slate-800'
                } text-white`}
        >
            {isProcessing ? (
                <RefreshCw className="w-6 h-6 animate-spin" />
            ) : (
                <Bot className="w-6 h-6" />
            )}
        </motion.button>
    </motion.div>
);

const CourseLesson = () => {
    const params = useParams();
    const { category, courseSlug, lessonSlug } = params;
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const { toast } = useToast();
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    // State
    const [activeLesson, setActiveLesson] = useState<any>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [showControls, setShowControls] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['module-1']));
    const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
    const [showCelebration, setShowCelebration] = useState(false);
    const [celebrationXP, setCelebrationXP] = useState(0);
    const [activeTab, setActiveTab] = useState('overview');
    const [notes, setNotes] = useState('');
    const [comment, setComment] = useState('');
    const [aiOpen, setAiOpen] = useState(false);
    const [aiResponse, setAiResponse] = useState('');
    const [isAiProcessing, setIsAiProcessing] = useState(false);
    const [showNotesEditor, setShowNotesEditor] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const controlsTimeoutRef = useRef<NodeJS.Timeout>();

    // Fetch Course
    const { data: course, isLoading } = useQuery({
        queryKey: ["course-details-lesson", courseSlug],
        queryFn: async () => {
            const { data: allCourses } = await supabase
                .from("courses")
                .select(`
          *,
          teacher:teacher_id (full_name, avatar_url),
          modules:course_modules(*, lessons:course_lessons(*), tests:course_tests(*))
        `)
                .eq("status", "approved");

            if (allCourses) {
                const foundCourse = (allCourses as any[]).find(c =>
                    slugify(c.title) === courseSlug || slugify(c.title) === courseSlug
                );
                if (foundCourse) return foundCourse;
            }
            throw new Error(t('courses.not_found'));
        }
    });

    // Check Enrollment
    const { data: enrollment } = useQuery({
        queryKey: ["enrollment-lesson", course?.id, user?.id],
        queryFn: async () => {
            if (!user || !course?.id) return null;
            const { data, error } = await supabase
                .from("course_enrollments")
                .select("*")
                .eq("course_id", course.id)
                .eq("user_id", user.id)
                .maybeSingle();
            if (error) throw error;
            return data;
        },
        enabled: !!user && !!course?.id
    });

    const isEnrolled = !!enrollment || course?.teacher_id === user?.id;

    // Get all lessons flat list
    const allLessons = course?.modules?.flatMap((mod: any) =>
        mod.lessons?.map((lesson: any) => ({ ...lesson, module_title: mod.title })) || []
    ) || [];

    const currentLessonIndex = allLessons.findIndex(l =>
        slugify(l.title) === lessonSlug || l.id === lessonSlug
    );

    // Auto-select first lesson
    useEffect(() => {
        if (course && allLessons.length > 0 && !activeLesson) {
            const lesson = currentLessonIndex >= 0
                ? allLessons[currentLessonIndex]
                : allLessons[0];
            setActiveLesson(lesson);

            // Navigate to this lesson's URL
            if (lesson && !lessonSlug) {
                navigate(`/courses/${slugify(course.category || 'general')}/${slugify(course.title)}/lessons/${slugify(lesson.title)}`, { replace: true });
            }
        }
    }, [course, allLessons, currentLessonIndex, activeLesson, lessonSlug, navigate]);

    // Video progress simulation
    useEffect(() => {
        if (isPlaying && duration > 0) {
            const interval = setInterval(() => {
                setCurrentTime(prev => {
                    const next = prev + 1;
                    setProgress((next / duration) * 100);
                    if (next >= duration) {
                        setIsPlaying(false);
                        handleLessonComplete();
                    }
                    return next >= duration ? duration : next;
                });
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [isPlaying, duration]);

    // Hide controls after inactivity
    useEffect(() => {
        if (isPlaying) {
            setShowControls(true);
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
            controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
        }
    }, [isPlaying]);

    const handleMouseMove = () => {
        if (isPlaying) {
            setShowControls(true);
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
            controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleLessonComplete = () => {
        if (activeLesson && !completedLessons.has(activeLesson.id)) {
            const xp = 50;
            setCelebrationXP(xp);
            setShowCelebration(true);
            setCompletedLessons(prev => new Set([...prev, activeLesson.id]));

            setTimeout(() => setShowCelebration(false), 4000);

            // Auto-advance to next lesson
            setTimeout(() => {
                if (currentLessonIndex < allLessons.length - 1) {
                    const nextLesson = allLessons[currentLessonIndex + 1];
                    setActiveLesson(nextLesson);
                    navigate(`/courses/${slugify(course?.category || 'general')}/${slugify(course?.title || '')}/lessons/${slugify(nextLesson.title)}`);
                    setProgress(0);
                    setCurrentTime(0);
                }
            }, 4500);
        }
    };

    const handleAskAI = async (type: string) => {
        setIsAiProcessing(true);
        setAiOpen(true);

        let prompt = '';
        const lessonTitle = activeLesson?.title || '';
        const lessonContent = activeLesson?.content || '';

        switch (type) {
            case 'summary':
                prompt = `Ushbu dars mavzusi: "${lessonTitle}". Quyidagi ma'lumotlar asosida qisqa va tushunarli xulosa yozing (3-4 ta asosiy fikr): ${lessonContent}`;
                break;
            case 'explain':
                prompt = `Ushbu dars mavzusi: "${lessonTitle}". Eng qiyin tushunchalarni oddiy misollar bilan tushuntirib bering. O'quvchi darajasiga moslab izohlang.`;
                break;
            case 'quiz':
                prompt = `Ushbu dars mavzusi: "${lessonTitle}". Ushbu mavzu bo'yicha 3 ta qisqa test savoli tuzing (har bir savol 4 ta variant bilan, to'g'ri javobni ko'rsating).`;
                break;
        }

        try {
            const response = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: "mistral-tiny",
                    messages: [
                        { role: "system", content: "Siz Eduly AI o'qituvchi yordamchisisiz. O'quvchilarga murakkab mavzularni sodda va tushunarli qilib tushuntiring. Faqat o'zbek tilida javob bering." },
                        { role: "user", content: prompt }
                    ]
                })
            });

            const data = await response.json();
            if (data.choices?.[0]) {
                setAiResponse(data.choices[0].message.content);
            }
        } catch (err) {
            setAiResponse("AI yordamchi bilan bog'lanishda xatolik yuz berdi.");
        } finally {
            setIsAiProcessing(false);
        }
    };

    const toggleSection = (sectionId: string) => {
        setExpandedSections(prev => {
            const next = new Set(prev);
            if (next.has(sectionId)) {
                next.delete(sectionId);
            } else {
                next.add(sectionId);
            }
            return next;
        });
    };

    const getLessonStatus = (lesson: any) => {
        if (completedLessons.has(lesson.id)) return 'completed';
        if (activeLesson?.id === lesson.id) return 'current';
        return 'locked';
    };

    // Calculate course progress
    const courseProgress = allLessons.length > 0
        ? Math.round((completedLessons.size / allLessons.length) * 100)
        : 0;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 border-4 border-slate-200 border-t-slate-400 rounded-full animate-spin mx-auto" />
                    <p className="text-slate-500 font-medium">Dars yuklanmoqda...</p>
                </div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <BookOpen className="w-16 h-16 text-slate-300 mx-auto" />
                    <p className="text-slate-500 font-medium">Kurs topilmadi</p>
                    <Button onClick={() => navigate('/courses')} variant="outline">
                        Kurslarga qaytish
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <SEO
                title={`${activeLesson?.title || course.title} - ${course.title}`}
                description={course.description?.substring(0, 160) || "EduContest premium darslari"}
            />

            {/* Celebration Animation */}
            <AnimatePresence>
                {showCelebration && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50"
                    >
                        <motion.div
                            initial={{ y: 50 }}
                            animate={{ y: 0 }}
                            className="bg-white dark:bg-slate-900 rounded-2xl p-8 md:p-12 text-center max-w-md mx-4"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: "spring" }}
                                className="w-24 h-24 rounded-full bg-[#E8192C] flex items-center justify-center mx-auto mb-6"
                            >
                                <Trophy className="w-12 h-12 text-white" />
                            </motion.div>
                            <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 dark:text-white mb-2">
                                Tabriklaymiz!
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 mb-6">
                                Darsni muvaffaqiyatli yakunladingiz
                            </p>
                            <div className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800">
                                <Zap className="w-5 h-5 text-[#E8192C]" />
                                <span className="text-lg font-semibold text-[#E8192C]">
                                    +{celebrationXP} XP
                                </span>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
                    {/* Breadcrumbs */}
                    <div className="flex items-center gap-2 md:gap-4">
                        <button
                            onClick={() => navigate('/courses')}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4 text-slate-500" />
                        </button>
                        <div className="hidden md:flex items-center gap-2 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                            <Link to="/courses" className="hover:text-[#E8192C] transition-colors">Kurslar</Link>
                            <ChevronRight className="w-3 h-3" />
                            <span className="text-slate-900 dark:text-white">{course.category}</span>
                            <ChevronRight className="w-3 h-3" />
                            <span className="max-w-[200px] truncate">{activeLesson?.title}</span>
                        </div>
                    </div>

                    {/* Progress */}
                    <div className="flex items-center gap-3">
                        <div className="hidden md:flex items-center gap-2">
                            <div className="w-32">
                                <div className="bg-slate-100 dark:bg-slate-800 h-1 rounded-full">
                                    <div className="bg-[#E8192C] h-1 rounded-full" style={{ width: `${courseProgress}%` }} />
                                </div>
                            </div>
                            <span className="text-xs font-semibold text-slate-500">{courseProgress}%</span>
                        </div>
                        <Badge variant="outline" className="hidden sm:flex items-center gap-1 bg-slate-100 text-slate-600">
                            <Zap className="w-3 h-3 text-slate-400" />
                            <span className="text-[10px] font-semibold">12 kun ketma-ket</span>
                        </Badge>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-[1600px] mx-auto px-4 md:px-6 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                    {/* Left: Video Player + Content (70%) */}
                    <div className="lg:col-span-8 xl:col-span-9 space-y-6">
                        {/* Video Player */}
                        <div
                            className="relative aspect-video bg-slate-950 rounded-2xl overflow-hidden group"
                            onMouseMove={handleMouseMove}
                            onMouseLeave={() => isPlaying && setShowControls(false)}
                        >
                            {/* Video Placeholder */}
                            {isEnrolled ? (
                                <>
                                    {/* Simulated Video Content */}
                                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                                        <div className="text-center space-y-4">
                                            <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto border border-white/10">
                                                <Play className="w-8 h-8 text-slate-400" />
                                            </div>
                                            <p className="text-slate-500 text-sm font-medium">
                                                {activeLesson?.title || 'Dars yuklanmoqda...'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Video Progress Indicator */}
                                    <div className="absolute top-4 left-4 right-4 h-1 bg-slate-800/50 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-[#E8192C]"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            transition={{ duration: 0.3 }}
                                        />
                                    </div>

                                    {/* Controls Overlay */}
                                    <AnimatePresence>
                                        {showControls && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="absolute bottom-0 left-0 right-0 p-6 bg-black/60"
                                            >
                                                <div className="flex items-center justify-between gap-4">
                                                    {/* Left Controls */}
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={() => {
                                                                if (currentLessonIndex > 0) {
                                                                    const prev = allLessons[currentLessonIndex - 1];
                                                                    setActiveLesson(prev);
                                                                    navigate(`/courses/${slugify(course.category || 'general')}/${slugify(course.title || '')}/lessons/${slugify(prev.title)}`);
                                                                    setProgress(0);
                                                                    setCurrentTime(0);
                                                                }
                                                            }}
                                                            disabled={currentLessonIndex === 0}
                                                            className="p-2 hover:bg-white/10 rounded-xl transition-colors disabled:opacity-30"
                                                        >
                                                            <SkipBack className="w-5 h-5 text-white" />
                                                        </button>

                                                        <button
                                                            onClick={() => setIsPlaying(!isPlaying)}
                                                            className="w-14 h-14 rounded-2xl bg-white text-slate-900 flex items-center justify-center"
                                                        >
                                                            {isPlaying ? (
                                                                <Pause className="w-6 h-6" />
                                                            ) : (
                                                                <Play className="w-6 h-6 ml-1" />
                                                            )}
                                                        </button>

                                                        <button
                                                            onClick={() => {
                                                                if (currentLessonIndex < allLessons.length - 1) {
                                                                    const next = allLessons[currentLessonIndex + 1];
                                                                    setActiveLesson(next);
                                                                    navigate(`/courses/${slugify(course.category || 'general')}/${slugify(course.title || '')}/lessons/${slugify(next.title)}`);
                                                                    setProgress(0);
                                                                    setCurrentTime(0);
                                                                }
                                                            }}
                                                            disabled={currentLessonIndex === allLessons.length - 1}
                                                            className="p-2 hover:bg-white/10 rounded-xl transition-colors disabled:opacity-30"
                                                        >
                                                            <SkipForward className="w-5 h-5 text-white" />
                                                        </button>

                                                        <div className="flex items-center gap-2 ml-2">
                                                            <Volume2 className="w-5 h-5 text-white" />
                                                            <div className="w-20 h-1 bg-white/20 rounded-full overflow-hidden">
                                                                <div className="w-3/4 h-full bg-white rounded-full" />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Time Display */}
                                                    <div className="flex items-center gap-2 text-white text-xs font-mono">
                                                        <span>{formatTime(currentTime)}</span>
                                                        <span className="text-white/50">/</span>
                                                        <span className="text-white/70">{formatTime(duration || activeLesson?.duration_seconds || 0)}</span>
                                                    </div>

                                                    {/* Right Controls */}
                                                    <div className="flex items-center gap-2">
                                                        {/* Speed Control */}
                                                        <div className="relative">
                                                            <button
                                                                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                                                                className="px-3 py-2 hover:bg-white/10 rounded-xl transition-colors flex items-center gap-1 text-white text-xs font-semibold"
                                                            >
                                                                {playbackSpeed}x
                                                                <ChevronDown className="w-3 h-3" />
                                                            </button>
                                                            {showSpeedMenu && (
                                                                <div className="absolute bottom-full right-0 mb-2 bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
                                                                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                                                                        <button
                                                                            key={speed}
                                                                            onClick={() => {
                                                                                setPlaybackSpeed(speed);
                                                                                setShowSpeedMenu(false);
                                                                            }}
                                                                            className={`w-full px-4 py-2 text-left text-sm hover:bg-white/10 transition-colors ${playbackSpeed === speed ? 'text-[#E8192C] font-semibold' : 'text-white'
                                                                                }`}
                                                                        >
                                                                            {speed}x
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <button
                                                            onClick={() => setShowNotesEditor(!showNotesEditor)}
                                                            className={`p-2 rounded-xl transition-colors ${showNotesEditor ? 'bg-[#E8192C] text-white' : 'hover:bg-white/10 text-white'
                                                                }`}
                                                        >
                                                            <FileText className="w-5 h-5" />
                                                        </button>

                                                        <button className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white">
                                                            <Maximize2 className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </>
                            ) : (
                                /* Locked State */
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-slate-900">
                                    <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mb-6 border border-white/5">
                                        <Lock className="w-8 h-8 text-slate-500" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-white mb-2">Ushbu dars pullik</h3>
                                    <p className="text-slate-400 text-sm mb-6 max-w-md">
                                        Kursga obuna bo'lib, barcha darslarga cheksiz kirish huquqiga ega bo'ling
                                    </p>
                                    <Button
                                        onClick={() => navigate(`/courses/${slugify(course.category || 'general')}/${slugify(course.title)}`)}
                                        className="rounded-xl px-8 py-6 text-sm font-semibold text-white"
                                        style={{ background: "#E8192C" }}
                                    >
                                        Kursga obuna bo'lish
                                        <ChevronRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Lesson Info */}
                        <div className="space-y-6">
                            {/* Title & Actions */}
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                <div className="space-y-3 flex-1">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-800">
                                            {course.category}
                                        </Badge>
                                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                                            <Star className="w-3 h-3 text-slate-300" />
                                            <span className="text-xs font-semibold text-slate-900 dark:text-white">
                                                {Number(course.average_rating || 0).toFixed(1)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 text-slate-500 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                                            <Users className="w-3 h-3" />
                                            <span className="text-xs font-semibold">
                                                {course.student_count || 0} o'quvchi
                                            </span>
                                        </div>
                                    </div>
                                    <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white leading-tight">
                                        {activeLesson?.title || course.title}
                                    </h1>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                                        <Heart className="w-4 h-4 text-slate-400" />
                                    </button>
                                    <button className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                                        <Share2 className="w-4 h-4 text-slate-400 hover:text-[#E8192C] transition-colors" />
                                    </button>
                                </div>
                            </div>

                            {/* Tabs */}
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                    <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
                                        <BookOpen className="w-4 h-4 mr-2" />
                                        Dars haqida
                                    </TabsTrigger>
                                    <TabsTrigger value="resources" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
                                        <Download className="w-4 h-4 mr-2" />
                                        Materiallar
                                    </TabsTrigger>
                                    <TabsTrigger value="notes" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
                                        <FileText className="w-4 h-4 mr-2" />
                                        Konspekt
                                    </TabsTrigger>
                                    <TabsTrigger value="comments" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
                                        <MessageCircle className="w-4 h-4 mr-2" />
                                        Fikrlar
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="overview" className="mt-6 space-y-6">
                                    {/* Learning Objectives */}
                                    <Card className="border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                                        <CardContent className="p-6 space-y-4">
                                            <div className="flex items-center gap-2 mb-4">
                                                <Target className="w-5 h-5 text-[#E8192C]" />
                                                <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                                                    Ushbu darsda nimalarni o'rganasiz
                                                </h3>
                                            </div>
                                            <ul className="space-y-3">
                                                {[
                                                    "Mavzuning asosiy tushunchalari va terminlari",
                                                    "Amaliy qo'llash usullari va misollar",
                                                    "Eng ko'p uchraydigan xatolar va ularni oldini olish",
                                                    "Test savollari uchun muhim maslahatlar"
                                                ].map((item, i) => (
                                                    <li key={i} className="flex items-start gap-3">
                                                        <CheckCircle className="w-5 h-5 text-[#E8192C] flex-shrink-0 mt-0.5" />
                                                        <span className="text-slate-600 dark:text-slate-300 text-sm">{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </CardContent>
                                    </Card>

                                    {/* Description */}
                                    <div className="prose prose-slate dark:prose-invert max-w-none">
                                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                                            Dars tavsifi
                                        </h3>
                                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                            {activeLesson?.content || course.description || "Ushbu darsda siz mavzuning asosiy tushunchalari bilan tanishasiz va amaliy ko'nikmalarga ega bo'lasiz."}
                                        </p>
                                    </div>

                                    {/* Instructor */}
                                    <Card className="border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                                        <CardContent className="p-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                                    {course.teacher?.avatar_url ? (
                                                        <img
                                                            src={rewriteStorageUrl(course.teacher.avatar_url)}
                                                            alt={course.teacher.full_name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <User className="w-6 h-6 text-slate-400" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="text-base font-semibold text-slate-900 dark:text-white">
                                                        {course.teacher?.full_name}
                                                    </h4>
                                                    <p className="text-sm text-slate-500">Kurs muallifi</p>
                                                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                                                        <span className="flex items-center gap-1">
                                                            <Star className="w-3 h-3 text-slate-300" />
                                                            {Number(course.average_rating || 0).toFixed(1)}
                                                        </span>
                                                        <span>РІР‚Сћ</span>
                                                        <span>{course.student_count || 0} o'quvchi</span>
                                                    </div>
                                                </div>
                                                {isEnrolled && user?.id !== course.teacher_id && (
                                                    <Button variant="outline" size="sm" className="rounded-xl">
                                                        <MessageCircle className="w-4 h-4 mr-2" />
                                                        Xabar
                                                    </Button>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="resources" className="mt-6">
                                    <Card className="border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                                        <CardContent className="p-6 space-y-4">
                                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
                                                Yuklab olish mumkin bo'lgan materiallar
                                            </h3>
                                            {[
                                                { name: "Dars konspekti (PDF)", size: "2.4 MB" },
                                                { name: "Amaliy mashqlar", size: "1.8 MB" },
                                                { name: "Qo'shimcha materiallar", size: "5.2 MB" }
                                            ].map((resource, i) => (
                                                <button
                                                    key={i}
                                                    className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                            <FileText className="w-5 h-5 text-slate-400" />
                                                        </div>
                                                        <div className="text-left">
                                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                                {resource.name}
                                                            </p>
                                                            <p className="text-xs text-slate-500">{resource.size}</p>
                                                        </div>
                                                    </div>
                                                    <Download className="w-5 h-5 text-slate-400 group-hover:text-[#E8192C] transition-colors" />
                                                </button>
                                            ))}
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="notes" className="mt-6">
                                    <Card className="border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                                                    Shaxsiy konspekt
                                                </h3>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setShowNotesEditor(!showNotesEditor)}
                                                    className="rounded-lg"
                                                >
                                                    {showNotesEditor ? 'Yopish' : 'Tahrirlash'}
                                                </Button>
                                            </div>
                                            {showNotesEditor ? (
                                                <Textarea
                                                    value={notes}
                                                    onChange={(e) => setNotes(e.target.value)}
                                                    placeholder="Dars davomida muhim fikrlarni yozib boring..."
                                                    className="min-h-[300px] rounded-xl border-slate-200 dark:border-slate-700 resize-none"
                                                />
                                            ) : (
                                                <div className="min-h-[300px] p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                                                    {notes ? (
                                                        <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                                                            {notes}
                                                        </p>
                                                    ) : (
                                                        <div className="text-center text-slate-400 py-12">
                                                            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                                            <p className="text-sm">Hali konspekt yozilmagan</p>
                                                            <p className="text-xs mt-1">"Tahrirlash" tugmasini bosing</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="comments" className="mt-6">
                                    <Card className="border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                                        <CardContent className="p-6 space-y-6">
                                            {isEnrolled && (
                                                <div className="flex gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex-shrink-0" />
                                                    <div className="flex-1">
                                                        <Textarea
                                                            value={comment}
                                                            onChange={(e) => setComment(e.target.value)}
                                                            placeholder="Fikringizni qoldiring..."
                                                            className="min-h-[100px] rounded-xl border-slate-200 dark:border-slate-700 resize-none"
                                                        />
                                                        <div className="flex justify-end mt-3">
                                                            <Button
                                                                onClick={() => {
                                                                    if (comment.trim()) {
                                                                        toast({ title: "Fikr qoldirildi!", description: "Rahmat!" });
                                                                        setComment("");
                                                                    }
                                                                }}
                                                                className="rounded-xl"
                                                                disabled={!comment.trim()}
                                                            >
                                                                <Send className="w-4 h-4 mr-2" />
                                                                Yuborish
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Sample Comments */}
                                            <div className="space-y-4">
                                                {[1, 2, 3].map((_, i) => (
                                                    <div key={i} className="flex gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex-shrink-0" />
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                                                    O'quvchi {i + 1}
                                                                </span>
                                                                <span className="text-xs text-slate-400">2 kun oldin</span>
                                                            </div>
                                                            <p className="text-sm text-slate-600 dark:text-slate-300">
                                                                Juda foydali dars bo'ldi! Tushunarli va qisqa qilib tushuntirib berildi.
                                                                Tavsiya qilaman СЂСџвЂРЊ
                                                            </p>
                                                            <div className="flex items-center gap-4 mt-3">
                                                                <button className="flex items-center gap-1 text-xs text-slate-400 hover:text-[#E8192C] transition-colors">
                                                                    <ThumbsUp className="w-3 h-3" />
                                                                    {Math.floor(Math.random() * 20) + 1}
                                                                </button>
                                                                <button className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
                                                                    Javob
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>

                    {/* Right: Lesson Navigator Sidebar (30%) */}
                    <div className="lg:col-span-4 xl:col-span-3">
                        <div className="sticky top-24 space-y-6">
                            {/* Course Progress Card */}
                            <Card className="border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                                <CardContent className="p-5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                                                Kurs progress
                                            </p>
                                            <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                                                {courseProgress}%
                                            </p>
                                        </div>
                                        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                            <Award className="w-8 h-8 text-[#E8192C]" />
                                        </div>
                                    </div>
                                    <div className="bg-slate-100 dark:bg-slate-800 rounded-full h-[3px]">
                                        <div className="bg-[#E8192C] rounded-full h-[3px]" style={{ width: `${courseProgress}%` }} />
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-slate-500">
                                            {completedLessons.size} / {allLessons.length} dars
                                        </span>
                                        <span className="text-[#E8192C] font-semibold">
                                            {allLessons.length - completedLessons.size} ta qoldi
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Lesson List */}
                            <Card className="border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                                <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                                        Darslar ro'yxati
                                    </h3>
                                </div>
                                <div className="max-h-[600px] overflow-y-auto">
                                    {course.modules?.sort((a: any, b: any) => a.sort_order - b.sort_order).map((mod: any, modIdx: number) => {
                                        const sectionId = `module-${mod.id || modIdx}`;
                                        const isExpanded = expandedSections.has(sectionId);
                                        const moduleLessons = mod.lessons?.sort((a: any, b: any) => a.sort_order - b.sort_order) || [];
                                        const completedInModule = moduleLessons.filter((l: any) => completedLessons.has(l.id)).length;

                                        return (
                                            <div key={mod.id || modIdx}>
                                                <button
                                                    onClick={() => toggleSection(sectionId)}
                                                    className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-semibold text-slate-600 dark:text-slate-400">
                                                            {modIdx + 1}
                                                        </div>
                                                        <div className="text-left">
                                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                                {mod.title}
                                                            </p>
                                                            <p className="text-[10px] text-slate-500">
                                                                {completedInModule}/{moduleLessons.length} dars
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {isExpanded ? (
                                                        <ChevronUp className="w-4 h-4 text-slate-400" />
                                                    ) : (
                                                        <ChevronDown className="w-4 h-4 text-slate-400" />
                                                    )}
                                                </button>

                                                <AnimatePresence>
                                                    {isExpanded && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: "auto", opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="px-4 pb-4 space-y-1 pl-14">
                                                                {moduleLessons.map((lesson: any) => {
                                                                    const status = getLessonStatus(lesson);
                                                                    const isActive = activeLesson?.id === lesson.id;

                                                                    return (
                                                                        <button
                                                                            key={lesson.id}
                                                                            onClick={() => {
                                                                                if (isEnrolled || status === 'completed') {
                                                                                    setActiveLesson(lesson);
                                                                                    navigate(`/courses/${slugify(course.category || 'general')}/${slugify(course.title || '')}/lessons/${slugify(lesson.title)}`);
                                                                                    setProgress(0);
                                                                                    setCurrentTime(0);
                                                                                }
                                                                            }}
                                                                            disabled={!isEnrolled && status !== 'completed'}
                                                                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${isActive
                                                                                ? 'bg-slate-100 text-[#E8192C]'
                                                                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                                                                                } ${!isEnrolled && status !== 'completed' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                        >
                                                                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${status === 'completed'
                                                                                ? 'bg-[#E8192C] text-white'
                                                                                : status === 'current'
                                                                                    ? 'bg-[#E8192C] text-white'
                                                                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                                                                                }`}>
                                                                                {status === 'completed' ? (
                                                                                    <CheckCircle className="w-3.5 h-3.5" />
                                                                                ) : status === 'current' ? (
                                                                                    <Play className="w-3 h-3 fill-current" />
                                                                                ) : (
                                                                                    <Circle className="w-3.5 h-3.5" />
                                                                                )}
                                                                            </div>
                                                                            <span className="text-sm font-medium truncate text-left flex-1">
                                                                                {lesson.title}
                                                                            </span>
                                                                            <span className="text-[10px] text-slate-400 flex-shrink-0">
                                                                                {lesson.duration || "00:00"}
                                                                            </span>
                                                                        </button>
                                                                    );
                                                                })}

                                                                {/* Module Tests */}
                                                                {mod.tests?.map((test: any) => (
                                                                    <button
                                                                        key={test.id}
                                                                        onClick={() => isEnrolled && navigate(`/courses/${slugify(course.category || 'general')}/${slugify(course.title || '')}/test/${test.id}`)}
                                                                        disabled={!isEnrolled}
                                                                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-[#E8192C] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                                    >
                                                                        <div className="w-6 h-6 rounded-lg bg-[#E8192C] text-white flex items-center justify-center flex-shrink-0">
                                                                            <FileText className="w-3.5 h-3.5" />
                                                                        </div>
                                                                        <span className="text-sm font-medium flex-1 text-left">
                                                                            Test: {test.title}
                                                                        </span>
                                                                        <Badge className="bg-[#E8192C] text-white text-[10px]">
                                                                            Test
                                                                        </Badge>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        );
                                    })}
                                </div>
                            </Card>

                            {/* Achievements Preview */}
                            <Card className="border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                                <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                                        Yutuqlar
                                    </h3>
                                </div>
                                <div className="p-4 grid grid-cols-2 gap-3">
                                    <AchievementBadge
                                        icon={Zap}
                                        title="Tezkor"
                                        description="10 kun ketma-ket"
                                        unlocked={true}
                                    />
                                    <AchievementBadge
                                        icon={Trophy}
                                        title="Chempion"
                                        description="5 ta testni a'lo baholadi"
                                        unlocked={completedLessons.size >= 5}
                                    />
                                    <AchievementBadge
                                        icon={BookOpen}
                                        title="Kitobxon"
                                        description="Barcha materiallarni yuklab oldi"
                                        unlocked={false}
                                    />
                                    <AchievementBadge
                                        icon={Star}
                                        title="Yulduz"
                                        description="Barcha darslarni yakunladi"
                                        unlocked={courseProgress === 100}
                                    />
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>

            {/* AI Assistant */}
            <AIAssistant
                isOpen={aiOpen}
                onToggle={() => setAiOpen(!aiOpen)}
                onAskQuestion={handleAskAI}
                isProcessing={isAiProcessing}
            />

            {/* AI Response Modal */}
            <Dialog open={aiOpen && !!aiResponse} onOpenChange={(open) => { if (!open) { setAiOpen(false); setAiResponse(''); } }}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center">
                                <Bot className="w-4 h-4 text-white" />
                            </div>
                            AI Yordamchi
                        </DialogTitle>
                    </DialogHeader>
                    <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <div className="prose prose-slate dark:prose-invert max-w-none">
                            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                                {aiResponse}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                        <Button variant="outline" size="sm" className="rounded-lg">
                            <Copy className="w-4 h-4 mr-2" />
                            Nusxalash
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-lg">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Qayta generatsiya
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CourseLesson;
