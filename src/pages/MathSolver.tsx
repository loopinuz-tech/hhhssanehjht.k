import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CameraMinimalisticIcon } from "@solar-icons/react/bold-duotone/camera-minimalistic";
import { CalculatorMinimalisticIcon } from "@solar-icons/react/bold-duotone/calculator-minimalistic";
import { UploadIcon } from "@solar-icons/react/bold-duotone/upload";
import { LightbulbIcon } from "@solar-icons/react/bold-duotone/lightbulb";
import { BoltIcon } from "@solar-icons/react/bold-duotone/bolt";
import { ScannerIcon } from "@solar-icons/react/bold-duotone/scanner";
import { RestartIcon } from "@solar-icons/react/bold-duotone/restart";
import { GalleryIcon } from "@solar-icons/react/bold-duotone/gallery";
import { CloseCircleIcon } from "@solar-icons/react/bold-duotone/close-circle";
import { CheckCircleIcon } from "@solar-icons/react/bold-duotone/check-circle";
import { DownloadIcon } from "@solar-icons/react/bold-duotone/download";
import { ArrowLeftIcon } from "@solar-icons/react/bold-duotone/arrow-left";
import { AltArrowRightIcon } from "@solar-icons/react/bold-duotone/alt-arrow-right";
import { TrashBinMinimalisticIcon } from "@solar-icons/react/bold-duotone/trash-bin-minimalistic";
import { ArrowRightIcon } from "@solar-icons/react/bold-duotone/arrow-right";
import SEO from '@/components/SEO';
import TeX from '@matejmazur/react-katex';
import 'katex/dist/katex.min.css';
import 'mathlive';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/* ─── Helpers ─────────────────────────────────────────────── */

function cleanLatex(text: string): string {
  if (!text) return '';
  return text.replace(/\\\(/g, '').replace(/\\\)/g, '').replace(/\\\[/g, '').replace(/\\\]/g, '').trim();
}

function renderTex(formula: string) {
  if (!formula) return null;
  try {
    return <TeX math={cleanLatex(formula)} />;
  } catch {
    return <span className="font-mono text-sm">{formula}</span>;
  }
}

function renderInlineTex(text: string) {
  if (!text) return null;
  const hasLatex = /\\[(] | \\[)]|\\frac|\\sin|\\cos|\\sqrt|\\int|\\sum|\\pi|\^|_/i.test(text);
  if (!hasLatex) return <>{text}</>;
  try {
    return <TeX math={cleanLatex(text)} />;
  } catch {
    return <span>{text}</span>;
  }
}

/* ─── Math Expression Parser ──────────────────────────────── */

function parseMathExpr(expr: string): ((x: number) => number) | null {
  try {
    let e = expr
      .replace(/\\left\(/g, '(').replace(/\\right\)/g, ')')
      .replace(/\\cdot/g, '*').replace(/\\times/g, '*').replace(/\\div/g, '/')
      .replace(/\\pi/g, `${Math.PI}`).replace(/\\e(?!x)/g, `${Math.E}`)
      .replace(/\\sqrt{([^}]+)}/g, 'sqrt($1)')
      .replace(/\\frac{([^}]+)}{([^}]+)}/g, '($1)/($2)')
      .replace(/\\sin/g, 'sin').replace(/\\cos/g, 'cos').replace(/\\tan/g, 'tan')
      .replace(/\\cot/g, 'cot').replace(/\\sec/g, 'sec').replace(/\\csc/g, 'csc')
      .replace(/\\arcsin/g, 'asin').replace(/\\arccos/g, 'acos').replace(/\\arctan/g, 'atan')
      .replace(/\\ln/g, 'ln').replace(/\\log/g, 'log').replace(/\\exp/g, 'exp')
      .replace(/\\abs/g, 'abs').replace(/\|([^|]+)\|/g, 'abs($1)')
      .replace(/\\,/g, '').replace(/\\;/g, '').replace(/\\text{[^}]*}/g, '')
      .replace(/\\\\/g, '').replace(/\{/g, '(').replace(/\}/g, ')')
      .replace(/\\int\s*\(?([^)]*)\)?\s*(?:\\?,?\s*dx)?/gi, (_, inner) => `(${inner})`)
      .replace(/\s*=\s*[^=]*$/, '')
      .replace(/x\^(\d+)/g, (_, n) => `pow(x,${n})`)
      .replace(/x\^{([^}]+)}/g, 'pow(x,$1)')
      .replace(/(\d)(x)/g, '$1*x').replace(/x(\d)/g, 'x*$1')
      .replace(/\)(x)/g, ')*x').replace(/x\(/g, 'x*(')
      .replace(/\)\(/g, ')*(').replace(/(\d)\(/g, '$1*(')
      .replace(/\)(\d)/g, ')*$1')
      .replace(/([a-df-z_]+)\s*\^\s*{([^}]+)}/gi, 'pow($1,$2)')
      .replace(/([a-df-z_]+)\s*\^\s*(\d+)/gi, 'pow($1,$2)')
      .replace(/\^/g, '**').replace(/(\d)(\*\*)(\d)/g, '$1**$3');

    e = e.replace(/\bsin\b/g, 'Math.sin').replace(/\bcos\b/g, 'Math.cos')
      .replace(/\btan\b/g, 'Math.tan').replace(/\bcot\b/g, '(1/Math.tan)')
      .replace(/\bsec\b/g, '(1/Math.cos)').replace(/\bcsc\b/g, '(1/Math.sin)')
      .replace(/\basin\b/g, 'Math.asin').replace(/\bacos\b/g, 'Math.acos').replace(/\batan\b/g, 'Math.atan')
      .replace(/\bln\b/g, 'Math.log').replace(/\blog\b/g, 'Math.log10')
      .replace(/\bexp\b/g, 'Math.exp').replace(/\bsqrt\b/g, 'Math.sqrt')
      .replace(/\babs\b/g, 'Math.abs').replace(/\bpow\b/g, 'Math.pow')
      .replace(/\bpi\b/g, `${Math.PI}`).replace(/\be\b/g, `${Math.E}`);

    const fn = new Function('x', `"use strict"; return (${e});`) as (x: number) => number;
    fn(1);
    return fn;
  } catch {
    return null;
  }
}

