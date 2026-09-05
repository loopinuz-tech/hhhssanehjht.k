import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { uz } from "date-fns/locale";
import {
  Bell, X, Check, ChevronRight, ChevronLeft, ExternalLink, Sparkles
} from "lucide-react";

import { CheckCircleIcon } from "@solar-icons/react/bold-duotone/check-circle";
import { DangerCircleIcon } from "@solar-icons/react/bold-duotone/danger-circle";
import { InfoCircleIcon } from "@solar-icons/react/bold-duotone/info-circle";
import { CartLargeMinimalisticIcon } from "@solar-icons/react/bold-duotone/cart-large-minimalistic";
import { ChatRoundUnreadIcon } from "@solar-icons/react/bold-duotone/chat-round-unread";
import { BellRingIcon as MegaphoneIcon } from "@solar-icons/react/bold-duotone/bell-ring";

const playNotificationSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // Ignore audio autoplay context blocks
  }
};

const getNotificationStyle = (type: string, title: string, isAnnouncement?: boolean) => {
  if (isAnnouncement) {
    return {
      Icon: MegaphoneIcon,
      gradient: "from-rose-500 to-pink-600",
      badgeBg: "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/30",
      badgeText: "Yangi E'lon",
    };
  }

  const t = (title || "").toLowerCase();
  if (t.includes("xarid") || t.includes("sotuv") || t.includes("to'lov") || t.includes("balans")) {
    return {
      Icon: CartLargeMinimalisticIcon,
      gradient: "from-emerald-500 to-teal-600",
      badgeBg: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30",
      badgeText: "Moliya & Xarid",
    };
  }
  if (type === "success" || t.includes("tasdiq") || t.includes("muvaffaqiyat")) {
    return {
      Icon: CheckCircleIcon,
      gradient: "from-emerald-500 to-green-600",
      badgeBg: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30",
      badgeText: "Muvaffaqiyatli",
    };
  }
  if (type === "warning" || t.includes("ogoh") || t.includes("diqqat")) {
    return {
      Icon: DangerCircleIcon,
      gradient: "from-amber-500 to-orange-600",
      badgeBg: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30",
      badgeText: "Ogohlantirish",
    };
  }
  if (type === "error") {
    return {
      Icon: DangerCircleIcon,
      gradient: "from-rose-500 to-red-600",
      badgeBg: "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/30",
      badgeText: "Muhim Xabar",
    };
  }
  if (t.includes("xabar") || t.includes("izoh") || t.includes("chat")) {
    return {
      Icon: ChatRoundUnreadIcon,
      gradient: "from-sky-500 to-blue-600",
      badgeBg: "bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-500/30",
      badgeText: "Yangi Xabar",
    };
  }
  return {
    Icon: InfoCircleIcon,
    gradient: "from-indigo-500 to-purple-600",
    badgeBg: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30",
    badgeText: "Bildirishnoma",
  };
};

