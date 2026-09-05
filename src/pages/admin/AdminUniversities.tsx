import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BuildingsIcon } from "@solar-icons/react/bold-duotone/buildings";
import { AddCircleIcon as PlusCircleIcon } from "@solar-icons/react/bold-duotone/add-circle";
import { TrashBinMinimalisticIcon } from "@solar-icons/react/bold-duotone/trash-bin-minimalistic";
import { Pen2Icon } from "@solar-icons/react/bold-duotone/pen-2";
import { CloseSquareIcon } from "@solar-icons/react/bold-duotone/close-square";
import { DisketteIcon } from "@solar-icons/react/bold-duotone/diskette";
import { RefreshIcon } from "@solar-icons/react/bold-duotone/refresh";
import { MagnifierIcon } from "@solar-icons/react/bold-duotone/magnifier";
import { GlobeIcon } from "@solar-icons/react/bold-duotone/globe";
import { PhoneCallingIcon } from "@solar-icons/react/bold-duotone/phone-calling";
import { MapPointSearchIcon } from "@solar-icons/react/bold-duotone/map-point-search";
import { ChatDotsIcon } from "@solar-icons/react/bold-duotone/chat-dots";
import { BookIcon } from "@solar-icons/react/bold-duotone/book";

interface UniForm {
  slug: string;
  name: string;
  url: string;
  logo_url: string;
  tavsif: string;
  telefon: string;
  website: string;
  manzil: string;
  telegram: string;
  instagram: string;
  yonalish_soni: string;
  kontrakt: string;
  qabul: string;
  talaba_soni: string;
  bitiruvchi_soni: string;
  tajriba_yili: string;
  yonalishlar: string;
}

const emptyForm: UniForm = {
  slug: "", name: "", url: "", logo_url: "", tavsif: "",
  telefon: "", website: "", manzil: "", telegram: "", instagram: "",
  yonalish_soni: "", kontrakt: "", qabul: "", talaba_soni: "",
  bitiruvchi_soni: "", tajriba_yili: "", yonalishlar: "[]",
};

