// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ADMIN_PHONE = '+998888584969';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const TELEGRAM_API_KEY = Deno.env.get('TELEGRAM_API_KEY');

  try {
    // GET request = return bot info
    if (req.method === 'GET') {
      if (!TELEGRAM_API_KEY) {
        return new Response(JSON.stringify({ error: 'Telegram not configured' }), { status: 500, headers: corsHeaders });
      }

      const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_API_KEY}/getMe`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        return new Response(JSON.stringify({ error: 'Failed to get bot info' }), { status: 502, headers: corsHeaders });
      }

      return new Response(JSON.stringify({
        bot_username: data.result?.username,
        bot_name: data.result?.first_name,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }


    // POST request = verify code OR get email
    const body = await req.json();
    const action = body.action;

    // -- NEW: Action to get email by phone (for Login) --
    if (action === 'get-email') {
      const phone = String(body.phone || '').trim();
      if (!phone) {
        return new Response(JSON.stringify({ error: 'Telefon raqami kiritilmadi' }), { status: 400, headers: corsHeaders });
      }

      const { data: profile, error: profErr } = await supabase
        .from('profiles')
        .select('telegram_chat_id')
        .eq('phone', phone)
        .maybeSingle();
      
      if (profErr || !profile?.telegram_chat_id) {
        return new Response(JSON.stringify({ error: 'Ushbu telefon raqami bilan foydalanuvchi topilmadi' }), { status: 404, headers: corsHeaders });
      }

      return new Response(JSON.stringify({ email: `tg_${profile.telegram_chat_id}@educontest.uz` }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // -- NEW: Action to just acknowledge OTP request start --
    if (action === 'send-otp') {
      return new Response(JSON.stringify({ success: true, message: 'Botni ochib, /start bosing.' }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const code = String(body.code || '').trim();

    if (!code || code.length !== 6) {
      return new Response(JSON.stringify({ error: 'Noto\'g\'ri kod formati' }), { status: 400, headers: corsHeaders });
    }

    // Look up valid auth code
    const now = new Date().toISOString();
    const { data: authCode, error: lookupErr } = await supabase
      .from('telegram_auth_codes')
      .select('*')
      .eq('code', code)
      .eq('verified', false)
      .gt('expires_at', now)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (lookupErr || !authCode) {
      return new Response(JSON.stringify({ error: 'Kod topilmadi yoki muddati tugagan. Qayta /start yuboring.' }), { status: 400, headers: corsHeaders });
    }

    // Mark as verified
    await supabase.from('telegram_auth_codes').update({ verified: true }).eq('id', authCode.id);

    const email = `tg_${authCode.chat_id}@educontest.uz`;

    // Check if user already exists via profiles
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('user_id, has_password')
      .eq('telegram_chat_id', String(authCode.chat_id))
      .maybeSingle();

    let userId: string;

    if (existingProfile) {
      userId = existingProfile.user_id;
      
      const finalPhone = body.phone || authCode.phone;
      const password = body.password;

      // Update Auth User (including password if provided)
      const updateData: any = {
        phone: finalPhone,
        user_metadata: { phone: finalPhone }
      };
      
      // If a password is provided, we update it (Password Reset via Bot)
      if (password) {
        updateData.password = password;
      }

      const { error: updateAuthErr } = await supabase.auth.admin.updateUserById(userId, updateData);
      if (updateAuthErr) {
        console.error('Auth update error:', updateAuthErr);
      }

      // Update profile info

      // Update profile info
      await supabase.from('profiles').update({
        full_name: body.full_name || authCode.full_name,
        phone: finalPhone,
        role: body.role, // Allow role update if provided
      }).eq('user_id', userId);
    } else {
      // Create new user
      const finalPhone = body.phone || authCode.phone;
      const finalFullName = body.full_name || authCode.full_name;
      const password = body.password || Math.random().toString(36).slice(-12);
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        phone: finalPhone, 
        password,
        email_confirm: true,
        user_metadata: {
          full_name: finalFullName,
          phone: finalPhone,
        },
      });

      if (createError) {
        // If user already exists with this email, find them
        const { data: profileByChatId } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('telegram_chat_id', String(authCode.chat_id))
          .maybeSingle();
        
        if (profileByChatId) {
          userId = profileByChatId.user_id;
        } else {
          // Try to find by email
          const { data: { users: foundUsers } } = await supabase.auth.admin.listUsers();
          const foundUser = foundUsers.find(u => u.email === email);
          if (foundUser) {
            userId = foundUser.id;
          } else {
             return new Response(JSON.stringify({ error: createError.message }), { status: 500, headers: corsHeaders });
          }
        }
      } else {
        userId = newUser.user.id;
      }

      // Update profile with final info
      const { error: finalUpdateErr } = await supabase.from('profiles').update({
        full_name: finalFullName,
        phone: finalPhone,
        telegram_chat_id: String(authCode.chat_id),
        has_password: !!body.password,
        role: body.role || 'student', // Add role here
      }).eq('user_id', userId);
      
      if (finalUpdateErr) {
        console.error('Final update error:', finalUpdateErr);
      }

      // Check if admin phone
      if (finalPhone === ADMIN_PHONE) {
        await supabase.from('user_roles').upsert({
          user_id: userId,
          role: 'admin',
        }, { onConflict: 'user_id,role' });
      }
    }

    // Generate magic link for session
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });

    if (linkError) {
      console.error('Generate link error:', linkError);
      return new Response(JSON.stringify({ error: 'Sessiya yaratishda xatolik' }), { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify({
      email,
      token: linkData.properties.email_otp,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('telegram-auth error:', err);
    return new Response(JSON.stringify({ error: 'Server xatoligi' }), { status: 500, headers: corsHeaders });
  }
});
