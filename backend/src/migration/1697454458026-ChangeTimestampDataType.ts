import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeTimestampDataType1697454458026 implements MigrationInterface {
  name = "ChangeTimestampDataType1697454458026";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "file" DROP COLUMN "dvasUpdatedAt"`);
    await queryRunner.query(`ALTER TABLE "file" ADD "dvasUpdatedAt" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "regular_file" DROP COLUMN "dvasUpdatedAt"`);
    await queryRunner.query(`ALTER TABLE "regular_file" ADD "dvasUpdatedAt" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "model_file" DROP COLUMN "dvasUpdatedAt"`);
    await queryRunner.query(`ALTER TABLE "model_file" ADD "dvasUpdatedAt" TIMESTAMP`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "model_file" DROP COLUMN "dvasUpdatedAt"`);
    await queryRunner.query(`ALTER TABLE "model_file" ADD "dvasUpdatedAt" TIMESTAMP WITH TIME ZONE`);
    await queryRunner.query(`ALTER TABLE "regular_file" DROP COLUMN "dvasUpdatedAt"`);
    await queryRunner.query(`ALTER TABLE "regular_file" ADD "dvasUpdatedAt" TIMESTAMP WITH TIME ZONE`);
    await queryRunner.query(`ALTER TABLE "file" DROP COLUMN "dvasUpdatedAt"`);
    await queryRunner.query(`ALTER TABLE "file" ADD "dvasUpdatedAt" TIMESTAMP WITH TIME ZONE`);
  }
}
