// backend/utils/ledger.js
const crypto = require('crypto');
const db = require('./db');

function latestHash() {
  const row = db.prepare('SELECT data_hash FROM ledger ORDER BY id DESC LIMIT 1').get();
  return row ? row.data_hash : '0';
}

function computeHash(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function addEntry(action, data = '') {
  const prev = latestHash();
  const payload = `${action}|${data}|${Date.now()}|${prev}`;
  const hash = computeHash(payload);
  const stmt = db.prepare('INSERT INTO ledger (action, data_hash, prev_hash) VALUES (?, ?, ?)');
  const info = stmt.run(action, hash, prev);
  return {
    id: info.lastInsertRowid,
    timestamp: new Date().toISOString(),
    action,
    hash,
    prevHash: prev
  };
}

function listEntries(limit = 100) {
  return db.prepare('SELECT id, action, data_hash as hash, prev_hash as prevHash, timestamp FROM ledger ORDER BY id DESC LIMIT ?').all(limit);
}

module.exports = {
  addEntry,
  listEntries,
  computeHash,
  latestHash
};
