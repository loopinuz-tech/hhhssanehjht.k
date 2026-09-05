import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { WalletIcon } from "@solar-icons/react/bold-duotone/wallet";
import { PulseIcon } from "@solar-icons/react/bold-duotone/pulse";
import { MagnifierIcon } from "@solar-icons/react/bold-duotone/magnifier";
import { ClockCircleIcon as ClockIcon } from "@solar-icons/react/bold-duotone/clock-circle";
import { CupPaperIcon } from "@solar-icons/react/bold-duotone/cup-paper";
import { DollarMinimalisticIcon } from "@solar-icons/react/bold-duotone/dollar-minimalistic";
import { CloseSquareIcon } from "@solar-icons/react/bold-duotone/close-square";
import { CheckCircleIcon } from "@solar-icons/react/bold-duotone/check-circle";
import { CloseCircleIcon } from "@solar-icons/react/bold-duotone/close-circle";
import { RefreshIcon } from "@solar-icons/react/bold-duotone/refresh";
import { AddCircleIcon as PlusCircleIcon } from "@solar-icons/react/bold-duotone/add-circle";
import { EyeIcon } from "@solar-icons/react/bold-duotone/eye";
import { ArrowUpRight, ArrowDownRight, ToggleLeft, ToggleRight, Check, X, FileText, Copy, Trash2, Sparkles, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import PageLoader from "@/components/ui/PageLoader";

const fmt = (n: number) => new Intl.NumberFormat("uz-UZ").format(n);

const formatDateUz = (isoDate: string) => {
  if (!isoDate) return "—";
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return "—";
  const day = String(d.getDate()).padStart(2, "0");
  const monthNames = ["Yan", "Fev", "Mar", "Apr", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"];
  const month = monthNames[d.getMonth()] || "—";
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day}-${month} ${hours}:${minutes}`;
};

const WALLET_TYPE_MAP: Record<string, { label: string; color: string; icon: any }> = {
  deposit: { label: "Kirim", color: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600", icon: ArrowUpRight },
  withdrawal: { label: "Chiqim", color: "bg-rose-50 dark:bg-rose-500/10 text-rose-600", icon: ArrowDownRight },
};

const WALLET_STATUS_MAP: Record<string, { label: string; color: string }> = {
  completed: { label: "Bajarildi", color: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600" },
  pending: { label: "Kutilmoqda", color: "bg-amber-50 dark:bg-amber-500/10 text-amber-600" },
  success: { label: "Muvaffaqiyatli", color: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600" },
};

const EDU_TYPE_MAP: Record<string, { label: string; color: string }> = {
  daily_login: { label: "Kunlik kirish", color: "bg-sky-50 dark:bg-sky-500/10 text-sky-600" },
  streak_bonus: { label: "Streak bonus", color: "bg-orange-50 dark:bg-orange-500/10 text-orange-600" },
  ai_explain: { label: "AI tushuntirish", color: "bg-violet-50 dark:bg-violet-500/10 text-violet-600" },
  test_purchase: { label: "Test xaridi", color: "bg-rose-50 dark:bg-rose-500/10 text-rose-600" },
  course_purchase: { label: "Kurs xaridi", color: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600" },
  feedback_reward: { label: "Fikr-mulohaza", color: "bg-teal-50 dark:bg-teal-500/10 text-teal-600" },
  admin_grant: { label: "Admin berishi", color: "bg-amber-50 dark:bg-amber-500/10 text-amber-600" },
  refund: { label: "Qaytarish", color: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600" },
  coin_purchase: { label: "Coin xaridi", color: "bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600" },
  purchase: { label: "Xarid", color: "bg-pink-50 dark:bg-pink-500/10 text-pink-600" },
};

const AdminFinance = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"requests" | "wallet" | "educoin" | "coupons">("requests");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showCreateCoupon, setShowCreateCoupon] = useState(false);
  const [newCoupon, setNewCoupon] = useState({ code: "", discount_amount: 0, discount_percent: 0, usage_limit: 10 });
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState<string | null>(null);
  const [selectedReceiptReq, setSelectedReceiptReq] = useState<any | null>(null);

  // Fetch Manual Payment Requests
  const { data: paymentRequests, isLoading: isRequestsLoading } = useQuery({
    queryKey: ["admin-payment-requests"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("payment_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) return [];

      const userIds = [...new Set((data || []).map((r: any) => r.user_id).filter(Boolean))];
      let profilesMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await (supabase as any)
          .from("profiles")
          .select("user_id, full_name, phone, email, balance")
          .in("user_id", userIds);
        profiles?.forEach((p: any) => { profilesMap[p.user_id] = p; });
      }

      return (data || []).map((r: any) => ({
        ...r,
        profile: profilesMap[r.user_id] || { full_name: "Noma'lum", phone: "-", email: "-" },
      }));
    },
  });

  const { data: walletTxs, isLoading: isWalletLoading } = useQuery({
    queryKey: ["admin-wallet-transactions"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("wallet_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) throw error;

      const userIds = [...new Set((data || []).map((t: any) => t.user_id).filter(Boolean))];
      let profilesMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await (supabase as any)
          .from("profiles").select("user_id, full_name").in("user_id", userIds);
        profiles?.forEach((p: any) => { profilesMap[p.user_id] = p.full_name; });
      }

      return (data || []).map((t: any) => ({ ...t, full_name: profilesMap[t.user_id] || "Noma'lum" }));
    },
  });

  const { data: educoinTxs, isLoading: isEducoinLoading } = useQuery({
    queryKey: ["admin-educoin-transactions"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("educoin_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) throw error;

      const userIds = [...new Set((data || []).map((t: any) => t.user_id).filter(Boolean))];
      let profilesMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await (supabase as any)
          .from("profiles").select("user_id, full_name").in("user_id", userIds);
        profiles?.forEach((p: any) => { profilesMap[p.user_id] = p.full_name; });
      }

      return (data || []).map((t: any) => ({ ...t, full_name: profilesMap[t.user_id] || "Noma'lum" }));
    },
  });

  const { data: coupons, isLoading: isCouponsLoading } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () => {
      try {
        const res = await api.coupons.getAll();
        if (Array.isArray(res)) return res;
      } catch (e) {
        console.warn("api.coupons.getAll failed, using direct supabase fallback:", e);
      }
      const { data, error } = await (supabase as any)
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) return [];
      return data || [];
    },
  });

  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ["admin-finance-stats"],
    queryFn: async () => {
      try {
        const { data: rpcRes, error: rpcErr } = await (supabase as any).rpc("get_admin_finance_stats");
        if (!rpcErr && rpcRes) {
          return {
            totalDeposit: Number(rpcRes.totalDeposit || 0),
            todayDeposit: Number(rpcRes.todayDeposit || 0),
            educoinSpend: Number(rpcRes.educoinSpend || 0),
          };
        }
      } catch (e) {
        // Safe fallback to direct query if RPC does not exist on remote DB
      }

      const { data: walletData } = await (supabase as any)
        .from("wallet_transactions")
        .select("amount, type, status, created_at")
        .limit(2000);

      const { data: educoinData } = await (supabase as any)
        .from("educoin_transactions")
        .select("amount, transaction_type")
        .limit(2000);

      const todayStr = new Date().toISOString().split("T")[0];

      let totalDeposit = 0;
      let todayDeposit = 0;
      (walletData || []).forEach((w: any) => {
        if (w.type === "deposit" && (w.status === "completed" || w.status === "success")) {
          totalDeposit += w.amount || 0;
          if (w.created_at?.startsWith(todayStr)) {
            todayDeposit += w.amount || 0;
          }
        }
      });

      let educoinSpend = 0;
      (educoinData || []).forEach((e: any) => {
        if (e.amount < 0) {
          educoinSpend += Math.abs(e.amount);
        }
      });

      return { totalDeposit, todayDeposit, educoinSpend };
    },
  });

  // Approve Payment Request
  const approvePaymentRequest = useMutation({
    mutationFn: async ({ id, userId, amount }: { id: string; userId: string; amount: number }) => {
      // 1. Update request status
      const { error: reqErr } = await (supabase as any)
        .from("payment_requests")
        .update({ status: "approved" })
        .eq("id", id);
      if (reqErr) throw reqErr;

      // 2. Fetch current balance
      const { data: prof } = await (supabase as any)
        .from("profiles")
        .select("balance")
        .eq("user_id", userId)
        .single();

      const currentBal = prof?.balance || 0;
      const newBal = currentBal + amount;

      // 3. Update profile balance
      const { error: balErr } = await (supabase as any)
        .from("profiles")
        .update({ balance: newBal })
        .eq("user_id", userId);
      if (balErr) throw balErr;

      // 4. Record wallet transaction
      await (supabase as any).from("wallet_transactions").insert({
        user_id: userId,
        amount: amount,
        type: "deposit",
        status: "completed",
        description: "Karta orqali to'lov (Chek tasdiqlandi)",
      });

      // 5. Send Notification to User
      try {
        await (supabase as any).from("notifications").insert({
          user_id: userId,
          title: "To'lov tasdiqlandi! 🎉",
          message: `Siz yuborgan ${fmt(amount)} so'm to'lov cheki admin tomonidan tasdiqlandi va balansingizga qo'shildi.`,
          type: "payment",
          is_read: false,
        });
      } catch (notifErr) {
        console.warn("Could not insert notification:", notifErr);
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["admin-payment-requests"] });
      qc.invalidateQueries({ queryKey: ["admin-wallet-transactions"] });
      qc.invalidateQueries({ queryKey: ["admin-finance-stats"] });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "Tasdiqlandi!", description: `${fmt(vars.amount)} UZS balansga qo'shildi.` });
    },
    onError: (err: any) => {
      toast({ title: "Xatolik", description: err.message || "Tasdiqlashda xatolik yuz berdi", variant: "destructive" });
    },
  });

  // Reject Payment Request
  const rejectPaymentRequest = useMutation({
    mutationFn: async ({ id, userId, amount }: { id: string; userId: string; amount: number }) => {
      const { error } = await (supabase as any)
        .from("payment_requests")
        .update({ status: "rejected" })
        .eq("id", id);
      if (error) throw error;

      // Send Notification to User
      try {
        await (supabase as any).from("notifications").insert({
          user_id: userId,
          title: "To'lov cheki rad etildi ❌",
          message: `Siz yuborgan ${fmt(amount || 0)} so'm to'lov cheki admin tomonidan rad etildi. Ma'lumotlarni va chek rasmini qayta tekshirib yuboring.`,
          type: "payment",
          is_read: false,
        });
      } catch (notifErr) {
        console.warn("Could not insert notification:", notifErr);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-payment-requests"] });
      toast({ title: "Rad etildi", description: "To'lov so'rovi rad etildi va foydalanuvchiga bildirishnoma yuborildi." });
    },
    onError: (err: any) => {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    },
  });

  const createCoupon = useMutation({
    mutationFn: async (coupon: { code: string; discount_amount: number; discount_percent: number; usage_limit: number }) => {
      const targetPercent = coupon.discount_percent > 0 ? coupon.discount_percent : 1;
      const payload = {
        code: coupon.code.toUpperCase().trim(),
        discount_amount: coupon.discount_amount || 0,
        discount_percent: targetPercent,
        usage_limit: coupon.usage_limit || 10,
      };
      try {
        await api.coupons.create(payload);
        return;
      } catch (err: any) {
        console.warn("api.coupons.create failed, trying direct supabase fallback:", err);
      }
      const { error } = await (supabase as any)
        .from("coupons")
        .insert({
          ...payload,
          usage_count: 0,
          is_active: true,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
      setShowCreateCoupon(false);
      setNewCoupon({ code: "", discount_amount: 0, discount_percent: 0, usage_limit: 10 });
      toast({ title: "Kupon yaratildi! 🎉", className: "bg-emerald-600 text-white border-none rounded-xl" });
    },
    onError: (err: any) => {
      const isDup = err.message?.includes("coupons_code_key") || err.message?.includes("duplicate key");
      const msg = isDup
        ? "Ushbu promokod (kod) allaqachon mavjud! Boshqa kod kiriting yoki 'Kod yaratish' tugmasini bosing."
        : err.message || "Kupon yaratib bo'lmadi";
      toast({ title: "Diqqat!", description: msg, variant: "destructive" });
    },
  });

  const deleteCoupon = useMutation({
    mutationFn: async (id: string) => {
      try {
        await api.coupons.delete(id);
        return;
      } catch (err) {
        console.warn("api.coupons.delete failed, trying direct supabase fallback:", err);
      }
      const { error } = await (supabase as any).from("coupons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast({ title: "Kupon o'chirildi!", className: "bg-emerald-600 text-white border-none rounded-xl" });
    },
    onError: (err: any) => {
      toast({ title: "Xatolik", description: err.message || "Kuponni o'chirishda xatolik yuz berdi", variant: "destructive" });
    },
  });

  const toggleCouponActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      try {
        await api.coupons.toggle(id, is_active);
        return;
      } catch (err) {
        console.warn("api.coupons.toggle failed, trying direct supabase fallback:", err);
      }
      const { error } = await (supabase as any).from("coupons").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast({
        title: vars.is_active ? "Kupon faollashtirildi! ✅" : "Kupon nofaol qilindi! ⏸️",
        className: "bg-emerald-600 text-white border-none rounded-xl",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Xatolik",
        description: err.message || "Kupon holatini o'zgartirishda xatolik yuz berdi",
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast({ title: "Nusxalandi! 📋", description: `"${text}" kodi buferga nusxalandi` });
  };

  const generateRandomCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let randomPart = "";
    for (let i = 0; i < 5; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const code = `EDU-${randomPart}`;
    setNewCoupon(prev => ({ ...prev, code }));
  };

  const filterByDate = (items: any[]) => {
    if (!items) return [];
    return items.filter((item) => {
      if (!item.created_at) return true;
      const d = new Date(item.created_at);
      if (dateFrom && d < new Date(dateFrom)) return false;
      if (dateTo && d > new Date(dateTo + "T23:59:59")) return false;
      return true;
    });
  };

  const filteredRequests = filterByDate(
    (paymentRequests || [])?.filter((r: any) => {
      const name = String(r.profile?.full_name || "").toLowerCase();
      const phone = String(r.profile?.phone || "").toLowerCase();
      const email = String(r.profile?.email || "").toLowerCase();
      const searchLower = String(search || "").toLowerCase();
      const matchesSearch = !search || name.includes(searchLower) || phone.includes(searchLower) || email.includes(searchLower);
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
  );

  const filteredWallet = filterByDate(
    (walletTxs || [])?.filter((tx: any) => {
      const name = String(tx.full_name || "").toLowerCase();
      const txId = String(tx.id || "").toLowerCase();
      const searchLower = String(search || "").toLowerCase();
      const matchesSearch = !search || name.includes(searchLower) || txId.includes(searchLower);
      const matchesStatus = statusFilter === "all" || tx.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
  );

  const filteredEducoin = filterByDate(
    (educoinTxs || [])?.filter((tx: any) => {
      const name = String(tx.full_name || "").toLowerCase();
      const txId = String(tx.id || "").toLowerCase();
      const searchLower = String(search || "").toLowerCase();
      return !search || name.includes(searchLower) || txId.includes(searchLower);
    })
  );

  const isLoading = isRequestsLoading || isWalletLoading || isEducoinLoading || isCouponsLoading || isStatsLoading;

  if (isLoading) return <PageLoader isVisible={true} />;

  const tabs = [
    { key: "requests" as const, label: "To'lov so'rovlari (Cheklar)", icon: CheckCircleIcon },
    { key: "wallet" as const, label: "Pul tranzaksiyalari", icon: WalletIcon },
    { key: "educoin" as const, label: "Educoin tranzaksiyalari", icon: DollarMinimalisticIcon },
    { key: "coupons" as const, label: "Kuponlar", icon: CupPaperIcon },
  ];

  return (
    <div className="w-full space-y-5 pb-12">
      <AdminPageHeader
        icon={WalletIcon}
        label="Moliyaviy Boshqaruv"
        title="Moliya"
        description="Barcha to'lovlar, chek so'rovlari, tranzaksiyalar va kuponlar"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Jami tushum", value: stats?.totalDeposit || 0, icon: PulseIcon, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
          { label: "Bugungi tushum", value: stats?.todayDeposit || 0, icon: WalletIcon, color: "text-sky-600", bg: "bg-sky-50 dark:bg-sky-500/10" },
          { label: "Jami educoin savdolari", value: stats?.educoinSpend || 0, icon: DollarMinimalisticIcon, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-500/10" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{s.label}</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {fmt(s.value)} <span className="text-[10px] font-bold text-slate-400">UZS</span>
            </h3>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-white/[0.06] overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-[12px] font-bold transition-colors border-b-2 shrink-0 ${
              activeTab === tab.key
                ? "border-emerald-600 text-emerald-600"
                : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="relative">
          <MagnifierIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <Input
            placeholder="Qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 w-[200px] bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-lg text-[12px] font-bold placeholder:text-slate-400/50"
          />
        </div>
        {(activeTab === "wallet" || activeTab === "requests") && (
          <select
            className="h-9 px-3 bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-lg text-[12px] font-bold outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Barchasi</option>
            <option value="pending">Kutilmoqda</option>
            <option value="approved">Tasdiqlangan</option>
            <option value="rejected">Rad etilgan</option>
          </select>
        )}
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="h-9 w-[150px] bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-lg text-[12px] font-bold"
          placeholder="Dan"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="h-9 w-[150px] bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-lg text-[12px] font-bold"
          placeholder="Gacha"
        />
      </div>

      {/* ── TAB 1: Payment Requests (Cheklar) ── */}
      {activeTab === "requests" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-white/[0.04] bg-slate-50/50 dark:bg-white/[0.02]">
                    <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Foydalanuvchi</th>
                    <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Summa</th>
                    <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Chek / Rasm</th>
                    <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Izoh</th>
                    <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Holat</th>
                    <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Sana</th>
                    <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                  {filteredRequests?.map((req: any) => {
                    const status = req.status || "pending";
                    return (
                      <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex flex-col">
                            <span className="text-[13px] font-extrabold text-slate-900 dark:text-white">
                              {req.profile?.full_name || "Noma'lum"}
                            </span>
                            <span className="text-[11px] text-slate-400">{req.profile?.phone || req.profile?.email || req.user_id}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-[14px] font-black text-emerald-600 dark:text-emerald-400">
                            +{fmt(req.amount)} UZS
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          {req.receipt_url ? (
                            <button
                              onClick={() => {
                                setSelectedReceiptUrl(req.receipt_url);
                                setSelectedReceiptReq(req);
                              }}
                              className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
                            >
                              <EyeIcon className="w-3.5 h-3.5" />
                              Chekni ko'rish
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Yuklanmagan</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-[11px] text-slate-500 max-w-[180px] truncate block">{req.notes || "—"}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge className={`rounded px-2 py-0.5 text-[9px] font-bold border-none ${
                            status === "approved"
                              ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600"
                              : status === "rejected"
                              ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600"
                              : "bg-amber-50 dark:bg-amber-500/10 text-amber-600 animate-pulse"
                          }`}>
                            {status === "approved" ? "Tasdiqlangan" : status === "rejected" ? "Rad etilgan" : "Kutilmoqda"}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                            {formatDateUz(req.created_at)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right space-x-1">
                          {status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => approvePaymentRequest.mutate({ id: req.id, userId: req.user_id, amount: req.amount })}
                                disabled={approvePaymentRequest.isPending}
                                className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold"
                              >
                                <Check className="w-3.5 h-3.5 mr-1" />
                                Tasdiqlash
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => rejectPaymentRequest.mutate({ id: req.id, userId: req.user_id, amount: req.amount })}
                                disabled={rejectPaymentRequest.isPending}
                                className="h-7 px-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold"
                              >
                                <X className="w-3.5 h-3.5 mr-1" />
                                Rad etish
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {!filteredRequests?.length && (
              <div className="h-40 flex flex-col items-center justify-center">
                <FileText className="w-10 h-10 text-slate-200 dark:text-slate-700 mb-2" />
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">To'lov so'rovlari mavjud emas</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: Wallet Transactions ── */}
      {activeTab === "wallet" && (
        <div className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/[0.04] bg-slate-50/50 dark:bg-white/[0.02]">
                  <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Foydalanuvchi</th>
                  <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Turi</th>
                  <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Summa</th>
                  <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Izoh</th>
                  <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Holat</th>
                  <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Sana</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {filteredWallet?.map((tx: any) => {
                  const typeInfo = WALLET_TYPE_MAP[tx.type] || { label: tx.type, color: "bg-slate-100 text-slate-600", icon: ArrowUpRight };
                  const statusInfo = WALLET_STATUS_MAP[tx.status] || { label: tx.status, color: "bg-slate-100 text-slate-600" };
                  const TypeIcon = typeInfo.icon;
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="text-[12px] font-bold text-slate-900 dark:text-white">{tx.full_name}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge className={`rounded px-2 py-0.5 text-[9px] font-bold border-none flex items-center gap-1 w-fit ${typeInfo.color}`}>
                          <TypeIcon className="w-3 h-3" />
                          {typeInfo.label}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[13px] font-extrabold ${tx.type === "deposit" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                          {tx.type === "deposit" ? "+" : "-"}{fmt(tx.amount)} UZS
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[11px] font-medium text-slate-500 max-w-[200px] truncate block">{tx.description || "—"}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge className={`rounded px-2 py-0.5 text-[9px] font-bold border-none ${statusInfo.color}`}>
                          {statusInfo.label}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                          {formatDateUz(tx.created_at)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!filteredWallet?.length && (
            <div className="h-40 flex flex-col items-center justify-center">
              <WalletIcon className="w-10 h-10 text-slate-200 dark:text-slate-700 mb-2" />
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Pul tranzaksiyalari mavjud emas</p>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: Educoin Transactions ── */}
      {activeTab === "educoin" && (
        <div className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/[0.04] bg-slate-50/50 dark:bg-white/[0.02]">
                  <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Foydalanuvchi</th>
                  <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Turi</th>
                  <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Miqdor</th>
                  <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Izoh</th>
                  <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Sana</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {filteredEducoin?.map((tx: any) => {
                  const typeInfo = EDU_TYPE_MAP[tx.transaction_type] || { label: tx.transaction_type, color: "bg-slate-100 text-slate-600" };
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="text-[12px] font-bold text-slate-900 dark:text-white">{tx.full_name}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge className={`rounded px-2 py-0.5 text-[9px] font-bold border-none ${typeInfo.color}`}>
                          {typeInfo.label}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[13px] font-extrabold ${tx.amount > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-400"}`}>
                          {tx.amount > 0 ? `+${tx.amount}` : tx.amount} EC
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[11px] font-medium text-slate-500 max-w-[200px] truncate block">{tx.description || "—"}</span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                          {formatDateUz(tx.created_at)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!filteredEducoin?.length && (
            <div className="h-40 flex flex-col items-center justify-center">
              <DollarMinimalisticIcon className="w-10 h-10 text-slate-200 dark:text-slate-700 mb-2" />
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Educoin tranzaksiyalari mavjud emas</p>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: Coupons ── */}
      {activeTab === "coupons" && (
        <div className="space-y-6">
          {/* Coupon Summary Header Banner */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5 bg-white dark:bg-[#0A0F1A] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-4 lg:p-5 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-500 shrink-0">
                <Ticket className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">Kuponlar Boshqaruvi</h3>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">Promokodlar, chegirmalar va ulardan foydalanish statistikasi</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateCoupon(true)}
              className="flex items-center justify-center gap-2 px-4.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[12px] font-bold shadow-md transition-all w-full sm:w-auto shrink-0 cursor-pointer"
            >
              <PlusCircleIcon className="w-4 h-4" /> Yangi kupon yaratish
            </button>
          </div>

          {/* Coupon Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white dark:bg-[#0A0F1A] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between min-h-[115px]">
              <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Jami Kuponlar
              </span>
              <div className="mt-2">
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {coupons?.length || 0}
                </div>
                <p className="text-[10.5px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Yaratilgan promokodlar</p>
              </div>
            </div>

            <div className="bg-white dark:bg-[#0A0F1A] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between min-h-[115px]">
              <span className="text-[10px] sm:text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Faol Kuponlar
              </span>
              <div className="mt-2">
                <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {coupons?.filter((c: any) => c.is_active).length || 0}
                </div>
                <p className="text-[10.5px] font-medium text-emerald-700 dark:text-emerald-300 mt-0.5">Foydalanish mumkin</p>
              </div>
            </div>

            <div className="bg-white dark:bg-[#0A0F1A] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between min-h-[115px]">
              <span className="text-[10px] sm:text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                Ishlatilganlar
              </span>
              <div className="mt-2">
                <div className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400">
                  {coupons?.reduce((sum: number, c: any) => sum + (c.usage_count || c.used_count || 0), 0) || 0} marta
                </div>
                <p className="text-[10.5px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Jami faoliyat statistikasi</p>
              </div>
            </div>

            <div className="bg-white dark:bg-[#0A0F1A] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between min-h-[115px]">
              <span className="text-[10px] sm:text-[11px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                Nofaol / Tugagan
              </span>
              <div className="mt-2">
                <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">
                  {coupons?.filter((c: any) => !c.is_active || (c.usage_limit && (c.usage_count || c.used_count || 0) >= c.usage_limit)).length || 0}
                </div>
                <p className="text-[10.5px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Vaqtincha to'xtatilgan</p>
              </div>
            </div>
          </div>

          {/* Search & Filter controls */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex bg-slate-100 dark:bg-white/[0.04] p-1 rounded-xl overflow-x-auto w-full sm:w-auto">
              {[
                { key: "all", label: "Barchasi" },
                { key: "active", label: "Faol" },
                { key: "inactive", label: "Nofaol" },
              ].map((st) => (
                <button
                  key={st.key}
                  type="button"
                  onClick={() => setStatusFilter(st.key)}
                  className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-[11.5px] font-bold transition-all text-center whitespace-nowrap cursor-pointer ${
                    statusFilter === st.key
                      ? "bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            <div className="relative w-full md:max-w-xs">
              <MagnifierIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Kupon kodi bo'yicha qidiruv..."
                className="w-full h-9 pl-9 pr-3 bg-white dark:bg-[#0A0F1A] border border-slate-200 dark:border-white/[0.06] rounded-xl text-[12px] font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
              />
            </div>
          </div>

          {/* Coupon Voucher Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coupons
              ?.filter((coupon: any) => {
                const matchStatus =
                  statusFilter === "all"
                    ? true
                    : statusFilter === "active"
                    ? coupon.is_active
                    : !coupon.is_active;
                const matchSearch =
                  !search || coupon.code?.toLowerCase().includes(search.toLowerCase());
                return matchStatus && matchSearch;
              })
              .map((coupon: any) => {
                const used = coupon.usage_count || coupon.used_count || 0;
                const limit = coupon.usage_limit || 0;
                const percentUsed = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
                const isLimitReached = limit > 0 && used >= limit;

                return (
                  <div
                    key={coupon.id}
                    className="relative bg-white dark:bg-[#0A0F1A] border-2 border-dashed border-slate-200 dark:border-white/[0.08] rounded-2xl p-5 shadow-xs space-y-4 hover:border-emerald-500/40 transition-all group"
                  >
                    {/* Header: Monospace Code + Copy Button + Toggle */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <code className="text-base font-black tracking-wider text-slate-900 dark:text-white bg-slate-100 dark:bg-white/[0.06] px-3 py-1 rounded-xl border border-slate-200/60 dark:border-white/10 select-all">
                          {coupon.code}
                        </code>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(coupon.code)}
                          className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-500/10 text-slate-400 flex items-center justify-center transition-all cursor-pointer"
                          title="Kodni nusxalash"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => toggleCouponActive.mutate({ id: coupon.id, is_active: !coupon.is_active })}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-extrabold border transition-all cursor-pointer ${
                            coupon.is_active
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                              : "bg-slate-100 text-slate-500 border-slate-200 dark:bg-white/5 dark:text-slate-400"
                          }`}
                        >
                          {coupon.is_active ? <ToggleRight className="w-4 h-4 text-emerald-500" /> : <ToggleLeft className="w-4 h-4 text-slate-400" />}
                          {coupon.is_active ? "Faol" : "Nofaol"}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`"${coupon.code}" kuponini o'chirishni tasdiqlaysizmi?`)) {
                              deleteCoupon.mutate(coupon.id);
                            }
                          }}
                          className="w-7.5 h-7.5 rounded-xl bg-red-50 dark:bg-red-500/10 hover:bg-red-600 hover:text-white text-red-500 flex items-center justify-center transition-all cursor-pointer"
                          title="Kuponni o'chirish"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Discount Value */}
                    <div className="pt-1">
                      <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Chegirma Miqdori</p>
                      <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {coupon.discount_percent > 0
                          ? `${coupon.discount_percent}%`
                          : coupon.discount_amount > 0
                          ? `${fmt(coupon.discount_amount)} UZS`
                          : "—"}
                      </div>
                    </div>

                    {/* Usage Progress Bar */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-white/[0.04]">
                      <div className="flex items-center justify-between text-[11.5px] font-bold">
                        <span className="text-slate-400">Ishlatilganlik:</span>
                        <span className={isLimitReached ? "text-red-500 font-extrabold" : "text-slate-700 dark:text-slate-300"}>
                          {used} / {limit || "∞"} {isLimitReached ? "(Tugadi)" : ""}
                        </span>
                      </div>
                      {limit > 0 && (
                        <div className="w-full h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isLimitReached ? "bg-red-500" : "bg-gradient-to-r from-emerald-500 to-teal-500"
                            }`}
                            style={{ width: `${percentUsed}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>

          {!coupons?.length && (
            <div className="h-44 flex flex-col items-center justify-center bg-white dark:bg-[#0A0F1A] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-6 text-center">
              <Ticket className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Kuponlar topilmadi</p>
              <p className="text-[12px] text-slate-400 mt-0.5">Hali hech qanday chegirma kuponi yaratilmagan</p>
            </div>
          )}
        </div>
      )}


      {/* Create Coupon Modal */}
      <AnimatePresence>
        {showCreateCoupon && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto"
            onClick={() => setShowCreateCoupon(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#0A0F1A] border border-slate-200 dark:border-white/[0.08] rounded-3xl p-6 lg:p-7 w-full max-w-md shadow-2xl my-6 space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                    <Ticket className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Yangi Kupon Yaratish</h3>
                    <p className="text-xs text-slate-400">Promokod va chegirma sozlamalari</p>
                  </div>
                </div>
                <button onClick={() => setShowCreateCoupon(false)} className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer">
                  <CloseSquareIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Kupon Kodi *</label>
                    <button
                      type="button"
                      onClick={generateRandomCode}
                      className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" /> Kod yaratish
                    </button>
                  </div>
                  <Input
                    value={newCoupon.code}
                    onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                    placeholder="Masalan: SUMMER2026"
                    className="h-11 bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.08] rounded-xl text-[13.5px] font-mono font-bold tracking-wider uppercase focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">Summa Chegirmasi (UZS)</label>
                    <Input
                      type="number"
                      value={newCoupon.discount_amount || ""}
                      onChange={(e) => setNewCoupon({ ...newCoupon, discount_amount: Number(e.target.value), discount_percent: 0 })}
                      placeholder="Masalan: 15000"
                      className="h-10 bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.08] rounded-xl text-[12.5px] font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">Foiz Chegirmasi (%)</label>
                    <Input
                      type="number"
                      value={newCoupon.discount_percent || ""}
                      onChange={(e) => setNewCoupon({ ...newCoupon, discount_percent: Number(e.target.value), discount_amount: 0 })}
                      placeholder="Masalan: 20"
                      className="h-10 bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.08] rounded-xl text-[12.5px] font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">Ishlatish Limiti (Marta)</label>
                  <Input
                    type="number"
                    value={newCoupon.usage_limit || ""}
                    onChange={(e) => setNewCoupon({ ...newCoupon, usage_limit: Number(e.target.value) })}
                    placeholder="Masalan: 50"
                    className="h-10 bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.08] rounded-xl text-[12.5px] font-bold"
                  />
                  <p className="text-[10.5px] text-slate-400 mt-1">Kupon jami nechta foydalanuvchiga amal qilishi</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setShowCreateCoupon(false)}
                  className="px-4 py-2 rounded-xl text-[12px] font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!newCoupon.code.trim()) {
                      toast({ title: "Diqqat!", description: "Kupon kodini kiriting!", variant: "destructive" });
                      return;
                    }
                    if (!newCoupon.discount_amount && !newCoupon.discount_percent) {
                      toast({ title: "Diqqat!", description: "Chegirma miqdori (UZS) yoki foizini (%) kiriting!", variant: "destructive" });
                      return;
                    }
                    createCoupon.mutate(newCoupon);
                  }}
                  disabled={!newCoupon.code || createCoupon.isPending}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[12.5px] font-extrabold shadow-md hover:shadow-emerald-500/20 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {createCoupon.isPending ? <RefreshIcon className="w-4 h-4 animate-spin" /> : <PlusCircleIcon className="w-4 h-4" />}
                  Kuponni Yaratish
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ── Receipt Viewer Modal ── */}
        {(selectedReceiptReq || selectedReceiptUrl) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => {
              setSelectedReceiptUrl(null);
              setSelectedReceiptReq(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#0E131F] border border-slate-200 dark:border-white/10 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                    <EyeIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">To'lov Cheki / Rasm</h3>
                    <p className="text-[11px] text-slate-400 font-bold">
                      {selectedReceiptReq?.profile?.full_name || "Mijoz cheki"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedReceiptUrl(null);
                    setSelectedReceiptReq(null);
                  }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Image Display */}
              <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center bg-slate-950/40 min-h-[320px]">
                {(selectedReceiptReq?.receipt_url || selectedReceiptUrl) ? (
                  <div className="relative group max-w-full flex flex-col items-center">
                    <img
                      src={selectedReceiptReq?.receipt_url || selectedReceiptUrl || ""}
                      alt="To'lov cheki"
                      className="max-h-[55vh] object-contain rounded-xl shadow-2xl border border-slate-200 dark:border-white/10"
                    />
                    <div className="mt-4 flex items-center justify-center gap-3">
                      <a
                        href={selectedReceiptReq?.receipt_url || selectedReceiptUrl || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-[11.5px] font-bold flex items-center gap-1.5 transition-all shadow-md"
                      >
                        <ArrowUpRight className="w-4 h-4" /> Yangi oynada ochish
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-400">Chek rasmi mavjud emas</p>
                  </div>
                )}
              </div>

              {/* Modal Footer Controls */}
              {selectedReceiptReq && (
                <div className="p-5 border-t border-slate-100 dark:border-white/5 bg-white dark:bg-[#080C14] flex items-center justify-between flex-wrap gap-3">
                  <div className="space-y-0.5">
                    <div className="text-[11px] font-bold text-slate-400">Summa:</div>
                    <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                      +{fmt(selectedReceiptReq.amount)} UZS
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedReceiptReq.status === "pending" ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => {
                            approvePaymentRequest.mutate({
                              id: selectedReceiptReq.id,
                              userId: selectedReceiptReq.user_id,
                              amount: selectedReceiptReq.amount,
                            });
                            setSelectedReceiptUrl(null);
                            setSelectedReceiptReq(null);
                          }}
                          disabled={approvePaymentRequest.isPending}
                          className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[12px] font-bold shadow-md cursor-pointer"
                        >
                          <Check className="w-4 h-4 mr-1.5" /> Tasdiqlash
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            rejectPaymentRequest.mutate({
                              id: selectedReceiptReq.id,
                              userId: selectedReceiptReq.user_id,
                              amount: selectedReceiptReq.amount,
                            });
                            setSelectedReceiptUrl(null);
                            setSelectedReceiptReq(null);
                          }}
                          disabled={rejectPaymentRequest.isPending}
                          className="h-9 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[12px] font-bold shadow-md cursor-pointer"
                        >
                          <X className="w-4 h-4 mr-1.5" /> Rad etish
                        </Button>
                      </>
                    ) : (
                      <Badge className={`rounded-xl px-3 py-1 text-[11px] font-extrabold border-none ${
                        selectedReceiptReq.status === "approved"
                          ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600"
                          : "bg-rose-50 dark:bg-rose-500/10 text-rose-600"
                      }`}>
                        {selectedReceiptReq.status === "approved" ? "Tasdiqlangan" : "Rad etilgan"}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminFinance;
