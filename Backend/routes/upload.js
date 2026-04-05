const express = require('express');
const multer = require('multer');
const { parseStringPromise } = require('xml2js');
const { v4: uuidv4 } = require('uuid');
const { readDb, writeDb } = require('../lib/db');
const { auth, requireOwnerOrAuditor } = require('../middleware/auth');
const { assertAuditorProjectEdit } = require('../lib/access');
const { inferAssetType } = require('../lib/assetTypeMapper');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(auth);
router.use(requireOwnerOrAuditor);

/**
 * Parse Nmap XML - extracts hostname, ports with state, service name/product/version
 */
async function parseNmapXml(buffer) {
  const text = buffer.toString('utf8');
  if (!text.includes('<?xml') && !text.includes('<nmaprun')) {
    return [];
  }

  try {
    const result = await parseStringPromise(text, { explicitArray: false });
    const run = result.nmaprun;
    const hosts = [].concat(run.host || []).filter(Boolean);

    return hosts.map((host) => {
      const addresses = [].concat(host.address || []);
      const addr = addresses.find((a) => a.$?.addrtype === 'ipv4');
      const macAddr = addresses.find((a) => a.$?.addrtype === 'mac');
      const ip = addr?.$?.addr || 'unknown';
      const mac = macAddr?.$?.addr || null;
      const vendor = macAddr?.$?.vendor || null;

      const hostnames = host.hostnames?.hostname;
      const hostnameEl = hostnames ? ([].concat(hostnames)[0]?.$?.name) : null;
      const hostname = typeof hostnameEl === 'string' ? hostnameEl : hostnameEl;

      const os = host.os;
      let osMatch = null;
      let osVendor = null;
      if (os) {
        const osmatch = [].concat(os.osmatch || [])[0];
        if (osmatch?.$) {
          osMatch = { name: osmatch.$.name, accuracy: osmatch.$.accuracy };
        }
        const osclass = [].concat(os.osclass || [])[0];
        if (osclass?.$) {
          osVendor = osclass.$.vendor || null;
        }
      }

      const portsEl = host.ports?.port;
      const portList = portsEl ? [].concat(portsEl) : [];
      const openPorts = portList
        .filter((p) => (p.state?.$?.state || '').toLowerCase() === 'open')
        .map((p) => {
          const portid = p.$?.portid || '';
          const protocol = p.$?.protocol || 'tcp';
          const state = p.state?.$?.state || 'unknown';
          const svc = p.service?.$;
          const serviceName = svc?.name || '';
          const product = svc?.product || '';
          const version = svc?.version || '';
          const extrainfo = svc?.extrainfo || '';
          const service = [serviceName, product, version].filter(Boolean).join(' ') || portid;
          return {
            port: portid,
            protocol,
            state,
            service: service.trim() || `${protocol}/${portid}`,
            product,
            version,
            extrainfo,
          };
        });

      const portIds = openPorts.map((p) => p.port);
      const severity = openPorts.length > 5 ? 'high' : openPorts.length > 0 ? 'medium' : 'low';

      return {
        ip,
        hostname: hostname || null,
        mac,
        vendor,
        osMatch,
        osVendor,
        ports: portIds,
        openPorts,
        severity,
        source: 'nmap',
        hostState: host.status?.$?.state || 'unknown',
      };
    });
  } catch (err) {
    // Fallback to regex if xml2js fails
    const findings = [];
    const hostRegex = /<host[^>]*>[\s\S]*?<address addr="([^"]+)"[^>]*\/>[\s\S]*?<\/host>/g;
    let m;
    while ((m = hostRegex.exec(text)) !== null) {
      const ip = m[1];
      const portMatch = m[0].match(/<port[^>]*portid="(\d+)"[^>]*>/g);
      const ports = portMatch ? portMatch.map((p) => p.match(/portid="(\d+)"/)[1]) : [];
      findings.push({
        ip,
        hostname: null,
        mac: null,
        vendor: null,
        osMatch: null,
        osVendor: null,
        ports,
        openPorts: ports.map((port) => ({ port, protocol: 'tcp', state: 'open', service: port })),
        severity: ports.length > 0 ? 'medium' : 'low',
        source: 'nmap',
        hostState: 'unknown',
      });
    }
    return findings;
  }
}

/**
 * Parse vulnerability CSV (Nessus or OpenVAS).
 * Expects columns: Host (or IP), Risk/Severity, Name.
 */
