-- notification_logs: tabla usada por workers (INSERT) y API admin (SELECT)
-- Ejecutar como postgres: sudo -u postgres psql ecommerce -f 002_notification_logs_grants.sql

CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID,
    type VARCHAR(10) NOT NULL CHECK (type IN ('email', 'sms')),
    status VARCHAR(10) NOT NULL CHECK (status IN ('sent', 'failed')),
    recipient VARCHAR(255) NOT NULL,
    template VARCHAR(50),
    error_msg TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notif_logs_created ON notification_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_logs_order ON notification_logs(order_id);

GRANT SELECT, INSERT, UPDATE ON notification_logs TO appuser;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO appuser;
