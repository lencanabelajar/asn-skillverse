// backend/app.js
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const trainingRoutes = require('./routes/training');
const badgeRoutes = require('./routes/badge');
const ledgerRoutes = require('./routes/ledger');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'db', 'skillverse.db');

function ensureDbDir() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
ensureDbDir();

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Static access to trainings folder (so frontend on GitHub Pages can link to raw files when testing locally)
app.use('/trainings', express.static(path.join(__dirname, '..', 'trainings')));

// API routes
app.use('/api/training', trainingRoutes);
app.use('/api/badge', badgeRoutes);
app.use('/api/ledger', ledgerRoutes);

// basic health
app.get('/api/health', (req, res) => {
  return res.json({ ok: true, mode: process.env.NODE_ENV || 'development' });
});

// start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`ASN SkillVerse backend listening on http://localhost:${PORT}`);
  console.log(`DB path: ${DB_PATH}`);
});
