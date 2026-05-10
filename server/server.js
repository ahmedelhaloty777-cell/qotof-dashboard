const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const DEFAULT_DATA = {
  orders: [], products: [], customers: [],
  expenses: [], drivers: [], suppliers: [],
  invoices: [], settings: {}
};

function readData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_DATA, null, 2));
      return JSON.parse(JSON.stringify(DEFAULT_DATA));
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch {
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  }
}

function writeData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch { return false; }
}

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.get('/api/data', (_req, res) => {
  try { res.json(readData()); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/data', (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object')
      return res.status(400).json({ error: 'Invalid JSON' });
    if (!writeData(req.body))
      return res.status(500).json({ error: 'Failed to save' });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(PORT, () => {
  console.log(`\n🚀 قطوف server running on http://localhost:${PORT}`);
  console.log(`   GET  /api/health`);
  console.log(`   GET  /api/data`);
  console.log(`   POST /api/data\n`);
});
