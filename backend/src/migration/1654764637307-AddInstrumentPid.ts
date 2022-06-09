import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInstrumentPid1654764637307 implements MigrationInterface {
  name = "AddInstrumentPid1654764637307";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "instrument_upload" ADD "instrumentPid" text`);
    await queryRunner.query(`ALTER TABLE "misc_upload" ADD "instrumentPid" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "misc_upload" DROP COLUMN "instrumentPid"`);
    await queryRunner.query(`ALTER TABLE "instrument_upload" DROP COLUMN "instrumentPid"`);
  }
}
