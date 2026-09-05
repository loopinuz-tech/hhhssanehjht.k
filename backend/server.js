/**
 * EduContest BFF (Backend-for-Frontend) Server
 * Principal Architect Implementation
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.backend') });
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config();

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { OAuth2Client } = require('google-auth-library');

const { Pool } = require('pg');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;

// Config
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://rlawsubbcfphsmqbteby.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_UksjV0hDGabu-6G_87-qyg_xGJVf9rW';
const rawSecretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_SERVICE_ROLE = (rawSecretKey && !rawSecretKey.startsWith('sb_secret_')) ? rawSecretKey : SUPABASE_ANON_KEY;

// InPay Configuration
const INPAY_MERCHANT_ID = process.env.INPAY_MERCHANT_ID || process.env.MERCHANT_ID || '39664';
const INPAY_MERCHANT_TOKEN = process.env.INPAY_MERCHANT_TOKEN || process.env.MERCHANT_TOKEN || '90e961b0f510dc06f1a5c83b41420655';
const INPAY_BASE_URL = process.env.INPAY_BASE_URL || 'https://inpay.uz';

console.log(`💳 InPay Config: Merchant ID = ${INPAY_MERCHANT_ID}`);


if (!SUPABASE_SERVICE_ROLE) {
  console.error('❌ CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing in .env');
} else {
  console.log('✅ SUPABASE_SERVICE_ROLE_KEY is loaded');
}

const DATABASE_URL = process.env.DATABASE_URL || "postgres://postgres.rlawsubbcfphsmqbteby:%40Mr.medixa.26@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres";
const pgPool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function syncAuthUserPasswordInDb(email, password, chatId, cleanPhone) {
  try {
    const phoneWithPlus = cleanPhone ? '+' + cleanPhone : '';
    await pgPool.query("CREATE EXTENSION IF NOT EXISTS pgcrypto;");
    await pgPool.query(
      `UPDATE auth.users 
       SET encrypted_password = crypt($1, gen_salt('bf')), 
           email_confirmed_at = COALESCE(email_confirmed_at, now()) 
       WHERE email = $2 
          OR email LIKE $3 
          OR (phone IS NOT NULL AND (phone = $4 OR phone = $5))`,
      [password, email, `%${chatId}%`, cleanPhone, phoneWithPlus]
    );
  } catch (err) {
    console.error('[DB Auth Password Sync Error]:', err?.message);
  }
}

/**
 * Enterprise DDoS & Bot / Flood Protection Shield
 */
class DDoSProtectionShield {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 60 * 1000;
    this.maxGeneralRequests = options.maxGeneralRequests || 150;
    this.maxSensitiveRequests = options.maxSensitiveRequests || 20;
    this.banDurationMs = options.banDurationMs || 15 * 60 * 1000;
    this.requests = new Map();
    this.bannedIPs = new Map();
    this.suspiciousCounts = new Map();

    setInterval(() => this.cleanup(), 2 * 60 * 1000);
  }

  getIp(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    return req.headers['x-real-ip'] || req.socket.remoteAddress || '127.0.0.1';
  }

  isBanned(ip) {
    if (!this.bannedIPs.has(ip)) return false;
    const banExpiry = this.bannedIPs.get(ip);
    if (Date.now() > banExpiry) {
      this.bannedIPs.delete(ip);
      this.suspiciousCounts.delete(ip);
      return false;
    }
    return true;
  }

  ban(ip, reason = 'Excessive requests') {
    console.warn(`[DDoS Shield] 🚨 BANNED IP: ${ip} for 15 minutes. Reason: ${reason}`);
    this.bannedIPs.set(ip, Date.now() + this.banDurationMs);
  }

  isSuspiciousRequest(req) {
    const url = req.originalUrl?.toLowerCase() || '';
    const ua = req.headers['user-agent']?.toLowerCase() || '';

    const exploitPatterns = [
      'wp-login.php', 'wp-admin', 'phpmyadmin', '.env', '.git/',
      'etc/passwd', 'select%20', 'union%20select', '<script', 'cmd.exe',
      'eval(', 'base64_decode', '../../', 'boot.ini'
    ];

    const isExploitPath = exploitPatterns.some(pattern => url.includes(pattern));
    const isBadUserAgent = /sqlmap|nikto|zgrab|nmap|dirbuster|gobuster|masscan|netsparker|acunetix/i.test(ua);

    return isExploitPath || isBadUserAgent;
  }

  middleware() {
    return (req, res, next) => {
      const ip = this.getIp(req);

      // Whitelist localhost for local development & testing
      if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || ip === 'localhost') {
        return next();
      }

      if (this.isBanned(ip)) {
        res.setHeader('Retry-After', Math.ceil(this.banDurationMs / 1000));
        return res.status(429).json({
          error: 'Forbidden',
          message: 'Tizim xavfsizlik qalqoni: IP manzilingiz shubhali so\'rovlar tufayli vaqtincha bloklandi (429).'
        });
      }

      if (this.isSuspiciousRequest(req)) {
        const count = (this.suspiciousCounts.get(ip) || 0) + 1;
        this.suspiciousCounts.set(ip, count);
        console.warn(`[DDoS Shield] ⚠️ Exploit scanner detected from IP: ${ip} (${count}/3)`);

        if (count >= 3) {
          this.ban(ip, 'Malicious exploit / vulnerability scanner attack');
          return res.status(403).json({ error: 'Access Denied', message: 'Hujum harakati aniqlandi va IP bloklandi.' });
        }
        return res.status(400).json({ error: 'Bad Request' });
      }

      const now = Date.now();
      const userTimestamps = this.requests.get(ip) || [];
      const validTimestamps = userTimestamps.filter(ts => now - ts < this.windowMs);

      const isSensitive = req.originalUrl?.includes('/auth/login') ||
        req.originalUrl?.includes('/auth/telegram') ||
        req.originalUrl?.includes('/auth/google') ||
        req.originalUrl?.includes('/auth/register') ||
        req.originalUrl?.includes('/coupons') ||
        req.originalUrl?.includes('/create-payment') ||
        req.originalUrl?.includes('/payment');

      const maxAllowed = isSensitive ? this.maxSensitiveRequests : this.maxGeneralRequests;

      if (validTimestamps.length >= maxAllowed) {
        console.warn(`[DDoS Shield] ⚠️ Rate limit exceeded for IP ${ip} (${validTimestamps.length}/${maxAllowed} req/min)`);

        if (validTimestamps.length >= maxAllowed * 3) {
          this.ban(ip, 'Volumetric DDoS Attack Flood');
        }

        res.setHeader('Retry-After', '60');
        res.setHeader('X-RateLimit-Limit', maxAllowed);
        res.setHeader('X-RateLimit-Remaining', 0);
        return res.status(429).json({
          error: 'Too Many Requests',
          message: 'Tizimga juda ko\'p so\'rov yuborildi. Iltimos, 1 daqiqadan so\'ng qayta urinib ko\'ring.'
        });
      }

      validTimestamps.push(now);
      this.requests.set(ip, validTimestamps);

      res.setHeader('X-RateLimit-Limit', maxAllowed);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxAllowed - validTimestamps.length));

      next();
    };
  }

  getStats() {
    return {
      activeIPCount: this.requests.size,
      bannedIPCount: this.bannedIPs.size,
      bannedIPs: Array.from(this.bannedIPs.keys())
    };
  }

  cleanup() {
    const now = Date.now();
    for (const [ip, timestamps] of this.requests.entries()) {
      const valid = timestamps.filter(ts => now - ts < this.windowMs);
      if (valid.length === 0) {
        this.requests.delete(ip);
      } else {
        this.requests.set(ip, valid);
      }
    }
  }
}

