require('dotenv').config({ path: require('path').join(__dirname, '..', 'deploy.env') });

// Abwoon d'bwashmaya
// Fail fast in production if JWT_SECRET is missing
require('./lib/config').getJwtSecret();

const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const assetRoutes = require('./routes/assets');
const uploadRoutes = require('./routes/upload');
const userRoutes = require('./routes/users');

const app = express();

// Invalid percent-sequences (e.g. /%c0) make Express decodeURIComponent throw; bots send these often.
app.use((req, res, next) => {
  const pathPart = (req.url || '').split('?')[0];
  try {
    decodeURIComponent(pathPart);
  } catch (err) {
    if (err instanceof URIError) {
      return res.status(400).end('Bad Request');
    }
    throw err;
  }
  next();
});

const PORT = process.env.PORT || 3001;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const FRONTEND_DIST = path.join(__dirname, '..', 'Frontend', 'dist');

const CORS_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:3010',
  'http://10.10.10.64:3010',
  'https://cod-data.com',
  'https://www.cod-data.com',
  'http://cod-data.com',
  'http://www.cod-data.com',
];
app.set('trust proxy', 1);
app.use(cors({ origin: CORS_ORIGINS }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'cod-data-backend' });
});

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/users', userRoutes);

if (IS_PRODUCTION && require('fs').existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
  app.get('*', (req, res) => res.sendFile(path.join(FRONTEND_DIST, 'index.html')));
} else {
  app.get('/', (req, res) => {
    const host = req.get('host') || `localhost:${PORT}`;
    const frontPort = PORT === 5010 ? '3010' : '5173';
    const appUrl = `http://${host.split(':')[0]}:${frontPort}`;
    res.type('html').send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>COD-DATA API</title></head><body><h1>COD-DATA Backend</h1><p>API server. Use the app at <a href="${appUrl}">${appUrl}</a></p><p><a href="/health">Health check</a></p></body></html>`);
  });
}

app.listen(PORT, () => {
  console.log(`COD-DATA backend listening on port ${PORT}${IS_PRODUCTION ? ' (production)' : ''}`);
});
