import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
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
import { EyeIcon } from "@solar-icons/react/bold-duotone/eye";
import {
  Grid3X3,
  EyeOff,
  LayoutGrid,
  Check,
  Sparkles,
  Search,
  ArrowRight,
  Clock,
  Coins,
  Plus,
  AlertTriangle,
  Layers,
  ArrowUpRight,
  SlidersHorizontal,
  FileSpreadsheet,
} from "lucide-react";
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

interface MockTest {
  id: string;
  title: string;
  description: string;
  subject: string;
  type: string;
  price_cash: number;
  price_educoin: number;
  is_free: boolean;
  duration_minutes: number;
  questions_count: number;
  is_active: boolean;
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

const MOCK_TYPE_LABELS: Record<string, string> = {
  milliy_sertifikat: "Milliy sertifikat",
  full_test: "To'liq test",
  predicted_test: "Bashorat test",
};

const emptySubject = {
  name: "",
  color_from: "#3B82F6",
  color_to: "#8B5CF6",
  icon_name: "",
  order_number: 0,
  is_active: true,
};

const emptyFolder = {
  name: "",
  description: "",
  category: "mavzulashtirilgan",
  subject: "",
  price: 0,
  duration_minutes: 60,
  questions_count: 0,
  is_active: true,
  educoin_price: 0,
  payment_type: "free",
};

export default function AdminCatalog() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"subjects" | "folders" | "categories">("subjects");

  // Subject Modal State
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [subjectForm, setSubjectForm] = useState(emptySubject);

  // Subject Content Manager Modal State
  const [managingSubject, setManagingSubject] = useState<Subject | null>(null);
  const [subjectManagerTab, setSubjectManagerTab] = useState<"all" | "mavzulashtirilgan" | "mock" | "attestatsiya" | "pedagogik">("all");
  const [subjectSearchQuery, setSubjectSearchQuery] = useState("");

  // Test Folder Modal State
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [folderForm, setFolderForm] = useState(emptyFolder);

  // Folder tab filters
  const [folderSearch, setFolderSearch] = useState("");
  const [folderSubjectFilter, setFolderSubjectFilter] = useState("all");
  const [folderCategoryFilter, setFolderCategoryFilter] = useState("all");

