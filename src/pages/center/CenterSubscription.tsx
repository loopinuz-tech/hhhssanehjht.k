import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CreditCard, CheckCircle2,
  TrendingUp, Calendar, Zap, Clock,
  Users, BookOpen, FileText, UserCheck, Check, Loader2
} from "lucide-react";
import SEO from "@/components/SEO";
import { useToast } from "@/hooks/use-toast";

interface SubscriptionInfo {
  subscription: {
    id?: string;
    center_id: string;
    plan_name: string;
    price: number;
    status: string;
    started_at?: string;
    next_billing_date?: string;
    limits: {
      max_students: number;
      max_classes: number;
      max_staff: number;
      max_mocks: number;
    };
  };
  payments: Array<{
    id: string;
    amount: number;
    status: string;
    created_at: string;
    notes?: string;
  }>;
}

interface DashboardStats {
  classesCount: number;
  studentsCount: number;
  staffCount: number;
  mocksCount: number;
  center: {
    id: string;
    name: string;
    username: string;
  };
}

const PLAN_PERIODS = [
  { months: 1, label: "1 oylik obuna", discount: 0, price: 490000 },
  { months: 3, label: "3 oylik obuna", discount: 10, price: 1323000, badge: "10% chegirma" },
  { months: 6, label: "6 oylik obuna", discount: 20, price: 2352000, badge: "20% chegirma" },
  { months: 12, label: "1 yillik obuna", discount: 30, price: 4116000, badge: "30% chegirma (Tejamkor)" },
];

