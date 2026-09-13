import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { BookBookmarkIcon } from "@solar-icons/react/bold-duotone/book-bookmark";
import { DatabaseIcon } from "@solar-icons/react/bold-duotone/database";
import { DocumentTextIcon } from "@solar-icons/react/bold-duotone/document-text";
import { VideocameraIcon } from "@solar-icons/react/bold-duotone/videocamera";
import { BoltIcon } from "@solar-icons/react/bold-duotone/bolt";
import { MagnifierIcon } from "@solar-icons/react/bold-duotone/magnifier";
import { MagnifierZoomInIcon } from "@solar-icons/react/bold-duotone/magnifier-zoom-in";
import { MagnifierZoomOutIcon } from "@solar-icons/react/bold-duotone/magnifier-zoom-out";
import { LockIcon } from "@solar-icons/react/bold-duotone/lock";
import { CrownIcon } from "@solar-icons/react/bold-duotone/crown";
import { EyeIcon } from "@solar-icons/react/bold-duotone/eye";
import { LayersIcon } from "@solar-icons/react/bold-duotone/layers";
import { CodeIcon } from "@solar-icons/react/bold-duotone/code";
import { StarsIcon } from "@solar-icons/react/bold-duotone/stars";
import { ShieldCheckIcon } from "@solar-icons/react/bold-duotone/shield-check";
import { CheckCircleIcon } from "@solar-icons/react/bold-duotone/check-circle";
import { AltArrowLeftIcon } from "@solar-icons/react/bold-duotone/alt-arrow-left";
import { AltArrowRightIcon } from "@solar-icons/react/bold-duotone/alt-arrow-right";
import { RestartIcon } from "@solar-icons/react/bold-duotone/restart";
import { FileDownloadIcon } from "@solar-icons/react/bold-duotone/file-download";
import { CloseCircleIcon } from "@solar-icons/react/bold-duotone/close-circle";
import { LinkIcon } from "@solar-icons/react/bold-duotone/link";
import { DiplomaIcon } from "@solar-icons/react/bold-duotone/diploma";
import { FlameIcon } from "@solar-icons/react/bold-duotone/flame";
import { GlobalIcon } from "@solar-icons/react/bold-duotone/global";
import { AtomIcon } from "@solar-icons/react/bold-duotone/atom";
import { DnaIcon } from "@solar-icons/react/bold-duotone/dna";
import { CompassBigIcon } from "@solar-icons/react/bold-duotone/compass-big";
import { CodeSquareIcon } from "@solar-icons/react/bold-duotone/code-square";
import { HistoryIcon } from "@solar-icons/react/bold-duotone/history";
import { motion, AnimatePresence } from "framer-motion";
import SEO from "@/components/SEO";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { rewriteStorageUrl } from "@/lib/storage";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { id: "all", label: "Barcha resurslar", icon: BookBookmarkIcon, color: "#E8192C" },
  { id: "savollar_bazasi", label: "Savollar bazasi", icon: DatabaseIcon, color: "#2563eb" },
  { id: "o_quv_qo_llanmalari", label: "Metodik qo'llanmalar", icon: DocumentTextIcon, color: "#10b981" },
  { id: "darslar", label: "Video darslar", icon: VideocameraIcon, color: "#7c3aed" },
  { id: "qisqa_qo_llanmalar", label: "Qisqa konspektlar", icon: BoltIcon, color: "#f59e0b" },
];

const SUBJECTS = [
  "Barcha fanlar", "Matematika", "Ona tili va Adabiyot", "Fizika",
  "Biologiya", "Informatika", "Tarix", "Kimyo", "Ingliz tili"
];

