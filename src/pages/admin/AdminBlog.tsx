import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AddCircleIcon as PlusCircleIcon } from "@solar-icons/react/bold-duotone/add-circle";
import { TrashBinMinimalisticIcon } from "@solar-icons/react/bold-duotone/trash-bin-minimalistic";
import { Pen2Icon } from "@solar-icons/react/bold-duotone/pen-2";
import { CloseSquareIcon } from "@solar-icons/react/bold-duotone/close-square";
import { CheckReadIcon } from "@solar-icons/react/bold-duotone/check-read";
import { UploadMinimalisticIcon } from "@solar-icons/react/bold-duotone/upload-minimalistic";
import { RefreshIcon } from "@solar-icons/react/bold-duotone/refresh";
import { FeedIcon } from "@solar-icons/react/bold-duotone/feed";
import { EyeIcon } from "@solar-icons/react/bold-duotone/eye";
import { EyeClosedIcon } from "@solar-icons/react/bold-duotone/eye-closed";
import { GlobeIcon } from "@solar-icons/react/bold-duotone/globe";
import { MagnifierIcon } from "@solar-icons/react/bold-duotone/magnifier";
import { FileTextIcon } from "@solar-icons/react/bold-duotone/file-text";
import { AltArrowLeftIcon } from "@solar-icons/react/bold-duotone/alt-arrow-left";
import { getStoragePublicUrl } from "@/lib/storage";

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim().slice(0, 80);
}

const emptyForm = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  cover_image_url: "",
  tag: "",
  author_name: "EduContest Team",
  is_published: true,
};

