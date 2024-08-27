import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBatchIdToTask1724763375922 implements MigrationInterface {
  name = "AddBatchIdToTask1724763375922";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "task" ADD "batchId" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "task" DROP COLUMN "batchId"`);
  }
}
