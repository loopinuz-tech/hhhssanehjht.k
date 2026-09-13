import { useState, useRef, useEffect, useCallback } from "react";
import { DocumentTextIcon } from "@solar-icons/react/bold-duotone/document-text";
import { StarsIcon } from "@solar-icons/react/bold-duotone/stars";
import { CpuIcon } from "@solar-icons/react/bold-duotone/cpu";
import { SendSquareIcon as SendIcon } from "@solar-icons/react/bold-duotone/send-square";
import { UserIcon } from "@solar-icons/react/bold-duotone/user";
import { AddSquareIcon } from "@solar-icons/react/bold-duotone/add-square";
import { TrashBinTrashIcon } from "@solar-icons/react/bold-duotone/trash-bin-trash";
import { GalleryIcon } from "@solar-icons/react/bold-duotone/gallery";
import { CopyIcon } from "@solar-icons/react/bold-duotone/copy";
import { RefreshCircleIcon } from "@solar-icons/react/bold-duotone/refresh-circle";
import { MicrophoneIcon } from "@solar-icons/react/bold-duotone/microphone";
import { BookBookmarkIcon } from "@solar-icons/react/bold-duotone/book-bookmark";
import { CupIcon } from "@solar-icons/react/bold-duotone/cup";
import { CalculatorMinimalisticIcon } from "@solar-icons/react/bold-duotone/calculator-minimalistic";
import { AtomIcon } from "@solar-icons/react/bold-duotone/atom";
import { CodeIcon } from "@solar-icons/react/bold-duotone/code";
import { FlameIcon } from "@solar-icons/react/bold-duotone/flame";
import { CloseCircleIcon } from "@solar-icons/react/bold-duotone/close-circle";
import { CheckCircleIcon } from "@solar-icons/react/bold-duotone/check-circle";
import { LikeIcon } from "@solar-icons/react/bold-duotone/like";
import { DislikeIcon } from "@solar-icons/react/bold-duotone/dislike";
import { ShareCircleIcon } from "@solar-icons/react/bold-duotone/share-circle";
import { SidebarMinimalisticIcon } from "@solar-icons/react/bold-duotone/sidebar-minimalistic";
import { MagnifierIcon } from "@solar-icons/react/bold-duotone/magnifier";
import { ChatRoundIcon } from "@solar-icons/react/bold-duotone/chat-round";
import { AltArrowRightIcon } from "@solar-icons/react/bold-duotone/alt-arrow-right";
import { AltArrowLeftIcon } from "@solar-icons/react/bold-duotone/alt-arrow-left";
import { GlobeIcon } from "@solar-icons/react/bold-duotone/globe";
import { TargetIcon } from "@solar-icons/react/bold-duotone/target";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { toast } from "sonner";
import { useTranslation, Trans } from "react-i18next";
import { rewriteStorageUrl } from "@/lib/storage";
import { incrementFeatureUsage } from "@/lib/subscriptionLimits";
import i18n from "@/i18n";

interface Message {
  role: "user" | "assistant" | "system";
  content: string | any[];
}

interface ChatHistory {
  id: string;
  title: string;
  created_at: string;
}

const SUGGESTION_CARDS = [
  {
    icon: CalculatorMinimalisticIcon,
    label: "Matematika yordamchisi",
    sub: "Tenglamalar, integralar va chizmalar",
    gradient: "from-orange-500 to-red-500",
    bg: "bg-orange-50",
    prompt: "Matematika bo'yicha yordam bering"
  },
  {
    icon: GlobeIcon,
    label: "IELTS murabbiyi",
    sub: "Speaking, Writing, Reading, Listening",
    gradient: "from-blue-500 to-indigo-600",
    bg: "bg-blue-50",
    prompt: "IELTS tayyorgarligida yordam bering"
  },
  {
    icon: CodeIcon,
    label: "Dasturlash ustozi",
    sub: "Python, JS, algoritm va loyihalar",
    gradient: "from-violet-500 to-purple-600",
    bg: "bg-violet-50",
    prompt: "Dasturlash bo'yicha savolim bor"
  },
  {
    icon: TargetIcon,
    label: "SAT tayyorgarligi",
    sub: "Math, Evidence-Based Reading",
    gradient: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-50",
    prompt: "SAT imtihoniga tayyorlanishda yordam bering"
  },
  {
    icon: AtomIcon,
    label: "Fizika yordamchisi",
    sub: "Mexanika, elektr, optika",
    gradient: "from-cyan-500 to-blue-600",
    bg: "bg-cyan-50",
    prompt: "Fizika masalasini tushuntirib bering"
  },
  {
    icon: CupIcon,
    label: "Olimpiada murabbiyi",
    sub: "Murakkab masalalar va strategiyalar",
    gradient: "from-amber-500 to-orange-600",
    bg: "bg-amber-50",
    prompt: "Olimpiada masalalarini yechishga yordam bering"
  },
];

