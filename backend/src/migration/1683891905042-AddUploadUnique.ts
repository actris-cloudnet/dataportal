import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUploadUnique1683891905042 implements MigrationInterface {
  name = "AddUploadUnique1683891905042";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "model_upload" DROP CONSTRAINT "UQ_7d1baf638db4876c37aa6025265"`);
    await queryRunner.query(
      `ALTER TABLE "instrument_upload" ADD CONSTRAINT "UQ_abb4868d0f18e26cad6d663f113" UNIQUE ("siteId", "measurementDate", "filename", "instrumentId", "instrumentPid", "tags")`,
    );
    await queryRunner.query(
      `ALTER TABLE "model_upload" ADD CONSTRAINT "UQ_77b3933c927daa8dcb6534d3ca7" UNIQUE ("siteId", "measurementDate", "filename", "modelId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "model_upload" DROP CONSTRAINT "UQ_77b3933c927daa8dcb6534d3ca7"`);
    await queryRunner.query(`ALTER TABLE "instrument_upload" DROP CONSTRAINT "UQ_abb4868d0f18e26cad6d663f113"`);
    await queryRunner.query(
      `ALTER TABLE "model_upload" ADD CONSTRAINT "UQ_7d1baf638db4876c37aa6025265" UNIQUE ("filename")`,
    );
  }
}
