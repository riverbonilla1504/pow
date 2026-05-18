// Carga las variables de entorno desde el archivo .env
require('dotenv').config();
// Importa amqplib para conectarse a RabbitMQ y consumir mensajes
const amqp = require('amqplib');
// Importa el SDK de Twilio para enviar mensajes SMS
const twilio = require('twilio');
// Importa la función para registrar logs de notificaciones en PostgreSQL
const { logNotification } = require('./db');

// Nombre de la cola de RabbitMQ que este worker consume
const QUEUE = 'q.notify.sms';
// Número máximo de reintentos antes de enviar el mensaje a la DLQ
const MAX_RETRIES = 3;

// Crea el cliente de Twilio con las credenciales desde variables de entorno
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
// Número de teléfono de origen para enviar SMS (proporcionado por Twilio)
const FROM_NUMBER = process.env.TWILIO_PHONE_NUMBER;

// Templates de SMS para cada tipo de evento
const SMS_TEMPLATES = {
    // Template para órdenes de alto valor (total > $500)
    high_value_order: (data) =>
        `ECommerce: Order #${data.orderId.slice(0, 8)} for $${data.total} confirmed.`,
    // Template para cuando una orden es enviada
    order_shipped: (data) =>
        `ECommerce: Order #${data.orderId.slice(0, 8)} has shipped!`,
    // Template para códigos de verificación TOTP (no usado actualmente via cola)
    totp_code: (data) =>
        `Your ECommerce verification code: ${data.code}. Expires in 5 minutes.`
};

// Función que envía un SMS usando Twilio basándose en el tipo de evento
async function sendSMS(event) {
    // Selecciona el template según el tipo de evento
    const template = SMS_TEMPLATES[event.type];
    // Si no existe un template para este tipo, lanza error
    if (!template) throw new Error(`Unknown SMS template: ${event.type}`);

    // Genera el texto del SMS usando el template y los datos del evento
    const body = template(event);

    // Envía el SMS usando la API de Twilio
    const message = await client.messages.create({
        body,                                             // Texto del mensaje SMS
        from: FROM_NUMBER,                                // Número de origen (Twilio)
        to: event.phone                                   // Número de destino del usuario
    });

    // Confirma en consola que el SMS fue enviado con el SID de Twilio
    console.log(`SMS sent to ${event.phone} [${event.type}] SID: ${message.sid}`);
    // Registra el envío exitoso en la tabla notification_logs
    await logNotification(event.orderId, 'sms', 'sent', event.phone, event.type);
}

// Función principal que conecta a RabbitMQ y comienza a consumir mensajes
async function start() {
    // Establece conexión con el broker RabbitMQ
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    // Crea un canal de comunicación
    const channel = await connection.createChannel();
    // Configura prefetch a 3: procesa máximo 3 mensajes simultáneamente sin ack
    await channel.prefetch(3);

    // Confirma en consola que el worker está escuchando la cola
    console.log(`SMS worker listening on ${QUEUE}`);

    // Comienza a consumir mensajes de la cola de SMS
    channel.consume(QUEUE, async (msg) => {
        // Si el mensaje es null (cola cancelada), ignora
        if (!msg) return;

        // Parsea el contenido del mensaje de Buffer a objeto JavaScript
        const event = JSON.parse(msg.content.toString());
        // Obtiene el contador de reintentos del header del mensaje (0 si es el primer intento)
        const retryCount = (msg.properties.headers && msg.properties.headers['x-retry-count']) || 0;

        try {
            // Intenta enviar el SMS
            await sendSMS(event);
            // Si fue exitoso, confirma el mensaje (ack) para que RabbitMQ lo elimine de la cola
            channel.ack(msg);
        } catch (err) {
            // Si falló, imprime el error con el número de intento
            console.error(`SMS failed [attempt ${retryCount + 1}/${MAX_RETRIES}]:`, err.message);
            // Registra el fallo en la tabla notification_logs
            await logNotification(event.orderId, 'sms', 'failed', event.phone || 'unknown', event.type, err.message);

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
    console.error('SMS worker failed to start:', err.message);
    // Termina con código de error (PM2 lo reiniciará)
    process.exit(1);
});
