module.exports = {
  apps: [
    {
      name: "coursemini",
      script: "dist/index.cjs",
      instances: "max",
      exec_mode: "cluster",
      env_production: {
        NODE_ENV: "production",
      },
      error_file: "/var/log/coursemini/error.log",
      out_file: "/var/log/coursemini/out.log",
      merge_logs: true,
      restart_delay: 3000,
      max_restarts: 10,
      watch: false,
    },
  ],
};
