import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users, Plus, Search, Key, ShieldCheck, Copy, Check,
  UserX, UserCheck, Trash2, ArrowRight, Loader2, Download,
  Clock, CheckCircle, XCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";

interface StudentItem {
  id: string;
  user_id: string;
  role: string;
  status: string;
  custom_username?: string;
  joined_at: string;
  profile: {
    full_name?: string;
    email?: string;
    phone?: string;
  };
  classes: Array<{
    id: string;
    name: string;
    subject: string;
  }>;
}

const CenterStudents = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"students" | "requests">(
    (searchParams.get("tab") as any) === "requests" ? "requests" : "students"
  );

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "requests") setActiveTab("requests");
  }, [searchParams]);

  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [isExistingMode, setIsExistingMode] = useState(false);

  // Form state
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [classId, setClassId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Created credentials modal (shown ONCE)
  const [createdCredentials, setCreatedCredentials] = useState<{
    login: string;
    password?: string;
    center_url: string;
  } | null>(null);

  // Temporary password reset modal
  const [resetModalData, setResetModalData] = useState<{
    name: string;
    tempPass: string;
  } | null>(null);

  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useQuery<{ students: StudentItem[] }>({
    queryKey: ["center-students"],
    queryFn: async () => {
      const res = await fetch("/api/center/students", { credentials: "include" });
      if (!res.ok) throw new Error("O'quvchilarni yuklab bo'lmadi");
      return res.json();
    }
  });

  const { data: classesData } = useQuery<{ classes: any[] }>({
    queryKey: ["center-classes"],
    queryFn: async () => {
      const res = await fetch("/api/center/classes", { credentials: "include" });
      if (!res.ok) return { classes: [] };
      return res.json();
    }
  });

  const { data: requestsData, isLoading: isRequestsLoading } = useQuery<{ requests: any[] }>({
    queryKey: ["center-join-requests"],
    queryFn: async () => {
      const res = await fetch("/api/center/join-requests", { credentials: "include" });
      if (!res.ok) return { requests: [] };
      return res.json();
    }
  });

  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  const handleRequestAction = async (requestId: string, action: "approve" | "reject") => {
    setProcessingRequestId(requestId);
    try {
      const res = await fetch(`/api/center/join-requests/${requestId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Arizani ko'rib chiqishda xatolik");

      toast({
        title: action === "approve" ? "Ariza qabul qilindi!" : "Ariza rad etildi",
        description: json.message
      });
      queryClient.invalidateQueries({ queryKey: ["center-students"] });
      queryClient.invalidateQueries({ queryKey: ["center-join-requests"] });
      queryClient.invalidateQueries({ queryKey: ["center-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["center-classes"] });
    } catch (err: any) {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/center/students/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          full_name: fullName.trim(),
          username: username.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          password: password || undefined,
          class_id: classId || undefined,
          is_existing_account: isExistingMode
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "O'quvchi qo'shishda xatolik");

      toast({ title: "Muvaffaqiyatli!", description: "O'quvchi markazga biriktirildi" });
      setCreateModalOpen(false);

      if (json.credentials) {
        setCreatedCredentials(json.credentials);
      }

      setFullName("");
      setUsername("");
      setPhone("");
      setEmail("");
      setPassword("");
      setClassId("");
      queryClient.invalidateQueries({ queryKey: ["center-students"] });
    } catch (err: any) {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (userId: string, studentName: string) => {
    if (!confirm(`${studentName} uchun parolni yangilashni xohlaysizmi?`)) return;
    try {
      const res = await fetch("/api/center/students/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ user_id: userId })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setResetModalData({ name: studentName, tempPass: json.temporary_password });
    } catch (err: any) {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    }
  };

  const handleToggleStatus = async (memberId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      const res = await fetch(`/api/center/students/${memberId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: nextStatus })
      });
      if (!res.ok) throw new Error("Holatni o'zgartirishda xatolik");

      toast({ title: "Muvaffaqiyatli", description: `O'quvchi holati: ${nextStatus}` });
      queryClient.invalidateQueries({ queryKey: ["center-students"] });
    } catch (err: any) {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    }
  };

  const handleRemoveStudent = async (memberId: string, name: string) => {
    if (!confirm(`Haqiqatan ham ${name}ni markazdan chiqarmoqchimisiz? (Tarixiy test natijalari saqlanib qoladi)`)) return;
    try {
      const res = await fetch(`/api/center/students/${memberId}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (!res.ok) throw new Error("O'chirishda xatolik");

      toast({ title: "O'quvchi chiqarildi", description: "O'quvchi markazdan chiqarildi" });
      queryClient.invalidateQueries({ queryKey: ["center-students"] });
    } catch (err: any) {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    }
  };

  const copyCreds = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: "Nusxalandi!", description: "Login ma'lumotlari nusxalandi" });
    setTimeout(() => setCopied(false), 2000);
  };

  const students = data?.students || [];
  const pendingRequests = requestsData?.requests || [];

  const filteredStudents = students.filter(s => {
    const name = s.profile?.full_name?.toLowerCase() || "";
    const emailStr = s.profile?.email?.toLowerCase() || "";
    const phoneStr = s.profile?.phone || "";
    const uname = s.custom_username?.toLowerCase() || "";
    const matchesSearch = name.includes(search.toLowerCase()) || emailStr.includes(search.toLowerCase()) || phoneStr.includes(search) || uname.includes(search.toLowerCase());

    if (selectedClass !== "all") {
      return matchesSearch && s.classes.some(c => c.id === selectedClass);
    }
    return matchesSearch;
  });

  return (
    <>
      <SEO title="O'quvchilar — Markaz boshqaruvi" />
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">O'quvchilar</h2>
            <p className="text-sm text-slate-500 font-medium">
              Markazingiz o'quvchilarini boshqaring, akkauntlar yarating yoki mavjud EduContest hisoblarini biriktiring.
            </p>
          </div>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-5 py-2.5 bg-[#E8192C] hover:bg-[#D41524] text-white rounded-2xl font-bold text-sm flex items-center gap-2 transition-all shadow-md shadow-red-500/20 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ O'quvchi qo'shish</span>
          </button>
        </div>

        {/* TABS */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => {
              setActiveTab("students");
              setSearchParams({});
            }}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "students"
                ? "border-[#E8192C] text-[#E8192C]"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Barcha o'quvchilar ({students.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("requests");
              setSearchParams({ tab: "requests" });
            }}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "requests"
                ? "border-[#E8192C] text-[#E8192C]"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Kutilayotgan arizalar</span>
            {pendingRequests.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white animate-pulse">
                {pendingRequests.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === "students" && (
          <>
            {/* SEARCH & FILTERS */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="O'quvchi ismi, login yoki telefon orqali qidirish..."
                  className="w-full h-11 pl-10 pr-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#E8192C] transition-all"
                />
              </div>

              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="h-11 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 w-full sm:w-auto"
              >
                <option value="all">Barcha sinflar</option>
                {(classesData?.classes || []).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* STUDENTS TABLE */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
              {isLoading ? (
                <div className="p-8 space-y-3 animate-pulse">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-xl" />
                  ))}
                </div>
              ) : filteredStudents.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider font-bold text-slate-400">
                      <tr>
                        <th className="py-3.5 px-6">O'quvchi</th>
                        <th className="py-3.5 px-4">Sinf</th>
                        <th className="py-3.5 px-4">Aloqa</th>
                        <th className="py-3.5 px-4">Holat</th>
                        <th className="py-3.5 px-6 text-right">Amallar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredStudents.map((stu) => {
                        const fullName = stu.profile?.full_name || "O'quvchi";
                        const isSuspended = stu.status === "SUSPENDED";

                        return (
                          <tr key={stu.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="py-3.5 px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs flex items-center justify-center shrink-0">
                                  {fullName[0].toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900 dark:text-white">{fullName}</div>
                                  <div className="text-xs text-slate-400">@{stu.custom_username || "educontest_id"}</div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="flex flex-wrap gap-1">
                                {stu.classes.length > 0 ? (
                                  stu.classes.map(c => (
                                    <span key={c.id} className="text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md">
                                      {c.name}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-xs text-slate-400 italic">Sinfga biriktirilmagan</span>
                                )}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-xs text-slate-500 font-medium">
                              {stu.profile?.phone || stu.profile?.email || "—"}
                            </td>

                            <td className="py-3.5 px-4">
                              <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                                isSuspended
                                  ? "bg-rose-50 text-rose-600 dark:bg-rose-950/30"
                                  : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30"
                              }`}>
                                {stu.status}
                              </span>
                            </td>

                            <td className="py-3.5 px-6 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  onClick={() => handleResetPassword(stu.user_id, fullName)}
                                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 transition-colors cursor-pointer"
                                  title="Parolni tiklash"
                                >
                                  <Key className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => handleToggleStatus(stu.id, stu.status)}
                                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-amber-600 hover:bg-slate-100 transition-colors cursor-pointer"
                                  title={isSuspended ? "Faollashtirish" : "Vaqtincha to'xtatish"}
                                >
                                  <UserX className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => handleRemoveStudent(stu.id, fullName)}
                                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                                  title="Markazdan chiqarish"
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
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">O'quvchilar mavjud emas</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Markaz o'quvchilarini ro'yxatga olish uchun "+ O'quvchi qo'shish" tugmasini bosing.
                  </p>
                  <button
                    onClick={() => setCreateModalOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E8192C] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>O'quvchi qo'shish</span>
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* REQUESTS VIEW */}
        {activeTab === "requests" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
            {isRequestsLoading ? (
              <div className="p-8 space-y-3 animate-pulse">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-xl" />
                ))}
              </div>
            ) : pendingRequests.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider font-bold text-slate-400">
                    <tr>
                      <th className="py-3.5 px-6">Ariza beruvchi</th>
                      <th className="py-3.5 px-4">Sinf</th>
                      <th className="py-3.5 px-4">Aloqa</th>
                      <th className="py-3.5 px-4">Yuborilgan vaqt</th>
                      <th className="py-3.5 px-6 text-right">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {pendingRequests.map((req: any) => {
                      const applicantName = req.profile?.full_name || "Foydalanuvchi";
                      const cls = req.center_classes;
                      const isProcessing = processingRequestId === req.id;

                      return (
                        <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center justify-center shrink-0">
                                {applicantName[0].toUpperCase()}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white">{applicantName}</div>
                                <div className="text-xs text-slate-400">ID: {req.user_id?.slice(0, 8)}...</div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            {cls ? (
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-900 dark:text-white">{cls.name}</span>
                                <span className="text-[11px] text-slate-400">{cls.subject}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">Sinf topilmadi</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-xs text-slate-500 font-medium">
                            {req.profile?.phone || req.profile?.email || "—"}
                          </td>

                          <td className="py-3.5 px-4 text-xs text-slate-500">
                            {new Date(req.requested_at).toLocaleString("uz-UZ", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </td>

                          <td className="py-3.5 px-6 text-right">
                            <div className="inline-flex items-center gap-2">
                              <button
                                onClick={() => handleRequestAction(req.id, "approve")}
                                disabled={isProcessing}
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                              >
                                {isProcessing ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <>
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    <span>Qabul qilish</span>
                                  </>
                                )}
                              </button>

                              <button
                                onClick={() => handleRequestAction(req.id, "reject")}
                                disabled={isProcessing}
                                className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 disabled:opacity-50 text-rose-600 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Rad etish</span>
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
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Kutilayotgan arizalar yo'q</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  O'quvchilar sinf kodi orqali a'zo bo'lish so'rovi yuborganida, arizalar ushbu bo'limda ko'rinadi.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ADD STUDENT MODAL */}
        {createModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">O'quvchi qo'shish</h3>
                <button
                  onClick={() => setCreateModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Toggle Mode */}
              <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setIsExistingMode(false)}
                  className={`py-2 rounded-lg transition-all cursor-pointer ${
                    !isExistingMode ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs" : "text-slate-500"
                  }`}
                >
                  Yangi akkaunt
                </button>
                <button
                  type="button"
                  onClick={() => setIsExistingMode(true)}
                  className={`py-2 rounded-lg transition-all cursor-pointer ${
                    isExistingMode ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs" : "text-slate-500"
                  }`}
                >
                  Mavjud akkauntga biriktirish
                </button>
              </div>

              <form onSubmit={handleCreateStudent} className="space-y-4">
                {!isExistingMode ? (
                  <>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">F.I.Sh. *</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Ali Valiyev"
                        className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold text-sm text-slate-900 dark:text-white focus:border-[#E8192C]"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Login *</label>
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                          placeholder="ali123"
                          className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold text-sm text-slate-900 dark:text-white focus:border-[#E8192C]"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Parol (ixtiyoriy)</label>
                        <input
                          type="text"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Avto yaratish"
                          className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold text-sm text-slate-900 dark:text-white focus:border-[#E8192C]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Telefon</label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+998"
                          className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold text-sm text-slate-900 dark:text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="ali@gmail.com"
                          className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold text-sm text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-500">
                      O'quvchi allaqachon EduContest platformasida ro'yxatdan o'tgan bo'lsa, uning email yoki telefon raqamini kiriting:
                    </p>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email yoki Telefon raqami *</label>
                      <input
                        type="text"
                        value={email || phone}
                        onChange={(e) => {
                          if (e.target.value.includes('@')) {
                            setEmail(e.target.value);
                            setPhone("");
                          } else {
                            setPhone(e.target.value);
                            setEmail("");
                          }
                        }}
                        placeholder="user@educontest.uz yoki +998901234567"
                        className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold text-sm text-slate-900 dark:text-white focus:border-[#E8192C]"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* SINF TANLASH */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sinfga biriktirish</label>
                  <select
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold text-sm text-slate-900 dark:text-white"
                  >
                    <option value="">Sinf tanlanmadi (keyinroq biriktirish)</option>
                    {(classesData?.classes || []).map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.subject})</option>
                    ))}
                  </select>
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
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Qo'shish</span>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ONE-TIME CREDENTIALS DISPLAY MODAL */}
        {createdCredentials && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">O'quvchi yaratildi!</h3>
                  <p className="text-xs text-slate-400">Kirish ma'lumotlarini nusxalab o'quvchiga bering.</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2 text-xs font-mono">
                <div>Kirish manzili: <b>{createdCredentials.center_url}</b></div>
                <div>Login: <b className="text-[#E8192C]">{createdCredentials.login}</b></div>
                {createdCredentials.password && (
                  <div>Parol: <b className="text-emerald-600">{createdCredentials.password}</b></div>
                )}
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => copyCreds(`EduContest Kirish:\n${createdCredentials.center_url}\nLogin: ${createdCredentials.login}\nParol: ${createdCredentials.password || ''}`)}
                  className="w-full h-12 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  <span>Login ma'lumotlarini nusxalash</span>
                </button>

                <button
                  onClick={() => setCreatedCredentials(null)}
                  className="w-full h-10 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                >
                  Yopish (Parol boshqa ko'rsatilmaydi)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PASSWORD RESET RESULT MODAL */}
        {resetModalData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Parol yangilandi</h3>
              <p className="text-xs text-slate-400"><b>{resetModalData.name}</b> uchun yangi vaqtinchalik parol:</p>
              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-center text-base font-black text-emerald-600">
                {resetModalData.tempPass}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(resetModalData.tempPass);
                  toast({ title: "Nusxalandi" });
                  setResetModalData(null);
                }}
                className="w-full h-11 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl font-bold text-xs cursor-pointer"
              >
                Parolni nusxalash va yopish
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CenterStudents;
