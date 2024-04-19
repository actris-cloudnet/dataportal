import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInstrumentUploadIndex1713521147757 implements MigrationInterface {
  name = "AddInstrumentUploadIndex1713521147757";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_49b54c339e3867525f9dd99ceb" ON "instrument_upload" ("instrumentInfoUuid", "siteId", "measurementDate") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_49b54c339e3867525f9dd99ceb"`);
  }
}
