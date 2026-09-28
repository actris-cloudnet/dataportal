import { MigrationInterface, QueryRunner } from "typeorm";

export class InstrumentUploadIndex1790588757025 implements MigrationInterface {
  name = "InstrumentUploadIndex1790588757025";
  transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_49b54c339e3867525f9dd99ceb"`);
    await queryRunner.query(
      `CREATE INDEX CONCURRENTLY "IDX_4315d9fef74475b0857d8ef4fd" ON "instrument_upload" ("instrumentInfoUuid", "measurementDate") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_4315d9fef74475b0857d8ef4fd"`);
    await queryRunner.query(
      `CREATE INDEX CONCURRENTLY "IDX_49b54c339e3867525f9dd99ceb" ON "instrument_upload" ("instrumentInfoUuid", "siteId", "measurementDate") `,
    );
  }
}