const ddosShield = new DDoSProtectionShield();

// 1. Attach DDoS Protection Shield first
app.use(ddosShield.middleware());

// Payload size limit guard against memory overflow DDoS
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));

// Security Status Monitoring API
app.get('/api/security/ddos-status', (req, res) => {
  res.json({
    status: 'ACTIVE',
    shield: 'EduContest Enterprise DDoS & Anti-Bot Shield',
    stats: ddosShield.getStats()
  });
});

// Middleware (MUST be before Proxy for cookie parsing)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "blob:", "https://*.payme.uz", "https://*.click.uz", "https://accounts.google.com", "https://static.cloudflareinsights.com", "https://mc.yandex.ru", "https://*.yandex.ru", "https://*.yandex.net", "https://cdn.jsdelivr.net", "https://unpkg.com", "https://cdn.onesignal.com", "https://api.onesignal.com", "https://onesignal.com", "https://www.googletagmanager.com", "https://consent.cookiebot.com", "https://consentcdn.cookiebot.com", "https://pagead2.googlesyndication.com", "https://*.googlesyndication.com", "https://googlesyndication.com", "https://*.doubleclick.net", "https://doubleclick.net", "https://*.googleadservices.com", "https://googleadservices.com", "https://*.google.com", "https://google.com", "https://*.adtrafficquality.google", "https://adtrafficquality.google"],
      connectSrc: ["'self'", "https://*.supabase.co", "https://rcxfryjvdkmtbqivbrjg.supabase.co", "https://api.telegram.org", "https://mc.yandex.ru", "https://*.yandex.ru", "https://*.yandex.net", "https://cdn.jsdelivr.net", "https://unpkg.com", "https://onesignal.com", "https://cdn.onesignal.com", "https://api.onesignal.com", "https://api.educontest.uz", "https://*.educontest.uz", "wss:", "https://www.googletagmanager.com", "https://*.google-analytics.com", "https://*.analytics.google.com", "https://consent.cookiebot.com", "https://consentcdn.cookiebot.com", "https://pagead2.googlesyndication.com", "https://*.googlesyndication.com", "https://googlesyndication.com", "https://*.doubleclick.net", "https://doubleclick.net", "https://*.googleadservices.com", "https://googleadservices.com", "https://*.google.com", "https://google.com", "https://*.adtrafficquality.google", "https://adtrafficquality.google"],
      imgSrc: ["'self'", "data:", "blob:", "https:", "https://mc.yandex.ru", "https://*.google-analytics.com", "https://*.googletagmanager.com", "https://*.googlesyndication.com", "https://googlesyndication.com", "https://*.doubleclick.net", "https://doubleclick.net", "https://*.gstatic.com", "https://gstatic.com", "https://*.google.com", "https://google.com", "https://*.adtrafficquality.google", "https://adtrafficquality.google"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://fonts.googleapis.com", "data:", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://*.payme.uz", "https://*.click.uz", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net", "https://www.googletagmanager.com"],
      frameSrc: ["'self'", "https://accounts.google.com", "https://mc.yandex.ru", "https://webvisor.com", "https://consent.cookiebot.com", "https://consentcdn.cookiebot.com", "https://googleads.g.doubleclick.net", "https://*.googlesyndication.com", "https://googlesyndication.com", "https://*.doubleclick.net", "https://doubleclick.net", "https://*.google.com", "https://google.com", "https://*.adtrafficquality.google", "https://adtrafficquality.google", "https://yandex.com", "https://*.yandex.com", "https://*.yandex.ru"],
      workerSrc: ["'self'", "blob:"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
    },
  },
  xFrameOptions: false,
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
}));

const allowedOrigins = [
  'https://www.educontest.uz',
  'https://educontest.uz',
  'https://api.educontest.uz',
  'https://hhhssanehjht-k.onrender.com',
  'http://localhost:8080',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin ||
      allowedOrigins.includes(origin) ||
      origin.endsWith('.educontest.uz') ||
      origin.includes('onrender.com') ||
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

// PDF parse (Safe fallback resolution for Node.js CJS environments)
let pdfjsLib;
try {
  pdfjsLib = require('pdfjs-dist/build/pdf.js');
} catch (e1) {
  try {
    pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
  } catch (e2) {
    try {
      pdfjsLib = require('pdfjs-dist');
    } catch (e3) {
      console.warn('⚠️ pdfjs-dist load warning:', e3.message);
    }
  }
}


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
  try {
    const cookieToken = req.cookies?.['sb-access-token'];
    const authHeader = req.headers.authorization;
    const token = cookieToken || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null);
    if (!token) return res.status(401).json({ error: 'Session expired' });

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: 'Invalid session' });

    req.user = user;
    next();
  } catch (err) {
    console.error('authRequired error:', err);
    res.status(500).json({ error: 'Internal server error in auth middleware', details: err.message });
  }
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
    const cookieToken = req.cookies?.['sb-access-token'];
    const authHeader = req.headers.authorization;
    const token = cookieToken || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null);
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
  try {
    const { data, error } = await supabase.functions.invoke('telegram-auth', { method: 'GET' });
    if (!error && data) return res.json(data);
  } catch (e) { }
  res.json({ botUsername: process.env.TELEGRAM_BOT_USERNAME || 'educontesttbot' });
});

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_API_KEY || process.env.TELEGRAM_BOT_TOKEN || '8781193519:AAEzzm70iEhbT8oupxoi0L6e-i3RLUWDLB4';

async function sendTelegramMessage(chatId, text, replyMarkup = null) {
  try {
    const body = {
      chat_id: chatId,
      text,
      parse_mode: 'HTML'
    };
    if (replyMarkup) body.reply_markup = replyMarkup;

    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  } catch (err) {
    console.error('Telegram send message error:', err);
  }
}

