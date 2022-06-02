import { MigrationInterface, QueryRunner } from "typeorm";

export class AddHumanReadableNameToInstruments1601540932396 implements MigrationInterface {
  name = "AddHumanReadableNameToInstruments1601540932396";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "instrument" ADD "humanReadableName" character varying NOT NULL DEFAULT ''`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "instrument" DROP COLUMN "humanReadableName"`);
  }
}
