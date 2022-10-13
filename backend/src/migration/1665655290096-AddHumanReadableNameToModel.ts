import { MigrationInterface, QueryRunner } from "typeorm";

export class AddHumanReadableNameToModel1665655290096 implements MigrationInterface {
  name = "AddHumanReadableNameToModel1665655290096";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "model" ADD "humanReadableName" character varying NULL`);
    await queryRunner.query(`UPDATE "model" SET "humanReadableName" = "id"`);
    await queryRunner.query(`ALTER TABLE "model" ALTER COLUMN "humanReadableName" SET NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "model" DROP COLUMN "humanReadableName"`);
  }
}
