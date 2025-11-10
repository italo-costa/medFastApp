/**
 * 🏥 MediApp PM2 Configuration
 * Configuração de produção para Process Manager
 */

module.exports = {
  apps: [{
    name: 'mediapp-backend',
    script: './server-robust.js',
    cwd: './apps/backend',
    instances: 'max',
    exec_mode: 'cluster',
    
    // Environment
    env: {
      NODE_ENV: 'development',
      PORT: 3002
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3002
    },
    env_staging: {
      NODE_ENV: 'staging',
      PORT: 3003
    },
    
    // Resources
    min_uptime: '10s',
    max_restarts: 10,
    max_memory_restart: '1G',
    
    // Logging
    log_file: './logs/mediapp.log',
    out_file: './logs/mediapp-out.log',
    error_file: './logs/mediapp-error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Monitoring
    watch: false,
    ignore_watch: [
      'node_modules',
      'logs',
      'uploads',
      '*.log'
    ],
    
    // Advanced
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 3000,
    
    // Health check
    health_check_grace_period: 3000,
    
    // Auto restart conditions  
    restart_delay: 4000,
    exp_backoff_restart_delay: 100,
    
    // Cron restart (every day at 2 AM)
    cron_restart: '0 2 * * *',
    
    // Merge logs
    merge_logs: true,
    
    // Source map support
    source_map_support: true,
    
    // Graceful shutdown
    shutdown_with_message: true
  }],
  
  deploy: {
    production: {
      user: 'deploy',
      host: ['mediapp.com'],
      ref: 'origin/master',
      repo: 'git@github.com:italo-costa/medFastApp.git',
      path: '/var/www/mediapp',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      env: {
        NODE_ENV: 'production'
      }
    },
    staging: {
      user: 'deploy',
      host: ['staging.mediapp.com'],
      ref: 'origin/develop',
      repo: 'git@github.com:italo-costa/medFastApp.git',
      path: '/var/www/mediapp-staging',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env staging',
      env: {
        NODE_ENV: 'staging'
      }
    }
  }
};