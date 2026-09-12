/**
 * EduContest - Education Centers (B2B) Backend API Module
 * Multi-tenant architecture for Educational Centers
 */

const RESERVED_CENTER_USERNAMES = new Set([
  'admin', 'administrator', 'api', 'login', 'register', 'auth', 'tests', 'test',
  'settings', 'dashboard', 'c', 'myclass', 'center', 'centers', 'educontest',
  'support', 'help', 'blog', 'courses', 'olympiads', 'profile', 'wallet', 'errors',
  'leaderboard', 'resources', 'planner', 'ai', 'ai-mentor', 'contributor', 'builder',
  'static', 'assets', 'public', 'root', 'superadmin', 'system', 'index', 'app'
]);

function isValidCenterUsername(username) {
  if (!username || typeof username !== 'string') return false;
  const clean = username.trim().toLowerCase();
  if (clean.length < 3 || clean.length > 50) return false;
  if (!/^[a-z0-9_-]+$/.test(clean)) return false;
  if (RESERVED_CENTER_USERNAMES.has(clean)) return false;
  return true;
}

function generateClassCode() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Server-side Rasch model computation
 */
function computeRaschModel(questions = [], submissions = []) {
  if (!questions || questions.length === 0 || !submissions || submissions.length === 0) {
    return {
      qStatsMap: {},
      maxRaschScore: 1,
      topRaschScore: 0,
      participantResults: [],
      hardestQuestions: [],
      easiestQuestions: []
    };
  }

  const qStatsMap = {};

  questions.forEach((q, idx) => {
    const qNum = q.question_number || (idx + 1);
    let correctCount = 0;
    let attemptedCount = 0;

    submissions.forEach((sub) => {
      const userAns = sub.answers?.[qNum] ?? sub.answers?.[String(qNum)];
      if (userAns !== undefined && userAns !== null && userAns !== "") {
        attemptedCount++;
        let isCorrect = false;
        if (typeof userAns === "object") {
          isCorrect = Boolean(userAns.is_correct || userAns.isCorrect);
        } else {
          const corr = q.correct_answer;
          if (typeof corr === "string") {
            isCorrect = String(userAns).trim().toUpperCase() === String(corr).trim().toUpperCase();
          } else if (typeof corr === "object") {
            isCorrect = JSON.stringify(userAns) === JSON.stringify(corr);
          }
        }
        if (isCorrect) correctCount++;
      }
    });

    const successRate = attemptedCount > 0 ? correctCount / attemptedCount : 0.5;

    let baseMinWeight = 0.6;
    let baseMultiplier = 0.8;
    let categoryLabel = 'Oson';

    if (qNum >= 34) {
      baseMinWeight = 1.8;
      baseMultiplier = 1.0;
      categoryLabel = 'Qiyin';
    } else if (qNum >= 21) {
      baseMinWeight = 1.1;
      baseMultiplier = 0.9;
      categoryLabel = "O'rta";
    } else {
      baseMinWeight = 0.6;
      baseMultiplier = 0.8;
      categoryLabel = 'Oson';
    }

    const weight = Number((baseMinWeight + (1 - successRate) * baseMultiplier).toFixed(2));

    qStatsMap[qNum] = {
      qNum,
      totalAttempts: attemptedCount,
      correctCount,
      successRate,
      weight,
      difficultyLabel: categoryLabel
    };
  });

  const maxRaschScore = Number(Object.values(qStatsMap).reduce((sum, q) => sum + q.weight, 0).toFixed(1)) || 1;
  const statsList = Object.values(qStatsMap);
  const hardestQuestions = [...statsList].sort((a, b) => b.weight - a.weight).slice(0, 5);
  const easiestQuestions = [...statsList].sort((a, b) => a.weight - b.weight).slice(0, 5);

  const rawParticipantList = submissions.map((sub) => {
    let raschScore = 0;
    let rawCorrect = Number(sub.correct_answers) || Number(sub.score) || 0;
    const totalQuestions = questions.length || sub.total_questions || 1;

    questions.forEach((q, idx) => {
      const qNum = q.question_number || (idx + 1);
      const userAns = sub.answers?.[qNum] ?? sub.answers?.[String(qNum)];
      if (userAns !== undefined && userAns !== null && userAns !== "") {
        let isCorrect = false;
        if (typeof userAns === "object") {
          isCorrect = Boolean(userAns.is_correct || userAns.isCorrect);
        } else {
          const corr = q.correct_answer;
          if (typeof corr === "string") {
            isCorrect = String(userAns).trim().toUpperCase() === String(corr).trim().toUpperCase();
          } else if (typeof corr === "object") {
            isCorrect = JSON.stringify(userAns) === JSON.stringify(corr);
          }
        }
        if (isCorrect) {
          raschScore += (qStatsMap[qNum]?.weight || 1.0);
        }
      }
    });

    raschScore = Number(raschScore.toFixed(1));

    return {
      subId: sub.id,
      userId: sub.user_id,
      userName: sub.user_name || "O'quvchi",
      userEmail: sub.user_email || "",
      rawCorrect,
      totalQuestions,
      rawPercentage: Math.round((rawCorrect / totalQuestions) * 100),
      raschScore,
      completedAt: sub.completed_at || sub.created_at
    };
  });

  rawParticipantList.sort((a, b) => b.raschScore - a.raschScore);
  const topRaschScore = Math.max(...rawParticipantList.map((p) => p.raschScore), 0.1);

  const participantResults = rawParticipantList.map((p, idx) => {
    const rank = idx + 1;
    const relativeRaschPct = Math.min(100, Math.round((p.raschScore / topRaschScore) * 100));

    let raschGrade = 'C';
    let raschGradeTitle = 'Qoniqarli';

    if (p.rawCorrect === 0 || p.raschScore === 0) {
      raschGrade = 'D';
      raschGradeTitle = "Qo'shimcha tayyorgarlik talab etiladi";
    } else if (relativeRaschPct >= 90 || rank === 1) {
      raschGrade = 'A+';
      raschGradeTitle = "O'ta Yuqori (Sertifikat A+)";
    } else if (relativeRaschPct >= 78) {
      raschGrade = 'A';
      raschGradeTitle = "A'lo (Sertifikat A)";
    } else if (relativeRaschPct >= 66) {
      raschGrade = 'B+';
      raschGradeTitle = "Yaxshi Plus (Sertifikat B+)";
    } else if (relativeRaschPct >= 54) {
      raschGrade = 'B';
      raschGradeTitle = "Yaxshi (Sertifikat B)";
    } else if (relativeRaschPct >= 42) {
      raschGrade = 'C+';
      raschGradeTitle = "Qoniqarli Plus (Sertifikat C+)";
    } else if (relativeRaschPct >= 30) {
      raschGrade = 'C';
      raschGradeTitle = "Qoniqarli (Sertifikat C)";
    } else {
      raschGrade = 'D';
      raschGradeTitle = "Qo'shimcha tayyorgarlik talab etiladi";
    }

    return {
      ...p,
      maxRaschScore,
      relativeRaschPercentage: relativeRaschPct,
      raschGrade,
      raschGradeTitle,
      rank
    };
  });

  return {
    qStatsMap,
    maxRaschScore,
    topRaschScore,
    participantResults,
    hardestQuestions,
    easiestQuestions
  };
}

