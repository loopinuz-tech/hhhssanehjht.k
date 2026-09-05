import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RefreshIcon } from "@solar-icons/react/bold-duotone/refresh";
import { UsersGroupTwoRoundedIcon } from "@solar-icons/react/bold-duotone/users-group-two-rounded";
import { FileTextIcon } from "@solar-icons/react/bold-duotone/file-text";
import { DocumentTextIcon } from "@solar-icons/react/bold-duotone/document-text";
import { BookIcon } from "@solar-icons/react/bold-duotone/book";
import { CardIcon } from "@solar-icons/react/bold-duotone/card";
import { PulseIcon } from "@solar-icons/react/bold-duotone/pulse";
import { BoltIcon } from "@solar-icons/react/bold-duotone/bolt";
import { CalendarIcon } from "@solar-icons/react/bold-duotone/calendar";
import { MedalStarCircleIcon } from "@solar-icons/react/bold-duotone/medal-star-circle";
import { WalletIcon } from "@solar-icons/react/bold-duotone/wallet";
import { SpeakerIcon } from "@solar-icons/react/bold-duotone/speaker";
import { ShieldCheckIcon } from "@solar-icons/react/bold-duotone/shield-check";
import { AddCircleIcon as PlusCircleIcon } from "@solar-icons/react/bold-duotone/add-circle";
import { ArrowUpRight, UserPlus, Grid3X3, BookOpen, AlertCircle, Flame, Laptop, Smartphone, Eye, X, Globe, Radio } from "lucide-react";

