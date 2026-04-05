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
      ...(fs.existsSync(deployEnvPath) ? { env_file: deployEnvPath } : {}),
      env: { NODE_ENV: 'development', PORT: '5010' },
      error_file: path.join(__dirname, 'logs', 'backend-error.log'),
      out_file: path.join(__dirname, 'logs', 'backend-out.log'),
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
    {
      name: 'cybersecurity-frontend',
      cwd: path.join(__dirname, 'Frontend'),
      script: 'npm',
      args: ['run', 'dev'],
      instances: 1,
      autorestart: true,
      watch: false,
      env: { NODE_ENV: 'development' },
      error_file: path.join(__dirname, 'logs', 'frontend-error.log'),
      out_file: path.join(__dirname, 'logs', 'frontend-out.log'),
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
};
