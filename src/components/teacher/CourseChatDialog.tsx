import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, UserCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { rewriteStorageUrl } from "@/lib/storage";
import { useChatRealtime } from "@/hooks/useChatRealtime";

export default function CourseChatDialog({ enrollment, onClose }: { enrollment: any, onClose: () => void }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Fetch or create chat session
  const { data: chatSession, isLoading: sessionLoading } = useQuery({
    queryKey: ['course-chat', enrollment?.course_id, enrollment?.user_id],
    queryFn: async () => {
      if (!enrollment || !user) return null;
      // Check if chat exists
      const { data: existing } = await (supabase as any)
        .from('course_chats')
        .select('*')
        .eq('course_id', enrollment.course_id)
        .eq('student_id', enrollment.user_id)
        .eq('teacher_id', user.id)
        .maybeSingle();

      if (existing) return existing;

      // Start new chat session
      const { data: newSession, error } = await (supabase as any)
        .from('course_chats')
        .insert({
          course_id: enrollment.course_id,
          student_id: enrollment.user_id,
          teacher_id: user.id
        })
        .select('*')
        .single();
      
      if (error) throw error;
      return newSession;
    },
    enabled: !!enrollment && !!user,
  });

  const sessionObj = chatSession as any;

  // Fetch messages
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['course-messages', sessionObj?.id],
    queryFn: async () => {
      if (!sessionObj?.id) return [];
      const { data } = await (supabase as any)
        .from('course_messages')
        .select('*')
        .eq('chat_id', sessionObj.id)
        .order('created_at', { ascending: true });
      return data || [];
    },
    enabled: !!sessionObj?.id,
  });

  // Realtime subscription via unified useChatRealtime hook
  useChatRealtime({ chatId: sessionObj?.id });

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: async (text: string) => {
      if (!sessionObj?.id || !user) throw new Error("No chat session");
      await (supabase as any).from('course_messages').insert({
        chat_id: sessionObj.id,
        sender_id: user.id,
        message: text
      });
      // Optionally update last_message on chat
      await (supabase as any).from('course_chats').update({ last_message: text }).eq('id', sessionObj.id);
    },
    onSuccess: () => setMessage(''),
  });

  const handleSend = () => {
    if (message.trim()) {
      sendMutation.mutate(message.trim());
    }
  };

  return (
    <Dialog open={!!enrollment} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 rounded-3xl">
        <DialogHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <DialogTitle className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                {enrollment?.profiles?.avatar_url ? (
                   <img src={rewriteStorageUrl(enrollment.profiles.avatar_url)} className="w-full h-full object-cover" alt="" />
                ) : (
                   <UserCircle2 className="w-6 h-6 text-slate-400" />
                )}
             </div>
             <div>
               <p className="text-sm font-bold text-slate-800 dark:text-white">
                 {enrollment?.profiles?.full_name || "O'quvchi"}
               </p>
               <p className="text-[10px] text-slate-400 truncate max-w-[200px]">
                 {enrollment?.courses?.title}
               </p>
             </div>
          </DialogTitle>
          <DialogDescription className="sr-only">Chat dialog for course communication</DialogDescription>
        </DialogHeader>

        <div className="h-[400px] flex flex-col bg-slate-50 dark:bg-[#0b1121]">
           <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {sessionLoading || messagesLoading ? (
                 <div className="flex h-full items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
                 </div>
              ) : messages.length === 0 ? (
                 <div className="flex h-full flex-col items-center justify-center text-slate-400">
                    <p className="text-sm">Xabarlar yo'q</p>
                    <p className="text-[10px]">Suhbatni boshlang!</p>
                 </div>
              ) : (
                 messages.map((msg: any) => {
                   const isOwn = msg.sender_id === user?.id;
                   return (
                     <div key={msg.id} className={`flex max-w-[80%] ${isOwn ? 'ml-auto justify-end' : 'mr-auto justify-start'}`}>
                        <div className={`p-3 rounded-2xl text-[13px] ${
                           isOwn 
                           ? 'bg-emerald-500 text-white rounded-br-sm' 
                           : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-bl-sm border border-slate-100 dark:border-slate-700 shadow-sm'
                        }`}>
                           {msg.message}
                           <span className={`block text-[9px] mt-1 text-right ${isOwn ? 'text-emerald-100' : 'text-slate-400'}`}>
                             {new Date(msg.created_at).toLocaleTimeString('uz', { hour: '2-digit', minute: '2-digit' })}
                           </span>
                        </div>
                     </div>
                   );
                 })
              )}
              <div ref={bottomRef} />
           </div>

           <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <input 
                type="text" 
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Xabar yozing..."
                className="flex-1 h-10 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 ring-emerald-500/20 outline-none text-sm transition-all"
              />
              <button 
                onClick={handleSend}
                disabled={!message.trim() || sendMutation.isPending}
                className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl shadow-md transition-all active:scale-95"
              >
                 <Send className="w-4 h-4" />
              </button>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
