import React from 'react';
import { Calculator } from 'lucide-react';

export default function SATCalculator() {
  return (
    <div className="p-8 border-2 border-dashed border-blue-500/20 rounded-2xl bg-blue-50/50 dark:bg-blue-500/5 flex flex-col items-center justify-center text-center">
      <Calculator className="w-12 h-12 text-blue-500 mb-4" />
      <h3 className="text-lg font-bold text-blue-700 dark:text-blue-400">Score Calculator</h3>
      <p className="text-sm text-blue-600/70 dark:text-blue-400/60 max-w-xs">
        Estimate your SAT score based on correct answers. (Placeholder)
      </p>
    </div>
  );
}