function parseVulnCsv(buffer, source = 'nessus') {
  const text = buffer.toString('utf8');
  const lines = text.split('\n').filter(Boolean);
  if (lines.length < 2) return [];

  const headers = lines[0].toLowerCase().split(',').map((h) => h.trim().replace(/"/g, ''));
  const hostIdx = headers.findIndex((h) => h.includes('host') || h === 'host' || h === 'ip');
  const riskIdx = headers.findIndex((h) => h.includes('risk') || h.includes('severity') || h === 'risk' || h === 'severity');
  const nameIdx = headers.findIndex((h) => h.includes('name') || h === 'name');

  const findings = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
    const host = hostIdx >= 0 ? vals[hostIdx] : 'unknown';
    let risk = riskIdx >= 0 ? (vals[riskIdx] || 'low').toLowerCase() : 'low';
    if (risk === 'log' || risk === 'none') risk = 'info';
    const name = nameIdx >= 0 ? vals[nameIdx] : '';
    const severity = ['critical', 'high', 'medium', 'low', 'info'].includes(risk) ? risk : 'low';
    findings.push({ ip: host, name, severity, source });
  }
  return findings;
}

router.post('/nmap', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const projectId = req.body?.projectId || req.query?.projectId;
  if (!projectId) return res.status(400).json({ error: 'Project required' });

  try {
    const findings = await parseNmapXml(req.file.buffer);
    const db = readDb();

    const chk = assertAuditorProjectEdit(db, req.user, projectId);
    if (!chk.ok) return res.status(chk.status).json({ error: chk.error });

    const project = (db.projects || []).find((p) => p.id === projectId);
    if (!project) return res.status(400).json({ error: 'Invalid project' });

    for (const f of findings) {
      const findByIp = (a) => a.projectId === projectId && (a.ip === f.ip || (a.additionalIPs || []).includes(f.ip));
      const findByHostname = (a) => a.projectId === projectId && f.hostname && a.hostname && a.hostname.toLowerCase() === f.hostname.toLowerCase();

      let asset = db.assets.find(findByIp);
      if (!asset && f.hostname) {
        asset = db.assets.find(findByHostname);
      }

      if (!asset) {
        const { type: inferredType, subType: inferredSubType } = inferAssetType(f);
        asset = {
          id: uuidv4(),
          name: f.hostname || f.ip,
          type: inferredType,
          subType: inferredSubType,
          ip: f.ip,
          projectId,
          additionalIPs: [],
          hostname: f.hostname || null,
          mac: f.mac || null,
          vendor: f.vendor || null,
          osMatch: f.osMatch || null,
          osVendor: f.osVendor || null,
          vulnerabilities: [],
          auditStatus: 'Pending',
          checklistResults: [],
          createdAt: new Date().toISOString(),
        };
        db.assets.push(asset);
      } else {
        if (f.hostname && !asset.hostname) {
          asset.name = asset.name === asset.ip ? f.hostname : asset.name;
          asset.hostname = f.hostname;
        }
        if (asset.type === 'Unknown') {
          const { type: inferredType, subType: inferredSubType } = inferAssetType(f);
          asset.type = inferredType;
          asset.subType = inferredSubType;
        }
        if (f.mac && !asset.mac) asset.mac = f.mac;
        if (f.vendor && !asset.vendor) asset.vendor = f.vendor;
        if (f.osMatch && !asset.osMatch) asset.osMatch = f.osMatch;
        if (f.osVendor && !asset.osVendor) asset.osVendor = f.osVendor;
        if (f.ip !== asset.ip && !(asset.additionalIPs || []).includes(f.ip)) {
          asset.additionalIPs = asset.additionalIPs || [];
          asset.additionalIPs.push(f.ip);
        }
      }

      asset.vulnerabilities = asset.vulnerabilities || [];
      asset.vulnerabilities.push({
        id: uuidv4(),
        ip: f.ip,
        hostname: f.hostname,
        mac: f.mac,
        vendor: f.vendor,
        osMatch: f.osMatch,
        osVendor: f.osVendor,
        ports: f.ports,
        openPorts: f.openPorts,
        severity: f.severity,
        source: f.source,
        hostState: f.hostState,
        importedAt: new Date().toISOString(),
      });
    }

    const projectAssets = db.assets.filter((a) => a.projectId === projectId);
    const allVulns = projectAssets.flatMap((a) => a.vulnerabilities || []);
    const counts = {
      critical: allVulns.filter((v) => (v.severity || '').toLowerCase() === 'critical').length,
      high: allVulns.filter((v) => (v.severity || '').toLowerCase() === 'high').length,
      medium: allVulns.filter((v) => (v.severity || '').toLowerCase() === 'medium').length,
      low: allVulns.filter((v) => (v.severity || '').toLowerCase() === 'low').length,
      info: allVulns.filter((v) => (v.severity || '').toLowerCase() === 'info').length,
    };

    db.scanHistory = db.scanHistory || [];
    db.scanHistory.push({
      id: uuidv4(),
      projectId,
      importedAt: new Date().toISOString(),
      source: 'nmap',
      hostCount: findings.length,
      counts,
    });

    writeDb(db);
    res.json({ imported: findings.length, message: `Imported ${findings.length} hosts from Nmap` });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to parse Nmap XML' });
  }
});

