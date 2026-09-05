declare const Deno: {
  env: { get(key: string): string | undefined };
  serve(handler: (req: Request) => Response | Promise<Response>): void;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type RequestBody = {
  action?: string;
  question?: unknown;
  user_query?: string;
  chat_history?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
};

type OpenAIResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function openAIReply(question: unknown, userQuery: string, chatHistory: RequestBody['chat_history']) {
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
        { role: 'system', content: 'You are a concise SAT tutor. Help without directly giving the final answer unless asked. Reply in Uzbek when the user writes Uzbek.' },
        ...((chatHistory || []).slice(-6)),
        { role: 'user', content: `Question context: ${JSON.stringify(question).slice(0, 6000)}\nStudent asks: ${userQuery}` },
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) return null;
  const data = (await response.json()) as OpenAIResponse;
  return data.choices?.[0]?.message?.content || null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = (await req.json()) as RequestBody;
    if (body.action === 'ask_preppy') {
      const reply = await openAIReply(body.question, body.user_query || '', body.chat_history || []);
      return json({
        reply: reply || 'Savolni mayda qismlarga ajrating: avval nima soralayotganini toping, keyin berilgan malumotlardan notogri variantlarni chiqarib tashlang. Qaysi qadamda qiynalayotganingizni yozsangiz, osha joyini tushuntiraman.',
      });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Mock test AI xatoligi';
    return json({ error: message }, 500);
  }
});