function groupChatsByDate(chats: ChatHistory[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const week = new Date(today.getTime() - 7 * 86400000);

  const groups: Record<string, ChatHistory[]> = {
    "Bugun": [],
    "Kecha": [],
    "Oxirgi 7 kun": [],
    "Oldingi": [],
  };

  for (const chat of chats) {
    const d = new Date(chat.created_at);
    if (d >= today) groups["Bugun"].push(chat);
    else if (d >= yesterday) groups["Kecha"].push(chat);
    else if (d >= week) groups["Oxirgi 7 kun"].push(chat);
    else groups["Oldingi"].push(chat);
  }
  return groups;
}

// Code block with copy button
function CodeBlock({ children, className }: any) {
  const [copied, setCopied] = useState(false);
  const lang = className?.replace("language-", "") || "code";
  const code = String(children).replace(/\n$/, "");

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 rounded-2xl overflow-hidden border border-slate-800/60">
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800">
        <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest">{lang}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors px-2.5 py-1 rounded-lg hover:bg-white/10"
        >
          {copied ? <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-400" /> : <CopyIcon className="w-3.5 h-3.5" />}
          {copied ? "Nusxalandi" : "Nusxalash"}
        </button>
      </div>
      <pre className="p-4 bg-slate-950 overflow-x-auto text-[13px] leading-relaxed">
        <code className="text-slate-200 font-mono">{code}</code>
      </pre>
    </div>
  );
}

// Message action buttons
function MessageActions({ content, onRegenerate, isLast }: { content: string; onRegenerate?: () => void; isLast?: boolean }) {
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState<boolean | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(typeof content === "string" ? content : "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
      >
        {copied ? <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500" /> : <CopyIcon className="w-3.5 h-3.5" />}
        {copied ? "Nusxalandi" : "Nusxalash"}
      </button>
      {isLast && onRegenerate && (
        <button
          onClick={onRegenerate}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
        >
          <RefreshCircleIcon className="w-3.5 h-3.5" />
          Qayta olish
        </button>
      )}
      <button
        onClick={() => setLiked(true)}
        className={`p-1.5 rounded-lg transition-all ${liked === true ? "text-emerald-500 bg-emerald-50" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"}`}
      >
        <LikeIcon className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => setLiked(false)}
        className={`p-1.5 rounded-lg transition-all ${liked === false ? "text-rose-500 bg-rose-50" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"}`}
      >
        <DislikeIcon className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => toast.success("Ulashish manzili nusxalandi")}
        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
      >
        <ShareCircleIcon className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

const AiChat = () => {
  const { user, profile } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { chatId } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chats, setChats] = useState<ChatHistory[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(window.innerWidth >= 1400);
  const [searchQuery, setSearchQuery] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const loadChats = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("ai_chats" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    if (!error && data) setChats(data as any);
  };

  useEffect(() => { loadChats(); }, [user]);

  useEffect(() => {
    if (chatId) selectChat(chatId);
    else startNewChat();
  }, [chatId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const startNewChat = () => {
    setMessages([]);
    setActiveChatId(null);
    setInput("");
    setSelectedImage(null);
    if (window.location.pathname !== "/ai") navigate("/ai");
    if (window.innerWidth < 1024) setShowSidebar(false);
  };

  const selectChat = async (id: string) => {
    if (isLoading) return;
    setActiveChatId(id);
    if (window.location.pathname !== `/ai/${id}`) navigate(`/ai/${id}`);
    if (window.innerWidth < 1024) setShowSidebar(false);
    const { data, error } = await supabase
      .from("ai_messages" as any)
      .select("role, content")
      .eq("chat_id", id)
      .order("created_at", { ascending: true });
    if (!error && data) setMessages(data as any);
  };

  const deleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const { error } = await supabase.from("ai_chats" as any).delete().eq("id", chatId);
    if (!error) {
      setChats(prev => prev.filter(c => c.id !== chatId));
      if (activeChatId === chatId) startNewChat();
      toast.success("Suhbat o'chirildi");
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { toast.error("Fayl hajmi 5MB dan oshmasligi kerak"); return; }
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  const handleSend = async (customInput?: string) => {
    const textToSend = customInput || input;
    if ((!textToSend.trim() && !selectedImage) || isLoading || !user) return;

    const limitCheck = await incrementFeatureUsage(user.id, "ai_chat");
    if (!limitCheck.allowed) {
      toast.error("Standart tarifda kuniga max 10 ta AI Chat xabari yuborish mumkin. Cheksiz foydalanish uchun Premium obunaga o'ting!");
      navigate("/settings/obuna");
      return;
    }

    if (window.innerWidth < 1024) setShowSidebar(false);

    let chatId = activeChatId;
    if (!chatId) {
      const title = textToSend.substring(0, 50) || "Tasvir tahlili";
      const { data: newChat, error: chatError } = await (supabase as any)
        .from("ai_chats")
        .insert({ user_id: user.id, title: title + (title.length >= 50 ? "..." : "") })
        .select()
        .single();
      if (chatError) { toast.error("Suhbat yaratishda xatolik"); return; }
      chatId = (newChat as any).id;
      setActiveChatId(chatId);
      setChats(prev => [newChat as any, ...prev]);
    }

    const currentImage = selectedImage;
    const userContent: any = currentImage
      ? [{ type: "text", text: textToSend || "Bu rasmni tahlil qiling" }, { type: "image_url", image_url: { url: currentImage } }]
      : textToSend;

    const userMessage: Message = { role: "user", content: userContent };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setSelectedImage(null);
    setIsLoading(true);
    if (inputRef.current) inputRef.current.style.height = 'auto';

    await (supabase as any).from("ai_messages").insert({
      chat_id: chatId,
      role: "user",
      content: typeof userContent === 'string' ? userContent : JSON.stringify(userContent)
    });

    try {
      const resp = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: currentImage ? "pixtral-12b-2409" : "mistral-tiny",
          messages: [
            {
              role: "system",
              content: i18n.language === 'en'
                ? "You are EduLy AI, a world-class educational assistant. Help students and teachers with explanations, problem solving, and learning. Use markdown for formatting. Use LaTeX for math formulas. Be encouraging and clear."
                : "Siz EduLy AI, dunyo darajasidagi ta'lim yordamchisisiz. O'quvchilar va o'qituvchilarga tushuntirish, masala yechish va o'rganishda yordam bering. Formatlash uchun markdown ishlating. Matematik formulalar uchun LaTeX ishlating. Rag'batlantiruvchi va aniq bo'ling. Faqat O'zbek tilida javob bering."
            },
            ...messages.map(m => ({ role: m.role, content: typeof m.content === 'string' ? m.content : m.content })),
            { role: "user", content: userContent }
          ],
        })
      });

      const result = await resp.json();

      if (!resp.ok) {
        const errMsg = result.error || "API xatosi";
        toast.error(errMsg);
        setMessages(prev => [...prev, { role: "assistant", content: `❌ Xatolik: ${errMsg}` }]);
      } else if (result.choices?.[0]) {
        const aiResponse = result.choices[0].message.content;
        setMessages(prev => [...prev, { role: "assistant", content: aiResponse }]);
        await (supabase as any).from("ai_messages").insert({ chat_id: chatId, role: "assistant", content: aiResponse });
        await (supabase as any).from("ai_chats").update({ updated_at: new Date().toISOString() }).eq("id", chatId);
      } else {
        toast.error("Kutilmagan javob. Qaytadan urinib ko'ring.");
      }
    } catch (error) {
      console.error("AI Fetch error:", error);
      toast.error("Tarmoq xatosi yuz berdi");
      setMessages(prev => [...prev, { role: "assistant", content: "Uzur, hozir ulanishda muammo bor. Iltimos qaytadan urinib ko'ring." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const normalizeMath = (text: string) => {
    if (typeof text !== 'string') return text;
    return text
      .replace(/\\\[/g, '$$$$').replace(/\\\]/g, '$$$$')
      .replace(/\\\(/g, '$$').replace(/\\\)/g, '$$');
  };

  const filteredChats = chats.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const groupedChats = groupChatsByDate(filteredChats);
  const todayCount = messages.filter(m => m.role === "user").length;

  return (
    <div className="flex bg-[#F8FAFC] dark:bg-[#0B0F1A] h-[calc(100vh-56px)] relative overflow-hidden" style={{ fontFamily: "'DM Sans', 'Sora', sans-serif" }}>
      {/* Premium gradient overlay for sidebar bg */}

      {/* LEFT SIDEBAR */}
      <AnimatePresence>
        {showSidebar && (
          <motion.aside
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed lg:relative inset-y-0 left-0 z-40 w-[260px] flex flex-col bg-white/95 dark:bg-[#0D1117]/95 backdrop-blur-xl border-r border-slate-100 dark:border-white/5"
          >
            {/* Sidebar Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FF4D4F] to-[#ff7875] flex items-center justify-center shadow-red-200 overflow-hidden p-1">
                  <img src="/logo.png" className="" alt="EduLy" />
                </div>
                <div>
                  <span className="text-[13px] font-bold text-slate-900 dark:text-white tracking-tight">EduLy AI</span>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-emerald-600 font-medium">Online</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowSidebar(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-all"
              >
                <SidebarMinimalisticIcon className="w-4 h-4" />
              </button>
            </div>

            {/* New Chat Button */}
            <div className="px-4 pt-4 pb-2">
              <button
                onClick={startNewChat}
                className="flex items-center gap-2.5 w-full p-3 bg-gradient-to-r from-[#FF4D4F] to-[#ff6b6d] hover:from-[#e63e40] hover:to-[#ff5555] text-white rounded-xl font-semibold text-sm transition-all shadow-red-200 hover:shadow-lg hover:shadow-red-200 active:scale-[0.98] group"
              >
                <AddSquareIcon className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                Yangi suhbat
              </button>
            </div>

            {/* Search */}
            <div className="px-4 pb-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5 focus-within:border-[#FF4D4F]/30 focus-within:bg-white dark:focus-within:bg-white/10 transition-all">
                <MagnifierIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Suhbatlarni qidirish..."
                  className="flex-1 bg-transparent text-[12px] text-slate-600 dark:text-slate-300 placeholder:text-slate-400 outline-none font-medium"
                />
              </div>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-4 custom-scrollbar">
              {Object.entries(groupedChats).map(([group, items]) =>
                items.length === 0 ? null : (
                  <div key={group}>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-2 mb-2">{group}</p>
                    <div className="space-y-0.5">
                      {items.map(chat => (
                        <div
                          key={chat.id}
                          onClick={() => selectChat(chat.id)}
                          className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 ${activeChatId === chat.id
                            ? "bg-[#FF4D4F]/8 text-[#FF4D4F] border border-[#FF4D4F]/15"
                            : "hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                            }`}
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
                            <ChatRoundIcon className={`w-3.5 h-3.5 shrink-0 ${activeChatId === chat.id ? "text-[#FF4D4F]" : "text-slate-300"}`} />
                            <span className="text-[12.5px] font-medium truncate">{chat.title}</span>
                          </div>
                          <button
                            onClick={e => deleteChat(chat.id, e)}
                            className="p-1 opacity-0 group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-500 rounded-lg transition-all shrink-0"
                          >
<CloseCircleIcon className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}
              {filteredChats.length === 0 && (
                <div className="text-center py-8">
                  <ChatRoundIcon className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Suhbat topilmadi</p>
                </div>
              )}
            </div>


            {/* User profile */}
            <div className="px-4 py-3 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6366F1] to-[#8b5cf6] flex items-center justify-center shrink-0 overflow-hidden">
                  {profile?.avatar_url
                    ? <img src={rewriteStorageUrl(profile.avatar_url)} className="w-full h-full object-cover" />
                    : <UserIcon className="w-4 h-4 text-white" />
                  }
                </div>
                <div className="overflow-hidden min-w-0">
                  <p className="text-[12px] font-semibold text-slate-800 truncate">{profile?.full_name || "Foydalanuvchi"}</p>
                  <span className="text-[10px] text-[#6366F1] font-medium">{profile?.subscription_tier || "Standart"}</span>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile overlay */}
      {showSidebar && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* MAIN CHAT AREA */}
      <main className="flex-1 flex flex-col relative overflow-hidden min-w-0">

        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-white/80 dark:bg-[#0D1117]/80 border-b border-slate-100 dark:border-white/5 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
            >
              <AltArrowLeftIcon className="w-4.5 h-4.5" />
            </button>
            {!showSidebar && (
              <button
                onClick={() => setShowSidebar(true)}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
              >
                <SidebarMinimalisticIcon className="w-4.5 h-4.5" />
              </button>
            )}
            <div className="hidden sm:flex items-center gap-2 text-[13px] text-slate-500">
              <StarsIcon className="w-4 h-4 text-[#FF4D4F]" />
              <span className="font-medium">EduLy AI</span>
              {activeChatId && (
                <>
                  <AltArrowRightIcon className="w-3.5 h-3.5 text-slate-300" />
                  <span className="text-slate-700 dark:text-slate-200 font-medium truncate max-w-[200px]">
                    {chats.find(c => c.id === activeChatId)?.title || "Suhbat"}
                  </span>
                </>
              )}
            </div>
          </div>

        </div>

        {/* Messages area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar">
          {messages.length === 0 ? (
            // WELCOME SCREEN
            <div className="flex flex-col items-center justify-center min-h-full px-6 py-12">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center max-w-2xl mx-auto"
              >
                {/* Logo */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                  className="w-20 h-20 mx-auto mb-6 relative"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-[#FF4D4F] to-[#ff7875] rounded-3xl shadow-red-200 rotate-6"
                    animate={{ rotate: [6, 8, 6], scale: [1, 1.02, 1] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <div className="absolute -inset-3 bg-gradient-to-br from-[#FF4D4F]/20 to-[#ff7875]/20 rounded-[2rem] blur-xl" />
                  <div className="relative w-full h-full bg-gradient-to-br from-[#FF4D4F] to-[#ff7875] rounded-3xl flex items-center justify-center p-3 shadow-lg shadow-red-200/50">
                    <img src="/logo.png" className="" alt="EduLy" />
                  </div>
                </motion.div>

                {/* Title */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#FF4D4F]/8 text-[#FF4D4F] rounded-full text-sm font-semibold mb-4 border border-[#FF4D4F]/15">
                    <FlameIcon className="w-3.5 h-3.5" />
                    EduLy AI
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white leading-tight mb-2">
                    Bugun nimani <span className="text-[#FF4D4F]">o'rganmoqchisiz?</span>
                  </h1>
                  <p className="text-base text-slate-500 font-normal">
                    Men sizning shaxsiy AI o'qituvchingizman — istalgan mavzuda yordam beraman
                  </p>
                </motion.div>

                {/* Suggestion Cards */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-10 text-left"
                >
                  {SUGGESTION_CARDS.map((card, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + i * 0.07 }}
                      whileHover={{ y: -3, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { setInput(card.prompt); inputRef.current?.focus(); }}
                      className="p-4 bg-white dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10 hover:shadow-lg hover:shadow-slate-100 dark:hover:shadow-none transition-all duration-300 cursor-pointer text-left group"
                    >
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200`}>
                        <card.icon className="w-4.5 h-4.5 text-white" />
                      </div>
                      <h3 className="text-[13px] font-semibold text-slate-800 dark:text-white leading-tight mb-1">{card.label}</h3>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">{card.sub}</p>
                    </motion.button>
                  ))}
                </motion.div>

                {/* Bottom hint */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="text-[12px] text-slate-400 mt-8"
                >
                  ✨ Pastdagi matn maydoniga yozing yoki yuqoridagi kartani tanlang
                </motion.p>
              </motion.div>
            </div>
          ) : (
            // MESSAGES
            <div className="max-w-[850px] mx-auto px-4 py-8 space-y-6">
              <AnimatePresence initial={false}>
                {messages.map((m, i) => {
                  let parsedContent = m.content;
                  if (typeof m.content === 'string' && m.content.startsWith('[')) {
                    try { parsedContent = JSON.parse(m.content); } catch { }
                  }
                  const textContent = Array.isArray(parsedContent)
                    ? parsedContent.find((p: any) => p.type === 'text')?.text || ""
                    : parsedContent as string;
                  const imgContent = Array.isArray(parsedContent)
                    ? parsedContent.find((p: any) => p.type === 'image_url')?.image_url?.url
                    : null;
                  const isLast = i === messages.length - 1;

                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {m.role === "user" ? (
                        // User message
                        <div className="flex flex-col min-w-0 max-w-[85%]">
                          <div className="px-5 py-4 bg-slate-900 dark:bg-[#1A1D21] rounded-2xl rounded-tr-md text-[14.5px] leading-relaxed text-white">
                            {imgContent && (
                              <img src={imgContent} className="max-w-[220px] rounded-xl mb-3" alt="Uploaded" />
                            )}
                            <span className="whitespace-pre-wrap">{textContent}</span>
                          </div>
                        </div>
                      ) : (
                        // AI message
                        <div className="max-w-[88%] flex gap-3 items-start group">
                          {/* Avatar */}
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FF4D4F] to-[#ff7875] flex items-center justify-center shrink-0 mt-0.5 shadow-red-100 overflow-hidden p-1">
                            <img src="/logo.png" className="w-full h-full object-contain filter brightness-0 invert" alt="EduLy" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="px-5 py-4 bg-white dark:bg-white/5 rounded-2xl rounded-tl-md border border-slate-100 dark:border-white/5 text-[14px] leading-relaxed text-slate-800 dark:text-slate-100">
                              <div className="prose prose-slate dark:prose-invert max-w-none prose-p:my-2 prose-headings:font-semibold prose-code:text-sm">
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm, remarkMath]}
                                  rehypePlugins={[rehypeKatex]}
                                  components={{
                                    code({ node, inline, className, children, ...props }: any) {
                                      if (inline) return (
                                        <code className="px-1.5 py-0.5 bg-slate-100 text-[#FF4D4F] rounded-md text-[13px] font-mono" {...props}>{children}</code>
                                      );
                                      return <CodeBlock className={className}>{children}</CodeBlock>;
                                    },
                                    table: ({ children }) => (
                                      <div className="my-4 overflow-x-auto rounded-xl border border-slate-200">
                                        <table className="w-full border-collapse text-sm">{children}</table>
                                      </div>
                                    ),
                                    thead: ({ children }) => <thead className="bg-slate-50 border-b border-slate-200">{children}</thead>,
                                    th: ({ children }) => <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{children}</th>,
                                    td: ({ children }) => <td className="px-4 py-3 border-b border-slate-100 text-slate-700 text-sm">{children}</td>,
                                    tr: ({ children }) => <tr className="hover:bg-slate-50 transition-colors">{children}</tr>,
                                    blockquote: ({ children }) => (
                                      <div className="my-3 pl-4 border-l-4 border-[#FF4D4F]/30 text-slate-600 italic bg-orange-50/50 rounded-r-xl py-2 pr-3">{children}</div>
                                    ),
                                    h1: ({ children }) => <h1 className="text-xl font-bold text-slate-900 mt-5 mb-2">{children}</h1>,
                                    h2: ({ children }) => <h2 className="text-lg font-semibold text-slate-800 mt-4 mb-2">{children}</h2>,
                                    h3: ({ children }) => <h3 className="text-base font-semibold text-slate-800 mt-3 mb-1.5">{children}</h3>,
                                    ul: ({ children }) => <ul className="space-y-1 my-2 list-none pl-0">{children}</ul>,
                                    li: ({ children }) => (
                                      <li className="flex items-start gap-2 text-slate-700">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF4D4F]/60 mt-2 shrink-0" />
                                        <span>{children}</span>
                                      </li>
                                    ),
                                    strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
                                  }}
                                >
                                  {normalizeMath(textContent)}
                                </ReactMarkdown>
                              </div>
                            </div>
                            <MessageActions
                              content={textContent}
                              onRegenerate={isLast ? () => {
                                const lastUser = [...messages].reverse().find(m => m.role === "user");
                                if (lastUser) {
                                  setMessages(prev => prev.slice(0, -1));
                                  handleSend(typeof lastUser.content === 'string' ? lastUser.content : "");
                                }
                              } : undefined}
                              isLast={isLast}
                            />
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Loading indicator */}
              {isLoading && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FF4D4F] to-[#ff7875] flex items-center justify-center shrink-0 shadow-red-100 overflow-hidden p-1">
                    <img src="/logo.png" className="w-full h-full object-contain filter brightness-0 invert animate-pulse" alt="EduLy" />
                  </div>
                  <div className="px-5 py-4 bg-white rounded-2xl rounded-tl-md border border-slate-100">
                    <div className="flex gap-1.5 items-center">
                      {[0, 0.18, 0.36].map((d, idx) => (
                        <div
                          key={idx}
                          className="w-2 h-2 rounded-full bg-[#FF4D4F]/60 animate-bounce"
                          style={{ animationDelay: `${d}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* INPUT AREA */}
        <div className="px-4 pb-5 pt-2 bg-gradient-to-t from-[#F8FAFC] dark:from-[#0B0F1A] to-transparent">
          <div className="max-w-[850px] mx-auto">
            {/* Image preview */}
            <AnimatePresence>
              {selectedImage && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  className="mb-3 inline-flex items-center gap-2 p-2 bg-white rounded-2xl border border-slate-100"
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden">
                    <img src={selectedImage} className="w-full h-full object-cover" alt="Preview" />
                  </div>
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center hover:bg-rose-500 transition-colors"
                  >
                    <CloseCircleIcon className="w-3 h-3" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>


            {/* Input box */}
            <div className="bg-white dark:bg-[#1A1D21] rounded-2xl shadow-slate-200/60 dark:shadow-none border border-slate-200/80 dark:border-white/5 focus-within:border-[#FF4D4F]/30 focus-within:shadow-[0_0_0_4px_rgba(255,77,79,0.06),0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-300">
              <div className="flex items-end gap-2 px-4 pt-3.5 pb-3">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Savolingizni yozing... (Shift+Enter — yangi qator)"
                  rows={1}
                  className="flex-1 bg-transparent text-[14.5px] text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none resize-none py-0.5 leading-relaxed min-h-[28px] max-h-[160px] overflow-y-auto custom-scrollbar font-normal"
                />
                <div className="flex items-center gap-1.5 shrink-0 pb-0.5">
                  {input.length > 0 && (
                    <span className="text-[11px] text-slate-400 tabular-nums mr-1">{input.length}</span>
                  )}
                  <button
                    onClick={() => handleSend()}
                    disabled={isLoading || (!input.trim() && !selectedImage)}
                    className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200 ${isLoading || (!input.trim() && !selectedImage)
                      ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                      : "bg-[#E8192C] text-white shadow-red-200 hover:shadow-lg hover:scale-105 active:scale-95"
                      }`}
                  >
                    {isLoading
                      ? <RefreshCircleIcon className="w-4 h-4 animate-spin" />
                      : <SendIcon size={18} />
                    }
                  </button>
                </div>
              </div>

              {/* Bottom toolbar */}
              <div className="flex items-center gap-1 px-3 pb-2.5 border-t border-slate-50 pt-2">
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-400 hover:text-[#E8192C] hover:bg-red-50 rounded-lg transition-all text-xs font-medium"
                  title="Rasm yuklash"
                >
                  <GalleryIcon size={16} />
                  <span className="hidden sm:inline">Rasm</span>
                </button>
                <button
                  onClick={() => pdfInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-400 hover:text-[#6366F1] hover:bg-violet-50 rounded-lg transition-all text-xs font-medium"
                  title="PDF yuklash"
                >
                  <DocumentTextIcon size={16} />
                  <span className="hidden sm:inline">PDF</span>
                </button>
                <button
                  onClick={() => toast.info("Ovozli kiritish tez orada!")}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all text-xs font-medium"
                  title="Ovozli kiritish"
                >
                  <MicrophoneIcon size={16} />
                  <span className="hidden sm:inline">Ovoz</span>
                </button>
                <div className="flex-1" />
                <span className="text-[11px] text-slate-300">Enter — yuborish</span>
              </div>
            </div>

            <p className="text-center text-[11px] text-slate-400 mt-2">
              EduLy AI xato qilishi mumkin. Muhim ma'lumotlarni tekshiring.
            </p>
          </div>
        </div>
      </main>

      {/* RIGHT INSIGHTS PANEL */}


      <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />
      <input type="file" ref={pdfInputRef} className="hidden" accept=".pdf" onChange={() => toast.info("PDF tahlili tez orada!")} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.08); border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.14); }
        .prose p { margin-top: 0.5em; margin-bottom: 0.5em; }
        .prose ul, .prose ol { margin-top: 0.5em; margin-bottom: 0.5em; }
      `}</style>
    </div>
  );
};

export default AiChat;

