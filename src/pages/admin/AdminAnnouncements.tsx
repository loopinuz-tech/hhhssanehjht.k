import { useState, useMemo, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SpeakerIcon } from "@solar-icons/react/bold-duotone/speaker";
import { AddCircleIcon as PlusCircleIcon } from "@solar-icons/react/bold-duotone/add-circle";
import { TrashBinMinimalisticIcon } from "@solar-icons/react/bold-duotone/trash-bin-minimalistic";
import { Pen2Icon } from "@solar-icons/react/bold-duotone/pen-2";
import { CloseSquareIcon } from "@solar-icons/react/bold-duotone/close-square";
import { SendSquareIcon } from "@solar-icons/react/bold-duotone/send-square";
import { RefreshIcon } from "@solar-icons/react/bold-duotone/refresh";
import { EyeIcon } from "@solar-icons/react/bold-duotone/eye";
import { EyeClosedIcon } from "@solar-icons/react/bold-duotone/eye-closed";
import { InfoCircleIcon } from "@solar-icons/react/bold-duotone/info-circle";
import { DangerTriangleIcon } from "@solar-icons/react/bold-duotone/danger-triangle";
import { CheckCircleIcon } from "@solar-icons/react/bold-duotone/check-circle";
import { DangerCircleIcon } from "@solar-icons/react/bold-duotone/danger-circle";
import { DisketteIcon } from "@solar-icons/react/bold-duotone/diskette";
import { CameraMinimalisticIcon } from "@solar-icons/react/bold-duotone/camera-minimalistic";
import { RestartCircleIcon } from "@solar-icons/react/bold-duotone/restart-circle";
import { getStoragePublicUrl, rewriteStorageUrl } from "@/lib/storage";
import TopAnnouncementBar from "@/components/common/TopAnnouncementBar";
import { Link2, Copy } from "lucide-react";

