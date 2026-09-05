import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, type Variants } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useEduCoin } from "@/hooks/useEduCoin";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";
import { Skeleton } from "@/components/ui/skeleton";
import { rewriteStorageUrl } from "@/lib/storage";
import { FeedbackModal } from "@/components/FeedbackModal";
import {
  BookOpen, Flame, Target, Zap, Sparkles, Brain, Award, FileText,
  TrendingUp, ArrowRight, Trophy, Crown, Gem, Send, Users,
  MessageSquare, Clock, BarChart3, ChevronRight, Rocket, Coins,
  GraduationCap, CheckCircle2, ArrowUpRight, Lightbulb, Star, Calendar,
  Building2, Mic, PenTool, Calculator, TreePine, LogIn, Activity
} from "lucide-react";
import { toast } from "sonner";
import { GiftIcon } from "@solar-icons/react/bold-duotone/gift";
import { CopyIcon } from "@solar-icons/react/bold-duotone/copy";
import { AltArrowRightIcon } from "@solar-icons/react/bold-duotone/alt-arrow-right";
import { UsersGroupTwoRoundedIcon } from "@solar-icons/react/bold-duotone/users-group-two-rounded";
import { StarIcon } from "@solar-icons/react/bold-duotone/star";
import { CpuIcon as BrainIcon } from "@solar-icons/react/bold-duotone/cpu";
import { BookBookmarkIcon } from "@solar-icons/react/bold-duotone/book-bookmark";
import { MicrophoneIcon } from "@solar-icons/react/bold-duotone/microphone";
import { StarsIcon } from "@solar-icons/react/bold-duotone/stars";
import { Pen2Icon } from "@solar-icons/react/bold-duotone/pen-2";
import { CameraMinimalisticIcon } from "@solar-icons/react/bold-duotone/camera-minimalistic";
import { ClockCircleIcon } from "@solar-icons/react/bold-duotone/clock-circle";
import { CupFirstIcon } from "@solar-icons/react/bold-duotone/cup-first";
import { ChartSquareIcon } from "@solar-icons/react/bold-duotone/chart-square";
import { FlameIcon } from "@solar-icons/react/bold-duotone/flame";
import { BoltIcon } from "@solar-icons/react/bold-duotone/bolt";
import { CrownIcon } from "@solar-icons/react/bold-duotone/crown";
import { DollarMinimalisticIcon } from "@solar-icons/react/bold-duotone/dollar-minimalistic";
import { CheckCircleIcon } from "@solar-icons/react/bold-duotone/check-circle";
import { TargetIcon } from "@solar-icons/react/bold-duotone/target";
import { CalendarIcon } from "@solar-icons/react/bold-duotone/calendar";
import { NotebookIcon } from "@solar-icons/react/bold-duotone/notebook";
import { UserCircleIcon } from "@solar-icons/react/bold-duotone/user-circle";
import { DiplomaIcon } from "@solar-icons/react/bold-duotone/diploma";
import { Login2Icon } from "@solar-icons/react/bold-duotone/login-2";
import { RocketIcon } from "@solar-icons/react/bold-duotone/rocket";
import { ArrowRightUpIcon } from "@solar-icons/react/bold-duotone/arrow-right-up";
import { GamepadIcon } from "@solar-icons/react/bold-duotone/gamepad";
import { BuildingsIcon } from "@solar-icons/react/bold-duotone/buildings";
import { PlayCircleIcon } from "@solar-icons/react/bold-duotone/play-circle";
import { SquareAcademicCapIcon } from "@solar-icons/react/bold-duotone/square-academic-cap";
import { MapPointIcon } from "@solar-icons/react/bold-duotone/map-point";
import { MagnifierIcon } from "@solar-icons/react/bold-duotone/magnifier";
import { CloseSquareIcon } from "@solar-icons/react/bold-duotone/close-square";
import { GalleryAddIcon } from "@solar-icons/react/bold-duotone/gallery-add";
import { AddCircleIcon } from "@solar-icons/react/bold-duotone/add-circle";
import universitiesData from "./universitetlar.json";
import { MyTestProgressChart } from "@/components/dashboard/MyTestProgressChart";

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const useCountdown = (targetDate: string | null | undefined) => {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    if (!targetDate) return;
    const target = new Date(targetDate).getTime();
    if (isNaN(target)) return;

    const calc = () => {
      const now = Date.now();
      const diff = target - now;
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };

    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
};

