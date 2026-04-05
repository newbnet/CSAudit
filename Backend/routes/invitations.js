const express = require('express');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { readDb, writeDb } = require('../lib/db');
const { resolveFrontendOrigin } = require('../lib/googleOAuth');
const { auth, requireOwnerOrAuditor } = require('../middleware/auth');
const { isPlatformOwner, editableProjectIdsForAuditor } = require('../lib/access');

const router = express.Router();
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

router.use(auth);
router.use(requireOwnerOrAuditor);

router.get('/', (req, res) => {
  const db = readDb();
  let list = (db.invitations || []).filter((i) => !i.usedAt);

  if (!isPlatformOwner(req.user.role)) {
    list = list.filter((i) => i.createdByUserId === req.user.id);
  }

  res.json(
    list.map((i) => ({
      id: i.id,
      email: i.email,
      role: i.role,
      projectIds: i.projectIds || [],
      createdAt: i.createdAt,
      expiresAt: i.expiresAt,
    }))
  );
});

router.post('/', (req, res) => {
  const { email, role, projectIds } = req.body;
  if (!email?.trim()) {
    return res.status(400).json({ error: 'Email required' });
  }

  const r = role === 'auditor' ? 'auditor' : 'end-user';
  if (r === 'auditor' && !isPlatformOwner(req.user.role)) {
    return res.status(403).json({ error: 'Only the platform owner can invite new auditors' });
  }

  const db = readDb();
  db.invitations = db.invitations || [];

  const emailNorm = email.trim().toLowerCase();
  if (db.users.some((u) => u.email.toLowerCase() === emailNorm)) {
    return res.status(400).json({ error: 'A user with this email already exists' });
  }

  const pids = r === 'auditor' ? [] : (projectIds || []).filter(Boolean);
  if (r === 'end-user' && !isPlatformOwner(req.user.role)) {
    const editable = new Set(editableProjectIdsForAuditor(db, req.user.id));
    if (!pids.length) {
      return res.status(400).json({ error: 'Select at least one project for an end-user invitation' });
    }
    if (!pids.every((id) => editable.has(id))) {
      return res.status(403).json({ error: 'You can only invite users to projects you own or can edit' });
    }
  }

  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  const invitation = {
    id: uuidv4(),
    token,
    email: emailNorm,
    role: r,
    projectIds: r === 'auditor' ? null : pids,
    createdByUserId: req.user.id,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + INVITE_TTL_MS).toISOString(),
    usedAt: null,
  };

  db.invitations.push(invitation);
  writeDb(db);

  const base = resolveFrontendOrigin(req);
  res.status(201).json({
    id: invitation.id,
    email: invitation.email,
    role: invitation.role,
    projectIds: invitation.projectIds || [],
    expiresAt: invitation.expiresAt,
    inviteUrl: `${base}/register?invite=${token}`,
  });
});

router.delete('/:id', (req, res) => {
  const db = readDb();
  db.invitations = db.invitations || [];
  const inv = db.invitations.find((i) => i.id === req.params.id);
  if (!inv) return res.status(404).json({ error: 'Invitation not found' });
  if (!isPlatformOwner(req.user.role) && inv.createdByUserId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const idx = db.invitations.findIndex((i) => i.id === req.params.id);
  db.invitations.splice(idx, 1);
  writeDb(db);
  res.status(204).end();
});

module.exports = router;
