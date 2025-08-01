module.exports = {
  apps: [
    {
      name: 'auction-app',
      script: 'server.js',
      instances: 'max', // Use maximum number of CPU cores
      exec_mode: 'cluster', // Run in cluster mode
      watch: false, // Don't watch for file changes in production
      max_memory_restart: '500M', // Restart if memory exceeds 500MB
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 5000
      }
    }
  ]
};
