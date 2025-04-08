import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCoverage1744099439286 implements MigrationInterface {
  name = "AddCoverage1744099439286";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "regular_file" ADD "coverage" real`);
    await queryRunner.query(`ALTER TABLE "model_file" ADD "coverage" real`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "model_file" DROP COLUMN "coverage"`);
    await queryRunner.query(`ALTER TABLE "regular_file" DROP COLUMN "coverage"`);
  }
}
