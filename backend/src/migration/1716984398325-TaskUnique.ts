import { MigrationInterface, QueryRunner } from "typeorm";

export class TaskUnique1716984398325 implements MigrationInterface {
  name = "TaskUnique1716984398325";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "task" ADD CONSTRAINT "UQ_26f9b0a2a92830a8706c5817204" UNIQUE NULLS NOT DISTINCT ("type", "siteId", "measurementDate", "productId", "instrumentInfoUuid", "modelId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "task" DROP CONSTRAINT "UQ_26f9b0a2a92830a8706c5817204"`);
  }
}
