const path = require('path');
// Root deploy.env (production / server). Backend/.env adds local vars without overriding existing keys.
require('dotenv').config({ path: path.join(__dirname, '..', 'deploy.env') });
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Abwoon d'bwashmaya
// Fail fast in production if JWT_SECRET is missing
const { getJwtSecret, isGoogleAuthOnly } = require('./lib/config');
getJwtSecret();
if (process.env.NODE_ENV === 'production') {
  const { isGoogleOAuthEnabled } = require('./lib/googleOAuth');
  console.log(
    `[COD-DATA] Auth: GOOGLE_AUTH_ONLY=${isGoogleAuthOnly()} googleOAuthConfigured=${isGoogleOAuthEnabled()}`
  );
}

const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const assetRoutes = require('./routes/assets');
const uploadRoutes = require('./routes/upload');
const userRoutes = require('./routes/users');
const invitationRoutes = require('./routes/invitations');
const assetTypesRoutes = require('./routes/assetTypes');

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

const fs = require('fs');
const parsedPort = Number(process.env.PORT);
const PORT = Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 3001;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const FRONTEND_DIST = path.join(__dirname, '..', 'Frontend', 'dist');
const distExists = fs.existsSync(FRONTEND_DIST);

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
app.use('/api/invitations', invitationRoutes);
app.use('/api/asset-types', assetTypesRoutes);

if (IS_PRODUCTION && distExists) {
  app.use(express.static(FRONTEND_DIST));
  app.get('*', (req, res) => res.sendFile(path.join(FRONTEND_DIST, 'index.html')));
} else if (IS_PRODUCTION && !distExists) {
  console.error(
    `COD-DATA: NODE_ENV=production but no built frontend at ${FRONTEND_DIST}. On the server run: cd Frontend && npm install && npm run build`
  );
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api') || req.path === '/health') {
      return res.status(404).end();
    }
    res
      .status(503)
      .type('html')
      .send(
        '<!DOCTYPE html><html><head><meta charset="utf-8"><title>COD-DATA</title></head><body>' +
          '<h1>App not built</h1><p>Production mode requires <code>Frontend/dist</code>. On the app server run:</p>' +
          '<pre>cd /local/bin/projects/Cybersecurity/Frontend && npm install && npm run build && cd .. && pm2 restart cybersecurity-backend</pre>' +
          '<p><a href="/health">Health check</a></p></body></html>'
      );
  });
} else {
  app.get('/', (req, res) => {
    const host = req.get('host') || `localhost:${PORT}`;
    const frontPort = PORT === 5010 ? '3010' : '5173';
    const appUrl = `${req.protocol}://${host.split(':')[0]}:${frontPort}`;
    res
      .type('html')
      .send(
        `<!DOCTYPE html><html><head><meta charset="utf-8"><title>COD-DATA API</title></head><body><h1>COD-DATA Backend</h1><p>API server (dev). Use the app at <a href="${appUrl}">${appUrl}</a></p><p><a href="/health">Health check</a></p></body></html>`
      );
  });
}

app.listen(PORT, () => {
  console.log(`COD-DATA backend listening on port ${PORT}${IS_PRODUCTION ? ' (production)' : ''}`);
});
