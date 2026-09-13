import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  PenTool, Camera, CameraOff, Video, ArrowLeft,
  CheckCircle2, Award, Zap, Scan, X, Trash2
} from "lucide-react";
import { Pen2Icon } from "@solar-icons/react/bold-duotone/pen-2";
import { CameraMinimalisticIcon } from "@solar-icons/react/bold-duotone/camera-minimalistic";
import { CheckCircleIcon } from "@solar-icons/react/bold-duotone/check-circle";
import { MedalRibbonStarIcon } from "@solar-icons/react/bold-duotone/medal-ribbon-star";
import { BoltIcon } from "@solar-icons/react/bold-duotone/bolt";
import { ScannerIcon } from "@solar-icons/react/bold-duotone/scanner";
import { TrashBinTrashIcon } from "@solar-icons/react/bold-duotone/trash-bin-trash";
import { useEduCoin } from "@/hooks/useEduCoin";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import SEO from "@/components/SEO";
import { incrementFeatureUsage } from "@/lib/subscriptionLimits";
import "katex/dist/katex.min.css";

const RUBRIC = [
  { id: "T1", category: "Topshiriq", criteria: "Publisistik uslub, mavzuni to'liq yoritish", max: 2 },
  { id: "T2", category: "Topshiriq", criteria: "Qarashlar va shaxsiy fikr", max: 2 },
  { id: "T3", category: "Topshiriq", criteria: "Dalillar bilan asoslanganlik", max: 2 },
  { id: "M4", category: "Matn", criteria: "Kompozitsiya (Kirish, asosiy, xulosa)", max: 2 },
  { id: "M5", category: "Matn", criteria: "Mantiqiy qurilish", max: 2 },
  { id: "M6", category: "Matn", criteria: "Mantiqiy-mazmuniy izchillik", max: 2 },
  { id: "S7", category: "Savodxonlik", criteria: "Imlo xatolari", max: 2 },
  { id: "S8", category: "Savodxonlik", criteria: "Punktuatsiya", max: 2 },
  { id: "U9", category: "Uslub", criteria: "Grammatik xatolar", max: 2 },
  { id: "U10", category: "Uslub", criteria: "So'z qo'llash aniqligi", max: 2 },
  { id: "L11", category: "Lug'at", criteria: "Nutq boyligi", max: 2 },
  { id: "L12", category: "Lug'at", criteria: "Nutq sofliqi", max: 2 },
];

interface GrammarError {
  word: string;
  suggestion: string;
  explanation: string;
  line: number;
}

interface CheckResult {
  errors: GrammarError[];
  summary: string;
  correctedText: string;
}

function normalizeErrors(raw: any): GrammarError[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.filter((e: any) => e && typeof e === 'object' && typeof e.word === 'string').map((e: any) => ({
      word: String(e.word || ''),
      suggestion: String(e.suggestion || ''),
      explanation: String(e.explanation || ''),
      line: Number(e.line) || 0,
    }));
  }
  if (typeof raw === 'object' && typeof raw.word === 'string') {
    return [{ word: String(raw.word), suggestion: String(raw.suggestion || ''), explanation: String(raw.explanation || ''), line: Number(raw.line) || 0 }];
  }
  return [];
}

function normalizeCheckResult(data: any): CheckResult {
  return {
    errors: normalizeErrors(data?.errors),
    summary: String(data?.summary || ''),
    correctedText: String(data?.correctedText || ''),
  };
}

