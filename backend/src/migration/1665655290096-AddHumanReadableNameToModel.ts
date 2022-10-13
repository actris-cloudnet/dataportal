import { MigrationInterface, QueryRunner } from "typeorm";

export class AddHumanReadableNameToModel1665655290096 implements MigrationInterface {
  name = "AddHumanReadableNameToModel1665655290096";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "model" ADD "humanReadableName" character varying NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "model" DROP COLUMN "humanReadableName"`);
  }
}
