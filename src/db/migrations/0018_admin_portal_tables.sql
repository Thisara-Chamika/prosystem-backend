-- ══════════════════════════════════════════════════
-- Admin Portal — Support Tickets
-- ══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS support_tickets (
    ticket_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id      UUID NOT NULL REFERENCES shops(shop_id) ON DELETE CASCADE,
    raised_by    UUID NOT NULL REFERENCES users(user_id),
    subject      VARCHAR(255) NOT NULL,
    status       VARCHAR(20) NOT NULL DEFAULT 'open'
                 CHECK (status IN ('open','in_progress','resolved','closed')),
    created_at   TIMESTAMP DEFAULT NOW(),
    updated_at   TIMESTAMP DEFAULT NOW()
);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY shop_isolation ON support_tickets
  USING (
    shop_id::text = current_setting('app.current_shop_id', true)
    OR current_setting('app.current_role', true) = 'super_admin'
  );

CREATE TABLE IF NOT EXISTS support_ticket_messages (
    message_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id    UUID NOT NULL REFERENCES support_tickets(ticket_id) ON DELETE CASCADE,
    shop_id      UUID NOT NULL REFERENCES shops(shop_id) ON DELETE CASCADE,
    sender_id    UUID NOT NULL REFERENCES users(user_id),
    sender_type  VARCHAR(10) NOT NULL CHECK (sender_type IN ('shop','admin')),
    message      TEXT NOT NULL,
    created_at   TIMESTAMP DEFAULT NOW()
);

ALTER TABLE support_ticket_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY shop_isolation ON support_ticket_messages
  USING (
    shop_id::text = current_setting('app.current_shop_id', true)
    OR current_setting('app.current_role', true) = 'super_admin'
  );

CREATE INDEX IF NOT EXISTS idx_support_tickets_shop_id ON support_tickets(shop_id);
CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket_id ON support_ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_shop_id ON support_ticket_messages(shop_id);