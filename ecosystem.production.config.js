const path = require('path');
const fs = require('fs');

const deployEnvPath = path.join(__dirname, 'deploy.env');

module.exports = {
  apps: [
    {
      name: 'cybersecurity-backend',
      cwd: path.join(__dirname, 'Backend'),
      script: 'server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      // PM2 injects vars from deploy.env so GOOGLE_AUTH_ONLY etc. are always visible to Node (in addition to dotenv in server.js).
      ...(fs.existsSync(deployEnvPath) ? { env_file: deployEnvPath } : {}),
      env: { NODE_ENV: 'production', PORT: '5010' },
      error_file: path.join(__dirname, 'logs', 'backend-error.log'),
      out_file: path.join(__dirname, 'logs', 'backend-out.log'),
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
};
