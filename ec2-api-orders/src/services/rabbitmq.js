const amqp = require('amqplib');

let channel = null;
let connection = null;

const EXCHANGE = 'order.events';
const DLX_EXCHANGE = 'dlx.exchange';

async function connectRabbitMQ() {
    connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();

    await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
    await channel.assertExchange(DLX_EXCHANGE, 'fanout', { durable: true });

    await channel.assertQueue('q.notify.email', {
        durable: true,
        arguments: {
            'x-dead-letter-exchange': DLX_EXCHANGE,
            'x-message-ttl': 30000
        }
    });

    await channel.assertQueue('q.notify.sms', {
        durable: true,
        arguments: {
            'x-dead-letter-exchange': DLX_EXCHANGE,
            'x-message-ttl': 30000
        }
    });

    await channel.assertQueue('q.dead.letter', { durable: true });

    await channel.bindQueue('q.notify.email', EXCHANGE, 'order.created.email');
    await channel.bindQueue('q.notify.email', EXCHANGE, 'order.shipped.email');
    await channel.bindQueue('q.notify.email', EXCHANGE, 'order.returned.email');
    await channel.bindQueue('q.notify.sms', EXCHANGE, 'order.*.sms');
    await channel.bindQueue('q.dead.letter', DLX_EXCHANGE, '');

    connection.on('close', () => {
        console.error('RabbitMQ connection closed, reconnecting...');
        setTimeout(connectRabbitMQ, 5000);
    });
}

function publishEvent(routingKey, payload) {
    if (!channel) throw new Error('RabbitMQ not connected');

    channel.publish(EXCHANGE, routingKey, Buffer.from(JSON.stringify(payload)), {
        persistent: true,
        contentType: 'application/json',
        timestamp: Date.now()
    });
}

function getChannel() {
    return channel;
}

module.exports = { connectRabbitMQ, publishEvent, getChannel };
