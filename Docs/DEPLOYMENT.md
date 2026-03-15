# COD-DATA Deployment: cod-data.com on 10.10.10.61

Guide to set up the reverse proxy and DNS for cod-data.com.

---

## 1. DNS (Square Domain)

If your domain is registered with **Square**:

1. Log in to [Square Dashboard](https://squareup.com/dashboard) → **Online** → **Domains** (or your domain management).
2. Select **cod-data.com** → **DNS Settings** or **Manage DNS**.
3. Add or edit **A records**:

   | Type | Name | Value       | TTL  |
   |------|------|-------------|------|
   | A    | @    | 10.10.10.61 | 3600 |
   | A    | www  | 10.10.10.61 | 3600 |

3. **Square Domains** (if applicable): Go to **Domains** → select cod-data.com → **DNS Settings** → Add A record pointing to `10.10.10.61`.
4. Wait for propagation (typically 5–60 minutes).

---

## 2. Nginx Proxy Manager (on 10.10.10.61)

1. Open Nginx Proxy Manager (e.g. `http://10.10.10.61:81` or your NPM URL).
2. Go to **Hosts** → **Proxy Hosts** → **Add Proxy Host** (or edit existing).
3. **Details** tab:
   - **Domain Names:** `cod-data.com`, `www.cod-data.com`
   - **Scheme:** `http`
   - **Forward Hostname / IP:** App server IP (e.g. `10.10.10.64`)
   - **Forward Port:** `5010` (production: backend serves frontend + API on single port)
   - Enable **Block Common Exploits** and **Websockets Support** (recommended).
4. **SSL** tab:
   - Enable **SSL Certificate**
   - **Force SSL**
   - **Certificate:** Request a new Let's Encrypt certificate
   - **Email:** your email for certificate notifications
5. Save. NPM will obtain the certificate and configure HTTPS.

**Important for www:** Both `cod-data.com` and `www.cod-data.com` must be in **Domain Names** before requesting the certificate. Let's Encrypt will then issue a cert that covers both. If www shows `ERR_SSL_UNRECOGNIZED_NAME_ALERT`, the cert doesn't include www — edit the proxy host, ensure both domains are listed, then delete the old certificate and request a new one.

---

## 3. COD-DATA App (production)

**Before first deploy:** On the server (`10.10.10.64`), create `deploy.env` in the project root with:

```
JWT_SECRET=your-random-secret-at-least-32-characters-long
```

Generate a secret with: `openssl rand -base64 32`

Deploy from your dev machine:

```bash
npm run deploy
```

This builds the frontend, pushes to the server, and starts production mode. The backend serves the built app + API on port **5010**.

**NPM must proxy to port 5010** (not 3010). Edit the cod-data.com proxy host and set Forward Port to `5010`.

---

## 4. Firewall

Allow HTTP/HTTPS on 10.10.10.61:

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## Summary

| Component   | Value                    |
|------------|--------------------------|
| Domain     | cod-data.com             |
| Proxy host | 10.10.10.61              |
| Nginx Proxy Manager | Proxies cod-data.com → 10.10.10.64:5010 |
| App server | Backend serves frontend + API on port 5010 |
