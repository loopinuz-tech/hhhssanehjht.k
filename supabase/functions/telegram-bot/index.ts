// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function telegramRequest(method: string, body: Record<string, unknown>, telegramKey: string) {
  const url = `https://api.telegram.org/bot${telegramKey}/${method}`;
  console.log(`Calling Telegram API: ${method}`);
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  console.log(`Telegram API response [${method}]:`, data);
  return data;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const TELEGRAM_API_KEY = Deno.env.get('TELEGRAM_API_KEY');
  console.log('TELEGRAM_API_KEY present:', !!TELEGRAM_API_KEY);

  try {
    const update = await req.json();
    console.log('Received update:', JSON.stringify(update));

    if (update.message) {
      const message = update.message;
      const chatId = message.chat.id;

      if (message.text && message.text.startsWith('/start')) {
        console.log('Handling /start');
        await telegramRequest('sendMessage', {
          chat_id: chatId,
          text: '👋 Educontest platformasiga xush kelibsiz!\n\n📱 Kirish uchun telefon raqamingizni yuboring:',
          parse_mode: 'HTML',
          reply_markup: {
            keyboard: [[{ text: '📱 Telefon raqamni yuborish', request_contact: true }]],
            resize_keyboard: true,
            one_time_keyboard: true,
          },
        }, TELEGRAM_API_KEY);
      } else if (message.contact) {
        console.log('Handling contact');
        let phone = message.contact.phone_number || '';
        if (phone && !phone.startsWith('+')) phone = '+' + phone;
        
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Delete old codes for this chat_id or expired codes
        await supabase.from('telegram_auth_codes').delete().or(`chat_id.eq.${chatId},expires_at.lt.${new Date().toISOString()}`);

        const fullName = [message.contact.first_name, message.contact.last_name].filter(Boolean).join(' ');

        // Try inserting up to 5 times in case of code collision
        let code = '';
        let insertErr = null;
        for (let attempt = 0; attempt < 5; attempt++) {
          code = String(Math.floor(100000 + Math.random() * 900000));
          const { error } = await supabase.from('telegram_auth_codes').insert({
            code,
            chat_id: chatId,
            phone,
            full_name: fullName,
          });
          if (!error) {
            insertErr = null;
            break;
          }
          insertErr = error;
        }

        if (insertErr) {
          console.error('DB Error:', insertErr);
          await telegramRequest('sendMessage', {
            chat_id: chatId,
            text: '❌ Xatolik yuz berdi. Qayta urinib ko\'ring: /start',
          }, TELEGRAM_API_KEY);
        } else {
          await telegramRequest('sendMessage', {
            chat_id: chatId,
            text: `✅ Tasdiqlash kodi: <b>${code}</b>`,
            parse_mode: 'HTML',
          }, TELEGRAM_API_KEY);
        }
      }
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Global Error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 200, headers: corsHeaders });
  }
});
