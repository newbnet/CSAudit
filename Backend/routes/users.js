const express = require('express');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { readDb, writeDb } = require('../lib/db');
const { isGoogleAuthOnly } = require('../lib/config');
const { auth, requireOwnerOrAuditor } = require('../middleware/auth');
const {
  isPlatformOwner,
  visibleProjectIdsForAuditor,
  editableProjectIdsForAuditor,
} = require('../lib/access');

const router = express.Router();

router.use(auth);
router.use(requireOwnerOrAuditor);

function auditorVisibleUserIds(db, auditorUserId) {
  const visibleProjects = new Set(visibleProjectIdsForAuditor(db, auditorUserId));
  const ids = new Set([auditorUserId]);
  for (const u of db.users || []) {
    if (u.role === 'end-user' && (u.projectIds || []).some((pid) => visibleProjects.has(pid))) {
      ids.add(u.id);
    }
  }
  return ids;
}

router.get('/', (req, res) => {
  const db = readDb();
  const mapUser = (u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    projectIds: u.projectIds || [],
  });

  if (isPlatformOwner(req.user.role)) {
    return res.json((db.users || []).map(mapUser));
  }

  const allowed = auditorVisibleUserIds(db, req.user.id);
  const users = (db.users || []).filter((u) => allowed.has(u.id)).map(mapUser);
  res.json(users);
});

router.post('/', (req, res) => {
  const { email, password, name, role, projectIds } = req.body;
  if (!email?.trim()) {
    return res.status(400).json({ error: 'Email required' });
  }

  const db = readDb();
  if (isPlatformOwner(req.user.role)) {
    const r = role || 'end-user';
    if (!['auditor', 'end-user', 'pending'].includes(r)) {
      return res.status(400).json({ error: 'Owner can create auditor, end-user, or pending accounts' });
    }
  } else {
    if (role === 'auditor' || role === 'owner') {
      return res.status(403).json({ error: 'Only the platform owner can create auditor accounts' });
    }
    const ar = role || 'end-user';
    if (ar !== 'end-user' && ar !== 'pending') {
      return res.status(400).json({ error: 'Auditors may only create end-user or pending accounts' });
    }
  }

  const pids = (projectIds || []).filter(Boolean);
  if (!isPlatformOwner(req.user.role) && role === 'end-user' && pids.length) {
    const editable = new Set(editableProjectIdsForAuditor(db, req.user.id));
    if (!pids.every((id) => editable.has(id))) {
      return res.status(403).json({ error: 'You can only assign projects you own or can edit' });
    }
  }

  const pwd = password != null ? String(password) : '';
  const googleOnly = isGoogleAuthOnly();
  if (!googleOnly && !pwd) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  let passwordHash;
  if (googleOnly) {
    if (pwd.length === 0) passwordHash = null;
    else if (pwd.length >= 8) passwordHash = bcrypt.hashSync(pwd, 10);
    else return res.status(400).json({ error: 'Password must be at least 8 characters' });
  } else {
    if (pwd.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    passwordHash = bcrypt.hashSync(pwd, 10);
  }

  const existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
  if (existing) {
    return res.status(400).json({ error: 'Email already in use' });
  }

  let newRole = 'end-user';
  if (isPlatformOwner(req.user.role)) {
    const r = role || 'end-user';
    if (r === 'auditor') newRole = 'auditor';
    else if (r === 'pending') newRole = 'pending';
    else newRole = 'end-user';
  } else {
    newRole = (role || 'end-user') === 'pending' ? 'pending' : 'end-user';
  }

  const id = uuidv4();
  const user = {
    id,
    email: email.trim().toLowerCase(),
    passwordHash,
    name: (name || '').trim() || email.trim(),
    role: newRole,
    projectIds: newRole === 'auditor' || newRole === 'owner' ? null : pids,
  };

  db.users = db.users || [];
  db.users.push(user);
  writeDb(db);

  res.status(201).json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    projectIds: user.projectIds || [],
  });
});

