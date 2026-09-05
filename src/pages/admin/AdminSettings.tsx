import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { SettingsIcon } from "@solar-icons/react/bold-duotone/settings";
import { DisketteIcon } from "@solar-icons/react/bold-duotone/diskette";
import { AddCircleIcon as PlusCircleIcon } from "@solar-icons/react/bold-duotone/add-circle";
import { TrashBinMinimalisticIcon } from "@solar-icons/react/bold-duotone/trash-bin-minimalistic";
import { CloseSquareIcon } from "@solar-icons/react/bold-duotone/close-square";
import { RefreshIcon } from "@solar-icons/react/bold-duotone/refresh";
import { MagnifierIcon } from "@solar-icons/react/bold-duotone/magnifier";
import { ToggleLeft, ToggleRight } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

const AdminSettings = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"system" | "features">("system");

  const [newSettingKey, setNewSettingKey] = useState("");
  const [newSettingValue, setNewSettingValue] = useState("");
  const [showNewSettingModal, setShowNewSettingModal] = useState(false);

  const [newFeatureName, setNewFeatureName] = useState("");
  const [newFeatureDescription, setNewFeatureDescription] = useState("");
  const [showNewFeatureModal, setShowNewFeatureModal] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  // ─── System Settings ───
  const {
    data: settings,
    isLoading: settingsLoading,
  } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("admin_settings")
        .select("*")
        .order("key");
      if (error) {
        console.error("Settings error:", error);
        return [];
      }
      return data || [];
    },
  });

  const [editingValues, setEditingValues] = useState<Record<string, string>>({});

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await (supabase as any)
        .from("admin_settings")
        .upsert({ key, value }, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
      toast({ title: "Saqlandi", description: "Sozlama yangilandi" });
    },
    onError: (e: any) =>
      toast({ title: "Xatolik", description: e.message, variant: "destructive" }),
  });

  const createSettingMutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any)
        .from("admin_settings")
        .insert([{ key: newSettingKey, value: newSettingValue }]);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
      setNewSettingKey("");
      setNewSettingValue("");
      setShowNewSettingModal(false);
      toast({ title: "Qo'shildi", description: "Yangi sozlama yaratildi" });
    },
    onError: (e: any) =>
      toast({ title: "Xatolik", description: e.message, variant: "destructive" }),
  });

  const deleteSettingMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("admin_settings")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
      toast({ title: "O'chirildi" });
    },
    onError: (e: any) =>
      toast({ title: "Xatolik", description: e.message, variant: "destructive" }),
  });

  // ─── Feature Flags ───
  const {
    data: features,
    isLoading: featuresLoading,
  } = useQuery({
    queryKey: ["feature-flags"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("feature_flags")
        .select("*")
        .order("feature_name");
      if (error) {
        console.error("Feature flags error:", error);
        return [];
      }
      return data || [];
    },
  });

  const toggleFeatureMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await (supabase as any)
        .from("feature_flags")
        .update({ is_active: !is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feature-flags"] });
      toast({ title: "Yangilandi" });
    },
    onError: (e: any) =>
      toast({ title: "Xatolik", description: e.message, variant: "destructive" }),
  });

  const createFeatureMutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any)
        .from("feature_flags")
        .insert([
          {
            feature_name: newFeatureName,
            description: newFeatureDescription,
            is_active: true,
            is_new: true,
          },
        ]);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feature-flags"] });
      setNewFeatureName("");
      setNewFeatureDescription("");
      setShowNewFeatureModal(false);
      toast({ title: "Qo'shildi", description: "Yangi feature flag yaratildi" });
    },
    onError: (e: any) =>
      toast({ title: "Xatolik", description: e.message, variant: "destructive" }),
  });

  const deleteFeatureMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("feature_flags")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feature-flags"] });
      toast({ title: "O'chirildi" });
    },
    onError: (e: any) =>
      toast({ title: "Xatolik", description: e.message, variant: "destructive" }),
  });

  const isLoading = settingsLoading || featuresLoading;
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <RefreshIcon className="w-6 h-6 text-emerald-500 animate-spin" />
        <p className="text-xs text-slate-400 font-medium">Yuklanmoqda...</p>
      </div>
    );
  }

  const filteredSettings = (settings || []).filter(
    (s: any) =>
      s.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.value || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFeatures = (features || []).filter(
    (f: any) =>
      f.feature_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.description || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs = [
    { key: "system" as const, label: "Tizim sozlamalari" },
    { key: "features" as const, label: "Xususiyatlar" },
  ];

  const commonSettings = [
    "site_name",
    "maintenance_mode",
    "max_upload_size",
    "default_currency",
    "support_email",
    "site_url",
  ];

  return (
    <div className="max-w-5xl space-y-6 pb-20 font-jakarta">
      <AdminPageHeader
        icon={SettingsIcon}
        label="Tizim Boshqaruvi"
        title="Sozlamalar"
        description="Platforma sozlamalari va xususiyatlarni boshqarish"
      />

      {/* Tabs */}
      <div className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl p-1.5 flex gap-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setActiveTab(t.key);
              setSearchQuery("");
            }}
            className={`flex-1 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === t.key
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifierIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Qidirish..."
          className="w-full h-11 pl-11 pr-4 text-sm font-medium bg-white dark:bg-[#080C14] text-slate-900 dark:text-white border border-slate-200 dark:border-white/[0.06] rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
        />
      </div>

      {/* ═══ System Settings Tab ═══ */}
      {activeTab === "system" && (
        <div className="space-y-3">
          {filteredSettings.length === 0 && (
            <div className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl p-10 text-center">
              <p className="text-xs text-slate-400">Hech qanday sozlama topilmadi</p>
            </div>
          )}

          {filteredSettings.map((s: any) => {
            const isCommon = commonSettings.includes(s.key);
            const val = editingValues[s.key] !== undefined ? editingValues[s.key] : s.value || "";
            const isDirty = val !== (s.value || "");
            return (
              <div
                key={s.id}
                className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {s.key}
                    </span>
                    {isCommon && (
                      <span className="px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-md border border-emerald-100 dark:border-emerald-500/20">
                        umumiy
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={val}
                    onChange={(e) =>
                      setEditingValues((prev) => ({ ...prev, [s.key]: e.target.value }))
                    }
                    className="w-full h-10 px-3 text-sm font-medium bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-white border border-slate-100 dark:border-white/[0.06] rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                  />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    disabled={!isDirty || updateSettingMutation.isPending}
                    onClick={() =>
                      updateSettingMutation.mutate({ key: s.key, value: val })
                    }
                    className="h-9 px-3 bg-emerald-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-500 transition-all flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <DisketteIcon className="w-3 h-3" />
                    Saqlash
                  </button>
                  <button
                    onClick={() => deleteSettingMutation.mutate(s.id)}
                    className="h-9 w-9 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <TrashBinMinimalisticIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Create New Setting */}
          <button
            onClick={() => setShowNewSettingModal(true)}
            className="w-full h-12 border-2 border-dashed border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-bold text-slate-400 uppercase tracking-widest hover:border-emerald-400 hover:text-emerald-500 transition-all flex items-center justify-center gap-2"
          >
            <PlusCircleIcon className="w-4 h-4" />
            Yangi Sozlama Qo'shish
          </button>
        </div>
      )}

      {/* ═══ Feature Flags Tab ═══ */}
      {activeTab === "features" && (
        <div className="space-y-4">
          {filteredFeatures.length === 0 && (
            <div className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl p-10 text-center">
              <p className="text-xs text-slate-400">Hech qanday feature flag topilmadi</p>
            </div>
          )}

          {filteredFeatures.length > 0 && (
            <div className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-slate-100 dark:border-white/[0.04]">
                <div className="col-span-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Nomi
                </div>
                <div className="col-span-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Tavsif
                </div>
                <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                  Holat
                </div>
                <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                  Yangimi
                </div>
                <div className="col-span-1 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                  Amallar
                </div>
              </div>

              {/* Table Rows */}
              {filteredFeatures.map((f: any) => (
                <div
                  key={f.id}
                  className="grid grid-cols-12 gap-4 px-5 py-4 border-b border-slate-50 dark:border-white/[0.02] items-center hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors"
                >
                  <div className="col-span-3">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {f.feature_name}
                    </span>
                  </div>
                  <div className="col-span-4">
                    <span className="text-xs text-slate-500 line-clamp-1">
                      {f.description || "—"}
                    </span>
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <button
                      onClick={() =>
                        toggleFeatureMutation.mutate({ id: f.id, is_active: f.is_active })
                      }
                      className="flex items-center gap-1.5"
                    >
                      {f.is_active ? (
                        <>
                          <ToggleRight className="w-6 h-6 text-emerald-500" />
                          <span className="text-[10px] font-bold text-emerald-600 uppercase">
                            Faol
                          </span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-6 h-6 text-slate-300" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            Nofaol
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="col-span-2 flex justify-center">
                    {f.is_new ? (
                      <span className="px-2 py-1 text-[9px] font-black uppercase tracking-widest bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-md border border-blue-100 dark:border-blue-500/20">
                        Yangi
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-300">—</span>
                    )}
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button
                      onClick={() => deleteFeatureMutation.mutate(f.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
                    >
                    <TrashBinMinimalisticIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => setShowNewFeatureModal(true)}
            className="w-full h-12 border-2 border-dashed border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-bold text-slate-400 uppercase tracking-widest hover:border-emerald-400 hover:text-emerald-500 transition-all flex items-center justify-center gap-2"
          >
            <PlusCircleIcon className="w-4 h-4" />
            Yangi Feature Flag Qo'shish
          </button>
        </div>
      )}

      {/* ═══ Create Setting Modal ═══ */}
      {showNewSettingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl w-full max-w-md p-6 mx-4 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Yangi Sozlama
              </h3>
              <button
                onClick={() => setShowNewSettingModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all"
              >
                <CloseSquareIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                  Kalit (key)
                </label>
                <input
                  type="text"
                  value={newSettingKey}
                  onChange={(e) => setNewSettingKey(e.target.value)}
                  placeholder="site_name"
                  className="w-full h-10 px-3 text-sm font-medium bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06] rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                  Qiymat (value)
                </label>
                <input
                  type="text"
                  value={newSettingValue}
                  onChange={(e) => setNewSettingValue(e.target.value)}
                  placeholder="Contest.uz"
                  className="w-full h-10 px-3 text-sm font-medium bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06] rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowNewSettingModal(false)}
                className="flex-1 h-10 rounded-lg text-xs font-bold text-slate-400 bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.06] transition-all"
              >
                Bekor qilish
              </button>
              <button
                onClick={() => createSettingMutation.mutate()}
                disabled={!newSettingKey || createSettingMutation.isPending}
                className="flex-1 h-10 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {createSettingMutation.isPending ? (
                  <RefreshIcon className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <PlusCircleIcon className="w-3.5 h-3.5" />
                )}
                Yaratish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Create Feature Flag Modal ═══ */}
      {showNewFeatureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl w-full max-w-md p-6 mx-4 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Yangi Feature Flag
              </h3>
              <button
                onClick={() => setShowNewFeatureModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all"
              >
                <CloseSquareIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                  Xususiyat nomi
                </label>
                <input
                  type="text"
                  value={newFeatureName}
                  onChange={(e) => setNewFeatureName(e.target.value)}
                  placeholder="dark_mode"
                  className="w-full h-10 px-3 text-sm font-medium bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06] rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                  Tavsif
                </label>
                <input
                  type="text"
                  value={newFeatureDescription}
                  onChange={(e) => setNewFeatureDescription(e.target.value)}
                  placeholder="Tungi rejimni yoqish/o'chirish"
                  className="w-full h-10 px-3 text-sm font-medium bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06] rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowNewFeatureModal(false)}
                className="flex-1 h-10 rounded-lg text-xs font-bold text-slate-400 bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.06] transition-all"
              >
                Bekor qilish
              </button>
              <button
                onClick={() => createFeatureMutation.mutate()}
                disabled={!newFeatureName || createFeatureMutation.isPending}
                className="flex-1 h-10 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {createFeatureMutation.isPending ? (
                  <RefreshIcon className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <PlusCircleIcon className="w-3.5 h-3.5" />
                )}
                Yaratish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
