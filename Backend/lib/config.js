/**
 * Centralized config. Fails fast in production if JWT_SECRET is missing.
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

module.exports = { getJwtSecret };
