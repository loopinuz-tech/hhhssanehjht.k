import React from 'react';
import { motion } from 'framer-motion';

interface WelcomeScreenProps {
  onSuggestionClick: (text: string) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSuggestionClick }) => {
  const suggestions = [
    { 
      text: "Matematika attestatsiya savollari", 
      icon: "calculate", 
      color: "blue",
      description: "Bilim darajasini sinash uchun testlar"
    },
    { 
      text: "Pedagogik mahorat sirlari", 
      icon: "school", 
      color: "emerald",
      description: "Zamonaviy o'qitish metodlari"
    },
    { 
      text: "Dars ishlanmasi namunasi", 
      icon: "description", 
      color: "amber",
      description: "Sifatli va tizimli dars tayyorlash" 
    },
  ];

  return (
    <div className="min-h-[80%] flex flex-col items-center justify-center max-w-4xl mx-auto space-y-16 py-12 px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center space-y-8 relative"
      >
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-48 h-48 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="flex flex-col items-center gap-8 relative z-10">
           <div className="w-20 h-20 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[28px] flex items-center justify-center shadow-2xl p-4 animate-float">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
           </div>
           
           <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[0.9]">
                 Nimalarni o'rganishni <br /> 
                 <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">xohlaysiz?</span>
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-lg md:text-xl font-medium max-w-lg mx-auto leading-relaxed">
                 Sizning shaxsiy repetitoringiz. Testlarni tahlil qilish va yangi bilimlarni egallashda yordam beradi.
              </p>
           </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        {suggestions.map((s, i) => (
          <motion.button 
            key={i}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 + 0.5, duration: 0.5 }}
            onClick={() => onSuggestionClick(s.text)}
            className="group relative bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl border border-white dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 p-8 rounded-[32px] text-left transition-all hover:shadow-2xl hover:-translate-y-2 active:scale-95"
          >
             <div className={`w-12 h-12 mb-6 rounded-2xl flex items-center justify-center shadow-sm border border-slate-50 dark:border-slate-800 ${
               s.color === "blue" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600" : 
               s.color === "emerald" ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" : 
               "bg-amber-50 dark:bg-amber-900/20 text-amber-600"
             }`}>
                <span className="material-symbols-rounded">{s.icon}</span>
             </div>
             <h3 className="text-[17px] font-black text-slate-800 dark:text-white mb-2 group-hover:text-blue-600 transition-colors">{s.text}</h3>
             <p className="text-[13px] text-slate-400 font-bold uppercase tracking-wider leading-none">
               {s.description}
             </p>
             
             {/* Decorative small sparkle */}
             <span className="material-symbols-rounded absolute top-6 right-6 text-[14px] text-slate-200 dark:text-slate-700 group-hover:text-amber-400 transition-colors">auto_awesome</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default WelcomeScreen;
