const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { readDb, writeDb } = require('../lib/db');
const { getJwtSecret, isGoogleAuthOnly } = require('../lib/config');
const {
  createOAuthState,
  consumeOAuthState,
  stashPendingLogin,
  takePendingLoginOrReplay,
  getGoogleConfig,
  isGoogleOAuthEnabled,
  getSigninScopes,
  exchangeCodeForTokens,
  fetchGoogleUserInfo,
  revokeGoogleAccessToken,
} = require('../lib/googleOAuth');
const { auth } = require('../middleware/auth');

const router = express.Router();

const MIN_PASSWORD_LEN = 8;

router.get('/invite-preview', (req, res) => {
  const token = typeof req.query.token === 'string' ? req.query.token.trim() : '';
  if (!token) {
    return res.status(400).json({ error: 'token required' });
  }
  const db = readDb();
  const inv = (db.invitations || []).find((i) => i.token === token && !i.usedAt);
  if (!inv || new Date(inv.expiresAt) < new Date()) {
    return res.json({ valid: false });
  }
  res.json({
    valid: true,
    email: inv.email,
    role: inv.role,
  });
});

router.post('/register', (req, res) => {
  const { email, password, name, inviteToken } = req.body || {};
  const emailTrim = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (!emailTrim) {
    return res.status(400).json({ error: 'Email required' });
  }

  const googleOnly = isGoogleAuthOnly();
  const hasInvite = inviteToken && typeof inviteToken === 'string' && inviteToken.trim().length > 0;

  if (googleOnly && !hasInvite) {
    return res.status(403).json({
      error:
        'Self-service password registration is disabled. Sign in with Google first, or open a valid invitation link.',
    });
  }

  const db = readDb();
  db.users = db.users || [];
  db.invitations = db.invitations || [];

  if (db.users.some((u) => u.email.toLowerCase() === emailTrim)) {
    return res.status(400).json({ error: 'Email already registered' });
  }

  let role = 'pending';
  let projectIds = [];

  if (hasInvite) {
    const inv = db.invitations.find((i) => i.token === inviteToken.trim() && !i.usedAt);
    if (!inv || new Date(inv.expiresAt) < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired invitation' });
    }
    if (inv.email !== emailTrim) {
      return res.status(400).json({ error: 'Email must match the invitation' });
    }
    role = inv.role;
    projectIds = inv.role === 'auditor' ? null : [...(inv.projectIds || [])];
    inv.usedAt = new Date().toISOString();
  }

  let passwordHash;
  const pwd = password != null ? String(password) : '';
  if (googleOnly && hasInvite) {
    if (pwd.length > 0 && pwd.length < MIN_PASSWORD_LEN) {
      return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LEN} characters` });
    }
    passwordHash = pwd.length >= MIN_PASSWORD_LEN ? bcrypt.hashSync(pwd, 10) : null;
  } else {
    if (!pwd || pwd.length < MIN_PASSWORD_LEN) {
      return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LEN} characters` });
    }
    passwordHash = bcrypt.hashSync(pwd, 10);
  }

  const id = uuidv4();
  const user = {
    id,
    email: emailTrim,
    passwordHash,
    name: (name && String(name).trim()) || emailTrim.split('@')[0],
    role,
    projectIds,
  };

  db.users.push(user);
  writeDb(db);

  const token = jwt.sign(
    { id: user.id, role: user.role, projectIds: user.projectIds },
    getJwtSecret(),
    { expiresIn: '7d' }
  );

  res.status(201).json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      projectIds: user.projectIds,
    },
  });
});

router.get('/google/enabled', (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.set('Pragma', 'no-cache');
  const googleOAuth = isGoogleOAuthEnabled();
  res.json({
    googleOAuth,
    passwordLogin: !isGoogleAuthOnly(),
    selfServicePasswordRegister: !isGoogleAuthOnly(),
  });
});

router.get('/google', (req, res) => {
  const cfg = getGoogleConfig();
  if (!cfg) {
    return res.status(503).json({ error: 'Google sign-in is not configured' });
  }
  const { state, codeChallenge } = createOAuthState();
  const params = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
    response_type: 'code',
    scope: getSigninScopes(),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    access_type: 'online',
  });
  // Omitting prompt lets Google reuse an active browser session (fewer screens). Set
  // GOOGLE_OAUTH_PROMPT=select_account in deploy.env to always show the account chooser.
  const oauthPrompt = typeof process.env.GOOGLE_OAUTH_PROMPT === 'string' ? process.env.GOOGLE_OAUTH_PROMPT.trim() : '';
  if (oauthPrompt) params.set('prompt', oauthPrompt);

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

