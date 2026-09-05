import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChartIcon } from "@solar-icons/react/bold-duotone/chart";
import { EyeIcon } from "@solar-icons/react/bold-duotone/eye";
import { UsersGroupTwoRoundedIcon } from "@solar-icons/react/bold-duotone/users-group-two-rounded";
import { ClockCircleIcon } from "@solar-icons/react/bold-duotone/clock-circle";
import { GlobeIcon } from "@solar-icons/react/bold-duotone/globe";
import { UserCheckIcon } from "@solar-icons/react/bold-duotone/user-check";
import { FileTextIcon } from "@solar-icons/react/bold-duotone/file-text";
import { PulseIcon } from "@solar-icons/react/bold-duotone/pulse";
import { RefreshIcon } from "@solar-icons/react/bold-duotone/refresh";
import { CupFirstIcon } from "@solar-icons/react/bold-duotone/cup-first";
import { ArrowUpRight, Monitor, Smartphone, Tablet, Radio } from "lucide-react";
import {
  AreaChart, PieChart, BarChart, ResponsiveContainer,
  Area, Pie, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
} from "recharts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444", "#EC4899", "#06B6D4", "#84CC16"];

const DEVICE_COLORS: Record<string, string> = {
  desktop: "#3B82F6",
  mobile: "#10B981",
  tablet: "#F59E0B",
  unknown: "#94A3B8",
};

type DateRange = "today" | "7d" | "30d" | "90d";

const rangeMap: Record<DateRange, string> = {
  today: new Date().toISOString().slice(0, 10),
  "7d": new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10),
  "30d": new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
  "90d": new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10),
};

const rangeLabels: Record<DateRange, string> = {
  today: "Bugun",
  "7d": "7 kun",
  "30d": "30 kun",
  "90d": "90 kun",
};

