import React from 'react';
import { Gamepad2, X } from 'lucide-react';

export default function QuestionChallengeTrainer({ questions, title, onClose }: any) {
  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Gamepad2 className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold">{title} Challenge</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-12 text-center">
          <p className="text-slate-500 mb-6">Challenge Mode Trainer is coming soon!</p>
          <button onClick={onClose} className="px-8 py-3 bg-primary text-white rounded-xl font-bold">Close</button>
        </div>
      </div>
    </div>
  );
}
