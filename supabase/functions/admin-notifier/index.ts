import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function telegramRequest(method: string, body: Record<string, unknown>, telegramKey: string) {
  const url = `https://api.telegram.org/bot${telegramKey}/${method}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const TELEGRAM_API_KEY = Deno.env.get('TELEGRAM_API_KEY');
  const ADMIN_TELEGRAM_CHAT_ID = Deno.env.get('ADMIN_TELEGRAM_CHAT_ID') || '722836534'; // Fallback to user ID if not set

  if (!TELEGRAM_API_KEY) {
    return new Response(JSON.stringify({ error: 'TELEGRAM_API_KEY is not set' }), { status: 500, headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log('Webhook payload received:', JSON.stringify(payload));

    if (payload.type !== 'INSERT') {
      return new Response(JSON.stringify({ ok: true, message: 'Ignored non-INSERT event' }), { headers: corsHeaders });
    }

    const { table, record } = payload;
    let messageText = '';

    if (table === 'profiles' || table === 'users') { // Support both auth.users and public.profiles
      const name = record.full_name || record.raw_user_meta_data?.full_name || 'Ismi kiritilmagan';
      const email = record.email || 'Email yo\'q';
      const phone = record.phone || 'Tel yo\'q';
      messageText = `👤 <b>Yangi foydalanuvchi tizimga qo'shildi!</b>\n\n<b>Ism:</b> ${name}\n<b>Email:</b> ${email}\n<b>Tel:</b> ${phone}`;
    } else if (table === 'complaints') {
      const msg = record.message || 'Xabar yo\'q';
      messageText = `⚠️ <b>Yangi shikoyat kelib tushdi!</b>\n\n<b>Shikoyat:</b>\n<i>${msg}</i>\n\n<a href="https://educontest.uz/admin/complaints">Admin panelda ko'rish</a>`;
    } else if (table === 'wallet_transactions' || table === 'educoin_transactions') {
      const amount = record.amount || 0;
      const type = record.type || record.transaction_type || 'Noma\'lum';
      messageText = `💰 <b>Yangi moliya / to'lov o'tkazmasi!</b>\n\n<b>Miqdor:</b> ${amount}\n<b>Turi:</b> ${type}`;
    } else {
      return new Response(JSON.stringify({ ok: true, message: 'Unhandled table' }), { headers: corsHeaders });
    }

    // Send the message to Admin
    const tgRes = await telegramRequest('sendMessage', {
      chat_id: ADMIN_TELEGRAM_CHAT_ID,
      text: messageText,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }, TELEGRAM_API_KEY);

    console.log('Telegram send response:', tgRes);

    return new Response(JSON.stringify({ ok: true, telegram_response: tgRes }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (err) {
    console.error('Error in admin-notifier:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
