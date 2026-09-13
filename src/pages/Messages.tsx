import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { MessageSquare, Search, Send, UserCircle2, Loader2, ArrowLeft, Image as ImageIcon, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { rewriteStorageUrl, getStoragePublicUrl } from "@/lib/storage";
import { useChatRealtime } from "@/hooks/useChatRealtime";

export default function Messages() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const targetUser = searchParams.get('user');
  const targetCourse = searchParams.get('course');
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ file: File, preview: string } | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Request notification permissions
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Set up Presence for Online Status (Strictly scoped to Messages component lifecycle)
  useEffect(() => {
    if (!user) return;
    const presenceChannel = supabase.channel('global-presence', {
      config: { presence: { key: user.id } }
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        setOnlineUsers(Object.keys(state));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      presenceChannel.untrack().catch(() => {});
      supabase.removeChannel(presenceChannel);
    };
  }, [user]);

  // 1. Load chat list
  const { data: chats, isLoading: chatsLoading } = useQuery({
    queryKey: ['my-course-chats', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('course_chats')
        .select(`
          *,
          courses(title),
          teacher:teacher_id(full_name, avatar_url),
          student:student_id(full_name, avatar_url)
        `)
        .or(`teacher_id.eq.${user.id},student_id.eq.${user.id}`)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error("Chats error:", error);
        return [];
      }
      return data || [];
    },
    enabled: !!user,
  });

  // Auto-select chat if URL has ?user= target
  useEffect(() => {
    if (chats && targetUser && !selectedChat && user) {
      // Look for a chat where the OTHER person is targetUser AND course_id matches (if provided)
      const match = chats.find((c: any) =>
        (c.teacher_id === targetUser || c.student_id === targetUser) &&
        (!targetCourse || c.course_id === targetCourse)
      );

      if (match) {
        setSelectedChat(match);
      }
      else if (targetCourse) {
        // Determine if current user is teacher for this course
        (supabase as any).from('courses').select('teacher_id, title').eq('id', targetCourse).single().then(({ data: courseData }: any) => {
          const currentUserIsTeacher = courseData?.teacher_id === user.id;

          setSelectedChat({
            isNew: true,
            student_id: currentUserIsTeacher ? targetUser : user.id,
            teacher_id: currentUserIsTeacher ? user.id : targetUser,
            course_id: targetCourse,
            courses: { title: courseData?.title || t('messages.loading') },
            student: currentUserIsTeacher ? { full_name: t('messages.loading') } : undefined,
            teacher: !currentUserIsTeacher ? { full_name: t('messages.loading') } : undefined
          });

          // Proactively fetch target user's profile
          (supabase as any).from('profiles').select('full_name, avatar_url').eq('user_id', targetUser).single().then(({ data }: any) => {
            if (data) setSelectedChat((prev: any) => ({ ...prev, [currentUserIsTeacher ? 'student' : 'teacher']: data }));
          });
        });
      }
    }
  }, [chats, targetUser, targetCourse, selectedChat, user, t]);

  // Load chat messages
  const { data: messages = [], isLoading: msgsLoading } = useQuery({
    queryKey: ['course-messages', selectedChat?.id],
    queryFn: async () => {
      if (!selectedChat?.id) return [];
      const { data } = await (supabase as any)
        .from('course_messages')
        .select('*')
        .eq('chat_id', selectedChat.id)
        .order('created_at', { ascending: true });
      return data || [];
    },
    enabled: !!selectedChat?.id,
  });

  // Realtime subscription via unified useChatRealtime hook
  useChatRealtime({
    chatId: selectedChat?.id,
    onNewMessage: (payload) => {
      queryClient.invalidateQueries({ queryKey: ['my-course-chats', user?.id] });
      const newMsg = payload.new as any;
      if (newMsg?.sender_id !== user?.id) {
        if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
          new Notification(t('messages.new_message_notif'), { body: newMsg.message, icon: '/logo.png' });
        }
      }
    }
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: async ({ text, file }: { text: string; file?: File }) => {
      if (!user) return;
      let targetChatId = selectedChat?.id;

      // Ensure session exists
      if (!targetChatId && selectedChat?.isNew) {
        const { data: newSession, error: createError } = await (supabase as any).from('course_chats').insert({
          course_id: selectedChat.course_id,
          student_id: selectedChat.student_id,
          teacher_id: selectedChat.teacher_id,
          last_message: text
        }).select('*').single();

        if (createError) {
          console.error("Session build failed:", createError);
          toast({ title: t('messages.toast_error_session'), description: createError.message, variant: "destructive" });
          throw createError;
        }

        if (newSession) {
          targetChatId = (newSession as any).id;
          setSelectedChat(newSession);
        }
      }

      if (!targetChatId) return;

      let uploadedFileUrl = null;
      let uploadedFileType = null;

      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage.from('course_files').upload(`chat_images/${fileName}`, file);
        if (uploadError) {
          console.error("Upload fail:", uploadError);
          toast({ title: t('messages.toast_error_upload'), description: uploadError.message, variant: "destructive" });
          throw uploadError;
        }
        uploadedFileType = 'image';
        uploadedFileUrl = getStoragePublicUrl('course_files', `chat_images/${fileName}`);
      }

      const { error: msgError } = await (supabase as any).from('course_messages').insert({
        chat_id: targetChatId,
        sender_id: user.id,
        message: text,
        file_url: uploadedFileUrl,
        file_type: uploadedFileType
      });

      if (msgError) {
        console.error("Message send failed:", msgError);
        toast({ title: t('messages.toast_error_send'), description: msgError.message, variant: "destructive" });
        throw msgError;
      }

      await (supabase as any).from('course_chats').update({
        last_message: text,
        updated_at: new Date().toISOString()
      }).eq('id', targetChatId);

    },
    onSuccess: () => {
      setMessage('');
      setSelectedImage(null);
      setUploadingImage(false);
      queryClient.invalidateQueries({ queryKey: ['my-course-chats', user?.id] });
    },
    onError: () => setUploadingImage(false)
  });

  const handleBack = () => {
    setSelectedChat(null);
    setSearchParams({});
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage({
        file,
        preview: URL.createObjectURL(file)
      });
    }
  };

  const handleSend = () => {
    if (!message.trim() && !selectedImage) return;
    if (selectedImage) setUploadingImage(true);
    sendMutation.mutate({ text: message, file: selectedImage?.file });
  };

  const getPartner = (chat: any) => {
    if (!chat || !user) return { full_name: t('messages.partner_default') };
    if (chat.teacher_id === user.id) return chat.student || { full_name: t('messages.partner_student') };
    return chat.teacher || { full_name: t('messages.partner_teacher') };
  };

  const filteredChats = chats?.filter((c: any) => {
    const p = getPartner(c);
    return p.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
  }) || [];

  return (
    <div className="flex bg-slate-50 dark:bg-[#0b1121] h-[calc(100vh-64px)] overflow-hidden">
      {/* Sidebar List */}
      <div className={`w-full md:w-80 lg:w-[350px] flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 flex flex-col ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">{t('messages.sidebar_title')}</h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t('messages.search_ph')}
              className="pl-9 bg-slate-50 dark:bg-slate-800 border-transparent focus:border-emerald-500 rounded-xl"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {chatsLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center mt-10">
              <div className="w-14 h-14 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-3">
                <MessageSquare className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm text-slate-400 font-medium">{t('messages.no_chats')}</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filteredChats.map((chat: any) => {
                const partner = getPartner(chat);
                const isActive = selectedChat?.id === chat.id;
                return (
                  <button
                    key={chat.id}
                    onClick={() => setSelectedChat(chat)}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all relative ${isActive
                      ? 'bg-emerald-50 dark:bg-emerald-500/10'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                  >
                    <div className="relative w-12 h-12 rounded-full overflow-visible flex-shrink-0 bg-slate-200 dark:bg-slate-800">
                      {partner.avatar_url ? (
                        <img src={rewriteStorageUrl(partner.avatar_url)} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <div className="w-full h-full rounded-full flex items-center justify-center font-bold text-slate-400">
                          {partner.full_name?.[0] || "?"}
                        </div>
                      )}
                      {onlineUsers.includes(partner.user_id) && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex justify-between items-Baseline">
                        <p className="text-[13px] font-bold text-slate-800 dark:text-white truncate pr-2">
                          {partner.full_name}
                        </p>
                      </div>
                      <p className={`text-[11px] truncate mt-0.5 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                        {chat.last_message || t('messages.last_msg_new')}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col min-w-0 bg-slate-50/50 dark:bg-[#0b1121] ${!selectedChat ? 'hidden md:flex' : 'flex'}`}>
        {!selectedChat ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full">
            <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{t('messages.empty_state_title')}</h3>
            <p className="text-sm text-slate-400 max-w-sm">
              {t('messages.empty_state_desc')}
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="h-[73px] lg:h-[81px] border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 md:px-6 flex items-center gap-4 flex-shrink-0 z-10 w-full shadow-sm md:shadow-none relative">
              <button onClick={handleBack} className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-800 flex-shrink-0">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="relative w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex flex-shrink-0 items-center justify-center overflow-visible">
                {getPartner(selectedChat)?.avatar_url ? (
                  <img src={rewriteStorageUrl(getPartner(selectedChat).avatar_url)} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <UserCircle2 className="w-6 h-6 text-slate-400" />
                )}
                {onlineUsers.includes(getPartner(selectedChat)?.user_id) && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                    {getPartner(selectedChat)?.full_name || t('messages.partner_default')}
                  </p>
                  {onlineUsers.includes(getPartner(selectedChat)?.user_id) && (
                    <span className="text-[9px] font-black uppercase text-emerald-500">{t('messages.online_status')}</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  {selectedChat.courses?.title || t('messages.course_default')}
                </p>
              </div>
            </div>

            {/* Messages Area */}
            <div
              className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 relative"
              style={{
                backgroundImage: "url('/testbg5.png')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundAttachment: 'local',
              }}
            >

              {msgsLoading ? (
                <div className="flex justify-center mt-10">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
                </div>
              ) : messages.map((msg: any) => {
                const isOwn = msg.sender_id === user?.id;
                return (
                  <div key={msg.id} className={`flex w-full ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] md:max-w-[60%] p-3 px-4 rounded-2xl text-[13.5px] leading-relaxed shadow-sm ${isOwn
                      ? 'bg-emerald-500 text-white rounded-br-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-bl-sm'
                      }`}>
                      {msg.file_url && msg.file_type === 'image' && (
                        <img src={rewriteStorageUrl(msg.file_url)} alt="Xabar rasmi" className="w-full max-w-[240px] rounded-xl mb-2 object-cover" />
                      )}
                      {msg.message}
                      <div className={`text-[10px] mt-1.5 flex items-center ${isOwn ? 'text-emerald-100 justify-end' : 'text-slate-400 justify-start'}`}>
                        {new Date(msg.created_at).toLocaleTimeString(i18n.language === 'en' ? 'en-US' : 'uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} className="pt-2" />
            </div>

            {/* Input Bottom */}
            <div className="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex-shrink-0 relative">
              {/* Image Preview Container */}
              {selectedImage && (
                <div className="absolute bottom-full left-0 right-0 p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                    <img src={selectedImage.preview} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-800 dark:text-white">{t('messages.upload_title')}</p>
                    <p className="text-[10px] text-slate-500">{selectedImage.file.name}</p>
                  </div>
                  <button onClick={() => setSelectedImage(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 text-slate-500 hover:text-rose-500 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className="p-4 flex items-end gap-2">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="h-12 w-12 flex-shrink-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-xl transition-all"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
                <Input
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder={selectedImage ? t('messages.input_ph_image') : t('messages.input_ph_text')}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 border-transparent focus:border-emerald-500 focus:ring-2 ring-emerald-500/20 text-sm h-12 rounded-xl px-4"
                />
                <button
                  onClick={handleSend}
                  disabled={(!message.trim() && !selectedImage) || uploadingImage}
                  className="h-12 w-12 flex-shrink-0 flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl transition-all shadow-md active:scale-95"
                >
                  {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
