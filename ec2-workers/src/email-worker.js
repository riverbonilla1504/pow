// Carga las variables de entorno desde el archivo .env
require('dotenv').config();
// Importa amqplib para conectarse a RabbitMQ y consumir mensajes
const amqp = require('amqplib');
// Importa el cliente SES y el comando SendEmail del SDK de AWS v3
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
// Importa la función para registrar logs de notificaciones en PostgreSQL
const { logNotification } = require('./db');

// Nombre de la cola de RabbitMQ que este worker consume
const QUEUE = 'q.notify.email';
// Número máximo de reintentos antes de enviar el mensaje a la DLQ
const MAX_RETRIES = 3;

// Crea el cliente de AWS SES con la región y credenciales desde variables de entorno
const ses = new SESClient({
    region: process.env.AWS_REGION || 'us-east-1',       // Región de AWS donde está configurado SES
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,       // Access Key del usuario IAM
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY // Secret Key del usuario IAM
    }
});

// Templates de email para cada tipo de evento de orden
const EMAIL_TEMPLATES = {
    // Template para cuando se crea una orden nueva
    order_created: (data) => ({
        subject: `Order Confirmed - #${data.orderId.slice(0, 8)}`,   // Asunto con ID parcial de la orden
        html: `<h2>Order Confirmed!</h2>
               <p>Your order for <strong>$${data.total}</strong> has been received.</p>
               <p>Order ID: <code>${data.orderId}</code></p>
               <p>Status: ${data.status}</p>
               <p>We'll notify you when it ships.</p>`,              // Cuerpo HTML del email
        text: `Order Confirmed! Your order for $${data.total} has been received. Order ID: ${data.orderId}`
        // Versión texto plano como fallback para clientes que no soportan HTML
    }),
    // Template para cuando una orden es enviada
    order_shipped: (data) => ({
        subject: `Order Shipped - #${data.orderId.slice(0, 8)}`,     // Asunto con ID parcial
        html: `<h2>Your Order Has Shipped!</h2>
               <p>Order ID: <code>${data.orderId}</code></p>
               <p>Your package is on its way.</p>`,                  // Cuerpo HTML
        text: `Your order #${data.orderId} has shipped!`             // Versión texto plano
    }),
    // Template para cuando una orden es devuelta/reembolsada
    order_returned: (data) => ({
        subject: `Return Processed - #${data.orderId.slice(0, 8)}`,  // Asunto con ID parcial
        html: `<h2>Return Processed</h2>
               <p>Order ID: <code>${data.orderId}</code></p>
               <p>Your return has been processed. Refund will appear in 3-5 business days.</p>`,
        text: `Return processed for order #${data.orderId}. Refund in 3-5 business days.`
    })
};

// Función que envía un email usando AWS SES basándose en el tipo de evento
async function sendEmail(event) {
    // Selecciona el template según el tipo de evento (order_created, order_shipped, etc.)
    const template = EMAIL_TEMPLATES[event.type];
    // Si no existe un template para este tipo, lanza error
    if (!template) throw new Error(`Unknown email template: ${event.type}`);

    // Genera el subject, html y text usando el template y los datos del evento
    const { subject, html, text } = template(event);

    // Envía el email usando el comando SendEmail de AWS SES
    await ses.send(new SendEmailCommand({
        Source: process.env.SES_FROM_EMAIL,                // Remitente: noreply@freck.lat
        Destination: { ToAddresses: [event.email] },       // Destinatario: email del usuario
        Message: {
            Subject: { Data: subject, Charset: 'UTF-8' },  // Asunto del email en UTF-8
            Body: {
                Html: { Data: html, Charset: 'UTF-8' },    // Cuerpo HTML del email
                Text: { Data: text, Charset: 'UTF-8' }     // Cuerpo texto plano del email
            }
        }
    }));

    // Confirma en consola que el email fue enviado exitosamente
    console.log(`Email sent to ${event.email} [${event.type}]`);
    // Registra el envío exitoso en la tabla notification_logs
    await logNotification(event.orderId, 'email', 'sent', event.email, event.type);
}

// Función principal que conecta a RabbitMQ y comienza a consumir mensajes
async function start() {
    // Establece conexión con el broker RabbitMQ
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    // Crea un canal de comunicación
    const channel = await connection.createChannel();
    // Configura prefetch a 5: procesa máximo 5 mensajes simultáneamente sin ack
    await channel.prefetch(5);

    // Confirma en consola que el worker está escuchando la cola
    console.log(`Email worker listening on ${QUEUE}`);

    // Comienza a consumir mensajes de la cola de email
    channel.consume(QUEUE, async (msg) => {
        // Si el mensaje es null (cola cancelada), ignora
        if (!msg) return;

        // Parsea el contenido del mensaje de Buffer a objeto JavaScript
        const event = JSON.parse(msg.content.toString());
        // Obtiene el contador de reintentos del header del mensaje (0 si es el primer intento)
        const retryCount = (msg.properties.headers && msg.properties.headers['x-retry-count']) || 0;

        try {
            // Intenta enviar el email
            await sendEmail(event);
            // Si fue exitoso, confirma el mensaje (ack) para que RabbitMQ lo elimine de la cola
            channel.ack(msg);
        } catch (err) {
            // Si falló, imprime el error con el número de intento
            console.error(`Email failed [attempt ${retryCount + 1}/${MAX_RETRIES}]:`, err.message);
            // Registra el fallo en la tabla notification_logs
            await logNotification(event.orderId, 'email', 'failed', event.email || 'unknown', event.type, err.message);

            // Si aún quedan reintentos disponibles
            if (retryCount < MAX_RETRIES - 1) {
                // Re-publica el mensaje en el exchange con un contador de reintentos incrementado
                channel.publish('order.events', msg.fields.routingKey, msg.content, {
                    persistent: true,                     // El mensaje sobrevive reinicios del broker
                    headers: { 'x-retry-count': retryCount + 1 } // Incrementa el contador de reintentos
                });
                // Confirma el mensaje original (ya se re-publicó con el nuevo header)
                channel.ack(msg);
            } else {
                // Si agotó los reintentos, imprime que se mueve a la DLQ
                console.error(`Moving to DLQ: ${event.orderId}`);
                // Rechaza el mensaje sin reencolar (nack con requeue=false), va a la DLQ vía DLX
                channel.nack(msg, false, false);
            }
        }
    });

    // Configura el handler para cuando se cierra la conexión con RabbitMQ
    connection.on('close', () => {
        // Avisa en consola que se perdió la conexión
        console.error('RabbitMQ connection lost, exiting...');
        // Termina el proceso con código de error (PM2 lo reiniciará automáticamente)
        process.exit(1);
    });
}

// Ejecuta la función principal y maneja errores fatales de arranque
start().catch(err => {
    // Imprime el error de arranque
    console.error('Email worker failed to start:', err.message);
    // Termina con código de error (PM2 lo reiniciará)
    process.exit(1);
});
