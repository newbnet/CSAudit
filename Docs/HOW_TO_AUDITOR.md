# How to Use COD-DATA (Auditor Guide)

Step-by-step guide for auditors using COD-DATA to manage assets, import scans, and deliver dashboards to end users.

---

## 1. Getting Started

1. **Sign in** at `/login` with your auditor credentials.
2. **Select or create a project** — Use the project dropdown in the header. Each project represents a customer, site, or engagement. Click **+ New** to create one.
3. **Never mix data** — Always select the correct project before adding assets or uploading scans.

---

## 2. Projects

- **Create projects** — Use the **+ New** button in the header. Name them by customer or site (e.g. "Acme Corp", "Site A").
- **Switch projects** — Use the dropdown to change context. Assets, uploads, and the asset list are scoped to the selected project.
- **Assign end users** — Go to **Users** and assign projects to end users so they only see their data.

---

## 3. How to Use It

### Run the Scan

Run Nmap on the target network. Wait for it to finish.

```bash
sudo nmap -sS -sV -O -T4 --open -oX network_audit.xml 192.168.1.0/24
```

| Flag | Purpose |
|------|---------|
| `-sS` | SYN scan (stealth) |
| `-sV` | Service/version detection |
| `-O` | OS detection |
| `-T4` | Faster timing |
| `--open` | Only report open ports |
| `-oX` | XML output for COD-DATA |

**Adjust the target** — Replace `192.168.1.0/24` with your scope (e.g. `10.0.0.0/24`, single host `192.168.1.1`).

### Fix Permissions

After the scan, the XML file may be owned by root. Fix it so you can upload:

```bash
sudo chown newbnet:newbnet network_audit.xml
```

Replace `newbnet` with your username if different.

---

## 4. Import into COD-DATA

1. Go to the **Upload Nmap/Nessus** tab.
2. **Select the target project** — Use the project dropdown in the upload form. Confirm "Uploading to: [Project Name]" before proceeding.
3. Choose **Nmap (XML)**, **OpenVAS (CSV)**, or **Nessus (CSV)**.
4. Click **Choose File** and select your scan output (e.g. `network_audit.xml`).
5. Click **Upload**.

Imported hosts become assets. COD-DATA infers asset types (Server, Switch, Laptop, etc.) from scan data when possible. You can edit any asset to correct the type.

---

## 5. Managing Assets

- **Add Asset** — Manually add assets with type, subtype, and IP. Use when a device wasn't in the scan.
- **Edit Asset** — In the Assets list, expand a row and click **Edit asset** to change name, type, or IP.
- **Asset types** — Switch, Router, Gateway, SOHO, WIFI, WLAN, AP, Server (Exchange, File, Domain Controller, Linux), Desktop, Laptop, TV, Printer, Virtual Machine.

---

## 6. User Management

1. Click **Users** in the header.
2. **Create user** — Email, password, name, role (Auditor or End user). For end users, assign one or more projects.
3. **Edit user** — Change password, name, role, or project assignments.
4. End users only see projects assigned to them.

---

## 7. OpenVAS Import (open source)

1. In Greenbone/OpenVAS, export the report as **CSV Results** or **CSV Hosts**.
2. Ensure columns include **Host** (or IP), **Severity**, and **Name**.
3. In COD-DATA, select **OpenVAS (CSV)**, choose the file, and upload to the correct project.

## 8. Nessus Import

1. In Nessus, export the scan as **CSV**.
2. Ensure columns include **Host**, **Risk**, and **Name**.
3. In COD-DATA, select **Nessus (CSV)**, choose the file, and upload to the correct project.

---

## Related Docs

- [USER_ROLES.md](USER_ROLES.md) — Roles and demo logins
- [AUDITOR_SOFTWARE_LIST.md](AUDITOR_SOFTWARE_LIST.md) — Audit tools and export formats
