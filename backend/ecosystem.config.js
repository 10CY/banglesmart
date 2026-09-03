module.exports = {
  apps: [
    {
      name: "banglesmart-app",
      script: "./src/server.js",
      instances: 1,           
      exec_mode: "fork",   
      env: {
        NODE_ENV: "production",
        PORT: 3004,
      },
      // Logging options
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      
      // Restart behavior
      max_memory_restart: "500M",
      min_uptime: "10s",
      max_restarts: 5,
    },
  ],
};