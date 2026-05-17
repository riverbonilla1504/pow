require('dotenv').config();
const amqp = require('amqplib');
const twilio = require('twilio');
const { logNotification } = require('./db');

const QUEUE = 'q.notify.sms';
const MAX_RETRIES = 3;

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const FROM_NUMBER = process.env.TWILIO_PHONE_NUMBER;

const SMS_TEMPLATES = {
    high_value_order: (data) =>
        `ECommerce: Order #${data.orderId.slice(0, 8)} for $${data.total} confirmed.`,
    order_shipped: (data) =>
        `ECommerce: Order #${data.orderId.slice(0, 8)} has shipped!`,
    totp_code: (data) =>
        `Your ECommerce verification code: ${data.code}. Expires in 5 minutes.`
};

async function sendSMS(event) {
    const template = SMS_TEMPLATES[event.type];
    if (!template) throw new Error(`Unknown SMS template: ${event.type}`);

    const body = template(event);

    const message = await client.messages.create({
        body,
        from: FROM_NUMBER,
        to: event.phone
    });

    console.log(`SMS sent to ${event.phone} [${event.type}] SID: ${message.sid}`);
    await logNotification(event.orderId, 'sms', 'sent', event.phone, event.type);
}

async function start() {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    const channel = await connection.createChannel();
    await channel.prefetch(3);

    console.log(`SMS worker listening on ${QUEUE}`);

    channel.consume(QUEUE, async (msg) => {
        if (!msg) return;

        const event = JSON.parse(msg.content.toString());
        const retryCount = (msg.properties.headers && msg.properties.headers['x-retry-count']) || 0;

        try {
            await sendSMS(event);
            channel.ack(msg);
        } catch (err) {
            console.error(`SMS failed [attempt ${retryCount + 1}/${MAX_RETRIES}]:`, err.message);
            await logNotification(event.orderId, 'sms', 'failed', event.phone || 'unknown', event.type, err.message);

            if (retryCount < MAX_RETRIES - 1) {
                channel.publish('order.events', msg.fields.routingKey, msg.content, {
                    persistent: true,
                    headers: { 'x-retry-count': retryCount + 1 }
                });
                channel.ack(msg);
            } else {
                console.error(`Moving to DLQ: ${event.orderId}`);
                channel.nack(msg, false, false);
            }
        }
    });

    connection.on('close', () => {
        console.error('RabbitMQ connection lost, exiting...');
        process.exit(1);
    });
}

start().catch(err => {
    console.error('SMS worker failed to start:', err.message);
    process.exit(1);
});