const AdminDashboard = () => {
  const { t } = useTranslation();
  const { toast } = useToast();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      const fetchSafe = async (fn: () => Promise<any>, fallback: any = null) => {
        try {
          const res = await fn();
          return res.error ? fallback : res;
        } catch {
          return fallback;
        }
      };

      const todayStr = new Date().toISOString().split("T")[0];

      const [
        usersRes,
        testFoldersRes,
        questionsRes,
        testSessionsRes,
        mockSubmissionsRes,
        testTakersRes,
        mockTakersRes,
        complaintsRes,
        todayRegistrationsRes,
        activeSessionsRes,
        walletRes,
      ] = await Promise.all([
        fetchSafe(() => (supabase as any).from("profiles").select("user_id", { count: "exact", head: true }), { count: 0 }),
        fetchSafe(() => (supabase as any).from("test_folders").select("id", { count: "exact", head: true }), { count: 0 }),
        fetchSafe(() => (supabase as any).from("questions").select("id", { count: "exact", head: true }), { count: 0 }),
        fetchSafe(() => (supabase as any).from("test_sessions").select("id", { count: "exact", head: true }), { count: 0 }),
        fetchSafe(() => (supabase as any).from("mock_test_submissions").select("id", { count: "exact", head: true }), { count: 0 }),
        fetchSafe(() => (supabase as any).from("test_sessions").select("user_id").limit(1000), { data: [] }),
        fetchSafe(() => (supabase as any).from("mock_test_submissions").select("user_id").limit(1000), { data: [] }),
        fetchSafe(async () => {
          const res = await (supabase as any).from("complaints").select("id", { count: "exact", head: true });
          if (!res.error) return res;
          return (supabase as any).from("question_reports").select("id", { count: "exact", head: true });
        }, { count: 0 }),
        fetchSafe(() => (supabase as any).from("profiles").select("user_id", { count: "exact", head: true }).gte("created_at", todayStr), { count: 0 }),
        fetchSafe(() => (supabase as any).from("active_sessions").select("session_id", { count: "exact", head: true }).gte("last_seen", new Date(Date.now() - 15 * 60 * 1000).toISOString()), { count: 0 }),
        fetchSafe(() => (supabase as any).from("wallet_transactions").select("amount").eq("status", "completed").limit(1000), { data: [] }),
      ]);

      const totalUsers = usersRes?.count || 0;
      const totalTestFolders = testFoldersRes?.count || 0;
      const totalQuestions = questionsRes?.count || 0;
      const totalTestSessions = (testSessionsRes?.count || 0) + (mockSubmissionsRes?.count || 0);
      const totalComplaints = complaintsRes?.count || 0;

      let uniqueTestTakers = 0;
      const testTakerSet = new Set<string>();
      testTakersRes?.data?.forEach((t: any) => { if (t.user_id) testTakerSet.add(t.user_id); });
      mockTakersRes?.data?.forEach((m: any) => { if (m.user_id) testTakerSet.add(m.user_id); });
      uniqueTestTakers = testTakerSet.size;

      const todayRegistrations = todayRegistrationsRes?.count || 0;
      const activeOnlineUsers = activeSessionsRes?.count || 0;

      let totalIncome = 0;
      if (walletRes?.data) {
        totalIncome = walletRes.data.reduce((sum: number, tx: any) => sum + (tx.amount || 0), 0);
      }

      return {
        totalUsers,
        totalTestFolders,
        totalQuestions,
        totalTestSessions,
        uniqueTestTakers,
        totalComplaints,
        todayRegistrations,
        activeOnlineUsers,
        totalIncome,
      };
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: recentSessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ["admin-recent-sessions"],
    queryFn: async () => {
      try {
        const [folderRes, mockRes] = await Promise.all([
          (supabase as any)
            .from("test_sessions")
            .select("id, user_id, folder_id, score, finished_at, started_at, created_at")
            .order("created_at", { ascending: false })
            .limit(10),
          (supabase as any)
            .from("mock_test_submissions")
            .select("id, user_id, test_id, score, status, created_at")
            .order("created_at", { ascending: false })
            .limit(10),
        ]);

        const sessions = folderRes.data || [];
        const mockSubs = mockRes.data || [];

        const userIds = [
          ...new Set([
            ...sessions.map((s: any) => s.user_id),
            ...mockSubs.map((m: any) => m.user_id),
          ].filter(Boolean))
        ];
        const folderIds = [...new Set(sessions.map((s: any) => s.folder_id).filter(Boolean))];
        const mockTestIds = [...new Set(mockSubs.map((m: any) => m.test_id).filter(Boolean))];

        let profilesMap: Record<string, string> = {};
        let foldersMap: Record<string, string> = {};
        let mockTestsMap: Record<string, string> = {};

        if (userIds.length > 0) {
          const { data: profiles } = await (supabase as any)
            .from("profiles")
            .select("user_id, full_name")
            .in("user_id", userIds);
          profiles?.forEach((p: any) => { profilesMap[p.user_id] = p.full_name; });
        }

        if (folderIds.length > 0) {
          const { data: testFolders } = await (supabase as any)
            .from("test_folders")
            .select("id, name")
            .in("id", folderIds);
          testFolders?.forEach((f: any) => { foldersMap[f.id] = f.name; });
        }

        if (mockTestIds.length > 0) {
          const { data: mockTests } = await (supabase as any)
            .from("mock_tests")
            .select("id, title")
            .in("id", mockTestIds);
          mockTests?.forEach((m: any) => { mockTestsMap[m.id] = m.title; });
        }

        const normalizedFolderSessions = sessions.map((s: any) => ({
          id: `folder-${s.id}`,
          userName: profilesMap[s.user_id] || "Foydalanuvchi",
          testName: foldersMap[s.folder_id] || "Mavzulashtirilgan test",
          isMock: false,
          score: s.score || 0,
          isFinished: !!s.finished_at,
          date: s.finished_at || s.created_at || s.started_at,
        }));

        const normalizedMockSessions = mockSubs.map((m: any) => ({
          id: `mock-${m.id}`,
          userName: profilesMap[m.user_id] || "Foydalanuvchi",
          testName: mockTestsMap[m.test_id] || "Mock test",
          isMock: true,
          score: m.score || 0,
          isFinished: m.status === "completed" || m.score > 0,
          date: m.created_at,
        }));

        const combined = [...normalizedFolderSessions, ...normalizedMockSessions].sort((a, b) => {
          const dateA = a.date ? new Date(a.date).getTime() : 0;
          const dateB = b.date ? new Date(b.date).getTime() : 0;
          return dateB - dateA;
        });

        return combined.slice(0, 6);
      } catch (error: any) {
        toast({ title: "Xatolik", description: "So'nggi imtihonlarni yuklashda xatolik", variant: "destructive" });
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: roleStats } = useQuery({
    queryKey: ["admin-role-stats"],
    queryFn: async () => {
      try {
        const { data: profiles, error } = await (supabase as any)
          .from("profiles")
          .select("role");

        if (error) throw error;
        if (!profiles || profiles.length === 0) return [];

        const roleCounts: Record<string, number> = {};
        profiles.forEach((p: any) => {
          const role = p.role || "user";
          roleCounts[role] = (roleCounts[role] || 0) + 1;
        });

        return Object.entries(roleCounts).map(([role, count]) => ({ role, count }));
      } catch (error: any) {
        toast({ title: "Xatolik", description: "Rol statistikasini yuklashda xatolik", variant: "destructive" });
        throw error;
      }
    },
  });

  const { data: recentUsers, isLoading: usersLoading } = useQuery({
    queryKey: ["admin-recent-users"],
    queryFn: async () => {
      try {
        const { data, error } = await (supabase as any)
          .from("profiles")
          .select("user_id, full_name, created_at, role")
          .order("created_at", { ascending: false })
          .limit(5);

        if (error) throw error;
        return data || [];
      } catch (error: any) {
        toast({ title: "Xatolik", description: "So'nggi foydalanuvchilarni yuklashda xatolik", variant: "destructive" });
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  const [streakFilter, setStreakFilter] = useState<number>(0);

  const { data: topStreakUsers = [], isLoading: streaksLoading } = useQuery({
    queryKey: ["admin-top-streak-users"],
    queryFn: async () => {
      try {
        const { data, error } = await (supabase as any)
          .from("profiles")
          .select("user_id, full_name, email, phone, login_streak, avatar_url, last_active_date, role")
          .order("login_streak", { ascending: false })
          .limit(20);

        if (error) throw error;
        return data || [];
      } catch (error: any) {
        toast({ title: "Xatolik", description: "Top streak foydalanuvchilarini yuklashda xatolik", variant: "destructive" });
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  const filteredStreakUsers = useMemo(() => {
    return topStreakUsers.filter((u: any) => (u.login_streak || 0) >= streakFilter);
  }, [topStreakUsers, streakFilter]);

  const [onlineTab, setOnlineTab] = useState<"all" | "users" | "guests">("all");
  const [showOnlineModal, setShowOnlineModal] = useState(false);

  const { data: onlineSessions = [], isLoading: onlineLoading, refetch: refetchOnline } = useQuery({
    queryKey: ["admin-live-online-users"],
    queryFn: async () => {
      try {
        const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
        const { data: sessions, error } = await (supabase as any)
          .from("active_sessions")
          .select("*")
          .gte("last_seen", fifteenMinsAgo)
          .order("last_seen", { ascending: false });

        if (error) throw error;
        if (!sessions || sessions.length === 0) return [];

        const userIds = [...new Set(sessions.map((s: any) => s.user_id).filter(Boolean))];
        let profilesMap: Record<string, any> = {};

        if (userIds.length > 0) {
          const { data: profiles } = await (supabase as any)
            .from("profiles")
            .select("user_id, full_name, avatar_url, role, phone, email")
            .in("user_id", userIds);

          profiles?.forEach((p: any) => { profilesMap[p.user_id] = p; });
        }

        return sessions.map((s: any) => {
          const prof = s.user_id ? profilesMap[s.user_id] : null;
          return {
            ...s,
            displayName: prof?.full_name || s.full_name || "Mehmon (Anonim)",
            avatarUrl: prof?.avatar_url || null,
            role: prof?.role || (s.user_id ? "user" : "guest"),
            contact: prof?.phone || prof?.email || "—",
            isGuest: !s.user_id,
          };
        });
      } catch (error: any) {
        return [];
      }
    },
    refetchInterval: 60_000,
  });

  const filteredOnlineSessions = useMemo(() => {
    if (onlineTab === "users") return onlineSessions.filter((s: any) => !s.isGuest);
    if (onlineTab === "guests") return onlineSessions.filter((s: any) => s.isGuest);
    return onlineSessions;
  }, [onlineSessions, onlineTab]);

  const statCards = stats
    ? [
        {
          label: "Jami foydalanuvchilar",
          value: stats.totalUsers,
          unit: " ta a'zo",
          icon: UsersGroupTwoRoundedIcon,
          color: "bg-blue-500",
          detail: `${stats.todayRegistrations} ta bugun qo'shildi`,
          badgeColor: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20",
          dotColor: "bg-blue-500",
        },
        {
          label: "Test papkalari soni",
          value: stats.totalTestFolders,
          unit: " ta papka",
          icon: FileTextIcon,
          color: "bg-emerald-500",
          detail: `Jami ${stats.totalQuestions.toLocaleString()} ta savol mavjud`,
          badgeColor: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20",
          dotColor: "bg-emerald-500",
        },
        {
          label: "Jami savollar soni",
          value: stats.totalQuestions,
          unit: " ta savol",
          icon: DocumentTextIcon,
          color: "bg-indigo-500",
          detail: `${stats.totalTestFolders.toLocaleString()} ta papka ichida`,
          badgeColor: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20",
          dotColor: "bg-indigo-500",
        },
        {
          label: "Topshirilgan imtihonlar",
          value: stats.totalTestSessions,
          unit: " ta urinish",
          icon: BookIcon,
          color: "bg-violet-500",
          detail: `${stats.uniqueTestTakers} ta foydalanuvchi ishlagan`,
          badgeColor: "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/20",
          dotColor: "bg-violet-500",
        },
        {
          label: "Bugun ro'yxatdan o'tganlar",
          value: stats.todayRegistrations,
          unit: " ta yangi",
          icon: UserPlus,
          color: "bg-amber-500",
          detail: "Bugungi yangi a'zolar",
          badgeColor: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20",
          dotColor: "bg-amber-500",
        },
        {
          label: "Faol foydalanuvchilar",
          value: onlineSessions.length || stats.activeOnlineUsers,
          unit: " onlayn",
          icon: PulseIcon,
          color: "bg-rose-500",
          detail: "🟢 Jonli ro'yxatni ko'rish (Bosing)",
          badgeColor: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 cursor-pointer hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all",
          dotColor: "bg-rose-500",
          onClick: () => setShowOnlineModal(true),
        },
        {
          label: "Jami tushum",
          value: stats.totalIncome,
          icon: CardIcon,
          color: "bg-cyan-500",
          isCurrency: true,
          detail: "Platforma umumiy daromadi",
          badgeColor: "text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20",
          dotColor: "bg-cyan-500",
        },
        {
          label: "Shikoyat va e'tirozlar",
          value: stats.totalComplaints,
          unit: " ta shikoyat",
          icon: AlertCircle,
          color: "bg-orange-500",
          detail: stats.totalComplaints === 0 ? "Barcha savollar tasdiqlangan" : `${stats.totalComplaints} ta shikoyat mavjud`,
          badgeColor: stats.totalComplaints === 0 ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20" : "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20",
          dotColor: stats.totalComplaints === 0 ? "bg-emerald-500" : "bg-amber-500",
        },
      ]
    : [];

  const roleColors: Record<string, string> = {
    admin: "bg-[#E8192C]",
    teacher: "bg-violet-500",
    student: "bg-emerald-500",
    user: "bg-blue-500",
  };

  const getRoleBadge = (role: string) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20";
      case "teacher":
      case "o'qituvchi":
        return "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-500/20";
      case "student":
      case "o'quvchi":
        return "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20";
      default:
        return "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20";
    }
  };

  return (
    <div className="w-full space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheckIcon className="w-5 h-5 text-[#E8192C]" />
            <span>Admin Boshqaruv Paneli</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Platforma tizimining to'liq holati va tezkor harakatlar</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to="/admin/tests/builder"
            className="px-3 py-2 rounded-xl bg-[#E8192C] text-white text-xs font-bold shadow-md hover:bg-red-700 transition-all flex items-center gap-1.5"
          >
            <PlusCircleIcon className="w-4 h-4" />
            <span>Yangi Test Yaratish</span>
          </Link>
          <Link
            to="/admin/users"
            className="px-3 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold shadow-sm hover:opacity-90 transition-all flex items-center gap-1.5"
          >
            <UsersGroupTwoRoundedIcon className="w-4 h-4" />
            <span>Foydalanuvchilar</span>
          </Link>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
        {[
          { label: "Testlar", path: "/admin/tests", icon: FileTextIcon, color: "text-blue-500 bg-blue-50 dark:bg-blue-500/10" },
          { label: "Mock Test", path: "/admin/mock-tests", icon: MedalStarCircleIcon, color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10" },
          { label: "Foydalanuvchilar", path: "/admin/users", icon: UsersGroupTwoRoundedIcon, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10" },
          { label: "Katalog", path: "/admin/catalog", icon: Grid3X3, color: "text-teal-500 bg-teal-50 dark:bg-teal-500/10" },
          { label: "Moliya", path: "/admin/finance", icon: WalletIcon, color: "text-amber-500 bg-amber-50 dark:bg-amber-500/10" },
          { label: "E'lonlar", path: "/admin/announcements", icon: SpeakerIcon, color: "text-pink-500 bg-pink-50 dark:bg-pink-500/10" },
        ].map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="p-3 rounded-xl bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/[0.12] transition-all flex items-center gap-2.5 group shadow-xs"
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.color}`}>
              <item.icon className="w-4 h-4 transition-transform group-hover:scale-110" />
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{item.label}</span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {statsLoading
          ? Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl p-5 flex items-center justify-center min-h-[100px]">
                <RefreshIcon className="w-5 h-5 text-slate-400 animate-spin" />
              </div>
            ))
          : statCards.map((stat) => (
              <div
                key={stat.label}
                onClick={stat.onClick}
                className={`bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl p-5 hover:border-slate-300 dark:hover:border-white/[0.1] transition-all ${
                  stat.onClick ? "cursor-pointer hover:scale-[1.01]" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="w-4 h-4 text-white" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex items-baseline gap-1">
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {stat.isCurrency ? `${stat.value.toLocaleString()} so'm` : stat.value.toLocaleString()}
                  </p>
                  {stat.unit && <span className="text-[12px] font-semibold text-slate-400">{stat.unit}</span>}
                </div>
                <p className="text-[11px] font-medium text-slate-500 mt-1">{stat.label}</p>
                {stat.detail && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-white/[0.04]">
                    <span
                      onClick={(e) => {
                        if (stat.onClick) {
                          e.stopPropagation();
                          stat.onClick();
                        }
                      }}
                      className={`inline-flex items-center gap-1.5 text-[10.5px] font-extrabold px-2 py-0.5 rounded-md border ${stat.badgeColor}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${stat.dotColor} shrink-0 animate-pulse`} />
                      <span>{stat.detail}</span>
                    </span>
                  </div>
                )}
              </div>
            ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">So'nggi imtihonlar</h3>
          {sessionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshIcon className="w-5 h-5 text-slate-400 animate-spin" />
            </div>
          ) : recentSessions && recentSessions.length > 0 ? (
            <div className="space-y-3">
              {recentSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/[0.02] rounded-xl border border-slate-100 dark:border-white/[0.04]">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                      session.isMock
                        ? "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400"
                        : "bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/20 text-violet-600 dark:text-violet-400"
                    }`}>
                      {session.isMock ? <MedalStarCircleIcon className="w-4.5 h-4.5" /> : <BookIcon className="w-4.5 h-4.5" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <p className="text-[13px] font-bold text-slate-900 dark:text-white truncate">{session.userName}</p>
                        {session.isMock && (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0">
                            MOCK
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{session.testName}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-lg border ${
                        session.isFinished
                          ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                          : "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20"
                      }`}
                    >
                      {session.isFinished ? `${session.score} ball` : "Jarayonda"}
                    </span>
                    <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                      {session.date ? new Date(session.date).toLocaleDateString("uz-UZ") : "—"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <BookOpen className="w-8 h-8 mb-2" />
              <p className="text-[13px] font-medium">Hali imtihonlar yo'q</p>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Foydalanuvchilar roli bo'yicha</h3>
          {roleStats && roleStats.length > 0 ? (
            <div className="space-y-3">
              {roleStats.map((item) => {
                const total = roleStats.reduce((sum, r) => sum + r.count, 0);
                const percentage = total > 0 ? (item.count / total) * 100 : 0;
                return (
                  <div key={item.role} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${roleColors[item.role] || "bg-slate-400"}`} />
                        <span className="text-[13px] font-medium text-slate-900 dark:text-white capitalize">{item.role}</span>
                      </div>
                      <span className="text-[11px] font-medium text-slate-500">{item.count}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${roleColors[item.role] || "bg-slate-400"}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <UsersGroupTwoRoundedIcon className="w-8 h-8 mb-2" />
              <p className="text-[13px] font-medium">Ma'lumotlar topilmadi</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top Streak Users */}
        <div className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Flame className="w-4.5 h-4.5 text-orange-500 fill-orange-500 animate-pulse" />
                <span>Eng yuqori streak egalari</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Ketma-ket platformaga kirgan faol a'zolar</p>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/[0.04] p-1 rounded-lg self-start sm:self-auto">
              {[
                { label: "Barchasi", minDays: 0 },
                { label: "2+ kun", minDays: 2 },
                { label: "3+ kun", minDays: 3 },
                { label: "7+ kun", minDays: 7 },
              ].map((filter) => (
                <button
                  key={filter.minDays}
                  onClick={() => setStreakFilter(filter.minDays)}
                  className={`px-2.5 py-1 rounded-md text-[10.5px] font-extrabold transition-all ${
                    streakFilter === filter.minDays
                      ? "bg-orange-500 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {streaksLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshIcon className="w-5 h-5 text-slate-400 animate-spin" />
            </div>
          ) : filteredStreakUsers && filteredStreakUsers.length > 0 ? (
            <div className="space-y-2.5">
              {filteredStreakUsers.slice(0, 6).map((user: any, idx: number) => {
                const rankColor =
                  idx === 0
                    ? "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30"
                    : idx === 1
                    ? "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-500/20 dark:text-slate-300 dark:border-slate-500/30"
                    : idx === 2
                    ? "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/30"
                    : "bg-slate-50 text-slate-600 border-slate-200 dark:bg-white/[0.04] dark:text-slate-400 dark:border-white/[0.06]";

                const badgeText = idx === 0 ? "🥇 1" : idx === 1 ? "🥈 2" : idx === 2 ? "🥉 3" : `#${idx + 1}`;

                return (
                  <div
                    key={user.user_id || idx}
                    className="flex items-center justify-between p-2.5 bg-slate-50/70 dark:bg-white/[0.02] rounded-xl border border-slate-100 dark:border-white/[0.04] hover:border-orange-500/30 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black border shrink-0 ${rankColor}`}>
                        {badgeText}
                      </span>
                      <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-white/10 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt={user.full_name || ""} className="w-full h-full object-cover" />
                        ) : (
                          (user.full_name?.[0] || "F").toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-slate-900 dark:text-white truncate">
                          {user.full_name || "Noma'lum foydalanuvchi"}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-mono">
                          {user.phone || user.email || "—"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 text-[12px] font-extrabold">
                        <Flame className="w-3.5 h-3.5 fill-orange-500" />
                        <span>{user.login_streak || 0} kun</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <Flame className="w-8 h-8 mb-2 text-slate-300 dark:text-slate-600" />
              <p className="text-[13px] font-medium">Foydalanuvchilar topilmadi</p>
            </div>
          )}
        </div>

        {/* So'nggi ro'yxatdan o'tganlar */}
        <div className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">So'nggi ro'yxatdan o'tganlar</h3>
          {usersLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshIcon className="w-5 h-5 text-slate-400 animate-spin" />
            </div>
          ) : recentUsers && recentUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-white/[0.06]">
                    <th className="text-left text-[11px] font-medium text-slate-500 pb-3 uppercase tracking-wider">Ism</th>
                    <th className="text-left text-[11px] font-medium text-slate-500 pb-3 uppercase tracking-wider">Rol</th>
                    <th className="text-left text-[11px] font-medium text-slate-500 pb-3 uppercase tracking-wider">Sana</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-white/[0.04]">
                  {recentUsers.map((user) => (
                    <tr key={user.user_id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 text-[13px] font-medium text-slate-900 dark:text-white">{user.full_name || "Noma'lum foydalanuvchi"}</td>
                      <td className="py-3">
                        <span className={`text-[10.5px] font-extrabold uppercase px-2.5 py-0.5 rounded-lg border ${getRoleBadge(user.role)}`}>
                          {user.role || "user"}
                        </span>
                      </td>
                      <td className="py-3 text-[12px] font-mono text-slate-500 dark:text-slate-400">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString("uz-UZ") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <UserPlus className="w-8 h-8 mb-2" />
              <p className="text-[13px] font-medium">Hali ro'yxatdan o'tgan foydalanuvchilar yo'q</p>
            </div>
          )}
        </div>
      </div>

      {/* Live Online Users Modal */}
      {showOnlineModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2.5">
                <div className="relative flex items-center justify-center">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping absolute opacity-75" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500 relative" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Ayni vaqtda onlayn foydalanuvchilar
                    <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                      {onlineSessions.length} ta
                    </span>
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Har 10 soniyada avtomatik yangilanadi</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => refetchOnline()}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all"
                  title="Qayta yuklash"
                >
                  <RefreshIcon className={`w-4 h-4 ${onlineLoading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setShowOnlineModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="px-5 py-2.5 border-b border-slate-100 dark:border-white/[0.04] bg-slate-50/30 dark:bg-slate-900/30 flex items-center gap-2 overflow-x-auto">
              <button
                onClick={() => setOnlineTab("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                  onlineTab === "all"
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
                }`}
              >
                Barchasi ({onlineSessions.length})
              </button>
              <button
                onClick={() => setOnlineTab("users")}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                  onlineTab === "users"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
                }`}
              >
                A'zolar ({onlineSessions.filter((s: any) => !s.isGuest).length})
              </button>
              <button
                onClick={() => setOnlineTab("guests")}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                  onlineTab === "guests"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
                }`}
              >
                Mehmonlar ({onlineSessions.filter((s: any) => s.isGuest).length})
              </button>
            </div>

            {/* Session List */}
            <div className="p-5 overflow-y-auto space-y-3 flex-1 max-h-[60vh]">
              {filteredOnlineSessions.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <PulseIcon className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                  <p className="text-xs font-medium">Hozirda mos keladigan faol foydalanuvchilar yo'q</p>
                </div>
              ) : (
                filteredOnlineSessions.map((s: any) => {
                  const minsAgo = Math.floor((Date.now() - new Date(s.last_seen).getTime()) / 60000);
                  const timeText = minsAgo <= 0 ? "Hozirgincha" : `${minsAgo} min oldin`;
                  const isMobile = s.device_type === "mobile";

                  return (
                    <div
                      key={s.session_id}
                      className="p-3 bg-slate-50/70 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04] rounded-xl flex items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-white/10 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-white/10 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300">
                          {s.avatarUrl ? (
                            <img src={s.avatarUrl} alt={s.displayName} className="w-full h-full object-cover" />
                          ) : (
                            (s.displayName?.[0] || "M").toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[13px] font-bold text-slate-900 dark:text-white truncate">
                              {s.displayName}
                            </span>
                            <span className={`text-[9.5px] font-extrabold uppercase px-2 py-0.2 rounded-md border ${getRoleBadge(s.role)}`}>
                              {s.role}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                            <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium truncate">
                              <Eye className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span className="truncate">{s.page_title || s.current_page || "/"}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex flex-col items-end gap-1">
                        <span className="inline-flex items-center gap-1.5 text-[10.5px] font-extrabold px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          {timeText}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                          {isMobile ? <Smartphone className="w-3 h-3 text-slate-400" /> : <Laptop className="w-3 h-3 text-slate-400" />}
                          {s.device_type || "desktop"}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
