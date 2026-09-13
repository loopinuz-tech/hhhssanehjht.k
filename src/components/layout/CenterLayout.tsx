import React, { useState, useEffect } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import {
  LayoutDashboard, BookOpen, Users, FileText, BarChart3,
  UserCheck, Send, CreditCard, Settings, Copy, Check,
  Menu, X, Sun, Moon, LogOut, ExternalLink, ShieldCheck, ChevronRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface CenterCurrentResponse {
  center: {
    id: string;
    name: string;
    username: string;
    logo_url?: string;
    status: string;
    telegram_chat_id?: number;
  };
  member: {
    role: string;
    status: string;
  };
  permissions: string[];
}

const NAV_ITEMS = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/center", exact: true },
  { title: "Sinflar", icon: BookOpen, path: "/center/classes" },
  { title: "O'quvchilar", icon: Users, path: "/center/students" },
  { title: "Mock testlar", icon: FileText, path: "/center/tests" },
  { title: "Natijalar", icon: BarChart3, path: "/center/results" },
  { title: "Hodimlar", icon: UserCheck, path: "/center/staff" },
  { title: "Telegram", icon: Send, path: "/center/telegram" },
  { title: "Tarif va to'lovlar", icon: CreditCard, path: "/center/subscription" },
  { title: "Sozlamalar", icon: Settings, path: "/center/settings" },
];

const CenterLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { user, signOut, loading: authLoading } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch current center context
  const { data: centerContext, isLoading, error } = useQuery<CenterCurrentResponse>({
    queryKey: ["center-current"],
    queryFn: async () => {
      const res = await fetch("/api/center/current", { credentials: "include" });
      if (!res.ok) {
        throw new Error("Markaz boshqaruviga kirish imkoni yo'q");
      }
      return res.json();
    },
    retry: false
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  const copyPublicUrl = () => {
    if (!centerContext?.center?.username) return;
    const url = `https://educontest.uz/c/${centerContext.center.username}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast({ title: "Nusxalandi!", description: "Markaz login havolasi nusxalandi" });
    setTimeout(() => setCopied(false), 2000);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#E8192C] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-500">Markaz paneli yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (error || !centerContext?.center) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/30 text-rose-500 flex items-center justify-center mb-4">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Kirish cheklangan</h1>
        <p className="text-sm text-slate-500 max-w-md mt-2">
          Sizda markaz ma'muriyatiga kirish huquqi mavjud emas yoki markazingiz faol holatda emas.
        </p>
        <div className="flex gap-3 mt-6">
          <Link
            to="/dashboard"
            className="px-5 py-2.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl font-semibold text-sm"
          >
            Foydalanuvchi paneliga o'tish
          </Link>
        </div>
      </div>
    );
  }

  const { center, member } = centerContext;
  const isOwner = member.role === "CENTER_OWNER" || member.role === "SUPER_ADMIN";

  return (
    <div className="h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 flex text-slate-900 dark:text-slate-100 antialiased">
      {/* SIDEBAR BACKDROP (Mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-68 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* BRAND HEADER */}
        <div className="h-18 px-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
              {center.logo_url ? (
                <img src={center.logo_url} alt={center.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-black text-[#E8192C]">{center.name.slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">{center.name}</h2>
              <p className="text-[11px] font-semibold text-slate-400 truncate">Markaz Admin</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PUBLIC URL BANNER */}
        <div className="p-4 border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/20">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Markaz Login Havolasi</div>
          <div className="flex items-center gap-1.5 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs">
            <span className="truncate font-semibold text-slate-600 dark:text-slate-300">/c/{center.username}</span>
            <button
              onClick={copyPublicUrl}
              className="ml-auto p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
              title="Havolani nusxalash"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <a
              href={`/c/${center.username}`}
              target="_blank"
              rel="noreferrer"
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
              title="Sahifani ochish"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-[13px] transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#E8192C] text-white shadow-xs shadow-red-500/20"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.title}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-70" />}
              </Link>
            );
          })}
        </nav>

        {/* FOOTER & ROLE BADGE */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${center.telegram_chat_id ? "bg-emerald-500" : "bg-slate-300"}`} />
              <span className="text-[11px] font-semibold text-slate-500">
                {center.telegram_chat_id ? "Telegram ulangan" : "Telegram ulanmagan"}
              </span>
            </div>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {isOwner ? "Egasi" : "Hodim"}
            </span>
          </div>

          <Link
            to="/dashboard"
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            ← Shaxsiy kabinetga qaytish
          </Link>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 lg:pl-68 flex flex-col h-full overflow-hidden">
        {/* TOPBAR */}
        <header className="h-18 px-4 sm:px-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 z-30 relative">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base font-bold text-slate-900 dark:text-white truncate">
                {NAV_ITEMS.find(i => i.exact ? location.pathname === i.path : location.pathname.startsWith(i.path))?.title || "Boshqaruv"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Dark Mode Toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors"
              title="Mavzuni o'zgartirish"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Logout button */}
            <button
              onClick={() => signOut()}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
              title="Chiqish"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* PAGE OUTLET */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1400px] mx-auto">
            <Outlet context={{ center, member }} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default CenterLayout;