const TYPE_CONFIG: Record<string, { label: string; color: string; dot: string; icon: any }> = {
  info: { label: "Info", color: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400", dot: "bg-blue-500", icon: InfoCircleIcon },
  warning: { label: "Ogohlantirish", color: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400", dot: "bg-amber-500", icon: DangerTriangleIcon },
  success: { label: "Muvaffaqiyat", color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400", dot: "bg-emerald-500", icon: CheckCircleIcon },
  error: { label: "Xatolik", color: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400", dot: "bg-rose-500", icon: DangerCircleIcon },
};

const AdminAnnouncements = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", content: "", type: "info", is_active: true });
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Top Announcement Management
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [topText, setTopText] = useState("");
  const [topActive, setTopActive] = useState(true);
  const [topImageUrl, setTopImageUrl] = useState("");
  const [topLinkUrl, setTopLinkUrl] = useState("");
  const [isTopInitialized, setIsTopInitialized] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const { data: topSettings } = useQuery({
    queryKey: ["admin-top-announcement-settings"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("admin_settings")
        .select("*")
        .in("key", ["top_announcement", "announcement_active", "top_announcement_image_url", "top_announcement_link"]);
      if (error) throw error;
      const map: Record<string, string> = {};
      data?.forEach((s: any) => { map[s.key] = s.value; });
      return {
        text: map.top_announcement || "",
        isActive: map.announcement_active !== "false",
        imageUrl: (map.top_announcement_image_url && map.top_announcement_image_url !== "/broimg.png") ? map.top_announcement_image_url : "",
        linkUrl: map.top_announcement_link || "",
      };
    },
  });

  useEffect(() => {
    if (topSettings && !isTopInitialized) {
      setTopText(topSettings.text);
      setTopActive(topSettings.isActive);
      setTopImageUrl((topSettings.imageUrl && topSettings.imageUrl !== "/broimg.png") ? topSettings.imageUrl : "");
      setTopLinkUrl(topSettings.linkUrl || "");
      setIsTopInitialized(true);
    }
  }, [topSettings, isTopInitialized]);

  const uploadImageFile = async (file: File) => {
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "Hajm chegarasi",
        description: `Rasm hajmi 5 MB dan oshmasligi kerak (tanlangan rasm: ${(file.size / (1024 * 1024)).toFixed(2)} MB).`,
        variant: "destructive",
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Noto'g'ri fayl",
        description: "Faqat rasm formatidagi fayllarni yuklashingiz mumkin (PNG, JPG, WEBP, GIF, SVG).",
        variant: "destructive",
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsUploadingImage(true);
    try {
      const ext = file.name ? (file.name.split(".").pop()?.toLowerCase() || "png") : (file.type.split("/")[1] || "png");
      const cleanExt = ext.replace(/[^a-z0-9]/gi, "") || "png";
      const fileName = `announcements/top_${Date.now()}_${Math.random().toString(36).slice(2)}.${cleanExt}`;
      
      let publicUrl = "";
      const { error: err1 } = await supabase.storage
        .from("resources")
        .upload(fileName, file, { cacheControl: "3600", upsert: true });

      if (!err1) {
        publicUrl = getStoragePublicUrl("resources", fileName);
      } else {
        const { error: err2 } = await supabase.storage
          .from("subject_resources")
          .upload(fileName, file, { cacheControl: "3600", upsert: true });
        if (!err2) {
          publicUrl = getStoragePublicUrl("subject_resources", fileName);
        } else {
          try {
            const fd = new FormData();
            fd.append("file", file);
            const pr = await fetch("/api/storage/upload/resources", { method: "POST", body: fd });
            const resJson = await pr.json();
            if (resJson?.url) {
              publicUrl = resJson.url;
            } else {
              throw err1;
            }
          } catch {
            throw err1;
          }
        }
      }

      setTopImageUrl(publicUrl);
      toast({
        title: "Banner rasmi yuklandi!",
        description: "Rasm muvaffaqiyatli saqlandi. 'Sozlamalarni saqlash' tugmasini bosing.",
      });
    } catch (err: any) {
      toast({
        title: "Yuklashda xatolik",
        description: err.message || "Rasmni yuklab bo'lmadi",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleUploadTopImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadImageFile(file);
    }
  };

  // Clipboard (Ctrl + V) paste listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            uploadImageFile(file);
            toast({
              title: "Nusxalangan rasm olindi!",
              description: "Ctrl + V orqali banner rasmi yuklanmoqda...",
            });
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  const saveTopAnnouncementMutation = useMutation({
    mutationFn: async () => {
      const updates = [
        { key: "top_announcement", value: topText },
        { key: "announcement_active", value: topActive ? "true" : "false" },
        { key: "top_announcement_image_url", value: topImageUrl },
        { key: "top_announcement_link", value: topLinkUrl },
      ];

      for (const item of updates) {
        const { error } = await (supabase as any)
          .from("admin_settings")
          .upsert(item, { onConflict: "key" });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-top-announcement-settings"] });
      qc.invalidateQueries({ queryKey: ["site-announcement"] });
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
      toast({
        title: "Muvaffaqiyatli saqlandi!",
        description: "Yuqori qator yangilik sozlamalari yangilandi.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Saqlashda xatolik",
        description: err.message || "Sozlamalarni saqlab bo'lmadi",
        variant: "destructive",
      });
    },
  });

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ["admin-announcements"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("announcements").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const stats = useMemo(() => ({
    total: announcements.length,
    active: announcements.filter((a: any) => a.is_active).length,
  }), [announcements]);

  const filtered = useMemo(() => {
    if (filter === "active") return announcements.filter((a: any) => a.is_active);
    if (filter === "inactive") return announcements.filter((a: any) => !a.is_active);
    return announcements;
  }, [announcements, filter]);

  const upsertMutation = useMutation({
    mutationFn: async (payload: typeof form) => {
      const data = { title: payload.title, content: payload.content, type: payload.type, is_active: payload.is_active };
      if (editId) {
        const { error } = await (supabase as any).from("announcements").update(data).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("announcements").insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-announcements"] });
      toast({ title: editId ? "Yangilandi" : "Yaratildi" });
      closeModal();
    },
    onError: (e: any) => toast({ title: "Xatolik", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("announcements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-announcements"] });
      toast({ title: "O'chirildi" });
      setDeleteTarget(null);
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await (supabase as any).from("announcements").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-announcements"] }),
  });

  const closeModal = () => {
    setShowModal(false);
    setEditId(null);
    setForm({ title: "", content: "", type: "info", is_active: true });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center">
            <SpeakerIcon className="w-5 h-5 text-pink-500" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">E'lonlar</h1>
            <p className="text-[11px] text-slate-500">{stats.total} ta e'lon</p>
          </div>
        </div>
        <button
          onClick={() => { setForm({ title: "", content: "", type: "info", is_active: true }); setEditId(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-[#E8192C] text-white rounded-lg text-[12px] font-bold hover:opacity-90 transition-opacity"
        >
          <PlusCircleIcon className="w-4 h-4" /> Yangi e'lon
        </button>
      </div>

      {/* Top Announcement Bar Manager Card */}
      <div className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 sm:p-6 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E8192C]/10 flex items-center justify-center text-[#E8192C] shrink-0">
              <SpeakerIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[15px] font-bold text-slate-900 dark:text-white">
                  Yuqori qator yangiligi (Top Yangilik Bar)
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                    topActive
                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"
                      : "bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400 border border-slate-200 dark:border-white/10"
                  }`}
                >
                  {topActive ? "Faol" : "Nofaol"}
                </span>
              </div>
              <p className="text-[12px] text-slate-500 dark:text-slate-400">
                Platformaning eng yuqori qismida chiqadigan EduContest Yangilik paneli, banner rasm yoki matn hamda bosilganda havola ochilishi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setTopActive(!topActive)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                topActive
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                  : "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400"
              }`}
            >
              <div className={`w-2.5 h-2.5 rounded-full ${topActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
              <span>{topActive ? "Yangilik Yoqilgan" : "Yangilik O'chirilgan"}</span>
            </button>
          </div>
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          {/* Banner Image Uploader (Eni uzun, bo'yi kalta rasm + Drag/Drop + Ctrl+V) */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) uploadImageFile(file);
            }}
            className={`p-4 bg-slate-50 dark:bg-white/[0.02] border transition-colors rounded-xl space-y-3 ${
              isDragging
                ? "border-dashed border-[#E8192C] bg-[#E8192C]/5"
                : "border-slate-200 dark:border-white/[0.08]"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Yangilik banner rasmi (Eni uzun, bo'yi kalta)
                  </label>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 px-2 py-0.5 rounded">
                    <Copy className="w-3 h-3 text-[#E8192C]" /> Ctrl + V qo'llab-quvvatlanadi
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Kompyuterdan tanlang, rasmni bu yerga tashlang yoki to'g'ridan-to'g'ri <kbd className="font-mono bg-slate-200 dark:bg-slate-800 px-1 rounded">Ctrl+V</kbd> bosing. Rasm va matn birgalikda yonma-yon chiroyli ko'rsatiladi.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                  onChange={handleUploadTopImage}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isUploadingImage}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 bg-slate-900 dark:bg-white/10 hover:bg-slate-800 dark:hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isUploadingImage ? (
                    <RefreshIcon className="w-4 h-4 animate-spin" />
                  ) : (
                    <CameraMinimalisticIcon className="w-4 h-4" />
                  )}
                  <span>
                    {isUploadingImage
                      ? "Yuklanmoqda..."
                      : topImageUrl
                      ? "Boshqa banner yuklash"
                      : "Kompyuterdan yuklash"}
                  </span>
                </button>

                {topImageUrl && (
                  <button
                    type="button"
                    onClick={() => setTopImageUrl("")}
                    className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors flex items-center gap-1 cursor-pointer border border-rose-200 dark:border-rose-500/20"
                    title="Rasmni o'chirish va matnga qaytish"
                  >
                    <TrashBinMinimalisticIcon className="w-4 h-4" />
                    <span>Olib tashlash</span>
                  </button>
                )}
              </div>
            </div>

            {/* Banner Preview if uploaded */}
            {topImageUrl ? (
              <div className="w-full p-2 bg-white dark:bg-[#0c121e] border border-emerald-500/30 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="h-10 sm:h-12 w-full max-w-lg flex items-center justify-center bg-slate-100 dark:bg-black/20 rounded p-1 overflow-hidden">
                  <img
                    src={rewriteStorageUrl(topImageUrl)}
                    alt="Yuklangan gorizontal banner"
                    className="h-full w-auto max-w-full object-contain"
                  />
                </div>
                <div className="text-right shrink-0">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                    <CheckCircleIcon className="w-3.5 h-3.5" />
                    Rasm yuklangan (Matn bilan birga chiqadi)
                  </span>
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-slate-200 dark:border-white/10 rounded-lg p-3 text-center text-xs text-slate-400">
                Hozircha rasm yuklanmagan. Kompyuterdan tanlang, nusxalab <kbd className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-slate-600 dark:text-slate-300">Ctrl + V</kbd> bosing yoki quyida URL kiriting.
              </div>
            )}

            {/* Direct Image URL input */}
            <div className="pt-2 border-t border-slate-200/60 dark:border-white/[0.04] space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Rasm URL manzili (Kompyuterdan yuklaganda avtomatik to'ladi yoki o'zingiz havola yozishingiz mumkin)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={topImageUrl}
                  onChange={(e) => setTopImageUrl(e.target.value)}
                  placeholder="https://... yoki 'Kompyuterdan yuklash' tugmasi orqali rasm yuklang"
                  className="flex-1 h-9 px-3 text-xs bg-white dark:bg-black/20 border border-slate-200 dark:border-white/[0.08] rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#E8192C]"
                />
                {topImageUrl && (
                  <button
                    type="button"
                    onClick={() => setTopImageUrl("")}
                    className="px-2.5 py-1 text-xs text-slate-400 hover:text-rose-500 font-medium"
                  >
                    Tozalash
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Advertisement / News Text (Fallback or primary) */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Yangilik matni {topImageUrl ? "(Rasm bilan birga chiqadigan matn)" : "(Sayt markazida chiqadigan matn)"}
            </label>
            <input
              type="text"
              value={topText}
              onChange={(e) => setTopText(e.target.value)}
              placeholder="Masalan: Yangi xalqaro olimpiada ro'yxatdan o'tish boshlandi!"
              className="w-full h-11 px-3.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E8192C]/20 focus:border-[#E8192C] transition-all"
            />
            <p className="text-[11px] text-slate-400">
              {topImageUrl
                ? "Rasm yonida ushbu yangilik matni ham ko'rsatiladi. Agar faqat rasm kerak bo'lsa, bu yerni bo'sh qoldiring."
                : "Ushbu matn saytning eng yuqori satrida markazda ko'rsatiladi."}
            </p>
          </div>

          {/* Yo'naltirish havolasi (Link / URL) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-[#E8192C]" />
                Yo'naltirish havolasi (Link / URL)
              </label>
              {topLinkUrl ? (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  ✓ Bosilganda havola ochiladi
                </span>
              ) : null}
            </div>
            <input
              type="text"
              value={topLinkUrl}
              onChange={(e) => setTopLinkUrl(e.target.value)}
              placeholder="Masalan: https://t.me/educontest yoki /olympiads yoki /contests"
              className="w-full h-11 px-3.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E8192C]/20 focus:border-[#E8192C] transition-all"
            />
            <p className="text-[11px] text-slate-400">
              Foydalanuvchi banner yoki matn ustiga bosganda ushbu havolaga o'tiladi (tashqi saytlar yangi oynada, ichki sahifalar esa sayt ichida ochiladi).
            </p>
          </div>
        </div>

        {/* Live Preview */}
        <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Jonli ko'rinish (Saytda ko'rinishi):
            </span>
            <span className="text-[11px] text-slate-400">
              {topImageUrl && topText
                ? "Markazda rasm va matn yonma-yon chiqadi"
                : topImageUrl
                ? "Markazda faqat rasm chiqadi"
                : "Markazda yangilik matni chiqadi"}
            </span>
          </div>

          <div className="rounded-xl overflow-hidden shadow-xs border border-slate-200 dark:border-white/10">
            <TopAnnouncementBar
              isPreview
              overrideActive={topActive}
              overrideValue={topText || (topImageUrl ? "" : "YANGILIK MATNI KIRITILMAGAN")}
              overrideImageUrl={topImageUrl}
              overrideLinkUrl={topLinkUrl}
            />
          </div>
        </div>

        {/* Action Save Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <p className="text-[11px] text-slate-400">
            * Saqlangach, yangilik banneri va havolasi saytning yuqori qismida avtomatik yangilanadi.
          </p>
          <button
            type="button"
            disabled={saveTopAnnouncementMutation.isPending}
            onClick={() => saveTopAnnouncementMutation.mutate()}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#E8192C] hover:bg-[#D41524] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#E8192C]/20 disabled:opacity-50 cursor-pointer"
          >
            {saveTopAnnouncementMutation.isPending ? (
              <RefreshIcon className="w-4 h-4 animate-spin" />
            ) : (
              <DisketteIcon className="w-4 h-4" />
            )}
            <span>
              {saveTopAnnouncementMutation.isPending
                ? "Saqlanmoqda..."
                : "Sozlamalarni saqlash"}
            </span>
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-lg p-0.5 w-fit">
        {[
          { key: "all" as const, label: "Barchasi" },
          { key: "active" as const, label: "Faol" },
          { key: "inactive" as const, label: "Nofaol" },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
              filter === tab.key
                ? "bg-slate-900 dark:bg-white/10 text-white"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 dark:border-white/[0.06]">
              <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sarlavha</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tur</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kontent</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Holat</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sana</th>
              <th className="text-right px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Amallar</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-12"><RefreshIcon className="w-5 h-5 animate-spin text-slate-400 mx-auto" /></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12"><p className="text-sm text-slate-400">E'lonlar yo'q</p></td></tr>
            ) : filtered.map((a: any) => {
              const tc = TYPE_CONFIG[a.type] || TYPE_CONFIG.info;
              const Icon = tc.icon;
              return (
                <tr key={a.id} className="border-b border-slate-50 dark:border-white/[0.03] hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${tc.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[12px] font-semibold text-slate-900 dark:text-white truncate max-w-[180px]">{a.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${tc.color}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${tc.dot}`} />
                      {tc.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[11px] text-slate-500 truncate max-w-[200px]">{a.content}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive.mutate({ id: a.id, is_active: !a.is_active })}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase transition-colors ${
                        a.is_active
                          ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                          : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                      }`}
                    >
                      {a.is_active ? <EyeIcon className="w-3 h-3" /> : <EyeClosedIcon className="w-3 h-3" />}
                      {a.is_active ? "Faol" : "Nofaol"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-[11px] text-slate-400">
                    {new Date(a.created_at).toLocaleDateString("uz-UZ")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => { setForm({ title: a.title, content: a.content, type: a.type, is_active: a.is_active }); setEditId(a.id); setShowModal(true); }}
                        className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                      >
                        <Pen2Icon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(a.id)}
                        className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                      >
                        <TrashBinMinimalisticIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#0a0f1a] rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-slate-900 dark:text-white">
                {editId ? "E'lonni tahrirlash" : "Yangi e'lon"}
              </h2>
              <button onClick={closeModal} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5">
                <CloseSquareIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Sarlavha</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full h-10 px-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#E8192C]/20"
                  placeholder="E'lon sarlavhasi"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Kontent</label>
                <textarea
                  value={form.content}
                  onChange={e => setForm({ ...form, content: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-lg text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-[#E8192C]/20"
                  placeholder="E'lon matni..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tur</label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => setForm({ ...form, type: key })}
                      className={`h-9 rounded-lg text-[10px] font-bold transition-colors flex items-center justify-center gap-1 ${
                        form.type === key
                          ? "bg-slate-900 dark:bg-white/10 text-white"
                          : "bg-slate-100 dark:bg-white/[0.03] text-slate-400 hover:bg-slate-200"
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${form.type === key ? "bg-white" : cfg.dot}`} />
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Holat:</label>
                <button
                  onClick={() => setForm({ ...form, is_active: !form.is_active })}
                  className={`w-10 h-5 rounded-full transition-colors relative ${
                    form.is_active ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"
                  }`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${
                    form.is_active ? "translate-x-5" : "translate-x-0.5"
                  }`} />
                </button>
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                  {form.is_active ? "Faol" : "Nofaol"}
                </span>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
              <button onClick={closeModal} className="px-4 py-2 rounded-lg text-[12px] font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5">
                Bekor qilish
              </button>
              <button
                disabled={upsertMutation.isPending || !form.title || !form.content}
                onClick={() => upsertMutation.mutate(form)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E8192C] text-white text-[12px] font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {upsertMutation.isPending ? <RefreshIcon className="w-3.5 h-3.5 animate-spin" /> : <SendSquareIcon className="w-3.5 h-3.5" />}
                {editId ? "Yangilash" : "Yaratish"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#0a0f1a] rounded-2xl w-full max-w-sm p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mx-auto">
              <TrashBinMinimalisticIcon className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-[14px] font-bold text-slate-900 dark:text-white">E'lonni o'chirish</h3>
            <p className="text-[11px] text-slate-400">Bu amal qaytarib bo'lmaydi</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-lg bg-slate-100 dark:bg-white/[0.06] text-[12px] font-medium text-slate-600 dark:text-slate-400">
                Bekor
              </button>
              <button
                onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2.5 rounded-lg bg-red-500 text-white text-[12px] font-bold hover:bg-red-600 transition-colors flex items-center justify-center gap-1.5"
              >
                {deleteMutation.isPending ? <RefreshIcon className="w-3.5 h-3.5 animate-spin" /> : "Ha, o'chirish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnnouncements;
