import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDvasId1699346726500 implements MigrationInterface {
  name = "AddDvasId1699346726500";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "file" ADD "dvasId" bigint`);
    await queryRunner.query(`ALTER TABLE "regular_file" ADD "dvasId" bigint`);
    await queryRunner.query(`ALTER TABLE "model_file" ADD "dvasId" bigint`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "model_file" DROP COLUMN "dvasId"`);
    await queryRunner.query(`ALTER TABLE "regular_file" DROP COLUMN "dvasId"`);
    await queryRunner.query(`ALTER TABLE "file" DROP COLUMN "dvasId"`);
  }
}
