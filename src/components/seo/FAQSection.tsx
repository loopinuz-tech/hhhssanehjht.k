import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  items: FAQItem[];
  title?: string;
}

const FAQSection: React.FC<FAQSectionProps> = ({
  items,
  title = "Ko'p beriladigan savollar"
}) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!items || items.length === 0) return null;

  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4" aria-label="Ko'p beriladigan savollar">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center">
          <HelpCircle className="w-3.5 h-3.5 text-violet-500" />
        </div>
        <h2 className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{title}</h2>
      </div>

      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={index}
            className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              aria-expanded={openIndex === index}
            >
              <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300 pr-4">
                {item.question}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                  openIndex === index ? 'rotate-180' : ''
                }`}
              />
            </button>
            {openIndex === index && (
              <div className="px-4 pb-3 pt-1 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  {item.answer}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default FAQSection;
