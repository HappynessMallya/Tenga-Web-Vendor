/**
 * PM2 Ecosystem Configuration for Ubuntu Server Deployment
 * 
 * This file configures PM2 to run the web app using serve
 * 
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 save
 *   pm2 startup systemd
 */

module.exports = {
  apps: [
    {
      name: 'tenga-web',
      script: 'npx',
      args: 'serve dist -s -l 3000',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '1G',
      watch: false,
      // Restart on file changes (only if watch is true)
      ignore_watch: ['node_modules', 'logs', '.git'],
      // Environment-specific settings
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000
      }
    }
  ]
};

