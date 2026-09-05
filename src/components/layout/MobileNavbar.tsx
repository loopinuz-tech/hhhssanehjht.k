import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, Database, BookOpen, MoreHorizontal, 
  BarChart3, FolderOpen, Sparkles, LogOut, User, Settings 
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";

const mainTabs = [
  { path: "/", icon: LayoutDashboard, label: "Asosiy" },
  { path: "/question-bank", icon: Database, label: "Savollar" },
  { path: "/vocabulary", icon: BookOpen, label: "Lug'at" },
];

const MobileNavbar = () => {
  const location = useLocation();
  const { signOut, profile } = useAuth();

  if (location.pathname.startsWith("/lugat/game")) {
    return null;
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-gray-100 dark:border-slate-800 z-50 safe-area-inset-bottom transition-colors duration-300">
      <div className="flex items-stretch h-16">
        {mainTabs.map((tab) => {
          const active = location.pathname === tab.path;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all ${
                active ? "text-primary font-black" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${active ? "bg-primary/10" : ""}`}>
                <tab.icon className={`w-5 h-5 transition-colors ${
                  active ? "stroke-[2.5]" : ""
                }`} />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-tight">
                {tab.label}
              </span>
            </Link>
          );
        })}

        {/* More */}
        <Sheet>
          <SheetTrigger asChild>
            <button className="flex-1 flex flex-col items-center justify-center gap-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              <div className="p-1.5 rounded-xl">
                <MoreHorizontal className="w-5 h-5 stroke-[2]" />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-tight">Ko'proq</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-[3rem] bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 px-0 pb-12 outline-none">
            <div className="flex flex-col space-y-8">
              <div className="px-8 pt-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Bo'limlar</p>
                  <h3 className="text-lg font-black text-foreground">Menu</h3>
                </div>
                <div className="w-8 h-1 bg-gray-200 dark:bg-slate-800 rounded-full" />
              </div>
              
              <div className="grid grid-cols-4 gap-y-8 px-6">
                {[
                  { to: "/results", icon: BarChart3, label: "Natijalar" },
                  { to: "/materials", icon: FolderOpen, label: "Material" },
                  { to: "/vibe", icon: Sparkles, label: "Vibe" },
                  { to: "/settings", icon: Settings, label: "Sozlamalar" },
                ].map(item => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="flex flex-col items-center gap-3 text-center active:scale-90 transition-transform"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-slate-800 flex items-center justify-center border border-gray-100 dark:border-slate-700/50 shadow-sm">
                      <item.icon className="w-6 h-6 text-primary" />
                    </div>
                    <span className="text-[11px] font-black text-gray-900 dark:text-gray-100">{item.label}</span>
                  </Link>
                ))}
              </div>

              <div className="px-6 pt-6">
                <button
                  onClick={signOut}
                  className="flex items-center justify-center gap-3 w-full py-5 rounded-[2rem] bg-rose-50 dark:bg-rose-950/20 text-rose-500 font-black text-sm transition-all active:scale-95 shadow-sm"
                >
                  <LogOut className="w-5 h-5" />
                  <span>TIZIMDAN CHIQISH</span>
                </button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
};

export default MobileNavbar;
