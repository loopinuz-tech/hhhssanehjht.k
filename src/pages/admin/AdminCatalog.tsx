import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AddCircleIcon as PlusCircleIcon } from "@solar-icons/react/bold-duotone/add-circle";
import { TrashBinMinimalisticIcon } from "@solar-icons/react/bold-duotone/trash-bin-minimalistic";
import { Pen2Icon } from "@solar-icons/react/bold-duotone/pen-2";
import { CloseSquareIcon } from "@solar-icons/react/bold-duotone/close-square";
import { AltArrowUpIcon } from "@solar-icons/react/bold-duotone/alt-arrow-up";
import { AltArrowDownIcon } from "@solar-icons/react/bold-duotone/alt-arrow-down";
import { FolderOpenIcon } from "@solar-icons/react/bold-duotone/folder-open";
import { SquareAcademicCapIcon } from "@solar-icons/react/bold-duotone/square-academic-cap";
import { RefreshIcon } from "@solar-icons/react/bold-duotone/refresh";
import { BookBookmarkIcon } from "@solar-icons/react/bold-duotone/book-bookmark";
import { CalculatorMinimalisticIcon } from "@solar-icons/react/bold-duotone/calculator-minimalistic";
import { DiplomaIcon } from "@solar-icons/react/bold-duotone/diploma";
import { StarsIcon } from "@solar-icons/react/bold-duotone/stars";
import { UserIcon } from "@solar-icons/react/bold-duotone/user";
import { Grid3X3, Eye, EyeOff, LayoutGrid, Check, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

interface Subject {
  id: string;
  name: string;
  color_from: string;
  color_to: string;
  icon_name: string;
  order_number: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface TestFolder {
  id: string;
  name: string;
  description: string;
  category: string;
  subject: string;
  price: number;
  duration_minutes: number;
  questions_count: number;
  is_active: boolean;
  educoin_price: number;
  payment_type: string;
  created_at: string;
}

const COLOR_PRESETS = [
  "#3B82F6", "#10B981", "#8B5CF6", "#F59E0B",
  "#EF4444", "#EC4899", "#06B6D4", "#F97316",
  "#6366F1", "#14B8A6", "#84CC16", "#E8192C",
];

const CATEGORY_ITEMS = [
  { id: "mavzulashtirilgan", label: "Mavzulashtirilgan", description: "Fanlar bo'yicha mavzulashtirilgan test papkalari bo'limi", icon: BookBookmarkIcon, color: "#0891b2" },
  { id: "mock-tests", label: "Mock testlar", description: "Vaqtli va balli rasmiy mock imtihonlar bo'limi", icon: CalculatorMinimalisticIcon, color: "#ea580c" },
  { id: "attestatsiya", label: "Attestatsiya", description: "O'qituvchilar attestatsiyasi va toifa oshirish testlari bo'limi", icon: DiplomaIcon, color: "#7c3aed" },
  { id: "pedagogik", label: "Pedagogik", description: "Pedagogik mahorat va psixologik testlar bo'limi", icon: StarsIcon, color: "#10b981" },
  { id: "user-tests", label: "O'qituvchi testlari", description: "Foydalanuvchilar va o'qituvchilar tomonidan yaratilgan testlar bo'limi", icon: UserIcon, color: "#f59e0b" },
];

const emptySubject = {
  name: "",
  color_from: "#3B82F6",
  color_to: "#8B5CF6",
  icon_name: "",
  order_number: 0,
  is_active: true,
};

export default function AdminCatalog() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"subjects" | "folders" | "categories">("subjects");

  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [subjectForm, setSubjectForm] = useState(emptySubject);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data: subjects = [], isLoading: subjectsLoading } = useQuery({
    queryKey: ["admin-subjects"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("subjects")
        .select("id, name, color_from, color_to, icon_name, order_number, is_active, created_at, updated_at")
        .order("order_number", { ascending: true });
      if (error) throw error;
      return (data || []) as Subject[];
    },
  });

  const { data: folders = [], isLoading: foldersLoading } = useQuery({
    queryKey: ["admin-test-folders"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("test_folders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as TestFolder[];
    },
  });

  const { data: categoryVisibility = {}, isLoading: visibilityLoading } = useQuery({
    queryKey: ["admin-category-visibility"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("admin_settings")
        .select("value")
        .eq("key", "catalog_category_visibility")
        .maybeSingle();
      if (error || !data?.value) {
        return {
          "mavzulashtirilgan": true,
          "mock-tests": true,
          "attestatsiya": true,
          "pedagogik": true,
          "user-tests": true,
        };
      }
      try {
        return JSON.parse(data.value) as Record<string, boolean>;
      } catch {
        return {
          "mavzulashtirilgan": true,
          "mock-tests": true,
          "attestatsiya": true,
          "pedagogik": true,
          "user-tests": true,
        };
      }
    },
  });

  const toggleCategoryVisibilityMutation = useMutation({
    mutationFn: async ({ categoryId, isVisible }: { categoryId: string; isVisible: boolean }) => {
      const currentMap = {
        "mavzulashtirilgan": true,
        "mock-tests": true,
        "attestatsiya": true,
        "pedagogik": true,
        "user-tests": true,
        ...categoryVisibility,
      };
      currentMap[categoryId] = isVisible;
      const { error } = await (supabase as any)
        .from("admin_settings")
        .upsert({ key: "catalog_category_visibility", value: JSON.stringify(currentMap) }, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-category-visibility"] });
      queryClient.invalidateQueries({ queryKey: ["catalog-category-visibility"] });
      toast({ title: "Saqlandi", description: "Katalog bo'limi ko'rinishi yangilandi" });
    },
    onError: (e: any) => {
      toast({ title: "Xatolik", description: e.message, variant: "destructive" });
    },
  });

  const subjectSaveMutation = useMutation({
    mutationFn: async (form: typeof emptySubject) => {
      if (editingSubjectId) {
        const { error } = await (supabase as any)
          .from("subjects")
          .update(form)
          .eq("id", editingSubjectId);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("subjects")
          .insert(form);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-subjects"] });
      toast({ title: editingSubjectId ? "Yangilandi" : "Qo'shildi" });
      closeSubjectModal();
    },
    onError: (e: any) => {
      toast({ title: "Xatolik", description: e.message, variant: "destructive" });
    },
  });

  const subjectDeleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("subjects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-subjects"] });
      toast({ title: "O'chirildi" });
      setDeleteConfirmId(null);
    },
  });

  const subjectToggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await (supabase as any)
        .from("subjects")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-subjects"] }),
  });

  const subjectReorder = useMutation({
    mutationFn: async ({ id, newOrder }: { id: string; newOrder: number }) => {
      const { error } = await (supabase as any)
        .from("subjects")
        .update({ order_number: newOrder })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-subjects"] }),
  });

  const folderToggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await (supabase as any)
        .from("test_folders")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-test-folders"] }),
  });

  const folderDeleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("test_folders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-test-folders"] });
      toast({ title: "O'chirildi" });
      setDeleteConfirmId(null);
    },
  });

  const closeSubjectModal = () => {
    setShowSubjectModal(false);
    setEditingSubjectId(null);
    setSubjectForm(emptySubject);
  };

  const openEditSubject = (s: Subject) => {
    setEditingSubjectId(s.id);
    setSubjectForm({
      name: s.name,
      color_from: s.color_from || "#3B82F6",
      color_to: s.color_to || "#8B5CF6",
      icon_name: s.icon_name || "",
      order_number: s.order_number,
      is_active: s.is_active,
    });
    setShowSubjectModal(true);
  };

  const handleMoveSubject = (index: number, direction: "up" | "down") => {
    const sorted = [...subjects].sort((a, b) => a.order_number - b.order_number);
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= sorted.length) return;
    const current = sorted[index];
    const swap = sorted[target];
    subjectReorder.mutate({ id: current.id, newOrder: swap.order_number });
    subjectReorder.mutate({ id: swap.id, newOrder: current.order_number });
  };

  const sortedSubjects = [...subjects].sort((a, b) => a.order_number - b.order_number);

  const folderCountBySubject = (subjectName: string) =>
    folders.filter((f) => f.subject === subjectName).length;

  return (
    <div className="w-full min-h-screen pb-20">
      <AdminPageHeader
        icon={Grid3X3}
        label="Katalog boshqaruvi"
        title="Katalog"
        description="Fanlar va test papkalarini boshqaring"
        actions={
          <button
            onClick={() => {
              setEditingSubjectId(null);
              setSubjectForm(emptySubject);
              setShowSubjectModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E8192C] text-white text-[13px] font-medium hover:opacity-90 transition-opacity"
          >
            <PlusCircleIcon className="w-4 h-4" /> Qo'shish
          </button>
        }
      />

      <div className="space-y-5">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#0D1117] rounded-xl p-0.5 w-fit">
          <button
            onClick={() => setActiveTab("subjects")}
            className={`flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-[13px] font-medium transition-colors ${
              activeTab === "subjects"
                ? "bg-white dark:bg-[#080C14] text-[#E8192C] border border-slate-200 dark:border-white/[0.06]"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <SquareAcademicCapIcon className="w-3.5 h-3.5" />
            Fanlar
            <span className="text-[11px] text-slate-400">({subjects.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("folders")}
            className={`flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-[13px] font-medium transition-colors ${
              activeTab === "folders"
                ? "bg-white dark:bg-[#080C14] text-[#E8192C] border border-slate-200 dark:border-white/[0.06]"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <FolderOpenIcon className="w-3.5 h-3.5" />
            Test papkalar
            <span className="text-[11px] text-slate-400">({folders.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("categories")}
            className={`flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-[13px] font-medium transition-colors ${
              activeTab === "categories"
                ? "bg-white dark:bg-[#080C14] text-[#E8192C] border border-slate-200 dark:border-white/[0.06]"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Bo'limlar (Tugmalar)
          </button>
        </div>

        {/* Subjects Tab */}
        {activeTab === "subjects" && (
          <div>
            {subjectsLoading ? (
              <div className="flex items-center justify-center py-20">
                <RefreshIcon className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : sortedSubjects.length === 0 ? (
              <div className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl py-20 text-center">
                <SquareAcademicCapIcon className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-[13px] text-slate-500">Fanlar mavjud emas</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {sortedSubjects.map((subject, idx) => (
                  <div
                    key={subject.id}
                    className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl p-4 group hover:border-slate-300 dark:hover:border-white/[0.1] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: `linear-gradient(135deg, ${subject.color_from || '#3B82F6'}, ${subject.color_to || '#8B5CF6'})` }}
                        >
                          <div className="w-3 h-3 rounded-full bg-white/80" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-slate-900 dark:text-white truncate">
                            {subject.name}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => subjectToggleActive.mutate({ id: subject.id, is_active: !subject.is_active })}
                        className={`shrink-0 w-9 h-5 rounded-full transition-colors relative ${
                          subject.is_active ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                            subject.is_active ? "translate-x-4" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 mb-3">
                        <FolderOpenIcon className="w-3 h-3 text-slate-400" />
                      <span className="text-[11px] text-slate-500">
                        {folderCountBySubject(subject.name)} ta test papka
                      </span>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleMoveSubject(idx, "up")}
                        disabled={idx === 0}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.04] disabled:opacity-30 transition-colors"
                      >
                        <AltArrowUpIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveSubject(idx, "down")}
                        disabled={idx === sortedSubjects.length - 1}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.04] disabled:opacity-30 transition-colors"
                      >
                        <AltArrowDownIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openEditSubject(subject)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
                      >
                        <Pen2Icon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(subject.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors ml-auto"
                      >
                              <TrashBinMinimalisticIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Test Folders Tab */}
        {activeTab === "folders" && (
          <div className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/[0.06]">
                    <th className="px-5 py-3 text-left text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                      Nomi
                    </th>
                    <th className="px-5 py-3 text-left text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                      Kategoriya
                    </th>
                    <th className="px-5 py-3 text-left text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                      Fan
                    </th>
                    <th className="px-5 py-3 text-left text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                      Narx
                    </th>
                    <th className="px-5 py-3 text-left text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                      Savollar
                    </th>
                    <th className="px-5 py-3 text-center text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                      Faol
                    </th>
                    <th className="px-5 py-3 text-right text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                      Amallar
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                  {foldersLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={7} className="px-5 py-5">
                          <div className="flex items-center gap-3 animate-pulse">
                            <div className="h-3 w-32 bg-slate-100 dark:bg-white/[0.04] rounded" />
                            <div className="h-3 w-20 bg-slate-100 dark:bg-white/[0.04] rounded" />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : folders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <FolderOpenIcon className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                          <p className="text-[13px] font-medium text-slate-500">Test papkalar mavjud emas</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    folders.map((folder) => (
                      <tr key={folder.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="text-[13px] font-semibold text-slate-900 dark:text-white truncate max-w-[200px]">
                            {folder.name}
                          </p>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-[11px] font-medium text-slate-500 px-2 py-0.5 bg-slate-100 dark:bg-white/[0.04] rounded-md">
                            {folder.category || "—"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-[13px] text-slate-600 dark:text-slate-400">{folder.subject || "—"}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-[13px] font-semibold text-slate-900 dark:text-white">
                            {folder.price > 0 ? `${folder.price.toLocaleString()} so'm` : "Bepul"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-[13px] text-slate-600 dark:text-slate-400">{folder.questions_count}</span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <button
                            onClick={() =>
                              folderToggleActive.mutate({ id: folder.id, is_active: !folder.is_active })
                            }
                            className={`mx-auto w-9 h-5 rounded-full transition-colors relative block ${
                              folder.is_active ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
                            }`}
                          >
                            <div
                              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                                folder.is_active ? "translate-x-4" : "translate-x-0.5"
                              }`}
                            />
                          </button>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setDeleteConfirmId(`folder-${folder.id}`)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                            >
                        <TrashBinMinimalisticIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === "categories" && (
          <div className="space-y-5">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-[#0D1117] dark:via-[#161B22] dark:to-[#0D1117] text-white rounded-2xl p-5 shadow-sm border border-slate-800 dark:border-white/[0.08] relative overflow-hidden">
              <div className="absolute right-0 top-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
                      <LayoutGrid className="w-4 h-4" />
                    </span>
                    <h3 className="text-[15px] font-extrabold text-white tracking-tight">
                      Katalog Bo'lim Tugmalari Ko'rinishi
                    </h3>
                  </div>
                  <p className="text-[12.5px] text-slate-300 max-w-xl leading-relaxed">
                    Foydalanuvchilar katalogida (Testlar bo'limida) yuqorida ko'rinadigan tugmalarni boshqaring. Keraksiz bo'limlarni yashirish yoki ko'rsatish mumkin.
                  </p>
                </div>

                {/* Summary Stats */}
                <div className="flex items-center gap-2 bg-white/10 dark:bg-black/30 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10 shrink-0">
                  <div className="text-left sm:text-right">
                    <p className="text-[10px] text-slate-300 uppercase tracking-wider font-bold">Faol bo'limlar</p>
                    <p className="text-[13px] font-black text-emerald-400">
                      {CATEGORY_ITEMS.filter(c => categoryVisibility[c.id] !== false).length} / {CATEGORY_ITEMS.length} ta ko'rinmoqda
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {visibilityLoading ? (
              <div className="flex items-center justify-center py-20">
                <RefreshIcon className="w-7 h-7 animate-spin text-[#E8192C]" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {CATEGORY_ITEMS.map((cat) => {
                  const Icon = cat.icon;
                  const isVisible = categoryVisibility[cat.id] !== false;
                  return (
                    <div
                      key={cat.id}
                      className={`group bg-white dark:bg-[#080C14] border rounded-2xl p-5 transition-all duration-200 relative overflow-hidden flex flex-col justify-between ${
                        isVisible
                          ? "border-slate-200 dark:border-white/[0.08] shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-white/20"
                          : "border-slate-200/60 dark:border-white/[0.04] bg-slate-50/50 dark:bg-white/[0.01] opacity-75"
                      }`}
                    >
                      {/* Top Accent Line */}
                      <div
                        className="absolute top-0 left-0 right-0 h-1 transition-opacity"
                        style={{ backgroundColor: isVisible ? cat.color : '#cbd5e1' }}
                      />

                      <div>
                        <div className="flex items-start justify-between gap-3 mb-3.5">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm transition-transform group-hover:scale-105"
                              style={{ backgroundColor: isVisible ? cat.color : '#94a3b8' }}
                            >
                              <Icon className="w-5.5 h-5.5" />
                            </div>
                            <div>
                              <h4 className="text-[14px] font-extrabold text-slate-900 dark:text-white leading-snug">
                                {cat.label}
                              </h4>
                              <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                                {cat.id}
                              </span>
                            </div>
                          </div>

                          {/* Pixel-Perfect Toggle Switch */}
                          <button
                            onClick={() =>
                              toggleCategoryVisibilityMutation.mutate({
                                categoryId: cat.id,
                                isVisible: !isVisible,
                              })
                            }
                            disabled={toggleCategoryVisibilityMutation.isPending}
                            className={`shrink-0 w-12 h-6.5 rounded-full transition-colors duration-200 relative p-0.5 focus:outline-none focus:ring-2 focus:ring-rose-500/30 ${
                              isVisible
                                ? "bg-emerald-500 dark:bg-emerald-600"
                                : "bg-slate-300 dark:bg-slate-700"
                            }`}
                            aria-label={isVisible ? "Yashirish" : "Ko'rsatish"}
                          >
                            <div
                              className="w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 flex items-center justify-center"
                              style={{
                                transform: isVisible ? "translateX(22px)" : "translateX(0px)",
                              }}
                            >
                              {isVisible ? (
                                <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                              ) : (
                                <EyeOff className="w-3 h-3 text-slate-400" />
                              )}
                            </div>
                          </button>
                        </div>

                        <p className="text-[12px] text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                          {cat.description}
                        </p>
                      </div>

                      {/* Card Footer Status */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/[0.05]">
                        <span className="text-[11px] font-medium text-slate-400">
                          Katalogda ko'rinishi:
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isVisible ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                            }`}
                          />
                          <span
                            className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-lg transition-colors ${
                              isVisible
                                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"
                                : "bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10"
                            }`}
                          >
                            {isVisible ? "Ko'rinadigan" : "Yashirilgan"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Subject Create/Edit Modal */}
      <AnimatePresence>
        {showSubjectModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40"
              onClick={closeSubjectModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div
                className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-white/[0.06]">
                  <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white">
                    {editingSubjectId ? "Fanni tahrirlash" : "Yangi fan"}
                  </h3>
                  <button
                    onClick={closeSubjectModal}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                  >
                    <CloseSquareIcon className="w-4 h-4 text-slate-400" />
                  </button>
                </div>

                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                      Nomi
                    </label>
                    <input
                      type="text"
                      value={subjectForm.name}
                      onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                      placeholder="Matematika"
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-[13px] text-slate-900 dark:text-white focus:border-[#E8192C] focus:outline-none transition-colors placeholder:text-slate-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                        Ikonka (lucide nomi)
                      </label>
                      <input
                        type="text"
                        value={subjectForm.icon_name}
                        onChange={(e) => setSubjectForm({ ...subjectForm, icon_name: e.target.value })}
                        placeholder="Calculator"
                        className="w-full h-10 px-3 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-[13px] font-mono text-slate-900 dark:text-white focus:border-[#E8192C] focus:outline-none transition-colors placeholder:text-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                        Tartib raqami
                      </label>
                      <input
                        type="number"
                        value={subjectForm.order_number}
                        onChange={(e) =>
                          setSubjectForm({ ...subjectForm, order_number: parseInt(e.target.value) || 0 })
                        }
                        className="w-full h-10 px-3 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-[13px] text-slate-900 dark:text-white focus:border-[#E8192C] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                      Rang boshlanishi
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {COLOR_PRESETS.map((c) => (
                        <button
                          key={`from-${c}`}
                          onClick={() => setSubjectForm({ ...subjectForm, color_from: c })}
                          className={`w-7 h-7 rounded-lg transition-all ${
                            subjectForm.color_from === c
                              ? "ring-2 ring-offset-2 ring-offset-white dark:ring-offset-[#080C14]"
                              : "hover:scale-110"
                          }`}
                          style={{ backgroundColor: c, ['--tw-ring-color' as any]: c }}
                        />
                      ))}
                      <input
                        type="color"
                        value={subjectForm.color_from}
                        onChange={(e) => setSubjectForm({ ...subjectForm, color_from: e.target.value })}
                        className="w-7 h-7 rounded-lg cursor-pointer border-0 p-0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                      Rang tugashi
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {COLOR_PRESETS.map((c) => (
                        <button
                          key={`to-${c}`}
                          onClick={() => setSubjectForm({ ...subjectForm, color_to: c })}
                          className={`w-7 h-7 rounded-lg transition-all ${
                            subjectForm.color_to === c
                              ? "ring-2 ring-offset-2 ring-offset-white dark:ring-offset-[#080C14]"
                              : "hover:scale-110"
                          }`}
                          style={{ backgroundColor: c, ['--tw-ring-color' as any]: c }}
                        />
                      ))}
                      <input
                        type="color"
                        value={subjectForm.color_to}
                        onChange={(e) => setSubjectForm({ ...subjectForm, color_to: e.target.value })}
                        className="w-7 h-7 rounded-lg cursor-pointer border-0 p-0"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-[13px] text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={subjectForm.is_active}
                        onChange={(e) => setSubjectForm({ ...subjectForm, is_active: e.target.checked })}
                        className="rounded border-slate-300"
                      />
                      Faol
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-200 dark:border-white/[0.06]">
                  <button
                    onClick={closeSubjectModal}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-400 text-[13px] font-medium hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors"
                  >
                    Bekor qilish
                  </button>
                  <button
                    onClick={() => subjectSaveMutation.mutate(subjectForm)}
                    disabled={subjectSaveMutation.isPending || !subjectForm.name.trim()}
                    className="px-5 py-2 rounded-xl bg-[#E8192C] text-white text-[13px] font-medium hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-1.5"
                  >
                    {subjectSaveMutation.isPending && <RefreshIcon className="w-3.5 h-3.5 animate-spin" />}
                    {editingSubjectId ? "Saqlash" : "Qo'shish"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteConfirmId && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40"
              onClick={() => setDeleteConfirmId(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div
                className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-6 max-w-sm w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white mb-2">
                  O'chirishni tasdiqlaysizmi?
                </h3>
                <p className="text-[13px] text-slate-500 mb-6">
                  Bu amal qaytarib bo'lmaydi.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400 text-[13px] font-medium hover:bg-slate-200 dark:hover:bg-white/[0.1] transition-colors"
                  >
                    Bekor qilish
                  </button>
                  <button
                    onClick={() => {
                      if (deleteConfirmId?.startsWith("folder-")) {
                        folderDeleteMutation.mutate(deleteConfirmId.replace("folder-", ""));
                      } else {
                        subjectDeleteMutation.mutate(deleteConfirmId);
                      }
                    }}
                    disabled={subjectDeleteMutation.isPending || folderDeleteMutation.isPending}
                    className="flex-1 py-2.5 rounded-xl bg-[#E8192C] text-white text-[13px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {(subjectDeleteMutation.isPending || folderDeleteMutation.isPending) ? "..." : "O'chirish"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
