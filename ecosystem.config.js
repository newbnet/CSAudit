const path = require('path');

module.exports = {
  apps: [
    {
      name: 'cod-data-backend',
      cwd: path.join(__dirname, 'Backend'),
      script: 'server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: { NODE_ENV: 'development' },
      error_file: path.join(__dirname, 'logs', 'backend-error.log'),
      out_file: path.join(__dirname, 'logs', 'backend-out.log'),
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
    {
      name: 'cod-data-frontend',
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