const AdminBlog = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [isUploading, setIsUploading] = useState(false);
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"newest" | "views" | "oldest">("newest");

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["admin-blog-posts"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("blog_posts").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const isPostPublished = (p: any) => {
    return p.is_published !== undefined && p.is_published !== null ? !!p.is_published : !!p.published;
  };

  const stats = useMemo(() => {
    const total = posts.length;
    const published = posts.filter((p: any) => isPostPublished(p)).length;
    const draft = posts.filter((p: any) => !isPostPublished(p)).length;
    const totalViews = posts.reduce((sum: number, p: any) => sum + (p.views || 0), 0);
    const avgViews = total > 0 ? Math.round(totalViews / total) : 0;
    const mostViewed = [...posts].sort((a: any, b: any) => (b.views || 0) - (a.views || 0))[0];
    return { total, published, draft, totalViews, avgViews, mostViewed };
  }, [posts]);

  const maxViews = useMemo(() => {
    return Math.max(1, ...posts.map((p: any) => p.views || 0));
  }, [posts]);

  const filtered = useMemo(() => {
    let list = [...posts];
    if (filter === "published") list = list.filter((p: any) => isPostPublished(p));
    if (filter === "draft") list = list.filter((p: any) => !isPostPublished(p));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p: any) => p.title?.toLowerCase().includes(q));
    }
    if (sortBy === "views") {
      list.sort((a: any, b: any) => (b.views || 0) - (a.views || 0));
    } else if (sortBy === "oldest") {
      list.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else {
      list.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return list;
  }, [posts, filter, search, sortBy]);

  const handleImageUpload = async (file: File) => {
    try {
      setIsUploading(true);
      const ext = file.name.split(".").pop();
      const name = `blog/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("subject_resources").upload(name, file);
      if (error) throw error;
      const publicUrl = getStoragePublicUrl("subject_resources", name);
      setForm(prev => ({ ...prev, cover_image_url: publicUrl }));
      toast({ title: "Rasm yuklandi" });
    } catch (e: any) {
      toast({ title: "Xatolik", description: e.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const upsertMutation = useMutation({
    mutationFn: async (payload: any) => {
      const data = {
        title: payload.title,
        slug: payload.slug || slugify(payload.title),
        excerpt: payload.excerpt || "",
        content: payload.content || "",
        cover_image: payload.cover_image_url || payload.cover_image || "",
        author: payload.author_name || payload.author || "EduContest Team",
        category: payload.tag || payload.category || "Yangiliklar",
        is_published: payload.is_published !== undefined ? !!payload.is_published : true,
        published: payload.is_published !== undefined ? !!payload.is_published : true,
        published_at: (payload.is_published !== undefined ? payload.is_published : true) ? new Date().toISOString() : null,
      };

      const res = await fetch("/api/admin/blog/upsert", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ editId, ...data }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || "Failed to save post");
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      toast({ title: editId ? "Yangilandi" : "Chop Etildi" });
      setShowForm(false);
      setEditId(null);
      setForm({ ...emptyForm });
    },
    onError: (err: any) => toast({ title: "Xatolik", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/blog/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || "Failed to delete post");
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      toast({ title: "O'chirildi" });
      setDeleteTarget(null);
    },
    onError: (err: any) => toast({ title: "Xatolik", description: err.message, variant: "destructive" }),
  });

  const togglePublish = async (post: any) => {
    try {
      const currentPublished = post.is_published !== undefined && post.is_published !== null ? !!post.is_published : !!post.published;
      const res = await fetch("/api/admin/blog/toggle-publish", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: post.id, is_published: currentPublished }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || "Failed to update publish status");
      }

      await qc.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      toast({ title: currentPublished ? "Qoralama qilindi" : "Chop etildi" });
    } catch (e: any) {
      toast({ title: "Xatolik", description: e.message, variant: "destructive" });
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  };

  if (showForm) {
    return (
      <div className="space-y-6 pb-12">
        {/* Editor Top Navigation Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0A0F1A] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-4 lg:p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => { setShowForm(false); setEditId(null); }}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 rounded-xl text-[12px] font-bold transition-all shrink-0 cursor-pointer"
            >
              <AltArrowLeftIcon className="w-4 h-4" /> Ortga qaytish
            </button>
            <div className="h-5 w-px bg-slate-200 dark:bg-white/10 hidden sm:block" />
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                {editId ? "Maqolani Tahrirlash" : "Yangi Maqola Yaratish"}
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Maqola matni, muqova rasmi va teglarini tahrirlang
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={() => { setShowForm(false); setEditId(null); }}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-[12px] font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-white/5 transition-all text-center cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              disabled={upsertMutation.isPending || isUploading || !form.title}
              onClick={() => upsertMutation.mutate(form)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#E8192C] hover:bg-red-700 text-white text-[12.5px] font-extrabold shadow-md hover:shadow-red-500/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {upsertMutation.isPending ? <RefreshIcon className="w-4 h-4 animate-spin" /> : <CheckReadIcon className="w-4 h-4" />}
              {editId ? "Saqlash" : "Chop Etish"}
            </button>
          </div>
        </div>

        {/* 2 Column Inline Editor Page Container */}
        <div className="bg-white dark:bg-[#0A0F1A] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-4 sm:p-6 lg:p-8 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            {/* Left Column (Metadata & Settings - 4 cols) */}
            <div className="lg:col-span-4 space-y-4 sm:space-y-5 bg-slate-50/60 dark:bg-white/[0.02] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.06]">
              <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/[0.06] pb-3">
                <h3 className="text-[11.5px] font-extrabold text-slate-400 uppercase tracking-wider">Maqola Sozlamalari</h3>
                <span className="px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-bold text-[10px] truncate max-w-[120px]">
                  {form.slug || "slug-auto"}
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">Sarlavha *</label>
                <input
                  value={form.title}
                  onChange={e => setForm(prev => ({ ...prev, title: e.target.value, slug: slugify(e.target.value) }))}
                  className="w-full h-11 px-3.5 bg-white dark:bg-[#0A0F1A] border border-slate-200 dark:border-white/[0.08] rounded-xl text-[13.5px] font-semibold focus:outline-none focus:ring-2 focus:ring-[#E8192C]/20 shadow-2xs"
                  placeholder="Maqola sarlavhasini kiriting..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">Teglar</label>
                  <input
                    value={form.tag}
                    onChange={e => setForm(prev => ({ ...prev, tag: e.target.value }))}
                    className="w-full h-10 px-3 bg-white dark:bg-[#0A0F1A] border border-slate-200 dark:border-white/[0.08] rounded-xl text-[12px] font-medium focus:outline-none focus:ring-2 focus:ring-[#E8192C]/20 shadow-2xs"
                    placeholder="Yangilik, Ta'lim..."
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">Muallif</label>
                  <input
                    value={form.author_name}
                    onChange={e => setForm(prev => ({ ...prev, author_name: e.target.value }))}
                    className="w-full h-10 px-3 bg-white dark:bg-[#0A0F1A] border border-slate-200 dark:border-white/[0.08] rounded-xl text-[12px] font-medium focus:outline-none focus:ring-2 focus:ring-[#E8192C]/20 shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">Muqova Rasm (Cover Image)</label>
                {form.cover_image_url && (
                  <div className="relative mb-3 group">
                    <img src={form.cover_image_url} alt="" className="w-full h-36 sm:h-40 object-cover rounded-xl border border-slate-200 dark:border-white/10 shadow-2xs" />
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, cover_image_url: "" }))}
                      className="absolute top-2.5 right-2.5 w-7 h-7 bg-red-600 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-700 transition-colors cursor-pointer"
                      title="O'chirish"
                    >
                      <CloseSquareIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <label className="flex items-center justify-center gap-2 h-12 bg-white dark:bg-[#0A0F1A] border-2 border-dashed border-slate-200 dark:border-white/[0.08] rounded-xl cursor-pointer hover:border-[#E8192C] text-[12px] font-bold text-slate-600 dark:text-slate-300 transition-colors shadow-2xs">
                  {isUploading ? <RefreshIcon className="w-4 h-4 animate-spin text-[#E8192C]" /> : <UploadMinimalisticIcon className="w-4 h-4 text-[#E8192C]" />}
                  {isUploading ? "Yuklanmoqda..." : "Muqova rasm yuklash"}
                  <input type="file" className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">Qisqa Tavsif (Excerpt)</label>
                <textarea
                  value={form.excerpt}
                  onChange={e => setForm(prev => ({ ...prev, excerpt: e.target.value }))}
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-[#0A0F1A] border border-slate-200 dark:border-white/[0.08] rounded-xl text-[12.5px] font-medium resize-none focus:outline-none focus:ring-2 focus:ring-[#E8192C]/20 shadow-2xs"
                  placeholder="Maqola haqida qisqacha ma'lumot..."
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, is_published: !prev.is_published }))}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-[12px] font-bold border transition-all cursor-pointer ${
                    form.is_published
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                      : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {form.is_published ? <CheckReadIcon className="w-4 h-4 text-emerald-600" /> : <EyeClosedIcon className="w-4 h-4 text-amber-600" />}
                    Nashr etish holati:
                  </span>
                  <span className="uppercase tracking-wider">{form.is_published ? "Chop etiladi" : "Qoralama"}</span>
                </button>
              </div>
            </div>

            {/* Right Column (Textarea Content - 8 cols) */}
            <div className="lg:col-span-8 flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Maqola Matni (HTML / Markdown)
                </label>
                <span className="text-[11px] font-medium text-slate-400">
                  {form.content ? `${form.content.length} ta belgi` : "Matn kiritilmagan"}
                </span>
              </div>
              <textarea
                value={form.content}
                onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))}
                rows={18}
                className="w-full flex-1 p-3.5 sm:p-5 bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.08] rounded-2xl text-[12.5px] sm:text-[13.5px] font-mono leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-[#E8192C]/20 shadow-inner min-h-[350px] sm:min-h-[480px]"
                placeholder="Maqola to'liq matnini shu yerga yozing..."
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5 bg-white dark:bg-[#0A0F1A] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-4 lg:p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 text-cyan-500 shrink-0">
            <FeedIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">Blog Boshqaruvi va Analitika</h1>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">Maqolalar tahlili, ko'rishlar soni va nashrlarni boshqarish</p>
          </div>
        </div>
        <button
          onClick={() => { setForm({ ...emptyForm }); setEditId(null); setShowForm(true); }}
          className="flex items-center justify-center gap-2 px-4.5 py-2.5 bg-[#E8192C] hover:bg-red-700 text-white rounded-xl text-[12px] font-bold shadow-md transition-all w-full sm:w-auto shrink-0 cursor-pointer"
        >
          <PlusCircleIcon className="w-4 h-4" /> Yangi maqola
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1 */}
        <div className="bg-white dark:bg-[#0A0F1A] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between min-h-[120px] sm:min-h-[130px]">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Jami Maqolalar
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-500/20">
              <FileTextIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white leading-tight">
              {stats.total}
            </div>
            <p className="text-[10.5px] sm:text-[11.5px] font-semibold text-slate-500 dark:text-slate-400 mt-1 truncate">
              {stats.published} ta faol chop etilgan
            </p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white dark:bg-[#0A0F1A] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between min-h-[120px] sm:min-h-[130px]">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Jami Ko'rishlar Soni
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 flex items-center justify-center shrink-0 border border-cyan-100 dark:border-cyan-500/20">
              <EyeIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl sm:text-2xl lg:text-3xl font-black text-cyan-600 dark:text-cyan-400 leading-tight truncate">
              {stats.totalViews.toLocaleString()} ta
            </div>
            <p className="text-[10.5px] sm:text-[11.5px] font-semibold text-cyan-700 dark:text-cyan-300 mt-1 truncate">
              {stats.mostViewed ? `🔥 Top: (${stats.mostViewed.views || 0} ko'rish)` : "O'quvchilar tahlili"}
            </p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white dark:bg-[#0A0F1A] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between min-h-[120px] sm:min-h-[130px]">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              O'rtacha Ko'rish
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-500/20">
              <GlobeIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl sm:text-2xl lg:text-3xl font-black text-emerald-600 dark:text-emerald-400 leading-tight">
              ~{stats.avgViews} ta
            </div>
            <p className="text-[10.5px] sm:text-[11.5px] font-semibold text-slate-500 dark:text-slate-400 mt-1 truncate">
              Har bir maqola o'rtacha qamrovi
            </p>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white dark:bg-[#0A0F1A] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between min-h-[120px] sm:min-h-[130px]">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Qoralama (Draft)
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-500/20">
              <EyeClosedIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl sm:text-2xl lg:text-3xl font-black text-amber-600 dark:text-amber-400 leading-tight">
              {stats.draft}
            </div>
            <p className="text-[10.5px] sm:text-[11.5px] font-semibold text-slate-500 dark:text-slate-400 mt-1 truncate">
              Tayyorlanayotgan maqolalar
            </p>
          </div>
        </div>
      </div>

      {/* Filter + Search + Sort */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex bg-slate-100 dark:bg-white/[0.04] p-1 rounded-xl overflow-x-auto">
            {([
              { key: "all" as const, label: "Barchasi" },
              { key: "published" as const, label: "Chop etilgan" },
              { key: "draft" as const, label: "Qoralama" },
            ]).map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-[11.5px] font-bold transition-all text-center whitespace-nowrap ${filter === tab.key
                    ? "bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="h-9 px-3 bg-white dark:bg-[#0A0F1A] border border-slate-200 dark:border-white/[0.06] rounded-xl text-[12px] font-bold text-slate-700 dark:text-slate-300 outline-none shadow-xs w-full sm:w-auto cursor-pointer"
          >
            <option value="newest">🔥 Eng yangilaridan</option>
            <option value="views">👁️ Eng ko'p ko'rilganlar</option>
            <option value="oldest">⏳ Eng eskilari</option>
          </select>
        </div>

        <div className="relative w-full md:max-w-xs">
          <MagnifierIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Maqola sarlavhasi qidirish..."
            className="w-full h-9 pl-9 pr-3 bg-white dark:bg-[#0A0F1A] border border-slate-200 dark:border-white/[0.06] rounded-xl text-[12px] font-medium focus:outline-none focus:ring-2 focus:ring-[#E8192C]/20 shadow-xs"
          />
        </div>
      </div>

      {/* Table (Responsive Scroll Container) */}
      <div className="bg-white dark:bg-[#0A0F1A] border border-slate-200 dark:border-white/[0.06] rounded-2xl overflow-x-auto shadow-xs">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-white/[0.06] bg-slate-50/80 dark:bg-white/[0.02]">
              <th className="px-5 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Maqola Sarlavhasi</th>
              <th className="px-5 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Muallif</th>
              <th className="px-5 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Ko'rishlar Soni</th>
              <th className="px-5 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Holat</th>
              <th className="px-5 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Sana</th>
              <th className="px-5 py-4 text-right text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.03]">
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-16"><RefreshIcon className="w-6 h-6 animate-spin text-cyan-500 mx-auto" /></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-16"><p className="text-sm text-slate-400 font-medium">Maqolalar topilmadi</p></td></tr>
            ) : filtered.map((post: any) => {
              const firstTag = post.tag ? post.tag.split(",")[0].trim() : "";
              const extraTags = post.tag ? post.tag.split(",").length - 1 : 0;

              return (
                <tr key={post.id} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors group">
                  <td className="px-5 py-5" style={{ paddingTop: '20px', paddingBottom: '20px' }}>
                    <div className="flex items-center gap-4">
                      {(post.cover_image_url || post.cover_image) ? (
                        <img
                          src={post.cover_image_url || post.cover_image}
                          alt=""
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-white/10 shadow-2xs shrink-0 bg-slate-100"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                            const fallback = (e.target as HTMLElement).nextElementSibling;
                            if (fallback) fallback.classList.remove("hidden");
                          }}
                        />
                      ) : null}
                      <div className={`w-12 h-12 rounded-xl bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center shrink-0 border border-slate-200/60 dark:border-white/[0.06] ${(post.cover_image_url || post.cover_image) ? "hidden" : ""}`}>
                        <FileTextIcon className="w-5 h-5 text-slate-400" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-[13px] font-bold text-slate-900 dark:text-white leading-normal truncate max-w-[320px] group-hover:text-[#E8192C] transition-colors">
                          {post.title}
                        </p>
                        {firstTag && (
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-500/10 text-[#E8192C] font-extrabold text-[9px] uppercase tracking-wider truncate max-w-[160px]">
                              {firstTag}
                            </span>
                            {extraTags > 0 && (
                              <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500">+{extraTags}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-5 text-[12px] font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap" style={{ paddingTop: '20px', paddingBottom: '20px' }}>
                    {post.author || post.author_name || "EduContest Team"}
                  </td>

                  <td className="px-5 py-5" style={{ paddingTop: '20px', paddingBottom: '20px' }}>
                    <div className="space-y-1.5">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-200/80 dark:border-cyan-500/20 text-[11.5px] font-extrabold shadow-2xs">
                        <EyeIcon className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                        {(post.views || 0).toLocaleString()} ta ko'rilgan
                      </span>
                      {maxViews > 0 && post.views > 0 && (
                        <div className="w-28 h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(8, ((post.views || 0) / maxViews) * 100))}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-5 py-5" style={{ paddingTop: '20px', paddingBottom: '20px' }}>
                    {(() => {
                      const isPub = isPostPublished(post);
                      return (
                        <button
                          onClick={() => togglePublish(post)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10.5px] font-extrabold uppercase border transition-all ${isPub
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 hover:bg-emerald-100"
                              : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 hover:bg-amber-100"
                            }`}
                        >
                          {isPub ? <CheckReadIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <EyeClosedIcon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
                          {isPub ? "Chop etilgan" : "Qoralama"}
                        </button>
                      );
                    })()}
                  </td>

                  <td className="px-5 py-5 text-[11.5px] font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap" style={{ paddingTop: '20px', paddingBottom: '20px' }}>
                    {formatDate(post.created_at)}
                  </td>

                  <td className="px-5 py-5 text-right" style={{ paddingTop: '20px', paddingBottom: '20px' }}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => {
                          setForm({
                            ...emptyForm,
                            ...post,
                            author_name: post.author || post.author_name || "EduContest Team",
                            cover_image_url: post.cover_image || post.cover_image_url || "",
                            tag: post.category || post.tag || ""
                          });
                          setEditId(post.id);
                          setShowForm(true);
                        }}
                        className="w-8.5 h-8.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] hover:bg-blue-50 dark:hover:bg-blue-500/10 text-slate-400 hover:text-blue-600 border border-slate-200/60 dark:border-white/[0.06] flex items-center justify-center transition-all shadow-2xs"
                        title="Tahrirlash"
                      >
                        <Pen2Icon className="w-4 h-4" />
                      </button>
                      <a
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-8.5 h-8.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] hover:bg-cyan-50 dark:hover:bg-cyan-500/10 text-slate-400 hover:text-cyan-600 border border-slate-200/60 dark:border-white/[0.06] flex items-center justify-center transition-all shadow-2xs"
                        title="Saytda ko'rish"
                      >
                        <GlobeIcon className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => setDeleteTarget(post.id)}
                        className="w-8.5 h-8.5 rounded-xl bg-[#E8192C]/5 hover:bg-red-500 text-slate-400 hover:text-white border border-red-200/60 dark:border-red-500/20 flex items-center justify-center transition-all shadow-2xs"
                        title="O'chirish"
                      >
                        <TrashBinMinimalisticIcon className="w-4 h-4" />
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
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#0a0f1a] rounded-2xl w-full max-w-2xl p-6 space-y-4 mt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-slate-900 dark:text-white">
                {editId ? "Maqolani tahrirlash" : "Yangi maqola"}
              </h2>
              <button onClick={() => { setShowForm(false); setEditId(null); }} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5">
                <CloseSquareIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Sarlavha</label>
                <input
                  value={form.title}
                  onChange={e => setForm(prev => ({ ...prev, title: e.target.value, slug: slugify(e.target.value) }))}
                  className="w-full h-10 px-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#E8192C]/20"
                  placeholder="Maqola sarlavhasi"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Teg</label>
                  <input
                    value={form.tag}
                    onChange={e => setForm(prev => ({ ...prev, tag: e.target.value }))}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#E8192C]/20"
                    placeholder="Yangilik, Ta'lim..."
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Muallif</label>
                  <input
                    value={form.author_name}
                    onChange={e => setForm(prev => ({ ...prev, author_name: e.target.value }))}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#E8192C]/20"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Muqova rasm</label>
                {form.cover_image_url && (
                  <div className="relative mb-2">
                    <img src={form.cover_image_url} alt="" className="w-full h-32 object-cover rounded-lg" />
                    <button
                      onClick={() => setForm(prev => ({ ...prev, cover_image_url: "" }))}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                    >
                      <CloseSquareIcon className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <label className="flex items-center justify-center gap-2 h-10 bg-slate-50 dark:bg-white/[0.03] border-2 border-dashed border-slate-200 dark:border-white/[0.06] rounded-lg cursor-pointer hover:border-[#E8192C]/30 text-[11px] font-medium text-slate-400">
                  {isUploading ? <RefreshIcon className="w-4 h-4 animate-spin" /> : <UploadMinimalisticIcon className="w-4 h-4" />}
                  {isUploading ? "Yuklanmoqda..." : "Rasm yuklash"}
                  <input type="file" className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
                </label>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Qisqa tavsif</label>
                <textarea
                  value={form.excerpt}
                  onChange={e => setForm(prev => ({ ...prev, excerpt: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-lg text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-[#E8192C]/20"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Maqola matni (HTML)</label>
                <textarea
                  value={form.content}
                  onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))}
                  rows={8}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-lg text-[12px] font-mono resize-y focus:outline-none focus:ring-2 focus:ring-[#E8192C]/20"
                />
              </div>
              <button
                onClick={() => setForm(prev => ({ ...prev, is_published: !prev.is_published }))}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-bold transition-colors ${form.is_published ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-slate-100 text-slate-400 border border-slate-200"
                  }`}
              >
                {form.is_published ? <GlobeIcon className="w-3.5 h-3.5" /> : <EyeClosedIcon className="w-3.5 h-3.5" />}
                {form.is_published ? "Chop etiladi" : "Qoralama"}
              </button>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
              <button onClick={() => { setShowForm(false); setEditId(null); }} className="px-4 py-2 rounded-lg text-[12px] font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5">
                Bekor qilish
              </button>
              <button
                disabled={upsertMutation.isPending || isUploading || !form.title}
                onClick={() => upsertMutation.mutate(form)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E8192C] text-white text-[12px] font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {upsertMutation.isPending ? <RefreshIcon className="w-3.5 h-3.5 animate-spin" /> : <CheckReadIcon className="w-3.5 h-3.5" />}
                {editId ? "Saqlash" : "Yaratish"}
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
            <h3 className="text-[14px] font-bold text-slate-900 dark:text-white">O'chirilsinmi?</h3>
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
                {deleteMutation.isPending ? <RefreshIcon className="w-3.5 h-3.5 animate-spin" /> : <TrashBinMinimalisticIcon className="w-3.5 h-3.5" />}
                O'chirish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBlog;
