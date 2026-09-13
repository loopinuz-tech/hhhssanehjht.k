import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/studentSupabase";
import {
  Sparkles, FileText, Palette, Play, ChevronRight, ChevronLeft,
  Check, X, Trash2, Type, ArrowRight, Loader2, Crown, Zap, Lock,
  PenLine, RotateCcw, AlignLeft, Maximize, Image, Search
} from "lucide-react";

interface SlidePlan {
  id: string;
  title: string;
  content: string;
  type: "title" | "content" | "list" | "quote" | "comparison" | "conclusion";
  approved: boolean;
}

interface SlideDesign {
  id: string;
  title: string;
  preview: string;
  gradient: string;
  accentColor: string;
  textColor: string;
  cardStyle: string;
}

interface PresentationSlide {
  id: string;
  plan: SlidePlan;
  html: string;
  editedTitle?: string;
  editedContent?: string;
  bgColor?: string;
  textColor?: string;
  accentColor?: string;
  imageUrl?: string;
}

interface ImageResult {
  thumbnail: string;
  title: string;
  source: string;
  width?: number;
  height?: number;
}

const TEMPLATES: SlideDesign[] = [
  {
    id: "obsidian",
    title: "Obsidian",
    preview: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
    gradient: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
    accentColor: "#E8192C",
    textColor: "#f8fafc",
    cardStyle: "rgba(255,255,255,0.06)"
  },
  {
    id: "midnight",
    title: "Midnight",
    preview: "linear-gradient(135deg, #020617 0%, #0f172a 50%, #1e1b4b 100%)",
    gradient: "linear-gradient(135deg, #020617 0%, #0f172a 50%, #1e1b4b 100%)",
    accentColor: "#818cf8",
    textColor: "#f1f5f9",
    cardStyle: "rgba(255,255,255,0.05)"
  },
  {
    id: "emerald",
    title: "Emerald",
    preview: "linear-gradient(135deg, #022c22 0%, #064e3b 50%, #0f766e 100%)",
    gradient: "linear-gradient(135deg, #022c22 0%, #064e3b 50%, #0f766e 100%)",
    accentColor: "#34d399",
    textColor: "#f0fdf4",
    cardStyle: "rgba(255,255,255,0.06)"
  },
  {
    id: "slate-light",
    title: "Slate Light",
    preview: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)",
    gradient: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)",
    accentColor: "#E8192C",
    textColor: "#0f172a",
    cardStyle: "rgba(0,0,0,0.04)"
  },
  {
    id: "violet",
    title: "Violet",
    preview: "linear-gradient(135deg, #2e1065 0%, #4c1d95 50%, #6d28d9 100%)",
    gradient: "linear-gradient(135deg, #2e1065 0%, #4c1d95 50%, #6d28d9 100%)",
    accentColor: "#c4b5fd",
    textColor: "#f5f3ff",
    cardStyle: "rgba(255,255,255,0.08)"
  },
  {
    id: "amber",
    title: "Amber",
    preview: "linear-gradient(135deg, #451a03 0%, #78350f 50%, #92400e 100%)",
    gradient: "linear-gradient(135deg, #451a03 0%, #78350f 50%, #92400e 100%)",
    accentColor: "#fbbf24",
    textColor: "#fffbeb",
    cardStyle: "rgba(255,255,255,0.06)"
  }
];

const PAGE_OPTIONS = [
  { count: 10, label: "10 sahifa", tier: "Bepul", color: "text-emerald-500" },
  { count: 15, label: "15 sahifa", tier: "Pro", color: "text-amber-500" },
  { count: 20, label: "20+ sahifa", tier: "Premium", color: "text-purple-500" },
];

const KATEX_CSS = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css";
const KATEX_JS = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js";
const KATEX_RENDER = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js";

function loadKatex(doc: Document) {
  if (!doc.querySelector(`link[href="${KATEX_CSS}"]`)) {
    const link = doc.createElement("link");
    link.rel = "stylesheet";
    link.href = KATEX_CSS;
    doc.head.appendChild(link);
  }
  if (!(doc as any).defaultView?.katex) {
    const s1 = doc.createElement("script");
    s1.src = KATEX_JS;
    doc.head.appendChild(s1);
  }
}

function renderLatexInElement(el: HTMLElement, doc: Document) {
  const check = setInterval(() => {
    if ((doc as any).defaultView?.renderMathInElement) {
      clearInterval(check);
      try {
        (doc as any).defaultView.renderMathInElement(el, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false },
            { left: "\\[", right: "\\]", display: true },
            { left: "\\(", right: "\\)", display: false }
          ],
          throwOnError: false
        });
      } catch {}
    }
  }, 100);
  setTimeout(() => clearInterval(check), 5000);
}