/* ─── GraphPlot Component ─────────────────────────────────── */

function GraphPlot({ formula, label }: { formula: string; label?: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const W = 360, H = 220;
  const [scale, setScale] = useState(25);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [hover, setHover] = useState<{ x: number; y: number; px: number; py: number } | null>(null);
  const dragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  const c = cleanLatex(formula);
  const fn = parseMathExpr(c);
  const cx = W / 2 + offset.x;
  const cy = H / 2 + offset.y;
  const xMin = (-cx) / scale, xMax = (W - cx) / scale;
  const yMin = (cy - H) / scale, yMax = cy / scale;

  const gridStep = (() => {
    const raw = 80 / scale;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const norm = raw / mag;
    if (norm < 2) return mag;
    if (norm < 5) return 2 * mag;
    return 5 * mag;
  })();

  const polyline = useCallback(() => {
    if (!fn) return '';
    const pts: string[] = [];
    let prevY: number | null = null;
    for (let px = 0; px < W; px++) {
      const x = (px - cx) / scale;
      let y: number;
      try { y = fn(x); } catch { continue; }
      if (!isFinite(y) || isNaN(y)) { prevY = null; continue; }
      if (prevY !== null && Math.abs(y - prevY) > (yMax - yMin) * 3) { prevY = null; continue; }
      const py = cy - y * scale;
      if (py < -50 || py > H + 50) { prevY = y; continue; }
      prevY = y;
      pts.push(`${px},${py}`);
    }
    return pts.length > 1 ? pts.join(' ') : '';
  }, [fn, cx, cy, scale, xMin, xMax, yMin, yMax])();

  const gridLines = useMemo(() => {
    const lines: { x1: number; y1: number; x2: number; y2: number; major: boolean }[] = [];
    for (let gx = Math.floor(xMin / gridStep) * gridStep; gx <= xMax; gx += gridStep) {
      const px = cx + gx * scale;
      lines.push({ x1: px, y1: 0, x2: px, y2: H, major: Math.abs(gx % gridStep) < gridStep * 0.01 });
    }
    for (let gy = Math.floor(yMin / gridStep) * gridStep; gy <= yMax; gy += gridStep) {
      const py = cy - gy * scale;
      lines.push({ x1: 0, y1: py, x2: W, y2: py, major: Math.abs(gy % gridStep) < gridStep * 0.01 });
    }
    return lines;
  }, [xMin, xMax, yMin, yMax, cx, cy, scale, gridStep, W, H]);

  const axisLabels = useMemo(() => {
    const labels: { x: number; y: number; text: string }[] = [];
    for (let gx = Math.floor(xMin / gridStep) * gridStep; gx <= xMax; gx += gridStep) {
      if (Math.abs(gx) < gridStep * 0.01) continue;
      const px = cx + gx * scale;
      if (px > 20 && px < W - 20) labels.push({ x: px, y: Math.min(Math.max(cy + 14, 14), H - 2), text: parseFloat(gx.toPrecision(4)).toString() });
    }
    for (let gy = Math.floor(yMin / gridStep) * gridStep; gy <= yMax; gy += gridStep) {
      if (Math.abs(gy) < gridStep * 0.01) continue;
      const py = cy - gy * scale;
      if (py > 14 && py < H - 4) labels.push({ x: Math.max(Math.min(cx - 4, W - 20), 4), y: py + 4, text: parseFloat(gy.toPrecision(4)).toString() });
    }
    return labels;
  }, [xMin, xMax, yMin, yMax, cx, cy, scale, gridStep, W, H]);

  const handleMouseDown = (e: React.MouseEvent) => { dragging.current = true; lastMouse.current = { x: e.clientX, y: e.clientY }; };
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    const svgY = ((e.clientY - rect.top) / rect.height) * H;
    setHover({ x: (svgX - cx) / scale, y: (cy - svgY) / scale, px: svgX, py: svgY });
    if (dragging.current) {
      setOffset(p => ({ x: p.x + (e.clientX - lastMouse.current.x) * (W / rect.width), y: p.y + (e.clientY - lastMouse.current.y) * (H / rect.height) }));
      lastMouse.current = { x: e.clientX, y: e.clientY };
    }
  };
  const handleMouseUp = () => { dragging.current = false; };
  const handleWheel = (e: React.WheelEvent) => { e.preventDefault(); setScale(p => Math.max(5, Math.min(200, p * (e.deltaY > 0 ? 0.9 : 1.1)))); };

  if (!fn) return (
    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
      {label && <p className="text-[10px] text-slate-400 mb-1">{label}</p>}
      <p className="text-[11px] text-slate-400 text-center py-3">Grafik ko'rsatib bo'lmadi</p>
    </div>
  );

  return (
    <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="flex items-center justify-between px-2 py-1 border-b border-slate-200 dark:border-slate-700">
        {label && <p className="text-[10px] text-slate-400 font-mono">{label}</p>}
        <div className="flex items-center gap-0.5">
          <button onClick={() => setScale(s => Math.min(200, s * 1.3))} className="w-5 h-5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[10px] font-bold text-slate-500 hover:bg-slate-100">+</button>
          <button onClick={() => setScale(s => Math.max(5, s * 0.7))} className="w-5 h-5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[10px] font-bold text-slate-500 hover:bg-slate-100">−</button>
          <button onClick={() => { setScale(25); setOffset({ x: 0, y: 0 }); }} className="w-5 h-5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[9px] text-slate-500 hover:bg-slate-100">⟲</button>
        </div>
      </div>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto cursor-crosshair select-none"
        onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={() => { setHover(null); dragging.current = false; }} onWheel={handleWheel}>
        {gridLines.map((g, i) => (
          <line key={i} x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2}
            stroke="currentColor" className={g.major ? 'text-slate-300 dark:text-slate-600' : 'text-slate-100 dark:text-slate-700/40'}
            strokeWidth={g.major ? 1 : 0.5} />
        ))}
        {axisLabels.map((l, i) => (
          <text key={i} x={l.x} y={l.y} className="fill-slate-400 dark:fill-slate-500" fontSize="7" textAnchor="middle">{l.text}</text>
        ))}
        <polyline points={polyline} fill="none" stroke="#E8343A" strokeWidth="2" strokeLinejoin="round" />
        {hover && <>
          <line x1={hover.px} y1={0} x2={hover.px} y2={H} stroke="#E8343A" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.5" />
          <line x1={0} y1={hover.py} x2={W} y2={hover.py} stroke="#E8343A" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.5" />
          <circle cx={hover.px} cy={hover.py} r="3" fill="#E8343A" />
          <rect x={hover.px + 6} y={hover.py - 20} width="80" height="16" rx="3" fill="white" stroke="#e2e8f0" className="dark:fill-slate-700 dark:stroke-slate-600" />
          <text x={hover.px + 10} y={hover.py - 8} className="fill-slate-600 dark:fill-slate-300" fontSize="8">
            ({hover.x.toFixed(2)}, {hover.y.toFixed(2)})
          </text>
        </>}
      </svg>
    </div>
  );
}

