import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Send, ShieldCheck, Check, Copy, ExternalLink,
  AlertCircle, Bell, BellRing, Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";

interface TelegramData {
  connected: boolean;
  chat_id: number | null;
  linked_at: string | null;
  bot_username: string;
}

const CenterTelegram = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [chatIdInput, setChatIdInput] = useState("");
  const [isLinking, setIsLinking] = useState(false);

  const { data, isLoading } = useQuery<TelegramData>({
    queryKey: ["center-telegram-status"],
    queryFn: async () => {
      const res = await fetch("/api/center/telegram", { credentials: "include" });
      if (!res.ok) throw new Error("Telegram ma'lumotlarini yuklab bo'lmadi");
      return res.json();
    }
  });

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatIdInput.trim()) {
      toast({ title: "Xatolik", description: "Telegram Chat ID ni kiriting", variant: "destructive" });
      return;
    }

    setIsLinking(true);
    try {
      const res = await fetch("/api/center/telegram/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ chat_id: chatIdInput.trim() })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast({ title: "Muvaffaqiyatli! 🟢", description: "Telegram bot markazingizga ulandi" });
      setChatIdInput("");
      queryClient.invalidateQueries({ queryKey: ["center-telegram-status"] });
    } catch (err: any) {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    } finally {
      setIsLinking(false);
    }
  };

  const isConnected = Boolean(data?.connected);
  const botUser = data?.bot_username || "educontesttbot";

  return (
    <>
      <SEO title="Telegram botni ulash — Markaz boshqaruvi" />
      <div className="max-w-3xl mx-auto space-y-6">
        {/* HEADER */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Telegram Bot Integratsiyasi
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            Markazingiz faoliyati haqida (yangi o'quvchilar, sinfga so'rovlar, imtihon natijalari) tezkor xabarlarni Telegram orqali qabul qiling.
          </p>
        </div>

        {/* STATUS CARD */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                isConnected ? "bg-emerald-500/15 text-emerald-600" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
              }`}>
                <Send className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Telegram Bot Holati</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
                  <span className={`text-xs font-bold ${isConnected ? "text-emerald-600" : "text-slate-400"}`}>
                    {isConnected ? "Ulangan 🟢" : "Ulanmagan ⚪"}
                  </span>
                </div>
              </div>
            </div>

            <a
              href={`https://t.me/${botUser}`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
            >
              <span>@{botUser}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {isConnected && data?.linked_at && (
            <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl text-xs space-y-1 text-emerald-800 dark:text-emerald-300">
              <div className="font-bold">Chat ID: {data.chat_id}</div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400">
                Ulangan sana: {new Date(data.linked_at).toLocaleString()}
              </div>
            </div>
          )}
        </div>

        {/* INSTRUCTIONS & LINK FORM */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Botni ulash bo'yicha ko'rsatma</h3>

          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center shrink-0">1</span>
              <span>Telegram ilovangizda <a href={`https://t.me/${botUser}`} target="_blank" rel="noreferrer" className="font-bold text-sky-600 underline">@{botUser}</a> botini oching va <b>/start</b> buyrug'ini yuboring.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center shrink-0">2</span>
              <span>Bot tomonidan berilgan shaxsiy <b>Chat ID</b> raqamini oling (yoki <i>/myid</i> buyrug'idan foydalaning).</span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center shrink-0">3</span>
              <span>Quyidagi maydonga Chat ID raqamini kiriting va <b>"Ulash"</b> tugmasini bosing.</span>
            </div>
          </div>

          <form onSubmit={handleLink} className="space-y-3 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Telegram Chat ID</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={chatIdInput}
                  onChange={(e) => setChatIdInput(e.target.value)}
                  placeholder="Masalan: 123456789"
                  className="flex-1 h-12 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold text-sm text-slate-900 dark:text-white focus:border-[#E8192C]"
                  required
                />
                <button
                  type="submit"
                  disabled={isLinking}
                  className="px-6 h-12 bg-[#E8192C] hover:bg-[#D41524] text-white rounded-xl font-bold text-sm flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  {isLinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Ulash</span>}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* NOTIFICATION PREFERENCES */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Yuboriladigan bildirishnomalar</h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            <div className="py-2.5 flex items-center justify-between">
              <span className="font-medium text-slate-700 dark:text-slate-200">Sinfga yangi o'quvchi qo'shilish so'rovi</span>
              <span className="font-bold text-emerald-600">Yoqilgan ✓</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="font-medium text-slate-700 dark:text-slate-200">Yangi mock test chop etilganda</span>
              <span className="font-bold text-emerald-600">Yoqilgan ✓</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="font-medium text-slate-700 dark:text-slate-200">Imtihon natijalari e'lon qilinganda</span>
              <span className="font-bold text-emerald-600">Yoqilgan ✓</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="font-medium text-slate-700 dark:text-slate-200">Obuna muddati tugashi haqida ogohlantirish</span>
              <span className="font-bold text-emerald-600">Yoqilgan ✓</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CenterTelegram;
