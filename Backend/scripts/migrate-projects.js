/**
 * Migrates db.json to add projects, projectIds to users, projectId to assets, scanHistory.
 * Run: node scripts/migrate-projects.js
 */
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, '..', 'db.json');

const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));

db.projects = db.projects || [];
if (db.projects.length === 0) {
  console.log('No projects yet. Create projects via the Auditor UI.');
}

db.users = (db.users || []).map((u) => {
  if (u.projectIds !== undefined) return u;
  if (u.role === 'end-user') {
    return { ...u, projectIds: [] };
  }
  return { ...u, projectIds: null };
});
console.log('Updated users with projectIds');

db.assets = (db.assets || []).map((a) => {
  if (a.projectId) return a;
  return { ...a, projectId: db.projects[0]?.id || null };
});
console.log('Updated assets with projectId');

db.scanHistory = db.scanHistory || [];
console.log('Ensured scanHistory exists');

fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
console.log('Migration complete.');
