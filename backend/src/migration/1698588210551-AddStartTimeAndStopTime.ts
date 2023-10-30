import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStartTimeAndStopTime1698588210551 implements MigrationInterface {
  name = "AddStartTimeAndStopTime1698588210551";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "file" ADD "startTime" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "file" ADD "stopTime" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "regular_file" ADD "startTime" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "regular_file" ADD "stopTime" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "model_file" ADD "startTime" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "model_file" ADD "stopTime" TIMESTAMP`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "model_file" DROP COLUMN "stopTime"`);
    await queryRunner.query(`ALTER TABLE "model_file" DROP COLUMN "startTime"`);
    await queryRunner.query(`ALTER TABLE "regular_file" DROP COLUMN "stopTime"`);
    await queryRunner.query(`ALTER TABLE "regular_file" DROP COLUMN "startTime"`);
    await queryRunner.query(`ALTER TABLE "file" DROP COLUMN "stopTime"`);
    await queryRunner.query(`ALTER TABLE "file" DROP COLUMN "startTime"`);
  }
}
