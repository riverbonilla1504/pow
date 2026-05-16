#!/bin/bash
set -e

echo "=== Setting up RabbitMQ on ec2-rabbitmq ==="

sudo apt update
sudo apt install rabbitmq-server -y
sudo systemctl enable rabbitmq-server
sudo systemctl start rabbitmq-server

# Enable management plugin
sudo rabbitmq-plugins enable rabbitmq_management

# Create application user
sudo rabbitmqctl add_user ecommerce "${RABBITMQ_PASSWORD:-changeme}"
sudo rabbitmqctl set_permissions -p / ecommerce ".*" ".*" ".*"
sudo rabbitmqctl set_user_tags ecommerce administrator

# Remove default guest user
sudo rabbitmqctl delete_user guest

echo "=== RabbitMQ setup complete ==="
echo "Management UI: http://localhost:15672"
echo "AMQP port: 5672"
