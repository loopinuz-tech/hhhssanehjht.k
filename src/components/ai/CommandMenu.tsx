import React from 'react';
import { motion } from 'framer-motion';
import { X, CheckCircle2 } from 'lucide-react';

interface CommandMenuProps {
  tests: any[];
  purchasedIds: Set<string>;
  onSelect: (test: any) => void;
  onClose: () => void;
  search: string;
}

const CommandMenu: React.FC<CommandMenuProps> = ({ tests, purchasedIds, onSelect, onClose, search }) => {
  const filtered = tests.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="absolute bottom-full left-0 right-0 p-4 mb-4 z-40"
    >
       <div className="max-w-2xl mx-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-white dark:border-slate-800 rounded-[32px] shadow-[0_30px_100px_-20px_rgba(0,0,0,0.2)] overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
             <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Test to'plamini tanlang</span>
             <X className="w-4 h-4 text-slate-300 hover:text-slate-600 cursor-pointer transition-colors" onClick={onClose} />
          </div>
          <div className="max-h-[350px] overflow-y-auto custom-scrollbar p-2">
             {filtered.length === 0 ? (
               <div className="p-12 text-center text-slate-400 text-sm italic font-medium">Hech narsa topilmadi...</div>
             ) : (
               <div className="grid grid-cols-1 gap-1">
                 {filtered.map(test => (
                   <button 
                     key={test.id}
                     onClick={() => onSelect(test)}
                     className="flex items-center gap-5 px-5 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl transition-all group"
                   >
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm border border-slate-50 dark:border-slate-800 ${test.price === 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600'}`}>
                         {test.category === 'mavzulashtirilgan' ? '∑' : test.category === 'pedagogik' ? '🎓' : '📝'}
                      </div>
                      <div className="flex-1 min-w-0">
                         <p className="text-[15px] font-black text-slate-800 dark:text-white group-hover:text-blue-600 truncate transition-colors">{test.name}</p>
                         <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{test.category} • {test.questions_count} savol</p>
                      </div>
                      {purchasedIds.has(test.id) && (
                        <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        </div>
                      )}
                   </button>
                 ))}
               </div>
             )}
          </div>
       </div>
    </motion.div>
  );
};

export default CommandMenu;
