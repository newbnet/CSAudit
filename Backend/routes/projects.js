const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { readDb, writeDb } = require('../lib/db');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/', (req, res) => {
  const db = readDb();
  let projects = db.projects || [];

  if (req.user.role === 'end-user' && req.user.projectIds?.length) {
    projects = projects.filter((p) => req.user.projectIds.includes(p.id));
  }

  res.json(projects);
});

router.post('/', requireRole('auditor'), (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) {
    return res.status(400).json({ error: 'Project name required' });
  }

  const db = readDb();
  db.projects = db.projects || [];

  const project = {
    id: uuidv4(),
    name: name.trim(),
    createdAt: new Date().toISOString(),
  };

  db.projects.push(project);
  writeDb(db);
  res.status(201).json(project);
});

module.exports = router;