const AdminAnalytics = () => {
  const { t } = useTranslation();
  const [range, setRange] = useState<DateRange>("30d");
  const [showOnline, setShowOnline] = useState(true);
  const since = rangeMap[range];

  const { data: onlineUsers, isLoading: onlineLoading, refetch: refetchOnline } = useQuery({
    queryKey: ["admin-online-users"],
    queryFn: async () => {
      const { data: sessions, error } = await (supabase as any)
        .from("active_sessions")
        .select("*")
        .order("last_seen", { ascending: false });
      if (error) return [];

      const userIds = [...new Set((sessions || []).map((s: any) => s.user_id).filter(Boolean))];
      let profilesMap: Record<string, any> = {};
      if (userIds.length) {
        const { data: profiles } = await (supabase as any)
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", userIds);
        profiles?.forEach((p: any) => { profilesMap[p.user_id] = p; });
      }

      return (sessions || []).map((s: any) => ({
        ...s,
        full_name: s.full_name || profilesMap[s.user_id]?.full_name || null,
        avatar_url: profilesMap[s.user_id]?.avatar_url || null,
      }));
    },
    refetchInterval: 10_000,
  });

  const { data: topUsers, isLoading: topUsersLoading } = useQuery({
    queryKey: ["admin-top-users", range],
    queryFn: async () => {
      try {
        const { data: views, error } = await (supabase as any)
          .from("page_views")
          .select("user_id, session_id, viewed_at")
          .gte("viewed_at", since)
          .not("user_id", "is", null);
        if (error) throw error;

        const userVisits: Record<string, { visits: number; sessions: Set<string>; lastVisit: string }> = {};
        (views || []).forEach((v: any) => {
          if (!v.user_id) return;
          if (!userVisits[v.user_id]) {
            userVisits[v.user_id] = { visits: 0, sessions: new Set(), lastVisit: v.viewed_at };
          }
          userVisits[v.user_id].visits++;
          userVisits[v.user_id].sessions.add(v.session_id);
          if (v.viewed_at > userVisits[v.user_id].lastVisit) {
            userVisits[v.user_id].lastVisit = v.viewed_at;
          }
        });

        const topUserIds = Object.entries(userVisits)
          .sort(([, a], [, b]) => b.visits - a.visits)
          .slice(0, 10)
          .map(([userId]) => userId);

        if (!topUserIds.length) return [];

        const { data: profiles } = await (supabase as any)
          .from("profiles")
          .select("user_id, full_name, avatar_url, role")
          .in("user_id", topUserIds);
        const pMap: Record<string, any> = {};
        profiles?.forEach((p: any) => { pMap[p.user_id] = p; });

        return topUserIds.map(userId => ({
          user_id: userId,
          full_name: pMap[userId]?.full_name || "Noma'lum",
          avatar_url: pMap[userId]?.avatar_url || null,
          role: pMap[userId]?.role || "student",
          visits: userVisits[userId].visits,
          sessions: userVisits[userId].sessions.size,
          lastVisit: userVisits[userId].lastVisit,
        }));
      } catch {
        return [];
      }
    },
    staleTime: 60_000,
  });

  const { data: pageStats, isLoading: pageLoading } = useQuery({
    queryKey: ["admin-page-stats", range],
    queryFn: async () => {
      try {
        const { data: views, error } = await (supabase as any)
          .from("page_views")
          .select("session_id, user_id, viewed_at, duration_ms, device_type, page_path, page_title")
          .gte("viewed_at", since);
        if (error) throw error;

        const pageMap: Record<string, {
          path: string;
          title: string;
          views: number;
          uniqueUsers: Set<string>;
          uniqueSessions: Set<string>;
          totalDuration: number;
          durations: number[];
        }> = {};

        (views || []).forEach((v: any) => {
          const key = v.page_path || "/";
          if (!pageMap[key]) {
            pageMap[key] = {
              path: v.page_path,
              title: v.page_title || v.page_path,
              views: 0,
              uniqueUsers: new Set(),
              uniqueSessions: new Set(),
              totalDuration: 0,
              durations: [],
            };
          }
          const p = pageMap[key];
          p.views++;
          if (v.user_id) p.uniqueUsers.add(v.user_id);
          if (v.session_id) p.uniqueSessions.add(v.session_id);
          if (v.duration_ms) {
            p.totalDuration += v.duration_ms;
            p.durations.push(v.duration_ms);
          }
        });

        return Object.values(pageMap)
          .map(p => ({
            path: p.path,
            title: p.title,
            views: p.views,
            uniqueVisitors: p.uniqueUsers.size,
            uniqueSessions: p.uniqueSessions.size,
            avgDuration: p.durations.length
              ? Math.round(p.durations.reduce((a, b) => a + b, 0) / p.durations.length / 1000)
              : 0,
            bounceRate: p.uniqueSessions.size > 0
              ? Math.round((1 / p.uniqueSessions.size) * 100)
              : 0,
          }))
          .sort((a, b) => b.views - a.views);
      } catch {
        return [];
      }
    },
    staleTime: 60_000,
  });

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ["admin-analytics-overview", range],
    queryFn: async () => {
      const safeQuery = async (table: string, select: string, filters?: string) => {
        try {
          let q = (supabase as any).from(table).select(select);
          if (filters) q = q.gte(select.split(",")[0].trim(), filters);
          const { data, error } = await q;
          if (error) return [];
          return data || [];
        } catch {
          return [];
        }
      };

      const [views, devices, regs, hourly, onlineData] = await Promise.all([
        safeQuery("page_views", "session_id, user_id, viewed_at, duration_ms, device_type", since),
        safeQuery("device_stats", "device_type, sessions, pageviews"),
        safeQuery("daily_registrations", "day, new_users, students, teachers", since),
        safeQuery("hourly_traffic", "hour, day, sessions, pageviews"),
        safeQuery("current_online_users", "*"),
      ]);

      const uniqueSessions = new Set(views.map((v: any) => v.session_id).filter(Boolean)).size;
      const uniqueVisitors = new Set(views.map((v: any) => v.user_id).filter(Boolean)).size;
      const totalViews = views.length;
      const avgDuration = views.length
        ? Math.round(views.reduce((s: number, v: any) => s + (v.duration_ms || 0), 0) / views.length / 1000)
        : 0;

      const sessionPageCounts: Record<string, number> = {};
      views.forEach((v: any) => {
        sessionPageCounts[v.session_id] = (sessionPageCounts[v.session_id] || 0) + 1;
      });
      const singlePageSessions = Object.values(sessionPageCounts).filter(c => c === 1).length;
      const bounceRate = uniqueSessions > 0 ? Math.round((singlePageSessions / uniqueSessions) * 100) : 0;

      const dailyMap: Record<string, number> = {};
      views.forEach((v: any) => {
        const day = new Date(v.viewed_at).toISOString().slice(0, 10);
        dailyMap[day] = (dailyMap[day] || 0) + 1;
      });
      const dailyViews = Object.entries(dailyMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([day, count]) => ({
          day: new Date(day).toLocaleDateString("uz-UZ", { month: "short", day: "numeric" }),
          count,
        }));

      const regMap: Record<string, number> = {};
      regs.forEach((r: any) => { regMap[r.day] = (regMap[r.day] || 0) + (r.new_users || 0); });
      const dailyRegs = Object.entries(regMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([day, count]) => ({
          day: new Date(day).toLocaleDateString("uz-UZ", { month: "short", day: "numeric" }),
          count,
        }));

      const devList = devices.map((d: any) => ({
        type: d.device_type || "unknown",
        count: d.sessions || d.pageviews || 0,
        color: DEVICE_COLORS[d.device_type] || "#94A3B8",
      }));

      const hourlyFormatted = hourly
        .reduce((acc: any[], h: any) => {
          const existing = acc.find(a => a.hour === String(h.hour).padStart(2, "0"));
          if (existing) existing.session_count += h.sessions || 0;
          else acc.push({ hour: String(h.hour).padStart(2, "0"), session_count: h.sessions || 0 });
          return acc;
        }, [])
        .sort((a: any, b: any) => a.hour.localeCompare(b.hour));

      return {
        totalViews,
        uniqueVisitors,
        avgDuration,
        bounceRate,
        onlineCount: onlineData.length,
        dailyViews,
        dailyRegs,
        devList,
        hourly: hourlyFormatted,
      };
    },
    staleTime: 60_000,
  });

  const isLoading = onlineLoading || pageLoading || overviewLoading || topUsersLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    { label: "Sahifa ko'rishlari", value: overview?.totalViews ?? 0, icon: EyeIcon, color: "text-blue-500" },
    { label: "Unikal tashriflar", value: overview?.uniqueVisitors ?? 0, icon: UsersGroupTwoRoundedIcon, color: "text-emerald-500" },
    { label: "O'rtacha vaqt", value: `${overview?.avgDuration ?? 0}s`, icon: ClockCircleIcon, color: "text-amber-500" },
    { label: "Sakrash stavkasi", value: `${overview?.bounceRate ?? 0}%`, icon: ArrowUpRight, color: "text-rose-500" },
  ];

  const formatTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    if (diff < 60_000) return "Hozirgina";
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} daqiqa oldin`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} soat oldin`;
    return `${Math.floor(diff / 86_400_000)} kun oldin`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <ChartIcon className="w-5 h-5 text-blue-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Analitika</h1>
        </div>
        <div className="flex items-center gap-2">
          {(["today", "7d", "30d", "90d"] as DateRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                range === r
                  ? "bg-blue-500 text-white"
                  : "bg-slate-100 dark:bg-white/[0.06] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {rangeLabels[r]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <Icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{card.value}</p>
              <p className="text-xs text-slate-500 mt-1">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Hozir onlayn foydalanuvchilar */}
      <div className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setShowOnline(!showOnline)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Radio className={`w-4 h-4 animate-pulse ${showOnline ? "text-emerald-500" : "text-slate-400"}`} />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Hozir onlayn</span>
            <span className={`text-lg font-bold ${showOnline ? "text-emerald-500" : "text-slate-400"}`}>{onlineUsers?.length ?? 0}</span>
            <span className="text-[10px] text-slate-400 ml-1">{showOnline ? "▲ Yigish" : "▼ Kengaytirish"}</span>
          </button>
          <button
            onClick={() => refetchOnline()}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            <RefreshIcon className="w-3 h-3" />
            Yangilash
          </button>
        </div>
        {showOnline && (onlineUsers?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/[0.06]">
                  <th className="text-left pb-3 text-xs font-semibold text-slate-500">Foydalanuvchi</th>
                  <th className="text-left pb-3 text-xs font-semibold text-slate-500">Joriy sahifa</th>
                  <th className="text-left pb-3 text-xs font-semibold text-slate-500">Qurilma</th>
                  <th className="text-right pb-3 text-xs font-semibold text-slate-500">Oxirgi faollik</th>
                </tr>
              </thead>
              <tbody>
                {onlineUsers.map((u: any) => (
                  <tr key={u.session_id} className="border-b border-slate-50 dark:border-white/[0.03] last:border-0">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="w-7 h-7">
                          <AvatarImage src={u.avatar_url} />
                          <AvatarFallback className="text-[10px] bg-blue-100 text-blue-600">
                            {u.full_name?.charAt(0) || "M"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {u.full_name || "Mehmon"}
                          </p>
                          {u.user_id ? (
                            <p className="text-[10px] text-slate-400 font-mono">{u.user_id?.slice(0, 8)}...</p>
                          ) : (
                            <p className="text-[10px] text-slate-400 font-mono">{u.session_id?.slice(0, 8)}...</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-1.5">
                        <GlobeIcon className="w-3 h-3 text-slate-400" />
                        <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
                          {u.current_page || "/"}
                        </span>
                      </div>
                      {u.page_title && u.page_title !== u.current_page && (
                        <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[200px]">{u.page_title}</p>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-1.5">
                        {u.device_type === "mobile" ? <Smartphone className="w-3 h-3 text-slate-400" /> :
                         u.device_type === "tablet" ? <Tablet className="w-3 h-3 text-slate-400" /> :
                         <Monitor className="w-3 h-3 text-slate-400" />}
                        <span className="text-xs text-slate-500 capitalize">{u.device_type || "Noma'lum"}</span>
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <span className="text-[11px] text-slate-400">{formatTimeAgo(u.last_seen)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 flex items-center justify-center text-slate-400 text-sm">Hozir hech kim onlayn emas</div>
        ))}
      </div>

      {/* Top 10 eng faol foydalanuvchilar */}
      <div className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <CupFirstIcon className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Top 10 eng faol foydalanuvchilar</h3>
        </div>
        {topUsers?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/[0.06]">
                  <th className="text-left pb-3 text-xs font-semibold text-slate-500 w-8">#</th>
                  <th className="text-left pb-3 text-xs font-semibold text-slate-500">Foydalanuvchi</th>
                  <th className="text-center pb-3 text-xs font-semibold text-slate-500">Tashriflar</th>
                  <th className="text-center pb-3 text-xs font-semibold text-slate-500">Sessiyalar</th>
                  <th className="text-right pb-3 text-xs font-semibold text-slate-500">Oxirgi tashrif</th>
                </tr>
              </thead>
              <tbody>
                {topUsers.map((u: any, i: number) => (
                  <tr key={u.user_id} className="border-b border-slate-50 dark:border-white/[0.03] last:border-0">
                    <td className="py-3 pr-3">
                      <span className={`text-xs font-bold ${i < 3 ? "text-amber-500" : "text-slate-400"}`}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="w-7 h-7">
                          <AvatarImage src={u.avatar_url} />
                          <AvatarFallback className="text-[10px] bg-blue-100 text-blue-600">
                            {u.full_name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{u.full_name}</p>
                          <p className="text-[10px] text-slate-400">{u.role === "admin" ? "Admin" : u.role === "teacher" ? "O'qituvchi" : "O'quvchi"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{u.visits}</span>
                    </td>
                    <td className="py-3 text-center">
                      <span className="text-xs text-slate-500">{u.sessions}</span>
                    </td>
                    <td className="py-3 text-right">
                      <span className="text-[11px] text-slate-400">{formatTimeAgo(u.lastVisit)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 flex items-center justify-center text-slate-400 text-sm">Ma'lumot yo'q</div>
        )}
      </div>

      {/* Grafiklar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Kunlik tashriflar</h3>
          {overview?.dailyViews?.length ? (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={overview.dailyViews} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#CBD5E1" }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#CBD5E1" }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: 11 }} />
                  <Area type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} fill="url(#gViews)" dot={false} activeDot={{ r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[260px] flex items-center justify-center text-slate-400 text-sm">Ma'lumot yo'q</div>
          )}
        </div>

        <div className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Qurilmalar taqsimoti</h3>
          {overview?.devList?.length ? (
            <>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={overview.devList}
                      dataKey="count"
                      nameKey="type"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {overview.devList.map((d: any, i: number) => (
                        <Cell key={d.type} fill={d.color || COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-3">
                {overview.devList.map((d: any) => {
                  const total = overview.devList.reduce((s: number, v: any) => s + v.count, 0) || 1;
                  const pct = Math.round((d.count / total) * 100);
                  return (
                    <div key={d.type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {d.type === "mobile" ? <Smartphone className="w-3.5 h-3.5 text-slate-400" /> :
                         d.type === "tablet" ? <Tablet className="w-3.5 h-3.5 text-slate-400" /> :
                         <Monitor className="w-3.5 h-3.5 text-slate-400" />}
                        <span className="text-xs text-slate-600 dark:text-slate-400 capitalize">{d.type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: d.color }} />
                        </div>
                        <span className="text-xs font-semibold text-slate-500 w-8 text-right">{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="h-[260px] flex items-center justify-center text-slate-400 text-sm">Ma'lumot yo'q</div>
          )}
        </div>
      </div>

      {/* Kunlik ro'yxatdan o'tishlar */}
      <div className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Kunlik ro'yxatdan o'tishlar</h3>
        {overview?.dailyRegs?.length ? (
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overview.dailyRegs} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#CBD5E1" }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#CBD5E1" }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: 11 }} />
                <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">Ma'lumot yo'q</div>
        )}
      </div>

      {/* Trafik soat bo'yicha */}
      <div className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Trafik soat bo'yicha</h3>
        {overview?.hourly?.length ? (
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overview.hourly} barSize={12} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: "#CBD5E1" }} dy={6} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#CBD5E1" }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: 11 }} />
                <Bar dataKey="session_count" fill="#06B6D4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">Ma'lumot yo'q</div>
        )}
      </div>

      {/* Batafsil sahifa statistikasi */}
      <div className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <FileTextIcon className="w-4 h-4 text-blue-500" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Sahifalar batafsil statistikasi</h3>
        </div>
        {pageStats?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/[0.06]">
                  <th className="text-left pb-3 text-xs font-semibold text-slate-500">Sahifa</th>
                  <th className="text-center pb-3 text-xs font-semibold text-slate-500">Ko'rishlar</th>
                  <th className="text-center pb-3 text-xs font-semibold text-slate-500">Unikal tashriflar</th>
                  <th className="text-center pb-3 text-xs font-semibold text-slate-500">O'rtacha vaqt</th>
                  <th className="text-right pb-3 text-xs font-semibold text-slate-500">Sakrash %</th>
                </tr>
              </thead>
              <tbody>
                {pageStats.map((p: any) => {
                  const maxViews = pageStats[0]?.views || 1;
                  return (
                    <tr key={p.path} className="border-b border-slate-50 dark:border-white/[0.03] last:border-0">
                      <td className="py-3 pr-4">
                        <div>
                          <p className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">{p.path}</p>
                          {p.title && p.title !== p.path && (
                            <p className="text-[10px] text-slate-400 truncate max-w-[300px]">{p.title}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-blue-500"
                              style={{ width: `${Math.round((p.views / maxViews) * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{p.views}</span>
                        </div>
                      </td>
                      <td className="py-3 text-center">
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{p.uniqueVisitors}</span>
                      </td>
                      <td className="py-3 text-center">
                        <span className="text-xs text-slate-500">{p.avgDuration}s</span>
                      </td>
                      <td className="py-3 text-right">
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{p.bounceRate}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 flex items-center justify-center text-slate-400 text-sm">Sahifa ma'lumotlari yo'q</div>
        )}
      </div>
    </div>
  );
};

export default AdminAnalytics;
