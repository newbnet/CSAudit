# Auditor Software Requirements

Professional cybersecurity audit tools used by consultants and internal security teams. COD-DATA supports import from **Nmap** (XML) and **Nessus** (CSV); other tools may require manual entry or custom integration.

---

## Essential (Core Audit Stack)

| Tool | Purpose | Output Format | License |
|------|---------|---------------|---------|
| **Nmap** | Network discovery, port scanning, service/OS detection | XML (`-oX`) | Free, open-source |
| **OpenVAS** | Vulnerability scanning, compliance (open-source Nessus alternative) | CSV | Free, open-source |
| **Nessus** | Vulnerability scanning, compliance (CIS, DISA STIGs) | CSV, XML | Free (limited) / Professional |
| **Wireshark** | Packet capture, traffic analysis, protocol inspection | PCAP | Free, open-source |

---

## Vulnerability & Asset Scanning

| Tool | Purpose | Notes |
|------|---------|-------|
| **Tenable Nessus / Tenable.io** | Vulnerability management, compliance auditing | Industry standard; 100K+ plugins |
| **Qualys VMDR** | Cloud-based vuln management, threat detection | SaaS; good for distributed environments |
| **Rapid7 InsightVM** | On-prem vulnerability management | Strong reporting |
| **OpenVAS** | Open-source vulnerability scanner | Free Nessus alternative |
| **Nikto** | Web server vulnerability scanner | CLI; quick web checks |

---

## Network Reconnaissance & Discovery

| Tool | Purpose | Notes |
|------|---------|-------|
| **Nmap** | Host discovery, port scan, service/version detection | `-sV`, `-O`, `-A` for audit scans |
| **Masscan** | Fast large-scale port scanning | Use when scope is large |
| **Netdisco** | Network topology and asset inventory | SNMP-based |
| **Angry IP Scanner** | Quick host/port discovery | GUI; good for ad-hoc checks |

---

## Web Application Testing

| Tool | Purpose | Notes |
|------|---------|-------|
| **Burp Suite Professional** | Web app pentesting, intercepting proxy | Industry standard |
| **OWASP ZAP** | Web app security scanning | Free, open-source |
| **Nikto** | Web server misconfigurations | CLI |
| **SQLMap** | SQL injection testing | Specialized |

---

## Traffic & Protocol Analysis

| Tool | Purpose | Notes |
|------|---------|-------|
| **Wireshark** | Packet capture, protocol analysis | Filter by VLAN, IP, port |
| **tcpdump** | CLI packet capture | Scriptable; server environments |
| **tshark** | Wireshark CLI | Parse PCAP without GUI |

---

## Compliance & Configuration Auditing

| Tool | Purpose | Notes |
|------|---------|-------|
| **CIS-CAT** | CIS Benchmark assessments | Benchmarks for OS, apps, cloud |
| **Lynis** | Unix/Linux security auditing | Open-source; host hardening |
| **OpenSCAP** | SCAP-based compliance (NIST, DISA) | Automation-friendly |
| **Microsoft Security Compliance Toolkit** | Windows/GPO baselines | Free from Microsoft |

---

## Password & Credential Auditing

| Tool | Purpose | Notes |
|------|---------|-------|
| **Hashcat** | Password cracking (audit weak policies) | GPU-accelerated |
| **John the Ripper** | Password auditing | Open-source |
| **CrackMapExec** | Network auth testing (SMB, WinRM, etc.) | Post-exploit / audit |

---

## Recommended Minimum Setup for COD-DATA Auditors

1. **Nmap** – Network discovery and port mapping (export `-oX` for COD-DATA import)
2. **OpenVAS** – Open-source vulnerability scanning (export CSV for COD-DATA import)
3. **Nessus** – Vulnerability scanning (export CSV for COD-DATA import)
4. **Wireshark** – Traffic analysis and evidence capture
5. **OWASP ZAP** or **Burp Suite** – Web app testing (if applicable)
6. **Lynis** – Linux host hardening checks (if applicable)

---

## Export Formats for COD-DATA Import

| Tool | Command / Action |
|------|------------------|
| **Nmap** | `nmap -sV -O -oX scan.xml <target>` |
| **OpenVAS** | Export report as CSV Results or CSV Hosts (Host/IP, Severity, Name columns) |
| **Nessus** | Export scan results as CSV (Host, Risk, Name columns) |

---

## References

- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [CIS Benchmarks](https://www.cisecurity.org/cis-benchmarks)
- [SANS Top 25 Critical Security Controls](https://www.sans.org/critical-security-controls/)
