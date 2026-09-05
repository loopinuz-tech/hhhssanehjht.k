import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Trash2, Plus, Sparkles, BookOpen, ShoppingBasket, ToggleLeft, ToggleRight, Loader2, FileText, ZoomIn, ZoomOut, TrendingUp, Volume2, Lightbulb, ExternalLink, Library, History, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getStoragePublicUrl } from "@/lib/storage";
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import mammoth from 'mammoth';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Use unpkg CDN for reliable worker loading
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface BasketItem {
  id?: string;
  word: string;
  translation?: string;
}

interface AIResult {
  word: string;
  partOfSpeech: string;
  uzbekTranslation: string;
  definition: string;
  examples: string[];
  synonyms: string[];
  antonyms: string[];
  memoryTrick?: string;
  youtubeUrl?: string;
}

export default function ReadingTrainer({ onClose }: { onClose: () => void }) {
  const [file, setFile] = useState<File | string | null>(null);
  const [text, setText] = useState<string>('');
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [fileUrl, setFileUrl] = useState<string>('');
  const [viewMode, setViewMode] = useState<'text' | 'html' | 'pdf' | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [scale, setScale] = useState(1);
  const [numPages, setNumPages] = useState<number>();
  const [selection, setSelection] = useState<{ text: string; x: number; y: number } | null>(null);
  const [basket, setBasket] = useState<BasketItem[]>(() => {
    const saved = localStorage.getItem('reading-basket');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('reading-basket', JSON.stringify(basket));
  }, [basket]);
  const [translating, setTranslating] = useState(false);
  const [addingToVocab, setAddingToVocab] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [highlightedWords, setHighlightedWords] = useState<string[]>([]);
  const [activeAIWord, setActiveAIWord] = useState<AIResult | null>(null);

  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const textRef = useRef<HTMLDivElement>(null);
  const [showLibrary, setShowLibrary] = useState(false);

  const { data: readingMaterials = [], isLoading: isLoadingMaterials } = useQuery({
    queryKey: ['reading-materials', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('category', 'reading_trainer')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const uploadToDB = useMutation({
    mutationFn: async ({ file, title, fileType }: { file: File, title: string, fileType: string }) => {
      if (!user) throw new Error('Iltimos, avval tizimga kiring');

      const ext = file.name.split('.').pop() || 'bin';
      const path = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${ext}`;

      const { error: uploadError } = await supabase.storage.from('materials').upload(path, file);
      if (uploadError) throw uploadError;

      const publicUrl = getStoragePublicUrl('materials', path);

      const { data, error: dbError } = await (supabase as any).from('materials').insert({
        user_id: user.id,
        title: title,
        file_url: publicUrl,
        file_name: file.name,
        file_type: fileType,
        category: 'reading_trainer',
      }).select().single();

      if (dbError) throw dbError;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reading-materials'] });
    },
  });

  const loadMaterial = async (material: any) => {
    setLoading(true);
    setViewMode(null);
    setFile(null);
    setFileUrl('');
    setText('');
    setHtmlContent('');
    setShowLibrary(false);

    try {
      if (material.file_type === 'pdf') {
        setFile(material.file_url);
        setFileUrl(material.file_url);
        setViewMode('pdf');
        toast({ title: 'PDF yuklandi' });
      } else {
        const response = await fetch(material.file_url);
        if (!response.ok) throw new Error('Faylni yuklashda xatolik');

        const fileName = material.file_name.toLowerCase();
        if (fileName.endsWith('.docx')) {
          const arrayBuffer = await response.arrayBuffer();
          const result = await mammoth.convertToHtml({ arrayBuffer });
          setHtmlContent(result.value);
          setViewMode('html');
        } else if (fileName.endsWith('.txt') || fileName.endsWith('.md') || fileName.endsWith('.rtf')) {
          const raw = await response.text();
          if (fileName.endsWith('.rtf')) {
            const stripped = raw
              .replace(/\\[a-z]+[-]?\d*\s?/gi, ' ')
              .replace(/[{}]/g, '')
              .replace(/\s+/g, ' ')
              .trim();
            setText(stripped);
          } else {
            setText(raw);
          }
          setViewMode('text');
        }
        toast({ title: 'Matn yuklandi' });
      }
    } catch (error: any) {
      toast({ title: 'Xatolik', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const SUPPORTED_TYPES = [
    { ext: 'txt', label: 'TXT', mime: 'text/plain' },
    { ext: 'md', label: 'MD', mime: 'text/markdown' },
    { ext: 'pdf', label: 'PDF', mime: 'application/pdf' },
    { ext: 'docx', label: 'DOCX', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
    { ext: 'rtf', label: 'RTF', mime: 'application/rtf' },
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setLoading(true);
    setFile(uploadedFile);
    setText('');
    setHtmlContent('');

    if (fileUrl) {
      URL.revokeObjectURL(fileUrl);
      setFileUrl('');
    }

    try {
      const fileType = uploadedFile.name.split('.').pop()?.toLowerCase();
      let mode: 'text' | 'html' | 'pdf' | null = null;

      if (fileType === 'txt' || fileType === 'md') {
        const raw = await uploadedFile.text();
        setText(raw);
        mode = 'text';
      } else if (fileType === 'pdf') {
        const url = URL.createObjectURL(uploadedFile);
        setFileUrl(url);
        mode = 'pdf';
        toast({ title: 'PDF yuklandi', description: "PDF matni muvaffaqiyatli o'qildi va belgilash uchun tayyor." });
      } else if (fileType === 'docx') {
        const arrayBuffer = await uploadedFile.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        setHtmlContent(result.value);
        mode = 'html';
        toast({ title: 'DOCX yuklandi', description: 'Original ko\'rinishda ochildi.' });
      } else if (fileType === 'rtf') {
        const raw = await uploadedFile.text();
        const stripped = raw
          .replace(/\\[a-z]+[-]?\d*\s?/gi, ' ')
          .replace(/[{}]/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        setText(stripped);
        mode = 'text';
        toast({ title: 'RTF yuklandi', description: 'Matn muvaffaqiyatli o\'qildi.' });
      }

      if (mode) {
        setViewMode(mode);
        uploadToDB.mutate({
          file: uploadedFile,
          title: uploadedFile.name.replace(/\.[^/.]+$/, ''),
          fileType: mode === 'pdf' ? 'pdf' : 'text'
        });
      } else {
        toast({
          title: 'Fayl turi qo\'llab-quvvatlanmaydi',
          description: 'Iltimos, TXT, MD, PDF, DOCX yoki RTF formatidagi fayl tanlang.',
          variant: 'destructive'
        });
        setFile(null);
        setViewMode(null);
      }
    } catch (error: any) {
      console.error('File read error:', error);
      toast({ title: 'Xatolik', description: `Faylni o'qishda xatolik: ${error?.message ?? ''}`, variant: 'destructive' });
      setFile(null);
      setViewMode(null);
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const handleMouseUp = () => {
    setTimeout(() => {
      const selectionObj = window.getSelection();
      let selectedText = selectionObj?.toString();

      if (selectedText && selectedText.trim().length > 0) {
        const range = selectionObj?.getRangeAt(0);
        const rect = range?.getBoundingClientRect();

        if (rect && rect.width > 0) {
          setSelection({
            text: selectedText.trim(),
            x: rect.left + (rect.width / 2) - 100,
            y: rect.top - 50,
          });
        }
      } else {
        setSelection(null);
      }
    }, 100);
  };

  const addToBasket = (word: string) => {
    if (!basket.find(item => item.word === word)) {
      setBasket([...basket, { word }]);
      toast({ title: 'Savatga qo\'shildi', description: `"${word}" savatga tushdi.` });
    }
    setSelection(null);
  };

  const removeFromBasket = (word: string) => {
    setBasket(basket.filter(item => item.word !== word));
  };

  const translateSelection = async () => {
    if (!selection) return;
    setTranslating(true);
    try {
      const { data, error } = await supabase.functions.invoke('vocabulary-ai', {
        body: { word: selection.text }
      });

      if (error) throw error;

      setActiveAIWord(data);
      toast({ title: 'Topildi', description: `"${data.word}" uchun ma'lumotlar yuklandi.` });
    } catch (error: any) {
      toast({ title: 'Xatolik', description: `Tarjima amalga oshmadi: ${error?.message || 'Serverga bog\'lanishda xatolik'}`, variant: 'destructive' });
    } finally {
      setTranslating(false);
      setSelection(null);
    }
  };

  const addToVocabulary = async (word: string, useAI: boolean) => {
    if (!word) return;
    setAddingToVocab(word);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: 'Xatolik', description: 'Iltimos, avval tizimga kiring', variant: 'destructive' });
        return;
      }

      let insertData: any = { user_id: user.id, word: word.trim() };

      if (useAI) {
        const { data, error: aiError } = await supabase.functions.invoke('vocabulary-ai', {
          body: { word: word.trim() }
        });

        if (aiError) throw aiError;

        insertData.meaning = `${data.uzbekTranslation} — ${data.definition}`;
        insertData.memory_trick = data.memoryTrick;
        insertData.translation = data.uzbekTranslation;
      } else {
        insertData.meaning = 'Manual entry';
      }

      const { error } = await (supabase as any).from('vocabulary').insert([insertData]);
      if (error) throw error;

      toast({ title: 'Muvaffaqiyat', description: `"${word}" lug'atga qo'shildi.` });
      removeFromBasket(word);
    } catch (error: any) {
      console.error('Add to vocab error:', error);
      toast({
        title: 'Xatolik',
        description: error.message.includes('fetch') ? 'Server bilan bog\'lanishda xatolik. Server ishlayotganiga ishonch hosil qiling.' : error.message,
        variant: 'destructive'
      });
    } finally {
      setAddingToVocab(null);
    }
  };

  const detectDifficultWords = async () => {
    if (!text) return;
    setDetecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('mistake-ai', {
        body: { mistakes: { text }, action: 'detect_difficult_words' }
      });

      if (error) throw error;

      if (data.words) {
        setHighlightedWords(data.words);
        toast({ title: 'Tugadi', description: 'Qiyin so\'zlar aniqlandi va belgilandi.' });
      }
    } catch (error: any) {
      toast({ title: 'Xatolik', description: `So'zlarni aniqlashda xatolik: ${error?.message || ''}`, variant: 'destructive' });
    } finally {
      setDetecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-white dark:bg-slate-900 flex flex-col overflow-hidden">
      <div className="border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 shrink-0">
        <div className="flex items-center justify-between w-full sm:w-auto">
          <div className="flex items-center gap-2 sm:gap-3">
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-[#E8192C]" />
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Matn Yuklash</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors sm:hidden">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="flex items-center flex-wrap gap-2 sm:gap-4 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 shrink-0">
          {text || fileUrl ? (
            <div className="flex items-center bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0">
              <button onClick={() => setScale(s => Math.max(0.5, s - 0.2))} className="p-1 px-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors"><ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></button>
              <span className="px-1 sm:px-2 text-[10px] sm:text-xs font-bold text-slate-900 dark:text-white min-w-[2.5rem] sm:min-w-[3rem] text-center">{Math.round(scale * 100)}%</span>
              <button onClick={() => setScale(s => Math.min(3, s + 0.2))} className="p-1 px-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors"><ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></button>
            </div>
          ) : null}
          {text && (
            <button
              onClick={detectDifficultWords}
              disabled={detecting}
              className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-blue-500/10 text-blue-500 text-[10px] sm:text-xs font-semibold hover:bg-blue-500/20 transition-colors shrink-0 whitespace-nowrap"
            >
              {detecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Qiyin so'zlar
            </button>
          )}
          <div className="flex items-center gap-1 sm:gap-2 bg-slate-50 dark:bg-slate-800 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-slate-200 dark:border-slate-700 shrink-0">
            <span className="text-[10px] sm:text-xs font-medium text-slate-500">AI:</span>
            <button onClick={() => setAiEnabled(!aiEnabled)} className="transition-all">
              {aiEnabled ? <ToggleRight className="w-5 h-5 sm:w-6 sm:h-6 text-[#E8192C]" /> : <ToggleLeft className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" />}
            </button>
          </div>
          <button
            onClick={() => setShowLibrary(!showLibrary)}
            className={`p-1.5 sm:p-2 rounded-lg transition-colors shrink-0 ${showLibrary ? 'bg-[#E8192C] text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500'}`}
            title="Kutubxona"
          >
            <Library className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button onClick={onClose} className="hidden sm:block p-1.5 sm:p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0">
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className={`flex-1 overflow-y-auto ${viewMode === 'pdf' ? 'bg-slate-50/30 dark:bg-slate-800/30' : 'p-4 sm:p-8 lg:p-12 bg-white/50 dark:bg-slate-900/50'} relative`}>
          {!viewMode ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 p-8">
              <div className="w-20 h-20 rounded-2xl bg-[#E8192C]/10 flex items-center justify-center">
                <Upload className="w-10 h-10 text-[#E8192C]" />
              </div>
              <div className="max-w-md w-full">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Faylni Tanlang</h3>
                <p className="text-slate-500 mb-6 text-sm">Quyidagi formatlardan birini yuklang va yangi so'zlarni interaktiv tarzda o'rganing.</p>
                <div className="flex flex-wrap justify-center gap-2 mb-8">
                  {SUPPORTED_TYPES.map(t => (
                    <span key={t.ext} className="flex items-center gap-1 px-3 py-1 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                      <FileText className="w-3 h-3" />{t.label}
                    </span>
                  ))}
                </div>

                <div className="space-y-4">
                  <label className="inline-flex w-full items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-[#E8192C] text-white font-semibold cursor-pointer hover:opacity-90 transition-opacity">
                    <Plus className="w-5 h-5" /> Yangi Fayl Yuklash
                    <input type="file" className="hidden" accept=".txt,.md,.pdf,.docx,.rtf" onChange={handleFileUpload} />
                  </label>

                  {readingMaterials.length > 0 && (
                    <div className="w-full space-y-3 mt-10">
                      <div className="flex items-center gap-2 mb-2">
                        <History className="w-4 h-4 text-[#E8192C]" />
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">Oxirgi o'qilganlar</h4>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {readingMaterials.slice(0, 5).map((m: any) => (
                          <button
                            key={m.id}
                            onClick={() => loadMaterial(m)}
                            className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#E8192C]/40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-left"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-[#E8192C]/5 flex items-center justify-center shrink-0">
                                {m.file_type === 'pdf' ? <FileText className="w-4 h-4 text-orange-500" /> : <FileText className="w-4 h-4 text-blue-500" />}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{m.title}</p>
                                <p className="text-[10px] text-slate-500">{new Date(m.created_at).toLocaleDateString('uz')}</p>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className={viewMode === 'pdf' ? 'w-full flex justify-center py-10 min-h-full' : 'max-w-6xl mx-auto'}>
              <AnimatePresence>
                {selection && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    style={{ left: selection.x, top: selection.y }}
                    className="fixed z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1.5 flex gap-1 items-center"
                  >
                    <button
                      onClick={() => addToBasket(selection.text)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#E8192C]/10 text-[#E8192C] hover:bg-[#E8192C]/20 flex items-center gap-1.5 transition-colors"
                    >
                      <ShoppingBasket className="w-3.5 h-3.5" /> Savatga
                    </button>
                    {aiEnabled && (
                      <button
                        onClick={translateSelection}
                        disabled={translating}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 flex items-center gap-1.5 transition-colors"
                      >
                        {translating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                        AI Tarjima
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {viewMode === 'text' && (
                <div
                  ref={textRef}
                  onMouseUp={handleMouseUp}
                  className="text-slate-900 dark:text-white leading-relaxed pb-20 transition-all duration-200"
                  style={{ fontSize: `${1.25 * scale}rem`, fontFamily: "'Inter', sans-serif" }}
                >
                  {text.split('\n').map((para, i) => (
                    <p key={i} className="mb-6">
                      {para.split(' ').map((word, idx) => {
                        const cleanWord = word.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
                        const isHighlighted = highlightedWords.some(hw => cleanWord.toLowerCase() === hw.toLowerCase());
                        return (
                          <span key={idx} className={isHighlighted ? "bg-yellow-200/50 dark:bg-yellow-500/30 rounded px-0.5 border-b-2 border-yellow-400 font-medium" : ""}>
                            {word}{' '}
                          </span>
                        );
                      })}
                    </p>
                  ))}
                </div>
              )}

              {viewMode === 'html' && (
                <div
                  ref={textRef}
                  onMouseUp={handleMouseUp}
                  className="text-slate-900 dark:text-white leading-relaxed bg-white dark:bg-slate-900 p-10 rounded-2xl transition-all duration-200"
                  style={{ fontSize: `${1.1 * scale}rem`, fontFamily: "'Inter', sans-serif" }}
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
              )}

              {viewMode === 'pdf' && (
                <div
                  ref={textRef}
                  onMouseUp={handleMouseUp}
                  className="flex flex-col items-center w-full"
                >
                  <Document
                    file={file}
                    onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                    loading={
                      <div className="flex flex-col items-center p-10">
                        <Loader2 className="w-8 h-8 text-[#E8192C] animate-spin" />
                      </div>
                    }
                  >
                    {Array.from(new Array(numPages), (el, index) => (
                      <div key={`page_${index + 1}`} className="mb-8 border border-slate-200 dark:border-slate-800 bg-white" style={{ position: 'relative' }}>
                        <Page
                          pageNumber={index + 1}
                          scale={scale}
                          renderTextLayer={true}
                          renderAnnotationLayer={false}
                        />
                      </div>
                    ))}
                  </Document>
                </div>
              )}
            </div>
          )}

          {loading && (
            <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 flex items-center justify-center z-50">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 text-[#E8192C] animate-spin" />
                <p className="text-sm font-medium text-slate-900 dark:text-white">Matn tayyorlanmoqda...</p>
              </div>
            </div>
          )}
        </div>

        <div className="w-full lg:w-80 h-[35vh] lg:h-auto border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0">
          <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <ShoppingBasket className="w-4 h-4 sm:w-5 sm:h-5 text-[#E8192C]" />
              <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">Savat</h4>
            </div>
            <span className="text-[10px] sm:text-xs bg-[#E8192C]/10 text-[#E8192C] px-2 py-0.5 rounded-full font-bold">{basket.length}</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {basket.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-6 sm:py-10">
                <ShoppingBasket className="w-8 h-8 sm:w-12 sm:h-12 mb-3 text-slate-400" />
                <p className="text-[10px] sm:text-xs text-slate-500">Savat bo'sh</p>
              </div>
            ) : (
              basket.map((item, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 group">
                  <div className="flex items-start justify-between">
                    <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">{item.word}</p>
                    <button onClick={() => removeFromBasket(item.word)} className="p-1 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => addToVocabulary(item.word, true)}
                      disabled={addingToVocab === item.word}
                      className="w-full py-2 sm:py-1.5 rounded-lg bg-[#E8192C] text-white text-[10px] font-bold flex items-center justify-center gap-1.5"
                    >
                      {addingToVocab === item.word ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      AI bilan qo'shish
                    </button>
                    <button
                      onClick={() => addToVocabulary(item.word, false)}
                      className="w-full py-2 sm:py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-[10px] font-bold border border-slate-200 dark:border-slate-700"
                    >
                      Qo'lda qo'shish
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {activeAIWord && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
            >
              <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white capitalize">{activeAIWord.word}</h3>
                  <button className="p-1.5 rounded-full bg-[#E8192C]/10 text-[#E8192C] hover:bg-[#E8192C]/20 transition-colors">
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-slate-500 italic ml-1">{activeAIWord.partOfSpeech}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      addToVocabulary(activeAIWord.word, true);
                      setActiveAIWord(null);
                    }}
                    className="px-3 py-1.5 bg-[#E8192C] text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Lug'atga qo'shish
                  </button>
                  <button onClick={() => setActiveAIWord(null)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                <section className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">O'zbekcha</label>
                    <p className="text-base font-bold text-slate-900 dark:text-white leading-tight">{activeAIWord.uzbekTranslation}</p>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Inglizcha ta'rif</label>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{activeAIWord.definition}</p>
                  </div>
                </section>

                {activeAIWord.memoryTrick && (
                  <section className="p-4 bg-[#E8192C]/5 border border-[#E8192C]/10 rounded-lg relative overflow-hidden">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1 rounded-md bg-[#E8192C]/10 text-[#E8192C]">
                        <Lightbulb className="w-3.5 h-3.5" />
                      </div>
                      <label className="text-[10px] font-bold text-[#E8192C] uppercase tracking-widest">Eslab qolish usuli</label>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                      {activeAIWord.memoryTrick}
                    </p>
                  </section>
                )}

                <section>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-3">Misollar</label>
                  <ul className="space-y-2">
                    {activeAIWord.examples.map((ex, i) => (
                      <li key={i} className="flex gap-3 group">
                        <div className="w-0.5 rounded-full bg-slate-200 dark:bg-slate-700 group-hover:bg-[#E8192C] transition-colors" />
                        <p className="text-xs text-slate-500 py-0.5">{ex}</p>
                      </li>
                    ))}
                  </ul>
                </section>

                <div className="grid grid-cols-2 gap-4">
                  <section>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Sinonimlar</label>
                    <div className="flex flex-wrap gap-1.5">
                      {activeAIWord.synonyms.map((s, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-blue-500/5 text-blue-600 dark:text-blue-400 text-[10px] font-bold border border-blue-500/10">
                          {s}
                        </span>
                      ))}
                    </div>
                  </section>
                  <section>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Antonimlar</label>
                    <div className="flex flex-wrap gap-1.5">
                      {activeAIWord.antonyms.map((a, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-red-500/5 text-red-600 dark:text-red-400 text-[10px] font-bold border border-red-100 dark:border-red-800/20">
                          {a}
                        </span>
                      ))}
                    </div>
                  </section>
                </div>

                {activeAIWord.youtubeUrl && (
                  <section className="pt-2 border-t border-slate-200 dark:border-slate-800">
                    <a
                      href={activeAIWord.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/5 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-500/10 transition-all font-bold text-[10px] border border-red-500/10"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> YouTubeda ko'rish
                    </a>
                  </section>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLibrary && (
          <div className="fixed inset-0 z-[60] flex items-center justify-end">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/20"
              onClick={() => setShowLibrary(false)}
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              className="relative w-full max-w-sm h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col"
            >
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
                <div className="flex items-center gap-2">
                  <Library className="w-5 h-5 text-[#E8192C]" />
                  <h3 className="font-bold text-slate-900 dark:text-white">Kutubxonam</h3>
                </div>
                <button onClick={() => setShowLibrary(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {isLoadingMaterials ? (
                  <div className="flex items-center justify-center p-10"><Loader2 className="w-6 h-6 animate-spin text-[#E8192C]" /></div>
                ) : readingMaterials.length === 0 ? (
                  <div className="text-center py-20 opacity-40">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                    <p className="text-xs text-slate-500">Sizda hali saqlangan matnlar yo'q</p>
                  </div>
                ) : (
                  readingMaterials.map((m: any) => (
                    <button
                      key={m.id}
                      onClick={() => loadMaterial(m)}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50/30 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 hover:border-[#E8192C]/40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-left group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-800">
                          {m.file_type === 'pdf' ? <FileText className="w-4 h-4 text-orange-500" /> : <FileText className="w-4 h-4 text-blue-500" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-[#E8192C] transition-colors">{m.title}</p>
                          <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">{new Date(m.created_at).toLocaleDateString('uz')}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
