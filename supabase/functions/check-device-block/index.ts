// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let body: any = {};
    if (req.method === 'POST') {
      try {
        body = await req.json();
      } catch (_) {}
    }

    const clientIp = body.ip_address || 
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
      req.headers.get('cf-connecting-ip') || 
      null;

    const fingerprint = body.fingerprint || null;

    // Execute RPC with service role
    const { data, error } = await supabase.rpc('check_device_blocked', {
      p_fingerprint: fingerprint,
      p_ip: clientIp
    });

    if (error) {
      // Fallback direct table query if RPC fails
      let isBlocked = false;
      let reason = null;

      if (fingerprint) {
        const { data: fpMatch } = await supabase
          .from('blocked_devices')
          .select('id, reason')
          .eq('fingerprint', fingerprint)
          .maybeSingle();

        if (fpMatch) {
          isBlocked = true;
          reason = fpMatch.reason || 'Qurilmangiz EduContest platformasidan bloklangan';
        }
      }

      if (!isBlocked && clientIp) {
        const { data: ipMatch } = await supabase
          .from('blocked_devices')
          .select('id, reason')
          .eq('ip_address', clientIp)
          .maybeSingle();

        if (ipMatch) {
          isBlocked = true;
          reason = ipMatch.reason || 'IP manzilingiz EduContest platformasidan bloklangan';
        }
      }

      return new Response(JSON.stringify({ blocked: isBlocked, reason }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    const result = data || { is_blocked: false, reason: null };

    return new Response(
      JSON.stringify({
        blocked: !!result.is_blocked,
        reason: result.reason || null
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ blocked: false, error: err.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
