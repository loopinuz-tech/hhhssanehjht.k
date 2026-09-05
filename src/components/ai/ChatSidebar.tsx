import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MessageSquare, Trash2, ChevronLeft, User, Settings } from 'lucide-react';

interface ChatSidebarProps {
  chats: any[];
  activeChatId: string | null;
  showSidebar: boolean;
  setShowSidebar: (show: boolean) => void;
  startNewChat: () => void;
  selectChat: (id: string) => void;
  deleteChat: (id: string, e: React.MouseEvent) => void;
  profile: any;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ 
  chats, activeChatId, showSidebar, setShowSidebar, startNewChat, selectChat, deleteChat, profile 
}) => {
  return (
    <AnimatePresence mode="wait">
      {showSidebar && (
        <motion.aside 
          initial={{ width: 0, opacity: 0, x: -50 }}
          animate={{ width: 300, opacity: 1, x: 0 }}
          exit={{ width: 0, opacity: 0, x: -50 }}
          transition={{ duration: 0.4, ease: "circOut" }}
          className="hidden lg:flex flex-col bg-white dark:bg-slate-950 border-r border-slate-100 dark:border-slate-800/50 z-30 h-full overflow-hidden"
        >
           <div className="p-6">
              <button 
                onClick={startNewChat}
                className="w-full flex items-center justify-center gap-3 px-4 py-4 bg-slate-900 border border-slate-800 text-white rounded-2xl text-[14px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-[0.98] shadow-xl shadow-slate-200 dark:shadow-none"
              >
                 <Plus className="w-4 h-4" /> Yangi suhbat
              </button>
           </div>

           <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-8 custom-scrollbar">
              <div className="space-y-4">
                 <div className="flex items-center justify-between px-2">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none">Tarix</span>
                    <button onClick={() => setShowSidebar(false)} className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl text-slate-400 transition-all">
                       <ChevronLeft className="w-4 h-4" />
                    </button>
                 </div>
                 
                 <div className="space-y-1">
                    {chats.length === 0 && (
                      <div className="px-4 py-12 text-center border-2 border-dashed border-slate-50 dark:border-slate-800/50 rounded-[32px] bg-slate-50/30 dark:bg-slate-900/10">
                         <p className="text-[11px] text-slate-300 dark:text-slate-600 font-black uppercase tracking-widest leading-relaxed">Hozircha tarix yo'q</p>
                      </div>
                    )}
                    {chats.map((chat, i) => (
                      <motion.button 
                        key={chat.id} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => selectChat(chat.id)}
                        className={`flex items-center justify-between group w-full px-5 py-4 rounded-2xl transition-all ${
                            activeChatId === chat.id 
                            ? "bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border border-slate-100 dark:border-slate-800" 
                            : "hover:bg-slate-50/50 dark:hover:bg-slate-900/50 text-slate-500 dark:text-slate-400"
                        }`}
                      >
                         <div className="flex items-center gap-3 overflow-hidden">
                            <div className={`w-2 h-2 rounded-full transition-all ${activeChatId === chat.id ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "bg-slate-200 dark:bg-slate-800"}`} />
                            <span className={`text-[13.5px] font-bold truncate ${activeChatId === chat.id ? "text-slate-900 dark:text-white" : ""}`}>{chat.title}</span>
                         </div>
                         <button 
                           onClick={(e) => deleteChat(chat.id, e)}
                           className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-300 hover:text-rose-500 rounded-lg transition-all"
                         >
                            <Trash2 className="w-3.5 h-3.5" />
                         </button>
                      </motion.button>
                    ))}
                 </div>
              </div>
           </div>

           <div className="p-6 mt-auto border-t border-slate-50 dark:border-slate-800/50">
              <div className="flex items-center gap-4 px-2 py-2 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-800">
                 <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0 shadow-sm relative">
                    <User className="w-5 h-5 text-slate-400" />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 shadow-sm" />
                 </div>
                 <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-black text-slate-900 dark:text-white truncate leading-none mb-1">{profile?.full_name?.split(' ')[0] || "User"}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Premium Plan</p>
                 </div>
                 <button className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl shadow-sm transition-all text-slate-400">
                    <Settings className="w-4 h-4" />
                 </button>
              </div>
           </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

export default ChatSidebar;
