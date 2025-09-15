import { MigrationInterface, QueryRunner } from "typeorm";

export class AddQueueIdToTask1757925139574 implements MigrationInterface {
  name = "AddQueueIdToTask1757925139574";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "task" ADD "queueId" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "task" DROP COLUMN "queueId"`);
  }
}
