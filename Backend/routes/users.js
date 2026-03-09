const express = require('express');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { readDb, writeDb } = require('../lib/db');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(auth);
router.use(requireRole('auditor'));

router.get('/', (req, res) => {
  const db = readDb();
  const users = (db.users || []).map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    projectIds: u.projectIds || [],
  }));
  res.json(users);
});

router.post('/', (req, res) => {
  const { email, password, name, role, projectIds } = req.body;
  if (!email?.trim() || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const db = readDb();
  const existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
  if (existing) {
    return res.status(400).json({ error: 'Email already in use' });
  }

  const id = uuidv4();
  const passwordHash = bcrypt.hashSync(password, 10);
  const user = {
    id,
    email: email.trim().toLowerCase(),
    passwordHash,
    name: (name || '').trim() || email.trim(),
    role: role === 'auditor' ? 'auditor' : 'end-user',
    projectIds: role === 'auditor' ? null : (projectIds || []).filter(Boolean),
  };

  db.users = db.users || [];
  db.users.push(user);
  writeDb(db);

  res.status(201).json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    projectIds: user.projectIds,
  });
});

router.patch('/:id', (req, res) => {
  const { id } = req.params;
  const { password, name, role, projectIds } = req.body;

  const db = readDb();
  const user = db.users.find((u) => u.id === id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (password !== undefined && password !== '') {
    user.passwordHash = bcrypt.hashSync(password, 10);
  }
  if (name !== undefined) user.name = String(name).trim() || user.email;
  if (role !== undefined) {
    user.role = role === 'auditor' ? 'auditor' : 'end-user';
    user.projectIds = user.role === 'auditor' ? null : (projectIds !== undefined ? projectIds : user.projectIds || []).filter(Boolean);
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
    projectIds: user.projectIds,
  });
});

module.exports = router;
