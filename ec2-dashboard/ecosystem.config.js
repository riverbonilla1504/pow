module.exports = {
  apps: [
    {
      name: 'dashboard',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/home/ubuntu/pow/ec2-dashboard',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '400M',
    },
  ],
};