function buildSlideHTML(slide: SlidePlan, template: SlideDesign, opts?: { bg?: string; txt?: string; acc?: string; card?: string; imageUrl?: string }): string {
  const bg = opts?.bg || template.gradient;
  const txt = opts?.txt || template.textColor;
  const acc = opts?.acc || template.accentColor;
  const card = opts?.card || template.cardStyle;
  const imageUrl = opts?.imageUrl;
  const isLight = template.id === "slate-light";

  const headingFont = "'Inter','Segoe UI','Helvetica Neue',Arial,sans-serif";
  const bodyFont = "'Inter','Segoe UI','Helvetica Neue',Arial,sans-serif";

  const processContent = (text: string) => text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, '<code style="background:' + card + ';padding:2px 8px;border-radius:4px;font-size:0.9em;">$1</code>')
    .replace(/\$(.+?)\$/g, '<span class="katex-inline">$1</span>');

  let contentHTML = "";

  if (slide.type === "title") {
    const paragraphs = slide.content.split(/\n+/).filter(Boolean);
    contentHTML = `
      <div style="width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;padding:8% 10%;position:relative;">
        <div style="position:absolute;top:6%;left:10%;width:60px;height:4px;background:${acc};border-radius:2px;"></div>
        <h1 style="font-family:${headingFont};font-size:clamp(2.2rem,5vw,4rem);font-weight:900;color:${txt};line-height:1.1;letter-spacing:-0.03em;margin-bottom:1.5rem;">${slide.title}</h1>
        ${paragraphs.map(p => `<p style="font-family:${bodyFont};font-size:clamp(1rem,1.8vw,1.35rem);color:${isLight ? '#475569' : 'rgba(255,255,255,0.7)'};line-height:1.7;max-width:680px;margin-bottom:0.75rem;">${processContent(p)}</p>`).join("")}
        <div style="position:absolute;bottom:6%;right:8%;width:40%;height:50%;background:${card};border-radius:20px;overflow:hidden;opacity:0.4;"></div>
      </div>`;
  } else if (slide.type === "list") {
    const items = slide.content.split(/[•\-\n]/).filter(s => s.trim().length > 2);
    contentHTML = `
      <div style="width:100%;height:100%;display:flex;flex-direction:column;padding:6% 8%;">
        <h2 style="font-family:${headingFont};font-size:clamp(1.8rem,3.5vw,2.8rem);font-weight:800;color:${txt};letter-spacing:-0.02em;margin-bottom:2.5rem;">${slide.title}</h2>
        <div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:12px;">
          ${items.map((item, i) => `
            <div style="display:flex;align-items:flex-start;gap:16px;padding:16px 20px;background:${card};border-radius:14px;border-left:3px solid ${acc};">
              <span style="font-family:${headingFont};font-size:0.85rem;font-weight:800;color:${acc};min-width:28px;height:28px;display:flex;align-items:center;justify-content:center;background:${acc}20;border-radius:8px;">${i + 1}</span>
              <span style="font-family:${bodyFont};font-size:clamp(0.95rem,1.5vw,1.15rem);color:${txt};line-height:1.6;">${processContent(item.trim())}</span>
            </div>
          `).join("")}
        </div>
      </div>`;
  } else if (slide.type === "quote") {
    contentHTML = `
      <div style="width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:8% 12%;text-align:center;">
        <div style="font-size:6rem;color:${acc};opacity:0.2;line-height:1;font-family:Georgia,serif;margin-bottom:-2rem;">"</div>
        <p style="font-family:${headingFont};font-size:clamp(1.4rem,2.8vw,2.2rem);color:${txt};font-style:italic;line-height:1.6;max-width:750px;font-weight:500;">${slide.content}</p>
        <div style="width:60px;height:3px;background:${acc};border-radius:2px;margin:2rem auto 1rem;"></div>
        <span style="font-family:${bodyFont};font-size:clamp(0.85rem,1.3vw,1rem);color:${acc};font-weight:600;letter-spacing:0.05em;text-transform:uppercase;">— ${slide.title}</span>
      </div>`;
  } else {
    const paragraphs = slide.content.split(/\n+/).filter(Boolean);
    contentHTML = `
      <div style="width:100%;height:100%;display:flex;padding:6% 8%;gap:5%;">
        <div style="flex:1.1;display:flex;flex-direction:column;justify-content:center;">
          <h2 style="font-family:${headingFont};font-size:clamp(1.8rem,3.5vw,2.8rem);font-weight:800;color:${txt};letter-spacing:-0.02em;margin-bottom:2rem;">${slide.title}</h2>
          ${paragraphs.map(p => `<p style="font-family:${bodyFont};font-size:clamp(0.95rem,1.5vw,1.2rem);color:${isLight ? '#475569' : 'rgba(255,255,255,0.82)'};line-height:1.8;margin-bottom:1rem;">${processContent(p)}</p>`).join("")}
        </div>
        <div style="flex:0.9;display:flex;align-items:center;">
          <div style="width:100%;aspect-ratio:4/3;background:${card};border-radius:20px;display:flex;align-items:center;justify-content:center;overflow:hidden;border:1px solid ${acc}15;">
            ${imageUrl ? `<img src="${imageUrl}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" /><div style="width:70%;height:70%;border-radius:12px;background:linear-gradient(135deg,${acc}15,${acc}05);display:none;align-items:center;justify-content:center;"><span style="font-size:3rem;opacity:0.3;color:${acc};">+</span></div>` : `<div style="width:70%;height:70%;border-radius:12px;background:linear-gradient(135deg,${acc}15,${acc}05);display:flex;align-items:center;justify-content:center;"><span style="font-size:3rem;opacity:0.3;color:${acc};">+</span></div>`}
          </div>
        </div>
      </div>`;
  }

  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8"><meta name="viewport" content="width=1920">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<link href="${KATEX_CSS}" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',system-ui,sans-serif;background:#000;overflow:hidden}