export default function CenterSubscription() {
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState(PLAN_PERIODS[0]);
  const [isPaying, setIsPaying] = useState(false);

  const { data: subData, isLoading: subLoading } = useQuery<SubscriptionInfo>({
    queryKey: ["center-subscription"],
    queryFn: async () => {
      const res = await fetch("/api/center/subscription", { credentials: "include" });
      if (!res.ok) throw new Error("Obuna ma'lumotlarini yuklab bo'lmadi");
      return res.json();
    }
  });

  const { data: dashData } = useQuery<DashboardStats>({
    queryKey: ["center-dashboard-stats"],
    queryFn: async () => {
      const res = await fetch("/api/center/dashboard", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    }
  });

  const sub = subData?.subscription;
  const payments = subData?.payments || [];
  const limits = sub?.limits || { max_students: 500, max_classes: 30, max_staff: 10, max_mocks: 100 };

  const handleInPayCheckout = async () => {
    if (!dashData?.center?.id) {
      toast({ title: "Xatolik", description: "Markaz ma'lumotlari topilmadi", variant: "destructive" });
      return;
    }

    setIsPaying(true);
    try {
      const res = await fetch("/api/centers/subscription/inpay-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          center_id: dashData.center.id,
          plan_name: `${sub?.plan_name || "EduCenter Pro"} (${selectedPeriod.months} oy)`,
          amount: selectedPeriod.price,
          return_url: window.location.href
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success || !json.pay_url) {
        throw new Error(json.error || "InPay to'lov havolasini yaratishda xatolik");
      }

      // Redirect to InPay checkout
      window.location.href = json.pay_url;
    } catch (err: any) {
      toast({ title: "To'lovda xatolik", description: err.message, variant: "destructive" });
      setIsPaying(false);
    }
  };

  if (subLoading) {
    return (
      <div className="space-y-6 animate-pulse p-4 sm:p-8 max-w-6xl mx-auto">
        <div className="h-36 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const isStatusActive = sub?.status === "ACTIVE";

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      <SEO title="Tarif va to'lovlar | EduContest Markaz" description="Markaz obunasi va to'lovlar tarixi" />

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Tarif va to'lovlar
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          O'quv markazingiz obuna rejasi, foydalanish chegaralari va InPay orqali to'lovlar
        </p>
      </div>

      {/* Current Plan Overview Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-[#E8192C]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 -mb-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {sub?.plan_name || "EduCenter Pro"}
              </span>
              <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                isStatusActive 
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
              }`}>
                {isStatusActive ? "✓ Faol obuna" : "Kutilmoqda / To'lov kerak"}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black">
                {Number(sub?.price || 490000).toLocaleString("uz-UZ")}
              </span>
              <span className="text-slate-400 font-medium text-sm">so'm / oy</span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>
                Keyingi to'lov sanasi:{" "}
                <strong className="text-white">
                  {sub?.next_billing_date ? new Date(sub.next_billing_date).toLocaleDateString("uz-UZ", {
                    year: "numeric", month: "long", day: "numeric"
                  }) : "Belgilanmagan"}
                </strong>
              </span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <a
              href="#payment-section"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#E8192C] to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold text-sm shadow-lg shadow-red-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Zap className="w-4 h-4 fill-current" />
              Tarifni uzaytirish / yangilash
            </a>
          </div>
        </div>
      </div>

      {/* Usage Limit Meters */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-500" />
          Foydalanish hajmi va chegaralar
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Students Meter */}
          {(() => {
            const current = dashData?.studentsCount || 0;
            const max = limits.max_students || 500;
            const percent = Math.min(100, Math.round((current / max) * 100));
            return (
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-400">{percent}%</span>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">O'quvchilar</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                    {current} <span className="text-xs text-slate-400 font-normal">/ {max}</span>
                  </p>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
                </div>
              </div>
            );
          })()}

          {/* Classes Meter */}
          {(() => {
            const current = dashData?.classesCount || 0;
            const max = limits.max_classes || 30;
            const percent = Math.min(100, Math.round((current / max) * 100));
            return (
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-400">{percent}%</span>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Sinflar</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                    {current} <span className="text-xs text-slate-400 font-normal">/ {max}</span>
                  </p>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
                </div>
              </div>
            );
          })()}

          {/* Mocks Meter */}
          {(() => {
            const current = dashData?.mocksCount || 0;
            const max = limits.max_mocks || 100;
            const percent = Math.min(100, Math.round((current / max) * 100));
            return (
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-400">{percent}%</span>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Mock testlar</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                    {current} <span className="text-xs text-slate-400 font-normal">/ {max}</span>
                  </p>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
                </div>
              </div>
            );
          })()}

          {/* Staff Meter */}
          {(() => {
            const current = dashData?.staffCount || 0;
            const max = limits.max_staff || 10;
            const percent = Math.min(100, Math.round((current / max) * 100));
            return (
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-violet-500/10 text-violet-500 flex items-center justify-center">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-400">{percent}%</span>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Hodimlar</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                    {current} <span className="text-xs text-slate-400 font-normal">/ {max}</span>
                  </p>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-violet-500 h-full rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* InPay Checkout & Duration Selection */}
      <div id="payment-section" className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-bold uppercase rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              InPay to'lov integratsiyasi
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white mt-2">
            Obunani to'lash yoki muddatini uzaytirish
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Quyidagi muddatlardan birini tanlang va Uzum, Click yoki Payme orqali InPay tizimida to'lovni amalga oshiring:
          </p>
        </div>

        {/* Duration Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLAN_PERIODS.map((period) => {
            const isSelected = selectedPeriod.months === period.months;
            return (
              <div
                key={period.months}
                onClick={() => setSelectedPeriod(period)}
                className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                  isSelected
                    ? "border-[#E8192C] bg-red-500/[0.03] dark:bg-red-500/[0.05] shadow-md shadow-red-500/10"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30"
                }`}
              >
                {period.badge && (
                  <span className="absolute -top-3 left-4 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-gradient-to-r from-[#E8192C] to-red-600 text-white shadow-sm">
                    {period.badge}
                  </span>
                )}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{period.label}</span>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    isSelected ? "border-[#E8192C] bg-[#E8192C] text-white" : "border-slate-300 dark:border-slate-600"
                  }`}>
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {period.price.toLocaleString("uz-UZ")}{" "}
                  <span className="text-xs font-normal text-slate-400">so'm</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  oyiga {(period.price / period.months).toLocaleString("uz-UZ")} so'mdan
                </p>
              </div>
            );
          })}
        </div>

        {/* Benefits List */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Tarifga kiritilgan barcha imkoniyatlar:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>EduContest rasmiy mock testlar bazasidan cheksiz foydalanish</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>Rasch modeli bo'yicha BMBA standartidagi qiyinlik tahlillari</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>Sinflar bo'yicha o'quvchilar reytingi va CSV eksport</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>Brendlangan markaz portali (educontest.uz/c/:username)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>O'qituvchi va xodimlar uchun alohida huquqlar berish</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>Telegram bot orqali avtomatik natijalar va yangiliklar yuborish</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="text-sm text-slate-500 text-center sm:text-left">
            To'lov xavfsizligi InPay to'lov shlyuzi tomonidan kafolatlanadi.
          </div>
          <button
            onClick={handleInPayCheckout}
            disabled={isPaying}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-[#E8192C] hover:bg-red-600 disabled:opacity-60 text-white font-black text-base shadow-xl shadow-red-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {isPaying ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                InPay sahifasiga yo'naltirilmoqda...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                InPay orqali to'lash ({selectedPeriod.price.toLocaleString("uz-UZ")} so'm)
              </>
            )}
          </button>
        </div>
      </div>

      {/* Payment History Table */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-400" />
          To'lovlar tarixi
        </h2>

        {payments.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-sm">
            Hozircha to'lovlar tarixi mavjud emas
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="pb-3">Sana</th>
                  <th className="pb-3">Izoh</th>
                  <th className="pb-3">Summa</th>
                  <th className="pb-3">To'lov holati</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {payments.map((p) => {
                  const isCompleted = p.status === "completed" || p.status === "paid";
                  const isPending = p.status === "pending";
                  return (
                    <tr key={p.id} className="text-slate-700 dark:text-slate-300">
                      <td className="py-3.5 text-xs text-slate-500">
                        {new Date(p.created_at).toLocaleString("uz-UZ", {
                          year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                        })}
                      </td>
                      <td className="py-3.5 font-medium">
                        {p.notes || "Markaz oylik obuna to'lovi"}
                      </td>
                      <td className="py-3.5 font-bold">
                        {Number(p.amount).toLocaleString("uz-UZ")} so'm
                      </td>
                      <td className="py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          isCompleted
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : isPending
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        }`}>
                          {isCompleted ? "To'landi" : isPending ? "Kutilmoqda" : "Bekor qilingan"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
