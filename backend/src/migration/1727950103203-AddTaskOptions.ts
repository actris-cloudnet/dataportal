import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTaskOptions1727950103203 implements MigrationInterface {
  name = "AddTaskOptions1727950103203";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "task" DROP CONSTRAINT "UQ_26f9b0a2a92830a8706c5817204"`);
    await queryRunner.query(`ALTER TABLE "task" ADD "options" jsonb`);
    await queryRunner.query(
      `ALTER TABLE "task" ADD CONSTRAINT "UQ_ad0af11c960ed4273cec74078c0" UNIQUE NULLS NOT DISTINCT ("type", "siteId", "measurementDate", "productId", "instrumentInfoUuid", "modelId", "options")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "task" DROP CONSTRAINT "UQ_ad0af11c960ed4273cec74078c0"`);
    await queryRunner.query(`ALTER TABLE "task" DROP COLUMN "options"`);
    await queryRunner.query(
      `ALTER TABLE "task" ADD CONSTRAINT "UQ_26f9b0a2a92830a8706c5817204" UNIQUE NULLS NOT DISTINCT ("type", "siteId", "measurementDate", "productId", "instrumentInfoUuid", "modelId")`,
    );
  }
}
