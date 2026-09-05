import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { resolveLandingSection } from "@/lib/deepLinks";
import { useScrollToHash } from "@/hooks/useScrollToHash";
import { SectionLink } from "@/components/routing/SectionLink";
import anime from "animejs";
import {
  FileText, Users, Star, Search, ChevronRight, ArrowUpRight, ArrowRight,
  Sparkles, BookOpen, GraduationCap, ShieldCheck, HelpCircle,
  Trophy, TrendingUp, Clock, CreditCard, Send, Mail, Phone, Bot,
  Camera, Bell, Zap, Award, FileBadge, ChevronDown, Zap as ZapIcon,
  BookMarked, FlaskConical, CalendarCheck, Target, BarChart3,
  Calculator, Brain, Layers, CheckCircle2, TreePine
} from "lucide-react";
import { BookBookmarkIcon } from "@solar-icons/react/bold-duotone/book-bookmark";
import { TargetIcon } from "@solar-icons/react/bold-duotone/target";
import { CpuIcon as BrainIcon } from "@solar-icons/react/bold-duotone/cpu";
import { StarsIcon } from "@solar-icons/react/bold-duotone/stars";
import { DocumentTextIcon } from "@solar-icons/react/bold-duotone/document-text";
import { CalendarMarkIcon as CalendarCheckIcon } from "@solar-icons/react/bold-duotone/calendar-mark";
import { GraphIcon } from "@solar-icons/react/bold-duotone/graph";
import { CalculatorIcon } from "@solar-icons/react/bold-duotone/calculator";
import { CupIcon } from "@solar-icons/react/bold-duotone/cup";
import { MedalRibbonStarIcon } from "@solar-icons/react/bold-duotone/medal-ribbon-star";
import { UserIdIcon } from "@solar-icons/react/bold-duotone/user-id";
import { ShieldCheckIcon } from "@solar-icons/react/bold-duotone/shield-check";
import { UsersGroupTwoRoundedIcon } from "@solar-icons/react/bold-duotone/users-group-two-rounded";
import { HistoryIcon } from "@solar-icons/react/bold-duotone/history";
import { StarsIcon as SparklesIcon } from "@solar-icons/react/bold-duotone/stars";
import { UserIcon } from "@solar-icons/react/bold-duotone/user";
import { ShieldIcon } from "@solar-icons/react/bold-duotone/shield";
import { LogoutIcon } from "@solar-icons/react/bold-duotone/logout";
import { AltArrowDownIcon } from "@solar-icons/react/bold-duotone/alt-arrow-down";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { rewriteStorageUrl } from "@/lib/storage";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import Logo from "@/components/layout/Logo";
import { ModeToggle } from "@/components/ModeToggle";
import SEO from "@/components/SEO";
import { useTranslation, Trans } from "react-i18next";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import TeX from '@matejmazur/react-katex';
import 'katex/dist/katex.min.css';
import ParticleBackground from "@/components/ParticleBackground";
import HeroBackgroundEffect from "@/components/HeroBackgroundEffect";
import LaurelWreathFrame from "@/components/LaurelWreathFrame";
import SmartPlannerSection from "@/components/landing/SmartPlannerSection";
import WeaknessesSection from "@/components/landing/WeaknessesSection";
import DreamUniversityLandingSection from "@/components/landing/DreamUniversityLandingSection";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'dotlottie-wc': any;
    }
  }
}

const NAV_MENUS = [
  {
    label: "Testlar",
    key: "tests",
    left: {
      title: "Testlar",
      desc: "Savollar banki, diagnostika, amaliy testlar va o'qishni rejalashtirish vositalari.",
      items: [
        { icon: BookBookmarkIcon, label: "Savollar banki", to: "/tests" },
        { icon: TargetIcon, label: "Qiyin savollar", to: "/tests" },
        { icon: BrainIcon, label: "Lug'at treneri", to: "/tests" },
      ],
    },
    center: {
      items: [
        { icon: StarsIcon, label: "Tezkor test", to: "/tests" },
        { icon: DocumentTextIcon, label: "Amaliy testlar", to: "/tests" },
        { icon: CalendarCheckIcon, label: "O'quv rejasi", to: "/tests" },
      ],
    },
    right: {
      items: [
        { icon: GraphIcon, label: "Diagnostika testi", to: "/tests" },
        { icon: CalculatorIcon, label: "Ball kalkulyatori", to: "/tests" },
      ],
    },
  },

  {
    label: "Olimpiadalar",
    key: "olympiads",
    left: {
      title: "Olimpiadalar",
      desc: "Respublika va xalqaro olimpiadalarni yechish va tayyorgarlik.",
      items: [
        { icon: CupIcon, label: "Faol olimpiadalar", to: "/olympiads" },
        { icon: TargetIcon, label: "Murakkab masalalar", to: "/olympiads" },
        { icon: BrainIcon, label: "Strategiyalar", to: "/olympiads" },
      ],
    },
    center: {
      items: [
        { icon: GraphIcon, label: "Natijalar", to: "/leaderboard" },
        { icon: MedalRibbonStarIcon, label: "Yutuqlar", to: "/leaderboard" },
        { icon: StarsIcon, label: "Reyting", to: "/leaderboard" },
      ],
    },
    right: {
      items: [
        { icon: UserIdIcon, label: "Sertifikat olish", to: "/resources" },
        { icon: SparklesIcon, label: "AI murabbiy", to: "/ai" },
      ],
    },
  },
  {
    label: "Samaradorlik",
    key: "efficacy",
    left: {
      title: "Samaradorlik",
      desc: "Platformada erishilgan natijalar va muvaffaqiyatlar haqida ma'lumot.",
      items: [
        { icon: ShieldCheckIcon, label: "Isbot va natijalar", to: "/bosh/afzalliklar" },
        { icon: UsersGroupTwoRoundedIcon, label: "350,000+ foydalanuvchi", to: "/bosh/afzalliklar" },
        { icon: MedalRibbonStarIcon, label: "98% muvaffaqiyat", to: "/bosh/afzalliklar" },
      ],
    },
    center: {
      items: [
        { icon: GraphIcon, label: "Tahlillar", to: "/tests" },
        { icon: StarsIcon, label: "O'sish grafigi", to: "/tests" },
        { icon: HistoryIcon, label: "O'qish vaqti", to: "/tests" },
      ],
    },
    right: {
      items: [
        { icon: CupIcon, label: "Liderlar jadvali", to: "/leaderboard" },
        { icon: UserIdIcon, label: "Sertifikatlar", to: "/resources" },
      ],
    },
  },
];

