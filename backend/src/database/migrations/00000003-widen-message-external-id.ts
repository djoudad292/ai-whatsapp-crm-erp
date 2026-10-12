import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Widens messages.externalId to hold real WhatsApp Cloud API message ids.
 *
 * A wamid looks like
 * "wamid.HBgNNTUxMTk5OTk2OTM0QUJDREVCM0E5RTNCQ..." and runs past 60
 * characters, so the original varchar(40) truncated — or rejected — the id the
 * moment outbound delivery started storing it.
 */
export class WidenMessageExternalId1700000000003 implements MigrationInterface {
  name = "WidenMessageExternalId1700000000003";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "messages"
        ALTER COLUMN "externalId" TYPE character varying(160);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "messages"
        ALTER COLUMN "externalId" TYPE character varying(40);
    `);
  }
}