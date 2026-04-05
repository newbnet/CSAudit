const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { readDb, writeDb } = require('../lib/db');
const { auth, requireOwnerOrAuditor, blockPending } = require('../middleware/auth');
const {
  isPlatformOwner,
  auditorAccessLevel,
  visibleProjectIdsForAuditor,
  auditorCanEditProject,
  projectById,
} = require('../lib/access');

const router = express.Router();

router.use(auth);
router.use(blockPending);

router.get('/', (req, res) => {
  const db = readDb();
  let projects = db.projects || [];

  if (isPlatformOwner(req.user.role)) {
    const mineOnly = req.query.mine === '1' || req.query.mine === 'true';
    if (mineOnly) {
      projects = projects.filter((p) => p.ownerUserId === req.user.id);
      return res.json(
        projects.map((p) => ({
          ...p,
          myAccess: auditorAccessLevel(db, req.user.id, p.id),
        }))
      );
    }
    return res.json(
      projects.map((p) => ({
        id: p.id,
        name: p.name,
        createdAt: p.createdAt,
        ownerUserId: p.ownerUserId || null,
      }))
    );
  }

  if (req.user.role === 'end-user' && req.user.projectIds?.length) {
    projects = projects.filter((p) => req.user.projectIds.includes(p.id));
    return res.json(projects);
  }

  if (req.user.role === 'auditor') {
    const visible = new Set(visibleProjectIdsForAuditor(db, req.user.id));
    projects = projects.filter((p) => visible.has(p.id));
    return res.json(
      projects.map((p) => ({
        ...p,
        myAccess: auditorAccessLevel(db, req.user.id, p.id),
      }))
    );
  }

  if (req.user.role === 'end-user') {
    return res.json([]);
  }

  res.json(projects);
});

router.get('/:projectId/grants', requireOwnerOrAuditor, (req, res) => {
  const db = readDb();
  const { projectId } = req.params;
  if (!auditorCanEditProject(db, req.user.id, projectId)) {
    return res.status(403).json({ error: 'Only the project owner or editors can manage guest auditor access' });
  }
  const grants = (db.projectAuditorGrants || []).filter((g) => g.projectId === projectId);
  const users = db.users || [];
  res.json(
    grants.map((g) => {
      const u = users.find((x) => x.id === g.auditorUserId);
      return {
        id: g.id,
        projectId: g.projectId,
        access: g.access,
        auditorUserId: g.auditorUserId,
        auditorEmail: u?.email || null,
        createdAt: g.createdAt,
      };
    })
  );
});

router.post('/:projectId/grants', requireOwnerOrAuditor, (req, res) => {
  const db = readDb();
  const { projectId } = req.params;
  const { auditorEmail, access } = req.body || {};

  if (!auditorCanEditProject(db, req.user.id, projectId)) {
    return res.status(403).json({ error: 'Only the project owner or editors can grant access' });
  }

  const acc = access === 'edit' ? 'edit' : 'view';
  const emailNorm = typeof auditorEmail === 'string' ? auditorEmail.trim().toLowerCase() : '';
  if (!emailNorm) {
    return res.status(400).json({ error: 'auditorEmail required' });
  }

  const guest = db.users.find((u) => u.email.toLowerCase() === emailNorm);
  if (!guest || guest.role !== 'auditor') {
    return res.status(400).json({ error: 'No auditor account with that email (auditors must be created by the platform owner first)' });
  }

  if (guest.id === req.user.id) {
    return res.status(400).json({ error: 'Cannot grant access to yourself' });
  }

  const p = projectById(db, projectId);
  if (guest.id === p.ownerUserId) {
    return res.status(400).json({ error: 'That user already owns this project' });
  }

  db.projectAuditorGrants = db.projectAuditorGrants || [];
  const dup = db.projectAuditorGrants.find((g) => g.projectId === projectId && g.auditorUserId === guest.id);
  if (dup) {
    dup.access = acc;
    writeDb(db);
    return res.json({
      id: dup.id,
      projectId: dup.projectId,
      access: dup.access,
      auditorUserId: dup.auditorUserId,
      auditorEmail: guest.email,
      createdAt: dup.createdAt,
    });
  }

  const row = {
    id: uuidv4(),
    projectId,
    auditorUserId: guest.id,
    access: acc,
    grantedByUserId: req.user.id,
    createdAt: new Date().toISOString(),
  };
  db.projectAuditorGrants.push(row);
  writeDb(db);

  res.status(201).json({
    id: row.id,
    projectId: row.projectId,
    access: row.access,
    auditorUserId: row.auditorUserId,
    auditorEmail: guest.email,
    createdAt: row.createdAt,
  });
});

router.delete('/:projectId/grants/:grantId', requireOwnerOrAuditor, (req, res) => {
  const db = readDb();
  const { projectId, grantId } = req.params;
  if (!auditorCanEditProject(db, req.user.id, projectId)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  db.projectAuditorGrants = db.projectAuditorGrants || [];
  const idx = db.projectAuditorGrants.findIndex((g) => g.id === grantId && g.projectId === projectId);
  if (idx === -1) return res.status(404).json({ error: 'Grant not found' });
  db.projectAuditorGrants.splice(idx, 1);
  writeDb(db);
  res.status(204).end();
});

router.post('/', requireOwnerOrAuditor, (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) {
    return res.status(400).json({ error: 'Project name required' });
  }

  const db = readDb();
  db.projects = db.projects || [];

  const project = {
    id: uuidv4(),
    name: name.trim(),
    ownerUserId: req.user.id,
    createdAt: new Date().toISOString(),
  };

  db.projects.push(project);
  writeDb(db);
  res.status(201).json(project);
});

router.patch('/:projectId', requireOwnerOrAuditor, (req, res) => {
  const db = readDb();
  const { projectId } = req.params;
  if (!auditorCanEditProject(db, req.user.id, projectId)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const p = projectById(db, projectId);
  if (!p) return res.status(404).json({ error: 'Project not found' });

  const { name } = req.body || {};
  if (name !== undefined) {
    const n = String(name).trim();
    if (!n) return res.status(400).json({ error: 'Invalid name' });
    p.name = n;
  }

  writeDb(db);
  res.json(p);
});

module.exports = router;
