const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { readDb, writeDb } = require('../lib/db');
const { auth, requireOwnerOrAuditor, blockPending } = require('../middleware/auth');
const { auditorCanEditProject } = require('../lib/access');
const { BUILTIN_ASSET_TYPES } = require('../config/builtinAssetTypes');

const router = express.Router();
router.use(auth);
router.use(blockPending);
router.use(requireOwnerOrAuditor);

router.get('/', (req, res) => {
  const db = readDb();
  const templates = db.sharedAssetTypeTemplates || [];
  const community = templates
    .filter((t) => t.visibleToCommunity)
    .map((t) => ({
      id: t.id,
      label: t.label,
      description: t.description || '',
      value: t.label,
      subTypes: null,
      source: 'community',
    }));
  const mine = templates
    .filter((t) => t.createdByUserId === req.user.id && !t.visibleToCommunity)
    .map((t) => ({
      id: t.id,
      label: t.label,
      description: t.description || '',
      value: t.label,
      subTypes: null,
      source: 'private',
      sourceProjectId: t.sourceProjectId,
    }));

  res.json({
    builtin: BUILTIN_ASSET_TYPES,
    community,
    privateTemplates: mine,
  });
});

router.post('/', (req, res) => {
  const { label, description, projectId, shareWithCommunity } = req.body || {};
  const db = readDb();
  const l = typeof label === 'string' ? label.trim() : '';
  if (!l) return res.status(400).json({ error: 'label required' });
  if (!projectId) return res.status(400).json({ error: 'projectId required' });
  if (!auditorCanEditProject(db, req.user.id, projectId)) {
    return res.status(403).json({ error: 'You can only add custom types for projects you can edit' });
  }

  const builtinValues = new Set(BUILTIN_ASSET_TYPES.map((x) => x.value.toLowerCase()));
  if (builtinValues.has(l.toLowerCase())) {
    return res.status(400).json({ error: 'That label matches a built-in type' });
  }

  db.sharedAssetTypeTemplates = db.sharedAssetTypeTemplates || [];
  const dup = db.sharedAssetTypeTemplates.find(
    (t) => t.label.toLowerCase() === l.toLowerCase() && t.createdByUserId === req.user.id
  );
  if (dup) {
    return res.status(400).json({ error: 'You already have a custom type with that label' });
  }

  const row = {
    id: uuidv4(),
    label: l,
    description: typeof description === 'string' ? description.trim().slice(0, 500) : '',
    sourceProjectId: projectId,
    createdByUserId: req.user.id,
    visibleToCommunity: Boolean(shareWithCommunity),
    createdAt: new Date().toISOString(),
  };
  db.sharedAssetTypeTemplates.push(row);
  writeDb(db);

  res.status(201).json({
    id: row.id,
    label: row.label,
    description: row.description,
    value: row.label,
    subTypes: null,
    source: row.visibleToCommunity ? 'community' : 'private',
  });
});

router.patch('/:id/share', (req, res) => {
  const db = readDb();
  const t = (db.sharedAssetTypeTemplates || []).find((x) => x.id === req.params.id);
  if (!t) return res.status(404).json({ error: 'Not found' });
  if (t.createdByUserId !== req.user.id) {
    return res.status(403).json({ error: 'Only the author can change sharing' });
  }
  const { visibleToCommunity } = req.body || {};
  if (typeof visibleToCommunity !== 'boolean') {
    return res.status(400).json({ error: 'visibleToCommunity boolean required' });
  }
  t.visibleToCommunity = visibleToCommunity;
  writeDb(db);
  res.json({
    id: t.id,
    label: t.label,
    visibleToCommunity: t.visibleToCommunity,
  });
});

module.exports = router;
