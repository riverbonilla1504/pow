// Importa la librería amqplib para comunicarse con RabbitMQ via AMQP
const amqp = require('amqplib');

// Variable global para almacenar el canal de RabbitMQ
let channel = null;
// Variable global para almacenar la conexión a RabbitMQ
let connection = null;

// Nombre del exchange principal de tipo topic para eventos de órdenes
const EXCHANGE = 'order.events';
// Nombre del exchange dead-letter de tipo fanout para mensajes fallidos
const DLX_EXCHANGE = 'dlx.exchange';

// Función asíncrona que establece conexión con RabbitMQ y declara la topología
async function connectRabbitMQ() {
    // Conecta al broker RabbitMQ usando la URL del .env (ej: amqp://10.0.2.234)
    connection = await amqp.connect(process.env.RABBITMQ_URL);
    // Crea un canal de comunicación sobre la conexión
    channel = await connection.createChannel();

    // Declara el exchange principal de tipo topic (ruteo por patrones de routing key)
    await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
    // Declara el exchange dead-letter de tipo fanout (envía a todas las colas enlazadas)
    await channel.assertExchange(DLX_EXCHANGE, 'fanout', { durable: true });

    // Declara la cola de notificaciones por email con DLX y TTL de 30 segundos
    await channel.assertQueue('q.notify.email', {
        durable: true,                                  // La cola sobrevive reinicios del broker
        arguments: {
            'x-dead-letter-exchange': DLX_EXCHANGE,     // Mensajes rechazados van al DLX
            'x-message-ttl': 30000                      // Mensajes expiran después de 30 segundos
        }
    });

    // Declara la cola de notificaciones por SMS con la misma configuración de DLX y TTL
    await channel.assertQueue('q.notify.sms', {
        durable: true,                                  // La cola sobrevive reinicios del broker
        arguments: {
            'x-dead-letter-exchange': DLX_EXCHANGE,     // Mensajes rechazados van al DLX
            'x-message-ttl': 30000                      // Mensajes expiran después de 30 segundos
        }
    });

    // Declara la cola dead-letter donde llegan los mensajes que fallaron 3 veces
    await channel.assertQueue('q.dead.letter', { durable: true });

    // Enlaza la cola de email al exchange para recibir eventos de orden creada
    await channel.bindQueue('q.notify.email', EXCHANGE, 'order.created.email');
    // Enlaza la cola de email al exchange para recibir eventos de orden enviada
    await channel.bindQueue('q.notify.email', EXCHANGE, 'order.shipped.email');
    // Enlaza la cola de email al exchange para recibir eventos de orden devuelta
    await channel.bindQueue('q.notify.email', EXCHANGE, 'order.returned.email');
    // Enlaza la cola de SMS al exchange para recibir cualquier evento SMS (wildcard *)
    await channel.bindQueue('q.notify.sms', EXCHANGE, 'order.*.sms');
    // Enlaza la cola dead-letter al exchange DLX (fanout no necesita routing key)
    await channel.bindQueue('q.dead.letter', DLX_EXCHANGE, '');

    // Configura reconexión automática cuando se cierra la conexión
    connection.on('close', () => {
        // Avisa en consola que se perdió la conexión
        console.error('RabbitMQ connection closed, reconnecting...');
        // Reintenta conectar después de 5 segundos
        setTimeout(connectRabbitMQ, 5000);
    });
}

// Publica un evento en el exchange principal con una routing key específica
function publishEvent(routingKey, payload) {
    // Verifica que el canal esté inicializado antes de publicar
    if (!channel) throw new Error('RabbitMQ not connected');

    // Publica el mensaje serializado como JSON en el exchange con la routing key
    channel.publish(EXCHANGE, routingKey, Buffer.from(JSON.stringify(payload)), {
        persistent: true,                               // El mensaje sobrevive reinicios del broker
        contentType: 'application/json',                 // Indica que el contenido es JSON
        timestamp: Date.now()                            // Marca de tiempo Unix en milisegundos
    });
}

// Retorna el canal actual de RabbitMQ (usado por las rutas admin para leer la DLQ)
function getChannel() {
    return channel;
}

// Exporta las tres funciones: conectar, publicar eventos, y obtener el canal
module.exports = { connectRabbitMQ, publishEvent, getChannel };
