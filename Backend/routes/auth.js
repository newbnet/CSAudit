const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { readDb } = require('../lib/db');
const { getJwtSecret } = require('../lib/config');

const router = express.Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const db = readDb();
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = bcrypt.compareSync(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id, role: user.role, projectIds: user.projectIds },
    getJwtSecret(),
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role, projectIds: user.projectIds },
  });
});

module.exports = router;