const CountUpNumber = ({ end, duration = 1500, suffix = "" }: { end: number; duration?: number; suffix?: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const animated = useRef(false);

  useEffect(() => {
    if (animated.current || !ref.current) return;
    const el = ref.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated.current) {
          animated.current = true;
          const obj = { val: 0 };
          anime({
            targets: obj,
            val: end,
            duration,
            easing: "easeOutExpo",
            update: () => {
              if (el) el.textContent = Math.round(obj.val).toLocaleString() + suffix;
            },
          });
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration, suffix]);

  return <span ref={ref}>0{suffix}</span>;
};

const Index = () => {
  const { t } = useTranslation();
  const { user, profile, isAdmin, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const avatarChar = profile?.full_name?.[0]?.toUpperCase() || "U";
  const { section: sectionParam } = useParams<{ section?: string }>();
  const landingSection = resolveLandingSection(sectionParam);
  useScrollToHash(landingSection);



  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [aiShowcaseSubject, setAiShowcaseSubject] = useState<'lang' | 'math'>('lang');
  const [aiShowcaseHighlighted, setAiShowcaseHighlighted] = useState<boolean>(false);
  const [aiShowcaseAiTab, setAiShowcaseAiTab] = useState<'ask' | 'explanation'>('ask');
  const [selectedLangChoice, setSelectedLangChoice] = useState<string | null>('A');
  const [selectedMathChoice, setSelectedMathChoice] = useState<string | null>('A');
  const [activeQuoteIndex, setActiveQuoteIndex] = useState<number>(0);
  const [isQuoteHovered, setIsQuoteHovered] = useState<boolean>(false);

  /* ── Testimonial Auto-Play Slider ── */
  useEffect(() => {
    if (isQuoteHovered) return;
    const timer = setInterval(() => {
      setActiveQuoteIndex((prev) => (prev + 1) % 3);
    }, 4500);
    return () => clearInterval(timer);
  }, [isQuoteHovered]);
  const menuRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const floatingCardsRef = useRef<HTMLDivElement>(null);

  /* ── Hero entrance animation ── */
  useEffect(() => {
    try {
      anime({
        targets: [".hero-title", ".hero-subtitle", ".hero-desc", ".hero-buttons", ".hero-float-card"],
        opacity: [0.3, 1],
        translateY: [25, 0],
        duration: 750,
        easing: "easeOutExpo",
        delay: anime.stagger(90),
      });
    } catch {
      // Fallback: elements remain 100% visible
    }
  }, []);

  /* ── 3D card tilt on mouse move ── */
  const handleCardTilt = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -6;
    const rotateY = ((x - centerX) / centerX) * 6;
    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    card.style.transition = "transform 0.1s ease-out";
  }, []);

  const handleCardReset = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    card.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
    card.style.transition = "transform 0.4s ease-out";
  }, []);

  /* ── Scroll-triggered section animations ── */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            anime({
              targets: entry.target.querySelectorAll(".anim-reveal"),
              opacity: [0, 1],
              translateY: [30, 0],
              scale: [0.95, 1],
              duration: 700,
              easing: "easeOutExpo",
              delay: anime.stagger(80),
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    document.querySelectorAll("[data-anim-section]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const { data: announcementSettings } = useQuery({
    queryKey: ["site-announcement"],
    queryFn: async () => {
      const { data } = await supabase
        .from("admin_settings" as any)
        .select("*");

      const map: Record<string, string> = {};
      data?.forEach((s: any) => { map[s.key] = s.value; });

      return {
        value: map.top_announcement || "",
        is_active: map.announcement_active !== "false" && !!map.top_announcement
      };
    },
  });

  const [scrollPercent, setScrollPercent] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 85;
      setScrollPercent(scrolled);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const { data: folders = [] } = useQuery({
    queryKey: ["public-tests"],
    queryFn: async () => {
      const { data } = await supabase
        .from("test_folders")
        .select("*")
        .eq("is_active", true)
        .limit(6);
      return data || [];
    },
  });

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300 overflow-x-hidden">
      <SEO
        title="Milliy Sertifikat Mock Testlari — Matematika va barcha fanlardan online testlar"
        description="EduContest.uz — Milliy Sertifikat imtihonlariga tayyorlanish uchun Matematika mock testlari hamda barcha fanlar bo‘yicha online mock testlar, diagnostik tahlil va AI yordamidagi tayyorgarlik platformasi."
      />

      {/* Floating Mascot */}
      <Link
        to="/login"
        className="fixed right-4 z-[200] pointer-events-auto transition-all duration-300 ease-out hidden md:flex flex-col items-center group shadow-2xl drop-shadow-2xl"
        style={{ top: `${scrollPercent + 10}%` }}
      >
        <div className="w-[130px] h-[130px] relative">
          <dotlottie-wc
            src="/animations/hero.lottie"
            autoplay
            loop
            style={{ width: '100%', height: '100%' }}
          ></dotlottie-wc>
        </div>
      </Link>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-[150] w-full">
        <div ref={menuRef}>
          {/* Announcement Banner */}
          {announcementSettings?.is_active && (
            <div className="w-full bg-[#E8192C] py-2 px-4">
              <div className="max-w-screen-xl mx-auto flex items-center justify-center gap-3">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <p className="text-[11px] md:text-xs font-semibold text-white uppercase tracking-wider text-center">
                  {announcementSettings.value}
                </p>
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              </div>
            </div>
          )}

          {/* Main Nav - Updated to White Background */}
          <div className={`backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 transition-colors shadow-sm ${activeMenu === 'mobile' ? 'bg-white text-slate-900 dark:bg-[#1A2434] dark:text-white' : 'bg-white/95 text-slate-900 dark:bg-[#1A2434]/95 dark:text-white'}`}>
            {/* Top accent line */}
            <div className="h-[2px] bg-gradient-to-r from-[#E8192C] via-[#FF4D5A] to-[#E8192C]" />

            <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              {/* Logo */}
              <Link to="/" className="flex items-center gap-3 shrink-0 group">
                <div className="relative">
                  <Logo className="scale-90 sm:scale-100 origin-left" hideTextOnMobile={false} variant="dark" />
                </div>
              </Link>



              {/* Right Actions */}
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <ModeToggle />
                <LanguageSwitcher />
                <div className="hidden sm:block w-px h-6 bg-slate-200 dark:bg-slate-700" />
                {user ? (
                  <div className="flex items-center gap-2">
                    <Link
                      to="/tests"
                      className="hidden sm:flex items-center gap-1.5 bg-[#E8192C] text-white px-4 py-2 rounded-lg font-bold text-[13px] hover:bg-[#D41524] transition-all shadow-md"
                    >
                      <span>Kabinet</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>

                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="flex items-center gap-1.5 p-1 pl-2 pr-1.5 rounded-full border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors bg-white dark:bg-slate-800 cursor-pointer shadow-2xs">
                          <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 shrink-0 flex items-center justify-center border border-slate-200/50">
                            {profile?.avatar_url ? (
                              <img src={rewriteStorageUrl(profile.avatar_url)} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-200">
                                {avatarChar}
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 max-w-[110px] truncate hidden md:inline-block">
                            {profile?.full_name?.split(' ')[0] || "Profil"}
                          </span>
                          <AltArrowDownIcon size={14} className="text-slate-400" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-56 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl bg-white dark:bg-[#111]"
                        align="end"
                      >
                        <div className="px-3 py-2.5 mb-1">
                          <p className="text-[13px] font-bold truncate text-slate-900 dark:text-white">
                            {profile?.full_name || "Foydalanuvchi"}
                          </p>
                          <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">
                            {profile?.role || (isAdmin || user?.email === 'xudayberganovbackend@gmail.com' ? "ADMIN" : "FOYDALANUVCHI")}
                          </p>
                        </div>
                        <div className="h-px bg-slate-100 dark:bg-white/5 mx-1 mb-1" />
                        <div className="space-y-0.5">
                          <Link
                            to="/tests"
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                          >
                            <BookBookmarkIcon size={18} className="text-[#E8192C]" />
                            <span>Platformaga o'tish</span>
                          </Link>
                          <Link
                            to="/profile"
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                          >
                            <UserIcon size={18} className="text-[#E8192C]" />
                            <span>Profil sozlamalari</span>
                          </Link>
                          {(isAdmin || profile?.role === "admin" || user?.email === "xudayberganovbackend@gmail.com") && (
                            <Link
                              to="/admin"
                              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-[#E8192C] hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                            >
                              <ShieldIcon size={18} className="text-[#E8192C]" />
                              <span>Admin Panel</span>
                            </Link>
                          )}
                          <div className="h-px bg-slate-100 dark:bg-white/5 mx-1 my-1" />
                          <button
                            onClick={signOut}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-[#E8192C] hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                          >
                            <LogoutIcon size={18} className="text-[#E8192C]" />
                            <span>Tizimdan chiqish</span>
                          </button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="hidden sm:flex items-center gap-2 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg font-medium text-[13px] hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-white/10 transition-all"
                    >
                      Kirish
                    </Link>
                    <Link
                      to="/register"
                      className="hidden sm:flex items-center gap-2 bg-[#E8192C] text-white px-5 py-2.5 rounded-lg font-medium text-[13px] hover:bg-[#D41524] transition-all shadow-md"
                    >
                      Boshlash
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </>
                )}
                {/* Mobile Menu Button */}
                <button
                  onClick={() => setActiveMenu(activeMenu ? null : 'mobile')}
                  className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                >
                  {activeMenu === 'mobile' ? (
                    <span className="text-slate-900 dark:text-white text-lg">✕</span>
                  ) : (
                    <span className="text-slate-700 dark:text-slate-200 text-lg">☰</span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {activeMenu === 'mobile' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1A2434] text-slate-900 dark:text-white shadow-2xl max-h-[calc(100vh-80px)] overflow-y-auto z-[200] relative"
              >
                <div className="max-w-screen-xl mx-auto px-4 py-4 space-y-1">
                  {NAV_MENUS.map((menu) => (
                    <div key={menu.key} className="py-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">{menu.label}</p>
                      <div className="space-y-0.5">
                        {menu.left.items.map((item) => {
                          const IconComponent = item.icon;
                          return (
                            <Link
                              key={item.label}
                              to={item.to}
                              onClick={() => setActiveMenu(null)}
                              className="flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
                            >
                              {IconComponent && <IconComponent size={20} className="text-[#E8192C] dark:text-[#FF4D5A] shrink-0" />}
                              <span>{item.label}</span>
                            </Link>
                          );
                        })}
                        {menu.center.items.map((item) => {
                          const IconComponent = item.icon;
                          return (
                            <Link
                              key={item.label}
                              to={item.to}
                              onClick={() => setActiveMenu(null)}
                              className="flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
                            >
                              {IconComponent && <IconComponent size={20} className="text-[#E8192C] dark:text-[#FF4D5A] shrink-0" />}
                              <span>{item.label}</span>
                            </Link>
                          );
                        })}
                        {menu.right.items.map((item) => {
                          const IconComponent = item.icon;
                          return (
                            <Link
                              key={item.label}
                              to={item.to}
                              onClick={() => setActiveMenu(null)}
                              className="flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
                            >
                              {IconComponent && <IconComponent size={20} className="text-[#E8192C] dark:text-[#FF4D5A] shrink-0" />}
                              <span>{item.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
                    {user ? (
                      <>
                        <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl mb-1 border border-slate-200/50 dark:border-slate-700/50">
                          <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0 flex items-center justify-center">
                            {profile?.avatar_url ? (
                              <img src={rewriteStorageUrl(profile.avatar_url)} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200">{avatarChar}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{profile?.full_name || "Foydalanuvchi"}</p>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">{profile?.role || (isAdmin ? "ADMIN" : "FOYDALANUVCHI")}</p>
                          </div>
                        </div>
                        <Link
                          to="/tests"
                          onClick={() => setActiveMenu(null)}
                          className="flex items-center justify-center gap-2 bg-[#E8192C] text-white px-4 py-2.5 rounded-xl font-bold text-[13px] hover:bg-[#D41524] transition-all"
                        >
                          Platformaga o'tish
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          to="/profile"
                          onClick={() => setActiveMenu(null)}
                          className="flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl font-medium text-[13px] hover:bg-slate-100 transition-all"
                        >
                          Profil sozlamalari
                        </Link>
                        <button
                          onClick={() => { signOut(); setActiveMenu(null); }}
                          className="flex items-center justify-center gap-2 text-[#E8192C] bg-red-50 dark:bg-red-500/10 px-4 py-2.5 rounded-xl font-medium text-[13px] hover:bg-red-100 transition-all cursor-pointer"
                        >
                          Tizimdan chiqish
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/login"
                          onClick={() => setActiveMenu(null)}
                          className="flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-4 py-3 rounded-xl font-medium text-[13px] hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
                        >
                          Kirish
                        </Link>
                        <Link
                          to="/register"
                          onClick={() => setActiveMenu(null)}
                          className="flex items-center justify-center gap-2 bg-[#E8192C] text-white px-4 py-3 rounded-xl font-medium text-[13px] hover:bg-[#D41524] transition-all"
                        >
                          Ro'yxatdan o'tish
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Hero Section matching BirPrep layout with 100% EduContest Red Identity & Gem Mascots */}
      <section
        id="hero"
        ref={heroRef}
        className="w-full relative pt-2 sm:pt-4 pb-10 px-2 sm:px-4 lg:px-6 bg-white dark:bg-slate-950"
      >
        {/* Interactive Spotlight & Floating Glass Badges Overlay */}
        <HeroBackgroundEffect />

        {/* Main Rounded Hero Card Container Seamlessly Blended with Topbar */}
        <div className="w-full max-w-[1520px] mx-auto relative z-10">
          <div className="relative rounded-[28px] sm:rounded-[44px] md:rounded-[52px] overflow-hidden shadow-[0_20px_50px_-20px_rgba(0,0,0,0.06)] pt-14 sm:pt-28 md:pt-36 pb-28 sm:pb-56 md:pb-64 px-4 sm:px-10 md:px-16 text-center flex flex-col items-center justify-start min-h-[560px] sm:min-h-[840px] md:min-h-[900px] border border-slate-200/50 dark:border-slate-800/50">

            {/* Background Image Layer with CSS Filter for pastel sky */}
            <div
              className="absolute inset-0 bg-[url('/landingbg_img.png')] bg-cover bg-center pointer-events-none"
              style={{ filter: "saturate(0.75) brightness(1.06)" }}
            />

            {/* Seamless Top Pastel Transition - Blends top sky color into topbar */}
            <div className="absolute inset-0 bg-gradient-to-b from-purple-100/30 via-white/20 to-transparent dark:from-slate-950/40 dark:via-slate-950/15 dark:to-transparent pointer-events-none z-10" />
            {/* Hero Content Container - Shifted down further into comfortable central sky space */}
            <div className="relative z-20 max-w-[720px] sm:max-w-[820px] mx-auto space-y-4 sm:space-y-8 mt-2 sm:mt-20 md:mt-24">

              {/* Headline - Solid black text in both light and dark mode */}
              <h1 className="hero-title text-[26px] sm:text-5xl md:text-[52px] lg:text-[56px] font-bold tracking-tight text-slate-900 dark:text-slate-900 leading-[1.2] text-center drop-shadow-xs max-w-[760px] sm:max-w-[840px] mx-auto">
                Milliy va Xalqaro<br className="hidden sm:block" />{" "}
                sertifikatlarga{" "}
                <span className="relative inline-block text-slate-900 dark:text-slate-900">
                  EduContest
                  <svg
                    className="absolute -bottom-2 left-0 w-full h-3 text-[#C8001A] dark:text-[#C8001A]"
                    viewBox="0 0 100 20"
                    preserveAspectRatio="none"
                    fill="none"
                  >
                    <path
                      d="M3 15 C 30 5, 70 5, 97 15"
                      stroke="currentColor"
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span><br className="hidden sm:block" />{" "}
                bilan tayyorlaning.
              </h1>

              {/* Description Text - Solid dark slate in both light and dark mode */}
              <p className="hero-desc max-w-xl sm:max-w-2xl mx-auto text-slate-800 dark:text-slate-800 text-sm sm:text-lg md:text-xl leading-relaxed font-bold text-center drop-shadow-xs px-2">
                Mutaxassislar tuzgan savollar, AI asosidagi tushunarli izohlar va haqiqiy sinov testlari bilan orzu qilingan natijaga erishing.
              </p>

              {/* Hero CTA Buttons - 2 Buttons in 1 row on desktop, full-width clean stack on mobile */}
              <div className="hero-buttons flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2 sm:pt-3 w-full max-w-sm sm:max-w-none mx-auto px-2 sm:px-0">
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-7 py-3.5 sm:px-9 sm:py-4 bg-[#C8001A] hover:bg-[#A80015] text-white rounded-[20px] font-bold text-base sm:text-lg shadow-lg shadow-[#C8001A]/30 hover:shadow-xl hover:shadow-[#C8001A]/40 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2.5"
                >
                  <span>O'qishni davom ettirish</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>

                <a
                  href="#three-steps-section"
                  className="w-full sm:w-auto px-7 py-3.5 sm:py-4 bg-white/95 hover:bg-white text-slate-900 rounded-[20px] font-bold text-sm sm:text-base shadow-sm shadow-slate-200/60 border border-slate-200/80 hover:shadow-md hover:scale-105 transition-all duration-300 flex items-center justify-center"
                >
                  Qanday ishlaydi
                </a>
              </div>

            </div>
          </div>

          {/* University Logos Infinite Marquee Ticker */}
          <div className="pt-10">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 text-center mb-6">
              DUNYO VA MILLIY YETAKCHI UNIVERSITETLAR BILAN HAMKORLIKDA
            </p>
            <div className="relative w-full overflow-hidden">
              <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white dark:from-slate-950 to-transparent z-10" />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white dark:from-slate-950 to-transparent z-10" />
              <div className="flex overflow-hidden">
                <div className="animate-marquee-left flex items-center gap-12 sm:gap-16 shrink-0">
                  {[
                    { name: "MIT", url: "https://www.oneprep.com/cdn-cgi/image/width=256,quality=75,format=auto/images/universities/mit.png" },
                    { name: "Columbia", url: "https://www.oneprep.com/cdn-cgi/image/width=256,quality=75,format=auto/images/universities/columbia.png" },
                    { name: "Northwestern", url: "https://www.oneprep.com/cdn-cgi/image/width=256,quality=75,format=auto/images/universities/northwestern.png" },
                    { name: "Washington", url: "https://www.oneprep.com/cdn-cgi/image/width=256,quality=75,format=auto/images/universities/washington.png" },
                    { name: "Harvard", url: "https://www.oneprep.com/cdn-cgi/image/width=256,quality=75,format=auto/images/universities/harvard.png" },
                    { name: "MIT", url: "https://www.oneprep.com/cdn-cgi/image/width=256,quality=75,format=auto/images/universities/mit.png" },
                    { name: "Columbia", url: "https://www.oneprep.com/cdn-cgi/image/width=256,quality=75,format=auto/images/universities/columbia.png" },
                    { name: "Northwestern", url: "https://www.oneprep.com/cdn-cgi/image/width=256,quality=75,format=auto/images/universities/northwestern.png" },
                    { name: "Washington", url: "https://www.oneprep.com/cdn-cgi/image/width=256,quality=75,format=auto/images/universities/washington.png" },
                    { name: "Harvard", url: "https://www.oneprep.com/cdn-cgi/image/width=256,quality=75,format=auto/images/universities/harvard.png" },
                  ].map((univ, idx) => (
                    <div key={`univ-${idx}`} className="flex items-center justify-center h-12 w-32 sm:w-40 shrink-0 opacity-70 hover:opacity-100 transition-opacity grayscale hover:grayscale-0">
                      <img src={univ.url} alt={univ.name} className="max-h-9 max-w-full object-contain filter drop-shadow-sm dark:invert" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Below Hero Container */}
      <div className="relative overflow-hidden">

        {/* Benefits Section */}
        <section id="benefits" className="py-16 px-4 sm:px-6" data-anim-section>
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((num, i) => {
              const Icon = [ShieldCheckIcon, StarsIcon, UserIdIcon][i];
              return (
                <div
                  key={i}
                  className="anim-reveal flex gap-4 p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl cursor-default shadow-xs"
                  onMouseMove={handleCardTilt}
                  onMouseLeave={handleCardReset}
                  style={{ transformStyle: "preserve-3d", willChange: "transform" }}
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                    <Icon size={22} className="text-slate-700 dark:text-slate-300" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-[15px] mb-1">{t(`landing.benefits_title_${num}`)}</h3>
                    <p className="text-[13px] text-slate-500 font-medium leading-relaxed">{t(`landing.benefits_desc_${num}`)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Testimonial Quote Slider Section with Laurel Wreath Frame - Seamless & Borderless */}
        <section
          id="opportunities"
          className="py-20 sm:py-28 relative overflow-hidden bg-transparent border-none"
          data-anim-section
          onMouseEnter={() => setIsQuoteHovered(true)}
          onMouseLeave={() => setIsQuoteHovered(false)}
        >
              {/* Victory Laurel Wreath Framing both sides */}
              <LaurelWreathFrame />

              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-10 relative z-10">
                <div className="anim-reveal space-y-4">
                  {/* Serif Quotation Mark */}
                  <span className="text-6xl font-serif text-slate-300 dark:text-slate-700 leading-none select-none block -mb-6">“</span>

                  {/* Main Quote Text matching Image 2 styling */}
                  <AnimatePresence mode="wait">
                    <motion.blockquote
                      key={activeQuoteIndex}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                      className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug max-w-3xl mx-auto"
                    >
                      {[
                        {
                          before: "EduContest menga Attestatsiya va Milliy sertifikat ballimni ",
                          highlight: "3 oy ichida 65 dan 88 ballga oshirishga",
                          after: " yordam berdi. Shaxsiy tayyorgarlik rejasi har bir mashg'ulotni maqsadli va samarali qildi.",
                        },
                        {
                          before: "EduContest platformasidagi sun'iy intellekt moduli sababli ",
                          highlight: "matematik masalalarni 2 barobar tezroq",
                          after: " yechishni o'rgandim. Har bir xato ustida bosqichma-bosqich tahlil mislsiz natija berdi.",
                        },
                        {
                          before: "EduContest yordamida imtihonga tayyorlanib, ",
                          highlight: "birinchi urinishdayoq 94 ball to'play oldim",
                          after: ". Tayyorgarlik jadvallari va taymer diqqatni to'liq jamlashga katta ko'mak berdi.",
                        }
                      ][activeQuoteIndex].before}

                      <span className="text-[#0284C7] underline decoration-[#BAE6FD] underline-offset-8 font-black">
                        {[
                          {
                            highlight: "3 oy ichida 65 dan 88 ballga oshirishga"
                          },
                          {
                            highlight: "matematik masalalarni 2 barobar tezroq"
                          },
                          {
                            highlight: "birinchi urinishdayoq 94 ball to'play oldim"
                          }
                        ][activeQuoteIndex].highlight}
                      </span>

                      {[
                        {
                          after: " yordam berdi. Shaxsiy tayyorgarlik rejasi har bir mashg'ulotni maqsadli va samarali qildi."
                        },
                        {
                          after: " yechishni o'rgandim. Har bir xato ustida bosqichma-bosqich tahlil mislsiz natija berdi."
                        },
                        {
                          after: ". Tayyorgarlik jadvallari va taymer diqqatni to'liq jamlashga katta ko'mak berdi."
                        }
                      ][activeQuoteIndex].after}
                      <span className="text-[#0284C7]">”</span>
                    </motion.blockquote>
                  </AnimatePresence>
                </div>

                {/* Author Bio Card matching Image 2 */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeQuoteIndex}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="anim-reveal flex items-center justify-center gap-3 pt-2"
                  >
                    <div className="relative">
                      <img
                        src={[
                          "/1.png",
                          "/1.png",
                          "/1.png"
                        ][activeQuoteIndex]}
                        alt="Author"
                        className="w-12 h-12 rounded-full object-cover shadow-sm border border-slate-200 dark:border-slate-800"
                      />
                      <span className="absolute -bottom-1 -right-1 text-xs bg-white dark:bg-slate-800 rounded-full shadow-xs px-0.5">🇺🇿</span>
                    </div>
                    <div className="text-left">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-tight">
                        {[
                          "Malika Toshpulatova",
                          "Sardor Rahimov",
                          "Diyora Olimova"
                        ][activeQuoteIndex]}
                      </h4>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">
                        {[
                          "Orzudagi natija: Milliy Sertifikat C1 (Oliy toifa)",
                          "Orzudagi oliygoh: O'zMU (Matematika fakulteti)",
                          "Oliy toifali pedagog: Toshkent shahar"
                        ][activeQuoteIndex]}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Carousel Pagination Dots matching Image 2 1:1 */}
                <div className="flex items-center justify-center gap-2 pt-4">
                  {[0, 1, 2].map((idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveQuoteIndex(idx)}
                      aria-label={`Go to slide ${idx + 1}`}
                      className={`transition-all duration-300 rounded-full ${activeQuoteIndex === idx
                        ? "w-8 h-2 bg-[#0284C7]"
                        : "w-2 h-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-400"
                        }`}
                    />
                  ))}
                </div>
              </div>
            </section>

            {/* 3 Qadam Section (Redesigned Red Theme from Screenshot) */}
            <section id="three-steps-section" className="py-16 md:py-24 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800" data-anim-section>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">

                {/* Section Header */}
                <div className="text-center space-y-4 max-w-3xl mx-auto">
                  <h2 className="anim-reveal text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                    Orzuingizdagi ball sari uch qadam.
                  </h2>
                </div>

                {/* 3 Step Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                  {/* Card 01: Tashxisdan o'ting */}
                  <div className="anim-reveal flex flex-col space-y-6">
                    {/* Soft Red Tinted Top Container */}
                    <div className="bg-red-50/70 dark:bg-red-950/20 rounded-[28px] p-5 sm:p-6 min-h-[340px] flex items-center justify-center border border-red-100/60 dark:border-red-900/30">
                      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-md border border-slate-100 dark:border-slate-800 space-y-4 w-full text-left">
                        <div>
                          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">BASHORAT BAHO</p>
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-3xl font-black text-slate-900 dark:text-white">A</span>
                            <span className="text-xs text-slate-400 font-bold">87% o'zlashtirish</span>
                          </div>
                        </div>

                        <div className="flex gap-6 text-[12px]">
                          <div>
                            <p className="text-slate-400 text-[10px]">Matematika</p>
                            <p className="font-extrabold text-slate-900 dark:text-white text-base">88</p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-[10px]">Ona tili</p>
                            <p className="font-extrabold text-slate-900 dark:text-white text-base">93</p>
                          </div>
                        </div>

                        <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Keyingi diqqat</p>

                          <div className="space-y-1.5 text-[11px]">
                            <div className="flex justify-between font-bold text-slate-600 dark:text-slate-300">
                              <span>Algebra</span>
                              <span>72%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: "0%" }}
                                whileInView={{ width: "72%" }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                                className="h-full bg-[#E8192C] rounded-full"
                              />
                            </div>

                            <div className="flex justify-between font-bold text-slate-600 dark:text-slate-300 pt-1">
                              <span>Geometriya</span>
                              <span>58%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: "0%" }}
                                whileInView={{ width: "58%" }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, delay: 0.25, ease: "easeOut" }}
                                className="h-full bg-[#E8192C] rounded-full"
                              />
                            </div>

                            <div className="flex justify-between font-bold text-slate-600 dark:text-slate-300 pt-1">
                              <span>Matn tahlili</span>
                              <span>81%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: "0%" }}
                                whileInView={{ width: "81%" }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                                className="h-full bg-[#E8192C] rounded-full"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Text Details below Card 01 */}
                    <div className="space-y-2 px-1">
                      <span className="text-3xl font-black text-slate-300 dark:text-slate-700">01</span>
                      <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                        Tashxisdan o‘ting
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                        Bashorat bahoyingizni va eng ko‘p ball yo‘qotayotgan mavzularingizni ko‘rsatadi.
                      </p>
                    </div>
                  </div>

                  {/* Card 02: Shaxsiy reja oling */}
                  <div className="anim-reveal flex flex-col space-y-6">
                    {/* Soft Red Tinted Top Container */}
                    <div className="bg-red-50/70 dark:bg-red-950/20 rounded-[28px] p-5 sm:p-6 min-h-[340px] flex items-center justify-center border border-red-100/60 dark:border-red-900/30">
                      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-md border border-slate-100 dark:border-slate-800 space-y-3.5 w-full text-left">

                        {/* Task 1 */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">Ma'lumot va g'oyalar</p>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                                <span className="bg-red-50 dark:bg-red-500/10 text-red-600 font-extrabold px-1.5 py-0.2 rounded">Ona tili</span>
                                <span>30 daq</span>
                              </div>
                            </div>
                          </div>
                          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg shrink-0">Boshlash &gt;</span>
                        </div>

                        {/* Task 2 */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">Algebra · chiziqli tenglama</p>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                                <span className="bg-sky-50 dark:bg-sky-500/10 text-sky-600 font-extrabold px-1.5 py-0.2 rounded">Matematika</span>
                                <span>25 daq</span>
                              </div>
                            </div>
                          </div>
                          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg shrink-0">Boshlash &gt;</span>
                        </div>

                        {/* Task 3 */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">Lug'at mashqi</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">15 daq</p>
                            </div>
                          </div>
                          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg shrink-0">Boshlash &gt;</span>
                        </div>

                        {/* Progress */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-[11px]">
                          <div className="flex justify-between font-bold text-slate-600 dark:text-slate-300">
                            <span>Haftalik reja</span>
                            <span>64%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: "0%" }}
                              whileInView={{ width: "64%" }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                              className="h-full bg-[#E8192C] rounded-full"
                            />
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Text Details below Card 02 */}
                    <div className="space-y-2 px-1">
                      <span className="text-3xl font-black text-slate-300 dark:text-slate-700">02</span>
                      <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                        Shaxsiy reja oling
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                        Imtihon sanangiz va maqsadingizni ayting. Reja aniqligingiz o‘zgargani sari qayta tuziladi.
                      </p>
                    </div>
                  </div>

                  {/* Card 03: Maqsadga erishing */}
                  <div className="anim-reveal flex flex-col space-y-6">
                    {/* Soft Red Tinted Top Container */}
                    <div className="bg-red-50/70 dark:bg-red-950/20 rounded-[28px] p-5 sm:p-6 min-h-[340px] flex items-center justify-center border border-red-100/60 dark:border-red-900/30">
                      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-md border border-slate-100 dark:border-slate-800 space-y-4 w-full text-left">

                        {/* Block 1 */}
                        <div className="space-y-2 relative pr-6">
                          <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">Savollar bazasi</h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug font-medium">
                            Har bir savolni to'liq izohlari bilan o'z sur'atingizda ishlang.
                          </p>
                          <span className="inline-block text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg mt-1">Davom etish</span>
                        </div>

                        <div className="border-t border-slate-100 dark:border-slate-800 pt-3" />

                        {/* Block 2 */}
                        <div className="space-y-2 relative pr-8">
                          <div className="absolute right-0 top-0 text-slate-200 dark:text-slate-800">
                            <Zap className="w-6 h-6 text-slate-200 dark:text-slate-800 fill-slate-100 dark:fill-slate-800" />
                          </div>
                          <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">Tezkor mashq</h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug font-medium">
                            Vaqtga qarshi poygada javob tezligingizni oshiring.
                          </p>
                          <span className="inline-block text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg mt-1">Davom etish</span>
                        </div>

                      </div>
                    </div>

                    {/* Text Details below Card 03 */}
                    <div className="space-y-2 px-1">
                      <span className="text-3xl font-black text-slate-300 dark:text-slate-700">03</span>
                      <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                        Maqsadga erishing
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                        Eng zaif ko‘nikmalaringizga moslangan maqsadli mashq va savollar.
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            </section>

            {/* Smart Planner & Countdown Showcase Section */}
            <SmartPlannerSection />

            {/* Weaknesses Showcase Section ("Imtihondan avval zaif tomonlaringizni kashf eting.") */}
            <WeaknessesSection />

            {/* Eduly AI Showcase Section (Matches OnePrep Layout with Uzbek Translations & Full Interactivity) */}
            <section id="ai-showcase" className="py-16 md:py-24 border-t border-slate-100 dark:border-slate-800 bg-[#FAFAFA] dark:bg-slate-950 overflow-visible" data-anim-section>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
                {/* Header Grid: Left title + CTA button, Right description */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start justify-between">
                  <div className="md:col-span-6 space-y-5">
                    <h2 className="anim-reveal text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.15]">
                      {t('landing.ai_showcase_title', "Biror savolda hech qachon to'xtab qolmang")}
                    </h2>
                    <div>
                      <Link
                        to="/register"
                        className="anim-reveal inline-flex items-center justify-center bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-full font-bold text-xs sm:text-sm hover:bg-slate-800 dark:hover:bg-slate-100 transition-all duration-300 shadow-md hover:scale-105 active:scale-95"
                      >
                        {t('landing.ai_showcase_btn', "Bepul boshlash")}
                      </Link>
                    </div>
                  </div>

                  <div className="md:col-span-6 md:pt-1">
                    <p className="anim-reveal text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                      {t('landing.ai_showcase_desc', "10,000+ ekspertlar tomonidan tuzilgan Milliy sertifikat va Attestatsiya savollari. Har bir savol bo'yicha bosqichma-bosqich yechim va Eduly AI ning lahzalik yordami.")}
                    </p>
                  </div>
                </div>

                {/* Interactive Mock Interface Container */}
                <div className="anim-reveal space-y-3 pt-2">
                  {/* Mode Selector Tabs (Interactive Language vs Math) */}
                  <div className="flex items-center gap-2 pl-2">
                    <button
                      onClick={() => setAiShowcaseSubject('lang')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-[11px] sm:text-xs transition-all shadow-sm ${aiShowcaseSubject === 'lang'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border border-slate-900 dark:border-white'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:text-slate-900'
                        }`}
                    >
                      <span className="material-symbols-outlined text-xs animate-spin text-cyan-400">progress_activity</span>
                      Ona tili va Yozuv
                    </button>

                    <button
                      onClick={() => setAiShowcaseSubject('math')}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-semibold text-[11px] sm:text-xs transition-all shadow-sm ${aiShowcaseSubject === 'math'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border border-slate-900 dark:border-white'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:text-slate-900'
                        }`}
                    >
                      <span className="font-serif italic font-bold">f(x)</span> Matematika
                    </button>
                  </div>

                  {/* Main Exam Mock Card with Overlapping Protruding Eduly AI Floating Panel */}
                  <div className="relative rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-4 sm:p-7 md:p-8 shadow-xl min-h-[580px] pb-16">

                    {/* Top Bar inside Exam Window */}
                    <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-800 pb-3 mb-5 text-[11px] text-slate-500 font-medium">
                      <div className="flex items-center gap-1 cursor-pointer hover:text-slate-900 font-semibold">
                        <span>Ko'rsatmalar</span>
                        <span className="material-symbols-outlined text-sm text-slate-400">expand_more</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900 dark:text-white text-[11px] bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                          <span className="material-symbols-outlined text-xs text-slate-500">pause</span>
                          <span>00:51</span>
                          <span className="text-[9px] text-slate-400 font-normal border-l border-slate-300 dark:border-slate-700 pl-1.5">Yashirish</span>
                        </div>
                      </div>

                      {/* Interactive Highlight Button */}
                      <button
                        onClick={() => setAiShowcaseHighlighted(!aiShowcaseHighlighted)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium transition-all ${aiShowcaseHighlighted
                          ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 shadow-sm'
                          : 'text-slate-400 hover:text-slate-700'
                          }`}
                      >
                        <span className="material-symbols-outlined text-sm">border_color</span>
                        <span>{t('landing.ai_board_highlight', 'Belgilash')}</span>
                      </button>
                    </div>

                    {/* Split Exam Content: Text 1/Text 2 on left, Question/Choices on right */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pr-0 lg:pr-[360px]">
                      {/* Left Column: Text Passages with AI Chalkboard & Diagram Visualizations */}
                      <div className="lg:col-span-6 space-y-3 text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal bg-slate-50/70 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-inner max-h-[440px] overflow-y-auto">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                            <span>📋 {t('landing.ai_board_title', 'AI Doska va Mavzu Tahlili')}</span>
                          </div>
                          <span className="text-[10px] font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-2 py-0.5 rounded-full border border-amber-500/20">
                            {t('landing.ai_board_badge', 'Grafik Sxema')}
                          </span>
                        </div>

                        {aiShowcaseSubject === 'lang' ? (
                          <>
                            {/* Blackboard Flow Chart Diagram for Language */}
                            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 my-2 font-mono text-[10px] shadow-inner relative overflow-hidden">
                              <div className="flex items-center justify-between text-slate-400 text-[9px] mb-2 font-bold uppercase tracking-wider">
                                <span className="flex items-center gap-1 text-amber-400">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                                  {t('landing.ai_board_header', '🧠 MANTIQIY DOSKA & AI SXEMA TAHLILI')}
                                </span>
                                <span className="text-yellow-400 font-extrabold">{t('landing.ai_board_rel', "O'zaro Bog'liqlik")}</span>
                              </div>

                              <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                                <div className="p-2.5 rounded-xl bg-amber-950/70 border border-amber-500/30 text-amber-200">
                                  <div className="font-bold text-[9px] uppercase text-amber-400">{t('landing.ai_board_text1_idea', "1-Matn G'oyasi")}</div>
                                  <div className="mt-1 font-semibold">{t('landing.ai_board_text1_sub', 'Chuqur Mantiqiy Tahlil')}</div>
                                </div>
                                <div className="flex flex-col items-center justify-center text-slate-400 font-bold">
                                  <span className="text-amber-400 text-xs">➔ AI ➔</span>
                                  <span className="text-[8px] text-slate-500">{t('landing.ai_board_chain', 'Mantiqiy zanjir')}</span>
                                </div>
                                <div className="p-2.5 rounded-xl bg-yellow-950/70 border border-yellow-500/30 text-yellow-200">
                                  <div className="font-bold text-[9px] uppercase text-yellow-400">{t('landing.ai_board_text2_idea', '2-Matn Xulosasi')}</div>
                                  <div className="mt-1 font-semibold">{t('landing.ai_board_text2_sub', "B-Variant (To'g'ri)")}</div>
                                </div>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-bold text-slate-900 dark:text-white text-[11px] mb-1">{t('landing.ai_board_text1_title', '1-Matn')}</h4>
                              <p className="leading-relaxed">
                                Attestatsiya va Milliy sertifikat imtihonlariga tayyorlanishda savollarni{' '}
                                {aiShowcaseHighlighted ? (
                                  <mark className="bg-yellow-200 dark:bg-yellow-900/60 dark:text-yellow-100 px-1 py-0.5 rounded font-bold">
                                    chuqur tahlil qilish pedagoglar va o'quvchilar uchun asosiy kalit
                                  </mark>
                                ) : (
                                  "chuqur tahlil qilish pedagoglar va o'quvchilar uchun asosiy kalit"
                                )}{' '}
                                hisoblanadi. EduContest platformasidagi AI moduli har bir masalani bosqichma-bosqich yechib beradi.
                              </p>
                            </div>
                            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800">
                              <h4 className="font-bold text-slate-900 dark:text-white text-[11px] mb-1">{t('landing.ai_board_text2_title', '2-Matn')}</h4>
                              <p className="leading-relaxed">
                                Attestatsiya savollarini shunchaki yodlab olish imtihonda kutilgan natijani bermasligi mumkin.{' '}
                                {aiShowcaseHighlighted ? (
                                  <mark className="bg-yellow-200 dark:bg-yellow-900/60 dark:text-yellow-100 px-1 py-0.5 rounded font-bold">
                                    Eduly AI ga murojaat qilib, har bir xatoni tahlil qilish
                                  </mark>
                                ) : (
                                  "Eduly AI ga murojaat qilib, har bir xatoni tahlil qilish"
                                )}{' '}
                                tavsiya etiladi.
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            {/* Blackboard Graphic Diagram for Math */}
                            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 my-2 font-mono text-[10px] shadow-inner relative overflow-hidden">
                              <div className="flex items-center justify-between text-slate-400 text-[9px] mb-1 font-bold uppercase tracking-wider">
                                <span className="flex items-center gap-1 text-amber-400">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                                  📐 Doska Tahlili & Chizma Sxema
                                </span>
                                <span className="text-yellow-400 font-extrabold">S = π/4</span>
                              </div>

                              <svg className="w-full h-28 text-amber-400" viewBox="0 0 320 90" fill="none" stroke="currentColor">
                                <line x1="0" y1="20" x2="320" y2="20" stroke="#1E293B" strokeWidth="1" strokeDasharray="2 2" />
                                <line x1="0" y1="50" x2="320" y2="50" stroke="#1E293B" strokeWidth="1" strokeDasharray="2 2" />
                                <line x1="100" y1="0" x2="100" y2="90" stroke="#1E293B" strokeWidth="1" strokeDasharray="2 2" />
                                <line x1="220" y1="0" x2="220" y2="90" stroke="#1E293B" strokeWidth="1" strokeDasharray="2 2" />

                                <path d="M 50 75 Q 120 15 220 50 L 220 75 Z" fill="rgba(245, 158, 11, 0.18)" stroke="rgba(251, 191, 36, 0.5)" strokeDasharray="3 3" />
                                <path d="M 20 80 Q 120 10 280 40" strokeWidth="2.5" stroke="url(#amber-gradient)" fill="none" />
                                <line x1="20" y1="75" x2="300" y2="75" stroke="#64748B" strokeWidth="1.5" />
                                <line x1="20" y1="10" x2="20" y2="82" stroke="#64748B" strokeWidth="1.5" />

                                <circle cx="50" cy="56" r="3.5" fill="#F59E0B" />
                                <circle cx="220" cy="50" r="3.5" fill="#F59E0B" />

                                <text x="42" y="86" fill="#94A3B8" fontSize="9" fontWeight="bold">x=0</text>
                                <text x="210" y="86" fill="#94A3B8" fontSize="9" fontWeight="bold">x=π/2</text>
                                <text x="110" y="42" fill="#FBBF24" fontSize="10" fontWeight="extrabold">I = π/4</text>
                                <text x="225" y="32" fill="#FDE047" fontSize="9" fontWeight="bold">f(x) = sin³x / (sin³x+cos³x)</text>

                                <defs>
                                  <linearGradient id="amber-gradient" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#F59E0B" />
                                    <stop offset="50%" stopColor="#FBBF24" />
                                    <stop offset="100%" stopColor="#FDE047" />
                                  </linearGradient>
                                </defs>
                              </svg>
                            </div>

                            <div>
                              <h4 className="font-bold text-slate-900 dark:text-white text-[11px] mb-1">1-Matn (Aniq Integral va Xossalari)</h4>
                              <p className="leading-relaxed text-[11px]">
                                Ushbu turdagi simmetrik integrallarni hisoblashda Qirollik xossasidan foydalaniladi:{' '}
                                {aiShowcaseHighlighted ? (
                                  <mark className="bg-yellow-200 dark:bg-yellow-900/60 dark:text-yellow-100 px-1 py-0.5 rounded font-bold inline-block my-1">
                                    <TeX math="\int_{a}^{b} f(x)dx = \int_{a}^{b} f(a+b-x)dx" />
                                  </mark>
                                ) : (
                                  <span className="font-semibold text-slate-900 dark:text-white inline-block my-1">
                                    <TeX math="\int_{a}^{b} f(x)dx = \int_{a}^{b} f(a+b-x)dx" />
                                  </span>
                                )}
                                . Natijada sin va cos almashtirilib, integral qiymati soddalashtiriladi.
                              </p>
                            </div>
                            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800">
                              <h4 className="font-bold text-slate-900 dark:text-white text-[11px] mb-1">2-Matn (Ajoyib Chegara va Lopital Qoidasi)</h4>
                              <p className="leading-relaxed text-[11px]">
                                Noma'lumlik <TeX math="\left[\frac{0}{0}\right]" /> ko'rinishida bo'lganda birinchi ajoyib chegara{' '}
                                <TeX math="\lim_{x \to 0} \frac{\sin x}{x} = 1" /> yoki Lopital qoidasi asosida hosila olinadi:{' '}
                                <TeX math="\lim_{x \to 0} \frac{e^{kx}-1}{x} = k" />.
                              </p>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Right Column: Question & Interactive Choices with TeX LaTeX */}
                      <div className="lg:col-span-6 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center">1</span>
                            <span className="material-symbols-outlined text-xs text-slate-400">bookmark</span>
                            <span className="text-[11px] font-semibold text-slate-500">Takrorlash uchun belgilash</span>
                          </div>
                          <span className="text-[10px] bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 font-bold px-2 py-0.5 rounded-full">
                            Oliy Daraja (Milliy Sertifikat)
                          </span>
                        </div>

                        {aiShowcaseSubject === 'lang' ? (
                          <>
                            <p className="text-xs font-semibold text-slate-900 dark:text-white leading-snug">
                              Berilgan matnlar asosida, 2-matn muallifi 1-matndagi <span className="underline decoration-slate-400 underline-offset-2">tagiga chizilgan fikrga</span> qanday munosabat bildiradi?
                            </p>

                            {/* Interactive Language Choices */}
                            <div className="space-y-2 pt-0.5">
                              {[
                                { id: 'A', text: "Test savollarining mantiqiy tuzilishini tahlil qilish va zaif tomonlarni aniqlash orqali", correct: true },
                                { id: 'B', text: "Har ikkala matndagi yondashuv ham attestatsiyadan o'tish uchun birdek muhimligini tushuntirish orqali", correct: false },
                                { id: 'C', text: "Milliy sertifikat darajasining attestatsiya mezonlariga mosligini savol ostiga olish orqali", correct: false },
                                { id: 'D', text: "O'quvchilar va pedagoglar sun'iy intellekt tushuntirishlaridan mustaqil foydalana olishlarini ta'kidlash orqali", correct: false },
                              ].map((opt) => {
                                const isSelected = selectedLangChoice === opt.id;
                                return (
                                  <div
                                    key={opt.id}
                                    onClick={() => {
                                      setSelectedLangChoice(opt.id);
                                      if (opt.correct) setAiShowcaseAiTab('explanation');
                                    }}
                                    className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-2.5 text-[11px] shadow-sm ${isSelected
                                      ? opt.correct
                                        ? 'border-[#10B981] bg-[#ECFDF5] dark:bg-[#064E3B]/60 text-[#065F46] dark:text-[#A7F3D0] ring-2 ring-[#10B981]/20'
                                        : 'border-red-500 bg-[#FEF2F2] dark:bg-red-950/40 text-red-950 dark:text-red-200'
                                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                                      }`}
                                  >
                                    <span className={`w-4 h-4 rounded-full font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5 ${isSelected
                                      ? opt.correct ? 'bg-[#10B981] text-white font-black' : 'bg-red-500 text-white font-black'
                                      : 'border border-slate-300 text-slate-600'
                                      }`}>
                                      {isSelected ? (opt.correct ? '✓' : '✕') : opt.id}
                                    </span>
                                    <span className="font-medium leading-normal flex-1">
                                      {opt.text} {isSelected && opt.correct && <strong className="text-[#047857] dark:text-[#A7F3D0] ml-1">(To'g'ri!)</strong>}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        ) : (
                          <>
                            {/* Math Question with LaTeX TeX */}
                            <div className="text-xs font-semibold text-slate-900 dark:text-white leading-snug space-y-1 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                              <div>
                                Integral <TeX math="I = \int_{0}^{\frac{\pi}{2}} \frac{\sin^3 x}{\sin^3 x + \cos^3 x} \, dx" /> qiymati va
                              </div>
                              <div>
                                Limit <TeX math="L = \lim_{x \to 0} \frac{e^{6x} - 1}{\sin 2x}" /> qiymatlari uchun <TeX math="I \cdot L" /> ko'paytmani toping:
                              </div>
                            </div>

                            {/* Interactive Math Choices with TeX LaTeX */}
                            <div className="space-y-2 pt-0.5">
                              {[
                                { id: 'A', math: "I \\cdot L = \\frac{3\\pi}{4}", label: "3\\pi / 4", correct: true },
                                { id: 'B', math: "I \\cdot L = \\frac{\\pi}{2}", label: "\\pi / 2", correct: false },
                                { id: 'C', math: "I \\cdot L = \\pi", label: "\\pi", correct: false },
                                { id: 'D', math: "I \\cdot L = \\frac{3\\pi}{2}", label: "3\\pi / 2", correct: false },
                              ].map((opt) => {
                                const isSelected = selectedMathChoice === opt.id;
                                return (
                                  <div
                                    key={opt.id}
                                    onClick={() => {
                                      setSelectedMathChoice(opt.id);
                                      if (opt.correct) setAiShowcaseAiTab('explanation');
                                    }}
                                    className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between gap-2 text-[11px] shadow-sm ${isSelected
                                      ? opt.correct
                                        ? 'border-[#10B981] bg-[#ECFDF5] dark:bg-[#064E3B]/60 text-[#065F46] dark:text-[#A7F3D0] ring-2 ring-[#10B981]/20'
                                        : 'border-red-500 bg-[#FEF2F2] dark:bg-red-950/40 text-red-950 dark:text-red-200'
                                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                                      }`}
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <span className={`w-4 h-4 rounded-full font-bold text-[9px] flex items-center justify-center shrink-0 ${isSelected
                                        ? opt.correct ? 'bg-[#10B981] text-white' : 'bg-red-500 text-white'
                                        : 'border border-slate-300 text-slate-600'
                                        }`}>
                                        {isSelected ? (opt.correct ? '✓' : '✕') : opt.id}
                                      </span>
                                      <span className="font-semibold text-xs text-slate-900 dark:text-white">
                                        <TeX math={opt.math} />
                                      </span>
                                    </div>
                                    {isSelected && (
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${opt.correct ? 'bg-[#A7F3D0] text-[#065F46]' : 'bg-red-200 text-red-800'
                                        }`}>
                                        {opt.correct ? "To'g'ri!" : "Xato!"}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Exam Bottom Bar */}
                    <div className="absolute bottom-3 left-6 right-6 flex items-center justify-between pt-3 border-t border-slate-200/70 dark:border-slate-800 text-[11px] text-slate-500 font-medium">
                      <div className="flex items-center gap-1 cursor-pointer hover:text-slate-900">
                        <span>1 dan 57 savol</span>
                        <span className="material-symbols-outlined text-xs">expand_more</span>
                      </div>
                      <button className="px-3.5 py-1 rounded-full bg-[#E0F2FE] text-[#0284C7] font-bold text-[11px] flex items-center gap-1 border border-[#BAE6FD] shadow-sm">
                        <span className="material-symbols-outlined text-xs text-[#0284C7]">auto_awesome</span>
                        <span>Ask Eduly</span>
                      </button>
                    </div>

                    {/* Overlapping Protruding Eduly AI Floating Panel (Extends past bottom border cleanly!) */}
                    <div className="absolute right-3 sm:right-6 -bottom-10 sm:-bottom-12 w-[310px] sm:w-[350px] rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.2)] p-4 space-y-4 z-30 backdrop-blur-md">
                      {/* Panel Header Tabs (Interactive Ask Eduly vs Tushuntirish) */}
                      <div className="flex items-center gap-4 text-xs font-bold border-b border-slate-100 dark:border-slate-800 pb-2.5">
                        <button
                          onClick={() => setAiShowcaseAiTab('ask')}
                          className={`flex items-center gap-1 pb-2 -mb-3 transition-colors ${aiShowcaseAiTab === 'ask'
                            ? 'text-slate-900 dark:text-white border-b-2 border-slate-900 dark:border-white'
                            : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                          <span className="material-symbols-outlined text-xs text-[#0284C7]">auto_awesome</span>
                          Ask Eduly
                        </button>

                        <button
                          onClick={() => setAiShowcaseAiTab('explanation')}
                          className={`flex items-center gap-1 pb-2 -mb-3 transition-colors text-[11px] ${aiShowcaseAiTab === 'explanation'
                            ? 'text-slate-900 dark:text-white border-b-2 border-slate-900 dark:border-white'
                            : 'text-slate-400 hover:text-slate-600 font-semibold'
                            }`}
                        >
                          <span className="material-symbols-outlined text-xs">alt_route</span>
                          Tushuntirish
                        </button>
                      </div>

                      {/* Content View Switching (Ask vs Explanation) */}
                      {aiShowcaseAiTab === 'ask' ? (
                        <>
                          {/* Mascot Center Display using official logo.png */}
                          <div className="text-center py-2.5 space-y-2">
                            <div className="w-14 h-14 mx-auto rounded-2xl bg-white dark:bg-slate-900 p-2 shadow-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                              <img
                                src="/logo.png"
                                alt="EduContest Logo"
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm tracking-tight">
                              Qanday yordam bera olaman?
                            </h3>
                            <p className="text-[11px] text-slate-400 font-medium">
                              Eduly AI ga istalgan savolingizni bering!
                            </p>
                          </div>

                          {/* Chat Input Bar */}
                          <div className="relative flex items-center bg-slate-100 dark:bg-slate-900 rounded-full px-3.5 py-2 border border-slate-200/80 dark:border-slate-800 shadow-inner">
                            <input
                              type="text"
                              readOnly
                              value={aiShowcaseSubject === 'lang' ? "Ushbu masalani yechib bera olasizmi?" : "Viyet teoremasi bo'yicha tushuntiring"}
                              className="bg-transparent text-[11px] font-medium text-slate-700 dark:text-slate-200 w-full outline-none pr-7 cursor-default truncate"
                            />
                            <button className="absolute right-1.5 w-6 h-6 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center text-xs font-bold shadow-md hover:bg-slate-800 transition-colors">
                              <span className="material-symbols-outlined text-xs font-bold">arrow_upward</span>
                            </button>
                          </div>
                        </>
                      ) : (
                        /* Step-by-Step AI Explanation View */
                        <div className="py-2 space-y-2.5 text-[11px] text-slate-700 dark:text-slate-300">
                          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs border-b border-slate-100 dark:border-slate-800 pb-1.5">
                            <span className="material-symbols-outlined text-sm text-cyan-500">lightbulb</span>
                            <span>Eduly AI Bosqichma-bosqich Tahlili</span>
                          </div>
                          {aiShowcaseSubject === 'lang' ? (
                            <div className="bg-cyan-50/70 dark:bg-cyan-950/40 p-3 rounded-xl border border-cyan-200 dark:border-cyan-900/60 leading-relaxed font-normal">
                              <p className="font-semibold text-cyan-900 dark:text-cyan-200 mb-1">💡 Nega A-variant xato?</p>
                              <p>1-variantda har ikkala matn ham birdek muhim deyilgan, ammo 2-matn muallifi faqat yodlab olish yetarsiz ekanligini alohida uqtiradi. Shuning uchun to'g'ri tahlil <strong>B-variant</strong> hisoblanadi.</p>
                            </div>
                          ) : (
                            <div className="bg-cyan-50/70 dark:bg-cyan-950/40 p-3 rounded-xl border border-cyan-200 dark:border-cyan-900/60 leading-relaxed font-normal space-y-1.5 text-[10px]">
                              <p className="font-semibold text-cyan-900 dark:text-cyan-200 text-[11px]">💡 Eduly AI Bosqichma-bosqich Tahlili:</p>
                              <p>1) Qirollik xossasi: <TeX math="2I = \int_{0}^{\pi/2} 1 \, dx = \frac{\pi}{2} \implies I = \frac{\pi}{4}" /></p>
                              <p>2) Birinchi ajoyib chegara: <TeX math="L = \lim_{x \to 0} \frac{6 \cdot \frac{e^{6x}-1}{6x}}{2 \cdot \frac{\sin 2x}{2x}} = \frac{6}{2} = 3" /></p>
                              <p>3) Ko'paytma: <TeX math="I \cdot L = \frac{\pi}{4} \cdot 3 = \frac{3\pi}{4}" /></p>
                              <p className="mt-1 font-bold text-emerald-600 dark:text-emerald-400">✓ To'g'ri javob: A-variant (<TeX math="\frac{3\pi}{4}" />)</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              </div>
            </section>

            {/* Dream University & 100% Scholarship Calculator Section */}
            <DreamUniversityLandingSection />

            {/* Student Success & Score Jumps Section (Exact OnePrep Layout) */}
            <section id="results" className="py-24 border-t border-slate-100 dark:border-slate-800" data-anim-section>
              <div className="text-center mb-16 space-y-4 max-w-4xl mx-auto px-4">
                <h2 className="anim-reveal text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                  EduContest bilan imtihonda yuqori ball oling
                </h2>
                <p className="anim-reveal text-slate-500 dark:text-slate-400 font-medium max-w-2xl mx-auto text-base sm:text-lg">
                  Haqiqiy o'quvchilar, haqiqiy ball o'sishlari. EduContest ularga imtihon kuniga ishonch bilan kirishda qanday yordam berganini ko'ring.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto px-4 items-start">
                {/* Column 1 */}
                <div className="space-y-6">
                  {/* Card 1 */}
                  <div
                    className="anim-reveal bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-[28px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all duration-300 space-y-4 cursor-default"
                    onMouseMove={handleCardTilt} onMouseLeave={handleCardReset} style={{ transformStyle: "preserve-3d" }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-[#FEF3D6] text-[#B87000] dark:bg-amber-950/40 dark:text-amber-400 border border-[#FDE68A]/60">
                        B+ → A+
                      </span>
                      <span className="text-xs font-bold text-[#B87000] dark:text-amber-400">+2 daraja</span>
                    </div>
                    <div className="flex items-center gap-3 pt-1">
                      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 shadow-sm">
                        <img src="/1.png" alt="Profile" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">Azizbek R.</h4>
                        <p className="text-xs text-slate-400 font-medium">EduContest Foydalanuvchisi • Matematika</p>
                      </div>
                    </div>
                    <p className="text-[13px] sm:text-[14px] text-slate-600 dark:text-slate-300 font-normal leading-relaxed">
                      EduContest intensiv tayyorgarlik jarayonida juda katta yordam berdi. Ayniqsa Milliy Sertifikat imtihoniga oz vaqt qolganda AI murabbiy har bir qiyin masalani bosqichma-bosqich tushuntirib berdi.
                    </p>
                  </div>

                  {/* Card 2 */}
                  <div
                    className="anim-reveal bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-[28px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all duration-300 space-y-4 cursor-default"
                    onMouseMove={handleCardTilt} onMouseLeave={handleCardReset} style={{ transformStyle: "preserve-3d" }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-[#D1FAE5] text-[#047857] dark:bg-emerald-950/40 dark:text-emerald-400 border border-[#A7F3D0]/60">
                        72% → 96%
                      </span>
                      <span className="text-xs font-bold text-[#047857] dark:text-emerald-400">+24% o'sish</span>
                    </div>
                    <div className="flex items-center gap-3 pt-1">
                      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 shadow-sm">
                        <img src="/2.png" alt="Profile" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">Bekzod G.</h4>
                        <p className="text-xs text-slate-400 font-medium">EduContest Foydalanuvchisi • Fizika</p>
                      </div>
                    </div>
                    <p className="text-[13px] sm:text-[14px] text-slate-600 dark:text-slate-300 font-normal leading-relaxed">
                      Men ishlatgan eng toza va qulay interfeys. Savollar darajasi haqiqiy imtihonlar bilan bir xil, analitika esa har hafta aynan qaysi mavzuga e'tibor qaratishimni ko'rsatib berdi.
                    </p>
                  </div>

                  {/* Card 3 */}
                  <div
                    className="anim-reveal bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-[28px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all duration-300 space-y-4 cursor-default"
                    onMouseMove={handleCardTilt} onMouseLeave={handleCardReset} style={{ transformStyle: "preserve-3d" }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-[#FEF3D6] text-[#B87000] dark:bg-amber-950/40 dark:text-amber-400 border border-[#FDE68A]/60">
                        60 → 88 ball
                      </span>
                      <span className="text-xs font-bold text-[#B87000] dark:text-amber-400">+28 ball</span>
                    </div>
                    <div className="flex items-center gap-3 pt-1">
                      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 shadow-sm">
                        <img src="/3.png" alt="Profile" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">Jasur K.</h4>
                        <p className="text-xs text-slate-400 font-medium">EduContest Foydalanuvchisi • Tarix</p>
                      </div>
                    </div>
                    <p className="text-[13px] sm:text-[14px] text-slate-600 dark:text-slate-300 font-normal leading-relaxed">
                      EduContest platformasi har bir savol bankini bir joyga jamlab, mavzular bo'yicha tartiblab beradi, shuning uchun tayyorgarlik nihoyat tizimli va samarali kechadi.
                    </p>
                  </div>
                </div>

                {/* Column 2 */}
                <div className="space-y-6">
                  {/* Card 4 */}
                  <div
                    className="anim-reveal bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-[28px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all duration-300 space-y-4 cursor-default"
                    onMouseMove={handleCardTilt} onMouseLeave={handleCardReset} style={{ transformStyle: "preserve-3d" }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-[#D1FAE5] text-[#047857] dark:bg-emerald-950/40 dark:text-emerald-400 border border-[#A7F3D0]/60">
                        68 → 92 ball
                      </span>
                      <span className="text-xs font-bold text-[#047857] dark:text-emerald-400">+24 ball</span>
                    </div>
                    <div className="flex items-center gap-3 pt-1">
                      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 shadow-sm">
                        <img src="/5.png" alt="Profile" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">Sardor M.</h4>
                        <p className="text-xs text-slate-400 font-medium">EduContest Foydalanuvchisi • Ona tili</p>
                      </div>
                    </div>
                    <p className="text-[13px] sm:text-[14px] text-slate-600 dark:text-slate-300 font-normal leading-relaxed">
                      Rosti, AI murabbiy bunchalik tushunarli yordam beradi deb o'ylamagandim. U xuddi jonli ustozdek insho va grammatik qoidalarni tahlil qiladi. Uzoq vaqt taxmin qilib kelgan masalalarim darhol tushunarli bo'ldi.
                    </p>
                  </div>

                  {/* Card 5 */}
                  <div
                    className="anim-reveal bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-[28px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all duration-300 space-y-4 cursor-default"
                    onMouseMove={handleCardTilt} onMouseLeave={handleCardReset} style={{ transformStyle: "preserve-3d" }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-[#FCE7F3] text-[#BE185D] dark:bg-pink-950/40 dark:text-pink-400 border border-[#FBCFE8]/60">
                        IELTS 6.5 → 7.5
                      </span>
                      <span className="text-xs font-bold text-[#BE185D] dark:text-pink-400">+1.0 band</span>
                    </div>
                    <div className="flex items-center gap-3 pt-1">
                      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 shadow-sm">
                        <img src="/2.png" alt="Profile" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">Malika H.</h4>
                        <p className="text-xs text-slate-400 font-medium">EduContest Foydalanuvchisi • Ingliz tili</p>
                      </div>
                    </div>
                    <p className="text-[13px] sm:text-[14px] text-slate-600 dark:text-slate-300 font-normal leading-relaxed">
                      Moslashuvchan amaliyot aynan qaysi joyda xato qilganimga e'tibor qaratishga yordam berdi. Ikki oydan so'ng bir xil xatolarni takrorlashni to'xtatdim va har hafta test ballarim ko'tarildi.
                    </p>
                  </div>

                  {/* Card 6 */}
                  <div
                    className="anim-reveal bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-[28px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all duration-300 space-y-4 cursor-default"
                    onMouseMove={handleCardTilt} onMouseLeave={handleCardReset} style={{ transformStyle: "preserve-3d" }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-[#FCE7F3] text-[#BE185D] dark:bg-pink-950/40 dark:text-pink-400 border border-[#FBCFE8]/60">
                        B → A+
                      </span>
                      <span className="text-xs font-bold text-[#BE185D] dark:text-pink-400">Oliy toifa</span>
                    </div>
                    <div className="flex items-center gap-3 pt-1">
                      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 shadow-sm">
                        <img src="/3.png" alt="Profile" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">Jasur D.</h4>
                        <p className="text-xs text-slate-400 font-medium">O'qituvchi • Kimyo Attestatsiya</p>
                      </div>
                    </div>
                    <p className="text-[13px] sm:text-[14px] text-slate-600 dark:text-slate-300 font-normal leading-relaxed">
                      Amaliyot testlari juda aniq, hatto rasmiy imtihonnikidan ham sifatliroq ishlangani bilindi. Tempni nazorat qilish mashqlari imtihon kunini ancha kam stressli qildi.
                    </p>
                  </div>
                </div>

                {/* Column 3 */}
                <div className="space-y-6">
                  {/* Card 7 */}
                  <div
                    className="anim-reveal bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-[28px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all duration-300 space-y-4 cursor-default"
                    onMouseMove={handleCardTilt} onMouseLeave={handleCardReset} style={{ transformStyle: "preserve-3d" }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-[#FCE7F3] text-[#BE185D] dark:bg-pink-950/40 dark:text-pink-400 border border-[#FBCFE8]/60">
                        CEFR B2 → C1
                      </span>
                      <span className="text-xs font-bold text-[#BE185D] dark:text-pink-400">+1 daraja</span>
                    </div>
                    <div className="flex items-center gap-3 pt-1">
                      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 shadow-sm">
                        <img src="/1.png" alt="Profile" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">Shahnoza A.</h4>
                        <p className="text-xs text-slate-400 font-medium">EduContest Foydalanuvchisi • Ingliz tili</p>
                      </div>
                    </div>
                    <p className="text-[13px] sm:text-[14px] text-slate-600 dark:text-slate-300 font-normal leading-relaxed">
                      Tushuntirishlar juda mantiqli va tushunarli beriladi. Boshqa platformalar shunchaki to'g'ri javobni ko'rsatsa, EduContest har bir savolni parchalab, sababini tushuntiradi.
                    </p>
                  </div>

                  {/* Card 8 */}
                  <div
                    className="anim-reveal bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-[28px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all duration-300 space-y-4 cursor-default"
                    onMouseMove={handleCardTilt} onMouseLeave={handleCardReset} style={{ transformStyle: "preserve-3d" }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-[#FCE7F3] text-[#BE185D] dark:bg-pink-950/40 dark:text-pink-400 border border-[#FBCFE8]/60">
                        58 → 88 ball
                      </span>
                      <span className="text-xs font-bold text-[#BE185D] dark:text-pink-400">+30 ball</span>
                    </div>
                    <div className="flex items-center gap-3 pt-1">
                      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 shadow-sm">
                        <img src="/5.png" alt="Profile" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">Mahmuda T.</h4>
                        <p className="text-xs text-slate-400 font-medium">EduContest Foydalanuvchisi • Biologiya</p>
                      </div>
                    </div>
                    <p className="text-[13px] sm:text-[14px] text-slate-600 dark:text-slate-300 font-normal leading-relaxed">
                      Tushuntirishlar batafsil berilgan bo'lib, haftalar davomida qiynalgan qiyin biologik mavzularni nihoyat to'liq tushunib yetishimga yordam berdi.
                    </p>
                  </div>

                  {/* Card 9 */}
                  <div
                    className="anim-reveal bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-[28px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all duration-300 space-y-4 cursor-default"
                    onMouseMove={handleCardTilt} onMouseLeave={handleCardReset} style={{ transformStyle: "preserve-3d" }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-[#D1FAE5] text-[#047857] dark:bg-emerald-950/40 dark:text-emerald-400 border border-[#A7F3D0]/60">
                        70% → 94%
                      </span>
                      <span className="text-xs font-bold text-[#047857] dark:text-emerald-400">+24% o'sish</span>
                    </div>
                    <div className="flex items-center gap-3 pt-1">
                      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 shadow-sm">
                        <img src="/2.png" alt="Profile" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">Madina S.</h4>
                        <p className="text-xs text-slate-400 font-medium">O'qituvchi • Informatika</p>
                      </div>
                    </div>
                    <p className="text-[13px] sm:text-[14px] text-slate-600 dark:text-slate-300 font-normal leading-relaxed">
                      EduContest men kutgandan ham ko'proq yordam berdi. Biror joyda to'xtab qolganimda AI murabbiy shunchaki javobni aytmasdan mantiqni tushuntirishi juda qimmatli.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="pt-20 pb-8 border-t border-slate-100 dark:border-slate-800" data-anim-section>
              <div className="text-center mb-16">
                <h2 className="anim-reveal text-4xl font-semibold text-slate-900 dark:text-white mb-4 uppercase tracking-tight">Ko'p so'raladigan savollar</h2>
                <p className="anim-reveal text-slate-500 dark:text-slate-400 font-medium">Platformamiz haqida eng ko'p beriladigan savollarga javoblar</p>
              </div>

              <div className="max-w-3xl mx-auto space-y-3">
                {[
                  {
                    q: "EduContest platformasi qanday yordam beradi?",
                    a: "Platformamiz pedagoglar va o'quvchilarga attestatsiya, milliy sertifikat va kirish imtihonlariga eng zamonaviy metodlar, sun'iy intellekt tahlillari va keng ko'lamli testlar bazasi orqali tayyorlanishda yordam beradi."
                  },
                  {
                    q: "Testlar darajasi haqiqiy imtihonlarga mosmi?",
                    a: "Ha, barcha testlarimiz DTM (Bilimni baholash agentligi) standartlari va milliy sertifikat talablari asosida ekspertlar tomonidan ishlab chiqilgan."
                  },
                  {
                    q: "AI yordamchi qanday ishlaydi?",
                    a: "Sun'iy intellekt har bir xato qilgan savolingizni tahlil qilib, uning yechimini tushuntirib beradi va aynan qaysi mavzularda oqsashayotganingizni aniqlab beradi."
                  },
                  {
                    q: "To'lovlar xavfsizmi?",
                    a: "Ha, platformada Payme, Click va Xazna tizimlari orqali xavfsiz to'lovlarni amalga oshirishingiz mumkin. Barcha tranzaksiyalar himoyalangan."
                  },
                  {
                    q: "Milliy sertifikat va Attestatsiya bo'yicha testlar qanchalik tez-tez yangilanadi?",
                    a: "Barcha test va savollar bazasi respublika ta'lim standartlari, Bilimni baholash agentligi (DTM) hamda Maktabgacha va maktab ta'limi vazirligi namunaviy dasturlari asosida har oy muntazam ravishda yangilab boriladi."
                  },
                  {
                    q: "Insho tekshirish (Essay Checker) modulidan qanday foydalaniladi?",
                    a: "Ona tili va adabiyoti yoki ingliz tili bo'limidagi inshongizni matn ko'rinishida kiritsangiz, sun'iy intellekt modulimiz grammatik, uslubiy hamda imlo xatolarini bir necha soniyada tahlil qilib, balliy bahosini taqdim etadi."
                  },
                  {
                    q: "Platformadan mobil telefon yoki planshet orqali foydalansa bo'ladimi?",
                    a: "Ha, EduContest platformasi barcha qurilmalar (Smartfon, planshet, kompyuter) va barcha zamonaviy brauzerlar uchun 100% moslashtirilgan hamda moslashuvchan (responsive) qilib ishlab chiqilgan."
                  },
                  {
                    q: "Platformada shaxsiy o'quv rejasini (Planner) tuzish mumkinmi?",
                    a: "Ha, sun'iy intellekt tahlillari asosida zaif nuqtalaringiz aniqlanadi va kunlik hamda haftalik moslashtirilgan shaxsiy o'quv rejasi shakllantiriladi."
                  },
                  {
                    q: "EduContest sertifikatini qayerdan yuklab olsam bo'ladi?",
                    a: "Test yoki olimpidadan muvaffaqiyatli o'tganingizdan so'ng, sertifikatingiz shaxsiy kabinetingizda tayyor bo'ladi va uni PDF formatida bir bosishda yuklab olishingiz hamda haqiqiyligini QR-kod orqali tekshirishingiz mumkin."
                  }
                ].map((faq, i) => (
                  <div key={i} className="anim-reveal group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                    <details className="w-full">
                      <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                        <span className="font-semibold text-slate-900 dark:text-white group-hover:text-[#E8192C] transition-colors text-[15px]">{faq.q}</span>
                        <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-[#E8192C] transition-transform group-open:rotate-180 shrink-0 ml-4" />
                      </summary>
                      <div className="px-5 pb-5 text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                        {faq.a}
                      </div>
                    </details>
                  </div>
                ))}
              </div>
            </section>

            {/* CTA Banner Section with FOOTER_IMG.png background */}
            <section id="cta-banner" className="pt-2 pb-12" data-anim-section>
              <div
                className="anim-reveal max-w-7xl mx-auto rounded-[32px] sm:rounded-[44px] overflow-hidden shadow-2xl relative p-8 sm:p-14 md:p-20 bg-cover bg-center bg-no-repeat space-y-8 text-center flex flex-col justify-center items-center"
                style={{ backgroundImage: "url('/FOOTER_IMG.png')" }}
              >
                {/* Semi-transparent dark overlay filter */}
                <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] pointer-events-none rounded-[32px] sm:rounded-[44px]" />

                <div className="relative z-10 max-w-3xl mx-auto space-y-6">
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-[1.2] tracking-tight">
                    {t('landing.cta_banner_title')}
                  </h2>

                  <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                    <Link
                      to="/login"
                      className="px-8 py-3.5 bg-transparent border-2 border-white/80 text-white rounded-full font-bold text-sm hover:bg-white/10 transition-all duration-300 backdrop-blur-sm"
                    >
                      {t('landing.cta_btn_signin')}
                    </Link>
                    <Link
                      to="/register"
                      className="px-8 py-3.5 bg-white text-slate-900 rounded-full font-bold text-sm hover:bg-slate-100 transition-all duration-300 shadow-xl hover:scale-105 active:scale-95"
                    >
                      {t('landing.cta_btn_signup')}
                    </Link>
                  </div>
                </div>
              </div>
            </section>

        {/* ── REDESIGNED LIGHT & DARK MODE FOOTER ── */}
        <footer className="bg-slate-50 dark:bg-[#0B0F19] text-slate-600 dark:text-slate-300 pt-14 pb-10 border-t border-slate-200 dark:border-slate-800/80 relative overflow-hidden font-sans">
          {/* Top Accent Gradient Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#E8192C] to-transparent opacity-80" />

          {/* Background Ambient Glow */}
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-10">

            {/* Main 4-Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">

              {/* Column 1: Brand & Socials */}
              <div className="space-y-4 lg:col-span-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-white p-1.5 shadow-md border border-slate-200 dark:border-transparent flex items-center justify-center">
                    <img src="/logo.png" alt="EduContest" className="w-full h-full object-contain" />
                  </div>
                  <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    EduContest<span className="text-[#E8192C]">.uz</span>
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  Milliy va Xalqaro sertifikatlar hamda DTM/BMBA imtihonlariga tayyorlanish bo'yicha O'zbekistondagi eng zamonaviy №1 AI platformasi.
                </p>

                {/* Social Icons */}
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <a
                    href="https://t.me/educontest"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Telegram Kanal"
                    className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-[#0088cc] hover:bg-[#0088cc]/10 hover:border-[#0088cc]/40 transition-all shadow-xs group"
                  >
                    <Send className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  </a>

                  <a
                    href="https://t.me/educontesttbot?start=start"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Telegram Bot"
                    className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-[#0088cc] hover:bg-[#0088cc]/10 hover:border-[#0088cc]/40 transition-all shadow-xs group"
                  >
                    <Bot className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  </a>

                  <a
                    href="https://instagram.com/educontest"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Instagram"
                    className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-[#E1306C] hover:bg-[#E1306C]/10 hover:border-[#E1306C]/40 transition-all shadow-xs group"
                  >
                    <svg className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </a>

                  <a
                    href="https://youtube.com/@educontest"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="YouTube"
                    className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-[#FF0000] hover:bg-[#FF0000]/10 hover:border-[#FF0000]/40 transition-all shadow-xs group"
                  >
                    <svg className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  </a>

                  <a
                    href="mailto:info@educontest.uz"
                    title="Email"
                    className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-300 hover:text-[#E8192C] hover:border-[#E8192C]/40 transition-all shadow-xs group"
                  >
                    <Mail className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  </a>
                </div>
              </div>

              {/* Column 2: Platforma */}
              <div>
                <h4 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-xs mb-4 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E8192C]" />
                  Platforma
                </h4>
                <ul className="space-y-2.5 text-xs">
                  <li><Link to="/tests" className="text-slate-600 dark:text-slate-400 hover:text-[#E8192C] dark:hover:text-white transition-colors font-medium hover:translate-x-1 inline-block transition-transform">Testlar Bazasi</Link></li>
                  <li><Link to="/tests?category=mock-tests" className="text-slate-600 dark:text-slate-400 hover:text-[#E8192C] dark:hover:text-white transition-colors font-medium hover:translate-x-1 inline-block transition-transform">BMBA Mock Testlar</Link></li>
                  <li><Link to="/forest-timer" className="text-slate-600 dark:text-slate-400 hover:text-[#E8192C] dark:hover:text-white transition-colors font-medium hover:translate-x-1 inline-block transition-transform">Daraxt Taymeri (Forest)</Link></li>
                  <li><Link to="/olympiads" className="text-slate-600 dark:text-slate-400 hover:text-[#E8192C] dark:hover:text-white transition-colors font-medium hover:translate-x-1 inline-block transition-transform">Respublika Olimpiadalari</Link></li>
                  <li><Link to="/leaderboard" className="text-slate-600 dark:text-slate-400 hover:text-[#E8192C] dark:hover:text-white transition-colors font-medium hover:translate-x-1 inline-block transition-transform">Umummilliy Reyting</Link></li>
                </ul>
              </div>

              {/* Column 3: Ekotizim */}
              <div>
                <h4 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-xs mb-4 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Ekotizim
                </h4>
                <ul className="space-y-2.5 text-xs">
                  <li><Link to="/contributor" className="text-slate-600 dark:text-slate-400 hover:text-[#E8192C] dark:hover:text-white transition-colors font-medium hover:translate-x-1 inline-block transition-transform">Kurs Yaratish & Sotish</Link></li>
                  <li><Link to="/account-settings" className="text-slate-600 dark:text-slate-400 hover:text-[#E8192C] dark:hover:text-white transition-colors font-medium hover:translate-x-1 inline-block transition-transform">EduCoin Hamyon</Link></li>
                  <li><Link to="/register" className="text-slate-600 dark:text-slate-400 hover:text-[#E8192C] dark:hover:text-white transition-colors font-medium hover:translate-x-1 inline-block transition-transform">QR-Kodli Sertifikatlar</Link></li>
                  <li><Link to="/universitetlar" className="text-slate-600 dark:text-slate-400 hover:text-[#E8192C] dark:hover:text-white transition-colors font-medium hover:translate-x-1 inline-block transition-transform">Universitetlar va Ballar</Link></li>
                </ul>
              </div>

              {/* Column 5: Yordam & Huquqiy */}
              <div>
                <h4 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-xs mb-4 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  Yordam
                </h4>
                <ul className="space-y-2.5 text-xs">
                  <li><Link to="/faq" className="text-slate-600 dark:text-slate-400 hover:text-[#E8192C] dark:hover:text-white transition-colors font-medium hover:translate-x-1 inline-block transition-transform">Ko'p beriladigan savollar</Link></li>
                  <li><Link to="/contacts" className="text-slate-600 dark:text-slate-400 hover:text-[#E8192C] dark:hover:text-white transition-colors font-medium hover:translate-x-1 inline-block transition-transform">Qo'llab-quvvatlash</Link></li>
                  <li><Link to="/privacy" className="text-slate-600 dark:text-slate-400 hover:text-[#E8192C] dark:hover:text-white transition-colors font-medium hover:translate-x-1 inline-block transition-transform">Maxfiylik Siyosati</Link></li>
                  <li><Link to="/terms" className="text-slate-600 dark:text-slate-400 hover:text-[#E8192C] dark:hover:text-white transition-colors font-medium hover:translate-x-1 inline-block transition-transform">Foydalanish Shartlari</Link></li>
                </ul>
              </div>

            </div>

            {/* Bottom Bar: Copyright & Payment Partners */}
            <div className="pt-8 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <div className="flex items-center gap-2">
                <p>© {new Date().getFullYear()} <strong className="text-slate-900 dark:text-white">EduContest.uz</strong>. Barcha huquqlar himoyalangan.</p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10.5px] uppercase font-extrabold tracking-wider text-slate-400 dark:text-slate-500">To'lov Tizimlari:</span>
                <div className="flex items-center gap-2">
                  <img src="/click.png" alt="Click" className="h-5 object-contain rounded bg-white px-1 py-0.5 border border-slate-200 dark:border-transparent" />
                  <img src="/payme.png" alt="Payme" className="h-5 object-contain rounded bg-white px-1 py-0.5 border border-slate-200 dark:border-transparent" />
                  <img src="/xazna.png" alt="Xazna" className="h-5 object-contain rounded bg-white px-1 py-0.5 border border-slate-200 dark:border-transparent" />
                </div>
              </div>
            </div>

          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
