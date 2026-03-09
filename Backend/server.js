const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const assetRoutes = require('./routes/assets');
const uploadRoutes = require('./routes/upload');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'] }));
app.use(express.json());

app.get('/', (req, res) => {
  const host = req.get('host') || 'localhost:3001';
  const appUrl = host.includes('3001') ? 'http://localhost:5173' : `http://${host.replace('3001', '5173')}`;
  res.type('html').send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>COD-DATA API</title></head><body><h1>COD-DATA Backend</h1><p>API server. Use the app at <a href="${appUrl}">${appUrl}</a></p><p><a href="/health">Health check</a></p></body></html>`);
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'cod-data-backend' });
});

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/users', userRoutes);

app.listen(PORT, () => {
  console.log(`COD-DATA backend listening on port ${PORT}`);
});