const DashPromoBanner = () => {
  const navigate = useNavigate();
  const [dashPromoSecondsLeft, setDashPromoSecondsLeft] = useState(14 * 60 + 52);

  useEffect(() => {
    const timer = setInterval(() => {
      setDashPromoSecondsLeft((prev) => (prev <= 1 ? 14 * 60 + 59 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const dashPromoMinutes = String(Math.floor(dashPromoSecondsLeft / 60)).padStart(2, '0');
  const dashPromoSeconds = String(dashPromoSecondsLeft % 60).padStart(2, '0');

  return (
    <div
      onClick={() => navigate("/settings/obuna")}
      className="md:hidden w-full p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-amber-500/20 border border-amber-400/50 dark:border-amber-500/30 flex items-center justify-between gap-3 shadow-2xs cursor-pointer active:scale-98 transition-transform"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center shrink-0 shadow-2xs">
          <CrownIcon className="w-5 h-5 text-slate-950" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-xs font-black text-amber-800 dark:text-amber-300">⚡ 20% Chegirma</span>
            <StarsIcon className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
          </div>
          <p className="text-[10.5px] text-slate-600 dark:text-slate-300 font-bold truncate">EduPremium ga a'zo bo'ling</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 px-2.5 py-1 rounded-full text-xs font-mono font-black shrink-0 shadow-2xs">
        <ClockCircleIcon className="w-3.5 h-3.5 text-slate-950 animate-spin" style={{ animationDuration: '4s' }} />
        <span>{dashPromoMinutes}:{dashPromoSeconds}</span>
      </div>
    </div>
  );
};

const TargetExamCountdownBadge = ({ targetDate, desktop = false }: { targetDate?: string | null; desktop?: boolean }) => {
  const countdown = useCountdown(targetDate);
  if (!targetDate || !countdown) return null;

  if (desktop) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#E8192C] to-rose-600 text-white">
        <CalendarIcon size={12} className="text-white" />
        <span className="text-[10px] font-black tabular-nums">
          Imtihonga {countdown.days} kun, {countdown.hours} soat, {countdown.minutes} daqiqa
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-[#E8192C] to-rose-600 text-white shadow-sm">
      <CalendarIcon size={14} className="text-white" />
      <span className="text-[10px] font-black tabular-nums">{countdown.days}k {countdown.hours}so {countdown.minutes}d</span>
    </div>
  );
};

const Dashboard = () => {
  const { profile, user } = useAuth();
  const { streak, balance: eduBalance } = useEduCoin();
  const navigate = useNavigate();

  const firstName = profile?.full_name?.split(" ")[0] || "O'quvchi";

  // Dream University Target State
  const [dreamUni, setDreamUni] = useState<any>(() => {
    try {
      const saved = localStorage.getItem("educontest_dream_university");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isDreamModalOpen, setIsDreamModalOpen] = useState(false);
  const [dreamSearch, setDreamSearch] = useState("");
  const [targetScoreInput, setTargetScoreInput] = useState("IELTS 7.5+ / SAT 1450+");

  // Custom University Form State
  const [modalTab, setModalTab] = useState<"list" | "custom">("list");
  const [customName, setCustomName] = useState("");
  const [customLogoUrl, setCustomLogoUrl] = useState("");
  const [customRank, setCustomRank] = useState("");
  const [customLocation, setCustomLocation] = useState("");
  const [customGrant, setCustomGrant] = useState("");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Rasm hajmi 2MB dan oshmasligi kerak!");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomLogoUrl(reader.result as string);
        toast.success("Rasm muvaffaqiyatli yuklandi!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveCustomUni = async () => {
    if (!customName.trim()) {
      toast.error("Universitet nomini kiriting!");
      return;
    }

    const payload = {
      slug: "custom-" + Date.now(),
      name: customName.trim(),
      logo_url: customLogoUrl || "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=150&auto=format&fit=crop&q=60",
      qs_rank: customRank || "N/A",
      manzil: customLocation || "Xalqaro",
      grant_type: customGrant || "To'liq Grant",
      target_score: targetScoreInput || "IELTS 7.5+",
      updated_at: new Date().toISOString()
    };

    setDreamUni(payload);
    localStorage.setItem("educontest_dream_university", JSON.stringify(payload));
    setIsDreamModalOpen(false);
    toast.success(`${customName} maqsadingiz sifatida saqlandi! 🎯`);

    if (profile?.user_id) {
      try {
        await (supabase as any)
          .from("profiles")
          .update({ dream_university: payload })
          .eq("user_id", profile.user_id);
      } catch (e) {
        console.error("Dream uni sync error:", e);
      }
    }
  };

  useEffect(() => {
    if ((profile as any)?.dream_university) {
      setDreamUni((profile as any).dream_university);
      localStorage.setItem("educontest_dream_university", JSON.stringify((profile as any).dream_university));
    }
  }, [profile]);

  const handleSelectDreamUni = async (uni: any) => {
    const payload = {
      slug: uni.slug || uni.name.toLowerCase().replace(/\s+/g, "-"),
      name: uni.name,
      logo_url: uni.logo_url,
      qs_rank: uni.qs_rank,
      manzil: uni.manzil,
      grant_type: uni.grant_type,
      target_score: targetScoreInput || "IELTS 7.5+",
      updated_at: new Date().toISOString()
    };

    setDreamUni(payload);
    localStorage.setItem("educontest_dream_university", JSON.stringify(payload));
    setIsDreamModalOpen(false);
    toast.success(`${uni.name} orzuyingizdagi OTM maqsadi sifatida saqlandi! 🎯`);

    if (profile?.user_id) {
      try {
        await (supabase as any)
          .from("profiles")
          .update({ dream_university: payload })
          .eq("user_id", profile.user_id);
      } catch (e) {
        console.error("Dream uni sync error:", e);
      }
    }
  };

  // Query analytics and session history
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["dashboard-analytics-fw", profile?.user_id],
    queryFn: async () => {
      if (!profile?.user_id) return null;

      try {
        const { data: sessions } = await supabase
          .from("test_sessions")
          .select(`id, created_at, finished_at, score, total_questions, correct_answers, wrong_answers, test_folders ( name, subject )`)
          .eq("user_id", profile.user_id)
          .not("finished_at", "is", null)
          .order("created_at", { ascending: false });

        const sessionList = (sessions as any[]) || [];
        const totalSessions = sessionList.length;

        let totalQ = 0;
        let totalC = 0;

        sessionList.forEach((s) => {
          totalQ += s.total_questions || 0;
          totalC += s.correct_answers || 0;
        });

        const overallAccuracy = totalQ > 0 ? Math.round((totalC / totalQ) * 100) : 0;

        // Subject breakdown
        const subjectsMap: Record<string, { correct: number; total: number }> = {};
        sessionList.forEach((s) => {
          const subj = s.test_folders?.subject || "Boshqa";
          if (!subjectsMap[subj]) subjectsMap[subj] = { correct: 0, total: 0 };
          subjectsMap[subj].total += s.total_questions || 0;
          subjectsMap[subj].correct += s.correct_answers || 0;
        });

        const subjectStats = Object.entries(subjectsMap)
          .map(([name, stat]) => ({
            name,
            total: stat.total,
            accuracy: stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0,
          }))
          .sort((a, b) => b.total - a.total);

        // AI Coaching Insights
        const bestSubject = subjectStats[0];
        const weakestSubject = [...subjectStats].reverse().find((s) => s.total >= 5) || subjectStats[subjectStats.length - 1];

        const aiCoaching = {
          strength: bestSubject ? `${bestSubject.name} — ${bestSubject.accuracy}% aniqlik bilan yuqori ko'rsatkichdasiiz.` : "Testlar yechishni davom ettiring.",
          weakness: weakestSubject ? `${weakestSubject.name} bo'yicha qo'shimcha test va mashqlar talab etiladi (${weakestSubject.accuracy}%).` : "Mavzulashtirilgan bo'limlarni takrorlang.",
          advice: weakestSubject ? `Kelgusi haftada ${weakestSubject.name} faniga ko'proq vaqt ajrating.` : "Har kuni kamida 15 ta test yechib seriyani saqlang.",
        };

        return {
          totalSessions,
          totalQuestions: totalQ,
          totalCorrect: totalC,
          accuracy: overallAccuracy,
          sessions: sessionList,
          subjectStats,
          aiCoaching,
        };
      } catch (err) {
        console.error("Dashboard data error:", err);
        return null;
      }
    },
    enabled: !!profile?.user_id,
    staleTime: 15000,
  });

  // Query blog posts (light columns, cached 30 mins)
  const { data: blogPosts } = useQuery({
    queryKey: ["dashboard-blog-fw"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("blog_posts")
        .select("id, title, slug, cover_image, category, published_at, views")
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .limit(4);
      return data || [];
    },
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  });

  if (isLoading) return <DashboardSkeleton />;

  const accuracy = analytics?.accuracy ?? 0;
  const subjectStats = analytics?.subjectStats || [];
  const recentSessions = analytics?.sessions?.slice(0, 6) || [];

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Xayrli tong";
    if (h < 18) return "Xayrli kun";
    return "Xayrli kech";
  };

  const todayCount = (analytics?.sessions || []).filter((s: any) => {
    if (!s.created_at) return false;
    return new Date(s.created_at).toDateString() === new Date().toDateString();
  }).length;

  const MILESTONES = [
    { days: 7, label: "7 kun", coins: 10, Icon: FlameIcon },
    { days: 14, label: "14 kun", coins: 20, Icon: BoltIcon },
    { days: 20, label: "20 kun", coins: 30, Icon: CrownIcon },
    { days: 30, label: "30 kun", coins: 50, Icon: CupFirstIcon },
    { days: 90, label: "90 kun", coins: 100, Icon: StarsIcon },
  ];

  const QUICK_SERVICES = [
    { icon: BookBookmarkIcon, label: "Testlar", path: "/tests", color: "#C8001A", bg: "#FFF0F1", badge: null },
    { icon: MicrophoneIcon, label: "AI Mentor", path: "/ai-mentor", color: "#7c3aed", bg: "#F3F0FF", badge: "NEW" },
    { icon: StarsIcon, label: "Eduly AI", path: "/ai", color: "#0891b2", bg: "#ECFEFF", badge: "AI" },
    { icon: Pen2Icon, label: "Essay Check", path: "/essay-checker", color: "#db2777", bg: "#FDF2F8", badge: "NEW" },
    { icon: CameraMinimalisticIcon, label: "Math Solver", path: "/math-solver", color: "#2563eb", bg: "#EFF6FF", badge: "NEW" },
    { icon: ClockCircleIcon, label: "Taymer", path: "/forest-timer", color: "#16a34a", bg: "#F0FDF4", badge: "FOCUS" },
    { icon: CupFirstIcon, label: "Olimpiada", path: "/olympiads", color: "#d97706", bg: "#FEF3C7", badge: "PRIZE" },
    { icon: CrownIcon, label: "Obuna", path: "/settings/obuna", color: "#eab308", bg: "#fef08a", badge: "PRO" },
    { icon: ChartSquareIcon, label: "Natijalar", path: "/results", color: "#8b5cf6", bg: "#F5F3FF", badge: null },
    { icon: GamepadIcon, label: "Lug'at", path: "/lugat/game", color: "#6366f1", bg: "#E0E7FF", badge: "NEW" },
    { icon: BuildingsIcon, label: "Universitetlar", path: "/universitetlar", color: "#14b8a6", bg: "#CCFBF1", badge: null },
    { icon: NotebookIcon, label: "Qo'llanmalar", path: "/qollanmalar", color: "#f97316", bg: "#FFEDD5", badge: null },
    { icon: PlayCircleIcon, label: "Kurslar", path: "/courses", color: "#10b981", bg: "#d1fae5", badge: null, pcOnly: true },
    { icon: DiplomaIcon, label: "Fanlar", path: "/tests", color: "#3b82f6", bg: "#dbeafe", badge: null, pcOnly: true },
  ];

  return (
    <>
      <SEO title="Dashboard — EduContest" description="Shaxsiy kabinet, test tahlillari va o'quv samaradorligi statistikasi." />

      {/* FULL-WIDTH CANVAS */}
      <div className="w-full min-h-screen bg-slate-50/70 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 transition-colors">
        
        {/* FULL-WIDTH CONTAINER */}
        <div className="w-full px-3 sm:px-6 lg:px-8 pt-3 pb-24 space-y-5">

          {/* MOBILE PROMO COUNTDOWN BANNER (20% Chegirma EduPremium - Mobile Only) */}
          <DashPromoBanner />

          {/* GUEST BANNER */}
          {!user && (
            <div className="w-full p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg border border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#E8192C] flex items-center justify-center shrink-0 shadow-md">
                  <DiplomaIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold">EduContest platformasiga xush kelibsiz!</h2>
                  <p className="text-xs text-slate-300 mt-0.5">Shaxsiy statistikangizni kuzatish uchun tizimga kiring.</p>
                </div>
              </div>
              <button
                onClick={() => navigate("/login")}
                className="shrink-0 px-6 py-3 bg-[#E8192C] hover:bg-[#C8001A] text-white rounded-2xl text-xs font-bold transition-all shadow-md flex items-center gap-2"
              >
                <Login2Icon className="w-4 h-4" /> Tizimga kirish
              </button>
            </div>
          )}

          {/* CLEAN ELEGANT HEADER / APP-LIKE HEADER */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4 py-2"
          >
            {/* Mobile-first Profile Header */}
            <div className="flex items-center justify-between md:hidden w-full">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800 border-2 border-white dark:border-slate-800 shadow-sm shrink-0">
                  {profile?.avatar_url ? (
                    <img src={rewriteStorageUrl(profile.avatar_url)} alt="Profile" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-lg bg-slate-100 dark:bg-slate-800">
                      {firstName.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{getGreeting()},</p>
                  <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    {firstName}!
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TargetExamCountdownBadge targetDate={profile?.target_date} />
                <button
                  onClick={() => navigate("/tests")}
                  className="w-10 h-10 rounded-full bg-[#E8192C] hover:bg-[#C8001A] text-white flex items-center justify-center shadow-md active:scale-95 transition-transform"
                >
                  <RocketIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Desktop Header */}
            <div className="hidden md:block">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-[#E8192C]/10 text-[#E8192C] font-bold text-[11px] uppercase tracking-wider">
                  {getGreeting()}
                </span>
                <TargetExamCountdownBadge targetDate={profile?.target_date} desktop={true} />
                <span className="text-xs text-slate-400 font-medium">• {todayCount > 0 ? `Bugun ${todayCount} ta test topshirdingiz` : "Hali test topshirmadingiz"}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Xush kelibsiz, {firstName}!
              </h1>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => navigate("/tests")}
                className="px-5 py-3 rounded-2xl bg-[#E8192C] hover:bg-[#C8001A] text-white text-sm font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
              >
                <RocketIcon className="w-4 h-4 text-white" />
                Test Boshlash
              </button>
              <button
                onClick={() => navigate("/ai-mentor")}
                className="px-5 py-3 rounded-2xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-sm font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
              >
                <MicrophoneIcon className="w-4 h-4 text-sky-400" />
                AI Mentor
              </button>
            </div>
          </motion.div>

          {/* KPI METRICS ROAD BAR */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="flex items-center gap-3 p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shrink-0">
                <FlameIcon size={22} className="text-white" />
              </div>
              <div>
                <p className="text-lg font-black text-slate-900 dark:text-white">{streak} kun</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Kunlik Seriya</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0">
                <DollarMinimalisticIcon size={22} className="text-white" />
              </div>
              <div>
                <p className="text-lg font-black text-slate-900 dark:text-white">{eduBalance} EC</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">EduCoins</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0">
                <TargetIcon size={22} className="text-white" />
              </div>
              <div>
                <p className="text-lg font-black text-slate-900 dark:text-white">{accuracy}%</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">O'rtacha Aniqlik</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center shrink-0">
                <CheckCircleIcon size={22} className="text-white" />
              </div>
              <div>
                <p className="text-lg font-black text-slate-900 dark:text-white">{analytics?.totalQuestions || 0}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Yechilgan Savollar</p>
              </div>
            </div>
          </div>

          {/* DREAM UNIVERSITY MOTIVATIONAL CARD (COMPACT & SLEEK) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-sm relative overflow-hidden transition-colors"
          >
            {/* Subtle Low-Opacity Logo Watermark Background */}
            {dreamUni?.logo_url && (
              <div
                className="absolute -right-6 -bottom-6 w-36 h-36 opacity-[0.05] dark:opacity-[0.08] pointer-events-none select-none bg-no-repeat bg-contain bg-right-bottom filter grayscale"
                style={{ backgroundImage: `url(${dreamUni.logo_url})` }}
              />
            )}

            <div className="relative z-10 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
                <div className="relative shrink-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 flex items-center justify-center shadow-2xs overflow-hidden">
                    {dreamUni?.logo_url ? (
                      <img src={dreamUni.logo_url} alt={dreamUni.name} className="w-full h-full object-contain" />
                    ) : (
                      <SquareAcademicCapIcon size={22} className="text-[#E8192C]" />
                    )}
                  </div>
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-xs p-[1px]">
                    <TargetIcon size={11} className="text-slate-950" />
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-500/20">
                      Orzuyingdagi OTM
                    </span>
                    {dreamUni?.qs_rank && (
                      <span className="text-[9px] font-extrabold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 px-1.5 py-0.2 rounded border border-purple-200 dark:border-purple-500/20">
                        QS {dreamUni.qs_rank}
                      </span>
                    )}
                    {dreamUni?.grant_type && (
                      <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-500/20 hidden md:inline-block">
                        {dreamUni.grant_type}
                      </span>
                    )}
                  </div>

                  <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white leading-tight truncate">
                    {dreamUni ? dreamUni.name : "Orzuyingizdagi OTMni Tanlang!"}
                  </h3>

                  <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap font-medium">
                    {dreamUni ? (
                      <>
                        <span className="flex items-center gap-1">
                          <MapPointIcon size={12} className="text-amber-500 shrink-0" /> {dreamUni.manzil || "Xalqaro"}
                        </span>
                        {dreamUni.target_score && (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-500/10 px-1.5 sm:px-2 py-0.2 rounded border border-emerald-200 dark:border-emerald-500/20">
                            <TargetIcon size={11} className="text-emerald-500 shrink-0" /> Maqsad: {dreamUni.target_score}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="line-clamp-1">Maqsadingizni belgilang — har kunlik harakatingizni OTM talablariga moslang!</span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsDreamModalOpen(true)}
                title="OTM Maqsadini O'zgartirish"
                className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-[#E8192C] dark:hover:bg-[#E8192C] text-slate-700 dark:text-slate-200 hover:text-white dark:hover:text-white font-bold text-xs border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-2xs active:scale-95 group"
              >
                <Pen2Icon size={16} className="text-[#E8192C] group-hover:text-white transition-colors shrink-0" />
                <span className="inline">{dreamUni ? "Tahrirlash" : "Tanlash"}</span>
              </button>
            </div>
          </motion.div>

          {/* FULL-WIDTH QUICK SERVICES HUB */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="w-full bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <BoltIcon className="w-4 h-4 text-[#E8192C]" />
                  Tezkor Xizmatlar
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">EduContest platformasidagi barcha aqlli xizmatlar va o'quv bo'limlari</p>
              </div>
            </div>

            <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-9 gap-3 sm:gap-4">
              {QUICK_SERVICES.map((srv: any, idx) => (
                <button
                  key={idx}
                  onClick={() => navigate(srv.path)}
                  className={`group relative flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 hover:shadow-md text-center ${srv.pcOnly ? "hidden lg:flex" : ""}`}
                >
                  {srv.badge && (
                    <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md text-[7px] font-black uppercase tracking-wider bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900">
                      {srv.badge}
                    </span>
                  )}
                  <div
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-2 transition-transform group-hover:scale-110 shadow-xs border border-transparent dark:border-white/5"
                    style={{ backgroundColor: `${srv.color}1c` }}
                  >
                    <srv.icon size={26} style={{ color: srv.color }} />
                  </div>
                  <span className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#E8192C] dark:group-hover:text-red-400 transition-colors">
                    {srv.label}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* REFERRAL INVITATION CARD (FULL WIDTH) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="w-full rounded-3xl bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs border border-slate-200/80 dark:border-slate-800"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 flex items-center justify-center shrink-0">
                  <CupFirstIcon size={26} className="text-amber-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      Do'stlarni taklif qiling va Bepul Premium yutib oling! 🎁
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-black uppercase tracking-wider">
                      Bonus
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Har 5 ta do'stingiz uchun <strong className="text-slate-800 dark:text-slate-200 font-bold">7 kunlik Premium</strong>, 10 ta do'st uchun <strong className="text-slate-800 dark:text-slate-200 font-bold">14 kunlik Premium</strong> sovg'a beriladi.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
                <button
                  onClick={async () => {
                    const code = profile?.referral_code || user?.id?.slice(0, 8);
                    const link = `${window.location.origin}/register?ref=${code || ""}`;
                    await navigator.clipboard.writeText(link);
                    toast.success("Referal havola nusxalandi!");
                  }}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CopyIcon size={16} className="text-[#E8192C]" />
                  <span>Havolani nusxalash</span>
                </button>
                <button
                  onClick={() => navigate("/settings/referal")}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-[#E8192C] hover:bg-[#C8001A] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Batafsil</span>
                  <AltArrowRightIcon size={16} />
                </button>
              </div>
            </div>
          </motion.div>

          {/* MAIN 2-COLUMN FULL-WIDTH LAYOUT */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6"
          >

            {/* LEFT SECTION (8 COLS) */}
            <div className="lg:col-span-8 space-y-6">

              {/* MENING NATIJALARIM PROGRESS CHART (Matching screenshot 1:1) */}
              <motion.div variants={itemVariants}>
                <MyTestProgressChart />
              </motion.div>

              {/* AI COACH & INSIGHTS CARD (Only when user has completed test sessions) */}
              {analytics?.aiCoaching && analytics?.totalSessions > 0 && (
                <motion.div variants={itemVariants} className="w-full relative rounded-3xl bg-white dark:bg-slate-900 p-6 text-slate-900 dark:text-white border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-200 dark:border-sky-800/50 flex items-center justify-center shrink-0">
                          <BrainIcon size={22} className="text-sky-500" />
                        </div>
                        <div>
                          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Eduly AI Mentor Tahlili</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Sun'iy intellekt tomonidan tayyorlangan shaxsiy maslahat</p>
                        </div>
                      </div>
                      <button onClick={() => navigate("/ai-mentor")} className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer">
                        <span>AI bilan suhbatlashish</span>
                        <AltArrowRightIcon size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50">
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1.5">
                          <StarIcon size={16} />
                          <span className="text-[10px] font-black uppercase tracking-wider">Kuchli Tomon</span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-snug">{analytics.aiCoaching.strength}</p>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50">
                        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 mb-1.5">
                          <TargetIcon size={16} />
                          <span className="text-[10px] font-black uppercase tracking-wider">Zaif Nuqta</span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-snug">{analytics.aiCoaching.weakness}</p>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50">
                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1.5">
                          <StarsIcon size={16} />
                          <span className="text-[10px] font-black uppercase tracking-wider">Tavsiya</span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-snug">{analytics.aiCoaching.advice}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* SUBJECT ACCURACY BREAKDOWN (Only when user has test data) */}
              {subjectStats.length > 0 && (
                <motion.div variants={itemVariants} className="w-full bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                        <NotebookIcon size={20} className="text-emerald-500" />
                        Fanlar Bo'yicha O'zlashtirish
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Har bir fan bo'yicha to'g'ri va xato javoblar nisbati</p>
                    </div>
                    <button onClick={() => navigate("/results")} className="text-xs font-bold text-[#E8192C] hover:underline flex items-center gap-1">
                      Natijalar tarixi <ArrowRightUpIcon className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {subjectStats.map((st, i) => {
                      const subjectColors = ["#E8192C", "#0891b2", "#16a34a", "#f97316", "#7c3aed", "#d946ef"];
                      const clr = subjectColors[i % subjectColors.length];
                      return (
                        <div key={st.name} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs sm:text-sm">
                            <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: clr }} />
                              {st.name}
                            </span>
                            <span className="font-black" style={{ color: clr }}>{st.accuracy}% ({st.total} ta savol)</span>
                          </div>
                          <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${st.accuracy}%` }}
                              transition={{ duration: 0.8, delay: i * 0.1 }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: clr }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* RECENT TEST SESSIONS (Only when user has test data) */}
              {recentSessions.length > 0 && (
                <motion.div variants={itemVariants} className="w-full bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <ClockCircleIcon className="w-4 h-4 text-sky-500" />
                      So'nggi Ishlangan Testlar
                    </h3>
                    <button onClick={() => navigate("/results")} className="text-xs font-bold text-[#E8192C] hover:underline">
                      Barcha natijalar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {recentSessions.map((s: any, idx: number) => {
                      const total = s.total_questions || 1;
                      const correct = s.correct_answers || 0;
                      const pct = Math.round((correct / total) * 100);
                      const title = s.test_folders?.name || "Mavzuli test";

                      return (
                        <div
                          key={s.id || idx}
                          onClick={() => navigate("/results")}
                          className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 transition-colors cursor-pointer"
                        >
                          <div className="min-w-0 pr-3">
                            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{title}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {new Date(s.created_at).toLocaleDateString("uz-UZ", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 ${
                              pct >= 70
                                ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                : pct >= 40
                                ? "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400"
                                : "bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            {pct}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

            </div>

            {/* RIGHT SECTION (4 COLS) */}
            <div className="lg:col-span-4 space-y-6">

              {/* STREAK ROADMAP */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FlameIcon size={20} className="text-orange-500" />
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Kunlik Seriya</h3>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 font-black text-xs">
                    {streak} kun
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400">Har kuni test yechib seriyani saqlang va EduCoin yutuqlarini jamlang!</p>

                <div className="space-y-2.5 pt-1">
                  {MILESTONES.map((m) => {
                    const reached = streak >= m.days;
                    return (
                      <div
                        key={m.days}
                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                          reached
                            ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-950 dark:text-emerald-300"
                            : "bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 text-slate-500"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <m.Icon className={`w-4 h-4 ${reached ? "text-emerald-500" : "text-slate-400"}`} />
                          <span className="text-xs font-bold">{m.label} seriya</span>
                        </div>
                        <span className={`text-xs font-black ${reached ? "text-emerald-600 dark:text-emerald-400" : "text-amber-500"}`}>
                          +{m.coins} EC {reached && "✓"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>



              {/* BLOG ARTICLES */}
              {blogPosts && blogPosts.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <BookBookmarkIcon className="w-4 h-4 text-violet-500" />
                      Foydali Maqolalar
                    </h3>
                    <button onClick={() => navigate("/blog")} className="text-xs font-bold text-[#E8192C] hover:underline">
                      Blog
                    </button>
                  </div>

                  <div className="space-y-2">
                    {blogPosts.slice(0, 3).map((post: any) => (
                      <div
                        key={post.id}
                        onClick={() => navigate(`/blog/${post.slug}`)}
                        className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                          {(post.cover_image || post.cover_image_url) ? (
                            <img src={rewriteStorageUrl(post.cover_image || post.cover_image_url)} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                          ) : (
                            <BookBookmarkIcon className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-[#E8192C] transition-colors">
                            {post.title}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                            {post.category || post.tag || "Tavsiya"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </motion.div>

        </div>

        {/* FLOATING ACTION SIDE DOCK - Attached flush to right scrollbar on PC */}
        <div className="fixed bottom-20 right-4 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:right-0 z-40 flex items-center md:flex-col md:items-end gap-2.5 pointer-events-auto">
          {/* Feedback Button */}
          <FeedbackModal>
            <button
              title="Fikr qoldirish"
              className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 rounded-full md:rounded-l-xl md:rounded-r-none py-2.5 px-4 md:py-3.5 md:px-2.5 shadow-2xl flex items-center md:flex-col justify-center gap-2 font-bold text-xs md:text-[13px] transition-all hover:scale-105 md:hover:scale-100 md:hover:-translate-x-1 cursor-pointer select-none border-l border-y border-slate-700/30 dark:border-slate-300/30"
            >
              <MessageSquare className="w-4 h-4 shrink-0 md:rotate-90" />
              <span className="hidden sm:inline md:inline [writing-mode:horizontal-tb] md:[writing-mode:vertical-rl] md:rotate-180">Fikr qoldirish</span>
            </button>
          </FeedbackModal>

          {/* Instagram Official Icon Button - Hidden on Mobile, PC Only */}
          <a
            href="https://instagram.com/educontest"
            target="_blank"
            rel="noopener noreferrer"
            title="EduContest Instagram"
            className="hidden md:flex w-10 h-10 rounded-l-xl bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] hover:opacity-95 text-white shadow-2xl items-center justify-center transition-all hover:scale-110 md:hover:scale-100 md:hover:-translate-x-1 cursor-pointer select-none shrink-0"
          >
            <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
          </a>
        </div>

        {/* DREAM UNIVERSITY SELECTION MODAL */}
        {isDreamModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
              {/* Modal Header */}
              <div className="p-3.5 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shrink-0">
                    <SquareAcademicCapIcon size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
                      Orzuingizdagi Universitetni Tanlang 🎓
                    </h3>
                    <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                      Ro'yxatdan tanlang yoki o'z OTMingiz va logotipini yuklang
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDreamModalOpen(false)}
                  className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors shrink-0"
                >
                  <CloseSquareIcon size={20} />
                </button>
              </div>

              {/* Mode Switcher Tabs */}
              <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-1 sm:p-1.5 gap-1">
                <button
                  onClick={() => setModalTab("list")}
                  className={`flex-1 py-2 px-2 sm:px-3 rounded-xl text-[11px] sm:text-xs font-extrabold transition-all flex items-center justify-center gap-1 sm:gap-1.5 ${
                    modalTab === "list"
                      ? "bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <SquareAcademicCapIcon size={15} className="shrink-0" />
                  <span className="hidden sm:inline">146 ta OTM Ro'yxati</span>
                  <span className="sm:hidden">OTM Ro'yxati</span>
                </button>
                <button
                  onClick={() => setModalTab("custom")}
                  className={`flex-1 py-2 px-2 sm:px-3 rounded-xl text-[11px] sm:text-xs font-extrabold transition-all flex items-center justify-center gap-1 sm:gap-1.5 ${
                    modalTab === "custom"
                      ? "bg-white dark:bg-slate-900 text-[#E8192C] shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <GalleryAddIcon size={15} className="shrink-0" />
                  <span className="hidden sm:inline">Maxsus OTM Qo'shish / Rasm Yuklash</span>
                  <span className="sm:hidden">Maxsus OTM Qo'shish</span>
                </button>
              </div>

              {/* Target Score Bar (Applies to both modes) */}
              <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0 flex items-center gap-1">
                    <TargetIcon size={14} className="text-amber-500 shrink-0" /> Target Natija:
                  </span>
                  <input
                    type="text"
                    placeholder="masalan: IELTS 7.5+ / SAT 1450+ / GPA 3.9"
                    value={targetScoreInput}
                    onChange={(e) => setTargetScoreInput(e.target.value)}
                    className="w-full sm:flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* TAB 1: Standard List Search */}
              {modalTab === "list" && (
                <>
                  <div className="p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                    <div className="relative">
                      <MagnifierIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Universitet nomi, mamlakat yoki yo'nalish bo'yicha qidiring..."
                        value={dreamSearch}
                        onChange={(e) => setDreamSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div className="p-2.5 sm:p-4 overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800 space-y-2">
                    {(universitiesData as any[])
                      .filter((u) => {
                        if (!dreamSearch) return true;
                        const q = dreamSearch.toLowerCase();
                        return u.name.toLowerCase().includes(q) || u.manzil?.toLowerCase().includes(q) || u.grant_type?.toLowerCase().includes(q);
                      })
                      .slice(0, 40)
                      .map((u) => (
                        <div
                          key={u.slug || u.name}
                          onClick={() => handleSelectDreamUni(u)}
                          className="p-2.5 sm:p-3 rounded-2xl hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-transparent hover:border-purple-200 dark:hover:border-purple-800 transition-all cursor-pointer flex items-center justify-between gap-2.5 group"
                        >
                          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 flex items-center justify-center shrink-0 shadow-2xs">
                              <img src={u.logo_url} alt={u.name} className="w-full h-full object-contain" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 flex-wrap">
                                <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">
                                  {u.name}
                                </h4>
                                {u.qs_rank && (
                                  <span className="text-[9px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-500/20 shrink-0">
                                    QS {u.qs_rank}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap">
                                <span className="flex items-center gap-1 truncate">
                                  <MapPointIcon size={12} className="text-amber-500 shrink-0" /> {u.manzil}
                                </span>
                                {u.grant_type && <span className="text-emerald-600 dark:text-emerald-400 font-semibold truncate">• {u.grant_type}</span>}
                              </p>
                            </div>
                          </div>

                          <button className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-purple-600 text-white font-bold text-[11px] sm:text-xs opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0 flex items-center gap-1 shadow-sm">
                            <span>Tanlash</span> <AltArrowRightIcon size={12} />
                          </button>
                        </div>
                      ))}
                  </div>
                </>
              )}

              {/* TAB 2: Custom University Entry / File Upload */}
              {modalTab === "custom" && (
                <div className="p-3.5 sm:p-5 space-y-3 sm:space-y-4 overflow-y-auto flex-1">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Universitet Nomi *</label>
                    <input
                      type="text"
                      placeholder="masalan: Westminster International University in Tashkent"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Mamlakat / Shahar</label>
                      <input
                        type="text"
                        placeholder="masalan: O'zbekiston, Toshkent"
                        value={customLocation}
                        onChange={(e) => setCustomLocation(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">QS Reyting (ixtiyoriy)</label>
                      <input
                        type="text"
                        placeholder="masalan: #500 yoki Top 100"
                        value={customRank}
                        onChange={(e) => setCustomRank(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  {/* Logo Upload Section */}
                  <div className="space-y-2 pt-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>Universitet Logotipi</span>
                      <span className="text-[10px] text-slate-400 font-normal">URL yoki fayldan yuklang</span>
                    </label>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                        {customLogoUrl ? (
                          <img src={customLogoUrl} alt="Preview" className="w-full h-full object-contain" />
                        ) : (
                          <GalleryAddIcon size={24} className="text-slate-400" />
                        )}
                      </div>

                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          placeholder="Rasm havolasini (URL) kiriting..."
                          value={customLogoUrl}
                          onChange={(e) => setCustomLogoUrl(e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                        />
                        
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-100 dark:bg-purple-950/60 hover:bg-purple-200 text-purple-700 dark:text-purple-300 font-bold text-xs cursor-pointer border border-purple-300 dark:border-purple-800 transition-colors">
                          <GalleryAddIcon size={16} /> Qurilmadan Fayl Yuklash
                          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleSaveCustomUni}
                      className="w-full py-3 rounded-2xl bg-[#E8192C] hover:bg-[#C8001A] text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                      <AddCircleIcon size={18} />
                      <span>Saqlash va Maqsad Qilish</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* FULL-WIDTH FOOTER (Hidden on mobile for app feel) */}
        <footer className="hidden md:block w-full border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-xs py-8">
          <div className="w-full px-4 sm:px-8 lg:px-12 sm:pr-56 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div>
              <p className="font-extrabold text-slate-900 dark:text-white text-sm">EduContest Platformasi</p>
              <p className="text-[11px] text-slate-400 mt-0.5">© 2026 EduContest. Barcha huquqlar himoyalangan.</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <Link to="/tests" className="hover:text-[#E8192C]">Testlar</Link>
              <Link to="/results" className="hover:text-[#E8192C]">Natijalar</Link>
              <Link to="/ai" className="hover:text-[#E8192C]">AI Yordam</Link>
              <Link to="/blog" className="hover:text-[#E8192C]">Blog</Link>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
};

const DashboardSkeleton = () => (
  <div className="w-full min-h-screen bg-slate-50 dark:bg-[#070b14] p-6 space-y-6">
    <Skeleton className="h-64 w-full rounded-3xl" />
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
      <div className="lg:col-span-8 space-y-6">
        <Skeleton className="h-48 w-full rounded-3xl" />
        <Skeleton className="h-40 w-full rounded-3xl" />
        <Skeleton className="h-60 w-full rounded-3xl" />
      </div>
      <div className="lg:col-span-4 space-y-6">
        <Skeleton className="h-64 w-full rounded-3xl" />
        <Skeleton className="h-48 w-full rounded-3xl" />
      </div>
    </div>
  </div>
);

export default Dashboard;
