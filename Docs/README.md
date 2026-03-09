# COD-DATA Documentation

Cybersecurity Oversight & Defense – CSAudit project.

---

## Project Structure

| Folder    | Purpose                              |
|-----------|--------------------------------------|
| `Frontend`| React + Vite + Tailwind (audit UI)   |
| `Backend` | Node.js + Express API, db.json      |
| `Docs`    | Project documentation                |

## Running with PM2

From the project root (PM2 is a project dependency, use `npm run` or `npx pm2`):

```bash
# Start all services
npm run start
# or: npx pm2 start ecosystem.config.js

# View logs
npm run logs

# View specific app logs
npx pm2 logs cod-data-backend
npx pm2 logs cod-data-frontend

# Status
npm run status

# Stop all
npm run stop
```

## Related Docs

- [HOW_TO_AUDITOR.md](HOW_TO_AUDITOR.md) – Step-by-step auditor guide (scan, import, manage)
- [USER_ROLES.md](USER_ROLES.md) – Auditor and end-user roles
- [AUDITOR_SOFTWARE_LIST.md](AUDITOR_SOFTWARE_LIST.md) – Professional audit tools