module.exports = function setupCenterRoutes(app, deps) {
  const {
    supabase,
    pgPool,
    authRequired,
    adminRequired,
    sendTelegramMessage,
    getInPayBearerToken,
    INPAY_MERCHANT_ID,
    INPAY_MERCHANT_TOKEN
  } = deps;

  /**
   * Middleware: Enforce Center Multi-Tenancy & Authorization
   */
  async function centerAuthRequired(req, res, next) {
    await authRequired(req, res, async () => {
      try {
        const centerIdHeader = req.headers['x-center-id'] || req.query?.center_id || req.body?.center_id;
        const userId = req.user.id;

        // 1. Check if user is Super Admin
        const { data: userRole } = await supabase.from('user_roles').select('role').eq('user_id', userId).maybeSingle();
        const isSuperAdmin = req.user.email === 'xudayberganovbackend@gmail.com' || userRole?.role === 'admin' || userRole?.role === 'super_admin';

        if (isSuperAdmin && centerIdHeader) {
          const { data: center } = await supabase.from('centers').select('*').eq('id', centerIdHeader).maybeSingle();
          if (center) {
            req.center = center;
            req.centerMember = { center_id: center.id, user_id: userId, role: 'SUPER_ADMIN', status: 'ACTIVE' };
            req.centerPermissions = ['ALL'];
            return next();
          }
        }

        // 2. Check ownership first
        let ownerQuery = supabase.from('centers').select('*').eq('owner_id', userId);
        if (centerIdHeader) {
          ownerQuery = ownerQuery.eq('id', centerIdHeader);
        }
        const { data: ownedCenters } = await ownerQuery;
        if (ownedCenters && ownedCenters.length > 0) {
          const center = ownedCenters[0];
          if (center.status === 'SUSPENDED') {
            return res.status(403).json({ error: "Bu o'quv markazining EduContest hisobiga kirish vaqtincha to'xtatilgan." });
          }
          req.center = center;
          req.centerMember = {
            center_id: center.id,
            user_id: userId,
            role: 'CENTER_OWNER',
            status: 'ACTIVE'
          };
          req.centerPermissions = ['ALL'];
          return next();
        }

        // 3. Check center_members
        let memberQuery = supabase.from('center_members').select('*').eq('user_id', userId).in('role', ['CENTER_OWNER', 'CENTER_STAFF']);
        if (centerIdHeader) {
          memberQuery = memberQuery.eq('center_id', centerIdHeader);
        }
        const { data: memberships } = await memberQuery;

        if (memberships && memberships.length > 0) {
          const membership = memberships[0];
          const { data: center } = await supabase.from('centers').select('*').eq('id', membership.center_id).maybeSingle();
          if (!center) return res.status(404).json({ error: 'Markaz topilmadi' });

          if (center.status === 'SUSPENDED') {
            return res.status(403).json({ error: "Bu o'quv markazining EduContest hisobiga kirish vaqtincha to'xtatilgan." });
          }

          req.center = center;
          req.centerMember = membership;

          if (membership.role === 'CENTER_OWNER') {
            req.centerPermissions = ['ALL'];
          } else if (membership.role === 'CENTER_STAFF') {
            const { data: staffPerms } = await supabase.from('center_staff_permissions').select('*').eq('center_id', center.id).eq('user_id', userId).maybeSingle();
            req.centerPermissions = staffPerms?.permissions || [];
            req.assignedClasses = staffPerms?.assigned_classes || [];
          } else {
            req.centerPermissions = [];
          }

          return next();
        }

        // 4. Super Admin fallback: if admin does not own a center, grant access to latest center
        if (isSuperAdmin) {
          const { data: anyCenter } = await supabase.from('centers').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle();
          if (anyCenter) {
            req.center = anyCenter;
            req.centerMember = { center_id: anyCenter.id, user_id: userId, role: 'SUPER_ADMIN', status: 'ACTIVE' };
            req.centerPermissions = ['ALL'];
            return next();
          }
        }

        return res.status(403).json({ error: 'Ushbu markaz boshqaruviga kirish huquqingiz yo\'q' });
      } catch (err) {
        console.error('[CenterAuth Error]:', err);
        res.status(500).json({ error: 'Markaz avtorizatsiyasida xatolik: ' + err.message });
      }
    });
  }

  function requirePerm(perm) {
    return (req, res, next) => {
      if (req.centerPermissions?.includes('ALL') || req.centerPermissions?.includes(perm)) {
        return next();
      }
      return res.status(403).json({ error: `Ruxsat yetarli emas (${perm} talab qilinadi)` });
    };
  }

  // ==============================================================================
  // 1. PUBLIC CENTER ROUTES
  // ==============================================================================

  /**
   * Public Center Logo Upload (from computer)
   * POST /api/public/upload/center-logo
   */
  const logoUpload = deps.upload ? deps.upload.single('file') : (req, res, next) => next();
  app.post('/api/public/upload/center-logo', logoUpload, async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: 'Fayl tanlanmadi' });
      }

      const ext = (file.originalname || 'logo.png').split('.').pop().toLowerCase();
      const fileName = `center_logos/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

      let publicUrl = '';
      let uploadRes = await supabase.storage.from('avatars').upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

      if (uploadRes.error) {
        uploadRes = await supabase.storage.from('questions').upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: true
        });
        if (!uploadRes.error && uploadRes.data?.path) {
          const { data } = supabase.storage.from('questions').getPublicUrl(uploadRes.data.path);
          publicUrl = data?.publicUrl;
        }
      } else if (uploadRes.data?.path) {
        const { data } = supabase.storage.from('avatars').getPublicUrl(uploadRes.data.path);
        publicUrl = data?.publicUrl;
      }

      if (!publicUrl) {
        publicUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      }

      return res.json({ success: true, url: publicUrl });
    } catch (err) {
      console.error('[Center Logo Upload Error]:', err);
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * Check Center Username Availability
   * GET /api/public/centers/check-username/:username
   */
  app.get('/api/public/centers/check-username/:username', async (req, res) => {
    try {
      const username = (req.params.username || '').toLowerCase().trim();

      if (!isValidCenterUsername(username)) {
        return res.json({
          available: false,
          valid: false,
          message: "Username 3-50 ta lotin harflari, sonlar, chiziqcha yoki pastki chiziqdan iborat bo'lishi kerak va maxsus so'zlardan foydalanilmasligi lozim."
        });
      }

      const { data } = await supabase
        .from('centers')
        .select('id')
        .eq('username', username)
        .maybeSingle();

      if (data) {
        return res.json({ available: false, valid: true, message: "Bu username allaqachon band qilingan." });
      }

      return res.json({ available: true, valid: true, message: "Username band emas va foydalanishga yaroqli." });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * Telegram Registration Session: Generate Link & Token
   * GET /api/public/centers/telegram-session/token
   */
  app.get('/api/public/centers/telegram-session/token', (req, res) => {
    try {
      const token = 'reg_' + Math.random().toString(36).substring(2, 8).toUpperCase();
      const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'educontesttbot';
      return res.json({
        token,
        bot_username: botUsername,
        link: `https://t.me/${botUsername}?start=center_${token}`
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * Telegram Registration Session: Check Verification Status
   * GET /api/public/centers/telegram-session/status/:token
   */
  app.get('/api/public/centers/telegram-session/status/:token', async (req, res) => {
    try {
      const { token } = req.params;
      if (!token) return res.json({ linked: false });

      if (pgPool) {
        const cleanToken = token.replace(/^center_|^reg_/, '');
        const regToken = token.startsWith('reg_') ? token : 'reg_' + token;
        const { rows } = await pgPool.query(
          `SELECT * FROM center_telegram_sessions 
           WHERE token = $1 OR token = $2 OR token = $3 OR token = $4
           ORDER BY created_at DESC LIMIT 1`,
          [token, cleanToken, regToken, `center_${token}`]
        );
        if (rows.length > 0) {
          return res.json({
            linked: true,
            chat_id: rows[0].chat_id,
            telegram_username: rows[0].username,
            first_name: rows[0].first_name
          });
        }
      }
      return res.json({ linked: false });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * Telegram Registration Session: Manual Code or Chat ID Link
   * POST /api/public/centers/telegram-session/manual-link
   */
  app.post('/api/public/centers/telegram-session/manual-link', async (req, res) => {
    try {
      const { token, chat_id, code, telegram_username } = req.body;
      const rawInput = String(code || chat_id || '').trim();
      if (!rawInput) {
        return res.status(400).json({ error: "Telegram tasdiqlash kodi yoki Chat ID kiritilmadi" });
      }

      let targetChatId = null;
      let targetFirstName = 'Foydalanuvchi';
      let targetPhone = null;

      // 1. Check if input is a 6-digit verification code
      const isSixDigit = /^\d{6}$/.test(rawInput);
      if (isSixDigit) {
        let codeRow = null;
        if (pgPool) {
          const { rows } = await pgPool.query(
            `SELECT * FROM telegram_auth_codes WHERE code = $1 ORDER BY created_at DESC LIMIT 1`,
            [rawInput]
          );
          if (rows.length > 0) codeRow = rows[0];
        }
        if (!codeRow) {
          const { data } = await supabase
            .from('telegram_auth_codes')
            .select('*')
            .eq('code', rawInput)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (data) codeRow = data;
        }

        if (codeRow) {
          targetChatId = Number(codeRow.chat_id);
          targetFirstName = codeRow.full_name || 'Foydalanuvchi';
          targetPhone = codeRow.phone || null;
        } else {
          return res.status(404).json({
            error: "Ushbu 6 xonali kod topilmadi yoki eskirgan. Iltimos, Telegram botimizga /start yuborib yangi kod oling yoki Chat ID raqamingizni kiriting."
          });
        }
      } else {
        // Direct Chat ID
        const cleanChatId = Number(rawInput.replace(/\D/g, ''));
        if (!cleanChatId || cleanChatId < 1000) {
          return res.status(400).json({ error: "Noto'g'ri Telegram tasdiqlash kodi yoki Chat ID" });
        }
        targetChatId = cleanChatId;
      }

      if (pgPool) {
        await pgPool.query(
          `INSERT INTO center_telegram_sessions (token, chat_id, username, first_name)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (token) DO UPDATE SET chat_id = $2, username = $3, first_name = $4`,
          [token || `manual_${targetChatId}`, targetChatId, telegram_username || null, targetFirstName]
        );
      }

      if (sendTelegramMessage && targetChatId) {
        await sendTelegramMessage(
          targetChatId,
          `✅ <b>Telegram hisobingiz EduContest tizimiga muvaffaqiyatli ulandi!</b>\n\nAssalomu alaykum, <b>${targetFirstName}</b>!\nO'quv markazingiz arizasi tasdiqlangach, boshqaruv panelining <b>login va paroli</b> ushbu bot orqali avtomatik tarzda yuboriladi.`
        );
      }

      return res.json({
        success: true,
        chat_id: targetChatId,
        first_name: targetFirstName,
        phone: targetPhone,
        telegram_username: telegram_username || null
      });
    } catch (err) {
      console.error('[Manual/Code TG Link Error]:', err);
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * Get Public Branded Center Info
   * GET /api/public/centers/:username
   */
  app.get('/api/public/centers/:username', async (req, res) => {
    try {
      const username = (req.params.username || '').toLowerCase().trim();
      const { data: center } = await supabase
        .from('centers')
        .select('id, name, username, logo_url, description, subjects, branding, status, created_at')
        .eq('username', username)
        .maybeSingle();

      if (!center) {
        return res.status(404).json({ error: "O'quv markazi topilmadi" });
      }

      if (center.status === 'SUSPENDED') {
        return res.status(403).json({
          error: "Bu o'quv markazining EduContest hisobiga kirish vaqtincha to'xtatilgan.",
          center: { id: center.id, name: center.name, username: center.username, status: 'SUSPENDED' }
        });
      }

      return res.json({ center });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * Universal Center Login (Center Admin, Staff, or Student)
   * POST /api/public/centers/login
   */
  app.post('/api/public/centers/login', async (req, res) => {
    try {
      const { login, password } = req.body;

      if (!login || !password) {
        return res.status(400).json({ error: 'Login va parol kiritilishi shart' });
      }

      const cleanLogin = login.trim();
      let targetEmail = cleanLogin;

      // 1. Check if login matches a center username / slug (e.g. 'foxford')
      const { data: centerByUsername } = await supabase
        .from('centers')
        .select('*')
        .eq('username', cleanLogin.toLowerCase())
        .maybeSingle();

      if (centerByUsername) {
        // Find owner email
        const { data: ownerProfile } = await supabase
          .from('profiles')
          .select('email')
          .eq('user_id', centerByUsername.owner_id)
          .maybeSingle();
        if (ownerProfile?.email) {
          targetEmail = ownerProfile.email;
        } else if (centerByUsername.email) {
          targetEmail = centerByUsername.email;
        }
      } else if (!cleanLogin.includes('@')) {
        // Might be a custom_username in center_members
        const { data: memberUser } = await supabase
          .from('center_members')
          .select('user_id, custom_username')
          .eq('custom_username', cleanLogin.toLowerCase())
          .maybeSingle();

        if (memberUser) {
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('email')
            .eq('user_id', memberUser.user_id)
            .maybeSingle();
          if (userProfile?.email) {
            targetEmail = userProfile.email;
          }
        } else {
          // Might be phone
          const cleanPhone = cleanLogin.replace(/\D/g, '');
          if (cleanPhone.length >= 9) {
            const { data: p } = await supabase
              .from('profiles')
              .select('email')
              .or(`phone.eq.${cleanPhone},phone.eq.+${cleanPhone}`)
              .maybeSingle();
            if (p?.email) {
              targetEmail = p.email;
            } else if (pgPool) {
              try {
                const uRes = await pgPool.query(
                  `SELECT email FROM auth.users 
                   WHERE (phone IS NOT NULL AND (phone = $1 OR phone = $2))
                      OR raw_user_meta_data->>'phone' = $1 
                      OR raw_user_meta_data->>'phone' = $2 LIMIT 1`,
                  [cleanPhone, `+${cleanPhone}`]
                );
                if (uRes.rows?.[0]?.email) targetEmail = uRes.rows[0].email;
              } catch (_) {}
            }
            if (targetEmail === cleanLogin) {
              const { data: cByPhone } = await supabase
                .from('centers')
                .select('email')
                .or(`phone.eq.${cleanPhone},phone.eq.+${cleanPhone}`)
                .maybeSingle();
              if (cByPhone?.email) targetEmail = cByPhone.email;
            }
          }
        }
      }

      // 2. Authenticate via Supabase Auth
      const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password
      });

      if (authErr || !authData?.user) {
        return res.status(401).json({ error: "Login yoki parol noto'g'ri" });
      }

      const userId = authData.user.id;

      // 3. Find associated center
      let { data: center } = await supabase
        .from('centers')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      let role = 'CENTER_OWNER';
      let membership = null;

      if (!center) {
        const { data: m } = await supabase
          .from('center_members')
          .select('*, centers(*)')
          .eq('user_id', userId)
          .order('joined_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (m && m.centers) {
          membership = m;
          center = m.centers;
          role = m.role || 'STUDENT';
        }
      }

      if (!center) {
        return res.status(403).json({
          error: "Siz hech qaysi o'quv markaziga biriktirilmagansiz."
        });
      }

      if (center.status === 'SUSPENDED') {
        return res.status(403).json({
          error: "Ushbu o'quv markazining EduContest hisobiga kirish vaqtincha to'xtatilgan."
        });
      }

      if (membership && membership.status === 'SUSPENDED') {
        return res.status(403).json({
          error: "Sizning ushbu markazdagi hisobingiz to'xtatilgan."
        });
      }

      // 4. Set auth cookies
      if (deps.setAuthCookies) {
        deps.setAuthCookies(res, authData.session, req);
      }

      const redirectUrl = (role === 'CENTER_OWNER' || role === 'CENTER_STAFF') ? '/center' : '/myclass';

      return res.json({
        success: true,
        user: authData.user,
        center: { id: center.id, name: center.name, username: center.username, logo_url: center.logo_url },
        role,
        redirectUrl
      });
    } catch (err) {
      console.error('[Universal Center Login Error]:', err);
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * Center Branded Login
   * POST /api/public/centers/:username/login
   */
  app.post('/api/public/centers/:username/login', async (req, res) => {
    try {
      const username = (req.params.username || '').toLowerCase().trim();
      const { login, password } = req.body;

      if (!login || !password) {
        return res.status(400).json({ error: 'Login va parol kiritilishi shart' });
      }

      // 1. Fetch center
      const { data: center } = await supabase
        .from('centers')
        .select('*')
        .eq('username', username)
        .maybeSingle();

      if (!center) {
        return res.status(404).json({ error: "O'quv markazi topilmadi" });
      }

      if (center.status === 'SUSPENDED') {
        return res.status(403).json({ error: "Bu o'quv markazining EduContest hisobiga kirish vaqtincha to'xtatilgan." });
      }

      // 2. Identify target user email or username
      let targetEmail = login.trim();

      // Check if login is a custom_username in center_members
      const { data: memberUser } = await supabase
        .from('center_members')
        .select('user_id, custom_username')
        .eq('center_id', center.id)
        .eq('custom_username', login.trim().toLowerCase())
        .maybeSingle();

      if (memberUser) {
        // Find auth user email
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('email, user_id')
          .eq('user_id', memberUser.user_id)
          .maybeSingle();

        if (userProfile?.email) {
          targetEmail = userProfile.email;
        }
      } else if (!login.includes('@')) {
        // Might be clean phone or username in profiles
        const cleanPhone = login.replace(/\D/g, '');
        if (cleanPhone.length >= 9) {
          const { data: p } = await supabase.from('profiles').select('email').or(`phone.eq.${cleanPhone},phone.eq.+${cleanPhone}`).maybeSingle();
          if (p?.email) {
            targetEmail = p.email;
          } else if (pgPool) {
            try {
              const uRes = await pgPool.query(
                `SELECT email FROM auth.users 
                 WHERE (phone IS NOT NULL AND (phone = $1 OR phone = $2))
                    OR raw_user_meta_data->>'phone' = $1 
                    OR raw_user_meta_data->>'phone' = $2 LIMIT 1`,
                [cleanPhone, `+${cleanPhone}`]
              );
              if (uRes.rows?.[0]?.email) targetEmail = uRes.rows[0].email;
            } catch (_) {}
          }
          if (targetEmail === login.trim()) {
            const { data: cByPhone } = await supabase
              .from('centers')
              .select('email')
              .or(`phone.eq.${cleanPhone},phone.eq.+${cleanPhone}`)
              .maybeSingle();
            if (cByPhone?.email) targetEmail = cByPhone.email;
          }
        }
      }

      // 3. Authenticate with Supabase Auth
      const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password
      });

      if (authErr || !authData?.user) {
        return res.status(401).json({ error: "Login yoki parol noto'g'ri" });
      }

      const userId = authData.user.id;

      // 4. Verify center membership or ownership
      const isOwner = center.owner_id === userId;
      const { data: membership } = await supabase
        .from('center_members')
        .select('*')
        .eq('center_id', center.id)
        .eq('user_id', userId)
        .maybeSingle();

      if (!isOwner && !membership) {
        return res.status(403).json({
          error: `Siz ushbu markazga biriktirilmagansiz (${center.name}). Iltimos, administrator bilan bog'laning.`
        });
      }

      if (membership && membership.status === 'SUSPENDED') {
        return res.status(403).json({ error: "Sizning ushbu markazdagi hisobingiz to'xtatilgan." });
      }

      // Set auth cookies for session
      if (deps.setAuthCookies) {
        deps.setAuthCookies(res, authData.session, req);
      }

      const role = isOwner ? 'CENTER_OWNER' : (membership?.role || 'STUDENT');
      const redirectUrl = (role === 'CENTER_OWNER' || role === 'CENTER_STAFF') ? '/center' : '/myclass';

      return res.json({
        success: true,
        user: authData.user,
        center: { id: center.id, name: center.name, username: center.username },
        role,
        redirectUrl
      });
    } catch (err) {
      console.error('[Center Login Error]:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // ==============================================================================
  // 2. CENTER REGISTRATION & SUBSCRIPTION CHECKOUT
  // ==============================================================================

  /**
   * Register a new Education Center
   * POST /api/centers/register
   */
  app.post('/api/centers/register', async (req, res) => {
    try {
      const {
        name,
        username,
        legal_name,
        owner_full_name,
        phone,
        email,
        telegram_username,
        telegram_chat_id,
        region,
        district,
        address,
        logo_url,
        description,
        subjects,
        student_count_range,
        branch_count,
        social_links,
        plan_name = 'EduCenter Pro',
        plan_price = 490000,
        is_trial = false
      } = req.body;

      const numPrice = Number(plan_price);
      const isTrial = numPrice === 0 || 
                      String(plan_name).toLowerCase().includes('sinov') || 
                      String(plan_name).toLowerCase().includes('trial') ||
                      Boolean(is_trial);

      if (!name || !username || !owner_full_name || !phone) {
        return res.status(400).json({ error: "Barcha asosiy maydonlarni to'ldiring (Nomi, username, egasining ismi, telefon)" });
      }

      const cleanSlug = username.trim().toLowerCase();
      if (!isValidCenterUsername(cleanSlug)) {
        return res.status(400).json({ error: "Username noto'g'ri formatda yoki band qilingan." });
      }

      // Check existing username
      const { data: existingCenter } = await supabase.from('centers').select('id').eq('username', cleanSlug).maybeSingle();
      if (existingCenter) {
        return res.status(400).json({ error: "Bu username allaqachon band qilingan." });
      }

      // Identify or create owner user
      let ownerId = null;
      const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
      const ownerEmail = email?.trim() || `center_${cleanSlug}@educontest.uz`;
      const autoPass = `CenterPass_${cleanSlug}_${Math.floor(1000 + Math.random() * 9000)}`;

      // 1. Check if user is logged in already
      if (req.user?.id) {
        ownerId = req.user.id;
      }

      // 2. Check if existing profile by phone or email
      if (!ownerId) {
        let profQuery = supabase.from('profiles').select('user_id');
        if (cleanPhone && ownerEmail) {
          profQuery = profQuery.or(`phone.eq.${cleanPhone},phone.eq.+${cleanPhone},email.eq.${ownerEmail}`);
        } else if (cleanPhone) {
          profQuery = profQuery.or(`phone.eq.${cleanPhone},phone.eq.+${cleanPhone}`);
        } else if (ownerEmail) {
          profQuery = profQuery.eq('email', ownerEmail);
        }
        const { data: prof } = await profQuery.maybeSingle();
        if (prof?.user_id) {
          ownerId = prof.user_id;
        }
      }

      // 3. Check auth.users directly via pgPool
      if (!ownerId && pgPool) {
        try {
          const userCheck = await pgPool.query(
            `SELECT id FROM auth.users WHERE email = $1 OR (phone IS NOT NULL AND (phone = $2 OR phone = $3)) LIMIT 1`,
            [ownerEmail, cleanPhone ? cleanPhone : '', cleanPhone ? `+${cleanPhone}` : '']
          );
          if (userCheck.rows && userCheck.rows.length > 0) {
            ownerId = userCheck.rows[0].id;
          }
        } catch (chkErr) {
          console.warn('[Register PG Check Warning]:', chkErr.message);
        }
      }

      // 4. Try public supabase.auth.signUp (supported without service-role Bearer token)
      if (!ownerId) {
        try {
          const signUpRes = await supabase.auth.signUp({
            email: ownerEmail,
            password: autoPass,
            options: {
              data: {
                full_name: owner_full_name,
                phone: cleanPhone ? `+${cleanPhone}` : ''
              }
            }
          });

          if (signUpRes?.data?.user?.id) {
            ownerId = signUpRes.data.user.id;
          } else if (signUpRes?.error?.message?.includes('already registered') || signUpRes?.error?.status === 422) {
            if (pgPool) {
              const resExisting = await pgPool.query(
                `SELECT id FROM auth.users WHERE email = $1 LIMIT 1`,
                [ownerEmail]
              );
              if (resExisting.rows?.[0]?.id) {
                ownerId = resExisting.rows[0].id;
              }
            }
          }
        } catch (signErr) {
          console.warn('[Register SignUp Attempt Warning]:', signErr.message);
        }
      }

      // 5. If still no ownerId, create fresh dedicated user via unique email
      if (!ownerId) {
        const uniqueEmail = `center_${cleanSlug}_${Date.now()}@educontest.uz`;
        try {
          const freshRes = await supabase.auth.signUp({
            email: uniqueEmail,
            password: autoPass,
            options: {
              data: { full_name: owner_full_name, phone: cleanPhone ? `+${cleanPhone}` : '' }
            }
          });
          if (freshRes?.data?.user?.id) {
            ownerId = freshRes.data.user.id;
          }
        } catch (freshErr) {
          console.warn('[Register Fresh SignUp Warning]:', freshErr.message);
        }
      }

      // 6. Direct insertion via pgPool if signUp was blocked
      if (!ownerId && pgPool) {
        try {
          await pgPool.query("CREATE EXTENSION IF NOT EXISTS pgcrypto;");
          const insRes = await pgPool.query(
            `INSERT INTO auth.users (
              instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
              raw_app_meta_data, raw_user_meta_data, created_at, updated_at
            ) VALUES (
              '00000000-0000-0000-0000-000000000000',
              gen_random_uuid(),
              'authenticated',
              'authenticated',
              $1,
              crypt($2, gen_salt('bf')),
              now(),
              '{"provider":"email","providers":["email"]}',
              json_build_object('full_name', $3::text, 'phone', $4::text),
              now(),
              now()
            ) RETURNING id;`,
            [ownerEmail, autoPass, owner_full_name, cleanPhone ? `+${cleanPhone}` : '']
          );
          if (insRes.rows?.[0]?.id) {
            ownerId = insRes.rows[0].id;
          }
        } catch (pgInsErr) {
          console.warn('[Register PG Insert User Warning]:', pgInsErr.message);
        }
      }

      // Ensure profile row exists
      if (ownerId) {
        try {
          await supabase.from('profiles').upsert({
            user_id: ownerId,
            full_name: owner_full_name,
            phone: cleanPhone ? `+${cleanPhone}` : null,
            email: ownerEmail
          }, { onConflict: 'user_id' });
        } catch (profErr) {
          console.warn('[Register Profile Upsert Warning]:', profErr.message);
        }
      }

      if (!ownerId) {
        return res.status(400).json({ error: "Markaz egasi hisobini yaratishda xatolik yuz berdi" });
      }

      // 1. Insert Center
      const cleanChatId = telegram_chat_id ? Number(String(telegram_chat_id).replace(/\D/g, '')) : null;
      const { data: center, error: cErr } = await supabase
        .from('centers')
        .insert({
          name: name.trim(),
          username: cleanSlug,
          legal_name: legal_name || null,
          owner_id: ownerId,
          phone: cleanPhone,
          email: ownerEmail,
          telegram_username: telegram_username || null,
          telegram_chat_id: cleanChatId || null,
          telegram_linked_at: cleanChatId ? new Date().toISOString() : null,
          region: region || null,
          district: district || null,
          address: address || null,
          logo_url: logo_url || null,
          description: description || null,
          subjects: Array.isArray(subjects) ? subjects : [],
          student_count_range: student_count_range || '50-100',
          branch_count: Number(branch_count) || 1,
          social_links: { ...(social_links || {}), _temp_pass: autoPass, _owner_email: ownerEmail },
          status: isTrial ? 'PENDING_APPROVAL' : 'PENDING_PAYMENT'
        })
        .select()
        .single();

      if (cErr) throw cErr;

      // Send telegram confirmation if connected
      if (cleanChatId && sendTelegramMessage) {
        try {
          await sendTelegramMessage(
            cleanChatId,
            isTrial
              ? `📋 <b>14 kunlik bepul sinov arizangiz qabul qilindi!</b>\n\n"${name.trim()}" markazi arizasi EduContest ma'muriyatiga yuborildi.\n\nTasdiqlangach, boshqaruv paneli <b>login va paroli</b> ushbu chatga avtomatik tarzda yuboriladi va 14 kunlik bepul sinov boshlanadi.`
              : `📋 <b>Arizangiz qabul qilindi!</b>\n\n"${name.trim()}" markazi arizasi EduContest ma'muriyatiga yuborildi.\n\nTasdiqlangach, boshqaruv paneli <b>login va paroli</b> ushbu chatga avtomatik tarzda yuboriladi.`
          );
        } catch (tgErr) {
          console.error('[Register Telegram Notice Error]:', tgErr);
        }
      }

      // 2. Add owner to center_members
      await supabase.from('center_members').insert({
        center_id: center.id,
        user_id: ownerId,
        role: 'CENTER_OWNER',
        status: 'ACTIVE'
      });

      // 3. Create Application
      const { data: application, error: aErr } = await supabase
        .from('center_applications')
        .insert({
          center_id: center.id,
          owner_id: ownerId,
          plan_name,
          plan_price: numPrice,
          payment_status: isTrial ? 'trial' : 'pending',
          status: isTrial ? 'PENDING_APPROVAL' : 'PENDING_PAYMENT'
        })
        .select()
        .single();

      if (aErr) throw aErr;

      // 4. Create initial subscription record
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 14);

      await supabase.from('center_subscriptions').insert({
        center_id: center.id,
        plan_name,
        price: numPrice,
        status: isTrial ? 'TRIAL' : 'ACTIVE',
        billing_cycle: isTrial ? 'trial_14_days' : 'monthly',
        start_date: new Date().toISOString(),
        next_billing_date: isTrial ? trialEndDate.toISOString() : null
      });

      // 5. Audit log
      await supabase.from('center_audit_logs').insert({
        center_id: center.id,
        actor_id: ownerId,
        action: 'CENTER_CREATED',
        resource_type: 'center',
        resource_id: center.id,
        metadata: { name: center.name, username: center.username, plan_name, is_trial: isTrial }
      });

      // 6. Generate InPay checkout invoice (Only for paid plans)
      let checkoutUrl = null;
      let orderId = null;

      if (!isTrial && numPrice > 0) {
        orderId = `ORD_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
        try {
          const bearerToken = getInPayBearerToken ? await getInPayBearerToken() : null;
          if (bearerToken && INPAY_MERCHANT_ID && INPAY_MERCHANT_TOKEN) {
            const callbackUrl = process.env.VITE_API_URL
              ? `${process.env.VITE_API_URL}/api/webhooks/inpay`
              : 'https://api.educontest.uz/api/webhooks/inpay';

            const createRes = await fetch('https://inpay.uz/api/v1/create/', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${bearerToken}`
              },
              body: JSON.stringify({
                merchant_id: String(INPAY_MERCHANT_ID),
                token: String(INPAY_MERCHANT_TOKEN),
                amount: numPrice,
                description: `EduContest O'quv markazi obunasi: ${center.name} (${plan_name})`,
                callback_url: callbackUrl,
                return_url: `${process.env.APP_URL || 'https://educontest.uz'}/c/${center.username}`,
                phone: cleanPhone || undefined
              })
            });

            const inpayData = await createRes.json();
            if (inpayData && inpayData.success && (inpayData.pay_url || inpayData.checkout_url)) {
              checkoutUrl = inpayData.pay_url || inpayData.checkout_url;
              orderId = inpayData.order_id || orderId;
            }
          }
        } catch (inpayErr) {
          console.warn('[Register InPay Auto-Create Warning]:', inpayErr.message);
        }

        if (!checkoutUrl && INPAY_MERCHANT_ID) {
          checkoutUrl = `https://inpay.uz/pay?merchant_id=${INPAY_MERCHANT_ID}&amount=${numPrice}&order_id=${orderId}`;
        }

        // Record in payment_requests
        try {
          await supabase.from('payment_requests').insert({
            user_id: ownerId,
            amount: numPrice,
            status: 'pending',
            notes: `Markaz Obunasi: ${center.name} (Order #${orderId})`,
            note: `center_sub:${center.id}:${orderId}`
          });

          await supabase.from('center_applications')
            .update({ payment_order_id: String(orderId) })
            .eq('id', application.id);
        } catch (prErr) {
          console.warn('[Payment Request Insert Warning]:', prErr.message);
        }
      }

      return res.json({
        success: true,
        center,
        application,
        checkout_url: checkoutUrl,
        order_id: orderId,
        message: "O'quv markazi muvaffaqiyatli ro'yxatdan o'tkazildi."
      });
    } catch (err) {
      console.error('[Center Register Error]:', err);
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * Create InPay Checkout Invoice for Center Subscription
   * POST /api/centers/subscription/inpay-create
   */
  app.post('/api/centers/subscription/inpay-create', async (req, res) => {
    try {
      const { center_id, plan_name = 'EduCenter Pro', amount = 490000, return_url } = req.body;

      if (!center_id) {
        return res.status(400).json({ error: 'center_id talab qilinadi' });
      }

      const { data: center } = await supabase.from('centers').select('*').eq('id', center_id).maybeSingle();
      if (!center) return res.status(404).json({ error: 'Markaz topilmadi' });

      const numAmount = Number(amount);
      const bearerToken = await getInPayBearerToken();

      if (!bearerToken) {
        return res.status(500).json({ error: 'InPay bilan bog\'lanishda xatolik' });
      }

      const callbackUrl = process.env.VITE_API_URL
        ? `${process.env.VITE_API_URL}/api/webhooks/inpay`
        : 'https://api.educontest.uz/api/webhooks/inpay';

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
          description: `EduContest O'quv markazi obunasi: ${center.name} (${plan_name})`,
          callback_url: callbackUrl,
          return_url: return_url || `https://educontest.uz/c/${center.username}`,
          phone: center.phone || undefined
        })
      });

      const inpayData = await createRes.json();

      let payUrl = inpayData?.pay_url || inpayData?.checkout_url;
      let orderId = inpayData?.order_id || `ORD_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

      if (!payUrl && INPAY_MERCHANT_ID) {
        payUrl = `https://inpay.uz/pay?merchant_id=${INPAY_MERCHANT_ID}&amount=${numAmount}&order_id=${orderId}`;
      }

      if (payUrl) {
        // Record payment request
        await supabase.from('payment_requests').insert({
          user_id: center.owner_id,
          amount: numAmount,
          status: 'pending',
          notes: `Markaz Obunasi: ${center.name} (Order #${orderId})`,
          note: `center_sub:${center.id}:${orderId}`
        });

        // Update application
        await supabase.from('center_applications')
          .update({ payment_order_id: String(orderId) })
          .eq('center_id', center.id);

        return res.json({
          success: true,
          order_id: orderId,
          checkout_url: payUrl
        });
      } else {
        return res.status(400).json({ error: inpayData?.message || 'InPay hisob yaratishda xatolik', details: inpayData });
      }
    } catch (err) {
      console.error('[Center InPay Create Error]:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // ==============================================================================
  // 3. CENTER ADMIN PANEL (MULTI-TENANT ENDPOINTS)
  // ==============================================================================

  /**
   * Get Current Authenticated Center Profile
   * GET /api/center/current
   */
  app.get('/api/center/current', centerAuthRequired, async (req, res) => {
    res.json({
      center: req.center,
      member: req.centerMember,
      permissions: req.centerPermissions
    });
  });

  /**
   * Center Admin Dashboard Stats (Real Data Only!)
   * GET /api/center/dashboard
   */
  app.get('/api/center/dashboard', centerAuthRequired, async (req, res) => {
    try {
      const centerId = req.center.id;

      // Parallel aggregated queries
      const [
        { count: classesCount },
        { count: studentsCount },
        { count: staffCount },
        { count: mocksCount },
        { count: completedAttemptsCount },
        { count: pendingRequestsCount },
        { data: attempts },
        { data: recentTests }
      ] = await Promise.all([
        supabase.from('center_classes').select('id', { count: 'exact', head: true }).eq('center_id', centerId).neq('status', 'ARCHIVED'),
        supabase.from('center_members').select('id', { count: 'exact', head: true }).eq('center_id', centerId).eq('role', 'STUDENT').eq('status', 'ACTIVE'),
        supabase.from('center_members').select('id', { count: 'exact', head: true }).eq('center_id', centerId).eq('role', 'CENTER_STAFF'),
        supabase.from('center_tests').select('id', { count: 'exact', head: true }).eq('center_id', centerId).neq('status', 'ARCHIVED'),
        supabase.from('center_test_attempts').select('id', { count: 'exact', head: true }).eq('center_id', centerId).eq('status', 'COMPLETED'),
        supabase.from('class_join_requests').select('id', { count: 'exact', head: true }).eq('center_id', centerId).eq('status', 'PENDING'),
        supabase.from('center_test_attempts').select('score, total_questions').eq('center_id', centerId).eq('status', 'COMPLETED').limit(500),
        supabase.from('center_tests').select('id, title, subject, mode, status, created_at').eq('center_id', centerId).order('created_at', { ascending: false }).limit(5)
      ]);

      let averageScore = 0;
      if (attempts && attempts.length > 0) {
        const total = attempts.reduce((acc, a) => acc + (Number(a.score) || 0), 0);
        averageScore = Math.round((total / attempts.length) * 10) / 10;
      }

      return res.json({
        classesCount: classesCount || 0,
        studentsCount: studentsCount || 0,
        staffCount: staffCount || 0,
        mocksCount: mocksCount || 0,
        completedAttemptsCount: completedAttemptsCount || 0,
        pendingRequestsCount: pendingRequestsCount || 0,
        averageScore,
        recentExams: recentTests || [],
        center: {
          id: req.center.id,
          name: req.center.name,
          username: req.center.username,
          logo_url: req.center.logo_url || null,
          status: req.center.status
        }
      });
    } catch (err) {
      console.error('[Center Dashboard Error]:', err);
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * Classes Management
   * GET /api/center/classes
   * POST /api/center/classes
   */
  app.get('/api/center/classes', centerAuthRequired, async (req, res) => {
    try {
      const centerId = req.center.id;
      const { data: classes, error } = await supabase
        .from('center_classes')
        .select('*')
        .eq('center_id', centerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Enrich with student counts and pending requests count
      const classIds = (classes || []).map(c => c.id);
      let studentCounts = {};
      let pendingCounts = {};

      if (classIds.length > 0) {
        const [
          { data: members },
          { data: pendingRequests }
        ] = await Promise.all([
          supabase
            .from('class_members')
            .select('class_id')
            .in('class_id', classIds)
            .eq('status', 'ACTIVE'),
          supabase
            .from('class_join_requests')
            .select('class_id')
            .in('class_id', classIds)
            .eq('status', 'PENDING')
        ]);

        (members || []).forEach(m => {
          studentCounts[m.class_id] = (studentCounts[m.class_id] || 0) + 1;
        });

        (pendingRequests || []).forEach(pr => {
          pendingCounts[pr.class_id] = (pendingCounts[pr.class_id] || 0) + 1;
        });
      }

      const enriched = (classes || []).map(c => ({
        ...c,
        students_count: studentCounts[c.id] || 0,
        pending_requests_count: pendingCounts[c.id] || 0
      }));

      return res.json({ classes: enriched });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/center/classes', centerAuthRequired, requirePerm('MANAGE_CLASSES'), async (req, res) => {
    try {
      const centerId = req.center.id;
      const { name, subject, teacher_name, description, start_date, end_date } = req.body;

      if (!name || !subject) {
        return res.status(400).json({ error: 'Sinf nomi va fan kiritilishi shart' });
      }

      // Generate unique class code
      let classCode = '';
      for (let i = 0; i < 5; i++) {
        const testCode = generateClassCode();
        const { data: existing } = await supabase.from('center_classes').select('id').eq('class_code', testCode).maybeSingle();
        if (!existing) {
          classCode = testCode;
          break;
        }
      }

      const { data: newClass, error } = await supabase
        .from('center_classes')
        .insert({
          center_id: centerId,
          name: name.trim(),
          subject: subject.trim(),
          teacher_name: teacher_name || null,
          class_code: classCode,
          description: description || null,
          start_date: start_date || null,
          end_date: end_date || null,
          created_by: req.user.id
        })
        .select()
        .single();

      if (error) throw error;

      await supabase.from('center_audit_logs').insert({
        center_id: centerId,
        actor_id: req.user.id,
        action: 'CLASS_CREATED',
        resource_type: 'class',
        resource_id: newClass.id,
        metadata: { name: newClass.name, code: newClass.class_code }
      });

      return res.json({ success: true, class: newClass });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/center/classes/:id', centerAuthRequired, async (req, res) => {
    try {
      const { id } = req.params;
      const centerId = req.center.id;

      const { data: classData, error } = await supabase
        .from('center_classes')
        .select('*')
        .eq('id', id)
        .eq('center_id', centerId)
        .single();

      if (error || !classData) return res.status(404).json({ error: 'Sinf topilmadi' });

      // Fetch enrolled students
      const { data: classMembers } = await supabase
        .from('class_members')
        .select('id, user_id, status, enrolled_at')
        .eq('class_id', id)
        .eq('status', 'ACTIVE');

      const userIds = (classMembers || []).map(m => m.user_id);
      let profilesMap = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, email, phone')
          .in('user_id', userIds);

        (profiles || []).forEach(p => { profilesMap[p.user_id] = p; });
      }

      const students = (classMembers || []).map(m => ({
        ...m,
        profile: profilesMap[m.user_id] || {}
      }));

      // Fetch assigned tests
      const { data: testLinks } = await supabase
        .from('center_test_classes')
        .select('center_test_id')
        .eq('class_id', id);

      const testIds = (testLinks || []).map(tl => tl.center_test_id);
      let tests = [];
      if (testIds.length > 0) {
        const { data: tData } = await supabase
          .from('center_tests')
          .select('*')
          .in('id', testIds);
        tests = tData || [];
      }

      return res.json({
        class: classData,
        students,
        tests
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch('/api/center/classes/:id', centerAuthRequired, requirePerm('MANAGE_CLASSES'), async (req, res) => {
    try {
      const { id } = req.params;
      const centerId = req.center.id;
      const { name, subject, teacher_name, description, status } = req.body;

      const { data, error } = await supabase
        .from('center_classes')
        .update({
          name: name || undefined,
          subject: subject || undefined,
          teacher_name: teacher_name || undefined,
          description: description || undefined,
          status: status || undefined,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('center_id', centerId)
        .select()
        .single();

      if (error) throw error;
      return res.json({ success: true, class: data });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/center/classes/:id', centerAuthRequired, requirePerm('MANAGE_CLASSES'), async (req, res) => {
    try {
      const { id } = req.params;
      const centerId = req.center.id;

      await supabase
        .from('center_classes')
        .update({ status: 'ARCHIVED', updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('center_id', centerId);

      return res.json({ success: true, message: "Sinf arxivlandi" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * Students Management
   * GET /api/center/students
   * POST /api/center/students/create
   */
  app.get('/api/center/students', centerAuthRequired, async (req, res) => {
    try {
      const centerId = req.center.id;

      const { data: members, error } = await supabase
        .from('center_members')
        .select('*')
        .eq('center_id', centerId)
        .eq('role', 'STUDENT')
        .order('joined_at', { ascending: false });

      if (error) throw error;

      const userIds = (members || []).map(m => m.user_id);
      let profilesMap = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, email, phone')
          .in('user_id', userIds);

        (profiles || []).forEach(p => { profilesMap[p.user_id] = p; });
      }

      // Fetch class memberships for these students
      const { data: classLinks } = await supabase
        .from('class_members')
        .select('user_id, class_id, center_classes(id, name, subject)')
        .eq('center_id', centerId)
        .eq('status', 'ACTIVE');

      const userClassesMap = {};
      (classLinks || []).forEach(cl => {
        if (!userClassesMap[cl.user_id]) userClassesMap[cl.user_id] = [];
        if (cl.center_classes) userClassesMap[cl.user_id].push(cl.center_classes);
      });

      const enriched = (members || []).map(m => ({
        ...m,
        profile: profilesMap[m.user_id] || {},
        classes: userClassesMap[m.user_id] || []
      }));

      return res.json({ students: enriched });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/center/students/create', centerAuthRequired, requirePerm('MANAGE_STUDENTS'), async (req, res) => {
    try {
      const centerId = req.center.id;
      const { full_name, username: studentUsername, phone, email, password, class_id, is_existing_account } = req.body;

      if (!full_name && !is_existing_account) {
        return res.status(400).json({ error: "O'quvchi to'liq ism-sharifini kiriting" });
      }

      let targetUserId = null;
      let generatedPass = password || `ec_stu_${Math.floor(100000 + Math.random() * 900000)}`;

      if (is_existing_account) {
        // Link existing EduContest account via email or phone
        const cleanPhone = (phone || '').replace(/\D/g, '');
        const targetEmail = (email || '').trim().toLowerCase();

        const { data: existingProf } = await supabase
          .from('profiles')
          .select('user_id, full_name, email, phone')
          .or(`email.eq.${targetEmail},phone.eq.${cleanPhone}`)
          .maybeSingle();

        if (!existingProf) {
          return res.status(404).json({ error: "Bunday EduContest foydalanuvchisi topilmadi." });
        }
        targetUserId = existingProf.user_id;
      } else {
        // Create new account
        const cleanUser = (studentUsername || '').trim().toLowerCase() || `student_${Date.now().toString().slice(-6)}`;
        const studentEmail = email?.trim() || `${cleanUser}@${req.center.username}.educontest.uz`;
        const cleanPhone = (phone || '').replace(/\D/g, '');

        // Use Supabase auth signUp
        const { data: suData, error: suErr } = await supabase.auth.signUp({
          email: studentEmail,
          password: generatedPass,
          options: { data: { full_name, phone: cleanPhone } }
        });

        if (suErr) {
          return res.status(400).json({ error: "Akkaunt yaratishda xatolik: " + suErr.message });
        }

        targetUserId = suData?.user?.id;
        if (targetUserId) {
          await supabase.from('profiles').upsert({
            user_id: targetUserId,
            full_name,
            phone: cleanPhone || null,
            email: studentEmail
          });
        }
      }

      if (!targetUserId) {
        return res.status(500).json({ error: "O'quvchi hisobini yaratish amalga oshmadi" });
      }

      // Add to center_members
      const { data: member, error: mErr } = await supabase
        .from('center_members')
        .upsert({
          center_id: centerId,
          user_id: targetUserId,
          role: 'STUDENT',
          status: 'ACTIVE',
          custom_username: studentUsername?.trim()?.toLowerCase() || null,
          force_password_change: !is_existing_account
        }, { onConflict: 'center_id,user_id' })
        .select()
        .single();

      if (mErr) throw mErr;

      // Add to class if provided
      if (class_id) {
        await supabase
          .from('class_members')
          .upsert({
            class_id,
            center_id: centerId,
            user_id: targetUserId,
            status: 'ACTIVE'
          }, { onConflict: 'class_id,user_id' });
      }

      await supabase.from('center_audit_logs').insert({
        center_id: centerId,
        actor_id: req.user.id,
        action: is_existing_account ? 'STUDENT_LINKED' : 'STUDENT_CREATED',
        resource_type: 'student',
        resource_id: targetUserId,
        metadata: { full_name, class_id }
      });

      return res.json({
        success: true,
        member,
        credentials: is_existing_account ? null : {
          login: studentUsername || email || `student_${targetUserId.slice(0, 6)}`,
          password: generatedPass,
          center_url: `https://educontest.uz/c/${req.center.username}`
        }
      });
    } catch (err) {
      console.error('[Create Student Error]:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/center/students/reset-password', centerAuthRequired, requirePerm('MANAGE_STUDENTS'), async (req, res) => {
    try {
      const { user_id } = req.body;
      const centerId = req.center.id;

      // Verify student belongs to center
      const { data: member } = await supabase
        .from('center_members')
        .select('id, user_id, custom_username')
        .eq('center_id', centerId)
        .eq('user_id', user_id)
        .maybeSingle();

      if (!member) return res.status(404).json({ error: "O'quvchi ushbu markazda topilmadi" });

      const newPass = `ec_${Math.floor(100000 + Math.random() * 900000)}`;

      // Update password directly in auth.users via pgcrypto
      await pgPool.query(
        `UPDATE auth.users 
         SET encrypted_password = crypt($1, gen_salt('bf'))
         WHERE id = $2`,
        [newPass, user_id]
      );

      await supabase.from('center_members')
        .update({ force_password_change: true })
        .eq('id', member.id);

      return res.json({
        success: true,
        temporary_password: newPass,
        message: "Parol muvaffaqiyatli tiklandi. Yangi parolni o'quvchiga taqdim eting."
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch('/api/center/students/:id/status', centerAuthRequired, requirePerm('MANAGE_STUDENTS'), async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body; // ACTIVE, INACTIVE, SUSPENDED
      const centerId = req.center.id;

      const { data, error } = await supabase
        .from('center_members')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('center_id', centerId)
        .select()
        .single();

      if (error) throw error;
      return res.json({ success: true, member: data });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/center/students/:id', centerAuthRequired, requirePerm('MANAGE_STUDENTS'), async (req, res) => {
    try {
      const { id } = req.params;
      const centerId = req.center.id;

      // Soft delete: remove membership, preserve historical test attempts!
      const { data: member } = await supabase.from('center_members').select('user_id').eq('id', id).eq('center_id', centerId).maybeSingle();
      if (member) {
        await supabase.from('class_members').delete().eq('center_id', centerId).eq('user_id', member.user_id);
        await supabase.from('center_members').delete().eq('id', id);
      }

      return res.json({ success: true, message: "O'quvchi markazdan chiqarildi (natijalar saqlanib qoldi)" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * Class Join Requests
   * GET /api/center/join-requests
   * POST /api/center/join-requests/:id/action
   */
  app.get('/api/center/join-requests', centerAuthRequired, async (req, res) => {
    try {
      const centerId = req.center.id;
      const { data: requests, error } = await supabase
        .from('class_join_requests')
        .select('*, center_classes(id, name, subject)')
        .eq('center_id', centerId)
        .eq('status', 'PENDING')
        .order('requested_at', { ascending: false });

      if (error) throw error;

      const userIds = (requests || []).map(r => r.user_id);
      let profilesMap = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, email, phone')
          .in('user_id', userIds);

        (profiles || []).forEach(p => { profilesMap[p.user_id] = p; });
      }

      const enriched = (requests || []).map(r => ({
        ...r,
        profile: profilesMap[r.user_id] || {}
      }));

      return res.json({ requests: enriched });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/center/join-requests/:id/action', centerAuthRequired, requirePerm('MANAGE_STUDENTS'), async (req, res) => {
    try {
      const { id } = req.params;
      const { action } = req.body; // 'approve' or 'reject'
      const centerId = req.center.id;

      const { data: joinReq } = await supabase
        .from('class_join_requests')
        .select('*, center_classes(id, name, subject, teacher_name)')
        .eq('id', id)
        .eq('center_id', centerId)
        .single();

      if (!joinReq) return res.status(404).json({ error: "So'rov topilmadi" });

      const targetClass = joinReq.center_classes;
      const { data: studentProf } = await supabase
        .from('profiles')
        .select('telegram_chat_id, full_name, email')
        .eq('user_id', joinReq.user_id)
        .maybeSingle();

      if (action === 'approve') {
        // Add to class_members
        await supabase.from('class_members').upsert({
          class_id: joinReq.class_id,
          center_id: centerId,
          user_id: joinReq.user_id,
          status: 'ACTIVE'
        }, { onConflict: 'class_id,user_id' });

        // Ensure center membership
        await supabase.from('center_members').upsert({
          center_id: centerId,
          user_id: joinReq.user_id,
          role: 'STUDENT',
          status: 'ACTIVE'
        }, { onConflict: 'center_id,user_id' });

        await supabase.from('class_join_requests')
          .update({ status: 'APPROVED', decided_at: new Date().toISOString(), decided_by: req.user.id })
          .eq('id', id);

        // Notify student via Telegram if linked
        if (studentProf?.telegram_chat_id && sendTelegramMessage) {
          try {
            await sendTelegramMessage(
              Number(studentProf.telegram_chat_id),
              `🎉 <b>TABRIKLAYMIZ! SINFGA QABUL QILINDINGIZ!</b>\n\n` +
              `O'quv markaz: <b>${req.center?.name || 'EduContest'}</b>\n` +
              `Sinf: <b>${targetClass?.name || 'Sinf'}</b>\n` +
              (targetClass?.teacher_name ? `Ustoz: <b>${targetClass.teacher_name}</b>\n` : '') +
              `Fan: <b>${targetClass?.subject || 'Umumiy'}</b>\n\n` +
              `Topshiriqlar va imtihonlarni topshirish uchun 'Sinflarim' sahifasiga o'ting:\n` +
              `🌐 https://educontest.uz/myclass`
            );
          } catch (tgErr) {
            console.warn('[Student Join Approve Telegram Warning]:', tgErr.message);
          }
        }

        return res.json({ success: true, message: "O'quvchi sinfga qabul qilindi" });
      } else {
        await supabase.from('class_join_requests')
          .update({ status: 'REJECTED', decided_at: new Date().toISOString(), decided_by: req.user.id })
          .eq('id', id);

        // Notify student via Telegram if linked
        if (studentProf?.telegram_chat_id && sendTelegramMessage) {
          try {
            await sendTelegramMessage(
              Number(studentProf.telegram_chat_id),
              `ℹ️ <b>Sinfga qo'shilish arizangiz rad etildi</b>\n\n` +
              `O'quv markaz: <b>${req.center?.name || 'EduContest'}</b>\n` +
              `Sinf: <b>${targetClass?.name || 'Sinf'}</b>\n\n` +
              `Iltimos, qo'shimcha ma'lumot olish uchun o'quv markazingiz ma'muriyati bilan bog'laning.`
            );
          } catch (tgErr) {
            console.warn('[Student Join Reject Telegram Warning]:', tgErr.message);
          }
        }

        return res.json({ success: true, message: "So'rov rad etildi" });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * Search Existing Global EduContest Mocks Library
   * GET /api/center/library/mocks
   */
  app.get('/api/center/library/mocks', centerAuthRequired, async (req, res) => {
    try {
      const { search, subject } = req.query;
      let query = supabase
        .from('mock_tests')
        .select('id, title, description, subject, type, duration_minutes, questions_count, is_active, created_at')
        .eq('is_active', true);

      if (subject && subject !== 'all') {
        query = query.eq('subject', subject);
      }
      if (search) {
        query = query.ilike('title', `%${search}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false }).limit(50);
      if (error) throw error;

      return res.json({ tests: data || [] });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * Center Mock Tests Management
   * GET /api/center/tests
   * POST /api/center/tests
   */
  app.get('/api/center/tests', centerAuthRequired, async (req, res) => {
    try {
      const centerId = req.center.id;
      const { data: tests, error } = await supabase
        .from('center_tests')
        .select('*, mock_tests(id, title, subject, questions_count)')
        .eq('center_id', centerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Count completed attempts for each test
      const testIds = (tests || []).map(t => t.id);
      let attemptsCountMap = {};
      if (testIds.length > 0) {
        const { data: attempts } = await supabase
          .from('center_test_attempts')
          .select('center_test_id')
          .in('center_test_id', testIds)
          .eq('status', 'COMPLETED');

        (attempts || []).forEach(a => {
          attemptsCountMap[a.center_test_id] = (attemptsCountMap[a.center_test_id] || 0) + 1;
        });
      }

      const enriched = (tests || []).map(t => ({
        ...t,
        completed_attempts: attemptsCountMap[t.id] || 0
      }));

      return res.json({ tests: enriched });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/center/tests', centerAuthRequired, requirePerm('CREATE_TEST'), async (req, res) => {
    try {
      const centerId = req.center.id;
      const {
        title,
        description,
        subject,
        source_test_id,
        mode = 'simple',
        duration_minutes = 120,
        attempt_limit = 1,
        result_policy = 'best',
        result_release_policy = 'immediate',
        exam_start_at,
        exam_end_at,
        auto_submit_at_exam_end = true,
        assign_all_classes = false,
        class_ids = [],
        custom_questions = [],
        publish_now = false
      } = req.body;

      if (!title) {
        return res.status(400).json({ error: 'Mock test nomi kiritilishi shart' });
      }

      // If exam mode, validate windows
      if (mode === 'exam' && (!exam_start_at || !exam_end_at)) {
        return res.status(400).json({ error: "Imtihon rejimi uchun boshlanish va tugash vaqtlari kiritilishi shart" });
      }

      const initialStatus = publish_now ? 'ACTIVE' : 'DRAFT';

      // 1. Insert center_tests
      const { data: centerTest, error: tErr } = await supabase
        .from('center_tests')
        .insert({
          center_id: centerId,
          source_test_id: source_test_id || null,
          created_by: req.user.id,
          title: title.trim(),
          description: description || null,
          subject: subject || null,
          mode,
          duration_minutes: Number(duration_minutes) || 120,
          attempt_limit: Number(attempt_limit) || 1,
          result_policy,
          result_release_policy,
          exam_start_at: exam_start_at || null,
          exam_end_at: exam_end_at || null,
          auto_submit_at_exam_end: Boolean(auto_submit_at_exam_end),
          assign_all_classes: Boolean(assign_all_classes),
          custom_questions: custom_questions || [],
          status: initialStatus
        })
        .select()
        .single();

      if (tErr) throw tErr;

      // 2. Assign classes
      if (Array.isArray(class_ids) && class_ids.length > 0) {
        const classInserts = class_ids.map(cid => ({
          center_test_id: centerTest.id,
          center_id: centerId,
          class_id: cid
        }));
        await supabase.from('center_test_classes').insert(classInserts);
      }

      await supabase.from('center_audit_logs').insert({
        center_id: centerId,
        actor_id: req.user.id,
        action: 'TEST_CREATED',
        resource_type: 'center_test',
        resource_id: centerTest.id,
        metadata: { title: centerTest.title, mode, source_test_id }
      });

      return res.json({ success: true, test: centerTest });
    } catch (err) {
      console.error('[Create Center Test Error]:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/center/tests/:id', centerAuthRequired, async (req, res) => {
    try {
      const { id } = req.params;
      const centerId = req.center.id;

      const { data: test, error } = await supabase
        .from('center_tests')
        .select('*, mock_tests(*)')
        .eq('id', id)
        .eq('center_id', centerId)
        .single();

      if (error || !test) return res.status(404).json({ error: 'Mock test topilmadi' });

      // Fetch assigned classes
      const { data: classLinks } = await supabase
        .from('center_test_classes')
        .select('class_id, center_classes(id, name, subject)')
        .eq('center_test_id', id);

      const assignedClasses = (classLinks || []).map(cl => cl.center_classes).filter(Boolean);

      // Fetch questions count
      let questionsCount = test.custom_questions?.length || 0;
      if (test.source_test_id) {
        const { count } = await supabase
          .from('mock_test_questions')
          .select('id', { count: 'exact', head: true })
          .eq('test_id', test.source_test_id);
        questionsCount = count || 0;
      }

      return res.json({
        test: {
          ...test,
          questions_count: questionsCount,
          assigned_classes: assignedClasses
        }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/center/tests/:id/publish', centerAuthRequired, requirePerm('EDIT_TEST'), async (req, res) => {
    try {
      const { id } = req.params;
      const centerId = req.center.id;

      const { data: test } = await supabase.from('center_tests').select('*').eq('id', id).eq('center_id', centerId).single();
      if (!test) return res.status(404).json({ error: 'Test topilmadi' });

      const newStatus = (test.mode === 'exam' && test.exam_start_at && new Date(test.exam_start_at) > new Date())
        ? 'SCHEDULED'
        : 'ACTIVE';

      const { data, error } = await supabase
        .from('center_tests')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await supabase.from('center_audit_logs').insert({
        center_id: centerId,
        actor_id: req.user.id,
        action: 'TEST_PUBLISHED',
        resource_type: 'center_test',
        resource_id: id,
        metadata: { title: test.title, status: newStatus }
      });

      return res.json({ success: true, test: data, message: "Mock test chop etildi!" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/center/tests/:id', centerAuthRequired, requirePerm('DELETE_TEST'), async (req, res) => {
    try {
      const { id } = req.params;
      const centerId = req.center.id;

      await supabase
        .from('center_tests')
        .update({ status: 'ARCHIVED', updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('center_id', centerId);

      return res.json({ success: true, message: "Test arxivlandi" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * Center Results & Rasch Calculations
   * GET /api/center/results
   * GET /api/center/results/:testId
   */
  app.get('/api/center/results', centerAuthRequired, async (req, res) => {
    try {
      const centerId = req.center.id;
      const { data: tests } = await supabase
        .from('center_tests')
        .select('id, title, subject, mode, status, created_at')
        .eq('center_id', centerId)
        .order('created_at', { ascending: false });

      // Get count of attempts for each
      const testIds = (tests || []).map(t => t.id);
      let attemptsCountMap = {};
      if (testIds.length > 0) {
        const { data: attempts } = await supabase
          .from('center_test_attempts')
          .select('center_test_id')
          .in('center_test_id', testIds)
          .eq('status', 'COMPLETED');

        (attempts || []).forEach(a => {
          attemptsCountMap[a.center_test_id] = (attemptsCountMap[a.center_test_id] || 0) + 1;
        });
      }

      const resultsOverview = (tests || []).map(t => ({
        ...t,
        completed_count: attemptsCountMap[t.id] || 0
      }));

      return res.json({ results: resultsOverview });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/center/results/:testId', centerAuthRequired, async (req, res) => {
    try {
      const { testId } = req.params;
      const centerId = req.center.id;

      // 1. Fetch test
      const { data: test, error: tErr } = await supabase
        .from('center_tests')
        .select('*')
        .eq('id', testId)
        .eq('center_id', centerId)
        .single();

      if (tErr || !test) return res.status(404).json({ error: 'Test topilmadi' });

      // 2. Fetch questions
      let questions = test.custom_questions || [];
      if (test.source_test_id) {
        const { data: qData } = await supabase
          .from('mock_test_questions')
          .select('id, question_number, correct_answer, type, metadata')
          .eq('test_id', test.source_test_id)
          .order('question_number', { ascending: true });
        questions = qData || [];
      }

      // 3. Fetch completed submissions
      const { data: submissions } = await supabase
        .from('center_test_attempts')
        .select('id, user_id, score, answers, correct_answers, total_questions, completed_at, created_at')
        .eq('center_test_id', testId)
        .eq('center_id', centerId)
        .eq('status', 'COMPLETED')
        .order('completed_at', { ascending: false });

      if (!submissions || submissions.length === 0) {
        return res.json({
          test,
          questions,
          submissions: [],
          rasch: {
            qStatsMap: {},
            participantResults: [],
            hardestQuestions: [],
            easiestQuestions: []
          }
        });
      }

      // 4. Enrich submissions with user profile & class
      const userIds = [...new Set(submissions.map(s => s.user_id))];
      let profilesMap = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, email, phone')
          .in('user_id', userIds);

        (profiles || []).forEach(p => { profilesMap[p.user_id] = p; });
      }

      const enrichedSubs = submissions.map(s => {
        const p = profilesMap[s.user_id] || {};
        return {
          ...s,
          user_name: p.full_name || "O'quvchi",
          user_email: p.email || ""
        };
      });

      // 5. Compute Rasch Model
      const rasch = computeRaschModel(questions, enrichedSubs);

      return res.json({
        test,
        questions,
        submissions: enrichedSubs,
        rasch
      });
    } catch (err) {
      console.error('[Center Results Error]:', err);
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * Staff Management
   * GET /api/center/staff
   * POST /api/center/staff
   */
  app.get('/api/center/staff', centerAuthRequired, async (req, res) => {
    try {
      const centerId = req.center.id;
      const { data: staffMembers, error } = await supabase
        .from('center_members')
        .select('*')
        .eq('center_id', centerId)
        .eq('role', 'CENTER_STAFF');

      if (error) throw error;

      const userIds = (staffMembers || []).map(s => s.user_id);
      let profilesMap = {};
      let permsMap = {};

      if (userIds.length > 0) {
        const [{ data: profiles }, { data: perms }] = await Promise.all([
          supabase.from('profiles').select('user_id, full_name, email, phone').in('user_id', userIds),
          supabase.from('center_staff_permissions').select('*').eq('center_id', centerId).in('user_id', userIds)
        ]);

        (profiles || []).forEach(p => { profilesMap[p.user_id] = p; });
        (perms || []).forEach(pm => { permsMap[pm.user_id] = pm; });
      }

      const enriched = (staffMembers || []).map(s => ({
        ...s,
        profile: profilesMap[s.user_id] || {},
        permissions: permsMap[s.user_id]?.permissions || [],
        assigned_classes: permsMap[s.user_id]?.assigned_classes || []
      }));

      return res.json({ staff: enriched });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/center/staff', centerAuthRequired, requirePerm('MANAGE_STAFF'), async (req, res) => {
    try {
      const centerId = req.center.id;
      const { email_or_phone, full_name, permissions = [], assigned_classes = [] } = req.body;

      if (!email_or_phone) {
        return res.status(400).json({ error: "Xodimning email yoki telefon raqamini kiriting" });
      }

      const cleanInput = email_or_phone.trim().toLowerCase();
      const cleanPhone = cleanInput.replace(/\D/g, '');

      // Check existing user
      let targetUserId = null;
      const { data: p } = await supabase.from('profiles').select('user_id').or(`email.eq.${cleanInput},phone.eq.${cleanPhone}`).maybeSingle();
      if (p) {
        targetUserId = p.user_id;
      } else {
        // Create user
        const autoPass = `ec_staff_${Math.floor(100000 + Math.random() * 900000)}`;
        const { data: suData, error: suErr } = await supabase.auth.signUp({
          email: cleanInput.includes('@') ? cleanInput : `staff_${cleanPhone}@${req.center.username}.educontest.uz`,
          password: autoPass,
          options: { data: { full_name: full_name || "O'qituvchi", phone: cleanPhone } }
        });
        if (suErr) throw suErr;
        targetUserId = suData?.user?.id;
        if (targetUserId) {
          await supabase.from('profiles').upsert({
            user_id: targetUserId,
            full_name: full_name || "O'qituvchi",
            phone: cleanPhone || null,
            email: cleanInput.includes('@') ? cleanInput : null
          });
        }
      }

      if (!targetUserId) {
        return res.status(400).json({ error: "Foydalanuvchi hisobini bog'lab bo'lmadi" });
      }

      // Add to center_members
      await supabase.from('center_members').upsert({
        center_id: centerId,
        user_id: targetUserId,
        role: 'CENTER_STAFF',
        status: 'ACTIVE'
      }, { onConflict: 'center_id,user_id' });

      // Add permissions
      await supabase.from('center_staff_permissions').upsert({
        center_id: centerId,
        user_id: targetUserId,
        permissions,
        assigned_classes
      }, { onConflict: 'center_id,user_id' });

      return res.json({ success: true, message: "Xodim muvaffaqiyatli qo'shildi" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/center/staff/:id', centerAuthRequired, requirePerm('MANAGE_STAFF'), async (req, res) => {
    try {
      const { id } = req.params;
      const centerId = req.center.id;

      const { data: member } = await supabase.from('center_members').select('user_id').eq('id', id).eq('center_id', centerId).maybeSingle();
      if (member) {
        await supabase.from('center_staff_permissions').delete().eq('center_id', centerId).eq('user_id', member.user_id);
        await supabase.from('center_members').delete().eq('id', id);
      }

      return res.json({ success: true, message: "Xodim markazdan o'chirildi" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * Telegram Linking & Settings
   * GET /api/center/telegram
   * POST /api/center/telegram/link
   */
  app.get('/api/center/telegram', centerAuthRequired, async (req, res) => {
    try {
      const centerId = req.center.id;
      const { data: center } = await supabase
        .from('centers')
        .select('id, telegram_chat_id, telegram_linked_at, telegram_username')
        .eq('id', centerId)
        .single();

      return res.json({
        connected: Boolean(center?.telegram_chat_id),
        chat_id: center?.telegram_chat_id || null,
        linked_at: center?.telegram_linked_at || null,
        bot_username: process.env.TELEGRAM_BOT_USERNAME || 'educontesttbot'
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/center/telegram/link', centerAuthRequired, requirePerm('MANAGE_TELEGRAM'), async (req, res) => {
    try {
      const centerId = req.center.id;
      const { chat_id } = req.body;

      if (!chat_id) return res.status(400).json({ error: 'Chat ID talab qilinadi' });

      await supabase
        .from('centers')
        .update({
          telegram_chat_id: Number(chat_id),
          telegram_linked_at: new Date().toISOString()
        })
        .eq('id', centerId);

      // Send confirmation message
      if (sendTelegramMessage) {
        await sendTelegramMessage(
          Number(chat_id),
          `🟢 <b>Tabriklaymiz!</b>\n\nSizning EduContest markazingiz (<b>${req.center.name}</b>) muvaffaqiyatli ulandi. Endi bildirishnomalar ushbu chatga keladi.`
        );
      }

      return res.json({ success: true, message: "Telegram muvaffaqiyatli ulandi" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * Center Subscription Overview
   * GET /api/center/subscription
   */
  app.get('/api/center/subscription', centerAuthRequired, async (req, res) => {
    try {
      const centerId = req.center.id;
      const { data: sub } = await supabase
        .from('center_subscriptions')
        .select('*')
        .eq('center_id', centerId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Fetch payment history
      const { data: payments } = await supabase
        .from('payment_requests')
        .select('*')
        .ilike('note', `%center_sub:${centerId}%`)
        .order('created_at', { ascending: false });

      return res.json({
        subscription: sub || {
          plan_name: 'EduCenter Pro',
          price: 490000,
          status: 'ACTIVE',
          next_billing_date: new Date(Date.now() + 30 * 86400000).toISOString(),
          limits: { max_students: 500, max_classes: 30, max_staff: 10, max_mocks: 100 }
        },
        payments: payments || []
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * Center Settings
   * PATCH /api/center/settings
   */
  app.patch('/api/center/settings', centerAuthRequired, requirePerm('ALL'), async (req, res) => {
    try {
      const centerId = req.center.id;
      const {
        name,
        legal_name,
        phone,
        email,
        description,
        address,
        subjects,
        branding,
        logo_url
      } = req.body;

      const { data, error } = await supabase
        .from('centers')
        .update({
          name: name || undefined,
          legal_name: legal_name || undefined,
          phone: phone || undefined,
          email: email || undefined,
          description: description || undefined,
          address: address || undefined,
          subjects: Array.isArray(subjects) ? subjects : undefined,
          branding: branding || undefined,
          logo_url: logo_url || undefined,
          updated_at: new Date().toISOString()
        })
        .eq('id', centerId)
        .select()
        .single();

      if (error) throw error;
      return res.json({ success: true, center: data });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==============================================================================
  // 4. STUDENT /MYCLASS PORTAL ENDPOINTS
  // ==============================================================================

  /**
   * Student MyClass Overview
   * GET /api/myclass/overview
   */
  app.get('/api/myclass/overview', authRequired, async (req, res) => {
    try {
      const userId = req.user.id;

      // 1. Fetch student's joined classes
      const { data: classMemberships } = await supabase
        .from('class_members')
        .select('class_id, enrolled_at, center_classes(*, centers(id, name, username, logo_url))')
        .eq('user_id', userId)
        .eq('status', 'ACTIVE');

      const enrolledClasses = (classMemberships || []).map(cm => ({
        ...cm.center_classes,
        enrolled_at: cm.enrolled_at
      })).filter(Boolean);

      const classIds = enrolledClasses.map(c => c.id);
      const centerIds = [...new Set(enrolledClasses.map(c => c.center_id))];

      // 2. Fetch available mock tests assigned to student's classes
      let availableTests = [];
      if (classIds.length > 0 || centerIds.length > 0) {
        // Fetch tests linked to specific classes
        const { data: testLinks } = await supabase
          .from('center_test_classes')
          .select('center_test_id, class_id')
          .in('class_id', classIds);

        const linkedTestIds = (testLinks || []).map(tl => tl.center_test_id);

        // Also fetch tests with assign_all_classes = true for student's centers
        let allClassTestIds = [];
        if (centerIds.length > 0) {
          const { data: allClassTests } = await supabase
            .from('center_tests')
            .select('id')
            .eq('assign_all_classes', true)
            .in('center_id', centerIds)
            .in('status', ['ACTIVE', 'SCHEDULED']);
          allClassTestIds = (allClassTests || []).map(t => t.id);
        }

        const testIds = [...new Set([...linkedTestIds, ...allClassTestIds])];

        if (testIds.length > 0) {
          const { data: tests } = await supabase
            .from('center_tests')
            .select('*, centers(id, name, username)')
            .in('id', testIds)
            .in('status', ['ACTIVE', 'SCHEDULED']);

          availableTests = tests || [];
        }
      }

      // 3. Fetch completed attempts
      const { data: attempts } = await supabase
        .from('center_test_attempts')
        .select('*, center_tests(id, title, subject, result_release_policy, exam_end_at, centers(name, username))')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Mask results if not yet released
      const safeAttempts = (attempts || []).map(a => {
        const test = a.center_tests;
        const isDelayed = test?.result_release_policy === 'after_window';
        const isWindowOpen = test?.exam_end_at && new Date() < new Date(test.exam_end_at);
        const isLocked = isDelayed && isWindowOpen;

        if (isLocked) {
          return {
            ...a,
            score: null,
            correct_answers: null,
            rasch_score: null,
            relative_rasch_percentage: null,
            rasch_grade: null,
            is_locked: true,
            lock_message: "Natijangiz imtihon yakunlangandan so'ng e'lon qilinadi."
          };
        }
        return { ...a, is_locked: false };
      });

      // 4. Fetch student's pending class requests
      const { data: pendingReqs } = await supabase
        .from('class_join_requests')
        .select('id, class_id, requested_at, status, center_classes(id, name, subject, teacher_name, centers(name, username, logo_url))')
        .eq('user_id', userId)
        .eq('status', 'PENDING')
        .order('requested_at', { ascending: false });

      return res.json({
        classes: enrolledClasses,
        availableTests,
        completedAttempts: safeAttempts,
        pendingRequests: pendingReqs || []
      });
    } catch (err) {
      console.error('[MyClass Overview Error]:', err);
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * Join a Class via Class Code (e.g. 7K4P91)
   * POST /api/myclass/join
   */
  app.post('/api/myclass/join', authRequired, async (req, res) => {
    try {
      const { code } = req.body;
      const userId = req.user.id;

      if (!code || typeof code !== 'string') {
        return res.status(400).json({ error: "Sinf kodini kiriting" });
      }

      const cleanCode = code.trim().toUpperCase();

      // 1. Find class by code
      const { data: targetClass } = await supabase
        .from('center_classes')
        .select('*, centers(id, name, username, status)')
        .eq('class_code', cleanCode)
        .maybeSingle();

      if (!targetClass) {
        return res.status(404).json({ error: "Bunday kodli sinf topilmadi. Kodni tekshirib qayta urinib ko'ring." });
      }

      if (targetClass.status !== 'ACTIVE' || targetClass.centers?.status !== 'ACTIVE') {
        return res.status(403).json({ error: "Ushbu sinf yoki markaz hozirda faol emas." });
      }

      // 2. Check if already enrolled
      const { data: existingMember } = await supabase
        .from('class_members')
        .select('id')
        .eq('class_id', targetClass.id)
        .eq('user_id', userId)
        .eq('status', 'ACTIVE')
        .maybeSingle();

      if (existingMember) {
        return res.status(400).json({ error: "Siz allaqachon ushbu sinf a'zosisiz." });
      }

      // 3. Check existing pending request
      const { data: existingReq } = await supabase
        .from('class_join_requests')
        .select('id')
        .eq('class_id', targetClass.id)
        .eq('user_id', userId)
        .eq('status', 'PENDING')
        .maybeSingle();

      if (existingReq) {
        return res.status(400).json({ error: "Sizning qo'shilish so'rovingiz allaqachon yuborilgan va tekshirilmoqda." });
      }

      // 4. Create join request
      const { data: newReq, error: rErr } = await supabase
        .from('class_join_requests')
        .insert({
          class_id: targetClass.id,
          center_id: targetClass.center_id,
          user_id: userId,
          status: 'PENDING'
        })
        .select()
        .single();

      if (rErr) throw rErr;

      // 5. Send notification to center admin
      await supabase.from('center_notifications').insert({
        center_id: targetClass.center_id,
        title: "Yangi o'quvchi so'rovi",
        message: `${req.user.user_metadata?.full_name || 'Yangi o\'quvchi'} "${targetClass.name}" sinfiga qo'shilishni so'radi.`,
        type: 'info',
        link: `/center/classes/${targetClass.id}`
      });

      // Send Telegram notification to center if linked
      const { data: centerRecord } = await supabase.from('centers').select('telegram_chat_id').eq('id', targetClass.center_id).single();
      if (centerRecord?.telegram_chat_id && sendTelegramMessage) {
        await sendTelegramMessage(
          centerRecord.telegram_chat_id,
          `🔔 <b>Yangi o'quvchi sinfga qo'shilishni so'radi!</b>\n\nSinf: <b>${targetClass.name}</b>\nO'quvchi: <b>${req.user.user_metadata?.full_name || 'Foydalanuvchi'}</b>\n\nTasdiqlash uchun markaz paneliga kiring.`
        );
      }

      return res.json({
        success: true,
        message: "Sinfga qo'shilish so'rovi yuborildi. Markaz administratori tasdiqlagach, sinf sizning ro'yxatingizda paydo bo'ladi.",
        request: newReq
      });
    } catch (err) {
      console.error('[Join Class Error]:', err);
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * Start Center Exam Session
   * POST /api/myclass/test/:assignmentId/start
   */
  app.post('/api/myclass/test/:assignmentId/start', authRequired, async (req, res) => {
    try {
      const { assignmentId } = req.params;
      const userId = req.user.id;

      // 1. Fetch center test
      const { data: test, error: tErr } = await supabase
        .from('center_tests')
        .select('*, centers(id, name, username, status)')
        .eq('id', assignmentId)
        .single();

      if (tErr || !test) return res.status(404).json({ error: 'Test topilmadi' });

      if (test.status !== 'ACTIVE') {
        return res.status(403).json({ error: "Ushbu test hozirda faol emas" });
      }

      // 2. Validate class membership
      const { data: assignedClasses } = await supabase
        .from('center_test_classes')
        .select('class_id')
        .eq('center_test_id', assignmentId);

      const assignedClassIds = (assignedClasses || []).map(ac => ac.class_id);

      if (!test.assign_all_classes && assignedClassIds.length > 0) {
        const { data: memberInClass } = await supabase
          .from('class_members')
          .select('class_id')
          .in('class_id', assignedClassIds)
          .eq('user_id', userId)
          .eq('status', 'ACTIVE')
          .maybeSingle();

        if (!memberInClass) {
          return res.status(403).json({ error: "Ushbu test faqat tegishli sinf o'quvchilari uchun mo'ljallangan" });
        }
      }

      // 3. Enforce Exam Window (if mode === 'exam')
      const now = new Date();
      if (test.mode === 'exam') {
        if (test.exam_start_at && now < new Date(test.exam_start_at)) {
          return res.status(403).json({ error: "Imtihon hali boshlanmagan. Iltimos, belgilangan vaqtda kiring." });
        }
        if (test.exam_end_at && now > new Date(test.exam_end_at)) {
          return res.status(403).json({ error: "Imtihon topshirish vaqti tugagan." });
        }
      }

      // 4. Enforce attempt limits
      if (test.attempt_limit && test.attempt_limit > 0) {
        const { count: attemptCount } = await supabase
          .from('center_test_attempts')
          .select('id', { count: 'exact', head: true })
          .eq('center_test_id', assignmentId)
          .eq('user_id', userId)
          .eq('status', 'COMPLETED');

        if (attemptCount && attemptCount >= test.attempt_limit) {
          return res.status(403).json({
            error: `Siz ajratilgan barcha ${test.attempt_limit} ta urinishdan foydalanib bo'ldingiz.`
          });
        }
      }

      // 5. Calculate remaining time
      let allowedSeconds = (Number(test.duration_minutes) || 120) * 60;

      if (test.mode === 'exam' && test.auto_submit_at_exam_end && test.exam_end_at) {
        const msUntilWindowEnd = new Date(test.exam_end_at).getTime() - now.getTime();
        const secondsUntilWindowEnd = Math.max(0, Math.floor(msUntilWindowEnd / 1000));
        allowedSeconds = Math.min(allowedSeconds, secondsUntilWindowEnd);
      }

      // 6. Create attempt record
      const { data: attempt, error: aErr } = await supabase
        .from('center_test_attempts')
        .insert({
          center_test_id: assignmentId,
          center_id: test.center_id,
          user_id: userId,
          status: 'IN_PROGRESS',
          started_at: now.toISOString()
        })
        .select()
        .single();

      if (aErr) throw aErr;

      // 7. Load questions (strip correct answers for security!)
      let questions = [];
      if (test.source_test_id) {
        const { data: qData } = await supabase
          .from('mock_test_questions')
          .select('id, question_number, question_text, question_image, question_subtext, type, metadata, explanation')
          .eq('test_id', test.source_test_id)
          .order('question_number', { ascending: true });

        questions = qData || [];
      } else {
        questions = (test.custom_questions || []).map(q => ({
          id: q.id || Math.random().toString(),
          question_number: q.question_number,
          question_text: q.question_text,
          question_image: q.question_image,
          type: q.type,
          metadata: q.metadata
        }));
      }

      return res.json({
        success: true,
        attempt_id: attempt.id,
        test: {
          id: test.id,
          title: test.title,
          subject: test.subject,
          duration_minutes: test.duration_minutes,
          mode: test.mode,
          exam_end_at: test.exam_end_at
        },
        allowed_seconds: allowedSeconds,
        questions
      });
    } catch (err) {
      console.error('[Start Test Error]:', err);
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * Submit Center Exam Answers
   * POST /api/myclass/test/:assignmentId/submit
   */
  app.post('/api/myclass/test/:assignmentId/submit', authRequired, async (req, res) => {
    try {
      const { assignmentId } = req.params;
      const { attempt_id, answers } = req.body;
      const userId = req.user.id;

      const { data: test } = await supabase.from('center_tests').select('*').eq('id', assignmentId).single();
      if (!test) return res.status(404).json({ error: 'Test topilmadi' });

      // Fetch questions with correct answers to score
      let questions = [];
      if (test.source_test_id) {
        const { data: qData } = await supabase
          .from('mock_test_questions')
          .select('id, question_number, correct_answer, type')
          .eq('test_id', test.source_test_id)
          .order('question_number', { ascending: true });
        questions = qData || [];
      } else {
        questions = test.custom_questions || [];
      }

      let correctCount = 0;
      const totalQuestions = questions.length;

      questions.forEach((q, idx) => {
        const qNum = q.question_number || (idx + 1);
        const userAns = answers?.[qNum] ?? answers?.[String(qNum)];
        if (userAns !== undefined && userAns !== null && userAns !== "") {
          let isCorrect = false;
          if (typeof userAns === "object") {
            isCorrect = Boolean(userAns.is_correct || userAns.isCorrect);
          } else {
            const corr = q.correct_answer;
            if (typeof corr === "string") {
              isCorrect = String(userAns).trim().toUpperCase() === String(corr).trim().toUpperCase();
            } else if (typeof corr === "object") {
              isCorrect = JSON.stringify(userAns) === JSON.stringify(corr);
            }
          }
          if (isCorrect) correctCount++;
        }
      });

      const score = correctCount;

      // Update attempt
      await supabase
        .from('center_test_attempts')
        .update({
          answers: answers || {},
          score,
          correct_answers: correctCount,
          total_questions: totalQuestions,
          completed_at: new Date().toISOString(),
          status: 'COMPLETED'
        })
        .eq('id', attempt_id)
        .eq('user_id', userId);

      // Check if results can be displayed immediately
      const isDelayed = test.result_release_policy === 'after_window';
      const isWindowOpen = test.exam_end_at && new Date() < new Date(test.exam_end_at);
      const isLocked = isDelayed && isWindowOpen;

      if (isLocked) {
        return res.json({
          success: true,
          released: false,
          message: "Test yakunlandi. Natijangiz imtihon yakunlangandan so'ng e'lon qilinadi."
        });
      }

      return res.json({
        success: true,
        released: true,
        score,
        correct_answers: correctCount,
        total_questions: totalQuestions,
        percentage: Math.round((correctCount / (totalQuestions || 1)) * 100)
      });
    } catch (err) {
      console.error('[Submit Test Error]:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // ==============================================================================
  // 5. SUPER ADMIN CENTER MANAGEMENT (/admin/centers)
  // ==============================================================================

  /**
   * Super Admin: List All Centers
   * GET /api/admin/centers
   */
  app.get('/api/admin/centers', adminRequired, async (req, res) => {
    try {
      const { status } = req.query; // all, pending, active, suspended, rejected

      let query = supabase
        .from('centers')
        .select('*')
        .order('created_at', { ascending: false });

      if (status && status !== 'all') {
        if (status === 'pending') {
          query = query.in('status', ['PENDING_APPROVAL', 'PENDING_PAYMENT']);
        } else {
          query = query.eq('status', status.toUpperCase());
        }
      }

      const { data: centers, error } = await query;
      if (error) throw error;

      if (!centers || centers.length === 0) {
        return res.json({ centers: [] });
      }

      const centerIds = centers.map(c => c.id);
      const ownerIds = [...new Set(centers.map(c => c.owner_id).filter(Boolean))];

      const [
        { data: profiles },
        { data: applications },
        { data: members },
        { data: classes },
        { data: mocks }
      ] = await Promise.all([
        ownerIds.length > 0
          ? supabase.from('profiles').select('user_id, full_name, email, phone').in('user_id', ownerIds)
          : { data: [] },
        supabase.from('center_applications').select('*').in('center_id', centerIds).order('created_at', { ascending: false }),
        supabase.from('center_members').select('center_id').in('center_id', centerIds).eq('role', 'STUDENT'),
        supabase.from('center_classes').select('center_id').in('center_id', centerIds).neq('status', 'ARCHIVED'),
        supabase.from('center_tests').select('center_id').in('center_id', centerIds).neq('status', 'ARCHIVED')
      ]);

      const profMap = new Map((profiles || []).map(p => [p.user_id, p]));
      const appMap = new Map();
      (applications || []).forEach(a => {
        if (!appMap.has(a.center_id)) appMap.set(a.center_id, a);
      });

      const memberCountMap = new Map();
      (members || []).forEach(m => {
        memberCountMap.set(m.center_id, (memberCountMap.get(m.center_id) || 0) + 1);
      });

      const classCountMap = new Map();
      (classes || []).forEach(c => {
        classCountMap.set(c.center_id, (classCountMap.get(c.center_id) || 0) + 1);
      });

      const mockCountMap = new Map();
      (mocks || []).forEach(m => {
        mockCountMap.set(m.center_id, (mockCountMap.get(m.center_id) || 0) + 1);
      });

      const enriched = centers.map(c => {
        const ownerProf = profMap.get(c.owner_id);
        return {
          ...c,
          owner: {
            user_id: c.owner_id,
            full_name: ownerProf?.full_name || c.name,
            email: ownerProf?.email || c.email || '',
            phone: ownerProf?.phone || c.phone || ''
          },
          application: appMap.get(c.id) || null,
          students_count: memberCountMap.get(c.id) || 0,
          classes_count: classCountMap.get(c.id) || 0,
          mocks_count: mockCountMap.get(c.id) || 0
        };
      });

      return res.json({ centers: enriched });
    } catch (err) {
      console.error('[Admin Centers Query Error]:', err);
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * Super Admin: High-Level Centers Analytics
   * GET /api/admin/centers/analytics
   */
  app.get('/api/admin/centers/analytics', adminRequired, async (req, res) => {
    try {
      const [
        { count: totalCenters },
        { count: activeCenters },
        { count: pendingApplications },
        { count: totalStudents },
        { count: totalClasses },
        { count: totalMocks },
        { count: totalAttempts }
      ] = await Promise.all([
        supabase.from('centers').select('id', { count: 'exact', head: true }),
        supabase.from('centers').select('id', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
        supabase.from('center_applications').select('id', { count: 'exact', head: true }).in('status', ['PENDING_APPROVAL', 'PENDING_PAYMENT']),
        supabase.from('center_members').select('id', { count: 'exact', head: true }).eq('role', 'STUDENT'),
        supabase.from('center_classes').select('id', { count: 'exact', head: true }).neq('status', 'ARCHIVED'),
        supabase.from('center_tests').select('id', { count: 'exact', head: true }).neq('status', 'ARCHIVED'),
        supabase.from('center_test_attempts').select('id', { count: 'exact', head: true }).eq('status', 'COMPLETED')
      ]);

      const activeCount = activeCenters || 0;
      const estimatedMRR = activeCount * 490000;

      return res.json({
        totalCenters: totalCenters || 0,
        activeCenters: activeCount,
        pendingApplications: pendingApplications || 0,
        totalStudents: totalStudents || 0,
        totalClasses: totalClasses || 0,
        totalMocks: totalMocks || 0,
        totalAttempts: totalAttempts || 0,
        mrr: estimatedMRR
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * Super Admin: Approve Center Application
   * POST /api/admin/centers/:id/approve
   */
  app.post('/api/admin/centers/:id/approve', adminRequired, async (req, res) => {
    try {
      const { id } = req.params;

      const { data: center } = await supabase.from('centers').select('*').eq('id', id).single();
      if (!center) return res.status(404).json({ error: 'Markaz topilmadi' });

      // 1. Activate Center
      await supabase.from('centers').update({ status: 'ACTIVE', updated_at: new Date().toISOString() }).eq('id', id);

      // Check application for trial or paid plan
      const { data: application } = await supabase.from('center_applications').select('*').eq('center_id', id).maybeSingle();
      const isTrial = application?.payment_status === 'trial' || 
                      Number(application?.plan_price) === 0 ||
                      String(application?.plan_name).toLowerCase().includes('sinov') || 
                      String(application?.plan_name).toLowerCase().includes('trial');

      const nextBillingDate = new Date();
      nextBillingDate.setDate(nextBillingDate.getDate() + (isTrial ? 14 : 30));

      // 2. Activate Application
      await supabase.from('center_applications')
        .update({
          status: 'APPROVED',
          payment_status: isTrial ? 'trial' : 'completed',
          reviewed_by: req.user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('center_id', id);

      // 3. Ensure Subscription is ACTIVE / TRIAL with correct next_billing_date
      await supabase.from('center_subscriptions')
        .update({
          status: isTrial ? 'TRIAL' : 'ACTIVE',
          billing_cycle: isTrial ? 'trial_14_days' : 'monthly',
          next_billing_date: nextBillingDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('center_id', id);

      // 4. Update owner role and center membership
      try {
        await pgPool.query(`
          INSERT INTO user_roles (id, user_id, role)
          VALUES (gen_random_uuid(), $1, 'center_owner')
          ON CONFLICT (user_id, role) DO NOTHING;
        `, [center.owner_id]);
      } catch (rErr) {
        console.warn('[Approve user_roles warning]:', rErr?.message);
      }

      try {
        const { data: exMem } = await supabase
          .from('center_members')
          .select('id')
          .eq('center_id', id)
          .eq('user_id', center.owner_id)
          .maybeSingle();

        if (!exMem) {
          await supabase.from('center_members').insert({
            center_id: id,
            user_id: center.owner_id,
            role: 'CENTER_OWNER',
            status: 'ACTIVE'
          });
        } else {
          await supabase.from('center_members').update({
            role: 'CENTER_OWNER',
            status: 'ACTIVE'
          }).eq('id', exMem.id);
        }
      } catch (mErr) {
        console.warn('[Approve center_members warning]:', mErr?.message);
      }

      // 5. Generate secure initial password for owner
      const safeCleanName = (center.name || 'Center').replace(/[^a-zA-Z0-9]/g, '');
      const generatedPassword = `${safeCleanName}_Pass${Math.floor(1000 + Math.random() * 9000)}`;

      if (pgPool) {
        try {
          await pgPool.query("CREATE EXTENSION IF NOT EXISTS pgcrypto;");
          await pgPool.query(
            `UPDATE auth.users 
             SET encrypted_password = crypt($1, gen_salt('bf')),
                 email_confirmed_at = COALESCE(email_confirmed_at, now())
             WHERE id = $2`,
            [generatedPassword, center.owner_id]
          );
        } catch (pwErr) {
          console.error('[Approve Auth Password Update Error]:', pwErr);
        }
      }

      // Fetch owner profile for details
      const { data: ownerProf } = await supabase.from('profiles').select('*').eq('user_id', center.owner_id).maybeSingle();
      const loginEmail = ownerProf?.email || center.email || `center_${center.username}@educontest.uz`;
      const loginPhone = ownerProf?.phone || center.phone || '';

      // Save credentials in social_links for reference
      try {
        await supabase.from('centers').update({
          social_links: { ...(center.social_links || {}), _temp_pass: generatedPassword, _owner_email: loginEmail }
        }).eq('id', id);
      } catch (sErr) {}

      // 6. Send Telegram credentials message
      let telegramSent = false;
      if (center.telegram_chat_id && sendTelegramMessage) {
        try {
          const expirationDateStr = nextBillingDate.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
          const planTitle = isTrial ? '🎁 14 kunlik bepul sinov (Trial)' : `⭐️ ${application?.plan_name || 'Standart'}`;

          await sendTelegramMessage(
            Number(center.telegram_chat_id),
            `🎉 <b>TABRIKLAYMIZ! MARKAZINGIZ TASDIQLANDI!</b>\n\n` +
            `Hurmatli <b>${ownerProf?.full_name || 'Administrator'}</b>!\n` +
            `Sizning <b>${center.name}</b> o'quv markazingiz EduContest tizimida muvaffaqiyatli tasdiqlandi va faollashtirildi!\n\n` +
            `📌 <b>Tarif:</b> ${planTitle}\n` +
            (isTrial ? `⏳ <b>Sinov muddati tugash sanasi:</b> ${expirationDateStr}\n\n` : '') +
            `🔐 <b>Boshqaruv paneliga kirish ma'lumotlaringiz:</b>\n` +
            `🌐 <b>Kirish portali:</b> https://educontest.uz/c/${center.username}\n` +
            `👤 <b>Login (Email):</b> <code>${loginEmail}</code>\n` +
            (loginPhone ? `📱 <b>Telefon:</b> <code>${loginPhone}</code>\n` : '') +
            `🔑 <b>Parol:</b> <code>${generatedPassword}</code>\n\n` +
            `<i>Iltimos, ushbu ma'lumotlarni saqlab qo'ying. Markaz login sahifasida ushbu parol orqali tizimga kirishingiz mumkin.</i>`
          );
          telegramSent = true;
        } catch (tgErr) {
          console.error('[Approve Telegram Send Error]:', tgErr);
        }
      }

      // 7. Send in-app notification
      await supabase.from('center_notifications').insert({
        center_id: id,
        user_id: center.owner_id,
        title: "Markazingiz tasdiqlandi! 🎉",
        message: `Tabriklaymiz, "${center.name}" markazi EduContest tizimida muvaffaqiyatli tasdiqlandi. Boshqaruv paneli login va paroli Telegram botingizga yuborildi.`,
        type: 'success',
        link: '/center'
      });

      await supabase.from('center_audit_logs').insert({
        center_id: id,
        actor_id: req.user.id,
        action: 'CENTER_APPROVED',
        resource_type: 'center',
        resource_id: id
      });

      return res.json({
        success: true,
        message: telegramSent
          ? "Markaz muvaffaqiyatli tasdiqlandi va login/parol Telegram botga yuborildi!"
          : "Markaz tasdiqlandi (Telegram chat ID mavjud bo'lmagani sababli botga yuborilmadi)",
        credentials: {
          login: loginEmail,
          password: generatedPassword,
          phone: loginPhone,
          center_url: `https://educontest.uz/c/${center.username}`,
          telegram_sent: telegramSent
        }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * Super Admin: Reject Center Application
   * POST /api/admin/centers/:id/reject
   */
  app.post('/api/admin/centers/:id/reject', adminRequired, async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const { data: center } = await supabase.from('centers').select('*').eq('id', id).single();
      if (!center) return res.status(404).json({ error: 'Markaz topilmadi' });

      await supabase.from('centers').update({ status: 'REJECTED', updated_at: new Date().toISOString() }).eq('id', id);
      await supabase.from('center_applications')
        .update({
          status: 'REJECTED',
          rejection_reason: reason || "Ma'lumotlar to'liq emas yoki talabga javob bermaydi.",
          reviewed_by: req.user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('center_id', id);

      return res.json({ success: true, message: "Markaz arizasi rad etildi" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * Super Admin: Toggle Center Status (Suspend/Activate)
   * PATCH /api/admin/centers/:id/status
   */
  app.patch('/api/admin/centers/:id/status', adminRequired, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body; // 'ACTIVE' or 'SUSPENDED'

      await supabase.from('centers').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
      return res.json({ success: true, message: `Markaz holati o'zgartirildi: ${status}` });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
};
