import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStudentAuth } from '@/hooks/useStudentAuth';
import { supabase } from '@/integrations/studentSupabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Image, FileText, Film, Trash2, Plus, ClipboardPaste, Filter, X, Download, Eye, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { rewriteStorageUrl, getStoragePublicUrl } from "@/lib/storage";

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

const CATEGORIES = [
  { value: 'sat', label: 'SAT', color: 'bg-primary/10 text-primary border-primary/20' },
  { value: 'ebrw', label: 'EBRW', color: 'bg-accent/10 text-accent border-accent/20' },
  { value: 'math', label: 'Math', color: 'bg-success/10 text-success border-success/20' },
  { value: 'tricks', label: 'SAT Trick Videos', color: 'bg-warning/10 text-warning border-warning/20' },
  { value: 'general', label: 'Umumiy', color: 'bg-secondary text-foreground border-border' },
];

function getFileType(file: File): string {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type === 'application/pdf') return 'pdf';
  return 'other';
}

function getCategoryStyle(cat: string) {
  return CATEGORIES.find(c => c.value === cat)?.color || CATEGORIES[4].color;
}

export default function Materials() {
  const { user, role } = useStudentAuth() as any;
  const isAdmin = role === 'admin';
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [filterCat, setFilterCat] = useState<string>('all');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [previewData, setPreviewData] = useState<{ url: string, type: string, id: string } | null>(null);
  const [uploadCategory, setUploadCategory] = useState('general');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: materials = [] } = useQuery({
    queryKey: ['materials', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('materials' as any).select('*').order('created_at', { ascending: false }).limit(100);
      return data || [];
    },
    enabled: !!user,
  });

  const uploadFile = useCallback(async (file: File, category: string) => {
    if (!user) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'bin';
      const path = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${ext}`;
      
      const { error: uploadError } = await supabase.storage.from('materials').upload(path, file);
      if (uploadError) throw uploadError;

      const publicUrl = getStoragePublicUrl('materials', path);

      const { error: dbError } = await (supabase.from('materials' as any).insert as any)({
        user_id: user.id,
        title: file.name.replace(/\.[^/.]+$/, ''),
        file_url: publicUrl,
        file_name: file.name,
        file_type: getFileType(file),
        category,
      });
      if (dbError) throw dbError;

      queryClient.invalidateQueries({ queryKey: ['materials'] });
      toast({ title: 'Fayl yuklandi!' });
    } catch (e: any) {
      toast({ title: 'Xatolik', description: e.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  }, [user, queryClient, toast]);

  const deleteMaterial = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('materials' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['materials'] }),
    onError: (e: any) => toast({ title: 'Xatolik', description: e.message, variant: 'destructive' }),
  });

  // Filtered materials
  const filtered = materials.filter((m: any) => {
    const matchesCat = filterCat === 'all' || m.category === filterCat;
    const matchesSearch = (m.title || m.file_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Navigation Logic 
  const navigate = useCallback((direction: 'next' | 'prev') => {
    if (!previewData) return;
    const items = filtered;
    const currentIndex = items.findIndex(m => m.id === previewData.id);
    if (currentIndex === -1) return;

    let nextIdx = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIdx >= items.length) nextIdx = 0;
    if (nextIdx < 0) nextIdx = items.length - 1;
    
    const nextItem = items[nextIdx];
    setPreviewData({ url: nextItem.file_url, type: nextItem.file_type, id: nextItem.id });
  }, [previewData, filtered]);

  // Global Keyboard support
  useEffect(() => {
    if (!previewData) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') navigate('next');
      if (e.key === 'ArrowLeft') navigate('prev');
      if (e.key === 'Escape') setPreviewData(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [previewData, navigate]);

  // Ctrl+V paste handler
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      const text = e.clipboardData?.getData('text');
      
      if (text && (text.includes('youtube.com') || text.includes('youtu.be'))) {
        e.preventDefault();
        let videoId = '';
        if (text.includes('v=')) videoId = text.split('v=')[1]?.split('&')[0];
        else if (text.includes('shorts/')) videoId = text.split('shorts/')[1]?.split('?')[0];
        else videoId = text.split('/').pop()?.split('?')[0] || '';
        
        if (videoId) {
          try {
            const { error: dbError } = await (supabase.from('materials' as any).insert as any)({
              user_id: user?.id,
              title: 'YouTube Video',
              file_url: videoId,
              file_name: 'YouTube Video',
              file_type: 'youtube',
              category: 'tricks',
            });
            if (dbError) throw dbError;
            queryClient.invalidateQueries({ queryKey: ['materials'] });
            toast({ title: 'YouTube link qo\'shildi!' });
          } catch (e: any) {
            toast({ title: 'Xatolik', description: e.message, variant: 'destructive' });
          }
        }
        return;
      }

      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            await uploadFile(file, uploadCategory);
          }
        }
      }
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [uploadFile, uploadCategory, user, queryClient, toast]);

  // Drag & drop
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      await uploadFile(file, uploadCategory);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      await uploadFile(file, uploadCategory);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const FileIcon = ({ type }: { type: string }) => {
    if (type === 'image') return <Image className="w-5 h-5 text-primary" />;
    if (type === 'video' || type === 'youtube') return <Film className="w-5 h-5 text-warning" />;
    return <FileText className="w-5 h-5 text-accent" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground">Materiallar</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-3">SAT va EBRW uchun rasmlar, fayllarni saqlang</p>
          <div className="bg-primary/5 border border-primary/10 p-3 rounded-lg text-xs text-muted-foreground max-w-2xl">
             <span className="font-bold text-primary">Eslatma:</span> Ushbu bo'limdagi barcha manbalar faqat ta'lim maqsadida va yaxshilik yo'lida ulashilgan. Hech qanday mualliflik huquqini buzish maqsad qilinmagan.
          </div>
        </div>
      </div>

      <div
        ref={dropZoneRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`glass rounded-2xl p-8 card-shadow border-2 border-dashed transition-all cursor-pointer text-center ${
          dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <input ref={fileInputRef} type="file" multiple accept="image/*,video/*,application/pdf,.doc,.docx,.ppt,.pptx" className="hidden" onChange={handleFileSelect} />
        <div className="flex flex-col items-center gap-3">
          {uploading ? (
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          ) : (
            <>
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Upload className="w-7 h-7 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Faylni tashlang yoki bosing</p>
                <p className="text-xs text-muted-foreground mt-1">
                  <ClipboardPaste className="w-3 h-3 inline mr-1" />
                  <kbd className="px-1.5 py-0.5 rounded bg-secondary text-[10px] font-mono">Ctrl+V</kbd> bilan ham yuklash mumkin
                </p>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center justify-center gap-2 mt-4" onClick={e => e.stopPropagation()}>
          <span className="text-xs text-muted-foreground">Kategoriya:</span>
          {CATEGORIES.filter(c => c.value !== 'tricks').map(cat => (
            <button key={cat.value} onClick={() => setUploadCategory(cat.value)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                uploadCategory === cat.value ? cat.color + ' font-medium' : 'border-border text-muted-foreground hover:text-foreground'
              }`}>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground mr-1" />
          <button onClick={() => setFilterCat('all')}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${filterCat === 'all' ? 'bg-primary/10 text-primary border-primary/20 font-bold' : 'border-border text-muted-foreground hover:text-foreground'}`}>
            Hammasi ({materials.length})
          </button>
          {CATEGORIES.map(cat => (
            <button key={cat.value} onClick={() => setFilterCat(cat.value)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${filterCat === cat.value ? cat.color + ' font-bold shadow-sm' : 'border-border text-muted-foreground hover:text-foreground'}`}>
              {cat.label} ({materials.filter((m: any) => m.category === cat.value).length})
            </button>
          ))}
        </div>
        
        <div className="flex bg-secondary items-center px-3 py-2 rounded-xl border border-border w-full sm:max-w-xs focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all">
          <Search className="w-4 h-4 text-muted-foreground mr-2" />
          <input 
            type="text" 
            placeholder="Fayl nomini izlash..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none text-sm w-full outline-none text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <AnimatePresence>
          {filtered.map((m: any, i: number) => (
            <motion.div key={m.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass rounded-xl card-shadow overflow-hidden group relative"
            >
              <div className="aspect-square bg-secondary cursor-pointer overflow-hidden relative group" 
                onClick={() => setPreviewData({ url: m.file_url, type: m.file_type, id: m.id })}>
                {m.file_type === 'image' ? (
                  <img 
                    src={rewriteStorageUrl(m.file_url)} 
                    alt={m.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80";
                    }}
                  />
                ) : m.file_type === 'youtube' ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <img src={`https://img.youtube.com/vi/${m.file_url}/hqdefault.jpg`} className="w-full h-full object-cover opacity-60" />
                    <Film className="absolute w-8 h-8 text-white drop-shadow-lg" />
                  </div>
                ) : m.file_type === 'pdf' ? (
                  <div className="w-full h-full overflow-hidden flex items-center justify-center pointer-events-none origin-top">
                     <Document file={m.file_url} loading={<FileText className="w-5 h-5 text-accent animate-pulse" />}>
                        <Page pageNumber={1} width={250} renderTextLayer={false} renderAnnotationLayer={false} className="group-hover:scale-110 transition-transform duration-500 origin-top" />
                     </Document>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileIcon type={m.file_type} />
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                   <p className="text-[10px] text-white truncate font-medium">{m.title || m.file_name}</p>
                </div>
              </div>

              <div className="p-4 bg-white/50 backdrop-blur-sm">
                {m.title && m.title.toLowerCase() !== 'image' && m.title.toLowerCase() !== 'file' && (
                  <p className="text-[11px] font-extrabold text-foreground leading-tight line-clamp-2 min-h-[1.5rem] mb-2">{m.title}</p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <div className="p-1 rounded bg-secondary/50 text-muted-foreground"><FileIcon type={m.file_type} /></div>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${getCategoryStyle(m.category)}`}>
                       {CATEGORIES.find(c => c.value === m.category)?.label || 'Umumiy'}
                    </span>
                  </div>
                  <div className="flex gap-0.5" onClick={e => e.stopPropagation()}>
                    {(user?.id === m.user_id || isAdmin) && (
                      <button onClick={() => deleteMaterial.mutate(m.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {m.file_type !== 'youtube' && (
                      <a href={m.file_url} download className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all">
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {previewData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8"
            onClick={() => setPreviewData(null)}
          >
            <div className="absolute top-4 right-4 flex gap-2 z-[70]" onClick={e => e.stopPropagation()}>
              <button className="p-2.5 rounded-xl bg-secondary text-foreground hover:bg-destructive/20 transition-all" onClick={() => setPreviewData(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <button onClick={(e) => { e.stopPropagation(); navigate('prev'); }} className="absolute left-4 top-1/2 p-4 rounded-full bg-white/10 hover:bg-white/20 text-white z-[70] hidden md:block">
              <ChevronLeft className="w-8 h-8" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); navigate('next'); }} className="absolute right-4 top-1/2 p-4 rounded-full bg-white/10 hover:bg-white/20 text-white z-[70] hidden md:block">
              <ChevronRight className="w-8 h-8" />
            </button>

            <div className="w-full h-full flex items-center justify-center mt-8" onClick={e => e.stopPropagation()}>
              {previewData.type === 'image' && (
                <motion.img key={previewData.url} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} src={previewData.url} className="max-w-full max-h-full rounded-xl object-contain shadow-2xl" />
              )}
              {previewData.type === 'video' && (
                <video key={previewData.url} src={previewData.url} controls autoPlay className="max-w-full max-h-full rounded-xl shadow-2xl" />
              )}
              {previewData.type === 'pdf' && (
                <iframe key={previewData.url} src={`${previewData.url}#toolbar=0`} className="w-full h-full rounded-xl bg-white" title="PDF Preview" />
              )}
              {previewData.type === 'youtube' && (
                <div key={previewData.url} className="w-full max-w-[400px] aspect-[9/16] rounded-2xl overflow-hidden border border-border">
                  <iframe src={`https://www.youtube.com/embed/${previewData.id}?autoplay=1`} className="w-full h-full" allowFullScreen />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
