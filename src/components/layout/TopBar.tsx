import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

import Logo from "./Logo";
import BottomNav from "./BottomNav";
import { ModeToggle } from "../ModeToggle";
import NotificationDropdown from "./NotificationDropdown";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation } from "react-i18next";
import { useEduCoin } from "@/hooks/useEduCoin";
import { useSubject } from "@/hooks/useSubject";
import { PaymentModal } from "@/components/PaymentModal";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { rewriteStorageUrl } from "@/lib/storage";
import {
  Menu, LayoutDashboard, Sparkles, GraduationCap, Trophy, BarChart3,
  Settings, Calculator, PenTool, Shield, LogOut, TrendingUp, X,
  Newspaper, ChevronDown, ChevronRight, Crown, Wallet, Building2, Mic, ArrowRight, Lock, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, Binary, Brain, BookOpen, History, FlaskConical, Layers, TreePine } from "lucide-react";
import { useThemeCustomizer } from "@/components/ThemeCustomizerProvider";
import { WidgetAddIcon } from "@solar-icons/react/bold-duotone/widget-add";
import { DocumentTextIcon } from "@solar-icons/react/bold-duotone/document-text";
import { SettingsIcon } from "@solar-icons/react/bold-duotone/settings";
import { WalletIcon } from "@solar-icons/react/bold-duotone/wallet";
import { BookBookmarkIcon } from "@solar-icons/react/bold-duotone/book-bookmark";
import { BookMinimalisticIcon } from "@solar-icons/react/bold-duotone/book-minimalistic";
import { ChartSquareIcon } from "@solar-icons/react/bold-duotone/chart-square";
import { CupFirstIcon } from "@solar-icons/react/bold-duotone/cup-first";
import { Buildings2Icon } from "@solar-icons/react/bold-duotone/buildings-2";
import { StarsIcon } from "@solar-icons/react/bold-duotone/stars";
import { MicrophoneIcon } from "@solar-icons/react/bold-duotone/microphone";
import { CalculatorMinimalisticIcon } from "@solar-icons/react/bold-duotone/calculator-minimalistic";
import { Pen2Icon } from "@solar-icons/react/bold-duotone/pen-2";
import { CameraMinimalisticIcon } from "@solar-icons/react/bold-duotone/camera-minimalistic";
import { Book2Icon } from "@solar-icons/react/bold-duotone/book-2";
import { ClockCircleIcon } from "@solar-icons/react/bold-duotone/clock-circle";
import { CrownIcon } from "@solar-icons/react/bold-duotone/crown";
import { GraphNewUpIcon } from "@solar-icons/react/bold-duotone/graph-new-up";
import { AltArrowRightIcon } from "@solar-icons/react/bold-duotone/alt-arrow-right";
import { DiplomaIcon } from "@solar-icons/react/bold-duotone/diploma";
import { AltArrowDownIcon } from "@solar-icons/react/bold-duotone/alt-arrow-down";
import { DollarMinimalisticIcon } from "@solar-icons/react/bold-duotone/dollar-minimalistic";
import { InfoCircleIcon } from "@solar-icons/react/bold-duotone/info-circle";
import { UserIcon } from "@solar-icons/react/bold-duotone/user";
import { ShieldIcon } from "@solar-icons/react/bold-duotone/shield";
import { LogoutIcon } from "@solar-icons/react/bold-duotone/logout";
import { CompassBigIcon } from "@solar-icons/react/bold-duotone/compass-big";
import { CodeSquareIcon } from "@solar-icons/react/bold-duotone/code-square";
import { DnaIcon } from "@solar-icons/react/bold-duotone/dna";
import { HistoryIcon } from "@solar-icons/react/bold-duotone/history";
import { AtomIcon } from "@solar-icons/react/bold-duotone/atom";
import { GlobalIcon } from "@solar-icons/react/bold-duotone/global";
import { EarthIcon } from "@solar-icons/react/bold-duotone/earth";
import { CalendarMarkIcon } from "@solar-icons/react/bold-duotone/calendar-mark";

interface EducoinPack {
  id: string;
  coins: number;
  priceUzs: number;
  label: string;
  popular?: boolean;
  badge?: string;
}

const EDUCOIN_PACKS: readonly EducoinPack[] = [
  { id: "mini", coins: 100, priceUzs: 10000, label: "Mini" },
  { id: "standart", coins: 500, priceUzs: 45000, label: "Standart", popular: true },
  { id: "premium", coins: 1000, priceUzs: 80000, label: "Premium", badge: "Eng yaxshi" },
  { id: "max", coins: 5000, priceUzs: 350000, label: "Max", badge: "Tejamkor" },
];

