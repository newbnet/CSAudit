# User Roles

## Auditor

- **Purpose:** Add assets, upload scan results, perform audits
- **Login:** auditor@cod-data.com
- **Software list:** See [AUDITOR_SOFTWARE_LIST.md](AUDITOR_SOFTWARE_LIST.md) for professional audit tools
- **Capabilities:**
  - Add assets with conditional form (Type → SubType, e.g. Switch → Layer 2/3)
  - Upload Nmap XML and Nessus CSV results
  - View asset list

## End User

- **Purpose:** View audit results and vulnerability findings
- **Login:** enduser@cod-data.com
- **Capabilities:**
  - Vulnerability dashboard (high/medium/low per device)
  - View findings by device

## Demo Password

Both accounts use: **demo123**

Run `npm run seed` in Backend to reset password hashes.
