import { BellIcon } from "@solar-icons/react/bold-duotone/bell";
import { CheckCircleIcon } from "@solar-icons/react/bold-duotone/check-circle";
import { InfoCircleIcon } from "@solar-icons/react/bold-duotone/info-circle";
import { DangerCircleIcon } from "@solar-icons/react/bold-duotone/danger-circle";
import { BellRingIcon as MegaphoneIcon } from "@solar-icons/react/bold-duotone/bell-ring";
import { CartLargeMinimalisticIcon } from "@solar-icons/react/bold-duotone/cart-large-minimalistic";
import { ChatRoundUnreadIcon } from "@solar-icons/react/bold-duotone/chat-round-unread";
import { ChecklistIcon } from "@solar-icons/react/bold-duotone/checklist";
import { BellRingIcon } from "@solar-icons/react/bold-duotone/bell-ring";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDistanceToNow } from "date-fns";
import { uz, enUS } from "date-fns/locale";
import { Link } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslation } from "react-i18next";

interface NotificationDropdownProps {
  isNavbarDark?: boolean;
}

const getNotificationIconStyle = (type: string, title: string) => {
  const lowerTitle = (title || "").toLowerCase();
  if (lowerTitle.includes("sotuv") || lowerTitle.includes("kurs") || lowerTitle.includes("xarid")) {
    return {
      Icon: CartLargeMinimalisticIcon,
      styleClass: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30",
    };
  }
  if (lowerTitle.includes("xabar") || lowerTitle.includes("chat") || lowerTitle.includes("izoh")) {
    return {
      Icon: ChatRoundUnreadIcon,
      styleClass: "bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-500/30",
    };
  }
  if (type === 'success' || lowerTitle.includes("hal qilindi") || lowerTitle.includes("tasdiq")) {
    return {
      Icon: CheckCircleIcon,
      styleClass: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30",
    };
  }
  if (type === 'warning' || lowerTitle.includes("ogoh") || lowerTitle.includes("diqqat")) {
    return {
      Icon: DangerCircleIcon,
      styleClass: "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30",
    };
  }
  return {
    Icon: InfoCircleIcon,
    styleClass: "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30",
  };
};

const NotificationDropdown = ({ isNavbarDark = false }: NotificationDropdownProps) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: notifications } = useQuery({
    queryKey: ["unread-notifications-list", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("notifications" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: announcements } = useQuery({
    queryKey: ["global-announcements"],
    queryFn: async () => {
      const { data } = await supabase
        .from("announcements" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  const unreadCount = notifications?.filter((n: any) => !n.is_read).length || 0;
  const totalItems = (notifications?.length || 0) + (announcements?.length || 0);

  const markAsRead = async (id: string) => {
    await (supabase.from("notifications") as any).update({ is_read: true }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["unread-notifications-list"] });
    qc.invalidateQueries({ queryKey: ["unread-notifications"] });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className={`p-1 sm:p-2 transition-all rounded-lg sm:rounded-xl relative flex items-center justify-center ${isNavbarDark ? "text-white/70 hover:text-white hover:bg-white/10" : "text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-white/10"}`}>
          <BellIcon className="w-[18px] h-[18px] sm:w-[22px] sm:h-[22px]" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 min-w-[15px] sm:min-w-[18px] h-3.5 sm:h-4 bg-[#E8192C] text-white text-[9px] sm:text-[10px] font-bold flex items-center justify-center rounded-full px-1 shadow-xs animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[390px] p-0 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden mr-4" align="end">
        {/* Header */}
        <div className="p-4 px-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {t('notifications.title')}
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-500/10 text-[#E8192C] text-[10px] font-semibold border border-rose-200 dark:border-rose-500/20">
                  {unreadCount} ta o'qilmagan
                </span>
              )}
            </h3>
          </div>
          <Link to="/notifications" className="text-[12px] font-semibold text-[#E8192C] hover:opacity-80 transition-opacity">{t('notifications.view_all')}</Link>
        </div>

        {/* Scrollable list */}
        <ScrollArea className="h-[410px] bg-slate-50/50 dark:bg-slate-950/40">
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {announcements?.map((a: any) => (
              <div key={a.id} className="p-4 bg-rose-50/30 dark:bg-rose-950/10 border-l-4 border-[#E8192C]">
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-500/20 text-[#E8192C] border border-rose-200 dark:border-rose-500/30 flex items-center justify-center shrink-0">
                    <MegaphoneIcon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-[#E8192C] uppercase tracking-wider">{t('notifications.announcement')}</span>
                      <span className="text-[10px] text-slate-400 font-medium">
                         {formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale: i18n.language === 'en' ? enUS : uz })}
                      </span>
                    </div>
                    <h4 className="text-[13px] font-bold text-slate-900 dark:text-white mb-0.5">{a.title}</h4>
                    <p className="text-[12px] text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">{a.content}</p>
                  </div>
                </div>
              </div>
            ))}

            {notifications?.map((n: any) => {
              const { Icon, styleClass } = getNotificationIconStyle(n.type, n.title);
              const isUnread = !n.is_read;

              const content = (
                <div className="flex items-start gap-3.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${styleClass}`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[13px] font-bold text-slate-900 dark:text-white truncate">{n.title}</span>
                      <span className="text-[10px] text-slate-400 font-medium shrink-0">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: i18n.language === 'en' ? enUS : uz })}
                      </span>
                    </div>
                    <p className="text-[12px] text-slate-600 dark:text-slate-300 leading-snug line-clamp-2">{n.message}</p>
                  </div>
                </div>
              );

              return (
                <div 
                  key={n.id} 
                  className={`p-4 transition-all hover:bg-white dark:hover:bg-slate-800/80 relative group cursor-pointer ${isUnread ? 'bg-white dark:bg-slate-900 border-l-4 border-[#E8192C]' : 'bg-transparent opacity-80'}`}
                  onClick={() => !n.is_read && markAsRead(n.id)}
                >
                  {n.link ? (
                    <Link to={n.link} className="block">
                      {content}
                    </Link>
                  ) : content}
                  
                  {!n.is_read && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 hover:text-[#E8192C] cursor-pointer shadow-2xs">
                        <ChecklistIcon size={16} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {totalItems === 0 && (
              <div className="py-20 text-center">
                <BellRingIcon size={36} className="text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-medium">{t('notifications.empty')}</p>
              </div>
            )}
          </div>
        </ScrollArea>
        {/* Footer */}
        <div className="p-3 px-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <Link to="/notifications" className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-[12px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-[#E8192C] hover:text-white hover:border-[#E8192C] transition-all flex items-center justify-center gap-2 shadow-2xs">
            {t('notifications.view_full')}
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationDropdown;
