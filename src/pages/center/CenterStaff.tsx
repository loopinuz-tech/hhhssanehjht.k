import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  UserCheck, Plus, Search, ShieldCheck, Trash2,
  Check, X, Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";

interface StaffItem {
  id: string;
  user_id: string;
  role: string;
  status: string;
  profile: {
    full_name?: string;
    email?: string;
    phone?: string;
  };
  permissions: string[];
  assigned_classes: string[];
}

const AVAILABLE_PERMS = [
  { key: "CREATE_TEST", label: "Test yaratish", desc: "Yangi mock testlarni yaratish huquqi" },
  { key: "EDIT_TEST", label: "Testni tahrirlash", desc: "Mavjud test sozlamalarini o'zgartirish" },
  { key: "DELETE_TEST", label: "Testni o'chirish", desc: "Testlarni arxivlash yoki o'chirish" },
  { key: "MANAGE_STUDENTS", label: "O'quvchilarni boshqarish", desc: "O'quvchi qo'shish, parolni tiklash, so'rovlarni qabul qilish" },
  { key: "MANAGE_CLASSES", label: "Sinflarni boshqarish", desc: "Yangi sinflar ochish va tahrirlash" },
  { key: "VIEW_RESULTS", label: "Natijalarni ko'rish", desc: "Imtihon natijalari va statistikani ko'rish" },
  { key: "VIEW_ANALYTICS", label: "Tahlillarni ko'rish", desc: "Markaz umumiy statistikasi" },
  { key: "MANAGE_STAFF", label: "Hodimlarni boshqarish", desc: "Boshqa o'qituvchilarni qo'shish va huquq berish" },
  { key: "MANAGE_TELEGRAM", label: "Telegram boshqaruvi", desc: "Telegram botni ulash va sozlash" },
  { key: "MANAGE_SUBSCRIPTION", label: "Obuna va to'lovlar", desc: "Tariflarni ko'rish va to'lov qilish" },
];

const CenterStaff = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedPerms, setSelectedPerms] = useState<string[]>([
    "CREATE_TEST", "EDIT_TEST", "MANAGE_STUDENTS", "VIEW_RESULTS"
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, isLoading } = useQuery<{ staff: StaffItem[] }>({
    queryKey: ["center-staff"],
    queryFn: async () => {
      const res = await fetch("/api/center/staff", { credentials: "include" });
      if (!res.ok) throw new Error("Hodimlarni yuklab bo'lmadi");
      return res.json();
    }
  });

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrPhone.trim()) {
      toast({ title: "Xatolik", description: "Email yoki telefon raqamini kiriting", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/center/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email_or_phone: emailOrPhone.trim(),
          full_name: fullName.trim() || undefined,
          permissions: selectedPerms
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Xodim qo'shishda xatolik");

      toast({ title: "Muvaffaqiyatli!", description: "Xodim markazga biriktirildi" });
      setCreateModalOpen(false);
      setEmailOrPhone("");
      setFullName("");
      queryClient.invalidateQueries({ queryKey: ["center-staff"] });
    } catch (err: any) {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveStaff = async (id: string, name: string) => {
    if (!confirm(`Haqiqatan ham "${name}"ni xodimlar safidan chiqarmoqchimisiz?`)) return;
    try {
      const res = await fetch(`/api/center/staff/${id}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (!res.ok) throw new Error("O'chirishda xatolik");

      toast({ title: "O'chirildi", description: "Xodim chiqarildi" });
      queryClient.invalidateQueries({ queryKey: ["center-staff"] });
    } catch (err: any) {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    }
  };

  const staffList = data?.staff || [];

  return (
    <>
      <SEO title="Hodimlar — Markaz boshqaruvi" />
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Hodimlar va O'qituvchilar</h2>
            <p className="text-sm text-slate-500 font-medium">
              O'qituvchilarga markaz boshqaruvidagi alohida vazifalar uchun ruxsatlar bering.
            </p>
          </div>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-5 py-2.5 bg-[#E8192C] hover:bg-[#D41524] text-white rounded-2xl font-bold text-sm flex items-center gap-2 transition-all shadow-md shadow-red-500/20 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Hodim qo'shish</span>
          </button>
        </div>

        {/* STAFF TABLE */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
          {isLoading ? (
            <div className="p-8 space-y-3 animate-pulse">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800 rounded-xl" />
              ))}
            </div>
          ) : staffList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider font-bold text-slate-400">
                  <tr>
                    <th className="py-3.5 px-6">Hodim</th>
                    <th className="py-3.5 px-4">Aloqa</th>
                    <th className="py-3.5 px-4">Ruxsatlar</th>
                    <th className="py-3.5 px-6 text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {staffList.map((st) => {
                    const name = st.profile?.full_name || "O'qituvchi";
                    return (
                      <tr key={st.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-950/30 text-violet-600 font-bold text-xs flex items-center justify-center shrink-0">
                              {name[0].toUpperCase()}
                            </div>
                            <div>
                              <div>{name}</div>
                              <div className="text-xs text-slate-400 font-normal">O'qituvchi / Hodim</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
                          {st.profile?.phone || st.profile?.email || "—"}
                        </td>

                        <td className="py-4 px-4">
                          <div className="flex flex-wrap gap-1 max-w-md">
                            {st.permissions.map((p) => (
                              <span key={p} className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md">
                                {p}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleRemoveStaff(st.id, name)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                            title="Xodimni chiqarish"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
                <UserCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Hodimlar biriktirilmagan</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Markazingizga o'qituvchi yoki administratorlarni biriktirish uchun "+ Hodim qo'shish" tugmasini bosing.
              </p>
            </div>
          )}
        </div>

        {/* ADD STAFF MODAL */}
        {createModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Yangi hodim qo'shish</h3>
                <button
                  onClick={() => setCreateModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddStaff} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">F.I.Sh. *</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alisher Zokirov"
                    className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold text-sm text-slate-900 dark:text-white focus:border-[#E8192C]"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email yoki Telefon *</label>
                  <input
                    type="text"
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    placeholder="alisher@gmail.com yoki +998901234567"
                    className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold text-sm text-slate-900 dark:text-white focus:border-[#E8192C]"
                    required
                  />
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ruxsatlar va Huquqlar</label>
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {AVAILABLE_PERMS.map((p) => {
                      const isChecked = selectedPerms.includes(p.key);
                      return (
                        <label
                          key={p.key}
                          className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                            isChecked
                              ? "border-[#E8192C] bg-red-50/20 dark:bg-red-950/20"
                              : "border-slate-200 dark:border-slate-800"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPerms([...selectedPerms, p.key]);
                              } else {
                                setSelectedPerms(selectedPerms.filter(k => k !== p.key));
                              }
                            }}
                            className="w-4 h-4 mt-0.5 rounded text-[#E8192C] focus:ring-[#E8192C]"
                          />
                          <div>
                            <div className="text-xs font-bold text-slate-900 dark:text-white">{p.label}</div>
                            <div className="text-[11px] text-slate-400">{p.desc}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl font-semibold text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 cursor-pointer"
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
      </div>
    </>
  );
};

export default CenterStaff;