export const NotificationModal = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(sessionStorage.getItem("dismissed_notifications") || "[]");
    } catch {
      return [];
    }
  });

  const [seenAnnouncements, setSeenAnnouncements] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("seen_announcements") || "[]");
    } catch {
      return [];
    }
  });

  const [currentIndex, setCurrentIndex] = useState(0);

  // Fetch unread notifications for current user
  const { data: notifications = [], refetch: refetchNotifs } = useQuery({
    queryKey: ["unread-notifications-popup", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("notifications" as any)
        .select("*")
        .eq("user_id", user.id)
        .eq("is_read", false)
        .order("created_at", { ascending: false });

      if (error) return [];
      return data || [];
    },
    enabled: !!user?.id,
    refetchOnWindowFocus: true,
  });

  // Fetch active global announcements (Cached for 1 hour, no realtime socket needed)
  const { data: announcements = [] } = useQuery({
    queryKey: ["global-announcements-popup"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements" as any)
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) return [];
      return data || [];
    },
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 2,
    refetchOnWindowFocus: false,
  });

  // Realtime listener for user notifications (scoped to user.id, event INSERT)
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`user-notifications-modal-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          playNotificationSound();
          refetchNotifs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, refetchNotifs]);

  // Combine unread personal notifications and unseen active announcements
  const activeNotifications = useMemo(() => {
    const unreadUserNotifs = notifications.filter((n: any) => !dismissedIds.includes(n.id));

    const unseenGlobalAnns = announcements
      .filter((a: any) => !seenAnnouncements.includes(a.id) && !dismissedIds.includes(a.id))
      .map((a: any) => ({
        id: a.id,
        title: a.title,
        message: a.content,
        type: a.type || "info",
        created_at: a.created_at,
        isAnnouncement: true,
      }));

    const combined = [...unseenGlobalAnns, ...unreadUserNotifs];

    return combined.sort((a: any, b: any) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
  }, [notifications, announcements, dismissedIds, seenAnnouncements]);

  // Bounds safety check on currentIndex
  useEffect(() => {
    if (currentIndex >= activeNotifications.length && activeNotifications.length > 0) {
      setCurrentIndex(activeNotifications.length - 1);
    }
  }, [activeNotifications.length, currentIndex]);

  if (!user || activeNotifications.length === 0) {
    return null;
  }

  const currentNotif = activeNotifications[currentIndex] || activeNotifications[0];
  if (!currentNotif) return null;

  const { Icon, gradient, badgeBg, badgeText } = getNotificationStyle(
    currentNotif.type,
    currentNotif.title,
    currentNotif.isAnnouncement
  );

  const handleMarkAsRead = async (item: any) => {
    const newDismissed = [...dismissedIds, item.id];
    setDismissedIds(newDismissed);
    sessionStorage.setItem("dismissed_notifications", JSON.stringify(newDismissed));

    if (item.isAnnouncement) {
      const newSeen = [...seenAnnouncements, item.id];
      setSeenAnnouncements(newSeen);
      localStorage.setItem("seen_announcements", JSON.stringify(newSeen));
    } else {
      try {
        await (supabase.from("notifications") as any)
          .update({ is_read: true })
          .eq("id", item.id);
      } catch (e) {
        console.error("Error marking notification as read:", e);
      }
    }

    qc.invalidateQueries({ queryKey: ["unread-notifications-popup"] });
    qc.invalidateQueries({ queryKey: ["unread-notifications-list"] });
    qc.invalidateQueries({ queryKey: ["unread-notifications"] });
    qc.invalidateQueries({ queryKey: ["notifications"] });
    qc.invalidateQueries({ queryKey: ["global-announcements-popup"] });
    qc.invalidateQueries({ queryKey: ["global-announcements"] });
  };

  const handleMarkAllAsRead = async () => {
    const allIds = activeNotifications.map((n: any) => n.id);
    const newDismissed = [...dismissedIds, ...allIds];
    setDismissedIds(newDismissed);
    sessionStorage.setItem("dismissed_notifications", JSON.stringify(newDismissed));

    const annIds = activeNotifications.filter((n: any) => n.isAnnouncement).map((a: any) => a.id);
    if (annIds.length > 0) {
      const newSeen = [...new Set([...seenAnnouncements, ...annIds])];
      setSeenAnnouncements(newSeen);
      localStorage.setItem("seen_announcements", JSON.stringify(newSeen));
    }

    try {
      await (supabase.from("notifications") as any)
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
    } catch (e) {
      console.error("Error marking all notifications read:", e);
    }

    qc.invalidateQueries({ queryKey: ["unread-notifications-popup"] });
    qc.invalidateQueries({ queryKey: ["unread-notifications-list"] });
    qc.invalidateQueries({ queryKey: ["unread-notifications"] });
    qc.invalidateQueries({ queryKey: ["notifications"] });
    qc.invalidateQueries({ queryKey: ["global-announcements-popup"] });
    qc.invalidateQueries({ queryKey: ["global-announcements"] });
  };

  const handleDismissCurrent = () => {
    const newDismissed = [...dismissedIds, currentNotif.id];
    setDismissedIds(newDismissed);
    sessionStorage.setItem("dismissed_notifications", JSON.stringify(newDismissed));

    if (currentNotif.isAnnouncement) {
      const newSeen = [...seenAnnouncements, currentNotif.id];
      setSeenAnnouncements(newSeen);
      localStorage.setItem("seen_announcements", JSON.stringify(newSeen));
    }
  };

  const formattedTime = currentNotif.created_at
    ? formatDistanceToNow(new Date(currentNotif.created_at), { addSuffix: true, locale: uz })
    : "";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[9999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        onClick={handleDismissCurrent}
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 25 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.88, opacity: 0, y: 15 }}
          transition={{ type: "spring", stiffness: 350, damping: 26 }}
          className="bg-white dark:bg-[#121824] rounded-3xl p-5 sm:p-7 max-w-md w-[94vw] sm:w-full shadow-2xl border border-slate-200/80 dark:border-white/10 relative overflow-hidden my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-extrabold border ${badgeBg} flex items-center gap-1.5`}>
                <Sparkles size={12} className="animate-pulse" />
                {badgeText}
              </span>

              {activeNotifications.length > 1 && (
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-full">
                  {currentIndex + 1} / {activeNotifications.length}
                </span>
              )}
            </div>

            <button
              onClick={handleDismissCurrent}
              className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/20 transition-all flex items-center justify-center shrink-0"
              title="Yopish"
            >
              <X size={18} />
            </button>
          </div>

          {/* Icon & Title */}
          <div className="flex items-start gap-3.5 mb-4">
            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/10`}>
              <Icon size={28} />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug break-words">
                {currentNotif.title || "Yangi Bildirishnoma"}
              </h3>
              {formattedTime && (
                <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mt-0.5">
                  {formattedTime}
                </p>
              )}
            </div>
          </div>

          {/* Message Content */}
          <div className="bg-slate-50 dark:bg-slate-900/80 rounded-2xl p-3.5 sm:p-4 border border-slate-100 dark:border-white/5 mb-5 max-h-[180px] overflow-y-auto scrollbar-thin">
            <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line break-words">
              {currentNotif.message || currentNotif.content || "Sizda yangi bildirishnoma bor."}
            </p>
          </div>

          {/* Navigation & Mark Read Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <button
              onClick={() => handleMarkAsRead(currentNotif)}
              className="w-full py-3 px-4 bg-[#E8192C] text-white rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 hover:bg-[#d01526] active:scale-[0.98] transition-all shadow-lg shadow-rose-500/20"
            >
              <Check size={18} />
              <span>O'qildim</span>
            </button>

            {activeNotifications.length > 1 && (
              <div className="flex items-center justify-between w-full sm:w-auto gap-2">
                <button
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  className="p-3 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 rounded-2xl hover:bg-slate-200 dark:hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none transition-all"
                  title="Oldingisi"
                >
                  <ChevronLeft size={18} />
                </button>

                <button
                  disabled={currentIndex >= activeNotifications.length - 1}
                  onClick={() => setCurrentIndex((prev) => Math.min(activeNotifications.length - 1, prev + 1))}
                  className="p-3 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 rounded-2xl hover:bg-slate-200 dark:hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none transition-all"
                  title="Keyingisi"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>

          {/* Mark All As Read option if >1 */}
          {activeNotifications.length > 1 && (
            <button
              onClick={handleMarkAllAsRead}
              className="w-full mt-3 py-1.5 text-center text-[11px] sm:text-xs font-extrabold text-slate-600 dark:text-slate-400 hover:text-[#E8192C] dark:hover:text-rose-400 transition-colors"
            >
              Barchasini ({activeNotifications.length}) o'qilgan deb belgilash
            </button>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
export default NotificationModal;
