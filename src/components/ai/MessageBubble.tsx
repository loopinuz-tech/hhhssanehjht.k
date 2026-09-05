import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { motion } from 'framer-motion';
import { Copy, RotateCcw, User } from 'lucide-react';
import 'katex/dist/katex.min.css';
import { rewriteStorageUrl } from "@/lib/storage";

interface MessageBubbleProps {
  message: {
    role: "user" | "assistant" | "system";
    content: string | any[];
  };
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isAssistant = message.role === "assistant";

  const renderContent = () => {
    if (typeof message.content === 'string') {
      if (isAssistant) {
        return (
          <div className="prose prose-sm prose-slate max-w-none dark:prose-invert">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm, remarkMath]} 
              rehypePlugins={[rehypeKatex]}
            >
              {(typeof message.content === 'string' ? message.content : "").replace(/\\\(/g, '$').replace(/\\\)/g, '$').replace(/\\\[/g, () => '$$').replace(/\\\]/g, () => '$$')}
            </ReactMarkdown>
            <div className="mt-4 flex items-center gap-3 pt-3 border-t border-slate-50 dark:border-slate-800/50">
               <button className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 hover:text-blue-500 transition-colors uppercase tracking-widest">
                 <Copy className="w-3 h-3" /> Nusxa
               </button>
               <button className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 hover:text-blue-500 transition-colors uppercase tracking-widest">
                 <RotateCcw className="w-3 h-3" /> Qayta
               </button>
            </div>
          </div>
        );
      }
      return <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>;
    }

    if (Array.isArray(message.content)) {
      return message.content.map((item, index) => (
        <div key={index} className="space-y-4">
          {item.type === "text" && <p className="leading-relaxed">{item.text}</p>}
          {item.type === "image_url" && (
            <div className="max-w-xs rounded-2xl overflow-hidden shadow-2xl mt-3 ring-4 ring-white/10 group cursor-zoom-in">
              <img src={rewriteStorageUrl(item.image_url)} className="w-full h-auto group-hover:scale-105 transition-transform duration-500" alt="uploaded" />
            </div>
          )}
        </div>
      ));
    }

    return null;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`flex ${!isAssistant ? "justify-end" : "justify-start"} group mb-8`}
    >
      <div className={`flex gap-4 max-w-[85%] ${!isAssistant ? "flex-row-reverse" : ""}`}>
        {isAssistant ? (
          <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center flex-shrink-0 shadow-lg p-2 mt-1">
            <img src="/logo.png" className="w-full h-full object-contain" alt="AI" />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center flex-shrink-0 shadow-lg mt-1">
            <User className="w-5 h-5 text-slate-400" />
          </div>
        )}
        
        <div className={`px-6 py-4 rounded-[24px] relative overflow-hidden ${
          !isAssistant 
            ? "bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl shadow-slate-200/50 dark:shadow-none" 
            : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-800 shadow-sm"
        }`}>
          {!isAssistant && (
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none" />
          )}
          <div className="relative z-10 text-[14.5px] font-medium leading-relaxed">
            {renderContent()}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MessageBubble;