router.get('/google/callback', async (req, res) => {
  const cfg = getGoogleConfig();
  // Same-origin relative redirects: browser stays on https://cod-data.com even if Host is 10.x:5010
  // behind NPM (absolute URLs were sending users to localhost:3010 or the backend IP).
  const fail = (code) => {
    const q = code ? `?error=${encodeURIComponent(code)}` : '';
    res.redirect(`/login${q}`);
  };

  if (!cfg) {
    return res.status(503).send('Google OAuth not configured');
  }

  if (req.query.error) {
    return fail(req.query.error === 'access_denied' ? 'google_denied' : 'google_oauth_failed');
  }

  const { code, state } = req.query;
  const oauthRow = state ? consumeOAuthState(state) : null;
  if (!code || !oauthRow) {
    return fail('oauth_state_invalid');
  }

  let googleAccessToken;
  try {
    const tokens = await exchangeCodeForTokens(code, cfg, oauthRow.codeVerifier);
    googleAccessToken = tokens.access_token;
    const info = await fetchGoogleUserInfo(googleAccessToken);
    if (!info.email || !info.verified_email) {
      return fail('google_email_unverified');
    }

    const email = String(info.email).toLowerCase();
    if (cfg.allowedEmailDomain) {
      const dom = cfg.allowedEmailDomain.replace(/^@/, '').toLowerCase();
      if (!email.endsWith(`@${dom}`)) {
        return fail('google_domain_not_allowed');
      }
    }

    const db = readDb();
    db.users = db.users || [];
    let user = db.users.find((u) => u.email.toLowerCase() === email);

    if (!user) {
      const id = uuidv4();
      const displayName =
        (typeof info.name === 'string' && info.name.trim()) || email.split('@')[0];
      user = {
        id,
        email,
        passwordHash: null,
        name: displayName,
        role: 'pending',
        projectIds: [],
      };
      db.users.push(user);
      writeDb(db);
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, projectIds: user.projectIds },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    const displayName =
      user.name || (typeof info.name === 'string' && info.name.trim()) || email.split('@')[0];

    const userOut = {
      id: user.id,
      email: user.email,
      name: displayName,
      role: user.role,
      projectIds: user.projectIds,
    };

    const nonce = stashPendingLogin({ token, user: userOut });
    res.redirect(`/auth/callback?nonce=${encodeURIComponent(nonce)}`);
  } catch (e) {
    console.error('Google OAuth callback:', e.message);
    return fail('google_oauth_failed');
  } finally {
    if (googleAccessToken) {
      revokeGoogleAccessToken(googleAccessToken).catch(() => {});
    }
  }
});

router.post('/google/complete', (req, res) => {
  const nonce = req.body && req.body.nonce;
  const data = takePendingLoginOrReplay(nonce);
  if (!data) {
    return res.status(400).json({ error: 'Invalid or expired sign-in session. Try again.' });
  }
  res.json(data);
});

/** Re-issue JWT from current db row (role / projects). Use after an auditor updates the account. */
router.get('/session', auth, (req, res) => {
  const db = readDb();
  const user = db.users.find((u) => u.id === req.user.id);
  if (!user) {
    return res.status(401).json({ error: 'Account no longer exists' });
  }
  const token = jwt.sign(
    { id: user.id, role: user.role, projectIds: user.projectIds },
    getJwtSecret(),
    { expiresIn: '7d' }
  );
  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      projectIds: user.projectIds,
    },
  });
});

router.post('/login', (req, res) => {
  if (isGoogleAuthOnly()) {
    return res.status(403).json({ error: 'Password sign-in is disabled. Use Google.' });
  }

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const db = readDb();
  const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (user.passwordHash == null || user.passwordHash === '') {
    return res.status(401).json({
      error: 'Invalid credentials',
      hint: 'This account uses Google sign-in only, or has no password set.',
    });
  }

  const valid = bcrypt.compareSync(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id, role: user.role, projectIds: user.projectIds },
    getJwtSecret(),
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role, projectIds: user.projectIds },
  });
});

module.exports = router;
