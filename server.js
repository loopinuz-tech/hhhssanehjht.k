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
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const { OAuth2Client } = require('google-auth-library');

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

// Middleware (MUST be before Proxy for cookie parsing)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://*.payme.uz", "https://*.click.uz", "https://mc.yandex.ru", "https://cdn.jsdelivr.net", "https://unpkg.com", "https://cdn.onesignal.com", "https://api.onesignal.com"],
      connectSrc: ["'self'", "https://*.supabase.co", "https://api.telegram.org", "https://mc.yandex.ru", "https://cdn.jsdelivr.net", "https://unpkg.com", "https://onesignal.com", "https://cdn.onesignal.com", "https://api.onesignal.com", "wss:"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://fonts.googleapis.com", "data:", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://*.payme.uz", "https://*.click.uz", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
      frameSrc: ["'self'", "https://accounts.google.com", "https://mc.yandex.ru", "https://webvisor.com"],
      workerSrc: ["'self'", "blob:"],
      objectSrc: ["'none'"],
    },
  },
  xFrameOptions: false,
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
}));

const allowedOrigins = [
  'https://www.educontest.uz',
  'https://educontest.uz',
  'https://api.educontest.uz'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || 
        allowedOrigins.includes(origin) || 
        origin.endsWith('.educontest.uz') ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        origin.includes('::1')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

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
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[Proxy Req] ${req.method} ${req.url} -> ${SUPABASE_URL}${req.originalUrl}`);
    try {
      // Ensure host matches target
      proxyReq.setHeader('Host', new URL(SUPABASE_URL).host);

      // Always inject ANON_KEY for Supabase REST API
      const ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      if (ANON_KEY) {
        proxyReq.setHeader('apikey', ANON_KEY);
      }

      // Prefer client Authorization header (Supabase SDK auto-refreshes tokens),
      // fallback to cookie token, then to ANON_KEY
      const clientAuth = req.headers.authorization;
      const accessToken = req.cookies?.['sb-access-token'];

      if (clientAuth && clientAuth.startsWith('Bearer ') && ANON_KEY && !clientAuth.endsWith(ANON_KEY)) {
        proxyReq.setHeader('Authorization', clientAuth);
      } else if (accessToken) {
        proxyReq.setHeader('Authorization', `Bearer ${accessToken}`);
      } else if (ANON_KEY) {
        proxyReq.setHeader('Authorization', `Bearer ${ANON_KEY}`);
      }
    } catch (err) {
      console.error('Proxy auth injection failed:', err);
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    // Supabase Storage `same-origin` CORP header'ini override qilish
    proxyRes.headers['cross-origin-resource-policy'] = 'cross-origin';
    proxyRes.headers['access-control-allow-origin'] = '*';
    console.log(`[Proxy Res] ${req.method} ${req.url} -> ${proxyRes.statusCode}`);
  }
});

// Proxy routes (MUST be before express.json() for POST requests to work)
app.use(['/auth/v1', '/rest/v1', '/storage/v1', '/functions/v1', '/realtime/v1'], supabaseProxy);

app.use(express.json({ limit: '50mb' }));

// PDF parse
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');


// Clients
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// --- UTILS ---

const setAuthCookies = (res, session, req) => {
  const origin = req.get('origin') || req.get('referer') || '';
  const host = req.get('host') || '';
  const isLocal = origin.includes('localhost') || host.includes('localhost');

  // MUHIM: Domainni .educontest.uz deb ko'rsatish (Subdomainlararo session share uchun)
  const domain = isLocal ? undefined : '.educontest.uz';

  const cookieOptions = {
    httpOnly: true,
    secure: !isLocal, // False for localhost
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
  const token = req.cookies?.['sb-access-token'];
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
 * AUTH: Get Current Session
 */
app.get('/api/auth/session', async (req, res) => {
  try {
    const token = req.cookies?.['sb-access-token'];
    console.log('GET /session - Access token present:', !!token);
    if (!token) return res.json({ user: null, profile: null });

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.json({ user: null, profile: null });

    const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle();
    const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', user.id);

    res.json({
      user,
      profile,
      roles: roles?.map(r => r.role) || []
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
  console.log('POST /set-session - Setting cookies for token:', access_token?.substring(0, 10) + '...');
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
  const { phone } = req.body;
  const { data, error } = await supabase.functions.invoke('telegram-auth', {
    body: { action: 'send-otp', phone }
  });
  if (error) return res.status(500).json(error);
  res.json(data);
});

/**
 * AUTH: Register - Send OTP
 */
app.post('/api/auth/register/send-otp', async (req, res) => {
  const { phone } = req.body;
  const cleanPhone = phone.replace(/\D/g, '');

  // Check if user already exists
  const { data: profile } = await supabase.from('profiles').select('user_id').eq('phone', cleanPhone).maybeSingle();
  if (profile) {
    return res.status(400).json({ error: 'Ushbu telefon raqami bilan foydalanuvchi mavjud. Iltimos, tizimga kiring.' });
  }

  const { data, error } = await supabase.functions.invoke('telegram-auth', {
    body: { action: 'send-otp', phone: cleanPhone }
  });
  if (error) return res.status(500).json(error);
  res.json(data);
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
    totalStats,
    subjects,
    leaderboard,
    myRank,
    todayActivity,
    scheduledExams,
    folders
  ] = await Promise.all([
    supabase.from('announcements').select('*').eq('is_active', true).order('created_at', { ascending: false }),
    supabase.from('test_sessions').select('*, test_folders(*)').eq('user_id', req.user.id).not('finished_at', 'is', null).order('finished_at', { ascending: false }).limit(10),
    supabase.from('test_sessions').select('correct_answers, total_questions').eq('user_id', req.user.id).not('finished_at', 'is', null),
    supabase.from('subjects').select('*').eq('is_active', true).order('order_number'),
    supabase.from('leaderboard').select('*').order('rank', { ascending: true }).limit(5),
    supabase.from('leaderboard').select('rank').eq('user_id', req.user.id).maybeSingle(),
    supabase.from('test_sessions').select('*', { count: 'exact', head: true }).eq('user_id', req.user.id).not('finished_at', 'is', null).gte('finished_at', `${today}T00:00:00`),
    supabase.from('scheduled_exams').select('*').eq('is_active', true).gt('scheduled_at', new Date().toISOString()).order('scheduled_at', { ascending: true }).limit(3),
    supabase.from('test_folders').select('id, subject').eq('is_active', true)
  ]);

  const totalSessionsCount = totalStats.data?.length || 0;
  const totalCorrectAnswers = totalStats.data?.reduce((a, s) => a + (s.correct_answers || 0), 0) || 0;
  const totalQuestionsCount = totalStats.data?.reduce((a, s) => a + (s.total_questions || 0), 0) || 0;

  const subjectFolderMap = {};
  folders.data?.forEach(f => {
    const s = f.subject || "Boshqa";
    if (!subjectFolderMap[s]) subjectFolderMap[s] = [];
    subjectFolderMap[s].push(f.id);
  });

  res.json({
    announcements: announcements.data || [],
    sessions: sessions.data || [],
    totalSessionsCount,
    totalCorrectAnswers,
    totalQuestionsCount,
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
 * DATA: User Cards
 */
app.get('/api/user-cards', authRequired, async (req, res) => {
  const { data, error } = await supabase
    .from('user_cards')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });
  if (error) return res.status(400).json(error);
  res.json(data || []);
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
const multer = require('multer');
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB max
});

app.post('/api/storage/upload/:bucket', authRequired, upload.single('file'), async (req, res) => {
  const { bucket } = req.params;
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file uploaded' });

  const fileName = `${req.user.id}/${Date.now()}-${file.originalname}`;
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: true
    });

  if (error) return res.status(500).json(error);

  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
  res.json({ url: publicUrl, path: data.path });
});

/**
 * DATA: Test Folders
 */
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
  try {
    const { messages, model = 'mistral-tiny' } = req.body;
    const apiKey = process.env.MISTRAL_API_KEY;

    if (!apiKey) {
      console.error('[AI] MISTRAL_API_KEY is missing in backend env');
      return res.status(500).json({ error: 'AI configuration error on server' });
    }

    console.log(`[AI] Calling Mistral directly for user ${req.user.id}`);

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[AI] Mistral API error:', data);
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (err) {
    console.error('[AI] Critical error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

/**
 * PDF: Extract text from uploaded PDF
 */
app.post('/api/pdf/extract', upload.single('pdf'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'PDF fayl yuklanmadi' });

    const doc = await pdfjsLib.getDocument({ data: new Uint8Array(file.buffer) }).promise;
    let text = '';
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(item => item.str).join(' ') + '\n\n';
    }

    res.json({ text, pages: doc.numPages });
  } catch (err) {
    console.error('[PDF] Parse error:', err);
    res.status(500).json({ error: 'PDF o\'qishda xatolik', details: err.message });
  }
});

// --- HEALTH CHECK ---
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (require('fs').existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Not Found: dist/index.html missing. Run npm run build.');
  }
});

app.listen(PORT, () => console.log(`✅ EduContest BFF running at port ${PORT}`));
