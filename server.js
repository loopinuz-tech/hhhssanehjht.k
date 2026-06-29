/**
 * EduContest BFF (Backend-for-Frontend) Server
 * Principal Architect Implementation
 */
require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const { OAuth2Client } = require('google-auth-library');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Config
const SUPABASE_URL = 'https://rcxfryjvdkmtbqivbrjg.supabase.co';
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE) {
  console.error('вќЊ CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing in .env');
} else {
  console.log('вњ… SUPABASE_SERVICE_ROLE_KEY is loaded');
}

// Clients
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://*.payme.uz", "https://*.click.uz", "https://accounts.google.com", "https://mc.yandex.ru", "https://cdn.jsdelivr.net", "https://unpkg.com"],
      connectSrc: ["'self'", "https://*.supabase.co", "https://api.educontest.uz", "https://api.telegram.org", "https://cloudflareinsights.com", "https://mc.yandex.ru", "https://uaas.yandex.ru", "https://cdn.jsdelivr.net", "https://unpkg.com", "https://webvisor.com", "https://onesignal.com", "https://cdn.onesignal.com", "https://api.onesignal.com", "https://www.googletagmanager.com", "wss:"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://fonts.googleapis.com", "data:", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://*.payme.uz", "https://*.click.uz", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
      frameSrc: ["'self'", "https://accounts.google.com", "https://mc.yandex.ru", "https://webvisor.com"],
      objectSrc: ["'none'"],
    },
  },
  xFrameOptions: false,
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
}));
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());

/**
 * BFF Proxy: Forward Supabase internal requests through Node.js
 */
