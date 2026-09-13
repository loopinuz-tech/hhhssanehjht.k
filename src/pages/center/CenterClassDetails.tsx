import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen, Users, FileText, ArrowLeft, Copy, Check,
  UserCheck, UserX, Loader2, Calendar, ShieldCheck
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";

const CenterClassDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"students" | "requests" | "tests">("students");

  const { data, isLoading, error } = useQuery({
    queryKey: ["center-class-details", id],
    queryFn: async () => {
      const res = await fetch(`/api/center/classes/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Sinf ma'lumotlarini yuklab bo'lmadi");
      return res.json();
    }
  });

  const { data: joinRequestsData } = useQuery({
    queryKey: ["center-join-requests"],
    queryFn: async () => {
      const res = await fetch(`/api/center/join-requests`, { credentials: "include" });
      if (!res.ok) return { requests: [] };
      return res.json();
    }
  });

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast({ title: "Nusxalandi!", description: `Sinf kodi: ${code}` });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRequestAction = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch(`/api/center/join-requests/${requestId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast({ title: "Muvaffaqiyatli", description: json.message });
      queryClient.invalidateQueries({ queryKey: ["center-class-details", id] });
      queryClient.invalidateQueries({ queryKey: ["center-join-requests"] });
    } catch (err: any) {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-40 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
      </div>
    );
  }

  if (error || !data?.class) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
        <p className="text-sm text-rose-500 font-semibold">Sinf topilmadi yoki yuklashda xatolik</p>
        <Link to="/center/classes" className="text-xs text-[#E8192C] font-bold mt-3 inline-block">
          ← Sinflar ro'yxatiga qaytish
        </Link>
      </div>
    );
  }

  const cls = data.class;
  const students = data.students || [];
  const tests = data.tests || [];
  const classRequests = (joinRequestsData?.requests || []).filter((r: any) => r.class_id === id);

  return (
    <>
      <SEO title={`${cls.name} — Sinf boshqaruvi`} />
      <div className="space-y-6">
        {/* BACK BUTTON */}
        <div>
          <Link
            to="/center/classes"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Sinflar ro'yxatiga qaytish</span>
          </Link>
        </div>

        {/* CLASS HERO CARD */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full">
                  {cls.subject}
                </span>
                <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                  cls.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30' : 'bg-slate-100 text-slate-500'
                }`}>
                  {cls.status}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {cls.name}
              </h1>

              {cls.description && (
                <p className="text-sm text-slate-500 font-medium max-w-2xl">{cls.description}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                {cls.teacher_name && <span>Ustoz: <b className="text-slate-700 dark:text-slate-200">{cls.teacher_name}</b></span>}
                {cls.start_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{cls.start_date} {cls.end_date ? `— ${cls.end_date}` : ''}</span>
                  </span>
                )}
              </div>
            </div>

            {/* CLASS CODE CARD */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1.5 shrink-0 self-start">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sinf Kodi</div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black font-mono tracking-widest text-slate-900 dark:text-white">{cls.class_code}</span>
                <button
                  onClick={() => handleCopyCode(cls.class_code)}
                  className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-600 dark:text-slate-200 transition-all cursor-pointer shadow-xs"
                  title="Kodni nusxalash"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 max-w-[180px]">O'quvchi ushbu kodni /myclass sahifasida kiritadi</p>
            </div>
          </div>

          {/* TABS HEADER */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pt-2">
            <button
              onClick={() => setActiveTab("students")}
              className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "students"
                  ? "border-[#E8192C] text-[#E8192C]"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>O'quvchilar ({students.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("requests")}
              className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "requests"
                  ? "border-[#E8192C] text-[#E8192C]"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Qo'shilish so'rovlari ({classRequests.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("tests")}
              className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "tests"
                  ? "border-[#E8192C] text-[#E8192C]"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Tayinlangan testlar ({tests.length})</span>
            </button>
          </div>

          {/* TAB CONTENTS */}
          {activeTab === "students" && (
            <div className="space-y-4">
              {students.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {students.map((st: any) => (
                    <div key={st.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs flex items-center justify-center">
                          {(st.profile?.full_name || "O")[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white">
                            {st.profile?.full_name || "O'quvchi"}
                          </div>
                          <div className="text-xs text-slate-400">
                            {st.profile?.phone || st.profile?.email || "Kontakt yo'q"}
                          </div>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30">
                        {st.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center space-y-2">
                  <p className="text-sm font-semibold text-slate-500">Bu sinfda hali o'quvchilar yo'q.</p>
                  <p className="text-xs text-slate-400">
                    O'quvchilarga <b>{cls.class_code}</b> kodini bering yoki "O'quvchilar" bo'limidan to'g'ridan-to'g'ri biriktiring.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "requests" && (
            <div className="space-y-4">
              {classRequests.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {classRequests.map((req: any) => (
                    <div key={req.id} className="py-3.5 flex items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          {req.profile?.full_name || "Foydalanuvchi"}
                        </div>
                        <div className="text-xs text-slate-400">
                          {req.profile?.email || req.profile?.phone || "Kontakt yo'q"} • {new Date(req.requested_at).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRequestAction(req.id, 'approve')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                        >
                          Qabul qilish
                        </button>
                        <button
                          onClick={() => handleRequestAction(req.id, 'reject')}
                          className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          Rad etish
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center space-y-2">
                  <p className="text-sm font-semibold text-slate-500">Yangi qo'shilish so'rovlari mavjud emas.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "tests" && (
            <div className="space-y-4">
              {tests.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {tests.map((t: any) => (
                    <div key={t.id} className="py-3 flex items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{t.title}</h4>
                        <span className="text-xs text-slate-400">{t.mode === 'exam' ? 'Imtihon rejimi' : 'Oddiy rejim'}</span>
                      </div>
                      <Link
                        to={`/center/results/${t.id}`}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold"
                      >
                        Natijalar
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center space-y-2">
                  <p className="text-sm font-semibold text-slate-500">Ushbu sinfga hali testlar tayinlanmagan.</p>
                  <Link
                    to="/center/tests/create"
                    className="inline-block text-xs font-bold text-[#E8192C] hover:underline mt-1"
                  >
                    + Yangi test biriktirish
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CenterClassDetails;