const SUBJECT_THEMES: Record<string, { bg: string; text: string; gradient: string; icon: any }> = {
  Matematika: { bg: "#E8192C", text: "Matematika", gradient: "from-[#E8192C] via-[#c41420] to-[#990f19]", icon: CompassBigIcon },
  Fizika: { bg: "#0891b2", text: "Fizika", gradient: "from-[#0891b2] via-[#0e7490] to-[#164e63]", icon: AtomIcon },
  Biologiya: { bg: "#16a34a", text: "Biologiya", gradient: "from-[#16a34a] via-[#15803d] to-[#14532d]", icon: DnaIcon },
  Informatika: { bg: "#7c3aed", text: "Informatika", gradient: "from-[#7c3aed] via-[#6d28d9] to-[#4c1d95]", icon: CodeSquareIcon },
  "Ona tili": { bg: "#d97706", text: "Ona tili", gradient: "from-[#d97706] via-[#b45309] to-[#78350f]", icon: DocumentTextIcon },
  "Ona tili va Adabiyot": { bg: "#9333ea", text: "Ona tili va Adabiyot", gradient: "from-[#9333ea] via-[#7e22ce] to-[#581c87]", icon: DocumentTextIcon },
  Tarix: { bg: "#dc2626", text: "Tarix", gradient: "from-[#dc2626] via-[#b91c1c] to-[#7f1d1d]", icon: HistoryIcon },
  Adabiyot: { bg: "#db2777", text: "Adabiyot", gradient: "from-[#db2777] via-[#be185d] to-[#831843]", icon: BookBookmarkIcon },
  Kimyo: { bg: "#059669", text: "Kimyo", gradient: "from-[#059669] via-[#047857] to-[#064e3b]", icon: AtomIcon },
  "Ingliz tili": { bg: "#2563eb", text: "Ingliz tili", gradient: "from-[#2563eb] via-[#1d4ed8] to-[#1e3a8a]", icon: GlobalIcon },
};

