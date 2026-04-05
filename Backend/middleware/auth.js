const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../lib/config');

function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const token = authHeader.slice(7);
    const payload = jwt.verify(token, getJwtSecret());
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

function requireOwner(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  if (req.user.role !== 'owner') {
    return res.status(403).json({ error: 'Owner access required' });
  }
  next();
}

function requireOwnerOrAuditor(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  if (req.user.role !== 'owner' && req.user.role !== 'auditor') {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
}

/** Blocks self-registered users until an auditor assigns a role. */
function blockPending(req, res, next) {
  if (req.user?.role === 'pending') {
    return res.status(403).json({
      error: 'pending_activation',
      message: 'Your account is waiting for an auditor to assign access.',
    });
  }
  next();
}

module.exports = { auth, requireRole, requireOwner, requireOwnerOrAuditor, blockPending };
