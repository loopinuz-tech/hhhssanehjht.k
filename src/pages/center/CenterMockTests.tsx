import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileText, Plus, Search, Calendar, Users, BarChart3,
  CheckCircle2, Play, Trash2, ArrowUpRight, Loader2, Sparkles, Pencil
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";

interface CenterTestItem {
  id: string;
  title: string;
  subject?: string;
  mode: string;
  duration_minutes: number;
  attempt_limit: number;
  status: string;
  result_release_policy: string;
  exam_start_at?: string;
  exam_end_at?: string;
  completed_attempts: number;
  created_at: string;
  mock_tests?: {
    title: string;
    questions_count: number;
  };
}

const CenterMockTests = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data, isLoading } = useQuery<{ tests: CenterTestItem[] }>({
    queryKey: ["center-tests"],
    queryFn: async () => {
      const res = await fetch("/api/center/tests", { credentials: "include" });
      if (!res.ok) throw new Error("Mock testlarni yuklab bo'lmadi");
      return res.json();
    }
  });

  const handlePublish = async (id: string, title: string) => {
    try {
      const res = await fetch(`/api/center/tests/${id}/publish`, {
        method: "POST",
        credentials: "include"
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast({ title: "Chop etildi!", description: `"${title}" testi muvaffaqiyatli chop etildi` });
      queryClient.invalidateQueries({ queryKey: ["center-tests"] });
    } catch (err: any) {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    }
  };

  const handleArchive = async (id: string, title: string) => {
    if (!confirm(`Haqiqatan ham "${title}" testini arxivlamoqchimisiz?`)) return;
    try {
      const res = await fetch(`/api/center/tests/${id}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (!res.ok) throw new Error("Arxivlashda xatolik");

      toast({ title: "Arxivlandi", description: "Test arxivlandi" });
      queryClient.invalidateQueries({ queryKey: ["center-tests"] });
    } catch (err: any) {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    }
  };

  const tests = data?.tests || [];
  const filteredTests = tests.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || (t.subject || "").toLowerCase().includes(search.toLowerCase());
    if (statusFilter !== "all") {
      return matchesSearch && t.status === statusFilter;
    }
    return matchesSearch;
  });

  return (
    <>
      <SEO title="Mock testlar — Markaz boshqaruvi" />
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Mock testlar</h2>
            <p className="text-sm text-slate-500 font-medium">
              Markazingiz mock imtihonlarini boshqaring, natijalarni e'lon qiling va Rasch tahlillarini ko'ring.
            </p>
          </div>

          <Link
            to="/center/tests/create"
            className="px-5 py-2.5 bg-[#E8192C] hover:bg-[#D41524] text-white rounded-2xl font-bold text-sm flex items-center gap-2 transition-all shadow-md shadow-red-500/20 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Mock test yaratish</span>
          </Link>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Test nomi yoki fan bo'yicha qidirish..."
              className="w-full h-11 pl-10 pr-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#E8192C] transition-all"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-11 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 w-full sm:w-auto"
          >
            <option value="all">Barcha holatlar</option>
            <option value="ACTIVE">Faol</option>
            <option value="SCHEDULED">Rejalashtirilgan</option>
            <option value="DRAFT">Qoralama</option>
            <option value="ENDED">Tugagan</option>
            <option value="ARCHIVED">Arxivlangan</option>
          </select>
        </div>

        {/* TESTS TABLE */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
          {isLoading ? (
            <div className="p-8 space-y-3 animate-pulse">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800 rounded-xl" />
              ))}
            </div>
          ) : filteredTests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider font-bold text-slate-400">
                  <tr>
                    <th className="py-3.5 px-6">Mock test</th>
                    <th className="py-3.5 px-4">Manba</th>
                    <th className="py-3.5 px-4">Rejim</th>
                    <th className="py-3.5 px-4">Holat</th>
                    <th className="py-3.5 px-4">Topshirilgan</th>
                    <th className="py-3.5 px-6 text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredTests.map((test) => {
                    const isDraft = test.status === "DRAFT";
                    const isScheduled = test.status === "SCHEDULED";
                    const isActive = test.status === "ACTIVE";

                    return (
                      <tr key={test.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-900 dark:text-white">{test.title}</div>
                          <div className="text-xs text-slate-400">
                            {test.subject || "Fan ko'rsatilmagan"} • {test.duration_minutes} daqiqa
                          </div>
                        </td>

                        <td className="py-4 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
                          {test.mock_tests?.title ? (
                            <span className="inline-flex items-center gap-1 text-[#E8192C]">
                              <Sparkles className="w-3 h-3" />
                              <span>{test.mock_tests.title}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400">Custom Center Test</span>
                          )}
                        </td>

                        <td className="py-4 px-4">
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 capitalize">
                            {test.mode === "exam" ? "Imtihon" : "Oddiy"}
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                            isActive
                              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30"
                              : isScheduled
                              ? "bg-sky-50 text-sky-600 dark:bg-sky-950/30"
                              : isDraft
                              ? "bg-amber-50 text-amber-600 dark:bg-amber-950/30"
                              : "bg-slate-100 text-slate-500"
                          }`}>
                            {test.status}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
                          {test.completed_attempts} ta urinish
                        </td>

                        <td className="py-4 px-6 text-right">
                          <div className="inline-flex items-center gap-2">
                            <Link
                              to={`/center/tests/create/${test.id}`}
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors cursor-pointer"
                              title="Tahrirlash"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Link>

                            {isDraft && (
                              <button
                                onClick={() => handlePublish(test.id, test.title)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                              >
                                Chop etish
                              </button>
                            )}

                            <Link
                              to={`/center/results/${test.id}`}
                              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
                            >
                              <BarChart3 className="w-3.5 h-3.5" />
                              <span>Natijalar</span>
                            </Link>

                            <button
                              onClick={() => handleArchive(test.id, test.title)}
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                              title="Arxivlash"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Hozircha mock testlar mavjud emas</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Yangi mock test tayinlash uchun "+ Mock test yaratish" tugmasini bosing.
              </p>
              <Link
                to="/center/tests/create"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E8192C] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Mock test yaratish</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CenterMockTests;