router.patch('/:id', (req, res) => {
  const { id } = req.params;
  const { password, name, role, projectIds } = req.body;

  const db = readDb();
  const user = db.users.find((u) => u.id === id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (user.role === 'owner' && role !== undefined && role !== 'owner') {
    return res.status(400).json({ error: 'Platform owner role cannot be changed here' });
  }

  if (user.id === req.user.id && role !== undefined && role !== user.role) {
    return res.status(403).json({ error: 'Cannot change your own role' });
  }

  if (!isPlatformOwner(req.user.role)) {
    if (user.id !== req.user.id && user.role !== 'end-user' && user.role !== 'pending') {
      return res.status(403).json({ error: 'You can only manage end users and pending accounts in your projects' });
    }
    if (role === 'owner' || role === 'auditor') {
      return res.status(403).json({ error: 'Cannot assign owner or auditor role' });
    }
    const editable = new Set(editableProjectIdsForAuditor(db, req.user.id));
    const visible = new Set(visibleProjectIdsForAuditor(db, req.user.id));
    const currentProjects = user.projectIds || [];
    if (user.role === 'end-user' && currentProjects.some((pid) => !visible.has(pid))) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (projectIds !== undefined && user.role === 'end-user') {
      const next = (projectIds || []).filter(Boolean);
      if (!next.every((pid) => editable.has(pid))) {
        return res.status(403).json({ error: 'You can only assign projects you own or can edit' });
      }
    }
  }

  if (password !== undefined && password !== '') {
    user.passwordHash = bcrypt.hashSync(password, 10);
  }
  if (name !== undefined) user.name = String(name).trim() || user.email;

  if (role !== undefined && user.role !== 'owner') {
    const allowed = isPlatformOwner(req.user.role)
      ? ['auditor', 'end-user', 'pending']
      : ['end-user', 'pending'];
    if (!allowed.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    user.role = role;
    if (role === 'auditor') {
      user.projectIds = null;
    } else if (role === 'pending') {
      user.projectIds = [];
    } else {
      user.projectIds = (projectIds !== undefined ? projectIds : user.projectIds || []).filter(Boolean);
    }
  }
  if (projectIds !== undefined && user.role === 'end-user') {
    user.projectIds = (projectIds || []).filter(Boolean);
  }

  writeDb(db);

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    projectIds: user.projectIds || [],
  });
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const target = db.users.find((u) => u.id === id);
  if (!target) return res.status(404).json({ error: 'User not found' });

  if (target.id === req.user.id) {
    return res.status(403).json({ error: 'You cannot delete your own account here' });
  }
  if (target.role === 'owner') {
    return res.status(403).json({ error: 'Platform owner accounts cannot be deleted' });
  }

  if (isPlatformOwner(req.user.role)) {
    if (target.role === 'auditor') {
      const owned = (db.projects || []).filter((p) => p.ownerUserId === target.id);
      if (owned.length > 0) {
        return res.status(409).json({
          error: `This auditor still owns ${owned.length} project(s). Reassign or delete those projects before removing the account.`,
        });
      }
    }
  } else {
    if (target.role !== 'end-user' && target.role !== 'pending') {
      return res.status(403).json({ error: 'You can only remove end-user or pending accounts' });
    }
    const allowed = auditorVisibleUserIds(db, req.user.id);
    if (!allowed.has(target.id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
  }

  db.users = (db.users || []).filter((u) => u.id !== id);
  db.projectAuditorGrants = (db.projectAuditorGrants || []).filter((g) => g.auditorUserId !== id);

  const emailNorm = String(target.email).toLowerCase();
  db.invitations = (db.invitations || []).filter(
    (i) => String(i.email).toLowerCase() !== emailNorm || i.usedAt
  );

  writeDb(db);
  res.status(204).end();
});

module.exports = router;
