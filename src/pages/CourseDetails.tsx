import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Play, Pause, Lock, CheckCircle2, Star, Users, MessageCircle,
  Share2, Clock, ChevronRight, ArrowLeft, ShieldCheck,
  Send, User, GraduationCap, Coins, Wallet,
  BookOpen, Trophy, FileText, Bookmark, BookmarkCheck,
  Volume2, VolumeX, Maximize, Settings, RotateCcw, RotateCw,
  Download, File, Film, Music, FileSpreadsheet
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";
import { useTranslation } from "react-i18next";
import { useEduCoin } from "@/hooks/useEduCoin";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { rewriteStorageUrl } from "@/lib/storage";

const slugify = (text: string) => {
  if (!text) return '';
  return text.toString().toLowerCase().trim()
    .replace(/[''']/g, '').replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-').replace(/--+/g, '-')
    .replace(/^-+/, '').replace(/-+$/, '');
};

/* ── Custom Video Player ───────────────────────────────── */
function VideoPlayer({ lesson, isEnrolled, onPayClick, course }: {
  lesson: any; isEnrolled: boolean; onPayClick: () => void; course: any;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCt] = useState(0);
  const [duration, setDur] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();

  if (!lesson) {
    return (
      <div className="aspect-video rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
    );
  }

  const activeUrl = lesson?.video_url || lesson?.material_url || "";
  const isYoutube = !!(activeUrl && (activeUrl.includes('youtube') || activeUrl.includes('youtu.be')));

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const showControls = () => {
    setControlsVisible(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => { if (playing) setControlsVisible(false); }, 3000);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) { videoRef.current.pause(); } else { videoRef.current.play(); }
    setPlaying(!playing);
    showControls();
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pct * duration;
  };

  const changeSpeed = (s: number) => {
    if (videoRef.current) videoRef.current.playbackRate = s;
    setSpeed(s);
    setShowSpeedMenu(false);
  };

  const fullscreen = () => {
    const el = videoRef.current?.parentElement as any;
    if (el?.requestFullscreen) el.requestFullscreen();
  };

  // Not enrolled — locked state
  if (!isEnrolled) {
    return (
      <div className="aspect-video rounded-2xl overflow-hidden relative bg-slate-900">
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5 bg-slate-800 border border-slate-700">
            <Lock className="w-7 h-7 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">Kurs yopiq</h3>
          <p className="text-slate-400 text-[10px] font-medium uppercase tracking-wider mb-5">Davom etish uchun a'zo bo'ling</p>
          <button
            onClick={onPayClick}
            className="px-8 py-3 text-white rounded-xl text-[11px] font-medium uppercase tracking-wider transition-opacity hover:opacity-90 active:scale-[0.98]"
            style={{ background: "#E8192C" }}
          >
            {course?.price > 0 ? `${course.price.toLocaleString()} so'm — A'zo bo'lish` : 'Bepul — Boshlash'}
          </button>
        </div>
      </div>
    );
  }

  // No lesson selected
  if (!lesson) {
    return (
      <div className="aspect-video rounded-2xl overflow-hidden relative flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800">
        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600">
          <Play className="w-7 h-7 ml-1 text-slate-400 dark:text-slate-500" />
        </div>
        <p className="mt-6 text-slate-600 dark:text-slate-300 text-sm font-semibold">Dars tanlang</p>
        <p className="mt-1 text-slate-400 text-[10px] font-medium uppercase tracking-wider">O'ng paneldan boshlang</p>
      </div>
    );
  }

  // Determine the active URL: video_url takes priority, fallback to material_url
  const isFileUrl = !!(activeUrl && !activeUrl.includes('youtube') && !activeUrl.includes('youtu.be'));

  // Helper: detect file type from URL
  const getFileType = (url: string): 'video' | 'audio' | 'pdf' | 'document' | 'unknown' => {
    const ext = url.split('?')[0].split('.').pop()?.toLowerCase() || '';
    if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'].includes(ext)) return 'audio';
    if (ext === 'pdf') return 'pdf';
    if (['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(ext)) return 'document';
    return 'unknown';
  };

  const fileType = activeUrl ? getFileType(activeUrl) : 'unknown';

  // File viewer: PDF in iframe
  if (isFileUrl && fileType === 'pdf') {
    return (
      <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="bg-slate-50 dark:bg-slate-800 px-4 py-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" />
            <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
              {lesson.material_name || "PDF hujjat"}
            </span>
          </div>
          <a href={rewriteStorageUrl(activeUrl)} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-[#E8192C] hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
            <Download className="w-3.5 h-3.5" /> Yuklab olish
          </a>
        </div>
        <iframe
          src={rewriteStorageUrl(activeUrl)}
          className="w-full border-0 bg-white"
          style={{ minHeight: '500px' }}
          title={lesson.material_name || "PDF hujjat"}
        />
      </div>
    );
  }

  // File viewer: Video files (mp4, webm, etc.)
  if (isFileUrl && fileType === 'video') {
    const progress = duration ? (currentTime / duration) * 100 : 0;
    return (
      <div
        className="aspect-video rounded-2xl overflow-hidden relative bg-black group/player"
        onMouseMove={showControls}
        onClick={togglePlay}
      >
        <video
          ref={videoRef}
          src={rewriteStorageUrl(activeUrl)}
          className="w-full h-full object-contain"
          muted={muted}
          onTimeUpdate={() => setCt(videoRef.current?.currentTime || 0)}
          onLoadedMetadata={() => setDur(videoRef.current?.duration || 0)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
        />

        <AnimatePresence>
          {controlsVisible && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div className="w-16 h-16 rounded-full flex items-center justify-center border border-white/20 bg-black/30">
                {playing
                  ? <Pause className="w-7 h-7 text-white" />
                  : <Play className="w-7 h-7 text-white ml-1 fill-white" />
                }
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {controlsVisible && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25 }}
              className="absolute bottom-0 left-0 right-0 px-5 pb-4 pt-2"
              onClick={e => e.stopPropagation()}
            >
              <div
                className="w-full h-1 bg-white/20 rounded-full mb-3 cursor-pointer group/bar relative"
                onClick={seek}
              >
                <div
                  className="h-full rounded-full relative bg-[#E8192C]"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white opacity-0 group-hover/bar:opacity-100 transition-opacity" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { if (videoRef.current) videoRef.current.currentTime -= 10; }}
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <button onClick={togglePlay} className="text-white hover:text-white/80 transition-colors">
                    {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                  </button>

                  <button
                    onClick={() => { if (videoRef.current) videoRef.current.currentTime += 10; }}
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => { setMuted(!muted); if (videoRef.current) videoRef.current.muted = !muted; }}
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>

                  <span className="text-white/60 text-[11px] font-medium tabular-nums">
                    {fmt(currentTime)} / {fmt(duration)}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <button
                      onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                      className="text-white/70 hover:text-white text-[11px] font-medium tabular-nums transition-colors"
                    >
                      {speed}x
                    </button>
                    <AnimatePresence>
                      {showSpeedMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          transition={{ duration: 0.25 }}
                          className="absolute bottom-8 right-0 bg-slate-900 border border-white/10 rounded-xl p-1.5 min-w-[80px] z-50"
                        >
                          {[0.5, 0.75, 1, 1.25, 1.5, 2].map(s => (
                            <button
                              key={s}
                              onClick={() => changeSpeed(s)}
                              className={`w-full text-[11px] font-medium px-3 py-1.5 rounded-lg transition-colors text-left ${
                                speed === s ? 'text-white' : 'text-white/60 hover:text-white'
                              }`}
                              style={speed === s ? { background: "#E8192C" } : {}}
                            >
                              {s}x
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <button onClick={fullscreen} className="text-white/70 hover:text-white transition-colors">
                    <Maximize className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // File viewer: Audio files (mp3, wav, etc.)
  if (isFileUrl && fileType === 'audio') {
    return (
      <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Music className="w-8 h-8 text-slate-400" />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-slate-900 dark:text-white mb-1">
              {lesson.title || "Audio dars"}
            </p>
            <p className="text-[13px] text-slate-500">
              {lesson.material_name || "Audio fayl"}
            </p>
          </div>
          <audio
            ref={videoRef as any}
            src={rewriteStorageUrl(activeUrl)}
            className="w-full max-w-md"
            controls
            onTimeUpdate={() => setCt(videoRef.current?.currentTime || 0)}
            onLoadedMetadata={() => setDur(videoRef.current?.duration || 0)}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          />
          <a href={rewriteStorageUrl(activeUrl)} download
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium text-[#E8192C] hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
            <Download className="w-4 h-4" /> Yuklab olish
          </a>
        </div>
      </div>
    );
  }

  // File viewer: Documents (docx, pptx, etc.) — show download + info
  if (isFileUrl && (fileType === 'document' || fileType === 'unknown')) {
    const ext = activeUrl.split('?')[0].split('.').pop()?.toLowerCase() || '';
    const iconMap: Record<string, any> = {
      doc: FileText, docx: FileText,
      ppt: FileSpreadsheet, pptx: FileSpreadsheet,
      xls: FileSpreadsheet, xlsx: FileSpreadsheet,
    };
    const Icon = iconMap[ext] || File;
    return (
      <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Icon className="w-8 h-8 text-slate-400" />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-slate-900 dark:text-white mb-1">
              {lesson.title || "Dars materiali"}
            </p>
            <p className="text-[13px] text-slate-500">
              {lesson.material_name || `${ext.toUpperCase()} fayl`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a href={rewriteStorageUrl(activeUrl)} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[13px] font-medium text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
              style={{ background: "#E8192C" }}>
              <FileText className="w-4 h-4" /> Ko'rish
            </a>
            <a href={rewriteStorageUrl(activeUrl)} download
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[13px] font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <Download className="w-4 h-4" /> Yuklab olish
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Youtube embed
  if (isYoutube) {
    const embedUrl = activeUrl
      .replace('watch?v=', 'embed/')
      .replace('youtu.be/', 'www.youtube.com/embed/')
      + '?autoplay=1&rel=0&modestbranding=1';
    return (
      <div className="aspect-video rounded-2xl overflow-hidden bg-black">
        <iframe src={embedUrl} className="w-full h-full border-none" allowFullScreen allow="autoplay; encrypted-media" />
      </div>
    );
  }

  // Native video player
  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className="aspect-video rounded-2xl overflow-hidden relative bg-black group/player"
      onMouseMove={showControls}
      onClick={togglePlay}
    >
      {activeUrl && (
        <video
          ref={videoRef}
          src={rewriteStorageUrl(activeUrl)}
          className="w-full h-full object-contain"
          muted={muted}
          onTimeUpdate={() => setCt(videoRef.current?.currentTime || 0)}
          onLoadedMetadata={() => setDur(videoRef.current?.duration || 0)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
        />
      )}

      <AnimatePresence>
        {controlsVisible && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="w-16 h-16 rounded-full flex items-center justify-center border border-white/20 bg-black/30">
              {playing
                ? <Pause className="w-7 h-7 text-white" />
                : <Play className="w-7 h-7 text-white ml-1 fill-white" />
              }
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {controlsVisible && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25 }}
            className="absolute bottom-0 left-0 right-0 px-5 pb-4 pt-2"
            onClick={e => e.stopPropagation()}
          >
            <div
              className="w-full h-1 bg-white/20 rounded-full mb-3 cursor-pointer group/bar relative"
              onClick={seek}
            >
              <div
                className="h-full rounded-full relative bg-[#E8192C]"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white opacity-0 group-hover/bar:opacity-100 transition-opacity" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { if (videoRef.current) videoRef.current.currentTime -= 10; }}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button onClick={togglePlay} className="text-white hover:text-white/80 transition-colors">
                  {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                </button>

                <button
                  onClick={() => { if (videoRef.current) videoRef.current.currentTime += 10; }}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  <RotateCw className="w-4 h-4" />
                </button>

                <button
                  onClick={() => { setMuted(!muted); if (videoRef.current) videoRef.current.muted = !muted; }}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>

                <span className="text-white/60 text-[11px] font-medium tabular-nums">
                  {fmt(currentTime)} / {fmt(duration)}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <button
                    onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                    className="text-white/70 hover:text-white text-[11px] font-medium tabular-nums transition-colors"
                  >
                    {speed}x
                  </button>
                  <AnimatePresence>
                    {showSpeedMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.25 }}
                        className="absolute bottom-8 right-0 bg-slate-900 border border-white/10 rounded-xl p-1.5 min-w-[80px] z-50"
                      >
                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map(s => (
                          <button
                            key={s}
                            onClick={() => changeSpeed(s)}
                            className={`w-full text-[11px] font-medium px-3 py-1.5 rounded-lg transition-colors text-left ${
                              speed === s ? 'text-white' : 'text-white/60 hover:text-white'
                            }`}
                            style={speed === s ? { background: "#E8192C" } : {}}
                          >
                            {s}x
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button className="text-white/50 hover:text-white transition-colors">
                  <Settings className="w-4 h-4" />
                </button>

                <button onClick={fullscreen} className="text-white/70 hover:text-white transition-colors">
                  <Maximize className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const LEVEL_STYLES: Record<string, { label: string }> = {
  beginner:     { label: "Boshlang'ich" },
  intermediate: { label: "O'rtacha" },
  advanced:     { label: "Murakkab" },
};

/* ── Stat Pill ─────────────────────────────────────────── */
function StatPill({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
      <Icon className="w-4 h-4 text-slate-400" />
      <span className="text-[13px] font-semibold text-slate-900 dark:text-white tabular-nums">{value}</span>
      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{label}</span>
    </div>
  );
}

/* ── Module Sidebar Item ──────────────────────────────── */
function LessonItem({ lesson, isActive, isEnrolled, onClick }: any) {
  return (
    <button
      onClick={onClick}
      disabled={!isEnrolled}
      className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between transition-colors group ${
        isActive
          ? 'text-white'
          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
      }`}
      style={isActive ? { background: "#E8192C", color: "white" } : {}}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${isActive ? 'text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-300'}`}
          style={isActive ? { background: "#E8192C" } : {}}
        >
          {isEnrolled ? <Play className="w-2.5 h-2.5 fill-current" /> : <Lock className="w-2.5 h-2.5" />}
        </div>
        <span className={`text-[11px] font-medium truncate ${isActive ? '' : ''}`}>{lesson.title}</span>
      </div>
      <span className="text-[9px] font-medium tabular-nums text-slate-300 dark:text-slate-600 flex-shrink-0 ml-2">
        {lesson.duration || "—"}
      </span>
    </button>
  );
}

/* ── Payment Modal ─────────────────────────────────────── */
function CoursePayModal({ open, onClose, course, profile, enrollMutation }: any) {
  const { balance: eduBalance } = useEduCoin();

  const handlePay = async (method: string) => {
    if (method === 'wallet') {
      enrollMutation.mutate("uzs");
      onClose();
    } else if (method === 'educoin') {
      enrollMutation.mutate("educoin");
      onClose();
    } else {
      const amt = course?.price || 0;
      const inPayMethod = method === 'xazna' ? 'cardsystem' : (method === 'inpay' ? undefined : method);
      try {
        const res = await fetch('/api/payments/inpay/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: profile?.user_id || profile?.id,
            amount: amt,
            payment_method: inPayMethod,
            description: `Kurs xaridi: ${course?.title || ''}`,
            notes: `Kurs xaridi: ${course?.title || ''}`,
            return_url: window.location.href
          })
        });
        const data = await res.json();
        const url = data?.pay_url || data?.checkout_url;
        if (url) {
          window.location.href = url;
        } else {
          toast({ title: "Xatolik", description: "InPay to'lov havolasini olib bo'lmadi", variant: "destructive" });
        }
      } catch (e) {
        toast({ title: "Xatolik", description: "To'lov jarayonida xatolik yuz berdi", variant: "destructive" });
      }
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 rounded-2xl overflow-visible border-none">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "#E8192C" }}>
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-medium uppercase tracking-wider mb-1" style={{ color: "#E8192C" }}>{course?.category}</p>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white leading-tight truncate">{course?.title}</h3>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between gap-2">
            <span className="text-[10px] font-medium text-slate-500 shrink-0">Kurs narxi</span>
            <span className="text-xl font-semibold text-slate-900 dark:text-white tabular-nums">
              {course?.price > 0 ? `${course.price.toLocaleString()} UZS` : "Bepul"}
            </span>
          </div>
        </div>

        <div className="p-5 space-y-2.5 bg-white dark:bg-slate-950">
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 mb-3">To'lov usulini tanlang</p>

          {/* InPay Instant Payment Option */}
          <button
            onClick={() => handlePay('inpay')}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 transition-colors group focus:outline-none focus:ring-0"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center border border-emerald-500 font-extrabold text-[12px]">
              ⚡
            </div>
            <div className="text-left flex-1 min-w-0">
              <p className="text-[12px] font-extrabold text-emerald-900 dark:text-emerald-300">InPay Instant To'lov</p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Uzcard, Humo, Payme yoki Click</p>
            </div>
            <span className="text-[9px] font-extrabold bg-emerald-600 text-white px-2 py-0.5 rounded-full shrink-0">
              Avtomatik
            </span>
          </button>

          <button
            onClick={() => handlePay('wallet')}
            disabled={enrollMutation.isPending}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 transition-colors group focus:outline-none focus:ring-0"
          >
            <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
              <Wallet className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            </div>
            <div className="text-left flex-1 min-w-0">
              <p className="text-[12px] font-medium text-slate-800 dark:text-slate-200">Balansdan to'lash</p>
              <p className="text-[10px] text-slate-400">Mavjud: {(profile?.balance || 0).toLocaleString()} UZS</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 transition-colors shrink-0" />
          </button>


          <button
            onClick={() => handlePay('educoin')}
            disabled={enrollMutation.isPending}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 transition-colors group focus:outline-none focus:ring-0"
          >
            <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
              <Coins className="w-4 h-4 text-slate-500" />
            </div>
            <div className="text-left flex-1">
              <p className="text-[12px] font-medium text-slate-800 dark:text-slate-200">EduCoin bilan (bepul)</p>
              <p className="text-[10px] text-slate-400">Hisobingizda: {eduBalance} EDU</p>
            </div>
            <span className="text-[10px] font-medium text-white px-2 py-1 rounded-lg shrink-0 whitespace-nowrap" style={{ background: "#E8192C" }}>
              -{course?.educoin_price || Math.ceil((course?.price || 0) / 100)} EDU
            </span>
          </button>

          <div className="flex items-center gap-3 my-1 opacity-60">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
            <span className="text-[9px] font-medium uppercase tracking-wider text-slate-400">To'lov tizimlar</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(['click', 'payme', 'xazna'] as const).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => handlePay(method)}
                className="py-3 px-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center gap-1.5 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all active:scale-95 shadow-xs cursor-pointer"
              >
                <img src={`/${method}.png`} alt={method} className="h-6 w-full object-contain" />
                <span className="text-[9.5px] font-extrabold uppercase text-slate-700 dark:text-slate-200">
                  {method === 'xazna' ? 'UzCard/Humo' : method}
                </span>
              </button>
            ))}
          </div>

          <p className="flex items-center justify-center gap-1.5 text-[9px] font-medium text-slate-400 pt-1">
            <ShieldCheck className="w-3 h-3 text-slate-400" />
            100% xavfsiz to'lov tizimi
          </p>

          <button onClick={onClose} className="w-full text-center text-[10px] font-medium text-slate-400 hover:text-slate-600 transition-colors pt-1">
            Bekor qilish
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Main Component ─────────────────────────────────────── */
const CourseDetails = () => {
  const params = useParams();
  const id = params.id || params.courseSlug;
  const { courseSlug } = params;
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();

  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [comment, setComment] = useState("");
  const [payOpen, setPayOpen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  /* Fetch course */
  const { data: course, isLoading } = useQuery({
    queryKey: ["course-details", id],
    queryFn: async () => {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id || "");
      if (isUUID) {
        const { data, error } = await supabase.from("courses").select(`*, teacher:teacher_id(full_name, avatar_url), modules:course_modules(*, lessons:course_lessons(*), tests:course_tests(*))`).eq("id", id).single();
        if (!error) return data;
      }

      // Targeted title match first
      const normalizedTitle = (courseSlug || id || '').replace(/-/g, ' ');
      const { data: matchedTitle } = await supabase
        .from("courses")
        .select(`*, teacher:teacher_id(full_name, avatar_url), modules:course_modules(*, lessons:course_lessons(*), tests:course_tests(*))`)
        .eq("status", "approved")
        .ilike("title", normalizedTitle)
        .maybeSingle();

      if (matchedTitle) return matchedTitle;

      const { data: all } = await supabase
        .from("courses")
        .select(`*, teacher:teacher_id(full_name, avatar_url), modules:course_modules(*, lessons:course_lessons(*), tests:course_tests(*))`)
        .eq("status", "approved")
        .limit(50);

      if (all) {
        const found = (all as any[]).find(c => slugify(c.title) === courseSlug || slugify(c.title) === id || c.id === id);
        if (found) return found;
      }
      throw new Error("Kurs topilmadi");
    }
  });

  /* Enrollment check */
  const { data: enrollment } = useQuery({
    queryKey: ["enrollment", course?.id, user?.id],
    queryFn: async () => {
      if (!user || !course?.id) return null;
      const { data } = await supabase.from("course_enrollments").select("*").eq("course_id", course.id).eq("user_id", user.id).maybeSingle();
      return data;
    },
    enabled: !!user && !!course?.id,
  });

  /* Reviews */
  const { data: reviews } = useQuery({
    queryKey: ["course-reviews", course?.id],
    queryFn: async () => {
      if (!course?.id) return [];
      const { data } = await (supabase as any).from("course_reviews").select(`*, user:user_id(full_name, avatar_url)`).eq("course_id", course.id).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!course?.id,
  });

  /* Enroll */
  const enrollMutation = useMutation({
    mutationFn: async (method: "uzs" | "educoin") => {
      if (!user) throw new Error("Tizimga kiring");
      const { data, error } = await (supabase as any).rpc('buy_course', { p_course_id: course.id, p_payment_method: method });
      if (error) throw error;
      const result = data as { success: boolean; message: string };
      if (!result.success) throw new Error(result.message);
      return result;
    },
    onSuccess: () => {
      toast({ title: "Muvaffaqiyat 🎉", description: "Kursga muvaffaqiyatli a'zo bo'ldingiz!" });
      queryClient.invalidateQueries({ queryKey: ["enrollment", course?.id] });
      queryClient.invalidateQueries({ queryKey: ["my-enrollments"] });
    },
    onError: (err: any) => toast({ title: "Xatolik", description: err.message, variant: "destructive" }),
  });

  /* Review */
  const reviewMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user || !course?.id) throw new Error("Tizimga kiring");
      const { error } = await (supabase as any).from("course_reviews").insert({ course_id: course.id, user_id: user.id, comment: content, rating: 5 });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Fikr qo'shildi ✓" });
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["course-reviews", course?.id] });
    },
    onError: (err: any) => toast({ title: "Xatolik", description: err.message, variant: "destructive" }),
  });

  const isEnrolled = !!enrollment || course?.teacher_id === user?.id;

  const totalLessons = course?.modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0) || 0;
  const totalTests   = course?.modules?.reduce((acc: number, m: any) => acc + (m.tests?.length || 0), 0) || 0;

  if (isLoading) return (
    <div className="w-full h-[40vh] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-slate-200 border-t-[#E8192C] rounded-full animate-spin" />
    </div>
  );

  if (!course) return (
    <div className="p-12 text-center text-slate-400 text-[10px] font-medium uppercase tracking-wider">
      Kurs topilmadi
    </div>
  );

  const level = LEVEL_STYLES[course.level] ?? LEVEL_STYLES.beginner;

  return (
    <div className="w-full pb-20 space-y-5">
      <SEO title={course.meta_title || course.title} description={course.meta_description || course.description?.substring(0, 160)} />

      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/courses")}
          className="w-8 h-8 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors active:scale-[0.98]">
          <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
        </button>
        <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-slate-400">
          <span onClick={() => navigate("/courses")} className="hover:text-[#E8192C] transition-colors cursor-pointer">Kurslar</span>
          <ChevronRight className="w-3 h-3" />
          <span style={{ color: "#E8192C" }}>{course.category}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ── Main ── */}
        <div className="lg:col-span-8 lg:ml-10 space-y-5">
          {/* Video Player */}
          <VideoPlayer
            lesson={activeLesson}
            isEnrolled={isEnrolled}
            onPayClick={() => setPayOpen(true)}
            course={course}
          />

          {/* Course Info Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
            {/* Tags row */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-medium rounded-lg px-2.5 py-1 text-[#E8192C] bg-slate-100 dark:bg-slate-800">
                {course.category}
              </span>
              {course.level && (
                <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500">
                  {level.label}
                </span>
              )}
              {(course.is_free || !course.price) && (
                <span className="font-medium text-[10px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">Bepul</span>
              )}
            </div>

            <div className="flex items-start justify-between gap-4">
              <h1 className="text-xl md:text-2xl font-semibold text-slate-900 dark:text-white tracking-tight leading-tight flex-1">
                {activeLesson?.title || course.title}
              </h1>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => setIsBookmarked(!isBookmarked)}
                  className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center transition-colors active:scale-[0.98]"
                >
                  {isBookmarked ? <BookmarkCheck className="w-3.5 h-3.5 text-slate-400" /> : <Bookmark className="w-3.5 h-3.5 text-slate-400" />}
                </button>
                <button className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center transition-colors active:scale-[0.98] text-slate-400">
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-2 flex-wrap">
              <StatPill icon={Star} label="Reyting" value={Number(course.average_rating || 0).toFixed(1)} />
              <StatPill icon={Users} label="O'quvchi" value={(course.student_count || 0).toLocaleString()} />
              <StatPill icon={BookOpen} label="Dars" value={totalLessons} />
              <StatPill icon={FileText} label="Test" value={totalTests} />
              {course.duration_hours && <StatPill icon={Clock} label="Vaqt" value={`${course.duration_hours}h`} />}
            </div>

            {/* Author */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  {course.teacher?.avatar_url
                    ? <img src={rewriteStorageUrl(course.teacher.avatar_url)} className="w-full h-full object-cover" alt="" />
                    : <div className="w-full h-full flex items-center justify-center"><User className="w-4 h-4 text-slate-300" /></div>
                  }
                </div>
                <div>
                  <p className="text-[9px] font-medium uppercase tracking-wider mb-0.5" style={{ color: "#E8192C" }}>Muallif</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{course.teacher?.full_name}</p>
                </div>
              </div>
              {isEnrolled && user?.id !== course.teacher_id && (
                <Link
                  to={`/messages?user=${course.teacher_id}&course=${course.id}`}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-medium uppercase tracking-wider transition-all border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600"
                >
                  <MessageCircle className="w-3.5 h-3.5" />Xabar
                </Link>
              )}
              {user?.id === course.teacher_id && (
                <Link
                  to={`/courses/edit/${course.id}`}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-medium uppercase tracking-wider transition-all text-white"
                  style={{ background: "#E8192C" }}
                >
                  Tahrirlash
                </Link>
              )}
            </div>

            {/* Description */}
            {course.description && (
              <div className="space-y-2">
                <h3 className="text-[9px] font-medium uppercase tracking-wider text-slate-400 border-l border-slate-200 dark:border-slate-700 pl-3">Kurs haqida</h3>
                <p className="text-[12px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed pl-5">{activeLesson?.content || course.description}</p>
              </div>
            )}
          </div>

          {/* Reviews */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-[10px] font-medium uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Star className="w-3.5 h-3.5 text-slate-300 fill-slate-300" />
              Fikrlar · {reviews?.length || 0}
            </h3>

            {isEnrolled && (
              <div className="relative group">
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:outline-none transition-colors resize-none dark:text-white placeholder-slate-400"
                  placeholder="Kurs haqida fikringizni yozing..."
                  rows={3}
                />
                <div className="absolute bottom-3 right-3 opacity-0 group-focus-within:opacity-100 transition-opacity">
                  <button
                    onClick={() => reviewMutation.mutate(comment)}
                    disabled={!comment.trim() || reviewMutation.isPending}
                    className="px-4 py-2 text-white rounded-lg text-[9px] font-medium uppercase tracking-wider transition-opacity disabled:opacity-50 flex items-center gap-1.5"
                    style={{ background: "#E8192C" }}
                  >
                    <Send className="w-3 h-3" />
                    {reviewMutation.isPending ? "Yuborilmoqda..." : "Yuborish"}
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {reviews?.map((rev: any) => (
                <div key={rev.id} className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden">
                        {rev.user?.avatar_url
                          ? <img src={rewriteStorageUrl(rev.user.avatar_url)} className="w-full h-full object-cover" alt="" />
                          : <User className="w-4 h-4 m-1.5 text-slate-300" />
                        }
                      </div>
                      <div>
                        <h4 className="text-[10px] font-semibold text-slate-900 dark:text-white">{rev.user?.full_name || "O'quvchi"}</h4>
                        <p className="text-[9px] font-medium text-slate-400 tabular-nums">
                          {new Date(rev.created_at).toLocaleDateString(i18n.language === 'uz' ? 'uz-UZ' : 'en-US')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-2.5 h-2.5 ${i < rev.rating ? "fill-slate-300 text-slate-300" : "text-slate-200 dark:text-slate-700"}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed pl-9">{rev.comment}</p>
                </div>
              ))}

              {(!reviews || reviews.length === 0) && (
                <div className="py-10 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Hali fikrlar yo'q</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="lg:col-span-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sticky top-20 overflow-hidden">
            {!isEnrolled && (
              <div className="p-5 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-[9px] font-medium uppercase tracking-wider mb-0.5" style={{ color: "#E8192C" }}>Narx</p>
                    <p className="text-2xl font-semibold text-slate-900 dark:text-white tabular-nums">
                      {course.price > 0 ? `${course.price.toLocaleString()} UZS` : "Bepul"}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                    <Trophy className="w-6 h-6 text-slate-500" />
                  </div>
                </div>
                <button
                  onClick={() => setPayOpen(true)}
                  className="w-full py-3 rounded-xl text-[11px] font-medium text-white uppercase tracking-wider transition-opacity hover:opacity-90 active:scale-[0.98]"
                  style={{ background: "#E8192C" }}
                >
                  {course.price > 0 ? "Kursga a'zo bo'lish" : "Bepul boshlash"}
                </button>
                <p className="flex items-center justify-center gap-1.5 text-[9px] font-medium text-slate-400 mt-2">
                  <ShieldCheck className="w-3 h-3 text-slate-400" />100% xavfsiz to'lov
                </p>
              </div>
            )}

            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-medium uppercase tracking-wider text-slate-900 dark:text-white">Kurs mazmuni</h3>
                <span className="text-[9px] font-medium text-slate-300 dark:text-slate-600 uppercase">{course.modules?.length || 0} modul</span>
              </div>

              <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                {course.modules?.sort((a: any, b: any) => a.sort_order - b.sort_order).map((mod: any, idx: number) => (
                  <div key={mod.id} className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-5 h-5 rounded-lg flex items-center justify-center text-[9px] font-medium flex-shrink-0 bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {idx + 1}
                      </span>
                      <h4 className="text-[11px] font-semibold text-slate-900 dark:text-white uppercase tracking-tight truncate">{mod.title}</h4>
                    </div>

                    <div className="pl-2 space-y-0.5 border-l border-slate-200 dark:border-slate-800 ml-2.5">
                      {mod.lessons?.sort((a: any, b: any) => a.sort_order - b.sort_order).map((lesson: any) => (
                        <LessonItem
                          key={lesson.id}
                          lesson={lesson}
                          isActive={activeLesson?.id === lesson.id}
                          isEnrolled={isEnrolled}
                          onClick={() => isEnrolled && setActiveLesson(lesson)}
                        />
                      ))}

                      {mod.tests?.map((test: any) => (
                        <button
                          key={test.id}
                          onClick={() => isEnrolled && navigate(`/courses/${slugify(course.category || 'general')}/${slugify(course.title)}/test/${test.id}`)}
                          disabled={!isEnrolled}
                          className="w-full text-left p-2.5 rounded-xl flex items-center justify-between transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 group"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[9px] font-medium" style={{ background: "#E8192C" }}>
                              {isEnrolled ? <CheckCircle2 className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                            </div>
                            <span className="text-[11px] font-medium uppercase tracking-tight" style={{ color: "#E8192C" }}>{test.title || "Test"}</span>
                          </div>
                          <span className="text-[9px] font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg" style={{ color: "#E8192C" }}>Test</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {(!course.modules || course.modules.length === 0) && (
                  <div className="py-8 text-center text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                    Modullar yuklanmoqda...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <CoursePayModal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        course={course}
        profile={profile}
        enrollMutation={enrollMutation}
      />
    </div>
  );
};

export default CourseDetails;
