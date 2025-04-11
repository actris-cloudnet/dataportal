import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveInstrumentPidFromRegularFile1744185397017 implements MigrationInterface {
  name = "RemoveInstrumentPidFromRegularFile1744185397017";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "regular_file" DROP COLUMN "instrumentPid"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "regular_file" ADD "instrumentPid" character varying`);
  }
}
