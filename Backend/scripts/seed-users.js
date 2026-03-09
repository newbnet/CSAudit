/**
 * Seeds db.json with bcrypt-hashed passwords.
 * Run: node scripts/seed-users.js
 */
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'db.json');
const DEMO_PASSWORD = 'demo123';

async function seed() {
  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);

  db.users = db.users.map(u => ({ ...u, passwordHash: hash }));
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  console.log('Seeded users. Demo password for both: demo123');
}

seed().catch(console.error);
