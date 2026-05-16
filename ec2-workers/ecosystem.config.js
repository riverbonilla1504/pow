module.exports = {
    apps: [
        {
            name: 'worker-email',
            script: 'src/email-worker.js',
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '200M'
        },
        {
            name: 'worker-sms',
            script: 'src/sms-worker.js',
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '200M'
        }
    ]
};
