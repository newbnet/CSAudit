const crypto = require('crypto');

const STATE_TTL_MS = 10 * 60 * 1000;
const NONCE_TTL_MS = 2 * 60 * 1000;
/** After a nonce is consumed, replay same nonce for this long (React Strict Mode double-mount in dev). */
const COMPLETE_REPLAY_MS = 3 * 60 * 1000;

/** OAuth state → { created, codeVerifier } (PKCE verifier, never sent to browser) */
const oauthStates = new Map();
const pendingNonces = new Map();
const oauthCompleteReplay = new Map();

/** Scopes: smallest set for sign-in only (incremental auth — see Google best practices). */
const GOOGLE_SIGNIN_SCOPES = 'openid email';

function pruneStates() {
  const now = Date.now();
  for (const [k, v] of oauthStates) {
    const created = typeof v === 'number' ? v : v.created;
    if (now - created > STATE_TTL_MS) oauthStates.delete(k);
  }
}

function prunePending() {
  const now = Date.now();
  for (const [k, v] of pendingNonces) {
    if (now - v.created > NONCE_TTL_MS) pendingNonces.delete(k);
  }
}

/**
 * Creates CSRF state + PKCE verifier/challenge (S256).
 * @returns {{ state: string, codeChallenge: string }}
 */
function createOAuthState() {
  pruneStates();
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  const state = crypto.randomBytes(24).toString('hex');
  oauthStates.set(state, { created: Date.now(), codeVerifier });
  return { state, codeChallenge };
}

/**
 * One-time consumption of state; returns PKCE verifier for token exchange.
 * @returns {{ codeVerifier: string } | null}
 */
function consumeOAuthState(state) {
  if (!state || typeof state !== 'string') return null;
  const row = oauthStates.get(state);
  oauthStates.delete(state);
  if (!row || typeof row !== 'object' || !row.codeVerifier) return null;
  if (Date.now() - row.created > STATE_TTL_MS) return null;
  return { codeVerifier: row.codeVerifier };
}

function stashPendingLogin(payload) {
  prunePending();
  const nonce = crypto.randomBytes(24).toString('hex');
  pendingNonces.set(nonce, { payload, created: Date.now() });
  return nonce;
}

function takePendingLogin(nonce) {
  if (!nonce || typeof nonce !== 'string') return null;
  const row = pendingNonces.get(nonce);
  pendingNonces.delete(nonce);
  if (!row || Date.now() - row.created > NONCE_TTL_MS) return null;
  return row.payload;
}

function pruneOAuthReplay() {
  const now = Date.now();
  for (const [k, v] of oauthCompleteReplay) {
    if (now - v.created > COMPLETE_REPLAY_MS) oauthCompleteReplay.delete(k);
  }
}

/** Idempotent OAuth completion (duplicate POST with same nonce returns same JSON). */
function takePendingLoginOrReplay(nonce) {
  if (!nonce || typeof nonce !== 'string') return null;
  pruneOAuthReplay();
  const replay = oauthCompleteReplay.get(nonce);
  if (replay && Date.now() - replay.created <= COMPLETE_REPLAY_MS) {
    return replay.payload;
  }
  const payload = takePendingLogin(nonce);
  if (payload) {
    oauthCompleteReplay.set(nonce, { payload, created: Date.now() });
  }
  return payload;
}

function getGoogleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;
  const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:3010';
  if (!clientId || !clientSecret || !redirectUri) {
    return null;
  }
  return {
    clientId,
    clientSecret,
    redirectUri,
    frontendOrigin,
    allowedEmailDomain: process.env.GOOGLE_ALLOWED_EMAIL_DOMAIN || null,
  };
}

function isGoogleOAuthEnabled() {
  return getGoogleConfig() !== null;
}

function getSigninScopes() {
  return GOOGLE_SIGNIN_SCOPES;
}

/**
 * Exchange auth code; includes PKCE code_verifier per Google / RFC 7636.
 * Does not persist access or refresh tokens (sign-in only, access_type=online).
 */
async function exchangeCodeForTokens(code, cfg, codeVerifier) {
  const body = new URLSearchParams({
    code,
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    redirect_uri: cfg.redirectUri,
    grant_type: 'authorization_code',
    code_verifier: codeVerifier,
  });
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const tokenJson = await tokenRes.json().catch(() => ({}));
  if (!tokenRes.ok) {
    const msg = tokenJson.error_description || tokenJson.error || 'token_exchange_failed';
    throw new Error(msg);
  }
  return tokenJson;
}

async function fetchGoogleUserInfo(accessToken) {
  const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error?.message || 'userinfo_failed');
  }
  return data;
}

/**
 * Revoke Google's access token as soon as we're done (don't store Google tokens).
 * @see https://developers.google.com/identity/protocols/oauth2/resources/best-practices
 */
function revokeGoogleAccessToken(accessToken) {
  if (!accessToken) return Promise.resolve();
  return fetch('https://oauth2.googleapis.com/revoke', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ token: accessToken }),
  }).then(() => {});
}

module.exports = {
  createOAuthState,
  consumeOAuthState,
  stashPendingLogin,
  takePendingLogin,
  takePendingLoginOrReplay,
  getGoogleConfig,
  isGoogleOAuthEnabled,
  getSigninScopes,
  exchangeCodeForTokens,
  fetchGoogleUserInfo,
  revokeGoogleAccessToken,
};