const AdminUniversities = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<UniForm>({ ...emptyForm });
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const { data: universities = [], isLoading } = useQuery({
    queryKey: ["admin-universities"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("universities")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const filtered = universities.filter((u: any) =>
    u.name?.toLowerCase().includes(search.toLowerCase())
  );

  const createMut = useMutation({
    mutationFn: async (f: UniForm) => {
      let parsedYonalishlar: any[] = [];
      try { parsedYonalishlar = JSON.parse(f.yonalishlar || "[]"); } catch { parsedYonalishlar = []; }

      const { error } = await (supabase as any).from("universities").insert({
        slug: f.slug || f.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
        name: f.name,
        url: f.url,
        logo_url: f.logo_url,
        tavsif: f.tavsif,
        telefon: f.telefon,
        website: f.website,
        manzil: f.manzil,
        telegram: f.telegram,
        instagram: f.instagram,
        yonalish_soni: f.yonalish_soni,
        kontrakt: f.kontrakt,
        qabul: f.qabul,
        talaba_soni: f.talaba_soni,
        bitiruvchi_soni: f.bitiruvchi_soni,
        tajriba_yili: f.tajriba_yili,
        yonalishlar: parsedYonalishlar,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-universities"] });
      toast({ title: "Universitet qo'shildi!" });
      setShowForm(false);
      setForm({ ...emptyForm });
    },
    onError: (e: any) => toast({ title: "Xatolik", description: e.message, variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, ...f }: UniForm & { id: string }) => {
      let parsedYonalishlar: any[] = [];
      try { parsedYonalishlar = JSON.parse(f.yonalishlar || "[]"); } catch { parsedYonalishlar = []; }

      const { error } = await (supabase as any).from("universities").update({
        name: f.name,
        slug: f.slug || f.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
        url: f.url,
        logo_url: f.logo_url,
        tavsif: f.tavsif,
        telefon: f.telefon,
        website: f.website,
        manzil: f.manzil,
        telegram: f.telegram,
        instagram: f.instagram,
        yonalish_soni: f.yonalish_soni,
        kontrakt: f.kontrakt,
        qabul: f.qabul,
        talaba_soni: f.talaba_soni,
        bitiruvchi_soni: f.bitiruvchi_soni,
        tajriba_yili: f.tajriba_yili,
        yonalishlar: parsedYonalishlar,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-universities"] });
      toast({ title: "Yangilandi!" });
      setShowForm(false);
      setEditId(null);
      setForm({ ...emptyForm });
    },
    onError: (e: any) => toast({ title: "Xatolik", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("universities").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-universities"] });
      toast({ title: "O'chirildi!" });
      setDeleteTarget(null);
    },
    onError: (e: any) => toast({ title: "Xatolik", description: e.message, variant: "destructive" }),
  });

  const handleEdit = (u: any) => {
    let yonalishlarStr = "[]";
    if (Array.isArray(u.yonalishlar)) {
      try { yonalishlarStr = JSON.stringify(u.yonalishlar, null, 2); } catch { yonalishlarStr = "[]"; }
    }
    setForm({
      slug: u.slug || "",
      name: u.name || "",
      url: u.url || "",
      logo_url: u.logo_url || "",
      tavsif: u.tavsif || "",
      telefon: u.telefon || "",
      website: u.website || "",
      manzil: u.manzil || "",
      telegram: u.telegram || "",
      instagram: u.instagram || "",
      yonalish_soni: u.yonalish_soni || "",
      kontrakt: u.kontrakt || "",
      qabul: u.qabul || "",
      talaba_soni: u.talaba_soni || "",
      bitiruvchi_soni: u.bitiruvchi_soni || "",
      tajriba_yili: u.tajriba_yili || "",
      yonalishlar: yonalishlarStr,
    });
    setEditId(u.id);
    setShowForm(true);
  };

  const handleSubmit = () => {
  const { t } = useTranslation();
    if (!form.name.trim()) return toast({ title: "Nom kiritish shart!", variant: "destructive" });
    if (editId) {
      updateMut.mutate({ ...form, id: editId });
    } else {
      createMut.mutate(form);
    }
  };

  const handleNameChange = (val: string) => {
    setForm((prev) => ({
      ...prev,
      name: val,
      slug: prev.slug === ""
        ? val.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
        : prev.slug,
    }));
  };

  const inputCls =
    "w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[13px] font-medium focus:outline-none focus:border-[#E8192C]/50 dark:text-white transition-colors";
  const labelCls = "text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1 block";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#E8192C]/10 flex items-center justify-center">
            <BuildingsIcon className="w-4.5 h-4.5 text-[#E8192C]" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Universitetlar</h1>
            <p className="text-[11px] font-medium text-slate-400">{universities.length} ta</p>
          </div>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm({ ...emptyForm }); }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: "#E8192C" }}
        >
          <PlusCircleIcon className="w-4 h-4" /> Yangi universitet
        </button>
      </div>

      {/* Search + Stats */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <MagnifierIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Qidirish..."
            className={inputCls + " !pl-9"}
          />
        </div>
        <div className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl px-4 py-2.5 flex items-center gap-2">
          <BuildingsIcon className="w-4 h-4 text-[#E8192C]" />
          <span className="text-[13px] font-semibold text-slate-900 dark:text-white">{filtered.length}</span>
          <span className="text-[12px] text-slate-400">jami universitetlar</span>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[5vh] overflow-y-auto">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setShowForm(false); setEditId(null); }} />
          <div className="relative bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-2xl w-full max-w-2xl mx-4 mb-8 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/[0.06]">
              <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white">
                {editId ? "Tahrirlash" : "Yangi universitet"}
              </h2>
              <button onClick={() => { setShowForm(false); setEditId(null); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                <CloseSquareIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelCls}>Nomi *</label>
                  <input value={form.name} onChange={(e) => handleNameChange(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Slug</label>
                  <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="avtomatik" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Logo URL</label>
                  <input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>URL</label>
                  <input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Telefon</label>
                  <input value={form.telefon} onChange={(e) => setForm({ ...form, telefon: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Website</label>
                  <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Manzil</label>
                  <input value={form.manzil} onChange={(e) => setForm({ ...form, manzil: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Telegram</label>
                  <input value={form.telegram} onChange={(e) => setForm({ ...form, telegram: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Instagram</label>
                  <input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Yo'nalishlar soni</label>
                  <input value={form.yonalish_soni} onChange={(e) => setForm({ ...form, yonalish_soni: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Kontrakt</label>
                  <input value={form.kontrakt} onChange={(e) => setForm({ ...form, kontrakt: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Qabul</label>
                  <input value={form.qabul} onChange={(e) => setForm({ ...form, qabul: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Talabalar soni</label>
                  <input value={form.talaba_soni} onChange={(e) => setForm({ ...form, talaba_soni: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Bitiruvchilar</label>
                  <input value={form.bitiruvchi_soni} onChange={(e) => setForm({ ...form, bitiruvchi_soni: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Tajriba (yil)</label>
                  <input value={form.tajriba_yili} onChange={(e) => setForm({ ...form, tajriba_yili: e.target.value })} className={inputCls} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Tavsif</label>
                  <textarea rows={3} value={form.tavsif} onChange={(e) => setForm({ ...form, tavsif: e.target.value })}
                    className={inputCls + " !h-auto !py-2 resize-none"} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Yo'nalishlar (JSON)</label>
                  <textarea rows={5} value={form.yonalishlar} onChange={(e) => setForm({ ...form, yonalishlar: e.target.value })}
                    placeholder='["IT", "Tibbiyot", "Iqtisodiyot"]'
                    className={inputCls + " !h-auto !py-2 resize-none font-mono text-[12px]"} />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 px-6 py-4 border-t border-slate-200 dark:border-white/[0.06]">
              <button onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: "#E8192C" }}>
                {(createMut.isPending || updateMut.isPending) && <RefreshIcon className="w-4 h-4 animate-spin" />}
                <DisketteIcon className="w-4 h-4" /> {editId ? "Saqlash" : "Qo'shish"}
              </button>
              <button onClick={() => { setShowForm(false); setEditId(null); }}
                className="px-5 py-2 rounded-xl text-[13px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                Bekor qilish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-2xl w-full max-w-sm mx-4 p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <TrashBinMinimalisticIcon className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white">O'chirishni tasdiqlash</h3>
                <p className="text-[12px] text-slate-400 mt-0.5">Bu amal qaytarib bo'lmaydi</p>
              </div>
            </div>
            <p className="text-[13px] text-slate-600 dark:text-slate-400 mb-5">
              <span className="font-semibold text-slate-900 dark:text-white">{deleteTarget.name}</span> universitetini o'chirmoqchimisiz?
            </p>
            <div className="flex items-center gap-2 justify-end">
              <button onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl text-[13px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                Bekor qilish
              </button>
              <button onClick={() => deleteMut.mutate(deleteTarget.id)} disabled={deleteMut.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50">
                {deleteMut.isPending && <RefreshIcon className="w-4 h-4 animate-spin" />}
                O'chirish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cards Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-[#E8192C]/20 border-t-[#E8192C] rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-[13px]">
          {search ? "Hech narsa topilmadi" : "Universitetlar yo'q"}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((u: any) => (
            <div key={u.id} className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl p-4 space-y-3 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {u.logo_url ? (
                    <img src={u.logo_url} alt="" className="w-full h-full object-contain p-1" />
                  ) : (
                    <span className="text-base font-bold text-slate-300 dark:text-slate-600">{u.name?.charAt(0)}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-slate-900 dark:text-white truncate">{u.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{u.slug}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-[12px] text-slate-400">
                {u.yonalish_soni && (
                  <span className="inline-flex items-center gap-1">
                    <BookIcon className="w-3.5 h-3.5" />
                    {u.yonalish_soni} yo'nalish
                  </span>
                )}
                {u.kontrakt && (
                  <span className="inline-flex items-center gap-1">
                    <GlobeIcon className="w-3.5 h-3.5" />
                    {u.kontrakt}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-white/[0.06]">
                <button onClick={() => handleEdit(u)}
                  className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-[#E8192C] transition-colors">
                    <Pen2Icon className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setDeleteTarget({ id: u.id, name: u.name })}
                  className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors">
                    <TrashBinMinimalisticIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminUniversities;
