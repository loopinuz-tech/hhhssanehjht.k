import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

declare const Deno: {
  env: { get(key: string): string | undefined };
  serve(handler: (req: Request) => Response | Promise<Response>): void;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type DailyReport = {
  math_correct?: number;
  math_total?: number;
  english_correct?: number;
  english_total?: number;
  time_spent?: number;
};

type MistakeRow = {
  tags?: string[];
};

type VocabularyRow = {
  learned?: boolean;
  created_at: string;
  memory_level?: number;
};

type MockResultRow = {
  total_score?: number;
};

type Summary = {
  reports: number;
  totalStudyTime: number;
  avgMathScore: number;
  avgEnglishScore: number;
  mistakeCount: number;
  mistakeTags: string[];
  vocabTotal: number;
  vocabLearned: number;
  vocabThisWeek: number;
  avgMemoryLevel: string;
  mockTests: number;
  bestMock: number;
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function pct(correct: number, total: number) {
  return total > 0 ? Math.round((correct / total) * 100) : 0;
}

function buildAnalysis(summary: Summary) {
  const avg = Math.round((summary.avgMathScore + summary.avgEnglishScore) / 2);
  const grade = avg >= 85 ? 'A' : avg >= 70 ? 'B' : avg >= 55 ? 'C' : avg >= 40 ? 'D' : 'F';
  return {
    overallGrade: grade,
    summary: `Haftalik ortacha natija ${avg}%. ${summary.reports} kunlik hisobot va ${summary.mistakeCount} ta xato asosida tahlil qilindi.`,
    strengths: [
      summary.vocabThisWeek > 0 ? 'Lugat ustida ishlash davom etmoqda.' : 'Platformada faoliyat boshlanishi qayd etildi.',
      summary.reports >= 3 ? 'Kunlik kuzatuv odati shakllanyapti.' : 'Natijalarni kuzatish uchun asosiy joylar tayyor.',
    ],
    weaknesses: [
      summary.mistakeCount > 0 ? 'Xatolarni qayta ishlash kerak.' : 'Xato bazasi hali yetarli emas.',
      summary.avgMathScore < 70 ? 'Matematika boyicha barqarorlikni oshirish kerak.' : 'Ingliz tili va matematika balansini saqlash kerak.',
    ],
    recommendations: [
      'Har kuni kamida bitta qisqa hisobot kiriting.',
      'Eng kop takrorlangan xato mavzularidan 10-15 ta savol yeching.',
      'Yangi sozlarni 24 soatdan keyin qayta takrorlang.',
    ],
    mathAdvice: summary.avgMathScore >= 70 ? 'Matematika natijasi yaxshi, endi tezlik va aniqlikka etibor bering.' : 'Asosiy formulalar va xato mavzularni alohida royxat qilib takrorlang.',
    englishAdvice: summary.avgEnglishScore >= 70 ? 'English natijasi yaxshi, murakkab matnlar bilan ishlashni kopaytiring.' : 'Reading va grammar savollarida xato sabablarini alohida yozib boring.',
    vocabAdvice: `${summary.vocabTotal} ta sozdan ${summary.vocabLearned} tasi organilgan.`,
    motivationalMessage: 'Kichik, muntazam takrorlash katta sakrash beradi.',
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!supabaseUrl || !anonKey) return json({ error: 'Supabase env sozlanmagan' }, 500);

    const authHeader = req.headers.get('Authorization') || '';
    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) return json({ error: 'Auth talab qilinadi' }, 401);

    const userId = userData.user.id;
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [{ data: reports }, { data: mistakes }, { data: vocab }, { data: mockResults }] = await Promise.all([
      supabase.from('daily_reports').select('*').eq('user_id', userId).gte('date', since.slice(0, 10)),
      supabase.from('mistakes').select('*').eq('user_id', userId).gte('created_at', since),
      supabase.from('vocabulary').select('*').eq('user_id', userId),
      supabase.from('mock_test_results').select('*').eq('user_id', userId).gte('created_at', since),
    ]);

    const reportRows = (reports || []) as DailyReport[];
    const mistakeRows = (mistakes || []) as MistakeRow[];
    const vocabRows = (vocab || []) as VocabularyRow[];
    const mockRows = (mockResults || []) as MockResultRow[];
    const mathCorrect = reportRows.reduce((sum, r) => sum + Number(r.math_correct || 0), 0);
    const mathTotal = reportRows.reduce((sum, r) => sum + Number(r.math_total || 0), 0);
    const englishCorrect = reportRows.reduce((sum, r) => sum + Number(r.english_correct || 0), 0);
    const englishTotal = reportRows.reduce((sum, r) => sum + Number(r.english_total || 0), 0);

    const summary: Summary = {
      reports: reportRows.length,
      totalStudyTime: reportRows.reduce((sum, r) => sum + Number(r.time_spent || 0), 0),
      avgMathScore: pct(mathCorrect, mathTotal),
      avgEnglishScore: pct(englishCorrect, englishTotal),
      mistakeCount: mistakeRows.length,
      mistakeTags: [...new Set(mistakeRows.flatMap((m) => m.tags || []))],
      vocabTotal: vocabRows.length,
      vocabLearned: vocabRows.filter((w) => w.learned).length,
      vocabThisWeek: vocabRows.filter((w) => new Date(w.created_at) >= new Date(since)).length,
      avgMemoryLevel: vocabRows.length ? (vocabRows.reduce((sum, w) => sum + Number(w.memory_level || 0), 0) / vocabRows.length).toFixed(1) : '0',
      mockTests: mockRows.length,
      bestMock: Math.max(0, ...mockRows.map((r) => Number(r.total_score || 0))),
    };

    return json({ summary, analysis: buildAnalysis(summary) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Haftalik tahlilda xatolik';
    return json({ error: message }, 500);
  }
});
