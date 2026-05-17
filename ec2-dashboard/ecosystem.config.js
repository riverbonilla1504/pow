module.exports = {
  apps: [{
    name: 'admin-dashboard',
    script: 'node_modules/next/dist/bin/next',
    args: 'start -p 3001',
    cwd: '/home/ubuntu/pow/ec2-dashboard',
    env: {
      NODE_ENV: 'production',
      NEXT_PUBLIC_API_URL: 'https://api.freck.lat',
    },
  }],
};
