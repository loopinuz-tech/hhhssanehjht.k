import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2, Users, BookOpen, FileText, CheckCircle2,
  AlertTriangle, XCircle, Search, Filter, Eye, ShieldCheck,
  CreditCard, TrendingUp, ExternalLink, RefreshCw, Check, X,
  Clock, Phone, Mail, MapPin, DollarSign, Loader2, Send, Copy
} from "lucide-react";
import { BuildingsIcon } from "@solar-icons/react/bold-duotone/buildings";
import { CheckCircleIcon as SolarCheckCircleIcon } from "@solar-icons/react/bold-duotone/check-circle";
import { ClockCircleIcon } from "@solar-icons/react/bold-duotone/clock-circle";
import { UserRoundedIcon } from "@solar-icons/react/bold-duotone/user-rounded";
import { Book2Icon } from "@solar-icons/react/bold-duotone/book-2";
import { DocumentTextIcon } from "@solar-icons/react/bold-duotone/document-text";
import { Chart2Icon } from "@solar-icons/react/bold-duotone/chart-2";
import { DollarMinimalisticIcon } from "@solar-icons/react/bold-duotone/dollar-minimalistic";
import { MagnifierIcon } from "@solar-icons/react/bold-duotone/magnifier";
import { EyeIcon } from "@solar-icons/react/bold-duotone/eye";
import { CloseCircleIcon } from "@solar-icons/react/bold-duotone/close-circle";
import { SendSquareIcon } from "@solar-icons/react/bold-duotone/send-square";
import { RestartCircleIcon } from "@solar-icons/react/bold-duotone/restart-circle";
import { ShieldCheckIcon } from "@solar-icons/react/bold-duotone/shield-check";
import SEO from "@/components/SEO";
import { useToast } from "@/hooks/use-toast";

interface CenterItem {
  id: string;
  name: string;
  legal_name?: string;
  username: string;
  status: "PENDING_APPROVAL" | "PENDING_PAYMENT" | "ACTIVE" | "SUSPENDED" | "REJECTED";
  logo_url?: string;
  phone?: string;
  email?: string;
  address?: string;
  telegram_chat_id?: number | string;
  telegram_username?: string;
  telegram_linked_at?: string;
  created_at: string;
  owner: {
    user_id?: string;
    full_name?: string;
    email?: string;
    phone?: string;
  };
  students_count: number;
  classes_count: number;
  mocks_count: number;
  application?: {
    id: string;
    status: string;
    inn?: string;
    director_name?: string;
    contact_phone?: string;
    created_at: string;
    payment_status?: string;
    payment_order_id?: string;
    rejection_reason?: string;
    plan_name?: string;
    plan_price?: number;
  };
}

interface AnalyticsData {
  totalCenters: number;
  activeCenters: number;
  pendingApplications: number;
  totalStudents: number;
  totalClasses: number;
  totalMocks: number;
  totalAttempts: number;
  mrr: number;
}