/* ── Subscription Dialog ───────────────────────────────── */
function SubscriptionDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const navigate = useNavigate();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-24px)] sm:max-w-md p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
        <div className="bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center mx-auto mb-4 backdrop-blur-md shadow-lg">
              <CrownIcon size={32} className="text-white" />
            </div>
            <h2 className="text-xl font-black text-white mb-1">PRO Eksklyuziv Resurs</h2>
            <p className="text-amber-100 text-xs font-medium">Ushbu qo'llanma EduContest PRO foydalanuvchilari uchun mo'ljallangan</p>
          </div>
        </div>
        <div className="p-6 bg-white dark:bg-slate-900 space-y-5">
          <div className="space-y-3">
            {[
              "Barcha eksklyuziv metodik qo'llanmalar",
              "Yuklab olish uchun maxsus PDF fayllar",
              "AI Mentor va cheksiz imtihonlar",
              "Rasmiy sertifikatlar va tahlillar"
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5.5 h-5.5 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                  <CheckCircleIcon size={16} className="text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{text}</span>
              </div>
            ))}
          </div>
          <div className="space-y-2 pt-2">
            <button
              onClick={() => { onOpenChange(false); navigate("/settings/obuna"); }}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-2xl text-xs font-black transition-all shadow-lg active:scale-95 cursor-pointer"
            >
              Hozir Obuna Bo'lish
            </button>
            <button
              onClick={() => onOpenChange(false)}
              className="w-full py-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold transition-all cursor-pointer"
            >
              Bekor qilish
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Fullscreen Resource Viewer Modal ──────────────────── */
function ResourceViewer({ resource, onClose, onNext, onPrev, hasNext, hasPrev }: {
  resource: any; onClose: () => void; onNext: () => void; onPrev: () => void; hasNext: boolean; hasPrev: boolean;
}) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [is404Error, setIs404Error] = useState(false);
  const [isCheckingFile, setIsCheckingFile] = useState(true);

  useEffect(() => {
    setZoom(1);
    setRotation(0);
    setIs404Error(false);
    setIsCheckingFile(true);

    if (!resource.file_url) {
      setIsCheckingFile(false);
      return;
    }
    setIsCheckingFile(false);
  }, [resource.id]);

  const handleZoom = (delta: number) => setZoom(prev => Math.min(Math.max(0.6, prev + delta), 3));

  const handleDownload = async () => {
    if (!resource.file_url) return;
    try {
      const targetUrl = rewriteStorageUrl(resource.file_url);
      const response = await fetch(targetUrl);
      if (!response.ok) {
        alert("Kechirasiz, ushbu fayl serverda topilmadi.");
        return;
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${resource.title || "qollanma"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(rewriteStorageUrl(resource.file_url), "_blank");
    }
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && hasNext) onNext();
      if (e.key === 'ArrowLeft' && hasPrev) onPrev();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', handleKey); document.body.style.overflow = ''; };
  }, [onClose, onNext, onPrev, hasNext, hasPrev]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md flex flex-col"
    >
      {/* Top Controls Bar */}
      <div className="h-16 border-b border-slate-800 flex items-center justify-between px-3 sm:px-6 bg-slate-900/90 shrink-0">
        <div className="flex items-center gap-3 min-w-0 pr-2">
          <button
            onClick={onClose}
            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-2xl bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer shrink-0"
          >
            <AltArrowLeftIcon size={20} />
          </button>
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-black text-white truncate">{resource.title}</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{resource.subject_name}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {!is404Error && (
            <div className="hidden sm:flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700">
              <button onClick={() => handleZoom(-0.2)} className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors cursor-pointer">
                <MagnifierZoomOutIcon size={18} />
              </button>
              <span className="px-2 text-xs font-black w-12 text-center tabular-nums text-white">{Math.round(zoom * 100)}%</span>
              <button onClick={() => handleZoom(0.2)} className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors cursor-pointer">
                <MagnifierZoomInIcon size={18} />
              </button>
            </div>
          )}

          {!is404Error && (
            <button
              onClick={() => setRotation(r => r + 90)}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              title="Aylantirish"
            >
              <RestartIcon size={18} />
            </button>
          )}

          {!is404Error && (
            <button
              onClick={handleDownload}
              className="px-3 sm:px-4 h-9 sm:h-10 flex items-center gap-2 rounded-xl bg-[#E8192C] hover:bg-[#C8001A] text-white text-xs font-bold shadow-lg transition-all cursor-pointer"
            >
              <FileDownloadIcon size={18} />
              <span className="hidden sm:inline">Yuklab olish</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-colors cursor-pointer"
          >
            <CloseCircleIcon size={20} />
          </button>
        </div>
      </div>

      {/* Main Viewer Canvas */}
      <div className="flex-1 relative flex items-center justify-center p-3 sm:p-6 overflow-hidden">
        {hasPrev && (
          <button
            onClick={onPrev}
            className="absolute left-2 sm:left-4 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-white flex items-center justify-center shadow-2xl backdrop-blur-md transition-all cursor-pointer"
          >
            <AltArrowLeftIcon size={22} />
          </button>
        )}

        {hasNext && (
          <button
            onClick={onNext}
            className="absolute right-2 sm:right-4 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-white flex items-center justify-center shadow-2xl backdrop-blur-md transition-all cursor-pointer"
          >
            <AltArrowRightIcon size={22} />
          </button>
        )}

        <div
          className="w-full h-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex items-center justify-center relative"
          style={{ transform: `scale(${zoom}) rotate(${rotation}deg)`, transition: "transform 0.2s ease" }}
        >
          {isCheckingFile ? (
            <div className="flex flex-col items-center gap-3 p-8">
              <div className="w-10 h-10 border-4 border-[#E8192C] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-bold text-slate-400 animate-pulse">Resurs yuklanmoqda...</p>
            </div>
          ) : is404Error ? (
            <div className="p-6 sm:p-12 text-center max-w-md space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
                <DocumentTextIcon size={32} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-white">Fayl Topilmadi (404)</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Ushbu qo'llanma server xotirasidan o'chirilgan yoki manzili eskirgan bo'lishi mumkin.
                </p>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
                {hasNext && (
                  <button
                    onClick={onNext}
                    className="px-5 py-2.5 bg-[#E8192C] text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Keyingi Qo'llanmaga O'tish
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Yopish
                </button>
              </div>
            </div>
          ) : resource.file_url ? (
            (() => {
              const rawUrl = rewriteStorageUrl(resource.file_url);
              const isImage = /\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i.test(rawUrl);
              const docsViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(rawUrl)}&embedded=true`;

              if (isImage) {
                return (
                  <img
                    src={rawUrl}
                    alt={resource.title}
                    className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-lg"
                  />
                );
              }

              return (
                <div className="w-full h-full min-h-[75vh] relative flex flex-col items-center justify-center">
                  <iframe
                    src={docsViewerUrl}
                    className="w-full h-full min-h-[75vh] border-0 rounded-3xl"
                    title={resource.title}
                    onError={() => setIs404Error(true)}
                  />
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-4 py-2 rounded-2xl shadow-xl flex items-center gap-3 text-xs z-30">
                    <span className="text-slate-300 font-medium hidden sm:inline">Katta formatda ko'rish:</span>
                    <a
                      href={rawUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1.5 hover:underline"
                    >
                      <LinkIcon size={14} />
                      Yangi oynada ochish
                    </a>
                    <span className="text-slate-600">•</span>
                    <button
                      onClick={handleDownload}
                      className="text-[#E8192C] hover:text-red-400 font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileDownloadIcon size={14} />
                      Yuklab olish
                    </button>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="p-8 text-center">
              <DocumentTextIcon size={56} className="text-slate-500 mx-auto mb-3" />
              <p className="text-sm font-bold text-white mb-2">{resource.title}</p>
              <button
                onClick={handleDownload}
                className="px-6 py-3 bg-[#E8192C] text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
              >
                <FileDownloadIcon size={18} /> Faylni Yuklab Olish
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ── VISUAL BOOK / DOCUMENT COVER PREVIEW COMPONENT ────── */
function VisualBookCover({ item }: { item: any }) {
  const theme = SUBJECT_THEMES[item.subject_name] || {
    bg: "#64748b",
    gradient: "from-slate-700 via-slate-800 to-slate-900",
    icon: DocumentTextIcon
  };

  const IconComponent = theme.icon || DocumentTextIcon;

  // If a real thumbnail image exists, show it!
  if (item.thumbnail_url || (item.file_url && item.file_url.match(/\.(jpg|jpeg|png|webp|gif)/i))) {
    const imgSrc = rewriteStorageUrl(item.thumbnail_url || item.file_url);
    return (
      <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-md group-hover:shadow-2xl transition-all duration-300 border border-slate-200/60 dark:border-slate-800">
        <img src={imgSrc} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
      </div>
    );
  }

  // Generate realistic 3D printed book cover graphic
  return (
    <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-lg group-hover:shadow-2xl group-hover:scale-[1.03] transition-all duration-300 border border-white/20 select-none">
      {/* Gradient Cover Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} p-4 flex flex-col justify-between text-white`}>
        
        {/* Decorative Grid & Gloss Texture */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        {/* Book Spine Texture Left Edge */}
        <div className="absolute top-0 bottom-0 left-0 w-3.5 bg-black/30 border-r border-white/20" />

        {/* Top Header Label */}
        <div className="relative z-10 pl-2.5 flex items-center justify-between">
          <span className="px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-md text-[9px] font-black uppercase tracking-widest border border-white/25">
            PDF Qo'llanma
          </span>
          <IconComponent className="w-5 h-5 text-white/90" />
        </div>

        {/* Center Title Card */}
        <div className="relative z-10 pl-2.5 pr-1 space-y-2 my-auto">
          <div className="w-8 h-1 bg-amber-400 rounded-full mb-1" />
          <h4 className="text-xs sm:text-sm font-black text-white leading-snug drop-shadow-md line-clamp-3">
            {item.title}
          </h4>
          <p className="text-[10px] text-white/80 font-bold uppercase tracking-wider">
            {item.subject_name || "Metodika"}
          </p>
        </div>

        {/* Bottom Publisher Footer */}
        <div className="relative z-10 pl-2.5 pt-2 border-t border-white/20 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <ShieldCheckIcon size={14} className="text-amber-300" />
            <span className="text-[9px] font-black tracking-wider text-white/90">EduContest 2026</span>
          </div>
          <span className="text-[8px] font-extrabold text-white/70 uppercase">Rasmiy</span>
        </div>

        {/* Hover Eye Overlay */}
        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20">
          <div className="w-12 h-12 rounded-2xl bg-white text-[#E8192C] flex items-center justify-center shadow-2xl transform scale-75 group-hover:scale-100 transition-transform">
            <EyeIcon size={24} />
          </div>
        </div>

      </div>
    </div>
  );
}

/* ── Main Qollanmalar Component ────────────────────────── */
const Qollanmalar = () => {
  const { profile } = useAuth();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState("Barcha fanlar");
  const [selectedResource, setSelectedResource] = useState<any>(null);
  const [showSubModal, setShowSubModal] = useState(false);

  const isPremium = !!(profile?.subscription_tier && profile.subscription_tier !== 'standart') || !!(profile?.is_lifetime);

  // Fetch guides from Supabase tables
  const { data: dbResources, isLoading } = useQuery({
    queryKey: ["qollanmalar-db-v4"],
    queryFn: async () => {
      try {
        const [res1, res2, res3] = await Promise.all([
          (supabase as any).from("subject_resources").select("*").order("created_at", { ascending: false }),
          (supabase as any).from("materials").select("*").order("created_at", { ascending: false }),
          (supabase as any).from("resources").select("*").order("created_at", { ascending: false }),
        ]);

        const list1 = res1.data || [];
        const list2 = (res2.data || []).map((m: any) => ({
          id: `mat-${m.id}`,
          title: m.title || m.file_name,
          subject_name: m.category || "Umumiy",
          category: "o_quv_qo_llanmalari",
          file_url: m.file_url,
          is_premium: false,
          views_count: 850,
          downloads_count: 320
        }));
        const list3 = res3.data || [];

        return [...list1, ...list2, ...list3];
      } catch (err) {
        console.error("Qollanmalar fetch error:", err);
        return [];
      }
    },
    staleTime: 30000,
  });

  const allResources = useMemo(() => {
    return dbResources || [];
  }, [dbResources]);

  // Filtered resources
  const filtered = useMemo(() => {
    return allResources.filter((r: any) => {
      if (selectedSubject !== "Barcha fanlar" && !r.subject_name?.includes(selectedSubject)) return false;
      if (activeCategory !== "all" && r.category !== activeCategory) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          r.title?.toLowerCase().includes(q) ||
          r.subject_name?.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allResources, selectedSubject, activeCategory, search]);

  const featuredList = useMemo(() => {
    return allResources.slice(0, 3);
  }, [allResources]);

  const currentIdx = selectedResource ? filtered.findIndex(r => r.id === selectedResource.id) : -1;
  const hasNext = currentIdx !== -1 && currentIdx < filtered.length - 1;
  const hasPrev = currentIdx !== -1 && currentIdx > 0;

  const handleOpenResource = (r: any) => {
    if (r.is_premium && !isPremium) {
      setShowSubModal(true);
    } else {
      setSelectedResource(r);
    }
  };

  return (
    <>
      <SEO
        title="O'quv qo'llanmalar va Metodik Resurslar — EduContest"
        description="Ona tili, Matematika, Fizika va boshqa fanlar bo'yicha bepul metodik qo'llanmalar, formulalar va attestatsiya materiallari."
      />

      {/* CANVAS */}
      <div className="w-full min-h-screen bg-[#F5F5F7] dark:bg-[#050B10] text-slate-900 dark:text-slate-100 transition-colors pb-24">
        
        {/* CONTAINER */}
        <div className="w-full px-3 sm:px-6 lg:px-10 pt-4 space-y-6">

          {/* CLEAN SIMPLE PAGE HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-[#E8192C]/10 text-[#E8192C] font-extrabold text-[11px] uppercase tracking-wider flex items-center gap-1">
                  <BookBookmarkIcon size={16} /> Metodik Kutubxona
                </span>
                <span className="text-xs text-slate-400 font-medium">• {filtered.length} ta resurs</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                O'quv Qo'llanmalari va Resurslar
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Attestatsiya va Milliy sertifikatlarga tayyorgarlik ko'rish uchun tasdiqlangan kitoblar va konspektlar.
              </p>
            </div>

            {/* SEARCH INPUT */}
            <div className="relative w-full sm:w-80 shrink-0">
              <MagnifierIcon size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Qo'llanma yoki fan nomi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-8 h-11 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E8192C]/30 shadow-xs"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                  <CloseCircleIcon size={16} />
                </button>
              )}
            </div>
          </div>

          {/* FEATURED GUIDES STRIP */}
          {featuredList.length > 0 && !search && activeCategory === "all" && selectedSubject === "Barcha fanlar" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FlameIcon size={20} className="text-[#E8192C]" />
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Tavsiya Etilgan Top Qo'llanmalar</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {featuredList.map((item: any) => (
                  <div
                    key={`feat-${item.id}`}
                    onClick={() => handleOpenResource(item)}
                    className="group relative p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all cursor-pointer flex items-center gap-4"
                  >
                    <div className="w-16 h-20 shrink-0">
                      <VisualBookCover item={item} />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <span className="px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-500/10 text-[#E8192C] font-black text-[9px] uppercase tracking-wider inline-block">
                        {item.subject_name || "Tavsiya"}
                      </span>
                      <h3 className="text-xs font-black text-slate-900 dark:text-white truncate group-hover:text-[#E8192C] transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-semibold line-clamp-1">Attestatsiya uchun eng yaxshi manba</p>
                      <div className="flex items-center gap-1 text-[11px] font-extrabold text-[#E8192C] pt-1">
                        Mutolaa qilish <AltArrowRightIcon size={14} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CATEGORY & SUBJECT FILTERS */}
          <div className="space-y-3 pt-2">
            {/* Category Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
              {CATEGORIES.map((cat) => {
                const IconComponent = cat.icon;
                const active = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={cn(
                      "h-10 px-4 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer border",
                      active
                        ? "bg-[#E8192C] text-white border-[#E8192C] shadow-md shadow-red-500/20"
                        : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:border-slate-300"
                    )}
                  >
                    {IconComponent && <IconComponent size={18} className={active ? "text-white" : "text-slate-500"} />}
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Subject Pills */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pt-1">
              {SUBJECTS.map((subj) => {
                const active = selectedSubject === subj;
                const theme = SUBJECT_THEMES[subj];
                const IconComponent = theme?.icon || DiplomaIcon;
                const color = theme?.bg || "#E8192C";
                return (
                  <button
                    key={subj}
                    onClick={() => setSelectedSubject(subj)}
                    className={cn(
                      "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all shrink-0 border cursor-pointer",
                      active
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs"
                        : "bg-white dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-slate-800 hover:border-slate-300 hover:text-slate-900"
                    )}
                  >
                    <IconComponent size={16} className={active ? (document.documentElement.classList.contains("dark") ? "text-slate-900" : "text-white") : ""} style={!active ? { color } : {}} />
                    <span>{subj}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* MAIN RESOURCES GRID */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-[3/4] rounded-2xl bg-white dark:bg-slate-900 animate-pulse border border-slate-200 dark:border-slate-800" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="w-full p-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-3 shadow-xs">
              <BookBookmarkIcon size={48} className="text-slate-300 dark:text-slate-700 mx-auto" />
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Qo'llanmalar topilmadi</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">Siz qidirgan mezon bo'yicha metodik resurslar hozircha mavjud emas.</p>
              <button
                onClick={() => { setActiveCategory("all"); setSelectedSubject("Barcha fanlar"); setSearch(""); }}
                className="px-5 py-2.5 bg-[#E8192C] text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                Filtrlarni tozalash
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
              <AnimatePresence>
                {filtered.map((item: any) => {
                  const isLocked = item.is_premium && !isPremium;

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => handleOpenResource(item)}
                      className="group flex flex-col cursor-pointer space-y-2.5"
                    >
                      {/* Visual Book Cover Image Preview */}
                      <div className="relative">
                        <VisualBookCover item={item} />

                        {/* Top Right Badges */}
                        <div className="absolute top-2.5 right-2.5 z-20">
                          {item.is_premium ? (
                            <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-lg">
                              <CrownIcon size={12} /> PRO
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-white text-[9px] font-black uppercase tracking-wider shadow-lg">
                              BEPUL
                            </span>
                          )}
                        </div>

                        {/* Lock Overlay */}
                        {isLocked && (
                          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs rounded-2xl flex items-center justify-center z-20">
                            <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg">
                              <LockIcon size={20} />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Info Below Image Preview */}
                      <div className="px-1 space-y-1">
                        <h3 className="text-xs font-extrabold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-[#E8192C] transition-colors">
                          {item.title}
                        </h3>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                          <span>{item.subject_name || "Metodika"}</span>
                          <span className="flex items-center gap-1">
                            <EyeIcon size={14} /> {item.views_count || 1200}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

        </div>

      </div>

      {/* FULLSCREEN RESOURCE VIEWER MODAL */}
      <AnimatePresence>
        {selectedResource && (
          <ResourceViewer
            resource={selectedResource}
            onClose={() => setSelectedResource(null)}
            hasNext={hasNext}
            hasPrev={hasPrev}
            onNext={() => setSelectedResource(filtered[currentIdx + 1])}
            onPrev={() => setSelectedResource(filtered[currentIdx - 1])}
          />
        )}
      </AnimatePresence>

      <SubscriptionDialog open={showSubModal} onOpenChange={setShowSubModal} />
    </>
  );
};

export default Qollanmalar;
