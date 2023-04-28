import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInstrumentUploadTags1682326134183 implements MigrationInterface {
  name = "AddInstrumentUploadTags1682326134183";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "instrument_upload" ADD "tags" text array NOT NULL DEFAULT '{}'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "instrument_upload" DROP COLUMN "tags"`);
  }
}
