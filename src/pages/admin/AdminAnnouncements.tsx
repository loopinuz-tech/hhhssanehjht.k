import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SpeakerIcon } from "@solar-icons/react/bold-duotone/speaker";
import { AddCircleIcon as PlusCircleIcon } from "@solar-icons/react/bold-duotone/add-circle";
import { TrashBinMinimalisticIcon } from "@solar-icons/react/bold-duotone/trash-bin-minimalistic";
import { Pen2Icon } from "@solar-icons/react/bold-duotone/pen-2";
import { CloseSquareIcon } from "@solar-icons/react/bold-duotone/close-square";
import { SendSquareIcon } from "@solar-icons/react/bold-duotone/send-square";
import { RefreshIcon } from "@solar-icons/react/bold-duotone/refresh";
import { EyeIcon } from "@solar-icons/react/bold-duotone/eye";
import { EyeClosedIcon } from "@solar-icons/react/bold-duotone/eye-closed";
import { InfoCircleIcon } from "@solar-icons/react/bold-duotone/info-circle";
import { DangerTriangleIcon } from "@solar-icons/react/bold-duotone/danger-triangle";
import { CheckCircleIcon } from "@solar-icons/react/bold-duotone/check-circle";
import { DangerCircleIcon } from "@solar-icons/react/bold-duotone/danger-circle";

