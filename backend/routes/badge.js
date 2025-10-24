// backend/routes/badge.js
const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const ledger = require('../utils/ledger');

// GET /api/badge/ -> list issued badges (from DB)
router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT id, badge_id, title, points, issuer, cid, issued_at FROM badges ORDER BY id DESC').all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/badge/issue
// body: { badge_id, title, points, issuer, cid }
router.post('/issue', (req, res) => {
  try {
    const { badge_id, title, points, issuer, cid } = req.body;
    if (!badge_id || !title) return res.status(400).json({ error: 'badge_id and title required' });
    const stmt = db.prepare('INSERT INTO badges (badge_id, title, points, issuer, cid) VALUES (?, ?, ?, ?, ?)');
    const info = stmt.run(badge_id, title, points || 0, issuer || 'ASN SkillVerse', cid || null);

    const entry = ledger.addEntry('ISSUE_BADGE', JSON.stringify({ badge_id, title, issuer }));
    // record ledger in DB is already handled by addEntry
    res.json({ ok: true, id: info.lastInsertRowid, ledger: entry });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
