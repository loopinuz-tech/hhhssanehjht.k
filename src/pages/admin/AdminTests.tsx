import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FileTextIcon } from "@solar-icons/react/bold-duotone/file-text";
import { AddCircleIcon as PlusCircleIcon } from "@solar-icons/react/bold-duotone/add-circle";
import { MagnifierIcon } from "@solar-icons/react/bold-duotone/magnifier";
import { Pen2Icon } from "@solar-icons/react/bold-duotone/pen-2";
import { TrashBinMinimalisticIcon } from "@solar-icons/react/bold-duotone/trash-bin-minimalistic";
import { EyeIcon } from "@solar-icons/react/bold-duotone/eye";
import { RefreshIcon } from "@solar-icons/react/bold-duotone/refresh";
import { CloseSquareIcon } from "@solar-icons/react/bold-duotone/close-square";
import { AltArrowLeftIcon } from "@solar-icons/react/bold-duotone/alt-arrow-left";
import { AltArrowRightIcon } from "@solar-icons/react/bold-duotone/alt-arrow-right";
import { DangerCircleIcon } from "@solar-icons/react/bold-duotone/danger-circle";
import { UploadMinimalisticIcon } from "@solar-icons/react/bold-duotone/upload-minimalistic";
import slugify from "slugify";

type TestCategory = "mavzulashtirilgan" | "mock-tests" | "attestatsiya" | "pedagogik" | "user-tests";

type TestFolder = {
  id: string;
  name: string;
  description: string;
  category: TestCategory;
  subject: string;
  price: number;
  duration_minutes: number;
  questions_count: number;
  is_active: boolean;
  educoin_price: number;
  payment_type: string;
  created_at: string;
  questions?: [{ count: number }];
};