export default function AdminCenters() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"all" | "pending" | "active" | "suspended" | "rejected">("all");
  const [search, setSearch] = useState("");
  const [selectedCenter, setSelectedCenter] = useState<CenterItem | null>(null);
  const [rejectModalCenter, setRejectModalCenter] = useState<CenterItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [approvedModalData, setApprovedModalData] = useState<{ centerName: string; credentials: any } | null>(null);

  // Fetch Analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery<AnalyticsData>({
    queryKey: ["admin-centers-analytics"],
    queryFn: async () => {
      const res = await fetch("/api/admin/centers/analytics", { credentials: "include" });
      if (!res.ok) throw new Error("Statistikani yuklab bo'lmadi");
      return res.json();
    }
  });

  // Fetch Centers
  const { data: centersData, isLoading: centersLoading, refetch } = useQuery<{ centers: CenterItem[] } | CenterItem[]>({
    queryKey: ["admin-centers", activeTab],
    queryFn: async () => {
      const res = await fetch(`/api/admin/centers?status=${activeTab}`, { credentials: "include" });
      if (!res.ok) throw new Error("Markazlar ro'yxatini yuklab bo'lmadi");
      return res.json();
    }
  });

  const centers: CenterItem[] = Array.isArray(centersData)
    ? centersData
    : (centersData?.centers || []);

  const filteredCenters = centers.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.username.toLowerCase().includes(q) ||
      (c.legal_name && c.legal_name.toLowerCase().includes(q)) ||
      (c.owner?.full_name && c.owner.full_name.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q))
    );
  });

  // Approve Action
  const handleApprove = async (centerId: string) => {
    if (!confirm("Haqiqatdan ham ushbu markaz arizasini tasdiqlamoqchimisiz?")) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/admin/centers/${centerId}/approve`, {
        method: "POST",
        credentials: "include"
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Tasdiqlashda xatolik");

      if (json.credentials) {
        setApprovedModalData({
          centerName: selectedCenter?.name || centers.find(c => c.id === centerId)?.name || "O'quv markazi",
          credentials: json.credentials
        });
      } else {
        toast({ title: "Muvaffaqiyatli!", description: "Markaz tasdiqlandi va faollashtirildi" });
      }
      setSelectedCenter(null);
      queryClient.invalidateQueries({ queryKey: ["admin-centers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-centers-analytics"] });
    } catch (err: any) {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  // Reject Action
  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalCenter) return;

    setIsProcessing(true);
    try {
      const res = await fetch(`/api/admin/centers/${rejectModalCenter.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reason: rejectReason })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Rad etishda xatolik");

      toast({ title: "Rad etildi", description: "Markaz arizasi rad etildi" });
      setRejectModalCenter(null);
      setRejectReason("");
      queryClient.invalidateQueries({ queryKey: ["admin-centers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-centers-analytics"] });
    } catch (err: any) {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  // Toggle Suspend / Active status
  const handleToggleStatus = async (centerId: string, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    const confirmMsg =
      newStatus === "SUSPENDED"
        ? "Ushbu markazni to'xtatmoqchimisiz (SUSPEND)?"
        : "Ushbu markazni qayta faollashtirmoqchimisiz?";

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/admin/centers/${centerId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Holatni o'zgartirishda xatolik");

      toast({ title: "Yangilandi", description: `Markaz holati: ${newStatus}` });
      queryClient.invalidateQueries({ queryKey: ["admin-centers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-centers-analytics"] });
    } catch (err: any) {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-8 pb-16">
      <SEO title="O'quv markazlari (B2B) | EduContest Super Admin" description="Markazlar va arizalar boshqaruvi" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            O'quv markazlari (B2B)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Ta'lim markazlari arizalari, obunalari, sinflari va statistikasi boshqaruvi
          </p>
        </div>

        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all"
        >
          <RestartCircleIcon size={18} className="text-slate-500" />
          Yangilash
        </button>
      </div>

      {/* Analytics Row */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
              <BuildingsIcon size={22} className="text-slate-700 dark:text-slate-300" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400">Jami markazlar</p>
              <p className="text-xl font-black text-slate-900 dark:text-white">{analytics.totalCenters}</p>
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
              <SolarCheckCircleIcon size={22} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400">Faol markazlar</p>
              <p className="text-xl font-black text-green-600 dark:text-green-400">{analytics.activeCenters}</p>
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
              <ClockCircleIcon size={22} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400">Yangi arizalar</p>
              <p className="text-xl font-black text-amber-500">{analytics.pendingApplications}</p>
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
              <UserRoundedIcon size={22} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400">O'quvchilar</p>
              <p className="text-xl font-black text-blue-600 dark:text-blue-400">{analytics.totalStudents}</p>
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
              <Book2Icon size={22} className="text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400">Sinflar</p>
              <p className="text-xl font-black text-violet-600 dark:text-violet-400">{analytics.totalClasses}</p>
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
              <DocumentTextIcon size={22} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400">Mock testlar</p>
              <p className="text-xl font-black text-indigo-600 dark:text-indigo-400">{analytics.totalMocks}</p>
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0">
              <Chart2Icon size={22} className="text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400">Topshirishlar</p>
              <p className="text-xl font-black text-rose-600 dark:text-rose-400">{analytics.totalAttempts}</p>
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
              <DollarMinimalisticIcon size={22} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400">Oylik tushum</p>
              <p className="text-lg font-black text-slate-900 dark:text-white truncate">
                {(analytics.mrr / 1000000).toFixed(1)}M so'm
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl overflow-x-auto">
          {[
            { key: "all", label: "Barchasi", count: analytics?.totalCenters },
            { key: "pending", label: "Arizalar", count: analytics?.pendingApplications, highlight: true },
            { key: "active", label: "Faol", count: analytics?.activeCenters },
            { key: "suspended", label: "To'xtatilgan" },
            { key: "rejected", label: "Rad etilgan" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === tab.key
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <span>{tab.label}</span>
              {typeof tab.count === "number" && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  tab.highlight && tab.count > 0
                    ? "bg-amber-500 text-white"
                    : activeTab === tab.key
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <MagnifierIcon size={18} className="text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Markaz yoki rahbar izlash..."
            className="w-full pl-10 pr-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#E8192C]/20"
          />
        </div>
      </div>

      {/* Centers Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {centersLoading ? (
          <div className="p-12 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Markazlar yuklanmoqda...
          </div>
        ) : filteredCenters.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            Hech qanday markaz topilmadi
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[1100px]">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6 min-w-[220px]">Markaz nomi</th>
                  <th className="py-3.5 px-6 min-w-[170px]">Rahbar / Egasi</th>
                  <th className="py-3.5 px-6 min-w-[150px]">Telegram</th>
                  <th className="py-3.5 px-6 min-w-[190px]">Statistika</th>
                  <th className="py-3.5 px-6 min-w-[150px]">To'lov / Ariza</th>
                  <th className="py-3.5 px-6 min-w-[130px]">Holati</th>
                  <th className="py-3.5 px-6 text-right min-w-[220px]">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCenters.map((c) => {
                  const isPending = c.status === "PENDING_APPROVAL" || c.status === "PENDING_PAYMENT";
                  const isActive = c.status === "ACTIVE";
                  const isSuspended = c.status === "SUSPENDED";
                  const isRejected = c.status === "REJECTED";

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-6 min-w-[220px]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm flex items-center justify-center overflow-hidden shrink-0 border border-slate-200 dark:border-slate-800 shadow-2xs">
                            {c.logo_url ? (
                              <img
                                src={c.logo_url}
                                alt="Logo"
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                              />
                            ) : (
                              c.name.slice(0, 2).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                              <span className="font-bold text-slate-900 dark:text-white truncate">
                                {c.name}
                              </span>
                              <a
                                href={`/c/${c.username}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-slate-400 hover:text-blue-500 transition-colors"
                                title="Markaz portalini ko'rish"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                            <span className="text-xs text-slate-400 font-mono block">@{c.username}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-xs text-slate-500 min-w-[170px] whitespace-nowrap">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {c.owner?.full_name || "Noma'lum"}
                        </div>
                        <div className="font-mono text-[11px] text-slate-400 mt-0.5">
                          {c.owner?.phone || c.phone || "Telefon yo'q"}
                        </div>
                      </td>

                      <td className="py-4 px-6 text-xs min-w-[150px] whitespace-nowrap">
                        {c.telegram_chat_id ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800/60 px-2 py-0.5 rounded-lg whitespace-nowrap">
                              <SendSquareIcon size={14} className="text-sky-600 dark:text-sky-400 shrink-0" />
                              <span>@{c.telegram_username || 'ulangan'}</span>
                            </span>
                            <span className="text-[10px] text-slate-400 block font-mono whitespace-nowrap">
                              ID: {c.telegram_chat_id}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic whitespace-nowrap">TG ulanmagan</span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-xs text-slate-600 dark:text-slate-300 min-w-[190px] whitespace-nowrap">
                        <div className="flex items-center gap-2 whitespace-nowrap font-medium text-[11.5px]">
                          <span><b className="text-slate-900 dark:text-white font-bold">{c.students_count}</b> o'quvchi</span>
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <span><b className="text-slate-900 dark:text-white font-bold">{c.classes_count}</b> sinf</span>
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <span><b className="text-slate-900 dark:text-white font-bold">{c.mocks_count}</b> test</span>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-xs min-w-[150px] whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap inline-flex items-center gap-1.5 ${
                          c.application?.payment_status === "trial"
                            ? "bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/50 dark:border-purple-800 dark:text-purple-300"
                            : c.application?.payment_status === "completed"
                            ? "bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/50 dark:border-green-800 dark:text-green-400"
                            : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:border-amber-800 dark:text-amber-400"
                        }`}>
                          {c.application?.payment_status === "trial"
                            ? "🎁 14 kun sinov"
                            : c.application?.payment_status === "completed"
                            ? "To'langan"
                            : "To'lov kutilmoqda"}
                        </span>
                      </td>

                      <td className="py-4 px-6 min-w-[130px] whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap inline-flex items-center gap-1 ${
                          isActive
                            ? "bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/50 dark:border-green-800 dark:text-green-400"
                            : isPending
                            ? "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:border-amber-800 dark:text-amber-400"
                            : isSuspended
                            ? "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:border-rose-800 dark:text-rose-400"
                            : "bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"
                        }`}>
                          {isActive ? "Faol" : isPending ? "Ariza kutilmoqda" : isSuspended ? "To'xtatilgan" : "Rad etilgan"}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right min-w-[220px] whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                          <button
                            onClick={() => setSelectedCenter(c)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                            title="Barcha tafsilotlarni ko'rish"
                          >
                            <EyeIcon size={14} className="text-slate-500" />
                            <span>Tafsilot</span>
                          </button>

                          {isPending && (
                            <>
                              <button
                                onClick={() => handleApprove(c.id)}
                                disabled={isProcessing}
                                className="px-3 py-1.5 rounded-xl bg-green-600 hover:bg-green-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                                title="Arizani tasdiqlash va parollarni botga yuborish"
                              >
                                <SolarCheckCircleIcon size={14} className="text-white" />
                                <span>Tasdiqlash</span>
                              </button>
                              <button
                                onClick={() => setRejectModalCenter(c)}
                                disabled={isProcessing}
                                className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                                title="Arizani rad etish"
                              >
                                <CloseCircleIcon size={14} className="text-rose-600 dark:text-rose-400" />
                                <span>Rad etish</span>
                              </button>
                            </>
                          )}

                          {isActive && (
                            <button
                              onClick={() => handleToggleStatus(c.id, "ACTIVE")}
                              className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-200 dark:border-rose-900 text-xs font-bold transition-all cursor-pointer"
                            >
                              To'xtatish
                            </button>
                          )}

                          {isSuspended && (
                            <button
                              onClick={() => handleToggleStatus(c.id, "SUSPENDED")}
                              className="px-2.5 py-1.5 rounded-xl bg-green-50 hover:bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400 border border-green-200 dark:border-green-900 text-xs font-bold transition-all cursor-pointer"
                            >
                              Faollashtirish
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details & Review Modal */}
      {selectedCenter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-black text-xl flex items-center justify-center overflow-hidden">
                  {selectedCenter.logo_url ? (
                    <img src={selectedCenter.logo_url} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    selectedCenter.name.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    {selectedCenter.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    @{selectedCenter.username} • {selectedCenter.legal_name || "Yuridik nom ko'rsatilmagan"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCenter(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Application Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                <span className="text-slate-400">Direktor / Mas'ul shaxs:</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {selectedCenter.application?.director_name || selectedCenter.owner?.full_name || "Ko'rsatilmagan"}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                <span className="text-slate-400">Aloqa telefoni:</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {selectedCenter.application?.contact_phone || selectedCenter.phone || selectedCenter.owner?.phone || "Ko'rsatilmagan"}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                <span className="text-slate-400">Markaz INN / STIR:</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {selectedCenter.application?.inn || "Kiritilmagan"}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                <span className="text-slate-400">Ariza topshirilgan sana:</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {new Date(selectedCenter.created_at).toLocaleString("uz-UZ")}
                </p>
              </div>

              <div className="sm:col-span-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                <span className="text-slate-400">Manzil:</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {selectedCenter.address || "Manzil ko'rsatilmagan"}
                </p>
              </div>

              <div className="sm:col-span-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                <span className="text-slate-400">Tarif va To'lov ma'lumoti:</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {selectedCenter.application?.payment_status === "trial" 
                    ? "🎁 14 kunlik bepul sinov (Trial) — 0 so'm (Karta / InPay to'lovi talab etilmagan)" 
                    : `${selectedCenter.application?.plan_name || 'Standart'} (${selectedCenter.application?.plan_price ? selectedCenter.application.plan_price.toLocaleString() + ' so\'m' : ''}) | Order ID: ${selectedCenter.application?.payment_order_id || "Noma'lum"} — Holati: ${selectedCenter.application?.payment_status || "Kutilmoqda"}`}
                </p>
              </div>

              <div className="sm:col-span-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                <span className="text-slate-400">Telegram Bot bog'lanishi:</span>
                <div className="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2">
                  {selectedCenter.telegram_chat_id ? (
                    <span className="text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
                      <Send className="w-4 h-4" /> @{selectedCenter.telegram_username || 'bog\'langan'} (Chat ID: {selectedCenter.telegram_chat_id})
                    </span>
                  ) : (
                    <span className="text-slate-400">Telegram botga ulanmagan</span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions inside Modal */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedCenter(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
              >
                Yopish
              </button>

              {(selectedCenter.status === "PENDING_APPROVAL" || selectedCenter.status === "PENDING_PAYMENT") && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const c = selectedCenter;
                      setSelectedCenter(null);
                      setRejectModalCenter(c);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                  >
                    Rad etish
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApprove(selectedCenter.id)}
                    className="px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold shadow-sm transition-all"
                  >
                    Tasdiqlash va Faollashtirish
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalCenter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Arizani rad etish
            </h3>
            <p className="text-xs text-slate-500">
              "{rejectModalCenter.name}" arizasini rad etish sababini kiriting (markazga ko'rinadi):
            </p>

            <form onSubmit={handleReject} className="space-y-4">
              <textarea
                rows={3}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Masalan: INN ma'lumotlari mos kelmadi yoki to'lov tasdiqlanmadi..."
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:border-rose-500 resize-none"
              />

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setRejectModalCenter(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
                >
                  {isProcessing ? "Yuborilmoqda..." : "Rad etish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approved Credentials Modal */}
      {approvedModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-green-500/15 text-green-600 flex items-center justify-center shrink-0">
                <SolarCheckCircleIcon size={24} className="text-green-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Markaz muvaffaqiyatli tasdiqlandi!</h3>
                <p className="text-xs text-slate-500">{approvedModalData.centerName} faollashtirildi</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl space-y-2.5 text-xs">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Kirish ma'lumotlari:</p>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Kirish portali:</span>
                <a href={approvedModalData.credentials.login_url} target="_blank" rel="noreferrer" className="font-mono font-bold text-sky-600 hover:underline">
                  {approvedModalData.credentials.login_url}
                </a>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Login (Email):</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{approvedModalData.credentials.login}</span>
              </div>
              {approvedModalData.credentials.phone && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Telefon:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{approvedModalData.credentials.phone}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Boshlang'ich parol:</span>
                <span className="font-mono font-bold text-green-600 bg-green-50 dark:bg-green-950/50 px-2 py-0.5 rounded-md">
                  {approvedModalData.credentials.initial_password}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-500">Telegram holati:</span>
                <span className="font-bold text-sky-600 inline-flex items-center gap-1.5">
                  <SendSquareIcon size={14} className="text-sky-600" /> {approvedModalData.credentials.telegram_sent ? "Bot orqali yuborildi" : "Chat ID yo'q"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const text = `Markaz: ${approvedModalData.centerName}\nPortal: ${approvedModalData.credentials.login_url}\nLogin: ${approvedModalData.credentials.login}\nParol: ${approvedModalData.credentials.initial_password}`;
                  navigator.clipboard.writeText(text);
                  toast({ title: "Nusxalandi!", description: "Kirish ma'lumotlari nusxalandi" });
                }}
                className="flex-1 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Nusxa olish</span>
              </button>
              <button
                type="button"
                onClick={() => setApprovedModalData(null)}
                className="flex-1 h-10 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center cursor-pointer"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
