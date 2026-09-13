import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { rewriteStorageUrl } from "@/lib/storage";
import { ArrowUpRight } from "lucide-react";

export interface TopAnnouncementData {
  value: string;
  is_active: boolean;
  imageUrl: string;
  linkUrl: string;
}

export function useTopAnnouncement() {
  return useQuery<TopAnnouncementData>({
    queryKey: ["site-announcement"],
    queryFn: async () => {
      const { data } = await supabase
        .from("admin_settings" as any)
        .select("*");

      const map: Record<string, string> = {};
      data?.forEach((s: any) => {
        map[s.key] = s.value;
      });

      return {
        value: map.top_announcement || "",
        is_active: map.announcement_active !== "false" && (!!map.top_announcement || !!map.top_announcement_image_url),
        imageUrl: (map.top_announcement_image_url && map.top_announcement_image_url !== "/broimg.png") ? map.top_announcement_image_url : "",
        linkUrl: map.top_announcement_link || "",
      };
    },
    staleTime: 1000 * 60 * 3, // 3 minutes cache
  });
}

interface TopAnnouncementBarProps {
  overrideValue?: string;
  overrideActive?: boolean;
  overrideImageUrl?: string;
  overrideLinkUrl?: string;
  isPreview?: boolean;
}

export const TopAnnouncementBar = ({
  overrideValue,
  overrideActive,
  overrideImageUrl,
  overrideLinkUrl,
  isPreview = false,
}: TopAnnouncementBarProps) => {
  const { data: serverData } = useTopAnnouncement();
  const navigate = useNavigate();
  const [isDismissed, setIsDismissed] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (!isPreview) {
      const dismissed = sessionStorage.getItem("educontest_top_announcement_dismissed");
      if (dismissed === "true") {
        setIsDismissed(true);
      }
    }
  }, [isPreview]);

  const isActive = isPreview ? (overrideActive ?? true) : (serverData?.is_active ?? false);
  const value = isPreview ? (overrideValue ?? "") : (serverData?.value ?? "");
  const rawImageUrl = isPreview ? (overrideImageUrl ?? "") : (serverData?.imageUrl ?? "");
  const imageUrl = (rawImageUrl && rawImageUrl !== "/broimg.png") ? rawImageUrl : "";
  const linkUrl = isPreview ? (overrideLinkUrl ?? "") : (serverData?.linkUrl ?? "");

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPreview) {
      setIsDismissed(true);
      setTimeout(() => setIsDismissed(false), 1500);
      return;
    }
    setIsDismissed(true);
    try {
      sessionStorage.setItem("educontest_top_announcement_dismissed", "true");
    } catch {
      // ignore
    }
  };

  const handleNavigate = () => {
    if (!linkUrl) return;
    const cleanLink = linkUrl.trim();
    if (!cleanLink) return;

    if (cleanLink.startsWith("http://") || cleanLink.startsWith("https://") || cleanLink.startsWith("//")) {
      window.open(cleanLink, "_blank", "noopener,noreferrer");
    } else {
      navigate(cleanLink.startsWith("/") ? cleanLink : `/${cleanLink}`);
    }
  };

  if (isDismissed && !isPreview) {
    return null;
  }

  const hasContent = !!imageUrl || !!value;
  if (!isActive || !hasContent) {
    if (isPreview) {
      return (
        <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-400 bg-slate-50 dark:bg-white/[0.02]">
          Yangilik o'chirilgan (nofaol) yoki matn / rasm kiritilmagan
        </div>
      );
    }
    return null;
  }

  const showImage = !!imageUrl && !imageError;
  const finalSrc = showImage ? rewriteStorageUrl(imageUrl) : "";
  const isClickable = !!linkUrl && linkUrl.trim().length > 0;

  return (
    <aside
      aria-label="EduContest Yangilik"
      className={`w-full bg-white dark:bg-[#0c121e] text-slate-900 dark:text-white py-1 sm:py-1.5 px-3 sm:px-5 shadow-xs border-b border-slate-200/90 dark:border-slate-800 transition-all ${
        isPreview ? "rounded-xl overflow-hidden" : ""
      }`}
    >
      <div className="w-full relative flex items-center justify-between gap-3 min-h-[36px] sm:min-h-[40px]">
        {/* Left: EduContest Yangilik (tight left spacing) */}
        <div className="flex items-center gap-1.5 select-none shrink-0 z-10">
          <span className="font-black text-xs sm:text-[13px] tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
            EduContest <span className="text-[#E8192C]">Yangilik</span>
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#E8192C] animate-pulse shrink-0 hidden sm:inline-block ml-0.5" />
        </div>

        {/* Center: Wide Banner Image OR Centered Text with Clickable Link */}
        <div className="sm:absolute sm:left-1/2 sm:-translate-x-1/2 sm:max-w-[70%] flex items-center justify-center px-2 min-w-0 flex-1 text-center pointer-events-none">
          <div
            onClick={isClickable ? handleNavigate : undefined}
            role={isClickable ? "link" : undefined}
            tabIndex={isClickable ? 0 : undefined}
            className={`pointer-events-auto inline-flex items-center justify-center gap-1.5 max-w-full ${
              isClickable ? "cursor-pointer hover:opacity-85 active:scale-[0.99] transition-all group" : ""
            }`}
            title={isClickable ? `Havolaga o'tish: ${linkUrl}` : undefined}
          >
            {/* Rasm mavjud bo'lsa */}
            {showImage && (
              <div className="relative inline-flex items-center shrink-0">
                <img
                  src={finalSrc}
                  alt={value || "EduContest Yangilik"}
                  className={`${
                    value
                      ? "max-h-[26px] sm:max-h-[30px] w-auto max-w-[180px] sm:max-w-[280px]"
                      : "max-h-[32px] sm:max-h-[38px] w-auto max-w-[85vw] sm:max-w-[650px]"
                  } object-contain rounded-[4px] drop-shadow-xs`}
                  onError={() => setImageError(true)}
                />
                {isClickable && !value && (
                  <span className="absolute -top-1 -right-3.5 p-0.5 bg-[#E8192C] text-white rounded-full opacity-80 group-hover:opacity-100 transition-opacity shadow-xs">
                    <ArrowUpRight className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>
            )}

            {/* Matn mavjud bo'lsa (rasm bilan birga yoki rasmsiz) */}
            {value && (
              <div className="inline-flex items-center gap-1.5 truncate max-w-full">
                <p className="text-xs sm:text-[13px] font-semibold text-slate-700 dark:text-slate-200 tracking-normal truncate text-center group-hover:text-[#E8192C] transition-colors">
                  {value}
                </p>
                {isClickable && (
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#E8192C] shrink-0 opacity-70 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Larger Close "X" Button */}
        <div className="flex items-center justify-end shrink-0 z-10">
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 sm:p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer group flex items-center justify-center"
            title="Yopish"
            aria-label="Yangilikni yopish"
          >
            <svg
              className="w-5 h-5 sm:w-5.5 sm:h-5.5 transition-transform group-hover:scale-110"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default TopAnnouncementBar;
