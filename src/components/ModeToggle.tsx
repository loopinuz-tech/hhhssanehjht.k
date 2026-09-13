import { Sun2Icon } from "@solar-icons/react/bold-duotone/sun-2";
import { MoonStarsIcon } from "@solar-icons/react/bold-duotone/moon-stars";
import { MonitorIcon } from "@solar-icons/react/bold-duotone/monitor";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";

interface ModeToggleProps {
  isNavbarDark?: boolean;
}

export function ModeToggle({ isNavbarDark = false }: ModeToggleProps) {
  const { setTheme } = useTheme();
  const [accentColor, setAccentColor] = useState<string>("green");

  useEffect(() => {
    // Load preference
    const saved = localStorage.getItem("theme-accent-color") || "green";
    setAccentColor(saved);
    document.documentElement.setAttribute("data-theme-color", saved);
  }, []);

  const changeAccentColor = async (color: string) => {
    setAccentColor(color);
    localStorage.setItem("theme-accent-color", color);
    document.documentElement.setAttribute("data-theme-color", color);

    // Optional: Sync with Supabase profiles
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await (supabase as any).from("profiles").update({ theme_color: color }).eq("id", user.id);
      }
    } catch (e) {
      console.error("Failed to sync theme color:", e);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl transition-all duration-200 ${isNavbarDark ? "text-white/70 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/20" : "text-slate-600 dark:text-slate-300 hover:text-primary hover:bg-slate-100 dark:hover:bg-white/10 border border-transparent hover:border-gray-200 dark:hover:border-white/10"}`}
        >
          <Sun2Icon className="w-4 h-4 sm:w-[18px] sm:h-[18px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
          <MoonStarsIcon className="w-4 h-4 sm:w-[18px] sm:h-[18px] absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-indigo-400" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="
          z-[200] min-w-[160px] p-1.5 rounded-2xl
          bg-white/95 dark:bg-slate-900/95
          backdrop-blur-xl
          border border-slate-100 dark:border-slate-800
          shadow-[0_8px_32px_rgba(0,0,0,0.12)]
        "
      >

        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-extrabold text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer transition-all"
        >
          <Sun2Icon size={18} className="text-amber-500 shrink-0" />
          Yorug'
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-extrabold text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-all"
        >
          <MoonStarsIcon size={18} className="text-indigo-400 shrink-0" />
          To'q
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-extrabold text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400 cursor-pointer transition-all"
        >
          <MonitorIcon size={18} className="text-sky-500 shrink-0" />
          Tizim
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
