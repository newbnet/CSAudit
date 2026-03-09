# COD-DATA

**Cybersecurity Oversight & Defense** – Web-based vulnerability management and audit platform for consultants, internal security teams, and MSPs.

## Overview

- **Auditors** manage projects, add assets, upload Nmap/OpenVAS/Nessus scans, assign users, and run type-based audits
- **End users** view vulnerability dashboards and improvement-over-time charts for their assigned projects

## Features

| Feature | Description |
|---------|-------------|
| **Multi-project** | Separate data by customer, site, or engagement |
| **Scan import** | Nmap (XML), OpenVAS (CSV), Nessus (CSV) |
| **Smart asset types** | Auto-detect Switch, Server, Laptop, TV, Printer, etc. from scan data |
| **Audit checklists** | Type-specific checklists (Switch L2/L3, Server, WIFI, etc.) |
| **Improvement tracking** | End users see vulnerability trends over time |
| **User management** | Create users, assign projects, update passwords |
| **Landing page** | Professional home page with resources and sign-in |

## Tech Stack

| Layer   | Stack                    |
|---------|--------------------------|
| Frontend| React 18, Vite, Tailwind  |
| Backend | Node.js, Express         |
| Storage | JSON (`Backend/db.json`) |
| Process | PM2                      |

## Quick Start

```bash
# Install dependencies
npm install
cd Backend && npm install && cd ..
cd Frontend && npm install && cd ..

# Run migration (creates projects, assigns projectIds)
cd Backend && node scripts/migrate-projects.js && cd ..

# Seed demo users (password: demo123)
cd Backend && npm run seed && cd ..

# Start both services
npm run start
```

- **App:** http://localhost:5173  
- **API:** http://localhost:3001  

**Demo logins:** `auditor@cod-data.com` / `enduser@cod-data.com` — password: `demo123`

## Project Structure

```
├── Frontend/          React app (Vite + Tailwind)
├── Backend/           Express API, db.json, auth, assets, upload, users
├── Docs/              Documentation
├── ecosystem.config.js
└── package.json       PM2 scripts
```

## Scripts

| Command        | Description              |
|----------------|--------------------------|
| `npm run start`| Start backend + frontend |
| `npm run stop` | Stop all                 |
| `npm run status`| PM2 status              |
| `npm run logs` | View logs                |

## Documentation

- [Docs/README.md](Docs/README.md) – Project structure, PM2 usage
- [Docs/HOW_TO_AUDITOR.md](Docs/HOW_TO_AUDITOR.md) – Step-by-step auditor guide (Nmap scan, import, OpenVAS)
- [Docs/USER_ROLES.md](Docs/USER_ROLES.md) – Auditor vs end-user
- [Docs/AUDITOR_SOFTWARE_LIST.md](Docs/AUDITOR_SOFTWARE_LIST.md) – Audit tools (Nmap, OpenVAS, Nessus)

## Version

**0.2.0** – OpenVAS support, user management, projects, landing page, smart asset mapping
