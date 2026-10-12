import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Makes the `messages` table itself the outbound delivery queue.
 *
 * Outbound rows are written with status 'queued' and then attempted inline.
 * Serverless hosts cannot run a long-lived BullMQ worker, so retries are
 * driven from these columns instead: attempts count, lastError records why,
 * and nextAttemptAt gates when a drain is allowed to pick the row up again.
 */
export class OutboundDeliveryQueue1700000000002 implements MigrationInterface {
  name = "OutboundDeliveryQueue1700000000002";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "messages"
        ADD COLUMN IF NOT EXISTS "deliveryAttempts" integer NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "deliveryError" text,
        ADD COLUMN IF NOT EXISTS "nextAttemptAt" timestamptz;
    `);
    // Drain queries filter on (direction, status, nextAttemptAt).
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_pending_delivery
        ON messages ("direction", "status", "nextAttemptAt")
        WHERE "direction" = 'outbound' AND "status" = 'queued';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_messages_pending_delivery;`);
    await queryRunner.query(`
      ALTER TABLE "messages"
        DROP COLUMN IF EXISTS "deliveryAttempts",
        DROP COLUMN IF EXISTS "deliveryError",
        DROP COLUMN IF EXISTS "nextAttemptAt";
    `);
  }
}