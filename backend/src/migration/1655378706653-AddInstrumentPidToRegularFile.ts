import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInstrumentPidToRegularFile1655378706653 implements MigrationInterface {
  name = "AddInstrumentPidToRegularFile1655378706653";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "regular_file" ADD "instrumentPid" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "regular_file" DROP COLUMN "instrumentPid"`);
  }
}
