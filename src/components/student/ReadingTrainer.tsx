import { useState, useEffect } from "react";
import { BookOpen, X, ArrowRight } from "lucide-react";

export default function ReadingTrainer({ onClose }: any) {
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("reading_trainer_text") || "";
    setText(stored);
  }, []);

  const saveText = () => {
    localStorage.setItem("reading_trainer_text", text);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#E8192C]" />
            <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white">Matn o'qish</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-500">
            Matnni kiriting va o'qishni boshlang. So'zlarni belgilab lug'atdan qidirishingiz mumkin.
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Matnni bu yerga joylashtiring..."
            rows={10}
            className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-4 text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:border-[#E8192C] focus:outline-none transition-colors placeholder:text-slate-400 resize-none"
          />
          <div className="flex items-center gap-2">
            <button onClick={saveText}
              className="px-5 py-2.5 rounded-xl bg-[#E8192C] text-white text-sm font-medium hover:opacity-90 transition-opacity">
              {saved ? "Saqlangan!" : "Saqlash"}
            </button>
            <button onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              Yopish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
