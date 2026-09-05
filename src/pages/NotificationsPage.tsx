import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Bell } from "lucide-react";
import { CheckCircleIcon } from "@solar-icons/react/bold-duotone/check-circle";
import { ChatDotsIcon } from "@solar-icons/react/bold-duotone/chat-dots";
import { InfoCircleIcon } from "@solar-icons/react/bold-duotone/info-circle";
import { DangerIcon } from "@solar-icons/react/bold-duotone/danger";
import { NotificationUnreadIcon } from "@solar-icons/react/bold-duotone/notification-unread";
import { formatDistanceToNow } from "date-fns";
import { uz } from "date-fns/locale";

const iconMap: Record<string, { Icon: typeof CheckCircleIcon; color: string; bg: string; gradient: string }> = {
    success: {
        Icon: CheckCircleIcon,
        color: "text-emerald-500",
        bg: "bg-emerald-50 dark:bg-emerald-500/10",
        gradient: "from-emerald-400 to-teal-500",
    },
    info: {
        Icon: InfoCircleIcon,
        color: "text-blue-500",
        bg: "bg-blue-50 dark:bg-blue-500/10",
        gradient: "from-blue-400 to-cyan-500",
    },
    warning: {
        Icon: DangerIcon,
        color: "text-amber-500",
        bg: "bg-amber-50 dark:bg-amber-500/10",
        gradient: "from-amber-400 to-orange-500",
    },
    error: {
        Icon: DangerIcon,
        color: "text-red-500",
        bg: "bg-red-50 dark:bg-red-500/10",
        gradient: "from-red-400 to-rose-500",
    },
    default: {
        Icon: ChatDotsIcon,
        color: "text-violet-500",
        bg: "bg-violet-50 dark:bg-violet-500/10",
        gradient: "from-violet-400 to-purple-500",
    },
};

const NotificationsPage = () => {
    const { user } = useAuth();
    const qc = useQueryClient();

    const { data: notifications, isLoading } = useQuery({
        queryKey: ["notifications", user?.id],
        queryFn: async () => {
            if (!user) return [];
            const { data, error } = await supabase
                .from("notifications" as any)
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });
            
            if (error) throw error;
            return data.map((n: any) => {
                const iconDef = iconMap[n.type] || iconMap.default;
                return {
                    id: n.id,
                    type: n.type,
                    title: n.title,
                    message: n.message,
                    date: n.created_at,
                    read: n.is_read,
                    ...iconDef,
                };
            });
        },
        enabled: !!user
    });

    const markAllAsRead = async () => {
        if (!user) return;
        const { error } = await supabase
            .from("notifications" as any)
            .update({ is_read: true })
            .eq("user_id", user.id)
            .eq("is_read", false);
        
        if (!error) {
            qc.invalidateQueries({ queryKey: ["notifications"] });
            qc.invalidateQueries({ queryKey: ["unread-notifications"] });
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-slate-400 mb-1">Xabarlar</p>
                  <h1 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <NotificationUnreadIcon size={22} className="text-[#E8192C]" />
                    Bildirishnomalar
                  </h1>
                </div>
                <button 
                    onClick={markAllAsRead}
                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors font-medium"
                >
                    Barchasini o'qilgan deb belgilash
                </button>
            </div>

            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : notifications?.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <Bell className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-slate-400 text-sm">Hozircha bildirishnomalar yo'q</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {notifications?.map((notif) => (
                        <div 
                            key={notif.id}
                            className={`group bg-white dark:bg-slate-900 border ${notif.read ? 'border-slate-200 dark:border-slate-800' : 'border-slate-200 dark:border-slate-700'} rounded-2xl p-4 flex gap-4 hover:border-slate-300 dark:hover:border-slate-600 transition-colors`}
                        >
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${notif.gradient} flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm`}>
                                <notif.Icon className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{notif.title}</h3>
                                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                        {formatDistanceToNow(new Date(notif.date), { addSuffix: true, locale: uz })}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                                    {notif.message}
                                </p>
                            </div>
                            {!notif.read && (
                                <div className="w-1.5 h-1.5 rounded-full bg-[#E8192C] mt-2 flex-shrink-0" />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NotificationsPage;
