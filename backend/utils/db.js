// backend/utils/db.js
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'db', 'skillverse.db');
const SCHEMA_FILE = path.join(__dirname, '..', 'db', 'schema.sql');

function ensureDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const db = new Database(DB_PATH);
  const schema = fs.readFileSync(SCHEMA_FILE, 'utf8');
  db.exec(schema);
  return db;
}

module.exports = ensureDb();
