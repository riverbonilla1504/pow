#!/bin/bash
# Despliegue RabbitMQ con Docker (alternativa a setup.sh con apt)
# Ejecutar en ec2-rabbitmq después de configurar .env

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ ! -f .env ]; then
  echo "ERROR: Crea .env desde .env.example"
  exit 1
fi

echo "=== Instalando Docker (si falta) ==="
if ! command -v docker &>/dev/null; then
  sudo apt update
  sudo apt install -y docker.io docker-compose-v2
  sudo usermod -aG docker ubuntu
  echo "Nota: cierra sesión SSH y vuelve a entrar para usar docker sin sudo"
fi

echo "=== Deteniendo RabbitMQ nativo (si está activo) ==="
if systemctl is-active --quiet rabbitmq-server 2>/dev/null; then
  echo "ADVERTENCIA: rabbitmq-server systemd está activo."
  echo "Detén API/workers antes de continuar, luego:"
  echo "  sudo systemctl stop rabbitmq-server && sudo systemctl disable rabbitmq-server"
  read -r -p "¿Detener rabbitmq-server ahora? [y/N] " ans
  if [[ "${ans,,}" == "y" ]]; then
    sudo systemctl stop rabbitmq-server
    sudo systemctl disable rabbitmq-server
  else
    echo "Abortado."
    exit 1
  fi
fi

echo "=== Levantando contenedor ==="
sudo docker compose --env-file .env up -d

echo "=== Esperando healthcheck ==="
sleep 15
sudo docker compose ps

echo "=== Aplicar nftables del repo ==="
sudo cp "$SCRIPT_DIR/nftables.conf" /etc/nftables.conf
sudo systemctl restart nftables

echo "=== Listo ==="
echo "AMQP: amqp://\${RABBITMQ_USER}@10.0.2.234:5672 (ajusta bind en compose si expones en 0.0.0.0)"
echo "Management: http://10.0.2.234:15672 (solo accesible desde IPs permitidas en nftables)"