const supabaseProxy = createProxyMiddleware({
  target: SUPABASE_URL,
  changeOrigin: true,
  pathRewrite: (path, req) => req.originalUrl,
  proxyTimeout: 120000, 

  timeout: 120000,
  onError: (err, req, res) => {
    console.error('Proxy Error:', err);
    res.status(500).send('Proxy Error');
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[Proxy Req] ${req.method} ${req.url} -> ${SUPABASE_URL}${req.originalUrl}`);
    try {
      // Ensure host matches target
      const targetHost = new URL(SUPABASE_URL).host;
      proxyReq.setHeader('Host', targetHost);

      // Prefer client Authorization header (Supabase SDK auto-refreshes tokens),
      // fallback to cookie token, then to ANON_KEY
      const clientAuth = req.headers.authorization;
      const accessToken = req.cookies?.['sb-access-token'];
      
      // Always inject ANON_KEY for Supabase REST API
      const ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
      if (ANON_KEY) {
        proxyReq.setHeader('apikey', ANON_KEY);
      }

      if (clientAuth && clientAuth.startsWith('Bearer ') && !clientAuth.endsWith(ANON_KEY)) {
        proxyReq.setHeader('Authorization', clientAuth);
      } else if (accessToken) {
        proxyReq.setHeader('Authorization', `Bearer ${accessToken}`);
      } else if (ANON_KEY) {
        proxyReq.setHeader('Authorization', `Bearer ${ANON_KEY}`);
      }
      
      console.log(`[Proxy Headers] Host: ${targetHost}, hasAuth: ${!!proxyReq.getHeader('Authorization')}`);
    } catch (err) {
      console.error('Proxy header injection error:', err);
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`[Proxy Res] ${req.method} ${req.url} -> ${proxyRes.statusCode}`);
  }
});

app.use('/auth/v1', supabaseProxy);
app.use('/rest/v1', supabaseProxy);
app.use('/storage/v1', supabaseProxy);
app.use('/functions/v1', supabaseProxy);



app.use(express.json({ limit: '50mb' }));




// --- UTILS ---

const setAuthCookies = (res, session, req) => {
  const origin = req.get('origin') || req.get('referer') || '';
  const host = req.get('host') || '';
  const isLocal = origin.includes('localhost') || host.includes('localhost') || host.includes('127.0.0.1');

  // Domain for shared cookies across subdomains
  const domain = isLocal ? undefined : '.educontest.uz';

  const cookieOptions = {
    httpOnly: true,
    secure: !isLocal,
    sameSite: isLocal ? 'Lax' : 'None',
    maxAge: session.expires_in * 1000,
    path: '/',
    domain: domain
  };

  res.cookie('sb-access-token', session.access_token, cookieOptions);
  res.cookie('sb-refresh-token', session.refresh_token, {
    ...cookieOptions,
    maxAge: 30 * 24 * 60 * 60 * 1000
  });
};

const clearAuthCookies = (res, req) => {
  const host = req.get('host') || '';
  const domain = (host.includes('localhost') || host.includes('127.0.0.1')) ? undefined : '.educontest.uz';
  res.clearCookie('sb-access-token', { path: '/', domain });
  res.clearCookie('sb-refresh-token', { path: '/', domain });
};

// --- AUTH MIDDLEWARE ---

const authRequired = async (req, res, next) => {
  const cookieToken = req.cookies['sb-access-token'];
  const authHeader = req.headers.authorization;
  const token = cookieToken || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null);
  if (!token) return res.status(401).json({ error: 'Session expired' });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid session' });

  req.user = user;
  next();
};

const adminRequired = async (req, res, next) => {
  await authRequired(req, res, async () => {
    const { data: role } = await supabase.from('user_roles').select('role').eq('user_id', req.user.id).single();
    if (role?.role !== 'admin' && role?.role !== 'sub_admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
};

// --- API ROUTES ---

/**
 * TTS: Text-to-Speech
 * Primary: UzbekVoice.ai (natural Uzbek voices)
 * Fallback: Microsoft Edge TTS (free, good quality)
 */
let Communicate = null;
try {
  Communicate = require('edge-tts-universal').Communicate;
} catch (e) {
  console.warn('[TTS] edge-tts-universal not available, Edge TTS fallback disabled');
}

const UZBEKVOICE_API_KEY = process.env.UZBEKVOICE_API_KEY || '88fb04ea-d029-423f-9a0e-1de5747dad77:b5368080-49a2-4b32-b5a2-40e4f28b33ae';
const UZBEKVOICE_API_URL = 'https://uzbekvoice.ai/api/v1/tts';

// Voice mapping: frontend voice name -> provider-specific voice
const VOICE_MAP = {
  'lola':      { provider: 'uzbekvoice', model: 'lola' },
  'nilufar':   { provider: 'uzbekvoice', model: 'nilufar' },
  'sardor':    { provider: 'edge', voice: 'uz-UZ-SardorNeural' },
  'shirin':    { provider: 'edge', voice: 'uz-UZ-ShirinNeural' },
};

app.post('/api/tts', async (req, res) => {
  try {
    const { text, voice = 'lola', rate = '+0%', pitch = '+0Hz' } = req.body;
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const cleanedText = text
      .replace(/[\*\#\-\_\>\<\/\{\}\[\]\(\)\?\!\.\,\:\;\"\'\`\~\@\$\%\^\&\+\\\|\=]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleanedText.length > 3000) {
      return res.status(400).json({ error: 'Text too long (max 3000 chars)' });
    }

    const voiceConfig = VOICE_MAP[voice] || VOICE_MAP['lola'];

    // Try UzbekVoice.ai first (natural Uzbek voices)
    if (voiceConfig.provider === 'uzbekvoice') {
      try {
        const uvRes = await fetch(UZBEKVOICE_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': UZBEKVOICE_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: cleanedText,
            model: voiceConfig.model,
            blocking: 'true'
          }),
          signal: AbortSignal.timeout(15000)
        });

        if (uvRes.ok) {
          const uvJson = await uvRes.json();
          if (uvJson.status === 'SUCCESS' && uvJson.result?.url) {
            // Download audio from CDN
            const audioRes = await fetch(uvJson.result.url, { signal: AbortSignal.timeout(10000) });
            if (audioRes.ok) {
              const audioBuf = Buffer.from(await audioRes.arrayBuffer());
              res.set({
                'Content-Type': 'audio/wav',
                'Content-Length': audioBuf.length,
                'Cache-Control': 'public, max-age=3600'
              });
              return res.send(audioBuf);
            }
          }
        }
        console.warn('[TTS] UzbekVoice.ai failed, falling back to Edge TTS');
      } catch (uvErr) {
        console.warn('[TTS] UzbekVoice.ai error:', uvErr.message, '- falling back to Edge TTS');
      }
    }

    // Fallback: Microsoft Edge TTS
    if (!Communicate) {
      return res.status(503).json({ error: 'Edge TTS module not available' });
    }
    const edgeVoice = voiceConfig.provider === 'edge' ? voiceConfig.voice : 'uz-UZ-SardorNeural';
    const communicate = new Communicate(cleanedText, edgeVoice, { rate, pitch });
    const chunks = [];
    for await (const chunk of communicate.stream()) {
      if (chunk.data) chunks.push(chunk.data);
    }
    const audioBuffer = Buffer.concat(chunks);
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length,
      'Cache-Control': 'public, max-age=3600'
    });
    res.send(audioBuffer);
  } catch (err) {
    console.error('[TTS] error:', err.message);
    res.status(500).json({ error: 'TTS failed' });
  }
});

/**
 * TTS: List available voices
 */
app.get('/api/tts/voices', (req, res) => {
  res.json({
    voices: [
      { id: 'lola', name: 'Lola', gender: 'female', provider: 'uzbekvoice', description: 'Tabiiy o\'zbek ayol ovozi' },
      { id: 'nilufar', name: 'Nilufar', gender: 'female', provider: 'uzbekvoice', description: 'Tabiiy o\'zbek ayol ovozi' },
      { id: 'sardor', name: 'Sardor', gender: 'male', provider: 'edge', description: 'O\'zbek erkak ovozi (Edge TTS)' },
      { id: 'shirin', name: 'Shirin', gender: 'female', provider: 'edge', description: 'O\'zbek ayol ovozi (Edge TTS)' },
    ]
  });
});

/**
 * AUTH: Get Current Session
 */
app.get('/api/auth/session', async (req, res) => {
  try {
    const token = req.cookies['sb-access-token'];
    const refreshToken = req.cookies['sb-refresh-token'];
    if (!token) return res.json({ user: null, profile: null });

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.json({ user: null, profile: null });

    const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle();
    const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', user.id);

    res.json({
      user,
      profile,
      roles: roles?.map(r => r.role) || [],
      access_token: token,
      refresh_token: refreshToken || null
    });
  } catch (err) {
    console.error('Session error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

/**
 * AUTH: Set session from frontend token (Bridge for OAuth)
 */
app.post('/api/auth/set-session', async (req, res) => {
  const { access_token, refresh_token } = req.body;
  if (!access_token) return res.status(400).json({ error: 'Token missing' });

  // Set cookies
  setAuthCookies(res, { access_token, refresh_token, expires_in: 3600 }, req);
  res.json({ success: true });
});

/**
 * AUTH: Login
 */
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return res.status(401).json(error);
  setAuthCookies(res, data.session, req);
  res.json({ user: data.user });
});

/**
 * AUTH: Google Social Login
 */
app.post('/api/auth/google', async (req, res) => {
  const { credential } = req.body;
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: credential,
  });
  if (error) return res.status(401).json(error);
  setAuthCookies(res, data.session, req);
  res.json({ user: data.user });
});

/**
 * AUTH: Telegram OTP Flow
 */
app.get('/api/auth/telegram/bot-info', async (req, res) => {
  const { data, error } = await supabase.functions.invoke('telegram-auth', {
    method: 'GET'
  });
  if (error) return res.status(500).json(error);
  res.json(data);
});

app.post('/api/auth/telegram/send-otp', async (req, res) => {
  // We don't strictly need to call Edge Function here since the user triggers it via /start in the bot
  res.json({ success: true, message: 'Iltimos, botni ochib /start bosing.' });
});

/**
 * AUTH: Register - Send OTP
 */
app.post('/api/auth/register/send-otp', async (req, res) => {
  const { phone } = req.body;
  const cleanPhone = phone.replace(/\D/g, '');

  const { data: profile } = await supabase.from('profiles').select('user_id').eq('phone', cleanPhone).maybeSingle();
  if (profile) {
    return res.status(400).json({ error: 'Ushbu telefon raqami bilan foydalanuvchi mavjud. Iltimos, tizimga kiring.' });
  }

  // Return success immediately to allow frontend to show code input
  res.json({ success: true, message: 'Iltimos, botni ochib /start bosing.' });
});

app.post('/api/auth/telegram/verify-otp', async (req, res) => {
  const { phone, code } = req.body;
  const { data, error } = await supabase.functions.invoke('telegram-auth', {
    body: { action: 'verify-otp', phone, code }
  });

  if (error) return res.status(401).json(error);

  if (data?.email && data?.token) {
    const { data: vData, error: vError } = await supabase.auth.verifyOtp({
      email: data.email,
      token: data.token,
      type: 'magiclink'
    });

    if (vError) return res.status(401).json(vError);

    setAuthCookies(res, vData.session, req);
    res.json({ user: vData.user });
  } else {
    res.status(400).json({ error: 'Verifikatsiya xatosi' });
  }
});

/**
 * AUTH: Register - Verify OTP
 */
app.post('/api/auth/register/verify', async (req, res) => {
  const { phone, code, full_name, role } = req.body;
  const cleanPhone = phone.replace(/\D/g, '');

  const { data, error } = await supabase.functions.invoke('telegram-auth', {
    body: { action: 'verify-otp', phone: cleanPhone, code, full_name, role: role || 'student' }
  });

  if (error) return res.status(401).json(error);

  if (data?.email && data?.token) {
    const { data: vData, error: vError } = await supabase.auth.verifyOtp({
      email: data.email,
      token: data.token,
      type: 'magiclink'
    });

    if (vError) return res.status(401).json(vError);

    setAuthCookies(res, vData.session, req);
    res.json({ user: vData.user });
  } else {
    res.status(400).json({ error: 'Verifikatsiya xatosi' });
  }
});

/**
 * AUTH: Logout
 */
app.post('/api/auth/logout', (req, res) => {
  clearAuthCookies(res, req);
  res.json({ success: true });
});

/**
 * DATA: Dashboard Unified Stats
 */
app.get('/api/dashboard', authRequired, async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const [
    announcements,
    sessions,
    subjects,
    leaderboard,
    myRank,
    todayActivity,
    scheduledExams,
    folders
  ] = await Promise.all([
    supabase.from('announcements').select('*').eq('is_active', true).order('created_at', { ascending: false }),
    supabase.from('test_sessions').select('*, test_folders(*)').eq('user_id', req.user.id).not('finished_at', 'is', null).order('finished_at', { ascending: false }).limit(10),
    supabase.from('subjects').select('*').eq('is_active', true).order('order_number'),
    supabase.from('leaderboard').select('*').order('rank', { ascending: true }).limit(5),
    supabase.from('leaderboard').select('rank').eq('user_id', req.user.id).maybeSingle(),
    supabase.from('test_sessions').select('*', { count: 'exact', head: true }).eq('user_id', req.user.id).not('finished_at', 'is', null).gte('finished_at', `${today}T00:00:00`),
    supabase.from('scheduled_exams').select('*').eq('is_active', true).gt('scheduled_at', new Date().toISOString()).order('scheduled_at', { ascending: true }).limit(3),
    supabase.from('test_folders').select('id, subject').eq('is_active', true)
  ]);

  const subjectFolderMap = {};
  folders.data?.forEach(f => {
    const s = f.subject || "Boshqa";
    if (!subjectFolderMap[s]) subjectFolderMap[s] = [];
    subjectFolderMap[s].push(f.id);
  });

  res.json({
    announcements: announcements.data || [],
    sessions: sessions.data || [],
    subjects: subjects.data || [],
    leaderboard: leaderboard.data || [],
    myRank: myRank.data?.rank,
    todayTests: todayActivity.count || 0,
    scheduledExams: scheduledExams.data || [],
    subjectFolders: subjectFolderMap
  });
});

/**
 * DATA: Leaderboard (Full)
 */
app.get('/api/leaderboard', authRequired, async (req, res) => {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .order('rank', { ascending: true })
    .limit(100);
  res.json(data || []);
});

/**
 * DATA: User Profile
 */
app.get('/api/profile', authRequired, async (req, res) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', req.user.id)
    .single();
  res.json(data);
});

app.patch('/api/profile', authRequired, async (req, res) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(req.body)
    .eq('user_id', req.user.id);
  if (error) return res.status(400).json(error);
  res.json({ success: true });
});

/**
 * ADMIN: Generic Data Access
 */
app.get('/api/admin/:table', adminRequired, async (req, res) => {
  const { table } = req.params;
  const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false }).limit(100);
  if (error) return res.status(400).json(error);
  res.json(data);
});

app.post('/api/admin/:table', adminRequired, async (req, res) => {
  const { table } = req.params;
  const { data, error } = await supabase.from(table).insert(req.body).select();
  if (error) return res.status(400).json(error);
  res.json(data);
});

/**
 * STORAGE: Upload Proxy
 */
let multer = null;
let upload = null;
try {
  multer = require('multer');
  upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 }
  });
} catch (e) {
  console.warn('[Storage] multer not available, upload disabled');
}

app.post('/api/storage/upload/:bucket', authRequired, upload.single('file'), async (req, res) => {
  const { bucket } = req.params;
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'Fayl yuklanmadi' });

  const fileName = `${req.user.id}/${Date.now()}-${file.originalname}`;
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: true
    });

  if (error) return res.status(500).json({ error: error.message || 'Storage xatosi' });

  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
  res.json({ url: publicUrl, path: data.path });
});

// Multer error handler
app.use((err, req, res, next) => {
  if (err instanceof require('multer').MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Fayl hajmi 100MB dan oshmasligi kerak' });
    }
    return res.status(400).json({ error: `Upload xatolik: ${err.message}` });
  }
  next(err);
});

app.get('/api/tests', async (req, res) => {
  const { category, subject, search } = req.query;
  let query = supabase.from('test_folders').select('*').eq('is_active', true);
  if (category) query = query.eq('category', category);
  if (subject) query = query.eq('subject', subject);
  if (search) query = query.ilike('name', `%${search}%`);

  const { data, error } = await query.order('created_at', { ascending: false });
  res.json(data || []);
});

/**
 * EDUCOIN: Get Balance
 */
app.get('/api/educoin/balance', authRequired, async (req, res) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('educoin_balance, login_streak')
    .eq('user_id', req.user.id)
    .single();
  res.json(data);
});

/**
 * EDUCOIN: Daily Login
 */
app.post('/api/educoin/daily-login', authRequired, async (req, res) => {
  const { data, error } = await supabase.rpc('process_daily_login', {
    p_user_id: req.user.id
  });
  if (error) return res.status(500).json(error);
  res.json(data);
});

/**
 * EDUCOIN: Spend/Earn
 */
app.post('/api/educoin/add', authRequired, async (req, res) => {
  const { amount, type, description, reference_id } = req.body;
  const { data, error } = await supabase.rpc('add_educoins', {
    p_user_id: req.user.id,
    p_amount: amount,
    p_type: type,
    p_description: description,
    p_reference_id: reference_id
  });
  if (error) return res.status(500).json(error);
  res.json({ balance: data });
});

// --- AI: Chat & Explain ---
app.post('/api/ai/chat', authRequired, async (req, res) => {
  const { messages, model = 'mistral-tiny' } = req.body;
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'MISTRAL_API_KEY .env da sozlanmagan' });
  }
  try {
    const upstream = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages }),
    });
    const data = await upstream.json();
    
    if (!upstream.ok) {
      console.error('[AI Chat] Mistral API error:', upstream.status, JSON.stringify(data).slice(0, 500));
      return res.status(upstream.status).json(data);
    }
    
    res.json(data);
  } catch (err) {
    console.error('[AI Chat] Fetch error:', err.message);
    res.status(500).json({ error: err.message || 'Mistral API xatoligi' });
  }
});

// --- Images: Google Custom Search ---
app.get('/api/images/search', authRequired, async (req, res) => {
  const { q, num = 8 } = req.query;
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_CX;
  if (!apiKey || !cx) {
    return res.status(500).json({ error: 'Google Search API key yoki CX sozlanmagan' });
  }
  if (!q) {
    return res.status(400).json({ error: 'Search query kerak' });
  }
  try {
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&searchType=image&q=${encodeURIComponent(q)}&num=${Math.min(Number(num), 10)}&safe=active`;
    const upstream = await fetch(url);
    const data = await upstream.json();
    if (!upstream.ok) {
      console.error('[Images] Google API error:', upstream.status, JSON.stringify(data).slice(0, 300));
      return res.status(upstream.status).json(data);
    }
    const images = (data.items || []).map(item => ({
      thumbnail: item.link,
      title: item.title,
      source: item.displayLink,
      width: item.image?.width,
      height: item.image?.height,
    }));
    res.json({ images });
  } catch (err) {
    console.error('[Images] Fetch error:', err.message);
    res.status(500).json({ error: err.message || 'Google Search API xatoligi' });
  }
});