const TYPE_CONFIG: Record<string, { label: string; color: string; dot: string; icon: any }> = {
  info: { label: "Info", color: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400", dot: "bg-blue-500", icon: InfoCircleIcon },
  warning: { label: "Ogohlantirish", color: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400", dot: "bg-amber-500", icon: DangerTriangleIcon },
  success: { label: "Muvaffaqiyat", color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400", dot: "bg-emerald-500", icon: CheckCircleIcon },
  error: { label: "Xatolik", color: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400", dot: "bg-rose-500", icon: DangerCircleIcon },
};

const AdminAnnouncements = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", content: "", type: "info", is_active: true });
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ["admin-announcements"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("announcements").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const stats = useMemo(() => ({
    total: announcements.length,
    active: announcements.filter((a: any) => a.is_active).length,
  }), [announcements]);

  const filtered = useMemo(() => {
    if (filter === "active") return announcements.filter((a: any) => a.is_active);
    if (filter === "inactive") return announcements.filter((a: any) => !a.is_active);
    return announcements;
  }, [announcements, filter]);

  const upsertMutation = useMutation({
    mutationFn: async (payload: typeof form) => {
      const data = { title: payload.title, content: payload.content, type: payload.type, is_active: payload.is_active };
      if (editId) {
        const { error } = await (supabase as any).from("announcements").update(data).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("announcements").insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-announcements"] });
      toast({ title: editId ? "Yangilandi" : "Yaratildi" });
      closeModal();
    },
    onError: (e: any) => toast({ title: "Xatolik", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("announcements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-announcements"] });
      toast({ title: "O'chirildi" });
      setDeleteTarget(null);
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await (supabase as any).from("announcements").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-announcements"] }),
  });

  const closeModal = () => {
    setShowModal(false);
    setEditId(null);
    setForm({ title: "", content: "", type: "info", is_active: true });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center">
            <SpeakerIcon className="w-5 h-5 text-pink-500" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">E'lonlar</h1>
            <p className="text-[11px] text-slate-500">{stats.total} ta e'lon</p>
          </div>
        </div>
        <button
          onClick={() => { setForm({ title: "", content: "", type: "info", is_active: true }); setEditId(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-[#E8192C] text-white rounded-lg text-[12px] font-bold hover:opacity-90 transition-opacity"
        >
          <PlusCircleIcon className="w-4 h-4" /> Yangi e'lon
        </button>
      </div>

      {/* Filter */}
      <div className="flex bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-lg p-0.5 w-fit">
        {[
          { key: "all" as const, label: "Barchasi" },
          { key: "active" as const, label: "Faol" },
          { key: "inactive" as const, label: "Nofaol" },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
              filter === tab.key
                ? "bg-slate-900 dark:bg-white/10 text-white"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 dark:border-white/[0.06]">
              <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sarlavha</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tur</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kontent</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Holat</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sana</th>
              <th className="text-right px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Amallar</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-12"><RefreshIcon className="w-5 h-5 animate-spin text-slate-400 mx-auto" /></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12"><p className="text-sm text-slate-400">E'lonlar yo'q</p></td></tr>
            ) : filtered.map((a: any) => {
              const tc = TYPE_CONFIG[a.type] || TYPE_CONFIG.info;
              const Icon = tc.icon;
              return (
                <tr key={a.id} className="border-b border-slate-50 dark:border-white/[0.03] hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${tc.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[12px] font-semibold text-slate-900 dark:text-white truncate max-w-[180px]">{a.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${tc.color}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${tc.dot}`} />
                      {tc.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[11px] text-slate-500 truncate max-w-[200px]">{a.content}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive.mutate({ id: a.id, is_active: !a.is_active })}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase transition-colors ${
                        a.is_active
                          ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                          : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                      }`}
                    >
                      {a.is_active ? <EyeIcon className="w-3 h-3" /> : <EyeClosedIcon className="w-3 h-3" />}
                      {a.is_active ? "Faol" : "Nofaol"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-[11px] text-slate-400">
                    {new Date(a.created_at).toLocaleDateString("uz-UZ")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => { setForm({ title: a.title, content: a.content, type: a.type, is_active: a.is_active }); setEditId(a.id); setShowModal(true); }}
                        className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                      >
                        <Pen2Icon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(a.id)}
                        className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                      >
                        <TrashBinMinimalisticIcon className="w-3.5 h-3.5" />
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
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#0a0f1a] rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-slate-900 dark:text-white">
                {editId ? "E'lonni tahrirlash" : "Yangi e'lon"}
              </h2>
              <button onClick={closeModal} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5">
                <CloseSquareIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Sarlavha</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full h-10 px-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#E8192C]/20"
                  placeholder="E'lon sarlavhasi"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Kontent</label>
                <textarea
                  value={form.content}
                  onChange={e => setForm({ ...form, content: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-lg text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-[#E8192C]/20"
                  placeholder="E'lon matni..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tur</label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => setForm({ ...form, type: key })}
                      className={`h-9 rounded-lg text-[10px] font-bold transition-colors flex items-center justify-center gap-1 ${
                        form.type === key
                          ? "bg-slate-900 dark:bg-white/10 text-white"
                          : "bg-slate-100 dark:bg-white/[0.03] text-slate-400 hover:bg-slate-200"
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${form.type === key ? "bg-white" : cfg.dot}`} />
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Holat:</label>
                <button
                  onClick={() => setForm({ ...form, is_active: !form.is_active })}
                  className={`w-10 h-5 rounded-full transition-colors relative ${
                    form.is_active ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"
                  }`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${
                    form.is_active ? "translate-x-5" : "translate-x-0.5"
                  }`} />
                </button>
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                  {form.is_active ? "Faol" : "Nofaol"}
                </span>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
              <button onClick={closeModal} className="px-4 py-2 rounded-lg text-[12px] font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5">
                Bekor qilish
              </button>
              <button
                disabled={upsertMutation.isPending || !form.title || !form.content}
                onClick={() => upsertMutation.mutate(form)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E8192C] text-white text-[12px] font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {upsertMutation.isPending ? <RefreshIcon className="w-3.5 h-3.5 animate-spin" /> : <SendSquareIcon className="w-3.5 h-3.5" />}
                {editId ? "Yangilash" : "Yaratish"}
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
            <h3 className="text-[14px] font-bold text-slate-900 dark:text-white">E'lonni o'chirish</h3>
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
                {deleteMutation.isPending ? <RefreshIcon className="w-3.5 h-3.5 animate-spin" /> : "Ha, o'chirish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnnouncements;
