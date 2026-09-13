import React from 'react';
import { Zap } from 'lucide-react';

export default function MockTestsSection() {
  return (
    <div className="p-8 border-2 border-dashed border-orange-500/20 rounded-2xl bg-orange-50/50 dark:bg-orange-500/5 flex flex-col items-center justify-center text-center">
      <Zap className="w-12 h-12 text-orange-500 mb-4" />
      <h3 className="text-lg font-bold text-orange-700 dark:text-orange-400">Mock Tests</h3>
      <p className="text-sm text-orange-600/70 dark:text-orange-400/60 max-w-xs">
        Full-length practice tests to simulate test day. (Placeholder)
      </p>
    </div>
  );
}
