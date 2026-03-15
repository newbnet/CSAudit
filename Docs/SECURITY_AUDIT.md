# Security Audit & Senior Programmer Analysis

**Date:** 2026-03-15

## Fixes Applied

### 1. JWT_SECRET (Critical)
- **Before:** Hardcoded fallback used in production
- **After:** `JWT_SECRET` required in production (min 32 chars); server fails to start if missing
- **Config:** `deploy.env` with `JWT_SECRET`; auto-created on first deploy if absent

### 2. Security Headers (Helmet)
- Added `helmet` middleware for X-Content-Type-Options, X-Frame-Options, etc.
- CSP disabled to avoid breaking React (can be tuned later)

### 3. Environment Loading
- Added `dotenv` to load `deploy.env` at startup
- `deploy.env` excluded from rsync so server-side secrets are preserved

## Dependency Audit

| Package | Issue | Status |
|---------|-------|--------|
| Backend: bcrypt → tar | High (path traversal in npm install) | No non-breaking fix; risk is build-time only |
| Frontend: vite → esbuild | Moderate (dev server) | Dev-only; production build unaffected |
| Root: pm2 | Low (ReDoS) | No fix available |

## Senior Programmer Notes

### Strengths
- Auth: bcrypt for passwords, JWT with expiry
- Role-based access (auditor vs end-user)
- Project-scoped data for end-users
- CORS whitelist
- File upload: 10MB limit, memory storage (no disk writes from uploads)

### Recommendations (Future)
- **Rate limiting** on `/api/auth/login` to prevent brute force
- **Password policy:** min length 8, complexity (users route)
- **Input sanitization:** escape/sanitize user-provided text (name, notes) for XSS
- **Audit logging:** log auth failures, privileged actions
- **bcrypt@6:** Consider upgrading when ready (breaking change; pure JS, no native deps)
