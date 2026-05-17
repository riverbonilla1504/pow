# ec2-rabbitmq — Despliegue y configuración

## Estado actual en producción (auditoría Mayo 2026)

| Aspecto | Valor en `10.0.2.234` |
|---------|------------------------|
| Método de despliegue | **Paquete Ubuntu** (`apt install rabbitmq-server`), **no Docker** |
| Servicio | `rabbitmq-server.service` (systemd, `active`) |
| Versión | RabbitMQ **4.0.5** (Erlang/OTP 27) |
| Docker | No instalado; `docker ps` vacío |
| Script usado | [`setup.sh`](setup.sh) del repositorio |
| Plugins | `rabbitmq_management` |
| Usuario app | `ecommerce` (tag `administrator`) |
| Usuario `guest` | Eliminado |
| `rabbitmq.conf` | No existe (valores por defecto) |
| `rabbitmq-env.conf` | Solo comentarios (bind a todas las interfaces por defecto) |

### Colas y exchanges (creados por la API al arrancar)

La API (`ec2-api-orders/src/services/rabbitmq.js`) declara en cada conexión:

| Recurso | Tipo | Notas |
|---------|------|--------|
| `order.events` | topic, durable | Publicación de eventos de órdenes |
| `dlx.exchange` | fanout, durable | Dead-letter exchange |
| `q.notify.email` | queue + DLX + TTL 30s | Email |
| `q.notify.sms` | queue + DLX + TTL 30s | SMS |
| `q.dead.letter` | queue, durable | DLQ |

En el broker en vivo ya existen esos exchanges/colas (verificado con `rabbitmqctl`).

### Red y firewall

- AMQP `5672` y management `15672` **no** están expuestos a Internet.
- [`nftables.conf`](nftables.conf) en el servidor coincide con este repositorio:
  - SSH solo desde bastion `10.0.1.192`
  - `5672` solo desde API `10.0.2.160` y workers `10.0.2.250`
  - `15672` solo desde API `10.0.2.160`

### Conexión desde otros componentes

```
RABBITMQ_URL=amqp://ecommerce:<password>@10.0.2.234:5672
```

(API y workers en `.env` de cada instancia.)

---

## Despliegue actual (`setup.sh`)

```bash
sudo apt install rabbitmq-server -y
sudo systemctl enable --now rabbitmq-server
sudo rabbitmq-plugins enable rabbitmq_management
sudo rabbitmqctl add_user ecommerce "$RABBITMQ_PASSWORD"
sudo rabbitmqctl set_permissions -p / ecommerce ".*" ".*" ".*"
sudo rabbitmqctl delete_user guest
```

**Ventajas:** simple, pocos moving parts, ya funciona en producción.  
**Desventajas:** versión ligada al repo de Ubuntu; menos portable; configuración repartida entre `/etc/rabbitmq` y declaraciones en la API.

---

## Opción Docker (no desplegada aún)

Migrar a Docker permitiría versionar imagen, variables y volúmenes en el repo. Archivos preparados:

- [`docker-compose.yml`](docker-compose.yml) — RabbitMQ 3.13 con management plugin
- [`.env.example`](.env.example) — credenciales y puertos
- [`setup-docker.sh`](setup-docker.sh) — instalación de Docker + compose

### Si migráis a Docker (resumen de pasos)

1. **Ventana de mantenimiento** — API y workers dejan de publicar/consumir.
2. Exportar definiciones opcionales (`rabbitmqctl export_definitions`) si queréis conservar estado.
3. Detener `rabbitmq-server` nativo: `sudo systemctl stop rabbitmq-server && sudo systemctl disable rabbitmq-server`.
4. En la VM: `cd /home/ubuntu/pow/ec2-rabbitmq && cp .env.example .env && ./setup-docker.sh`.
5. Aplicar el mismo [`nftables.conf`](nftables.conf) (puertos 5672/15672 sin cambio).
6. Reiniciar API y workers; la API recrea exchanges/colas con `assertExchange` / `assertQueue`.
7. Probar flujo completo (orden → email/SMS → DLQ).

**Riesgos:** cambio de versión 4.0.5 (apt) → 3.13 (imagen); probar en staging primero si es posible. Persistencia: volumen Docker `rabbitmq_data`.

### Recomendación

| Escenario | Acción |
|-----------|--------|
| Entrega académica inminente, sistema estable | **Mantener apt/systemd**; documentar en el reporte. |
| Queréis IaC reproducible / mismos compose en local | **Planificar migración** con `docker-compose.yml` en un mantenimiento. |

No hay Docker en la máquina hoy; la migración es **opcional** y no se ha aplicado en producción.
