import { Wallet, QrCode, History, ArrowUpRight, ArrowDownLeft, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { rewriteStorageUrl } from "@/lib/storage";

const WalletPage = () => {
  const { profile, user } = useAuth();

  const { data: transactions = [] } = useQuery({
    queryKey: ["transactions", user?.id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return (data as any[]) || [];
    },
    enabled: !!user,
  });

  const { data: settings } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("admin_settings").select("*");
      const map: Record<string, string> = {};
      (data as any[])?.forEach((s) => { map[s.key] = s.value || ""; });
      return map;
    },
  });

  const lifetimePrice = Number(settings?.lifetime_price || 200000);
  const qrImageUrl = settings?.qr_image_url;

  return (
    <div className="max-w-2xl space-y-6">

      {/* Page title */}
      <div className="pb-2 border-b border-gray-100">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Hamyon</p>
        <h1 className="text-xl font-semibold text-gray-900">Hisobingiz</h1>
      </div>

      {/* Balance card */}
      <div className="bg-gray-900 rounded-2xl p-6 text-white">
        <p className="text-xs text-gray-400 mb-2">Joriy balans</p>
        <p className="text-3xl font-semibold tracking-tight mb-1">
          {(profile?.balance || 0).toLocaleString()}
          <span className="text-lg font-normal text-gray-400 ml-1.5">so'm</span>
        </p>
        {profile?.is_lifetime && (
          <span className="inline-flex items-center gap-1 mt-3 text-[11px] font-medium bg-white/10 text-white px-2.5 py-1 rounded-full">
            <Sparkles className="w-3 h-3" /> Umrbod a'zolik
          </span>
        )}
      </div>

      {/* Payment section */}
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 dark:border-slate-800">
          <p className="text-[11px] font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-wider">To'lov usuli</p>
        </div>

        <div className="p-6 space-y-5">
          {/* QR */}
          <div className="flex items-start gap-5">
            <div className="w-28 h-28 flex-shrink-0 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
              {qrImageUrl ? (
                <img src={rewriteStorageUrl(qrImageUrl)} alt="QR" className="w-full h-full object-contain" />
              ) : (
                <QrCode className="w-10 h-10 text-gray-300 dark:text-slate-600" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-white mb-1">Paynet orqali to'lash</p>
              <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
                QR kodni Paynet ilovasida skanerlang va kerakli miqdorni kiriting. To'lov tasdiqlangandan so'ng balans avtomatik yangilanadi.
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-50 dark:border-slate-800" />

          {/* Lifetime offer */}
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-white">🎁 Umrbod a'zolik</p>
              <p className="text-xs text-gray-400 dark:text-slate-400 mt-0.5">
                Barcha testlarga cheksiz kirish
              </p>
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-white flex-shrink-0">
              {lifetimePrice.toLocaleString()} so'm
            </span>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 dark:border-slate-800">
          <p className="text-[11px] font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-wider">Tranzaksiyalar</p>
        </div>

        {transactions.length > 0 ? (
          <div className="divide-y divide-gray-50 dark:divide-slate-800">
            {transactions.map((t) => (
              <div key={t.id} className="flex items-center gap-4 px-6 py-3.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  t.type === "deposit" ? "bg-emerald-50" : "bg-red-50"
                }`}>
                  {t.type === "deposit"
                    ? <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
                    : <ArrowUpRight className="w-4 h-4 text-red-400" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{t.description || "Tranzaksiya"}</p>
                  <p className="text-[11px] text-gray-400">
                    {new Date(t.created_at).toLocaleDateString("uz-UZ", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <span className={`text-sm font-semibold flex-shrink-0 ${t.type === "deposit" ? "text-emerald-600" : "text-red-500"}`}>
                  {t.type === "deposit" ? "+" : "−"}{Number(t.amount).toLocaleString()} so'm
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-3">
              <History className="w-5 h-5 text-gray-300" />
            </div>
            <p className="text-sm text-gray-400">Tranzaksiyalar yo'q</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default WalletPage;
