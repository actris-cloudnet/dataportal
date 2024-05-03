import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveOldTaskTables1716982315305 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("model_task");
    await queryRunner.dropTable("upload_task");
    await queryRunner.dropTable("product_task");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
