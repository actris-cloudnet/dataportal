import { MigrationInterface, QueryRunner } from "typeorm";

export class UploadInstrumentPidNotNull1700730365384 implements MigrationInterface {
  name = "UploadInstrumentPidNotNull1700730365384";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "instrument_upload" DROP CONSTRAINT "UQ_abb4868d0f18e26cad6d663f113"`);
    await queryRunner.query(`ALTER TABLE "instrument_upload" ALTER COLUMN "instrumentPid" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "instrument_upload" ADD CONSTRAINT "UQ_abb4868d0f18e26cad6d663f113" UNIQUE ("siteId", "measurementDate", "filename", "instrumentId", "instrumentPid", "tags")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "instrument_upload" DROP CONSTRAINT "UQ_abb4868d0f18e26cad6d663f113"`);
    await queryRunner.query(`ALTER TABLE "instrument_upload" ALTER COLUMN "instrumentPid" DROP NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "instrument_upload" ADD CONSTRAINT "UQ_abb4868d0f18e26cad6d663f113" UNIQUE ("filename", "measurementDate", "siteId", "instrumentId", "instrumentPid", "tags")`,
    );
  }
}
