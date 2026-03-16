module.exports = {
  apps: [
    {
      name: "coursemini",
      script: "dist/index.cjs",
      instances: "max",
      exec_mode: "cluster",
      env_production: {
        NODE_ENV: "production",
        CLICKSEND_USERNAME: "hello@coursemini.com",
        CLICKSEND_API_KEY: "60EC6AC9-D414-3B39-FAE4-2AFD38077292",
        CLICKSEND_FROM_EMAIL: "hello@coursemini.com",
        CLICKSEND_FROM_EMAIL_ID: "32884",
        CLICKSEND_FROM_NAME: "CourseMini",
        APP_URL: "https://coursemini.com",
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