const AdminTests = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editItem, setEditItem] = useState<TestFolder | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "mavzulashtirilgan" as TestCategory,
    subject: "",
    price: 0,
    duration_minutes: 60,
    questions_count: 0,
    is_active: true,
    educoin_price: 0,
    payment_type: "uzs",
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ["admin-subjects-list"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("subjects")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: folders = [], isLoading } = useQuery({
    queryKey: ["admin-test-folders"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("test_folders")
        .select("*, questions(count)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as TestFolder[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editItem) {
        const { error } = await (supabase as any)
          .from("test_folders")
          .update(form)
          .eq("id", editItem.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("test_folders")
          .insert(form);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-test-folders"] });
      setShowModal(false);
      setEditItem(null);
      resetForm();
      toast({ title: editItem ? "Tahrirlandi" : "Yaratildi" });
    },
    onError: (e: any) => {
      toast({ title: "Xatolik", description: e.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // 1. Fetch questions to get image/audio urls for storage cleanup
      const { data: questions } = await (supabase as any)
        .from("test_questions")
        .select("image_url, audio_url")
        .eq("folder_id", id);
      
      if (questions && questions.length > 0) {
        const filesToRemove: string[] = [];
        questions.forEach((q: any) => {
          if (q.image_url) {
            const parts = q.image_url.split('/');
            filesToRemove.push(parts[parts.length - 1]);
          }
          if (q.audio_url) {
            const parts = q.audio_url.split('/');
            filesToRemove.push(parts[parts.length - 1]);
          }
        });
        if (filesToRemove.length > 0) {
          await supabase.storage.from("questions").remove(filesToRemove);
        }
      }

      // 2. Delete the folder (questions cascade down in DB if configured, but files are now removed)
      const { error } = await (supabase as any)
        .from("test_folders")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-test-folders"] });
      setShowDeleteModal(false);
      setDeleteId(null);
      toast({ title: "O'chirildi" });
    },
    onError: (e: any) => {
      toast({ title: "Xatolik", description: e.message, variant: "destructive" });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await (supabase as any)
        .from("test_folders")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-test-folders"] });
      toast({ title: "Holat yangilandi" });
    },
  });

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      category: "mavzulashtirilgan",
      subject: "",
      price: 0,
      duration_minutes: 60,
      questions_count: 0,
      is_active: true,
      educoin_price: 0,
      payment_type: "uzs",
    });
  };

  const openCreate = () => {
    setEditItem(null);
    resetForm();
    setShowModal(true);
  };

  const openEdit = (item: TestFolder) => {
    setEditItem(item);
    setForm({
      name: item.name,
      description: item.description || "",
      category: item.category,
      subject: item.subject || "",
      price: item.price || 0,
      duration_minutes: item.duration_minutes || 60,
      questions_count: item.questions_count || 0,
      is_active: item.is_active ?? true,
      educoin_price: item.educoin_price || 0,
      payment_type: item.payment_type || "uzs",
    });
    setShowModal(true);
  };

  const filtered = useMemo(() => {
    return folders.filter((f) => {
      const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" || f.category === categoryFilter;
      const matchesSubject =
        subjectFilter === "all" || f.subject === subjectFilter;
      return matchesSearch && matchesCategory && matchesSubject;
    });
  }, [folders, search, categoryFilter, subjectFilter]);

  const totalPages = Math.ceil(filtered.length / 20);
  const paginated = filtered.slice((page - 1) * 20, page * 20);

  const stats = useMemo(() => {
    const total = filtered.length;
    const questions = filtered.reduce((acc, f) => acc + (f.questions?.[0]?.count || 0), 0);
    const active = filtered.filter((f) => f.is_active).length;
    return { total, questions, active };
  }, [filtered]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("uz-UZ").format(price) + " so'm";

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case "mavzulashtirilgan":
        return "bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/20";
      case "mock-tests":
      case "mock":
        return "bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20";
      case "attestatsiya":
        return "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20";
      case "pedagogik":
        return "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20";
      case "user-tests":
        return "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20";
      default:
        return "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10";
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "mavzulashtirilgan":
        return "Mavzulashtirilgan";
      case "mock-tests":
      case "mock":
        return "Mock testlar";
      case "attestatsiya":
        return "Attestatsiya";
      case "pedagogik":
        return "Pedagogik";
      case "user-tests":
        return "O'qituvchi testlari";
      default:
        return cat;
    }
  };

  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    folders.forEach((f) => {
      if (f.subject) set.add(f.subject);
    });
    subjects.forEach((s: any) => {
      if (s.name) set.add(s.name);
    });
    return Array.from(set).sort();
  }, [folders, subjects]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: folders.length,
      mavzulashtirilgan: 0,
      "mock-tests": 0,
      attestatsiya: 0,
      pedagogik: 0,
      "user-tests": 0,
    };
    folders.forEach((f) => {
      if (counts[f.category] !== undefined) {
        counts[f.category]++;
      }
    });
    return counts;
  }, [folders]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshIcon className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center">
            <FileTextIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                Testlar Boshqaruvi
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 text-[11px] font-bold">
                {folders.length} ta papka
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/admin/pdf-import")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-white/5 text-[12px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-opacity"
          >
            <UploadMinimalisticIcon className="w-4 h-4" />
            PDF Import
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E8192C] text-white text-[12px] font-bold shadow-md hover:bg-red-700 transition-opacity"
          >
            <PlusCircleIcon className="w-4 h-4" />
            Yangi test
          </button>
        </div>
      </div>

      <div className="relative">
        <MagnifierIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Test nomi bo'yicha qidirish..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full h-10 pl-10 pr-4 rounded-lg bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] text-[12px] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 p-1 bg-slate-100 dark:bg-white/5 rounded-lg w-fit">
        {[
          { key: "all", label: "Barchasi" },
          { key: "mavzulashtirilgan", label: "Mavzulashtirilgan" },
          { key: "mock-tests", label: "Mock testlar" },
          { key: "attestatsiya", label: "Attestatsiya" },
          { key: "pedagogik", label: "Pedagogik" },
          { key: "user-tests", label: "O'qituvchi testlari" },
        ].map((tab) => {
          const count = categoryCounts[tab.key] ?? 0;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setCategoryFilter(tab.key);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all flex items-center gap-2 ${
                categoryFilter === tab.key
                  ? "bg-white dark:bg-[#080C14] shadow-sm text-slate-900 dark:text-white font-bold"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold font-mono shrink-0 ${
                  categoryFilter === tab.key
                    ? "bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white"
                    : "bg-slate-200/50 dark:bg-white/5 text-slate-500"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <select
          value={subjectFilter}
          onChange={(e) => {
            setSubjectFilter(e.target.value);
            setPage(1);
          }}
          className="h-9.5 px-3.5 rounded-xl bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.08] text-[12.5px] font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 shadow-xs cursor-pointer"
        >
          <option value="all">Barcha fanlar ({availableSubjects.length} ta fan)</option>
          {availableSubjects.map((subjectName) => (
            <option key={subjectName} value={subjectName}>
              {subjectName}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl p-4">
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
            Jami testlar
          </p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">
            {stats.total}
          </p>
        </div>
        <div className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl p-4">
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
            Jami savollar
          </p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">
            {stats.questions}
          </p>
        </div>
        <div className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl p-4">
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
            Faol testlar
          </p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">
            {stats.active}
          </p>
        </div>
      </div>

      {paginated.length === 0 ? (
        <div className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl py-16 flex flex-col items-center justify-center">
          <FileTextIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
            Testlar topilmadi
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/[0.06]">
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Nomi
                </th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Kategoriya
                </th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Fan
                </th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Savollar soni
                </th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Narx
                </th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Holat
                </th>
                <th className="text-right px-4 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Amallar
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((folder) => (
                <tr
                  key={folder.id}
                  className="border-b border-slate-50 dark:border-white/[0.03] hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="text-[12px] font-semibold text-slate-900 dark:text-white">
                      {folder.name}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-medium ${getCategoryBadge(
                        folder.category
                      )}`}
                    >
                      {getCategoryLabel(folder.category)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[12px] text-slate-600 dark:text-slate-400">
                      {folder.subject || "-"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[12px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/[0.06] px-2 py-0.5 rounded-md">
                      {folder.questions?.[0]?.count || 0} ta savol
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[12px] text-slate-600 dark:text-slate-400">
                      {formatPrice(folder.price || 0)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() =>
                        toggleActiveMutation.mutate({
                          id: folder.id,
                          is_active: !folder.is_active,
                        })
                      }
                      disabled={toggleActiveMutation.isPending}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold border transition-colors ${
                        folder.is_active
                          ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                          : "bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/10"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          folder.is_active ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                        }`}
                      />
                      {folder.is_active ? "Faol" : "Nofaol"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(folder)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                        title="Tahrirlash"
                      >
                        <Pen2Icon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          navigate(`/admin/tests/edit/${folder.id}`)
                        }
                        className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors"
                        title="Savollar"
                      >
                        <EyeIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setDeleteId(folder.id);
                          setShowDeleteModal(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                        title="O'chirish"
                      >
                        <TrashBinMinimalisticIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-white/[0.06]">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {filtered.length} tadan {(page - 1) * 20 + 1}-
                {Math.min(page * 20, filtered.length)}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <AltArrowLeftIcon className="w-4 h-4" />
                </button>
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 px-2">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <AltArrowRightIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[14px] font-bold text-slate-900 dark:text-white">
                {editItem ? "Testni tahrirlash" : "Yangi test"}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditItem(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                <CloseSquareIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Nomi
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] text-[12px] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10"
                  placeholder="Test nomi"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Tavsif
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="w-full h-20 px-3 py-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] text-[12px] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10 resize-none"
                  placeholder="Test tavsifi"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Kategoriya
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        category: e.target.value as TestCategory,
                      })
                    }
                    className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] text-[12px] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10"
                  >
                    <option value="mavzulashtirilgan">Mavzulashtirilgan</option>
                    <option value="mock-tests">Mock testlar</option>
                    <option value="attestatsiya">Attestatsiya</option>
                    <option value="pedagogik">Pedagogik</option>
                    <option value="user-tests">O'qituvchi testlari</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Fan
                  </label>
                  <select
                    value={form.subject}
                    onChange={(e) =>
                      setForm({ ...form, subject: e.target.value })
                    }
                    className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] text-[12px] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10"
                  >
                    <option value="">Tanlang</option>
                    {subjects.map((s: any) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Narx (so'm)
                  </label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: Number(e.target.value) })
                    }
                    className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] text-[12px] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Davomiylik (daqiqa)
                  </label>
                  <input
                    type="number"
                    value={form.duration_minutes}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        duration_minutes: Number(e.target.value),
                      })
                    }
                    className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] text-[12px] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Savollar soni
                  </label>
                  <input
                    type="number"
                    value={form.questions_count}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        questions_count: Number(e.target.value),
                      })
                    }
                    className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] text-[12px] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Educoin narx
                  </label>
                  <input
                    type="number"
                    value={form.educoin_price}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        educoin_price: Number(e.target.value),
                      })
                    }
                    className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] text-[12px] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    To'lov turi
                  </label>
                  <select
                    value={form.payment_type}
                    onChange={(e) =>
                      setForm({ ...form, payment_type: e.target.value })
                    }
                    className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] text-[12px] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10"
                  >
                    <option value="uzs">So'm</option>
                    <option value="educoin">Educoin</option>
                    <option value="free">Bepul</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) =>
                        setForm({ ...form, is_active: e.target.checked })
                      }
                      className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900/10"
                    />
                    <span className="text-[12px] font-medium text-slate-700 dark:text-slate-300">
                      Faol
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditItem(null);
                }}
                className="px-4 py-2 rounded-lg text-[12px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                Bekor qilish
              </button>
              <button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !form.name}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[12px] font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {saveMutation.isPending && (
                  <RefreshIcon className="w-3.5 h-3.5 animate-spin" />
                )}
                {editItem ? "Saqlash" : "Yaratish"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                <DangerCircleIcon className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h2 className="text-[14px] font-bold text-slate-900 dark:text-white">
                  O'chirishni tasdiqlaysizmi?
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Bu amal qaytarib bo'lmaydi.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteId(null);
                }}
                className="px-4 py-2 rounded-lg text-[12px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                Bekor qilish
              </button>
              <button
                onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-[12px] font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleteMutation.isPending && (
                  <RefreshIcon className="w-3.5 h-3.5 animate-spin" />
                )}
                O'chirish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTests;
