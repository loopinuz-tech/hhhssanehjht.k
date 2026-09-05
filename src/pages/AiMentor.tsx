import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronRight, HelpCircle, ArrowLeft, Loader2 } from "lucide-react";
import { MicrophoneIcon } from "@solar-icons/react/bold-duotone/microphone";
import { VolumeLoudIcon } from "@solar-icons/react/bold-duotone/volume-loud";
import { VolumeCrossIcon } from "@solar-icons/react/bold-duotone/volume-cross";
import { BookBookmarkIcon } from "@solar-icons/react/bold-duotone/book-bookmark";
import { ChatSquareIcon } from "@solar-icons/react/bold-duotone/chat-square";
import { CalendarIcon } from "@solar-icons/react/bold-duotone/calendar";
import { HeartIcon } from "@solar-icons/react/bold-duotone/heart";
import { CrownIcon } from "@solar-icons/react/bold-duotone/crown";
import { LockIcon } from "@solar-icons/react/bold-duotone/lock";
import { StarsIcon } from "@solar-icons/react/bold-duotone/stars";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const FEATURES = [
  {
    icon: BookBookmarkIcon,
    title: "Mavzularni tushuntirish",
    description: "Qiyin mavzulardan oddiy qilib tushuntiradi"
  },
  {
    icon: ChatSquareIcon,
    title: "Savollarga javob berish",
    description: "Istalgan savolingizga javob beradi"
  },
  {
    icon: CalendarIcon,
    title: "O'quv rejasi tuzish",
    description: "Shaxsiy o'quv rejangizni tuzib beradi"
  },
  {
    icon: HeartIcon,
    title: "Ruhiy qo'llab-quvvatlash",
    description: "Imtihon oldi hayajonini yengishga yordam beradi"
  }
];

const SYSTEM_PROMPT = `Sen AI Mentorsan — do'stona, quvnoq va hayotiy AI ustoz. 

MUHIM QOIDALAR:
1. JAVOBLAR JUDA QISQA bo'lsin — 1-2 gap yetadi, ko'pida 1 gap
2. O'zbekchada oddiy, ravon, tabiiy gapir — kitob emas, haqiqiy odamday
3. Hech qanday maxsus belgi ishlatma: *, #, -, _, >, <, /, {, }, [, ], (, ), ?, !, ., ,, :, ;, ", ' — faqat oddiy matn
4. Emoji ishlatma — faqat oddiy so'zlar bilan ifoda et
5. Hazil-huzul aralash, kayfiyatni ko'taruvchi gapir
6. Foydalanuvchiga "sen" deb murojaat qil
7. Har javobning oxirida savol ber — shunda suhbat davom etsin
8. Agar foydalanuvchi noto'g'ri gapirs ham tushunishga harakat qil, tanqid qilma
9. Bir xil javob berma — har safar yangicha ayt
10. Juda sodda, bolalar tushunadigan tilda gapir

Misol javoblar:
- Salom, kayfiyat qanaqa
- Zo'r ekans, davom et
- Ajoyib, yana nimani o'rganmoqchisan
- Katta rahmat, sen juda yaxshisan
- Xo'p, tushundim, yana savol bormi
- Ha ha, to'g'ri aytding
- Juda yaxshi fikr, qo'llab quvvatlayman`;

const SUGGESTIONS = [
  "Salom, kayfiyat qanaqa?",
  "Bugun nimani o'rganmoqchisan?",
  "Menga motivatsiya ber",
  "Bir oz hazil qil"
];

