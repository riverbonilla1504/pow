# Pendientes

## 1. PM2 startup en ec2-api-orders

La instancia `10.0.2.160` no tiene PM2 configurado para arrancar en reboot. Si la VM reinicia, la API no levanta sola.

SSH a la instancia y ejecutar:
```bash
NODE_DIR=$(dirname $(which node))
sudo env PATH=$PATH:$NODE_DIR pm2 startup systemd -u ubuntu --hp /home/ubuntu
pm2 save
```

## 2. Limpiar user data scripts de las instancias

Durante la recuperación por nftables se pusieron scripts en el user data de las 4 instancias privadas. Hay que borrarlos para que no se ejecuten en un futuro reboot.

En la consola AWS → EC2 → cada instancia → Actions → Instance settings → Edit user data → borrar contenido → guardar.

Instancias a limpiar:
- `i-0df63276ce533d15f` (api-orders)
- `i-0c13a0092bdd8548d` (rabbitmq)
- `i-04b2ffc83d459a64f` (workers)
- `i-0b3cef562ac43accc` (database)

## 3. Verificar y probar SMS

El `sms-worker` está corriendo y conectado a RabbitMQ pero no se ha probado end-to-end. AWS SNS en sandbox solo puede enviar a números verificados.

Pasos:
1. En la consola AWS → SNS → Text messaging (SMS) → Sandbox destination phone numbers → agregar el número
2. Crear una orden con `total > 500` y campo `phone` en el body para disparar el routing key `order.created.sms`
3. Revisar logs: `pm2 logs sms-worker --lines 30`

## 4. Corregir deploy.sh

El archivo `deploy.sh` tiene una URL placeholder:
```bash
REPO_URL="git@github.com:YOUR_USER/ecommerce-notifications.git"
```
Cambiar a:
```bash
REPO_URL="git@github.com:riverbonilla1504/pow.git"
```

## 5. Dashboard Next.js (diferido)

Panel de administración para visualizar órdenes, estado de notificaciones, mensajes en el DLQ y métricas del sistema. Quedó explícitamente para después.