const EssayChecker = () => {
  const navigate = useNavigate();
  const { profile, isAdmin } = useAuth();
  const isPremium = profile?.subscription_tier && profile.subscription_tier !== 'standart';

  const [mode, setMode] = useState<'check' | 'grade'>('check');
  const [essayText, setEssayText] = useState("");
  const [customTopicText, setCustomTopicText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const [usageCount, setUsageCount] = useState(0);
  const { toast } = useToast();

  const [ocrLoading, setOcrLoading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<'idle' | 'checking' | 'prompt' | 'granted' | 'denied'>('idle');
  const [showGuide, setShowGuide] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => { stopCamera(); };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setCameraPermission('idle');
  };

  const startCamera = async () => {
    setCameraActive(true);
    setCameraPermission('checking');
    // Avval navigator.permissions API ni tekshirish
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const status = await navigator.permissions.query({ name: 'camera' as PermissionName });
        if (status.state === 'denied') {
          setCameraPermission('denied');
          return;
        }
        if (status.state === 'granted') {
          await startCameraStream();
          setCameraPermission('granted');
          return;
        }
      } catch {
        // permissions API qo'llab-quvvatlanmasa — bevosita so'rash
      }
    }
    // Fallback: bevosita so'rash
    try {
      await startCameraStream();
      setCameraPermission('granted');
    } catch {
      setCameraPermission('prompt');
    }
  };

  const requestCameraPermission = async () => {
    setCameraPermission('checking');
    try {
      await startCameraStream();
      setCameraPermission('granted');
    } catch {
      setCameraPermission('denied');
    }
  };

  const startCameraStream = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
    });
    streamRef.current = stream;
    if (videoRef.current) videoRef.current.srcObject = stream;
  };

  const captureFromCamera = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current, c = canvasRef.current;
    c.width = v.videoWidth; c.height = v.videoHeight;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(v, 0, 0);
    stopCamera();
    await performOCR(c.toDataURL('image/png'));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onloadend = async () => { await performOCR(reader.result as string); };
    reader.readAsDataURL(file);
  };

  const performOCR = async (base64: string) => {
    const userId = profile?.user_id || profile?.id;
    if (userId) {
      const vCheck = await incrementFeatureUsage(userId, "vision_ai");
      if (!vCheck.allowed) {
        toast({
          title: "Vision AI (OCR) cheklovi",
          description: "Rasm orqali matn tahlili (Vision AI) faqat Premium va Pro obunachilar uchun taqdim etiladi!",
          variant: "destructive"
        });
        navigate("/settings/obuna");
        return;
      }
    }
    setOcrLoading(true);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: "pixtral-12b-2409",
          messages: [
            { role: "system", content: "Rasmdagi matnni aniq ko'chirib bering. Faqat matn, izohsiz." },
            { role: "user", content: [
              { type: "text", text: "Rasmdagi essey matnini ko'chirib bering:" },
              { type: "image_url", image_url: { url: base64 } }
            ] }
          ]
        })
      });
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content || "";
      if (text) {
        setEssayText(prev => prev ? prev + "\n" + text : text);
        toast({ title: "Matn aniqlandi!" });
      }
    } catch {
      toast({ title: "Xatolik", description: "Rasmdan matn o'qishda xatolik", variant: "destructive" });
    } finally {
      setOcrLoading(false);
    }
  };

  const fetchUsage = async () => {
    if (!profile || isAdmin || isPremium) return;
    try {
      const { data } = await supabase
        .from('ai_usage_logs' as any)
        .select('created_at')
        .eq('user_id', profile.id)
        .eq('feature_name', 'essay_checker')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true });
      const count = data?.length || 0;
      setUsageCount(count);
    } catch {}
  };

  useEffect(() => { fetchUsage(); }, [profile?.id]);

  const parseJsonSafe = (jsonStr: string): any => {
    try {
      return JSON.parse(jsonStr);
    } catch {
      let fixed = '';
      let inString = false;
      let escape = false;
      for (let i = 0; i < jsonStr.length; i++) {
        const ch = jsonStr[i];
        if (escape) { fixed += ch; escape = false; continue; }
        if (ch === '\\') { fixed += ch; escape = true; continue; }
        if (ch === '"') { inString = !inString; fixed += ch; continue; }
        if (inString && ch === '"') { fixed += "'"; continue; }
        fixed += ch;
      }
      return JSON.parse(fixed);
    }
  };

  const handleCheck = async () => {
    if (!essayText.trim()) return;
    const userId = profile?.user_id || profile?.id;
    if (userId) {
      const limitCheck = await incrementFeatureUsage(userId, "essay_checker");
      if (!limitCheck.allowed) {
        toast({
          title: "Kunlik limitga yetdingiz",
          description: "Standart tarifda kuniga 1 ta essey tekshirish beriladi. Cheksiz foydalanish uchun Premium obunaga o'ting!",
          variant: "destructive"
        });
        navigate("/settings/obuna");
        return;
      }
    }
    setLoading(true);
    setCheckResult(null);
    setResult(null);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'pixtral-12b-2409',
          messages: [
            { role: 'system', content: "Siz tajribali o'zbek tili o'qituvchisisiz. O'quvchining esseyini diqqat bilan tekshiring — huddi daftarni tekshirgandek." },
            { role: 'user', content: `O'quvchining esseyini tekshiring. Huddi o'qituvchi daftarini tekshirgandek — har bir xatolikni aniqlang.

QAT'IY QOIDALAR:
1. Har bir xatolik uchun aniqlik bilan yozing:
   - word: xato so'z
   - suggestion: to'g'ri variantini bering
   - explanation: nima uchun xato
   - line: qator raqami
2. Matnni to'g'rilangan variantini ham qaytaring
3. Qisqa xulosa yozing

O'ZBEK TILI IMLO QOIDALARI (shu qoidalarga qat'iy rioya qiling):
- Qisqa so'zlar (1-2 ta undoshdan iborat) so'z oxirida qisqa tovushlar (a, e, i, o, u) kelmasa, undoshlar qisqaradi: QAT'IY → Qatʼiy
- "texnologiya" so'zidan kelgan so'zlarda: texnologiyalaridan → texnologiyalardan
- "qulayliklar" obyekt bo'lsa: qulayliklar → qulayliklarni (fe'l obyekti)
- "ijobiy" + fe'l kelganda: ijobiy → ijobiya (fe'l predmeti)
- "tibbiyot" joy ma'nosida: tibbiyot → tibbiyotda
- Fe'l obyekti aniqlanganda: rentgen va MRT tasvirlarini → rentgen va MRT tasvirlarini (to'g'ri)
- "aniqlash" + yordam: aniqlashga → aniqlashga (to'g'ri)
- Fe'l obyekti: shifokorlarga → shifokorlarni, bemorlarni → bemorlarni (to'g'ri)
- Samaradorlik: samaradorligi → samaradorligi (to'g'ri)
- Fe'l shakli: foyda keltirmoqda → foyda keltirmoqda (to'g'ri)
- O'zbek tilida apostrof: o'quvchilarning → o'quvchilarning (to'g'ri)
- Fe'l obyekti: tavsiyalar → tavsiyalarni, ma'lumotlarni → ma'lumotlarni (to'g'ri)
- Fe'l obyekti: samarali qarorlar → samarali qarorlarni
- Fe'l predmeti: kompaniyalar → kompaniyalardan
- So'z tartibi: vaqtini tejashidir → vaqtni tejashdir
- Bo'shliq: tezbajarib → tez bajarib
- Fe'l predmeti: ishlarga → ishlarga (to'g'ri)
- Apostrof: mas'uliyat → masʼuliyat
- Xulosa: Xulosa → Xulosa (to'g'ri)
- Apostrof: ko'plab → ko'plab (to'g'ri)
- Joy kerak: kelajakda uning → kelajakda uning (to'g'ri)
- Ilova: jamiyat taraqqiyoti → jamiyat taraqqiyoti (to'g'ri)

Javobni FAQAT JSON formatida qaytaring, boshqa hech narsa yozmang:
{"errors":[{"word":"xato","suggestion":"to'g'ri","explanation":"sabab","line":1}],"summary":"xulosa","correctedText":"to'g'rilangan matn"}

ESSey:
${essayText}` }
          ]
        })
      });
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content || '';
      const jsonStart = content.indexOf('{');
      const jsonEnd = content.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonStr = content.substring(jsonStart, jsonEnd + 1).replace(/\n/g, " ").replace(/\r/g, " ");
        const parsed = parseJsonSafe(jsonStr);
        setCheckResult(normalizeCheckResult(parsed));
        setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    } catch {
      toast({ title: "Xatolik", description: "Tekshirishda xatolik", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGrade = async () => {
    if (!essayText.trim()) return;
    if (!customTopicText.trim()) {
      toast({ title: "Mavzu kiritilmagan", variant: "destructive" });
      return;
    }
    if (!isPremium && !isAdmin && usageCount >= 3) {
      toast({ title: "Kunlik limit tugadi", variant: "destructive" });
      return;
    }
    setLoading(true);
    setCheckResult(null);
    setResult(null);
    try {
      const prompt = `Siz professional ekspert-baholovchisiz. Essey matnini baholang.

Mavzu: ${customTopicText}
Essey: ${essayText}

Qoidalari:
1. Ballarni (0-2) qiyinchilik bilan bering
2. Xato bo'lsa ballni kamaytiring
3. Har bir kriteriya uchun qisqa izoh yozing

JSON formatda qaytaring:
{"total_score":number,"breakdown":[{"id":"T1","score":number,"comment":"izoh"}],"general_feedback":"xulosa","suggestions":["maslahat 1","maslahat 2"]}`;

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: "system", content: "Siz O'zbekiston Milliy Test tizimi bo'yicha ekspertisiz." },
            { role: "user", content: prompt }
          ]
        })
      });
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content || '';
      const jsonStart = content.indexOf('{');
      const jsonEnd = content.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonStr = content.substring(jsonStart, jsonEnd + 1).replace(/\n/g, " ").replace(/\r/g, " ");
        const parsed = parseJsonSafe(jsonStr);
        setResult(parsed);
        if (!isPremium && !isAdmin && profile?.id) {
          await (supabase as any).from('ai_usage_logs').insert({ user_id: profile.id, feature_name: 'essay_checker' });
          fetchUsage();
        }
        setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    } catch {
      toast({ title: "Xatolik", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number, max: number) => {
    const p = (score / max) * 100;
    if (p >= 80) return "text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400";
    if (p >= 50) return "text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400";
    return "text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400";
  };

  const getGradeInfo = (score: number) => {
    if (score >= 22) return { label: "A+", color: "bg-emerald-500" };
    if (score >= 19) return { label: "A", color: "bg-emerald-400" };
    if (score >= 16) return { label: "B+", color: "bg-amber-500" };
    if (score >= 13) return { label: "B", color: "bg-amber-400" };
    if (score >= 10) return { label: "C+", color: "bg-rose-400" };
    return { label: "C", color: "bg-rose-500" };
  };

  const reset = () => {
    setResult(null);
    setCheckResult(null);
    setEssayText("");
    setCustomTopicText("");
    setMode('check');
  };

  const wordCount = essayText.trim() === "" ? 0 : essayText.trim().split(/\s+/).filter(Boolean).length;

  const renderMarkedEssay = () => {
    if (!checkResult?.errors?.length || !essayText) return null;
    const lines = essayText.split('\n');
    return (
      <div className="space-y-1">
        {lines.map((line, lineIdx) => {
          const lineNum = lineIdx + 1;
          const lineErrors = checkResult.errors.filter(e => e.line === lineNum);
          if (lineErrors.length === 0) {
            return (
              <p key={lineIdx} className="text-[14px] text-slate-700 dark:text-slate-300 leading-loose">
                {line}
              </p>
            );
          }
          let parts: React.ReactNode[] = [];
          let remaining = line;
          lineErrors.forEach((err, ei) => {
            if (!err.word) return;
            const idx = remaining.toLowerCase().indexOf(err.word.toLowerCase());
            if (idx === -1) {
              parts.push(<span key={`t-${ei}`}>{remaining}</span>);
              remaining = '';
              return;
            }
            if (idx > 0) parts.push(<span key={`pre-${ei}`}>{remaining.substring(0, idx)}</span>);
            parts.push(
              <span key={`err-${ei}`} className="relative inline-block group">
                <span className="line-through text-red-500 font-semibold">{remaining.substring(idx, idx + err.word.length)}</span>
                <span className="ml-1 text-emerald-600 font-semibold">{err.suggestion}</span>
                <span className="hidden group-hover:inline-flex absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-xl bg-slate-900 text-white text-[11px] font-medium whitespace-nowrap z-50 shadow-lg">
                  {err.explanation}
                </span>
              </span>
            );
            remaining = remaining.substring(idx + err.word.length);
          });
          if (remaining) parts.push(<span key="rest">{remaining}</span>);
          return (
            <p key={lineIdx} className="text-[14px] leading-loose">
              {parts}
            </p>
          );
        })}
      </div>
    );
  };

  const hasResult = checkResult || result;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F1A]">
      <SEO title="Essay Checker - EduContest" description="AI bilan esseyingizni tekshiring va baholang." />

      {/* Premium Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#E8192C] via-[#C41420] to-[#8B0000]" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
        <motion.div
          className="absolute top-10 right-20 w-48 h-48 bg-white/10 rounded-full blur-3xl"
          animate={{ x: [0, 20, 0], y: [0, -15, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-10 left-20 w-32 h-32 bg-amber-400/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/80 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
                  <Pen2Icon size={20} className="text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight">Essay Checker</h1>
                  <p className="text-[11px] font-medium text-white/60 uppercase tracking-wider">AI bilan esseyingizni tekshiring va baholang</p>
                </div>
              </div>
            </div>
            {hasResult && (
              <button onClick={reset}
                className="flex items-center gap-1 px-4 py-2 rounded-xl text-[13px] font-medium text-white/80 bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors">
                <TrashBinTrashIcon size={16} /> Yangi
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Split Layout: Left = Input, Right = Results */}
        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_280px] gap-5">

          {/* LEFT — Input */}
          <div className="space-y-5">
            {/* Mavzu — kamera faol bo'lmasa ko'rinadi */}
            {!cameraActive && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Essey mavzusi</span>
                  <span className="text-[11px] font-medium text-slate-400">
                    {isPremium || isAdmin ? "LIMITSIZ" : `${usageCount}/3`}
                  </span>
                </div>
                <div className="p-5">
                  <input
                    type="text"
                    value={customTopicText}
                    onChange={(e) => setCustomTopicText(e.target.value)}
                    placeholder="Mavzuni kiriting..."
                    className="w-full text-[15px] font-medium text-slate-900 dark:text-white bg-transparent focus:outline-none placeholder:text-slate-300"
                  />
                </div>
              </div>
            )}

            {/* Essey matni — kamera faol bo'lmasa ko'rinadi */}
            {!cameraActive && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <Pen2Icon size={16} className="text-[#E8192C]" />
                    <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Essey matni</span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-400">
                    So'zlar: <span className={wordCount >= 50 ? 'text-[#E8192C]' : 'text-slate-400'}>{wordCount}</span>
                  </span>
                </div>
                {/* Daftar ko'rinishi */}
                <div
                  className="relative"
                  style={{
                    background: 'repeating-linear-gradient(to bottom, transparent, transparent 31px, #dde8f5 31px, #dde8f5 32px)',
                    backgroundPositionY: '8px',
                  }}
                >
                  {/* Qizil chiziq — chap tomonda */}
                  <div className="absolute left-14 top-0 bottom-0 w-[1.5px] bg-red-300/50 dark:bg-red-800/40 pointer-events-none z-10" />
                  <textarea
                    value={essayText}
                    onChange={(e) => setEssayText(e.target.value)}
                    placeholder="Esseningizni shu yerga yozing..."
                    className="w-full min-h-[380px] max-h-[520px] pl-16 pr-5 pt-2 pb-4 bg-transparent focus:outline-none resize-none custom-scrollbar"
                    style={{
                      fontFamily: "'Caveat', cursive",
                      fontSize: '19px',
                      lineHeight: '32px',
                      color: 'inherit',
                      caretColor: '#E8192C',
                      letterSpacing: '0.02em',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Kamera — faqat kamera faol bo'lganda ko'rinadi, katta hajmda */}
            {cameraActive && (
              <div className="bg-[#E8192C] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <CameraMinimalisticIcon size={16} className="text-white" />
                    <span className="text-[11px] font-medium text-white uppercase tracking-wider">Kamera — Matnni skanerlang</span>
                  </div>
                  <button onClick={stopCamera}
                    className="text-[11px] font-medium text-white hover:text-red-200 transition-colors flex items-center gap-1">
                    <CameraMinimalisticIcon size={14} /> Yopish
                  </button>
                </div>
                <div className="p-3">
                  <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 relative bg-black">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-auto min-h-[300px] max-h-[500px] bg-black object-cover" style={{ display: cameraPermission === 'granted' ? 'block' : 'none' }} />

                    {/* Camera Permission UI */}
                    {cameraPermission !== 'granted' && (
                      <div className="flex flex-col items-center justify-center p-6 min-h-[300px]">
                        {cameraPermission === 'checking' && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-3">
                            <div className="w-14 h-14 rounded-xl bg-slate-800 flex items-center justify-center">
                              <div className="w-7 h-7 border-2 border-white/20 border-t-[#E8192C] rounded-full animate-spin" />
                            </div>
                            <p className="text-[13px] text-white/80 font-medium">Kamera tekshirilmoqda...</p>
                          </motion.div>
                        )}

                        {cameraPermission === 'prompt' && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-3 text-center">
                            <span className="material-symbols-rounded text-[#E8192C] text-[48px]" style={{ fontVariationSettings: "'FILL' 1" }}>camera</span>
                            <div>
                              <p className="text-[14px] font-bold text-white">Kamera ruxsati kerak</p>
                              <p className="text-[12px] text-white/60">Matnni skanerlash uchun kameraga ruxsat bering</p>
                            </div>
                            <button onClick={requestCameraPermission}
                              className="px-6 py-2.5 rounded-xl bg-[#E8192C] text-white text-[13px] font-bold hover:bg-[#C42B30] active:scale-95 transition-all flex items-center gap-2">
                              <span className="material-symbols-rounded text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>camera</span>
                              Ruxsat berish
                            </button>
                          </motion.div>
                        )}

                        {cameraPermission === 'denied' && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-3 text-center">
                            <motion.div
                              animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
                              transition={{ duration: 0.5, delay: 0.2 }}
                              className="w-16 h-16 rounded-full border-2 border-red-400/50 flex items-center justify-center cursor-pointer bg-slate-800"
                              onClick={() => setShowGuide(true)}
                            >
                              <span className="material-symbols-rounded text-red-400 text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                            </motion.div>
                            <div>
                              <p className="text-[14px] font-bold text-white">Kamera bloklangan</p>
                              <p className="text-[12px] text-white/60">Brauzer sozlamalaridan kamerani yoqing</p>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => setShowGuide(true)}
                                className="px-5 py-2.5 rounded-xl bg-[#E8192C] text-white text-[12px] font-bold hover:bg-[#C42B30] active:scale-95 transition-all flex items-center gap-1.5">
                                <span className="material-symbols-rounded text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>help</span>
                                Qanday ochish
                              </button>
                              <button onClick={requestCameraPermission}
                                className="px-5 py-2.5 rounded-xl bg-slate-700 text-white text-[12px] font-medium hover:bg-slate-600 active:scale-95 transition-all flex items-center gap-1.5">
                                <span className="material-symbols-rounded text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>refresh</span>
                                Qayta urinish
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    )}

                    {/* Kamera tugmalari — ruxsat berilganda ko'rinadi */}
                    {cameraPermission === 'granted' && (
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
                        <button onClick={captureFromCamera} className="w-14 h-14 rounded-full bg-[#E8192C] ring-4 ring-white/30 flex items-center justify-center active:scale-95 transition-transform shadow-lg">
                          <CameraMinimalisticIcon size={24} className="text-white" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Toolbar — doimo ko'rinadi */}
            <div className="px-1 flex items-center gap-2">
              <input type="file" ref={imageInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
              <canvas ref={canvasRef} className="hidden" />
              <button onClick={() => imageInputRef.current?.click()} disabled={ocrLoading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-[13px] font-medium text-slate-500 hover:text-[#E8192C] transition-colors disabled:opacity-50">
                {ocrLoading ? <div className="w-3.5 h-3.5 border-2 border-[#E8192C]/30 border-t-[#E8192C] rounded-full animate-spin" /> : <CameraMinimalisticIcon size={16} />}
                Rasm
              </button>
              <button onClick={cameraActive ? stopCamera : startCamera}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium transition-colors ${
                  cameraActive
                    ? 'bg-[#E8192C] text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-[#E8192C]'
                }`}>
                {cameraActive ? <CameraMinimalisticIcon size={16} /> : <CameraMinimalisticIcon size={16} />}
                {cameraActive ? 'Kamerani yopish' : 'Kamera'}
              </button>
              {essayText && !cameraActive && (
                <button onClick={() => { setEssayText(''); setResult(null); setCheckResult(null); }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium text-slate-400 hover:text-red-500 transition-colors">
                  <TrashBinTrashIcon size={16} /> Tozalash
                </button>
              )}
            </div>

            {/* Rejim tanlash */}
            <div className="flex rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
              <button onClick={() => { setMode('check'); setResult(null); setCheckResult(null); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-[13px] font-medium transition-all ${
                  mode === 'check' ? 'bg-[#E8192C] text-white' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}>
                <ScannerIcon size={18} /> Tekshirish
              </button>
              <button onClick={() => { setMode('grade'); setResult(null); setCheckResult(null); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-[13px] font-medium transition-all ${
                  mode === 'grade' ? 'bg-[#E8192C] text-white' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}>
                <BoltIcon size={18} /> Baholash
              </button>
            </div>

            {/* Asosiy tugma */}
            <button onClick={mode === 'check' ? handleCheck : handleGrade}
              disabled={!essayText.trim() || loading}
              className="w-full py-3.5 rounded-xl text-[13px] font-medium text-white transition-opacity hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: "#E8192C" }}>
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {mode === 'check' ? 'Tekshirilmoqda...' : 'Baholanmoqda...'}</>
              ) : (
                <>{mode === 'check' ? <><ScannerIcon size={18} /> Tekshirish</> : <><BoltIcon size={18} /> Baholash</>}</>
              )}
            </button>

            {/* Mobile: Natija pastda chiqadi */}
            <div className="lg:hidden">
              {loading && (
                <div className="flex items-center justify-center py-10">
                  <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="w-5 h-5 border-2 border-[#E8192C]/30 border-t-[#E8192C] rounded-full animate-spin" />
                    <span className="text-[13px] font-medium text-slate-500">
                      {mode === 'check' ? 'Essey tekshirilmoqda...' : 'Essey baholanmoqda...'}
                    </span>
                  </div>
                </div>
              )}
              {checkResult && !loading && <MobileCheckResult checkResult={checkResult} essayText={essayText} renderMarkedEssay={renderMarkedEssay} />}
              {result && !loading && <MobileGradeResult result={result} getGradeInfo={getGradeInfo} getScoreColor={getScoreColor} />}
            </div>
          </div>

          {/* RIGHT — Results (PC) */}
          <div ref={resultRef} className="hidden lg:block">
            {loading && (
              <div className="flex items-center justify-center py-10">
                <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="w-5 h-5 border-2 border-[#E8192C]/30 border-t-[#E8192C] rounded-full animate-spin" />
                  <span className="text-[13px] font-medium text-slate-500">
                    {mode === 'check' ? 'Essey tekshirilmoqda...' : 'Essey baholanmoqda...'}
                  </span>
                </div>
              </div>
            )}

            {/* Tekshirish natijasi — PC */}
            {checkResult && !loading && (
              <div className="space-y-5">
                {/* Xatolar soni */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    {checkResult.errors?.length > 0 ? (
                      <>
                        <div className="w-7 h-7 rounded-lg bg-[#E8192C]/10 flex items-center justify-center">
                          <X className="w-4 h-4 text-[#E8192C]" />
                        </div>
                        <span className="text-[13px] font-semibold text-slate-900 dark:text-white">{checkResult.errors.length} ta xatolik topildi</span>
                      </>
                    ) : (
                      <>
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        </div>
                        <span className="text-[13px] font-semibold text-emerald-600">Xatolik topilmadi!</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Xulosa */}
                {checkResult.summary && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2">Xulosa</p>
                    <p className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">{checkResult.summary}</p>
                  </div>
                )}

                {/* Xatolar ro'yxati */}
                {checkResult.errors?.length > 0 && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Xatolar</span>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[400px] overflow-y-auto custom-scrollbar">
                      {checkResult.errors.map((err, i) => (
                        <div key={i} className="px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                          <div className="flex items-start gap-2">
                            <span className="text-[10px] font-semibold text-white bg-[#E8192C] w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 text-[12px] mb-0.5">
                                <span className="font-semibold text-red-500 line-through">{err.word}</span>
                                <span className="text-slate-400">→</span>
                                <span className="font-semibold text-emerald-600">{err.suggestion}</span>
                                {err.line ? <span className="text-[10px] text-slate-400">q.{err.line}</span> : null}
                              </div>
                              <p className="text-[11px] text-slate-500">{err.explanation}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* To'g'rilangan matn */}
                {checkResult.correctedText && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">To'g'rilangan variant</span>
                    </div>
                    <div className="p-5 max-h-[300px] overflow-y-auto custom-scrollbar">
                      <p className="text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{checkResult.correctedText}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Baholash natijasi — PC */}
            {result && !loading && (
              <div className="space-y-5">
                {/* Ball */}
                {(() => {
                  const grade = getGradeInfo(result.total_score);
                  const pct = Math.round((result.total_score / 24) * 100);
                  return (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl font-semibold text-slate-900 dark:text-white leading-none tabular-nums">{result.total_score}</span>
                        <span className="text-sm font-medium text-slate-400">/ 24</span>
                        <div className="flex-1 h-[3px] rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div className="h-full rounded-full bg-[#E8192C] transition-all duration-700" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="bg-[#E8192C] px-2.5 py-1 rounded-lg text-white flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          <span className="text-[12px] font-semibold">{grade.label}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Kriteriyalar */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Baholash mezonlari</span>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[400px] overflow-y-auto custom-scrollbar">
                    {RUBRIC.map((item) => {
                      const scoreData = result.breakdown?.find((r: any) => r.id === item.id) || { score: 0, comment: "" };
                      return (
                        <div key={item.id} className="px-5 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-semibold text-[#E8192C] px-1.5 py-0.5 bg-[#E8192C]/10 rounded-md shrink-0">{item.id}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] font-medium text-slate-700 dark:text-slate-300 truncate">{item.criteria}</p>
                              {scoreData.comment && <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{scoreData.comment}</p>}
                            </div>
                            <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${getScoreColor(scoreData.score, item.max)}`}>
                              <span className="text-[11px] font-semibold">{scoreData.score}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Xulosa */}
                {result.general_feedback && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2">Xulosa</p>
                    <div className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{result.general_feedback}</ReactMarkdown>
                    </div>
                  </div>
                )}

                {/* Tavsiyalar */}
                {result.suggestions?.length > 0 && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2">Tavsiyalar</p>
                    <div className="space-y-2">
                      {result.suggestions.map((s: string, i: number) => (
                        <div key={i} className="flex gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#E8192C] shrink-0 mt-0.5" />
                          <div className="text-[12px] text-slate-600 dark:text-slate-400 leading-relaxed">
                            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{s}</ReactMarkdown>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Empty state */}
            {!hasResult && !loading && (
              <div className="flex flex-col items-center justify-center py-20 text-slate-300 dark:text-slate-600">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                  <PenTool className="w-7 h-7 text-slate-400" />
                </div>
                <p className="text-[13px] font-medium text-slate-400 dark:text-slate-500">Esseyni kiriting yoki rasm skanerlang</p>
                <p className="text-[12px] text-slate-300 dark:text-slate-600 mt-1">Tekshirish yoki Baholash tugmasini bosing</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Camera Permission Guide Modal ─── */}
      <AnimatePresence>
        {showGuide && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowGuide(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-[380px] overflow-hidden"
              onClick={(e) => e.stopPropagation()}>

              {/* Header */}
              <div className="bg-[#E8192C] px-5 py-4 flex items-center gap-3">
                <span className="material-symbols-rounded text-white text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>camera</span>
                <div>
                  <h3 className="text-[14px] font-bold text-white">Kamerani yoqing</h3>
                  <p className="text-[11px] text-white/80">Quyidagi qadamlarni bajarang</p>
                </div>
              </div>

              {/* Steps */}
              <div className="p-5 space-y-4">
                {/* Step 1 */}
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#E8192C] flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[12px] font-bold text-white">1</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 mb-1">
                      Manzil satridagi <span className="material-symbols-rounded text-[16px] align-middle text-slate-500" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span> belgisini bosing
                    </p>
                    <div className="bg-slate-100 dark:bg-slate-700/50 rounded-lg p-2.5 flex items-center gap-2">
                      <span className="material-symbols-rounded text-[18px] text-slate-400" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{window.location.hostname}</span>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#E8192C] flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[12px] font-bold text-white">2</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 mb-1">
                      "Kamera" qatoridagi tugmani yoqing
                    </p>
                    <div className="bg-slate-100 dark:bg-slate-700/50 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-rounded text-[18px] text-slate-500" style={{ fontVariationSettings: "'FILL' 1" }}>videocam</span>
                        <span className="text-[12px] text-slate-600 dark:text-slate-300 font-medium">Kamera</span>
                      </div>
                      <div className="w-10 h-5 bg-emerald-500 rounded-full relative">
                        <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#E8192C] flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[12px] font-bold text-white">3</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 mb-1">
                      Sahifani qayta yuklang
                    </p>
                    <div className="bg-slate-100 dark:bg-slate-700/50 rounded-lg p-2.5 flex items-center gap-2">
                      <span className="material-symbols-rounded text-[18px] text-slate-400" style={{ fontVariationSettings: "'FILL' 1" }}>refresh</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-600 rounded text-[10px] font-mono border border-slate-200 dark:border-slate-500">F5</kbd> yoki <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-600 rounded text-[10px] font-mono border border-slate-200 dark:border-slate-500">Ctrl+R</kbd>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 pb-5">
                <button onClick={() => { setShowGuide(false); requestCameraPermission(); }}
                  className="w-full py-3 rounded-xl bg-[#E8192C] text-white text-[13px] font-bold hover:bg-[#C42B30] active:scale-[0.98] transition-all shadow-lg shadow-[#E8192C]/25 flex items-center justify-center gap-2">
                  <span className="material-symbols-rounded text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                  Tayyor, qayta urinish
                </button>
                <button onClick={() => setShowGuide(false)}
                  className="w-full py-2 mt-2 text-[12px] font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                  Yopish
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function MobileCheckResult({ checkResult, essayText, renderMarkedEssay }: { checkResult: CheckResult; essayText: string; renderMarkedEssay: () => React.ReactNode }) {
  return (
    <div className="space-y-5">
      {checkResult.errors?.length > 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-[#E8192C]/10 flex items-center justify-center">
              <X className="w-4 h-4 text-[#E8192C]" />
            </div>
            <span className="text-[13px] font-semibold text-slate-900 dark:text-white">{checkResult.errors.length} ta xatolik topildi</span>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          <span className="text-[13px] font-semibold text-emerald-600">Xatolik topilmadi!</span>
        </div>
      )}
      {checkResult.summary && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2">Xulosa</p>
          <p className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">{checkResult.summary}</p>
        </div>
      )}
      {checkResult.errors?.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Xatolar</span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {checkResult.errors.map((err, i) => (
              <div key={i} className="px-5 py-3">
                <div className="flex items-start gap-2">
                  <span className="text-[10px] font-semibold text-white bg-[#E8192C] w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-[12px] mb-0.5">
                      <span className="font-semibold text-red-500 line-through">{err.word}</span>
                      <span className="text-slate-400">→</span>
                      <span className="font-semibold text-emerald-600">{err.suggestion}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">{err.explanation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {checkResult.correctedText && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">To'g'rilangan variant</span>
          </div>
          <div className="p-5">
            <p className="text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{checkResult.correctedText}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function MobileGradeResult({ result, getGradeInfo, getScoreColor }: { result: any; getGradeInfo: (s: number) => { label: string; color: string }; getScoreColor: (s: number, m: number) => string }) {
  const grade = getGradeInfo(result.total_score);
  const pct = Math.round((result.total_score / 24) * 100);
  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <span className="text-3xl font-semibold text-slate-900 dark:text-white tabular-nums">{result.total_score}</span>
          <span className="text-sm font-medium text-slate-400">/ 24</span>
          <div className="flex-1 h-[3px] rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div className="h-full rounded-full bg-[#E8192C]" style={{ width: `${pct}%` }} />
          </div>
          <div className="bg-[#E8192C] px-2.5 py-1 rounded-lg text-white flex items-center gap-1">
            <Award className="w-3 h-3" />
            <span className="text-[12px] font-semibold">{grade.label}</span>
          </div>
        </div>
      </div>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Baholash mezonlari</span>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {RUBRIC.map((item) => {
            const scoreData = result.breakdown?.find((r: any) => r.id === item.id) || { score: 0, comment: "" };
            return (
              <div key={item.id} className="px-5 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-semibold text-[#E8192C] px-1.5 py-0.5 bg-[#E8192C]/10 rounded-md shrink-0">{item.id}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-slate-700 dark:text-slate-300 truncate">{item.criteria}</p>
                    {scoreData.comment && <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{scoreData.comment}</p>}
                  </div>
                  <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${getScoreColor(scoreData.score, item.max)}`}>
                    <span className="text-[11px] font-semibold">{scoreData.score}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {result.general_feedback && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2">Xulosa</p>
          <div className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{result.general_feedback}</ReactMarkdown>
          </div>
        </div>
      )}
      {result.suggestions?.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2">Tavsiyalar</p>
          <div className="space-y-2">
            {result.suggestions.map((s: string, i: number) => (
              <div key={i} className="flex gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#E8192C] shrink-0 mt-0.5" />
                <div className="text-[12px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{s}</ReactMarkdown>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default EssayChecker;
