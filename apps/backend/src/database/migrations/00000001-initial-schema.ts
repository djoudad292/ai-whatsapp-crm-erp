import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1700000000000 implements MigrationInterface {
  name = "InitialSchema1700000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar(200) NOT NULL,
        phone varchar(30) NOT NULL UNIQUE,
        email varchar(255),
        type varchar(20) NOT NULL,
        "odooId" integer UNIQUE,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_customers_odoo_id ON customers ("odooId");

      CREATE TABLE IF NOT EXISTS products (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar(120) NOT NULL,
        sku varchar(60) NOT NULL UNIQUE,
        description text,
        price numeric(12,2) NOT NULL DEFAULT 0,
        "stockQuantity" integer NOT NULL DEFAULT 0,
        "isActive" boolean NOT NULL DEFAULT true,
        "odooId" integer UNIQUE,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_products_odoo_id ON products ("odooId");

      CREATE TABLE IF NOT EXISTS orders (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "orderNumber" varchar(40) NOT NULL UNIQUE,
        "customerId" uuid NOT NULL,
        status varchar(30) NOT NULL DEFAULT 'pending',
        "odooId" integer,
        total numeric(12,2) NOT NULL DEFAULT 0,
        currency varchar(20) NOT NULL DEFAULT 'USD',
        notes text,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_orders_customer FOREIGN KEY ("customerId") REFERENCES customers(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders ("customerId");
      CREATE INDEX IF NOT EXISTS idx_orders_odoo_id ON orders ("odooId");

      CREATE TABLE IF NOT EXISTS order_items (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "orderId" uuid NOT NULL,
        "productId" uuid NOT NULL,
        quantity integer NOT NULL,
        "unitPrice" numeric(12,2) NOT NULL,
        "lineTotal" numeric(12,2) NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_order_items_order FOREIGN KEY ("orderId") REFERENCES orders(id) ON DELETE CASCADE,
        CONSTRAINT fk_order_items_product FOREIGN KEY ("productId") REFERENCES products(id) ON DELETE RESTRICT
      );

      CREATE TABLE IF NOT EXISTS conversations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "externalId" varchar(60) NOT NULL UNIQUE,
        channel varchar(20) NOT NULL,
        "customerId" uuid,
        status varchar(20) NOT NULL DEFAULT 'open',
        summary varchar(200),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_conversations_customer FOREIGN KEY ("customerId") REFERENCES customers(id) ON DELETE SET NULL
      );
      CREATE INDEX IF NOT EXISTS idx_conversations_customer_id ON conversations ("customerId");

      CREATE TABLE IF NOT EXISTS messages (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "conversationId" uuid NOT NULL,
        direction varchar(20) NOT NULL,
        "externalId" varchar(40) UNIQUE,
        status varchar(20) NOT NULL,
        body text NOT NULL,
        metadata jsonb,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_messages_conversation FOREIGN KEY ("conversationId") REFERENCES conversations(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_messages_external_id ON messages ("externalId");
      CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages ("conversationId");

      CREATE TABLE IF NOT EXISTS integration_events (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        entity varchar(40) NOT NULL,
        "odooId" integer,
        operation varchar(20) NOT NULL,
        payload jsonb NOT NULL,
        status varchar(20) NOT NULL DEFAULT 'pending',
        attempts integer NOT NULL DEFAULT 0,
        "lastError" text,
        "nextAttemptAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_integration_events_status ON integration_events (status);
      CREATE INDEX IF NOT EXISTS idx_integration_events_odoo_id ON integration_events ("odooId");

      CREATE TABLE IF NOT EXISTS webhook_events (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        source varchar(20) NOT NULL,
        "externalEventId" varchar(120) NOT NULL,
        "eventType" varchar(80),
        payload jsonb NOT NULL,
        status varchar(20) NOT NULL DEFAULT 'received',
        "lastError" text,
        "receivedAt" timestamptz NOT NULL DEFAULT now()
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_webhook_events_dedup
        ON webhook_events (source, "externalEventId");

      CREATE TABLE IF NOT EXISTS approval_requests (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "orderId" uuid NOT NULL,
        type varchar(20) NOT NULL,
        reason text,
        amount numeric(12,2),
        status varchar(20) NOT NULL DEFAULT 'pending',
        "approvedBy" uuid,
        "approvedAt" timestamptz,
        "expiresAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_approval_requests_order FOREIGN KEY ("orderId") REFERENCES orders(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON approval_requests (status);

      CREATE TABLE IF NOT EXISTS audit_logs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        action varchar(20) NOT NULL,
        entity varchar(30) NOT NULL,
        "entityId" varchar(40),
        actor varchar(60),
        before jsonb,
        after jsonb,
        "correlationId" varchar(60),
        note text,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs (entity, "entityId");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS audit_logs;
      DROP TABLE IF EXISTS approval_requests;
      DROP TABLE IF EXISTS webhook_events;
      DROP TABLE IF EXISTS integration_events;
      DROP TABLE IF EXISTS messages;
      DROP TABLE IF EXISTS conversations;
      DROP TABLE IF EXISTS order_items;
      DROP TABLE IF EXISTS orders;
      DROP TABLE IF EXISTS products;
      DROP TABLE IF EXISTS customers;
    `);
  }
}