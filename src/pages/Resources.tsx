import { BookOpen, Search, ExternalLink, X, Maximize2, Download } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import SEO from "@/components/SEO";
import { PageShell, PageHeader, FilterBar } from "@/components/platform";

const Resources = () => {
  const [search, setSearch] = useState("");
  const [viewingFile, setViewingFile] = useState<{ url: string; title: string } | null>(null);

  const { data: resources } = useQuery({
    queryKey: ["resources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resources")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = resources?.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageShell>
      <SEO 
        title="O'quv resurslari va darsliklar" 
        description="Pedagoglar uchun darsliklar, metodik qo'llanmalar va foydali materiallar to'plami."
      />
      <div className="platform-panel">
        <PageHeader
          title="Resurslar markazi"
          subtitle="Darsliklar, uslubiy qo'llanmalar va foydali materiallar"
          eyebrow="Bilimlar xazinasi"
          icon={BookOpen}
        />
      </div>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Resurs qidirish..."
        sticky={false}
      />

      {filtered && filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <div key={r.id} className="platform-content-card group">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-5 group-hover:bg-gray-100 transition-colors">
                <BookOpen className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-[15px] font-semibold text-gray-900 mb-2">{r.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-4 line-clamp-2">{r.description || "Tavsif mavjud emas."}</p>
              
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{r.category || "Umumiy"}</span>
                {r.file_url ? (
                  <button 
                    onClick={() => setViewingFile({ url: r.file_url!, title: r.title })}
                    className="flex items-center gap-1.5 text-xs font-semibold text-gray-900 hover:text-gray-600 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Ko'rish
                  </button>
                ) : (
                  <span className="text-[10px] text-gray-300 italic font-mono">Fayl yo'q</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-3xl p-16 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
             <BookOpen className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-gray-400 text-sm">Hozircha resurslar mavjud emas</p>
        </div>
      )}

      {/* Premium Reader Overlay */}
      {viewingFile && (
        <div className="fixed top-0 left-0 right-0 bottom-0 w-screen h-screen z-[99999] bg-zinc-950 flex flex-col animate-in fade-in duration-300">
          {/* TopBar */}
          <div className="h-16 bg-zinc-900 border-b border-white/5 flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
            <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
              <button 
                onClick={() => setViewingFile(null)}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
              <div>
                <p className="text-[11px] text-zinc-500 font-medium uppercase tracking-widest mb-0.5">Mutolaa rejimi</p>
                <p className="text-sm font-semibold text-white truncate max-w-[150px] sm:max-w-md">{viewingFile.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <a 
                href={viewingFile.url} 
                className="hidden sm:flex items-center gap-2 h-9 px-4 bg-white/10 text-[11px] font-semibold text-white rounded-full hover:bg-white/20 transition"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download className="w-3.5 h-3.5" /> Fayl
              </a>
              <button 
                onClick={() => setViewingFile(null)}
                className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Reader Content */}
          <div className="flex-1 bg-zinc-900 relative">
            {/* The PDF iframe */}
            <iframe 
              src={`${viewingFile.url}#view=FitH`}
              className="w-full h-full border-none"
              title={viewingFile.title}
              key={viewingFile.url}
            />
            
            {/* Fallback & Helper Overlay */}
            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.5)] z-10" />
            
            {/* If it doesn't load after some time, user could use the download button */}
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default Resources;