app.post(['/api/telegram-webhook', '/functions/v1/telegram-bot'], async (req, res) => {
  try {
    const update = req.body || {};
    console.log('[Telegram Webhook Update]:', JSON.stringify(update));
    if (update.message) {
      const message = update.message;
      const chatId = message.chat?.id || message.from?.id;

      if (chatId && message.text && message.text.startsWith('/start')) {
        await sendTelegramMessage(chatId, '👋 Educontest platformasiga xush kelibsiz!\n\n📱 Kirish uchun telefon raqamingizni yuboring:', {
          keyboard: [[{ text: '📱 Telefon raqamni yuborish', request_contact: true }]],
          resize_keyboard: true,
          one_time_keyboard: true
        });
      } else if (chatId && message.contact) {
        let phone = message.contact.phone_number || '';
        if (phone && !phone.startsWith('+')) phone = '+' + phone;

        // Clean old codes for this user safely
        try {
          await supabase.from('telegram_auth_codes').delete().eq('chat_id', chatId);
        } catch (delErr) {
          console.warn('[Telegram Webhook] Delete old codes warn:', delErr);
        }

        const fullName = [message.contact.first_name, message.contact.last_name].filter(Boolean).join(' ') || 'Foydalanuvchi';

        // Try inserting up to 5 times in case of code collision
        let code = '';
        let insertErr = null;
        for (let attempt = 0; attempt < 5; attempt++) {
          code = String(Math.floor(100000 + Math.random() * 900000));
          const { error } = await supabase.from('telegram_auth_codes').insert({
            code,
            chat_id: chatId,
            phone,
            full_name: fullName
          });
          if (!error) {
            insertErr = null;
            break;
          }
          insertErr = error;
        }

        if (insertErr) {
          console.error('[Telegram Webhook] DB Insert Error:', JSON.stringify(insertErr));
          await sendTelegramMessage(chatId, '❌ Xatolik yuz berdi. Qayta urinib ko\'ring: /start');
        } else {
          console.log(`[Telegram Webhook] Code ${code} generated for chat_id ${chatId} (${phone})`);
          await sendTelegramMessage(chatId, `✅ Tasdiqlash kodi: <code>${code}</code>\n\n<i>(Kodni nusxalash uchun ustiga bosing)</i>`);
        }
      }
    }
  } catch (e) {
    console.error('Telegram Webhook error:', e);
  }
  res.json({ ok: true });
});

/**
 * PAYMENT: Submit Payment Request (Service Role endpoint to bypass RLS 403 Forbidden)
 */
app.post('/api/payment-requests', async (req, res) => {
  try {
    const { user_id, amount, receipt_url, notes, note } = req.body;
    if (!user_id || !amount) {
      return res.status(400).json({ error: 'user_id and amount are required' });
    }

    const payload = {
      user_id,
      amount: Number(amount),
      receipt_url: receipt_url || null,
      status: 'pending',
      notes: notes || note || "Karta orqali o'tkazma",
      note: note || notes || "Karta orqali o'tkazma",
    };

    let { data, error } = await supabase.from('payment_requests').insert(payload).select().single();
    if (error) {
      const { data: fbData, error: fbErr } = await supabase.from('payment_requests').insert({
        user_id,
        amount: Number(amount),
        receipt_url: receipt_url || null,
        status: 'pending',
      }).select().single();
      if (fbErr) throw fbErr;
      return res.json({ success: true, data: fbData });
    }

    return res.json({ success: true, data });
  } catch (err) {
    console.error('Payment request server error:', err);
    return res.status(500).json({ error: err.message || 'Failed to insert payment request' });
  }
});

/**
 * ============================================================================
 * INPAY OFFICIAL REST API & WEBHOOK INTEGRATION (https://inpay.uz/api/v1/)
 * ============================================================================
 */

let cachedInPayBearerToken = null;
let inPayTokenExpiresAt = 0;

/**
 * 0. INPAY AUTH: Obtain and Cache 24h Bearer Token
 * GET /api/v1/authorization/?merchant_id=...&merchant_token=...
 */
async function getInPayBearerToken() {
  const now = Date.now();
  if (cachedInPayBearerToken && now < inPayTokenExpiresAt) {
    return cachedInPayBearerToken;
  }

  try {
    const authUrl = `https://inpay.uz/api/v1/authorization/?merchant_id=${INPAY_MERCHANT_ID}&merchant_token=${INPAY_MERCHANT_TOKEN}`;
    const response = await fetch(authUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    const data = await response.json();

    if (data && data.success && data.bearer_token) {
      cachedInPayBearerToken = data.bearer_token;
      // Cache for 23 hours to safely handle expiration
      inPayTokenExpiresAt = Date.now() + (23 * 60 * 60 * 1000);
      console.log('✅ [InPay Auth] New Bearer Token obtained & cached');
      return cachedInPayBearerToken;
    } else {
      console.error('❌ [InPay Auth Failed]:', data);
    }
  } catch (err) {
    console.error('❌ [InPay Auth Exception]:', err?.message);
  }
  return null;
}

/**
 * 1. INPAY: Create Payment Invoice
 * POST /api/v1/create/ via official InPay API
 * Body: { user_id, amount, description, phone, payment_method }
 */
app.post('/api/payments/inpay/create', async (req, res) => {
  try {
    const { user_id, amount, description, notes, phone, payment_method, return_url } = req.body;
    const numAmount = Number(amount);

    if (!user_id || !numAmount || numAmount < 1000) {
      return res.status(400).json({
        success: false,
        error: 'user_id and valid amount (minimum 1000 UZS) are required',
        error_code: 'AMOUNT_TOO_LOW'
      });
    }

    const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || req.ip || '';
    const callbackUrl = process.env.VITE_API_URL 
      ? `${process.env.VITE_API_URL}/api/webhooks/inpay`
      : 'https://api.educontest.uz/api/webhooks/inpay';

    const bearerToken = await getInPayBearerToken();

    // Call official InPay API endpoint POST /api/v1/create/
    if (bearerToken) {
      try {
        const createRes = await fetch('https://inpay.uz/api/v1/create/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${bearerToken}`
          },
          body: JSON.stringify({
            merchant_id: String(INPAY_MERCHANT_ID),
            token: String(INPAY_MERCHANT_TOKEN),
            amount: numAmount,
            description: description || notes || `EduContest Hisob to'ldirish (User #${user_id})`,
            payment_method: payment_method || undefined,
            callback_url: callbackUrl,
            return_url: return_url || 'https://educontest.uz/dashboard',
            phone: phone || undefined,
            client_ip: clientIp || undefined
          })
        });

        const inpayData = await createRes.json();
        console.log('💳 [InPay Create API Response]:', inpayData);

        if (inpayData && inpayData.success && inpayData.pay_url) {
          // Record payment request in Supabase with fallback
          let requestData = null;
          try {
            const { data } = await supabase
              .from('payment_requests')
              .insert({
                user_id,
                amount: numAmount,
                status: 'pending',
                notes: description || notes || `InPay Invoice #${inpayData.order_id}`,
                note: `order_id:${inpayData.order_id}|inpay_invoice`,
              })
              .select()
              .single();
            requestData = data;
          } catch (e) {}

          if (!requestData) {
            try {
              const { data: fbData } = await supabase
                .from('payment_requests')
                .insert({
                  user_id,
                  amount: numAmount,
                  status: 'pending',
                  note: `order_id:${inpayData.order_id}|inpay_invoice`,
                })
                .select()
                .single();
              requestData = fbData;
            } catch (e) {}
          }

          return res.json({
            success: true,
            order_id: inpayData.order_id,
            checkout_url: inpayData.pay_url,
            pay_url: inpayData.pay_url,
            amount: numAmount,
            status: 'pending',
            message: inpayData.message || 'Invoice successfully created',
            payment_request: requestData || null
          });
        } else {
          return res.status(400).json({
            success: false,
            error: inpayData?.message || 'InPay invoice yaratishda xatolik',
            error_code: inpayData?.error_code || 'INPAY_CREATE_FAILED',
            details: inpayData
          });
        }
      } catch (apiErr) {
        console.error('⚠️ [InPay API Create Exception]:', apiErr?.message);
        return res.status(500).json({
          success: false,
          error: 'InPay serveri bilan bog\'lanishda xatolik: ' + apiErr?.message
        });
      }
    }

    return res.status(400).json({
      success: false,
      error: 'InPay Bearer token olib bo\'lmadi. Merchant sozlamalarini tekshiring.'
    });
  } catch (err) {
    console.error('[InPay Create Error]:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to initialize InPay checkout' });
  }
});

