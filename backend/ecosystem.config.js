module.exports = {
  apps: [
    {
      name: "didyoudoityet-api",
      script: "server.js",
      cwd: process.env.APP_DIR || "/opt/didyoudoityet/backend",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 4000
      }
    },
    {
      name: "didyoudoityet-htmx",
      script: "server.js",
      cwd: process.env.APP_DIR || "/opt/didyoudoityet/frontend-htmx",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
};