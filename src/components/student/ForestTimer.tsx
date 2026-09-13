import React from 'react';
import { TreePine } from 'lucide-react';

export default function ForestTimer() {
  return (
    <div className="p-8 border-2 border-dashed border-emerald-500/20 rounded-2xl bg-emerald-50/50 dark:bg-emerald-500/5 flex flex-col items-center justify-center text-center">
      <TreePine className="w-12 h-12 text-emerald-500 mb-4 animate-bounce" />
      <h3 className="text-lg font-bold text-emerald-700 dark:text-emerald-400">Forest Timer</h3>
      <p className="text-sm text-emerald-600/70 dark:text-emerald-400/60 max-w-xs">
        Concentrate on your study and grow your virtual forest. (Placeholder)
      </p>
    </div>
  );
}
