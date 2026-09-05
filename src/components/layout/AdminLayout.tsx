import { useState, useEffect } from "react";
import { Link, useLocation, Outlet, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import {
  ShieldCheck, FileText, Users, BookOpen, Settings, ArrowLeft,
  LayoutDashboard, Rss, Bell, Menu, X, Wallet, Plus,
  Award, BarChart3, Sun, Moon, Building2, Grid3X3, MessageSquare,
  AlertTriangle, Megaphone, BarChart,
  ChevronDown, Search, LogOut, CircleDot, CheckCircle
} from "lucide-react";
import { DocumentTextIcon } from "@solar-icons/react/bold-duotone/document-text";
import { AddSquareIcon } from "@solar-icons/react/bold-duotone/add-square";
import { MedalRibbonStarIcon } from "@solar-icons/react/bold-duotone/medal-ribbon-star";
import { CheckCircleIcon } from "@solar-icons/react/bold-duotone/check-circle";
import { FeedIcon as RssIcon } from "@solar-icons/react/bold-duotone/feed";
import { Widget5Icon } from "@solar-icons/react/bold-duotone/widget-5";
import { UsersGroupTwoRoundedIcon } from "@solar-icons/react/bold-duotone/users-group-two-rounded";
import { DangerTriangleIcon } from "@solar-icons/react/bold-duotone/danger-triangle";
import { ChatSquareIcon } from "@solar-icons/react/bold-duotone/chat-square";
import { WalletIcon } from "@solar-icons/react/bold-duotone/wallet";
import { GraphIcon } from "@solar-icons/react/bold-duotone/graph";
import { Buildings2Icon } from "@solar-icons/react/bold-duotone/buildings-2";
import { SirenRoundedIcon as MegaphoneIcon } from "@solar-icons/react/bold-duotone/siren-rounded";
import { SettingsIcon } from "@solar-icons/react/bold-duotone/settings";
import { useAuth } from "@/hooks/useAuth";
import { useThemeCustomizer } from "@/components/ThemeCustomizerProvider";

interface NavItem {
  title: string;
  icon: any;
  path: string;
  key: string;
  color: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const getNavGroups = (t: any): NavGroup[] => [
  {
    label: t("admin_nav.main"),
    items: [
      { title: t("admin_nav.dashboard"), icon: Widget5Icon, path: "/admin", key: "dashboard", color: "text-violet-500" },
    ],
  },
  {
    label: t("admin_nav.education"),
    items: [
      { title: t("admin_nav.tests"), icon: DocumentTextIcon, path: "/admin/tests", key: "tests", color: "text-blue-500" },
      { title: t("admin_nav.builder"), icon: AddSquareIcon, path: "/admin/tests/builder", key: "builder", color: "text-emerald-500" },
      { title: t("admin_nav.mock_tests"), icon: MedalRibbonStarIcon, path: "/admin/mock-tests", key: "mock_tests", color: "text-indigo-500" },
      { title: t("admin_nav.moderation"), icon: CheckCircleIcon, path: "/admin/moderation", key: "moderation", color: "text-amber-500" },
    ],
  },
  {
    label: t("admin_nav.content"),
    items: [
      { title: t("admin_nav.blog"), icon: RssIcon, path: "/admin/blog", key: "blog", color: "text-cyan-500" },
      { title: t("admin_nav.catalog"), icon: Widget5Icon, path: "/admin/catalog", key: "catalog", color: "text-teal-500" },
      { title: t("admin_nav.universities"), icon: Buildings2Icon, path: "/admin/universities", key: "universities", color: "text-orange-500" },
      { title: t("admin_nav.announcements"), icon: MegaphoneIcon, path: "/admin/announcements", key: "announcements", color: "text-pink-500" },
    ],
  },
  {
    label: t("admin_nav.users"),
    items: [
      { title: t("admin_nav.users_list"), icon: UsersGroupTwoRoundedIcon, path: "/admin/users", key: "users", color: "text-emerald-500" },
      { title: t("admin_nav.complaints"), icon: DangerTriangleIcon, path: "/admin/complaints", key: "complaints", color: "text-amber-500" },
      { title: t("admin_nav.feedback"), icon: ChatSquareIcon, path: "/admin/feedback", key: "feedback", color: "text-blue-500" },
    ],
  },
  {
    label: t("admin_nav.system"),
    items: [
      { title: t("admin_nav.finance"), icon: WalletIcon, path: "/admin/finance", key: "finance", color: "text-amber-500" },
      { title: t("admin_nav.analytics"), icon: GraphIcon, path: "/admin/analytics", key: "analytics", color: "text-rose-500" },
      { title: "Qo'llanma", icon: DocumentTextIcon, path: "/admin/guide", key: "guide", color: "text-blue-500" },
      { title: t("admin_nav.settings"), icon: SettingsIcon, path: "/admin/settings", key: "settings", color: "text-slate-500" },
    ],
  },
];

const AdminLayout = () => {
  const { user, isAdmin, isSubAdmin, profile, loading } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { navbarColor, contentWidth } = useThemeCustomizer();
  const isDark = theme === "dark";
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const { data: notificationCounts } = useQuery({
    queryKey: ["admin-sidebar-notifications"],
    queryFn: async () => {
      const [complaints, feedback] = await Promise.all([
        supabase.from("complaints").select("id", { count: "exact" }).eq("status", "pending"),
        supabase.from("platform_feedback").select("id", { count: "exact" }),
      ]);
      return {
        complaints: complaints.count || 0,
        feedback: feedback.count || 0,
      };
    },
    refetchInterval: 30000,
  });

  const hasNotifications = (notificationCounts?.complaints || 0) > 0 || (notificationCounts?.feedback || 0) > 0;

  const NAV_GROUPS = getNavGroups(t);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  if (loading && !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-[#0B0F1A]">
        <div className="w-8 h-8 border-2 border-[#E8192C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isUserAdmin = isAdmin || isSubAdmin || profile?.role === "admin" || profile?.role === "super_admin" || Boolean(user);

  const canSeeItem = (key: string) => {
    if (isUserAdmin) return true;
    const perms = profile?.permissions || [];
    return perms.includes(key) || key === "dashboard";
  };

  const isActive = (path: string) =>
    path === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(path);

  const currentPage = NAV_GROUPS.flatMap((g) => g.items).find((i) => isActive(i.path));

  return (
    <div className="flex h-screen overflow-hidden font-jakarta bg-slate-50 dark:bg-[#0B0F1A]">
      {/* SIDEBAR — Desktop */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 h-full border-r border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#080C14] transition-all duration-300 ${
          sidebarOpen ? "w-[240px]" : "w-[68px]"
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-4 border-b border-slate-100 dark:border-white/[0.04]">
          <Link to="/admin" className="flex items-center gap-3 min-w-0">
            <img src="/logo.png" alt="EduContest" className="w-8 h-8 object-contain shrink-0" />
            {sidebarOpen && (
              <div className="min-w-0">
                <h1 className="text-[13px] font-bold text-slate-900 dark:text-white truncate">EduContest</h1>
                <p className="text-[9px] font-bold text-[#E8192C] uppercase tracking-widest">Admin Panel</p>
              </div>
            )}
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 transition-colors"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${sidebarOpen ? "rotate-90" : "-rotate-90"}`} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-4 scrollbar-hide">
          {NAV_GROUPS.map((group) => {
            const visibleItems = group.items.filter((item) => canSeeItem(item.key));
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.label}>
                {sidebarOpen && (
                  <p className="px-3 mb-1.5 text-[9px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em]">
                    {group.label}
                  </p>
                )}
                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const active = isActive(item.path);
                    const IconComponent = item.icon;
                    return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`flex items-center justify-between px-3 h-9 rounded-lg text-[12px] font-medium transition-all ${
                            active
                              ? "shadow-sm"
                              : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5"
                          }`}
                          style={active ? { backgroundColor: navbarColor, color: "var(--navbar-text)" } : undefined}
                          title={!sidebarOpen ? item.title : undefined}
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            {IconComponent && <IconComponent size={18} className={`shrink-0 ${active ? "" : item.color}`} />}
                            {sidebarOpen && <span className="truncate">{item.title}</span>}
                          </div>
                          {sidebarOpen && item.key === "complaints" && (notificationCounts?.complaints || 0) > 0 && (
                            <span className="shrink-0 flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[#E8192C] text-white text-[10px] font-bold">
                              {notificationCounts?.complaints}
                            </span>
                          )}
                          {sidebarOpen && item.key === "feedback" && (notificationCounts?.feedback || 0) > 0 && (
                            <span className="shrink-0 flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[#E8192C] text-white text-[10px] font-bold">
                              {notificationCounts?.feedback}
                            </span>
                          )}
                        </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Bottom */}
        {sidebarOpen && (
          <div className="p-3 border-t border-slate-100 dark:border-white/[0.04]">
            <Link
              to="/"
              className="flex items-center gap-3 px-3 h-9 rounded-lg text-[12px] font-medium text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t("admin_nav.back_to_site")}</span>
            </Link>
          </div>
        )}
      </aside>

      {/* MOBILE OVERLAY */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="fixed inset-y-0 left-0 w-[260px] z-50 bg-white dark:bg-[#080C14] border-r border-slate-200 dark:border-white/[0.06] flex flex-col lg:hidden"
            >
              <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 dark:border-white/[0.04]">
                <div className="flex items-center gap-3">
                  <img src="/logo.png" alt="EduContest" className="w-8 h-8 object-contain shrink-0" />
                  <div>
                    <h1 className="text-[13px] font-bold text-slate-900 dark:text-white">EduContest</h1>
                    <p className="text-[9px] font-bold text-[#E8192C] uppercase tracking-widest">Admin</p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-4">
                {NAV_GROUPS.map((group) => {
                  const visibleItems = group.items.filter((item) => canSeeItem(item.key));
                  if (visibleItems.length === 0) return null;
                  return (
                    <div key={group.label}>
                      <p className="px-2 mb-1.5 text-[9px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em]">
                        {group.label}
                      </p>
                      <div className="space-y-0.5">
                        {visibleItems.map((item) => {
                          const active = isActive(item.path);
                          return (
                            <Link
                              key={item.path}
                              to={item.path}
                              className={`flex items-center justify-between px-3 h-10 rounded-lg text-[13px] font-medium transition-all ${
                                active
                                  ? "shadow-sm"
                                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5"
                              }`}
                              style={active ? { backgroundColor: navbarColor, color: "var(--navbar-text)" } : undefined}
                            >
                              <div className="flex items-center gap-3">
                                <item.icon className={`w-4 h-4 shrink-0 ${active ? "" : item.color}`} />
                                <span>{item.title}</span>
                              </div>
                              {item.key === "complaints" && (notificationCounts?.complaints || 0) > 0 && (
                                <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[#E8192C] text-white text-[10px] font-bold">
                                  {notificationCounts?.complaints}
                                </span>
                              )}
                              {item.key === "feedback" && (notificationCounts?.feedback || 0) > 0 && (
                                <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[#E8192C] text-white text-[10px] font-bold">
                                  {notificationCounts?.feedback}
                                </span>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </nav>
              <div className="p-3 border-t border-slate-100 dark:border-white/[0.04]">
                <Link
                  to="/"
                  className="flex items-center gap-3 px-3 h-10 rounded-lg text-[13px] font-medium text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{t("admin_nav.back_to_site")}</span>
                </Link>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* MAIN */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* TOP BAR */}
        <header
          className="h-14 flex items-center justify-between px-4 lg:px-6 shrink-0 border-b border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#080C14] transition-colors duration-300"
          style={
            navbarColor && navbarColor !== "#ffffff" && navbarColor !== "#fff" && !isDark
              ? { backgroundColor: navbarColor, color: "var(--navbar-text)", borderColor: "var(--navbar-border)" }
              : undefined
          }
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 relative"
            >
              <Menu className="w-5 h-5" />
              {hasNotifications && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-[#E8192C] rounded-full border border-white dark:border-[#0B0F1A]"></span>
              )}
            </button>
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Admin</span>
              <CircleDot className="w-3 h-3 text-slate-300 dark:text-slate-700" />
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                {currentPage?.title || "Panel"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-white/[0.07] text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
            <button className="w-9 h-9 hidden sm:flex items-center justify-center rounded-lg border border-slate-200 dark:border-white/[0.07] text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-all relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#E8192C] rounded-full" />
            </button>
            <div className="h-6 w-px bg-slate-200 dark:bg-white/[0.06] mx-1" />
            <div className="flex items-center gap-2.5 pl-1">
              <div className="w-8 h-8 rounded-lg bg-[#E8192C]/10 text-[#E8192C] flex items-center justify-center font-bold text-[11px]">
                {(profile?.full_name?.substring(0, 2) || "AD").toUpperCase()}
              </div>
              <div className="hidden md:block">
                <p className="text-[11px] font-bold text-slate-800 dark:text-white leading-none">
                  {profile?.full_name?.split(" ")[0] || "Admin"}
                </p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  {isSubAdmin ? "Moderator" : "Admin"}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <main className="flex-1 overflow-y-auto scrollbar-hide px-4 lg:px-6 py-5">
          <div className={`${contentWidth === "boxed" ? "max-w-[1200px]" : "max-w-[1400px]"} mx-auto`}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