const AiMentor = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [currentResponse, setCurrentResponse] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState("lola");

  const VOICES = [
    { id: "lola", name: "Lola", gender: "female" },
    { id: "nilufar", name: "Nilufar", gender: "female" },
    { id: "sardor", name: "Sardor", gender: "male" },
    { id: "shirin", name: "Shirin", gender: "female" },
  ];

  const recognitionRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'ru-RU';

        recognitionRef.current.onresult = (event: any) => {
          const current = event.resultIndex;
          const result = event.results[current];
          const transcriptText = result[0].transcript;
          setTranscript(transcriptText);

          if (result.isFinal) {
            handleUserMessage(transcriptText);
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          if (event.error !== 'no-speech') {
            toast.error("Ovoz aniqlanmadi. Qaytadan urinib ko'ring.");
          }
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      } else {
        toast.error("Brauzeringiz ovozni aniqlashni qo'llab-quvvatlamaydi");
      }
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.speechSynthesis?.cancel();
    };
  }, []);

  const drawWaveform = useCallback(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = isListening ? '#E8192C' : '#94a3b8';
      ctx.beginPath();

      const bars = 40;
      const barWidth = canvas.width / bars;
      const centerY = canvas.height / 2;

      for (let i = 0; i < bars; i++) {
        const amplitude = isListening
          ? 8 + Math.random() * 16
          : isSpeaking
            ? 4 + Math.random() * 10
            : 2;
        const x = i * barWidth + barWidth / 2;
        ctx.moveTo(x, centerY - amplitude);
        ctx.lineTo(x, centerY + amplitude);
      }

      ctx.stroke();
    };

    draw();
  }, [isListening, isSpeaking]);

  useEffect(() => {
    drawWaveform();
    return () => cancelAnimationFrame(animationRef.current);
  }, [drawWaveform]);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) {
      toast.error("Ovoz aniqlash qurilmasi topilmadi");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript("");
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening, isSpeaking]);

  const cleanTextForSpeech = (text: string): string => {
    return text
      .replace(/[\*\#\-\_\>\<\/\{\}\[\]\(\)\?\!\.\,\:\;\"\'\`\~\@\$\%\^\&\+\\\|\=]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const speakText = useCallback(async (text: string) => {
    if (isMuted) return;

    const cleanedText = cleanTextForSpeech(text);
    setIsSpeaking(true);

    const isUzbekVoice = selectedVoice === 'lola' || selectedVoice === 'nilufar';
    const edgeVoiceMap: Record<string, string> = {
      sardor: 'uz-UZ-SardorNeural',
      shirin: 'uz-UZ-ShirinNeural',
    };

    // Level 1a: UzbekVoice.ai (Lola/Nilufar — direct browser call)
    if (isUzbekVoice) {
      try {
        const uvRes = await fetch('https://uzbekvoice.ai/api/v1/tts', {
          method: 'POST',
          headers: {
            'Authorization': '88fb04ea-d029-423f-9a0e-1de5747dad77:b5368080-49a2-4b32-b5a2-40e4f28b33ae',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ text: cleanedText, model: selectedVoice, blocking: 'true' }),
          signal: AbortSignal.timeout(15000)
        });

        if (uvRes.ok) {
          const uvJson = await uvRes.json();
          if (uvJson.status === 'SUCCESS' && uvJson.result?.url) {
            const audio = new Audio(uvJson.result.url);
            audio.onended = () => setIsSpeaking(false);
            audio.onerror = () => setIsSpeaking(false);
            await audio.play();
            return;
          }
        }
      } catch (e) {
        console.warn('UzbekVoice direct failed:', e);
      }
    }

    // Level 1b: Edge TTS Browser (Sardor/Shirin — WebSocket, no server needed)
    const edgeVoice = edgeVoiceMap[selectedVoice];
    if (edgeVoice) {
      try {
        const { EdgeTTSBrowser } = await import('edge-tts-universal');
        const tts = new EdgeTTSBrowser(cleanedText, edgeVoice);
        const audioBuffer = await tts.synthesize();
        const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(url); };
        audio.onerror = () => { setIsSpeaking(false); URL.revokeObjectURL(url); };
        await audio.play();
        return;
      } catch (e) {
        console.warn('EdgeTTSBrowser failed:', e);
      }
    }

    // Level 2: Server proxy fallback
    try {
      const resp = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanedText, voice: selectedVoice }),
        signal: AbortSignal.timeout(15000)
      });

      if (resp.ok) {
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(url); };
        audio.onerror = () => { setIsSpeaking(false); URL.revokeObjectURL(url); };
        await audio.play();
        return;
      }
    } catch (e) {
      console.warn('Server TTS failed:', e);
    }

    // Level 3: Browser built-in TTS
    speakWithBrowser(cleanedText);
  }, [isMuted, selectedVoice]);

  const speakWithBrowser = (text: string) => {
    const synth = window.speechSynthesis;
    if (!synth) {
      setIsSpeaking(false);
      return;
    }

    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'uz-UZ';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    const voices = synth.getVoices();
    const bestVoice = voices.find(v => v.lang === 'uz-UZ')
      || voices.find(v => v.lang.startsWith('uz'))
      || voices.find(v => v.lang === 'ru-RU')
      || voices.find(v => v.lang.startsWith('ru'))
      || voices[0];

    if (bestVoice) utterance.voice = bestVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synth.speak(utterance);
  };

  const handleUserMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      role: "user",
      content: text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setTranscript("");
    setIsProcessing(true);

    try {
      const tier = profile?.subscription_tier || "standart";
      if (tier === "standart" && messages.length >= 10) {
        toast.error("Bepul limitga yetdingiz. Premium oling!");
        setIsProcessing(false);
        return;
      }

      const resp = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "mistral-tiny",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: text }
          ],
        })
      });

      if (resp.status === 401) {
        window.dispatchEvent(new CustomEvent('auth-session-expired'));
        return;
      }

      const result = await resp.json();

      if (!resp.ok) {
        throw new Error(result.error || "API xatosi");
      }

      const aiResponse = result.choices?.[0]?.message?.content;
      if (aiResponse) {
        const cleanedResponse = aiResponse
          .replace(/[\*\#\-\_\>\<\/\{\}\[\]\(\)\?\!\.\,\:\;\"\'\`\~\@\$\%\^\&\+\\\|\=]/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        setCurrentResponse(cleanedResponse);
        const assistantMessage: Message = {
          role: "assistant",
          content: aiResponse,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);

        if (!isMuted) speakText(aiResponse);
      }
    } catch (error: any) {
      console.error("AI error:", error);
      toast.error(error.message || "Xatolik yuz berdi");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuggestion = (suggestion: string) => {
    handleUserMessage(suggestion);
  };

  const resetChat = () => {
    setMessages([]);
    setCurrentResponse("");
  };

  const isPremium = !!(profile?.subscription_tier && profile.subscription_tier !== 'standart') || !!(profile?.is_lifetime);

  if (!isPremium) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F1A] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 max-w-sm w-full text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center mx-auto mb-5">
            <CrownIcon className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Premium kerak</h2>
          <p className="text-[13px] text-slate-500 mb-6">
            AI Mentor — faqat Premium va Pro obunachilar uchun mavjud. Obunangizni yangilang va cheksiz imkoniyatlardan foydalaning.
          </p>
          <button
            onClick={() => navigate("/settings/obuna")}
            className="w-full py-2.5 text-[13px] font-medium text-white rounded-xl transition-opacity hover:opacity-90 active:scale-[0.98]"
            style={{ background: "#E8192C" }}
          >
            Obunani yangilash
          </button>
          <button
            onClick={() => navigate(-1)}
            className="w-full mt-2 py-2.5 text-[13px] font-medium text-slate-500 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Orqaga
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F1A]">
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
                  <MicrophoneIcon size={20} className="text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">AI Mentor</h1>
                  <p className="text-[11px] font-medium text-white/60 uppercase tracking-wider">Ovozli AI ustoz</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <select
                value={selectedVoice}
                onChange={e => setSelectedVoice(e.target.value)}
                className="text-[12px] font-medium text-white/80 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-2 py-1.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-white/40"
              >
                {VOICES.map(v => (
                  <option key={v.id} value={v.id} className="text-slate-900">
                    {v.name} ({v.gender === 'female' ? 'Ayol' : 'Erkak'})
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowHelp(true)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/60 hover:text-white"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-2 rounded-xl transition-colors ${
                  isMuted
                    ? "bg-white/20 text-white"
                    : "hover:bg-white/10 text-white/60 hover:text-white"
                }`}
              >
                {isMuted ? <VolumeCrossIcon size={18} className="text-white" /> : <VolumeLoudIcon size={18} className="text-white" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="text-center mb-10"
        >
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white mb-2">
            AI Mentor bilan suhbatlashing
          </h2>
          <p className="text-[13px] text-slate-500">
            Tinglash uchun tayyor. Tugmani bosing va gapira boshlang.
          </p>
        </motion.div>

        {/* Voice Button */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.1 }}
          className="flex flex-col items-center mb-10"
        >
          <div className="relative mb-6">
            {/* Animated glow ring */}
            {isListening && (
              <motion.div
                className="absolute -inset-4 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(232,25,44,0.15) 0%, transparent 70%)" }}
                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
            {/* Pulse rings */}
            <div className={`absolute inset-0 rounded-full transition-all duration-300 ${
              isListening
                ? "ring-4 ring-red-100 dark:ring-red-900/30"
                : isSpeaking
                  ? "ring-4 ring-slate-100 dark:ring-slate-800"
                  : ""
            }`} />

            <button
              onClick={toggleListening}
              disabled={isProcessing}
              className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                isProcessing
                  ? "bg-slate-200 dark:bg-slate-700"
                  : isListening
                    ? "hover:opacity-90"
                    : "hover:opacity-90"
              }`}
              style={!isProcessing ? { background: "#E8192C" } : undefined}
            >
              {isProcessing ? (
                <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
              ) : isListening ? (
                <MicrophoneIcon size={32} className="text-white opacity-60" />
              ) : (
                <MicrophoneIcon size={32} className="text-white" />
              )}
            </button>
          </div>

          {/* Waveform */}
          <canvas
            ref={canvasRef}
            width={320}
            height={40}
            className="mb-6"
          />

          {/* Status text */}
          <p className="text-[13px] text-slate-400 mb-6">
            {isListening
              ? "Gapiring..."
              : isSpeaking
                ? "Javob berilmoqda..."
                : isProcessing
                  ? "Qayta ishlanmoqda..."
                  : "Mikrofon tugmasini bosing"}
          </p>

          {/* Transcript */}
          <AnimatePresence>
            {transcript && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="w-full max-w-lg"
              >
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center">
                  <p className="text-[13px] text-slate-700 dark:text-slate-200">{transcript}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Current Response */}
        <AnimatePresence>
          {currentResponse && !isProcessing && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="mb-8"
            >
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-w-2xl mx-auto">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: "#E8192C" }}>
                    <MicrophoneIcon size={16} className="text-white" />
                  </div>
                  <p className="text-[13px] text-slate-700 dark:text-slate-200 leading-relaxed">{currentResponse}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Suggestions */}
        {messages.length === 0 && !currentResponse && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.2 }}
          >
            <p className="text-center text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-4">
              Yoki quyidagilardan birini tanlang
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
              {SUGGESTIONS.map((suggestion, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: 0.3 + i * 0.05 }}
                  onClick={() => handleSuggestion(suggestion)}
                  className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-left group hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <p className="text-[13px] font-medium text-slate-700 dark:text-slate-200">{suggestion}</p>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#E8192C] mt-2 transition-colors" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* New conversation button */}
        {messages.length > 0 && !isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="text-center mt-6"
          >
            <button
              onClick={resetChat}
              className="px-5 py-2.5 text-[13px] font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Yangi suhbat
            </button>
          </motion.div>
        )}
      </div>

      {/* Features Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {FEATURES.map((feature, i) => {
              const IconComponent = feature.icon;
              return (
                <div
                  key={i}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800"
                >
                  <IconComponent size={18} className="text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-slate-700 dark:text-slate-200 truncate">{feature.title}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Help Modal */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-sm w-full"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Qanday ishlaydi?
              </h3>
              <div className="space-y-3">
                {[
                  "Mikrofon tugmasini bosing",
                  "Savolingizni gapiring",
                  "AI Mentor javob beradi",
                  "Javobni ovozli tinglashingiz mumkin"
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[11px] font-medium text-white mt-0.5" style={{ background: "#E8192C" }}>
                      {i + 1}
                    </span>
                    <p className="text-[13px] text-slate-600 dark:text-slate-300">{step}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="w-full mt-6 py-2.5 text-[13px] font-medium text-white rounded-xl transition-opacity hover:opacity-90 active:scale-[0.98]"
                style={{ background: "#E8192C" }}
              >
                Tushundim
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AiMentor;