  // Delete State
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; type: "subject" | "folder" | "mock" } | null>(null);

  // Fetch Subjects
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

  // Fetch Test Folders
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

  // Fetch Mock Tests
  const { data: mockTests = [], isLoading: mockTestsLoading } = useQuery({
    queryKey: ["admin-catalog-mock-tests"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("mock_tests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as MockTest[];
    },
  });

  // Fetch Category Visibility
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

  // Fetch Hide Empty Tests Setting
  const { data: hideEmptyTests = false } = useQuery({
    queryKey: ["admin-catalog-hide-empty-tests"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("admin_settings")
        .select("value")
        .eq("key", "catalog_hide_empty_tests")
        .maybeSingle();
      if (error || !data?.value) return false;
      return data.value === "true";
    },
  });

  // Toggle Category Visibility Mutation
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

  // Toggle Hide Empty Tests Mutation
  const toggleHideEmptyTestsMutation = useMutation({
    mutationFn: async (newValue: boolean) => {
      const { error } = await (supabase as any)
        .from("admin_settings")
        .upsert(
          { key: "catalog_hide_empty_tests", value: String(newValue) },
          { onConflict: "key" }
        );
      if (error) throw error;
    },
    onSuccess: (_, newValue) => {
      queryClient.invalidateQueries({ queryKey: ["admin-catalog-hide-empty-tests"] });
      queryClient.invalidateQueries({ queryKey: ["catalog-hide-empty-tests"] });
      queryClient.invalidateQueries({ queryKey: ["tests-catalog"] });
      queryClient.invalidateQueries({ queryKey: ["mock-tests-catalog"] });
      toast({
        title: "Sozlama saqlandi",
        description: newValue
          ? "Savolsiz ('Tez orada') testlar katalogdan yashirildi va yuklanmaydi"
          : "Barcha testlar (shu jumladan 'Tez orada') katalogda ko'rinadi",
      });
    },
    onError: (e: any) => {
      toast({ title: "Xatolik", description: e.message, variant: "destructive" });
    },
  });

  // Subject Mutations
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
      toast({ title: editingSubjectId ? "Fan yangilandi" : "Yangi fan qo'shildi" });
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
      toast({ title: "Fan o'chirildi" });
      setDeleteConfirm(null);
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

  // Folder Mutations
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
      toast({ title: "Test papkasi o'chirildi" });
      setDeleteConfirm(null);
    },
  });

  const folderSaveMutation = useMutation({
    mutationFn: async (form: typeof emptyFolder) => {
      const payload = {
        name: form.name.trim(),
        description: form.description?.trim() || "",
        category: form.category,
        subject: form.subject,
        price: Number(form.price) || 0,
        duration_minutes: Number(form.duration_minutes) || 60,
        questions_count: Number(form.questions_count) || 0,
        is_active: Boolean(form.is_active),
        educoin_price: Number(form.educoin_price) || 0,
        payment_type: (Number(form.price) > 0 || Number(form.educoin_price) > 0) ? "paid" : "free",
      };

      if (editingFolderId) {
        const { error } = await (supabase as any)
          .from("test_folders")
          .update(payload)
          .eq("id", editingFolderId);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("test_folders")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-test-folders"] });
      toast({ title: editingFolderId ? "Papka yangilandi" : "Yangi test papka yaratildi" });
      closeFolderModal();
    },
    onError: (e: any) => {
      toast({ title: "Xatolik", description: e.message, variant: "destructive" });
    },
  });

  // Mock Test Mutations
  const mockToggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await (supabase as any)
        .from("mock_tests")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-catalog-mock-tests"] }),
  });

  const mockDeleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("mock_tests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-catalog-mock-tests"] });
      toast({ title: "Mock test o'chirildi" });
      setDeleteConfirm(null);
    },
  });

  // Helper Functions
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

  const closeFolderModal = () => {
    setShowFolderModal(false);
    setEditingFolderId(null);
    setFolderForm(emptyFolder);
  };

  const openCreateFolderForSubject = (subjectName: string, category = "mavzulashtirilgan") => {
    setEditingFolderId(null);
    setFolderForm({
      ...emptyFolder,
      subject: subjectName,
      category,
    });
    setShowFolderModal(true);
  };

  const openEditFolder = (f: TestFolder) => {
    setEditingFolderId(f.id);
    setFolderForm({
      name: f.name,
      description: f.description || "",
      category: f.category || "mavzulashtirilgan",
      subject: f.subject || "",
      price: f.price || 0,
      duration_minutes: f.duration_minutes || 60,
      questions_count: f.questions_count || 0,
      is_active: f.is_active ?? true,
      educoin_price: f.educoin_price || 0,
      payment_type: f.payment_type || "free",
    });
    setShowFolderModal(true);
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

  const sortedSubjects = useMemo(() => {
    return [...subjects].sort((a, b) => a.order_number - b.order_number);
  }, [subjects]);

  const folderCountBySubject = (subjectName: string) =>
    folders.filter((f) => f.subject?.toLowerCase().trim() === subjectName?.toLowerCase().trim()).length;

  const mockCountBySubject = (subjectName: string) =>
    mockTests.filter((m) => m.subject?.toLowerCase().trim() === subjectName?.toLowerCase().trim()).length;

  // Filtered Folders for Folders Tab
  const filteredFolders = useMemo(() => {
    return folders.filter((f) => {
      const matchSearch =
        !folderSearch.trim() ||
        f.name.toLowerCase().includes(folderSearch.toLowerCase()) ||
        f.subject?.toLowerCase().includes(folderSearch.toLowerCase());
      const matchSubject =
        folderSubjectFilter === "all" ||
        f.subject?.toLowerCase().trim() === folderSubjectFilter.toLowerCase().trim();
      const matchCategory =
        folderCategoryFilter === "all" || f.category === folderCategoryFilter;
      return matchSearch && matchSubject && matchCategory;
    });
  }, [folders, folderSearch, folderSubjectFilter, folderCategoryFilter]);

  // Subject Manager: Items for Selected Subject
  const managingSubjectFolders = useMemo(() => {
    if (!managingSubject) return [];
    return folders.filter(
      (f) => f.subject?.toLowerCase().trim() === managingSubject.name?.toLowerCase().trim()
    );
  }, [folders, managingSubject]);

  const managingSubjectMocks = useMemo(() => {
    if (!managingSubject) return [];
    return mockTests.filter(
      (m) => m.subject?.toLowerCase().trim() === managingSubject.name?.toLowerCase().trim()
    );
  }, [mockTests, managingSubject]);

  return (
    <div className="w-full min-h-screen pb-20">
      <AdminPageHeader
        icon={Grid3X3}
        label="Katalog boshqaruvi"
        title="Katalog"
        description="Fanlar, mavzulashtirilgan testlar va mock imtihonlarni boshqaring"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditingSubjectId(null);
                setSubjectForm(emptySubject);
                setShowSubjectModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E8192C] text-white text-[13px] font-semibold hover:opacity-95 shadow-md shadow-red-500/20 active:scale-[0.98] transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" /> Yangi Fan
            </button>
          </div>
        }
      />

      <div className="space-y-5">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#0D121F] rounded-2xl p-1.5 w-fit max-w-full overflow-x-auto border border-slate-200/80 dark:border-white/[0.06]">
          <button
            onClick={() => setActiveTab("subjects")}
            className={`flex items-center gap-2 h-9 px-4 rounded-xl text-[13px] font-semibold whitespace-nowrap transition-all ${
              activeTab === "subjects"
                ? "bg-white dark:bg-[#151C2E] text-[#E8192C] dark:text-rose-400 shadow-sm border border-slate-200/80 dark:border-white/[0.1]"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <SquareAcademicCapIcon className="w-4 h-4" />
            Fanlar & Mocklar
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-200/60 dark:bg-white/[0.08] text-slate-700 dark:text-slate-300">
              {subjects.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("folders")}
            className={`flex items-center gap-2 h-9 px-4 rounded-xl text-[13px] font-semibold whitespace-nowrap transition-all ${
              activeTab === "folders"
                ? "bg-white dark:bg-[#151C2E] text-[#E8192C] dark:text-rose-400 shadow-sm border border-slate-200/80 dark:border-white/[0.1]"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <FolderOpenIcon className="w-4 h-4" />
            Test papkalar
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-200/60 dark:bg-white/[0.08] text-slate-700 dark:text-slate-300">
              {folders.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("categories")}
            className={`flex items-center gap-2 h-9 px-4 rounded-xl text-[13px] font-semibold whitespace-nowrap transition-all ${
              activeTab === "categories"
                ? "bg-white dark:bg-[#151C2E] text-[#E8192C] dark:text-rose-400 shadow-sm border border-slate-200/80 dark:border-white/[0.1]"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Bo'limlar (Tugmalar)
          </button>
        </div>

        {/* ========================================================================= */}
        {/* SUBJECTS TAB */}
        {/* ========================================================================= */}
        {activeTab === "subjects" && (
          <div className="space-y-4">
            {/* Quick Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-[#0D121F] dark:via-[#161F36] dark:to-[#0D121F] border border-slate-800 dark:border-white/[0.08] rounded-2xl p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center gap-3.5 relative z-10">
                <div className="w-11 h-11 rounded-2xl bg-white/10 dark:bg-white/[0.06] backdrop-blur-md border border-white/10 text-rose-400 flex items-center justify-center shrink-0 shadow-inner">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[15px] font-extrabold text-white tracking-tight">
                    Fanlar bo'yicha test va mock boshqaruvi
                  </h4>
                  <p className="text-[12.5px] text-slate-300 max-w-xl leading-relaxed">
                    Istalgan fan kartochkasidagi <strong>"Mavzular & Mocklar"</strong> tugmasini bosing va o'sha fanga tegishli barcha mavzuli testlar yoki mock testlar ro'yxatini ochib, savollarini yozing.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setEditingSubjectId(null);
                  setSubjectForm(emptySubject);
                  setShowSubjectModal(true);
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-rose-500 text-slate-900 dark:text-white text-[13px] font-bold shrink-0 hover:opacity-95 active:scale-98 transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" /> Yangi Fan qo'shish
              </button>
            </div>

            {subjectsLoading ? (
              <div className="flex items-center justify-center py-20">
                <RefreshIcon className="w-7 h-7 animate-spin text-[#E8192C]" />
              </div>
            ) : sortedSubjects.length === 0 ? (
              <div className="bg-white dark:bg-[#0D121F] border border-slate-200 dark:border-white/[0.06] rounded-2xl py-20 text-center">
                <SquareAcademicCapIcon className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-[14px] font-bold text-slate-600 dark:text-slate-300">Hozircha fanlar mavjud emas</p>
                <button
                  onClick={() => setShowSubjectModal(true)}
                  className="mt-3 px-4 py-2 rounded-xl bg-[#E8192C] text-white text-[12.5px] font-bold"
                >
                  Birinchi fanni qo'shish
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedSubjects.map((subject, idx) => {
                  const fCount = folderCountBySubject(subject.name);
                  const mCount = mockCountBySubject(subject.name);
                  const colorFrom = subject.color_from || "#3B82F6";
                  const colorTo = subject.color_to || "#8B5CF6";

                  return (
                    <div
                      key={subject.id}
                      className="group bg-white dark:bg-[#0D121F] border border-slate-200/90 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.18] rounded-2xl p-5 transition-all duration-200 shadow-xs hover:shadow-md relative overflow-hidden flex flex-col justify-between"
                    >
                      {/* Top Accent Gradient Line */}
                      <div
                        className="absolute top-0 left-0 right-0 h-[3.5px] transition-opacity"
                        style={{ background: `linear-gradient(90deg, ${colorFrom}, ${colorTo})` }}
                      />

                      <div>
                        {/* Top Row: Icon, Name, Active Switch */}
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm text-white"
                              style={{
                                background: `linear-gradient(135deg, ${colorFrom}, ${colorTo})`,
                              }}
                            >
                              <SquareAcademicCapIcon className="w-5.5 h-5.5 text-white drop-shadow-xs" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-[15px] font-bold text-slate-900 dark:text-white truncate">
                                {subject.name}
                              </h4>
                              <span className="text-[11px] font-medium text-slate-400 block mt-0.5">
                                #{idx + 1} • {subject.is_active ? "Katalogda faol" : "Nofaol"}
                              </span>
                            </div>
                          </div>

                          {/* Active Switch */}
                          <button
                            onClick={() =>
                              subjectToggleActive.mutate({ id: subject.id, is_active: !subject.is_active })
                            }
                            className={`shrink-0 w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                              subject.is_active ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
                            }`}
                            title={subject.is_active ? "Faol" : "Nofaol"}
                          >
                            <div
                              className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                                subject.is_active ? "translate-x-5" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </div>

                        {/* Counts Badges */}
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 text-[11.5px] font-semibold border border-sky-200/70 dark:border-sky-500/20">
                            <FolderOpenIcon className="w-3.5 h-3.5 text-sky-500" />
                            <span><strong className="font-bold">{fCount}</strong> ta papka</span>
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[11.5px] font-semibold border border-amber-200/70 dark:border-amber-500/20">
                            <CalculatorMinimalisticIcon className="w-3.5 h-3.5 text-amber-500" />
                            <span><strong className="font-bold">{mCount}</strong> ta mock</span>
                          </span>
                        </div>
                      </div>

                      {/* Bottom: Manage Button & Controls */}
                      <div className="space-y-3 pt-3.5 border-t border-slate-100 dark:border-white/[0.06]">
                        <button
                          onClick={() => {
                            setManagingSubject(subject);
                            setSubjectManagerTab("all");
                            setSubjectSearchQuery("");
                          }}
                          className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] text-slate-800 dark:text-white border border-slate-200/80 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/20 text-[13px] font-semibold transition-all group/btn shadow-xs active:scale-[0.99]"
                        >
                          <span className="flex items-center gap-2.5">
                            <Layers className="w-4 h-4 text-[#E8192C] transition-transform group-hover/btn:scale-110" />
                            <span>Mavzular & Mocklar</span>
                          </span>
                          <div className="flex items-center gap-1 text-[11.5px] text-slate-400 group-hover/btn:text-slate-200">
                            <span>Ochish</span>
                            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
                          </div>
                        </button>

                        <div className="flex items-center justify-between text-slate-400 pt-0.5">
                          {/* Reorder Buttons */}
                          <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/[0.03] p-0.5 rounded-lg border border-slate-200/60 dark:border-white/[0.04]">
                            <button
                              onClick={() => handleMoveSubject(idx, "up")}
                              disabled={idx === 0}
                              className="p-1 rounded hover:text-slate-700 dark:hover:text-white hover:bg-white dark:hover:bg-white/[0.08] disabled:opacity-30 transition-all"
                              title="Tartibni yuqoriga surish"
                            >
                              <AltArrowUpIcon className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleMoveSubject(idx, "down")}
                              disabled={idx === sortedSubjects.length - 1}
                              className="p-1 rounded hover:text-slate-700 dark:hover:text-white hover:bg-white dark:hover:bg-white/[0.08] disabled:opacity-30 transition-all"
                              title="Tartibni pastga surish"
                            >
                              <AltArrowDownIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Edit & Delete Buttons */}
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => openEditSubject(subject)}
                              className="p-1.5 rounded-lg hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 text-slate-400 transition-colors"
                              title="Fanni tahrirlash"
                            >
                              <Pen2Icon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm({ id: subject.id, type: "subject" })}
                              className="p-1.5 rounded-lg hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 transition-colors"
                              title="Fanni o'chirish"
                            >
                              <TrashBinMinimalisticIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TEST FOLDERS TAB */}
        {/* ========================================================================= */}
        {activeTab === "folders" && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-[#0D121F] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Test papka nomi..."
                    value={folderSearch}
                    onChange={(e) => setFolderSearch(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-[12px] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#E8192C]"
                  />
                </div>

                <select
                  value={folderSubjectFilter}
                  onChange={(e) => setFolderSubjectFilter(e.target.value)}
                  className="h-9 px-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-[12px] text-slate-900 dark:text-white focus:outline-none focus:border-[#E8192C]"
                >
                  <option value="all">Barcha fanlar</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>

                <select
                  value={folderCategoryFilter}
                  onChange={(e) => setFolderCategoryFilter(e.target.value)}
                  className="h-9 px-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-[12px] text-slate-900 dark:text-white focus:outline-none focus:border-[#E8192C]"
                >
                  <option value="all">Barcha toifalar</option>
                  {CATEGORY_ITEMS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => {
                  setEditingFolderId(null);
                  setFolderForm(emptyFolder);
                  setShowFolderModal(true);
                }}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#E8192C] text-white text-[12.5px] font-bold hover:opacity-90 shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" /> Yangi Papka
              </button>
            </div>

            <div className="bg-white dark:bg-[#0D121F] border border-slate-200 dark:border-white/[0.06] rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-white/[0.06] bg-slate-50/60 dark:bg-white/[0.02]">
                      <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Nomi
                      </th>
                      <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Kategoriya
                      </th>
                      <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Fan
                      </th>
                      <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Narx
                      </th>
                      <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Savollar
                      </th>
                      <th className="px-5 py-3 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Faol
                      </th>
                      <th className="px-5 py-3 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Amallar
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                    {foldersLoading ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <tr key={i}>
                          <td colSpan={7} className="px-5 py-4">
                            <div className="flex items-center gap-3 animate-pulse">
                              <div className="h-3 w-36 bg-slate-100 dark:bg-white/[0.04] rounded" />
                              <div className="h-3 w-20 bg-slate-100 dark:bg-white/[0.04] rounded" />
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : filteredFolders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-5 py-16 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <FolderOpenIcon className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                            <p className="text-[13px] font-semibold text-slate-500">Test papkalar topilmadi</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredFolders.map((folder) => (
                        <tr key={folder.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-3.5">
                            <p className="text-[13px] font-bold text-slate-900 dark:text-white truncate max-w-[240px]">
                              {folder.name}
                            </p>
                            {folder.description && (
                              <p className="text-[11px] text-slate-400 truncate max-w-[240px]">
                                {folder.description}
                              </p>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 px-2 py-0.5 bg-slate-100 dark:bg-white/[0.06] rounded-md capitalize">
                              {folder.category || "—"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-[12.5px] font-medium text-slate-700 dark:text-slate-300">
                              {folder.subject || "—"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-[12.5px] font-bold text-slate-900 dark:text-white">
                              {folder.price > 0 ? `${folder.price.toLocaleString()} so'm` : "Bepul"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            {folder.questions_count > 0 ? (
                              <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                {folder.questions_count} ta
                              </span>
                            ) : (
                              <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                0 ta (Tez orada)
                              </span>
                            )}
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
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => navigate(`/admin/tests/edit/${folder.id}`)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                                title="Savollar muharririni ochish"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openEditFolder(folder)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
                                title="Papka sozlamalari"
                              >
                                <Pen2Icon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm({ id: folder.id, type: "folder" })}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                title="O'chirish"
                              >
                                <TrashBinMinimalisticIcon className="w-4 h-4" />
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
          </div>
        )}

        {/* ========================================================================= */}
        {/* CATEGORIES & SETTINGS TAB */}
        {/* ========================================================================= */}
        {activeTab === "categories" && (
          <div className="space-y-6">
            {/* Coming-Soon Setting Card */}
            <div className="bg-white dark:bg-[#0D121F] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-sm relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-colors ${
                    hideEmptyTests
                      ? "bg-rose-500 text-white"
                      : "bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-300"
                  }`}>
                    <EyeOff className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-[15px] font-extrabold text-slate-900 dark:text-white">
                        Savolsiz ("Tez orada") testlarni katalogdan yashirish
                      </h4>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        hideEmptyTests
                          ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20"
                          : "bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400"
                      }`}>
                        {hideEmptyTests ? "Faol (Yashirilgan)" : "Nofaol (Barchasi ko'rinadi)"}
                      </span>
                    </div>
                    <p className="text-[12.5px] text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                      Ushbu sozlama yoqilganda, hali savollari to'liq kiritilmagan (savollar soni 0 bo'lgan) "Tez orada" yozilgan testlar foydalanuvchilar katalogida ko'rinmaydi va yuklanmaydi. Faqat kamida 1 ta savoli bor testlargina katalogda aks etadi.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => toggleHideEmptyTestsMutation.mutate(!hideEmptyTests)}
                  disabled={toggleHideEmptyTestsMutation.isPending}
                  className={`w-14 h-7.5 rounded-full transition-colors duration-200 relative p-0.5 focus:outline-none focus:ring-2 focus:ring-[#E8192C]/30 shrink-0 self-end sm:self-center ${
                    hideEmptyTests ? "bg-[#E8192C]" : "bg-slate-300 dark:bg-slate-700"
                  }`}
                  aria-label="Toggle Hide Empty Tests"
                >
                  <div
                    className="w-6.5 h-6.5 rounded-full bg-white shadow-md transition-transform duration-200 flex items-center justify-center"
                    style={{
                      transform: hideEmptyTests ? "translateX(26px)" : "translateX(0px)",
                    }}
                  >
                    {hideEmptyTests ? (
                      <Check className="w-3.5 h-3.5 text-[#E8192C] stroke-[3]" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* Category Buttons Header */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-[#0D121F] dark:via-[#161F36] dark:to-[#0D121F] text-white rounded-2xl p-5 shadow-sm border border-slate-800 dark:border-white/[0.08] relative overflow-hidden">
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
                    Foydalanuvchilar katalogida (Testlar sahifasida) yuqorida ko'rinadigan toifa tugmalarini boshqaring.
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-white/10 dark:bg-black/30 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 shrink-0">
                  <div className="text-left sm:text-right">
                    <p className="text-[10px] text-slate-300 uppercase tracking-wider font-bold">Faol bo'limlar</p>
                    <p className="text-[13px] font-black text-emerald-400">
                      {CATEGORY_ITEMS.filter((c) => categoryVisibility[c.id] !== false).length} / {CATEGORY_ITEMS.length} ta ko'rinmoqda
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Cards */}
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
                      className={`group bg-white dark:bg-[#0D121F] border rounded-2xl p-5 transition-all duration-200 relative overflow-hidden flex flex-col justify-between ${
                        isVisible
                          ? "border-slate-200 dark:border-white/[0.08] shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-white/20"
                          : "border-slate-200/60 dark:border-white/[0.04] bg-slate-50/50 dark:bg-white/[0.01] opacity-75"
                      }`}
                    >
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

      {/* ========================================================================= */}
      {/* SUBJECT CONTENT MANAGER MODAL (Mavzular va Mocklarni boshqarish) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {managingSubject && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              onClick={() => setManagingSubject(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5"
            >
              <div
                className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-white/[0.1] rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Top Accent Gradient */}
                <div
                  className="h-1.5 w-full shrink-0"
                  style={{
                    background: `linear-gradient(90deg, ${managingSubject.color_from || '#3B82F6'}, ${managingSubject.color_to || '#8B5CF6'})`,
                  }}
                />

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-200/80 dark:border-white/[0.07] bg-slate-50/50 dark:bg-[#0E1322]">
                  <div className="flex items-center gap-3.5">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md"
                      style={{
                        background: `linear-gradient(135deg, ${managingSubject.color_from || '#3B82F6'}, ${managingSubject.color_to || '#8B5CF6'})`,
                      }}
                    >
                      <SquareAcademicCapIcon className="w-6 h-6 text-white drop-shadow-xs" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-[18px] font-black text-slate-900 dark:text-white tracking-tight">
                          {managingSubject.name}
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-500 dark:text-rose-400 text-[11px] font-bold border border-rose-500/20">
                          Fan boshqaruvi
                        </span>
                      </div>
                      <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Mavzulashtirilgan testlar va mock imtihonlarni tahrirlash, yangi savollar yozish
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setManagingSubject(null)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/[0.08] transition-all"
                  >
                    <CloseSquareIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Sub-Header: Stats & Action Buttons */}
                <div className="p-5 border-b border-slate-200/80 dark:border-white/[0.07] bg-white dark:bg-[#0B0F19] space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                    {/* Stat Chips */}
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-[#151C2E] border border-slate-200/70 dark:border-white/[0.07] text-[12.5px] font-medium text-slate-600 dark:text-slate-300">
                        <FolderOpenIcon className="w-4 h-4 text-sky-500" />
                        <span>Mavzuli papkalar:</span>
                        <strong className="text-slate-900 dark:text-white font-bold ml-0.5">
                          {managingSubjectFolders.length} ta
                        </strong>
                      </div>
                      <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-[#151C2E] border border-slate-200/70 dark:border-white/[0.07] text-[12.5px] font-medium text-slate-600 dark:text-slate-300">
                        <CalculatorMinimalisticIcon className="w-4 h-4 text-amber-500" />
                        <span>Mock testlar:</span>
                        <strong className="text-slate-900 dark:text-white font-bold ml-0.5">
                          {managingSubjectMocks.length} ta
                        </strong>
                      </div>
                    </div>

                    {/* Quick Create Buttons */}
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => openCreateFolderForSubject(managingSubject.name, "mavzulashtirilgan")}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#151C2E] dark:hover:bg-[#1C253C] text-slate-800 dark:text-white text-[12.5px] font-bold transition-all border border-slate-200 dark:border-white/[0.1] shadow-xs active:scale-98"
                      >
                        <Plus className="w-3.5 h-3.5" /> + Yangi Test Papka
                      </button>
                      <button
                        onClick={() =>
                          navigate(`/admin/mock-tests/create?subject=${encodeURIComponent(managingSubject.name)}`)
                        }
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E8192C] hover:bg-red-600 text-white text-[12.5px] font-bold transition-all shadow-md shadow-red-500/25 active:scale-98"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> + Yangi Mock Test
                      </button>
                    </div>
                  </div>

                  {/* Filter Tabs & Search Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#070A12] p-1 rounded-xl border border-slate-200/60 dark:border-white/[0.04] w-fit overflow-x-auto">
                      {[
                        { id: "all", label: "Barchasi" },
                        { id: "mavzulashtirilgan", label: "Mavzuli testlar" },
                        { id: "mock", label: "Mock testlar" },
                        { id: "attestatsiya", label: "Attestatsiya" },
                        { id: "pedagogik", label: "Pedagogik" },
                      ].map((tab) => {
                        const isActive = subjectManagerTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setSubjectManagerTab(tab.id as any)}
                            className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold whitespace-nowrap transition-all ${
                              isActive
                                ? "bg-white dark:bg-[#1A2234] text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-white/[0.08]"
                                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                            }`}
                          >
                            {tab.label}
                          </button>
                        );
                      })}
                    </div>

                    <div className="relative max-w-xs w-full">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Nomi bo'yicha saralash..."
                        value={subjectSearchQuery}
                        onChange={(e) => setSubjectSearchQuery(e.target.value)}
                        className="w-full h-9 pl-9 pr-3 bg-slate-50 dark:bg-[#111624] border border-slate-200 dark:border-white/[0.08] rounded-xl text-[12.5px] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#E8192C]"
                      />
                    </div>
                  </div>
                </div>

                {/* Items List Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                  {/* Folders */}
                  {subjectManagerTab !== "mock" && (
                    <div className="space-y-2.5">
                      {managingSubjectFolders
                        .filter((f) => {
                          if (subjectManagerTab !== "all" && f.category !== subjectManagerTab) return false;
                          if (
                            subjectSearchQuery.trim() &&
                            !f.name.toLowerCase().includes(subjectSearchQuery.toLowerCase())
                          )
                            return false;
                          return true;
                        })
                        .map((folder) => (
                          <div
                            key={`folder-${folder.id}`}
                            className="group bg-slate-50/70 dark:bg-[#111624] hover:bg-white dark:hover:bg-[#151C2E] border border-slate-200/80 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/[0.14] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 transition-all shadow-xs"
                          >
                            <div className="space-y-1.5 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2.5 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10.5px] font-bold uppercase tracking-wide border border-blue-500/20">
                                  {folder.category || "Mavzuli"}
                                </span>
                                <h4 className="text-[14px] font-bold text-slate-900 dark:text-white truncate group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                                  {folder.name}
                                </h4>
                              </div>

                              <div className="flex items-center gap-2.5 text-[12px] text-slate-500 dark:text-slate-400 flex-wrap">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                                  {folder.duration_minutes || 60} daqiqa
                                </span>
                                <span>•</span>
                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                  {folder.price > 0 ? `${folder.price.toLocaleString()} so'm` : "Bepul"}
                                </span>
                                <span>•</span>
                                {folder.questions_count > 0 ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20 text-[11px]">
                                    <Check className="w-3 h-3 stroke-[3]" /> {folder.questions_count} ta savol
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20 text-[11px]">
                                    <AlertTriangle className="w-3 h-3" /> 0 ta (Tez orada)
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                              {/* Open Questions Editor */}
                              <button
                                onClick={() => navigate(`/admin/tests/edit/${folder.id}`)}
                                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.08] dark:hover:bg-white/[0.14] text-slate-900 dark:text-white text-[12.5px] font-bold transition-all border border-slate-200 dark:border-white/10 shadow-xs active:scale-98"
                                title="Savollarni kiritish va tahrirlash"
                              >
                                <EyeIcon className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" /> Savollar
                              </button>

                              {/* Edit Folder Info */}
                              <button
                                onClick={() => openEditFolder(folder)}
                                className="p-2 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] text-slate-400 hover:text-amber-500 hover:border-amber-300 dark:hover:border-amber-500/30 transition-colors"
                                title="Papka ma'lumotlarini tahrirlash"
                              >
                                <Pen2Icon className="w-3.5 h-3.5" />
                              </button>

                              {/* Toggle Active */}
                              <button
                                onClick={() =>
                                  folderToggleActive.mutate({ id: folder.id, is_active: !folder.is_active })
                                }
                                className={`w-9 h-5.5 rounded-full transition-colors relative block p-0.5 ${
                                  folder.is_active ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
                                }`}
                              >
                                <div
                                  className={`w-4.5 h-4.5 rounded-full bg-white shadow transition-transform ${
                                    folder.is_active ? "translate-x-3.5" : "translate-x-0"
                                  }`}
                                />
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => setDeleteConfirm({ id: folder.id, type: "folder" })}
                                className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                title="O'chirish"
                              >
                                <TrashBinMinimalisticIcon className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Mock Tests */}
                  {(subjectManagerTab === "all" || subjectManagerTab === "mock") && (
                    <div className="space-y-2.5">
                      {managingSubjectMocks
                        .filter((m) => {
                          if (
                            subjectSearchQuery.trim() &&
                            !m.title.toLowerCase().includes(subjectSearchQuery.toLowerCase())
                          )
                            return false;
                          return true;
                        })
                        .map((mock) => (
                          <div
                            key={`mock-${mock.id}`}
                            className="group bg-rose-500/[0.03] dark:bg-[#15121E] hover:bg-rose-500/[0.06] dark:hover:bg-[#1C1829] border border-rose-500/15 dark:border-rose-500/20 hover:border-rose-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 transition-all shadow-xs"
                          >
                            <div className="space-y-1.5 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2.5 py-0.5 rounded-md bg-[#E8192C]/10 text-[#E8192C] text-[10.5px] font-bold uppercase tracking-wide border border-[#E8192C]/20">
                                  Mock: {MOCK_TYPE_LABELS[mock.type] || mock.type || "To'liq test"}
                                </span>
                                <h4 className="text-[14px] font-bold text-slate-900 dark:text-white truncate group-hover:text-rose-500 transition-colors">
                                  {mock.title}
                                </h4>
                              </div>

                              <div className="flex items-center gap-2.5 text-[12px] text-slate-500 dark:text-slate-400 flex-wrap">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                                  {mock.duration_minutes || 60} daqiqa
                                </span>
                                <span>•</span>
                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                  {mock.is_free
                                    ? "Bepul"
                                    : mock.price_cash > 0
                                    ? `${mock.price_cash.toLocaleString()} so'm`
                                    : "Pullik"}
                                </span>
                                <span>•</span>
                                {mock.questions_count > 0 ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20 text-[11px]">
                                    <Check className="w-3 h-3 stroke-[3]" /> {mock.questions_count} ta savol
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20 text-[11px]">
                                    <AlertTriangle className="w-3 h-3" /> 0 ta (Tez orada)
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                              {/* Open Mock Questions Editor */}
                              <button
                                onClick={() => navigate(`/admin/mock-tests/edit/${mock.id}`)}
                                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#E8192C] hover:bg-red-600 text-white text-[12.5px] font-bold transition-all shadow-sm shadow-red-500/20 active:scale-98"
                                title="Mock savollarini yozish va tahrirlash"
                              >
                                <EyeIcon className="w-3.5 h-3.5" /> Savollar (Mock)
                              </button>

                              {/* Toggle Active */}
                              <button
                                onClick={() =>
                                  mockToggleActive.mutate({ id: mock.id, is_active: !mock.is_active })
                                }
                                className={`w-9 h-5.5 rounded-full transition-colors relative block p-0.5 ${
                                  mock.is_active ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
                                }`}
                              >
                                <div
                                  className={`w-4.5 h-4.5 rounded-full bg-white shadow transition-transform ${
                                    mock.is_active ? "translate-x-3.5" : "translate-x-0"
                                  }`}
                                />
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => setDeleteConfirm({ id: mock.id, type: "mock" })}
                                className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                              >
                                <TrashBinMinimalisticIcon className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Empty state */}
                  {managingSubjectFolders.length === 0 && managingSubjectMocks.length === 0 && (
                    <div className="py-16 text-center">
                      <SquareAcademicCapIcon className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                      <p className="text-[14px] font-bold text-slate-700 dark:text-slate-300">
                        {managingSubject.name} fanida hali testlar yo'q
                      </p>
                      <p className="text-[12px] text-slate-400 max-w-sm mx-auto mt-1 mb-5">
                        Ushbu fanga mavzulashtirilgan test papkasi yoki mock test qo'shib, darhol savollarini yozishni boshlang.
                      </p>
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => openCreateFolderForSubject(managingSubject.name, "mavzulashtirilgan")}
                          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-[12.5px] font-bold transition-all border border-slate-700"
                        >
                          + Mavzuli test papka
                        </button>
                        <button
                          onClick={() =>
                            navigate(`/admin/mock-tests/create?subject=${encodeURIComponent(managingSubject.name)}`)
                          }
                          className="px-4 py-2.5 rounded-xl bg-[#E8192C] text-white text-[12.5px] font-bold hover:bg-red-600 transition-all shadow-md shadow-red-500/25"
                        >
                          + Yangi Mock test
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* SUBJECT CREATE / EDIT MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showSubjectModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs"
              onClick={closeSubjectModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div
                className="bg-white dark:bg-[#0D121F] border border-slate-200 dark:border-white/[0.08] rounded-3xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-200 dark:border-white/[0.06]">
                  <h3 className="text-[16px] font-bold text-slate-900 dark:text-white">
                    {editingSubjectId ? "Fanni tahrirlash" : "Yangi fan qo'shish"}
                  </h3>
                  <button
                    onClick={closeSubjectModal}
                    className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                  >
                    <CloseSquareIcon className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Fan nomi
                    </label>
                    <input
                      type="text"
                      value={subjectForm.name}
                      onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                      placeholder="Ingliz tili"
                      className="w-full h-11 px-3.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-[13px] text-slate-900 dark:text-white focus:border-[#E8192C] focus:outline-none transition-colors placeholder:text-slate-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Ikonka (lucide)
                      </label>
                      <input
                        type="text"
                        value={subjectForm.icon_name}
                        onChange={(e) => setSubjectForm({ ...subjectForm, icon_name: e.target.value })}
                        placeholder="BookOpen"
                        className="w-full h-11 px-3.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-[13px] font-mono text-slate-900 dark:text-white focus:border-[#E8192C] focus:outline-none transition-colors placeholder:text-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Tartib raqami
                      </label>
                      <input
                        type="number"
                        value={subjectForm.order_number}
                        onChange={(e) =>
                          setSubjectForm({ ...subjectForm, order_number: parseInt(e.target.value) || 0 })
                        }
                        className="w-full h-11 px-3.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-[13px] text-slate-900 dark:text-white focus:border-[#E8192C] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Rang boshlanishi (Gradient start)
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {COLOR_PRESETS.map((c) => (
                        <button
                          key={`from-${c}`}
                          onClick={() => setSubjectForm({ ...subjectForm, color_from: c })}
                          className={`w-7 h-7 rounded-lg transition-all ${
                            subjectForm.color_from === c
                              ? "ring-2 ring-offset-2 ring-offset-white dark:ring-offset-[#0D121F]"
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
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Rang tugashi (Gradient end)
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {COLOR_PRESETS.map((c) => (
                        <button
                          key={`to-${c}`}
                          onClick={() => setSubjectForm({ ...subjectForm, color_to: c })}
                          className={`w-7 h-7 rounded-lg transition-all ${
                            subjectForm.color_to === c
                              ? "ring-2 ring-offset-2 ring-offset-white dark:ring-offset-[#0D121F]"
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

                  <div className="flex items-center gap-3 pt-1">
                    <label className="flex items-center gap-2 text-[13px] text-slate-700 dark:text-slate-300 cursor-pointer font-medium">
                      <input
                        type="checkbox"
                        checked={subjectForm.is_active}
                        onChange={(e) => setSubjectForm({ ...subjectForm, is_active: e.target.checked })}
                        className="rounded border-slate-300 w-4 h-4 text-[#E8192C] focus:ring-[#E8192C]"
                      />
                      Katalogda faol bo'lsin
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-200 dark:border-white/[0.06]">
                  <button
                    onClick={closeSubjectModal}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-400 text-[13px] font-medium hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors"
                  >
                    Bekor qilish
                  </button>
                  <button
                    onClick={() => subjectSaveMutation.mutate(subjectForm)}
                    disabled={subjectSaveMutation.isPending || !subjectForm.name.trim()}
                    className="px-5 py-2 rounded-xl bg-[#E8192C] text-white text-[13px] font-bold hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-sm"
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

      {/* ========================================================================= */}
      {/* TEST FOLDER CREATE / EDIT MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showFolderModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs"
              onClick={closeFolderModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div
                className="bg-white dark:bg-[#0D121F] border border-slate-200 dark:border-white/[0.08] rounded-3xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-200 dark:border-white/[0.06]">
                  <h3 className="text-[16px] font-bold text-slate-900 dark:text-white">
                    {editingFolderId ? "Test papkasini tahrirlash" : "Yangi test papkasi"}
                  </h3>
                  <button
                    onClick={closeFolderModal}
                    className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                  >
                    <CloseSquareIcon className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Papka nomi
                    </label>
                    <input
                      type="text"
                      value={folderForm.name}
                      onChange={(e) => setFolderForm({ ...folderForm, name: e.target.value })}
                      placeholder="1-bob: Kirish testlari"
                      className="w-full h-11 px-3.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-[13px] text-slate-900 dark:text-white focus:border-[#E8192C] focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Fan
                      </label>
                      <select
                        value={folderForm.subject}
                        onChange={(e) => setFolderForm({ ...folderForm, subject: e.target.value })}
                        className="w-full h-11 px-3.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-[13px] text-slate-900 dark:text-white focus:border-[#E8192C] focus:outline-none transition-colors"
                      >
                        <option value="">Fanni tanlang</option>
                        {subjects.map((s) => (
                          <option key={s.id} value={s.name}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Kategoriya
                      </label>
                      <select
                        value={folderForm.category}
                        onChange={(e) => setFolderForm({ ...folderForm, category: e.target.value })}
                        className="w-full h-11 px-3.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-[13px] text-slate-900 dark:text-white focus:border-[#E8192C] focus:outline-none transition-colors"
                      >
                        {CATEGORY_ITEMS.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Narx (so'm, 0=bepul)
                      </label>
                      <input
                        type="number"
                        value={folderForm.price}
                        onChange={(e) => setFolderForm({ ...folderForm, price: Number(e.target.value) || 0 })}
                        className="w-full h-11 px-3.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-[13px] text-slate-900 dark:text-white focus:border-[#E8192C] focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Vaqt (daqiqa)
                      </label>
                      <input
                        type="number"
                        value={folderForm.duration_minutes}
                        onChange={(e) =>
                          setFolderForm({ ...folderForm, duration_minutes: Number(e.target.value) || 60 })
                        }
                        className="w-full h-11 px-3.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-[13px] text-slate-900 dark:text-white focus:border-[#E8192C] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Tavsif (ixtiyoriy)
                    </label>
                    <textarea
                      rows={2}
                      value={folderForm.description}
                      onChange={(e) => setFolderForm({ ...folderForm, description: e.target.value })}
                      placeholder="Mavzular haqida qisqacha..."
                      className="w-full p-3 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-[13px] text-slate-900 dark:text-white focus:border-[#E8192C] focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <label className="flex items-center gap-2 text-[13px] text-slate-700 dark:text-slate-300 cursor-pointer font-medium">
                      <input
                        type="checkbox"
                        checked={folderForm.is_active}
                        onChange={(e) => setFolderForm({ ...folderForm, is_active: e.target.checked })}
                        className="rounded border-slate-300 w-4 h-4 text-[#E8192C] focus:ring-[#E8192C]"
                      />
                      Faol
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-200 dark:border-white/[0.06]">
                  <button
                    onClick={closeFolderModal}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-400 text-[13px] font-medium hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors"
                  >
                    Bekor qilish
                  </button>
                  <button
                    onClick={() => folderSaveMutation.mutate(folderForm)}
                    disabled={folderSaveMutation.isPending || !folderForm.name.trim()}
                    className="px-5 py-2 rounded-xl bg-[#E8192C] text-white text-[13px] font-bold hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    {folderSaveMutation.isPending && <RefreshIcon className="w-3.5 h-3.5 animate-spin" />}
                    {editingFolderId ? "Saqlash" : "Yaratish"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {deleteConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs"
              onClick={() => setDeleteConfirm(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div
                className="bg-white dark:bg-[#0D121F] border border-slate-200 dark:border-white/[0.08] rounded-3xl p-6 max-w-sm w-full shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-[16px] font-bold text-slate-900 dark:text-white mb-2">
                  O'chirishni tasdiqlaysizmi?
                </h3>
                <p className="text-[13px] text-slate-500 mb-6 leading-relaxed">
                  Bu amal qaytarib bo'lmaydi va tegishli ma'lumotlar o'chiriladi.
                </p>
                <div className="flex gap-2.5">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 text-[13px] font-semibold hover:bg-slate-200 dark:hover:bg-white/[0.1] transition-colors"
                  >
                    Bekor qilish
                  </button>
                  <button
                    onClick={() => {
                      if (deleteConfirm.type === "subject") {
                        subjectDeleteMutation.mutate(deleteConfirm.id);
                      } else if (deleteConfirm.type === "folder") {
                        folderDeleteMutation.mutate(deleteConfirm.id);
                      } else if (deleteConfirm.type === "mock") {
                        mockDeleteMutation.mutate(deleteConfirm.id);
                      }
                    }}
                    disabled={
                      subjectDeleteMutation.isPending ||
                      folderDeleteMutation.isPending ||
                      mockDeleteMutation.isPending
                    }
                    className="flex-1 py-2.5 rounded-xl bg-[#E8192C] text-white text-[13px] font-bold hover:opacity-90 transition-all disabled:opacity-50 shadow-sm"
                  >
                    O'chirish
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
