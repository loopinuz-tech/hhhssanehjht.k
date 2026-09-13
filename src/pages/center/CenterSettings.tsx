import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Settings, Building2, Globe, Phone, Mail, MapPin,
  Image as ImageIcon, Palette, AlertCircle, Check, Copy,
  Save, Loader2, Sparkles, ExternalLink, ShieldAlert, UploadCloud
} from "lucide-react";
import SEO from "@/components/SEO";
import { useToast } from "@/hooks/use-toast";

interface CenterData {
  center: {
    id: string;
    name: string;
    legal_name?: string;
    username: string;
    logo_url?: string;
    phone?: string;
    email?: string;
    description?: string;
    address?: string;
    subjects?: string[];
    branding?: {
      primary_color?: string;
      accent_color?: string;
    };
    status: string;
  };
}

const COMMON_SUBJECTS = [
  "Matematika", "Ingliz tili", "Fizika", "Kimyo", "Biologiya",
  "Ona tili va adabiyot", "Tarix", "Geografiya", "Rus tili", "Informatika"
];

export default function CenterSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<CenterData>({
    queryKey: ["center-current"],
    queryFn: async () => {
      const res = await fetch("/api/center/current", { credentials: "include" });
      if (!res.ok) throw new Error("Markaz ma'lumotlarini yuklab bo'lmadi");
      return res.json();
    }
  });

  const center = data?.center;

  // Form states
  const [name, setName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#E8192C");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [customSubjectInput, setCustomSubjectInput] = useState("");

  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Logo file upload state
  const logoFileRef = useRef<HTMLInputElement>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [showLogoUrlInput, setShowLogoUrlInput] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Fayl formati noto'g'ri", description: "Faqat rasm fayllari (PNG, JPG, SVG, WebP) ruxsat etiladi", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Fayl hajmi katta", description: "Maksimal rasm hajmi 5MB", variant: "destructive" });
      return;
    }

    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch("/api/public/upload/center-logo", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Logotipni yuklab bo'lmadi");
      }

      setLogoUrl(data.url);
      toast({ title: "Logotip yuklandi! ✅", description: "Saqlash tugmasini bosib o'zgarishlarni tasdiqlang." });
    } catch (err: any) {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    } finally {
      setIsUploadingLogo(false);
      if (logoFileRef.current) logoFileRef.current.value = "";
    }
  };

  useEffect(() => {
    if (center) {
      setName(center.name || "");
      setLegalName(center.legal_name || "");
      setPhone(center.phone || "");
      setEmail(center.email || "");
      setAddress(center.address || "");
      setDescription(center.description || "");
      setLogoUrl(center.logo_url || "");
      setPrimaryColor(center.branding?.primary_color || "#E8192C");
      setSubjects(center.subjects || ["Matematika", "Ingliz tili"]);
    }
  }, [center]);

  const toggleSubject = (sub: string) => {
    if (subjects.includes(sub)) {
      setSubjects(subjects.filter((s) => s !== sub));
    } else {
      setSubjects([...subjects, sub]);
    }
  };

  const addCustomSubject = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && customSubjectInput.trim()) {
      e.preventDefault();
      const val = customSubjectInput.trim();
      if (!subjects.includes(val)) {
        setSubjects([...subjects, val]);
      }
      setCustomSubjectInput("");
    }
  };

  const handleCopyPublicUrl = () => {
    if (!center?.username) return;
    const url = `https://educontest.uz/c/${center.username}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast({ title: "Nusxalandi!", description: "Markaz portali havolasi nusxalandi" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: "Xatolik", description: "Markaz nomi bo'sh bo'lishi mumkin emas", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/center/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          legal_name: legalName.trim() || null,
          phone: phone.trim() || null,
          email: email.trim() || null,
          address: address.trim() || null,
          description: description.trim() || null,
          logo_url: logoUrl.trim() || null,
          subjects,
          branding: {
            primary_color: primaryColor
          }
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Sozlamalarni saqlashda xatolik");

      toast({ title: "Saqlandi!", description: "Markaz ma'lumotlari muvaffaqiyatli yangilandi" });
      queryClient.invalidateQueries({ queryKey: ["center-current"] });
    } catch (err: any) {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse max-w-4xl mx-auto pb-12">
        <div className="h-16 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
      </div>
    );
  }

  const publicUrl = center?.username ? `https://educontest.uz/c/${center.username}` : "";

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      <SEO title="Markaz sozlamalari | EduContest Markaz" description="Markaz ma'lumotlari va brending sozlamalari" />

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Markaz sozlamalari
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Markaz profili, kontakt ma'lumotlari, brending va rasmiy sahifa parametrlari
        </p>
      </div>

      {/* Public URL Box */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Markazning rasmiy portali (Login sahifasi)
            </h2>
          </div>
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            Sahifani ko'rish <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-sm text-slate-700 dark:text-slate-200 truncate select-all">
            {publicUrl}
          </div>
          <button
            type="button"
            onClick={handleCopyPublicUrl}
            className="px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center gap-2 transition-all shrink-0"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? "Nusxalandi" : "Havolani nusxalash"}
          </button>
        </div>

        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400">
          <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            Markaz takrorlanmas login havolasi (slug: <strong>@{center?.username}</strong>) doimiy hisoblanadi. O'quvchilar login xavfsizligi va tizim integratsiyasi uchun username o'zgartirish faqat EduContest bosh ma'muriyati orqali amalga oshiriladi.
          </span>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic Details */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-500" />
            Asosiy ma'lumotlar
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                Markaz nomi *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masalan: Alpha Learning Center"
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8192C]/20 focus:border-[#E8192C]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                Yuridik tashkilot nomi
              </label>
              <input
                type="text"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                placeholder={"Masalan: \"ALPHA TA'LIM\" MCHJ"}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8192C]/20 focus:border-[#E8192C]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                Aloqa telefoni
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+998 90 123 45 67"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8192C]/20 focus:border-[#E8192C]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                Rasmiy Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="info@alphacenter.uz"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8192C]/20 focus:border-[#E8192C]"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                Manzil / Joylashuv
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Toshkent sh., Yunusobod tumani, Amir Temur ko'chasi 105-uy"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8192C]/20 focus:border-[#E8192C]"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                Markaz haqida qisqacha ma'lumot
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Markazingiz haqida, o'quv dasturlari va o'quvchilar erishgan natijalar haqida..."
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8192C]/20 focus:border-[#E8192C] resize-none"
              />
            </div>
          </div>
        </div>

        {/* Subjects Selection */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            O'qitiladigan fanlar va yo'nalishlar
          </h2>
          <p className="text-xs text-slate-500">
            Markazingizda o'qitiladigan fanlarni tanlang yoki yangi fan yozib Enter bosing:
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            {COMMON_SUBJECTS.map((sub) => {
              const active = subjects.includes(sub);
              return (
                <button
                  type="button"
                  key={sub}
                  onClick={() => toggleSubject(sub)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                    active
                      ? "bg-[#E8192C] text-white shadow-sm shadow-red-500/20"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {active ? `✓ ${sub}` : `+ ${sub}`}
                </button>
              );
            })}
          </div>

          <div className="pt-2">
            <input
              type="text"
              value={customSubjectInput}
              onChange={(e) => setCustomSubjectInput(e.target.value)}
              onKeyDown={addCustomSubject}
              placeholder="Boshqa fan qo'shish uchun nomini yozib Enter tugmasini bosing..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-[#E8192C]/20 focus:border-[#E8192C]"
            />
          </div>
        </div>

        {/* Branding & Logo */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Palette className="w-5 h-5 text-emerald-500" />
            Brending va Tashqi ko'rinish
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                Markaz logotipi
              </label>

              <input
                type="file"
                ref={logoFileRef}
                onChange={handleLogoUpload}
                accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                className="hidden"
              />

              <div className="flex items-center gap-3">
                <div
                  onClick={() => logoFileRef.current?.click()}
                  className="w-14 h-14 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:border-[#E8192C] transition-colors group relative"
                  title="Kompyuterdan logotip tanlash"
                >
                  {isUploadingLogo ? (
                    <Loader2 className="w-5 h-5 animate-spin text-[#E8192C]" />
                  ) : logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Logo"
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                    />
                  ) : (
                    <UploadCloud className="w-5 h-5 text-slate-400 group-hover:text-[#E8192C] transition-colors" />
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={isUploadingLogo}
                      onClick={() => logoFileRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>{isUploadingLogo ? "Yuklanmoqda..." : logoUrl ? "Almashtirish" : "Kompyuterdan yuklash"}</span>
                    </button>

                    {logoUrl && (
                      <button
                        type="button"
                        onClick={() => setLogoUrl("")}
                        className="px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-100 transition-all cursor-pointer"
                      >
                        O'chirish
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowLogoUrlInput(!showLogoUrlInput)}
                      className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline cursor-pointer"
                    >
                      {showLogoUrlInput ? "Yashirish" : "URL orqali"}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    PNG, JPG yoki SVG formatdagi rasm (maksimal 5MB)
                  </p>
                </div>
              </div>

              {showLogoUrlInput && (
                <div className="mt-3 relative">
                  <ImageIcon className="w-4 h-4 text-slate-400 absolute left-4 top-3" />
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="w-full pl-11 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:border-[#E8192C]"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                Asosiy brend rangi
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-12 h-11 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer bg-transparent p-1"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#E8192C]/20 focus:border-[#E8192C]"
                />
              </div>
            </div>
          </div>

          {/* Preview Box */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Markaz kartasi ko'rinishi (Preview)
            </p>
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md overflow-hidden"
                style={{ backgroundColor: primaryColor }}
              >
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                  />
                ) : (
                  name ? name.slice(0, 2).toUpperCase() : "EC"
                )}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {name || "Markaz nomi"}
                </h3>
                <p className="text-xs text-slate-500">
                  @{center?.username || "username"} • {subjects.slice(0, 3).join(", ")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-[#E8192C] hover:bg-red-600 disabled:opacity-60 text-white font-bold text-sm shadow-xl shadow-red-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saqlanmoqda...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                O'zgarishlarni saqlash
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
