import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo } from "react";
import { UsersGroupTwoRoundedIcon } from "@solar-icons/react/bold-duotone/users-group-two-rounded";
import { MagnifierIcon } from "@solar-icons/react/bold-duotone/magnifier";
import { Pen2Icon } from "@solar-icons/react/bold-duotone/pen-2";
import { ShieldCheckIcon } from "@solar-icons/react/bold-duotone/shield-check";
import { CheckCircleIcon } from "@solar-icons/react/bold-duotone/check-circle";
import { CloseCircleIcon } from "@solar-icons/react/bold-duotone/close-circle";
import { RefreshIcon } from "@solar-icons/react/bold-duotone/refresh";
import { CloseSquareIcon } from "@solar-icons/react/bold-duotone/close-square";
import { AltArrowLeftIcon } from "@solar-icons/react/bold-duotone/alt-arrow-left";
import { AltArrowRightIcon } from "@solar-icons/react/bold-duotone/alt-arrow-right";
import { PhoneCallingIcon } from "@solar-icons/react/bold-duotone/phone-calling";
import { MailboxIcon } from "@solar-icons/react/bold-duotone/mailbox";
import { CalendarIcon } from "@solar-icons/react/bold-duotone/calendar";
import { WalletIcon } from "@solar-icons/react/bold-duotone/wallet";
import { DollarMinimalisticIcon } from "@solar-icons/react/bold-duotone/dollar-minimalistic";
import { PulseIcon } from "@solar-icons/react/bold-duotone/pulse";
import { SquareAcademicCapIcon } from "@solar-icons/react/bold-duotone/square-academic-cap";
import { SuitcaseIcon } from "@solar-icons/react/bold-duotone/suitcase";
import { EyeIcon } from "@solar-icons/react/bold-duotone/eye";
import { AltArrowDownIcon } from "@solar-icons/react/bold-duotone/alt-arrow-down";
import { UserCheckIcon } from "@solar-icons/react/bold-duotone/user-check";
import { UserBlockIcon } from "@solar-icons/react/bold-duotone/user-block";
import { FireIcon } from "@solar-icons/react/bold-duotone/fire";
import { CrownIcon } from "@solar-icons/react/bold-duotone/crown";
import { StarsIcon } from "@solar-icons/react/bold-duotone/stars";
import { MedalRibbonStarIcon } from "@solar-icons/react/bold-duotone/medal-ribbon-star";
import { UserIcon } from "@solar-icons/react/bold-duotone/user";
import { motion, AnimatePresence } from "framer-motion";

const SORT_OPTIONS = [
  { key: "created_at", label: "Yangilar (Sana)", icon: CalendarIcon, color: "text-blue-500" },
  { key: "tariff", label: "Tarif bo'yicha (PRO/Premium)", icon: CrownIcon, color: "text-amber-500" },
  { key: "streak", label: "Eng yuqori Streak", icon: FireIcon, color: "text-amber-500" },
  { key: "educoin", label: "Eng ko'p Educoin", icon: DollarMinimalisticIcon, color: "text-amber-600" },
  { key: "balance", label: "Eng ko'p Balans", icon: WalletIcon, color: "text-emerald-500" },
] as const;

const ITEMS_PER_PAGE = 20;

const AVATAR_COLORS = [
  "bg-violet-100 text-violet-600",
  "bg-blue-100 text-blue-600",
  "bg-emerald-100 text-emerald-600",
  "bg-amber-100 text-amber-600",
  "bg-rose-100 text-rose-600",
  "bg-cyan-100 text-cyan-600",
  "bg-indigo-100 text-indigo-600",
  "bg-pink-100 text-pink-600",
  "bg-teal-100 text-teal-600",
  "bg-orange-100 text-orange-600",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const ROLE_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  admin: { label: "Admin", icon: ShieldCheckIcon, color: "bg-violet-50 text-violet-600" },
  teacher: { label: "O'qituvchi", icon: SuitcaseIcon, color: "bg-blue-50 text-blue-600" },
  student: { label: "Talaba", icon: SquareAcademicCapIcon, color: "bg-emerald-50 text-emerald-600" },
  sub_admin: { label: "Yordamchi", icon: ShieldCheckIcon, color: "bg-amber-50 text-amber-600" },
};

const ROLE_FILTERS = [
  { key: "all", label: "Barchasi" },
  { key: "admin", label: "Admin" },
  { key: "teacher", label: "O'qituvchi" },
  { key: "student", label: "Talaba" },
];

