# Google sign-in (OAuth 2.0)

COD-DATA can accept **Google** as an identity provider. After Google verifies the user, the backend issues the same **JWT** as email/password login.

Implementation follows [Google’s OAuth 2.0 best practices](https://developers.google.com/identity/protocols/oauth2/resources/best-practices) where applicable (credentials handling, tokens, scopes, PKCE, browser-based flow).

## Behavior

- **First-time Google sign-in:** if the email is not in `db.json`, a **`pending`** user is created (no password). They see the pending screen until an auditor assigns a role.
- **Existing users:** same as before—Google signs in to the matching account.
- **Verified Google email** is required (`verified_email` from Google).
- **Password login** is optional: set **`GOOGLE_AUTH_ONLY=true`** in `deploy.env` (or `Backend/.env`) to hide email/password on the site and use **Google only** (see below).
- Optional: restrict to one company domain with `GOOGLE_ALLOWED_EMAIL_DOMAIN` in `deploy.env`.

## Google-only mode (no email/password on the login page)

1. Configure **Google OAuth** (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_OAUTH_REDIRECT_URI`, `FRONTEND_ORIGIN`) and confirm **Continue with Google** works.
2. Add **`GOOGLE_AUTH_ONLY=true`** to **`deploy.env`** on the server (or `Backend/.env` locally).
3. Restart the backend so the variable is loaded, e.g.  
   `pm2 restart ecosystem.production.config.js --update-env`
4. Check **`GET /api/auth/google/enabled`**: you should see `"passwordLogin": false` and `"selfServicePasswordRegister": false`.

Open registration without an invite is blocked by the API; **invitation links** still work, with **optional** password when completing an invite.

## Alignment with Google best practices

| Practice | What we do |
|----------|------------|
| **Client credentials** | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` only in environment / `deploy.env` — never in source control. Prefer a secret manager in production ([Google guidance](https://developers.google.com/identity/protocols/oauth2/resources/best-practices)). |
| **User tokens** | Google **access tokens are not stored**. We use them once to call userinfo, then **revoke** them. We do **not** request offline access (`access_type=online`), so Google does not issue refresh tokens for this flow. COD-DATA’s own **JWT** is what the app keeps (same as password login). |
| **Incremental authorization** | Sign-in requests only **`openid email`** — the smallest scope set needed to identify the user. Extra Google APIs/scopes would be requested only if a future feature needs them. |
| **PKCE** | Authorization requests use **S256 code challenge**; the **code verifier** stays server-side with `state` (never exposed to the browser). |
| **CSRF** | Random **`state`** is validated on callback. |
| **Secure browser** | OAuth starts with a **full browser redirect** to Google (no embedded WebView). |
| **OAuth clients** | Create and manage clients only in [Google Cloud Console](https://console.cloud.google.com/); remove unused clients periodically. |

## OAuth consent screen (URLs & branding)

After you deploy the frontend, use your public origin (e.g. `https://cod-data.com`) for:

| Field | Path |
|-------|------|
| **Application home page** | `https://cod-data.com/` |
| **Privacy policy** | `https://cod-data.com/privacy` |
| **Terms of service** | `https://cod-data.com/terms` |

Customize the copy in `Frontend/src/pages/PrivacyPolicy.jsx` and `TermsOfService.jsx` before publishing.

**App logo (≤ 1 MB, square):** upload `Frontend/public/cod-data-logo-oauth-120.png` (120×120 PNG, under Google’s size limit). The main site asset `cod-data-logo.png` is a larger web logo; the `-oauth-120` file is sized for the consent screen.

## Google Cloud Console

1. [Google Cloud Console](https://console.cloud.google.com/) → select or create a project.
2. **APIs & Services** → **OAuth consent screen** → configure (External or Internal as appropriate).
3. **Credentials** → **Create credentials** → **OAuth client ID** → type **Web application**.
4. **Authorized redirect URIs** (must match `GOOGLE_OAUTH_REDIRECT_URI` exactly):
   - Production: `https://cod-data.com/api/auth/google/callback` (or your public API URL + `/api/auth/google/callback`).
   - Local backend: `http://localhost:5010/api/auth/google/callback`
5. Copy **Client ID** and **Client secret**.

## Server configuration (`deploy.env`)

Set on the app server (and mirror locally for dev if needed):

| Variable | Example |
|----------|---------|
| `GOOGLE_CLIENT_ID` | From Google Console |
| `GOOGLE_CLIENT_SECRET` | From Google Console |
| `GOOGLE_OAUTH_REDIRECT_URI` | Same URI you registered (e.g. `https://cod-data.com/api/auth/google/callback`) |
| `FRONTEND_ORIGIN` | Where the React app is served (e.g. `https://cod-data.com` or `http://localhost:3010`) |
| `GOOGLE_ALLOWED_EMAIL_DOMAIN` | Optional, e.g. `yourcompany.com` (no `@`) |
| `GOOGLE_OAUTH_PROMPT` | Optional. If unset, Google may skip extra screens when you’re already logged into one account in the browser. Set to `select_account` to always show Google’s account chooser. |

Restart the backend after changes (`pm2 restart cybersecurity-backend`).

### Reverse proxy (Nginx Proxy Manager, bare nginx, etc.)

- **Upstream must be port 5010** — one Node process serves `/api` and the built SPA. Your NPM entry (**cod-data.com → `http://10.10.10.64:5010`**) matches that.
- **Do not** use `sudo nginx -t` on a host that only runs NPM in Docker — there is often **no** `nginx` binary on the OS; apply changes in the **Nginx Proxy Manager** UI (or `docker restart` the NPM stack).
- After Google returns to **`/api/auth/google/callback`**, the backend issues **same-origin relative** redirects (`/auth/callback`, `/login`) so the browser stays on **`https://cod-data.com`** even when **`Host`** is the backend IP (e.g. `10.10.10.64:5010`). Invite links still use **`FRONTEND_ORIGIN`** / **`GOOGLE_OAUTH_REDIRECT_URI`** via `resolveFrontendOrigin`.
- NPM should still forward **`Host`**, **`X-Forwarded-Host`**, and **`X-Forwarded-Proto`** for logging and invite URLs. If invite links look wrong, open the proxy host → **Advanced** → **Custom Nginx Configuration** and add:

```nginx
proxy_set_header Host $host;
proxy_set_header X-Forwarded-Host $host;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header X-Real-IP $remote_addr;
```

- For a **traditional** nginx on the app server, see `nginx/cod-data.com.conf` in the repo.

### Why Google’s page appears every time

Sign-in happens on **Google’s site** by design (OAuth). You are not entering a password on COD-DATA anymore; Google is proving who you are.

- The **first time** (or after you revoke access), Google shows consent so you know what the app can see (e.g. email).
- If it felt like **every** visit showed the full chooser, the app used to send `prompt=select_account`; that is now **optional** via `GOOGLE_OAUTH_PROMPT` so return visits can be quicker when you only use one Google account in that browser.

## Local development

1. Use redirect URI `http://localhost:5010/api/auth/google/callback` in Google Console.
2. Put secrets in **`Backend/.env`** (copy from `Backend/.env.example`) or repo-root **`deploy.env`**. The server loads **`Backend/.env`**, then **`deploy.env` with `override: true`**, so production values in **`deploy.env`** win (e.g. **`FRONTEND_ORIGIN`** over a stray localhost line in **`Backend/.env`**).
3. Use **`KEY=value` lines** in `.env`, not the raw Google JSON download. Extract `client_id` and `client_secret` from the JSON’s `web` object.
4. Start backend on **5010** and frontend with Vite proxying `/api` to the backend (see `Frontend/vite.config.js`).

## Operational notes

- **Multi-instance backends:** In-memory OAuth `state` / PKCE verifiers require a **shared store** (e.g. Redis) if you run more than one Node process handling the same user sessions.
- **Error monitoring:** Callback errors are logged with **no token values** (message only). You can extend with your APM or log pipeline.
- **Cross-Account Protection (RISC):** If you later store long-lived Google refresh tokens, consider Google’s [Cross-Account Protection](https://developers.google.com/identity/protocols/oauth2/resources/best-practices) for revocation signals. Not required for the current online-only sign-in flow.
