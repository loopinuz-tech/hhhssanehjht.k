import React from "react";
import { ArrowUpRight, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TelegramAdminCardProps {
  adminHandle?: string;
  planName?: string;
  customMessage?: string;
  commandParam?: string;
  className?: string;
  showCopyButton?: boolean;
}

export function TelegramAdminCard({
  adminHandle = "@educontestadmin",
  planName,
  customMessage,
  commandParam = "start",
  className = "",
  showCopyButton = false,
}: TelegramAdminCardProps) {
  const { toast } = useToast();
  const cleanHandle = adminHandle.replace(/^@/, "");

  const defaultMessage = planName
    ? `Assalomu alaykum! Men ${planName} tarifiga obuna bo'lmoqchi edim. Karta raqamingizni tashlab bering.`
    : "Assalomu alaykum! Men obuna bo'lmoqchi edim. Karta raqamingizni tashlab bering.";

  const textToUse = customMessage || defaultMessage;
  const encodedText = encodeURIComponent(textToUse);
  const startParam = commandParam || (planName ? planName.toLowerCase() : "obuna");

  const telegramUrl = `https://t.me/${cleanHandle}?text=${encodedText}&start=${encodeURIComponent(startParam)}`;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    navigator.clipboard.writeText(`@${cleanHandle}`);
    toast({
      title: "Nusxalandi!",
      description: `@${cleanHandle} Telegram nikis nusxalandi`,
    });
  };

  return (
    <a
      href={telegramUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-400 dark:hover:border-sky-600 rounded-2xl p-4 flex items-center justify-between shadow-xs transition-all group cursor-pointer ${className}`}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="w-12 h-12 rounded-full bg-[#24A1DE] text-white flex items-center justify-center shrink-0 shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
          <Send className="w-6 h-6 transform -rotate-12 translate-x-0.5" />
        </div>
        <div className="text-left min-w-0">
          <h4 className="text-[15px] font-bold text-slate-900 dark:text-white leading-tight group-hover:text-[#24A1DE] transition-colors truncate">
            Adminga yozish
          </h4>
          <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            Yordam kerak bo'lsa <span className="font-semibold text-slate-700 dark:text-slate-300">@{cleanHandle}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 ml-2">
        {showCopyButton && (
          <button
            onClick={handleCopy}
            className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Nusxalash
          </button>
        )}
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-[#24A1DE] group-hover:bg-sky-50 dark:group-hover:bg-sky-500/10 transition-all">
          <ArrowUpRight className="w-5 h-5 stroke-[2] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </div>
      </div>
    </a>
  );
}

export default TelegramAdminCard;
