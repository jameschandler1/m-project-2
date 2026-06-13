module.exports = {
  apps: [
    {
      name: "didyoudoityet-api",
      script: "server.js",
      cwd: "/home/ubuntu/m-project-2/backend",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 4000
      }
    }
  ]
};