.slide{width:1920px;height:1080px;background:${bg};position:relative;overflow:hidden;transform-origin:top left;}
code{font-family:'JetBrains Mono','Fira Code',monospace;}
.katex-inline{color:${acc};font-weight:600;}
</style>
</head><body>
<div class="slide" id="slide-root">${contentHTML}</div>
<script src="${KATEX_JS}"><\/script>
<script src="${KATEX_RENDER}"><\/script>
<script>
document.addEventListener("DOMContentLoaded",function(){
  if(window.renderMathInElement){
    renderMathInElement(document.getElementById("slide-root"),{
      delimiters:[
        {left:"$$",right:"$$",display:true},
        {left:"$",right:"$",display:false},
        {left:"\\\\[",right:"\\\\]",display:true},
        {left:"\\\\(",right:"\\\\)",display:false}
      ],
      throwOnError:false
    });
  }
});
<\/script>
</body></html>`;
}

export default function Taqdimot() {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [topic, setTopic] = useState("");
  const [pageCount, setPageCount] = useState(10);
  const [slides, setSlides] = useState<SlidePlan[]>([]);
  const [generating, setGenerating] = useState(false);
  const [currentGenerating, setCurrentGenerating] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<SlideDesign>(TEMPLATES[0]);
  const [presentationSlides, setPresentationSlides] = useState<PresentationSlide[]>([]);
  const [presenting, setPresenting] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [editingSlide, setEditingSlide] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [liveEditing, setLiveEditing] = useState<string | null>(null);
  const [liveEditText, setLiveEditText] = useState("");
  const [slideColors, setSlideColors] = useState<Record<string, { bg?: string; txt?: string; acc?: string }>>({});
  const [imageSearchOpen, setImageSearchOpen] = useState<string | null>(null);
  const [imageQuery, setImageQuery] = useState("");
  const [imageResults, setImageResults] = useState<ImageResult[]>([]);
  const [imageSearching, setImageSearching] = useState(false);
  const [slideImages, setSlideImages] = useState<Record<string, string>>({});

  const generatePlan = async () => {
    if (!topic.trim()) { toast({ title: "Mavzu kiriting", variant: "destructive" }); return; }
    setGenerating(true); setSlides([]); setCurrentGenerating(0);
    try {
      const resp = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          model: "mistral-tiny",
          messages: [
            { role: "system", content: `Siz taqdimot yaratuvchi AI'siz. ${pageCount} sahifalik reja tuzing. JSON: { "slides": [{ "title": "sarlavha", "content": "matn 2-3 jumlada", "type": "title|content|list|quote|conclusion" }] }. type: title=bosh sahifa, content=asosiy matn, list=ro'yxat, quote=iqtibos, conclusion=xulosa. LaTeX: $...$ yoki $$...$$. Faqat JSON.` },
            { role: "user", content: `"${topic}" mavzusida ${pageCount} sahifalik reja.` }
          ]
        })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "API xatolik");
      if (!data.choices?.[0]?.message?.content) throw new Error("AI javob bermadi");
      const raw = data.choices[0].message.content;
      let parsed: any = null;
      try { parsed = JSON.parse(raw); } catch {}
      if (!parsed) { const m = raw.match(/```(?:json)?\s*([\s\S]*?)```/); if (m) try { parsed = JSON.parse(m[1]); } catch {} }
      if (!parsed) { const s = raw.indexOf("{"), e = raw.lastIndexOf("}"); if (s !== -1 && e > s) try { parsed = JSON.parse(raw.slice(s, e + 1)); } catch {} }
      if (!parsed?.slides?.length) throw new Error("AI noto'g'ri format");
      const generated = parsed.slides.slice(0, pageCount).map((s: any, i: number) => ({ id: crypto.randomUUID(), title: s.title || `Sahifa ${i + 1}`, content: s.content || "", type: s.type || "content", approved: false }));
      for (let i = 0; i < generated.length; i++) { await new Promise(r => setTimeout(r, 200)); setSlides(prev => [...prev, generated[i]]); setCurrentGenerating(i + 1); }
      toast({ title: "Reja tayyor!", description: `${generated.length} sahifa` });
    } catch (e: any) { toast({ title: "Xatolik", description: e.message, variant: "destructive" }); }
    setGenerating(false);
  };

  const approveSlide = (id: string) => setSlides(p => p.map(s => s.id === id ? { ...s, approved: true } : s));
  const approveAll = () => setSlides(p => p.map(s => ({ ...s, approved: true })));
  const removeSlide = (id: string) => setSlides(p => p.filter(s => s.id !== id));
  const updateSlide = (id: string, f: keyof SlidePlan, v: string) => setSlides(p => p.map(s => s.id === id ? { ...s, [f]: v } : s));

  const generatePresentation = async () => {
    const approved = slides.filter(s => s.approved);
    if (!approved.length) { toast({ title: "Kamida bitta sahifani tasdiqlang", variant: "destructive" }); return; }
    setGenerating(true); setPresentationSlides([]);
    for (let i = 0; i < approved.length; i++) {
      let html = "";
      try {
        const resp = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            model: "mistral-tiny",
            messages: [
              { role: "system", content: `Siz professional taqdimot yaratuvchi AI'siz. Gamma.app darajasidagi HTML sahifa yarating. Qoidalar: 1) 1920x1080 to'liq ekran 2) Inline CSS 3) Google Fonts Inter 4) KaTeX: $...$ $$...$$ 5) Gradient fon 6) Katta sarlavha 7) Professional spacing 8) To'liq HTML document. Faqat HTML.` },
              { role: "user", content: `Sahifa ${i + 1}: "${approved[i].title}"\nMavzu: ${topic}\nMatn: ${approved[i].content}\nRanglar: bg=${selectedTemplate.gradient}, txt=${selectedTemplate.textColor}, acc=${selectedTemplate.accentColor}` }
            ]
          })
        });
        const data = await resp.json();
        if (data.choices?.[0]?.message?.content) {
          html = data.choices[0].message.content.replace(/```html\s*/g, "").replace(/```\s*/g, "").trim();
          if (!html.includes("<html")) html = buildSlideHTML(approved[i], selectedTemplate);
        } else html = buildSlideHTML(approved[i], selectedTemplate);
      } catch { html = buildSlideHTML(approved[i], selectedTemplate); }
      setPresentationSlides(prev => [...prev, { id: crypto.randomUUID(), plan: approved[i], html }]);
    }
    setGenerating(false);
    toast({ title: "Taqdimot tayyor!" });
  };

  const changeSlideColor = (id: string, type: "bg" | "txt" | "acc", val: string) => {
    setSlideColors(prev => ({ ...prev, [id]: { ...prev[id], [type]: val } }));
  };

  const searchImages = useCallback(async (query: string, slideId: string) => {
    if (!query.trim()) return;
    setImageSearching(true);
    setImageResults([]);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const resp = await fetch(`/api/images/search?q=${encodeURIComponent(query)}&num=8`, {
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await resp.json();
      if (data.images) setImageResults(data.images);
      else toast({ title: "Rasm topilmadi", variant: "destructive" });
    } catch (e: any) {
      toast({ title: "Qidiruv xatolik", description: e.message, variant: "destructive" });
    }
    setImageSearching(false);
  }, [toast]);

  const selectImage = (slideId: string, imageUrl: string) => {
    setSlideImages(prev => ({ ...prev, [slideId]: imageUrl }));
    setImageSearchOpen(null);
    setImageResults([]);
    setImageQuery("");
  };

  const startPresentation = () => { setPresenting(true); setCurrentSlide(0); };
  const approvedCount = slides.filter(s => s.approved).length;

  // FULLSCREEN
  if (presenting && presentationSlides.length > 0) {
    const slide = presentationSlides[currentSlide];
    const colors = slideColors[slide.id] || {};
    const html = buildSlideHTML(
      { ...slide.plan, title: slide.editedTitle || slide.plan.title, content: slide.editedContent || slide.plan.content },
      selectedTemplate,
      { bg: colors.bg || slide.bgColor, txt: colors.txt || slide.textColor, acc: colors.acc || slide.accentColor, imageUrl: slideImages[slide.id] || slide.imageUrl }
    );
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <iframe srcDoc={html} className="w-full h-full border-0" title={`Sahifa ${currentSlide + 1}`} onLoad={e => {
          const doc = (e.target as HTMLIFrameElement).contentDocument;
          if (doc) { loadKatex(doc); renderLatexInElement(doc.body, doc); }
        }} />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6 opacity-0 hover:opacity-100 transition-opacity duration-500">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <button onClick={() => { setPresenting(false); setStep(4); }} className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-semibold transition-colors backdrop-blur-md border border-white/10">
              <X className="w-4 h-4 inline mr-1.5" /> Chiqish
            </button>
            <div className="flex items-center gap-4">
              <button onClick={() => setCurrentSlide(p => Math.max(0, p - 1))} disabled={currentSlide === 0}
                className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl disabled:opacity-20 transition-colors backdrop-blur-md border border-white/10"><ChevronLeft className="w-5 h-5" /></button>
              <span className="text-white text-sm font-bold bg-white/10 px-4 py-1.5 rounded-xl backdrop-blur-md border border-white/10">{currentSlide + 1} / {presentationSlides.length}</span>
              <button onClick={() => setCurrentSlide(p => Math.min(presentationSlides.length - 1, p + 1))} disabled={currentSlide === presentationSlides.length - 1}
                className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl disabled:opacity-20 transition-colors backdrop-blur-md border border-white/10"><ChevronRight className="w-5 h-5" /></button>
            </div>
            <div className="flex gap-1.5">
              {presentationSlides.map((_, i) => (
                <button key={i} onClick={() => setCurrentSlide(i)}
                  className={`h-2 rounded-full transition-all ${i === currentSlide ? "bg-[#E8192C] w-7" : "bg-white/25 hover:bg-white/40 w-2"}`} />
              ))}
            </div>
          </div>
        </div>
        <KeyboardNav
          onPrev={() => setCurrentSlide(p => Math.max(0, p - 1))}
          onNext={() => setCurrentSlide(p => Math.min(presentationSlides.length - 1, p + 1))}
          onExit={() => { setPresenting(false); setStep(4); }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#050B10]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#E8192C]/10 rounded-full">
            <Sparkles className="w-4 h-4 text-[#E8192C]" />
            <span className="text-[11px] font-bold text-[#E8192C] uppercase tracking-wider">AI Taqdimot</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Taqdimot Yaratish</h1>
          <p className="text-sm text-slate-500 max-w-md mx-auto">Gamma kabi professional taqdimotlar yarating</p>
        </div>

        <div className="flex items-center justify-center gap-2 sm:gap-4">
          {[{ n: 1, l: "Mavzu" }, { n: 2, l: "Reja" }, { n: 3, l: "Dizayn" }, { n: 4, l: "Ko'rish" }].map((s, i) => (
            <div key={s.n} className="flex items-center gap-2 sm:gap-4">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${step === s.n ? "bg-[#E8192C] text-white" : step > s.n ? "bg-emerald-500 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-500"}`}>
                {step > s.n ? <Check className="w-3.5 h-3.5" /> : <span>{s.n}</span>}
                <span className="hidden sm:inline">{s.l}</span>
              </div>
              {i < 3 && <div className={`w-6 sm:w-12 h-0.5 ${step > s.n ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-800"}`} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-2xl mx-auto space-y-8">
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-8">
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mavzu</label>
                  <div className="relative">
                    <PenLine className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input value={topic} onChange={e => setTopic(e.target.value)} onKeyDown={e => e.key === "Enter" && topic.trim() && (setStep(2), generatePlan())}
                      placeholder="Masalan: Sun'iy intellekt tarixi"
                      className="w-full h-14 pl-12 pr-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-base font-semibold text-slate-900 dark:text-white focus:border-[#E8192C] outline-none transition-all" />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sahifalar soni</label>
                  <div className="grid grid-cols-3 gap-3">
                    {PAGE_OPTIONS.map(o => (
                      <button key={o.count} onClick={() => setPageCount(o.count)}
                        className={`relative p-4 rounded-2xl border-2 transition-all text-center space-y-2 ${pageCount === o.count ? "border-[#E8192C] bg-[#E8192C]/5" : "border-slate-200 dark:border-slate-800"}`}>
                        <p className={`text-2xl font-black ${o.color}`}>{o.count}</p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{o.tier}</p>
                        {pageCount === o.count && <div className="absolute top-2 right-2 w-5 h-5 bg-[#E8192C] rounded-full flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-center">
                <button onClick={() => { if (topic.trim()) { setStep(2); generatePlan(); } }} disabled={!topic.trim()}
                  className="px-8 py-3.5 bg-[#E8192C] text-white rounded-2xl text-sm font-bold hover:opacity-90 disabled:opacity-40 transition-all flex items-center gap-2">
                  AI Reja Yaratish <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">Reja</h2>
                  <p className="text-xs text-slate-500 mt-1">{slides.length}/{pageCount} · {approvedCount} tasdiqlangan</p>
                </div>
                <div className="flex gap-2">
                  {slides.length > 0 && <button onClick={approveAll} className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:opacity-90"><Check className="w-3.5 h-3.5 inline mr-1" />Barchasini</button>}
                  {approvedCount === slides.length && slides.length > 0 && <button onClick={() => setStep(3)} className="px-4 py-2 bg-[#E8192C] text-white rounded-xl text-xs font-bold hover:opacity-90 flex items-center gap-1">Dizayn <ChevronRight className="w-4 h-4" /></button>}
                </div>
              </div>
              {generating && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                  <div className="flex items-center gap-3 mb-3"><Loader2 className="w-4 h-4 text-[#E8192C] animate-spin" /><span className="text-xs font-bold text-slate-600">AI tuzmoqda... {currentGenerating}/{pageCount}</span></div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-[#E8192C] rounded-full transition-all duration-500" style={{ width: `${(currentGenerating / pageCount) * 100}%` }} /></div>
                </div>
              )}
              <div className="space-y-3">
                {slides.map((slide, i) => (
                  <motion.div key={slide.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                    className={`bg-white dark:bg-slate-900 rounded-2xl border-2 p-5 transition-all ${slide.approved ? "border-emerald-500/30" : "border-slate-200 dark:border-slate-800"}`}>
                    <div className="flex items-start gap-4">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${slide.approved ? "bg-emerald-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
                        {slide.approved ? <Check className="w-4 h-4" /> : i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        {editingSlide === slide.id ? (
                          <div className="space-y-2">
                            <input value={editContent.split("|||")[0]} onChange={e => setEditContent(e.target.value + "|||" + editContent.split("|||")[1])}
                              className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-[#E8192C]" />
                            <textarea value={editContent.split("|||")[1] || ""} onChange={e => setEditContent(editContent.split("|||")[0] + "|||" + e.target.value)}
                              rows={3} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-300 outline-none resize-none focus:border-[#E8192C]" />
                            <div className="flex gap-2">
                              <button onClick={() => { updateSlide(slide.id, "title", editContent.split("|||")[0]); updateSlide(slide.id, "content", editContent.split("|||")[1] || ""); setEditingSlide(null); }} className="px-3 py-1.5 bg-[#E8192C] text-white rounded-lg text-xs font-bold">Saqlash</button>
                              <button onClick={() => setEditingSlide(null)} className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold">Bekor</button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">{slide.title}</h3>
                            <p className="text-sm text-slate-500 leading-relaxed mt-1">{slide.content}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => { setEditingSlide(slide.id); setEditContent(slide.title + "|||" + slide.content); }} className="p-2 text-slate-400 hover:text-blue-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><PenLine className="w-3.5 h-3.5" /></button>
                        {!slide.approved && <button onClick={() => approveSlide(slide.id)} className="p-2 text-slate-400 hover:text-emerald-500 rounded-lg hover:bg-emerald-50 transition-colors"><Check className="w-4 h-4" /></button>}
                        <button onClick={() => removeSlide(slide.id)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="flex justify-between pt-4">
                <button onClick={() => setStep(1)} className="text-sm font-medium text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center gap-1"><ChevronLeft className="w-4 h-4" /> Orqaga</button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">{generating ? "Yaratilmoqda..." : "Dizayn"}</h2>
                  <p className="text-xs text-slate-500 mt-1">{generating ? `${presentationSlides.length}/${slides.filter(s => s.approved).length}` : "Shablon tanlang"}</p>
                </div>
                {!generating && <button onClick={() => setStep(2)} className="text-sm font-medium text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center gap-1"><ChevronLeft className="w-4 h-4" /> Orqaga</button>}
              </div>
              {generating && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                  <div className="flex items-center gap-3 mb-3"><Loader2 className="w-4 h-4 text-[#E8192C] animate-spin" /><span className="text-xs font-bold text-slate-600">Sahifa {presentationSlides.length + 1} yaratilmoqda...</span></div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-[#E8192C] rounded-full transition-all duration-500" style={{ width: `${(presentationSlides.length / slides.filter(s => s.approved).length) * 100}%` }} /></div>
                </div>
              )}
              {!generating && presentationSlides.length === 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
                  {TEMPLATES.map(t => (
                    <button key={t.id} onClick={() => setSelectedTemplate(t)}
                      className={`relative p-1 rounded-2xl border-2 transition-all ${selectedTemplate.id === t.id ? "border-[#E8192C] scale-[1.02]" : "border-slate-200 dark:border-slate-800 hover:border-slate-300"}`}>
                      <div className="w-full aspect-video rounded-xl overflow-hidden" style={{ background: t.preview }}>
                        <div className="w-full h-full p-3 flex flex-col justify-between">
                          <div className="text-[10px] font-bold opacity-70" style={{ color: t.textColor }}>Mavzu</div>
                          <div className="space-y-1"><div className="h-1 w-3/4 rounded" style={{ background: t.cardStyle }} /><div className="h-1 w-1/2 rounded" style={{ background: t.cardStyle }} /></div>
                          <div className="text-[7px] font-bold" style={{ color: t.accentColor }}>AI Taqdimot</div>
                        </div>
                      </div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 text-center mt-2">{t.title}</p>
                      {selectedTemplate.id === t.id && <div className="absolute top-3 right-3 w-5 h-5 bg-[#E8192C] rounded-full flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>}
                    </button>
                  ))}
                </div>
              )}
              {presentationSlides.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <AnimatePresence>
                    {presentationSlides.map((slide, i) => {
                      const colors = slideColors[slide.id] || {};
                      const html = buildSlideHTML(
                        { ...slide.plan, title: slide.editedTitle || slide.plan.title, content: slide.editedContent || slide.plan.content },
                        selectedTemplate,
                        { bg: colors.bg, txt: colors.txt, acc: colors.acc, imageUrl: slideImages[slide.id] || slide.imageUrl }
                      );
                      return (
                        <motion.div key={slide.id} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", damping: 20 }}
                          className={`group relative rounded-2xl overflow-hidden border-2 transition-all ${i === presentationSlides.length - 1 && generating ? "border-[#E8192C] shadow-lg shadow-[#E8192C]/20" : "border-slate-200 dark:border-slate-800 hover:border-[#E8192C]/50"}`}>
                          <div className="w-full aspect-video bg-black">
                            <iframe srcDoc={html} className="w-full h-full border-0 pointer-events-none" style={{ transform: "scale(1)", transformOrigin: "top left", width: "100%", height: "100%" }} onLoad={e => {
                              const doc = (e.target as HTMLIFrameElement).contentDocument;
                              if (doc) { loadKatex(doc); renderLatexInElement(doc.body, doc); }
                            }} />
                          </div>
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                            <button onClick={() => { setLiveEditing(slide.id); setLiveEditText(slide.editedTitle || slide.plan.title); }}
                              className="p-2.5 bg-white/95 hover:bg-white text-slate-800 rounded-xl text-xs font-bold transition-colors shadow-lg"><Type className="w-4 h-4" /></button>
                            <button onClick={() => { setLiveEditing(slide.id + "-c"); setLiveEditText(slide.editedContent || slide.plan.content); }}
                              className="p-2.5 bg-white/95 hover:bg-white text-slate-800 rounded-xl text-xs font-bold transition-colors shadow-lg"><AlignLeft className="w-4 h-4" /></button>
                            <button onClick={() => { setImageSearchOpen(slide.id); setImageQuery(slide.plan.title); searchImages(slide.plan.title, slide.id); }}
                              className="p-2.5 bg-white/95 hover:bg-white text-slate-800 rounded-xl text-xs font-bold transition-colors shadow-lg"><Image className="w-4 h-4" /></button>
                            <button onClick={() => { const c = prompt("Accent rang (hex):", colors.acc || slide.accentColor || selectedTemplate.accentColor); if (c) changeSlideColor(slide.id, "acc", c); }}
                              className="p-2.5 bg-white/95 hover:bg-white text-slate-800 rounded-xl text-xs font-bold transition-colors shadow-lg"><Palette className="w-4 h-4" /></button>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                            <div className="flex items-center justify-between">
                              <span className="px-2 py-0.5 bg-[#E8192C] text-white text-[10px] font-bold rounded-md">{i + 1}</span>
                              <span className="text-white text-[10px] font-bold truncate max-w-[70%]">{slide.editedTitle || slide.plan.title}</span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
              {liveEditing && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setLiveEditing(null)}>
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                    <h3 className="font-bold text-slate-900 dark:text-white">{liveEditing.includes("-c") ? "Matnni tahrirlash" : "Sarlavhani tahrirlash"}</h3>
                    <textarea value={liveEditText} onChange={e => setLiveEditText(e.target.value)} rows={5}
                      className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:border-[#E8192C] resize-none" />
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setLiveEditing(null)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold">Bekor</button>
                      <button onClick={() => {
                        const field = liveEditing.includes("-c") ? "editedContent" : "editedTitle";
                        const cleanId = liveEditing.replace("-c", "");
                        setPresentationSlides(prev => prev.map(s => s.id === cleanId ? { ...s, [field]: liveEditText } : s));
                        setLiveEditing(null);
                      }} className="px-4 py-2 bg-[#E8192C] text-white rounded-xl text-sm font-bold">Saqlash</button>
                    </div>
                  </div>
                </div>
              )}
              {imageSearchOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => { setImageSearchOpen(null); setImageResults([]); setImageQuery(""); }}>
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                    <h3 className="font-bold text-slate-900 dark:text-white mb-4">Rasm Qidirish</h3>
                    <div className="flex gap-2 mb-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input value={imageQuery} onChange={e => setImageQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && searchImages(imageQuery, imageSearchOpen)}
                          placeholder="Rasm qidirish..." className="w-full h-10 pl-10 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:border-[#E8192C]" />
                      </div>
                      <button onClick={() => searchImages(imageQuery, imageSearchOpen)} disabled={imageSearching}
                        className="px-4 h-10 bg-[#E8192C] text-white rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5">
                        {imageSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Qidirish
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      {imageSearching && (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="w-8 h-8 text-[#E8192C] animate-spin" />
                        </div>
                      )}
                      {!imageSearching && imageResults.length === 0 && (
                        <div className="text-center py-12 text-slate-400 text-sm">Rasm topilmadi</div>
                      )}
                      {!imageSearching && imageResults.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {imageResults.map((img, i) => (
                            <button key={i} onClick={() => selectImage(imageSearchOpen, img.thumbnail)}
                              className="relative group rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 hover:border-[#E8192C] transition-all">
                              <img src={img.thumbnail} alt={img.title} className="w-full aspect-video object-cover" loading="lazy" />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <div className="p-2 bg-white rounded-full"><Check className="w-4 h-4 text-[#E8192C]" /></div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end pt-4">
                      <button onClick={() => { setImageSearchOpen(null); setImageResults([]); setImageQuery(""); }} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold">Bekor</button>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex justify-center pt-4">
                {!generating && presentationSlides.length === 0 && (
                  <button onClick={generatePresentation} className="px-6 py-3 bg-[#E8192C] text-white rounded-2xl text-sm font-bold hover:opacity-90 flex items-center gap-2"><Sparkles className="w-4 h-4" /> Taqdimot Yaratish</button>
                )}
                {!generating && presentationSlides.length > 0 && (
                  <div className="flex gap-3">
                    <button onClick={() => setPresentationSlides([])} className="px-5 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold hover:opacity-90 flex items-center gap-1.5"><RotateCcw className="w-4 h-4" /> Qaytadan</button>
                    <button onClick={() => setStep(4)} className="px-6 py-3 bg-[#E8192C] text-white rounded-2xl text-sm font-bold hover:opacity-90 flex items-center gap-2"><Play className="w-4 h-4" /> To'liq ekran</button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="s4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">Tayyor</h2>
                  <p className="text-xs text-slate-500 mt-1">{presentationSlides.length} sahifa</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setStep(3)} className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:opacity-90">Dizayn</button>
                  <button onClick={startPresentation} className="px-5 py-2.5 bg-[#E8192C] text-white rounded-xl text-sm font-bold hover:opacity-90 flex items-center gap-2"><Play className="w-4 h-4" /> To'liq ekran</button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {presentationSlides.map((slide, i) => {
                  const colors = slideColors[slide.id] || {};
                  const html = buildSlideHTML(
                    { ...slide.plan, title: slide.editedTitle || slide.plan.title, content: slide.editedContent || slide.plan.content },
                    selectedTemplate,
                    { bg: colors.bg, txt: colors.txt, acc: colors.acc, imageUrl: slideImages[slide.id] || slide.imageUrl }
                  );
                  return (
                    <motion.div key={slide.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}
                      className="group relative cursor-pointer" onClick={() => { setCurrentSlide(i); startPresentation(); }}>
                      <div className="w-full aspect-video rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-800 group-hover:border-[#E8192C] transition-all bg-black">
                        <iframe srcDoc={html} className="w-full h-full border-0 pointer-events-none" onLoad={e => {
                          const doc = (e.target as HTMLIFrameElement).contentDocument;
                          if (doc) { loadKatex(doc); renderLatexInElement(doc.body, doc); }
                        }} />
                      </div>
                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                        <span className="px-2 py-1 bg-black/60 text-white text-[10px] font-bold rounded-lg backdrop-blur">{i + 1}</span>
                        <span className="px-2 py-1 bg-black/60 text-white text-[10px] font-bold rounded-lg truncate max-w-[60%] backdrop-blur">{slide.editedTitle || slide.plan.title}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function KeyboardNav({ onPrev, onNext, onExit }: { onPrev: () => void; onNext: () => void; onExit: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") { e.preventDefault(); onNext(); }
      else if (e.key === "ArrowLeft" || e.key === "Backspace") { e.preventDefault(); onPrev(); }
      else if (e.key === "Escape") { e.preventDefault(); onExit(); }
    };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, [onPrev, onNext, onExit]);
  return null;
}