const TARIFF_FILTERS = [
  { key: "all", label: "Barchasi", icon: UsersGroupTwoRoundedIcon, color: "text-slate-500" },
  { key: "premium", label: "Premium", icon: CrownIcon, color: "text-amber-500" },
  { key: "pro", label: "PRO", icon: StarsIcon, color: "text-purple-500" },
  { key: "lifetime", label: "Umrbod", icon: MedalRibbonStarIcon, color: "text-emerald-500" },
  { key: "standart", label: "Standart", icon: UserIcon, color: "text-slate-400" },
];

const getUserTariffInfo = (user: any) => {
  if (user?.is_lifetime) {
    return {
      key: "lifetime",
      label: "Umrbod (Lifetime)",
      badgeLabel: "Umrbod",
      icon: MedalRibbonStarIcon,
      bg: "bg-emerald-50 dark:bg-emerald-500/10",
      text: "text-emerald-600 dark:text-emerald-400",
      border: "border-emerald-200 dark:border-emerald-500/20",
    };
  }
  const tier = (user?.subscription_tier || "").toLowerCase();
  if (tier === "premium") {
    return {
      key: "premium",
      label: "Premium",
      badgeLabel: "Premium",
      icon: CrownIcon,
      bg: "bg-amber-50 dark:bg-amber-500/10",
      text: "text-amber-600 dark:text-amber-400",
      border: "border-amber-200 dark:border-amber-500/20",
    };
  }
  if (tier === "pro") {
    return {
      key: "pro",
      label: "PRO",
      badgeLabel: "PRO",
      icon: StarsIcon,
      bg: "bg-purple-50 dark:bg-purple-500/10",
      text: "text-purple-600 dark:text-purple-400",
      border: "border-purple-200 dark:border-purple-500/20",
    };
  }
  return {
    key: "standart",
    label: "Standart",
    badgeLabel: "Standart",
    icon: UserIcon,
    bg: "bg-slate-100 dark:bg-white/5",
    text: "text-slate-600 dark:text-slate-400",
    border: "border-slate-200 dark:border-white/10",
  };
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("uz-UZ").format(amount) + " so'm";

const formatDate = (date: string | null) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("uz-UZ", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatDateTime = (date: string | null) => {
  if (!date) return "—";
  return new Date(date).toLocaleString("uz-UZ", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const EditUserModal = ({
  user,
  onClose,
}: {
  user: any;
  onClose: () => void;
}) => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [formData, setFormData] = useState({
    full_name: user.full_name || "",
    phone: user.phone || "",
    role: user.role || "student",
    balance: user.balance || 0,
    educoin_balance: user.educoin_balance ?? user.educoin ?? 0,
    is_blocked: user.is_blocked || false,
    subscription_tier: user.subscription_tier || "standart",
    is_lifetime: user.is_lifetime || false,
    subscription_expires_at: user.subscription_expires_at ? user.subscription_expires_at.split("T")[0] : "",
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase
        .from("profiles") as any)
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          role: formData.role,
          balance: formData.balance,
          educoin_balance: formData.educoin_balance,
          is_blocked: formData.is_blocked,
          subscription_tier: formData.subscription_tier,
          is_lifetime: formData.is_lifetime,
          subscription_expires_at: formData.subscription_expires_at ? new Date(formData.subscription_expires_at).toISOString() : null,
        })
        .eq("user_id", user.user_id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-users-stats"] });
      toast({ title: "Muvaffaqiyatli!", description: "Foydalanuvchi yangilandi" });
      onClose();
    },
    onError: (err: any) => {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-[#080C14] w-full max-w-lg rounded-xl border border-slate-200 dark:border-white/[0.06] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center text-violet-600">
              <Pen2Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Tahrirlash</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{user.full_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
            <CloseSquareIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">Ism</label>
            <input
              value={formData.full_name}
              onChange={(e) => setFormData((p) => ({ ...p, full_name: e.target.value }))}
              className="w-full h-10 px-3.5 text-[13px] font-medium bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">Telefon</label>
            <input
              value={formData.phone}
              onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
              className="w-full h-10 px-3.5 text-[13px] font-medium bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">Rol</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData((p) => ({ ...p, role: e.target.value }))}
                className="w-full h-10 px-3.5 text-[13px] font-medium bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-slate-900 dark:text-white appearance-none"
              >
                <option value="student">Talaba</option>
                <option value="teacher">O'qituvchi</option>
                <option value="admin">Admin</option>
                <option value="sub_admin">Yordamchi</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">Holat</label>
              <select
                value={formData.is_blocked ? "blocked" : "active"}
                onChange={(e) => setFormData((p) => ({ ...p, is_blocked: e.target.value === "blocked" }))}
                className="w-full h-10 px-3.5 text-[13px] font-medium bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-slate-900 dark:text-white appearance-none"
              >
                <option value="active">Faol</option>
                <option value="blocked">Bloklangan</option>
              </select>
            </div>
          </div>

          {/* Subscription / Tariff Details */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.06] space-y-3">
            <p className="text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-300 tracking-wider">Obuna va Tarif</p>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">Obuna Tarifi</label>
                <select
                  value={formData.subscription_tier}
                  onChange={(e) => setFormData((p) => ({ ...p, subscription_tier: e.target.value }))}
                  className="w-full h-10 px-3.5 text-[13px] font-medium bg-white dark:bg-white/5 border border-slate-200 dark:border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-slate-900 dark:text-white appearance-none"
                >
                  <option value="standart">Standart (Bepul)</option>
                  <option value="pro">PRO Obuna</option>
                  <option value="premium">Premium Obuna</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">Umrbod Kirish (Lifetime)</label>
                <select
                  value={formData.is_lifetime ? "true" : "false"}
                  onChange={(e) => setFormData((p) => ({ ...p, is_lifetime: e.target.value === "true" }))}
                  className="w-full h-10 px-3.5 text-[13px] font-medium bg-white dark:bg-white/5 border border-slate-200 dark:border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-slate-900 dark:text-white appearance-none"
                >
                  <option value="false">Yo'q</option>
                  <option value="true">Ha (Umrbod cheksiz)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">Obuna Tugash Sanasi (Muddati)</label>
              <input
                type="date"
                value={formData.subscription_expires_at}
                onChange={(e) => setFormData((p) => ({ ...p, subscription_expires_at: e.target.value }))}
                className="w-full h-10 px-3.5 text-[13px] font-medium bg-white dark:bg-white/5 border border-slate-200 dark:border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">Balans (so'm)</label>
              <input
                type="number"
                value={formData.balance}
                onChange={(e) => setFormData((p) => ({ ...p, balance: Number(e.target.value) }))}
                className="w-full h-10 px-3.5 text-[13px] font-medium bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">Educoin</label>
              <input
                type="number"
                value={formData.educoin_balance}
                onChange={(e) => setFormData((p) => ({ ...p, educoin_balance: Number(e.target.value) }))}
                className="w-full h-10 px-3.5 text-[13px] font-medium bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-slate-200 dark:border-white/[0.06]">
          <button
            onClick={onClose}
            className="flex-1 h-10 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 rounded-lg text-[12px] font-semibold hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
          >
            Bekor qilish
          </button>
          <button
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
            className="flex-1 h-10 bg-violet-600 text-white rounded-lg text-[12px] font-semibold hover:bg-violet-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {updateMutation.isPending ? <RefreshIcon className="w-4 h-4 animate-spin" /> : null}
            Saqlash
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const BlockConfirmModal = ({
  user,
  onClose,
}: {
  user: any;
  onClose: () => void;
}) => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const isBlocked = user.is_blocked;
  const [blockDevice, setBlockDevice] = useState(true);

  const toggleBlockMutation = useMutation({
    mutationFn: async () => {
      // 1. Profile is_blocked o'zgartirish
      const { error } = await (supabase.from("profiles") as any)
        .update({ is_blocked: !isBlocked })
        .eq("user_id", user.user_id);
      if (error) throw error;

      // 2. Qurilmani ham bloklash (faqat bloklash paytida)
      if (!isBlocked && blockDevice) {
        // user_device_logs dan shu foydalanuvchining BARCHA qurilma fingerprintlari va IP larini olish
        const { data: logs } = await (supabase as any)
          .from("user_device_logs")
          .select("fingerprint, ip_address")
          .eq("user_id", user.user_id);

        if (logs && logs.length > 0) {
          const rows = logs.map((l: any) => ({
            fingerprint: l.fingerprint,
            ip_address: l.ip_address || null,
            user_id: user.user_id,
            email: user.email,
            full_name: user.full_name,
            reason: "Admin tomonidan bloklandi",
          }));

          await (supabase as any)
            .from("blocked_devices")
            .upsert(rows, { onConflict: "fingerprint" });
        }
      }

      // 3. Blokdan chiqarishda qurilma blokini ham olib tashlash
      if (isBlocked) {
        await (supabase as any)
          .from("blocked_devices")
          .delete()
          .eq("user_id", user.user_id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-users-stats"] });
      toast({
        title: isBlocked ? "Blokdan chiqarildi" : "Bloklandi",
        description: isBlocked
          ? `${user.full_name} faollashtirildi`
          : `${user.full_name} bloklandi${blockDevice ? " (qurilma ham bloklandi)" : ""}`,
        variant: isBlocked ? "default" : "destructive",
      });
      onClose();
    },
    onError: (err: any) => {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-[#080C14] w-full max-w-sm rounded-xl border border-slate-200 dark:border-white/[0.06] shadow-2xl p-6"
      >
        <div className={`w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center ${isBlocked ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600" : "bg-rose-100 dark:bg-rose-500/10 text-rose-600"}`}>
          {isBlocked ? <CheckCircleIcon className="w-6 h-6" /> : <UserBlockIcon className="w-6 h-6" />}
        </div>
        <h3 className="text-center text-sm font-semibold text-slate-900 dark:text-white mb-1">
          {isBlocked ? "Blokdan chiqarish" : "Bloklash"}
        </h3>
        <p className="text-center text-[12px] text-slate-500 dark:text-slate-400 mb-4">
          {isBlocked
            ? `${user.full_name} foydalanuvchisini blokdan chiqarishni xohlaysizmi?`
            : `${user.full_name} foydalanuvchisini bloklashni xohlaysizmi?`}
        </p>

        {/* Device block toggle (only when blocking) */}
        {!isBlocked && (
          <label className="flex items-start gap-2.5 mb-5 p-3 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 cursor-pointer">
            <input
              type="checkbox"
              checked={blockDevice}
              onChange={(e) => setBlockDevice(e.target.checked)}
              className="mt-0.5 accent-rose-600 w-3.5 h-3.5"
            />
            <div>
              <p className="text-[12px] font-bold text-rose-700 dark:text-rose-400">Qurilmani ham bloklash</p>
              <p className="text-[11px] text-rose-600/80 dark:text-rose-400/70 mt-0.5">
                Yangi hisob ochibda ham kira olmaydi
              </p>
            </div>
          </label>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-10 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 rounded-lg text-[12px] font-semibold hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
          >
            Bekor qilish
          </button>
          <button
            onClick={() => toggleBlockMutation.mutate()}
            disabled={toggleBlockMutation.isPending}
            className={`flex-1 h-10 rounded-lg text-[12px] font-semibold text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50 ${
              isBlocked ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
            }`}
          >
            {toggleBlockMutation.isPending ? <RefreshIcon className="w-4 h-4 animate-spin" /> : null}
            {isBlocked ? "Faollashtirish" : "Bloklash"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};



const UserDetailPanel = ({
  user,
  onClose,
}: {
  user: any;
  onClose: () => void;
}) => {
  const { data: testSessions, isLoading } = useQuery({
    queryKey: ["admin-user-sessions", user.user_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("test_sessions" as any)
        .select("*")
        .eq("user_id", user.user_id)
        .order("finished_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user.user_id,
  });

  const roleConfig = ROLE_CONFIG[user.role || "student"] || ROLE_CONFIG.student;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="relative w-full max-w-md h-full bg-white dark:bg-[#080C14] border-l border-slate-200 dark:border-white/[0.06] shadow-xl overflow-y-auto"
      >
        <div className="sticky top-0 z-10 bg-white dark:bg-[#080C14] border-b border-slate-200 dark:border-white/[0.06] px-6 py-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Foydalanuvchi profili</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <CloseSquareIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold ${getAvatarColor(user.full_name || "U")}`}>
              {user.full_name?.[0] || "U"}
            </div>
            <div>
              <h4 className="text-base font-semibold text-slate-900 dark:text-white">{user.full_name || "Ism yo'q"}</h4>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${roleConfig.color}`}>
                  <roleConfig.icon className="w-3 h-3" />
                  <span className="text-[10px] font-semibold">{roleConfig.label}</span>
                </div>
                {(() => {
                  const tInfo = getUserTariffInfo(user);
                  const TIcon = tInfo.icon;
                  return (
                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border ${tInfo.bg} ${tInfo.text} ${tInfo.border}`}>
                      <TIcon className="w-3 h-3" />
                      <span className="text-[10px] font-bold">{tInfo.badgeLabel}</span>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Tariff details card */}
          {(() => {
            const tInfo = getUserTariffInfo(user);
            const TIcon = tInfo.icon;
            return (
              <div className={`p-4 rounded-xl border ${tInfo.bg} ${tInfo.border} space-y-1.5`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TIcon className={`w-4 h-4 ${tInfo.text}`} />
                    <span className={`text-[11px] font-extrabold uppercase tracking-wider ${tInfo.text}`}>
                      Obuna Tarifi: {tInfo.label}
                    </span>
                  </div>
                </div>
                <p className="text-[12px] font-medium text-slate-600 dark:text-slate-400">
                  Muddati:{" "}
                  <strong className="text-slate-900 dark:text-white">
                    {user.is_lifetime ? "Umrbod (Cheksiz)" : formatDate(user.subscription_expires_at)}
                  </strong>
                </p>
              </div>
            );
          })()}

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-white/[0.03] rounded-lg">
              <PhoneCallingIcon className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Telefon</p>
                <p className="text-[13px] font-medium text-slate-900 dark:text-white">{user.phone || "—"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-white/[0.03] rounded-lg">
              <MailboxIcon className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email</p>
                <p className="text-[13px] font-medium text-slate-900 dark:text-white">{user.email || "—"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-white/[0.03] rounded-lg">
              <CalendarIcon className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ro'yxatdan o'tgan</p>
                <p className="text-[13px] font-medium text-slate-900 dark:text-white">{formatDate(user.created_at)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-white/[0.03] rounded-lg">
              <PulseIcon className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Oxirgi faollik</p>
                <p className="text-[13px] font-medium text-slate-900 dark:text-white">{formatDateTime(user.last_active || user.updated_at)}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-violet-50 dark:bg-violet-500/10 rounded-xl border border-violet-100 dark:border-violet-500/20">
              <div className="flex items-center gap-2 mb-2">
                <WalletIcon className="w-4 h-4 text-violet-600" />
                <span className="text-[10px] font-semibold text-violet-600 uppercase tracking-wider">Balans</span>
              </div>
              <p className="text-base font-bold text-violet-700 dark:text-violet-400">{formatCurrency(user.balance || 0)}</p>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-100 dark:border-amber-500/20">
              <div className="flex items-center gap-2 mb-2">
                <DollarMinimalisticIcon className="w-4 h-4 text-amber-600" />
                <span className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider">Educoin</span>
              </div>
              <p className="text-base font-bold text-amber-700 dark:text-amber-400">{user.educoin_balance ?? user.educoin ?? 0}</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[11px] font-semibold text-slate-900 dark:text-white uppercase tracking-wider">Test sinovlari</h4>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {testSessions?.length || 0} ta
              </span>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-slate-100 dark:bg-white/5 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : testSessions && testSessions.length > 0 ? (
              <div className="space-y-2">
                {testSessions.map((session: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/[0.03] rounded-lg border border-slate-100 dark:border-white/[0.04]"
                  >
                    <div>
                      <p className="text-[12px] font-medium text-slate-900 dark:text-white">
                        {session.category || "Umumiy"}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {formatDate(session.finished_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-[13px] font-bold ${(session.score || 0) >= 70 ? "text-emerald-600" : "text-amber-600"}`}>
                        {session.score || 0}
                      </p>
                      <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase">ball</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <PulseIcon className="w-8 h-8 mb-2" />
                <p className="text-[11px] font-semibold">Test sinovlari topilmadi</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const AdminUsers = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [tariffFilter, setTariffFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"created_at" | "tariff" | "streak" | "educoin" | "balance">("created_at");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [detailUser, setDetailUser] = useState<any | null>(null);
  const [editUser, setEditUser] = useState<any | null>(null);
  const [blockUser, setBlockUser] = useState<any | null>(null);

  const { data: queryResult, isLoading } = useQuery({
    queryKey: ["admin-users", search, roleFilter, tariffFilter, sortBy, currentPage],
    queryFn: async () => {
      let q = supabase
        .from("profiles")
        .select("*", { count: "exact" });

      if (search) {
        q = q.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
      }
      if (roleFilter !== "all") {
        q = q.eq("role", roleFilter);
      }

      // Tariff filter
      if (tariffFilter === "lifetime") {
        q = (q as any).eq("is_lifetime", true);
      } else if (tariffFilter === "premium") {
        q = (q as any).eq("subscription_tier", "premium").eq("is_lifetime", false);
      } else if (tariffFilter === "pro") {
        q = (q as any).eq("subscription_tier", "pro").eq("is_lifetime", false);
      } else if (tariffFilter === "standart") {
        q = (q as any)
          .or("subscription_tier.is.null,subscription_tier.eq.standart,subscription_tier.eq.free")
          .eq("is_lifetime", false);
      }

      if (sortBy === "streak") {
        q = q.order("login_streak", { ascending: false, nullsFirst: false });
      } else if (sortBy === "educoin") {
        q = q.order("educoin_balance", { ascending: false });
      } else if (sortBy === "balance") {
        q = q.order("balance", { ascending: false });
      } else if (sortBy === "tariff") {
        q = q.order("is_lifetime", { ascending: false, nullsFirst: false });
      } else {
        q = q.order("created_at", { ascending: false });
      }

      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      q = q.range(from, to);

      const { data, error, count } = await q;
      if (error) throw error;
      return { data: data || [], count: count || 0 };
    },
  });

  const users = queryResult?.data || [];
  const totalCount = queryResult?.count || 0;

  // Global stats query
  const { data: globalStats } = useQuery({
    queryKey: ["admin-users-stats"],
    queryFn: async () => {
      const [totalReq, blockedReq, premiumReq, proReq, lifetimeReq] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_blocked", true),
        (supabase.from("profiles") as any).select("id", { count: "exact", head: true }).eq("subscription_tier", "premium").eq("is_lifetime", false),
        (supabase.from("profiles") as any).select("id", { count: "exact", head: true }).eq("subscription_tier", "pro").eq("is_lifetime", false),
        (supabase.from("profiles") as any).select("id", { count: "exact", head: true }).eq("is_lifetime", true),
      ]);

      return {
        total: totalReq.count || 0,
        blocked: blockedReq.count || 0,
        premium: premiumReq.count || 0,
        pro: proReq.count || 0,
        lifetime: lifetimeReq.count || 0,
      };
    },
  });

  // Fetch contributor roles
  const { data: contributorIds = [] } = useQuery({
    queryKey: ["admin-contributor-ids"],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles" as any)
        .select("user_id")
        .eq("role", "question_contributor");
      return (data || []).map((r: any) => r.user_id);
    },
  });

  // Toggle contributor mutation
  const toggleContributorMutation = useMutation({
    mutationFn: async ({ userId, isContributor }: { userId: string; isContributor: boolean }) => {
      if (isContributor) {
        // Remove contributor role
        const { error } = await supabase
          .from("user_roles" as any)
          .delete()
          .eq("user_id", userId)
          .eq("role", "question_contributor");
        if (error) throw error;
      } else {
        // Add contributor role
        const { error } = await (supabase
          .from("user_roles" as any) as any)
          .insert({ user_id: userId, role: "question_contributor" } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-contributor-ids"] });
      toast({ title: "Yangilandi", description: "Contributor holati o'zgartirildi" });
    },
    onError: (err: any) => {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    },
  });

  const filtered = users; // Now already filtered by server
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const paginatedData = users; // Now already paginated by server

  const stats = {
    total: globalStats?.total || 0,
    blocked: globalStats?.blocked || 0,
    premium: globalStats?.premium || 0,
    pro: globalStats?.pro || 0,
    lifetime: globalStats?.lifetime || 0,
  };

  const toggleBlockMutation = useMutation({
    mutationFn: async ({ userId, current }: { userId: string; current: boolean }) => {
      const { error } = await (supabase
        .from("profiles") as any)
        .update({ is_blocked: !current })
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast({
        title: variables.current ? "Faollashtirildi" : "Bloklandi",
        variant: variables.current ? "default" : "destructive",
      });
    },
    onError: (err: any) => {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="w-full space-y-5 pb-16">
      <AnimatePresence>
        {detailUser && <UserDetailPanel user={detailUser} onClose={() => setDetailUser(null)} />}
        {editUser && <EditUserModal user={editUser} onClose={() => setEditUser(null)} />}
        {blockUser && <BlockConfirmModal user={blockUser} onClose={() => setBlockUser(null)} />}
      </AnimatePresence>

      <div className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center text-violet-600">
              <UsersGroupTwoRoundedIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">Foydalanuvchilar</h1>
              <p className="text-[12px] text-slate-500 dark:text-slate-400">Barcha foydalanuvchilarni boshqarish</p>
            </div>
          </div>
          <div className="px-3 py-1.5 bg-violet-100 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 rounded-lg text-[12px] font-bold">
            {stats.total} ta
          </div>
        </div>
      </div>

      <div className="relative">
        <MagnifierIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          placeholder="Ism, telefon yoki email bo'yicha qidirish..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full h-11 pl-10 pr-4 text-[13px] font-medium bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Role Filters */}
        <div className="flex gap-1 bg-slate-100 dark:bg-white/[0.03] p-1 rounded-xl w-fit">
          {ROLE_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => {
                setRoleFilter(f.key);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg text-[12px] font-semibold transition-all ${
                roleFilter === f.key
                  ? "bg-white dark:bg-[#080C14] text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Sort Selector with Solar Icons */}
        {(() => {
          const currentOpt = SORT_OPTIONS.find((s) => s.key === sortBy) || SORT_OPTIONS[0];
          const CurrentIcon = currentOpt.icon;
          return (
            <div className="relative">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 shrink-0">Tartiblash:</span>
                <button
                  onClick={() => setIsSortOpen((v) => !v)}
                  className="h-10 px-3.5 flex items-center gap-2 text-[12px] font-extrabold bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-all shadow-xs"
                >
                  <CurrentIcon className={`w-4 h-4 ${currentOpt.color}`} />
                  <span>{currentOpt.label}</span>
                  <AltArrowDownIcon className="w-3.5 h-3.5 text-slate-400 ml-1" />
                </button>
              </div>

              <AnimatePresence>
                {isSortOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setIsSortOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 4, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.98 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#0A0F1D] border border-slate-200 dark:border-white/[0.1] rounded-xl shadow-2xl z-30 p-1.5 space-y-0.5"
                    >
                      {SORT_OPTIONS.map((opt) => {
                        const Icon = opt.icon;
                        const isSelected = sortBy === opt.key;
                        return (
                          <button
                            key={opt.key}
                            onClick={() => {
                              setSortBy(opt.key as any);
                              setCurrentPage(1);
                              setIsSortOpen(false);
                            }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-bold transition-all text-left ${
                              isSelected
                                ? "bg-violet-50 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400"
                                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                            }`}
                          >
                            <Icon className={`w-4 h-4 ${opt.color}`} />
                            <span className="flex-1">{opt.label}</span>
                            {isSelected && <CheckCircleIcon className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />}
                          </button>
                        );
                      })}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          );
        })()}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <UsersGroupTwoRoundedIcon className="w-3.5 h-3.5 text-slate-400" />
            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Jami</p>
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4 cursor-pointer hover:border-amber-400 transition-colors" onClick={() => { setTariffFilter(tariffFilter === 'premium' ? 'all' : 'premium'); setCurrentPage(1); }}>
          <div className="flex items-center gap-1.5 mb-1">
            <CrownIcon className="w-3.5 h-3.5 text-amber-500" />
            <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Premium</p>
          </div>
          <p className="text-xl font-bold text-amber-700 dark:text-amber-400">{stats.premium}</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 rounded-xl p-4 cursor-pointer hover:border-purple-400 transition-colors" onClick={() => { setTariffFilter(tariffFilter === 'pro' ? 'all' : 'pro'); setCurrentPage(1); }}>
          <div className="flex items-center gap-1.5 mb-1">
            <StarsIcon className="w-3.5 h-3.5 text-purple-500" />
            <p className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">PRO</p>
          </div>
          <p className="text-xl font-bold text-purple-700 dark:text-purple-400">{stats.pro}</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-4 cursor-pointer hover:border-emerald-400 transition-colors" onClick={() => { setTariffFilter(tariffFilter === 'lifetime' ? 'all' : 'lifetime'); setCurrentPage(1); }}>
          <div className="flex items-center gap-1.5 mb-1">
            <MedalRibbonStarIcon className="w-3.5 h-3.5 text-emerald-500" />
            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Umrbod</p>
          </div>
          <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{stats.lifetime}</p>
        </div>
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <UserBlockIcon className="w-3.5 h-3.5 text-rose-500" />
            <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Bloklangan</p>
          </div>
          <p className="text-xl font-bold text-rose-700 dark:text-rose-400">{stats.blocked}</p>
        </div>
      </div>

      {/* Tariff Filter Pills */}
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-[11px] font-semibold text-slate-400 mr-1">Tarif:</span>
        {TARIFF_FILTERS.map((tf) => {
          const TFIcon = tf.icon;
          const isActive = tariffFilter === tf.key;
          return (
            <button
              key={tf.key}
              onClick={() => { setTariffFilter(tf.key); setCurrentPage(1); }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                isActive
                  ? "bg-violet-600 text-white border-violet-600 shadow-sm"
                  : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/20"
              }`}
            >
              <TFIcon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : tf.color}`} />
              {tf.label}
            </button>
          );
        })}
      </div>

      <div className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[950px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/[0.06]">
                <th className="px-5 py-3.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ism</th>
                <th className="px-5 py-3.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Telefon</th>
                <th className="px-5 py-3.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rol</th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
                  <span className="inline-flex items-center gap-1">
                    <CrownIcon className="w-3.5 h-3.5 text-amber-500" /> Tarif
                  </span>
                </th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  <span className="inline-flex items-center gap-1">
                    <FireIcon className="w-3.5 h-3.5 text-amber-500" /> Streak
                  </span>
                </th>
                <th className="px-5 py-3.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Balans</th>
                <th className="px-5 py-3.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Educoin</th>
                <th className="px-5 py-3.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Holat</th>
                <th className="px-5 py-3.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sana</th>
                <th className="px-5 py-3.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="p-16 text-center">
                    <RefreshIcon className="w-8 h-8 text-violet-600 animate-spin mx-auto mb-3" />
                    <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400">Yuklanmoqda...</p>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-16 text-center">
                    <UsersGroupTwoRoundedIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">Foydalanuvchilar topilmadi</p>
                  </td>
                </tr>
              ) : (
                paginatedData.map((u: any) => {
                  const roleConfig = ROLE_CONFIG[u.role || "student"] || ROLE_CONFIG.student;
                  const isBlocked = u.is_blocked;
                  return (
                    <tr
                      key={u.user_id}
                      className={`hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors ${isBlocked ? "bg-rose-50/30 dark:bg-rose-500/5" : ""}`}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold ${getAvatarColor(u.full_name || "U")}`}>
                            {u.full_name?.[0] || "U"}
                          </div>
                          <div>
                            <p className="text-[12px] font-semibold text-slate-900 dark:text-white line-clamp-1">{u.full_name || "Ism yo'q"}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">{u.email || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-[12px] font-medium text-slate-700 dark:text-slate-300">{u.phone || "—"}</p>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${roleConfig.color}`}>
                          <roleConfig.icon className="w-3 h-3" />
                          <span className="text-[10px] font-semibold">{roleConfig.label}</span>
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {(() => {
                          const tInfo = getUserTariffInfo(u);
                          const TIcon = tInfo.icon;
                          return (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-bold ${tInfo.bg} ${tInfo.text} ${tInfo.border}`}>
                              <TIcon className="w-3 h-3" />
                              {tInfo.badgeLabel}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-black text-[12px] border border-amber-200/60 dark:border-amber-500/20">
                          <FireIcon className="w-3.5 h-3.5 text-amber-500" /> {u.login_streak || 0}
                        </span>
                      </td>

                      <td className="px-5 py-3">
                        <p className="text-[12px] font-semibold text-slate-900 dark:text-white">{formatCurrency(u.balance || 0)}</p>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-[12px] font-semibold text-amber-600">{u.educoin_balance ?? u.educoin ?? 0}</p>
                      </td>
                      <td className="px-5 py-3">
                        {isBlocked ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-500/10 text-rose-600">
                            <CloseCircleIcon className="w-3 h-3" />
                            <span className="text-[10px] font-semibold">Bloklangan</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600">
                            <CheckCircleIcon className="w-3 h-3" />
                            <span className="text-[10px] font-semibold">Faol</span>
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{formatDate(u.created_at)}</p>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setDetailUser(u)}
                            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all"
                            title="Ko'rish"
                          >
                            <EyeIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditUser(u)}
                            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-all"
                            title="Tahrirlash"
                          >
                            <Pen2Icon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => toggleContributorMutation.mutate({ userId: u.user_id, isContributor: contributorIds.includes(u.user_id) })}
                            disabled={toggleContributorMutation.isPending}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                              contributorIds.includes(u.user_id)
                                ? "bg-purple-100 dark:bg-purple-500/15 text-purple-600 hover:bg-purple-200 dark:hover:bg-purple-500/25"
                                : "bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-500/10"
                            }`}
                            title={contributorIds.includes(u.user_id) ? "Contributorlikni o'chirish" : "Contributor qilish"}
                          >
                            <UserCheckIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setBlockUser(u)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                              isBlocked
                                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-500/20"
                                : "bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                            }`}
                            title={isBlocked ? "Blokdan chiqarish" : "Bloklash"}
                          >
                            <UserBlockIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 dark:border-white/[0.06]">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} / {filtered.length}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <AltArrowLeftIcon className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let page: number;
                if (totalPages <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i;
                } else {
                  page = currentPage - 2 + i;
                }
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg text-[12px] font-semibold transition-colors ${
                      currentPage === page
                        ? "bg-violet-600 text-white"
                        : "bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <AltArrowRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
