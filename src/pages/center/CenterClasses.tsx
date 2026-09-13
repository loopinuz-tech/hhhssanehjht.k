import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen, Plus, Copy, Check, Users, FileText,
  Search, Calendar, ArrowRight, Loader2, MoreVertical
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";

interface ClassItem {
  id: string;
  name: string;
  subject: string;
  teacher_name?: string;
  class_code: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status: string;
  students_count: number;
  pending_requests_count?: number;
  created_at: string;
}

const CenterClasses = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, isLoading } = useQuery<{ classes: ClassItem[] }>({
    queryKey: ["center-classes"],
    queryFn: async () => {
      const res = await fetch("/api/center/classes", { credentials: "include" });
      if (!res.ok) throw new Error("Sinflarni yuklab bo'lmadi");
      return res.json();
    }
  });

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast({ title: "Nusxalandi!", description: `Sinf kodi nusxalandi: ${code}` });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !subject.trim()) {
      toast({ title: "Xatolik", description: "Sinf nomi va fanni kiriting", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/center/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          subject: subject.trim(),
          teacher_name: teacherName.trim() || null,
          description: description.trim() || null,
          start_date: startDate || null,
          end_date: endDate || null
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Sinf yaratishda xatolik");

      toast({ title: "Muvaffaqiyatli!", description: `"${json.class.name}" sinfi yaratildi. Kodi: ${json.class.class_code}` });
      setCreateModalOpen(false);
      setName("");
      setSubject("");
      setTeacherName("");
      setDescription("");
      setStartDate("");
      setEndDate("");
      queryClient.invalidateQueries({ queryKey: ["center-classes"] });
    } catch (err: any) {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredClasses = (data?.classes || []).filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.subject.toLowerCase().includes(search.toLowerCase()) ||
    c.class_code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <SEO title="Sinflar — Markaz boshqaruvi" />
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Sinflar</h2>
            <p className="text-sm text-slate-500 font-medium">
              O'quvchilar guruhlarini shakllantiring va ularga sinf kodi orqali testlarni tayinlang.
            </p>
          </div>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-5 py-2.5 bg-[#E8192C] hover:bg-[#D41524] text-white rounded-2xl font-bold text-sm flex items-center gap-2 transition-all shadow-md shadow-red-500/20 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi sinf ochish</span>
          </button>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Sinf nomi, fan yoki kod bo'yicha qidirish..."
            className="w-full h-11 pl-10 pr-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#E8192C] transition-all"
          />
        </div>

        {/* CLASSES GRID */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-44 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
            ))}
          </div>
        ) : filteredClasses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClasses.map((cls) => (
              <div
                key={cls.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                        {cls.subject}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1.5">{cls.name}</h3>
                    </div>

                    {/* Class Code Badge */}
                    <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white">
                      <span className="px-1.5">{cls.class_code}</span>
                      <button
                        onClick={() => handleCopyCode(cls.class_code)}
                        className="p-1 rounded-md hover:bg-white dark:hover:bg-slate-700 transition-colors text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                        title="Kodni nusxalash"
                      >
                        {copiedCode === cls.class_code ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {cls.teacher_name && (
                    <p className="text-xs text-slate-500 font-medium">O'qituvchi: <b className="text-slate-700 dark:text-slate-300">{cls.teacher_name}</b></p>
                  )}

                  {cls.description && (
                    <p className="text-xs text-slate-400 line-clamp-2">{cls.description}</p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                      <Users className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{cls.students_count} ta o'quvchi</span>
                    </div>

                    {Boolean(cls.pending_requests_count && cls.pending_requests_count > 0) && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse">
                        {cls.pending_requests_count} ta ariza
                      </span>
                    )}
                  </div>

                  <Link
                    to={`/center/classes/${cls.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E8192C] hover:underline"
                  >
                    <span>Boshqarish</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Hozircha sinflar mavjud emas</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Birinchi sinfni yaratish uchun "Yangi sinf ochish" tugmasini bosing va sinf kodini o'quvchilarga ulashing.
            </p>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E8192C] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Sinf yaratish</span>
            </button>
          </div>
        )}

        {/* CREATE CLASS MODAL */}
        {createModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Yangi sinf ochish</h3>
                <button
                  onClick={() => setCreateModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateClass} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sinf nomi *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Masalan: SAT 2026 — Group A"
                    className="w-full h-12 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold text-sm text-slate-900 dark:text-white focus:border-[#E8192C]"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fan *</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Matematika"
                      className="w-full h-12 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold text-sm text-slate-900 dark:text-white focus:border-[#E8192C]"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">O'qituvchi</label>
                    <input
                      type="text"
                      value={teacherName}
                      onChange={(e) => setTeacherName(e.target.value)}
                      placeholder="Ustoz ismi"
                      className="w-full h-12 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold text-sm text-slate-900 dark:text-white focus:border-[#E8192C]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Boshlanish sanasi</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full h-12 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold text-sm text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tugash sanasi</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full h-12 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold text-sm text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tavsif (ixtiyoriy)</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Sinf haqida qisqacha ma'lumot..."
                    className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-medium text-xs sm:text-sm text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl font-semibold text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-[#E8192C] hover:bg-[#D41524] text-white rounded-xl font-bold text-sm transition-all cursor-pointer flex items-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Yaratish</span>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CenterClasses;