/* ─── Solution Steps ──────────────────────────────────────── */

interface SolutionStep {
  step: number;
  title: string;
  content: string;
  hint?: string;
  formula?: string;
  isCorrect?: boolean;
  error?: string;
  correctFormula?: string;
}

function StepsList({ steps, showHints, expandedSteps, toggleStep, mode }: {
  steps: SolutionStep[];
  showHints: boolean;
  expandedSteps: Set<number>;
  toggleStep: (n: number) => void;
  mode: 'solve' | 'check';
}) {
  return (
    <div className="space-y-1.5">
      {steps.map((item, i) => {
        const done = mode === 'check' ? item.isCorrect !== false : item.isCorrect === true;
        const wrong = item.isCorrect === false && mode === 'check';
        const active = expandedSteps.has(item.step);
        return (
          <motion.div key={i} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
            className={`rounded-xl border-2 overflow-hidden transition-all ${
              done ? 'border-emerald-400 dark:border-emerald-500/40 bg-emerald-100 dark:bg-emerald-900/30'
                : wrong ? 'border-red-400 dark:border-red-500/40 bg-red-100 dark:bg-red-900/30'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
            }`}>
            <button onClick={() => toggleStep(item.step)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                done ? 'bg-emerald-500 text-white'
                  : wrong ? 'bg-red-500 text-white'
                    : active ? 'bg-blue-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-300'
              }`}>
                {done ? <CheckCircleIcon className="w-3 h-3" /> : wrong ? <CloseCircleIcon className="w-3 h-3" /> : item.step}
              </div>
              <span className={`flex-1 text-[12px] font-semibold ${done ? 'text-emerald-700 dark:text-emerald-400' : wrong ? 'text-red-700 dark:text-red-400' : 'text-slate-800 dark:text-slate-200'}`}>
                {item.title}
              </span>
              {mode === 'check' && wrong && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 font-bold">XATO</span>
              )}
              {mode === 'check' && done && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">TO'G'RI</span>
              )}
              <AltArrowRightIcon className={`w-3.5 h-3.5 text-slate-400 transition-transform ${active ? 'rotate-90' : ''}`} />
            </button>
            <AnimatePresence>
              {active && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden">
                  <div className="px-3 pb-3 pt-0.5 space-y-2">
                    <p className="text-[12px] text-slate-600 dark:text-slate-400 leading-relaxed">{renderInlineTex(item.content)}</p>
                    {item.formula && (
                      <div className={`px-3 py-2 rounded-lg border overflow-x-auto ${
                        wrong ? 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-500/20'
                          : done ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-500/20'
                            : 'bg-slate-50 dark:bg-slate-700/50 border-slate-100 dark:border-slate-700'
                      }`}>
                        {renderTex(item.formula)}
                      </div>
                    )}
                    {wrong && item.error && (
                      <div className="flex items-start gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20">
                        <CloseCircleIcon className="w-3 h-3 text-red-500 shrink-0 mt-0.5" />
                        <div className="text-[11px] text-red-700 dark:text-red-400">
                          <span className="font-bold">Xato:</span> {item.error}
                        </div>
                      </div>
                    )}
                    {wrong && item.correctFormula && (
                      <div className="flex items-start gap-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20">
                        <CheckCircleIcon className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                        <div className="text-[11px] text-emerald-700 dark:text-emerald-400">
                          <span className="font-bold">To'g'ri:</span> {renderTex(item.correctFormula)}
                        </div>
                      </div>
                    )}
                    {done && !wrong && mode === 'check' && (
                      <div className="flex items-start gap-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20">
                        <CheckCircleIcon className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">Bu bosqich to'g'ri bajarilgan</p>
                      </div>
                    )}
                    {item.formula && item.isCorrect === true && mode === 'solve' && (() => {
                      const cl = cleanLatex(item.formula);
                      return cl.includes('x') || cl.includes('sin') || cl.includes('cos') || cl.includes('^');
                    })() && <GraphPlot formula={item.formula} label="Grafik yechim" />}
                    {item.hint && showHints && (
                      <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20">
                        <LightbulbIcon className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-amber-700 dark:text-amber-400">{item.hint}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────────── */

export default function MathSolver() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const solutionRef = useRef<HTMLDivElement>(null);
  const mfRef = useRef<MathfieldElement>(null);

  const [formula, setFormula] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [solution, setSolution] = useState<SolutionStep[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHints, setShowHints] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
  const [cameraReady, setCameraReady] = useState(false);
  const [solvedResults, setSolvedResults] = useState<string[]>([]);
  const [mode, setMode] = useState<'solve' | 'check'>('solve');
  const [showModeDialog, setShowModeDialog] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [cameraPermission, setCameraPermission] = useState<'checking' | 'prompt' | 'granted' | 'denied'>('checking');
  const [showUnlockAnim, setShowUnlockAnim] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  /* Camera */
  useEffect(() => {
    // Avtomatik ravishda kamera ruxsatini so'rash va ishga tushirish
    requestCameraPermission();
    return () => stopCamera();
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraReady(false);
  };

  const checkCameraPermission = async () => {
    setCameraPermission('checking');
    try {
      // Avval navigator.permissions API ni tekshirish
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const status = await navigator.permissions.query({ name: 'camera' as PermissionName });
          if (status.state === 'granted') {
            setCameraPermission('granted');
            await startCameraStream();
            setShowUnlockAnim(true);
            setTimeout(() => setShowUnlockAnim(false), 1500);
            return;
          } else if (status.state === 'denied') {
            setCameraPermission('denied');
            return;
          }
          // 'prompt' holatida — foydalanuvchiga UI ko'rsatish
          setCameraPermission('prompt');
          return;
        } catch {
          // permissions API qo'llab-quvvatlanmasa — bevosita so'rash
        }
      }
      // Fallback: bevosita so'rash
      setCameraPermission('prompt');
    } catch {
      setCameraPermission('prompt');
    }
  };

  const requestCameraPermission = async () => {
    setCameraPermission('checking');
    try {
      await startCameraStream();
      setCameraPermission('granted');
      // Qulf ochilish animatsiyasini ko'rsatish
      setShowUnlockAnim(true);
      setTimeout(() => setShowUnlockAnim(false), 1500);
    } catch {
      setCameraPermission('denied');
    }
  };

  const startCameraStream = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
    });
    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setCameraReady(true);
    }
  };

  const captureFrame = (): string | null => {
    if (!videoRef.current || !canvasRef.current || cameraPermission !== 'granted') return null;
    const v = videoRef.current, c = canvasRef.current;
    c.width = v.videoWidth; c.height = v.videoHeight;
    const ctx = c.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(v, 0, 0);
    return c.toDataURL('image/jpeg', 0.8);
  };

  const compressImage = (dataUrl: string, maxWidth = 1024, quality = 0.7): Promise<string> =>
    new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        let w = img.width, h = img.height;
        if (w > maxWidth) { h = (h * maxWidth) / w; w = maxWidth; }
        c.width = w; c.height = h;
        const ctx = c.getContext('2d');
        if (!ctx) { resolve(dataUrl); return; }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });

  const handleCapture = async () => {
    const dataUrl = captureFrame();
    if (!dataUrl) return;
    const compressed = await compressImage(dataUrl);
    setImage(compressed);
    setPendingImage(compressed);
    setShowModeDialog(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const compressed = await compressImage(ev.target?.result as string);
      setImage(compressed);
      setPendingImage(compressed);
      setShowModeDialog(true);
    };
    reader.readAsDataURL(file);
  };

  const handleModeSelect = async (selectedMode: 'solve' | 'check') => {
    setMode(selectedMode);
    setShowModeDialog(false);
    if (pendingImage) {
      // Avval rasmdan formulani ajratib olish
      await extractFormulaFromImage(pendingImage);
      // Keyin yechimni boshlash (foydalanuvchi "Yechish" tugmasini bosganda)
    }
  };

  const extractFormulaFromImage = async (base64: string) => {
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'pixtral-12b-2409',
          messages: [
            { role: 'system', content: "Siz matematik formulasini ajratuvchisiz. Rasmdagi matematik ifodani toping va LaTeX formatda qaytaring. Faqat JSON qaytaring: {\"formula\": \"LaTeX\"}" },
            { role: 'user', content: [
              { type: 'text', text: "Rasmdagi matematik masalani toping va LaTeX formatda qaytaring. Faqat formula kerak, tushuntirish emas. Masalan: 25^2 \\cdot 13 \\sqrt{36}" },
              { type: 'image_url', image_url: { url: base64 } }
            ] }
          ]
        })
      });
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      // JSON dan formula ni ajratish
      const match = content.match(/"formula"\s*:\s*"([^"]+)"/);
      if (match && match[1] && mfRef.current) {
        const extracted = match[1].replace(/\\\\/g, '\\');
        setFormula(extracted);
        mfRef.current.value = extracted;
      }
    } catch {
      // Formula ajratilmasa — oddiy holatda qoladi
    }
  };

  /* Math input — MathLive handles all input via <math-field> */

  /* AI Solve */
  const sendToAI = async (base64: string) => {
    setLoading(true);
    setError(null);
    setSolution(null);
    setSolvedResults([]);

    const isCheck = mode === 'check';

    const solvePrompt = `Rasmdagi matematik masalani yeching.

QAT'IY QOIDALAR:
1. Har bir bosqichda FAQAT aniq, qisqa tushuntirish yozing (1-2 jumlada)
2. Content maydonida oddiy matn bo'lsin, LaTeX emas
3. Formula maydonida to'g'ri LaTeX kodi bo'lsin (backslash bilan, masalan: \\frac{1}{2})
4. Matn toza va tushunarli bo'lsin, xato yozuv bo'lmasin
5. Natija bosqichida isCorrect: true bo'lsin

JAVOBLI JSON array formatida bering. Har bir element:
{
  "step": raqam,
  "title": "qisqa nom",
  "content": "oddiy matnda tushuntirish",
  "formula": "LaTeX formula",
  "hint": "maslahat (ixtiyoriy)",
  "isCorrect": false yoki true
}

Misol:
[{"step":1,"title":"Masala","content":"Tenglamani yechamiz","formula":"2x+5=13","isCorrect":false},{"step":2,"title":"Yechim","content":"5 ni ayiramiz","formula":"2x=8","isCorrect":false},{"step":3,"title":"Natija","content":"x=4 ni topdik","formula":"x=4","isCorrect":true}]`;

    const checkPrompt = `Rasmdagi matematik ishni tekshiring. Har bir bosqichni tahlil qiling.

QAT'IY QOIDALAR:
1. Har bir bosqichni alohida ko'rib chiqing
2. Agar bosqich to'g'ri bo'lsa — isCorrect: true
3. Agar bosqichda xato bo'lsa — isCorrect: false, error tushuntirish, correctFormula to'g'ri javob
4. Content maydonida oddiy matn bo'lsin, xato tushuntirilsin
5. Formula maydonida Foydalanuvchining yozganini kiriting (xato bo'lsa ham)
6. correctFormula maydonida to'g'ri javobni LaTeX formatda yozing

JAVOBLI JSON array formatida bering. Har bir element:
{
  "step": raqam,
  "title": "bosqich nomi",
  "content": "nima uchun to'g'ri/yoki xato",
  "formula": "Foydalanuvchi yozgan (xatosi bilan)",
  "correctFormula": "To'g'ri javob (fa qat xato bo'lsa)",
  "isCorrect": true yoki false
}

Misol (1-bosqich to'g'ri, 2-bosqich xato):
[{"step":1,"title":"1-bosqich","content":"25^2 = 625 bu to'g'ri","formula":"25^2=625","isCorrect":true},{"step":2,"title":"2-bosqich","content":"13 * 6 = 78 emas, 13 * 6 = 78 xato. 13 * 6 = 78 lekin 13 * 6 = 78 degan xato","formula":"13 \\cdot 6 = 78","correctFormula":"13 \\cdot 6 = 78","isCorrect":false}]`;

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'pixtral-12b-2409',
          messages: [
            { role: 'system', content: isCheck
              ? "Siz matematika o'qituvchisiz. Talabaning ishini tekshiring. Har bir bosqichni tahlil qiling. To'g'ri bo'lsa tasdiqlang, xato bo'lsa tushuntiring. FAQAT JSON array qaytaring."
              : "Siz professional matematika yechuvchisiz. FAQAT to'g'ri JSON array qaytaring. Matn toza va tushunarli bo'lsin."
            },
            { role: 'user', content: [
              { type: 'text', text: isCheck ? checkPrompt : solvePrompt },
              { type: 'image_url', image_url: { url: base64 } }
            ] }
          ]
        })
      });
      const data = await response.json();
      if (!response.ok) { setError(`AI xatolik: ${data.error?.message || response.status}`); return; }
      const content = data.choices?.[0]?.message?.content || '';
      console.log('AI raw response:', content);
      if (!content) { setError('AI javob bermadi'); return; }
      const steps = parseAIResponse(content);
      console.log('Parsed steps:', steps);
      if (steps.length > 0) {
        setSolution(steps);
        const results = steps.filter(s => s.isCorrect).map(s => s.formula || s.content);
        setSolvedResults(results);
        setExpandedSteps(new Set());
      } else {
        console.log('No steps parsed, raw:', content.slice(0, 300));
        setSolution([{ step: 1, title: 'AI javobi', content: content.slice(0, 500), formula: '', hint: 'JSON parse qilinmadi' }]);
        setExpandedSteps(new Set([1]));
      }
    } catch (e: any) {
      setError(`Xatolik: ${e.message || 'Qaytadan urinib ko\'ring'}`);
    } finally {
      setLoading(false);
    }
  };

  const parseAIResponse = (raw: string): SolutionStep[] => {
    let cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const strategies = [
      () => { const f = cleaned.indexOf('['), l = cleaned.lastIndexOf(']'); return f !== -1 && l > f ? cleaned.substring(f, l + 1) : null; },
      () => { for (const m of [...cleaned.matchAll(/\[[\s\S]*?\]/g)]) { try { JSON.parse(m[0]); return m[0]; } catch {} } return null; },
      () => { const items: any[] = []; for (const line of cleaned.split('\n')) { const t = line.trim().replace(/,$/, ''); if (t.startsWith('{') && t.endsWith('}')) { try { items.push(JSON.parse(t)); } catch {} } } return items.length ? JSON.stringify(items) : null; },
    ];
    for (const s of strategies) {
      const j = s();
      if (!j) continue;
      try {
        const p = JSON.parse(j);
        if (Array.isArray(p) && p.length > 0) return p.map((s: any, i: number) => ({
          step: s.step || i + 1, title: s.title || '', content: s.content || '',
          hint: s.hint || '', formula: s.formula || '',
          isCorrect: typeof s.isCorrect === 'boolean' ? s.isCorrect : undefined,
          error: s.error || '',
          correctFormula: s.correctFormula || '',
        }));
      } catch {}
    }
    return [];
  };

  const solveFromFormula = async () => {
    if (!formula.trim() && !pendingImage) return;
    setLoading(true);
    setError(null);
    setSolution(null);
    setSolvedResults([]);
    if (pendingImage) {
      await sendToAI(pendingImage);
    } else {
      await sendToFormulaText(formula.trim());
    }
  };

  const sendToFormulaText = async (text: string) => {
    const isCheck = mode === 'check';

    const solvePrompt = `Quyidagi matematik masalani bosqichma-bosqich yeching: ${text}

QAT'IY QOIDALAR:
1. Har bir bosqichda FAQAT aniq, qisqa tushuntirish yozing (1-2 jumlada)
2. Content maydonida oddiy matn bo'lsin, LaTeX emas
3. Formula maydonida to'g'ri LaTeX kodi bo'lsin (backslash bilan, masalan: \\frac{1}{2})
4. Matn toza va tushunarli bo'lsin, xato yozuv bo'lmasin
5. Natija bosqichida isCorrect: true bo'lsin

JAVOBLI JSON array formatida bering. Har bir element:
{
  "step": raqam,
  "title": "qisqa nom",
  "content": "oddiy matnda tushuntirish",
  "formula": "LaTeX formula",
  "hint": "maslahat (ixtiyoriy)",
  "isCorrect": false yoki true
}

Misol:
[{"step":1,"title":"Masala","content":"Tenglamani yechamiz","formula":"2x+5=13","isCorrect":false},{"step":2,"title":"Yechim","content":"5 ni ayiramiz","formula":"2x=8","isCorrect":false},{"step":3,"title":"Natija","content":"x=4 ni topdik","formula":"x=4","isCorrect":true}]`;

    const checkPrompt = `Quyidagi matematik ishni tekshiring: ${text}

QAT'IY QOIDALAR:
1. Har bir bosqichni tahlil qiling
2. Content maydonida oddiy matn bo'lsin, xato tushuntirilsin
3. Formula maydonida Foydalanuvchining yozganini kiriting (xato bo'lsa ham)
4. Agar xato bo'lsa — error va correctFormula maydonlarini to'ldiring
5. isCorrect: true yoki false

JAVOBLI JSON array formatida bering:
{"step": raqam, "title": "nom", "content": "tushuntirish", "formula": "foydalanuvchi yozgan", "correctFormula": "to'g'ri javob", "isCorrect": true/false}`;

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'pixtral-12b-2409',
          messages: [
            { role: 'system', content: isCheck
              ? "Siz matematika o'qituvchisiz. Talabaning ishini tekshiring. To'g'ri bo'lsa tasdiqlang, xato bo'lsa tushuntiring. FAQAT JSON array qaytaring."
              : "Siz professional matematika yechuvchisiz. FAQAT to'g'ri JSON array qaytaring. Matn toza va tushunarli bo'lsin."
            },
            { role: 'user', content: [{ type: 'text', text: isCheck ? checkPrompt : solvePrompt }] }
          ]
        })
      });
      const data = await response.json();
      if (!response.ok) { setError(`AI xatolik: ${data.error?.message || response.status}`); return; }
      const content = data.choices?.[0]?.message?.content || '';
      if (!content) { setError('AI javob bermadi'); return; }
      const steps = parseAIResponse(content);
      if (steps.length > 0) {
        setSolution(steps);
        const results = steps.filter(s => s.isCorrect).map(s => s.formula || s.content);
        setSolvedResults(results);
        setExpandedSteps(new Set());
      } else {
        setSolution([{ step: 1, title: 'AI javobi', content: content.slice(0, 500), formula: '', hint: 'JSON parse qilinmadi' }]);
        setExpandedSteps(new Set([1]));
      }
    } catch (e: any) {
      setError(`Xatolik: ${e.message || 'Qaytadan urinib ko\'ring'}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleStep = (n: number) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      next.has(n) ? next.delete(n) : next.add(n);
      return next;
    });
  };

  const reset = () => {
    setImage(null);
    setSolution(null);
    setError(null);
    setFormula('');
    setSolvedResults([]);
    setExpandedSteps(new Set());
    setMode('solve');
    setPendingImage(null);
    setShowModeDialog(false);
    // Kamera ruxsatini qayta tekshirish
    if (cameraPermission === 'denied') {
      setCameraPermission('prompt');
    }
  };

  const downloadPDF = async () => {
    if (!solutionRef.current || !solution) return;
    setDownloading(true);
    try {
      // Barcha qadamlarni ochish
      const allSteps = new Set(solution.map(s => s.step));
      const prevExpanded = new Set(expandedSteps);
      setExpandedSteps(allSteps);

      // DOM yangilanishini kutish
      await new Promise(r => setTimeout(r, 400));

      const canvas = await html2canvas(solutionRef.current, { backgroundColor: '#ffffff', scale: 2 });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();

      // Logo qo'shish
      try {
        const logoImg = new Image();
        logoImg.src = '/logo.png';
        await new Promise<void>((resolve, reject) => {
          logoImg.onload = () => resolve();
          logoImg.onerror = () => resolve(); // xatolik bo'lsa o'tib ket
        });
        if (logoImg.complete && logoImg.naturalWidth > 0) {
          pdf.addImage(logoImg, 'PNG', 15, 8, 18, 18);
          // "EduContest" matni
          pdf.setFontSize(14);
          pdf.setTextColor(60, 60, 60);
          pdf.text('EduContest', 36, 17);
          // Sana
          pdf.setFontSize(8);
          pdf.setTextColor(150, 150, 150);
          const date = new Date().toLocaleDateString('uz-UZ');
          pdf.text(date, 36, 23);
        }
      } catch {}

      // Asosiy kontent (logodan pastroqda)
      const imgH = (canvas.height * pdfW) / canvas.width;
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 30, pdfW, imgH);

      // Pastki qism — educontest.uz
      const footerY = pdfH - 8;
      pdf.setFontSize(8);
      pdf.setTextColor(180, 180, 180);
      pdf.text('educontest.uz', pdfW / 2, footerY, { align: 'center' });

      pdf.save('yechim.pdf');

      // Qadamlarni oldingi holatiga qaytarish
      setExpandedSteps(prevExpanded);
    } catch {
      setError('PDF yaratishda xatolik');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F1A]">
      <SEO title="Math Solver" description="Matematik masalani yeching — kamera yoki klaviatura orqali." />

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
        <div className="relative max-w-[1400px] mx-auto px-3 sm:px-5 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.history.back()}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/80 hover:text-white"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
                  <CalculatorMinimalisticIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-[15px] font-bold text-white leading-tight">Math Solver</h1>
                  <p className="text-[10px] text-white/60 uppercase tracking-wider">AI yordamida matematik masalalarni yeching</p>
                </div>
              </div>
            </div>
            {solution && (
              <div className="flex items-center gap-1.5">
                <button onClick={() => setShowHints(!showHints)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-medium text-white/80 bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors">
                  <LightbulbIcon className="w-3 h-3" /> {showHints ? 'Yashirish' : 'Maslahat'}
                </button>
                <button onClick={downloadPDF} disabled={downloading}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-medium text-white/80 bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors">
                  <DownloadIcon className="w-3 h-3" /> PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-3 sm:px-5 py-3">

        {/* ─── Split Layout ─── */}
        <div className="flex flex-col xl:flex-row gap-4">

          {/* ═══ LEFT PANEL — Camera (38%) ═══ */}
          <div className="xl:w-[38%] shrink-0 space-y-3">
            {/* Camera viewport */}
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3] shadow-lg ring-1 ring-slate-200 dark:ring-slate-700">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ display: cameraPermission === 'granted' ? 'block' : 'none' }} />
              <canvas ref={canvasRef} className="hidden" />

              {/* Camera Permission UI */}
              {cameraPermission !== 'granted' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 p-6">
                  {cameraPermission === 'checking' && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-white/20 border-t-[#E8343A] rounded-full animate-spin" />
                      </div>
                      <p className="text-[13px] text-white/80 font-medium">Kamera tekshirilmoqda...</p>
                    </motion.div>
                  )}

                  {cameraPermission === 'prompt' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-4 text-center">
                      <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-16 h-16 rounded-2xl bg-[#E8343A]/10 flex items-center justify-center"
                      >
                        <span className="material-symbols-rounded text-[#E8343A] text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>camera</span>
                      </motion.div>
                      <div className="space-y-1">
                        <h3 className="text-[15px] font-bold text-white">Kamera ruxsati kerak</h3>
                        <p className="text-[12px] text-white/60 max-w-[240px]">
                          Matematik masalalarni skanerlash uchun kameraga ruxsat bering
                        </p>
                      </div>
                      <button onClick={requestCameraPermission}
                        className="px-6 py-2.5 rounded-xl bg-[#E8343A] text-white text-[13px] font-bold hover:bg-[#C42B30] active:scale-95 transition-all shadow-lg shadow-[#E8343A]/25 flex items-center gap-2">
                        <span className="material-symbols-rounded text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>camera</span>
                        Ruxsat berish
                      </button>
                      <p className="text-[10px] text-white/40">Brauzer sozlamalaridan o'zgartirishingiz mumkin</p>
                    </motion.div>
                  )}

                  {cameraPermission === 'denied' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-4 text-center">
                      <motion.div
                        initial={{ rotate: 0 }}
                        animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="w-16 h-16 rounded-full border-2 border-red-400/50 flex items-center justify-center cursor-pointer bg-slate-800"
                        onClick={() => setShowGuide(true)}
                      >
                        <span className="material-symbols-rounded text-red-400 text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                      </motion.div>
                      <div className="space-y-1">
                        <h3 className="text-[15px] font-bold text-white">Kamera bloklangan</h3>
                        <p className="text-[12px] text-white/60 max-w-[260px]">
                          Brauzer sozlamalaridan kamerani yoqishingiz kerak
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 w-full max-w-[240px]">
                        <button onClick={() => setShowGuide(true)}
                          className="w-full px-4 py-2.5 rounded-xl bg-[#E8343A] text-white text-[12px] font-bold hover:bg-[#C42B30] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#E8343A]/25">
                          <span className="material-symbols-rounded text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>help</span>
                          Qanday ochishni ko'rsat
                        </button>
                        <button onClick={requestCameraPermission}
                          className="w-full px-4 py-2 rounded-xl bg-slate-700 text-white text-[12px] font-medium hover:bg-slate-600 active:scale-95 transition-all flex items-center justify-center gap-2">
                          <span className="material-symbols-rounded text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>refresh</span>
                          Qayta urinish
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Unlock Animation Overlay */}
              <AnimatePresence>
                {showUnlockAnim && (
                  <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10 pointer-events-none"
                  >
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 1.5, opacity: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      <span className="material-symbols-rounded text-emerald-400 text-[64px]" style={{ fontVariationSettings: "'FILL' 1" }}>lock_open</span>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Scan overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-[10%]">
                  <div className="absolute top-0 left-0 w-7 h-7 border-t-[3px] border-l-[3px] border-[#E8343A] rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-7 h-7 border-t-[3px] border-r-[3px] border-[#E8343A] rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-7 h-7 border-b-[3px] border-l-[3px] border-[#E8343A] rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-7 h-7 border-b-[3px] border-r-[3px] border-[#E8343A] rounded-br-lg" />
                </div>
                <div className="absolute inset-[10%] overflow-hidden">
                  <div className="scan-line absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#10B981] to-transparent shadow-[0_0_12px_#10B981]" />
                </div>
                <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm">
                  <p className="text-[10px] text-white/90 font-medium">
                    {cameraPermission === 'checking' && 'Tekshirilmoqda...'}
                    {cameraPermission === 'prompt' && 'Kamera ruxsati kerak'}
                    {cameraPermission === 'denied' && 'Kamera bloklangan'}
                    {cameraPermission === 'granted' && (cameraReady ? 'Skanerlash tayyor' : 'Kamera yuklanmoqda...')}
                  </p>
                </div>
              </div>

              {/* Captured image overlay */}
              {image && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                  <img src={image} alt="Rasm" className="max-w-full max-h-full object-contain p-4" />
                  <button onClick={() => setImage(null)} className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                    <CloseCircleIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Loading overlay */}
              {loading && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                  <div className="w-8 h-8 border-2 border-white/20 border-t-[#E8343A] rounded-full animate-spin" />
                  <p className="text-[11px] text-white/90 font-medium">AI yechim tayyorlanmoqda...</p>
                </div>
              )}
            </div>

            {/* Camera controls */}
            <div className="flex items-center justify-center gap-2.5">
              <button onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:border-[#E8343A] hover:text-[#E8343A] transition-colors shadow-sm">
                <GalleryIcon className="w-3.5 h-3.5" /> Galereya
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />

              <button onClick={handleCapture}
                className="flex items-center justify-center w-14 h-14 rounded-full bg-white border-[3px] border-[#E8343A] shadow-lg hover:scale-105 active:scale-95 transition-transform">
                <div className="w-10 h-10 rounded-full bg-[#E8343A]" />
              </button>

              <button onClick={reset}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:border-slate-400 transition-colors shadow-sm">
                <RestartIcon className="w-3.5 h-3.5" /> Tiklash
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20">
                <p className="text-[12px] text-red-600 dark:text-red-400 mb-1">{error}</p>
                <button onClick={reset} className="text-[11px] font-medium text-[#E8343A] hover:underline">Qaytadan urinish</button>
              </div>
            )}

            {/* Solved result chips */}
            {solvedResults.length > 0 && (
              <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                <p className="text-[10px] text-slate-400 font-medium mb-2">Topilgan yechimlar:</p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {solvedResults.map((r, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                      <CheckCircleIcon className="w-2.5 h-2.5" /> {renderTex(r)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

            {/* ═══ RIGHT PANEL — Input + Result (62%) ═══ */}
          <div className="flex-1 min-w-0 space-y-3">

            {/* Mode Toggle */}
            <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
              <button onClick={() => { setMode('solve'); setSolution(null); setError(null); setSolvedResults([]); setExpandedSteps(new Set()); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[12px] font-bold transition-all ${
                  mode === 'solve'
                    ? 'bg-[#E8343A] text-white'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/30'
                }`}>
                <BoltIcon className="w-3.5 h-3.5" /> Yechish
              </button>
              <button onClick={() => { setMode('check'); setSolution(null); setError(null); setSolvedResults([]); setExpandedSteps(new Set()); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[12px] font-bold transition-all ${
                  mode === 'check'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/30'
                }`}>
                <ScannerIcon className="w-3.5 h-3.5" /> Tekshirish
              </button>
            </div>

            {/* MathLive Formula Input */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <span className="text-[11px] text-slate-500 font-medium">Formula kiritish maydoni</span>
                {formula && (
                  <button onClick={() => { setFormula(''); mfRef.current?.focus(); }}
                    className="text-[10px] text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1">
                    <TrashBinMinimalisticIcon className="w-3 h-3" /> Tozalash
                  </button>
                )}
              </div>
              <div className="p-3">
                <math-field
                  ref={mfRef}
                  onInput={(e: any) => setFormula(e.target.value)}
                  virtual-keyboard-mode="onfocus"
                  smart-fence
                  smart-superscript
                  style={{
                    width: '100%',
                    minHeight: '52px',
                    fontSize: '18px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid transparent',
                    outline: 'none',
                    fontFamily: '"Computer Modern", "Latin Modern", serif',
                  }}
                >
                  {formula}
                </math-field>
              </div>
            </div>

            {/* Solve button */}
            <button onClick={solveFromFormula} disabled={(!formula.trim() && !pendingImage) || loading}
              className={`w-full py-3.5 rounded-xl text-white text-[14px] font-bold shadow-lg disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${
                mode === 'check'
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/25'
                  : 'bg-[#E8343A] hover:bg-[#C42B30] shadow-[#E8343A]/25'
              }`}>
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {mode === 'check' ? 'Tekshirilmoqda...' : 'Yechilmoqda...'}</>
              ) : (
                <>{mode === 'check' ? <><ScannerIcon className="w-4 h-4" /> Tekshirish</> : <><BoltIcon className="w-4 h-4" /> Yechish</>}</>
              )}
            </button>

            {/* Solution steps */}
            {solution && (
              <div ref={solutionRef} className="space-y-3">
                {/* Progress bar */}
                <div className="flex items-center gap-2 px-1">
                  <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-[#E8343A] rounded-full transition-all duration-500"
                      style={{ width: `${(expandedSteps.size / solution.length) * 100}%` }} />
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">{expandedSteps.size}/{solution.length}</span>
                </div>

                <StepsList steps={solution} showHints={showHints} expandedSteps={expandedSteps} toggleStep={toggleStep} mode={mode} />

                {/* Navigation buttons */}
                <div className="flex gap-2 pt-1">
                  <button onClick={reset}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[12px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5">
                    <RestartIcon className="w-3.5 h-3.5" /> Yangi masala
                  </button>
                  <button onClick={() => {
                    const next = solution.find(s => s.step > Math.max(...expandedSteps) && !expandedSteps.has(s.step));
                    if (next) toggleStep(next.step);
                  }}
                    className="flex-1 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[12px] font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5">
                    Keyingi qadam <ArrowRightIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Empty state */}
            {!solution && !loading && !error && (
              <div className="flex flex-col items-center py-12 text-slate-300 dark:text-slate-600">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                  <CalculatorMinimalisticIcon className="w-7 h-7" />
                </div>
                <p className="text-[13px] font-medium text-slate-400 dark:text-slate-500">Masala kiriting yoki rasm skanerlang</p>
                <p className="text-[11px] text-slate-300 dark:text-slate-600 mt-1">Klaviatura yoki kamera orqali kiriting</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Mode Selection Dialog ─── */}
      <AnimatePresence>
        {showModeDialog && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => { setShowModeDialog(false); setPendingImage(null); }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm space-y-4"
              onClick={(e) => e.stopPropagation()}>
              <div className="text-center space-y-1">
                <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-2">
                  <GalleryIcon className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                </div>
                <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-200">Rasm yuklandi</h3>
                <p className="text-[12px] text-slate-500 dark:text-slate-400">Bu rasm bilan nima qilish kerak?</p>
              </div>
              <div className="space-y-2">
                <button onClick={() => handleModeSelect('solve')}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 border-[#E8343A]/20 hover:border-[#E8343A] hover:bg-red-50 dark:hover:bg-red-500/5 transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-[#E8343A] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <BoltIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-[13px] font-bold text-slate-800 dark:text-slate-200">Yechish</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Bosqichma-bosqich yechib berish</p>
                  </div>
                </button>
                <button onClick={() => handleModeSelect('check')}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 border-blue-600/20 hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/5 transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <ScannerIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-[13px] font-bold text-slate-800 dark:text-slate-200">Tekshirish</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Ishni tekshirib, xatolarni ko'rsatish</p>
                  </div>
                </button>
              </div>
              <button onClick={() => { setShowModeDialog(false); setPendingImage(null); }}
                className="w-full py-2 rounded-lg text-[12px] font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                Bekor qilish
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              <div className="bg-[#E8343A] px-5 py-4 flex items-center gap-3">
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
                  <div className="w-7 h-7 rounded-full bg-[#E8343A] flex items-center justify-center shrink-0 mt-0.5">
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
                  <div className="w-7 h-7 rounded-full bg-[#E8343A] flex items-center justify-center shrink-0 mt-0.5">
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
                  <div className="w-7 h-7 rounded-full bg-[#E8343A] flex items-center justify-center shrink-0 mt-0.5">
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
                  className="w-full py-3 rounded-xl bg-[#E8343A] text-white text-[13px] font-bold hover:bg-[#C42B30] active:scale-[0.98] transition-all shadow-lg shadow-[#E8343A]/25 flex items-center justify-center gap-2">
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
}
