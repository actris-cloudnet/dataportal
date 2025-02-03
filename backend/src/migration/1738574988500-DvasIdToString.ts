import { MigrationInterface, QueryRunner } from "typeorm";

export class DvasIdToString1738574988500 implements MigrationInterface {
  name = "DvasIdToString1738574988500";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "regular_file" DROP COLUMN "dvasId"`);
    await queryRunner.query(`ALTER TABLE "regular_file" ADD "dvasId" character varying`);
    await queryRunner.query(`ALTER TABLE "model_file" DROP COLUMN "dvasId"`);
    await queryRunner.query(`ALTER TABLE "model_file" ADD "dvasId" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "model_file" DROP COLUMN "dvasId"`);
    await queryRunner.query(`ALTER TABLE "model_file" ADD "dvasId" bigint`);
    await queryRunner.query(`ALTER TABLE "regular_file" DROP COLUMN "dvasId"`);
    await queryRunner.query(`ALTER TABLE "regular_file" ADD "dvasId" bigint`);
  }
}
