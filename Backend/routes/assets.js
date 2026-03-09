const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { readDb, writeDb } = require('../lib/db');
const { auth, requireRole } = require('../middleware/auth');
const { getChecklistKey } = require('../config/checklists');

const router = express.Router();

router.use(auth);

router.get('/', (req, res) => {
  const db = readDb();
  let assets = db.assets || [];

  const projectId = req.query.projectId;
  if (projectId) {
    assets = assets.filter((a) => a.projectId === projectId);
  }

  if (req.user.role === 'end-user' && req.user.projectIds?.length) {
    assets = assets.filter((a) => req.user.projectIds.includes(a.projectId));
  } else if (req.user.role === 'end-user') {
    assets = [];
  }

  res.json(assets);
});

router.get('/scan-history', (req, res) => {
  const db = readDb();
  let history = db.scanHistory || [];
  const projectId = req.query.projectId;

  if (projectId) {
    history = history.filter((h) => h.projectId === projectId);
  }

  if (req.user.role === 'end-user' && req.user.projectIds?.length) {
    history = history.filter((h) => req.user.projectIds.includes(h.projectId));
  } else if (req.user.role === 'end-user') {
    history = [];
  }

  history.sort((a, b) => new Date(b.importedAt) - new Date(a.importedAt));
  res.json(history);
});

router.patch('/:id', requireRole('auditor'), (req, res) => {
  const { id } = req.params;
  const { name, type, subType, ip } = req.body;

  const db = readDb();
  const asset = db.assets.find((a) => a.id === id);
  if (!asset) return res.status(404).json({ error: 'Asset not found' });

  if (req.user.role === 'auditor') {
    // Auditors can edit any asset
  } else if (req.user.role === 'end-user') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (name !== undefined) asset.name = name;
  if (type !== undefined) asset.type = type;
  if (subType !== undefined) asset.subType = subType;
  if (ip !== undefined) asset.ip = ip;

  if (type !== undefined || subType !== undefined) {
    const checklistKey = getChecklistKey(asset.type, asset.subType || null);
    const checklistItems = checklistKey ? (db.auditChecklists[checklistKey] || []) : [];
    asset.checklistResults = checklistItems.map((item) => {
      const existing = (asset.checklistResults || []).find((r) => r.item === item);
      return existing || { item, status: 'pending', notes: '' };
    });
  }

  writeDb(db);
  res.json(asset);
});

router.post('/', requireRole('auditor'), (req, res) => {
  const { name, type, subType, ip, projectId } = req.body;
  if (!name || !type) {
    return res.status(400).json({ error: 'Name and type required' });
  }
  if (!projectId) {
    return res.status(400).json({ error: 'Project required' });
  }

  const db = readDb();
  const project = (db.projects || []).find((p) => p.id === projectId);
  if (!project) {
    return res.status(400).json({ error: 'Invalid project' });
  }

  const checklistKey = getChecklistKey(type, subType);
  const checklistItems = checklistKey ? (db.auditChecklists[checklistKey] || []) : [];

  const asset = {
    id: uuidv4(),
    name,
    type,
    subType: subType || null,
    ip: ip || null,
    projectId,
    vulnerabilities: [],
    auditStatus: 'Pending',
    checklistResults: checklistItems.map(item => ({ item, status: 'pending', notes: '' })),
    createdAt: new Date().toISOString(),
  };

  db.assets.push(asset);
  writeDb(db);
  res.status(201).json(asset);
});

router.get('/checklists', (req, res) => {
  const db = readDb();
  res.json(db.auditChecklists);
});

router.get('/checklist-key/:type/:subType?', (req, res) => {
  const key = getChecklistKey(req.params.type, req.params.subType || null);
  if (!key) return res.json({ key: null, items: [] });
  const db = readDb();
  const items = db.auditChecklists[key] || [];
  res.json({ key, items });
});

module.exports = router;