router.post('/nessus', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const projectId = req.body?.projectId || req.query?.projectId;
  if (!projectId) return res.status(400).json({ error: 'Project required' });

  const db = readDb();
  const chk = assertAuditorProjectEdit(db, req.user, projectId);
  if (!chk.ok) return res.status(chk.status).json({ error: chk.error });

  const project = (db.projects || []).find((p) => p.id === projectId);
  if (!project) return res.status(400).json({ error: 'Invalid project' });

  const findings = parseVulnCsv(req.file.buffer, 'nessus');

  for (const f of findings) {
    let asset = db.assets.find((a) => a.projectId === projectId && a.ip === f.ip);
    if (!asset) {
      const { type: inferredType, subType: inferredSubType } = inferAssetType(f);
      asset = {
        id: uuidv4(),
        name: f.ip,
        type: inferredType,
        subType: inferredSubType,
        ip: f.ip,
        projectId,
        vulnerabilities: [],
        auditStatus: 'Pending',
        checklistResults: [],
        createdAt: new Date().toISOString(),
      };
      db.assets.push(asset);
    } else if (asset.type === 'Unknown') {
      const { type: inferredType, subType: inferredSubType } = inferAssetType(f);
      asset.type = inferredType;
      asset.subType = inferredSubType;
    }
    asset.vulnerabilities = asset.vulnerabilities || [];
    asset.vulnerabilities.push({
      id: uuidv4(),
      ...f,
      importedAt: new Date().toISOString(),
    });
  }

  const projectAssets = db.assets.filter((a) => a.projectId === projectId);
  const allVulns = projectAssets.flatMap((a) => a.vulnerabilities || []);
  const counts = {
    critical: allVulns.filter((v) => (v.severity || '').toLowerCase() === 'critical').length,
    high: allVulns.filter((v) => (v.severity || '').toLowerCase() === 'high').length,
    medium: allVulns.filter((v) => (v.severity || '').toLowerCase() === 'medium').length,
    low: allVulns.filter((v) => (v.severity || '').toLowerCase() === 'low').length,
    info: allVulns.filter((v) => (v.severity || '').toLowerCase() === 'info').length,
  };

  db.scanHistory = db.scanHistory || [];
  db.scanHistory.push({
    id: uuidv4(),
    projectId,
    importedAt: new Date().toISOString(),
    source: 'nessus',
    hostCount: findings.length,
    counts,
  });

  writeDb(db);
  res.json({ imported: findings.length, message: `Imported ${findings.length} findings from Nessus` });
});

router.post('/openvas', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const projectId = req.body?.projectId || req.query?.projectId;
  if (!projectId) return res.status(400).json({ error: 'Project required' });

  const db = readDb();
  const chk = assertAuditorProjectEdit(db, req.user, projectId);
  if (!chk.ok) return res.status(chk.status).json({ error: chk.error });

  const project = (db.projects || []).find((p) => p.id === projectId);
  if (!project) return res.status(400).json({ error: 'Invalid project' });

  const findings = parseVulnCsv(req.file.buffer, 'openvas');

  for (const f of findings) {
    let asset = db.assets.find((a) => a.projectId === projectId && a.ip === f.ip);
    if (!asset) {
      const { type: inferredType, subType: inferredSubType } = inferAssetType(f);
      asset = {
        id: uuidv4(),
        name: f.ip,
        type: inferredType,
        subType: inferredSubType,
        ip: f.ip,
        projectId,
        vulnerabilities: [],
        auditStatus: 'Pending',
        checklistResults: [],
        createdAt: new Date().toISOString(),
      };
      db.assets.push(asset);
    } else if (asset.type === 'Unknown') {
      const { type: inferredType, subType: inferredSubType } = inferAssetType(f);
      asset.type = inferredType;
      asset.subType = inferredSubType;
    }
    asset.vulnerabilities = asset.vulnerabilities || [];
    asset.vulnerabilities.push({
      id: uuidv4(),
      ...f,
      importedAt: new Date().toISOString(),
    });
  }

  const projectAssets = db.assets.filter((a) => a.projectId === projectId);
  const allVulns = projectAssets.flatMap((a) => a.vulnerabilities || []);
  const counts = {
    critical: allVulns.filter((v) => (v.severity || '').toLowerCase() === 'critical').length,
    high: allVulns.filter((v) => (v.severity || '').toLowerCase() === 'high').length,
    medium: allVulns.filter((v) => (v.severity || '').toLowerCase() === 'medium').length,
    low: allVulns.filter((v) => (v.severity || '').toLowerCase() === 'low').length,
    info: allVulns.filter((v) => (v.severity || '').toLowerCase() === 'info').length,
  };

  db.scanHistory = db.scanHistory || [];
  db.scanHistory.push({
    id: uuidv4(),
    projectId,
    importedAt: new Date().toISOString(),
    source: 'openvas',
    hostCount: findings.length,
    counts,
  });

  writeDb(db);
  res.json({ imported: findings.length, message: `Imported ${findings.length} findings from OpenVAS` });
});

module.exports = router;
