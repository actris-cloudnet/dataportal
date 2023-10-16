import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeDvasIdToText1696591206970 implements MigrationInterface {
  name = "ChangeDvasIdToText1696591206970";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "site" DROP COLUMN "dvasId"`);
    await queryRunner.query(`ALTER TABLE "site" ADD "dvasId" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "site" DROP COLUMN "dvasId"`);
    await queryRunner.query(`ALTER TABLE "site" ADD "dvasId" character(3)`);
  }
}
