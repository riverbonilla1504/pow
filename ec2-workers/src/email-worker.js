require('dotenv').config();
const amqp = require('amqplib');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

const QUEUE = 'q.notify.email';
const MAX_RETRIES = 3;

const ses = new SESClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const EMAIL_TEMPLATES = {
    order_created: (data) => ({
        subject: `Order Confirmed - #${data.orderId.slice(0, 8)}`,
        html: `<h2>Order Confirmed!</h2>
               <p>Your order for <strong>$${data.total}</strong> has been received.</p>
               <p>Order ID: <code>${data.orderId}</code></p>
               <p>Status: ${data.status}</p>
               <p>We'll notify you when it ships.</p>`,
        text: `Order Confirmed! Your order for $${data.total} has been received. Order ID: ${data.orderId}`
    }),
    order_shipped: (data) => ({
        subject: `Order Shipped - #${data.orderId.slice(0, 8)}`,
        html: `<h2>Your Order Has Shipped!</h2>
               <p>Order ID: <code>${data.orderId}</code></p>
               <p>Your package is on its way.</p>`,
        text: `Your order #${data.orderId} has shipped!`
    }),
    order_returned: (data) => ({
        subject: `Return Processed - #${data.orderId.slice(0, 8)}`,
        html: `<h2>Return Processed</h2>
               <p>Order ID: <code>${data.orderId}</code></p>
               <p>Your return has been processed. Refund will appear in 3-5 business days.</p>`,
        text: `Return processed for order #${data.orderId}. Refund in 3-5 business days.`
    })
};

async function sendEmail(event) {
    const template = EMAIL_TEMPLATES[event.type];
    if (!template) throw new Error(`Unknown email template: ${event.type}`);

    const { subject, html, text } = template(event);

    await ses.send(new SendEmailCommand({
        Source: process.env.SES_FROM_EMAIL,
        Destination: { ToAddresses: [event.email] },
        Message: {
            Subject: { Data: subject, Charset: 'UTF-8' },
            Body: {
                Html: { Data: html, Charset: 'UTF-8' },
                Text: { Data: text, Charset: 'UTF-8' }
            }
        }
    }));

    console.log(`Email sent to ${event.email} [${event.type}]`);
}

async function start() {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    const channel = await connection.createChannel();
    await channel.prefetch(5);

    console.log(`Email worker listening on ${QUEUE}`);

    channel.consume(QUEUE, async (msg) => {
        if (!msg) return;

        const event = JSON.parse(msg.content.toString());
        const retryCount = (msg.properties.headers && msg.properties.headers['x-retry-count']) || 0;

        try {
            await sendEmail(event);
            channel.ack(msg);
        } catch (err) {
            console.error(`Email failed [attempt ${retryCount + 1}/${MAX_RETRIES}]:`, err.message);

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
    console.error('Email worker failed to start:', err.message);
    process.exit(1);
});
