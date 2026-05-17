# ec2-database — PostgreSQL 16

## Firewall (nftables)

| Origen | Puerto | Motivo |
|--------|--------|--------|
| `10.0.1.192` | 22 | SSH (bastion) |
| `10.0.2.160` | 5432 | API de órdenes |
| `10.0.2.250` | 5432 | Workers (`notification_logs`) |

Aplicar:

```bash
sudo cp /home/ubuntu/pow/ec2-database/nftables.conf /etc/nftables.conf
sudo sed -i 's/\r$//' /etc/nftables.conf   # si se copió desde Windows
sudo systemctl restart nftables
```

## AWS Security Group

Grupo: `sg-0822951fc201e0d09` (`sg database`)

Ingress PostgreSQL (5432):

- `10.0.2.160/32` — API
- `10.0.2.250/32` — workers (`ec2-workers notification_logs`)

Los security groups de AWS se evalúan **antes** que nftables en la instancia; ambas capas deben permitir el tráfico.
