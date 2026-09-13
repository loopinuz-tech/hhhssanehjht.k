import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import VocabRunnerGame from '@/components/student/VocabRunnerGame';
import { supabase } from '@/integrations/studentSupabase';
import { useStudentAuth } from '@/hooks/useStudentAuth';

const DEFAULT_FALLBACK_WORDS = [
  { id: '1', word: 'abandon', meaning: 'tark etmoq, voz kechmoq', memory_trick: 'A band on - guruhni tark etish' },
  { id: '2', word: 'ability', meaning: 'qobiliyat, iqtidor', memory_trick: 'A bill to see - bilimi bor o\'quvchi' },
  { id: '3', word: 'abundant', meaning: 'mo\'l-ko\'l, serob', memory_trick: 'A bun in dance - serob taomlar' },
  { id: '4', word: 'accumulate', meaning: 'to\'plamoq, yig\'moq', memory_trick: 'Accumulate points - ball to\'plash' },
  { id: '5', word: 'achieve', meaning: 'erishmoq, qo\'lga kiritmoq', memory_trick: 'Achieve goals - maqsadga erishish' },
  { id: '6', word: 'acquire', meaning: 'egallamoq, sotib olmoq', memory_trick: 'Acquire knowledge - bilim egallash' },
  { id: '7', word: 'adapt', meaning: 'moslashmoq', memory_trick: 'Adapt to climate - moslashish' },
  { id: '8', word: 'adequate', meaning: 'yetarli, mos', memory_trick: 'Adequate level - yetarli daraja' },
  { id: '9', word: 'advocate', meaning: 'himoya qilmoq, qo\'llamoq', memory_trick: 'Advocate rights - huquqlarni himoyalash' },
  { id: '10', word: 'affect', meaning: 'ta\'sir qilmoq', memory_trick: 'Affect health - ta\'sir ko\'rsatish' }
];

export default function VocabRunnerPage() {
  const navigate = useNavigate();
  const { user } = useStudentAuth();
  const [words, setWords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWords() {
      try {
        if (user) {
          const { data } = await supabase
            .from('vocabulary')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (data && data.length > 0) {
            setWords(data);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error('Error fetching vocabulary for runner:', err);
      }
      // Fallback if user has no words saved yet
      setWords(DEFAULT_FALLBACK_WORDS);
      setLoading(false);
    }

    loadWords();
  }, [user]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center text-white font-sans">
        <div className="w-14 h-14 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-black uppercase tracking-wider">3D Vocab Runner Yuklanmoqda...</h2>
        <p className="text-xs text-slate-400 mt-1">So'zlaringiz o'yinga tayyorlanmoqda</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 w-screen h-screen bg-slate-950 overflow-hidden">
      <VocabRunnerGame 
        words={words} 
        onBack={() => navigate('/lugat')} 
      />
    </div>
  );
}