/**
 * 2. INPAY: Official Webhook Receiver
 * POST /api/webhooks/inpay
 * Receives: { amount: "15000.00", status: "success", order_id: "...", transaction_id: 149, created_at: "..." }
 */
const handleInPayWebhook = async (req, res) => {
  try {
    console.log('🔔 [INPAY WEBHOOK RECEIVED]:', JSON.stringify(req.body, null, 2));

    const { amount, status, order_id, transaction_id } = req.body || {};
    const orderId = order_id || req.body?.merchant_trans_id || req.query?.order_id;
    const rawStatus = status || req.body?.state || req.query?.status || 'success';
    const numAmount = Number(amount || req.query?.amount || 0);

    const isSuccess = String(rawStatus).toLowerCase() === 'success' || 
                      String(rawStatus).toLowerCase() === 'completed' || 
                      String(rawStatus).toLowerCase() === 'paid' || 
                      rawStatus === 1 || rawStatus === 2;

    const newStatus = isSuccess ? 'completed' : 'failed';

    if (orderId) {
      // Find matching payment request in Supabase
      const { data: existingRecords } = await supabase
        .from('payment_requests')
        .select('*')
        .or(`note.ilike.%${orderId}%,notes.ilike.%${orderId}%`)
        .limit(1);

      if (existingRecords && existingRecords.length > 0) {
        const record = existingRecords[0];

        // Update payment request status
        await supabase
          .from('payment_requests')
          .update({
            status: newStatus,
            updated_at: new Date().toISOString(),
            notes: `${record.notes || ''} | InPay Trans #${transaction_id || ''} Status: ${newStatus}`
          })
          .eq('id', record.id);

        // If success, update user profile balance in Postgres
        if (isSuccess && record.user_id) {
          const creditAmount = numAmount > 0 ? numAmount : Number(record.amount);
          try {
            await pgPool.query(
              `UPDATE profiles SET balance = COALESCE(balance, 0) + $1 WHERE id = $2`,
              [creditAmount, record.user_id]
            ).catch(() => {});

            // Record transaction in wallet_transactions
            await supabase.from('wallet_transactions').insert({
              user_id: record.user_id,
              amount: creditAmount,
              type: 'deposit',
              description: `InPay To'lovi (Order #${orderId})`,
              status: 'success'
            }).catch(() => {});
          } catch (bErr) {
            console.error('[InPay Webhook Credit Error]:', bErr?.message);
          }
        }
      }
    }

    // Must return HTTP 200 OK according to InPay docs
    return res.status(200).send('OK');
  } catch (err) {
    console.error('❌ [INPAY WEBHOOK ERROR]:', err);
    return res.status(200).send('OK'); // Return 200 to prevent infinite retry loops if handled
  }
};

app.post('/api/webhooks/inpay', express.json(), handleInPayWebhook);
app.post('/api/payments/inpay/webhook', express.json(), handleInPayWebhook);
app.get('/api/webhooks/inpay', handleInPayWebhook);

/**
 * 3. INPAY: Transaction Status Poll
 * GET /api/payments/inpay/status/:orderId
 * Fetches status from inPAY API or local database
 */
app.get('/api/payments/inpay/status/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    // Check local database first
    const { data: records } = await supabase
      .from('payment_requests')
      .select('*')
      .or(`note.ilike.%${orderId}%,notes.ilike.%${orderId}%`)
      .limit(1);

    if (records && records.length > 0) {
      return res.json({
        success: true,
        order_id: orderId,
        status: records[0].status === 'completed' ? 'success' : records[0].status,
        amount: records[0].amount,
        updated_at: records[0].updated_at || records[0].created_at
      });
    }

    // Fallback: Query official inPAY API
    try {
      const apiRes = await fetch(`https://inpay.uz/api/v1/transactions/?order_id=${orderId}`, {
        headers: { 'Accept': 'application/json' }
      });
      const apiData = await apiRes.json();
      if (apiData && apiData.success) {
        return res.json(apiData);
      }
    } catch (e) { }

    return res.status(404).json({ success: false, message: 'Payment order not found' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});



// --- Security: Rate Limiting & Server-Side Device Block Verification ---
const signupAttemptsMap = new Map();

function checkRateLimit(ip, fingerprint) {
  if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || ip === 'localhost') {
    return true; // Bypass rate limit for local development
  }

  const now = Date.now();
  const key = `${ip || 'noip'}_${fingerprint || 'nofp'}`;
  const record = signupAttemptsMap.get(key) || { count: 0, resetTime: now + 3600000 };

  if (now > record.resetTime) {
    record.count = 0;
    record.resetTime = now + 3600000;
  }

  record.count += 1;
  signupAttemptsMap.set(key, record);

  if (record.count > 5) {
    return false; // Rate limit exceeded (max 5 signup/OTP attempts per hour)
  }
  return true;
}

async function verifyDeviceNotBlocked(req, res) {
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.headers['cf-connecting-ip'] || req.ip;
  const fingerprint = req.body?.fingerprint || req.headers['x-device-fingerprint'] || null;

  // 1. Rate limit check
  if (!checkRateLimit(clientIp, fingerprint)) {
    res.status(429).json({ error: 'Juda ko\'p urinishlar bajarildi. Iltimos 1 soatdan so\'ng qayta urinib ko\'ring.' });
    return false;
  }

  // 2. Check blocked_devices in DB using check_device_blocked RPC or fallback
  try {
    const { data: rpcData } = await supabase.rpc('check_device_blocked', {
      p_fingerprint: fingerprint || null,
      p_ip: clientIp || null
    });

    if (rpcData && rpcData.is_blocked) {
      res.status(403).json({
        error: 'Ushbu qurilma yoki IP manzil EduContest platformasidan bloklangan.',
        blocked: true,
        reason: rpcData.reason || 'Qurilma taqiqlangan'
      });
      return false;
    }
  } catch (_) {}

  // Direct table check fallback
  if (fingerprint) {
    const { data: fpMatch } = await supabase
      .from('blocked_devices')
      .select('id, reason')
      .eq('fingerprint', fingerprint)
      .maybeSingle();

    if (fpMatch) {
      res.status(403).json({
        error: 'Ushbu qurilma EduContest platformasidan bloklangan.',
        blocked: true,
        reason: fpMatch.reason || 'Qurilma taqiqlangan'
      });
      return false;
    }
  }

  if (clientIp) {
    const { data: ipMatch } = await supabase
      .from('blocked_devices')
      .select('id, reason')
      .eq('ip_address', clientIp)
      .maybeSingle();

    if (ipMatch) {
      res.status(403).json({
        error: 'Ushbu IP manzil EduContest platformasidan bloklangan.',
        blocked: true,
        reason: ipMatch.reason || 'IP taqiqlangan'
      });
      return false;
    }
  }

  return true;
}

app.get('/api/auth/client-ip', (req, res) => {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.headers['cf-connecting-ip'] || req.ip || null;
  res.json({ ip });
});

/**
 * AUTH: Check Device Block Status Endpoint
 */
