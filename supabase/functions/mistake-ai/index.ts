declare const Deno: {
  env: { get(key: string): string | undefined };
  serve(handler: (req: Request) => Response | Promise<Response>): void;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Mistake = {
  description?: string;
  tags?: string[];
  reason?: string;
};

type RequestBody = {
  mistakes?: Mistake[];
  action?: string;
};

type OpenAIResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};

type GeneratedQuestion = {
  question: string;
  topic: string;
  options: Record<'A' | 'B' | 'C' | 'D', string>;
  correct: string;
  explanation: string;
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function topTopics(mistakes: Mistake[]) {
  const counts = new Map<string, number>();
  for (const mistake of mistakes) {
    for (const tag of mistake.tags || []) {
      const clean = String(tag || '').trim();
      if (clean) counts.set(clean, (counts.get(clean) || 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([topic]) => topic);
}

function fallbackAnalysis(mistakes: Mistake[]) {
  const topics = topTopics(mistakes);
  const reasonCounts = mistakes.reduce<Record<string, number>>((acc, item) => {
    const key = item.reason || 'concept';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const mainReason = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'concept';

  return {
    analysis: `Jami ${mistakes.length} ta xato tahlil qilindi. Asosiy muammo: ${mainReason}. ${topics.length ? `Kop takrorlangan mavzular: ${topics.join(', ')}.` : 'Mavzu teglari hali yetarli emas.'}`,
    weakTopics: topics,
    recommendations: [
      'Har bir xatoni qayta yechib, togri yechimni qisqa formula yoki qoida sifatida yozing.',
      'Bir xil mavzudagi xatolarni alohida 20 daqiqalik blokda takrorlang.',
      'Vaqt bosimi bolsa, avval oson savollarni yakunlab, qiyinlarini belgilab qayting.',
    ],
  };
}

function fallbackQuestions(mistakes: Mistake[]): GeneratedQuestion[] {
  const source = mistakes.length ? mistakes : [{ description: 'Umumiy takrorlash', tags: ['General'] }];
  return Array.from({ length: 20 }, (_, index) => {
    const item = source[index % source.length];
    const topic = item.tags?.[0] || 'General';
    return {
      question: `${topic}: quyidagi xatoga oxshash savolni yeching. ${item.description || 'Asosiy tushunchani aniqlang.'}`,
      topic,
      options: {
        A: 'Birinchi yechim',
        B: 'Ikkinchi yechim',
        C: 'Uchinchi yechim',
        D: 'Tortinchi yechim',
      },
      correct: 'A',
      explanation: 'Bu fallback savol. OPENAI_API_KEY sozlanganda savollar real tahlil asosida yaratiladi.',
    };
  });
}

async function callOpenAI(prompt: string): Promise<Record<string, unknown> | null> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) return null;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: Deno.env.get('OPENAI_MODEL') || 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: 'Return only valid JSON. Write concise Uzbek guidance for students.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) return null;
  const data = (await response.json()) as OpenAIResponse;
  const content = data.choices?.[0]?.message?.content;
  if (!content) return null;
  try {
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = (await req.json()) as RequestBody;
    const mistakes = Array.isArray(body.mistakes) ? body.mistakes : [];
    const action = body.action || 'analyze';

    if (action === 'generate_tests') {
      const ai = await callOpenAI(`Create exactly 20 multiple-choice practice questions from these mistakes. JSON shape: {"questions":[{"question":"","topic":"","options":{"A":"","B":"","C":"","D":""},"correct":"A","explanation":""}]}. Mistakes: ${JSON.stringify(mistakes).slice(0, 12000)}`);
      const questions = Array.isArray(ai?.questions) ? ai.questions : fallbackQuestions(mistakes);
      return json({ questions });
    }

    const ai = await callOpenAI(`Analyze these learning mistakes. JSON shape: {"analysis":"","weakTopics":[],"recommendations":[]}. Mistakes: ${JSON.stringify(mistakes).slice(0, 12000)}`);
    return json(ai || fallbackAnalysis(mistakes));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI tahlilda xatolik';
    return json({ error: message }, 500);
  }
});
