// backend/routes/ledger.js
const express = require('express');
const router = express.Router();
const ledger = require('../utils/ledger');

// GET /api/ledger -> list recent entries
router.get('/', (req, res) => {
  try {
    const rows = ledger.listEntries(200);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ledger (body: { action, data })
router.post('/', (req, res) => {
  try {
    const { action, data } = req.body;
    if (!action) return res.status(400).json({ error: 'action required' });
    const entry = ledger.addEntry(action, data || '');
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