app.post('/api/auth/check-device-block', async (req, res) => {
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.headers['cf-connecting-ip'] || req.ip;
  const { fingerprint, ip_address } = req.body || {};
  const targetIp = ip_address || clientIp;

  try {
    const { data, error } = await supabase.rpc('check_device_blocked', {
      p_fingerprint: fingerprint || null,
      p_ip: targetIp || null
    });

    if (error || !data) {
      let blocked = false;
      let reason = null;
      if (fingerprint) {
        const { data: fpMatch } = await supabase.from('blocked_devices').select('id, reason').eq('fingerprint', fingerprint).maybeSingle();
        if (fpMatch) { blocked = true; reason = fpMatch.reason; }
      }
      if (!blocked && targetIp) {
        const { data: ipMatch } = await supabase.from('blocked_devices').select('id, reason').eq('ip_address', targetIp).maybeSingle();
        if (ipMatch) { blocked = true; reason = ipMatch.reason; }
      }
      return res.json({ blocked, reason });
    }

    return res.json({ blocked: !!data.is_blocked, reason: data.reason });
  } catch (err) {
    return res.status(500).json({ blocked: false, error: err.message });
  }
});

app.post('/api/auth/telegram/send-otp', async (req, res) => {
  const allowed = await verifyDeviceNotBlocked(req, res);
  if (!allowed) return;
  res.json({ success: true, message: 'Iltimos, botni ochib /start bosing.' });
});

/**
 * AUTH: Register - Send OTP
 */
app.post('/api/auth/register/send-otp', async (req, res) => {
  const allowed = await verifyDeviceNotBlocked(req, res);
  if (!allowed) return;

  const { phone } = req.body || {};
  const cleanPhone = phone ? phone.replace(/\D/g, '') : '';

  if (cleanPhone) {
    const { data: profile } = await supabase.from('profiles').select('user_id').eq('phone', cleanPhone).maybeSingle();
    if (profile) {
      return res.status(400).json({ error: 'Ushbu telefon raqami bilan foydalanuvchi mavjud. Iltimos, tizimga kiring.' });
    }
  }

  res.json({ success: true, message: 'Iltimos, botni ochib /start bosing.' });
});

app.post('/api/auth/telegram/verify-otp', async (req, res) => {
  const allowed = await verifyDeviceNotBlocked(req, res);
  if (!allowed) return;

  const { phone, code } = req.body;

  const cleanCode = (code || '').replace(/\D/g, '').trim();
  const inputPhone = (phone || '').replace(/\D/g, '');

  try {
    // 1. Query auth code record
    const { data: codeRecord } = await supabase
      .from('telegram_auth_codes')
      .select('*')
      .eq('code', cleanCode)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!codeRecord) {
      return res.status(400).json({ error: 'Tasdiqlash kodi noto\'g\'ri yoki topilmadi.' });
    }

    if (codeRecord.expires_at && new Date(codeRecord.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Tasdiqlash kodi eskirgan. Iltimos, yangi kod oling: /start' });
    }

    if (codeRecord.verified) {
      return res.status(400).json({ error: 'Bu kod allaqachon ishlatilgan.' });
    }

    // Mark code as verified
    await supabase.from('telegram_auth_codes').update({ verified: true }).eq('id', codeRecord.id);

    const chatId = codeRecord.chat_id;
    const cleanPhone = (inputPhone || codeRecord.phone || '').replace(/\D/g, '');
    const phoneWithPlus = cleanPhone ? '+' + cleanPhone : '';
    const email = `tg_${chatId}@educontest.uz`;
    const password = `tg_secret_${chatId}_educontest_2026`;
    const finalName = codeRecord.full_name || 'Foydalanuvchi';

    // 1. Find existing profile by chatId OR cleanPhone OR phoneWithPlus
    let existingProfile = null;
    if (chatId) {
      const { data: pChat } = await supabase.from('profiles').select('id, user_id, phone, telegram_chat_id, email').eq('telegram_chat_id', chatId).maybeSingle();
      if (pChat) existingProfile = pChat;
    }
    if (!existingProfile && cleanPhone) {
      const { data: pPhone } = await supabase.from('profiles').select('id, user_id, phone, telegram_chat_id, email').or(`phone.eq.${cleanPhone},phone.eq.${phoneWithPlus}`).maybeSingle();
      if (pPhone) existingProfile = pPhone;
    }

    const targetEmail = existingProfile?.email || email;
    let signInData = null;

    // 2. Try direct signInWithPassword first
    let { data: loginAttempt } = await supabase.auth.signInWithPassword({
      email: targetEmail,
      password
    });

    if (loginAttempt?.session) {
      signInData = loginAttempt;
    } else {
      // 3. If password mismatch or user exists in DB, sync password in auth.users via PostgreSQL pgcrypto
      await syncAuthUserPasswordInDb(targetEmail, password, chatId, cleanPhone);

      const retryRes = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password
      });

      if (retryRes.data?.session) {
        signInData = retryRes.data;
      }
    }

    // 4. If brand new user, create account via signUp
    if (!signInData?.session) {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: targetEmail,
        password,
        options: { data: { full_name: finalName, phone: cleanPhone } }
      });

      if (signUpError) {
        // Fallback: sync DB password again and retry signIn
        await syncAuthUserPasswordInDb(targetEmail, password, chatId, cleanPhone);
        const finalTry = await supabase.auth.signInWithPassword({ email: targetEmail, password });
        if (finalTry.data?.session) {
          signInData = finalTry.data;
        } else {
          return res.status(400).json({ error: 'Kirishda xatolik yuz berdi. Qayta urinib ko\'ring.' });
        }
      } else if (signUpData?.session) {
        signInData = signUpData;
      } else {
        await new Promise(r => setTimeout(r, 500));
        const retry = await supabase.auth.signInWithPassword({ email: targetEmail, password });
        if (retry.data?.session) {
          signInData = retry.data;
        } else {
          return res.status(400).json({ error: 'Tizimga kirish amalga oshmadi. Qayta urinib ko\'ring.' });
        }
      }
    }

    // 5. Ensure profile is updated/linked
    const finalUserId = signInData.user.id;
    if (existingProfile) {
      await supabase.from('profiles').update({
        user_id: finalUserId,
        telegram_chat_id: chatId,
        phone: cleanPhone || undefined
      }).eq('id', existingProfile.id);
    } else {
      await supabase.from('profiles').upsert({
        user_id: finalUserId,
        full_name: finalName,
        phone: cleanPhone,
        telegram_chat_id: chatId
      }, { onConflict: 'user_id' });
    }

    setAuthCookies(res, signInData.session, req);
    return res.json({ success: true, user: signInData.user, session: signInData.session });
  } catch (err) {
    console.error('[Verify-OTP] Unexpected error:', err);
    res.status(500).json({ error: 'Serverda verifikatsiya xatoligi: ' + err.message });
  }
});

/**
 * AUTH: Register - Verify OTP
 */