const subjectMeta: Record<string, { icon: any; color: string }> = {
  "Matematika": { icon: CompassBigIcon, color: "#E8192C" },
  "Informatika": { icon: CodeSquareIcon, color: "#7c3aed" },
  "Biologiya": { icon: DnaIcon, color: "#16a34a" },
  "Ona tili": { icon: Book2Icon, color: "#d97706" },
  "Tarix": { icon: HistoryIcon, color: "#dc2626" },
  "Fizika": { icon: AtomIcon, color: "#0891b2" },
  "Adabiyot": { icon: BookBookmarkIcon, color: "#db2777" },
  "Ingliz tili": { icon: GlobalIcon, color: "#2563eb" },
  "Rus tili": { icon: GlobalIcon, color: "#e11d48" },
  "Kimyo": { icon: AtomIcon, color: "#059669" },
  "Geografiya": { icon: EarthIcon, color: "#0284c7" },
  "O'zbek tili": { icon: Book2Icon, color: "#d97706" },
  "Ona tili va adabiyot": { icon: Book2Icon, color: "#9333ea" },
};

const TopBar = () => {
  const { profile, refreshProfile, user, isAdmin, signOut } = useAuth();
  const { t } = useTranslation();
  const { balance: eduBalance, streak, addEduCoins } = useEduCoin();
  const { activeSubject, setActiveSubject, subjects } = useSubject();
  const { navbarColor, navbarType, menuHidden, isNavbarDark } = useThemeCustomizer();

  const isDarkNavbar = isNavbarDark;

  const navText = isDarkNavbar ? "text-white" : "text-slate-900 dark:text-white";
  const navTextSecondary = isDarkNavbar ? "text-white/90" : "text-slate-900 dark:text-slate-100";
  const navTextMuted = isDarkNavbar ? "text-white/60" : "text-slate-600 dark:text-slate-400";
  const navHover = isDarkNavbar ? "hover:bg-white/10" : "hover:bg-gray-100 dark:hover:bg-white/10";
  const navHoverText = isDarkNavbar ? "hover:text-white" : "hover:text-slate-900 dark:hover:text-white";
  const navBg = isDarkNavbar ? "bg-white/10" : "bg-slate-100 dark:bg-slate-800/80";
  const navBorder = isDarkNavbar ? "border-white/10" : "border-slate-200 dark:border-slate-700/60";
  const navBadgeBg = isDarkNavbar ? "bg-white/10" : "bg-slate-200 dark:bg-slate-800";
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [paymentModal, setPaymentModal] = useState({ isOpen: false, amount: 0 });
  const [buyModal, setBuyModal] = useState<{ isOpen: boolean; pack: any }>({ isOpen: false, pack: null });
  const [buying, setBuying] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<{ label: string; desc: string; icon: any; path: string } | null>(null);
  const [avatarErr, setAvatarErr] = useState(false);
  const catalogTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Live looping countdown timer for 20% EduPremium promo badge
  const [promoSecondsLeft, setPromoSecondsLeft] = useState(14 * 60 + 52);

  useEffect(() => {
    const timer = setInterval(() => {
      setPromoSecondsLeft((prev) => (prev <= 1 ? 14 * 60 + 59 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const promoMinutes = String(Math.floor(promoSecondsLeft / 60)).padStart(2, '0');
  const promoSeconds = String(promoSecondsLeft % 60).padStart(2, '0');

  const handleCatalogMouseEnter = () => {
    if (window.innerWidth < 1024) return;
    if (catalogTimerRef.current) {
      clearTimeout(catalogTimerRef.current);
      catalogTimerRef.current = null;
    }
    setIsCatalogOpen(true);
  };

  const handleCatalogMouseLeave = () => {
    if (window.innerWidth < 1024) return;
    catalogTimerRef.current = setTimeout(() => {
      setIsCatalogOpen(false);
    }, 200);
  };

  const isPremium = Boolean(
    (profile?.subscription_tier && profile.subscription_tier !== "standart") ||
    (profile as any)?.is_lifetime ||
    (profile as any)?.is_premium
  );
  const avatarChar = profile?.full_name?.[0]?.toUpperCase() || "U";

  const confirmPurchase = async () => {
    if (!buyModal.pack || !user) return;
    const { coins, priceUzs } = buyModal.pack;
    if ((profile?.balance || 0) < priceUzs) {
      setBuyModal({ isOpen: false, pack: null });
      setPaymentModal({ isOpen: true, amount: priceUzs });
      return;
    }
    setBuying(true);
    try {
      const newBalance = (profile.balance || 0) - priceUzs;
      const { error } = await (supabase.from("profiles") as any).update({ balance: newBalance }).eq("user_id", user.id);
      if (error) throw error;
      await addEduCoins(coins, "purchase", "Sotib olindi");
      await refreshProfile();
      toast({ title: "Muvaffaqiyatli!", description: `${coins} EduCoin hisobingizga tushdi!` });
      setBuyModal({ isOpen: false, pack: null });
    } catch {
      toast({ title: "Xatolik ro'y berdi", variant: "destructive" });
    } finally {
      setBuying(false);
    }
  };

  const mainNavItems = [
    { label: t("dashboard.sidebar.home"), path: "/tests", icon: WidgetAddIcon },
    { label: t("topbar.planner"), path: "/planner", icon: CalendarMarkIcon },
    { label: t("dashboard.sidebar.settings"), path: "/settings", icon: SettingsIcon },
  ];

  const catalogColumns = [
    {
      heading: "Fanlar",
      headingIcon: GraduationCap,
      isSubjects: true,
    },
    {
      heading: "Test & Tahlil",
      headingIcon: TrendingUp,
      items: [
        { label: "Test ishlash", path: "/tests", icon: GraduationCap, desc: "Fanlar bo'yicha" },
        { label: "Kurslar", path: "/courses", icon: BookOpen, desc: "Video darslar va kurslar" },
        { label: "Natijalar", path: "/results", icon: BarChart3, desc: "Test tarixi" },
        { label: t("topbar.planner"), path: "/planner", icon: Calendar, desc: t("topbar.planner_desc") },
        { label: "Universitetlar", path: "/universitetlar", icon: Building2, desc: "Xususiy OTMlar" },
      ],
    },
    {
      heading: "AI Xizmatlar",
      headingIcon: Sparkles,
      items: [
        { label: "Eduly AI", path: "/ai", icon: Sparkles, desc: "AI yordamchi" },
        { label: "AI Mentor", path: "/ai-mentor", icon: Mic, desc: "Ovozli AI ustoz", badge: "NEW", pro: true },
        { label: "Essay Check", path: "/essay-checker", icon: PenTool, desc: "Insholarni tekshirish", badge: "NEW" },
        { label: "Math Scan", path: "/math-solver", icon: Calculator, desc: "AI bilan masala yechish", badge: "NEW" },
        { label: "Tezkor Lu'gat", path: "/lugat", icon: BookOpen, desc: "So'zlash va lug'at", badge: "NEW" },
        { label: "Daraxt Taymeri", path: "/forest-timer", icon: TreePine, desc: "Diqqat taymeri", badge: "NEW" },
      ],
    },
  ];

  if (menuHidden) return null;

  const isCustomNavbarColor = Boolean(
    navbarColor &&
    navbarColor !== "#FFFFFF" &&
    navbarColor !== "#ffffff"
  );

  const navbarStyle: React.CSSProperties = isCustomNavbarColor ? {
    backgroundColor: navbarColor,
    color: "var(--navbar-text)",
    borderColor: "var(--navbar-border)",
  } : {};

  const isFloating = navbarType === "floating";
  const isStatic = navbarType === "static";
  const positionClass = isStatic ? "relative" : isFloating ? "fixed top-2 mx-2 rounded-2xl shadow-lg" : "fixed";
  
  const isResultsPage = location.pathname.startsWith('/results');

  return (
    <>
    <header
      className={`${positionClass} top-0 left-0 right-0 z-50 h-[48px] sm:h-[56px] w-full border-b shadow-[0_1px_2px_rgba(0,0,0,0.03)] bg-white/95 dark:bg-[#0A0A0A]/95 border-gray-200/80 dark:border-white/[0.08] backdrop-blur-md transition-colors duration-300 ${isFloating ? "rounded-2xl" : ""} ${isResultsPage ? "hidden lg:block" : ""}`}
      style={navbarStyle}
    >
      <div className="h-full px-2 sm:px-4 flex items-center justify-between gap-1 sm:gap-3 max-w-screen-2xl mx-auto min-w-0">

        {/* ── LEFT: Logo + Katalog ── */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 min-w-0">
          <Link to="/dashboard" className="shrink-0">
            <Logo hideTextOnMobile={true} variant={isNavbarDark ? "light" : "dark"} />
          </Link>

          {/* Divider */}
          <div className={cn("h-4 w-px hidden sm:block", isNavbarDark ? "bg-white/10" : "bg-gray-300 dark:bg-white/10")} />

          {/* Katalog trigger with mouse hover */}
          <div
            onMouseEnter={handleCatalogMouseEnter}
            onMouseLeave={handleCatalogMouseLeave}
            className="hidden sm:flex relative items-center"
          >
            <button
              onClick={() => {
                if (window.innerWidth < 1024) {
                  setIsMobileMenuOpen(prev => !prev);
                } else {
                  setIsCatalogOpen(prev => !prev);
                }
              }}
              className={cn(
                "flex items-center gap-1.5 text-xs sm:text-[13px] font-extrabold transition-all px-3.5 py-1.5 rounded-full cursor-pointer select-none border shadow-2xs",
                (isCatalogOpen || isMobileMenuOpen)
                  ? "text-[#E8192C] bg-red-50 dark:bg-red-500/20 border-red-200 dark:border-red-500/30 shadow-xs"
                  : "text-[#E8192C] bg-red-50/70 dark:bg-red-500/10 border-red-100 dark:border-red-500/20 hover:bg-red-50 dark:hover:bg-red-500/20"
              )}
            >
              <span>{t("topbar.catalog")}</span>
              <AltArrowDownIcon
                size={14}
                className={cn("transition-transform duration-200 text-[#E8192C]", (isCatalogOpen || isMobileMenuOpen) && "rotate-180")}
              />
            </button>
          </div>
        </div>

        {/* ── CENTER: Desktop Nav ── */}
        <nav className="hidden lg:flex items-center gap-1 h-full">
          {mainNavItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== "/" && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "relative flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-[13px] font-bold rounded-full transition-all border my-auto shadow-2xs",
                  isActive
                    ? "text-[#E8192C] bg-red-50 dark:bg-red-500/20 border-red-200/80 dark:border-red-500/30 font-extrabold"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-white/5 border-transparent"
                )}
              >
                <item.icon size={16} className={cn("shrink-0", isActive ? "text-[#E8192C]" : "opacity-70")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* ── 20% CHEGIRMA EDUPREMIUM COUNTDOWN PROMO BADGE (Solar Icons & Amber Theme, Desktop Only) ── */}
        <div
          onClick={() => navigate("/settings/obuna")}
          title="20% chegirma bilan EduPremium obunasiga ega bo'ling!"
          className="hidden md:flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full cursor-pointer select-none border transition-all duration-300 hover:scale-[1.03] active:scale-95 shadow-2xs bg-gradient-to-r from-amber-500/15 via-yellow-500/15 to-amber-500/15 hover:from-amber-500/25 hover:to-yellow-500/25 border-amber-300/80 dark:border-amber-500/40 text-slate-900 dark:text-white shrink-0 my-auto"
        >
          <span className="flex items-center gap-1 text-[11px] sm:text-xs font-black text-amber-600 dark:text-amber-400">
            <CrownIcon className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
            <span>20% chegirma</span>
          </span>

          <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 hidden md:inline flex items-center gap-0.5">
            <span>EduPremium</span>
            <StarsIcon className="w-3 h-3 text-yellow-500 inline" />
          </span>

          <div className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-mono font-black text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full shadow-2xs">
            <ClockCircleIcon className="w-3.5 h-3.5 text-slate-950 animate-spin" style={{ animationDuration: '4s' }} />
            <span>{promoMinutes}:{promoSeconds}</span>
          </div>
        </div>

        {/* ── RIGHT: Tools ── */}
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          <div className="flex items-center">
            <LanguageSwitcher isNavbarDark={isNavbarDark} />
          </div>

          <ModeToggle isNavbarDark={isNavbarDark} />

          {/* Wallet balance */}
          <button
            onClick={() => navigate("/wallet")}
            title="Hamyon"
            className={cn("flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 sm:py-1.5 rounded-md sm:rounded-lg text-[10px] sm:text-[11px] font-semibold transition-colors border border-transparent shrink-0", navTextSecondary, navBg, navHover, isNavbarDark ? "hover:border-white/10" : "hover:border-gray-300")}
          >
            <WalletIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" />
            <span className={cn(navText, "text-[10px] sm:text-[11px] font-bold")}>
              {profile?.balance !== undefined && profile?.balance !== null
                ? profile.balance >= 100000
                  ? `${Math.round(profile.balance / 1000)}k`
                  : profile.balance.toLocaleString()
                : 0}
            </span>
          </button>

          {/* EduCoin balance */}
          <button
            onClick={() => setBuyModal({ isOpen: true, pack: null })}
            title="EduCoinlar"
            className={cn("flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 sm:py-1.5 rounded-md sm:rounded-lg text-[10px] sm:text-[11px] font-semibold transition-colors border border-transparent shrink-0", navTextSecondary, navBg, navHover, isNavbarDark ? "hover:border-white/10" : "hover:border-gray-300")}
          >
            <DollarMinimalisticIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0" />
            <span className={cn(navText, "text-[10px] sm:text-[11px] font-bold")}>{eduBalance}</span>
          </button>

          <NotificationDropdown isNavbarDark={isNavbarDark} />

          {/* Avatar / Profile popover */}
          <Popover>
            <PopoverTrigger asChild>
              <button className={cn(
                "flex items-center gap-0.5 rounded-full transition-all shrink-0 relative outline-none cursor-pointer",
                isPremium
                  ? "p-[2px] bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-600 shadow-[0_0_10px_rgba(244,63,94,0.35)]"
                  : cn("p-0.5 sm:pl-1 sm:pr-0.5 border", isNavbarDark ? "border-white/10 hover:border-white/20" : "border-gray-200 hover:border-gray-300")
              )}>
                <div className={cn(
                  "relative rounded-full overflow-hidden shrink-0",
                  isPremium ? "w-6 h-6 sm:w-7 sm:h-7 border border-white dark:border-[#0A0A0A]" : "w-6 h-6 sm:w-7 sm:h-7",
                  isNavbarDark ? "bg-white/10" : "bg-gray-100"
                )}>
                  {profile?.avatar_url && !avatarErr ? (
                    <img 
                      src={rewriteStorageUrl(profile.avatar_url)} 
                      alt="" 
                      referrerPolicy="no-referrer"
                      onError={() => setAvatarErr(true)}
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className={cn("w-full h-full flex items-center justify-center text-[9px] sm:text-[10px] font-bold", navTextMuted)}>
                      {avatarChar}
                    </div>
                  )}
                </div>

                {/* PRO Crown Badge */}
                {isPremium && (
                  <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center border border-white dark:border-[#0A0A0A] shadow-xs">
                    <CrownIcon size={9} className="text-white" />
                  </span>
                )}

                <AltArrowDownIcon size={14} className={cn("mr-0.5 hidden xs:block", isPremium ? "text-amber-500 font-bold ml-0.5" : navTextMuted)} />
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-56 p-1.5 rounded-2xl border border-gray-100 dark:border-white/10 shadow-xl bg-white dark:bg-[#111]"
              align="end"
            >
              {/* User info */}
              <div className="px-3 py-2.5 mb-1">
                <p className="text-[13px] font-bold truncate text-gray-900 dark:text-white">
                  {profile?.full_name || "Foydalanuvchi"}
                </p>
                <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mt-0.5">
                  {profile?.role || (isAdmin || user?.email === 'xudayberganovbackend@gmail.com' ? "ADMIN" : "FOYDALANUVCHI")}
                </p>
              </div>
              <div className="h-px bg-gray-100 dark:bg-white/5 mx-1 mb-1" />
              <div className="space-y-0.5">
                <Link
                  to="/profile"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <UserIcon size={18} className="text-[#C8001A]" />
                  {t("topbar.profile")}
                </Link>
                {(isAdmin || profile?.role === "admin" || user?.email === "xudayberganovbackend@gmail.com") && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-[#C8001A] hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  >
                    <ShieldIcon size={18} className="text-[#C8001A]" />
                    {t("topbar.admin_panel")}
                  </Link>
                )}
                <div className="h-px bg-gray-100 dark:bg-white/5 mx-1 my-1" />
                <button
                  onClick={signOut}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-[#C8001A] hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                >
                  <LogoutIcon size={18} className="text-[#C8001A]" />
                  {t("topbar.logout")}
                </button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Mobile bottom nav spacer - hamburger moved to bottom */}
        </div>
      </div>
    </header>

      {/* ── CATALOG MEGA MENU ── */}
      <AnimatePresence>
        {isCatalogOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setIsCatalogOpen(false)}
              className="fixed inset-0 top-[60px] hidden lg:block"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              onMouseEnter={handleCatalogMouseEnter}
              onMouseLeave={handleCatalogMouseLeave}
              className="fixed top-[56px] left-0 right-0 hidden lg:block z-[100] border-b border-gray-100 dark:border-white/[0.06] bg-white dark:bg-[#0A0A0A] shadow-lg"
            >
              <div
                className="max-w-screen-2xl mx-auto px-5 py-6 flex gap-8"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Preview Card */}
                <div className="w-[280px] shrink-0 hidden xl:block">
                  {hoveredItem ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-white/5 dark:to-white/[0.02] rounded-2xl p-6 border border-gray-100 dark:border-white/[0.06]"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-[#C8001A]/10 flex items-center justify-center mb-4 shadow-xs">
                        <hoveredItem.icon size={28} className="text-[#C8001A]" />
                      </div>
                      <h3 className="text-base font-extrabold text-gray-900 dark:text-white mb-2">{hoveredItem.label}</h3>
                      <p className="text-[12.5px] text-gray-600 dark:text-gray-300 font-medium leading-relaxed mb-4">{hoveredItem.desc}</p>
                      <Link
                        to={hoveredItem.path}
                        onClick={() => setIsCatalogOpen(false)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#C8001A] text-white text-[12.5px] font-extrabold rounded-xl hover:bg-[#C41420] transition-colors shadow-xs"
                      >
                        O'tish <AltArrowRightIcon size={16} />
                      </Link>
                    </motion.div>
                  ) : (
                    <div className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-white/5 dark:to-white/[0.02] rounded-2xl p-6 border border-gray-100 dark:border-white/[0.06]">
                      <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-4 shadow-xs">
                        <StarsIcon size={28} className="text-[#C8001A]" />
                      </div>
                      <h3 className="text-base font-extrabold text-gray-900 dark:text-white mb-2">Bo'limlarni o'rganing</h3>
                      <p className="text-[12.5px] text-gray-600 dark:text-gray-300 font-medium leading-relaxed">Menyuda bo'limlarni bossangiz, bu yerda batafsil ma'lumot ko'rinadi</p>
                    </div>
                  )}
                </div>

                {/* 3 Column Grid */}
                <div className="grid grid-cols-12 gap-6 flex-1">
                  {/* Col 1: Subjects (Spans 5 cols) */}
                  <div className="col-span-5">
                    <p className="text-[12px] font-extrabold text-gray-600 dark:text-gray-300 uppercase tracking-[0.12em] flex items-center gap-2 mb-3.5">
                      <DiplomaIcon size={20} className="text-[#E8192C]" />
                      {t("topbar.subjects")}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {subjects.map((subject) => {
                        const meta = subjectMeta[subject.name] || { icon: GraduationCap, color: "#9ca3af" };
                        const Icon = meta.icon;
                        const subjName = subject.name || subject.id;
                        const isActive = activeSubject === subjName;
                        return (
                          <button
                            key={subject.id || subject.name}
                            onClick={() => {
                              setActiveSubject(subjName);
                              navigate("/tests");
                              setIsCatalogOpen(false);
                            }}
                            onMouseEnter={() => setHoveredItem({ label: subjName, desc: `${subjName} fanidan testlar va mashqlar`, icon: Icon, path: "/tests" })}
                            onMouseLeave={() => setHoveredItem(null)}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all duration-200 group border cursor-pointer font-bold ${
                              isActive
                                ? "bg-[#E8192C]/10 border-[#E8192C]/40 text-[#E8192C]"
                                : "bg-slate-50/80 dark:bg-white/[0.03] border-slate-200/70 dark:border-white/[0.08] text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.15]"
                            }`}
                          >
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                              style={{ backgroundColor: `${meta.color}18` }}
                            >
                              <Icon size={18} style={{ color: meta.color }} />
                            </div>
                            <span className="text-[13px] truncate flex-1 font-bold">
                              {subjName}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => { setActiveSubject(null); navigate("/tests"); setIsCatalogOpen(false); }}
                      className="mt-3 w-full text-[12.5px] font-extrabold text-[#E8192C] hover:underline transition-all text-left px-2 py-1 flex items-center gap-1.5"
                    >
                      {t("topbar.all_subjects")} <AltArrowRightIcon size={16} />
                    </button>
                  </div>

                  {/* Col 2: Test & Tahlil */}
                  <div className="col-span-3">
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.12em] flex items-center gap-1.5 mb-3">
                      <GraphNewUpIcon size={18} className="text-[#C8001A]" />
                      {t("topbar.test_analysis")}
                    </p>
                    <div className="space-y-0.5">
                      {[
                        { label: t("topbar.test_work"), path: "/tests", icon: BookBookmarkIcon, desc: t("topbar.test_work_desc") },
                        { label: t("topbar.courses"), path: "/courses", icon: BookMinimalisticIcon, desc: t("topbar.courses_desc") },
                        { label: t("topbar.results"), path: "/results", icon: ChartSquareIcon, desc: t("topbar.results_desc") },
                        { label: t("topbar.planner"), path: "/planner", icon: CalendarMarkIcon, desc: t("topbar.planner_desc") },
                        { label: t("topbar.universities"), path: "/universitetlar", icon: Buildings2Icon, desc: t("topbar.universities_desc") },
                      ].map((item: any) => (
                        item.comingSoon ? (
                          <button
                            key={item.label}
                            onClick={() => { toast({ title: t("topbar.coming_soon"), description: t("topbar.olympiads_desc") }); setIsCatalogOpen(false); }}
                            onMouseEnter={() => setHoveredItem(item)}
                            onMouseLeave={() => setHoveredItem(null)}
                            className="flex items-start gap-3 px-3 py-2.5 rounded-lg opacity-60 hover:opacity-80 hover:bg-gray-50 dark:hover:bg-white/5 transition-all cursor-pointer text-left w-full"
                          >
                            <item.icon size={20} className="text-slate-600 dark:text-slate-300 mt-0.5 shrink-0" />
                            <div className="flex-1">
                              <p className="text-[13px] font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                                {item.label}
                                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500">{t("topbar.coming_soon")}</span>
                              </p>
                              <p className="text-[11px] text-gray-400">{item.desc}</p>
                            </div>
                          </button>
                        ) : (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={(e) => {
                              if (item.pro && !isPremium) {
                                e.preventDefault();
                                toast({ title: t("topbar.premium"), description: t("topbar.premium_desc") });
                                navigate("/settings/obuna");
                              }
                              setIsCatalogOpen(false);
                            }}
                            onMouseEnter={() => setHoveredItem(item)}
                            onMouseLeave={() => setHoveredItem(null)}
                            className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
                          >
                            <item.icon size={20} className="text-slate-600 dark:text-slate-300 group-hover:text-[#C8001A] transition-colors mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-[13px] font-bold text-gray-800 dark:text-gray-200">{item.label}</p>
                                {'badge' in item && item.badge && (
                                  <span className="px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-full leading-none bg-red-50 dark:bg-red-500/10 text-[#C8001A]">
                                    {item.badge}
                                  </span>
                                )}
                                {item.pro && !isPremium && (
                                  <CrownIcon size={14} className="text-amber-500 shrink-0" />
                                )}
                              </div>
                              <p className="text-[11px] text-gray-500">{item.desc}</p>
                            </div>
                          </Link>
                        )
                      ))}
                    </div>
                  </div>

                  {/* Col 3: AI Xizmatlar (Spans 4 cols) */}
                  <div className="col-span-4">
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.12em] flex items-center gap-1.5 mb-3">
                      <StarsIcon size={18} className="text-[#C8001A]" />
                      {t("topbar.ai_services")}
                    </p>
                    <div className="space-y-0.5 mb-4">
                      {[
                        { label: t("topbar.eduly_ai"), path: "/ai", icon: StarsIcon, desc: t("topbar.eduly_ai_desc") },
                        { label: t("topbar.ai_mentor"), path: "/ai-mentor", icon: MicrophoneIcon, desc: t("topbar.ai_mentor_desc"), badge: t("topbar.new"), pro: true },
                        { label: t("topbar.essay_check"), path: "/essay-checker", icon: Pen2Icon, desc: t("topbar.essay_check_desc"), badge: t("topbar.new") },
                        { label: t("topbar.math_scan"), path: "/math-solver", icon: CameraMinimalisticIcon, desc: t("topbar.math_scan_desc"), badge: t("topbar.new") },
                        { label: t("topbar.vocabulary"), path: "/lugat", icon: Book2Icon, desc: t("topbar.vocabulary_desc"), badge: t("topbar.new") },
                        { label: t("topbar.forest_timer"), path: "/forest-timer", icon: ClockCircleIcon, desc: t("topbar.forest_timer_desc"), badge: t("topbar.new") },
                      ].map((item: any) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={(e) => {
                            if (item.pro && !isPremium) {
                              e.preventDefault();
                              toast({ title: t("topbar.premium"), description: t("topbar.premium_desc") });
                              navigate("/settings/obuna");
                            }
                            setIsCatalogOpen(false);
                          }}
                          onMouseEnter={() => setHoveredItem(item)}
                          onMouseLeave={() => setHoveredItem(null)}
                          className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
                        >
                          <item.icon size={20} className="text-slate-600 dark:text-slate-300 group-hover:text-[#C8001A] transition-colors mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-[13px] font-bold text-gray-800 dark:text-gray-200">{item.label}</p>
                              {item.badge && (
                                <span className="px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-full leading-none bg-red-50 dark:bg-red-500/10 text-[#C8001A]">
                                  {item.badge}
                                </span>
                              )}
                              {item.pro && !isPremium && (
                                <CrownIcon size={14} className="text-amber-500 shrink-0" />
                              )}
                            </div>
                            <p className="text-[11px] text-gray-500">{item.desc}</p>
                          </div>
                        </Link>
                      ))}
                    </div>

                    {/* Premium strip */}
                    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-slate-100 dark:border-white/[0.08] bg-slate-50/80 dark:bg-white/[0.04] mt-3 shadow-2xs">
                      <CrownIcon size={20} className="text-amber-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-extrabold text-slate-900 dark:text-white">{t("topbar.premium")}</p>
                        <p className="text-[10px] text-slate-400 font-medium truncate">{t("topbar.premium_desc")}</p>
                      </div>
                      <button
                        onClick={() => { navigate("/settings/obuna"); setIsCatalogOpen(false); }}
                        className="shrink-0 px-4 py-1.5 bg-[#E8192C] hover:bg-[#C41420] text-white text-[11px] font-extrabold rounded-full transition-colors shadow-xs cursor-pointer"
                      >
                        {t("topbar.details")}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── MOBILE MENU (opens upward) ── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90] lg:hidden"
            />
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="fixed top-0 bottom-[62px] left-0 right-0 bg-white dark:bg-[#111927] shadow-2xl overflow-y-auto scrollbar-thin z-[100] p-5 pb-10"
            >
              <div className="space-y-5">
                {/* Nav links */}
                <div>
                  <p className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 px-1">{t("topbar.menu")}</p>
                  <div className="space-y-1">
                    {[
                      { label: t("dashboard.sidebar.home"), path: "/dashboard", icon: WidgetAddIcon },
                      { label: t("topbar.planner"), path: "/planner", icon: CalendarMarkIcon },
                      { label: t("dashboard.sidebar.settings"), path: "/settings", icon: SettingsIcon },
                      { label: t("topbar.courses"), path: "/courses", icon: BookMinimalisticIcon },
                      { label: t("topbar.test_work"), path: "/tests", icon: BookBookmarkIcon },
                      { label: t("topbar.results"), path: "/results", icon: GraphNewUpIcon },
                      { label: t("topbar.eduly_ai"), path: "/ai", icon: StarsIcon },
                      { label: t("topbar.ai_mentor"), path: "/ai-mentor", icon: MicrophoneIcon, pro: true },
                      { label: t("topbar.essay_check"), path: "/essay-checker", icon: Pen2Icon },
                      { label: t("topbar.math_scan"), path: "/math-solver", icon: CameraMinimalisticIcon },
                      { label: t("topbar.vocabulary"), path: "/lugat", icon: Book2Icon },
                      { label: t("topbar.universities"), path: "/universitetlar", icon: Buildings2Icon },
                    ].map((item, idx) => {
                      const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
                      const IconComponent = item.icon;
                      return (
                        <Link
                          key={idx}
                          to={item.path}
                          onClick={(e) => {
                            if ((item as any).pro && !isPremium) {
                              e.preventDefault();
                              toast({ title: t("topbar.premium"), description: t("topbar.premium_desc") });
                              navigate("/settings/obuna");
                            }
                            setIsMobileMenuOpen(false);
                          }}
                          className={cn(
                            "flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-[13.5px] font-bold transition-all",
                            isActive
                              ? "text-[#E8192C] bg-red-50 dark:bg-red-500/10 border border-red-200/50 dark:border-red-500/20"
                              : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5"
                          )}
                        >
                          {IconComponent && (
                            <IconComponent
                              size={20}
                              className={cn("shrink-0", isActive ? "text-[#E8192C]" : "text-slate-500 dark:text-slate-400")}
                            />
                          )}
                          <span className="flex-1">{item.label}</span>
                          {(item as any).pro && !isPremium && (
                            <CrownIcon size={16} className="text-amber-500 shrink-0 ml-auto" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── BUY MODAL ── */}
      <Dialog open={buyModal.isOpen} onOpenChange={(open) => setBuyModal((p) => ({ ...p, isOpen: open, pack: open ? p.pack : null }))}>
        <DialogContent className="max-w-md rounded-2xl border border-gray-100 dark:border-white/10 p-6">
          {!buyModal.pack ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-[15px] font-semibold text-gray-900 dark:text-white">{t("topbar.premium")} EduCoin</DialogTitle>
              </DialogHeader>
              <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-500/10 rounded-xl px-4 py-3 mt-3 mb-5">
                <InfoCircleIcon size={20} className="text-amber-500 shrink-0" />
                <span className="text-[13px] font-medium text-amber-800 dark:text-amber-300">{t("dashboard.main.wallet_balance")}: <strong>{eduBalance} EC</strong></span>
              </div>
              <div className="space-y-3">
                {EDUCOIN_PACKS.map((pack) => (
                  <button
                    key={pack.id}
                    onClick={() => setBuyModal({ isOpen: true, pack })}
                    className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-white/10 hover:border-[#C8001A] dark:hover:border-[#C8001A] hover:bg-red-50 dark:hover:bg-red-500/5 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                        <DollarMinimalisticIcon size={22} className="text-amber-500" />
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-semibold text-gray-900 dark:text-white">{pack.coins} EC</span>
                          {pack.badge && (
                            <span className="text-[9px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md">{pack.badge}</span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400">{pack.priceUzs.toLocaleString()} UZS</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-gray-400">{pack.label}</p>
                      <p className="text-[11px] font-medium text-emerald-600">
                        {(pack.coins / (pack.priceUzs / 1000)).toFixed(1)} EC/1k so'm
                      </p>
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setBuyModal({ isOpen: false, pack: null })}
                className="w-full mt-4 py-2.5 text-[12px] font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                {t("tests.modals.cancel")}
              </button>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">{t("tests.modals.buy_title")}?</DialogTitle>
              </DialogHeader>
              <p className="text-[13px] text-gray-600 dark:text-gray-400 mt-2 mb-6 text-center">
                {t("tests.modals.buy_desc")}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setBuyModal((p) => ({ ...p, pack: null }))}
                  disabled={buying}
                  className="py-2.5 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 rounded-xl text-[12px] font-medium hover:bg-gray-200 transition-colors"
                >
                  {t("common.back")}
                </button>
                <button
                  onClick={confirmPurchase}
                  disabled={buying}
                  className="py-2.5 bg-[#C8001A] hover:bg-red-700 text-white rounded-xl text-[12px] font-medium transition-colors"
                >
                  {buying ? "..." : t("tests.modals.buy_btn")}
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <PaymentModal
        isOpen={paymentModal.isOpen}
        onClose={() => setPaymentModal({ ...paymentModal, isOpen: false })}
        amount={paymentModal.amount}
        profile={profile}
      />

      {/* Mobile bottom nav (all screens) */}
      <BottomNav isMobileMenuOpen={isMobileMenuOpen} onToggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} showHamburger={true} />
    </>
  );
};

export default TopBar;