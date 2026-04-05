/**
 * Centralized config. Fails fast in production if JWT_SECRET is missing.
 * Abwoon d'bwashmaya
 */
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (IS_PRODUCTION && (!secret || secret.length < 32)) {
    throw new Error(
      'JWT_SECRET must be set in production (min 32 chars). Set it in environment or deploy.env'
    );
  }
  return secret || 'cod-data-dev-secret-change-in-production';
}

/** When true: password login and open (non-invite) registration are disabled; use Google OAuth. */
function isGoogleAuthOnly() {
  let v = process.env.GOOGLE_AUTH_ONLY;
  if (v == null || String(v).trim() === '') return false;
  v = String(v).trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1).trim();
  }
  const lower = v.toLowerCase();
  return lower === '1' || lower === 'true' || lower === 'yes' || lower === 'on';
}

module.exports = { getJwtSecret, isGoogleAuthOnly };