app.post('/api/auth/register/verify', async (req, res) => {
  const allowed = await verifyDeviceNotBlocked(req, res);
  if (!allowed) return;

  const { phone, code, full_name, role } = req.body;
  const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
  const cleanCode = (code || '').trim();

  try {
    // Check code in DB directly (no Edge Function - CORS safe)
    const { data: codeRecord } = await supabase
      .from('telegram_auth_codes')
      .select('*')
      .eq('code', cleanCode)
      .maybeSingle();

    if (!codeRecord) {
      return res.status(400).json({ error: 'Tasdiqlash kodi noto\'g\'ri yoki topilmadi.' });
    }

    if (codeRecord.expires_at && new Date(codeRecord.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Tasdiqlash kodi eskirgan. Iltimos, yangi kod oling: /start' });
    }

    if (codeRecord.verified) {
      return res.status(400).json({ error: 'Bu kod allaqachon ishlatilgan.' });
    }

    await supabase.from('telegram_auth_codes').update({ verified: true }).eq('id', codeRecord.id);

    const chatId = codeRecord.chat_id;
    const recordPhone = (codeRecord.phone || '').replace(/\D/g, '');
    const finalPhone = cleanPhone || recordPhone;
    const email = `tg_${chatId}@educontest.uz`;
    const password = `tg_secret_${chatId}_educontest_2026`;
    const finalName = full_name || codeRecord.full_name || 'Foydalanuvchi';

    // Try sign in first (existing user)
    let { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError || !signInData?.session) {
      // User doesn't exist — create with signUp
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: finalName, phone: finalPhone } }
      });

      if (signUpError) {
        return res.status(400).json({ error: 'Foydalanuvchi yaratishda xatolik: ' + signUpError.message });
      }

      // If signUp returned a session (email confirmation disabled), use it directly
      if (signUpData?.session) {
        signInData = signUpData;
      } else {
        // Email confirmation is enabled in Supabase — try sign in after short delay
        await new Promise(r => setTimeout(r, 500));
        const retry = await supabase.auth.signInWithPassword({ email, password });
        if (retry.data?.session) {
          signInData = retry.data;
        } else {
          // Cannot sign in — email confirmation is blocking login.
          // Profile is created, but session unavailable.
          // Instruct user to disable "Confirm email" in Supabase Dashboard.
          console.warn('[Register/Verify] signUp succeeded but signIn failed — email confirmation may be enabled in Supabase.');
          return res.status(400).json({
            error: 'Ro\'yxatdan o\'tdingiz! Lekin tizimga kirish uchun Supabase Authentication settings\'da "Confirm email" ni o\'chirib qo\'ying yoki qayta urinib ko\'ring.'
          });
        }
      }
    }

    // Upsert profile
    let { data: existingProfile } = await supabase.from('profiles').select('id').eq('telegram_chat_id', chatId).maybeSingle();
    if (!existingProfile && finalPhone) {
      const { data: byPhone } = await supabase.from('profiles').select('id').eq('phone', finalPhone).maybeSingle();
      existingProfile = byPhone;
    }

    if (existingProfile) {
      await supabase.from('profiles').update({
        user_id: signInData.user.id,
        telegram_chat_id: chatId,
        phone: finalPhone || undefined
      }).eq('id', existingProfile.id);
    } else {
      await supabase.from('profiles').upsert({
        user_id: signInData.user.id,
        full_name: finalName,
        phone: finalPhone,
        telegram_chat_id: chatId
      });
    }

    // Set role if given
    if (role && role !== 'user') {
      await supabase.from('user_roles').upsert({ user_id: signInData.user.id, role });
    }

    setAuthCookies(res, signInData.session, req);
    return res.json({ success: true, user: signInData.user, session: signInData.session });
  } catch (err) {
    console.error('[Register/Verify] Error:', err);
    res.status(500).json({ error: 'Serverda xatolik: ' + err.message });
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
 * DATA: Dashboard Unified Stats (Optimized via Postgres RPC)
 */
app.get('/api/dashboard', authRequired, async (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  let dashboardStats = { totalSessionsCount: 0, totalCorrectAnswers: 0, totalQuestionsCount: 0, todayTests: 0 };
  const { data: rpcRes, error: rpcErr } = await supabase.rpc('get_user_dashboard_stats', { p_user_id: req.user.id });

  if (!rpcErr && rpcRes) {
    dashboardStats = rpcRes;
  }

  const [
    announcements,
    sessions,
    totalStatsFallback,
    subjects,
    leaderboard,
    myRank,
    todayActivityFallback,
    scheduledExams,
    folders
  ] = await Promise.all([
    supabase.from('announcements').select('id, title, content, created_at').eq('is_active', true).order('created_at', { ascending: false }).limit(5),
    supabase.from('test_sessions').select('id, folder_id, correct_answers, total_questions, score, finished_at, test_folders(id, name, subject)').eq('user_id', req.user.id).not('finished_at', 'is', null).order('finished_at', { ascending: false }).limit(10),
    (!rpcRes) ? supabase.from('test_sessions').select('correct_answers, total_questions').eq('user_id', req.user.id).not('finished_at', 'is', null) : Promise.resolve({ data: [] }),
    supabase.from('subjects').select('id, name, slug, icon, order_number').eq('is_active', true).order('order_number'),
    supabase.from('leaderboard').select('rank, user_id, user_name, avatar_url, total_score, badge').order('rank', { ascending: true }).limit(5),
    supabase.from('leaderboard').select('rank').eq('user_id', req.user.id).maybeSingle(),
    (!rpcRes) ? supabase.from('test_sessions').select('id', { count: 'exact', head: true }).eq('user_id', req.user.id).not('finished_at', 'is', null).gte('finished_at', `${today}T00:00:00`) : Promise.resolve({ count: 0 }),
    supabase.from('scheduled_exams').select('id, title, subject, scheduled_at, duration_minutes').eq('is_active', true).gt('scheduled_at', new Date().toISOString()).order('scheduled_at', { ascending: true }).limit(3),
    supabase.from('test_folders').select('id, subject').eq('is_active', true)
  ]);

  if (!rpcRes && totalStatsFallback?.data) {
    dashboardStats.totalSessionsCount = totalStatsFallback.data.length;
    dashboardStats.totalCorrectAnswers = totalStatsFallback.data.reduce((a, s) => a + (s.correct_answers || 0), 0);
    dashboardStats.totalQuestionsCount = totalStatsFallback.data.reduce((a, s) => a + (s.total_questions || 0), 0);
    dashboardStats.todayTests = todayActivityFallback?.count || 0;
  }

  const subjectFolderMap = {};
  folders.data?.forEach(f => {
    const s = f.subject || "Boshqa";
    if (!subjectFolderMap[s]) subjectFolderMap[s] = [];
    subjectFolderMap[s].push(f.id);
  });

  res.json({
    announcements: announcements.data || [],
    sessions: sessions.data || [],
    totalSessionsCount: Number(dashboardStats.totalSessionsCount || 0),
    totalCorrectAnswers: Number(dashboardStats.totalCorrectAnswers || 0),
    totalQuestionsCount: Number(dashboardStats.totalQuestionsCount || 0),
    subjects: subjects.data || [],
    leaderboard: leaderboard.data || [],
    myRank: myRank.data?.rank,
    todayTests: Number(dashboardStats.todayTests || 0),
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
 * ADMIN: Blog Posts Endpoints (Service Role fallback to bypass RLS)
 */
app.post('/api/admin/blog/upsert', async (req, res) => {
  try {
    const { editId, ...data } = req.body;
    if (editId) {
      const { data: updated, error } = await supabase.from('blog_posts').update(data).eq('id', editId).select();
      if (error) return res.status(400).json({ error: error.message });
      return res.json(updated);
    } else {
      const { data: inserted, error } = await supabase.from('blog_posts').insert([data]).select();
      if (error) return res.status(400).json({ error: error.message });
      return res.json(inserted);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/blog/toggle-publish', async (req, res) => {
  try {
    const { id, is_published } = req.body;
    const newStatus = !is_published;
    const { error } = await supabase.from('blog_posts').update({
      is_published: newStatus,
      published: newStatus,
      published_at: newStatus ? new Date().toISOString() : null
    }).eq('id', id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true, is_published: newStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/blog/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('blog_posts').delete().eq('id', id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
  try {
    const { bucket } = req.params;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const safeName = (file.originalname || 'image.png').replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${req.user?.id || 'admin'}/${Date.now()}-${safeName}`;

    let uploadRes = await supabase.storage
      .from(bucket)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

    if (uploadRes.error && bucket !== 'questions') {
      uploadRes = await supabase.storage
        .from('questions')
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: true
        });
    }

    if (!uploadRes.error && uploadRes.data?.path) {
      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(uploadRes.data.path);
      return res.json({ url: publicUrl, path: uploadRes.data.path });
    }

    // Fallback: Return Base64 data URL if Supabase bucket doesn't exist or storage throws error
    const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    return res.json({ url: base64, path: fileName, isBase64: true });
  } catch (err) {
    console.error('Storage proxy error:', err);
    if (req.file) {
      const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      return res.json({ url: base64, path: 'fallback', isBase64: true });
    }
    res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

/**
 * ADMIN: Save Mock Test & Questions
 */
app.post('/api/admin/mock-tests/save', authRequired, async (req, res) => {
  try {
    const { id, testData, questions } = req.body;
    if (!testData || !testData.title || !testData.title.trim()) {
      return res.status(400).json({ error: 'Test nomini kiriting' });
    }

    const fullPayload = {
      title: testData.title,
      description: testData.description || '',
      subject: testData.subject || 'Matematika',
      type: testData.type || 'milliy_sertifikat',
      price_cash: Number(testData.price_cash) || 0,
      price_educoin: Number(testData.price_educoin) || 0,
      is_free: Boolean(testData.is_free),
      duration_minutes: Number(testData.duration_minutes) || 60,
      questions_count: Array.isArray(questions) ? questions.length : (testData.questions_count || 0),
      is_active: testData.is_active !== undefined ? Boolean(testData.is_active) : true,
      slug: testData.slug || undefined,
      available_from: testData.available_from || null,
      available_until: testData.available_until || null,
      max_attempts: Number(testData.max_attempts) || 0,
    };

    let targetId = id;

    if (id) {
      let { error: updateErr } = await supabase
        .from('mock_tests')
        .update(fullPayload)
        .eq('id', id);

      if (updateErr) {
        console.warn('[Admin Mock Tests] Full update failed, trying fallback without new columns:', updateErr.message);
        const { available_from, available_until, max_attempts, ...basicPayload } = fullPayload;
        const { error: fbErr } = await supabase
          .from('mock_tests')
          .update(basicPayload)
          .eq('id', id);

        if (fbErr) return res.status(500).json({ error: fbErr.message });
      }
    } else {
      let { data: inserted, error: insertErr } = await supabase
        .from('mock_tests')
        .insert(fullPayload)
        .select()
        .single();

      if (insertErr) {
        console.warn('[Admin Mock Tests] Full insert failed, trying fallback without new columns:', insertErr.message);
        const { available_from, available_until, max_attempts, ...basicPayload } = fullPayload;
        const { data: fbData, error: fbErr } = await supabase
          .from('mock_tests')
          .insert(basicPayload)
          .select()
          .single();

        if (fbErr) return res.status(500).json({ error: fbErr.message });
        inserted = fbData;
      }
      targetId = inserted.id;
    }

    // Save questions
    if (Array.isArray(questions) && targetId) {
      await supabase
        .from('mock_test_questions')
        .delete()
        .eq('test_id', targetId);

      const formattedQs = questions.map((q, idx) => {
        let img = q.question_image || q.image_url || '';
        if (img.startsWith('blob:')) {
          img = '';
        }
        return {
          test_id: targetId,
          question_number: q.question_number || (idx + 1),
          question_text: q.question_text || '',
          question_subtext: q.question_subtext || '',
          question_image: img,
          type: q.type || 'multiple_choice',
          metadata: q.metadata || {},
          correct_answer: q.correct_answer !== undefined ? q.correct_answer : 'A',
          explanation: q.explanation || '',
          points_a: q.points_a !== undefined ? q.points_a : null,
          points_b: q.points_b !== undefined ? q.points_b : null,
          difficulty: q.difficulty || 1,
        };
      });

      const { error: qErr } = await supabase
        .from('mock_test_questions')
        .insert(formattedQs);

      if (qErr) {
        console.error('[Admin Mock Tests] Questions insert error:', qErr);
        return res.status(500).json({ error: 'Savollarni saqlashda xatolik: ' + qErr.message });
      }
    }

    return res.json({ success: true, id: targetId });
  } catch (err) {
    console.error('[Admin Mock Tests] Save error:', err);
    return res.status(500).json({ error: err.message || 'Serverda saqlashda xatolik yuz berdi' });
  }
});

/**
 * MOCK TEST: Ultra-Reliable Submission Endpoint
 * Bypasses client-side RLS/JWT expiration issues after long 150-minute test sessions
 */
app.post('/api/mock-tests/submit', authRequired, async (req, res) => {
  try {
    const { test_id, answers, total_questions, correct_answers, score, user_id } = req.body;
    const targetUserId = req.user?.id || user_id;

    if (!targetUserId || !test_id) {
      return res.status(400).json({ error: 'Foydalanuvchi yoki test ID mavjud emas' });
    }

    // 1. Fetch test details for time window & attempt checks
    const { data: testData } = await supabase
      .from('mock_tests')
      .select('id, available_from, available_until, max_attempts')
      .eq('id', test_id)
      .maybeSingle();

    if (testData) {
      const now = Date.now();
      if (testData.available_from && now < new Date(testData.available_from).getTime()) {
        return res.status(403).json({ error: 'Ushbu test hali boshlanmagan!' });
      }
      if (testData.available_until && now > new Date(testData.available_until).getTime()) {
        return res.status(403).json({ error: 'Ushbu testni topshirish vaqti tugagan!' });
      }
      if (testData.max_attempts && testData.max_attempts > 0) {
        const { count } = await supabase
          .from('mock_test_submissions')
          .select('id', { count: 'exact', head: true })
          .eq('test_id', test_id)
          .eq('user_id', targetUserId);

        if (count && count >= testData.max_attempts) {
          return res.status(403).json({ error: `Siz ajratilgan maksimal ${testData.max_attempts} ta urinishdan foydalanib bo'ldingiz!` });
        }
      }
    }

    // 2. Prepare payload
    const payload = {
      user_id: targetUserId,
      test_id,
      score: Number(score) || 0,
      answers: answers || {},
      total_questions: Number(total_questions) || 0,
      correct_answers: Number(correct_answers) || 0,
      raw_results: {
        total_questions: Number(total_questions) || 0,
        correct_answers: Number(correct_answers) || 0,
      },
      completed_at: new Date().toISOString(),
    };

    let { data: inserted, error: insertErr } = await supabase
      .from('mock_test_submissions')
      .insert(payload)
      .select()
      .single();

    if (insertErr) {
      console.warn('[Submit API] Full insert error, trying fallback:', insertErr.message);
      const fallbackPayload = {
        user_id: targetUserId,
        test_id,
        score: Number(score) || 0,
        answers: answers || {},
        raw_results: {
          total_questions: Number(total_questions) || 0,
          correct_answers: Number(correct_answers) || 0,
        },
        completed_at: new Date().toISOString(),
      };
      const fbRes = await supabase
        .from('mock_test_submissions')
        .insert(fallbackPayload)
        .select()
        .single();

      if (fbRes.error) {
        console.error('[Submit API] Fallback insert failed:', fbRes.error);
        return res.status(500).json({ error: fbRes.error.message });
      }
      inserted = fbRes.data;
    }

    return res.json({ success: true, submission: inserted });
  } catch (err) {
    console.error('[Submit API] Critical error:', err);
    return res.status(500).json({ error: err.message || 'Test natijasini saqlashda server xatoligi' });
  }
});

/**
 * ADMIN: Get Mock Test Results Matrix & Submissions
 */
app.get('/api/admin/mock-tests/:id/results', authRequired, async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Fetch test questions to know correct answers
    const { data: questions } = await supabase
      .from('mock_test_questions')
      .select('id, question_number, correct_answer, type, metadata')
      .eq('test_id', id)
      .order('question_number', { ascending: true });

    // 2. Fetch submissions
    const { data: submissions, error: subErr } = await supabase
      .from('mock_test_submissions')
      .select('id, user_id, score, answers, raw_results, created_at')
      .eq('test_id', id)
      .order('created_at', { ascending: false });

    if (subErr) {
      console.error('[Admin Results] Error fetching submissions:', subErr);
      return res.status(500).json({ error: subErr.message });
    }

    if (!submissions || submissions.length === 0) {
      return res.json({ submissions: [], questions: questions || [] });
    }

    // 3. Fetch user profiles
    const userIds = [...new Set(submissions.map(s => s.user_id))].filter(Boolean);
    let profilesMap = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, avatar_url, phone')
        .in('user_id', userIds);

      if (profiles) {
        profiles.forEach(p => {
          profilesMap[p.user_id] = p;
        });
      }
    }

    // 4. Enrich submissions with user name and details
    const enrichedSubmissions = submissions.map(sub => {
      const profile = profilesMap[sub.user_id] || {};
      const rawRes = (sub.raw_results && typeof sub.raw_results === 'object') ? sub.raw_results : {};
      const totalQs = Number(sub.total_questions) || Number(rawRes.total_questions) || (sub.answers && typeof sub.answers === 'object' ? Object.keys(sub.answers).length : 0);
      const correctAns = Number(sub.correct_answers) || Number(rawRes.correct_answers) || Number(sub.score) || 0;

      return {
        ...sub,
        total_questions: totalQs,
        correct_answers: correctAns,
        user_name: profile.full_name || (profile.email ? profile.email.split('@')[0] : 'Foydalanuvchi'),
        user_email: profile.email || '',
        avatar_url: profile.avatar_url || '',
      };
    });

    return res.json({
      submissions: enrichedSubmissions,
      questions: questions || []
    });
  } catch (err) {
    console.error('[Admin Results] Critical error:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * PUBLIC: Get Mock Test Public Results & Rasch Analysis (No auth required)
 */
app.get('/api/mock-tests/:id/public-results', async (req, res) => {
  try {
    const { id } = req.params;
    let targetTestId = id;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUuid) {
      let { data: testObj } = await supabase
        .from('mock_tests')
        .select('id')
        .eq('slug', id)
        .maybeSingle();

      if (!testObj) {
        const { data: allMockTests } = await supabase.from('mock_tests').select('id, title, slug');
        if (allMockTests) {
          const match = allMockTests.find(t => t.slug === id || (t.title && id.includes(t.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'))));
          if (match) testObj = match;
        }
      }

      if (testObj) {
        targetTestId = testObj.id;
      } else {
        return res.json({ submissions: [], questions: [] });
      }
    }

    // 1. Fetch test questions
    const { data: questions } = await supabase
      .from('mock_test_questions')
      .select('id, question_number, correct_answer, type, metadata')
      .eq('test_id', targetTestId)
      .order('question_number', { ascending: true });

    // 2. Fetch submissions
    const { data: submissions, error: subErr } = await supabase
      .from('mock_test_submissions')
      .select('id, user_id, score, answers, raw_results, created_at')
      .eq('test_id', targetTestId)
      .order('created_at', { ascending: false });

    if (subErr) {
      console.error('[Public Results] Error fetching submissions:', subErr);
      return res.status(500).json({ error: subErr.message });
    }

    if (!submissions || submissions.length === 0) {
      return res.json({ submissions: [], questions: questions || [] });
    }

    // 3. Fetch user profiles
    const userIds = [...new Set(submissions.map(s => s.user_id))].filter(Boolean);
    let profilesMap = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, avatar_url')
        .in('user_id', userIds);

      if (profiles) {
        profiles.forEach(p => {
          profilesMap[p.user_id] = p;
        });
      }
    }

    // 4. Enrich submissions with user name
    const enrichedSubmissions = submissions.map(sub => {
      const profile = profilesMap[sub.user_id] || {};
      const rawEmail = profile.email || '';
      const maskedEmail = rawEmail ? `${rawEmail.slice(0, 3)}***@${rawEmail.split('@')[1] || 'mail.com'}` : '';

      const rawRes = (sub.raw_results && typeof sub.raw_results === 'object') ? sub.raw_results : {};
      const totalQs = Number(sub.total_questions) || Number(rawRes.total_questions) || (sub.answers && typeof sub.answers === 'object' ? Object.keys(sub.answers).length : 0);
      const correctAns = Number(sub.correct_answers) || Number(rawRes.correct_answers) || Number(sub.score) || 0;

      return {
        ...sub,
        total_questions: totalQs,
        correct_answers: correctAns,
        user_name: profile.full_name || (rawEmail ? rawEmail.split('@')[0] : 'Foydalanuvchi'),
        user_email: maskedEmail,
        avatar_url: profile.avatar_url || '',
      };
    });

    return res.json({
      submissions: enrichedSubmissions,
      questions: questions || []
    });
  } catch (err) {
    console.error('[Public Results] Critical error:', err);
    return res.status(500).json({ error: err.message });
  }
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
  try {
    const { data, error } = await supabase.rpc('process_daily_login', {
      p_user_id: req.user.id
    });
    if (error) return res.status(500).json(error);
    res.json(data);
  } catch (err) {
    console.error('daily-login error:', err);
    res.status(500).json({ error: 'Internal server error in daily login', details: err.message });
  }
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
    if (!pdfjsLib) return res.status(500).json({ error: 'pdfjs-dist moduli o\'rnatilmagan' });

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

const fs = require('fs');
const distPath = fs.existsSync(path.join(__dirname, 'dist')) 
  ? path.join(__dirname, 'dist') 
  : path.join(__dirname, '../dist');

app.use(express.static(distPath));
app.use((req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Not Found: dist/index.html missing. Run npm run build.');
  }
});

app.listen(PORT, () => console.log(`✅ EduContest BFF running at port ${PORT}`));
