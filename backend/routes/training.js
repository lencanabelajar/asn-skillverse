// backend/routes/training.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const trainingsDir = path.join(__dirname, '..', '..', 'trainings');

// GET /api/training/         -> list brief (reads data/training.json if exists)
router.get('/', async (req, res) => {
  try {
    const dataFile = path.join(__dirname, '..', '..', 'data', 'training.json');
    if (fs.existsSync(dataFile)) {
      const raw = fs.readFileSync(dataFile, 'utf8');
      return res.json(JSON.parse(raw));
    }
    // fallback: scan trainings folder
    const items = fs.readdirSync(trainingsDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => {
        const infoFile = path.join(trainingsDir, d.name, 'info.json');
        if (fs.existsSync(infoFile)) {
          return JSON.parse(fs.readFileSync(infoFile, 'utf8'));
        }
        return { id: d.name, title: d.name };
      });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/training/:id/info -> return info.json
router.get('/:id/info', (req, res) => {
  const id = req.params.id;
  const infoFile = path.join(trainingsDir, id, 'info.json');
  if (!fs.existsSync(infoFile)) return res.status(404).json({ error: 'Module not found' });
  const info = JSON.parse(fs.readFileSync(infoFile, 'utf8'));
  res.json(info);
});

module.exports = router;