// --- STATIC ASSETS ---

const ROOT_DIR = path.join(__dirname, '..');
app.use(express.static(path.join(ROOT_DIR, 'dist')));

// Helper: slugify for matching folder names to URL slugs
const slugifyText = (text) => (text || '').toString().toLowerCase().trim()
  .replace(/['']/g, '')
  .replace(/\s+/g, '-')
  .replace(/[^\w\-]+/g, '')
  .replace(/\-\-+/g, '-')
  .replace(/^-+|-+$/g, '');

// Dynamic SEO: Replace <title> and meta tags for /tests/folder/* routes
const folderSeoCache = new Map();
const FOLDER_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

app.get('/tests/folder/:slug', async (req, res) => {
  const indexPath = path.join(ROOT_DIR, 'dist', 'index.html');
  if (!require('fs').existsSync(indexPath)) {
    return res.status(404).send('Not Found');
  }

  let html = require('fs').readFileSync(indexPath, 'utf-8');
  const slug = req.params.slug;

  try {
    const cacheKey = slug;
    const cached = folderSeoCache.get(cacheKey);
    let folderData = null;

    if (cached && Date.now() - cached.time < FOLDER_CACHE_TTL) {
      folderData = cached.data;
    } else {
      const { data: allFolders } = await supabase
        .from('test_folders')
        .select('name, subject, meta_title, meta_description, description')
        .eq('is_active', true)
        .limit(5000);

      if (allFolders) {
        const matched = allFolders.find(f => slugifyText(f.name) === slug);
        if (matched) {
          folderData = matched;
          folderSeoCache.set(cacheKey, { data: matched, time: Date.now() });
        }

        // Cache all folders for other slugs too
        allFolders.forEach(f => {
          const s = slugifyText(f.name);
          if (!folderSeoCache.has(s)) {
            folderSeoCache.set(s, { data: f, time: Date.now() });
          }
        });
      }
    }

    if (folderData) {
      const seoTitle = folderData.meta_title || `${folderData.name} — ${folderData.subject || 'Umumiy'} mavzulashtirilgan test | EduContest`;
      const seoDesc = folderData.meta_description || `${folderData.subject} fanidan "${folderData.name}" mavzulashtirilgan test. Savollar soni, vaqt va AI tushuntirish bilan EduContest platformasida tayyorlaning.`;
      const canonical = `https://educontest.uz/tests/folder/${slug}`;
      const ogTitle = folderData.meta_title || `${folderData.name} — ${folderData.subject || 'Umumiy'} testi | EduContest`;
      const keywords = `${folderData.name}, ${folderData.subject} testlari, milliy sertifikat ${folderData.subject}, educontest, online test`;

      html = html.replace(/<title>.*?<\/title>/, `<title>${seoTitle.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</title>`);
      html = html.replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${seoDesc.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}">`);
      html = html.replace(/<meta name="keywords"[^>]*>/, `<meta name="keywords" content="${keywords.replace(/"/g, '&quot;')}">`);
      html = html.replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${canonical}" />`);
      html = html.replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${ogTitle.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}" />`);
      html = html.replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${seoDesc.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}" />`);
      html = html.replace(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${canonical}" />`);
      html = html.replace(/<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${ogTitle.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}" />`);
      html = html.replace(/<meta name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${seoDesc.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}" />`);

      // Inject structured data for Quiz
      const quizSchema = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Quiz",
        "name": folderData.name,
        "description": seoDesc,
        "url": canonical,
        "educationalLevel": "Milliy Sertifikat",
        "timeRequired": `PT${folderData.duration_minutes || 60}M`,
        "about": { "@type": "Thing", "name": folderData.subject || "Umumiy" },
        "provider": { "@type": "EducationalOrganization", "name": "EduContest", "url": "https://educontest.uz" },
        "inLanguage": "uz",
        "isAccessibleForFree": true
      });

      const breadcrumbSchema = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Bosh sahifa", "item": "https://educontest.uz" },
          { "@type": "ListItem", "position": 2, "name": "Testlar", "item": "https://educontest.uz/tests" },
          ...(folderData.subject ? [{ "@type": "ListItem", "position": 3, "name": folderData.subject, "item": `https://educontest.uz/tests/${encodeURIComponent(folderData.subject.toLowerCase())}` }] : []),
          { "@type": "ListItem", "position": folderData.subject ? 4 : 3, "name": folderData.name, "item": canonical }
        ]
      });

      const faqSchema = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": `${folderData.name} testi qancha vaqt davom etadi?`,
            "acceptedAnswer": { "@type": "Answer", "text": `Ushbu test ${folderData.duration_minutes || 60} daqiqa davom etadi.` }
          },
          {
            "@type": "Question",
            "name": `Testni qanday boshlash mumkin?`,
            "acceptedAnswer": { "@type": "Answer", "text": '"Testni boshlash" tugmasini bosing. 3 ta rejim mavjud: o\'rganish, imtihon va mashq.' }
          },
          {
            "@type": "Question",
            "name": `AI tushuntirish nima?`,
            "acceptedAnswer": { "@type": "Answer", "text": "Har bir savol uchun EduAI tomonidan tayyorlangan batafsil tushuntirish mavjud." }
          }
        ]
      });

      const structuredDataScript = `<script type="application/ld+json">${quizSchema}</script><script type="application/ld+json">${breadcrumbSchema}</script><script type="application/ld+json">${faqSchema}</script>`;
      html = html.replace(/<\/head>/, `${structuredDataScript}</head>`);
    }
  } catch (err) {
    console.error('[SEO] Folder meta fetch error:', err.message);
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

// Dynamic SEO for /tests/details/:id routes
app.get('/tests/details/:id', async (req, res) => {
  const indexPath = path.join(ROOT_DIR, 'dist', 'index.html');
  if (!require('fs').existsSync(indexPath)) {
    return res.status(404).send('Not Found');
  }

  let html = require('fs').readFileSync(indexPath, 'utf-8');
  const id = req.params.id;

  try {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let folderData = null;

    if (uuidRegex.test(id)) {
      const { data } = await supabase.from('test_folders').select('name, subject, meta_title, meta_description').eq('id', id).single();
      folderData = data;
    } else {
      const cached = folderSeoCache.get(id);
      if (cached && Date.now() - cached.time < FOLDER_CACHE_TTL) {
        folderData = cached.data;
      } else {
        const { data: allFolders } = await supabase.from('test_folders').select('name, subject, meta_title, meta_description').eq('is_active', true).limit(5000);
        if (allFolders) {
          folderData = allFolders.find(f => slugifyText(f.name) === id);
          allFolders.forEach(f => {
            const s = slugifyText(f.name);
            if (!folderSeoCache.has(s)) folderSeoCache.set(s, { data: f, time: Date.now() });
          });
        }
      }
    }

    if (folderData) {
      const seoTitle = folderData.meta_title || `${folderData.name} — ${folderData.subject || 'Umumiy'} mavzulashtirilgan test | EduContest`;
      const seoDesc = folderData.meta_description || `${folderData.subject} fanidan "${folderData.name}" mavzulashtirilgan test. Savollar soni, vaqt va AI tushuntirish bilan EduContest platformasida tayyorlaning.`;
      const canonical = `https://educontest.uz/tests/details/${id}`;
      const ogTitle = folderData.meta_title || `${folderData.name} — ${folderData.subject || 'Umumiy'} testi | EduContest`;
      const keywords = `${folderData.name}, ${folderData.subject} testlari, milliy sertifikat ${folderData.subject}, educontest, online test`;

      html = html.replace(/<title>.*?<\/title>/, `<title>${seoTitle.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</title>`);
      html = html.replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${seoDesc.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}">`);
      html = html.replace(/<meta name="keywords"[^>]*>/, `<meta name="keywords" content="${keywords.replace(/"/g, '&quot;')}">`);
      html = html.replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${canonical}" />`);
      html = html.replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${ogTitle.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}" />`);
      html = html.replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${seoDesc.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}" />`);
      html = html.replace(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${canonical}" />`);

      // Inject structured data for Quiz + Breadcrumb
      const quizSchema = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Quiz",
        "name": folderData.name,
        "description": seoDesc,
        "url": canonical,
        "educationalLevel": "Milliy Sertifikat",
        "timeRequired": `PT${folderData.duration_minutes || 60}M`,
        "about": { "@type": "Thing", "name": folderData.subject || "Umumiy" },
        "provider": { "@type": "EducationalOrganization", "name": "EduContest", "url": "https://educontest.uz" },
        "inLanguage": "uz",
        "isAccessibleForFree": true
      });

      const breadcrumbSchema = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Bosh sahifa", "item": "https://educontest.uz" },
          { "@type": "ListItem", "position": 2, "name": "Testlar", "item": "https://educontest.uz/tests" },
          ...(folderData.subject ? [{ "@type": "ListItem", "position": 3, "name": folderData.subject, "item": `https://educontest.uz/tests/${encodeURIComponent(folderData.subject.toLowerCase())}` }] : []),
          { "@type": "ListItem", "position": folderData.subject ? 4 : 3, "name": folderData.name, "item": canonical }
        ]
      });

      const structuredDataScript = `<script type="application/ld+json">${quizSchema}</script><script type="application/ld+json">${breadcrumbSchema}</script>`;
      html = html.replace(/<\/head>/, `${structuredDataScript}</head>`);
    }
  } catch (err) {
    console.error('[SEO] Details fetch error:', err.message);
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

// ══════════════════════════════════════════════════════════════
// SOCIAL AUTOMATION: Auto-Blog, Social Publish, Notify Admin
// ══════════════════════════════════════════════════════════════

/**
 * ADMIN: Auto-generate blog post via AI
 */
app.post('/api/admin/auto-blog', adminRequired, async (req, res) => {
  try {
    // 1. Fetch edu news from Google News RSS
    const rssRes = await fetch('https://news.google.com/rss/search?q=education+uzbekistan+ta%27lim&hl=uz&gl=UZ&ceid=UZ:uz');
    const rssText = await rssRes.text();
    const titleMatch = rssText.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/);
    const descMatch = rssText.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/);
    const linkMatch = rssText.match(/<link>(https:\/\/news\.google\.com\/[^<]+)<\/link>/);

    const newsTitle = titleMatch?.[1] || "O'zbekistonda ta'lim sohasida yangiliklar";
    const newsDesc = descMatch?.[1] || '';
    const newsLink = linkMatch?.[1] || '';

    // 2. Generate blog post via Mistral AI
    const mistralKey = process.env.MISTRAL_API_KEY;
    if (!mistralKey) return res.status(500).json({ error: 'MISTRAL_API_KEY not set' });

    const aiRes = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${mistralKey}` },
      body: JSON.stringify({
        model: 'mistral-large-latest',
        messages: [
          {
            role: 'system',
            content: `Siz EduContest platformasi uchun blog post yozasiz. Faqat JSON qaytaring:
{"title":"Sarlavha","excerpt":"2-3 jumlali qisqacha tavsif","content":"HTML formatda to'liq maqola (h2, p, ul/li, blockquote ishlating). 400-600 so'z. O'zbek tilida.","tag":"Yangilik, Ta'lim"}
HTML content da xavfsizlik uchun faqat h2, p, ul, li, ol, blockquote, strong, em, a taglarini ishlating.`
          },
          {
            role: 'user',
            content: `Quyidagi yangilik asosida blog post yozing:\n\nSarlavha: ${newsTitle}\nTavsif: ${newsDesc}\nManba: ${newsLink}`
          }
        ]
      })
    });
    const aiData = await aiRes.json();
    const raw = aiData.choices?.[0]?.message?.content || '';

    // Parse JSON from AI response (handle markdown code blocks)
    let blogData;
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      blogData = JSON.parse(jsonMatch?.[0] || raw);
    } catch { blogData = null; }
    if (!blogData) return res.status(500).json({ error: 'AI JSON parse failed', raw });

    // 3. Find cover image via Google Custom Search
    const gKey = process.env.GOOGLE_SEARCH_API_KEY;
    const gCx = process.env.GOOGLE_SEARCH_CX;
    let coverImageUrl = '';
    if (gKey && gCx) {
      try {
        const imgRes = await fetch(`https://www.googleapis.com/customsearch/v1?key=${gKey}&cx=${gCx}&q=${encodeURIComponent(blogData.title)}&searchType=image&num=1&imgSize=LARGE`);
        const imgData = await imgRes.json();
        coverImageUrl = imgData.items?.[0]?.link || '';
      } catch {}
    }

    // 4. Generate slug
    const slug = blogData.title
      .toLowerCase()
      .replace(/[o'og]/g, 'o').replace(/['']/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 80);

    // 5. Insert into blog_posts
    const { data: post, error } = await supabase.from('blog_posts').insert({
      title: blogData.title,
      slug,
      excerpt: blogData.excerpt,
      content: blogData.content,
      cover_image_url: coverImageUrl,
      tag: blogData.tag || 'Yangilik, Ta\'lim',
      author_name: 'EduContest AI',
      is_published: true,
      published_at: new Date().toISOString(),
    }).select().single();

    if (error) return res.status(500).json({ error: error.message });

    // 6. Auto-publish to social media
    try {
      await supabase.functions.invoke('social-publish', { body: { blog_post_id: post.id } });
    } catch (e) { console.log('[AutoBlog] Social publish failed:', e.message); }

    res.json({ success: true, post });
  } catch (err) {
    console.error('[AutoBlog] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * ADMIN: Manually publish blog post to social media
 */
app.post('/api/admin/social-publish', adminRequired, async (req, res) => {
  try {
    const { blog_post_id } = req.body;
    if (!blog_post_id) return res.status(400).json({ error: 'blog_post_id required' });

    const { data, error } = await supabase.functions.invoke('social-publish', {
      body: { blog_post_id }
    });
    if (error) return res.status(500).json(error);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * ADMIN: Send admin notification
 */
app.post('/api/admin/notify', adminRequired, async (req, res) => {
  try {
    const { type, data } = req.body;
    const { data: result, error } = await supabase.functions.invoke('notify-admin', {
      body: { type, data }
    });
    if (error) return res.status(500).json(error);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * ADMIN: Get social media analytics
 */
app.get('/api/admin/social-analytics', adminRequired, async (req, res) => {
  try {
    // Get blog stats
    const { count: totalPosts } = await supabase.from('blog_posts').select('*', { count: 'exact', head: true });
    const { count: publishedPosts } = await supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('is_published', true);
    const { data: recentPosts } = await supabase.from('blog_posts').select('id, title, views, created_at').order('created_at', { ascending: false }).limit(5);

    // Get social posts stats
    const { data: socialPosts } = await supabase.from('social_posts').select('platform, status, created_at');

    const telegramCount = socialPosts?.filter(p => p.platform === 'telegram').length || 0;
    const youtubeCount = socialPosts?.filter(p => p.platform === 'youtube').length || 0;
    const instagramCount = socialPosts?.filter(p => p.platform === 'instagram').length || 0;
    const publishedCount = socialPosts?.filter(p => p.status === 'published').length || 0;
    const failedCount = socialPosts?.filter(p => p.status === 'failed').length || 0;

    // Get YouTube stats if OAuth token exists
    let youtubeStats = null;
    try {
      const { data: ytToken } = await supabase.from('oauth_tokens').select('*').eq('provider', 'youtube').single();
      if (ytToken?.access_token) {
        const ytRes = await fetch(`https://youtube.googleapis.com/youtube/v3/channels?part=statistics&id=UCNAusixBqK0yaRvJSmE2iFg&key=${process.env.YOUTUBE_API_KEY}`);
        const ytData = await ytRes.json();
        youtubeStats = ytData.items?.[0]?.statistics || null;
      }
    } catch {}

    // Get new users today
    const today = new Date().toISOString().split('T')[0];
    const { count: newUsersToday } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', `${today}T00:00:00`);

    res.json({
      blog: { total: totalPosts || 0, published: publishedPosts || 0, recent: recentPosts || [] },
      social: { telegram: telegramCount, youtube: youtubeCount, instagram: instagramCount, published: publishedCount, failed: failedCount },
      youtube: youtubeStats,
      newUsersToday: newUsersToday || 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * YOUTUBE: OAuth2 - Authorize
 */
app.get('/api/auth/youtube/authorize', adminRequired, (req, res) => {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/youtube/callback`;
  const scopes = ['https://www.googleapis.com/auth/youtube'];
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes.join(' '))}&access_type=offline&prompt=consent`;
  res.redirect(url);
});

/**
 * YOUTUBE: OAuth2 - Callback
 */
app.get('/api/auth/youtube/callback', adminRequired, async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).json({ error: 'No code' });

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.YOUTUBE_CLIENT_ID,
        client_secret: process.env.YOUTUBE_CLIENT_SECRET,
        redirect_uri: `${req.protocol}://${req.get('host')}/api/auth/youtube/callback`,
        grant_type: 'authorization_code',
      }),
    });
    const tokens = await tokenRes.json();
    if (!tokens.access_token) return res.status(400).json({ error: 'Token exchange failed', tokens });

    const expiresAt = new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString();

    // Upsert token
    await supabase.from('oauth_tokens').upsert({
      provider: 'youtube',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: expiresAt,
      channel_id: 'UCNAusixBqK0yaRvJSmE2iFg',
    }, { onConflict: 'provider' });

    res.send(`
      <html><body style="font-family:system-ui;text-align:center;padding:50px">
        <h2>YouTube muvaffaqiyatli bog'landi!</h2>
        <p>Endi blog postlaringiz avtomatik YouTube Community Post ga joylanadi.</p>
        <script>setTimeout(() => window.close(), 2000);</script>
      </body></html>
    `);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * HOOK: New user registered → notify admin
 */
app.post('/api/hooks/new-user', async (req, res) => {
  try {
    const { user_id, full_name, phone } = req.body;
    await supabase.functions.invoke('notify-admin', {
      body: { type: 'new_user', data: { name: full_name || 'Noma\'lum', phone: phone || 'Yo\'q' } }
    });
    res.json({ success: true });
  } catch { res.json({ success: true }); }
});

/**
 * HOOK: New feedback → notify admin
 */
app.post('/api/hooks/feedback', async (req, res) => {
  try {
    const { name, message, email } = req.body;
    await supabase.functions.invoke('notify-admin', {
      body: { type: 'feedback', data: { name: name || 'Noma\'lum', message: message || '', email: email || '' } }
    });
    res.json({ success: true });
  } catch { res.json({ success: true }); }
});

// All other routes serve index.html (SPA fallback)
app.get('*', (req, res) => {
  const indexPath = path.join(ROOT_DIR, 'dist', 'index.html');
  if (require('fs').existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Not Found: dist/index.html missing. Run npm run build.');
  }
});

app.listen(PORT, () => console.log(`вњ… EduContest BFF running at port ${PORT}`));
